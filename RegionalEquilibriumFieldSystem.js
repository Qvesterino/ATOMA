/**
 * ============================================================================
 * REGIONAL EQUILIBRIUM FIELD SYSTEM
 * ============================================================================
 * 
 * Visualizes long-term power balance and territorial equilibrium shifts
 * across network regions through subtle ambient field effects.
 * 
 * CORE CONCEPT:
 * - Detects clusters of nodes as distinct regions
 * - Generates ambient volumetric fields for each region
 * - Modulates field appearance based on regional state (harmony, corruption, synergy)
 * - Renders gradients and spatial distortion reflecting power balance
 * - Retains historical memory of ruptures, healing, and resistance
 * 
 * FEATURES:
 * 1. Regional Detection: Identifies connected node clusters dynamically
 * 2. Equilibrium Fields: Subtle volumetric haze expressing regional harmony
 * 3. Power Drift: Gradual bias in field movement indicating balance shifts
 * 4. Historical Imprint: Visual persistence of past ruptures, healing patterns
 * 5. State Modulation: Responds to harmony, corruption, synergy over long timescales
 * 
 * VISUAL LANGUAGE:
 * - Balanced region → neutral grey-white, smooth breathing
 * - Harmony-leaning → warm undertone, coherent motion
 * - Corruption-leaning → cool/desaturated, subtle grain texture
 * - High synergy → unified field, aligned directional drift
 * - Unstable region → unsettled motion, visual noise (decays over time)
 * 
 * INTEGRATION:
 * - Reads: AINodes, NodeLinkingSystem, HarmonicHubs, RuptureScars, Standing Waves
 * - Writes: Only visual (volumetric field meshes, materials, positions)
 * - Zero gameplay mutation
 * 
 * ============================================================================
 */

import * as THREE from 'three';

const FIELD_VERTEX_SHADER = `
varying vec3 vWorldPos;
varying vec2 vUv;

void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const FIELD_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uHarmony;
uniform float uCorruption;
uniform float uSynergy;
uniform float uInstability;
uniform vec3 uCenterPos;
uniform float uRadius;
uniform vec3 uDriftDirection;
uniform vec3 uBaseColor;
uniform float uHistoricalTension;

varying vec3 vWorldPos;
varying vec2 vUv;

// Simplex noise approximation (fast pseudo-random)
float noise(vec3 p) {
    return sin(p.x * 12.9898 + p.y * 78.233 + p.z * 45.164) * 0.5 + 0.5;
}

// Smooth gradient-based noise
float smoothNoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float n0 = noise(i);
    float n1 = noise(i + vec3(1.0, 0.0, 0.0));
    float nx = mix(n0, n1, f.x);
    
    return nx;
}

void main() {
    // Distance from region center
    vec3 toCenter = vWorldPos - uCenterPos;
    float dist = length(toCenter);
    
    // Soft falloff from center (radius-based)
    float falloff = exp(-(dist * dist) / (uRadius * uRadius * 2.0));
    if (falloff < 0.01) discard;
    
    // Base color
    vec3 color = uBaseColor;
    
    // Harmony brightens and warms the field
    color += vec3(0.1, 0.05, 0.0) * uHarmony;
    
    // Corruption desaturates and cools
    color = mix(color, vec3(0.5, 0.5, 0.5), uCorruption * 0.3);
    
    // Historical tension adds subtle gold undertone
    color += vec3(0.05, 0.03, 0.0) * uHistoricalTension;
    
    // 3D noise for spatial grain (corruption/instability)
    float grainIntensity = (uCorruption + uInstability) * 0.2;
    float grain = smoothNoise(vWorldPos + uTime * 0.1);
    color = mix(color, vec3(grain), grainIntensity);
    
    // Directional bias from power balance drift
    float driftInfluence = dot(normalize(toCenter), normalize(uDriftDirection + vec3(0.001))) * 0.2;
    color += driftInfluence * vec3(0.02, 0.01, 0.02);
    
    // Alpha: Combine falloff with state modulation
    // Harmony increases opacity (unified), corruption/instability reduce it
    float baseAlpha = falloff * 0.3;
    float stateAlpha = mix(0.5, 1.0, uHarmony) * (1.0 - uCorruption * 0.4);
    float finalAlpha = baseAlpha * stateAlpha;
    
    // Synergy adds slight glow
    if (uSynergy > 0.5) {
        finalAlpha *= (1.0 + uSynergy * 0.2);
    }
    
    gl_FragColor = vec4(color, finalAlpha);
}
`;

// Region representation: cluster of connected nodes
class Region {
    constructor(id, nodes, centerPos) {
        this.id = id;
        this.nodes = nodes;
        this.centerPos = centerPos.clone();
        
        // Visual state
        this.fieldMesh = null;
        this.material = null;
        
        // State tracking (for modulation)
        this.harmony = 0.5;
        this.corruption = 0.0;
        this.synergy = 0.0;
        this.instability = 0.0;
        
        // Historical memory
        this.ruptureScarIntensity = 0.0; // Fades slowly
        this.healingIntensity = 0.0;     // Fades slowly
        this.resistanceMemory = 0.0;     // Fades very slowly
        
        // Power balance tracking
        this.driftDirection = new THREE.Vector3(0, 0, 0);
        this.driftAccumulation = 0.0;
        
        // Compute region properties
        this.radius = this._computeRadius();
    }
    
    _computeRadius() {
        // Maximum distance from center to any node
        let maxDist = 0;
        for (const node of this.nodes) {
            const dist = node.position.distanceTo(this.centerPos);
            maxDist = Math.max(maxDist, dist);
        }
        return Math.max(maxDist + 1.0, 3.0); // Minimum radius
    }
    
    updateCenterPos() {
        // Recalculate center of mass for region
        const sum = new THREE.Vector3();
        for (const node of this.nodes) {
            sum.add(node.position);
        }
        this.centerPos.copy(sum).multiplyScalar(1.0 / this.nodes.length);
    }
}

export class RegionalEquilibriumFieldSystem {
    constructor(scene, aiNodes, linkingSystem) {
        this.scene = scene;
        this.aiNodes = aiNodes;
        this.linkingSystem = linkingSystem;
        
        this.config = {
            detectionInterval: 5.0,      // Seconds between region re-detection
            minRegionSize: 3,             // Minimum nodes in cluster
            linkDistanceThreshold: 8.0,   // Max distance to consider nodes connected
            fieldGeometryResolution: 8,   // Tessellation of field mesh
            historicalDecayRate: 0.05,    // Slow fade of historical memory
            instabilityDecayRate: 0.3,    // Faster decay of instability
            driftUpdateRate: 0.2,         // How quickly drift direction adapts
            maxFieldsPerScene: 15         // Performance limit
        };
        
        // State
        this.regions = new Map(); // id -> Region
        this.lastDetectionTime = 0;
        this.elapsedTime = 0;
        
        // Materials shared pool
        this.fieldMaterials = []; // Reusable materials
        
        console.log('🌍 [RegionalEquilibrium] System initialized');
    }
    
    /**
     * Main update loop
     */
    update(deltaTime, time, networkState, harmonySystem, ruptureSystem, standingWaveSystem) {
        this.elapsedTime += deltaTime;
        
        // 1. Periodic region detection
        if (this.elapsedTime - this.lastDetectionTime > this.config.detectionInterval) {
            this._detectRegions();
            this.lastDetectionTime = this.elapsedTime;
        }
        
        // 2. Update each region
        for (const region of this.regions.values()) {
            this._updateRegion(region, deltaTime, time, networkState, harmonySystem, ruptureSystem, standingWaveSystem);
        }
        
        // 3. Clean up stale regions
        this._pruneStaleRegions();
    }
    
    /**
     * Detect connected clusters of nodes as regions
     */
    _detectRegions() {
        if (!this.aiNodes || !this.aiNodes.nodes || this.aiNodes.nodes.length === 0) return;
        
        const nodes = this.aiNodes.nodes;
        const visited = new Set();
        const newRegions = new Map();
        
        for (const node of nodes) {
            if (visited.has(node.id)) continue;
            
            // BFS to find connected cluster
            const cluster = this._floodFillCluster(node, visited);
            
            if (cluster.length >= this.config.minRegionSize) {
                // Compute region center
                const center = new THREE.Vector3();
                for (const n of cluster) {
                    center.add(n.position);
                }
                center.multiplyScalar(1.0 / cluster.length);
                
                const regionId = `region_${cluster[0].id}_${cluster[cluster.length - 1].id}`;
                
                // Reuse or create region
                if (this.regions.has(regionId)) {
                    const region = this.regions.get(regionId);
                    region.nodes = cluster;
                    region.updateCenterPos();
                    newRegions.set(regionId, region);
                } else {
                    const region = new Region(regionId, cluster, center);
                    this._createFieldMesh(region);
                    newRegions.set(regionId, region);
                }
            }
        }
        
        // Remove old regions
        for (const region of this.regions.values()) {
            if (!newRegions.has(region.id)) {
                this._disposeRegion(region);
            }
        }
        
        this.regions = newRegions;
    }
    
    /**
     * BFS to find connected node cluster
     */
    _floodFillCluster(startNode, visited) {
        const cluster = [];
        const queue = [startNode];
        visited.add(startNode.id);
        
        while (queue.length > 0) {
            const node = queue.shift();
            cluster.push(node);
            
            // Find neighbors via links
            const neighbors = this._getNodeNeighbors(node);
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor.id)) {
                    const dist = node.position.distanceTo(neighbor.position);
                    if (dist <= this.config.linkDistanceThreshold) {
                        visited.add(neighbor.id);
                        queue.push(neighbor);
                    }
                }
            }
        }
        
        return cluster;
    }
    
    /**
     * Get neighbors of a node (via links)
     */
    _getNodeNeighbors(node) {
        if (!this.linkingSystem || !this.linkingSystem.links) return [];
        
        const neighbors = [];
        for (const link of this.linkingSystem.links) {
            if (!link || !link.source || !link.target) continue;
            
            if (link.source.id === node.id) {
                neighbors.push(link.target);
            } else if (link.target.id === node.id) {
                neighbors.push(link.source);
            }
        }
        
        return neighbors;
    }
    
    /**
     * Create or update field mesh for region
     */
    _createFieldMesh(region) {
        if (region.fieldMesh) return; // Already has mesh
        
        // Sphere geometry for field
        const geo = new THREE.SphereGeometry(region.radius, this.config.fieldGeometryResolution, this.config.fieldGeometryResolution);
        
        // Create material
        const material = new THREE.ShaderMaterial({
            vertexShader: FIELD_VERTEX_SHADER,
            fragmentShader: FIELD_FRAGMENT_SHADER,
            uniforms: {
                uTime: { value: 0 },
                uHarmony: { value: 0.5 },
                uCorruption: { value: 0.0 },
                uSynergy: { value: 0.0 },
                uInstability: { value: 0.0 },
                uCenterPos: { value: region.centerPos },
                uRadius: { value: region.radius },
                uDriftDirection: { value: new THREE.Vector3(0, 0, 1) },
                uBaseColor: { value: new THREE.Color(0.8, 0.8, 0.85) },
                uHistoricalTension: { value: 0.0 }
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.NormalBlending,
            side: THREE.BackSide // View from inside
        });
        
        const mesh = new THREE.Mesh(geo, material);
        mesh.position.copy(region.centerPos);
        mesh.renderOrder = 2; // Behind nodes but in front of background
        mesh.frustumCulled = false;
        
        this.scene.add(mesh);
        
        region.fieldMesh = mesh;
        region.material = material;
    }
    
    /**
     * Update region state and visuals
     */
    _updateRegion(region, deltaTime, time, networkState, harmonySystem, ruptureSystem, standingWaveSystem) {
        if (!region.fieldMesh || !region.material) return;
        
        // 1. Compute regional state from nodes
        this._computeRegionalState(region);
        
        // 2. Track historical events
        this._updateHistoricalMemory(region, deltaTime, ruptureSystem);
        
        // 3. Compute power balance drift
        this._updatePowerBalanceDrift(region, deltaTime, harmonySystem, standingWaveSystem);
        
        // 4. Update visual uniforms
        this._updateFieldVisuals(region, time);
    }
    
    /**
     * Compute regional state by averaging node properties
     */
    _computeRegionalState(region) {
        if (region.nodes.length === 0) return;
        
        let harmonySum = 0;
        let corruptionSum = 0;
        let synergySum = 0;
        let instabilitySum = 0;
        
        for (const node of region.nodes) {
            harmonySum += (node.harmony || 0.5);
            corruptionSum += (node.corruption || 0.0);
            // Synergy might not be per-node; use network-level if available
            instabilitySum += (node.instability || 0.0);
        }
        
        const count = region.nodes.length;
        region.harmony = harmonySum / count;
        region.corruption = corruptionSum / count;
        region.instability = instabilitySum / count;
        
        // Synergy is typically network-level; for now use a moderate value
        region.synergy = 0.5;
    }
    
    /**
     * Update historical memory (ruptures, healing, resistance)
     */
    _updateHistoricalMemory(region, deltaTime, ruptureSystem) {
        // Decay historical imprints slowly
        region.ruptureScarIntensity *= (1.0 - this.config.historicalDecayRate * deltaTime);
        region.healingIntensity *= (1.0 - this.config.historicalDecayRate * deltaTime);
        region.resistanceMemory *= (1.0 - this.config.historicalDecayRate * deltaTime * 0.5); // Even slower
        
        // Check for active ruptures in region
        if (ruptureSystem && ruptureSystem.ruptures) {
            for (const rupture of ruptureSystem.ruptures) {
                // Check if rupture is near any node in this region
                for (const node of region.nodes) {
                    const dist = rupture.position.distanceTo(node.position);
                    if (dist < region.radius) {
                        // Rupture detected in region
                        region.ruptureScarIntensity = Math.min(1.0, region.ruptureScarIntensity + 0.3);
                        region.instability = Math.min(1.0, region.instability + 0.2);
                        break;
                    }
                }
            }
        }
        
        // Compute tension metric from historical events
        region.historicalTension = (region.ruptureScarIntensity * 0.6 + region.resistanceMemory * 0.4);
    }
    
    /**
     * Update power balance drift (long-term shift direction)
     */
    _updatePowerBalanceDrift(region, deltaTime, harmonySystem, standingWaveSystem) {
        // Drift is influenced by:
        // - Harmony dominance (smooth directional lean)
        // - Standing wave locations (distortion pockets)
        // - Regional asymmetry (differential corruption/harmony across nodes)
        
        const driftTarget = new THREE.Vector3();
        
        // 1. Harmony-driven drift (towards higher harmony)
        if (harmonySystem && harmonySystem.harmonyZones) {
            let maxHarmonyDist = 0;
            let harmonyDir = new THREE.Vector3();
            
            for (const zone of harmonySystem.harmonyZones) {
                const harmony = zone.intensity || 0.5;
                const dir = zone.position.clone().sub(region.centerPos);
                if (dir.length() > 0) {
                    dir.normalize().multiplyScalar(harmony);
                    harmonyDir.add(dir);
                }
            }
            
            if (harmonyDir.length() > 0) {
                driftTarget.add(harmonyDir.normalize());
            }
        }
        
        // 2. Standing wave distortion (subtle asymmetry)
        if (standingWaveSystem && standingWaveSystem.standingWaves) {
            // For each standing wave, apply subtle distortion
            for (const wave of standingWaveSystem.standingWaves) {
                const toWave = wave.position.clone().sub(region.centerPos);
                if (toWave.length() < region.radius * 2.0) {
                    // Add perpendicular bias
                    const perp = new THREE.Vector3(-toWave.y, toWave.x, 0).normalize();
                    driftTarget.add(perp.multiplyScalar(0.3));
                }
            }
        }
        
        // 3. Regional asymmetry (differential state across nodes)
        const asymmetryVector = this._computeAsymmetry(region);
        driftTarget.add(asymmetryVector);
        
        // Smooth interpolation to target
        if (driftTarget.length() > 0) {
            driftTarget.normalize();
            this.config.driftUpdateRate = Math.min(0.2, deltaTime * 0.5);
            this.region.driftDirection.lerp(driftTarget, this.config.driftUpdateRate);
        }
    }
    
    /**
     * Compute asymmetry vector (directional bias in regional state)
     */
    _computeAsymmetry(region) {
        if (region.nodes.length < 2) return new THREE.Vector3();
        
        // Find the direction of highest corruption variance
        let maxVariance = 0;
        let varianceDir = new THREE.Vector3();
        
        for (let i = 0; i < region.nodes.length; i++) {
            for (let j = i + 1; j < region.nodes.length; j++) {
                const n1 = region.nodes[i];
                const n2 = region.nodes[j];
                
                const corruptDiff = (n1.corruption || 0) - (n2.corruption || 0);
                if (Math.abs(corruptDiff) > maxVariance) {
                    maxVariance = Math.abs(corruptDiff);
                    varianceDir = n2.position.clone().sub(n1.position).normalize();
                }
            }
        }
        
        return varianceDir.multiplyScalar(maxVariance);
    }
    
    /**
     * Update field material uniforms for visual display
     */
    _updateFieldVisuals(region, time) {
        const uniforms = region.material.uniforms;
        
        uniforms.uTime.value = time;
        uniforms.uHarmony.value = region.harmony;
        uniforms.uCorruption.value = region.corruption;
        uniforms.uSynergy.value = region.synergy;
        uniforms.uInstability.value = region.instability;
        uniforms.uCenterPos.value.copy(region.centerPos);
        uniforms.uRadius.value = region.radius;
        uniforms.uDriftDirection.value.copy(region.driftDirection);
        uniforms.uHistoricalTension.value = region.historicalTension;
        
        // Decay instability over time
        region.instability *= (1.0 - this.config.instabilityDecayRate * 0.016); // Frame-based decay
        
        // Update mesh position
        region.fieldMesh.position.copy(region.centerPos);
        region.fieldMesh.scale.setScalar(region.radius / 1.0);
    }
    
    /**
     * Remove stale regions
     */
    _pruneStaleRegions() {
        const toRemove = [];
        
        for (const region of this.regions.values()) {
            // Check if nodes still exist
            const activeNodeCount = region.nodes.filter(n => this.aiNodes.nodes.includes(n)).length;
            
            if (activeNodeCount < this.config.minRegionSize) {
                toRemove.push(region.id);
            }
        }
        
        for (const id of toRemove) {
            const region = this.regions.get(id);
            this._disposeRegion(region);
            this.regions.delete(id);
        }
    }
    
    /**
     * Clean up region resources
     */
    _disposeRegion(region) {
        if (region.fieldMesh) {
            this.scene.remove(region.fieldMesh);
            region.fieldMesh.geometry.dispose();
            if (region.material) {
                region.material.dispose();
            }
        }
    }
    
    /**
     * Get all active regions (for debugging/monitoring)
     */
    getRegions() {
        return Array.from(this.regions.values());
    }
    
    /**
     * Get region state info (for debugging)
     */
    getRegionInfo(regionId) {
        const region = this.regions.get(regionId);
        if (!region) return null;
        
        return {
            id: region.id,
            nodeCount: region.nodes.length,
            harmony: region.harmony.toFixed(2),
            corruption: region.corruption.toFixed(2),
            synergy: region.synergy.toFixed(2),
            instability: region.instability.toFixed(2),
            historicalTension: region.historicalTension.toFixed(2),
            driftDirection: {
                x: region.driftDirection.x.toFixed(2),
                y: region.driftDirection.y.toFixed(2),
                z: region.driftDirection.z.toFixed(2)
            }
        };
    }
    
    dispose() {
        for (const region of this.regions.values()) {
            this._disposeRegion(region);
        }
        this.regions.clear();
    }
}
