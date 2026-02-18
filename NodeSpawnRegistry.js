/**
 * NODE SPAWN REGISTRY
 * 
 * Enforces the "Single Instance Rule" for unique node archetypes.
 * Prevents logical duplication of Mythic, Prime, and specific Named nodes.
 */

import { uniqueSpawnService } from './UniqueSpawnService.js';

 export class NodeSpawnRegistry {
    constructor() {
        this.deniedSpawns = 0;
        this.allowedSpawns = 0;
    }

    /**
     * Check if a spawn request is allowed based on uniqueness rules.
     * 
     * @param {string} category - Node category (e.g. 'mythic', 'process')
     * @param {string} archetype - Specific archetype (e.g. 'CORE-STELLAR-ASCENDED')
     * @returns {boolean} true if spawn is allowed, false if denied (duplicate)
     */
    isSpawnAllowed(category, archetype) {
        const key = uniqueSpawnService.makeKey({ category, archetype });
        const decision = uniqueSpawnService.check({ key });
        if (decision.allowed) {
            this.allowedSpawns++;
        } else {
            this.deniedSpawns++;
        }
        return decision.allowed;
    }

    /**
     * Register a node spawn. Call this immediately after spawning.
     * 
     * @param {string} category 
     * @param {string} archetype 
     * @param {string} nodeId 
     */
    registerSpawn(category, archetype, nodeId) {
        const key = uniqueSpawnService.makeKey({ category, archetype });
        if (!key) return;
        uniqueSpawnService.register({ key, nodeId, meta: { category, source: 'NodeSpawnRegistry' } });
        this.allowedSpawns++;
        // console.log(`[NodeSpawnRegistry] Registered unique node: ${key} (${nodeId})`);
    }

    /**
     * Deregister a node on destruction.
     * 
     * @param {string} category 
     * @param {string} archetype 
     */
    deregisterSpawn(category, archetype) {
        const key = uniqueSpawnService.makeKey({ category, archetype });
        if (!key) return;
        uniqueSpawnService.releaseByKey(key);
        // console.log(`[NodeSpawnRegistry] Deregistered unique node: ${key}`);
    }

    /**
     * Get the existing node ID for a unique archetype.
     */
    getExistingNodeId(category, archetype) {
        const key = uniqueSpawnService.makeKey({ category, archetype });
        if (!key) return null;
        const decision = uniqueSpawnService.check({ key });
        return decision.existingNodeId;
    }
    
    reset() {
        // Clear underlying registry to mirror previous reset behavior.
        if (uniqueSpawnService?.registry?.clear) {
            uniqueSpawnService.registry.clear();
        }
        if (uniqueSpawnService?.metaByNodeId?.clear) {
            uniqueSpawnService.metaByNodeId.clear();
        }
        this.deniedSpawns = 0;
        this.allowedSpawns = 0;
    }
}

export const nodeSpawnRegistry = new NodeSpawnRegistry();
