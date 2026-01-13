/**
 * ============================================================================
 * GLYPH ANIMATION MODULATOR
 * ============================================================================
 * 
 * Applies subtle harmonic cycle animations to procedural glyphs.
 * 
 * CORE PHILOSOPHY:
 * Glyphs should feel like they are quietly breathing with the region
 * they belong to—not reacting, not signaling, but existing as part
 * of a living, thinking environment.
 * 
 * The network does not just speak. It inhales, pauses, and exhales meaning.
 * 
 * ANIMATION BEHAVIORS:
 * - Very slow rotation (micro-rotation, ±3 degrees max)
 * - Gentle scale breathing (±2%)
 * - Soft internal stroke shift (imperceptible)
 * - Subtle opacity modulation (±5%)
 * 
 * VISUAL RESTRAINT:
 * - Animation never loops obviously
 * - No linear repetition
 * - Phase drifts over time (prevents synchronization)
 * - Stable regions: longer, smoother cycles
 * - Unstable regions: shorter, slightly chaotic cycles
 * 
 * ============================================================================
 */

import * as THREE from 'three';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // ANIMATION TYPES
    USE_ROTATION: true,                 // Micro-rotation
    USE_SCALE_BREATHING: true,          // Scale ±2%
    USE_OPACITY_MODULATION: true,       // Opacity ±5%
    USE_STROKE_SHIFT: true,             // Internal stroke shift
    
    // ANIMATION SELECTION (choose per glyph based on type)
    // Arc/Loop → Rotation + Scale
    // Radial → Scale + Opacity
    // Woven → Rotation + Opacity
    
    // COMPOSITE GLYPH OVERRIDE
    ALLOW_COMPOSITE_OVERRIDE: true,     // Composites follow resonance rhythm
    COMPOSITE_RHYTHM_MULTIPLIER: 2.0,   // Composite cycles 2x faster
    
    // STABILITY DAMPING
    UNSTABLE_ROTATION_DAMPEN: 0.6,      // Reduce rotation in unstable regions
    UNSTABLE_SCALE_DAMPEN: 0.7,         // Reduce breathing in unstable regions
    
    // DEBUG
    DEBUG_DRAW_ANIMATIONS: false,
    DEBUG_SHOW_ROTATION: false,
    DEBUG_SHOW_SCALE: false,
    DEBUG_SHOW_OPACITY: false
};

// ============================================================================
// GLYPH ANIMATION STATE
// ============================================================================

class GlyphAnimationState {
    constructor(glyphType, glyphInstance) {
        this.glyphType = glyphType;
        this.glyphInstance = glyphInstance;
        
        // Select animation types based on glyph type
        this.animations = this.selectAnimationTypes(glyphType);
        
        // Current animation values
        this.rotation = 0.0;
        this.scale = 1.0;
        this.opacity = 1.0;
        this.strokeShift = 0.0;
        
        // Applied state
        this.appliedRotation = 0.0;
        this.appliedScale = 1.0;
        this.appliedOpacity = 1.0;
    }
    
    selectAnimationTypes(glyphType) {
        // Different animation types for different glyphs
        const animations = new Set();
        
        switch (glyphType) {
            case 'arc':
                animations.add('rotation');
                animations.add('scale');
                break;
            case 'loop':
                animations.add('rotation');
                animations.add('scale');
                break;
            case 'radial':
                animations.add('scale');
                animations.add('opacity');
                break;
            case 'woven':
                animations.add('rotation');
                animations.add('opacity');
                break;
        }
        
        return animations;
    }
    
    reset() {
        this.rotation = 0.0;
        this.scale = 1.0;
        this.opacity = 1.0;
        this.strokeShift = 0.0;
        this.applyAnimations();
    }
    
    updateFromCycle(cycle) {
        // Get animation values from cycle
        if (this.animations.has('rotation')) {
            this.rotation = cycle.getRotationAmount();
        }
        if (this.animations.has('scale')) {
            this.scale = cycle.getScaleBreathe();
        }
        if (this.animations.has('opacity')) {
            this.opacity = cycle.getOpacityModulation();
        }
        if (this.animations.has('stroke')) {
            this.strokeShift = cycle.getStrokeShift();
        }
        
        // Apply with easing
        this.applyAnimations();
    }
    
    applyAnimations() {
        // Smooth transition to new values (easing)
        const ease = 0.15;  // Easing factor
        
        this.appliedRotation += (this.rotation - this.appliedRotation) * ease;
        this.appliedScale += (this.scale - this.appliedScale) * ease;
        this.appliedOpacity += (this.opacity - this.appliedOpacity) * ease;
        
        // Apply to mesh
        if (this.glyphInstance?.mesh) {
            const mesh = this.glyphInstance.mesh;
            
            // Rotation around Y axis (quiet spin)
            mesh.rotation.y = this.appliedRotation;
            
            // Scale breathing
            mesh.scale.set(this.appliedScale, this.appliedScale, this.appliedScale);
            
            // Opacity modulation
            if (mesh.material) {
                mesh.material.opacity = this.glyphInstance.targetOpacity * this.appliedOpacity;
            }
        }
    }
}

// ============================================================================
// GLYPH ANIMATION MODULATOR
// ============================================================================

export class GlyphAnimationModulator {
    constructor(cycleController) {
        this.cycleController = cycleController;
        
        // Animation states per glyph
        this.animationStates = new Map();  // glyphInstance → GlyphAnimationState
        
        // Glyph → cycle hash mapping (for cleanup)
        this.glyphToCycleHash = new Map();
        
        this.enabled = true;
        
        console.log('[GlyphAnimationModulator] Initialized');
    }
    
    // ========================================================================
    // ANIMATION STATE MANAGEMENT
    // ========================================================================
    
    registerGlyph(glyphInstance, cycleHash) {
        if (this.animationStates.has(glyphInstance)) {
            return this.animationStates.get(glyphInstance);
        }
        
        const animState = new GlyphAnimationState(glyphInstance.glyphType, glyphInstance);
        this.animationStates.set(glyphInstance, animState);
        this.glyphToCycleHash.set(glyphInstance, cycleHash);
        
        return animState;
    }
    
    unregisterGlyph(glyphInstance) {
        this.animationStates.delete(glyphInstance);
        this.glyphToCycleHash.delete(glyphInstance);
    }
    
    // ========================================================================
    // UPDATE LOOP
    // ========================================================================
    
    update(glyphInstances, networkState) {
        if (!this.enabled || !this.cycleController) return;
        
        // Update animation for each active glyph
        for (let glyphInstance of glyphInstances) {
            if (!glyphInstance.active) {
                // Clean up inactive glyphs
                this.unregisterGlyph(glyphInstance);
                continue;
            }
            
            // Get or create animation state
            const animState = this.registerGlyph(glyphInstance, glyphInstance.regionHash);
            if (!animState) continue;
            
            // Get cycle for this glyph's region
            const cycle = this.cycleController.getCycle(glyphInstance.regionHash);
            if (!cycle) {
                animState.reset();
                continue;
            }
            
            // Update animation from cycle
            animState.updateFromCycle(cycle);
        }
    }
    
    // ========================================================================
    // COMPOSITE GLYPH OVERRIDE
    // ========================================================================
    
    applyCompositeGlyphOverride(compositeGlyph, resonanceStrength) {
        // Composite glyphs follow resonance rhythm while fused
        if (!CONFIG.ALLOW_COMPOSITE_OVERRIDE) return;
        
        if (compositeGlyph?.mesh) {
            const mesh = compositeGlyph.mesh;
            
            // Composite glyphs spin slightly faster (resonance-driven)
            const resonanceRotation = Math.sin(resonanceStrength * Math.PI) * 0.02;  // Faster spin
            mesh.rotation.y = resonanceRotation * CONFIG.COMPOSITE_RHYTHM_MULTIPLIER;
            
            // Scale responds to resonance peak
            const resonanceScale = 1.0 + resonanceStrength * 0.01;  // ±1% from resonance
            mesh.scale.set(resonanceScale, resonanceScale, resonanceScale);
        }
    }
    
    // ========================================================================
    // ENABLE / DISABLE
    // ========================================================================
    
    enable() {
        this.enabled = true;
        console.log('[GlyphAnimationModulator] ENABLED');
    }
    
    disable() {
        this.enabled = false;
        
        // Reset all animations to neutral
        for (let animState of this.animationStates.values()) {
            animState.reset();
        }
        
        console.log('[GlyphAnimationModulator] DISABLED');
    }
    
    // ========================================================================
    // DEBUG & STATUS
    // ========================================================================
    
    toggleDebug() {
        CONFIG.DEBUG_DRAW_ANIMATIONS = !CONFIG.DEBUG_DRAW_ANIMATIONS;
        console.log('[Glyph Animation] Debug mode:', CONFIG.DEBUG_DRAW_ANIMATIONS);
        return CONFIG.DEBUG_DRAW_ANIMATIONS;
    }
    
    getStatus() {
        const animatedGlyphs = this.animationStates.size;
        const animTypes = new Map();
        
        for (let animState of this.animationStates.values()) {
            for (let type of animState.animations) {
                animTypes.set(type, (animTypes.get(type) || 0) + 1);
            }
        }
        
        return {
            enabled: this.enabled,
            animatedGlyphs,
            animationTypes: Object.fromEntries(animTypes),
            sampleAnimations: Array.from(this.animationStates.values())
                .slice(0, 3)
                .map(a => ({
                    type: a.glyphType,
                    rotation: a.appliedRotation.toFixed(3),
                    scale: a.appliedScale.toFixed(3),
                    opacity: a.appliedOpacity.toFixed(2)
                }))
        };
    }
}

// ============================================================================
// CONSOLE API
// ============================================================================

export function setupGlyphAnimationConsoleAPI(game) {
    if (!game.glyphAnimationModulator) return;
    
    const modulator = game.glyphAnimationModulator;
    
    window.game.toggleGlyphAnimationDebug = () => {
        return modulator.toggleDebug();
    };
    
    window.game.glyphAnimationStatus = () => {
        return modulator.getStatus();
    };
    
    console.log('[GlyphAnimationModulator] Console API registered');
    console.log('  game.toggleGlyphAnimationDebug()');
    console.log('  game.glyphAnimationStatus()');
}
