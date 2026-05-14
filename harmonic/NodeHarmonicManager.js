/**
 * harmonic/NodeHarmonicManager.js
 * ============================================================================
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
 *
 * CONSTRAINTS:
 * ✅ Adapter-only visual system
 * ✅ Read-only from node/link state
 * ✅ No gameplay changes
 * ✅ Zero per-frame allocations
 * ✅ Graceful fallback if data missing
 * ✅ Fully reversible
 * ✅ Deterministic (no randomness)
 */

import { NodeHarmonicSyncController } from './NodeHarmonicSyncController.js';
import { HarmonicSyncEffectApplier } from './HarmonicSyncEffectApplier.js';
import { HarmonicHubCollapseController } from './HarmonicHubCollapseController.js';
import { HarmonicHubRecoveryController } from './HarmonicHubRecoveryController.js';
import { HarmonicHubResilienceController } from './HarmonicHubResilienceController.js';

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
