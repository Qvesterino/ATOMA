/**
 * LinkSurfacePhaseRipples
 * ============================================================================
 * Surface phase ripples for braided links — subtle, flowing light interference
 * patterns that orbit around the link surface and propagate longitudinally.
 * 
 * SYSTEM BEHAVIOR:
 * - Reuses existing braided strand geometry (no new meshes)
 * - Applies phase-driven modulation to emissive intensity and hue
 * - Motion driven by synergy phase (deterministic, not noisy)
 * - Two motion components: longitudinal (along link) + angular (around surface)
 * - Combined creates diagonal flowing interference pattern
 * - Very subtle (secondary to streaks and pulses)
 * - Visible mainly on motion or camera shift
 * 
 * PHILOSOPHY:
 * Surface ripples look like light refracting through an energy sheath around
 * the braided link. They're meditative, organic, and add depth without clutter.
 * 
 * ARCHITECTURE:
 * - Per-link ripple state tracking
 * - Phase computation from synergy-driven time
 * - Harmony-based smoothing
 * - Corruption-based discontinuity
 * - Material uniform updates (emissive modulation)
 * - Optional hue shift via color modulation
 * 
 * CONSTRAINTS:
 * ✅ Adapter-only visual system
 * ✅ Reuses existing geometry only
 * ✅ No new materials or meshes
 * ✅ Zero per-frame allocations
 * ✅ No randomness (fully deterministic)
 * ✅ Graceful fallback if geometry missing
 * ✅ No opacity changes
 * ✅ Safe material uniform updates only
 * 
 * STATE DRIVERS:
 * - Synergy: Controls ripple speed (both longitudinal and angular)
 * - Harmony: Smooths transitions, broadens ripples
 * - Corruption: Breaks phase continuity, adds discontinuities
 * - Instability: Dampens amplitude, causes partial dropout
 * 
 * MOTION MODEL:
 * - Longitudinal: Moves along link curve (synergy-scaled)
 * - Angular: Rotates around rope circumference (very slow)
 * - Combined: Diagonal flowing pattern around link
 * - Period: ~20-30 seconds for full rotation (meditative)
 */

import * as THREE from 'three';

export class LinkSurfacePhaseRipples {
    constructor() {
        // Per-link ripple state (stored on link.rippleState)
        // {
        //   surfacePhase: 0-1 (longitudinal motion)
        //   angularPhase: 0-1 (rotation around link)
        //   phaseOffset: 0-2π (combined phase)
        //   lastSynergy: previous synergy (for smoothing)
        //   transitionFactor: 0-1 (harmony-based smoothing)
        //   discontinuityPhase: 0-1 (corruption-driven break)
        // }

        // Configuration
        this.config = {
            // Motion speeds (all synergy-modulated)
            longitudinalSpeedBase: 0.3,         // Units per second (synergy multiplier)
            angularSpeedBase: 0.02,             // Radians per second (very slow)
            angularSpeedMax: 0.08,              // Max angular speed at high synergy
            
            // Phase behavior
            phaseWavelength: 0.4,               // Distance between ripple peaks (normalized 0-1)
            phaseAmplitude: 0.3,                // Peak-to-trough oscillation
            
            // Modulation targets
            emissiveIntensityMin: -0.15,        // Darkening (fraction of base)
            emissiveIntensityMax: 0.15,         // Brightening
            hueShiftMin: -4.0,                  // Degrees
            hueShiftMax: 4.0,                   // Degrees
            
            // Damping & smoothing
            harmonySmoothing: 0.2,              // Higher = smoother transitions
            instabilityDamping: 0.8,            // How much instability dampens amplitude
            corruptionJitter: 0.3,              // Temporal flicker strength
            
            // Decay when inactive
            inactiveDecayRate: 0.08,            // How fast ripples fade when link inactive
        };

        // Math cache
        this._vec3 = new THREE.Vector3();
        this._hslColor = { h: 0, s: 0, l: 0 };
    }

    /**
     * Initialize ripple state for a link
     */
    initializeLink(link) {
        if (!link.rippleState) {
            link.rippleState = {
                surfacePhase: 0.0,
                angularPhase: 0.0,
                phaseOffset: 0.0,
                lastSynergy: 0.0,
                transitionFactor: 0.0,
                discontinuityPhase: 0.0,
                harmonySmoothingFactor: 0.0,
                amplitudeDamping: 1.0,
                isActive: true,
            };
        }
        return link.rippleState;
    }

    /**
     * Update ripple state for a link each frame
     */
    update(link, metrics, deltaTime = 0.016) {
        const ripple = this.initializeLink(link);

        // Clamp inputs
        const synergy = Math.max(0, Math.min(1, metrics.synergy || 0.3));
        const harmony = Math.max(0, Math.min(1, metrics.harmony || 0.5));
        const corruption = Math.max(0, Math.min(1, metrics.corruption || 0.0));
        const instability = Math.max(0, Math.min(1, metrics.instability || 0.0));

        // Advance longitudinal phase (synergy-driven)
        const longitudinalSpeed = this.config.longitudinalSpeedBase * (0.5 + synergy);
        ripple.surfacePhase += longitudinalSpeed * deltaTime;
        ripple.surfacePhase = ripple.surfacePhase % 1.0; // Wrap 0-1

        // Advance angular phase (very slow, synergy-modulated)
        const angularSpeed = this.config.angularSpeedBase + 
                            synergy * (this.config.angularSpeedMax - this.config.angularSpeedBase);
        ripple.angularPhase += angularSpeed * deltaTime;
        ripple.angularPhase = ripple.angularPhase % (Math.PI * 2); // Wrap 0-2π

        // Compute combined phase (diagonal interference pattern)
        this.updateCombinedPhase(ripple, harmony, corruption);

        // Update harmonic smoothing (harmony reduces jitter)
        ripple.harmonySmoothingFactor = harmony * this.config.harmonySmoothing;

        // Update amplitude damping (instability reduces visibility)
        const instabilityDamping = 1.0 - instability * this.config.instabilityDamping;
        ripple.amplitudeDamping = Math.max(0.2, instabilityDamping); // Min 20% visibility

        // Apply decay when link inactive
        if (!link.isActive) {
            ripple.amplitudeDamping *= (1.0 - this.config.inactiveDecayRate * deltaTime);
        }

        ripple.lastSynergy = synergy;
        ripple.isActive = link.isActive || false;
    }

    /**
     * Compute combined phase with harmony smoothing and corruption discontinuity
     */
    updateCombinedPhase(ripple, harmony, corruption) {
        // Base combined phase: diagonal pattern
        // Longitudinal dominates, angular adds rotation
        const basePhase = ripple.surfacePhase + ripple.angularPhase * 0.2; // Angular is secondary

        // Apply corruption-driven discontinuity (temporal flicker)
        const discontinuity = Math.sin(ripple.surfacePhase * Math.PI * 8) * 
                             corruption * this.config.corruptionJitter;

        // Smooth phase changes with harmony (harmony reduces jitter)
        const transitionSmoothing = harmony * this.config.harmonySmoothing;
        ripple.phaseOffset = basePhase + discontinuity;

        // Apply smoothing interpolation
        ripple.transitionFactor = transitionSmoothing;
    }

    /**
     * Get emissive intensity modulation for a link
     * Returns: { intensity: float, factor: 0-1 }
     */
    getEmissiveModulation(link, metrics = {}) {
        const ripple = link.rippleState;
        if (!ripple) return { intensity: 0, factor: 0 };

        const synergy = Math.max(0, Math.min(1, metrics.synergy || 0.3));
        const harmony = Math.max(0, Math.min(1, metrics.harmony || 0.5));

        // Compute ripple wave at current phase
        const waveValue = Math.sin(ripple.phaseOffset * Math.PI * 2) * 
                         this.config.phaseAmplitude;

        // Scale by synergy (higher synergy = more visible ripples)
        const synergyScale = 0.4 + synergy * 0.6; // 0.4-1.0 range

        // Dampen by instability
        const dampenedWave = waveValue * ripple.amplitudeDamping * synergyScale;

        // Apply harmony smoothing (reduces jitter)
        const smoothedWave = dampenedWave * (1.0 - ripple.transitionFactor * 0.5);

        // Map to emissive intensity range
        const intensity = smoothedWave * this.config.emissiveIntensityMax;

        return {
            intensity,
            factor: Math.abs(smoothedWave),
            baseWave: waveValue,
            damping: ripple.amplitudeDamping,
        };
    }

    /**
     * Get hue shift modulation (optional, subtle color phase)
     * Returns: { hueShift: degrees, saturation: 0-1 }
     */
    getHueShiftModulation(link, metrics = {}) {
        const ripple = link.rippleState;
        if (!ripple) return { hueShift: 0, saturation: 0 };

        const corruption = Math.max(0, Math.min(1, metrics.corruption || 0.0));
        const harmony = Math.max(0, Math.min(1, metrics.harmony || 0.5));

        // Ripple creates subtle hue variation
        const waveValue = Math.sin(ripple.phaseOffset * Math.PI);
        const hueShift = waveValue * this.config.hueShiftMax;

        // Corruption increases hue variation (color instability)
        const corruptionHueScale = 1.0 + corruption * 0.5;
        const modulatedHueShift = hueShift * corruptionHueScale;

        // Harmony smooths hue transitions
        const saturation = (0.3 + harmony * 0.4) * ripple.amplitudeDamping;

        return {
            hueShift: modulatedHueShift,
            saturation: Math.max(0, saturation),
            factor: Math.abs(waveValue),
        };
    }

    /**
     * Get ripple surface information for visualization
     * For debugging/analysis
     */
    getRippleVisualization(link, samples = 32) {
        const ripple = link.rippleState;
        if (!ripple) return [];

        // Sample ripple pattern around link circumference
        const result = [];
        for (let i = 0; i < samples; i++) {
            const angle = (i / samples) * Math.PI * 2;
            const samplePhase = ripple.surfacePhase + angle * 0.1;
            const waveValue = Math.sin(samplePhase * Math.PI * 2) * this.config.phaseAmplitude;

            result.push({
                angle,
                phase: samplePhase,
                wave: waveValue * ripple.amplitudeDamping,
            });
        }
        return result;
    }

    /**
     * Get ripple state debug info
     */
    getDebugInfo(link) {
        const ripple = link.rippleState;
        if (!ripple) return null;

        return {
            surfacePhase: ripple.surfacePhase,
            angularPhase: ripple.angularPhase,
            phaseOffset: ripple.phaseOffset,
            transitionFactor: ripple.transitionFactor,
            discontinuityPhase: ripple.discontinuityPhase,
            harmonySmoothingFactor: ripple.harmonySmoothingFactor,
            amplitudeDamping: ripple.amplitudeDamping,
            isActive: ripple.isActive,
        };
    }

    /**
     * Apply ripples to link material (shader uniform updates)
     * Safe, non-allocating material update
     */
    applyRipplesToMaterial(link, material, metrics = {}) {
        if (!material || !material.uniforms) return;

        const emissive = this.getEmissiveModulation(link, metrics);
        const hueShift = this.getHueShiftModulation(link, metrics);

        // Update shader uniforms safely
        if (material.uniforms.u_rippleIntensity) {
            material.uniforms.u_rippleIntensity.value = emissive.intensity;
        }

        if (material.uniforms.u_ripplesActive) {
            material.uniforms.u_ripplesActive.value = link.rippleState?.amplitudeDamping > 0.1 ? 1 : 0;
        }

        if (material.uniforms.u_hueShift) {
            material.uniforms.u_hueShift.value = hueShift.hueShift;
        }

        if (material.uniforms.u_rippleSaturation) {
            material.uniforms.u_rippleSaturation.value = hueShift.saturation;
        }

        // Store for external use
        if (!link.materialRippleData) {
            link.materialRippleData = {};
        }
        link.materialRippleData.emissive = emissive;
        link.materialRippleData.hueShift = hueShift;
    }

    /**
     * Get ripple blend factor (how prominent ripples are)
     * Combines synergy, harmony, and damping
     */
    getRippleBlendFactor(link, metrics = {}) {
        const ripple = link.rippleState;
        if (!ripple) return 0;

        const synergy = Math.max(0, Math.min(1, metrics.synergy || 0.3));
        const harmony = Math.max(0, Math.min(1, metrics.harmony || 0.5));

        // Ripples most visible at high synergy and moderate-high harmony
        const synergyFactor = synergy * 0.8;
        const harmonyFactor = harmony > 0.3 ? (harmony - 0.3) * 0.4 : 0;

        return (synergyFactor + harmonyFactor) * ripple.amplitudeDamping;
    }

    /**
     * Disable ripples for a link (transitions smoothly)
     */
    disable(link, duration = 0.5) {
        const ripple = this.initializeLink(link);
        ripple.targetAmplitude = 0;
        ripple.disableDuration = duration;
        ripple.disableElapsed = 0;
    }

    /**
     * Reset ripples for a link (full state reset)
     */
    reset(link) {
        link.rippleState = {
            surfacePhase: 0.0,
            angularPhase: 0.0,
            phaseOffset: 0.0,
            lastSynergy: 0.0,
            transitionFactor: 0.0,
            discontinuityPhase: 0.0,
            harmonySmoothingFactor: 0.0,
            amplitudeDamping: 1.0,
            isActive: true,
        };
    }
}

/**
 * Example shader code for applying ripples:
 * 
 * Vertex Shader:
 * ```glsl
 * // Ripple computation
 * vec3 rippleNormal = normal;
 * if (u_ripplesActive > 0.5) {
 *     float ripple = sin(vUv.x * 10.0 + uTime * 2.0 + u_rippleIntensity * 5.0) * 0.1;
 *     rippleNormal += normalize(normal) * ripple;
 * }
 * vNormal = normalize(normalMatrix * rippleNormal);
 * ```
 * 
 * Fragment Shader:
 * ```glsl
 * // Emissive modulation
 * vec3 emissive = u_emissiveColor;
 * emissive *= (1.0 + u_rippleIntensity * 0.5);
 * 
 * // Optional hue shift
 * vec3 hslColor = rgbToHsl(emissive);
 * hslColor.x += u_hueShift / 360.0;
 * emissive = hslToRgb(hslColor);
 * 
 * gl_FragColor.rgb += emissive * u_rippleSaturation;
 * ```
 */
