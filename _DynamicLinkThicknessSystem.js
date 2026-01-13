/**
 * Dynamic Link Thickness System v1.0
 * 
 * Real-time link curve thickness adjustment based on traffic load
 * - Thickness scales from base width (low traffic) to max width (peak load)
 * - Smooth animation transitions between traffic states
 * - Supports both LineBasicMaterial thickness and TubeGeometry
 * - Integrates with existing traffic simulation
 * - Zero-impact on performance (uses existing traffic data)
 */

export class DynamicLinkThicknessSystem {
  constructor(scene, neonLinkVisuals) {
    this.scene = scene;
    this.visuals = neonLinkVisuals;
    
    // Configuration for thickness scaling
    this.config = {
      // Base line width (minimum thickness)
      baseWidth: 2,
      
      // Maximum line width at 100% traffic load
      maxWidth: 8,
      
      // Animation smoothing (0-1, higher = snappier response)
      responsiveness: 0.15,
      
      // Thickness multipliers by traffic level
      trafficLevelThickness: {
        low: 1.0,      // <= 0.3 load
        medium: 1.3,   // 0.3-0.6 load
        high: 1.6,     // 0.6-0.8 load
        overload: 2.0  // > 0.8 load
      },
      
      // Enable glow expansion with traffic (visual depth)
      enableGlowExpansion: true,
      baseGlowWidth: 4,
      maxGlowWidth: 12,
      
      // Opacity adjustment with traffic
      enableOpacityModulation: true,
      baseOpacity: 0.7,
      maxOpacity: 0.95,
      
      // Particle size scaling with traffic
      enableParticleScaling: true,
      baseParticleSize: 0.08,
      maxParticleSize: 0.16
    };
    
    // Track active links with thickness state
    this.linkThicknessStates = new Map();
    
    // Debug mode
    this.debug = false;
  }
  
  /**
   * Register a link curve for dynamic thickness updates
   * @param {THREE.Group} curveGroup - The neon curve group from createNeonCurve
   * @param {Object} linkData - Link object with traffic data
   */
  registerLinkCurve(curveGroup, linkData) {
    if (!curveGroup || !curveGroup.userData) return;
    
    const linkId = linkData.id || this._generateLinkId(linkData);
    
    const state = {
      linkId,
      curveGroup,
      linkData,
      currentWidth: this.config.baseWidth,
      targetWidth: this.config.baseWidth,
      currentGlowWidth: this.config.baseGlowWidth,
      targetGlowWidth: this.config.baseGlowWidth,
      currentOpacity: this.config.baseOpacity,
      targetOpacity: this.config.baseOpacity,
      currentParticleSize: this.config.baseParticleSize,
      targetParticleSize: this.config.baseParticleSize,
      lastTrafficLoad: 0,
      lastUpdateTime: Date.now()
    };
    
    this.linkThicknessStates.set(linkId, state);
    
    if (this.debug) {
      console.log(`[DynamicThickness] Registered link ${linkId}`, state);
    }
    
    return linkId;
  }
  
  /**
   * Unregister a link when it's removed
   * @param {string} linkId - The link identifier
   */
  unregisterLinkCurve(linkId) {
    this.linkThicknessStates.delete(linkId);
  }
  
  /**
   * Update thickness for a specific link based on traffic
   * @param {string} linkId - Link identifier
   * @param {number} trafficLoad - Current traffic load (0-1)
   */
  updateLinkThickness(linkId, trafficLoad) {
    const state = this.linkThicknessStates.get(linkId);
    if (!state) return;
    
    // Calculate target thickness based on traffic
    const targetWidth = this._calculateWidthFromTraffic(trafficLoad);
    const targetGlowWidth = this._calculateGlowWidthFromTraffic(trafficLoad);
    const targetOpacity = this._calculateOpacityFromTraffic(trafficLoad);
    const targetParticleSize = this._calculateParticleSizeFromTraffic(trafficLoad);
    
    // Update target values
    state.targetWidth = targetWidth;
    state.targetGlowWidth = targetGlowWidth;
    state.targetOpacity = targetOpacity;
    state.targetParticleSize = targetParticleSize;
    state.lastTrafficLoad = trafficLoad;
    state.lastUpdateTime = Date.now();
    
    if (this.debug) {
      console.log(`[DynamicThickness] Updated ${linkId} load=${trafficLoad.toFixed(2)} width=${targetWidth.toFixed(1)}`);
    }
  }
  
  /**
   * Smoothly animate all registered links toward their target thickness
   * Call this from your animation loop
   * @param {number} deltaTime - Frame delta time (typically 1/60)
   */
  animateAllLinks(deltaTime = 0.016) {
    for (const [linkId, state] of this.linkThicknessStates.entries()) {
      this._smoothAnimateLink(state, deltaTime);
    }
  }
  
  /**
   * Apply smooth animation to a single link
   * @private
   */
  _smoothAnimateLink(state, deltaTime) {
    const { responsiveness } = this.config;
    
    // Smoothly interpolate toward target values
    state.currentWidth += (state.targetWidth - state.currentWidth) * responsiveness;
    state.currentGlowWidth += (state.targetGlowWidth - state.currentGlowWidth) * responsiveness;
    state.currentOpacity += (state.targetOpacity - state.currentOpacity) * responsiveness;
    state.currentParticleSize += (state.targetParticleSize - state.currentParticleSize) * responsiveness;
    
    // Apply thickness to curve materials
    this._applyThicknessToMaterials(state);
  }
  
  /**
   * Apply calculated thickness values to the curve materials
   * @private
   */
  _applyThicknessToMaterials(state) {
    const { curveGroup, currentWidth, currentGlowWidth, currentOpacity } = state;
    
    if (!curveGroup) return;
    
    // Update main line
    if (curveGroup.userData.line && curveGroup.userData.line.material) {
      const material = curveGroup.userData.line.material;
      material.linewidth = Math.max(1, currentWidth);
      if (this.config.enableOpacityModulation && material.opacity !== undefined) {
        material.opacity = currentOpacity;
      }
    }
    
    // Update glow line
    if (curveGroup.userData.glowLine && curveGroup.userData.glowLine.material) {
      const material = curveGroup.userData.glowLine.material;
      material.linewidth = Math.max(1, currentGlowWidth * 1.5);
      if (this.config.enableOpacityModulation && material.opacity !== undefined) {
        material.opacity = currentOpacity * 0.4; // Glow is typically more transparent
      }
    }
    
    // Update particle sizes if available
    if (this.config.enableParticleScaling && curveGroup.userData.particles) {
      const particles = curveGroup.userData.particles;
      if (Array.isArray(particles)) {
        particles.forEach(particle => {
          if (particle.scale) {
            const scaleFactor = state.currentParticleSize / this.config.baseParticleSize;
            particle.scale.setScalar(scaleFactor);
          }
        });
      }
    }
  }
  
  /**
   * Calculate target width based on traffic load
   * @private
   */
  _calculateWidthFromTraffic(trafficLoad) {
    // Clamp to 0-1 range
    const load = Math.max(0, Math.min(1, trafficLoad));
    
    // Use exponential curve for more dramatic width change at high loads
    const curve = Math.pow(load, 0.7); // Power curve for non-linear scaling
    
    return this.config.baseWidth + (this.config.maxWidth - this.config.baseWidth) * curve;
  }
  
  /**
   * Calculate glow width based on traffic load
   * @private
   */
  _calculateGlowWidthFromTraffic(trafficLoad) {
    const load = Math.max(0, Math.min(1, trafficLoad));
    const curve = Math.pow(load, 0.6);
    
    return this.config.baseGlowWidth + (this.config.maxGlowWidth - this.config.baseGlowWidth) * curve;
  }
  
  /**
   * Calculate opacity based on traffic load
   * @private
   */
  _calculateOpacityFromTraffic(trafficLoad) {
    const load = Math.max(0, Math.min(1, trafficLoad));
    
    return this.config.baseOpacity + (this.config.maxOpacity - this.config.baseOpacity) * load;
  }
  
  /**
   * Calculate particle size based on traffic load
   * @private
   */
  _calculateParticleSizeFromTraffic(trafficLoad) {
    const load = Math.max(0, Math.min(1, trafficLoad));
    const curve = Math.pow(load, 0.8);
    
    return this.config.baseParticleSize + (this.config.maxParticleSize - this.config.baseParticleSize) * curve;
  }
  
  /**
   * Generate a unique link ID from link data
   * @private
   */
  _generateLinkId(linkData) {
    if (linkData.id) return linkData.id;
    if (linkData.source && linkData.target) {
      return `${linkData.source.userData?.nodeId || linkData.source.id}_${linkData.target.userData?.nodeId || linkData.target.id}`;
    }
    return Math.random().toString(36).substr(2, 9);
  }
  
  /**
   * Batch update multiple links' traffic loads at once
   * Useful for updating all links from a traffic engine
   * @param {Array} linkUpdates - Array of {linkId, trafficLoad}
   */
  batchUpdateLinkThickness(linkUpdates) {
    for (const update of linkUpdates) {
      this.updateLinkThickness(update.linkId, update.trafficLoad);
    }
  }
  
  /**
   * Update configuration values at runtime
   * @param {Object} newConfig - Partial config object
   */
  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
  }
  
  /**
   * Get current thickness state for a link (for debugging/UI)
   * @param {string} linkId - Link identifier
   * @returns {Object} Current thickness state
   */
  getLinkThicknessState(linkId) {
    return this.linkThicknessStates.get(linkId);
  }
  
  /**
   * Get all active links' thickness states
   * @returns {Map} All registered link states
   */
  getAllLinkThicknessStates() {
    return new Map(this.linkThicknessStates);
  }
  
  /**
   * Reset all links to base thickness
   */
  resetAllLinkThickness() {
    for (const state of this.linkThicknessStates.values()) {
      state.targetWidth = this.config.baseWidth;
      state.targetGlowWidth = this.config.baseGlowWidth;
      state.targetOpacity = this.config.baseOpacity;
      state.targetParticleSize = this.config.baseParticleSize;
    }
  }
  
  /**
   * Dispose and clean up resources
   */
  dispose() {
    this.linkThicknessStates.clear();
  }
  
  /**
   * Enable/disable debug logging
   * @param {boolean} enabled
   */
  setDebug(enabled) {
    this.debug = enabled;
  }
}
