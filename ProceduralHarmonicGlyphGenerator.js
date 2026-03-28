/**
 * ============================================================================
 * PROCEDURAL HARMONIC GLYPH GENERATOR
 * ============================================================================
 * 
 * Generates procedural harmonic glyphs from topology learning history.
 * 
 * CORE PHILOSOPHY:
 * If the network learns, it should develop its own symbols.
 * 
 * Procedural glyphs represent emergent identity—visual language formed from
 * accumulated experience, not pre-authored meaning. They visualize how the
 * network has learned by generating unique glyphs derived from topology history.
 * 
 * GLYPH GENERATION TRIGGER:
 * - Topology learning strength exceeds threshold
 * - Reinforced paths remain stable over time
 * - Repeated harmonic resonance without rupture
 * - Rare, slow, deliberate (no rapid spawning)
 * 
 * INPUT DATA (Read-Only):
 * - Dominant topology bias vectors
 * - Historical flow direction variance
 * - Frequency of composite glyph fusion
 * - Scar density vs healing dominance
 * - Stability duration of hubs
 * 
 * GLYPH CONSTRUCTION:
 * - Arcs, loops, radial segments, interwoven strokes
 * - Symmetry reflects stability
 * - Asymmetry reflects adaptation
 * - Complexity reflects learning depth
 * 
 * VISUAL STYLE:
 * - Neutral grey-white palette
 * - Slight material depth
 * - Soft edges
 * - NO glow, NO particles, NO color coding
 * 
 * NOT decoration. NOT UI. Environmental semantics.
 * 
 * ============================================================================
 */

import * as THREE from 'three';
import { GlyphAnimationModulator } from './GlyphAnimationModulator.js';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // GLYPH GENERATION THRESHOLDS
    MIN_LEARNING_STRENGTH: 0.4,        // Minimum topology strength to generate
    MIN_HUB_AGE_SECONDS: 45.0,         // Hub must exist 45s before glyph spawns
    MIN_REINFORCEMENT_LEVEL: 0.5,      // Minimum link reinforcement required
    
    // GENERATION RATES
    GLYPH_GENERATION_CHECK_INTERVAL: 5.0,  // Check every 5 seconds
    GLYPH_EMERGE_DURATION: 3.0,            // Time to reach full opacity
    
    // VISUAL PROPERTIES
    GLYPH_SCALE: 1.2,                      // Base size of glyphs
    GLYPH_OPACITY: 0.45,                   // Soft presence (45%)
    GLYPH_COLOR: 0xd8d8d8,                 // Warm neutral grey
    GLYPH_MATERIAL_DEPTH: 0.08,            // Slight material depth
    
    // GEOMETRY GENERATION
    ARC_SEGMENTS: 16,                      // Smoothness of arcs
    LOOP_SEGMENTS: 24,                     // Smoothness of loops
    RADIAL_SEGMENTS: 8,                    // Radial segment count
    LINE_WIDTH: 0.06,                      // Stroke width
    
    // PROCEDURAL VARIATION
    SYMMETRY_THRESHOLD: 0.6,               // Threshold for symmetry
    COMPLEXITY_MULTIPLIER: 0.5,            // Learning depth → complexity
    ASYMMETRY_VARIATION: 0.2,              // Random asymmetry amount
    
    // PERFORMANCE
    MAX_PROCEDURAL_GLYPHS: 12,             // Hard cap on glyph count
    GLYPH_POOL_SIZE: 16,                   // Preallocated pool
    ORIGIN_SAFETY_RADIUS: 12.0,            // Avoid cluttering the map center
    
    // DEBUG
    DEBUG_DRAW_GLYPHS: false,
    DEBUG_SHOW_REGIONS: false,
    DEBUG_SHOW_GENERATION_DATA: false
};

// ============================================================================
// PROCEDURAL GLYPH INSTANCE
// ============================================================================

class ProceduralGlyphInstance {
    constructor() {
        this.mesh = null;
        this.primaryLine = null;
        this.silhouetteLine = null;
        this.detailLine = null;
        this.active = false;
        this.position = new THREE.Vector3();
        this.regionHash = null;
        
        // Generation state
        this.age = 0.0;
        this.emergeProgress = 0.0;
        this.targetOpacity = CONFIG.GLYPH_OPACITY;
        
        // Procedural parameters
        this.seed = 0;
        this.symmetry = 0.5;
        this.complexity = 0.5;
        this.asymmetryFactor = 0.0;
        this.glyphType = 'arc';  // arc, loop, radial, woven
        
        // Visual properties
        this.flowDirection = new THREE.Vector3(0, 0, 1);
        this.learningStrength = 0.5;
        this.hubStability = 0.5;
        this.baseScale = CONFIG.GLYPH_SCALE;
    }
    
    reset() {
        this.active = false;
        if (this.mesh) {
            this.mesh.visible = false;
            this.mesh.rotation.set(0, 0, 0);
            this.mesh.scale.setScalar(1);
        }
        this.age = 0.0;
        this.emergeProgress = 0.0;
    }

    setVisualLayers(root, primaryLine, silhouetteLine, detailLine) {
        this.mesh = root;
        this.primaryLine = primaryLine || null;
        this.silhouetteLine = silhouetteLine || null;
        this.detailLine = detailLine || null;
    }

    setGeometrySet(primaryGeometry, silhouetteGeometry, detailGeometry) {
        this._replaceGeometry(this.primaryLine, primaryGeometry);
        this._replaceGeometry(this.silhouetteLine, silhouetteGeometry);
        this._replaceGeometry(this.detailLine, detailGeometry);
    }

    _replaceGeometry(line, geometry) {
        if (!line || !geometry) return;
        if (line.geometry && line.geometry !== geometry) {
            line.geometry.dispose();
        }
        line.geometry = geometry;
        line.frustumCulled = false;
    }
    
    initialize(position, regionHash, procedureParams) {
        this.active = true;
        this.position.copy(position);
        this.regionHash = regionHash;
        
        // Copy procedural parameters
        this.seed = procedureParams.seed;
        this.symmetry = procedureParams.symmetry;
        this.complexity = procedureParams.complexity;
        this.asymmetryFactor = procedureParams.asymmetryFactor;
        this.glyphType = procedureParams.glyphType;
        this.flowDirection.copy(procedureParams.flowDirection);
        this.learningStrength = procedureParams.learningStrength;
        this.hubStability = procedureParams.hubStability;
        this.baseScale = procedureParams.baseScale ?? CONFIG.GLYPH_SCALE;
        
        this.age = 0.0;
        this.emergeProgress = 0.0;
        
        if (this.mesh) {
            this.mesh.visible = true;
            this.mesh.position.copy(position);
            this.mesh.scale.setScalar(this.baseScale);
        }
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        this.age += deltaTime;
        
        // Smooth emergence over time
        this.emergeProgress = Math.min(1.0, this.age / CONFIG.GLYPH_EMERGE_DURATION);
        
        // Smooth easing (cubic ease-in-out)
        const easedProgress = this.emergeProgress < 0.5
            ? 4 * this.emergeProgress * this.emergeProgress * this.emergeProgress
            : 1 - Math.pow(-2 * this.emergeProgress + 2, 3) / 2;
        
        // Update opacity
        const opacity = this.targetOpacity * easedProgress;
        this._applyLayerOpacity(this.primaryLine, opacity);
        this._applyLayerOpacity(this.silhouetteLine, opacity * 0.34);
        this._applyLayerOpacity(this.detailLine, opacity * 0.82);

        if (this.mesh) {
            const pulse = 1.0 + Math.sin(this.age * 0.72 + this.seed * Math.PI * 2) * 0.018 * (0.35 + this.complexity * 0.65);
            this.mesh.scale.setScalar(this.baseScale * pulse);
            this.mesh.rotation.y = Math.sin(this.age * 0.28 + this.seed * 4.0) * 0.05;
        }
    }

    _applyLayerOpacity(line, opacity) {
        if (!line?.material) return;
        line.material.opacity = opacity;
        line.material.transparent = true;
        line.material.depthWrite = false;
    }
    
    getAge() {
        return this.age;
    }
}

// ============================================================================
// PROCEDURAL GEOMETRY GENERATOR
// ============================================================================

class ProceduralGeometryGenerator {
    constructor() {
        this.geometryCache = new Map();  // hash -> geometry
    }

    generateLayerGeometries(procedureParams) {
        const primary = this.generateGeometry(procedureParams);
        if (!primary) return null;

        return {
            primary,
            silhouette: this.createSilhouetteGeometry(primary, procedureParams),
            detail: this.createDetailGeometry(primary, procedureParams)
        };
    }
    
    generateGeometry(procedureParams) {
        // Create hash from parameters
        const hash = this.hashParameters(procedureParams);
        
        // Check cache
        if (this.geometryCache.has(hash)) {
            return this.geometryCache.get(hash).clone();
        }
        
        // Generate new geometry
        let geometry;
        
        switch (procedureParams.glyphType) {
            case 'arc':
                geometry = this.generateArcGlyph(procedureParams);
                break;
            case 'loop':
                geometry = this.generateLoopGlyph(procedureParams);
                break;
            case 'radial':
                geometry = this.generateRadialGlyph(procedureParams);
                break;
            case 'woven':
                geometry = this.generateWovenGlyph(procedureParams);
                break;
            default:
                geometry = this.generateArcGlyph(procedureParams);
        }
        
        // Cache geometry
        this.geometryCache.set(hash, geometry.clone());
        
        return geometry;
    }

    createSilhouetteGeometry(baseGeometry, params) {
        if (!baseGeometry) return null;

        const geometry = baseGeometry.clone();
        const signature = params.seed * 13.37 + params.complexity * 7.1 + params.asymmetryFactor * 5.3;
        const scale = 1.08 + params.complexity * 0.04;

        geometry.scale(scale, scale, scale);
        geometry.rotateY((signature % 0.5) * 0.15 - 0.0375);
        geometry.translate(0, 0.01 + params.hubStability * 0.012, 0);
        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();

        return geometry;
    }

    createDetailGeometry(baseGeometry, params) {
        if (!baseGeometry) return null;

        const geometry = baseGeometry.clone();
        const position = geometry.attributes.position;
        if (!position) return geometry;

        const array = position.array;
        const seedPhase = params.seed * 31.4159;
        const complexityPhase = params.complexity * 17.0;

        for (let i = 0; i < position.count; i++) {
            const index = i * 3;
            const x = array[index];
            const y = array[index + 1];
            const z = array[index + 2];
            const radial = Math.max(0.0001, Math.sqrt(x * x + z * z));
            const detailWave = Math.sin(i * 0.65 + seedPhase) * 0.012 + Math.cos(i * 0.41 + complexityPhase) * 0.009;
            const asymmetryWave = params.asymmetryFactor * Math.sin(i * 0.33 + seedPhase * 0.5) * 0.01;
            const lift = (Math.sin(i * 0.27 + seedPhase) * 0.003) + (params.hubStability * 0.003);
            const scale = 0.96 + detailWave + asymmetryWave;
            array[index] = x * scale + (x / radial) * detailWave * 0.22;
            array[index + 1] = y + lift;
            array[index + 2] = z * scale + (z / radial) * detailWave * 0.22;
        }

        position.needsUpdate = true;
        geometry.rotateY(0.035 + params.asymmetryFactor * 0.12);
        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();

        return geometry;
    }
    
    generateArcGlyph(params) {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        
        // Base arc
        const radius = 0.5;
        const startAngle = params.seed * Math.PI;
        const arcSpan = Math.PI * (0.6 + params.complexity * 0.4);
        
        for (let i = 0; i <= CONFIG.ARC_SEGMENTS; i++) {
            const angle = startAngle + (i / CONFIG.ARC_SEGMENTS) * arcSpan;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            positions.push(x, 0, z);
        }
        
        // Add secondary arc (asymmetry)
        if (params.asymmetryFactor > 0.1) {
            const offset = params.asymmetryFactor * 0.3;
            for (let i = 0; i <= CONFIG.ARC_SEGMENTS; i++) {
                const angle = startAngle + (i / CONFIG.ARC_SEGMENTS) * arcSpan;
                const x = Math.cos(angle) * (radius - offset);
                const z = Math.sin(angle) * (radius - offset);
                positions.push(x, 0, z);
            }
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geometry.scale(CONFIG.GLYPH_SCALE, CONFIG.GLYPH_SCALE, CONFIG.GLYPH_SCALE);
        
        return geometry;
    }
    
    generateLoopGlyph(params) {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        
        // Primary loop (circle or ellipse)
        const radiusX = 0.4 * (1.0 + params.asymmetryFactor * 0.3);
        const radiusZ = 0.4 * (1.0 - params.asymmetryFactor * 0.2);
        
        for (let i = 0; i <= CONFIG.LOOP_SEGMENTS; i++) {
            const angle = (i / CONFIG.LOOP_SEGMENTS) * Math.PI * 2;
            const x = Math.cos(angle) * radiusX;
            const z = Math.sin(angle) * radiusZ;
            positions.push(x, 0, z);
        }
        
        // Add secondary loop if high complexity
        if (params.complexity > 0.6) {
            const offset = params.complexity * 0.15;
            for (let i = 0; i <= CONFIG.LOOP_SEGMENTS; i++) {
                const angle = (i / CONFIG.LOOP_SEGMENTS) * Math.PI * 2;
                const x = Math.cos(angle) * (radiusX - offset);
                const z = Math.sin(angle) * (radiusZ - offset);
                positions.push(x, 0, z);
            }
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geometry.scale(CONFIG.GLYPH_SCALE, CONFIG.GLYPH_SCALE, CONFIG.GLYPH_SCALE);
        
        return geometry;
    }
    
    generateRadialGlyph(params) {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        
        // Radial spokes
        const spokesCount = Math.floor(CONFIG.RADIAL_SEGMENTS + params.complexity * 4);
        const spokeLength = 0.5;
        
        for (let spoke = 0; spoke < spokesCount; spoke++) {
            const angle = (spoke / spokesCount) * Math.PI * 2;
            const length = spokeLength * (0.7 + Math.abs(Math.sin(spoke + params.seed)) * 0.3);
            
            // Spoke start (center)
            positions.push(0, 0, 0);
            
            // Spoke end (radial)
            const x = Math.cos(angle) * length;
            const z = Math.sin(angle) * length;
            positions.push(x, 0, z);
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geometry.scale(CONFIG.GLYPH_SCALE, CONFIG.GLYPH_SCALE, CONFIG.GLYPH_SCALE);
        
        return geometry;
    }
    
    generateWovenGlyph(params) {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        
        // Interwoven strokes
        const strands = 3 + Math.floor(params.complexity * 2);
        const strandLength = 0.6;
        
        for (let strand = 0; strand < strands; strand++) {
            const strandAngle = (strand / strands) * Math.PI * 2;
            const waveFreq = 2 + params.complexity * 2;
            
            for (let i = 0; i <= 20; i++) {
                const t = i / 20;
                const x = Math.cos(strandAngle) * strandLength * t;
                const z = Math.sin(strandAngle) * strandLength * t;
                const wave = Math.sin(t * waveFreq * Math.PI) * 0.1 * params.asymmetryFactor;
                
                positions.push(x + wave, 0, z);
            }
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geometry.scale(CONFIG.GLYPH_SCALE, CONFIG.GLYPH_SCALE, CONFIG.GLYPH_SCALE);
        
        return geometry;
    }
    
    hashParameters(params) {
        return `${params.glyphType}_${Math.round(params.seed * 100)}_${Math.round(params.complexity * 100)}_${Math.round(params.asymmetryFactor * 100)}`;
    }
    
    clearCache() {
        for (let geometry of this.geometryCache.values()) {
            geometry.dispose();
        }
        this.geometryCache.clear();
    }
}

// ============================================================================
// MAIN PROCEDURAL HARMONIC GLYPH GENERATOR
// ============================================================================

export class ProceduralHarmonicGlyphGenerator {
    constructor(scene, worldRoot, topologySystem) {
        this.scene = scene;
        this.worldRoot = worldRoot;
        this.topologySystem = topologySystem;
        this.frameScheduler = null;
        this._attachRoot = worldRoot || scene;
        this.glyphAnimationModulator = null;
        
        // Glyph instances
        this.glyphInstances = [];
        this.glyphsByRegion = new Map();  // regionHash -> glyph instance
        
        this.initializeGlyphPool();
        
        // Geometry generation
        this.geometryGenerator = new ProceduralGeometryGenerator();
        
        // Update tracking
        this.generationCheckTimer = 0.0;
        this.lastGeneratedHash = null;
        
        // Debug
        this.debugVisualization = null;
        this.enabled = true;
        
        console.log('[ProceduralHarmonicGlyphGenerator] Initialized');
    }

    setGlyphAnimationModulator(modulator) {
        if (modulator && !(modulator instanceof GlyphAnimationModulator)) {
            console.warn('[ProceduralHarmonicGlyphGenerator] Ignoring invalid GlyphAnimationModulator binding');
            return null;
        }

        this.glyphAnimationModulator = modulator || null;

        if (this.glyphAnimationModulator) {
            for (const glyph of this.glyphInstances) {
                if (glyph.active) {
                    this.glyphAnimationModulator.registerGlyph(glyph, glyph.regionHash);
                }
            }
        }

        return this.glyphAnimationModulator;
    }
    
    // ========================================================================
    // GLYPH POOL INITIALIZATION
    // ========================================================================
    
    initializeGlyphPool() {
        const container = new THREE.Group();
        container.name = 'ProceduralGlyphPool';
        container.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_GLYPH_HARMONIC);
        this._attachRoot.add(container);
        this.container = container;
        this.root = container;
        
        for (let i = 0; i < CONFIG.GLYPH_POOL_SIZE; i++) {
            const root = new THREE.Group();
            root.visible = false;
            root.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_GLYPH_HARMONIC);

            const baseGeometry = new THREE.BufferGeometry();
            const positions = new Float32Array([0, 0, 0, 0, 0, 0]);
            baseGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const primaryMaterial = new THREE.LineBasicMaterial({
                color: CONFIG.GLYPH_COLOR,
                transparent: true,
                opacity: CONFIG.GLYPH_OPACITY,
                fog: false,
                depthWrite: false
            });

            const silhouetteMaterial = new THREE.LineBasicMaterial({
                color: 0xf5f5f5,
                transparent: true,
                opacity: CONFIG.GLYPH_OPACITY * 0.28,
                fog: false,
                depthWrite: false
            });

            const detailMaterial = new THREE.LineBasicMaterial({
                color: 0xd0d0d0,
                transparent: true,
                opacity: CONFIG.GLYPH_OPACITY * 0.6,
                fog: false,
                depthWrite: false
            });

            const primaryLine = new THREE.Line(baseGeometry.clone(), primaryMaterial);
            const silhouetteLine = new THREE.Line(baseGeometry.clone(), silhouetteMaterial);
            const detailLine = new THREE.Line(baseGeometry.clone(), detailMaterial);
            primaryLine.renderOrder = root.renderOrder + 1;
            silhouetteLine.renderOrder = root.renderOrder;
            detailLine.renderOrder = root.renderOrder + 2;
            primaryLine.frustumCulled = false;
            silhouetteLine.frustumCulled = false;
            detailLine.frustumCulled = false;

            root.add(silhouetteLine);
            root.add(detailLine);
            root.add(primaryLine);
            container.add(root);
            
            const instance = new ProceduralGlyphInstance();
            instance.setVisualLayers(root, primaryLine, silhouetteLine, detailLine);
            this.glyphInstances.push(instance);
        }
    }
    
    // ========================================================================
    // GLYPH GENERATION LOGIC
    // ========================================================================
    
    update(deltaTime) {
        if (this.frameScheduler?.shouldRunVisual?.() === false) return;

        if (!this.enabled || !this.topologySystem) return;
        
        // Update all active glyphs
        for (let glyph of this.glyphInstances) {
            if (glyph.active) {
                glyph.update(deltaTime);
            }
        }
        
        // Check for new glyph generation
        this.generationCheckTimer += deltaTime;
        if (this.generationCheckTimer >= CONFIG.GLYPH_GENERATION_CHECK_INTERVAL) {
            this.generationCheckTimer = 0.0;
            this.checkAndGenerateGlyphs();
        }
    }
    
    checkAndGenerateGlyphs() {
        if (!this.topologySystem.getActiveRegions) return;
        
        const regions = this.topologySystem.getActiveRegions();
        if (!regions || regions.length === 0) return;
        
        // Scan regions for glyph generation candidates
        for (let region of regions) {
            if (!region.active) continue;
            
            const hash = this.regionToHash(region);
            
            // Skip if already has glyph
            if (this.glyphsByRegion.has(hash)) continue;
            
            // Check if region qualifies for glyph generation
            if (this.qualifiesForGlyph(region)) {
                this.generateGlyphForRegion(region, hash);
            }
        }
        
        // Clean up glyphs for dead regions
        this.cleanupDeadGlyphs(regions);
    }
    
    qualifiesForGlyph(region) {
        // POLISHED: Conservative thresholds for rare glyph emergence
        if (!region) return false;

        // Keep the world origin clean; this generator is meant to emerge on
        // learned hubs, not create a persistent centerpiece blob.
        if (region.center && region.center.length() < CONFIG.ORIGIN_SAFETY_RADIUS) {
            return false;
        }
        
        // Must have sufficient learning
        if ((region.flowStrength ?? 0) < CONFIG.MIN_LEARNING_STRENGTH) return false;
        
        // Must be a matured hub
        if (!region.isMaturedHub || (region.hubAge ?? 0) < CONFIG.MIN_HUB_AGE_SECONDS) {
            return false;
        }
        
        // Must have reinforced links
        if (!region.reinforcedLinks || region.reinforcedLinks.size === 0) return false;
        
        // Check average reinforcement
        let avgReinforcement = 0;
        for (let value of region.reinforcedLinks.values()) {
            avgReinforcement += value;
        }
        avgReinforcement /= region.reinforcedLinks.size;
        
        if (avgReinforcement < CONFIG.MIN_REINFORCEMENT_LEVEL) return false;
        
        // Harmony preference (glyphs emerge in harmony, suppressed by corruption)
        if (Array.isArray(region.harmonyHistory) && Array.isArray(region.corruptionHistory) && region.harmonyHistory.length > 5 && region.corruptionHistory.length > 5) {
            const avgHarmony = region.harmonyHistory.reduce((a, b) => a + b) / region.harmonyHistory.length;
            const avgCorruption = region.corruptionHistory.reduce((a, b) => a + b) / region.corruptionHistory.length;
            
            if (avgCorruption > 0.6) return false;  // Too corrupt
            if (avgHarmony < 0.4) return false;     // Not enough harmony
        }
        
        return true;
    }
    
    generateGlyphForRegion(region, hash) {
        // Check pool availability
        if (this.glyphsByRegion.size >= CONFIG.MAX_PROCEDURAL_GLYPHS) return;
        
        // Find available glyph instance
        let glyphInstance = null;
        for (let glyph of this.glyphInstances) {
            if (!glyph.active) {
                glyphInstance = glyph;
                break;
            }
        }
        
        if (!glyphInstance) return;
        
        // Generate procedural parameters
        const procedureParams = this.deriveProcedureParameters(region);
        
        // Generate geometry
        const layerGeometries = this.geometryGenerator.generateLayerGeometries(procedureParams);
        if (!layerGeometries?.primary) return;

        // Update glyph visuals
        glyphInstance.setGeometrySet(
            layerGeometries.primary,
            layerGeometries.silhouette,
            layerGeometries.detail
        );
        
        // Initialize glyph
        glyphInstance.initialize(region.center, hash, procedureParams);

        this.glyphAnimationModulator?.registerGlyph?.(glyphInstance, hash);
        
        // Register
        this.glyphsByRegion.set(hash, glyphInstance);
        
        console.log(`[Procedural Glyph] Generated ${procedureParams.glyphType} glyph at region`, region.center);
    }
    
    deriveProcedureParameters(region) {
        // Generate parameters from topology data
        const flowBias = region.flowBias?.clone?.() ?? new THREE.Vector3(0, 0, 0);
        
        // Seed from position (consistent per region)
        const seed = Math.abs(
            Math.sin(region.center.x * 0.1) * Math.cos(region.center.z * 0.1)
        );
        
        // Symmetry from hub stability
        const symmetry = Math.max(
            CONFIG.SYMMETRY_THRESHOLD,
            region.isMaturedHub ? 0.8 : 0.5
        );
        
        // Complexity from learning depth
        let learningDepth = 0;
        if (region.reinforcedLinks.size > 0) {
            learningDepth = region.reinforcedLinks.size / 10;  // Normalize
        }
        const complexity = Math.min(1.0, learningDepth * CONFIG.COMPLEXITY_MULTIPLIER);
        
        // Asymmetry from scar/healing balance
        const scarFactor = region.scarIntensity > 0 ? region.scarIntensity : 0;
        const asymmetryFactor = Math.min(CONFIG.ASYMMETRY_VARIATION, scarFactor * 0.5);
        
        // Glyph type based on flow properties
        const glyphType = this.selectGlyphType(region, seed);
        
        // Flow direction from topology bias
        const flowDirection = flowBias.lengthSq() > 0.0001
            ? flowBias.normalize()
            : new THREE.Vector3(0, 0, 1);
        
        // Learning strength (normalized)
        const learningStrength = Math.min(1.0, region.flowStrength + 0.3);
        
        // Hub stability
        const hubStability = region.isMaturedHub
            ? Math.min(1.0, region.hubAge / 120.0)  // Max at 2 minutes
            : 0.0;
        
        return {
            seed,
            symmetry,
            complexity,
            asymmetryFactor,
            glyphType,
            flowDirection,
            learningStrength,
            hubStability
        };
    }
    
    selectGlyphType(region, seed) {
        // Choose glyph type based on topology characteristics
        const score = (seed + region.flowStrength * 0.5 + region.scarIntensity * 0.3) % 1.0;
        
        if (score < 0.25) return 'arc';
        if (score < 0.5) return 'loop';
        if (score < 0.75) return 'radial';
        return 'woven';
    }
    
    cleanupDeadGlyphs(activeRegions) {
        const activeHashes = new Set();
        for (let region of activeRegions) {
            activeHashes.add(this.regionToHash(region));
        }
        
        // Remove glyphs for inactive regions
        for (let [hash, glyph] of this.glyphsByRegion.entries()) {
            if (!activeHashes.has(hash)) {
                this.glyphAnimationModulator?.unregisterGlyph?.(glyph);
                glyph.reset();
                this.glyphsByRegion.delete(hash);
            }
        }
    }
    
    regionToHash(region) {
        const gridX = Math.round(region.center.x / 10);
        const gridY = Math.round(region.center.y / 10);
        const gridZ = Math.round(region.center.z / 10);
        return `${gridX},${gridY},${gridZ}`;
    }
    
    // ========================================================================
    // ENABLE / DISABLE
    // ========================================================================
    
    enable() {
        this.enabled = true;
        console.log('[ProceduralHarmonicGlyphGenerator] ENABLED');
    }
    
    disable() {
        this.enabled = false;
        this.resetAll();
        console.log('[ProceduralHarmonicGlyphGenerator] DISABLED');
    }
    
    resetAll() {
        for (let glyph of this.glyphInstances) {
            this.glyphAnimationModulator?.unregisterGlyph?.(glyph);
            glyph.reset();
        }
        this.glyphsByRegion.clear();
    }
    
    // ========================================================================
    // DEBUG & STATUS
    // ========================================================================
    
    toggleDebug() {
        CONFIG.DEBUG_DRAW_GLYPHS = !CONFIG.DEBUG_DRAW_GLYPHS;
        console.log('[Procedural Glyph] Debug mode:', CONFIG.DEBUG_DRAW_GLYPHS);
        return CONFIG.DEBUG_DRAW_GLYPHS;
    }
    
    getStatus() {
        const activeGlyphs = this.glyphInstances.filter(g => g.active).length;
        const averageAge = activeGlyphs > 0
            ? this.glyphInstances
                .filter(g => g.active)
                .reduce((sum, g) => sum + g.getAge(), 0) / activeGlyphs
            : 0;
        
        return {
            enabled: this.enabled,
            activeGlyphs,
            poolCapacity: CONFIG.GLYPH_POOL_SIZE,
            maxAllowed: CONFIG.MAX_PROCEDURAL_GLYPHS,
            averageAge: averageAge.toFixed(1),
            regionAssociations: this.glyphsByRegion.size
        };
    }
    
    dispose() {
        this.resetAll();
        this.geometryGenerator.clearCache();
        this.glyphAnimationModulator = null;
        
        for (let glyph of this.glyphInstances) {
            glyph.mesh?.traverse?.((child) => {
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach((material) => material?.dispose?.());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }

        if (this.root?.parent) {
            this.root.parent.remove(this.root);
        }
        this.root?.clear?.();
    }

    cleanup() {
        this.dispose();
    }
}

// ============================================================================
// CONSOLE API
// ============================================================================

export function setupProceduralGlyphConsoleAPI(game) {
    if (!game.proceduralGlyphGenerator) return;
    
    const gen = game.proceduralGlyphGenerator;
    
    window.game.toggleProceduralGlyphDebug = () => {
        return gen.toggleDebug();
    };
    
    window.game.proceduralGlyphStatus = () => {
        return gen.getStatus();
    };
    
    console.log('[ProceduralHarmonicGlyphGenerator] Console API registered');
    console.log('  game.toggleProceduralGlyphDebug()');
    console.log('  game.proceduralGlyphStatus()');
}
