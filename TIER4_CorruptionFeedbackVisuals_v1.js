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
      
      // Cascade warning
      showCascadeWarning: config.showCascadeWarning ?? true,
      cascadeWarningColor: config.cascadeWarningColor ?? 0xff0000,
      cascadeWarningPulseSpeed: config.cascadeWarningPulseSpeed ?? 4.0,
      
      // Harmony restoration
      showHarmonyPulse: config.showHarmonyPulse ?? true,
      harmonyPulseColor: config.harmonyPulseColor ?? 0x00ffff,
      harmonyPulseDuration: config.harmonyPulseDuration ?? 0.8
    };
    
    // Active visual effects
    this.activeCorruptionSeeds = [];
    this.activeCascadeWarnings = [];
    this.activeHarmonyPulses = [];
    
    // Material pool for reuse
    this.materialPool = {
      corruptionSeed: new THREE.MeshBasicMaterial({ 
        color: this.config.corruptionSeedColor,
        transparent: true
      }),
      cascadeWarning: new THREE.MeshBasicMaterial({
        color: this.config.cascadeWarningColor,
        transparent: true,
        emissive: this.config.cascadeWarningColor,
        emissiveIntensity: 0.5
      }),
      harmonyPulse: new THREE.MeshBasicMaterial({
        color: this.config.harmonyPulseColor,
        transparent: true
      })
    };
    
    // Geometry pool
    this.geometryPool = {
      sphere: new THREE.IcosahedronGeometry(0.3, 4),
      ring: new THREE.TorusGeometry(0.5, 0.1, 16, 32)
    };
    
    // Statistics
    this.stats = {
      corruptionSeedsRendered: 0,
      cascadeWarningsRendered: 0,
      harmonyPulsesRendered: 0,
      totalEffectsActive: 0
    };
  }
  
  /**
   * Display corruption seed effect on link creation
   * Appears at source node, pulses with corruption color
   */
  displayCorruptionSeed(node) {
    if (!node || !this.config.showCorruptionSeedPulse) return;
    
    try {
      const mesh = new THREE.Mesh(
        this.geometryPool.sphere,
        this.materialPool.corruptionSeed.clone()
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
        startTime: Date.now(),
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
        this.geometryPool.ring,
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
    if (!node || !this.config.showHarmonyPulse) return;
    
    try {
      const mesh = new THREE.Mesh(
        this.geometryPool.ring,
        this.materialPool.harmonyPulse.clone()
      );
      
      // Position at node
      mesh.position.copy(node.position);
      mesh.scale.set(0.5, 0.5, 1.0);
      mesh.userData.opacity = 1.0;
      
      this.scene.add(mesh);
      
      // Create animation data
      const effect = {
        mesh,
        type: 'harmonyPulse',
        startTime: Date.now(),
        duration: this.config.harmonyPulseDuration * 1000, // Convert to ms
        startScale: new THREE.Vector3(0.5, 0.5, 1.0),
        endScale: new THREE.Vector3(2.0, 2.0, 1.0)
      };
      
      this.activeHarmonyPulses.push(effect);
      this.stats.harmonyPulsesRendered++;
      
      if (this.config.enableDebug) {
        console.log('[TIER4_CorruptionFeedbackVisuals] Harmony pulse displayed');
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
    const currentTime = Date.now();
    
    // Update corruption seeds
    for (let i = this.activeCorruptionSeeds.length - 1; i >= 0; i--) {
      const effect = this.activeCorruptionSeeds[i];
      const elapsed = currentTime - effect.startTime;
      const progress = Math.min(elapsed / effect.duration, 1.0);
      
      // Scale up
      const scale = effect.startScale.clone()
        .lerp(effect.endScale, progress);
      effect.mesh.scale.copy(scale);
      
      // Fade out at end
      const opacity = Math.max(1.0 - progress, 0);
      effect.mesh.material.opacity = opacity;
      
      // Remove when done
      if (progress >= 1.0) {
        this.scene.remove(effect.mesh);
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
    
    // Update harmony pulses
    for (let i = this.activeHarmonyPulses.length - 1; i >= 0; i--) {
      const effect = this.activeHarmonyPulses[i];
      const elapsed = currentTime - effect.startTime;
      const progress = Math.min(elapsed / effect.duration, 1.0);
      
      // Scale out (expanding wave)
      const scale = effect.startScale.clone()
        .lerp(effect.endScale, progress);
      effect.mesh.scale.copy(scale);
      
      // Fade out
      const opacity = Math.max(1.0 - progress, 0);
      effect.mesh.material.opacity = opacity;
      
      // Remove when done
      if (progress >= 1.0) {
        this.scene.remove(effect.mesh);
        this.activeHarmonyPulses.splice(i, 1);
      }
    }
    
    // Update stats
    this.stats.totalEffectsActive = 
      this.activeCorruptionSeeds.length + 
      this.activeCascadeWarnings.length + 
      this.activeHarmonyPulses.length;
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
    
    // Remove harmony pulses
    for (const effect of this.activeHarmonyPulses) {
      this.scene.remove(effect.mesh);
    }
    this.activeHarmonyPulses = [];
    
    this.stats.totalEffectsActive = 0;
  }
  
  /**
   * Dispose resources
   */
  dispose() {
    this.clear();
    
    // Dispose materials
    this.materialPool.corruptionSeed.dispose();
    this.materialPool.cascadeWarning.dispose();
    this.materialPool.harmonyPulse.dispose();
    
    // Dispose geometries
    this.geometryPool.sphere.dispose();
    this.geometryPool.ring.dispose();
  }
}

export default TIER4_CorruptionFeedbackVisuals;
