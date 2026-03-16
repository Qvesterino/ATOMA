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
 * - Works with StandingWaveOscillationTrapSystem (reads trap state)
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
    constructor(scene, reflectionSystem, standingWaveTrapSystem, linkingSystem, aiNodes, config = {}) {
        this.scene = scene;
        this.reflectionSystem =
            reflectionSystem ||
            globalThis?.waveReflectionSystem ||
            null;
        this.standingWaveTrapSystem = standingWaveTrapSystem;
        this.linkingSystem = linkingSystem;
        this.aiNodes = aiNodes;
        
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
            
            // Destructive interference (cancellation)
            destructiveColor: new THREE.Color(0.2, 0.2, 0.3),   // Dark blue-grey
            destructiveOpacity: 0.08,         // Base opacity (subtle)
            destructiveGlow: 0.3,             // Emissive multiplier (dim)
            destructiveWidth: 0.08,           // Band width
            destructiveDamping: 0.5,          // Amplitude reduction factor
            
            // Interference mesh rendering
            interferenceResolution: 16,       // Segments for interference mesh
            maxInterferenceMeshes: 50,        // Pool size
            interferenceRenderOrder: VisualHierarchyRegistry.getRenderOrder('LINK_WAVES'),
            
            // Beat frequency patterns
            beatFrequencyRange: [0.5, 4.0],   // Min-max Hz from frequency differences
            beatAmplification: 1.2,           // How much beat modulates amplitude
            beatFrequencySmoothing: 0.3,      // Smoothing factor for beat transitions
            
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
        this.interferenceZones = [];         // { linkIds, type, phase, frequency, intensity }
        this.collisionPairs = [];            // { wave1, wave2, convergencePoint, phase }
        this.interferenceMeshes = [];        // Active interference mesh overlays
        this.beatPatterns = [];              // { zone, beatFrequency, beatPhase }
        this.interferenceLifecycles = [];    // { zone, birthTime, state }
        
        // Tracking
        this.waveCollisionHistory = new Map(); // Track recent collisions to avoid duplicates
        this.constructiveZones = new Map();    // linkId -> { position, intensity, phase }
        this.destructiveZones = new Map();     // linkId -> { position, intensity, phase }
        this.phaseRelationships = new Map();   // "wave1_wave2" -> phase difference
        
        // Object pools
        this.interferenceMeshPool = [];
        
        // Material cache
        this.constructiveMaterial = null;
        this.destructiveMaterial = null;
        
        this.time = 0;
        this.initialized = false;
    }

    /**
     * Setup - initialize materials, pools, and resources
     */
    setup() {
        if (this.initialized) return;
        
        // Create constructive interference material (bright, gold)
        this.constructiveMaterial = new THREE.MeshStandardMaterial({
            color: this.config.constructiveColor,
            emissive: this.config.constructiveColor,
            emissiveIntensity: this.config.constructiveGlow,
            transparent: true,
            opacity: this.config.constructiveOpacity,
            side: THREE.DoubleSide,
            depthWrite: false,
            roughness: 0.7,
            metalness: 0.3
        });
        
        // Create destructive interference material (dark, dim)
        this.destructiveMaterial = new THREE.MeshStandardMaterial({
            color: this.config.destructiveColor,
            emissive: this.config.destructiveColor,
            emissiveIntensity: this.config.destructiveGlow,
            transparent: true,
            opacity: this.config.destructiveOpacity,
            side: THREE.DoubleSide,
            depthWrite: false,
            roughness: 0.9,
            metalness: 0
        });
        
        // Pre-allocate interference mesh pool
        for (let i = 0; i < this.config.maxInterferenceMeshes; i++) {
            const geometry = new THREE.CylinderGeometry(
                1, 1, 1,
                this.config.interferenceResolution,
                4, false
            );
            const mesh = new THREE.Mesh(geometry, this.constructiveMaterial.clone());
            mesh.visible = false;
            mesh.renderOrder = this.config.interferenceRenderOrder;
            this.scene.add(mesh);
            this.interferenceMeshPool.push({
                mesh: mesh,
                active: false,
                zone: null,
                type: 'constructive',
                intensity: 1,
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
        
        // Step 1: Detect wave collisions
        this._detectWaveCollisions(deltaTime);
        
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
                    
                    if (phaseDiff < this.config.phaseDifferenceThreshold ||
                        phaseDiff > (1 - this.config.phaseDifferenceThreshold)) {
                        // Collision detected
                        const convergencePoint = this._findConvergencePoint(reflection1, reflection2, links);
                        
                        this.collisionPairs.push({
                            wave1: reflection1,
                            wave2: reflection2,
                            convergencePoint: convergencePoint,
                            phaseDifference: phaseDiff,
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
        
        // Get link endpoints
        const link1Start = link1.sourceNode?.position || link1.from?.position;
        const link1End = link1.targetNode?.position || link1.to?.position;
        const link2Start = link2.sourceNode?.position || link2.from?.position;
        const link2End = link2.targetNode?.position || link2.to?.position;
        
        if (!link1Start || !link1End || !link2Start || !link2End) return false;
        
        // Check if links share a common node (converging point)
        const link1StartId = link1.sourceNode?.id || link1.from?.id;
        const link1EndId = link1.targetNode?.id || link1.to?.id;
        const link2StartId = link2.sourceNode?.id || link2.from?.id;
        const link2EndId = link2.targetNode?.id || link2.to?.id;
        
        // Paths converge if they share an endpoint
        return (link1EndId === link2StartId || link1EndId === link2EndId ||
                link1StartId === link2StartId || link1StartId === link2EndId);
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
        
        // Check which endpoints match
        const link1EndId = link1.targetNode?.id || link1.to?.id;
        const link2StartId = link2.sourceNode?.id || link2.from?.id;
        const link2EndId = link2.targetNode?.id || link2.to?.id;
        const link1StartId = link1.sourceNode?.id || link1.from?.id;
        
        let convergenceNode = null;
        
        if (link1EndId === link2StartId) {
            convergenceNode = link1.targetNode || link1.to;
        } else if (link1EndId === link2EndId) {
            convergenceNode = link1.targetNode || link1.to;
        } else if (link1StartId === link2StartId) {
            convergenceNode = link1.sourceNode || link1.from;
        } else if (link1StartId === link2EndId) {
            convergenceNode = link1.sourceNode || link1.from;
        }
        
        return convergenceNode?.position || new THREE.Vector3();
    }

    /**
     * Calculate interference zones from collision pairs
     */
    _calculateInterferenceZones(deltaTime) {
        this.constructiveZones.clear();
        this.destructiveZones.clear();
        this.interferenceZones = [];
        
        this.collisionPairs.forEach(pair => {
            // Determine interference type based on phase
            const phaseDiff = pair.phaseDifference;
            
            // Waves in phase (phaseDiff ≈ 0) = constructive
            // Waves out of phase (phaseDiff ≈ 0.5) = destructive
            const isConstructive = phaseDiff < 0.25;
            
            const zone = {
                linkIds: pair.linkIds,
                convergencePoint: pair.convergencePoint,
                type: isConstructive ? 'constructive' : 'destructive',
                phaseDifference: pair.phaseDifference,
                intensity: Math.min(pair.wave1.intensity, pair.wave2.intensity),
                frequency1: this._getWaveFrequency(pair.wave1),
                frequency2: this._getWaveFrequency(pair.wave2),
                wave1: pair.wave1,
                wave2: pair.wave2,
                birthTime: this.time
            };
            
            this.interferenceZones.push(zone);
            
            // Store in appropriate zone map
            if (isConstructive) {
                pair.linkIds.forEach(linkId => {
                    this.constructiveZones.set(linkId, {
                        intensity: zone.intensity,
                        position: pair.convergencePoint,
                        phase: pair.wave1.phase
                    });
                });
            } else {
                pair.linkIds.forEach(linkId => {
                    this.destructiveZones.set(linkId, {
                        intensity: zone.intensity,
                        position: pair.convergencePoint,
                        phase: pair.wave1.phase
                    });
                });
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
            // Beat frequency = |freq1 - freq2|
            const beatFreq = Math.abs(zone.frequency1 - zone.frequency2);
            
            // Clamp to reasonable range
            const clampedBeat = Math.max(
                this.config.beatFrequencyRange[0],
                Math.min(this.config.beatFrequencyRange[1], beatFreq)
            );
            
            this.beatPatterns.push({
                zone: zone,
                beatFrequency: clampedBeat,
                beatPhase: this.time * clampedBeat * Math.PI * 2
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
            meshItem.birthTime = this.time;
            
            // Position mesh at convergence point
            meshItem.mesh.position.copy(zone.convergencePoint);
            
            // Scale based on intensity and beat
            const beatAmplitude = Math.sin(pattern.beatPhase);
            const scaleFactor = zone.intensity * (1 + beatAmplitude * this.config.beatAmplification);
            meshItem.mesh.scale.set(scaleFactor * 0.3, 0.1, scaleFactor * 0.3);
            
            // Apply material based on interference type
            if (zone.type === 'constructive') {
                meshItem.mesh.material = this.constructiveMaterial;
                meshItem.intensity = zone.intensity * this.config.constructiveAmplification;
            } else {
                meshItem.mesh.material = this.destructiveMaterial;
                meshItem.intensity = zone.intensity * this.config.destructiveDamping;
            }
            
            // Set material opacity based on lifecycle
            this._setMeshLifecycleOpacity(meshItem);
            
            // Check LOD
            if (this.config.enableLOD) {
                const cameraPos = this.scene.getObjectByName('camera')?.position || new THREE.Vector3();
                const distance = zone.convergencePoint.distanceTo(cameraPos);
                if (distance > this.config.lodDistance) {
                    meshItem.mesh.visible = false;
                }
            }
            
            meshIndex++;
        });
    }

    /**
     * Set mesh opacity based on lifecycle state
     */
    _setMeshLifecycleOpacity(meshItem) {
        const lifespan = this.time - meshItem.birthTime;
        
        let opacityFactor = 1.0;
        
        // Emergence phase
        if (lifespan < this.config.emergenceTime) {
            opacityFactor = lifespan / this.config.emergenceTime;
        }
        // Peak phase
        else if (lifespan < this.config.emergenceTime + this.config.peakDuration) {
            opacityFactor = 1.0;
        }
        // Dissipation phase
        else {
            const dissipateProgress = (lifespan - this.config.emergenceTime - this.config.peakDuration) / this.config.dissipateTime;
            opacityFactor = Math.max(0, 1 - dissipateProgress);
        }
        
        // Apply to material
        const baseOpacity = meshItem.zone.type === 'constructive' 
            ? this.config.constructiveOpacity 
            : this.config.destructiveOpacity;
        
        meshItem.mesh.material.opacity = baseOpacity * opacityFactor;
        
        // Modulate emissive intensity
        const baseGlow = meshItem.zone.type === 'constructive'
            ? this.config.constructiveGlow
            : this.config.destructiveGlow;
        
        meshItem.mesh.material.emissiveIntensity = baseGlow * opacityFactor;
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
            avgHarmony += node.harmony ?? 0.5;
            avgCorruption += node?.userData?.metrics?.corruption ?? node?.userData?.corruption ?? 0.5;
            avgInstability += node.instability ?? 0;
            avgSynergy += node.synergy ?? 0.5;
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
            
            material.opacity *= modulation;
            material.emissiveIntensity *= modulation;
        });
    }

    /**
     * Update interference lifecycle (cleanup old patterns)
     */
    _updateInterferenceLifecycle(deltaTime) {
        this.interferenceZones = this.interferenceZones.filter(zone => {
            const lifespan = this.time - zone.birthTime;
            const totalLifetime = this.config.emergenceTime + this.config.peakDuration + this.config.dissipateTime;
            return lifespan < totalLifetime;
        });
    }

    /**
     * Dispose - cleanup
     */
    dispose() {
        // Clean up interference meshes
        this.interferenceMeshPool.forEach(item => {
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
        this.interferenceMeshPool = [];
        
        // Clean up materials
        if (this.constructiveMaterial) {
            this.constructiveMaterial.dispose();
        }
        if (this.destructiveMaterial) {
            this.destructiveMaterial.dispose();
        }
        
        // Clear maps
        this.constructiveZones.clear();
        this.destructiveZones.clear();
        this.phaseRelationships.clear();
        this.waveCollisionHistory.clear();
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
 *       this.standingWaveTrap,     // Standing wave system (optional)
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
