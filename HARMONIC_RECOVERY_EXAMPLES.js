/**
 * Harmonic Hub Recovery System — Working Examples
 * ============================================================================
 * Copy-paste examples for integrating recovery effects into visual systems.
 * All examples follow zero-allocation, adapter-only patterns.
 * 
 * FILE STRUCTURE:
 * 1. Setup & Initialization
 * 2. Visual System Integration Examples (6 systems)
 * 3. Console Testing Utilities
 * 4. Debugging Helpers
 */

// ============================================================================
// 1. SETUP & INITIALIZATION
// ============================================================================

/**
 * Initialize recovery controller for a harmonic hub
 */
export function initializeRecoveryForHub(node) {
    const { NodeHarmonicSyncController } = require('./NodeHarmonicSyncController.js');
    const { HarmonicHubCollapseController } = require('./HarmonicHubCollapseController.js');
    const { HarmonicHubRecoveryController } = require('./HarmonicHubRecoveryController.js');

    // Create controllers
    const harmonicSync = new NodeHarmonicSyncController(node);
    const collapseController = new HarmonicHubCollapseController(harmonicSync);
    const recoveryController = new HarmonicHubRecoveryController(harmonicSync, collapseController);

    // Store on node
    node.harmonicSync = harmonicSync;
    node.harmonicCollapse = collapseController;
    node.harmonicRecovery = recoveryController;

    console.log(`✅ Recovery initialized for node ${node.id}`);
    return { harmonicSync, collapseController, recoveryController };
}

/**
 * Update loop for harmonic hubs
 */
export function updateHarmonicHub(node, deltaTime = 0.016) {
    if (!node.harmonicRecovery) return;

    // Get node metrics
    const metrics = node.getMetrics();
    const harmony = metrics.harmony || 0.5;
    const corruption = metrics.corruption || 0.0;
    const synergy = metrics.synergy || 0.3;
    const instability = metrics.instability || 0.0;

    // Update collapse state
    node.harmonicCollapse.update(harmony, corruption, synergy, instability, deltaTime);

    // Update recovery state (pass collapse factor)
    node.harmonicRecovery.update(
        harmony,
        corruption,
        synergy,
        instability,
        deltaTime,
        node.harmonicCollapse.collapseFactor
    );

    // Update harmonic sync
    node.harmonicSync.update(harmony, corruption, instability);
}

// ============================================================================
// 2. VISUAL SYSTEM INTEGRATION EXAMPLES
// ============================================================================

/**
 * EXAMPLE 1: Braided Strand Integration
 * ─────────────────────────────────────
 * Applies exponential jitter decay during recovery dampening phase.
 */
export class BraidedStrandRecoveryIntegration {
    constructor(renderer) {
        this.renderer = renderer;
    }

    updateBraidedStrands(link, mesh, deltaTime) {
        const sourceNode = link.source;
        if (!sourceNode?.harmonicRecovery) return;

        // Get current jitter amplitude from collapse state
        const collapseVariance = sourceNode.harmonicCollapse?.phaseVariance ?? 0.0;
        const jitterAmplitude = collapseVariance * 0.2;

        // Apply recovery dampening
        const recoveredJitter = sourceNode.harmonicRecovery.getBraidedStrandRecovery(jitterAmplitude);

        // Use in deformation
        const deformationStrength = recoveredJitter * 0.5;
        mesh.userData.jitterForce = deformationStrength;

        // Update shader uniform
        if (mesh.material?.uniforms?.u_jitterForce) {
            mesh.material.uniforms.u_jitterForce.value = deformationStrength;
        }

        console.debug(`[Braided] Link ${link.id}: jitter=${recoveredJitter.toFixed(4)}`);
    }

    // Helper: Get jitter from collapse variance
    getJitterAmplitudeFromCollapse(sourceNode) {
        const variance = sourceNode.harmonicCollapse?.phaseVariance ?? 0.0;
        return variance * 0.2; // Scale factor
    }
}

/**
 * EXAMPLE 2: Directional Energy Streaks Integration
 * ────────────────────────────────────────────────
 * Closes irregular gaps and normalizes spacing during re-alignment phase.
 */
export class DirectionalStreaksRecoveryIntegration {
    constructor(renderer) {
        this.renderer = renderer;
        this.config = {
            baseSpacing: 1.0,
            chaosSpacingScale: 0.5,
        };
    }

    updateStreakGeometry(link, mesh, deltaTime) {
        const sourceNode = link.source;
        if (!sourceNode?.harmonicRecovery) return;

        // Get current streak parameters
        const currentGapSize = this.computeStreakGapSize(sourceNode);
        const currentSpacing = this.computeStreakSpacing(sourceNode);

        // Apply recovery effect
        const streakEffect = sourceNode.harmonicRecovery.getDirectionalStreakRecovery(
            currentGapSize,
            currentSpacing
        );

        // Update mesh parameters
        mesh.userData.gapSize = streakEffect.gapSize;
        mesh.userData.spacing = streakEffect.spacing;
        mesh.userData.uniformity = streakEffect.uniformity;

        // Update shader uniforms
        if (mesh.material?.uniforms) {
            mesh.material.uniforms.u_gapSize.value = streakEffect.gapSize;
            mesh.material.uniforms.u_spacing.value = streakEffect.spacing;
            mesh.material.uniforms.u_uniformity.value = streakEffect.uniformity;
        }

        console.debug(`[Streaks] Link ${link.id}: uniformity=${streakEffect.uniformity.toFixed(3)}`);
    }

    computeStreakGapSize(sourceNode) {
        const variance = sourceNode.harmonicCollapse?.phaseVariance ?? 0.0;
        const instability = sourceNode.metrics?.instability ?? 0.0;
        return variance * (0.3 + instability * 0.2);
    }

    computeStreakSpacing(sourceNode) {
        const variance = sourceNode.harmonicCollapse?.phaseVariance ?? 0.0;
        return this.config.baseSpacing + variance * this.config.chaosSpacingScale;
    }
}

/**
 * EXAMPLE 3: Pulse Wave Phase Synchronization
 * ────────────────────────────────────────────
 * Enhances sync strength during recovery re-alignment & re-locking phases.
 */
export class PulseWaveSyncRecoveryIntegration {
    constructor(linkPulsePhaseSync) {
        this.pulseSync = linkPulsePhaseSync;
        this.config = {
            baseStrength: 0.6,
            harmonyBoost: 0.4,
            corruptionDamping: 0.8,
            phaseInterpolationRate: 0.12,
        };
    }

    applyRecoveryToPulseSync(link, linkIndex, linkCount, metrics, deltaTime) {
        const sourceNode = link.source;
        if (!sourceNode?.harmonicRecovery) return;

        // Calculate base sync strength
        const baseStrength = this.calculateSyncStrength(metrics);

        // Enhance with recovery re-alignment
        const recoveredStrength = sourceNode.harmonicRecovery.getRecoveredSyncStrength(baseStrength);

        // Apply to pulse phase interpolation
        const hubPhase = sourceNode.harmonicSync?.hubPhase ?? 0.0;
        const targetPhaseOffset = hubPhase;

        // Smooth interpolation toward hub phase
        link.pulsePhaseOffset = this.lerpAngle(
            link.pulsePhaseOffset || 0,
            targetPhaseOffset,
            recoveredStrength * this.config.phaseInterpolationRate * deltaTime
        );

        console.debug(`[Pulse] Link ${link.id}: syncStrength=${recoveredStrength.toFixed(3)}`);
    }

    calculateSyncStrength(metrics) {
        const harmony = metrics.harmony || 0.5;
        const corruption = metrics.corruption || 0.0;
        const instability = metrics.instability || 0.0;

        return Math.max(0, Math.min(1.0,
            this.config.baseStrength +
            harmony * this.config.harmonyBoost -
            corruption * this.config.corruptionDamping -
            instability * 0.6
        ));
    }

    lerpAngle(from, to, t) {
        // Shortest path interpolation for angles
        let diff = to - from;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        return from + diff * t;
    }
}

/**
 * EXAMPLE 4: Surface Phase Ripples Healing
 * ─────────────────────────────────────────
 * Heals torn interference patterns during re-locking phase.
 */
export class SurfaceRipplesRecoveryIntegration {
    constructor(renderer) {
        this.renderer = renderer;
    }

    updateSurfaceRipples(link, mesh, deltaTime) {
        const sourceNode = link.source;
        if (!sourceNode?.harmonicRecovery) return;

        // Get base interference strength
        const variance = sourceNode.harmonicCollapse?.phaseVariance ?? 0.0;
        const baseInterference = variance * 0.4;

        // Apply recovery healing
        const healedStrength = sourceNode.harmonicRecovery.getSurfaceRippleRecovery(baseInterference);

        // Update ripple state
        mesh.userData.rippleAmplitude = healedStrength;
        mesh.userData.angularCoherence = 1.0 - healedStrength;

        // Update shader
        if (mesh.material?.uniforms) {
            mesh.material.uniforms.u_rippleAmplitude.value = healedStrength;
            mesh.material.uniforms.u_angularCoherence.value = mesh.userData.angularCoherence;
        }

        console.debug(`[Ripples] Link ${link.id}: coherence=${mesh.userData.angularCoherence.toFixed(3)}`);
    }
}

/**
 * EXAMPLE 5: Harmonic Halo Stabilization
 * ───────────────────────────────────────
 * Stabilizes oscillation and contracts halo during recovery re-locking.
 */
export class HaloStabilizationRecoveryIntegration {
    constructor(nodeAuraSystem) {
        this.auraSystem = nodeAuraSystem;
        this.config = {
            haloBaseSize: 1.0,
            haloMaxSize: 2.0,
        };
    }

    updateNodeHalo(node, haloBonesMesh, deltaTime) {
        if (!node.harmonicRecovery) return;

        // Get current halo state from collapse controller
        const haloState = node.harmonicCollapse?.getHaloEffect() ?? {
            phase: 0,
            amplitude: 0.05,
        };

        // Apply stabilization during recovery
        const stabilization = node.harmonicRecovery.getHaloStabilization(
            haloState.phase,
            haloState.amplitude
        );

        // Update halo properties
        haloBonesMesh.userData.haloAmplitude = stabilization.amplitude;
        haloBonesMesh.userData.haloPhase = stabilization.phase;

        // Contract halo size toward baseline
        const targetSize = this.config.haloBaseSize +
            (this.config.haloMaxSize - this.config.haloBaseSize) *
            (1.0 - stabilization.stabilizationProgress);

        haloBonesMesh.scale.set(targetSize, targetSize, targetSize);

        // Update shader
        if (haloBonesMesh.material?.uniforms) {
            haloBonesMesh.material.uniforms.u_haloAmplitude.value = stabilization.amplitude;
            haloBonesMesh.material.uniforms.u_haloPhase.value = stabilization.phase;
            haloBonesMesh.material.uniforms.u_stabilizationProgress.value = stabilization.stabilizationProgress;
        }

        console.debug(`[Halo] Node ${node.id}: amplitude=${stabilization.amplitude.toFixed(4)}, stabilization=${stabilization.stabilizationProgress.toFixed(3)}`);
    }
}

/**
 * EXAMPLE 6: Resonance Re-Lock Wave (Optional Polish)
 * ────────────────────────────────────────────────────
 * Emits a soft expanding phase wave at recovery start.
 */
export class ReLockWaveRecoveryIntegration {
    constructor(linkRenderer) {
        this.linkRenderer = linkRenderer;
    }

    applyReLockWaveToLink(link, linkIndex, linkCount, deltaTime) {
        const sourceNode = link.source;
        if (!sourceNode?.harmonicRecovery) return;

        // Get wave effect
        const waveEffect = sourceNode.harmonicRecovery.getReLockWaveEffect(linkIndex, linkCount);

        if (!waveEffect || !waveEffect.isActive) {
            // Clear wave state if not active
            if (link.material?.userData) {
                link.material.userData.reLockWaveActive = false;
            }
            return;
        }

        // Apply wave to link material
        if (!link.material?.userData) {
            link.material.userData = {};
        }

        link.material.userData.reLockWaveActive = true;
        link.material.userData.reLockWaveShift = Math.sin(waveEffect.phase) * waveEffect.amplitude;
        link.material.userData.reLockWaveDistance = waveEffect.travelDistance;
        link.material.userData.reLockWaveIntensity = waveEffect.intensity;

        // Update shader uniforms
        if (link.material?.uniforms) {
            link.material.uniforms.u_reLockWaveActive.value = true;
            link.material.uniforms.u_reLockWaveShift.value = link.material.userData.reLockWaveShift;
            link.material.uniforms.u_reLockWaveDistance.value = link.material.userData.reLockWaveDistance;
            link.material.uniforms.u_reLockWaveIntensity.value = link.material.userData.reLockWaveIntensity;
        }

        console.debug(`[Wave] Link ${link.id}: distance=${waveEffect.travelDistance.toFixed(3)}, intensity=${waveEffect.intensity.toFixed(3)}`);
    }
}

// ============================================================================
// 3. CONSOLE TESTING UTILITIES
// ============================================================================

/**
 * Test recovery state transitions
 */
export const RecoveryTestUtils = {
    /**
     * Simulate a recovery cycle: overload → recovery → complete
     */
    simulateRecoveryCycle(node, duration = 5.0) {
        console.log(`🔄 Starting recovery cycle for node ${node.id} (${duration}s)`);

        let elapsed = 0;
        const interval = setInterval(() => {
            elapsed += 0.016; // 60 FPS

            // Simulate corruption recovery
            const phase = elapsed / duration;
            node.metrics.corruption = Math.max(0, 0.8 * (1 - phase));
            node.metrics.harmony = Math.min(1, 0.2 + 0.7 * phase);

            // Update
            updateHarmonicHub(node, 0.016);

            // Log state
            const recovery = node.harmonicRecovery;
            console.log(`  [${phase.toFixed(2)}] Phase: ${recovery.recoveryPhase}, Factor: ${(recovery.recoveryFactor * 100).toFixed(1)}%, Age: ${recovery.recoveryAge.toFixed(2)}s`);

            if (elapsed >= duration) {
                clearInterval(interval);
                console.log(`✅ Recovery cycle complete`);
                console.log(recovery.getDebugInfo());
            }
        }, 16);
    },

    /**
     * Test rapid corruption spikes (interruption handling)
     */
    testInterruption(node) {
        console.log(`⚡ Testing recovery interruption for node ${node.id}`);

        // Start recovery
        node.metrics.harmony = 0.7;
        node.metrics.corruption = 0.2;

        const testSteps = [
            { name: 'Starting recovery', harmony: 0.7, corruption: 0.2 },
            { name: 'Halfway through', harmony: 0.6, corruption: 0.3 },
            { name: 'Corruption spike!', harmony: 0.5, corruption: 0.6 },
            { name: 'Back to recovery', harmony: 0.75, corruption: 0.1 },
        ];

        testSteps.forEach((step, i) => {
            node.metrics.harmony = step.harmony;
            node.metrics.corruption = step.corruption;
            updateHarmonicHub(node, 0.016);

            const recovery = node.harmonicRecovery;
            console.log(`  ${step.name}: isInRecovery=${recovery.isInRecovery()}, phase=${recovery.recoveryPhase}`);
        });
    },

    /**
     * Verify all recovery getters work correctly
     */
    testAllGetters(node) {
        console.log(`🧪 Testing all recovery getters for node ${node.id}`);

        const recovery = node.harmonicRecovery;

        // Simulate recovery state
        recovery.recoveryFactor = 0.5;
        recovery.recoveryPhase = 'realigning';
        recovery.recoveryAge = 2.0;

        // Test all getters
        const tests = [
            {
                name: 'getRecoveredPhaseVariance',
                fn: () => recovery.getRecoveredPhaseVariance(0.3),
            },
            {
                name: 'getRecoveredSyncStrength',
                fn: () => recovery.getRecoveredSyncStrength(0.5),
            },
            {
                name: 'getHaloStabilization',
                fn: () => recovery.getHaloStabilization(1.5, 0.1),
            },
            {
                name: 'getBraidedStrandRecovery',
                fn: () => recovery.getBraidedStrandRecovery(0.2),
            },
            {
                name: 'getDirectionalStreakRecovery',
                fn: () => recovery.getDirectionalStreakRecovery(0.15, 1.2),
            },
            {
                name: 'getSurfaceRippleRecovery',
                fn: () => recovery.getSurfaceRippleRecovery(0.4),
            },
            {
                name: 'getReLockWaveEffect',
                fn: () => recovery.getReLockWaveEffect(0, 3),
            },
            {
                name: 'getDebugInfo',
                fn: () => recovery.getDebugInfo(),
            },
        ];

        tests.forEach(test => {
            try {
                const result = test.fn();
                console.log(`  ✅ ${test.name}: ${JSON.stringify(result).substring(0, 60)}...`);
            } catch (e) {
                console.error(`  ❌ ${test.name}: ${e.message}`);
            }
        });
    },
};

// ============================================================================
// 4. DEBUGGING HELPERS
// ============================================================================

/**
 * Live HUD display for recovery state
 */
export class RecoveryDebugHUD {
    constructor(hudElement) {
        this.hudElement = hudElement;
        this.selectedNode = null;
    }

    setSelectedNode(node) {
        this.selectedNode = node;
    }

    update() {
        if (!this.selectedNode?.harmonicRecovery) return;

        const recovery = this.selectedNode.harmonicRecovery;
        const collapse = this.selectedNode.harmonicCollapse;

        let html = `
        <div style="font-family: monospace; font-size: 12px; line-height: 1.4;">
            <h3 style="margin: 0 0 10px 0;">🔄 Harmonic Recovery</h3>
            <div style="background: #1a1a1a; padding: 10px; border-radius: 4px;">
                <div><strong>Recovery Factor:</strong> ${(recovery.recoveryFactor * 100).toFixed(1)}%</div>
                <div><strong>Phase:</strong> ${recovery.recoveryPhase}</div>
                <div><strong>Age:</strong> ${recovery.recoveryAge.toFixed(2)}s</div>
                <div><strong>In Recovery:</strong> ${recovery.isInRecovery() ? '✅ YES' : '❌ NO'}</div>
                <div><strong>Complete:</strong> ${recovery.isRecoveryComplete() ? '✅ YES' : '❌ NO'}</div>
                
                <div style="margin-top: 8px; border-top: 1px solid #333; padding-top: 8px;">
                    <strong>Effects:</strong>
                    <div>Variance: ${recovery.recoveredPhaseVariance.toFixed(4)}</div>
                    <div>Sync Strength: ${recovery.recoveredSyncStrength.toFixed(4)}</div>
                    <div>Wave Active: ${recovery.hasEmittedReLockWave && recovery.reLockWaveTime < recovery.config.reLockWaveDuration ? '✅' : '❌'}</div>
                </div>

                <div style="margin-top: 8px; border-top: 1px solid #333; padding-top: 8px;">
                    <strong>Collapse State:</strong>
                    <div>Collapse Factor: ${(collapse.collapseFactor * 100).toFixed(1)}%</div>
                    <div>Phase Variance: ${collapse.phaseVariance.toFixed(4)}</div>
                </div>
            </div>
        </div>
        `;

        this.hudElement.innerHTML = html;
    }
}

/**
 * Export recovery state to JSON for analysis
 */
export function exportRecoveryState(node) {
    const recovery = node.harmonicRecovery;
    const collapse = node.harmonicCollapse;

    return {
        node: {
            id: node.id,
            metrics: node.metrics,
        },
        recovery: recovery.getDebugInfo(),
        collapse: {
            collapseFactor: collapse.collapseFactor,
            phaseVariance: collapse.phaseVariance,
            isInOverload: collapse.isInOverload,
        },
        timestamp: Date.now(),
    };
}

/**
 * Compare recovery state at two time points
 */
export function compareRecoveryStates(state1, state2) {
    console.log(`📊 Recovery State Comparison`);
    console.log(`Time delta: ${((state2.timestamp - state1.timestamp) / 1000).toFixed(2)}s`);
    console.log(`
Recovery Factor: ${(state1.recovery.recoveryFactor * 100).toFixed(1)}% → ${(state2.recovery.recoveryFactor * 100).toFixed(1)}%
Phase: ${state1.recovery.recoveryPhase} → ${state2.recovery.recoveryPhase}
Age: ${state1.recovery.recoveryAge.toFixed(2)}s → ${state2.recovery.recoveryAge.toFixed(2)}s
    `);
}

// ============================================================================
// EXPORT SUMMARY
// ============================================================================

/**
 * Quick reference: All exported functions and classes
 */
export const RecoverySystemExports = {
    // Setup
    initializeRecoveryForHub,
    updateHarmonicHub,

    // Integrations
    BraidedStrandRecoveryIntegration,
    DirectionalStreaksRecoveryIntegration,
    PulseWaveSyncRecoveryIntegration,
    SurfaceRipplesRecoveryIntegration,
    HaloStabilizationRecoveryIntegration,
    ReLockWaveRecoveryIntegration,

    // Testing
    RecoveryTestUtils,

    // Debugging
    RecoveryDebugHUD,
    exportRecoveryState,
    compareRecoveryStates,
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * QUICK START: Copy this into your main.js
 * 
 * ```javascript
 * import * as RecoveryExamples from './HARMONIC_RECOVERY_EXAMPLES.js';
 * 
 * // In your hub initialization
 * RecoveryExamples.initializeRecoveryForHub(node);
 * 
 * // In your update loop
 * RecoveryExamples.updateHarmonicHub(node, deltaTime);
 * 
 * // In your rendering loop
 * const braidedIntegration = new RecoveryExamples.BraidedStrandRecoveryIntegration(renderer);
 * braidedIntegration.updateBraidedStrands(link, mesh, deltaTime);
 * 
 * // Testing
 * RecoveryExamples.RecoveryTestUtils.simulateRecoveryCycle(node, 5.0);
 * ```
 */

export default RecoverySystemExports;
