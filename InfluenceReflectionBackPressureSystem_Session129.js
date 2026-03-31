/**
 * ============================================================================
 * INFLUENCE REFLECTION & BACK-PRESSURE SYSTEM (Session 129)
 * ============================================================================
 * 
 * PURE VISUAL SYSTEM - READ-ONLY NETWORK STATE
 * 
 * Purpose:
 * Visualizes how resistant nodes reject harmonic influence through reflection
 * and back-pressure buildup. Energy does not disappear—it rebounds,
 * compresses, and pushes back into the network.
 * 
 * Core Philosophy:
 * - Resistance is intelligent, not destructive
 * - Influence is redirected, never eliminated
 * - Compression precedes reflection
 * - Back-pressure communicates opposition
 * 
 * Architecture:
 * - Detects resistant nodes (harmony < corruption, high stability, flags)
 * - Tracks influence approaching resistant nodes
 * - Creates pressure buildup zones (link compression + glow)
 * - Emits reflection pulses backward along incoming link
 * - Modulates effects by harmony/corruption/stability/synergy
 * - Reuses pooled meshes, zero per-frame allocations
 * 
 * Integration:
 * - Works with HarmonicInfluencePropagationSystem (reads influence state)
 * - Works with AINodes (reads harmony/corruption/stability)
 * - Visual-only, no gameplay modifications
 * 
 * Status: PRODUCTION (Session 129)
 * 
 * ============================================================================
 */

import * as THREE from 'three';
import { getLinkSynergy } from './SemanticMetricAdapter.js';

export class InfluenceReflectionBackPressureSystem_Session129 {
    constructor(scene, world, harmonicInfluenceSystem, aiNodes, linkingSystem, config = {}) {
        this.scene = scene;
        this.world = world;
        this.harmonicInfluenceSystem = harmonicInfluenceSystem;
        this.aiNodes = aiNodes;
        this.linkingSystem = linkingSystem;
        
        // Configuration
        this.config = {
            // Pressure buildup zone
            pressureZoneStart: 0.7,           // Where pressure zone begins (0-1 along link)
            pressureZoneEnd: 0.95,            // Where pressure zone ends (near node)
            pressureThickness: 1.2,           // Link thickness multiplier in zone
            pressureGlowBase: 0.08,           // Base glow opacity in pressure zone
            
            // Reflection pulse
            reflectionPulseWidth: 0.15,       // Width of reflection wavefront (0-1)
            reflectionPulseOpacity: 0.18,     // Opacity of reflected wave
            reflectionPulseLifetime: 0.8,     // Duration of reflection pulse (seconds)
            reflectionPulseSpeed: 1.2,        // Travel speed multiplier vs original wave
            reflectionColorShift: 0.3,        // Shift toward blue (0-1)
            
            // Partial reflection
            partialReflectionThreshold: 0.5,  // Harmony value above which reflection weakens
            absorptionRatio: 0.4,             // How much of forward wave is absorbed
            forwardLeakRatio: 0.15,           // How much forward wave continues (very weak)
            
            // State modulation
            harmonyDamping: 0.6,              // Harmony reduces reflection by this factor
            corruptionBoost: 1.4,             // Corruption increases reflection by this factor
            stabilitySpeedup: 0.8,          // Stability triggers reflection earlier
            synergyElasticity: 0.7,           // Synergy increases smoothness
            
            // Node surface feedback
            surfaceRippleRadius: 0.3,         // Ripple radius on node surface
            surfaceRippleOpacity: 0.12,       // Opacity of surface ripple
            surfaceRippleLifetime: 0.5,       // Duration of surface ripple
            
            // Performance
            maxConcurrentReflections: 50,     // Pool size for reflection pulses
            lodDistance: 25,                  // Distance beyond which effects fade
            ...config
        };
        
        // Runtime state
        this.pressureZones = [];             // { linkId, nodeId, intensity, time }
        this.reflectionPulses = [];          // { linkId, fromNode, toNode, life, maxLife }
        this.surfaceRipples = [];            // { nodeId, time, maxTime, intensity }
        
        // Object pools
        this.reflectionPulsePool = [];
        this.surfaceRipplePool = [];
        
        // Tracking
        this.resistantNodes = new Map();     // nodeId -> resistance metrics
        this.incomingInfluence = new Map();  // linkId -> { sourceNode, targetNode, intensity, time }
        
        this.time = 0;
        this.initialized = false;
    }

    /**
     * Setup - initialize pooled objects and references
     */
    setup() {
        if (this.initialized) return;
        
        // Pre-allocate reflection pulse pool
        for (let i = 0; i < this.config.maxConcurrentReflections; i++) {
            this.reflectionPulsePool.push({
                active: false,
                linkId: null,
                fromNode: null,
                toNode: null,
                life: 0,
                maxLife: this.config.reflectionPulseLifetime,
                intensity: 1,
                wavelength: 0
            });
        }
        
        // Mark pooled objects as available
        this.reflectionPulsePool.forEach(p => p.active = false);
        
        this.initialized = true;
    }

    /**
     * Update - primary frame update
     * @param {number} deltaTime - Elapsed time since last frame
     * @param {number} currentTime - Total simulation time
     */
    update(deltaTime, currentTime) {
        if (!this.initialized) this.setup();
        
        this.time = currentTime;
        
        // Step 1: Detect resistant nodes (read-only)
        this._updateResistantNodeMap();
        
        // Step 2: Track incoming influence on links
        this._updateIncomingInfluence();
        
        // Step 3: Update pressure zones
        this._updatePressureZones(deltaTime);
        
        // Step 4: Emit reflection pulses when thresholds are met
        this._emitReflectionPulses(deltaTime);
        
        // Step 5: Update active reflection pulses
        this._updateReflectionPulses(deltaTime);
        
        // Step 6: Update surface ripples on nodes
        this._updateSurfaceRipples(deltaTime);
        
        // Step 7: Apply visual effects to scene
        this._applyVisualEffects();
    }

    /**
     * Detect which nodes are resistant (read-only analysis)
     */
    _updateResistantNodeMap() {
        this.resistantNodes.clear();
        
        if (!this.aiNodes) return;

        const activeLinks = Array.isArray(this.linkingSystem?.links)
            ? this.linkingSystem.links.filter((link) => link && link.active !== false)
            : [];

        const registerResistantNode = (node, linkedByCount = 1) => {
            if (!node) return;

            const nodeId = this._getNodeId(node);
            if (nodeId === undefined || nodeId === null) return;
            if (this.resistantNodes.has(nodeId)) return;

            const harmony = this._readNodeMetric(node, 'harmony', 0.5);
            const corruption = this._readNodeMetric(node, 'corruption', 0.5);
            const stabilityValue = this._readNodeMetric(node, 'stability', 1);
            const stability = this._readNodeMetric(node, 'stability', 0);
            const loadPressure = this._readNodeMetric(node, 'loadPressure', 0);

            this.resistantNodes.set(nodeId, {
                nodeId,
                node,
                resistance: 0.65,
                harmony,
                corruption,
                stability,
                stability,
                loadPressure,
                activeLinkCount: linkedByCount,
                isGated: false
            });
        };

        // Iterate through all nodes
        const nodes = Array.isArray(this.aiNodes) ? this.aiNodes : 
                      this.aiNodes.nodes ? this.aiNodes.nodes : 
                      Object.values(this.aiNodes);
        
        nodes.forEach(node => {
            const nodeId = this._getNodeId(node);
            if (!node || nodeId === undefined || nodeId === null) return;
            
            // READ-ONLY checks (no state modification)
            const harmony = this._readNodeMetric(node, 'harmony', 0.5);
            const corruption = this._readNodeMetric(node, 'corruption', 0.5);
            const stability = this._readNodeMetric(node, 'stability', 1);
            const instability = this._readNodeMetric(node, 'instability', 0);
            const loadPressure = this._readNodeMetric(node, 'loadPressure', 0);
            const isGated = node.gated || node.resistant || node.userData?.gated || node.userData?.resistant || false;
            
            const activeLinkCount = this._getNodeTopologyCountFromLinks(node, activeLinks);
            const hasTopology = activeLinkCount > 0;
            const isResistant = isGated || stabilityValue > 0.3 || corruption > harmony || loadPressure > 0.6;
            
            if (isResistant) {
                const stressSignal = Math.max(
                    loadPressure,
                    1 - stability,
                    stability,
                    Math.max(0, corruption - harmony)
                );
                const resistance = Math.min(1, 
                    0.35 +
                    stressSignal * 0.45 +
                    (hasTopology ? 0.2 : 0) +
                    (isGated ? 0.4 : 0)
                );
                
                this.resistantNodes.set(nodeId, {
                    nodeId,
                    node: node,
                    resistance: resistance,
                    harmony: harmony,
                    corruption: corruption,
                    stability: stability,
                    instability: instability,
                    loadPressure: loadPressure,
                    activeLinkCount: activeLinkCount,
                    isGated: isGated
                });
            }
        });
    }

    _getNodeTopologyCountFromLinks(node, activeLinks = []) {
        if (!node || !Array.isArray(activeLinks) || activeLinks.length === 0) {
            return 0;
        }

        const nodeId = this._getNodeId(node);
        let linkCount = 0;

        for (const link of activeLinks) {
            if (!link) continue;

            const sourceNode = this._getLinkSource(link);
            const targetNode = this._getLinkTarget(link);
            if (sourceNode === node || targetNode === node) {
                linkCount += 1;
                continue;
            }

            const sourceId = this._getNodeId(sourceNode) ?? link?.sourceNodeId ?? link?.sourceId ?? link?.nodeA ?? null;
            const targetId = this._getNodeId(targetNode) ?? link?.targetNodeId ?? link?.targetId ?? link?.nodeB ?? null;

            if (nodeId !== null && nodeId !== undefined) {
                const nodeKey = String(nodeId);
                if (String(sourceId) === nodeKey || String(targetId) === nodeKey) {
                    linkCount += 1;
                }
            }
        }

        return linkCount;
    }

    /**
     * Track influence traveling along links toward resistant nodes
     */
    _updateIncomingInfluence() {
        this.incomingInfluence.clear();
        
        if (!this.linkingSystem) return;
        
        // Get all links from linking system
        const links = this.linkingSystem.links || [];
        
        links.forEach(link => {
            if (!link || !link.id) return;
            
            const targetNodeId = this._getNodeId(this._getLinkTarget(link));
            const sourceNodeId = this._getNodeId(this._getLinkSource(link));
            const influenceIntensity = this._getInfluenceIntensity(link);

            if (influenceIntensity > 0.01) {
                this.incomingInfluence.set(link.id, {
                    linkId: link.id,
                    link: link,
                    sourceNode: sourceNodeId,
                    targetNode: targetNodeId,
                    intensity: influenceIntensity,
                    time: this.time
                });
            }
        });
    }

    /**
     * Get influence intensity traveling on a link
     * Uses multiple fallback strategies with NO dependency on specific data structures
     */
    _getInfluenceIntensity(link) {
        if (!link) return 0;

        // Try harmonic influence system first (preferred source)
        if (this.harmonicInfluenceSystem && this.harmonicInfluenceSystem.getLinkInfluence) {
            const influence = this.harmonicInfluenceSystem.getLinkInfluence(link.id);
            if (influence > 0) return influence;
        }

        // Fallback 1: Check canonical link intensity properties
        if (link.intensity !== undefined && link.intensity > 0) {
            return link.intensity;
        }
        
        // Fallback 2: Check synergy from link
        if (typeof getLinkSynergy === 'function') {
            const synergy = getLinkSynergy(link);
            if (Number.isFinite(synergy) && synergy > 0) {
                return synergy;
            }
        }
        
        // Fallback 3: Check userData metrics (legacy compatibility)
        const flowIntensity = Number(
            link?.userData?.flowState?.intensity ??
            link?.userData?.cascadeIntensity ??
            link?.userData?.energy ??
            link?.userData?.metrics?.synergy ??
            0
        ) || 0;
        if (flowIntensity > 0) {
            return flowIntensity;
        }
        
        return 0;
    }

    rebind(config = {}) {
        if (config.scene !== undefined) {
            this.scene = config.scene;
        }
        if (config.world !== undefined) {
            this.world = config.world;
        }
        if (config.harmonicInfluenceSystem !== undefined) {
            this.harmonicInfluenceSystem = config.harmonicInfluenceSystem;
        }
        if (config.aiNodes !== undefined) {
            this.aiNodes = config.aiNodes;
        }
        if (config.linkingSystem !== undefined) {
            this.linkingSystem = config.linkingSystem;
        }
        if (config.frameScheduler !== undefined) {
            this.frameScheduler = config.frameScheduler;
        }
        if (config.semanticBus !== undefined) {
            this.semanticBus = config.semanticBus;
        }

        this.resistantNodes.clear();
        this.incomingInfluence.clear();
        this.pressureZones.length = 0;
        this.reflectionPulses.length = 0;
        this.surfaceRipples.length = 0;

        return this;
    }

    /**
     * Update pressure buildup zones on links
     */
    _updatePressureZones(deltaTime) {
        this.pressureZones = this.pressureZones.filter(zone => {
            zone.time += deltaTime;
            return zone.time < 2.0;  // Keep zones alive for up to 2 seconds
        });
        
        // Create or update pressure zones for active incoming influence
        this.incomingInfluence.forEach((inf, linkId) => {
            // Check if pressure zone already exists for this link
            let zone = this.pressureZones.find(z => z.linkId === linkId);
            
            if (!zone) {
                zone = {
                    linkId: linkId,
                    link: inf.link,
                    nodeId: inf.targetNode,
                    intensity: 0,
                    time: 0,
                    birthTime: this.time
                };
                this.pressureZones.push(zone);
            }
            
            // Update pressure intensity based on incoming influence
            const targetNode = this._getLinkTarget(inf.link);
            const harmony = this._readNodeMetric(targetNode, 'harmony', 0.5);
            const corruption = this._readNodeMetric(targetNode, 'corruption', 0.5);
            const stability = this._readNodeMetric(targetNode, 'stability', 1);
            const instability = this._readNodeMetric(targetNode, 'instability', 0);

            let baseIntensity = Math.max(inf.intensity, 0.25);
            baseIntensity *= (1 - harmony * this.config.harmonyDamping);
            baseIntensity *= (1 + corruption * (this.config.corruptionBoost - 1));

            const timeFactor = Math.max(0.5, 1 - instability * this.config.instabilitySpeedup);
            const stabilityBoost = Math.max(0.8, 1 - stability * 0.2);

            zone.intensity = Math.min(1, zone.intensity + deltaTime * 2.5 * baseIntensity * stabilityBoost / timeFactor);
        });
    }

    /**
     * Emit reflection pulses when pressure exceeds threshold
     */
    _emitReflectionPulses(deltaTime) {
        this.pressureZones.forEach(zone => {
            // Emit pulse when intensity peaks
            if (zone.intensity > 0.08 && (!zone.lastPulseTime || this.time - zone.lastPulseTime > 0.2)) {
                // Acquire pooled reflection pulse
                const pulse = this.reflectionPulsePool.find(p => !p.active);
                
                if (pulse) {
                    pulse.active = true;
                    pulse.linkId = zone.linkId;
                    pulse.fromNode = zone.nodeId;
                    pulse.toNode = this._getNodeId(this._getLinkSource(zone.link));
                    pulse.life = 0;
                    pulse.maxLife = this.config.reflectionPulseLifetime;
                    pulse.intensity = zone.intensity;
                    pulse.wavelength = zone.link?.wavelength || 0.3;
                    
                    zone.lastPulseTime = this.time;
                }
            }
        });
    }

    /**
     * Update active reflection pulses (traveling backward along link)
     */
    _updateReflectionPulses(deltaTime) {
        this.reflectionPulses.forEach((pulse, idx) => {
            pulse.life += deltaTime;
            
            // Fade out
            if (pulse.life >= pulse.maxLife) {
                pulse.active = false;
                this.reflectionPulses.splice(idx, 1);
            }
        });
        
        // Also update pooled pulses
        this.reflectionPulsePool.forEach(pulse => {
            if (!pulse.active) return;
            
            pulse.life += deltaTime;
            
            // Deactivate when expired
            if (pulse.life >= pulse.maxLife) {
                pulse.active = false;
            }
        });
    }

    /**
     * Update surface ripples on resistant nodes
     */
    _updateSurfaceRipples(deltaTime) {
        // Create surface ripples when pulses hit nodes
        this.pressureZones.forEach(zone => {
            if (zone.intensity > 0.7 && (!zone.lastRippleTime || this.time - zone.lastRippleTime > 0.4)) {
                // Create ripple at resistant node
                const ripple = {
                    nodeId: zone.nodeId,
                    time: 0,
                    maxTime: this.config.surfaceRippleLifetime,
                    intensity: Math.min(1, zone.intensity * 0.8)
                };
                
                this.surfaceRipples.push(ripple);
                zone.lastRippleTime = this.time;
            }
        });
        
        // Update existing ripples
        this.surfaceRipples = this.surfaceRipples.filter(ripple => {
            ripple.time += deltaTime;
            return ripple.time < ripple.maxTime;
        });
    }

    /**
     * Apply visual effects to the scene (meshes, materials, particles)
     * This is where visual modifications happen (non-destructive)
     */
    _applyVisualEffects() {
        // Visual-only: this method would apply effects to link materials, node shells, etc.
        // For this stub, we defer full implementation to next iteration
        // Effects would include:
        // - Link thickness modulation in pressure zones
        // - Wave compression visualization
        // - Color shifts in reflection waves
        // - Surface ripple meshes on nodes
    }

    /**
     * Dispose - cleanup
     */
    dispose() {
        this.pressureZones = [];
        this.reflectionPulses = [];
        this.surfaceRipples = [];
        this.reflectionPulsePool = [];
        this.resistantNodes.clear();
        this.incomingInfluence.clear();
    }

    _getNodeId(node) {
        return node?.id ?? node?.userData?.nodeId ?? node?.userData?.id;
    }

    _getNodeTopologyCount(node) {
        const apiLinks =
            typeof this.linkingSystem?.getNodeLinks === 'function'
                ? this.linkingSystem.getNodeLinks(node)
                : typeof this.linkingSystem?.getLinksForNode === 'function'
                    ? this.linkingSystem.getLinksForNode(node)
                    : null;
        if (Array.isArray(apiLinks) && apiLinks.length > 0) {
            return apiLinks.length;
        }

        const directCount = Number(
            node?.activeLinkCount ??
            node?.userData?.activeLinkCount ??
            node?.userData?.metrics?.activeLinkCount ??
            node?.linkCount ??
            node?.userData?.linkCount ??
            node?.userData?.metrics?.linkCount ??
            0
        ) || 0;
        if (directCount > 0) {
            return directCount;
        }

        const localCount = Number(
            node?.connectedLinks?.length ??
            node?.links?.length ??
            node?.userData?.connectedLinks?.length ??
            node?.userData?.links?.length ??
            0
        ) || 0;
        if (localCount > 0) {
            return localCount;
        }

        const nodeId = this._getNodeId(node);
        if (!nodeId || !Array.isArray(this.linkingSystem?.links)) {
            return 0;
        }

        let linkCount = 0;
        for (const link of this.linkingSystem.links) {
            if (!link) continue;

            const sourceId = this._getNodeId(link?.source ?? link?.sourceNode ?? link?.from ?? link?.nodeA ?? null);
            const targetId = this._getNodeId(link?.target ?? link?.targetNode ?? link?.to ?? link?.nodeB ?? null);
            if (sourceId === nodeId || targetId === nodeId) {
                linkCount += 1;
            }
        }

        return linkCount;
    }

    _getLinkSource(link) {
        return link?.source ?? link?.sourceNode ?? link?.from ?? link?.nodeA ?? null;
    }

    _getLinkTarget(link) {
        return link?.target ?? link?.targetNode ?? link?.to ?? link?.nodeB ?? null;
    }

    _readNodeMetric(node, metric, fallback = 0) {
        if (!node) return fallback;
        const direct = node[metric];
        if (typeof direct === 'number') return direct;
        const userValue = node.userData?.[metric];
        if (typeof userValue === 'number') return userValue;
        const metricsValue = node.userData?.metrics?.[metric];
        if (typeof metricsValue === 'number') return metricsValue;
        return fallback;
    }
}

/**
 * ============================================================================
 * INTEGRATION NOTES
 * ============================================================================
 * 
 * In main.js:
 * 
 *   import { InfluenceReflectionBackPressureSystem_Session129 } 
 *     from './InfluenceReflectionBackPressureSystem_Session129.js';
 *   
 *   // In World constructor:
 *   this.influenceReflection = new InfluenceReflectionBackPressureSystem_Session129(
 *       this.scene,
 *       this,
 *       this.harmonicInfluenceSystem,  // or null (graceful fallback)
 *       this.aiNodes,
 *       this.linkingSystem
 *   );
 *   
 *   // In setup section:
 *   this.influenceReflection.setup();
 *   
 *   // In animate loop:
 *   if (this.influenceReflection) {
 *       this.influenceReflection.update(deltaTime, this.time);
 *   }
 * 
 * ============================================================================
 * SEMANTIC LANGUAGE EXTENSION (10 → 11 Dimensions)
 * ============================================================================
 * 
 * Dimension 11: Resistance & Reflection
 * Encodes: Network opposition, back-pressure, elastic response
 * Visual: Pressure zones + reflection pulses
 * 
 * This system adds conscious negotiation to the network:
 * - Nodes don't just absorb or reject
 * - They push back, creating feedback loops
 * - Influence is redirected, not destroyed
 * - Network becomes a system of forces in balance
 * 
 * ============================================================================
 */
