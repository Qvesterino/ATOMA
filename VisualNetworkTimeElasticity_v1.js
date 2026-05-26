/**
 * VISUAL NETWORK TIME ELASTICITY v2.0 — NETWORK TIME SCORE SYSTEM
 * ================================================================
 * Dual-purpose system: gameplay score authority + visual time elasticity
 *
 * 🎮 GAMEPLAY SCORE (primary):
 * - Network Time counts FORWARD at 5 units/sec (pressure)
 * - When canonical global.synergy.high is sustained for 5+ seconds → Network Time REWINDS at 3.5 units/sec
 * - If synergy drops → Network Time resumes FORWARD
 * - Win condition: Network Time reaches 0 → game won
 * - No game over — player can try forever
 *
 * 🎨 VISUAL TIME ELASTICITY (secondary, preserved from v1):
 * - When rewind is active, visual animations play in REVERSE
 * - Visual rewind speed is separate from score rewind speed
 * - Smooth fade-in/out over ~1s
 *
 * 📊 SCORE DIRECTION STATES:
 *   FORWARD  — default, Network Time increments (pressure)
 *   REWIND   — synergy.high sustained 5s, Network Time decrements (reward)
 *   WON      — Network Time reached 0 (victory)
 *
 * 🔒 CONTRACTS:
 * - Never modifies: deltaTime, any node.userData state
 * - Only affects: local _networkTimeCounter, _visualTime, _direction
 * - Reads: avgSynergy from metrics
 * - Writes: only to local state variables
 * - Emits: score:forward, score:rewinding, score:won events via semanticBus
 */

import { getDefaultMetricThresholds } from './src/metrics/MetricTierClassifier.js';

// ALPHA HARDENING: lowered from canonical .high (0.45) to 0.55
// because NodeMetricEngine synergy steady-state is 0.26-0.51,
// making the old threshold (0.82 via stale import path) unreachable.
const DEFAULT_REWIND_SYNERGY_THRESHOLD = 0.55;
const DEFAULT_REWIND_MIN_NODE_COUNT = 4;
const DEFAULT_REWIND_MIN_LINK_COUNT = 3;
const DEFAULT_REWIND_MIN_AVG_LINK_QUALITY = 0.55;
const DEFAULT_REWIND_TENSION_GRACE_DURATION = 1.6;
const REWIND_BLOCK_REASON = Object.freeze({
  SYNERGY_TOO_LOW: 'synergy-too-low',
  NEED_MORE_NODES: 'need-more-nodes',
  NEED_MORE_LINKS: 'need-more-links',
  QUALITY_TOO_LOW: 'quality-too-low',
  TENSION_CRITICAL: 'tension-critical',
  CHOKEPOINT_FRAGILE: 'chokepoint-fragile'
});

function clamp01(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(1, numeric));
}

// Direction states
export const SCORE_DIRECTION = Object.freeze({
  FORWARD: 'FORWARD',
  REWIND: 'REWIND',
  WON: 'WON'
});

export class VisualNetworkTimeElasticity_v1 {
  constructor(config = {}) {
    this.avgSynergy = 0.0;
    this.enabled = true;

    // ── Score configuration ─────────────────────────────────────────
    this._forwardSpeed = config.forwardSpeed ?? 5;        // base units/sec counting up
    this._rewindSpeed = config.rewindSpeed ?? 3.5;        // base units/sec counting down (slower = harder)
    this._synergyThreshold = config.synergyThreshold ?? DEFAULT_REWIND_SYNERGY_THRESHOLD;  // canonical global.synergy.high
    this._sustainDuration = config.sustainDuration ?? 5.0;     // seconds of sustained high synergy
    this._rewindMinNodeCount = config.rewindMinNodeCount ?? DEFAULT_REWIND_MIN_NODE_COUNT;
    this._rewindMinLinkCount = config.rewindMinLinkCount ?? DEFAULT_REWIND_MIN_LINK_COUNT;
    this._rewindMinAvgLinkQuality = config.rewindMinAvgLinkQuality ?? DEFAULT_REWIND_MIN_AVG_LINK_QUALITY;
    this._rewindTensionGraceDuration = config.rewindTensionGraceDuration ?? DEFAULT_REWIND_TENSION_GRACE_DURATION;

    // ── Phase 4: Dynamic speed scaling ──────────────────────────────
    this._synergyQualityScale = config.synergyQualityScale ?? 5.0;   // rewind bonus per unit synergy above threshold
    this._escalationDivisor = config.escalationDivisor ?? 300;       // forward speed doubles at this NT value
    this._lastEffectiveForwardSpeed = this._forwardSpeed;
    this._lastEffectiveRewindSpeed = this._rewindSpeed;

    // ── Phase 4C: Drama Zone ────────────────────────────────────────
    this._dramaZoneThreshold = config.dramaZoneThreshold ?? 20;      // NT below this = drama zone
    this._inDramaZone = false;

    // ── Phase 5A: Rewind Combo Stacking ─────────────────────────────
    this._comboCount = 0;            // consecutive rewind sessions
    this._comboMultiplier = 1.0;     // current combo speed multiplier
    this._lastRewindStartNT = 0;     // NT when last rewind started (for ground-lost detection)
    this._comboMultipliers = [       // indexed by combo count
      1.0,  // 0: no rewind yet
      1.0,  // 1: first rewind (no bonus)
      1.2,  // 2: second consecutive
      1.5,  // 3: third consecutive
      1.8,  // 4+: cap
    ];

    // ── Phase 5B: Milestone tracking ────────────────────────────────
    this._milestonesTriggered = new Set();   // '75', '50', '25' — one-shot per game
    this._peakNT = 0;                         // highest NT seen (used for rewind % calc)

    // ── Phase 6B: NT History for sparkline ──────────────────────────
    this._ntHistory = [];                     // { time, value } samples
    this._ntHistoryMaxSamples = 120;          // ~60 seconds at 2 samples/sec (simulation rate)
    this._ntHistorySampleAcc = 0;             // accumulator for sample interval
    this._ntHistorySampleInterval = 0.5;      // sample every 0.5 seconds

    // ── Score state ─────────────────────────────────────────────────
    this._networkTimeCounter = 0;    // the actual score counter
    this._direction = SCORE_DIRECTION.FORWARD;
    this._won = false;
    this._networkMetricsSnapshot = this._createNetworkMetricsSnapshot();
    this._rewindEligible = false;
    this._rewindBlockReason = REWIND_BLOCK_REASON.SYNERGY_TOO_LOW;
    this._rewindGraceBlockedAt = null;
    this._rewindGraceReason = null;

    // ── Counterplay verb grace periods ──────────────────────────────
    this._hotspotReliefGraceUntil = 0;
    this._abandonGraceUntil = 0;

    // ── Sustain tracking ────────────────────────────────────────────
    this._highSynergyStartTime = null;
    this._sustainedDuration = 0;     // how long synergy has been above threshold

    // ── Visual time tracking (preserved from v1) ────────────────────
    this._visualTime = 0.0;
    this._gameTime = 0.0;
    this._isRewinding = false;
    this._fadeAlpha = 0.0;           // 0 = normal, 1 = full rewind effect

    // ── Visual configuration (preserved from v1) ────────────────────
    this._fadeInDuration = config.fadeWithDuration ?? 1.0;
    this._fadeOutDuration = config.fadeOutDuration ?? 1.0;
    this._visualRewindSpeed = config.visualRewindSpeed ?? 0.4;

    // ── Event system ────────────────────────────────────────────────
    this._eventHandlers = {
      'score:forward': [],
      'score:rewinding': [],
      'score:won': [],
      'score:dramaZone': [],
      'score:milestone': []
    };

    // ── Persistent session stats ────────────────────────────────────
    this._persistentStats = {
      gamesWon: 0,
      gamesPlayed: 0,
    };

    // ── Per-run stats (reset every playthrough) ─────────────────────
    this._runStats = this._createRunStats();
    this.loadSessionStats();
  }

  _createRunStats() {
    return {
      bestNetworkTime: 0,
      totalRewindTime: 0,
      maxSynergyAchieved: 0,
      rewindActivations: 0,
      totalHighSynergyTime: 0,
      rewindSynergyIntegral: 0,
      lastGameTime: 0,
    };
  }

  // ================================================================
  // PUBLIC API — Score
  // ================================================================

  /**
   * Get current Network Time value (integer)
   * @returns {number}
   */
  getNetworkTime() {
    return Math.floor(this._networkTimeCounter);
  }

  /**
   * Get current Network Time as formatted string (5-digit padded)
   * @returns {string}
   */
  getNetworkTimeFormatted() {
    return Math.floor(this._networkTimeCounter).toString().padStart(5, '0');
  }

  /**
   * Get current score direction
   * @returns {string} SCORE_DIRECTION.FORWARD | REWIND | WON
   */
  getDirection() {
    return this._direction;
  }

  /**
   * Check if game is won
   * @returns {boolean}
   */
  isWon() {
    return this._won;
  }

  /**
   * Get how long synergy has been sustained above threshold
   * @returns {number} seconds
   */
  getSustainProgress() {
    return this._sustainedDuration;
  }

  /**
   * Get sustain progress as 0..1 ratio (toward activation)
   * @returns {number}
   */
  getSustainProgressRatio() {
    return Math.min(1.0, this._sustainedDuration / this._sustainDuration);
  }

  /**
   * Check if score is in the near-win Drama Zone
   * @returns {boolean}
   */
  isInDramaZone() {
    return this._inDramaZone;
  }

  /**
   * Get current score state info (for debugging/HUD)
   * @returns {Object}
   */
  getScoreState() {
    return {
      networkTime: this.getNetworkTime(),
      networkTimeFormatted: this.getNetworkTimeFormatted(),
      direction: this._direction,
      isWon: this._won,
      inDramaZone: this._inDramaZone,
      avgSynergy: this.avgSynergy,
      rewindEligible: this._rewindEligible,
      rewindBlockReason: this._rewindBlockReason,
      connectedNodeCount: this._networkMetricsSnapshot.nodeCount,
      activeLinkCount: this._networkMetricsSnapshot.linkCount,
      avgLinkQuality: this._networkMetricsSnapshot.avgLinkQuality,
      criticalHotspotActive: this._networkMetricsSnapshot.criticalHotspotActive,
      fragileChokepointActive: this._networkMetricsSnapshot.fragileChokepointActive,
      regionalTension: this._networkMetricsSnapshot.regionalTension,
      maxChokepointScore: this._networkMetricsSnapshot.maxChokepointScore,
      rewindGraceRemaining: this._rewindGraceBlockedAt !== null
        ? Math.max(0, this._rewindTensionGraceDuration - (this._gameTime - this._rewindGraceBlockedAt)).toFixed(2)
        : '0.00',
      sustainProgress: this._sustainedDuration.toFixed(2),
      sustainRatio: this.getSustainProgressRatio().toFixed(3),
      synergyThreshold: this._synergyThreshold,
      sustainRequired: this._sustainDuration,
      forwardSpeed: this._forwardSpeed,
      rewindSpeed: this._rewindSpeed,
      effectiveForwardSpeed: this._lastEffectiveForwardSpeed.toFixed(2),
      effectiveRewindSpeed: this._lastEffectiveRewindSpeed.toFixed(2),
      synergyQualityMultiplier: this._direction === SCORE_DIRECTION.REWIND
        ? (1 + (Math.max(0, this.avgSynergy - this._synergyThreshold) * this._synergyQualityScale)).toFixed(2)
        : '1.00',
      escalationFactor: (1 + (this._networkTimeCounter / this._escalationDivisor)).toFixed(2),
      combo: this._comboCount,
      comboMultiplier: this._comboMultiplier.toFixed(1),
      rewindActivations: this._runStats.rewindActivations,
      totalHighSynergyTime: this._runStats.totalHighSynergyTime.toFixed(1),
      averageRewindSynergy: this.getSessionStats().averageRewindSynergy,
      rewindUptimeRatio: this.getSessionStats().rewindUptimeRatio
    };
  }

  // ================================================================
  // PUBLIC API — Visual Time (preserved from v1)
  // ================================================================

  /**
   * Set network-level average synergy
   * @param {number} avg - Average synergy [0..1]
   */
  setAverageSynergy(avg) {
    this.setNetworkMetricsSnapshot({
      ...this._networkMetricsSnapshot,
      networkSynergy: avg
    });
  }

  /**
   * Set the raw gameplay snapshot consumed by the score loop.
   * @param {Object} snapshot
   */
  setNetworkMetricsSnapshot(snapshot = {}) {
    this._networkMetricsSnapshot = this._createNetworkMetricsSnapshot(snapshot);
    this.avgSynergy = this._networkMetricsSnapshot.networkSynergy;
    const gateState = this._evaluateRewindGate(this._networkMetricsSnapshot);
    this._rewindEligible = gateState.eligible;
    this._rewindBlockReason = gateState.blockReason;
  }

  /**
   * Get the visual time to use for animations (may be rewound)
   * @returns {number}
   */
  getVisualTime() {
    return this._visualTime;
  }

  /**
   * Get current fade alpha (0 = normal, 1 = full rewind)
   * @returns {number}
   */
  getFadeAlpha() {
    return this._fadeAlpha;
  }

  /**
   * Check if visual rewind effect is currently active
   * @returns {boolean}
   */
  isRewinding() {
    return this._isRewinding;
  }

  /**
   * Get full state info (for debugging)
   * @returns {Object}
   */
  getStateInfo() {
    return {
      ...this.getScoreState(),
      isRewinding: this._isRewinding,
      fadeAlpha: this._fadeAlpha.toFixed(3),
      visualTime: this._visualTime.toFixed(3),
      gameTime: this._gameTime.toFixed(3),
      timeOffset: (this._gameTime - this._visualTime).toFixed(3),
      highSynergyStartTime: this._highSynergyStartTime !== null ? this._highSynergyStartTime.toFixed(3) : 'null'
    };
  }

  // ================================================================
  // EVENT SYSTEM
  // ================================================================

  /**
   * Register event callback
   * @param {string} eventType - 'score:forward', 'score:rewinding', 'score:won'
   * @param {function} callback
   */
  on(eventType, callback) {
    if (typeof callback !== 'function') return;
    if (!this._eventHandlers[eventType]) {
      this._eventHandlers[eventType] = [];
    }
    this._eventHandlers[eventType].push(callback);
  }

  /**
   * Remove event callback
   * @param {string} eventType
   * @param {function} callback
   */
  off(eventType, callback) {
    const handlers = this._eventHandlers[eventType];
    if (!Array.isArray(handlers)) return;
    const idx = handlers.indexOf(callback);
    if (idx !== -1) handlers.splice(idx, 1);
  }

  /**
   * Emit event to registered handlers + semanticBus
   * @private
   */
  _emit(eventType, payload = {}) {
    // Local handlers
    const handlers = this._eventHandlers[eventType];
    if (Array.isArray(handlers)) {
      for (const handler of handlers) {
        try {
          handler(payload);
        } catch (err) {
          console.warn(`[NetworkTimeScore] event handler failed for ${eventType}:`, err);
        }
      }
    }

    // Semantic bus (if available)
    try {
      const bus = (typeof globalThis !== 'undefined') ? globalThis.semanticBus : null;
      if (bus && typeof bus.emit === 'function') {
        bus.emit(eventType, payload, { priority: bus.priority?.NORMAL });
      }
    } catch (_e) {
      // Silent — bus is optional
    }
  }

  // ================================================================
  // MAIN UPDATE LOOP
  // ================================================================

  _createNetworkMetricsSnapshot(snapshot = {}) {
    return {
      networkSynergy: clamp01(snapshot?.networkSynergy),
      nodeCount: Number.isFinite(snapshot?.nodeCount) ? Math.max(0, Math.floor(snapshot.nodeCount)) : 0,
      linkCount: Number.isFinite(snapshot?.linkCount) ? Math.max(0, Math.floor(snapshot.linkCount)) : 0,
      avgLinkQuality: clamp01(snapshot?.avgLinkQuality),
      criticalHotspotActive: snapshot?.criticalHotspotActive === true,
      criticalHotspotCount: Number.isFinite(snapshot?.criticalHotspotCount) ? Math.max(0, Math.floor(snapshot.criticalHotspotCount)) : 0,
      fragileChokepointActive: snapshot?.fragileChokepointActive === true,
      fragileChokepointCount: Number.isFinite(snapshot?.fragileChokepointCount) ? Math.max(0, Math.floor(snapshot.fragileChokepointCount)) : 0,
      regionalTension: clamp01(snapshot?.regionalTension),
      maxChokepointScore: clamp01(snapshot?.maxChokepointScore),
      tensionReleaseThreshold: clamp01(snapshot?.tensionReleaseThreshold || 0),
      chokepointReleaseThreshold: clamp01(snapshot?.chokepointReleaseThreshold || 0)
    };
  }

  _evaluateRewindGate(snapshot = this._networkMetricsSnapshot) {
    const now = (typeof performance !== 'undefined' && typeof performance.now === 'function')
      ? performance.now()
      : Date.now();

    if (snapshot.networkSynergy < this._synergyThreshold) {
      return { eligible: false, blockReason: REWIND_BLOCK_REASON.SYNERGY_TOO_LOW };
    }
    if (snapshot.nodeCount < this._rewindMinNodeCount) {
      return { eligible: false, blockReason: REWIND_BLOCK_REASON.NEED_MORE_NODES };
    }
    if (snapshot.linkCount < this._rewindMinLinkCount) {
      return { eligible: false, blockReason: REWIND_BLOCK_REASON.NEED_MORE_LINKS };
    }
    if (snapshot.avgLinkQuality < this._rewindMinAvgLinkQuality) {
      return { eligible: false, blockReason: REWIND_BLOCK_REASON.QUALITY_TOO_LOW };
    }
    if (
      snapshot.criticalHotspotActive === true ||
      (snapshot.tensionReleaseThreshold > 0 && snapshot.regionalTension > snapshot.tensionReleaseThreshold)
    ) {
      if (now < this._hotspotReliefGraceUntil) {
        // hotspot was just relieved by reroute — allow grace
      } else {
        return { eligible: false, blockReason: REWIND_BLOCK_REASON.TENSION_CRITICAL };
      }
    }
    if (
      snapshot.fragileChokepointActive === true ||
      (
        snapshot.chokepointReleaseThreshold > 0 &&
        snapshot.maxChokepointScore > snapshot.chokepointReleaseThreshold
      )
    ) {
      if (now < this._abandonGraceUntil) {
        // chokepoint was just cleared by abandon — allow grace
      } else {
        return { eligible: false, blockReason: REWIND_BLOCK_REASON.CHOKEPOINT_FRAGILE };
      }
    }
    return { eligible: true, blockReason: null };
  }

  _isTensionGraceReason(reason) {
    return reason === REWIND_BLOCK_REASON.TENSION_CRITICAL || reason === REWIND_BLOCK_REASON.CHOKEPOINT_FRAGILE;
  }

  /**
   * Update score and visual time elasticity state.
   * Called once per simulation tick (10Hz via FrameScheduler).
   *
   * @param {number} dt - Real delta time (seconds) - NEVER MODIFIED
   * @param {number} gameTime - Real game world time (seconds) - NEVER MODIFIED
   */
  update(dt, gameTime) {
    if (!this.enabled || this._won) {
      // When disabled or won, keep visualTime in sync
      if (!this._isRewinding) {
        this._visualTime = gameTime;
      }
      return;
    }

    // ============================================================
    // PHASE 1: Check synergy threshold + score-local rewind gate
    // ============================================================
    const synergyHigh = this.avgSynergy >= this._synergyThreshold;
    const gateState = this._evaluateRewindGate(this._networkMetricsSnapshot);
    this._rewindEligible = gateState.eligible;
    this._rewindBlockReason = gateState.blockReason;
    const tensionGraceReason = this._isTensionGraceReason(gateState.blockReason);
    const rewindWasActive = this._direction === SCORE_DIRECTION.REWIND;

    // Track max synergy achieved
    if (this.avgSynergy > this._runStats.maxSynergyAchieved) {
      this._runStats.maxSynergyAchieved = this.avgSynergy;
    }

    if (synergyHigh) {
      this._runStats.totalHighSynergyTime += dt;
    }

    if (gateState.eligible) {
      this._rewindGraceBlockedAt = null;
      this._rewindGraceReason = null;
      // Accumulate sustain timer only when the whole gameplay gate is satisfied.
      if (this._highSynergyStartTime === null) {
        this._highSynergyStartTime = gameTime;
        this._sustainedDuration = 0;
      }
      this._sustainedDuration = gameTime - this._highSynergyStartTime;
    } else if (rewindWasActive && synergyHigh && tensionGraceReason) {
      if (this._rewindGraceBlockedAt === null || this._rewindGraceReason !== gateState.blockReason) {
        this._rewindGraceBlockedAt = gameTime;
        this._rewindGraceReason = gateState.blockReason;
      }
      const graceElapsed = gameTime - this._rewindGraceBlockedAt;
      if (graceElapsed <= this._rewindTensionGraceDuration) {
        this._sustainedDuration = Math.max(this._sustainedDuration, this._sustainDuration);
      } else {
        this._highSynergyStartTime = null;
        this._sustainedDuration = 0;
      }
    } else {
      this._rewindGraceBlockedAt = null;
      this._rewindGraceReason = null;
      // Reset sustain timer whenever the local rewind gate is not fully satisfied.
      this._highSynergyStartTime = null;
      this._sustainedDuration = 0;
    }

    // ============================================================
    // PHASE 2: Determine score direction
    // ============================================================
    const shouldRewind = this._sustainedDuration >= this._sustainDuration;
    const previousDirection = this._direction;

    if (shouldRewind) {
      this._direction = SCORE_DIRECTION.REWIND;
    } else {
      this._direction = SCORE_DIRECTION.FORWARD;
    }

    // Emit direction change events + combo tracking
    if (previousDirection !== this._direction) {
      if (this._direction === SCORE_DIRECTION.REWIND) {
        // Phase 5A: Increment combo on each new rewind session
        this._comboCount++;
        this._runStats.rewindActivations++;
        this._lastRewindStartNT = this._networkTimeCounter;
        this._comboMultiplier = this._comboMultipliers[
          Math.min(this._comboCount, this._comboMultipliers.length - 1)
        ];
        this._emit('score:rewinding', {
          networkTime: this.getNetworkTime(),
          sustainedDuration: this._sustainedDuration,
          avgSynergy: this.avgSynergy,
          combo: this._comboCount,
          comboMultiplier: this._comboMultiplier
        });
      } else if (this._direction === SCORE_DIRECTION.FORWARD && previousDirection === SCORE_DIRECTION.REWIND) {
        this._emit('score:forward', {
          networkTime: this.getNetworkTime(),
          avgSynergy: this.avgSynergy,
          combo: this._comboCount
        });
      }
    }

    // ============================================================
    // PHASE 3: Update Network Time counter (with dynamic speeds)
    // ============================================================
    if (this._direction === SCORE_DIRECTION.FORWARD) {
      // Phase 5A: Combo reset — if NT exceeds where last rewind started, player lost ground
      if (this._comboCount > 0 && this._networkTimeCounter > this._lastRewindStartNT) {
        this._comboCount = 0;
        this._comboMultiplier = 1.0;
      }

      // Phase 4B: Pressure Escalation — forward speed grows with Network Time
      // At NT=0: base speed. At NT=escalationDivisor: 2x base speed.
      const escalationFactor = 1 + (this._networkTimeCounter / this._escalationDivisor);
      const effectiveForwardSpeed = this._forwardSpeed * escalationFactor;
      this._lastEffectiveForwardSpeed = effectiveForwardSpeed;
      this._networkTimeCounter += effectiveForwardSpeed * dt;

    } else if (this._direction === SCORE_DIRECTION.REWIND) {
      // Phase 4A: Synergy Quality Multiplier — rewind speed scales with synergy quality
      // At threshold (0.82): base speed. At 1.0 synergy: base × (1 + 0.18 × scale).
      const synergyAboveThreshold = Math.max(0, this.avgSynergy - this._synergyThreshold);
      const qualityMultiplier = 1 + (synergyAboveThreshold * this._synergyQualityScale);
      const effectiveRewindSpeed = this._rewindSpeed * qualityMultiplier * this._comboMultiplier;
      this._lastEffectiveRewindSpeed = effectiveRewindSpeed;
      this._networkTimeCounter -= effectiveRewindSpeed * dt;

      // Track total rewind time
      this._runStats.totalRewindTime += dt;
      this._runStats.rewindSynergyIntegral += this.avgSynergy * dt;

      // Check win condition
      if (this._networkTimeCounter <= 0) {
        this._networkTimeCounter = 0;
        this._direction = SCORE_DIRECTION.WON;
        this._won = true;

        // Track win stats
        this._persistentStats.gamesWon++;
        this._saveSessionStats();

        this._emit('score:won', {
          networkTime: 0,
          gameTime: gameTime,
          avgSynergy: this.avgSynergy,
          sessionStats: this.getSessionStats()
        });
      }
    }

    // Track best network time (highest pressure reached)
    const currentTime = this.getNetworkTime();
    if (currentTime > this._runStats.bestNetworkTime) {
      this._runStats.bestNetworkTime = currentTime;
    }

    // ============================================================
    // PHASE 3.4: Milestone detection (Phase 5B)
    // ============================================================
    // Update peak NT (highest pressure ever reached)
    if (this._networkTimeCounter > this._peakNT) {
      this._peakNT = this._networkTimeCounter;
    }

    // During rewind, check milestone progress
    if (this._direction === SCORE_DIRECTION.REWIND && this._peakNT > 0) {
      const rewindProgress = 1 - (this._networkTimeCounter / this._peakNT); // 0→1 as we rewind
      const milestones = [
        { id: '75', threshold: 0.25, label: '⭐ Three quarters!', stars: 1 },
        { id: '50', threshold: 0.50, label: '⭐⭐ Halfway there!', stars: 2 },
        { id: '25', threshold: 0.75, label: '⭐⭐⭐ Almost there!', stars: 3 },
      ];
      for (const ms of milestones) {
        if (rewindProgress >= ms.threshold && !this._milestonesTriggered.has(ms.id)) {
          this._milestonesTriggered.add(ms.id);
          this._emit('score:milestone', {
            milestoneId: ms.id,
            label: ms.label,
            stars: ms.stars,
            rewindPercent: (rewindProgress * 100).toFixed(0),
            networkTime: this.getNetworkTime(),
            peakNT: Math.floor(this._peakNT)
          });
        }
      }
    }

    // ============================================================
    // PHASE 3.5: Drama Zone detection (Phase 4C)
    // ============================================================
    const shouldDramaZone = this._direction === SCORE_DIRECTION.REWIND
      && this._networkTimeCounter > 0
      && this._networkTimeCounter <= this._dramaZoneThreshold;

    if (shouldDramaZone && !this._inDramaZone) {
      this._inDramaZone = true;
      this._emit('score:dramaZone', {
        active: true,
        networkTime: this.getNetworkTime(),
        threshold: this._dramaZoneThreshold
      });
    } else if (!shouldDramaZone && this._inDramaZone) {
      this._inDramaZone = false;
      this._emit('score:dramaZone', {
        active: false,
        networkTime: this.getNetworkTime()
      });
    }

    // Expose drama zone state for other systems (corruption reduction)
    if (typeof window !== 'undefined') {
      window.__ATOMA_DRAMA_ZONE__ = this._inDramaZone;
      // Phase 5C: Deep rewind flag — REWIND + synergy > 0.90 = network healing
      window.__ATOMA_DEEP_REWIND__ = this._direction === SCORE_DIRECTION.REWIND && this.avgSynergy > 0.90;
    }

    // ============================================================
    // PHASE 4: Visual time elasticity (preserved from v1)
    // ============================================================
    this._isRewinding = this._direction === SCORE_DIRECTION.REWIND;

    if (this._isRewinding) {
      // Fade IN the visual effect
      this._fadeAlpha = Math.min(1.0, this._fadeAlpha + (dt / this._fadeInDuration));
    } else {
      // Fade OUT the visual effect
      this._fadeAlpha = Math.max(0.0, this._fadeAlpha - (dt / this._fadeOutDuration));
    }

    if (this._fadeAlpha > 0.001) {
      // Rewind visual time
      this._visualTime -= dt * this._visualRewindSpeed * this._fadeAlpha;
      const minVisualTime = Math.max(gameTime - 60.0, 0.0);
      this._visualTime = Math.max(minVisualTime, this._visualTime);
    } else {
      this._visualTime = gameTime;
    }

    this._gameTime = gameTime;
    this._runStats.lastGameTime = gameTime;

    // ── Phase 6B: Record NT history for sparkline ──────────────────
    this._ntHistorySampleAcc += dt;
    if (this._ntHistorySampleAcc >= this._ntHistorySampleInterval) {
      this._ntHistorySampleAcc = 0;
      this._ntHistory.push({ time: gameTime, value: this._networkTimeCounter });
      if (this._ntHistory.length > this._ntHistoryMaxSamples) {
        this._ntHistory.shift();
      }
    }
  }

  /**
   * Get NT history for sparkline rendering.
   * @returns {Array<{time: number, value: number}>}
   */
  getNetworkTimeHistory() {
    return this._ntHistory;
  }

  // ================================================================
  // WORLD CONFIG
  // ================================================================

  /**
   * Apply score config.
   * @param {Object} config - { sustainDuration, rewindSpeed, forwardSpeed?, synergyThreshold?, rewindMinNodeCount?, rewindMinLinkCount?, rewindMinAvgLinkQuality? }
   */
  applyWorldConfig(config = {}) {
    if (config.sustainDuration != null) this._sustainDuration = config.sustainDuration;
    if (config.rewindSpeed != null) this._rewindSpeed = config.rewindSpeed;
    if (config.forwardSpeed != null) this._forwardSpeed = config.forwardSpeed;
    if (config.synergyThreshold != null) this._synergyThreshold = config.synergyThreshold;
    if (config.rewindMinNodeCount != null) this._rewindMinNodeCount = config.rewindMinNodeCount;
    if (config.rewindMinLinkCount != null) this._rewindMinLinkCount = config.rewindMinLinkCount;
    if (config.rewindMinAvgLinkQuality != null) this._rewindMinAvgLinkQuality = config.rewindMinAvgLinkQuality;

    // Reset run state for new world without incrementing games played.
    this.reset({ countGamePlayed: false });

    console.log(`[NetworkTimeScore] World config applied:`, {
      sustainDuration: this._sustainDuration,
      rewindSpeed: this._rewindSpeed,
      forwardSpeed: this._forwardSpeed,
      synergyThreshold: this._synergyThreshold,
      rewindMinNodeCount: this._rewindMinNodeCount,
      rewindMinLinkCount: this._rewindMinLinkCount,
      rewindMinAvgLinkQuality: this._rewindMinAvgLinkQuality
    });
  }

  // ================================================================
  // SESSION STATS
  // ================================================================

  /**
   * Get session statistics (for display and persistence).
   */
  getSessionStats() {
    const averageRewindSynergy = this._runStats.totalRewindTime > 0
      ? this._runStats.rewindSynergyIntegral / this._runStats.totalRewindTime
      : 0;
    const rewindUptimeRatio = this._runStats.lastGameTime > 0
      ? Math.min(1, this._runStats.totalRewindTime / this._runStats.lastGameTime)
      : 0;
    return {
      bestNetworkTime: this._runStats.bestNetworkTime,
      totalRewindTime: this._runStats.totalRewindTime.toFixed(1),
      maxSynergyAchieved: this._runStats.maxSynergyAchieved.toFixed(3),
      rewindActivations: this._runStats.rewindActivations,
      totalHighSynergyTime: this._runStats.totalHighSynergyTime.toFixed(1),
      averageRewindSynergy: averageRewindSynergy.toFixed(3),
      rewindUptimeRatio: rewindUptimeRatio.toFixed(3),
      gamesWon: this._persistentStats.gamesWon,
      gamesPlayed: this._persistentStats.gamesPlayed,
    };
  }

  /**
   * Load session stats from localStorage.
   */
  loadSessionStats() {
    try {
      if (typeof localStorage === 'undefined') return;
      const stored = localStorage.getItem('atoma.score.sessionStats');
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (parsed.gamesWon != null) this._persistentStats.gamesWon = parsed.gamesWon;
      if (parsed.gamesPlayed != null) this._persistentStats.gamesPlayed = parsed.gamesPlayed;
    } catch (_e) {
      // Silent — localStorage not available
    }
  }

  /**
   * Persist session stats to localStorage.
   */
  _saveSessionStats() {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem('atoma.score.sessionStats', JSON.stringify(this._persistentStats));
    } catch (_e) {
      // Silent
    }
  }

  // ================================================================
  // LIFECYCLE
  // ================================================================

  /**
   * Enable/disable the entire system
   */
  setEnabled(enabled) {
    this.enabled = !!enabled;
    if (!enabled) {
      this._isRewinding = false;
      this._fadeAlpha = 0.0;
      this._highSynergyStartTime = null;
      this._sustainedDuration = 0;
    }
  }

  /**
   * Reset for new game (preserves session stats).
   */
  reset(options = {}) {
    const countGamePlayed = options.countGamePlayed ?? true;
    if (countGamePlayed) {
      this._persistentStats.gamesPlayed++;
      this._saveSessionStats();
    }

    this._networkTimeCounter = 0;
    this._direction = SCORE_DIRECTION.FORWARD;
    this._won = false;
    this._highSynergyStartTime = null;
    this._sustainedDuration = 0;
    this._visualTime = 0.0;
    this._gameTime = 0.0;
    this._isRewinding = false;
    this._fadeAlpha = 0.0;
    this.avgSynergy = 0.0;
    this._inDramaZone = false;
    this._comboCount = 0;
    this._comboMultiplier = 1.0;
    this._lastRewindStartNT = 0;
    this._milestonesTriggered.clear();
    this._peakNT = 0;
    this._runStats = this._createRunStats();
    this._networkMetricsSnapshot = this._createNetworkMetricsSnapshot();
    this._rewindEligible = false;
    this._rewindBlockReason = REWIND_BLOCK_REASON.SYNERGY_TOO_LOW;
    this._rewindGraceBlockedAt = null;
    this._rewindGraceReason = null;
    this._hotspotReliefGraceUntil = 0;
    this._abandonGraceUntil = 0;
    if (typeof window !== 'undefined') window.__ATOMA_DRAMA_ZONE__ = false;
  }

  /**
   * Dispose and clean up
   */
  /**
   * Called when a hotspot is relieved by reroute.
   * Grants a short grace period where TENSION_CRITICAL does not block rewind.
   */
  onHotspotRelieved() {
    const now = (typeof performance !== 'undefined' && typeof performance.now === 'function')
      ? performance.now()
      : Date.now();
    this._hotspotReliefGraceUntil = now + 1000;
  }

  /**
   * Called when a corridor is abandoned.
   * Grants a grace period where CHOKEPOINT_FRAGILE does not block rewind.
   */
  onCorridorAbandoned() {
    const now = (typeof performance !== 'undefined' && typeof performance.now === 'function')
      ? performance.now()
      : Date.now();
    this._abandonGraceUntil = now + 2000;
  }

  dispose() {
    this._eventHandlers = { 'score:forward': [], 'score:rewinding': [], 'score:won': [], 'score:dramaZone': [], 'score:milestone': [] };
    this.reset({ countGamePlayed: false });
  }
}

// Quick validation function
export function validateVisualNetworkTimeElasticity() {
  console.log('✓ VisualNetworkTimeElasticity_v2.1 (Network Time Score + Dynamic Speeds) loaded');
  console.log(`  - Trigger: canonical global.synergy.high (>= ${DEFAULT_REWIND_SYNERGY_THRESHOLD}) for 5+ seconds`);
  console.log(`  - Rewind gate: >= ${DEFAULT_REWIND_MIN_NODE_COUNT} nodes, >= ${DEFAULT_REWIND_MIN_LINK_COUNT} links, avg quality >= ${DEFAULT_REWIND_MIN_AVG_LINK_QUALITY}`);
  console.log('  - Forward: 5 base units/sec (escalates with Network Time)');
  console.log('  - Rewind: 3.5 base units/sec (scales with synergy quality above threshold)');
  console.log('  - Win: Network Time reaches 0');
  console.log('  - Phase 4A: Synergy Quality Multiplier — higher synergy = faster rewind');
  console.log('  - Phase 4B: Pressure Escalation — higher NT = faster forward pressure');
  console.log('  - Visual: time rewind at 40% speed (preserved from v1)');
  console.log('  - Events: score:forward, score:rewinding, score:won');
}
