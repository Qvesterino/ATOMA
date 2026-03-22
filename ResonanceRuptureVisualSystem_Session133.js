/**
 * ============================================================================
 * RESONANCE RUPTURE VISUAL SYSTEM (Session 133)
 * ============================================================================
 * 
 * PURE RENDERING SYSTEM - Visualizes Standing Wave Collapse
 * 
 * Purpose:
 * Detects when standing waves exceed stability limits and rupture,
 * releasing trapped energy in a controlled, visually coherent manner.
 * Creates pre-rupture stress indicators, rupture events, propagation paths,
 * and aftermath scars—all visual-only with zero gameplay modifications.
 * 
 * Core Philosophy:
 * - Rupture is consequence of unresolved pressure
 * - Not random; deterministic from standing wave state
 * - Violent but structured (coherence breaking, not explosion)
 * - Energy releases directionally along network topology
 * - Aftermath shows visual memory of structural failure
 * 
 * Architecture:
 * - Monitors standing wave conditions (amplitude, frequency, persistence)
 * - Calculates stress accumulation (escalation metrics)
 * - Detects rupture triggers (corruption, instability, phase divergence)
 * - Manages pre-rupture phase (visual strain indicators)
 * - Executes rupture event (phase discontinuity, energy release)
 * - Propagates energy along network paths (directional bursts)
 * - Creates and fades resonance scars (visual memory)
 * - Triggers node reactions (halo destabilization)
 * - Manages resolution paths (damping, reformation, absorption)
 * 
 * Integration:
 * - Works with StandingWaveOscillationTrapSystem (reads trap state)
 * - Works with InfluenceReflectionBackPressureSystem (reads reflections)
 * - Works with AINodes (reads node state)
 * - Visual-only, no gameplay logic changes
 * 
 * Status: PRODUCTION (Session 133)
 * 
 * ============================================================================
 */

import * as THREE from 'three';

export class ResonanceRuptureVisualSystem_Session133 {
    constructor(scene, standingWaveTrapSystem, reflectionSystem, linkingSystem, aiNodes, config = {}) {
        this.scene = scene;
        this.standingWaveTrapSystem = standingWaveTrapSystem;
        this.reflectionSystem = reflectionSystem;
        this.linkingSystem = linkingSystem;
        this.aiNodes = aiNodes;
        
        // Configuration
        this.config = {
            // Rupture detection thresholds
            stressAccumulationRate: 0.3,      // Stress buildup per second
            stressRuptureThreshold: 0.85,     // Stress level triggering rupture (0-1)
            corruptionRuptureBoost: 0.4,      // Corruption increases threshold (negative)
            instabilityRuptureBoost: 0.3,     // Instability increases threshold (negative)
            phaseDivergenceThreshold: 0.6,    // Phase incoherence triggering rupture
            amplitudeRuptureThreshold: 0.9,   // Max amplitude before rupture
            minTrapLifetime: 1.0,             // Min seconds before rupture possible
            
            // Pre-rupture stress visualization
            stressIndicatorOpacity: 0.3,      // Base opacity of stress bands
            stressCompressionFactor: 1.3,     // Link compression under stress
            stressColorIntensity: 0.7,        // Stress band brightness (red-ish)
            stressFrequencyIncrease: 1.5,     // Oscillation frequency multiplier
            stressSharpness: 0.4,             // Band edge sharpness (0=soft, 1=sharp)
            
            // Rupture event
            ruptureDuration: 0.15,            // Rupture event lifetime (seconds)
            ruptureBurst: 0.8,                // Energy burst intensity
            ruptureBurstWidth: 0.2,           // Width of rupture wavefront
            ruptureBurstColor: new THREE.Color(1.0, 0.4, 0.0),  // Orange-red
            ruptureBurstGlow: 2.5,            // Emissive intensity at rupture
            
            // Rupture propagation
            propagationSpeed: 2.0,            // Relative to normal wave speed
            propagationDistance: 3.0,         // Maximum links to propagate through
            propagationDamping: 0.85,         // Energy retention per link (0.85 = 85% retained)
            propagationPaths: 2,              // Max directional paths from rupture
            
            // Resonance scar
            scarOpacity: 0.15,                // Base scar visibility
            scarDuration: 60.0,               // Scar fade time (seconds)
            scarColor: new THREE.Color(0.5, 0.3, 0.4),  // Purple-bruise
            scarDeformation: 0.1,             // Geometric deformation amount
            scarFrequencyDamping: 0.4,        // Oscillation damping in scar
            
            // Node reaction
            haloDestabilizationAmount: 0.3,   // Halo flicker magnitude
            haloDestabilizationDuration: 0.5, // Recovery time (seconds)
            haloRecoveryRate: 0.8,            // How fast halo recovers
            
            // State modulation
            harmonyRuputrePrevention: 0.6,    // Harmony reduces rupture probability
            corruptionRuptureAcceleration: 0.4, // Corruption speeds rupture
            instabilityRuptureEarlier: 0.5,   // Instability triggers sooner
            synergyRuptureClarity: 0.7,       // Synergy makes rupture sharper
            
            // Resolution paths
            postRuptureDamping: 0.5,          // Oscillation damping after rupture
            reformationThreshold: 0.4,        // Harmony threshold for reformation
            absorptionThreshold: 0.7,         // Corruption threshold for absorption
            
            // Performance
            maxConcurrentRuptures: 5,         // Simultaneous ruptures allowed
            maxRupturePropagations: 20,       // Propagation pulses tracked
            maxResnonanceScarsMeshes: 20,     // Scar mesh pool size
            enableLOD: true,
            lodDistance: 40,
            ...config
        };
        
        // Runtime state
        this.stressAccumulation = new Map();  // trapId -> stress level (0-1)
        this.ruptures = [];                   // Active rupture events
        this.ruptureHistory = [];             // Recent ruptures (for cooldown)
        this.propagationPulses = [];          // Energy pulses propagating
        this.resonanceScars = [];             // Scar zones on links
        this.nodeReactions = new Map();       // nodeId -> reaction state
        this.preRuptureZones = [];            // Stress indicator zones
        
        // Tracking
        this.trapLifetimes = new Map();       // trapId -> time since creation
        this.trapPhaseDivergence = new Map(); // trapId -> phase incoherence
        this.ruptureOccurrences = new Map();  // linkId -> last rupture time
        
        // Object pools
        this.ruptureEventPool = [];
        this.propagationPulsePool = [];
        this.scarMeshPool = [];
        
        // Material cache
        this.stressMaterial = null;
        this.ruptureMaterial = null;
        this.propagationMaterial = null;
        this.scarMaterial = null;
        
        this.time = 0;
        this.initialized = false;
    }

    /**
     * Setup - initialize materials, pools, and resources
     */
    setup() {
        if (this.initialized) return;
        
        // Create stress indicator material (red, tension)
        this.stressMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(1.0, 0.3, 0.2),  // Red-orange
            emissive: new THREE.Color(1.0, 0.3, 0.2),
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: this.config.stressIndicatorOpacity,
            side: THREE.DoubleSide,
            depthWrite: false,
            roughness: 0.5
        });
        
        // Create rupture burst material (bright orange-red)
        this.ruptureMaterial = new THREE.MeshStandardMaterial({
            color: this.config.ruptureBurstColor,
            emissive: this.config.ruptureBurstColor,
            emissiveIntensity: this.config.ruptureBurstGlow,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
            depthWrite: false,
            roughness: 0.3,
            metalness: 0.5
        });
        
        // Create propagation pulse material
        this.propagationMaterial = new THREE.MeshStandardMaterial({
            color: this.config.ruptureBurstColor,
            emissive: this.config.ruptureBurstColor,
            emissiveIntensity: 1.5,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
            depthWrite: false,
            roughness: 0.4,
            metalness: 0.4
        });
        
        // Create resonance scar material (purple-bruise)
        this.scarMaterial = new THREE.MeshStandardMaterial({
            color: this.config.scarColor,
            emissive: this.config.scarColor,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: this.config.scarOpacity,
            side: THREE.DoubleSide,
            depthWrite: false,
            roughness: 0.9
        });
        
        // Pre-allocate rupture event pool
        for (let i = 0; i < this.config.maxConcurrentRuptures; i++) {
            this.ruptureEventPool.push({
                active: false,
                linkId: null,
                trapId: null,
                convergencePoint: new THREE.Vector3(),
                life: 0,
                maxLife: this.config.ruptureDuration,
                intensity: 1,
                burstMesh: null,
                phase: 0
            });
        }
        
        // Pre-allocate propagation pulse pool
        for (let i = 0; i < this.config.maxRupturePropagations; i++) {
            this.propagationPulsePool.push({
                active: false,
                startLink: null,
                currentLink: null,
                pathDistance: 0,
                life: 0,
                intensity: 1,
                direction: new THREE.Vector3(),
                mesh: null
            });
        }
        
        // Pre-allocate scar mesh pool
        for (let i = 0; i < this.config.maxResnonanceScarsMeshes; i++) {
            const geometry = new THREE.PlaneGeometry(1, 0.1);
            const mesh = new THREE.Mesh(geometry, this.scarMaterial.clone());
            mesh.visible = false;
            mesh.renderOrder = 7;
            this.scene.add(mesh);
            this.scarMeshPool.push({
                mesh: mesh,
                active: false,
                scarData: null,
                birthTime: 0
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
        
        this.time = currentTime;
        
        // Step 1: Monitor standing waves for stress accumulation
        this._updateStressAccumulation(deltaTime);
        
        // Step 2: Detect rupture conditions
        this._detectRuptureConditions(deltaTime);
        
        // Step 3: Update pre-rupture stress zones
        this._updatePreRuptureIndicators(deltaTime);
        
        // Step 4: Execute rupture events
        this._executeRuptureEvents(deltaTime);
        
        // Step 5: Manage rupture propagation
        this._updateRupturePropagation(deltaTime);
        
        // Step 6: Manage resonance scars
        this._updateResonanceScars(deltaTime);
        
        // Step 7: Handle node reactions
        this._updateNodeReactions(deltaTime);
        
        // Step 8: Apply state modulation
        this._modulateByNetworkState(deltaTime);
    }

    /**
     * Monitor standing waves and accumulate stress
     */
    _updateStressAccumulation(deltaTime) {
        if (!this.standingWaveTrapSystem) return;
        
        const traps = this.standingWaveTrapSystem.oscillationTraps || [];
        
        traps.forEach(trap => {
            if (!trap.active) return;
            
            const trapId = trap.linkId;
            
            // Track trap lifetime
            let lifetime = this.trapLifetimes.get(trapId) || 0;
            lifetime += deltaTime;
            this.trapLifetimes.set(trapId, lifetime);
            
            // Get or initialize stress level
            let stress = this.stressAccumulation.get(trapId) || 0;
            
            // Only accumulate stress if trap is mature
            if (lifetime > this.config.minTrapLifetime) {
                // Base stress accumulation
                let stressIncrease = this.config.stressAccumulationRate * deltaTime;
                
                // Increase stress with amplitude
                stressIncrease *= (trap.amplitude + 0.5);
                
                // Increase stress with reflection count
                stressIncrease *= Math.min(1, (trap.reflectionCount || 1) * 0.2);
                
                stress = Math.min(1, stress + stressIncrease);
            }
            
            this.stressAccumulation.set(trapId, stress);
        });
        
        // Clean up stress for inactive traps
        this.stressAccumulation.forEach((stress, trapId) => {
            const trapActive = traps.some(t => t.active && t.linkId === trapId);
            if (!trapActive) {
                this.stressAccumulation.delete(trapId);
                this.trapLifetimes.delete(trapId);
            }
        });
    }

    /**
     * Detect rupture conditions and trigger ruptures
     */
    _detectRuptureConditions(deltaTime) {
        if (!this.standingWaveTrapSystem) return;
        
        const traps = this.standingWaveTrapSystem.oscillationTraps || [];
        
        traps.forEach(trap => {
            if (!trap.active) return;
            
            const trapId = trap.linkId;
            const stress = this.stressAccumulation.get(trapId) || 0;
            
            // Get node metrics for modulation
            const nodeA = trap.nodeA || {};
            const nodeB = trap.nodeB || {};
            const avgCorruption =
                (this._readNodeMetric(nodeA, 'corruption', 0.5) + this._readNodeMetric(nodeB, 'corruption', 0.5)) * 0.5;
            const avgInstability =
                (this._readNodeMetric(nodeA, 'instability', 0) + this._readNodeMetric(nodeB, 'instability', 0)) * 0.5;
            
            // Calculate effective rupture threshold
            let threshold = this.config.stressRuptureThreshold;
            threshold -= avgCorruption * this.config.corruptionRuptureBoost;
            threshold -= avgInstability * this.config.instabilityRuptureBoost;
            threshold = Math.max(0.3, Math.min(1.0, threshold));
            
            // Check rupture conditions
            const stressExceeds = stress > threshold;
            const amplitudeExceeds = trap.amplitude > this.config.amplitudeRuptureThreshold;
            const ruptureRecent = this._isRuptureRecent(trapId);
            
            if ((stressExceeds || amplitudeExceeds) && !ruptureRecent) {
                // Trigger rupture
                this._triggerRupture(trap, stress, deltaTime);
            }
        });
    }

    /**
     * Check if rupture occurred recently (cooldown)
     */
    _isRuptureRecent(trapId) {
        const lastRupture = this.ruptureOccurrences.get(trapId) || -10;
        return this.time - lastRupture < 2.0;  // 2 second cooldown
    }

    /**
     * Trigger a rupture event
     */
    _triggerRupture(trap, stress, deltaTime) {
        const trapId = trap.linkId;
        
        // Acquire rupture event from pool
        const rupture = this.ruptureEventPool.find(r => !r.active);
        if (!rupture) return;
        
        // Find convergence point
        const link = this._getLinkById(trapId);
        if (!link) return;
        
        const convergencePoint = this._getLinkTarget(link)?.position;
        if (!convergencePoint) return;
        
        // Set up rupture
        rupture.active = true;
        rupture.linkId = trapId;
        rupture.trapId = trapId;
        rupture.convergencePoint.copy(convergencePoint);
        rupture.life = 0;
        rupture.intensity = Math.min(1, stress * 1.2);
        
        this.ruptures.push(rupture);
        this.ruptureOccurrences.set(trapId, this.time);
        
        // Reset stress
        this.stressAccumulation.set(trapId, 0);
        
        // Trigger node reactions
        this._triggerNodeReactions(trap.nodeA, rupture.intensity);
        this._triggerNodeReactions(trap.nodeB, rupture.intensity);

        // PATCH 1: Trigger cascading rupture if available
        if (this.cascadingRuptureSystem && trap.nodeA && this.cascadingRuptureSystem.enabled) {
            this.cascadingRuptureSystem.initiateCascade(trap.nodeA, this.time);
        }

        // Initiate propagation
        this._initiatePropagation(link, rupture.intensity);
        
        // Create resonance scar
        this._createResonanceScar(trapId, trap, rupture.intensity);

        // Cascade trigger is handled above via initiateCascade() to avoid duplicate/invalid calls.
    }

    /**
     * Update pre-rupture stress indicator zones
     */
    _updatePreRuptureIndicators(deltaTime) {
        this.preRuptureZones = [];
        
        if (!this.standingWaveTrapSystem) return;
        
        const traps = this.standingWaveTrapSystem.oscillationTraps || [];
        
        traps.forEach(trap => {
            if (!trap.active) return;
            
            const trapId = trap.linkId;
            const stress = this.stressAccumulation.get(trapId) || 0;
            
            // Only show stress zones when stress > 50%
            if (stress > 0.5) {
                this.preRuptureZones.push({
                    trap: trap,
                    stress: stress,
                    linkId: trapId,
                    intensity: Math.pow(stress - 0.5, 1.5)  // Sharpen at higher stress
                });
            }
        });
    }

    /**
     * Execute active rupture events
     */
    _executeRuptureEvents(deltaTime) {
        this.ruptures = this.ruptures.filter(rupture => {
            rupture.life += deltaTime;
            
            // Create visual burst
            if (!rupture.burstMesh) {
                rupture.burstMesh = this._createRuptureBurst(rupture);
            }
            
            // Update burst appearance
            if (rupture.burstMesh) {
                const progress = rupture.life / rupture.maxLife;
                rupture.burstMesh.material.opacity = rupture.intensity * (1 - progress);
                rupture.burstMesh.material.emissiveIntensity = 
                    this.config.ruptureBurstGlow * (1 - progress);
                
                // Scale burst outward
                const scale = 1 + progress * 2;
                rupture.burstMesh.scale.set(scale, scale, scale);
            }
            
            if (rupture.life >= rupture.maxLife) {
                // FIX 1: Remove burst mesh from scene and reset pool item
                if (rupture.burstMesh) {
                    this.scene.remove(rupture.burstMesh);
                    rupture.burstMesh.geometry.dispose();
                    rupture.burstMesh.material.dispose();
                    rupture.burstMesh = null;
                }
                rupture.active = false;
                return false;
            }
            
            return true;
        });
    }

    /**
     * Create visual burst mesh for rupture
     */
    _createRuptureBurst(rupture) {
        const geometry = new THREE.IcosahedronGeometry(0.3, 3);
        const mesh = new THREE.Mesh(geometry, this.ruptureMaterial.clone());
        mesh.position.copy(rupture.convergencePoint);
        mesh.renderOrder = 12;
        this.scene.add(mesh);
        return mesh;
    }

    /**
     * Initiate rupture propagation along network
     */
    _initiatePropagation(originLink, intensity) {
        if (!originLink || !this.linkingSystem) return;
        
        // Find adjacent links
        const targetNode = this._getLinkTarget(originLink);
        if (!targetNode) return;
        
        const adjacentLinks = this._findAdjacentLinks(targetNode, originLink);
        
        // Propagate up to maxPropagationPaths
        const pathsToPropagate = Math.min(
            this.config.propagationPaths,
            adjacentLinks.length
        );
        
        for (let i = 0; i < pathsToPropagate; i++) {
            const pulse = this.propagationPulsePool.find(p => !p.active);
            if (!pulse) break;
            
            pulse.active = true;
            pulse.startLink = adjacentLinks[i];
            pulse.currentLink = adjacentLinks[i];
            pulse.pathDistance = 0;
            pulse.life = 0;
            pulse.intensity = intensity * this.config.propagationDamping;

            // FIX 2: Create visual mesh for propagation pulse
            const geo = new THREE.SphereGeometry(0.15, 6, 6);
            const mat = this.propagationMaterial.clone();
            const mesh = new THREE.Mesh(geo, mat);
            mesh.renderOrder = 10;
            this.scene.add(mesh);
            pulse.mesh = mesh;
            
            this.propagationPulses.push(pulse);
        }
    }

    /**
     * Find adjacent links from a node
     */
    _findAdjacentLinks(node, excludeLink) {
        if (!this.linkingSystem) return [];
        
        const links = this.linkingSystem.links || [];
        const adjacent = [];
        
        links.forEach(link => {
            if (!link || link.id === excludeLink.id) return;
            
            const sourceNode = this._getLinkSource(link);
            const targetNode = this._getLinkTarget(link);
            const sourceId = this._getNodeId(sourceNode);
            const targetId = this._getNodeId(targetNode);
            const currentNodeId = this._getNodeId(node);
            const isAdjacentSource = sourceId === currentNodeId;
            const isAdjacentTarget = targetId === currentNodeId;
            
            if (isAdjacentSource || isAdjacentTarget) {
                adjacent.push(link);
            }
        });
        
        return adjacent;
    }

    /**
     * Update rupture propagation pulses
     */
    _updateRupturePropagation(deltaTime) {
        this.propagationPulses = this.propagationPulses.filter(pulse => {
            pulse.life += deltaTime;
            
            const propagationDuration = 0.3;  // Duration of propagation per link
            const linkProgress = (pulse.life % propagationDuration) / propagationDuration;
            
            // Advance to next link if progress exceeds threshold
            if (pulse.life > propagationDuration * (pulse.pathDistance + 1)) {
                const nextNode = this._getLinkTarget(pulse.currentLink);
                const nextLinks = this._findAdjacentLinks(nextNode, pulse.currentLink);
                
                if (nextLinks.length > 0 && pulse.pathDistance < this.config.propagationDistance) {
                    pulse.currentLink = nextLinks[0];
                    pulse.pathDistance++;
                    pulse.intensity *= this.config.propagationDamping;
                } else {
                    this._disposePropagationPulse(pulse);
                    return false;
                }
            }

            // FIX 2: Update pulse mesh position along current link
            if (pulse.mesh) {
                const src = this._getLinkSource(pulse.currentLink)?.position;
                const tgt = this._getLinkTarget(pulse.currentLink)?.position;
                if (src && tgt) {
                    pulse.mesh.position.lerpVectors(src, tgt, linkProgress);
                }
                pulse.mesh.material.opacity = pulse.intensity * 0.6;
            }

            if (pulse.life >= propagationDuration * this.config.propagationDistance) {
                // FIX 4: Reset pool item and remove mesh
                this._disposePropagationPulse(pulse);
                return false;
            }
            
            return true;
        });
    }

    _disposePropagationPulse(pulse) {
        if (pulse.mesh) {
            this.scene.remove(pulse.mesh);
            pulse.mesh.geometry.dispose();
            pulse.mesh.material.dispose();
            pulse.mesh = null;
        }
        pulse.active = false;
    }

    /**
     * Create resonance scar on affected link
     */
    _createResonanceScar(linkId, trap, intensity) {
        const link = this._getLinkById(linkId);
        if (!link) return;
        
        // Acquire scar mesh from pool
        const scarMesh = this.scarMeshPool.find(s => !s.active);
        if (!scarMesh) return;
        
        scarMesh.active = true;
        scarMesh.birthTime = this.time;
        scarMesh.mesh.visible = true;
        
        // Position scar at link center
        const startPos = this._getLinkSource(link)?.position;
        const endPos = this._getLinkTarget(link)?.position;
        
        if (startPos && endPos) {
            const scarCenter = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
            scarMesh.mesh.position.copy(scarCenter);
            
            // Orient along link
            scarMesh.mesh.lookAt(endPos);
            scarMesh.mesh.rotateX(Math.PI * 0.5);
            
            // Scale to link length
            const linkLength = startPos.distanceTo(endPos);
            scarMesh.mesh.scale.set(linkLength * 0.5, 0.1, 1);
        }
        
        this.resonanceScars.push({
            mesh: scarMesh,
            linkId: linkId,
            intensity: intensity,
            birthTime: this.time
        });
    }

    /**
     * Update resonance scars (fade over time)
     */
    _updateResonanceScars(deltaTime) {
        this.resonanceScars = this.resonanceScars.filter(scar => {
            const age = this.time - scar.birthTime;
            const progress = age / this.config.scarDuration;
            
            if (progress >= 1) {
                scar.mesh.active = false;
                scar.mesh.mesh.visible = false;
                return false;
            }
            
            // Fade scar
            scar.mesh.mesh.material.opacity = 
                this.config.scarOpacity * scar.intensity * (1 - progress);
            
            return true;
        });
    }

    /**
     * Trigger node halo reaction
     */
    _triggerNodeReactions(node, intensity) {
        const nodeId = this._getNodeId(node);
        if (!node || nodeId === undefined || nodeId === null) return;
        
        const existing = this.nodeReactions.get(nodeId);
        
        if (existing) {
            existing.intensity = Math.max(existing.intensity, intensity);
            existing.startTime = this.time;
        } else {
            this.nodeReactions.set(nodeId, {
                node: node,
                startTime: this.time,
                intensity: intensity,
                phase: 0
            });
        }
    }

    /**
     * Update node halo reactions
     */
    _updateNodeReactions(deltaTime) {
        this.nodeReactions.forEach((reaction, nodeId) => {
            const elapsed = this.time - reaction.startTime;
            const progress = elapsed / this.config.haloDestabilizationDuration;
            
            if (progress >= 1) {
                this.nodeReactions.delete(nodeId);
                return;
            }
            
            // Apply destabilization to node
            if (reaction.node && reaction.node.shell) {
                const material = reaction.node.shell.material;
                if (material) {
                    // Destabilize with jitter
                    const jitter = Math.sin(this.time * 8) * this.config.haloDestabilizationAmount;
                    const recovery = 1 - progress * this.config.haloRecoveryRate;
                    
                    material.opacity = (reaction.node.shell.material.opacity || 0.15) + jitter * recovery;
                }
            }
        });
    }

    /**
     * Modulate rupture visuals by network state
     */
    _modulateByNetworkState(deltaTime) {
        if (!this.aiNodes) return;
        
        const nodes = Array.isArray(this.aiNodes) ? this.aiNodes :
                      this.aiNodes.nodes ? this.aiNodes.nodes :
                      Object.values(this.aiNodes);
        
        // Calculate network averages
        let avgHarmony = 0, avgCorruption = 0, avgSynergy = 0;
        let nodeCount = 0;
        
        nodes.forEach(node => {
            if (!node) return;
            avgHarmony += this._readNodeMetric(node, 'harmony', 0.5);
            avgCorruption += this._readNodeMetric(node, 'corruption', 0.5);
            avgSynergy += this._readNodeMetric(node, 'synergy', 0.5);
            nodeCount++;
        });
        
        if (nodeCount > 0) {
            avgHarmony /= nodeCount;
            avgCorruption /= nodeCount;
            avgSynergy /= nodeCount;
        }
        
        // Modulate active ruptures
        this.ruptures.forEach(rupture => {
            if (!rupture.burstMesh) return;
            
            // Harmony weakens rupture visibility
            let harmonyFactor = 1 - avgHarmony * this.config.harmonyRuputrePrevention;
            
            // Corruption strengthens rupture
            let corruptionFactor = 1 + avgCorruption * this.config.corruptionRuptureAcceleration;
            
            // Synergy clarifies rupture appearance
            let synergyFactor = 1 + avgSynergy * this.config.synergyRuptureClarity;
            
            const modulation = harmonyFactor * corruptionFactor * synergyFactor;
            rupture.burstMesh.material.emissiveIntensity *= modulation;
        });
        
        // Modulate scars — opacity is managed by _updateResonanceScars; skip per-frame multiplication here
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
        // Clean up burst meshes
        this.ruptures.forEach(rupture => {
            if (rupture.burstMesh && rupture.burstMesh.parent) {
                rupture.burstMesh.parent.remove(rupture.burstMesh);
            }
        });
        this.ruptures = [];
        
        // Clean up scar meshes
        this.scarMeshPool.forEach(item => {
            if (item.mesh && item.mesh.parent) {
                item.mesh.parent.remove(item.mesh);
            }
            if (item.mesh.geometry) {
                item.mesh.geometry.dispose();
            }
            if (item.mesh.material) {
                item.mesh.material.dispose();
            }
        });
        this.scarMeshPool = [];
        
        // Clean up materials
        if (this.stressMaterial) this.stressMaterial.dispose();
        if (this.ruptureMaterial) this.ruptureMaterial.dispose();
        if (this.propagationMaterial) this.propagationMaterial.dispose();
        if (this.scarMaterial) this.scarMaterial.dispose();
        
        // Clear maps
        this.stressAccumulation.clear();
        this.trapLifetimes.clear();
        this.ruptureOccurrences.clear();
        this.nodeReactions.clear();
    }
}

/**
 * ============================================================================
 * INTEGRATION NOTES
 * ============================================================================
 * 
 * In main.js:
 * 
 *   import { ResonanceRuptureVisualSystem_Session133 } 
 *     from './ResonanceRuptureVisualSystem_Session133.js';
 *   
 *   // In World constructor:
 *   this.resonanceRupture = new ResonanceRuptureVisualSystem_Session133(
 *       this.scene,
 *       this.standingWaveTrap,       // Trap system (required)
 *       this.influenceReflection,    // Reflection system (optional)
 *       this.linkingSystem,
 *       this.aiNodes
 *   );
 *   
 *   // In setup section:
 *   this.resonanceRupture.setup();
 *   
 *   // In animate loop (AFTER all wave systems):
 *   if (this.resonanceRupture) {
 *       this.resonanceRupture.update(deltaTime, this.time);
 *   }
 * 
 * ============================================================================
 * SEMANTIC LANGUAGE EXTENSION (13 → 14 Dimensions)
 * ============================================================================
 * 
 * Dimension 14: Resonance Rupture & Structural Failure
 * Encodes: Coherence breakdown, pressure release, aftermath memory
 * Visual: Red stress zones, orange rupture bursts, purple scars
 * 
 * This system completes the wave visualization:
 * - Waves can fail under pressure
 * - Failure is visible, not hidden
 * - Aftermath remains (scars) as network memory
 * - Nodes react to structural failure
 * - Visual consequence makes network feel alive and fragile
 * 
 * ============================================================================
 */
