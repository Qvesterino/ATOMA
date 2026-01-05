/**
 * ============================================================================
 * COMPUTE SYNERGY SCORE 2.1 – Phase 3b Week 1 Upgrade
 * ============================================================================
 * Safe wrapper upgrade that integrates VisualMetricModel values into synergy
 * calculations while maintaining 100% backward compatibility with 2.0.
 * 
 * DESIGN PHILOSOPHY:
 * - This is NOT a rewrite. This is a soft-integration layer.
 * - When visualMetrics exist, use them to generate cleaner synergy values.
 * - When visualMetrics don't exist, fall back to original ComputeSynergyScore2_0.
 * - Never modify 2.0 logic, VFX, shaders, or node personality.
 * - Prepare for Week 2 visual shader transitions without breaking anything.
 * 
 * KEY DIFFERENCES FROM 2.0:
 * ✓ Introduces synergyNorm (0–1) when visualMetrics available
 * ✓ Uses harmonyNorm, stabilityNorm, corruptionNorm as primary inputs
 * ✓ Cleaner, more deterministic synergy values
 * ✓ Backward compatible: falls back to 2.0 if visualMetrics missing
 * ✓ Adds placeholder hooks for Week 2–4 enhancements
 * 
 * OUTPUT FORMAT:
 * {
 *   score: <legacy 0–1, from ComputeSynergyScore2_0>,
 *   synergyNorm: <new 0–1 from visualMetrics OR score>,
 *   tier: 'low' | 'medium' | 'high' | 'critical',
 *   components: { type, priority, traffic, decay, topology },
 *   visualIntegration: { harmonyNorm, stabilityNorm, corruptionNorm, energyNorm },
 *   debug: { ... }
 * }
 * 
 * INTEGRATION POINTS:
 * - Reads from node.userData.visualMetrics (Phase 3b foundation)
 * - Falls back to ComputeSynergyScore2_0 logic (no modifications to 2.0)
 * - Prepares for LinkGlowSynergyEngine integration (Week 1)
 * - Ready for shader transitions (Week 2+)
 * 
 * ============================================================================
 */

import { computeSynergyScore as computeSynergyScore2_0 } from './ComputeSynergyScore2_0.js';

export class ComputeSynergyScore2_1 {
  /**
   * Initialize the synergy calculator with options
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.config = {
      enableVisualMetrics: options.enableVisualMetrics ?? true,
      enableDebug: options.enableDebug ?? false,
      fallbackToLegacy: options.fallbackToLegacy ?? true,
      
      // Week 1 baseline formula weights for visualMetrics integration
      visualWeights: options.visualWeights ?? {
        harmony: 0.40,      // Connection harmony (primary driver)
        stability: 0.30,    // Node stability
        corruption: 0.20,   // Corruption penalty (inverted)
        energy: 0.10        // Energy factor
      },
      
      // Tier thresholds (same as 2.0, can be customized)
      tierThresholds: options.tierThresholds ?? {
        low: 0.25,
        medium: 0.50,
        high: 0.75,
        critical: 1.0
      },
      
      // Enhancement hooks (placeholders for Week 2–4)
      applyEnergyFactor: options.applyEnergyFactor ?? false,
      applyHarmonyBoost: options.applyHarmonyBoost ?? false,
      applyChaosPenalty: options.applyChaosPenalty ?? false,
    };
    
    this.stats = {
      computeCount: 0,
      visualMetricsUsed: 0,
      fallbacksUsed: 0,
      averageTimeMs: 0,
      totalTimeMs: 0,
    };
  }
  
  /**
   * Main compute function: computes synergy for a link
   * Returns both legacy score and new synergyNorm
   * @param {Object} link - The link object
   * @param {Object} systemsConfig - Systems configuration (passed to 2.0)
   * @returns {Object} Synergy result with score, synergyNorm, tier, etc.
   */
  compute(link, systemsConfig = {}) {
    const startMs = performance.now();
    
    try {
      // Safety check
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
        const visualResult = this._computeVisual(nodeA, nodeB);
        
        if (visualResult) {
          // Visual metrics successfully used
          this.stats.visualMetricsUsed++;
          
          // Still compute legacy score for backward compatibility
          const legacyResult = this._computeLegacy(link, systemsConfig);
          
          // Merge results
          const finalResult = {
            score: legacyResult.score,                    // Keep legacy score
            synergyNorm: visualResult.synergyNorm,        // New normalized value
            tier: this._assignTier(visualResult.synergyNorm),
            components: legacyResult.components,          // Keep legacy components
            visualIntegration: visualResult.factors,      // Show what visual metrics contributed
            debug: {
              method: 'visual',
              nodeAId: nodeA.id || nodeA.uuid,
              nodeBId: nodeB.id || nodeB.uuid,
              visualMetricsAvailable: true,
            }
          };
          
          // Track performance
          this._recordPerformance(performance.now() - startMs);
          
          if (this.config.enableDebug) {
            console.log('[ComputeSynergyScore2_1] Visual integration used:', finalResult);
          }
          
          return finalResult;
        }
      }
      
      // Fallback: use legacy ComputeSynergyScore2_0
      if (this.config.fallbackToLegacy) {
        this.stats.fallbacksUsed++;
        const legacyResult = this._computeLegacy(link, systemsConfig);
        
        // Track performance
        this._recordPerformance(performance.now() - startMs);
        
        if (this.config.enableDebug) {
          console.log('[ComputeSynergyScore2_1] Fallback to legacy 2.0');
        }
        
        return {
          ...legacyResult,
          synergyNorm: legacyResult.score,  // Use legacy score as synergyNorm
          visualIntegration: null,
          debug: {
            method: 'legacy',
            reason: 'visualMetrics unavailable or disabled',
          }
        };
      }
      
      // Both disabled: return safe default
      return this._safeDefault();
      
    } catch (err) {
      console.error('[ComputeSynergyScore2_1] Compute error:', err);
      this._recordPerformance(performance.now() - startMs);
      return this._safeDefault();
    }
  }
  
  /**
   * Compute synergy using visual metrics from Phase 3
   * Only called when visualMetrics are available on both nodes
   * @private
   */
  _computeVisual(nodeA, nodeB) {
    try {
      // Extract visual metrics from both nodes
      const vmA = nodeA.userData?.visualMetrics;
      const vmB = nodeB.userData?.visualMetrics;
      
      // Both nodes must have visual metrics
      if (!vmA || !vmB) {
        return null;
      }
      
      // ========== WEEK 1 BASELINE FORMULA ==========
      // Blend metrics from both nodes using average (symmetric)
      
      const harmonyNorm = (vmA.harmonyNorm + vmB.harmonyNorm) / 2;
      const stabilityNorm = (vmA.stabilityNorm + vmB.stabilityNorm) / 2;
      const corruptionNorm = (vmA.corruptionNorm + vmB.corruptionNorm) / 2;
      const energyNorm = (vmA.energyNorm + vmB.energyNorm) / 2;
      
      // Compute base synergy: harmony × stability × (1 - corruption)
      let synergyNorm =
        (harmonyNorm * this.config.visualWeights.harmony) +
        (stabilityNorm * this.config.visualWeights.stability) +
        ((1 - corruptionNorm) * this.config.visualWeights.corruption) +
        (energyNorm * this.config.visualWeights.energy);
      
      // Apply optional enhancement hooks (placeholders for Week 2+)
      synergyNorm = this._applyEnergyFactor(synergyNorm, energyNorm);
      synergyNorm = this._applyHarmonyBoost(synergyNorm, harmonyNorm);
      synergyNorm = this._applyChaosPenalty(synergyNorm, corruptionNorm);
      
      // Clamp to valid range
      synergyNorm = this._clamp01(synergyNorm);
      
      return {
        synergyNorm,
        factors: {
          harmonyNorm,
          stabilityNorm,
          corruptionNorm,
          energyNorm,
        }
      };
      
    } catch (err) {
      // Silent failure: return null to trigger fallback
      if (this.config.enableDebug) {
        console.warn('[ComputeSynergyScore2_1] Visual computation failed:', err);
      }
      return null;
    }
  }
  
  /**
   * Compute synergy using legacy ComputeSynergyScore2_0 logic
   * This preserves 100% backward compatibility
   * @private
   */
  _computeLegacy(link, systemsConfig) {
    try {
      // Call original ComputeSynergyScore2_0
      const result = computeSynergyScore2_0(link, systemsConfig);
      return result;
    } catch (err) {
      console.error('[ComputeSynergyScore2_1] Legacy compute failed:', err);
      return this._safeDefault();
    }
  }
  
  /**
   * Enhancement hook: Apply energy factor
   * Placeholder for Week 2+
   * Currently disabled (no-op)
   * @private
   */
  _applyEnergyFactor(synergyNorm, energyNorm) {
    if (!this.config.applyEnergyFactor) {
      return synergyNorm; // Week 1: disabled
    }
    
    // Week 2+: Could apply energy boost
    // Example: synergyNorm *= (1.0 + energyNorm * 0.1)
    return synergyNorm;
  }
  
  /**
   * Enhancement hook: Apply harmony boost
   * Placeholder for Week 2+
   * Currently disabled (no-op)
   * @private
   */
  _applyHarmonyBoost(synergyNorm, harmonyNorm) {
    if (!this.config.applyHarmonyBoost) {
      return synergyNorm; // Week 1: disabled
    }
    
    // Week 2+: Could apply harmony amplification
    // Example: synergyNorm *= (0.8 + harmonyNorm * 0.2)
    return synergyNorm;
  }
  
  /**
   * Enhancement hook: Apply chaos penalty
   * Placeholder for Week 2+
   * Currently disabled (no-op)
   * @private
   */
  _applyChaosPenalty(synergyNorm, corruptionNorm) {
    if (!this.config.applyChaosPenalty) {
      return synergyNorm; // Week 1: disabled
    }
    
    // Week 2+: Could apply corruption multiplier
    // Example: synergyNorm *= Math.pow(1 - corruptionNorm, 0.5)
    return synergyNorm;
  }
  
  /**
   * Assign tier based on synergy value
   * @private
   */
  _assignTier(synergyNorm) {
    const thresholds = this.config.tierThresholds;
    
    if (synergyNorm >= thresholds.critical) return 'critical';
    if (synergyNorm >= thresholds.high) return 'high';
    if (synergyNorm >= thresholds.medium) return 'medium';
    if (synergyNorm >= thresholds.low) return 'low';
    return 'low';
  }
  
  /**
   * Clamp value to [0, 1] range
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
      score: 0,
      synergyNorm: 0,
      tier: 'low',
      components: {
        type: 0,
        priority: 0,
        traffic: 0,
        decay: 0,
        topology: 0
      },
      visualIntegration: null,
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
  _recordPerformance(elapsedMs) {
    this.stats.computeCount++;
    this.stats.totalTimeMs += elapsedMs;
    this.stats.averageTimeMs = this.stats.totalTimeMs / this.stats.computeCount;
    
    if (this.config.enableDebug && elapsedMs > 1) {
      console.warn(`[ComputeSynergyScore2_1] Slow compute: ${elapsedMs.toFixed(2)}ms`);
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
   * Enable debug logging
   */
  setDebug(enabled) {
    this.config.enableDebug = enabled;
  }
}

// Default export: drop-in compatible function wrapper
export function computeSynergyScore2_1(link, systemsConfig = {}) {
  // Use global instance or create temporary one
  const calculator = new ComputeSynergyScore2_1();
  return calculator.compute(link, systemsConfig);
}

// Export class for advanced usage
export default ComputeSynergyScore2_1;
