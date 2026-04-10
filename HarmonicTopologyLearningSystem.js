/**
 * ============================================================================
 * HARMONIC TOPOLOGY LEARNING SYSTEM
 * ============================================================================
 * 
 * Visualizes long-term network learning through topology evolution.
 * 
 * CORE PHILOSOPHY:
 * Learning is not an event. Learning is topology changing over time.
 * This system reveals how repeated resonance, rupture, healing, and
 * semantic fusion reshape the network's structural tendencies.
 * 
 * TOPOLOGY REPRESENTS:
 * - Preferred flow paths (where influence travels repeatedly)
 * - Reinforced connections (successful harmonic passages)
 * - Avoided regions (learned resistance patterns, rupture scars)
 * - Stabilized hubs (long-lived synthesis points)
 * - Spatial confidence (learned trustworthiness of routes)
 * 
 * NOT CHANGES TO GRAPH STRUCTURE:
 * Topology is a visual bias layer over existing network.
 * Existing links don't change—their presentation reflects learned patterns.
 * 
 * ============================================================================
 * 
 * VISUAL LAYERS:
 * 
 * 1. HARMONIC FLOW BIAS LINES
 *    - Faint directional streaks showing preferred influence paths
 *    - Barely visible (only apparent with motion/parallax)
 *    - Never replace actual link visuals
 *    - Form where synthesis/resonance occurs repeatedly
 * 
 * 2. LEARNED PATH REINFORCEMENT
 *    - On frequently used, harmonically successful links
 *    - Motion feels smoother (reduced oscillation)
 *    - Slight visual straightening bias
 *    - Slow to form, slow to decay
 * 
 * 3. AVOIDANCE & SCAR MEMORY ZONES
 *    - Regions with repeated rupture or resistance
 *    - Flow curves around these areas (spatial hesitation)
 *    - Topology feels stiffer, colder
 *    - No hard barriers—preference shifts only
 * 
 * 4. HUB MATURATION INDICATORS
 *    - Long-lived harmonic hubs gain spatial presence
 *    - Space around them feels more ordered
 *    - Composite glyph fusion happens more readily
 *    - NOT glow/size—spatial confidence
 * 
 * ============================================================================
 */

import * as THREE from 'three';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // Topology regions
    REGION_SIZE: 10.0,                 // Spatial grid for topology
    MAX_REGIONS: 50,                   // Cap on active regions
    
    // Learning timescale - POLISH: Slower, more gradual learning
    LEARNING_WINDOW: 300.0,            // 5 minutes of history
    UPDATE_INTERVAL: 6.0,              // POLISHED: increased from 5.0 (slower updates)
    
    // Harmonic flow bias - POLISH: More subtle bias influence
    FLOW_BIAS_STRENGTH: 0.25,          // POLISHED: reduced from 0.3 (gentler base)
    HARMONY_FLOW_BOOST: 1.4,           // POLISHED: reduced from 1.5 (calmer boost)
    CORRUPTION_FLOW_DAMPEN: 0.5,       // POLISHED: increased from 0.4 (less harsh dampen)
    FLOW_VISUALIZATION_OPACITY: 0.06,  // POLISHED: reduced from 0.08 (6% - more subtle)
    
    // Path reinforcement - POLISH: Slower accumulation, gentler effect
    REINFORCEMENT_ACCUMULATION: 0.015, // POLISHED: reduced from 0.02 (slower learning)
    REINFORCEMENT_DECAY_RATE: 0.0008,  // POLISHED: reduced from 0.001 (longer memory)
    MAX_REINFORCEMENT: 0.7,            // POLISHED: reduced from 0.8 (70% cap - more subtle)
    REINFORCEMENT_SMOOTHNESS_EFFECT: 0.12, // POLISHED: reduced from 0.15 (12% - calmer)
    
    // Scar memory - POLISH: Slower formation, faster healing
    SCAR_FORMATION_RATE: 0.04,         // POLISHED: reduced from 0.05 (slower scar formation)
    SCAR_DECAY_RATE: 0.0007,           // POLISHED: increased from 0.0005 (faster healing)
    MAX_SCAR_INTENSITY: 0.55,          // POLISHED: reduced from 0.6 (55% cap - less harsh)
    SCAR_AVOIDANCE_RADIUS: 2.5,        // POLISHED: reduced from 3.0 (tighter avoidance)
    
    // Hub maturation - POLISH: More conservative spatial confidence
    HUB_MATURATION_THRESHOLD: 60.0,    // 1 minute of existence
    HUB_SPATIAL_CONFIDENCE: 0.4,       // POLISHED: reduced from 0.5 (calmer presence)
    HUB_FUSION_ACCELERATION: 1.2,      // POLISHED: reduced from 1.3 (20% - less dramatic)
    
    // Performance
    POOL_SIZE: 50,                     // Topology regions
    COARSE_UPDATE_INTERVAL: 1.0,       // Coarse updates every 1 second
    
    // Debug
    DEBUG_DRAW_TOPOLOGY: false,
    DEBUG_SHOW_REINFORCEMENT: false,
    DEBUG_SHOW_SCARS: false
};

// ============================================================================
// TOPOLOGY REGION STATE
// ============================================================================

class TopologyRegion {
    constructor(center) {
        this.center = center.clone();
        this.active = false;
        this.age = 0.0;
        
        // Harmonic flow bias
        this.flowBias = new THREE.Vector3(0, 0, 0);
        this.flowStrength = 0.0;
        this.flowAge = 0.0;
        
        // Path reinforcement
        this.reinforcedLinks = new Map();     // linkId -> reinforcement value
        this.reinforcementStrength = 0.0;
        
        // Scar memory
        this.scarIntensity = 0.0;
        this.scarCenterOffset = new THREE.Vector3(0, 0, 0);
        
        // Hub info
        this.isMaturedHub = false;
        this.hubAge = 0.0;
        this.hubSynergyAccumulation = 0.0;
        
        // History tracking
        this.eventHistory = [];           // Ring buffer of recent events
        this.synthesisCount = 0;
    }
    
    reset() {
        this.active = false;
        this.age = 0.0;
        this.flowBias.set(0, 0, 0);
        this.flowStrength = 0.0;
        this.reinforcedLinks.clear();
        this.reinforcementStrength = 0.0;
        this.scarIntensity = 0.0;
        this.eventHistory.length = 0;
        this.synthesisCount = 0;
    }
    
    initialize(center) {
        this.center.copy(center);
        this.active = true;
        this.age = 0.0;
        this.flowAge = 0.0;
    }
    
    // ========================================================================
    // HARMONIC FLOW LEARNING
    // ========================================================================
    
    recordHarmonicFlow(direction, strength, harmony) {
        // Direction: where influence traveled
        // Strength: magnitude of influence
        // Harmony: harmonic quality
        
        const harmonyFactor = Math.max(0, harmony - 0.4) / 0.6;  // 0-1
        const weightedDir = direction.clone().multiplyScalar(strength * harmonyFactor);
        
        // Update flow bias (exponential moving average)
        const alpha = 0.1;  // Learning rate
        this.flowBias.lerp(weightedDir, alpha);
        
        // Update flow strength
        const baseStrength = CONFIG.FLOW_BIAS_STRENGTH * strength * harmonyFactor;
        this.flowStrength = Math.min(
            this.flowStrength + baseStrength * CONFIG.HARMONY_FLOW_BOOST,
            1.0
        );
        
        this.flowAge = 0.0;  // Reset age (activity keeps it alive)
    }
    
    // ========================================================================
    // PATH REINFORCEMENT
    // ========================================================================
    
    reinforceLink(linkId, harmony, synergy) {
        if (!this.reinforcedLinks.has(linkId)) {
            this.reinforcedLinks.set(linkId, 0.0);
        }
        
        let reinforcement = this.reinforcedLinks.get(linkId);
        const harmonyFactor = Math.max(0, harmony - 0.5) * 2;  // 0-1
        const synergyFactor = Math.max(0, synergy - 0.4);      // 0+
        
        const increase = CONFIG.REINFORCEMENT_ACCUMULATION * harmonyFactor * (1 + synergyFactor);
        reinforcement = Math.min(reinforcement + increase, CONFIG.MAX_REINFORCEMENT);
        
        this.reinforcedLinks.set(linkId, reinforcement);
        this.reinforcementStrength = Math.max(this.reinforcementStrength, reinforcement);
    }
    
    getLinkReinforcement(linkId) {
        return this.reinforcedLinks.get(linkId) || 0.0;
    }
    
    // ========================================================================
    // SCAR MEMORY
    // ========================================================================
    
    recordRupture(position, intensity) {
        // Position: where rupture occurred
        // Intensity: severity of rupture (0-1)
        
        const offset = position.clone().sub(this.center);
        const increase = CONFIG.SCAR_FORMATION_RATE * intensity;
        
        this.scarIntensity = Math.min(
            this.scarIntensity + increase,
            CONFIG.MAX_SCAR_INTENSITY
        );
        
        // Track scar location (weighted toward rupture center)
        this.scarCenterOffset.lerp(offset, 0.3);
    }
    
    getScarAvoidanceVector(position) {
        // Returns direction to avoid (away from scar center)
        if (this.scarIntensity < 0.01) {
            return new THREE.Vector3(0, 0, 0);
        }
        
        const scarPos = this.center.clone().add(this.scarCenterOffset);
        const avoidDir = position.clone().sub(scarPos).normalize();
        const strength = this.scarIntensity * CONFIG.SCAR_AVOIDANCE_RADIUS;
        
        return avoidDir.multiplyScalar(strength);
    }
    
    // ========================================================================
    // HUB MATURATION
    // ========================================================================
    
    recordHubActivity(synergy, deltaTime = 0) {
        if (!this.isMaturedHub) {
            this.hubAge += Math.max(0, deltaTime);
            this.hubSynergyAccumulation += synergy;
            
            if (this.hubAge > CONFIG.HUB_MATURATION_THRESHOLD) {
                this.isMaturedHub = true;
                console.log('[Topology] Hub matured at region:', this.center);
            }
        }
        
        this.synthesisCount++;
    }
    
    getHubPresence() {
        if (!this.isMaturedHub) return 0.0;
        
        const ageBonus = Math.min(this.hubAge / 120.0, 1.0);  // 2 minutes → 1.0
        const synergyBonus = Math.min(this.hubSynergyAccumulation / 100.0, 0.5);
        
        return (CONFIG.HUB_SPATIAL_CONFIDENCE * ageBonus) + synergyBonus;
    }
    
    // ========================================================================
    // TEMPORAL DECAY
    // ========================================================================
    
    update(deltaTime) {
        if (!this.active) return;
        this.age += deltaTime;
        this.flowAge += deltaTime;
        
        // Flow bias decay
        if (this.flowAge > 30.0) {  // 30 seconds of inactivity
            this.flowStrength *= (1.0 - CONFIG.CORRUPTION_FLOW_DAMPEN * deltaTime);
        }
        
        // Path reinforcement decay
        for (let [linkId, value] of this.reinforcedLinks.entries()) {
            const decayed = value * (1.0 - CONFIG.REINFORCEMENT_DECAY_RATE * deltaTime);
            if (decayed < 0.01) {
                this.reinforcedLinks.delete(linkId);
            } else {
                this.reinforcedLinks.set(linkId, decayed);
            }
        }
        
        // Scar intensity decay (very slow)
        this.scarIntensity *= (1.0 - CONFIG.SCAR_DECAY_RATE * deltaTime);
        
        // Check if region should deactivate
        const isActive = this.flowStrength > 0.01 ||
                        this.reinforcementStrength > 0.01 ||
                        this.scarIntensity > 0.01 ||
                        this.isMaturedHub;
        
        if (!isActive && this.age > CONFIG.LEARNING_WINDOW) {
            this.active = false;
        }
    }
}

// ============================================================================
// MAIN HARMONIC TOPOLOGY LEARNING SYSTEM
// ============================================================================

export class HarmonicTopologyLearningSystem {
    constructor(scene) {
        this.scene = scene;
        
        // Topology regions (sparse grid)
        this.topologyRegions = [];
        this.regionMap = new Map();  // center hash -> region
        
        for (let i = 0; i < CONFIG.POOL_SIZE; i++) {
            this.topologyRegions.push(new TopologyRegion(new THREE.Vector3()));
        }
        
        // Update tracking
        this.updateTimer = 0.0;
        this.lastCoarseUpdate = 0.0;
        
        // Debug visualization
        this.debugVisualization = null;
        this.debugMarkerGeometry = null;
        this.debugMarkerMaterial = null;
        this.debugScarGeometry = null;
        this.debugScarMaterial = null;
        this.debugLineMaterial = null;
        this.debugFlowEndPoint = new THREE.Vector3();
        this.debugScarPosition = new THREE.Vector3();
        if (CONFIG.DEBUG_DRAW_TOPOLOGY) {
            this.setupDebugVisualization();
        }
        
        this.enabled = true;
        
        // Event bus (optional, set via setEventBus)
        this.semanticBus = null;
        
        console.log('[HarmonicTopologyLearningSystem] Initialized');
    }
    
    // ========================================================================
    // EVENT BUS INTEGRATION
    // ========================================================================
    
    setEventBus(semanticBus) {
        this.semanticBus = semanticBus;
        
        if (!this.semanticBus) {
            console.warn('[HarmonicTopologyLearningSystem] No event bus provided');
            return;
        }
        
        // Listen for rupture events
        this.semanticBus.on('topology.rupture', (data) => {
            if (data.position && typeof data.intensity === 'number') {
                this.recordRupture(data.position, data.intensity);
            }
        });
        
        // Listen for healing events
        this.semanticBus.on('topology.healing', (data) => {
            if (data.position && typeof data.harmonyRestored === 'number') {
                this.recordHealing(data.position, data.harmonyRestored);
            }
        });
        
        console.log('[HarmonicTopologyLearningSystem] Event bus connected');
    }
    
    // ========================================================================
    // REGION MANAGEMENT
    // ========================================================================
    
    getOrCreateRegion(position) {
        // Hash position to grid
        const gridX = Math.floor(position.x / CONFIG.REGION_SIZE);
        const gridY = Math.floor(position.y / CONFIG.REGION_SIZE);
        const gridZ = Math.floor(position.z / CONFIG.REGION_SIZE);
        const hash = `${gridX},${gridY},${gridZ}`;
        
        if (this.regionMap.has(hash)) {
            return this.regionMap.get(hash);
        }
        
        // Find available region
        let region = null;
        for (let r of this.topologyRegions) {
            if (!r.active) {
                region = r;
                break;
            }
        }
        
        if (!region) {
            console.warn('[Topology] Region pool exhausted');
            return null;
        }
        
        // Initialize region
        const regionCenter = new THREE.Vector3(
            gridX * CONFIG.REGION_SIZE,
            gridY * CONFIG.REGION_SIZE,
            gridZ * CONFIG.REGION_SIZE
        );
        region.initialize(regionCenter);
        this.regionMap.set(hash, region);
        
        return region;
    }
    
    // ========================================================================
    // LEARNING INTEGRATION
    // ========================================================================
    
    recordCompositeGlyphSynthesis(compositeGlyph, harmonyBalance, synergy, deltaTime = 0) {
        if (!this.enabled || !compositeGlyph || !compositeGlyph.mesh) return;
        
        const position = compositeGlyph.mesh.position;
        const region = this.getOrCreateRegion(position);
        if (!region) return;
        
        // Record hub activity
        const safeSynergy = Number.isFinite(synergy) ? synergy : 0.0;
        region.recordHubActivity(safeSynergy, deltaTime);
        
        // Record harmonic flow (radial from glyph)
        if (synergy > 0.5) {
            const direction = new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize();
            
            region.recordHarmonicFlow(direction, synergy * 0.5, harmonyBalance);
        }
    }
    
    recordLinkSuccessfulPassage(link, position, harmony, synergy) {
        if (!this.enabled || !link) return;
        
        const region = this.getOrCreateRegion(position);
        if (!region) return;
        
        // Reinforce link (will improve motion smoothing)
        const linkId = link.uuid || link.id;
        region.reinforceLink(linkId, harmony, synergy);
    }

    recordLinkSuccessfulPassageFromLink(link) {
        if (!this.enabled || !link) return;

        const sourceNode = link.source || link.sourceNode || null;
        const targetNode = link.target || link.targetNode || null;
        const sourcePos = sourceNode?.position || sourceNode?.userData?.position;
        const targetPos = targetNode?.position || targetNode?.userData?.position;
        if (!sourcePos || !targetPos) return;

        const midpoint = new THREE.Vector3(
            (sourcePos.x + targetPos.x) * 0.5,
            (sourcePos.y + targetPos.y) * 0.5,
            (sourcePos.z + targetPos.z) * 0.5
        );
        const region = this.getOrCreateRegion(midpoint);
        if (!region) return;

        const readMetric = (node, key) => {
            if (!node) return 0;
            const metrics = node.userData?.metrics;
            const metricValue = metrics && typeof metrics[key] === 'number' ? metrics[key] : undefined;
            if (typeof metricValue === 'number' && Number.isFinite(metricValue)) return metricValue;

            const directValue = node.userData?.[key];
            if (typeof directValue === 'number' && Number.isFinite(directValue)) return directValue;

            return 0;
        };

        const sourceHarmony = readMetric(sourceNode, 'harmony');
        const targetHarmony = readMetric(targetNode, 'harmony');
        const sourceSynergy = readMetric(sourceNode, 'synergy');
        const targetSynergy = readMetric(targetNode, 'synergy');

        const harmony = (sourceHarmony + targetHarmony) * 0.5;
        const synergy = Number.isFinite(link?.synergyScore)
            ? link.synergyScore
            : (sourceSynergy + targetSynergy) * 0.5;

        this.recordLinkSuccessfulPassage(link, midpoint, harmony, synergy);

        const flowDirection = targetPos.clone().sub(sourcePos);
        if (flowDirection.lengthSq() > 0.0001) {
            const flowStrength = Math.max(0, harmony, synergy);
            if (flowStrength > 0) {
                region.recordHarmonicFlow(flowDirection.normalize(), flowStrength, harmony);
            }
        }
    }
    
    recordRupture(position, intensity, region = null) {
        if (!this.enabled) return;
        
        if (!region) {
            region = this.getOrCreateRegion(position);
        }
        if (!region) return;
        
        region.recordRupture(position, intensity);
    }
    
    recordHealing(position, harmonyRestored) {
        if (!this.enabled) return;
        
        const region = this.getOrCreateRegion(position);
        if (!region) return;
        
        // Healing softens scars
        region.scarIntensity *= (1.0 - harmonyRestored * 0.3);
    }
    
    // ========================================================================
    // TOPOLOGY QUERIES (FOR OTHER SYSTEMS)
    // ========================================================================
    
    getFlowBiasAtPosition(position) {
        const region = this.getOrCreateRegion(position);
        if (!region) return new THREE.Vector3();
        
        return region.flowBias.clone().normalize().multiplyScalar(region.flowStrength);
    }
    
    getScarAvoidanceAtPosition(position) {
        const region = this.getOrCreateRegion(position);
        if (!region) return new THREE.Vector3();
        
        return region.getScarAvoidanceVector(position);
    }
    
    getLinkReinforcement(link, position) {
        const region = this.getOrCreateRegion(position);
        if (!region) return 0.0;
        
        const linkId = link.uuid || link.id;
        return region.getLinkReinforcement(linkId);
    }
    
    getHubPresence(position) {
        const region = this.getOrCreateRegion(position);
        if (!region) return 0.0;
        
        return region.getHubPresence();
    }
    
    // ========================================================================
    // UPDATE LOOP
    // ========================================================================
    
    update(deltaTime, fusionZoneManager, linkingSystem) {
        if (!this.enabled) return;
        
        this.updateTimer += deltaTime;
        if (this.updateTimer < CONFIG.UPDATE_INTERVAL) return;
        this.updateTimer = 0.0;
        
        // Update all regions
        this.updateRegions(deltaTime);
        
        // Record learning from active systems
        this.recordSystemsActivity(fusionZoneManager, linkingSystem, deltaTime);
        
        // Coarse updates (every 5 seconds)
        this.lastCoarseUpdate += deltaTime;
        if (this.lastCoarseUpdate > CONFIG.COARSE_UPDATE_INTERVAL) {
            this.performCoarseUpdate();
            this.lastCoarseUpdate = 0.0;
        }
        
        // Update debug visualization
        if (CONFIG.DEBUG_DRAW_TOPOLOGY) {
            if (!this.debugVisualization) {
                this.setupDebugVisualization();
            }
            this.updateDebugVisualization();
        }
    }
    
    updateRegions(deltaTime) {
        for (let region of this.topologyRegions) {
            if (!region.active) continue;
            region.update(deltaTime);
        }
        
        // Clean up dead regions
        for (let [hash, region] of this.regionMap.entries()) {
            if (!region.active) {
                this.regionMap.delete(hash);
            }
        }
    }
    
    recordSystemsActivity(fusionZoneManager, linkingSystem, deltaTime = 0) {
        const compositeGlyphs = fusionZoneManager?.compositeGlyphs;
        if (Array.isArray(compositeGlyphs)) {
            // Record composite glyph synthesis when the fusion system is active.
            for (let composite of compositeGlyphs) {
                if (!composite.active || !composite.state) continue;

                const harmonyBalance = Number.isFinite(composite.state.harmonyBalance)
                    ? composite.state.harmonyBalance
                    : Number.isFinite(composite.state.harmonBalance)
                        ? composite.state.harmonBalance
                        : 0.0;
                const averageSynergy = Number.isFinite(composite.state.averageSynergy)
                    ? composite.state.averageSynergy
                    : 0.0;

                this.recordCompositeGlyphSynthesis(
                    composite,
                    harmonyBalance,
                    averageSynergy,
                    deltaTime
                );
            }
        }

        if (linkingSystem?.links && Array.isArray(linkingSystem.links)) {
            for (const link of linkingSystem.links) {
                this.recordLinkSuccessfulPassageFromLink(link);
            }
        }
    }
    
    performCoarseUpdate() {
        // Heavy computations done infrequently
        // Could include: topology stability analysis, learning metrics
    }
    
    // ========================================================================
    // ENABLE / DISABLE
    // ========================================================================
    
    enable() {
        this.enabled = true;
        console.log('[HarmonicTopologyLearningSystem] ENABLED');
    }
    
    disable() {
        this.enabled = false;
        this.resetAll();
        console.log('[HarmonicTopologyLearningSystem] DISABLED');
    }
    
    resetAll() {
        for (let region of this.topologyRegions) {
            region.reset();
        }
        this.regionMap.clear();
    }
    
    // ========================================================================
    // DEBUG VISUALIZATION
    // ========================================================================
    
    setupDebugVisualization() {
        this.ensureDebugResources();

        const container = new THREE.Group();
        container.name = 'TopologyDebug';
        this.scene.add(container);
        this.debugVisualization = container;
    }

    ensureDebugResources() {
        if (!this.debugMarkerGeometry) {
            this.debugMarkerGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        }

        if (!this.debugMarkerMaterial) {
            this.debugMarkerMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: 0.5
            });
        }

        if (!this.debugScarGeometry) {
            this.debugScarGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        }

        if (!this.debugScarMaterial) {
            this.debugScarMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.4
            });
        }

        if (!this.debugLineMaterial) {
            this.debugLineMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff });
        }
    }

    clearDebugVisualization() {
        if (!this.debugVisualization) return;

        while (this.debugVisualization.children.length > 0) {
            const child = this.debugVisualization.children[this.debugVisualization.children.length - 1];

            if (child && child.geometry && child.geometry !== this.debugMarkerGeometry && child.geometry !== this.debugScarGeometry) {
                child.geometry.dispose();
            }

            if (child && child.material && child.material !== this.debugMarkerMaterial && child.material !== this.debugScarMaterial && child.material !== this.debugLineMaterial) {
                if (Array.isArray(child.material)) {
                    for (let material of child.material) {
                        material.dispose();
                    }
                } else {
                    child.material.dispose();
                }
            }

            this.debugVisualization.remove(child);
        }
    }
    
    updateDebugVisualization() {
        if (!this.debugVisualization) return;
        this.ensureDebugResources();
        
        // Clear old visuals
        this.clearDebugVisualization();
        
        // Draw active regions
        for (let region of this.topologyRegions) {
            if (!region.active) continue;
            
            // Region center marker
            const marker = new THREE.Mesh(this.debugMarkerGeometry, this.debugMarkerMaterial);
            marker.frustumCulled = false;
            marker.position.copy(region.center);
            this.debugVisualization.add(marker);
            
            // Flow bias vector
            if (CONFIG.DEBUG_SHOW_REINFORCEMENT && region.flowStrength > 0.01) {
                const endPoint = this.debugFlowEndPoint.copy(region.flowBias).multiplyScalar(2).add(region.center);
                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.BufferAttribute(
                    new Float32Array([
                        region.center.x, region.center.y, region.center.z,
                        endPoint.x, endPoint.y, endPoint.z
                    ]), 3
                ));
                const line = new THREE.Line(geometry, this.debugLineMaterial);
                line.frustumCulled = false;
                this.debugVisualization.add(line);
            }
            
            // Scar visualization
            if (CONFIG.DEBUG_SHOW_SCARS && region.scarIntensity > 0.01) {
                const scarPos = this.debugScarPosition.copy(region.center).add(region.scarCenterOffset);
                const scarMesh = new THREE.Mesh(this.debugScarGeometry, this.debugScarMaterial.clone());
                scarMesh.frustumCulled = false;
                scarMesh.material.opacity = region.scarIntensity * 0.4;
                scarMesh.position.copy(scarPos);
                this.debugVisualization.add(scarMesh);
            }
        }
    }
    
    // ========================================================================
    // DATA ACCESS (FOR VISUALIZATION ADAPTERS)
    // ========================================================================
    
    getActiveRegions() {
        return this.topologyRegions.filter(r => r.active);
    }
    
    // ========================================================================
    // STATUS & CONSOLE API
    // ========================================================================
    
    getStatus() {
        const activeRegions = this.topologyRegions.filter(r => r.active).length;
        
        // Calculate learning strength
        let avgFlowStrength = 0;
        let avgReinforcementStrength = 0;
        let avgScarIntensity = 0;
        let maturedHubs = 0;
        
        for (let region of this.topologyRegions) {
            if (!region.active) continue;
            
            avgFlowStrength += region.flowStrength;
            avgReinforcementStrength += region.reinforcementStrength;
            avgScarIntensity += region.scarIntensity;
            if (region.isMaturedHub) maturedHubs++;
        }
        
        const regionCount = Math.max(1, activeRegions);
        avgFlowStrength /= regionCount;
        avgReinforcementStrength /= regionCount;
        avgScarIntensity /= regionCount;
        
        return {
            enabled: this.enabled,
            activeRegions,
            learnedFlowStrength: avgFlowStrength.toFixed(2),
            pathReinforcementStrength: avgReinforcementStrength.toFixed(2),
            scarMemoryIntensity: avgScarIntensity.toFixed(2),
            maturedHubs,
            totalCapacity: CONFIG.POOL_SIZE
        };
    }
}

// ============================================================================
// CONSOLE API
// ============================================================================

export function setupHarmonicTopologyConsoleAPI(game, topologySystem) {
    if (!window.game) return;
    
    window.game.topologyStatus = () => {
        const status = topologySystem.getStatus();
        console.log('[Topology] Status:', status);
        return status;
    };
    
    window.game.enableTopology = () => {
        topologySystem.enable();
    };
    
    window.game.disableTopology = () => {
        topologySystem.disable();
    };
    
    window.game.toggleTopologyDebug = () => {
        CONFIG.DEBUG_DRAW_TOPOLOGY = !CONFIG.DEBUG_DRAW_TOPOLOGY;
        console.log('[Topology] Debug visualization:', CONFIG.DEBUG_DRAW_TOPOLOGY);
    };
    
    window.game.toggleTopologyReinforcement = () => {
        CONFIG.DEBUG_SHOW_REINFORCEMENT = !CONFIG.DEBUG_SHOW_REINFORCEMENT;
        console.log('[Topology] Show reinforcement:', CONFIG.DEBUG_SHOW_REINFORCEMENT);
    };
    
    window.game.toggleTopologyScarDebug = () => {
        CONFIG.DEBUG_SHOW_SCARS = !CONFIG.DEBUG_SHOW_SCARS;
        console.log('[Topology] Show scars:', CONFIG.DEBUG_SHOW_SCARS);
    };
    
    console.log('[HarmonicTopologyLearningSystem] Console API ready:');
    console.log('  game.topologyStatus()');
    console.log('  game.enableTopology() / disableTopology()');
    console.log('  game.toggleTopologyDebug()');
    console.log('  game.toggleTopologyReinforcement()');
    console.log('  game.toggleTopologyScarDebug()');
}
