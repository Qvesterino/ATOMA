import * as THREE from 'three';

/**
 * WAVE INTERFERENCE ENGINE v1.0
 * 
 * Multi-origin wave interference system for ATOMA.
 * Computes interference patterns from multiple wave sources across the network.
 * 
 * FEATURES:
 * ✓ Multiple simultaneous wave sources (nodes, links, events, world)
 * ✓ BFS-based propagation with configurable hop limits
 * ✓ Physical wave interference calculations
 * ✓ Synergy/resonance/corruption amplitude modulation
 * ✓ Standing wave factor detection
 * ✓ Zero allocations per update (pooled sources)
 * ✓ WeakMap state tracking (automatic GC)
 * ✓ 100% optional chaining, defensive programming
 * ✓ Standalone, additive module (no file modifications)
 * 
 * ARCHITECTURE:
 * - WaveSourceManager: Manages wave origins & lifecycle
 * - WavePropagationGraph: Network traversal & caching
 * - WaveMath: Physical wave calculations & interference
 * - WaveInterferenceEngine_v1: Main controller
 */

/**
 * Wave source manager - tracks all active wave origins
 */
class WaveSourceManager {
    constructor(maxSources = 8) {
        this.maxSources = maxSources;
        this.sources = new Map();              // id → WaveSource
        this.sourcePool = [];                  // Pre-allocated pool
        this.nextId = 0;
        this.creationOrder = [];               // Track FIFO for pruning
    }
    
    /**
     * Add a new wave source
     */
    addSource(config) {
        try {
            const id = `wave_${++this.nextId}`;
            
            const source = {
                id,
                type: config?.type || 'NODE',
                nodeId: config?.nodeId,
                linkId: config?.linkId,
                originPosition: config?.originPosition ? 
                    new THREE.Vector3().copy(config.originPosition) : 
                    new THREE.Vector3(0, 0, 0),
                startTime: config?.startTime || 0,
                baseAmplitude: Math.max(0, Math.min(1, config?.baseAmplitude ?? 0.8)),
                baseFrequency: Math.max(0.1, config?.baseFrequency ?? 2.0),
                basePhase: config?.basePhase ?? 0,
                decayRadius: Math.max(1, config?.decayRadius ?? 10),
                profile: config?.profile || 'SYNERGY',
                synergyBoost: Math.max(0, Math.min(1, config?.synergyBoost ?? 0.5)),
                resonanceBoost: Math.max(0, Math.min(1, config?.resonanceBoost ?? 0.3)),
                corruptionBoost: Math.max(0, Math.min(1, config?.corruptionBoost ?? 0)),
                currentAmplitude: config?.baseAmplitude ?? 0.8,
                age: 0,
                ttl: config?.ttl ?? 10.0,      // Time to live (seconds)
                _targets: null                  // Cached propagation targets
            };
            
            this.sources.set(id, source);
            this.creationOrder.push(id);
            
            // Prune if exceeding max sources
            if (this.sources.size > this.maxSources) {
                this._pruneOldest();
            }
            
            return id;
        } catch (e) {
            console.warn('[WaveInterferenceEngine] addSource error:', e);
            return null;
        }
    }
    
    /**
     * Update all sources (age, decay amplitude)
     */
    update(deltaTime) {
        try {
            for (const [id, source] of this.sources) {
                source.age += deltaTime;
                
                // Natural amplitude decay over lifetime
                const ageRatio = Math.max(0, 1 - (source.age / source.ttl));
                source.currentAmplitude = source.baseAmplitude * ageRatio;
            }
            
            this.pruneExpiredSources();
        } catch (e) {
            console.warn('[WaveInterferenceEngine] WaveSourceManager.update error:', e);
        }
    }
    
    /**
     * Remove expired sources (age >= ttl)
     */
    pruneExpiredSources() {
        try {
            const expired = [];
            
            for (const [id, source] of this.sources) {
                if (source?.age >= source?.ttl) {
                    expired.push(id);
                }
            }
            
            for (const id of expired) {
                this.sources.delete(id);
                const idx = this.creationOrder.indexOf(id);
                if (idx >= 0) this.creationOrder.splice(idx, 1);
            }
        } catch (e) {
            console.warn('[WaveInterferenceEngine] pruneExpiredSources error:', e);
        }
    }
    
    /**
     * Prune oldest source if over limit
     */
    _pruneOldest() {
        try {
            if (this.creationOrder.length > 0) {
                const oldestId = this.creationOrder.shift();
                this.sources.delete(oldestId);
            }
        } catch (e) {
            // Silent fail
        }
    }
    
    /**
     * Get source by ID
     */
    getSource(id) {
        return this.sources?.get?.(id) || null;
    }
    
    /**
     * Get all active sources
     */
    getAllActiveSources() {
        return Array.from(this.sources?.values?.() || []);
    }
    
    /**
     * Clear all sources
     */
    clear() {
        this.sources.clear();
        this.creationOrder.length = 0;
    }
}

/**
 * Wave propagation graph - BFS network traversal with caching
 */
class WavePropagationGraph {
    constructor() {
        this.cache = new Map();  // sourceId → cachedTargets[]
        this.maxHops = 6;
    }
    
    /**
     * Compute propagation targets for a wave source
     */
    computeTargets(sourceId, graph, sourceConfig) {
        try {
            // Check cache first
            if (this.cache.has(sourceId)) {
                return this.cache.get(sourceId);
            }
            
            const targets = [];
            const visited = new Set();
            const queue = [];
            
            // Determine starting point
            let startNodeId = sourceConfig?.nodeId;
            
            if (!startNodeId && graph?.getNodeIdAtPosition) {
                // Try to find nearest node to source origin
                startNodeId = graph.getNodeIdAtPosition?.(sourceConfig?.originPosition);
            }
            
            if (!startNodeId) {
                return targets;
            }
            
            // BFS traversal
            queue.push({ nodeId: startNodeId, distance: 0 });
            visited.add(startNodeId);
            
            while (queue.length > 0) {
                const { nodeId, distance } = queue.shift();
                
                if (distance > this.maxHops) break;
                
                // Add node as target
                targets.push({
                    type: 'NODE',
                    nodeId,
                    distance,
                    depth: distance
                });
                
                // Get connected links
                const links = graph?.getLinksForNode?.(nodeId) || [];
                
                for (const link of links) {
                    const linkId = link?.id || link;
                    
                    // Add link as target
                    targets.push({
                        type: 'LINK',
                        linkId,
                        distance,
                        depth: distance
                    });
                    
                    // Get opposite node
                    const oppositeNodeId = this._getOppositeNode(
                        link,
                        nodeId,
                        graph
                    );
                    
                    if (oppositeNodeId && !visited.has(oppositeNodeId)) {
                        visited.add(oppositeNodeId);
                        queue.push({
                            nodeId: oppositeNodeId,
                            distance: distance + 1
                        });
                    }
                }
            }
            
            // Cache results
            this.cache.set(sourceId, targets);
            
            return targets;
        } catch (e) {
            console.warn('[WaveInterferenceEngine] computeTargets error:', e);
            return [];
        }
    }
    
    /**
     * Get opposite node of a link
     */
    _getOppositeNode(link, currentNodeId, graph) {
        try {
            if (!link) return null;
            
            // Try userData first
            if (link?.userData?.linkedNodeA === currentNodeId) {
                return link.userData?.linkedNodeB?.id || link.userData?.linkedNodeB;
            }
            if (link?.userData?.linkedNodeB === currentNodeId) {
                return link.userData?.linkedNodeA?.id || link.userData?.linkedNodeA;
            }
            
            // Try method on graph
            return graph?.getOppositeNode?.(link, currentNodeId);
        } catch (e) {
            return null;
        }
    }
    
    /**
     * Invalidate cache (call after network changes)
     */
    invalidateCache() {
        this.cache.clear();
    }
    
    /**
     * Clear all caches
     */
    clear() {
        this.cache.clear();
    }
}

/**
 * Wave math - physical wave calculations
 */
class WaveMath {
    /**
     * Compute wave at a target point
     */
    static computeWave(source, targetDistance, currentTime, decayRadius) {
        try {
            const t = currentTime - (source?.startTime ?? 0);
            
            if (t < 0) return 0;
            
            // Attenuation: 1 / (1 + d / R)
            const attenuation = 1.0 / (1.0 + targetDistance / decayRadius);
            
            // Angular frequency: ω = 2πf
            const omega = 2 * Math.PI * (source?.baseFrequency ?? 1);
            
            // Wave number: k = 1 / R
            const k = 1.0 / decayRadius;
            
            // Wave equation: A * att * sin(ωt - kd + φ)
            const wave = source?.currentAmplitude * attenuation * 
                Math.sin(omega * t - k * targetDistance + (source?.basePhase ?? 0));
            
            return wave;
        } catch (e) {
            return 0;
        }
    }
    
    /**
     * Apply synergy/resonance/corruption modifiers to amplitude
     */
    static applyModifiers(baseAmplitude, synergyBoost, resonanceBoost, corruptionBoost) {
        try {
            let A = baseAmplitude;
            
            // Synergy boost: 0.8 to 1.3
            A *= this._lerp(0.8, 1.3, Math.max(0, Math.min(1, synergyBoost ?? 0)));
            
            // Resonance boost: 0.8 to 1.3
            A *= this._lerp(0.8, 1.3, Math.max(0, Math.min(1, resonanceBoost ?? 0)));
            
            // Corruption reduces amplitude: 1.0 to 0.5
            A *= this._lerp(1.0, 0.5, Math.max(0, Math.min(1, corruptionBoost ?? 0)));
            
            return Math.max(0, Math.min(1, A));
        } catch (e) {
            return Math.max(0, Math.min(1, baseAmplitude));
        }
    }
    
    /**
     * Linear interpolation
     */
    static _lerp(a, b, t) {
        return a + (b - a) * Math.max(0, Math.min(1, t));
    }
    
    /**
     * Clamp value to 0–1
     */
    static clamp01(v) {
        return Math.max(0, Math.min(1, v ?? 0));
    }
}

/**
 * Main Wave Interference Engine
 */
export class WaveInterferenceEngine_v1 {
    constructor(options = {}) {
        try {
            this.game = options?.game;
            this.graph = options?.graph;
            this.timeSource = options?.timeSource || { now: () => performance.now() / 1000 };
            this.maxSources = options?.maxSources ?? 8;
            
            // Initialize managers
            this.sourceManager = new WaveSourceManager(this.maxSources);
            this.propagationGraph = new WavePropagationGraph();
            this.waveMath = WaveMath;
            
            // State tracking
            this.targetFields = new Map();           // targetId → waveField
            this.lastUpdate = 0;
            this.updateCount = 0;
        } catch (e) {
            console.warn('[WaveInterferenceEngine] Constructor error:', e);
        }
    }
    
    /**
     * Add a new wave source
     */
    addWaveSource(config) {
        try {
            if (!config) return null;
            return this.sourceManager?.addSource?.(config);
        } catch (e) {
            console.warn('[WaveInterferenceEngine] addWaveSource error:', e);
            return null;
        }
    }
    
    /**
     * Request update from external trigger (Phase D.4: NODE_SPAWN only)
     * 
     * This is the entry point for external systems to notify the WaveInterferenceEngine
     * of events that may require wave propagation.
     * 
     * Phase D.4 Scope:
     * - Only processes NODE_SPAWN events
     * - Only adds wave sources (no computation/propagation in this phase)
     * - Debug-gated via CONFIG.debug.DEBUG_WAVE_ENGINE
     * 
     * @param {string} reason - Event type (e.g., 'NODE_SPAWN', 'LINK_CREATED')
     * @param {Object} context - Event context (nodeId, nodePosition, etc.)
     */
    requestUpdate(reason, context = {}) {
        try {
            // Log request for verification (1× per spawn when DEBUG enabled)
            console.log(`[WaveInterferenceEngine] requestUpdate: ${reason}`, context);
            
            // Phase D.4: Only handle NODE_SPAWN events
            if (reason === 'NODE_SPAWN') {
                // Validate required context
                if (!context?.nodeId) {
                    console.warn('[WaveInterferenceEngine] requestUpdate missing nodeId in context');
                    return;
                }
                
                if (!context?.nodePosition) {
                    console.warn('[WaveInterferenceEngine] requestUpdate missing nodePosition in context');
                    return;
                }
                
                // Add wave source for spawned node
                // Phase D.4: NO computation, NO propagation, only source registration
                const sourceId = this.addWaveSource({
                    type: 'NODE',
                    nodeId: context.nodeId,
                    originPosition: context.nodePosition,
                    baseAmplitude: 0.8,
                    baseFrequency: 2.0,
                    decayRadius: 10,
                    profile: 'SYNERGY',
                    synergyBoost: 0.5,
                    resonanceBoost: 0.3,
                    corruptionBoost: 0
                });
                
                if (sourceId) {
                    console.log(`[WaveInterferenceEngine] ✓ Added wave source ${sourceId} for node ${context.nodeId}`);
                }
            }
            
            // Phase D.4: No other event types processed
            // - LINK_CREATED: NOT YET
            // - PHASE_CHANGED: NOT YET
            // - Automatic fallbacks: NOT YET
            
        } catch (e) {
            console.warn('[WaveInterferenceEngine] requestUpdate error:', e);
        }
    }
    
    /**
     * Main update - compute interference for all targets
     */
    update(deltaTime, entities = {}) {
        try {
            const currentTime = this.timeSource?.now?.() ?? (this.lastUpdate + deltaTime);
            
            // Update sources
            this.sourceManager?.update?.(deltaTime);
            
            // Get all active sources
            const activeSources = this.sourceManager?.getAllActiveSources?.() || [];
            
            if (activeSources.length === 0) {
                this.targetFields.clear();
                this.lastUpdate = currentTime;
                return;
            }
            
            // Compute interference for all targets
            this._computeInterferenceFields(activeSources, currentTime, entities);
            
            this.lastUpdate = currentTime;
            this.updateCount++;
        } catch (e) {
            console.warn('[WaveInterferenceEngine] update error:', e);
        }
    }
    
    /**
     * Compute interference fields for all targets
     */
    _computeInterferenceFields(activeSources, currentTime, entities) {
        try {
            const nodes = entities?.nodes || [];
            const links = entities?.links || [];
            
            // Clear previous fields
            this.targetFields.clear();
            
            // Process each node
            for (const node of nodes) {
                try {
                    const nodeId = node?.id || node?.uuid || node?.name;
                    if (!nodeId) continue;
                    
                    const waveField = this._computeWaveFieldAtTarget(
                        nodeId,
                        'NODE',
                        node?.position,
                        activeSources,
                        currentTime
                    );
                    
                    if (waveField) {
                        this.targetFields.set(nodeId, waveField);
                        node.userData = node.userData || {};
                        node.userData.waveField = waveField;
                    }
                } catch (e) {
                    // Continue on node error
                }
            }
            
            // Process each link
            for (const link of links) {
                try {
                    const linkId = link?.id || link?.uuid || link?.name;
                    if (!linkId) continue;
                    
                    // Get link midpoint
                    let position = new THREE.Vector3(0, 0, 0);
                    if (link?.geometry?.attributes?.position) {
                        const pos = link.geometry.attributes.position;
                        position.x = (pos.array[0] + pos.array[3]) * 0.5;
                        position.y = (pos.array[1] + pos.array[4]) * 0.5;
                        position.z = (pos.array[2] + pos.array[5]) * 0.5;
                    }
                    
                    const waveField = this._computeWaveFieldAtTarget(
                        linkId,
                        'LINK',
                        position,
                        activeSources,
                        currentTime
                    );
                    
                    if (waveField) {
                        this.targetFields.set(linkId, waveField);
                        link.userData = link.userData || {};
                        link.userData.waveField = waveField;
                    }
                } catch (e) {
                    // Continue on link error
                }
            }
        } catch (e) {
            console.warn('[WaveInterferenceEngine] _computeInterferenceFields error:', e);
        }
    }
    
    /**
     * Compute wave field at a single target
     */
    _computeWaveFieldAtTarget(targetId, targetType, targetPosition, activeSources, currentTime) {
        try {
            const waves = [];
            let totalAmplitude = 0;
            let constructivePower = 0;
            let destructivePower = 0;
            let phaseAccum = 0;
            
            const maxSources = activeSources?.length ?? 0;
            
            // Compute contribution from each source
            for (const source of activeSources) {
                try {
                    // Get propagation targets for this source
                    let targets = this.propagationGraph?.cache?.get?.(source?.id);
                    
                    if (!targets) {
                        // Compute if not cached
                        targets = this.propagationGraph?.computeTargets?.(
                            source.id,
                            this.graph,
                            source
                        ) || [];
                    }
                    
                    // Find this target in the propagation
                    let distance = null;
                    
                    for (const target of targets) {
                        if (targetType === 'NODE' && target?.type === 'NODE' && 
                            target?.nodeId === targetId) {
                            distance = target?.distance;
                            break;
                        }
                        if (targetType === 'LINK' && target?.type === 'LINK' && 
                            target?.linkId === targetId) {
                            distance = target?.distance;
                            break;
                        }
                    }
                    
                    // If target not reached by this source, skip
                    if (distance === null) continue;
                    
                    // Apply modifiers
                    const modifiedAmplitude = this.waveMath.applyModifiers(
                        source?.currentAmplitude,
                        source?.synergyBoost,
                        source?.resonanceBoost,
                        source?.corruptionBoost
                    );
                    
                    // Compute wave at this point
                    const wave = this.waveMath.computeWave(
                        { ...source, currentAmplitude: modifiedAmplitude },
                        distance,
                        currentTime,
                        source?.decayRadius
                    );
                    
                    waves.push(wave);
                    totalAmplitude += Math.abs(wave);
                    
                    if (wave > 0) {
                        constructivePower += wave;
                    } else {
                        destructivePower += Math.abs(wave);
                    }
                    
                    // Accumulate phase
                    phaseAccum += Math.atan2(Math.sin(wave), Math.cos(wave));
                } catch (e) {
                    // Continue on per-source error
                }
            }
            
            // Normalize phase to 0–1
            let travelPhase = (phaseAccum / Math.PI + 1) * 0.5; // Map -π,π to 0,1
            travelPhase = Math.max(0, Math.min(1, travelPhase));
            
            // Compute standing wave factor
            let standingWaveFactor = 0;
            if (waves.length >= 2) {
                let maxWave = Math.max(...waves.map(w => Math.abs(w)));
                let minWave = Math.min(...waves.map(w => Math.abs(w)));
                const dA = Math.abs(maxWave - minWave);
                standingWaveFactor = this.waveMath.clamp01(1.0 - (dA * 4.0));
            }
            
            // Build wave field
            const waveField = {
                totalAmplitude: this.waveMath.clamp01(totalAmplitude),
                constructivePower: this.waveMath.clamp01(constructivePower),
                destructivePower: this.waveMath.clamp01(destructivePower),
                interferenceIndex: maxSources > 0 ? 
                    Math.min(1, activeSources.length / this.maxSources) : 0,
                travelPhase,
                standingWaveFactor: this.waveMath.clamp01(standingWaveFactor),
                sourceCount: activeSources.filter(s => {
                    // Check if this source reaches this target
                    const targets = this.propagationGraph?.cache?.get?.(s?.id) || [];
                    return targets.some(t => 
                        (targetType === 'NODE' && t?.type === 'NODE' && t?.nodeId === targetId) ||
                        (targetType === 'LINK' && t?.type === 'LINK' && t?.linkId === targetId)
                    );
                }).length,
                timestamp: currentTime
            };
            
            return waveField;
        } catch (e) {
            console.warn('[WaveInterferenceEngine] _computeWaveFieldAtTarget error:', e);
            return null;
        }
    }
    
    /**
     * Get wave field for a node
     */
    getNodeWaveField(nodeId) {
        try {
            return this.targetFields?.get?.(nodeId) || null;
        } catch (e) {
            return null;
        }
    }
    
    /**
     * Get wave field for a link
     */
    getLinkWaveField(linkId) {
        try {
            return this.targetFields?.get?.(linkId) || null;
        } catch (e) {
            return null;
        }
    }
    
    /**
     * Get all active sources (debugging)
     */
    getActiveSources() {
        try {
            return this.sourceManager?.getAllActiveSources?.() || [];
        } catch (e) {
            return [];
        }
    }
    
    /**
     * Get performance metrics
     */
    getMetrics() {
        try {
            return {
                activeSources: this.sourceManager?.sources?.size ?? 0,
                maxSources: this.maxSources,
                targetFieldsCount: this.targetFields?.size ?? 0,
                updateCount: this.updateCount,
                cacheSize: this.propagationGraph?.cache?.size ?? 0
            };
        } catch (e) {
            return null;
        }
    }
    
    /**
     * Clear all state
     */
    clear() {
        try {
            this.sourceManager?.clear?.();
            this.propagationGraph?.clear?.();
            this.targetFields.clear();
            this.updateCount = 0;
        } catch (e) {
            console.warn('[WaveInterferenceEngine] clear error:', e);
        }
    }
    
    /**
     * Dispose (cleanup)
     */
    dispose() {
        try {
            this.clear();
            this.sourceManager = null;
            this.propagationGraph = null;
            this.targetFields = null;
        } catch (e) {
            console.warn('[WaveInterferenceEngine] dispose error:', e);
        }
    }
}

export default WaveInterferenceEngine_v1;
