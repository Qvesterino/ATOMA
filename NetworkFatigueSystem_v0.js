/**
 * ============================================================================
 * NETWORK FATIGUE SYSTEM v0
 * ============================================================================
 * Long-term network dynamics layer built atop Category Interaction Spec v1
 * 
 * DESIGN PRINCIPLES (HARD RULES):
 * F1 - Fatigue is slow (builds over tens of seconds/minutes)
 * F2 - Fatigue is reversible (recovery slower than accumulation)
 * F3 - Fatigue does not kill nodes (modulates effectiveness only)
 * F4 - Fatigue is orthogonal (no changes to thresholds, only rate/ceiling modulation)
 * 
 * INTEGRATION:
 * const fatigue = new NetworkFatigueSystem(nodeDynamics);
 * 
 * FRAME UPDATE (called AFTER NodeDynamicMetrics.update):
 * fatigue.update(deltaTime);
 * 
 * CONSUMPTION (by other systems):
 * const fatigueValue = node.userData.fatigue ?? 0; // ∈ [0, 1]
 * const harmonyRateMultiplier = 1 - (fatigueValue * 0.40);
 * 
 * ============================================================================
 */

export class NetworkFatigueSystem {
  /**
   * Initialize the fatigue system
   * @param {NodeDynamicMetrics} nodeDynamics - Reference to computed metrics
   * @param {Object} config - Optional configuration overrides
   */
  constructor(nodeDynamics, config = {}) {
    this.nodeDynamics = nodeDynamics;
    
    // Configuration
    this.config = {
      // Accumulation rates (per second, when stressors present)
      accumulationRateBase: config.accumulationRateBase ?? 0.015,  // ~67s to max at max stress
      
      // Recovery rate (per second, under healthy conditions)
      recoveryRateBase: config.recoveryRateBase ?? 0.005,  // ~200s to recover from max
      
      // Stress thresholds that trigger accumulation
      stressThresholds: config.stressThresholds ?? {
        highLoad: 0.75,        // loadRatio > 0.75 triggers accumulation
        highInstability: 0.60, // instability > 0.60 triggers accumulation
        corruptionPresent: 0.40, // corruption > 0.40 triggers accumulation
        lowHarmony: 0.20       // harmony < 0.20 triggers accumulation
      },
      
      // Recovery conditions
      recoveryConditions: config.recoveryConditions ?? {
        maxLoad: 0.5,           // loadRatio must be < 0.5
        maxInstability: 0.3,    // instability must be < 0.3
        minHarmony: 0.4,        // harmony must be > 0.4
        maxCorruption: 0.3      // corruption must be < 0.3
      },
      
      // Fatigue effect multipliers (applied when fatigue > 0)
      effects: config.effects ?? {
        harmonyRateModulation: 0.40,      // harmony effectiveness reduced by this factor
        synergyModulation: 0.35,          // synergy effectiveness reduced by this factor
        corruptionDecayModulation: 0.30   // corruption decay reduced by this factor
      },
      
      // Category-based fatigue sensitivity
      // Higher = burns out faster, Lower = ages well
      categorySensitivity: config.categorySensitivity ?? {
        input: 1.15,          // Input nodes burn out fastest
        process: 1.00,        // Baseline
        integration: 0.90,    // Integration nodes more resilient
        analytics: 0.85,      // Analytics nodes age well
        storage: 0.75,        // Storage nodes age VERY well
        control: 0.95         // Control nodes slightly resilient
      },
      
      // Max fatigue value (always clamped to [0, 1])
      maxFatigue: 1.0,
      minFatigue: 0.0
    };
    
    // Verify we have nodeDynamics
    if (!nodeDynamics || !nodeDynamics.aiNodes) {
      throw new Error('NetworkFatigueSystem requires valid nodeDynamics reference');
    }
  }
  
  /**
   * Main update - call once per frame AFTER metrics.update()
   * @param {number} deltaTime - Time elapsed since last frame (in seconds)
   */
  update(deltaTime) {
    if (!this.nodeDynamics?.aiNodes?.nodes) {
      return;
    }
    
    for (const node of this.nodeDynamics.aiNodes.nodes) {
      this._updateNodeFatigue(node, deltaTime);
    }
  }
  
  /**
   * Update fatigue for a single node
   * @private
   */
  _updateNodeFatigue(node, deltaTime) {
    // Initialize fatigue if needed
    if (node.userData.fatigue === undefined) {
      node.userData.fatigue = 0.0;
    }
    
    const metrics = node.userData.metrics;
    if (!metrics) {
      return;
    }
    
    const currentFatigue = node.userData.fatigue;
    const category = node.userData.category || 'process';
    const sensitivity = this.config.categorySensitivity[category] ?? 1.0;
    
    // Determine if accumulation or recovery should occur
    const shouldAccumulate = this._checkStressComposite(metrics);
    const shouldRecover = this._checkRecoveryConditions(metrics);
    
    let newFatigue = currentFatigue;
    
    if (shouldAccumulate && !shouldRecover) {
      // Accumulation phase: fatigue increases
      const stressComposite = this._computeStressComposite(metrics);
      const accumulationDelta = this.config.accumulationRateBase * stressComposite * sensitivity * deltaTime;
      newFatigue += accumulationDelta;
    } else if (shouldRecover && !shouldAccumulate) {
      // Recovery phase: fatigue decreases
      const recoveryDelta = this.config.recoveryRateBase * deltaTime;
      newFatigue -= recoveryDelta;
    }
    // else: stalemate or both conditions met - fatigue holds steady
    
    // Clamp to valid range
    newFatigue = Math.max(
      this.config.minFatigue,
      Math.min(this.config.maxFatigue, newFatigue)
    );
    
    // Store fatigue value
    node.userData.fatigue = newFatigue;
  }

  _readLoadMetric(metrics, node = null, fallback = 0) {
    const direct = metrics?.loadRatio;
    if (Number.isFinite(direct)) return direct;

    const canonical = metrics?.loadPressure;
    if (Number.isFinite(canonical)) return canonical;

    const legacyLoad = metrics?.load;
    if (Number.isFinite(legacyLoad)) return legacyLoad;

    const nodeLoadRatio = node?.userData?.loadRatio;
    if (Number.isFinite(nodeLoadRatio)) return nodeLoadRatio;

    const nodeLoadPressure = node?.userData?.loadPressure;
    if (Number.isFinite(nodeLoadPressure)) return nodeLoadPressure;

    return fallback;
  }
  
  /**
   * Check if stress composite is high enough to trigger accumulation
   * @private
   */
  _checkStressComposite(metrics) {
    const { highLoad, highInstability, corruptionPresent, lowHarmony } = this.config.stressThresholds;
    
    const highLoadStress = this._readLoadMetric(metrics) > highLoad;
    const highInstabilityStress = metrics.instability > highInstability;
    const corruptionStress = metrics.corruption > corruptionPresent;
    const lowHarmonyStress = metrics.harmony < lowHarmony;
    
    // At least one stress condition must be true
    return highLoadStress || highInstabilityStress || corruptionStress || lowHarmonyStress;
  }
  
  /**
   * Check if all recovery conditions are met
   * @private
   */
  _checkRecoveryConditions(metrics) {
    const { maxLoad, maxInstability, minHarmony, maxCorruption } = this.config.recoveryConditions;
    
    return (
      this._readLoadMetric(metrics) < maxLoad &&
      metrics.instability < maxInstability &&
      metrics.harmony > minHarmony &&
      metrics.corruption < maxCorruption
    );
  }
  
  /**
   * Compute stress composite score (0 to 1+)
   * Normalized sum of stressor contributions
   * @private
   */
  _computeStressComposite(metrics) {
    const { highLoad, highInstability, corruptionPresent, lowHarmony } = this.config.stressThresholds;
    const loadRatio = this._readLoadMetric(metrics);
    
    // Load stress: 0 at threshold, 1 at saturation
    const loadStress = Math.max(
      0,
      (loadRatio - highLoad) / (1 - highLoad)
    );
    
    // Instability stress: 0 at threshold, 1 at 100%
    const instabilityStress = Math.max(
      0,
      (metrics.instability - highInstability) / (1 - highInstability)
    );
    
    // Corruption stress: 0 at threshold, 1 at 100%
    const corruptionStress = Math.max(
      0,
      (metrics.corruption - corruptionPresent) / (1 - corruptionPresent)
    );
    
    // Harmony deficit: 0 at threshold, 1 at 0%
    const harmonyDeficit = Math.max(
      0,
      (lowHarmony - metrics.harmony) / lowHarmony
    );
    
    // Composite: average of all stressors (normalized)
    const composite = (
      loadStress +
      instabilityStress +
      corruptionStress +
      harmonyDeficit
    ) / 4.0;
    
    return Math.min(1.0, composite);
  }
  
  /**
   * Get the harmony rate multiplier based on fatigue
   * Used by harmony systems to reduce healing rate when fatigued
   * @param {THREE.Object3D} node - The node to query
   * @returns {number} Multiplier in range [0.6, 1.0]
   */
  getHarmonyRateMultiplier(node) {
    const fatigue = node?.userData?.fatigue ?? 0;
    const modulation = this.config.effects.harmonyRateModulation;
    return 1.0 - (fatigue * modulation);
  }
  
  /**
   * Get the synergy multiplier based on fatigue
   * Used by synergy systems to reduce synergy effectiveness when fatigued
   * @param {THREE.Object3D} node - The node to query
   * @returns {number} Multiplier in range [0.65, 1.0]
   */
  getSynergyMultiplier(node) {
    const fatigue = node?.userData?.fatigue ?? 0;
    const modulation = this.config.effects.synergyModulation;
    return 1.0 - (fatigue * modulation);
  }
  
  /**
   * Get the corruption decay multiplier based on fatigue
   * Used by corruption systems to reduce decay rate when fatigued
   * @param {THREE.Object3D} node - The node to query
   * @returns {number} Multiplier in range [0.7, 1.0]
   */
  getCorruptionDecayMultiplier(node) {
    const fatigue = node?.userData?.fatigue ?? 0;
    const modulation = this.config.effects.corruptionDecayModulation;
    return 1.0 - (fatigue * modulation);
  }
  
  /**
   * Diagnostic: Get fatigue diagnostics for a node
   * @param {THREE.Object3D} node - The node to query
   * @returns {Object} Diagnostic info
   */
  getDiagnostics(node) {
    const metrics = node?.userData?.metrics;
    const fatigue = node?.userData?.fatigue ?? 0;
    
    if (!metrics) {
      return { error: 'No metrics available' };
    }
    
    const shouldAccumulate = this._checkStressComposite(metrics);
    const shouldRecover = this._checkRecoveryConditions(metrics);
    const composite = this._computeStressComposite(metrics);
    const category = node.userData?.category || 'process';
    const sensitivity = this.config.categorySensitivity[category] ?? 1.0;
    
    return {
      fatigue: Number(fatigue.toFixed(4)),
      state: shouldAccumulate ? 'ACCUMULATING' : shouldRecover ? 'RECOVERING' : 'STABLE',
      stressComposite: Number(composite.toFixed(4)),
      category,
      categorySensitivity: sensitivity,
      metrics: {
        loadRatio: Number(this._readLoadMetric(metrics, node).toFixed(3)),
        instability: Number(metrics.instability.toFixed(1)),
        corruption: Number(metrics.corruption.toFixed(1)),
        harmony: Number(metrics.harmony.toFixed(1))
      },
      multipliers: {
        harmonyRate: Number(this.getHarmonyRateMultiplier(node).toFixed(3)),
        synergy: Number(this.getSynergyMultiplier(node).toFixed(3)),
        corruptionDecay: Number(this.getCorruptionDecayMultiplier(node).toFixed(3))
      }
    };
  }
}

/**
 * ============================================================================
 * CONSOLE API FOR TESTING
 * ============================================================================
 */
export function setupNetworkFatigueConsoleAPI(fatigueSystem, nodeDynamics) {
  if (!window.ATOMA_DEBUG) {
    window.ATOMA_DEBUG = {};
  }
  
  window.ATOMA_DEBUG.NetworkFatigue = {
    /**
     * Seed a node with fatigue for testing
     * Usage: ATOMA_DEBUG.NetworkFatigue.seedFatigue(0, 0.5)
     */
    seedFatigue: (nodeIndex, value) => {
      const nodes = nodeDynamics?.aiNodes?.nodes;
      if (!nodes || nodes.length === 0) {
        console.error('No nodes available');
        return;
      }
      const node = nodes[nodeIndex];
      if (!node) {
        console.error(`Node ${nodeIndex} not found`);
        return;
      }
      node.userData.fatigue = Math.max(0, Math.min(1, value));
      console.error(`✓ Node ${nodeIndex} fatigue set to ${value.toFixed(3)}`);
    },
    
    /**
     * Print diagnostics for all nodes
     */
    printDiagnostics: () => {
      const nodes = nodeDynamics?.aiNodes?.nodes;
      if (!nodes) {
        console.error('No nodes available');
        return;
      }
      
      console.error(`\n${'='.repeat(80)}`);
      console.error(`NETWORK FATIGUE DIAGNOSTICS (${nodes.length} nodes)`);
      console.error(`${'='.repeat(80)}`);
      
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const diag = fatigueSystem.getDiagnostics(node);
        
        console.error(`\nNode ${i} [${diag.category}]:`);
        console.error(`  Fatigue: ${diag.fatigue} | State: ${diag.state}`);
        console.error(`  Stress Composite: ${diag.stressComposite} (Sensitivity: ${diag.categorySensitivity}x)`);
        console.error(`  Metrics: Load=${diag.metrics.loadRatio} | Inst=${diag.metrics.instability} | Corr=${diag.metrics.corruption} | Harm=${diag.metrics.harmony}`);
        console.error(`  Multipliers: Harmony=${diag.multipliers.harmonyRate} | Synergy=${diag.multipliers.synergy} | CorruptionDecay=${diag.multipliers.corruptionDecay}`);
      }
      
      console.error(`\n${'='.repeat(80)}\n`);
    },
    
    /**
     * Run a controlled fatigue stress test
     * Usage: ATOMA_DEBUG.NetworkFatigue.runStressTest(10) // 10 seconds
     */
    runStressTest: (duration = 10) => {
      return new Promise((resolve) => {
        const nodes = nodeDynamics?.aiNodes?.nodes;
        if (!nodes || nodes.length === 0) {
          console.error('No nodes available');
          resolve();
          return;
        }
        
        console.error(`\nRunning fatigue stress test for ${duration}s...`);
        const testNode = nodes[0];
        const startFatigue = testNode.userData.fatigue ?? 0;
        
        const startTime = Date.now();
        const interval = setInterval(() => {
          const elapsed = (Date.now() - startTime) / 1000;
          if (elapsed >= duration) {
            clearInterval(interval);
            const endFatigue = testNode.userData.fatigue;
            console.error(`\nStress test complete:`);
            console.error(`  Start fatigue: ${startFatigue.toFixed(3)}`);
            console.error(`  End fatigue: ${endFatigue.toFixed(3)}`);
            console.error(`  Change: ${(endFatigue - startFatigue).toFixed(3)} (${((endFatigue - startFatigue) / duration).toFixed(4)}/s)`);
            console.error(fatigueSystem.getDiagnostics(testNode));
            resolve();
            return;
          }
        }, 100);
      });
    },
    
    /**
     * Get singleton diagnostic for a specific node
     */
    diagnose: (nodeIndex) => {
      const nodes = nodeDynamics?.aiNodes?.nodes;
      if (!nodes || !nodes[nodeIndex]) {
        console.error(`Node ${nodeIndex} not found`);
        return;
      }
      console.error(fatigueSystem.getDiagnostics(nodes[nodeIndex]));
    }
  };
  
  console.info('✓ Network Fatigue Console API available at window.ATOMA_DEBUG.NetworkFatigue');
}
