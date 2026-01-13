/**
 * T2-002: CORRUPTION VISUAL INTEGRATION v1.0
 * 
 * TIER 2 VISUAL INTEGRATION — CORRUPTION FEEDBACK LAYER
 * Wires LinkCorruptionTransmission_v1 data to CorruptionVisualFX_v1 rendering
 * 
 * ✅ WIRING ONLY — Zero gameplay logic modifications
 * ✅ Passes link.corruptionLevel → CorruptionVisualFX_v1 each frame
 * ✅ Maps corruption → color tint progression
 * ✅ Triggers particle bursts at cascade thresholds
 * ✅ Enables distortion shader on corrupted links
 * ✅ Safe to disable/enable at any time
 */

import * as THREE from 'three';

export class T2_CorruptionVisualIntegration_v1 {
  constructor(scene, linkingSystem, corruptionVisualFX) {
    this.scene = scene;
    this.linkingSystem = linkingSystem;  // Read-only reference to links
    this.corruptionVisualFX = corruptionVisualFX; // CorruptionVisualFX_v1 instance
    
    this.enabled = true;
    this.config = {
      // Color tint progression based on corruption level
      colorTints: {
        0.0: new THREE.Color(0x00ffff),   // Healthy - cyan
        0.3: new THREE.Color(0xff8800),   // Mild - orange
        0.65: new THREE.Color(0xff0055),  // Moderate - magenta
        0.85: new THREE.Color(0xff0000),  // Strong - red
        1.0: new THREE.Color(0x550055)    // Severe - purple void
      },
      
      // Cascade thresholds for particle burst effects
      cascadeThresholds: [0.3, 0.65, 0.85],
      
      // Distortion shader enablement
      distortionStartThreshold: 0.45,
      distortionMaxThreshold: 0.85,
      
      // Visual intensity scales
      particleBurstIntensity: {
        mild: 1.0,
        moderate: 2.0,
        strong: 3.0,
        severe: 4.0
      }
    };
    
    this.registry = {
      linkCorruptionData: new Map(),       // link → { level, lastVisualState, cascadeBurstTriggered }
      activeLinkVisuals: new Map(),        // link → visual effect metadata
      time: 0,
      framesProcessed: 0,
      lastCascadeTriggerTime: {}
    };
    
    console.log('[T2_CorruptionVisualIntegration_v1] Initialized (corruption visual wiring)');
  }
  
  /**
   * Get interpolated color based on corruption level
   * Uses color palette progression
   */
  getCorruptionColor(corruptionLevel) {
    const thresholds = [0.0, 0.3, 0.65, 0.85, 1.0];
    let colorA = this.config.colorTints[0.0];
    let colorB = this.config.colorTints[1.0];
    let t = 0;
    
    for (let i = 0; i < thresholds.length - 1; i++) {
      const t0 = thresholds[i];
      const t1 = thresholds[i + 1];
      
      if (corruptionLevel >= t0 && corruptionLevel <= t1) {
        colorA = this.config.colorTints[t0];
        colorB = this.config.colorTints[t1];
        t = (corruptionLevel - t0) / (t1 - t0);
        break;
      }
    }
    
    // Linear interpolation between colors
    const result = new THREE.Color();
    result.lerpColors(colorA, colorB, t);
    return result;
  }
  
  /**
   * Register a link for corruption visual tracking
   */
  registerLink(link) {
    if (!link || this.registry.linkCorruptionData.has(link.id || link.uuid)) return;
    
    this.registry.linkCorruptionData.set(link.id || link.uuid, {
      link: link,
      level: 0,
      lastVisualState: 'healthy',
      cascadeBurstTriggered: false,
      lastBurstTime: -Infinity
    });
  }
  
  /**
   * Check if link crosses a cascade threshold
   * Returns burst intensity if triggered
   */
  checkCascadeThreshold(corruptionLevel, linkKey) {
    const BURST_COOLDOWN = 1.0; // seconds between bursts on same link
    const now = this.registry.time;
    
    let triggered = false;
    let burstIntensity = 0;
    
    // Check each cascade threshold
    if (corruptionLevel >= 0.85 && (!this.registry.lastCascadeTriggerTime[linkKey] || 
        now - this.registry.lastCascadeTriggerTime[linkKey] > BURST_COOLDOWN)) {
      triggered = true;
      burstIntensity = this.config.particleBurstIntensity.severe;
    } else if (corruptionLevel >= 0.65 && (!this.registry.lastCascadeTriggerTime[linkKey] || 
        now - this.registry.lastCascadeTriggerTime[linkKey] > BURST_COOLDOWN)) {
      triggered = true;
      burstIntensity = this.config.particleBurstIntensity.strong;
    } else if (corruptionLevel >= 0.3 && (!this.registry.lastCascadeTriggerTime[linkKey] || 
        now - this.registry.lastCascadeTriggerTime[linkKey] > BURST_COOLDOWN)) {
      triggered = true;
      burstIntensity = this.config.particleBurstIntensity.moderate;
    }
    
    if (triggered) {
      this.registry.lastCascadeTriggerTime[linkKey] = now;
    }
    
    return { triggered, burstIntensity };
  }
  
  /**
   * Apply visual effects to a corrupted link
   */
  applyCorruptionVisuals(link, corruptionLevel, deltaTime) {
    if (!link || !this.enabled) return;
    
    const linkKey = link.id || link.uuid;
    this.registerLink(link);
    
    const linkData = this.registry.linkCorruptionData.get(linkKey);
    if (!linkData) return;
    
    // T2-002: Apply color tint based on corruption level
    const corruptionColor = this.getCorruptionColor(corruptionLevel);
    if (link.material) {
      link.material.color.copy(corruptionColor);
      link.material.emissive?.copy(corruptionColor);
      link.material.emissiveIntensity = Math.min(0.8, corruptionLevel * 2.0);
    }
    
    // T2-002: Enable distortion shader for corrupted links (>45%)
    if (corruptionLevel >= this.config.distortionStartThreshold && link.geometry) {
      if (!linkData.distortionEnabled) {
        linkData.distortionEnabled = true;
        // Mark for shader application (handled by CorruptionVisualFX_v1)
        link.userData.enableDistortion = true;
      }
      
      // Increase distortion with corruption
      const distortionFactor = (corruptionLevel - this.config.distortionStartThreshold) / 
        (this.config.distortionMaxThreshold - this.config.distortionStartThreshold);
      link.userData.distortionIntensity = Math.min(1.0, distortionFactor * 1.5);
    } else {
      if (linkData.distortionEnabled) {
        linkData.distortionEnabled = false;
        link.userData.enableDistortion = false;
      }
    }
    
    // T2-002: Trigger particle burst at cascade thresholds
    const { triggered, burstIntensity } = this.checkCascadeThreshold(corruptionLevel, linkKey);
    if (triggered) {
      this.triggerParticleBurst(link, burstIntensity, corruptionLevel);
    }
    
    // T2-002: Apply wave/distortion effect at high corruption
    if (corruptionLevel >= 0.85 && link.userData) {
      // Add temporal wave modulation
      link.userData.corruptionWavePhase = (link.userData.corruptionWavePhase || 0) + deltaTime * 2.0;
      link.userData.corruptionWaveIntensity = Math.sin(link.userData.corruptionWavePhase) * 0.5 + 0.5;
    }
    
    linkData.level = corruptionLevel;
  }
  
  /**
   * Trigger a particle burst effect on link
   */
  triggerParticleBurst(link, intensity, corruptionLevel) {
    if (!link || !this.scene) return;
    
    const burstCount = Math.ceil(intensity * 5);
    const linkMidpoint = new THREE.Vector3();
    
    if (link.geometry && link.geometry.attributes.position) {
      // Get midpoint of link
      const positions = link.geometry.attributes.position.array;
      if (positions.length >= 6) {
        linkMidpoint.set(
          (positions[0] + positions[3]) / 2,
          (positions[1] + positions[4]) / 2,
          (positions[2] + positions[5]) / 2
        );
        if (link.parent) {
          link.parent.localToWorld(linkMidpoint);
        }
      }
    }
    
    // Create burst particles
    for (let i = 0; i < burstCount; i++) {
      const particle = this.createBurstParticle(linkMidpoint, corruptionLevel);
      this.scene.add(particle);
    }
  }
  
  /**
   * Create a single corruption burst particle
   */
  createBurstParticle(position, corruptionLevel) {
    const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
    const particleColor = this.getCorruptionColor(corruptionLevel);
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: particleColor,
      emissive: particleColor,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.9
    });
    
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    particle.position.copy(position);
    particle.userData = {
      isBurstParticle: true,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      ),
      lifetime: 1.0 + Math.random() * 0.5,
      age: 0,
      createdAt: this.registry.time
    };
    
    return particle;
  }
  
  /**
   * Main update loop — call once per frame
   * Wires corruption data → visual rendering
   */
  update(deltaTime, links) {
    if (!this.enabled || !links) return;
    
    this.registry.time += deltaTime;
    this.registry.framesProcessed++;
    
    // Update each link's corruption visuals
    for (const link of links) {
      if (!link || !link.userData) continue;
      
      // Read corruption level from link (set by LinkCorruptionTransmission_v1)
      const corruptionLevel = link.userData.corruptionLevel ?? 0;
      
      // Apply visual effects if corrupted
      if (corruptionLevel > 0.01) {
        this.applyCorruptionVisuals(link, corruptionLevel, deltaTime);
      }
    }
    
    // Update burst particles
    const burstParticles = this.scene.children.filter(obj => 
      obj.userData?.isBurstParticle === true
    );
    
    for (let i = burstParticles.length - 1; i >= 0; i--) {
      const particle = burstParticles[i];
      particle.userData.age += deltaTime;
      
      // Update position
      particle.position.add(
        particle.userData.velocity.clone().multiplyScalar(deltaTime)
      );
      
      // Fade out
      const fadeStart = particle.userData.lifetime * 0.7;
      if (particle.userData.age > fadeStart) {
        const fadeProgress = (particle.userData.age - fadeStart) / 
          (particle.userData.lifetime - fadeStart);
        particle.material.opacity = 0.9 * (1.0 - fadeProgress);
      }
      
      // Remove expired particle
      if (particle.userData.age >= particle.userData.lifetime) {
        this.scene.remove(particle);
        particle.geometry.dispose();
        particle.material.dispose();
      }
    }
  }
  
  /**
   * Get status for debugging
   */
  getStatus() {
    return {
      enabled: this.enabled,
      registeredLinks: this.registry.linkCorruptionData.size,
      framesProcessed: this.registry.framesProcessed,
      time: this.registry.time.toFixed(2)
    };
  }
}
