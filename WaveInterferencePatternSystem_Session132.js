/**
 * ============================================================================
 * WAVE INTERFERENCE PATTERN SYSTEM (Session 132)
 * ============================================================================
 * 
 * PURE RENDERING SYSTEM - Visualizes Wave Collisions
 * 
 * Purpose:
 * Detects and visualizes constructive/destructive interference patterns
 * when reflected waves collide on the same path or in adjacent zones.
 * Creates dynamic visual patterns showing resonance amplification and
 * cancellation zones.
 * 
 * Core Philosophy:
 * - Waves are not isolated; they interact
 * - Collision creates regions of amplification and cancellation
 * - Interference patterns encode complex network dynamics
 * - Visual interference = readable conflict resolution
 * 
 * Architecture:
 * - Detects multi-wave collision scenarios (2+ reflection waves converging)
 * - Calculates phase relationships between colliding waves
 * - Computes constructive zones (amplification) and destructive zones (cancellation)
 * - Generates interference mesh overlays (bright/dark bands)
 * - Tracks beat frequencies from frequency differences
 * - Animates complex interference patterns
 * - Manages interference lifecycle (emergence, stability, resolution)
 * 
 * Integration:
 * - Works with InfluenceReflectionBackPressureSystem (reads reflections)
 * - Works with StandingWaveVisualRenderer (visual layer)
 * - Visual-only, no gameplay modifications
 * 
 * Status: PRODUCTION (Session 132)
 * 
 * ============================================================================
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

export class WaveInterferencePatternSystem_Session132 {
    constructor(scene, reflectionSystem, linkingSystem, aiNodes, config = {}) {
        this.scene = scene;
        this.reflectionSystem =
            reflectionSystem ||
            globalThis?.waveReflectionSystem ||
            null;
        this.linkingSystem = linkingSystem;
        this.aiNodes = aiNodes;
        
        // UNIFIED CLEANUP CONTRACT - Track all created objects
        this._createdObjects = [];
        
        // Configuration
        this.config = {
            // Collision detection
            collisionWindowSeconds: 0.5,      // Time window for waves to be considered colliding
            pathProximityThreshold: 0.3,      // Spatial proximity to detect collisions
            phaseDifferenceThreshold: 0.2,    // Phase alignment required (0-1)
            minWaveIntensity: 0.1,            // Minimum intensity to participate
            
            // Constructive interference (amplification)
            constructiveColor: new THREE.Color(1.0, 0.8, 0.0),  // Gold
            constructiveOpacity: 0.25,        // Base opacity
            constructiveGlow: 1.5,            // Emissive multiplier
            constructiveWidth: 0.08,          // Band width
            constructiveAmplification: 1.8,   // Amplitude multiplication factor
            birthSeedPulseScale: 1.24,        // Extra scale for seed birth visuals
            birthSeedSpikeBoost: 1.35,        // Extra spike length bias for seed births
            birthSeedOpacityBoost: 1.15,      // Visibility lift for seed births
            birthSeedPulseOpacity: 0.18,      // Torus pulse opacity for seed births
            
            // Destructive interference (cancellation)
            destructiveColor: new THREE.Color(0.2, 0.2, 0.3),   // Dark blue-grey
            destructiveOpacity: 0.08,         // Base opacity (subtle)
            destructiveGlow: 0.3,             // Emissive multiplier (dim)
            destructiveWidth: 0.08,           // Band width
            destructiveDamping: 0.5,          // Amplitude reduction factor
            
            // Interference mesh rendering
            interferenceResolution: 16,       // Segments for interference mesh
            maxInterferenceMeshes: 50,        // Pool size
            interferenceRenderOrder: VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_LINK_RESONANCE),
            visualUpdateHz: 30,               // Explicit render pacing for this system
            beatMotionScale: 0.72,            // Slightly slower beat animation
            spikeCount: 8,                    // Protrusions on the sphere
            spikeLength: 0.92,                // Spike reach from center
            spikeRadius: 0.11,                // Spike base radius
            shellOpacity: 0.12,               // Thin structural shell
            
            // Beat frequency patterns
            beatFrequencyRange: [0.5, 4.0],   // Min-max Hz from frequency differences
            beatAmplification: 1.2,           // How much beat modulates amplitude
            
            // Visual modulation
            harmonyCancellation: 0.4,         // Harmony reduces interference visibility
            corruptionAmplification: 0.6,     // Corruption increases patterns
            instabilityNoise: 0.2,            // Instability adds jitter
            synergyClarity: 0.8,              // Synergy makes patterns clearer
            
            // Lifecycle
            emergenceTime: 0.3,               // Time to full visibility
            peakDuration: 2.0,                // Duration at peak intensity
            dissipateTime: 1.5,               // Time to fade out
            
            // Performance
            enableLOD: true,                  // Distance-based culling
            lodDistance: 35,                  // Culling distance
            maxConcurrentInterferences: 15,   // Max active patterns per frame
            ...config
        };
        
        // Runtime state
        this.interferenceZones = [];         // { linkIds, type, intensity, beatFrequency, zoneKey }
        this.collisionPairs = [];            // { convergencePoint, phaseDifference, intensity, beatFrequency, linkIds }
        this.birthCollisionPairs = new Map(); // zoneKey -> seeded pair for link birth visuals
        this.interferenceMeshes = [];        // Active interference mesh overlays
        this.beatPatterns = [];              // { zone, beatFrequency, beatPhase }
        this.zoneLifecycles = new Map();     // zoneKey -> { birthTime, lastSeenTime }
        
        // Object pools
        this.interferenceMeshPool = [];
        this._visualAccumulator = 0;
        this._visualStep = 1 / Math.max(1, this.config.visualUpdateHz);
        this._spikeDirections = this._buildSpikeDirections();
        
        // Material cache
        this.constructiveMaterial = null;
        this.destructiveMaterial = null;
        this._coreGeometry = null;
        this._shellGeometry = null;
        this._spikeGeometry = null;
        
        this.time = 0;
        this.initialized = false;

        // Debug audit
        this.debug = false; // Off by default
        this._lastDebugAuditTime = 0;
    }

    /**
     * Setup - initialize materials, pools, and resources
     */
    setup() {
        if (this.initialized) return;
        
        // Create constructive interference material (bright, gold) - additive blending for glow
        this.constructiveMaterial = new THREE.MeshBasicMaterial({
            color: this.config.constructiveColor,
            transparent: true,
            opacity: this.config.constructiveOpacity,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        // Create destructive interference material (dark, dim) - additive blending for subtle glow
        this.destructiveMaterial = new THREE.MeshBasicMaterial({
            color: this.config.destructiveColor,
            transparent: true,
            opacity: this.config.destructiveOpacity,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        this._coreGeometry = new THREE.IcosahedronGeometry(0.85, 2);
        this._shellGeometry = new THREE.IcosahedronGeometry(1.0, 1);
        this._spikeGeometry = new THREE.ConeGeometry(0.12, this.config.spikeLength, 5, 1, false);
        this._birthPulseGeometry = new THREE.TorusGeometry(1.14, 0.055, 5, 18);
        
        // Pre-allocate interference mesh pool
        for (let i = 0; i < this.config.maxInterferenceMeshes; i++) {
            const meshItem = this._createInterferenceVisualItem();
            meshItem.mesh.visible = false;
            meshItem.mesh.renderOrder = this.config.interferenceRenderOrder;
            this.scene.add(meshItem.mesh);
            this._createdObjects.push(meshItem.mesh);  // UNIFIED CLEANUP CONTRACT
            this.interferenceMeshPool.push({
                ...meshItem,
                active: false,
                zone: null,
                type: 'constructive',
                intensity: 1,
                birthTime: 0,
                baseColor: this.config.constructiveColor.clone(),
                baseOpacity: this.config.constructiveOpacity,
                colorIntensity: 1,
                opacityFactor: 1
            });
        }
        
        this.initialized = true;
    }

    /**
     * Update - primary frame update
     * @param {number} deltaTime - Elapsed time since last frame
     * @param {number} currentTime - Total simulation time
     */
    update(deltaTime, currentTime) {
        if (!this.initialized) this.setup();
        this._visualAccumulator += Math.max(0, Number(deltaTime) || 0);
        if (this._visualAccumulator < this._visualStep) {
            this.time = currentTime;
            return;
        }
        this._visualAccumulator %= this._visualStep;
        
        this.time = currentTime;
        
        // Step 1: Detect wave collisions
        this._detectWaveCollisions(deltaTime);
        this._updateBirthCollisionPairs(deltaTime);
        for (const birthPair of this.birthCollisionPairs.values()) {
            this.collisionPairs.push(birthPair);
        }
        
        // Step 2: Calculate interference zones
        this._calculateInterferenceZones(deltaTime);
        
        // Step 3: Calculate beat patterns
        this._calculateBeatPatterns(deltaTime);
        
        // Step 4: Render interference meshes
        this._renderInterferenceMeshes(deltaTime);
        
        // Step 5: Apply state modulation
        this._modulateByNetworkState(deltaTime);
        
        // Step 6: Manage lifecycle
        this._updateInterferenceLifecycle(deltaTime);
        // Debug audit (activatable, throttled)
        if (this.debug && (currentTime - this._lastDebugAuditTime > 1.0)) {
            this._lastDebugAuditTime = currentTime;
            // Output audit info (minimal, non-spam)
            console.log('[WaveInterferencePatternSystem DEBUG]', {
                time: currentTime,
                collisionPairs: this.collisionPairs.length,
                interferenceZones: this.interferenceZones.length,
                activeMeshes: this.interferenceMeshes.length,
                beatPatterns: this.beatPatterns.length
            });
        }
    }

    /**
     * Detect wave collisions (multiple reflections converging)
     */
    _detectWaveCollisions(deltaTime) {
        this.collisionPairs = [];
        
        if (!this.reflectionSystem || !this.linkingSystem) return;
        
        // Get active reflections
        const reflections = this._getActiveReflections();
        if (reflections.length < 2) return;
        
        const links = this.linkingSystem.links || [];
        
        // Check for collisions between reflection pairs
        for (let i = 0; i < reflections.length - 1; i++) {
            for (let j = i + 1; j < reflections.length; j++) {
                const reflection1 = reflections[i];
                const reflection2 = reflections[j];
                
                // Check if reflections are on converging paths
                if (this._arePathsConverging(reflection1, reflection2, links)) {
                    // Check phase relationship
                    const phaseDiff = this._calculatePhaseDifference(reflection1, reflection2);
                    const phaseMatches =
                        phaseDiff <= this.config.phaseDifferenceThreshold ||
                        phaseDiff >= (0.5 - this.config.phaseDifferenceThreshold);
                    
                    if (phaseMatches) {
                        // Collision detected
                        const convergencePoint = this._findConvergencePoint(reflection1, reflection2, links);
                        
                        this.collisionPairs.push({
                            convergencePoint: convergencePoint,
                            phaseDifference: phaseDiff,
                            intensity: Math.min(reflection1.intensity, reflection2.intensity),
                            beatFrequency: Math.abs(
                                this._getWaveFrequency(reflection1) - this._getWaveFrequency(reflection2)
                            ),
                            linkIds: [reflection1.linkId, reflection2.linkId],
                            collisionTime: this.time
                        });
                    }
                }
            }
        }
        
        // Clean up old collision pairs (prevent duplicates)
        this.collisionPairs = this.collisionPairs.filter(pair => {
            return this.time - pair.collisionTime < this.config.collisionWindowSeconds;
        });
    }

    /**
     * Seed a visible interference birth pattern from link creation.
     * This keeps the system readable even before real reflection collisions appear.
     */
    seedLinkBirth(linkOrEvent = {}, signals = {}) {
        const link = (linkOrEvent && typeof linkOrEvent === 'object' && (linkOrEvent.id || linkOrEvent.userData))
            ? linkOrEvent
            : (signals.link ?? signals.linkRef ?? null);
        if (!link) return null;

        const linkId = this._resolveLinkId(link);
        if (!linkId) return null;

        if (link.userData?.__waveInterferenceBirthSeeded === true) {
            const existingKey = link.userData?.__waveInterferenceBirthZoneKey;
            return existingKey ? this.birthCollisionPairs.get(existingKey) ?? null : null;
        }

        const endpoints = this._getLinkEndpoints(link);
        const startPos = endpoints.startPos;
        const endPos = endpoints.endPos;
        const midpoint = (startPos && endPos)
            ? new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5)
            : this._asVector3(
                signals.anchor ??
                signals.center ??
                signals.position ??
                link?.source?.position ??
                link?.target?.position ??
                null
            );
        if (!midpoint) return null;

        const synergy = Number(
            signals.synergy ??
            signals.phaseSyncStrength ??
            link?.synergyScore ??
            link?.userData?.synergy?.score ??
            link?.userData?.synergy?.synergyNorm ??
            link?.userData?.metrics?.synergy ??
            0
        ) || 0;
        const stability = Number(
            signals.stability ??
            signals.phaseSyncStability ??
            link?.userData?.metrics?.harmony ??
            link?.userData?.harmony ??
            0
        ) || 0;
        const intensity = Math.max(0.18, Math.min(1, Math.max(
            Number(signals.intensity ?? signals.value ?? link?.userData?.cascadeIntensity ?? 0) || 0,
            synergy,
            stability
        )));
        const constructiveBias = stability >= 0.6 || synergy >= 0.5;
        const zoneType = signals.type || (constructiveBias ? 'constructive' : 'destructive');
        const zoneKey = `birth:${zoneType}:${linkId}`;
        const beatFrequency = Math.max(
            this.config.beatFrequencyRange[0],
            Math.min(
                this.config.beatFrequencyRange[1],
                Number(signals.beatFrequency ?? (0.75 + intensity * 2.15))
            )
        );
        const phaseDifference = Number.isFinite(Number(signals.phaseDifference))
            ? Math.max(0, Math.min(0.5, Number(signals.phaseDifference)))
            : (constructiveBias ? 0.12 : 0.37);

        const lifecycle = this.zoneLifecycles.get(zoneKey) || {
            birthTime: this.time,
            lastSeenTime: this.time
        };
        lifecycle.lastSeenTime = this.time;
        this.zoneLifecycles.set(zoneKey, lifecycle);

        const pair = {
            convergencePoint: midpoint.clone ? midpoint.clone() : midpoint,
            phaseDifference,
            intensity,
            beatFrequency,
            linkIds: [linkId],
            collisionTime: this.time,
            zoneKey,
            birthSeeded: true,
            linkId
        };

        this.birthCollisionPairs.set(zoneKey, pair);
        if (!link.userData) link.userData = {};
        link.userData.__waveInterferenceBirthSeeded = true;
        link.userData.__waveInterferenceBirthSeededAt = this.time;
        link.userData.__waveInterferenceBirthZoneKey = zoneKey;
        return pair;
    }

    /**
     * Keep birth-seeded interference pairs alive while the link remains active.
     */
    _updateBirthCollisionPairs(deltaTime) {
        if (this.birthCollisionPairs.size === 0) return;

        const now = this.time;
        const staleAge = Math.max(this.config.collisionWindowSeconds * 3, 12.0);

        for (const [zoneKey, pair] of this.birthCollisionPairs.entries()) {
            const link = this._resolveLinkById(pair.linkId);
            if (!link || link.active === false) {
                const age = now - (pair.collisionTime ?? now);
                if (age > staleAge) {
                    this.birthCollisionPairs.delete(zoneKey);
                    this.zoneLifecycles.delete(zoneKey);
                }
                continue;
            }

            const endpoints = this._getLinkEndpoints(link);
            const midpoint = (endpoints.startPos && endpoints.endPos)
                ? new THREE.Vector3().addVectors(endpoints.startPos, endpoints.endPos).multiplyScalar(0.5)
                : this._asVector3(
                    link?.source?.position ??
                    link?.target?.position ??
                    pair.convergencePoint
                );
            if (midpoint) {
                pair.convergencePoint = midpoint.clone ? midpoint.clone() : midpoint;
            }

            const linkSynergy = Number(
                link?.synergyScore ??
                link?.userData?.synergy?.score ??
                link?.userData?.synergy?.synergyNorm ??
                link?.userData?.metrics?.synergy ??
                pair.intensity
            ) || pair.intensity;
            const linkStability = Number(
                link?.userData?.metrics?.harmony ??
                link?.userData?.harmony ??
                pair.intensity
            ) || pair.intensity;
            pair.intensity = Math.max(0.18, Math.min(1, Math.max(linkSynergy, linkStability, pair.intensity)));
            pair.beatFrequency = Math.max(
                this.config.beatFrequencyRange[0],
                Math.min(
                    this.config.beatFrequencyRange[1],
                    pair.beatFrequency + Math.sin(now * 0.85) * 0.04
                )
            );
            pair.collisionTime = now;

            const lifecycle = this.zoneLifecycles.get(zoneKey);
            if (lifecycle) {
                lifecycle.lastSeenTime = now;
            }
        }
    }

    /**
     * Get active reflections from reflection system
     */
    _getActiveReflections() {
        if (!this.reflectionSystem) return [];
        
        // Try to access reflection pulses directly
        if (this.reflectionSystem.reflectionPulsePool && Array.isArray(this.reflectionSystem.reflectionPulsePool)) {
            return this.reflectionSystem.reflectionPulsePool.filter(p => 
                p && p.active && p.intensity > this.config.minWaveIntensity
            );
        }
        
        return [];
    }

    /**
     * Check if two reflection paths are converging
     */
    _arePathsConverging(reflection1, reflection2, links) {
        const link1 = links.find(l => l && l.id === reflection1.linkId);
        const link2 = links.find(l => l && l.id === reflection2.linkId);
        
        if (!link1 || !link2) return false;
        const link1Endpoints = this._getLinkEndpoints(link1);
        const link2Endpoints = this._getLinkEndpoints(link2);
        
        const link1Start = link1Endpoints.startPos;
        const link1End = link1Endpoints.endPos;
        const link2Start = link2Endpoints.startPos;
        const link2End = link2Endpoints.endPos;
        
        if (!link1Start || !link1End || !link2Start || !link2End) return false;

        const link1StartId = this._getNodeId(link1Endpoints.startNode);
        const link1EndId = this._getNodeId(link1Endpoints.endNode);
        const link2StartId = this._getNodeId(link2Endpoints.startNode);
        const link2EndId = this._getNodeId(link2Endpoints.endNode);
        
        // Paths converge if they share an endpoint
        if (link1EndId === link2StartId || link1EndId === link2EndId ||
            link1StartId === link2StartId || link1StartId === link2EndId) {
            return true;
        }

        const threshold = this.config.pathProximityThreshold;
        const endpointPairs = [
            [link1End, link2Start],
            [link1End, link2End],
            [link1Start, link2Start],
            [link1Start, link2End]
        ];

        return endpointPairs.some(([pointA, pointB]) => {
            if (!pointA || !pointB) return false;

            const distance = typeof pointA.distanceTo === 'function'
                ? pointA.distanceTo(pointB)
                : Math.hypot(
                    (pointA.x ?? 0) - (pointB.x ?? 0),
                    (pointA.y ?? 0) - (pointB.y ?? 0),
                    (pointA.z ?? 0) - (pointB.z ?? 0)
                );

            return distance <= threshold;
        });
    }

    /**
     * Calculate phase difference between two reflections (0-1)
     */
    _calculatePhaseDifference(reflection1, reflection2) {
        const phase1 = (reflection1.phase || 0) % (Math.PI * 2);
        const phase2 = (reflection2.phase || 0) % (Math.PI * 2);
        
        let diff = Math.abs(phase1 - phase2) / (Math.PI * 2);
        
        // Normalize to 0-1 range (prefer closest match)
        if (diff > 0.5) diff = 1 - diff;
        
        return diff;
    }

    /**
     * Find convergence point (common node) for two reflections
     */
    _findConvergencePoint(reflection1, reflection2, links) {
        const link1 = links.find(l => l && l.id === reflection1.linkId);
        const link2 = links.find(l => l && l.id === reflection2.linkId);
        
        if (!link1 || !link2) return new THREE.Vector3();
        
        const link1Endpoints = this._getLinkEndpoints(link1);
        const link2Endpoints = this._getLinkEndpoints(link2);

        const link1EndId = this._getNodeId(link1Endpoints.endNode);
        const link2StartId = this._getNodeId(link2Endpoints.startNode);
        const link2EndId = this._getNodeId(link2Endpoints.endNode);
        const link1StartId = this._getNodeId(link1Endpoints.startNode);
        
        let convergenceNode = null;
        
        if (link1EndId === link2StartId) {
            convergenceNode = link1Endpoints.endNode;
        } else if (link1EndId === link2EndId) {
            convergenceNode = link1Endpoints.endNode;
        } else if (link1StartId === link2StartId) {
            convergenceNode = link1Endpoints.startNode;
        } else if (link1StartId === link2EndId) {
            convergenceNode = link1Endpoints.startNode;
        }
        
        return convergenceNode?.position || new THREE.Vector3();
    }

    /**
     * Calculate interference zones from collision pairs
     */
    _calculateInterferenceZones(deltaTime) {
        this.interferenceZones = [];
        const activeZoneKeys = new Set();
        
        this.collisionPairs.forEach(pair => {
            // Determine interference type based on phase
            const phaseDiff = pair.phaseDifference;
            
            // Waves in phase (phaseDiff ≈ 0) = constructive
            // Waves out of phase (phaseDiff ≈ 0.5) = destructive
            const isConstructive = phaseDiff < 0.25;
            
            const zoneType = isConstructive ? 'constructive' : 'destructive';
            const zoneKey = this._getZoneKey(pair.linkIds, zoneType);
            let lifecycle = this.zoneLifecycles.get(zoneKey);

            if (!lifecycle) {
                lifecycle = {
                    birthTime: this.time,
                    lastSeenTime: this.time
                };
                this.zoneLifecycles.set(zoneKey, lifecycle);
            } else {
                lifecycle.lastSeenTime = this.time;
            }

            activeZoneKeys.add(zoneKey);

            const zone = {
                linkIds: pair.linkIds,
                convergencePoint: pair.convergencePoint,
                type: zoneType,
                intensity: pair.intensity,
                beatFrequency: Math.max(
                    this.config.beatFrequencyRange[0],
                    Math.min(
                        this.config.beatFrequencyRange[1],
                        pair.beatFrequency
                    )
                ),
                birthTime: lifecycle.birthTime,
                zoneKey,
                birthSeeded: pair.birthSeeded === true,
                birthSeedZoneKey: pair.zoneKey ?? null
            };
            
            this.interferenceZones.push(zone);
        });

        this.zoneLifecycles.forEach((lifecycle, zoneKey) => {
            if (!activeZoneKeys.has(zoneKey) &&
                (this.time - lifecycle.lastSeenTime) > this.config.collisionWindowSeconds) {
                this.zoneLifecycles.delete(zoneKey);
            }
        });
    }

    /**
     * Get wave frequency (estimate from wave properties)
     */
    _getWaveFrequency(wave) {
        // If wave has explicit frequency, use it
        if (wave.frequency !== undefined) return wave.frequency;
        
        // Estimate from wavelength and speed
        const wavelength = 0.2;  // Assumed
        const speed = 1.0;       // Assumed
        return speed / wavelength;
    }

    /**
     * Calculate beat patterns from frequency differences
     */
    _calculateBeatPatterns(deltaTime) {
        this.beatPatterns = [];
        
        this.interferenceZones.forEach(zone => {
            this.beatPatterns.push({
                zone: zone,
                beatFrequency: zone.beatFrequency,
                beatPhase: this.time * zone.beatFrequency * Math.PI * 2
            });
        });
    }

    /**
     * Render interference mesh overlays
     */
    _renderInterferenceMeshes(deltaTime) {
        // Deactivate all interference meshes
        this.interferenceMeshPool.forEach(item => {
            item.active = false;
            item.mesh.visible = false;
        });
        
        if (this.interferenceZones.length === 0) return;
        
        let meshIndex = 0;
        
        this.interferenceZones.forEach(zone => {
            if (meshIndex >= this.config.maxConcurrentInterferences) return;
            
            const pattern = this.beatPatterns.find(p => p.zone === zone);
            if (!pattern) return;
            
            // Acquire mesh from pool
            const meshItem = this.interferenceMeshPool[meshIndex];
            if (!meshItem) return;
            
            meshItem.active = true;
            meshItem.mesh.visible = true;
            meshItem.zone = zone;
            meshItem.type = zone.type;
            meshItem.birthTime = zone.birthTime;
            meshItem.birthSeeded = zone.birthSeeded === true;
            meshItem.birthSeedAge = Math.max(0, this.time - (zone.birthTime ?? this.time));
            meshItem.baseColor = (zone.type === 'constructive'
                ? this.config.constructiveColor
                : this.config.destructiveColor).clone();

            // Position mesh at convergence point
            meshItem.mesh.position.copy(zone.convergencePoint);
            meshItem.baseOpacity = zone.type === 'constructive'
                ? this.config.constructiveOpacity
                : this.config.destructiveOpacity;
            
            // Scale based on intensity and beat - use proper world-space scale
            const beatAmplitude = Math.sin(pattern.beatPhase * this.config.beatMotionScale);
            const birthSeedLift = meshItem.birthSeeded
                ? 1 + Math.max(0, 1 - Math.min(1, meshItem.birthSeedAge / Math.max(0.25, this.config.peakDuration))) * 0.24
                : 1;
            const scaleFactor = Math.max(0.52, zone.intensity * (0.92 + beatAmplitude * this.config.beatAmplification) * birthSeedLift);
            const wobble = 1 + Math.abs(beatAmplitude) * 0.12;
            meshItem.mesh.scale.set(scaleFactor * wobble, scaleFactor * (0.95 + Math.abs(beatAmplitude) * 0.18), scaleFactor * wobble);
            meshItem.mesh.rotation.y = this.time * 0.22 + beatAmplitude * 0.55;
            meshItem.mesh.rotation.x = this.time * 0.14 + beatAmplitude * 0.25;
            meshItem.mesh.rotation.z = this.time * 0.09 + beatAmplitude * 0.15;

            if (zone.type === 'constructive') {
                const colorIntensity = Math.min(1, this.config.constructiveGlow * zone.intensity);
                meshItem.colorIntensity = Math.min(1, colorIntensity * (meshItem.birthSeeded ? 1.1 : 1));
                meshItem.intensity = zone.intensity * this.config.constructiveAmplification * (meshItem.birthSeeded ? 1.12 : 1);
            } else {
                const colorIntensity = Math.min(1, this.config.destructiveGlow * zone.intensity);
                meshItem.colorIntensity = Math.min(1, colorIntensity * (meshItem.birthSeeded ? 1.06 : 1));
                meshItem.intensity = zone.intensity * this.config.destructiveDamping * (meshItem.birthSeeded ? 1.06 : 1);
            }
            
            // Set material opacity based on lifecycle
            meshItem.opacityFactor = this._setMeshLifecycleOpacity(meshItem);
            const birthPulse = meshItem.birthSeeded
                ? 1 + Math.max(0, 1 - Math.min(1, meshItem.birthSeedAge / Math.max(0.2, this.config.peakDuration))) * 0.35
                : 1;
            this._applyInterferenceMaterialState(meshItem, (1 + Math.abs(beatAmplitude) * 0.18) * birthPulse);

            const pulsePart = meshItem.parts.find((part) => part.role === 'pulse');
            if (pulsePart?.mesh) {
                pulsePart.mesh.visible = meshItem.birthSeeded === true;
                if (meshItem.birthSeeded) {
                    const pulseScale = this.config.birthSeedPulseScale
                        + Math.sin(this.time * 5.4) * 0.08
                        + Math.max(0, 1 - Math.min(1, meshItem.birthSeedAge / Math.max(0.4, this.config.peakDuration))) * 0.18;
                    pulsePart.mesh.scale.setScalar(Math.max(0.88, pulseScale));
                    pulsePart.mesh.rotation.y = this.time * 0.64;
                    pulsePart.mesh.rotation.z = this.time * 0.28;
                    if (pulsePart.material?.opacity !== undefined) {
                        pulsePart.material.opacity = Math.max(
                            0.06,
                            this.config.birthSeedPulseOpacity * (0.7 + Math.abs(beatAmplitude) * 0.75)
                        );
                    }
                } else {
                    pulsePart.mesh.scale.setScalar(0.01);
                }
            }

            if (meshItem.birthSeeded) {
                meshItem.parts.forEach(({ mesh, role }) => {
                    if (!mesh || role !== 'spike') return;
                    const basePosition = mesh.userData?.basePosition;
                    const baseScale = mesh.userData?.baseScale;
                    if (basePosition?.clone) {
                        const spikePulse = 1 + Math.sin(this.time * 4.2 + basePosition.x * 2.1) * 0.12;
                        mesh.position.copy(basePosition).multiplyScalar(this.config.birthSeedSpikeBoost * spikePulse * 0.78);
                    }
                    if (baseScale?.clone) {
                        mesh.scale.copy(baseScale);
                        mesh.scale.y *= 1.08 + Math.sin(this.time * 4.2 + mesh.position.x * 2.1) * 0.16;
                    }
                });
            }
            
            // Check LOD
            if (this.config.enableLOD) {
                const cameraPos = this._resolveCameraPosition();
                if (cameraPos) {
                    const distance = zone.convergencePoint.distanceTo(cameraPos);
                    if (distance > this.config.lodDistance) {
                        meshItem.mesh.visible = false;
                    }
                }
            }
            
            meshIndex++;
        });

        this.interferenceMeshes = this.interferenceMeshPool.filter(item => item.active);
    }

    /**
     * Set mesh opacity based on lifecycle state
     */
    _setMeshLifecycleOpacity(meshItem) {
        const lifespan = this.time - meshItem.birthTime;
        
        let opacityFactor = meshItem.birthSeeded ? 1.15 : 1.0;
        
        // Emergence phase
        if (lifespan < this.config.emergenceTime) {
            opacityFactor = (lifespan / this.config.emergenceTime) * (meshItem.birthSeeded ? 1.15 : 1);
        }

        if (meshItem.birthSeeded) {
            const seedBoost = 1 + Math.max(0, 1 - Math.min(1, lifespan / Math.max(0.25, this.config.peakDuration))) * this.config.birthSeedOpacityBoost;
            opacityFactor *= seedBoost;
        }
        
        return Math.min(1.45, opacityFactor);
    }

    /**
     * Modulate interference visibility by network state
     */
    _modulateByNetworkState(deltaTime) {
        if (!this.aiNodes) return;
        
        const nodes = Array.isArray(this.aiNodes) ? this.aiNodes :
                      this.aiNodes.nodes ? this.aiNodes.nodes :
                      Object.values(this.aiNodes);
        
        // Calculate average network state
        let avgHarmony = 0, avgCorruption = 0, avgInstability = 0, avgSynergy = 0;
        let nodeCount = 0;
        
        nodes.forEach(node => {
            if (!node) return;
            avgHarmony += this._readCanonicalMetric(node, 'harmony', 0.5);
            avgCorruption += this._readCanonicalMetric(node, 'corruption', 0.5);
            avgInstability += this._readCanonicalMetric(node, 'instability', 0);
            avgSynergy += this._readCanonicalMetric(node, 'synergy', 0.5);
            nodeCount++;
        });
        
        if (nodeCount > 0) {
            avgHarmony /= nodeCount;
            avgCorruption /= nodeCount;
            avgInstability /= nodeCount;
            avgSynergy /= nodeCount;
        }
        
        // Modulate interference mesh properties
        this.interferenceMeshPool.forEach(meshItem => {
            if (!meshItem.active) return;
            
            const material = meshItem.mesh.material;
            
            // Harmony reduces interference visibility
            const harmonyFactor = 1 - avgHarmony * this.config.harmonyCancellation;
            
            // Corruption amplifies
            const corruptionFactor = 1 + avgCorruption * this.config.corruptionAmplification;
            
            // Instability adds jitter to glow
            const instabilityNoise = Math.sin(this.time * 3 + meshItem.zone.type.charCodeAt(0)) * avgInstability * this.config.instabilityNoise;
            
            // Synergy clarifies patterns
            const synergyFactor = avgSynergy * this.config.synergyClarity;
            
            // Apply modulation
            const modulation = harmonyFactor * corruptionFactor * (1 + instabilityNoise) * (1 + synergyFactor);

            this._applyInterferenceMaterialState(meshItem, modulation);
        });
    }

    /**
     * Update interference lifecycle (cleanup old patterns)
     */
    _updateInterferenceLifecycle(deltaTime) {
        const activeZoneKeys = new Set(this.interferenceZones.map(zone => zone.zoneKey));
        this.zoneLifecycles.forEach((lifecycle, zoneKey) => {
            if (activeZoneKeys.has(zoneKey)) return;
            if ((this.time - lifecycle.lastSeenTime) > this.config.collisionWindowSeconds) {
                this.zoneLifecycles.delete(zoneKey);
            }
        });
    }

    clearLink(linkOrId, sourceNode = null, targetNode = null) {
        const linkId = this._resolveLinkId(linkOrId);
        if (!linkId) return 0;

        let removed = 0;
        for (const pair of this.birthCollisionPairs.values()) {
            if (String(pair.linkId) === String(linkId) || pair.linkIds?.some((id) => String(id) === String(linkId))) {
                pair.orphaned = true;
                pair.orphanedAt = this.time;
                removed++;
            }
        }

        this.collisionPairs = this.collisionPairs.filter((pair) => {
            if (!pair) return false;
            return !(String(pair.linkId) === String(linkId) || pair.linkIds?.some((id) => String(id) === String(linkId)));
        });
        this.interferenceZones = this.interferenceZones.filter((zone) => {
            if (!zone) return false;
            return !(Array.isArray(zone.linkIds) && zone.linkIds.some((id) => String(id) === String(linkId)));
        });
        return removed;
    }

    _getZoneKey(linkIds, zoneType) {
        const normalizedLinks = Array.isArray(linkIds)
            ? linkIds.filter(Boolean).map(String).sort().join('|')
            : '';
        return `${zoneType}:${normalizedLinks}`;
    }

    _readCanonicalMetric(node, metric, fallback = 0) {
        if (!node) return fallback;
        const metricsValue = node?.userData?.metrics?.[metric];
        if (typeof metricsValue === 'number') return metricsValue;
        const userValue = node?.userData?.[metric];
        if (typeof userValue === 'number') return userValue;
        const directValue = node?.[metric];
        if (typeof directValue === 'number') return directValue;
        return fallback;
    }

    /**
     * Rebind to new scene/world after world switch
     * @param {Object} params - New references
     */
    rebind({ scene, linkingSystem, aiNodes } = {}) {
        if (scene) this.scene = scene;
        if (linkingSystem) this.linkingSystem = linkingSystem;
        if (aiNodes) this.aiNodes = aiNodes;
        
        // Clear stale state
        this.interferenceZones = [];
        this.collisionPairs = [];
        this.birthCollisionPairs.clear();
        this.interferenceMeshes = [];
        this.beatPatterns = [];
        this.zoneLifecycles.clear();
        
        console.log('[WaveInterferencePatternSystem] Rebound to new world');
    }
    
    /**
     * Dispose - cleanup
     */
    dispose() {
        // UNIFIED CLEANUP CONTRACT - Remove and dispose all tracked objects
        this._createdObjects.forEach(obj => {
            if (this.scene) this.scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        });
        this._createdObjects = [];
        
        // Clean up interference meshes
        this.interferenceMeshPool.forEach(item => {
            if (item.mesh && item.mesh.parent) {
                item.mesh.parent.remove(item.mesh);
            }
            if (item.mesh?.traverse) {
                item.mesh.traverse((child) => {
                    if (child?.material) {
                        child.material.dispose();
                    }
                });
            }
        });
        this.interferenceMeshPool = [];
        
        // Clean up materials
        if (this.constructiveMaterial) {
            this.constructiveMaterial.dispose();
        }
        if (this.destructiveMaterial) {
            this.destructiveMaterial.dispose();
        }
        if (this._coreGeometry) this._coreGeometry.dispose();
        if (this._shellGeometry) this._shellGeometry.dispose();
        if (this._spikeGeometry) this._spikeGeometry.dispose();
        if (this._birthPulseGeometry) this._birthPulseGeometry.dispose();
        
        this.zoneLifecycles.clear();
        this.birthCollisionPairs.clear();
    }

    _createInterferenceVisualItem() {
        const group = new THREE.Group();
        group.matrixAutoUpdate = true;
        group.renderOrder = this.config.interferenceRenderOrder;

        const coreMaterial = this.constructiveMaterial.clone();
        coreMaterial.opacity = this.config.constructiveOpacity;
        const shellMaterial = this.constructiveMaterial.clone();
        shellMaterial.opacity = this.config.shellOpacity;
        const spikeMaterial = this.constructiveMaterial.clone();
        spikeMaterial.opacity = this.config.constructiveOpacity * 0.95;
        const pulseMaterial = this.constructiveMaterial.clone();
        pulseMaterial.opacity = this.config.birthSeedPulseOpacity;

        const coreMesh = new THREE.Mesh(this._coreGeometry, coreMaterial);
        coreMesh.renderOrder = this.config.interferenceRenderOrder;
        group.add(coreMesh);

        const shellMesh = new THREE.Mesh(this._shellGeometry, shellMaterial);
        shellMesh.renderOrder = this.config.interferenceRenderOrder + 1;
        shellMesh.material.wireframe = true;
        group.add(shellMesh);

        const spikeMeshes = [];
        const spikeBase = new THREE.Vector3(0, 1, 0);
        const spikeCount = Math.max(1, this.config.spikeCount);
        for (let i = 0; i < spikeCount; i++) {
            const direction = this._spikeDirections[i % this._spikeDirections.length];
            if (!direction) continue;
            const spikeMesh = new THREE.Mesh(this._spikeGeometry, spikeMaterial);
            spikeMesh.renderOrder = this.config.interferenceRenderOrder + 2;
            spikeMesh.position.copy(direction).multiplyScalar(0.72);
            spikeMesh.quaternion.setFromUnitVectors(spikeBase, direction.clone().normalize());
            spikeMesh.scale.set(1, 0.8 + (i % 3) * 0.12, 1);
            spikeMesh.userData.basePosition = spikeMesh.position.clone();
            spikeMesh.userData.baseScale = spikeMesh.scale.clone();
            group.add(spikeMesh);
            spikeMeshes.push(spikeMesh);
        }

        const pulseMesh = new THREE.Mesh(this._birthPulseGeometry, pulseMaterial);
        pulseMesh.renderOrder = this.config.interferenceRenderOrder + 3;
        pulseMesh.rotation.x = Math.PI * 0.5;
        pulseMesh.visible = false;
        group.add(pulseMesh);

        return {
            mesh: group,
            parts: [
                { mesh: coreMesh, role: 'core', material: coreMesh.material },
                { mesh: shellMesh, role: 'shell', material: shellMesh.material },
                { mesh: pulseMesh, role: 'pulse', material: pulseMesh.material },
                ...spikeMeshes.map((mesh) => ({ mesh, role: 'spike', material: mesh.material }))
            ]
        };
    }

    _applyInterferenceMaterialState(meshItem, modulation = 1) {
        if (!meshItem?.parts?.length) return;

        const baseColor = meshItem.baseColor ?? (
            meshItem.zone?.type === 'constructive'
                ? this.config.constructiveColor
                : this.config.destructiveColor
        );
        const opacityFactor = Math.max(0.06, meshItem.opacityFactor ?? 1);
        const colorIntensity = Math.min(1, (meshItem.colorIntensity ?? 1) * modulation);

        meshItem.parts.forEach(({ material, role }) => {
            if (!material) return;
            const colorScale = role === 'core'
                ? 1.0
                : role === 'shell'
                    ? 0.55
                    : role === 'pulse'
                        ? 1.15
                        : 0.88;
            const opacityScale = role === 'core'
                ? 1.0
                : role === 'shell'
                    ? 0.65
                    : role === 'pulse'
                        ? 1.2
                        : 0.92;

            if (material.color) {
                material.color.setRGB(
                    baseColor.r * colorIntensity * colorScale,
                    baseColor.g * colorIntensity * colorScale,
                    baseColor.b * colorIntensity * colorScale
                );
            }

            if (material.opacity !== undefined) {
                material.opacity = Math.max(
                    0.02,
                    (meshItem.baseOpacity ?? this.config.constructiveOpacity) * opacityFactor * opacityScale * modulation
                );
            }
        });
    }

    _buildSpikeDirections() {
        const directions = [
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, -1, 0),
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, 0, -1),
            new THREE.Vector3(0.78, 0.62, 0),
            new THREE.Vector3(-0.78, 0.62, 0)
        ];
        return directions.map((dir) => dir.normalize());
    }

    _getLinkEndpoints(link) {
        const startNode = link?.sourceNode || link?.source || link?.from || link?.nodeA || null;
        const endNode = link?.targetNode || link?.target || link?.to || link?.nodeB || null;

        return {
            startNode,
            endNode,
            startPos: startNode?.position || null,
            endPos: endNode?.position || null
        };
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

    _resolveLinkById(linkOrId) {
        const linkId = this._resolveLinkId(linkOrId);
        if (!linkId || !this.linkingSystem?.links || !Array.isArray(this.linkingSystem.links)) {
            return null;
        }

        return this.linkingSystem.links.find((link) => {
            if (!link) return false;
            return String(this._resolveLinkId(link)) === String(linkId);
        }) ?? null;
    }

    _getNodeId(node) {
        return node?.id ?? node?.userData?.nodeId ?? node?.userData?.id ?? null;
    }

    _resolveCameraPosition() {
        const sceneCamera = this.scene?.getObjectByName?.('camera')?.position;
        if (sceneCamera) return sceneCamera;

        if (typeof window !== 'undefined' && window.__ATOMA_CAMERA__?.position) {
            return window.__ATOMA_CAMERA__.position;
        }

        if (globalThis.__ATOMA_CAMERA__?.position) {
            return globalThis.__ATOMA_CAMERA__.position;
        }

        return null;
    }
}

/**
 * ============================================================================
 * INTEGRATION NOTES
 * ============================================================================
 * 
 * In main.js:
 * 
 *   import { WaveInterferencePatternSystem_Session132 } 
 *     from './WaveInterferencePatternSystem_Session132.js';
 *   
 *   // In World constructor:
 *   this.waveInterference = new WaveInterferencePatternSystem_Session132(
 *       this.scene,
 *       this.influenceReflection,  // Reflection system (required)
 *       this.linkingSystem,
 *       this.aiNodes
 *   );
 *   
 *   // In setup section:
 *   this.waveInterference.setup();
 *   
 *   // In animate loop (AFTER all wave systems):
 *   if (this.waveInterference) {
 *       this.waveInterference.update(deltaTime, this.time);
 *   }
 * 
 * ============================================================================
 * SEMANTIC LANGUAGE EXTENSION (12 → 13 Dimensions)
 * ============================================================================
 * 
 * Dimension 13: Wave Interference & Resonance Amplification
 * Encodes: Constructive/destructive interference, resonance zones, beat patterns
 * Visual: Golden amplification zones, dark cancellation zones, beat modulation
 * 
 * This system adds wave dynamics:
 * - Waves interact when they meet
 * - Constructive interference amplifies (golden glow)
 * - Destructive interference cancels (dark zones)
 * - Beat patterns show frequency differences
 * - Network exhibits resonance phenomena
 * 
 * ============================================================================
 */
