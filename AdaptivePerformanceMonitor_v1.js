/**
 * ============================================================================
 * ADAPTIVE PERFORMANCE MONITOR v1.1
 * ============================================================================
 *
 * Browser-grade runtime discipline for ATOMA.
 *
 * PURPOSE:
 *   Move beyond a binary FPS -> LowFX switch and enforce soft runtime budgets:
 *   - frame budget
 *   - scene render budget
 *   - post-processing budget
 *   - draw-call budget
 *   - entity/link budget
 *   - active VFX budget
 *
 * DESIGN:
 *   - keeps the legacy AUTO / MANUAL_LOCKED model
 *   - supports explicit adaptive tiers: FULL / BALANCED / PERFORMANCE / SAFE
 *   - degrades quickly under pressure, recovers slowly and one step at a time
 *   - delegates the actual visual response through tierCallback when provided
 *   - remains backward-compatible with legacy LowFX-only behavior
 *
 * NOTE:
 *   This class does not own gameplay authority. It only recommends / applies
 *   presentation-tier changes through provided callbacks.
 *
 * ============================================================================
 */

const TIER_RANK = Object.freeze({
    FULL: 0,
    BALANCED: 1,
    PERFORMANCE: 2,
    SAFE: 3
});

const DEFAULT_BUDGETS = Object.freeze({
    frameMsSoft: 17.5,
    frameMsHard: 28.0,
    baseSceneMsSoft: 9.5,
    baseSceneMsHard: 13.0,
    postFXMsSoft: 4.5,
    postFXMsHard: 8.0,
    drawCallsSoft: 150,
    drawCallsHard: 260,
    trianglesSoft: 1_800_000,
    trianglesHard: 3_000_000,
    linksSoft: 36,
    linksHard: 64,
    nodesSoft: 180,
    nodesHard: 260,
    activeVfxSoft: 1400,
    activeVfxHard: 2400,
    programsHard: 110,
    geometriesHard: 3500,
    texturesHard: 800
});

function clamp01(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(1, value));
}

function normalizeTier(tier) {
    const value = typeof tier === 'string' ? tier.toUpperCase() : 'FULL';
    return TIER_RANK[value] !== undefined ? value : 'FULL';
}

function metricPressure(value, soft, hard) {
    if (!Number.isFinite(value) || !Number.isFinite(soft) || !Number.isFinite(hard) || hard <= soft) {
        return 0;
    }
    if (value <= soft) return 0;
    if (value >= hard) return 1;
    return clamp01((value - soft) / (hard - soft));
}

export class AdaptivePerformanceMonitor_v1 {
    /**
     * @param {FXPerformanceController_v1} fxPerformance
     * @param {Object} options
     */
    constructor(fxPerformance, options = {}) {
        this.fxPerformance = fxPerformance;

        this.targetFPS = options.targetFPS ?? 60;
        this.hysteresisFPS = options.hysteresisFPS ?? 5;
        this.lowFXDelaySec = options.lowFXDelaySec ?? 3.0;
        this.highFXDelaySec = options.highFXDelaySec ?? 5.0;
        this.emaAlpha = options.emaAlpha ?? 0.1;

        this.snapshotProvider = typeof options.snapshotProvider === 'function'
            ? options.snapshotProvider
            : null;
        this.tierCallback = typeof options.tierCallback === 'function'
            ? options.tierCallback
            : null;
        this.transitionCallback = typeof options.transitionCallback === 'function'
            ? options.transitionCallback
            : null;
        this.frameScheduler = options.frameScheduler ?? null;

        this.budgetDisciplineEnabled = options.budgetDisciplineEnabled !== false;
        this.budgets = {
            ...DEFAULT_BUDGETS,
            ...(options.budgets || {})
        };

        this.tierDelays = {
            BALANCED: options.balancedDelaySec ?? 1.25,
            PERFORMANCE: options.performanceDelaySec ?? 0.85,
            SAFE: options.safeDelaySec ?? 0.45,
            FULL: options.recoveryDelaySec ?? Math.max(this.highFXDelaySec, 4.5)
        };

        this.fpsEMA = this.targetFPS;
        this.frameMsEMA = 1000 / Math.max(1, this.targetFPS);
        this.timeBelow = 0;
        this.timeAbove = 0;
        this.mode = 'AUTO';
        this.lastDecision = null;
        this.enabled = true;

        this.currentTier = 'FULL';
        this.pendingTier = 'FULL';
        this.pendingTierTime = 0;
        this.recommendedTier = 'FULL';
        this.lastSnapshot = null;
        this.lastAssessment = null;
        this.lastAppliedLowFX = this.fxPerformance?.isLowFX?.() ?? false;
    }

    update(deltaTime) {
        if (!this.enabled || !this.fxPerformance || !Number.isFinite(deltaTime) || deltaTime <= 0) {
            return;
        }
        if (this.frameScheduler?.shouldRunSimulation && !this.frameScheduler.shouldRunSimulation()) {
            return;
        }

        const fpsInstant = 1 / deltaTime;
        const frameMsInstant = deltaTime * 1000;
        this.fpsEMA = this.fpsEMA * (1 - this.emaAlpha) + fpsInstant * this.emaAlpha;
        this.frameMsEMA = this.frameMsEMA * (1 - this.emaAlpha) + frameMsInstant * this.emaAlpha;

        const snapshot = this._sampleSnapshot();
        const assessment = this._assessTier(snapshot);
        this.lastSnapshot = assessment.snapshot;
        this.lastAssessment = assessment;
        this.recommendedTier = assessment.tier;

        if (this.mode === 'MANUAL_LOCKED') {
            this.timeBelow = 0;
            this.timeAbove = 0;
            this.pendingTier = this.currentTier;
            this.pendingTierTime = 0;
            return;
        }

        if (this.tierCallback || this.budgetDisciplineEnabled) {
            this._advanceTierDecision(assessment.tier, deltaTime, assessment);
            return;
        }

        this._runLegacyLowFxFallback(deltaTime);
    }

    _runLegacyLowFxFallback(deltaTime) {
        const lowThreshold = this.targetFPS - this.hysteresisFPS;
        const highThreshold = this.targetFPS + this.hysteresisFPS;

        if (this.fpsEMA < lowThreshold) {
            this.timeBelow += deltaTime;
            this.timeAbove = 0;
        } else if (this.fpsEMA > highThreshold) {
            this.timeAbove += deltaTime;
            this.timeBelow = 0;
        } else {
            this.timeAbove = 0;
            this.timeBelow = 0;
        }

        if (this.timeBelow >= this.lowFXDelaySec && !this.fxPerformance.isLowFX()) {
            this.fxPerformance.setLowFX(true);
            this.lastDecision = 'AUTO_LOWFX_ON';
            this.timeBelow = 0;
            this.lastAppliedLowFX = true;
            this.currentTier = 'PERFORMANCE';
            this.transitionCallback?.(true);
        }

        if (this.timeAbove >= this.highFXDelaySec && this.fxPerformance.isLowFX()) {
            this.fxPerformance.setLowFX(false);
            this.lastDecision = 'AUTO_LOWFX_OFF';
            this.timeAbove = 0;
            this.lastAppliedLowFX = false;
            this.currentTier = 'FULL';
            this.transitionCallback?.(false);
        }
    }

    _sampleSnapshot() {
        const external = this.snapshotProvider ? (this.snapshotProvider() || {}) : {};
        const render = external.render || {};

        return {
            fpsEMA: this.fpsEMA,
            frameMsEMA: this.frameMsEMA,
            drawCalls: Number.isFinite(external.drawCalls) ? external.drawCalls : 0,
            triangles: Number.isFinite(external.triangles) ? external.triangles : 0,
            programs: Number.isFinite(external.programs) ? external.programs : 0,
            geometries: Number.isFinite(external.geometries) ? external.geometries : 0,
            textures: Number.isFinite(external.textures) ? external.textures : 0,
            nodes: Number.isFinite(external.nodes) ? external.nodes : 0,
            links: Number.isFinite(external.links) ? external.links : 0,
            activeVfx: Number.isFinite(external.activeVfx) ? external.activeVfx : 0,
            visualQualityLevel: external.visualQualityLevel || 'HIGH',
            adaptiveTier: external.adaptiveTier || this.currentTier,
            baseSceneMs: Number.isFinite(external.baseSceneMs)
                ? external.baseSceneMs
                : (render.baseSceneRender?.avg ?? 0),
            postFXMs: Number.isFinite(external.postFXMs)
                ? external.postFXMs
                : (render.postProcessing?.avg ?? 0),
            finalRenderMs: Number.isFinite(external.finalRenderMs)
                ? external.finalRenderMs
                : (render.finalRender?.avg ?? 0),
            context: external.context || null
        };
    }

    _assessTier(snapshot) {
        const budgets = this.budgets;
        const constraints = [
            {
                id: 'frameMs',
                label: 'frame budget',
                value: snapshot.frameMsEMA,
                pressure: metricPressure(snapshot.frameMsEMA, budgets.frameMsSoft, budgets.frameMsHard),
                weight: 0.34
            },
            {
                id: 'baseSceneMs',
                label: 'scene budget',
                value: snapshot.baseSceneMs,
                pressure: metricPressure(snapshot.baseSceneMs, budgets.baseSceneMsSoft, budgets.baseSceneMsHard),
                weight: 0.18
            },
            {
                id: 'postFXMs',
                label: 'post FX budget',
                value: snapshot.postFXMs,
                pressure: metricPressure(snapshot.postFXMs, budgets.postFXMsSoft, budgets.postFXMsHard),
                weight: 0.08
            },
            {
                id: 'drawCalls',
                label: 'draw-call budget',
                value: snapshot.drawCalls,
                pressure: metricPressure(snapshot.drawCalls, budgets.drawCallsSoft, budgets.drawCallsHard),
                weight: 0.18
            },
            {
                id: 'triangles',
                label: 'triangle budget',
                value: snapshot.triangles,
                pressure: metricPressure(snapshot.triangles, budgets.trianglesSoft, budgets.trianglesHard),
                weight: 0.08
            },
            {
                id: 'links',
                label: 'link budget',
                value: snapshot.links,
                pressure: metricPressure(snapshot.links, budgets.linksSoft, budgets.linksHard),
                weight: 0.05
            },
            {
                id: 'nodes',
                label: 'node budget',
                value: snapshot.nodes,
                pressure: metricPressure(snapshot.nodes, budgets.nodesSoft, budgets.nodesHard),
                weight: 0.03
            },
            {
                id: 'activeVfx',
                label: 'VFX budget',
                value: snapshot.activeVfx,
                pressure: metricPressure(snapshot.activeVfx, budgets.activeVfxSoft, budgets.activeVfxHard),
                weight: 0.06
            }
        ];

        const weightedPressure = constraints.reduce((sum, entry) => sum + entry.pressure * entry.weight, 0);
        const primaryConstraint = constraints
            .slice()
            .sort((a, b) => b.pressure - a.pressure)[0] || null;

        let tier = 'FULL';
        if (
            snapshot.frameMsEMA >= budgets.frameMsHard ||
            snapshot.drawCalls >= Math.round(budgets.drawCallsHard * 1.2) ||
            snapshot.activeVfx >= Math.round(budgets.activeVfxHard * 1.25) ||
            snapshot.postFXMs >= budgets.postFXMsHard ||
            snapshot.programs >= budgets.programsHard ||
            snapshot.geometries >= budgets.geometriesHard ||
            snapshot.textures >= budgets.texturesHard ||
            this.fpsEMA <= 42
        ) {
            tier = 'SAFE';
        } else if (
            weightedPressure >= 0.62 ||
            snapshot.drawCalls >= budgets.drawCallsHard ||
            snapshot.activeVfx >= budgets.activeVfxHard ||
            snapshot.baseSceneMs >= budgets.baseSceneMsHard ||
            this.fpsEMA <= 49
        ) {
            tier = 'PERFORMANCE';
        } else if (
            weightedPressure >= 0.24 ||
            snapshot.drawCalls >= budgets.drawCallsSoft ||
            snapshot.activeVfx >= budgets.activeVfxSoft ||
            snapshot.baseSceneMs >= budgets.baseSceneMsSoft ||
            snapshot.postFXMs >= budgets.postFXMsSoft ||
            this.fpsEMA <= 57
        ) {
            tier = 'BALANCED';
        }

        return {
            tier,
            pressureScore: Number(weightedPressure.toFixed(4)),
            primaryConstraint,
            constraints,
            snapshot
        };
    }

    _advanceTierDecision(desiredTier, deltaTime, assessment) {
        const normalizedDesired = normalizeTier(desiredTier);
        const currentRank = TIER_RANK[this.currentTier] ?? 0;
        const desiredRank = TIER_RANK[normalizedDesired] ?? 0;

        let stagedDesired = normalizedDesired;
        if (desiredRank < currentRank - 1) {
            stagedDesired = Object.keys(TIER_RANK).find((key) => TIER_RANK[key] === currentRank - 1) || normalizedDesired;
        }

        if (stagedDesired !== this.pendingTier) {
            this.pendingTier = stagedDesired;
            this.pendingTierTime = 0;
            return;
        }

        this.pendingTierTime += deltaTime;
        const delay = this.tierDelays[stagedDesired] ?? 1.0;
        if (this.pendingTierTime < delay) {
            return;
        }

        if (stagedDesired === this.currentTier) {
            this.pendingTierTime = 0;
            return;
        }

        const previousTier = this.currentTier;
        this.currentTier = stagedDesired;
        this.pendingTierTime = 0;
        this.lastDecision = `AUTO_TIER_${stagedDesired}`;

        const nextLowFX = stagedDesired === 'PERFORMANCE' || stagedDesired === 'SAFE';
        const lowFxChanged = nextLowFX !== this.lastAppliedLowFX;

        if (this.tierCallback) {
            this.tierCallback(stagedDesired, assessment.snapshot, {
                previousTier,
                lowFxChanged,
                recommendedTier: this.recommendedTier,
                primaryConstraint: assessment.primaryConstraint,
                pressureScore: assessment.pressureScore
            });
        } else {
            this.fxPerformance.setLowFX(nextLowFX);
            if (lowFxChanged) {
                this.transitionCallback?.(nextLowFX);
            }
        }

        this.lastAppliedLowFX = nextLowFX;
    }

    notifyManualToggle(isLowFX) {
        this.mode = 'MANUAL_LOCKED';
        this.timeBelow = 0;
        this.timeAbove = 0;
        this.pendingTierTime = 0;
        this.pendingTier = this.currentTier;
        this.currentTier = isLowFX ? 'PERFORMANCE' : 'FULL';
        this.recommendedTier = this.currentTier;
        this.lastDecision = isLowFX ? 'MANUAL_LOWFX_ON' : 'MANUAL_LOWFX_OFF';
        this.lastAppliedLowFX = !!isLowFX;
    }

    resetToAuto() {
        this.mode = 'AUTO';
        this.timeBelow = 0;
        this.timeAbove = 0;
        this.pendingTier = this.currentTier;
        this.pendingTierTime = 0;
        this.lastDecision = null;
    }

    getState() {
        return {
            fpsEMA: this.fpsEMA,
            frameMsEMA: this.frameMsEMA,
            targetFPS: this.targetFPS,
            mode: this.mode,
            lastDecision: this.lastDecision,
            currentTier: this.currentTier,
            pendingTier: this.pendingTier,
            pendingTierTime: this.pendingTierTime,
            recommendedTier: this.recommendedTier,
            isLowFX: this.fxPerformance?.isLowFX?.() ?? false,
            enabled: this.enabled,
            budgets: { ...this.budgets },
            assessment: this.lastAssessment
                ? {
                    tier: this.lastAssessment.tier,
                    pressureScore: this.lastAssessment.pressureScore,
                    primaryConstraint: this.lastAssessment.primaryConstraint,
                    constraints: this.lastAssessment.constraints
                }
                : null,
            snapshot: this.lastSnapshot
        };
    }

    setEnabled(enable) {
        this.enabled = Boolean(enable);
    }
}
