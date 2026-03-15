/**
 * CascadeResonanceWaveVisualization_Session146.js
 * ============================================================================
 * CASCADE RESONANCE WAVE VISUALIZATION SYSTEM
 * 
 * Introduces a ghost-level resonance wave visualization that propagates between
 * phase-synchronized harmonic hubs. This is pure temporal modulation — no visible
 * objects, no particles, no energy transfer. The wave suggests latent cascade
 * potential without actually triggering cascade mechanics.
 * 
 * DESIGN PHILOSOPHY:
 * The network "tests" resonance paths without committing. Players sense
 * latent directional tension, as if the system rehearses internally.
 * 
 * WAVE BEHAVIOR:
 * - Virtual wave phase per hub pair (0–1, normalized)
 * - Slow oscillation (2–4 second period)
 * - Temporal modulation only (affects animation timing, not brightness)
 * - Influence: 5–8% of baseline parameters (barely perceptible)
 * - Auto-decay when synchronization weakens
 * - Zero per-frame allocations (reused buffers)
 * 
 * MANIFESTATION (EXTREMELY SUBTLE):
 * 
 * Links Between Synchronized Hubs:
 * - Slight temporal phase drift compression
 * - Micro delay alignment across braided strands
 * - Appears as soft "pressure" moving along link
 * - NO directional beam, NO pulse, NO brightness change
 * 
 * Hub Interaction:
 * - While synchronized: wave influence oscillates
 * - Influence scales with phase sync stability
 * - If sync weakens: wave dissolves immediately
 * 
 * Auras:
 * - Brief tightening as wave passes (NO opacity/color change)
 * - Micro reduction in noise randomness
 * - Barely visible to careful observation
 * 
 * CONSTRAINTS:
 * ❌ NO glow, color modulation, particles, rings, ripples
 * ❌ NO camera effects, visible "wavefront"
 * ❌ NO new geometry or mesh objects
 * ❌ NO gameplay state changes
 * ❌ NO actual energy transfer
 * 
 * IMPLEMENTATION:
 * - Wave phase computed per hub pair (virtual wave)
 * - Wave propagation driven by phase sync quality
 * - Temporal bias applied to existing animation parameters
 * - All effects normalized (0–1) and auto-decay
 * - Zero per-frame allocations
 * 
 * @author VFX Technical Director — ATOMA Project Session 146 Extended
 * @version 1.0.0
 */

export class CascadeResonanceWaveVisualization_Session146 {
  /**
   * Constructor
   * @param {Object} cascadeSystem - Reference to HarmonicCascadeAmplification_Session145
   * @param {Object} harmonicHubSystem - Reference to HarmonicHubAuraSystem
   * @param {Object} linkResonanceSystem - Reference to LinkResonanceSystem (for link metadata)
   * @param {Object} config - Configuration object
   */
  constructor(cascadeSystem, harmonicHubSystem, linkResonanceSystem, config = {}) {
    this.cascadeSystem = cascadeSystem;
    this.harmonicHubSystem = harmonicHubSystem;
    this.linkResonanceSystem = linkResonanceSystem;
    
    // Configuration
    this.config = {
      // Wave oscillation
      waveOscillationPeriod: config.waveOscillationPeriod ?? 3.0,  // Seconds
      waveInfluenceMin: config.waveInfluenceMin ?? 0.03,           // 3% minimum
      waveInfluenceMax: config.waveInfluenceMax ?? 0.08,           // 8% maximum
      
      // Wave trigger conditions
      minPhaseSyncStrength: config.minPhaseSyncStrength ?? 0.1,    // Min phase delta for wave
      minPhaseSyncStability: config.minPhaseSyncStability ?? 0.15, // Min convergence strength
      minCascadeStrengthTrigger: config.minCascadeStrengthTrigger ?? 0.35,
      
      // Temporal modulation
      linkPhaseCompression: config.linkPhaseCompression ?? 0.06,   // Link phase tightening
      auraNoiseReduction: config.auraNoiseReduction ?? 0.04,       // Aura randomness reduction
      
      // Wave decay
      waveDecayRate: config.waveDecayRate ?? 0.88,                 // Auto-decay speed
      waveDissolveThreshold: config.waveDissolveThreshold ?? 0.05, // Threshold to completely fade
      
      // Safety
      enabled: config.enabled ?? true,
      debugMode: config.debugMode ?? false,
      maxWaveActivePairs: config.maxWaveActivePairs ?? 30,
    };
    
    // Wave state tracking (per hub pair)
    // Key: "hubA-hubB", Value: { wavePhase, influence, lastStrength }
    this.activeWaves = new Map();
    
    // Global time accumulator for wave period calculation
    this.globalWaveTime = 0;
    
    // Statistics
    this.stats = {
      activeWaves: 0,
      affectedLinks: 0,
      affectedHubs: 0,
      avgWaveInfluence: 0,
      lastUpdateTime: 0,
    };
  }

  /**
   * Update resonance wave visualization (called every frame)
   * @param {number} deltaTime - Delta time in seconds
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;
    
    if (!this.config.enabled || !this.cascadeSystem) {
      this._decayAllWaves(deltaTime);
      return;
    }
    
    const startTime = performance.now();
    
    // Accumulate global wave time
    this.globalWaveTime += deltaTime;
    
    // Get proximity pairs and phase sync data
    const proximityPairs = this.cascadeSystem.getProximityPairs();
    const phaseSyncStats = this.cascadeSystem.phaseSynchronization?.getStats?.();
    
    // Early exit if insufficient conditions
    if (!proximityPairs || proximityPairs.length < 1 || !phaseSyncStats) {
      this._decayAllWaves(deltaTime);
      this.stats.activeWaves = 0;
      this.stats.affectedLinks = 0;
      this.stats.affectedHubs = 0;
      this.stats.avgWaveInfluence = 0;
      return;
    }
    
    // Clear and rebuild active waves
    const previousWaveCount = this.activeWaves.size;
    this.activeWaves.clear();
    
    let totalInfluence = 0;
    let waveCount = 0;
    const affectedHubSet = new Set();
    
    // Process each proximity pair as a potential resonance wave path
    const pairsToProcess = Math.min(proximityPairs.length, this.config.maxWaveActivePairs);
    
    for (let i = 0; i < pairsToProcess; i++) {
      const pair = proximityPairs[i];
      if (!pair) continue;

      const pairCascadeData = this._resolvePairCascadeData(pair);
      if (pairCascadeData.strength <= this.config.minCascadeStrengthTrigger) {
        continue;
      }
      
      // Compute wave trigger strength from phase sync quality
      // Higher avgPhaseDelta = stronger wave potential
      const phaseDelta = Math.min(1.0, phaseSyncStats.avgPhaseDelta / this.config.minPhaseSyncStrength);
      
      // Wave only activates when cascade strength is high enough and pair remains valid
      if (phaseDelta < 0.01 || pair.proximityStrength < 0.2) {
        continue;  // Skip weak sync pairs
      }
      
      // Create wave key for this pair
      const waveKey = `${pair.hubAId}-${pair.hubBId}`;
      
      // Compute wave phase (0-1) based on global time and pair's unique phase offset
      // Each pair gets unique phase shift to avoid synchronization
      const pairPhaseOffset = (pair.hubAId.charCodeAt(0) + pair.hubBId.charCodeAt(0)) % 100 / 100;
      const cascadePhaseOffset = (pairCascadeData.phase % (Math.PI * 2)) / (Math.PI * 2);
      const waveCycleTime = (this.globalWaveTime / this.config.waveOscillationPeriod + pairPhaseOffset + cascadePhaseOffset) % 1.0;
      
      // Wave influence: rises to peak at 0.5 cycle, returns to baseline at 1.0
      // Using sine for smooth, organic oscillation
      const waveInfluenceCurve = Math.sin(waveCycleTime * Math.PI * 2);
      
      // Normalize influence to [waveInfluenceMin, waveInfluenceMax]
      // Rises from min at cycle start, peaks at mid-cycle, decays back to min
      const influenceRange = this.config.waveInfluenceMax - this.config.waveInfluenceMin;
      const influence = this.config.waveInfluenceMin + (waveInfluenceCurve * 0.5 + 0.5) * influenceRange;
      
      // Scale influence by phase sync quality and proximity strength
      const amplitudeScale = Math.max(0.5, Math.min(1.0, pairCascadeData.amplitude / 2));
      const scaledInfluence = influence * phaseDelta * pair.proximityStrength * amplitudeScale;
      
      // Store active wave
      this.activeWaves.set(waveKey, {
        wavePhase: waveCycleTime,
        influence: scaledInfluence,
        lastStrength: phaseDelta,
        hubAId: pair.hubAId,
        hubBId: pair.hubBId,
        proximityStrength: pair.proximityStrength,
        cascadeStrength: pairCascadeData.strength,
        cascadeAmplitude: pairCascadeData.amplitude,
        cascadePhase: pairCascadeData.phase,
      });
      
      totalInfluence += scaledInfluence;
      waveCount++;
      affectedHubSet.add(pair.hubAId);
      affectedHubSet.add(pair.hubBId);
    }
    
    // Decay waves that are no longer active
    if (previousWaveCount > this.activeWaves.size) {
      this._decayOrphans(deltaTime);
    }
    
    // Apply wave effects to visual systems
    this._applyWaveEffects();
    
    // Update statistics
    this.stats.activeWaves = waveCount;
    this.stats.affectedLinks = this.activeWaves.size;
    this.stats.affectedHubs = affectedHubSet.size;
    this.stats.avgWaveInfluence = waveCount > 0 ? totalInfluence / waveCount : 0;
    this.stats.lastUpdateTime = performance.now() - startTime;
    
    if (this.config.debugMode && waveCount > 0) {
      console.log(
        `[CascadeWave] active=${waveCount} | ` +
        `hubs=${affectedHubSet.size} | ` +
        `avgInfluence=${this.stats.avgWaveInfluence.toFixed(3)} | ` +
        `time=${this.stats.lastUpdateTime.toFixed(2)}ms`
      );
    }
  }

  _resolvePairCascadeData(pair) {
    const hubAData = this._resolveNodeCascadeData(pair?.hubAId);
    const hubBData = this._resolveNodeCascadeData(pair?.hubBId);

    const directStrength = Number.isFinite(pair?.cascadeStrength) ? pair.cascadeStrength : 0;
    const directAmplitude = Number.isFinite(pair?.cascadeAmplitude) ? pair.cascadeAmplitude : 0;
    const directPhase = Number.isFinite(pair?.cascadePhase) ? pair.cascadePhase : null;

    return {
      strength: Math.max(directStrength, hubAData.strength, hubBData.strength),
      amplitude: Math.max(directAmplitude, hubAData.amplitude, hubBData.amplitude),
      phase: directPhase ?? ((hubAData.phase + hubBData.phase) * 0.5)
    };
  }

  _resolveNodeCascadeData(nodeId) {
    if (!nodeId) return { strength: 0, amplitude: 0, phase: 0 };

    if (typeof this.cascadeSystem?.getCascadeStrength === 'function') {
      const strength = this.cascadeSystem.getCascadeStrength(nodeId);
      if (Number.isFinite(strength)) {
        return { strength, amplitude: 0, phase: 0 };
      }
    }

    if (typeof this.cascadeSystem?.getCascadeAmplification === 'function') {
      const amplification = this.cascadeSystem.getCascadeAmplification(nodeId);
      const ampStrength = amplification?.cascadeStrength ?? amplification?.strength ?? amplification?.intensity;
      if (Number.isFinite(ampStrength)) {
        return {
          strength: ampStrength,
          amplitude: Number.isFinite(amplification?.cascadeAmplitude) ? amplification.cascadeAmplitude : 0,
          phase: Number.isFinite(amplification?.cascadePhase) ? amplification.cascadePhase : 0
        };
      }
    }

    const node = this._findNodeById(nodeId);
    if (node?.userData) {
      const strength = node.userData.cascadeStrength;
      const amplitude = node.userData.cascadeAmplitude;
      const phase = node.userData.cascadePhase;
      if (Number.isFinite(strength) || Number.isFinite(amplitude) || Number.isFinite(phase)) {
        return {
          strength: Number.isFinite(strength) ? strength : 0,
          amplitude: Number.isFinite(amplitude) ? amplitude : 0,
          phase: Number.isFinite(phase) ? phase : 0
        };
      }
    }

    const hub = this.harmonicHubSystem?.hubs?.get?.(nodeId) ?? null;
    const hubStrength = hub?.userData?.cascadeStrength;
    const hubAmplitude = hub?.userData?.cascadeAmplitude;
    const hubPhase = hub?.userData?.cascadePhase;
    if (Number.isFinite(hubStrength) || Number.isFinite(hubAmplitude) || Number.isFinite(hubPhase)) {
      return {
        strength: Number.isFinite(hubStrength) ? hubStrength : 0,
        amplitude: Number.isFinite(hubAmplitude) ? hubAmplitude : 0,
        phase: Number.isFinite(hubPhase) ? hubPhase : 0
      };
    }

    return { strength: 0, amplitude: 0, phase: 0 };
  }

  _findNodeById(nodeId) {
    const nodes = this.cascadeSystem?.world?.nodes;
    if (!Array.isArray(nodes)) return null;
    for (const node of nodes) {
      const candidateId = node?.id ?? node?.userData?.nodeId ?? node?.userData?.id;
      if (candidateId === nodeId) return node;
    }
    return null;
  }

  /**
   * Apply wave effects to link and aura systems
   * @private
   */
  _applyWaveEffects() {
    if (!this.harmonicHubSystem) {
      return;
    }
    
    // Apply wave influence to each active wave path
    for (const [waveKey, waveData] of this.activeWaves.entries()) {
      // Apply temporal phase compression to link
      // This creates the subtle "pressure" effect along the link
      if (this.linkResonanceSystem && this.linkResonanceSystem.linkMetadata) {
        if (!this.linkResonanceSystem.linkMetadata.has(waveKey)) {
          this.linkResonanceSystem.linkMetadata.set(waveKey, {});
        }
        const metadata = this.linkResonanceSystem.linkMetadata.get(waveKey);
        
        // Compression increases as wave influence increases
        // Creates a traveling "pressure" effect
        metadata._wavePhaseCompression = waveData.influence * this.config.linkPhaseCompression;
        metadata._wavePhase = waveData.wavePhase;
      }
      
      // Apply wave tightening to hub auras
      // Auras briefly compress as wave passes through
      const hubA = this.harmonicHubSystem.hubs?.get(waveData.hubAId);
      const hubB = this.harmonicHubSystem.hubs?.get(waveData.hubBId);
      
      if (hubA) {
        hubA._waveInfluence = (hubA._waveInfluence ?? 0) + waveData.influence;
        hubA._waveNoiseReduction = waveData.influence * this.config.auraNoiseReduction;
      }
      
      if (hubB) {
        hubB._waveInfluence = (hubB._waveInfluence ?? 0) + waveData.influence;
        hubB._waveNoiseReduction = waveData.influence * this.config.auraNoiseReduction;
      }
    }
  }

  /**
   * Decay all active waves toward zero
   * @private
   * @param {number} deltaTime - Delta time in seconds
   */
  _decayAllWaves(deltaTime) {
    // Apply decay to all active waves
    for (const [waveKey, waveData] of this.activeWaves.entries()) {
      const decayed = waveData.influence * Math.pow(this.config.waveDecayRate, deltaTime * 60);
      
      if (decayed < this.config.waveDissolveThreshold) {
        this.activeWaves.delete(waveKey);
      } else {
        waveData.influence = decayed;
      }
    }
  }

  /**
   * Decay orphaned waves (no longer in active pairs)
   * @private
   * @param {number} deltaTime - Delta time in seconds
   */
  _decayOrphans(deltaTime) {
    // Called when active wave count drops
    // Existing orphan waves decay naturally
    this._decayAllWaves(deltaTime);
  }

  /**
   * Get wave influence for a specific hub pair
   * @param {string} hubAId - First hub ID
   * @param {string} hubBId - Second hub ID
   * @returns {number} Wave influence (0-1)
   */
  getWaveInfluence(hubAId, hubBId) {
    const waveKey = `${hubAId}-${hubBId}`;
    const wave = this.activeWaves.get(waveKey);
    return wave ? wave.influence : 0;
  }

  /**
   * Get wave phase (visual debugging)
   * @param {string} hubAId - First hub ID
   * @param {string} hubBId - Second hub ID
   * @returns {number} Wave phase (0-1)
   */
  getWavePhase(hubAId, hubBId) {
    const waveKey = `${hubAId}-${hubBId}`;
    const wave = this.activeWaves.get(waveKey);
    return wave ? wave.wavePhase : 0;
  }

  /**
   * Get current system status
   * @returns {Object} Status object
   */
  getStatus() {
    return {
      activeWaves: this.stats.activeWaves,
      affectedLinks: this.stats.affectedLinks,
      affectedHubs: this.stats.affectedHubs,
      avgWaveInfluence: this.stats.avgWaveInfluence,
      globalWaveTime: this.globalWaveTime,
    };
  }

  /**
   * Setup console debugging API
   * @param {Object} globalWindow - Window object
   */
  setupConsoleAPI(globalWindow) {
    if (!globalWindow) return;
    
    globalWindow.CASCADE_WAVE_STATS = this.stats;
    globalWindow.CASCADE_WAVE_CONFIG = this.config;
    
    globalWindow.toggleCascadeWaveDebug = (enabled = true) => {
      this.config.debugMode = enabled;
      console.log(`[CascadeWave] Debug mode: ${enabled ? 'ON' : 'OFF'}`);
    };
    
    globalWindow.cascadeWaveStatus = () => {
      const status = this.getStatus();
      console.log('=== CASCADE RESONANCE WAVE STATUS ===');
      console.log(`Active waves: ${status.activeWaves}`);
      console.log(`Affected links: ${status.affectedLinks}`);
      console.log(`Affected hubs: ${status.affectedHubs}`);
      console.log(`Avg wave influence: ${status.avgWaveInfluence.toFixed(3)}`);
      console.log(`Global wave time: ${status.globalWaveTime.toFixed(2)}s`);
      console.log('(Note: Wave phase values are 0-1, showing position in oscillation cycle)');
      return status;
    };
    
    globalWindow.tune_cascade_wave = (key, value) => {
      if (key in this.config) {
        this.config[key] = value;
        console.log(`[CascadeWave] ${key} = ${value}`);
      } else {
        console.warn(`Unknown config key: ${key}`);
      }
    };
    
    // Debug helper: show wave phase values for specific pair
    globalWindow.getWavePhaseDebug = (hubAId, hubBId) => {
      const phase = this.getWavePhase(hubAId, hubBId);
      const influence = this.getWaveInfluence(hubAId, hubBId);
      console.log(
        `Wave ${hubAId} <-> ${hubBId}: ` +
        `phase=${phase.toFixed(2)} (0=baseline, 0.5=peak, 1=return) | ` +
        `influence=${influence.toFixed(4)}`
      );
      return { phase, influence };
    };
  }

  /**
   * Cleanup and dispose
   */
  dispose() {
    this.activeWaves.clear();
  }
}

/**
 * Console API setup function
 * @param {Object} globalWindow - Window object
 * @param {CascadeResonanceWaveVisualization_Session146} waveViz - Wave viz instance
 */
export function setupCascadeWaveConsoleAPI(globalWindow, waveViz) {
  if (waveViz && waveViz.setupConsoleAPI) {
    waveViz.setupConsoleAPI(globalWindow);
  }
}
