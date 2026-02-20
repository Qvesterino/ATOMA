/**
 * ============================================================================
 * TOPOLOGY BIAS VISUALIZATION LAYER
 * ============================================================================
 * 
 * Renders topology bias vectors and flow fields as a dedicated visual layer.
 * Reveals long-term network learning through spatial perception of preferred
 * directions and paths.
 * 
 * PHILOSOPHY:
 * Topology bias already exists conceptually in HarmonicTopologyLearningSystem.
 * This layer makes it *perceptible*—without clutter, noise, or explicit markers.
 * 
 * Players don't consciously notice topology visuals, yet subconsciously feel
 * that space has preference, paths feel natural, and motion makes sense.
 * 
 * ============================================================================
 * 
 * ARCHITECTURE:
 * 
 * 1. BIAS VECTOR RENDERER (Instanced GPU mesh)
 *    - Thin, tapered line segments
 *    - Oriented along learned topology direction
 *    - Soft transparency, no arrowheads
 *    - Density increases with learning strength
 *    - Subtle drift/breathing motion
 * 
 * 2. FLOW FIELD RENDERER (Low-resolution grid)
 *    - Regional macro tendency visualization
 *    - Faint spatial distortion or gradient drift
 *    - Slow-moving, continuous animation
 *    - Contextual highlighting when influenced
 * 
 * 3. TOPOLOGY-LINK INTERACTION
 *    - When active influence travels, nearby vectors align
 *    - Flow field locally sharpens
 *    - After passage, field relaxes back
 * 
 * ============================================================================
 */

import * as THREE from 'three';

const CONFIG = {
    // Bias vector rendering - POLISH: Subtler, calmer vectors
    BIAS_VECTOR_LENGTH: 1.8,           // POLISHED: reduced from 2.0 (shorter, less intrusive)
    BIAS_VECTOR_WIDTH: 0.08,           // Thickness of vector line
    BIAS_VECTOR_OPACITY: 0.09,         // POLISHED: reduced from 0.12 (9% - more subtle)
    BIAS_VECTOR_POOL_SIZE: 256,        // Max concurrent vectors
    BIAS_VECTOR_DENSITY: 0.6,          // POLISHED: reduced from 0.7 (fewer vectors)
    
    // Vector animation - POLISH: Slower, gentler motion
    VECTOR_BREATHING_SPEED: 0.6,       // POLISHED: reduced from 0.8 (slower breathing)
    VECTOR_BREATHING_AMPLITUDE: 0.12,  // POLISHED: reduced from 0.15 (12% - calmer)
    VECTOR_DRIFT_SPEED: 0.25,          // POLISHED: reduced from 0.3 (slower drift)
    VECTOR_DRIFT_AMOUNT: 0.08,         // POLISHED: reduced from 0.1 (less deviation)
    
    // Flow field rendering - POLISH: More subtle visualization
    FLOW_FIELD_RESOLUTION: 4.0,        // Grid spacing (coarse)
    FLOW_FIELD_OPACITY: 0.06,          // POLISHED: reduced from 0.08 (6% - more subtle)
    FLOW_FIELD_SPEED: 0.4,             // POLISHED: reduced from 0.5 (slower animation)
    FLOW_FIELD_CELLS_MAX: 64,          // Max cells for display
    
    // State modulation - POLISH: Less dramatic state influence
    HARMONY_COHERENCE_BOOST: 1.3,      // POLISHED: reduced from 1.4 (calmer boost)
    CORRUPTION_BLUR: 0.6,              // POLISHED: increased from 0.5 (less harsh blur)
    SYNERGY_CLARITY: 1.15,             // POLISHED: reduced from 1.2 (15% - more subtle)
    INSTABILITY_BLUR: 0.7,             // POLISHED: increased from 0.6 (less dramatic dampen)
    
    // Interaction (contextual highlighting) - POLISH: Gentler response
    INFLUENCE_ACTIVATION_RANGE: 8.0,   // How far influence affects vectors
    INFLUENCE_SHARPNESS_BOOST: 1.6,    // POLISHED: reduced from 2.0 (60% boost - calmer)
    INFLUENCE_SHARPNESS_DECAY: 0.96,   // POLISHED: increased from 0.95 (slower decay)
    
    // Performance
    UPDATE_INTERVAL: 0.2,              // Update vectors every 0.2s (5 Hz)
    COARSE_UPDATE_INTERVAL: 1.0,       // Flow field coarse update
    
    // Debug
    DEBUG_DRAW_BIAS_VECTORS: false,
    DEBUG_DRAW_FLOW_FIELDS: false,
    DEBUG_SHOW_REGIONS: false
};

// ============================================================================
// BIAS VECTOR INSTANCE
// ============================================================================

class BiasVectorInstance {
    constructor() {
        this.position = new THREE.Vector3();
        this.direction = new THREE.Vector3(0, 0, 1);
        this.strength = 0.0;             // 0-1: How visible
        this.age = 0.0;
        this.active = false;
        
        // Modulation
        this.clarity = 1.0;              // Affected by harmony/corruption
        this.influenceSharpness = 0.0;   // Contextual boost from influence
    }
    
    activate(position, direction, strength) {
        this.position.copy(position);
        this.direction.copy(direction).normalize();
        this.strength = Math.max(0, Math.min(1, strength));
        this.age = 0.0;
        this.active = true;
        this.clarity = 1.0;
        this.influenceSharpness = 0.0;
    }
    
    deactivate() {
        this.active = false;
        this.strength = 0.0;
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        this.age += deltaTime;
        
        // Influence sharpness decay
        this.influenceSharpness *= CONFIG.INFLUENCE_SHARPNESS_DECAY;
        
        // Deactivate if too weak
        if (this.strength < 0.01) {
            this.deactivate();
        }
    }
    
    // Calculate visible length with breathing animation
    getVisibleLength() {
        const breathe = Math.sin(this.age * CONFIG.VECTOR_BREATHING_SPEED) * 
                        CONFIG.VECTOR_BREATHING_AMPLITUDE;
        return CONFIG.BIAS_VECTOR_LENGTH * (1.0 + breathe) * this.strength;
    }
    
    // Get effective direction with drift
    getVisibleDirection() {
        // Subtle drift: random walk in direction space
        const drift = Math.sin(this.age * CONFIG.VECTOR_DRIFT_SPEED) * 
                      CONFIG.VECTOR_DRIFT_AMOUNT;
        
        const driftVec = new THREE.Vector3(
            Math.cos(drift),
            0,
            Math.sin(drift)
        ).normalize();
        
        return this.direction.clone().add(driftVec.multiplyScalar(0.1)).normalize();
    }
    
    // Get effective opacity
    getEffectiveOpacity() {
        let opacity = CONFIG.BIAS_VECTOR_OPACITY * this.strength;
        opacity *= this.clarity;
        opacity *= (1.0 + this.influenceSharpness);
        return Math.min(1, opacity);
    }
    
    // Apply contextual influence sharpening
    applyInfluenceSharpness(amount) {
        this.influenceSharpness = Math.max(this.influenceSharpness, amount);
    }
}

// ============================================================================
// FLOW FIELD CELL
// ============================================================================

class FlowFieldCell {
    constructor(center) {
        this.center = center.clone();
        this.flowDirection = new THREE.Vector3(0, 0, 1);
        this.flowStrength = 0.0;
        this.scatterIntensity = 0.0;      // Conflicting micro-biases
        this.clarity = 1.0;
        this.influenceSharpness = 0.0;
        
        this.basePhase = Math.random() * Math.PI * 2;
        this.age = 0.0;
    }
    
    update(deltaTime, topologyRegion, state) {
        this.age += deltaTime;
        
        if (!topologyRegion || !topologyRegion.active) {
            this.flowStrength *= 0.95;
            return;
        }
        
        // Update from topology region
        this.flowDirection.copy(topologyRegion.flowBias).normalize();
        this.flowStrength = topologyRegion.flowStrength;
        
        // State modulation
        const harmony = state?.harmony || 0.5;
        const corruption = state?.corruption || 0;
        const synergy = state?.synergy || 0;
        const instability = state?.instability || 0;
        
        // Harmony increases coherence
        this.clarity = CONFIG.HARMONY_COHERENCE_BOOST * Math.max(0.3, harmony);
        
        // Corruption introduces scatter
        this.scatterIntensity = corruption * CONFIG.CORRUPTION_BLUR;
        
        // Synergy improves clarity
        this.clarity *= (1.0 + synergy * (CONFIG.SYNERGY_CLARITY - 1.0));
        
        // Instability blurs
        this.clarity *= CONFIG.INSTABILITY_BLUR + (1.0 - CONFIG.INSTABILITY_BLUR) * (1.0 - instability);
        
        // Influence sharpness decay
        this.influenceSharpness *= CONFIG.INFLUENCE_SHARPNESS_DECAY;
    }
    
    applyInfluenceSharpness(amount) {
        this.influenceSharpness = Math.max(this.influenceSharpness, amount);
    }
    
    getPhaseOffset() {
        return this.basePhase + this.age * CONFIG.FLOW_FIELD_SPEED;
    }
}

// ============================================================================
// TOPOLOGY BIAS VISUALIZATION LAYER
// ============================================================================

export class TopologyBiasVisualizationLayer {
    constructor(scene, worldRoot, camera, topologySystem) {
        this.scene = scene;
        this.worldRoot = worldRoot;
        this._attachRoot = worldRoot || scene;
        this.camera = camera;
        this.topologySystem = topologySystem;
        
        this.enabled = true;
        this.debugBiasVectors = CONFIG.DEBUG_DRAW_BIAS_VECTORS;
        this.debugFlowFields = CONFIG.DEBUG_DRAW_FLOW_FIELDS;
        this.debugShowRegions = CONFIG.DEBUG_SHOW_REGIONS;

        this.root = new THREE.Group();
        this.root.name = 'TopologyBiasVisualizationRoot';
        this._attachRoot.add(this.root);
        
        // Bias vector system
        this.biasVectorInstances = [];
        this.biasVectorMesh = null;
        this.biasVectorGeometry = null;
        this.biasVectorMaterial = null;
        this.updateBiasVectorTimer = 0;
        
        // Flow field system
        this.flowFieldCells = new Map();      // regionId -> FlowFieldCell
        this.flowFieldMesh = null;
        this.flowFieldGeometry = null;
        this.flowFieldMaterial = null;
        this.updateFlowFieldTimer = 0;
        
        // Interaction tracking
        this.recentInfluencePositions = [];   // Tracks active influence for highlighting
        
        this.initializeBiasVectorSystem();
        this.initializeFlowFieldSystem();
    }
    
    // ========================================================================
    // BIAS VECTOR SYSTEM
    // ========================================================================
    
    initializeBiasVectorSystem() {
        // Create material for bias vectors
        this.biasVectorMaterial = new THREE.LineBasicMaterial({
            color: 0x00FFFF,
            opacity: CONFIG.BIAS_VECTOR_OPACITY,
            transparent: true,
            fog: false
        });
        
        // Create pool of instances
        for (let i = 0; i < CONFIG.BIAS_VECTOR_POOL_SIZE; i++) {
            this.biasVectorInstances.push(new BiasVectorInstance());
        }
        
        // Create debug visualization container
        this.biasVectorContainer = new THREE.Group();
        this.biasVectorContainer.name = 'topology-bias-vectors';
        this.root.add(this.biasVectorContainer);
    }
    
    updateBiasVectors(deltaTime) {
        if (!this.enabled || !this.topologySystem) return;
        
        this.updateBiasVectorTimer += deltaTime;
        if (this.updateBiasVectorTimer < CONFIG.UPDATE_INTERVAL) return;
        this.updateBiasVectorTimer = 0;
        
        // POLISHED: Get all active topology regions
        const regions = this.topologySystem.getActiveRegions?.();
        
        // POLISHED: Idle optimization - if no regions, skip work and deactivate all vectors
        if (!regions || regions.length === 0) {
            for (let instance of this.biasVectorInstances) {
                if (instance.active) instance.deactivate();
            }
            return;
        }
        
        // Clear old vectors
        let vectorIdx = 0;
        
        // Calculate how many vectors to display
        const totalVectors = Math.min(
            CONFIG.BIAS_VECTOR_POOL_SIZE,
            Math.floor(regions.length * CONFIG.BIAS_VECTOR_DENSITY)
        );
        
        // Distribute vectors across regions
        const step = Math.ceil(regions.length / totalVectors);
        
        for (let i = 0; i < regions.length && vectorIdx < totalVectors; i += step) {
            const region = regions[i];
            
            if (!region.active || region.flowStrength < 0.05) continue;
            
            // Get or activate vector instance
            if (vectorIdx >= this.biasVectorInstances.length) break;
            
            const instance = this.biasVectorInstances[vectorIdx];
            
            // Activate with region's flow bias
            instance.activate(
                region.center,
                region.flowBias.length() > 0.01 ? region.flowBias : new THREE.Vector3(0, 0, 1),
                region.flowStrength
            );
            
            vectorIdx++;
        }
        
        // Deactivate remaining vectors
        for (let i = vectorIdx; i < this.biasVectorInstances.length; i++) {
            this.biasVectorInstances[i].deactivate();
        }
        
        // Update all instances
        for (let instance of this.biasVectorInstances) {
            instance.update(deltaTime);
        }
        
        // Rebuild debug visualization
        if (this.debugBiasVectors) {
            this.rebuildBiasVectorDebugVisualization();
        } else {
            this.biasVectorContainer.clear();
        }
    }
    
    rebuildBiasVectorDebugVisualization() {
        this.biasVectorContainer.clear();
        
        for (let instance of this.biasVectorInstances) {
            if (!instance.active) continue;
            
            // Create debug vector
            const length = instance.getVisibleLength();
            const direction = instance.getVisibleDirection();
            const opacity = instance.getEffectiveOpacity();
            
            // Tapered line geometry
            const geometry = new THREE.BufferGeometry();
            const start = instance.position.clone();
            const end = start.clone().add(direction.clone().multiplyScalar(length));
            
            const positions = new Float32Array([
                start.x, start.y, start.z,
                end.x, end.y, end.z
            ]);
            
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            // Create line with soft appearance
            const material = new THREE.LineBasicMaterial({
                color: 0x00FFFF,
                opacity: Math.max(0.05, opacity),
                transparent: true,
                fog: false,
                linewidth: 1,
                depthWrite: false  // POLISHED: Prevent z-fighting with links
            });
            
            const line = new THREE.Line(geometry, material);
            line.renderOrder = -5;  // POLISHED: Render behind links (background layer)
            this.biasVectorContainer.add(line);
        }
    }
    
    // ========================================================================
    // FLOW FIELD SYSTEM
    // ========================================================================
    
    initializeFlowFieldSystem() {
        // Create material for flow field visualization
        this.flowFieldMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                opacity: { value: CONFIG.FLOW_FIELD_OPACITY },
                cellSize: { value: CONFIG.FLOW_FIELD_RESOLUTION }
            },
            vertexShader: `
                varying vec3 vPosition;
                varying vec2 vUv;
                
                void main() {
                    vPosition = position;
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float opacity;
                uniform float cellSize;
                
                varying vec3 vPosition;
                varying vec2 vUv;
                
                float noise(vec2 p) {
                    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
                }
                
                void main() {
                    // Cell-based flow visualization
                    vec2 cellCoord = floor(vPosition.xz / cellSize);
                    float cellNoise = noise(cellCoord);
                    
                    // Gradient drift
                    float drift = sin(vPosition.x * 0.1 + time * 0.5) * 
                                  cos(vPosition.z * 0.1 + time * 0.3) * 0.5 + 0.5;
                    
                    // Soft directional texture
                    float pattern = sin(vPosition.x * 0.3 + time * 0.2) * 
                                    cos(vPosition.z * 0.3 - time * 0.15);
                    
                    float intensity = (drift + pattern * 0.3) * 0.5;
                    
                    gl_FragColor = vec4(0.0, 0.5, 1.0, intensity * opacity);
                }
            `,
            transparent: true,
            fog: false,
            side: THREE.DoubleSide
        });
        
        this.flowFieldContainer = new THREE.Group();
        this.flowFieldContainer.name = 'topology-flow-fields';
        this.root.add(this.flowFieldContainer);
    }
    
    updateFlowFields(deltaTime, networkState) {
        if (!this.enabled || !this.topologySystem) return;
        
        this.updateFlowFieldTimer += deltaTime;
        
        // POLISHED: Get active regions
        const regions = this.topologySystem.getActiveRegions?.();
        
        // POLISHED: Idle optimization - if no regions, clean up cells
        if (!regions || regions.length === 0) {
            this.flowFieldCells.clear();
            return;
        }
        
        // Update or create cells for each region
        const visibleCellCount = Math.min(
            CONFIG.FLOW_FIELD_CELLS_MAX,
            Math.ceil(regions.length / 2)
        );
        
        let cellIdx = 0;
        const cellsToKeep = new Set();
        
        for (let i = 0; i < regions.length && cellIdx < visibleCellCount; i++) {
            const region = regions[i];
            if (!region.active) continue;
            
            const cellId = `${Math.round(region.center.x)}_${Math.round(region.center.z)}`;
            
            if (!this.flowFieldCells.has(cellId)) {
                this.flowFieldCells.set(cellId, new FlowFieldCell(region.center));
            }
            
            const cell = this.flowFieldCells.get(cellId);
            cell.update(deltaTime, region, networkState);
            
            cellsToKeep.add(cellId);
            cellIdx++;
        }
        
        // Remove old cells
        for (let cellId of this.flowFieldCells.keys()) {
            if (!cellsToKeep.has(cellId)) {
                this.flowFieldCells.delete(cellId);
            }
        }
        
        // Update shader
        if (this.flowFieldMaterial) {
            this.flowFieldMaterial.uniforms.time.value += deltaTime;
        }
        
        // Rebuild debug visualization
        if (this.debugFlowFields) {
            this.rebuildFlowFieldDebugVisualization();
        } else {
            this.flowFieldContainer.clear();
        }
    }
    
    rebuildFlowFieldDebugVisualization() {
        this.flowFieldContainer.clear();
        
        for (let [cellId, cell] of this.flowFieldCells) {
            if (cell.flowStrength < 0.05) continue;
            
            // Create grid cell visualization
            const size = CONFIG.FLOW_FIELD_RESOLUTION;
            const geometry = new THREE.PlaneGeometry(size, size);
            
            // Color based on flow strength and clarity
            const color = new THREE.Color();
            color.setHSL(
                0.6,  // Cyan hue
                0.8 * cell.clarity,
                0.5 * cell.flowStrength
            );
            
            const material = new THREE.MeshBasicMaterial({
                color: color,
                opacity: CONFIG.FLOW_FIELD_OPACITY * (0.5 + cell.clarity * 0.5),
                transparent: true,
                fog: false
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(cell.center);
            mesh.position.y = 0.1;  // Slight height offset
            mesh.rotationOrder = 'YXZ';
            
            // Orient with flow direction
            if (cell.flowDirection.length() > 0.1) {
                mesh.lookAt(
                    mesh.position.clone().add(cell.flowDirection)
                );
            }
            
            this.flowFieldContainer.add(mesh);
        }
    }
    
    // ========================================================================
    // TOPOLOGY-LINK INTERACTION
    // ========================================================================
    
    recordInfluenceActivity(position, strength) {
        // Track influence passage for contextual highlighting
        this.recentInfluencePositions.push({
            position: position.clone(),
            strength: Math.max(0, Math.min(1, strength)),
            age: 0
        });
        
        // Keep buffer bounded
        if (this.recentInfluencePositions.length > 32) {
            this.recentInfluencePositions.shift();
        }
    }
    
    applyInfluenceHighlighting() {
        // Age influence positions
        for (let i = this.recentInfluencePositions.length - 1; i >= 0; i--) {
            const inf = this.recentInfluencePositions[i];
            inf.age += 0.016;  // Assume 60 FPS
            
            if (inf.age > 0.5) {
                this.recentInfluencePositions.splice(i, 1);
                continue;
            }
            
            // Apply sharpness boost to nearby vectors
            const decayFactor = 1.0 - (inf.age / 0.5);
            
            for (let vector of this.biasVectorInstances) {
                if (!vector.active) continue;
                
                const dist = vector.position.distanceTo(inf.position);
                if (dist < CONFIG.INFLUENCE_ACTIVATION_RANGE) {
                    const falloff = Math.max(0, 1.0 - dist / CONFIG.INFLUENCE_ACTIVATION_RANGE);
                    vector.applyInfluenceSharpness(
                        inf.strength * falloff * CONFIG.INFLUENCE_SHARPNESS_BOOST * decayFactor
                    );
                }
            }
            
            // Apply to flow fields
            for (let cell of this.flowFieldCells.values()) {
                const dist = cell.center.distanceTo(inf.position);
                if (dist < CONFIG.INFLUENCE_ACTIVATION_RANGE) {
                    const falloff = Math.max(0, 1.0 - dist / CONFIG.INFLUENCE_ACTIVATION_RANGE);
                    cell.applyInfluenceSharpness(
                        inf.strength * falloff * CONFIG.INFLUENCE_SHARPNESS_BOOST * decayFactor
                    );
                }
            }
        }
    }
    
    // ========================================================================
    // UPDATE & RENDERING
    // ========================================================================
    
    update(deltaTime, networkState) {
        if (!this.frameScheduler?.shouldRunVisual?.()) return;

        if (!this.enabled) return;
        
        // POLISHED: Graceful degradation - skip if topology system unavailable
        if (!this.topologySystem) return;
        
        // POLISHED: Clamp deltaTime to prevent large jumps
        const clampedDelta = Math.min(deltaTime, 0.1);
        
        this.updateBiasVectors(clampedDelta);
        this.updateFlowFields(clampedDelta, networkState || {});
        this.applyInfluenceHighlighting();
    }
    
    // ========================================================================
    // DEBUG INTERFACE
    // ========================================================================
    
    toggleBiasVectorDebug() {
        this.debugBiasVectors = !this.debugBiasVectors;
        if (!this.debugBiasVectors) {
            this.biasVectorContainer.clear();
        }
        console.log('[Topology Viz] Bias vectors debug:', this.debugBiasVectors);
        return this.debugBiasVectors;
    }
    
    toggleFlowFieldDebug() {
        this.debugFlowFields = !this.debugFlowFields;
        if (!this.debugFlowFields) {
            this.flowFieldContainer.clear();
        }
        console.log('[Topology Viz] Flow fields debug:', this.debugFlowFields);
        return this.debugFlowFields;
    }
    
    toggleEnable() {
        this.enabled = !this.enabled;
        console.log('[Topology Viz] Layer enabled:', this.enabled);
        
        // Clear visuals when disabled
        if (!this.enabled) {
            this.biasVectorContainer.clear();
            this.flowFieldContainer.clear();
        }
        
        return this.enabled;
    }
    
    getStatus() {
        return {
            enabled: this.enabled,
            biasVectorsDebug: this.debugBiasVectors,
            flowFieldsDebug: this.debugFlowFields,
            activeBiasVectors: this.biasVectorInstances.filter(v => v.active).length,
            activeFlowCells: this.flowFieldCells.size,
            recentInfluenceCount: this.recentInfluencePositions.length
        };
    }
    
    // ========================================================================
    // CLEANUP
    // ========================================================================
    
    dispose() {
        this.biasVectorContainer.clear();
        this.flowFieldContainer.clear();
        
        this.biasVectorMaterial?.dispose();
        this.flowFieldMaterial?.dispose();
        
        this.biasVectorInstances = [];
        this.flowFieldCells.clear();
        this.recentInfluencePositions = [];

        if (this.root?.parent) {
            this.root.parent.remove(this.root);
        }
        this.root?.clear?.();
    }
}

// ============================================================================
// CONSOLE API
// ============================================================================

export function setupTopologyBiasVisualizationConsoleAPI(game) {
    if (!game.topologyViz) return;
    
    const viz = game.topologyViz;
    
    window.game.toggleTopologyBiasVectorsDebug = () => {
        return viz.toggleBiasVectorDebug();
    };
    
    window.game.toggleTopologyFlowFieldsDebug = () => {
        return viz.toggleFlowFieldDebug();
    };
    
    window.game.toggleTopologyBiasVisualization = () => {
        return viz.toggleEnable();
    };
    
    window.game.topologyBiasVisualizationStatus = () => {
        return viz.getStatus();
    };
    
    console.log('[API] Topology Bias Visualization commands registered:');
    console.log('  game.toggleTopologyBiasVectorsDebug()');
    console.log('  game.toggleTopologyFlowFieldsDebug()');
    console.log('  game.toggleTopologyBiasVisualization()');
    console.log('  game.topologyBiasVisualizationStatus()');
}
