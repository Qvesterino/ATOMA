/**
 * ============================================================================
 * LINK COLLAPSE EVENT FX v1.0
 * ============================================================================
 *
 * RESPONSIBILITY:
 * Transform link collapse into a dramatic, multi-phase game event
 * with strong visual and audio feedback. Each collapse phase triggers
 * distinct visual layers and audio cues.
 *
 * PHASES:
 *   Phase 1 — WARNING (stress 0.3–0.7):
 *     Visual: Link shimmer, instability particles, color shift to amber
 *     Audio:  Low tension drone, subtle dissonance
 *
 *   Phase 2 — CRITICAL (stress 0.7–1.0):
 *     Visual: Link fracture lines, aggressive pulsing, red glow
 *     Audio:  Rising tension, metallic scraping, heartbeat
 *
 *   Phase 3 — COLLAPSE (stress = 1.0):
 *     Visual: Explosive burst, energy discharge, shockwave ring
 *     Audio:  Deep impact, resonance decay, silence after
 *
 * INTEGRATION:
 *   const collapseFX = new LinkCollapseEventFX(linkCollapseSystem, audioSystem, config);
 *   collapseFX.attach();
 *
 * DESIGN:
 *   - All timing values are configurable and easily tunable
 *   - No hardcoded magic numbers — everything has named config keys
 *   - Graceful degradation: if audio or visual systems are missing, silently skip
 *   - Event-driven: listens to LinkCollapseSystem events, no per-frame polling
 */

import { eventRegistrationRegistry } from './Engine/EventRegistrationRegistry.js';

export class LinkCollapseEventFX {
    constructor(linkCollapseSystem, audioSystem, config = {}) {
        this.collapseSystem = linkCollapseSystem;
        this.audioSystem = audioSystem;
        this.enabled = true;

        // ── Configurable parameters ──────────────────────────────────────
        this.config = {
            // Phase 1: Warning visual
            warningShimmerIntensity: config.warningShimmerIntensity ?? 0.3,
            warningColorShift: config.warningColorShift ?? 0.15,       // amber blend amount
            warningParticleRate: config.warningParticleRate ?? 2,       // particles/sec

            // Phase 2: Critical visual
            criticalPulseSpeed: config.criticalPulseSpeed ?? 4.0,      // Hz
            criticalFractureOpacity: config.criticalFractureOpacity ?? 0.6,
            criticalGlowRadius: config.criticalGlowRadius ?? 1.8,      // multiplier
            criticalColor: config.criticalColor ?? '#ff2244',

            // Phase 3: Collapse visual
            collapseBurstDuration: config.collapseBurstDuration ?? 1.2, // seconds
            collapseShockwaveSpeed: config.collapseShockwaveSpeed ?? 3.0,// units/sec expansion
            collapseShockwaveMaxRadius: config.collapseShockwaveMaxRadius ?? 8.0,
            collapseParticleBurst: config.collapseParticleBurst ?? 40,   // particle count
            collapseFlashDuration: config.collapseFlashDuration ?? 0.3,  // screen flash seconds
            collapseColor: config.collapseColor ?? '#ff4400',

            // Audio config
            audioEnabled: config.audioEnabled ?? true,

            // Debug
            debugMode: config.debugMode ?? false,
        };

        // ── Active effect tracking ──────────────────────────────────────
        this._activeWarningEffects = new Map();   // linkId → effect state
        this._activeCriticalEffects = new Map();  // linkId → effect state
        this._activeCollapseEffects = new Map();  // linkId → effect state
        this._shockwaveRings = [];                // active shockwave rings

        // ── Event handler references (for cleanup) ──────────────────────
        this._boundHandlers = {
            warning: null,
            critical: null,
            collapse: null,
            recovery: null,
        };

        // ── Semantic bus integration ────────────────────────────────────
        this.semanticBus = config.semanticBus ?? null;
        this._eventBus = null;
        this._eventDisposers = [];
    }

    setEventBus(bus) {
        if (!bus || this._eventBus) return;
        this._eventBus = bus;
        this.semanticBus = bus;

        const register = (tag, handler) => {
            const disposer = eventRegistrationRegistry.register(
                'LinkCollapseEventFX', tag, handler, bus
            );
            this._eventDisposers.push(disposer);
        };

        // Canonical tiered events → early visual warning
        register('link.corruption.high', (payload) => {
            const link = payload?.link;
            if (link) this._onWarning(link, { stressAccumulation: 0.4, collapseStage: 'warning' });
        });
    }

    /**
     * Attach to LinkCollapseSystem events.
     */
    attach() {
        if (!this.collapseSystem) return this;

        this._boundHandlers.warning = (link, state) => this._onWarning(link, state);
        this._boundHandlers.critical = (link, state) => this._onCritical(link, state);
        this._boundHandlers.collapse = (link, state) => this._onCollapse(link, state);
        this._boundHandlers.recovery = (link, state) => this._onRecovery(link, state);

        this.collapseSystem.on('warning', this._boundHandlers.warning);
        this.collapseSystem.on('critical', this._boundHandlers.critical);
        this.collapseSystem.on('collapse', this._boundHandlers.collapse);
        this.collapseSystem.on('recovery', this._boundHandlers.recovery);

        this._debugLog('attached');
        return this;
    }

    /**
     * Detach from LinkCollapseSystem events.
     */
    detach() {
        if (!this.collapseSystem) return this;

        if (this._boundHandlers.warning) {
            this.collapseSystem.off('warning', this._boundHandlers.warning);
        }
        if (this._boundHandlers.critical) {
            this.collapseSystem.off('critical', this._boundHandlers.critical);
        }
        if (this._boundHandlers.collapse) {
            this.collapseSystem.off('collapse', this._boundHandlers.collapse);
        }
        if (this._boundHandlers.recovery) {
            this.collapseSystem.off('recovery', this._boundHandlers.recovery);
        }

        this._activeWarningEffects.clear();
        this._activeCriticalEffects.clear();
        this._activeCollapseEffects.clear();
        this._shockwaveRings = [];

        return this;
    }

    // ====================================================================
    // PHASE 1: WARNING — Link shimmer, instability, amber shift
    // ====================================================================

    _onWarning(link, state) {
        if (!this.enabled) return;
        const linkId = this._getLinkId(link);

        this._debugLog('warning phase', { linkId, stress: state?.stressAccumulation });

        // Track active warning effect
        this._activeWarningEffects.set(linkId, {
            linkId,
            startTime: performance.now(),
            intensity: this.config.warningShimmerIntensity,
            link,
            state,
        });

        // Audio: low tension drone
        if (this.config.audioEnabled && this.audioSystem?.playCollapseWarning) {
            this.audioSystem.playCollapseWarning(link, state);
        }

        // Visual: set link userData for renderer to pick up
        this._applyLinkVisualState(link, 'warning', {
            shimmerIntensity: this.config.warningShimmerIntensity,
            colorShift: this.config.warningColorShift,
            particleRate: this.config.warningParticleRate,
            phase: 'warning',
        });

        // Emit semantic event for other visual systems
        this._emitFXEvent('link.collapse.fx.warning', { link, linkId, state });
    }

    // ====================================================================
    // PHASE 2: CRITICAL — Fracture lines, aggressive pulse, red glow
    // ====================================================================

    _onCritical(link, state) {
        if (!this.enabled) return;
        const linkId = this._getLinkId(link);

        this._debugLog('critical phase', { linkId, stress: state?.stressAccumulation });

        // Promote from warning to critical
        this._activeWarningEffects.delete(linkId);

        // Track active critical effect
        this._activeCriticalEffects.set(linkId, {
            linkId,
            startTime: performance.now(),
            intensity: this.config.criticalFractureOpacity,
            link,
            state,
        });

        // Audio: rising tension + metallic scrape
        if (this.config.audioEnabled && this.audioSystem?.playCollapseCritical) {
            this.audioSystem.playCollapseCritical(link, state);
        }

        // Visual: set link userData for renderer
        this._applyLinkVisualState(link, 'critical', {
            pulseSpeed: this.config.criticalPulseSpeed,
            fractureOpacity: this.config.criticalFractureOpacity,
            glowRadius: this.config.criticalGlowRadius,
            color: this.config.criticalColor,
            phase: 'critical',
        });

        // Emit semantic event
        this._emitFXEvent('link.collapse.fx.critical', { link, linkId, state });
    }

    // ====================================================================
    // PHASE 3: COLLAPSE — Explosive burst, shockwave, energy discharge
    // ====================================================================

    _onCollapse(link, state) {
        if (!this.enabled) return;
        const linkId = this._getLinkId(link);

        this._debugLog('COLLAPSE', { linkId, stress: state?.stressAccumulation });

        // Clear previous phases
        this._activeWarningEffects.delete(linkId);
        this._activeCriticalEffects.delete(linkId);

        // Compute collapse position (midpoint between source and target)
        const position = this._getLinkMidpoint(link);

        // Track active collapse effect
        const collapseEffect = {
            linkId,
            startTime: performance.now(),
            position,
            link,
            state,
            burstPhase: 'flash',    // flash → burst → shockwave → decay
            burstElapsed: 0,
            burstDuration: this.config.collapseBurstDuration,
        };
        this._activeCollapseEffects.set(linkId, collapseEffect);

        // Spawn shockwave ring
        this._shockwaveRings.push({
            center: position,
            radius: 0,
            maxRadius: this.config.collapseShockwaveMaxRadius,
            speed: this.config.collapseShockwaveSpeed,
            opacity: 1.0,
            color: this.config.collapseColor,
            startTime: performance.now(),
        });

        // Audio: deep impact + resonance decay
        if (this.config.audioEnabled && this.audioSystem?.playLinkCollapse) {
            this.audioSystem.playLinkCollapse(link, state, position);
        }

        // Visual: set link userData for collapse burst
        this._applyLinkVisualState(link, 'collapse', {
            burstDuration: this.config.collapseBurstDuration,
            particleBurst: this.config.collapseParticleBurst,
            flashDuration: this.config.collapseFlashDuration,
            color: this.config.collapseColor,
            phase: 'collapse',
            position,
        });

        // Emit semantic event for global systems (screen shake, camera, etc.)
        this._emitFXEvent('link.collapse.fx.collapse', {
            link,
            linkId,
            state,
            position,
            intensity: 1.0,
        });
    }

    // ====================================================================
    // RECOVERY: Clean up effects when link recovers
    // ====================================================================

    _onRecovery(link, state) {
        if (!this.enabled) return;
        const linkId = this._getLinkId(link);

        this._debugLog('recovery', { linkId });

        this._activeWarningEffects.delete(linkId);
        this._activeCriticalEffects.delete(linkId);

        // Audio: gentle resolution
        if (this.config.audioEnabled && this.audioSystem?.playCollapseRecovery) {
            this.audioSystem.playCollapseRecovery(link, state);
        }

        // Clear visual state
        this._clearLinkVisualState(link);

        this._emitFXEvent('link.collapse.fx.recovery', { link, linkId, state });
    }

    // ====================================================================
    // UPDATE LOOP — animate shockwaves and burst effects
    // ====================================================================

    /**
     * Update active collapse effects. Called per simulation tick (10Hz).
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        if (!this.enabled) return;

        const now = performance.now();

        // Update shockwave rings
        for (let i = this._shockwaveRings.length - 1; i >= 0; i--) {
            const ring = this._shockwaveRings[i];
            const elapsed = (now - ring.startTime) / 1000;
            ring.radius = elapsed * ring.speed;
            ring.opacity = Math.max(0, 1.0 - (ring.radius / ring.maxRadius));

            if (ring.radius >= ring.maxRadius) {
                this._shockwaveRings.splice(i, 1);
            }
        }

        // Update active collapse effects (burst lifecycle)
        for (const [linkId, effect] of this._activeCollapseEffects) {
            effect.burstElapsed += dt;
            if (effect.burstElapsed >= effect.burstDuration) {
                this._activeCollapseEffects.delete(linkId);
            }
        }
    }

    // ====================================================================
    // PUBLIC API
    // ====================================================================

    /**
     * Get active shockwave rings (for renderer).
     * @returns {Array} Active shockwave ring objects
     */
    getShockwaveRings() {
        return this._shockwaveRings;
    }

    /**
     * Get active collapse effects (for renderer).
     * @returns {Map} linkId → collapse effect state
     */
    getActiveCollapseEffects() {
        return this._activeCollapseEffects;
    }

    /**
     * Get count of links in each phase.
     * @returns {Object} { warning, critical, collapsing }
     */
    getPhaseCounts() {
        return {
            warning: this._activeWarningEffects.size,
            critical: this._activeCriticalEffects.size,
            collapsing: this._activeCollapseEffects.size,
        };
    }

    /**
     * Enable/disable the FX system.
     */
    setEnabled(enabled) {
        this.enabled = !!enabled;
    }

    // ====================================================================
    // INTERNAL HELPERS
    // ====================================================================

    _getLinkId(link) {
        if (!link) return 'unknown';
        if (link.id) return String(link.id);
        if (!link.source || !link.target) return 'unknown';
        const id1 = link.source.userData?.nodeId ?? link.source.userData?.id ?? link.source.uuid ?? 'src';
        const id2 = link.target.userData?.nodeId ?? link.target.userData?.id ?? link.target.uuid ?? 'tgt';
        return `${id1}→${id2}`;
    }

    _getLinkMidpoint(link) {
        const srcPos = link.source?.position ?? link.sourceNode?.position ?? { x: 0, y: 0, z: 0 };
        const tgtPos = link.target?.position ?? link.targetNode?.position ?? { x: 0, y: 0, z: 0 };
        return {
            x: (srcPos.x + tgtPos.x) / 2,
            y: (srcPos.y + tgtPos.y) / 2,
            z: (srcPos.z + tgtPos.z) / 2,
        };
    }

    _applyLinkVisualState(link, phase, data) {
        if (!link?.userData) {
            if (link) link.userData = {};
            else return;
        }
        link.userData.collapseFX = {
            phase,
            ...data,
            timestamp: performance.now(),
        };
    }

    _clearLinkVisualState(link) {
        if (!link?.userData) return;
        delete link.userData.collapseFX;
    }

    _emitFXEvent(eventType, payload) {
        // Semantic bus
        try {
            const bus = this.semanticBus || (typeof globalThis !== 'undefined' ? globalThis.semanticBus : null);
            if (bus && typeof bus.emit === 'function') {
                bus.emit(eventType, {
                    ...payload,
                    source: 'LinkCollapseEventFX',
                    timestamp: Date.now(),
                }, { priority: bus.priority?.NORMAL });
            }
        } catch (_e) { /* silent */ }
    }

    _debugLog(message, details = null) {
        if (!this.config.debugMode) return;
        if (details) {
            console.log(`[LinkCollapseEventFX] ${message}`, details);
        } else {
            console.log(`[LinkCollapseEventFX] ${message}`);
        }
    }

    /**
     * Dispose and clean up.
     */
    dispose() {
        this.detach();
        eventRegistrationRegistry.disposeOwner('LinkCollapseEventFX');
        this._eventDisposers = [];
        this._eventBus = null;
        this._shockwaveRings = [];
        this.enabled = false;
    }
}

/**
 * Quick validation function.
 */
export function validateLinkCollapseEventFX() {
    console.log('✓ LinkCollapseEventFX v1.0 loaded');
    console.log('  - Phase 1 (Warning): shimmer + amber shift + tension drone');
    console.log('  - Phase 2 (Critical): fracture + red glow + metallic scrape');
    console.log('  - Phase 3 (Collapse): burst + shockwave + deep impact');
    console.log('  - Recovery: gentle resolution + cleanup');
}
