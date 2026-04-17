/**
 * VISUAL NETWORK TIME ELASTICITY v2.0 — NETWORK TIME SCORE SYSTEM
 * ================================================================
 * Dual-purpose system: gameplay score authority + visual time elasticity
 *
 * 🎮 GAMEPLAY SCORE (primary):
 * - Network Time counts FORWARD at 5 units/sec (pressure)
 * - When avgSynergy >= 0.82 sustained for 7+ seconds → Network Time REWINDS at 3 units/sec
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
 *   REWIND   — synergy.high sustained 7s, Network Time decrements (reward)
 *   WON      — Network Time reached 0 (victory)
 *
 * 🔒 CONTRACTS:
 * - Never modifies: deltaTime, any node.userData state
 * - Only affects: local _networkTimeCounter, _visualTime, _direction
 * - Reads: avgSynergy from metrics
 * - Writes: only to local state variables
 * - Emits: score:forward, score:rewinding, score:won events via semanticBus
 */

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
    this._forwardSpeed = config.forwardSpeed ?? 5;        // units/sec counting up
    this._rewindSpeed = config.rewindSpeed ?? 3;          // units/sec counting down (slower = harder)
    this._synergyThreshold = config.synergyThreshold ?? 0.82;  // aligned with MetricsRuntime global.synergy.high
    this._sustainDuration = config.sustainDuration ?? 7.0;     // seconds of sustained high synergy

    // ── Score state ─────────────────────────────────────────────────
    this._networkTimeCounter = 0;    // the actual score counter
    this._direction = SCORE_DIRECTION.FORWARD;
    this._won = false;

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
      'score:won': []
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
   * Get current score state info (for debugging/HUD)
   * @returns {Object}
   */
  getScoreState() {
    return {
      networkTime: this.getNetworkTime(),
      networkTimeFormatted: this.getNetworkTimeFormatted(),
      direction: this._direction,
      isWon: this._won,
      avgSynergy: this.avgSynergy,
      sustainProgress: this._sustainedDuration.toFixed(2),
      sustainRatio: this.getSustainProgressRatio().toFixed(3),
      synergyThreshold: this._synergyThreshold,
      sustainRequired: this._sustainDuration,
      forwardSpeed: this._forwardSpeed,
      rewindSpeed: this._rewindSpeed
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
    this.avgSynergy = Math.max(0.0, Math.min(1.0, avg || 0.0));
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
    // PHASE 1: Check synergy threshold
    // ============================================================
    const synergyHigh = this.avgSynergy >= this._synergyThreshold;

    if (synergyHigh) {
      // Accumulate sustain timer
      if (this._highSynergyStartTime === null) {
        this._highSynergyStartTime = gameTime;
        this._sustainedDuration = 0;
      }
      this._sustainedDuration = gameTime - this._highSynergyStartTime;
    } else {
      // Reset sustain timer
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

    // Emit direction change events
    if (previousDirection !== this._direction) {
      if (this._direction === SCORE_DIRECTION.REWIND) {
        this._emit('score:rewinding', {
          networkTime: this.getNetworkTime(),
          sustainedDuration: this._sustainedDuration,
          avgSynergy: this.avgSynergy
        });
      } else if (this._direction === SCORE_DIRECTION.FORWARD && previousDirection === SCORE_DIRECTION.REWIND) {
        this._emit('score:forward', {
          networkTime: this.getNetworkTime(),
          avgSynergy: this.avgSynergy
        });
      }
    }

    // ============================================================
    // PHASE 3: Update Network Time counter
    // ============================================================
    if (this._direction === SCORE_DIRECTION.FORWARD) {
      this._networkTimeCounter += this._forwardSpeed * dt;
    } else if (this._direction === SCORE_DIRECTION.REWIND) {
      this._networkTimeCounter -= this._rewindSpeed * dt;

      // Check win condition
      if (this._networkTimeCounter <= 0) {
        this._networkTimeCounter = 0;
        this._direction = SCORE_DIRECTION.WON;
        this._won = true;
        this._emit('score:won', {
          networkTime: 0,
          gameTime: gameTime,
          avgSynergy: this.avgSynergy
        });
      }
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
   * Reset for new game
   */
  reset() {
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
  }

  /**
   * Dispose and clean up
   */
  dispose() {
    this._eventHandlers = { 'score:forward': [], 'score:rewinding': [], 'score:won': [] };
    this.reset();
  }
}

// Quick validation function
export function validateVisualNetworkTimeElasticity() {
  console.log('✓ VisualNetworkTimeElasticity_v2.0 (Network Time Score) loaded');
  console.log('  - Trigger: avgSynergy >= 0.82 for 7+ seconds');
  console.log('  - Forward: 5 units/sec (pressure)');
  console.log('  - Rewind: 3 units/sec (reward, slower = harder)');
  console.log('  - Win: Network Time reaches 0');
  console.log('  - Visual: time rewind at 40% speed (preserved from v1)');
  console.log('  - Events: score:forward, score:rewinding, score:won');
}
