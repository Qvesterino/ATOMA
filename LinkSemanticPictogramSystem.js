/**
 * ============================================================================
 * LINK SEMANTIC PICTOGRAM SYSTEM
 * ============================================================================
 * 
 * Floating pictograms above links that encode network meaning visually.
 * 
 * CORE PHILOSOPHY:
 * - Pictograms represent semantic meaning flowing through network
 * - Not particles, not decoration — symbols of intent and memory
 * - Allow player to *read the system* without UI or text
 * 
 * FEATURES:
 * - Procedural pictogram geometry from library
 * - Drift along link paths with offset above geometry
 * - Semantic mapping from link state to pictogram type
 * - Size tiers (many small, few medium, rare large)
 * - Motion follows influence flow and synergy
 * 
 * INTEGRATION:
 * - Adapter-only (reads link state, writes visuals only)
 * - No gameplay logic changes
 * - Coexists with braided rope links, pulse waves, streaks
 * - Never occludes nodes
 * 
 * ============================================================================
 */

import * as THREE from 'three';
import { PictogramLibrary, createPictogramMaterial } from './LinkPictogramLibrary.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // Spawn density
    MAX_PICTOGRAMS_PER_LINK: 4,
    SPAWN_INTERVAL: 2.0, // Spawn new pictogram every 2 seconds
    
    // Size tiers
    SIZE_SMALL: 0.15,
    SIZE_MEDIUM: 0.25,
    SIZE_LARGE: 0.4,
    
    // Size distribution (small, medium, large)
    SIZE_DISTRIBUTION: [0.7, 0.25, 0.05], // 70% small, 25% medium, 5% large
    
    // Motion
    BASE_DRIFT_SPEED: 0.3, // Units per second
    SYNERGY_SPEED_MULTIPLIER: 2.0, // Speed multiplies with synergy
    VERTICAL_OFFSET_MIN: 0.5, // Min height above link
    VERTICAL_OFFSET_MAX: 1.2, // Max height above link
    LATERAL_DRIFT_AMOUNT: 0.1, // Slight side-to-side drift
    
    // Standing wave behavior
    STANDING_WAVE_OSCILLATION_AMOUNT: 0.3,
    STANDING_WAVE_OSCILLATION_SPEED: 2.0,
    
    // Healing behavior
    HEALING_UPWARD_DRIFT: 0.2,
    HEALING_BRIGHTNESS_BOOST: 0.3,
    
    // Fade
    FADE_IN_DURATION: 0.5,
    FADE_OUT_DURATION: 0.8,
    LIFETIME_MIN: 8.0,
    LIFETIME_MAX: 15.0,
    
    // Performance
    POOL_SIZE: 200,
    UPDATE_INTERVAL: 1 / 30, // Update 30 times per second
    
    // Semantic thresholds
    HARMONY_THRESHOLD: 0.6,
    CORRUPTION_THRESHOLD: 0.6,
    SYNERGY_THRESHOLD: 0.5,
    INSTABILITY_THRESHOLD: 0.4,
    HEALING_THRESHOLD: 0.3,
    STANDING_WAVE_THRESHOLD: 0.3
};

// ============================================================================
// PICTOGRAM INSTANCE
// ============================================================================

class PictogramInstance {
    constructor(mesh) {
        this.mesh = mesh;
        this.active = false;
        this.link = null;
        this.linkProgress = 0.0; // 0-1 position along link
        this.verticalOffset = 0.5;
        this.lateralPhase = 0.0;
        this.age = 0.0;
        this.lifetime = 10.0;
        this.size = CONFIG.SIZE_SMALL;
        this.baseSpeed = CONFIG.BASE_DRIFT_SPEED;
        this.type = null;
        this.standingWavePhase = 0.0;
        this.isHealing = false;
    }

    reset() {
        this.active = false;
        this.mesh.visible = false;
        this.link = null;
        this.linkProgress = 0.0;
        this.age = 0.0;
        this.type = null;
        this.isHealing = false;
    }

    spawn(link, type, size, verticalOffset) {
        this.active = true;
        this.link = link;
        this.type = type;
        this.size = size;
        this.verticalOffset = verticalOffset;
        this.linkProgress = Math.random(); // Start at random point
        this.lateralPhase = Math.random() * Math.PI * 2;
        this.age = 0.0;
        this.lifetime = THREE.MathUtils.lerp(
            CONFIG.LIFETIME_MIN,
            CONFIG.LIFETIME_MAX,
            Math.random()
        );
        this.baseSpeed = CONFIG.BASE_DRIFT_SPEED * (0.8 + Math.random() * 0.4);
        this.standingWavePhase = Math.random() * Math.PI * 2;
        
        this.mesh.visible = true;
        this.mesh.scale.setScalar(size);
    }

    update(deltaTime, linkState) {
        if (!this.active || !this.link) return;

        this.age += deltaTime;

        // Check if lifetime expired
        if (this.age >= this.lifetime) {
            this.reset();
            return;
        }

        // Calculate drift speed based on synergy
        const synergyMultiplier = 1.0 + (linkState.synergy || 0) * CONFIG.SYNERGY_SPEED_MULTIPLIER;
        let speed = this.baseSpeed * synergyMultiplier;

        // Standing wave behavior: oscillate locally
        if (linkState.hasStandingWave) {
            this.standingWavePhase += deltaTime * CONFIG.STANDING_WAVE_OSCILLATION_SPEED;
            const oscillation = Math.sin(this.standingWavePhase) * CONFIG.STANDING_WAVE_OSCILLATION_AMOUNT;
            speed *= (1.0 + oscillation);
        }

        // Instability reduces count (early fade)
        if (linkState.instability > CONFIG.INSTABILITY_THRESHOLD) {
            const instabilityFactor = (linkState.instability - CONFIG.INSTABILITY_THRESHOLD) / (1.0 - CONFIG.INSTABILITY_THRESHOLD);
            this.lifetime *= (1.0 - instabilityFactor * 0.5 * deltaTime);
        }

        // Update progress along link
        this.linkProgress += (speed * deltaTime) / (this.link.userData?.length || 10.0);
        
        // Wrap around
        if (this.linkProgress > 1.0) {
            this.linkProgress -= 1.0;
        }

        // Update lateral drift phase
        this.lateralPhase += deltaTime * 0.5;

        // Update position along link
        this.updatePositionAlongLink(linkState);

        // Update opacity (fade in/out)
        this.updateOpacity();

        // Healing behavior
        if (linkState.isHealing) {
            this.isHealing = true;
            this.verticalOffset += CONFIG.HEALING_UPWARD_DRIFT * deltaTime;
        }
    }

    updatePositionAlongLink(linkState) {
        const nodeA = this.link.userData?.nodeA;
        const nodeB = this.link.userData?.nodeB;
        if (!nodeA || !nodeB) return;

        // Interpolate along link (with curve if applicable)
        const t = this.linkProgress;
        const basePos = new THREE.Vector3().lerpVectors(
            nodeA.position,
            nodeB.position,
            t
        );

        // Get link direction for normal calculation
        const linkDir = new THREE.Vector3().subVectors(nodeB.position, nodeA.position).normalize();
        
        // Calculate up vector (perpendicular to link)
        const up = new THREE.Vector3(0, 1, 0);
        const perpendicular = new THREE.Vector3().crossVectors(linkDir, up).normalize();
        
        // Apply vertical offset
        basePos.y += this.verticalOffset;

        // Apply lateral drift
        const lateralOffset = Math.sin(this.lateralPhase) * CONFIG.LATERAL_DRIFT_AMOUNT;
        basePos.add(perpendicular.multiplyScalar(lateralOffset));

        this.mesh.position.copy(basePos);

        // Face camera (billboard effect)
        // This will be handled by material or can be done here if needed
    }

    updateOpacity() {
        const fadeInEnd = CONFIG.FADE_IN_DURATION;
        const fadeOutStart = this.lifetime - CONFIG.FADE_OUT_DURATION;
        
        let opacity = 1.0;

        if (this.age < fadeInEnd) {
            opacity = this.age / fadeInEnd;
        } else if (this.age > fadeOutStart) {
            opacity = (this.lifetime - this.age) / CONFIG.FADE_OUT_DURATION;
        }

        // Healing brightness boost
        if (this.isHealing) {
            opacity = Math.min(opacity * (1.0 + CONFIG.HEALING_BRIGHTNESS_BOOST), 1.0);
        }

        if (this.mesh.material) {
            this.mesh.material.opacity = opacity * 0.6; // Base opacity
        }
    }
}

// ============================================================================
// MAIN PICTOGRAM SYSTEM
// ============================================================================

export class LinkSemanticPictogramSystem {
    constructor(scene, linkingSystem) {
        this.scene = scene;
        this.linkingSystem = linkingSystem;

        // Enable flag
        this.enabled = true;

        // Pictogram pool
        this.pictograms = [];
        this.initializePictogramPool();

        // Per-link tracking
        this.linkPictogramCounts = new Map(); // linkId -> count
        this.linkSpawnTimers = new Map(); // linkId -> time since last spawn

        // Update timer
        this.updateTimer = 0.0;

        // Pictogram type cache (for performance)
        this.geometryCache = new Map();
        this.initializeGeometryCache();

        console.log('[LinkSemanticPictogramSystem] Initialized with pool size:', CONFIG.POOL_SIZE);
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    initializePictogramPool() {
        const container = new THREE.Group();
        container.name = 'PictogramContainer';
        this.scene.add(container);
        this.container = container;

        for (let i = 0; i < CONFIG.POOL_SIZE; i++) {
            // Start with a default geometry (will be replaced on spawn)
            const geometry = new THREE.PlaneGeometry(1, 1);
            const material = createPictogramMaterial();
            const mesh = new THREE.Mesh(geometry, material);
            mesh.visible = false;
            
            container.add(mesh);

            const instance = new PictogramInstance(mesh);
            this.pictograms.push(instance);
        }
    }

    initializeGeometryCache() {
        // Pre-create all pictogram geometries for fast access
        Object.entries(PictogramLibrary).forEach(([key, definition]) => {
            const geometry = definition.create(1.0); // Base size 1.0, scaled per instance
            this.geometryCache.set(key, geometry);
        });

        console.log('[LinkSemanticPictogramSystem] Geometry cache initialized:', this.geometryCache.size, 'types');
    }

    // ========================================================================
    // UPDATE
    // ========================================================================

    update(deltaTime, time) {
        if (!this.enabled) return;

        // Throttle updates
        this.updateTimer += deltaTime;
        if (this.updateTimer < CONFIG.UPDATE_INTERVAL) return;
        
        const actualDelta = this.updateTimer;
        this.updateTimer = 0.0;

        // Update spawn timers
        this.updateSpawnTimers(actualDelta);

        // Spawn new pictograms
        this.spawnPictograms(time);

        // Update active pictograms
        this.updateActivePictograms(actualDelta);
    }

    updateSpawnTimers(deltaTime) {
        if (!this.linkingSystem || !this.linkingSystem.links) return;

        this.linkingSystem.links.forEach(link => {
            const linkId = link.uuid;
            
            if (!this.linkSpawnTimers.has(linkId)) {
                this.linkSpawnTimers.set(linkId, 0);
            }

            const timer = this.linkSpawnTimers.get(linkId);
            this.linkSpawnTimers.set(linkId, timer + deltaTime);
        });
    }

    spawnPictograms(time) {
        if (!this.linkingSystem || !this.linkingSystem.links) return;

        this.linkingSystem.links.forEach(link => {
            const linkId = link.uuid;
            
            // Check spawn timer
            const timer = this.linkSpawnTimers.get(linkId) || 0;
            if (timer < CONFIG.SPAWN_INTERVAL) return;

            // Check pictogram count
            const currentCount = this.linkPictogramCounts.get(linkId) || 0;
            if (currentCount >= CONFIG.MAX_PICTOGRAMS_PER_LINK) return;

            // Determine link state
            const linkState = this.analyzeLinkState(link);

            // Instability reduces spawn chance
            if (linkState.instability > CONFIG.INSTABILITY_THRESHOLD) {
                const spawnChance = 1.0 - linkState.instability * 0.5;
                if (Math.random() > spawnChance) {
                    this.linkSpawnTimers.set(linkId, 0);
                    return;
                }
            }

            // Select pictogram type based on link state
            const pictogramType = this.selectPictogramType(linkState);
            if (!pictogramType) {
                this.linkSpawnTimers.set(linkId, 0);
                return;
            }

            // Select size tier
            const size = this.selectSizeTier();

            // Select vertical offset
            const verticalOffset = THREE.MathUtils.lerp(
                CONFIG.VERTICAL_OFFSET_MIN,
                CONFIG.VERTICAL_OFFSET_MAX,
                Math.random()
            );

            // Spawn pictogram
            this.spawnPictogram(link, pictogramType, size, verticalOffset);

            // Reset timer
            this.linkSpawnTimers.set(linkId, 0);

            // Update count
            this.linkPictogramCounts.set(linkId, currentCount + 1);
        });
    }

    updateActivePictograms(deltaTime) {
        this.pictograms.forEach(pictogram => {
            if (!pictogram.active) return;

            // Get current link state
            const linkState = this.analyzeLinkState(pictogram.link);

            // Update pictogram
            pictogram.update(deltaTime, linkState);

            // If deactivated, update count
            if (!pictogram.active && pictogram.link) {
                const linkId = pictogram.link.uuid;
                const count = this.linkPictogramCounts.get(linkId) || 0;
                this.linkPictogramCounts.set(linkId, Math.max(0, count - 1));
            }
        });
    }

    // ========================================================================
    // LINK STATE ANALYSIS
    // ========================================================================

    analyzeLinkState(link) {
        if (!link || !link.userData) {
            return {
                harmony: 0,
                corruption: 0,
                synergy: 0,
                instability: 0,
                isHealing: false,
                hasStandingWave: false
            };
        }

        const nodeA = link.userData.nodeA;
        const nodeB = link.userData.nodeB;

        // Calculate average node states
        const avgHarmony = ((nodeA?.userData?.harmony || 0) + (nodeB?.userData?.harmony || 0)) / 2;
        const avgCorruption = ((nodeA?.userData?.corruption || 0) + (nodeB?.userData?.corruption || 0)) / 2;
        const avgSynergy = link.userData.synergy || 0;
        const avgStability = ((nodeA?.userData?.stability || 1) + (nodeB?.userData?.stability || 1)) / 2;
        const instability = 1.0 - avgStability;

        // Check healing state
        const isHealing = (nodeA?.userData?.isHealing || false) || (nodeB?.userData?.isHealing || false);

        // Check standing wave (would need integration with standing wave system)
        const hasStandingWave = link.userData.hasStandingWave || false;

        return {
            harmony: avgHarmony,
            corruption: avgCorruption,
            synergy: avgSynergy,
            instability: instability,
            isHealing: isHealing,
            hasStandingWave: hasStandingWave
        };
    }

    // ========================================================================
    // PICTOGRAM TYPE SELECTION
    // ========================================================================

    selectPictogramType(linkState) {
        // Weighted selection based on link state
        const weights = {
            harmony: linkState.harmony,
            corruption: linkState.corruption,
            synergy: linkState.synergy,
            instability: linkState.instability,
            healing: linkState.isHealing ? 0.8 : 0,
            standing_wave: linkState.hasStandingWave ? 0.7 : 0
        };

        // Find dominant state
        let dominantCategory = 'harmony';
        let maxWeight = 0;

        Object.entries(weights).forEach(([category, weight]) => {
            if (weight > maxWeight) {
                maxWeight = weight;
                dominantCategory = category;
            }
        });

        // If no clear dominant state, return null (no spawn)
        if (maxWeight < 0.3) return null;

        // Select random pictogram from dominant category
        const categoryPictograms = Object.entries(PictogramLibrary).filter(
            ([key, def]) => def.category === dominantCategory
        );

        if (categoryPictograms.length === 0) return null;

        const randomIndex = Math.floor(Math.random() * categoryPictograms.length);
        return categoryPictograms[randomIndex][0];
    }

    selectSizeTier() {
        const random = Math.random();
        let cumulative = 0;

        for (let i = 0; i < CONFIG.SIZE_DISTRIBUTION.length; i++) {
            cumulative += CONFIG.SIZE_DISTRIBUTION[i];
            if (random < cumulative) {
                switch (i) {
                    case 0: return CONFIG.SIZE_SMALL;
                    case 1: return CONFIG.SIZE_MEDIUM;
                    case 2: return CONFIG.SIZE_LARGE;
                }
            }
        }

        return CONFIG.SIZE_SMALL;
    }

    // ========================================================================
    // SPAWNING
    // ========================================================================

    spawnPictogram(link, type, size, verticalOffset) {
        // Find available pictogram
        const pictogram = this.pictograms.find(p => !p.active);
        if (!pictogram) return;

        // Get geometry for this type
        const geometry = this.geometryCache.get(type);
        if (!geometry) {
            console.warn('[LinkSemanticPictogramSystem] Geometry not found for type:', type);
            return;
        }

        // Update mesh geometry
        pictogram.mesh.geometry = geometry;

        // Update material color based on category
        const category = PictogramLibrary[type]?.category;
        const color = this.getCategoryColor(category);
        pictogram.mesh.material.color.setHex(color);

        // Spawn
        pictogram.spawn(link, type, size, verticalOffset);
    }

    getCategoryColor(category) {
        switch (category) {
            case 'harmony': return 0xaaddff;
            case 'corruption': return 0xffaaaa;
            case 'synergy': return 0xaaffaa;
            case 'instability': return 0xffddaa;
            case 'healing': return 0xaaffdd;
            case 'standing_wave': return 0xddaaff;
            default: return 0xaaaaaa;
        }
    }

    // ========================================================================
    // ENABLE / DISABLE
    // ========================================================================

    enable() {
        this.enabled = true;
        this.container.visible = true;
        console.log('[LinkSemanticPictogramSystem] ENABLED');
    }

    disable() {
        this.enabled = false;
        this.container.visible = false;
        console.log('[LinkSemanticPictogramSystem] DISABLED');
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    dispose() {
        this.pictograms.forEach(p => p.reset());
        this.linkPictogramCounts.clear();
        this.linkSpawnTimers.clear();
        this.geometryCache.forEach(g => g.dispose());
        this.geometryCache.clear();
        
        if (this.container) {
            this.scene.remove(this.container);
        }

        console.log('[LinkSemanticPictogramSystem] Disposed');
    }
}
