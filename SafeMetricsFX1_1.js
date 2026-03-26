/**
 * SAFE METRICS FX 1.1
 * 
 * Subtle, performance-friendly visual effects based on node metrics.
 * 
 * Uses existing node.userData.metrics values.
 * 
 * FX Types:
 * 1) HARMONY GLOW - High harmony → slight emissive boost
 * 2) INSTABILITY FLICKER - High instability → subtle random flicker
 * 3) CORRUPTION TINT - High corruption → slight rim color shift
 * 4) ENERGY INTENSITY - High energy → small glow boost
 * 
 * SAFETY:
 * - No per-frame loops (15-20Hz tick only)
 * - Safe guards before every material access
 * - Graceful skip on missing fields
 * - No new timers
 * - No node logic modification
 */

export class SafeMetricsFX1_1 {
  constructor(semanticBus = null) {
    // Tick timing (15-20Hz = slower than raycast, minimal overhead)
    this.lastTickTime = 0;
    this.tickInterval = 1 / 15; // ~67ms per tick
    
    // Track state to prevent re-application
    this.appliedFX = new Map(); // nodeId -> { harmony, instability, energy, corruption }
    
    // Flicker state (for instability flicker effect)
    this.flickerStates = new Map(); // nodeId -> { phase, nextFlicker }

    // Event-driven processing state
    this.semanticBus = semanticBus || globalThis?.semanticBus || null;
    this.dirtyNodes = new Set();
    this._eventDrivenEnabled = false;
    this._metricNodeUpdatedHandler = null;
    this._unsubscribeMetricNodeUpdated = null;

    this._setupMetricSubscription();
  }

  _setupMetricSubscription() {
    if (!this.semanticBus || typeof this.semanticBus.subscribe !== 'function') {
      this._eventDrivenEnabled = false;
      return;
    }

    this._metricNodeUpdatedHandler = (payload = {}) => {
      const nodeId = payload?.nodeId;
      if (nodeId === undefined || nodeId === null) return;
      this.dirtyNodes.add(String(nodeId));
    };

    const maybeUnsubscribe = this.semanticBus.subscribe(
      'metric.node.updated',
      this._metricNodeUpdatedHandler
    );

    if (typeof maybeUnsubscribe === 'function') {
      this._unsubscribeMetricNodeUpdated = maybeUnsubscribe;
    } else if (typeof this.semanticBus.unsubscribe === 'function') {
      this._unsubscribeMetricNodeUpdated = () => {
        this.semanticBus.unsubscribe('metric.node.updated', this._metricNodeUpdatedHandler);
      };
    } else {
      this._unsubscribeMetricNodeUpdated = null;
    }

    this._eventDrivenEnabled = true;
  }

  _findNodeByEventId(nodes, nodeId) {
    if (!nodes || nodes.length === 0) return null;
    const target = String(nodeId);

    for (const node of nodes) {
      if (!node) continue;
      const nodeUserData = node.userData || {};
      if (String(nodeUserData.nodeId) === target) return node;
      if (String(nodeUserData.id) === target) return node;
      if (String(node.id) === target) return node;
      if (String(node.uuid) === target) return node;
    }

    return null;
  }

  /**
   * Ensure metrics baseline for emissive intensity is captured
   * Prevents drift by capturing baseline once per node
   */
  ensureMetricsBaseline(node) {
    if (!node || !node.material) return;

    if (node._metricsBaselineEmissive === undefined) {
      node._metricsBaselineEmissive = node.material.emissiveIntensity ?? 0.3;
    }
  }

  /**
   * Main update - call from game loop (will throttle internally)
   * Safe to call every frame - will only execute at ~15Hz
   */
  update(deltaTime, nodes) {
    // 🔒 HARD INTERACTION AUTHORITY - Stop all visual updates when locked
    if (window.VISUAL_AUTHORITY_LOCK) return;
    
    if (window.DEBUG_VISUAL_MODE) return;
    if (!nodes || nodes.length === 0) return;

    // Throttle to 15Hz (67ms)
    this.lastTickTime += deltaTime;
    if (this.lastTickTime < this.tickInterval) {
      return;
    }
    this.lastTickTime = 0;

    if (!this._eventDrivenEnabled) {
      // Fallback: no semanticBus -> keep original polling behavior
      nodes.forEach(node => {
        this.applyNodeMetricsFX(node);
      });
      return;
    }

    if (this.dirtyNodes.size === 0) return;

    for (const dirtyNodeId of this.dirtyNodes) {
      const node = this._findNodeByEventId(nodes, dirtyNodeId);
      if (node) {
        this.applyNodeMetricsFX(node);
      }
    }
    this.dirtyNodes.clear();
  }

  /**
   * Apply all metric FX to a single node
   * Extremely safe - checks everything before touching materials
   */
  applyNodeMetricsFX(node) {
    if (!node || !node.userData) return;

    const metrics = node.userData.metrics;
    const nodeId = node.uuid;

    try {
      // Get or create state for this node
      let state = this.appliedFX.get(nodeId);
      if (!state) {
        state = {
          harmony: 0,
          instability: 0,
          energy: 0,
          corruption: 0,
        };
        this.appliedFX.set(nodeId, state);
      }

      // Apply each FX type independently
      this.applyHarmonyGlow(node, metrics, state);
      this.applyInstabilityFlicker(node, metrics, state);
      this.applyCorruptionTint(node, metrics, state);
      this.applyEnergyIntensity(node, metrics, state);

    } catch (e) {
      // Fail silently - never crash the game
      console.warn('SafeMetricsFX: Error applying FX to node', nodeId, e);
    }
  }

  /**
   * FX 1: HARMONY GLOW
   * High harmony (>70) → subtle emissive boost
   */
  applyHarmonyGlow(node, metrics, state) {
    // Safety: Check material exists
    if (!node.material || !node.material.emissive) {
      return;
    }

    const harmonyThreshold = 70;
    const harmonyValue = metrics.harmony || 0;

    // Ensure baseline is captured
    ensureMetricsBaseline(node);
    const baseline = node._metricsBaselineEmissive;

    // Compute target offset based on harmony
    let targetOffset = 0;

    if (harmonyValue > harmonyThreshold) {
      // Calculate boost (0-1 scale based on harmony 70-120)
      const harmonyBoost = Math.max(0, Math.min(1, (harmonyValue - harmonyThreshold) / 50));
      
      // Very subtle: max 0.05 intensity boost (5%)
      targetOffset = harmonyBoost * 0.005; // Extremely subtle
    }

    // Compute target intensity
    const targetIntensity = Math.min(baseline + targetOffset, 1.0);

    try {
      if (typeof node.material.emissiveIntensity === 'number') {
        const current = node.material.emissiveIntensity;
        const lerpFactor = 0.1; // Smooth transition
        node.material.emissiveIntensity = current + (targetIntensity - current) * lerpFactor;
      }
    } catch (e) {
      // Skip silently if emissive not writable
    }

    state.harmony = harmonyValue;
  }

  /**
   * FX 2: INSTABILITY FLICKER
   * High instability (>60) → occasional subtle random flicker
   */
  applyInstabilityFlicker(node, metrics, state) {
    // Safety: Check material exists
    if (!node.material || !node.material.emissive) {
      return;
    }

    const instabilityThreshold = 60;
    const instabilityValue = metrics.instability || 0;

    // Ensure baseline is captured
    ensureMetricsBaseline(node);
    const baseline = node._metricsBaselineEmissive;

    // Compute target offset (returns to baseline when instability drops)
    let targetOffset = 0;

    if (instabilityValue > instabilityThreshold) {
      const nodeId = node.uuid;
      
      // Get flicker state
      let flicker = this.flickerStates.get(nodeId);
      if (!flicker) {
        flicker = {
          phase: 0,
        };
        this.flickerStates.set(nodeId, flicker);
      }

      // Update flicker phase
      const flickerFrequency = (instabilityValue / 100) * 0.05; // Very low frequency
      flicker.phase += flickerFrequency;
    } else if (state.instability > instabilityThreshold) {
      // Instability dropped - remove flicker state
      this.flickerStates.delete(node.uuid);
    }

    // Compute target intensity (baseline + flicker offset)
    const targetIntensity = Math.max(0, Math.min(1.0, baseline + targetOffset));

    try {
      if (typeof node.material.emissiveIntensity === 'number') {
        const current = node.material.emissiveIntensity;
        const lerpFactor = 0.15; // Slightly faster for flicker
        node.material.emissiveIntensity = current + (targetIntensity - current) * lerpFactor;
      }
    } catch (e) {
      // Skip silently
    }

    state.instability = instabilityValue;
  }

  /**
   * FX 3: CORRUPTION TINT
   * High instability or corruption (>50) → slight rim color shift (≤5%)
   */
  applyCorruptionTint(node, metrics, state) {
    // Safety: Check material exists and has a rim color
    if (!node.material || typeof node.material.color !== 'object') {
      return;
    }

    const corruptionThreshold = 50;
    const corruptionValue = metrics.instability || 0; // Use instability as corruption proxy
    
    if (corruptionValue > corruptionThreshold) {
      // Calculate corruption amount (0-1 scale)
      const corruptionAmount = Math.max(0, Math.min(1, (corruptionValue - corruptionThreshold) / 50));
      
      // Very subtle: max 5% shift
      const tintAmount = corruptionAmount * 0.05;

      try {
        // Store original color if not already stored
        if (!node.userData.originalColor) {
          node.userData.originalColor = {
            r: node.material.color.r,
            g: node.material.color.g,
            b: node.material.color.b,
          };
        }

        const orig = node.userData.originalColor;
        
        // Apply slight purple/red tint shift (corruption effect)
        const redShift = tintAmount * 0.1; // Slight red increase
        const blueShift = tintAmount * 0.05; // Slight blue increase
        const greenDecay = tintAmount * 0.05; // Slight green decrease

        node.material.color.r = Math.min(1, orig.r + redShift);
        node.material.color.g = Math.max(0, orig.g - greenDecay);
        node.material.color.b = Math.min(1, orig.b + blueShift);

      } catch (e) {
        // Skip silently if color not writable
      }

      state.corruption = corruptionValue;
    } else if (state.corruption > corruptionThreshold) {
      // Corruption dropped - restore original color
      try {
        if (node.userData.originalColor) {
          const orig = node.userData.originalColor;
          node.material.color.r = orig.r;
          node.material.color.g = orig.g;
          node.material.color.b = orig.b;
        }
      } catch (e) {
        // Skip silently
      }
      state.corruption = corruptionValue;
    }
  }

  /**
   * FX 4: ENERGY INTENSITY
   * High energy (>80) → tiny glow boost (≤10%)
   */
  applyEnergyIntensity(node, metrics, state) {
    // Safety: Check material exists
    if (!node.material) {
      return;
    }

    const energyThreshold = 80;
    const energyValue = metrics.loadPressure ?? 0;

    // Ensure baseline is captured
    ensureMetricsBaseline(node);
    const baseline = node._metricsBaselineEmissive;

    // Compute target offset based on energy
    let emissiveTargetOffset = 0;
    let intensityTargetOffset = 0;

    if (energyValue > energyThreshold) {
      // Calculate energy boost (0-1 scale)
      const energyBoost = Math.max(0, Math.min(1, (energyValue - energyThreshold) / 40)); // 80-120 range
      
      // Tiny boost: max 10% (0.1)
      emissiveTargetOffset = energyBoost * 0.001; // Extremely subtle
      intensityTargetOffset = emissiveTargetOffset * 0.5;
    }

    // Compute target intensities
    const emissiveTarget = Math.min(1.0, baseline + emissiveTargetOffset);

    try {
      // Apply to emissiveIntensity if exists
      if (node.material.emissive && typeof node.material.emissiveIntensity === 'number') {
        const current = node.material.emissiveIntensity;
        const lerpFactor = 0.1; // Smooth transition
        node.material.emissiveIntensity = current + (emissiveTarget - current) * lerpFactor;
      }

      // Also apply to intensity if it exists
      if (typeof node.material.intensity === 'number') {
        // For intensity, use a baseline of 1.0 if not stored
        const intensityBaseline = node._metricsBaselineIntensity ?? 1.0;
        const intensityTarget = Math.min(2.0, intensityBaseline + intensityTargetOffset);
        const current = node.material.intensity;
        node.material.intensity = current + (intensityTarget - current) * lerpFactor;
      }
    } catch (e) {
      // Skip silently
    }

    state.energy = energyValue;
  }

  /**
   * Reset all FX for cleanup or reset
   */
  reset() {
    this.appliedFX.clear();
    this.flickerStates.clear();
    this.dirtyNodes.clear();
    this.lastTickTime = 0;
  }

  /**
   * Get FX status (diagnostic)
   */
  getStatus() {
    return {
      tickRate: `${Math.round(1 / this.tickInterval)} Hz`,
      nodesWithFX: this.appliedFX.size,
      flickeringNodes: this.flickerStates.size,
    };
  }

  /**
   * Clean up a specific node's FX
   */
  cleanupNode(node) {
    if (!node) return;
    this.appliedFX.delete(node.uuid);
    this.flickerStates.delete(node.uuid);
    
    // Restore original color if stored
    if (node.userData && node.userData.originalColor && node.material) {
      try {
        const orig = node.userData.originalColor;
        node.material.color.r = orig.r;
        node.material.color.g = orig.g;
        node.material.color.b = orig.b;
      } catch (e) {
        // Skip silently
      }
    }
  }

  dispose() {
    if (typeof this._unsubscribeMetricNodeUpdated === 'function') {
      try {
        this._unsubscribeMetricNodeUpdated();
      } catch (e) {
        // Skip silently
      }
    }

    this._unsubscribeMetricNodeUpdated = null;
    this._metricNodeUpdatedHandler = null;
    this._eventDrivenEnabled = false;
  }
}
