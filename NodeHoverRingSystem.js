import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

/**
 * NodeHoverRingSystem
 * Fragmented instanced hover ring with corruption tint and radar pulse.
 * Appears only while a node is hovered; fade in/out controlled internally.
 */
export class NodeHoverRingSystem {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.segmentCount = options.segmentCount ?? 10; // 8–12 recommended
    this.radiusMultiplier = options.radiusMultiplier ?? 1.3;
    this.thickness = options.thickness ?? 0.04;
    this.fadeDuration = options.fadeDuration ?? 0.15;
    this.globalRotationSpeed = options.globalRotationSpeed ?? 0.25; // rad/s
    this.jitterAmplitude = options.jitterAmplitude ?? 0.04;
    this.jitterSpeed = options.jitterSpeed ?? 1.2;
    this.flickerIntervalMin = options.flickerIntervalMin ?? 1.0;
    this.flickerIntervalMax = options.flickerIntervalMax ?? 2.0;
    this.pulseSpeed = options.pulseSpeed ?? 0.8; // rad/s around ring

    this.instances = new Map(); // node -> { mesh, state }
  }

  /**
   * Show ring for a hovered node.
   */
  show(node) {
    if (!node || !this.scene) return;
    if (this.instances.has(node)) {
      this.instances.get(node).state.targetVisibility = 1;
      return;
    }

    const shellSize = node.userData?.staticShellSize ?? 1.0;
    const radius = shellSize * this.radiusMultiplier;

    const geometry = new THREE.TorusGeometry(radius, this.thickness, 8, 48, Math.PI * 2 / this.segmentCount * 0.85);

    // Per-instance attributes
    const offsets = new Float32Array(this.segmentCount);
    const angles = new Float32Array(this.segmentCount);
    for (let i = 0; i < this.segmentCount; i++) {
      angles[i] = (Math.PI * 2 * i) / this.segmentCount;
      offsets[i] = Math.random() * Math.PI * 2;
    }
    geometry.setAttribute('aAngle', new THREE.InstancedBufferAttribute(angles, 1));
    geometry.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 1));

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uFade: { value: 0 },
        uBaseColor: { value: new THREE.Color(0x00e5ff) },   // cyan
        uAccentColor: { value: new THREE.Color(0x88ff00) }, // lime
        uCorruptColor: { value: new THREE.Color(0xaa33ff) },// magenta/purple
        uPulsePhase: { value: 0 },
        uFlickerIndex: { value: -1 },
        uFlickerStrength: { value: 0 },
      },
      vertexShader: `
        attribute float aAngle;
        attribute float aOffset;
        uniform float uTime;
        varying float vAngle;
        varying float vNoise;
        void main() {
          // Position instanced segment around ring angle
          vec3 pos = position;
          float angle = aAngle;
          float jitter = sin(uTime * ${1.2} + aOffset) * 0.02;
          mat4 rotY = mat4(
            cos(angle), 0.0, -sin(angle), 0.0,
            0.0,        1.0, 0.0,         0.0,
            sin(angle), 0.0, cos(angle),  0.0,
            0.0,        jitter, 0.0,      1.0
          );
          vec4 worldPos = modelMatrix * rotY * vec4(pos, 1.0);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
          vAngle = angle;
          vNoise = aOffset;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uFade;
        uniform vec3 uBaseColor;
        uniform vec3 uAccentColor;
        uniform vec3 uCorruptColor;
        uniform float uPulsePhase;
        uniform float uFlickerIndex;
        uniform float uFlickerStrength;
        varying float vAngle;
        varying float vNoise;

        // Simple 2D hash noise
        float hash12(vec2 p){
          vec3 p3  = fract(vec3(p.xyx) * 0.1031);
          p3 += dot(p3, p3.yzx + 33.33);
          return fract((p3.x + p3.y) * p3.z);
        }

        void main() {
          // Corruption tint
          float corruptMix = hash12(vec2(vAngle, vNoise + uTime * 0.2)) * 0.35;
          vec3 color = mix(uBaseColor, uCorruptColor, corruptMix);

          // Accent sweep (radar)
          float sweep = smoothstep(0.9, 1.0, cos(vAngle - uPulsePhase));
          color = mix(color, uAccentColor, sweep * 0.4);

          // Flicker (glitch)
          float flicker = 0.0;
          if (abs(vAngle - uFlickerIndex) < 0.01) {
            flicker = uFlickerStrength;
          }

          float alpha = 0.2 + sweep * 0.15 + flicker * 0.25;
          alpha *= uFade;

          gl_FragColor = vec4(color, alpha);
        }
      `
    });

    const instanced = new THREE.InstancedMesh(geometry, material, this.segmentCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < this.segmentCount; i++) {
      dummy.position.set(0, 0, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);
    }
    instanced.instanceMatrix.needsUpdate = true;
    instanced.renderOrder = VisualHierarchyRegistry.getRenderOrder('NODE_HOVER');
    instanced.userData = { auraLayer: 'AURA_HOVER' };

    this.scene.add(instanced);

    this.instances.set(node, {
      mesh: instanced,
      state: {
        fade: 0,
        targetVisibility: 1,
        time: 0,
        nextFlicker: this._nextFlickerTime(),
        flickerIdx: -1,
        flickerStrength: 0,
      }
    });
  }

  hide(node) {
    const entry = this.instances.get(node);
    if (!entry) return;
    entry.state.targetVisibility = 0;
  }

  update(deltaTime) {
    if (!this.scene) return;

    this.instances.forEach((entry, node) => {
      const { mesh, state } = entry;
      const mat = mesh.material;

      state.time += deltaTime;

      // Fade
      const fadeSpeed = 1 / this.fadeDuration;
      state.fade += (state.targetVisibility - state.fade) * fadeSpeed * deltaTime;
      state.fade = THREE.MathUtils.clamp(state.fade, 0, 1);
      mat.uniforms.uFade.value = state.fade;

      // Remove when faded out
      if (state.fade <= 0.001 && state.targetVisibility === 0) {
        this._disposeInstance(node);
        return;
      }

      // Global rotation
      mesh.rotation.y += this.globalRotationSpeed * deltaTime;

      // Flicker logic
      if (state.time >= state.nextFlicker) {
        state.flickerIdx = Math.floor(Math.random() * this.segmentCount);
        state.flickerStrength = 1.0;
        state.nextFlicker = state.time + this._nextFlickerTime();
      } else {
        state.flickerStrength = Math.max(0, state.flickerStrength - deltaTime * 4);
      }

      // Pulse sweep
      mat.uniforms.uPulsePhase.value = state.time * this.pulseSpeed;
      mat.uniforms.uFlickerIndex.value = (Math.PI * 2 * state.flickerIdx) / this.segmentCount;
      mat.uniforms.uFlickerStrength.value = state.flickerStrength;
      mat.uniforms.uTime.value = state.time;
    });
  }

  dispose() {
    Array.from(this.instances.keys()).forEach(node => this._disposeInstance(node));
    this.instances.clear();
  }

  _disposeInstance(node) {
    const entry = this.instances.get(node);
    if (!entry) return;
    if (entry.mesh) {
      this.scene.remove(entry.mesh);
      entry.mesh.geometry?.dispose();
      entry.mesh.material?.dispose();
    }
    this.instances.delete(node);
  }

  _nextFlickerTime() {
    return THREE.MathUtils.lerp(this.flickerIntervalMin, this.flickerIntervalMax, Math.random());
  }
}

/**
 * Integration snippet (example):
 *
 * const hoverRings = new NodeHoverRingSystem(scene);
 * // in pointer move / hover start:
 * hoverRings.show(node);
 * // on hover end:
 * hoverRings.hide(node);
 * // per-frame:
 * hoverRings.update(deltaTime);
 */
