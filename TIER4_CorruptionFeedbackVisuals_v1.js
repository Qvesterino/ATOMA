/**
 * TIER 4: CORRUPTION FEEDBACK VISUALS v1.0 (Session 40)
 * 
 * Visual feedback for player actions affecting corruption
 * 
 * Purpose: Display gameplay feedback when links are created/destroyed
 * - Corruption seed visualization on link creation
 * - Cascade warning indicators
 * - Harmony restoration VFX on link destruction
 * - Real-time corruption network health display
 * 
 * Pure rendering layer — reads gameplay state, writes to THREE.js scene
 */

import * as THREE from 'three';

const CORRUPTION_SEED_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying float vFractureNoise;

uniform float uTime;
uniform float uCorruption;

float hash13(vec3 p) {
  return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
}

void main() {
  vUv = uv;

  vec3 displaced = position;
  float corruption = clamp(uCorruption, 0.0, 1.0);
  float pulse = 0.92 + 0.08 * sin(uTime * 2.1 + position.y * 6.0);
  float scale = mix(1.0, 1.22 + 0.04 * sin(uTime * 3.2), corruption) * pulse;

  float waveA = sin(position.x * 7.0 + uTime * 1.6);
  float waveB = sin(position.y * 9.0 - uTime * 2.3);
  float waveC = sin(position.z * 8.0 + uTime * 1.9);
  float jitter = hash13(position * 4.0 + vec3(uTime * 0.35));
  float deform = (waveA * 0.45 + waveB * 0.35 + waveC * 0.2 + (jitter - 0.5) * 1.4);
  displaced += normal * deform * (0.03 + corruption * 0.12);
  displaced *= scale;

  vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
  vWorldPosition = worldPosition.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vFractureNoise = hash13(displaced * 6.0 + vec3(uTime * 0.4));

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const CORRUPTION_SEED_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uCorruption;
uniform vec3 uColorBase;
uniform vec3 uColorCorrupt;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying float vFractureNoise;

float random(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  float corruption = clamp(uCorruption, 0.0, 1.0);
  float fractureNoise = random(vUv * (10.0 + corruption * 6.0) + uTime * 0.45 + vFractureNoise * 2.0);
  float fractureBands = random(vUv.yx * (16.0 + corruption * 10.0) - uTime * 0.3);
  float fracture = fractureNoise * 0.68 + fractureBands * 0.32;
  float threshold = 0.18 + corruption * 0.68;

  if (step(fracture, threshold) > 0.5) discard;

  float edgeMask = smoothstep(threshold, threshold + 0.06, fracture);
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float fresnel = pow(1.0 - max(dot(normalize(vWorldNormal), viewDir), 0.0), 2.8);
  float pulse = 0.8 + 0.2 * sin(uTime * 3.6 + vUv.y * 14.0 + vUv.x * 9.0);
  float lava = smoothstep(0.58, 1.0, fracture) * (0.7 + 0.3 * pulse);

  vec3 coreColor = mix(uColorBase, vec3(0.07, 0.01, 0.0), 0.7);
  vec3 edgeColor = mix(uColorCorrupt, vec3(1.0, 0.34, 0.06), 0.45 + 0.35 * pulse);
  vec3 color = mix(coreColor, edgeColor, edgeMask);
  color += edgeColor * fresnel * (0.45 + corruption * 0.75);
  color += edgeColor * lava * 0.18;

  gl_FragColor = vec4(color, 1.0);
}
`;

function normalizeSeedMetric(value, fallback = 0.5) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return fallback;
  if (numericValue > 1) {
    return Math.max(0, Math.min(1, numericValue / 100));
  }
  return Math.max(0, Math.min(1, numericValue));
}

export class TIER4_CorruptionFeedbackVisuals {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.camera = config.camera ?? null;
    this.config = {
      enableDebug: config.enableDebug ?? false,
      
      // Link creation effects
      showCorruptionSeedPulse: config.showCorruptionSeedPulse ?? true,
      corruptionSeedColor: config.corruptionSeedColor ?? 0xff6600,
      corruptionSeedIntensity: config.corruptionSeedIntensity ?? 0.5,
      corruptionSeedDuration: config.corruptionSeedDuration ?? 0.5,
      corruptionSeedRotationSpeed: config.corruptionSeedRotationSpeed ?? 1.35,
      maxCorruptionSeeds: config.maxCorruptionSeeds ?? 50,
      corruptionSeedLodDistance: config.corruptionSeedLodDistance ?? 18,
      corruptionSeedCullDistance: config.corruptionSeedCullDistance ?? 30,
      
      // Cascade warning
      showCascadeWarning: config.showCascadeWarning ?? true,
      cascadeWarningColor: config.cascadeWarningColor ?? 0xff0000,
      cascadeWarningPulseSpeed: config.cascadeWarningPulseSpeed ?? 4.0,
      
      // Harmony restoration
      showHarmonyPulse: config.showHarmonyPulse ?? true,
      harmonyPulseColor: config.harmonyPulseColor ?? 0x00ffff,
      harmonyPulseDuration: config.harmonyPulseDuration ?? 0.8,
      harmonyPulseIntensityBoost: config.harmonyPulseIntensityBoost ?? 1.5,
      harmonyPulseScaleBoost: config.harmonyPulseScaleBoost ?? 1.2
    };
    
    // Active visual effects
    this.activeCorruptionSeeds = [];
    this.activeCascadeWarnings = [];
    this.harmonyFieldConsumer = config.harmonyFieldConsumer ?? null;
    
    // Material pool for reuse
    this.materialPool = {
      cascadeWarning: new THREE.MeshBasicMaterial({
        color: this.config.cascadeWarningColor,
        transparent: true,
        emissive: this.config.cascadeWarningColor,
        emissiveIntensity: 0.5
      })
    };
    
    // Geometry pool
    this.geometryPool = {
      sphere: new THREE.IcosahedronGeometry(0.3, 4),
      cascadeWarningRing: new THREE.TorusGeometry(0.5, 0.1, 16, 32)
    };
    
    // Statistics
    this.stats = {
      corruptionSeedsRendered: 0,
      cascadeWarningsRendered: 0,
      harmonyPulsesRendered: 0,
      totalEffectsActive: 0
    };
  }

  _readSeedCorruptionLevel(link) {
    const corruptionLevel = Number(link?.userData?.corruptionLevel);
    if (!Number.isFinite(corruptionLevel)) return 0;
    return Math.max(0, Math.min(1, corruptionLevel));
  }

  _createCorruptionSeedMaterial(corruptionLevel = 0) {
    return new THREE.ShaderMaterial({
      vertexShader: CORRUPTION_SEED_VERTEX_SHADER,
      fragmentShader: CORRUPTION_SEED_FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uCorruption: { value: corruptionLevel },
        uColorBase: { value: new THREE.Color(0x050505) },
        uColorCorrupt: { value: new THREE.Color(0xff5a1f) }
      },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      toneMapped: false
    });
  }

  _createSeedConnectionMaterial() {
    return new THREE.LineBasicMaterial({
      color: 0xff6a24,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      depthTest: true,
      toneMapped: false
    });
  }

  _createSeedSpriteMaterial() {
    return new THREE.SpriteMaterial({
      color: 0xff6a24,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      depthTest: true,
      toneMapped: false
    });
  }

  _buildCorruptionSeedStructure(corruptionLevel = 0) {
    const group = new THREE.Group();
    const fragmentRoot = new THREE.Group();
    group.add(fragmentRoot);
    const fragmentCount = 6 + Math.floor(Math.random() * 3);
    const fragments = [];
    const connections = [];

    for (let i = 0; i < fragmentCount; i++) {
      const material = this._createCorruptionSeedMaterial(corruptionLevel);
      const mesh = new THREE.Mesh(this.geometryPool.sphere, material);
      const baseScale = 0.2 + Math.random() * 0.2;
      const radius = 0.18 + Math.random() * 0.3;
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 2.0,
        (Math.random() - 0.5) * 2.0,
        (Math.random() - 0.5) * 2.0
      ).normalize().multiplyScalar(radius);
      const motionAxis = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();

      mesh.position.copy(offset);
      mesh.scale.setScalar(baseScale);
      fragmentRoot.add(mesh);

      fragments.push({
        mesh,
        baseOffset: offset.clone(),
        motionAxis,
        baseScale,
        phase: Math.random() * Math.PI * 2,
        speed: 0.9 + Math.random() * 1.8,
        amplitude: 0.015 + Math.random() * 0.035
      });
    }

    const connectedPairs = new Set();
    const addConnection = (a, b) => {
      if (a === b) return;
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      if (connectedPairs.has(key)) return;
      connectedPairs.add(key);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(6), 3));
      const line = new THREE.Line(geometry, this._createSeedConnectionMaterial());
      fragmentRoot.add(line);
      connections.push({ line, a, b });
    };

    for (let i = 0; i < fragmentCount; i++) {
      addConnection(i, (i + 1) % fragmentCount);
    }

    const extraConnections = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < extraConnections; i++) {
      addConnection(
        Math.floor(Math.random() * fragmentCount),
        Math.floor(Math.random() * fragmentCount)
      );
    }

    const lodSprite = new THREE.Sprite(this._createSeedSpriteMaterial());
    lodSprite.visible = false;
    lodSprite.scale.setScalar(0.5 + corruptionLevel * 0.35);
    group.add(lodSprite);

    return { group, fragmentRoot, fragments, connections, lodSprite };
  }

  _updateCorruptionSeedConnections(effect, corruptionLevel = 0) {
    for (const connection of effect.connections) {
      const fragmentA = effect.fragments[connection.a];
      const fragmentB = effect.fragments[connection.b];
      if (!fragmentA || !fragmentB) continue;

      const positions = connection.line.geometry.attributes.position.array;
      positions[0] = fragmentA.mesh.position.x;
      positions[1] = fragmentA.mesh.position.y;
      positions[2] = fragmentA.mesh.position.z;
      positions[3] = fragmentB.mesh.position.x;
      positions[4] = fragmentB.mesh.position.y;
      positions[5] = fragmentB.mesh.position.z;
      connection.line.geometry.attributes.position.needsUpdate = true;

      const pulse = 0.45 + 0.55 * Math.sin(effect.time * 2.7 + fragmentA.phase + fragmentB.phase);
      connection.line.material.opacity = (0.18 + corruptionLevel * 0.4) * pulse;
    }
  }

  _disposeCorruptionSeedEffect(effect) {
    if (!effect?.mesh) return;
    this.scene.remove(effect.mesh);

    effect.mesh.traverse((child) => {
      if (child.material?.dispose) child.material.dispose();
      if (child.geometry?.dispose && child.type === 'Line') child.geometry.dispose();
    });
  }

  setHarmonyFieldConsumer(harmonyFieldConsumer) {
    this.harmonyFieldConsumer = harmonyFieldConsumer ?? null;
  }

  _effectMatchesNode(effect, node) {
    if (!effect || !node) return false;
    const effectNode = effect.node;
    return effectNode === node || effectNode?.uuid === node?.uuid;
  }

  clearEffectsForNode(node) {
    if (!node) return 0;

    let cleared = 0;

    for (let i = this.activeCorruptionSeeds.length - 1; i >= 0; i--) {
      const effect = this.activeCorruptionSeeds[i];
      if (!this._effectMatchesNode(effect, node)) continue;
      this._disposeCorruptionSeedEffect(effect);
      this.activeCorruptionSeeds.splice(i, 1);
      cleared += 1;
    }

    for (let i = this.activeCascadeWarnings.length - 1; i >= 0; i--) {
      const effect = this.activeCascadeWarnings[i];
      if (!this._effectMatchesNode(effect, node)) continue;
      this.scene.remove(effect.mesh);
      effect.mesh.material.dispose();
      this.activeCascadeWarnings.splice(i, 1);
      cleared += 1;
    }

    return cleared;
  }

  clearEffectsForNodes(nodes = []) {
    let cleared = 0;
    for (const node of nodes) {
      cleared += this.clearEffectsForNode(node);
    }
    return cleared;
  }
  
  /**
   * Display corruption seed effect on link creation
   * Appears at source node, pulses with corruption color
   */
  displayCorruptionSeed(node, link = null) {
    if (!node || !this.config.showCorruptionSeedPulse) return;
    
    try {
      const corruptionLevel = this._readSeedCorruptionLevel(link);
      if (this.activeCorruptionSeeds.length >= this.config.maxCorruptionSeeds) {
        const oldest = this.activeCorruptionSeeds.shift();
        this._disposeCorruptionSeedEffect(oldest);
      }
      const structure = this._buildCorruptionSeedStructure(corruptionLevel);
      const mesh = structure.group;
      
      // Position at node
      mesh.position.copy(node.position);
      mesh.position.z += 0.5; // Offset above node
      
      // Start invisible, scale and fade in
      mesh.scale.set(0.1, 0.1, 0.1);
      mesh.userData.opacity = 0;
      
      this.scene.add(mesh);
      
      // Create animation data
      const effect = {
        mesh,
        type: 'corruptionSeed',
        node,
        link,
        fragmentRoot: structure.fragmentRoot,
        fragments: structure.fragments,
        connections: structure.connections,
        lodSprite: structure.lodSprite,
        startTime: Date.now(),
        time: 0,
        duration: this.config.corruptionSeedDuration * 1000, // Convert to ms
        startScale: new THREE.Vector3(0.1, 0.1, 0.1),
        endScale: new THREE.Vector3(0.8, 0.8, 0.8)
      };
      
      this.activeCorruptionSeeds.push(effect);
      this.stats.corruptionSeedsRendered++;
      
      if (this.config.enableDebug) {
        console.log('[TIER4_CorruptionFeedbackVisuals] Corruption seed displayed at node');
      }
      
    } catch (err) {
      console.warn('[TIER4_CorruptionFeedbackVisuals] displayCorruptionSeed error:', err);
    }
  }
  
  /**
   * Display cascade warning indicator
   * Pulsing red indicator around node showing cascade risk
   */
  displayCascadeWarning(node) {
    if (!node || !this.config.showCascadeWarning) return;
    
    try {
      const mesh = new THREE.Mesh(
        this.geometryPool.cascadeWarningRing,
        this.materialPool.cascadeWarning.clone()
      );
      
      // Position at node
      mesh.position.copy(node.position);
      mesh.scale.set(1.5, 1.5, 1.0);
      
      this.scene.add(mesh);
      
      // Create animation data
      const effect = {
        mesh,
        type: 'cascadeWarning',
        node,
        startTime: Date.now(),
        duration: 1000, // Stays visible for 1 second
        pulseSpeed: this.config.cascadeWarningPulseSpeed
      };
      
      this.activeCascadeWarnings.push(effect);
      this.stats.cascadeWarningsRendered++;
      
      if (this.config.enableDebug) {
        console.log('[TIER4_CorruptionFeedbackVisuals] Cascade warning displayed');
      }
      
    } catch (err) {
      console.warn('[TIER4_CorruptionFeedbackVisuals] displayCascadeWarning error:', err);
    }
  }
  
  /**
   * Display harmony restoration pulse
   * Cyan expanding wave emanating from node
   */
  displayHarmonyPulse(node) {
    if (!node || !this.config.showHarmonyPulse || !this.harmonyFieldConsumer?.flashHarmonyField) return;
    
    try {
      const flashed = this.harmonyFieldConsumer.flashHarmonyField(node, {
        duration: this.config.harmonyPulseDuration,
        intensityMultiplier: this.config.harmonyPulseIntensityBoost,
        scaleMultiplier: this.config.harmonyPulseScaleBoost
      });

      if (!flashed) return;

      this.stats.harmonyPulsesRendered++;
      
      if (this.config.enableDebug) {
        console.log('[TIER4_CorruptionFeedbackVisuals] Harmony field pulse flashed');
      }
      
    } catch (err) {
      console.warn('[TIER4_CorruptionFeedbackVisuals] displayHarmonyPulse error:', err);
    }
  }
  
  /**
   * Update all active visual effects
   * Call from main animation loop
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;

    const currentTime = Date.now();
    
    // Update corruption seeds
    for (let i = this.activeCorruptionSeeds.length - 1; i >= 0; i--) {
      const effect = this.activeCorruptionSeeds[i];
      const elapsed = currentTime - effect.startTime;
      const progress = Math.min(elapsed / effect.duration, 1.0);
      const corruptionLevel = this._readSeedCorruptionLevel(effect.link);
      effect.time += deltaTime;

      const distanceToCamera = this.camera?.position ? effect.mesh.position.distanceTo(this.camera.position) : 0;
      const isCulled = this.camera && distanceToCamera > this.config.corruptionSeedCullDistance;
      const useSpriteLod = this.camera &&
        distanceToCamera > this.config.corruptionSeedLodDistance &&
        distanceToCamera <= this.config.corruptionSeedCullDistance;

      if (isCulled) {
        effect.mesh.visible = false;
        continue;
      }
      effect.mesh.visible = true;
      effect.fragmentRoot.visible = !useSpriteLod;
      effect.lodSprite.visible = !!useSpriteLod;
      
      // Scale up
      const scale = effect.startScale.clone()
        .lerp(effect.endScale, progress);
      effect.mesh.scale.copy(scale);

      effect.mesh.rotation.x += deltaTime * this.config.corruptionSeedRotationSpeed;
      effect.mesh.rotation.y += deltaTime * (this.config.corruptionSeedRotationSpeed * 1.45);

      if (useSpriteLod) {
        const spriteScale = 0.32 + corruptionLevel * 0.28 + 0.05 * Math.sin(effect.time * 3.1);
        effect.lodSprite.scale.setScalar(spriteScale);
        effect.lodSprite.material.opacity = 0.35 + corruptionLevel * 0.45;
      } else {
        for (const fragment of effect.fragments) {
          const motion = Math.sin(effect.time * fragment.speed + fragment.phase) * fragment.amplitude;
          fragment.mesh.position.copy(fragment.baseOffset).addScaledVector(fragment.motionAxis, motion);

          const scalePulse = 1.0 + corruptionLevel * 0.35 * (0.5 + 0.5 * Math.sin(effect.time * 3.4 + fragment.phase));
          fragment.mesh.scale.setScalar(fragment.baseScale * scalePulse);

          fragment.mesh.material.uniforms.uTime.value += deltaTime;
          fragment.mesh.material.uniforms.uCorruption.value = corruptionLevel;
        }

        this._updateCorruptionSeedConnections(effect, corruptionLevel);
      }
      
      // Remove when done
      if (progress >= 1.0) {
        this._disposeCorruptionSeedEffect(effect);
        this.activeCorruptionSeeds.splice(i, 1);
      }
    }
    
    // Update cascade warnings
    for (let i = this.activeCascadeWarnings.length - 1; i >= 0; i--) {
      const effect = this.activeCascadeWarnings[i];
      const elapsed = currentTime - effect.startTime;
      const progress = Math.min(elapsed / effect.duration, 1.0);
      
      // Pulse effect
      const pulse = Math.sin(progress * Math.PI * effect.pulseSpeed) * 0.5 + 0.5;
      effect.mesh.material.opacity = pulse;
      effect.mesh.material.emissiveIntensity = pulse;
      
      // Remove when done
      if (progress >= 1.0) {
        this.scene.remove(effect.mesh);
        this.activeCascadeWarnings.splice(i, 1);
      }
    }
    
    // Update stats
    this.stats.totalEffectsActive = 
      this.activeCorruptionSeeds.length + 
      this.activeCascadeWarnings.length;
  }
  
  /**
   * Get performance statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeEffects: this.stats.totalEffectsActive
    };
  }
  
  /**
   * Clear all active effects (for scene reset)
   */
  clear() {
    // Remove corruption seeds
    for (const effect of this.activeCorruptionSeeds) {
      this._disposeCorruptionSeedEffect(effect);
    }
    this.activeCorruptionSeeds = [];
    
    // Remove cascade warnings
    for (const effect of this.activeCascadeWarnings) {
      this.scene.remove(effect.mesh);
    }
    this.activeCascadeWarnings = [];
    
    this.stats.totalEffectsActive = 0;
  }
  
  /**
   * Dispose resources
   */
  dispose() {
    this.clear();
    
    // Dispose materials
    this.materialPool.cascadeWarning.dispose();
    
    // Dispose geometries
    this.geometryPool.sphere.dispose();
    this.geometryPool.cascadeWarningRing.dispose();
  }
}

export default TIER4_CorruptionFeedbackVisuals;
