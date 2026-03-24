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
uniform float uTime;
uniform float uIntensity;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vLocalPosition;

void main() {
  vec3 displacedPosition = position;
  float waveA = sin(uTime * 4.6 + position.y * 8.0 + position.x * 5.5);
  float waveB = sin(uTime * 7.8 + position.z * 10.0 - position.y * 6.5);
  float deformation = (waveA * 0.55 + waveB * 0.45) * mix(0.05, 0.12, clamp(uIntensity, 0.0, 1.0));
  displacedPosition += normal * deformation;

  vec4 worldPosition = modelMatrix * vec4(displacedPosition, 1.0);
  vWorldPosition = worldPosition.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vLocalPosition = displacedPosition;

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const CORRUPTION_SEED_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uIntensity;
uniform vec3 uBaseColor;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vLocalPosition;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float fresnel = pow(1.0 - abs(dot(normalize(vWorldNormal), viewDir)), 2.4);

  float pulse = 0.72 + 0.28 * sin(uTime * 5.2 + length(vLocalPosition) * 11.0);
  float flickerA = sin(uTime * 18.0 + vLocalPosition.x * 20.0 + vLocalPosition.y * 14.0);
  float flickerB = sin(uTime * 27.0 - vLocalPosition.z * 18.0 + vLocalPosition.x * 9.0);
  float flicker = 0.5 + 0.5 * (flickerA * 0.55 + flickerB * 0.45);

  float radius = length(vLocalPosition);
  float coreGlow = 1.0 - smoothstep(0.10, 0.62, radius);
  float edgeLeak = fresnel * (0.55 + flicker * 0.45);

  vec3 chaosShift = vec3(0.62, 0.10, 0.78);
  vec3 hotColor = mix(uBaseColor, vec3(1.0, 0.26, 0.08), 0.35 + 0.25 * pulse);
  vec3 chaosColor = mix(hotColor, chaosShift, fresnel * 0.45 + flicker * 0.15);

  float brightness = (coreGlow * 1.2 + edgeLeak * 0.95 + flicker * 0.25) * mix(0.6, 1.2, clamp(uIntensity, 0.0, 1.0));
  vec3 color = chaosColor * brightness;

  float baseOpacity = mix(0.32, 0.92, clamp(uIntensity, 0.0, 1.0));
  float opacity = baseOpacity * (0.7 + 0.3 * flicker) * (0.82 + 0.18 * pulse);

  gl_FragColor = vec4(color, opacity);
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
    this.config = {
      enableDebug: config.enableDebug ?? false,
      
      // Link creation effects
      showCorruptionSeedPulse: config.showCorruptionSeedPulse ?? true,
      corruptionSeedColor: config.corruptionSeedColor ?? 0xff6600,
      corruptionSeedIntensity: config.corruptionSeedIntensity ?? 0.5,
      corruptionSeedDuration: config.corruptionSeedDuration ?? 0.5,
      corruptionSeedRotationSpeed: config.corruptionSeedRotationSpeed ?? 1.35,
      
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

  _createCorruptionSeedMaterial(baseIntensity) {
    return new THREE.ShaderMaterial({
      vertexShader: CORRUPTION_SEED_VERTEX_SHADER,
      fragmentShader: CORRUPTION_SEED_FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: baseIntensity },
        uBaseColor: { value: new THREE.Color(this.config.corruptionSeedColor) }
      },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      toneMapped: false
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
      this.scene.remove(effect.mesh);
      effect.mesh.material.dispose();
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
  displayCorruptionSeed(node) {
    if (!node || !this.config.showCorruptionSeedPulse) return;
    
    try {
      const corruptionLevel = normalizeSeedMetric(
        node.userData?.metrics?.corruption ?? node.userData?.corruptionLevel ?? node.userData?.corruption,
        this.config.corruptionSeedIntensity
      );
      const seedIntensity = Math.max(0.5, corruptionLevel);
      const mesh = new THREE.Mesh(
        this.geometryPool.sphere,
        this._createCorruptionSeedMaterial(seedIntensity)
      );
      
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
        startTime: Date.now(),
        duration: this.config.corruptionSeedDuration * 1000, // Convert to ms
        seedIntensity,
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
      const shaderTime = elapsed / 1000;
      
      // Scale up
      const scale = effect.startScale.clone()
        .lerp(effect.endScale, progress);
      effect.mesh.scale.copy(scale);

      effect.mesh.rotation.x += deltaTime * this.config.corruptionSeedRotationSpeed;
      effect.mesh.rotation.y += deltaTime * (this.config.corruptionSeedRotationSpeed * 1.45);

      const fadeBase = Math.pow(Math.max(0, 1.0 - progress), 0.7);
      const flicker = 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(shaderTime * 19.0 + progress * 13.0));
      const animatedIntensity = Math.max(0, effect.seedIntensity * fadeBase * flicker);
      effect.mesh.material.uniforms.uTime.value = shaderTime;
      effect.mesh.material.uniforms.uIntensity.value = animatedIntensity;
      
      // Remove when done
      if (progress >= 1.0) {
        this.scene.remove(effect.mesh);
        effect.mesh.material.dispose();
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
      this.scene.remove(effect.mesh);
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
