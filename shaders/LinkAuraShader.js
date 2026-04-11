/**
 * LinkAuraShader.js
 * ============================================================================
 * LINK AURA SHADER - VISUAL CONTINUATION OF NODE AURA
 * 
 * Renders link aura as energy flowing between nodes, using the unified
 * visual parameters from EnergyVisualProfile.
 * 
 * Design Intent:
 * - Identical noise function and octave structure as NodeAuraShader
 * - Same time-based rhythm and animation philosophy
 * - Directional bias along link (not random turbulence)
 * - Lower amplitude than node aura (60-70%) for visual hierarchy
 * - Synchronized animation timing with node aura
 * 
 * Features:
 * - Organic, calm deformation (no sparks/particles)
 * - Direction-aligned noise along link vector
 * - Harmony → smooth gradient flow, lower deformation
 * - Corruption → rougher flow, enhanced deformation
 * - Color/light consistency with node aura palette
 * - Proper opacity and brightness constraints
 * 
 * READS FROM: EnergyVisualProfile for unified visual contract
 * 
 * @author VFX Technical Director — ATOMA Project
 * @version 1.0.0
 */

import * as THREE from 'three';
import { EnergyVisualProfile } from '../EnergyVisualProfile.js';

// Module-level cache for link aura materials
const LINK_AURA_MATERIAL_CACHE = new Map();

/**
 * Generate cache key for link aura material based on shader-varying properties
 * Only includes properties that affect the compiled shader, not per-instance uniforms
 * @param {Object} config - Configuration parameters
 * @returns {string} Cache key
 */
function getAuraKey(config) {
  // Properties that affect shader compilation and rendering behavior
  return [
    config.baseDisplacement ?? 'default',
    config.noiseScale ?? 'default', 
    config.timeScale ?? 'default',
    config.baseOpacity ?? 'default',
    config.blendZoneRadius ?? 'default',
    config.transparent ?? 'default',
    config.depthWrite ?? 'default',
    config.depthTest ?? 'default',
    config.side ?? 'default',
    config.blending ?? 'default'
  ].join('_');
}

/**
 * Create link aura shader material
 * Unified visual contract with node aura via EnergyVisualProfile
 * 
 * @param {Object} config - Configuration (optional overrides)
 * @returns {THREE.ShaderMaterial} Link aura material
 */
export function createLinkAuraMaterial(config = {}) {
  const profile = EnergyVisualProfile;
  
  const defaultConfig = {
    baseDisplacement: config.baseDisplacement ?? (profile.baseDisplacement * profile.linkDisplacementMultiplier),
    noiseScale: config.noiseScale ?? profile.noiseScale,
    timeScale: config.timeScale ?? profile.globalTimeScale,
    baseOpacity: config.baseOpacity ?? (profile.baseOpacity * profile.linkOpacityMultiplier),
    blendZoneRadius: config.blendZoneRadius ?? 0.2,  // 20% of link length for blend zone
  };

  // Generate cache key based on shader-varying properties
  const key = getAuraKey({
    ...defaultConfig,
    transparent: config.transparent,
    depthWrite: config.depthWrite,
    depthTest: config.depthTest,
    side: config.side,
    blending: config.blending
  });

  // Return cached material if available
  if (LINK_AURA_MATERIAL_CACHE.has(key)) {
    const cachedMaterial = LINK_AURA_MATERIAL_CACHE.get(key);
    if (cachedMaterial && !cachedMaterial.userData?.__linkAuraProgramCacheKeyBound) {
      if (!cachedMaterial.userData) cachedMaterial.userData = {};
      cachedMaterial.customProgramCacheKey = () => 'ATOMA_LINK_AURA_v1|ShaderMaterial|transparent|no-depth-write|depth-test|double-side|normal';
      cachedMaterial.userData.__linkAuraProgramCacheKeyBound = true;
    }
    return cachedMaterial;
  }

  const vertexShader = `
    uniform float uTime;
    uniform float uDisplacement;
    uniform float uHarmony;
    uniform float uCorruption;
    uniform float uSynergy;
    uniform float uLOD;                 // Detail level (0=full, 1=medium, 2=low)
    uniform vec3 uLinkDirection;      // Direction from source to target
    uniform float uLinkBirthIntensity;
    uniform float uLinkRemovalIntensity;
    uniform float uBlendZoneRadius;   // Smooth fade distance at node endpoints
    uniform vec3 uNodePositionA;      // Source node center (world space)
    uniform vec3 uNodePositionB;      // Target node center (world space)
    
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vDisplacementFactor;
    varying float vBlendFactor;       // Blend fade [0-1] near nodes
    
    // ========================================================================
    // SHARED NOISE FUNCTION - CANONICAL (MATCHES NodeAuraShader)
    // ========================================================================
    // Simplex-like 3D noise - fully type-safe, all vec4 operations
    
    float mod289(float x) { return x - floor(x / 289.0) * 289.0; }
    vec3 mod289(vec3 x) { return x - floor(x / 289.0) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x / 289.0) * 289.0; }
    
    vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
    
    float snoise(vec3 v) {
      const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - 0.5;
      
      i = mod289(i);
      
      // Canonical 3D simplex permutation (all vec4 operands)
      vec4 p = permute(
        permute(
          permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0)
          )
          + i.y + vec4(0.0, i1.y, i2.y, 1.0)
        )
        + i.x + vec4(0.0, i1.x, i2.x, 1.0)
      );
      
      float n0 = sin(p.x * 43758.5453);
      float n1 = sin(p.y * 43758.5453);
      float n2 = sin(p.z * 43758.5453);
      float n3 = sin(p.w * 43758.5453);
      
      float noise0 = fract(n0) * 2.0 - 1.0;
      float noise1 = fract(n1) * 2.0 - 1.0;
      float noise2 = fract(n2) * 2.0 - 1.0;
      float noise3 = fract(n3) * 2.0 - 1.0;
      
      float t0 = 0.6 - dot(x0, x0);
      float t1 = 0.6 - dot(x1, x1);
      float t2 = 0.6 - dot(x2, x2);
      float t3 = 0.6 - dot(x3, x3);
      
      t0 = max(t0, 0.0);
      t1 = max(t1, 0.0);
      t2 = max(t2, 0.0);
      t3 = max(t3, 0.0);
      
      t0 *= t0 * t0;
      t1 *= t1 * t1;
      t2 *= t2 * t2;
      t3 *= t3 * t3;
      
      return 42.0 * (t0 * noise0 + t1 * noise1 + t2 * noise2 + t3 * noise3);
    }
    
    void main() {
      // ========================================================================
      // DIRECTIONAL NOISE ALIGNED WITH LINK
      // ========================================================================
      // Offset position along link direction for flow-like deformation
      vec3 noisePos = position + uTime * 0.3;
      
      // Add directional bias: noise flows along link direction
      // This makes the aura appear to stream from source to target
      float directionalBias = dot(position, uLinkDirection) * 2.0;
      noisePos += uLinkDirection * directionalBias;
      
      // ========================================================================
      // LOD-AWARE NOISE OCTAVES
      // ========================================================================
      // LOD 0: full detail (3 octaves)
      // LOD 1: medium detail (2 octaves)
      // LOD 2: low detail (1 octave)
      float noise1 = snoise(noisePos * 2.0);
      float noiseTotal = noise1;
      if (uLOD < 1.5) {
        float noise2 = snoise(noisePos * 4.0) * 0.5;
        if (uLOD < 0.5) {
          float noise3 = snoise(noisePos * 8.0) * 0.25;
          noiseTotal = (noise1 + noise2 + noise3) / 1.75;
        } else {
          noiseTotal = (noise1 + noise2) / 1.5;
        }
      }
      
      // ========================================================================
      // IDENTICAL MODULATION AS NODE AURA (from EnergyVisualProfile)
      // ========================================================================
      // Harmony → smoother (clamped motion)
      // Corruption → rougher (enhanced motion)
      float harmonyDampen = mix(1.0, 0.6, uHarmony);  // Profile: harmonyMotionDampen = 0.6
      float corruptionEnhance = mix(1.0, 1.2, uCorruption);  // Profile: corruptionMotionEnhanceLink = 1.2
      float motionFactor = harmonyDampen * corruptionEnhance;
      motionFactor *= mix(1.0, 1.15, uSynergy);
      
      // Displacement is 60-70% of node aura (reduced amplitude)
      float displacementFactor = uDisplacement * motionFactor;
      
      // ========================================================================
      // SIMPLIFIED LINK BIRTH & REMOVAL
      // ========================================================================
      // Simplified fade without expensive ripple calculations
      float linkBirthPulse = 0.0;
      if (uLinkBirthIntensity > 0.0) {
        float birthPhase = mod(uTime * 2.5, 1.0);
        float fadeIn = smoothstep(0.0, 0.4, birthPhase);
        float hold = 1.0 - smoothstep(0.5, 1.0, birthPhase);
        linkBirthPulse = fadeIn * hold * 0.15;
      }
      
      float linkRemovalPulse = 0.0;
      if (uLinkRemovalIntensity > 0.0) {
        float removalPhase = mod(uTime * 3.0, 1.0);
        float contractIn = 1.0 - smoothstep(0.0, 0.4, removalPhase);
        float dissipate = 1.0 - smoothstep(0.4, 1.0, removalPhase);
        linkRemovalPulse = contractIn * dissipate * -0.12;
      }
      
      displacementFactor += linkBirthPulse * uLinkBirthIntensity;
      displacementFactor += linkRemovalPulse * uLinkRemovalIntensity;
      
      // ========================================================================
      // VERTEX DISPLACEMENT
      // ========================================================================
      vec3 displaced = position + normalize(normal) * (noiseTotal + linkBirthPulse + linkRemovalPulse) * displacementFactor;
      
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelMatrix * vec4(displaced, 1.0)).xyz;
      vDisplacementFactor = displacementFactor;
      // ========================================================================
      // BLEND ZONE CALCULATION - SMOOTH FADE AT NODE ENDPOINTS
      // ========================================================================
      // Calculate distance to nearest node endpoint
      // Link aura fades smoothly near nodes, allowing node aura to dominate
      
      // World position of this vertex after displacement
      vec3 worldPos = vPosition;
      
      // Distance to each endpoint
      float distToA = distance(worldPos, uNodePositionA);
      float distToB = distance(worldPos, uNodePositionB);
      float minDistToNode = min(distToA, distToB);
      
      // Smooth blend: 1.0 (full link aura) → 0.0 (node aura only) as we approach nodes
      // Within blend radius, smoothly fade to 0
      // Outside blend radius, full 1.0
      vBlendFactor = smoothstep(0.0, uBlendZoneRadius, minDistToNode);
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uOpacity;
    uniform float uHarmony;
    uniform float uCorruption;
    uniform float uSynergy;
    uniform float uDesaturation;
    
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vDisplacementFactor;
    varying float vBlendFactor;       // Blend fade [0-1] near nodes
    
    // Convert RGB to grayscale using luminance
    float getGrayscale(vec3 color) {
      return dot(color, vec3(0.299, 0.587, 0.114));
    }
    
    void main() {
      // ========================================================================
      // IDENTICAL COLOR PALETTE AS NODE AURA (from EnergyVisualProfile)
      // ========================================================================
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float rimBase = max(0.0, 1.0 - abs(dot(viewDir, vNormal)));
      float rim = rimBase * rimBase;
      
      // Base color: IDENTICAL to node aura (soft gray-white) - Profile: baseColor
      vec3 auraColor = vec3(0.85, 0.85, 0.9);
      
      // Harmony influence: IDENTICAL to node aura - Profile: harmonyColor, blend 0.3
      auraColor = mix(auraColor, vec3(0.8, 0.8, 0.88), uHarmony * 0.3);
      
      // Corruption influence: add red tint BEFORE desaturation
      // Slightly reduced influence (0.3 vs 0.4) to maintain visual hierarchy - Profile: corruptionLinkBlend
      auraColor = mix(auraColor, vec3(1.0, 0.4, 0.4), uCorruption * 0.3);  // corruptionColor
      auraColor = mix(auraColor, vec3(0.2, 0.8, 1.0), uSynergy * 0.25);
      
      // ========================================================================
      // BRANCHLESS CORRUPTION DESATURATION
      // ========================================================================
      vec3 grayscale = vec3(getGrayscale(auraColor));
      auraColor = mix(auraColor, grayscale, uDesaturation);
      
      // At high desaturation, shift toward sickly yellow-gray (branchless)
      vec3 corruptedGray = grayscale + vec3(0.15, 0.1, -0.05);
      float highDesatFactor = smoothstep(0.5, 1.0, uDesaturation);
      auraColor = mix(auraColor, corruptedGray, highDesatFactor * 0.25);
      
      // ========================================================================
      // SIMPLIFIED DIRECTIONAL RIM LIGHTING
      // ========================================================================
      // Static coefficients, reduced calculations
      auraColor += rim * vec3(0.1) * (1.0 - uDesaturation * 0.3);
      
      // ========================================================================
      // OPACITY CONSTRAINTS - MAINTAIN HIERARCHY (from EnergyVisualProfile)
      // ========================================================================
      // Link aura opacity must NOT exceed node aura opacity
      // Profile: baseOpacity = 0.25 (node), linkOpacityMultiplier = 0.6, linkOpacityCap = 0.16
      // Node aura max: 0.25 * 1.0 = 0.25
      // Link aura max: 0.25 * 0.6 ≈ 0.15, hard cap at 0.16
      
      float opacity = uOpacity * (0.6 + rim * 0.2);  // Reduced from node's (0.7 + rim*0.3)
      opacity *= (0.7 + vDisplacementFactor * 0.15);  // Reduced modulation
      
      // Clamp to ensure link never exceeds node visually
      opacity = min(opacity, 0.16);  // Hard cap from EnergyVisualProfile.linkOpacityCap
      
      // ========================================================================
      // BLEND ZONE FADE - ALLOW NODE AURA DOMINANCE NEAR ENDPOINTS
      // ========================================================================
      // Apply blend factor from vertex shader: fade link contribution near nodes
      // This creates smooth continuity where link aura meets node aura
      // vBlendFactor: 1.0 (far from nodes) → 0.0 (inside blend zone)
      opacity *= vBlendFactor;
      
      gl_FragColor = vec4(auraColor, opacity);
    }
  `;

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDisplacement: { value: defaultConfig.baseDisplacement },
      uHarmony: { value: 0.5 },
      uCorruption: { value: 0.2 },
      uSynergy: { value: 0.0 },
      uOpacity: { value: defaultConfig.baseOpacity },
      uLinkDirection: { value: new THREE.Vector3(0, 0, 1) },
      uLinkBirthIntensity: { value: 0 },
      uLinkRemovalIntensity: { value: 0 },
      uDesaturation: { value: 0 },
      uBlendZoneRadius: { value: defaultConfig.blendZoneRadius },
      uNodePositionA: { value: new THREE.Vector3(0, 0, 0) },
      uNodePositionB: { value: new THREE.Vector3(1, 0, 0) },
      uLOD: { value: 0 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
  });

  if (!material.userData) material.userData = {};
  material.customProgramCacheKey = () => 'ATOMA_LINK_AURA_v1|ShaderMaterial|transparent|no-depth-write|depth-test|double-side|normal';
  material.userData.__linkAuraProgramCacheKeyBound = true;

  LINK_AURA_MATERIAL_CACHE.set(key, material);
  return material;
}

/**
 * Create procedural link aura geometry (tube-based)
 * Smoother than node aura since links are linear
 * 
 * @param {number} radius - Base radius
 * @param {number} segments - Path segments
 * @returns {THREE.BufferGeometry} Aura geometry
 */
export function createLinkAuraGeometry(radius = 0.4, segments = 16) {
  // Simple tube geometry for link aura
  // Actual geometry is replaced per-frame in LinkRendererConduit
  const curve = new THREE.LineCurve3(
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(1, 0, 0)
  );
  
  const geometry = new THREE.TubeGeometry(curve, segments, radius, 8, false);
  return geometry;
}
