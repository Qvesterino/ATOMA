/**
 * ============================================================================
 * INFLUENCE ATTENUATION & ABSORPTION SYSTEM (Session 128)
 * ============================================================================
 * 
 * VISUAL-ONLY SYSTEM STUB
 * 
 * Purpose:
 * - Visualizes how harmonic influence weakens, diffuses, and is absorbed
 *   at non-harmonic nodes in the network
 * - Provides pure visual feedback of influence propagation and filtering
 * 
 * Architecture:
 * - Reads network state (nodes, links, harmony metrics)
 * - Creates visual effects (attenuation zones, absorption blooms)
 * - Zero gameplay logic changes
 * - Zero harm to existing systems
 * 
 * Status: PLACEHOLDER (Session 128)
 * This is a structural stub created to restore the ES module import contract.
 * Full visual implementation to follow.
 * 
 * ============================================================================
 */

export class InfluenceAttenuationAbsorptionSystem_Session128 {
    /**
     * Constructor
     * @param {THREE.Scene} scene - Three.js scene
     * @param {Object} world - World/network reference
     * @param {Object} harmonicHubSystem - Optional harmonic hub system
     * @param {Object} harmonicInfluenceSystem - Optional harmonic influence system
     * @param {Object} config - Configuration object
     */
    constructor(scene, world, harmonicHubSystem, harmonicInfluenceSystem, config = {}) {
        this.scene = scene;
        this.world = world;
        this.harmonicHubSystem = harmonicHubSystem;
        this.harmonicInfluenceSystem = harmonicInfluenceSystem;
        this.config = {
            minLinksForHub: 2,
            harmonyThreshold: 0.3,
            attenuationZoneRadiusBase: 1.0,
            attenuationZoneOpacityBase: 0.12,
            bloomOpacityMin: 0.08,
            bloomOpacityMax: 0.15,
            bloomLifetime: 0.6,
            ...config
        };
    }

    /**
     * Setup method - called during initialization
     */
    setup() {
        // Create attenuation zones pool
        this.attenuationZones = [];
        this.absorptionBlooms = [];
        
        // Track influence propagation for visualization
        this.influenceTrackers = new Map();
        
        // Create visualization groups
        this.attenuationGroup = new THREE.Group();
        this.absorptionGroup = new THREE.Group();
        this.scene.add(this.attenuationGroup);
        this.scene.add(this.absorptionGroup);
        this._createdObjects = [this.attenuationGroup, this.absorptionGroup];
    }

    /**
     * Update method - called every frame
     * @param {number} deltaTime - Time elapsed since last frame
     * @param {number} currentTime - Total elapsed time
     */
    update(deltaTime, currentTime) {
        // Update attenuation zones
        this._updateAttenuationZones(deltaTime, currentTime);
        
        // Update absorption blooms
        this._updateAbsorptionBlooms(deltaTime, currentTime);
        
        // Process influence propagation visualization
        this._processInfluencePropagation(deltaTime, currentTime);
    }

    /**
     * Dispose method - cleanup on scene teardown
     */
    dispose() {
        // Cleanup attenuation zones
        this.attenuationZones.forEach(zone => {
            if (zone.mesh) {
                this.attenuationGroup.remove(zone.mesh);
                if (zone.mesh.geometry) zone.mesh.geometry.dispose();
                if (zone.mesh.material) zone.mesh.material.dispose();
            }
        });
        this.attenuationZones = [];
        
        // Cleanup absorption blooms
        this.absorptionBlooms.forEach(bloom => {
            if (bloom.mesh) {
                this.absorptionGroup.remove(bloom.mesh);
                if (bloom.mesh.geometry) bloom.mesh.geometry.dispose();
                if (bloom.mesh.material) bloom.mesh.material.dispose();
            }
        });
        this.absorptionBlooms = [];
        
        // Cleanup influence trackers
        this.influenceTrackers.clear();
        
        // Remove groups from scene
        if (this.attenuationGroup) this.scene.remove(this.attenuationGroup);
        if (this.absorptionGroup) this.scene.remove(this.absorptionGroup);
        
        this._createdObjects = [];
    }
    
    // ========================================================================
    // PRIVATE METHODS - ATTENUATION ZONES
    // ========================================================================
    
    /**
     * Create visual attenuation zone around non-harmonic nodes
     */
    _createAttenuationZone(node, harmonyLevel) {
        const radius = this.config.attenuationZoneRadiusBase * (1.0 - harmonyLevel);
        const opacity = this.config.attenuationZoneOpacityBase * (1.0 - harmonyLevel);
        
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: opacity,
            side: THREE.BackSide,
            depthWrite: false
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(node.position);
        this.attenuationGroup.add(mesh);
        
        const zone = {
            nodeId: node.userData.nodeId || node.id,
            mesh: mesh,
            harmonyLevel: harmonyLevel,
            createdAt: performance.now(),
            lifetime: 2.0 // 2 seconds
        };
        
        this.attenuationZones.push(zone);
        this._createdObjects.push(mesh);
        
        return zone;
    }
    
    /**
     * Update attenuation zones
     */
    _updateAttenuationZones(deltaTime, currentTime) {
        const now = performance.now();
        
        // Update existing zones
        for (let i = this.attenuationZones.length - 1; i >= 0; i--) {
            const zone = this.attenuationZones[i];
            const age = (now - zone.createdAt) / 1000;
            
            // Fade out over lifetime
            const lifeProgress = Math.min(age / zone.lifetime, 1.0);
            const fadeFactor = 1.0 - lifeProgress;
            
            if (zone.mesh && zone.mesh.material) {
                zone.mesh.material.opacity = zone.harmonyLevel * fadeFactor * this.config.attenuationZoneOpacityBase;
            }
            
            // Remove expired zones
            if (age >= zone.lifetime) {
                if (zone.mesh) {
                    this.attenuationGroup.remove(zone.mesh);
                    if (zone.mesh.geometry) zone.mesh.geometry.dispose();
                    if (zone.mesh.material) zone.mesh.material.dispose();
                }
                this.attenuationZones.splice(i, 1);
            }
        }
        
        // Create new zones for low-harmony nodes
        if (this.world && this.world.nodes) {
            this.world.nodes.forEach(node => {
                const harmony = node.userData?.metrics?.harmony || 0;
                if (harmony < this.config.harmonyThreshold) {
                    // Check if zone already exists
                    const existing = this.attenuationZones.find(z => z.nodeId === (node.userData.nodeId || node.id));
                    if (!existing) {
                        this._createAttenuationZone(node, harmony);
                    }
                }
            });
        }
    }
    
    // ========================================================================
    // PRIVATE METHODS - ABSORPTION BLOOMS
    // ========================================================================
    
    /**
     * Create absorption bloom when influence is absorbed
     */
    _createAbsorptionBloom(position, intensity) {
        const radius = 0.3 + (intensity * 0.5);
        const opacity = this.config.bloomOpacityMin + (intensity * (this.config.bloomOpacityMax - this.config.bloomOpacityMin));
        
        const geometry = new THREE.SphereGeometry(radius, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0x88ff44,
            transparent: true,
            opacity: opacity,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        this.absorptionGroup.add(mesh);
        
        const bloom = {
            mesh: mesh,
            intensity: intensity,
            createdAt: performance.now(),
            lifetime: this.config.bloomLifetime
        };
        
        this.absorptionBlooms.push(bloom);
        this._createdObjects.push(mesh);
        
        return bloom;
    }
    
    /**
     * Update absorption blooms
     */
    _updateAbsorptionBlooms(deltaTime, currentTime) {
        const now = performance.now();
        
        for (let i = this.absorptionBlooms.length - 1; i >= 0; i--) {
            const bloom = this.absorptionBlooms[i];
            const age = (now - bloom.createdAt) / 1000;
            
            // Expand and fade
            const lifeProgress = Math.min(age / bloom.lifetime, 1.0);
            const scale = 1.0 + (lifeProgress * 1.5);
            const fadeFactor = 1.0 - lifeProgress;
            
            if (bloom.mesh) {
                bloom.mesh.scale.set(scale, scale, scale);
                if (bloom.mesh.material) {
                    bloom.mesh.material.opacity = fadeFactor * bloom.intensity * this.config.bloomOpacityMax;
                }
            }
            
            // Remove expired blooms
            if (age >= bloom.lifetime) {
                if (bloom.mesh) {
                    this.absorptionGroup.remove(bloom.mesh);
                    if (bloom.mesh.geometry) bloom.mesh.geometry.dispose();
                    if (bloom.mesh.material) bloom.mesh.material.dispose();
                }
                this.absorptionBlooms.splice(i, 1);
            }
        }
    }
    
    // ========================================================================
    // PRIVATE METHODS - INFLUENCE PROPAGATION
    // ========================================================================
    
    /**
     * Process influence propagation visualization
     */
    _processInfluencePropagation(deltaTime, currentTime) {
        if (!this.harmonicHubSystem) return;
        
        // Get harmonic hubs (high-harmony nodes)
        const hubs = this.harmonicHubSystem.getHarmonicHubs?.() || [];
        
        // For each hub, visualize influence spreading to neighbors
        hubs.forEach(hub => {
            const hubNode = hub.node;
            if (!hubNode) return;
            
            const hubHarmony = hubNode.userData?.metrics?.harmony || 0;
            
            // Find connected nodes
            if (hubNode.links) {
                hubNode.links.forEach(link => {
                    const targetNode = link.target === hubNode ? link.source : link.target;
                    if (!targetNode) return;
                    
                    const targetHarmony = targetNode.userData?.metrics?.harmony || 0;
                    
                    // If target has low harmony, show absorption
                    if (targetHarmony < this.config.harmonyThreshold) {
                        const absorptionIntensity = (hubHarmony - targetHarmony) * 0.5;
                        
                        // Create absorption bloom periodically
                        const trackerKey = `${hubNode.id}-${targetNode.id}`;
                        const lastBloomTime = this.influenceTrackers.get(trackerKey) || 0;
                        
                        if (currentTime - lastBloomTime > 0.5) { // Every 0.5 seconds
                            this._createAbsorptionBloom(targetNode.position.clone(), absorptionIntensity);
                            this.influenceTrackers.set(trackerKey, currentTime);
                        }
                    }
                });
            }
        });
    }
}

/**
 * Export validation:
 * This module exports a single class that satisfies the import contract
 * Expected usage in main.js:
 * 
 *   import { InfluenceAttenuationAbsorptionSystem_Session128 } from './InfluenceAttenuationAbsorptionSystem_Session128.js';
 *   
 *   // In World.js constructor:
 *   this.influenceAttenuationAbsorption = new InfluenceAttenuationAbsorptionSystem_Session128(
 *       this.scene,
 *       this.world,
 *       null,  // harmonic hub system
 *       null,  // harmonic influence system
// *       { /* config */ 
// *   );
// *   
// *   // In animate loop:
// * //  if (this.influenceAttenuationAbsorption) {
// *       this.influenceAttenuationAbsorption.update(deltaTime, this.time);
// *   }
// */