/**
 * ============================================================================
 * CRITICAL NODE FAILURE SYSTEM
 * ============================================================================
 * 
 * Detects nodes approaching critical failure and severs their connections
 * after a visible countdown period.
 * 
 * CORE PHILOSOPHY:
 * - Some nodes do not survive rupture
 * - Failure is deliberate and visible, not sudden
 * - Links sever cleanly (no explosions)
 * - Network remembers where it broke
 * 
 * FAILURE CONDITIONS:
 * - Node stability <= critical threshold
 * - Node corruption >= critical threshold
 * - Node is NOT currently healing
 * - Node has active links
 * 
 * COUNTDOWN BEHAVIOR:
 * - 3-second warning period with visible stress indicators
 * - Links show extreme strain
 * - After countdown: ALL links sever simultaneously
 * - Clean snap visual (no particle spam)
 * 
 * POST-FAILURE STATE:
 * - Node enters ISOLATED state
 * - Collapsed aura, dimmed core
 * - Slow recovery attempt (optional)
 * - No automatic reconnection
 * 
 * INTEGRATION:
 * - Can be triggered by CascadingRuptureSystem
 * - Can detect failure independently
 * - Centralized link severing logic
 * - Explicit enable flag for safety
 * 
 * ============================================================================
 */

import * as THREE from 'three';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // Failure detection thresholds
    STABILITY_CRITICAL: 0.2, // Node stability must be <= 20%
    CORRUPTION_CRITICAL: 0.75, // Node corruption must be >= 75%
    
    // Countdown timing
    FAILURE_COUNTDOWN_DURATION: 3.0, // 3 second warning
    
    // Detection interval
    DETECTION_INTERVAL: 0.25, // Check every 250ms
    
    // Visual stress indicators
    STRESS_PULSE_FREQUENCY: 4.0, // Hz
    STRESS_INTENSITY_MAX: 2.0, // Multiplier for visual stress
    
    // Link strain visuals
    LINK_STRAIN_INTENSITY: 0.8, // How much links visually strain
    LINK_STRAIN_OSCILLATION: 6.0, // Hz
    
    // Sever visuals
    SNAP_DURATION: 0.3, // Duration of snap visual
    RECOIL_DISTANCE: 2.0, // How far endpoints recoil
    RECOIL_DURATION: 0.5, // Duration of recoil
    SCAR_DURATION: 5.0, // How long sever scar persists
    SCAR_FADE_DURATION: 2.0, // Fade duration
    
    // Post-failure state
    ISOLATED_AURA_SCALE: 0.3, // Collapsed aura scale
    ISOLATED_CORE_BRIGHTNESS: 0.4, // Dimmed core brightness
    RECOVERY_ATTEMPT_DELAY: 10.0, // Delay before recovery attempt
    RECOVERY_ATTEMPT_RATE: 0.02, // Stability recovery per second
    
    // Performance
    MAX_SIMULTANEOUS_FAILURES: 4, // Max nodes in countdown at once
    SEVER_VISUAL_POOL_SIZE: 16 // Pre-allocated sever visuals
};

// ============================================================================
// NODE FAILURE STATE
// ============================================================================

class NodeFailureState {
    constructor() {
        this.node = null;
        this.active = false;
        this.countdownTime = 0.0;
        this.failureTriggered = false;
        this.linksToSever = [];
        this.stressVisualPhase = 0.0;
    }

    reset() {
        this.node = null;
        this.active = false;
        this.countdownTime = 0.0;
        this.failureTriggered = false;
        this.linksToSever.length = 0;
        this.stressVisualPhase = 0.0;
    }

    startCountdown(node, links) {
        this.node = node;
        this.active = true;
        this.countdownTime = CONFIG.FAILURE_COUNTDOWN_DURATION;
        this.failureTriggered = false;
        this.linksToSever = links.slice();
        this.stressVisualPhase = 0.0;

        // Mark node as in countdown
        if (node.userData) {
            node.userData.failureCountdown = true;
            node.userData.countdownRemaining = this.countdownTime;
        }
    }
}

// ============================================================================
// SEVER VISUAL EFFECT
// ============================================================================

class SeverVisualEffect {
    constructor() {
        this.active = false;
        this.startPos = new THREE.Vector3();
        this.endPos = new THREE.Vector3();
        this.centerPos = new THREE.Vector3();
        this.progress = 0.0;
        this.phase = 'snap'; // 'snap', 'recoil', 'scar'
        this.intensity = 1.0;
    }

    reset() {
        this.active = false;
        this.startPos.set(0, 0, 0);
        this.endPos.set(0, 0, 0);
        this.centerPos.set(0, 0, 0);
        this.progress = 0.0;
        this.phase = 'snap';
        this.intensity = 1.0;
    }

    start(startPos, endPos) {
        this.active = true;
        this.startPos.copy(startPos);
        this.endPos.copy(endPos);
        this.centerPos.lerpVectors(startPos, endPos, 0.5);
        this.progress = 0.0;
        this.phase = 'snap';
        this.intensity = 1.0;
    }

    update(deltaTime) {
        if (!this.active) return;
        if (!this.frameScheduler?.shouldRunVisual?.()) return;
        switch (this.phase) {
            case 'snap':
                this.progress += deltaTime / CONFIG.SNAP_DURATION;
                if (this.progress >= 1.0) {
                    this.phase = 'recoil';
                    this.progress = 0.0;
                }
                break;

            case 'recoil':
                this.progress += deltaTime / CONFIG.RECOIL_DURATION;
                if (this.progress >= 1.0) {
                    this.phase = 'scar';
                    this.progress = 0.0;
                }
                break;

            case 'scar':
                this.progress += deltaTime / CONFIG.SCAR_DURATION;
                if (this.progress >= 1.0) {
                    this.reset();
                }
                break;
        }
    }

    getVisualData() {
        if (!this.active) return null;

        const t = this.progress;
        let visualData = {
            startPos: this.startPos.clone(),
            endPos: this.endPos.clone(),
            centerPos: this.centerPos.clone(),
            intensity: this.intensity,
            phase: this.phase
        };

        switch (this.phase) {
            case 'snap':
                // Sharp break visual
                visualData.breakAmount = t;
                visualData.intensity = 1.0;
                break;

            case 'recoil':
                // Endpoints recoil away
                const recoilT = 1.0 - Math.pow(1.0 - t, 2); // Ease out
                const direction = new THREE.Vector3().subVectors(this.endPos, this.startPos).normalize();
                visualData.startPos.addScaledVector(direction, -CONFIG.RECOIL_DISTANCE * recoilT);
                visualData.endPos.addScaledVector(direction, CONFIG.RECOIL_DISTANCE * recoilT);
                visualData.intensity = 1.0 - t * 0.5;
                break;

            case 'scar':
                // Lingering scar fades
                const fadeStart = 1.0 - (CONFIG.SCAR_FADE_DURATION / CONFIG.SCAR_DURATION);
                if (t > fadeStart) {
                    const fadeT = (t - fadeStart) / (1.0 - fadeStart);
                    visualData.intensity = 1.0 - fadeT;
                } else {
                    visualData.intensity = 0.3; // Dim scar
                }
                break;
        }

        return visualData;
    }
}

// ============================================================================
// MAIN CRITICAL NODE FAILURE SYSTEM
// ============================================================================

export class CriticalNodeFailureSystem {
    constructor(scene, aiNodes, linkingSystem) {
        this.scene = scene;
        this.aiNodes = aiNodes;
        this.linkingSystem = linkingSystem;

        // Enable flag (default: true - activated per NETWORK_STABILITY_SYSTEMS_AUDIT)
        this.enabled = true;

        // Detection state
        this.detectionTimer = 0.0;

        // Active failure states
        this.activeFailures = [];
        for (let i = 0; i < CONFIG.MAX_SIMULTANEOUS_FAILURES; i++) {
            this.activeFailures.push(new NodeFailureState());
        }

        // Sever visual effect pool
        this.severVisuals = [];
        for (let i = 0; i < CONFIG.SEVER_VISUAL_POOL_SIZE; i++) {
            this.severVisuals.push(new SeverVisualEffect());
        }

        // Severed links registry (for scar persistence)
        this.severedLinks = new Map(); // linkId -> sever timestamp

        // Isolated nodes registry
        this.isolatedNodes = new Set(); // node UUIDs

        // Event listeners
        this.onFailureCountdownStart = null; // (node, countdown) => void
        this.onLinksSevered = null; // (node, linkIds[]) => void
        this.onNodeIsolated = null; // (node) => void

        console.log('[CriticalNodeFailureSystem] Initialized (disabled by default)');
    }

    // ========================================================================
    // ENABLE / DISABLE
    // ========================================================================

    enable() {
        this.enabled = true;
        console.log('[CriticalNodeFailureSystem] ENABLED - Link severing active');
    }

    disable() {
        this.enabled = false;
        // Clean up active failures
        this.activeFailures.forEach(f => f.reset());
        this.severVisuals.forEach(v => v.reset());
        console.log('[CriticalNodeFailureSystem] DISABLED');
    }

    // ========================================================================
    // UPDATE
    // ========================================================================

    update(deltaTime, time) {
        if (!this.enabled) return;

        // Periodic detection
        this.detectionTimer += deltaTime;
        if (this.detectionTimer >= CONFIG.DETECTION_INTERVAL) {
            this.detectionTimer = 0.0;
            this.detectCriticalNodes(time);
        }

        // Update active failure countdowns
        this.updateFailureCountdowns(deltaTime, time);

        // Update sever visuals
        this.updateSeverVisuals(deltaTime);

        // Update isolated node recovery attempts
        this.updateIsolatedNodeRecovery(deltaTime, time);
    }

    // ========================================================================
    // CRITICAL NODE DETECTION
    // ========================================================================

    detectCriticalNodes(time) {
        if (!this.aiNodes) return;

        const nodes = this.aiNodes.nodes || [];

        nodes.forEach(node => {
            // Skip if already in failure countdown
            if (node.userData?.failureCountdown) return;

            // Skip if already isolated
            if (this.isolatedNodes.has(node.uuid)) return;

            // Check failure conditions
            if (this.isNodeCritical(node)) {
                this.initiateFailureCountdown(node, time);
            }
        });
    }

    isNodeCritical(node) {
        if (!node || !node.userData) return false;

        // Check thresholds
        const stability = node.userData?.metrics?.stability ?? 1.0;
        const corruption = node.userData.corruption ?? 0.0;

        if (stability > CONFIG.STABILITY_CRITICAL) return false;
        if (corruption < CONFIG.CORRUPTION_CRITICAL) return false;

        // Must NOT be currently healing
        const isHealing = node.userData.isHealing || false;
        if (isHealing) return false;

        // Must have active links
        const links = this.linkingSystem.getNodeLinks(node);
        if (!links || links.length === 0) return false;

        return true;
    }

    // ========================================================================
    // FAILURE COUNTDOWN
    // ========================================================================

    initiateFailureCountdown(node, time) {
        // Find available failure slot
        const failureState = this.activeFailures.find(f => !f.active);
        if (!failureState) {
            console.warn('[CriticalNodeFailureSystem] Max simultaneous failures reached');
            return;
        }

        // Get node links
        const links = this.linkingSystem.getNodeLinks(node);
        if (!links || links.length === 0) return;

        // Start countdown
        failureState.startCountdown(node, links);

        console.log(`[CriticalNodeFailureSystem] Node ${node.uuid.slice(0, 8)} entering failure countdown (${links.length} links)`);

        // Fire event
        if (this.onFailureCountdownStart) {
            this.onFailureCountdownStart(node, CONFIG.FAILURE_COUNTDOWN_DURATION);
        }
    }

    updateFailureCountdowns(deltaTime, time) {
        this.activeFailures.forEach(failureState => {
            if (!failureState.active) return;

            // Update countdown
            failureState.countdownTime -= deltaTime;
            failureState.stressVisualPhase += deltaTime * CONFIG.STRESS_PULSE_FREQUENCY * Math.PI * 2;

            // Update node userData
            if (failureState.node.userData) {
                failureState.node.userData.countdownRemaining = failureState.countdownTime;

                // Stress visual intensity
                const stressPhase = Math.sin(failureState.stressVisualPhase);
                const stressIntensity = (1.0 + stressPhase) * 0.5 * CONFIG.STRESS_INTENSITY_MAX;
                failureState.node.userData.stressVisualIntensity = stressIntensity;
            }

            // Apply link strain visuals
            this.applyLinkStrain(failureState, failureState.stressVisualPhase);

            // Check if countdown complete
            if (failureState.countdownTime <= 0.0 && !failureState.failureTriggered) {
                this.triggerNodeFailure(failureState, time);
            }
        });
    }

    applyLinkStrain(failureState, phase) {
        const strainPhase = Math.sin(phase * CONFIG.LINK_STRAIN_OSCILLATION);
        const strainIntensity = (1.0 + strainPhase) * 0.5 * CONFIG.LINK_STRAIN_INTENSITY;

        failureState.linksToSever.forEach(link => {
            if (!link.userData) return;
            link.userData.visualStrain = strainIntensity;
        });
    }

    // ========================================================================
    // NODE FAILURE & LINK SEVERING
    // ========================================================================

    triggerNodeFailure(failureState, time) {
        failureState.failureTriggered = true;
        const node = failureState.node;

        console.log(`[CriticalNodeFailureSystem] Node ${node.uuid.slice(0, 8)} FAILURE - severing ${failureState.linksToSever.length} links`);

        // Sever all links simultaneously
        const severedLinkIds = [];
        failureState.linksToSever.forEach(link => {
            if (this.severLink(link, time)) {
                severedLinkIds.push(link.uuid);
            }
        });

        // Mark node as isolated
        this.isolateNode(node, time);

        // Fire events
        if (this.onLinksSevered) {
            this.onLinksSevered(node, severedLinkIds);
        }

        // Clean up failure state
        failureState.reset();
    }

    severLink(link, time) {
        if (!link || !link.userData) return false;

        const nodeA = link.userData.nodeA;
        const nodeB = link.userData.nodeB;

        if (!nodeA || !nodeB) return false;

        // Trigger sever visual
        this.triggerSeverVisual(nodeA.position, nodeB.position);

        // Record sever in registry
        this.severedLinks.set(link.uuid, time);

        // Mark link as severed (visual systems should respect this)
        link.userData.severed = true;
        link.userData.severTime = time;

        // Actually remove link from linking system
        this.linkingSystem.removeLink(link);

        return true;
    }

    isolateNode(node, time) {
        if (!node || !node.userData) return;

        // Mark as isolated
        this.isolatedNodes.add(node.uuid);
        node.userData.isolated = true;
        node.userData.isolationTime = time;

        // Apply post-failure visuals
        node.userData.auraScale = CONFIG.ISOLATED_AURA_SCALE;
        node.userData.coreBrightness = CONFIG.ISOLATED_CORE_BRIGHTNESS;

        // Clear countdown flag
        node.userData.failureCountdown = false;
        node.userData.countdownRemaining = 0;
        node.userData.stressVisualIntensity = 0;

        console.log(`[CriticalNodeFailureSystem] Node ${node.uuid.slice(0, 8)} isolated`);

        // Fire event
        if (this.onNodeIsolated) {
            this.onNodeIsolated(node);
        }
    }

    // ========================================================================
    // SEVER VISUALS
    // ========================================================================

    triggerSeverVisual(startPos, endPos) {
        const visual = this.severVisuals.find(v => !v.active);
        if (!visual) return;

        visual.start(startPos, endPos);
    }

    updateSeverVisuals(deltaTime) {
        this.severVisuals.forEach(visual => visual.update(deltaTime));
    }

    getSeverVisualData() {
        // Return array of active sever visual data for rendering
        return this.severVisuals
            .filter(v => v.active)
            .map(v => v.getVisualData())
            .filter(d => d !== null);
    }

    // ========================================================================
    // ISOLATED NODE RECOVERY
    // ========================================================================

    updateIsolatedNodeRecovery(deltaTime, time) {
        if (!this.aiNodes) return;

        const nodes = this.aiNodes.nodes || [];

        nodes.forEach(node => {
            if (!this.isolatedNodes.has(node.uuid)) return;
            if (!node.userData) return;

            const isolationTime = node.userData.isolationTime || 0;
            const timeSinceIsolation = time - isolationTime;

            // Wait before attempting recovery
            if (timeSinceIsolation < CONFIG.RECOVERY_ATTEMPT_DELAY) return;

            // Slow stability recovery
            const currentStability = node.userData.metrics?.stability || 0;
            const targetStability = Math.min(
                currentStability + CONFIG.RECOVERY_ATTEMPT_RATE * deltaTime,
                0.5 // Cap at 50% (never fully recovers without healing)
            );
            const delta = targetStability - currentStability;
            if (delta !== 0) applyMetricImpulse(node, { stability: delta });

            // Gradually brighten core
            const targetBrightness = 0.7;
            const currentBrightness = node.userData.coreBrightness || CONFIG.ISOLATED_CORE_BRIGHTNESS;
            node.userData.coreBrightness = THREE.MathUtils.lerp(
                currentBrightness,
                targetBrightness,
                deltaTime * 0.1
            );
        });
    }

    // ========================================================================
    // MANUAL TRIGGERS (for cascade system integration)
    // ========================================================================

    markNodeApproachingCritical(node) {
        if (!this.enabled) return;
        if (!node || !node.userData) return;

        // If not already in countdown, check if should start
        if (!node.userData.failureCountdown) {
            if (this.isNodeCritical(node)) {
                this.initiateFailureCountdown(node, performance.now() / 1000);
            }
        }
    }

    // ========================================================================
    // QUERY METHODS
    // ========================================================================

    isNodeIsolated(node) {
        return this.isolatedNodes.has(node.uuid);
    }

    isLinkSevered(link) {
        return this.severedLinks.has(link.uuid);
    }

    getActiveFailureNodes() {
        return this.activeFailures
            .filter(f => f.active)
            .map(f => f.node);
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    dispose() {
        this.activeFailures.forEach(f => f.reset());
        this.severVisuals.forEach(v => v.reset());
        this.severedLinks.clear();
        this.isolatedNodes.clear();
        console.log('[CriticalNodeFailureSystem] Disposed');
    }
}
import { applyMetricImpulse } from './src/metrics/NodeMetricEngine.js';
