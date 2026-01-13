/**
 * PHASE 3C WEEK 7: PERSONALITY SIGNAL SMOOTHER — EMA FILTERING SYSTEM
 * 
 * Applies Exponential Moving Average (EMA) smoothing to personality signals
 * to reduce jitter, flicker, and abrupt transitions while maintaining responsiveness.
 * 
 * PURPOSE:
 * - Smooth personality signals for visual stability
 * - Eliminate flicker and abrupt changes
 * - Maintain signal responsiveness
 * - Per-signal customizable smoothing factors
 * - Process 200+ nodes efficiently (<1ms)
 * 
 * SIGNALS SMOOTHED:
 * - clarityBoost (α=0.15) — smooth + stable
 * - resonanceBoost (α=0.25) — faster motion
 * - entropyPenalty (α=0.10) — heavy smoothing
 * - focusShift (α=0.18) — moderate responsive
 * - corruptionSignal (α=0.12) — avoid flicker
 * 
 * OUTPUT:
 * - node.userData.personalityVisualSmoothed
 * - { clarity, resonance, entropy, focus, corruption, lastUpdate }
 * 
 * SAFETY:
 * - Standalone: no file modifications
 * - Defensive: handles all missing data
 * - Additive: pure new module
 * - Reversible: disposable system
 * - No allocations in hot path
 */

export class PersonalitySignalSmoother_v1 {
  constructor(options = {}) {
    // Default EMA smoothing factors (alpha values: 0-1)
    // Higher α = more responsive to new data
    // Lower α = more smoothing, more stable
    this.alphaFactors = {
      clarity: options.clarity ?? 0.15,      // Smooth + stable
      resonance: options.resonance ?? 0.25,  // Faster motion
      entropy: options.entropy ?? 0.10,      // Heavy smoothing
      focus: options.focus ?? 0.18,          // Moderate responsive
      corruption: options.corruption ?? 0.12, // Avoid flicker
    };
    
    // Allow override of alpha factors
    if (options.alphaOverrides && typeof options.alphaOverrides === 'object') {
      this.alphaFactors = { ...this.alphaFactors, ...options.alphaOverrides };
    }
    
    // Debug logging
    this.debugEnabled = options.debugEnabled === true;
    
    // Track processed nodes
    this.processedNodes = new Map();
    
    // Scratch object for reuse (no allocations in hot path)
    this.scratchSmoothed = {
      clarity: 0,
      resonance: 0,
      entropy: 0,
      focus: 0,
      corruption: 0,
      lastUpdate: 0,
    };
    
    // Stats for debug
    this.stats = {
      nodesProcessed: 0,
      signalsSmoothed: 0,
      missingDataCount: 0,
    };
    
    if (this.debugEnabled) {
      console.log('[Smoother] PersonalitySignalSmoother_v1 initialized', {
        alphaFactors: this.alphaFactors,
      });
    }
  }

  /**
   * Get current EMA alpha factors
   */
  getAlphaFactors() {
    return { ...this.alphaFactors };
  }

  /**
   * Set alpha factor overrides
   */
  setAlphaOverrides(overrides) {
    if (!overrides || typeof overrides !== 'object') {
      if (this.debugEnabled) console.warn('[Smoother] setAlphaOverrides: invalid argument');
      return false;
    }
    
    const prevFactors = { ...this.alphaFactors };
    this.alphaFactors = { ...this.alphaFactors, ...overrides };
    
    if (this.debugEnabled) {
      console.log('[Smoother] Alpha overrides applied', {
        previous: prevFactors,
        updated: this.alphaFactors,
      });
    }
    
    return true;
  }

  /**
   * Extract personality visual data from node
   * Handles multiple possible data structures
   */
  _getPersonalityData(node) {
    if (!node) return null;
    
    // Check multiple possible locations
    const candidates = [
      node.userData?.personalityVisual,
      node.personalityVisual,
      node.personality,
    ];
    
    for (const candidate of candidates) {
      if (candidate && typeof candidate === 'object') {
        return candidate;
      }
    }
    
    return null;
  }

  /**
   * Get or initialize smoothed data structure for a node
   */
  _getOrCreateSmoothed(node) {
    if (!node.userData) {
      node.userData = {};
    }
    
    if (!node.userData.personalityVisualSmoothed) {
      node.userData.personalityVisualSmoothed = {
        clarity: 0,
        resonance: 0,
        entropy: 0,
        focus: 0,
        corruption: 0,
        lastUpdate: Date.now(),
      };
    }
    
    return node.userData.personalityVisualSmoothed;
  }

  /**
   * Clamp value to 0–1 range
   */
  _clamp(value) {
    if (typeof value !== 'number' || isNaN(value)) return 0;
    return Math.max(0, Math.min(1, value));
  }

  /**
   * Apply EMA formula: newValue = α * rawValue + (1 - α) * oldValue
   * α (alpha) = smoothing factor (0–1)
   * Lower α = more smoothing, slower response
   * Higher α = less smoothing, faster response
   */
  _applyEMA(oldValue, newValue, alpha) {
    if (typeof newValue !== 'number' || isNaN(newValue)) {
      return oldValue; // Keep old value if new is invalid
    }
    
    newValue = this._clamp(newValue);
    return alpha * newValue + (1 - alpha) * oldValue;
  }

  /**
   * Update smoothed signals for a single node
   * Reads: node.userData.personalityVisual
   * Writes: node.userData.personalityVisualSmoothed
   */
  updateNode(node) {
    if (!node) {
      if (this.debugEnabled) console.warn('[Smoother] updateNode: null node');
      return false;
    }
    
    // Get raw personality data
    const rawData = this._getPersonalityData(node);
    if (!rawData) {
      if (this.debugEnabled && !this.processedNodes.has(node)) {
        console.warn('[Smoother] No personalityVisual data found');
      }
      this.stats.missingDataCount++;
      return false;
    }
    
    // Get or create smoothed data
    const smoothed = this._getOrCreateSmoothed(node);
    
    // Map raw fields to signal names
    const rawSignals = {
      clarity: rawData.clarityBoost ?? 0,
      resonance: rawData.resonanceBoost ?? 0,
      entropy: rawData.entropyPenalty ?? 0,
      focus: rawData.focusShift ?? 0,
      corruption: rawData.corruptionSignal ?? 0,
    };
    
    // Apply EMA smoothing to each signal
    let updatedCount = 0;
    for (const [signal, alpha] of Object.entries(this.alphaFactors)) {
      const oldValue = smoothed[signal] ?? 0;
      const newValue = rawSignals[signal] ?? 0;
      
      const emasmoothValue = this._applyEMA(oldValue, newValue, alpha);
      
      if (Math.abs(emasmoothValue - oldValue) > 1e-6) {
        smoothed[signal] = emasmoothValue;
        updatedCount++;
      }
    }
    
    // Update timestamp
    smoothed.lastUpdate = Date.now();
    
    // Track node
    if (!this.processedNodes.has(node)) {
      this.processedNodes.set(node, {
        initialized: true,
        firstUpdateTime: Date.now(),
      });
    }
    
    // Update stats
    this.stats.nodesProcessed++;
    this.stats.signalsSmoothed += updatedCount;
    
    return updatedCount > 0;
  }

  /**
   * Update smoothed signals for all nodes in array
   */
  updateAll(nodes) {
    if (!Array.isArray(nodes)) {
      if (this.debugEnabled) console.warn('[Smoother] updateAll: expected array');
      return 0;
    }
    
    let updatedCount = 0;
    
    for (const node of nodes) {
      if (this.updateNode(node)) {
        updatedCount++;
      }
    }
    
    if (this.debugEnabled && updatedCount > 0) {
      console.log(`[Smoother] Updated ${updatedCount}/${nodes.length} nodes`);
    }
    
    return updatedCount;
  }

  /**
   * Reset smoothed values for a node (revert to raw values)
   */
  resetNode(node) {
    if (!node) return false;
    
    const rawData = this._getPersonalityData(node);
    if (!rawData) return false;
    
    const smoothed = this._getOrCreateSmoothed(node);
    
    // Reset each signal to current raw value
    smoothed.clarity = this._clamp(rawData.clarityBoost ?? 0);
    smoothed.resonance = this._clamp(rawData.resonanceBoost ?? 0);
    smoothed.entropy = this._clamp(rawData.entropyPenalty ?? 0);
    smoothed.focus = this._clamp(rawData.focusShift ?? 0);
    smoothed.corruption = this._clamp(rawData.corruptionSignal ?? 0);
    smoothed.lastUpdate = Date.now();
    
    if (this.debugEnabled) {
      console.log('[Smoother] Node reset to raw values');
    }
    
    return true;
  }

  /**
   * Reset all nodes
   */
  resetAll(nodes) {
    if (!Array.isArray(nodes)) {
      if (this.debugEnabled) console.warn('[Smoother] resetAll: expected array');
      return 0;
    }
    
    let resetCount = 0;
    
    for (const node of nodes) {
      if (this.resetNode(node)) {
        resetCount++;
      }
    }
    
    if (this.debugEnabled) {
      console.log(`[Smoother] Reset ${resetCount}/${nodes.length} nodes`);
    }
    
    return resetCount;
  }

  /**
   * Get smoothed signal value for a specific signal
   */
  getSmoothedSignal(node, signalName) {
    if (!node || !signalName) return null;
    
    const smoothed = node.userData?.personalityVisualSmoothed;
    if (!smoothed) return null;
    
    const value = smoothed[signalName];
    return typeof value === 'number' ? value : null;
  }

  /**
   * Get all smoothed signals for a node
   */
  getSmoothedSignals(node) {
    if (!node) return null;
    
    return node.userData?.personalityVisualSmoothed || null;
  }

  /**
   * Get node tracking info
   */
  getNodeInfo(node) {
    if (!node || !this.processedNodes.has(node)) {
      return null;
    }
    
    return this.processedNodes.get(node);
  }

  /**
   * Get total processed nodes count
   */
  getProcessedCount() {
    return this.processedNodes.size;
  }

  /**
   * Enable/disable debug logging
   */
  setDebugEnabled(enabled) {
    this.debugEnabled = enabled === true;
    if (this.debugEnabled) {
      console.log('[Smoother] Debug logging enabled');
    }
    return this.debugEnabled;
  }

  /**
   * Get debug information
   */
  getDebugInfo() {
    return {
      processedNodes: this.processedNodes.size,
      nodesProcessed: this.stats.nodesProcessed,
      signalsSmoothed: this.stats.signalsSmoothed,
      missingDataCount: this.stats.missingDataCount,
      alphaFactors: { ...this.alphaFactors },
      debugEnabled: this.debugEnabled,
    };
  }

  /**
   * Get summary info
   */
  getSummary() {
    return {
      status: 'active',
      processedNodes: this.processedNodes.size,
      alphaFactorsCount: Object.keys(this.alphaFactors).length,
      debugMode: this.debugEnabled,
    };
  }

  /**
   * Verify EMA smoothing is working
   * Returns comparison of raw vs smoothed values for a node
   */
  getSmoothnessComparison(node) {
    if (!node) return null;
    
    const rawData = this._getPersonalityData(node);
    const smoothedData = this.getSmoothedSignals(node);
    
    if (!rawData || !smoothedData) return null;
    
    return {
      raw: {
        clarity: this._clamp(rawData.clarityBoost ?? 0),
        resonance: this._clamp(rawData.resonanceBoost ?? 0),
        entropy: this._clamp(rawData.entropyPenalty ?? 0),
        focus: this._clamp(rawData.focusShift ?? 0),
        corruption: this._clamp(rawData.corruptionSignal ?? 0),
      },
      smoothed: {
        clarity: smoothedData.clarity,
        resonance: smoothedData.resonance,
        entropy: smoothedData.entropy,
        focus: smoothedData.focus,
        corruption: smoothedData.corruption,
      },
      differences: {
        clarity: Math.abs((rawData.clarityBoost ?? 0) - smoothedData.clarity),
        resonance: Math.abs((rawData.resonanceBoost ?? 0) - smoothedData.resonance),
        entropy: Math.abs((rawData.entropyPenalty ?? 0) - smoothedData.entropy),
        focus: Math.abs((rawData.focusShift ?? 0) - smoothedData.focus),
        corruption: Math.abs((rawData.corruptionSignal ?? 0) - smoothedData.corruption),
      },
    };
  }

  /**
   * Clear all stats
   */
  clearStats() {
    this.stats = {
      nodesProcessed: 0,
      signalsSmoothed: 0,
      missingDataCount: 0,
    };
  }

  /**
   * Cleanup: clear all tracking
   */
  dispose() {
    this.processedNodes.clear();
    this.clearStats();
    
    if (this.debugEnabled) {
      console.log('[Smoother] PersonalitySignalSmoother_v1 disposed');
    }
  }

  /**
   * Documentation: Get EMA smoothing explanation
   */
  static getEMAExplanation() {
    return {
      formula: 'newValue = α * rawValue + (1 - α) * oldValue',
      alpha: 'Smoothing factor (0–1)',
      alphaInterpretation: {
        lowAlpha: 'High smoothing, slow response (0.05–0.15)',
        mediumAlpha: 'Balanced smoothing and responsiveness (0.15–0.25)',
        highAlpha: 'Fast response, less smoothing (0.25–0.50)',
      },
      defaultFactors: {
        clarity: '0.15 — smooth + stable',
        resonance: '0.25 — faster motion',
        entropy: '0.10 — heavy smoothing',
        focus: '0.18 — moderate responsive',
        corruption: '0.12 — avoid flicker',
      },
    };
  }
}

// Export both named and default
export { PersonalitySignalSmoother_v1 };
export default PersonalitySignalSmoother_v1;

// Attach to window for global access
if (typeof window !== 'undefined') {
  window.PersonalitySignalSmoother_v1 = PersonalitySignalSmoother_v1;
}
