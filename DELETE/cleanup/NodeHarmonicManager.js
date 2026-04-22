import * as THREE from 'three';
import { NodeHarmonicSyncController } from './NodeHarmonicSyncController.js';
import { HarmonicSyncEffectApplier } from './HarmonicSyncEffectApplier.js';
import { HarmonicHubCollapseController } from './HarmonicHubCollapseController.js';
import { HarmonicHubRecoveryController } from './HarmonicHubRecoveryController.js';
import { HarmonicHubResilienceController } from './HarmonicHubResilienceController.js';

/**
 * NodeHarmonicManager
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

    /**
     * Register a node for harmonic sync management
     * Also creates collapse/recovery/resilience controllers for hub nodes
     */
    registerNode(node) {
        if (!this.nodeControllers.has(node)) {
            const controller = new NodeHarmonicSyncController(node);
            this.nodeControllers.set(node, controller);
            
            // Create collapse/recovery/resilience controllers for this node
            this._createHubControllers(node, controller);
            
            return controller;
        }
        return this.nodeControllers.get(node);
    }
    
    /**
     * Create collapse/recovery/resilience controllers for a hub node
     * @private
     */
    _createHubControllers(node, syncController) {
        // Create collapse controller
        const collapseController = new HarmonicHubCollapseController(syncController);
        this.collapseControllers.set(node, collapseController);
        
        // Create recovery controller (depends on collapse controller)
        const recoveryController = new HarmonicHubRecoveryController(syncController, collapseController);
        this.recoveryControllers.set(node, recoveryController);
        
        // Create resilience controller (depends on recovery controller)
        const resilienceController = new HarmonicHubResilienceController(recoveryController);
        this.resilienceControllers.set(node, resilienceController);
        
        // Attach controllers to node for external access (e.g., HarmonicNodeResonanceHalos)
        node.harmonicControllers = {
            sync: syncController,
            collapse: collapseController,
            recovery: recoveryController,
            resilience: resilienceController
        };
    }

    /**
     * Unregister a node and all its controllers
     */
    unregisterNode(node) {
        const controller = this.nodeControllers.get(node);
        if (controller) {
            controller.dispose();
            this.nodeControllers.delete(node);
        }
        
        // Dispose collapse controller
        const collapseController = this.collapseControllers.get(node);
        if (collapseController) {
            collapseController.dispose?.();
            this.collapseControllers.delete(node);
        }
        
        // Dispose recovery controller
        this.recoveryControllers.delete(node);
        
        // Dispose resilience controller
        this.resilienceControllers.delete(node);
        
        // Clean up node reference
        if (node.harmonicControllers) {
            delete node.harmonicControllers;
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
     * @param {Array} links - Array of links to apply sync effects to
     * @param {number} harmony - Harmony level (0-1)
     * @param {number} corruption - Corruption level (0-1)
     * @param {number} instability - Instability level (0-1)
     * @param {number} deltaTime - Frame delta time (seconds)
     */
    update(links, harmony = 1.0, corruption = 0.0, instability = 0.0, deltaTime = 0.016) {
        if (!this.config.enabled) return;

        // Clamp inputs
        harmony = Math.max(0, Math.min(1, harmony));
        corruption = Math.max(0, Math.min(1, corruption));
        instability = Math.max(0, Math.min(1, instability));
        deltaTime = Math.max(0, Math.min(0.1, deltaTime));

        // Update all node controllers with current game state
        this.nodeControllers.forEach((controller, node) => {
            // Update sync controller
            controller.update(harmony, corruption, instability);
            
            // Get synergy from node metrics or default
            const synergy = node.userData?.metrics?.synergy ?? 0.5;
            
            // Update collapse controller
            const collapseController = this.collapseControllers.get(node);
            if (collapseController) {
                collapseController.update(harmony, corruption, synergy, instability, deltaTime);
            }
            
            // Get collapse factor for recovery controller
            const collapseFactor = collapseController?.collapseFactor ?? 0;
            
            // Update recovery controller
            const recoveryController = this.recoveryControllers.get(node);
            if (recoveryController) {
                recoveryController.update(harmony, corruption, synergy, instability, deltaTime, collapseFactor);
            }
            
            // Get recovery factor for resilience controller
            const recoveryFactor = recoveryController?.recoveryFactor ?? 0;
            const isInRecovery = recoveryController?.isInRecovery() ?? false;
            const isInCollapse = collapseController?.isInOverload ?? false;
            
            // Update resilience controller
            const resilienceController = this.resilienceControllers.get(node);
            if (resilienceController) {
                resilienceController.update(harmony, corruption, isInCollapse, isInRecovery, deltaTime, recoveryFactor);
            }
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
            avgResilience: 0.0,
            hubsInCollapse: 0,
            hubsInRecovery: 0,
        };

        let totalStrength = 0;
        let totalResilience = 0;

        this.nodeControllers.forEach((controller, node) => {
            if (controller.isActive) {
                stats.activeHubs++;
            }
            stats.totalConnectedLinks += controller.connectedLinks.length;
            totalStrength += controller.hubStrength;
            
            // Get resilience
            const resilienceController = this.resilienceControllers.get(node);
            if (resilienceController) {
                totalResilience += resilienceController.hubResilience;
            }
            
            // Count collapse/recovery states
            const collapseController = this.collapseControllers.get(node);
            const recoveryController = this.recoveryControllers.get(node);
            if (collapseController?.isInOverload) {
                stats.hubsInCollapse++;
            }
            if (recoveryController?.isInRecovery()) {
                stats.hubsInRecovery++;
            }
        });

        stats.avgSyncStrength = this.nodeControllers.size > 0 ? totalStrength / this.nodeControllers.size : 0;
        stats.avgResilience = this.nodeControllers.size > 0 ? totalResilience / this.nodeControllers.size : 0;

        return stats;
    }
    
    /**
     * Get hub state data for a specific node (for HarmonicNodeResonanceHalos)
     * Returns comprehensive state including collapse/recovery/resilience
     */
    getHubStateData(nodeId) {
        let targetNode = null;
        
        // Find node by ID
        for (const node of this.nodeControllers.keys()) {
            if (node.id === nodeId) {
                targetNode = node;
                break;
            }
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
    
    /**
     * Get all hub state data (for HarmonicNodeResonanceHalos)
     * Returns Map of nodeId → hub state data
     */
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
    
    /**
     * Get collapse controller for a node
     */
    getCollapseController(node) {
        return this.collapseControllers.get(node);
    }
    
    /**
     * Get recovery controller for a node
     */
    getRecoveryController(node) {
        return this.recoveryControllers.get(node);
    }
    
    /**
     * Get resilience controller for a node
     */
    getResilienceController(node) {
        return this.resilienceControllers.get(node);
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
        // Dispose sync controllers
        this.nodeControllers.forEach(controller => controller.dispose());
        this.nodeControllers.clear();
        
        // Dispose collapse controllers
        this.collapseControllers.forEach(controller => controller.dispose?.());
        this.collapseControllers.clear();
        
        // Clear recovery controllers
        this.recoveryControllers.clear();
        
        // Clear resilience controllers
        this.resilienceControllers.clear();
        
        // Dispose effect applier
        this.effectApplier.dispose();
    }
}
