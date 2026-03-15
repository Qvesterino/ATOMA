/**
 * SynapticGatingAdapter_v1.js
 * ============================================================================
 * Synaptic Gating for Pulse Waves: Selective Amplification & Dampening at Nodes
 * 
 * VISUAL NARRATIVE LAYER: Each node acts as a synapse that filters, amplifies,
 * or dampens pulse waves based on its internal state (harmony/corruption/instability).
 * 
 * Core Concept:
 * - Healthy nodes AMPLIFY signals (gateStrength > 0)
 * - Corrupted nodes DAMP signals (gateStrength < 0)
 * - Unstable nodes LEAK signals (gateStrength turbulent)
 * 
 * NO GAMEPLAY CHANGES, NO ALLOCATIONS, PURELY VISUAL
 * Pure visual storytelling about information flow and node intelligence.
 * 
 * State-Driven Gating:
 * - gateStrength = (harmony - corruption) × weight - instability × instabilityWeight
 * - Clamped to [-1.0, +1.0]
 * - Zero randomness, deterministic only
 * - Synergy scales magnitude but never changes sign
 */

/**
 * Main synaptic gating adapter
 */
export class SynapticGatingAdapter_v1 {
  constructor(config = {}) {
    this.enabled = config.enabled ?? true;
    this.debugMode = config.debugMode ?? false;
    this.maxNodesPerTick = config.maxNodesPerTick ?? 120; // cap per 30Hz tick
    this._nodeCursor = 0;
    
    // Gating computation weights
    this.harmonyWeight = config.harmonyWeight ?? 0.6;        // How much harmony helps
    this.corruptionWeight = config.corruptionWeight ?? 0.8;  // How much corruption hurts
    this.instabilityWeight = config.instabilityWeight ?? 0.4; // How much instability reduces gating
    this.synergyMagnitudeScale = config.synergyMagnitudeScale ?? 0.5;
    
    // Gate strength bounds
    this.minGateStrength = -1.0;
    this.maxGateStrength = 1.0;
    
    // Amplification multiplier bounds (prevent infinite amplification)
    this.maxAmplificationMultiplier = config.maxAmplificationMultiplier ?? 1.6;
    this.minDampeningMultiplier = config.minDampeningMultiplier ?? 0.4;
    
    // Effect modulation
    this.pulseAmplitudeFactor = config.pulseAmplitudeFactor ?? 0.8;
    this.pulseLengthFactor = config.pulseLengthFactor ?? 0.6;
    this.haloBreatheIntensity = config.haloBreatheIntensity ?? 0.15;
    
    // Caching (avoid recomputation)
    this.nodeGateCache = new Map();  // nodeId → { gateStrength, lastUpdate }
    this.cacheExpiry = 100;           // ms (refresh every frame roughly)
    
    // Console API
    this.setupConsoleAPI();
    
    console.log('[SynapticGatingAdapter] Initialized ✓');
  }

  /**
   * Compute gate strength for all nodes
   * Call once per frame at START of pulse processing
   * 
   * Returns: Map<nodeId, gateStrength>
   */
  updateNodeGates(nodes = []) {
    if (!this.enabled) return new Map();
    
    const gateMap = new Map();
    const now = Date.now();
    const total = nodes.length;
    if (total === 0) {
      this.nodeGateMap = gateMap;
      return gateMap;
    }

    const maxPerTick = Math.max(1, Math.min(this.maxNodesPerTick, total));
    this._nodeCursor = this._nodeCursor % total;

    // Pass 1: seed map with cached values (including stale) to preserve outputs
    for (let i = 0; i < total; i++) {
      const node = nodes[i];
      if (!node || !node.userData) continue;
      const nodeId = node.id || node.uuid || node.name;
      if (!nodeId) continue;
      const cached = this.nodeGateCache.get(nodeId);
      if (cached) {
        gateMap.set(nodeId, cached.gateStrength);
      }
    }

    // Pass 2: recompute a capped slice starting from cursor
    let processed = 0;
    try {
      while (processed < maxPerTick) {
        const idx = (this._nodeCursor + processed) % total;
        const node = nodes[idx];
        if (node && node.userData) {
          const nodeId = node.id || node.uuid || node.name;
          if (nodeId) {
            const gateStrength = this.computeGateStrength(node);
            this.nodeGateCache.set(nodeId, {
              gateStrength,
              lastUpdate: now
            });
            gateMap.set(nodeId, gateStrength);
            node.userData.synapticGateStrength = gateStrength;
          }
        }
        processed += 1;
      }
    } catch (err) {
      console.warn('[SynapticGatingAdapter] updateNodeGates error:', err);
    }

    this._nodeCursor = (this._nodeCursor + processed) % total;
    this.nodeGateMap = gateMap;
    return gateMap;
  }

  /**
   * Compute gate strength deterministically from node state
   * gateStrength = (harmony - corruption) × harmonyWeight - instability × instabilityWeight
   * 
   * Clamped to [-1, 1]
   * Modulated by synergy (magnitude only)
   */
  computeGateStrength(node) {
    const harmony = node.userData?.metrics?.harmony ?? 0.5;
    const corruption = node.userData?.corruption ?? 0.0;
    const instability = node.userData?.instability ?? 0.0;
    const synergy = node.userData?.metrics?.synergy ?? 0.5;
    
    // Base gate computation
    const harmonyTerm = (harmony - corruption) * this.harmonyWeight;
    const instabilityTerm = instability * this.instabilityWeight;
    let gateStrength = harmonyTerm - instabilityTerm;
    
    // Synergy scales magnitude (not polarity)
    // Higher synergy makes gating more pronounced
    const synergyScale = 0.7 + (synergy * this.synergyMagnitudeScale);
    gateStrength *= synergyScale;
    
    // Clamp to safe bounds
    gateStrength = Math.max(
      this.minGateStrength,
      Math.min(this.maxGateStrength, gateStrength)
    );
    
    if (this.debugMode && Math.random() < 0.01) {
      console.log(
        `[SynapticGating] Node ${node.id?.substring?.(0, 8) || '?'}: ` +
        `harmony=${harmony.toFixed(2)}, corruption=${corruption.toFixed(2)}, ` +
        `instability=${instability.toFixed(2)}, synergy=${synergy.toFixed(2)} ` +
        `→ gateStrength=${gateStrength.toFixed(2)}`
      );
    }
    
    return gateStrength;
  }

  /**
   * Get amplification multiplier for outgoing pulse
   * gateStrength > 0 → amplification (multiply by >1.0)
   * gateStrength < 0 → dampening (multiply by <1.0)
   * gateStrength ≈ 0 → pass-through (1.0)
   */
  getAmplificationMultiplier(gateStrength) {
    // Linear interpolation:
    // -1.0 → minDampeningMultiplier (e.g., 0.4)
    //  0.0 → 1.0 (neutral)
    // +1.0 → maxAmplificationMultiplier (e.g., 1.6)
    
    let multiplier;
    if (gateStrength >= 0) {
      // Amplification range
      multiplier = 1.0 + (gateStrength * (this.maxAmplificationMultiplier - 1.0));
    } else {
      // Dampening range
      multiplier = 1.0 + (gateStrength * (this.minDampeningMultiplier - 1.0));
    }
    
    return Math.max(this.minDampeningMultiplier, Math.min(this.maxAmplificationMultiplier, multiplier));
  }

  /**
   * Get halo response (brief breathing effect)
   * Positive gateStrength → expand + brighten
   * Negative gateStrength → contract + dim
   * Returns: { scaleMultiplier, emissiveBoost, duration }
   */
  getHaloResponse(gateStrength) {
    const absGate = Math.abs(gateStrength);
    
    if (gateStrength > 0.2) {
      // Amplification: halo "breathes in" and brightens
      return {
        scaleMultiplier: 1.0 + (gateStrength * 0.15),  // Subtle expansion
        emissiveBoost: gateStrength * this.haloBreatheIntensity * 0.8,
        duration: 150 + (absGate * 50),
        type: 'amplify'
      };
    } else if (gateStrength < -0.2) {
      // Dampening: halo "breathes out" and dims
      return {
        scaleMultiplier: 1.0 - (Math.abs(gateStrength) * 0.1),  // Subtle contraction
        emissiveBoost: gateStrength * this.haloBreatheIntensity * 0.6,  // Negative = dim
        duration: 120 + (absGate * 40),
        type: 'dampen'
      };
    } else {
      // Neutral: minimal response
      return {
        scaleMultiplier: 1.0,
        emissiveBoost: 0,
        duration: 80,
        type: 'neutral'
      };
    }
  }

  /**
   * Apply gating modulation to outgoing pulse parameters
   * Called by boundary interaction adapter when spawning reflected/split pulses
   * 
   * @param {number} gateStrength - Node's synaptic gate strength [-1, 1]
   * @param {Object} pulseParams - { amplitude, length, coherence, ... }
   * @returns {Object} Modified pulse parameters
   */
  applyGatingModulation(gateStrength, pulseParams) {
    const multiplier = this.getAmplificationMultiplier(gateStrength);
    
    return {
      amplitude: (pulseParams.amplitude ?? 1.0) * multiplier,
      length: (pulseParams.length ?? 1.0) * (0.8 + (multiplier - 1.0) * this.pulseLengthFactor),
      coherence: (pulseParams.coherence ?? 1.0) * Math.max(0.5, 1.0 - Math.abs(gateStrength) * 0.3),
      gatingApplied: true,
      gatingStrength: gateStrength,
      modifiedBy: 'synapticGating'
    };
  }

  /**
   * Get visual modulation for pulse at node boundary
   * Used to modulate pulse appearance near endpoint during gating
   */
  getPulseModulation(gateStrength, progress = 0) {
    // progress: 0 (at node) → 1 (far from node)
    // Gating effects fade out over distance
    
    const multiplier = this.getAmplificationMultiplier(gateStrength);
    const fadeOut = Math.pow(progress, 0.5);  // Smooth fade
    
    return {
      intensityModulation: (multiplier - 1.0) * fadeOut,
      coherenceModulation: -Math.abs(gateStrength) * 0.2 * fadeOut,
      colorShift: gateStrength > 0 ? 'brighter' : 'dimmer',  // Visual cue
      gatingActive: Math.abs(gateStrength) > 0.1
    };
  }

  /**
   * Apply gating to pulse based on node it's leaving
   * Used in boundary interaction processing
   * 
   * Returns modulation object for visual systems to consume
   */
  applyGatingToOutgoingPulse(node, pulse) {
    if (!node || !pulse) return null;
    
    const gateStrength = node.userData?.synapticGateStrength ?? 0;
    if (Math.abs(gateStrength) < 0.05) return null;  // Below threshold
    
    return {
      nodeId: node.id || node.uuid || node.name,
      gateStrength: gateStrength,
      amplification: this.getAmplificationMultiplier(gateStrength),
      haloResponse: this.getHaloResponse(gateStrength),
      pulseModification: this.applyGatingModulation(gateStrength, {
        amplitude: pulse.amplitude,
        length: pulse.length,
        coherence: 1.0
      })
    };
  }

  /**
   * Setup console API
   */
  setupConsoleAPI() {
    window.synapticGating = {
      enable: () => {
        this.enabled = true;
        console.log('✓ Synaptic Gating enabled');
      },
      disable: () => {
        this.enabled = false;
        console.log('✓ Synaptic Gating disabled');
      },
      setDebugMode: (mode) => {
        this.debugMode = mode;
        console.log(`✓ Synaptic Gating debug: ${mode ? 'ON' : 'OFF'}`);
      },
      setHarmonyWeight: (weight) => {
        this.harmonyWeight = Math.max(0, Math.min(1.0, weight));
        console.log(`✓ Harmony weight: ${weight.toFixed(2)}`);
      },
      setInstabilityWeight: (weight) => {
        this.instabilityWeight = Math.max(0, Math.min(1.0, weight));
        console.log(`✓ Instability weight: ${weight.toFixed(2)}`);
      },
      setMaxAmplification: (multiplier) => {
        this.maxAmplificationMultiplier = Math.max(1.0, Math.min(3.0, multiplier));
        console.log(`✓ Max amplification: ${multiplier.toFixed(2)}x`);
      },
      setMinDampening: (multiplier) => {
        this.minDampeningMultiplier = Math.max(0.1, Math.min(1.0, multiplier));
        console.log(`✓ Min dampening: ${multiplier.toFixed(2)}x`);
      },
      getStatus: () => {
        console.log(`
Synaptic Gating Status:
  Enabled: ${this.enabled}
  Debug: ${this.debugMode}
  Harmony Weight: ${this.harmonyWeight.toFixed(2)}
  Corruption Weight: ${this.corruptionWeight.toFixed(2)}
  Instability Weight: ${this.instabilityWeight.toFixed(2)}
  Synergy Magnitude Scale: ${this.synergyMagnitudeScale.toFixed(2)}
  Max Amplification: ${this.maxAmplificationMultiplier.toFixed(2)}x
  Min Dampening: ${this.minDampeningMultiplier.toFixed(2)}x
  Cached Nodes: ${this.nodeGateCache.size}
        `);
      },
      help: () => {
        console.log(`
Synaptic Gating Console API:
  synapticGating.enable()                   - Enable gating
  synapticGating.disable()                  - Disable gating
  synapticGating.setDebugMode(bool)         - Toggle debug logging
  synapticGating.setHarmonyWeight(0-1)      - Adjust harmony influence
  synapticGating.setInstabilityWeight(0-1)  - Adjust instability influence
  synapticGating.setMaxAmplification(1-3)   - Adjust max amplification
  synapticGating.setMinDampening(0.1-1)     - Adjust min dampening
  synapticGating.getStatus()                - Show current settings
  synapticGating.help()                     - Show this help
        `);
      }
    };
  }
}

/**
 * Setup integration
 */
export function setupSynapticGatingIntegration(game) {
  try {
    const adapter = new SynapticGatingAdapter_v1({
      enabled: true,
      debugMode: false,
      harmonyWeight: 0.6,
      corruptionWeight: 0.8,
      instabilityWeight: 0.4,
      synergyMagnitudeScale: 0.5,
      maxAmplificationMultiplier: 1.6,
      minDampeningMultiplier: 0.4,
      pulseAmplitudeFactor: 0.8,
      pulseLengthFactor: 0.6,
      haloBreatheIntensity: 0.15
    });
    
    game.synapticGatingAdapter = adapter;
    console.log('[main.js] SynapticGatingAdapter initialized ✓');
    return adapter;
  } catch (err) {
    console.warn('[main.js] SynapticGatingAdapter init error:', err);
    return null;
  }
}
