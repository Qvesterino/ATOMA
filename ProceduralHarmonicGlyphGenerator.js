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
    }
    
    reset() {
        this.active = false;
        if (this.mesh) {
            this.mesh.visible = false;
        }
        this.age = 0.0;
        this.emergeProgress = 0.0;
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
        
        this.age = 0.0;
        this.emergeProgress = 0.0;
        
        if (this.mesh) {
            this.mesh.visible = true;
            this.mesh.position.copy(position);
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
        if (this.mesh && this.mesh.material) {
            this.mesh.material.opacity = this.targetOpacity * easedProgress;
        }
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
    constructor(scene, topologySystem) {
        this.scene = scene;
        this.topologySystem = topologySystem;
        
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
    
    // ========================================================================
    // GLYPH POOL INITIALIZATION
    // ========================================================================
    
    initializeGlyphPool() {
        const container = new THREE.Group();
        container.name = 'ProceduralGlyphPool';
        this.scene.add(container);
        this.container = container;
        
        for (let i = 0; i < CONFIG.GLYPH_POOL_SIZE; i++) {
            // Create line-based glyph geometry
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array([0, 0, 0, 0, 0, 0]);
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            const material = new THREE.LineBasicMaterial({
                color: CONFIG.GLYPH_COLOR,
                transparent: true,
                opacity: CONFIG.GLYPH_OPACITY,
                fog: false,
                depthWrite: false
            });
            
            const line = new THREE.Line(geometry, material);
            line.visible = false;
            line.renderOrder = 3;  // Mid-layer (behind echoes, above topology)
            
            container.add(line);
            
            const instance = new ProceduralGlyphInstance();
            instance.mesh = line;
            this.glyphInstances.push(instance);
        }
    }
    
    // ========================================================================
    // GLYPH GENERATION LOGIC
    // ========================================================================
    
    update(deltaTime) {
        if (!this.frameScheduler?.shouldRunSimulation?.()) return;

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
        
        // Must have sufficient learning
        if (region.flowStrength < CONFIG.MIN_LEARNING_STRENGTH) return false;
        
        // Must be a matured hub
        if (!region.isMaturedHub || region.hubAge < CONFIG.MIN_HUB_AGE_SECONDS) {
            return false;
        }
        
        // Must have reinforced links
        if (region.reinforcedLinks.size === 0) return false;
        
        // Check average reinforcement
        let avgReinforcement = 0;
        for (let value of region.reinforcedLinks.values()) {
            avgReinforcement += value;
        }
        avgReinforcement /= region.reinforcedLinks.size;
        
        if (avgReinforcement < CONFIG.MIN_REINFORCEMENT_LEVEL) return false;
        
        // Harmony preference (glyphs emerge in harmony, suppressed by corruption)
        if (region.harmonyHistory && region.harmonyHistory.length > 5) {
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
        const geometry = this.geometryGenerator.generateGeometry(procedureParams);
        
        // Update glyph mesh
        glyphInstance.mesh.geometry.dispose();
        glyphInstance.mesh.geometry = geometry;
        
        // Initialize glyph
        glyphInstance.initialize(region.center, hash, procedureParams);
        
        // Register
        this.glyphsByRegion.set(hash, glyphInstance);
        
        console.log(`[Procedural Glyph] Generated ${procedureParams.glyphType} glyph at region`, region.center);
    }
    
    deriveProcedureParameters(region) {
        // Generate parameters from topology data
        
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
        const flowDirection = region.flowBias.length() > 0.01
            ? region.flowBias.normalize().clone()
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
        
        for (let glyph of this.glyphInstances) {
            if (glyph.mesh) {
                glyph.mesh.geometry.dispose();
                glyph.mesh.material.dispose();
            }
        }
        
        this.container?.clear();
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
