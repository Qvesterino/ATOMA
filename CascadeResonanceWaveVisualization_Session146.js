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
    this.semanticBus = config.semanticBus ?? globalThis?.semanticBus ?? null;
    
    // Configuration
    this.config = {
      // Wave oscillation
      waveOscillationPeriod: config.waveOscillationPeriod ?? 3.0,  // Seconds
      waveInfluenceMin: config.waveInfluenceMin ?? 0.65,           // Debug-visible minimum
      waveInfluenceMax: config.waveInfluenceMax ?? 1.0,            // Debug-visible maximum
      
      // Wave trigger conditions
      minPhaseSyncStrength: config.minPhaseSyncStrength ?? 0.04,    // Min phase delta for wave
      minPhaseSyncStability: config.minPhaseSyncStability ?? 0.04, // Min convergence strength
      minCascadeStrengthTrigger: config.minCascadeStrengthTrigger ?? 0.15,
      
      // Temporal modulation
      linkPhaseCompression: config.linkPhaseCompression ?? 0.2,    // Link phase tightening
      auraNoiseReduction: config.auraNoiseReduction ?? 0.14,       // Aura randomness reduction
      
      // Wave decay
      waveDecayRate: config.waveDecayRate ?? 0.94,                 // Auto-decay speed
      waveDissolveThreshold: config.waveDissolveThreshold ?? 0.02, // Threshold to completely fade
      
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

    this._semanticUnsubscribers = [];
    this._semanticBusRef = null;
    this._semanticSubscribed = false;
    this._subscribeCascadeEvents();
  }

  _clearCascadeSubscriptions() {
    for (const unsub of this._semanticUnsubscribers) {
      try {
        unsub?.();
      } catch (_) {
        // noop
      }
    }
    this._semanticUnsubscribers.length = 0;
    this._semanticBusRef = null;
    this._semanticSubscribed = false;
  }

  _subscribeCascadeEvents() {
    const bus = this.semanticBus || null;
    if (!bus) return;

    if (this._semanticSubscribed && this._semanticBusRef === bus) {
      return;
    }

    this._clearCascadeSubscriptions();

    const on = bus?.on?.bind(bus);
    if (typeof on !== 'function') return;

    const onCascadeStart = (event = {}) => {
      const activation = this._resolveWaveActivation(event);
      if (!activation) return;

      const sourceNode = this._resolveCascadeEndpoint(
        event.sourceNode ||
        event.source ||
        event.from ||
        event.sourceId ||
        event.sourceNodeId ||
        event.fromId,
        event.sourceNodeId ?? event.sourceId ?? event.fromId ?? null
      );
      const targetNode = this._resolveCascadeEndpoint(
        event.targetNode ||
        event.target ||
        event.to ||
        event.targetId ||
        event.targetNodeId ||
        event.toId,
        event.targetNodeId ?? event.targetId ?? event.toId ?? null
      );

      if (!sourceNode || !targetNode) return;

      this.handleCascadeStart({
        ...event,
        ...activation,
        sourceNode,
        targetNode
      });
    };

    const onCascadeHop = (event = {}) => {
      if (!event) return;
      const activation = this._resolveWaveActivation(event);
      if (!activation) return;

      const linkPayload = event.link || event;
      const sourceNode = this._resolveCascadeEndpoint(
        linkPayload?.source ||
        linkPayload?.sourceNode ||
        linkPayload?.from ||
        event.sourceNode ||
        event.fromNode ||
        event.sourceId ||
        event.sourceNodeId ||
        event.fromId,
        event.sourceNodeId ?? event.sourceId ?? event.fromId ?? null
      );
      const targetNode = this._resolveCascadeEndpoint(
        linkPayload?.target ||
        linkPayload?.targetNode ||
        linkPayload?.to ||
        event.targetNode ||
        event.toNode ||
        event.targetId ||
        event.targetNodeId ||
        event.toId,
        event.targetNodeId ?? event.targetId ?? event.toId ?? null
      );

      if (!sourceNode || !targetNode) return;

      this.handleCascadeHop({
        ...event,
        ...activation,
        sourceNode,
        targetNode
      });
    };

    on('cascade.start', onCascadeStart);
    on('cascade.hop', onCascadeHop);
    this._semanticBusRef = bus;
    this._semanticSubscribed = true;

    if (typeof bus?.off === 'function') {
      this._semanticUnsubscribers.push(() => bus.off('cascade.start', onCascadeStart));
      this._semanticUnsubscribers.push(() => bus.off('cascade.hop', onCascadeHop));
    } else if (typeof bus?.unsubscribe === 'function') {
      this._semanticUnsubscribers.push(() => bus.unsubscribe('cascade.start', onCascadeStart));
      this._semanticUnsubscribers.push(() => bus.unsubscribe('cascade.hop', onCascadeHop));
    }
  }

  rebind(config = {}) {
    if (config.cascadeSystem !== undefined) {
      this.cascadeSystem = config.cascadeSystem;
    }
    if (config.harmonicHubSystem !== undefined) {
      this.harmonicHubSystem = config.harmonicHubSystem;
    }
    if (config.linkResonanceSystem !== undefined) {
      this.linkResonanceSystem = config.linkResonanceSystem;
    }
    if (config.semanticBus !== undefined) {
      this.semanticBus = config.semanticBus;
    }
    if (config.frameScheduler !== undefined) {
      this.frameScheduler = config.frameScheduler;
    }

    this._subscribeCascadeEvents();
    return this;
  }

  _resolveNodeId(node) {
    return node?.userData?.nodeId ?? node?.userData?.id ?? node?.id ?? node?.uuid ?? null;
  }

  _resolveCascadeEndpoint(endpoint, endpointId = null) {
    if (endpoint && typeof endpoint === 'object') {
      return endpoint;
    }

    const candidateId = endpointId ?? endpoint;
    if (candidateId === null || candidateId === undefined) {
      return null;
    }

    return this._findNodeById(candidateId) || null;
  }

  _clamp01(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
  }

  _resolveWaveActivation(event = {}) {
    const phaseSyncStrength = this._clamp01(
      event?.phaseSyncStrength ??
      event?.syncStrength ??
      event?.strength ??
      event?.intensity ??
      event?.value ??
      0
    );
    const phaseSyncStability = this._clamp01(
      event?.phaseSyncStability ??
      event?.syncStability ??
      event?.stability ??
      event?.harmony ??
      event?.intensity ??
      event?.value ??
      0
    );

    if (phaseSyncStrength <= 0 || phaseSyncStability <= 0) {
      return null;
    }

    return {
      phaseSyncStrength,
      phaseSyncStability,
      intensity: this._clamp01(
        event?.intensity ??
        event?.value ??
        ((phaseSyncStrength + phaseSyncStability) * 0.5)
      )
    };
  }

  handleCascadeStart(event = {}) {
    const activation = this._resolveWaveActivation(event);
    if (!activation) return;
    if (activation.phaseSyncStrength < this.config.minPhaseSyncStrength) return;
    if (activation.phaseSyncStability < this.config.minPhaseSyncStability) return;
    if (activation.intensity < this.config.minCascadeStrengthTrigger) return;

    if (!event?.sourceNode || !event?.targetNode) return;

    this.spawnCascadeResonanceWave(
      event.sourceNode,
      event.targetNode,
      activation.intensity,
      event.hopIndex ?? 0
    );
  }

  handleCascadeHop(event = {}) {
    const activation = this._resolveWaveActivation(event);
    if (!activation) return;
    if (activation.phaseSyncStrength < this.config.minPhaseSyncStrength) return;
    if (activation.phaseSyncStability < this.config.minPhaseSyncStability) return;
    if (activation.intensity < this.config.minCascadeStrengthTrigger) return;

    if (!event?.sourceNode || !event?.targetNode) return;

    this.spawnCascadeResonanceWave(
      event.sourceNode,
      event.targetNode,
      activation.intensity,
      event.hopIndex ?? 0
    );
  }

  spawnCascadeResonanceWave(sourceNode, targetNode, intensity = 1.0, hopIndex = 0) {
    const resolvedSource = this._resolveCascadeEndpoint(sourceNode);
    const resolvedTarget = this._resolveCascadeEndpoint(targetNode);
    const sourceId = this._resolveNodeId(resolvedSource) ?? this._resolveNodeId(sourceNode);
    const targetId = this._resolveNodeId(resolvedTarget) ?? this._resolveNodeId(targetNode);
    if (!sourceId || !targetId) return;

    const waveKey = `${sourceId}-${targetId}`;
    const clampedIntensity = Math.max(0, Math.min(1, Number(intensity) || 0));
    if (clampedIntensity <= 0) return;

    const hop = Math.max(0, Number(hopIndex) || 0);
    const hopDecay = Math.pow(0.9, hop);
    const influenceRange = this.config.waveInfluenceMax - this.config.waveInfluenceMin;
    const influence = this.config.waveInfluenceMin + clampedIntensity * hopDecay * influenceRange;

    this.activeWaves.set(waveKey, {
      wavePhase: this.globalWaveTime % 1,
      influence: Math.max(this.config.waveInfluenceMin, Math.min(this.config.waveInfluenceMax, influence)),
      lastStrength: clampedIntensity,
      hubAId: sourceId,
      hubBId: targetId,
      proximityStrength: 1.0,
      cascadeStrength: clampedIntensity,
      cascadeAmplitude: clampedIntensity,
      cascadePhase: this.globalWaveTime
    });
  }

  /**
   * Update resonance wave visualization (called every frame)
   * @param {number} deltaTime - Delta time in seconds
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;
    
    if (!this.config.enabled) {
      this._decayAllWaves(deltaTime);
      return;
    }
    
    const startTime = performance.now();
    
    // Accumulate global wave time
    this.globalWaveTime += deltaTime;
    
    // Event-driven mode: no proximity scanning, no cascadeSystem/hub polling triggers.
    this._decayAllWaves(deltaTime);
    this._bootstrapWaveFromActiveHubs();

    let totalInfluence = 0;
    let waveCount = 0;
    const affectedHubSet = new Set();
    for (const waveData of this.activeWaves.values()) {
      totalInfluence += waveData.influence;
      waveCount += 1;
      if (waveData.hubAId) affectedHubSet.add(waveData.hubAId);
      if (waveData.hubBId) affectedHubSet.add(waveData.hubBId);
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

  _bootstrapWaveFromActiveHubs() {
    if (this.activeWaves.size > 0) return false;
    if (!this.harmonicHubSystem?.hubs || typeof this.harmonicHubSystem.hubs.values !== 'function') return false;

    const activeHubs = Array.from(this.harmonicHubSystem.hubs.values()).filter((hub) => hub && hub.active !== false);
    if (activeHubs.length < 2) return false;

    const sortedHubs = activeHubs
      .slice()
      .sort((a, b) => (Number(b.synergy) || 0) - (Number(a.synergy) || 0));

    const hubA = sortedHubs[0];
    const hubB = sortedHubs.find((hub) => this._resolveNodeId(hub?.primaryNode ?? hub?.nodes?.[0]) !== this._resolveNodeId(hubA?.primaryNode ?? hubA?.nodes?.[0]))
      ?? sortedHubs[1];

    const sourceNode = hubA?.primaryNode ?? hubA?.nodes?.[0] ?? null;
    const targetNode = hubB?.primaryNode ?? hubB?.nodes?.[0] ?? null;
    const sourceId = this._resolveNodeId(sourceNode);
    const targetId = this._resolveNodeId(targetNode);
    if (!sourceId || !targetId) return false;
    if (sourceId === targetId) return false;

    const now = performance.now();
    const bootstrapKey = `${sourceId}-${targetId}`;
    if (this._bootstrapWaveKey === bootstrapKey && now < (this._bootstrapWaveCooldownUntil ?? 0)) {
      return false;
    }

    const avgHubStrength = Math.max(0, Math.min(1, ((Number(hubA?.synergy) || 0) + (Number(hubB?.synergy) || 0)) * 0.5));
    const avgHubHarmony = Math.max(0, Math.min(1, ((Number(hubA?.harmony) || 0) + (Number(hubB?.harmony) || 0)) * 0.5));
    const bootstrapIntensity = Math.max(
      this.config.waveInfluenceMin,
      Math.min(
        this.config.waveInfluenceMax,
        0.2 + avgHubStrength * 0.35 + avgHubHarmony * 0.25
      )
    );

    this.spawnCascadeResonanceWave(sourceNode, targetNode, bootstrapIntensity, 0);
    this._bootstrapWaveKey = bootstrapKey;
    this._bootstrapWaveCooldownUntil = now + 750;
    return true;
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
    const candidateSources = [
      this.cascadeSystem?.world?.nodes,
      this.harmonicHubSystem?.world?.nodes,
      this.linkResonanceSystem?.world?.nodes,
      globalThis?.game?.aiNodes?.nodes,
      globalThis?.aiNodes?.nodes
    ];

    for (const nodes of candidateSources) {
      if (!Array.isArray(nodes)) continue;
      for (const node of nodes) {
        const candidateId = node?.id ?? node?.userData?.nodeId ?? node?.userData?.id;
        if (candidateId === nodeId) return node;
      }
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
    this._clearCascadeSubscriptions();
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
