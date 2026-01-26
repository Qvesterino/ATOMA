/**
 * ============================================================================
 * PARTICLE EMISSION SCALER v1.0
 * ============================================================================
 * 
 * RESPONSIBILITY:
 * Scale particle emission rates across the network based on:
 * - Network corruption (0-1 scale)
 * - Network stress / load pressure
 * - Link quality degradation
 * - Per-node corruption levels
 * 
 * DESIGN:
 * - Particles emit MORE frequently under corruption/stress
 * - Visual manifestation of network instability
 * - Scales all particle systems (links, nodes, glyphs)
 * - Per-frame calculation, no fixed schedules
 * - Multiple scaling curves available (linear, exponential, sigmoid)
 * 
 * INTEGRATION:
 * const emissionScaler = new ParticleEmissionScaler(nodeDynamicMetrics, linkingSystem);
 * 
 * // Per-frame update
 * emissionScaler.update(deltaTime);
 * 
 * // Query emission multiplier for effects
 * const multiplier = emissionScaler.getEmissionMultiplier();
 * const perLinkMult = emissionScaler.getLinkEmissionMultiplier(link);
 * 
 * ============================================================================
 */

export class ParticleEmissionScaler {
  constructor(nodeDynamicMetrics, linkingSystem, config = {}) {
    this.nodeDynamicMetrics = nodeDynamicMetrics;
    this.linkingSystem = linkingSystem;
    
    // Configuration
    this.config = {
      // Network-level scaling
      useNetworkCorruption: config.useNetworkCorruption ?? true,
      useNetworkStress: config.useNetworkStress ?? true,
      useNetworkLoad: config.useNetworkLoad ?? true,
      
      // Corruption scaling curve
      corruptionCurve: config.corruptionCurve ?? 'exponential',  // 'linear', 'exponential', 'sigmoid'
      corruptionMultiplier: config.corruptionMultiplier ?? 2.0,   // Max 2x at max corruption
      corruptionThreshold: config.corruptionThreshold ?? 0.3,     // Start scaling at 30%
      
      // Stress scaling curve
      stressCurve: config.stressCurve ?? 'exponential',
      stressMultiplier: config.stressMultiplier ?? 1.5,           // Max 1.5x at max stress
      stressThreshold: config.stressThreshold ?? 0.4,             // Start at 40% stress
      
      // Load scaling
      loadMultiplier: config.loadMultiplier ?? 1.2,               // Max 1.2x at max load
      loadThreshold: config.loadThreshold ?? 0.7,                 // Start at 70% load
      
      // Per-link scaling
      perLinkCorruptionMultiplier: config.perLinkCorruptionMultiplier ?? 1.5,
      perLinkDegradationMultiplier: config.perLinkDegradationMultiplier ?? 1.3,
      
      // Temporal smoothing (EMA)
      emissionEMAAlpha: config.emissionEMAAlpha ?? 0.15,           // Smooth transitions
      
      // Performance
      enabled: config.enabled !== false,
      debugMode: config.debugMode ?? false,
    };
    
    // State tracking
    this.currentEmissionMultiplier = 1.0;
    this.smoothedEmissionMultiplier = 1.0;
    this.lastUpdateTime = Date.now();
    
    // Per-link tracking
    this.linkEmissionMultipliers = new Map();
    
    // Metrics cache (updated each frame)
    this.cachedMetrics = {
      networkCorruption: 0,
      networkStress: 0,
      networkLoad: 0,
      avgLinkDegradation: 0,
    };
    
    if (this.config.enabled) {
      console.log('[ParticleEmissionScaler] Initialized');
      console.log(`  Corruption curve: ${this.config.corruptionCurve}`);
      console.log(`  Stress curve: ${this.config.stressCurve}`);
      console.log(`  Max multiplier: ${Math.max(this.config.corruptionMultiplier, this.config.stressMultiplier).toFixed(2)}x`);
    }
  }
  
  /**
   * Main update cycle - call once per frame
   * @param {number} deltaTime - Time elapsed since last frame (in seconds)
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;

    if (!this.config.enabled) return;
    
    // Update cached metrics
    this._updateNetworkMetrics();
    
    // Calculate raw emission multiplier
    let multiplier = this._computeEmissionMultiplier();
    
    // Apply EMA smoothing
    this.currentEmissionMultiplier = multiplier;
    this.smoothedEmissionMultiplier = this._applyEMA(
      multiplier,
      this.smoothedEmissionMultiplier,
      this.config.emissionEMAAlpha,
      deltaTime
    );
    
    // Update per-link multipliers
    this._updatePerLinkMultipliers();
    
    if (this.config.debugMode) {
      console.log(`[ParticleEmissionScaler] Emission: ${this.smoothedEmissionMultiplier.toFixed(2)}x`);
    }
  }
  
  /**
   * Update cached network metrics from source systems
   * @private
   */
  _updateNetworkMetrics() {
    // Network corruption (average corruption across all nodes)
    if (this.nodeDynamicMetrics) {
      let totalCorruption = 0;
      let nodeCount = 0;
      
      if (this.nodeDynamicMetrics.nodes) {
        for (const node of this.nodeDynamicMetrics.nodes) {
          const nodeMetrics = node.userData?.metrics;
          if (nodeMetrics) {
            totalCorruption += nodeMetrics.corruption ?? 0;
            nodeCount++;
          }
        }
      }
      
      this.cachedMetrics.networkCorruption = nodeCount > 0 
        ? Math.min(1.0, totalCorruption / nodeCount)
        : 0;
    }
    
    // Network stress (average load pressure)
    if (this.linkingSystem && this.nodeDynamicMetrics) {
      let totalLoad = 0;
      let nodeCount = 0;
      
      if (this.nodeDynamicMetrics.nodes) {
        for (const node of this.nodeDynamicMetrics.nodes) {
          const currentLinks = node.userData?.currentLinks ?? 0;
          const maxCapacity = node.userData?.maxLinkCapacity ?? 1;
          const load = Math.min(1.0, currentLinks / Math.max(1, maxCapacity));
          totalLoad += load;
          nodeCount++;
        }
      }
      
      this.cachedMetrics.networkStress = nodeCount > 0 
        ? Math.min(1.0, totalLoad / nodeCount)
        : 0;
      
      // Network load (same as stress for now)
      this.cachedMetrics.networkLoad = this.cachedMetrics.networkStress;
    }
    
    // Average link degradation
    let totalDegradation = 0;
    let linkCount = 0;
    
    if (this.linkingSystem && this.linkingSystem.links) {
      for (const link of this.linkingSystem.links) {
        const quality = link.userData?.quality;
        if (quality) {
          // Invert quality to get degradation (0 quality = 1 degradation)
          const degradation = Math.max(0, 1.0 - (quality.score / 100));
          totalDegradation += degradation;
          linkCount++;
        }
      }
    }
    
    this.cachedMetrics.avgLinkDegradation = linkCount > 0
      ? Math.min(1.0, totalDegradation / linkCount)
      : 0;
  }
  
  /**
   * Compute network-wide emission multiplier
   * @private
   */
  _computeEmissionMultiplier() {
    let multiplier = 1.0;
    
    // Apply corruption scaling
    if (this.config.useNetworkCorruption) {
      const corruptionFactor = this._computeCurveFactor(
        this.cachedMetrics.networkCorruption,
        this.config.corruptionThreshold,
        this.config.corruptionCurve
      );
      multiplier *= 1.0 + (corruptionFactor * (this.config.corruptionMultiplier - 1.0));
    }
    
    // Apply stress scaling
    if (this.config.useNetworkStress) {
      const stressFactor = this._computeCurveFactor(
        this.cachedMetrics.networkStress,
        this.config.stressThreshold,
        this.config.stressCurve
      );
      multiplier *= 1.0 + (stressFactor * (this.config.stressMultiplier - 1.0));
    }
    
    // Apply load scaling
    if (this.config.useNetworkLoad) {
      const loadFactor = this._computeCurveFactor(
        this.cachedMetrics.networkLoad,
        this.config.loadThreshold,
        'linear'
      );
      multiplier *= 1.0 + (loadFactor * (this.config.loadMultiplier - 1.0));
    }
    
    // Clamp to reasonable range
    return Math.max(1.0, Math.min(3.0, multiplier));
  }
  
  /**
   * Compute curve factor (0-1) based on input and curve type
   * @private
   */
  _computeCurveFactor(value, threshold, curveType) {
    if (value < threshold) return 0;
    
    // Normalize to 0-1 range above threshold
    const normalized = Math.min(1.0, (value - threshold) / (1.0 - threshold));
    
    switch (curveType) {
      case 'linear':
        return normalized;
      
      case 'exponential':
        // Accelerates as value increases
        return Math.pow(normalized, 1.5);
      
      case 'sigmoid':
        // S-curve: starts slow, accelerates, then plateaus
        return 1.0 / (1.0 + Math.exp(-10.0 * (normalized - 0.5)));
      
      default:
        return normalized;
    }
  }
  
  /**
   * Update per-link emission multipliers
   * @private
   */
  _updatePerLinkMultipliers() {
    if (!this.linkingSystem || !this.linkingSystem.links) return;
    
    for (const link of this.linkingSystem.links) {
      const linkId = this._getLinkId(link);
      
      let linkMultiplier = 1.0;
      
      // Scale by link corruption
      const quality = link.userData?.quality;
      if (quality) {
        const corruption = (quality.corruption ?? 0) / 100;
        linkMultiplier *= 1.0 + (corruption * (this.config.perLinkCorruptionMultiplier - 1.0));
        
        // Scale by degradation
        const degradation = Math.max(0, 1.0 - (quality.score / 100));
        linkMultiplier *= 1.0 + (degradation * (this.config.perLinkDegradationMultiplier - 1.0));
      }
      
      // Clamp
      linkMultiplier = Math.max(1.0, Math.min(3.0, linkMultiplier));
      
      this.linkEmissionMultipliers.set(linkId, linkMultiplier);
    }
  }
  
  /**
   * Get network-wide emission multiplier
   * Smoothed value for smooth transitions
   * @returns {number} Multiplier (1.0 = baseline, >1.0 = increased emission)
   */
  getEmissionMultiplier() {
    return this.smoothedEmissionMultiplier;
  }
  
  /**
   * Get raw (unsmoothed) emission multiplier
   * @returns {number} Current raw multiplier
   */
  getRawEmissionMultiplier() {
    return this.currentEmissionMultiplier;
  }
  
  /**
   * Get per-link emission multiplier
   * @param {Object} link - Link to query
   * @returns {number} Link-specific multiplier
   */
  getLinkEmissionMultiplier(link) {
    if (!link) return 1.0;
    const linkId = this._getLinkId(link);
    return this.linkEmissionMultipliers.get(linkId) ?? 1.0;
  }
  
  /**
   * Get per-node emission multiplier (based on node corruption)
   * @param {Object} node - Node to query
   * @returns {number} Node-specific multiplier
   */
  getNodeEmissionMultiplier(node) {
    if (!node) return 1.0;
    
    const nodeMetrics = node.userData?.metrics;
    if (!nodeMetrics) return 1.0;
    
    const corruption = Math.min(1.0, (nodeMetrics.corruption ?? 0) / 100);
    const multiplier = 1.0 + (corruption * (this.config.perLinkCorruptionMultiplier - 1.0));
    return Math.max(1.0, Math.min(3.0, multiplier));
  }
  
  /**
   * Get current network metrics (for diagnostics)
   * @returns {Object} Current metric values
   */
  getNetworkMetrics() {
    return {
      corruption: this.cachedMetrics.networkCorruption.toFixed(3),
      stress: this.cachedMetrics.networkStress.toFixed(3),
      load: this.cachedMetrics.networkLoad.toFixed(3),
      avgLinkDegradation: this.cachedMetrics.avgLinkDegradation.toFixed(3),
      emissionMultiplier: this.smoothedEmissionMultiplier.toFixed(3),
      rawMultiplier: this.currentEmissionMultiplier.toFixed(3),
    };
  }
  
  /**
   * Get emission statistics across all links
   * @returns {Object} Statistics
   */
  getEmissionStatistics() {
    if (this.linkEmissionMultipliers.size === 0) {
      return {
        totalLinks: 0,
        avgMultiplier: 1.0,
        minMultiplier: 1.0,
        maxMultiplier: 1.0,
      };
    }
    
    const values = Array.from(this.linkEmissionMultipliers.values());
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      totalLinks: values.length,
      avgMultiplier: (sum / values.length).toFixed(3),
      minMultiplier: Math.min(...values).toFixed(3),
      maxMultiplier: Math.max(...values).toFixed(3),
    };
  }
  
  /**
   * Apply exponential moving average smoothing
   * @private
   */
  _applyEMA(current, previous, alpha, deltaTime) {
    // Adjust alpha based on deltaTime for frame-rate independence
    const adjustedAlpha = Math.min(1.0, alpha * deltaTime * 60); // Assume 60fps baseline
    return previous * (1 - adjustedAlpha) + current * adjustedAlpha;
  }
  
  /**
   * Generate consistent link ID
   * @private
   */
  _getLinkId(link) {
    if (!link.source || !link.target) {
      return 'unknown';
    }
    
    const id1 = link.source.userData?.id ?? link.source.uuid ?? 'src';
    const id2 = link.target.userData?.id ?? link.target.uuid ?? 'tgt';
    
    return `${id1}→${id2}`;
  }
  
  /**
   * Reset all state (useful for world resets)
   */
  reset() {
    this.currentEmissionMultiplier = 1.0;
    this.smoothedEmissionMultiplier = 1.0;
    this.linkEmissionMultipliers.clear();
    this.cachedMetrics = {
      networkCorruption: 0,
      networkStress: 0,
      networkLoad: 0,
      avgLinkDegradation: 0,
    };
  }
  
  /**
   * Destroy system
   */
  destroy() {
    this.reset();
  }
}
