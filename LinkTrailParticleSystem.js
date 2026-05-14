/**
 * LinkTrailParticleSystem.js
 * ============================================================================
 * PARTICLE TRAILS ALONG LINKS - UNIFIED AESTHETIC
 * 
 * Emits organic particle trails that flow along links, using the SAME noise
 * function as the link aura and node aura systems. Particles follow links
 * from source to target, creating visual continuity of energy flow.
 * 
 * Design Principles:
 * - Same Simplex-like noise for trajectory calculation
 * - Pooled particles (no new allocations per frame)
 * - Directional flow from source → target
 * - Color & size tied to link state (harmony/corruption)
 * - Smooth fade-in/out (no pop)
 * - Synchronized animation timing with aura systems
 * 
 * Performance:
 * - Particle pool: reused meshes (not created/destroyed)
 * - Noise calculation: GPU-free (CPU, ~microseconds per particle)
 * - Memory: fixed allocation per link
 * - Update: <1ms for 100 particles
 * 
 * @author VFX Technical Director — ATOMA Project
 * @version 1.0.0
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { getLinkSynergyVisualMetrics } from './SemanticMetricAdapter.js';
import { applyLinkRenderLayer } from './LinkRenderLayerPolicy.js';
import { LinkPointFXBase } from './LinkPointFXBase.js';

/**
 * Shared noise function (identical to LinkAuraShader)
 * Used for particle trajectory modulation
 */
class NoiseGenerator {
  constructor() {
    // Pre-computed permutation table for Simplex noise
    this.p = [
      151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140,
      36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120,
      234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
      88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71,
      134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133,
      230, 206, 39, 142, 9, 103, 14, 28, 12, 231, 243, 97, 163, 130, 237, 174,
      212, 39, 146, 210, 41, 10, 172, 32, 86, 153, 60, 154, 111, 151, 140, 151,
      163, 130, 237, 70, 131, 249, 11, 133, 142, 32, 112, 106, 226, 14, 175, 17,
      255, 215, 48, 89, 76, 75, 145, 47, 210, 192, 37, 93, 82, 132, 224, 103, 157,
      63, 151, 140, 251, 38, 88, 104, 40, 166, 26, 224, 57, 216, 119, 228, 159, 28,
      142, 79, 124, 221, 184, 179, 54, 192, 67, 82, 220, 133, 157, 63, 48, 89, 76,
      75, 82, 50, 61, 59, 156, 23, 163, 130, 237, 174, 214, 21, 135, 161, 20, 125,
      242, 156, 199, 234, 123, 160, 237, 174, 212, 39, 146, 210, 41, 10, 172, 32,
      86, 153, 60, 154, 111, 151, 140, 151, 163, 130, 237, 170, 150, 180, 167, 237,
      85, 173, 173, 95, 229, 122, 60, 211, 133, 230, 206, 39, 142, 9, 103, 14, 28,
      12, 231, 243, 97, 163, 130, 237, 174, 212, 39, 146, 210, 41, 10, 172, 32
    ];
  }

  /**
   * 3D Simplex-like noise (approximation)
   * Input: 3D point
   * Output: [-1, 1] noise value
   * 
   * Uses same algorithm as LinkAuraShader for consistency
   */
  snoise(x, y, z) {
    // Gradient fade
    const t = [
      x - Math.floor(x),
      y - Math.floor(y),
      z - Math.floor(z)
    ];

    // Smooth interpolation
    const u = [
      t[0] * t[0] * (3.0 - 2.0 * t[0]),
      t[1] * t[1] * (3.0 - 2.0 * t[1]),
      t[2] * t[2] * (3.0 - 2.0 * t[2])
    ];

    const i = [
      Math.floor(x),
      Math.floor(y),
      Math.floor(z)
    ];

    // Hash indices
    const h = (ix, iy, iz) => {
      let n = this.p[(this.p[(this.p[ix & 255] + iy) & 255] + iz) & 255];
      return n & 15; // Reduce to 0-15 for gradient
    };

    // Gradient function (simple)
    const grad = (hash, x, y, z) => {
      const g = hash & 3;
      const xx = (g & 1) ? x : -x;
      const yy = (g & 2) ? y : -y;
      return xx + yy;
    };

    // Calculate 8 corner gradients
    let n0 = grad(h(i[0], i[1], i[2]), t[0], t[1], t[2]);
    let n1 = grad(h(i[0] + 1, i[1], i[2]), t[0] - 1.0, t[1], t[2]);
    let ix0 = this.lerp(n0, n1, u[0]);

    let n2 = grad(h(i[0], i[1] + 1, i[2]), t[0], t[1] - 1.0, t[2]);
    let n3 = grad(h(i[0] + 1, i[1] + 1, i[2]), t[0] - 1.0, t[1] - 1.0, t[2]);
    let ix1 = this.lerp(n2, n3, u[0]);

    let ixy0 = this.lerp(ix0, ix1, u[1]);

    let n4 = grad(h(i[0], i[1], i[2] + 1), t[0], t[1], t[2] - 1.0);
    let n5 = grad(h(i[0] + 1, i[1], i[2] + 1), t[0] - 1.0, t[1], t[2] - 1.0);
    let ix2 = this.lerp(n4, n5, u[0]);

    let n6 = grad(h(i[0], i[1] + 1, i[2] + 1), t[0], t[1] - 1.0, t[2] - 1.0);
    let n7 = grad(h(i[0] + 1, i[1] + 1, i[2] + 1), t[0] - 1.0, t[1] - 1.0, t[2] - 1.0);
    let ix3 = this.lerp(n6, n7, u[0]);

    let ixy1 = this.lerp(ix2, ix3, u[0]);

    return this.lerp(ixy0, ixy1, u[2]) * 0.5; // Scale to [-0.5, 0.5]
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * Multi-octave noise (same as LinkAuraShader)
   * For organic, complex patterns
   */
  multiOctaveNoise(x, y, z, time) {
    // Offset by time for flow
    x += time * 0.3;
    y += time * 0.2;
    z += time * 0.15;

    // Same octave structure as aura shaders
    const noise1 = this.snoise(x * 2.0, y * 2.0, z * 2.0);
    const noise2 = this.snoise(x * 4.0, y * 4.0, z * 4.0) * 0.5;
    const noise3 = this.snoise(x * 8.0, y * 8.0, z * 8.0) * 0.25;

    return (noise1 + noise2 + noise3) / 1.75; // Normalized
  }
}

// Strand-tip spark helpers are kept local to this file so the visual owner
// can live here without importing back into the conduit.
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const COLOR_WHITE = new THREE.Color(0xffffff);
const TRAIL_BASE_COLOR = new THREE.Color(0xddddee);
const TRAIL_HARMONY_COLOR = new THREE.Color(0xccddff);
const TRAIL_SYNERGY_COLOR = new THREE.Color(0xe7f7ff);
const TRAIL_CORRUPTION_COLOR = new THREE.Color(0xff6666);
const TRAIL_HEALING_COLOR = new THREE.Color(0x9cecff);
const TRAIL_HEALING_BLEND_COLOR = new THREE.Color(0xc9fff2);
const TRAIL_SPARK_COLOR = new THREE.Color(0xffcc88);
const TRAIL_SPARK_BLEND_COLOR = new THREE.Color(0xfff2aa);
const TRAIL_WORLD_UP = new THREE.Vector3(0, 1, 0);
const TRAIL_WORLD_RIGHT = new THREE.Vector3(1, 0, 0);
const WAVE_SPARK_GLYPH = {
  SLIVER: 0,
  NOTCH: 1,
  RUNE: 2,
  EMBER: 3
};
const WAVE_SPARK_RATIOS = {
  default: [0.52, 0.22, 0.16, 0.10],
  tipDetach: [0.45, 0.10, 0.10, 0.35],
  microJump: [0.30, 0.25, 0.40, 0.05],
  bridgeContact: [0.25, 0.40, 0.30, 0.05]
};
// Polish: +15% size across all glyphs for better visibility
const WAVE_SPARK_PROFILE = [
  { lifeMin: 0.18, lifeMax: 0.32, sizeMin: 8.0, sizeMax: 15.0, speedMin: 0.95, speedMax: 1.45, spinMin: -1.2, spinMax: 1.2, gainMin: 0.55, gainMax: 0.85, accentMix: 0.20, hotMix: 0.14 },
  { lifeMin: 0.22, lifeMax: 0.38, sizeMin: 9.2, sizeMax: 16.1, speedMin: 0.72, speedMax: 1.08, spinMin: -1.8, spinMax: 1.8, gainMin: 0.42, gainMax: 0.70, accentMix: 0.45, hotMix: 0.14 },
  { lifeMin: 0.14, lifeMax: 0.26, sizeMin: 10.4, sizeMax: 18.4, speedMin: 0.82, speedMax: 1.20, spinMin: -2.1, spinMax: 2.1, gainMin: 0.48, gainMax: 0.78, accentMix: 0.50, hotMix: 0.20 },
  { lifeMin: 0.09, lifeMax: 0.18, sizeMin: 6.9, sizeMax: 12.7, speedMin: 1.15, speedMax: 1.85, spinMin: -2.8, spinMax: 2.8, gainMin: 0.65, gainMax: 1.0, accentMix: 0.15, hotMix: 0.72 }
];
const weightedPickIndex = (weights) => {
  let total = 0;
  for (let i = 0; i < weights.length; i += 1) total += Math.max(0, weights[i] || 0);
  if (total <= 0) return 0;
  let cursor = Math.random() * total;
  for (let i = 0; i < weights.length; i += 1) {
    cursor -= Math.max(0, weights[i] || 0);
    if (cursor <= 0) return i;
  }
  return Math.max(0, weights.length - 1);
};
const randRange = (min, max) => min + Math.random() * (max - min);
const strandSparkVertexShader = `
    attribute vec3 aColor;
    attribute float aSize;
    attribute float aShape;
    attribute float aAngle;
    attribute float aSpin;
    attribute float aBirth;
    attribute float aDuration;
    attribute float aGain;

    uniform float uTime;
    uniform float uGlobalOpacity;

    varying vec3 vColor;
    varying float vShape;
    varying float vAge;
    varying float vAngle;
    varying float vGain;

    void main() {
        float duration = max(0.0001, aDuration);
        float age = (uTime - aBirth) / duration;
        vAge = age;
        vColor = aColor;
        vShape = aShape;
        vAngle = aAngle + (uTime - aBirth) * aSpin;
        vGain = aGain * uGlobalOpacity;

        if (age < 0.0 || age > 1.0) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            gl_PointSize = 0.0;
            return;
        }

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = aSize * (10.0 / -mvPosition.z);
    }
`;
const strandSparkFragmentShader = `
    precision highp float;

    varying vec3 vColor;
    varying float vShape;
    varying float vAge;
    varying float vAngle;
    varying float vGain;

    vec2 rot(vec2 p, float a) {
        float c = cos(a);
        float s = sin(a);
        return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
    }

    float shapeSliver(vec2 p) {
        float body = 1.0 - smoothstep(0.22, 0.48, abs(p.y) + abs(p.x) * 0.24);
        float core = 1.0 - smoothstep(0.06, 0.16, abs(p.y));
        return clamp(body * 0.75 + core * 0.25, 0.0, 1.0);
    }

    float shapeNotch(vec2 p) {
        float segA = 1.0 - smoothstep(0.10, 0.24, abs(p.y + 0.22));
        segA *= smoothstep(0.05, 0.44, abs(p.x));
        float segB = 1.0 - smoothstep(0.10, 0.24, abs(p.y - 0.18));
        segB *= smoothstep(0.05, 0.34, abs(p.x + 0.10));
        return clamp(max(segA, segB), 0.0, 1.0);
    }

    float shapeRune(vec2 p) {
        float r = length(p);
        float ringOuter = 1.0 - smoothstep(0.64, 0.84, r);
        float ringInner = smoothstep(0.32, 0.50, r);
        float ring = ringOuter * ringInner;
        float gap = smoothstep(-0.10, 0.24, p.x);
        float shard = 1.0 - smoothstep(0.12, 0.28, length(p - vec2(0.34, 0.0)));
        return clamp(ring * gap + shard * 0.5, 0.0, 1.0);
    }

    float shapeEmber(vec2 p) {
        float dia = 1.0 - smoothstep(0.52, 0.78, abs(p.x) + abs(p.y));
        float tail = 1.0 - smoothstep(0.10, 0.24, length(p - vec2(-0.24, 0.0)));
        return clamp(max(dia, tail * 0.75), 0.0, 1.0);
    }

    void main() {
        if (vAge < 0.0 || vAge > 1.0 || vGain <= 0.001) discard;

        vec2 p = gl_PointCoord * 2.0 - 1.0;
        p = rot(p, vAngle);

        float shape = 0.0;
        if (vShape < 0.5) {
            shape = shapeSliver(p);
        } else if (vShape < 1.5) {
            shape = shapeNotch(p);
        } else if (vShape < 2.5) {
            shape = shapeRune(p);
        } else {
            shape = shapeEmber(p);
        }

        // Polish: faster fade-in for snappier appearance (was 0.09)
        float fadeIn = smoothstep(0.0, 0.06, vAge);
        float fadeOut = 1.0 - smoothstep(0.68, 1.0, vAge);
        float core = 1.0 - smoothstep(0.0, 0.62, length(p));
        // Polish: more dynamic flicker range (was 0.88 + 0.12)
        float flicker = 0.84 + 0.18 * sin((1.0 - vAge) * 29.0 + vShape * 7.7 + p.x * 5.0);
        float alpha = shape * fadeIn * fadeOut * vGain * flicker;
        if (alpha < 0.01) discard;

        // Polish: hotter spark centers (was core * 0.32)
        vec3 color = vColor + vec3(core * 0.48);
        gl_FragColor = vec4(color, alpha);
    }
`;

/**
 * Single particle instance
 */
class TrailParticle {
  constructor(mesh) {
    this.mesh = mesh;
    this.active = false;
    
    // Position & velocity
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.acceleration = new THREE.Vector3();
    
    // Lifecycle
    this.age = 0;
    this.lifetime = 1.0; // seconds
    this.progress = 0; // 0-1 along link
    
    // Visual state
    this.scale = 1.0;
    this.opacity = 1.0;
    this.color = new THREE.Color(0x888888);
    
    // Link reference
    this.link = null;
    this.curve = null;
    this.sourceType = 'corruption';
    
    // Impact tracking
    this.lastProgress = -0.1;  // Track progress to detect arrival
    this.impactTriggered = false;  // Prevent duplicate impacts
    
    // Energy density modulation (for trail readability)
    this.energyIntensity = 1.0;  // [0-1] brightness modulation
    this.thicknessModulation = 1.0;  // [0-1] scale modulation
    this.trailVisibility = 1.0;  // [0-1] combined visibility envelope

    // Scratch buffers avoid per-frame allocations in hot path.
    this._frameScratch = new THREE.Vector3();
    this._curvePosScratch = new THREE.Vector3();
    this._normalA = new THREE.Vector3();
    this._normalB = new THREE.Vector3();
    this._offsetDir = new THREE.Vector3();
    this._brightenedColor = new THREE.Color();
    this._baseAngle = Math.random() * Math.PI * 2.0;
  }

  reset() {
    this.active = false;
    this.age = 0;
    this.progress = 0;
    this.lastProgress = -0.1;
    this.impactTriggered = false;
    this.sourceType = 'corruption';
    if (this.mesh) {
      this.mesh.visible = false;       // Hide frozen particle
      this.mesh.scale.setScalar(0);    // Collapse geometry to avoid lingering dots
    }
  }

  /**
   * Check if particle has arrived at destination (for impact detection)
   * @returns {boolean} True if particle just crossed threshold
   */
  checkArrival() {
    // Particle arrives at destination when progress crosses 0.95 (near end)
    const arrivalThreshold = 0.95;
    const hasArrived = this.lastProgress < arrivalThreshold && this.progress >= arrivalThreshold;
    this.lastProgress = this.progress;
    return hasArrived && !this.impactTriggered;
  }

  update(deltaTime, time, noise) {
    if (!this.active) return false;
    const safeDelta = Number.isFinite(deltaTime) ? Math.max(0, deltaTime) : 0;
    const safeTime = Number.isFinite(time) ? time : 0;

    this.age += safeDelta;
    if (this.age >= this.lifetime) {
      this.reset();
      return false;
    }

    // Fade in/out
    const fadeIn = Math.min(1.0, this.age / 0.1); // 100ms fade in
    const fadeOut = Math.max(0.0, 1.0 - (this.age - this.lifetime + 0.2) / 0.2); // 200ms fade out
    this.opacity = fadeIn * fadeOut;

    // Progress along link (directional flow)
    const flowSpeed = 1.5; // Units per second
    this.progress = (this.age * flowSpeed) % 1.0;

    // ========================================================================
    // ENERGY INTENSITY & THICKNESS MODULATION - TRAIL READABILITY ENHANCEMENT
    // ========================================================================
    // Synchronize with particle motion to make trails more readable
    // Uses subtle modulation without bloom/glow/halo effects
    
    // 1. MOTION-SYNCHRONIZED PULSING
    // Particles pulse in brightness as they move along the link
    // This creates subtle "pressure" indication without adding new effects
    
    // Wave function based on progress (0→1 along link)
    // Creates subtle undulation effect that follows particle motion
    const motionPhase = this.progress * Math.PI * 2.0;  // 0 to 2π
    const basePulse = Math.sin(motionPhase) * 0.5 + 0.5;  // Maps to [0.5, 1.0]
    
    // 2. TEMPORAL INTENSITY VARIATION
    // Energy intensity increases as particle progresses (more energy transferred along path)
    // Communicates "energy flowing along link" through progressive brightening
    const progressBrighten = 0.7 + (this.progress * 0.3);  // [0.7, 1.0] across link
    
    // 3. COMBINED ENERGY INTENSITY
    // Blend motion pulsing with progress brightening
    // Motion pulsing: 50% contribution (subtle wave)
    // Progress brightening: 50% contribution (indicates flow direction)
    this.energyIntensity = (basePulse * 0.5 + progressBrighten * 0.5);
    
    // 4. THICKNESS MODULATION - VARIES WITH MOTION
    // Particles swell slightly at peaks of motion pulse, compress at troughs
    // Range: 0.8x to 1.2x of base scale
    // This creates visual "echo" effect without adding geometry
    const thicknessWave = Math.sin(motionPhase + Math.PI / 4) * 0.2 + 1.0;  // [0.8, 1.2]
    this.thicknessModulation = thicknessWave;
    
    // 5. TRAIL VISIBILITY ENVELOPE
    // Combined visibility that considers particle state
    // Peaks at mid-journey (most energy in transit)
    // Gentle at start (still accelerating) and end (energy dissipating)
    const midpointBoost = Math.sin(this.progress * Math.PI) * 0.2 + 1.0;  // Peaks at 0.5
    this.trailVisibility = this.opacity * midpointBoost;

    if (this.curve) {
      // Get position on curve
      const curvePos = this.curve.getPointAt(this.progress, this._curvePosScratch);
      
      // Add positional jitter in a radial shell around link path
      const tangent = this._getFrameAtProgress(this.progress);
      const noiseVal = noise.multiOctaveNoise(
        curvePos.x * 0.5,
        curvePos.y * 0.5,
        curvePos.z * 0.5 + safeTime
      );

      // Curved offset radius and drift
      const shellRadius = 0.18 + Math.abs(noiseVal) * 0.24;
      const drift = Math.sin(this._baseAngle + safeTime * 0.8) * 0.5;

      if (tangent && tangent.lengthSq() > 1e-6) {
        // Build stable perpendicular coordinate frame (A,B) for offset
        this._normalA.copy(tangent).cross(TRAIL_WORLD_UP).normalize();
        if (this._normalA.lengthSq() < 1e-5) {
          this._normalA.copy(tangent).cross(TRAIL_WORLD_RIGHT).normalize();
        }
        this._normalB.copy(tangent).cross(this._normalA).normalize();

        const wanderAngle = this._baseAngle + noiseVal * Math.PI * 0.8 + drift;
        const cosA = Math.cos(wanderAngle);
        const sinA = Math.sin(wanderAngle);
        this._offsetDir.copy(this._normalA).multiplyScalar(cosA).addScaledVector(this._normalB, sinA).normalize();

        this.position.copy(curvePos).addScaledVector(this._offsetDir, shellRadius);
      } else {
        this.position.copy(curvePos);
      }
    }

    // Update mesh with enhanced readability
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      
      // Apply both thickness modulation and opacity fade
      // Thickness modulation creates subtle visual rhythm
      // Opacity fade ensures particles disappear cleanly at end
      const combinedScale = this.scale * this.thicknessModulation * this.trailVisibility;
      this.mesh.scale.setScalar(combinedScale);
      
      if (this.mesh.material) {
        // Energy intensity brightens the particle without bloom
        // Applied through color brightness, not additive blending
        const brightened = this._brightenedColor.copy(this.color);
        brightened.multiplyScalar(this.energyIntensity);
        
        this.mesh.material.color.copy(brightened);
        
        // Combined opacity: fade envelope + trail visibility
        // Result: particles are brightest mid-journey, fade at edges
        this.mesh.material.opacity = this.trailVisibility;
      }
    }

    return true;
  }

  _getFrameAtProgress(t) {
    // Simple frame calculation (could be cached for performance)
    if (!this.curve) return null;
    
    const delta = 0.001;
    const p1 = this.curve.getPointAt(Math.max(0, t - delta));
    const p2 = this.curve.getPointAt(Math.min(1, t + delta));

    return this._frameScratch.copy(p2).sub(p1).normalize();
  }

  emit(startPos, link, curve, lifetime = 1.0, sourceType = 'corruption') {
    this.active = true;
    this.age = 0;
    this.progress = 0;
    this.lifetime = lifetime;
    this.link = link;
    this.curve = curve;
    this.sourceType = sourceType;
    
    this.position.copy(startPos);
    this.opacity = 0;
    this.scale = 0.08;
    if (this.mesh) {
      this.mesh.visible = true;        // Restore visibility when re-used
      this.mesh.scale.setScalar(this.scale);
    }
  }
}

/**
 * Link Trail Particle System
 * Manages pooled particles that flow along links
 */
export class LinkTrailParticleSystem {
  constructor(scene, poolSize = 200) {
    this.scene = scene;
    this._attachRoot = scene || null;
    this.poolSize = poolSize;
    this.particles = [];
    this.active = 0;
    this.activeByType = new Map();
    this.sourceProfiles = new Map();
    this.emitAccumulators = new Map(); // key -> fractional emit remainder
    this._freeCursor = 0;
    this._emitPosScratch = new THREE.Vector3();
    
    this.noise = new NoiseGenerator();
    this.pointFXBase = new LinkPointFXBase(null, {
      renderLayer: 'LINK_PARTICLES',
      preset: 'spark',
      capacity: poolSize,
      textureKind: 'ember'
    });
    this.poolGroup = new THREE.Group();
    this.poolGroup.frustumCulled = true;
    this.renderOrder = applyLinkRenderLayer(this.poolGroup, 'LINK_PARTICLES');
    const udPool = (this.poolGroup && typeof this.poolGroup.userData === 'object' && this.poolGroup.userData) ? this.poolGroup.userData : (() => { try { Object.defineProperty(this.poolGroup, 'userData', { value: {}, writable: true, configurable: true }); } catch (e) {} return this.poolGroup.userData || {}; })();
    Object.assign(udPool, { isTrailParticles: true });
    this.poolGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_LINK_PARTICLES);
    this.root = this.poolGroup;
    this.ensureAttached();
    
    // Impact callback (optional, called when particles arrive at destination)
    this.onParticleArrival = null;
    
    // Particle material and geometry are managed by LinkPointFXBase now
    this.material = null;
    this.geometry = null;

    // Initialize particle pool via LinkPointFXBase
    for (let i = 0; i < poolSize; i++) {
      const { points } = this.pointFXBase.createPointCloud({
        capacity: 1,
        preset: 'spark',
        textureKind: 'ember',
        materialOptions: {
          opacity: 0.8,
          size: 0.22,
          sizeAttenuation: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: true
        }
      });
      const udMesh = (points && typeof points.userData === 'object' && points.userData) ? points.userData : (() => { try { Object.defineProperty(points, 'userData', { value: {}, writable: true, configurable: true }); } catch (e) {} return points.userData || {}; })();
      Object.assign(udMesh, { isTrailParticle: true });
      this.poolGroup.add(points);

      const particle = new TrailParticle(points);
      this.particles.push(particle);
    }

    // Shared source API defaults (single pool, typed streams).
    this.registerTrailSource('corruption', {
      emissionScale: 1.0,
      lifetime: 1.25,
      scaleBase: 0.07,
      scaleByCorruption: 0.08,
      maxActive: Math.floor(poolSize * 0.55),
      color: null
    });
    this.registerTrailSource('healing', {
      emissionScale: 0.8,
      lifetime: 1.05,
      scaleBase: 0.06,
      scaleByCorruption: 0.02,
      maxActive: Math.floor(poolSize * 0.32),
      color: new THREE.Color(0x99f5ff)
    });
    this.registerTrailSource('spark', {
      emissionScale: 0.55,
      lifetime: 0.75,
      scaleBase: 0.045,
      scaleByCorruption: 0.02,
      maxActive: Math.floor(poolSize * 0.24),
      color: new THREE.Color(0xffdd99)
    });
  }

  registerTrailSource(type, profile = {}) {
    if (!type) return;
    const current = this.sourceProfiles.get(type) || {};
    this.sourceProfiles.set(type, {
      emissionScale: profile.emissionScale ?? current.emissionScale ?? 1.0,
      lifetime: profile.lifetime ?? current.lifetime ?? 1.0,
      scaleBase: profile.scaleBase ?? current.scaleBase ?? 0.06,
      scaleByCorruption: profile.scaleByCorruption ?? current.scaleByCorruption ?? 0.06,
      maxActive: Math.max(1, Math.floor(profile.maxActive ?? current.maxActive ?? Math.max(1, this.poolSize * 0.33))),
      color: profile.color ?? current.color ?? null
    });
  }

  /**
   * Emit particles along a link
   * Called when link is active and flowing
   */
  emitAlongLink(link, curve, linkDirection, emissionRate, time, harmony = 0.5, corruption = 0.2) {
    const visualProfile = this._resolveLinkVisualProfile(link, harmony, corruption);
    this.emitFromSource({
      type: this._resolveSourceType(visualProfile),
      link,
      curve,
      linkDirection,
      emissionRate,
      time,
      harmony: visualProfile.harmony,
      corruption: visualProfile.corruption
    });
  }

  emitFromSource(params = {}) {
    const {
      type = 'corruption',
      link,
      curve,
      emissionRate = 0,
      deltaTime = 0.016,
      harmony = 0.5,
      corruption = 0.2,
      color = null
    } = params;
    if (!curve || emissionRate <= 0) return;

    const profile = this.sourceProfiles.get(type) || this.sourceProfiles.get('corruption');
    const visualProfile = this._resolveLinkVisualProfile(link, harmony, corruption);
    const resolvedVisualProfile = visualProfile;
    const rate = Math.max(0, emissionRate * (profile?.emissionScale ?? 1.0));
    const dt = Number.isFinite(deltaTime) ? Math.max(0, deltaTime) : 0.016;
    const emitterKey = this._getEmitterKey(type, link, curve);
    const prev = this.emitAccumulators.get(emitterKey) || 0;
    const accumulated = prev + (rate * dt);
    const emitCount = Math.floor(accumulated);
    const remainder = accumulated - emitCount;
    this.emitAccumulators.set(emitterKey, remainder > 1e-9 ? remainder : 0);
    if (emitCount <= 0) return;

    for (let i = 0; i < emitCount && this.active < this.poolSize; i++) {
      const particle = this._acquireParticle(type);
      if (!particle) break;

      const randomProgress = Math.random();
      const emitPos = curve.getPointAt(randomProgress, this._emitPosScratch);
      const lifetime = profile?.lifetime ?? 1.0;
      particle.emit(emitPos, link, curve, lifetime, type);

      if (color?.isColor) {
        particle.color.copy(color);
      } else if (profile?.color?.isColor) {
        particle.color.copy(profile.color);
      } else {
        this._getParticleColorForType(
          type,
          resolvedVisualProfile.harmony,
          resolvedVisualProfile.corruption,
          resolvedVisualProfile.synergy,
          particle.color
        );
      }

      const baseScale = profile?.scaleBase ?? 0.06;
      const scaleByCorruption = profile?.scaleByCorruption ?? 0.06;
      const safeCorruption = Math.max(0, Math.min(1, visualProfile.corruption ?? 0));
      particle.scale = baseScale + safeCorruption * scaleByCorruption;
      this.active++;
      this.activeByType.set(type, (this.activeByType.get(type) || 0) + 1);
    }
  }

  /**
   * Set particle arrival callback (called when particle reaches destination)
   * @param {Function} callback (particle, link, time) => void
   */
  setArrivalCallback(callback) {
    this.onParticleArrival = callback;
  }

  /**
   * Update all active particles
   */
  update(deltaTime, time) {
    this.ensureAttached();
    this.active = 0;
    this.activeByType.clear();
    
    for (let particle of this.particles) {
      if (particle.active) {
        if (particle.update(deltaTime, time, this.noise)) {
          this.active++;
          const type = particle.sourceType || 'corruption';
          this.activeByType.set(type, (this.activeByType.get(type) || 0) + 1);
          
          // Check for particle arrival at destination
          if (this.onParticleArrival && particle.checkArrival()) {
            particle.impactTriggered = true;
            this.onParticleArrival(particle, particle.link, time);
          }
        }
      }
    }
  }

  /**
   * Calculate particle color based on link state
   */
  _getParticleColor(harmony, corruption, synergy = null, target = null) {
    const color = target || new THREE.Color();
    color.copy(TRAIL_BASE_COLOR);

    // Harmony: shift slightly cool
    color.lerp(TRAIL_HARMONY_COLOR, harmony * 0.2);

    if (Number.isFinite(synergy)) {
      color.lerp(TRAIL_SYNERGY_COLOR, synergy * 0.18);
    }

    // Corruption: shift toward red
    color.lerp(TRAIL_CORRUPTION_COLOR, corruption * 0.4);

    return color;
  }

  _getParticleColorForType(type, harmony, corruption, synergy = null, target = null) {
    const color = target || new THREE.Color();
    if (type === 'healing') {
      color.copy(TRAIL_HEALING_COLOR);
      return color.lerp(TRAIL_HEALING_BLEND_COLOR, Math.max(0, Math.min(1, harmony)));
    }
    if (type === 'spark') {
      color.copy(TRAIL_SPARK_COLOR);
      return color.lerp(TRAIL_SPARK_BLEND_COLOR, Math.max(0, Math.min(1, harmony * 0.6 + 0.2)));
    }
    return this._getParticleColor(harmony, corruption, synergy, color);
  }

  _resolveLinkVisualProfile(link, fallbackHarmony = 0.5, fallbackCorruption = 0.2) {
    const canonical = getLinkSynergyVisualMetrics(link) ?? {};
    const harmony = Number.isFinite(link?.userData?.metrics?.harmony)
      ? link.userData.metrics.harmony
      : Number.isFinite(link?.userData?.harmony)
        ? link.userData.harmony
        : Number.isFinite(canonical.synergy)
          ? canonical.synergy
          : fallbackHarmony;
    const corruption = Number.isFinite(link?.userData?.metrics?.corruption)
      ? link.userData.metrics.corruption
      : Number.isFinite(link?.userData?.corruption)
        ? link.userData.corruption
        : Number.isFinite(canonical.corruption)
          ? canonical.corruption
          : fallbackCorruption;

    return {
      harmony: Math.max(0, Math.min(1, harmony)),
      corruption: Math.max(0, Math.min(1, corruption)),
      synergy: Number.isFinite(canonical.synergy) ? canonical.synergy : null,
      pulseStrength: Number.isFinite(canonical.pulseStrength) ? canonical.pulseStrength : null,
      tier: Number.isFinite(canonical.tier) ? canonical.tier : null,
      tierName: canonical.tierName ?? null,
      chromaShift: Number.isFinite(canonical.chromaShift) ? canonical.chromaShift : null,
      resonanceRipples: Number.isFinite(canonical.resonanceRipples) ? canonical.resonanceRipples : null
    };
  }

  _resolveSourceType(visualProfile) {
    if (visualProfile?.corruption >= 0.65) return 'corruption';
    if (visualProfile?.harmony >= 0.7) return 'healing';
    return 'spark';
  }

  _acquireParticle(type = 'corruption') {
    const profile = this.sourceProfiles.get(type) || this.sourceProfiles.get('corruption');
    const maxActive = profile?.maxActive ?? this.poolSize;
    const activeForType = this.activeByType.get(type) || 0;
    if (activeForType >= maxActive) return null;

    const total = this.particles.length;
    if (total <= 0) return null;

    const startIndex = this._freeCursor % total;
    for (let offset = 0; offset < total; offset += 1) {
      const idx = (startIndex + offset) % total;
      const particle = this.particles[idx];
      if (!particle.active) {
        this._freeCursor = (idx + 1) % total;
        return particle;
      }
    }
    return null;
  }

  _getEmitterKey(type, link, curve) {
    const linkKey = link?.id ?? link?.uuid ?? link?.name ?? null;
    if (linkKey !== null && linkKey !== undefined) return `${type}:${String(linkKey)}`;
    const curveKey = curve?.uuid ?? curve?.id ?? curve?.name ?? 'curve';
    return `${type}:curve:${String(curveKey)}`;
  }

  /**
   * Clear particles for a specific link
   */
  clearLink(linkId) {
    const suffix = `:${String(linkId)}`;
    for (const key of this.emitAccumulators.keys()) {
      if (key.endsWith(suffix)) this.emitAccumulators.delete(key);
    }
    for (let particle of this.particles) {
      if (particle.link?.id === linkId) {
        particle.reset();
        this.active--;
      }
    }
  }

  ensureAttached(attachRoot = this._attachRoot) {
    if (!attachRoot || !this.poolGroup) return this.poolGroup;
    this._attachRoot = attachRoot;
    if (this.poolGroup.parent !== attachRoot) {
      attachRoot.add(this.poolGroup);
    }
    return this.poolGroup;
  }

  rebind({ scene = this.scene, worldRoot = null } = {}) {
    if (scene) {
      this.scene = scene;
    }
    const nextRoot = worldRoot || scene || this._attachRoot;
    if (nextRoot) {
      this.ensureAttached(nextRoot);
    }
    return this;
  }

  /**
   * Dispose all resources
   */
  dispose() {
    this.emitAccumulators.clear();
    if (this._attachRoot && this.poolGroup) {
      this._attachRoot.remove(this.poolGroup);
    }

    for (let particle of this.particles) {
      if (particle?.mesh) {
        particle.mesh.parent?.remove(particle.mesh);
        if (particle.mesh.geometry) particle.mesh.geometry.dispose();
        if (particle.mesh.material) particle.mesh.material.dispose();
      }
    }

    if (this.pointFXBase && typeof this.pointFXBase.dispose === 'function') {
      this.pointFXBase.dispose();
    }

    this.particles.length = 0;
  }
}

/**
 * Strand-tip spark visual owner
 * Lives in this file so the conduit can hand off ownership cleanly.
 */
export class LinkStrandTipSparkVisual {
  constructor(scene, poolSize = 96, attachRoot = null) {
    this.scene = scene;
    this.poolSize = poolSize;
    this._attachRoot = attachRoot || scene || null;

    this.pointFXBase = new LinkPointFXBase(scene, {
      renderLayer: 'LINK_SPARKS',
      preset: 'spark',
      capacity: poolSize,
      textureKind: 'spark'
    });

    this.sparkGeometry = this.pointFXBase.createGeometry({
      aColor: { itemSize: 3 },
      aShape: { itemSize: 1 },
      aSize: { itemSize: 1 },
      aAngle: { itemSize: 1 },
      aSpin: { itemSize: 1 },
      aBirth: { itemSize: 1 },
      aDuration: { itemSize: 1 },
      aGain: { itemSize: 1 }
    });
    this.sparkPositionAttr = this.sparkGeometry.getAttribute('position');
    this.sparkColorAttr = this.sparkGeometry.getAttribute('aColor');
    this.sparkShapeAttr = this.sparkGeometry.getAttribute('aShape');
    this.sparkSizeAttr = this.sparkGeometry.getAttribute('aSize');
    this.sparkAngleAttr = this.sparkGeometry.getAttribute('aAngle');
    this.sparkSpinAttr = this.sparkGeometry.getAttribute('aSpin');
    this.sparkBirthAttr = this.sparkGeometry.getAttribute('aBirth');
    this.sparkDurationAttr = this.sparkGeometry.getAttribute('aDuration');
    this.sparkGainAttr = this.sparkGeometry.getAttribute('aGain');

    this.sparkPositions = this.sparkPositionAttr.array;
    this.sparkColor = this.sparkColorAttr.array;
    this.sparkShape = this.sparkShapeAttr.array;
    this.sparkSize = this.sparkSizeAttr.array;
    this.sparkAngle = this.sparkAngleAttr.array;
    this.sparkSpin = this.sparkSpinAttr.array;
    this.sparkBirth = this.sparkBirthAttr.array;
    this.sparkDuration = this.sparkDurationAttr.array;
    this.sparkGain = this.sparkGainAttr.array;
    this.sparkOrigin = new Float32Array(poolSize * 3);
    this.sparkVelocity = new Float32Array(poolSize * 3);
    this.sparkDrift = new Float32Array(poolSize * 3);
    this.sparkPhase = new Float32Array(poolSize);

    for (let i = 0; i < poolSize; i += 1) {
      const s = i * 3;
      this.sparkBirth[i] = -1;
      this.sparkDuration[i] = 0.001;
      this.sparkShape[i] = WAVE_SPARK_GLYPH.SLIVER;
      this.sparkSize[i] = 0.0;
      this.sparkGain[i] = 0.0;
      this.sparkColor[s] = 1.0;
      this.sparkColor[s + 1] = 1.0;
      this.sparkColor[s + 2] = 1.0;
      this.sparkPositions[s] = 1e6;
      this.sparkPositions[s + 1] = 1e6;
      this.sparkPositions[s + 2] = 1e6;
      this.sparkOrigin[s] = 1e6;
      this.sparkOrigin[s + 1] = 1e6;
      this.sparkOrigin[s + 2] = 1e6;
    }
    this.sparkPositionAttr.needsUpdate = true;
    this.sparkColorAttr.needsUpdate = true;
    this.sparkShapeAttr.needsUpdate = true;
    this.sparkSizeAttr.needsUpdate = true;
    this.sparkAngleAttr.needsUpdate = true;
    this.sparkSpinAttr.needsUpdate = true;
    this.sparkBirthAttr.needsUpdate = true;
    this.sparkDurationAttr.needsUpdate = true;
    this.sparkGainAttr.needsUpdate = true;

    this.sparkMaterial = this.pointFXBase.createMaterial({
      vertexShader: strandSparkVertexShader,
      fragmentShader: strandSparkFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
      vertexColors: false,
      uniforms: {
        uTime: { value: 0 },
        uGlobalOpacity: { value: 0.0 }
      }
    });

    this.sparkMesh = new THREE.Points(this.sparkGeometry, this.sparkMaterial);
    this.sparkMesh.frustumCulled = false;
    this.sparkMesh.raycast = () => null;
    this.sparkMesh.matrixAutoUpdate = false;
    this.sparkMesh.updateMatrix();
    this.sparkMesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_SPARKS');
    this.sparkMesh.visible = false;
    applyLinkRenderLayer(this.sparkMesh, 'LINK_SPARKS');
    Object.assign(this.sparkMesh.userData || (this.sparkMesh.userData = {}), {
      isStrandTipSparkOverlay: true
    });

    this.active = 0;
    this._baseColor = new THREE.Color();
    this._accentColor = new THREE.Color();
    this._outColor = new THREE.Color();
    this._queuedAttrs = new Set();
    this.ensureAttached();
  }

  ensureAttached(attachRoot = this._attachRoot) {
    if (!attachRoot || !this.sparkMesh) return this.sparkMesh;
    this._attachRoot = attachRoot;
    if (this.sparkMesh.parent !== attachRoot) {
      attachRoot.add(this.sparkMesh);
    }
    return this.sparkMesh;
  }

  rebind({ scene = this.scene, worldRoot = null } = {}) {
    if (scene) this.scene = scene;
    const nextRoot = worldRoot || scene || this._attachRoot;
    if (nextRoot) this.ensureAttached(nextRoot);
    return this;
  }

  _queueAttributeUpload(attribute) {
    if (!attribute) return;
    this._queuedAttrs.add(attribute);
  }

  _flushAttributeUploads() {
    if (!this._queuedAttrs.size) return;
    for (const attribute of this._queuedAttrs) {
      attribute.needsUpdate = true;
    }
    this._queuedAttrs.clear();
  }

  spawn(origin, direction, visualTime, energy = 1, options = {}) {
    if (!origin || !direction) return;
    const idx = this._findFreeSlot();
    if (idx < 0) return;

    const s = idx * 3;
    const mode = options.mode || 'default';
    const ratios = WAVE_SPARK_RATIOS[mode] || WAVE_SPARK_RATIOS.default;
    const shapeIndex = weightedPickIndex(ratios);
    const profile = WAVE_SPARK_PROFILE[shapeIndex] || WAVE_SPARK_PROFILE[WAVE_SPARK_GLYPH.SLIVER];
    const energyClamped = clamp01(energy);

    const speedMul = randRange(profile.speedMin, profile.speedMax);
    const speed = 0.18 + speedMul * (0.5 + energyClamped * 1.2);
    this.sparkPositions[s] = origin.x;
    this.sparkPositions[s + 1] = origin.y;
    this.sparkPositions[s + 2] = origin.z;
    this.sparkOrigin[s] = origin.x;
    this.sparkOrigin[s + 1] = origin.y;
    this.sparkOrigin[s + 2] = origin.z;
    this.sparkVelocity[s] = direction.x * speed;
    this.sparkVelocity[s + 1] = direction.y * speed;
    this.sparkVelocity[s + 2] = direction.z * speed;
    this.sparkDrift[s] = (-direction.y + (Math.random() - 0.5) * 0.3) * 0.15;
    this.sparkDrift[s + 1] = (direction.x + (Math.random() - 0.5) * 0.3) * 0.15;
    this.sparkDrift[s + 2] = ((Math.random() - 0.5) * 0.45) * 0.15;
    this.sparkPhase[idx] = Math.random() * Math.PI * 2.0;

    this.sparkShape[idx] = shapeIndex;
    this.sparkSize[idx] = randRange(profile.sizeMin, profile.sizeMax) * 2.8 * (0.88 + energyClamped * 0.28);
    this.sparkAngle[idx] = Math.random() * Math.PI * 2.0;
    this.sparkSpin[idx] = randRange(profile.spinMin, profile.spinMax);
    this.sparkGain[idx] = Math.min(1.35, randRange(profile.gainMin, profile.gainMax) * 1.18);

    const baseColor = options.baseColor?.isColor ? options.baseColor : COLOR_WHITE;
    const accentColor = options.accentColor?.isColor ? options.accentColor : baseColor;
    const harmony = clamp01(options.harmony ?? 0);
    const corruption = clamp01(options.corruption ?? 0);
    const load = clamp01(options.load ?? 0);
    const hotBoost = clamp01(options.hotBoost ?? 0);

    this._baseColor.copy(baseColor);
    this._accentColor.copy(accentColor);
    this._outColor.copy(this._baseColor)
      .lerp(this._accentColor, clamp01(profile.accentMix + corruption * 0.08))
      .lerp(COLOR_WHITE, clamp01(profile.hotMix + hotBoost + load * 0.08 + harmony * 0.04));
    this.sparkColor[s] = this._outColor.r;
    this.sparkColor[s + 1] = this._outColor.g;
    this.sparkColor[s + 2] = this._outColor.b;

    this.sparkBirth[idx] = visualTime;
    this.sparkDuration[idx] = randRange(profile.lifeMin, profile.lifeMax) * (1.28 + energyClamped * 0.5);

    this.sparkColorAttr.addUpdateRange(s, 3);
    this.sparkShapeAttr.addUpdateRange(idx, 1);
    this.sparkSizeAttr.addUpdateRange(idx, 1);
    this.sparkAngleAttr.addUpdateRange(idx, 1);
    this.sparkSpinAttr.addUpdateRange(idx, 1);
    this.sparkDurationAttr.addUpdateRange(idx, 1);
    this.sparkGainAttr.addUpdateRange(idx, 1);
    this._queueAttributeUpload(this.sparkColorAttr);
    this._queueAttributeUpload(this.sparkShapeAttr);
    this._queueAttributeUpload(this.sparkSizeAttr);
    this._queueAttributeUpload(this.sparkAngleAttr);
    this._queueAttributeUpload(this.sparkSpinAttr);
    this._queueAttributeUpload(this.sparkDurationAttr);
    this._queueAttributeUpload(this.sparkGainAttr);

    this.sparkBirthAttr.addUpdateRange(idx, 1);
    this._queueAttributeUpload(this.sparkBirthAttr);

    this.sparkMesh.visible = true;
    return idx;
  }

  update(visualTime) {
    if (!this.sparkGeometry || !this.sparkMaterial) return 0;
    this.ensureAttached();
    let activeCount = 0;

    for (let i = 0; i < this.poolSize; i += 1) {
      const born = this.sparkBirth[i];
      const s = i * 3;
      if (!(born >= 0)) {
        this.sparkPositions[s] = 1e6;
        this.sparkPositions[s + 1] = 1e6;
        this.sparkPositions[s + 2] = 1e6;
        continue;
      }
      const age = visualTime - born;
      const duration = this.sparkDuration[i] || 0.25;
      if (age >= duration) {
        this.sparkBirth[i] = -1;
        this.sparkPositions[s] = 1e6;
        this.sparkPositions[s + 1] = 1e6;
        this.sparkPositions[s + 2] = 1e6;
        continue;
      }
      activeCount += 1;
      const ageNorm = clamp01(age / duration);
      const drag = 1.0 - ageNorm * 0.35;
      const wobble = Math.sin(age * 24.0 + this.sparkPhase[i]) * (0.12 * (1.0 - ageNorm));
      this.sparkPositions[s] = this.sparkOrigin[s] + this.sparkVelocity[s] * age * drag + this.sparkDrift[s] * wobble;
      this.sparkPositions[s + 1] = this.sparkOrigin[s + 1] + this.sparkVelocity[s + 1] * age * drag + this.sparkDrift[s + 1] * wobble;
      this.sparkPositions[s + 2] = this.sparkOrigin[s + 2] + this.sparkVelocity[s + 2] * age * drag + this.sparkDrift[s + 2] * wobble;
    }

    if (this.sparkMaterial.uniforms?.uTime) {
      this.sparkMaterial.uniforms.uTime.value = visualTime;
    }
    if (this.sparkMaterial.uniforms?.uGlobalOpacity) {
      this.sparkMaterial.uniforms.uGlobalOpacity.value = activeCount > 0
        ? Math.max(0.18, Math.min(0.72, 0.18 + (activeCount / Math.max(1, this.poolSize)) * 0.54))
        : 0.0;
    }
    if (this.sparkMesh) {
      this.sparkMesh.visible = activeCount > 0;
    }

    this.sparkPositionAttr.addUpdateRange(0, this.poolSize * 3);
    this.sparkBirthAttr.addUpdateRange(0, this.poolSize);
    this._queueAttributeUpload(this.sparkPositionAttr);
    this._queueAttributeUpload(this.sparkBirthAttr);
    this._flushAttributeUploads();

    return activeCount;
  }

  _findFreeSlot() {
    for (let i = 0; i < this.poolSize; i += 1) {
      if (!(this.sparkBirth[i] >= 0)) return i;
    }
    return -1;
  }

  setEventBus(bus) {
    if (!bus || this._eventBus) return;
    this._eventBus = bus;

    const register = (tag, handler) => {
      if (typeof bus.subscribe === 'function') {
        const unsub = bus.subscribe(tag, handler, { priority: bus.priority?.NORMAL });
        this._eventDisposers.push(() => unsub?.());
      } else if (typeof bus.on === 'function') {
        bus.on(tag, handler, { priority: bus.priority?.NORMAL });
        this._eventDisposers.push(() => bus.off?.(tag, handler));
      }
    };

    // Canonical tiered events → burst spark emission on link
    register('link.harmony.high', (payload) => {
      const link = payload?.link;
      if (!link) return;
      this._emitBurst(link, 'harmony', 8);
    });

    register('link.harmony.mid', (payload) => {
      const link = payload?.link;
      if (!link) return;
      this._emitBurst(link, 'harmony', 4);
    });

    register('link.corruption.high', (payload) => {
      const link = payload?.link;
      if (!link) return;
      this._emitBurst(link, 'corruption', 6);
    });

    register('link.corruption.mid', (payload) => {
      const link = payload?.link;
      if (!link) return;
      this._emitBurst(link, 'corruption', 3);
    });
  }

  _emitBurst(link, type, count) {
    if (!link?.id || !this.sparkMesh) return;
    const curve = link.curve;
    if (!curve?.getPointAt) return;
    for (let i = 0; i < count; i++) {
      const t = Math.random();
      const pos = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();
      const color = type === 'harmony'
        ? TRAIL_HARMONY_COLOR
        : type === 'corruption'
          ? TRAIL_CORRUPTION_COLOR
          : TRAIL_BASE_COLOR;
      this._spawnSpark(pos, tangent, color, 0.7 + Math.random() * 0.5);
    }
  }

  dispose() {
    for (const dispose of this._eventDisposers) {
      try { dispose(); } catch (_e) {}
    }
    this._eventDisposers = [];
    this._eventBus = null;

    if (this._attachRoot && this.sparkMesh) {
      this._attachRoot.remove(this.sparkMesh);
    }
    if (this.pointFXBase?.disposePointCloud) {
      this.pointFXBase.disposePointCloud(this.sparkMesh);
    } else {
      this.sparkGeometry?.dispose?.();
      this.sparkMaterial?.dispose?.();
    }
    this._queuedAttrs.clear();
  }
}

/**
 * Link Trail Particle Emitter
 * Manages emission logic for a single link
 */
export class LinkTrailEmitter {
  constructor(link, particleSystem, sourceType = 'corruption') {
    this.link = link;
    this.particleSystem = particleSystem;
    this.sourceType = sourceType;

    this.emissionRate = 40; // Particles per second (increased from 20 for better visibility)
    this.enabled = true;

    // Emission modulation
    this.harmonyInfluence = 0.5; // Higher = more emission at high harmony
    this.corruptionInfluence = 1.0; // Higher = more emission at high corruption
  }

  update(deltaTime, time, curve, linkDirection, harmony = 0.5, corruption = 0.2) {
    if (!this.enabled || !curve) return;

    const visualProfile = this.particleSystem._resolveLinkVisualProfile?.(this.link, harmony, corruption)
      ?? { harmony, corruption, synergy: null, pulseStrength: null };

    // Modulate emission based on link state
    let rate = this.emissionRate;

    // High harmony → smoother flow (reduced particle count)
    rate *= 0.6 + visualProfile.harmony * 0.4;

    // High corruption → chaotic flow (increased particle count)
    rate *= 1.0 + visualProfile.corruption * 0.8;

    if (Number.isFinite(visualProfile.pulseStrength)) {
      rate *= 0.85 + visualProfile.pulseStrength * 0.3;
    }

    // Emit particles
    this.particleSystem.emitFromSource({
      type: this.sourceType,
      link: this.link,
      curve,
      linkDirection,
      emissionRate: rate,
      deltaTime,
      time,
      harmony: visualProfile.harmony,
      corruption: visualProfile.corruption
    });
  }

  setEmissionRate(rate) {
    this.emissionRate = Math.max(0, rate);
  }

  disable() {
    this.enabled = false;
    this.particleSystem.clearLink(this.link.id);
  }

  enable() {
    this.enabled = true;
  }
}
