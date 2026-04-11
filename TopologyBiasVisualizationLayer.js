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
    // Bias vector rendering - boosted so the layer is visibly alive by default
    BIAS_VECTOR_LENGTH: 3.9,
    BIAS_VECTOR_WIDTH: 0.24,
    BIAS_VECTOR_OPACITY: 0.44,
    BIAS_VECTOR_POOL_SIZE: 320,
    BIAS_VECTOR_DENSITY: 1.0,
    
    // Vector animation - stronger motion so the topology bias can be read
    VECTOR_BREATHING_SPEED: 0.8,
    VECTOR_BREATHING_AMPLITUDE: 0.18,
    VECTOR_DRIFT_SPEED: 0.34,
    VECTOR_DRIFT_AMOUNT: 0.12,
    
    // Flow field rendering - lifted so the learned field is perceptible
    FLOW_FIELD_RESOLUTION: 3.0,
    FLOW_FIELD_OPACITY: 0.34,
    FLOW_FIELD_SPEED: 0.55,
    FLOW_FIELD_CELLS_MAX: 64,          // Max cells for display
    
    // State modulation - POLISH: Less dramatic state influence
    HARMONY_COHERENCE_BOOST: 1.45,
    CORRUPTION_BLUR: 0.68,
    SYNERGY_CLARITY: 1.22,
    INSTABILITY_BLUR: 0.76,
    
    // Interaction (contextual highlighting) - POLISH: Gentler response
    INFLUENCE_ACTIVATION_RANGE: 8.0,   // How far influence affects vectors
    INFLUENCE_SHARPNESS_BOOST: 1.6,    // POLISHED: reduced from 2.0 (60% boost - calmer)
    INFLUENCE_SHARPNESS_DECAY: 0.96,   // POLISHED: increased from 0.95 (slower decay)
    
    // Influence tracking
    INFLUENCE_MAX_AGE: 0.5,            // Max age before influence position expires
    
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
        this._visibleDirectionScratch = new THREE.Vector3();
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
    getVisibleDirection(target = new THREE.Vector3()) {
        // Subtle drift: random walk in direction space
        const drift = Math.sin(this.age * CONFIG.VECTOR_DRIFT_SPEED) * 
                      CONFIG.VECTOR_DRIFT_AMOUNT;
        
        const driftVec = this._visibleDirectionScratch.set(
            Math.cos(drift),
            0,
            Math.sin(drift)
        ).normalize();
        
        return target.copy(this.direction).add(driftVec.multiplyScalar(0.1)).normalize();
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
    constructor(scene, worldRoot, camera, topologySystem, config = {}) {
        this.scene = scene;
        this.worldRoot = worldRoot;
        this._attachRoot = worldRoot || scene;
        this.camera = camera;
        this.topologySystem = topologySystem;
        this.linkingSystem = config.linkingSystem ?? null;
        this.semanticBus = config.semanticBus ?? globalThis?.semanticBus ?? null;
        this.config = config;
        this.currentStability = 'mid';
        this.stabilityPulse = 0.0;
        this.stabilityEventSubscriptions = [];
        
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
        this.biasVectorStart = new THREE.Vector3();
        this.biasVectorEnd = new THREE.Vector3();
        this.biasVectorDirection = new THREE.Vector3();
        // FIX: Separate scratch vectors for fallback directions (was sharing one vector)
        this._fallbackDir0 = new THREE.Vector3(1, 0, 0);
        this._fallbackDir1 = new THREE.Vector3(-0.45, 0, 0.89);
        this._fallbackDir2 = new THREE.Vector3(0.58, 0, -0.82);
        this.updateBiasVectorTimer = 0;
        this.baseBiasOpacity = CONFIG.BIAS_VECTOR_OPACITY;
        
        // Flow field system
        this.flowFieldCells = new Map();      // regionId -> FlowFieldCell
        this.flowFieldMesh = null;
        this.flowFieldGeometry = null;
        this.flowFieldMaterial = null;
        this.flowFieldLookTarget = new THREE.Vector3();
        this.updateFlowFieldTimer = 0;
        this.baseFlowOpacity = CONFIG.FLOW_FIELD_OPACITY;
        
        // Interaction tracking
        this.recentInfluencePositions = [];   // Tracks active influence for highlighting
        
        this.initializeBiasVectorSystem();
        this.initializeFlowFieldSystem();
        this.initializeStabilityEventSubscriptions();
    }
    
    // ========================================================================
    // BIAS VECTOR SYSTEM
    // ========================================================================
    
    initializeBiasVectorSystem() {
        // Create material for bias vectors
        this.biasVectorMaterial = new THREE.LineBasicMaterial({
            color: 0x79ffff,
            opacity: CONFIG.BIAS_VECTOR_OPACITY,
            transparent: true,
            fog: false,
            depthWrite: false,
            blending: THREE.AdditiveBlending
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
        
        // POLISHED: Idle optimization - if no regions, fall back to recent influence activity
        if (!regions || regions.length === 0) {
            if (this.recentInfluencePositions.length > 0) {
                let vectorIdx = 0;
                const fallbackVectors = Math.min(
                    this.biasVectorInstances.length,
                    Math.max(6, this.recentInfluencePositions.length * 3)
                );

                for (let i = 0; i < this.recentInfluencePositions.length && vectorIdx < fallbackVectors; i++) {
                    const inf = this.recentInfluencePositions[i];
                    const baseStrength = Math.max(0.15, inf.strength * 0.9);

                    // FIX: Use separate scratch vectors — previously all 3 entries pointed
                    // to the same object, so only the last .set() survived
                    const directions = [
                        this._fallbackDir0,
                        this._fallbackDir1,
                        this._fallbackDir2
                    ];

                    for (let d = 0; d < directions.length && vectorIdx < fallbackVectors; d++) {
                        const instance = this.biasVectorInstances[vectorIdx];
                        instance.activate(
                            inf.position,
                            directions[d],
                            baseStrength * (1.0 - d * 0.12)
                        );
                        vectorIdx++;
                    }
                }

                for (let i = vectorIdx; i < this.biasVectorInstances.length; i++) {
                    this.biasVectorInstances[i].deactivate();
                }

                for (let instance of this.biasVectorInstances) {
                    instance.update(deltaTime);
                }

                if (this.debugBiasVectors) {
                    this.rebuildBiasVectorDebugVisualization();
                } else {
                    this.clearDebugContainer(this.biasVectorContainer, [], [this.biasVectorMaterial]);
                }
                return;
            }

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
            
            if (!region.active || region.flowStrength < 0.01) continue;
            
            // Get or activate vector instance
            if (vectorIdx >= this.biasVectorInstances.length) break;
            
            const instance = this.biasVectorInstances[vectorIdx];
            
            // Activate with region's flow bias
            instance.activate(
                region.center,
                region.flowBias.length() > 0.01 ? region.flowBias : this.biasVectorDirection.set(0, 0, 1),
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
            this.clearDebugContainer(this.biasVectorContainer, [], [this.biasVectorMaterial]);
        }
    }
    
    rebuildBiasVectorDebugVisualization() {
        this.clearDebugContainer(this.biasVectorContainer, [], [this.biasVectorMaterial]);
        
        for (let instance of this.biasVectorInstances) {
            if (!instance.active) continue;
            
            // Create debug vector
            const length = instance.getVisibleLength();
            const direction = instance.getVisibleDirection(this.biasVectorDirection);
            const opacity = instance.getEffectiveOpacity();
            
            // Tapered line geometry
            const geometry = new THREE.BufferGeometry();
            const start = this.biasVectorStart.copy(instance.position);
            const end = this.biasVectorEnd.copy(direction).multiplyScalar(length).add(start);
            
            const positions = new Float32Array([
                start.x, start.y, start.z,
                end.x, end.y, end.z
            ]);
            
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            const line = new THREE.Line(geometry, this.biasVectorMaterial);
            line.material.opacity = Math.max(0.12, opacity);
            line.frustumCulled = false;
            line.renderOrder = 30;  // Lifted so topology bias reads clearly in-scene
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
                
                // Improved hash-based noise for richer flow field texture
                float hash(vec2 p) {
                    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
                    p3 += dot(p3, p3.yzx + 33.33);
                    return fract((p3.x + p3.y) * p3.z);
                }
                
                float smoothNoise(vec2 p) {
                    vec2 i = floor(p);
                    vec2 f = fract(p);
                    f = f * f * (3.0 - 2.0 * f); // smoothstep
                    float a = hash(i);
                    float b = hash(i + vec2(1.0, 0.0));
                    float c = hash(i + vec2(0.0, 1.0));
                    float d = hash(i + vec2(1.0, 1.0));
                    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
                }
                
                void main() {
                    // Cell-based flow visualization
                    vec2 cellCoord = floor(vPosition.xz / cellSize);
                    float cellNoise = hash(cellCoord);
                    
                    // Multi-octave gradient drift for organic flow feel
                    float drift1 = sin(vPosition.x * 0.1 + time * 0.5) *
                                   cos(vPosition.z * 0.1 + time * 0.3) * 0.5 + 0.5;
                    float drift2 = sin(vPosition.x * 0.23 - time * 0.35) *
                                   cos(vPosition.z * 0.17 + time * 0.22) * 0.5 + 0.5;
                    float drift = mix(drift1, drift2, 0.35);
                    
                    // Soft directional texture with noise layer
                    float pattern = sin(vPosition.x * 0.3 + time * 0.2) *
                                    cos(vPosition.z * 0.3 - time * 0.15);
                    float noiseLayer = smoothNoise(vPosition.xz * 0.15 + time * 0.08);
                    
                    float intensity = (drift + pattern * 0.3 + noiseLayer * 0.15) * 0.5;
                    
                    // Color shifts subtly with cell noise for visual richness
                    vec3 baseColor = mix(
                        vec3(0.0, 0.45, 1.0),   // Deep blue
                        vec3(0.0, 0.65, 0.95),   // Cyan-blue
                        cellNoise * 0.4 + drift * 0.3
                    );
                    
                    gl_FragColor = vec4(baseColor, intensity * opacity);
                }
            `,
            transparent: true,
            fog: false,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        this.flowFieldContainer = new THREE.Group();
        this.flowFieldContainer.name = 'topology-flow-fields';
        this.root.add(this.flowFieldContainer);

        this.flowFieldGeometry = new THREE.PlaneGeometry(1, 1);
    }

    initializeStabilityEventSubscriptions() {
        this._unsubscribeStabilityEventSubscriptions();

        if (!this.semanticBus) {
            return;
        }

        const bindHandler = (bus, eventName, handler) => {
            if (typeof bus.subscribe === 'function') {
                const unsub = bus.subscribe(eventName, handler);
                if (typeof unsub === 'function') {
                    this.stabilityEventSubscriptions.push(unsub);
                }
            } else if (typeof bus.on === 'function') {
                bus.on(eventName, handler);
                this.stabilityEventSubscriptions.push(() => {
                    if (typeof bus.off === 'function') {
                        bus.off(eventName, handler);
                    }
                });
            }
        };

        bindHandler(this.semanticBus, 'global.stability.low', (payload) => this.handleStabilityEvent('low', payload));
        bindHandler(this.semanticBus, 'global.stability.mid', (payload) => this.handleStabilityEvent('mid', payload));
        bindHandler(this.semanticBus, 'global.stability.high', (payload) => this.handleStabilityEvent('high', payload));
    }

    _unsubscribeStabilityEventSubscriptions() {
        if (!this.stabilityEventSubscriptions?.length) return;
        for (const unsub of this.stabilityEventSubscriptions) {
            try {
                if (typeof unsub === 'function') unsub();
            } catch (_) {}
        }
        this.stabilityEventSubscriptions = [];
    }

    rebind(config = {}) {
        const newBus = config.semanticBus ?? globalThis?.semanticBus ?? this.semanticBus;
        if (newBus !== this.semanticBus) {
            this.semanticBus = newBus;
        }
        if (config.linkingSystem) {
            this.linkingSystem = config.linkingSystem;
        }
        this.initializeStabilityEventSubscriptions();
        return this;
    }

    handleStabilityEvent(level, payload) {
        this.currentStability = level;
        this.stabilityPulse = 1.0;

        switch (level) {
            case 'high':
                if (this.biasVectorMaterial) {
                    this.biasVectorMaterial.color.set(0x66ffdd);
                }
                if (this.flowFieldMaterial?.uniforms?.opacity) {
                    this.flowFieldMaterial.uniforms.opacity.value = this.baseFlowOpacity * 1.2;
                }
                break;
            case 'mid':
                if (this.biasVectorMaterial) {
                    this.biasVectorMaterial.color.set(0x33ccff);
                }
                if (this.flowFieldMaterial?.uniforms?.opacity) {
                    this.flowFieldMaterial.uniforms.opacity.value = this.baseFlowOpacity * 1.0;
                }
                break;
            case 'low':
                if (this.biasVectorMaterial) {
                    this.biasVectorMaterial.color.set(0xff6666);
                }
                if (this.flowFieldMaterial?.uniforms?.opacity) {
                    this.flowFieldMaterial.uniforms.opacity.value = this.baseFlowOpacity * 1.6;
                }
                break;
        }

        if (this.camera && this.camera.position) {
            this.recordInfluenceActivity(this.camera.position, 0.85);
        }

        if (this.config?.enableDebug) {
            console.log('[TopologyBiasVisualizationLayer] Stability event:', level, payload);
        }
    }

    _publishVisualSnapshot(networkState = {}, deltaTime = 0) {
        const bus = this.semanticBus;
        if (!bus) return;

        const recentInfluencePositions = this.recentInfluencePositions
            .slice(-8)
            .map((entry, index) => {
                const position = entry?.position?.clone?.() ?? null;
                return position ? {
                    position,
                    strength: Number(entry?.strength ?? 0),
                    age: Number(entry?.age ?? 0),
                    index,
                    kind: 'recentInfluence'
                } : null;
            })
            .filter(Boolean);

        if (recentInfluencePositions.length === 0) {
            const links = Array.isArray(this.linkingSystem?.links) ? this.linkingSystem.links : [];
            for (const link of links) {
                if (!link || link.active === false) continue;
                const source = link?.sourceNode ?? link?.source ?? link?.nodeA ?? null;
                const target = link?.targetNode ?? link?.target ?? link?.nodeB ?? null;
                const sourcePos = source?.position?.clone?.() ?? null;
                const targetPos = target?.position?.clone?.() ?? null;
                if (!sourcePos || !targetPos) continue;
                const midpoint = sourcePos.add(targetPos).multiplyScalar(0.5);
                recentInfluencePositions.push({
                    position: midpoint,
                    strength: Number(link?.userData?.synergy?.score ?? link?.userData?.cascadeIntensity ?? 0),
                    age: 0,
                    index: recentInfluencePositions.length,
                    kind: 'linkMidpoint',
                    linkId: link?.id ?? null
                });
                if (recentInfluencePositions.length >= 6) break;
            }
        }

        if (recentInfluencePositions.length === 0) {
            for (const [cellId, cell] of this.flowFieldCells.entries()) {
                const center = cell?.center?.clone?.() ?? null;
                if (!center) continue;
                recentInfluencePositions.push({
                    position: center,
                    strength: Number(cell?.flowStrength ?? 0),
                    age: 0,
                    index: recentInfluencePositions.length,
                    kind: 'flowCell',
                    id: cellId
                });
                if (recentInfluencePositions.length >= 6) break;
            }
        }

        if (recentInfluencePositions.length === 0) {
            for (const vector of this.biasVectorInstances) {
                if (!vector?.active) continue;
                const position = vector?.position?.clone?.() ?? null;
                if (!position) continue;
                recentInfluencePositions.push({
                    position,
                    strength: Number(vector?.strength ?? 0),
                    age: 0,
                    index: recentInfluencePositions.length,
                    kind: 'biasVector'
                });
                if (recentInfluencePositions.length >= 6) break;
            }
        }

        const payload = {
            scope: 'topology',
            source: 'TopologyBiasVisualizationLayer',
            currentStability: this.currentStability,
            stabilityPulse: this.stabilityPulse,
            activeBiasVectors: this.biasVectorInstances.filter(v => v.active).length,
            activeFlowCells: this.flowFieldCells.size,
            recentInfluencePositions,
            networkState,
            deltaTime
        };

        if (typeof bus.emitImmediate === 'function') {
            bus.emitImmediate('topology.bias.snapshot', payload, { priority: bus.priority?.LOW ?? bus.priority?.NORMAL });
        } else if (typeof bus.emit === 'function') {
            bus.emit('topology.bias.snapshot', payload, { priority: bus.priority?.LOW ?? bus.priority?.NORMAL });
        }
    }

    // ========================================================================
    // UPDATE & RENDERING
    // ========================================================================
    clearDebugContainer(container, sharedGeometries = [], sharedMaterials = []) {

        const sharedGeometrySet = new Set(sharedGeometries);
        const sharedMaterialSet = new Set(sharedMaterials);

        while (container.children.length > 0) {
            const child = container.children[container.children.length - 1];

            if (child?.geometry && !sharedGeometrySet.has(child.geometry)) {
                child.geometry.dispose();
            }

            if (child?.material) {
                if (Array.isArray(child.material)) {
                    for (const material of child.material) {
                        if (material && !sharedMaterialSet.has(material)) {
                            material.dispose();
                        }
                    }
                } else if (!sharedMaterialSet.has(child.material)) {
                    child.material.dispose();
                }
            }

            container.remove(child);
        }
    }
    
    updateFlowFields(deltaTime, networkState) {
        if (!this.enabled || !this.topologySystem) return;
        
        this.updateFlowFieldTimer += deltaTime;
        
        // POLISHED: Get active regions
        const regions = this.topologySystem.getActiveRegions?.();
        
        // POLISHED: Idle optimization - if no regions, show fallback cells from recent influence
        if (!regions || regions.length === 0) {
            if (this.recentInfluencePositions.length > 0) {
                const cellsToKeep = new Set();
                const fallbackCellCount = Math.min(
                    CONFIG.FLOW_FIELD_CELLS_MAX,
                    this.recentInfluencePositions.length
                );

                for (let i = 0; i < fallbackCellCount; i++) {
                    const inf = this.recentInfluencePositions[i];
                    const cellId = `influence_${i}`;

                    if (!this.flowFieldCells.has(cellId)) {
                        this.flowFieldCells.set(cellId, new FlowFieldCell(inf.position));
                    }

                    const cell = this.flowFieldCells.get(cellId);
                    const fallbackAngle = (i * 1.17) + (inf.age * 1.4);
                    const fallbackBias = new THREE.Vector3(
                        Math.cos(fallbackAngle),
                        0,
                        Math.sin(fallbackAngle)
                    ).normalize();

                    cell.update(deltaTime, {
                        active: true,
                        center: inf.position,
                        flowBias: fallbackBias,
                        flowStrength: Math.max(0.1, inf.strength)
                    }, networkState);

                    cellsToKeep.add(cellId);
                }

                for (let cellId of this.flowFieldCells.keys()) {
                    if (!cellsToKeep.has(cellId)) {
                        this.flowFieldCells.delete(cellId);
                    }
                }
            } else {
                this.flowFieldCells.clear();
            }
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
            this.clearDebugContainer(this.flowFieldContainer, [this.flowFieldGeometry], []);
        }
    }
    
    rebuildFlowFieldDebugVisualization() {
        this.clearDebugContainer(this.flowFieldContainer, [this.flowFieldGeometry], []);
        
        for (let [cellId, cell] of this.flowFieldCells) {
            if (cell.flowStrength < 0.05) continue;
            
            // Create grid cell visualization
            const size = CONFIG.FLOW_FIELD_RESOLUTION;
            
            // Color based on flow strength and clarity
            const color = new THREE.Color();
            color.setHSL(
                0.6,  // Cyan hue
                0.8 * cell.clarity,
                0.5 * cell.flowStrength
            );
            
            const material = new THREE.MeshBasicMaterial({
                color: color,
                opacity: CONFIG.FLOW_FIELD_OPACITY * (0.6 + cell.clarity * 0.6),
                transparent: true,
                fog: false
            });
            
            const mesh = new THREE.Mesh(this.flowFieldGeometry, material);
            mesh.scale.set(size, size, 1);
            mesh.frustumCulled = false;
            mesh.position.copy(cell.center);
            mesh.position.y = 0.1;  // Slight height offset
            mesh.rotationOrder = 'YXZ';
            mesh.renderOrder = 29;
            
            // Orient with flow direction
            if (cell.flowDirection.length() > 0.1) {
                this.flowFieldLookTarget.copy(mesh.position).add(cell.flowDirection);
                mesh.lookAt(this.flowFieldLookTarget);
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
    
    applyInfluenceHighlighting(deltaTime = 0.016) {
        const maxAge = CONFIG.INFLUENCE_MAX_AGE;
        
        // Age influence positions with actual deltaTime
        for (let i = this.recentInfluencePositions.length - 1; i >= 0; i--) {
            const inf = this.recentInfluencePositions[i];
            inf.age += deltaTime;  // FIX: was hardcoded 0.016
            
            if (inf.age > maxAge) {
                this.recentInfluencePositions.splice(i, 1);
                continue;
            }
            
            // Apply sharpness boost to nearby vectors
            const decayFactor = 1.0 - (inf.age / maxAge);
            
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
        if (!this.enabled) return;
        
        // POLISHED: Graceful degradation - skip if topology system unavailable
        if (!this.topologySystem) return;
        
        // POLISHED: Clamp deltaTime to prevent large jumps
        const clampedDelta = Math.min(deltaTime, 0.1);

        const canRender = this.frameScheduler?.shouldRunVisual?.() ?? true;
        if (canRender) {
            this.updateBiasVectors(clampedDelta);
            this.updateFlowFields(clampedDelta, networkState || {});
            this.applyInfluenceHighlighting(clampedDelta);
        }
        this._publishVisualSnapshot(networkState || {}, clampedDelta);

        if (canRender && this.stabilityPulse > 0) {
            this.stabilityPulse = Math.max(0, this.stabilityPulse - clampedDelta * 1.8);
            const pulseFactor = 1.0 + this.stabilityPulse * 0.6;
            if (this.biasVectorMaterial) {
                this.biasVectorMaterial.opacity = Math.min(1.0, this.baseBiasOpacity * pulseFactor);
            }
            if (this.flowFieldMaterial?.uniforms?.opacity) {
                this.flowFieldMaterial.uniforms.opacity.value = Math.min(1.0, this.baseFlowOpacity * (1.0 + this.stabilityPulse * 0.9));
            }
        } else if (canRender) {
            if (this.biasVectorMaterial) {
                this.biasVectorMaterial.opacity = this.baseBiasOpacity;
            }
            if (this.flowFieldMaterial?.uniforms?.opacity) {
                this.flowFieldMaterial.uniforms.opacity.value = this.baseFlowOpacity;
            }
        }
    }
    
    // ========================================================================
    // DEBUG INTERFACE
    // ========================================================================
    
    toggleBiasVectorDebug() {
        this.debugBiasVectors = !this.debugBiasVectors;
        if (!this.debugBiasVectors) {
            this.clearDebugContainer(this.biasVectorContainer, [], [this.biasVectorMaterial]);
        }
        console.log('[Topology Viz] Bias vectors debug:', this.debugBiasVectors);
        return this.debugBiasVectors;
    }
    
    toggleFlowFieldDebug() {
        this.debugFlowFields = !this.debugFlowFields;
        if (!this.debugFlowFields) {
            this.clearDebugContainer(this.flowFieldContainer, [this.flowFieldGeometry], []);
        }
        console.log('[Topology Viz] Flow fields debug:', this.debugFlowFields);
        return this.debugFlowFields;
    }
    
    toggleEnable() {
        this.enabled = !this.enabled;
        console.log('[Topology Viz] Layer enabled:', this.enabled);
        
        // Clear visuals when disabled
        if (!this.enabled) {
            this.clearDebugContainer(this.biasVectorContainer, [], [this.biasVectorMaterial]);
            this.clearDebugContainer(this.flowFieldContainer, [this.flowFieldGeometry], []);
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
        this._unsubscribeStabilityEventSubscriptions();
        this.clearDebugContainer(this.biasVectorContainer, [], [this.biasVectorMaterial]);
        this.clearDebugContainer(this.flowFieldContainer, [this.flowFieldGeometry], []);
        
        this.biasVectorMaterial?.dispose();
        this.flowFieldGeometry?.dispose();
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

    window.game.rebindTopologyBiasVisualization = () => {
        return viz.rebind({ semanticBus: window.semanticBus });
    };
    
    console.log('[API] Topology Bias Visualization commands registered:');
    console.log('  game.toggleTopologyBiasVectorsDebug()');
    console.log('  game.toggleTopologyFlowFieldsDebug()');
    console.log('  game.toggleTopologyBiasVisualization()');
    console.log('  game.topologyBiasVisualizationStatus()');
    console.log('  game.rebindTopologyBiasVisualization()');
}
