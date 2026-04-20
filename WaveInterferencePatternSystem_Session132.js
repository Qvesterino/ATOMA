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
 * - Works with StandingWaveVisualRenderer (visual layer)
 * - Visual-only, no gameplay modifications
 * 
 * Status: PRODUCTION (Session 132)
 * 
 * ============================================================================
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

// ============================================================================
// SUPERNATURAL UPGRADE: Prismatic Holographic Interference Shaders
// ============================================================================

// Shared HSL to RGB conversion for spectral color computation
function _hslToRgb(h, s, l) {
    h = ((h % 1) + 1) % 1;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => {
        const k = (n + h * 12) % 12;
        return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    };
    return [f(0), f(8), f(4)];
}

// --- Layer 1: Iridescent Core Shader (thin-film interference simulation) ---
const IRIDESCENT_CORE_VERTEX = `
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vUv;
void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
}
`;

const IRIDESCENT_CORE_FRAGMENT = `
uniform float uTime;
uniform float uBeatPhase;
uniform float uIntensity;
uniform float uIridescenceThickness;
uniform float uSpectralShift;
uniform float uOpacity;
uniform vec3 uBaseColor;
uniform float uConstructive; // 1.0 = constructive, 0.0 = destructive

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vUv;

vec3 hsl2rgb(float h, float s, float l) {
    h = fract(h);
    float a = s * min(l, 1.0 - l);
    float f(float n) {
        float k = mod(n + h * 12.0, 12.0);
        return l - a * max(-1.0, min(min(k - 3.0, 9.0 - k), 1.0));
    }
    return vec3(f(0.0), f(8.0), f(4.0));
}

void main() {
    float cosAngle = 1.0 - abs(dot(vViewDir, vNormal));
    
    // Thin-film interference: spectral hue depends on viewing angle and "thickness"
    float filmThickness = uIridescenceThickness + sin(uBeatPhase * 0.5) * 0.15;
    float spectralHue = fract(cosAngle * filmThickness * 2.5 + uSpectralShift + uTime * 0.08);
    
    // Constructive: warm spectral bloom (gold-white center, rainbow halo)
    // Destructive: cool spectral void (deep indigo, dark rainbow edges)
    vec3 spectralColor = hsl2rgb(spectralHue, 0.85, mix(0.25, 0.65, uConstructive));
    
    // Core bloom: brighten center
    float coreBright = smoothstep(0.0, 0.6, cosAngle) * 0.4;
    vec3 coreColor = mix(spectralColor, vec3(1.0), coreBright * uConstructive);
    
    // For destructive, darken and shift toward indigo
    vec3 destructiveTint = mix(coreColor, vec3(0.05, 0.02, 0.12), (1.0 - uConstructive) * 0.6);
    
    // Pulsing intensity from beat
    float beatPulse = 0.8 + 0.2 * sin(uBeatPhase);
    float alpha = uOpacity * uIntensity * beatPulse * (0.6 + cosAngle * 0.4);
    
    gl_FragColor = vec4(destructiveTint * uIntensity * beatPulse, alpha);
}
`;

// --- Layer 2: Holographic Membrane Shader (diffraction patterns) ---
const HOLOGRAPHIC_MEMBRANE_VERTEX = `
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vUv;
varying vec3 vWorldPos;
void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * mvPos;
}
`;

const HOLOGRAPHIC_MEMBRANE_FRAGMENT = `
uniform float uTime;
uniform float uBeatPhase;
uniform float uIntensity;
uniform float uOpacity;
uniform float uConstructive;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vUv;
varying vec3 vWorldPos;

vec3 hsl2rgb(float h, float s, float l) {
    h = fract(h);
    float a = s * min(l, 1.0 - l);
    float f(float n) {
        float k = mod(n + h * 12.0, 12.0);
        return l - a * max(-1.0, min(min(k - 3.0, 9.0 - k), 1.0));
    }
    return vec3(f(0.0), f(8.0), f(4.0));
}

// Simple hash for procedural noise
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
    float cosAngle = 1.0 - abs(dot(vViewDir, vNormal));
    
    // Flowing diffraction bands across the surface
    vec2 flowUv = vUv * 3.0 + vec2(uTime * 0.12, uTime * 0.08);
    float flowNoise = noise(flowUv);
    
    // Spectral bands from viewing angle (diffraction grating effect)
    float bandIndex = cosAngle * 6.0 + flowNoise * 2.0 + uBeatPhase * 0.3;
    float spectralHue = fract(bandIndex * 0.15 + uTime * 0.05);
    
    vec3 spectralColor = hsl2rgb(spectralHue, 0.7, mix(0.15, 0.5, uConstructive));
    
    // Membrane transparency: constructive = more visible, destructive = ghost-like
    float membraneAlpha = uOpacity * uIntensity * (0.3 + cosAngle * 0.5);
    membraneAlpha *= mix(0.3, 1.0, uConstructive); // Destructive is much more subtle
    
    // Beat breathing
    float breath = 0.85 + 0.15 * sin(uBeatPhase * 0.7);
    
    gl_FragColor = vec4(spectralColor * uIntensity * breath, membraneAlpha * breath);
}
`;

// --- Layer 3: Spectral Light Ray Shader (prismatic refraction) ---
const SPECTRAL_RAY_VERTEX = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
}
`;

const SPECTRAL_RAY_FRAGMENT = `
uniform float uTime;
uniform float uBeatPhase;
uniform float uIntensity;
uniform float uOpacity;
uniform float uRayHue;        // Each ray gets a unique spectral hue
uniform float uConstructive;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;

vec3 hsl2rgb(float h, float s, float l) {
    h = fract(h);
    float a = s * min(l, 1.0 - l);
    float f(float n) {
        float k = mod(n + h * 12.0, 12.0);
        return l - a * max(-1.0, min(min(k - 3.0, 9.0 - k), 1.0));
    }
    return vec3(f(0.0), f(8.0), f(4.0));
}

void main() {
    // Ray gradient: bright at base, fading to tip
    float gradient = 1.0 - vUv.y; // y goes 0 (base) to 1 (tip)
    gradient = pow(gradient, 0.6); // Soften the falloff
    
    // Spectral color with slight shift over time
    float hue = fract(uRayHue + uTime * 0.04);
    vec3 rayColor = hsl2rgb(hue, 0.9, mix(0.3, 0.7, uConstructive));
    
    // Bright core at base, spectral at tip
    vec3 baseGlow = mix(vec3(1.0, 0.95, 0.9), rayColor, vUv.y);
    
    // Beat pulsation affects ray length visibility
    float beatPulse = 0.7 + 0.3 * sin(uBeatPhase + uRayHue * 6.28);
    
    float alpha = uOpacity * uIntensity * gradient * beatPulse;
    
    gl_FragColor = vec4(baseGlow * uIntensity * beatPulse, alpha);
}
`;

// --- Layer 4: Aurora Ring Shader (flowing aurora borealis bands) ---
const AURORA_RING_VERTEX = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
}
`;

const AURORA_RING_FRAGMENT = `
uniform float uTime;
uniform float uBeatPhase;
uniform float uIntensity;
uniform float uOpacity;
uniform float uConstructive;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;

vec3 hsl2rgb(float h, float s, float l) {
    h = fract(h);
    float a = s * min(l, 1.0 - l);
    float f(float n) {
        float k = mod(n + h * 12.0, 12.0);
        return l - a * max(-1.0, min(min(k - 3.0, 9.0 - k), 1.0));
    }
    return vec3(f(0.0), f(8.0), f(4.0));
}

void main() {
    // Aurora bands flow around the ring (using vUv.x as angular position)
    float angle = vUv.x * 6.2832; // Full circle
    
    // Multiple flowing aurora bands
    float band1 = sin(angle * 3.0 + uTime * 0.8 + uBeatPhase * 0.3) * 0.5 + 0.5;
    float band2 = sin(angle * 5.0 - uTime * 0.5 + uBeatPhase * 0.2) * 0.5 + 0.5;
    float band3 = sin(angle * 2.0 + uTime * 1.2) * 0.5 + 0.5;
    
    // Spectral hues for each band
    vec3 color1 = hsl2rgb(fract(0.33 + uTime * 0.03), 0.9, mix(0.2, 0.6, uConstructive)); // Green-cyan
    vec3 color2 = hsl2rgb(fract(0.55 + uTime * 0.02), 0.85, mix(0.15, 0.55, uConstructive)); // Blue-violet
    vec3 color3 = hsl2rgb(fract(0.12 + uTime * 0.04), 0.8, mix(0.25, 0.65, uConstructive)); // Gold-magenta
    
    vec3 auroraColor = color1 * band1 * 0.4 + color2 * band2 * 0.35 + color3 * band3 * 0.25;
    
    // Ring cross-section: bright at center, fading at edges
    float crossFade = 1.0 - abs(vUv.y - 0.5) * 2.0;
    crossFade = pow(max(0.0, crossFade), 0.8);
    
    // Constructive: bright, alive aurora / Destructive: dark, ghost aurora
    float alpha = uOpacity * uIntensity * crossFade * (0.6 + 0.4 * (band1 + band2) * 0.5);
    alpha *= mix(0.25, 1.0, uConstructive);
    
    gl_FragColor = vec4(auroraColor * uIntensity, alpha);
}
`;

export class WaveInterferencePatternSystem_Session132 {
    constructor(scene, reflectionSystem, linkingSystem, aiNodes, config = {}) {
        this.scene = scene;
        this.reflectionSystem =
            reflectionSystem ||
            globalThis?.waveReflectionSystem ||
            null;
        this.linkingSystem = linkingSystem;
        this.aiNodes = aiNodes;
        
        // UNIFIED CLEANUP CONTRACT - Track all created objects
        this._createdObjects = [];
        
        // Configuration
        this.config = {
            // Collision detection
            collisionWindowSeconds: 0.5,      // Time window for waves to be considered colliding
            pathProximityThreshold: 0.3,      // Spatial proximity to detect collisions
            phaseDifferenceThreshold: 0.2,    // Phase alignment required (0-1)
            minWaveIntensity: 0.1,            // Minimum intensity to participate
            
            // Constructive interference (amplification) — redesigned spectral palette
            constructiveColor: new THREE.Color(0.65, 0.88, 1.0),  // Cool spectral cyan-white
            constructiveOpacity: 0.14,        // Lower base opacity for ethereal feel
            constructiveGlow: 1.2,            // Emissive multiplier
            constructiveWidth: 0.08,          // Band width
            constructiveAmplification: 1.5,   // Amplitude multiplication factor
            birthSeedPulseScale: 1.18,        // Extra scale for seed birth visuals
            birthSeedSpikeBoost: 1.2,         // Extra spike length bias for seed births
            birthSeedOpacityBoost: 1.1,       // Visibility lift for seed births
            birthSeedPulseOpacity: 0.22,      // Torus pulse opacity for seed births
            
            // Destructive interference (cancellation)
            destructiveColor: new THREE.Color(0.2, 0.2, 0.3),   // Dark blue-grey
            destructiveOpacity: 0.08,         // Base opacity (subtle)
            destructiveGlow: 0.3,             // Emissive multiplier (dim)
            destructiveWidth: 0.08,           // Band width
            destructiveDamping: 0.5,          // Amplitude reduction factor
            
            // Interference mesh rendering
            interferenceResolution: 16,       // Segments for interference mesh
            maxInterferenceMeshes: 50,        // Pool size
            interferenceRenderOrder: VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_LINK_RESONANCE),
            visualUpdateHz: 30,               // Explicit render pacing for this system
            beatMotionScale: 0.72,            // Slightly slower beat animation
            spikeCount: 5,                    // Protrusions on the sphere (reduced for elegance)
            spikeLength: 0.55,                // Spike reach from center (shorter)
            spikeRadius: 0.07,                // Spike base radius (thinner)
            shellOpacity: 0.08,               // Thin structural shell (more subtle)
            
            // Beat frequency patterns
            beatFrequencyRange: [0.5, 4.0],   // Min-max Hz from frequency differences
            beatAmplification: 1.2,           // How much beat modulates amplitude
            
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
            
            // SUPERNATURAL UPGRADE: Prismatic Holographic parameters
            iridescenceThickness: 1.8,        // Thin-film thickness for spectral color cycling
            spectralFlowSpeed: 0.08,          // How fast spectral colors shift over time
            auroraBandCount: 3,               // Number of aurora bands in ring
            rayHueSpread: 0.6,               // Spectral hue spread across rays (0-1)
            constructiveSpectralSaturation: 0.85, // Color saturation for constructive
            destructiveSpectralSaturation: 0.4,   // Muted saturation for destructive
            enablePrismaticUpgrade: true,     // Master switch for supernatural upgrade
            
            ...config
        };
        
        // Runtime state
        this.interferenceZones = [];         // { linkIds, type, intensity, beatFrequency, zoneKey }
        this.collisionPairs = [];            // { convergencePoint, phaseDifference, intensity, beatFrequency, linkIds }
        this.birthCollisionPairs = new Map(); // zoneKey -> seeded pair for link birth visuals
        this.interferenceMeshes = [];        // Active interference mesh overlays
        this.beatPatterns = [];              // { zone, beatFrequency, beatPhase }
        this.zoneLifecycles = new Map();     // zoneKey -> { birthTime, lastSeenTime }
        
        // Object pools
        this.interferenceMeshPool = [];
        this._visualAccumulator = 0;
        this._visualStep = 1 / Math.max(1, this.config.visualUpdateHz);
        this._spikeDirections = this._buildSpikeDirections();
        this._cameraRef = globalThis?.__ATOMA_CAMERA__ ?? null;
        
        // Material cache
        this.constructiveMaterial = null;
        this.destructiveMaterial = null;
        this._coreGeometry = null;
        this._shellGeometry = null;
        this._spikeGeometry = null;
        
        this.time = 0;
        this.initialized = false;

        // Debug audit
        this.debug = false; // Off by default
        this._lastDebugAuditTime = 0;
    }

    /**
     * Setup - initialize materials, pools, and resources
     */
    setup() {
        if (this.initialized) return;
        
        // Create constructive interference material — spectral cyan-white with additive glow
        this.constructiveMaterial = new THREE.MeshBasicMaterial({
            color: this.config.constructiveColor,
            transparent: true,
            opacity: this.config.constructiveOpacity,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            toneMapped: false
        });
        
        // Create destructive interference material (dark, dim) - additive blending for subtle glow
        this.destructiveMaterial = new THREE.MeshBasicMaterial({
            color: this.config.destructiveColor,
            transparent: true,
            opacity: this.config.destructiveOpacity,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        // Redesigned: smaller, softer core; thinner shell; elegant proportions
        this._coreGeometry = new THREE.SphereGeometry(0.32, 10, 10);
        this._shellGeometry = new THREE.IcosahedronGeometry(0.52, 1);
        this._spikeGeometry = new THREE.ConeGeometry(0.06, this.config.spikeLength, 4, 1, false);
        this._birthPulseGeometry = new THREE.TorusGeometry(0.72, 0.035, 6, 24);
        
        // Pre-allocate interference mesh pool
        for (let i = 0; i < this.config.maxInterferenceMeshes; i++) {
            const meshItem = this._createInterferenceVisualItem();
            meshItem.mesh.visible = false;
            meshItem.mesh.renderOrder = this.config.interferenceRenderOrder;
            this.scene.add(meshItem.mesh);
            this._createdObjects.push(meshItem.mesh);  // UNIFIED CLEANUP CONTRACT
            this.interferenceMeshPool.push({
                ...meshItem,
                active: false,
                zone: null,
                type: 'constructive',
                intensity: 1,
                birthTime: 0,
                baseColor: this.config.constructiveColor.clone(),
                baseOpacity: this.config.constructiveOpacity,
                colorIntensity: 1,
                opacityFactor: 1
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
        this._visualAccumulator += Math.max(0, Number(deltaTime) || 0);
        if (this._visualAccumulator < this._visualStep) {
            this.time = currentTime;
            return;
        }
        this._visualAccumulator %= this._visualStep;
        
        this.time = currentTime;
        
        // Step 1: Detect wave collisions
        this._detectWaveCollisions(deltaTime);
        this._updateBirthCollisionPairs(deltaTime);
        for (const birthPair of this.birthCollisionPairs.values()) {
            this.collisionPairs.push(birthPair);
        }
        
        // Step 2: Calculate interference zones
        this._calculateInterferenceZones(deltaTime);
        
        // Step 3: Calculate beat patterns
        this._calculateBeatPatterns(deltaTime);
        
        // Step 4: Render interference meshes
        const cameraPos = this._resolveCameraPosition();
        this._renderInterferenceMeshes(deltaTime, cameraPos);
        
        // Step 5: Apply state modulation
        this._modulateByNetworkState(deltaTime);
        
        // Step 6: Manage lifecycle
        this._updateInterferenceLifecycle(deltaTime);
        // Debug audit (activatable, throttled)
        if (this.debug && (currentTime - this._lastDebugAuditTime > 1.0)) {
            this._lastDebugAuditTime = currentTime;
            // Output audit info (minimal, non-spam)
            console.log('[WaveInterferencePatternSystem DEBUG]', {
                time: currentTime,
                collisionPairs: this.collisionPairs.length,
                interferenceZones: this.interferenceZones.length,
                activeMeshes: this.interferenceMeshes.length,
                beatPatterns: this.beatPatterns.length
            });
        }
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
                    const phaseMatches =
                        phaseDiff <= this.config.phaseDifferenceThreshold ||
                        phaseDiff >= (0.5 - this.config.phaseDifferenceThreshold);
                    
                    if (phaseMatches) {
                        // Collision detected
                        const convergencePoint = this._findConvergencePoint(reflection1, reflection2, links);
                        
                        this.collisionPairs.push({
                            convergencePoint: convergencePoint,
                            phaseDifference: phaseDiff,
                            intensity: Math.min(reflection1.intensity, reflection2.intensity),
                            beatFrequency: Math.abs(
                                this._getWaveFrequency(reflection1) - this._getWaveFrequency(reflection2)
                            ),
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
     * Seed a visible interference birth pattern from link creation.
     * This keeps the system readable even before real reflection collisions appear.
     */
    seedLinkBirth(linkOrEvent = {}, signals = {}) {
        const link = (linkOrEvent && typeof linkOrEvent === 'object' && (linkOrEvent.id || linkOrEvent.userData))
            ? linkOrEvent
            : (signals.link ?? signals.linkRef ?? null);
        if (!link) return null;

        const linkId = this._resolveLinkId(link);
        if (!linkId) return null;

        if (link.userData?.__waveInterferenceBirthSeeded === true) {
            const existingKey = link.userData?.__waveInterferenceBirthZoneKey;
            return existingKey ? this.birthCollisionPairs.get(existingKey) ?? null : null;
        }

        const endpoints = this._getLinkEndpoints(link);
        const startPos = endpoints.startPos;
        const endPos = endpoints.endPos;
        const midpoint = (startPos && endPos)
            ? new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5)
            : this._asVector3(
                signals.anchor ??
                signals.center ??
                signals.position ??
                link?.source?.position ??
                link?.target?.position ??
                null
            );
        if (!midpoint) return null;

        const synergy = Number(
            signals.synergy ??
            signals.phaseSyncStrength ??
            link?.synergyScore ??
            link?.userData?.synergy?.score ??
            link?.userData?.synergy?.synergyNorm ??
            link?.userData?.metrics?.synergy ??
            0
        ) || 0;
        const stability = Number(
            signals.stability ??
            signals.phaseSyncStability ??
            link?.userData?.metrics?.harmony ??
            link?.userData?.harmony ??
            0
        ) || 0;
        const intensity = Math.max(0.18, Math.min(1, Math.max(
            Number(signals.intensity ?? signals.value ?? link?.userData?.cascadeIntensity ?? 0) || 0,
            synergy,
            stability
        )));
        const constructiveBias = stability >= 0.6 || synergy >= 0.5;
        const zoneType = signals.type || (constructiveBias ? 'constructive' : 'destructive');
        const zoneKey = `birth:${zoneType}:${linkId}`;
        const beatFrequency = Math.max(
            this.config.beatFrequencyRange[0],
            Math.min(
                this.config.beatFrequencyRange[1],
                Number(signals.beatFrequency ?? (0.75 + intensity * 2.15))
            )
        );
        const phaseDifference = Number.isFinite(Number(signals.phaseDifference))
            ? Math.max(0, Math.min(0.5, Number(signals.phaseDifference)))
            : (constructiveBias ? 0.12 : 0.37);

        const lifecycle = this.zoneLifecycles.get(zoneKey) || {
            birthTime: this.time,
            lastSeenTime: this.time
        };
        lifecycle.lastSeenTime = this.time;
        this.zoneLifecycles.set(zoneKey, lifecycle);

        const pair = {
            convergencePoint: midpoint.clone ? midpoint.clone() : midpoint,
            phaseDifference,
            intensity,
            beatFrequency,
            linkIds: [linkId],
            collisionTime: this.time,
            zoneKey,
            birthSeeded: true,
            linkId
        };

        this.birthCollisionPairs.set(zoneKey, pair);
        if (!link.userData) link.userData = {};
        link.userData.__waveInterferenceBirthSeeded = true;
        link.userData.__waveInterferenceBirthSeededAt = this.time;
        link.userData.__waveInterferenceBirthZoneKey = zoneKey;
        return pair;
    }

    /**
     * Keep birth-seeded interference pairs alive while the link remains active.
     */
    _updateBirthCollisionPairs(deltaTime) {
        if (this.birthCollisionPairs.size === 0) return;

        const now = this.time;
        const staleAge = Math.max(this.config.collisionWindowSeconds * 3, 12.0);

        for (const [zoneKey, pair] of this.birthCollisionPairs.entries()) {
            const link = this._resolveLinkById(pair.linkId);
            if (!link || link.active === false) {
                const age = now - (pair.collisionTime ?? now);
                if (age > staleAge) {
                    this.birthCollisionPairs.delete(zoneKey);
                    this.zoneLifecycles.delete(zoneKey);
                }
                continue;
            }

            const endpoints = this._getLinkEndpoints(link);
            const midpoint = (endpoints.startPos && endpoints.endPos)
                ? new THREE.Vector3().addVectors(endpoints.startPos, endpoints.endPos).multiplyScalar(0.5)
                : this._asVector3(
                    link?.source?.position ??
                    link?.target?.position ??
                    pair.convergencePoint
                );
            if (midpoint) {
                pair.convergencePoint = midpoint.clone ? midpoint.clone() : midpoint;
            }

            const linkSynergy = Number(
                link?.synergyScore ??
                link?.userData?.synergy?.score ??
                link?.userData?.synergy?.synergyNorm ??
                link?.userData?.metrics?.synergy ??
                pair.intensity
            ) || pair.intensity;
            const linkStability = Number(
                link?.userData?.metrics?.harmony ??
                link?.userData?.harmony ??
                pair.intensity
            ) || pair.intensity;
            pair.intensity = Math.max(0.18, Math.min(1, Math.max(linkSynergy, linkStability, pair.intensity)));
            pair.beatFrequency = Math.max(
                this.config.beatFrequencyRange[0],
                Math.min(
                    this.config.beatFrequencyRange[1],
                    pair.beatFrequency + Math.sin(now * 0.85) * 0.04
                )
            );
            pair.collisionTime = now;

            const lifecycle = this.zoneLifecycles.get(zoneKey);
            if (lifecycle) {
                lifecycle.lastSeenTime = now;
            }
        }
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
        const link1Endpoints = this._getLinkEndpoints(link1);
        const link2Endpoints = this._getLinkEndpoints(link2);
        
        const link1Start = link1Endpoints.startPos;
        const link1End = link1Endpoints.endPos;
        const link2Start = link2Endpoints.startPos;
        const link2End = link2Endpoints.endPos;
        
        if (!link1Start || !link1End || !link2Start || !link2End) return false;

        const link1StartId = this._getNodeId(link1Endpoints.startNode);
        const link1EndId = this._getNodeId(link1Endpoints.endNode);
        const link2StartId = this._getNodeId(link2Endpoints.startNode);
        const link2EndId = this._getNodeId(link2Endpoints.endNode);
        
        // Paths converge if they share an endpoint
        if (link1EndId === link2StartId || link1EndId === link2EndId ||
            link1StartId === link2StartId || link1StartId === link2EndId) {
            return true;
        }

        const threshold = this.config.pathProximityThreshold;
        const endpointPairs = [
            [link1End, link2Start],
            [link1End, link2End],
            [link1Start, link2Start],
            [link1Start, link2End]
        ];

        return endpointPairs.some(([pointA, pointB]) => {
            if (!pointA || !pointB) return false;

            const distance = typeof pointA.distanceTo === 'function'
                ? pointA.distanceTo(pointB)
                : Math.hypot(
                    (pointA.x ?? 0) - (pointB.x ?? 0),
                    (pointA.y ?? 0) - (pointB.y ?? 0),
                    (pointA.z ?? 0) - (pointB.z ?? 0)
                );

            return distance <= threshold;
        });
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
        
        const link1Endpoints = this._getLinkEndpoints(link1);
        const link2Endpoints = this._getLinkEndpoints(link2);

        const link1EndId = this._getNodeId(link1Endpoints.endNode);
        const link2StartId = this._getNodeId(link2Endpoints.startNode);
        const link2EndId = this._getNodeId(link2Endpoints.endNode);
        const link1StartId = this._getNodeId(link1Endpoints.startNode);
        
        let convergenceNode = null;
        
        if (link1EndId === link2StartId) {
            convergenceNode = link1Endpoints.endNode;
        } else if (link1EndId === link2EndId) {
            convergenceNode = link1Endpoints.endNode;
        } else if (link1StartId === link2StartId) {
            convergenceNode = link1Endpoints.startNode;
        } else if (link1StartId === link2EndId) {
            convergenceNode = link1Endpoints.startNode;
        }
        
        return convergenceNode?.position || new THREE.Vector3();
    }

    /**
     * Calculate interference zones from collision pairs
     */
    _calculateInterferenceZones(deltaTime) {
        this.interferenceZones = [];
        const activeZoneKeys = new Set();
        
        this.collisionPairs.forEach(pair => {
            // Determine interference type based on phase
            const phaseDiff = pair.phaseDifference;
            
            // Waves in phase (phaseDiff ≈ 0) = constructive
            // Waves out of phase (phaseDiff ≈ 0.5) = destructive
            const isConstructive = phaseDiff < 0.25;
            
            const zoneType = isConstructive ? 'constructive' : 'destructive';
            const zoneKey = this._getZoneKey(pair.linkIds, zoneType);
            let lifecycle = this.zoneLifecycles.get(zoneKey);

            if (!lifecycle) {
                lifecycle = {
                    birthTime: this.time,
                    lastSeenTime: this.time
                };
                this.zoneLifecycles.set(zoneKey, lifecycle);
            } else {
                lifecycle.lastSeenTime = this.time;
            }

            activeZoneKeys.add(zoneKey);

            const zone = {
                linkIds: pair.linkIds,
                convergencePoint: pair.convergencePoint,
                type: zoneType,
                intensity: pair.intensity,
                beatFrequency: Math.max(
                    this.config.beatFrequencyRange[0],
                    Math.min(
                        this.config.beatFrequencyRange[1],
                        pair.beatFrequency
                    )
                ),
                birthTime: lifecycle.birthTime,
                zoneKey,
                birthSeeded: pair.birthSeeded === true,
                birthSeedZoneKey: pair.zoneKey ?? null
            };
            
            this.interferenceZones.push(zone);
        });

        this.zoneLifecycles.forEach((lifecycle, zoneKey) => {
            if (!activeZoneKeys.has(zoneKey) &&
                (this.time - lifecycle.lastSeenTime) > this.config.collisionWindowSeconds) {
                this.zoneLifecycles.delete(zoneKey);
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
            this.beatPatterns.push({
                zone: zone,
                beatFrequency: zone.beatFrequency,
                beatPhase: this.time * zone.beatFrequency * Math.PI * 2
            });
        });
    }

    /**
     * Render interference mesh overlays
     */
    _renderInterferenceMeshes(deltaTime, cameraPos = null) {
        // Deactivate all interference meshes
        this.interferenceMeshPool.forEach(item => {
            item.active = false;
            item.mesh.visible = false;
        });
        
        if (this.interferenceZones.length === 0) return;
        
        let meshIndex = 0;
        const resolvedCameraPos = cameraPos || this._resolveCameraPosition();
        
        this.interferenceZones.forEach(zone => {
            if (meshIndex >= this.config.maxConcurrentInterferences) return;
            
            const pattern = this.beatPatterns[meshIndex];
            if (!pattern) return;
            
            // Acquire mesh from pool
            const meshItem = this.interferenceMeshPool[meshIndex];
            if (!meshItem) return;
            
            meshItem.active = true;
            meshItem.mesh.visible = true;
            meshItem.zone = zone;
            meshItem.type = zone.type;
            meshItem.birthTime = zone.birthTime;
            meshItem.birthSeeded = zone.birthSeeded === true;
            meshItem.birthSeedAge = Math.max(0, this.time - (zone.birthTime ?? this.time));
            meshItem.baseColor = (zone.type === 'constructive'
                ? this.config.constructiveColor
                : this.config.destructiveColor).clone();

            // Position mesh at convergence point
            meshItem.mesh.position.copy(zone.convergencePoint);
            meshItem.baseOpacity = zone.type === 'constructive'
                ? this.config.constructiveOpacity
                : this.config.destructiveOpacity;
            
            // Scale based on intensity and beat - use proper world-space scale
            const beatAmplitude = Math.sin(pattern.beatPhase * this.config.beatMotionScale);
            const birthSeedLift = meshItem.birthSeeded
                ? 1 + Math.max(0, 1 - Math.min(1, meshItem.birthSeedAge / Math.max(0.25, this.config.peakDuration))) * 0.24
                : 1;
            const scaleFactor = Math.max(0.52, zone.intensity * (0.92 + beatAmplitude * this.config.beatAmplification) * birthSeedLift);
            const wobble = 1 + Math.abs(beatAmplitude) * 0.12;
            meshItem.mesh.scale.set(scaleFactor * wobble, scaleFactor * (0.95 + Math.abs(beatAmplitude) * 0.18), scaleFactor * wobble);
            meshItem.mesh.rotation.y = this.time * 0.22 + beatAmplitude * 0.55;
            meshItem.mesh.rotation.x = this.time * 0.14 + beatAmplitude * 0.25;
            meshItem.mesh.rotation.z = this.time * 0.09 + beatAmplitude * 0.15;

            if (zone.type === 'constructive') {
                const colorIntensity = Math.min(1, this.config.constructiveGlow * zone.intensity);
                meshItem.colorIntensity = Math.min(1, colorIntensity * (meshItem.birthSeeded ? 1.1 : 1));
                meshItem.intensity = zone.intensity * this.config.constructiveAmplification * (meshItem.birthSeeded ? 1.12 : 1);
            } else {
                const colorIntensity = Math.min(1, this.config.destructiveGlow * zone.intensity);
                meshItem.colorIntensity = Math.min(1, colorIntensity * (meshItem.birthSeeded ? 1.06 : 1));
                meshItem.intensity = zone.intensity * this.config.destructiveDamping * (meshItem.birthSeeded ? 1.06 : 1);
            }
            
            // Set material opacity based on lifecycle
            meshItem.opacityFactor = this._setMeshLifecycleOpacity(meshItem);
            const birthPulse = meshItem.birthSeeded
                ? 1 + Math.max(0, 1 - Math.min(1, meshItem.birthSeedAge / Math.max(0.2, this.config.peakDuration))) * 0.35
                : 1;
            this._applyInterferenceMaterialState(meshItem, (1 + Math.abs(beatAmplitude) * 0.18) * birthPulse);

            const pulsePart = meshItem.parts.find((part) => part.role === 'pulse');
            if (pulsePart?.mesh) {
                pulsePart.mesh.visible = meshItem.birthSeeded === true;
                if (meshItem.birthSeeded) {
                    const pulseScale = this.config.birthSeedPulseScale
                        + Math.sin(this.time * 5.4) * 0.08
                        + Math.max(0, 1 - Math.min(1, meshItem.birthSeedAge / Math.max(0.4, this.config.peakDuration))) * 0.18;
                    pulsePart.mesh.scale.setScalar(Math.max(0.88, pulseScale));
                    pulsePart.mesh.rotation.y = this.time * 0.64;
                    pulsePart.mesh.rotation.z = this.time * 0.28;
                    if (pulsePart.material?.opacity !== undefined) {
                        pulsePart.material.opacity = Math.max(
                            0.06,
                            this.config.birthSeedPulseOpacity * (0.7 + Math.abs(beatAmplitude) * 0.75)
                        );
                    }
                } else {
                    pulsePart.mesh.scale.setScalar(0.01);
                }
            }

            if (meshItem.birthSeeded) {
                meshItem.parts.forEach(({ mesh, role }) => {
                    if (!mesh || role !== 'spike') return;
                    const basePosition = mesh.userData?.basePosition;
                    const baseScale = mesh.userData?.baseScale;
                    if (basePosition?.clone) {
                        const spikePulse = 1 + Math.sin(this.time * 4.2 + basePosition.x * 2.1) * 0.12;
                        mesh.position.copy(basePosition).multiplyScalar(this.config.birthSeedSpikeBoost * spikePulse * 0.78);
                    }
                    if (baseScale?.clone) {
                        mesh.scale.copy(baseScale);
                        mesh.scale.y *= 1.08 + Math.sin(this.time * 4.2 + mesh.position.x * 2.1) * 0.16;
                    }
                });
            }
            
            // Check LOD
            if (this.config.enableLOD && resolvedCameraPos) {
                const distance = zone.convergencePoint.distanceTo(resolvedCameraPos);
                if (distance > this.config.lodDistance) {
                    meshItem.mesh.visible = false;
                }
            }
            
            meshIndex++;
        });

        this.interferenceMeshes = this.interferenceMeshPool.filter(item => item.active);
    }

    /**
     * Set mesh opacity based on lifecycle state
     */
    _setMeshLifecycleOpacity(meshItem) {
        const lifespan = this.time - meshItem.birthTime;
        
        let opacityFactor = meshItem.birthSeeded ? 1.15 : 1.0;
        
        // Emergence phase
        if (lifespan < this.config.emergenceTime) {
            opacityFactor = (lifespan / this.config.emergenceTime) * (meshItem.birthSeeded ? 1.15 : 1);
        }

        if (meshItem.birthSeeded) {
            const seedBoost = 1 + Math.max(0, 1 - Math.min(1, lifespan / Math.max(0.25, this.config.peakDuration))) * this.config.birthSeedOpacityBoost;
            opacityFactor *= seedBoost;
        }
        
        return Math.min(1.45, opacityFactor);
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
            avgHarmony += this._readCanonicalMetric(node, 'harmony', 0.5);
            avgCorruption += this._readCanonicalMetric(node, 'corruption', 0.5);
            avgInstability += this._readCanonicalMetric(node, 'instability', 0);
            avgSynergy += this._readCanonicalMetric(node, 'synergy', 0.5);
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

            this._applyInterferenceMaterialState(meshItem, modulation);
        });
    }

    /**
     * Update interference lifecycle (cleanup old patterns)
     */
    _updateInterferenceLifecycle(deltaTime) {
        const activeZoneKeys = new Set(this.interferenceZones.map(zone => zone.zoneKey));
        this.zoneLifecycles.forEach((lifecycle, zoneKey) => {
            if (activeZoneKeys.has(zoneKey)) return;
            if ((this.time - lifecycle.lastSeenTime) > this.config.collisionWindowSeconds) {
                this.zoneLifecycles.delete(zoneKey);
            }
        });
    }

    clearLink(linkOrId, sourceNode = null, targetNode = null) {
        const linkId = this._resolveLinkId(linkOrId);
        if (!linkId) return 0;

        let removed = 0;
        for (const pair of this.birthCollisionPairs.values()) {
            if (String(pair.linkId) === String(linkId) || pair.linkIds?.some((id) => String(id) === String(linkId))) {
                pair.orphaned = true;
                pair.orphanedAt = this.time;
                removed++;
            }
        }

        this.collisionPairs = this.collisionPairs.filter((pair) => {
            if (!pair) return false;
            return !(String(pair.linkId) === String(linkId) || pair.linkIds?.some((id) => String(id) === String(linkId)));
        });
        this.interferenceZones = this.interferenceZones.filter((zone) => {
            if (!zone) return false;
            return !(Array.isArray(zone.linkIds) && zone.linkIds.some((id) => String(id) === String(linkId)));
        });
        return removed;
    }

    _getZoneKey(linkIds, zoneType) {
        const normalizedLinks = Array.isArray(linkIds)
            ? linkIds.filter(Boolean).map(String).sort().join('|')
            : '';
        return `${zoneType}:${normalizedLinks}`;
    }

    _readCanonicalMetric(node, metric, fallback = 0) {
        if (!node) return fallback;
        const metricsValue = node?.userData?.metrics?.[metric];
        if (typeof metricsValue === 'number') return metricsValue;
        const userValue = node?.userData?.[metric];
        if (typeof userValue === 'number') return userValue;
        const directValue = node?.[metric];
        if (typeof directValue === 'number') return directValue;
        return fallback;
    }

    /**
     * Rebind to new scene/world after world switch
     * @param {Object} params - New references
     */
    rebind({ scene, linkingSystem, aiNodes } = {}) {
        if (scene) this.scene = scene;
        if (linkingSystem) this.linkingSystem = linkingSystem;
        if (aiNodes) this.aiNodes = aiNodes;
        
        // Clear stale state
        this.interferenceZones = [];
        this.collisionPairs = [];
        this.birthCollisionPairs.clear();
        this.interferenceMeshes = [];
        this.beatPatterns = [];
        this.zoneLifecycles.clear();
        
        console.log('[WaveInterferencePatternSystem] Rebound to new world');
    }
    
    /**
     * Dispose - cleanup
     */
    dispose() {
        // UNIFIED CLEANUP CONTRACT - Remove and dispose all tracked objects
        this._createdObjects.forEach(obj => {
            if (this.scene) this.scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        });
        this._createdObjects = [];
        
        // Clean up interference meshes
        this.interferenceMeshPool.forEach(item => {
            if (item.mesh && item.mesh.parent) {
                item.mesh.parent.remove(item.mesh);
            }
            if (item.mesh?.traverse) {
                item.mesh.traverse((child) => {
                    if (child?.material) {
                        child.material.dispose();
                    }
                });
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
        if (this._coreGeometry) this._coreGeometry.dispose();
        if (this._shellGeometry) this._shellGeometry.dispose();
        if (this._spikeGeometry) this._spikeGeometry.dispose();
        if (this._birthPulseGeometry) this._birthPulseGeometry.dispose();
        
        this.zoneLifecycles.clear();
        this.birthCollisionPairs.clear();
    }

    _createInterferenceVisualItem() {
        const usePrismatic = this.config.enablePrismaticUpgrade !== false;
        const group = new THREE.Group();
        group.matrixAutoUpdate = true;
        group.renderOrder = this.config.interferenceRenderOrder;

        if (usePrismatic) {
            // ====================================================================
            // SUPERNATURAL UPGRADE: Prismatic Holographic Interference
            // ====================================================================

            // Layer 1: Iridescent Core — thin-film interference spectral orb
            const coreUniforms = {
                uTime: { value: 0 },
                uBeatPhase: { value: 0 },
                uIntensity: { value: 1 },
                uIridescenceThickness: { value: this.config.iridescenceThickness },
                uSpectralShift: { value: 0 },
                uOpacity: { value: this.config.constructiveOpacity * 0.9 },
                uBaseColor: { value: new THREE.Color(0.85, 0.94, 1.0) },
                uConstructive: { value: 1.0 }
            };
            const coreMaterial = new THREE.ShaderMaterial({
                vertexShader: IRIDESCENT_CORE_VERTEX,
                fragmentShader: IRIDESCENT_CORE_FRAGMENT,
                uniforms: coreUniforms,
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
                toneMapped: false
            });
            const coreMesh = new THREE.Mesh(this._coreGeometry, coreMaterial);
            coreMesh.renderOrder = this.config.interferenceRenderOrder;
            group.add(coreMesh);

            // Layer 2: Holographic Membrane — diffraction pattern sphere
            const shellUniforms = {
                uTime: { value: 0 },
                uBeatPhase: { value: 0 },
                uIntensity: { value: 1 },
                uOpacity: { value: this.config.shellOpacity },
                uConstructive: { value: 1.0 }
            };
            const shellMaterial = new THREE.ShaderMaterial({
                vertexShader: HOLOGRAPHIC_MEMBRANE_VERTEX,
                fragmentShader: HOLOGRAPHIC_MEMBRANE_FRAGMENT,
                uniforms: shellUniforms,
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
                toneMapped: false,
                wireframe: false
            });
            const shellMesh = new THREE.Mesh(this._shellGeometry, shellMaterial);
            shellMesh.renderOrder = this.config.interferenceRenderOrder + 1;
            group.add(shellMesh);

            // Layer 3: Spectral Light Rays — prismatic refraction beams
            const rayMeshes = [];
            const spikeBase = new THREE.Vector3(0, 1, 0);
            const rayCount = Math.max(1, this.config.spikeCount);
            for (let i = 0; i < rayCount; i++) {
                const direction = this._spikeDirections[i % this._spikeDirections.length];
                if (!direction) continue;
                // Each ray gets a unique spectral hue
                const rayHue = (i / rayCount) * this.config.rayHueSpread;
                const rayUniforms = {
                    uTime: { value: 0 },
                    uBeatPhase: { value: 0 },
                    uIntensity: { value: 1 },
                    uOpacity: { value: this.config.constructiveOpacity * 0.6 },
                    uRayHue: { value: rayHue },
                    uConstructive: { value: 1.0 }
                };
                const rayMaterial = new THREE.ShaderMaterial({
                    vertexShader: SPECTRAL_RAY_VERTEX,
                    fragmentShader: SPECTRAL_RAY_FRAGMENT,
                    uniforms: rayUniforms,
                    transparent: true,
                    depthWrite: false,
                    side: THREE.DoubleSide,
                    blending: THREE.AdditiveBlending,
                    toneMapped: false
                });
                const rayMesh = new THREE.Mesh(this._spikeGeometry, rayMaterial);
                rayMesh.renderOrder = this.config.interferenceRenderOrder + 2;
                rayMesh.position.copy(direction).multiplyScalar(0.42);
                rayMesh.quaternion.setFromUnitVectors(spikeBase, direction.clone().normalize());
                rayMesh.scale.set(0.8, 0.7 + (i % 3) * 0.08, 0.8);
                rayMesh.userData.basePosition = rayMesh.position.clone();
                rayMesh.userData.baseScale = rayMesh.scale.clone();
                rayMesh.userData.rayHue = rayHue;
                group.add(rayMesh);
                rayMeshes.push(rayMesh);
            }

            // Layer 4: Aurora Pulse Ring — flowing aurora borealis bands
            const auroraUniforms = {
                uTime: { value: 0 },
                uBeatPhase: { value: 0 },
                uIntensity: { value: 1 },
                uOpacity: { value: this.config.birthSeedPulseOpacity },
                uConstructive: { value: 1.0 }
            };
            const auroraMaterial = new THREE.ShaderMaterial({
                vertexShader: AURORA_RING_VERTEX,
                fragmentShader: AURORA_RING_FRAGMENT,
                uniforms: auroraUniforms,
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
                toneMapped: false
            });
            const auroraMesh = new THREE.Mesh(this._birthPulseGeometry, auroraMaterial);
            auroraMesh.renderOrder = this.config.interferenceRenderOrder + 3;
            auroraMesh.rotation.x = Math.PI * 0.5;
            auroraMesh.visible = false;
            group.add(auroraMesh);

            return {
                mesh: group,
                prismatic: true,
                parts: [
                    { mesh: coreMesh, role: 'core', material: coreMaterial, uniforms: coreUniforms },
                    { mesh: shellMesh, role: 'shell', material: shellMaterial, uniforms: shellUniforms },
                    { mesh: auroraMesh, role: 'pulse', material: auroraMaterial, uniforms: auroraUniforms },
                    ...rayMeshes.map((mesh) => ({
                        mesh,
                        role: 'spike',
                        material: mesh.material,
                        uniforms: mesh.material.uniforms
                    }))
                ]
            };

        } else {
            // ====================================================================
            // LEGACY: Original visual layers (fallback)
            // ====================================================================

            // Layer 1: Soft spectral core — small sphere with warm white center glow
            const coreMaterial = this.constructiveMaterial.clone();
            coreMaterial.opacity = this.config.constructiveOpacity * 0.9;
            coreMaterial.color = new THREE.Color(0.85, 0.94, 1.0);
            const coreMesh = new THREE.Mesh(this._coreGeometry, coreMaterial);
            coreMesh.renderOrder = this.config.interferenceRenderOrder;
            group.add(coreMesh);

            // Layer 2: Outer halo shell — thin wireframe with spectral tint
            const shellMaterial = this.constructiveMaterial.clone();
            shellMaterial.opacity = this.config.shellOpacity;
            shellMaterial.color = new THREE.Color(0.55, 0.78, 1.0);
            shellMaterial.wireframe = true;
            const shellMesh = new THREE.Mesh(this._shellGeometry, shellMaterial);
            shellMesh.renderOrder = this.config.interferenceRenderOrder + 1;
            group.add(shellMesh);

            // Layer 3: Elegant thin spikes
            const spikeMeshes = [];
            const spikeBase = new THREE.Vector3(0, 1, 0);
            const spikeCount = Math.max(1, this.config.spikeCount);
            const spikeMaterial = this.constructiveMaterial.clone();
            spikeMaterial.opacity = this.config.constructiveOpacity * 0.6;
            spikeMaterial.color = new THREE.Color(0.6, 0.82, 1.0);
            for (let i = 0; i < spikeCount; i++) {
                const direction = this._spikeDirections[i % this._spikeDirections.length];
                if (!direction) continue;
                const spikeMesh = new THREE.Mesh(this._spikeGeometry, spikeMaterial);
                spikeMesh.renderOrder = this.config.interferenceRenderOrder + 2;
                spikeMesh.position.copy(direction).multiplyScalar(0.42);
                spikeMesh.quaternion.setFromUnitVectors(spikeBase, direction.clone().normalize());
                spikeMesh.scale.set(0.8, 0.7 + (i % 3) * 0.08, 0.8);
                spikeMesh.userData.basePosition = spikeMesh.position.clone();
                spikeMesh.userData.baseScale = spikeMesh.scale.clone();
                group.add(spikeMesh);
                spikeMeshes.push(spikeMesh);
            }

            // Layer 4: Birth pulse ring
            const pulseMaterial = this.constructiveMaterial.clone();
            pulseMaterial.opacity = this.config.birthSeedPulseOpacity;
            pulseMaterial.color = new THREE.Color(0.75, 0.9, 1.0);
            const pulseMesh = new THREE.Mesh(this._birthPulseGeometry, pulseMaterial);
            pulseMesh.renderOrder = this.config.interferenceRenderOrder + 3;
            pulseMesh.rotation.x = Math.PI * 0.5;
            pulseMesh.visible = false;
            group.add(pulseMesh);

            return {
                mesh: group,
                prismatic: false,
                parts: [
                    { mesh: coreMesh, role: 'core', material: coreMesh.material },
                    { mesh: shellMesh, role: 'shell', material: shellMesh.material },
                    { mesh: pulseMesh, role: 'pulse', material: pulseMesh.material },
                    ...spikeMeshes.map((mesh) => ({ mesh, role: 'spike', material: mesh.material }))
                ]
            };
        }
    }

    _applyInterferenceMaterialState(meshItem, modulation = 1) {
        if (!meshItem?.parts?.length) return;

        const isConstructive = meshItem.zone?.type === 'constructive';
        const constructiveValue = isConstructive ? 1.0 : 0.0;
        const opacityFactor = Math.max(0.06, meshItem.opacityFactor ?? 1);
        const colorIntensity = Math.min(1, (meshItem.colorIntensity ?? 1) * modulation);

        // SUPERNATURAL UPGRADE: Update shader uniforms for prismatic materials
        if (meshItem.prismatic) {
            const beatPhase = meshItem.zone?.beatFrequency
                ? this.time * meshItem.zone.beatFrequency * Math.PI * 2
                : this.time * 2.0;

            meshItem.parts.forEach(({ material, role, uniforms }) => {
                if (!uniforms) return;

                // Common uniforms
                if (uniforms.uTime) uniforms.uTime.value = this.time;
                if (uniforms.uBeatPhase) uniforms.uBeatPhase.value = beatPhase;
                if (uniforms.uIntensity) uniforms.uIntensity.value = colorIntensity;
                if (uniforms.uConstructive) uniforms.uConstructive.value = constructiveValue;
                if (uniforms.uSpectralShift) uniforms.uSpectralShift.value = this.time * this.config.spectralFlowSpeed;

                // Role-specific opacity
                const opacityScale = role === 'core'
                    ? 0.85
                    : role === 'shell'
                        ? 0.55
                        : role === 'pulse'
                            ? 1.3
                            : 0.75;

                if (uniforms.uOpacity) {
                    uniforms.uOpacity.value = Math.max(
                        0.015,
                        (meshItem.baseOpacity ?? this.config.constructiveOpacity) * opacityFactor * opacityScale * modulation
                    );
                }
            });
            return;
        }

        // LEGACY: Original MeshBasicMaterial-based state application
        const baseColor = meshItem.baseColor ?? (
            isConstructive
                ? this.config.constructiveColor
                : this.config.destructiveColor
        );

        meshItem.parts.forEach(({ material, role }) => {
            if (!material) return;
            const t = THREE.MathUtils.smoothstep(colorIntensity, 0.1, 0.9);
            const colorScale = role === 'core'
                ? 0.85 + t * 0.15
                : role === 'shell'
                    ? 0.45 + t * 0.15
                    : role === 'pulse'
                        ? 0.95 + t * 0.2
                        : 0.7 + t * 0.18;
            const opacityScale = role === 'core'
                ? 0.85
                : role === 'shell'
                    ? 0.55
                    : role === 'pulse'
                        ? 1.3
                        : 0.75;

            if (material.color) {
                const bloomMix = role === 'core' ? THREE.MathUtils.smoothstep(colorIntensity, 0.5, 1.0) * 0.3 : 0;
                material.color.setRGB(
                    Math.min(1, baseColor.r * colorIntensity * colorScale + bloomMix),
                    Math.min(1, baseColor.g * colorIntensity * colorScale + bloomMix),
                    Math.min(1, baseColor.b * colorIntensity * colorScale + bloomMix * 0.5)
                );
            }

            if (material.opacity !== undefined) {
                material.opacity = Math.max(
                    0.015,
                    (meshItem.baseOpacity ?? this.config.constructiveOpacity) * opacityFactor * opacityScale * modulation
                );
            }
        });
    }

    _buildSpikeDirections() {
        const directions = [
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, -1, 0),
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, 0, -1),
            new THREE.Vector3(0.78, 0.62, 0),
            new THREE.Vector3(-0.78, 0.62, 0)
        ];
        return directions.map((dir) => dir.normalize());
    }

    _getLinkEndpoints(link) {
        const startNode = link?.sourceNode || link?.source || link?.from || link?.nodeA || null;
        const endNode = link?.targetNode || link?.target || link?.to || link?.nodeB || null;

        return {
            startNode,
            endNode,
            startPos: startNode?.position || null,
            endPos: endNode?.position || null
        };
    }

    _resolveLinkId(linkOrId) {
        if (!linkOrId) return null;
        if (typeof linkOrId === 'string' || typeof linkOrId === 'number') {
            return String(linkOrId);
        }
        return (
            linkOrId.userData?.id ??
            linkOrId.userData?.linkId ??
            linkOrId.id ??
            linkOrId.uuid ??
            null
        );
    }

    _resolveLinkById(linkOrId) {
        const linkId = this._resolveLinkId(linkOrId);
        if (!linkId || !this.linkingSystem?.links || !Array.isArray(this.linkingSystem.links)) {
            return null;
        }

        return this.linkingSystem.links.find((link) => {
            if (!link) return false;
            return String(this._resolveLinkId(link)) === String(linkId);
        }) ?? null;
    }

    _getNodeId(node) {
        return node?.id ?? node?.userData?.nodeId ?? node?.userData?.id ?? null;
    }

    _resolveCameraPosition() {
        const globalCamera = globalThis?.__ATOMA_CAMERA__;
        if (globalCamera?.position) {
            this._cameraRef = globalCamera;
            return globalCamera.position;
        }

        if (this._cameraRef?.position) {
            return this._cameraRef.position;
        }

        const sceneCamera = this.scene?.getObjectByName?.('camera') || this.scene?.getObjectByProperty?.('isCamera', true) || null;
        if (sceneCamera?.position) {
            this._cameraRef = sceneCamera;
            return sceneCamera.position;
        }

        if (typeof window !== 'undefined' && window.__ATOMA_CAMERA__?.position) {
            this._cameraRef = window.__ATOMA_CAMERA__;
            return window.__ATOMA_CAMERA__.position;
        }

        if (globalThis.__ATOMA_CAMERA__?.position) {
            this._cameraRef = globalThis.__ATOMA_CAMERA__;
            return globalThis.__ATOMA_CAMERA__.position;
        }

        return null;
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
