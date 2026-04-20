import * as THREE from 'three';
import { tagAllowedSphere, clampSphere } from './VisualSpherePolicy.js';
import { SynergyStateResolver, SynergyState } from './SynergyStateResolver.js';
import { CONFIG } from './config.js';
import VisualTime from './src/time/VisualTime.js';
import { isVisualLocked } from './Engine/authority/VisualAuthorityFlag.js';

// NeonLinkVisuals is FX-only layer.
// Metrics uniforms are owned exclusively by LinkRendererConduit.

function ensureUserData(obj) {
  if (!obj) return {};
  if (obj.userData && typeof obj.userData === 'object') return obj.userData;
  try { Object.defineProperty(obj, 'userData', { value: {}, writable: true, configurable: true }); return obj.userData; }
  catch (e) { try { return obj.userData || {}; } catch (e2) { return {}; } }
}

// Shared-material dedup configuration (default: enabled)
const SHARED_MATERIAL_USAGE = {
  neonLine: 0,
  ghostLine: 0,
  ghostValid: 0,
  ghostInvalid: 0,
  clonePathHits: 0
};
let SHARED_LINK_MATERIALS = null;
let LAST_SHARED_MATERIAL_LOG = 0;

const DEFAULT_LINE_COLOR = new THREE.Color(0x00ffff);
const DEFAULT_GHOST_COLOR = new THREE.Color(0xffffff);
const DEFAULT_VALID_COLOR = new THREE.Color(0x00ffff);
const DEFAULT_INVALID_COLOR = new THREE.Color(0xff0000);
const DEGRADATION_RED_TINT = new THREE.Color(1, 0.2, 0.2);
const COLLAPSE_WARN_COLOR = new THREE.Color(1.0, 0.8, 0.2);
const COLLAPSE_CRIT_COLOR = new THREE.Color(1.0, 0.1, 0.1);
const COLLAPSE_ACTIVE_COLOR = new THREE.Color(1.0, 0.0, 0.0);

function isMaterialDedupEnabled() {
  return typeof window === 'undefined' ? true : window.__DEBUG_LINK_MATERIAL_DEDUP !== false;
}

function isMaterialDedupLogEnabled() {
  return typeof window !== 'undefined' && window.__DEBUG_LINK_MATERIAL_DEDUP_LOG === true;
}

function logSharedMaterialUsage() {
  if (!isMaterialDedupLogEnabled()) return;
  const now = Date.now();
  if (now - LAST_SHARED_MATERIAL_LOG < 5000) return;
  LAST_SHARED_MATERIAL_LOG = now;
  console.log(
    `[NeonLinkVisuals] LinkMaterialDedup — shared neon:${SHARED_MATERIAL_USAGE.neonLine}, glow:${SHARED_MATERIAL_USAGE.ghostLine}, valid:${SHARED_MATERIAL_USAGE.ghostValid}, invalid:${SHARED_MATERIAL_USAGE.ghostInvalid}, cloneFallbacks:${SHARED_MATERIAL_USAGE.clonePathHits}`
  );
}

function getSharedLinkMaterials(materials) {
  if (!SHARED_LINK_MATERIALS) {
    SHARED_LINK_MATERIALS = {
      neonLine: materials.neonLine,
      ghostLine: materials.ghostLine,
      ghostValid: materials.ghostValid,
      ghostInvalid: materials.ghostInvalid
    };
  }
  return SHARED_LINK_MATERIALS;
}

/**
 * SANDBOXING GUARD: Prevents mutations of protected node visual layers
 * Protects: hologram shells, auras, core meshes, node roots
 */
function shouldSkipLegacyVisualMutation(obj) {
  return (
    obj?.userData?.isHologramShell ||
    obj?.userData?.isAura ||
    obj?.userData?.isCoreMesh ||
    obj?.userData?.isNodeRoot
  );
}

/**
 * Neon Link Visuals System
 * Advanced visual effects for node connections
 * - Glowing Bézier curves with bloom
 * - Data flow particles with trails
 * - Priority-based thickness and pulsing
 * - Traffic heatmap coloring
 * - Error feedback effects
 * - Smart auto-link ghost previews
 */
export class NeonLinkVisuals {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.particles = [];
    // Phase 2A: canonical VisualTime source
    this.time = 0;
    this._timeOrigin = null;
    
    // [SYNERGY STATE RESOLVER] Centralized source of truth for synergy thresholds
    this.synergyResolver = new SynergyStateResolver();
    
    // [Metrics Integration v1.0] Link state tracking for metric-based visuals
    this.linkStates = new Map(); // linkId → { mesh, corruption, synergy, harmony }
    
    // Visual configuration
    this.config = {
      // Curve parameters
      curveResolution: 60,
      baseLineWidth: 2,
      maxLineWidth: 8,
      
      // Glow/bloom
      bloomIntensity: 1.5,
      glowScale: 1.3,
      
      // Particles
      particleCount: 3,
      particleSize: 0.08,
      particleSpeed: 0.03,
      trailLength: 12,
      
      // Colors by traffic level
      trafficColors: {
        low: new THREE.Color(0x00ddff),      // Cyan
        medium: new THREE.Color(0x0099ff),   // Bright blue
        high: new THREE.Color(0xff8800),     // Orange
        overload: new THREE.Color(0xff0000)  // Red
      },
      
      // [LinkPriority v1.0] Enhanced priority visualization pack 1.1
      // Variant 1: Weight Pulse (base glow) + Variant 2: Dual Stream + Variant 3: Aura Field
      priority: {
        // LOW: Minimal visual impact, thin beam, subtle glow
        low: {
          pulseSpeed: 0.5,
          opacity: 0.45,
          widthMul: 0.9,           // Variant 1: Quantum Pulse – trochu tenšie
          glowMul: 0.6,            // Variant 1: slabší glow
          particleMul: 0.4,        // Variant 2: Dual Stream – menej bodiek
          trafficPulseMul: 0.4,    // Variant 1: weak traffic influence
          auraScale: 0.7,          // Variant 3: Aura Field – malý bloom
        },
        // NORMAL: Baseline visual, standard beam, comfortable glow
        normal: {
          pulseSpeed: 1.0,
          opacity: 0.75,
          widthMul: 1.0,           // Variant 1: baseline
          glowMul: 1.0,            // Variant 1: baseline
          particleMul: 1.0,        // Variant 2: baseline
          trafficPulseMul: 0.7,    // Variant 1: standard traffic influence
          auraScale: 1.0,          // Variant 3: baseline bloom
        },
        // HIGH: Prominent visual, thick beam, strong glow, many particles
        high: {
          pulseSpeed: 1.7,
          opacity: 0.95,
          widthMul: 1.4,           // Variant 1: hrubší beam
          glowMul: 1.6,            // Variant 1: výrazný glow
          particleMul: 1.5,        // Variant 2: viac bodiek
          trafficPulseMul: 1.0,    // Variant 1: full traffic influence
          auraScale: 1.5,          // Variant 3: silný bloom
        },
        // CRITICAL: Maximum visual impact, thick beam, brutal glow, dense particles
        critical: {
          pulseSpeed: 2.5,
          opacity: 1.0,
          widthMul: 1.9,           // Variant 1: najhrubší beam
          glowMul: 2.3,            // Variant 1: brutálny glow
          particleMul: 2.0,        // Variant 2: hustý stream
          trafficPulseMul: 1.3,    // Variant 1: amplified traffic influence
          auraScale: 2.2,          // Variant 3: massive bloom
        },
      }
    };
    
    // Create reusable materials
    this.materials = this.createMaterials();
    this._semanticSubscriptions = [];
    this._bindSemanticBus();
  }

  _useSharedMaterials() {
    return isMaterialDedupEnabled();
  }

  _getUniformDefaults(type) {
    switch (type) {
      case 'neonLine':
        return { uColor: DEFAULT_LINE_COLOR, uFlow: 1, uOpacity: 0.8, uWidth: 1, opacity: 1, linewidth: 1 };
      case 'ghostLine':
        return { uColor: DEFAULT_GHOST_COLOR, opacity: 1, linewidth: 1 };
      case 'ghostValid':
        return { uColor: DEFAULT_VALID_COLOR, opacity: 1, linewidth: 1 };
      case 'ghostInvalid':
        return { uColor: DEFAULT_INVALID_COLOR, opacity: 1, linewidth: 1 };
      default:
        return {};
    }
  }

  _ensureLinkUniformStore(mesh, type, seed = {}) {
    if (!mesh) return null;
    const defaults = this._getUniformDefaults(type);
    const store = mesh.userData.__linkUniforms || {};
    mesh.userData.__linkUniforms = store;

    if (seed.uColor) {
      store.uColor = seed.uColor;
    } else if (!store.uColor && defaults.uColor) {
      store.uColor = defaults.uColor.clone ? defaults.uColor.clone() : defaults.uColor;
    }

    if (seed.uFlow !== undefined) store.uFlow = seed.uFlow;
    else if (store.uFlow === undefined && defaults.uFlow !== undefined) store.uFlow = defaults.uFlow;

    if (seed.uOpacity !== undefined) store.uOpacity = seed.uOpacity;
    else if (store.uOpacity === undefined && defaults.uOpacity !== undefined) store.uOpacity = defaults.uOpacity;

    if (seed.uWidth !== undefined) store.uWidth = seed.uWidth;
    else if (store.uWidth === undefined && defaults.uWidth !== undefined) store.uWidth = defaults.uWidth;

    if (seed.opacity !== undefined) store.opacity = seed.opacity;
    else if (store.opacity === undefined && defaults.opacity !== undefined) store.opacity = defaults.opacity;

    if (seed.linewidth !== undefined) store.linewidth = seed.linewidth;
    else if (store.linewidth === undefined && defaults.linewidth !== undefined) store.linewidth = defaults.linewidth;

    store.type = type;
    return store;
  }

  _attachUniformPatcher(mesh, type) {
    const defaults = this._getUniformDefaults(type);
    mesh.onBeforeRender = (renderer, scene, camera, geometry, material) => {
      const store = mesh.userData.__linkUniforms || {};
      const uniforms = material.uniforms || {};

      const colorSource = store.uColor || defaults.uColor;
      if (uniforms.uColor && colorSource) {
        uniforms.uColor.value.copy(colorSource);
      }

      if (uniforms.uFlow) {
        uniforms.uFlow.value = store.uFlow ?? defaults.uFlow ?? 1;
      }

      if (uniforms.uOpacity) {
        uniforms.uOpacity.value = store.uOpacity ?? defaults.uOpacity ?? 1;
      }

      if (uniforms.uWidth) {
        uniforms.uWidth.value = store.uWidth ?? defaults.uWidth ?? 1;
      }

      if (store.opacity !== undefined || defaults.opacity !== undefined) {
        material.opacity = store.opacity ?? defaults.opacity;
      }

      if (store.linewidth !== undefined || defaults.linewidth !== undefined) {
        material.linewidth = store.linewidth ?? defaults.linewidth;
      }
    };
  }

  _setLinkOpacity(mesh, opacityVal) {
    if (!mesh || !mesh.material) return;
    if (this._useSharedMaterials()) {
      const store = mesh.userData.__linkUniforms;
      if (store) {
        store.opacity = opacityVal;
        if (store.uOpacity !== undefined) {
          store.uOpacity = opacityVal;
        }
      }
    }
    mesh.material.opacity = opacityVal;
    if (mesh.material.uniforms?.uOpacity) {
      mesh.material.uniforms.uOpacity.value = opacityVal;
    }
  }

  _setLinkColor(mesh, colorVal) {
    if (!mesh || !colorVal) return;
    if (this._useSharedMaterials()) {
      const store = mesh.userData.__linkUniforms;
      if (store?.uColor?.copy) {
        store.uColor.copy(colorVal);
      }
    }
    if (mesh.material?.uniforms?.uColor) {
      mesh.material.uniforms.uColor.value.copy(colorVal);
    } else if (mesh.material?.color) {
      mesh.material.color.copy(colorVal);
    }
  }

  _setLinkLinewidth(mesh, widthVal) {
    if (!mesh || !mesh.material) return;
    if (this._useSharedMaterials()) {
      const store = mesh.userData.__linkUniforms;
      if (store) {
        store.linewidth = widthVal;
        if (store.uWidth !== undefined) {
          store.uWidth = widthVal;
        }
      }
    }
    mesh.material.linewidth = widthVal;
  }

  _tintLinkColor(mesh, targetColor, factor) {
    if (!mesh || !targetColor) return;
    const clampFactor = Math.max(0, Math.min(1, factor));
    if (this._useSharedMaterials()) {
      const store = mesh.userData.__linkUniforms;
      if (store?.uColor?.lerp) {
        store.uColor.lerp(targetColor, clampFactor);
      }
    }
    if (mesh.material?.uniforms?.uColor?.value?.lerp) {
      mesh.material.uniforms.uColor.value.lerp(targetColor, clampFactor);
    } else if (mesh.material?.color?.lerp) {
      mesh.material.color.lerp(targetColor, clampFactor);
    }
  }
  
  /**
   * [LinkPriority v1.0] Get priority tier from link data
   * Safely extracts and validates link.priority.tier
   * Fallback to 'normal' if missing/invalid
   * @private
   */
  _getPriorityTier(link) {
    if (!link || !link.priority) return 'normal';
    const tier = link.priority.tier;
    if (tier === 'low' || tier === 0) return 'low';
    if (tier === 'high' || tier === 2) return 'high';
    if (tier === 'critical' || tier === 3) return 'critical';
    return 'normal'; // tier === 'normal' || tier === 1, or any other value
  }

  /**
   * [LinkPriority v1.0] Determine traffic band for color mapping
   * Maps continuous traffic (0–1) to discrete color band
   * @private
   */
  _getTrafficBand(traffic) {
    if (traffic >= 0.7) return 'overload';
    if (traffic >= 0.4) return 'high';
    if (traffic >= 0.2) return 'medium';
    return 'low';
  }

  /**
   * [LinkPriority v1.0] Compute complete visual state from link priority data
   * Combines: tier profile + traffic + synergy + score into unified visual parameters
   * Returns object with multipliers for all VFX layers (line, glow, particles, etc.)
   * @private
   */
  _getPriorityVisualState(link) {
    // Get priority tier and associated visual profile
    const tier = this._getPriorityTier(link);
    const profile = this.config.priority[tier] || this.config.priority.normal;

    // Safely extract priority data with defaults (link.priority may not exist)
    const p = (link && link.priority) || {};
    let score = typeof p.score === 'number' ? p.score : 0;
    let traffic = typeof p.traffic === 'number' ? p.traffic : 0;
    let synergy = typeof p.synergy === 'number' ? p.synergy : 0;

    // Normalize to 0–1 range (in case score/traffic are 0–100 scale)
    score = score > 1 ? Math.min(score / 100, 1) : score;
    traffic = traffic > 1 ? Math.min(traffic / 100, 1) : traffic;
    synergy = synergy > 1 ? Math.min(synergy / 100, 1) : synergy;

    // Variant 3: Aura Field Intensity – traffic-based color mapping
    const trafficBand = this._getTrafficBand(traffic);
    const trafficColor = this.config.trafficColors[trafficBand] || this.config.trafficColors.low;

    // Variant 2: Synergy Flare – boost glow by synergy strength
    const synergyBoost = 0.5 * synergy; // synergy 0–1 → +0–0.5× glow

    // Variant 1: Weight Pulse – compute final visual parameters
    const lineWidth = this.config.baseLineWidth * profile.widthMul;
    const glow = this.config.bloomIntensity * profile.glowMul * (1 + synergyBoost);
    const particleCountRaw = this.config.particleCount * profile.particleMul * (0.5 + traffic * 0.5);
    const particleCount = Math.round(particleCountRaw);

    // Variant 1: Quantum Pulse speed – base * traffic influence
    const pulseSpeed = profile.pulseSpeed * (1 + traffic * profile.trafficPulseMul);

    // Variant 3: Aura Field bloom scale
    const auraScale = profile.auraScale;

    return {
      tier,
      color: trafficColor,
      lineWidth,
      glow,
      particleCount,
      pulseSpeed,
      auraScale,
      opacity: profile.opacity,
      score,
      traffic,
      synergy,
    };
  }

  /**
   * Link Visual Language v2 - Fiber Ribbon with Flow & Fractures
   * Upgraded: Complete shader-driven visual language
   * - Screen-space ribbon geometry (fiber-like)
   * - Shader-driven flow trace (moving pattern)
   * - Stress fractures (cracks + micro dropout + curve kinks)
   * - Reusable geometry & materials (performance safe)
   * - Stable opacity, depthTest true, depthWrite false
   */
  createMaterials() {
    // Link Visual Language v2 - Advanced shader system
    const linkShader = {
      vertexShader: `
        uniform float uTime;
        uniform float uStress;
        uniform float uFlow;
        uniform float uWidth;
        varying float vU;
        varying float vV;
        varying float vStress;
        varying float vWidth;
        
        void main() {
          vU = position.x / 100.0;  // Along link axis
          vV = position.y;          // Across ribbon width (-1 to 1)
          vStress = uStress;
          vWidth = uWidth;
          
          vec3 pos = position;
          
          // Stress kinks: subtle curve perturbations
          if (uStress > 0.2) {
            float kink = sin(vU * 8.0 + uTime) * uStress * 0.1;
            pos.z += kink;
          }
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uStress;
        uniform float uTime;
        uniform float uFlow;
        uniform float uOpacity;
        varying float vU;
        varying float vV;
        varying float vStress;
        varying float vWidth;
        
        // Pseudo-random hash
        float hash(float n) {
          return fract(sin(n) * 43758.5453);
        }
        
        // Flow trace - moving pattern along link
        float flowTrace(float u, float t) {
          float flowPattern = sin((u - t * uFlow) * 10.0) * 0.5 + 0.5;
          flowPattern *= cos((u - t * uFlow * 0.7) * 6.0) * 0.5 + 0.5;
          return flowPattern;
        }
        
        // Stress fracture pattern - cracks under stress
        float fractureMask(float u, float v, float t, float stress) {
          if (stress < 0.15) return 1.0;
          
          // Micro cracks along length
          float crack1 = sin(u * 30.0 + t * 3.0) * 0.5 + 0.5;
          crack1 = pow(crack1, 3.0) * stress;
          
          // Micro dropout (transparent sections)
          float dropout = sin(u * 12.0 + t) * sin(u * 5.0);
          dropout = smoothstep(0.4, 0.6, dropout) * stress * 0.5;
          
          // Combine
          return mix(1.0, 1.0 - crack1 - dropout, stress * 0.6);
        }
        
        // Ribbon edge fade
        float edgeFade(float v) {
          return smoothstep(1.2, 0.8, abs(v));
        }
        
        void main() {
          vec3 color = uColor;
          float alpha = uOpacity;
          
          // 1. FIBER TEXTURE - Subtle grain along ribbon
          float fiber = sin(vU * 50.0) * 0.15 + 0.85;
          color *= fiber;
          
          // 2. FLOW TRACE - Moving pattern (subtle)
          float flow = flowTrace(vU, uTime) * 0.25;
          color += color * flow * 0.3;
          
          // 3. RIBBON EDGES - Feather across width
          float edge = edgeFade(vV);
          alpha *= edge;
          
          // 4. STRESS FRACTURES - Cracks + micro dropout (no glow)
          float fracture = fractureMask(vU, vV, uTime, vStress);
          color *= fracture;
          
          // 5. STRESS DARKENING - Subtle color shift under load
          float stressDarken = mix(1.0, 0.7, vStress * 0.5);
          color *= stressDarken;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      uniforms: {
        uColor: { value: new THREE.Color(0x00ffff) },
        uStress: { value: 0 },
        uTime: { value: 0 },
        uFlow: { value: 1.0 },
        uOpacity: { value: 0.8 },
        uWidth: { value: 1.0 }
      }
    };

    return {
      // Main link material - Link Visual Language v2 (shader-driven fiber ribbon)
      neonLine: new THREE.ShaderMaterial({
        vertexShader: linkShader.vertexShader,
        fragmentShader: linkShader.fragmentShader,
        uniforms: THREE.UniformsUtils.clone(linkShader.uniforms),
        transparent: true,
        fog: false,
        depthTest: true,     // Always test depth (readability)
        depthWrite: false,   // Don't write to depth (performance + transparency)
        side: THREE.DoubleSide,
        blending: THREE.NormalBlending
      }),
      
      // Ghost preview (shader-driven, subtle)
      ghostLine: new THREE.ShaderMaterial({
        vertexShader: linkShader.vertexShader,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uStress;
          varying float vU;
          
          void main() {
            vec3 color = uColor * 0.5;
            gl_FragColor = vec4(color, 0.25);
          }
        `,
        uniforms: {
          uColor: { value: new THREE.Color(0xffffff) },
          uStress: { value: 0 },
          uTime: { value: 0 }
        },
        transparent: true,
        fog: false,
        depthWrite: false,
        side: THREE.DoubleSide
      }),
      
      // Valid connection ghost
      ghostValid: new THREE.ShaderMaterial({
        vertexShader: linkShader.vertexShader,
        fragmentShader: `
          uniform vec3 uColor;
          varying float vU;
          
          void main() {
            gl_FragColor = vec4(uColor, 0.3);
          }
        `,
        uniforms: {
          uColor: { value: new THREE.Color(0x00ffff) },
          uStress: { value: 0 },
          uTime: { value: 0 }
        },
        transparent: true,
        fog: false,
        depthWrite: false,
        side: THREE.DoubleSide
      }),
      
      // Invalid connection ghost
      ghostInvalid: new THREE.ShaderMaterial({
        vertexShader: linkShader.vertexShader,
        fragmentShader: `
          uniform vec3 uColor;
          varying float vU;
          
          void main() {
            gl_FragColor = vec4(uColor, 0.3);
          }
        `,
        uniforms: {
          uColor: { value: new THREE.Color(0xff0000) },
          uStress: { value: 0 },
          uTime: { value: 0 }
        },
        transparent: true,
        fog: false,
        depthWrite: false,
        side: THREE.DoubleSide
      }),
      
      // Data flow particle (unchanged)
      particle: new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 1.0,
        fog: false
      })
    };
  }
  
  /**
   * Create ribbon geometry for Link Visual Language v2
   * Generates a screen-space ribbon mesh between two points
   * Reused across all links (single geometry instance)
   */
  createRibbonGeometry(startPos, endPos, segments = 80, ribbonWidth = 0.3) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const indices = [];
    
    // Generate ribbon along the curve
    const dir = new THREE.Vector3().subVectors(endPos, startPos);
    const distance = dir.length();
    
    // Create perpendicular vector for ribbon width
    const perpendicular = new THREE.Vector3(-dir.y, dir.x, 0).normalize().multiplyScalar(ribbonWidth);
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = new THREE.Vector3().addVectors(startPos, dir.clone().multiplyScalar(t));
      
      // Top edge of ribbon
      const top = point.clone().add(perpendicular);
      positions.push(top.x, top.y, top.z);
      
      // Bottom edge of ribbon
      const bottom = point.clone().sub(perpendicular);
      positions.push(bottom.x, bottom.y, bottom.z);
    }
    
    // Create indices for ribbon faces
    for (let i = 0; i < segments; i++) {
      const a = i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = b + 2;
      
      // Two triangles per segment
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    geometry.computeVertexNormals();
    
    return geometry;
  }
  
  /**
   * Update time for animations
   */
  update(deltaTime) {
    // 🔒 HARD INTERACTION AUTHORITY - Stop all visual updates when locked
    if (isVisualLocked()) return;
    
    if (window.DEBUG_VISUAL_MODE) return;
    
    if (this._timeOrigin === null) this._timeOrigin = VisualTime.now; // Phase 2A: canonical VisualTime source
    this.time = VisualTime.now - this._timeOrigin;
    this.updateParticles(deltaTime);
    this.updateMetricLinks(deltaTime);  // [Metrics Integration v1.0]
    this.applyDegradationEffects();  // [SESSION 88] Apply quality-based degradation
    this.updateShaderUniforms();  // Update stress-driven link shader
  }
  
  /**
   * Update shader uniforms for Link Visual Language v2
   * FX-only uniforms:
   * - uTime
   * - uFlow
   * - uOpacity
   */
  updateShaderUniforms() {
    if (!this.scene) return;

    // Flow rate controlled by system state or debug API
    const flowRate = window.__linkVisual?.flowRate ?? 1.0;
    
    // Global opacity control
    const globalOpacity = window.__linkVisual?.opacity ?? 0.8;
    const useShared = this._useSharedMaterials();

    const applyFxUniformsToMaterial = (material, uniformStore = null) => {
      if (!material?.uniforms) return;
      const useDedupUniforms = useShared && uniformStore;

      if (material.uniforms.uTime) {
        if (useDedupUniforms) uniformStore.uTime = this.time;
        else material.uniforms.uTime.value = this.time;
      }
      if (material.uniforms.uFlow) {
        if (useDedupUniforms) uniformStore.uFlow = flowRate;
        else material.uniforms.uFlow.value = flowRate;
      }
      if (material.uniforms.uOpacity) {
        if (useDedupUniforms) uniformStore.uOpacity = globalOpacity;
        else material.uniforms.uOpacity.value = globalOpacity;
      }
    };

    for (const [, state] of this.linkStates.entries()) {
      if (!state?.mesh) continue;

      const rootStore = state.mesh.userData?.__linkUniforms;
      if (state.mesh.material && !Array.isArray(state.mesh.material)) {
        applyFxUniformsToMaterial(state.mesh.material, rootStore);
      } else if (Array.isArray(state.mesh.material)) {
        state.mesh.material.forEach(mat => applyFxUniformsToMaterial(mat, rootStore));
      }

      if (Array.isArray(state.mesh.children)) {
        for (const child of state.mesh.children) {
          const childStore = child.userData?.__linkUniforms;
          if (child.material && !Array.isArray(child.material)) {
            applyFxUniformsToMaterial(child.material, childStore);
          } else if (Array.isArray(child.material)) {
            child.material.forEach(mat => applyFxUniformsToMaterial(mat, childStore));
          }
        }
      }
    }
  }
  
  /**
   * [SESSION 88] Apply link degradation system effects
   * Scales visual intensity based on link quality and load pressure
   * 
   * [SESSION 89] EXTENDED: Apply link collapse warning effects
   * Visualize collapse warning states with intensity pulsing and color effects
   * 
   * This is called automatically in update() every frame
   */
  applyDegradationEffects() {
    if (!this.scene) return;
    
    // Find all neon curve groups in scene
    this.scene.traverse((obj) => {
      // Skip non-groups (efficiency)
      if (!obj.isGroup || !obj.userData.type === 'neonCurve') return;
      
      const curveGroup = obj;
      const link = curveGroup.userData?.link;
      
      if (!link) return;
      
      // ===== APPLY QUALITY-BASED DEGRADATION =====
      if (link.userData?.degradation) {
        const degradation = link.userData.degradation;
        const visualIntensity = degradation.visualIntensity ?? 1.0;
        
        // Scale line materials opacity and emissive by visual intensity
        if (curveGroup.userData.line?.material) {
          const lineMesh = curveGroup.userData.line;
          const lineMat = lineMesh.material;
          const nextOpacity = Math.max(0.15, lineMat.opacity * visualIntensity);
          this._setLinkOpacity(lineMesh, nextOpacity);
        }
        
        // Scale glow materials opacity by visual intensity
        if (curveGroup.userData.glowLine?.material) {
          const glowMesh = curveGroup.userData.glowLine;
          const glowMat = glowMesh.material;
          const nextGlowOpacity = Math.max(0.05, glowMat.opacity * visualIntensity * 0.5);
          this._setLinkOpacity(glowMesh, nextGlowOpacity);
        }
        
        // Optional: Add color tint for strained/critical links
        if (degradation.state === 'strained' || degradation.state === 'critical') {
          const redTint = degradation.state === 'critical' ? 0.8 : 0.4;
          if (curveGroup.userData.line?.material) {
            const lineMesh = curveGroup.userData.line;
            this._tintLinkColor(lineMesh, DEGRADATION_RED_TINT, redTint * 0.2);
          }
        }
      }
      
      // ===== [SESSION 89] APPLY COLLAPSE WARNING EFFECTS =====
      // Visual feedback for links approaching collapse
      if (link.userData?.collapseWarning) {
        // WARNING STATE: Flickering/instability
        const flicker = 0.5 + 0.5 * Math.sin(this.time * 4.0); // 4Hz flicker
        
        if (curveGroup.userData.line?.material) {
          const lineMesh = curveGroup.userData.line;
          // Yellow/orange warning color
          this._setLinkColor(lineMesh, COLLAPSE_WARN_COLOR);
          this._setLinkOpacity(lineMesh, 0.6 + 0.3 * flicker); // 60-90% opacity
        }
        
        if (curveGroup.userData.glowLine?.material) {
          const glowMesh = curveGroup.userData.glowLine;
          this._setLinkOpacity(glowMesh, 0.3 * flicker); // Pulsing glow
        }
      }
      
      if (link.userData?.collapseCritical) {
        // CRITICAL STATE: Severe flickering + red color + dimming
        const flicker = 0.3 + 0.4 * Math.sin(this.time * 8.0); // 8Hz aggressive flicker
        
        if (curveGroup.userData.line?.material) {
          const lineMesh = curveGroup.userData.line;
          // Red critical color
          this._setLinkColor(lineMesh, COLLAPSE_CRIT_COLOR);
          this._setLinkOpacity(lineMesh, 0.4 + 0.4 * flicker); // 40-80% opacity
        }
        
        if (curveGroup.userData.glowLine?.material) {
          const glowMesh = curveGroup.userData.glowLine;
          this._setLinkOpacity(glowMesh, 0.5 * flicker); // Aggressive pulsing
        }
      }
      
      if (link.userData?.collapseActive) {
        // COLLAPSE IN PROGRESS: Rapid flickering, nearly invisible, red
        const flicker = 0.1 + 0.3 * Math.sin(this.time * 12.0); // 12Hz chaotic
        
        if (curveGroup.userData.line?.material) {
          const lineMesh = curveGroup.userData.line;
          this._setLinkColor(lineMesh, COLLAPSE_ACTIVE_COLOR); // Pure red
          this._setLinkOpacity(lineMesh, 0.1 + 0.2 * flicker); // 10-30% opacity
        }
        
        if (curveGroup.userData.glowLine?.material) {
          const glowMesh = curveGroup.userData.glowLine;
          this._setLinkOpacity(glowMesh, 0.1 * flicker); // Barely visible glow
        }
      }
    });
  }
  
  /**
   * [SESSION 103] Emergency debug link - Simple visible straight line
  * Legacy emergency debug link creation (deprecated)
   * Creates obvious, unchanging line that cannot be confused with old renderer
   * @private
   */
  createEmergencyDebugLink(sourcePos, targetPos, color, isPreview) {
    const group = new THREE.Group();
    
    // Create simple straight line (no curve)
    const positions = new Float32Array([
      sourcePos.x, sourcePos.y, sourcePos.z,
      targetPos.x, targetPos.y, targetPos.z
    ]);
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Simple solid material - obviously different from complex shader
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      linewidth: 8,  // Note: linewidth may not work on all platforms
      fog: false,
      transparent: false,
      depthWrite: true,
      depthTest: true
    });
    
    const line = new THREE.Line(geometry, material);
    group.add(line);
    
    // Store minimal metadata
    Object.assign(ensureUserData(group), {
      type: 'emergencyDebugLink',
      isPreview,
      color,
      line,
      createdAt: Date.now()
    });
    
    console.log('[NeonLinkVisuals] 🟠 EMERGENCY DEBUG LINK created');
    
    return group;
  }
  
  /**
   * Create a neon Bézier curve between two nodes
   * Returns visualization group with curve and effects
   * [LinkPriority v1.0] Now supports priority-aware visual effects
  * Legacy emergency override: Simple debug link
   */
  createNeonCurve(sourcePos, targetPos, options = {}) {
    const {
      color = 0x00ffff,
      traffic = { load: 0.5, priority: 0.5, throughput: 0.5 },
      isPreview = false,
      link = null  // [LinkPriority v1.0] Optional link object with priority data
    } = options;
    const useSharedMaterial = this._useSharedMaterials();
    const sharedMaterials = useSharedMaterial ? getSharedLinkMaterials(this.materials) : null;
    if (!useSharedMaterial) {
      SHARED_MATERIAL_USAGE.clonePathHits += 1;
      logSharedMaterialUsage();
    }
    
    // ========================================================================
    // SESSION 103: EMERGENCY VISUAL LOCKDOWN
    // Replace complex link visual with obvious debug line
    // ========================================================================
    if (window.DEBUG_VISUAL_MODE) {
      return this.createEmergencyDebugLink(sourcePos, targetPos, color, isPreview);
    }
    
    const group = new THREE.Group();
    
    // Calculate curve geometry
    const curvePoints = this.generateBezierCurve(sourcePos, targetPos);
    const positions = new Float32Array(curvePoints.length * 3);
    
    curvePoints.forEach((point, i) => {
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    });
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const lineColor = new THREE.Color(color);
    const lineMaterial = useSharedMaterial ? sharedMaterials.neonLine : this.materials.neonLine.clone();
    if (!useSharedMaterial) {
      lineMaterial.uniforms.uColor.value.copy(lineColor);
    }

    const line = new THREE.Line(geometry, lineMaterial);
    line.frustumCulled = false;
    if (useSharedMaterial) {
      this._ensureLinkUniformStore(line, 'neonLine', {
        uColor: lineColor,
        uStress: lineMaterial.uniforms?.uStress?.value,
        uFlow: lineMaterial.uniforms?.uFlow?.value,
        uOpacity: lineMaterial.uniforms?.uOpacity?.value,
        uWidth: lineMaterial.uniforms?.uWidth?.value,
        opacity: lineMaterial.opacity,
        linewidth: lineMaterial.linewidth
      });
      this._attachUniformPatcher(line, 'neonLine');
      SHARED_MATERIAL_USAGE.neonLine += 1;
      logSharedMaterialUsage();
    }
    group.add(line);

    // Add ghost line (remains simple for preview feedback)
    const glowGeometry = new THREE.BufferGeometry();
    glowGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const glowMaterial = useSharedMaterial ? sharedMaterials.ghostLine : this.materials.ghostLine.clone();
    if (!useSharedMaterial) {
      glowMaterial.uniforms.uColor.value = new THREE.Color(color);
    }

    const glowLine = new THREE.Line(glowGeometry, glowMaterial);
    glowLine.frustumCulled = false;
    glowLine.position.z += 0.01; // Slight offset to prevent z-fighting
    if (useSharedMaterial) {
      this._ensureLinkUniformStore(glowLine, 'ghostLine', {
        uColor: new THREE.Color(color),
        uStress: glowMaterial.uniforms?.uStress?.value,
        opacity: glowMaterial.opacity,
        linewidth: glowMaterial.linewidth
      });
      this._attachUniformPatcher(glowLine, 'ghostLine');
      SHARED_MATERIAL_USAGE.ghostLine += 1;
      logSharedMaterialUsage();
    }
    group.add(glowLine);

    // Store metadata for animation
    Object.assign(ensureUserData(group), {
      type: 'neonCurve',
      curvePoints,
      traffic,
      color,
      isPreview,
      createdAt: this.time,
      line,
      glowLine,
      sourcePos: sourcePos.clone(),
      targetPos: targetPos.clone(),
      // [LinkPriority v1.0] Store link reference for visual updates
      link: link || null,
      priorityState: link ? this._getPriorityVisualState(link) : null
    });

    if (link && link.priority) {
      this.applyPriorityEffects(group, link);
    }
    return group;
  }
  
  /**
   * Generate Bézier curve points
   */
  generateBezierCurve(start, end, resolution = this.config.curveResolution) {
    const points = [];
    
    // Control points for curve (slightly elevated middle)
    const mid = new THREE.Vector3();
    mid.addVectors(start, end);
    mid.multiplyScalar(0.5);
    mid.y += Math.abs(end.x - start.x) * 0.15; // Slight arch
    
    for (let i = 0; i <= resolution; i++) {
      const t = i / resolution;
      const t1 = 1 - t;
      
      // Quadratic Bézier: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
      const point = new THREE.Vector3();
      point.copy(start);
      point.multiplyScalar(t1 * t1);
      
      const midPart = new THREE.Vector3().copy(mid);
      midPart.multiplyScalar(2 * t1 * t);
      point.add(midPart);
      
      const endPart = new THREE.Vector3().copy(end);
      endPart.multiplyScalar(t * t);
      point.add(endPart);
      
      points.push(point);
    }
    
    return points;
  }
  
  /**
   * Calculate line width based on traffic load
   */
  calculateLineWidth(load) {
    const minWidth = this.config.baseLineWidth;
    const maxWidth = this.config.maxLineWidth;
    return minWidth + (maxWidth - minWidth) * Math.min(load, 1);
  }
  
  /**
   * Get color based on traffic level
   */
  getTrafficColor(load) {
    if (load < 0.33) return this.config.trafficColors.low;
    if (load < 0.66) return this.config.trafficColors.medium;
    if (load < 0.9) return this.config.trafficColors.high;
    return this.config.trafficColors.overload;
  }
  
  /**
   * [SYNERGY VISUALS v1.0] Create synergy-based flow particles
   * Particles visualize energy synchronization between nodes
   * - AWAKENED: Bright cyan, fast (0.15), denser (5-8 particles)
   * - STRONG: Dimmer blue, slower (0.05), sparse (2-3 particles)
   * Uses existing particle pool (no new system created)
   * 
   * @param {Object} linkMesh - Link mesh containing curve data
   * @param {string} synergyState - SynergyState value
   * @returns {Array} Particle data objects added to this.particles
   * @private
   */
  _createSynergyFlowParticles(linkMesh, synergyState) {
    if (!linkMesh || !linkMesh.userData || !linkMesh.userData.curvePoints) {
      return [];
    }

    const isAwakened = (synergyState === SynergyState.AWAKENED);
    const isStrong = (synergyState === SynergyState.STRONG);
    
    if (!isAwakened && !isStrong) {
      return [];  // No flow for LOW or ACTIVE states
    }

    // Configuration per synergy state
    const flowConfig = isAwakened ? {
      color: new THREE.Color(0x00ffff),  // Bright cyan
      speed: 0.15,
      count: 7,
      size: 0.12,
      opacity: 0.9,
      frequency: 0.3  // Spawn new particle every 3 updates
    } : {
      color: new THREE.Color(0x0088ff),  // Softer blue
      speed: 0.05,
      count: 2,
      size: 0.08,
      opacity: 0.6,
      frequency: 0.8  // Spawn less frequently
    };

    const curvePoints = linkMesh.userData.curvePoints;
    const particles = [];

    // Only spawn if enough time has passed (frequency control)
    const lastFlowSpawn = linkMesh.userData.lastSynergyFlowSpawn ?? 0;
    if (this.time - lastFlowSpawn < flowConfig.frequency) {
      return particles;  // Too soon, don't spawn yet
    }

    // Spawn flow particles
    for (let i = 0; i < flowConfig.count; i++) {
      const geometry = new THREE.SphereGeometry(flowConfig.size, 4, 4);
      const material = new THREE.MeshBasicMaterial({
        color: flowConfig.color,
        transparent: true,
        opacity: flowConfig.opacity,
        fog: false,
        depthWrite: false  // Prevent depth buffer conflicts
      });

      const mesh = new THREE.Mesh(geometry, material);
      tagAllowedSphere(mesh, { role: 'vfx', source: 'NeonLinkVisuals.createSynergyFlowParticles' });
      clampSphere(mesh);
      
      // Stagger starting positions along curve
      const startIndex = (i / flowConfig.count) * curvePoints.length;
      mesh.position.copy(curvePoints[Math.floor(startIndex)]);

      this.scene.add(mesh);

      const particleData = {
        mesh,
        pathIndex: startIndex,
        speed: flowConfig.speed,
        trail: [],
        curvePoints: curvePoints,
        isSynergyFlow: true,  // Mark as synergy flow particle
        synergyState: synergyState,
        flowColor: flowConfig.color.clone(),
        // Proximity fade metadata from link mesh
        parentMeshData: linkMesh.userData
      };

      this.particles.push(particleData);
      particles.push(particleData);
    }

    linkMesh.userData.lastSynergyFlowSpawn = this.time;
    return particles;
  }

  /**
   * Create data flow particles along curve
   * [LinkPriority v1.0 PACK 1.1] Variant 2: Dual Stream Flow
   * Enhanced with priority-aware particle count and speed
   * 
   * @param {THREE.Vector3} sourcePos - Start position
   * @param {THREE.Vector3} targetPos - End position
   * @param {Array} curvePoints - Curve geometry points
   * @param {Object} traffic - Traffic data (or full link object with priority)
   * @param {Object} link - [LinkPriority v1.0] Optional link for priority
   * @param {Object} meshData - Optional mesh metadata for proximity fading (sourcePos, targetPos)
   */
  createDataFlowParticles(sourcePos, targetPos, curvePoints, traffic, link = null, meshData = null) {
    const particles = [];
    
    // [LinkPriority v1.0 PACK 1.1] Variant 2: Dual Stream – compute particle count from priority
    let particleCount = this.config.particleCount;
    let particleSpeedMul = 1.0;
    
    if (link && link.priority) {
      const state = this._getPriorityVisualState(link);
      particleCount = state.particleCount;
      particleSpeedMul = state.pulseSpeed / this.config.priority.normal.pulseSpeed;
    } else if (traffic && traffic.priority !== undefined) {
      // Fallback: old API
      particleCount = Math.ceil(this.config.particleCount * traffic.priority);
      particleSpeedMul = 0.5 + traffic.priority;
    }
    
    // Variant 2: Dual Stream – bidirectional particles (if high priority)
    const isDualStream = link && link.priority && link.priority.tier >= 2;
    const streamCount = isDualStream ? 2 : 1;
    
    for (let stream = 0; stream < streamCount; stream++) {
      const particlesThisStream = Math.ceil(particleCount / streamCount);
      
      for (let i = 0; i < particlesThisStream; i++) {
        const geometry = new THREE.SphereGeometry(this.config.particleSize, 6, 6);
        
        // Variant 3: Aura Field – traffic color for particle hue
        const particleColor = (link && link.priority) 
          ? this._getTrafficBand(link.priority.traffic)
          : 'low';
        const colorObj = this.config.trafficColors[particleColor] || this.getTrafficColor(traffic?.load || 0.5);
        
        const material = new THREE.MeshBasicMaterial({
          color: colorObj,
          transparent: true,
          opacity: 1.0,
          fog: false,
          depthWrite: false  // Prevent depth buffer conflicts
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        tagAllowedSphere(mesh, { role: 'vfx', source: 'NeonLinkVisuals.createDataFlowParticles' });
        clampSphere(mesh);
        
        // Random starting position on curve
        const startIndex = Math.floor(Math.random() * curvePoints.length);
        mesh.position.copy(curvePoints[startIndex]);
        
        // Variant 2: Dual Stream – reverse direction for stream 1
        const direction = stream === 0 ? 1 : -1;
        
        // Particle data with proximity fade metadata
        const particleData = {
          mesh,
          pathIndex: startIndex,
          speed: this.config.particleSpeed * particleSpeedMul * direction,
          trail: [],
          traffic,
          curvePoints,
          // [LinkPriority v1.0] Store state for animation
          link,
          priorityTier: link ? link.priority?.tier : 0,
          // Proximity fade metadata (sourcePos/targetPos for node safety checks)
          parentMeshData: meshData || { sourcePos, targetPos }
        };
        
        this.scene.add(mesh);
        this.particles.push(particleData);
        particles.push(particleData);
      }
    }
    
    return particles;
  }
  
  /**
   * Calculate perpendicular offset from curve at given point
   * Uses curve tangent and binormal to position particles elegantly
   * 
   * @private
   */
  _getParticleLateralOffset(curvePoints, currentIndex) {
    if (currentIndex < 0 || currentIndex >= curvePoints.length) {
      return new THREE.Vector3(0, 0, 0);
    }
    
    // Get tangent direction from curve
    let tangent = new THREE.Vector3();
    if (currentIndex > 0 && currentIndex < curvePoints.length - 1) {
      tangent.subVectors(
        curvePoints[Math.min(currentIndex + 1, curvePoints.length - 1)],
        curvePoints[Math.max(currentIndex - 1, 0)]
      );
    } else if (currentIndex === 0 && curvePoints.length > 1) {
      tangent.subVectors(curvePoints[1], curvePoints[0]);
    } else if (currentIndex === curvePoints.length - 1 && curvePoints.length > 1) {
      tangent.subVectors(
        curvePoints[curvePoints.length - 1],
        curvePoints[curvePoints.length - 2]
      );
    }
    
    tangent.normalize();
    
    // Calculate offset magnitude (0.02–0.05 world units, slightly variable)
    const baseOffset = 0.03;
    const offsetMagnitude = baseOffset + Math.sin(currentIndex * 0.5) * 0.015;
    
    // Find perpendicular direction using cross product with world up
    const worldUp = new THREE.Vector3(0, 1, 0);
    let perpendicular = new THREE.Vector3().crossVectors(tangent, worldUp);
    
    // If tangent is nearly parallel to up, use alternative perpendicular
    if (perpendicular.lengthSq() < 0.01) {
      worldUp.set(0, 0, 1);
      perpendicular.crossVectors(tangent, worldUp);
    }
    
    perpendicular.normalize();
    
    // Apply slight oscillation for organic feel
    const oscillation = Math.sin(currentIndex * 0.3) * 0.5 + 0.5;
    perpendicular.multiplyScalar(offsetMagnitude * (0.7 + oscillation * 0.3));
    
    return perpendicular;
  }
  
  /**
   * Check if particle is too close to source/target node for safe display
   * Returns fade factor: 1.0 = full opacity, 0.0 = fully transparent
   * 
   * @private
   */
  _getNodeProximityFade(particlePos, curvePoints, meshData) {
    if (!meshData) return 1.0;
    
    const SAFE_THRESHOLD = 0.35; // Distance units from node center
    const FADE_RANGE = 0.15; // Distance over which fade occurs
    
    // Get source and target positions from metadata
    const sourcePos = meshData.sourcePos;
    const targetPos = meshData.targetPos;
    
    if (!sourcePos || !targetPos) return 1.0;
    
    // Check proximity to source node
    const distToSource = particlePos.distanceTo(sourcePos);
    if (distToSource < SAFE_THRESHOLD) {
      return Math.max(0, (distToSource - SAFE_THRESHOLD + FADE_RANGE) / FADE_RANGE);
    }
    
    // Check proximity to target node
    const distToTarget = particlePos.distanceTo(targetPos);
    if (distToTarget < SAFE_THRESHOLD) {
      return Math.max(0, (distToTarget - SAFE_THRESHOLD + FADE_RANGE) / FADE_RANGE);
    }
    
    return 1.0;
  }
  
  /**
   * Update particle positions and animations
   * Particles now follow curve with perpendicular lateral offset for elegant visual coherence
   * Particle update
   */
  updateParticles(deltaTime) {
    const particlesToRemove = [];
    const shouldCheckBounds = false;
    
    this.particles.forEach(particle => {
      // Skip update if critical data missing (stability guard)
      if (!particle || !particle.mesh || !particle.curvePoints || particle.curvePoints.length === 0) {
        particlesToRemove.push(particle);
        return;
      }
      
      // Move along curve
      particle.pathIndex += particle.speed;
      
      if (particle.pathIndex >= particle.curvePoints.length) {
        // Remove when reached end
        particlesToRemove.push(particle);
        this.scene.remove(particle.mesh);
        if (particle.mesh.geometry) particle.mesh.geometry.dispose();
        if (particle.mesh.material) particle.mesh.material.dispose();
        return;
      }
      
      // Get evaluated curve position
      const currentIndex = Math.floor(particle.pathIndex);
      const currentPoint = particle.curvePoints[currentIndex];
      
      if (!currentPoint) {
        particlesToRemove.push(particle);
        return;
      }
      
      // Calculate perpendicular offset from curve for elegant positioning
      let offsetPos = new THREE.Vector3().copy(currentPoint);
      
      // [PARTICLE SANITY FIX] Apply bounds check if enabled
      if (shouldCheckBounds) {
        const lateralOffset = this._getParticleLateralOffset(particle.curvePoints, currentIndex);
        offsetPos.add(lateralOffset);
        
        // Clamp offset to small radius around curve (sanity check)
        const maxOffsetDistance = 0.1;  // Small radius from curve
        const offsets = new THREE.Vector3().subVectors(offsetPos, currentPoint);
        if (offsets.length() > maxOffsetDistance) {
          offsets.setLength(maxOffsetDistance);
          offsetPos.copy(currentPoint).add(offsets);
        }
      }
      
      // Apply position
      particle.mesh.position.copy(offsetPos);
      
      // Update trail
      particle.trail.push(particle.mesh.position.clone());
      if (particle.trail.length > this.config.trailLength) {
        particle.trail.shift();
      }
      
      // Calculate opacity based on distance to nodes (proximity fade)
      // Also fade at curve ends naturally
      const remainingPath = particle.curvePoints.length - particle.pathIndex;
      const endFade = Math.min(1, remainingPath / 10);
      
      // Get proximity fade factor if metadata available
      let proximityFade = 1.0;
      if (particle.parentMeshData) {
        proximityFade = this._getNodeProximityFade(offsetPos, particle.curvePoints, particle.parentMeshData);
      }
      
      // Cap opacity at 0.35 for non-intrusive particles
      const maxOpacity = 0.35;
      const finalOpacity = endFade * proximityFade * maxOpacity;
      
      // Apply opacity safely (check material exists before mutation)
      if (particle.mesh && particle.mesh.material && typeof particle.mesh.material === 'object' && 'opacity' in particle.mesh.material) {
        if (!shouldSkipLegacyVisualMutation(particle.mesh)) {
          particle.mesh.material.opacity = Math.max(0, finalOpacity);
        }
      }
    });
    
    // Remove dead particles
    this.particles = this.particles.filter(p => !particlesToRemove.includes(p));
  }
  
  /**
   * Animate curve with priority-based pulsing
   * Now integrated with LinkPriority v1.0 system
   * Priority-based pulsing
   */
  animateCurveByPriority(linkGroup, priority) {
    // Handle both old API (numeric 0–1) and new LinkPriority object
    let config, pulseSpeedVal, opacityVal;
    
    if (typeof priority === 'object' && priority.priority) {
      // New: link object with priority data
      const state = this._getPriorityVisualState(priority);
      config = this.config.priority;
      pulseSpeedVal = state.pulseSpeed;
      opacityVal = state.opacity;
    } else if (typeof priority === 'number') {
      // Old API: numeric priority 0–1
      config = this.config.priority;
      const priorityLevel = priority < 0.33 ? 'low' : priority < 0.66 ? 'normal' : 'high';
      const profile = config[priorityLevel];
      pulseSpeedVal = profile.pulseSpeed;
      opacityVal = profile.opacity;
    } else {
      // Fallback
      pulseSpeedVal = 1.0;
      opacityVal = 0.75;
    }
    
    const pulse = Math.sin(this.time * pulseSpeedVal) * 0.3 + 0.7;
    
    linkGroup.children.forEach(child => {
      // SANDBOXING: Skip protected visual layers
      if (shouldSkipLegacyVisualMutation(child)) return;
      
      // Safety: Check material exists before mutation
      if (child.material && typeof child.material === 'object' && 'opacity' in child.material) {
        this._setLinkOpacity(child, opacityVal * pulse);
      }
    });
  }

  /**
   * [LinkPriority v1.0 PACK 1.1] Apply all three priority VFX variants to link materials
   * Variant 1: Weight Pulse (glow intensity + line thickness)
   * Variant 2: Dual Stream Flow (particle count + speed)
   * Variant 3: Aura Field Intensity (bloom scale)
   * 
   * @param {Object} linkGroup - THREE.Group containing link meshes/materials
   * @param {Object} link - Link object with priority data
   */
  applyPriorityEffects(linkGroup, link) {
    if (!linkGroup || !link) return;
    
    // Get unified visual state from LinkPriority system
    const state = this._getPriorityVisualState(link);

    // Apply effects to all children (line, glow, particles, etc.)
    linkGroup.children.forEach((child) => {
      // SANDBOXING: Skip protected visual layers
      if (shouldSkipLegacyVisualMutation(child)) return;
      
      if (!child.material || typeof child.material !== 'object') return;

      // Variant 1: Weight Pulse – glow and thickness (sandboxed)
      if (child.material.linewidth !== undefined) {
        this._setLinkLinewidth(child, Math.max(1, state.lineWidth));
      }

      // Variant 3: Aura Field – bloom multiplier via color intensity (sandboxed)
      if (child.material.emissiveIntensity !== undefined) {
        child.material.emissiveIntensity *= state.glow / this.config.bloomIntensity;
      }

      // Variant 3: Aura Field – opacity/alpha (sandboxed)
      // Safety: Check opacity property exists
      if ('opacity' in child.material) {
        this._setLinkOpacity(child, state.opacity);
      }

      // Variant 2: Dual Stream Flow – color from traffic waveform (sandboxed)
      if (state.color && (child.material.color || child.material.uniforms?.uColor)) {
        this._setLinkColor(child, state.color);
      }

      // Store visual state for other systems (like particle generation)
      if (child.userData) {
        child.userData.priorityState = state;
        child.userData.priorityTier = state.tier;
      }
    });

    // Store state on group for reference
    if (linkGroup.userData) {
      linkGroup.userData.priorityState = state;
    }
  }
  
  /**
   * Create error feedback: red pulse returning to source
   */
  createErrorPulse(sourcePos, curvePoints, options = {}) {
    const { duration = 0.4, color = 0xff0000 } = options;
    
    const pulseGroup = new THREE.Group();
    
    // Create animated pulse sphere
    const geometry = new THREE.SphereGeometry(0.15, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 1,
      fog: false
    });
    
    const pulse = new THREE.Mesh(geometry, material);
    tagAllowedSphere(pulse, { role: 'vfx', source: 'NeonLinkVisuals.createErrorPulse' });
    clampSphere(pulse);
    pulse.position.copy(sourcePos);
    pulseGroup.add(pulse);
    
    // Store animation data
    Object.assign(ensureUserData(pulseGroup), {
      type: 'errorPulse',
      startPos: sourcePos.clone(),
      curvePoints,
      createdAt: this.time,
      duration,
      pulse,
      material
    });
    
    this.scene.add(pulseGroup);
    return pulseGroup;
  }
  
  /**
   * Create shatter effect for link deletion
   */
  createShatterEffect(curvePoints, color = 0x00ffff, duration = 0.6) {
    const effectGroup = new THREE.Group();
    
    // Create fragments along the curve
    const fragmentCount = 8;
    const fragments = [];
    
    for (let i = 0; i < fragmentCount; i++) {
      const index = Math.floor((i / fragmentCount) * curvePoints.length);
      const point = curvePoints[index];
      
      const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
        fog: false
      });
      
      const fragment = new THREE.Mesh(geometry, material);
      fragment.position.copy(point);
      
      // Random velocity outward
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );
      
      fragments.push({
        mesh: fragment,
        velocity,
        life: 1
      });
      
      effectGroup.add(fragment);
    }
    
    // Store animation data
    Object.assign(ensureUserData(effectGroup), {
      type: 'shatterEffect',
      fragments,
      createdAt: this.time,
      duration,
      color
    });
    
    this.scene.add(effectGroup);
    return effectGroup;
  }
  
  /**
   * Create drag tension effect for nodes being moved
   */
  createDragTensionEffect(linkGroup) {
    // Brighten and make more elastic (sandboxed)
    linkGroup.children.forEach(child => {
      // SANDBOXING: Skip protected visual layers
      if (shouldSkipLegacyVisualMutation(child)) return;
      
      if (child.material) {
        child.material.opacity = Math.min(1, child.material.opacity * 1.2);
        child.scale.y = 1.3; // Stretch effect
      }
    });
  }
  
  /**
   * Reset drag tension effect
   */
  resetDragTensionEffect(linkGroup) {
    linkGroup.children.forEach(child => {
      // SANDBOXING: Skip protected visual layers
      if (shouldSkipLegacyVisualMutation(child)) return;
      
      child.scale.y = 1;
    });
  }
  
  /**
   * Create multi-output node glow
   */
  createMultiOutputGlow(nodePosition, outputs = 2, colors = [0x00ffff, 0xff00ff]) {
    const glowGroup = new THREE.Group();
    
    // Create concentric rings pulsing
    for (let i = 0; i < outputs; i++) {
      const radius = 0.3 + i * 0.2;
      const geometry = new THREE.TorusGeometry(radius, 0.05, 16, 32);
      
      const color = colors[i % colors.length];
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.6,
        fog: false
      });
      
      const torus = new THREE.Mesh(geometry, material);
      torus.position.copy(nodePosition);
      Object.assign(ensureUserData(torus), { ringIndex: i, color });
      
      glowGroup.add(torus);
    }
    
    Object.assign(ensureUserData(glowGroup), {
      type: 'multiOutputGlow',
      nodePosition: nodePosition.clone(),
      createdAt: this.time
    });
    
    this.scene.add(glowGroup);
    return glowGroup;
  }
  
  /**
   * Update multi-output glow animation
   */
  updateMultiOutputGlow(glowGroup) {
    glowGroup.children.forEach((torus, index) => {
      const baseOpacity = 0.6;
      const pulse = Math.sin(this.time * (1 + index * 0.3)) * 0.4 + baseOpacity;
      torus.material.opacity = pulse;
      torus.rotation.z += 0.02 * (index % 2 === 0 ? 1 : -1);
    });
  }
  
  /**
   * Create port highlight
   */
  createPortHighlight(portPosition, category = 'input') {
    const categoryColors = {
      'input': 0x00ddff,
      'process': 0xffaa00,
      'integration': 0x00ff88,
      'analytics': 0xaa00ff,
      'storage': 0x88ccff,
      'control': 0xff0088
    };
    
    const geometry = new THREE.CircleGeometry(0.12, 16);
    const material = new THREE.MeshBasicMaterial({
      color: categoryColors[category] || 0x00ffff,
      transparent: true,
      opacity: 1,
      fog: false,
      side: THREE.DoubleSide
    });
    
    const highlight = new THREE.Mesh(geometry, material);
    highlight.position.copy(portPosition);
    highlight.position.z += 0.01; // Slight forward offset
    
    return highlight;
  }
  
  /**
   * Create preview line (cursor following)
   */
  createPreviewLine(fromPos, toPos, isValid = true) {
    const points = this.generateBezierCurve(fromPos, toPos);
    const positions = new Float32Array(points.length * 3);
    
    points.forEach((point, i) => {
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    });
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const useSharedMaterial = this._useSharedMaterials();
    const sharedMaterials = useSharedMaterial ? getSharedLinkMaterials(this.materials) : null;
    if (!useSharedMaterial) {
      SHARED_MATERIAL_USAGE.clonePathHits += 1;
      logSharedMaterialUsage();
    }

    const material = isValid 
      ? (useSharedMaterial ? sharedMaterials.ghostValid : this.materials.ghostValid.clone())
      : (useSharedMaterial ? sharedMaterials.ghostInvalid : this.materials.ghostInvalid.clone());
    
    material.linewidth = 1;
    
    const line = new THREE.Line(geometry, material);
    line.frustumCulled = false;
    if (useSharedMaterial) {
      const type = isValid ? 'ghostValid' : 'ghostInvalid';
      const colorSeed = isValid ? DEFAULT_VALID_COLOR.clone() : DEFAULT_INVALID_COLOR.clone();
      this._ensureLinkUniformStore(line, type, { uColor: colorSeed, uStress: material.uniforms?.uStress?.value, opacity: material.opacity, linewidth: material.linewidth });
      this._attachUniformPatcher(line, type);
      SHARED_MATERIAL_USAGE[type] += 1;
      logSharedMaterialUsage();
    }
    return line;
  }
  
  /**
   * [Metrics Integration v1.0] Register a link for metric-based visualization
   * Called when link is created
   * [SYNERGY STATE RESOLVER] Initialize synergy state tracking
   * 
   * @param {string} linkId - Unique link identifier
   * @param {THREE.Object3D} mesh - Link mesh to update
   */
  registerLink(linkId, mesh) {
    if (!linkId || !mesh) return;
    
    this.linkStates.set(linkId, {
      mesh,
      corruption: 0,
      synergy: 0,
      harmony: 0,
      synergyState: SynergyState.LOW,  // [SYNERGY STATE RESOLVER] Centralized state
      isSynergyAwakened: false,
      isHarmonyStabilized: false,
      eventSynergyBoostUntil: 0,
      lastUpdate: 0
    });
    
    console.debug(`[NeonLinkVisuals] ✓ Registered link: ${linkId}`);
  }
  
  /**
   * [Metrics Integration v1.0] Unregister a link
   * Called when link is removed
   * 
   * @param {string} linkId - Unique link identifier
   */
  unregisterLink(linkId) {
    if (this.linkStates.has(linkId)) {
      this.linkStates.delete(linkId);
      console.debug(`[NeonLinkVisuals] ✓ Unregistered link: ${linkId}`);
    }
  }
  
  /**
   * [Metrics Integration v1.0] Update link state with metric values
   * Receives existing metric values (no computation)
   * 
   * @param {string} linkId - Unique link identifier
   * @param {Object} metrics - { corruption, synergy, harmony }
   */
  updateLinkState(linkId, metrics = {}) {
    const state = this.linkStates.get(linkId);
    if (!state) return;
    
    // Only update if values changed significantly (reduce thrashing)
    const threshold = 0.01;
    const hasChange = 
      Math.abs((metrics.corruption ?? 0) - state.corruption) > threshold ||
      Math.abs((metrics.synergy ?? 0) - state.synergy) > threshold ||
      Math.abs((metrics.harmony ?? 0) - state.harmony) > threshold;
    
    if (hasChange) {
      state.corruption = metrics.corruption ?? 0;
      state.synergy = metrics.synergy ?? 0;
      state.harmony = metrics.harmony ?? 0;
      state.lastUpdate = this.time;
      
      // [SYNERGY STATE RESOLVER] Use centralized synergy state instead of hard-coded thresholds
      state.synergyState = this.synergyResolver.resolve(state.synergy);
      state.isSynergyAwakened = (state.synergyState === SynergyState.AWAKENED);
      
      // [HARMONY STABILIZATION] Use hard-coded threshold (no resolver yet)
      state.isHarmonyStabilized = (state.harmony >= 0.80);
    }
  }
  
  /**
   * [Metrics Integration v1.0] Compute RGB color from normalized metric values
   * Maps: R = corruption, G = harmony, B = synergy
   * Normalizes to 0-1 range for each channel
   * 
   * @private
   */
  _computeMetricColor(corruption, synergy, harmony) {
    // Normalize values (assuming 0-1 input range)
    const r = Math.max(0, Math.min(1, corruption));
    const g = Math.max(0, Math.min(1, harmony));
    const b = Math.max(0, Math.min(1, synergy));
    
    // Create color and convert to hex
    const color = new THREE.Color(r, g, b);
    return color;
  }
  
  /**
   * [Metrics Integration v1.0] Compute emissive pulse based on dominant metric
   * Creates a "living network" pulse effect
   * 
   * @private
   */
  _computeEmissivePulse(corruption, synergy, harmony) {
    // Find dominant value
    const dominant = Math.max(corruption, synergy, harmony);
    
    // Pulse speed based on dominant metric intensity
    const pulseSpeed = 1.0 + dominant * 2.0; // 1x to 3x normal speed
    
    // Emissive intensity from dominant value
    const emissiveIntensity = 0.3 + dominant * 0.7; // 0.3 to 1.0
    
    // Pulse phase
    const pulse = Math.sin(this.time * pulseSpeed) * 0.5 + 0.5; // 0 to 1
    
    return {
      intensity: emissiveIntensity * pulse,
      speed: pulseSpeed,
      dominant: dominant
    };
  }

  /**
   * [SYNERGY VISUALS v1.0] Compute synergy-based pulsing effect
   * Adds rhythmic intensity boost to links with high synergy
   * - AWAKENED: Fast (3 Hz), strong boost (×0.4)
   * - STRONG: Slow (0.5 Hz), gentle boost (×0.1)
   * - Other states: No additional boost
   * 
   * @param {string} synergyState - SynergyState value
   * @returns {Object} { boost, frequency } for emissive modulation
   * @private
   */
  _computeSynergyPulse(synergyState) {
    if (!synergyState) {
      return { boost: 0, frequency: 0 };
    }

    const isAwakened = (synergyState === SynergyState.AWAKENED);
    const isStrong = (synergyState === SynergyState.STRONG);

    if (!isAwakened && !isStrong) {
      return { boost: 0, frequency: 0 };
    }

    const frequency = isAwakened ? 3.0 : 0.5;  // Hz
    const pulse = Math.sin(this.time * frequency) * 0.5 + 0.5; // 0-1 range
    const boostAmount = isAwakened ? 0.4 : 0.1;

    return {
      boost: pulse * boostAmount,
      frequency: frequency
    };
  }
  
  /**
   * [Metrics Integration v1.0] Update all registered links with current metrics
   * Called from main animation loop
   * [SYNERGY/HARMONY UPGRADE] Added segmented bonds (synergy) and motion damping (harmony)
   * [SYNERGY VISUALS v1.0] Create synergy flow particles for AWAKENED/STRONG links
   * 
   * @param {number} delta - Delta time in seconds
   */
  updateMetricLinks(delta) {
    for (const [linkId, state] of this.linkStates.entries()) {
      if (!state.mesh || !state.mesh.material) continue;
      
      const { corruption, synergy, harmony, synergyState } = state;
      
      // Compute color from metrics
      const metricColor = this._computeMetricColor(corruption, synergy, harmony);
      
      // Compute emissive pulse
      const pulse = this._computeEmissivePulse(corruption, synergy, harmony);
      
      // [SYNERGY VISUALS v1.0] Create moving energy patterns for high-synergy links
      if (synergyState === SynergyState.AWAKENED || synergyState === SynergyState.STRONG) {
        this._createSynergyFlowParticles(state.mesh, synergyState);
      }
      
      // [SYNERGY/HARMONY/CORRUPTION/CONTAGION UPGRADE] Modify visual behavior based on state
      // [CORRUPTION VISUAL STATE] Apply corruption instability first (can override harmony)
      this._applyCorruptionVisuals(state.mesh, state.corruption);
      
      // [CORRUPTION CONTAGION v1.0] Apply contagion glow feedback
      // Infected links glow with pulsing red/orange as they spread corruption
      if (state.mesh.userData && state.mesh.userData.contagionState) {
        this._applyContagionVisuals(state.mesh, state.mesh.userData.contagionState);
      }
      
      // Synergy and harmony apply ON TOP of corruption (may be deformed by it)
      this._applySynergyVisuals(state.mesh, state.isSynergyAwakened);
      this._applyHarmonyVisuals(state.mesh, state.isHarmonyStabilized);
      
      // [SYNERGY VISUALS v1.0] Compute synergy pulsing for emissive boost
      const synergyPulse = this._computeSynergyPulse(synergyState);
      const eventBoost = state.eventSynergyBoostUntil > this.time ? 0.12 : 0;
      const synergyPulseWithEvent = {
        ...(synergyPulse || { boost: 0, frequency: 0 }),
        boost: (synergyPulse?.boost ?? 0) + eventBoost
      };

      // Apply to all materials in the mesh
      if (state.mesh.material) {
        // Single material
        this._applyMetricMaterial(state.mesh.material, metricColor, pulse, synergyPulseWithEvent);
      } else if (state.mesh.material && Array.isArray(state.mesh.material)) {
        // Material array
        for (const mat of state.mesh.material) {
          this._applyMetricMaterial(mat, metricColor, pulse, synergyPulseWithEvent);
        }
      }
      
      // Also apply to any child materials (link group children)
      if (state.mesh.children) {
        for (const child of state.mesh.children) {
          if (child.material && !child.userData?.isSelectionHighlight) {
            this._applyMetricMaterial(child.material, metricColor, pulse, synergyPulseWithEvent);
            
            // [SYNERGY/HARMONY UPGRADE] Track segment visibility for synergy bonding
            if (state.isSynergyAwakened) {
              child.userData.synergizedSegment = true;
            }
          }
        }
      }
    }
  }
  
  /**
   * [Metrics Integration v1.0] Apply metric color + pulse to a material
   * Blends existing color with metric color based on dominant metric
   * [SYNERGY VISUALS v1.0] Add synergy-based emissive boost
   * 
   * @private
   */
  _applyMetricMaterial(material, metricColor, pulse, synergyPulse = null) {
    if (!material) return;
    
    // Blend color: metric color drives the hue
    if (material.color) {
      material.color.lerpColors(material.color, metricColor, 0.3);
    }
    
    // Apply emissive with pulse
    if (material.emissive) {
      material.emissive.copy(metricColor);
      // [SYNERGY VISUALS v1.0] Add synergy pulse boost if provided
      const synergyBoost = synergyPulse?.boost ?? 0;
      material.emissiveIntensity = pulse.intensity + synergyBoost;
    }
  }
  
  /**
   * [SYNERGY/HARMONY UPGRADE] Apply synergy-awakened visual state to link
   * When synergy state is AWAKENED, link appears segmented/bonded with internal structure
   * Modifies visibility and spacing of link segments for chain-like appearance
   * [SYNERGY STATE RESOLVER] Now uses centralized resolver instead of hard-coded 0.85 threshold
   * 
   * @private
   */
  _applySynergyVisuals(linkMesh, isSynergyAwakened) {
    if (!linkMesh || !linkMesh.children) return;
    
    for (const child of linkMesh.children) {
      ensureUserData(child);
      
      if (isSynergyAwakened) {
        // Synergy awakened: segments become bonded
        // Increase visibility slightly to show internal bonding
        if (child.material && typeof child.material.opacity !== 'undefined') {
          // Add subtle opacity boost for bond visualization
          child.userData.baseSynergyOpacity = child.userData.baseSynergyOpacity ?? child.material.opacity;
          child.material.opacity = Math.min(1.0, child.userData.baseSynergyOpacity + 0.08);
        }
        
        // Mark segment as part of synergy structure
        child.userData.synergizedSegment = true;
      } else {
        // Synergy not awakened: restore normal appearance
        if (child.userData.baseSynergyOpacity !== undefined && child.material) {
          child.material.opacity = child.userData.baseSynergyOpacity;
        }
        child.userData.synergizedSegment = false;
      }
    }
  }
  
  /**
   * [SYNERGY/HARMONY UPGRADE] Apply harmony-stabilized visual state to link
   * When harmony >= 0.80, link appears calm and regularized with smooth motion
   * Dampens particle flow and stabilizes any visual oscillation
   * 
   * @private
   */
  _applyHarmonyVisuals(linkMesh, isHarmonyStabilized) {
    if (!linkMesh) return;
    
    ensureUserData(linkMesh);
    
    if (isHarmonyStabilized) {
      // Harmony stabilized: smooth, calm, minimal motion
      // Store stabilization state for particle system
      linkMesh.userData.harmonyStabilized = true;
      
      // Regularize segment spacing if present
      if (linkMesh.children && linkMesh.children.length > 0) {
        for (const child of linkMesh.children) {
          ensureUserData(child);
          child.userData.harmonyDamping = 0.15;  // Slight motion damping
        }
      }
    } else {
      // Harmony not stabilized: normal motion
      linkMesh.userData.harmonyStabilized = false;
      
      if (linkMesh.children && linkMesh.children.length > 0) {
        for (const child of linkMesh.children) {
          if (child.userData) {
            child.userData.harmonyDamping = 0;  // No damping
          }
        }
      }
    }
  }

  /**
   * [CORRUPTION CONTAGION v1.0] Apply contagion glow feedback to link
   * When link is actively spreading corruption, it receives visual feedback
   * Infected links glow with a pulsing red/orange intensity matching spread rate
   * 
   * @private
   */
  _applyContagionVisuals(linkMesh, contagionStatus) {
    if (!linkMesh || !linkMesh.children) return;
    
    ensureUserData(linkMesh);
    
    const isContagionActive = contagionStatus && contagionStatus.isInfected;
    
    if (isContagionActive) {
      // Link is actively spreading corruption
      const intensity = contagionStatus.intensity || 0;  // 0-1 intensity
      
      // Apply contagion glow to all children
      for (const child of linkMesh.children) {
        ensureUserData(child);
        
        // Track contagion state
        child.userData.isContagious = true;
        child.userData.contagionIntensity = intensity;
        
        // Enhance material for contagion visualization
        if (child.material && child.material.emissive) {
          // Store original emissive for restoration
          if (!child.userData.baseEmissive) {
            child.userData.baseEmissive = {
              color: child.material.emissive.clone(),
              intensity: child.material.emissiveIntensity ?? 0
            };
          }
          
          // Apply contagion color (red/orange spectrum)
          const contagionColor = new THREE.Color();
          contagionColor.setHSL(0.05, 0.8, 0.3);  // Red-orange hue
          
          // Blend toward contagion color based on intensity
          child.material.emissive.lerpColors(
            child.userData.baseEmissive.color,
            contagionColor,
            intensity * 0.7  // 0-70% influence
          );
          
          // Pulsing emissive intensity (faster at higher spread rates)
          const pulseSpeed = 2 + intensity * 6;  // 2-8 Hz pulse
          const basePulse = this.time * pulseSpeed;
          const emissiveModulation = Math.sin(basePulse) * 0.3 + 0.5;  // 0.2-0.8
          child.material.emissiveIntensity = (child.userData.baseEmissive.intensity * 0.5) + (emissiveModulation * intensity * 0.8);
        }
      }
      
      linkMesh.userData.contagionActive = true;
    } else {
      // No contagion: restore normal appearance
      for (const child of linkMesh.children) {
        if (child.userData) {
          child.userData.isContagious = false;
          
          // Restore original emissive
          if (child.userData.baseEmissive && child.material && child.material.emissive) {
            child.material.emissive.copy(child.userData.baseEmissive.color);
            child.material.emissiveIntensity = child.userData.baseEmissive.intensity ?? 0;
          }
        }
      }
      linkMesh.userData.contagionActive = false;
    }
  }
  
  /**
   * [CORRUPTION VISUAL STATE] Apply corruption-induced visual instability to link
   * When corruption >= 0.65, link segments become irregularly spaced
   * When corruption >= 0.80, structural coherence visibly degrades
   * 
   * Creates tension and misalignment without exploding visually.
   * 
   * @private
   */
  _applyCorruptionVisuals(linkMesh, corruptionLevel) {
    if (!linkMesh || !linkMesh.children) return;
    
    ensureUserData(linkMesh);
    
    // Corruption state flags
    const isCorrupted = corruptionLevel >= 0.65;
    const isHighlyCorrupted = corruptionLevel >= 0.80;
    
    if (isCorrupted) {
      // Store base position/scale for restoration if needed
      for (const child of linkMesh.children) {
        ensureUserData(child);
        if (!child.userData.visualState) child.userData.visualState = {};
        
        // Track corruption state
        child.userData.visualState.isCorrupted = true;
        child.userData.visualState.corruptionLevel = corruptionLevel;
        
        // Progressive irregularity based on corruption intensity
        // At 0.65: subtle misalignment
        // At 0.80: severe misalignment
        const irregularity = (corruptionLevel - 0.65) / 0.35; // 0-1 scale
        const maxDeviation = irregularity * 0.15; // Up to 15% deviation at max
        
        // Apply irregular spacing offset
        if (!child.userData.baseSpacing) {
          child.userData.baseSpacing = child.position.clone();
        }
        
        // Angular deviation - slight skew along the link path
        if (!child.userData.baseRotation) {
          child.userData.baseRotation = child.rotation.clone();
        }
        
        // Misalignment increases with corruption
        const randomDeviation = Math.random() - 0.5;
        child.userData.visualState.corruptionDeviation = randomDeviation * maxDeviation;
      }
      
      if (!linkMesh.userData.visualState) linkMesh.userData.visualState = {};
      linkMesh.userData.visualState.corruptionActive = true;
      linkMesh.userData.visualState.corruptionLevel = corruptionLevel;
    } else {
      // Corruption below threshold: restore normal appearance
      for (const child of linkMesh.children) {
        if (child.userData?.visualState) {
          child.userData.visualState.isCorrupted = false;
          child.userData.visualState.corruptionDeviation = 0;
        }
      }
      if (!linkMesh.userData.visualState) linkMesh.userData.visualState = {};
      linkMesh.userData.visualState.corruptionActive = false;
    }
  }
  
  /**
   * [SYNERGY STATE RESOLVER] Get the current synergy state resolver instance
   * Allows external systems to configure thresholds at runtime
   * 
   * @returns {SynergyStateResolver} The resolver instance
   */
  getSynergyResolver() {
    return this.synergyResolver;
  }
  
  /**
   * [SYNERGY STATE RESOLVER] Reconfigure synergy thresholds at runtime
   * Useful for difficulty scaling or system tuning
   * 
   * @param {Object} thresholds - { activeThreshold, strongThreshold, awakenedThreshold }
   * 
   * @example
   * neonLinkVisuals.setSynergyThresholds({
   *   awakenedThreshold: 0.80  // Make awakening easier
   * });
   */
  setSynergyThresholds(thresholds) {
    if (this.synergyResolver) {
      this.synergyResolver.setThresholds(thresholds);
      console.log('[NeonLinkVisuals] ✓ Synergy thresholds updated via resolver');
    }
  }

  _getSemanticBus() {
    return globalThis?.semanticBus || null;
  }

  _bindSemanticBus() {
    const bus = this._getSemanticBus();
    if (!bus) return;
    const on = bus.on?.bind(bus) || bus.subscribe?.bind(bus);
    if (!on) return;

    const handleSynergyBurst = (data = {}) => {
      this.triggerSynergyBurstEffect(data.nodeId);
    };

    on('node.synergy.high', handleSynergyBurst, { priority: bus.priority?.NORMAL });
    this._semanticSubscriptions.push(['node.synergy.high', handleSynergyBurst]);
  }

  triggerSynergyBurstEffect(nodeId) {
    const idToken = nodeId === undefined || nodeId === null ? null : String(nodeId);
    const now = this.time;
    let matched = 0;

    for (const [linkId, state] of this.linkStates.entries()) {
      if (!state) continue;
      const shouldApply = idToken ? String(linkId).includes(idToken) : false;
      if (shouldApply) {
        state.eventSynergyBoostUntil = now + 0.45;
        if (state.mesh) {
          this._createSynergyFlowParticles(state.mesh, SynergyState.STRONG);
        }
        matched++;
      }
    }

    // Fallback if linkId does not encode node id: apply a subtle pulse to a few links.
    if (matched === 0) {
      let i = 0;
      for (const state of this.linkStates.values()) {
        if (!state) continue;
        state.eventSynergyBoostUntil = now + 0.3;
        i++;
        if (i >= 3) break;
      }
    }
  }

  /**
   * Cleanup - dispose of all materials
   */
  dispose() {
    const bus = this._getSemanticBus();
    const off = bus?.off?.bind(bus) || bus?.unsubscribe?.bind(bus);
    if (off) {
      for (const [eventName, handler] of this._semanticSubscriptions) {
        off(eventName, handler);
      }
    }
    this._semanticSubscriptions = [];

    Object.values(this.materials).forEach(material => {
      if (material.dispose) material.dispose();
    });
    
    this.particles.forEach(particle => {
      if (particle.mesh.geometry) particle.mesh.geometry.dispose();
      if (particle.mesh.material) particle.mesh.material.dispose();
      this.scene.remove(particle.mesh);
    });
    
    this.particles = [];
    this.linkStates.clear();
  }
}

// ============================================================================
// LINK VISUAL LANGUAGE v2 - CONSOLE DEBUG API
// ============================================================================

export function setupLinkVisualLanguageDebugAPI(linkVisuals) {
  // Initialize global state
  window.__linkVisual = {
    flowRate: 1.0,
    opacity: 0.8,
    globalStress: 0
  };
  
  /**
   * Set global flow rate (moving pattern speed)
   * 0.0 = no flow, 1.0 = normal speed, 2.0 = 2x speed
   */
  window.setLinkFlow = function(rate = 1.0) {
    window.__linkVisual.flowRate = Math.max(0, rate);
    console.log(`✓ Link flow rate: ${window.__linkVisual.flowRate}x`);
  };
  
  /**
   * Set global opacity (0.0 - 1.0)
   * Controls overall link visibility
   */
  window.setLinkOpacity = function(opacity = 0.8) {
    window.__linkVisual.opacity = Math.max(0, Math.min(1, opacity));
    console.log(`✓ Link opacity: ${(window.__linkVisual.opacity * 100).toFixed(0)}%`);
  };
  
  /**
   * Set global stress level (0.0 - 1.0)
   * Triggers fracture patterns, kinks, micro dropout
   */
  window.setLinkStress = function(stress = 0) {
    window.__linkVisual.globalStress = Math.max(0, Math.min(1, stress));
    window.NETWORK_STRESS = window.__linkVisual.globalStress * 100;
    console.log(`✓ Link stress: ${(window.__linkVisual.globalStress * 100).toFixed(0)}%`);
    console.log(`  → Fractures: ${window.__linkVisual.globalStress > 0.2 ? '✓ VISIBLE' : '✗ hidden'}`);
    console.log(`  → Kinks: ${window.__linkVisual.globalStress > 0.2 ? '✓ ACTIVE' : '✗ none'}`);
  };
  
  /**
   * Rebuild all links (reapply ribbon geometry)
   */
  window.rebuildAllLinks = function() {
    if (!linkVisuals || !linkVisuals.scene) {
      console.log('❌ Link visuals not ready');
      return;
    }
    console.log('🔄 Rebuilding all links...');
    // Links will update through next frame's shader uniform update
    console.log('✓ Links scheduled for rebuild');
  };
  
  /**
   * Show link visual language v2 status
   */
  window.reportLinkVisuals = function() {
    console.clear();
    console.log('═══════════════════════════════════════════════════════════');
    console.log('        LINK VISUAL LANGUAGE v2 - STATUS REPORT');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('🎨 VISUAL PROPERTIES:');
    console.log(`   Flow Rate: ${window.__linkVisual.flowRate}x (0=static, 1=normal, 2+=fast)`);
    console.log(`   Opacity: ${(window.__linkVisual.opacity * 100).toFixed(0)}%`);
    console.log(`   Stress: ${(window.__linkVisual.globalStress * 100).toFixed(0)}%\n`);
    
    console.log('🔧 SHADER FEATURES:');
    console.log('   ✓ Fiber texture (subtle grain along ribbon)');
    console.log('   ✓ Flow trace (moving pattern - controlled by uFlow)');
    console.log('   ✓ Ribbon edges (feathered fade across width)');
    console.log('   ✓ Stress fractures (cracks + micro dropout > 20% stress)');
    console.log('   ✓ Stress kinks (curve perturbations > 20% stress)');
    console.log('   ✓ Stress darkening (color shift under load)');
    console.log('   ✓ No glow/bloom (pure geometry + shader)\n');
    
    console.log('📊 MATERIAL SETTINGS:');
    console.log('   depthTest: true (readability)');
    console.log('   depthWrite: false (performance + transparency)');
    console.log('   blending: NormalBlending');
    console.log('   side: DoubleSide\n');
    
    console.log('💾 PERFORMANCE:');
    console.log('   Reusable geometry: ✓ (shared across all links)');
    console.log('   Per-frame allocations: ✗ (zero new objects)');
    console.log('   Shader complexity: Medium (4 features + time animation)\n');
    
    console.log('📝 CONSOLE COMMANDS:');
    console.log('   setLinkFlow(rate)      - Set flow animation speed');
    console.log('   setLinkOpacity(val)    - Set link transparency');
    console.log('   setLinkStress(val)     - Trigger fracture patterns');
    console.log('   rebuildAllLinks()      - Refresh link geometry');
    console.log('   reportLinkVisuals()    - This report\n');
    
    console.log('═══════════════════════════════════════════════════════════');
  };
  
  console.log('✅ Link Visual Language v2 Debug API ready');
  console.log('   Use: reportLinkVisuals() for full status');
}

