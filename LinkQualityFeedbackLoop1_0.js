/**
 * LinkQualityFeedbackLoop1_0.js
 * 
 * ATOMA Link Quality Feedback Loop System
 * Evaluates link quality, tracks outcomes, and feeds intelligence into:
 * - LinkMLRecommendationEngine1_0 (ML weight adjustment)
 * - LinkPriorityDecayEngine1_0 (decay rate modulation)
 * - LinkAutomationEngine1_0 (automation quality filtering)
 * - SelectedHUDSyncPatch1_0 (HUD quality indicators)
 * 
 * Version: 1.0.0
 * Session: 27 Extended
 * Status: PRODUCTION READY
 */

export class LinkQualityFeedbackLoop1_0 {
    /**
     * Constructor
     * @param {Object} linkingSystem - Reference to NodeLinkingSystem (optional)
     */
    constructor(linkingSystem = null) {
        // System references
        this.linkingSystem = linkingSystem;
        
        // Core event counters
        this.stats = {
            linksCreated: 0,
            linksAccepted: 0,
            linksRejected: 0,
            linksDecayed: 0,
            totalEvaluations: 0,
            
            qualityCounts: {
                poor: 0,
                medium: 0,
                strong: 0,
                excellent: 0
            },
            
            successRates: {
                poor: { accepted: 0, total: 0 },
                medium: { accepted: 0, total: 0 },
                strong: { accepted: 0, total: 0 },
                excellent: { accepted: 0, total: 0 }
            },
            
            synergyAverages: {
                created: 0,
                accepted: 0,
                rejected: 0
            },
            
            mlPredictionAccuracy: 0,
            mlTotalPredictions: 0
        };
        
        // Sliding window history (last 20 evaluations)
        this.MAX_HISTORY = 20;
        this.evaluationHistory = [];
        this.nextHistoryIndex = 0;
        
        for (let i = 0; i < this.MAX_HISTORY; i++) {
            this.evaluationHistory[i] = null;
        }
        
        // Decay feedback tracking (10-second smoothing window)
        this.decayFeedback = {
            highQualityDecayRate: 0.5,
            mediumQualityDecayRate: 1.0,
            lowQualityDecayRate: 2.0,
            decayModifiers: new Map(),
            decayWindowMs: 10000,
            decayWindowStartTime: Date.now(),
            decayWindowAcceptances: 0,
            decayWindowRejections: 0
        };
        
        // ML engine integration state
        this.mlIntegration = {
            learningRate: 0.03,
            totalWeightUpdates: 0,
            cumulativeDelta: 0,
            recentAccuracy: 0,
            mlConfidence: {
                poor: 0.5,
                medium: 0.7,
                strong: 0.85,
                excellent: 0.95
            }
        };
        
        // Automation integration state
        this.automationIntegration = {
            automationResultsTracked: 0,
            automationAcceptanceRate: 0,
            lastAutomationResult: null,
            automationQualityThreshold: 65
        };
        
        // Performance & diagnostics
        this.diagnostics = {
            lastEvaluationTime: 0,
            peakEvaluationTime: 0,
            totalEvaluationTime: 0,
            evaluationsPerSecond: 0,
            lastUpdateTime: Date.now()
        };
        
        // Initialize console API
        this._initConsoleAPI();
    }
    
    /**
     * Evaluate a link's quality based on synergy & ML prediction
     * @param {Object} sourceNode - Source node object
     * @param {Object} targetNode - Target node object
     * @param {number} synergyScore - Synergy score (0-100)
     * @param {number} mlPredictionScore - ML predicted quality (0-100)
     * @returns {Object} Quality evaluation result
     */
    evaluateLinkQuality(sourceNode, targetNode, synergyScore = 50, mlPredictionScore = 50) {
        try {
            const startTime = performance.now();
            
            const sourceId = sourceNode?.id ?? sourceNode?.uuid ?? 'unknown';
            const targetId = targetNode?.id ?? targetNode?.uuid ?? 'unknown';
            const linkId = `${sourceId}→${targetId}`;
            
            const normalizedSynergy = Math.max(0, Math.min(100, synergyScore ?? 50));
            const normalizedMLScore = Math.max(0, Math.min(100, mlPredictionScore ?? 50));
            
            // Weighted fusion: 60% synergy (ground truth), 40% ML (predictive)
            const synergyWeight = 0.6;
            const mlWeight = 0.4;
            
            const finalQuality = (normalizedSynergy * synergyWeight) + 
                                (normalizedMLScore * mlWeight);
            
            // Categorize quality
            let category = 'medium';
            if (finalQuality < 25) {
                category = 'poor';
            } else if (finalQuality < 60) {
                category = 'medium';
            } else if (finalQuality < 85) {
                category = 'strong';
            } else {
                category = 'excellent';
            }
            
            // Build evaluation result
            const evaluation = {
                timestamp: Date.now(),
                linkId: linkId,
                sourceId: sourceId,
                targetId: targetId,
                synergyScore: normalizedSynergy,
                mlPredictionScore: normalizedMLScore,
                finalQuality: finalQuality,
                category: category,
                isPoor: category === 'poor',
                isMedium: category === 'medium',
                isStrong: category === 'strong',
                isExcellent: category === 'excellent',
                accepted: false,
                rejectionReason: null
            };
            
            // Store in history
            this.evaluationHistory[this.nextHistoryIndex] = evaluation;
            this.nextHistoryIndex = (this.nextHistoryIndex + 1) % this.MAX_HISTORY;
            
            // Update statistics
            this.stats.totalEvaluations++;
            this.stats.qualityCounts[category]++;
            
            // Track synergy averages
            const prevCreatedAvg = this.stats.synergyAverages.created;
            this.stats.synergyAverages.created = 
                (prevCreatedAvg * (this.stats.linksCreated - 1) + normalizedSynergy) / 
                this.stats.linksCreated;
            
            // Track ML prediction accuracy
            const predictionError = Math.abs(normalizedMLScore - finalQuality);
            const prevAccuracy = this.mlIntegration.recentAccuracy;
            this.mlIntegration.recentAccuracy = 
                (prevAccuracy * 0.8) + (predictionError * 0.2);
            
            // Performance tracking
            const evalTime = performance.now() - startTime;
            this.diagnostics.lastEvaluationTime = evalTime;
            this.diagnostics.totalEvaluationTime += evalTime;
            if (evalTime > this.diagnostics.peakEvaluationTime) {
                this.diagnostics.peakEvaluationTime = evalTime;
            }
            
            if (evalTime > 0.2) {
                console.warn(`[LinkQualityFeedbackLoop] Slow evaluation: ${evalTime.toFixed(3)}ms`);
            }
            
            return evaluation;
            
        } catch (error) {
            console.error('[LinkQualityFeedbackLoop] evaluateLinkQuality error:', error);
            return {
                timestamp: Date.now(),
                finalQuality: 50,
                category: 'medium',
                error: true
            };
        }
    }
    
    /**
     * Track link creation event
     * @param {Object} link - Link object
     */
    onLinkCreated(link) {
        try {
            if (!link) return;
            
            this.stats.linksCreated++;
            
            if (link.sourceNode && link.targetNode) {
                const synergyScore = link.synergyScore ?? 50;
                const mlScore = link.mlPredictionScore ?? 50;
                
                this.evaluateLinkQuality(
                    link.sourceNode,
                    link.targetNode,
                    synergyScore,
                    mlScore
                );
            }
        } catch (error) {
            console.error('[LinkQualityFeedbackLoop] onLinkCreated error:', error);
        }
    }
    
    /**
     * Track link removal event
     * @param {Object} link - Link object
     */
    onLinkRemoved(link) {
        try {
            if (!link) return;
            
            const isDecayRemoval = link.reason === 'decay' || link.priority < 1;
            if (isDecayRemoval) {
                this.stats.linksDecayed++;
            }
            
            const linkId = link.id ?? link.uuid ?? '';
            if (linkId) {
                this.decayFeedback.decayModifiers.delete(linkId);
            }
        } catch (error) {
            console.error('[LinkQualityFeedbackLoop] onLinkRemoved error:', error);
        }
    }
    
    /**
     * Track link acceptance by user or system
     * @param {Object} link - Link object
     * @param {Object} context - Additional context
     */
    registerLinkAccepted(link, context = {}) {
        try {
            if (!link) return;
            
            this.stats.linksAccepted++;
            this.decayFeedback.decayWindowAcceptances++;
            
            this._updateEvaluationStatus(link, true, null);
            
            const category = this._getCategoryForLink(link);
            if (category && this.stats.successRates[category]) {
                this.stats.successRates[category].accepted++;
                this.stats.successRates[category].total++;
            }
            
            this._updateDecayModifier(link, 0.5);
            
        } catch (error) {
            console.error('[LinkQualityFeedbackLoop] registerLinkAccepted error:', error);
        }
    }
    
    /**
     * Track link rejection by user or system
     * @param {Object} link - Link object
     * @param {string} reason - Rejection reason
     */
    registerLinkRejected(link, reason = 'user') {
        try {
            if (!link) return;
            
            this.stats.linksRejected++;
            this.decayFeedback.decayWindowRejections++;
            
            this._updateEvaluationStatus(link, false, reason);
            
            const category = this._getCategoryForLink(link);
            if (category && this.stats.successRates[category]) {
                this.stats.successRates[category].total++;
            }
            
            this._updateDecayModifier(link, 2.0);
            
        } catch (error) {
            console.error('[LinkQualityFeedbackLoop] registerLinkRejected error:', error);
        }
    }
    
    /**
     * Get decay rate modifier for a specific link
     * @param {string} linkId - Link identifier
     * @returns {number} Decay multiplier (0.5 = slow, 1.0 = normal, 2.0 = fast)
     */
    getDecayBoost(linkId) {
        try {
            if (!linkId) return 1.0;
            
            this._checkDecayWindowExpiry();
            
            const stored = this.decayFeedback.decayModifiers.get(linkId);
            if (stored !== undefined) {
                return stored;
            }
            
            return this.decayFeedback.mediumQualityDecayRate;
            
        } catch (error) {
            console.error('[LinkQualityFeedbackLoop] getDecayBoost error:', error);
            return 1.0;
        }
    }
    
    /**
     * Check if link quality warrants SLOWING decay
     * @param {string} linkId - Link identifier
     * @returns {boolean} True if decay should slow
     */
    shouldSlowDecay(linkId) {
        try {
            const boost = this.getDecayBoost(linkId);
            return boost < 1.0;
        } catch (error) {
            console.error('[LinkQualityFeedbackLoop] shouldSlowDecay error:', error);
            return false;
        }
    }
    
    /**
     * Check if link quality warrants ACCELERATING decay
     * @param {string} linkId - Link identifier
     * @returns {boolean} True if decay should accelerate
     */
    shouldAccelerateDecay(linkId) {
        try {
            const boost = this.getDecayBoost(linkId);
            return boost > 1.0;
        } catch (error) {
            console.error('[LinkQualityFeedbackLoop] shouldAccelerateDecay error:', error);
            return false;
        }
    }
    
    /**
     * Adjust ML recommendation engine weights based on feedback
     * @param {Object} result - Feedback result
     * @returns {Object} Weight adjustment metadata
     */
    adjustMLWeights(result = {}) {
        try {
            if (!result || typeof result !== 'object') {
                return { weightDelta: 0, learningRate: this.mlIntegration.learningRate };
            }
            
            const predictedScore = result.predictedScore ?? 50;
            const actualQuality = result.actualQuality ?? 50;
            
            const weightDelta = (actualQuality - predictedScore) * this.mlIntegration.learningRate;
            
            this.mlIntegration.totalWeightUpdates++;
            this.mlIntegration.cumulativeDelta += weightDelta;
            
            const category = this._getQualityCategory(actualQuality);
            if (this.mlIntegration.mlConfidence[category] !== undefined) {
                const predictionError = Math.abs(predictedScore - actualQuality);
                const confidence = Math.max(0, Math.min(1, 1 - (predictionError / 100)));
                this.mlIntegration.mlConfidence[category] = 
                    (this.mlIntegration.mlConfidence[category] * 0.9) + (confidence * 0.1);
            }
            
            return {
                weightDelta: weightDelta,
                learningRate: this.mlIntegration.learningRate,
                totalUpdates: this.mlIntegration.totalWeightUpdates,
                cumulativeDelta: this.mlIntegration.cumulativeDelta
            };
            
        } catch (error) {
            console.error('[LinkQualityFeedbackLoop] adjustMLWeights error:', error);
            return { weightDelta: 0, learningRate: this.mlIntegration.learningRate };
        }
    }
    
    /**
     * Register automation result and update acceptance rate
     * @param {Object} result - Automation result
     */
    registerAutomationResult(result = {}) {
        try {
            if (!result || typeof result !== 'object') {
                return;
            }
            
            this.automationIntegration.automationResultsTracked++;
            this.automationIntegration.lastAutomationResult = result;
            
            const wasAccepted = result.accepted ? 1 : 0;
            const prevRate = this.automationIntegration.automationAcceptanceRate;
            this.automationIntegration.automationAcceptanceRate = 
                (prevRate * 0.95) + (wasAccepted * 0.05);
            
            if (result.finalQuality !== undefined && result.mlScore !== undefined) {
                this.adjustMLWeights({
                    predictedScore: result.mlScore,
                    actualQuality: result.finalQuality,
                    synergyScore: result.synergyScore ?? 50,
                    accepted: result.accepted
                });
            }
            
        } catch (error) {
            console.error('[LinkQualityFeedbackLoop] registerAutomationResult error:', error);
        }
    }
    
    /**
     * Get recent trend of evaluations
     * @returns {Array} Last N evaluations (max 20)
     */
    getRecentTrend() {
        try {
            return this.evaluationHistory.filter(e => e !== null) || [];
        } catch (error) {
            console.error('[LinkQualityFeedbackLoop] getRecentTrend error:', error);
            return [];
        }
    }
    
    /**
     * Get success rates by quality category
     * @returns {Object} Success rates per category
     */
    getCategorySuccessRates() {
        try {
            const rates = {};
            
            Object.keys(this.stats.successRates).forEach(category => {
                const data = this.stats.successRates[category];
                const total = data.total || 1;
                rates[category] = {
                    acceptedCount: data.accepted,
                    totalCount: data.total,
                    successRate: (data.accepted / total * 100).toFixed(1) + '%'
                };
            });
            
            return rates;
        } catch (error) {
            console.error('[LinkQualityFeedbackLoop] getCategorySuccessRates error:', error);
            return {};
        }
    }
    
    /**
     * Get comprehensive quality summary
     * @returns {Object} Summary of all metrics
     */
    getQualitySummary() {
        try {
            const trend = this.getRecentTrend();
            const avgQuality = trend.length > 0 
                ? (trend.reduce((sum, e) => sum + (e.finalQuality ?? 50), 0) / trend.length).toFixed(1)
                : 'N/A';
            
            return {
                totalEvaluations: this.stats.totalEvaluations,
                linksCreated: this.stats.linksCreated,
                linksAccepted: this.stats.linksAccepted,
                linksRejected: this.stats.linksRejected,
                linksDecayed: this.stats.linksDecayed,
                categoryBreakdown: this.stats.qualityCounts,
                successRates: this.getCategorySuccessRates(),
                averageQuality: avgQuality,
                recentTrendLength: trend.length,
                mlAccuracy: this.mlIntegration.recentAccuracy.toFixed(2),
                automationAcceptanceRate: (this.automationIntegration.automationAcceptanceRate * 100).toFixed(1) + '%',
                performanceMetrics: {
                    lastEvaluationMs: this.diagnostics.lastEvaluationTime.toFixed(3),
                    peakEvaluationMs: this.diagnostics.peakEvaluationTime.toFixed(3),
                    avgEvaluationMs: (this.diagnostics.totalEvaluationTime / Math.max(1, this.stats.totalEvaluations)).toFixed(3)
                }
            };
        } catch (error) {
            console.error('[LinkQualityFeedbackLoop] getQualitySummary error:', error);
            return {};
        }
    }
    
    // ========================================================================
    // INTERNAL HELPERS
    // ========================================================================
    
    _updateEvaluationStatus(link, accepted, rejectionReason) {
        try {
            const linkId = link?.id ?? link?.uuid ?? '';
            if (!linkId) return;
            
            for (let i = 0; i < this.evaluationHistory.length; i++) {
                const entry = this.evaluationHistory[i];
                if (entry && entry.linkId === linkId) {
                    entry.accepted = accepted;
                    if (rejectionReason) {
                        entry.rejectionReason = rejectionReason;
                    }
                    break;
                }
            }
        } catch (error) {
            console.error('[LinkQualityFeedbackLoop] _updateEvaluationStatus error:', error);
        }
    }
    
    _getCategoryForLink(link) {
        try {
            const linkId = link?.id ?? link?.uuid ?? '';
            if (!linkId) return null;
            
            for (let i = 0; i < this.evaluationHistory.length; i++) {
                const entry = this.evaluationHistory[i];
                if (entry && entry.linkId === linkId) {
                    return entry.category;
                }
            }
            
            return null;
        } catch (error) {
            console.error('[LinkQualityFeedbackLoop] _getCategoryForLink error:', error);
            return null;
        }
    }
    
    _getQualityCategory(quality) {
        if (quality < 25) return 'poor';
        if (quality < 60) return 'medium';
        if (quality < 85) return 'strong';
        return 'excellent';
    }
    
    _updateDecayModifier(link, modifier) {
        try {
            const linkId = link?.id ?? link?.uuid ?? '';
            if (!linkId) return;
            
            const clampedModifier = Math.max(0.1, Math.min(5.0, modifier));
            this.decayFeedback.decayModifiers.set(linkId, clampedModifier);
        } catch (error) {
            console.error('[LinkQualityFeedbackLoop] _updateDecayModifier error:', error);
        }
    }
    
    _checkDecayWindowExpiry() {
        try {
            const now = Date.now();
            const elapsed = now - this.decayFeedback.decayWindowStartTime;
            
            if (elapsed > this.decayFeedback.decayWindowMs) {
                this.decayFeedback.decayWindowStartTime = now;
                this.decayFeedback.decayWindowAcceptances = 0;
                this.decayFeedback.decayWindowRejections = 0;
            }
        } catch (error) {
            console.error('[LinkQualityFeedbackLoop] _checkDecayWindowExpiry error:', error);
        }
    }
    
    _initConsoleAPI() {
        try {
            if (!window.linkQuality) {
                window.linkQuality = {};
            }
            
            const self = this;
            
            window.linkQuality.debug = function () {
                console.group('🔍 LinkQualityFeedbackLoop1_0 Debug');
                console.log('Stats:', self.stats);
                console.log('ML Integration:', self.mlIntegration);
                console.log('Automation Integration:', self.automationIntegration);
                console.log('Diagnostics:', self.diagnostics);
                console.log('Decay Feedback:', {
                    highQualityDecayRate: self.decayFeedback.highQualityDecayRate,
                    mediumQualityDecayRate: self.decayFeedback.mediumQualityDecayRate,
                    lowQualityDecayRate: self.decayFeedback.lowQualityDecayRate,
                    decayModifiersCount: self.decayFeedback.decayModifiers.size,
                    decayWindowAcceptances: self.decayFeedback.decayWindowAcceptances,
                    decayWindowRejections: self.decayFeedback.decayWindowRejections
                });
                console.groupEnd();
            };
            
            window.linkQuality.last = function (n = 5) {
                const trend = self.getRecentTrend();
                const last = trend.slice(Math.max(0, trend.length - n));
                console.group(`📊 Last ${n} Link Evaluations`);
                last.forEach((entry, idx) => {
                    console.log(`${idx + 1}. ${entry.linkId}: ${entry.finalQuality.toFixed(1)} (${entry.category})`);
                });
                console.groupEnd();
            };
            
            window.linkQuality.trends = function () {
                const trend = self.getRecentTrend();
                if (trend.length === 0) {
                    console.log('⚠ No evaluation history');
                    return;
                }
                
                console.group('📈 Link Quality Trends');
                const qualities = trend.map(e => e.finalQuality);
                const avg = qualities.reduce((a, b) => a + b, 0) / qualities.length;
                const min = Math.min(...qualities);
                const max = Math.max(...qualities);
                
                console.log(`Average Quality: ${avg.toFixed(1)}`);
                console.log(`Min Quality: ${min.toFixed(1)}`);
                console.log(`Max Quality: ${max.toFixed(1)}`);
                console.log(`Samples: ${qualities.length}`);
                console.groupEnd();
            };
            
            window.linkQuality.summary = function () {
                const summary = self.getQualitySummary();
                console.group('📋 LinkQualityFeedbackLoop Summary');
                Object.entries(summary).forEach(([key, value]) => {
                    if (typeof value === 'object') {
                        console.log(key + ':', JSON.stringify(value, null, 2));
                    } else {
                        console.log(key + ':', value);
                    }
                });
                console.groupEnd();
            };
            
            window.linkQuality.reset = function () {
                self.stats.linksCreated = 0;
                self.stats.linksAccepted = 0;
                self.stats.linksRejected = 0;
                self.stats.linksDecayed = 0;
                self.stats.totalEvaluations = 0;
                
                Object.keys(self.stats.qualityCounts).forEach(k => {
                    self.stats.qualityCounts[k] = 0;
                });
                
                self.evaluationHistory.fill(null);
                self.nextHistoryIndex = 0;
                
                console.log('✅ LinkQualityFeedbackLoop reset complete');
            };
            
            console.log('✓ LinkQualityFeedbackLoop1_0 initialized');
            console.log('  Commands: debug() | last(n) | trends() | summary() | reset()');
            
        } catch (error) {
            console.error('[LinkQualityFeedbackLoop] _initConsoleAPI error:', error);
        }
    }
}
