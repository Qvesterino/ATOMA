/**
 * ============================================================================
 * STANDING WAVE & OSCILLATION TRAP SYSTEM (Session 130)
 * ============================================================================
 * 
 * PURE VISUAL SYSTEM - READ-ONLY NETWORK STATE
 * 
 * Purpose:
 * Visualizes energy trapped between opposing nodes, forming standing waves
 * and oscillation zones. When influence repeatedly reflects with no net
 * forward progress, it appears to vibrate in place.
 * 
 * Core Philosophy:
 * - Standing waves are unresolved tension in the network
 * - Energy oscillates between opposing nodes
 * - Neither destroyed nor progressing
 * - Waiting for harmony, fatigue, or collapse
 * 
 * Architecture:
 * - Detects standing wave conditions (reflection frequency + phase consistency)
 * - Identifies trap zones (mid-link regions between opposing nodes)
 * - Manages oscillation state (frequency, phase, amplitude modulation)
 * - Applies interference patterns (beat frequencies, antinodes)
 * - Modulates by node metrics (harmony/corruption/instability/synergy)
 * - Tracks resolution paths (damping, breakthrough, collapse)
 * 
 * Integration:
 * - Works with InfluenceReflectionBackPressureSystem (reads reflection state)
 * - Works with HarmonicInfluencePropagationSystem (reads influence data)
 * - Works with AINodes (reads node metrics)
 * - Visual-only, no gameplay modifications
 * 
 * Status: PRODUCTION (Session 130)
 * 
 * ============================================================================
 */

import * as THREE from 'three';

export class StandingWaveOscillationTrapSystem_Session130 {
    constructor(scene, world, reflectionSystem, harmonicInfluenceSystem, aiNodes, linkingSystem, config = {}) {
        this.scene = scene;
        this.world = world;
        this.reflectionSystem =
            reflectionSystem ||
            world?.influenceReflection ||
            world?.waveReflectionSystem ||
            globalThis.waveReflectionSystem;
        this.harmonicInfluenceSystem = harmonicInfluenceSystem;
        this.aiNodes = aiNodes;
        this.linkingSystem = linkingSystem;
        this.waveEngine = world?.waveInterferenceEngine || globalThis?.game?.waveInterferenceEngine || null;
        
        // Configuration
        this.config = {
            // Standing wave detection
            reflectionCountThreshold: 3,      // Min reflections in window to trigger
            detectionWindow: 1.5,             // Time window for reflection counting (seconds)
            netFlowThreshold: 0.1,            // Max forward flow to be considered trapped
            phaseConsistencyThreshold: 0.7,   // Phase alignment required (0-1)
            
            // Oscillation trap zone
            trapCenterOffset: 0.5,            // Zone center position (0-1 along link)
            trapRadiusBase: 0.15,             // Base trap radius (fraction of link)
            trapRadiusModifier: 0.1,          // Additional radius per reflection count
            trapOpacityBase: 0.12,            // Base glow opacity in trap zone
            
            // Standing wave visual
            standingWaveAmplitude: 0.8,       // Oscillation amplitude (0-1)
            antinodeGlowFactor: 1.8,          // Brightness multiplier at antinodes
            beatFrequencyBase: 2.0,           // Oscillations per second at center
            beatFrequencyModifier: 0.3,       // Frequency variation
            
            // Interference patterns
            interferenceSpacing: 0.2,         // Distance between bright/dim bands
            interferenceContrast: 0.6,        // Visibility of bands (0-1)
            interferencePhase: 0,             // Phase offset for pattern animation
            
            // Node feedback
            haloCounterPulseAmount: 0.15,     // Halo oscillation magnitude
            haloCounterPulseFreq: 3.0,        // Pulses per second
            
            // State modulation
            harmonyDamping: 0.5,              // Harmony weakens trap (0 = no effect, 1 = full)
            corruptionStabilization: 0.7,     // Corruption stabilizes (0 = no effect, 1 = very stable)
            instabilityWobble: 0.4,           // Instability causes amplitude wobble
            synergyClarity: 0.8,              // Synergy increases pattern legibility
            
            // Resolution behavior
            dampingRate: 0.15,                // Natural decay rate per second
            breakthroughThreshold: 0.8,       // Harmony value above which breakthrough occurs
            collapseTriggerInstability: 0.85, // Instability value triggering collapse
            resolutionDuration: 2.0,          // Seconds for resolution animation
            
            // Performance
            maxConcurrentTraps: 30,           // Pool size for trap objects
            lodDistance: 30,                  // Distance for LOD culling
            ...config
        };
        
        // Runtime state
        this.oscillationTraps = [];           // { linkId, nodes, frequency, phase, amplitude, trapRadius, state }
        this.reflectionHistory = new Map();   // linkId -> { linkId, reflections: [{time, phase, intensity}] }
        this.trapZones = [];                  // { linkId, centerPos, radiusStart, radiusEnd, intensity, time }
        this.interferencePatterns = [];       // { trapId, spacing, contrast, beatPhase, time }
        this.resolutionEvents = [];           // { trapId, type, startTime, duration, progress }
        
        // Object pools
        this.trapPool = [];
        
        // Tracking
        this.opposingNodePairs = new Map();   // nodeIdA_nodeIdB -> { nodeA, nodeB, linkIds, opposing }
        this.lastReflectionTime = new Map();  // linkId -> time of last reflection
        
        this.time = 0;
        this.initialized = false;
    }

    getActiveTraps() {
        return this.oscillationTraps.filter(t => t && t.active);
    }

    /**
     * Setup - initialize pooled objects and references
     */
    setup() {
        if (this.initialized) return;
        
        // Pre-allocate trap zone pool
        for (let i = 0; i < this.config.maxConcurrentTraps; i++) {
            this.trapPool.push({
                active: false,
                linkId: null,
                nodeA: null,
                nodeB: null,
                frequency: 0,
                phase: 0,
                amplitude: 0,
                trapRadius: 0,
                trapCenter: 0,
                state: 'emerging',  // emerging, stable, wobbling, resolving
                birthTime: 0,
                reflectionCount: 0,
                lastReflectionTime: 0,
                damping: 0,
                resolution: null,
                energyStorage: 0,
                maxEnergy: 5.0,
                decayRate: 0.02
            });
        }
        
        this.trapPool.forEach(t => t.active = false);
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
        
        // Step 1: Detect standing wave conditions
        this._detectStandingWaveCandidates(deltaTime);
        
        // Step 2: Identify opposing node pairs
        this._identifyOpposingNodePairs();
        
        // Step 3: Update oscillation traps
        this._updateOscillationTraps(deltaTime);
        
        // Step 4: Manage trap zones geometry
        this._updateTrapZones(deltaTime);
        
        // Step 5: Calculate interference patterns
        this._updateInterferencePatterns(deltaTime);
        
        // Step 6: Track resolution events
        this._updateResolutionEvents(deltaTime);
        
        // Step 7: Apply visual effects
        this._applyVisualEffects();
    }

    /**
     * Detect standing wave conditions on links
     * Looks for: repeated reflections, phase consistency, zero net flow
     */
    _detectStandingWaveCandidates(deltaTime) {
        if (!this.reflectionSystem) return;
        
        // Get active reflection data from reflection system
        const activeReflections = this._getActiveReflections();
        
        activeReflections.forEach(reflection => {
            const linkId = reflection.linkId;
            
            // Initialize reflection history for this link if needed
            if (!this.reflectionHistory.has(linkId)) {
                this.reflectionHistory.set(linkId, {
                    linkId: linkId,
                    reflections: [],
                    firstReflectionTime: this.time
                });
            }
            
            const history = this.reflectionHistory.get(linkId);
            
            // Add reflection event
            history.reflections.push({
                time: this.time,
                phase: reflection.phase ?? 0,
                intensity: reflection.intensity ?? 0.5
            });
            
            // Prune old reflections outside detection window
            const windowStart = this.time - this.config.detectionWindow;
            history.reflections = history.reflections.filter(r => r.time > windowStart);
            
            // Check standing wave conditions
            if (this._checkStandingWaveConditions(linkId, history)) {
                // Acquire or update trap
                this._activateTrap(linkId, history, reflection);
            }
        });
        
        // Cleanup reflection history for inactive links
        this.reflectionHistory.forEach((history, linkId) => {
            if (!activeReflections.some(r => r.linkId === linkId)) {
                history.reflections = [];
            }
        });
    }

    /**
     * Get active reflections from reflection system (READ-ONLY)
     */
    _getActiveReflections() {
        if (!this.reflectionSystem) return [];
        
        // If reflection system exposes activeReflections
        if (this.reflectionSystem.reflectionPulses && Array.isArray(this.reflectionSystem.reflectionPulses)) {
            return this.reflectionSystem.reflectionPulses.filter(r => r && r.active);
        }
        
        // Fallback: scan reflection pulse pool
        if (this.reflectionSystem.reflectionPulsePool && Array.isArray(this.reflectionSystem.reflectionPulsePool)) {
            return this.reflectionSystem.reflectionPulsePool.filter(p => p && p.active);
        }
        
        return [];
    }

    /**
     * Check if standing wave conditions are met on a link
     */
    _checkStandingWaveConditions(linkId, history) {
        if (history.reflections.length < this.config.reflectionCountThreshold) {
            return false;
        }
        
        // Calculate phase consistency
        const phases = history.reflections.map(r => r.phase);
        const phaseVariance = this._calculatePhaseConsistency(phases);
        
        if (phaseVariance < this.config.phaseConsistencyThreshold) {
            return false;
        }
        
        // Check net flow (should be near zero for standing wave)
        const netFlow = this._calculateNetFlow(linkId, history);
        
        if (Math.abs(netFlow) > this.config.netFlowThreshold) {
            return false;
        }
        
        // All conditions met
        return true;
    }

    /**
     * Calculate phase consistency (0-1, higher = more consistent)
     */
    _calculatePhaseConsistency(phases) {
        if (phases.length < 2) return 0;
        
        // Normalize phases to [-π, π]
        const normalized = phases.map(p => {
            let n = p % (Math.PI * 2);
            if (n > Math.PI) n -= Math.PI * 2;
            return n;
        });
        
        // Calculate circular variance
        let sumCos = 0, sumSin = 0;
        normalized.forEach(p => {
            sumCos += Math.cos(p);
            sumSin += Math.sin(p);
        });
        
        const meanResultant = Math.sqrt(sumCos * sumCos + sumSin * sumSin) / normalized.length;
        return Math.min(1, meanResultant);
    }

    /**
     * Calculate net forward flow on link (READ-ONLY from influence data)
     */
    _calculateNetFlow(linkId, history) {
        if (!this.harmonicInfluenceSystem || history.reflections.length === 0) {
            return 0;
        }
        
        // Count forward vs backward reflections
        let forwardCount = 0, backwardCount = 0;
        
        history.reflections.forEach(r => {
            // Phase near 0 or 2π = forward, phase near π = backward
            const normalizedPhase = r.phase % (Math.PI * 2);
            if (normalizedPhase < Math.PI * 0.5 || normalizedPhase > Math.PI * 1.5) {
                forwardCount += r.intensity;
            } else {
                backwardCount += r.intensity;
            }
        });
        
        return (forwardCount - backwardCount) / (forwardCount + backwardCount + 0.001);
    }

    /**
     * Activate or update oscillation trap for link
     */
    _activateTrap(linkId, history, reflection) {
        // Find existing trap for this link
        let trap = this.oscillationTraps.find(t => t.linkId === linkId);
        
        if (!trap) {
            // Acquire from pool
            const pooledTrap = this.trapPool.find(t => !t.active);
            if (!pooledTrap) return;  // Pool exhausted
            
            pooledTrap.active = true;
            pooledTrap.id = linkId;
            pooledTrap.linkId = linkId;
            pooledTrap.birthTime = this.time;
            pooledTrap.reflectionCount = 0;
            pooledTrap.energyStorage = 0;
            pooledTrap.maxEnergy = 5.0;
            pooledTrap.decayRate = 0.02;
            
            this.oscillationTraps.push(pooledTrap);
            trap = pooledTrap;
        }
        
        // Update trap properties
        const link = this._getLinkById(linkId);
        if (!link) return;
        
        trap.nodeA = this._getLinkSource(link);
        trap.nodeB = this._getLinkTarget(link);
        trap.reflectionCount++;
        trap.lastReflectionTime = this.time;
        trap.energyStorage = Math.min(
            trap.maxEnergy,
            (trap.energyStorage || 0) + (reflection?.intensity ?? 0)
        );
        
        // Calculate oscillation frequency based on reflection rate
        const reflectionRate = history.reflections.length / this.config.detectionWindow;
        trap.frequency = reflectionRate * this.config.beatFrequencyBase;
        
        // Calculate trap radius
        trap.trapRadius = Math.min(
            1.0,
            this.config.trapRadiusBase + 
            trap.reflectionCount * this.config.trapRadiusModifier
        );
        
        // Calculate amplitude modulation
        this._updateTrapAmplitude(trap);
        
        // Update state based on conditions
        this._updateTrapState(trap);
    }

    /**
     * Update trap amplitude based on node metrics
     */
    _updateTrapAmplitude(trap) {
        if (!trap.nodeA || !trap.nodeB) return;
        
        const harmonyA = this._readNodeMetric(trap.nodeA, 'harmony', 0.5);
        const harmonyB = this._readNodeMetric(trap.nodeB, 'harmony', 0.5);
        const corruptionA = this._readNodeMetric(trap.nodeA, 'corruption', 0.5);
        const corruptionB = this._readNodeMetric(trap.nodeB, 'corruption', 0.5);
        const instabilityA = this._readNodeMetric(trap.nodeA, 'instability', 0);
        const instabilityB = this._readNodeMetric(trap.nodeB, 'instability', 0);
        const synergyAvg =
            (this._readNodeMetric(trap.nodeA, 'synergy', 0.5) + this._readNodeMetric(trap.nodeB, 'synergy', 0.5)) * 0.5;
        
        // Base amplitude
        const baseAmplitude = this.config.standingWaveAmplitude;
        let amplitude = baseAmplitude;
        
        // Harmony weakens the trap
        const avgHarmony = (harmonyA + harmonyB) * 0.5;
        amplitude *= (1 - avgHarmony * this.config.harmonyDamping);
        
        // Corruption stabilizes (maintains amplitude)
        const avgCorruption = (corruptionA + corruptionB) * 0.5;
        amplitude *= (1 + avgCorruption * (this.config.corruptionStabilization - 1));
        
        // Instability causes wobble
        const avgInstability = (instabilityA + instabilityB) * 0.5;
        amplitude *= (1 + Math.sin(this.time * 2) * avgInstability * this.config.instabilityWobble);
        
        // Stored trap energy amplifies standing-wave oscillation.
        amplitude *= (1 + (trap.energyStorage || 0) * 0.5);

        trap.amplitude = Math.max(0, Math.min(3, amplitude));
    }

    /**
     * Update trap state based on conditions (emerging, stable, wobbling, resolving)
     */
    _updateTrapState(trap) {
        const lifespan = this.time - trap.birthTime;
        
        // Natural damping
        const harmonyAvg =
            (this._readNodeMetric(trap.nodeA, 'harmony', 0.5) + this._readNodeMetric(trap.nodeB, 'harmony', 0.5)) * 0.5;
        trap.damping = lifespan * this.config.dampingRate * (1 + harmonyAvg * 0.5);
        
        // Determine state
        if (lifespan < 0.3) {
            trap.state = 'emerging';
        } else if (trap.amplitude > 0.6) {
            // Check for breakthrough condition
            if (harmonyAvg > this.config.breakthroughThreshold) {
                this._initializeResolution(trap, 'breakthrough');
                trap.state = 'resolving';
            } else {
                trap.state = 'stable';
            }
        } else {
            // Check for collapse condition
            const instabilityAvg =
                (this._readNodeMetric(trap.nodeA, 'instability', 0) + this._readNodeMetric(trap.nodeB, 'instability', 0)) * 0.5;
            if (instabilityAvg > this.config.collapseTriggerInstability) {
                this._initializeResolution(trap, 'collapse');
                trap.state = 'resolving';
            } else if (trap.damping > 0.7) {
                this._initializeResolution(trap, 'damping');
                trap.state = 'resolving';
            } else {
                trap.state = 'wobbling';
            }
        }
    }

    /**
     * Initialize resolution event for a trap
     */
    _initializeResolution(trap, type) {
        const resolution = {
            trapId: trap.linkId,
            type: type,  // 'damping', 'breakthrough', 'collapse'
            startTime: this.time,
            duration: this.config.resolutionDuration,
            progress: 0
        };
        
        this.resolutionEvents.push(resolution);
        trap.resolution = resolution;
    }

    /**
     * Identify opposing node pairs (nodes that resist each other)
     */
    _identifyOpposingNodePairs() {
        this.opposingNodePairs.clear();
        
        if (!this.aiNodes || !this.linkingSystem) return;
        
        const nodes = Array.isArray(this.aiNodes) ? this.aiNodes : 
                      this.aiNodes.nodes ? this.aiNodes.nodes : 
                      Object.values(this.aiNodes);
        
        const links = this.linkingSystem.links || [];
        
        // For each link, check if endpoints are opposing
        links.forEach(link => {
            if (!link) return;
            
            const nodeA = this._getLinkSource(link);
            const nodeB = this._getLinkTarget(link);
            
            if (!nodeA || !nodeB) return;
            
            // Check opposition criteria
            const harmony_A = this._readNodeMetric(nodeA, 'harmony', 0.5);
            const harmony_B = this._readNodeMetric(nodeB, 'harmony', 0.5);
            const corruption_A = this._readNodeMetric(nodeA, 'corruption', 0.5);
            const corruption_B = this._readNodeMetric(nodeB, 'corruption', 0.5);
            
            // Nodes are opposing if they have conflicting harmony/corruption
            const isOpposing = 
                (harmony_A < 0.4 && harmony_B > 0.6) ||
                (harmony_A > 0.6 && harmony_B < 0.4) ||
                (corruption_A > 0.6 && corruption_B < 0.4) ||
                (corruption_A < 0.4 && corruption_B > 0.6);
            
            if (isOpposing) {
                const key = [this._getNodeId(nodeA), this._getNodeId(nodeB)].sort().join('_');
                this.opposingNodePairs.set(key, {
                    nodeA: nodeA,
                    nodeB: nodeB,
                    link: link,
                    opposing: true
                });
            }
        });
    }

    /**
     * Update oscillation trap properties each frame
     */
    _updateOscillationTraps(deltaTime) {
        this.oscillationTraps = this.oscillationTraps.filter(trap => {
            if (!trap.active) return false;
            
            // Deactivate if no reflections for 2 seconds
            if (this.time - trap.lastReflectionTime > 2.0) {
                trap.active = false;
                return false;
            }
            
            // Update phase with oscillation frequency
            trap.phase += trap.frequency * deltaTime * Math.PI * 2;
            
            // Apply damping to amplitude
            trap.amplitude *= (1 - deltaTime * this.config.dampingRate * 0.5);

            // Passive energy decay
            trap.energyStorage = Math.max(0, (trap.energyStorage || 0) - (trap.decayRate || 0.02));

            // Optional release burst when trapped energy gets high.
            if ((trap.energyStorage || 0) > 3.0) {
                trap.energyStorage *= 0.5;
            }
            
            return true;
        });
    }

    /**
     * Update trap zone geometry and intensity
     */
    _updateTrapZones(deltaTime) {
        this.trapZones = [];
        
        this.oscillationTraps.forEach(trap => {
            if (!trap.active || trap.amplitude < 0.05) return;
            
            const zone = {
                linkId: trap.linkId,
                trapCenter: this.config.trapCenterOffset,
                radiusStart: Math.max(0, 0.5 - trap.trapRadius * 0.5),
                radiusEnd: Math.min(1, 0.5 + trap.trapRadius * 0.5),
                intensity: trap.amplitude,
                frequency: trap.frequency,
                phase: trap.phase,
                state: trap.state
            };
            
            this.trapZones.push(zone);
        });
    }

    /**
     * Calculate interference patterns within trap zones
     */
    _updateInterferencePatterns(deltaTime) {
        this.interferencePatterns = [];
        
        this.trapZones.forEach(zone => {
            const pattern = {
                trapId: zone.linkId,
                spacing: this.config.interferenceSpacing,
                contrast: this.config.interferenceContrast,
                beatPhase: zone.phase * this.config.synergyClarity,
                time: this.time,
                antiNodeCount: Math.ceil(1.0 / (this.config.interferenceSpacing + 0.01))
            };
            
            this.interferencePatterns.push(pattern);
        });
    }

    /**
     * Update resolution events (damping, breakthrough, collapse)
     */
    _updateResolutionEvents(deltaTime) {
        this.resolutionEvents = this.resolutionEvents.filter(event => {
            event.progress = (this.time - event.startTime) / event.duration;
            return event.progress < 1.0;
        });
    }

    /**
     * Apply visual effects to the scene
     * This is where visual modifications would be applied
     */
    _applyVisualEffects() {
        // Visual-only: this method would apply effects to:
        // - Link wave appearance (replace traveling with standing)
        // - Interference pattern rendering
        // - Node halo counter-pulsing
        // - Resolution animations
        // Implementation deferred to rendering layer
    }

    /**
     * Get link by ID (helper)
     */
    _getLinkById(linkId) {
        if (!this.linkingSystem || !this.linkingSystem.links) return null;
        return this.linkingSystem.links.find(l => l && l.id === linkId);
    }

    _getNodeId(node) {
        return node?.id ?? node?.userData?.nodeId ?? node?.userData?.id;
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

    /**
     * Dispose - cleanup
     */
    dispose() {
        this.oscillationTraps.forEach(t => t.active = false);
        this.oscillationTraps = [];
        this.reflectionHistory.clear();
        this.trapZones = [];
        this.interferencePatterns = [];
        this.resolutionEvents = [];
        this.opposingNodePairs.clear();
        this.lastReflectionTime.clear();
    }
}

/**
 * ============================================================================
 * INTEGRATION NOTES
 * ============================================================================
 * 
 * In main.js:
 * 
 *   import { StandingWaveOscillationTrapSystem_Session130 } 
 *     from './StandingWaveOscillationTrapSystem_Session130.js';
 *   
 *   // In World constructor:
 *   this.standingWaveTrap = new StandingWaveOscillationTrapSystem_Session130(
 *       this.scene,
 *       this,
 *       this.influenceReflection,  // Reflection system (required)
 *       this.harmonicInfluencePropagation,  // Influence system (optional)
 *       this.aiNodes,
 *       this.linkingSystem
 *   );
 *   
 *   // In setup section:
 *   this.standingWaveTrap.setup();
 *   
 *   // In animate loop:
 *   if (this.standingWaveTrap) {
 *       this.standingWaveTrap.update(deltaTime, this.time);
 *   }
 * 
 * ============================================================================
 * SEMANTIC LANGUAGE EXTENSION (11 → 12 Dimensions)
 * ============================================================================
 * 
 * Dimension 12: Oscillation & Trap
 * Encodes: Unresolved tension, energy oscillation, deadlock zones
 * Visual: Standing waves + interference patterns
 * 
 * This system adds trapped energy dynamics:
 * - Energy can become stuck between opposing forces
 * - Oscillation indicates unresolved conflict
 * - Interference patterns show resonance buildup
 * - Resolution can occur via three paths: damping, breakthrough, collapse
 * 
 * ============================================================================
 */
