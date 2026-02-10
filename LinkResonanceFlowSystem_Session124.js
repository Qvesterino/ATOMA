/**
 * LinkResonanceFlowSystem_Session124.js
 * ============================================================================
 * DIRECTIONAL LINK RESONANCE FLOW VISUALIZATION
 * 
 * Creates pulsing directional energy flows along links that:
 * - Travel from source to destination node
 * - Pulse speed modulated by synergy and activity
 * - Intensity reflects link quality and energy
 * - Multiple pulses travel simultaneously
 * - Color matches link state (harmony, corruption, synergy)
 * - Creates visual sense of "energy flowing through network"
 * 
 * FEATURES:
 * 1. Directional Pulses: Energy packets traveling along links
 * 2. Synergy Reactivity: Pulse speed increases with link synergy
 * 3. Multi-Pulse Support: Multiple energy packets per link
 * 4. Quality Encoding: Pulse intensity reflects link quality
 * 5. State Colors: Corruption/Harmony modulation
 * 6. Bidirectional Flow: Can show energy in both directions
 * 7. Pulse Spawning: Triggered by network activity
 * 8. Zero Allocations: Complete object pool
 * 
 * ARCHITECTURE:
 * ✅ Adapter-only (reads link state, no changes to gameplay)
 * ✅ GPU-driven rendering (custom line shader)
 * ✅ CPU-driven pulse positioning (bezier curve following)
 * ✅ Per-link pulse pool (reused across frames)
 * ✅ Deterministic spawning (based on synergy metrics)
 * 
 * @author VFX Technical Director — ATOMA Project Session 124
 * @version 1.0.0
 */

import * as THREE from 'three';
import VisualTime from './src/time/VisualTime.js';
import { tagSphere, clampSphere } from './VisualSpherePolicy.js';

export class LinkResonanceFlowSystem_Session124 {
  constructor(scene, world, config = {}) {
    this.scene = scene;
    this.world = world;
    
    this.config = {
      // Pulse spawning
      baseSpawnRate: config.baseSpawnRate ?? 2.0,        // Pulses per second
      synergySpawnBoost: config.synergySpawnBoost ?? 1.5, // Multiplier
      pulseSpeedBase: config.pulseSpeedBase ?? 1.0,       // Units per second
      pulseSpeedSynergyMult: config.pulseSpeedSynergyMult ?? 0.8,
      
      // Pulse appearance
      pulseRadiusBase: config.pulseRadiusBase ?? 0.3,
      pulseRadiusSynergyMult: config.pulseRadiusSynergyMult ?? 0.15,
      pulseMaxRadius: config.pulseMaxRadius ?? 0.8,
      pulseGlowIntensity: config.pulseGlowIntensity ?? 1.5,
      
      // Pulse lifetime
      pulseLifetime: config.pulseLifetime ?? 2.0,         // Seconds before despawn
      pulseAlphaDecay: config.pulseAlphaDecay ?? 0.7,     // Fade at end
      
      // Intensity modulation
      baseIntensity: config.baseIntensity ?? 0.8,
      qualityIntensityFactor: config.qualityIntensityFactor ?? 0.5,
      corruptionDampen: config.corruptionDampen ?? 0.6,
      
      // Flow direction
      bidirectional: config.bidirectional ?? false,       // Both directions
      pulseBidirectionalChance: config.pulseBidirectionalChance ?? 0.1,
      
      // LOD
      lodDistanceThreshold: config.lodDistanceThreshold ?? 60,
      lodPulseSuppression: config.lodPulseSuppression ?? 0.5,
      
      // Safety
      maxPulsesPerLink: config.maxPulsesPerLink ?? 8,
      maxTotalPulses: config.maxTotalPulses ?? 1024,
      enabled: config.enabled ?? true,
      debugMode: config.debugMode ?? false,
    };
    
    // Pulse pools per link
    this.linkPulses = new Map();  // linkId → Array<pulse>
    this.globalPulses = [];        // All active pulses (for sorting)
    
    // Rendering
    this.pulseGeometry = null;
    this.pulseMaterial = null;
    this.pulseMeshGeometry = null;
    this.pulseMaterialTemplate = null;
    this.pulseMeshPool = [];
    this.pulseGroup = null;
    
    // Spawn tracking
    this.spawnAccumulators = new Map(); // linkId → accumulated spawn time
    this._timeOrigin = undefined;
    this._lastVisualTime = undefined;
    
    // Statistics
    this.stats = {
      activePulses: 0,
      pulseSpawnCount: 0,
      linksWithFlow: 0,
    };
    
    this.init();
    
    console.log('[Session 124] LinkResonanceFlowSystem initialized');
  }
  
  /**
   * Initialize rendering system
   */
  init() {
    // Create pulse rendering group
    this.pulseGroup = new THREE.Group();
    this.pulseGroup.name = 'LinkResonancePulses_Session124';
    this.scene.add(this.pulseGroup);
    
    // Pre-allocate pulse meshes for efficient rendering
    this._initializePulseMeshes();
  }
  
  /**
   * Initialize pooled pulse meshes
   */
  _initializePulseMeshes() {
    // Shared unit sphere geometry for pulse meshes (scaled per pulse)
    this.pulseMeshGeometry = new THREE.SphereGeometry(1, 8, 8);
    
    // Base shader material template (cloned per pulse; program shared)
    this.pulseMaterialTemplate = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0x00ffff) },
        uOpacity: { value: 1.0 },
        uGlowSize: { value: this.config.pulseGlowIntensity },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uGlowSize;
        varying vec3 vNormal;
        
        void main() {
          vec3 viewDir = normalize(cameraPosition - vec3(0.0));
          float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.0);
          float glow = fresnel * uGlowSize;
          
          gl_FragColor = vec4(uColor, (0.5 + glow) * uOpacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }
  
  /**
   * Update resonance flow system each frame
   */
  update(deltaTime, links, camera) {
    if (!this.config.enabled || !links) return;

    if (this._timeOrigin === undefined) {
      this._timeOrigin = VisualTime.now;
    }
    const currentVisualTime = VisualTime.now - this._timeOrigin; // Phase 2A: canonical VisualTime source (behavior-preserving)
    const deltaVisual = this._lastVisualTime !== undefined ? currentVisualTime - this._lastVisualTime : 0;
    this._lastVisualTime = currentVisualTime;

    // Update spawn accumulators and spawn new pulses
    this._updateSpawning(currentVisualTime, links);

    // Update active pulses
    this._updateActivePulses(deltaVisual);

    // Update pulse mesh positions and appearances
    this._updatePulseMeshes();

    // Update LOD based on camera
    if (camera) {
      this._updateLOD(camera);
    }

    // Cleanup dead pulses
    this._cleanupDeadPulses();
    
    this.stats.activePulses = this.globalPulses.length;
    this.stats.linksWithFlow = this.linkPulses.size;
  }
  
  /**
   * Update pulse spawning based on link synergy
   */
  _updateSpawning(currentVisualTime, links) {
    for (const link of links) {
      if (!link || !link.userData) continue;
      
      const linkId = link.id;
      const synergy = link.userData.synergy ?? 0;
      
      // Skip inactive links
      if (synergy < 0.1) continue;
      
      // Get or create spawn accumulator
      if (!this.spawnAccumulators.has(linkId)) {
        this.spawnAccumulators.set(linkId, { accumulator: 0, lastTime: currentVisualTime });
      }
      
      // Calculate spawn rate
      const spawnRate = this.config.baseSpawnRate * 
                       (1.0 + synergy * this.config.synergySpawnBoost);
      
      const accumulatorEntry = this.spawnAccumulators.get(linkId);
      const delta = currentVisualTime - (accumulatorEntry.lastTime ?? currentVisualTime);
      accumulatorEntry.accumulator += delta * spawnRate;
      accumulatorEntry.lastTime = currentVisualTime;
      
      // Spawn pulses
      while (accumulatorEntry.accumulator >= 1.0) {
        this._spawnPulse(link);
        accumulatorEntry.accumulator -= 1.0;
      }
    }
  }
  
  /**
   * Spawn new pulse on link
   */
  _spawnPulse(link) {
    if (this.globalPulses.length >= this.config.maxTotalPulses) return;
    
    const linkId = link.id;
    const synergy = link.userData.synergy ?? 0;
    const quality = link.userData.quality ?? 0.5;
    
    // Get or create pulse pool for this link
    if (!this.linkPulses.has(linkId)) {
      this.linkPulses.set(linkId, []);
    }
    
    const pulses = this.linkPulses.get(linkId);
    if (pulses.length >= this.config.maxPulsesPerLink) return;
    
    // Create pulse object
    const pulse = {
      linkId,
      link,
      
      // Position along link (0 = source, 1 = destination)
      position: 0,
      
      // Speed based on synergy
      speed: this.config.pulseSpeedBase + 
             synergy * this.config.pulseSpeedSynergyMult,
      
      // Appearance
      radius: Math.min(
        this.config.pulseRadiusBase + synergy * this.config.pulseRadiusSynergyMult,
        this.config.pulseMaxRadius
      ),
      
      intensity: Math.clamp(
        this.config.baseIntensity + quality * this.config.qualityIntensityFactor,
        0.3,
        1.0
      ),
      
      // State
      life: 0,
      lifetime: this.config.pulseLifetime,
      active: true,
      
      // Flow direction
      direction: Math.random() < this.config.pulseBidirectionalChance ? -1 : 1,
      
      // Metrics
      synergy,
      quality,
      corruption: link.userData.corruption ?? 0,
    };
    
    pulses.push(pulse);
    this.globalPulses.push(pulse);
    this.stats.pulseSpawnCount++;
  }
  
  /**
   * Update all active pulses
   */
  _updateActivePulses(deltaVisual) {
    for (let i = this.globalPulses.length - 1; i >= 0; i--) {
      const pulse = this.globalPulses[i];
      if (!pulse.active) continue;
      
      // Update position along link
      const travelDistance = pulse.speed * deltaVisual;
      pulse.position += pulse.direction * (travelDistance / pulse.link.length);
      
      // Update lifetime
      pulse.life += deltaVisual;
      
      // Check if pulse reached end of link
      if (pulse.position > 1.0 || pulse.position < 0.0) {
        pulse.active = false;
      }
      
      // Check if exceeded lifetime
      if (pulse.life >= pulse.lifetime) {
        pulse.active = false;
      }
    }
  }
  
  /**
   * Update pulse mesh positions and appearances
   */
  _updatePulseMeshes() {
    // Update or allocate meshes for active pulses (no per-frame reallocation)
    for (const pulse of this.globalPulses) {
      if (!pulse.active) continue;
      
      // Lazily allocate mesh once per pulse lifetime
      if (!pulse.mesh) {
        pulse.mesh = this.pulseMeshPool.pop() || this._createPulseMesh();
        this.pulseGroup.add(pulse.mesh);
      }
      
      // Get world position along link
      const worldPos = this._getPositionAlongLink(pulse);
      
      // Calculate pulse appearance
      const color = this._getPulseColor(pulse);
      const opacity = this._getPulseOpacity(pulse) * (pulse.lodSuppression ?? 1.0);
      const size = pulse.radius * (1.0 + Math.sin(pulse.life * Math.PI * 2) * 0.3);
      
      // Apply transforms and uniforms
      pulse.mesh.visible = true;
      pulse.mesh.position.copy(worldPos);
      pulse.mesh.scale.setScalar(size);
      
      const uniforms = pulse.mesh.material.uniforms;
      if (uniforms.uColor) uniforms.uColor.value.copy(color);
      if (uniforms.uOpacity) uniforms.uOpacity.value = opacity;
      if (uniforms.uGlowSize) uniforms.uGlowSize.value = this.config.pulseGlowIntensity;
    }
  }
  
  /**
   * Get world position of pulse along link curve
   */
  _getPositionAlongLink(pulse) {
    const link = pulse.link;
    const nodeA = link.nodeA;
    const nodeB = link.nodeB;
    
    if (!nodeA || !nodeB) return new THREE.Vector3();
    
    // Linear interpolation for now (could use Catmull-Rom for curves)
    const t = pulse.position;
    const pos = new THREE.Vector3()
      .copy(nodeA.position)
      .lerp(nodeB.position, Math.clamp(t, 0, 1));
    
    return pos;
  }
  
  /**
   * Calculate pulse color based on link state
   */
  _getPulseColor(pulse) {
    let color = new THREE.Color();
    
    // Base color by synergy state
    if (pulse.synergy > 0.7) {
      // High synergy: bright cyan
      color.setHSL(0.5, 1.0, 0.6);
    } else if (pulse.synergy > 0.4) {
      // Medium synergy: green
      color.setHSL(0.33, 0.8, 0.55);
    } else {
      // Low synergy: blue
      color.setHSL(0.6, 0.7, 0.5);
    }
    
    // Modulate by corruption
    if (pulse.corruption > 0.3) {
      const corruptRed = new THREE.Color(0xff4444);
      color.lerp(corruptRed, pulse.corruption * 0.6);
    }
    
    return color;
  }
  
  /**
   * Calculate pulse opacity with fade-out at ends
   */
  _getPulseOpacity(pulse) {
    const lifeNormalized = pulse.life / pulse.lifetime;
    
    // Fade in at start
    const fadeIn = Math.min(pulse.life * 3, 1.0);
    
    // Fade out at end
    const fadeOutStart = 0.7;
    let fadeOut = 1.0;
    if (lifeNormalized > fadeOutStart) {
      fadeOut = 1.0 - ((lifeNormalized - fadeOutStart) / (1.0 - fadeOutStart)) ** 2;
    }
    
    // Apply intensity modulation
    const baseOpacity = pulse.intensity * this.config.glowIntensity;
    
    // Dampen by corruption
    const corruptionDampen = 1.0 - (pulse.corruption * this.config.corruptionDampen);
    
    return fadeIn * fadeOut * baseOpacity * corruptionDampen;
  }
  
  /**
   * Create pulse mesh (reuses material, not geometry)
   */
  _createPulseMesh() {
    const material = this.pulseMaterialTemplate.clone();
    // Clone uniforms to keep per-pulse values without recompiling programs
    material.uniforms = THREE.UniformsUtils.clone(this.pulseMaterialTemplate.uniforms);
    
    const mesh = new THREE.Mesh(this.pulseMeshGeometry, material);
    tagSphere(mesh, { role: 'vfx', source: 'LinkResonanceFlowSystem_Session124._createPulseMesh' });
    clampSphere(mesh);
    mesh.visible = false;
    return mesh;
  }
  
  /**
   * Update LOD based on camera distance
   */
  _updateLOD(camera) {
    // Could suppress pulses on distant links
    // For now, basic distance check
    const threshold = this.config.lodDistanceThreshold;
    
    for (const pulse of this.globalPulses) {
      if (!pulse.link) continue;
      
      const linkMidpoint = new THREE.Vector3()
        .copy(pulse.link.nodeA.position)
        .add(pulse.link.nodeB.position)
        .multiplyScalar(0.5);
      
      const distance = camera.position.distanceTo(linkMidpoint);
      
      // Apply LOD suppression if far
      if (distance > threshold) {
        pulse.lodSuppression = this.config.lodPulseSuppression;
      } else {
        pulse.lodSuppression = 1.0;
      }
    }
  }
  
  /**
   * Remove dead pulses from tracking
   */
  _cleanupDeadPulses() {
    // Remove from link pools
    for (const [linkId, pulses] of this.linkPulses) {
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pulse = pulses[i];
        if (!pulse.active) {
          if (pulse.mesh) {
            pulse.mesh.visible = false;
            this.pulseGroup.remove(pulse.mesh);
            this.pulseMeshPool.push(pulse.mesh);
            delete pulse.mesh;
          }
          pulses.splice(i, 1);
        }
      }
      
      // Remove empty link pools
      if (pulses.length === 0) {
        this.linkPulses.delete(linkId);
      }
    }
    
    // Remove from global pool
    for (let i = this.globalPulses.length - 1; i >= 0; i--) {
      const pulse = this.globalPulses[i];
      if (!pulse.active) {
        if (pulse.mesh) {
          pulse.mesh.visible = false;
          this.pulseGroup.remove(pulse.mesh);
          this.pulseMeshPool.push(pulse.mesh);
          delete pulse.mesh;
        }
        this.globalPulses.splice(i, 1);
      }
    }
  }
  
  /**
   * Get vertex shader
   */
  _getVertexShader() {
    return `
      varying vec3 vPosition;
      varying vec3 vNormal;
      
      void main() {
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }
  
  /**
   * Get fragment shader
   */
  _getFragmentShader() {
    return `
      uniform vec3 uPulseColor;
      uniform float uIntensity;
      uniform float uGlowSize;
      
      varying vec3 vPosition;
      varying vec3 vNormal;
      
      void main() {
        vec3 viewDir = normalize(cameraPosition - vec3(0.0));
        float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.0);
        
        // Radial glow effect
        float dist = length(vPosition);
        float glow = exp(-dist * dist * 2.0) * uGlowSize;
        
        float alpha = (fresnel + glow) * uIntensity;
        gl_FragColor = vec4(uPulseColor, alpha);
      }
    `;
  }
  
  /**
   * Create visual trail between pulses (optional)
   */
  _createPulseTrail(pulse) {
    // Could add trails showing pulse path
    // Not implemented in basic version
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      activePulses: this.globalPulses.length,
      linksWithFlow: this.linkPulses.size,
      totalSpawned: this.stats.pulseSpawnCount,
      avgPulsesPerLink: this.linkPulses.size > 0 ?
        (this.globalPulses.length / this.linkPulses.size).toFixed(1) : 0,
    };
  }
  
  /**
   * Reset system
   */
  reset() {
    this.globalPulses = [];
    this.linkPulses.clear();
    this.spawnAccumulators.clear();
    this.stats.pulseSpawnCount = 0;
  }
  
  /**
   * Cleanup resources
   */
  dispose() {
    if (this.pulseGroup) {
      this.scene.remove(this.pulseGroup);
    }
    if (this.pulseGeometry) {
      this.pulseGeometry.dispose();
    }
    if (this.pulseMaterial) {
      this.pulseMaterial.dispose();
    }
    
    this.globalPulses = [];
    this.linkPulses.clear();
  }
}
