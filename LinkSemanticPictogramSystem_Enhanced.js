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
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
// PictogramLibrary disabled during visual design; keep material factory only
import { createPictogramMaterial } from './LinkPictogramLibrary.js';

if (typeof window !== 'undefined' && !window.__PicDiagModuleLoaded__) {
    console.info('[PicDiag] LinkSemanticPictogramSystem_Enhanced module loaded');
    window.__PicDiagModuleLoaded__ = true;
}

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
    
    LAYER_A_DEPTH_OFFSET: 1.0,  // Height above link
    LAYER_B_DEPTH_OFFSET: 1.2,
    LAYER_C_DEPTH_OFFSET: 1.4,
    
    // Spawn density (semantic priority)
    MAX_GLYPHS_PER_LINK_CRITICAL: 2,   // Critical links: fewer, larger
    MAX_GLYPHS_PER_LINK_IMPORTANT: 3,  // Important links
    MAX_GLYPHS_PER_LINK_NORMAL: 4,     // Normal links
    MAX_GLYPHS_PER_LINK_MINOR: 5,      // Minor links: more, smaller
    MAX_GLYPHS_PER_LINK_ABSOLUTE: 10,  // Hard cap per link
    MAX_GLYPHS_PER_STATE: 2,           // Max per pictogram state per link
    MAX_GLYPHS_PER_METRIC: {           // Per-metric caps (target: 2 of each metric)
        harmony: 2,
        stability: 2,
        synergy: 2,
        loadPressure: 2,
        corruption: 2,
        default: 2
    },
    DETERMINISTIC_GLYPHS: true,
    ORBIT_RADII: {
        harmony: 0.35,
        stability: 0.45,
        synergy: 0.55,
        loadPressure: 0.65,
        corruption: 0.75
    },
    
    SPAWN_INTERVAL_BASE: 2.5,
    
    // Size tiers (adjusted for hierarchy)
    SIZE_ANCHOR: 0.8,      // Rare, critical markers
    SIZE_LARGE: 0.6,       // Important signals
    SIZE_MEDIUM: 0.4,      // Standard glyphs
    SIZE_SMALL: 0.25,      // Minor/modulator marks
    
    // Motion
    BASE_DRIFT_SPEED: 0.25,
    SYNERGY_SPEED_MULTIPLIER: 1.8,
    ORBITAL_SCALE_FACTOR: 0.5,   // Global scalar for orbital glyph groups
    
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
    SPIRAL_TURNS: 3.5,            // How many wraps around link per traversal
    SPIRAL_ROTATION_SPEED: 0.8,   // Revolutions per second around link axis
    
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

// Guarantee at least a small number of visible pictograms when links exist
const MIN_ACTIVE_GLOBAL = 8;
const VISIBILITY_SCALE = 2.0; // stronger visibility boost

const getGlobalLinkSystem = () =>
    (typeof window !== 'undefined' && (window.game?.linkingSystem || window.linkingSystem)) || null;

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

const getMetricForState = (state) => {
    if (!state) return 'loadPressure';
    if (['CIRCLE_RING', 'WAVE', 'INTERLOCKING_ARCS', 'REFORMING_RING', 'CLOSING_GAP', 'SOFT_SPIRAL'].includes(state)) return 'harmony';
    if (['OFFSET_DOTS', 'PHASE_SHIFTED_BARS', 'INCOMPLETE_SYMBOL'].includes(state)) return 'stability';
    if (['CHEVRON', 'TRIPLE_ARROW', 'BRAIDED_LINE'].includes(state)) return 'synergy';
    if (['BROKEN_CIRCLE', 'OFFSET_SHARDS', 'FRACTURED_TRIANGLE'].includes(state)) return 'corruption';
    return 'loadPressure';
};

// ============================================================================
// ENHANCED PICTOGRAM INSTANCE
// ============================================================================

class EnhancedPictogramInstance {
    constructor(mesh) {
        this.mesh = mesh;
        this.active = false;
        this.link = null;
        this._linkKey = null;
        this._stateKey = null;
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
        this.curveLength = null;
        this.frames = null;
        this.frameSegments = 0;
        this.spiralRadius = 0.25;
        this.extraLift = 0.0;
        this.spiralPhase = Math.random() * Math.PI * 2;
        this.orbitSpeed = CONFIG.SPIRAL_ROTATION_SPEED * (0.8 + Math.random() * 0.4);
        // Cached vectors to reduce allocations
        this._tmpPos = new THREE.Vector3();
        this._tmpTan = new THREE.Vector3();
        this._tmpNormal = new THREE.Vector3();
        this._tmpBinormal = new THREE.Vector3();
        this._tmpOffset = new THREE.Vector3();
        this._tmpMatrix = new THREE.Matrix4();
        this._up = new THREE.Vector3(0, 1, 0);
        this._altUp = new THREE.Vector3(1, 0, 0);
        this._warnedMissingCurve = false;

        // Visual
        this.size = CONFIG.SIZE_MEDIUM;
        this.baseOpacity = 0.7;
    }

    reset() {
        this.active = false;
        this._setVisibleRecursive(this.mesh, false);
        this.link = null;
        this.currentState = null;
        this.targetState = null;
        this.isMorphing = false;
        this.isSlowingForResistance = false;
        this.isOscillating = false;
        this.isAlignedByHealing = false;
        this.isTenseFromRupture = false;
        this._warnedMissingCurve = false;
    }

    spawn(link, layer, state, size, depthOffset, linkKey = null, metricType = 'loadPressure') {
        this.active = true;
        this.link = link;
        this._linkKey = linkKey;
        this._stateKey = state;
        this.metricType = metricType;
        this.layer = layer;
        this.currentState = state;
        this.size = size;
        this.depthOffset = depthOffset;
        this.depthLayer = layer === 'A' ? 0 : (layer === 'B' ? 1 : 2);
        
        this.linkProgress = Math.random();
        this.lateralPhase = Math.random() * Math.PI * 2;
        this.verticalPhase = Math.random() * Math.PI * 2;
        this.microRotationPhase = Math.random() * Math.PI * 2;
        this.spiralPhase = Math.random() * Math.PI * 2;
        this.curveLength = (link?.curve && link.curve.getLength ? link.curve.getLength() : null) ||
                           link?.userData?.length ||
                           null;
        this.prepareFrames(link);
        const envelope =
            link?.visualEnvelopeRadius ??
            link?.userData?.visualEnvelopeRadius ??
            link?.userData?.activeRadius ??
            link?.userData?.visualRadius ??
            0;
        const orbitMap = CONFIG.ORBIT_RADII || {};
        const metricOrbit = orbitMap[this.metricType] ?? orbitMap.loadPressure ?? 0.6;
        this.spiralRadius = Math.max(metricOrbit, envelope + (this.size * 0.6), 0.35);
        this.extraLift = Math.max(0.05, envelope * 0.1);
        
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
        
        this._setVisibleRecursive(this.mesh, true);
        this.mesh.scale.setScalar(size * VISIBILITY_SCALE * CONFIG.ORBITAL_SCALE_FACTOR);
        
        // Update geometry
        this.updateGeometry();
    }

    update(deltaTime, linkContext, cameraPosition) {
        // Always attempt spatial update first so position is available immediately
        this.updatePositionAlongLink(linkContext, cameraPosition);

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
        const normLen = this.curveLength || this.link?.userData?.length || 10.0;
        this.linkProgress += (speed * deltaTime) / normLen;
        
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
        this.spiralPhase += deltaTime * this.orbitSpeed * Math.PI * 2;

        // Update opacity
        this.updateOpacity();

        // Update micro-rotation
        this.updateMicroRotation();

        // Animate synergy arrow clusters (if present)
        if (this.mesh?.userData?.synergyArrows) {
            const pulse = 1 + Math.sin(this.age * 6) * 0.12;
            const rotSpeed = 2.5;
            this.mesh.userData.synergyArrows.forEach((cluster, idx) => {
                cluster.rotation.z += (cluster.userData.spinSpeed || 0.8) * deltaTime;
                const synergyBoost = (this.linkContextCache?.synergy || 0);
                const s = cluster.userData.baseScale * pulse * (1 + synergyBoost * 0.5);
                cluster.scale.setScalar(s);
            });
        }

        // Animate loadPressure spark along torus path
        if (this.mesh?.userData?.spark) {
            const glyph = this.mesh;
            const spark = glyph.userData.spark;
            const orbitGeom = glyph.userData.orbit1?.geometry;
            const baseR = orbitGeom?.parameters?.radius ?? glyph.userData.sparkOrbitRadius ?? 0.38;
            const scale = glyph.scale?.x ?? 1;
            const R = baseR * scale;
            const angle = this.age * 2.0;
            spark.position.set(Math.cos(angle) * R, Math.sin(angle) * R, 0);
            const pulse = 1 + Math.sin(this.age * 4) * 0.15;
            spark.scale.setScalar(pulse);
        }
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
        if (!this.link) return;
        const curve = this.link?.curve;
        const hasCurve = curve && typeof curve.getPointAt === 'function' && typeof curve.getTangentAt === 'function';
        const t = this.linkProgress % 1;

        const basePos = this._tmpPos;
        const tangent = this._tmpTan;
        const normal = this._tmpNormal;
        const binormal = this._tmpBinormal;

        if (hasCurve) {
            curve.getPointAt(t, basePos);
            curve.getTangentAt(t, tangent).normalize();
        } else {
            const nodeA = this.link.userData?.nodeA;
            const nodeB = this.link.userData?.nodeB;
            if (nodeA && nodeB) {
                basePos.lerpVectors(nodeA.position, nodeB.position, t);
                tangent.subVectors(nodeB.position, nodeA.position).normalize();
            } else {
                if (!this._warnedMissingCurve) {
                    console.warn('[PicDiag] NO CURVE OR NODES', this.link?.id || this.link?.uuid);
                    this._warnedMissingCurve = true;
                }
                return;
            }
        }

        // Build local frame from tangent (curve centerline)
        const upRef = Math.abs(tangent.dot(this._up)) > 0.99 ? this._altUp : this._up;
        normal.crossVectors(tangent, upRef).normalize();
        binormal.crossVectors(normal, tangent).normalize();

        // Helical offset around link centerline (true curve-following)
        const helixRadius = Math.max(0.08, this.spiralRadius || this.size * 0.4);
        const angle = this.spiralPhase + (t * CONFIG.SPIRAL_TURNS * Math.PI * 2);
        const offset = this._tmpOffset.copy(normal).multiplyScalar(Math.cos(angle) * helixRadius)
            .addScaledVector(binormal, Math.sin(angle) * helixRadius);

        basePos.add(offset);

        // Gentle bob & parallax in local frame
        basePos.addScaledVector(binormal, Math.sin(this.verticalPhase) * 0.05);
        if (cameraPosition) {
            const toCam = this._tmpOffset.subVectors(cameraPosition, basePos).normalize();
            basePos.addScaledVector(toCam, this.depthLayer * CONFIG.PARALLAX_STRENGTH * 0.1);
        }

        this.mesh.position.copy(basePos);
        this._tmpMatrix.makeBasis(normal, binormal, tangent);
        this.mesh.quaternion.setFromRotationMatrix(this._tmpMatrix);
    }

    prepareFrames(link) {
        this.frames = null;
        this.frameSegments = 0;
        const curve = link?.curve;
        if (!curve?.getLength || !curve?.getTangent) return;
        const seg = Math.max(12, Math.min(200, Math.floor((curve.getLength() || 10) * 6)));
        try {
            const frames = curve.computeFrenetFrames(seg, false);
            this.frames = frames;
            this.frameSegments = seg;
        } catch (_e) {
            this.frames = null;
            this.frameSegments = 0;
        }
    }

    updateOpacity() {
        const debugVis = (typeof window !== 'undefined' && window.__PIC_DEBUG_VIS__ === true);
        const fadeInEnd = debugVis ? Math.min(CONFIG.FADE_IN_DURATION, 0.2) : CONFIG.FADE_IN_DURATION;
        const fadeOutStart = this.lifetime - CONFIG.FADE_OUT_DURATION;
        
        let opacity = this.baseOpacity;

        // Fade in
        if (this.age < fadeInEnd) {
            opacity = this.baseOpacity; // no fade, keep bright
        }
        // Fade out
        else if (this.age > fadeOutStart) {
            opacity = this.baseOpacity; // no fade
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

        if (debugVis) {
            opacity = Math.max(opacity, 0.25);
        }

        this._setOpacityRecursive(this.mesh, Math.max(opacity, 0.95));
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

    _setVisibleRecursive(object, visible) {
        if (!object) return;
        object.visible = visible;
        if (object.children?.length) {
            object.children.forEach(child => this._setVisibleRecursive(child, visible));
        }
    }

    _setOpacityRecursive(object, opacity) {
        if (!object) return;
        const materials = Array.isArray(object.material) ? object.material : (object.material ? [object.material] : []);
        materials.forEach(material => {
            if (material && typeof material.opacity === 'number') {
                material.opacity = opacity;
                material.needsUpdate = true;
            }
        });
        if (object.children?.length) {
            object.children.forEach(child => this._setOpacityRecursive(child, opacity));
        }
    }
}

// ============================================================================
// MAIN ENHANCED PICTOGRAM SYSTEM
// ============================================================================

export class LinkSemanticPictogramSystem_Enhanced {
    constructor(scene, linkingSystem, camera, parentGroup = null) {
        this.scene = scene;
        this.linkingSystem = linkingSystem;
        this.camera = camera;
        this.parentGroup = parentGroup;

        this.enabled = true;

        // Pictogram pool (enhanced instances)
        this.pictograms = [];
        this.initializePictogramPool();

        // Per-link tracking
        this.linkImportanceScores = new Map(); // linkId -> importance score
        this.linkPictogramCounts = new Map();
        this.linkSpawnTimers = new Map();
        this.linkStateCounts = new Map(); // linkId -> Map(state -> count)
        this.linkMetricCounts = new Map(); // linkId -> Map(metric -> count)
        this._initializedLinks = new Set();
        this._lastLinks = [];

        // Update timer
        this.updateTimer = 0.0;

        // Geometry cache
        this.geometryCache = new Map();
        this.initializeGeometryCache();

        console.info('[PicDiag] Pictogram system constructed');
        this._diagLogged = false;
        this._debugSpawnLogged = false;
        this._diagOnceLinks = false;
        this._spawnDiagLast = 0;
        this._inactiveTimer = 0;
        this._lastRecoveryTime = 0;
    }

    // Stable link identifier (uuid → id → userData.id/linkId → generated token)
    getLinkKey(link) {
        if (!link) return null;
        const explicit =
            link.uuid ||
            link.id ||
            link.userData?.id ||
            link.userData?.linkId;
        if (explicit) return explicit;
        if (!link.__pictoId) {
            link.__pictoId = `picto-${Math.random().toString(36).slice(2, 10)}`;
        }
        return link.__pictoId;
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    initializePictogramPool() {
        const pictoRenderOrder =
            (VisualHierarchyRegistry.getRenderOrder && VisualHierarchyRegistry.getRenderOrder('LINK_PICTO'))
            || (VisualHierarchyRegistry.getRenderOrder && VisualHierarchyRegistry.getRenderOrder('LINK_PARTICLES'))
            || 246;
        const container = new THREE.Group();
        container.name = 'EnhancedPictogramContainer';
        const parent = this.parentGroup ||
                       this.scene;
        if (parent) parent.add(container);
        this.container = container;
        container.renderOrder = pictoRenderOrder;

        for (let i = 0; i < CONFIG.POOL_SIZE; i++) {
        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = createPictogramMaterial(CONFIG.BASE_COLOR, 0.7);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.visible = false;
        mesh.frustumCulled = false;
        mesh.renderOrder = pictoRenderOrder;
        // Never block node raycasts
            mesh.raycast = () => {};
            mesh.userData.ignoreRaycast = true;
            
            container.add(mesh);

            const instance = new EnhancedPictogramInstance(mesh);
            this.pictograms.push(instance);
        }
    }

    initializeGeometryCache() {
        // Temporarily disabled: pictogram library not used in current design phase.
        this.geometryCache.clear();
        console.log('[Enhanced] Geometry cache disabled for design focus');
    }

    _readNumericMetric(...values) {
        for (const value of values) {
            if (typeof value === 'number' && Number.isFinite(value)) {
                return value;
            }
        }
        return undefined;
    }

    _readLinkMetric(link, key, fallback = 0) {
        if (!link) return fallback;
        const userData = link.userData || {};
        const userMetrics = userData.metrics || {};
        const linkMetrics = link.metrics || {};
        const conduitMetrics = link.group?.userData?.conduitState?.metrics || {};

        let value;
        switch (key) {
            case 'synergy':
                value = this._readNumericMetric(
                    userData.synergy?.score,
                    userData.synergy?.synergyNorm,
                    userData.synergy,
                    userMetrics.synergy,
                    linkMetrics.synergy,
                    conduitMetrics.synergy,
                    link.synergyScore,
                    link.synergyLevel,
                    link.flow
                );
                break;
            case 'harmony':
                value = this._readNumericMetric(
                    userData.harmony,
                    userData.harmonyLevel,
                    userMetrics.harmony,
                    linkMetrics.harmony,
                    conduitMetrics.harmony,
                    link.harmonyLevel,
                    link.harmony
                );
                break;
            case 'corruption':
                value = this._readNumericMetric(
                    userData.corruption,
                    userData.corruptionLevel,
                    userMetrics.corruption,
                    linkMetrics.corruption,
                    conduitMetrics.corruption,
                    link.corruptionLevel,
                    link.corruption
                );
                break;
            case 'stability':
                value = this._readNumericMetric(
                    userData.stability,
                    userData.stabilityLevel,
                    userMetrics.stability,
                    linkMetrics.stability,
                    conduitMetrics.stability,
                    link.stability,
                    link.stabilityLevel
                );
                break;
            case 'instability':
                value = this._readNumericMetric(
                    userData.instability,
                    userData.instabilityLevel,
                    userMetrics.instability,
                    linkMetrics.instability,
                    conduitMetrics.instability,
                    link.instability,
                    link.instabilityLevel
                );
                break;
            case 'traffic':
                value = this._readNumericMetric(
                    link.traffic?.load,
                    userData.traffic?.load,
                    userData.traffic,
                    userMetrics.traffic,
                    linkMetrics.traffic,
                    conduitMetrics.traffic
                );
                break;
            case 'loadPressure':
                value = this._readNumericMetric(
                    link.loadPressure,
                    userData.loadPressure,
                    userMetrics.loadPressure,
                    linkMetrics.loadPressure,
                    conduitMetrics.loadPressure,
                    this._readLinkMetric(link, 'traffic', undefined)
                );
                break;
            case 'quality':
                value = this._readNumericMetric(
                    userData.quality?.score,
                    userData.quality,
                    userMetrics.quality,
                    linkMetrics.quality,
                    conduitMetrics.quality,
                    link.quality
                );
                break;
            default:
                value = this._readNumericMetric(
                    userData[key],
                    userMetrics[key],
                    linkMetrics[key],
                    conduitMetrics[key],
                    link[key]
                );
                break;
        }

        return value ?? fallback;
    }

    _readNodeMetric(node, key, fallback = 0) {
        if (!node) return fallback;
        const userData = node.userData || {};
        const metrics = userData.metrics || {};
        const value = this._readNumericMetric(
            userData[key],
            metrics[key],
            node[key]
        );
        return value ?? fallback;
    }

    // Ensure renderOrder / frustum settings propagate to nested glyph meshes
    _applyRenderSettings(object, fallbackRO) {
        if (!object) return;
        if (fallbackRO !== undefined && object.renderOrder === 0) {
            object.renderOrder = fallbackRO;
        }
        object.frustumCulled = false;
        if (object.children && object.children.length) {
            object.children.forEach(child => this._applyRenderSettings(child, object.renderOrder ?? fallbackRO));
        }
    }

    _findFirstMaterial(object) {
        if (!object) return null;
        if (object.material) {
            return Array.isArray(object.material) ? (object.material[0] || null) : object.material;
        }
        if (object.children?.length) {
            for (const child of object.children) {
                const material = this._findFirstMaterial(child);
                if (material) return material;
            }
        }
        return null;
    }

    // ========================================================================
    // UPDATE
    // ========================================================================

    update(deltaTime, time) {
        if (!this.enabled) return;
        const linksAvailable = this._getLinks?.() || [];
        if (!linksAvailable.length) {
            // Try cached links from previous frame
            if (!this._lastLinks?.length) return;
        } else {
            this._lastLinks = linksAvailable;
        }
        const links = linksAvailable.length ? linksAvailable : this._lastLinks;

        // Auto-rebind to live linkingSystem if ours is missing or stale (no links) but global has links
        const globalLS = getGlobalLinkSystem();
        if (
            globalLS &&
            (this.linkingSystem == null || this.linkingSystem !== globalLS) &&
            (this.linkingSystem?.links?.length || 0) === 0 &&
            (globalLS.links?.length || 0) > 0
        ) {
            console.warn('[PicDiag] rebind pictogram linkingSystem to live instance', {
                from: this.linkingSystem?.__debugId,
                to: globalLS.__debugId
            });
            this.linkingSystem = globalLS;
            this.__debugId = this.__debugId || `pictos-${Date.now().toString(36)}`;
        }

        this.updateTimer += deltaTime;
        if (this.updateTimer < CONFIG.UPDATE_INTERVAL) return;
        
        const actualDelta = this.updateTimer;
        this.updateTimer = 0.0;

        // Update link importance scores
        this.updateLinkImportanceScores();

        // Update spawn timers
        this.updateSpawnTimers(actualDelta);

        // Spawn new pictograms
        this.spawnPictograms(actualDelta, time);
        this.ensureMetricMinimums();

        // Update active pictograms
        const cameraPos = this.camera ? this.camera.position : null;
        this.updateActivePictograms(actualDelta, cameraPos);

        // Log when links become available
        const linkCount = this._getLinks().length;
        const worldReady = this.linkingSystem?.worldReady === true;
        const activeCount = this.pictograms.filter(p => p.active).length;
        if (!this._diagOnceLinks && linkCount > 0) {
            console.info('[PicDiag] links available', { sys: this.__debugId, links: linkCount });
            this._diagOnceLinks = true;
        }

        // Emergency: if links exist but nothing active, force one spawn immediately (once)
        if (worldReady && linkCount > 0 && activeCount === 0 && !this._diagImmediateForced) {
            const firstLink = this.linkingSystem.links[0];
            if (firstLink) {
                this.spawnPictogram(
                    firstLink,
                    'A',
                    'CIRCLE_RING',
                    CONFIG.SIZE_MEDIUM,
                    CONFIG.LAYER_A_DEPTH_OFFSET,
                    this.getLinkKey(firstLink),
                    'loadPressure'
                );
                this._diagImmediateForced = true;
                console.warn('[PicDiag] forced single spawn recovery (immediate)', {
                    sysId: this.__debugId,
                    linkId: firstLink.uuid || firstLink.id
                });
            }
        }
    }

    updateLinkImportanceScores() {
        const links = this._getLinks();
        if (!links.length) return;

        links.forEach(link => {
            const importance = this.calculateLinkImportance(link);
            const key = this.getLinkKey(link);
            if (key) this.linkImportanceScores.set(key, importance);
        });
    }

    calculateLinkImportance(link) {
        let score = 0.5; // Base importance

        const u = link.userData || {};

        // High synergy increases importance
        const synergyValue = this._readLinkMetric(link, 'synergy', link.glowData?.synergy ?? 0.5);
        score += synergyValue * 0.3;

        // High quality increases importance
        const quality = this._readLinkMetric(link, 'quality', 0.5);
        score += (quality - 0.5) * 0.2;

        // Critical state increases importance
        const nodeA = u.nodeA || link.source;
        const nodeB = u.nodeB || link.target;
        if (nodeA && nodeB) {
            const avgStability =
                (this._readNodeMetric(nodeA, 'stability', 1) + this._readNodeMetric(nodeB, 'stability', 1)) / 2;
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
        const links = this._getLinks();
        if (!links.length) return;

        links.forEach(link => {
            const linkId = this.getLinkKey(link);
            if (!linkId) return;
            const timer = this.linkSpawnTimers.get(linkId) || 0;
            this.linkSpawnTimers.set(linkId, timer + deltaTime);
        });
    }

    spawnPictograms(deltaTime = 0, time) {
        if (CONFIG.DETERMINISTIC_GLYPHS) return;
        const links = this._getLinks();
        if (!links.length) return;

        const nowMs = typeof time === 'number' ? time : (typeof performance !== 'undefined' ? performance.now() : Date.now());
        let spawnedThisTick = 0;

        links.forEach(link => {
            const linkId = this.getLinkKey(link);
            if (!linkId) return;
            const importance = this.linkImportanceScores.get(linkId) || 0.5;
            
            // Check spawn timer (adjusted by importance)
            const spawnInterval = CONFIG.SPAWN_INTERVAL_BASE / (0.5 + importance);
            const timer = this.linkSpawnTimers.get(linkId) || 0;
            if (timer < spawnInterval) return;

            // Check glyph count
            const maxGlyphs = this.getMaxGlyphsForLink(importance);
            const currentCount = this.linkPictogramCounts.get(linkId) || 0;
            if (currentCount >= maxGlyphs) return;
            if (currentCount >= CONFIG.MAX_GLYPHS_PER_LINK_ABSOLUTE) return;

            // Analyze link context
            const linkContext = this.analyzeLinkContext(link);

            // Decide which layer to spawn
            const layer = this.selectLayer(linkContext, currentCount);

            // Select state for this layer
            const state = this.selectStateForLayer(layer, linkContext) || 'CIRCLE_RING';
            const metricType = getMetricForState(state);

            // Per-state cap
            const stateCounts = this.linkStateCounts.get(linkId) || new Map();
            const stateCount = stateCounts.get(state) || 0;
            if (stateCount >= CONFIG.MAX_GLYPHS_PER_STATE) return;

            // Per-metric cap
            const metricCounts = this.linkMetricCounts.get(linkId) || new Map();
            const metricCount = metricCounts.get(metricType) || 0;
            const metricCap = (CONFIG.MAX_GLYPHS_PER_METRIC && CONFIG.MAX_GLYPHS_PER_METRIC[metricType]) ??
                              CONFIG.MAX_GLYPHS_PER_METRIC?.default ??
                              CONFIG.MAX_GLYPHS_PER_METRIC ?? 2;
            if (metricCount >= metricCap) return;

            // Select size based on importance
            const size = this.selectSizeByImportance(importance, layer);

            // Depth offset by layer
            const depthOffset = layer === 'A' ? CONFIG.LAYER_A_DEPTH_OFFSET :
                               (layer === 'B' ? CONFIG.LAYER_B_DEPTH_OFFSET : CONFIG.LAYER_C_DEPTH_OFFSET);

            // Spawn glyph
            this.spawnPictogram(link, layer, state, size, depthOffset, linkId);
            spawnedThisTick += 1;

            // Reset timer
            this.linkSpawnTimers.set(linkId, 0);

            // Update count
            this.linkPictogramCounts.set(linkId, currentCount + 1);
            stateCounts.set(state, stateCount + 1);
            this.linkStateCounts.set(linkId, stateCounts);
            metricCounts.set(metricType, metricCount + 1);
            this.linkMetricCounts.set(linkId, metricCounts);
        });

        const linkCount = this.linkingSystem?.links?.length || 0;
        const activeCount = this.pictograms.filter(p => p.active).length;
        const worldReady = this.linkingSystem?.worldReady === true;

        if (worldReady && linkCount > 0 && activeCount === 0) {
            this._inactiveTimer = (this._inactiveTimer || 0) + deltaTime;
        } else {
            this._inactiveTimer = 0;
        }

        if (
            worldReady &&
            linkCount > 0 &&
            activeCount === 0 &&
            (this._inactiveTimer || 0) >= 2.0 &&
            (!this._lastRecoveryTime || nowMs - this._lastRecoveryTime >= 2000)
        ) {
            const firstLink = this.linkingSystem.links[0];
            if (firstLink) {
                this.spawnPictogram(
                    firstLink,
                    'A',
                    'CIRCLE_RING',
                    CONFIG.SIZE_MEDIUM,
                    CONFIG.LAYER_A_DEPTH_OFFSET,
                    this.getLinkKey(firstLink)
                );
                this._lastRecoveryTime = nowMs;
                this._inactiveTimer = 0;
                spawnedThisTick += 1;
                console.warn('[PicDiag] forced single spawn recovery', {
                    sysId: this.__debugId,
                    linkId: firstLink.uuid || firstLink.id
                });
            }
        }

        if (!this._spawnDiagLast || nowMs - this._spawnDiagLast >= 1000) {
            console.info('[PicDiag] spawn tick', {
                sysId: this.__debugId,
                worldReady,
                linkCount,
                spawnedThisTick,
                activeCount
            });
            this._spawnDiagLast = nowMs;
        }

        // Maintain minimum global active pictograms while links exist
        if (worldReady && linkCount > 0 && activeCount < MIN_ACTIVE_GLOBAL) {
            const links = this.linkingSystem.links;
            let needed = MIN_ACTIVE_GLOBAL - activeCount;
            for (let i = 0; i < links.length && needed > 0; i++) {
                this.spawnPictogram(
                    links[i],
                    'A',
                    'CIRCLE_RING',
                    CONFIG.SIZE_MEDIUM,
                    CONFIG.LAYER_A_DEPTH_OFFSET
                );
                needed -= 1;
            }
        }

        // Throttled diagnostics (1x/s) to trace visibility issues
        const nowDiag = typeof performance !== 'undefined' ? performance.now() : Date.now();
        if (!this._diagLast || nowDiag - this._diagLast > 1000) {
            console.info('[PicDiag] state', {
                sys: this.__debugId,
                linkSys: this.linkingSystem?.__debugId,
                links: linkCount,
                worldReady,
                active: activeCount,
                pool: this.pictograms.length,
                containerVisible: this.container?.visible,
                containerRO: this.container?.renderOrder
            });
            this._diagLast = nowDiag;
        }

        // Safety: keep container visible
        if (this.container && this.container.visible === false) {
            this.container.visible = true;
        }
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
        const hasWeakSignal = dominant[1] < 0.4;

        // Select state from dominant category
        switch (hasWeakSignal ? 'fallback' : dominant[0]) {
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
            case 'fallback':
                // Ensure at least one pictogram even with flat metrics
                return 'CIRCLE_RING';
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
        const liveLinks = this._getLinks();
        this.pictograms.forEach(pictogram => {
            if (!pictogram.active) return;

            // If stored link instance is gone, try to rebind by uuid/id instead of dropping immediately
            if (!pictogram.link || !liveLinks.includes(pictogram.link)) {
                const linkId = this.getLinkKey(pictogram.link);
                const replacement = linkId ? liveLinks.find(l => this.getLinkKey(l) === linkId) : null;
                if (replacement) {
                    pictogram.link = replacement;
                } else {
                    pictogram.reset();
                    return;
                }
            }

            const linkContext = this.analyzeLinkContext(pictogram.link);
            pictogram.update(deltaTime, linkContext, cameraPos);

            // Animate orbital glyph layers
            if (pictogram._orbit1) pictogram._orbit1.rotation.x += deltaTime * 1.8;
            if (pictogram._orbit2) pictogram._orbit2.rotation.z += deltaTime * 1.5;
            if (pictogram.mesh) pictogram.mesh.rotation.y += deltaTime * 1.2;

            if (!pictogram.active) {
                const linkId = pictogram._linkKey || this.getLinkKey(pictogram.link);
                if (linkId) {
                    const count = this.linkPictogramCounts.get(linkId) || 0;
                    this.linkPictogramCounts.set(linkId, Math.max(0, count - 1));
                    const state = pictogram._stateKey || pictogram.currentState;
                    if (state) {
                        const stateCounts = this.linkStateCounts.get(linkId) || new Map();
                        const sc = stateCounts.get(state) || 0;
                        stateCounts.set(state, Math.max(0, sc - 1));
                        this.linkStateCounts.set(linkId, stateCounts);
                    }
                    const metric = pictogram.metricType || getMetricForState(pictogram.currentState);
                    if (metric) {
                        const metricCounts = this.linkMetricCounts.get(linkId) || new Map();
                        const mc = metricCounts.get(metric) || 0;
                        metricCounts.set(metric, Math.max(0, mc - 1));
                        this.linkMetricCounts.set(linkId, metricCounts);
                        this._initializedLinks.delete(linkId); // allow refill if a glyph disappears
                    }
                }
                pictogram._linkKey = null;
                pictogram._stateKey = null;
            }
        });
}
    // ========================================================================
    // LINK CONTEXT ANALYSIS
    // ========================================================================

    analyzeLinkContext(link) {
        if (!link) return this.getEmptyContext();

        const u = link.userData || {};

        // Prefer explicit node references, fall back to link endpoints
        const nodeA = u.nodeA || link.source || link.startNode || null;
        const nodeB = u.nodeB || link.target || link.endNode || null;

        // Metrics fallbacks: userData → link fields → safe defaults
        const linkHarmony = this._readLinkMetric(link, 'harmony', 0);
        const linkCorruption = this._readLinkMetric(link, 'corruption', 0);
        const linkStability = this._readLinkMetric(link, 'stability', 1);
        const avgHarmony =
            (this._readNodeMetric(nodeA, 'harmony', linkHarmony) + this._readNodeMetric(nodeB, 'harmony', linkHarmony)) / 2;
        const avgCorruption =
            (this._readNodeMetric(nodeA, 'corruption', linkCorruption) + this._readNodeMetric(nodeB, 'corruption', linkCorruption)) / 2;
        const avgStability =
            (this._readNodeMetric(nodeA, 'stability', linkStability) + this._readNodeMetric(nodeB, 'stability', linkStability)) / 2;

        const synergy = this._readLinkMetric(link, 'synergy', link.glowData?.synergy ?? 0.5);
        const loadPressure = this._readLinkMetric(link, 'loadPressure', 0);
        const traffic = this._readLinkMetric(link, 'traffic', 0);

        const instability = this._readLinkMetric(link, 'instability', 1.0 - avgStability);
        const isHealing = (nodeA?.userData?.isHealing ?? u.isHealing ?? false) ||
                          (nodeB?.userData?.isHealing ?? false);
        const healingIntensity = isHealing ? 0.7 : 0;

        // Standing wave detection
        const hasStandingWave = u.hasStandingWave ?? link.hasStandingWave ?? false;
        const standingWaveIntensity = hasStandingWave ? 0.6 : 0;

        // Resistance detection (high corruption + low synergy)
        const hasResistance = avgCorruption > 0.5 && synergy < 0.3;
        const resistance = hasResistance ? avgCorruption : 0;

        // Rupture risk
        const ruptureRisk = avgCorruption * (1.0 - avgStability);
        const ruptureImminent = ruptureRisk > 0.6;

        // Historical context
        const hasHistoricalRupture = u.hasHistoricalRupture ?? false;
        const hasHistoricalHealing = u.hasHistoricalHealing ?? false;

        const ctx = {
            harmony: avgHarmony,
            corruption: avgCorruption,
            synergy: synergy,
            loadPressure: loadPressure,
            traffic: traffic,
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

        // Cache for animation access
        this.linkContextCache = ctx;
        return ctx;
    }

    getEmptyContext() {
        return {
            harmony: 0,
            corruption: 0,
            synergy: 0,
            loadPressure: 0,
            traffic: 0,
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

    _getLinks() {
        if (Array.isArray(this._externalLinks) && this._externalLinks.length) {
            return this._externalLinks;
        }
        if (Array.isArray(this._lastLinks) && this._lastLinks.length) {
            return this._lastLinks;
        }
        // Prefer current linkingSystem links; fallback to global live system
        const local = this.linkingSystem?.links;
        if (Array.isArray(local) && local.length) return local;
        const globalLS = getGlobalLinkSystem();
        if (globalLS?.links) return globalLS.links;
        return [];
    }

    // ========================================================================
    // SPAWNING
    // ========================================================================

    spawnPictogram(link, layer, state, size, depthOffset, linkKey, metricType = 'loadPressure') {
        const pictogram = this.pictograms.find(p => !p.active);
        if (!pictogram) return;

        // Replace placeholder mesh with orbital glyph group
        const glyph = this.buildOrbitalGlyph(size, metricType);
        // Ensure container owns the glyph
        if (pictogram.mesh && pictogram.mesh.parent) {
            pictogram.mesh.parent.remove(pictogram.mesh);
        }
        this.container.add(glyph);
        if (!glyph.material) {
            glyph.material = this._findFirstMaterial(glyph);
        }
        pictogram.mesh = glyph;
        this._applyRenderSettings(glyph, glyph.renderOrder);
        pictogram._orbit1 = glyph.userData.orbit1;
        pictogram._orbit2 = glyph.userData.orbit2;
        pictogram._spark = glyph.userData.spark;

        pictogram.spawn(link, layer, state, size, depthOffset, linkKey, metricType);
        const debugVis = (typeof window !== 'undefined' && window.__PIC_DEBUG_VIS__ === true);
        if (debugVis && !this._debugSpawnLogged) {
            console.warn('PICTOGRAM SPAWN', state, link?.id);
            this._debugSpawnLogged = true;
        }
    }

    buildOrbitalGlyph(size, metricType = 'loadPressure') {
        const pictoRO = (VisualHierarchyRegistry.getRenderOrder && VisualHierarchyRegistry.getRenderOrder('LINK_PICTO')) || 246;
        const container = new THREE.Group();
        container.scale.setScalar(1.0);
        container.renderOrder = pictoRO;
        container.frustumCulled = false;

        // Dispatch to metric-specific visual builder
        let glyph = null;
        switch (metricType) {
            case 'synergy':
                glyph = this.buildSynergyArrowCluster(pictoRO);
                break;
            case 'harmony':
                glyph = this.buildHarmonyGlyph(size, pictoRO);
                break;
            case 'stability':
                glyph = this.buildStabilityGlyph(size, pictoRO);
                break;
            case 'corruption':
                glyph = this.buildCorruptionGlyph(size, pictoRO);
                break;
            case 'loadPressure':
            default:
                glyph = this.buildLoadPressureGlyph(size, pictoRO);
                break;
        }

        if (glyph) {
            glyph.renderOrder = pictoRO;
            container.add(glyph);
            // Preserve userData helpers if present
            if (glyph.userData) {
                container.userData = { ...container.userData, ...glyph.userData };
            }
        }

        return container;
    }

    ensureMetricMinimums() {
        const GLYPH_TYPES = ['harmony', 'stability', 'synergy', 'loadPressure', 'corruption'];
        const defaultStateByMetric = {
            harmony: 'CIRCLE_RING',
            stability: 'OFFSET_DOTS',
            synergy: 'CHEVRON',
            loadPressure: 'CIRCLE_RING',
            corruption: 'BROKEN_CIRCLE'
        };
        const size = CONFIG.SIZE_MEDIUM || 0.4;
        const depthOffset = CONFIG.LAYER_A_DEPTH_OFFSET;

        const links = this._getLinks();
        if (!links.length) return;

        links.forEach(link => {
            const linkId = this.getLinkKey(link);
            if (!linkId) return;

            // If link already fully initialized (caps satisfied), skip to avoid respawn loops
            if (this._initializedLinks.has(linkId)) return;

            const metricCounts = this.linkMetricCounts.get(linkId) || new Map();

            GLYPH_TYPES.forEach(metric => {
                const cap = (CONFIG.MAX_GLYPHS_PER_METRIC && CONFIG.MAX_GLYPHS_PER_METRIC[metric]) ??
                            CONFIG.MAX_GLYPHS_PER_METRIC?.default ?? 2;
                const current = metricCounts.get(metric) || 0;
                if (current >= cap) return;
                const state = defaultStateByMetric[metric] || 'CIRCLE_RING';
                const needed = cap - current;
                for (let i = 0; i < needed; i++) {
                    this.spawnPictogram(link, 'A', state, size, depthOffset, linkId, metric);
                    const mc = metricCounts.get(metric) || 0;
                    metricCounts.set(metric, mc + 1);
                    const stateCounts = this.linkStateCounts.get(linkId) || new Map();
                    const sc = stateCounts.get(state) || 0;
                    stateCounts.set(state, sc + 1);
                    this.linkStateCounts.set(linkId, stateCounts);
                    const total = this.linkPictogramCounts.get(linkId) || 0;
                    this.linkPictogramCounts.set(linkId, total + 1);
                }
            });

            this.linkMetricCounts.set(linkId, metricCounts);
            // Mark as initialized only if all caps reached
            const allSatisfied = GLYPH_TYPES.every(m => {
                const cap = (CONFIG.MAX_GLYPHS_PER_METRIC && CONFIG.MAX_GLYPHS_PER_METRIC[m]) ??
                            CONFIG.MAX_GLYPHS_PER_METRIC?.default ?? 2;
                const count = metricCounts.get(m) || 0;
                return count >= cap;
            });
            if (allSatisfied) this._initializedLinks.add(linkId);
        });
    }

    // Load pressure torus-based glyph (existing visual)
    buildLoadPressureGlyph(size = 1.0, renderOrder = 246) {
        const group = new THREE.Group();
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0x5a2ea6,
            transparent: true,
            opacity: 1.0,
            depthTest: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        const core = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.05, 8, 24), coreMat);
        core.renderOrder = renderOrder;
        group.add(core);

        const orbitMat = coreMat.clone();
        const orbit1 = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.02, 8, 24), orbitMat);
        orbit1.renderOrder = renderOrder;
        group.add(orbit1);

        const orbit2 = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.02, 8, 24), orbitMat);
        orbit2.rotation.set(Math.PI / 4, 0, Math.PI / 6);
        orbit2.renderOrder = renderOrder;
        group.add(orbit2);

        const sparkMat = new THREE.MeshBasicMaterial({
            color: 0xffaa33,
            transparent: true,
            opacity: 1.0,
            depthTest: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        const spark = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), sparkMat);
        spark.renderOrder = renderOrder;
        group.add(spark);

        group.userData.orbit1 = orbit1;
        group.userData.orbit2 = orbit2;
        group.userData.spark = spark;
        group.userData.sparkOrbitRadius = orbit1.geometry.parameters.radius * size; // parametric torus orbit radius
        return group;
    }

    buildSynergyArrowCluster(renderOrder) {
        const cluster = new THREE.Group();
        const mat = new THREE.MeshBasicMaterial({
            color: 0x66ffff,
            transparent: true,
            opacity: 1.0,
            depthTest: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });

        // Infinity loop made from two small rings
        const ringA = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 12, 24), mat.clone());
        ringA.position.x = -0.12;
        ringA.rotation.y = Math.PI / 2;
        ringA.renderOrder = renderOrder;

        const ringB = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 12, 24), mat.clone());
        ringB.position.x = 0.12;
        ringB.rotation.y = Math.PI / 2;
        ringB.renderOrder = renderOrder;

        cluster.add(ringA);
        cluster.add(ringB);

        cluster.userData.arrows = [ringA, ringB];
        cluster.userData.baseScale = 1.0;
        cluster.userData.phase = Math.random() * Math.PI * 2;
        cluster.userData.spinSpeed = 0.8; // radians per second around Z
        return cluster;
    }

    // Harmony glyph: two interlocking cyan rings
    buildHarmonyGlyph(size = 1.0, renderOrder = 246) {
        const group = new THREE.Group();
        const mat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 1.0,
            depthTest: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        const ringA = new THREE.Mesh(new THREE.TorusGeometry(size * 0.5, size * 0.08, 12, 32), mat);
        ringA.position.set(-size * 0.15, 0, 0);
        ringA.renderOrder = renderOrder;

        const ringB = new THREE.Mesh(new THREE.TorusGeometry(size * 0.5, size * 0.08, 12, 32), mat.clone());
        ringB.position.set(size * 0.15, 0, 0);
        ringB.rotation.y = Math.PI / 2;
        ringB.renderOrder = renderOrder;

        group.add(ringA);
        group.add(ringB);

        group.userData.rotors = [ringA, ringB];
        return group;
    }

    // Stability glyph: square frame + inner rotated square
    buildStabilityGlyph(size = 1.0, renderOrder = 246) {
        const group = new THREE.Group();
        const mat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1.0,
            depthTest: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });

        // Outer square frame via shape with hole (hollow square)
        const outer = size * 0.6;
        const inner = size * 0.42;
        const shape = new THREE.Shape();
        shape.moveTo(-outer, -outer);
        shape.lineTo(outer, -outer);
        shape.lineTo(outer, outer);
        shape.lineTo(-outer, outer);
        shape.lineTo(-outer, -outer);
        const hole = new THREE.Path();
        hole.moveTo(-inner, -inner);
        hole.lineTo(inner, -inner);
        hole.lineTo(inner, inner);
        hole.lineTo(-inner, inner);
        hole.lineTo(-inner, -inner);
        shape.holes.push(hole);

        const frameGeom = new THREE.ExtrudeGeometry(shape, {
            depth: size * 0.02,
            bevelEnabled: false
        });
        frameGeom.rotateX(-Math.PI / 2);
        const frame = new THREE.Mesh(frameGeom, mat);
        frame.renderOrder = renderOrder;
        group.add(frame);

        // Inner diamond (rotated square)
        const innerGeom = new THREE.PlaneGeometry(size * 0.55, size * 0.55);
        const innerMesh = new THREE.Mesh(innerGeom, mat.clone());
        innerMesh.rotation.z = Math.PI / 4;
        innerMesh.position.set(0, 0, size * 0.015);
        innerMesh.renderOrder = renderOrder;
        group.add(innerMesh);

        group.userData.rotor = innerMesh;
        return group;
    }

    // Corruption glyph: fractured ring of arc segments
    buildCorruptionGlyph(size = 1.0, renderOrder = 246) {
        const group = new THREE.Group();
        const mat = new THREE.MeshBasicMaterial({
            color: 0xff0044,
            transparent: true,
            opacity: 1.0,
            depthTest: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });

        const segCount = 5;
        const outerRadius = 0.35 * size;
        const tube = 0.04 * size;
        const arc = Math.PI * 0.35;

        const segments = [];

        // Inner fractured ring
        for (let i = 0; i < segCount; i++) {
            const segGeom = new THREE.TorusGeometry(outerRadius, tube, 8, 32, arc);
            const seg = new THREE.Mesh(segGeom, mat.clone());
            seg.rotation.z = i * 1.2;
            seg.position.x += Math.sin(i) * 0.05 * size;
            seg.renderOrder = renderOrder;
            group.add(seg);
            segments.push(seg);
        }

        // Outer fractured ring (opposite rotation direction)
        for (let i = 0; i < segCount; i++) {
            const segGeom = new THREE.TorusGeometry(outerRadius * 1.12, tube, 8, 32, arc);
            const seg = new THREE.Mesh(segGeom, mat.clone());
            seg.rotation.z = -i * 1.2;
            seg.position.x += Math.sin(i + 0.5) * 0.05 * size;
            seg.renderOrder = renderOrder;
            group.add(seg);
            segments.push(seg);
        }

        group.userData.rotors = segments;
        group.userData.spinSpeed = 0.25; // radians per second around Z
        return group;
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
