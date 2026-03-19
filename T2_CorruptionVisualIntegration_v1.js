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
    this._tmpPullVector = new THREE.Vector3();
    this._tmpSourceWorldPos = new THREE.Vector3();
    this._tmpTargetWorldPos = new THREE.Vector3();
    
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
    
    const burstJitter = 0.7 + Math.random() * 0.6; // 0.7 -> 1.3
    const burstCount = Math.max(1, Math.ceil(intensity * 5 * burstJitter));
    const sourceNode = link?.source ?? link?.sourceNode ?? link?.from ?? null;
    const targetNode = link?.target ?? link?.targetNode ?? link?.to ?? null;
    const sourceWorldPos = this._resolveWorldPosition(sourceNode, this._tmpSourceWorldPos);
    const targetWorldPos = this._resolveWorldPosition(targetNode, this._tmpTargetWorldPos);
    if (!sourceWorldPos || !targetWorldPos) return;
    const direction = new THREE.Vector3().subVectors(targetWorldPos, sourceWorldPos);
    if (direction.lengthSq() < 1e-6) return;
    direction.normalize();
    
    // Create burst particles
    for (let i = 0; i < burstCount; i++) {
      const spawnFromTarget = Math.random() < 0.7;
      const spawnPosition = spawnFromTarget ? targetWorldPos : sourceWorldPos;
      const particle = this.createBurstParticle(spawnPosition, corruptionLevel, direction, targetWorldPos);
      this.scene.add(particle);
    }
  }

  _resolveWorldPosition(node, outVec) {
    if (!node || !node.position) return null;
    const pos = (typeof node.getWorldPosition === 'function')
      ? node.getWorldPosition(outVec || new THREE.Vector3())
      : node.position;
    if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y) || !Number.isFinite(pos.z)) return null;
    return pos;
  }
  
  /**
   * Create a single corruption burst particle
   */
  createBurstParticle(position, corruptionLevel, direction = null, targetAnchor = null) {
    const useTetra = Math.random() < 0.5;
    const particleGeometry = useTetra
      ? new THREE.TetrahedronGeometry(0.1, 0)
      : new THREE.OctahedronGeometry(0.1, 0);
    const particleColor = this.getCorruptionColor(corruptionLevel);
    const particleMaterial = new THREE.MeshLambertMaterial({
      color: particleColor,
      emissive: particleColor,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.9
    });
    
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    particle.position.copy(position);
    const baseDir = direction && direction.lengthSq() > 1e-6
      ? direction.clone()
      : new THREE.Vector3(1, 0, 0);
    const jitter = 0.3;
    const driftDir = baseDir.add(new THREE.Vector3(
      (Math.random() * 2 - 1) * jitter,
      (Math.random() * 2 - 1) * jitter,
      (Math.random() * 2 - 1) * jitter
    )).normalize();
    const speed = 10 + Math.random() * 10;
    const seed = Math.random() * Math.PI * 2;
    const spin = new THREE.Vector3(
      (Math.random() * 2 - 1) * 4,
      (Math.random() * 2 - 1) * 4,
      (Math.random() * 2 - 1) * 4
    );

    particle.userData = {
      isBurstParticle: true,
      velocity: driftDir.multiplyScalar(speed),
      lifetime: 1.0 + Math.random() * 0.5,
      age: 0,
      createdAt: this.registry.time,
      baseScale: 1.0,
      seed,
      spin,
      targetAnchor: targetAnchor ? targetAnchor.clone() : null,
      trailBuffer: [particle.position.clone()],
      trailMax: 5
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
      const corruptionLevel =
        link?.group?.userData?.conduitState?.metrics?.corruption ??
        link?.userData?.metrics?.corruption ??
        link?.userData?.corruption ??
        link?.userData?.corruptionLevel ??
        link?.corruption ??
        link?.corruptionLevel ??
        0;
      
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
      const life = Math.max(0.0001, particle.userData.lifetime || 1.0);
      const t = Math.max(0, Math.min(1, particle.userData.age / life));
      
      // Update position
      particle.position.addScaledVector(particle.userData.velocity, deltaTime);

      // Gentle velocity pull back toward target (gravity feel)
      if (particle.userData.targetAnchor) {
        this._tmpPullVector.subVectors(particle.userData.targetAnchor, particle.position);
        const distSq = this._tmpPullVector.lengthSq();
        if (distSq > 1e-6) {
          const pullStrength = 2.2;
          this._tmpPullVector.normalize();
          particle.userData.velocity.addScaledVector(this._tmpPullVector, pullStrength * deltaTime);
        }
      }

      // Trail buffer (max 5 points)
      const trail = particle.userData.trailBuffer;
      if (Array.isArray(trail)) {
        trail.push(particle.position.clone());
        const trailMax = Math.max(1, particle.userData.trailMax || 5);
        while (trail.length > trailMax) trail.shift();
      }

      // Exponential fade
      const fade = Math.pow(1.0 - t, 2.5);
      particle.material.opacity = 0.9 * fade;

      // Pulse scale (0.8 -> 1.1)
      const seed = particle.userData.seed || 0;
      const pulse01 = Math.sin(this.registry.time * 6 + seed) * 0.5 + 0.5;
      const pulseScale = 0.8 + pulse01 * 0.3;
      const baseScale = particle.userData.baseScale || 1.0;
      particle.scale.setScalar(baseScale * pulseScale);

      // Emissive flicker (0.8 -> 1.2)
      if (particle.material?.emissiveIntensity !== undefined) {
        const flicker01 = Math.sin(this.registry.time * 14 + seed * 1.7) * 0.5 + 0.5;
        const emissiveMult = 0.8 + flicker01 * 0.4;
        particle.material.emissiveIntensity = 0.8 * emissiveMult;
      }

      // Rotation
      particle.rotation.x += (particle.userData.spin?.x || 0) * deltaTime;
      particle.rotation.y += (particle.userData.spin?.y || 0) * deltaTime;
      particle.rotation.z += (particle.userData.spin?.z || 0) * deltaTime;
      
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
