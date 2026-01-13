/**
 * LINK CORRUPTION SPREAD ANIMATOR
 * ============================================================================
 * Animates corruption spread along links with directional color shift
 * from source to target nodes
 * 
 * Features:
 * - Tracks corruption level per link
 * - Animates wave front traveling source → target
 * - Shifts strand colors progressively (clean → tainted → corrupted)
 * - Independent animation state per link
 * - Visual-only, no gameplay changes
 * 
 * @author VFX Technical Director — ATOMA Project
 * @version 1.0.0
 */

import * as THREE from 'three';

export class LinkCorruptionSpreadAnimator {
  constructor() {
    // Per-link corruption animation state
    this.animationStates = new Map(); // link.id → {wavePhase, intensity, startTime}
    
    // Color palette for corruption progression
    this.corruptionColors = {
      // Clean state colors (by category)
      clean: {
        'input': new THREE.Color(0x00ddff),
        'process': new THREE.Color(0xffaa00),
        'integration': new THREE.Color(0x00ff88),
        'analytics': new THREE.Color(0xaa00ff),
        'storage': new THREE.Color(0x88ccff),
        'control': new THREE.Color(0xff0088),
        'quantum': new THREE.Color(0x00ffff),
        'sigma': new THREE.Color(0x00ff00),
        'emotional': new THREE.Color(0xff8800),
        'default': new THREE.Color(0xcccccc)
      },
      // Tainted state (slight corruption)
      tainted: new THREE.Color(0xff6633), // Orange-red
      // Corrupted state (heavy infection)
      corrupted: new THREE.Color(0xff0044)  // Deep red-magenta
    };
    
    // Configuration
    this.config = {
      spreadDuration: 2000,           // 2s for wave to travel source → target
      waveDuration: 800,              // Wave front width duration
      spreadStartThreshold: 0.15,     // Corruption level that triggers spread
      maxCorruptionForSpread: 0.95,   // Cap on corruption visualization
    };
  }
  
  /**
   * Initialize corruption animation state for a link
   * @param {Object} link - The link object
   */
  initializeLink(link) {
    if (!link.id) return;
    
    this.animationStates.set(link.id, {
      wavePhase: 0,
      intensity: 0,
      startTime: performance.now(),
      previousCorruption: 0,
      isAnimating: false
    });
  }
  
  /**
   * Update corruption spread animation
   * @param {Object} link - Link to animate
   * @param {number} deltaTime - Delta time in seconds
   * @param {Array} strands - Link strand meshes to color
   * @returns {Object} Animation state
   */
  update(link, deltaTime, strands) {
    if (!link.id || !strands || strands.length === 0) return null;
    
    const corruptionLevel = Math.min(
      this.config.maxCorruptionForSpread,
      link.corruptionLevel ?? link.corruption ?? 0
    );
    
    let state = this.animationStates.get(link.id);
    if (!state) {
      this.initializeLink(link);
      state = this.animationStates.get(link.id);
    }
    
    // Trigger spread animation if corruption suddenly increases
    const corruptionDelta = corruptionLevel - state.previousCorruption;
    if (corruptionDelta > 0.05 && corruptionLevel > this.config.spreadStartThreshold) {
      state.isAnimating = true;
      state.startTime = performance.now();
      state.previousCorruption = corruptionLevel;
    }
    
    // Update animation phase (0 to 1, represents wave position)
    if (state.isAnimating) {
      const elapsed = performance.now() - state.startTime;
      state.wavePhase = Math.min(1.0, elapsed / this.config.spreadDuration);
      
      // End animation when wave completes
      if (state.wavePhase >= 1.0) {
        state.isAnimating = false;
      }
    }
    
    // Update animation intensity (0 at phase start/end, 1 at peak)
    const wavePos = state.wavePhase;
    const waveFalloff = Math.sin(wavePos * Math.PI) * (1.0 - Math.abs(wavePos - 0.5) * 2); // Peaked wave
    state.intensity = Math.max(waveFalloff, corruptionLevel * 0.5);
    
    // Apply colors to strands based on corruption progression
    this._applyCorruptionGradient(strands, corruptionLevel, state.wavePhase, link);
    
    return state;
  }
  
  /**
   * Apply corruption color gradient along strands
   * Colors progress from clean → tainted → corrupted
   * @private
   */
  _applyCorruptionGradient(strands, corruptionLevel, wavePhase, link) {
    if (corruptionLevel < this.config.spreadStartThreshold) {
      // No visible corruption yet
      return;
    }
    
    // Get base color from source node category
    const sourceCategory = link.source?.userData?.category || 'default';
    const baseColor = this.corruptionColors.clean[sourceCategory] || this.corruptionColors.clean.default;
    
    // Determine corruption stage
    let targetColor;
    if (corruptionLevel < 0.5) {
      // Tainted: blend base → tainted
      const t = corruptionLevel / 0.5;
      targetColor = new THREE.Color().lerpColors(baseColor, this.corruptionColors.tainted, t);
    } else {
      // Corrupted: blend tainted → corrupted
      const t = (corruptionLevel - 0.5) / 0.5;
      targetColor = new THREE.Color().lerpColors(this.corruptionColors.tainted, this.corruptionColors.corrupted, t);
    }
    
    // Apply color to each strand based on position along wave
    strands.forEach((strand, strandIndex) => {
      if (!strand || !strand.material) return;
      
      const strandColor = new THREE.Color(baseColor);
      
      // Create wave sweep effect: color progresses along strands as wave travels
      const waveInfluence = this._getWaveInfluenceAtStrand(strandIndex, wavePhase, strands.length);
      
      // Blend strand color toward corruption color based on wave position
      strandColor.lerp(targetColor, waveInfluence * corruptionLevel * 0.9);
      
      // Apply to strand material
      if (strand.material.color) {
        strand.material.color.copy(strandColor);
      }
      
      // Enhance emissive for corrupted strands
      if (strand.material.emissive) {
        const corruptionEmissive = new THREE.Color(targetColor).multiplyScalar(corruptionLevel * 0.6);
        strand.material.emissive.copy(corruptionEmissive);
      }
      
      // Slightly increase emissive intensity with corruption
      if (strand.material.emissiveIntensity !== undefined) {
        strand.material.emissiveIntensity = 0.5 + (corruptionLevel * 0.5);
      }
    });
  }
  
  /**
   * Calculate wave influence at specific strand
   * Wave travels from strandIndex 0 to max over time
   * @private
   */
  _getWaveInfluenceAtStrand(strandIndex, wavePhase, strandCount) {
    // Wave center position (0 = source, 1 = target)
    const waveCenter = wavePhase;
    
    // Strand position normalized (0 = first, 1 = last)
    const strandPos = strandCount > 1 ? strandIndex / (strandCount - 1) : 0;
    
    // Distance from wave center
    const distFromWave = Math.abs(strandPos - waveCenter);
    
    // Wave width: travels as Gaussian bell curve
    const waveWidth = this.config.waveDuration / this.config.spreadDuration;
    const waveFalloff = Math.exp(-(distFromWave * distFromWave) / (waveWidth * waveWidth * 0.5));
    
    return Math.pow(waveFalloff, 2); // Square for sharper wave front
  }
  
  /**
   * Get base clean color for a link's source node category
   * @param {string} category - Node category
   * @returns {THREE.Color} Base color
   */
  getCleanColor(category) {
    return this.corruptionColors.clean[category] || this.corruptionColors.clean.default;
  }
  
  /**
   * Dispose animation state for a link (called on link removal)
   * @param {string} linkId - Link ID to dispose
   */
  disposeLinkAnimation(linkId) {
    this.animationStates.delete(linkId);
  }
  
  /**
   * Clear all animation states
   */
  dispose() {
    this.animationStates.clear();
  }
}
