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
    
    // Performance
    MAX_ECHOES_PER_ZONE: 8,           // Cap echoes per active composite
    UPDATE_INTERVAL: 1 / 30,          // 30 Hz throttle
    
    // Debug
    DEBUG_DRAW_ECHOES: false
};

const RESONANCE_ECHO_LOG_THROTTLE_MS = 1000;

// ============================================================================
// ECHO INSTANCE
// ============================================================================

class EchoInstance {
    constructor(mesh) {
        this.mesh = mesh;
        this.active = false;
        this.position = new THREE.Vector3();
        this.targetOpacity = 0.0;
        this.currentOpacity = 0.0;
        this.lifetime = 1.0;
        this.age = 0.0;
        this.compositeGlyph = null;
        this._spawnTime = 0.0;
        
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
        
        // Calculate lifetime based on state
        const profile = visualProfile || {};
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
        const profileScaleBoost = Number.isFinite(profile.scaleBoost) ? profile.scaleBoost : 0.0;
        this.targetOpacity = THREE.MathUtils.clamp(
            CONFIG.BASE_ECHO_OPACITY + visibilityLift + profileOpacityBoost,
            CONFIG.BASE_ECHO_OPACITY,
            0.72
        );
        this.currentOpacity = this.targetOpacity;
        this.mesh.material.opacity = this.targetOpacity;
        this.mesh.material.color.setRGB(
            0.88 + harmony * 0.08 + stability * 0.05,
            0.88 + synergy * 0.06 + stability * 0.05,
            0.90 + synergy * 0.05 + stability * 0.06
        );
        this.mesh.scale.setScalar(
            0.9 +
            harmony * 0.08 +
            synergy * 0.16 +
            stability * 0.14 -
            corruption * 0.06 +
            profileScaleBoost
        );
        
        // Update geometry if provided (for simplified silhouette)
        if (compositeGeometry && compositeGeometry !== this.mesh.geometry) {
            const nextGeometry = typeof compositeGeometry.clone === 'function'
                ? compositeGeometry.clone()
                : compositeGeometry;
            this.mesh.geometry.dispose();
            this.mesh.geometry = nextGeometry;
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
        const fadeCurve = this.smoothEaseFade(progress);
        
        // Update opacity with smooth fade
        this.currentOpacity = this.targetOpacity * (1.0 - fadeCurve);
        this.mesh.material.opacity = Math.max(0, this.currentOpacity);
        
        // POLISHED: Removed distortion (kept echoes stable and calm)
        // Stability comes from stillness, not motion
    }
    
    // POLISHED: Smooth ease-out curve (gentle acceleration of fade)
    smoothEaseFade(t) {
        // Cubic ease-out: slow start, faster end
        // Creates natural-feeling temporal memory
        return t * t * t;
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
        this.historyPositions = [];  // Ring buffer of past positions
    }
    
    update(currentVisualTime, compositeGlyph) {
        if (!compositeGlyph || !compositeGlyph.mesh) {
            return false;
        }
        
        this.compositeId = compositeGlyph?.id ?? compositeGlyph?.uuid ?? compositeGlyph ?? null;
        
        // Track position history
        const currentPos = compositeGlyph.mesh.position;
        if (this.lastPosition.distanceTo(currentPos) > 0.01) {
            this.historyPositions.push(currentPos.clone());
            if (this.historyPositions.length > 20) {
                this.historyPositions.shift();
            }
            this.lastPosition.copy(currentPos);
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
        if (details) {
            console.error(`[ResonanceEchoTrailSystem] ${message}`, details);
        } else {
            console.error(`[ResonanceEchoTrailSystem] ${message}`);
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
        
        for (let i = 0; i < CONFIG.POOL_SIZE; i++) {
            // Create simple circular geometry for echo silhouette
            const geometry = new THREE.CircleGeometry(0.4, 8);
            if (!this.baseGeometry) {
                this.baseGeometry = geometry.clone();
            }
            const material = new THREE.MeshBasicMaterial({
                color: 0xc8c8c8,           // POLISHED: slightly warmer neutral
                transparent: true,
                opacity: CONFIG.BASE_ECHO_OPACITY,
                side: THREE.DoubleSide,
                depthWrite: false,         // POLISHED: prevent z-fighting
                fog: false                 // POLISHED: echoes always visible (not affected by fog)
            });
            const mesh = new THREE.Mesh(geometry, material);
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
                    const spawnCount = Math.min(
                        Math.max(0, band.spawnCount),
                        CONFIG.MAX_ECHOES_PER_ZONE - echoSpawnCount
                    );

                    if (spawnCount > 0) {
                        for (let i = 0; i < spawnCount; i += 1) {
                            this.spawnEcho(
                                composite.mesh.position,
                                composite.mesh.geometry,
                                metrics.harmony,
                                metrics.corruption,
                                currentVisualTime,
                                metrics.synergy,
                                metrics.stability,
                                band
                            );
                        }
                        this._logLifecycle(`echo-spawn:${composite.id || composite.mesh.uuid}`, 'echo spawned from composite', {
                            compositeId: composite.id || composite.mesh.uuid,
                            harmony: metrics.harmony,
                            corruption: metrics.corruption,
                            synergy: metrics.synergy,
                            stability: metrics.stability,
                            visibilityScore: band.visibilityScore,
                            spawnCount,
                            activeEchoes: this.echoInstances.filter((echo) => echo.active).length
                        });
                        echoSpawnCount += spawnCount;
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
                return;
            }
        }
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

        this.spawnEcho(
            new THREE.Vector3(x, y, z),
            pooledGeometry,
            finalMetrics.harmony,
            finalMetrics.corruption,
            currentVisualTime
            ,
            finalMetrics.synergy,
            finalMetrics.stability,
            trailProfile
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
