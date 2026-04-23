import * as THREE from 'three';
import { ColonyBloomOverlay } from './ColonyBloomOverlay.js';
import { ATOMAColorPalette } from './Engine/Visual/ATOMAColorPalette.js';

// ═══════════════════════════════════════════════════════════════════════════════
// SUPERNATURAL UPGRADE: Bioluminescent Alien Civilization Shaders
// Transforms colony visuals from flat MeshStandardMaterial into living,
// breathing bioluminescent organisms with neural signal pathways,
// organic membrane glow, and spectral spore particles.
// ═══════════════════════════════════════════════════════════════════════════════

const BIOLUMINESCENT_NUCLEUS_VERTEX = `
  varying vec3 vNormalW;
  varying vec3 vPositionW;
  varying vec2 vUv;
  varying vec3 vModelPos;

  void main() {
    vUv = uv;
    vModelPos = position;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vPositionW = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const BIOLUMINESCENT_NUCLEUS_FRAGMENT = `
  uniform float uTime;
  uniform float uEnergy;
  uniform vec3 uBaseColor;
  uniform vec3 uNeuralColor;
  uniform vec3 uDeepColor;
  uniform vec3 uRimColor;
  uniform float uPulsePhase;
  uniform float uMotionBias;

  varying vec3 vNormalW;
  varying vec3 vPositionW;
  varying vec2 vUv;
  varying vec3 vModelPos;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float simplexNoise3D(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g, l.zxy);
    vec3 i2 = max(g, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(
      permute(
        permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  void main() {
    // Fresnel rim: bioluminescent glow strongest at edges
    vec3 viewDir = normalize(cameraPosition - vPositionW);
    float fresnel = 1.0 - max(dot(vNormalW, viewDir), 0.0);
    fresnel = pow(fresnel, 2.5);

    // Neural signal pathways: organic noise traveling across the surface
    float neuralSignal = 0.5 + 0.5 * simplexNoise3D(vModelPos * 3.5 + vec3(uTime * 0.4 * uMotionBias, uTime * 0.2, uTime * 0.3));
    float neuralVeins = smoothstep(0.28, 0.62, neuralSignal) * (1.0 - smoothstep(0.62, 0.88, neuralSignal));

    // Secondary neural layer: slower, wider pulses
    float deepSignal = 0.5 + 0.5 * simplexNoise3D(vModelPos * 1.8 + vec3(0.0, uTime * 0.15, uTime * 0.1));
    float deepVeins = smoothstep(0.22, 0.56, deepSignal) * (1.0 - smoothstep(0.56, 0.82, deepSignal));

    // Bioluminescent pulse: rhythmic glow like a heartbeat
    float heartbeat = sin(uTime * 1.8 + uPulsePhase) * 0.5 + 0.5;
    float slowPulse = sin(uTime * 0.6 + uPulsePhase * 0.5) * 0.5 + 0.5;

    // Base color with energy-driven intensity
    vec3 baseCol = uBaseColor * (0.5 + uEnergy * 0.5);

    // Neural vein color: spectral shift based on signal position
    vec3 neuralColor = mix(uBaseColor, uNeuralColor, clamp(neuralSignal * (0.7 + uEnergy * 0.2), 0.0, 1.0));

    // Deep vein color: cooler, more ethereal
    vec3 deepColor = mix(uBaseColor, uDeepColor, clamp(deepSignal * (0.6 + uEnergy * 0.25), 0.0, 1.0));

    // Fresnel rim glow: spectral bioluminescent edge
    vec3 rimColor = mix(uBaseColor, uRimColor, clamp(fresnel, 0.0, 1.0)) * fresnel * (0.8 + uEnergy * 0.4);

    // Combine layers
    vec3 finalColor = baseCol;
    finalColor += neuralColor * neuralVeins * (0.5 + heartbeat * 0.3) * uEnergy;
    finalColor += deepColor * deepVeins * 0.3 * slowPulse;
    finalColor += rimColor;

    // Organic subsurface scattering approximation
    float sss = pow(max(dot(-viewDir, vNormalW), 0.0), 1.5) * 0.15;
    finalColor += uBaseColor * sss * (1.0 + heartbeat * 0.5);

    float alpha = 0.72 + uEnergy * 0.15 + fresnel * 0.1;
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

const BIOLUMINESCENT_MEMBRANE_FRAGMENT = `
  uniform float uTime;
  uniform float uEnergy;
  uniform vec3 uBaseColor;
  uniform vec3 uEdgeGlowColor;
  uniform float uPulsePhase;
  uniform float uMotionBias;

  varying vec3 vNormalW;
  varying vec3 vPositionW;
  varying vec2 vUv;
  varying vec3 vModelPos;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float simplexNoise3D(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g, l.zxy);
    vec3 i2 = max(g, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(
      permute(
        permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  void main() {
    // Fresnel for translucent membrane
    vec3 viewDir = normalize(cameraPosition - vPositionW);
    float fresnel = 1.0 - max(dot(vNormalW, viewDir), 0.0);
    fresnel = pow(fresnel, 1.8);

    // Organic membrane texture: flowing cellular patterns
    float membrane = 0.5 + 0.5 * simplexNoise3D(vModelPos * 4.0 + vec3(uTime * 0.2 * uMotionBias, uTime * 0.15, 0.0));
    float cellPattern = smoothstep(0.28, 0.58, membrane) * (1.0 - smoothstep(0.58, 0.86, membrane));

    // Bioluminescent pulse through membrane
    float pulse = sin(uTime * 1.2 + uPulsePhase + length(vModelPos) * 3.0) * 0.5 + 0.5;

    // Membrane color: translucent with bioluminescent veins
    vec3 membraneColor = uBaseColor * 0.4;
    membraneColor += uBaseColor * cellPattern * (0.3 + pulse * 0.2) * uEnergy;
    membraneColor += uBaseColor * fresnel * (0.5 + uEnergy * 0.3);

    // Spectral edge glow
    vec3 edgeGlow = mix(
      uBaseColor,
      uEdgeGlowColor,
      fresnel * 0.4
    ) * fresnel * (0.6 + pulse * 0.3);

    membraneColor += edgeGlow;

    float alpha = (0.18 + uEnergy * 0.08) * (1.0 + fresnel * 0.5 + cellPattern * 0.3);
    gl_FragColor = vec4(membraneColor, alpha);
  }
`;

const BIOLUMINESCENT_GLOW_FRAGMENT = `
  uniform float uTime;
  uniform float uEnergy;
  uniform vec3 uBaseColor;
  uniform vec3 uAuraColor;
  uniform float uPulsePhase;

  varying vec3 vNormalW;
  varying vec3 vPositionW;
  varying vec3 vModelPos;

  void main() {
    // BackSide glow: volumetric bioluminescent aura
    vec3 viewDir = normalize(cameraPosition - vPositionW);
    float fresnel = max(dot(vNormalW, viewDir), 0.0); // Inverted for BackSide
    fresnel = pow(fresnel, 1.2);

    // Pulsing bioluminescent intensity
    float pulse = sin(uTime * 1.5 + uPulsePhase) * 0.5 + 0.5;
    float slowBreath = sin(uTime * 0.4 + uPulsePhase * 0.3) * 0.5 + 0.5;

    // Depth-based volumetric glow
    float depth = length(vModelPos);
    float volumetric = exp(-depth * 2.0) * (0.5 + pulse * 0.3);

    vec3 glowColor = mix(uBaseColor, uAuraColor, 0.35) * (0.3 + uEnergy * 0.4);
    glowColor += uBaseColor * fresnel * (0.4 + pulse * 0.2);
    glowColor += uAuraColor * volumetric * slowBreath;

    float alpha = (0.15 + uEnergy * 0.1) * (fresnel * 0.6 + volumetric * 0.4);
    gl_FragColor = vec4(glowColor, alpha);
  }
`;

/**
 * ColonyVFXManager.js - Safe Living Civilization Visual Effects System
 *
 * SAFE: 100% non-destructive VFX overlays
 * - Creates growth shells, signal orbitals, conscious cores, and status crowns
 * - All meshes stored in scene but completely separate from nodes
 * - Can be removed without affecting core systems
 *
 * SUPERNATURAL UPGRADE: Bioluminescent Alien Civilization
 * - Custom GLSL shaders for organic nucleus, membrane, and glow
 * - Neural signal pathways with noise-based organic patterns
 * - Spectral bioluminescent rim lighting
 * - Master switch: enableBioluminescentUpgrade (default: true)
 */

export class ColonyVFXManager {
  constructor(scene, environmentRoot) {
    this.scene = scene;
    this.root = environmentRoot || scene;
    
    // Container for all civilization VFX (for easy cleanup)
    this.vfxContainer = new THREE.Group();
    this.vfxContainer.name = 'living-civilization-vfx-container';
    this.root.add(this.vfxContainer);
    
    // Texture for particles
    this.particleTexture = this.createParticleTexture();

    // ATOMA Core Palette — Single Source of Truth
    this.palette = ATOMAColorPalette.ATOMA_CORE;

    // Configuration
    this.config = {
      colors: {
        HARMONY: ATOMAColorPalette.getMoodColor('HARMONY'),
        STABILITY: ATOMAColorPalette.getMoodColor('STABILITY'),
        CORRUPTION: ATOMAColorPalette.getMoodColor('CORRUPTION'),
        SYNERGY: ATOMAColorPalette.getMoodColor('SYNERGY'),
        LOAD_PRESSURE: ATOMAColorPalette.getMoodColor('LOAD_PRESSURE'),

        DEFAULT: ATOMAColorPalette.getMoodColor('DEFAULT'),
        QUANTUM: ATOMAColorPalette.getMoodColor('QUANTUM'),
        SIGMA: ATOMAColorPalette.getMoodColor('SIGMA'),
        LEGENDARY: ATOMAColorPalette.getMoodColor('LEGENDARY')
      },
      
      atmosphere: {
        radiusScale: 0.8,
        opacity: 0.6,
        segments: 32
      },
      
      rings: {
        radiusStep: 0.5,
        maxRings: 6,
        opacity: 0.4
      },
      
      moodProfiles: {
        HARMONY: {
          colorBias: 0x5b77a4,
          motionBias: 0.22,
          particleDensity: 0.95,
          ringThickness: 0.7,
          atmosphereOpacity: 0.12,
          corePulse: 0.85,
          glowIntensity: 0.88
        },
        STABILITY: {
          colorBias: 0x8897b0,
          motionBias: 0.18,
          particleDensity: 0.8,
          ringThickness: 1.0,
          atmosphereOpacity: 0.08,
          corePulse: 0.75,
          glowIntensity: 0.82
        },
        CORRUPTION: {
          colorBias: 0x5f4b91,
          motionBias: 1.1,
          particleDensity: 0.55,
          ringThickness: 0.6,
          atmosphereOpacity: 0.05,
          corePulse: 1.3,
          glowIntensity: 1.2
        },
        SYNERGY: {
          colorBias: 0x8d7a57,
          motionBias: 1.3,
          particleDensity: 1.4,
          ringThickness: 1.3,
          atmosphereOpacity: 0.15,
          corePulse: 1.4,
          glowIntensity: 1.1
        },
        LOAD_PRESSURE: {
          colorBias: 0x7e6573,
          motionBias: 0.6,
          particleDensity: 1.05,
          ringThickness: 1.45,
          atmosphereOpacity: 0.14,
          corePulse: 1.0,
          glowIntensity: 0.95
        }
      },
      moodVisualBiasMap: null,
      
      particles: {
        count: 50,
        maxPerColony: 100,
        speed: 1.0,
        lifetime: 3.0
      },
      
      pulse: {
        minFrequency: 1.0,
        maxFrequency: 4.0,
        minIntensity: 0.5,
        maxIntensity: 2.0
      },

      // SUPERNATURAL UPGRADE: Bioluminescent Alien Civilization
      enableBioluminescentUpgrade: true,
      bioluminescentNeuralSpeed: 0.4,
      bioluminescentPulseRate: 1.8,
      bioluminescentFresnelPower: 2.5
    };

    this.config.moodVisualBiasMap = this.config.moodProfiles;

    this.objectPools = {
      atmosphere: [],
      'orbit-ring': [],
      particle: [],
      core: [],
      'central-glow': [],
      'legendary-crown': [],
      'sigil-ring': [],
      'ascension-beam': [],
      'mood-canopy': [],
      'legendary-halo': [],
      'legendary-presence': [],
      'colony-label': [],
      'colony-plaque': []
    };

    this.transitioningVFX = new Set();

    // ═══════════════════════════════════════════════════════════════════════
    // PERFORMANCE: Material + Geometry deduplication caches
    // ═══════════════════════════════════════════════════════════════════════
    // Instead of creating N×M unique materials/geometries (one per colony per
    // mesh type), we cache by quantised key.  A typical 10-colony scene drops
    // from ~150 unique materials to ~15-25 and ~120 unique geometries to ~20.
    this._materialCache = new Map();
    this._geometryCache = new Map();

    // ═══════════════════════════════════════════════════════════════════════
    // PERFORMANCE: Shared particle cloud — one draw call for all colonies
    // ═══════════════════════════════════════════════════════════════════════
    this._particleCapacity = 4096;
    this._particleCloud = null;
    this._particleCloudGeometry = null;
    this._particleCloudMaterial = null;
    this._particlePositionAttribute = null;
    this._particleColorAttribute = null;
    this._particleSizeAttribute = null;
    this._particlePositions = new Float32Array(this._particleCapacity * 3);
    this._particleColors = new Float32Array(this._particleCapacity * 4);
    this._particleSizes = new Float32Array(this._particleCapacity);
    this._particleSlots = new Array(this._particleCapacity).fill(null);
    this._particleColonySlots = new Map();
    this._particleActiveCount = 0;
    this._particleTempColor = new THREE.Color();
    this._particleTempVector = new THREE.Vector3();

    // ═══════════════════════════════════════════════════════════════════════
    // PERFORMANCE: InstancedMesh atmosphere pool
    // ═══════════════════════════════════════════════════════════════════════
    // All colony atmospheres share one canonical TorusGeometry and one
    // InstancedMesh → 1 draw call instead of N.
    this._atmoInstanceMesh = null;
    this._atmoInstanceCount = 0;
    this._atmoColonyIndex = new Map();   // colonyId → instance index
    this._atmoFreeIndices = [];           // recycled indices
    this._atmoMaxInstances = 24;          // upper bound on colonies
    this._atmoDirty = false;
    this._atmoTempMatrix = new THREE.Matrix4();
    this._atmoTempColor = new THREE.Color();

    // ═══════════════════════════════════════════════════════════════════════
    // BLOOM OVERLAY: Sprite-based fake bloom for bioluminescent colony cores
    // Adds volumetric glow quads that track colony cores and central glows.
    // Non-destructive, additive-only, shared geometry, ≤1ms for 24 colonies.
    // ═══════════════════════════════════════════════════════════════════════
    this.bloomOverlay = new ColonyBloomOverlay(this.scene, this.vfxContainer);
  }
  
  /**
   * Create particle texture
   */
  createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(255,255,255,0)';
    ctx.fillRect(0, 0, 64, 64);

    // SUPERNATURAL UPGRADE: Bioluminescent spore texture
    // Radial glow with organic ring pattern
    if (this.config?.enableBioluminescentUpgrade !== false) {
      // Outer glow ring
      const outerGrad = ctx.createRadialGradient(32, 32, 8, 32, 32, 30);
      outerGrad.addColorStop(0, 'rgba(180, 200, 255, 0.9)');
      outerGrad.addColorStop(0.3, 'rgba(100, 150, 255, 0.6)');
      outerGrad.addColorStop(0.6, 'rgba(60, 100, 200, 0.25)');
      outerGrad.addColorStop(1, 'rgba(20, 40, 100, 0)');
      ctx.fillStyle = outerGrad;
      ctx.beginPath();
      ctx.arc(32, 32, 30, 0, Math.PI * 2);
      ctx.fill();

      // Inner bioluminescent core
      const innerGrad = ctx.createRadialGradient(32, 32, 0, 32, 32, 14);
      innerGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      innerGrad.addColorStop(0.4, 'rgba(200, 220, 255, 0.8)');
      innerGrad.addColorStop(0.7, 'rgba(120, 160, 255, 0.4)');
      innerGrad.addColorStop(1, 'rgba(60, 100, 200, 0)');
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.arc(32, 32, 14, 0, Math.PI * 2);
      ctx.fill();

      // Organic ring detail
      ctx.strokeStyle = 'rgba(150, 180, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(32, 32, 18, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Legacy: plain soft circle
      ctx.fillStyle = 'rgba(255,255,255,1)';
      ctx.beginPath();
      ctx.arc(32, 32, 24, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.filter = 'blur(8px)';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(32, 32, 20, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  getColonyVisualSeeds(colonyId) {
    const idValue = Number(String(colonyId).replace(/[^0-9]/g, '')) || 0;
    const seed = ((idValue * 0.61803398875) % 1 + 1) % 1;
    return {
      phaseSeed: seed,
      pulseOffset: ((seed + 0.27) % 1),
      ringSpeedBias: 0.08 + ((idValue % 5) * 0.04),
      particleBias: 0.82 + ((idValue % 4) * 0.05),
      haloPressure: 0.05 + ((idValue % 4) * 0.02)
    };
  }

  createBasicMaterial(color, opacity = 1.0, side) {
    const config = {
      color,
      transparent: true,
      opacity,
      fog: false
    };
    if (side !== undefined) {
      config.side = side;
    }
    return new THREE.MeshBasicMaterial(config);
  }

  // ─────────────────────────────────────────────────────────────────────
  // PERFORMANCE: Cached material lookup — deduplicates across colonies
  // ─────────────────────────────────────────────────────────────────────
  getCachedMaterial(color, opacity = 1.0, side) {
    // Quantise opacity to 0.05 steps — visual difference is negligible
    const qOpacity = Math.round(opacity * 20) / 20;
    const key = `${color}_${qOpacity}${side === THREE.DoubleSide ? '_ds' : ''}`;
    let mat = this._materialCache.get(key);
    if (!mat) {
      mat = this.createBasicMaterial(color, qOpacity, side);
      mat._cached = true;
      this._materialCache.set(key, mat);
    }
    return mat;
  }

  // ─────────────────────────────────────────────────────────────────────
  // PERFORMANCE: Cached geometry lookup — deduplicates across colonies
  // ─────────────────────────────────────────────────────────────────────
  getCachedGeometry(key, factory) {
    let geo = this._geometryCache.get(key);
    if (!geo) {
      geo = factory();
      this._geometryCache.set(key, geo);
    }
    return geo;
  }

  _clearMoodCanopyPanels(canopy) {
    if (!canopy || !Array.isArray(canopy.children) || canopy.children.length === 0) return;

    for (let i = canopy.children.length - 1; i >= 0; i--) {
      const panel = canopy.children[i];
      canopy.remove(panel);

      if (panel.geometry && !panel.geometry._cached) {
        panel.geometry.dispose();
      }

      if (panel.material) {
        if (Array.isArray(panel.material)) {
          panel.material.forEach((material) => {
            if (material && !material._cached) material.dispose();
          });
        } else if (!panel.material._cached) {
          panel.material.dispose();
        }
      }
    }
  }

  _createMoodCanopyPanelGeometry(shape, variant = 0) {
    const silhouette = new THREE.Shape();
    const wobble = variant % 2 === 0 ? -0.04 : 0.04;

    switch (shape) {
      case 'lotus':
        silhouette.moveTo(0, -0.64);
        silhouette.quadraticCurveTo(-0.26 + wobble, -0.44, -0.36 + wobble, -0.04);
        silhouette.quadraticCurveTo(-0.48 + wobble, 0.34, -0.18 + wobble * 0.5, 0.64);
        silhouette.quadraticCurveTo(-0.06 + wobble * 0.25, 0.86, 0, 0.98);
        silhouette.quadraticCurveTo(0.06 - wobble * 0.25, 0.86, 0.18 - wobble * 0.5, 0.64);
        silhouette.quadraticCurveTo(0.48 - wobble, 0.34, 0.36 - wobble, -0.04);
        silhouette.quadraticCurveTo(0.26 - wobble, -0.44, 0, -0.64);
        break;
      case 'buttress':
        silhouette.moveTo(0, -0.68);
        silhouette.quadraticCurveTo(-0.34 + wobble * 0.5, -0.54, -0.44 + wobble, -0.08);
        silhouette.quadraticCurveTo(-0.46 + wobble, 0.24, -0.22 + wobble * 0.4, 0.58);
        silhouette.quadraticCurveTo(-0.1 + wobble * 0.2, 0.82, 0, 0.92);
        silhouette.quadraticCurveTo(0.1 - wobble * 0.2, 0.82, 0.22 - wobble * 0.4, 0.58);
        silhouette.quadraticCurveTo(0.46 - wobble, 0.24, 0.44 - wobble, -0.08);
        silhouette.quadraticCurveTo(0.34 - wobble * 0.5, -0.54, 0, -0.68);
        break;
      case 'thorn':
        silhouette.moveTo(0, -0.78);
        silhouette.lineTo(-0.16 + wobble * 0.3, -0.18);
        silhouette.lineTo(-0.32 + wobble * 0.2, 0.1);
        silhouette.lineTo(-0.08 + wobble * 0.1, 0.64);
        silhouette.lineTo(0, 1.0);
        silhouette.lineTo(0.08 - wobble * 0.1, 0.64);
        silhouette.lineTo(0.32 - wobble * 0.2, 0.1);
        silhouette.lineTo(0.16 - wobble * 0.3, -0.18);
        break;
      case 'braid':
        silhouette.moveTo(0, -0.58);
        silhouette.quadraticCurveTo(-0.4 + wobble, -0.38, -0.48 + wobble, -0.04);
        silhouette.quadraticCurveTo(-0.34 + wobble * 0.7, 0.12, -0.18 + wobble * 0.4, 0.18);
        silhouette.quadraticCurveTo(-0.26 + wobble * 0.4, 0.48, -0.06, 0.74);
        silhouette.quadraticCurveTo(0, 0.86, 0.06, 0.74);
        silhouette.quadraticCurveTo(0.26 - wobble * 0.4, 0.48, 0.18 - wobble * 0.4, 0.18);
        silhouette.quadraticCurveTo(0.34 - wobble * 0.7, 0.12, 0.48 - wobble, -0.04);
        silhouette.quadraticCurveTo(0.4 - wobble, -0.38, 0, -0.58);
        break;
      case 'shroud':
        silhouette.moveTo(0, -0.52);
        silhouette.quadraticCurveTo(-0.42 + wobble, -0.28, -0.52 + wobble, 0.08);
        silhouette.quadraticCurveTo(-0.44 + wobble * 0.6, 0.42, -0.2 + wobble * 0.2, 0.68);
        silhouette.quadraticCurveTo(-0.08, 0.88, 0, 0.96);
        silhouette.quadraticCurveTo(0.08, 0.88, 0.2 - wobble * 0.2, 0.68);
        silhouette.quadraticCurveTo(0.44 - wobble * 0.6, 0.42, 0.52 - wobble, 0.08);
        silhouette.quadraticCurveTo(0.42 - wobble, -0.28, 0, -0.52);
        break;
      default:
        silhouette.moveTo(0, -0.6);
        silhouette.quadraticCurveTo(-0.28 + wobble, -0.36, -0.36 + wobble, 0);
        silhouette.quadraticCurveTo(-0.42 + wobble * 0.5, 0.36, -0.16 + wobble * 0.3, 0.66);
        silhouette.quadraticCurveTo(-0.06, 0.86, 0, 0.96);
        silhouette.quadraticCurveTo(0.06, 0.86, 0.16 - wobble * 0.3, 0.66);
        silhouette.quadraticCurveTo(0.42 - wobble * 0.5, 0.36, 0.36 - wobble, 0);
        silhouette.quadraticCurveTo(0.28 - wobble, -0.36, 0, -0.6);
        break;
    }

    silhouette.closePath();
    const geometry = new THREE.ShapeGeometry(silhouette, 6);
    geometry.computeBoundingSphere();
    return geometry;
  }

  _createColonyLabelPlaqueGeometry() {
    const plaque = new THREE.Shape();
    plaque.moveTo(0, 1.12);
    plaque.quadraticCurveTo(0.18, 1.16, 0.34, 1.02);
    plaque.quadraticCurveTo(0.54, 0.82, 0.58, 0.54);
    plaque.quadraticCurveTo(0.68, 0.08, 0.48, -0.42);
    plaque.quadraticCurveTo(0.28, -0.84, 0, -1.04);
    plaque.quadraticCurveTo(-0.28, -0.84, -0.48, -0.42);
    plaque.quadraticCurveTo(-0.68, 0.08, -0.58, 0.54);
    plaque.quadraticCurveTo(-0.54, 0.82, -0.34, 1.02);
    plaque.quadraticCurveTo(-0.18, 1.16, 0, 1.12);

    const geometry = new THREE.ShapeGeometry(plaque, 8);
    geometry.computeBoundingSphere();
    return geometry;
  }

  _renderColonyLabelCanvas(canvas, lines, color = 0xdbe2ee) {
    if (!canvas) return null;

    const width = 320;
    const height = 176;
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const accent = new THREE.Color(color);
    const accentMuted = accent.clone().lerp(new THREE.Color(0xdbe2ee), 0.22);
    const accentHex = `#${accentMuted.getHexString()}`;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(7, 10, 16, 0.18)';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const shieldFill = ctx.createLinearGradient(0, 18, 0, height - 18);
    shieldFill.addColorStop(0, 'rgba(22, 30, 44, 0.96)');
    shieldFill.addColorStop(0.55, 'rgba(13, 18, 28, 0.98)');
    shieldFill.addColorStop(1, 'rgba(8, 12, 18, 0.96)');
    ctx.fillStyle = shieldFill;
    ctx.fillRect(18, 12, width - 36, height - 24);

    ctx.strokeStyle = 'rgba(219, 226, 238, 0.14)';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(18, 12, width - 36, height - 24);

    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(92, 30);
    ctx.lineTo(160, 18);
    ctx.lineTo(228, 30);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(219, 226, 238, 0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(160, 24);
    ctx.lineTo(160, 148);
    ctx.stroke();

    ctx.fillStyle = accentHex;
    ctx.beginPath();
    ctx.arc(160, 58, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(6, 9, 14, 0.68)';
    ctx.fillRect(52, 74, 216, 74);
    ctx.strokeStyle = 'rgba(219, 226, 238, 0.16)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(52, 74, 216, 74);

    ctx.font = 'bold 18px Courier New';
    ctx.fillStyle = '#dbe2ee';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const margin = 68;
    const lineHeight = 22;
    const maxLines = Math.min(Array.isArray(lines) ? lines.length : 0, 4);
    for (let i = 0; i < maxLines; i++) {
      const y = 84 + i * lineHeight;
      ctx.fillStyle = accentHex;
      ctx.fillRect(62, y + 9, 8, 2);
      ctx.fillStyle = '#dbe2ee';
      ctx.fillText(lines[i], margin, y);
    }

    ctx.strokeStyle = 'rgba(219, 226, 238, 0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(106, 146);
    ctx.lineTo(160, 156);
    ctx.lineTo(214, 146);
    ctx.stroke();

    ctx.restore();
    return ctx;
  }

  // ─────────────────────────────────────────────────────────────────────
  // PERFORMANCE: InstancedMesh atmosphere — 1 draw call for all colonies
  // ─────────────────────────────────────────────────────────────────────
  _ensureAtmoInstancedMesh() {
    if (this._atmoInstanceMesh) return;
    const geo = new THREE.TorusGeometry(1, 0.2, 16, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      fog: false
    });
    this._atmoInstanceMesh = new THREE.InstancedMesh(geo, mat, this._atmoMaxInstances);
    this._atmoInstanceMesh.count = 0;
    this._atmoInstanceMesh.frustumCulled = false;
    this._atmoInstanceMesh.name = 'ColonyAtmosphereInstanced';
    this.vfxContainer.add(this._atmoInstanceMesh);
  }

  _allocAtmoIndex(colonyId) {
    let idx = this._atmoFreeIndices.pop();
    if (idx === undefined) {
      idx = this._atmoInstanceCount++;
    }
    this._atmoColonyIndex.set(colonyId, idx);
    this._atmoInstanceMesh.count = Math.max(this._atmoInstanceMesh.count, idx + 1);
    return idx;
  }

  _freeAtmoIndex(colonyId) {
    const idx = this._atmoColonyIndex.get(colonyId);
    if (idx === undefined) return;
    this._atmoColonyIndex.delete(colonyId);
    this._atmoFreeIndices.push(idx);
    // Zero out the freed instance
    this._atmoTempMatrix.makeScale(0, 0, 0);
    this._atmoInstanceMesh.setMatrixAt(idx, this._atmoTempMatrix);
    this._atmoDirty = true;
  }

  createOrganicCoreGeometry(radius, detail = 2, displacement = 0.18, seed = 0) {
    const geometry = new THREE.IcosahedronGeometry(radius, detail);
    const position = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < position.count; i++) {
      vertex.fromBufferAttribute(position, i);
      const noise = (
        Math.sin(vertex.x * 12.17 + vertex.y * 7.39 + vertex.z * 4.11 + seed * 31.7) * 0.5 + 0.5
      ) * 0.45 + (
        Math.cos(vertex.x * 5.31 + vertex.y * 9.73 + vertex.z * 2.66 + seed * 17.3) * 0.5 + 0.5
      ) * 0.25;
      const offset = 1 + noise * displacement;
      vertex.normalize().multiplyScalar(radius * offset);
      position.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geometry.computeVertexNormals();
    return geometry;
  }

  getMoodCanopySpec(mood, colonyType, stage, energy = 0) {
    const effectiveMood = mood === 'CALM' ? 'HARMONY' : mood;
    const energyFactor = Math.min(1, energy / 100);
    const specs = {
      HARMONY: {
        panelCount: 5,
        radiusMul: 1.12,
        height: 0.42,
        sway: 0.22,
        spin: 0.1,
        panelScale: 1.0,
        opacity: 0.22,
        shape: 'lotus'
      },
      STABILITY: {
        panelCount: 4,
        radiusMul: 1.02,
        height: 0.5,
        sway: 0.12,
        spin: 0.06,
        panelScale: 0.92,
        opacity: 0.18,
        shape: 'buttress'
      },
      CORRUPTION: {
        panelCount: 6,
        radiusMul: 0.94,
        height: 0.38,
        sway: 0.38,
        spin: 0.2,
        panelScale: 0.86,
        opacity: 0.2,
        shape: 'thorn'
      },
      SYNERGY: {
        panelCount: 7,
        radiusMul: 1.18,
        height: 0.46,
        sway: 0.3,
        spin: 0.16,
        panelScale: 1.08,
        opacity: 0.24,
        shape: 'braid'
      },
      LOAD_PRESSURE: {
        panelCount: 5,
        radiusMul: 0.98,
        height: 0.32,
        sway: 0.26,
        spin: 0.14,
        panelScale: 0.9,
        opacity: 0.2,
        shape: 'shroud'
      }
    };

    const baseSpec = specs[effectiveMood] || specs.HARMONY;
    const spec = {
      ...baseSpec,
      panelCount: Math.min(8, baseSpec.panelCount + Math.floor(Math.max(0, stage - 2) * 0.5) + (colonyType === 'LEGENDARY' ? 1 : 0)),
      radiusMul: baseSpec.radiusMul + energyFactor * 0.08 + (colonyType === 'LEGENDARY' ? 0.08 : 0),
      height: baseSpec.height + energyFactor * 0.08,
      opacity: Math.min(0.32, baseSpec.opacity + energyFactor * 0.05),
      panelScale: baseSpec.panelScale + energyFactor * 0.08
    };

    if (colonyType === 'QUANTUM') {
      spec.shape = 'braid';
      spec.spin += 0.08;
      spec.sway += 0.06;
    } else if (colonyType === 'SIGMA') {
      spec.shape = 'thorn';
      spec.sway += 0.08;
      spec.opacity += 0.03;
    }

    return spec;
  }

  acquireVFXObject(type) {
    const pool = this.objectPools[type];
    if (pool && pool.length > 0) {
      const object = pool.pop();
      object.visible = true;
      return object;
    }
    return null;
  }

  releaseVFXObject(object) {
    if (!object) return;

    // PERFORMANCE: Handle instanced atmosphere proxy release
    if (object.isInstancedAtmosphere) {
      this._freeAtmoIndex(object.colonyId);
      return;
    }

    if (object.userData?.type === 'particle') {
      this._releaseParticleHandle(object);
      return;
    }

    if (!object.userData) return;
    const type = object.userData.type;
    const pool = this.objectPools[type];

    this.resetVFXObject(object);
    if (type === 'mood-canopy') {
      this._clearMoodCanopyPanels(object);
    }
    if (object.parent) {
      object.parent.remove(object);
    }

    if (pool) {
      object.visible = false;
      pool.push(object);
      return;
    }

    if (object.geometry && !object.geometry._cached) object.geometry.dispose();
    if (object.material && !object.material._cached) {
      if (Array.isArray(object.material)) {
        object.material.forEach(m => { if (!m._cached) m.dispose(); });
      } else {
        object.material.dispose();
      }
    }
  }

  resetVFXObject(object) {
    if (!object || !object.userData) return;
    delete object.userData.eventPulse;
    delete object.userData.eventColorShift;
    delete object.userData.eventGlow;
    delete object.userData.eventCrown;
    delete object.userData.eventDeform;
    delete object.userData.transition;
    delete object.userData.fadeOut;

    if (object.material && object.material.opacity !== undefined) {
      object.material.opacity = Math.max(0, object.material.opacity);
    }

    if (object.scale) {
      object.scale.set(1, 1, 1);
    }
  }

  /**
   * Create atmosphere layer for a living civilization.
   *
   * PERFORMANCE: Uses InstancedMesh — all colony atmospheres share one
   * canonical TorusGeometry (radius=1, tube=0.2) and one draw call.
   * Per-colony radius/tube/position/rotation are encoded in the instance
   * matrix; per-colony color via setColorAt().
   */
  createAtmosphere(colonyId, center, stage, mood, colonyType, energy) {
    const moodProfile = this.getMoodProfile(mood);
    const seeds = this.getColonyVisualSeeds(colonyId);
    const baseColor = this.getColorForMood(mood, colonyType);
    const color = this.blendColor(baseColor, moodProfile.colorBias, 0.45);
    const energyFactor = Math.min(1, energy / 100);
    const radius = this.getRadiusForStage(stage) + energyFactor * 0.35 + (moodProfile.ringThickness || 0) * 0.04;
    const tubeScale = 0.18 + stage * 0.02 + (colonyType === 'LEGENDARY' ? 0.3 : 0) * 0.04;
    const opacity = Math.min(1, this.config.atmosphere.opacity + energyFactor * 0.18 + (moodProfile.atmosphereOpacity || 0) + seeds.haloPressure + (colonyType === 'LEGENDARY' ? 0.3 : 0) * 0.15);
    const motionBias = moodProfile.motionBias;
    const pulseAmplitude = 0.18 + energyFactor * 0.18 + motionBias * 0.28 + seeds.pulseOffset * 0.08;

    // Ensure InstancedMesh is created
    this._ensureAtmoInstancedMesh();

    // Allocate or reuse an instance index for this colony
    let idx = this._atmoColonyIndex.get(colonyId);
    if (idx === undefined) {
      idx = this._allocAtmoIndex(colonyId);
    }

    // Build instance matrix: position + rotation + scale
    // Canonical torus has radius=1, tube=0.2. We scale to match desired radius/tube.
    const sx = radius;
    const sy = radius;
    const sz = 0.28 * radius; // flattened
    this._atmoTempMatrix.makeRotationX(Math.random() * 0.2);
    this._atmoTempMatrix.premultiply(
      new THREE.Matrix4().makeScale(sx, sy, sz)
    );
    // Set position
    this._atmoTempMatrix.setPosition(center.x, center.y, center.z);
    // Actually, compose is cleaner:
    const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * 0.2, 0, 0));
    this._atmoTempMatrix.compose(
      center,
      quat,
      new THREE.Vector3(sx, sy, sz)
    );
    this._atmoInstanceMesh.setMatrixAt(idx, this._atmoTempMatrix);

    // Per-instance color (encode opacity into brightness for visual approximation)
    this._atmoTempColor.setHex(color);
    this._atmoTempColor.multiplyScalar(opacity);
    this._atmoInstanceMesh.setColorAt(idx, this._atmoTempColor);

    this._atmoDirty = true;

    // Return a lightweight proxy object that the VFX bundle can reference.
    // This preserves the existing VFX bundle interface without a full refactor.
    const atmosphere = {
      isInstancedAtmosphere: true,
      colonyId,
      position: center.clone(),
      userData: {
        colonyId,
        type: 'atmosphere',
        baseMood: mood,
        baseColor: color,
        pulseAmplitude,
        energyFactor,
        motionBias,
        legendaryHalo: colonyType === 'LEGENDARY',
        instanceIndex: idx,
        radius,
        tubeScale,
        opacity
      },
      // Stub interface for compatibility with updateVFXForColony
      material: { color: new THREE.Color(color), opacity },
      scale: new THREE.Vector3(sx, sy, sz),
      visible: true
    };

    return atmosphere;
  }

  /**
   * Create signal orbitals around the civilization center
   */
  createOrbitRings(colonyId, center, stage, mood, colonyType, energy) {
    const rings = [];
    const profile = this.getMoodProfile(mood);
    const effectiveStage = Math.max(1, stage);
    const baseColor = this.getColorForMood(mood, colonyType);
    const color = this.blendColor(baseColor, profile.colorBias, 0.3);
    const energyFactor = Math.min(1, energy / 100);
    const stageRingCounts = [0, 1, 2, 4, this.config.rings.maxRings];
    const baseRingCount = stageRingCounts[Math.min(Math.max(stage, 0), 4)] || 1;
    const ringCount = Math.min(this.config.rings.maxRings, baseRingCount + Math.floor(energyFactor * 1.2));
    const ringTube = 0.08 + profile.ringThickness * 0.05;
    const seeds = this.getColonyVisualSeeds(colonyId);
    
    for (let i = 0; i < ringCount; i++) {
      const radius = (i + 1) * this.config.rings.radiusStep * (1 + effectiveStage * 0.1);
      const ringAlpha = this.config.rings.opacity * (1 - i / Math.max(1, ringCount));
      
      const geoKey = `torus_${radius.toFixed(1)}_${(ringTube + energyFactor * 0.02).toFixed(2)}`;
      const geometry = this.getCachedGeometry(geoKey, () => new THREE.TorusGeometry(radius, ringTube + energyFactor * 0.02, 16, 64));
    const material = this.getCachedMaterial(color, Math.min(1, ringAlpha + profile.motionBias * 0.06));
      let ring = this.acquireVFXObject('orbit-ring');
      if (ring) {
        if (ring.geometry) ring.geometry.dispose();
        ring.geometry = geometry;
        ring.material.color.setHex(color);
        ring.material.opacity = this.config.rings.opacity * (1 - i / Math.max(1, ringCount));
      } else {
        ring = new THREE.Mesh(geometry, material);
      }

      ring.position.copy(center);
      ring.rotation.x = (Math.PI / 2) * (i % 2);
      ring.rotation.z = (Math.PI / 4) * i;
      ring.visible = true;
      
      ring.userData = {
        colonyId: colonyId,
        type: 'orbit-ring',
        stage: stage,
        ringIndex: i,
        maxRings: ringCount,
        direction: i % 2 === 0 ? 1 : -1,
        rotationSpeed: 0.12 + stage * 0.08 + seeds.ringSpeedBias + profile.motionBias * 0.15,
        motionBias: profile.motionBias,
        seed: seeds.phaseSeed
      };
      
      this.vfxContainer.add(ring);
      rings.push(ring);
    }
    
    return rings;
  }

  createMoodCanopy(colonyId, center, stage, mood, colonyType, energy) {
    const profile = this.getMoodProfile(mood);
    const seeds = this.getColonyVisualSeeds(colonyId);
    const baseColor = this.getColorForMood(mood, colonyType);
    const color = this.blendColor(baseColor, profile.colorBias, 0.38);
    const spec = this.getMoodCanopySpec(mood, colonyType, stage, energy);
    const radius = this.getRadiusForStage(stage) * spec.radiusMul;
    const tiltBase = 0.28 + profile.motionBias * 0.08;

    let canopy = this.acquireVFXObject('mood-canopy');
    if (!canopy) {
      canopy = new THREE.Group();
      canopy.name = `colony-mood-canopy-${colonyId}`;
    } else {
      canopy.visible = true;
    }

    this._clearMoodCanopyPanels(canopy);

    const desiredPanels = spec.panelCount;
    const shapeScaleMap = {
      lotus: { x: 0.9, y: 1.08 },
      buttress: { x: 1.04, y: 0.94 },
      thorn: { x: 0.66, y: 1.24 },
      braid: { x: 1.12, y: 0.86 },
      shroud: { x: 1.16, y: 0.9 }
    };
    const shapeScale = shapeScaleMap[spec.shape] || { x: 1, y: 1 };

    while (canopy.children.length < desiredPanels) {
      const panelIndex = canopy.children.length;
      const panelGeometry = this._createMoodCanopyPanelGeometry(spec.shape, panelIndex);
      const panelMaterial = this.createBasicMaterial(color, spec.opacity, THREE.DoubleSide);
      panelMaterial.blending = THREE.AdditiveBlending;
      panelMaterial.depthWrite = false;
      const panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.userData.type = 'mood-canopy-panel';
      panel.userData.shapeVariant = panelIndex % 2;
      canopy.add(panel);
    }

    canopy.children.forEach((panel, index) => {
      const angle = (index / desiredPanels) * Math.PI * 2;
      const lift = spec.height + (index % 2 === 0 ? 0.06 : -0.02) + (spec.shape === 'shroud' ? 0.03 : 0);
      const localRadius = radius * (0.72 + (index % 3) * 0.08 + (spec.shape === 'braid' ? 0.04 : 0));

      panel.material.color.setHex(color);
      panel.material.opacity = spec.opacity;
      panel.scale.set(
        0.72 * spec.panelScale * shapeScale.x,
        1.18 * spec.panelScale * shapeScale.y,
        1
      );

      panel.position.set(
        Math.cos(angle) * localRadius,
        lift,
        Math.sin(angle) * localRadius
      );
      panel.rotation.set(-Math.PI / 2 + tiltBase, angle, 0);

      if (spec.shape === 'lotus') {
        panel.rotation.z = Math.sin(angle) * 0.22;
      } else if (spec.shape === 'buttress') {
        panel.rotation.x = -Math.PI / 2 + 0.62;
        panel.rotation.z = Math.cos(angle) * 0.08;
      } else if (spec.shape === 'thorn') {
        panel.rotation.x = -Math.PI / 2 + 0.34;
        panel.rotation.z = (index % 2 === 0 ? 1 : -1) * 0.24;
      } else if (spec.shape === 'braid') {
        panel.rotation.x = -Math.PI / 2 + 0.48;
        panel.rotation.z = Math.sin(angle * 2) * 0.18;
      } else if (spec.shape === 'shroud') {
        panel.rotation.x = -Math.PI / 2 + 0.4;
        panel.rotation.z = Math.cos(angle * 1.5) * 0.16;
      }

      panel.userData.panelIndex = index;
      panel.userData.baseAngle = angle;
      panel.userData.baseLift = lift;
      panel.userData.baseRadius = localRadius;
      panel.userData.shape = spec.shape;
    });

    canopy.position.copy(center);
    canopy.visible = true;
    canopy.userData = {
      colonyId,
      type: 'mood-canopy',
      mood,
      shape: spec.shape,
      sway: spec.sway,
      spin: spec.spin + seeds.ringSpeedBias * 0.35,
      radius,
      color,
      energyFactor: Math.min(1, energy / 100),
      motionBias: profile.motionBias,
      pulsePhase: seeds.phaseSeed * Math.PI * 2
    };

    this.vfxContainer.add(canopy);
    return canopy;
  }

  createQuantumEdge(colonyId, center, stage, mood, colonyType, energy) {
    const baseColor = this.getColorForMood(mood, colonyType);
    const color = this.blendColor(baseColor, this.palette.glowViolet, 0.35);
    const radius = this.getRadiusForStage(stage) * 1.35;
    const geometry = this.getCachedGeometry(`edge_${radius.toFixed(1)}`, () => new THREE.TorusGeometry(radius, 0.06, 16, 64));
    const material = this.getCachedMaterial(color, 0.22);
    let edge = this.acquireVFXObject('orbit-ring');
    if (edge) {
      if (edge.geometry) edge.geometry.dispose();
      edge.geometry = geometry;
      edge.material.color.setHex(color);
      edge.material.opacity = 0.22;
    } else {
      edge = new THREE.Mesh(geometry, material);
    }

    edge.position.copy(center);
    edge.rotation.x = Math.PI / 2;
    edge.visible = true;
    edge.userData = {
      colonyId,
      type: 'orbit-ring',
      ringIndex: 0,
      maxRings: 1,
      rotationSpeed: 1.0 + stage * 0.1
    };
    this.vfxContainer.add(edge);
    return edge;
  }

  createSigmaCrackAccent(colonyId, center, stage, mood, colonyType, energy) {
    const baseColor = this.getColorForMood(mood, colonyType);
    const color = this.blendColor(baseColor, this.palette.mutedRose, 0.35);
    const radius = this.getRadiusForStage(stage) * 1.2;
    const geometry = this.getCachedGeometry(`accent_${radius.toFixed(1)}`, () => new THREE.TorusGeometry(radius, 0.09, 12, 64));
    const material = this.getCachedMaterial(color, 0.28);
    let accent = this.acquireVFXObject('orbit-ring');
    if (accent) {
      if (accent.geometry) accent.geometry.dispose();
      accent.geometry = geometry;
      accent.material.color.setHex(color);
      accent.material.opacity = 0.28;
    } else {
      accent = new THREE.Mesh(geometry, material);
    }

    accent.position.copy(center);
    accent.rotation.x = Math.PI / 2;
    accent.visible = true;
    accent.userData = {
      colonyId,
      type: 'orbit-ring',
      ringIndex: 0,
      maxRings: 1,
      rotationSpeed: 1.4 + stage * 0.14
    };
    this.vfxContainer.add(accent);
    return accent;
  }

  _ensureParticleCloud() {
    if (this._particleCloud) return this._particleCloud;

    const geometry = new THREE.BufferGeometry();
    const positionAttribute = new THREE.BufferAttribute(this._particlePositions, 3);
    const colorAttribute = new THREE.BufferAttribute(this._particleColors, 4);
    const sizeAttribute = new THREE.BufferAttribute(this._particleSizes, 1);

    positionAttribute.setUsage(THREE.DynamicDrawUsage);
    colorAttribute.setUsage(THREE.DynamicDrawUsage);
    sizeAttribute.setUsage(THREE.DynamicDrawUsage);

    geometry.setAttribute('position', positionAttribute);
    geometry.setAttribute('particleColor', colorAttribute);
    geometry.setAttribute('size', sizeAttribute);
    geometry.setDrawRange(0, 0);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: this.particleTexture }
      },
      vertexShader: `
        attribute float size;
        attribute vec4 particleColor;

        varying vec4 vParticleColor;

        void main() {
          vParticleColor = particleColor;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float pointSize = size * (280.0 / max(1.0, -mvPosition.z));
          gl_PointSize = clamp(pointSize, 2.0, 64.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;

        varying vec4 vParticleColor;

        void main() {
          vec4 tex = texture2D(uMap, gl_PointCoord);
          float alpha = tex.a * vParticleColor.a;
          if (alpha < 0.02) discard;
          gl_FragColor = vec4(vParticleColor.rgb * tex.rgb, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      fog: false
    });

    const cloud = new THREE.Points(geometry, material);
    cloud.name = 'colony-particle-cloud';
    cloud.visible = true;
    cloud.frustumCulled = false;
    cloud.userData = { type: 'particle-cloud' };

    this._particleCloud = cloud;
    this._particleCloudGeometry = geometry;
    this._particleCloudMaterial = material;
    this._particlePositionAttribute = positionAttribute;
    this._particleColorAttribute = colorAttribute;
    this._particleSizeAttribute = sizeAttribute;
    this.vfxContainer.add(cloud);
    return cloud;
  }

  _particleRandomSeed(colonyId, index) {
    const idValue = Number(String(colonyId).replace(/[^0-9]/g, '')) || 0;
    return ((idValue * 0.017 + index * 0.731 + 0.19) % 1 + 1) % 1;
  }

  _registerParticleHandle(particle) {
    const colonyId = particle?.userData?.colonyId;
    if (!colonyId) return;

    if (!this._particleColonySlots.has(colonyId)) {
      this._particleColonySlots.set(colonyId, new Set());
    }

    this._particleColonySlots.get(colonyId).add(particle);
  }

  _writeParticleSlot(slotIndex, particle, time = performance.now() * 0.001) {
    if (slotIndex < 0 || slotIndex >= this._particleCapacity || !particle?.userData) return;

    const data = particle.userData;
    const positionOffset = slotIndex * 3;
    const colorOffset = slotIndex * 4;

    const startPos = data.startPos || this._particleTempVector.set(0, 0, 0);
    const seed = data.seed ?? 0;
    const orbitPhase = data.orbitPhase ?? 0;
    const orbitRadius = data.orbitRadius ?? 1;
    const radiusWobble = Math.sin(time * 0.8 + seed * 2.1) * 0.08;
    const orbitX = Math.cos(orbitPhase) * (orbitRadius + radiusWobble);
    const orbitZ = Math.sin(orbitPhase) * (orbitRadius + radiusWobble);
    const jitterY = Math.sin(time * 1.4 + orbitPhase) * 0.08;

    this._particlePositions[positionOffset] = startPos.x + orbitX + Math.sin(time * 1.7 + seed * 3.3) * 0.02;
    this._particlePositions[positionOffset + 1] = startPos.y + jitterY + Math.sin(time * 0.9 + orbitPhase) * 0.03;
    this._particlePositions[positionOffset + 2] = startPos.z + orbitZ + Math.cos(time * 1.5 + seed * 2.7) * 0.02;

    const lifetime = Math.max(0.001, data.lifetime ?? 1);
    const elapsed = Math.max(0, data.elapsed ?? 0);
    const life = Math.max(0, 1 - elapsed / lifetime);
    const fadeOut = data.fadeOut;
    let fadeMultiplier = 1;
    if (fadeOut) {
      const fadeDelay = Math.max(0, fadeOut.delay ?? 0);
      const fadeDuration = Math.max(0.001, fadeOut.duration ?? 1);
      const fadeElapsed = Math.max(0, (fadeOut.timer ?? 0) - fadeDelay);
      fadeMultiplier = Math.max(0, 1 - fadeElapsed / fadeDuration);
    }

    const tintHex = data.tintHex ?? data.baseTintHex ?? 0xffffff;
    const opacity = Math.max(0, (data.particleOpacity ?? data.baseOpacity ?? 0.55) * life * fadeMultiplier);
    const size = Math.max(0.04, data.particleSize ?? data.baseSize ?? 0.2);

    this._particleTempColor.setHex(tintHex);
    const brightness = Math.max(0.12, 0.55 + (data.particleBias ?? 0.8) * 0.45);
    this._particleColors[colorOffset] = this._particleTempColor.r * brightness;
    this._particleColors[colorOffset + 1] = this._particleTempColor.g * brightness;
    this._particleColors[colorOffset + 2] = this._particleTempColor.b * brightness;
    this._particleColors[colorOffset + 3] = opacity;
    this._particleSizes[slotIndex] = size;
  }

  _releaseParticleHandle(particle) {
    const userData = particle?.userData;
    if (!userData) return;

    const colonyId = userData.colonyId;
    if (colonyId && this._particleColonySlots.has(colonyId)) {
      const handles = this._particleColonySlots.get(colonyId);
      handles.delete(particle);
      if (handles.size === 0) {
        this._particleColonySlots.delete(colonyId);
      }
    }

    if (userData.__released) return;

    const slotIndex = userData.slotIndex;
    if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= this._particleActiveCount) {
      userData.__released = true;
      userData.slotIndex = -1;
      return;
    }

    const lastIndex = this._particleActiveCount - 1;
    const moved = this._particleSlots[lastIndex];

    if (slotIndex !== lastIndex && moved) {
      this._particleSlots[slotIndex] = moved;
      moved.userData.slotIndex = slotIndex;
      this._writeParticleSlot(slotIndex, moved);
    }

    this._particleSlots[lastIndex] = null;
    this._particlePositions[lastIndex * 3] = 0;
    this._particlePositions[lastIndex * 3 + 1] = 0;
    this._particlePositions[lastIndex * 3 + 2] = 0;
    this._particleColors[lastIndex * 4] = 0;
    this._particleColors[lastIndex * 4 + 1] = 0;
    this._particleColors[lastIndex * 4 + 2] = 0;
    this._particleColors[lastIndex * 4 + 3] = 0;
    this._particleSizes[lastIndex] = 0;
    this._particleActiveCount = Math.max(0, this._particleActiveCount - 1);

    if (this._particleCloudGeometry) {
      this._particleCloudGeometry.setDrawRange(0, this._particleActiveCount);
      this._particlePositionAttribute.needsUpdate = true;
      this._particleColorAttribute.needsUpdate = true;
      this._particleSizeAttribute.needsUpdate = true;
    }

    userData.__released = true;
    userData.slotIndex = -1;
  }

  _releaseColonyParticles(colonyId, { soft = false, duration = 0.9, delay = 0 } = {}) {
    const handles = this._particleColonySlots.get(colonyId);
    if (!handles || handles.size === 0) return;

    for (const particle of Array.from(handles)) {
      const userData = particle?.userData;
      if (!userData || userData.__released) continue;

      if (soft) {
        if (!userData.fadeOut) {
          const fadeDuration = Math.max(0.001, duration);
          userData.fadeOut = {
            timer: 0,
            duration: fadeDuration,
            delay,
            startOpacity: userData.particleOpacity ?? userData.baseOpacity ?? 1
          };
          userData.lifetime = Math.max(userData.lifetime ?? 0, (userData.elapsed ?? 0) + fadeDuration + delay + 0.05);
        }
      } else {
        this._releaseParticleHandle(particle);
      }
    }
  }

  _disposeParticleCloud() {
    this._particleColonySlots.clear();
    this._particleSlots.fill(null);
    this._particleActiveCount = 0;
    this._particlePositions.fill(0);
    this._particleColors.fill(0);
    this._particleSizes.fill(0);

    if (this._particleCloud?.parent) {
      this._particleCloud.parent.remove(this._particleCloud);
    }

    if (this._particleCloudGeometry) {
      this._particleCloudGeometry.dispose();
    }

    if (this._particleCloudMaterial) {
      this._particleCloudMaterial.dispose();
    }

    this._particleCloud = null;
    this._particleCloudGeometry = null;
    this._particleCloudMaterial = null;
    this._particlePositionAttribute = null;
    this._particleColorAttribute = null;
    this._particleSizeAttribute = null;
  }
  
  /**
   * Create floating particles around civilization
   */
  createParticles(colonyId, center, stage, mood, colonyType, energy) {
    const particles = [];
    this._ensureParticleCloud();

    const seeds = this.getColonyVisualSeeds(colonyId);
    const profile = this.getMoodProfile(mood);
    const effectiveStage = Math.max(1, stage);
    const baseColor = this.getColorForMood(mood, colonyType);
    const colonyTint = this.blendColor(baseColor, profile.colorBias, 0.35);
    const energyFactor = Math.min(1, energy / 100);
    const count = Math.ceil(
      this.config.particles.count * (effectiveStage / 4) *
      profile.particleDensity *
      seeds.particleBias *
      (1 + energyFactor * 0.4) *
      (this.config.particles.maxPerColony / 100)
    );
    const available = this._particleCapacity - this._particleActiveCount;
    const spawnCount = Math.max(0, Math.min(count, available));

    if (spawnCount < count) {
      console.warn('[ColonyVFXManager] Particle cloud capacity reached; some particles were skipped.', {
        colonyId,
        requested: count,
        available
      });
    }

    for (let i = 0; i < spawnCount; i++) {
      const slotIndex = this._particleActiveCount;
      const seed = this._particleRandomSeed(colonyId, i);
      const sporeColor = this.config.enableBioluminescentUpgrade !== false
        ? new THREE.Color().setHSL(0.55 + seed * 0.15, 0.5 + energyFactor * 0.3, 0.4 + seed * 0.2)
        : new THREE.Color(colonyTint);
      const baseSize = 0.18 + seed * 0.1 + energyFactor * 0.05;
      const baseOpacity = 0.55 + energyFactor * 0.2;
      const baseOrbitRadius = 0.9 + stage * 0.35 + seed * 0.6;
      const baseOrbitSpeed = 0.4 + profile.motionBias * 0.14 + seeds.phaseSeed * 0.2;
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * (0.28 + energyFactor * 0.28 + profile.motionBias * 0.22),
        Math.random() * (0.18 + energyFactor * 0.18 + profile.motionBias * 0.12),
        (Math.random() - 0.5) * (0.28 + energyFactor * 0.28 + profile.motionBias * 0.22)
      );

      const particle = {
        userData: {
          colonyId,
          type: 'particle',
          startPos: new THREE.Vector3().copy(center),
          velocity: velocity.clone(),
          baseVelocity: velocity,
          lifetime: this.config.particles.lifetime,
          elapsed: 0,
          maxLifetime: this.config.particles.lifetime,
          motionBias: profile.motionBias,
          particleBias: seeds.particleBias,
          orbitPhase: seed * Math.PI * 2,
          orbitRadius: baseOrbitRadius,
          baseOrbitRadius,
          orbitSpeed: baseOrbitSpeed,
          baseOrbitSpeed,
          seed,
          baseTintHex: sporeColor.getHex(),
          tintHex: sporeColor.getHex(),
          baseSize,
          particleSize: baseSize,
          baseOpacity,
          particleOpacity: baseOpacity,
          slotIndex
        }
      };

      this._particleSlots[slotIndex] = particle;
      this._particleActiveCount += 1;
      this._registerParticleHandle(particle);
      this._writeParticleSlot(slotIndex, particle);
      particles.push(particle);
    }

    if (this._particleCloudGeometry) {
      this._particleCloudGeometry.setDrawRange(0, this._particleActiveCount);
      this._particlePositionAttribute.needsUpdate = true;
      this._particleColorAttribute.needsUpdate = true;
      this._particleSizeAttribute.needsUpdate = true;
    }

    return particles;
  }

  updateParticles(deltaTime) {
    const time = performance.now() * 0.001;

    for (let i = 0; i < this._particleActiveCount; i++) {
      const particle = this._particleSlots[i];
      if (!particle?.userData || particle.userData.__released) continue;

      const userData = particle.userData;
      userData.orbitPhase += deltaTime * (userData.orbitSpeed ?? userData.baseOrbitSpeed ?? 0.4);
      userData.elapsed += deltaTime;

      if (userData.mergeAbsorb) {
        userData.mergeAbsorb.timer += deltaTime;
        const progress = Math.min(1, userData.mergeAbsorb.timer / userData.mergeAbsorb.duration);
        const ease = progress * progress * (3 - 2 * progress);
        const sourceCenter = userData.mergeAbsorb.sourceCenter || userData.startPos;
        userData.startPos.lerpVectors(sourceCenter, userData.mergeAbsorb.targetCenter, ease);
        userData.orbitRadius = Math.max(0.1, (userData.baseOrbitRadius ?? userData.orbitRadius ?? 1) * (1 - ease * 0.75));
        userData.particleOpacity = Math.max(0.12, (userData.baseOpacity ?? userData.particleOpacity ?? 0.55) * (1 - ease * 0.25));

        if (progress >= 1) {
          delete userData.mergeAbsorb;
        }
      }

      if (userData.fadeOut) {
        userData.fadeOut.timer += deltaTime;
      }

      this._writeParticleSlot(i, particle, time);

      const fadeOut = userData.fadeOut;
      const fadeDelay = fadeOut ? Math.max(0, fadeOut.delay ?? 0) : 0;
      const fadeDuration = fadeOut ? Math.max(0.001, fadeOut.duration ?? 1) : 0;
      const fadeElapsed = fadeOut ? Math.max(0, (fadeOut.timer ?? 0) - fadeDelay) : 0;
      const fadeProgress = fadeOut ? Math.min(1, fadeElapsed / fadeDuration) : 0;
      const lifetimeProgress = Math.min(1, userData.elapsed / Math.max(0.001, userData.lifetime ?? 1));

      if (lifetimeProgress >= 1 || (fadeOut && fadeProgress >= 1)) {
        this._releaseParticleHandle(particle);
        i -= 1;
      }
    }

    if (this._particleCloudGeometry) {
      this._particlePositionAttribute.needsUpdate = true;
      this._particleColorAttribute.needsUpdate = true;
      this._particleSizeAttribute.needsUpdate = true;
      this._particleCloudGeometry.setDrawRange(0, this._particleActiveCount);
    }
  }

  /**
   * Create central glow (for higher stages)
   */
  createCentralGlow(colonyId, center, stage, mood, colonyType) {
    if (stage < 2) return null;
    
    const seeds = this.getColonyVisualSeeds(colonyId);
    const profile = this.getMoodProfile(mood);
    const color = this.getColorForMood(mood, colonyType);
    const pulsePhase = seeds.phaseSeed * Math.PI * 2;
    
    // Ethereal glow shell — low-poly icosahedron with BackSide rendering for volumetric feel
    const glowSize = 0.34 + stage * 0.12;
    const geometry = new THREE.IcosahedronGeometry(glowSize, 1); // faceted glow, not smooth sphere

    let material;
    let bioluminescent = false;

    // SUPERNATURAL UPGRADE: Bioluminescent volumetric glow shader
    if (this.config.enableBioluminescentUpgrade !== false) {
      bioluminescent = true;
      material = new THREE.ShaderMaterial({
        vertexShader: BIOLUMINESCENT_NUCLEUS_VERTEX, // reuse vertex
        fragmentShader: BIOLUMINESCENT_GLOW_FRAGMENT,
        uniforms: {
          uTime: { value: 0 },
          uEnergy: { value: 0.5 },
          uBaseColor: { value: new THREE.Color(color) },
          uPulsePhase: { value: pulsePhase },
          uAuraColor: { value: new THREE.Color(this.palette.glowBlue).lerp(new THREE.Color(color), 0.18) }
        },
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        fog: false
      });
    } else {
      material = this.createBasicMaterial(color, Math.min(1, 0.28 + (profile.glowIntensity || 0) * 0.08 + seeds.particleBias * 0.03));
      material.side = THREE.BackSide;
    }
    
    let glow = this.acquireVFXObject('central-glow');
    if (glow) {
      if (glow.geometry) glow.geometry.dispose();
      glow.geometry = geometry;
      if (glow.material) glow.material.dispose();
      glow.material = material;
    } else {
      glow = new THREE.Mesh(geometry, material);
    }

    glow.position.copy(center);
    glow.visible = true;
    glow.userData = {
      colonyId: colonyId,
      type: 'central-glow',
      pulsePhase,
      pulseSpeed: 2.0 + (profile.motionBias || 0) * 0.12 + seeds.pulseOffset * 0.15,
      motionBias: profile.motionBias,
      bioluminescent
    };

    this.vfxContainer.add(glow);

    // BLOOM: Add volumetric glow overlay for the central glow shell
    if (this.bloomOverlay) {
      this.bloomOverlay.createForGlow(colonyId, glow, color, 0.5, pulsePhase);
    }

    return glow;
  }
  
  /**
   * Create status crown for legendary civilizations
   */
  createLegendaryCrown(colonyId, center, stage, colonyType) {
    if (colonyType !== 'LEGENDARY') return null;
    
    const color = this.config.colors.LEGENDARY;
    
    // Crown made of small pyramids
    let crown = this.acquireVFXObject('legendary-crown');
    if (!crown) {
      crown = new THREE.Group();
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const radius = 0.6;
        const geometry = new THREE.ConeGeometry(0.2, 0.4, 8);
        const material = this.createBasicMaterial(color, 0.7);
        const spike = new THREE.Mesh(geometry, material);
        spike.position.x = Math.cos(angle) * radius;
        spike.position.z = Math.sin(angle) * radius;
        spike.rotation.z = angle;
        crown.add(spike);
      }
    } else {
      crown.children.forEach(spike => {
        if (spike.material) {
          spike.material.color.setHex(color);
          spike.material.opacity = 0.7;
        }
      });
      crown.visible = true;
    }

    crown.position.copy(center);
    crown.position.y += 0.8;
    crown.userData = {
      colonyId: colonyId,
      type: 'legendary-crown',
      rotationSpeed: 0.3
    };
    
    this.vfxContainer.add(crown);
    return crown;
  }

  /**
   * Create legendary halo for a legendary civilization
   */
  createLegendaryHalo(colonyId, center, stage, energy) {
    const color = this.config.colors.LEGENDARY;
    const radius = this.getRadiusForStage(stage) * 1.6 + 0.6;
    const geometry = this.getCachedGeometry(`halo_${radius.toFixed(1)}`, () => new THREE.RingGeometry(radius, radius + 0.12, 48, 1));
    const material = this.getCachedMaterial(color, 0.24, THREE.DoubleSide);

    let halo = this.acquireVFXObject('legendary-halo');
    if (halo) {
      if (halo.geometry) halo.geometry.dispose();
      halo.geometry = geometry;
      halo.material.color.setHex(color);
      halo.material.opacity = 0.24;
    } else {
      halo = new THREE.Mesh(geometry, material);
    }

    halo.position.copy(center);
    halo.rotation.x = Math.PI / 2;
    halo.userData = {
      colonyId: colonyId,
      type: 'legendary-halo',
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.5 + stage * 0.08
    };

    this.vfxContainer.add(halo);
    return halo;
  }

  createLegendaryPresence(colonyId, center, stage) {
    let presence = this.acquireVFXObject('legendary-presence');
    if (!presence) {
      presence = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const orb = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.08, 0), // Faceted crystal orbs
          this.createBasicMaterial(this.config.colors.LEGENDARY, 0.6)
        );
        orb.position.set(Math.cos(i * Math.PI * 2 / 3) * 1.2, 0.2, Math.sin(i * Math.PI * 2 / 3) * 1.2);
        presence.add(orb);
      }
    } else {
      presence.children.forEach(orb => {
        if (orb.material) {
          orb.material.color.setHex(this.config.colors.LEGENDARY);
          orb.material.opacity = 0.6;
        }
      });
      presence.visible = true;
    }

    presence.position.copy(center);
    presence.userData = {
      colonyId: colonyId,
      type: 'legendary-presence',
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.3 + stage * 0.05
    };

    this.vfxContainer.add(presence);
    return presence;
  }

  createDebugLabel(colonyId, center, lines, color = 0xdbe2ee) {
    let label = this.acquireVFXObject('colony-plaque');

    if (!label) {
      const canvas = document.createElement('canvas');
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;

      const geometry = this.getCachedGeometry('colony.label.plaque', () => this._createColonyLabelPlaqueGeometry());
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        color: 0xffffff,
        transparent: true,
        opacity: 0.96,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide
      });

      label = new THREE.Mesh(geometry, material);
      label.scale.set(3.4, 2.0, 1);
      label.renderOrder = 40;
      label.userData = {
        type: 'colony-plaque',
        canvas,
        texture
      };
    }

    const canvas = label.userData.canvas;
    const texture = label.userData.texture || label.material.map;
    const ctx = this._renderColonyLabelCanvas(canvas, lines, color);

    if (texture) {
      texture.needsUpdate = true;
      label.material.map = texture;
    }

    label.material.color.setHex(0xffffff);
    label.material.opacity = 0.96;
    label.visible = true;

    label.position.copy(center);
    label.position.y += 1.5;
    label.userData = {
      ...label.userData,
      colonyId,
      type: 'colony-plaque',
      canvas,
      ctx,
      texture,
      color,
      lines
    };
    this.vfxContainer.add(label);
    return label;
  }

  updateDebugLabel(label, lines, color = 0xdbe2ee) {
    if (!label || !label.userData || !label.userData.ctx) return;
    const canvas = label.userData.canvas;

    const texture = label.userData.texture || label.material.map;

    this._renderColonyLabelCanvas(canvas, lines, color);

    if (texture) {
      texture.needsUpdate = true;
    }

    if (label.material) {
      label.material.map = texture || label.material.map;
      label.material.color.setHex(0xffffff);
    }
    label.userData.lines = lines;
    label.userData.color = color;
  }

  /**
   * Create sigil ring for convergence / ascension
   */
  createSigilRing(colonyId, center, stage, mood, colonyType, energy) {
    const color = this.getColorForMood(mood, colonyType);
    const radius = this.getRadiusForStage(stage) * 1.3;
    const geometry = this.getCachedGeometry(`sigil_${(radius * 0.8).toFixed(1)}_${radius.toFixed(1)}`, () => new THREE.RingGeometry(radius * 0.8, radius, 48, 1));
    const material = this.getCachedMaterial(color, 0.35, THREE.DoubleSide);
    let sigil = this.acquireVFXObject('sigil-ring');
    if (sigil) {
      if (sigil.geometry) sigil.geometry.dispose();
      sigil.geometry = geometry;
      sigil.material.color.setHex(color);
      sigil.material.opacity = 0.35;
    } else {
      sigil = new THREE.Mesh(geometry, material);
    }

    sigil.position.copy(center);
    sigil.rotation.x = Math.PI / 2;
    sigil.visible = true;
    sigil.userData = {
      colonyId: colonyId,
      type: 'sigil-ring',
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 1.2 + stage * 0.15
    };
    this.vfxContainer.add(sigil);
    return sigil;
  }

  /**
   * Create ascension beam for advanced civilizations
   */
  createAscensionBeam(colonyId, center, stage, mood, colonyType, energy) {
    const color = this.getColorForMood(mood, colonyType);
    const height = 2.0 + stage * 0.4;
    const geometry = this.getCachedGeometry(`beam_${height.toFixed(1)}`, () => new THREE.CylinderGeometry(0.05, 0.1, height, 10, 1, true));
    const material = this.getCachedMaterial(color, 0.22, THREE.DoubleSide);
    let beam = this.acquireVFXObject('ascension-beam');
    if (beam) {
      if (beam.geometry) beam.geometry.dispose();
      beam.geometry = geometry;
      beam.material.color.setHex(color);
      beam.material.opacity = 0.22;
    } else {
      beam = new THREE.Mesh(geometry, material);
    }

    beam.position.copy(center);
    beam.position.y += height * 0.5 + 0.1;
    beam.visible = true;
    beam.userData = {
      colonyId: colonyId,
      type: 'ascension-beam',
      pulsePhase: 0,
      pulseSpeed: 1.0 + stage * 0.1,
      energyFactor: Math.min(1, energy / 100)
    };
    this.vfxContainer.add(beam);
    return beam;
  }
  /**
   * Update atmosphere animations (pulse, rotation)
   */
  updateAtmospheres(deltaTime) {
    const time = performance.now() * 0.001;

    // PERFORMANCE: Update legacy (non-instanced) atmospheres
    for (const child of this.vfxContainer.children) {
      if (!child.visible) continue;
      if (child.userData && child.userData.type === 'atmosphere') {
        const userData = child.userData;
        const breath = 1 + Math.sin(time * 1.0 + (userData.pulseAmplitude ?? 0) * 1.2 + (userData.baseColor ?? 0) * 0) * 0.06;
        child.scale.setScalar(breath + userData.energyFactor * 0.08);

        const motionRate = 0.14 + (userData.motionBias ?? 0.35) * 0.08 + userData.energyFactor * 0.16;
        child.rotation.y += deltaTime * motionRate;
      }
    }

    // PERFORMANCE: Update instanced atmospheres (breath pulse + rotation)
    // These are tracked via _atmoColonyIndex, not as vfxContainer children
    // The per-frame pulse is applied in updateVFXForColony, but we add a
    // subtle breath animation here too for the instanced path.
    // Note: InstancedMesh rotation requires matrix rebuild — handled by updateVFXForColony.
  }

  updateMoodCanopies(deltaTime) {
    const time = performance.now() * 0.001;
    for (const child of this.vfxContainer.children) {
      if (!child.visible) continue;
      if (child.userData && child.userData.type === 'mood-canopy') {
        const userData = child.userData;

        if (userData.splitTear) {
          userData.splitTear.timer += deltaTime;
          const progress = Math.min(1, userData.splitTear.timer / userData.splitTear.duration);
          const ease = progress * progress * (3 - 2 * progress);
          const sourceCenter = userData.splitTear.sourceCenter || child.position;
          const targetA = userData.splitTear.targetCenters?.[0]
            ? userData.splitTear.targetCenters[0].clone().sub(sourceCenter)
            : new THREE.Vector3(-0.9, 0.1, 0);
          const targetB = userData.splitTear.targetCenters?.[1]
            ? userData.splitTear.targetCenters[1].clone().sub(sourceCenter)
            : new THREE.Vector3(0.9, 0.1, 0);

          child.children.forEach((panel, index) => {
            const baseAngle = panel.userData.baseAngle ?? 0;
            const baseLift = panel.userData.baseLift ?? 0.4;
            const baseRadius = panel.userData.baseRadius ?? 1;
            const sway = Math.sin(time * (0.9 + userData.motionBias * 0.5) + index * 0.7 + userData.pulsePhase) * userData.sway;
            const breathe = 1 + Math.sin(time * 1.2 + index * 0.6 + userData.pulsePhase) * 0.08;
            const currentX = Math.cos(baseAngle + sway * 0.3) * baseRadius;
            const currentY = baseLift + Math.sin(time * 1.4 + index) * 0.05 * (1 + userData.energyFactor);
            const currentZ = Math.sin(baseAngle + sway * 0.3) * baseRadius;
            const side = panel.userData.splitSide ?? (Math.cos(baseAngle) >= 0 ? 1 : -1);
            panel.userData.splitSide = side;
            const target = side >= 0 ? targetB : targetA;

            panel.position.x = currentX * (1 - ease) + target.x * ease;
            panel.position.y = currentY * (1 - ease) + target.y * ease;
            panel.position.z = currentZ * (1 - ease) + target.z * ease;
            panel.rotation.y = baseAngle + sway * 0.12 + side * ease * 0.7;
            panel.rotation.z += deltaTime * 0.02 * (index % 2 === 0 ? 1 : -1) + side * ease * 0.12;
            panel.scale.y = Math.max(0.45, panel.scale.y * (1 - ease * 0.12) + breathe * (0.1 + (1 - ease) * 0.04));
            if (panel.material) {
              panel.material.opacity = Math.max(0.05, Math.min(0.42, (panel.material.opacity || 0.18) * (1 - ease * 0.45) + (0.14 + userData.energyFactor * 0.08 + Math.abs(sway) * 0.08) * 0.08));
            }
          });

          if (progress >= 1) {
            delete userData.splitTear;
          }

          userData.pulsePhase += deltaTime * (0.8 + userData.motionBias * 0.22);
          child.rotation.y += deltaTime * userData.spin;
          child.position.y += Math.sin(userData.pulsePhase) * 0.002;

          const canopyScale = 1 + Math.sin(userData.pulsePhase) * (0.04 + userData.motionBias * 0.02) + userData.energyFactor * 0.05;
          child.scale.setScalar(canopyScale);

          continue;
        }

        userData.pulsePhase += deltaTime * (0.8 + userData.motionBias * 0.22);
        child.rotation.y += deltaTime * userData.spin;
        child.position.y += Math.sin(userData.pulsePhase) * 0.002;

        const canopyScale = 1 + Math.sin(userData.pulsePhase) * (0.04 + userData.motionBias * 0.02) + userData.energyFactor * 0.05;
        child.scale.setScalar(canopyScale);

        child.children.forEach((panel, index) => {
          const baseAngle = panel.userData.baseAngle ?? 0;
          const baseLift = panel.userData.baseLift ?? 0.4;
          const baseRadius = panel.userData.baseRadius ?? 1;
          const sway = Math.sin(time * (0.9 + userData.motionBias * 0.5) + index * 0.7 + userData.pulsePhase) * userData.sway;
          const breathe = 1 + Math.sin(time * 1.2 + index * 0.6 + userData.pulsePhase) * 0.08;

          panel.position.x = Math.cos(baseAngle + sway * 0.3) * baseRadius;
          panel.position.y = baseLift + Math.sin(time * 1.4 + index) * 0.05 * (1 + userData.energyFactor);
          panel.position.z = Math.sin(baseAngle + sway * 0.3) * baseRadius;
          panel.rotation.y = baseAngle + sway * 0.12;
          panel.rotation.z += deltaTime * 0.02 * (index % 2 === 0 ? 1 : -1);
          panel.scale.y = Math.max(0.6, panel.scale.y * 0.9 + breathe * 0.1);
          if (panel.material) {
            panel.material.opacity = Math.min(0.42, (panel.material.opacity || 0.18) * 0.9 + (0.14 + userData.energyFactor * 0.08 + Math.abs(sway) * 0.08) * 0.1);
          }
        });
      }
    }
  }
  
  /**
   * Update orbit rings (rotation + opacity pulse)
   */
  updateRings(deltaTime) {
    for (const child of this.vfxContainer.children) {
      if (!child.visible) continue;
      if (child.userData && child.userData.type === 'orbit-ring') {
        const userData = child.userData;
        let spinSpeed = userData.rotationSpeed;

        if (userData.eventSpinBoost) {
          userData.eventSpinBoost.timer += deltaTime;
          const progress = Math.min(1, userData.eventSpinBoost.timer / userData.eventSpinBoost.duration);
          spinSpeed += userData.eventSpinBoost.amount * (1 - progress);
          if (progress >= 1) {
            delete userData.eventSpinBoost;
          }
        }

        const additionalSpin = (userData.motionBias ?? 0.35) * 0.12;
        const direction = userData.direction || 1;
        child.rotation.z += deltaTime * direction * (spinSpeed + additionalSpin);
        child.rotation.x += deltaTime * direction * (spinSpeed * 0.18 + additionalSpin * 0.1);
      }
    }
  }
  /**
   * Update central glow animation
   */
  updateCentralGlows(deltaTime) {
    const time = performance.now() * 0.001;
    
    for (const child of this.vfxContainer.children) {
      if (!child.visible) continue;
      if (child.userData && child.userData.type === 'central-glow') {
        const userData = child.userData;
        
        // Pulse glow
        userData.pulsePhase += deltaTime * userData.pulseSpeed;
        const pulse = Math.sin(userData.pulsePhase) * (0.16 + (userData.motionBias ?? 0.35) * 0.06) + 0.28;

        // SUPERNATURAL UPGRADE: Update bioluminescent glow shader uniforms
        if (userData.bioluminescent && child.material?.uniforms) {
          child.material.uniforms.uTime.value = time;
          child.material.uniforms.uPulsePhase.value = userData.pulsePhase;
        } else {
          child.material.opacity = Math.min(1, 0.18 + pulse * 0.9);
        }
        
        // Scale pulse
        const scaleModifier = 0.88 + Math.sin(userData.pulsePhase) * (0.18 + (userData.motionBias ?? 0.35) * 0.04);
        child.scale.setScalar(scaleModifier);
      }
    }
  }
  
  /**
   * Update conscious core animation
   */
  updateCores(deltaTime) {
    const time = performance.now() * 0.001;
    for (const child of this.vfxContainer.children) {
      if (!child.visible) continue;
      if (child.userData && child.userData.type === 'core') {
        const userData = child.userData;
        userData.pulsePhase += deltaTime * userData.pulseSpeed;
        const isActivePulse = userData.stage >= 2;
        const pulseAmount = isActivePulse ? 0.18 : 0.04;
        const pulse = Math.sin(userData.pulsePhase) * (pulseAmount + (userData.motionBias ?? 0.35) * 0.05) + 1.0 + userData.energyFactor * 0.1;
        child.scale.setScalar(pulse);
        child.rotation.y += deltaTime * (0.22 + (userData.motionBias ?? 0.35) * 0.12);
        child.rotation.x += deltaTime * (0.08 + (userData.motionBias ?? 0.35) * 0.06);

        // SUPERNATURAL UPGRADE: Update bioluminescent shader uniforms
        if (userData.bioluminescent && child.material?.uniforms) {
          child.material.uniforms.uTime.value = time;
          child.material.uniforms.uPulsePhase.value = userData.pulsePhase;
        }

        for (const sub of child.children) {
          if (sub.userData?.type === 'orbital-ring') {
            sub.rotation.z += deltaTime * (sub.userData.spinSpeed ?? 1.0);
          }
          if (sub.userData?.type === 'membrane') {
            sub.rotation.y += deltaTime * (sub.userData.spinSpeed ?? 0.3);
            // SUPERNATURAL: Update membrane shader uniforms
            if (userData.bioluminescent && sub.material?.uniforms) {
              sub.material.uniforms.uTime.value = time;
              sub.material.uniforms.uPulsePhase.value = userData.pulsePhase + 1.0;
            }
          }
        }
      }
    }
  }
  
  /**
   * Update legendary crowns (rotation)
   */
  updateLegendaryCrowns(deltaTime) {
    for (const child of this.vfxContainer.children) {
      if (child.userData && child.userData.type === 'legendary-crown') {
        const userData = child.userData;
        child.rotation.y += deltaTime * (userData.rotationSpeed * 0.4 + 0.02);
        child.rotation.z += deltaTime * (userData.rotationSpeed * 0.18 + 0.01);
      }
    }
  }

  updateLegendaryHalos(deltaTime) {
    const time = performance.now() * 0.001;
    for (const child of this.vfxContainer.children) {
      if (!child.visible) continue;
      if (child.userData && child.userData.type === 'legendary-halo') {
        const userData = child.userData;
        userData.pulsePhase += deltaTime * userData.pulseSpeed;
        child.material.opacity = 0.18 + Math.sin(userData.pulsePhase) * 0.08;
        const scale = 1.0 + Math.sin(userData.pulsePhase * 0.75) * 0.12;
        child.scale.setScalar(scale);
      }
    }
  }

  updateLegendaryPresence(deltaTime) {
    const time = performance.now() * 0.001;
    for (const child of this.vfxContainer.children) {
      if (!child.visible) continue;
      if (child.userData && child.userData.type === 'legendary-presence') {
        const userData = child.userData;
        userData.pulsePhase += deltaTime * userData.pulseSpeed;
        const offset = Math.sin(userData.pulsePhase) * 0.08;
        child.children.forEach((orb, index) => {
          orb.position.y = 0.2 + offset * (index + 1) * 0.5;
          if (orb.material) {
            orb.material.opacity = 0.45 + Math.sin(time * 2 + index) * 0.1;
          }
        });
      }
    }
  }

  /**
   * Update sigil rings (pulse and rotation)
   */
  updateSigils(deltaTime) {
    const time = performance.now() * 0.001;
    for (const child of this.vfxContainer.children) {
      if (!child.visible) continue;
      if (child.userData && child.userData.type === 'sigil-ring') {
        const userData = child.userData;
        userData.pulsePhase += deltaTime * userData.pulseSpeed;
        const pulse = Math.sin(userData.pulsePhase) * 0.08 + 1.0;
        child.scale.setScalar(pulse);
        child.rotation.z += deltaTime * 0.15;
        child.material.opacity = 0.25 + Math.sin(time * 1.5 + userData.pulsePhase) * 0.08;
      }
    }
  }

  /**
   * Update ascension beams (flicker and pulse)
   */
  updateBeams(deltaTime) {
    const time = performance.now() * 0.001;
    for (const child of this.vfxContainer.children) {
      if (!child.visible) continue;
      if (child.userData && child.userData.type === 'ascension-beam') {
        const userData = child.userData;
        if (userData.stage4Ascension) {
          userData.stage4Ascension.timer += deltaTime;
          const progress = Math.min(1, userData.stage4Ascension.timer / userData.stage4Ascension.duration);
          const inhaleExhale = Math.sin(progress * Math.PI);
          child.scale.y = 0.95 + inhaleExhale * 0.45;
          child.material.opacity = userData.stage4Ascension.startOpacity + inhaleExhale * (userData.stage4Ascension.peakOpacity - userData.stage4Ascension.startOpacity);

          if (progress >= 1) {
            delete userData.stage4Ascension;
          }
        } else {
          userData.pulsePhase += deltaTime * userData.pulseSpeed;
          const pulse = 0.8 + Math.sin(time * 2 + userData.pulsePhase) * 0.15 + userData.energyFactor * 0.1;
          child.scale.y = pulse;
          child.material.opacity = 0.16 + Math.sin(time * 3 + userData.pulsePhase) * 0.06;
        }
      }
    }
  }
  
  /**
   * Update colony VFX state changes
   */
  updateVFXForColony(colonyId, colony, registryVFX, envelope = {}) {
    if (!registryVFX[colonyId]) return;
    
    const vfx = registryVFX[colonyId];
    const energyFactor = envelope.energyFactor ?? Math.min(1, colony.energy / 100);
    const profile = this.getMoodProfile(colony.mood);
    const baseColor = this.getColorForMood(colony.mood, colony.type);
    const color = this.blendColor(baseColor, profile.colorBias, 0.35);
    
    const time = performance.now() * 0.001;
    const stablePhase = time + (vfx.phaseSeed ?? 0) * Math.PI * 1.4 + (vfx.pulseOffset ?? 0);
    const stablePulse = 0.96 + Math.sin(stablePhase) * 0.04;
    const lodProfile = this._getColonyLODProfile(colony);
    const lodLevel = lodProfile.level ?? 0;
    const visualScale = lodProfile.visualScale ?? 1;
    const motionScale = lodProfile.motionScale ?? 1;

    this._applyColonyLODProfile(colonyId, colony, vfx, lodProfile);

    if (vfx.atmosphere) {
      let atmoOpacity = Math.min(1, (this.config.atmosphere.opacity + energyFactor * 0.25 + profile.motionBias * 0.14 + (envelope.crest ?? 0) * 0.08 + (vfx.halo?.userData?.haloPressure ?? 0)) * visualScale);
      let pulse = 1 + ((envelope.attack ?? 0) * 0.1 + profile.motionBias * 0.04 + (envelope.crest ?? 0) * 0.06 + (stablePulse - 1) * 0.08) * motionScale;

      if (vfx.atmosphere.userData?.stage4Ascension) {
        const ascension = vfx.atmosphere.userData.stage4Ascension;
        ascension.timer += deltaTime;
        const progress = Math.min(1, ascension.timer / ascension.duration);
        const inhaleExhale = Math.sin(progress * Math.PI);
        pulse *= 1 + inhaleExhale * ascension.pulseBoost;
        atmoOpacity = Math.min(1, atmoOpacity + inhaleExhale * ascension.opacityBoost);

        if (progress >= 1) {
          delete vfx.atmosphere.userData.stage4Ascension;
        }
      }

      if (vfx.atmosphere.isInstancedAtmosphere) {
        // PERFORMANCE: Update InstancedMesh instance for this colony
        const idx = vfx.atmosphere.userData.instanceIndex;
        if (idx !== undefined && this._atmoInstanceMesh) {
          const ud = vfx.atmosphere.userData;
          const sx = ud.radius * pulse;
          const sy = ud.radius * pulse;
          const sz = 0.28 * ud.radius * pulse;
          const quat = new THREE.Quaternion(); // identity — rotation was set at creation
          this._atmoTempMatrix.compose(vfx.atmosphere.position, quat, new THREE.Vector3(sx, sy, sz));
          this._atmoInstanceMesh.setMatrixAt(idx, this._atmoTempMatrix);
          this._atmoTempColor.setHex(color);
          this._atmoTempColor.multiplyScalar(atmoOpacity);
          this._atmoInstanceMesh.setColorAt(idx, this._atmoTempColor);
          this._atmoDirty = true;
        }
      } else if (vfx.atmosphere.material) {
        // Legacy path for non-instanced atmospheres
        vfx.atmosphere.material.color.setHex(color);
        vfx.atmosphere.material.opacity = atmoOpacity;
        vfx.atmosphere.scale.setScalar(pulse);
      }
    }

    if (lodLevel >= 2) {
      return;
    }
    
    const stage = Math.max(0, Math.min(4, colony.stage));
    const breathingColor = new THREE.Color(color).lerp(new THREE.Color(0xF7FBFF), Math.min(0.3, (envelope.crest ?? 0) * 0.18 + energyFactor * 0.05));
    const stageRingCount = stage === 1 ? 1 : stage === 2 ? Math.min(2, vfx.rings.length) : stage === 3 ? Math.min(4, vfx.rings.length) : vfx.rings.length;
    const visibleRingCount = Math.min(stageRingCount, lodProfile.maxRings ?? vfx.rings.length);

    for (const ring of vfx.rings) {
      if (ring && ring.material) {
        const ringHue = this.blendColor(color, breathingColor.getHex(), 0.22);
        ring.material.color.setHex(ringHue);
        const ringVisibility = ring.userData?.ringIndex < visibleRingCount;
        ring.visible = ringVisibility;
        let speed = (ring.userData?.rotationSpeed ?? 0.4) + (envelope.attack ?? 0) * 0.16 + profile.motionBias * 0.15 + (vfx.ringSpeedBias ?? 0) * 0.18;

        if (ring.userData?.stage4Ascension) {
          const ascension = ring.userData.stage4Ascension;
          ascension.timer += deltaTime;
          const progress = Math.min(1, ascension.timer / ascension.duration);
          const boost = 1 + (ascension.spinMultiplier - 1) * Math.sin(progress * Math.PI);
          speed *= boost;

          if (progress >= 1) {
            delete ring.userData.stage4Ascension;
          }
        }

        ring.material.opacity = ringVisibility
          ? Math.min(1, this.config.rings.opacity + stage * 0.06 + (envelope.crest ?? 0) * 0.18 + profile.motionBias * 0.1)
          : 0;
        if (ring.userData) ring.userData.rotationSpeed = speed;
      }
    }

    if (lodLevel >= 1) {
      const coreGlow = vfx.core || vfx.glow;
      if (coreGlow && coreGlow.material) {
        coreGlow.material.opacity = 0.25 + (envelope.crest ?? 0) * 0.18 + energyFactor * 0.1;
        coreGlow.scale.setScalar((0.9 + colony.stage * 0.06 + (envelope.attack ?? 0) * 0.07) * visualScale);
      }

      return;
    }

    const particleTintHex = this.blendColor(color, breathingColor.getHex(), 0.18);
    const particleSize = 0.14 + energyFactor * 0.08 + (profile.particleDensity - 1.0) * 0.08 + (envelope.crest ?? 0) * 0.06 + ((vfx.particleBias ?? 1) - 1) * 0.05;
    const particleOpacity = Math.min(1, 0.35 + stage * 0.08 + energyFactor * 0.22 + (profile.motionBias * 0.12) + (envelope.attack ?? 0) * 0.12);
    const particleOrbitScale = 1 + (envelope.crest ?? 0) * 0.09 + profile.motionBias * 0.08 + ((vfx.particleBias ?? 1) - 1) * 0.06;

    for (const particle of vfx.particles) {
      const userData = particle?.userData;
      if (!userData || userData.__released || userData.fadeOut) continue;

      userData.tintHex = particleTintHex;
      userData.particleSize = particleSize;
      userData.particleOpacity = particleOpacity;
      userData.orbitSpeed = Math.max(0.2, userData.baseOrbitSpeed ?? userData.orbitSpeed ?? 0.2) * particleOrbitScale;
    }

    if (vfx.canopy && vfx.canopy.userData?.type === 'mood-canopy') {
      const canopyOpacity = 0.12 + stage * 0.025 + energyFactor * 0.08 + (envelope.crest ?? 0) * 0.1;
      vfx.canopy.userData.motionBias = profile.motionBias;
      vfx.canopy.userData.energyFactor = energyFactor;
      vfx.canopy.userData.color = this.blendColor(color, breathingColor.getHex(), 0.24);
      vfx.canopy.userData.spin = Math.max(0.04, (vfx.canopy.userData.spin ?? 0.08) + (envelope.attack ?? 0) * 0.05);

      for (const panel of vfx.canopy.children) {
        if (!panel.material) continue;
        panel.material.color.setHex(vfx.canopy.userData.color);
        panel.material.opacity = Math.min(0.42, canopyOpacity + profile.motionBias * 0.05);
      }
    }
    
    if (vfx.core && vfx.core.material) {
      if (vfx.core.userData) {
        vfx.core.userData.pulseSpeed = 1.2 + stage * 0.12 + profile.motionBias * 0.08 + (envelope.crest ?? 0) * 0.03;
      }
      vfx.core.material.color.setHex(breathingColor.getHex());
      const coreScale = 0.9 + energyFactor * 0.45 + colony.stage * 0.05 + (envelope.crest ?? 0) * 0.12 + (envelope.attack ?? 0) * 0.06 + profile.motionBias * 0.02;
      vfx.core.scale.setScalar(coreScale);
    }
    
    if (vfx.glow && vfx.glow.material) {
      vfx.glow.material.opacity = 0.25 + (envelope.crest ?? 0) * 0.18 + energyFactor * 0.1;
      vfx.glow.scale.setScalar(0.9 + colony.stage * 0.06 + (envelope.attack ?? 0) * 0.07);
    }
    
    if (vfx.legendaryHalo && vfx.legendaryHalo.material) {
      vfx.legendaryHalo.material.opacity = 0.18 + (envelope.attack ?? 0) * 0.12 + energyFactor * 0.08;
      vfx.legendaryHalo.scale.setScalar(1 + colony.stage * 0.04 + (envelope.crest ?? 0) * 0.06);
    }

    if (vfx.legendaryPresence) {
      for (const orb of vfx.legendaryPresence.children) {
        if (orb.material) {
          orb.material.opacity = 0.45 + energyFactor * 0.15 + (envelope.crest ?? 0) * 0.05;
        }
      }
    }
    
    if (vfx.sigils) {
      for (const sigil of vfx.sigils) {
        if (sigil && sigil.material) {
          sigil.material.opacity = 0.15 + (envelope.crest ?? 0) * 0.1 + profile.motionBias * 0.05;
        }
      }
    }
    
    if (vfx.beam && vfx.beam.material) {
      vfx.beam.material.opacity = 0.12 + (envelope.crest ?? 0) * 0.1 + energyFactor * 0.08;
    }
  }
  
  /**
   * Trigger colony birth event — "Genesis Helix"
   * A double helix spiral emerges from center, expanding outward like DNA unfurling.
   * Symbolizes the birth of new life from genetic code.
   */
  triggerBirthEvent(colonyId, center, color) {
    const birthGroup = new THREE.Group();
    birthGroup.position.copy(center);
    
    // Primary ring — expanding torus (the "birth cry")
    const ringGeo = new THREE.TorusGeometry(0.1, 0.05, 16, 32);
    const ringMat = this.createBasicMaterial(color, 1.0);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    birthGroup.add(ring);
    
    // Helix strand 1 — thin torus knot (DNA strand A)
    const helixGeo1 = new THREE.TorusKnotGeometry(0.08, 0.015, 48, 8, 2, 3);
    const helixMat1 = this.createBasicMaterial(color, 0.7);
    const helix1 = new THREE.Mesh(helixGeo1, helixMat1);
    birthGroup.add(helix1);
    
    // Helix strand 2 — same knot, offset rotation (DNA strand B)
    const helixGeo2 = new THREE.TorusKnotGeometry(0.08, 0.015, 48, 8, 2, 3);
    const helixMat2 = this.createBasicMaterial(
      (new THREE.Color(color)).lerp(new THREE.Color(this.palette.frost), 0.18).getHex(),
      0.7
    );
    const helix2 = new THREE.Mesh(helixGeo2, helixMat2);
    helix2.rotation.y = Math.PI; // Offset by half turn
    birthGroup.add(helix2);
    
    birthGroup.scale.setScalar(0.1);
    birthGroup.userData = {
      type: 'birth-event',
      elapsed: 0,
      lifetime: 0.5,
      expandSpeed: 3.0,
      helix1,
      helix2
    };
    
    this.vfxContainer.add(birthGroup);
    return birthGroup;
  }
  
  /**
   * Trigger colony collapse event (implosion)
   * Uses wireframe dodecahedron that implodes — more dramatic than a sphere
   */
  triggerCollapseEvent(colonyId, center, color) {
    // Core implosion sphere
    const coreGeo = new THREE.SphereGeometry(1.0, 16, 16);
    const coreMat = this.createBasicMaterial(color, 0.5);
    const collapse = new THREE.Mesh(coreGeo, coreMat);
    
    // Wireframe shell — fracturing cage
    const shellGeo = new THREE.DodecahedronGeometry(1.2, 1);
    const shellMat = this.createBasicMaterial(color, 0.3);
    shellMat.wireframe = true;
    const shell = new THREE.Mesh(shellGeo, shellMat);
    collapse.add(shell);
    
    collapse.position.copy(center);
    
    collapse.userData = {
      type: 'collapse-event',
      elapsed: 0,
      lifetime: 0.8,
      collapseSpeed: 2.0
    };
    
    this.vfxContainer.add(collapse);
    return collapse;
  }

  /**
   * Trigger colony growth event — "Organic Membrane"
   * A breathing organic shell expands outward with gentle pulsation.
   * Two concentric icosahedrons at different rotation speeds create depth.
   */
  triggerGrowthEvent(colonyId, center, color, stage = 1) {
    const growthGroup = new THREE.Group();
    growthGroup.position.copy(center);
    growthGroup.rotation.x = Math.PI / 2;
    
    // Outer membrane — low-poly icosahedron, semi-transparent
    const outerGeo = new THREE.IcosahedronGeometry(0.5 + stage * 0.04, 1);
    const outerMat = this.createBasicMaterial(color, 0.25, THREE.DoubleSide);
    outerMat.flatShading = true;
    const outer = new THREE.Mesh(outerGeo, outerMat);
    outer.userData.role = 'outer-membrane';
    growthGroup.add(outer);
    
    // Inner breath — smaller, brighter, rotates opposite
    const innerGeo = new THREE.IcosahedronGeometry(0.3 + stage * 0.03, 0);
    const innerColor = (new THREE.Color(color)).lerp(new THREE.Color(this.palette.frost), 0.24).getHex();
    const innerMat = this.createBasicMaterial(innerColor, 0.4, THREE.DoubleSide);
    innerMat.flatShading = true;
    const inner = new THREE.Mesh(innerGeo, innerMat);
    inner.userData.role = 'inner-breath';
    growthGroup.add(inner);
    
    // Spine ring — thin torus marking equator
    const spineGeo = new THREE.TorusGeometry(0.45 + stage * 0.03, 0.008, 6, 24);
    const spineMat = this.createBasicMaterial(color, 0.5);
    const spine = new THREE.Mesh(spineGeo, spineMat);
    growthGroup.add(spine);
    
    growthGroup.userData = {
      colonyId: colonyId,
      type: 'growth-event',
      elapsed: 0,
      lifetime: 0.9,
      initialScale: 0.7 + stage * 0.05,
      rotationAxis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize()
    };

    growthGroup.scale.setScalar(growthGroup.userData.initialScale);
    this.vfxContainer.add(growthGroup);
    return growthGroup;
  }

  triggerAscensionMoment(colonyId, center, stage, mood, colonyType, energy, duration = 1.0) {
    const beam = this.createAscensionBeam(colonyId, center, stage, mood, colonyType, energy);
    beam.userData.stage4Ascension = {
      timer: 0,
      duration,
      startOpacity: 0.22,
      peakOpacity: 0.8
    };

    if (beam.material) {
      beam.material.opacity = 0.22;
    }

    for (const child of this.vfxContainer.children) {
      if (child.userData?.colonyId !== colonyId) continue;

      if (child.userData.type === 'atmosphere') {
        child.userData.stage4Ascension = {
          timer: 0,
          duration,
          pulseBoost: 0.18,
          opacityBoost: 0.18
        };
      }

      if (child.userData.type === 'orbit-ring' || child.userData.type === 'sigil-ring') {
        child.userData.stage4Ascension = {
          timer: 0,
          duration,
          spinMultiplier: 3.0
        };
      }
    }

    this.triggerEventPulse(colonyId, 1.15, duration);
    return beam;
  }

  /**
   * Trigger colony merge event — "Convergence Dance"
   * Two interlocked torus knots spinning toward each other.
   * Symbolizes two colonies spiraling into unity.
   */
  triggerMergeEvent(colonyId, center, color) {
    const mergeGroup = new THREE.Group();
    mergeGroup.position.copy(center);
    
    // Outer convergence ring
    const ringGeo = new THREE.TorusGeometry(0.5, 0.1, 16, 48);
    const ringMat = this.createBasicMaterial(color, 0.45);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    mergeGroup.add(ring);
    
    // Spiral strand A — torus knot spinning clockwise
    const knotGeoA = new THREE.TorusKnotGeometry(0.25, 0.02, 64, 8, 2, 5);
    const knotMatA = this.createBasicMaterial(color, 0.5);
    const knotA = new THREE.Mesh(knotGeoA, knotMatA);
    knotA.userData.role = 'convergence-a';
    mergeGroup.add(knotA);
    
    // Spiral strand B — same knot, opposite color shift, counter-clockwise
    const knotColorB = (new THREE.Color(color)).lerp(new THREE.Color(this.palette.frost), 0.28).getHex();
    const knotGeoB = new THREE.TorusKnotGeometry(0.25, 0.02, 64, 8, 2, 5);
    const knotMatB = this.createBasicMaterial(knotColorB, 0.5);
    const knotB = new THREE.Mesh(knotGeoB, knotMatB);
    knotB.userData.role = 'convergence-b';
    mergeGroup.add(knotB);
    
    mergeGroup.userData = {
      colonyId: colonyId,
      type: 'merge-event',
      elapsed: 0,
      lifetime: 0.9,
      spinSpeed: 1.4,
      knotA,
      knotB
    };

    this.vfxContainer.add(mergeGroup);
    return mergeGroup;
  }

  /**
   * Trigger colony split event — "Fracture Shards"
   * Ring geometry shatters into angular shards.
   * A central octahedron cracks open.
   */
  triggerSplitEvent(colonyId, center, color) {
    const splitGroup = new THREE.Group();
    splitGroup.position.copy(center);
    splitGroup.rotation.x = Math.PI / 2;
    
    // Base fracture ring
    const ringGeo = new THREE.RingGeometry(0.3, 0.55, 6, 2); // Hexagonal = fractured look
    const ringMat = this.createBasicMaterial(color, 0.5, THREE.DoubleSide);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    splitGroup.add(ring);
    
    // Shards — 6 triangular pieces drifting outward
    const shardMat = this.createBasicMaterial(color, 0.6, THREE.DoubleSide);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const shardGeo = new THREE.BufferGeometry();
      // Simple triangle
      const vertices = new Float32Array([
        0, 0, 0,
        Math.cos(angle) * 0.2, Math.sin(angle) * 0.2, 0,
        Math.cos(angle + 0.3) * 0.25, Math.sin(angle + 0.3) * 0.25, 0
      ]);
      shardGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      shardGeo.computeVertexNormals();
      const shard = new THREE.Mesh(shardGeo, shardMat.clone());
      shard.userData = { role: 'shard', angle, driftSpeed: 1.5 + Math.random() * 1.5 };
      splitGroup.add(shard);
    }
    
    // Central crack — octahedron splitting apart
    const crackGeo = new THREE.OctahedronGeometry(0.12, 0);
    const crackMat = this.createBasicMaterial(
      (new THREE.Color(color)).lerp(new THREE.Color(this.palette.mutedRose), 0.22).getHex(), 0.8
    );
    crackMat.wireframe = true;
    const crack = new THREE.Mesh(crackGeo, crackMat);
    crack.userData = { role: 'crack' };
    splitGroup.add(crack);
    
    splitGroup.userData = {
      colonyId: colonyId,
      type: 'split-event',
      elapsed: 0,
      lifetime: 1.0,
      pulseSpeed: 2.4,
      wobble: Math.random() * 0.4 + 0.2
    };

    this.vfxContainer.add(splitGroup);
    return splitGroup;
  }

  triggerMergeFlash(colonyId, center, intensity = 1.0, duration = 0.6) {
    const geometry = new THREE.RingGeometry(0.28, 0.42 + intensity * 0.06, 32, 2);
    const material = this.createBasicMaterial(this.palette.frost, 0.52, THREE.DoubleSide);
    const flash = new THREE.Mesh(geometry, material);
    flash.position.copy(center);
    flash.rotation.x = Math.PI / 2;
    flash.userData = {
      colonyId,
      type: 'merge-flash',
      elapsed: 0,
      lifetime: duration,
      intensity
    };
    this.vfxContainer.add(flash);
    this.triggerEventPulse(colonyId, 0.9 * intensity, duration * 0.85);
    this.triggerEventColorShift(colonyId, this.palette.frost, duration * 0.45);
    return flash;
  }

  triggerSplitRupture(colonyId, center, intensity = 1.0, duration = 1.0) {
    const geometry = new THREE.RingGeometry(0.35, 0.5 + intensity * 0.08, 32, 2);
    const material = this.createBasicMaterial(this.palette.mutedRose, 0.46, THREE.DoubleSide);
    const rupture = new THREE.Mesh(geometry, material);
    rupture.position.copy(center);
    rupture.rotation.x = Math.PI / 2;
    rupture.userData = {
      colonyId,
      type: 'rupture-event',
      elapsed: 0,
      lifetime: duration,
      intensity
    };
    this.vfxContainer.add(rupture);
    this.triggerEventPulse(colonyId, 0.65 * intensity, duration * 0.75);
    this.triggerEventColorShift(colonyId, this.palette.mutedRose, duration * 0.7);
    return rupture;
  }

  /**
   * Trigger colony transformation event — "Morphic Shift"
   * An octahedron morphs into a dodecahedron via rotating intermediate shapes.
   * Symbolizes fundamental change of form.
   */
  triggerTransformationEvent(colonyId, center, duration = 1.0) {
    const transformGroup = new THREE.Group();
    transformGroup.position.copy(center);
    transformGroup.rotation.x = Math.PI / 2;
    
    // Shape A: Octahedron (the old form)
    const shapeAGeo = new THREE.OctahedronGeometry(0.3, 0);
    const shapeAMat = this.createBasicMaterial(this.palette.slate, 0.56, THREE.DoubleSide);
    shapeAMat.flatShading = true;
    const shapeA = new THREE.Mesh(shapeAGeo, shapeAMat);
    shapeA.userData = { role: 'morph-from' };
    transformGroup.add(shapeA);
    
    // Shape B: Dodecahedron (the new form)
    const shapeBGeo = new THREE.DodecahedronGeometry(0.28, 0);
    const shapeBMat = this.createBasicMaterial(this.palette.frost, 0.56, THREE.DoubleSide);
    shapeBMat.flatShading = true;
    const shapeB = new THREE.Mesh(shapeBGeo, shapeBMat);
    shapeB.scale.setScalar(0.01); // Start invisible
    shapeB.userData = { role: 'morph-to' };
    transformGroup.add(shapeB);
    
    // Rotating ring — transitional boundary
    const ringGeo = new THREE.RingGeometry(0.22, 0.38, 6, 2); // Hexagonal
    const ringMat = this.createBasicMaterial(this.palette.glowBlue, 0.18, THREE.DoubleSide);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.userData = { role: 'transition-ring' };
    transformGroup.add(ring);
    
    transformGroup.userData = {
      colonyId,
      type: 'transformation-event',
      elapsed: 0,
      lifetime: duration,
      shapeA,
      shapeB
    };
    this.vfxContainer.add(transformGroup);
    this.triggerEventPulse(colonyId, 0.7, duration * 0.9);
    return transformGroup;
  }

  /**
   * Trigger colony rebirth event — "Phoenix Ascent"
   * A rising diamond shape with wing-like triangles ascending upward.
   * Symbolizes rebirth — rising from ashes.
   */
  triggerRebirthEvent(colonyId, center, duration = 0.9) {
    const rebirthGroup = new THREE.Group();
    rebirthGroup.position.copy(center);
    
    // Phoenix core — elongated octahedron (diamond body)
    const coreGeo = new THREE.OctahedronGeometry(0.15, 0);
    coreGeo.scale(1, 2, 1); // Elongated vertically
    const coreMat = this.createBasicMaterial(this.palette.glowBlue, 0.58);
    coreMat.flatShading = true;
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.userData = { role: 'phoenix-core' };
    rebirthGroup.add(core);
    
    // Wings — two flat triangles (bird wings)
    const wingMat = this.createBasicMaterial(this.palette.ash, 0.34, THREE.DoubleSide);
    [-1, 1].forEach(side => {
      const wingGeo = new THREE.BufferGeometry();
      const w = 0.5 * side;
      const vertices = new Float32Array([
        0, 0, 0,
        w, 0.15, -0.1,
        w * 0.6, 0.3, 0.1
      ]);
      wingGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      wingGeo.computeVertexNormals();
      const wing = new THREE.Mesh(wingGeo, wingMat.clone());
      wing.userData = { role: 'wing', side };
      rebirthGroup.add(wing);
    });
    
    // Ascension glow — small bright sphere at top
    const glowGeo = new THREE.IcosahedronGeometry(0.05, 0);
    const glowMat = this.createBasicMaterial(this.palette.frost, 0.52);
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.y = 0.35;
    glow.userData = { role: 'ascension-glow' };
    rebirthGroup.add(glow);
    
    rebirthGroup.rotation.x = Math.PI / 2;
    rebirthGroup.userData = {
      colonyId,
      type: 'rebirth-event',
      elapsed: 0,
      lifetime: duration
    };
    this.vfxContainer.add(rebirthGroup);
    this.triggerEventPulse(colonyId, 0.6, duration * 0.8);
    return rebirthGroup;
  }
  
  /**
   * Update event animations
   */
  updateEvents(deltaTime) {
    const children = [...this.vfxContainer.children];

    for (const child of children) {
      if (!child.userData) continue;

      const userData = child.userData;

      if (userData.type === 'birth-event') {
        userData.elapsed += deltaTime;
        const progress = userData.elapsed / userData.lifetime;

        child.scale.setScalar(0.1 + progress * userData.expandSpeed);
        // Fade all children (ring + helix strands)
        child.children.forEach(c => {
          if (c.material) c.material.opacity = (1 - progress) * (c.material.opacity > 0.5 ? 1.0 : 0.7);
        });
        // Spin helix strands in opposite directions
        if (userData.helix1) userData.helix1.rotation.z += deltaTime * 4.0;
        if (userData.helix2) userData.helix2.rotation.z -= deltaTime * 4.0;

        if (progress >= 1) {
          // Dispose children
          child.children.forEach(c => {
            if (c.geometry) c.geometry.dispose();
            if (c.material) c.material.dispose();
          });
          this.vfxContainer.remove(child);
        }
      }

      if (userData.type === 'collapse-event') {
        userData.elapsed += deltaTime;
        const progress = userData.elapsed / userData.lifetime;

        child.scale.setScalar(1.0 - progress * userData.collapseSpeed);
        child.material.opacity = 0.5 - progress * 0.5;

        if (progress >= 1) {
          this.vfxContainer.remove(child);
        }
      }

      if (userData.type === 'growth-event') {
        userData.elapsed += deltaTime;
        const progress = userData.elapsed / userData.lifetime;
        const scale = userData.initialScale + progress * 1.2;
        child.scale.setScalar(scale);
        child.rotation.y += deltaTime * 0.6;
        
        // Animate inner layers differently
        child.children.forEach(c => {
          if (c.material) {
            c.material.opacity = Math.max(0, (c.userData?.role === 'inner-breath' ? 0.4 : 0.25) - progress * 0.3);
          }
          // Counter-rotate inner breath for organic feel
          if (c.userData?.role === 'inner-breath') {
            c.rotation.y -= deltaTime * 1.2;
            c.rotation.x += deltaTime * 0.4;
          }
          if (c.userData?.role === 'outer-membrane') {
            c.rotation.y += deltaTime * 0.3;
          }
        });

        if (progress >= 1) {
          child.children.forEach(c => {
            if (c.geometry) c.geometry.dispose();
            if (c.material) c.material.dispose();
          });
          this.vfxContainer.remove(child);
        }
      }

      if (userData.type === 'merge-event') {
        userData.elapsed += deltaTime;
        const progress = userData.elapsed / userData.lifetime;
        child.scale.setScalar(1.0 + progress * 0.8);
        
        // Spiral convergence knots
        if (userData.knotA) {
          userData.knotA.rotation.y += deltaTime * userData.spinSpeed;
          userData.knotA.rotation.x += deltaTime * 0.5;
          if (userData.knotA.material) userData.knotA.material.opacity = Math.max(0, 0.5 - progress * 0.5);
        }
        if (userData.knotB) {
          userData.knotB.rotation.y -= deltaTime * userData.spinSpeed;
          userData.knotB.rotation.x -= deltaTime * 0.5;
          if (userData.knotB.material) userData.knotB.material.opacity = Math.max(0, 0.5 - progress * 0.5);
        }
        // Fade ring
        child.children.forEach(c => {
          if (c.material && !c.userData?.role) c.material.opacity = Math.max(0, 0.45 - progress * 0.45);
        });
        child.rotation.z += deltaTime * userData.spinSpeed;

        if (progress >= 1) {
          child.children.forEach(c => {
            if (c.geometry) c.geometry.dispose();
            if (c.material) c.material.dispose();
          });
          this.vfxContainer.remove(child);
        }
      }

      if (userData.type === 'split-event') {
        userData.elapsed += deltaTime;
        const progress = userData.elapsed / userData.lifetime;
        const baseScale = 1.0 + Math.sin(progress * Math.PI * 2) * 0.25;
        child.scale.setScalar(baseScale);
        child.rotation.y += deltaTime * (userData.pulseSpeed + userData.wobble);
        child.rotation.x += deltaTime * 0.4;
        
        // Animate shards drifting outward + fade all
        child.children.forEach(c => {
          if (c.userData?.role === 'shard') {
            const drift = progress * c.userData.driftSpeed;
            c.position.x += Math.cos(c.userData.angle) * drift * deltaTime * 2;
            c.position.y += Math.sin(c.userData.angle) * drift * deltaTime * 2;
          }
          if (c.userData?.role === 'crack') {
            c.rotation.x += deltaTime * 3;
            c.rotation.z += deltaTime * 2;
            c.scale.setScalar(1.0 + progress * 1.5);
          }
          if (c.material) c.material.opacity = Math.max(0, (c.userData?.role === 'crack' ? 0.8 : 0.5) - progress * 0.5);
        });

        if (progress >= 1) {
          child.children.forEach(c => {
            if (c.geometry) c.geometry.dispose();
            if (c.material) c.material.dispose();
          });
          this.vfxContainer.remove(child);
        }
      }

      if (userData.type === 'merge-flash') {
        userData.elapsed += deltaTime;
        const progress = userData.elapsed / userData.lifetime;
        child.scale.setScalar(1.0 + progress * 1.5 * (userData.intensity || 1));
        child.material.opacity = Math.max(0, 0.88 - progress * 0.95);
        child.rotation.z += deltaTime * 3.2;

        if (progress >= 1) {
          this.vfxContainer.remove(child);
        }
      }

      if (userData.type === 'rupture-event') {
        userData.elapsed += deltaTime;
        const progress = userData.elapsed / userData.lifetime;
        child.scale.setScalar(1.0 + progress * 1.8 * (userData.intensity || 1));
        child.material.opacity = Math.max(0, 0.78 - progress * 0.82);
        child.rotation.z += deltaTime * 3.8;

        if (progress >= 1) {
          this.vfxContainer.remove(child);
        }
      }

      if (userData.type === 'transformation-event') {
        userData.elapsed += deltaTime;
        const progress = userData.elapsed / userData.lifetime;
        
        // Morph: shape A shrinks, shape B grows
        child.children.forEach(c => {
          if (c.userData?.role === 'morph-from' && c.material) {
            c.scale.setScalar(Math.max(0.01, 1.0 - progress * 1.5));
            c.rotation.y += deltaTime * 2.0;
            c.rotation.x += deltaTime * 1.0;
            c.material.opacity = Math.max(0, 0.72 * (1.0 - progress * 1.5));
          }
          if (c.userData?.role === 'morph-to') {
            c.scale.setScalar(Math.min(1.0, progress * 1.5));
            c.rotation.y -= deltaTime * 2.0;
            c.rotation.x -= deltaTime * 1.0;
            if (c.material) c.material.opacity = Math.min(0.72, progress * 1.5 * 0.72);
          }
          if (c.userData?.role === 'transition-ring') {
            c.rotation.z += deltaTime * 3.0;
            c.scale.setScalar(1.0 + Math.sin(progress * Math.PI) * 0.5);
            if (c.material) c.material.opacity = Math.sin(progress * Math.PI) * 0.3;
          }
        });
        child.scale.setScalar(1.0 + Math.sin(progress * Math.PI) * 0.22);
        child.rotation.y += deltaTime * 1.1;

        if (progress >= 1) {
          child.children.forEach(c => {
            if (c.geometry) c.geometry.dispose();
            if (c.material) c.material.dispose();
          });
          this.vfxContainer.remove(child);
        }
      }

      if (userData.type === 'rebirth-event') {
        userData.elapsed += deltaTime;
        const progress = userData.elapsed / userData.lifetime;
        const ascent = progress * 2.0; // Rise upward
        
        child.children.forEach(c => {
          if (c.userData?.role === 'phoenix-core') {
            c.rotation.y += deltaTime * 3.0;
            if (c.material) c.material.opacity = Math.max(0, 0.8 - progress * 0.8);
          }
          if (c.userData?.role === 'wing') {
            // Flap wings
            const flapAngle = Math.sin(progress * Math.PI * 6) * 0.3;
            c.rotation.z = flapAngle * c.userData.side;
            if (c.material) c.material.opacity = Math.max(0, 0.5 - progress * 0.5);
          }
          if (c.userData?.role === 'ascension-glow') {
            c.position.y = 0.35 + progress * 0.5;
            c.scale.setScalar(1.0 + progress * 2.0);
            if (c.material) c.material.opacity = Math.max(0, 0.9 - progress);
          }
        });
        
        // Rise the whole group
        child.position.y += deltaTime * ascent;
        child.scale.setScalar(0.6 + progress * 1.6);
        child.rotation.z += deltaTime * 2.2;

        if (progress >= 1) {
          child.children.forEach(c => {
            if (c.geometry) c.geometry.dispose();
            if (c.material) c.material.dispose();
          });
          this.vfxContainer.remove(child);
        }
      }
    }
  }

  /**
   * Apply temporary world event modifiers to VFX elements
   */
  updateWorldEventEffects(deltaTime) {
    const time = performance.now() * 0.001;
    for (const child of this.vfxContainer.children) {
      const userData = child.userData;
      if (!userData) continue;

      if (userData.eventColorShift && child.material) {
        userData.eventColorShift.timer += deltaTime;
        const progress = Math.min(1, userData.eventColorShift.timer / userData.eventColorShift.duration);
        const blend = Math.sin(progress * Math.PI * 0.5);
        const baseColor = new THREE.Color(userData.eventColorShift.baseColor);
        const targetColor = new THREE.Color(userData.eventColorShift.targetColor);
        baseColor.lerp(targetColor, blend);
        child.material.color.copy(baseColor);

        if (progress >= 1) {
          child.material.color.setHex(userData.eventColorShift.baseColor);
          delete userData.eventColorShift;
        }
      }

      if (userData.eventPulse) {
        userData.eventPulse.timer += deltaTime;
        const progress = Math.min(1, userData.eventPulse.timer / userData.eventPulse.duration);
        const pulseScale = 1 + userData.eventPulse.intensity * (1 - progress) * 0.3;
        if (userData.baseScale) {
          child.scale.copy(userData.baseScale).multiplyScalar(pulseScale);
        } else {
          child.scale.setScalar(pulseScale);
        }

        if (progress >= 1) {
          delete userData.eventPulse;
        }
      }

      if (userData.eventGlow && child.userData.type === 'central-glow' && child.material) {
        userData.eventGlow.timer += deltaTime;
        const progress = Math.min(1, userData.eventGlow.timer / userData.eventGlow.duration);
        const boost = userData.eventGlow.intensity * (1 - progress);
        child.material.opacity = Math.min(1, 0.3 + boost * 0.8);
        child.scale.setScalar(1 + boost * 0.35);

        if (progress >= 1) {
          delete userData.eventGlow;
        }
      }

      if (userData.eventCrown && child.userData.type === 'legendary-crown') {
        userData.eventCrown.timer += deltaTime;
        const progress = Math.min(1, userData.eventCrown.timer / userData.eventCrown.duration);
        const intensity = userData.eventCrown.intensity * (1 - progress);
        child.rotation.y += deltaTime * (0.8 + intensity * 1.2);

        if (child.children) {
          child.children.forEach(spike => {
            if (spike.material) {
              spike.material.opacity = 0.7 + intensity * 0.3;
            }
          });
        }

        if (progress >= 1) {
          delete userData.eventCrown;
        }
      }

      if (userData.eventDeform && (userData.type === 'orbit-ring' || userData.type === 'sigil-ring')) {
        userData.eventDeform.timer += deltaTime;
        const progress = Math.min(1, userData.eventDeform.timer / userData.eventDeform.duration);
        const deformValue = Math.sin(time * 10) * userData.eventDeform.amount * (1 - progress);
        child.scale.x = 1 + deformValue;
        child.scale.z = 1 - deformValue;

        if (progress >= 1) {
          child.scale.x = 1;
          child.scale.z = 1;
          delete userData.eventDeform;
        }
      }

      if (userData.fadeOut) {
        userData.fadeOut.timer += deltaTime;
        if (userData.fadeOut.delay && userData.fadeOut.timer < userData.fadeOut.delay) {
          continue;
        }

        const fadeProgress = Math.min(1, (userData.fadeOut.timer - (userData.fadeOut.delay || 0)) / userData.fadeOut.duration);
        const baseOpacity = userData.fadeOut.startOpacity ?? (child.material?.opacity ?? 1);
        const opacity = Math.max(0, baseOpacity * (1 - fadeProgress));

        if (child.material) {
          child.material.opacity = opacity;
        }

        if (fadeProgress >= 1) {
          this.releaseVFXObject(child);
          continue;
        }
      }
    }
  }

  /**
   * Clean up VFX for a colony
   */
  cleanupColonyVFX(colonyId, options = {}) {
    // BLOOM: Remove bloom overlays for this colony first
    if (this.bloomOverlay) {
      this.bloomOverlay.removeForColony(colonyId);
    }

    const children = [...this.vfxContainer.children];
    const duration = options.duration ?? 0.9;
    const delay = options.delay ?? 0;
    const soft = options.soft === true;

    for (const child of children) {
      if (child.userData && child.userData.colonyId === colonyId) {
        if (soft) {
          child.userData.fadeOut = {
            timer: 0,
            duration,
            delay,
            startOpacity: child.material?.opacity ?? 1
          };
          continue;
        }

        this.releaseVFXObject(child);
      }
    }

    this._releaseColonyParticles(colonyId, { soft, duration, delay });
  }
  
  /**
   * Get color based on mood
   */
  getMoodProfile(mood) {
    const effectiveMood = mood === 'CALM' ? 'HARMONY' : mood;
    return this.config.moodVisualBiasMap[effectiveMood] || this.config.moodProfiles.HARMONY;
  }

  blendColor(baseColor, biasColor, bias) {
    const r = ((baseColor >> 16) & 0xff) * (1 - bias) + ((biasColor >> 16) & 0xff) * bias;
    const g = ((baseColor >> 8) & 0xff) * (1 - bias) + ((biasColor >> 8) & 0xff) * bias;
    const b = (baseColor & 0xff) * (1 - bias) + (biasColor & 0xff) * bias;
    return ((Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)) >>> 0;
  }

  getColorForMood(mood, colonyType) {
    const effectiveMood = mood === 'CALM' ? 'HARMONY' : mood;
    if (this.config.colors[effectiveMood]) {
      return this.config.colors[effectiveMood];
    }
    
    if (this.config.colors[colonyType]) {
      return this.config.colors[colonyType];
    }
    
    return this.config.colors.DEFAULT;
  }

  _getDistanceLODController() {
    if (typeof globalThis === 'undefined') return null;
    return globalThis.window?.ATOMA_DISTANCE_LOD || globalThis.ATOMA_DISTANCE_LOD || null;
  }

  _getColonyLODProfile(colony) {
    const controller = this._getDistanceLODController();
    if (controller?.getColonyLODProfile && colony?.center) {
      return controller.getColonyLODProfile(colony.center, 20, 50);
    }

    return {
      level: 0,
      visualScale: 1.0,
      particleScale: 1.0,
      motionScale: 1.0,
      cadenceScale: 1.0,
      allowAtmosphere: true,
      allowGlow: true,
      allowCore: true,
      allowCanopy: true,
      allowParticles: true,
      allowRings: true,
      maxRings: this.config.rings.maxRings,
      allowBeam: true
    };
  }

  _hasActiveColonyParticles(vfx) {
    return Array.isArray(vfx?.particles) && vfx.particles.some((particle) => {
      const userData = particle?.userData;
      return Boolean(userData && !userData.__released && !userData.fadeOut);
    });
  }

  _applyColonyLODProfile(colonyId, colony, vfx, lodProfile) {
    if (!vfx || !lodProfile) return;

    const level = lodProfile.level ?? 0;
    const allowParticles = lodProfile.allowParticles !== false;
    const allowRings = lodProfile.allowRings !== false;
    const maxRings = Number.isFinite(lodProfile.maxRings) ? lodProfile.maxRings : this.config.rings.maxRings;

    vfx.lodProfile = lodProfile;
    vfx.lodLevel = level;

    if (vfx.atmosphere) {
      vfx.atmosphere.visible = true;
      if (vfx.atmosphere.userData) {
        vfx.atmosphere.userData.lodScale = lodProfile.visualScale ?? 1;
        vfx.atmosphere.userData.lodMotionScale = lodProfile.motionScale ?? 1;
      }
    }

    if (vfx.glow) {
      vfx.glow.visible = lodProfile.allowGlow !== false;
    }

    if (vfx.core) {
      vfx.core.visible = lodProfile.allowCore === true;
    }

    if (vfx.canopy) {
      vfx.canopy.visible = lodProfile.allowCanopy === true;
    }

    if (vfx.beam) {
      vfx.beam.visible = lodProfile.allowBeam === true;
    }

    if (vfx.crown) {
      vfx.crown.visible = level === 0;
    }

    if (vfx.legendaryHalo) {
      vfx.legendaryHalo.visible = level === 0;
    }

    if (vfx.legendaryPresence) {
      vfx.legendaryPresence.visible = level === 0;
    }

    if (Array.isArray(vfx.sigils)) {
      for (const sigil of vfx.sigils) {
        if (sigil) sigil.visible = level === 0;
      }
    }

    if (Array.isArray(vfx.rings)) {
      for (const ring of vfx.rings) {
        if (!ring) continue;
        const ringIndex = ring.userData?.ringIndex ?? 0;
        ring.visible = allowRings && ringIndex < maxRings;
      }
    }

    if (!allowParticles) {
      if (this._hasActiveColonyParticles(vfx)) {
        this._releaseColonyParticles(colonyId, { soft: false });
      }
      vfx.particles = [];
      vfx.lodParticleState = 'suppressed';
      return;
    }

    const hasActiveParticles = this._hasActiveColonyParticles(vfx);
    if (!hasActiveParticles && vfx.lodParticleState !== 'active') {
      vfx.particles = this.createParticles(
        colonyId,
        colony.center,
        colony.stage,
        colony.mood,
        colony.type,
        colony.energy
      );
      vfx.lodParticleState = 'active';
    } else if (hasActiveParticles) {
      vfx.lodParticleState = 'active';
    }
  }
  
  /**
   * Get radius based on stage
   */
  getRadiusForStage(stage) {
    return 1.0 + stage * 0.3;
  }
  
  /**
   * Full update cycle
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunSimulation?.()) return;
    this.updateParticles(deltaTime);
    this.updateAtmospheres(deltaTime);
    this.updateMoodCanopies(deltaTime);
    this.updateRings(deltaTime);
    this.updateCentralGlows(deltaTime);
    this.updateCores(deltaTime);
    this.updateSigils(deltaTime);
    this.updateBeams(deltaTime);
    this.updateLegendaryCrowns(deltaTime);
    this.updateLegendaryHalos(deltaTime);
    this.updateLegendaryPresence(deltaTime);
    this.updateEvents(deltaTime);
    this.updateWorldEventEffects(deltaTime);
    this.updateTransitions(deltaTime);

    // BLOOM: Update sprite overlays to track colony cores/glows
    if (this.bloomOverlay) {
      this.bloomOverlay.update(deltaTime);
    }

    // PERFORMANCE: Flush InstancedMesh buffers if any instance was updated
    if (this._atmoDirty && this._atmoInstanceMesh) {
      this._atmoInstanceMesh.instanceMatrix.needsUpdate = true;
      if (this._atmoInstanceMesh.instanceColor) {
        this._atmoInstanceMesh.instanceColor.needsUpdate = true;
      }
      this._atmoDirty = false;
    }
  }
  

  triggerMergeTransition(sourceIds, mergedCenter, duration = 1.0) {
    for (const child of this.vfxContainer.children) {
      if (!child.userData || !sourceIds.includes(child.userData.colonyId)) continue;
      child.userData.transition = {
        type: 'merge',
        targetCenter: mergedCenter.clone(),
        duration,
        timer: 0,
        startPosition: child.position.clone(),
        startOpacity: child.material?.opacity ?? 1
      };
      this.transitioningVFX.add(child);
    }

    for (const sourceId of sourceIds) {
      const handles = this._particleColonySlots.get(sourceId);
      if (!handles || handles.size === 0) continue;

      for (const particle of handles) {
        const userData = particle?.userData;
        if (!userData || userData.__released) continue;

        userData.mergeAbsorb = {
          timer: 0,
          duration,
          sourceCenter: userData.startPos?.clone?.() || new THREE.Vector3(),
          targetCenter: mergedCenter.clone()
        };

        userData.lifetime = Math.max(
          userData.lifetime ?? 0,
          (userData.elapsed ?? 0) + duration + 0.05
        );
      }
    }
  }

  triggerSplitTransition(colonyId, duration = 1.2, targetCenters = []) {
    for (const child of this.vfxContainer.children) {
      if (!child.userData || child.userData.colonyId !== colonyId) continue;
      const direction = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 0.5 + 0.2,
        (Math.random() - 0.5) * 2
      ).normalize();
      child.userData.transition = {
        type: 'split',
        duration,
        timer: 0,
        direction,
        startOpacity: child.material?.opacity ?? 1
      };

      if (child.userData.type === 'mood-canopy' && targetCenters.length >= 2) {
        child.userData.splitTear = {
          timer: 0,
          duration,
          sourceCenter: child.position.clone(),
          targetCenters: targetCenters.map((target) => target.clone())
        };
      }

      this.transitioningVFX.add(child);
    }
  }

  updateTransitions(deltaTime) {
    const time = performance.now() * 0.001;
    for (const child of Array.from(this.transitioningVFX)) {
      const userData = child.userData;
      if (!userData?.transition) {
        this.transitioningVFX.delete(child);
        continue;
      }

      userData.transition.timer += deltaTime;
      const progress = Math.min(1, userData.transition.timer / userData.transition.duration);
      const ease = progress * progress * (3 - 2 * progress);

      if (userData.transition.type === 'merge') {
        child.position.lerpVectors(userData.transition.startPosition, userData.transition.targetCenter, ease);
        if (child.material) {
          child.material.opacity = Math.max(0, userData.transition.startOpacity * (1 - ease));
        }
      }

      if (userData.transition.type === 'split') {
        child.position.addScaledVector(userData.transition.direction, deltaTime * 0.6);
        child.rotation.y += deltaTime * 1.4;
        if (child.material) {
          child.material.opacity = Math.max(0, userData.transition.startOpacity * (1 - ease * 1.2));
        }
      }

      if (progress >= 1) {
        const transitionType = userData.transition.type;
        delete userData.transition;
        this.transitioningVFX.delete(child);
        if (transitionType === 'split') {
          this.releaseVFXObject(child);
        } else {
          this.releaseVFXObject(child);
        }
      }
    }
  }

  /**
   * Trigger a rapid expansion pulse in civilization VFX
   */
  triggerEventPulse(colonyId, intensity = 1.0, duration = 0.8) {
    for (const child of this.vfxContainer.children) {
      if (child.userData?.colonyId !== colonyId) continue;
      const type = child.userData.type;
      if (['atmosphere', 'orbit-ring', 'sigil-ring', 'ascension-beam', 'core', 'central-glow', 'legendary-halo', 'mood-canopy'].includes(type)) {
        child.userData.eventPulse = {
          intensity,
          duration,
          timer: 0
        };
        if (!child.userData.baseScale) {
          child.userData.baseScale = child.scale.clone();
        }
      }
    }
  }

  /**
   * Trigger temporary color displacement for a world event
   */
  triggerEventColorShift(colonyId, targetColor, duration = 1.2) {
    for (const child of this.vfxContainer.children) {
      if (child.userData?.colonyId !== colonyId || !child.material) continue;
      child.userData.eventColorShift = {
        targetColor,
        baseColor: child.userData.baseColor ?? child.material.color.getHex(),
        duration,
        timer: 0
      };
    }
  }

  /**
   * Activate legendary crown reaction to an event
   */
  activateEventCrown(colonyId, duration = 1.5) {
    for (const child of this.vfxContainer.children) {
      if (child.userData?.colonyId !== colonyId || child.userData?.type !== 'legendary-crown') continue;
      child.userData.eventCrown = {
        intensity: 1.0,
        duration,
        timer: 0
      };
    }
  }

  /**
   * Intensify central glow for a world event
   */
  intensifyEventGlow(colonyId, intensity = 0.8, duration = 1.4) {
    for (const child of this.vfxContainer.children) {
      if (child.userData?.colonyId !== colonyId) continue;
      if (child.userData.type === 'central-glow') {
        child.userData.eventGlow = {
          intensity,
          duration,
          timer: 0
        };
      }
    }
  }

  /**
   * Deform rings to communicate storm or invasion energy
   */
  deformEventRings(colonyId, amount = 0.35, duration = 1.2) {
    for (const child of this.vfxContainer.children) {
      if (child.userData?.colonyId !== colonyId) continue;
      if (['orbit-ring', 'sigil-ring'].includes(child.userData.type)) {
        child.userData.eventDeform = {
          amount,
          duration,
          timer: 0
        };
        if (!child.userData.baseScale) {
          child.userData.baseScale = child.scale.clone();
        }
      }
    }
  }

  boostEventRingSpin(colonyId, amount = 0.25, duration = 1.2) {
    for (const child of this.vfxContainer.children) {
      if (child.userData?.colonyId !== colonyId) continue;
      if (child.userData.type === 'orbit-ring') {
        child.userData.eventSpinBoost = {
          amount,
          duration,
          timer: 0
        };
      }
    }
  }

  cleanup() {
    if (this.bloomOverlay) {
      this.bloomOverlay.dispose();
      this.bloomOverlay = null;
    }
    this._disposeParticleCloud();
    this.vfxContainer.clear();
    this.scene.remove(this.vfxContainer);
  }
}
