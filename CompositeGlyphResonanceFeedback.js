/**
 * ============================================================================
 * COMPOSITE GLYPH RESONANCE FEEDBACK SYSTEM
 * ============================================================================
 * 
 * Visual-only feedback adapter that makes composite glyph resonance perceptible
 * through subtle spatial and temporal cues, without introducing new motion,
 * color, or gameplay signals.
 * 
 * CORE PHILOSOPHY:
 * Composite glyphs already resonate. This layer lets players perceive that
 * resonance through sensed spatial organization and motion coherence—
 * not effects, not visuals, not UI.
 * 
 * RESONANCE SOURCE:
 * - Composite glyphs only (fused or in decay)
 * - Strength from: stability, harmony dominance, synergy coherence
 * - Active duration: while glyph exists or is decaying
 * 
 * VISUAL FEEDBACK CHANNELS:
 * 
 * 1) Local Spatial Compression/Expansion
 *    - Micro-scale modulation of nearby glyph spacing
 *    - Slight easing changes in local motion paths
 *    - Effect felt peripherally, not seen
 *    - Rules: No scale change on composite glyph itself
 *    - No camera effects, purely spatial organization
 * 
 * 2) Temporal Phase Coherence Cue
 *    - Nearby animated elements (glyph cycles, drift) subtly phase-align
 *    - Alignment is partial and elastic, not snapped
 *    - Phase influence decays with distance
 * 
 * 3) Resonance Boundary Softening
 *    - At edge of resonance influence: motion feels smoother
 *    - Directional hesitation disappears
 *    - Feels like "motion prefers passing through here"
 * 
 * STATE MODULATION:
 * - Harmony: increases coherence, expands radius
 * - Corruption: introduces phase disagreement, reduces coherence
 * - Synergy: improves legibility and smoothness
 * - stability: weakens all cues, shortens duration
 * 
 * RAMP BEHAVIOR:
 * - Fade-in: ≥1s smooth rise
 * - Sustain: maintained while glyph fused
 * - Decay: slower than fusion separation
 * 
 * CONSTRAINTS:
 * ❌ NO: particles, glow, color shifts, brightness pulses, geometry deformation, camera
 * ✅ YES: spacing intelligence, motion easing, phase coherence, calm authority
 * 
 * PERFORMANCE & SAFETY:
 * - No per-frame allocations
 * - Uses existing motion parameters
 * - Hard cap on affected elements (max 16 per glyph)
 * - Graceful no-op if dependencies missing
 * - Read-only: never mutates network state
 * 
 * ============================================================================
 */

import * as THREE from 'three';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // INFLUENCE GEOMETRY
    BASE_INFLUENCE_RADIUS: 8.0,            // Base distance of resonance effect
    HARMONY_RADIUS_MULTIPLIER: 1.3,        // Harmony expands radius
    CORRUPTION_RADIUS_MULTIPLIER: 0.7,     // Corruption shrinks radius
    SYNERGY_LEGIBILITY_BOOST: 1.2,         // Synergy improves effect clarity
    STABILITY_WEAKENING_FACTOR: 0.6,     // stability dampens all effects
    
    // TEMPORAL DYNAMICS
    RESONANCE_RAMP_IN_DURATION: 1.2,       // Time to reach full influence (seconds)
    RESONANCE_SUSTAIN_DURATION: 12.0,      // Time held at full strength (seconds)
    RESONANCE_DECAY_DURATION: 4.0,         // Time to fade out (seconds)
    PHASE_ALIGNMENT_DAMPING: 0.15,         // Elastic phase coupling strength
    
    // SPATIAL COMPRESSION
    SPACING_COMPRESSION_AMOUNT: 0.04,      // Maximum micro-scale compression (4%)
    SPACING_VARIANCE_REDUCTION: 0.08,      // Smoothness of local motion
    BOUNDARY_SOFTENING_RANGE: 2.0,         // Distance from influence edge (units)
    BOUNDARY_EASING_POWER: 2.0,            // Smoothness curve (quadratic)
    
    // PHASE COHERENCE
    PHASE_INFLUENCE_DECAY_RATE: 1.0,       // Phase alignment loses strength with distance
    PHASE_VARIANCE_SUPPRESSION: 0.06,      // Reduces motion jitter near resonance
    PHASE_SYNC_THRESHOLD: 0.3,             // Minimum phase influence before activation
    
    // PERFORMANCE SAFETY
    MAX_NEARBY_ELEMENTS: 16,               // Hard cap on elements affected per glyph
    MAX_ACTIVE_RESONANCES: 8,              // Hard cap on concurrent resonances
    CHECK_INTERVAL: 0.2,                   // Seconds between proximity checks
    
    // STATE RESPONSIVENESS
    HARMONY_ENHANCEMENT: 0.35,             // Harmony signal boost
    CORRUPTION_SUPPRESSION: 0.4,           // Corruption effect reduction
    SYNERGY_COHERENCE_BOOST: 0.25,         // Synergy improves clarity
    
    // DECAY & LIFETIME (Visual-only transitions)
    DECAY_STABLE_DURATION: 0.5,        // Seconds before fading begins
    DECAY_FADING_DURATION: 1.5,        // Opacity fade-out time (seconds)
    DECAY_DISSOLVING_DURATION: 1.0,    // Structural loosening phase (seconds)
    DECAY_CLEANUP_DURATION: 0.3,       // Final cleanup (seconds)
    DECAY_PHASE_DRIFT_RATE: 0.8,       // Phase decoherence per second during decay
    DECAY_OPACITY_CURVE: 'quadratic',  // Fade curve: 'linear', 'quadratic', 'cubic'
    DECAY_STRUCTURAL_LOOSENING: 0.25,  // Max amplitude reduction during dissolution
    
    // SOURCE REABSORPTION (During dissolution phase)
    REABSORPTION_PHASE_CONVERGENCE: 0.18,    // Phase alignment damping (elastic)
    REABSORPTION_AMPLITUDE_EASING: 0.12,     // Amplitude modulation strength
    REABSORPTION_OPACITY_RECIPROCITY: 0.15,  // Inverse of composite fade
    REABSORPTION_SEARCH_RADIUS: 12.0,        // Distance to find source glyphs
    
    // DEBUG & OBSERVABILITY
    DEBUG_DRAW_INFLUENCE: false,
    DEBUG_SHOW_PHASE_VECTORS: false,
    DEBUG_SHOW_SPACING_MODULATION: false,
    DEBUG_LOG_RESONANCE_EVENTS: false,
    DEBUG_LOG_DECAY_EVENTS: false
};

// ============================================================================
// RESONANCE INFLUENCE ZONE
// ============================================================================

class ResonanceInfluenceZone {
    constructor(compositeGlyph) {
        this.compositeGlyph = compositeGlyph;
        this.position = new THREE.Vector3();
        this.zone = null;
        
        // Source glyph tracking (for reabsorption during dissolution)
        this.sourceNodeIds = [];         // IDs of nodes that fused to create this composite
        this.sourceGlyphs = [];          // Actual glyph objects (resolved at dissolution)
        this.reabsorptionState = {       // Tracks reabsorption progress per source
            phases: new Map(),           // sourceGlyph → convergence phase
            amplitudes: new Map()        // sourceGlyph → amplitude modulation
        };
        
        // Resonance state
        this.active = false;
        this.strength = 0.0;
        this.targetStrength = 0.0;
        this.phaseAngle = 0.0;
        this.phaseVelocity = 0.0;
        
        // Timing
        this.elapsedTime = 0.0;
        this.rampPhase = 'inactive'; // 'ramping-in', 'sustaining', 'decaying', 'inactive'
        
        // Decay state (visual-only lifetime management)
        this.decayStartTime = null;     // When decay began
        this.decayPhase = 'stable';     // 'stable', 'fading', 'dissolving', 'cleanup'
        this.decayProgress = 0.0;       // 0-1 normalized decay progression
        this.phaseDecoherence = 0.0;    // Random phase drift during decay
        this.structuralIntegrity = 1.0; // Loosening during dissolution
        
        // Influence parameters (derived from network state)
        this.influenceRadius = CONFIG.BASE_INFLUENCE_RADIUS;
        this.harmonyModulation = 1.0;
        this.corruptionModulation = 1.0;
        this.synergyBoost = 1.0;
        this.stabilityFactor = 1.0;
        
        // Nearby elements tracking
        this.affectedElements = [];
        this.lastProximityCheck = -CONFIG.CHECK_INTERVAL;
        
        // Debug visualization
        this.debugSphere = null;
        this.debugVectors = [];
    }
    
    updateFromCompositeState(networkState) {
        // Read-only: extract state without mutation
        if (!this.compositeGlyph || !this.compositeGlyph.mesh) return;
        
        this.position.copy(this.compositeGlyph.mesh.position);
        
        // Extract modulation factors from network state
        const glyphData = this.compositeGlyph.glyphData || {};
        const regionIndex = this.compositeGlyph.regionIndex || 0;
        
        // Harmony effect: expand and enhance
        this.harmonyModulation = 1.0;
        if (glyphData.harmonyDominance !== undefined) {
            this.harmonyModulation = 1.0 + (glyphData.harmonyDominance * CONFIG.HARMONY_ENHANCEMENT);
        }
        
        // Corruption effect: shrink and suppress
        this.corruptionModulation = 1.0;
        if (glyphData.corruptionLevel !== undefined) {
            this.corruptionModulation = 1.0 - (glyphData.corruptionLevel * CONFIG.CORRUPTION_SUPPRESSION);
            this.corruptionModulation = Math.max(0.4, this.corruptionModulation);
        }
        
        // Synergy effect: clarify and smooth
        this.synergyBoost = 1.0;
        if (glyphData.synergyCoherence !== undefined) {
            this.synergyBoost = 1.0 + (glyphData.synergyCoherence * CONFIG.SYNERGY_COHERENCE_BOOST);
        }
        
        // stability effect: dampen all effects
        this.stabilityFactor = 1.0;
        if (glyphData.stabilityIndex !== undefined) {
            this.stabilityFactor = 1.0 - (glyphData.stabilityIndex * CONFIG.STABILITY_WEAKENING_FACTOR);
            this.stabilityFactor = Math.max(0.3, this.stabilityFactor);
        }
        
        // Calculate effective influence radius
        const baseRadius = CONFIG.BASE_INFLUENCE_RADIUS;
        const harmonyRadius = baseRadius * CONFIG.HARMONY_RADIUS_MULTIPLIER * this.harmonyModulation;
        const corruptionRadius = baseRadius * CONFIG.CORRUPTION_RADIUS_MULTIPLIER * this.corruptionModulation;
        
        this.influenceRadius = THREE.MathUtils.lerp(corruptionRadius, harmonyRadius, 0.5);
        this.influenceRadius *= this.stabilityFactor;
    }
    
    update(deltaTime, isFused, decayStrength) {
        // Update resonance ramp based on composite state
        
        this.elapsedTime += deltaTime;
        
        if (isFused) {
            // Composite is actively fused: ramp in then sustain
            if (this.rampPhase === 'inactive') {
                this.rampPhase = 'ramping-in';
                this.elapsedTime = 0.0;
            }
            
            if (this.rampPhase === 'ramping-in') {
                const rampProgress = Math.min(this.elapsedTime / CONFIG.RESONANCE_RAMP_IN_DURATION, 1.0);
                this.targetStrength = rampProgress;
                
                if (rampProgress >= 1.0) {
                    this.rampPhase = 'sustaining';
                    this.elapsedTime = 0.0;
                }
            } else if (this.rampPhase === 'sustaining') {
                this.targetStrength = 1.0;
                // Hold at full strength for sustain duration
            }
        } else {
            // Composite is decaying: transition to decay phase
            if (this.rampPhase !== 'inactive' && this.rampPhase !== 'decaying') {
                this.rampPhase = 'decaying';
                this.elapsedTime = 0.0;
            }
            
            if (this.rampPhase === 'decaying') {
                const decayProgress = Math.min(this.elapsedTime / CONFIG.RESONANCE_DECAY_DURATION, 1.0);
                // Decay: full strength to zero, slower than ramp-in
                this.targetStrength = (1.0 - decayProgress) * decayStrength;
                
                if (decayProgress >= 1.0) {
                    this.rampPhase = 'inactive';
                    this.targetStrength = 0.0;
                    this.active = false;
                }
            }
        }
        
        // Smooth current strength toward target
        const strengthDamping = 0.15;
        this.strength = THREE.MathUtils.lerp(this.strength, this.targetStrength, strengthDamping);
        
        // Update phase angle (slow oscillation for phase coherence cues)
        const phaseSpeed = 2.0; // radians per second
        this.phaseVelocity = phaseSpeed;
        this.phaseAngle += this.phaseVelocity * deltaTime;
        this.phaseAngle = this.phaseAngle % (Math.PI * 2);
        
        this.active = this.strength > 0.01;
        
        // Periodic proximity check
        this.lastProximityCheck += deltaTime;
    }
    
    getEffectiveStrength() {
        // Apply all modulation factors
        let effective = this.strength;
        effective *= this.harmonyModulation;
        effective *= this.corruptionModulation;
        effective *= this.synergyBoost;
        effective *= this.stabilityFactor;
        
        return Math.max(0.0, effective);
    }
    
    getSpatialInfluence(position, distance) {
        // Calculate spatial influence decay with distance
        if (distance > this.influenceRadius) return 0.0;
        
        // Smooth falloff: quadratic toward edge
        const normalizedDistance = distance / this.influenceRadius;
        const falloff = 1.0 - (normalizedDistance * normalizedDistance);
        
        return falloff * this.getEffectiveStrength();
    }
    
    getPhaseAlignment(position, distance) {
        // Calculate phase coherence influence
        if (distance > this.influenceRadius) return 0.0;
        
        const spatialInfluence = this.getSpatialInfluence(position, distance);
        if (spatialInfluence < CONFIG.PHASE_SYNC_THRESHOLD) return 0.0;
        
        // Phase alignment strength decays with distance
        const distanceDecay = Math.exp(-distance * CONFIG.PHASE_INFLUENCE_DECAY_RATE / this.influenceRadius);
        const phaseInfluence = spatialInfluence * distanceDecay;
        
        return phaseInfluence * CONFIG.PHASE_ALIGNMENT_DAMPING;
    }
    
    // ========================================================================
    // DECAY & LIFETIME MANAGEMENT (Visual-Only Transitions)
    // ========================================================================
    
    /**
     * Initiate decay phase when composite glyph begins separation
     * Called by unregisterCompositeGlyph() in the main system
     */
    initiateDecay() {
        if (this.decayStartTime !== null) return; // Already decaying
        
        this.decayStartTime = 0.0;
        this.decayPhase = 'stable';
        this.decayProgress = 0.0;
        this.phaseDecoherence = 0.0;
        this.structuralIntegrity = 1.0;
        
        if (CONFIG.DEBUG_LOG_DECAY_EVENTS) {
            console.log(`[Decay] Initiated for glyph ${this.compositeGlyph?.id}`);
        }
    }
    
    /**
     * Update decay state and visual properties
     * Called every frame when decay is active
     * Scene parameter enables source glyph reabsorption during dissolution
     */
    updateDecay(deltaTime, scene = null) {
        if (this.decayStartTime === null) return; // Not decaying
        
        this.decayStartTime += deltaTime;
        const totalDecayDuration = CONFIG.DECAY_STABLE_DURATION + 
                                   CONFIG.DECAY_FADING_DURATION + 
                                   CONFIG.DECAY_DISSOLVING_DURATION + 
                                   CONFIG.DECAY_CLEANUP_DURATION;
        
        // Calculate overall decay progress (0-1)
        this.decayProgress = Math.min(this.decayStartTime / totalDecayDuration, 1.0);
        
        // Determine current decay phase
        let phaseTime = this.decayStartTime;
        let wasDissolving = this.decayPhase === 'dissolving';
        
        if (phaseTime < CONFIG.DECAY_STABLE_DURATION) {
            this.decayPhase = 'stable';
            this.updateStablePhase(phaseTime);
        } else if (phaseTime < CONFIG.DECAY_STABLE_DURATION + CONFIG.DECAY_FADING_DURATION) {
            this.decayPhase = 'fading';
            const fadingTime = phaseTime - CONFIG.DECAY_STABLE_DURATION;
            this.updateFadingPhase(fadingTime);
        } else if (phaseTime < CONFIG.DECAY_STABLE_DURATION + CONFIG.DECAY_FADING_DURATION + CONFIG.DECAY_DISSOLVING_DURATION) {
            this.decayPhase = 'dissolving';
            const dissolvingTime = phaseTime - CONFIG.DECAY_STABLE_DURATION - CONFIG.DECAY_FADING_DURATION;
            this.updateDissolvingPhase(dissolvingTime, scene);
        } else {
            // Cleanup phase: finalize reabsorption
            if (wasDissolving) {
                this.cleanupReabsorption();
            }
            this.decayPhase = 'cleanup';
        }
        
        // Check if decay is complete
        return this.decayProgress >= 1.0;
    }
    
    /**
     * Stable phase: Subtle phase desynchronization begins
     * Composite remains visually intact but starts to lose coherence
     */
    updateStablePhase(stableTime) {
        const stableProgress = stableTime / CONFIG.DECAY_STABLE_DURATION;
        
        // Gradually introduce phase decoherence
        this.phaseDecoherence = stableProgress * 0.3; // Max 0.3 radians drift
        
        // Slight resonance strength reduction
        this.strength = Math.max(0.7, 1.0 - stableProgress * 0.3);
    }
    
    /**
     * Fading phase: Opacity soft-fade + amplitude reduction
     * Composite becomes translucent and quieter
     */
    updateFadingPhase(fadingTime) {
        const fadingProgress = fadingTime / CONFIG.DECAY_FADING_DURATION;
        
        // Calculate opacity curve (smooth fade)
        let opacityCurve = fadingProgress;
        if (CONFIG.DECAY_OPACITY_CURVE === 'quadratic') {
            opacityCurve = fadingProgress * fadingProgress;
        } else if (CONFIG.DECAY_OPACITY_CURVE === 'cubic') {
            opacityCurve = fadingProgress * fadingProgress * fadingProgress;
        }
        
        // Fade strength: 1.0 → 0.0
        this.strength = 1.0 - opacityCurve;
        
        // Increase phase drift during fade
        this.phaseDecoherence = 0.3 + fadingProgress * 0.4; // 0.3 → 0.7 radians
        
        // Reduce influence radius (composition contracts)
        this.influenceRadius = CONFIG.BASE_INFLUENCE_RADIUS * (1.0 - fadingProgress * 0.4);
    }
    
    /**
     * Dissolving phase: Structural loosening as composite fragments
     * Visual components separate back toward source glyphs
     */
    updateDissolvingPhase(dissolvingTime, scene = null) {
        const dissolvingProgress = dissolvingTime / CONFIG.DECAY_DISSOLVING_DURATION;
        
        // Strength continues toward zero
        this.strength = Math.max(0.0, 1.0 - (CONFIG.DECAY_STABLE_DURATION + CONFIG.DECAY_FADING_DURATION) / CONFIG.DECAY_FADING_DURATION - dissolvingProgress);
        
        // Structural integrity loosens (fragments drift apart)
        this.structuralIntegrity = 1.0 - dissolvingProgress * 0.8; // 1.0 → 0.2
        
        // Maximum phase decoherence (complete desynchronization)
        this.phaseDecoherence = 0.7 + dissolvingProgress * 0.3; // 0.7 → 1.0 radians
        
        // Influence radius collapses to near-zero
        this.influenceRadius = CONFIG.BASE_INFLUENCE_RADIUS * (1.0 - dissolvingProgress);
        
        // Apply source glyph reabsorption animation
        // This visualizes meaning dissolving back into source glyphs
        if (scene) {
            this.resolveSourceGlyphs(scene);
            if (this.sourceGlyphs.length > 0) {
                this.applySourceReabsorption(dissolvingProgress);
            }
        }
    }
    
    // ========================================================================
    // SOURCE GLYPH REABSORPTION (During Dissolution)
    // ========================================================================
    
    /**
     * Set source node IDs that fused to create this composite
     * Called when composite glyph is registered
     */
    setSourceNodeIds(nodeIds) {
        if (Array.isArray(nodeIds)) {
            this.sourceNodeIds = nodeIds.slice(); // Copy array
        }
    }
    
    /**
     * Resolve source glyph objects from scene during dissolution
     * Searches for glyph objects near the composite that match source IDs
     * Early-exit if sources unavailable (graceful no-op)
     */
    resolveSourceGlyphs(scene) {
        if (this.sourceGlyphs.length > 0) return; // Already resolved
        if (!scene || this.sourceNodeIds.length === 0) return; // Can't resolve
        
        const sourceGlyphsFound = [];
        
        scene.traverse(obj => {
            // Look for glyph objects with userData.nodeId matching source IDs
            if (obj.userData && obj.userData.nodeId && this.sourceNodeIds.includes(obj.userData.nodeId)) {
                // Verify it's a glyph (has animation phases)
                if (typeof obj.userData.pulsePhase === 'number' || 
                    typeof obj.userData.rotationPhase === 'number' ||
                    typeof obj.userData.bobPhase === 'number' ||
                    typeof obj.userData.breathPhase === 'number') {
                    sourceGlyphsFound.push(obj);
                }
            }
        });
        
        this.sourceGlyphs = sourceGlyphsFound;
    }
    
    /**
     * Apply reabsorption animation to source glyphs during dissolution
     * Phase convergence: sources re-align toward independent rhythm
     * Amplitude easing: slight boost then normalization
     * Opacity reciprocity: sources become more present as composite fades
     */
    applySourceReabsorption(dissolvingProgress) {
        if (this.sourceGlyphs.length === 0) return;
        
        // Reabsorption curves
        const convergenceStrength = dissolvingProgress * CONFIG.REABSORPTION_PHASE_CONVERGENCE;
        const amplitudeModulation = this.calculateAmplitudeEasing(dissolvingProgress);
        const opacityReciprocity = (1.0 - this.strength) * CONFIG.REABSORPTION_OPACITY_RECIPROCITY;
        
        for (const sourceGlyph of this.sourceGlyphs) {
            if (!sourceGlyph.userData) continue;
            
            // Phase convergence: return to independent rhythm
            this.applyPhaseConvergence(sourceGlyph, convergenceStrength);
            
            // Amplitude easing: restore natural motion
            this.applyAmplitudeEasing(sourceGlyph, amplitudeModulation);
            
            // Opacity reciprocity: subtle presence increase
            this.applyOpacityReciprocity(sourceGlyph, opacityReciprocity);
        }
    }
    
    /**
     * Calculate amplitude easing curve: boost then normalize
     * Creates gentle "breathing in" effect as composite dissolves
     */
    calculateAmplitudeEasing(dissolvingProgress) {
        if (dissolvingProgress < 0.5) {
            // First half: slight boost (0 → 1.1)
            return 1.0 + (dissolvingProgress * 2) * 0.1;
        } else {
            // Second half: return to normal (1.1 → 1.0)
            const secondHalf = (dissolvingProgress - 0.5) * 2;
            return 1.1 - secondHalf * 0.1;
        }
    }
    
    /**
     * Apply phase convergence: sources regain independent rhythm
     * Elastic damping prevents snapping
     */
    applyPhaseConvergence(sourceGlyph, convergenceStrength) {
        if (convergenceStrength < 0.02) return; // Minimum threshold
        
        const userData = sourceGlyph.userData;
        
        // Each phase type returns to its own natural rhythm (no external influence)
        // This is expressed as elastic reduction of decoherence that was imposed
        if (typeof userData.pulsePhase === 'number') {
            // Restore independence by reducing phase lock
            userData.pulsePhase += (Math.random() - 0.5) * convergenceStrength * 0.05;
        }
        
        if (typeof userData.rotationPhase === 'number') {
            userData.rotationPhase += (Math.random() - 0.5) * convergenceStrength * 0.03;
        }
        
        if (typeof userData.bobPhase === 'number') {
            userData.bobPhase += (Math.random() - 0.5) * convergenceStrength * 0.04;
        }
        
        if (typeof userData.breathPhase === 'number') {
            userData.breathPhase += (Math.random() - 0.5) * convergenceStrength * 0.02;
        }
    }
    
    /**
     * Apply amplitude easing: slight boost then calm normalization
     * Modulates animation speed/scale parameters if available
     */
    applyAmplitudeEasing(sourceGlyph, amplitudeModulation) {
        if (amplitudeModulation < 0.99 || amplitudeModulation > 1.01) {
            const userData = sourceGlyph.userData;
            
            // Apply to various amplitude parameters
            if (typeof userData.pulseAmplitude === 'number') {
                userData.pulseAmplitude *= amplitudeModulation;
            }
            
            if (typeof userData.bobAmplitude === 'number') {
                userData.bobAmplitude *= amplitudeModulation;
            }
            
            if (typeof userData.breathAmplitude === 'number') {
                userData.breathAmplitude *= amplitudeModulation;
            }
            
            if (typeof userData.rotationSpeed === 'number') {
                userData.rotationSpeed *= amplitudeModulation;
            }
        }
    }
    
    /**
     * Apply opacity reciprocity: source glyphs subtly become more present
     * As composite fades, sources are revealed more clearly
     */
    applyOpacityReciprocity(sourceGlyph, opacityReciprocity) {
        if (opacityReciprocity < 0.01) return;
        
        const userData = sourceGlyph.userData;
        
        // Track and modulate source glyph presence
        if (typeof userData.reabsorptionOpacity !== 'number') {
            userData.reabsorptionOpacity = 0.0;
        }
        
        // Gradually increase presence (elastic)
        userData.reabsorptionOpacity = THREE.MathUtils.lerp(
            userData.reabsorptionOpacity,
            opacityReciprocity,
            0.15  // Smooth easing
        );
        
        // Apply to mesh opacity if present
        sourceGlyph.traverse(child => {
            if (child.material && typeof child.material.opacity === 'number') {
                const baseOpacity = child.userData?.baseOpacity !== undefined ? child.userData.baseOpacity : child.material.opacity;
                if (!child.userData) child.userData = {};
                child.userData.baseOpacity = baseOpacity;
                
                child.material.opacity = baseOpacity + userData.reabsorptionOpacity;
            }
        });
    }
    
    /**
     * Clean up reabsorption state when dissolution ends
     * Resets source glyph modulations to neutral
     */
    cleanupReabsorption() {
        for (const sourceGlyph of this.sourceGlyphs) {
            if (!sourceGlyph.userData) continue;
            
            // Reset reabsorption tracking
            delete sourceGlyph.userData.reabsorptionOpacity;
            
            // Reset opacity modulation
            sourceGlyph.traverse(child => {
                if (child.userData && child.userData.baseOpacity !== undefined && child.material) {
                    child.material.opacity = child.userData.baseOpacity;
                    delete child.userData.baseOpacity;
                }
            });
        }
        
        this.sourceGlyphs = [];
        this.reabsorptionState.phases.clear();
        this.reabsorptionState.amplitudes.clear();
    }
    
    /**
     * Check if decay is complete
     * Returns true when glyph should be unregistered
     */
    isDecayComplete() {
        return this.decayPhase === 'cleanup' && this.decayProgress >= 1.0;
    }
    
    debugDraw(scene) {
        if (!CONFIG.DEBUG_DRAW_INFLUENCE) return;
        
        // Clean up old debug sphere
        if (this.debugSphere) {
            scene.remove(this.debugSphere);
        }
        
        // Draw influence radius as wireframe sphere
        const geometry = new THREE.SphereGeometry(this.influenceRadius, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
            opacity: 0.2,
            transparent: true
        });
        
        this.debugSphere = new THREE.Mesh(geometry, material);
        this.debugSphere.position.copy(this.position);
        scene.add(this.debugSphere);
    }
}

// ============================================================================
// COMPOSITE GLYPH RESONANCE FEEDBACK SYSTEM
// ============================================================================

class CompositeGlyphResonanceFeedback {
    constructor() {
        this.resonanceZones = new Map(); // composite glyph ID → ResonanceInfluenceZone
        this.affectedElements = [];       // All elements being influenced
        
        this.scene = null;
        this.camera = null;
        this.network = null;
        
        this.enabled = true;
        this.updateCounter = 0;
        
        // OPTIONAL: Glyph animation influence feature
        this.glyphAnimationInfluenceEnabled = false;  // Disabled by default
        this.glyphAnimationInfluenceRadius = 4.0;     // Small radius for subtle effect
        this.glyphAnimationPhaseDamping = 0.12;       // Elastic phase coupling
        
        // Performance monitoring
        this.lastUpdateTime = 0;
        this.updateFrequency = 0.016; // ~60 FPS
    }
    
    initialize(scene, camera, network) {
        this.scene = scene;
        this.camera = camera;
        this.network = network;
        
        console.log('[CompositeResonanceFeedback] Initialized');
    }
    
    registerCompositeGlyph(compositeGlyph) {
        // Called when a composite glyph is created
        if (!compositeGlyph) return;
        
        const glyphId = compositeGlyph.id || `glyph_${Math.random()}`;
        
        if (!this.resonanceZones.has(glyphId)) {
            const zone = new ResonanceInfluenceZone(compositeGlyph);
            this.resonanceZones.set(glyphId, zone);
            
            if (CONFIG.DEBUG_LOG_RESONANCE_EVENTS) {
                console.log(`[CompositeResonance] Registered glyph: ${glyphId}`);
            }
        }
    }
    
    unregisterCompositeGlyph(glyphId) {
        // Called when a composite glyph begins separation
        // Instead of immediate removal, initiate visual decay phase
        if (this.resonanceZones.has(glyphId)) {
            const zone = this.resonanceZones.get(glyphId);
            
            // Initiate decay transition (visual-only lifetime management)
            zone.initiateDecay();
            
            if (CONFIG.DEBUG_LOG_DECAY_EVENTS) {
                console.log(`[Decay] Separation initiated for glyph: ${glyphId}`);
            }
        }
    }
    
    /**
     * Immediately remove a resonance zone (after decay is complete)
     * This is called internally, not from external systems
     */
    _finalizeZoneRemoval(glyphId) {
        if (this.resonanceZones.has(glyphId)) {
            const zone = this.resonanceZones.get(glyphId);
            
            // Clean up debug visuals
            if (zone.debugSphere && this.scene) {
                this.scene.remove(zone.debugSphere);
            }
            
            this.resonanceZones.delete(glyphId);
            
            if (CONFIG.DEBUG_LOG_DECAY_EVENTS) {
                console.log(`[Decay] Finalized removal for glyph: ${glyphId}`);
            }
        }
    }
    
    update(deltaTime) {
        if (!this.enabled) return;
        if (!this.frameScheduler?.shouldRunVisual?.()) return;
        this.updateCounter++;
        
        // Update all active resonance zones
        const activeZones = [];
        const decayingZones = [];
        const glyphsToFinalize = [];
        
        for (const [glyphId, zone] of this.resonanceZones) {
            if (!zone.compositeGlyph || !zone.compositeGlyph.mesh) {
                glyphsToFinalize.push(glyphId);
                continue;
            }
            
            // Handle decay phase (visual-only lifetime management)
            if (zone.decayStartTime !== null) {
                const decayComplete = zone.updateDecay(deltaTime, this.scene);
                decayingZones.push(zone);
                
                if (decayComplete) {
                    glyphsToFinalize.push(glyphId);
                    continue;
                }
                // Still decaying, but don't add to activeZones
                continue;
            }
            
            // Determine if composite is fused (active resonance)
            const isFused = zone.compositeGlyph.isFused === true;
            const decayStrength = zone.compositeGlyph.decayStrength || 0.5;
            
            // Update zone state
            zone.updateFromCompositeState(this.network);
            zone.update(deltaTime, isFused, decayStrength);
            
            // Debug visualization
            if (CONFIG.DEBUG_DRAW_INFLUENCE && this.scene) {
                zone.debugDraw(this.scene);
            }
            
            if (zone.active) {
                activeZones.push(zone);
            }
        }
        
        // Finalize glyphs that have completed decay
        for (const glyphId of glyphsToFinalize) {
            this._finalizeZoneRemoval(glyphId);
        }
        
        // Limit number of active resonances for performance
        const maxActiveResonances = Math.min(CONFIG.MAX_ACTIVE_RESONANCES, activeZones.length);
        
        // Apply resonance effects to nearby elements (only from active zones, not decaying)
        this.applyResonanceEffects(activeZones.slice(0, maxActiveResonances), deltaTime);
    }
    
    applyResonanceEffects(activeZones, deltaTime) {
        // Apply spatial and temporal feedback from all active resonance zones
        
        if (activeZones.length === 0) {
            this.affectedElements = [];
            return;
        }
        
        // Collect all nearby glyphs (animation targets)
        const allNearbyElements = this.findNearbyAnimatedElements(activeZones);
        
        // Apply resonance effects to each element
        for (const element of allNearbyElements) {
            if (!element.glyphData) continue;
            
            let totalSpatialInfluence = 0.0;
            let totalPhaseInfluence = 0.0;
            let boundaryCondition = 1.0;
            
            // Aggregate effects from all active resonance zones
            for (const zone of activeZones) {
                const distance = element.position.distanceTo(zone.position);
                
                // Spatial compression/expansion
                const spatialInfluence = zone.getSpatialInfluence(element.position, distance);
                totalSpatialInfluence += spatialInfluence;
                
                // Phase coherence
                const phaseInfluence = zone.getPhaseAlignment(element.position, distance);
                totalPhaseInfluence += phaseInfluence;
                
                // Boundary softening (smooth transition at edge)
                const distanceFromBoundary = Math.abs(zone.influenceRadius - distance);
                if (distanceFromBoundary < CONFIG.BOUNDARY_SOFTENING_RANGE) {
                    const edgeProgress = 1.0 - (distanceFromBoundary / CONFIG.BOUNDARY_SOFTENING_RANGE);
                    const edgeSmoothing = Math.pow(edgeProgress, CONFIG.BOUNDARY_EASING_POWER);
                    boundaryCondition *= (1.0 - edgeSmoothing * 0.3); // Slight softening
                }
            }
            
            // Clamp influences
            totalSpatialInfluence = Math.min(totalSpatialInfluence, 1.0);
            totalPhaseInfluence = Math.min(totalPhaseInfluence, 1.0);
            
            // Apply spatial modulation (subtle compression)
            if (totalSpatialInfluence > 0.01) {
                const compressionAmount = totalSpatialInfluence * CONFIG.SPACING_COMPRESSION_AMOUNT;
                
                // Modulate spacing variance (reduce jitter)
                if (element.glyphData.spacingVariance !== undefined) {
                    element.glyphData.spacingVariance *= (1.0 - (totalSpatialInfluence * CONFIG.SPACING_VARIANCE_REDUCTION));
                }
                
                // Store compression for motion easing calculation
                if (!element.glyphData.resonanceCompression) {
                    element.glyphData.resonanceCompression = 0.0;
                }
                element.glyphData.resonanceCompression = THREE.MathUtils.lerp(
                    element.glyphData.resonanceCompression,
                    compressionAmount,
                    0.2 // Smooth damping
                );
            }
            
            // Apply phase coherence (temporal alignment)
            if (totalPhaseInfluence > 0.01) {
                // Modulate element's animation phase toward zone's phase
                if (element.animationPhase !== undefined) {
                    const phaseTarget = activeZones[0].phaseAngle; // Use first zone's phase
                    const phaseDiff = ((phaseTarget - element.animationPhase) + Math.PI) % (2 * Math.PI) - Math.PI;
                    
                    element.animationPhase += phaseDiff * totalPhaseInfluence * 0.05;
                    element.animationPhase = element.animationPhase % (Math.PI * 2);
                }
                
                // Suppress motion variance (smooth motion)
                if (element.glyphData.motionVariance !== undefined) {
                    element.glyphData.motionVariance *= (1.0 - (totalPhaseInfluence * CONFIG.PHASE_VARIANCE_SUPPRESSION));
                }
            }
            
            // Apply boundary softening (ease nearby elements into smoother motion paths)
            if (boundaryCondition < 0.95) {
                if (element.glyphData.motionEasing !== undefined) {
                    element.glyphData.motionEasing = THREE.MathUtils.lerp(
                        element.glyphData.motionEasing,
                        1.0,
                        0.1 * boundaryCondition // Smooth easing at boundary
                    );
                }
            }
            
            // Store element as affected
            element.resonanceInfluence = totalSpatialInfluence + totalPhaseInfluence;
        }
        
        this.affectedElements = allNearbyElements;
    }
    
    findNearbyAnimatedElements(activeZones) {
        // Find all animated glyphs and elements affected by resonance zones
        // Read-only: only collects references, no state mutation
        
        const nearbyElements = [];
        const maxPerZone = Math.floor(CONFIG.MAX_NEARBY_ELEMENTS / activeZones.length);
        
        for (const zone of activeZones) {
            if (!zone.compositeGlyph.animationTargets) continue;
            
            const targets = zone.compositeGlyph.animationTargets;
            const candidates = [];
            
            // Calculate distances to all potential targets
            for (const target of targets) {
                if (!target.position) continue;
                
                const distance = zone.position.distanceTo(target.position);
                if (distance < zone.influenceRadius + CONFIG.BOUNDARY_SOFTENING_RANGE) {
                    candidates.push({
                        element: target,
                        distance: distance
                    });
                }
            }
            
            // Sort by distance and take closest N
            candidates.sort((a, b) => a.distance - b.distance);
            for (let i = 0; i < Math.min(maxPerZone, candidates.length); i++) {
                nearbyElements.push(candidates[i].element);
            }
        }
        
        return nearbyElements;
    }
    
    // ========================================================================
    // DEBUG & OBSERVABILITY API
    // ========================================================================
    
    toggleDebugVisualization(enable) {
        CONFIG.DEBUG_DRAW_INFLUENCE = enable;
        
        if (!enable && this.scene) {
            // Clean up debug visuals
            for (const zone of this.resonanceZones.values()) {
                if (zone.debugSphere) {
                    this.scene.remove(zone.debugSphere);
                    zone.debugSphere = null;
                }
            }
        }
    }
    
    getStatus() {
        const status = {
            enabled: this.enabled,
            activeResonances: 0,
            totalZones: this.resonanceZones.size,
            affectedElements: this.affectedElements.length,
            zones: []
        };
        
        for (const [glyphId, zone] of this.resonanceZones) {
            if (zone.active) {
                status.activeResonances++;
                status.zones.push({
                    glyphId,
                    strength: zone.getEffectiveStrength().toFixed(3),
                    radius: zone.influenceRadius.toFixed(2),
                    rampPhase: zone.rampPhase,
                    harmonyMod: zone.harmonyModulation.toFixed(2),
                    corruptionMod: zone.corruptionModulation.toFixed(2),
                    stability: zone.stabilityFactor.toFixed(2)
                });
            }
        }
        
        return status;
    }
    
    setEnabled(enable) {
        this.enabled = enable;
    }
    
    // ========================================================================
    // OPTIONAL: GLYPH ANIMATION INFLUENCE
    // ========================================================================
    
    /**
     * Enable/disable optional glyph animation phase alignment via resonance
     * This creates subtle phase coherence in nearby glyph animations without
     * forcing position or speed changes.
     */
    enableGlyphAnimationInfluence(enable = true) {
        this.glyphAnimationInfluenceEnabled = enable;
        if (enable) {
            console.log('[CompositeResonance] Glyph animation influence ENABLED');
            console.log('   Nearby glyphs will subtly phase-align with composite resonance');
        } else {
            console.log('[CompositeResonance] Glyph animation influence DISABLED');
        }
    }
    
    /**
     * Apply phase alignment influence to nearby glyphs
     * Called during the update loop after resonance zones are active
     * This method reads animation parameters and gently modulates phases
     */
    applyGlyphAnimationInfluence() {
        if (!this.glyphAnimationInfluenceEnabled || this.resonanceZones.size === 0) return;
        
        // Find all animated glyphs in the scene
        const animatedGlyphs = this.findAnimatedGlyphsInScene();
        if (animatedGlyphs.length === 0) return;
        
        // For each active resonance zone, influence nearby glyphs
        for (const [glyphId, zone] of this.resonanceZones) {
            if (!zone.compositeGlyph || zone.strength < 0.1) continue;
            
            const zonePosition = zone.position;
            const influenceStrength = zone.strength * zone.stabilityFactor * zone.synergyBoost;
            
            // Find glyphs within influence radius
            for (const glyph of animatedGlyphs) {
                const distance = glyph.position.distanceTo(zonePosition);
                
                // Only affect glyphs within small radius (subtle effect)
                if (distance > this.glyphAnimationInfluenceRadius) continue;
                if (distance < 0.1) continue; // Skip very close glyphs
                
                // Calculate influence falloff (soft curve)
                const normalizedDistance = distance / this.glyphAnimationInfluenceRadius;
                const falloff = Math.pow(1.0 - normalizedDistance, 2.0);
                const influenceAmount = falloff * influenceStrength;
                
                // Apply phase alignment to animation parameters
                this.alignGlyphAnimationPhase(glyph, zone, influenceAmount);
            }
        }
    }
    
    /**
     * Subtly align a glyph's animation phase toward the resonance zone's phase
     * Uses elastic damping to avoid snapping
     */
    alignGlyphAnimationPhase(glyph, zone, influenceAmount) {
        if (influenceAmount < 0.05) return; // Minimum threshold
        
        // Get the glyph's animation userData (set by GlyphAnimationModulator or similar)
        const userData = glyph.userData || {};
        
        // Modulate various animation phases if they exist
        if (typeof userData.pulsePhase === 'number') {
            const phaseDiff = ((zone.phaseAngle - userData.pulsePhase) + Math.PI) % (2 * Math.PI) - Math.PI;
            userData.pulsePhase += phaseDiff * influenceAmount * this.glyphAnimationPhaseDamping;
        }
        
        if (typeof userData.rotationPhase === 'number') {
            const phaseDiff = ((zone.phaseAngle - userData.rotationPhase) + Math.PI) % (2 * Math.PI) - Math.PI;
            userData.rotationPhase += phaseDiff * influenceAmount * this.glyphAnimationPhaseDamping * 0.5;
        }
        
        if (typeof userData.bobPhase === 'number') {
            const phaseDiff = ((zone.phaseAngle - userData.bobPhase) + Math.PI) % (2 * Math.PI) - Math.PI;
            userData.bobPhase += phaseDiff * influenceAmount * this.glyphAnimationPhaseDamping * 0.7;
        }
        
        if (typeof userData.breathPhase === 'number') {
            const phaseDiff = ((zone.phaseAngle - userData.breathPhase) + Math.PI) % (2 * Math.PI) - Math.PI;
            userData.breathPhase += phaseDiff * influenceAmount * this.glyphAnimationPhaseDamping * 0.4;
        }
    }
    
    /**
     * Find all animated glyphs in the scene (those with animation userData)
     * Returns array of glyph objects that have animation parameters
     */
    findAnimatedGlyphsInScene() {
        const animatedGlyphs = [];
        
        if (!this.scene) return animatedGlyphs;
        
        this.scene.traverse(obj => {
            // Look for objects with animation phase data (set by glyph systems)
            if (obj.userData && (
                typeof obj.userData.pulsePhase === 'number' ||
                typeof obj.userData.rotationPhase === 'number' ||
                typeof obj.userData.bobPhase === 'number' ||
                typeof obj.userData.breathPhase === 'number'
            )) {
                // Avoid duplicate counts
                if (!animatedGlyphs.includes(obj)) {
                    animatedGlyphs.push(obj);
                }
            }
        });
        
        // Cap to prevent performance issues
        return animatedGlyphs.slice(0, 200);
    }
    
    dispose() {
        // Clean up debug visuals
        for (const zone of this.resonanceZones.values()) {
            if (zone.debugSphere && this.scene) {
                this.scene.remove(zone.debugSphere);
            }
        }
        
        this.resonanceZones.clear();
        this.affectedElements = [];
    }
}

export { CompositeGlyphResonanceFeedback, ResonanceInfluenceZone };
