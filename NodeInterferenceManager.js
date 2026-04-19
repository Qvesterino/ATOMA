import * as THREE from 'three';
import { InterferenceEffectApplier } from './InterferenceEffectApplier.js';

/**
 * NodeInterferenceManager
 * ============================================================================
 * Manages synergy wave interference across all nodes in the network.
 *
 * Responsibilities:
 * 1. Create/maintain interference per node
 * 2. Register links with their source and target nodes
 * 3. Update all controllers each frame
 * 4. Apply interference feedback to link visuals
 *
 * This is a scene-level manager that coordinates all local interference effects.
 */
export class NodeInterferenceManager {
    constructor(scene) {
        this.scene = scene;
        this.nodeControllers = new Map();
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
            this.nodeControllers.set(node, null);
            return null;
        }
        return this.nodeControllers.get(node);
    }

    /**
     * Unregister a node
     */
    unregisterNode(node) {
        this.nodeControllers.delete(node);
    }

    /**
     * Register a link with its source and target nodes
     */
    registerLinkWithNodes(link, sourceNode, targetNode) {
        if (!sourceNode || !targetNode) return;

        // Ensure nodes are registered
        this.registerNode(sourceNode);
        this.registerNode(targetNode);
    }

    /**
     * Unregister a link from its nodes
     */
    unregisterLinkFromNodes(link, sourceNode, targetNode) {
        // No-op - controllers removed
    }

    /**
     * Update all interference controllers and apply effects
     */
    update(links, harmony = 1.0, corruption = 0.0, instability = 0.0) {
        if (!this.config.enabled) return;

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

            // No interference feedback - controllers removed
        });
    }

    /**
     * Get debugging info for a node
     */
    getNodeDebugInfo(node) {
        return null;
    }

    /**
     * Get debugging info for all nodes
     */
    getAllDebugInfo() {
        return {};
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
        this.nodeControllers.clear();
        this.effectApplier.dispose();
    }
}
