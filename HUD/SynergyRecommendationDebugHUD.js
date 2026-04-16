/**
 * AI AUTOMATION HUD 1.0 (formerly "Synergy Recommendation Debug HUD")
 * 
 * Interactive debug panel for real-time monitoring of:
 * - LinkRecommendationAI1_0 suggestions (top 5 recommendations)
 * - LinkAutomationEngine1_0 automation status
 * - Synergy scores, correlations, expected gains
 * - Live statistics and performance metrics
 * 
 * UPDATES (Session 28):
 * - Renamed to "AI Automation HUD" for clarity
 * - Repositioned to bottom-left with 20px spacing (consistent with Category HUD)
 * - Updated z-index for proper layering (1140)
 * - ID changed from "synergy-debug-hud" to "ai-automation-hud"
 * 
 * Features:
 * - Real-time rendering (800ms refresh)
 * - Bottom-left HUD display (non-intrusive)
 * - Toggleable visibility (toggle() method)
 * - Zero performance impact when hidden
 * - Auto-colors for visual clarity
 * - Graceful handling of missing data
 * 
 * Usage:
 *   const debugHUD = new SynergyRecommendationDebugHUD(linkRecommendationAI, linkAutomationEngine);
 *   debugHUD.toggle();        // Show/hide
 *   debugHUD.stop();          // Stop rendering
 *   debugHUD.start();         // Resume rendering
 * 
 * Console API (via main.js):
 *   window.toggleSynergyDebug()     // Toggle HUD visibility
 *   window.getSynergyDebugStats()   // Get current statistics
 */

export class SynergyRecommendationDebugHUD {
    // Disabled: superseded by modular AIAutomationHUD (UI-only cleanup, keep new HUD intact)
    static DISABLED = true;

    /**
     * Initialize debug HUD
     * 
     * @param {LinkRecommendationAI1_0} linkRecommendationAI - Recommendation AI instance
     * @param {LinkAutomationEngine1_0} linkAutomationEngine - Automation engine instance
     */
    constructor(linkRecommendationAI, linkAutomationEngine) {
        if (SynergyRecommendationDebugHUD.DISABLED) {
            this.disabled = true;
            this.container = null;
            this.bodyElement = null;
            this.timer = null;
            return;
        }

        this.ai = linkRecommendationAI;
        this.auto = linkAutomationEngine;

        this.visible = true;
        this.refreshInterval = 800; // ms

        this.container = null;
        this.timer = null;

        this.init();
    }

    /**
     * Initialize DOM container and styling
     * @private
     */
    init() {
        // Create HUD div
        // SIMPLE FIX: Hard-coded position at top: 380px
        // Position: left: 10px, top: 380px (absolute, no bottom anchor)
        // Width: 180px (unchanged)
        // Z-index: 1140 (unchanged)
        this.container = document.createElement("div");
        this.container.id = "ai-automation-hud";
        this.container.setAttribute('data-hud-id', 'automationHUD');

        Object.assign(this.container.style, {
            position: "fixed",
            top: "1000px",
            left: "10px",
            width: "180px",
            borderRadius: "8px",
            background: "rgba(0, 10, 20, 0.7)",
            backdropFilter: "blur(6px)",
            border: "1.5px solid rgba(80, 255, 180, 0.4)",
            color: "#7DFFDD",
            fontSize: "11px",
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            zIndex: 1140,
            boxShadow: "0 0 20px rgba(80, 255, 180, 0.2)",
            lineHeight: "1.4"
        });

        // Create header with collapse button (will be added by collapse system)
        const header = document.createElement("div");
        header.className = "hud-header";
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px;
            border-bottom: 1px solid rgba(80, 255, 180, 0.2);
            margin: -12px -12px 12px -12px;
            cursor: pointer;
            user-select: none;
            background: rgba(0, 30, 40, 0.5);
            border-radius: 8px 8px 0 0;
        `;
        header.innerHTML = `
            <div style="font-weight: bold; color: #00FFD4; flex: 1;">⚡ AI AUTOMATION HUD</div>
            <div class="hud-collapse-button" style="
                color: #44FFAA;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 12px;
            ">▼</div>
        `;

        // Create body container for content
        const body = document.createElement("div");
        body.className = "hud-body";
        body.style.cssText = `
            padding: 0 12px 12px 12px;
            overflow-y: auto;
            max-height: 400px;
        `;

        this.container.appendChild(header);
        this.container.appendChild(body);
        
        // Store reference to body for content rendering
        this.bodyElement = body;

        document.body.appendChild(this.container);
        this.start();
    }

    /**
     * Start rendering cycle (800ms interval)
     */
    start() {
        this.timer = setInterval(() => this.render(), this.refreshInterval);
        // Initial render
        this.render();
    }

    /**
     * Stop rendering cycle
     */
    stop() {
        if (!this.timer) return;
        clearInterval(this.timer);
    }

    /**
     * Toggle HUD visibility
     */
    toggle() {
        if (!this.container) return;
        this.visible = !this.visible;
        this.container.style.display = this.visible ? "block" : "none";
    }

    /**
     * Show HUD
     */
    show() {
        if (!this.container) return;
        this.visible = true;
        this.container.style.display = "block";
    }

    /**
     * Hide HUD
     */
    hide() {
        if (!this.container) return;
        this.visible = false;
        this.container.style.display = "none";
    }

    /**
     * Main render method - updates HUD content
     * @private
     */
    render() {
        if (!this.visible || !this.container) return;

        try {
            // Get data from AI and automation systems
            const recs = this.ai?.getTopSuggestions?.() || [];
            const aiStats = this.ai?.getStats?.() || {};
            const autoStats = this.auto?.getStats?.() || {};

            let html = '';

            // --- AI RECOMMENDATIONS SECTION ---
            html += this._renderRecommendationsSection(recs);

            // --- AUTOMATION STATUS SECTION ---
            html += this._renderAutomationSection(autoStats);

            // --- STATISTICS SECTION ---
            html += this._renderStatisticsSection(aiStats, autoStats);

            // Render into body element (not header)
            if (this.bodyElement) {
                this.bodyElement.innerHTML = html;
            }
        } catch (err) {
            console.warn('[SynergyRecommendationDebugHUD] Render error:', err.message);
            if (this.bodyElement) {
                this.bodyElement.innerHTML = `<div style="color:#FF6B6B;">Error rendering HUD</div>`;
            }
        }
    }

    /**
     * Render AI recommendations section
     * @private
     */
    _renderRecommendationsSection(recs) {
        let html = `<div style="margin-bottom: 12px;">`;
        html += `<div style="color: #44FFAA; font-weight: bold; margin-bottom: 4px;">📊 Top Recommendations:</div>`;

        if (!recs || recs.length === 0) {
            html += `<div style="opacity: 0.5; font-style: italic;">Analyzing network...</div>`;
        } else {
            recs.slice(0, 5).forEach((r, i) => {
                const sourceLabel = this._getNodeLabel(r.nodeA);
                const targetLabel = this._getNodeLabel(r.nodeB);
                const synergyColor = this._getSynergyColor(r.synergyScore);

                html += `
                    <div style="margin-bottom: 6px; border-left: 2px solid #44FFAA; padding-left: 8px; background: rgba(68,255,170,0.05); padding: 6px 8px; border-radius: 3px;">
                        <div style="font-weight: bold; margin-bottom: 2px;">#${i + 1} ${sourceLabel} → ${targetLabel}</div>
                        <div>synergy: <span style="color: ${synergyColor}; font-weight: bold;">${r.synergyScore.toFixed(3)}</span></div>
                        ${r.reasons ? `<div style="opacity: 0.7; font-size: 10px;">reason: ${Object.keys(r.reasons)[0]}</div>` : ''}
                    </div>
                `;
            });
        }

        html += `</div>`;
        return html;
    }

    /**
     * Render automation engine status section
     * @private
     */
    _renderAutomationSection(autoStats) {
        let html = `<div style="margin-bottom: 12px;">`;
        html += `<div style="color: #9CE0FF; font-weight: bold; margin-bottom: 4px;">🤖 Automation Engine:</div>`;

        const isEnabled = autoStats?.config?.enabled ? '✓ ENABLED' : '✗ DISABLED';
        const enableColor = autoStats?.config?.enabled ? '#44FF44' : '#888888';

        html += `
            <div style="background: rgba(156,224,255,0.05); padding: 6px 8px; border-radius: 3px; border-left: 2px solid #9CE0FF;">
                <div>Status: <span style="color: ${enableColor}; font-weight: bold;">${isEnabled}</span></div>
                <div>Links Created: <span style="color: #FFD480; font-weight: bold;">${autoStats?.totalAutoLinksCreated || 0}</span></div>
                <div>Threshold: <span style="color: #FFB3E6;">${(autoStats?.config?.automationThreshold || 0.65).toFixed(2)}</span></div>
                <div>Cooldown: <span style="color: #FF8C94;">${autoStats?.cooldownRemaining || 0}ms</span></div>
                <div style="opacity: 0.7; font-size: 10px;">Last Exec: ${(autoStats?.lastExecutionMs || 0).toFixed(2)}ms</div>
            </div>
        `;

        html += `</div>`;
        return html;
    }

    /**
     * Render statistics section
     * @private
     */
    _renderStatisticsSection(aiStats, autoStats) {
        let html = `<div>`;
        html += `<div style="color: #FFE066; font-weight: bold; margin-bottom: 4px;">📈 Statistics:</div>`;

        const recommendationCount = aiStats?.totalRecommendations || 0;
        const averageUpdateTime = aiStats?.averageUpdateTime || 0;
        const totalCycles = autoStats?.totalCycles || 0;
        const averageLinksPerCycle = autoStats?.averageLinksPerCycle || 0;

        html += `
            <div style="background: rgba(255,224,102,0.05); padding: 6px 8px; border-radius: 3px; border-left: 2px solid #FFE066;">
                <div>Recommendations: <span style="color: #FFD480;">${recommendationCount}</span></div>
                <div>Avg Update: <span style="color: #FFB3E6;">${averageUpdateTime.toFixed(2)}ms</span></div>
                <div>Automation Cycles: <span style="color: #FF8C94;">${totalCycles}</span></div>
                <div>Avg Links/Cycle: <span style="color: #44FFAA;">${averageLinksPerCycle.toFixed(2)}</span></div>
            </div>
        `;

        html += `</div>`;
        return html;
    }

    /**
     * Get readable label for a node
     * @private
     */
    _getNodeLabel(node) {
        if (!node) return 'NODE';
        if (node.userData?.code) return node.userData.code;
        if (node.userData?.name) return node.userData.name;
        if (node.name) return node.name;
        return 'NODE';
    }

    /**
     * Get color for synergy score (green for high, yellow for medium, red for low)
     * @private
     */
    _getSynergyColor(score) {
        if (score >= 0.8) return '#44FF44';  // Green
        if (score >= 0.6) return '#FFD480';  // Orange
        if (score >= 0.4) return '#FF8C94';  // Red
        return '#888888';  // Gray
    }

    /**
     * Get current statistics
     */
    getStats() {
        return {
            recommendationCount: this.ai?.getTopSuggestions?.()?.length || 0,
            aiStats: this.ai?.getStats?.() || {},
            automationStats: this.auto?.getStats?.() || {},
            hudVisible: this.visible,
            hudRefreshInterval: this.refreshInterval
        };
    }

    /**
     * Set refresh interval (ms)
     */
    setRefreshInterval(ms) {
        this.refreshInterval = ms;
        this.stop();
        this.start();
    }

    /**
     * Cleanup - remove HUD from DOM
     */
    dispose() {
        this.stop();
        if (this.container && this.container.parentElement) {
            this.container.parentElement.removeChild(this.container);
        }
    }
}
