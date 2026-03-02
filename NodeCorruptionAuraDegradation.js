/**
 * NODE CORRUPTION AURA DEGRADATION SYSTEM
 * ============================================================================
 * Applies visual corruption effects to node auras based on corruption level:
 * - Desaturation (color → gray)
 * - Distortion intensity increase
 * - Opacity modulation
 * - Flickering/instability
 * - Glow intensity reduction
 * 
 * Features:
 * - Progressive desaturation from clean → tainted → fully corrupted
 * - Enhanced displacement/distortion at high corruption
 * - Flickering effect creates sense of system failure
 * - Independent per-node tracking
 * - Visual-only, zero gameplay impact
 * 
 * @author VFX Technical Director — ATOMA Project
 * @version 1.0.0
 */

import * as THREE from 'three';

export class NodeCorruptionAuraDegradation {
  constructor() {
    // Per-node corruption state
    this.corruptionStates = new Map(); // node.id → {level, desaturation, flicker, distortion}
    
    // Configuration
    this.config = {
      // Desaturation progression
      desaturationStartThreshold: 0.2,  // Corruption % that starts desaturation
      desaturationFullThreshold: 0.7,   // Corruption % where fully desaturated
      
      // Distortion/displacement
      distortionStartThreshold: 0.3,
      distortionMaxMultiplier: 2.0,     // Max displacement multiplier
      
      // Flickering
      flickeringStartThreshold: 0.5,
      flickeringMaxFrequency: 8.0,      // Hz at full corruption
      
      // Glow reduction
      glowReductionRate: 0.5,            // How much glow reduces per corruption unit
      
      // Opacity modulation
      opacityMinimum: 0.15,              // Minimum aura opacity when corrupted
      opacityRange: 0.6,                 // Range from min to base
    };
    
    // Time tracking for flickering
    this.time = 0;
  }
  
  /**
   * Initialize corruption state for a node
   * @param {Object} node - The node
   */
  initializeNode(node) {
    if (!node.userData?.id && !node.id && !node.uuid) return;
    
    const nodeId = node.userData?.id || node.id || node.uuid;
    
    this.corruptionStates.set(nodeId, {
      level: 0,
      desaturation: 0,
      flicker: 0,
      distortion: 1.0,
      targetDesaturation: 0,
      baseOpacity: 0.25,
      isDegrading: false,
      degradationStartTime: 0
    });
  }
  
  /**
   * Update corruption effects for a node
   * @param {Object} node - Node to update
   * @param {number} corruptionLevel - Current corruption (0-1)
   * @param {number} deltaTime - Delta time in seconds
   * @param {Object} auraMaterial - Shader material to modify
   */
  updateNodeCorruption(node, corruptionLevel, deltaTime, auraMaterial) {
    if (!auraMaterial || !auraMaterial.uniforms) return null;
    if (auraMaterial.userData?.auraLayer && auraMaterial.userData.auraLayer !== 'AURA_BASELINE') return null;
    
    const nodeId = node.userData?.id || node.id || node.uuid;
    if (!nodeId) return null;
    
    let state = this.corruptionStates.get(nodeId);
    if (!state) {
      this.initializeNode(node);
      state = this.corruptionStates.get(nodeId);
    }
    
    // Update corruption level
    const levelChanged = Math.abs(state.level - corruptionLevel) > 0.01;
    state.level = corruptionLevel;
    
    if (levelChanged && corruptionLevel > this.config.desaturationStartThreshold) {
      state.isDegrading = true;
      state.degradationStartTime = performance.now();
    }
    
    // Calculate desaturation (0 = fully colorful, 1 = fully grayscale)
    state.targetDesaturation = this._calculateDesaturation(corruptionLevel);
    
    // Smooth transition to target desaturation
    const desaturationSpeed = 2.0; // Units per second
    state.desaturation += (state.targetDesaturation - state.desaturation) * desaturationSpeed * deltaTime;
    state.desaturation = Math.max(0, Math.min(1, state.desaturation));
    
    // Calculate distortion multiplier
    state.distortion = this._calculateDistortion(corruptionLevel);
    
    // Calculate flickering effect
    state.flicker = this._calculateFlickering(corruptionLevel);
    
    // Apply effects to shader uniforms
    this._applyCorruptionEffects(auraMaterial, state, corruptionLevel);
    
    return state;
  }
  
  /**
   * Calculate desaturation value (0-1) based on corruption
   * @private
   */
  _calculateDesaturation(corruptionLevel) {
    if (corruptionLevel < this.config.desaturationStartThreshold) {
      return 0; // No desaturation
    }
    
    if (corruptionLevel >= this.config.desaturationFullThreshold) {
      return 1; // Full desaturation
    }
    
    // Linear interpolation between thresholds
    const start = this.config.desaturationStartThreshold;
    const end = this.config.desaturationFullThreshold;
    return (corruptionLevel - start) / (end - start);
  }
  
  /**
   * Calculate distortion multiplier based on corruption
   * Higher values = more displacement
   * @private
   */
  _calculateDistortion(corruptionLevel) {
    if (corruptionLevel < this.config.distortionStartThreshold) {
      return 1.0; // No distortion
    }
    
    // Quadratic escalation for more dramatic effect at high corruption
    const normalized = (corruptionLevel - this.config.distortionStartThreshold) / 
                       (1.0 - this.config.distortionStartThreshold);
    return 1.0 + (normalized * normalized) * (this.config.distortionMaxMultiplier - 1.0);
  }
  
  /**
   * Calculate flickering intensity based on corruption
   * @private
   */
  _calculateFlickering(corruptionLevel) {
    if (corruptionLevel < this.config.flickeringStartThreshold) {
      return 0; // No flickering
    }
    
    const normalized = (corruptionLevel - this.config.flickeringStartThreshold) / 
                       (1.0 - this.config.flickeringStartThreshold);
    
    // Frequency increases with corruption
    const frequency = 1.0 + (normalized * (this.config.flickeringMaxFrequency - 1.0));
    
    // Amplitude also increases
    const amplitude = normalized * 0.5;
    
    // Use sine wave for smooth flickering
    const flicker = Math.sin(this.time * frequency * Math.PI * 2) * amplitude + (1.0 - amplitude);
    
    return Math.max(0, Math.min(1, flicker));
  }
  
  /**
   * Apply corruption effects to aura material uniforms
   * @private
   */
  _applyCorruptionEffects(auraMaterial, state, corruptionLevel) {
    if (!auraMaterial.uniforms) return;
    
    // --- DESATURATION EFFECT ---
    // Modify aura color toward grayscale
    if (auraMaterial.uniforms.uDesaturation) {
      auraMaterial.uniforms.uDesaturation.value = state.desaturation;
    }
    
    // --- DISTORTION ENHANCEMENT ---
    // Increase displacement/noise at high corruption
    if (auraMaterial.uniforms.uDisplacement) {
      const baseDisplacement = auraMaterial.uniforms.uDisplacement.value || 0.3;
      auraMaterial.uniforms.uDisplacement.value = baseDisplacement * state.distortion;
    }
    
    // --- FLICKERING OPACITY ---
    // Modulate opacity based on corruption flickering
    if (auraMaterial.uniforms.uOpacity) {
      const baseOpacity = state.baseOpacity || 0.25;
      
      // At low corruption: normal opacity
      // At high corruption: reduced + flickering
      const corruptionOppacity = baseOpacity * (1.0 - corruptionLevel * this.config.glowReductionRate);
      const flickeredOpacity = corruptionOppacity * state.flicker;
      
      // Clamp to minimum
      auraMaterial.uniforms.uOpacity.value = Math.max(
        this.config.opacityMinimum,
        flickeredOpacity
      );
    }
    
    // --- GLOW INTENSITY REDUCTION ---
    // Reduce emissive intensity at high corruption (aura dims as corrupted)
    if (auraMaterial.uniforms.uWaveInfluence) {
      const baseWave = 0.5;
      const corruptedWave = baseWave * (1.0 - corruptionLevel * 0.3);
      auraMaterial.uniforms.uWaveInfluence.value = Math.max(0.1, corruptedWave);
    }
    
    // --- INSTABILITY SIGNAL ---
    // Use corruption level to drive instability in shader
    if (auraMaterial.uniforms.uCorruption) {
      auraMaterial.uniforms.uCorruption.value = corruptionLevel;
    }
  }
  
  /**
   * Update global time for flickering calculations
   * Call once per frame with elapsed seconds
   * @param {number} deltaTime - Delta time in seconds
   */
  updateTime(deltaTime) {
    this.time += deltaTime;
  }
  
  /**
   * Get desaturation value for a node (for external systems)
   * @param {Object} node - Node to query
   * @returns {number} Desaturation 0-1
   */
  getDesaturation(node) {
    const nodeId = node.userData?.id || node.id || node.uuid;
    const state = this.corruptionStates.get(nodeId);
    return state ? state.desaturation : 0;
  }
  
  /**
   * Dispose state for a node
   * @param {Object} node - Node to dispose
   */
  disposeNode(node) {
    const nodeId = node.userData?.id || node.id || node.uuid;
    this.corruptionStates.delete(nodeId);
  }
  
  /**
   * Clear all states
   */
  dispose() {
    this.corruptionStates.clear();
  }
}
