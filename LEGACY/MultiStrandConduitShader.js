/**
 * MultiStrandConduitShader.js
 * 
 * World-class multi-strand conduit shader for link rendering in ATOMA.
 * Replaces simple line-based link visuals with mechanical, multi-layered conduits
 * that represent network flow and state through directional motion and color.
 * 
 * === DESIGN PRINCIPLES ===
 * - Fully opaque rendering (no transparency, no additive blending)
 * - Multi-strand composition (1-7 strands, configurable)
 * - Directional flow via UV.y movement (not opacity pulsing)
 * - Mechanical micro-segmentation for depth perception
 * - State-driven color (stable → stress → corruption progression)
 * - Performance-optimized for 100+ links
 * - NormalBlending only, depthWrite=true, depthTest=true
 * 
 * === UPGRADE NOTES (IN-PLACE) ===
 * This shader replaces the simple fragmentShader in LinkRenderer with a full
 * multi-strand implementation. All existing uniforms are preserved and extended.
 * 
 * New attributes:
 *   - aStrand: which strand (0-6)
 *   - aRadius: strand outer radius
 *   - aSeed: per-vertex noise seed
 *   - aFlow: flow direction modifier
 * 
 * New uniforms:
 *   - uState: {load, stress, corruption} (0-1 normalized)
 *   - uFlowStrength: 0-1 flow animation intensity
 *   - uStrandCount: 3-7 strands in this conduit
 *   - uCoreMix: 0-1 blend between core and outer strands
 *   - uColorA: stable state color
 *   - uColorB: stress/corruption color
 *   - uSegmentCount: mechanical segments along length
 */

import * as THREE from 'three';
import VisualTime from './src/time/VisualTime.js';

// [B.3-C1] Shared conduit material pool to prevent program churn
const CONDUIT_MATERIAL_POOL = new Map();

// [B.3-C1] Build cache key from shader-affecting static flags only
function buildConduitKey(options = {}) {
  const transparent = false;
  const blending = THREE.NormalBlending;
  const side = THREE.DoubleSide;
  const depthWrite = true;
  const depthTest = true;
  const definesHash = 'nodef';

  return [
    options.profileId ?? 'default',
    `t=${transparent ? 1 : 0}`,
    `b=${blending}`,
    `s=${side}`,
    `dw=${depthWrite ? 1 : 0}`,
    `dt=${depthTest ? 1 : 0}`,
    `def=${definesHash}`,
  ].join('|');
}

/**
 * Create multi-strand conduit shader material
 * Replaces the previous createLinkShaderMaterial() function
 */
export function createConduitShaderMaterial(options = {}) {
  const {
    colorStable = new THREE.Color(0x00ddff),      // Cyan for stable
    colorStress = new THREE.Color(0xff6b35),      // Orange for stress
    colorCorruption = new THREE.Color(0xff1744),  // Red for corruption
    strandCount = 5,                               // 3-7 strands
    flowStrength = 1.0,                            // 0-1 flow animation intensity
    segmentCount = 16,                             // mechanical segments
    coreMix = 0.7                                  // blend between core and outer
  } = options;

  const poolKey = buildConduitKey(options);
  const pooled = CONDUIT_MATERIAL_POOL.get(poolKey);
  if (pooled) {
    // [B.3-C1] Update per-conduit uniforms without new material creation
    pooled.uniforms.uColorA.value = colorStable;
    pooled.uniforms.uColorB.value = colorStress;
    pooled.uniforms.uColorC.value = colorCorruption;
    pooled.uniforms.uStrandCount.value = strandCount;
    pooled.uniforms.uFlowStrength.value = flowStrength;
    pooled.uniforms.uSegmentCount.value = segmentCount;
    pooled.uniforms.uCoreMix.value = coreMix;
    return pooled;
  }

  const uniforms = {
    // Timing & animation
    uTime: { value: 0 },
    
    // Network state (normalized 0-1)
    uLoad: { value: 0.3 },        // Network load (affects glow)
    uStress: { value: 0.0 },      // Stress level (color interpolation)
    uCorruption: { value: 0.0 },  // Corruption level (color shift)
    
    // Colors
    uColorA: { value: colorStable },
    uColorB: { value: colorStress },
    uColorC: { value: colorCorruption },
    
    // Shader configuration
    uFlowStrength: { value: flowStrength },
    uStrandCount: { value: strandCount },
    uCoreMix: { value: coreMix },
    uSegmentCount: { value: segmentCount },
    
    // Legacy uniforms (backward compatibility)
    time: { value: 0 },
    energy: { value: 1 },
    intensity: { value: 1 },
    linkType: { value: 0 },
    selected: { value: 0 },
    color: { value: colorStable }
  };

  // === VERTEX SHADER ===
  const vertexShader = `
    // Input attributes
    attribute float aStrand;    // which strand (0-strandCount)
    attribute float aRadius;    // outer radius of this strand
    attribute float aSeed;      // noise seed for variation
    attribute float aFlow;      // flow direction modifier
    attribute float aVertexIndex; // [B.3-B] WebGL1-safe parametric position 0..1
    
    // Varyings passed to fragment
    varying vec3 vPosition;
    varying float vT;           // parametric position along curve (0-1)
    varying float vStrand;      // which strand (used for micro-segmentation)
    varying float vRadius;      // radius at this vertex
    varying float vFlow;        // flow parameter
    varying vec3 vNormal;       // interpolated normal
    
    void main() {
      vPosition = position;
      
      // [B.3-B] Use explicit attribute to avoid gl_VertexID dependency (WebGL1 safe)
      vT = aVertexIndex;
      
      // Strand information (for multi-strand offset)
      vStrand = aStrand;
      vRadius = aRadius;
      vFlow = aFlow;
      
      // Simple normal (perpendicular to curve direction)
      vNormal = normalize(normal);
      
      // Standard transformation
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  // === FRAGMENT SHADER ===
  const fragmentShader = `
    precision highp float;
    
    // Uniforms
    uniform float uTime;
    uniform float uLoad;
    uniform float uStress;
    uniform float uCorruption;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uColorC;
    uniform float uFlowStrength;
    uniform float uStrandCount;
    uniform float uCoreMix;
    uniform float uSegmentCount;
    
    // Legacy uniforms
    uniform float time;
    uniform float energy;
    uniform float intensity;
    uniform float linkType;
    uniform float selected;
    uniform vec3 color;
    
    // Varyings from vertex
    varying vec3 vPosition;
    varying float vT;
    varying float vStrand;
    varying float vRadius;
    varying float vFlow;
    varying vec3 vNormal;
    
    // Pseudo-random function
    float random(float x) {
      return fract(sin(x * 12.9898) * 43758.5453);
    }
    
    // Improved noise
    float noise(float x) {
      float i = floor(x);
      float f = fract(x);
      f = f * f * (3.0 - 2.0 * f);
      return mix(random(i), random(i + 1.0), f);
    }
    
    // Strand appearance based on position and state
    vec3 getStrandColor(float t, float strand, float load, float stress, float corruption) {
      // === COLOR PROGRESSION ===
      // Stable (low stress/corruption) → Cyan
      // Stress (moderate) → Orange
      // Corruption (high) → Red
      
      vec3 finalColor = uColorA;
      
      if (corruption > 0.5) {
        // Corruption dominates: lerp from A to C
        finalColor = mix(uColorA, uColorC, corruption);
      } else if (stress > 0.3) {
        // Stress visible: lerp from A to B
        finalColor = mix(uColorA, uColorB, stress / 0.3);
      }
      
      // Load adds glow intensity
      float glowIntensity = 0.2 + load * 0.3;
      finalColor += glowIntensity;
      
      return finalColor;
    }
    
    // Mechanical micro-segmentation pattern
    float getMicroSegmentation(float t) {
      // Create repeating mechanical segments along the conduit
      float segPattern = mod(t * uSegmentCount, 1.0);
      
      // Slight darkening at segment boundaries
      float boundaryWidth = 0.15;
      float boundary = smoothstep(0.0, boundaryWidth, segPattern) * 
                       smoothstep(1.0, 1.0 - boundaryWidth, segPattern);
      
      return mix(0.75, 1.0, boundary);
    }
    
    // Directional flow animation (via UV scrolling)
    float getFlowAnimation(float t) {
      // Normalize flow direction and time
      float scrollSpeed = uFlowStrength * 2.0;
      float flowPhase = mod(uTime * scrollSpeed + t * vFlow, 1.0);
      
      // Smooth wave showing flow direction
      float flowWave = sin(flowPhase * 3.14159 * 2.0) * 0.5 + 0.5;
      
      // Optional brightening along flow
      return mix(1.0, 1.1, flowWave * uFlowStrength);
    }
    
    // Multi-strand composition
    float getStrandOpacity(float t, float strand) {
      // Core filament (highest opacity)
      if (strand < 1.0) {
        return 1.0;
      }
      
      // Outer strands (progressively dimmer)
      float outerIndex = strand - 1.0;
      float outerOpacity = mix(uCoreMix, 0.3, outerIndex / (uStrandCount - 1.0));
      
      return outerOpacity;
    }
    
    void main() {
      // === CORE RENDERING ===
      
      // Get strand parameters
      float strandIdx = vStrand;
      float t = vT;
      float load = uLoad;
      float stress = uStress;
      float corruption = uCorruption;
      
      // Base color from state
      vec3 baseColor = getStrandColor(t, strandIdx, load, stress, corruption);
      
      // Apply micro-segmentation for depth
      float segFactor = getMicroSegmentation(t);
      baseColor *= segFactor;
      
      // Apply flow animation
      float flowFactor = getFlowAnimation(t);
      baseColor *= flowFactor;
      
      // Get strand-specific opacity
      float strandOpacity = getStrandOpacity(t, strandIdx);
      
      // === FINAL COMPOSITING ===
      
      // Fully opaque rendering
      float finalAlpha = strandOpacity;
      
      // Legacy intensity (backward compat with existing systems)
      finalAlpha *= intensity;
      
      // Selection highlight (if selected)
      if (selected > 0.5) {
        baseColor *= 1.2;
        finalAlpha = min(1.0, finalAlpha * 1.1);
      }
      
      // Output: fully opaque with state-driven color
      gl_FragColor = vec4(baseColor, 1.0); // Always alpha=1.0 for full opacity
    }
  `;

  // === CREATE MATERIAL ===
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    
    // === MANDATORY SAFETY SETTINGS ===
    transparent: false,           // NO transparency
    depthWrite: true,             // Write to depth buffer
    depthTest: true,              // Test against depth buffer
    blending: THREE.NormalBlending, // Only NormalBlending
    
    // Rendering settings
    side: THREE.DoubleSide,        // Visible from both sides
    wireframe: false,
    
    // Link meshes should NOT participate in raycasting
    // (handled in LinkRenderer)
  });

  CONDUIT_MATERIAL_POOL.set(poolKey, material);
  if (typeof window !== 'undefined') {
    window.__CONDUIT_MATERIAL_POOL_SIZE = CONDUIT_MATERIAL_POOL.size;
  }

  return material;
}

/**
 * Update conduit material uniforms from network metrics
 * 
 * @param {THREE.ShaderMaterial} material - The conduit shader material
 * @param {Object} metrics - Network state metrics
 * @param {number} metrics.load - Network load (0-1)
 * @param {number} metrics.stress - Network stress level (0-1)
 * @param {number} metrics.corruption - Corruption level (0-1)
 * @param {number} deltaTime - Frame delta time for animation
 */
export function updateConduitUniforms(material, metrics = {}, deltaTime = 0) {
  if (!(material instanceof THREE.ShaderMaterial)) return;
  
  const uniforms = material.uniforms;
  
  // Update time for flow animation
  if (uniforms.uTime) {
    uniforms.uTime.value = VisualTime.now; // Phase 2A: canonical VisualTime source
  }
  if (uniforms.time) {
    uniforms.time.value = VisualTime.now; // Phase 2A: canonical VisualTime source
  }
  
  // Update network state metrics
  if (uniforms.uLoad) {
    uniforms.uLoad.value = Math.max(0, Math.min(1, metrics.load ?? 0.3));
  }
  if (uniforms.uStress) {
    uniforms.uStress.value = Math.max(0, Math.min(1, metrics.stress ?? 0.0));
  }
  if (uniforms.uCorruption) {
    uniforms.uCorruption.value = Math.max(0, Math.min(1, metrics.corruption ?? 0.0));
  }
  
  // Legacy uniform updates
  if (uniforms.energy) {
    uniforms.energy.value = 0.5 + (metrics.load ?? 0.3) * 0.5;
  }
  if (uniforms.intensity) {
    uniforms.intensity.value = 1.0;
  }
}

/**
 * Setup geometry attributes for multi-strand rendering
 * 
 * Called on geometry creation to add strand-specific attributes
 * 
 * @param {THREE.BufferGeometry} geometry - The link curve geometry
 * @param {number} strandCount - Number of strands (3-7)
 */
export function setupConduitGeometryAttributes(geometry, strandCount = 5) {
  const positionAttr = geometry.getAttribute('position');
  if (!positionAttr) return;
  
  const vertexCount = positionAttr.count;
  
  // Strand index (which strand this vertex belongs to)
  const aStrand = new Float32Array(vertexCount);
  // Radius (outer radius of this strand)
  const aRadius = new Float32Array(vertexCount);
  // Seed (per-vertex noise variation)
  const aSeed = new Float32Array(vertexCount);
  // Flow (flow direction modifier)
  const aFlow = new Float32Array(vertexCount);
  // [B.3-B] WebGL1-safe parametric index (0..1) to replace gl_VertexID usage
  const aVertexIndex = new Float32Array(vertexCount);
  
  for (let i = 0; i < vertexCount; i++) {
    // Distribute vertices across strands
    aStrand[i] = (i % strandCount) / strandCount;
    
    // Radius varies by strand
    const strandIdx = i % strandCount;
    const radiusBase = 1.0 - (strandIdx / strandCount) * 0.5;
    aRadius[i] = radiusBase;
    
    // Pseudo-random seed for variation
    aSeed[i] = Math.random();
    
    // Flow direction (alternate for visual interest)
    aFlow[i] = ((i / vertexCount) % 2) > 0.5 ? 1.0 : -1.0;
    
    // Parametric position along curve
    aVertexIndex[i] = vertexCount > 1 ? (i / (vertexCount - 1)) : 0.0;
  }
  
  // Set attributes on geometry
  geometry.setAttribute('aStrand', new THREE.BufferAttribute(aStrand, 1));
  geometry.setAttribute('aRadius', new THREE.BufferAttribute(aRadius, 1));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
  geometry.setAttribute('aFlow', new THREE.BufferAttribute(aFlow, 1));
  geometry.setAttribute('aVertexIndex', new THREE.BufferAttribute(aVertexIndex, 1));
}

/**
 * Console API for debugging and tuning conduit shaders
 */
export function setupConduitShaderConsoleAPI() {
  window.__conduitShader = {
    // Get all active conduit materials
    getMaterials: () => {
      const materials = [];
      window.__conduitShader._materials?.forEach(m => materials.push(m));
      return materials;
    },
    
    // Update all conduit materials with new state
    updateAll: (metrics) => {
      window.__conduitShader._materials?.forEach(mat => {
        updateConduitUniforms(mat, metrics, VisualTime.delta);
      });
    },
    
    // Get documentation
    help: () => {
      console.log(`
        === MultiStrandConduit Shader API ===
        
        updateConduitUniforms(material, {load, stress, corruption}, deltaTime)
        - Update shader uniforms from network metrics
        
        setupConduitGeometryAttributes(geometry, strandCount)
        - Prepare geometry with strand attributes
        
        createConduitShaderMaterial(options)
        - Create shader material with options:
          * colorStable, colorStress, colorCorruption
          * strandCount (3-7)
          * flowStrength (0-1)
          * segmentCount
          * coreMix (0-1)
        
        Example:
          const mat = createConduitShaderMaterial({
            strandCount: 5,
            flowStrength: 0.8,
            colorStable: new THREE.Color(0x00ddff)
          });
      `);
    }
  };
}

export default {
  createConduitShaderMaterial,
  updateConduitUniforms,
  setupConduitGeometryAttributes,
  setupConduitShaderConsoleAPI
};
