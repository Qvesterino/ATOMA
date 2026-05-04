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
 * - Detects standing wave conditions (reflection frequency + intensity)
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
    constructor(scene, world, reflectionSystem, aiNodes, linkingSystem, config = {}) {
        this.scene = scene;
        this.world = world;
        this.reflectionSystem =
            reflectionSystem ||
            world?.influenceReflection ||
            world?.waveReflectionSystem ||
            globalThis.waveReflectionSystem;
        this.aiNodes = aiNodes;
        this.linkingSystem = linkingSystem;
        this.waveEngine = world?.waveInterferenceEngine || globalThis?.game?.waveInterferenceEngine || null;
        
        // Configuration
        this.config = {
            // Standing wave detection
            reflectionCountThreshold: 3,      // Min reflections in window to trigger
            detectionWindow: 1.5,             // Time window for reflection counting (seconds)
            
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
        this.trapZones = [];                  // { linkId, trapCenter, radiusStart, radiusEnd, intensity, frequency, phase }
        this.interferencePatterns = [];       // { trapId, spacing, contrast, beatPhase }
        this.resolutionEvents = [];           // { trapId, type, startTime, duration, progress }
        
        // Object pools
        this.trapPool = [];
        this.trapZonePool = [];
        this.interferencePatternPool = [];
        
        // Tracking
        this.opposingNodePairs = new Map();   // nodeIdA_nodeIdB -> { nodeA, nodeB, linkIds, opposing }
        this.lastReflectionTime = new Map();  // linkId -> time of last reflection
        
        this.time = 0;
        this.initialized = false;
    }

    getActiveTraps() {
        // Zero-alloc: return a sub-view rather than .filter() allocation
        const result = [];
        for (let i = 0; i < this.oscillationTraps.length; i++) {
            const t = this.oscillationTraps[i];
            if (t && t.active) result.push(t);
        }
        return result;
    }

    _resolveLinkId(linkOrId) {
        if (!linkOrId) return null;
        if (typeof linkOrId === 'string' || typeof linkOrId === 'number') {
            return String(linkOrId);
        }

        return (
            linkOrId.userData?.id ??
            linkOrId.userData?.linkId ??
            linkOrId.id ??
            linkOrId.uuid ??
            null
        );
    }

    clearLink(linkOrId) {
        const linkId = this._resolveLinkId(linkOrId);
        if (!linkId) return false;

        let cleared = false;

        for (let i = 0; i < this.oscillationTraps.length; i++) {
            const trap = this.oscillationTraps[i];
            if (!trap || trap.linkId !== linkId) continue;
            trap.active = false;
            trap.linkId = null;
            trap.nodeA = null;
            trap.nodeB = null;
            trap.amplitude = 0;
            trap.frequency = 0;
            trap.energyStorage = 0;
            trap.resolution = null;
            cleared = true;
        }

        this.trapZones = this.trapZones.filter((zone) => zone?.linkId !== linkId);
        this.interferencePatterns = this.interferencePatterns.filter((pattern) => pattern?.trapId !== linkId);
        this.resolutionEvents = this.resolutionEvents.filter((event) => event?.trapId !== linkId);
        this.reflectionHistory.delete(linkId);
        this.lastReflectionTime.delete(linkId);

        for (const [key, pair] of this.opposingNodePairs.entries()) {
            const pairLinkId = this._resolveLinkId(pair?.link);
            if (pairLinkId === linkId) {
                this.opposingNodePairs.delete(key);
            }
        }

        return cleared;
    }

    _pruneDeadLinkState() {
        const liveLinkIds = new Set(
            Array.isArray(this.linkingSystem?.links)
                ? this.linkingSystem.links
                    .map((link) => this._resolveLinkId(link))
                    .filter((id) => id !== null && id !== undefined)
                    .map((id) => String(id))
                : []
        );

        for (let i = 0; i < this.oscillationTraps.length; i++) {
            const trap = this.oscillationTraps[i];
            if (!trap?.active) continue;
            const trapLinkId = this._resolveLinkId(trap.linkId);
            if (!trapLinkId || liveLinkIds.has(String(trapLinkId))) continue;
            this.clearLink(trapLinkId);
        }

        for (const linkId of Array.from(this.reflectionHistory.keys())) {
            if (!liveLinkIds.has(String(linkId))) {
                this.reflectionHistory.delete(linkId);
            }
        }

        for (const linkId of Array.from(this.lastReflectionTime.keys())) {
            if (!liveLinkIds.has(String(linkId))) {
                this.lastReflectionTime.delete(linkId);
            }
        }
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

            this.trapZonePool.push({
                linkId: null,
                trapCenter: this.config.trapCenterOffset,
                radiusStart: 0,
                radiusEnd: 0,
                intensity: 0,
                frequency: 0,
                phase: 0
            });

            this.interferencePatternPool.push({
                trapId: null,
                spacing: this.config.interferenceSpacing,
                contrast: this.config.interferenceContrast,
                beatPhase: 0
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

        // Canonical wave/resonance defaults before writing this frame.
        this._resetWaveResonanceCanonical();

        // Unlinked trap state must die immediately instead of lingering visually.
        this._pruneDeadLinkState();
        
        // Step 1: Detect standing wave conditions
        this._detectStandingWaveCandidates(deltaTime);
        
        // Step 2: Identify opposing node pairs
        this._identifyOpposingNodePairs();
        
        // Step 3: Update oscillation traps
        this._updateOscillationTraps(deltaTime);
        
        // Step 4: Manage trap zones geometry
        this._updateTrapZones(deltaTime);
        this.visualRenderer?.syncTrapZones?.(deltaTime);
        
        // Step 5: Calculate interference patterns
        this._updateInterferencePatterns(deltaTime);
        
        // Step 6: Track resolution events
        this._updateResolutionEvents(deltaTime);

        // Step 6.5: Write canonical wave/resonance metrics for downstream readers
        this._writeWaveResonanceCanonical();
        
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

        // Prefer whichever source currently holds active pulses.
        const activeDirectPulses = Array.isArray(this.reflectionSystem.reflectionPulses)
            ? this.reflectionSystem.reflectionPulses.filter(r => r && r.active)
            : [];
        if (activeDirectPulses.length > 0) {
            return activeDirectPulses;
        }

        const activePooledPulses = Array.isArray(this.reflectionSystem.reflectionPulsePool)
            ? this.reflectionSystem.reflectionPulsePool.filter(p => p && p.active)
            : [];
        if (activePooledPulses.length > 0) {
            return activePooledPulses;
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

        // Zero-alloc: manual sum instead of .reduce()
        let sum = 0;
        const reflections = history.reflections;
        for (let i = 0; i < reflections.length; i++) {
            sum += reflections[i].intensity ?? 0;
        }
        return (sum / reflections.length) >= 0.1;
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
     * SIMPLIFIED: Update trap amplitude using only 2 canonical metrics
     * Reads: harmony, corruption
     * Derived: instability = corruption * (1 - harmony), synergy = harmony * (1 - corruption * 0.5)
     */
    _updateTrapAmplitude(trap) {
        if (!trap.nodeA || !trap.nodeB) return;
        
        // CANONICAL METRIC 1: harmony (0-1)
        const harmonyA = this._readNodeMetric(trap.nodeA, 'harmony', 0.5);
        const harmonyB = this._readNodeMetric(trap.nodeB, 'harmony', 0.5);
        const avgHarmony = (harmonyA + harmonyB) * 0.5;
        
        // CANONICAL METRIC 2: corruption (0-1)
        const corruptionA = this._readNodeMetric(trap.nodeA, 'corruption', 0);
        const corruptionB = this._readNodeMetric(trap.nodeB, 'corruption', 0);
        const avgCorruption = (corruptionA + corruptionB) * 0.5;
        
        // DERIVED: instability from corruption (high corruption = high instability)
        const avgInstability = avgCorruption * (1 - avgHarmony * 0.5);
        
        // DERIVED: synergy from harmony (high harmony = high synergy)
        const synergyAvg = avgHarmony * (1 - avgCorruption * 0.5);
        
        // Base amplitude
        const baseAmplitude = this.config.standingWaveAmplitude;
        let amplitude = baseAmplitude;
        
        // Harmony weakens the trap
        amplitude *= (1 - avgHarmony * this.config.harmonyDamping);
        
        // Corruption stabilizes (maintains amplitude)
        amplitude *= (1 + avgCorruption * (this.config.corruptionStabilization - 1));
        
        // Instability causes wobble (derived from corruption)
        amplitude *= (1 + Math.sin(this.time * 2) * avgInstability * this.config.instabilityWobble);
        
        // Stored trap energy amplifies standing-wave oscillation.
        amplitude *= (1 + (trap.energyStorage || 0) * 0.5);

        trap.amplitude = Math.max(0, Math.min(3, amplitude));
    }

    /**
     * SIMPLIFIED: Update trap state using only 2 canonical metrics
     */
    _updateTrapState(trap) {
        const lifespan = this.time - trap.birthTime;
        
        // CANONICAL: harmony for damping calculation
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
            // DERIVED: instability from corruption (high corruption = high instability)
            const corruptionAvg =
                (this._readNodeMetric(trap.nodeA, 'corruption', 0) + this._readNodeMetric(trap.nodeB, 'corruption', 0)) * 0.5;
            const instabilityAvg = corruptionAvg * (1 - harmonyAvg * 0.5);
            
            // Check for collapse condition
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
            // Smoothstep thresholds for organic transition instead of hard cutoffs
            const harmDiff = Math.abs(harmony_A - harmony_B);
            const corrDiff = Math.abs(corruption_A - corruption_B);
            const harmOpposition = THREE.MathUtils.smoothstep(harmDiff, 0.15, 0.35);
            const corrOpposition = THREE.MathUtils.smoothstep(corrDiff, 0.15, 0.35);
            const isOpposing = (harmOpposition > 0.5 && Math.min(harmony_A, harmony_B) < 0.4) ||
                               (corrOpposition > 0.5 && Math.max(corruption_A, corruption_B) > 0.5);
            
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
        // Zero-alloc: in-place compaction instead of .filter()
        let writeIdx = 0;
        for (let i = 0; i < this.oscillationTraps.length; i++) {
            const trap = this.oscillationTraps[i];
            if (!trap.active) continue;

            if (!this._getLinkById(trap.linkId)) {
                trap.active = false;
                continue;
            }

            // Deactivate if no reflections for 2 seconds
            if (this.time - trap.lastReflectionTime > 2.0) {
                trap.active = false;
                continue;
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

            this.oscillationTraps[writeIdx++] = trap;
        }
        this.oscillationTraps.length = writeIdx;
    }

    /**
     * Update trap zone geometry and intensity
     */
    _updateTrapZones(deltaTime) {
        let writeIdx = 0;
        
        this.oscillationTraps.forEach(trap => {
            if (!trap.active || trap.amplitude < 0.05) return;

            const zone = this.trapZonePool[writeIdx] || {
                linkId: null,
                trapCenter: this.config.trapCenterOffset,
                radiusStart: 0,
                radiusEnd: 0,
                intensity: 0,
                frequency: 0,
                phase: 0
            };
            zone.linkId = trap.linkId;
            zone.trapCenter = this.config.trapCenterOffset;
            zone.radiusStart = Math.max(0, 0.5 - trap.trapRadius * 0.5);
            zone.radiusEnd = Math.min(1, 0.5 + trap.trapRadius * 0.5);
            zone.intensity = trap.amplitude;
            zone.frequency = trap.frequency;
            zone.phase = trap.phase;
            this.trapZonePool[writeIdx] = zone;
            this.trapZones[writeIdx++] = zone;
        });

        this.trapZones.length = writeIdx;
    }

    /**
     * Calculate interference patterns within trap zones
     */
    _updateInterferencePatterns(deltaTime) {
        let writeIdx = 0;

        this.trapZones.forEach(zone => {
            const pattern = this.interferencePatternPool[writeIdx] || {
                trapId: null,
                spacing: this.config.interferenceSpacing,
                contrast: this.config.interferenceContrast,
                beatPhase: 0
            };
            pattern.trapId = zone.linkId;
            pattern.spacing = this.config.interferenceSpacing;
            pattern.contrast = this.config.interferenceContrast;
            pattern.beatPhase = zone.phase * this.config.synergyClarity;
            this.interferencePatternPool[writeIdx] = pattern;
            this.interferencePatterns[writeIdx++] = pattern;
        });

        this.interferencePatterns.length = writeIdx;
    }

    /**
     * Update resolution events (damping, breakthrough, collapse)
     */
    _updateResolutionEvents(deltaTime) {
        // Zero-alloc: in-place compaction instead of .filter()
        let writeIdx = 0;
        for (let i = 0; i < this.resolutionEvents.length; i++) {
            const event = this.resolutionEvents[i];
            event.progress = (this.time - event.startTime) / event.duration;
            if (event.progress < 1.0) {
                this.resolutionEvents[writeIdx++] = event;
            }
        }
        this.resolutionEvents.length = writeIdx;
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

    _collectNodesForCanonicalWrite() {
        const collected = [];
        const seen = new Set();

        const addNode = (node) => {
            if (!node) return;
            const id = this._getNodeId(node) ?? node.uuid ?? node.id;
            if (id === undefined || id === null) return;
            const key = String(id);
            if (seen.has(key)) return;
            seen.add(key);
            collected.push(node);
        };

        const aiNodes = Array.isArray(this.aiNodes)
            ? this.aiNodes
            : this.aiNodes?.nodes
                ? this.aiNodes.nodes
                : this.aiNodes
                    ? Object.values(this.aiNodes)
                    : [];

        aiNodes.forEach(addNode);

        const links = this.linkingSystem?.links || [];
        links.forEach((link) => {
            addNode(this._getLinkSource(link));
            addNode(this._getLinkTarget(link));
        });

        return collected;
    }

    _resetWaveResonanceCanonical() {
        const nodes = this._collectNodesForCanonicalWrite();
        nodes.forEach((node) => {
            node.userData ??= {};
            node.userData.waveField ??= {};

            node.userData.resonance = 0;
            node.userData.waveField.amplitude = 0;
            node.userData.waveField.phase = 0;
            node.userData.waveField.standing = 0;
            node.userData.waveField.source = 'standing';

            // Stamp canonical writes for wave resonance fields
            node.userData.__canonicalWriteAt = node.userData.__canonicalWriteAt || {};
            node.userData.__canonicalWriteAt.resonance = Date.now();
            node.userData.__canonicalWriteAt['waveField.amplitude'] = Date.now();
            node.userData.__canonicalWriteAt['waveField.phase'] = Date.now();
            node.userData.__canonicalWriteAt['waveField.standing'] = Date.now();
        });
    }

    _writeWaveResonanceCanonical() {
        // Zero-alloc: iterate directly instead of .filter() + .forEach()
        const traps = this.oscillationTraps;
        for (let i = 0; i < traps.length; i++) {
            const trap = traps[i];
            if (!trap?.active) continue;
            const normalizedAmplitude = Math.max(0, Math.min(1, (trap.amplitude || 0) / 1.2));
            const phase = ((trap.phase || 0) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

            const applyToNode = (node) => {
                if (!node) return;
                node.userData ??= {};
                node.userData.waveField ??= {};

                const currentResonance = Number(node.userData.resonance) || 0;
                const currentAmplitude = Number(node.userData.waveField.amplitude) || 0;

                node.userData.resonance = Math.max(currentResonance, normalizedAmplitude);
                node.userData.waveField.amplitude = Math.max(currentAmplitude, normalizedAmplitude);
                node.userData.waveField.phase = phase;
                node.userData.waveField.standing = Math.max(Number(node.userData.waveField.standing) || 0, normalizedAmplitude);
                node.userData.waveField.source = 'standing';

                // Stamp canonical writes for wave resonance fields
                node.userData.__canonicalWriteAt = node.userData.__canonicalWriteAt || {};
                node.userData.__canonicalWriteAt.resonance = Date.now();
                node.userData.__canonicalWriteAt['waveField.amplitude'] = Date.now();
                node.userData.__canonicalWriteAt['waveField.phase'] = Date.now();
                node.userData.__canonicalWriteAt['waveField.standing'] = Date.now();
            };

            applyToNode(trap.nodeA);
            applyToNode(trap.nodeB);
        }
    }

    getDebugInfo() {
        const activeReflections = this._getActiveReflections();
        const activeTraps = this.getActiveTraps();

        return {
            initialized: this.initialized,
            reflectionSystemConnected: Boolean(this.reflectionSystem),
            activeReflectionCount: activeReflections.length,
            reflectionPulseArrayCount: Array.isArray(this.reflectionSystem?.reflectionPulses)
                ? this.reflectionSystem.reflectionPulses.filter(p => p?.active).length
                : 0,
            reflectionPulsePoolCount: Array.isArray(this.reflectionSystem?.reflectionPulsePool)
                ? this.reflectionSystem.reflectionPulsePool.filter(p => p?.active).length
                : 0,
            reflectionHistoryLinks: this.reflectionHistory.size,
            activeTrapCount: activeTraps.length,
            trapZoneCount: this.trapZones.length,
            interferencePatternCount: this.interferencePatterns.length,
            resolutionEventCount: this.resolutionEvents.length,
            thresholds: {
                reflectionCountThreshold: this.config.reflectionCountThreshold,
                detectionWindow: this.config.detectionWindow
            },
            traps: activeTraps.slice(0, 5).map((trap) => ({
                linkId: trap.linkId,
                amplitude: Number((trap.amplitude || 0).toFixed(3)),
                frequency: Number((trap.frequency || 0).toFixed(3)),
                trapRadius: Number((trap.trapRadius || 0).toFixed(3)),
                reflectionCount: trap.reflectionCount || 0,
                state: trap.state || 'unknown'
            }))
        };
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
        this.trapZonePool = [];
        this.interferencePatternPool = [];
        this.opposingNodePairs.clear();
        this.lastReflectionTime.clear();
    }

    /**
     * Rebind after world switch (updates aiNodes, linkingSystem)
     */
    rebind(config = {}) {
        // Update references if provided
        if (config.aiNodes !== undefined) {
            this.aiNodes = config.aiNodes;
        }
        if (config.linkingSystem !== undefined) {
            this.linkingSystem = config.linkingSystem;
        }
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
