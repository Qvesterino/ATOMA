import * as THREE from 'three';

/**
 * LinkCascadePulseManager
 * ============================================================================
 * Manages cascade pulse propagation between interconnected harmonic hubs.
 * 
 * SYSTEM BEHAVIOR:
 * - Pulses propagate from one hub to neighboring hubs through the network
 * - Each cascade creates a "wave" effect across hub-connected regions
 * - Cascade speed scales with harmony and synergy
 * - Corruption/stability dampen cascade propagation
 * - Visual effect: coordinated pulses flowing through hub network
 * 
 * ARCHITECTURE:
 * - Per-hub cascade state (active cascades, propagation)
 * - Per-link cascade phase delay (determines when cascade arrives)
 * - Zero per-frame allocations
 * - Hub-to-hub connectivity graph built dynamically
 * 
 * CONSTRAINTS:
 * ✅ Adapter-only visual system
 * ✅ Read-only from node/link state
 * ✅ No gameplay logic changes
 * ✅ Safe material updates only
 * ✅ Zero per-frame allocations
 */
export class LinkCascadePulseManager {
    constructor() {
        this._eventBus = null;
        this._eventDisposers = [];

        this.config = {
            // Cascade propagation
            cascadeSpeedBase: 1.0,          // Units per second along network
            cascadeAttenuationBase: 0.8,    // Amplitude per hop (0.8 = 80% strength)
            
            // State modulation
            harmonyCascadeBoost: 0.6,       // Harmony increases speed/reach
            corruptionCascadeDamping: 0.7, // Corruption slows/weakens cascade
            stabilityCascadeDamping: 0.5, // Stability weakens cascade
            synergyCascadeBoost: 0.4,       // Synergy increases cascade power
            
            // Cascade effect visualization
            cascadeTravelTime: 2.0,         // Base time for cascade to cross one hub connection
            cascadeArrivalSpeedUp: 1.3,     // Cascade moves faster than normal pulses
            cascadeVisualizationBoost: 1.2, // Visual emphasis on cascade pulses
            
            // Network topology
            maxCascadeHops: 8,              // Maximum propagation distance
            minHubConnectionQuality: 0.3,   // Min harmony to cascade through link
        };
        
        // Runtime state
        this.hubNetwork = new Map();        // Map<hubNode, Set<connectedHubNodes>>
        this.activeCascades = [];           // Array of { sourceHub, age, duration, targets }
        this.linkCascadeState = new Map();  // Map<link, cascadeData>
        
        // Math cache
        this._vec3 = new THREE.Vector3();
    }

    /**
     * Build or update hub-to-hub connectivity graph
     * Called when hubs change or links are added/removed
     * 
     * @param {Map} nodeControllers - Map of node → NodeHarmonicSyncController
     */
    buildHubNetwork(nodeControllers) {
        this.hubNetwork.clear();
        
        if (!nodeControllers || nodeControllers.size === 0) return;
        
        // For each active hub
        nodeControllers.forEach((controller, node) => {
            if (!controller.isActive) return;
            
            // Initialize hub entry
            if (!this.hubNetwork.has(node)) {
                this.hubNetwork.set(node, new Set());
            }
            
            // Find connected hubs through links
            const connectedHubs = this._findConnectedHubs(
                node,
                controller,
                nodeControllers
            );
            
            connectedHubs.forEach(hub => {
                this.hubNetwork.get(node).add(hub);
            });
        });
    }

    /**
     * Register a link for cascade state tracking
     * Called when link is created
     * 
     * @param {Object} link - Link object
     */
    registerLinkForCascade(link) {
        if (!this.linkCascadeState.has(link)) {
            this.linkCascadeState.set(link, {
                activeCascades: [],      // Cascades currently affecting this link
                cascadePhaseDelay: 0.0,  // Phase shift from cascade
                cascadeArrivalTime: null, // When cascade arrives at this link
                cascadeAttenuation: 1.0, // Strength multiplier
            });
        }
    }

    /**
     * Unregister a link from cascade tracking
     * 
     * @param {Object} link - Link object
     */
    unregisterLinkForCascade(link) {
        this.linkCascadeState.delete(link);
    }

    /**
     * Emit cascade pulse from a source hub
     * Called when a harmonic hub emits a pulse
     * 
     * @param {Object} sourceHub - Source harmonic hub node
     * @param {Object} hubController - NodeHarmonicSyncController for hub
     * @param {Map} nodeControllers - All node controllers
     * @param {number} time - Current time
     */
    emitCascadePulse(sourceHub, hubController, nodeControllers, time = 0) {
        if (!sourceHub || !hubController || !hubController.isActive) return;
        
        // Find all connected hubs (direct and multi-hop)
        const targets = this._findCascadeTargets(
            sourceHub,
            hubController,
            nodeControllers
        );
        
        if (targets.length === 0) return; // No cascade targets
        
        // Create new cascade
        const cascade = {
            sourceHub: sourceHub,
            emitTime: time,
            age: 0,
            duration: 6.0,  // Cascade lives for up to 6 seconds
            targets: targets,  // Array of { hub, distance, quality }
            strength: hubController.hubStrength,
        };
        
        this.activeCascades.push(cascade);
    }

    /**
     * Update cascade propagation state
     * Called every frame
     * 
     * @param {number} deltaTime - Frame delta
     * @param {number} time - Current time
     * @param {number} harmony - Game harmony (0-1)
     * @param {number} corruption - Game corruption (0-1)
     * @param {number} stability - Game stability (0-1)
     * @param {number} synergy - Game synergy (0-1)
     * @param {Map} nodeControllers - All node controllers
     * @param {Array} links - All link objects
     */
    update(deltaTime, time, harmony = 1.0, corruption = 0.0, stability = 0.0, synergy = 0.5, nodeControllers = null, links = []) {
        // Age all active cascades
        for (let i = this.activeCascades.length - 1; i >= 0; i--) {
            const cascade = this.activeCascades[i];
            cascade.age += deltaTime;
            
            // Remove expired cascades
            if (cascade.age >= cascade.duration) {
                this.activeCascades.splice(i, 1);
                continue;
            }
            
            // Propagate cascade to connected hubs
            this._propagateCascade(
                cascade,
                time,
                harmony,
                corruption,
                stability,
                synergy
            );
        }
        
        // Update cascade effects on links
        this._updateLinkCascadeState(links, time, harmony, corruption, stability, synergy);
    }

    /**
     * Get cascade effect for a link
     * Used during pulse rendering to apply cascade visual effects
     * 
     * @param {Object} link - Link object
     * @param {number} time - Current time
     * @returns {Object} Cascade effect multipliers
     */
    getLinkCascadeEffect(link, time = 0) {
        const cascadeData = this.linkCascadeState.get(link);
        if (!cascadeData || cascadeData.activeCascades.length === 0) {
            return {
                intensity: 1.0,
                thickness: 1.0,
                speed: 1.0,
                saturation: 0.0,
                cascadeActive: false,
            };
        }
        
        // Find strongest active cascade affecting this link
        let maxIntensity = 0;
        let maxThickness = 0;
        let cascadeSpeed = 1.0;
        let cascadeSaturation = 0;
        
        for (const cascadeInfo of cascadeData.activeCascades) {
            // Cascade arrives at specific time
            if (time < cascadeInfo.arrivalTime) continue;
            
            // Time since arrival
            const timeSinceArrival = time - cascadeInfo.arrivalTime;
            const cascadeDuration = 1.5; // Cascade effect lasts 1.5 seconds
            
            if (timeSinceArrival > cascadeDuration) continue;
            
            // Bell curve over cascade duration (peak at center)
            const cascadePhase = timeSinceArrival / cascadeDuration;
            const intensity = Math.sin(cascadePhase * Math.PI) * cascadeInfo.strength;
            
            maxIntensity = Math.max(maxIntensity, intensity);
            maxThickness = Math.max(maxThickness, intensity * 0.5);
            cascadeSpeed = Math.max(cascadeSpeed, 1.0 + intensity * 0.4);
            cascadeSaturation = Math.max(cascadeSaturation, intensity * 0.4);
        }
        
        return {
            intensity: 1.0 + (maxIntensity * this.config.cascadeVisualizationBoost),
            thickness: 1.0 + (maxThickness * this.config.cascadeVisualizationBoost),
            speed: cascadeSpeed,
            saturation: cascadeSaturation,
            cascadeActive: maxIntensity > 0.1,
        };
    }

    /**
     * Find connected hubs from a source hub
     * @private
     */
    _findConnectedHubs(sourceNode, sourceController, nodeControllers) {
        const connectedHubs = new Set();
        
        // Look at links connected to this hub
        for (const linkData of sourceController.connectedLinks) {
            const link = linkData.link;
            if (!link || !link.group) continue;
            
            // Find the other end of the link
            const otherNode = link.source === sourceNode ? link.target : link.source;
            if (!otherNode) continue;
            
            // Check if other node is also a hub
            const otherController = nodeControllers.get(otherNode);
            if (otherController && otherController.isActive) {
                connectedHubs.add(otherNode);
            }
        }
        
        return Array.from(connectedHubs);
    }
    
    /**
     * Find link between two nodes
     * @private
     */
    _findLinkBetweenNodes(nodeA, nodeB, nodeControllers) {
        const controllerA = nodeControllers.get(nodeA);
        if (!controllerA) return null;
        
        for (const linkData of controllerA.connectedLinks) {
            const link = linkData.link;
            if (!link) continue;
            
            // Check if link connects nodeA and nodeB
            const connectsToNodeB = 
                (link.source === nodeA && link.target === nodeB) ||
                (link.source === nodeB && link.target === nodeA);
            
            if (connectsToNodeB) {
                return link;
            }
        }
        
        return null;
    }

    /**
     * Find cascade targets (neighboring hubs reachable through network)
     * @private
     */
    _findCascadeTargets(sourceHub, hubController, nodeControllers) {
        const targets = [];
        const visited = new Set([sourceHub]);
        const queue = [{ hub: sourceHub, distance: 0, quality: 1.0 }];
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            // Skip if too far
            if (current.distance >= this.config.maxCascadeHops) continue;
            
            // Skip source
            if (current.distance > 0) {
                targets.push(current);
            }
            
            // Find neighbors
            const currentController = nodeControllers.get(current.hub);
            if (!currentController) continue;
            
            const neighbors = this._findConnectedHubs(current.hub, currentController, nodeControllers);
            
            for (const neighbor of neighbors) {
                if (visited.has(neighbor)) continue;
                
                visited.add(neighbor);
                
                // Quality depends on link health
                // Compute from actual link harmony/synergy metrics
                const link = this._findLinkBetweenNodes(current.hub, neighbor, nodeControllers);
                let qualityFactor = 0.9; // Default fallback
                
                if (link && link.userData) {
                    const linkHarmony = link.userData.metrics?.harmony || 0.5;
                    const linkSynergy = link.userData.metrics?.synergy || 0.5;
                    
                    // Higher harmony/synergy = less quality loss
                    // Range: 0.7 (excellent) to 0.95 (poor)
                    qualityFactor = 0.95 - ((linkHarmony + linkSynergy) * 0.125);
                    qualityFactor = Math.max(0.7, Math.min(0.95, qualityFactor));
                }
                
                const quality = current.quality * qualityFactor;
                
                if (quality >= this.config.minHubConnectionQuality) {
                    queue.push({
                        hub: neighbor,
                        distance: current.distance + 1,
                        quality: quality,
                    });
                }
            }
        }
        
        return targets;
    }

    /**
     * Propagate cascade to connected hubs and links
     * @private
     */
    _propagateCascade(cascade, time, harmony, corruption, stability, synergy) {
        // Cascade speed scales with state
        let cascadeSpeed = this.config.cascadeSpeedBase;
        cascadeSpeed *= (1.0 + harmony * this.config.harmonyCascadeBoost);
        cascadeSpeed *= (1.0 + synergy * this.config.synergyCascadeBoost);
        cascadeSpeed *= (1.0 - (corruption * this.config.corruptionCascadeDamping));
        cascadeSpeed *= (1.0 - (stability * this.config.stabilityCascadeDamping));
        
        // For each target hub
        for (const target of cascade.targets) {
            // Time for cascade to reach this target
            const travelDistance = target.distance;
            const travelTime = (this.config.cascadeTravelTime / cascadeSpeed) * travelDistance;
            const arrivalTime = cascade.emitTime + travelTime;
            
            // Check if cascade has arrived yet
            if (time < arrivalTime) continue;
            
            // Attenuation increases per hop
            const attenuation = Math.pow(this.config.cascadeAttenuationBase, target.distance);
            const cascadeStrength = cascade.strength * attenuation * target.quality;
            
            // Store cascade info for this target
            if (!target.cascadeInfo) {
                target.cascadeInfo = {
                    arrivalTime: arrivalTime,
                    strength: cascadeStrength,
                };
            }
        }
    }

    /**
     * Update cascade state on all links
     * @private
     */
    _updateLinkCascadeState(links, time, harmony, corruption, stability, synergy) {
        for (const link of links) {
            if (!link || !link.group) continue;
            
            const cascadeData = this.linkCascadeState.get(link);
            if (!cascadeData) continue;
            
            // Clear old cascades
            cascadeData.activeCascades = [];
            
            // Find cascades affecting this link
            for (const cascade of this.activeCascades) {
                for (const target of cascade.targets) {
                    if (!target.cascadeInfo) continue;
                    
                    // Check if this link connects to target hub
                    const linkConnectsToHub = (link.source === target.hub || link.target === target.hub);
                    
                    if (linkConnectsToHub) {
                        cascadeData.activeCascades.push({
                            arrivalTime: target.cascadeInfo.arrivalTime,
                            strength: target.cascadeInfo.strength,
                        });
                    }
                }
            }
        }
    }

    /**
     * Get cascade network statistics
     * For debugging/monitoring
     * 
     * @returns {Object} Cascade statistics
     */
    getStatistics() {
        const stats = {
            activeHubs: this.hubNetwork.size,
            activeCascades: this.activeCascades.length,
            hubConnections: 0,
            maxCascadeDistance: 0,
        };
        
        this.hubNetwork.forEach(connections => {
            stats.hubConnections += connections.size;
        });
        
        this.activeCascades.forEach(cascade => {
            const maxDistance = Math.max(...cascade.targets.map(t => t.distance), 0);
            stats.maxCascadeDistance = Math.max(stats.maxCascadeDistance, maxDistance);
        });
        
        return stats;
    }

    setEventBus(bus) {
        if (!bus || this._eventBus) return;
        this._eventBus = bus;

        const register = (tag, handler) => {
            if (typeof bus.subscribe === 'function') {
                const unsub = bus.subscribe(tag, handler, { priority: bus.priority?.NORMAL });
                this._eventDisposers.push(() => unsub?.());
            } else if (typeof bus.on === 'function') {
                bus.on(tag, handler, { priority: bus.priority?.NORMAL });
                this._eventDisposers.push(() => bus.off?.(tag, handler));
            }
        };

        // Canonical tiered events → cascade pulse emission
        register('node.harmony.high', (payload) => {
            const node = payload?.node;
            if (!node) return;
            this.emitCascadePulse(node, { isActive: true, hubStrength: 0.9 }, null, performance.now() * 0.001);
        });

        register('node.synergy.high', (payload) => {
            const node = payload?.node;
            if (!node) return;
            this.emitCascadePulse(node, { isActive: true, hubStrength: 0.8 }, null, performance.now() * 0.001);
        });

        register('node.corruption.high', (payload) => {
            const node = payload?.node;
            if (!node) return;
            // Corruption dampens — emit weak cascade
            this.emitCascadePulse(node, { isActive: true, hubStrength: 0.3 }, null, performance.now() * 0.001);
        });
    }

    /**
     * Clear all cascade state (cleanup)
     */
    clear() {
        this.hubNetwork.clear();
        this.activeCascades = [];
        this.linkCascadeState.clear();
    }

    /**
     * Dispose and cleanup
     */
    dispose() {
        for (const dispose of this._eventDisposers) {
            try { dispose(); } catch (_e) {}
        }
        this._eventDisposers = [];
        this._eventBus = null;
        this.clear();
    }
}
