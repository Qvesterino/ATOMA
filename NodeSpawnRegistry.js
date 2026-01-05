/**
 * NODE SPAWN REGISTRY
 * 
 * Enforces the "Single Instance Rule" for unique node archetypes.
 * Prevents logical duplication of Mythic, Prime, and specific Named nodes.
 */

export class NodeSpawnRegistry {
    constructor() {
        // Map of active unique nodes: "Category:Archetype" -> NodeID
        this.activeUniqueNodes = new Map();
        
        // Debug metrics
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
        if (!this._isUniqueType(category, archetype)) {
            return true; // Generic nodes are always allowed
        }

        const key = this._makeKey(category, archetype);
        return !this.activeUniqueNodes.has(key);
    }

    /**
     * Register a node spawn. Call this immediately after spawning.
     * 
     * @param {string} category 
     * @param {string} archetype 
     * @param {string} nodeId 
     */
    registerSpawn(category, archetype, nodeId) {
        if (this._isUniqueType(category, archetype)) {
            const key = this._makeKey(category, archetype);
            this.activeUniqueNodes.set(key, nodeId);
            this.allowedSpawns++;
            // console.log(`[NodeSpawnRegistry] Registered unique node: ${key} (${nodeId})`);
        }
    }

    /**
     * Deregister a node on destruction.
     * 
     * @param {string} category 
     * @param {string} archetype 
     */
    deregisterSpawn(category, archetype) {
        if (this._isUniqueType(category, archetype)) {
            const key = this._makeKey(category, archetype);
            this.activeUniqueNodes.delete(key);
            // console.log(`[NodeSpawnRegistry] Deregistered unique node: ${key}`);
        }
    }

    /**
     * Get the existing node ID for a unique archetype.
     */
    getExistingNodeId(category, archetype) {
        const key = this._makeKey(category, archetype);
        return this.activeUniqueNodes.get(key);
    }

    /**
     * Helper: Determine if a Category+Archetype combination requires uniqueness.
     */
    _isUniqueType(category, archetype) {
        const c = (category || '').toLowerCase();
        const a = (archetype || '').toLowerCase();

        // 1. Mythic and Prime categories are inherently unique per archetype
        if (c === 'mythic' || c === 'prime' || c === 'sigma' || c === 'quantum') {
             // If archetype is provided and not generic default
             if (a && a !== 'default' && a !== c) {
                 return true;
             }
        }

        // 2. Specific "Named" archetypes from any category
        // Heuristic: If archetype name is complex (contains hyphens) it's likely a specific unique type
        if (a && a.includes('-')) {
            return true;
        }

        return false;
    }

    _makeKey(category, archetype) {
        return `${category}:${archetype}`.toLowerCase();
    }
    
    reset() {
        this.activeUniqueNodes.clear();
        this.deniedSpawns = 0;
        this.allowedSpawns = 0;
    }
}

export const nodeSpawnRegistry = new NodeSpawnRegistry();
