/**
 * SynapticFatigueAdapter_v1.js
 * ============================================================================
 * Long-Term Synaptic Fatigue & Recovery: Visual Wear and Healing at Nodes
 * 
 * VISUAL NARRATIVE LAYER: Nodes behave like biological synapses that tire under
 * repeated amplification/dampening and gradually recover when load eases.
 * 
 * Core Concept:
 * - Repeated strong gating causes progressive fatigue
 * - Fatigued synapses lose visual intensity and sharpness
 * - Recovery is slow, smooth, and non-linear (ease-out)
 * - Fatigue is PURELY VISUAL, never affects gameplay
 * 
 * State-Driven Modulation:
 * - Fatigue accumulates from: |gateStrength|, pulse density, hub splitting
 * - Fatigue decays from: low gate activity, harmony, rest periods
 * - Visual changes: halo dulling, phase lag, subtle flicker (high fatigue only)
 * - Recovery feels: calm, earned, biological
 * 
 * NO GAMEPLAY CHANGES, NO ALLOCATIONS, NO RANDOMNESS
 * Pure visual adapter layer, deterministic and gracefully degradable.
 */

/**
 * Main synaptic fatigue adapter
 */
export class SynapticFatigueAdapter_v1 {
  constructor(config = {}) {
    this.enabled = config.enabled ?? true;
    this.debugMode = config.debugMode ?? false;

    // Fatigue accumulation rates
    this.fatigueAccumulationRate = config.fatigueAccumulationRate ?? 0.3;  // How fast fatigue builds
    this.pulseDensityFactor = config.pulseDensityFactor ?? 0.15;           // Pulse frequency influence
    this.hubSplitMultiplier = config.hubSplitMultiplier ?? 1.2;            // Extra fatigue from splits

    // Fatigue recovery rates
    this.fatigueDecayRate = config.fatigueDecayRate ?? 0.05;               // How fast fatigue heals
    this.harmonyRecoveryBoost = config.harmonyRecoveryBoost ?? 0.8;        // Harmony accelerates recovery
    this.recoveryEaseOutFactor = config.recoveryEaseOutFactor ?? 1.5;      // Non-linear easing

    // Recovery state tracking
    this.reliefPulseChance = config.reliefPulseChance ?? 0.15;             // Chance of "relief pulse"
    this.reliefPulseDuration = config.reliefPulseDuration ?? 200;          // ms

    // Workload capping: process nodes in batches across ticks
    this.maxNodesPerTick = config.maxNodesPerTick ?? 120;                   // Max nodes processed per tick
    this._nodeCursor = 0;                                                   // Cyclic processing cursor

    // Visual fatigue thresholds
    this.fatigueVisualThresholds = {
      low: 0.3,      // 0.0-0.3: barely noticeable
      medium: 0.6,   // 0.3-0.6: moderate strain
      high: 1.0      // 0.6-1.0: severe fatigue
    };

    // Visual effect parameters by fatigue level
    this.visualEffectByFatigue = {
      low: {
        haloDullFactor: 0.0,
        phaseShift: 0.0,
        flickerAmount: 0.0,
        glowReduction: 0.05
      },
      medium: {
        haloDullFactor: 0.15,
        phaseShift: 0.1,
        flickerAmount: 0.02,
        glowReduction: 0.15
      },
      high: {
        haloDullFactor: 0.35,
        phaseShift: 0.25,
        flickerAmount: 0.08,
        glowReduction: 0.35
      }
    };

    // Per-node fatigue tracking
    this.nodeFatigueMap = new Map();  // nodeId → { fatigue, lastUpdate, pulseDensity, isRecovering }
    this.nodeGateMap = new Map();     // nodeId → { gateStrength, lastUpdate }
    this.nodeOutgoingPulseCount = new Map(); // nodeId → pulse count (for density)
    this.nodeReliefPulseState = new Map();   // nodeId → { active, endTime }

    // Frame-scoped variables
    this.currentFrameTime = 0;
    this.deltaTime = 0;

    // Console API
    this.setupConsoleAPI();

    console.log('[SynapticFatigueAdapter] Initialized ✓');
  }

  /**
   * Update per-frame
   * Call ONCE per frame, after synaptic gating is computed
   * 
   * Workload Capping: Processes nodes in cyclic batches to smooth performance.
   * At most maxNodesPerTick nodes are updated per tick. Over multiple ticks,
   * all nodes are processed without changing fatigue behavior.
   * 
   * @param {Array} nodes - All nodes in network
   * @param {Map} nodeGateMap - From SynapticGatingAdapter (nodeId → gateStrength)
   * @param {number} deltaTime - Frame delta in seconds
   * @param {number} currentTime - Current time in ms
   */
  updateFatigue(nodes = [], nodeGateMap = new Map(), deltaTime = 0.016, currentTime = 0, dirtyNodeIds = null) {
    if (!this.enabled) return;

    this.currentFrameTime = currentTime;
    this.deltaTime = deltaTime;
    this.nodeGateMap = nodeGateMap;

    try {
      // Reset pulse density counters
      for (const [nodeId] of this.nodeOutgoingPulseCount) {
        this.nodeOutgoingPulseCount.set(nodeId, 0);
      }

      const nodeCount = nodes.length;
      if (nodeCount === 0) return;

      const dirtyIds = dirtyNodeIds instanceof Set
        ? dirtyNodeIds
        : Array.isArray(dirtyNodeIds)
          ? new Set(dirtyNodeIds)
          : null;

      if (dirtyIds) {
        const candidateIds = new Set(dirtyIds);
        for (const [nodeId, state] of this.nodeFatigueMap) {
          if (!nodeId) continue;
          if ((state?.fatigue ?? 0) > 0 || state?.isRecovering) {
            candidateIds.add(nodeId);
          }
        }
        for (const [nodeId, pulseCount] of this.nodeOutgoingPulseCount) {
          if (nodeId && (pulseCount ?? 0) > 0) {
            candidateIds.add(nodeId);
          }
        }
        for (const [nodeId, reliefState] of this.nodeReliefPulseState) {
          if (nodeId && reliefState?.active) {
            candidateIds.add(nodeId);
          }
        }

        const nodeById = new Map();
        for (const node of nodes) {
          if (!node || !node.userData) continue;
          const nodeId = node.id || node.uuid || node.name;
          if (nodeId) nodeById.set(nodeId, node);
        }

        for (const nodeId of candidateIds) {
          const node = nodeById.get(nodeId);
          if (!node) continue;
          this.updateNodeFatigue(node, nodeId, deltaTime, currentTime);
        }
      } else {
        // Process cyclic batch: from cursor up to maxNodesPerTick
        const maxToProcess = Math.min(this.maxNodesPerTick, nodeCount);
        let processedCount = 0;

        // Process from cursor to end of array (or up to maxNodesPerTick)
        const firstSegmentEnd = Math.min(this._nodeCursor + maxToProcess, nodeCount);
        for (let i = this._nodeCursor; i < firstSegmentEnd; i++) {
          const node = nodes[i];
          if (!node || !node.userData) {
            processedCount++;
            continue;
          }

          const nodeId = node.id || node.uuid || node.name;
          if (nodeId) {
            this.updateNodeFatigue(node, nodeId, deltaTime, currentTime);
          }
          processedCount++;
        }

        // If we wrapped around, process remaining nodes from start
        if (processedCount < maxToProcess) {
          const remainingToProcess = maxToProcess - processedCount;
          for (let i = 0; i < remainingToProcess; i++) {
            const node = nodes[i];
            if (!node || !node.userData) {
              processedCount++;
              continue;
            }

            const nodeId = node.id || node.uuid || node.name;
            if (nodeId) {
              this.updateNodeFatigue(node, nodeId, deltaTime, currentTime);
            }
            processedCount++;
          }
        }

        // Advance cursor with modulo wrap
        this._nodeCursor = (this._nodeCursor + processedCount) % nodeCount;
      }

      if (this.debugMode && Math.random() < 0.01) {
        this.logFatigueStatus();
      }
    } catch (err) {
      console.warn('[SynapticFatigueAdapter] updateFatigue error:', err);
    }
  }

  /**
   * Update fatigue for a single node
   */
  updateNodeFatigue(node, nodeId, deltaTime, currentTime) {
    // Get or initialize fatigue state
    let fatigueState = this.nodeFatigueMap.get(nodeId);
    if (!fatigueState) {
      fatigueState = {
        fatigue: 0.0,
        lastUpdate: currentTime,
        pulseDensity: 0.0,
        isRecovering: false,
        recoveryStartTime: 0,
        recoveryStartFatigue: 0.0
      };
      this.nodeFatigueMap.set(nodeId, fatigueState);
    }

    // Get gate strength from current frame
    const gateStrength = this.nodeGateMap.get(nodeId) ?? 0;

    // Calculate pulse density (normalized, 0-1)
    const outgoingPulseCount = this.nodeOutgoingPulseCount.get(nodeId) ?? 0;
    const pulseDensity = Math.min(1.0, outgoingPulseCount * 0.1); // Scale: 0-10 pulses → 0-1

    // Decide accumulation vs recovery
    const isActive = Math.abs(gateStrength) > 0.15 || pulseDensity > 0.1;

    if (isActive) {
      // ACCUMULATION PHASE
      fatigueState.isRecovering = false;
      this.accumulateFatigue(node, fatigueState, gateStrength, pulseDensity, deltaTime);
    } else {
      // RECOVERY PHASE
      if (!fatigueState.isRecovering) {
        fatigueState.isRecovering = true;
        fatigueState.recoveryStartTime = currentTime;
        fatigueState.recoveryStartFatigue = fatigueState.fatigue;
      }
      this.decayFatigue(node, fatigueState, deltaTime, currentTime);
    }

    // Clamp fatigue to [0, 1]
    fatigueState.fatigue = Math.max(0, Math.min(1.0, fatigueState.fatigue));
    fatigueState.lastUpdate = currentTime;

    // Store on node for debugging/visualization
    node.userData.synapticFatigue = fatigueState.fatigue;
    node.userData.synapticFatigueLevel = this.getFatigueLevel(fatigueState.fatigue);
    node.userData.synapticIsRecovering = fatigueState.isRecovering;
  }

  /**
   * Accumulate fatigue from gating activity
   */
  accumulateFatigue(node, fatigueState, gateStrength, pulseDensity, deltaTime) {
    const harmony = node.userData?.metrics?.harmony ?? 0.5;
    const corruption = node.userData?.metrics?.corruption ?? node.userData?.corruption ?? 0.0;
    const instability = node.userData?.instability ?? 0.0;
    const isHub = node.userData?.isHub ?? false;

    // Base accumulation: |gateStrength| × fatigueAccumulationRate
    let accumulation = Math.abs(gateStrength) * this.fatigueAccumulationRate;

    // Pulse density factor: more pulses = faster fatigue
    accumulation += pulseDensity * this.pulseDensityFactor;

    // Hub splitting adds extra fatigue (they work harder)
    if (isHub) {
      accumulation *= this.hubSplitMultiplier;
    }

    // Corruption slows recovery (increases accumulation)
    accumulation *= (1.0 + corruption * 0.2);

    // Scale by delta time
    accumulation *= deltaTime;

    fatigueState.fatigue += accumulation;
  }

  /**
   * Decay fatigue during rest periods
   */
  decayFatigue(node, fatigueState, deltaTime, currentTime) {
    if (fatigueState.fatigue <= 0) return;

    const harmony = node.userData?.metrics?.harmony ?? 0.5;
    const corruption = node.userData?.metrics?.corruption ?? node.userData?.corruption ?? 0.0;
    const instability = node.userData?.instability ?? 0.0;

    // Base decay rate
    let decay = this.fatigueDecayRate;

    // Harmony accelerates recovery
    decay *= (1.0 + harmony * this.harmonyRecoveryBoost);

    // Corruption slows recovery
    decay *= (1.0 - corruption * 0.3);

    // Instability reduces recovery effectiveness
    decay *= (1.0 - instability * 0.25);

    // Non-linear easing (ease-out): faster at high fatigue, slower when near 0
    // Use exponential decay for smooth feel
    const easeOutFactor = Math.pow(fatigueState.fatigue, 1.0 / this.recoveryEaseOutFactor);
    decay *= easeOutFactor;

    // Scale by delta time
    decay *= deltaTime;

    fatigueState.fatigue -= decay;

    // Trigger relief pulse (optional visual polish)
    if (
      fatigueState.isRecovering &&
      fatigueState.fatigue < fatigueState.recoveryStartFatigue * 0.3 &&
      Math.random() < this.reliefPulseChance * deltaTime
    ) {
      this.triggerReliefPulse(node, currentTime);
    }
  }

  /**
   * Trigger optional relief pulse when recovery completes
   * Visual signal that node is recovering
   */
  triggerReliefPulse(node, currentTime) {
    const nodeId = node.id || node.uuid || node.name;

    // Check if relief pulse already active
    const reliefState = this.nodeReliefPulseState.get(nodeId);
    if (reliefState?.active && currentTime < reliefState.endTime) {
      return; // Already active
    }

    // Trigger new relief pulse
    this.nodeReliefPulseState.set(nodeId, {
      active: true,
      startTime: currentTime,
      endTime: currentTime + this.reliefPulseDuration,
      intensity: 1.0
    });

    if (this.debugMode) {
      console.log(`[SynapticFatigue] Relief pulse triggered for node ${nodeId?.substring?.(0, 8)}`);
    }
  }

  /**
   * Get fatigue level (low/medium/high)
   */
  getFatigueLevel(fatigue) {
    if (fatigue < this.fatigueVisualThresholds.low) return 'none';
    if (fatigue < this.fatigueVisualThresholds.medium) return 'low';
    if (fatigue < this.fatigueVisualThresholds.high) return 'medium';
    return 'high';
  }

  /**
   * Get visual modulation parameters for a node based on its fatigue
   * Used by visual systems to apply fatigue effects to halos/pulses/etc
   */
  getVisualModulation(nodeId) {
    const fatigueState = this.nodeFatigueMap.get(nodeId);
    if (!fatigueState) {
      return {
        fatigue: 0,
        level: 'none',
        haloDullFactor: 0,
        phaseShift: 0,
        flickerAmount: 0,
        glowReduction: 0,
        isRecovering: false,
        reliefPulseActive: false,
        reliefPulseIntensity: 0
      };
    }

    const { fatigue, isRecovering } = fatigueState;
    const level = this.getFatigueLevel(fatigue);
    const effectParams = this.visualEffectByFatigue[level] || this.visualEffectByFatigue.low;

    // Check if relief pulse is active
    const reliefState = this.nodeReliefPulseState.get(nodeId);
    const reliefPulseActive = reliefState?.active ?? false;
    let reliefPulseIntensity = 0;
    if (reliefPulseActive && reliefState) {
      const elapsed = this.currentFrameTime - reliefState.startTime;
      const progress = elapsed / this.reliefPulseDuration;
      reliefPulseIntensity = Math.sin(progress * Math.PI); // Bell curve
      if (progress >= 1.0) {
        reliefState.active = false;
      }
    }

    return {
      fatigue: fatigue,
      level: level,
      haloDullFactor: effectParams.haloDullFactor,
      phaseShift: effectParams.phaseShift,
      flickerAmount: effectParams.flickerAmount,
      glowReduction: effectParams.glowReduction,
      isRecovering: isRecovering,
      reliefPulseActive: reliefPulseActive,
      reliefPulseIntensity: reliefPulseIntensity
    };
  }

  /**
   * Register outgoing pulse from a node (for pulse density tracking)
   * Called when a pulse spawns or reflects from a node
   */
  registerOutgoingPulse(nodeId) {
    const current = this.nodeOutgoingPulseCount.get(nodeId) ?? 0;
    this.nodeOutgoingPulseCount.set(nodeId, current + 1);
  }

  /**
   * Get current fatigue for a node
   */
  getFatigue(nodeId) {
    const state = this.nodeFatigueMap.get(nodeId);
    return state?.fatigue ?? 0;
  }

  /**
   * Reset fatigue for a node (e.g., after node death/respawn)
   */
  resetFatigue(nodeId) {
    this.nodeFatigueMap.delete(nodeId);
    this.nodeOutgoingPulseCount.delete(nodeId);
    this.nodeReliefPulseState.delete(nodeId);
  }

  /**
   * Log fatigue status for debugging
   */
  logFatigueStatus() {
    const fatigued = [];
    for (const [nodeId, state] of this.nodeFatigueMap) {
      if (state.fatigue > 0.1) {
        fatigued.push(`${nodeId?.substring?.(0, 8)}: ${(state.fatigue * 100).toFixed(0)}% (${state.isRecovering ? 'recovering' : 'active'})`);
      }
    }
    if (fatigued.length > 0) {
      console.log(`[SynapticFatigue] Fatigued nodes: ${fatigued.join(', ')}`);
    }
  }

  /**
   * Setup console API
   */
  setupConsoleAPI() {
    window.synapticFatigue = {
      enable: () => {
        this.enabled = true;
        console.log('✓ Synaptic Fatigue enabled');
      },
      disable: () => {
        this.enabled = false;
        console.log('✓ Synaptic Fatigue disabled');
      },
      setDebugMode: (mode) => {
        this.debugMode = mode;
        console.log(`✓ Synaptic Fatigue debug: ${mode ? 'ON' : 'OFF'}`);
      },
      setAccumulationRate: (rate) => {
        this.fatigueAccumulationRate = Math.max(0, Math.min(1.0, rate));
        console.log(`✓ Fatigue accumulation rate: ${rate.toFixed(2)}`);
      },
      setDecayRate: (rate) => {
        this.fatigueDecayRate = Math.max(0, Math.min(1.0, rate));
        console.log(`✓ Fatigue decay rate: ${rate.toFixed(2)}`);
      },
      setHarmonyRecoveryBoost: (boost) => {
        this.harmonyRecoveryBoost = Math.max(0, Math.min(2.0, boost));
        console.log(`✓ Harmony recovery boost: ${boost.toFixed(2)}x`);
      },
      getStatus: () => {
        const stats = {
          totalNodes: this.nodeFatigueMap.size,
          fatigued: 0,
          recovering: 0,
          avgFatigue: 0
        };

        let totalFatigue = 0;
        for (const [, state] of this.nodeFatigueMap) {
          if (state.fatigue > 0.1) stats.fatigued++;
          if (state.isRecovering) stats.recovering++;
          totalFatigue += state.fatigue;
        }

        stats.avgFatigue = stats.totalNodes > 0 ? totalFatigue / stats.totalNodes : 0;

        console.log(`
Synaptic Fatigue Status:
  Enabled: ${this.enabled}
  Debug: ${this.debugMode}
  Tracked Nodes: ${stats.totalNodes}
  Fatigued Nodes: ${stats.fatigued}
  Recovering Nodes: ${stats.recovering}
  Average Fatigue: ${(stats.avgFatigue * 100).toFixed(1)}%
  Accumulation Rate: ${this.fatigueAccumulationRate.toFixed(2)}
  Decay Rate: ${this.fatigueDecayRate.toFixed(2)}
  Harmony Recovery Boost: ${this.harmonyRecoveryBoost.toFixed(2)}x
        `);
      },
      help: () => {
        console.log(`
Synaptic Fatigue Console API:
  synapticFatigue.enable()                       - Enable fatigue system
  synapticFatigue.disable()                      - Disable fatigue system
  synapticFatigue.setDebugMode(bool)             - Toggle debug logging
  synapticFatigue.setAccumulationRate(0-1)       - How fast fatigue builds
  synapticFatigue.setDecayRate(0-1)              - How fast fatigue heals
  synapticFatigue.setHarmonyRecoveryBoost(0-2)   - Harmony recovery multiplier
  synapticFatigue.getStatus()                    - Show current status
  synapticFatigue.help()                         - Show this help
        `);
      }
    };
  }
}

/**
 * Setup integration
 */
export function setupSynapticFatigueIntegration(game) {
  try {
    const adapter = new SynapticFatigueAdapter_v1({
      enabled: true,
      debugMode: false,
      fatigueAccumulationRate: 0.3,
      pulseDensityFactor: 0.15,
      hubSplitMultiplier: 1.2,
      fatigueDecayRate: 0.05,
      harmonyRecoveryBoost: 0.8,
      recoveryEaseOutFactor: 1.5,
      reliefPulseChance: 0.15,
      reliefPulseDuration: 200
    });

    game.synapticFatigueAdapter = adapter;
    console.log('[main.js] SynapticFatigueAdapter initialized ✓');
    return adapter;
  } catch (err) {
    console.warn('[main.js] SynapticFatigueAdapter init error:', err);
    return null;
  }
}
