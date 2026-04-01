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
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

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

            // Event-driven rupture pressure
            eventPressureDecayRate: 0.18,     // Decay per second for per-link event pressure (slower = longer trigger memory)
            globalStressBiasDecayRate: 0.14,  // Decay per second for network-level stress bias (slower)
            eventPressureWeight: 0.55,        // Total pressure weight for event pressure
            trapStressWeight: 0.30,           // Total pressure weight for trap stress
            amplitudeWeight: 0.15,            // Total pressure weight for normalized amplitude
            amplitudeNormalizationScale: 1.2, // Amplitude value mapped to normalized 1.0
            hardAmplitudeTrigger: 1.15,       // Failsafe amplitude trigger
            ruptureCooldownSec: 1.25,         // Global rupture cooldown per link

            // Weighted score trigger (replaces strict hard-gate style conditions)
            scoreEventWeight: 0.45,
            scoreStressWeight: 0.30,
            scoreAmplitudeWeight: 0.15,
            scoreCorruptionWeight: 0.06,
            scoreInstabilityWeight: 0.04,
            ruptureScoreThresholdOffset: -0.05, // Slightly easier than raw threshold
            softAmplitudeAssistFactor: 0.85,    // Near-threshold amplitude assistance
            
            // Pre-rupture stress visualization
            stressIndicatorOpacity: 0.3,      // Base opacity of stress bands
            stressCompressionFactor: 1.3,     // Link compression under stress
            stressColorIntensity: 0.7,        // Stress band brightness (red-ish)
            stressFrequencyIncrease: 1.5,     // Oscillation frequency multiplier
            stressSharpness: 0.4,             // Band edge sharpness (0=soft, 1=sharp)
            
            // Rupture event
            ruptureDuration: 1.5,             // Rupture event lifetime (seconds)
            ruptureBurst: 0.8,                // Energy burst intensity
            ruptureBurstWidth: 0.2,           // Width of rupture wavefront
            ruptureBurstColor: new THREE.Color(1.0, 0.4, 0.0),  // Orange-red
            ruptureBurstGlow: 2.5,            // Emissive intensity at rupture
            
            // Rupture propagation
            propagationSpeed: 2.0,            // Relative to normal wave speed
            propagationDistance: 3.0,         // Maximum links to propagate through
            propagationDamping: 0.85,         // Energy retention per link (0.85 = 85% retained)
            propagationPaths: 2,              // Max directional paths from rupture
            propagationDuration: 1.0,         // Visible time budget per propagation pulse (seconds)
            
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
            harmonyRupturePrevention: 0.6,    // Harmony reduces rupture probability
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
            maxResonanceScarsMeshes: 20,      // Scar mesh pool size
            renderOrder: VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_LINK_RESONANCE),
            enableLOD: true,
            lodDistance: 40,
            ...config
        };
        
        // Runtime state
        this.stressAccumulation = new Map();  // trapId -> stress level (0-1)
        this.ruptures = [];                   // Active rupture events
        this.propagationPulses = [];          // Energy pulses propagating
        this.resonanceScars = [];             // Scar zones on links
        this.nodeReactions = new Map();       // nodeId -> reaction state
        this.preRuptureZones = [];            // Stress indicator zones
        
        // Tracking
        this.trapLifetimes = new Map();       // trapId -> time since creation
        this.trapPhaseDivergence = new Map(); // trapId -> { lastPhase, divergence }
        this.ruptureOccurrences = new Map();  // linkId -> last rupture time
        this.eventPressureByLink = new Map(); // linkId -> event pressure (0-1)
        this.globalStressBias = 0;            // network-level event pressure bias
        this.semanticUnsubscribers = [];      // semantic bus unsubscriber callbacks
        this.boundSemanticBus = null;
        
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
        this.neutralCascadeParticleColor = new THREE.Color(0.75, 0.8, 0.9);
    }

    /**
     * Setup - initialize materials, pools, and resources
     */
    setup() {
        if (this.initialized) return;
        
        // Create stress indicator material (red, tension) - additive blending for glow
        this.stressMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(1.0, 0.3, 0.2),  // Red-orange
            transparent: true,
            opacity: this.config.stressIndicatorOpacity,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        // Create rupture burst material (bright orange-red) - additive blending for glow
        this.ruptureMaterial = new THREE.MeshBasicMaterial({
            color: this.config.ruptureBurstColor,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        // Create propagation pulse material - additive blending for glow
        this.propagationMaterial = new THREE.MeshBasicMaterial({
            color: this.config.ruptureBurstColor,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        // Create resonance scar material (purple-bruise) - additive blending for subtle glow
        this.scarMaterial = new THREE.MeshBasicMaterial({
            color: this.config.scarColor,
            transparent: true,
            opacity: this.config.scarOpacity,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
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
        
        // Pre-allocate scar mesh pool - use proper base geometry, scale at runtime
        const maxScarMeshes = this.config.maxResonanceScarsMeshes ?? 20;
        for (let i = 0; i < maxScarMeshes; i++) {
            // Base geometry of 1x1, will be scaled appropriately at runtime
            const geometry = new THREE.PlaneGeometry(1, 1);
            const mesh = new THREE.Mesh(geometry, this.scarMaterial.clone());
            mesh.visible = false;
            mesh.renderOrder = this.config.renderOrder;
            this.scene.add(mesh);
            this.scarMeshPool.push({
                mesh: mesh,
                active: false,
                scarData: null,
                birthTime: 0
            });
        }
        
        this.initialized = true;
        this._ensureSemanticBindings();
    }

    /**
     * Update - primary frame update
     * @param {number} deltaTime - Elapsed time since last frame
     * @param {number} currentTime - Total simulation time
     */
    update(deltaTime, currentTime) {
        if (!this.initialized) this.setup();

        this.time = currentTime;
        this._ensureSemanticBindings();
        this._ensureCanonicalLinkDefaults();

        // Step 1: Monitor standing waves for stress accumulation
        this._updateStressAccumulation(deltaTime);

        // Step 1.5: Decay semantic event pressure
        this._updateEventPressure(deltaTime);
        
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

        // Step 6.5: Write rupture canonical link metrics
        this._updateRuptureCanonicalLinkMetrics(deltaTime);
        
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
            const phaseDivergence = this._calculateTrapPhaseDivergence(trapId, trap.phase ?? 0);
            
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

                // Phase divergence increases accumulated strain once it exceeds the configured threshold.
                if (phaseDivergence > this.config.phaseDivergenceThreshold) {
                    stressIncrease *= 1 + (phaseDivergence - this.config.phaseDivergenceThreshold);
                }
                
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
                this.trapPhaseDivergence.delete(trapId);
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
            const phaseDivergenceState = this.trapPhaseDivergence.get(trapId);
            const phaseDivergence = phaseDivergenceState?.divergence || 0;
            const phaseDivergenceBoost = phaseDivergence > this.config.phaseDivergenceThreshold ? phaseDivergence : 0;
            const link = this._getLinkById(trapId);
            const canonicalPressure = this._readCanonicalLinkPressure(link);
            const eventPressure = Math.max(
                this.eventPressureByLink.get(String(trapId)) || 0,
                canonicalPressure
            );
            
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
            const normalizedAmplitude = THREE.MathUtils.clamp(
                (trap.amplitude || 0) / this.config.amplitudeNormalizationScale,
                0,
                1
            );
            const totalPressure = THREE.MathUtils.clamp(
                eventPressure * this.config.eventPressureWeight +
                stress * this.config.trapStressWeight +
                normalizedAmplitude * this.config.amplitudeWeight +
                this.globalStressBias,
                0,
                1
            );
            const ruptureScore = THREE.MathUtils.clamp(
                eventPressure * this.config.scoreEventWeight +
                stress * this.config.scoreStressWeight +
                normalizedAmplitude * this.config.scoreAmplitudeWeight +
                phaseDivergenceBoost * 0.12 +
                avgCorruption * this.config.scoreCorruptionWeight +
                avgInstability * this.config.scoreInstabilityWeight +
                this.globalStressBias,
                0,
                1
            );
            const scoreThreshold = THREE.MathUtils.clamp(
                threshold + this.config.ruptureScoreThresholdOffset,
                0.25,
                1.0
            );

            const scoreExceeds = ruptureScore > scoreThreshold;
            const softAmplitudeAssist =
                normalizedAmplitude > (this.config.amplitudeRuptureThreshold * this.config.softAmplitudeAssistFactor) &&
                ruptureScore > (scoreThreshold * 0.9);
            const amplitudeHardExceeds = (trap.amplitude || 0) > Math.max(
                this.config.amplitudeRuptureThreshold,
                this.config.hardAmplitudeTrigger
            );
            const ruptureRecent = this._isRuptureRecent(trapId);

            if ((scoreExceeds || softAmplitudeAssist || amplitudeHardExceeds) && !ruptureRecent) {
                // Trigger rupture
                this._triggerRupture(trap, Math.max(stress, totalPressure, ruptureScore), deltaTime);
            }
        });
    }

    /**
     * Check if rupture occurred recently (cooldown)
     */
    _isRuptureRecent(trapId) {
        const lastRupture = this.ruptureOccurrences.get(trapId) || -10;
        return this.time - lastRupture < this.config.ruptureCooldownSec;
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
        const rupturePoint = this._getLinkCenterPosition(link) || convergencePoint;
        if (!rupturePoint) return;
        
        // Set up rupture
        rupture.active = true;
        rupture.linkId = trapId;
        rupture.trapId = trapId;
        rupture.convergencePoint.copy(rupturePoint);
        rupture.life = 0;
        rupture.maxLife = this.config.ruptureDuration;
        rupture.intensity = Math.min(1, stress * 1.2);
        
        this.ruptures.push(rupture);
        this.ruptureOccurrences.set(trapId, this.time);
        
        // Reset stress
        this.stressAccumulation.set(trapId, 0);
        this.eventPressureByLink.set(String(trapId), 0);
        
        // Trigger node reactions
        this._triggerNodeReactions(trap.nodeA, rupture.intensity);
        this._triggerNodeReactions(trap.nodeB, rupture.intensity);

        // PATCH 1: Trigger cascading rupture if available
        if (this.cascadingRuptureSystem && trap.nodeA && this.cascadingRuptureSystem.enabled) {
            this.cascadingRuptureSystem.initiateCascade(trap.nodeA, this.time, rupture.intensity);
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
                    linkId: trapId,
                    stress: stress,
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
                // For MeshBasicMaterial with additive blending, modulate color intensity
                const colorIntensity = Math.min(1, this.config.ruptureBurstGlow * (1 - progress));
                rupture.burstMesh.material.color.setRGB(
                    this.config.ruptureBurstColor.r * colorIntensity,
                    this.config.ruptureBurstColor.g * colorIntensity,
                    this.config.ruptureBurstColor.b * colorIntensity
                );
                
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
        mesh.renderOrder = this.config.renderOrder;
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
            mesh.renderOrder = this.config.renderOrder;
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
            
            const propagationDuration = this.config.propagationDuration || 0.3;  // Duration of propagation per link
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
            
            // Scale to link length with proper world-space dimensions
            const linkLength = startPos.distanceTo(endPos);
            // X = width along link, Y = thickness (perpendicular), Z = height
            scarMesh.mesh.scale.set(Math.max(1, linkLength * 0.8), Math.max(0.5, linkLength * 0.1), 1);
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
                const finishedShell = reaction.node?.shell || reaction.node?.holoShell || reaction.node?.userData?.holoShell || null;
                const finishedMaterial = finishedShell?.material;
                if (finishedMaterial?.userData?.__ruptureBaseOpacity !== undefined) {
                    finishedMaterial.opacity = finishedMaterial.userData.__ruptureBaseOpacity;
                }
                this.nodeReactions.delete(nodeId);
                return;
            }
            
            // Apply destabilization to node
            if (reaction.node) {
                const shell = reaction.node.shell || reaction.node.holoShell || reaction.node.userData?.holoShell || null;
                const material = shell?.material;
                if (material) {
                    // Destabilize with jitter
                    const jitter = Math.sin(this.time * 8) * this.config.haloDestabilizationAmount;
                    const recovery = 1 - progress * this.config.haloRecoveryRate;

                    material.userData ??= {};
                    if (material.userData.__ruptureBaseOpacity === undefined) {
                        material.userData.__ruptureBaseOpacity = Number.isFinite(material.opacity)
                            ? material.opacity
                            : 0.15;
                    }

                    material.opacity = THREE.MathUtils.clamp(
                        material.userData.__ruptureBaseOpacity + jitter * recovery,
                        0,
                        1
                    );
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
            const harmonyFactor = 1 - avgHarmony * this.config.harmonyRupturePrevention;
            
            // Corruption strengthens rupture
            const corruptionFactor = 1 + avgCorruption * this.config.corruptionRuptureAcceleration;
            
            // Synergy clarifies rupture appearance
            const synergyFactor = 1 + avgSynergy * this.config.synergyRuptureClarity;
            
            const modulation = harmonyFactor * corruptionFactor * synergyFactor;
            // For MeshBasicMaterial with additive blending, modulate color intensity
            const baseColor = this.config.ruptureBurstColor;
            const currentIntensity = rupture.burstMesh.material.opacity;
            const colorIntensity = Math.min(1, currentIntensity * modulation);
            rupture.burstMesh.material.color.setRGB(
                baseColor.r * colorIntensity,
                baseColor.g * colorIntensity,
                baseColor.b * colorIntensity
            );
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

    _getLinkCenterPosition(link) {
        const sourcePosition = this._getLinkSource(link)?.position;
        const targetPosition = this._getLinkTarget(link)?.position;

        if (!sourcePosition || !targetPosition) return null;

        return new THREE.Vector3().addVectors(sourcePosition, targetPosition).multiplyScalar(0.5);
    }

    _normalizePhase(phase = 0) {
        const fullTurn = Math.PI * 2;
        const normalized = phase % fullTurn;
        return normalized < 0 ? normalized + fullTurn : normalized;
    }

    _calculateTrapPhaseDivergence(trapId, phase) {
        const normalizedPhase = this._normalizePhase(phase);
        const previousState = this.trapPhaseDivergence.get(trapId);
        const previousPhase = typeof previousState?.lastPhase === 'number'
            ? previousState.lastPhase
            : null;

        let divergence = 0;
        if (previousPhase !== null) {
            const delta = Math.abs(normalizedPhase - previousPhase);
            const wrappedDelta = Math.min(delta, (Math.PI * 2) - delta);
            divergence = THREE.MathUtils.clamp(wrappedDelta / Math.PI, 0, 1);
        }

        this.trapPhaseDivergence.set(trapId, {
            lastPhase: normalizedPhase,
            divergence
        });

        return divergence;
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

    _readCanonicalLinkPressure(link) {
        const flowState = link?.userData?.flowState || {};
        if (Number.isFinite(flowState.intensity)) {
            return THREE.MathUtils.clamp(flowState.intensity, 0, 1);
        }
        if (Number.isFinite(flowState.energy)) {
            return THREE.MathUtils.clamp(flowState.energy, 0, 1);
        }

        const cascadeIntensity = Number.isFinite(link?.userData?.cascadeIntensity)
            ? link.userData.cascadeIntensity
            : null;
        if (cascadeIntensity !== null) {
            return THREE.MathUtils.clamp(cascadeIntensity, 0, 1);
        }

        const conflictIntensity = Number.isFinite(link?.userData?.conflictIntensity)
            ? link.userData.conflictIntensity
            : null;
        if (conflictIntensity !== null) {
            return THREE.MathUtils.clamp(conflictIntensity, 0, 1);
        }

        return 0;
    }

    _getSemanticBus() {
        return this.semanticBus || globalThis?.semanticBus || globalThis?.game?.semanticBus || null;
    }

    _ensureSemanticBindings() {
        const bus = this._getSemanticBus();
        if (!bus) return;
        if (this.boundSemanticBus === bus && this.semanticUnsubscribers.length > 0) return;

        this._unbindSemanticEvents();
        this.boundSemanticBus = bus;
        this._bindSemanticEvents(bus);
    }

    _bindSemanticEvents(bus) {
        const subscribe = bus?.subscribe?.bind(bus);
        const on = bus?.on?.bind(bus);
        const unsubscribe = bus?.unsubscribe?.bind(bus);
        const off = bus?.off?.bind(bus);

        const bind = (tag) => {
            const handler = (payload = {}) => this._ingestSemanticPressure(tag, payload);
            if (typeof on === 'function') {
                on(tag, handler, { priority: bus?.priority?.NORMAL });
                this.semanticUnsubscribers.push(() => off?.(tag, handler));
                return;
            }
            if (typeof subscribe === 'function') {
                const unsub = subscribe(tag, handler, { priority: bus?.priority?.NORMAL });
                if (typeof unsub === 'function') {
                    this.semanticUnsubscribers.push(unsub);
                } else if (typeof unsubscribe === 'function') {
                    this.semanticUnsubscribers.push(() => unsubscribe(tag, handler));
                }
            }
        };

        bind('link:collapsed');
        bind('cascade.hop');
        bind('metric.corruption.spike');
        bind('metric:corruptionRise');
        bind('metric:stabilityDrop');
        bind('metric:loadPressureHigh');
        bind('metric.phase.changed');
        bind('network:stressRise');
    }

    _unbindSemanticEvents() {
        for (const unsub of this.semanticUnsubscribers) {
            try {
                if (typeof unsub === 'function') unsub();
            } catch (_err) {
                // no-op
            }
        }
        this.semanticUnsubscribers = [];
        this.boundSemanticBus = null;
    }

    _ingestSemanticPressure(tag, payload = {}) {
        const semanticPayload = payload?.detail && typeof payload.detail === 'object'
            ? payload.detail
            : payload;

        switch (tag) {
            case 'link:collapsed': {
                const linkId = this._resolveLinkId(semanticPayload);
                if (linkId !== null) this._addEventPressureToLink(linkId, 1.0, tag);
                break;
            }
            case 'cascade.hop': {
                const linkId = this._resolveLinkId(semanticPayload);
                if (linkId !== null) this._addEventPressureToLink(linkId, 0.45, tag);
                break;
            }
            case 'metric.corruption.spike': {
                this._addNodeIncidentLinkPressure(semanticPayload, 0.35, tag);
                break;
            }
            case 'metric:corruptionRise': {
                this._addNodeIncidentLinkPressure(semanticPayload, 0.25, tag);
                break;
            }
            case 'metric:stabilityDrop': {
                this._addPressureToTopTrapLinks(0.2, tag, 4);
                break;
            }
            case 'metric:loadPressureHigh': {
                this._addPressureToTopTrapLinks(0.22, tag, 4);
                break;
            }
            case 'network:stressRise': {
                this.globalStressBias = THREE.MathUtils.clamp(this.globalStressBias + 0.18, 0, 0.5);
                break;
            }
            case 'metric.phase.changed': {
                const metric = `${semanticPayload?.metric || ''}`.toLowerCase();
                const phase = `${semanticPayload?.phase || ''}`.toLowerCase();
                if (metric === 'corruption' && phase === 'high') {
                    this._addNodeIncidentLinkPressure(semanticPayload, 0.35, tag);
                } else if (metric === 'stability' && phase === 'low') {
                    this._addPressureToTopTrapLinks(0.2, tag, 4);
                } else if (metric === 'loadpressure' && phase === 'high') {
                    this._addPressureToTopTrapLinks(0.22, tag, 4);
                }
                break;
            }
            default:
                break;
        }
    }

    _resolveLinkId(payload = {}) {
        const id = payload?.linkId ?? payload?.link?.id ?? payload?.link?.userData?.id ?? null;
        return id !== undefined && id !== null ? String(id) : null;
    }

    _addEventPressureToLink(linkId, amount, tag) {
        if (linkId === null || linkId === undefined) return;
        const key = String(linkId);
        const current = this.eventPressureByLink.get(key) || 0;
        this.eventPressureByLink.set(key, THREE.MathUtils.clamp(current + amount, 0, 1));
    }

    _addNodeIncidentLinkPressure(payload, amount, tag) {
        const nodeIdRaw =
            payload?.nodeId ??
            payload?.sourceNodeId ??
            payload?.sourceId ??
            payload?.targetNodeId ??
            payload?.targetId ??
            null;
        if (nodeIdRaw === null || nodeIdRaw === undefined) return;
        const nodeId = String(nodeIdRaw);

        const links = this.linkingSystem?.links || [];
        links.forEach((link) => {
            if (!link) return;
            const sourceId = this._getNodeId(this._getLinkSource(link));
            const targetId = this._getNodeId(this._getLinkTarget(link));
            const sourceMatches = sourceId !== undefined && sourceId !== null && String(sourceId) === nodeId;
            const targetMatches = targetId !== undefined && targetId !== null && String(targetId) === nodeId;
            if (!sourceMatches && !targetMatches) return;
            const linkId = link?.id ?? link?.userData?.id ?? null;
            if (linkId !== null && linkId !== undefined) {
                this._addEventPressureToLink(linkId, amount, tag);
            }
        });
    }

    _addPressureToTopTrapLinks(amount, tag, maxLinks = 4) {
        if (!this.standingWaveTrapSystem) return;
        const traps = this.standingWaveTrapSystem.oscillationTraps || [];
        const ranked = traps
            .filter((trap) => trap?.active && trap?.linkId !== undefined && trap?.linkId !== null)
            .sort((a, b) => (b?.amplitude || 0) - (a?.amplitude || 0))
            .slice(0, Math.max(0, maxLinks));

        ranked.forEach((trap) => this._addEventPressureToLink(trap.linkId, amount, tag));
    }

    _updateEventPressure(deltaTime) {
        const pressureDecay = this.config.eventPressureDecayRate * deltaTime;
        this.eventPressureByLink.forEach((value, linkId) => {
            const next = Math.max(0, value - pressureDecay);
            if (next <= 0.0001) {
                this.eventPressureByLink.delete(linkId);
                return;
            }
            this.eventPressureByLink.set(linkId, next);
        });

        const biasDecay = this.config.globalStressBiasDecayRate * deltaTime;
        this.globalStressBias = Math.max(0, this.globalStressBias - biasDecay);
    }

    _updateRuptureCanonicalLinkMetrics(deltaTime) {
        const links = this.linkingSystem?.links || [];

        // Baseline decay + guaranteed field existence for all links every frame.
        links.forEach((link) => {
            if (!link) return;
            link.userData ??= {};
            const prevTear = Number(link.userData.visualTear) || 0;
            const prevLoss = Number(link.userData.visualCoherenceLoss) || 0;
            link.userData.visualTear = Math.max(0, prevTear * 0.9);
            link.userData.visualCoherenceLoss = Math.max(0, prevLoss * 0.92);

            // Stamp canonical writes for rupture fields
            link.userData.__canonicalWriteAt = link.userData.__canonicalWriteAt || {};
            link.userData.__canonicalWriteAt.visualTear = Date.now();
            link.userData.__canonicalWriteAt.visualCoherenceLoss = Date.now();
        });

        // Active rupture contribution.
        this.ruptures.forEach((rupture) => {
            const link = this._getLinkById(rupture.linkId);
            if (!link) return;
            link.userData ??= {};

            const progress = rupture.maxLife > 0 ? THREE.MathUtils.clamp(rupture.life / rupture.maxLife, 0, 1) : 0;
            const oscillation = Math.abs(Math.sin(this.time * 20));
            const tear = THREE.MathUtils.clamp((rupture.intensity || 0) * (0.5 + 0.5 * oscillation) * (1 - progress), 0, 1);
            const coherenceLoss = THREE.MathUtils.clamp((rupture.intensity || 0) * (1 - progress), 0, 1);

            link.userData.visualTear = Math.max(link.userData.visualTear || 0, tear);
            link.userData.visualCoherenceLoss = Math.max(link.userData.visualCoherenceLoss || 0, coherenceLoss);

            // Stamp canonical writes for rupture fields
            link.userData.__canonicalWriteAt = link.userData.__canonicalWriteAt || {};
            link.userData.__canonicalWriteAt.visualTear = Date.now();
            link.userData.__canonicalWriteAt.visualCoherenceLoss = Date.now();
        });

        // Scar contribution keeps slight coherence loss memory.
        this.resonanceScars.forEach((scar) => {
            const link = this._getLinkById(scar.linkId);
            if (!link) return;
            link.userData ??= {};
            const age = this.time - scar.birthTime;
            const progress = this.config.scarDuration > 0
                ? THREE.MathUtils.clamp(age / this.config.scarDuration, 0, 1)
                : 1;
            const scarLoss = THREE.MathUtils.clamp((scar.intensity || 0) * (1 - progress) * 0.6, 0, 1);
            link.userData.visualCoherenceLoss = Math.max(link.userData.visualCoherenceLoss || 0, scarLoss);

            // Stamp canonical writes for rupture fields
            link.userData.__canonicalWriteAt = link.userData.__canonicalWriteAt || {};
            link.userData.__canonicalWriteAt.visualTear = Date.now();
            link.userData.__canonicalWriteAt.visualCoherenceLoss = Date.now();
        });
    }

    _ensureCanonicalLinkDefaults() {
        const links = this.linkingSystem?.links || [];
        links.forEach((link) => {
            if (!link) return;
            if (!link.userData) link.userData = {};
            const userData = link.userData;

            if (!userData.flowState) {
                userData.flowState = {
                    intensity: 0,
                    direction: 1,
                    type: 'neutral',
                    energy: 0
                };
            }

            if (typeof userData.cascadeIntensity !== 'number') userData.cascadeIntensity = 0;
            if (typeof userData.cascadeConflictType !== 'string' || !userData.cascadeConflictType) {
                userData.cascadeConflictType = 'neutral';
            }
            if (typeof userData.conflictIntensity !== 'number') userData.conflictIntensity = 0;
            if (typeof userData.particleIntensity !== 'number') userData.particleIntensity = 0;
            if (typeof userData.particleUrgency !== 'number') userData.particleUrgency = 0;
            if (typeof userData.visualTear !== 'number') userData.visualTear = 0;
            if (typeof userData.visualCoherenceLoss !== 'number') userData.visualCoherenceLoss = 0;
            if (!(userData.cascadeParticleColor instanceof THREE.Color)) {
                userData.cascadeParticleColor = this.neutralCascadeParticleColor.clone();
            }
        });
    }

    /**
     * Dispose - cleanup
     */
    dispose() {
        this._unbindSemanticEvents();

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
        this.eventPressureByLink.clear();
        this.globalStressBias = 0;
    }

    /**
     * Rebind after world switch (updates linkingSystem, aiNodes, semanticBus)
     */
    rebind(config = {}) {
        // Update references if provided
        if (config.linkingSystem !== undefined) {
            this.linkingSystem = config.linkingSystem;
        }
        if (config.aiNodes !== undefined) {
            this.aiNodes = config.aiNodes;
        }
        if (config.semanticBus !== undefined) {
            this.semanticBus = config.semanticBus;
        }

        // Re-ensure semantic bindings
        this._ensureSemanticBindings();
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
