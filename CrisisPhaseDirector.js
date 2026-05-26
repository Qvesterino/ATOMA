/**
 * CRISIS PHASE DIRECTOR
 * =====================
 * Sits above DoctrineRuntime and manages rich phased crisis lifecycle.
 * Subscribes to doctrine.crisis:start/end/tick, tracks player agency,
 * evaluates outcomes, and applies world-specific crisis grammar.
 *
 * Phase lifecycle: INTRO → SURGE → PEAK → DECAY → RESOLVED
 */

import { eventRegistrationRegistry } from './Engine/EventRegistrationRegistry.js';

function clamp01(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(1, numeric));
}

function getNowMs() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

// ── Phase definitions ───────────────────────────────────────────────────────
const PHASES = Object.freeze({
  INTRO: 'INTRO',
  SURGE: 'SURGE',
  PEAK: 'PEAK',
  DECAY: 'DECAY',
  RESOLVED: 'RESOLVED'
});

// ── World-specific phase durations (seconds) ──────────────────────────────
const WORLD_PHASE_CONFIG = Object.freeze({
  default: Object.freeze({
    introDuration: 2.5,
    surgeDuration: 4.0,
    peakDuration: 2.5,
    decayDuration: 2.0,
    tickPressureScaleMultiplier: 1.0,
    rerouteReliefScaleMultiplier: 1.0,
    reinforceDurationMultiplier: 1.0,
    reinforceStabilityCostMultiplier: 1.0,
    rewindSynergyThresholdOffset: 0,
    threatElevation: false
  }),
  quantum: Object.freeze({
    introDuration: 1.5,
    surgeDuration: 3.0,
    peakDuration: 2.0,
    decayDuration: 2.0,
    tickPressureScaleMultiplier: 1.3,
    rerouteReliefScaleMultiplier: 1.4,
    reinforceDurationMultiplier: 1.0,
    reinforceStabilityCostMultiplier: 1.0,
    rewindSynergyThresholdOffset: 0.04,
    threatElevation: true
  }),
  desert: Object.freeze({
    introDuration: 3.0,
    surgeDuration: 6.0,
    peakDuration: 4.0,
    decayDuration: 3.0,
    tickPressureScaleMultiplier: 1.0,
    rerouteReliefScaleMultiplier: 1.0,
    reinforceDurationMultiplier: 1.3,
    reinforceStabilityCostMultiplier: 0.8,
    rewindSynergyThresholdOffset: 0.02,
    threatElevation: true
  })
});

// ── Player agency scoring ─────────────────────────────────────────────────
const AGENCY_SCORES = Object.freeze({
  reinforceCorridor: 2.0,
  rerouteHotspot: 3.0,
  abandonCorridor: 1.0,
  createLink: 0.5,
  tensionRecovered: 1.0,
  fractureResidueCreated: -1.0,
  nodeStabilized: 0.5
});

// ── Outcome thresholds ──────────────────────────────────────────────────────
const OUTCOME_THRESHOLDS = Object.freeze({
  SURVIVED: 4.0,
  PARTIAL: 2.0
});

// ── Reward / consequence config ───────────────────────────────────────────
const REWARD_CONFIG = Object.freeze({
  survivedBuffSynergy: 0.08,
  survivedBuffStability: 0.05,
  survivedBuffDurationBase: 10.0,
  survivedBuffDurationMasteryBonus: 5.0,
  masteryThresholdForBonus: 3,
  failedAftershockCorruption: 0.06,
  failedAftershockDuration: 8.0,
  triggerThresholdIncreasePerSurvival: 0.02,
  rewardQualityIncreasePerSurvival: 0.05
});

// ── Crisis labels for HUD ─────────────────────────────────────────────────
const CRISIS_LABELS = Object.freeze({
  resonance_surge: 'Resonance Surge',
  integrity_fracture: 'Integrity Fracture',
  anchor_collapse: 'Anchor Collapse',
  pressure_rupture: 'Pressure Rupture',
  harmony_void: 'Harmony Void'
});

export class CrisisPhaseDirector {
  constructor(options = {}) {
    this.semanticBus = options.semanticBus || null;
    this.networkTensionRuntime = options.networkTensionRuntime || null;
    this.visualNetworkTimeScore = options.visualNetworkTimeScore || null;
    this.gameplayHintLayer = options.gameplayHintLayer || null;
    this.getWorldId = typeof options.getWorldId === 'function'
      ? options.getWorldId
      : (() => 'default');

    this.enabled = true;
    this._regDisposers = [];

    // Active crisis state
    this._activeCrisis = null; // { crisisId, startTime, doctrineDuration, phase, phaseStartTime, responseScore, actionsLogged }
    this._phaseOrder = [PHASES.INTRO, PHASES.SURGE, PHASES.PEAK, PHASES.DECAY, PHASES.RESOLVED];

    // Mastery tracking: crisisId → { survivedCount, failedCount, bestResponseScore }
    this._mastery = new Map();

    // Temporary buff/aftershock state
    this._buffActiveUntil = 0;
    this._aftershockActiveUntil = 0;
    this._currentBuff = null;
    this._currentAftershock = null;

    // Crisis profile overrides applied to NetworkTensionRuntime
    this._activeOverrides = null;

    // Active run-shaper config from DoctrineRuntime
    this._activeShaperConfig = null;

    this._bindEvents();
  }

  // ========================================================================
  // EVENT BINDING
  // ========================================================================
  _bindEvents() {
    if (!this.semanticBus) return;

    const reg = (tag, handler) => {
      const disposer = eventRegistrationRegistry.register(
        'CrisisPhaseDirector', tag, handler, this.semanticBus
      );
      this._regDisposers.push(disposer);
    };

    // Doctrine crisis events
    reg('doctrine.crisis:start', (payload = {}) => {
      this._onCrisisStart(payload);
    });
    reg('doctrine.crisis:end', (payload = {}) => {
      this._onCrisisEnd(payload);
    });
    reg('doctrine.crisis:tick', (payload = {}) => {
      this._onCrisisTick(payload);
    });

    // Doctrine shaper events
    reg('doctrine.shaperActive', (payload = {}) => {
      this._onShaperActive(payload);
    });

    // Player agency events
    reg('network:corridorReinforced', (payload = {}) => {
      this._scorePlayerAction('reinforceCorridor', payload);
    });
    reg('network:hotspotRelieved', (payload = {}) => {
      this._scorePlayerAction('rerouteHotspot', payload);
    });
    reg('network:corridorAbandoned', (payload = {}) => {
      this._scorePlayerAction('abandonCorridor', payload);
    });
    reg('link.created', (payload = {}) => {
      this._scorePlayerAction('createLink', payload);
    });
    reg('network:tensionRecovered', (payload = {}) => {
      this._scorePlayerAction('tensionRecovered', payload);
    });
    reg('network:fractureResidueCreated', (payload = {}) => {
      this._scorePlayerAction('fractureResidueCreated', payload);
    });
  }

  // ========================================================================
  // CRISIS LIFECYCLE HANDLERS
  // ========================================================================
  _onCrisisStart(payload) {
    if (!this.enabled) return;
    const crisisId = payload?.crisisId || payload?.id || null;
    if (!crisisId) return;

    const worldId = this._resolveWorldId();
    const basePhaseConfig = WORLD_PHASE_CONFIG[worldId] || WORLD_PHASE_CONFIG.default;

    // Apply shaper crisis pattern scaling
    const phaseConfig = this._applyShaperToPhaseConfig(basePhaseConfig);

    const now = getNowMs();
    this._activeCrisis = {
      crisisId,
      startTime: now,
      doctrineDuration: (payload?.duration || 15) * 1000,
      phase: PHASES.INTRO,
      phaseStartTime: now,
      responseScore: 0,
      actionsLogged: new Set(),
      worldId,
      phaseConfig
    };

    // Apply world-specific overrides to NetworkTensionRuntime
    this._applyCrisisOverrides(phaseConfig);

    // Apply crisis gate impact to VisualNetworkTimeScore
    this._applyCrisisGateImpact(phaseConfig);

    this._emit('crisis:phaseChanged', {
      crisisId,
      previousPhase: null,
      phase: PHASES.INTRO,
      intensity: 0.1
    });

    // Show intro hint
    this._showPhaseHint('crisisIntro', crisisId, worldId);
  }

  _onCrisisEnd(payload) {
    if (!this._activeCrisis) return;
    // Force resolve if doctrine ends early
    this._transitionToPhase(PHASES.RESOLVED);
  }

  _onCrisisTick(payload) {
    // Sync remaining time from doctrine if needed
    if (!this._activeCrisis || !payload) return;
    const remaining = payload?.remaining ?? 0;
    if (remaining <= 0 && this._activeCrisis.phase !== PHASES.RESOLVED) {
      this._transitionToPhase(PHASES.RESOLVED);
    }
  }

  // ========================================================================
  // UPDATE LOOP
  // ========================================================================
  update(dt = 0.1) {
    if (!this.enabled || !this._activeCrisis) return;

    const crisis = this._activeCrisis;
    const now = getNowMs();
    const elapsedInPhase = (now - crisis.phaseStartTime) / 1000;
    const config = crisis.phaseConfig;

    // Determine if we should transition to next phase
    let nextPhase = null;
    switch (crisis.phase) {
      case PHASES.INTRO:
        if (elapsedInPhase >= config.introDuration) nextPhase = PHASES.SURGE;
        break;
      case PHASES.SURGE:
        if (elapsedInPhase >= config.surgeDuration) nextPhase = PHASES.PEAK;
        break;
      case PHASES.PEAK:
        if (elapsedInPhase >= config.peakDuration) nextPhase = PHASES.DECAY;
        break;
      case PHASES.DECAY:
        if (elapsedInPhase >= config.decayDuration) nextPhase = PHASES.RESOLVED;
        break;
      case PHASES.RESOLVED:
        // Already resolved, nothing to do
        return;
    }

    if (nextPhase) {
      this._transitionToPhase(nextPhase);
    }

    // Update intensity based on phase
    const intensity = this._computeIntensity(crisis.phase, elapsedInPhase, config);
    this._emit('crisis:intensity', {
      crisisId: crisis.crisisId,
      intensity: clamp01(intensity)
    });
  }

  _transitionToPhase(nextPhase) {
    const crisis = this._activeCrisis;
    if (!crisis) return;

    const previousPhase = crisis.phase;
    crisis.phase = nextPhase;
    crisis.phaseStartTime = getNowMs();

    this._emit('crisis:phaseChanged', {
      crisisId: crisis.crisisId,
      previousPhase,
      phase: nextPhase,
      intensity: this._computeIntensity(nextPhase, 0, crisis.phaseConfig)
    });

    // Phase-specific actions
    switch (nextPhase) {
      case PHASES.SURGE:
        this._showPhaseHint('crisisSurge', crisis.crisisId, crisis.worldId);
        break;
      case PHASES.PEAK:
        this._showPhaseHint('crisisPeak', crisis.crisisId, crisis.worldId);
        break;
      case PHASES.DECAY:
        // Evaluation window — no hints
        break;
      case PHASES.RESOLVED:
        this._resolveCrisisOutcome();
        break;
    }
  }

  _computeIntensity(phase, elapsedInPhase, config) {
    const curveScale = this._activeShaperConfig?.crisisPattern?.intensityCurveScale ?? 1.0;
    switch (phase) {
      case PHASES.INTRO:
        return 0.1 + (elapsedInPhase / config.introDuration) * 0.2 * curveScale;
      case PHASES.SURGE:
        return 0.3 + (elapsedInPhase / config.surgeDuration) * 0.4 * curveScale;
      case PHASES.PEAK:
        return 0.7 + (elapsedInPhase / config.peakDuration) * 0.25 * curveScale;
      case PHASES.DECAY:
        return Math.max(0, 0.95 - (elapsedInPhase / config.decayDuration) * 0.95 * curveScale);
      case PHASES.RESOLVED:
        return 0;
      default:
        return 0;
    }
  }

  _onShaperActive(payload) {
    const shaperConfig = payload?.shaperConfig || null;
    this._activeShaperConfig = shaperConfig;
  }

  _applyShaperToPhaseConfig(baseConfig) {
    if (!this._activeShaperConfig) return baseConfig;
    const pattern = this._activeShaperConfig.crisisPattern;
    if (!pattern) return baseConfig;

    return {
      ...baseConfig,
      introDuration: baseConfig.introDuration * (pattern.introDurationScale ?? 1.0),
      surgeDuration: baseConfig.surgeDuration * (pattern.surgeDurationScale ?? 1.0),
      peakDuration: baseConfig.peakDuration * (pattern.peakDurationScale ?? 1.0),
      decayDuration: baseConfig.decayDuration * (pattern.decayDurationScale ?? 1.0)
    };
  }

  // ========================================================================
  // PLAYER AGENCY TRACKING
  // ========================================================================
  _scorePlayerAction(actionType, payload = {}) {
    if (!this._activeCrisis) return;
    const crisis = this._activeCrisis;

    // Only score during SURGE and PEAK phases
    if (crisis.phase !== PHASES.SURGE && crisis.phase !== PHASES.PEAK) return;

    // Deduplicate: same action type on same entity within 2s
    const dedupeKey = `${actionType}:${payload?.linkId || payload?.nodeId || 'global'}`;
    const now = getNowMs();
    for (const key of crisis.actionsLogged) {
      if (key.startsWith(dedupeKey + ':')) {
        const tsIdx = key.lastIndexOf(':');
        const timestamp = tsIdx >= 0 ? Number(key.slice(tsIdx + 1)) : 0;
        if (now - timestamp < 2000) return;
      }
    }
    crisis.actionsLogged.add(`${dedupeKey}:${now}`);

    const scoreDelta = AGENCY_SCORES[actionType] || 0;
    if (scoreDelta !== 0) {
      crisis.responseScore += scoreDelta;
      this._emit('crisis:playerAction', {
        crisisId: crisis.crisisId,
        action: actionType,
        scoreDelta,
        responseScore: crisis.responseScore
      });
    }
  }

  // ========================================================================
  // OUTCOME RESOLUTION
  // ========================================================================
  _resolveCrisisOutcome() {
    const crisis = this._activeCrisis;
    if (!crisis) return;

    const score = crisis.responseScore;
    const mastery = this._getOrCreateMastery(crisis.crisisId);
    let outcome = 'failed';
    let unlockedMutation = null;

    if (score >= OUTCOME_THRESHOLDS.SURVIVED) {
      outcome = 'survived';
      mastery.survivedCount++;
      if (score > mastery.bestResponseScore) {
        mastery.bestResponseScore = score;
      }
      this._applySurvivedReward(crisis.crisisId, mastery);
    } else if (score >= OUTCOME_THRESHOLDS.PARTIAL) {
      outcome = 'partial';
      if (score > mastery.bestResponseScore) {
        mastery.bestResponseScore = score;
      }
    } else {
      mastery.failedCount++;
      unlockedMutation = this._determineUnlockedMutation(crisis.crisisId, crisis.worldId);
      this._applyFailedConsequence(crisis.crisisId, unlockedMutation);
    }

    // Show outcome hint
    const hintKey = outcome === 'survived' ? 'crisisSurvived' : 'crisisFailed';
    this._showPhaseHint(hintKey, crisis.crisisId, crisis.worldId, { outcome, responseScore: score });

    // Emit outcome event
    this._emit(`crisis:${outcome}`, {
      crisisId: crisis.crisisId,
      responseScore: score,
      masteryLevel: mastery.survivedCount,
      ...(outcome === 'survived'
        ? { buffDuration: this._currentBuff?.duration || 0 }
        : { aftershockDuration: this._currentAftershock?.duration || 0, unlockedMutation })
    });

    // Clear overrides
    this._clearCrisisOverrides();
    this._clearCrisisGateImpact();

    // Keep activeCrisis briefly for queries, then clear
    const resolvedCrisis = { ...crisis };
    this._activeCrisis = null;
    this._activeOverrides = null;

    // Cleanup old dedupe entries from mastery
    this._cleanupMasteryActions(resolvedCrisis);
  }

  _getOrCreateMastery(crisisId) {
    if (!this._mastery.has(crisisId)) {
      this._mastery.set(crisisId, {
        survivedCount: 0,
        failedCount: 0,
        bestResponseScore: 0
      });
    }
    return this._mastery.get(crisisId);
  }

  _cleanupMasteryActions(crisis) {
    // No-op for now; actionsLogged is per-crisis and gets GC'd with crisis
  }

  // ========================================================================
  // REWARDS & CONSEQUENCES
  // ========================================================================
  _applySurvivedReward(crisisId, mastery) {
    const buffDuration = REWARD_CONFIG.survivedBuffDurationBase
      + (mastery.survivedCount >= REWARD_CONFIG.masteryThresholdForBonus
        ? REWARD_CONFIG.survivedBuffDurationMasteryBonus
        : 0);

    const synergyBuff = REWARD_CONFIG.survivedBuffSynergy
      + (mastery.survivedCount - 1) * REWARD_CONFIG.rewardQualityIncreasePerSurvival;

    const now = getNowMs();
    this._buffActiveUntil = now + (buffDuration * 1000);
    this._currentBuff = {
      crisisId,
      synergy: Math.max(0, synergyBuff),
      stability: REWARD_CONFIG.survivedBuffStability,
      duration: buffDuration,
      masteryLevel: mastery.survivedCount
    };
  }

  _applyFailedConsequence(crisisId, unlockedMutation) {
    const now = getNowMs();
    this._aftershockActiveUntil = now + (REWARD_CONFIG.failedAftershockDuration * 1000);
    this._currentAftershock = {
      crisisId,
      corruption: REWARD_CONFIG.failedAftershockCorruption,
      duration: REWARD_CONFIG.failedAftershockDuration,
      unlockedMutation
    };
  }

  _determineUnlockedMutation(crisisId, worldId) {
    // Positive framing: failure unlocks a "world mutation" that teaches the player
    const mutationsByCrisis = {
      resonance_surge: 'quantum_entropy_wave',
      integrity_fracture: 'corruption_acceptance',
      anchor_collapse: 'desert_deep_anchor',
      pressure_rupture: 'pressure_embrace',
      harmony_void: 'harmony_resonance'
    };
    return mutationsByCrisis[crisisId] || null;
  }

  // ========================================================================
  // CRISIS OVERRIDES (NetworkTensionRuntime)
  // ========================================================================
  _applyCrisisOverrides(config) {
    if (!this.networkTensionRuntime) return;

    // Merge world config with shaper counterplay config
    const cp = this._activeShaperConfig?.counterplayPayoff || {};
    this._activeOverrides = {
      tickPressureScale: config.tickPressureScaleMultiplier * (cp.tickPressureScale ?? 1.0),
      rerouteReliefScale: config.rerouteReliefScaleMultiplier * (cp.rerouteReliefScale ?? 1.0),
      rerouteRecoveryImpulseScale: cp.rerouteRecoveryImpulseScale ?? 1.0,
      reinforceDuration: config.reinforceDurationMultiplier * (cp.reinforceDurationScale ?? 1.0),
      reinforceStabilityCost: config.reinforceStabilityCostMultiplier * (cp.reinforceStabilityCostScale ?? 1.0),
      reinforceRecoveryImpulseScale: cp.reinforceRecoveryImpulseScale ?? 1.0,
      abandonReliefScale: cp.abandonReliefScale ?? 1.0,
      abandonStabilityBonus: cp.abandonStabilityBonus ?? 0
    };
    // Store on the runtime for it to read during update()
    if (this.networkTensionRuntime) {
      this.networkTensionRuntime._crisisPhaseOverrides = this._activeOverrides;
    }
  }

  _clearCrisisOverrides() {
    if (this.networkTensionRuntime) {
      this.networkTensionRuntime._crisisPhaseOverrides = null;
    }
    this._activeOverrides = null;
  }

  // ========================================================================
  // CRISIS GATE IMPACT (VisualNetworkTimeScore)
  // ========================================================================
  _applyCrisisGateImpact(config) {
    if (!this.visualNetworkTimeScore) return;
    const worldOffset = config.rewindSynergyThresholdOffset;
    const shaperOffset = this._activeShaperConfig?.rewindBehavior?.thresholdOffset ?? 0;
    const offset = worldOffset + shaperOffset;
    if (offset !== 0 && typeof this.visualNetworkTimeScore.onCrisisPhaseChanged === 'function') {
      this.visualNetworkTimeScore.onCrisisPhaseChanged({ phase: PHASES.PEAK, thresholdOffset: offset });
    }
  }

  _clearCrisisGateImpact() {
    if (!this.visualNetworkTimeScore) return;
    if (typeof this.visualNetworkTimeScore.onCrisisPhaseChanged === 'function') {
      this.visualNetworkTimeScore.onCrisisPhaseChanged({ phase: PHASES.RESOLVED, thresholdOffset: 0 });
    }
  }

  // ========================================================================
  // HINTS
  // ========================================================================
  _showPhaseHint(hintKey, crisisId, worldId, extraContext = {}) {
    if (!this.gameplayHintLayer) return;
    const label = CRISIS_LABELS[crisisId] || 'Crisis';
    this.gameplayHintLayer.show(hintKey, {
      crisisLabel: label,
      world: worldId,
      ...extraContext
    }, {
      fingerprint: `crisis:${crisisId}:${hintKey}`,
      cooldownMs: 0
    });
  }

  // ========================================================================
  // PUBLIC API
  // ========================================================================
  getActiveCrisis() {
    if (!this._activeCrisis) return null;
    const crisis = this._activeCrisis;
    const now = getNowMs();
    const timeInPhase = (now - crisis.phaseStartTime) / 1000;
    const totalElapsed = (now - crisis.startTime) / 1000;
    const totalDuration = crisis.phaseConfig.introDuration
      + crisis.phaseConfig.surgeDuration
      + crisis.phaseConfig.peakDuration
      + crisis.phaseConfig.decayDuration;
    const timeRemaining = Math.max(0, totalDuration - totalElapsed);

    return {
      crisisId: crisis.crisisId,
      phase: crisis.phase,
      timeInPhase,
      timeRemaining,
      intensity: this._computeIntensity(crisis.phase, timeInPhase, crisis.phaseConfig),
      responseScore: crisis.responseScore,
      worldId: crisis.worldId
    };
  }

  getCrisisMastery(crisisId) {
    return this._mastery.get(crisisId) || {
      survivedCount: 0,
      failedCount: 0,
      bestResponseScore: 0
    };
  }

  getAllMastery() {
    const result = {};
    for (const [crisisId, mastery] of this._mastery) {
      result[crisisId] = { ...mastery };
    }
    return result;
  }

  getActiveBuff() {
    const now = getNowMs();
    if (now < this._buffActiveUntil) {
      return this._currentBuff;
    }
    return null;
  }

  getActiveAftershock() {
    const now = getNowMs();
    if (now < this._aftershockActiveUntil) {
      return this._currentAftershock;
    }
    return null;
  }

  getCrisisTriggerThreshold(crisisId) {
    // Returns modified trigger threshold based on mastery
    const mastery = this.getCrisisMastery(crisisId);
    const baseThreshold = this._getBaseThreshold(crisisId);
    if (!baseThreshold) return null;
    return baseThreshold + (mastery.survivedCount * REWARD_CONFIG.triggerThresholdIncreasePerSurvival);
  }

  _getBaseThreshold(crisisId) {
    const thresholds = {
      resonance_surge: 0.8,
      integrity_fracture: 0.5,
      anchor_collapse: 0.3,
      pressure_rupture: 0.75,
      harmony_void: 0.2
    };
    return thresholds[crisisId] ?? null;
  }

  // ========================================================================
  // DEBUG
  // ========================================================================
  getDebugSnapshot() {
    const active = this.getActiveCrisis();
    return {
      enabled: this.enabled,
      activeCrisis: active,
      mastery: this.getAllMastery(),
      activeBuff: this.getActiveBuff(),
      activeAftershock: this.getActiveAftershock(),
      activeOverrides: this._activeOverrides
    };
  }

  // ========================================================================
  // LIFECYCLE
  // ========================================================================
  _resolveWorldId() {
    return String(this.getWorldId?.() || 'default').trim().toLowerCase() || 'default';
  }

  _emit(tag, payload = {}) {
    if (!this.semanticBus || typeof this.semanticBus.emit !== 'function') return;
    try {
      this.semanticBus.emit(tag, payload, {
        priority: this.semanticBus.priority?.NORMAL ?? 2
      });
    } catch (_e) {
      // Silent
    }
  }

  setEnabled(enabled) {
    this.enabled = !!enabled;
  }

  reset() {
    this._activeCrisis = null;
    this._activeOverrides = null;
    this._activeShaperConfig = null;
    this._buffActiveUntil = 0;
    this._aftershockActiveUntil = 0;
    this._currentBuff = null;
    this._currentAftershock = null;
    this._mastery.clear();
  }

  dispose() {
    if (eventRegistrationRegistry && typeof eventRegistrationRegistry.disposeOwner === 'function') {
      eventRegistrationRegistry.disposeOwner('CrisisPhaseDirector');
    }
    this._regDisposers = [];
    this.reset();
  }
}

export default CrisisPhaseDirector;
