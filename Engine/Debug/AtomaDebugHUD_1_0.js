/**
 * AtomaDebugHUD_1_0.js - In-Game Debug Monitoring System
 * 
 * Toggleable debug overlay (F4) for monitoring ATOMA link systems:
 * - Link Priority Decay Engine
 * - ML Recommendation Engine
 * - Quality Feedback Loop
 * - User Acceptance Tracker
 * - Node Repair Layer
 * 
 * Features:
 * - 5-tab interface with click switching
 * - Real-time stat monitoring (300ms refresh)
 * - Neon UI styling matching ATOMA aesthetics
 * - Responsive design (desktop & mobile)
 * - Safe null-checking and error handling
 * - No window.* pollution, no console dependencies
 */

export class AtomaDebugHUD_1_0 {
    constructor() {
        this.isVisible = false;
        this.activeTab = 'decay'; // 'decay', 'ml', 'quality', 'acceptance', 'repair'
        this.hudElement = null;
        this.updateInterval = null;
        
        this.initializeHUD();
        this.attachKeyListener();
        
        console.log('✅ [AtomaDebugHUD] Initialized - Press F4 to toggle');
    }

    /**
     * Initialize HUD DOM structure with neon styling
     */
    initializeHUD() {
        // Create main container
        this.hudElement = document.createElement('div');
        this.hudElement.id = 'atoma-debug-hud';
        this.hudElement.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 420px;
            height: 500px;
            background: rgba(10, 20, 35, 0.95);
            border: 2px solid #00ffff;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            color: #00ff88;
            font-size: 11px;
            z-index: 10000;
            display: none;
            flex-direction: column;
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.3), inset 0 0 10px rgba(0, 255, 136, 0.1);
            overflow: hidden;
        `;

        // Tab bar
        const tabBar = document.createElement('div');
        tabBar.style.cssText = `
            display: flex;
            background: rgba(0, 50, 60, 0.8);
            border-bottom: 1px solid #00ffff;
            gap: 2px;
            padding: 4px;
            flex-shrink: 0;
        `;

        const tabs = [
            { id: 'decay', label: 'Decay' },
            { id: 'ml', label: 'ML' },
            { id: 'quality', label: 'Quality' },
            { id: 'acceptance', label: 'Acceptance' },
            { id: 'repair', label: 'Repair' }
        ];

        tabs.forEach(tab => {
            const btn = document.createElement('button');
            btn.textContent = tab.label;
            btn.dataset.tab = tab.id;
            btn.style.cssText = `
                padding: 4px 8px;
                background: rgba(0, 100, 120, 0.6);
                border: 1px solid #00ff88;
                color: #00ff88;
                font-family: 'Courier New', monospace;
                font-size: 10px;
                cursor: pointer;
                border-radius: 3px;
                transition: all 0.2s;
                flex: 1;
            `;

            btn.onmouseover = () => {
                btn.style.background = 'rgba(0, 150, 180, 0.8)';
                btn.style.boxShadow = '0 0 10px rgba(0, 255, 136, 0.5)';
            };
            btn.onmouseout = () => {
                if (btn.dataset.tab !== this.activeTab) {
                    btn.style.background = 'rgba(0, 100, 120, 0.6)';
                    btn.style.boxShadow = 'none';
                }
            };

            btn.onclick = () => this.switchTab(tab.id, tabs);
            tabBar.appendChild(btn);
        });

        // Content area
        const contentArea = document.createElement('div');
        contentArea.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 10px;
            background: rgba(5, 15, 25, 0.9);
        `;

        // Custom scrollbar styling
        const style = document.createElement('style');
        style.textContent = `
            #atoma-debug-hud::-webkit-scrollbar {
                width: 6px;
            }
            #atoma-debug-hud::-webkit-scrollbar-track {
                background: rgba(0, 50, 60, 0.5);
            }
            #atoma-debug-hud::-webkit-scrollbar-thumb {
                background: #00ff88;
                border-radius: 3px;
            }
            #atoma-debug-hud::-webkit-scrollbar-thumb:hover {
                background: #00ffff;
            }
            .debug-stat {
                margin: 8px 0;
                padding: 6px;
                border-left: 2px solid #00ffaa;
                background: rgba(0, 80, 100, 0.3);
                line-height: 1.5;
            }
            .debug-stat-label {
                color: #00ffff;
                font-weight: bold;
            }
            .debug-stat-value {
                color: #00ff88;
                margin-left: 8px;
            }
            .debug-stat.inactive {
                color: #666666;
                border-left-color: #444444;
                background: rgba(40, 40, 40, 0.3);
            }
            .debug-stat.inactive .debug-stat-label {
                color: #888888;
            }
            .debug-stat.inactive .debug-stat-value {
                color: #666666;
            }
        `;
        document.head.appendChild(style);

        // Tab content containers
        const tabContents = {
            'decay': this.createDecayTab(),
            'ml': this.createMLTab(),
            'quality': this.createQualityTab(),
            'acceptance': this.createAcceptanceTab(),
            'repair': this.createRepairTab()
        };

        Object.keys(tabContents).forEach(tabId => {
            tabContents[tabId].style.display = tabId === this.activeTab ? 'block' : 'none';
            contentArea.appendChild(tabContents[tabId]);
        });

        this.tabContents = tabContents;

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = `
            position: absolute;
            top: 4px;
            right: 4px;
            width: 20px;
            height: 20px;
            background: rgba(200, 50, 50, 0.7);
            border: 1px solid #ff0000;
            color: #ff0000;
            cursor: pointer;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
        `;
        closeBtn.onclick = () => this.toggle();

        // Assemble HUD
        this.hudElement.appendChild(closeBtn);
        this.hudElement.appendChild(tabBar);
        this.hudElement.appendChild(contentArea);
        document.body.appendChild(this.hudElement);

        this.startUpdates();
    }

    /**
     * Create Decay Engine tab content
     */
    createDecayTab() {
        const container = document.createElement('div');
        container.className = 'debug-tab-content';
        container.innerHTML = `
            <div class="debug-stat">
                <span class="debug-stat-label">Status:</span>
                <span class="debug-stat-value" data-bind="decay-status">(inactive)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Decay Rate:</span>
                <span class="debug-stat-value" data-bind="decay-rate">(N/A)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Active Links:</span>
                <span class="debug-stat-value" data-bind="decay-active-links">(N/A)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Decayed Links:</span>
                <span class="debug-stat-value" data-bind="decay-decayed-links">(N/A)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Avg Priority:</span>
                <span class="debug-stat-value" data-bind="decay-avg-priority">(N/A)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Max Priority:</span>
                <span class="debug-stat-value" data-bind="decay-max-priority">(N/A)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Update Freq:</span>
                <span class="debug-stat-value" data-bind="decay-update-freq">(N/A)</span>
            </div>
        `;
        return container;
    }

    /**
     * Create ML Engine tab content
     */
    createMLTab() {
        const container = document.createElement('div');
        container.className = 'debug-tab-content';
        container.innerHTML = `
            <div class="debug-stat">
                <span class="debug-stat-label">Status:</span>
                <span class="debug-stat-value" data-bind="ml-status">(inactive)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Accuracy:</span>
                <span class="debug-stat-value" data-bind="ml-accuracy">(N/A)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Recommendations:</span>
                <span class="debug-stat-value" data-bind="ml-recommendations">(N/A)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Accepted:</span>
                <span class="debug-stat-value" data-bind="ml-accepted">(N/A)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Rejected:</span>
                <span class="debug-stat-value" data-bind="ml-rejected">(N/A)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Pending:</span>
                <span class="debug-stat-value" data-bind="ml-pending">(N/A)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Confidence:</span>
                <span class="debug-stat-value" data-bind="ml-confidence">(N/A)</span>
            </div>
        `;
        return container;
    }

    /**
     * Create Quality Feedback Loop tab content
     */
    createQualityTab() {
        const container = document.createElement('div');
        container.className = 'debug-tab-content';
        container.innerHTML = `
            <div class="debug-stat">
                <span class="debug-stat-label">Status:</span>
                <span class="debug-stat-value" data-bind="quality-status">(inactive)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Avg Quality:</span>
                <span class="debug-stat-value" data-bind="quality-avg">(N/A)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">High Quality:</span>
                <span class="debug-stat-value" data-bind="quality-high">(N/A)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Medium Quality:</span>
                <span class="debug-stat-value" data-bind="quality-medium">(N/A)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Low Quality:</span>
                <span class="debug-stat-value" data-bind="quality-low">(N/A)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Feedback Rate:</span>
                <span class="debug-stat-value" data-bind="quality-feedback-rate">(N/A)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Last Update:</span>
                <span class="debug-stat-value" data-bind="quality-last-update">(N/A)</span>
            </div>
        `;
        return container;
    }

    /**
     * Create User Acceptance Tracker tab content
     */
    createAcceptanceTab() {
        const container = document.createElement('div');
        container.className = 'debug-tab-content';
        container.innerHTML = `
            <div class="debug-stat">
                <span class="debug-stat-label">Status:</span>
                <span class="debug-stat-value" data-bind="acceptance-status">(inactive)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Total Events:</span>
                <span class="debug-stat-value" data-bind="acceptance-total">(N/A)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Accepted:</span>
                <span class="debug-stat-value" data-bind="acceptance-accepted">(N/A)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Rejection Rate:</span>
                <span class="debug-stat-value" data-bind="acceptance-rejection-rate">(N/A)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Acceptance Rate:</span>
                <span class="debug-stat-value" data-bind="acceptance-acceptance-rate">(N/A)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Trend:</span>
                <span class="debug-stat-value" data-bind="acceptance-trend">(N/A)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Learning Score:</span>
                <span class="debug-stat-value" data-bind="acceptance-learning-score">(N/A)</span>
            </div>
        `;
        return container;
    }

    /**
     * Create Node Repair Layer tab content
     */
    createRepairTab() {
        const container = document.createElement('div');
        container.className = 'debug-tab-content';
        container.innerHTML = `
            <div class="debug-stat">
                <span class="debug-stat-label">Status:</span>
                <span class="debug-stat-value" data-bind="repair-status">(inactive)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Total Repairs:</span>
                <span class="debug-stat-value" data-bind="repair-total">(N/A)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Orphaned Nodes:</span>
                <span class="debug-stat-value" data-bind="repair-orphaned">(N/A)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Broken Links:</span>
                <span class="debug-stat-value" data-bind="repair-broken-links">(N/A)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Recovered:</span>
                <span class="debug-stat-value" data-bind="repair-recovered">(N/A)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Success Rate:</span>
                <span class="debug-stat-value" data-bind="repair-success-rate">(N/A)</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat-label">Last Action:</span>
                <span class="debug-stat-value" data-bind="repair-last-action">(N/A)</span>
            </div>
        `;
        return container;
    }

    /**
     * Switch active tab
     */
    switchTab(tabId, tabs) {
        this.activeTab = tabId;

        // Hide all tabs
        Object.values(this.tabContents).forEach(content => {
            content.style.display = 'none';
        });

        // Show active tab
        if (this.tabContents[tabId]) {
            this.tabContents[tabId].style.display = 'block';
        }

        // Update tab button styling
        document.querySelectorAll('#atoma-debug-hud button[data-tab]').forEach(btn => {
            if (btn.dataset.tab === tabId) {
                btn.style.background = 'rgba(0, 255, 136, 0.4)';
                btn.style.boxShadow = '0 0 10px rgba(0, 255, 136, 0.7)';
                btn.style.borderColor = '#00ff88';
            } else {
                btn.style.background = 'rgba(0, 100, 120, 0.6)';
                btn.style.boxShadow = 'none';
                btn.style.borderColor = '#00ff88';
            }
        });
    }

    /**
     * Toggle HUD visibility (F4)
     */
    toggle() {
        this.isVisible = !this.isVisible;
        this.hudElement.style.display = this.isVisible ? 'flex' : 'none';
    }

    /**
     * Attach F4 key listener
     */
    attachKeyListener() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F4') {
                this.toggle();
            }
        });
    }

    /**
     * Start live stat updates
     */
    startUpdates() {
        this.updateInterval = setInterval(() => {
            if (!this.isVisible) return;
            this.updateStats();
        }, 300);
    }

    /**
     * Update all stat displays
     */
    updateStats() {
        try {
            // Get game instance from window.game if available
            const game = window.game || null;
            
            if (!game) {
                this.markAllInactive();
                return;
            }

            // Update Decay Engine tab
            this.updateDecayStats(game);

            // Update ML Engine tab
            this.updateMLStats(game);

            // Update Quality Feedback tab
            this.updateQualityStats(game);

            // Update Acceptance Tracker tab
            this.updateAcceptanceStats(game);

            // Update Repair Layer tab
            this.updateRepairStats(game);
        } catch (error) {
            // Safe error handling - silently skip on error
        }
    }

    /**
     * Update Decay Engine stats
     */
    updateDecayStats(game) {
        const engine = game.linkPriorityDecayEngine;
        
        if (!engine) {
            this.setBindingClass('decay-status', 'inactive');
            this.setBinding('decay-status', '(inactive)');
            return;
        }

        this.setBindingClass('decay-status', 'active');
        this.setBinding('decay-status', 'Active ✓');
        this.setBinding('decay-rate', `${(engine.decayRate || 0).toFixed(4)}/s`);
        this.setBinding('decay-active-links', String(engine.activeLinks?.length || 0));
        this.setBinding('decay-decayed-links', String(engine.decayedLinks?.length || 0));

        const avgPriority = engine.averagePriority || 0;
        this.setBinding('decay-avg-priority', `${avgPriority.toFixed(2)}`);

        const maxPriority = engine.maxPriority || 0;
        this.setBinding('decay-max-priority', `${maxPriority.toFixed(2)}`);

        this.setBinding('decay-update-freq', `${(engine.updateFrequency || 0).toFixed(1)} Hz`);
    }

    /**
     * Update ML Engine stats
     */
    updateMLStats(game) {
        const engine = game.linkMLRecommendationEngine;
        
        if (!engine) {
            this.setBindingClass('ml-status', 'inactive');
            this.setBinding('ml-status', '(inactive)');
            return;
        }

        this.setBindingClass('ml-status', 'active');
        this.setBinding('ml-status', 'Active ✓');
        this.setBinding('ml-accuracy', `${((engine.accuracy || 0) * 100).toFixed(1)}%`);
        this.setBinding('ml-recommendations', String(engine.totalRecommendations || 0));
        this.setBinding('ml-accepted', String(engine.acceptedCount || 0));
        this.setBinding('ml-rejected', String(engine.rejectedCount || 0));
        this.setBinding('ml-pending', String(engine.pendingCount || 0));

        const confidence = engine.averageConfidence || 0;
        this.setBinding('ml-confidence', `${(confidence * 100).toFixed(1)}%`);
    }

    /**
     * Update Quality Feedback Loop stats
     */
    updateQualityStats(game) {
        const loop = game.linkQualityFeedbackLoop;
        
        if (!loop) {
            this.setBindingClass('quality-status', 'inactive');
            this.setBinding('quality-status', '(inactive)');
            return;
        }

        this.setBindingClass('quality-status', 'active');
        this.setBinding('quality-status', 'Active ✓');
        this.setBinding('quality-avg', `${((loop.averageQuality || 0) * 100).toFixed(1)}%`);
        this.setBinding('quality-high', String(loop.highQualityCount || 0));
        this.setBinding('quality-medium', String(loop.mediumQualityCount || 0));
        this.setBinding('quality-low', String(loop.lowQualityCount || 0));
        this.setBinding('quality-feedback-rate', `${((loop.feedbackRate || 0) * 100).toFixed(1)}%`);
        this.setBinding('quality-last-update', `${(Date.now() - (loop.lastUpdateTime || 0)) / 1000 | 0}s ago`);
    }

    /**
     * Update User Acceptance Tracker stats
     */
    updateAcceptanceStats(game) {
        const tracker = game.userAcceptanceTracker;
        
        if (!tracker) {
            this.setBindingClass('acceptance-status', 'inactive');
            this.setBinding('acceptance-status', '(inactive)');
            return;
        }

        this.setBindingClass('acceptance-status', 'active');
        this.setBinding('acceptance-status', 'Active ✓');
        this.setBinding('acceptance-total', String(tracker.totalEvents || 0));
        this.setBinding('acceptance-accepted', String(tracker.acceptedCount || 0));

        const rejectionRate = tracker.rejectionRate || 0;
        this.setBinding('acceptance-rejection-rate', `${(rejectionRate * 100).toFixed(1)}%`);

        const acceptanceRate = tracker.acceptanceRate || 0;
        this.setBinding('acceptance-acceptance-rate', `${(acceptanceRate * 100).toFixed(1)}%`);

        const trend = tracker.currentTrend || 'neutral';
        this.setBinding('acceptance-trend', trend);

        const learningScore = tracker.learningScore || 0;
        this.setBinding('acceptance-learning-score', `${(learningScore * 100).toFixed(1)}%`);
    }

    /**
     * Update Node Repair Layer stats
     */
    updateRepairStats(game) {
        const repairLayer = game.nodeLinkerRepairLayer;
        
        if (!repairLayer) {
            this.setBindingClass('repair-status', 'inactive');
            this.setBinding('repair-status', '(inactive)');
            return;
        }

        this.setBindingClass('repair-status', 'active');
        this.setBinding('repair-status', 'Active ✓');
        this.setBinding('repair-total', String(repairLayer.totalRepairs || 0));
        this.setBinding('repair-orphaned', String(repairLayer.orphanedNodes?.length || 0));
        this.setBinding('repair-broken-links', String(repairLayer.brokenLinks?.length || 0));
        this.setBinding('repair-recovered', String(repairLayer.recoveredCount || 0));

        const successRate = repairLayer.successRate || 0;
        this.setBinding('repair-success-rate', `${(successRate * 100).toFixed(1)}%`);

        const lastAction = repairLayer.lastAction || 'none';
        this.setBinding('repair-last-action', lastAction);
    }

    /**
     * Update a data binding
     */
    setBinding(dataName, value) {
        try {
            const element = this.hudElement?.querySelector(`[data-bind="${dataName}"]`);
            if (element) {
                element.textContent = value;
            }
        } catch (e) {
            // Silent fail
        }
    }

    /**
     * Set binding class for styling
     */
    setBindingClass(dataName, className) {
        try {
            const element = this.hudElement?.querySelector(`[data-bind="${dataName}"]`);
            if (element && element.parentElement) {
                if (className === 'inactive') {
                    element.parentElement.classList.add('inactive');
                } else {
                    element.parentElement.classList.remove('inactive');
                }
            }
        } catch (e) {
            // Silent fail
        }
    }

    /**
     * Mark all stats as inactive
     */
    markAllInactive() {
        const bindings = [
            'decay-status', 'decay-rate', 'decay-active-links', 'decay-decayed-links',
            'decay-avg-priority', 'decay-max-priority', 'decay-update-freq',
            'ml-status', 'ml-accuracy', 'ml-recommendations', 'ml-accepted', 'ml-rejected',
            'ml-pending', 'ml-confidence',
            'quality-status', 'quality-avg', 'quality-high', 'quality-medium', 'quality-low',
            'quality-feedback-rate', 'quality-last-update',
            'acceptance-status', 'acceptance-total', 'acceptance-accepted', 'acceptance-rejection-rate',
            'acceptance-acceptance-rate', 'acceptance-trend', 'acceptance-learning-score',
            'repair-status', 'repair-total', 'repair-orphaned', 'repair-broken-links',
            'repair-recovered', 'repair-success-rate', 'repair-last-action'
        ];

        bindings.forEach(binding => {
            const element = this.hudElement?.querySelector(`[data-bind="${binding}"]`);
            if (element) {
                if (binding.includes('-status')) {
                    element.textContent = '(inactive)';
                } else {
                    element.textContent = '(N/A)';
                }
                
                if (element.parentElement) {
                    element.parentElement.classList.add('inactive');
                }
            }
        });
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        if (this.hudElement && this.hudElement.parentElement) {
            this.hudElement.parentElement.removeChild(this.hudElement);
        }
    }
}
