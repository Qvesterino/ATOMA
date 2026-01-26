/**
 * ============================================================================
 * FX PERFORMANCE SMOOTH TRANSITION v1.0
 * ============================================================================
 * 
 * PHASE 3C WEEK 4.5: Visual Polish Layer for Quality Mode Transitions
 * 
 * PURPOSE:
 *   Smoothly interpolate multipliers over time when LowFX toggles
 *   (manual F7 or automatic adaptive). Instead of instant jumps,
 *   effects gradually fade in/out, creating a polished visual transition.
 * 
 * DESIGN:
 *   • Non-invasive: reads multipliers, does not modify other systems
 *   • Additive-only: fits above FXPerformanceScaler in update stack
 *   • Graceful degradation: safe with null dependencies
 *   • High-fidelity: smooth curves, no performance hit
 * 
 * ARCHITECTURE:
 *   When transition starts:
 *     1. Read current multipliers (startValues)
 *     2. Read target multipliers (endValues)
 *     3. Initialize progress = 0, blending = true
 *   
 *   Each frame:
 *     4. progress += deltaTime / duration
 *     5. For each multiplier key:
 *        - Interpolate: start * (1-t) + end * t
 *        - Write back to perf.multipliers[key]
 *     6. When progress >= 1.0, stop blending
 * 
 * SIGNALS INTERPOLATED:
 *   • clarity, resonance, entropy, focus, corruption
 *   • vfxIntensity, shaderIntensity
 *   (All multipliers from FXPerformanceController_v1)
 * 
 * ============================================================================
 */

export class FXPerformanceSmoothTransition_v1 {
    /**
     * Initialize the smooth transition layer
     * @param {FXPerformanceController_v1} perfController - Performance controller
     * @param {Object} options - Configuration
     * @param {number} [options.duration=0.6] - Transition duration in seconds
     * @param {boolean} [options.enableDebug=false] - Debug logging
     */
    constructor(perfController, options = {}) {
        this.perf = perfController;

        // =====================================================================
        // CONFIGURATION
        // =====================================================================
        this.duration = options.duration ?? 0.6;  // 0.6s fade is smooth but snappy
        this.enableDebug = options.enableDebug ?? false;

        // =====================================================================
        // STATE TRACKING
        // =====================================================================
        // Progress: 0 (at start) → 1 (at end)
        this.progress = 1.0;  // Initialize at 1.0 (not transitioning)

        // Is a transition currently active?
        this.blending = false;

        // Snapshot of multipliers at transition start
        this.startValues = {};

        // Target multipliers at transition end
        this.endValues = {};

        // For tracking transitions
        this.lastToggleState = perfController?.isLowFX?.() ?? false;
        this.transitionCount = 0;
    }

    /**
     * Start a new transition when LowFX mode changes
     * Called when user presses F7 or adaptive monitor toggles
     * 
     * @param {boolean} toLowFX - Target state (true = enable LowFX, false = disable)
     */
    startTransition(toLowFX) {
        // Graceful null-safety
        if (!this.perf || !this.perf.multipliers) {
            return;
        }

        // =====================================================================
        // CAPTURE CURRENT STATE
        // =====================================================================
        // Take snapshot of current multipliers (transition start point)
        this.startValues = {
            clarity: this.perf.multipliers.clarity ?? 1.0,
            resonance: this.perf.multipliers.resonance ?? 1.0,
            entropy: this.perf.multipliers.entropy ?? 1.0,
            focus: this.perf.multipliers.focus ?? 1.0,
            corruption: this.perf.multipliers.corruption ?? 1.0,
            vfxIntensity: this.perf.multipliers.vfxIntensity ?? 1.0,
            shaderIntensity: this.perf.multipliers.shaderIntensity ?? 1.0,
        };

        // =====================================================================
        // DETERMINE TARGET STATE
        // =====================================================================
        // Use FXPerformanceController's multiplier sets as targets
        if (toLowFX) {
            // Target: low FX multipliers (reduced quality)
            this.endValues = {
                clarity: this.perf.lowFXMultipliers?.clarity ?? 0.4,
                resonance: this.perf.lowFXMultipliers?.resonance ?? 0.4,
                entropy: this.perf.lowFXMultipliers?.entropy ?? 0.2,
                focus: this.perf.lowFXMultipliers?.focus ?? 0.3,
                corruption: this.perf.lowFXMultipliers?.corruption ?? 0.5,
                vfxIntensity: this.perf.lowFXMultipliers?.vfxIntensity ?? 0.3,
                shaderIntensity: this.perf.lowFXMultipliers?.shaderIntensity ?? 0.25,
            };
        } else {
            // Target: full quality multipliers (all 1.0)
            this.endValues = {
                clarity: this.perf.fullQualityMultipliers?.clarity ?? 1.0,
                resonance: this.perf.fullQualityMultipliers?.resonance ?? 1.0,
                entropy: this.perf.fullQualityMultipliers?.entropy ?? 1.0,
                focus: this.perf.fullQualityMultipliers?.focus ?? 1.0,
                corruption: this.perf.fullQualityMultipliers?.corruption ?? 1.0,
                vfxIntensity: this.perf.fullQualityMultipliers?.vfxIntensity ?? 1.0,
                shaderIntensity: this.perf.fullQualityMultipliers?.shaderIntensity ?? 1.0,
            };
        }

        // =====================================================================
        // INITIALIZE TRANSITION
        // =====================================================================
        this.progress = 0;
        this.blending = true;
        this.lastToggleState = toLowFX;
        this.transitionCount += 1;

        if (this.enableDebug) {
            console.log(
                `[FXPerformanceSmoothTransition] Starting transition #${this.transitionCount} ` +
                `(${toLowFX ? 'LowFX ON' : 'LowFX OFF'}) over ${this.duration.toFixed(2)}s`
            );
        }
    }

    /**
     * Update the transition each frame
     * Called from main.js animate() after fxPerformanceScaler
     * 
     * @param {number} deltaTime - Frame time in seconds
     */
    update(deltaTime) {
        // Graceful early exit if not transitioning
        if (!this.frameScheduler?.shouldRunVisual?.()) return;
        if (!this.blending || !this.perf || !this.perf.multipliers || deltaTime <= 0) {
            return;
        }

        // =====================================================================
        // ADVANCE TRANSITION PROGRESS
        // =====================================================================
        this.progress += deltaTime / this.duration;

        // Clamp to [0, 1]
        const t = Math.min(this.progress, 1.0);

        // =====================================================================
        // INTERPOLATE ALL MULTIPLIERS
        // =====================================================================
        // Linear interpolation: start * (1-t) + end * t
        const keys = Object.keys(this.startValues);
        
        for (const key of keys) {
            const start = this.startValues[key] ?? 1.0;
            const end = this.endValues[key] ?? 1.0;
            
            // Smooth linear interpolation
            const interpolated = start * (1 - t) + end * t;
            
            // Write back to performance controller's multipliers
            this.perf.multipliers[key] = interpolated;
        }

        // =====================================================================
        // END TRANSITION WHEN COMPLETE
        // =====================================================================
        if (t >= 1.0) {
            this.blending = false;
            this.progress = 1.0;

            if (this.enableDebug) {
                console.log(
                    `[FXPerformanceSmoothTransition] Transition #${this.transitionCount} complete`
                );
            }
        }
    }

    /**
     * Get current transition state (for debugging/telemetry)
     * @returns {Object} State snapshot
     */
    getState() {
        return {
            blending: this.blending,
            progress: this.progress,
            duration: this.duration,
            transitionCount: this.transitionCount,
            lastToggleState: this.lastToggleState,
            startValues: { ...this.startValues },
            endValues: { ...this.endValues },
        };
    }

    /**
     * Forcefully end current transition (snap to end)
     * Useful for debugging or emergency cases
     */
    snapToEnd() {
        if (!this.blending || !this.perf || !this.perf.multipliers) {
            return;
        }

        // Apply end values directly
        const keys = Object.keys(this.endValues);
        for (const key of keys) {
            this.perf.multipliers[key] = this.endValues[key];
        }

        this.blending = false;
        this.progress = 1.0;

        if (this.enableDebug) {
            console.log('[FXPerformanceSmoothTransition] Snapped to end (emergency)');
        }
    }
}

// ============================================================================
// EXPORT SUMMARY
// ============================================================================
// 
// export class FXPerformanceSmoothTransition_v1 {
//   constructor(perfController, options)
//   startTransition(toLowFX)
//   update(deltaTime)
//   getState()
//   snapToEnd()
// }
//
// ============================================================================
