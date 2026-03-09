/**
 * ============================================================================
 * LINK GLOW SYNERGY ENGINE v2.0 – Phase 3b Week 2 Upgrade
 * ============================================================================
 * Safe wrapper that integrates VisualMetricModel + ComputeSynergyScore2_1
 * into link glow visualization while maintaining 100% backward compatibility.
 * 
 * DESIGN PHILOSOPHY:
 * - This is NOT a rewrite. This is a soft-integration layer.
 * - Uses synergyNorm from ComputeSynergyScore2_1 when available.
 * - Blends qualityNorm from VisualMetricModel for enhanced effects.
 * - Adds corruption-reactive chaos pulse for chaotic nodes.
 * - Falls back to LinkGlowSynergyEngine1_0 logic if metrics unavailable.
 * - Never modifies shaders or existing VFX systems.
 * - Purely additive read-only layer.
 * 
 * KEY DIFFERENCES FROM 1.0:
 * ✓ Reads synergyNorm (cleaner Phase 3b value)
 * ✓ Blends qualityNorm for quality-aware glow
 * ✓ Adds corruption-reactive pulse for chaos nodes
 * ✓ Produces normalized glow profile (0–1 ready for Week 3 shaders)
 * ✓ Backward compatible: falls back to 1.0 if metrics missing
 * ✓ No shader modifications (Week 3 job)
 * 
 * OUTPUT FORMAT:
 * {
 *   glowIntensity: 0–1,        // Normalized for shaders
 *   synergyNorm: 0–1,          // From ComputeSynergyScore2_1
 *   qualityNorm: 0–1,          // Avg quality of both nodes
 *   corruptionPulse: 0–1,      // Extra pulse for chaotic nodes
 *   updatedAt: timestamp
 * }
 * 
 * INTEGRATION POINTS:
 * - Reads from link.userData.synergy (ComputeSynergyScore2_1 output)
 * - Reads from node.userData.visualMetrics (VisualMetricModel output)
 * - Falls back to LinkGlowSynergyEngine1_0 logic (no modifications to 1.0)
 * - Prepares for Week 3 shader integration (no shader changes yet)
 * 
 * ============================================================================
 */

export class LinkGlowSynergyEngine_v2 {
  /**
   * Initialize the glow engine with system references
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.config = {
      enableVisualMetrics: options.enableVisualMetrics ?? true,
      enableDebug: options.enableDebug ?? false,
      fallbackToLegacy: options.fallbackToLegacy ?? true,
      
      // Week 2 formula weights
      synergyWeight: options.synergyWeight ?? 0.70,      // Synergy dominates (70%)
      qualityWeight: options.qualityWeight ?? 0.30,      // Quality contribution (30%)
      
      // Corruption pulse settings
      enableChaosFlicker: options.enableChaosFlicker ?? true,
      corruptionThreshold: options.corruptionThreshold ?? 0.60,  // When to start flicker
      chaosPulseIntensity: options.chaosPulseIntensity ?? 0.50,  // Max pulse strength
      
      // Visual curve parameters (from LinkGlowSynergyEngine1_0)
      glowCurve: options.glowCurve ?? {
        min: 0.1,
        max: 1.5
      },
      
      // Smoothing
      enableSmoothing: options.enableSmoothing ?? true,
      smoothingFactor: options.smoothingFactor ?? 0.15,
    };
    
    this.stats = {
      computeCount: 0,
      visualMetricsUsed: 0,
      fallbacksUsed: 0,
      averageTimeMs: 0,
      totalTimeMs: 0,
    };
    
    // Cache for performance
    this.glowCache = new Map(); // linkId → { lastProfile, lastUpdate }
  }
  
  /**
   * Main update: compute glow for all links
   * @param {Array} links - Array of link objects to process
   * @param {number} deltaTime - Time since last frame
   */
  update(links, deltaTime = 0.016) {
    if (!links || !Array.isArray(links)) {
      return;
    }
    
    const startMs = performance.now();
    
    try {
      for (const link of links) {
        if (!link) continue;
        
        try {
          const glowProfile = this._computeGlowForLink(link);
          
          if (!link.userData) link.userData = {};
          link.userData.visualGlow = glowProfile;
          
        } catch (err) {
          console.warn('[LinkGlowSynergyEngine_v2] Link glow compute error:', err);
        }
      }
      
      // Track performance
      this._recordPerformance(performance.now() - startMs, links.length);
      
    } catch (err) {
      console.error('[LinkGlowSynergyEngine_v2] Update error:', err);
    }
  }
  
  /**
   * Compute glow profile for a single link
   * This is the core Week 2 logic
   * @private
   */
  _computeGlowForLink(link) {
    try {
      if (!link) {
        return this._safeDefault();
      }
      
      // Get source and target nodes
      const nodeA = link.sourceNode || link.source;
      const nodeB = link.targetNode || link.target;
      
      if (!nodeA || !nodeB) {
        return this._safeDefault();
      }
      
      // Try visual metrics integration first
      if (this.config.enableVisualMetrics) {
        const visualProfile = this._computeVisual(link, nodeA, nodeB);
        
        if (visualProfile) {
          this.stats.visualMetricsUsed++;
          
          const profile = {
            glowIntensity: visualProfile.glowIntensity,
            synergyNorm: visualProfile.synergyNorm,
            qualityNorm: visualProfile.qualityNorm,
            corruptionPulse: visualProfile.corruptionPulse,
            updatedAt: Date.now(),
            debug: {
              method: 'visual',
              nodeAId: nodeA.id || nodeA.uuid,
              nodeBId: nodeB.id || nodeB.uuid,
            }
          };
          
          if (this.config.enableDebug) {
            console.log('[LinkGlowSynergyEngine_v2] Visual profile:', profile);
          }
          
          return profile;
        }
      }
      
      // Fallback: use legacy LinkGlowSynergyEngine1_0 logic
      if (this.config.fallbackToLegacy) {
        this.stats.fallbacksUsed++;
        
        const synergyScore = this._getLegacySynergyScore(link);
        const glowIntensity = this._lerp(
          this.config.glowCurve.min,
          this.config.glowCurve.max,
          synergyScore
        );
        
        if (this.config.enableDebug) {
          console.log('[LinkGlowSynergyEngine_v2] Fallback to legacy:', { synergyScore, glowIntensity });
        }
        
        return {
          glowIntensity: this._clamp01(glowIntensity),
          synergyNorm: synergyScore,
          qualityNorm: 0.5,
          corruptionPulse: 0,
          updatedAt: Date.now(),
          debug: {
            method: 'legacy',
            reason: 'visualMetrics unavailable'
          }
        };
      }
      
      return this._safeDefault();
      
    } catch (err) {
      console.error('[LinkGlowSynergyEngine_v2] Compute error:', err);
      return this._safeDefault();
    }
  }
  
  /**
   * Compute visual glow using Phase 3b metrics
   * Week 2 formula
   * @private
   */
  _computeVisual(link, nodeA, nodeB) {
    try {
      // Get synergy from ComputeSynergyScore2_1 (canonical object)
      const synergy = link.userData?.synergy ?? { score: 0, synergyNorm: 0 };
      const synergyNorm = this._clamp01(
        synergy.synergyNorm ?? synergy.score ?? 0
      );
      
      // ========== WEEK 2 FORMULA ==========
      
      // Get quality metrics from nodes
      const vmA = nodeA.userData?.visualMetrics;
      const vmB = nodeB.userData?.visualMetrics;
      
      let qualityNorm = 0.5; // Default if unavailable
      
      if (vmA && vmB) {
        // Blend quality from both nodes
        qualityNorm = (vmA.qualityNorm + vmB.qualityNorm) / 2;
      }
      
      // Blend synergy + quality for final intensity
      let glowIntensity =
        (synergyNorm * this.config.synergyWeight) +
        (qualityNorm * this.config.qualityWeight);
      
      // Map to glow curve
      glowIntensity = this._lerp(
        this.config.glowCurve.min,
        this.config.glowCurve.max,
        glowIntensity
      );
      
      // ========== CORRUPTION REACTIVE PULSE ==========
      
      let corruptionPulse = 0;
      
      if (this.config.enableChaosFlicker && vmA && vmB) {
        const avgCorruption = (vmA.corruptionNorm + vmB.corruptionNorm) / 2;
        
        if (avgCorruption > this.config.corruptionThreshold) {
          // Chaotic nodes get extra pulse
          corruptionPulse = (avgCorruption - this.config.corruptionThreshold) 
            * this.config.chaosPulseIntensity;
        }
      }
      
      // Add chaos pulse to glow
      glowIntensity += corruptionPulse;
      
      // Clamp to valid range
      glowIntensity = this._clamp01(glowIntensity);
      corruptionPulse = this._clamp01(corruptionPulse);
      
      return {
        glowIntensity,
        synergyNorm: this._clamp01(synergyNorm),
        qualityNorm: this._clamp01(qualityNorm),
        corruptionPulse
      };
      
    } catch (err) {
      if (this.config.enableDebug) {
        console.warn('[LinkGlowSynergyEngine_v2] Visual compute failed:', err);
      }
      return null;
    }
  }
  
  /**
   * Get synergy score from link (legacy fallback)
   * Mirrors LinkGlowSynergyEngine1_0 logic
   * @private
   */
  _getLegacySynergyScore(link) {
    if (!link) return 0.5;
    
    // Try canonical synergy object first
    if (link.userData?.synergy?.score) {
      return this._clamp01(link.userData.synergy.score);
    }
    
    // Try direct property
    if (typeof link['synergyScore'] === 'number') {
      return this._clamp01(link['synergyScore']);
    }
    
    // Try traffic-based estimate
    if (link.traffic?.load) {
      return this._clamp01(link.traffic.load);
    }
    
    return 0.5; // Neutral default
  }
  
  /**
   * Linear interpolation
   * @private
   */
  _lerp(a, b, t) {
    return a + (b - a) * this._clamp01(t);
  }
  
  /**
   * Clamp value to [0, 1]
   * @private
   */
  _clamp01(value) {
    if (!isFinite(value)) return 0.5;
    return Math.max(0, Math.min(1, value));
  }
  
  /**
   * Safe default result
   * @private
   */
  _safeDefault() {
    return {
      glowIntensity: 0.5,
      synergyNorm: 0.5,
      qualityNorm: 0.5,
      corruptionPulse: 0,
      updatedAt: Date.now(),
      debug: {
        error: 'Safe default (no valid input)',
        method: 'default'
      }
    };
  }
  
  /**
   * Record performance metrics
   * @private
   */
  _recordPerformance(elapsedMs, linkCount) {
    this.stats.computeCount++;
    this.stats.totalTimeMs += elapsedMs;
    this.stats.averageTimeMs = this.stats.totalTimeMs / this.stats.computeCount;
    
    if (this.config.enableDebug && elapsedMs > 1) {
      console.warn(
        `[LinkGlowSynergyEngine_v2] Slow compute: ${elapsedMs.toFixed(2)}ms for ${linkCount} links`
      );
    }
  }
  
  /**
   * Get performance statistics
   */
  getStats() {
    return {
      ...this.stats,
      visualMetricsUsagePercent: this.stats.computeCount > 0
        ? ((this.stats.visualMetricsUsed / this.stats.computeCount) * 100).toFixed(1)
        : '0',
      fallbackUsagePercent: this.stats.computeCount > 0
        ? ((this.stats.fallbacksUsed / this.stats.computeCount) * 100).toFixed(1)
        : '0',
    };
  }
  
  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      computeCount: 0,
      visualMetricsUsed: 0,
      fallbacksUsed: 0,
      averageTimeMs: 0,
      totalTimeMs: 0,
    };
  }
  
  /**
   * Enable/disable debug logging
   */
  setDebug(enabled) {
    this.config.enableDebug = enabled;
  }
  
  /**
   * Get glow profile for a specific link (for debugging)
   */
  getGlowProfile(link) {
    if (!link || !link.userData) {
      return null;
    }
    return link.userData.visualGlow ?? null;
  }
}

// Default export: class instance factory
export function createLinkGlowEngine(options = {}) {
  return new LinkGlowSynergyEngine_v2(options);
}

export default LinkGlowSynergyEngine_v2;
