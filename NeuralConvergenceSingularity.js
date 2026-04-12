/**
 * NeuralConvergenceSingularity.js
 * ============================================================================
 * NEURAL CONVERGENCE SINGULARITY - AAA Visual System
 * 
 * Transformuje nudný placeholder plane na živý, dýchajúci portál AI vedomia.
 * 
 * VIZUÁLNE VRSTVY:
 * 1. Singularity Core - gravitačný lensing efekt s fractal pattern
 * 2. Orbital Thought Streams - časticové prúdy okolo jadra
 * 3. Energy Tendrils - dynamické spojenia s nodmi
 * 4. Dimensional Rift - iridescent shimmer pozadie
 * 5. Consciousness Pulse - šíriace sa vlny myšlienok
 * 
 * FILOZOFIA:
 * - Nie je to stroj, je to živý organizmus
 * - Technické ale nie strojové
 * - Nadpozemské, trocha mistické
 * - Niečo nevidané čo človek doteraz nemal šancu vidieť
 * 
 * @author ATOMA VFX Team - Session 147
 * @version 1.0.0
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

// ============================================================================
const SINGULARITY_LIFECYCLE_LOG_THROTTLE_MS = 1000;


// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG = {
    // Core
    coreRadius: 0.15,
    coreDetail: 4,
    corePulseSpeed: 0.8,
    coreRotationSpeed: 0.3,
    
    // Colors
    coreColorHarmony: 0x00ffff,      // Cyan
    coreColorCorruption: 0xff0066,   // Magenta/Red
    coreColorNeutral: 0x8866ff,      // Purple
    
    // Orbital streams
    orbitalStreams: 6,
    orbitalParticlesPerStream: 24,
    orbitalSpeed: 1.2,
    orbitalRadiusMin: 0.25,
    orbitalRadiusMax: 0.5,
    
    // Energy tendrils
    tendrilCount: 4,
    tendrilLength: 1.0,
    tendrilRadius: 0.018,
    tendrilWaveSpeed: 2.0,
    tendrilSegments: 12,
    
    // Dimensional rift
    riftInnerRadius: 0.15,
    riftOuterRadius: 0.7,
    riftOpacity: 0.35,
    riftRotationSpeed: 0.08,
    riftSegments: 48,
    
    // Pulse waves
    pulseInterval: 2.5,
    pulseSpeed: 0.6,
    pulseMaxRadius: 1.8,
    pulseInitialRadius: 0.1,
    pulseRingWidth: 0.04,
    pulseMaxCount: 5,
    pulseEchoCount: 2,
    pulseEchoSpacing: 0.22,

    // Core shell / depth
    coreShellScale: 1.92,
    coreShellOpacity: 0.18,
    coreShellPulse: 0.12,
    coreCageScale: 2.25,
    coreCageOpacity: 0.14,
    coreCageSpin: 0.14,

    // Tendril branching
    tendrilBranchCount: 2,
    tendrilBranchLength: 0.72,
    tendrilBranchSpread: 0.26,
    tendrilBranchWave: 1.55,
    tendrilBranchTwist: 0.18,

    // Micro debris / depth noise
    debrisCount: 14,
    debrisOrbitRadius: 0.82,
    debrisOrbitJitter: 0.22,
    debrisSpinSpeed: 0.65,

    // Rift layering
    riftLayerCount: 3,
    riftLayerSpacing: 0.06,
    riftLayerOpacity: 0.18,
    riftLayerSpin: 0.14,
    
    // LOD
    lodDistanceHigh: 8,
    lodDistanceMedium: 16,
    lodDistanceLow: 30,
    
    // Performance
    maxDrawCalls: 20,
    enableOrbitalStreams: true,
    enableTendrils: true,
    enableRift: true,
    enablePulses: true
};

// ============================================================================
// SHADER DEFINITIONS
// ============================================================================

const CORE_VERTEX_SHADER = `
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
uniform float uTime;
uniform float uPulsePhase;

void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    
    // Breathing effect
    float breath = 1.0 + sin(uTime * 2.5) * 0.12;
    // Pulse effect
    float pulse = 1.0 + sin(uPulsePhase * 6.28318) * 0.08;
    
    vec3 pos = position * breath * pulse;
    
    // Subtle vertex displacement for organic feel
    float displacement = sin(position.x * 15.0 + uTime * 2.0) * 
                        sin(position.y * 15.0 + uTime * 1.7) * 
                        sin(position.z * 15.0 + uTime * 2.3) * 0.02;
    pos += normal * displacement;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const CORE_FRAGMENT_SHADER = `
uniform float uHarmony;
uniform float uCorruption;
uniform float uTime;
uniform float uPulsePhase;
uniform float uSynergy;
uniform vec3 uColorHarmony;
uniform vec3 uColorCorruption;
uniform vec3 uColorNeutral;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

// Simplex noise function
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main() {
    // Determine dominant state
    float harmonyFactor = uHarmony * (1.0 - uCorruption * 0.5);
    float corruptionFactor = uCorruption * (1.0 - uHarmony * 0.3);
    
    // Base color blending
    vec3 baseColor;
    if (harmonyFactor > corruptionFactor) {
        float t = smoothstep(0.0, 0.7, harmonyFactor);
        baseColor = mix(uColorNeutral, uColorHarmony, t);
    } else {
        float t = smoothstep(0.0, 0.7, corruptionFactor);
        baseColor = mix(uColorNeutral, uColorCorruption, t);
    }
    
    // Fresnel effect for edge glow
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.5);
    
    // Fractal noise pattern
    float noise1 = snoise(vPosition * 8.0 + uTime * 0.5);
    float noise2 = snoise(vPosition * 16.0 - uTime * 0.3);
    float fractal = (noise1 * 0.6 + noise2 * 0.4) * 0.5 + 0.5;
    
    // Energy swirls
    float swirl = sin(atan(vPosition.y, vPosition.x) * 6.0 + uTime * 2.0 + length(vPosition.xy) * 5.0);
    swirl = swirl * 0.5 + 0.5;
    
    // Pulse brightness
    float pulse = 0.75 + sin(uPulsePhase * 6.28318) * 0.25;
    
    // Synergy glow boost
    float synergyGlow = 1.0 + uSynergy * 0.3;
    
    // Combine effects
    float coreIntensity = 0.5 + fractal * 0.3 + swirl * 0.2;
    vec3 finalColor = baseColor * coreIntensity * pulse * synergyGlow;
    
    // Add fresnel glow
    finalColor += baseColor * fresnel * 0.6;
    
    // Inner brightness
    float innerGlow = 1.0 - length(vPosition) * 2.0;
    innerGlow = max(innerGlow, 0.0);
    finalColor += baseColor * innerGlow * 0.4;
    
    // Alpha based on fresnel and pulse
    float alpha = 0.8 + fresnel * 0.2;
    alpha *= pulse;
    
    gl_FragColor = vec4(finalColor, alpha);
}
`;

const TENDRIL_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vPosition;
uniform float uTime;
uniform float uWavePhase;
uniform float uWaveAmplitude;

void main() {
    vUv = uv;
    vPosition = position;
    
    vec3 pos = position;
    
    // Wave motion along tendril
    float wave = sin(uv.x * 12.0 + uTime * 3.0 + uWavePhase) * uWaveAmplitude;
    float wave2 = cos(uv.x * 8.0 + uTime * 2.5 + uWavePhase * 0.7) * uWaveAmplitude * 0.6;
    
    pos.y += wave;
    pos.z += wave2;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const TENDRIL_FRAGMENT_SHADER = `
uniform vec3 uColor;
uniform float uTime;
uniform float uIntensity;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
    // Energy flow effect
    float flow = fract(vUv.x * 4.0 - uTime * 0.8);
    float intensity = smoothstep(0.0, 0.4, flow) * smoothstep(1.0, 0.6, flow);
    
    // Fade at ends
    float fadeStart = smoothstep(0.0, 0.15, vUv.x);
    float fadeEnd = smoothstep(1.0, 0.85, vUv.x);
    float fade = fadeStart * fadeEnd;
    
    // Core glow
    float coreGlow = 1.0 - abs(vUv.y - 0.5) * 2.0;
    coreGlow = pow(coreGlow, 1.5);
    
    vec3 color = uColor * (0.4 + intensity * 0.6 + coreGlow * 0.3) * uIntensity;
    float alpha = (0.3 + intensity * 0.5 + coreGlow * 0.2) * fade;
    
    gl_FragColor = vec4(color, alpha);
}
`;

const RIFT_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vPosition;
uniform float uTime;
uniform float uDistortion;

void main() {
    vUv = uv;
    vPosition = position;
    
    vec3 pos = position;
    
    // Distortion effect
    float angle = atan(pos.y, pos.x);
    float dist = length(pos.xy);
    float distortion = sin(angle * 8.0 + uTime * 1.5) * uDistortion;
    distortion += cos(angle * 12.0 - uTime * 0.8) * uDistortion * 0.5;
    pos.xy *= 1.0 + distortion;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const RIFT_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uHarmony;
uniform float uCorruption;
uniform float uOpacity;
varying vec2 vUv;
varying vec3 vPosition;

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    // Iridescent effect based on angle
    float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
    float hue = fract(angle / 6.28318 + uTime * 0.08);
    
    // Base iridescent color
    vec3 iridescent = hsv2rgb(vec3(hue, 0.4, 0.9));
    
    // Harmony/corruption tint
    vec3 harmonyTint = vec3(0.0, 0.9, 1.0);
    vec3 corruptionTint = vec3(1.0, 0.2, 0.4);
    
    vec3 stateTint = mix(harmonyTint, corruptionTint, uCorruption);
    iridescent = mix(iridescent, stateTint, 0.35);
    
    // Radial fade
    float dist = length(vUv - 0.5) * 2.0;
    float radialFade = smoothstep(1.0, 0.2, dist);
    
    // Shimmer effect
    float shimmer = sin(angle * 20.0 + uTime * 3.0) * 0.5 + 0.5;
    shimmer = shimmer * 0.15 + 0.85;
    
    // Depth illusion - darker toward center
    float depth = smoothstep(0.0, 0.6, dist);
    
    vec3 finalColor = iridescent * shimmer * (0.7 + depth * 0.3);
    float alpha = uOpacity * radialFade * shimmer;
    
    gl_FragColor = vec4(finalColor, alpha);
}
`;

const SHELL_VERTEX_SHADER = `
varying vec3 vPosition;
varying vec3 vNormal;
uniform float uTime;
uniform float uPulsePhase;
uniform float uShellStrength;

void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);

    vec3 pos = position;
    float pulse = 1.0 + sin(uPulsePhase * 6.28318) * 0.06;
    float breath = 1.0 + sin(uTime * 2.1 + length(position) * 8.0) * 0.05;
    float swirl = sin(position.x * 17.0 + uTime * 1.8) * sin(position.y * 19.0 - uTime * 1.5) * 0.018;
    pos += normal * swirl * uShellStrength;
    pos *= pulse * breath;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const SHELL_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uHarmony;
uniform float uCorruption;
uniform float uSynergy;
uniform float uOpacity;
varying vec3 vPosition;
varying vec3 vNormal;

void main() {
    vec3 harmonyColor = vec3(0.05, 0.92, 1.0);
    vec3 corruptionColor = vec3(1.0, 0.18, 0.48);
    vec3 neutralColor = vec3(0.86, 0.78, 1.0);

    float dominance = clamp(uHarmony - uCorruption, -1.0, 1.0);
    vec3 stateColor = mix(corruptionColor, harmonyColor, smoothstep(-0.2, 0.35, dominance * 0.5 + 0.5));
    stateColor = mix(stateColor, neutralColor, 1.0 - min(1.0, abs(dominance) * 1.2));

    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 2.4);
    float band = sin((length(vPosition.xy) * 15.0) + uTime * 2.8) * 0.5 + 0.5;
    float bloom = 0.45 + fresnel * 0.95 + band * 0.18 + uSynergy * 0.1;
    float alpha = uOpacity * (0.22 + fresnel * 0.9 + band * 0.14);

    vec3 color = stateColor * bloom;
    color += vec3(0.25, 0.55, 1.0) * fresnel * 0.24;

    gl_FragColor = vec4(color, alpha);
}
`;

// ============================================================================
// NEURAL CONVERGENCE SINGULARITY CLASS
// ============================================================================

export class NeuralConvergenceSingularity {
    constructor(scene, config = {}) {
        this.scene = scene;
        this.config = { ...DEFAULT_CONFIG, ...config };
        
        // State
        this.active = false;
        this.position = new THREE.Vector3();
        this.harmony = 0.5;
        this.corruption = 0.0;
        this.synergy = 0.5;
        this.connectedNodes = [];
        this.orbitAnchor = new THREE.Vector3();
        this.orbitRadius = 0.42;
        this.orbitHeight = 0.18;
        this.orbitSpeed = 0.6;
        this.orbitPhase = Math.random() * Math.PI * 2;
        this.orbitBobPhase = Math.random() * Math.PI * 2;
        this.orbitEnabled = true;
        
        // Time tracking
        this._lifecycleLogTimes = new Map();
        this.enableLifecycleLogs = false; // disable lifecycle logs by default
        this.time = 0;
        this.lastPulseTime = 0;
        
        // LOD
        this.lodLevel = 0; // 0 = high, 1 = medium, 2 = low
        
        // Components
        this.group = new THREE.Group();
        this.group.name = 'NeuralConvergenceSingularity';
        this.core = null;
        this.coreGlow = null;
        this.coreShell = null;
        this.coreCage = null;
        this.orbitalStreams = [];
        this.tendrils = [];
        this.tendrilBranches = [];
        this.debrisField = [];
        this.riftLayers = [];
        this.rift = null;
        this.pulses = [];
        
        // Initialize
        this.createSingularityCore();
        
        if (this.config.enableOrbitalStreams) {
            this.createOrbitalStreams();
        }
        
        if (this.config.enableTendrils) {
            this.createEnergyTendrils();
        }
        
        if (this.config.enableRift) {
            this.createDimensionalRift();
        }
        
        if (this.config.enablePulses) {
            this.createPulseSystem();
        }
        
        // Set render order
        this.group.renderOrder = VisualHierarchyRegistry.getRenderOrder(
            VisualHierarchyRegistry.LAYER_GLYPH_COMPOSITE
        );
        this._syncRenderOrders();
        
        // Initially hidden
        this.group.visible = false;
    }

    _logLifecycle(key, message, details = null) {
        if (!this.enableLifecycleLogs) return;

        const now = Date.now();
        const last = this._lifecycleLogTimes.get(key) || 0;
        if (now - last < SINGULARITY_LIFECYCLE_LOG_THROTTLE_MS) return;

        this._lifecycleLogTimes.set(key, now);
        if (details) {
            console.error(`[NeuralConvergenceSingularity] ${message}`, details);
        } else {
            console.error(`[NeuralConvergenceSingularity] ${message}`);
        }
    }
    
    // ========================================================================
    // CORE CREATION
    // ========================================================================
    
    createSingularityCore() {
        const geometry = new THREE.IcosahedronGeometry(
            this.config.coreRadius,
            this.config.coreDetail
        );
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uHarmony: { value: 0.5 },
                uCorruption: { value: 0 },
                uSynergy: { value: 0.5 },
                uPulsePhase: { value: 0 },
                uColorHarmony: { value: new THREE.Color(this.config.coreColorHarmony) },
                uColorCorruption: { value: new THREE.Color(this.config.coreColorCorruption) },
                uColorNeutral: { value: new THREE.Color(this.config.coreColorNeutral) }
            },
            vertexShader: CORE_VERTEX_SHADER,
            fragmentShader: CORE_FRAGMENT_SHADER,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.FrontSide
        });
        
        this.core = new THREE.Mesh(geometry, material);
        this.core.name = 'SingularityCore';
        this.core.userData.isSingularityCore = true;
        this.group.add(this.core);
        
        // Add inner glow sphere
        const glowGeometry = new THREE.IcosahedronGeometry(
            this.config.coreRadius * 0.6,
            2
        );
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.config.coreColorHarmony,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.coreGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.coreGlow.name = 'CoreInnerGlow';
        this.group.add(this.coreGlow);

        this.coreShell = this.createConvergenceShell();
        if (this.coreShell) {
            this.group.add(this.coreShell);
        }

        this.coreCage = this.createConvergenceCage();
        if (this.coreCage) {
            this.group.add(this.coreCage);
        }

        if (this.config.enableDebris) {
            this.createDebrisField();
        }
    }

    createConvergenceShell() {
        const geometry = new THREE.IcosahedronGeometry(
            this.config.coreRadius * this.config.coreShellScale,
            Math.max(1, this.config.coreDetail - 1)
        );

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uHarmony: { value: 0.5 },
                uCorruption: { value: 0 },
                uSynergy: { value: 0.5 },
                uPulsePhase: { value: 0 },
                uOpacity: { value: this.config.coreShellOpacity },
                uShellStrength: { value: 1.0 }
            },
            vertexShader: SHELL_VERTEX_SHADER,
            fragmentShader: SHELL_FRAGMENT_SHADER,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: true,
            side: THREE.DoubleSide
        });

        const shell = new THREE.Mesh(geometry, material);
        shell.name = 'SingularityShell';
        shell.userData.isSingularityShell = true;
        shell.renderOrder = this.group.renderOrder + 1;
        shell.scale.setScalar(1.0);
        return shell;
    }

    createConvergenceCage() {
        const baseGeometry = new THREE.IcosahedronGeometry(
            this.config.coreRadius * this.config.coreCageScale,
            1
        );
        const geometry = new THREE.EdgesGeometry(baseGeometry, 10);
        baseGeometry.dispose();

        const material = new THREE.LineBasicMaterial({
            color: this.config.coreColorNeutral,
            transparent: true,
            opacity: this.config.coreCageOpacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: true
        });

        const cage = new THREE.LineSegments(geometry, material);
        cage.name = 'SingularityCage';
        cage.userData.isSingularityCage = true;
        cage.renderOrder = this.group.renderOrder + 2;
        cage.rotation.set(0.18, 0.22, 0.08);
        return cage;
    }

    createDebrisField() {
        const debrisGeometry = new THREE.TetrahedronGeometry(this.config.coreRadius * 0.12, 0);
        const shardGeometry = new THREE.OctahedronGeometry(this.config.coreRadius * 0.09, 0);

        for (let i = 0; i < this.config.debrisCount; i++) {
            const useOcta = i % 3 === 0;
            const mesh = new THREE.Mesh(
                useOcta ? shardGeometry.clone() : debrisGeometry.clone(),
                new THREE.MeshBasicMaterial({
                    color: i % 2 === 0 ? this.config.coreColorHarmony : this.config.coreColorNeutral,
                    transparent: true,
                    opacity: 0.36,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    depthTest: true
                })
            );

            const angle = (i / this.config.debrisCount) * Math.PI * 2;
            const radius = this.config.debrisOrbitRadius + (Math.random() - 0.5) * this.config.debrisOrbitJitter;
            const height = (Math.random() - 0.5) * 0.26;
            mesh.position.set(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius * 0.82
            );
            mesh.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            mesh.userData = {
                isSingularityDebris: true,
                baseAngle: angle,
                baseRadius: radius,
                baseHeight: height,
                spinSpeed: this.config.debrisSpinSpeed * (0.7 + Math.random() * 0.8),
                wobble: 0.5 + Math.random() * 0.6,
                pulsePhase: Math.random() * Math.PI * 2
            };

            this.debrisField.push(mesh);
            this.group.add(mesh);
        }

        debrisGeometry.dispose();
        shardGeometry.dispose();
    }

    _syncRenderOrders() {
        const baseOrder = this.group.renderOrder || VisualHierarchyRegistry.getRenderOrder(
            VisualHierarchyRegistry.LAYER_GLYPH_COMPOSITE
        );

        if (this.core) this.core.renderOrder = baseOrder;
        if (this.coreGlow) this.coreGlow.renderOrder = baseOrder + 0.1;
        if (this.coreShell) this.coreShell.renderOrder = baseOrder + 0.2;
        if (this.coreCage) this.coreCage.renderOrder = baseOrder + 0.3;

        if (Array.isArray(this.riftLayers)) {
            this.riftLayers.forEach((layer, index) => {
                if (layer?.mesh) {
                    layer.mesh.renderOrder = baseOrder + 1 + index * 0.1;
                }
            });
        } else if (this.rift) {
            this.rift.renderOrder = baseOrder + 1;
        }

        this.debrisField.forEach((debris, index) => {
            debris.renderOrder = baseOrder + 1.8 + index * 0.01;
        });

        this.tendrils.forEach((tendril, index) => {
            if (tendril?.mesh) tendril.mesh.renderOrder = baseOrder + 2 + index * 0.02;
            if (Array.isArray(tendril.branches)) {
                tendril.branches.forEach((branch, branchIndex) => {
                    if (branch?.mesh) {
                        branch.mesh.renderOrder = baseOrder + 2.5 + index * 0.02 + branchIndex * 0.005;
                    }
                });
            }
        });

        this.pulses.forEach((pulse, index) => {
            if (pulse?.mesh) pulse.mesh.renderOrder = baseOrder + 3 + index * 0.05;
        });
    }
    
    // ========================================================================
    // ORBITAL STREAMS CREATION
    // ========================================================================
    
    createOrbitalStreams() {
        for (let i = 0; i < this.config.orbitalStreams; i++) {
            const stream = this.createOrbitalStream(i);
            this.orbitalStreams.push(stream);
            this.group.add(stream.points);
        }
    }
    
    createOrbitalStream(index) {
        const particleCount = this.config.orbitalParticlesPerStream;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // Orbital parameters - each stream has unique orbit
        const orbitRadius = this.config.orbitalRadiusMin + 
            (index / this.config.orbitalStreams) * (this.config.orbitalRadiusMax - this.config.orbitalRadiusMin);
        const orbitTilt = (index / this.config.orbitalStreams) * Math.PI * 0.4;
        const orbitPhase = (index / this.config.orbitalStreams) * Math.PI * 2;
        const orbitEccentricity = 0.1 + Math.random() * 0.15;
        
        // Initialize positions
        for (let i = 0; i < particleCount; i++) {
            const t = i / particleCount;
            const angle = t * Math.PI * 2;
            
            // Elliptical orbit
            const x = Math.cos(angle) * orbitRadius * (1 + orbitEccentricity);
            const y = Math.sin(angle) * orbitRadius * (1 - orbitEccentricity) * Math.sin(orbitTilt);
            const z = Math.sin(angle) * orbitRadius * (1 - orbitEccentricity) * Math.cos(orbitTilt);
            
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
            
            // Color gradient along stream
            const colorT = t;
            colors[i * 3] = 0.0 + colorT * 0.5;
            colors[i * 3 + 1] = 0.8 + colorT * 0.2;
            colors[i * 3 + 2] = 1.0;
            
            // Size variation
            sizes[i] = 0.015 + Math.random() * 0.02;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: 0.025,
            vertexColors: true,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });
        
        const points = new THREE.Points(geometry, material);
        points.name = `OrbitalStream_${index}`;
        points.userData.isOrbitalStream = true;
        points.userData.streamIndex = index;
        
        return {
            points,
            orbitRadius,
            orbitTilt,
            orbitPhase,
            orbitEccentricity,
            particleCount,
            rotationSpeed: this.config.orbitalSpeed * (0.8 + Math.random() * 0.4)
        };
    }
    
    // ========================================================================
    // ENERGY TENDRILS CREATION
    // ========================================================================
    
    createEnergyTendrils() {
        for (let i = 0; i < this.config.tendrilCount; i++) {
            const tendril = this.createEnergyTendril(i);
            this.tendrils.push(tendril);
            this.group.add(tendril.mesh);

            if (Array.isArray(tendril.branches)) {
                tendril.branches.forEach((branch) => {
                    this.tendrilBranches.push(branch);
                    this.group.add(branch.mesh);
                });
            }
        }
    }
    
    createEnergyTendril(index) {
        const angle = (index / this.config.tendrilCount) * Math.PI * 2;
        const basePhase = index * Math.PI * 0.5 + Math.random() * 0.35;

        const primary = this.createOrganicTendrilMesh({
            name: `EnergyTendril_${index}`,
            length: this.config.tendrilLength,
            radius: this.config.tendrilRadius,
            segments: this.config.tendrilSegments,
            waveAmplitude: 0.05,
            waveSpeed: this.config.tendrilWaveSpeed,
            wavePhase: basePhase,
            intensity: 1.0,
            opacity: 0.78,
            twist: this.config.tendrilBranchTwist * 0.25,
            tiltX: -0.22 + Math.random() * 0.44,
            tiltY: angle,
            tiltZ: Math.sin(angle) * 0.12
        });

        primary.mesh.userData.tendrilIndex = index;
        primary.mesh.userData.baseAngle = angle;
        primary.mesh.rotation.y = angle;
        primary.mesh.rotation.x = primary.mesh.userData.baseTilt.x;
        primary.mesh.rotation.z = primary.mesh.userData.baseTilt.z;

        const branchCount = Math.max(0, this.config.tendrilBranchCount);
        const branches = [];
        for (let b = 0; b < branchCount; b++) {
            const branchAngle = angle + (b === 0 ? -1 : 1) * this.config.tendrilBranchSpread;
            const branch = this.createOrganicTendrilMesh({
                name: `EnergyTendril_${index}_Branch_${b}`,
                length: this.config.tendrilBranchLength,
                radius: this.config.tendrilRadius * 0.58,
                segments: Math.max(8, this.config.tendrilSegments - 2),
                waveAmplitude: 0.07,
                waveSpeed: this.config.tendrilBranchWave,
                wavePhase: basePhase + (b + 1) * 0.92,
                intensity: 0.68,
                opacity: 0.58,
                twist: this.config.tendrilBranchTwist * (b === 0 ? -1 : 1),
                tiltX: -0.08 + (b === 0 ? -0.16 : 0.16),
                tiltY: branchAngle,
                tiltZ: (b === 0 ? -0.14 : 0.14)
            });

            branch.mesh.position.set(
                Math.cos(angle) * 0.05,
                0.02 + (b === 0 ? 0.01 : -0.01),
                Math.sin(angle) * 0.05
            );
            branch.mesh.userData.parentTendrilIndex = index;
            branch.mesh.userData.branchIndex = b;
            branch.mesh.userData.baseAngle = branchAngle;
            branches.push(branch);
        }

        primary.branches = branches;
        return primary;
    }

    createOrganicTendrilMesh({
        name,
        length,
        radius,
        segments,
        waveAmplitude,
        waveSpeed,
        wavePhase,
        intensity,
        opacity,
        twist = 0,
        tiltX = 0,
        tiltY = 0,
        tiltZ = 0
    }) {
        const points = [];
        const curveSegments = Math.max(8, segments);
        for (let i = 0; i <= curveSegments; i++) {
            const t = i / curveSegments;
            const taper = 1.0 - Math.pow(t, 1.25) * 0.12;
            const x = t * length;
            const bend = Math.sin(t * Math.PI) * (0.12 + waveAmplitude * 1.8);
            const curl = Math.sin(t * Math.PI * 2.2 + wavePhase) * waveAmplitude * 0.65;
            const lift = Math.cos(t * Math.PI * 1.15 + wavePhase * 0.7) * waveAmplitude * 0.48;
            points.push(new THREE.Vector3(
                x,
                bend * taper + lift,
                curl * taper
            ));
        }

        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.TubeGeometry(
            curve,
            curveSegments * 2,
            radius,
            8,
            false
        );

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(this.config.coreColorHarmony) },
                uWavePhase: { value: wavePhase },
                uWaveAmplitude: { value: waveAmplitude },
                uIntensity: { value: intensity }
            },
            vertexShader: TENDRIL_VERTEX_SHADER,
            fragmentShader: TENDRIL_FRAGMENT_SHADER,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = name;
        mesh.userData.isTendril = true;
        mesh.userData.isOrganicTendril = true;
        mesh.userData.waveSpeed = waveSpeed;
        mesh.userData.waveAmplitude = waveAmplitude;
        mesh.userData.wavePhase = wavePhase;
        mesh.userData.baseTilt = new THREE.Vector3(tiltX, tiltY, tiltZ);
        mesh.rotation.set(tiltX, tiltY, tiltZ);

        return {
            mesh,
            curve,
            length,
            radius,
            intensity,
            opacity,
            waveSpeed,
            waveAmplitude,
            wavePhase,
            baseRotation: mesh.rotation.clone(),
            baseScale: mesh.scale.clone(),
            branches: []
        };
    }
    
    // ========================================================================
    // DIMENSIONAL RIFT CREATION
    // ========================================================================
    
    createDimensionalRift() {
        this.riftLayers = [];

        const layerConfigs = [
            {
                name: 'DimensionalRiftPrimary',
                geometry: new THREE.RingGeometry(
                    this.config.riftInnerRadius,
                    this.config.riftOuterRadius,
                    this.config.riftSegments,
                    1
                ),
                opacity: this.config.riftOpacity,
                distortion: 0.08,
                spin: this.config.riftRotationSpeed,
                rotation: [Math.PI * 0.1, 0.0, 0.0]
            },
            {
                name: 'DimensionalRiftHalo',
                geometry: new THREE.TorusGeometry(
                    this.config.riftOuterRadius * 1.08,
                    0.028,
                    8,
                    72
                ),
                opacity: this.config.riftOpacity * 0.62,
                distortion: 0.11,
                spin: this.config.riftRotationSpeed * 1.35,
                rotation: [Math.PI * 0.5, 0.18, Math.PI * 0.1]
            },
            {
                name: 'DimensionalRiftArc',
                geometry: new THREE.TorusGeometry(
                    this.config.riftOuterRadius * 0.7,
                    0.02,
                    8,
                    60,
                    Math.PI * 1.72
                ),
                opacity: this.config.riftOpacity * 0.52,
                distortion: 0.14,
                spin: this.config.riftRotationSpeed * 1.65,
                rotation: [Math.PI * 0.52, -0.38, Math.PI * 0.42]
            }
        ];

        const layerLimit = Math.max(1, Math.min(layerConfigs.length, Math.floor(this.config.riftLayerCount || layerConfigs.length)));
        const activeLayerConfigs = layerConfigs.slice(0, layerLimit);

        activeLayerConfigs.forEach((cfg, index) => {
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 },
                    uHarmony: { value: 0.5 },
                    uCorruption: { value: 0 },
                    uOpacity: { value: Math.max(0.04, this.config.riftLayerOpacity * (1.0 - index * 0.18)) },
                    uDistortion: { value: cfg.distortion }
                },
                vertexShader: RIFT_VERTEX_SHADER,
                fragmentShader: RIFT_FRAGMENT_SHADER,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                side: THREE.DoubleSide
            });

            const mesh = new THREE.Mesh(cfg.geometry, material);
            mesh.name = cfg.name;
            mesh.userData.isRift = true;
            mesh.userData.riftLayerIndex = index;
            mesh.renderOrder = this.group.renderOrder - 1 + index;
            mesh.rotation.set(cfg.rotation[0], cfg.rotation[1], cfg.rotation[2]);
            mesh.scale.setScalar(1.0 + index * 0.04);
            mesh.position.z = index * this.config.riftLayerSpacing;
            this.group.add(mesh);
            this.riftLayers.push({
                mesh,
                baseOpacity: Math.max(0.04, this.config.riftLayerOpacity * (1.0 - index * 0.18)),
                distortion: cfg.distortion,
                spin: cfg.spin,
                baseTiltX: cfg.rotation[0],
                baseTiltY: cfg.rotation[1],
                baseTiltZ: cfg.rotation[2],
                baseScale: 1.0 + index * 0.04
            });
        });

        this.rift = this.riftLayers[0]?.mesh || null;
    }
    
    // ========================================================================
    // PULSE SYSTEM CREATION
    // ========================================================================
    
    createPulseSystem() {
        // Pre-create pulse ring pool
        for (let i = 0; i < this.config.pulseMaxCount; i++) {
            const pulse = this.createPulseRing();
            pulse.mesh.visible = false;
            this.pulses.push(pulse);
            this.group.add(pulse.mesh);
        }
    }
    
    createPulseRing() {
        const group = new THREE.Group();
        group.name = 'ConsciousnessPulse';
        group.userData.isPulse = true;

        const ringConfigs = [
            {
                name: 'PulsePrimary',
                radiusOffset: 0.0,
                tube: this.config.pulseRingWidth,
                opacity: 0.52,
                scale: 1.0,
                color: this.config.coreColorHarmony
            }
        ];

        const echoCount = Math.max(0, Math.floor(this.config.pulseEchoCount || 0));
        for (let i = 0; i < echoCount; i++) {
            ringConfigs.push({
                name: `PulseEcho_${i}`,
                radiusOffset: this.config.pulseEchoSpacing * (0.65 + i * 0.55),
                tube: this.config.pulseRingWidth * (0.82 - i * 0.08),
                opacity: Math.max(0.1, 0.26 - i * 0.08),
                scale: 1.18 + i * 0.18,
                color: i % 2 === 0 ? this.config.coreColorNeutral : this.config.coreColorCorruption
            });
        }

        const rings = [];
        ringConfigs.forEach((cfg, index) => {
            const geometry = new THREE.RingGeometry(
                this.config.pulseInitialRadius + cfg.radiusOffset,
                this.config.pulseInitialRadius + cfg.radiusOffset + cfg.tube,
                32
            );

            const material = new THREE.MeshBasicMaterial({
                color: cfg.color,
                transparent: true,
                opacity: cfg.opacity,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                side: THREE.DoubleSide
            });

            const ring = new THREE.Mesh(geometry, material);
            ring.name = cfg.name;
            ring.userData = {
                isPulseRing: true,
                pulseRingIndex: index,
                baseOpacity: cfg.opacity,
                baseScale: cfg.scale
            };
            ring.rotation.x = Math.PI * 0.5;
            ring.position.z = index * 0.002;
            ring.scale.setScalar(cfg.scale);
            group.add(ring);
            rings.push(ring);
        });

        group.lookAt(new THREE.Vector3(0, 0, 1));
        
        return {
            mesh: group,
            rings,
            active: false,
            progress: 0,
            speed: this.config.pulseSpeed
        };
    }
    
    spawnPulse() {
        const pulse = this.pulses.find(p => !p.active);
        if (!pulse) return;
        
        pulse.active = true;
        pulse.progress = 0;
        pulse.mesh.visible = true;
        pulse.mesh.scale.setScalar(1);
        pulse.mesh.rotation.set(Math.PI * 0.5, 0, Math.random() * Math.PI * 2);
        
        // Update color based on current state
        const color = this.getStateColor();
        if (Array.isArray(pulse.rings)) {
            pulse.rings.forEach((ring, idx) => {
                if (!ring?.material) return;
                const ringColor = idx === 0
                    ? color
                    : idx === 1
                        ? new THREE.Color(0xeaffff)
                        : new THREE.Color(this.harmony > this.corruption ? this.config.coreColorHarmony : this.config.coreColorCorruption);
                ring.material.color.copy(ringColor);
                ring.material.opacity = ring.userData.baseOpacity ?? ring.material.opacity;
            });
        }
    }
    
    // ========================================================================
    // ACTIVATION / DEACTIVATION
    // ========================================================================
    
    activate(position, context = {}) {
        this.active = true;
        this.group.visible = true;
        
        if (position) {
            this.orbitAnchor.copy(position);
        }

        if (context.orbitAnchor instanceof THREE.Vector3) {
            this.orbitAnchor.copy(context.orbitAnchor);
        } else if (context.orbitAnchor && typeof context.orbitAnchor === 'object' && typeof context.orbitAnchor.x === 'number') {
            this.orbitAnchor.set(context.orbitAnchor.x, context.orbitAnchor.y, context.orbitAnchor.z);
        }

        this.orbitRadius = context.orbitRadius ?? this.orbitRadius;
        this.orbitHeight = context.orbitHeight ?? this.orbitHeight;
        this.orbitSpeed = context.orbitSpeed ?? this.orbitSpeed;
        this.orbitPhase = context.orbitPhase ?? this.orbitPhase;
        this.orbitBobPhase = context.orbitBobPhase ?? this.orbitBobPhase;
        this.orbitEnabled = context.orbitEnabled ?? true;

        this._updateOrbitPosition(0);
        
        // Set initial state
        this.harmony = context.harmony ?? 0.5;
        this.corruption = context.corruption ?? 0;
        this.synergy = context.synergy ?? 0.5;

        this._logLifecycle('activate', 'activated and shown in scene', {
            position: {
                x: this.orbitAnchor.x,
                y: this.orbitAnchor.y,
                z: this.orbitAnchor.z
            },
            harmony: this.harmony,
            corruption: this.corruption,
            synergy: this.synergy,
            connectedNodes: Array.isArray(context.connectedNodes) ? context.connectedNodes.length : 0
        });
        
        if (context.connectedNodes) {
            this.connectedNodes = context.connectedNodes;
            this.updateTendrilTargets();
        }
        
        // Spawn initial pulse
        this.spawnPulse();
    }
    
    deactivate() {
        this.active = false;
        this.group.visible = false;
        
        // Reset all pulses
        this.pulses.forEach(pulse => {
            pulse.active = false;
            pulse.mesh.visible = false;
        });

        this.connectedNodes = [];
        this.orbitAnchor.set(0, 0, 0);
        this.orbitRadius = 0.42;
        this.orbitHeight = 0.18;
        this.orbitSpeed = 0.6;
        this.orbitPhase = Math.random() * Math.PI * 2;
        this.orbitBobPhase = Math.random() * Math.PI * 2;
        this.orbitEnabled = true;

        this._logLifecycle('deactivate', 'hidden and reset', {
            connectedNodesCleared: true
        });
    }
    
    // ========================================================================
    // UPDATE
    // ========================================================================
    
    update(deltaTime, context = {}) {
        if (!this.active) return;
        
        this.time += deltaTime;
        
        // Update state from context
        if (context.harmony !== undefined) this.harmony = context.harmony;
        if (context.corruption !== undefined) this.corruption = context.corruption;
        if (context.synergy !== undefined) this.synergy = context.synergy;
        if (context.orbitEnabled !== undefined) this.orbitEnabled = context.orbitEnabled;
        if (context.orbitRadius !== undefined) this.orbitRadius = context.orbitRadius;
        if (context.orbitHeight !== undefined) this.orbitHeight = context.orbitHeight;
        if (context.orbitSpeed !== undefined) this.orbitSpeed = context.orbitSpeed;
        if (context.orbitPhase !== undefined) this.orbitPhase = context.orbitPhase;
        if (context.orbitAnchor instanceof THREE.Vector3) {
            this.orbitAnchor.copy(context.orbitAnchor);
        } else if (context.orbitAnchor && typeof context.orbitAnchor === 'object' && typeof context.orbitAnchor.x === 'number') {
            this.orbitAnchor.set(context.orbitAnchor.x, context.orbitAnchor.y, context.orbitAnchor.z);
        }

        this._updateOrbitPosition(deltaTime);
        
        // Update LOD
        this.updateLOD(context.cameraPosition);
        
        // Update components based on LOD
        this.updateCore(deltaTime);
        if (this.config.enableDebris && this.lodLevel < 2) {
            this.updateDebris(deltaTime);
        }
        
        if (this.lodLevel < 2 && this.config.enableOrbitalStreams) {
            this.updateOrbitalStreams(deltaTime);
        }
        
        if (this.lodLevel < 2 && this.config.enableTendrils) {
            this.updateTendrils(deltaTime);
        }
        
        if (this.lodLevel < 3 && this.config.enableRift) {
            this.updateRift(deltaTime);
        }
        
        if (this.lodLevel < 2 && this.config.enablePulses) {
            this.updatePulses(deltaTime);
        }
    }
    
    updateCore(deltaTime) {
        if (!this.core) return;
        
        const pulsePhase = (this.time * this.config.corePulseSpeed) % 1;
        const pulseWave = Math.sin(pulsePhase * Math.PI * 2);
        const stateColor = this.getStateColor();
        
        // Update uniforms
        this.core.material.uniforms.uTime.value = this.time;
        this.core.material.uniforms.uHarmony.value = this.harmony;
        this.core.material.uniforms.uCorruption.value = this.corruption;
        this.core.material.uniforms.uSynergy.value = this.synergy;
        this.core.material.uniforms.uPulsePhase.value = pulsePhase;
        
        // Rotation
        this.core.rotation.y += deltaTime * this.config.coreRotationSpeed;
        this.core.rotation.x = Math.sin(this.time * 0.5) * 0.15;
        this.core.rotation.z = Math.cos(this.time * 0.3) * 0.1;
        
        // Update inner glow
        if (this.coreGlow) {
            this.coreGlow.material.color.copy(stateColor);
            this.coreGlow.material.opacity = 0.28 + pulseWave * 0.16;
            this.coreGlow.rotation.copy(this.core.rotation);
            this.coreGlow.scale.setScalar(0.6 + pulseWave * 0.1);
        }

        if (this.coreShell) {
            this.coreShell.material.uniforms.uTime.value = this.time;
            this.coreShell.material.uniforms.uHarmony.value = this.harmony;
            this.coreShell.material.uniforms.uCorruption.value = this.corruption;
            this.coreShell.material.uniforms.uSynergy.value = this.synergy;
            this.coreShell.material.uniforms.uPulsePhase.value = pulsePhase;
            this.coreShell.material.uniforms.uOpacity.value = this.config.coreShellOpacity;
            this.coreShell.material.uniforms.uShellStrength.value = 1.0 + this.synergy * 0.18;
            this.coreShell.material.color?.copy?.(stateColor);
            this.coreShell.rotation.copy(this.core.rotation);
            this.coreShell.rotation.y += 0.14 + pulseWave * 0.08;
            this.coreShell.rotation.x -= 0.04;
            this.coreShell.rotation.z += 0.02;
            this.coreShell.scale.setScalar(1.0 + pulseWave * this.config.coreShellPulse);
        }

        if (this.coreCage) {
            this.coreCage.material.color.copy(stateColor);
            this.coreCage.material.opacity = this.config.coreCageOpacity + Math.abs(pulseWave) * 0.04;
            this.coreCage.rotation.y += deltaTime * this.config.coreCageSpin;
            this.coreCage.rotation.x += deltaTime * this.config.coreCageSpin * 0.58;
            this.coreCage.rotation.z += deltaTime * this.config.coreCageSpin * 0.42;
            const cageScale = 1.0 + Math.abs(pulseWave) * 0.04;
            this.coreCage.scale.setScalar(cageScale);
        }
    }

    updateDebris(deltaTime) {
        if (!this.debrisField.length) return;

        const stateColor = this.getStateColor();
        this.debrisField.forEach((debris, index) => {
            const data = debris.userData || {};
            const angle = data.baseAngle + this.time * (data.spinSpeed || this.config.debrisSpinSpeed);
            const bob = Math.sin(this.time * 1.8 + data.pulsePhase) * 0.06;
            const radius = data.baseRadius + Math.sin(this.time * 0.9 + index * 0.37) * 0.06;

            debris.position.set(
                Math.cos(angle) * radius,
                (data.baseHeight || 0) + bob,
                Math.sin(angle) * radius * 0.82
            );

            debris.rotation.x += deltaTime * (0.8 + (data.spinSpeed || 0.4));
            debris.rotation.y += deltaTime * (0.7 + (data.spinSpeed || 0.4));
            debris.rotation.z += deltaTime * (0.5 + (data.spinSpeed || 0.4));

            if (debris.material?.color) {
                debris.material.color.copy(stateColor);
            }

            const pulse = 0.74 + Math.sin(this.time * 2.4 + data.pulsePhase) * 0.16;
            debris.scale.setScalar(pulse);
            if (debris.material) {
                debris.material.opacity = 0.18 + Math.abs(Math.sin(this.time * 1.6 + data.pulsePhase)) * 0.24;
            }
        });
    }
    
    updateOrbitalStreams(deltaTime) {
        this.orbitalStreams.forEach((stream, index) => {
            const positions = stream.points.geometry.attributes.position.array;
            const colors = stream.points.geometry.attributes.color.array;
            
            for (let i = 0; i < stream.particleCount; i++) {
                const t = i / stream.particleCount;
                const angle = t * Math.PI * 2 + this.time * stream.rotationSpeed;
                
                // Elliptical orbit with precession
                const precession = this.time * 0.1;
                const currentTilt = stream.orbitTilt + Math.sin(precession) * 0.1;
                
                const x = Math.cos(angle) * stream.orbitRadius * (1 + stream.orbitEccentricity);
                const y = Math.sin(angle) * stream.orbitRadius * (1 - stream.orbitEccentricity) * Math.sin(currentTilt);
                const z = Math.sin(angle) * stream.orbitRadius * (1 - stream.orbitEccentricity) * Math.cos(currentTilt);
                
                positions[i * 3] = x;
                positions[i * 3 + 1] = y;
                positions[i * 3 + 2] = z;
                
                // Update colors based on state
                const stateColor = this.getStateColor();
                colors[i * 3] = stateColor.r * (0.7 + t * 0.3);
                colors[i * 3 + 1] = stateColor.g * (0.7 + t * 0.3);
                colors[i * 3 + 2] = stateColor.b;
            }
            
            stream.points.geometry.attributes.position.needsUpdate = true;
            stream.points.geometry.attributes.color.needsUpdate = true;
            
            // Opacity based on synergy
            stream.points.material.opacity = 0.5 + this.synergy * 0.3;
        });
    }
    
    updateTendrils(deltaTime) {
        const stateColor = this.getStateColor();

        this.tendrils.forEach((tendril, index) => {
            if (!tendril?.mesh) return;

            // Update shader uniforms
            tendril.mesh.material.uniforms.uTime.value = this.time;
            tendril.mesh.material.uniforms.uColor.value.copy(stateColor);
            tendril.mesh.material.uniforms.uIntensity.value = 0.72 + this.synergy * 0.4;
            
            // Animate tendril angle
            const baseTilt = tendril.mesh.userData.baseTilt || new THREE.Vector3();
            const angleOffset = Math.sin(this.time * (0.52 + tendril.waveSpeed * 0.08) + index) * 0.12;
            const waveLift = Math.sin(this.time * 1.2 + tendril.wavePhase) * 0.05;
            const waveTwist = Math.cos(this.time * 0.78 + index * 0.37) * 0.04;
            tendril.mesh.rotation.x = baseTilt.x + waveLift * 0.5;
            tendril.mesh.rotation.y = baseTilt.y + angleOffset;
            tendril.mesh.rotation.z = baseTilt.z + waveTwist;
            tendril.mesh.scale.setScalar(1.0 + Math.sin(this.time * 1.1 + index) * 0.045);
            
            // Look at target node if connected
            if (tendril.targetNode && tendril.targetNode.position) {
                tendril.mesh.lookAt(tendril.targetNode.position);
                tendril.mesh.rotateY(Math.PI * 0.5);
            }

            if (Array.isArray(tendril.branches)) {
                tendril.branches.forEach((branch, branchIndex) => {
                    if (!branch?.mesh) return;
                    const branchPhase = branch.wavePhase + this.time * (branch.waveSpeed * 0.9);
                    const branchTilt = branch.mesh.userData.baseTilt || new THREE.Vector3();

                    branch.mesh.material.uniforms.uTime.value = this.time;
                    branch.mesh.material.uniforms.uColor.value.copy(stateColor);
                    branch.mesh.material.uniforms.uIntensity.value = 0.55 + this.synergy * 0.3;

                    branch.mesh.rotation.x = branchTilt.x + Math.sin(branchPhase) * 0.1;
                    branch.mesh.rotation.y = branchTilt.y + Math.sin(branchPhase * 0.8 + branchIndex) * 0.16;
                    branch.mesh.rotation.z = branchTilt.z + Math.cos(branchPhase * 0.9) * 0.08;
                    branch.mesh.scale.setScalar(0.9 + Math.sin(this.time * 1.4 + index + branchIndex) * 0.035);

                    if (tendril.targetNode && tendril.targetNode.position) {
                        branch.mesh.lookAt(tendril.targetNode.position);
                        branch.mesh.rotateY(Math.PI * 0.5);
                    }
                });
            }
        });
    }
    
    updateRift(deltaTime) {
        if (!this.rift && (!Array.isArray(this.riftLayers) || this.riftLayers.length === 0)) return;

        const pulsePhase = (this.time * this.config.corePulseSpeed) % 1;
        const pulseWave = Math.sin(pulsePhase * Math.PI * 2);
        const layers = Array.isArray(this.riftLayers) && this.riftLayers.length > 0
            ? this.riftLayers
            : (this.rift ? [{ mesh: this.rift, baseOpacity: this.config.riftOpacity, spin: this.config.riftRotationSpeed, layerIndex: 0 }] : []);

        layers.forEach((layer, index) => {
            if (!layer?.mesh) return;
            const mesh = layer.mesh;
            const material = mesh.material;
            if (material?.uniforms) {
                material.uniforms.uTime.value = this.time;
                material.uniforms.uHarmony.value = this.harmony;
                material.uniforms.uCorruption.value = this.corruption;
                if (material.uniforms.uOpacity) {
                    const opacityBase = layer.baseOpacity ?? this.config.riftOpacity;
                    material.uniforms.uOpacity.value = opacityBase * (0.8 + pulseWave * 0.18 + index * 0.04);
                }
                if (material.uniforms.uDistortion) {
                    material.uniforms.uDistortion.value = (layer.distortion ?? 0.08) * (1.0 + this.synergy * 0.12);
                }
            }

            mesh.rotation.z += deltaTime * (layer.spin ?? this.config.riftRotationSpeed) * (index % 2 === 0 ? 1 : -0.84);
            mesh.rotation.x = (layer.baseTiltX ?? mesh.rotation.x) + Math.sin(this.time * 0.09 + index) * 0.05;
            mesh.rotation.y = (layer.baseTiltY ?? mesh.rotation.y) + Math.cos(this.time * 0.07 + index) * 0.03;
            mesh.scale.setScalar(layer.baseScale ?? 1.0);
            const scaleJitter = 1.0 + pulseWave * 0.03 + index * 0.02;
            mesh.scale.multiplyScalar(scaleJitter);
        });
    }
    
    updatePulses(deltaTime) {
        // Spawn new pulse
        if (this.time - this.lastPulseTime > this.config.pulseInterval) {
            this.spawnPulse();
            this.lastPulseTime = this.time;
        }
        
        // Update active pulses
        this.pulses.forEach(pulse => {
            if (!pulse.active) return;
            
            pulse.progress += deltaTime * pulse.speed;
            
            if (pulse.progress >= 1) {
                pulse.active = false;
                pulse.mesh.visible = false;
                return;
            }
            
            const envelope = 1 - Math.pow(pulse.progress, 1.7);
            const mainScale = 1 + pulse.progress * (this.config.pulseMaxRadius / this.config.pulseInitialRadius - 1);
            pulse.mesh.scale.setScalar(mainScale);
            pulse.mesh.rotation.z += deltaTime * 0.38;
            pulse.mesh.rotation.x = Math.PI * 0.5 + Math.sin(this.time * 1.1 + pulse.progress * Math.PI * 2) * 0.05;

            if (Array.isArray(pulse.rings)) {
                pulse.rings.forEach((ring, idx) => {
                    if (!ring?.material) return;
                    const echoProgress = Math.max(0, pulse.progress - idx * 0.12);
                    const echoScale = mainScale * (1 + idx * 0.1) * (1 + echoProgress * 0.06);
                    ring.scale.setScalar((ring.userData.baseScale ?? 1.0) * echoScale);
                    ring.material.opacity = (ring.userData.baseOpacity ?? 0.3) * envelope * (1 - idx * 0.18);
                    ring.rotation.z += deltaTime * (0.45 + idx * 0.12);
                    ring.rotation.x = Math.PI * 0.5;
                });
            }
        });
    }
    
    updateLOD(cameraPosition) {
        if (!cameraPosition) {
            this.lodLevel = 0;
            return;
        }
        
        const distance = this.position.distanceTo(cameraPosition);
        
        if (distance < this.config.lodDistanceHigh) {
            this.lodLevel = 0; // High detail
        } else if (distance < this.config.lodDistanceMedium) {
            this.lodLevel = 1; // Medium detail
        } else if (distance < this.config.lodDistanceLow) {
            this.lodLevel = 2; // Low detail
        } else {
            this.lodLevel = 3; // Minimal
        }
        
        // Adjust visibility based on LOD
        if (this.orbitalStreams.length > 0) {
            this.orbitalStreams.forEach(s => {
                s.points.visible = this.lodLevel < 2;
            });
        }
        
        if (this.tendrils.length > 0) {
            this.tendrils.forEach(t => {
                t.mesh.visible = this.lodLevel < 2;
                if (Array.isArray(t.branches)) {
                    t.branches.forEach(branch => {
                        branch.mesh.visible = this.lodLevel < 1;
                    });
                }
            });
        }

        if (this.debrisField.length > 0) {
            this.debrisField.forEach(d => {
                d.visible = this.lodLevel < 2;
            });
        }
        
        if (this.rift) {
            this.rift.visible = this.lodLevel < 3;
        }
        if (this.riftLayers.length > 1) {
            this.riftLayers.forEach((layer, index) => {
                if (!layer?.mesh) return;
                layer.mesh.visible = this.lodLevel < (index === 0 ? 3 : 2);
            });
        }
    }
    
    updateTendrilTargets() {
        if (!this.connectedNodes || this.connectedNodes.length === 0) return;
        
        this.tendrils.forEach((tendril, index) => {
            if (index < this.connectedNodes.length) {
                tendril.targetNode = this.connectedNodes[index];
            } else {
                tendril.targetNode = null;
            }
        });
    }
    
    // ========================================================================
    // HELPERS
    // ========================================================================
    
    getStateColor() {
        const color = new THREE.Color();
        
        if (this.harmony > this.corruption) {
            // Harmony dominant
            const t = Math.min(1, (this.harmony - this.corruption) * 2);
            color.setHex(this.config.coreColorHarmony);
            color.lerp(new THREE.Color(this.config.coreColorNeutral), 1 - t);
        } else {
            // Corruption dominant
            const t = Math.min(1, (this.corruption - this.harmony) * 2);
            color.setHex(this.config.coreColorCorruption);
            color.lerp(new THREE.Color(this.config.coreColorNeutral), 1 - t);
        }
        
        return color;
    }
    
    setPosition(x, y, z) {
        if (x instanceof THREE.Vector3) {
            this.orbitAnchor.copy(x);
        } else {
            this.orbitAnchor.set(x, y, z);
        }
        this._updateOrbitPosition(0);
    }
    
    setConnectedNodes(nodes) {
        this.connectedNodes = nodes;
        this.updateTendrilTargets();
    }

    _updateOrbitPosition(deltaTime) {
        if (!this.orbitEnabled) {
            this.position.copy(this.orbitAnchor);
            this.group.position.copy(this.position);
            return;
        }

        this.orbitPhase += deltaTime * this.orbitSpeed;
        this.orbitBobPhase += deltaTime * (this.orbitSpeed * 1.35);

        const angle = this.orbitPhase;
        const bob = Math.sin(this.orbitBobPhase) * this.orbitHeight;
        const radius = this.orbitRadius;

        this.position.set(
            this.orbitAnchor.x + Math.cos(angle) * radius,
            this.orbitAnchor.y + bob,
            this.orbitAnchor.z + Math.sin(angle) * radius * 0.85
        );
        this.group.position.copy(this.position);
        this.group.rotation.y = angle + Math.PI / 2;
    }
    
    // ========================================================================
    // DISPOSE
    // ========================================================================
    
    dispose() {
        const disposeMesh = (mesh) => {
            if (!mesh) return;
            if (mesh.parent) {
                mesh.parent.remove(mesh);
            }
            if (mesh.geometry) {
                mesh.geometry.dispose();
            }
            if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach((mat) => mat?.dispose?.());
                } else {
                    mesh.material.dispose();
                }
            }
        };

        // Dispose core
        disposeMesh(this.core);
        disposeMesh(this.coreGlow);
        disposeMesh(this.coreShell);
        disposeMesh(this.coreCage);
        
        // Dispose orbital streams
        this.orbitalStreams.forEach(stream => {
            disposeMesh(stream.points);
        });
        
        // Dispose tendrils
        this.tendrils.forEach(tendril => {
            disposeMesh(tendril.mesh);
            if (Array.isArray(tendril.branches)) {
                tendril.branches.forEach((branch) => disposeMesh(branch.mesh));
            }
        });

        this.tendrilBranches.forEach((branch) => disposeMesh(branch.mesh));
        this.tendrilBranches = [];

        this.debrisField.forEach((debris) => disposeMesh(debris));
        this.debrisField = [];
        
        // Dispose rift
        if (Array.isArray(this.riftLayers)) {
            this.riftLayers.forEach((layer) => disposeMesh(layer.mesh));
        } else {
            disposeMesh(this.rift);
        }
        
        // Dispose pulses
        this.pulses.forEach(pulse => {
            if (Array.isArray(pulse.rings)) {
                pulse.rings.forEach((ring) => disposeMesh(ring));
            }
            disposeMesh(pulse.mesh);
        });
        
        // Remove from parent
        if (this.group.parent) {
            this.group.parent.remove(this.group);
        }
        this.group.clear();
        
        this.active = false;
        this.orbitalStreams = [];
        this.tendrils = [];
        this.tendrilBranches = [];
        this.debrisField = [];
        this.riftLayers = [];
        this.pulses = [];
        this.core = null;
        this.coreGlow = null;
        this.coreShell = null;
        this.coreCage = null;
        this.rift = null;
    }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createNeuralConvergenceSingularity(scene, config = {}) {
    return new NeuralConvergenceSingularity(scene, config);
}

export default NeuralConvergenceSingularity;
