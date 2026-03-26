/**
 * ============================================================================
 * HARMONIC RESONANCE FEEDBACK SYSTEM
 * ============================================================================
 * 
 * Composite glyphs emit subtle resonance fields that influence nearby link motion.
 * 
 * CORE PHILOSOPHY:
 * Meaning shapes motion. Composite glyphs (synthesized semantic structures)
 * gently bend the surrounding network flow—not controlling, but guiding
 * through harmonic resonance.
 * 
 * This is a closed visual feedback loop where emergent structures
 * influence the motion they help coordinate.
 * 
 * ============================================================================
 * 
 * RESONANCE MECHANICS:
 * 
 * 1. RESONANCE FIELD
 *    - Each active composite glyph emits a soft spatial field
 *    - Field radius scales with harmony/synergy
 *    - Field strength decays inversely with distance
 *    - No hard boundary (gaussian falloff)
 * 
 * 2. INFLUENCED ELEMENTS
 *    - Nearby Links: Wave motion aligns to glyph rhythm, phase drifts toward resonance
 *    - Energy Streaks: Slight curvature bias, speed sync with glyph pulse
 *    - Pictogram Flow: Non-fused glyphs slow/improve spacing/align nearby
 * 
 * 3. STATE MODULATION
 *    - Harmony expands influence, improves alignment, stabilizes motion
 *    - Corruption distorts field, causes misalignment, reduces range
 *    - Synergy improves rhythmic coherence, makes feedback legible
 *    - Instability weakens feedback, no noise added
 * 
 * 4. TEMPORAL BEHAVIOR
 *    - Resonance builds gradually during synthesis
 *    - Peaks while composite glyph is stable
 *    - Decays smoothly after separation
 *    - No instantaneous effects
 * 
 * VISUAL RESTRAINT:
 * - NO new particles, glow bursts, color changes, or motion overrides
 * - YES subtle phase influence, gentle smoothing, calm authority
 * 
 * ============================================================================
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { getLinkSynergyVisualMetrics } from './SemanticMetricAdapter.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // Resonance field
    BASE_RESONANCE_RADIUS: 3.5,      // Base influence radius (POLISHED: reduced from 4.0 for tighter, calmer fields)
    MIN_RESONANCE_RADIUS: 2.0,
    MAX_RESONANCE_RADIUS: 6.0,       // POLISHED: reduced from 7.0 to prevent excessive spread
    RESONANCE_DECAY_POWER: 2.5,      // POLISHED: increased from 2.0 for faster, smoother falloff
    
    // Harmony/Corruption modulation
    HARMONY_RADIUS_MULTIPLIER: 1.35, // POLISHED: reduced from 1.5 (calmer expansion)
    CORRUPTION_RADIUS_MULTIPLIER: 0.6, // POLISHED: increased from 0.5 (less dramatic collapse)
    
    // Alignment strength - POLISH: Reduced all values for subtle influence
    BASE_ALIGNMENT_STRENGTH: 0.22,   // POLISHED: reduced from 0.3 (22% influence - more subtle)
    HARMONY_ALIGNMENT_BOOST: 1.3,    // POLISHED: reduced from 1.4 (28.6% max - calmer)
    CORRUPTION_ALIGNMENT_DAMPEN: 0.5, // POLISHED: increased from 0.4 (11% min - less harsh)
    SYNERGY_ALIGNMENT_BOOST: 1.2,    // POLISHED: reduced from 1.3 (calmer synergy boost)
    
    // Phase drift - POLISH: Slower, more deliberate motion
    BASE_PHASE_DRIFT_SPEED: 0.4,     // POLISHED: reduced from 0.5 (slower, weighted drift)
    HARMONY_PHASE_SPEED: 0.6,        // POLISHED: reduced from 0.7 (more deliberate)
    CORRUPTION_PHASE_SPEED: 0.25,    // POLISHED: increased from 0.2 (less jarring slowdown)
    
    // Energy streak influence - POLISH: More conservative
    STREAK_CURVATURE_STRENGTH: 0.12, // POLISHED: reduced from 0.15 (gentler bias)
    STREAK_SPEED_MODULATION: 0.15,   // POLISHED: reduced from 0.2 (±15% - calmer variation)
    
    // Pictogram flow influence - POLISH: Refined for smoothness
    PICTOGRAM_SLOW_FACTOR: 0.88,     // POLISHED: increased from 0.85 (12% slowdown - less dramatic)
    PICTOGRAM_SPACING_IMPROVEMENT: 1.12, // POLISHED: reduced from 1.15 (12% - subtle improvement)
    PICTOGRAM_ALIGNMENT_STRENGTH: 0.5, // POLISHED: reduced from 0.6 (softer orientation)
    
    // Temporal ramp - POLISH: Smoother transitions
    RESONANCE_BUILD_DURATION: 1.5,   // POLISHED: increased from 1.2 (slower, calmer ramp-up)
    RESONANCE_DECAY_DURATION: 2.0,   // POLISHED: increased from 1.5 (longer, graceful fade)
    
    // Performance
    MAX_INFLUENCED_LINKS_PER_ZONE: 12, // Hard cap for performance
    UPDATE_INTERVAL: 1 / 30,            // Skip intervals for perf
    
    // Debug
    DEBUG_DRAW_FIELDS: false
};

function computeAttenuation(distance, radius) {
    if (!Number.isFinite(distance) || !Number.isFinite(radius) || radius <= 0) return 0;
    return Math.max(0, 1 - distance / radius);
}

// ============================================================================
// RESONANCE FIELD STATE
// ============================================================================

class ResonanceField {
    constructor() {
        this.active = false;
        this.position = new THREE.Vector3();
        this.compositeGlyph = null;  // Reference to composite glyph instance
        
        // Current strength
        this.strength = 0.0;           // 0-1 (ramps up/down)
        this.targetStrength = 1.0;    // Target after ramp-up
        
        // Pulse rhythm
        this.pulsePhase = 0.0;         // For oscillating field strength
        this.pulsePeriod = 2.0;        // 2-second pulse period
        
        // State influence
        this.harmonyBalance = 0.5;
        this.synergy = 0.5;
        this.stability = 0.5;
        
        // Influenced links tracking
        this.influencedLinks = [];      // Array of {link, distance, influenceStrength}
        this.influencedGlyphs = [];     // Array of {pictogram, distance}
        
        // Age tracking
        this.age = 0.0;
        this.rampAge = 0.0;
    }
    
    reset() {
        this.active = false;
        this.compositeGlyph = null;
        this.strength = 0.0;
        this.targetStrength = 1.0;
        this.age = 0.0;
        this.rampAge = 0.0;
        this.pulsePhase = 0.0;
        this.influencedLinks.length = 0;
        this.influencedGlyphs.length = 0;
    }
    
    initialize(compositeGlyph, harmonyBalance, synergy, stability) {
        this.active = true;
        this.compositeGlyph = compositeGlyph;
        this.harmonyBalance = harmonyBalance;
        this.synergy = synergy;
        this.stability = stability;
        this.strength = 0.0;
        this.targetStrength = 1.0;
        this.age = 0.0;
        this.rampAge = 0.0;
        this.pulsePhase = 0.0;
    }
    
    // ========================================================================
    // FIELD PROPERTIES
    // ========================================================================
    
    getRadius() {
        let radius = CONFIG.BASE_RESONANCE_RADIUS;
        
        // Harmony/corruption modulation
        const harmonyInfluence = this.harmonyBalance - 0.5; // -0.5 to +0.5
        if (harmonyInfluence > 0) {
            radius *= (1.0 + harmonyInfluence * (CONFIG.HARMONY_RADIUS_MULTIPLIER - 1.0));
        } else {
            radius *= (1.0 + harmonyInfluence * (1.0 - CONFIG.CORRUPTION_RADIUS_MULTIPLIER));
        }

        const stabilityScale = 0.9 + (Number.isFinite(this.stability) ? this.stability : 0.5) * 0.2;
        radius *= stabilityScale;
        
        return Math.max(CONFIG.MIN_RESONANCE_RADIUS, 
                       Math.min(CONFIG.MAX_RESONANCE_RADIUS, radius));
    }
    
    getPhaseDriftSpeed() {
        const harmonyInfluence = this.harmonyBalance - 0.5;
        const stability = Number.isFinite(this.stability) ? this.stability : 0.5;
        const stabilityDampening = 1.0 - Math.max(0.0, stability - 0.5) * 0.25;
        if (harmonyInfluence > 0) {
            return CONFIG.HARMONY_PHASE_SPEED * stabilityDampening;
        } else {
            return CONFIG.CORRUPTION_PHASE_SPEED * stabilityDampening;
        }
    }
    
    // ========================================================================
    // DISTANCE-BASED INFLUENCE
    // ========================================================================
    
    getInfluenceAtDistance(distance) {
        const radius = this.getRadius();
        if (distance > radius) return 0.0;

        const stability = Number.isFinite(this.stability) ? this.stability : 0.5;
        const stabilityScale = 0.85 + stability * 0.3;
        return this.strength * computeAttenuation(distance, radius) * stabilityScale;
    }
    
    // ========================================================================
    // UPDATE
    // ========================================================================
    
    update(deltaTime) {
        if (!this.active) return;
        this.age += deltaTime;
        this.rampAge += deltaTime;
        
        // POLISHED: Smooth ease-in-out ramp (no linear transitions)
        const rawProgress = Math.min(1.0, this.rampAge / CONFIG.RESONANCE_BUILD_DURATION);
        const easedProgress = this.smoothEaseInOut(rawProgress);
        
        // Interpolate toward target with eased curve
        const diff = this.targetStrength - this.strength;
        this.strength += diff * easedProgress * 0.1;  // POLISHED: Smooth asymptotic approach
        
        // Pulse modulation (adds subtle rhythm)
        this.pulsePhase += deltaTime * (Math.PI * 2 / this.pulsePeriod);
        if (this.pulsePhase > Math.PI * 2) {
            this.pulsePhase -= Math.PI * 2;
        }
    }
    
    // POLISHED: Smooth ease-in-out curve (S-curve)
    smoothEaseInOut(t) {
        return t * t * (3.0 - 2.0 * t);
    }
    
    // Initiate fade-out (after composite glyph separates)
    startDecay() {
        this.targetStrength = 0.0;
    }
    
    isDecayed() {
        return this.targetStrength === 0.0 && this.strength < 0.01;
    }
}

// ============================================================================
// MAIN HARMONIC RESONANCE FEEDBACK SYSTEM
// ============================================================================

export class HarmonicResonanceFeedbackSystem {
    constructor(scene) {
        this.scene = scene;
        this.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_LINK_RESONANCE);
        
        // Resonance fields (one per composite glyph)
        this.resonanceFields = [];
        for (let i = 0; i < 20; i++) {  // Match max composite glyphs
            this.resonanceFields.push(new ResonanceField());
        }
        
        // Update tracking
        this.updateTimer = 0.0;
        this.lastLinkCount = 0;
        
        // Debug
        this.debugFieldVisualization = null;
        if (CONFIG.DEBUG_DRAW_FIELDS) {
            this.setupDebugVisualization();
        }
        
        this.enabled = true;
        this.timeBudgetMs = 3.5;         // soft per-frame budget to avoid stalls
        this._influenceCursor = 0;       // round-robin field processing pointer
        
        console.log('[HarmonicResonanceFeedbackSystem] Initialized');
    }
    
    // ========================================================================
    // ACTIVATION / DEACTIVATION
    // ========================================================================
    
    activateResonanceField(compositeGlyph, harmonyBalance, synergy, stability) {
        // Find available field
        for (let field of this.resonanceFields) {
            if (!field.active) {
                field.initialize(compositeGlyph, harmonyBalance, synergy, stability);
                return field;
            }
        }
        return null;
    }
    
    deactivateResonanceField(compositeGlyph) {
        for (let field of this.resonanceFields) {
            if (field.compositeGlyph === compositeGlyph && field.active) {
                field.startDecay();
                break;
            }
        }
    }
    
    // ========================================================================
    // UPDATE LOOP
    // ========================================================================
    
    update(deltaTime, fusionZoneManager, pictogramsArray, linkingSystem) {
        if (!this.enabled) return;
        
        this.updateTimer += deltaTime;
        if (this.updateTimer < CONFIG.UPDATE_INTERVAL) return;
        this.updateTimer = 0.0;
        const frameStartMs = performance.now();
        
        // Update all resonance fields
        this.updateResonanceFields(deltaTime, fusionZoneManager);
        
        // Apply influences to links and glyphs
        this.applyResonanceInfluences(deltaTime, pictogramsArray, linkingSystem, frameStartMs, this.timeBudgetMs);
        
        // Update debug visualization
        if (CONFIG.DEBUG_DRAW_FIELDS) {
            this.updateDebugVisualization();
        }
    }
    
    // ========================================================================
    // RESONANCE FIELD UPDATES
    // ========================================================================
    
    updateResonanceFields(deltaTime, fusionZoneManager) {
        // Update all active fields
        for (let field of this.resonanceFields) {
            if (!field.active) continue;
            
            field.update(deltaTime);
            
            // Check if composite glyph is still active
            if (field.compositeGlyph && field.compositeGlyph.active) {
                // POLISHED: Only update position if actually changed (micro-optimization)
                const newPos = field.compositeGlyph.mesh.position;
                if (Math.abs(newPos.x - field.position.x) > 0.001 ||
                    Math.abs(newPos.y - field.position.y) > 0.001 ||
                    Math.abs(newPos.z - field.position.z) > 0.001) {
                    field.position.copy(newPos);
                }
            }
            
            // Check if fully decayed
            if (field.isDecayed()) {
                field.reset();
            }
        }
        
        // Activate new fields for recently synthesized composites
        if (fusionZoneManager && fusionZoneManager.compositeGlyphs) {
            for (let composite of fusionZoneManager.compositeGlyphs) {
                if (!composite.active) continue;
                
                // Check if this composite already has a field
                let hasField = false;
                for (let field of this.resonanceFields) {
                    if (field.compositeGlyph === composite) {
                        hasField = true;
                        break;
                    }
                }
                
                if (!hasField && composite.state) {
                    // Create new field for this composite
                    const state = composite.state;
                    const harmonyBalance = Number.isFinite(state?.harmonyBalance)
                        ? state.harmonyBalance
                        : Number.isFinite(state?.harmonBalance)
                            ? state.harmonBalance
                            : Number.isFinite(state?.harmony)
                                ? state.harmony
                                : 0.5;
                    const synergy = Number.isFinite(state?.averageSynergy)
                        ? state.averageSynergy
                        : Number.isFinite(state?.synergy)
                            ? state.synergy
                            : 0.5;
                    const stability = Number.isFinite(state?.stability)
                        ? state.stability
                        : 0.7;
                    this.activateResonanceField(
                        composite,
                        harmonyBalance,
                        synergy,
                        stability
                    );
                }
            }
        }
        
        // Deactivate fields for separated composites
        for (let i = 0; i < this.resonanceFields.length; i++) {
            const field = this.resonanceFields[i];
            if (!field.active) continue;
            
            if (field.compositeGlyph && !field.compositeGlyph.active) {
                field.startDecay();
            }
        }
    }
    
    // ========================================================================
    // RESONANCE INFLUENCE APPLICATION
    // ========================================================================
    
    applyResonanceInfluences(deltaTime, pictogramsArray, linkingSystem, frameStartMs, budgetMs) {
        if (!pictogramsArray || !linkingSystem) return;
        const totalFields = this.resonanceFields.length;
        if (totalFields === 0) return;

        let processed = 0;

        // Round-robin through fields to avoid starving later entries when budget hits
        while (processed < totalFields) {
            const idx = (this._influenceCursor + processed) % totalFields;
            const field = this.resonanceFields[idx];
            processed += 1;
            if (!field.active || field.strength < 0.01) continue;
            
            // Find influenced links and glyphs
            this.findInfluencedElements(field, pictogramsArray, linkingSystem);
            
            // Apply influences
            this.applyLinkInfluence(field, deltaTime);
            this.applyPictogramInfluence(field, deltaTime);

            // Time budget guard: exit early and resume next frame
            if (performance.now() - frameStartMs > budgetMs) {
                this._influenceCursor = (idx + 1) % totalFields;
                return;
            }
        }

        // Completed full pass; reset cursor
        this._influenceCursor = 0;
    }
    
    findInfluencedElements(field, pictogramsArray, linkingSystem) {
        field.influencedLinks.length = 0;
        field.influencedGlyphs.length = 0;
        
        if (!pictogramsArray) return;
        
        const maxLinks = CONFIG.MAX_INFLUENCED_LINKS_PER_ZONE;
        const candidates = [];
        
        // Scan pictograms for nearby links
        for (let pictogram of pictogramsArray) {
            if (!pictogram.active || !pictogram.link) continue;
            
            const link = pictogram.link;
            
            // Find center of link (midpoint)
            const linkPos = this.getLinkPosition(link);
            if (!linkPos) continue;
            
            const distance = linkPos.distanceTo(field.position);
            const influence = field.getInfluenceAtDistance(distance);
            
            if (influence > 0.01) {
                candidates.push({
                    pictogram,
                    link,
                    distance,
                    influence,
                    linkPos
                });
            }
        }
        
        // Sort by distance and keep top N
        candidates.sort((a, b) => a.distance - b.distance);
        
        for (let i = 0; i < Math.min(maxLinks, candidates.length); i++) {
            const cand = candidates[i];
            field.influencedLinks.push({
                pictogram: cand.pictogram,
                link: cand.link,
                distance: cand.distance,
                influenceStrength: cand.influence,
                linkPos: cand.linkPos
            });
        }
    }
    
    getLinkPosition(link) {
        const visualState = this._getLinkVisualState(link);
        const curve = visualState?.mainCurve?.getPointAt ? visualState.mainCurve
            : visualState?.curve?.getPointAt ? visualState.curve
            : null;

        if (curve?.getPointAt) {
            return curve.getPointAt(0.5, new THREE.Vector3());
        }

        const endpoints = this._getLinkEndpoints(link);
        if (endpoints.startPos && endpoints.endPos) {
            return new THREE.Vector3().addVectors(endpoints.startPos, endpoints.endPos).multiplyScalar(0.5);
        }

        if (link?.geometry?.attributes?.position) {
            const positions = link.geometry.attributes.position;
            const count = positions.count;
            if (count > 0) {
                const midIndex = Math.floor(count / 2);
                return new THREE.Vector3(
                    positions.getX(midIndex),
                    positions.getY(midIndex),
                    positions.getZ(midIndex)
                );
            }
        }

        return null;
    }
    
    // ========================================================================
    // LINK INFLUENCE
    // ========================================================================
    
    applyLinkInfluence(field, deltaTime) {
        const phaseDriftSpeed = field.getPhaseDriftSpeed();
        
        for (let item of field.influencedLinks) {
            if (!item.link || !item.link.userData) continue;
            
            const userData = item.link.userData;
            const synergyProfile = getLinkSynergyVisualMetrics(item.link) ?? {};
            const targetAlignment = THREE.MathUtils.clamp(
                ((Number.isFinite(synergyProfile.synergy) ? synergyProfile.synergy : 0) +
                 (Number.isFinite(item.link.userData.metrics?.harmony) ? item.link.userData.metrics.harmony : 0)) * 0.5,
                0,
                1
            );
            const previousAlignment = Number.isFinite(userData._alignmentStrength)
                ? userData._alignmentStrength
                : targetAlignment;
            const alignmentStrength = previousAlignment + (targetAlignment - previousAlignment) * 0.1;
            userData._alignmentStrength = alignmentStrength;
            
            // Apply phase alignment
            // Phase property typically stored in userData for wave effects
            if (typeof userData.phase === 'number') {
                const phaseInfluence = alignmentStrength * item.influenceStrength;
                const targetPhase = field.compositeGlyph?.mesh?.rotation?.z || 0;
                
                const phaseDelta = targetPhase - userData.phase;
                const wrappedDelta = this.wrapAngle(phaseDelta);
                
                userData.phase += wrappedDelta * phaseInfluence * deltaTime;
            }
            
            // Smooth motion coherence (no override, just gentling)
            if (userData.oscillationPhase !== undefined) {
                // Reduce abruptness of oscillations
                if (userData.oscillationAmplitude !== undefined) {
                    userData.oscillationAmplitude = THREE.MathUtils.lerp(
                        userData.oscillationAmplitude,
                        userData.oscillationAmplitude * 0.95,  // Subtle smoothing
                        item.influenceStrength * 0.1
                    );
                }
            }
        }
    }

    _getLinkVisualState(link) {
        return link?.group?.userData?.conduitState || null;
    }

    _getLinkEndpoints(link) {
        const startNode = link?.sourceNode || link?.source || link?.from || link?.nodeA || null;
        const endNode = link?.targetNode || link?.target || link?.to || link?.nodeB || null;

        return {
            startNode,
            endNode,
            startPos: startNode?.position || null,
            endPos: endNode?.position || null
        };
    }
    
    wrapAngle(angle) {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    }
    
    // ========================================================================
    // PICTOGRAM INFLUENCE
    // ========================================================================
    
    applyPictogramInfluence(field, deltaTime) {
        for (let item of field.influencedLinks) {
            const pictogram = item.pictogram;
            if (!pictogram || pictogram.userData === undefined) continue;
            
            // Only affect non-fused pictograms
            if (pictogram.isFused) continue;
            
            const influence = item.influenceStrength;
            
            // Gentle slowdown
            if (pictogram.userData.drift !== undefined) {
                pictogram.userData.drift *= THREE.MathUtils.lerp(
                    1.0,
                    CONFIG.PICTOGRAM_SLOW_FACTOR,
                    influence * 0.3
                );
            }
            
            // Improve spacing (increase interval)
            if (pictogram.userData.spawnInterval !== undefined) {
                pictogram.userData.spawnInterval *= THREE.MathUtils.lerp(
                    1.0,
                    CONFIG.PICTOGRAM_SPACING_IMPROVEMENT,
                    influence * 0.2
                );
            }
            
            // Gentle orientation alignment toward resonance center
            if (pictogram.mesh && field.compositeGlyph && field.compositeGlyph.mesh) {
                const dirToResonance = field.position
                    .clone()
                    .sub(item.linkPos)
                    .normalize();
                
                // Add subtle rotation bias (not override)
                const targetRot = Math.atan2(dirToResonance.y, dirToResonance.x);
                const currentRot = pictogram.mesh.rotation.z || 0;
                
                const rotDelta = this.wrapAngle(targetRot - currentRot);
                pictogram.mesh.rotation.z += rotDelta * influence * 0.05 * deltaTime;
            }
        }
    }
    
    // ========================================================================
    // ENABLE / DISABLE
    // ========================================================================
    
    enable() {
        this.enabled = true;
        console.log('[HarmonicResonanceFeedbackSystem] ENABLED');
    }
    
    disable() {
        this.enabled = false;
        for (let field of this.resonanceFields) {
            field.reset();
        }
        console.log('[HarmonicResonanceFeedbackSystem] DISABLED');
    }
    
    // ========================================================================
    // DEBUG VISUALIZATION
    // ========================================================================
    
    setupDebugVisualization() {
        const container = new THREE.Group();
        container.name = 'ResonanceFieldDebug';
        container.renderOrder = this.renderOrder;
        this.scene.add(container);
        this.debugFieldVisualization = container;
    }
    
    updateDebugVisualization() {
        if (!this.debugFieldVisualization) return;
        
        // Clear old visuals
        while (this.debugFieldVisualization.children.length > 0) {
            this.debugFieldVisualization.remove(this.debugFieldVisualization.children[0]);
        }
        
        // Draw active field spheres
        for (let field of this.resonanceFields) {
            if (!field.active || field.strength < 0.01) continue;
            
            const radius = field.getRadius();
            const geometry = new THREE.SphereGeometry(radius, 16, 16);
            const material = new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: field.strength * 0.2,
                wireframe: true
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(field.position);
            mesh.renderOrder = this.renderOrder;
            this.debugFieldVisualization.add(mesh);
        }
    }
    
    // ========================================================================
    // STATUS & CONSOLE API
    // ========================================================================
    
    getStatus() {
        const activeFields = this.resonanceFields.filter(f => f.active).length;
        const decayingFields = this.resonanceFields.filter(f => !f.active && f.strength > 0.01).length;
        
        return {
            enabled: this.enabled,
            activeFields,
            decayingFields,
            totalCapacity: this.resonanceFields.length
        };
    }
}

// ============================================================================
// CONSOLE API
// ============================================================================

export function setupHarmonicResonanceConsoleAPI(game, resonanceSystem) {
    if (!window.game) return;
    
    window.game.resonanceStatus = () => {
        const status = resonanceSystem.getStatus();
        console.log('[Resonance] Status:', status);
        return status;
    };
    
    window.game.enableResonance = () => {
        resonanceSystem.enable();
    };
    
    window.game.disableResonance = () => {
        resonanceSystem.disable();
    };
    
    window.game.toggleResonanceDebug = () => {
        CONFIG.DEBUG_DRAW_FIELDS = !CONFIG.DEBUG_DRAW_FIELDS;
        console.log('[Resonance] Debug visualization:', CONFIG.DEBUG_DRAW_FIELDS);
    };
    
    console.log('[HarmonicResonanceFeedbackSystem] Console API ready:');
    console.log('  game.resonanceStatus()');
    console.log('  game.enableResonance()');
    console.log('  game.disableResonance()');
    console.log('  game.toggleResonanceDebug()');
}
