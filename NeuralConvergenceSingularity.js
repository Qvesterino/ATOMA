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
        
        // Time tracking
        this.time = 0;
        this.lastPulseTime = 0;
        
        // LOD
        this.lodLevel = 0; // 0 = high, 1 = medium, 2 = low
        
        // Components
        this.group = new THREE.Group();
        this.group.name = 'NeuralConvergenceSingularity';
        this.core = null;
        this.orbitalStreams = [];
        this.tendrils = [];
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
        
        // Initially hidden
        this.group.visible = false;
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
        }
    }
    
    createEnergyTendril(index) {
        // Create curved path for tendril
        const points = [];
        const segments = this.config.tendrilSegments;
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            // Curved path - starts at center, curves outward
            const x = t * this.config.tendrilLength;
            const y = Math.sin(t * Math.PI) * 0.15;
            const z = Math.cos(t * Math.PI * 2) * 0.08;
            points.push(new THREE.Vector3(x, y, z));
        }
        
        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.TubeGeometry(
            curve,
            segments,
            this.config.tendrilRadius,
            6,
            false
        );
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(this.config.coreColorHarmony) },
                uWavePhase: { value: index * Math.PI * 0.5 },
                uWaveAmplitude: { value: 0.04 },
                uIntensity: { value: 1.0 }
            },
            vertexShader: TENDRIL_VERTEX_SHADER,
            fragmentShader: TENDRIL_FRAGMENT_SHADER,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = `EnergyTendril_${index}`;
        mesh.userData.isTendril = true;
        mesh.userData.tendrilIndex = index;
        
        // Position around center
        const angle = (index / this.config.tendrilCount) * Math.PI * 2;
        mesh.rotation.y = angle;
        mesh.rotation.x = -0.2 + Math.random() * 0.4;
        
        return {
            mesh,
            curve,
            index,
            targetNode: null,
            baseAngle: angle
        };
    }
    
    // ========================================================================
    // DIMENSIONAL RIFT CREATION
    // ========================================================================
    
    createDimensionalRift() {
        const geometry = new THREE.RingGeometry(
            this.config.riftInnerRadius,
            this.config.riftOuterRadius,
            this.config.riftSegments,
            1
        );
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uHarmony: { value: 0.5 },
                uCorruption: { value: 0 },
                uOpacity: { value: this.config.riftOpacity },
                uDistortion: { value: 0.08 }
            },
            vertexShader: RIFT_VERTEX_SHADER,
            fragmentShader: RIFT_FRAGMENT_SHADER,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        
        this.rift = new THREE.Mesh(geometry, material);
        this.rift.name = 'DimensionalRift';
        this.rift.userData.isRift = true;
        this.rift.renderOrder = this.group.renderOrder - 1;
        
        // Tilt slightly for better visibility
        this.rift.rotation.x = Math.PI * 0.1;
        
        this.group.add(this.rift);
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
        const geometry = new THREE.RingGeometry(
            this.config.pulseInitialRadius,
            this.config.pulseInitialRadius + this.config.pulseRingWidth,
            32
        );
        
        const material = new THREE.MeshBasicMaterial({
            color: this.config.coreColorHarmony,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = 'ConsciousnessPulse';
        mesh.userData.isPulse = true;
        
        // Face camera initially
        mesh.lookAt(new THREE.Vector3(0, 0, 1));
        
        return {
            mesh,
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
        pulse.mesh.material.opacity = 0.5;
        
        // Update color based on current state
        const color = this.getStateColor();
        pulse.mesh.material.color.copy(color);
    }
    
    // ========================================================================
    // ACTIVATION / DEACTIVATION
    // ========================================================================
    
    activate(position, context = {}) {
        this.active = true;
        this.group.visible = true;
        
        if (position) {
            this.position.copy(position);
            this.group.position.copy(position);
        }
        
        // Set initial state
        this.harmony = context.harmony ?? 0.5;
        this.corruption = context.corruption ?? 0;
        this.synergy = context.synergy ?? 0.5;
        
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
        
        // Update LOD
        this.updateLOD(context.cameraPosition);
        
        // Update components based on LOD
        this.updateCore(deltaTime);
        
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
            const stateColor = this.getStateColor();
            this.coreGlow.material.color.copy(stateColor);
            this.coreGlow.material.opacity = 0.3 + Math.sin(pulsePhase * Math.PI * 2) * 0.15;
            this.coreGlow.rotation.copy(this.core.rotation);
            this.coreGlow.scale.setScalar(0.6 + Math.sin(pulsePhase * Math.PI * 2) * 0.1);
        }
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
        this.tendrils.forEach((tendril, index) => {
            // Update shader uniforms
            tendril.mesh.material.uniforms.uTime.value = this.time;
            tendril.mesh.material.uniforms.uColor.value.copy(this.getStateColor());
            tendril.mesh.material.uniforms.uIntensity.value = 0.6 + this.synergy * 0.4;
            
            // Animate tendril angle
            const angleOffset = Math.sin(this.time * 0.5 + index) * 0.1;
            tendril.mesh.rotation.y = tendril.baseAngle + angleOffset;
            
            // Look at target node if connected
            if (tendril.targetNode && tendril.targetNode.position) {
                const worldPos = new THREE.Vector3();
                this.group.getWorldPosition(worldPos);
                tendril.mesh.lookAt(tendril.targetNode.position);
                tendril.mesh.rotateY(Math.PI * 0.5);
            }
        });
    }
    
    updateRift(deltaTime) {
        if (!this.rift) return;
        
        this.rift.material.uniforms.uTime.value = this.time;
        this.rift.material.uniforms.uHarmony.value = this.harmony;
        this.rift.material.uniforms.uCorruption.value = this.corruption;
        
        // Slow rotation
        this.rift.rotation.z += deltaTime * this.config.riftRotationSpeed;
        
        // Pulse opacity
        const pulsePhase = (this.time * this.config.corePulseSpeed) % 1;
        this.rift.material.uniforms.uOpacity.value = this.config.riftOpacity * (0.8 + Math.sin(pulsePhase * Math.PI * 2) * 0.2);
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
            
            // Scale and fade
            const scale = 1 + pulse.progress * (this.config.pulseMaxRadius / this.config.pulseInitialRadius - 1);
            pulse.mesh.scale.setScalar(scale);
            pulse.mesh.material.opacity = 0.5 * (1 - pulse.progress * pulse.progress);
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
            });
        }
        
        if (this.rift) {
            this.rift.visible = this.lodLevel < 3;
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
            this.position.copy(x);
        } else {
            this.position.set(x, y, z);
        }
        this.group.position.copy(this.position);
    }
    
    setConnectedNodes(nodes) {
        this.connectedNodes = nodes;
        this.updateTendrilTargets();
    }
    
    // ========================================================================
    // DISPOSE
    // ========================================================================
    
    dispose() {
        // Dispose core
        if (this.core) {
            this.core.geometry.dispose();
            this.core.material.dispose();
        }
        if (this.coreGlow) {
            this.coreGlow.geometry.dispose();
            this.coreGlow.material.dispose();
        }
        
        // Dispose orbital streams
        this.orbitalStreams.forEach(stream => {
            stream.points.geometry.dispose();
            stream.points.material.dispose();
        });
        
        // Dispose tendrils
        this.tendrils.forEach(tendril => {
            tendril.mesh.geometry.dispose();
            tendril.mesh.material.dispose();
        });
        
        // Dispose rift
        if (this.rift) {
            this.rift.geometry.dispose();
            this.rift.material.dispose();
        }
        
        // Dispose pulses
        this.pulses.forEach(pulse => {
            pulse.mesh.geometry.dispose();
            pulse.mesh.material.dispose();
        });
        
        // Remove from parent
        if (this.group.parent) {
            this.group.parent.remove(this.group);
        }
        
        this.active = false;
        this.orbitalStreams = [];
        this.tendrils = [];
        this.pulses = [];
    }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createNeuralConvergenceSingularity(scene, config = {}) {
    return new NeuralConvergenceSingularity(scene, config);
}

export default NeuralConvergenceSingularity;
