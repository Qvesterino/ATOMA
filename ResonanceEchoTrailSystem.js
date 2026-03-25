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
import VisualTime from './src/time/VisualTime.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // Echo pool
    POOL_SIZE: 30,                    // Max concurrent echoes
    
    // Spawn frequency - POLISH: Slower spawn rate for calmer accumulation
    ECHO_SPAWN_INTERVAL: 0.2,         // POLISHED: increased from 0.15 (fewer echoes)
    
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
        
        // State for visual modulation
        this.harmonyBalance = 0.5;
        this.stability = 0.5;
        this.synergy = 0.5;
    }
    
    reset() {
        this.active = false;
        this.mesh.visible = false;
        this.compositeGlyph = null;
        this.age = 0.0;
        this.currentOpacity = 0.0;
    }
    
    spawn(position, compositeGeometry, harmonyBalance, stability, synergy, currentVisualTime) {
        this.active = true;
        this.mesh.visible = true;
        this.position.copy(position);
        this.mesh.position.copy(position);
        this.age = 0.0;
        this.harmonyBalance = harmonyBalance;
        this.stability = stability;
        this.synergy = synergy;
        this._spawnTime = currentVisualTime;
        
        // Calculate lifetime based on state
        this.lifetime = this.calculateLifetime();
        
        // Set initial opacity
        this.targetOpacity = CONFIG.BASE_ECHO_OPACITY;
        this.currentOpacity = this.targetOpacity;
        this.mesh.material.opacity = this.targetOpacity;
        
        // Update geometry if provided (for simplified silhouette)
        if (compositeGeometry && compositeGeometry !== this.mesh.geometry) {
            this.mesh.geometry.dispose();
            this.mesh.geometry = compositeGeometry;
        }
    }
    
    calculateLifetime() {
        let lifetime = CONFIG.BASE_ECHO_LIFETIME;
        
        // Harmony modulation
        const harmonyInfluence = this.harmonyBalance - 0.5;
        if (harmonyInfluence > 0) {
            lifetime *= CONFIG.HARMONY_LIFETIME_MULTIPLIER;
        } else {
            lifetime *= CONFIG.CORRUPTION_LIFETIME_MULTIPLIER;
        }
        
        // Stability impact (instability accelerates decay)
        if (this.stability < 0.5) {
            const instabilityFactor = this.stability * 2; // 0-1
            lifetime *= (0.7 + instabilityFactor * 0.3); // 0.7-1.0 multiplier
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
        
        this.compositeId = compositeGlyph;
        
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

        this.root = new THREE.Group();
        this.root.name = 'ResonanceEchoTrailRoot';
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
        this._boundWaveBurstHandler = (burst) => {
            const resolved = this._resolveBurstPayload(burst);
            if (!resolved) return;
            this.spawnEchoTrail(resolved.center, resolved.intensity);
        };
        
        // Debug
        this.debugEchoVisualization = null;
        if (CONFIG.DEBUG_DRAW_ECHOES) {
            this.setupDebugVisualization();
        }
        
        this.enabled = true;
        this.init();
        
        console.log('[ResonanceEchoTrailSystem] Initialized');
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
        return {
            center,
            intensity: Number.isFinite(rawIntensity) ? rawIntensity : 0.5
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
        this.root.add(container);
        this.container = container;
        
        for (let i = 0; i < CONFIG.POOL_SIZE; i++) {
            // Create simple circular geometry for echo silhouette
            const geometry = new THREE.CircleGeometry(0.4, 8);
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
            mesh.renderOrder = 4;          // POLISHED: mid-ground layer (behind active glyphs/links)
            
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
                    // Calculate spawn reduction based on instability
                    const stabilityFactor = state.stability !== undefined ? state.stability : 0.7;
                    const spawnChance = stabilityFactor >= 0.5 ? 1.0 : stabilityFactor * 2;
                    
                    if (Math.random() < spawnChance) {
                        this.spawnEcho(
                            composite.mesh.position,
                            composite.mesh.geometry,
                            state.harmonBalance,
                            stabilityFactor,
                            state.averageSynergy,
                            currentVisualTime
                        );
                        echoSpawnCount++;
                    }
                }
                
                tracker.resetSpawnTimer(currentVisualTime);
            }
        }
    }
    
    spawnEcho(position, geometry, harmonyBalance, stability, synergy, currentVisualTime) {
        // Find available echo instance
        for (let echo of this.echoInstances) {
            if (!echo.active) {
                echo.spawn(position, geometry, harmonyBalance, stability, synergy, currentVisualTime);
                return;
            }
        }
    }

    spawnEchoTrail(center, intensity = 0.5) {
        if (!this.enabled || !center || this.echoInstances.length === 0) return;

        const x = Number(center.x);
        const y = Number(center.y);
        const z = Number(center.z);
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return;

        const clampedIntensity = Math.max(0, Math.min(1, Number.isFinite(intensity) ? intensity : 0.5));
        const currentVisualTime = this._getCurrentVisualTime();

        // Use existing pool geometry/material path - no new shaders/materials/pools.
        const pooledGeometry = this.echoInstances[0]?.mesh?.geometry;
        if (!pooledGeometry) return;

        this.spawnEcho(
            new THREE.Vector3(x, y, z),
            pooledGeometry,
            0.5 + clampedIntensity * 0.5, // harmonyBalance
            0.5 + clampedIntensity * 0.3, // stability
            clampedIntensity,             // synergy
            currentVisualTime
        );
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
        const container = new THREE.Group();
        container.name = 'EchoTrailDebug';
        this.root.add(container);
        this.debugEchoVisualization = container;
    }
    
    updateDebugVisualization() {
        if (!this.debugEchoVisualization) return;
        
        // Clear old visuals
        while (this.debugEchoVisualization.children.length > 0) {
            this.debugEchoVisualization.remove(this.debugEchoVisualization.children[0]);
        }
        
        // Draw active echoes with spawn points
        for (let echo of this.echoInstances) {
            if (!echo.active) continue;
            
            // Draw echo position marker
            const markerGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const markerMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.6
            });
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.copy(echo.position);
            this.debugEchoVisualization.add(marker);
            
            // Draw lifetime indicator
            const progress = echo.age / echo.lifetime;
            const radius = 0.3 * (1 - progress);
            const ringGeometry = new THREE.BufferGeometry();
            const positions = [];
            for (let i = 0; i <= 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                positions.push(
                    Math.cos(angle) * radius,
                    Math.sin(angle) * radius,
                    0
                );
            }
            ringGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
            const ringMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
            const ring = new THREE.Line(ringGeometry, ringMaterial);
            ring.position.copy(echo.position);
            this.debugEchoVisualization.add(ring);
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

        this.root?.traverse(obj => {
            if (obj.isMesh) {
                obj.geometry?.dispose();
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(mat => mat?.dispose?.());
                } else {
                    obj.material?.dispose?.();
                }
            }
        });

        if (this.root?.parent) {
            this.root.parent.remove(this.root);
        }
        this.root?.clear?.();
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
