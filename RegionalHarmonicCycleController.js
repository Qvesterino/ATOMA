/**
 * ============================================================================
 * REGIONAL HARMONIC CYCLE CONTROLLER
 * ============================================================================
 * 
 * Defines and manages harmonic activity cycles for topology regions.
 * 
 * CORE PHILOSOPHY:
 * Regions do not stay static. They breathe, settle, and re-align over time.
 * 
 * A regional harmonic cycle is a slow oscillation derived from:
 * - Average harmony level (affects cycle phase and amplitude)
 * - Stability duration (affects cycle period)
 * - Resonance persistence (affects cycle visibility)
 * - Healing vs rupture balance (affects cycle confidence)
 * 
 * Cycles operate on long timescales (tens of seconds to minutes).
 * No fast repetition. No global synchronization.
 * 
 * ============================================================================
 */

import * as THREE from 'three';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // CYCLE TIMESCALE
    MIN_CYCLE_PERIOD: 8.0,              // Minimum 8 seconds
    MAX_CYCLE_PERIOD: 60.0,             // Maximum 60 seconds
    
    // CYCLE PHASE DRIFT (prevents obvious looping)
    PHASE_DRIFT_SPEED: 0.02,            // Slow phase shift per second
    PHASE_DRIFT_AMPLITUDE: 0.3,         // Max phase shift (radians per sec)
    
    // STABILITY MODULATION
    STABILITY_PERIOD_MULTIPLIER: 2.0,   // Stable regions: 2x longer cycles
    STABILITY_MIN_AGE: 30.0,            // Min age for stability benefit
    
    // HARMONY MODULATION
    HARMONY_PHASE_BOOST: 1.5,           // Harmony speeds up cycle phase
    CORRUPTION_PHASE_DAMPEN: 0.6,       // Corruption slows cycle phase
    
    // AMPLITUDE MODULATION
    BASE_ANIMATION_AMPLITUDE: 1.0,      // Base scale/rotation amount
    HARMONY_AMPLITUDE_MULTIPLIER: 1.3,  // Harmony increases amplitude
    CORRUPTION_AMPLITUDE_DAMPEN: 0.5,   // Corruption reduces amplitude
    
    // TRANSITION SMOOTHING
    PHASE_TRANSITION_DURATION: 3.0,     // Time to transition between cycles
    
    // DEBUG
    DEBUG_DRAW_CYCLES: false,
    DEBUG_SHOW_PHASE: false
};

// ============================================================================
// HARMONIC CYCLE STATE
// ============================================================================

class HarmonicCycle {
    constructor(regionHash, topologyRegion) {
        this.regionHash = regionHash;
        this.topologyRegion = topologyRegion;
        
        // Cycle parameters
        this.period = this.calculatePeriod();
        this.phase = Math.random() * Math.PI * 2;  // Random initial phase
        this.phaseDrift = 0.0;
        
        // Animation parameters
        this.amplitude = CONFIG.BASE_ANIMATION_AMPLITUDE;
        this.harmonyFactor = 0.5;
        this.stabilityFactor = 0.5;
        this.healingBalance = 0.5;
        
        // Transition state
        this.transitioning = false;
        this.transitionProgress = 0.0;
        this.oldPhase = this.phase;
        this.oldPeriod = this.period;
        
        // Age tracking
        this.age = 0.0;
    }
    
    reset() {
        this.phase = 0.0;
        this.phaseDrift = 0.0;
        this.age = 0.0;
        this.transitioning = false;
    }
    
    calculatePeriod() {
        // Period based on stability: stable regions have longer cycles
        let period = CONFIG.MIN_CYCLE_PERIOD + (CONFIG.MAX_CYCLE_PERIOD - CONFIG.MIN_CYCLE_PERIOD) * 0.5;
        
        // Extend period for mature hubs
        if (this.topologyRegion?.isMaturedHub) {
            const ageBonus = Math.min(1.0, this.topologyRegion.hubAge / CONFIG.STABILITY_MIN_AGE);
            period *= 1.0 + ageBonus * (CONFIG.STABILITY_PERIOD_MULTIPLIER - 1.0);
        }
        
        return period;
    }
    
    update(deltaTime, regionState) {
        if (!this.topologyRegion) return;
        
        this.age += deltaTime;
        
        // Update state factors
        this.harmonyFactor = regionState?.harmony || 0.5;
        this.stabilityFactor = Math.min(1.0, (this.topologyRegion.hubAge || 0) / CONFIG.STABILITY_MIN_AGE);
        this.healingBalance = regionState?.harmony || 0.5;  // Harmony indicates healing dominance
        
        // Calculate effective phase speed
        const baseSpeed = (Math.PI * 2) / this.period;
        const harmonyModulation = this.harmonyFactor > 0.5 
            ? CONFIG.HARMONY_PHASE_BOOST 
            : CONFIG.CORRUPTION_PHASE_DAMPEN;
        const effectiveSpeed = baseSpeed * harmonyModulation;
        
        // Update phase with drift
        const driftAmount = Math.sin(this.age * CONFIG.PHASE_DRIFT_SPEED) * CONFIG.PHASE_DRIFT_AMPLITUDE;
        this.phase += effectiveSpeed * deltaTime + driftAmount * deltaTime;
        
        // Wrap phase
        if (this.phase > Math.PI * 2) {
            this.phase -= Math.PI * 2;
        }
        
        // Update amplitude based on state
        this.amplitude = CONFIG.BASE_ANIMATION_AMPLITUDE;
        if (this.harmonyFactor > 0.5) {
            this.amplitude *= CONFIG.HARMONY_AMPLITUDE_MULTIPLIER;
        } else {
            this.amplitude *= CONFIG.CORRUPTION_AMPLITUDE_DAMPEN;
        }
        
        // Handle transition
        if (this.transitioning) {
            this.transitionProgress += deltaTime / CONFIG.PHASE_TRANSITION_DURATION;
            if (this.transitionProgress >= 1.0) {
                this.transitioning = false;
                this.transitionProgress = 0.0;
            }
        }
    }
    
    // Trigger smooth transition to new cycle
    transitionTo(newRegionState) {
        if (!this.transitioning) {
            this.oldPhase = this.phase;
            this.oldPeriod = this.period;
            this.transitioning = true;
            this.transitionProgress = 0.0;
        }
    }
    
    // Get current animation phase (0-1)
    getPhase() {
        return (this.phase % (Math.PI * 2)) / (Math.PI * 2);
    }
    
    // Get eased animation value (-1 to +1)
    getAnimationValue() {
        const phase = this.getPhase();
        
        // Smooth sine wave (-1 to +1)
        return Math.sin(phase * Math.PI * 2);
    }
    
    // Get rotation animation (radians)
    getRotationAmount() {
        const baseAmount = this.getAnimationValue() * this.amplitude * 0.05;  // ±0.05 rad ≈ ±3 degrees
        return baseAmount * (0.5 + this.stabilityFactor * 0.5);  // Reduce for unstable
    }
    
    // Get scale breathing (0.98-1.02)
    getScaleBreathe() {
        const baseAmount = this.getAnimationValue() * this.amplitude * 0.02;  // ±2%
        return 1.0 + baseAmount * (0.7 + this.stabilityFactor * 0.3);
    }
    
    // Get opacity modulation (subtle, ±5%)
    getOpacityModulation() {
        const baseAmount = this.getAnimationValue() * this.amplitude * 0.05;  // ±5%
        return 1.0 + baseAmount * (0.5 + this.healingBalance * 0.5);  // Reduce under corruption
    }
    
    // Get internal stroke shift (very subtle)
    getStrokeShift() {
        const baseAmount = this.getAnimationValue() * this.amplitude * 0.01;  // ±1%
        return baseAmount * (0.7 + this.stabilityFactor * 0.3);
    }
}

// ============================================================================
// CYCLE CONTROLLER
// ============================================================================

export class RegionalHarmonicCycleController {
    constructor(topologySystem) {
        this.topologySystem = topologySystem;
        
        // Cycles per region
        this.cyclesByRegionHash = new Map();
        
        // Update tracking
        this.updateTimer = 0.0;
        
        this.enabled = true;
        
        console.log('[RegionalHarmonicCycleController] Initialized');
    }
    
    // ========================================================================
    // CYCLE MANAGEMENT
    // ========================================================================
    
    getOrCreateCycle(regionHash, topologyRegion) {
        if (this.cyclesByRegionHash.has(regionHash)) {
            return this.cyclesByRegionHash.get(regionHash);
        }
        
        const cycle = new HarmonicCycle(regionHash, topologyRegion);
        this.cyclesByRegionHash.set(regionHash, cycle);
        return cycle;
    }
    
    getCycle(regionHash) {
        return this.cyclesByRegionHash.get(regionHash) || null;
    }
    
    // ========================================================================
    // UPDATE LOOP
    // ========================================================================
    
    update(deltaTime, networkState) {
        if (!this.enabled || !this.topologySystem) return;
        
        // Get active regions
        const regions = this.topologySystem.getActiveRegions?.();
        if (!regions) return;
        
        // Update existing cycles
        for (let cycle of this.cyclesByRegionHash.values()) {
            cycle.update(deltaTime, networkState);
        }
        
        // Create cycles for new regions
        for (let region of regions) {
            if (!region.active) continue;
            
            const hash = this.regionToHash(region);
            this.getOrCreateCycle(hash, region);
        }
        
        // Clean up dead cycles
        this.cleanupDeadCycles(regions);
    }
    
    cleanupDeadCycles(activeRegions) {
        const activeHashes = new Set();
        for (let region of activeRegions) {
            activeHashes.add(this.regionToHash(region));
        }
        
        for (let hash of this.cyclesByRegionHash.keys()) {
            if (!activeHashes.has(hash)) {
                this.cyclesByRegionHash.delete(hash);
            }
        }
    }
    
    regionToHash(region) {
        const gridX = Math.round(region.center.x / 10);
        const gridY = Math.round(region.center.y / 10);
        const gridZ = Math.round(region.center.z / 10);
        return `${gridX},${gridY},${gridZ}`;
    }
    
    // ========================================================================
    // ENABLE / DISABLE
    // ========================================================================
    
    enable() {
        this.enabled = true;
        console.log('[RegionalHarmonicCycleController] ENABLED');
    }
    
    disable() {
        this.enabled = false;
        this.cyclesByRegionHash.clear();
        console.log('[RegionalHarmonicCycleController] DISABLED');
    }
    
    // ========================================================================
    // DEBUG & STATUS
    // ========================================================================
    
    toggleDebug() {
        CONFIG.DEBUG_DRAW_CYCLES = !CONFIG.DEBUG_DRAW_CYCLES;
        console.log('[Glyph Cycle] Debug mode:', CONFIG.DEBUG_DRAW_CYCLES);
        return CONFIG.DEBUG_DRAW_CYCLES;
    }
    
    getStatus() {
        return {
            enabled: this.enabled,
            activeCycles: this.cyclesByRegionHash.size,
            cycleStats: Array.from(this.cyclesByRegionHash.values()).map(c => ({
                period: c.period.toFixed(1),
                phase: (c.getPhase() * 100).toFixed(0) + '%',
                amplitude: c.amplitude.toFixed(2),
                stability: (c.stabilityFactor * 100).toFixed(0) + '%'
            }))
        };
    }
}

// ============================================================================
// CONSOLE API
// ============================================================================

export function setupRegionalHarmonicCycleConsoleAPI(game) {
    if (!game.harmonicCycleController) return;
    
    const controller = game.harmonicCycleController;
    
    window.game.toggleGlyphCycleDebug = () => {
        return controller.toggleDebug();
    };
    
    window.game.glyphCycleStatus = () => {
        return controller.getStatus();
    };
    
    console.log('[RegionalHarmonicCycleController] Console API registered');
    console.log('  game.toggleGlyphCycleDebug()');
    console.log('  game.glyphCycleStatus()');
}
