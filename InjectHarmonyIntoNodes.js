/**
 * Inject Harmony into Nodes
 * ============================================================================
 * 
 * Injects harmonyLevel > 0 values into nodes to make visual pipeline "live"
 * 
 * This is a gameplay modification that should be used carefully.
 * 
 * @author ATOMA Architect
 * @version 1.0.0
 */

import * as THREE from 'three';

/**
 * Inject harmony values into nodes at runtime
 * 
 * @param {Object} aiNodes - AINodes instance
 * @param {Number} harmonyLevel - Harmony level to inject (0-1)
 * @param {Boolean} debugMode - Enable debug logging
 * @returns {Object} Statistics object
 */
export function injectHarmonyIntoNodes(aiNodes, harmonyLevel = 0.5, debugMode = false) {
    if (!aiNodes || !aiNodes.nodes) {
        console.error('[InjectHarmonyIntoNodes] aiNodes or aiNodes.nodes is required');
        return {
            success: false,
            injectedCount: 0,
            error: 'aiNodes or aiNodes.nodes is required'
        };
    }

    const nodes = aiNodes.nodes;
    let injectedCount = 0;

    // Guard: Only inject if node.userData exists
    for (const node of nodes) {
        if (!node || !node.userData) continue;

        // Guard: Only inject if harmonyLevel is currently 0 or undefined
        const currentHarmony = node.userData?.harmonyLevel ?? 0;
        if (currentHarmony <= 0) {
            if (debugMode) {
                console.log(`[InjectHarmonyIntoNodes] Skipping node ${node.id}: currentHarmony=${currentHarmony.toFixed(2)} <= 0, skipping injection`);
            }
            continue;
        }

        // Inject harmony level
        node.userData.harmonyLevel = harmonyLevel;

        // Injected successfully
        injectedCount++;

        if (debugMode) {
            console.log(`[InjectHarmonyIntoNodes] Injected harmonyLevel=${harmonyLevel.toFixed(2)} into node ${node.id}`);
        }
    }

    return {
        success: true,
        injectedCount,
        error: null
    };
}

/**
 * Inject random harmony levels into nodes
 * 
 * Creates variation in harmony levels across the network
 * 
 * @param {Object} aiNodes - AINodes instance
 * @param {Number} minLevel - Minimum harmony level (default 0.3)
 * @param {Number} maxLevel - Maximum harmony level (default 0.8)
 * @param {Number} distribution - Distribution pattern ('random', 'gradient', 'cluster')
 * @param {Boolean} debugMode - Enable debug logging
 * @returns {Object} Statistics object
 */
export function injectRandomHarmonyDistribution(aiNodes, {
    minLevel = 0.3,
    maxLevel = 0.8,
    distribution = 'random',
    debugMode = false
}) {
    if (!aiNodes || !aiNodes.nodes) {
        console.error('[injectRandomHarmonyDistribution] aiNodes or aiNodes.nodes is required');
        return {
            success: false,
            injectedCount: 0,
            error: 'aiNodes or aiNodes is required'
        };
    }

    const nodes = aiNodes.nodes;
    let injectedCount = 0;

    // Guard: Only inject if node.userData exists
    for (const node of nodes) {
        if (!node || !node.userData) continue;

        // Calculate harmony level based on distribution pattern
        let harmonyLevel;
        
        if (distribution === 'random') {
            harmonyLevel = minLevel + Math.random() * (maxLevel - minLevel);
        } else if (distribution === 'gradient') {
            // Gradient from center outward
            const centerIndex = Math.floor(nodes.length / 2);
            const centerNode = nodes[centerIndex];
            const distanceFromCenter = centerNode.position.distanceTo(centerNode.position);
            const maxDistance = Math.max(...nodes.map(n => centerNode.position.distanceTo(n.position)));
            const normalizedDistance = distanceFromCenter / maxDistance;
            harmonyLevel = maxLevel * (1 - normalizedDistance);
        } else if (distribution === 'cluster') {
            // Cluster nodes by proximity and assign similar harmony levels
            // Simplified: group nodes into clusters and assign same level
            const clusters = [];
            const used = new Set();
            
            for (const node of nodes) {
                if (used.has(node.id)) continue;
                
                // Find closest cluster
                let closestCluster = null;
                let closestDistance = Infinity;
                
                for (const cluster of clusters) {
                    let clusterDistance = 0;
                    for (const clusterNode of cluster.nodes) {
                        const distance = node.position.distanceTo(cluster.center);
                        clusterDistance += distance;
                    }
                    const avgDistance = clusterDistance / cluster.nodes.length;
                    
                    if (avgDistance < closestDistance) {
                        closestCluster = cluster;
                        closestDistance = avgDistance;
                    }
                }
                
                used.add(node.id);
                clusters.push({
                    nodes: [node],
                    center: node.position,
                    avgDistance: 0
                });
            }
            
            // Assign harmony levels based on cluster
            for (const cluster of clusters) {
                const clusterLevel = minLevel + Math.random() * (maxLevel - minLevel);
                for (const clusterNode of cluster.nodes) {
                    if (!used.has(clusterNode.id)) {
                        clusterNode.userData.harmonyLevel = clusterLevel;
                        used.add(clusterNode.id);
                        injectedCount++;
                        
                        if (debugMode) {
                            console.log(`[injectRandomHarmonyDistribution] Cluster harmony=${clusterLevel.toFixed(2)} for node ${clusterNode.id}`);
                        }
                    }
                }
            }
        } else {
            // Random distribution
            harmonyLevel = minLevel + Math.random() * (maxLevel - minLevel);
            node.userData.harmonyLevel = harmonyLevel;
            injectedCount++;
            
            if (debugMode) {
                console.log(`[injectRandomHarmonyDistribution] Random harmony=${harmonyLevel.toFixed(2)} for node ${node.id}`);
            }
        }
    }

    return {
        success: true,
        injectedCount,
        error: null
    };
}

/**
 * Inject harmony into specific nodes by ID
 * 
 * @param {Object} aiNodes - AINodes instance
 * @param {Array} nodeIds - Array of node IDs to target
 * @param {Number} harmonyLevel - Harmony level to inject (0-1)
 * @param {Boolean} debugMode - Enable debug logging
 * @returns {Object} Statistics object
 */
export function injectHarmonyIntoNodesById(aiNodes, nodeIds, harmonyLevel = 0.5, debugMode = false) {
    if (!aiNodes || !aiNodes.nodes) {
        console.error('[injectHarmonyIntoNodesById] aiNodes or aiNodes.nodes is required');
        return {
            success: false,
            injectedCount: 0,
            error: 'aiNodes or aiNodes.nodes is required'
        };
    }

    const nodes = aiNodes.nodes;
    let injectedCount = 0;

    // Guard: Only inject if node exists and userData exists
    for (const nodeId of nodeIds) {
        const node = nodes.find(n => n.id === nodeId);
        if (!node || !node.userData) {
            if (debugMode) {
                console.log(`[injectHarmonyIntoNodesById] Node ${nodeId} not found or has no userData`);
            }
            continue;
        }

        // Guard: Only inject if harmonyLevel is currently 0 or undefined
        const currentHarmony = node.userData?.harmonyLevel ?? 0;
        if (currentHarmony <= 0) {
            if (debugMode) {
                console.log(`[injectHarmonyIntoNodesById] Skipping node ${nodeId}: currentHarmony=${currentHarmony.toFixed(2)} <= 0, skipping injection`);
            }
            continue;
        }

        // Inject harmony level
        node.userData.harmonyLevel = harmonyLevel;

        // Injected successfully
        injectedCount++;

        if (debugMode) {
            console.log(`[injectHarmonyIntoNodesById] Injected harmonyLevel=${harmonyLevel.toFixed(2)} into node ${nodeId}`);
        }
    }

    return {
        success: true,
        injectedCount,
        error: null
    };
}

/**
 * Get harmony statistics
 * 
 * Returns statistics about harmony distribution in the network
 * 
 * @param {Object} aiNodes - AINodes instance
 * @returns {Object} Statistics object
 */
export function getHarmonyStatistics(aiNodes) {
    if (!aiNodes || !aiNodes.nodes) {
        return {
            totalNodes: 0,
            nodesWithHarmony: 0,
            avgHarmony: 0,
            maxHarmony: 0,
            minHarmony: 0,
            harmonyDistribution: {}
        };
    }

    const nodes = aiNodes.nodes;
    let totalHarmony = 0;
    let nodesWithHarmony = 0;
    let maxHarmony = 0;
    let minHarmony = 1;
    const distribution = {};

    // Collect harmony data
    for (const node of nodes) {
        if (!node.userData) continue;

        const harmony = node.userData.harmonyLevel ?? 0;
        totalHarmony += harmony;
        
        if (harmony > 0) {
            nodesWithHarmony++;
            if (harmony > maxHarmony) maxHarmony = harmony;
            if (harmony < minHarmony) minHarmony = harmony;
        }
        
        // Bucket by range
        const range = harmony < 0.2 ? 'none' : harmony < 0.4 ? 'low' : harmony < 0.6 ? 'medium' : harmony < 0.8 ? 'high' : 'very-high';
        distribution[range] = (distribution[range] || 0) + 1;
    }

    return {
        totalNodes: nodes.length,
        nodesWithHarmony,
        avgHarmony: totalHarmony / nodes.length,
        maxHarmony,
        minHarmony,
        harmonyDistribution: distribution
    };
}

/**
 * Console API for debugging
 * 
 * Exposes functions for runtime debugging
 */
export const HarmonyInjectAPI = {
    /**
     * Inject harmony into all nodes
     */
    injectAll: (aiNodes, harmonyLevel = 0.5) => {
        return injectHarmonyIntoNodes(aiNodes, harmonyLevel);
    },
    
    /**
     * Inject random distribution
     */
    injectRandomDistribution: (aiNodes, options = {}) => {
        return injectRandomHarmonyDistribution(aiNodes, options);
    },
    
    /**
     * Inject into specific nodes
     */
    injectIntoNodesById: (aiNodes, nodeIds, harmonyLevel = 0.5) => {
        return injectHarmonyIntoNodesById(aiNodes, nodeIds, harmonyLevel);
    },
    
    /**
     * Get statistics
     */
    getStatistics: (aiNodes) => {
        return getHarmonyStatistics(aiNodes);
    }
};
