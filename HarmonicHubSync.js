/**
 * HarmonicHubSync.js
 * ============================================================================
 * MERGED FILE — Node-level harmonic sync, effect applier, and scene manager.
 *
 * Original files merged (2026-04-22):
 *   - NodeHarmonicSyncController.js   (384 lines)
 *   - HarmonicSyncEffectApplier.js     (214 lines)
 *   - NodeHarmonicManager.js           (445 lines)
 *
 * These three classes form the per-node sync + scene-level coordination layer.
 * NodeHarmonicManager already imported the other two, so they are natural
 * merge candidates.
 *
 * DEPENDENCY: HarmonicHubLifecycle.js (for collapse/recovery/resilience controllers)
 */

import * as THREE from 'three';
import { HarmonicHubCollapseController, HarmonicHubRecoveryController, HarmonicHubResilienceController } from './HarmonicHubLifecycle.js';


// ============================================================================
// SECTION 1: NodeHarmonicSyncController
// ============================================================================

/**
 * Manages harmonic synchronization for multiple links connected to a node.
 *
 * PHILOSOPHY:
 * Healthy nodes with multiple active links act as harmonic hubs that gently
 * synchronize the phase of connected links. This creates a visible "breathing"
 * network effect where energy flows coherently through hub nodes.
 *
 * Synchronization strength depends on:
 * - Link count (more links = stronger effect)
 * - Average synergy (higher synergy = stronger sync)
 * - Harmony vs corruption balance
 * - Overall instability level
 *
 * Links are never hard-locked to hub phase; they interpolate gradually,
 * creating smooth, organic phase alignment.
 */
export class NodeHarmonicSyncController {
    constructor(node) {
        this.node = node;
        this.connectedLinks = []; // Array of { link, direction }

        // Hub synchronization state
        this.hubPhase = 0;
        this.hubFrequency = 1.0;
        this.hubStrength = 0.0; // 0-1 range
        this.isActive = false; // True when sync conditions are met

        // Harmonic mode data
        this.currentLinkData = []; // Current link phase/frequency data

        // Configuration
        this.config = {
            // Hub activation conditions
            minLinksForHub: 3,              // Minimum connected links
            minAverageSynergy: 0.5,         // Minimum average synergy
            harmonyCorruptionRatio: 1.2,   // Harmony must be 1.2x corruption
            maxInstability: 0.4,             // Max instability for sync

            // Sync strength modifiers
            synergyStrengthScale: 0.4,      // How much synergy affects sync strength
            harmonyStrengthBoost: 0.3,      // Harmony boost to sync strength
            instabilityDamping: 0.5,        // How much instability reduces sync
            linkCountBoost: 0.1,            // Strength increase per link above minimum

            // Phase interpolation
            phaseInterpolationRate: 0.08,   // 0-1, higher = faster convergence
            frequencyInterpolationRate: 0.05, // Gentler frequency adjustment
        };

        // Temporal smoothing for hub properties
        this.targetHubPhase = 0;
        this.targetHubFrequency = 1.0;
        this.targetHubStrength = 0.0;

        // Math cache
        this._vec3 = new THREE.Vector3();
    }

    addConnectedLink(link, direction = 'in') {
        const existing = this.connectedLinks.find(cl => cl.link === link);
        if (!existing) {
            this.connectedLinks.push({ link, direction });
        }
    }

    removeConnectedLink(link) {
        this.connectedLinks = this.connectedLinks.filter(cl => cl.link !== link);
    }

    update(harmony = 1.0, corruption = 0.0, instability = 0.0) {
        harmony = Math.max(0, Math.min(1, harmony));
        corruption = Math.max(0, Math.min(1, corruption));
        instability = Math.max(0, Math.min(1, instability));

        this.checkActivationConditions(harmony, corruption, instability);

        if (this.isActive) {
            const linkData = this.collectLinkData();
            this.computeHubProperties(linkData, harmony, corruption, instability);
        } else {
            this.targetHubPhase = 0;
            this.targetHubFrequency = 1.0;
            this.targetHubStrength = 0.0;
        }

        this.hubPhase = this.lerpPhase(this.hubPhase, this.targetHubPhase, this.config.phaseInterpolationRate);
        this.hubFrequency += (this.targetHubFrequency - this.hubFrequency) * this.config.frequencyInterpolationRate;
        this.hubStrength += (this.targetHubStrength - this.hubStrength) * 0.1;

        this.hubPhase = this.normalizePhase(this.hubPhase);
        this.hubFrequency = Math.max(0.5, Math.min(2.0, this.hubFrequency));
        this.hubStrength = Math.max(0.0, Math.min(1.0, this.hubStrength));
    }

    checkActivationConditions(harmony, corruption, instability) {
        if (this.connectedLinks.length < this.config.minLinksForHub) { this.isActive = false; return; }
        if (harmony < corruption * this.config.harmonyCorruptionRatio) { this.isActive = false; return; }
        if (instability > this.config.maxInstability) { this.isActive = false; return; }

        const linkData = this.collectLinkData();
        if (linkData.length === 0) { this.isActive = false; return; }

        const avgSynergy = linkData.reduce((sum, d) => sum + d.synergy, 0) / linkData.length;
        if (avgSynergy < this.config.minAverageSynergy) { this.isActive = false; return; }

        this.isActive = true;
    }

    collectLinkData() {
        return this.connectedLinks
            .map(cl => {
                const link = cl.link;
                const state = link.group?.userData?.conduitState;
                if (!state) return null;

                const adapter = state.visualStateAdapter;
                const visualState = adapter ? adapter.getVisualState() : {};

                const synergyPhase = visualState.synergyPhase || 0;
                const synergyLevel = visualState.synergyLevel ?? 0.5;
                const frequency = 1.0 + synergyLevel * 0.5;

                return {
                    link: link,
                    phase: synergyPhase,
                    frequency: frequency,
                    synergy: synergyLevel,
                    adapter: adapter,
                };
            })
            .filter(d => d !== null);
    }

    computeHubProperties(linkData, harmony, corruption, instability) {
        if (linkData.length === 0) { this.isActive = false; return; }

        // Hub phase (circular mean)
        let sinSum = 0, cosSum = 0;
        linkData.forEach(d => { sinSum += Math.sin(d.phase); cosSum += Math.cos(d.phase); });
        sinSum /= linkData.length;
        cosSum /= linkData.length;
        this.targetHubPhase = Math.atan2(sinSum, cosSum);

        // Hub frequency (weighted by synergy)
        let freqSum = 0, synergySum = 0;
        linkData.forEach(d => { freqSum += d.frequency * d.synergy; synergySum += d.synergy; });
        this.targetHubFrequency = synergySum > 0 ? freqSum / synergySum : 1.0;

        // Hub strength
        const avgSynergy = linkData.reduce((sum, d) => sum + d.synergy, 0) / linkData.length;
        let strength = avgSynergy * this.config.synergyStrengthScale;
        strength += harmony * this.config.harmonyStrengthBoost;
        strength *= (1.0 - instability * this.config.instabilityDamping);
        const extraLinks = Math.max(0, linkData.length - this.config.minLinksForHub);
        strength += extraLinks * this.config.linkCountBoost;
        this.targetHubStrength = Math.max(0, Math.min(1.0, strength));

        this.currentLinkData = linkData;
    }

    getHarmonicMode(linkCount) {
        if (linkCount <= 2) return 'mirrored';
        if (linkCount <= 4) return 'standing-wave';
        return 'orbital';
    }

    getHarmonicPhaseOffset(linkIndex, linkCount, time = 0) {
        const mode = this.getHarmonicMode(linkCount);

        if (mode === 'mirrored') {
            return linkIndex % 2 === 0 ? 0 : Math.PI;
        }

        if (mode === 'standing-wave') {
            const angleStep = (Math.PI * 2) / Math.max(3, linkCount);
            return linkIndex * angleStep;
        }

        // orbital
        const orbitSpeed = 0.3;
        const orbitRadius = Math.PI * 0.5;
        const angleStep = (Math.PI * 2) / Math.max(5, linkCount);
        const baseAngle = linkIndex * angleStep;
        const orbitPhase = time * orbitSpeed + baseAngle;
        return orbitRadius * Math.sin(orbitPhase);
    }

    getSyncFeedback(linkIndex = 0) {
        const linkCount = this.connectedLinks.length;
        const harmonicMode = this.getHarmonicMode(linkCount);
        const phaseOffset = this.getHarmonicPhaseOffset(linkIndex, linkCount, 0);

        return {
            syncTargetPhase: this.hubPhase,
            syncFrequency: this.hubFrequency,
            syncStrength: this.hubStrength,
            isActive: this.isActive,
            linkCount: linkCount,
            harmonicMode: harmonicMode,
            phaseOffset: phaseOffset,
        };
    }

    getSyncFeedbackWithTime(linkIndex = 0, time = 0) {
        const linkCount = this.connectedLinks.length;
        const harmonicMode = this.getHarmonicMode(linkCount);
        const phaseOffset = this.getHarmonicPhaseOffset(linkIndex, linkCount, time);

        return {
            syncTargetPhase: this.hubPhase,
            syncFrequency: this.hubFrequency,
            syncStrength: this.hubStrength,
            isActive: this.isActive,
            linkCount: linkCount,
            harmonicMode: harmonicMode,
            phaseOffset: phaseOffset,
            time: time,
        };
    }

    getDebugInfo(time = 0) {
        const linkCount = this.connectedLinks.length;
        const harmonicMode = this.getHarmonicMode(linkCount);
        const phaseOffsets = [];
        for (let i = 0; i < linkCount; i++) {
            phaseOffsets.push(this.getHarmonicPhaseOffset(i, linkCount, time));
        }

        return {
            nodeId: this.node.id || 'unknown',
            isActive: this.isActive,
            linkCount: linkCount,
            harmonicMode: harmonicMode,
            phaseOffsets: phaseOffsets,
            hubPhase: this.hubPhase,
            hubFrequency: this.hubFrequency,
            hubStrength: this.hubStrength,
        };
    }

    lerpPhase(current, target, t) {
        let diff = target - current;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        return current + diff * t;
    }

    normalizePhase(phase) {
        while (phase > Math.PI) phase -= Math.PI * 2;
        while (phase < -Math.PI) phase += Math.PI * 2;
        return phase;
    }

    setConfig(configOverrides) {
        Object.assign(this.config, configOverrides);
    }

    dispose() {
        this.connectedLinks = [];
    }
}


// ============================================================================
// SECTION 2: HarmonicSyncEffectApplier
// ============================================================================

/**
 * Applies harmonic synchronization effects to link components based on hub feedback.
 *
 * VISUAL MANIFESTATIONS OF SYNCHRONIZATION:
 * - Energy waves: Phase-locked, moving coherently with hub frequency
 * - Pulse rings: Aligned timing, synchronized traversal
 * - Arc discharges: Rhythmic, coordinated spawning
 * - Strands: Subtle glow synchronization
 *
 * Synchronization is never hard-locked; links maintain individual character
 * while being gently pulled toward hub rhythm.
 */
export class HarmonicSyncEffectApplier {
    constructor() {
        // No per-instance state needed
    }

    apply(linkGroup, linkState, syncFeedback) {
        if (!linkGroup || !linkState || !syncFeedback) return;

        const { syncTargetPhase, syncFrequency, syncStrength, isActive } = syncFeedback;
        if (!isActive || syncStrength < 0.05) return;

        this.applySyncToEnergyWave(linkState.energyWave, syncFeedback);
        this.applySyncToPulseRing(linkState.pulseRing, syncFeedback);
        this.applySyncToArcDischarges(linkState.arcDischarges, syncFeedback);
        this.applySyncToStrands(linkState.strands, syncFeedback);
    }

    applySyncToEnergyWave(energyWave, syncFeedback) {
        if (!energyWave) return;
        const { syncFrequency, syncStrength } = syncFeedback;

        if (typeof energyWave.getConfig !== 'function' || typeof energyWave.setConfig !== 'function') return;

        const currentConfig = energyWave.getConfig();
        if (!currentConfig) return;

        const currentFreq = currentConfig.waveFrequency || 3.0;
        const syncAmount = (syncFrequency - currentFreq) * syncStrength * 0.2;
        const newFrequency = currentFreq + syncAmount;
        const amplitudeBoost = 1.0 + syncStrength * 0.15;

        const newConfig = {
            waveFrequency: Math.max(1.0, Math.min(5.0, newFrequency)),
            baseIntensity: (currentConfig.baseIntensity || 0.6) * amplitudeBoost,
            peakIntensity: (currentConfig.peakIntensity || 1.4) * amplitudeBoost,
        };

        energyWave.setConfig(newConfig);

        if (!energyWave.userData) energyWave.userData = {};
        energyWave.userData.harmonySync = syncStrength;
        energyWave.userData.targetFrequency = syncFrequency;
    }

    applySyncToPulseRing(pulseRing, syncFeedback) {
        if (!pulseRing || !pulseRing.material) return;
        const { syncTargetPhase, syncStrength } = syncFeedback;

        if (!pulseRing.userData) pulseRing.userData = {};
        pulseRing.userData.harmonySyncStrength = syncStrength;
        pulseRing.userData.harmonySyncPhase = syncTargetPhase;

        const mat = pulseRing.material;
        const baseOpacity = 0.4;
        const syncBrightness = baseOpacity * (1.0 + syncStrength * 0.25);
        const currentOpacity = mat.opacity || baseOpacity;
        mat.opacity = currentOpacity + (syncBrightness - currentOpacity) * 0.1;

        if (mat.color) {
            const hsl = {};
            mat.color.getHSL(hsl);
            hsl.s = Math.min(1.0, hsl.s * (1.0 + syncStrength * 0.3));
            hsl.l = Math.min(1.0, hsl.l * (1.0 + syncStrength * 0.1));
            mat.color.setHSL(hsl.h, hsl.s, hsl.l);
        }
    }

    applySyncToArcDischarges(arcDischarges, syncFeedback) {
        if (!arcDischarges) return;
        if (typeof arcDischarges.getConfig !== 'function' || typeof arcDischarges.setConfig !== 'function') return;

        const { syncStrength } = syncFeedback;
        const currentConfig = arcDischarges.getConfig();
        if (!currentConfig) return;

        const jitterReduction = syncStrength * 0.6;
        const newJitter = Math.max(0.01, (currentConfig.jitterAmount || 0.05) * (1.0 - jitterReduction));
        const arcCountStability = syncStrength * 0.2;

        const newConfig = {
            jitterAmount: newJitter,
            arcsPerBurst: Math.max(3, Math.round((currentConfig.arcsPerBurst || 5) + arcCountStability)),
            arcLength: (currentConfig.arcLength || 0.15) * (1.0 + syncStrength * 0.1),
            radiusScale: (currentConfig.radiusScale || 1.0) * (1.0 + syncStrength * 0.1),
        };

        arcDischarges.setConfig(newConfig);

        if (!arcDischarges.activeArcs) return;
        arcDischarges.userData = arcDischarges.userData || {};
        arcDischarges.userData.harmonySyncStrength = syncStrength;
    }

    applySyncToStrands(strands, syncFeedback) {
        if (!strands || strands.length === 0) return;
        const { syncStrength } = syncFeedback;

        strands.forEach((strand, index) => {
            if (!strand || !strand.material) return;

            const mat = strand.material;
            const ownerState = mat?.userData?.__strandOwnerStateRef || null;
            const dampen = ownerState?.corruptionDampen ?? 1.0;

            const baseEmissive = mat.emissiveIntensity || 1.2;
            const syncGlow = baseEmissive * (1.0 + syncStrength * 0.2 * dampen);
            mat.emissiveIntensity = baseEmissive + (syncGlow - baseEmissive) * (0.08 * dampen);

            if (mat.metalness !== undefined) {
                const baseMetal = mat.metalness || 0.8;
                const syncedMetal = baseMetal * (1.0 + syncStrength * 0.15 * dampen);
                mat.metalness = baseMetal + (syncedMetal - baseMetal) * (0.08 * dampen);
            }

            if (!strand.userData.harmonySync) strand.userData.harmonySync = 0;
            strand.userData.harmonySync += (syncStrength - strand.userData.harmonySync) * 0.05;
        });
    }

    dispose() {
        // Lightweight applier; no resources
    }
}


// ============================================================================
// SECTION 3: NodeHarmonicManager
// ============================================================================

/**
 * Manages harmonic synchronization across all nodes in the network.
 *
 * Responsibilities:
 * 1. Create/maintain a NodeHarmonicSyncController per node
 * 2. Create/maintain collapse/recovery/resilience controllers per hub node
 * 3. Register links with their source and target nodes
 * 4. Update all controllers each frame with current game state
 * 5. Apply harmonic sync feedback to link visuals
 *
 * This is a scene-level manager that coordinates all harmonic hub effects.
 */
export class NodeHarmonicManager {
    constructor(scene) {
        this.scene = scene;
        this.nodeControllers = new Map(); // Map<node, NodeHarmonicSyncController>
        this.collapseControllers = new Map(); // Map<node, HarmonicHubCollapseController>
        this.recoveryControllers = new Map(); // Map<node, HarmonicHubRecoveryController>
        this.resilienceControllers = new Map(); // Map<node, HarmonicHubResilienceController>
        this.effectApplier = new HarmonicSyncEffectApplier();

        // Configuration
        this.config = {
            enabled: true,
            updateFrequency: 1.0,
        };

        this.frameCounter = 0;
    }

    registerNode(node) {
        if (!this.nodeControllers.has(node)) {
            const controller = new NodeHarmonicSyncController(node);
            this.nodeControllers.set(node, controller);
            this._createHubControllers(node, controller);
            return controller;
        }
        return this.nodeControllers.get(node);
    }

    _createHubControllers(node, syncController) {
        const collapseController = new HarmonicHubCollapseController(syncController);
        this.collapseControllers.set(node, collapseController);

        const recoveryController = new HarmonicHubRecoveryController(syncController, collapseController);
        this.recoveryControllers.set(node, recoveryController);

        const resilienceController = new HarmonicHubResilienceController(recoveryController);
        this.resilienceControllers.set(node, resilienceController);

        node.harmonicControllers = {
            sync: syncController,
            collapse: collapseController,
            recovery: recoveryController,
            resilience: resilienceController
        };
    }

    unregisterNode(node) {
        const controller = this.nodeControllers.get(node);
        if (controller) {
            controller.dispose();
            this.nodeControllers.delete(node);
        }

        const collapseController = this.collapseControllers.get(node);
        if (collapseController) {
            collapseController.dispose?.();
            this.collapseControllers.delete(node);
        }

        this.recoveryControllers.delete(node);
        this.resilienceControllers.delete(node);

        if (node.harmonicControllers) {
            delete node.harmonicControllers;
        }
    }

    registerLinkWithNodes(link, sourceNode, targetNode) {
        if (!sourceNode || !targetNode) return;

        this.registerNode(sourceNode);
        this.registerNode(targetNode);

        const sourceController = this.nodeControllers.get(sourceNode);
        const targetController = this.nodeControllers.get(targetNode);

        if (sourceController) sourceController.addConnectedLink(link, 'out');
        if (targetController) targetController.addConnectedLink(link, 'in');
    }

    unregisterLinkFromNodes(link, sourceNode, targetNode) {
        if (sourceNode) {
            const sourceController = this.nodeControllers.get(sourceNode);
            if (sourceController) sourceController.removeConnectedLink(link);
        }
        if (targetNode) {
            const targetController = this.nodeControllers.get(targetNode);
            if (targetController) targetController.removeConnectedLink(link);
        }
    }

    update(links, harmony = 1.0, corruption = 0.0, instability = 0.0, deltaTime = 0.016) {
        if (!this.config.enabled) return;

        harmony = Math.max(0, Math.min(1, harmony));
        corruption = Math.max(0, Math.min(1, corruption));
        instability = Math.max(0, Math.min(1, instability));
        deltaTime = Math.max(0, Math.min(0.1, deltaTime));

        this.nodeControllers.forEach((controller, node) => {
            controller.update(harmony, corruption, instability);

            const synergy = node.userData?.metrics?.synergy ?? 0.5;

            const collapseController = this.collapseControllers.get(node);
            if (collapseController) {
                collapseController.update(harmony, corruption, synergy, instability, deltaTime);
            }

            const collapseFactor = collapseController?.collapseFactor ?? 0;

            const recoveryController = this.recoveryControllers.get(node);
            if (recoveryController) {
                recoveryController.update(harmony, corruption, synergy, instability, deltaTime, collapseFactor);
            }

            const recoveryFactor = recoveryController?.recoveryFactor ?? 0;
            const isInRecovery = recoveryController?.isInRecovery() ?? false;
            const isInCollapse = collapseController?.isInOverload ?? false;

            const resilienceController = this.resilienceControllers.get(node);
            if (resilienceController) {
                resilienceController.update(harmony, corruption, isInCollapse, isInRecovery, deltaTime, recoveryFactor);
            }
        });

        this.applySyncToLinks(links);
    }

    applySyncToLinks(links) {
        if (!links || !Array.isArray(links)) return;

        links.forEach(link => {
            if (!link || !link.group || !link.source || !link.target) return;

            const linkState = link.group.userData.conduitState;
            if (!linkState) return;

            const sourceController = this.nodeControllers.get(link.source);
            const targetController = this.nodeControllers.get(link.target);

            let combinedFeedback = null;

            if (sourceController && targetController) {
                const sourceFeedback = sourceController.getSyncFeedback();
                const targetFeedback = targetController.getSyncFeedback();

                combinedFeedback = {
                    syncTargetPhase: (sourceFeedback.syncTargetPhase + targetFeedback.syncTargetPhase) * 0.5,
                    syncFrequency: (sourceFeedback.syncFrequency + targetFeedback.syncFrequency) * 0.5,
                    syncStrength: Math.max(sourceFeedback.syncStrength, targetFeedback.syncStrength),
                    isActive: sourceFeedback.isActive || targetFeedback.isActive,
                };
            } else if (sourceController) {
                combinedFeedback = sourceController.getSyncFeedback();
            } else if (targetController) {
                combinedFeedback = targetController.getSyncFeedback();
            }

            if (combinedFeedback) {
                this.effectApplier.apply(link.group, linkState, combinedFeedback);
            }
        });
    }

    getNodeDebugInfo(node) {
        const controller = this.nodeControllers.get(node);
        return controller ? controller.getDebugInfo() : null;
    }

    getAllDebugInfo() {
        const info = {};
        this.nodeControllers.forEach((controller, node) => {
            info[node.id || 'unknown'] = controller.getDebugInfo();
        });
        return info;
    }

    getHubStatistics() {
        const stats = {
            totalNodes: this.nodeControllers.size,
            activeHubs: 0,
            totalConnectedLinks: 0,
            avgSyncStrength: 0.0,
            avgResilience: 0.0,
            hubsInCollapse: 0,
            hubsInRecovery: 0,
        };

        let totalStrength = 0;
        let totalResilience = 0;

        this.nodeControllers.forEach((controller, node) => {
            if (controller.isActive) stats.activeHubs++;
            stats.totalConnectedLinks += controller.connectedLinks.length;
            totalStrength += controller.hubStrength;

            const resilienceController = this.resilienceControllers.get(node);
            if (resilienceController) totalResilience += resilienceController.hubResilience;

            const collapseController = this.collapseControllers.get(node);
            const recoveryController = this.recoveryControllers.get(node);
            if (collapseController?.isInOverload) stats.hubsInCollapse++;
            if (recoveryController?.isInRecovery()) stats.hubsInRecovery++;
        });

        stats.avgSyncStrength = this.nodeControllers.size > 0 ? totalStrength / this.nodeControllers.size : 0;
        stats.avgResilience = this.nodeControllers.size > 0 ? totalResilience / this.nodeControllers.size : 0;

        return stats;
    }

    getHubStateData(nodeId) {
        let targetNode = null;
        for (const node of this.nodeControllers.keys()) {
            if (node.id === nodeId) { targetNode = node; break; }
        }
        if (!targetNode) return null;

        const syncController = this.nodeControllers.get(targetNode);
        const collapseController = this.collapseControllers.get(targetNode);
        const recoveryController = this.recoveryControllers.get(targetNode);
        const resilienceController = this.resilienceControllers.get(targetNode);

        if (!syncController) return null;

        return {
            nodeId: nodeId,
            isHarmonicHub: syncController.isActive,
            activeLinkCount: syncController.connectedLinks.length,
            phase: syncController.hubPhase,
            syncStrength: syncController.hubStrength,
            harmony: targetNode.userData?.metrics?.harmony ?? 0.5,
            synergy: targetNode.userData?.metrics?.synergy ?? 0.5,
            corruption: targetNode.userData?.metrics?.corruption ?? 0,
            instability: targetNode.userData?.metrics?.instability ?? 0,
            stability: 1 - (targetNode.userData?.metrics?.instability ?? 0),
            resilience: resilienceController?.hubResilience ?? 0,
            isRecovering: recoveryController?.isInRecovery() ?? false,
            isCollapsed: collapseController?.collapseFactor > 0.8 ?? false,
            collapseFactor: collapseController?.collapseFactor ?? 0,
            recoveryFactor: recoveryController?.recoveryFactor ?? 0,
        };
    }

    getAllHubStateData() {
        const hubData = new Map();

        this.nodeControllers.forEach((syncController, node) => {
            const nodeId = node.id || 'unknown';
            const collapseController = this.collapseControllers.get(node);
            const recoveryController = this.recoveryControllers.get(node);
            const resilienceController = this.resilienceControllers.get(node);

            hubData.set(nodeId, {
                nodeId: nodeId,
                isHarmonicHub: syncController.isActive,
                activeLinkCount: syncController.connectedLinks.length,
                phase: syncController.hubPhase,
                syncStrength: syncController.hubStrength,
                harmony: node.userData?.metrics?.harmony ?? 0.5,
                synergy: node.userData?.metrics?.synergy ?? 0.5,
                corruption: node.userData?.metrics?.corruption ?? 0,
                instability: node.userData?.metrics?.instability ?? 0,
                stability: 1 - (node.userData?.metrics?.instability ?? 0),
                resilience: resilienceController?.hubResilience ?? 0,
                isRecovering: recoveryController?.isInRecovery() ?? false,
                isCollapsed: collapseController?.collapseFactor > 0.8 ?? false,
                collapseFactor: collapseController?.collapseFactor ?? 0,
                recoveryFactor: recoveryController?.recoveryFactor ?? 0,
            });
        });

        return hubData;
    }

    getCollapseController(node) { return this.collapseControllers.get(node); }
    getRecoveryController(node) { return this.recoveryControllers.get(node); }
    getResilienceController(node) { return this.resilienceControllers.get(node); }

    setConfig(configOverrides) { Object.assign(this.config, configOverrides); }
    setEnabled(enabled) { this.config.enabled = enabled; }

    dispose() {
        this.nodeControllers.forEach(controller => controller.dispose());
        this.nodeControllers.clear();

        this.collapseControllers.forEach(controller => controller.dispose?.());
        this.collapseControllers.clear();

        this.recoveryControllers.clear();
        this.resilienceControllers.clear();

        this.effectApplier.dispose();
    }
}
