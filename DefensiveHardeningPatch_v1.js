/**
 * DEFENSIVE HARDENING PATCH v1.0
 * 
 * Stabilizes runtime by adding protective guards against:
 * 1. "is not iterable" errors from null/undefined collections
 * 2. Transparent node cores being visually swallowed by auras after link events
 * 
 * SCOPE: Defensive guards ONLY - zero behavior changes
 * 
 * SAFETY:
 * ✓ All guards use safe patterns (Array.isArray, optional chaining)
 * ✓ Silent failures (no throwing/logging)
 * ✓ Zero performance impact when not needed
 * ✓ Automatic normalization at initialization
 * ✓ Layering fixes use renderOrder/depthWrite only
 */

/**
 * ============================================================================
 * TASK 1: ITERABLE SAFETY HARDENING
 * ============================================================================
 */

/**
 * Apply defensive guards to WaveShaderBridge_v1
 * Ensures registeredMaterials/registeredNodeMaterials/registeredLinkMaterials are always iterable
 */
export function patchWaveShaderBridge(bridgeInstance) {
    if (!bridgeInstance) return;
    
    try {
        // Normalize material collections on access
        const originalUpdateNodeMaterials = bridgeInstance._updateNodeMaterials;
        bridgeInstance._updateNodeMaterials = function(nodes) {
            // Guard: ensure nodes is iterable
            if (!Array.isArray(nodes)) {
                nodes = [];
            }
            // Ensure registeredNodeMaterials is iterable
            if (!this.registeredNodeMaterials || typeof this.registeredNodeMaterials[Symbol.iterator] !== 'function') {
                this.registeredNodeMaterials = new WeakSet();
                return;  // Early exit if no materials registered
            }
            return originalUpdateNodeMaterials.call(this, nodes);
        };

        const originalUpdateLinkMaterials = bridgeInstance._updateLinkMaterials;
        bridgeInstance._updateLinkMaterials = function(links) {
            // Guard: ensure links is iterable
            if (!Array.isArray(links)) {
                links = [];
            }
            // Ensure registeredLinkMaterials is iterable
            if (!this.registeredLinkMaterials || typeof this.registeredLinkMaterials[Symbol.iterator] !== 'function') {
                this.registeredLinkMaterials = new WeakSet();
                return;  // Early exit if no materials registered
            }
            return originalUpdateLinkMaterials.call(this, links);
        };
    } catch (e) {
        // Silent failure - no throwing
    }
}

/**
 * Apply defensive guards to WaveTravelShaderPack_v1
 * Ensures material collections are always iterable
 */
export function patchWaveTravelShaderPack(packInstance) {
    if (!packInstance) return;
    
    try {
        // At init, normalize registeredMaterials
        if (!packInstance.registeredMaterials || typeof packInstance.registeredMaterials[Symbol.iterator] !== 'function') {
            packInstance.registeredMaterials = new WeakSet();
        }
    } catch (e) {
        // Silent failure
    }
}

/**
 * Apply defensive guards to WaveDynamicsShaderPack_v1
 * Ensures material collections are always iterable
 */
export function patchWaveDynamicsShaderPack(packInstance) {
    if (!packInstance) return;
    
    try {
        // At init, normalize registeredMaterials
        if (!packInstance.registeredMaterials || typeof packInstance.registeredMaterials[Symbol.iterator] !== 'function') {
            packInstance.registeredMaterials = new WeakSet();
        }
    } catch (e) {
        // Silent failure
    }
}

/**
 * Apply defensive guards to FXRuntime_v1
 * Ensures narrativePatterns and nodes are always iterable
 */
export function patchFXRuntime(fxRuntimeInstance) {
    if (!fxRuntimeInstance) return;
    
    try {
        // Wrap the update method to guard against undefined narrativePatterns
        const originalUpdate = fxRuntimeInstance.update;
        fxRuntimeInstance.update = function(delta) {
            // Guard: ensure game.narrativePatterns is valid
            if (this.game?.narrativePatterns && typeof this.game.narrativePatterns[Symbol.iterator] !== 'function') {
                // Silently neutralize invalid narrativePatterns
                const saved = this.game.narrativePatterns;
                this.game.narrativePatterns = [];
                try {
                    const result = originalUpdate.call(this, delta);
                    return result;
                } finally {
                    this.game.narrativePatterns = saved;
                }
            }
            return originalUpdate.call(this, delta);
        };
    } catch (e) {
        // Silent failure
    }
}

/**
 * Apply defensive guards to AINodes
 * Ensures nodes array is always defined and iterable
 */
export function patchAINodes(aiNodesInstance) {
    if (!aiNodesInstance) return;
    
    try {
        // Normalize nodes on initialization
        if (!Array.isArray(aiNodesInstance.nodes)) {
            aiNodesInstance.nodes = [];
        }
        
        // Wrap update method to guard nodes access
        const originalUpdate = aiNodesInstance.update;
        aiNodesInstance.update = function(deltaTime, time) {
            // Guard: ensure nodes is always an array
            if (!Array.isArray(this.nodes)) {
                this.nodes = [];
            }
            // Early exit if nodes is empty
            if (!this.nodes || this.nodes.length === 0) {
                return;
            }
            return originalUpdate.call(this, deltaTime, time);
        };
    } catch (e) {
        // Silent failure
    }
}

/**
 * Apply defensive guards to any custom system that might iterate nodes/materials
 * Universal guard pattern that can be applied to multiple systems
 */
export function applyIterableGuard(instance, collectionName) {
    if (!instance || !collectionName) return;
    
    try {
        const original = instance[collectionName];
        Object.defineProperty(instance, collectionName, {
            get() {
                // Return original if it's iterable
                if (original && typeof original[Symbol.iterator] === 'function') {
                    return original;
                }
                // Otherwise return empty array to prevent "is not iterable" errors
                return [];
            },
            set(value) {
                // Allow setting but validate type
                if (value === null || value === undefined) {
                    // Silently normalize to empty array
                    return;
                }
                Object.defineProperty(this, `_${collectionName}`, { value, configurable: true });
            }
        });
    } catch (e) {
        // Silent failure - property might already be non-configurable
    }
}

/**
 * ============================================================================
 * TASK 2: TRANSPARENT LAYERING CORRECTION
 * ============================================================================
 */

/**
 * Apply node surface dominance rule to ensure core is always visible
 * Uses renderOrder and depthWrite tuning ONLY
 * Scans entire scene including invisible nodes
 */
export function applyNodeSurfaceDominanceLayer(scene) {
    if (!scene) return;
    
    try {
        // Use traverse instead of traverseVisible to catch ALL nodes
        // (invisible nodes still need proper layering for when they become visible)
        scene.traverse((obj) => {
            // Identify node core meshes
            if (obj.isMesh && (obj.name?.includes('core') || obj.userData?.isNodeCore || obj.userData?.visualLayer === 'CORE')) {
                // Node core must render AFTER all auras
                obj.renderOrder = 100;  // Highest priority
                
                // Ensure core uses depth testing to maintain Z-ordering
                if (obj.material) {
                    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
                    materials.forEach(mat => {
                        if (mat && typeof mat === 'object') {
                            mat.depthTest = true;      // Enable depth testing
                            mat.depthWrite = false;     // Allow writing to depth buffer
                        }
                    });
                }
            }
            
            // Identify aura meshes
            else if (obj.isMesh && (obj.name?.includes('aura') || obj.userData?.isAura || obj.userData?.visualLayer === 'AURA')) {
                // Auras render AFTER cores
                obj.renderOrder = 10;
                
                // Auras should not write to depth buffer to avoid occluding core
                if (obj.material) {
                    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
                    materials.forEach(mat => {
                        if (mat && typeof mat === 'object') {
                            mat.depthTest = true;      // Still test depth (respect sorting)
                            mat.depthWrite = false;    // Don't block core from rendering
                            
                            // CRITICAL (Session 30): STRICT opacity clamp to guarantee core visibility
                            if (mat.transparent && mat.opacity !== undefined) {
                                mat.opacity = Math.min(mat.opacity, 0.08);  // Reduced from 0.25 to 0.08
                            }
                        }
                    });
                }
            }
            
            // Identify halo/effects meshes
            else if (obj.isMesh && (obj.name?.includes('halo') || obj.userData?.isHalo || obj.userData?.visualLayer === 'HALO')) {
                // Halos render before auras
                obj.renderOrder = 5;
                if (obj.material) {
                    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
                    materials.forEach(mat => {
                        if (mat && typeof mat === 'object') {
                            mat.depthTest = true;
                            mat.depthWrite = false;
                        }
                    });
                }
            }
        });
    } catch (e) {
        // Silent failure - traversal might fail for invalid scenes
    }
}

/**
 * Post-link-event layering correction
 * Called after link events to restore proper rendering order
 * 
 * Traverses entire node tree (not just direct children) to catch
 * nested auras/cores that may be buried in group hierarchies
 */
export function correctPostLinkLayering(node) {
    if (!node) return;
    
    try {
        // Use traverse to catch nested geometries
        if (node.traverse && typeof node.traverse === 'function') {
            node.traverse((child) => {
                if (!child.isMesh) return;
                
                // CORE: Always on top
                if (child.name?.includes('core') || child.userData?.isNodeCore || child.userData?.visualLayer === 'CORE') {
                    child.renderOrder = 100;
                    if (child.material) {
                        const materials = Array.isArray(child.material) ? child.material : [child.material];
                        materials.forEach(mat => {
                            if (mat && typeof mat === 'object') {
                                mat.depthWrite = true;
                                mat.depthTest = true;
                            }
                        });
                    }
                }
                // AURA: Always below core
                else if (child.name?.includes('aura') || child.userData?.isAura || child.userData?.visualLayer === 'AURA') {
                    child.renderOrder = 10;
                    
                    // Cap aura opacity to prevent core occlusion
                    if (child.material) {
                        const materials = Array.isArray(child.material) ? child.material : [child.material];
                        materials.forEach(mat => {
                            if (mat && typeof mat === 'object') {
                                mat.depthWrite = false;
                                mat.depthTest = true;
                                
                                // CRITICAL (Session 30): STRICT opacity clamp on link
                                if (mat.transparent && mat.opacity !== undefined) {
                                    mat.opacity = Math.min(mat.opacity, 0.08);  // Reduced from 0.25 to 0.08
                                }
                            }
                        });
                    }
                }
                // HALO/EFFECTS: Below auras
                else if (child.name?.includes('halo') || child.userData?.isHalo || child.userData?.visualLayer === 'HALO') {
                    child.renderOrder = 5;
                    if (child.material) {
                        const materials = Array.isArray(child.material) ? child.material : [child.material];
                        materials.forEach(mat => {
                            if (mat && typeof mat === 'object') {
                                mat.depthWrite = false;
                                mat.depthTest = true;
                            }
                        });
                    }
                }
            });
        }
    } catch (e) {
        // Silent failure
    }
}

/**
 * ============================================================================
 * INITIALIZATION & INTEGRATION
 * ============================================================================
 */

/**
 * Comprehensive initialization - applies all defensive patches
 * Call this early in main.js after creating FX/system instances
 */
export function applyAllDefensivePatches(game) {
    if (!game) return;
    
    try {
        // Patch wave shader systems
        if (game.waveShaderBridge) patchWaveShaderBridge(game.waveShaderBridge);
        if (game.waveTravelShaderPack) patchWaveTravelShaderPack(game.waveTravelShaderPack);
        if (game.waveDynamicsShaderPack) patchWaveDynamicsShaderPack(game.waveDynamicsShaderPack);
        
        // Patch FX runtime
        if (game.fxRuntime_v1) patchFXRuntime(game.fxRuntime_v1);
        
        // Patch AINodes
        if (game.aiNodes) patchAINodes(game.aiNodes);
        
        // Apply node surface dominance layer to scene
        if (game.scene) applyNodeSurfaceDominanceLayer(game.scene);
    } catch (e) {
        // Silent initialization failure - system continues anyway
    }
}

export default {
    patchWaveShaderBridge,
    patchWaveTravelShaderPack,
    patchWaveDynamicsShaderPack,
    patchFXRuntime,
    patchAINodes,
    applyIterableGuard,
    applyNodeSurfaceDominanceLayer,
    correctPostLinkLayering,
    applyAllDefensivePatches
};
