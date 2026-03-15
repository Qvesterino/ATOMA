import * as THREE from 'three';
import { NodeSynergyInterferenceController } from './NodeSynergyInterferenceController.js';
import { InterferenceEffectApplier } from './InterferenceEffectApplier.js';

/**
 * NodeInterferenceManager
 * ============================================================================
 * Manages synergy wave interference across all nodes in the network.
 * 
 * Responsibilities:
 * 1. Create/maintain a NodeSynergyInterferenceController per node
 * 2. Register links with their source and target nodes
 * 3. Update all controllers each frame
 * 4. Apply interference feedback to link visuals
 * 
 * This is a scene-level manager that coordinates all local interference effects.
 */
export class NodeInterferenceManager {
    constructor(scene) {
        this.scene = scene;
        this.nodeControllers = new Map(); // Map<node, NodeSynergyInterferenceController>
        this.effectApplier = new InterferenceEffectApplier();
        
        // Configuration
        this.config = {
            enabled: true,
            updateFrequency: 1.0, // Update every frame
        };
        
        this.frameCounter = 0;
    }

    /**
     * Register a node for interference management
     */
    registerNode(node) {
        if (!this.nodeControllers.has(node)) {
            const controller = new NodeSynergyInterferenceController(node);
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
     * Update all interference controllers and apply effects
     */
    update(links, harmony = 1.0, corruption = 0.0, instability = 0.0) {
        if (!this.config.enabled) return;

        // Update all node controllers
        this.nodeControllers.forEach((controller, node) => {
            controller.update(harmony, corruption, instability);

            // Export node-level interference to canonical waveField bridge.
            if (!node?.userData) node.userData = {};
            node.userData.waveField = node.userData.waveField || {};
            const feedback = controller.getInterferenceFeedback?.();
            const rawInterference = Number.isFinite(feedback?.interferenceFactor)
                ? feedback.interferenceFactor
                : 0;
            node.userData.waveField.interference = Math.max(0, Math.min(1, rawInterference));
        });

        // Apply interference feedback to each link's visuals
        this.applyInterferenceToLinks(links);
    }

    /**
     * Apply interference effects to all links
     */
    applyInterferenceToLinks(links) {
        if (!links || !Array.isArray(links)) return;

        links.forEach(link => {
            if (!link || !link.group || !link.source || !link.target) return;

            const linkState = link.group.userData.conduitState;
            if (!linkState) return;

            // Get interference feedback from both nodes
            const sourceController = this.nodeControllers.get(link.source);
            const targetController = this.nodeControllers.get(link.target);

            // Combine feedback from both nodes (averaging the effects)
            let combinedFeedback = null;

            if (sourceController && targetController) {
                // Both nodes have interference data
                const sourceFeedback = sourceController.getInterferenceFeedback();
                const targetFeedback = targetController.getInterferenceFeedback();

                // Average the metrics
                combinedFeedback = {
                    interferenceFactor: (sourceFeedback.interferenceFactor + targetFeedback.interferenceFactor) * 0.5,
                    syncBias: (sourceFeedback.syncBias + targetFeedback.syncBias) * 0.5,
                    averagePhase: (sourceFeedback.averagePhase + targetFeedback.averagePhase) * 0.5,
                    phaseVariance: (sourceFeedback.phaseVariance + targetFeedback.phaseVariance) * 0.5,
                    combinedAmplitude: (sourceFeedback.combinedAmplitude + targetFeedback.combinedAmplitude) * 0.5,
                };
            } else if (sourceController) {
                combinedFeedback = sourceController.getInterferenceFeedback();
            } else if (targetController) {
                combinedFeedback = targetController.getInterferenceFeedback();
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
