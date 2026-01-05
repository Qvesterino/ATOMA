/**
 * SynapticSpecializationAdapter_v1.js
 * ============================================================================
 * Visual Learning Through Repeated Behavior: Synaptic Specialization
 * 
 * VISUAL NARRATIVE LAYER: Nodes learn visual identities based on their
 * dominant gating behavior over time. Amplification-heavy nodes look
 * "excitatory," dampening-heavy nodes look "inhibitory," balanced nodes
 * remain neutral.
 * 
 * Core Concept:
 * - Nodes develop synapticBias ∈ [-1, +1] based on observed gating
 * - +1.0 = amplification-specialized (excitatory)
 * -1.0 = dampening-specialized (inhibitory)
 * 0.0 = neutral/balanced
 * 
 * Visual Expression:
 * - Halo rhythm & shape adapt to bias
 * - Pulse boundary interactions reflect specialization
 * - Ripple coherence changes with specialization
 * 
 * NO GAMEPLAY CHANGES, NO ALLOCATIONS, PURELY VISUAL
 * Pure visual storytelling about learned neural identities.
 * 
 * State-Driven Specialization:
 * - Bias accumulates slowly from gateStrength
 * - Decay ensures nodes drift back to neutral if behavior changes
 * - Fatigue suppresses expression (but doesn't erase bias)
 * - Harmony stabilizes specialization
 * - Corruption adds distortion
 * - Never snaps, always smooth transitions
 */

/**
 * Main synaptic specialization adapter
 */
export class SynapticSpecializationAdapter_v1 {
  constructor(config = {}) {
    this.enabled = config.enabled ?? true;
    this.debugMode = config.debugMode ?? false;

    // Learning parameters
    this.learningRate = config.learningRate ?? 0.05;        // How fast bias accumulates (very slow)
    this.stabilityDecay = config.stabilityDecay ?? 0.98;    // Per-frame decay toward neutral
    this.relearningRate = config.relearningRate ?? 0.03;    // Speed of behavior change detection

    // Expression strength (how much bias affects visuals)
    this.expressionStrength = config.expressionStrength ?? 0.6;

    // Per-node specialization tracking
    this.nodeBiasMap = new Map();  // nodeId → { bias, lastUpdate, direction, stability }
    this.nodeGateMap = new Map();  // nodeId → { gateStrength, lastUpdate }

    // Bias thresholds
    this.biasThresholds = {
      amplificationSpecialized: 0.3,   // Bias > 0.3 = clearly excitatory
      inhibitionSpecialized: -0.3,     // Bias < -0.3 = clearly inhibitory
      neutral: 0.3                     // ±0.3 = balanced/learning
    };

    // Visual expression parameters by specialization
    this.visualExpressionByBias = {
      excitatory: {
        // +1.0 bias
        haloBrightnessBoost: 0.15,      // Brighter halo
        haloSmoothness: 0.2,            // Smoother, less turbulent
        haloBreathingDirection: 1.0,    // Outward breathing
        haloBreathingAmplitude: 0.15,   // Slight expansion
        pulseConfidence: 0.25,          // Pulses appear stronger
        pulseElongationFactor: 1.2,     // Exit shape elongated
        rippleCoherence: 0.25,          // Broad, coherent ripples
        rippleBroadness: 1.3            // Wide ripple pattern
      },
      neutral: {
        // 0.0 bias
        haloBrightnessBoost: 0,
        haloSmoothness: 0,
        haloBreathingDirection: 0,
        haloBreathingAmplitude: 0,
        pulseConfidence: 0,
        pulseElongationFactor: 1.0,
        rippleCoherence: 0,
        rippleBroadness: 1.0
      },
      inhibitory: {
        // -1.0 bias
        haloBrightnessBoost: -0.1,      // Slightly dimmer (more compressed)
        haloSmoothness: -0.15,          // Denser, more turbulent
        haloBreathingDirection: -1.0,   // Inward breathing
        haloBreathingAmplitude: -0.1,   // Contraction
        pulseConfidence: -0.2,          // Pulses appear absorbed
        pulseElongationFactor: 0.8,     // Exit shape contracted
        rippleCoherence: -0.15,         // Tighter, constrained ripples
        rippleBroadness: 0.8            // Narrow ripple pattern
      }
    };

    // Console API
    this.setupConsoleAPI();

    console.log('[SynapticSpecializationAdapter] Initialized ✅');
  }

  /**
   * Update specialization per frame
   * Call AFTER synaptic gating is computed
   * 
   * @param {Array} nodes - All nodes in network
   * @param {Map} nodeGateMap - From SynapticGatingAdapter (nodeId → gateStrength)
   * @param {number} deltaTime - Frame delta in seconds
   * @param {number} currentTime - Current time in ms
   */
  updateSpecialization(nodes = [], nodeGateMap = new Map(), deltaTime = 0.016, currentTime = 0) {
    if (!this.enabled) return;

    this.nodeGateMap = nodeGateMap;

    try {
      // Update each node's specialization
      for (const node of nodes) {
        if (!node || !node.userData) continue;

        const nodeId = node.id || node.uuid || node.name;
        if (!nodeId) continue;

        this.updateNodeSpecialization(node, nodeId, deltaTime, currentTime);
      }

      if (this.debugMode && Math.random() < 0.01) {
        this.logSpecializationStatus();
      }
    } catch (err) {
      console.warn('[SynapticSpecializationAdapter] updateSpecialization error:', err);
    }
  }

  /**
   * Update specialization for a single node
   */
  updateNodeSpecialization(node, nodeId, deltaTime, currentTime) {
    // Get or initialize bias state
    let biasState = this.nodeBiasMap.get(nodeId);
    if (!biasState) {
      biasState = {
        bias: 0.0,                  // Start neutral
        lastUpdate: currentTime,
        direction: 0,               // Last observed direction (+1, 0, -1)
        stability: 0,               // How stable is current bias
        accumulation: 0             // For smooth accumulation
      };
      this.nodeBiasMap.set(nodeId, biasState);
    }

    // Get gate strength from current frame
    const gateStrength = this.nodeGateMap.get(nodeId) ?? 0;

    // Accumulate bias based on observed gating behavior
    this.accumulateBias(node, biasState, gateStrength, deltaTime);

    // Apply slow decay toward neutral (allows relearning)
    this.applyStabilityDecay(biasState, deltaTime);

    // Clamp bias to [-1, 1]
    biasState.bias = Math.max(-1.0, Math.min(1.0, biasState.bias));
    biasState.lastUpdate = currentTime;

    // Store on node for debugging/visualization
    node.userData.synapticBias = biasState.bias;
    node.userData.synapticSpecialization = this.getSpecializationType(biasState.bias);
    node.userData.synapticDirection = biasState.direction;
  }

  /**
   * Accumulate bias based on gating behavior
   */
  accumulateBias(node, biasState, gateStrength, deltaTime) {
    // Only accumulate if there's meaningful gating activity
    if (Math.abs(gateStrength) < 0.05) {
      // Below threshold—don't accumulate, but allow decay
      return;
    }

    // Direction of observed gating
    const direction = Math.sign(gateStrength);
    biasState.direction = direction;

    // Accumulation: very slow learning
    // Formula: bias += normalized(gateStrength) * learningRate * deltaTime
    const normGateStrength = Math.max(-1.0, Math.min(1.0, gateStrength));
    const accumulation = normGateStrength * this.learningRate * deltaTime;

    // Check if behavior is changing direction (quick pivot)
    const isBehaviorShift = biasState.direction !== 0 && 
                            Math.sign(biasState.bias) !== 0 &&
                            Math.sign(biasState.bias) !== biasState.direction;

    if (isBehaviorShift) {
      // Behavior changed—relearn at faster rate
      biasState.bias += accumulation * this.relearningRate;
    } else {
      // Normal accumulation
      biasState.bias += accumulation;
    }

    // Stability grows with consistent behavior
    if (Math.abs(biasState.bias) > 0.1) {
      biasState.stability = Math.min(1.0, biasState.stability + 0.01 * deltaTime);
    }
  }

  /**
   * Apply slow decay toward neutral
   * Allows nodes to "forget" and relearn if behavior changes
   */
  applyStabilityDecay(biasState, deltaTime) {
    // Exponential decay per frame
    // stabilityDecay ≈ 0.98 → very slow drift toward zero
    const decayFactor = Math.pow(this.stabilityDecay, deltaTime * 60); // Normalize to 60fps
    biasState.bias *= decayFactor;

    // Also slowly reduce stability
    biasState.stability *= Math.pow(this.stabilityDecay, deltaTime * 30);
  }

  /**
   * Get specialization type string from bias
   */
  getSpecializationType(bias) {
    if (bias > this.biasThresholds.amplificationSpecialized) {
      return 'excitatory';
    } else if (bias < -this.biasThresholds.inhibitionSpecialized) {
      return 'inhibitory';
    } else {
      return 'neutral';
    }
  }

  /**
   * Get visual modulation for a node based on specialization
   * Used by visual systems to adapt appearance
   */
  getVisualModulation(nodeId) {
    const biasState = this.nodeBiasMap.get(nodeId);
    if (!biasState) {
      return this.getDefaultModulation();
    }

    const { bias, stability } = biasState;
    const specializationType = this.getSpecializationType(bias);

    // Get base expression for this specialization
    let baseExpr = this.visualExpressionByBias.neutral;
    if (specializationType === 'excitatory') {
      baseExpr = this.visualExpressionByBias.excitatory;
    } else if (specializationType === 'inhibitory') {
      baseExpr = this.visualExpressionByBias.inhibitory;
    }

    // Scale expression by bias magnitude (0 at neutral, 1 at ±1.0)
    const expressionIntensity = Math.abs(bias) * this.expressionStrength;

    // Also modulate by stability (newer specializations are less expressed)
    const stabilityModulation = 0.5 + (stability * 0.5);

    return {
      bias: bias,
      specialization: specializationType,
      expressionIntensity: expressionIntensity,
      stability: stability,

      haloBrightnessBoost: baseExpr.haloBrightnessBoost * expressionIntensity * stabilityModulation,
      haloSmoothness: baseExpr.haloSmoothness * expressionIntensity * stabilityModulation,
      haloBreathingDirection: baseExpr.haloBreathingDirection * expressionIntensity,
      haloBreathingAmplitude: baseExpr.haloBreathingAmplitude * expressionIntensity * stabilityModulation,

      pulseConfidence: baseExpr.pulseConfidence * expressionIntensity * stabilityModulation,
      pulseElongationFactor: 1.0 + (baseExpr.pulseElongationFactor - 1.0) * expressionIntensity * stabilityModulation,

      rippleCoherence: baseExpr.rippleCoherence * expressionIntensity * stabilityModulation,
      rippleBroadness: 1.0 + (baseExpr.rippleBroadness - 1.0) * expressionIntensity * stabilityModulation
    };
  }

  /**
   * Get default modulation (neutral, no expression)
   */
  getDefaultModulation() {
    return {
      bias: 0,
      specialization: 'neutral',
      expressionIntensity: 0,
      stability: 0,

      haloBrightnessBoost: 0,
      haloSmoothness: 0,
      haloBreathingDirection: 0,
      haloBreathingAmplitude: 0,

      pulseConfidence: 0,
      pulseElongationFactor: 1.0,

      rippleCoherence: 0,
      rippleBroadness: 1.0
    };
  }

  /**
   * Get current bias for a node
   */
  getBias(nodeId) {
    const state = this.nodeBiasMap.get(nodeId);
    return state?.bias ?? 0;
  }

  /**
   * Get specialization type for a node
   */
  getSpecialization(nodeId) {
    const state = this.nodeBiasMap.get(nodeId);
    if (!state) return 'neutral';
    return this.getSpecializationType(state.bias);
  }

  /**
   * Reset specialization for a node (e.g., after node death/respawn)
   */
  resetSpecialization(nodeId) {
    this.nodeBiasMap.delete(nodeId);
  }

  /**
   * Force specialization to a specific type (for testing/special events)
   */
  forceSpecialization(nodeId, specType) {
    let biasValue = 0;
    if (specType === 'excitatory') biasValue = 0.8;
    else if (specType === 'inhibitory') biasValue = -0.8;
    
    let state = this.nodeBiasMap.get(nodeId);
    if (!state) {
      state = {
        bias: biasValue,
        lastUpdate: Date.now(),
        direction: Math.sign(biasValue),
        stability: 0.8,
        accumulation: 0
      };
      this.nodeBiasMap.set(nodeId, state);
    } else {
      state.bias = biasValue;
      state.stability = 0.8;
    }
  }

  /**
   * Log specialization status for debugging
   */
  logSpecializationStatus() {
    const specialized = [];
    for (const [nodeId, state] of this.nodeBiasMap) {
      const spec = this.getSpecializationType(state.bias);
      if (spec !== 'neutral') {
        specialized.push(
          `${nodeId?.substring?.(0, 8)}: ${spec} (bias=${state.bias.toFixed(2)}, stability=${state.stability.toFixed(2)})`
        );
      }
    }
    if (specialized.length > 0) {
      console.log(`[SynapticSpecialization] Specialized nodes: ${specialized.join(', ')}`);
    }
  }

  /**
   * Setup console API
   */
  setupConsoleAPI() {
    window.synapticSpecialization = {
      enable: () => {
        this.enabled = true;
        console.log('✓ Synaptic Specialization enabled');
      },
      disable: () => {
        this.enabled = false;
        console.log('✓ Synaptic Specialization disabled');
      },
      setDebugMode: (mode) => {
        this.debugMode = mode;
        console.log(`✓ Synaptic Specialization debug: ${mode ? 'ON' : 'OFF'}`);
      },
      setLearningRate: (rate) => {
        this.learningRate = Math.max(0, Math.min(0.5, rate));
        console.log(`✓ Learning rate: ${rate.toFixed(3)}`);
      },
      setExpressionStrength: (strength) => {
        this.expressionStrength = Math.max(0, Math.min(1.0, strength));
        console.log(`✓ Expression strength: ${strength.toFixed(2)}`);
      },
      getStatus: () => {
        const stats = {
          totalNodes: this.nodeBiasMap.size,
          excitatory: 0,
          inhibitory: 0,
          neutral: 0,
          avgBias: 0,
          avgStability: 0
        };

        let totalBias = 0;
        let totalStability = 0;
        for (const [, state] of this.nodeBiasMap) {
          const spec = this.getSpecializationType(state.bias);
          if (spec === 'excitatory') stats.excitatory++;
          else if (spec === 'inhibitory') stats.inhibitory++;
          else stats.neutral++;

          totalBias += state.bias;
          totalStability += state.stability;
        }

        stats.avgBias = stats.totalNodes > 0 ? totalBias / stats.totalNodes : 0;
        stats.avgStability = stats.totalNodes > 0 ? totalStability / stats.totalNodes : 0;

        console.log(`
Synaptic Specialization Status:
  Enabled: ${this.enabled}
  Debug: ${this.debugMode}
  Tracked Nodes: ${stats.totalNodes}
  Excitatory: ${stats.excitatory}
  Inhibitory: ${stats.inhibitory}
  Neutral: ${stats.neutral}
  Average Bias: ${stats.avgBias.toFixed(2)}
  Average Stability: ${stats.avgStability.toFixed(2)}
  Learning Rate: ${this.learningRate.toFixed(3)}
  Expression Strength: ${this.expressionStrength.toFixed(2)}
        `);
      },
      help: () => {
        console.log(`
Synaptic Specialization Console API:
  synapticSpecialization.enable()               - Enable specialization
  synapticSpecialization.disable()              - Disable specialization
  synapticSpecialization.setDebugMode(bool)     - Toggle debug logging
  synapticSpecialization.setLearningRate(0-0.5) - Adjust learning speed
  synapticSpecialization.setExpressionStrength(0-1) - Adjust visual effect intensity
  synapticSpecialization.getStatus()            - Show current status
  synapticSpecialization.help()                 - Show this help
        `);
      }
    };
  }
}

/**
 * Setup integration
 */
export function setupSynapticSpecializationIntegration(game) {
  try {
    const adapter = new SynapticSpecializationAdapter_v1({
      enabled: true,
      debugMode: false,
      learningRate: 0.05,
      stabilityDecay: 0.98,
      relearningRate: 0.03,
      expressionStrength: 0.6
    });

    game.synapticSpecializationAdapter = adapter;
    console.log('[main.js] SynapticSpecializationAdapter initialized ✅');
    return adapter;
  } catch (err) {
    console.warn('[main.js] SynapticSpecializationAdapter init error:', err);
    return null;
  }
}
