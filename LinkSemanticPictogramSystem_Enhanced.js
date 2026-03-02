/**
 * ============================================================================
 * LINK SEMANTIC PICTOGRAM SYSTEM — ENHANCED
 * ============================================================================
 * 
 * Multi-layer semantic visual language above links.
 * 
 * CORE PHILOSOPHY:
 * - Pictograms feel ALIVE, INTENTIONAL, INFORMATIVE
 * - Not flat icons — embedded in space with depth and parallax
 * - Morphing transitions, not abrupt swaps
 * - Context-aware flow intelligence
 * - Visual hierarchy through semantic density
 * 
 * LAYERS:
 * - Layer A (Signal): Primary meaning (harmony/corruption/healing)
 * - Layer B (Modulator): Secondary modifiers (synergy/instability)
 * - Layer C (Memory): Historical traces (faint, sparse)
 * 
 * FEATURES:
 * - Continuous morphing between states
 * - Depth layers with subtle parallax
 * - Intelligent flow (slowing near resistance, oscillating in waves)
 * - Semantic density (important links = fewer, larger glyphs)
 * - Calm, restrained visual language
 * 
 * ============================================================================
 */

import * as THREE from 'three';
import { PictogramLibrary, createPictogramMaterial } from './LinkPictogramLibrary.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // Layer system
    LAYER_A_ENABLED: true,  // Signal glyphs (primary)
    LAYER_B_ENABLED: true,  // Modulator marks (secondary)
    LAYER_C_ENABLED: true,  // Memory traces (tertiary)
    
    LAYER_A_OPACITY: 0.7,
    LAYER_B_OPACITY: 0.5,
    LAYER_C_OPACITY: 0.25,
    
    LAYER_A_DEPTH_OFFSET: 0.8,  // Height above link
    LAYER_B_DEPTH_OFFSET: 1.0,
    LAYER_C_DEPTH_OFFSET: 1.2,
    
    // Spawn density (semantic priority)
    MAX_GLYPHS_PER_LINK_CRITICAL: 2,   // Critical links: fewer, larger
    MAX_GLYPHS_PER_LINK_IMPORTANT: 3,  // Important links
    MAX_GLYPHS_PER_LINK_NORMAL: 4,     // Normal links
    MAX_GLYPHS_PER_LINK_MINOR: 5,      // Minor links: more, smaller
    
    SPAWN_INTERVAL_BASE: 2.5,
    
    // Size tiers (adjusted for hierarchy)
    SIZE_ANCHOR: 0.5,      // Rare, critical markers
    SIZE_LARGE: 0.35,      // Important signals
    SIZE_MEDIUM: 0.2,      // Standard glyphs
    SIZE_SMALL: 0.12,      // Minor/modulator marks
    
    // Motion
    BASE_DRIFT_SPEED: 0.25,
    SYNERGY_SPEED_MULTIPLIER: 1.8,
    
    // Context-aware flow
    RESISTANCE_SLOW_FACTOR: 0.3,       // Slow to 30% near resistant nodes
    RESISTANCE_SPACING_COMPRESSION: 0.7, // Compress spacing to 70%
    STANDING_WAVE_OSCILLATION: 0.4,
    STANDING_WAVE_REVERSAL_CHANCE: 0.15,
    HEALING_ALIGNMENT_STRENGTH: 0.8,
    RUPTURE_TENSION_COMPRESSION: 0.5,
    RUPTURE_HESITATION_FACTOR: 0.2,
    
    // Morphing
    MORPH_DURATION: 1.5,    // Seconds to complete morph
    MORPH_SMOOTHNESS: 0.85, // Interpolation smoothness
    
    // Depth & parallax
    PARALLAX_STRENGTH: 0.15,
    MICRO_ROTATION_AMOUNT: 0.05,  // Radians
    MICRO_ROTATION_SPEED: 0.3,
    
    // Lifetime
    LIFETIME_MIN: 10.0,
    LIFETIME_MAX: 20.0,
    FADE_IN_DURATION: 0.8,
    FADE_OUT_DURATION: 1.2,
    
    // Memory layer
    MEMORY_SPAWN_CHANCE: 0.15,  // 15% chance to spawn memory trace
    MEMORY_LIFETIME_MULTIPLIER: 2.0,  // Last twice as long
    
    // Performance
    POOL_SIZE: 250,
    UPDATE_INTERVAL: 1 / 30,
    
    // Visual restraint
    COLOR_SATURATION: 0.25,  // Low saturation (neutral tones)
    BASE_COLOR: 0xb0b0b0,    // Neutral grey base
    
    // Semantic thresholds
    // Slightly relaxed to ensure visibility without flooding
    HARMONY_THRESHOLD: 0.25,
    CORRUPTION_THRESHOLD: 0.25,
    SYNERGY_THRESHOLD: 0.2,
    INSTABILITY_THRESHOLD: 0.2,
    HEALING_THRESHOLD: 0.15,
    STANDING_WAVE_THRESHOLD: 0.15,
    RESISTANCE_THRESHOLD: 0.2
};

// ============================================================================
// PICTOGRAM STATE MACHINE (for morphing)
// ============================================================================

const PictogramStates = {
    // Harmony family
    HARMONY_STABLE: 'CIRCLE_RING',
    HARMONY_FLOW: 'WAVE',
    HARMONY_CONNECTED: 'INTERLOCKING_ARCS',
    
    // Corruption family
    CORRUPTION_BREAKING: 'BROKEN_CIRCLE',
    CORRUPTION_SCATTERED: 'OFFSET_SHARDS',
    CORRUPTION_UNSTABLE: 'FRACTURED_TRIANGLE',
    
    // Synergy family
    SYNERGY_MOMENTUM: 'CHEVRON',
    SYNERGY_ALIGNED: 'TRIPLE_ARROW',
    SYNERGY_ENTANGLED: 'BRAIDED_LINE',
    
    // Instability family
    INSTABILITY_DISORDER: 'OFFSET_DOTS',
    INSTABILITY_DESYNC: 'PHASE_SHIFTED_BARS',
    INSTABILITY_INCOMPLETE: 'INCOMPLETE_SYMBOL',
    
    // Healing family
    HEALING_RECOVERING: 'REFORMING_RING',
    HEALING_REUNITING: 'CLOSING_GAP',
    HEALING_REGENERATING: 'SOFT_SPIRAL',
    
    // Standing wave family
    WAVE_RESONANCE: 'OSCILLATION',
    WAVE_TRAPPED: 'BACK_FORTH_ARROWS',
    WAVE_CYCLING: 'LOOPING_WAVE'
};

// Morphing paths (define allowed transitions)
const MorphingPaths = {
    // Harmony morphs
    'CIRCLE_RING': ['WAVE', 'BROKEN_CIRCLE', 'REFORMING_RING'],
    'WAVE': ['CIRCLE_RING', 'INTERLOCKING_ARCS', 'OSCILLATION'],
    'INTERLOCKING_ARCS': ['WAVE', 'BRAIDED_LINE'],
    
    // Corruption morphs
    'BROKEN_CIRCLE': ['CIRCLE_RING', 'OFFSET_SHARDS', 'FRACTURED_TRIANGLE'],
    'OFFSET_SHARDS': ['BROKEN_CIRCLE', 'FRACTURED_TRIANGLE'],
    'FRACTURED_TRIANGLE': ['BROKEN_CIRCLE', 'INCOMPLETE_SYMBOL'],
    
    // Synergy morphs
    'CHEVRON': ['TRIPLE_ARROW', 'BRAIDED_LINE'],
    'TRIPLE_ARROW': ['CHEVRON', 'BRAIDED_LINE'],
    'BRAIDED_LINE': ['TRIPLE_ARROW', 'INTERLOCKING_ARCS'],
    
    // Healing morphs
    'REFORMING_RING': ['CIRCLE_RING', 'CLOSING_GAP'],
    'CLOSING_GAP': ['REFORMING_RING', 'SOFT_SPIRAL'],
    'SOFT_SPIRAL': ['CLOSING_GAP', 'WAVE']
};

// ============================================================================
// ENHANCED PICTOGRAM INSTANCE
// ============================================================================

class EnhancedPictogramInstance {
    constructor(mesh) {
        this.mesh = mesh;
        this.active = false;
        this.link = null;
        this.layer = 'A'; // 'A', 'B', 'C'
        
        // Motion state
        this.linkProgress = 0.0;
        this.depthOffset = 0.8;
        this.lateralPhase = 0.0;
        this.verticalPhase = 0.0;
        this.age = 0.0;
        this.lifetime = 15.0;
        this.baseSpeed = CONFIG.BASE_DRIFT_SPEED;
        
        // Morphing state
        this.currentState = null;
        this.targetState = null;
        this.morphProgress = 0.0;
        this.isMorphing = false;
        
        // Context awareness
        this.isSlowingForResistance = false;
        this.isOscillating = false;
        this.isAlignedByHealing = false;
        this.isTenseFromRupture = false;
        this.oscillationDirection = 1;
        
        // Depth & parallax
        this.microRotationPhase = Math.random() * Math.PI * 2;
        this.depthLayer = 0;
        
        // Visual
        this.size = CONFIG.SIZE_MEDIUM;
        this.baseOpacity = 0.7;
    }

    reset() {
        this.active = false;
        this.mesh.visible = false;
        this.link = null;
        this.currentState = null;
        this.targetState = null;
        this.isMorphing = false;
        this.isSlowingForResistance = false;
        this.isOscillating = false;
        this.isAlignedByHealing = false;
        this.isTenseFromRupture = false;
    }

    spawn(link, layer, state, size, depthOffset) {
        this.active = true;
        this.link = link;
        this.layer = layer;
        this.currentState = state;
        this.size = size;
        this.depthOffset = depthOffset;
        this.depthLayer = layer === 'A' ? 0 : (layer === 'B' ? 1 : 2);
        
        this.linkProgress = Math.random();
        this.lateralPhase = Math.random() * Math.PI * 2;
        this.verticalPhase = Math.random() * Math.PI * 2;
        this.microRotationPhase = Math.random() * Math.PI * 2;
        
        this.age = 0.0;
        this.lifetime = THREE.MathUtils.lerp(
            CONFIG.LIFETIME_MIN,
            CONFIG.LIFETIME_MAX,
            Math.random()
        );
        
        // Memory layer lasts longer
        if (layer === 'C') {
            this.lifetime *= CONFIG.MEMORY_LIFETIME_MULTIPLIER;
        }
        
        this.baseSpeed = CONFIG.BASE_DRIFT_SPEED * (0.7 + Math.random() * 0.6);
        
        // Set base opacity by layer
        this.baseOpacity = layer === 'A' ? CONFIG.LAYER_A_OPACITY :
                          (layer === 'B' ? CONFIG.LAYER_B_OPACITY : CONFIG.LAYER_C_OPACITY);
        
        this.mesh.visible = true;
        this.mesh.scale.setScalar(size);
        
        // Update geometry
        this.updateGeometry();
    }

    update(deltaTime, linkContext, cameraPosition) {
        if (!this.active || !this.link) return;

        this.age += deltaTime;

        // Check lifetime
        if (this.age >= this.lifetime) {
            this.reset();
            return;
        }

        // Update morphing
        if (this.isMorphing) {
            this.updateMorphing(deltaTime);
        }

        // Check if should initiate morph based on link context
        if (!this.isMorphing && this.age > 3.0 && Math.random() < 0.01) {
            this.checkAndInitiateMorph(linkContext);
        }

        // Update context awareness
        this.updateContextAwareness(linkContext);

        // Calculate drift speed with context modifiers
        let speed = this.calculateContextualSpeed(linkContext);

        // Update progress along link
        this.linkProgress += (speed * deltaTime) / (this.link.userData?.length || 10.0);
        
        // Handle oscillation or wrapping
        if (this.isOscillating) {
            if (this.linkProgress > 0.8 || this.linkProgress < 0.2) {
                if (Math.random() < CONFIG.STANDING_WAVE_REVERSAL_CHANCE) {
                    this.oscillationDirection *= -1;
                }
            }
            if (this.linkProgress > 1.0) this.linkProgress = 0.8;
            if (this.linkProgress < 0.0) this.linkProgress = 0.2;
        } else {
            if (this.linkProgress > 1.0) {
                this.linkProgress -= 1.0;
            }
        }

        // Update phases
        this.lateralPhase += deltaTime * 0.4;
        this.verticalPhase += deltaTime * 0.3;
        this.microRotationPhase += deltaTime * CONFIG.MICRO_ROTATION_SPEED;

        // Update position along link
        this.updatePositionAlongLink(linkContext, cameraPosition);

        // Update opacity
        this.updateOpacity();

        // Update micro-rotation
        this.updateMicroRotation();
    }

    updateContextAwareness(linkContext) {
        // Reset context flags
        this.isSlowingForResistance = false;
        this.isOscillating = false;
        this.isAlignedByHealing = false;
        this.isTenseFromRupture = false;

        // Check resistance
        if (linkContext.hasResistance && linkContext.resistance > CONFIG.RESISTANCE_THRESHOLD) {
            this.isSlowingForResistance = true;
        }

        // Check standing wave
        if (linkContext.hasStandingWave && linkContext.standingWaveIntensity > CONFIG.STANDING_WAVE_THRESHOLD) {
            this.isOscillating = true;
        }

        // Check healing
        if (linkContext.isHealing && linkContext.healingIntensity > CONFIG.HEALING_THRESHOLD) {
            this.isAlignedByHealing = true;
        }

        // Check rupture tension
        if (linkContext.ruptureImminent && linkContext.ruptureRisk > 0.6) {
            this.isTenseFromRupture = true;
        }
    }

    calculateContextualSpeed(linkContext) {
        let speed = this.baseSpeed;

        // Synergy multiplier
        const synergyMultiplier = 1.0 + (linkContext.synergy || 0) * CONFIG.SYNERGY_SPEED_MULTIPLIER;
        speed *= synergyMultiplier;

        // Resistance slowing
        if (this.isSlowingForResistance) {
            speed *= CONFIG.RESISTANCE_SLOW_FACTOR;
        }

        // Standing wave oscillation
        if (this.isOscillating) {
            const oscillation = Math.sin(this.age * Math.PI * 2) * CONFIG.STANDING_WAVE_OSCILLATION;
            speed *= (1.0 + oscillation) * this.oscillationDirection;
        }

        // Healing smoothing (stable speed)
        if (this.isAlignedByHealing) {
            speed *= CONFIG.HEALING_ALIGNMENT_STRENGTH;
        }

        // Rupture hesitation
        if (this.isTenseFromRupture) {
            speed *= CONFIG.RUPTURE_HESITATION_FACTOR;
        }

        return speed;
    }

    updatePositionAlongLink(linkContext, cameraPosition) {
        const nodeA = this.link.userData?.nodeA;
        const nodeB = this.link.userData?.nodeB;
        if (!nodeA || !nodeB) return;

        // Base position interpolation
        const t = this.linkProgress;
        const basePos = new THREE.Vector3().lerpVectors(
            nodeA.position,
            nodeB.position,
            t
        );

        // Get link direction
        const linkDir = new THREE.Vector3().subVectors(nodeB.position, nodeA.position).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const perpendicular = new THREE.Vector3().crossVectors(linkDir, up).normalize();

        // Apply depth offset (layer-based)
        basePos.y += this.depthOffset;

        // Lateral drift (subtle wave)
        const lateralDrift = Math.sin(this.lateralPhase) * 0.08;
        basePos.add(perpendicular.multiplyScalar(lateralDrift));

        // Vertical gentle bob
        const verticalBob = Math.sin(this.verticalPhase) * 0.05;
        basePos.y += verticalBob;

        // Parallax relative to camera
        if (cameraPosition) {
            const toCam = new THREE.Vector3().subVectors(cameraPosition, basePos).normalize();
            const parallaxOffset = toCam.multiplyScalar(this.depthLayer * CONFIG.PARALLAX_STRENGTH * 0.1);
            basePos.add(parallaxOffset);
        }

        // Rupture tension: slight angle bias
        if (this.isTenseFromRupture) {
            const tensionOffset = Math.sin(this.age * 5.0) * 0.03;
            basePos.add(perpendicular.multiplyScalar(tensionOffset));
        }

        this.mesh.position.copy(basePos);
    }

    updateOpacity() {
        const fadeInEnd = CONFIG.FADE_IN_DURATION;
        const fadeOutStart = this.lifetime - CONFIG.FADE_OUT_DURATION;
        
        let opacity = this.baseOpacity;

        // Fade in
        if (this.age < fadeInEnd) {
            opacity *= this.age / fadeInEnd;
        }
        // Fade out
        else if (this.age > fadeOutStart) {
            opacity *= (this.lifetime - this.age) / CONFIG.FADE_OUT_DURATION;
        }

        // Morphing fade
        if (this.isMorphing) {
            // Slight fade during morph for smoothness
            const morphFade = 1.0 - (Math.abs(this.morphProgress - 0.5) * 0.3);
            opacity *= morphFade;
        }

        // Healing subtle glow stabilization (not brightness boost)
        if (this.isAlignedByHealing) {
            opacity = Math.min(opacity * 1.1, this.baseOpacity);
        }

        if (this.mesh.material) {
            this.mesh.material.opacity = opacity;
        }
    }

    updateMicroRotation() {
        // Very subtle Z-axis rotation for depth feeling
        const microRot = Math.sin(this.microRotationPhase) * CONFIG.MICRO_ROTATION_AMOUNT;
        this.mesh.rotation.z = microRot;
    }

    updateMorphing(deltaTime) {
        this.morphProgress += deltaTime / CONFIG.MORPH_DURATION;

        if (this.morphProgress >= 1.0) {
            // Complete morph
            this.currentState = this.targetState;
            this.targetState = null;
            this.isMorphing = false;
            this.morphProgress = 0.0;
            this.updateGeometry();
        } else {
            // Interpolate geometry (simplified: just update at midpoint)
            if (this.morphProgress > 0.5 && this.morphProgress - deltaTime / CONFIG.MORPH_DURATION <= 0.5) {
                // Switch to target geometry at morph midpoint
                this.updateGeometry(this.targetState);
            }
        }
    }

    checkAndInitiateMorph(linkContext) {
        if (!this.currentState) return;

        // Determine target state based on link context
        const possibleTargets = MorphingPaths[this.currentState] || [];
        if (possibleTargets.length === 0) return;

        // Select target based on context
        let targetState = null;

        // Healing context: morph toward healing states
        if (linkContext.isHealing && linkContext.healingIntensity > 0.5) {
            const healingTargets = possibleTargets.filter(s => s.includes('REFORMING') || s.includes('CLOSING'));
            if (healingTargets.length > 0) {
                targetState = healingTargets[Math.floor(Math.random() * healingTargets.length)];
            }
        }

        // Corruption context: morph toward corruption states
        if (!targetState && linkContext.corruption > 0.6) {
            const corruptionTargets = possibleTargets.filter(s => s.includes('BROKEN') || s.includes('FRACTURED'));
            if (corruptionTargets.length > 0) {
                targetState = corruptionTargets[Math.floor(Math.random() * corruptionTargets.length)];
            }
        }

        // Standing wave: morph toward wave states
        if (!targetState && linkContext.hasStandingWave) {
            const waveTargets = possibleTargets.filter(s => s.includes('OSCILLATION') || s.includes('WAVE'));
            if (waveTargets.length > 0) {
                targetState = waveTargets[Math.floor(Math.random() * waveTargets.length)];
            }
        }

        // Default: random valid target
        if (!targetState) {
            targetState = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
        }

        // Initiate morph
        this.targetState = targetState;
        this.isMorphing = true;
        this.morphProgress = 0.0;
    }

    updateGeometry(state = null) {
        const geometryKey = state || this.currentState;
        if (!geometryKey) return;

        // This would get geometry from cache
        // For now, just mark that geometry should be updated
        this.mesh.userData.geometryKey = geometryKey;
    }
}

// ============================================================================
// MAIN ENHANCED PICTOGRAM SYSTEM
// ============================================================================

export class LinkSemanticPictogramSystem_Enhanced {
    constructor(scene, linkingSystem, camera) {
        this.scene = scene;
        this.linkingSystem = linkingSystem;
        this.camera = camera;

        this.enabled = true;

        // Pictogram pool (enhanced instances)
        this.pictograms = [];
        this.initializePictogramPool();

        // Per-link tracking
        this.linkImportanceScores = new Map(); // linkId -> importance score
        this.linkPictogramCounts = new Map();
        this.linkSpawnTimers = new Map();

        // Update timer
        this.updateTimer = 0.0;

        // Geometry cache
        this.geometryCache = new Map();
        this.initializeGeometryCache();

        console.log('[LinkSemanticPictogramSystem_Enhanced] Initialized');
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    initializePictogramPool() {
        const container = new THREE.Group();
        container.name = 'EnhancedPictogramContainer';
        this.scene.add(container);
        this.container = container;

        for (let i = 0; i < CONFIG.POOL_SIZE; i++) {
            const geometry = new THREE.PlaneGeometry(1, 1);
            const material = createPictogramMaterial(CONFIG.BASE_COLOR, 0.7);
            const mesh = new THREE.Mesh(geometry, material);
            mesh.visible = false;
            
            container.add(mesh);

            const instance = new EnhancedPictogramInstance(mesh);
            this.pictograms.push(instance);
        }
    }

    initializeGeometryCache() {
        Object.entries(PictogramLibrary).forEach(([key, definition]) => {
            const geometry = definition.create(1.0);
            this.geometryCache.set(key, geometry);
        });

        console.log('[Enhanced] Geometry cache:', this.geometryCache.size, 'types');
    }

    // ========================================================================
    // UPDATE
    // ========================================================================

    update(deltaTime, time) {
        if (!this.enabled) return;

        this.updateTimer += deltaTime;
        if (this.updateTimer < CONFIG.UPDATE_INTERVAL) return;
        
        const actualDelta = this.updateTimer;
        this.updateTimer = 0.0;

        // Update link importance scores
        this.updateLinkImportanceScores();

        // Update spawn timers
        this.updateSpawnTimers(actualDelta);

        // Spawn new pictograms
        this.spawnPictograms(time);

        // Update active pictograms
        const cameraPos = this.camera ? this.camera.position : null;
        this.updateActivePictograms(actualDelta, cameraPos);
    }

    updateLinkImportanceScores() {
        if (!this.linkingSystem || !this.linkingSystem.links) return;

        this.linkingSystem.links.forEach(link => {
            const importance = this.calculateLinkImportance(link);
            this.linkImportanceScores.set(link.uuid, importance);
        });
    }

    calculateLinkImportance(link) {
        if (!link.userData) return 0.5;

        let score = 0.5; // Base importance

        // High synergy increases importance
        const synergy = link.userData.synergy || 0;
        score += synergy * 0.3;

        // High quality increases importance
        const quality = link.userData.quality || 0.5;
        score += (quality - 0.5) * 0.2;

        // Critical state increases importance
        const nodeA = link.userData.nodeA;
        const nodeB = link.userData.nodeB;
        if (nodeA && nodeB) {
            const avgStability = ((nodeA.userData?.stability || 1) + (nodeB.userData?.stability || 1)) / 2;
            if (avgStability < 0.3) {
                score += 0.3; // Critical link
            }
        }

        // Connected to specialized nodes
        const hasSpecialNodes = (nodeA?.userData?.isSpecialized || nodeB?.userData?.isSpecialized);
        if (hasSpecialNodes) {
            score += 0.2;
        }

        return Math.min(Math.max(score, 0), 1);
    }

    getMaxGlyphsForLink(importance) {
        if (importance > 0.85) return CONFIG.MAX_GLYPHS_PER_LINK_CRITICAL;
        if (importance > 0.65) return CONFIG.MAX_GLYPHS_PER_LINK_IMPORTANT;
        if (importance > 0.35) return CONFIG.MAX_GLYPHS_PER_LINK_NORMAL;
        return CONFIG.MAX_GLYPHS_PER_LINK_MINOR;
    }

    updateSpawnTimers(deltaTime) {
        if (!this.linkingSystem || !this.linkingSystem.links) return;

        this.linkingSystem.links.forEach(link => {
            const linkId = link.uuid;
            const timer = this.linkSpawnTimers.get(linkId) || 0;
            this.linkSpawnTimers.set(linkId, timer + deltaTime);
        });
    }

    spawnPictograms(time) {
        if (!this.linkingSystem || !this.linkingSystem.links) return;

        this.linkingSystem.links.forEach(link => {
            const linkId = link.uuid;
            const importance = this.linkImportanceScores.get(linkId) || 0.5;
            
            // Check spawn timer (adjusted by importance)
            const spawnInterval = CONFIG.SPAWN_INTERVAL_BASE / (0.5 + importance);
            const timer = this.linkSpawnTimers.get(linkId) || 0;
            if (timer < spawnInterval) return;

            // Check glyph count
            const maxGlyphs = this.getMaxGlyphsForLink(importance);
            const currentCount = this.linkPictogramCounts.get(linkId) || 0;
            if (currentCount >= maxGlyphs) return;

            // Analyze link context
            const linkContext = this.analyzeLinkContext(link);

            // Decide which layer to spawn
            const layer = this.selectLayer(linkContext, currentCount);

            // Select state for this layer
            const state = this.selectStateForLayer(layer, linkContext);
            if (!state) {
                this.linkSpawnTimers.set(linkId, 0);
                return;
            }

            // Select size based on importance
            const size = this.selectSizeByImportance(importance, layer);

            // Depth offset by layer
            const depthOffset = layer === 'A' ? CONFIG.LAYER_A_DEPTH_OFFSET :
                               (layer === 'B' ? CONFIG.LAYER_B_DEPTH_OFFSET : CONFIG.LAYER_C_DEPTH_OFFSET);

            // Spawn glyph
            this.spawnPictogram(link, layer, state, size, depthOffset);

            // Reset timer
            this.linkSpawnTimers.set(linkId, 0);

            // Update count
            this.linkPictogramCounts.set(linkId, currentCount + 1);
        });
    }

    selectLayer(linkContext, currentCount) {
        // First glyph: always Layer A (signal)
        if (currentCount === 0) return 'A';

        // Second/third: Layer B (modulator) if enabled
        if (currentCount < 3 && CONFIG.LAYER_B_ENABLED) return 'B';

        // Rare: Layer C (memory trace)
        if (CONFIG.LAYER_C_ENABLED && Math.random() < CONFIG.MEMORY_SPAWN_CHANCE) return 'C';

        // Default: Layer A
        return 'A';
    }

    selectStateForLayer(layer, linkContext) {
        if (layer === 'A') {
            // Signal layer: primary meaning
            return this.selectPrimaryState(linkContext);
        } else if (layer === 'B') {
            // Modulator layer: secondary modifiers
            return this.selectModulatorState(linkContext);
        } else {
            // Memory layer: historical traces
            return this.selectMemoryState(linkContext);
        }
    }

    selectPrimaryState(context) {
        // Determine dominant state
        const weights = {
            harmony: context.harmony,
            corruption: context.corruption,
            synergy: context.synergy,
            healing: context.isHealing ? 0.8 : 0,
            standing_wave: context.hasStandingWave ? 0.7 : 0
        };

        const dominant = Object.entries(weights).reduce((a, b) => a[1] > b[1] ? a : b);
        
        if (dominant[1] < 0.4) return null;

        // Select state from dominant category
        switch (dominant[0]) {
            case 'harmony':
                return Math.random() < 0.5 ? 'CIRCLE_RING' : 'WAVE';
            case 'corruption':
                return Math.random() < 0.5 ? 'BROKEN_CIRCLE' : 'FRACTURED_TRIANGLE';
            case 'synergy':
                return 'CHEVRON';
            case 'healing':
                return 'REFORMING_RING';
            case 'standing_wave':
                return 'OSCILLATION';
            default:
                return 'CIRCLE_RING';
        }
    }

    selectModulatorState(context) {
        // Small modifier glyphs
        if (context.synergy > 0.5) return 'TRIPLE_ARROW';
        if (context.instability > 0.5) return 'OFFSET_DOTS';
        return 'PHASE_SHIFTED_BARS';
    }

    selectMemoryState(context) {
        // Historical traces (faint echoes of past states)
        if (context.hasHistoricalRupture) return 'BROKEN_CIRCLE';
        if (context.hasHistoricalHealing) return 'SOFT_SPIRAL';
        return 'WAVE';
    }

    selectSizeByImportance(importance, layer) {
        if (layer === 'C') return CONFIG.SIZE_SMALL; // Memory always small

        if (importance > 0.85) {
            // Critical: rare anchor glyph
            return Math.random() < 0.1 ? CONFIG.SIZE_ANCHOR : CONFIG.SIZE_LARGE;
        } else if (importance > 0.65) {
            return CONFIG.SIZE_LARGE;
        } else if (importance > 0.35) {
            return CONFIG.SIZE_MEDIUM;
        } else {
            return CONFIG.SIZE_SMALL;
        }
    }

    updateActivePictograms(deltaTime, cameraPos) {
        this.pictograms.forEach(pictogram => {
            if (!pictogram.active) return;

            const linkContext = this.analyzeLinkContext(pictogram.link);
            pictogram.update(deltaTime, linkContext, cameraPos);

            // If deactivated, update count
            if (!pictogram.active && pictogram.link) {
                const linkId = pictogram.link.uuid;
                const count = this.linkPictogramCounts.get(linkId) || 0;
                this.linkPictogramCounts.set(linkId, Math.max(0, count - 1));
            }
        });
    }

    // ========================================================================
    // LINK CONTEXT ANALYSIS
    // ========================================================================

    analyzeLinkContext(link) {
        if (!link || !link.userData) {
            return this.getEmptyContext();
        }

        const nodeA = link.userData.nodeA;
        const nodeB = link.userData.nodeB;

        const avgHarmony = ((nodeA?.userData?.harmony || 0) + (nodeB?.userData?.harmony || 0)) / 2;
        const avgCorruption = ((nodeA?.userData?.corruption || 0) + (nodeB?.userData?.corruption || 0)) / 2;
        const avgStability = ((nodeA?.userData?.stability || 1) + (nodeB?.userData?.stability || 1)) / 2;
        
        const synergy = link.userData.synergy || 0;
        const instability = 1.0 - avgStability;
        const isHealing = (nodeA?.userData?.isHealing || false) || (nodeB?.userData?.isHealing || false);
        const healingIntensity = isHealing ? 0.7 : 0;

        // Standing wave detection
        const hasStandingWave = link.userData.hasStandingWave || false;
        const standingWaveIntensity = hasStandingWave ? 0.6 : 0;

        // Resistance detection (high corruption + low synergy)
        const hasResistance = avgCorruption > 0.5 && synergy < 0.3;
        const resistance = hasResistance ? avgCorruption : 0;

        // Rupture risk
        const ruptureRisk = avgCorruption * (1.0 - avgStability);
        const ruptureImminent = ruptureRisk > 0.6;

        // Historical context
        const hasHistoricalRupture = link.userData.hasHistoricalRupture || false;
        const hasHistoricalHealing = link.userData.hasHistoricalHealing || false;

        return {
            harmony: avgHarmony,
            corruption: avgCorruption,
            synergy: synergy,
            instability: instability,
            isHealing: isHealing,
            healingIntensity: healingIntensity,
            hasStandingWave: hasStandingWave,
            standingWaveIntensity: standingWaveIntensity,
            hasResistance: hasResistance,
            resistance: resistance,
            ruptureImminent: ruptureImminent,
            ruptureRisk: ruptureRisk,
            hasHistoricalRupture: hasHistoricalRupture,
            hasHistoricalHealing: hasHistoricalHealing
        };
    }

    getEmptyContext() {
        return {
            harmony: 0,
            corruption: 0,
            synergy: 0,
            instability: 0,
            isHealing: false,
            healingIntensity: 0,
            hasStandingWave: false,
            standingWaveIntensity: 0,
            hasResistance: false,
            resistance: 0,
            ruptureImminent: false,
            ruptureRisk: 0,
            hasHistoricalRupture: false,
            hasHistoricalHealing: false
        };
    }

    // ========================================================================
    // SPAWNING
    // ========================================================================

    spawnPictogram(link, layer, state, size, depthOffset) {
        const pictogram = this.pictograms.find(p => !p.active);
        if (!pictogram) return;

        const geometry = this.geometryCache.get(state);
        if (!geometry) {
            console.warn('[Enhanced] Geometry not found:', state);
            return;
        }

        pictogram.mesh.geometry = geometry;

        // Set color with very low saturation (neutral tones)
        const category = PictogramLibrary[state]?.category;
        const color = this.getCategoryColorRestrained(category);
        pictogram.mesh.material.color.setHex(color);

        pictogram.spawn(link, layer, state, size, depthOffset);
    }

    getCategoryColorRestrained(category) {
        // Very desaturated colors (neutral sci-fi aesthetic)
        const baseTone = 0.7; // Light grey base
        const tintStrength = CONFIG.COLOR_SATURATION;

        switch (category) {
            case 'harmony':
                return new THREE.Color(baseTone, baseTone, baseTone + tintStrength * 0.3).getHex();
            case 'corruption':
                return new THREE.Color(baseTone + tintStrength * 0.2, baseTone - tintStrength * 0.1, baseTone - tintStrength * 0.1).getHex();
            case 'synergy':
                return new THREE.Color(baseTone - tintStrength * 0.1, baseTone + tintStrength * 0.2, baseTone).getHex();
            case 'instability':
                return new THREE.Color(baseTone + tintStrength * 0.2, baseTone + tintStrength * 0.1, baseTone - tintStrength * 0.1).getHex();
            case 'healing':
                return new THREE.Color(baseTone, baseTone + tintStrength * 0.2, baseTone + tintStrength * 0.2).getHex();
            case 'standing_wave':
                return new THREE.Color(baseTone + tintStrength * 0.1, baseTone, baseTone + tintStrength * 0.2).getHex();
            default:
                return CONFIG.BASE_COLOR;
        }
    }

    // ========================================================================
    // ENABLE / DISABLE
    // ========================================================================

    enable() {
        this.enabled = true;
        this.container.visible = true;
        console.log('[Enhanced Pictograms] ENABLED');
    }

    disable() {
        this.enabled = false;
        this.container.visible = false;
        console.log('[Enhanced Pictograms] DISABLED');
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    dispose() {
        this.pictograms.forEach(p => p.reset());
        this.linkImportanceScores.clear();
        this.linkPictogramCounts.clear();
        this.linkSpawnTimers.clear();
        this.geometryCache.forEach(g => g.dispose());
        this.geometryCache.clear();
        
        if (this.container) {
            this.scene.remove(this.container);
        }

        console.log('[Enhanced Pictograms] Disposed');
    }
}
