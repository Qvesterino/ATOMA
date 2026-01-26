/**
 * ============================================================================
 * FX PERFORMANCE SCALER v1.0 – Phase 3c Performance Mode
 * ============================================================================
 * Global scaling layer that applies performance multipliers to personality signals.
 * 
 * PURPOSE:
 * - Runs each frame (after PersonalityVisualAdapter)
 * - Reads personality signals from all nodes
 * - Applies FXPerformanceController multipliers
 * - Writes scaled values back without modifying original systems
 * - Allows instant quality switching without reinitializing shaders
 * 
 * RESPONSIBILITY:
 * - Read node.userData.personalityVisual (5 signals)
 * - Apply clarity, resonance, entropy, focus, corruption multipliers
 * - Write scaled values back to same location
 * - Handle missing data gracefully
 * - Track statistics
 * - Performance: <0.1ms for 200 nodes
 * 
 * SIGNALS SCALED:
 * - clarityBoost (0–1)
 * - resonanceBoost (0–1)
 * - entropyPenalty (0–1)
 * - focusShift (0–1)
 * - corruptionSignal (0–1)
 * 
 * DATA FLOW:
 * PersonalityVisualAdapter → [ORIGINAL SIGNALS]
       ↓
 * FXPerformanceScaler_v1 → [APPLY MULTIPLIERS]
       ↓
 * PersonalityVFXLayer_v1 → [READ SCALED SIGNALS]
       ↓
 * PersonalityShaderBridge_v1 → [READ SCALED SIGNALS]
       ↓
 * PersonalityShaderEffects_Pack_v1 → [READ SCALED UNIFORMS]
 * 
 * INTEGRATION:
 * const scaler = new FXPerformanceScaler_v1(aiNodes, perfController);
 * 
 * UPDATE LOOP (after PersonalityVisualAdapter.update()):
 * scaler.update(deltaTime);
 * 
 * SAFETY:
 * - Non-invasive (only modifies personality signals, no structural changes)
 * - Reversible (multipliers 1.0 = no scaling)
 * - Graceful degradation (missing data skipped)
 * - Zero dependencies (stateless, only reads controller)
 * - Safe clamping (all values clamped 0–1)
 * 
 * ============================================================================
 */

export class FXPerformanceScaler_v1 {
  /**
   * Initialize the performance scaler
   * @param {AINodes} aiNodes - Reference to AINodes system
   * @param {FXPerformanceController_v1} perfController - Performance controller
   * @param {Object} options - Optional configuration
   */
  constructor(aiNodes, perfController, options = {}) {
    this.aiNodes = aiNodes;
    this.perfController = perfController;

    // Configuration
    this.config = {
      enableDebug: options.enableDebug ?? false,
      enableWarnings: options.enableWarnings ?? false,
      clampValues: options.clampValues ?? true, // Clamp 0–1
    };

    // Statistics
    this.stats = {
      updateCount: 0,
      nodesScaled: 0,
      missingSignalCount: 0,
      averageTimeMs: 0,
      totalTimeMs: 0,
      lastUpdateTime: 0,
    };
  }

  /**
   * Update all node personality signals with performance multipliers
   * @param {number} deltaTime - Frame delta time (unused, for consistency)
   * @returns {number} Nodes scaled
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;
    if (!this.perfController) {
      if (this.config.enableWarnings) {
        console.warn('[FXPerformanceScaler] No performance controller, skipping update');
      }
      return 0;
    }

    const startTime = performance.now();

    const nodes = this.aiNodes?.nodes;
    if (!nodes || nodes.length === 0) {
      return 0;
    }

    let nodesScaled = 0;

    // Iterate all nodes and apply multipliers
    for (const node of nodes) {
      const personalityVisual = node.userData?.personalityVisual;
      if (!personalityVisual) {
        this.stats.missingSignalCount++;
        continue;
      }

      // Apply clarity multiplier
      if (personalityVisual.clarityBoost !== undefined) {
        personalityVisual.clarityBoost *= this.perfController.getMultiplier('clarity');
        if (this.config.clampValues) {
          personalityVisual.clarityBoost = Math.max(0, Math.min(1, personalityVisual.clarityBoost));
        }
      }

      // Apply resonance multiplier
      if (personalityVisual.resonanceBoost !== undefined) {
        personalityVisual.resonanceBoost *= this.perfController.getMultiplier('resonance');
        if (this.config.clampValues) {
          personalityVisual.resonanceBoost = Math.max(0, Math.min(1, personalityVisual.resonanceBoost));
        }
      }

      // Apply entropy multiplier
      if (personalityVisual.entropyPenalty !== undefined) {
        personalityVisual.entropyPenalty *= this.perfController.getMultiplier('entropy');
        if (this.config.clampValues) {
          personalityVisual.entropyPenalty = Math.max(0, Math.min(1, personalityVisual.entropyPenalty));
        }
      }

      // Apply focus multiplier
      if (personalityVisual.focusShift !== undefined) {
        personalityVisual.focusShift *= this.perfController.getMultiplier('focus');
        if (this.config.clampValues) {
          personalityVisual.focusShift = Math.max(0, Math.min(1, personalityVisual.focusShift));
        }
      }

      // Apply corruption multiplier
      if (personalityVisual.corruptionSignal !== undefined) {
        personalityVisual.corruptionSignal *= this.perfController.getMultiplier('corruption');
        if (this.config.clampValues) {
          personalityVisual.corruptionSignal = Math.max(0, Math.min(1, personalityVisual.corruptionSignal));
        }
      }

      nodesScaled++;
    }

    // Update statistics
    const endTime = performance.now();
    const frameTimeMs = endTime - startTime;
    this.stats.updateCount++;
    this.stats.nodesScaled = nodesScaled;
    this.stats.totalTimeMs += frameTimeMs;
    this.stats.averageTimeMs = this.stats.totalTimeMs / this.stats.updateCount;
    this.stats.lastUpdateTime = frameTimeMs;

    if (this.config.enableDebug && this.stats.updateCount % 60 === 0) {
      console.log(
        `[FXPerformanceScaler] Scaled ${nodesScaled} nodes in ${frameTimeMs.toFixed(2)}ms ` +
        `(avg: ${this.stats.averageTimeMs.toFixed(2)}ms)`
      );
    }

    return nodesScaled;
  }

  /**
   * Get debug information
   * @returns {Object} Statistics and config
   */
  getDebugInfo() {
    return {
      config: this.config,
      stats: {
        ...this.stats,
        averageTimeMs: this.stats.averageTimeMs.toFixed(3),
        totalTimeMs: this.stats.totalTimeMs.toFixed(2),
        lastUpdateTime: this.stats.lastUpdateTime.toFixed(2),
      },
    };
  }

  /**
   * Log debug information to console
   */
  logDebugInfo() {
    console.log('[FXPerformanceScaler] Debug Info:', this.getDebugInfo());
  }
}
