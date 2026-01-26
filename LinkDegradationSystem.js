/**
 * ============================================================================
 * LINK DEGRADATION SYSTEM v1.0
 * ============================================================================
 * 
 * Applies dynamic quality-based degradation to link effects based on node load
 * pressure. Links remain possible but gradually lose effectiveness as nodes
 * approach capacity.
 * 
 * DESIGN:
 * - Link quality already calculated by LinkQualityCalculator
 * - Degradation maps quality score → efficiency multiplier (0.0 - 1.0)
 * - Effects scaled by efficiency: visual intensity, metrics contribution, etc.
 * - Gradual degradation, no hard cutoffs
 * 
 * INTEGRATION:
 * const degradation = new LinkDegradationSystem(linkingSystem, linkQualityCalc);
 * 
 * UPDATE LOOP (in main game loop):
 * degradation.update(deltaTime);
 * 
 * READ ACCESS (from visual/metrics systems):
 * const efficiency = degradation.getLinkEfficiency(link);  // 0.0 - 1.0
 * const degradation_state = degradation.getDegradationState(link);
 * 
 * ============================================================================
 */

export class LinkDegradationSystem {
  /**
   * Initialize the link degradation system
   * @param {NodeLinkingSystem} linkingSystem - Reference to linking system
   * @param {LinkQualityCalculator} linkQualityCalculator - Quality calculator
   * @param {Object} config - Optional configuration
   */
  constructor(linkingSystem, linkQualityCalculator, config = {}) {
    this.linkingSystem = linkingSystem;
    this.linkQualityCalculator = linkQualityCalculator;
    
    // Configuration
    this.config = {
      // Quality thresholds (0-100 scale)
      // These align with LinkQualityCalculator levels:
      // High (80+), Medium (55-80), Low (30-55), Critical (<30)
      fullQualityThreshold: config.fullQualityThreshold ?? 80,      // 100% efficiency
      degradedStartThreshold: config.degradedStartThreshold ?? 55,  // Begin degradation
      severeThreshold: config.severeThreshold ?? 30,                // Heavy degradation
      criticalThreshold: config.criticalThreshold ?? 10,            // Near collapse
      
      // Load ratio interpretation
      // These map directly to quality reduction in LinkQualityCalculator
      maxLoadRatio: config.maxLoadRatio ?? 1.0,  // 100% capacity = 0% efficiency
      
      // Degradation curve shaping
      // Uses exponential falloff for smoother feel at low load
      enableExponentialFalloff: config.enableExponentialFalloff ?? true,
      exponentialPower: config.exponentialPower ?? 1.5,  // >1.0 = favor high quality
      
      // Visual effect parameters
      minVisualIntensity: config.minVisualIntensity ?? 0.15,  // Don't go fully invisible
      minParticleEmission: config.minParticleEmission ?? 0.20,  // Some particles always
      
      // Noise/delay simulation
      enableLoadNoise: config.enableLoadNoise ?? true,
      maxLoadNoiseIntensity: config.maxLoadNoiseIntensity ?? 0.3,
      
      // Metrics contribution scaling
      enableMetricsScaling: config.enableMetricsScaling ?? true,
      minMetricsContribution: config.minMetricsContribution ?? 0.1
    };
    
    // Per-link degradation tracking
    this.degradationCache = new Map();  // linkId → degradationState
    
    // Performance tracking
    this.diagnostics = {
      lastUpdateTime: 0,
      totalUpdateTime: 0,
      linksProcessed: 0,
      slowWarnings: 0
    };
  }
  
  /**
   * Main update cycle - call once per frame
   * @param {number} deltaTime - Frame time in seconds
   */
  update(deltaTime) {
    if (!this.linkingSystem || !this.linkingSystem.links) {
      return;
    }
    if (!this.frameScheduler?.shouldRunSimulation?.()) return;
    const startTime = performance.now();
    
    // Update degradation for all links
    for (const link of this.linkingSystem.links) {
      this._updateLinkDegradation(link);
    }
    
    const updateTime = performance.now() - startTime;
    this.diagnostics.lastUpdateTime = updateTime;
    this.diagnostics.totalUpdateTime += updateTime;
    this.diagnostics.linksProcessed = this.linkingSystem.links.length;
    
    // Warn if too slow
    if (updateTime > 1.0) {
      this.diagnostics.slowWarnings++;
      console.warn(`[LinkDegradationSystem] Slow update: ${updateTime.toFixed(2)}ms`);
    }
  }
  
  /**
   * Update degradation state for a single link
   * @private
   */
  _updateLinkDegradation(link) {
    // Get quality score from LinkQualityCalculator
    const quality = this.linkQualityCalculator?.getLinkQuality(link);
    if (!quality) {
      return;  // No quality data yet
    }
    
    const qualityScore = quality.score ?? 50;
    const loadRatio = this._computeLoadRatio(link);
    
    // Compute efficiency multiplier (0.0 - 1.0)
    // Efficiency inversely correlates with load pressure
    const efficiency = this._computeEfficiency(qualityScore, loadRatio);
    
    // Determine degradation state
    const degradationState = this._getDegradationState(qualityScore, efficiency, loadRatio);
    
    // Store in link userData for access by other systems
    if (!link.userData) {
      link.userData = {};
    }
    
    link.userData.degradation = {
      efficiency: efficiency,
      state: degradationState,
      qualityScore: qualityScore,
      loadRatio: loadRatio,
      visualIntensity: this._computeVisualIntensity(efficiency),
      particleEmissionRate: this._computeParticleRate(efficiency),
      loadNoise: this.config.enableLoadNoise ? this._computeLoadNoise(loadRatio) : 0,
      metricsWeight: this.config.enableMetricsScaling ? this._computeMetricsWeight(efficiency) : 1.0,
      updatedAt: Date.now()
    };
    
    // Cache for quick access
    const linkId = this._getLinkId(link);
    this.degradationCache.set(linkId, link.userData.degradation);
  }
  
  /**
   * Compute load ratio for a link's nodes
   * (Average of source and target load ratios)
   * @private
   */
  _computeLoadRatio(link) {
    if (!link.source || !link.target) return 0;
    
    // Get load ratios if available (from NodeDynamicMetrics)
    const sourceLoadRatio = link.source.userData?.metrics?.loadRatio ?? 0;
    const targetLoadRatio = link.target.userData?.metrics?.loadRatio ?? 0;
    
    // Average the two
    const avgLoadRatio = (sourceLoadRatio + targetLoadRatio) / 2;
    return Math.max(0, Math.min(1, avgLoadRatio));  // Clamp 0-1
  }
  
  /**
   * Compute efficiency multiplier from quality score
   * Efficiency = how well the link is functioning (0.0 = broken, 1.0 = perfect)
   * 
   * Quality progression:
   * - score 80+ → efficiency 1.0 (full)
   * - score 55  → efficiency 0.5 (half)
   * - score 30  → efficiency 0.2 (weak)
   * - score 0   → efficiency 0.0 (dead)
   * 
   * @private
   */
  _computeEfficiency(qualityScore, loadRatio) {
    // Clamp quality score
    const score = Math.max(0, Math.min(100, qualityScore));
    
    if (this.config.enableExponentialFalloff) {
      // Exponential falloff: favor high quality
      // At power=1.5, maintains good performance until ~50% capacity
      const normalized = score / 100;
      const efficiency = Math.pow(normalized, 1 / this.config.exponentialPower);
      return Math.max(0, Math.min(1, efficiency));
    } else {
      // Linear falloff
      return score / 100;
    }
  }
  
  /**
   * Determine qualitative degradation state
   * @private
   */
  _getDegradationState(qualityScore, efficiency, loadRatio) {
    if (qualityScore >= this.config.fullQualityThreshold) {
      return 'optimal';
    } else if (qualityScore >= this.config.degradedStartThreshold) {
      return 'nominal';  // Slight degradation
    } else if (qualityScore >= this.config.severeThreshold) {
      return 'degraded';  // Noticeable degradation
    } else if (qualityScore >= this.config.criticalThreshold) {
      return 'strained';  // Heavy degradation
    } else {
      return 'critical';  // Near collapse
    }
  }
  
  /**
   * Compute visual intensity multiplier
   * Used to scale glyph brightness, saturation, etc.
   * @private
   */
  _computeVisualIntensity(efficiency) {
    const minIntensity = this.config.minVisualIntensity;
    const intensity = minIntensity + (efficiency * (1 - minIntensity));
    return Math.max(0, Math.min(1, intensity));
  }
  
  /**
   * Compute particle emission rate multiplier
   * @private
   */
  _computeParticleRate(efficiency) {
    const minRate = this.config.minParticleEmission;
    const rate = minRate + (efficiency * (1 - minRate));
    return Math.max(0, Math.min(1, rate));
  }
  
  /**
   * Compute load noise/jitter intensity
   * Higher load = more noise in transmission
   * @private
   */
  _computeLoadNoise(loadRatio) {
    const maxNoise = this.config.maxLoadNoiseIntensity;
    // Exponential: noise increases rapidly as load approaches capacity
    const noise = Math.pow(loadRatio, 1.5) * maxNoise;
    return Math.max(0, Math.min(maxNoise, noise));
  }
  
  /**
   * Compute metrics contribution weight
   * Lower efficiency = lower contribution to network metrics
   * @private
   */
  _computeMetricsWeight(efficiency) {
    const minWeight = this.config.minMetricsContribution;
    const weight = minWeight + (efficiency * (1 - minWeight));
    return Math.max(0, Math.min(1, weight));
  }
  
  /**
   * Get efficiency multiplier for a link (0.0 - 1.0)
   * @public
   */
  getLinkEfficiency(link) {
    if (!link || !link.userData || !link.userData.degradation) {
      return 1.0;  // Default: fully efficient
    }
    return link.userData.degradation.efficiency ?? 1.0;
  }
  
  /**
   * Get full degradation state for a link
   * @public
   */
  getDegradationState(link) {
    if (!link || !link.userData || !link.userData.degradation) {
      return null;
    }
    return link.userData.degradation;
  }
  
  /**
   * Get visual intensity for a link (for glyph rendering)
   * @public
   */
  getVisualIntensity(link) {
    const state = this.getDegradationState(link);
    return state ? state.visualIntensity : 1.0;
  }
  
  /**
   * Get particle emission rate for a link
   * @public
   */
  getParticleEmissionRate(link) {
    const state = this.getDegradationState(link);
    return state ? state.particleEmissionRate : 1.0;
  }
  
  /**
   * Get load noise for a link
   * (Used to add jitter to visual effects)
   * @public
   */
  getLoadNoise(link) {
    const state = this.getDegradationState(link);
    return state ? state.loadNoise : 0;
  }
  
  /**
   * Get metrics contribution weight for a link
   * @public
   */
  getMetricsWeight(link) {
    const state = this.getDegradationState(link);
    return state ? state.metricsWeight : 1.0;
  }
  
  /**
   * Check if link is under load pressure
   * @public
   */
  isUnderLoadPressure(link) {
    const state = this.getDegradationState(link);
    if (!state) return false;
    
    const efficiency = state.efficiency;
    return efficiency < 0.9;  // Under pressure if <90% efficient
  }
  
  /**
   * Check if link is critically strained
   * @public
   */
  isCriticallyStrained(link) {
    const state = this.getDegradationState(link);
    if (!state) return false;
    
    return state.state === 'critical' || state.state === 'strained';
  }
  
  /**
   * Get all links sorted by degradation severity
   * (Most degraded first)
   * @public
   */
  getLinksSortedByDegradation(descending = true) {
    if (!this.linkingSystem || !this.linkingSystem.links) {
      return [];
    }
    
    const sorted = [...this.linkingSystem.links].filter(link => {
      const state = this.getDegradationState(link);
      return state && 'efficiency' in state;
    }).sort((a, b) => {
      const effA = this.getLinkEfficiency(a);
      const effB = this.getLinkEfficiency(b);
      return descending ? effA - effB : effB - effA;  // Ascending = best first
    });
    
    return sorted;
  }
  
  /**
   * Get links by degradation state
   * @public
   */
  getLinksByState(state) {
    if (!this.linkingSystem || !this.linkingSystem.links) {
      return [];
    }
    
    return this.linkingSystem.links.filter(link => {
      const linkState = this.getDegradationState(link);
      return linkState && linkState.state === state;
    });
  }
  
  /**
   * Get degradation statistics
   * @public
   */
  getDegradationStatistics() {
    if (!this.linkingSystem || !this.linkingSystem.links) {
      return null;
    }
    
    const links = this.linkingSystem.links.filter(link => {
      const state = this.getDegradationState(link);
      return state && 'efficiency' in state;
    });
    
    if (links.length === 0) {
      return null;
    }
    
    const efficiencies = links.map(link => this.getLinkEfficiency(link));
    const avgEfficiency = efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length;
    const minEfficiency = Math.min(...efficiencies);
    const maxEfficiency = Math.max(...efficiencies);
    
    const stateCounts = {
      optimal: 0,
      nominal: 0,
      degraded: 0,
      strained: 0,
      critical: 0
    };
    
    links.forEach(link => {
      const linkState = this.getDegradationState(link);
      if (linkState && linkState.state in stateCounts) {
        stateCounts[linkState.state]++;
      }
    });
    
    const underLoadCount = links.filter(l => this.isUnderLoadPressure(l)).length;
    const criticalCount = links.filter(l => this.isCriticallyStrained(l)).length;
    
    return {
      totalLinks: links.length,
      averageEfficiency: avgEfficiency,
      minEfficiency: minEfficiency,
      maxEfficiency: maxEfficiency,
      stateCounts: stateCounts,
      linksUnderLoadPressure: underLoadCount,
      linksCriticallyStrained: criticalCount,
      timestamp: Date.now()
    };
  }
  
  /**
   * Get unique link identifier
   * @private
   */
  _getLinkId(link) {
    if (!link) return null;
    
    if (link.sourceNodeId && link.targetNodeId) {
      return `${link.sourceNodeId}_to_${link.targetNodeId}`;
    }
    
    const sourceId = link.source?.id || link.source?.uuid || 'unknown';
    const targetId = link.target?.id || link.target?.uuid || 'unknown';
    
    return `${sourceId}_to_${targetId}`;
  }
  
  /**
   * Debug output - dump all degradation states
   * @public
   */
  debugDumpAllDegradations() {
    if (!this.linkingSystem || !this.linkingSystem.links) {
      console.warn('[LinkDegradationSystem] No links available');
      return;
    }
    
    console.group('[LinkDegradationSystem] All Link Degradations');
    
    for (const link of this.linkingSystem.links) {
      const state = this.getDegradationState(link);
      if (state) {
        const sourceName = link.source?.userData?.name ?? `Node${link.source?.id}`;
        const targetName = link.target?.userData?.name ?? `Node${link.target?.id}`;
        
        console.log(`${sourceName} → ${targetName}:`, {
          efficiency: state.efficiency.toFixed(2),
          state: state.state,
          qualityScore: state.qualityScore.toFixed(1),
          loadRatio: state.loadRatio.toFixed(2),
          visualIntensity: state.visualIntensity.toFixed(2),
          particleRate: state.particleEmissionRate.toFixed(2),
          loadNoise: state.loadNoise.toFixed(3),
          metricsWeight: state.metricsWeight.toFixed(2)
        });
      }
    }
    
    console.groupEnd();
  }
  
  /**
   * Dispose resources
   * @public
   */
  dispose() {
    this.degradationCache.clear();
  }
}

/**
 * Factory function for convenient initialization
 * Usage: const degradation = getLinkDegradationSystem(linkingSystem, qualityCalculator);
 */
export function getLinkDegradationSystem(linkingSystem, linkQualityCalculator, config = {}) {
  return new LinkDegradationSystem(linkingSystem, linkQualityCalculator, config);
}
