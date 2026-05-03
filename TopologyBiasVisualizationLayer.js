
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
    // Bias vector rendering — spectral energy threads
    BIAS_VECTOR_LENGTH: 4.2,
    BIAS_VECTOR_WIDTH: 0.24,
    BIAS_VECTOR_OPACITY: 0.38,
    BIAS_VECTOR_POOL_SIZE: 320,
    BIAS_VECTOR_DENSITY: 1.0,
    
    // Vector animation — organic breathing with dimensional drift
    VECTOR_BREATHING_SPEED: 0.65,
    VECTOR_BREATHING_AMPLITUDE: 0.22,
    VECTOR_DRIFT_SPEED: 0.28,
    VECTOR_DRIFT_AMOUNT: 0.15,
    
    // Flow field rendering — interdimensional rift plane
    FLOW_FIELD_RESOLUTION: 3.0,
    FLOW_FIELD_OPACITY: 0.28,
    FLOW_FIELD_SPEED: 0.45,
    FLOW_FIELD_CELLS_MAX: 64,
    
    // State modulation — dramatic cosmic shifts
    HARMONY_COHERENCE_BOOST: 1.55,
    CORRUPTION_BLUR: 0.72,
    SYNERGY_CLARITY: 1.3,
    INSTABILITY_BLUR: 0.78,
    
    // Interaction — dimensional resonance response
    INFLUENCE_ACTIVATION_RANGE: 9.0,
    INFLUENCE_SHARPNESS_BOOST: 1.8,
    INFLUENCE_SHARPNESS_DECAY: 0.965,
    
    // Influence tracking
    INFLUENCE_MAX_AGE: 0.6,
    
    // Performance
    UPDATE_INTERVAL: 0.2,
    COARSE_UPDATE_INTERVAL: 1.0,
    
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
        this.pressureBias = 0.0;

        // Smooth transitions
        this.targetPosition = new THREE.Vector3();
        this.targetDirection = new THREE.Vector3(0, 0, 1);
        this.targetStrength = 0.0;
        this.transitionSpeed = 2.0;      // How fast to interpolate (units per second)
        this.fadeSpeed = 1.5;            // How fast to fade in/out
    }
    
    activate(position, direction, strength) {
        // Set target values for smooth transitions
        this.targetPosition.copy(position);
        this.targetDirection.copy(direction).normalize();
        this.targetStrength = Math.max(0, Math.min(1, strength));

        // If not currently active, initialize current values for fade-in
        if (!this.active) {
            this.position.copy(position);
            this.direction.copy(direction).normalize();
            this.strength = 0.0; // Start faded out
            this.age = 0.0;
        }

        this.active = true;
        this.clarity = 1.0;
        this.influenceSharpness = 0.0;
        this.pressureBias = 0.0;
    }
    
    deactivate() {
        this.active = false;
        this.strength = 0.0;
    }
    
    update(deltaTime) {
        if (!this.active) return;

        this.age += deltaTime;

        // Smooth interpolation towards target values
        const interpFactor = Math.min(1.0, this.transitionSpeed * deltaTime);

        // Interpolate position
        this.position.lerp(this.targetPosition, interpFactor);

        // Interpolate direction (linear interpolation for smooth rotation)
        this.direction.lerp(this.targetDirection, interpFactor);

        // Interpolate strength with fade speed
        const strengthDiff = this.targetStrength - this.strength;
        this.strength += strengthDiff * Math.min(1.0, this.fadeSpeed * deltaTime);

        // Influence sharpness decay
        this.influenceSharpness *= CONFIG.INFLUENCE_SHARPNESS_DECAY;

        // Deactivate if target strength is very low and current strength is fading out
        if (this.targetStrength < 0.01 && this.strength < 0.005) {
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
        this.pressureBias = 0.0;
        
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
        const loadPressure = state?.loadPressure || 0;
        const stressPressure = state?.stressPressure || 0;
        const stressLoadBias = state?.stressLoadBias || 0;
        const pressureBias = Math.max(loadPressure, stressPressure * 0.8, stressLoadBias);
        
        // Harmony increases coherence
        this.clarity = CONFIG.HARMONY_COHERENCE_BOOST * Math.max(0.3, harmony);
        
        // Corruption introduces scatter
        this.scatterIntensity = corruption * CONFIG.CORRUPTION_BLUR + pressureBias * 0.24;
        
        // Synergy improves clarity
        this.clarity *= (1.0 + synergy * (CONFIG.SYNERGY_CLARITY - 1.0));
        
        // Instability blurs
        this.clarity *= CONFIG.INSTABILITY_BLUR + (1.0 - CONFIG.INSTABILITY_BLUR) * (1.0 - instability);
        this.clarity *= 1.0 - pressureBias * 0.12;
        this.pressureBias = pressureBias;
        
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
        // Spectral energy thread material — prismatic cyan-white with dimensional glow
        this.biasVectorMaterial = new THREE.LineBasicMaterial({
            color: 0x88ddff,
            opacity: CONFIG.BIAS_VECTOR_OPACITY,
            transparent: true,
            fog: false,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            toneMapped: false
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
    
    updateBiasVectors(deltaTime, networkState = {}) {
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
                    instance.pressureBias = Math.max(networkState?.loadPressure || 0, networkState?.stressPressure || 0, networkState?.stressLoadBias || 0);
                    instance.clarity = Math.max(0.3, 1.0 - instance.pressureBias * 0.16 + (networkState?.synergy || 0) * 0.12);
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
        
        // Weighted distribution based on flow strength and activity
        const activeRegions = regions.filter(r => r.active && r.flowStrength >= 0.01);

        // Calculate weights for each region
        let totalWeight = 0;
        const regionWeights = activeRegions.map(region => {
            // Weight by flow strength, with bonus for very strong flows
            const baseWeight = region.flowStrength;
            const strengthBonus = region.flowStrength > 0.7 ? (region.flowStrength - 0.7) * 2.0 : 0;
            const weight = baseWeight + strengthBonus;
            totalWeight += weight;
            return { region, weight };
        });

        // Determine how many vectors to allocate
        const maxVectors = CONFIG.BIAS_VECTOR_POOL_SIZE;
        let vectorIdx = 0;

        // Distribute vectors proportionally by weight
        for (const { region, weight } of regionWeights) {
            const vectorsForRegion = Math.max(1, Math.round((weight / totalWeight) * maxVectors));

            for (let v = 0; v < vectorsForRegion && vectorIdx < maxVectors; v++) {
                if (vectorIdx >= this.biasVectorInstances.length) break;

                const instance = this.biasVectorInstances[vectorIdx];

                // Add some variation to position within region
                const variationRadius = 2.0; // Spread vectors around region center
                const angle = (v / vectorsForRegion) * Math.PI * 2;
                const distance = (v === 0) ? 0 : (variationRadius * Math.random() * 0.5); // Center vector at exact position
                const offset = new THREE.Vector3(
                    Math.cos(angle) * distance,
                    0,
                    Math.sin(angle) * distance
                );

                const vectorPosition = region.center.clone().add(offset);
                const vectorStrength = region.flowStrength * (0.8 + Math.random() * 0.4); // Some randomization

                // Activate with smooth transitions
                instance.activate(
                    vectorPosition,
                    region.flowBias.length() > 0.01 ? region.flowBias : this.biasVectorDirection.set(0, 0, 1),
                    vectorStrength
                );

                const pressureBias = Math.max(networkState?.loadPressure || 0, networkState?.stressPressure || 0, networkState?.stressLoadBias || 0);
                instance.pressureBias = pressureBias;
                instance.clarity = Math.max(0.28, (1.0 - pressureBias * 0.14) * (0.88 + (networkState?.harmony || 0.5) * 0.3));

                vectorIdx++;
            }
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
            const opacity = instance.getEffectiveOpacity() * (1.0 + instance.pressureBias * 0.14);
            
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
            const pressureHue = 0.56 + instance.pressureBias * 0.08;
            line.material.color.setHSL(
                pressureHue,
                0.68 * instance.clarity + 0.1,
                0.42 + instance.pressureBias * 0.12
            );
            line.frustumCulled = false;
            line.renderOrder = 30;  // Lifted so topology bias reads clearly in-scene
            this.biasVectorContainer.add(line);
        }
    }
    
    // ========================================================================
    // FLOW FIELD SYSTEM
    // ========================================================================
    
    initializeFlowFieldSystem() {
        // Interdimensional rift shader — dimensional cracks, spectral nebula, vortex flow
        this.flowFieldMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                opacity: { value: CONFIG.FLOW_FIELD_OPACITY },
                cellSize: { value: CONFIG.FLOW_FIELD_RESOLUTION },
                flowDirection: { value: new THREE.Vector3(0, 0, 1) },
                flowStrength: { value: 0.5 },
                regionCenter: { value: new THREE.Vector3(0, 0, 0) },
                regionRadius: { value: 15.0 }
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
                uniform vec3 flowDirection;
                uniform float flowStrength;
                uniform vec3 regionCenter;
                uniform float regionRadius;

                varying vec3 vPosition;
                varying vec2 vUv;
                
                // Hash-based noise
                float hash(vec2 p) {
                    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
                    p3 += dot(p3, p3.yzx + 33.33);
                    return fract((p3.x + p3.y) * p3.z);
                }
                
                float smoothNoise(vec2 p) {
                    vec2 i = floor(p);
                    vec2 f = fract(p);
                    f = f * f * (3.0 - 2.0 * f);
                    float a = hash(i);
                    float b = hash(i + vec2(1.0, 0.0));
                    float c = hash(i + vec2(0.0, 1.0));
                    float d = hash(i + vec2(1.0, 1.0));
                    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
                }
                
                // Fractional Brownian Motion for nebula depth
                float fbm(vec2 p) {
                    float value = 0.0;
                    float amplitude = 0.5;
                    float frequency = 1.0;
                    for (int i = 0; i < 4; i++) {
                        value += amplitude * smoothNoise(p * frequency);
                        frequency *= 2.1;
                        amplitude *= 0.48;
                    }
                    return value;
                }
                
                // Dimensional rift lines — thin glowing cracks in spacetime
                float riftLines(vec2 p, float t) {
                    float rift = 0.0;
                    // Primary rift axis
                    float d1 = abs(sin(p.x * 0.18 + t * 0.12) * cos(p.y * 0.14 - t * 0.08));
                    rift += pow(d1, 12.0) * 2.5;
                    // Secondary diagonal rift
                    float d2 = abs(sin((p.x + p.y) * 0.12 + t * 0.06) * cos((p.x - p.y) * 0.1 - t * 0.04));
                    rift += pow(d2, 16.0) * 1.8;
                    // Tertiary micro-fractures
                    float d3 = abs(sin(p.x * 0.45 + t * 0.15) * sin(p.y * 0.38 - t * 0.1));
                    rift += pow(d3, 20.0) * 1.2;
                    return rift;
                }
                
                void main() {
                    vec2 pos = vPosition.xz;
                    vec2 worldPos = pos;
                    vec2 localPos = pos - regionCenter.xz;
                    float distanceFromCenter = length(localPos);
                    float regionFalloff = 1.0 - smoothstep(0.0, regionRadius, distanceFromCenter);

                    float t = time;

                    // Flow direction influence
                    vec2 flowDir2D = normalize(flowDirection.xz);
                    float flowAlignment = dot(normalize(localPos), flowDir2D);
                    flowAlignment = (flowAlignment + 1.0) * 0.5; // 0-1 range

                    // === LAYER 1: Nebula depth ===
                    vec2 nebulaPos = pos * 0.08 + t * 0.03 + flowDir2D * flowStrength * 0.5;
                    float nebula1 = fbm(nebulaPos);
                    vec2 nebulaPos2 = pos * 0.12 - t * 0.025 + 5.0 + flowDir2D * flowStrength * 0.3;
                    float nebula2 = fbm(nebulaPos2);
                    float nebulaDepth = nebula1 * 0.6 + nebula2 * 0.4;
                    
                    // === LAYER 2: Dimensional rift lines ===
                    vec2 riftPos = pos + flowDir2D * flowStrength * 2.0 * flowAlignment;
                    float rifts = riftLines(riftPos, t);

                    // === LAYER 3: Vortex flow ===
                    vec2 centered = localPos * 0.05;
                    float angle = atan(centered.y, centered.x);
                    float radius = length(centered);
                    // Align vortex with flow direction
                    float flowAngle = atan(flowDir2D.y, flowDir2D.x);
                    float angleDiff = abs(angle - flowAngle);
                    angleDiff = min(angleDiff, 2.0 * 3.14159 - angleDiff); // Handle angle wraparound
                    float vortex = sin(angle * 3.0 + radius * 4.0 - t * 0.3) * 0.5 + 0.5;
                    vortex *= (1.0 - angleDiff / 3.14159) * flowStrength; // Stronger when aligned with flow
                    vortex *= smoothstep(regionRadius * 0.05, 0.0, radius); // Fade at center and edge
                    vortex *= regionFalloff;
                    
                    // === LAYER 4: Spectral drift ===
                    float drift1 = sin(pos.x * 0.08 + t * 0.12) * cos(pos.y * 0.06 + t * 0.08) * 0.5 + 0.5;
                    float drift2 = sin(pos.x * 0.15 - t * 0.09) * cos(pos.y * 0.12 + t * 0.06) * 0.5 + 0.5;
                    float drift = mix(drift1, drift2, 0.4);
                    
                    // === LAYER 5: Flow-aligned streams ===
                    float streamNoise = fbm(pos * 0.15 + flowDir2D * 3.0 + t * 0.1);
                    float streams = smoothstep(0.4, 0.6, streamNoise) * flowAlignment * flowStrength;

                    // === COMPOSITE ===
                    float baseIntensity = nebulaDepth * 0.25 + rifts * 0.5 + vortex * 0.15 + drift * 0.1 + streams * 0.2;
                    float intensity = baseIntensity * regionFalloff * flowStrength;
                    intensity = clamp(intensity, 0.0, 1.0);
                    
                    // === SPECTRAL COLOR PALETTE ===
                    // Rifts glow hot white-cyan, nebula is deep cosmic blue-violet
                    vec3 riftColor = vec3(0.75, 0.92, 1.0);    // Hot white-cyan
                    vec3 nebulaColor = vec3(0.12, 0.18, 0.55);  // Deep cosmic blue
                    vec3 vortexColor = vec3(0.35, 0.08, 0.45);  // Surreal violet
                    vec3 driftColor = vec3(0.05, 0.35, 0.65);   // Oceanic blue
                    
                    vec3 baseColor = mix(nebulaColor, driftColor, drift);
                    baseColor = mix(baseColor, vortexColor, vortex * 0.5);
                    baseColor += riftColor * rifts * 1.5; // Rifts add bright spectral glow
                    
                    // Subtle prismatic shimmer on rifts
                    float shimmer = sin(pos.x * 2.5 + pos.y * 1.8 + t * 1.5) * 0.5 + 0.5;
                    baseColor += vec3(0.15, 0.05, 0.2) * shimmer * rifts;
                    
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
        this.flowFieldMesh = null; // Will be created dynamically
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
        
        // Update shader-based flow field rendering
        this.updateFlowFieldRendering(regions);

        // Rebuild debug visualization
        if (this.debugFlowFields) {
            this.rebuildFlowFieldDebugVisualization();
        } else {
            // Clear debug meshes but keep the shader-based flow field mesh
            const geometriesToDispose = [];
            const materialsToDispose = [];

            this.flowFieldContainer.children.forEach(child => {
                if (child !== this.flowFieldMesh) {
                    if (child.geometry) geometriesToDispose.push(child.geometry);
                    if (child.material) materialsToDispose.push(child.material);
                    this.flowFieldContainer.remove(child);
                }
            });

            geometriesToDispose.forEach(geo => geo.dispose());
            materialsToDispose.forEach(mat => mat.dispose());
        }
    }

    updateFlowFieldRendering(regions) {
        if (!this.enabled || !regions || regions.length === 0) {
            // Remove existing mesh if no active regions
            if (this.flowFieldMesh) {
                this.flowFieldContainer.remove(this.flowFieldMesh);
                this.flowFieldMesh.geometry.dispose();
                this.flowFieldMesh = null;
            }
            return;
        }

        // Find the region with strongest flow for primary visualization
        let primaryRegion = regions[0];
        for (const region of regions) {
            if (region.flowStrength > primaryRegion.flowStrength) {
                primaryRegion = region;
            }
        }

        // Update shader uniforms with region data
        if (this.flowFieldMaterial) {
            this.flowFieldMaterial.uniforms.flowDirection.value.copy(primaryRegion.flowBias);
            this.flowFieldMaterial.uniforms.flowStrength.value = primaryRegion.flowStrength;
            this.flowFieldMaterial.uniforms.regionCenter.value.copy(primaryRegion.center);
            this.flowFieldMaterial.uniforms.regionRadius.value = 15.0; // Could be made configurable
        }

        // Create or update the mesh
        if (!this.flowFieldMesh) {
            this.flowFieldMesh = new THREE.Mesh(this.flowFieldGeometry, this.flowFieldMaterial);
            this.flowFieldMesh.name = 'topology-flow-field-mesh';
            this.flowFieldMesh.rotation.x = -Math.PI / 2; // Lay flat on ground
            this.flowFieldMesh.position.y = 0.1; // Slightly above ground to avoid z-fighting
            this.flowFieldMesh.renderOrder = 5; // Below nodes but above terrain
            this.flowFieldMesh.frustumCulled = false;
            this.flowFieldContainer.add(this.flowFieldMesh);
        }

        // Scale mesh to cover the active region
        const scale = primaryRegion.radius || 20.0;
        this.flowFieldMesh.scale.setScalar(scale);
        this.flowFieldMesh.position.copy(primaryRegion.center);
        this.flowFieldMesh.position.y = 0.1;
    }

    rebuildFlowFieldDebugVisualization() {
        this.clearDebugContainer(this.flowFieldContainer, [this.flowFieldGeometry], []);
        
        for (let [cellId, cell] of this.flowFieldCells) {
            if (cell.flowStrength < 0.05) continue;
            
            // Create grid cell visualization
            const size = CONFIG.FLOW_FIELD_RESOLUTION;
            
            // Spectral color — shifts from cosmic blue to surreal violet based on flow
            const color = new THREE.Color();
            const hue = 0.58 + cell.scatterIntensity * 0.12 + cell.pressureBias * 0.06; // Cyan → violet/pressure rose shift
            color.setHSL(
                hue,
                0.75 * cell.clarity + 0.15 + cell.pressureBias * 0.08,
                0.4 * cell.flowStrength + 0.1 + cell.pressureBias * 0.06
            );
            
            const material = new THREE.MeshBasicMaterial({
                color: color,
                opacity: CONFIG.FLOW_FIELD_OPACITY * (0.6 + cell.clarity * 0.6 + cell.pressureBias * 0.18),
                transparent: true,
                fog: false,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                toneMapped: false
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
            this.updateBiasVectors(clampedDelta, networkState || {});
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

        // Dispose flow field mesh if it exists
        if (this.flowFieldMesh) {
            this.flowFieldContainer.remove(this.flowFieldMesh);
            this.flowFieldMesh.geometry.dispose();
            this.flowFieldMesh = null;
        }

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
