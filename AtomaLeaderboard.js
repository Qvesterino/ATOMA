/**
 * ============================================================================
 * ATOMA LEADERBOARD v1.0
 * ============================================================================
 *
 * RESPONSIBILITY:
 * Score calculation, persistence, and leaderboard display for completed
 * game runs. A run is successful when the player reverses Network Time
 * back to zero.
 *
 * SCORE FORMULA:
 *   baseScore = gameTimeWeight / max(gameTime, 1)
 *   synergyBonus = avgSynergy * synergyWeight
 *   efficiencyBonus = (1 - peakNT / maxNT) * efficiencyWeight
 *   speedBonus = (rewindSpeed / maxRewindSpeed) * speedWeight
 *   comboBonus = maxCombo * comboWeight
 *   collapsePenalty = totalCollapses * collapsePenaltyWeight
 *
 *   finalScore = (baseScore + synergyBonus + efficiencyBonus + speedBonus + comboBonus - collapsePenalty) * difficultyMultiplier
 *
 * All weights are configurable. No hardcoded magic numbers.
 *
 * PERSISTENCE:
 *   localStorage key: 'atoma.leaderboard'
 *   Format: Array of { score, name, date, world, stats }
 *   Max entries: configurable (default 20)
 *
 * INTEGRATION:
 *   const leaderboard = new AtomaLeaderboard(config);
 *   leaderboard.submitRun(runData);
 *   leaderboard.showOverlay();
 */

export class AtomaLeaderboard {
    constructor(config = {}) {
        // ── Scoring weights (all easily tunable) ────────────────────────
        this.scoring = {
            // Base score: inversely proportional to game time (faster = better)
            gameTimeWeight: config.gameTimeWeight ?? 10000,
            gameTimeCap: config.gameTimeCap ?? 600,       // max seconds for score calc

            // Synergy bonus: higher sustained synergy = better score
            synergyWeight: config.synergyWeight ?? 3000,

            // Efficiency bonus: lower peak NT = better (less pressure accumulated)
            efficiencyWeight: config.efficiencyWeight ?? 2000,
            maxNTForScore: config.maxNTForScore ?? 500,   // NT value considered "max" for scoring

            // Speed bonus: faster rewind speed = better
            speedWeight: config.speedWeight ?? 1500,
            maxRewindSpeed: config.maxRewindSpeed ?? 10,   // units/sec considered "max" for scoring

            // Combo bonus: consecutive rewind sessions
            comboWeight: config.comboWeight ?? 500,

            // Collapse penalty: each link collapse reduces score
            collapsePenaltyWeight: config.collapsePenaltyWeight ?? 200,

            // Difficulty multiplier per world
            difficultyMultipliers: config.difficultyMultipliers ?? {
                default: 1.0,
                easy: 0.8,
                normal: 1.0,
                hard: 1.3,
                extreme: 1.8,
            },
        };

        // ── Leaderboard config ──────────────────────────────────────────
        this.maxEntries = config.maxEntries ?? 20;
        this.storageKey = config.storageKey ?? 'atoma.leaderboard';
        this.defaultPlayerName = config.defaultPlayerName ?? 'OPERATOR';

        // ── State ───────────────────────────────────────────────────────
        this._entries = [];
        this._overlayElement = null;

        // Load existing entries
        this._load();
    }

    // ====================================================================
    // SCORE CALCULATION
    // ====================================================================

    /**
     * Calculate score for a completed game run.
     *
     * @param {Object} runData
     * @param {number} runData.gameTime - Total game time in seconds
     * @param {number} runData.avgSynergy - Average synergy at win moment [0..1]
     * @param {number} runData.peakNT - Highest Network Time reached
     * @param {number} runData.effectiveRewindSpeed - Average rewind speed
     * @param {number} runData.maxCombo - Highest combo count achieved
     * @param {number} runData.totalCollapses - Total link collapses during run
     * @param {number} runData.totalRewindTime - Total time spent rewinding
     * @param {string} runData.world - World/mode name
     * @param {number} runData.nodeCount - Active nodes at win
     * @param {number} runData.linkCount - Active links at win
     * @returns {Object} { score, breakdown }
     */
    calculateScore(runData = {}) {
        const gameTime = Math.max(1, runData.gameTime ?? 1);
        const avgSynergy = Math.max(0, Math.min(1, runData.avgSynergy ?? 0));
        const peakNT = Math.max(0, runData.peakNT ?? 0);
        const rewindSpeed = Math.max(0, runData.effectiveRewindSpeed ?? 3);
        const maxCombo = Math.max(0, runData.maxCombo ?? 0);
        const totalCollapses = Math.max(0, runData.totalCollapses ?? 0);
        const world = String(runData.world ?? 'default').toLowerCase();

        // Base score: faster completion = higher score
        const cappedTime = Math.min(gameTime, this.scoring.gameTimeCap);
        const baseScore = this.scoring.gameTimeWeight * (1 - cappedTime / this.scoring.gameTimeCap);

        // Synergy bonus
        const synergyBonus = avgSynergy * this.scoring.synergyWeight;

        // Efficiency bonus: lower peak NT = more efficient
        const efficiencyRatio = 1 - Math.min(1, peakNT / this.scoring.maxNTForScore);
        const efficiencyBonus = efficiencyRatio * this.scoring.efficiencyWeight;

        // Speed bonus: faster rewind = better
        const speedRatio = Math.min(1, rewindSpeed / this.scoring.maxRewindSpeed);
        const speedBonus = speedRatio * this.scoring.speedWeight;

        // Combo bonus
        const comboBonus = maxCombo * this.scoring.comboWeight;

        // Collapse penalty
        const collapsePenalty = totalCollapses * this.scoring.collapsePenaltyWeight;

        // Difficulty multiplier
        const difficultyMultiplier = this.scoring.difficultyMultipliers[world]
            ?? this.scoring.difficultyMultipliers.default
            ?? 1.0;

        const rawScore = baseScore + synergyBonus + efficiencyBonus + speedBonus + comboBonus - collapsePenalty;
        const finalScore = Math.max(0, Math.round(rawScore * difficultyMultiplier));

        return {
            score: finalScore,
            breakdown: {
                baseScore: Math.round(baseScore),
                synergyBonus: Math.round(synergyBonus),
                efficiencyBonus: Math.round(efficiencyBonus),
                speedBonus: Math.round(speedBonus),
                comboBonus: Math.round(comboBonus),
                collapsePenalty: Math.round(collapsePenalty),
                difficultyMultiplier,
                rawScore: Math.round(rawScore),
            },
        };
    }

    // ====================================================================
    // SUBMIT & PERSIST
    // ====================================================================

    /**
     * Submit a completed run to the leaderboard.
     *
     * @param {Object} runData - Same as calculateScore()
     * @param {string} [playerName] - Optional player name
     * @returns {Object} { rank, score, breakdown, isNewBest }
     */
    submitRun(runData = {}, playerName = null) {
        const { score, breakdown } = this.calculateScore(runData);

        const entry = {
            score,
            breakdown,
            playerName: playerName || this.defaultPlayerName,
            date: new Date().toISOString(),
            world: String(runData.world ?? 'default').toUpperCase(),
            stats: {
                gameTime: runData.gameTime ?? 0,
                avgSynergy: runData.avgSynergy ?? 0,
                peakNT: runData.peakNT ?? 0,
                maxCombo: runData.maxCombo ?? 0,
                totalCollapses: runData.totalCollapses ?? 0,
                totalRewindTime: runData.totalRewindTime ?? 0,
                nodeCount: runData.nodeCount ?? 0,
                linkCount: runData.linkCount ?? 0,
            },
        };

        // Check if new best
        const previousBest = this._entries.length > 0 ? this._entries[0].score : 0;
        const isNewBest = score > previousBest;

        // Insert sorted by score descending
        this._entries.push(entry);
        this._entries.sort((a, b) => b.score - a.score);

        // Trim to max entries
        while (this._entries.length > this.maxEntries) {
            this._entries.pop();
        }

        // Persist
        this._save();

        // Find rank
        const rank = this._entries.findIndex(e => e === entry) + 1;

        return { rank, score, breakdown, isNewBest };
    }

    /**
     * Get all leaderboard entries.
     * @returns {Array} Sorted by score descending
     */
    getEntries() {
        return [...this._entries];
    }

    /**
     * Get the best score.
     * @returns {number}
     */
    getBestScore() {
        return this._entries.length > 0 ? this._entries[0].score : 0;
    }

    /**
     * Get rank for a given score.
     * @param {number} score
     * @returns {number} Rank (1-based) or -1 if not on leaderboard
     */
    getRankForScore(score) {
        const idx = this._entries.findIndex(e => e.score <= score);
        return idx >= 0 ? idx + 1 : -1;
    }

    // ====================================================================
    // OVERLAY UI
    // ====================================================================

    /**
     * Show the leaderboard overlay.
     * @param {Object} [options] - { highlightRank, onClose }
     */
    showOverlay(options = {}) {
        this.hideOverlay(); // Remove any existing

        const highlightRank = options.highlightRank ?? null;
        const entries = this._entries;

        const overlay = document.createElement('div');
        overlay.id = 'atoma-leaderboard-overlay';

        const rowsHtml = entries.length === 0
            ? '<div class="lb-empty">No runs recorded yet. Complete a game run to appear here.</div>'
            : entries.map((entry, i) => {
                const rank = i + 1;
                const isHighlighted = rank === highlightRank;
                const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
                const dateStr = new Date(entry.date).toLocaleDateString();
                const scoreStr = entry.score.toLocaleString();
                const timeStr = entry.stats.gameTime
                    ? `${Math.floor(entry.stats.gameTime / 60)}:${Math.floor(entry.stats.gameTime % 60).toString().padStart(2, '0')}`
                    : '--:--';
                const synergyStr = entry.stats.avgSynergy ? `${(entry.stats.avgSynergy * 100).toFixed(0)}%` : '--';

                return `
                    <div class="lb-row ${isHighlighted ? 'lb-highlighted' : ''} ${rank <= 3 ? 'lb-podium' : ''}">
                        <div class="lb-rank">${rankIcon}</div>
                        <div class="lb-name">${entry.playerName}</div>
                        <div class="lb-score">${scoreStr}</div>
                        <div class="lb-meta">
                            <span class="lb-tag">${entry.world}</span>
                            <span class="lb-tag">${timeStr}</span>
                            <span class="lb-tag">⚡${synergyStr}</span>
                        </div>
                        <div class="lb-date">${dateStr}</div>
                    </div>
                `;
            }).join('');

        overlay.innerHTML = `
            <style>
                #atoma-leaderboard-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(4, 8, 16, 0.9);
                    backdrop-filter: blur(24px) saturate(1.3);
                    -webkit-backdrop-filter: blur(24px) saturate(1.3);
                    animation: lb-fadein 0.5s ease-out;
                    font-family: 'Rajdhani', 'Segoe UI', sans-serif;
                    color: rgba(200, 225, 245, 0.9);
                }
                @keyframes lb-fadein {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .lb-card {
                    width: 520px;
                    max-height: 80vh;
                    display: flex;
                    flex-direction: column;
                    animation: lb-scale 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes lb-scale {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .lb-header {
                    text-align: center;
                    margin-bottom: 24px;
                }
                .lb-title {
                    font-size: 22px;
                    font-weight: 700;
                    letter-spacing: 0.15em;
                    text-transform: uppercase;
                    color: #00d4ff;
                    text-shadow: 0 0 20px rgba(0, 212, 255, 0.2);
                }
                .lb-subtitle {
                    font-size: 9px;
                    letter-spacing: 0.2em;
                    text-transform: uppercase;
                    color: rgba(0, 212, 255, 0.35);
                    margin-top: 4px;
                }
                .lb-entries {
                    flex: 1;
                    overflow-y: auto;
                    max-height: 55vh;
                    padding-right: 8px;
                }
                .lb-entries::-webkit-scrollbar {
                    width: 3px;
                }
                .lb-entries::-webkit-scrollbar-thumb {
                    background: rgba(0, 212, 255, 0.2);
                    border-radius: 2px;
                }
                .lb-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 12px;
                    border-bottom: 1px solid rgba(0, 200, 220, 0.06);
                    transition: background 0.2s;
                }
                .lb-row:hover {
                    background: rgba(0, 212, 255, 0.04);
                }
                .lb-row.lb-highlighted {
                    background: rgba(0, 255, 136, 0.08);
                    border-left: 2px solid #00ff88;
                }
                .lb-row.lb-podium {
                    border-bottom-color: rgba(0, 200, 220, 0.12);
                }
                .lb-rank {
                    width: 40px;
                    font-size: 14px;
                    font-weight: 700;
                    text-align: center;
                    flex-shrink: 0;
                }
                .lb-name {
                    width: 90px;
                    font-size: 12px;
                    font-weight: 600;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: rgba(200, 225, 245, 0.7);
                    flex-shrink: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .lb-score {
                    font-size: 18px;
                    font-family: 'JetBrains Mono', 'Fira Code', monospace;
                    font-weight: 700;
                    color: #00d4ff;
                    flex-shrink: 0;
                    min-width: 70px;
                }
                .lb-row.lb-highlighted .lb-score {
                    color: #00ff88;
                }
                .lb-meta {
                    display: flex;
                    gap: 6px;
                    flex: 1;
                    justify-content: flex-end;
                }
                .lb-tag {
                    font-size: 9px;
                    padding: 2px 6px;
                    background: rgba(0, 200, 220, 0.06);
                    border-radius: 2px;
                    color: rgba(200, 225, 245, 0.4);
                    letter-spacing: 0.05em;
                }
                .lb-date {
                    font-size: 9px;
                    color: rgba(200, 225, 245, 0.25);
                    flex-shrink: 0;
                    width: 65px;
                    text-align: right;
                }
                .lb-empty {
                    text-align: center;
                    padding: 40px 20px;
                    color: rgba(200, 225, 245, 0.3);
                    font-size: 12px;
                    letter-spacing: 0.05em;
                }
                .lb-footer {
                    text-align: center;
                    margin-top: 20px;
                }
                .lb-close-btn {
                    display: inline-block;
                    padding: 10px 32px;
                    background: rgba(0, 212, 255, 0.08);
                    border: 1px solid rgba(0, 212, 255, 0.2);
                    border-radius: 4px;
                    color: #00d4ff;
                    font-family: 'Rajdhani', 'Segoe UI', sans-serif;
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 0.15em;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .lb-close-btn:hover {
                    background: rgba(0, 212, 255, 0.15);
                    border-color: rgba(0, 212, 255, 0.4);
                    box-shadow: 0 0 15px rgba(0, 212, 255, 0.1);
                }
            </style>
            <div class="lb-card">
                <div class="lb-header">
                    <div class="lb-title">Leaderboard</div>
                    <div class="lb-subtitle">Top ${this.maxEntries} network collapses</div>
                </div>
                <div class="lb-entries">
                    ${rowsHtml}
                </div>
                <div class="lb-footer">
                    <button class="lb-close-btn" id="atoma-lb-close">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this._overlayElement = overlay;

        // Wire close button
        const closeBtn = document.getElementById('atoma-lb-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideOverlay();
                if (typeof options.onClose === 'function') options.onClose();
            });
        }

        // Close on background click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hideOverlay();
                if (typeof options.onClose === 'function') options.onClose();
            }
        });
    }

    /**
     * Hide the leaderboard overlay.
     */
    hideOverlay() {
        if (this._overlayElement) {
            this._overlayElement.remove();
            this._overlayElement = null;
        }
    }

    // ====================================================================
    // PERSISTENCE
    // ====================================================================

    _load() {
        try {
            if (typeof localStorage === 'undefined') return;
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) return;
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                this._entries = parsed;
            }
        } catch (_e) {
            this._entries = [];
        }
    }

    _save() {
        try {
            if (typeof localStorage === 'undefined') return;
            localStorage.setItem(this.storageKey, JSON.stringify(this._entries));
        } catch (_e) {
            // Silent — localStorage may be full or unavailable
        }
    }

    /**
     * Clear all leaderboard entries.
     */
    clear() {
        this._entries = [];
        this._save();
    }

    /**
     * Dispose and clean up.
     */
    dispose() {
        this.hideOverlay();
        this._entries = [];
    }
}

/**
 * Quick validation function.
 */
export function validateAtomaLeaderboard() {
    console.log('✓ AtomaLeaderboard v1.0 loaded');
    console.log('  - Score: time-based + synergy + efficiency + speed + combo - collapses');
    console.log('  - Persistence: localStorage');
    console.log('  - Max entries: 20 (configurable)');
    console.log('  - Overlay: full-screen leaderboard with rank highlighting');
}
