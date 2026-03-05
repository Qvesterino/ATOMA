import * as THREE from 'three';
import { VisualHierarchyRegistry } from '../../VisualHierarchyRegistry.js';

export class SelectedRingSystem {
  constructor(scene, frameScheduler = null, hierarchy = VisualHierarchyRegistry) {
    this.scene = scene;
    this.frameScheduler = frameScheduler;
    this.hierarchy = hierarchy;
    this.group = new THREE.Group();
    this.group.visible = false;
    this.selectedNode = null;
    this.time = 0;
    this.clickPulse = 0;
    this.scanPhase = 0;

    this._buildMeshes();
    if (this.scene) this.scene.add(this.group);

    if (this.frameScheduler?.register) {
      this.frameScheduler.register('visual', () => this.update(this.frameScheduler.deltaTime || 0.033));
    }
  }

  _buildMeshes() {
    const baseOrder = this.hierarchy.getRenderOrder('SELECTED');

    // Base ring
    const baseGeom = new THREE.TorusGeometry(1.2, 0.04, 24, 128);
    const baseMat = this._createRingMaterial();
    const baseMesh = new THREE.Mesh(baseGeom, baseMat);
    baseMesh.renderOrder = baseOrder;
    this.baseMesh = baseMesh;
    this.group.add(baseMesh);

    // Orbit segments
    const orbitGeom = new THREE.TorusGeometry(1.2, 0.02, 16, 96, Math.PI * 0.7);
    const orbitMat = this._createRingMaterial({ accentBoost: 0.4 });
    this.orbitA = new THREE.Mesh(orbitGeom, orbitMat.clone());
    this.orbitB = new THREE.Mesh(orbitGeom, orbitMat.clone());
    this.orbitA.rotation.z = Math.PI * 0.25;
    this.orbitB.rotation.z = -Math.PI * 0.35;
    this.orbitA.renderOrder = baseOrder + 1;
    this.orbitB.renderOrder = baseOrder + 1;
    this.group.add(this.orbitA);
    this.group.add(this.orbitB);

    // Scan ring
    const scanGeom = new THREE.RingGeometry(1.05, 1.08, 64);
    const scanMat = this._createScanMaterial();
    this.scanMesh = new THREE.Mesh(scanGeom, scanMat);
    this.scanMesh.renderOrder = baseOrder + 2;
    this.group.add(this.scanMesh);
  }

  _createRingMaterial(opts = {}) {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthTest: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPulse: { value: 0 },
        uClick: { value: 0 },
        uColor: { value: new THREE.Color(0x00d5ff) },
        uAccent: { value: new THREE.Color(0xff33ff) },
        uAccentBoost: { value: opts.accentBoost ?? 0.25 },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uPulse;
        uniform float uClick;
        varying float vEdge;
        void main() {
          vec3 p = position;
          float inflate = 1.0 + uClick * 0.12 + uPulse * 0.04;

          // Fractal orbit deformation
          float angle = atan(p.y, p.x);
          float radius = length(p.xy);
          float fractal = sin(angle * 6.0 + uTime * 1.4) * 0.05 +
                          sin(angle * 11.0 - uTime * 0.9) * 0.03;
          radius += fractal;
          vec2 dir = normalize(p.xy);
          p.xy = dir * radius;

          p *= inflate;
          vEdge = abs(normalize(p).z);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uPulse;
        uniform float uClick;
        uniform vec3 uColor;
        uniform vec3 uAccent;
        uniform float uAccentBoost;
        varying float vEdge;
        void main() {
          float fres = pow(1.0 - vEdge, 2.0);
          float pulse = sin(uTime * 2.5) * 0.5 + 0.5;
          vec3 color = mix(uColor, uAccent, fres * uAccentBoost + uClick * 0.5);
          float alpha = 0.2 + pulse * 0.15 + uClick * 0.3;
          gl_FragColor = vec4(color, alpha);
        }
      `
    });
  }

  _createScanMaterial() {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthTest: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uScan: { value: 0 },
        uColor: { value: new THREE.Color(0x00f2ff) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uScan;
        uniform vec3 uColor;
        varying vec2 vUv;
        void main() {
          float theta = atan(vUv.y - 0.5, vUv.x - 0.5);
          float sweep = smoothstep(uScan - 0.2, uScan, (theta + 3.14159) / 6.28318);
          float alpha = sweep * 0.4;
          gl_FragColor = vec4(uColor, alpha);
        }
      `
    });
  }

  setSelectedNode(nodeOrNull) {
    this.selectedNode = nodeOrNull;
    if (!nodeOrNull) {
      this.group.visible = false;
      this.clickPulse = 0;
      return;
    }
    this.group.visible = true;
    this.group.position.copy(nodeOrNull.position);
    this.group.scale.copy(nodeOrNull.scale);
  }

  onNodeClicked(node) {
    if (!node || node !== this.selectedNode) return;
    this.clickPulse = 1.0;
    this.scanPhase = 0;
  }

  update(dt = 0.033) {
    if (!this.group.visible || !this.selectedNode) return;
    this.time += dt;
    this.group.position.copy(this.selectedNode.position);
    this.group.scale.copy(this.selectedNode.scale);

    // Animate materials
    this.baseMesh.material.uniforms.uTime.value = this.time;
    this.orbitA.material.uniforms.uTime.value = this.time;
    this.orbitB.material.uniforms.uTime.value = this.time;

    // Rotation + breathing
    this.baseMesh.rotation.z += 0.4 * dt;
    this.orbitA.rotation.z += 0.6 * dt;
    this.orbitB.rotation.z -= 0.5 * dt;

    // Pulse
    const pulse = (Math.sin(this.time * 2.0) + 1.0) * 0.5;
    this.baseMesh.material.uniforms.uPulse.value = pulse;
    this.orbitA.material.uniforms.uPulse.value = pulse;
    this.orbitB.material.uniforms.uPulse.value = pulse;

    // Click impulse decay
    if (this.clickPulse > 0) {
      this.clickPulse = Math.max(0, this.clickPulse - dt * 2.5);
    }
    this.baseMesh.material.uniforms.uClick.value = this.clickPulse;
    this.orbitA.material.uniforms.uClick.value = this.clickPulse;
    this.orbitB.material.uniforms.uClick.value = this.clickPulse;

    // Scan sweep
    this.scanPhase += dt * 0.8;
    if (this.scanPhase > 1.0) this.scanPhase -= 1.0;
    this.scanMesh.material.uniforms.uScan.value = this.scanPhase;
  }

  dispose() {
    if (this.scene) this.scene.remove(this.group);
    [this.baseMesh, this.orbitA, this.orbitB, this.scanMesh].forEach((m) => {
      m?.geometry?.dispose();
      m?.material?.dispose();
    });
    this.group.clear();
    this.selectedNode = null;
  }
}
