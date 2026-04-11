/**
 * ============================================================================
 * RESONANCE ECHO TRAIL SYSTEM
 * ============================================================================
 * 
 * Harmonic afterimages following composite glyph movement and dissolution.
 * 
 * CORE PHILOSOPHY:
 * Resonance does not vanish instantly. When composite glyphs move or dissolve,
 * they leave behind a short-lived harmonic memory—echoes that represent
 * temporal persistence of meaning, not motion blur or particles.
 * 
 * Echo trails are stationary memory imprints that fade quietly,
 * reinforcing continuity without clutter.
 * 
 * ============================================================================
 * 
 * ECHO MECHANICS:
 * 
 * 1. ECHO ACTIVATION
 *    - Spawns when composite glyph is moving
 *    - Spawns when composite glyph dissolves/separates
 *    - Only for active resonance fields
 * 
 * 2. ECHO PROPERTIES
 *    - Stationary in space (not moving/trailing)
 *    - Snapshot of past glyph state
 *    - Low spawn frequency (time-sliced, not per-frame)
 *    - Simplified geometry (silhouette)
 * 
 * 3. TEMPORAL DECAY
 *    - Smooth opacity fade
 *    - Lifetime scales with harmony/stability
 *    - Typical: 0.8s – 2.0s
 *    - Outlasts resonance field decay
 * 
 * 4. STATE MODULATION
 *    - Harmony: longer persistence, smoother fade
 *    - Corruption: shorter lifetime, slight distortion
 *    - Synergy: improves spacing, better legibility
 *    - Instability: reduces echo count, accelerates decay
 * 
 * VISUAL RESTRAINT:
 * - Same geometry as source composite
 * - Neutral grey-white, transparent
 * - Softer edges, reduced contrast
 * - NO glow, NO particles, NO color saturation
 * 
 * ============================================================================
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import VisualTime from './src/time/VisualTime.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // Echo pool
    POOL_SIZE: 30,                    // Max concurrent echoes
    
    // Spawn frequency - POLISH: Slower spawn rate for calmer accumulation
    ECHO_SPAWN_INTERVAL: 0.2,         // POLISHED: increased from 0.15 (fewer echoes)
    MIN_VISIBLE_ECHO_SCORE: 0.38,     // Visible floor for stable composites
    
    // Lifetime calculation - POLISH: Longer persistence, smoother range
    BASE_ECHO_LIFETIME: 1.4,          // POLISHED: increased from 1.2 (longer base)
    MIN_ECHO_LIFETIME: 0.8,           // POLISHED: increased from 0.6 (less abrupt min)
    MAX_ECHO_LIFETIME: 2.8,           // POLISHED: increased from 2.5 (gentler max)
    
    // Harmony modulation - POLISH: Less dramatic state influence
    HARMONY_LIFETIME_MULTIPLIER: 1.5, // POLISHED: reduced from 1.6 (calmer extension)
    CORRUPTION_LIFETIME_MULTIPLIER: 0.7, // POLISHED: increased from 0.6 (less harsh reduction)
    
    // Stability modulation - POLISH: More forgiving spawn reduction
    STABILITY_SPAWN_REDUCTION: 0.6,   // POLISHED: increased from 0.5 (60% instead of 50%)
    
    // Visual properties - POLISH: Subtler starting opacity
    BASE_ECHO_OPACITY: 0.32,          // POLISHED: reduced from 0.4 (32% - more subtle)
    ECHO_OPACITY_SOFTNESS: 0.18,      // POLISHED: increased from 0.15 (softer edges)
    
    // Echo geometry quality
    ECHO_CIRCLE_SEGMENTS: 12,         // IMPROVED: was 8 (smoother silhouette)
    ECHO_BASE_RADIUS: 0.4,            // Base radius for echo circle geometry
    
    // Performance
    MAX_ECHOES_PER_ZONE: 8,           // Cap echoes per active composite
    UPDATE_INTERVAL: 1 / 30,          // 30 Hz throttle
    LAYERED_ECHO_TRAILS_ENABLED: true,
    ECHO_LAYER_COUNT: 3,
    ECHO_DEPTH_STEP: 0.012,
    ECHO_BODY_RATIO: 0.42,
    ECHO_AFTERGLOW_RATIO: 0.78,
    ECHO_RESIDUE_SOFTNESS: 0.18,
    ECHO_SPATIAL_JITTER: 0.008,
    ECHO_BRIDGE_ENABLED: true,
    ECHO_BRIDGE_MIN_MOTION: 0.02,
    
    // Debug
    DEBUG_DRAW_ECHOES: false
};

const RESONANCE_ECHO_LOG_THROTTLE_MS = 30000; // 30 seconds

// ============================================================================
// ECHO INSTANCE
// ============================================================================

class EchoInstance {
    constructor(mesh) {
        this.mesh = mesh;
        this.baseRenderOrder = mesh?.renderOrder ?? 0;
        this.active = false;
        this.position = new THREE.Vector3();
        this.targetOpacity = 0.0;
        this.currentOpacity = 0.0;
        this.lifetime = 1.0;
        this.age = 0.0;
        this.compositeGlyph = null;
        this._spawnTime = 0.0;
        this._sourceGeometryRef = null;
        this.baseScale = 1.0;
        this.layerIndex = 0;
        this.layerRole = 'medium';
        this.renderOrderBias = 0;
        this.fadeProfile = null;
        this.depthOffset = 0.0;
        this._baseColor = new THREE.Color(0xc8c8c8);
        this._residueColor = new THREE.Color(0xc8c8c8);
        
        // State for visual modulation (canonical composite metrics)
        this.harmony = 0.5;      // Canonical: node.userData.metrics.harmony
        this.synergy = 0.5;      // Canonical: composite.state.synergy
        this.corruption = 0;     // Canonical: node.userData.corruption
        this.stability = 0.5;    // Canonical: composite.state.stability
        this.debugMarker = null;
        this.debugRing = null;
    }
    
    reset() {
        this.active = false;
        this.mesh.visible = false;
        this.compositeGlyph = null;
        this.age = 0.0;
        this.currentOpacity = 0.0;
        this.synergy = 0.5;
        this.stability = 0.5;
        this.baseScale = 1.0;
        this.layerIndex = 0;
        this.layerRole = 'medium';
        this.renderOrderBias = 0;
        this.fadeProfile = null;
        this.depthOffset = 0.0;
        if (this.debugMarker) this.debugMarker.visible = false;
        if (this.debugRing) this.debugRing.visible = false;
    }
    
    /**
     * Spawn echo with canonical metrics
     * @param {THREE.Vector3} position - Spawn position
     * @param {THREE.BufferGeometry} compositeGeometry - Geometry to use
     * @param {number} harmony - Canonical harmony (0-1) from node.userData.metrics.harmony
     * @param {number} corruption - Canonical corruption (0-1) from node.userData.corruption
     * @param {number} currentVisualTime - Current visual time
     */
    spawn(position, compositeGeometry, harmony, corruption, currentVisualTime, synergy = 0.5, stability = 0.5, visualProfile = null) {
        this.active = true;
        this.mesh.visible = true;
        this.position.copy(position);
        this.mesh.position.copy(position);
        this.age = 0.0;
        this.harmony = harmony;
        this.synergy = synergy;
        this.corruption = corruption;
        this.stability = stability;
        this._spawnTime = currentVisualTime;
        
        const profile = visualProfile || {};
        this.layerIndex = Number.isFinite(profile.layerIndex) ? profile.layerIndex : 0;
        this.layerRole = profile.layerRole || 'medium';
        this.renderOrderBias = Number.isFinite(profile.renderOrderBias) ? profile.renderOrderBias : 0;
        this.fadeProfile = profile.fadeProfile || null;
        this.depthOffset = Number.isFinite(profile.depthOffset) ? profile.depthOffset : 0.0;
        this.baseScale = 0.9 +
            harmony * 0.08 +
            synergy * 0.16 +
            stability * 0.14 -
            corruption * 0.06 +
            (Number.isFinite(profile.scaleBoost) ? profile.scaleBoost : 0.0);
        this.mesh.renderOrder = this.baseRenderOrder + this.renderOrderBias;

        if (this.depthOffset !== 0) {
            this.mesh.position.z += this.depthOffset;
        }

        const jitterRadius = Number.isFinite(profile.jitterRadius) ? profile.jitterRadius : 0.0;
        if (jitterRadius > 0) {
            const jitterSeed = (harmony * 0.37 + synergy * 0.53 + stability * 0.29 + corruption * 0.21 + this.layerIndex * 0.17) * Math.PI * 2;
            this.mesh.position.x += Math.sin(jitterSeed) * jitterRadius;
            this.mesh.position.y += Math.cos(jitterSeed * 1.37) * jitterRadius;
        }
        
        // Calculate lifetime based on state
        const lifetimeBoost = Number.isFinite(profile.lifetimeBoost) ? profile.lifetimeBoost : 1.0;
        this.lifetime = THREE.MathUtils.clamp(
            this.calculateLifetime() * lifetimeBoost,
            CONFIG.MIN_ECHO_LIFETIME,
            CONFIG.MAX_ECHO_LIFETIME
        );
        
        // Set initial opacity
        const visibilityLift = THREE.MathUtils.clamp(
            0.12 +
            harmony * 0.08 +
            synergy * 0.14 +
            stability * 0.12 -
            corruption * 0.1,
            0.0,
            0.28
        );
        const profileOpacityBoost = Number.isFinite(profile.opacityBoost) ? profile.opacityBoost : 0.0;
        this.targetOpacity = THREE.MathUtils.clamp(
            CONFIG.BASE_ECHO_OPACITY + visibilityLift + profileOpacityBoost,
            CONFIG.BASE_ECHO_OPACITY,
            0.72
        );
        this.currentOpacity = this.targetOpacity;
        this._baseColor.setRGB(
            0.88 + harmony * 0.08 + stability * 0.05,
            0.88 + synergy * 0.06 + stability * 0.05,
            0.90 + synergy * 0.05 + stability * 0.06
        );
        this._residueColor.setRGB(
            0.82 + harmony * 0.03 - corruption * 0.04,
            0.83 + synergy * 0.02 - corruption * 0.05,
            0.85 + stability * 0.04 - corruption * 0.03
        );
        this.mesh.material.opacity = this.targetOpacity * (0.96 + (Number.isFinite(profile.opacityBoost) ? profile.opacityBoost : 0.0) * 0.5);
        this.mesh.material.color.copy(this._baseColor).lerp(this._residueColor, Math.min(0.28, (Number.isFinite(profile.temperatureMix) ? profile.temperatureMix : 0.08) * 0.5));
        this.mesh.scale.setScalar(Math.max(0.62, this.baseScale));
        
        // Update geometry if provided (for simplified silhouette)
        if (compositeGeometry && compositeGeometry !== this.mesh.geometry) {
            if (this._sourceGeometryRef !== compositeGeometry) {
                const nextGeometry = typeof compositeGeometry.clone === 'function'
                    ? compositeGeometry.clone()
                    : compositeGeometry;
                // FIX: Don't dispose shared baseGeometry — only dispose per-instance cloned geometries
                const currentGeometry = this.mesh.geometry;
                if (currentGeometry && currentGeometry !== nextGeometry && this._sourceGeometryRef !== null) {
                    currentGeometry.dispose();
                }
                this.mesh.geometry = nextGeometry;
                this._sourceGeometryRef = compositeGeometry;
            }
        }
    }
    
    // SIMPLIFIED: calculateLifetime using only 2 canonical metrics
    calculateLifetime() {
        let lifetime = CONFIG.BASE_ECHO_LIFETIME;
        
        // Harmony and synergy extend lifetime, corruption shortens it
        const harmonyInfluence = this.harmony - this.corruption;
        if (harmonyInfluence > 0) {
            lifetime *= CONFIG.HARMONY_LIFETIME_MULTIPLIER;
        } else {
            lifetime *= CONFIG.CORRUPTION_LIFETIME_MULTIPLIER;
        }

        const synergyScale = 0.9 + Math.max(0, Math.min(1, this.synergy)) * 0.2;
        const stabilityScale = 0.85 + Math.max(0, Math.min(1, this.stability)) * 0.25;
        lifetime *= synergyScale * stabilityScale;
        
        // High corruption accelerates decay (replaces stability check)
        if (this.corruption > 0.5) {
            const corruptionFactor = 1.0 - (this.corruption - 0.5); // 0.5-1.0
            lifetime *= (0.7 + corruptionFactor * 0.3); // 0.7-1.0 multiplier
        }
        
        return Math.max(CONFIG.MIN_ECHO_LIFETIME, Math.min(CONFIG.MAX_ECHO_LIFETIME, lifetime));
    }
    
    update(currentVisualTime) {
        if (!this.active) return;
        
        if (this._spawnTime === undefined) {
            this._spawnTime = currentVisualTime;
        }
        this.age = currentVisualTime - this._spawnTime;
        
        if (this.age >= this.lifetime) {
            this.reset();
            return;
        }
        
        // POLISHED: Smooth ease-out fade curve (cubic S-curve)
        const progress = this.age / this.lifetime;
        const temporalEnvelope = this.getTemporalEnvelope(progress);
        
        // Update opacity with smooth fade
        this.currentOpacity = this.targetOpacity * temporalEnvelope.opacity;
        this.mesh.material.opacity = Math.max(0, this.currentOpacity);
        this.mesh.scale.setScalar(Math.max(0.62, this.baseScale * temporalEnvelope.scale));
        if (this.mesh.material?.color && this._baseColor && this._residueColor) {
            const temperatureMix = THREE.MathUtils.clamp((this.fadeProfile?.temperatureMix ?? 0.08) + progress * 0.3, 0, 1);
            this.mesh.material.color.copy(this._baseColor).lerp(this._residueColor, temperatureMix);
        }
        
        // POLISHED: Removed distortion (kept echoes stable and calm)
        // Stability comes from stillness, not motion
    }

    getTemporalEnvelope(progress) {
        const profile = this.fadeProfile || {};
        const bodyRatio = THREE.MathUtils.clamp(profile.bodyRatio ?? CONFIG.ECHO_BODY_RATIO, 0.22, 0.62);
        const afterglowRatio = THREE.MathUtils.clamp(profile.afterglowRatio ?? CONFIG.ECHO_AFTERGLOW_RATIO, bodyRatio + 0.08, 0.93);
        const residueSoftness = THREE.MathUtils.clamp(profile.residueSoftness ?? CONFIG.ECHO_RESIDUE_SOFTNESS, 0.08, 0.3);
        const scaleDecay = Number.isFinite(profile.scaleDecay) ? profile.scaleDecay : 0.06;
        const scalePulse = Number.isFinite(profile.scalePulse) ? profile.scalePulse : 0.02;

        let opacity;
        if (progress <= bodyRatio) {
            const bodyT = progress / Math.max(0.001, bodyRatio);
            const easedBody = bodyT * bodyT * (3 - 2 * bodyT);
            opacity = 1.0 - easedBody * (0.05 + residueSoftness * 0.1);
        } else if (progress <= afterglowRatio) {
            const afterT = (progress - bodyRatio) / Math.max(0.001, afterglowRatio - bodyRatio);
            const easedAfter = afterT * afterT * (3 - 2 * afterT);
            opacity = 0.95 - easedAfter * (0.95 - 0.34);
        } else {
            const tailT = (progress - afterglowRatio) / Math.max(0.001, 1 - afterglowRatio);
            const tailEase = tailT * tailT;
            opacity = Math.max(0, 0.34 * (1 - tailEase * (1.0 + residueSoftness * 0.85)));
        }

        const scale = Math.max(0.62, 1.0 + scalePulse * Math.sin(progress * Math.PI) - progress * scaleDecay);

        return {
            opacity: THREE.MathUtils.clamp(opacity, 0, 1),
            scale
        };
    }
    
    // POLISHED: Smooth ease-out curve (gentle acceleration of fade)
    smoothEaseFade(t) {
        // Cubic ease-out: slow start, faster end
        // Creates natural-feeling temporal memory
        return 1 - this.getTemporalEnvelope(t).opacity;
    }
}

// ============================================================================
// COMPOSITE GLYPH TRACKER
// ============================================================================

class CompositeGlyphTracker {
    constructor() {
        this.compositeId = null;
        this.lastEchoSpawnTime = 0.0;
        this.lastPosition = new THREE.Vector3();
        this.previousPosition = new THREE.Vector3();
        this.lastMotionDistance = 0;
        this.historyPositions = [];  // Ring buffer of past positions
    }
    
    update(currentVisualTime, compositeGlyph) {
        if (!compositeGlyph || !compositeGlyph.mesh) {
            return false;
        }
        
        this.compositeId = compositeGlyph?.id ?? compositeGlyph?.uuid ?? compositeGlyph ?? null;
        
        // Track position history
        const currentPos = compositeGlyph.mesh.position;
        this.lastMotionDistance = this.lastPosition.distanceTo(currentPos);
        if (this.lastMotionDistance > 0.01) {
            this.previousPosition.copy(this.lastPosition);
            this.historyPositions.push(currentPos.clone());
            if (this.historyPositions.length > 20) {
                this.historyPositions.shift();
            }
            this.lastPosition.copy(currentPos);
        } else if (!this.historyPositions.length) {
            this.previousPosition.copy(currentPos);
        }
        
        return true;
    }
    
    shouldSpawnEcho(currentVisualTime) {
        return (currentVisualTime - this.lastEchoSpawnTime) >= CONFIG.ECHO_SPAWN_INTERVAL;
    }
    
    resetSpawnTimer(currentVisualTime) {
        this.lastEchoSpawnTime = currentVisualTime;
    }
    
    reset() {
        this.compositeId = null;
        this.historyPositions.length = 0;
        this.lastEchoSpawnTime = 0.0;
    }
}

// ============================================================================
// MAIN RESONANCE ECHO TRAIL SYSTEM
// ============================================================================

export class ResonanceEchoTrailSystem {
    constructor(scene, worldRoot, options = {}) {
        this.scene = scene;
        this.worldRoot = worldRoot;
        this._attachRoot = worldRoot || scene;
        this.semanticBus = options.semanticBus ?? globalThis.semanticBus ?? null;
        this.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_LINK_WAVES);

        this.root = new THREE.Group();
        this.root.name = 'ResonanceEchoTrailRoot';
        this.root.renderOrder = this.renderOrder;
        this._attachRoot.add(this.root);
        
        // Echo pool
        this.echoInstances = [];
        this.initializeEchoPool();
        
        // Composite glyph tracking
        this.compositeTrackers = new Map();  // compositeGlyph -> tracker
        
        // Update tracking
        this.updateTimer = 0.0;
        this._timeOrigin = undefined;
        this._lastVisualTime = undefined;
        this._semanticEventsBound = false;
        this._lifecycleLogTimes = new Map();
        this._echoBridgeScratch = new THREE.Vector3();
        this._echoSpawnScratch = new THREE.Vector3();
        this._boundWaveBurstHandler = (burst) => {
            const resolved = this._resolveBurstPayload(burst);
            if (!resolved) return;
            this.spawnEchoTrail(resolved.center, resolved.intensity, resolved.metrics);
        };
        
        // Debug
        this.debugEchoVisualization = null;
        this.debugMarkerGeometry = null;
        this.debugMarkerMaterial = null;
        this.debugRingGeometry = null;
        this.debugRingMaterial = null;
        if (CONFIG.DEBUG_DRAW_ECHOES) {
            this.setupDebugVisualization();
        }
        
        this.enabled = true;
        this.init();
        
        console.log('[ResonanceEchoTrailSystem] Initialized');
    }

    _logLifecycle(key, message, details = null, intervalMs = RESONANCE_ECHO_LOG_THROTTLE_MS) {
        const now = Date.now();
        const last = this._lifecycleLogTimes.get(key) || 0;
        if (now - last < intervalMs) return;

        this._lifecycleLogTimes.set(key, now);
        const shouldLog = typeof window !== 'undefined' && window.__DEBUG_ECHO_TRAIL_LOGS__ === true;
        if (!shouldLog) return;
        if (details) {
            console.debug(`[ResonanceEchoTrailSystem] ${message}`, details);
        } else {
            console.debug(`[ResonanceEchoTrailSystem] ${message}`);
        }
    }

    _subscribeSemanticEvents() {
        if (!this.semanticBus?.on || this._semanticEventsBound) return;
        this.semanticBus.on('wave.burst.lifecycle', this._boundWaveBurstHandler);
        this.semanticBus.on('wave.packet.spawn', this._boundWaveBurstHandler);
        this._semanticEventsBound = true;
    }

    _unsubscribeSemanticEvents() {
        if (!this._semanticEventsBound) return;
        const bus = this.semanticBus;
        if (bus?.unsubscribe) {
            bus.unsubscribe('wave.burst.lifecycle', this._boundWaveBurstHandler);
            bus.unsubscribe('wave.packet.spawn', this._boundWaveBurstHandler);
        } else if (bus?.off) {
            bus.off('wave.burst.lifecycle', this._boundWaveBurstHandler);
            bus.off('wave.packet.spawn', this._boundWaveBurstHandler);
        }
        this._semanticEventsBound = false;
    }

    init(config = {}) {
        if (config.semanticBus) {
            this.semanticBus = config.semanticBus;
        }
        this._subscribeSemanticEvents();
        return this;
    }

    rebind(config = {}) {
        if (config.semanticBus && config.semanticBus !== this.semanticBus) {
            this._unsubscribeSemanticEvents();
            this.semanticBus = config.semanticBus;
        }
        this._subscribeSemanticEvents();
        return this;
    }

    _resolveBurstPayload(event = {}) {
        const lifecyclePayload = event?.payload || {};
        const lifecycleSnapshot = lifecyclePayload?.snapshot || {};
        const lifecycleIntent = lifecyclePayload?.intent || {};
        const lifecycleCenter = lifecycleSnapshot?.spatial?.center || lifecycleIntent?.center || null;

        const center =
            event?.center ||
            event?.position ||
            lifecycleCenter ||
            null;

        const rawIntensity =
            event?.intensity ??
            event?.value ??
            lifecycleIntent?.energy ??
            lifecycleIntent?.intensity ??
            lifecycleIntent?.intensityEnvelope?.peak ??
            lifecyclePayload?.intensity ??
            0.5;

        if (!center) return null;
        const clampedIntensity = Number.isFinite(rawIntensity) ? Math.max(0, Math.min(1, rawIntensity)) : 0.5;
        const metrics = this._resolveEchoTrailMetrics(clampedIntensity);
        const eventState = lifecyclePayload?.state || lifecycleIntent?.state || lifecycleSnapshot?.state || null;
        if (eventState) {
            metrics.harmony = this._readMetric(eventState, ['harmony', 'harmonyBalance', 'harmonyLevel', 'avgHarmony'], metrics.harmony);
            metrics.synergy = this._readMetric(eventState, ['synergy', 'averageSynergy', 'synergyNorm', 'avgSynergy'], metrics.synergy);
            metrics.corruption = this._readMetric(eventState, ['corruption', 'corruptionBalance', 'corruptionLevel', 'avgCorruption'], metrics.corruption);
            metrics.stability = this._readMetric(eventState, ['stability', 'stabilityIndex', 'stabilityNorm', 'avgStability'], metrics.stability);
        }
        return {
            center,
            intensity: clampedIntensity,
            metrics
        };
    }

    _getCurrentVisualTime() {
        if (this._timeOrigin === undefined) {
            this._timeOrigin = VisualTime.now;
        }
        return VisualTime.now - this._timeOrigin;
    }
    
    // ========================================================================
    // INITIALIZATION
    // ========================================================================
    
    initializeEchoPool() {
        const container = new THREE.Group();
        container.name = 'ResonanceEchoPool';
        container.renderOrder = this.renderOrder;
        this.root.add(container);
        this.container = container;
        
        // IMPROVED: Shared geometry — all echoes use the same circle, no per-instance allocation
        this.baseGeometry = new THREE.CircleGeometry(CONFIG.ECHO_BASE_RADIUS, CONFIG.ECHO_CIRCLE_SEGMENTS);
        
        for (let i = 0; i < CONFIG.POOL_SIZE; i++) {
            const material = new THREE.MeshBasicMaterial({
                color: 0xc8c8c8,           // POLISHED: slightly warmer neutral
                transparent: true,
                opacity: CONFIG.BASE_ECHO_OPACITY,
                side: THREE.DoubleSide,
                depthWrite: false,         // POLISHED: prevent z-fighting
                fog: false                 // POLISHED: echoes always visible (not affected by fog)
            });
            const mesh = new THREE.Mesh(this.baseGeometry, material);
            mesh.visible = false;
            mesh.renderOrder = this.renderOrder;
            
            container.add(mesh);
            
            const instance = new EchoInstance(mesh);
            this.echoInstances.push(instance);
        }
    }
    
    // ========================================================================
    // UPDATE LOOP
    // ========================================================================
    
  update(deltaTime, compositeGlyphs) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;

    if (!this.enabled) return;
    
    if (this._timeOrigin === undefined) {
        this._timeOrigin = VisualTime.now;
    }
    const currentVisualTime = VisualTime.now - this._timeOrigin; // Phase 2A: canonical VisualTime source (behavior-preserving)
    const deltaVisual = this._lastVisualTime !== undefined ? currentVisualTime - this._lastVisualTime : 0;
    this._lastVisualTime = currentVisualTime;

        this.updateTimer += deltaVisual;
        if (this.updateTimer < CONFIG.UPDATE_INTERVAL) return;
        this.updateTimer = 0.0;
        
        // Update all echo instances
        this.updateEchoInstances(currentVisualTime);
        
        // Track composite glyphs and spawn echoes
        this.trackCompositesAndSpawnEchoes(currentVisualTime, compositeGlyphs);
        
        // Update debug visualization
        if (CONFIG.DEBUG_DRAW_ECHOES) {
            this.updateDebugVisualization();
        }
    }
    
    // ========================================================================
    // ECHO INSTANCE UPDATES
    // ========================================================================
    
    updateEchoInstances(currentVisualTime) {
        for (let echo of this.echoInstances) {
            if (!echo.active) continue;
            echo.update(currentVisualTime);
        }
    }
    
    // ========================================================================
    // COMPOSITE TRACKING & ECHO SPAWNING
    // ========================================================================
    
    trackCompositesAndSpawnEchoes(currentVisualTime, compositeGlyphs) {
        if (!compositeGlyphs || compositeGlyphs.length === 0) return;

        let trackedActiveComposites = 0;
        
        // Clean up trackers for dead composites
        for (let [composite, tracker] of this.compositeTrackers.entries()) {
            if (!composite.active) {
                tracker.reset();
                this.compositeTrackers.delete(composite);
            }
        }
        
        // Update existing trackers and spawn echoes
        let echoSpawnCount = 0;
        for (let composite of compositeGlyphs) {
            if (!composite.active || !composite.mesh) continue;
            trackedActiveComposites += 1;
            
            // Get or create tracker
            let tracker = this.compositeTrackers.get(composite);
            if (!tracker) {
                tracker = new CompositeGlyphTracker();
                this.compositeTrackers.set(composite, tracker);
            }
            
            // Update tracker
            tracker.update(currentVisualTime, composite);
            
            // Spawn echo if conditions met
            if (tracker.shouldSpawnEcho(currentVisualTime) && echoSpawnCount < CONFIG.MAX_ECHOES_PER_ZONE) {
                const state = composite.state;
                if (state) {
                    const metrics = this._resolveCompositeMetrics(state);
                    const band = this._getEchoVisibilityBand(metrics);
                    const remainingBudget = CONFIG.MAX_ECHOES_PER_ZONE - echoSpawnCount;

                    if (remainingBudget > 0) {
                        const spawned = this._spawnLayeredEchoes(
                            composite.mesh.position,
                            composite.mesh.geometry,
                            metrics,
                            currentVisualTime,
                            band,
                            tracker,
                            remainingBudget
                        );

                        if (spawned > 0) {
                            this._logLifecycle(`echo-spawn:${composite.id || composite.mesh.uuid}`, 'echo spawned from composite', {
                                compositeId: composite.id || composite.mesh.uuid,
                                harmony: metrics.harmony,
                                corruption: metrics.corruption,
                                synergy: metrics.synergy,
                                stability: metrics.stability,
                                visibilityScore: band.visibilityScore,
                                spawnCount: spawned,
                                activeEchoes: this.echoInstances.filter((echo) => echo.active).length
                            });
                            echoSpawnCount += spawned;
                        }
                    }
                }

                tracker.resetSpawnTimer(currentVisualTime);
            }
        }

        this._logLifecycle('summary', 'composite echo summary', {
            activeComposites: trackedActiveComposites,
            trackedComposites: this.compositeTrackers.size,
            activeEchoes: this.echoInstances.filter((echo) => echo.active).length,
            spawnedThisTick: echoSpawnCount
        }, 20000);
    }
    
    // Canonical composite metrics: harmony, corruption, synergy, stability
    spawnEcho(position, geometry, harmony, corruption, currentVisualTime, synergy = 0.5, stability = 0.5, visualProfile = null) {
        // Find available echo instance
        for (let echo of this.echoInstances) {
            if (!echo.active) {
                echo.spawn(position, geometry, harmony, corruption, currentVisualTime, synergy, stability, visualProfile);
                return true;
            }
        }

        return false;
    }

    // SIMPLIFIED: spawnEchoTrail with canonical metrics derived from intensity
    spawnEchoTrail(center, intensity = 0.5, metrics = null) {
        if (!this.enabled || !center || this.echoInstances.length === 0) return;

        const x = Number(center.x);
        const y = Number(center.y);
        const z = Number(center.z);
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return;

        const clampedIntensity = Math.max(0, Math.min(1, Number.isFinite(intensity) ? intensity : 0.5));
        const currentVisualTime = this._getCurrentVisualTime();

        // Use existing pool geometry/material path - no new shaders/materials/pools.
        const pooledGeometry = this.baseGeometry || this.echoInstances[0]?.mesh?.geometry;
        if (!pooledGeometry) return;

        const resolvedMetrics = metrics ? {
            harmony: this._readMetric(metrics, ['harmony', 'harmonyBalance', 'harmonyLevel', 'avgHarmony'], undefined),
            synergy: this._readMetric(metrics, ['synergy', 'averageSynergy', 'synergyNorm', 'avgSynergy'], undefined),
            corruption: this._readMetric(metrics, ['corruption', 'corruptionBalance', 'corruptionLevel', 'avgCorruption'], undefined),
            stability: this._readMetric(metrics, ['stability', 'stabilityIndex', 'stabilityNorm', 'avgStability'], undefined)
        } : null;
        const fallbackMetrics = this._resolveEchoTrailMetrics(clampedIntensity);
        const finalMetrics = {
            harmony: resolvedMetrics?.harmony ?? fallbackMetrics.harmony,
            synergy: resolvedMetrics?.synergy ?? fallbackMetrics.synergy,
            corruption: resolvedMetrics?.corruption ?? fallbackMetrics.corruption,
            stability: resolvedMetrics?.stability ?? fallbackMetrics.stability
        };
        const band = this._getEchoVisibilityBand(finalMetrics);
        const trailProfile = band.active ? band : {
            active: true,
            stage: 'fallback',
            spawnCount: 1,
            visibilityScore: band.visibilityScore,
            opacityBoost: 0.05,
            scaleBoost: 0.04,
            lifetimeBoost: 0.96
        };

        this._spawnLayeredEchoes(
            new THREE.Vector3(x, y, z),
            pooledGeometry,
            finalMetrics,
            currentVisualTime,
            trailProfile,
            null,
            CONFIG.MAX_ECHOES_PER_ZONE
        );
    }

    _resolveCompositeMetrics(state = {}) {
        const harmony = this._readMetric(state, ['harmony', 'harmonyBalance', 'harmonyLevel', 'avgHarmony'], 0.5);
        const synergy = this._readMetric(state, ['synergy', 'averageSynergy', 'synergyNorm', 'avgSynergy'], 0.5);
        const corruption = this._readMetric(state, ['corruption', 'corruptionBalance', 'corruptionLevel', 'avgCorruption'], 0);
        const stability = this._readMetric(state, ['stability', 'stabilityIndex', 'stabilityNorm', 'avgStability'], 0.5);
        const loadPressure = this._readMetric(state, ['loadPressure', 'loadNorm', 'avgLoadPressure'], Math.max(0, 1 - harmony));

        return {
            harmony: THREE.MathUtils.clamp(harmony, 0, 1),
            synergy: THREE.MathUtils.clamp(synergy, 0, 1),
            corruption: THREE.MathUtils.clamp(corruption, 0, 1),
            stability: THREE.MathUtils.clamp(stability, 0, 1),
            loadPressure: THREE.MathUtils.clamp(loadPressure, 0, 1)
        };
    }

    _resolveEchoTrailMetrics(intensity = 0.5) {
        const clampedIntensity = THREE.MathUtils.clamp(Number.isFinite(intensity) ? intensity : 0.5, 0, 1);

        return {
            harmony: 0.48 + clampedIntensity * 0.46,
            synergy: 0.38 + clampedIntensity * 0.5,
            corruption: 0.48 - clampedIntensity * 0.32,
            stability: 0.42 + clampedIntensity * 0.46
        };
    }

    _readMetric(source, keys, fallback) {
        if (!source) return fallback;
        for (const key of keys) {
            const value = source?.[key];
            if (Number.isFinite(value)) {
                return Math.max(0, Math.min(1, value));
            }
        }
        return fallback;
    }

    _getEchoVisibilityBand(metrics = {}) {
        const harmony = THREE.MathUtils.clamp(metrics.harmony ?? 0.5, 0, 1);
        const synergy = THREE.MathUtils.clamp(metrics.synergy ?? 0.5, 0, 1);
        const stability = THREE.MathUtils.clamp(metrics.stability ?? 0.5, 0, 1);
        const corruption = THREE.MathUtils.clamp(metrics.corruption ?? 0, 0, 1);
        const loadPressure = THREE.MathUtils.clamp(metrics.loadPressure ?? Math.max(0, 1 - harmony), 0, 1);

        const visibilityScore = THREE.MathUtils.clamp(
            harmony * 0.34 +
            synergy * 0.34 +
            stability * 0.26 +
            loadPressure * 0.08 -
            corruption * 0.16,
            0,
            1
        );

        let spawnCount = 0;
        let stage = 'silent';
        if (visibilityScore >= 0.8) {
            spawnCount = 3;
            stage = 'locked';
        } else if (visibilityScore >= 0.6) {
            spawnCount = 2;
            stage = 'strong';
        } else if (visibilityScore >= (CONFIG.MIN_VISIBLE_ECHO_SCORE ?? 0.38)) {
            spawnCount = 1;
            stage = 'visible';
        }

        return {
            active: spawnCount > 0,
            stage,
            spawnCount,
            visibilityScore,
            opacityBoost: 0.12 + visibilityScore * 0.16,
            scaleBoost: 0.08 + visibilityScore * 0.14,
            lifetimeBoost: 0.9 + visibilityScore * 0.18
        };
    }

    _buildEchoLayerProfiles(metrics = {}, band = {}, tracker = null) {
        if (!CONFIG.LAYERED_ECHO_TRAILS_ENABLED || !band?.active) {
            return [];
        }

        const stage = band.stage || 'visible';
        const baseLayerRoles = stage === 'locked'
            ? ['short', 'medium', 'long']
            : stage === 'strong'
                ? ['short', 'medium']
                : ['medium'];

        const desiredCount = Math.max(1, Math.min(CONFIG.ECHO_LAYER_COUNT, band.spawnCount ?? baseLayerRoles.length));
        const layerRoles = baseLayerRoles.slice(0, desiredCount);

        const harmony = THREE.MathUtils.clamp(metrics.harmony ?? 0.5, 0, 1);
        const synergy = THREE.MathUtils.clamp(metrics.synergy ?? 0.5, 0, 1);
        const corruption = THREE.MathUtils.clamp(metrics.corruption ?? 0, 0, 1);
        const stability = THREE.MathUtils.clamp(metrics.stability ?? 0.5, 0, 1);
        const visibilityScore = THREE.MathUtils.clamp(band.visibilityScore ?? 0.5, 0, 1);
        const motionFactor = THREE.MathUtils.clamp((tracker?.lastMotionDistance ?? 0) * 12, 0, 1);

        const templates = {
            short: {
                lifetimeBoost: 0.74,
                opacityBoost: -0.03,
                scaleBoost: -0.04,
                renderOrderBias: 2,
                bodyRatio: 0.34,
                afterglowRatio: 0.68,
                residueSoftness: 0.14,
                temperatureMix: 0.12,
                scaleDecay: 0.08,
                scalePulse: 0.014,
                depthOffset: 0.012
            },
            medium: {
                lifetimeBoost: 1.0,
                opacityBoost: 0.01,
                scaleBoost: 0.0,
                renderOrderBias: 1,
                bodyRatio: 0.42,
                afterglowRatio: 0.78,
                residueSoftness: 0.18,
                temperatureMix: 0.08,
                scaleDecay: 0.06,
                scalePulse: 0.018,
                depthOffset: 0.0
            },
            long: {
                lifetimeBoost: 1.28,
                opacityBoost: 0.05,
                scaleBoost: 0.03,
                renderOrderBias: 0,
                bodyRatio: 0.50,
                afterglowRatio: 0.86,
                residueSoftness: 0.22,
                temperatureMix: 0.04,
                scaleDecay: 0.05,
                scalePulse: 0.022,
                depthOffset: -0.012
            }
        };

        const totalLayers = layerRoles.length;

        return layerRoles.map((layerRole, layerIndex) => {
            const template = templates[layerRole] || templates.medium;
            const spread = totalLayers > 1 ? layerIndex / (totalLayers - 1) : 0.5;
            const geometryDepth = (spread - 0.5) * CONFIG.ECHO_DEPTH_STEP * (1.0 + motionFactor * 0.5);

            return {
                layerIndex,
                layerRole,
                renderOrderBias: template.renderOrderBias,
                lifetimeBoost: template.lifetimeBoost * (0.9 + harmony * 0.14 + synergy * 0.08 + stability * 0.1 - corruption * 0.12 + visibilityScore * 0.06),
                opacityBoost: template.opacityBoost + visibilityScore * 0.05 + harmony * 0.03 - corruption * 0.06,
                scaleBoost: template.scaleBoost + synergy * 0.03 + stability * 0.03 - corruption * 0.02,
                bodyRatio: template.bodyRatio,
                afterglowRatio: template.afterglowRatio,
                residueSoftness: template.residueSoftness,
                temperatureMix: THREE.MathUtils.clamp(template.temperatureMix + harmony * 0.08 - corruption * 0.08 + visibilityScore * 0.04, 0, 1),
                scaleDecay: template.scaleDecay + (1 - stability) * 0.025 + corruption * 0.02,
                scalePulse: template.scalePulse,
                depthOffset: template.depthOffset + geometryDepth,
                jitterRadius: ((1 - stability) * CONFIG.ECHO_SPATIAL_JITTER + corruption * CONFIG.ECHO_SPATIAL_JITTER * 0.75) * (0.5 + visibilityScore * 0.5),
                fadeProfile: {
                    bodyRatio: template.bodyRatio,
                    afterglowRatio: template.afterglowRatio,
                    residueSoftness: template.residueSoftness,
                    scaleDecay: template.scaleDecay + (1 - stability) * 0.025 + corruption * 0.02,
                    scalePulse: template.scalePulse,
                    temperatureMix: THREE.MathUtils.clamp(template.temperatureMix + harmony * 0.08 - corruption * 0.08, 0, 1)
                }
            };
        });
    }

    _resolveBridgeEchoPosition(tracker, currentPosition, out = this._echoBridgeScratch) {
        if (!CONFIG.ECHO_BRIDGE_ENABLED || !tracker || !currentPosition) return null;
        if ((tracker.lastMotionDistance ?? 0) < CONFIG.ECHO_BRIDGE_MIN_MOTION) return null;
        if (!tracker.previousPosition || !tracker.lastPosition) return null;

        out.copy(tracker.previousPosition).add(currentPosition).multiplyScalar(0.5);
        return out;
    }

    _spawnLayeredEchoes(position, geometry, metrics, currentVisualTime, band, tracker = null, spawnBudget = CONFIG.MAX_ECHOES_PER_ZONE) {
        const layerProfiles = this._buildEchoLayerProfiles(metrics, band, tracker);
        if (layerProfiles.length === 0) return 0;

        const maxSpawns = Number.isFinite(spawnBudget)
            ? Math.max(0, Math.floor(spawnBudget))
            : CONFIG.MAX_ECHOES_PER_ZONE;
        if (maxSpawns <= 0) return 0;

        const bridgePosition = this._resolveBridgeEchoPosition(tracker, position);
        const bridgeLayerIndex = layerProfiles.length - 1;
        let spawned = 0;

        for (let i = 0; i < layerProfiles.length; i += 1) {
            if (spawned >= maxSpawns) break;

            const layerProfile = layerProfiles[i];
            const spawnPosition = bridgePosition && i === bridgeLayerIndex && layerProfiles.length > 1
                ? bridgePosition
                : position;

            if (this.spawnEcho(
                spawnPosition,
                geometry,
                metrics.harmony,
                metrics.corruption,
                currentVisualTime,
                metrics.synergy,
                metrics.stability,
                layerProfile
            )) {
                spawned += 1;
            }
        }

        return spawned;
    }
    
    // ========================================================================
    // ENABLE / DISABLE
    // ========================================================================
    
    enable() {
        this.enabled = true;
        console.log('[ResonanceEchoTrailSystem] ENABLED');
    }
    
    disable() {
        this.enabled = false;
        this.resetAll();
        console.log('[ResonanceEchoTrailSystem] DISABLED');
    }
    
    resetAll() {
        for (let echo of this.echoInstances) {
            echo.reset();
        }
        this.compositeTrackers.clear();
    }
    
    // ========================================================================
    // DEBUG VISUALIZATION
    // ========================================================================
    
    setupDebugVisualization() {
        this.ensureDebugResources();

        const container = new THREE.Group();
        container.name = 'EchoTrailDebug';
        container.renderOrder = this.renderOrder;
        this.root.add(container);
        this.debugEchoVisualization = container;
    }

    ensureDebugResources() {
        if (!this.debugMarkerGeometry) {
            this.debugMarkerGeometry = new THREE.SphereGeometry(1, 8, 8);
        }

        if (!this.debugMarkerMaterial) {
            this.debugMarkerMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.6
            });
        }

        if (!this.debugRingGeometry) {
            const positions = [];
            for (let i = 0; i <= 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                positions.push(Math.cos(angle), Math.sin(angle), 0);
            }

            this.debugRingGeometry = new THREE.BufferGeometry();
            this.debugRingGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        }

        if (!this.debugRingMaterial) {
            this.debugRingMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        }
    }
    
    updateDebugVisualization() {
        if (!this.debugEchoVisualization) return;

        this.ensureDebugResources();
        
        // Draw active echoes with spawn points
        for (let echo of this.echoInstances) {
            if (!echo.active) {
                if (echo.debugMarker) echo.debugMarker.visible = false;
                if (echo.debugRing) echo.debugRing.visible = false;
                continue;
            }
            
            // Draw echo position marker
            if (!echo.debugMarker) {
                echo.debugMarker = new THREE.Mesh(this.debugMarkerGeometry, this.debugMarkerMaterial);
                echo.debugMarker.frustumCulled = false;
                this.debugEchoVisualization.add(echo.debugMarker);
            }

            echo.debugMarker.visible = true;
            echo.debugMarker.position.copy(echo.position);
            echo.debugMarker.scale.setScalar(0.1);
            echo.debugMarker.renderOrder = this.renderOrder;
            
            // Draw lifetime indicator
            const progress = echo.age / echo.lifetime;
            const radius = 0.3 * (1 - progress);

            if (!echo.debugRing) {
                echo.debugRing = new THREE.LineLoop(this.debugRingGeometry, this.debugRingMaterial);
                echo.debugRing.frustumCulled = false;
                this.debugEchoVisualization.add(echo.debugRing);
            }

            echo.debugRing.visible = true;
            echo.debugRing.position.copy(echo.position);
            echo.debugRing.scale.setScalar(radius);
            echo.debugRing.renderOrder = this.renderOrder;
        }
    }
    
    // ========================================================================
    // STATUS & CONSOLE API
    // ========================================================================
    
    getStatus() {
        const activeEchoes = this.echoInstances.filter(e => e.active).length;
        const averageEchoLifetime = this.echoInstances
            .filter(e => e.active)
            .reduce((sum, e) => sum + e.lifetime, 0) / Math.max(1, activeEchoes);
        
        return {
            enabled: this.enabled,
            activeEchoes,
            poolCapacity: CONFIG.POOL_SIZE,
            averageLifetime: averageEchoLifetime.toFixed(2),
            trackedComposites: this.compositeTrackers.size
        };
    }

    dispose() {
        this._unsubscribeSemanticEvents();
        this.resetAll();

        const disposedGeometries = new Set();
        const disposedMaterials = new Set();

        this.root?.traverse(obj => {
            if (obj.isMesh || obj.isLine) {
                if (obj.geometry && !disposedGeometries.has(obj.geometry)) {
                    disposedGeometries.add(obj.geometry);
                    obj.geometry.dispose();
                }

                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        for (const material of obj.material) {
                            if (material && !disposedMaterials.has(material)) {
                                disposedMaterials.add(material);
                                material.dispose();
                            }
                        }
                    } else if (!disposedMaterials.has(obj.material)) {
                        disposedMaterials.add(obj.material);
                        obj.material.dispose();
                    }
                }
            }
        });

        if (this.root?.parent) {
            this.root.parent.remove(this.root);
        }
        this.root?.clear?.();
        this.baseGeometry?.dispose?.();
        this.baseGeometry = null;
        this.debugMarkerGeometry?.dispose?.();
        this.debugMarkerMaterial?.dispose?.();
        this.debugRingGeometry?.dispose?.();
        this.debugRingMaterial?.dispose?.();
        this.semanticBus = null;
    }
}

// ============================================================================
// CONSOLE API
// ============================================================================

export function setupResonanceEchoConsoleAPI(game, echoSystem) {
    if (!window.game) return;
    
    window.game.echoStatus = () => {
        const status = echoSystem.getStatus();
        console.log('[EchoTrail] Status:', status);
        return status;
    };
    
    window.game.enableEchoTrails = () => {
        echoSystem.enable();
    };
    
    window.game.disableEchoTrails = () => {
        echoSystem.disable();
    };
    
    window.game.toggleEchoDebug = () => {
        CONFIG.DEBUG_DRAW_ECHOES = !CONFIG.DEBUG_DRAW_ECHOES;
        console.log('[EchoTrail] Debug visualization:', CONFIG.DEBUG_DRAW_ECHOES);
    };
    
    console.log('[ResonanceEchoTrailSystem] Console API ready:');
    console.log('  game.echoStatus()');
    console.log('  game.enableEchoTrails()');
    console.log('  game.disableEchoTrails()');
    console.log('  game.toggleEchoDebug()');
}
