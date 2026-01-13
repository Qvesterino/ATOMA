import * as THREE from 'three';
import { NodeHarmonicSyncController } from './NodeHarmonicSyncController.js';
import { HarmonicSyncEffectApplier } from './HarmonicSyncEffectApplier.js';

/**
 * NodeHarmonicManager
 * ============================================================================
 * Manages harmonic synchronization across all nodes in the network.
 * 
 * Responsibilities:
 * 1. Create/maintain a NodeHarmonicSyncController per node
 * 2. Register links with their source and target nodes
 * 3. Update all controllers each frame with current game state
 * 4. Apply harmonic sync feedback to link visuals
 * 
 * This is a scene-level manager that coordinates all harmonic hub effects.
 */
export class NodeHarmonicManager {
    constructor(scene) {
        this.scene = scene;
        this.nodeControllers = new Map(); // Map<node, NodeHarmonicSyncController>
        this.effectApplier = new HarmonicSyncEffectApplier();
        
        // Configuration
        this.config = {
            enabled: true,
            updateFrequency: 1.0,
        };
        
        this.frameCounter = 0;
    }

    /**
     * Register a node for harmonic sync management
     */
    registerNode(node) {
        if (!this.nodeControllers.has(node)) {
            const controller = new NodeHarmonicSyncController(node);
            this.nodeControllers.set(node, controller);
            return controller;
        }
        return this.nodeControllers.get(node);
    }

    /**
     * Unregister a node
     */
    unregisterNode(node) {
        const controller = this.nodeControllers.get(node);
        if (controller) {
            controller.dispose();
            this.nodeControllers.delete(node);
        }
    }

    /**
     * Register a link with its source and target nodes
     */
    registerLinkWithNodes(link, sourceNode, targetNode) {
        if (!sourceNode || !targetNode) return;

        // Ensure nodes are registered
        this.registerNode(sourceNode);
        this.registerNode(targetNode);

        // Add link to both node controllers
        const sourceController = this.nodeControllers.get(sourceNode);
        const targetController = this.nodeControllers.get(targetNode);

        if (sourceController) sourceController.addConnectedLink(link, 'out');
        if (targetController) targetController.addConnectedLink(link, 'in');
    }

    /**
     * Unregister a link from its nodes
     */
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

    /**
     * Update all harmonic controllers and apply effects
     */
    update(links, harmony = 1.0, corruption = 0.0, instability = 0.0) {
        if (!this.config.enabled) return;

        // Update all node controllers with current game state
        this.nodeControllers.forEach(controller => {
            controller.update(harmony, corruption, instability);
        });

        // Apply harmonic sync feedback to each link's visuals
        this.applySyncToLinks(links);
    }

    /**
     * Apply harmonic sync effects to all links
     */
    applySyncToLinks(links) {
        if (!links || !Array.isArray(links)) return;

        links.forEach(link => {
            if (!link || !link.group || !link.source || !link.target) return;

            const linkState = link.group.userData.conduitState;
            if (!linkState) return;

            // Get harmonic sync feedback from both nodes
            const sourceController = this.nodeControllers.get(link.source);
            const targetController = this.nodeControllers.get(link.target);

            // Combine feedback from both nodes (average the effects)
            let combinedFeedback = null;

            if (sourceController && targetController) {
                // Both nodes have harmonic sync data
                const sourceFeedback = sourceController.getSyncFeedback();
                const targetFeedback = targetController.getSyncFeedback();

                // Average metrics from both ends
                combinedFeedback = {
                    syncTargetPhase: (sourceFeedback.syncTargetPhase + targetFeedback.syncTargetPhase) * 0.5,
                    syncFrequency: (sourceFeedback.syncFrequency + targetFeedback.syncFrequency) * 0.5,
                    syncStrength: Math.max(sourceFeedback.syncStrength, targetFeedback.syncStrength), // Use max for stronger effect
                    isActive: sourceFeedback.isActive || targetFeedback.isActive,
                };
            } else if (sourceController) {
                combinedFeedback = sourceController.getSyncFeedback();
            } else if (targetController) {
                combinedFeedback = targetController.getSyncFeedback();
            }

            // Apply to link visuals if we have feedback
            if (combinedFeedback) {
                this.effectApplier.apply(link.group, linkState, combinedFeedback);
            }
        });
    }

    /**
     * Get debugging info for a node
     */
    getNodeDebugInfo(node) {
        const controller = this.nodeControllers.get(node);
        return controller ? controller.getDebugInfo() : null;
    }

    /**
     * Get debugging info for all nodes
     */
    getAllDebugInfo() {
        const info = {};
        this.nodeControllers.forEach((controller, node) => {
            info[node.id || 'unknown'] = controller.getDebugInfo();
        });
        return info;
    }

    /**
     * Get hub statistics for visualization/monitoring
     */
    getHubStatistics() {
        const stats = {
            totalNodes: this.nodeControllers.size,
            activeHubs: 0,
            totalConnectedLinks: 0,
            avgSyncStrength: 0.0,
        };

        let totalStrength = 0;

        this.nodeControllers.forEach(controller => {
            if (controller.isActive) {
                stats.activeHubs++;
            }
            stats.totalConnectedLinks += controller.connectedLinks.length;
            totalStrength += controller.hubStrength;
        });

        stats.avgSyncStrength = this.nodeControllers.size > 0 ? totalStrength / this.nodeControllers.size : 0;

        return stats;
    }

    /**
     * Set configuration
     */
    setConfig(configOverrides) {
        Object.assign(this.config, configOverrides);
    }

    /**
     * Enable/disable the entire system
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
    }

    /**
     * Dispose all controllers and cleanup
     */
    dispose() {
        this.nodeControllers.forEach(controller => controller.dispose());
        this.nodeControllers.clear();
        this.effectApplier.dispose();
    }
}
