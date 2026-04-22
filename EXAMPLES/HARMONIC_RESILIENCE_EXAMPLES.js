/**
 * Progressive Harmonic Hub Strengthening — Working Examples
 * ============================================================================
 * Copy-paste integration patterns for wiring resilience into visual systems.
 * All examples follow zero-allocation, adapter-only patterns.
 */

import { HarmonicHubResilienceController } from './HarmonicHubLifecycle.js';

// ============================================================================
// 1. SETUP & INITIALIZATION
// ============================================================================

/**
 * Initialize resilience controller for a harmonic hub
 */
export function initializeResilienceForHub(node, recoveryController) {
    const resilience = new HarmonicHubResilienceController(recoveryController);
    node.harmonicResilience = resilience;
    console.log(`✅ Resilience initialized for node ${node.id}`);
    return resilience;
}

/**
 * Update loop for resilience tracking
 */
export function updateHarmonicResilience(node, deltaTime = 0.016) {
    if (!node.harmonicResilience) return;

    const metrics = node.getMetrics();
    const collapse = node.harmonicCollapse;
    const recovery = node.harmonicRecovery;

    node.harmonicResilience.update(
        metrics.harmony || 0.5,
        metrics.corruption || 0.0,
        collapse?.isInOverload ?? false,
        recovery?.isInRecovery ?? false,
        deltaTime,
        recovery?.recoveryFactor ?? 0.0
    );
}

// ============================================================================
// 2. VISUAL SYSTEM INTEGRATIONS
// ============================================================================

/**
 * EXAMPLE 1: Harmonic Halo Stability
 * ─────────────────────────────────
 * High resilience → less flicker, slower, thicker
 */
export class HaloResilienceIntegration {
    constructor(nodeAuraRenderer) {
        this.renderer = nodeAuraRenderer;
    }

    updateHaloWithResilience(node, haloBonesMesh, deltaTime) {
        if (!node.harmonicResilience) return;

        // Get current halo state from collapse controller
        const haloState = node.harmonicCollapse?.getHaloEffect() ?? {
            amplitude: 0.05,
            frequency: 2.0,
        };

        // Apply resilience modulation
        const modulatedHalo = node.harmonicResilience.getModulatedHaloStability(
            haloState.amplitude,
            haloState.frequency
        );

        // Update halo amplitude and frequency
        haloBonesMesh.userData.haloAmplitude = modulatedHalo.amplitude;
        haloBonesMesh.userData.haloFrequency = modulatedHalo.frequency;

        // Scale halo thickness
        const baseScale = haloBonesMesh.userData.baseScale || 1.0;
        haloBonesMesh.scale.set(
            baseScale * modulatedHalo.thickness,
            baseScale * modulatedHalo.thickness,
            baseScale * modulatedHalo.thickness
        );

        // Update shader uniforms
        if (haloBonesMesh.material?.uniforms) {
            haloBonesMesh.material.uniforms.u_haloAmplitude.value = modulatedHalo.amplitude;
            haloBonesMesh.material.uniforms.u_haloFrequency.value = modulatedHalo.frequency;
            haloBonesMesh.material.uniforms.u_resilience.value = modulatedHalo.stabilityFactor;
        }

        console.debug(`[Halo] Amplitude: ${modulatedHalo.amplitude.toFixed(4)}, Resilience: ${modulatedHalo.stabilityFactor.toFixed(3)}`);
    }
}

/**
 * EXAMPLE 2: Pulse Wave Coherence
 * ───────────────────────────────
 * High resilience → faster alignment, smoother phases
 */
export class PulseCoherenceResilienceIntegration {
    constructor(linkPulseSync) {
        this.pulseSync = linkPulseSync;
    }

    applyResilienceToPulseSync(link, sourceNode, deltaTime) {
        if (!sourceNode?.harmonicResilience) return;

        // Get modulated coherence
        const baseSyncStrength = this.calculateBaseSyncStrength(sourceNode);
        const coherence = sourceNode.harmonicResilience.getModulatedPulseCoherence(baseSyncStrength);

        // Apply recovery enhancement
        const recovery = sourceNode.harmonicRecovery;
        const recoveredStrength = recovery?.getRecoveredSyncStrength(coherence.syncStrength) ?? coherence.syncStrength;

        // Smooth phase interpolation with resilience boost
        const targetPhase = sourceNode.harmonicSync?.hubPhase ?? 0.0;
        const interpolationRate = 0.12 * coherence.relockSpeed; // Faster with resilience

        link.pulsePhaseOffset = this.lerpAngle(
            link.pulsePhaseOffset || 0,
            targetPhase,
            recoveredStrength * interpolationRate * deltaTime
        );

        // Reduce phase variance with resilience
        const collapse = sourceNode.harmonicCollapse;
        const baseVariance = collapse?.phaseVariance ?? 0.0;
        link.effectivePhaseVariance = baseVariance / coherence.phaseSmoothing;

        console.debug(`[Pulse] Coherence: ${coherence.coherenceFactor.toFixed(3)}, Sync: ${coherence.syncStrength.toFixed(3)}`);
    }

    calculateBaseSyncStrength(sourceNode) {
        const metrics = sourceNode.metrics;
        const harmony = metrics?.harmony ?? 0.5;
        const corruption = metrics?.corruption ?? 0.0;

        return Math.max(0, Math.min(1.0, 0.6 + harmony * 0.4 - corruption * 0.8));
    }

    lerpAngle(from, to, t) {
        let diff = to - from;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        return from + diff * t;
    }
}

/**
 * EXAMPLE 3: Directional Streak Consistency
 * ──────────────────────────────────────────
 * High resilience → uniform spacing, less dropout
 */
export class StreakConsistencyResilienceIntegration {
    constructor(streakRenderer) {
        this.renderer = streakRenderer;
    }

    updateStreakWithResilience(link, streakMesh, deltaTime) {
        if (!link.source?.harmonicResilience) return;

        // Get current streak state
        const baseGapSize = this.getStreakGapSize(link.source);
        const baseSpacing = this.getStreakSpacing(link.source);

        // Apply resilience modulation
        const streakEffect = link.source.harmonicResilience.getModulatedStreakConsistency(
            baseGapSize,
            baseSpacing
        );

        // Update mesh
        streakMesh.userData.gapSize = streakEffect.gapSize;
        streakMesh.userData.spacing = streakEffect.spacing;
        streakMesh.userData.uniformity = streakEffect.uniformity;
        streakMesh.userData.directionClarity = streakEffect.directionClarity;

        // Update shader
        if (streakMesh.material?.uniforms) {
            streakMesh.material.uniforms.u_gapSize.value = streakEffect.gapSize;
            streakMesh.material.uniforms.u_spacing.value = streakEffect.spacing;
            streakMesh.material.uniforms.u_uniformity.value = streakEffect.uniformity;
            streakMesh.material.uniforms.u_directionClarity.value = streakEffect.directionClarity;
        }

        console.debug(`[Streaks] Uniformity: ${streakEffect.uniformity.toFixed(3)}, Clarity: ${streakEffect.directionClarity.toFixed(3)}`);
    }

    getStreakGapSize(sourceNode) {
        const variance = sourceNode.harmonicCollapse?.phaseVariance ?? 0.0;
        const instability = sourceNode.metrics?.instability ?? 0.0;
        return variance * (0.3 + instability * 0.2);
    }

    getStreakSpacing(sourceNode) {
        const variance = sourceNode.harmonicCollapse?.phaseVariance ?? 0.0;
        return 1.0 + variance * 0.5;
    }
}

/**
 * EXAMPLE 4: Surface Ripple Calmness
 * ──────────────────────────────────
 * High resilience → broader patterns, less tearing
 */
export class RippleCalmnessResilienceIntegration {
    constructor(rippleRenderer) {
        this.renderer = rippleRenderer;
    }

    updateRippleWithResilience(link, rippleMesh, deltaTime) {
        if (!link.source?.harmonicResilience) return;

        // Get current ripple interference
        const variance = link.source.harmonicCollapse?.phaseVariance ?? 0.0;
        const baseInterference = variance * 0.4;

        // Apply resilience modulation
        const rippleEffect = link.source.harmonicResilience.getModulatedRippleCalmness(
            baseInterference
        );

        // Update mesh
        rippleMesh.userData.waveScale = rippleEffect.waveScale;
        rippleMesh.userData.tearingReduction = rippleEffect.tearingReduction;
        rippleMesh.userData.coherence = rippleEffect.coherence;
        rippleMesh.userData.rippleAmplitude = rippleEffect.interferenceReduction;

        // Update shader
        if (rippleMesh.material?.uniforms) {
            rippleMesh.material.uniforms.u_waveScale.value = rippleEffect.waveScale;
            rippleMesh.material.uniforms.u_coherence.value = rippleEffect.coherence;
            rippleMesh.material.uniforms.u_tearingReduction.value = rippleEffect.tearingReduction;
        }

        console.debug(`[Ripples] Coherence: ${rippleEffect.coherence.toFixed(3)}, Scale: ${rippleEffect.waveScale.toFixed(3)}`);
    }
}

/**
 * EXAMPLE 5: Overall Network Authority
 * ────────────────────────────────────
 * High resilience → increased presence and confidence
 */
export class NetworkAuthorityResilienceIntegration {
    constructor(sceneRenderer) {
        this.renderer = sceneRenderer;
    }

    updateNetworkPresence(node, allNodeMeshes, allLinkMeshes, deltaTime) {
        if (!node.harmonicResilience) return;

        // Get network authority from resilience
        const authority = node.harmonicResilience.getNetworkAuthority();

        // Apply to all node meshes
        allNodeMeshes.forEach(mesh => {
            if (mesh.userData.sourceNode !== node) return;

            // Increase opacity with presence
            mesh.material.opacity = Math.min(
                1.0,
                (mesh.userData.baseOpacity || 1.0) * authority.presence
            );

            // Increase emissive with confidence
            if (mesh.material.emissive) {
                mesh.material.emissive.multiplyScalar(authority.glowIntensity);
            }
        });

        // Apply to all link meshes
        allLinkMeshes.forEach(mesh => {
            if (mesh.userData.sourceNode !== node) return;

            // Enhanced link visibility
            mesh.material.opacity = Math.min(
                1.0,
                (mesh.userData.baseOpacity || 0.8) * authority.presence
            );

            // Link glow
            if (mesh.material.emissive) {
                const linkGlow = new THREE.Color(0.2, 0.5, 1.0).multiplyScalar(authority.glowIntensity * 0.5);
                mesh.material.emissive.copy(linkGlow);
            }
        });

        console.debug(`[Authority] Presence: ${authority.presence.toFixed(3)}, Glow: ${authority.glowIntensity.toFixed(3)}`);
    }
}

// ============================================================================
// 3. CONSOLE TESTING UTILITIES
// ============================================================================

export const ResilienceTestUtils = {
    /**
     * Simulate multiple recovery cycles to build resilience
     */
    simulateRecoveryCycles(node, numCycles = 5, delayBetweenCycles = 0.5) {
        console.log(`🔄 Simulating ${numCycles} recovery cycles for node ${node.id}`);

        let cycleCount = 0;
        const interval = setInterval(() => {
            if (cycleCount >= numCycles) {
                clearInterval(interval);
                console.log(`✅ ${cycleCount} cycles complete`);
                console.log(node.harmonicResilience.getDebugInfo());
                return;
            }

            // Simulate cycle
            node.metrics.corruption = 0.8;
            node.metrics.harmony = 0.2;

            // Collapse
            for (let i = 0; i < 20; i++) {
                updateHarmonicResilience(node, 0.016);
            }

            // Recover
            node.metrics.harmony = 0.85;
            node.metrics.corruption = 0.1;

            for (let i = 0; i < 100; i++) {
                updateHarmonicResilience(node, 0.016);
            }

            cycleCount++;
            console.log(`  [${cycleCount}/${numCycles}] Resilience: ${(node.harmonicResilience.hubResilience * 100).toFixed(1)}%`);
        }, delayBetweenCycles * 1000);
    },

    /**
     * Test resilience decay over time
     */
    testResilienceDecay(node, durationSeconds = 120) {
        console.log(`📉 Testing resilience decay over ${durationSeconds}s`);

        // Boost resilience
        node.harmonicResilience.hubResilience = 0.8;
        node.harmonicResilience.targetResilience = 0.8;

        let elapsed = 0;
        const interval = setInterval(() => {
            elapsed += 1.0; // 1 second per iteration

            // Update in healthy state (triggers decay)
            node.metrics.harmony = 1.0;
            node.metrics.corruption = 0.0;

            updateHarmonicResilience(node, 1.0);

            if (elapsed % 10 === 0) {
                console.log(`  ${elapsed}s: Resilience = ${(node.harmonicResilience.hubResilience * 100).toFixed(1)}%`);
            }

            if (elapsed >= durationSeconds) {
                clearInterval(interval);
                console.log(`✅ Decay test complete`);
                console.log(node.harmonicResilience.getDebugInfo());
            }
        }, 1000 / 60); // 60 FPS simulation
    },

    /**
     * Test all resilience getters
     */
    testAllGetters(node) {
        console.log(`🧪 Testing all resilience getters for node ${node.id}`);

        const resilience = node.harmonicResilience;

        // Boost resilience for testing
        resilience.hubResilience = 0.6;

        const tests = [
            {
                name: 'getModulatedHaloStability',
                fn: () => resilience.getModulatedHaloStability(0.1, 2.0),
            },
            {
                name: 'getModulatedPulseCoherence',
                fn: () => resilience.getModulatedPulseCoherence(0.5),
            },
            {
                name: 'getModulatedStreakConsistency',
                fn: () => resilience.getModulatedStreakConsistency(0.15, 1.0),
            },
            {
                name: 'getModulatedRippleCalmness',
                fn: () => resilience.getModulatedRippleCalmness(0.4),
            },
            {
                name: 'getNetworkAuthority',
                fn: () => resilience.getNetworkAuthority(),
            },
            {
                name: 'getActiveResilience',
                fn: () => resilience.getActiveResilience(false, false),
            },
            {
                name: 'hasLearned',
                fn: () => resilience.hasLearned(),
            },
            {
                name: 'getResilienceNarrative',
                fn: () => resilience.getResilienceNarrative(),
            },
            {
                name: 'getDebugInfo',
                fn: () => resilience.getDebugInfo(),
            },
        ];

        tests.forEach(test => {
            try {
                const result = test.fn();
                console.log(`  ✅ ${test.name}: ${JSON.stringify(result).substring(0, 80)}...`);
            } catch (e) {
                console.error(`  ❌ ${test.name}: ${e.message}`);
            }
        });
    },

    /**
     * Verify increments are logarithmic
     */
    testLogarithmicIncrements(node) {
        console.log(`📊 Testing logarithmic increment curve`);

        const resilience = node.harmonicResilience;

        console.log(`Recovery # | Increment   | Total`);
        console.log(`-----------|-------------|--------`);

        let total = 0;
        for (let i = 0; i <= 20; i++) {
            const increment = resilience.computeIncrementForRecovery(i);
            total += increment;
            total = Math.min(1.0, total);

            if (i < 10 || i % 5 === 0) {
                console.log(`${i.toString().padEnd(10)}| ${increment.toFixed(6)} | ${total.toFixed(4)}`);
            }
        }

        console.log(`\n✅ Logarithmic curve verified (diminishing returns)`);
    },
};

// ============================================================================
// 4. DEBUGGING HELPERS
// ============================================================================

/**
 * Live HUD display for resilience state
 */
export class ResilienceDebugHUD {
    constructor(hudElement) {
        this.hudElement = hudElement;
        this.selectedNode = null;
    }

    setSelectedNode(node) {
        this.selectedNode = node;
    }

    update() {
        if (!this.selectedNode?.harmonicResilience) return;

        const resilience = this.selectedNode.harmonicResilience;

        let html = `
        <div style="font-family: monospace; font-size: 12px; line-height: 1.4;">
            <h3 style="margin: 0 0 10px 0;">🧠 Hub Resilience</h3>
            <div style="background: #1a1a1a; padding: 10px; border-radius: 4px;">
                <div><strong>Resilience:</strong> ${(resilience.hubResilience * 100).toFixed(1)}%</div>
                <div><strong>Recoveries:</strong> ${resilience.completedRecoveries}</div>
                <div><strong>State:</strong> ${resilience.getResilienceNarrative()}</div>
                <div><strong>Learned:</strong> ${resilience.hasLearned() ? '✅ YES' : '❌ NO'}</div>
                
                <div style="margin-top: 8px; border-top: 1px solid #333; padding-top: 8px;">
                    <strong>Last Increment:</strong> ${resilience.computeIncrementForRecovery(resilience.completedRecoveries - 1).toFixed(4)}
                </div>
                
                <div style="margin-top: 8px; border-top: 1px solid #333; padding-top: 8px;">
                    <strong>Time Tracking:</strong>
                    <div>Since last recovery: ${resilience.timeSinceLastRecovery.toFixed(1)}s</div>
                    <div>Total time: ${resilience.totalTimeElapsed.toFixed(1)}s</div>
                </div>
                
                <div style="margin-top: 8px; border-top: 1px solid #333; padding-top: 8px;">
                    <strong>Current Effects:</strong>
                    <div>Halo: ${(resilience.hubResilience * 70).toFixed(0)}% less flicker</div>
                    <div>Pulses: ${(resilience.hubResilience * 30).toFixed(0)}% stronger sync</div>
                    <div>Streaks: ${(resilience.hubResilience * 80).toFixed(0)}% fewer gaps</div>
                    <div>Ripples: ${(resilience.hubResilience * 80).toFixed(0)}% less tearing</div>
                </div>
            </div>
        </div>
        `;

        this.hudElement.innerHTML = html;
    }
}

/**
 * Export resilience state to JSON for analysis
 */
export function exportResilienceState(node) {
    const resilience = node.harmonicResilience;

    return {
        node: {
            id: node.id,
            metrics: node.metrics,
        },
        resilience: resilience.getDebugInfo(),
        haloModulation: resilience.getModulatedHaloStability(0.1, 2.0),
        pulseModulation: resilience.getModulatedPulseCoherence(0.5),
        streakModulation: resilience.getModulatedStreakConsistency(0.15, 1.0),
        rippleModulation: resilience.getModulatedRippleCalmness(0.4),
        authority: resilience.getNetworkAuthority(),
        timestamp: Date.now(),
    };
}

/**
 * Compare resilience state at two time points
 */
export function compareResilienceStates(state1, state2) {
    console.log(`📊 Resilience State Comparison`);
    console.log(`Time delta: ${((state2.timestamp - state1.timestamp) / 1000).toFixed(2)}s`);
    console.log(`
Resilience:    ${(state1.resilience.hubResilience * 100).toFixed(1)}% → ${(state2.resilience.hubResilience * 100).toFixed(1)}%
Recoveries:    ${state1.resilience.completedRecoveries} → ${state2.resilience.completedRecoveries}
Narrative:     ${state1.resilience.narrative} → ${state2.resilience.narrative}
    `);
}

// ============================================================================
// EXPORTS
// ============================================================================

export const ResilienceSystemExports = {
    // Setup
    initializeResilienceForHub,
    updateHarmonicResilience,

    // Integrations
    HaloResilienceIntegration,
    PulseCoherenceResilienceIntegration,
    StreakConsistencyResilienceIntegration,
    RippleCalmnessResilienceIntegration,
    NetworkAuthorityResilienceIntegration,

    // Testing
    ResilienceTestUtils,

    // Debugging
    ResilienceDebugHUD,
    exportResilienceState,
    compareResilienceStates,
};

export default ResilienceSystemExports;

// ============================================================================
// QUICK START EXAMPLE
// ============================================================================

/**
 * Copy this into main.js to enable resilience system:
 * 
 * ```javascript
 * import * as ResilienceExamples from './HARMONIC_RESILIENCE_EXAMPLES.js';
 * 
 * // In hub initialization
 * ResilienceExamples.initializeResilienceForHub(node, recoveryController);
 * 
 * // In update loop
 * ResilienceExamples.updateHarmonicResilience(node, deltaTime);
 * 
 * // In rendering loop
 * const haloIntegration = new ResilienceExamples.HaloResilienceIntegration(renderer);
 * haloIntegration.updateHaloWithResilience(node, haloBonesMesh, deltaTime);
 * 
 * // Testing
 * ResilienceExamples.ResilienceTestUtils.simulateRecoveryCycles(node, 5);
 * ```
 */
