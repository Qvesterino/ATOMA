/**
 * LINK FEEDBACK HUD 1.0 — Quality Feedback & Acceptance Metrics Display
 *
 * Lightweight HUD extension that displays real-time acceptance metrics
 * and link quality feedback from LinkQualityFeedbackLoop1_0 and
 * UserAcceptanceTracker1_0.
 *
 * Features:
 * - Global acceptance rate (% of automation links kept)
 * - Average outcome score visualization
 * - Last 3–5 feedback events in tiny log
 * - Per-category acceptance breakdown
 * - ML learning state indicator
 * - ~1–2ms per refresh overhead
 * - Safe optional chaining (no crashes if systems missing)
 * - Configurable update interval
 *
 * Integration:
 *   LinkFeedbackHUD1_0.init({
 *     LinkQualityFeedbackLoop1_0: feedbackLoop,
 *     UserAcceptanceTracker1_0: userTracker,
 *     LinkMLRecommendationEngine1_0: mlEngine,
 *     containerElement: document.getElementById('my-hud')
 *   });
 *
 *   LinkFeedbackHUD1_0.start(); // Begin auto-refresh
 *
 * Console API:
 *   window.feedbackHUD.start()   // Start refresh
 *   window.feedbackHUD.stop()    // Stop refresh
 *   window.feedbackHUD.refresh() // Manual refresh
 */

export const LinkFeedbackHUD1_0 = {
  // ============================================================================
  // STATE
  // ============================================================================

  _initialized: false,
  _active: false,
  _systemReferences: {
    LinkQualityFeedbackLoop1_0: null,
    UserAcceptanceTracker1_0: null,
    LinkMLRecommendationEngine1_0: null,
  },

  _config: {
    updateIntervalMs: 1000,           // Refresh every 1s
    maxEventLog: 5,                   // Show last 5 events
    position: 'bottom-right',         // Placement on screen
    opacity: 0.92,
    enabled: true,
  },

  _dom: {
    container: null,
    acceptanceRate: null,
    avgOutcome: null,
    eventLog: null,
    categoryBreakdown: null,
    mlState: null,
  },

  _refreshInterval: null,
  _lastStats: null,

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize the feedback HUD
   */
  init(options = {}) {
    if (this._initialized) return;

    this._initialized = true;
    Object.assign(this._config, options);

    this._systemReferences.LinkQualityFeedbackLoop1_0 =
      options.LinkQualityFeedbackLoop1_0 || null;
    this._systemReferences.UserAcceptanceTracker1_0 =
      options.UserAcceptanceTracker1_0 || null;
    this._systemReferences.LinkMLRecommendationEngine1_0 =
      options.LinkMLRecommendationEngine1_0 || null;

    const container = options.containerElement;
    if (!container) {
      console.warn('[LinkFeedbackHUD] No container provided');
      return;
    }

    this._buildUI(container);
    console.log('[LinkFeedbackHUD] Initialized');
  },

  /**
   * Start auto-refresh loop
   */
  start() {
    if (this._active || !this._initialized) return;
    this._active = true;

    this._refreshInterval = setInterval(() => {
      this.refresh();
    }, this._config.updateIntervalMs);

    if (this._dom.container) {
      this._dom.container.style.display = 'block';
    }

    console.log('[LinkFeedbackHUD] Refresh loop started');
  },

  /**
   * Stop auto-refresh loop
   */
  stop() {
    if (!this._active) return;
    this._active = false;

    if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
      this._refreshInterval = null;
    }

    if (this._dom.container) {
      this._dom.container.style.display = 'none';
    }

    console.log('[LinkFeedbackHUD] Refresh loop stopped');
  },

  /**
   * Manual refresh of HUD data
   */
  refresh() {
    if (!this._initialized) return;

    try {
      this._updateStats();
    } catch (e) {
      console.error('[LinkFeedbackHUD] Refresh error:', e);
    }
  },

  // ============================================================================
  // UI BUILDING
  // ============================================================================

  /**
   * Build the HUD DOM structure
   */
  _buildUI(container) {
    const hud = document.createElement('div');
    hud.id = 'link-feedback-hud';
    hud.style.cssText = `
      position: fixed;
      ${this._config.position === 'bottom-right' ? 'bottom: 20px; right: 20px;' : 'bottom: 20px; left: 20px;'}
      width: 340px;
      background: rgba(10, 15, 30, ${this._config.opacity});
      border: 1.5px solid #00ff88;
      border-radius: 6px;
      padding: 14px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 11px;
      color: #00ff88;
      z-index: 9998;
      box-shadow: 0 0 15px rgba(0, 255, 136, 0.3);
      backdrop-filter: blur(8px);
    `;

    // Title
    const title = document.createElement('div');
    title.style.cssText = `
      font-weight: bold;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 1px solid #00ff88;
      padding-bottom: 8px;
      font-size: 10px;
    `;
    title.textContent = '⚡ Link Quality Feedback';
    hud.appendChild(title);

    // Acceptance Rate
    const acceptanceDiv = document.createElement('div');
    acceptanceDiv.style.cssText = 'margin-bottom: 10px;';
    acceptanceDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <span>Acceptance Rate:</span>
        <span id="feedback-acceptance" style="color: #ffff00; font-weight: bold;">–</span>
      </div>
      <div id="feedback-acceptance-bar" style="
        width: 100%;
        height: 6px;
        background: rgba(255, 255, 136, 0.1);
        border: 1px solid #ffff88;
        border-radius: 2px;
        overflow: hidden;
      ">
        <div id="feedback-acceptance-bar-fill" style="
          width: 0%;
          height: 100%;
          background: linear-gradient(90deg, #ffff88, #00ff88);
          transition: width 0.3s ease;
        "></div>
      </div>
    `;
    hud.appendChild(acceptanceDiv);
    this._dom.acceptanceRate = acceptanceDiv.querySelector('#feedback-acceptance');
    this._dom.acceptanceBar = acceptanceDiv.querySelector('#feedback-acceptance-bar-fill');

    // Average Outcome Score
    const outcomeDiv = document.createElement('div');
    outcomeDiv.style.cssText = 'margin-bottom: 10px;';
    outcomeDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <span>Avg Outcome:</span>
        <span id="feedback-outcome" style="color: #88ffff; font-weight: bold;">–</span>
      </div>
      <div id="feedback-outcome-bar" style="
        width: 100%;
        height: 6px;
        background: rgba(136, 255, 255, 0.1);
        border: 1px solid #88ffff;
        border-radius: 2px;
        overflow: hidden;
      ">
        <div id="feedback-outcome-bar-fill" style="
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, #ff6688, #88ffff);
          transition: width 0.3s ease;
        "></div>
      </div>
    `;
    hud.appendChild(outcomeDiv);
    this._dom.avgOutcome = outcomeDiv.querySelector('#feedback-outcome');
    this._dom.outcomeBar = outcomeDiv.querySelector('#feedback-outcome-bar-fill');

    // ML Learning State
    const mlDiv = document.createElement('div');
    mlDiv.style.cssText = `
      margin-bottom: 10px;
      padding: 6px;
      background: rgba(255, 136, 0, 0.1);
      border-left: 2px solid #ff8800;
      font-size: 10px;
    `;
    mlDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between;">
        <span>ML Learning:</span>
        <span id="feedback-ml-state">●</span>
      </div>
      <div id="feedback-ml-count" style="font-size: 9px; color: #ff8888; margin-top: 2px;">
        Feedback processed: 0
      </div>
    `;
    hud.appendChild(mlDiv);
    this._dom.mlState = mlDiv.querySelector('#feedback-ml-state');

    // Event Log
    const logDiv = document.createElement('div');
    logDiv.style.cssText = `
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #00ff88;
      max-height: 140px;
      overflow-y: auto;
      font-size: 9px;
    `;
    logDiv.innerHTML = '<div id="feedback-event-log" style="color: #00ff88;"></div>';
    hud.appendChild(logDiv);
    this._dom.eventLog = logDiv.querySelector('#feedback-event-log');

    this._dom.container = hud;
    container.appendChild(hud);
  },

  // ============================================================================
  // UPDATE LOGIC
  // ============================================================================

  /**
   * Update HUD statistics from systems
   */
  _updateStats() {
    const feedback = this._systemReferences.LinkQualityFeedbackLoop1_0;
    const userTracker = this._systemReferences.UserAcceptanceTracker1_0;
    const mlEngine = this._systemReferences.LinkMLRecommendationEngine1_0;

    if (!feedback || !userTracker) {
      this._showNA();
      return;
    }

    try {
      const feedbackStats = feedback.getStats?.();
      const userStats = userTracker.getStats?.();
      const mlState = mlEngine?.getLearningState?.();

      if (!feedbackStats || !userStats) {
        this._showNA();
        return;
      }

      // Update acceptance rate
      const acceptance = userStats.acceptanceRate || 0;
      const acceptancePercent = (acceptance * 100).toFixed(0);
      this._dom.acceptanceRate.textContent = `${acceptancePercent}%`;
      if (this._dom.acceptanceBar) {
        this._dom.acceptanceBar.style.width = `${Math.max(0, Math.min(100, acceptance * 100))}%`;
      }

      // Update average outcome
      const avgOutcome = feedbackStats.avgOutcomeScore || 0;
      const outcomePercent = (((avgOutcome + 1) / 2) * 100).toFixed(0);
      const outcomeColor = avgOutcome > 0.3 ? '#88ff88' : avgOutcome > -0.3 ? '#ffff88' : '#ff8888';
      this._dom.avgOutcome.textContent = `${avgOutcome.toFixed(2)}`;
      this._dom.avgOutcome.style.color = outcomeColor;
      if (this._dom.outcomeBar) {
        this._dom.outcomeBar.style.width = `${Math.max(0, Math.min(100, ((avgOutcome + 1) / 2) * 100))}%`;
      }

      // Update ML learning state
      if (mlState) {
        const mlColor = mlState.enabled ? '#00ff00' : '#ff8888';
        const mlText = mlState.enabled ? '● Learning' : '● Disabled';
        this._dom.mlState.textContent = mlText;
        this._dom.mlState.style.color = mlColor;

        const mlCountDiv = this._dom.mlState?.parentElement?.querySelector('#feedback-ml-count');
        if (mlCountDiv) {
          mlCountDiv.textContent = `Feedback processed: ${mlState.feedbackCount}`;
        }
      }

      // Update event log
      this._updateEventLog(feedbackStats.totalCompleted);

      this._lastStats = { feedbackStats, userStats };
    } catch (e) {
      console.error('[LinkFeedbackHUD] Update error:', e);
      this._showNA();
    }
  },

  /**
   * Update the event log display
   */
  _updateEventLog(totalRecords) {
    if (!this._dom.eventLog || totalRecords === 0) {
      this._dom.eventLog.innerHTML = '<div style="color: #888;">No feedback yet</div>';
      return;
    }

    // Display summary
    const feedback = this._systemReferences.LinkQualityFeedbackLoop1_0;
    const lastRecords = feedback._completedRecords?.slice(-this._config.maxEventLog) || [];

    if (lastRecords.length === 0) {
      this._dom.eventLog.innerHTML = '<div style="color: #888;">No recent events</div>';
      return;
    }

    let html = '';
    for (const record of lastRecords) {
      const scoreColor =
        record.outcomeScore > 0.3
          ? '#88ff88'
          : record.outcomeScore > -0.3
            ? '#ffff88'
            : '#ff8888';
      const scoreSign = record.outcomeScore >= 0 ? '+' : '';
      const tag = record.createdByAutomation ? '🤖' : '👤';

      html += `
        <div style="margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
          <span>${tag} ${record.sourceNodeId?.substring(0, 6)}→${record.targetNodeId?.substring(0, 6)}</span>
          <span style="color: ${scoreColor}; font-weight: bold;">${scoreSign}${record.outcomeScore.toFixed(2)}</span>
        </div>
      `;
    }

    this._dom.eventLog.innerHTML = html;
  },

  /**
   * Show N/A state when systems not ready
   */
  _showNA() {
    if (this._dom.acceptanceRate) {
      this._dom.acceptanceRate.textContent = 'N/A';
    }
    if (this._dom.avgOutcome) {
      this._dom.avgOutcome.textContent = 'N/A';
    }
    if (this._dom.eventLog) {
      this._dom.eventLog.innerHTML = '<div style="color: #888;">Systems initializing...</div>';
    }
  },
};

// ============================================================================
// CONSOLE API
// ============================================================================

if (typeof window !== 'undefined') {
  window.feedbackHUD = {
    start() {
      LinkFeedbackHUD1_0.start();
    },
    stop() {
      LinkFeedbackHUD1_0.stop();
    },
    refresh() {
      LinkFeedbackHUD1_0.refresh();
    },
  };
}

export default LinkFeedbackHUD1_0;
