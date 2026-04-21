/**
 * CORRUPTION VISUAL FX LAYER v1.0
 * 
 * Complete visual effects system for displaying gameplay corruption in real-time.
 * Integrates with ArchetypeVisualDifferentiationSystem_v1 and ArchetypeGameplaySystem_v1.
 * 
 * Features:
 * - Dynamic color distortion/tinting based on corruption level
 * - Glow flicker with frequency/amplitude tied to corruption
 * - Shader-based UV distortion and warping (when THREE available)
 * - Chaos particle emission at medium-high corruption
 * - Subtle mesh jitter/micro-shake for visual feedback
 * - Full THREE.js safe mode compatibility (graceful degradation)
 * - Non-breaking integration with existing systems
 * 
 * Visual Effects Progression:
 * 0.0-0.25: Subtle color shift + mild glow
 * 0.25-0.45: Color intensifies + glow flickers
 * 0.45-0.65: Shader distortion + particle emission
 * 0.65-0.85: Strong glitch effects + particle bursts
 * 0.85-1.0: Extreme corruption + constant visual breakdown
 */

import * as THREE from 'three';
import VisualTime from './src/time/VisualTime.js';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

const CASCADE_CORRUPTION_THRESHOLD = 0.35;

// Private symbols for one-time corruption shader binding metadata
const CORRUPTION_BINDING = Symbol('corruptionBinding');
const CORRUPTION_ORIGINAL_ON_BEFORE_RENDER = Symbol('corruptionOriginalOnBeforeRender');

/**
 * Corruption color palette (HSL-friendly)
 * Ranges from healthy to fully corrupted
 * SUPERNATURAL UPGRADE: Extended with void and spectral corruption colors
 */
const CORRUPTION_COLOR_PALETTE = {
  healthy: { r: 0.2, g: 0.8, b: 0.3 },     // Green
  mild: { r: 1.0, g: 0.6, b: 0.0 },        // Orange
  moderate: { r: 1.0, g: 0.2, b: 0.6 },    // Magenta
  strong: { r: 0.9, g: 0.1, b: 0.1 },      // Deep red
  severe: { r: 0.5, g: 0.0, b: 0.5 },      // Purple/void
  // SUPERNATURAL: Void corruption stages
  voidEdge: { r: 0.3, g: 0.0, b: 0.6 },    // Spectral void edge
  voidCore: { r: 0.05, g: 0.0, b: 0.1 },   // Deep void
  spectralDecay: { r: 0.6, g: 0.1, b: 0.8 } // Spectral dissolution
};

/**
 * CORRUPTION VISUAL FX ENGINE
 * Main class for all corruption visual effects
 */
export class CorruptionVisualFX_v1 {
  constructor(sceneOrAiNodes, aiNodesOrDebugMode = false, debugMode = false) {
    
    // UNIFIED CLEANUP CONTRACT - Track all created objects
    this._createdObjects = [];
    
    if (Array.isArray(sceneOrAiNodes?.nodes) || sceneOrAiNodes?.nodes instanceof Map || Array.isArray(sceneOrAiNodes)) {
      this.scene = null;
      this.aiNodes = sceneOrAiNodes;
      this.debugMode = !!aiNodesOrDebugMode;
    } else {
      this.scene = sceneOrAiNodes || null;
      this.aiNodes = aiNodesOrDebugMode;
      this.debugMode = !!debugMode;
    }
    
    // Visual state tracking
    this.nodeVisualState = new Map(); // node -> { particleEmitTime, glowBaseIntensity, etc }
    this.activeParticles = [];
    this.particleRoot = new THREE.Group();
    this.particleRoot.name = 'CorruptionVisualFX_Particles';
    this._particleGeometry = new THREE.TetrahedronGeometry(0.06, 0);
    this._particleSpawnOffset = new THREE.Vector3();
    
    // Performance settings
    this.updateInterval = 1 / 30; // 30Hz updates for performance
    this.lastUpdateTime = 0;
    // DEV NOTE: Corruption visuals require realtime (RAF) visual time per AtomaShaderTimingContract.
    // VisualTime is the canonical source (Phase 2A); external time/delta params are maintained for legacy signatures only.
    this.visualTime = VisualTime;
    this.corruptionShaderVariant = this._createCorruptionShaderVariant();
    this._semanticSubscriptions = [];
    if (this.scene?.add) {
      this.scene.add(this.particleRoot);
      this._createdObjects.push(this.particleRoot);  // UNIFIED CLEANUP CONTRACT
    }
    this._bindSemanticBus();
    
    if (this.debugMode) {
      console.log('%c[CorruptionVisualFX_v1] Initialized', 'color: #ff4400; font-weight: bold;');
      this.setupConsoleAPI();
    }
  }

  _getSemanticBus() {
    return globalThis?.semanticBus || null;
  }

  _bindSemanticBus() {
    // Corruption particle ownership moved to T2_CorruptionVisualIntegration_v1.
    // Keep this shell free of semantic listeners to avoid duplicate particle spawns.
  }

  _resolveNodeById(nodeId) {
    if (nodeId === undefined || nodeId === null || !this.aiNodes) return null;
    const idToken = String(nodeId);

    const candidates = [];
    if (Array.isArray(this.aiNodes?.nodes)) candidates.push(...this.aiNodes.nodes);
    else if (this.aiNodes?.nodes instanceof Map) candidates.push(...this.aiNodes.nodes.values());
    else if (this.aiNodes instanceof Map) candidates.push(...this.aiNodes.values());
    else if (Array.isArray(this.aiNodes)) candidates.push(...this.aiNodes);

    for (const node of candidates) {
      if (!node) continue;
      const nid = node?.nodeId ?? node?.id ?? node?.uuid ?? node?.userData?.nodeId;
      if (nid !== undefined && String(nid) === idToken) return node;
    }
    return null;
  }

  triggerCorruptionPulse(nodeId) {
    const t2 = globalThis?.game?.t2CorruptionVisualIntegration || globalThis?.window?.game?.t2CorruptionVisualIntegration || null;
    if (t2?.triggerCorruptionPulse) {
      return t2.triggerCorruptionPulse(nodeId);
    }
    return false;
  }

  attachScene(scene) {
    if (!scene?.add) return false;
    this.scene = scene;
    if (this.particleRoot.parent !== scene) {
      this.particleRoot.parent?.remove(this.particleRoot);
      scene.add(this.particleRoot);
    }
    return true;
  }

  _ensureParticleRoot() {
    if (!this.particleRoot) {
      this.particleRoot = new THREE.Group();
      this.particleRoot.name = 'CorruptionVisualFX_Particles';
    }
    if (this.scene?.add && this.particleRoot.parent !== this.scene) {
      this.attachScene(this.scene);
    }
  }

  _createParticleMesh(particle) {
    const material = new THREE.MeshBasicMaterial({
      color: particle.color.clone(),
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });

    const mesh = new THREE.Mesh(this._particleGeometry, material);
    mesh.frustumCulled = false;
    mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_PARTICLES');
    mesh.position.copy(particle.position);
    mesh.scale.setScalar(particle.size);
    return mesh;
  }

  _disposeParticleMesh(particle) {
    const mesh = particle?.mesh;
    if (!mesh) return;
    mesh.parent?.remove(mesh);
    if (mesh.material?.dispose) mesh.material.dispose();
    particle.mesh = null;
  }

  _syncParticleSystem(deltaTime) {
    if (!this.activeParticles.length) return;
    const now = Number.isFinite(this.visualTime?.now) ? this.visualTime.now : (performance.now() * 0.001);
    if (Number.isFinite(this.lastUpdateTime) && now - this.lastUpdateTime < this.updateInterval) {
      return;
    }
    this.lastUpdateTime = now;
    this.updateParticles(deltaTime);
  }

  /**
   * Get or create visual state for a node
   */
  getNodeVisualState(nodeModel) {
    if (this.nodeVisualState.has(nodeModel)) {
      return this.nodeVisualState.get(nodeModel);
    }

    const state = {
      lastParticleEmitTime: 0,
      particleEmitRate: 0,
      shaderApplied: false,
      glowBaseIntensity: 0.3
    };

    this.nodeVisualState.set(nodeModel, state);
    return state;
  }

  _isNodeVisualTarget(nodeModel) {
    if (!nodeModel || !nodeModel.userData) return false;
    const flags = nodeModel.userData;
    const isNode = flags.isNode === true || flags.isNodeRoot === true || flags.isNodeCore === true;
    const isNodeLayer = flags.visualLayer === 'NODE_ROOT' || flags.visualLayer === 'CORE' || flags.visualLayer === 'NODE';
    return isNode || isNodeLayer;
  }

  _isVisualOnlyMesh(mesh) {
    if (!mesh || !mesh.userData) return false;
    const u = mesh.userData;
    return !!(
      u.isGlyph === true ||
      u.isLinkVisual === true ||
      u.isLinkGlow === true ||
      u.isSelectionGlow === true ||
      u.isSelectionHighlight === true ||
      u.isAura === true ||
      u.isShell === true ||
      u.isHologramShell === true ||
      u.isFX === true ||
      u.isParticle === true ||
      u.visualLayer === 'AURA' ||
      u.visualLayer === 'SHELL' ||
      u.visualLayer === 'VISUAL_ONLY'
    );
  }

  /**
   * Apply all corruption effects to a node
   * Timing: expects realtime visual time (RAF). VisualTime is available for Phase 2 enforcement.
   */
  applyCorruptionEffects(nodeModel, deltaTime, time = 0) {
    if (!nodeModel || !this._isNodeVisualTarget(nodeModel)) return;

    // Determine current corruption level (canonical and compatibility paths)
    const corruptionLevel = Math.max(0, Math.min(1, (
      nodeModel?.userData?.metrics?.corruption ??
      nodeModel?.userData?.gameplay?.corruptionLevel ??
      nodeModel?.userData?.corruptionLevel ??
      nodeModel?.userData?.corruption ??
      0
    )));

    const isHighCorruption = (
      nodeModel?.userData?.metrics?.corruption >= 0.7 ||
      nodeModel?.userData?.gameplay?.corruptionLevel >= 0.7 ||
      nodeModel?.userData?.corruptionLevel >= 0.7 ||
      nodeModel?.userData?.corruption >= 0.7 ||
      nodeModel?.userData?.corruptionHigh === true ||
      nodeModel?.userData?.isCorrupted === true
    );

    // Keep explicit high-level status for downstream systems.
    if (nodeModel?.userData) {
      nodeModel.userData.corruptionHigh = isHighCorruption;
    }

    if (!isHighCorruption) {
      this.restoreNodeVisualBaseline(nodeModel);
      return;
    }

    // Track node-specific state for flicker, particles, and transitions
    const visualState = this.getNodeVisualState(nodeModel);

    // Progressive visual effects
    this.applyCorruptionColor(nodeModel, corruptionLevel);
    this.applyGlowFlicker(nodeModel, corruptionLevel, time, visualState);
    this.applyShaderDistortion(nodeModel, corruptionLevel, deltaTime);
    this.spawnChaosParticles(nodeModel, corruptionLevel, deltaTime, visualState);
  }

  hasCascadeCorruptionLink(nodeModel) {
    const links = nodeModel?.userData?.links;
    if (!Array.isArray(links)) return false;
    return links.some((link) => (
      (
        link?.group?.userData?.conduitState?.metrics?.corruption ??
        link?.userData?.metrics?.corruption ??
        link?.userData?.corruption ??
        link?.userData?.corruptionLevel ??
        link?.corruption ??
        link?.corruptionLevel ??
        0
      ) > CASCADE_CORRUPTION_THRESHOLD
    ));
  }

  /**
   * Compute corruption color based on level
   * Interpolates through color palette
   */
  computeCorruptionColor(baseColor, corruptionLevel) {
    if (!THREE || !baseColor) return baseColor;

    let targetColor;
    if (corruptionLevel < 0.25) {
      // Healthy to mild
      targetColor = this.lerpColor(CORRUPTION_COLOR_PALETTE.healthy, CORRUPTION_COLOR_PALETTE.mild, corruptionLevel / 0.25);
    } else if (corruptionLevel < 0.45) {
      // Mild to moderate
      targetColor = this.lerpColor(CORRUPTION_COLOR_PALETTE.mild, CORRUPTION_COLOR_PALETTE.moderate, (corruptionLevel - 0.25) / 0.2);
    } else if (corruptionLevel < 0.65) {
      // Moderate to strong
      targetColor = this.lerpColor(CORRUPTION_COLOR_PALETTE.moderate, CORRUPTION_COLOR_PALETTE.strong, (corruptionLevel - 0.45) / 0.2);
    } else if (corruptionLevel < 0.85) {
      // Strong to severe
      targetColor = this.lerpColor(CORRUPTION_COLOR_PALETTE.strong, CORRUPTION_COLOR_PALETTE.severe, (corruptionLevel - 0.65) / 0.2);
    } else {
      // Fully severe
      targetColor = CORRUPTION_COLOR_PALETTE.severe;
    }

    // Blend with base color
    const blendFactor = Math.min(1, corruptionLevel);
    const result = new THREE.Color(baseColor);
    const corruptColor = new THREE.Color(targetColor.r, targetColor.g, targetColor.b);
    result.lerp(corruptColor, blendFactor);

    return result;
  }

  /**
   * Apply corruption color tinting to node materials
   */
  applyCorruptionColor(nodeModel, corruptionLevel) {
    if (!THREE || corruptionLevel <= 0 || !this._isNodeVisualTarget(nodeModel)) return;

    nodeModel.traverse((child) => {
      if (!child.isMesh || !child.material || this._isVisualOnlyMesh(child)) return;
      
      const material = child.material;
      if (!material.color) return;

      // Store original color if not stored
      if (!child.userData.originalColor) {
        child.userData.originalColor = material.color.getHex();
      }
      if (!Number.isFinite(child.userData._corruptionFxOriginalColorHex)) {
        child.userData._corruptionFxOriginalColorHex = material.color.getHex();
      }
      if (material.emissive && this.isMaterialEmissiveCapable(material)) {
        if (!Number.isFinite(child.userData._corruptionFxOriginalEmissiveHex)) {
          child.userData._corruptionFxOriginalEmissiveHex = material.emissive.getHex();
        }
      }
      if (material.emissiveIntensity !== undefined && !Number.isFinite(child.userData._corruptionFxOriginalEmissiveIntensity)) {
        child.userData._corruptionFxOriginalEmissiveIntensity = material.emissiveIntensity;
      }

      // Get base color
      const baseColor = new THREE.Color(child.userData.originalColor);

      // Compute corrupted color
      const corruptedColor = this.computeCorruptionColor(baseColor, corruptionLevel);

      // Apply with intensity scaling
      const intensity = Math.min(1, corruptionLevel * 1.5); // Boost color intensity
      material.color.copy(baseColor).lerp(corruptedColor, intensity);

      // Also tint emissive if available
      if (material.emissive && this.isMaterialEmissiveCapable(material)) {
        const emissiveColor = new THREE.Color(0.5, 0.0, 0.3).multiplyScalar(corruptionLevel);
        material.emissive.copy(emissiveColor);
      }
    });
  }

  /**
   * Apply glow flicker effect to node materials
   */
  applyGlowFlicker(nodeModel, corruptionLevel, time, visualState) {
    if (!THREE || !this._isNodeVisualTarget(nodeModel)) return;

    // VisualTime provides monotonic RAF time to preserve smooth glow oscillation.
    const t = this.visualTime.now;

    // Frequency and amplitude scale with corruption
    const baseFreq = 1; // Base oscillation frequency
    const maxFreq = 8;  // Maximum frequency at full corruption
    const frequency = baseFreq + (maxFreq - baseFreq) * corruptionLevel;

    const baseAmp = 0.05;
    const maxAmp = 0.6;
    const amplitude = baseAmp + (maxAmp - baseAmp) * corruptionLevel;

    // Add random flicker at high corruption
    const flicker = corruptionLevel > 0.7 ? Math.random() * 0.3 : 0;

    // Compute glow intensity
    const oscillation = Math.sin(t * frequency) * amplitude;
    const glowIntensity = visualState.glowBaseIntensity * (1 + oscillation + flicker);

    // Apply to materials
    nodeModel.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      const material = child.material;
      if (material.emissiveIntensity !== undefined && !Number.isFinite(child.userData?._corruptionFxOriginalEmissiveIntensity)) {
        child.userData._corruptionFxOriginalEmissiveIntensity = material.emissiveIntensity;
      }
      
      // Apply emissive intensity if capable
      if (material.emissive && this.isMaterialEmissiveCapable(material)) {
        const emissiveColor = material.emissive.clone().multiplyScalar(glowIntensity);
        material.emissive.copy(emissiveColor);
      }

      // For meshPhong/standard materials, modulate intensity
      if (material.emissiveIntensity !== undefined) {
        material.emissiveIntensity = glowIntensity;
      }
    });
  }

  /**
   * Restore node materials to their pre-corruption baseline.
   * Prevents sticky color/emissive states when corruption gate is not active.
   */
  restoreNodeVisualBaseline(nodeModel) {
    if (!nodeModel?.traverse || !this._isNodeVisualTarget(nodeModel)) return;
    nodeModel.traverse((child) => {
      if (!child?.isMesh || !child.material || this._isVisualOnlyMesh(child)) return;
      this._unbindCorruptionVariantFromMesh(child);
      const material = child.material;
      const u = child.userData || {};

      if (material.color && Number.isFinite(u._corruptionFxOriginalColorHex)) {
        material.color.setHex(u._corruptionFxOriginalColorHex);
      } else if (material.color && Number.isFinite(u.originalColor)) {
        material.color.setHex(u.originalColor);
      }

      if (material.emissive && this.isMaterialEmissiveCapable(material) && Number.isFinite(u._corruptionFxOriginalEmissiveHex)) {
        material.emissive.setHex(u._corruptionFxOriginalEmissiveHex);
      }

      if (material.emissiveIntensity !== undefined && Number.isFinite(u._corruptionFxOriginalEmissiveIntensity)) {
        material.emissiveIntensity = u._corruptionFxOriginalEmissiveIntensity;
      }
    });
  }

  /**
   * Apply corruption shader distortion using precompiled uniforms only.
   */
  applyShaderDistortion(nodeModel, corruptionLevel, deltaTime) {
    if (!THREE || !nodeModel?.traverse || !this.corruptionShaderVariant || !this._isNodeVisualTarget(nodeModel)) return;

    // Compute directional creep from corrupted neighbors
    const creepDirection = this._computeCorruptionDirection(nodeModel);
    const clampedLevel = Math.max(0, Math.min(1, corruptionLevel || 0));

    nodeModel.traverse((child) => {
      if (!child.isMesh || !child.material || this._isVisualOnlyMesh(child)) return;

      // Bind once, then drive effect strength/time strictly by uniform values.
      const binding = child.userData?.[CORRUPTION_BINDING] || this._bindCorruptionVariantToMesh(child);
      if (!binding?.uniformState) return;

      binding.uniformState.uCorruptionLevel = clampedLevel;
      binding.uniformState.uCorruptionTime += Math.max(0, deltaTime || 0);
      binding.uniformState.uCorruptionDirection.copy(creepDirection);
      binding.uniformState.uCorruptionCreepProgress = clampedLevel;

      if (child.material?.uniforms?.uCorruptionLevel) {
        child.material.uniforms.uCorruptionLevel.value = binding.uniformState.uCorruptionLevel;
      }
      if (child.material?.uniforms?.uCorruptionTime) {
        child.material.uniforms.uCorruptionTime.value = binding.uniformState.uCorruptionTime;
      }
    });
  }

  /**
   * CORRUPTION CREEP — Compute the direction from which corruption is entering a node.
   * Examines linked neighbors' corruption levels to find the weighted average direction.
   * Returns a normalized Vector3 pointing FROM the most corrupted neighbor(s) TOWARD this node.
   */
  _computeCorruptionDirection(nodeModel) {
    const fallback = new THREE.Vector3(0, 0, 1);
    if (!nodeModel?.userData?.links) return fallback;

    const links = nodeModel.userData.links;
    if (!Array.isArray(links) || links.length === 0) return fallback;

    const nodePos = nodeModel.position;
    if (!nodePos) return fallback;

    const weightedDir = new THREE.Vector3(0, 0, 0);
    let totalWeight = 0;

    for (const link of links) {
      // Identify the other node in this link
      const otherNode = (link.source === nodeModel) ? link.target :
                        (link.target === nodeModel) ? link.source : null;
      if (!otherNode?.position) continue;

      const otherCorruption = Math.max(0, Math.min(1, (
        otherNode?.userData?.metrics?.corruption ??
        otherNode?.userData?.corruption ??
        otherNode?.userData?.corruptionLevel ??
        0
      )));

      // Only consider neighbors with meaningful corruption
      if (otherCorruption < 0.1) continue;

      // Direction FROM corrupted neighbor TOWARD this node
      const dir = new THREE.Vector3().subVectors(nodePos, otherNode.position);
      const dist = dir.length();
      if (dist < 0.001) continue;
      dir.divideScalar(dist); // normalize

      weightedDir.add(dir.multiplyScalar(otherCorruption));
      totalWeight += otherCorruption;
    }

    if (totalWeight > 0.001) {
      return weightedDir.normalize();
    }

    return fallback;
  }

  _createCorruptionShaderVariant() {
    return new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: null },
        uUseMap: { value: 0.0 },
        uBaseColor: { value: new THREE.Color(1.0, 1.0, 1.0) },
        uEmissive: { value: new THREE.Color(0.0, 0.0, 0.0) },
        uOpacity: { value: 1.0 },
        uCorruptionLevel: { value: 0.0 },
        uCorruptionTime: { value: 0.0 },
        uCorruptionDirection: { value: new THREE.Vector3(0, 0, 1) },
        uCorruptionCreepProgress: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormalW;
        varying vec2 vPosWxy;
        varying vec3 vModelPos;

        void main() {
          vUv = uv;
          vModelPos = position;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vPosWxy = worldPos.xy;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        uniform float uUseMap;
        uniform vec3 uBaseColor;
        uniform vec3 uEmissive;
        uniform float uOpacity;
        uniform float uCorruptionLevel;
        uniform float uCorruptionTime;
        uniform vec3 uCorruptionDirection;
        uniform float uCorruptionCreepProgress;

        varying vec2 vUv;
        varying vec3 vNormalW;
        varying vec2 vPosWxy;
        varying vec3 vModelPos;

        // ── Gradient noise for organic rot front ──
        vec3 hash33(vec3 p) {
          p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
                   dot(p, vec3(269.5, 183.3, 246.1)),
                   dot(p, vec3(113.5, 271.9, 124.6)));
          return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
        }

        float noise3D(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          vec3 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(dot(hash33(i + vec3(0,0,0)), f - vec3(0,0,0)),
                             dot(hash33(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
                         mix(dot(hash33(i + vec3(0,1,0)), f - vec3(0,1,0)),
                             dot(hash33(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
                     mix(mix(dot(hash33(i + vec3(0,0,1)), f - vec3(0,0,1)),
                             dot(hash33(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
                         mix(dot(hash33(i + vec3(0,1,1)), f - vec3(0,1,1)),
                             dot(hash33(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z);
        }

        // SUPERNATURAL UPGRADE: Void corruption distortion
        // Chromatic dissolution + void energy pulsation + reality dissolution
        float hslChannel(float n, float h, float a, float l) {
          float k = mod(n + h * 12.0, 12.0);
          return l - a * max(-1.0, min(min(k - 3.0, 9.0 - k), 1.0));
        }

        vec3 hsl2rgb(float h, float s, float l) {
          h = fract(h);
          float a = s * min(l, 1.0 - l);
          return vec3(
            hslChannel(0.0, h, a, l),
            hslChannel(8.0, h, a, l),
            hslChannel(4.0, h, a, l)
          );
        }

        vec3 applyCorruption(vec3 color, vec2 uv) {
          float level = clamp(uCorruptionLevel, 0.0, 1.0);
          float t = uCorruptionTime;

          // Layer 1: Original warp-stripe distortion (preserved)
          float warp = sin(uv.x * 20.0 + vPosWxy.y * 20.0 + t * 10.0) * 0.5 + 0.5;
          float stripe = sin(uv.y * 28.0 + vPosWxy.x * 28.0 - t * 7.5);
          float distortion = warp * stripe * level;

          // Layer 2: SUPERNATURAL — Chromatic dissolution
          // Matter breaking into spectral components at high corruption
          float chromaticShift = level * level * 0.04;
          vec2 chromaDir = normalize(vec2(uv.x - 0.5, uv.y - 0.5) + vec2(0.001));
          float spectralR = sin((uv.x + chromaDir.x * chromaticShift) * 18.0 + t * 6.0) * 0.5 + 0.5;
          float spectralB = sin((uv.x - chromaDir.x * chromaticShift) * 18.0 + t * 6.0) * 0.5 + 0.5;
          vec3 chromaticDissolve = vec3(spectralR, 0.2, spectralB) * level * level * 0.3;

          // Layer 3: SUPERNATURAL — Void energy pulsation
          // Dark energy rhythmically consuming light
          float voidPulse = sin(t * 3.0 + length(uv - 0.5) * 12.0) * 0.5 + 0.5;
          float voidIntensity = level * level * level * voidPulse * 0.4;
          vec3 voidColor = vec3(0.03, 0.0, 0.08) * voidIntensity;

          // Layer 4: SUPERNATURAL — Spectral decay tendrils
          // Organic noise-based decay patterns
          float tendrilNoise = noise3D(vec3(uv * 8.0, t * 0.3));
          float tendrilPattern = smoothstep(0.2, 0.5, tendrilNoise) * (1.0 - smoothstep(0.5, 0.7, tendrilNoise));
          vec3 tendrilColor = hsl2rgb(fract(tendrilNoise * 0.4 + t * 0.05), 0.8, 0.4) * tendrilPattern * level * level * 0.35;

          // Combine: original tint + chromatic dissolve + void + tendrils
          vec3 tint = vec3(1.0, 0.2, 0.5) * distortion * level;
          return color + tint + chromaticDissolve - voidColor + tendrilColor;
        }

        // ── Directional creep mask ──
        // Returns 1.0 where rot has reached, 0.0 where surface is still healthy
        float computeCreepMask() {
          float progress = clamp(uCorruptionCreepProgress, 0.0, 1.0);
          if (progress < 0.001) return 0.0;
          if (progress > 0.99) return 1.0;

          // Safe normalize: model-space position → direction from node center
          float modelLen = length(vModelPos);
          vec3 dir = modelLen > 0.001 ? vModelPos / modelLen : vec3(0.0, 1.0, 0.0);
          vec3 creepDir = normalize(uCorruptionDirection);

          // How much this fragment faces the corruption source (0 = away, 1 = facing)
          float sourceFacing = dot(dir, creepDir) * 0.5 + 0.5;

          // Organic noise at the rot front boundary — two octaves for detail
          float n1 = noise3D(vModelPos * 4.0 + vec3(uCorruptionTime * 0.3, 0.0, uCorruptionTime * 0.2)) * 0.14;
          float n2 = noise3D(vModelPos * 9.0 + vec3(0.0, uCorruptionTime * 0.5, 0.0)) * 0.06;
          float boundaryNoise = n1 + n2;

          // Rot front moves from source-facing side (1.0) toward far side (0.0)
          float frontEdge = 1.0 - progress + boundaryNoise;

          // Smooth mask at the boundary
          return smoothstep(frontEdge - 0.07, frontEdge + 0.07, sourceFacing);
        }

        void main() {
          vec4 texel = vec4(1.0);
          if (uUseMap > 0.5) {
            texel = texture2D(uMap, vUv);
          }

          vec3 baseColor = uBaseColor * texel.rgb;
          vec3 normal = vNormalW;
          vec3 lightDir = vec3(0.2519, 0.7558, 0.6048);
          float ndl = max(dot(normal, lightDir), 0.0);
          vec3 lit = baseColor * (0.35 + 0.65 * ndl) + uEmissive;

          // Directional creep: blend healthy → corrupted based on rot spread
          float creepMask = computeCreepMask();
          vec3 corruptedColor = applyCorruption(lit, vUv);

          // SUPERNATURAL UPGRADE: Rot front glow — spectral void edge + chromatic boundary
          float progress = clamp(uCorruptionCreepProgress, 0.0, 1.0);
          float frontEdge = 1.0 - progress;
          float modelLen = length(vModelPos);
          vec3 dir = modelLen > 0.001 ? vModelPos / modelLen : vec3(0.0, 1.0, 0.0);
          float sourceFacing = dot(dir, normalize(uCorruptionDirection)) * 0.5 + 0.5;
          float frontDist = abs(sourceFacing - frontEdge);
          float frontGlow = exp(-frontDist * frontDist * 64.0) * progress * 0.7;
          
          // Original magenta glow + spectral void edge
          vec3 baseGlow = vec3(1.0, 0.15, 0.4) * frontGlow;
          // Spectral chromatic edge at the rot boundary
          float edgeAngle = atan(dir.z, dir.x);
          vec3 spectralEdge = hsl2rgb(fract(edgeAngle / 6.2832 + uCorruptionTime * 0.15), 0.9, 0.55);
          vec3 glowColor = mix(baseGlow, spectralEdge * frontGlow, progress * 0.5);
          // Void energy at the core of the rot
          float voidCore = frontGlow * progress * 0.3;
          glowColor += vec3(0.05, 0.0, 0.12) * voidCore;

          // Final: healthy base → corrupted where creep has reached + spectral front glow
          vec3 finalColor = mix(lit, corruptedColor, creepMask) + glowColor * step(0.01, creepMask);

          gl_FragColor = vec4(finalColor, texel.a * uOpacity);
        }
      `,
      transparent: true
    });
  }

  _bindCorruptionVariantToMesh(mesh) {
    if (!mesh || !mesh.material || !this.corruptionShaderVariant) return null;
    if (this._isVisualOnlyMesh(mesh)) return null;
    if (mesh.userData?.[CORRUPTION_BINDING]) return mesh.userData[CORRUPTION_BINDING];
    if (Array.isArray(mesh.material)) return null;

    const sourceMaterial = mesh.material;
    const binding = {
      sourceMaterial,
      uniformState: {
        uCorruptionLevel: 0,
        uCorruptionTime: 0,
        uCorruptionDirection: new THREE.Vector3(0, 0, 1),
        uCorruptionCreepProgress: 0
      },
      renderState: {
        transparent: sourceMaterial.transparent === true,
        depthWrite: sourceMaterial.depthWrite !== false,
        depthTest: sourceMaterial.depthTest !== false,
        side: sourceMaterial.side ?? THREE.FrontSide,
        blending: sourceMaterial.blending ?? THREE.NormalBlending
      },
      baseState: {
        color: sourceMaterial.color ? sourceMaterial.color.clone() : new THREE.Color(1, 1, 1),
        emissive: sourceMaterial.emissive ? sourceMaterial.emissive.clone() : new THREE.Color(0, 0, 0),
        opacity: sourceMaterial.opacity !== undefined ? sourceMaterial.opacity : 1,
        map: sourceMaterial.map || null
      }
    };

    mesh.userData[CORRUPTION_BINDING] = binding;

    // Preserve existing onBeforeRender behavior and inject per-mesh uniforms.
    mesh[CORRUPTION_ORIGINAL_ON_BEFORE_RENDER] = mesh.onBeforeRender;
    mesh.onBeforeRender = (renderer, scene, camera, geometry, material, group) => {
      const b = mesh.userData?.[CORRUPTION_BINDING];
      const variant = this.corruptionShaderVariant;
      if (b && variant?.uniforms) {
        const source = b.sourceMaterial;
        const uniforms = variant.uniforms;
        const baseColor = source?.color ? source.color : b.baseState.color;
        const emissive = source?.emissive ? source.emissive : b.baseState.emissive;
        const map = source?.map || b.baseState.map;
        const opacity = source?.opacity !== undefined ? source.opacity : b.baseState.opacity;

        uniforms.uBaseColor.value.copy(baseColor);
        uniforms.uEmissive.value.copy(emissive);
        uniforms.uOpacity.value = opacity;
        uniforms.uMap.value = map;
        uniforms.uUseMap.value = map ? 1.0 : 0.0;
        uniforms.uCorruptionLevel.value = b.uniformState.uCorruptionLevel;
        uniforms.uCorruptionTime.value = b.uniformState.uCorruptionTime;
        uniforms.uCorruptionDirection.value.copy(b.uniformState.uCorruptionDirection);
        uniforms.uCorruptionCreepProgress.value = b.uniformState.uCorruptionCreepProgress;

        variant.transparent = b.renderState.transparent;
        variant.depthWrite = b.renderState.depthWrite;
        variant.depthTest = b.renderState.depthTest;
        variant.side = b.renderState.side;
        variant.blending = b.renderState.blending;
      }

      const original = mesh[CORRUPTION_ORIGINAL_ON_BEFORE_RENDER];
      if (typeof original === 'function') {
        original.call(mesh, renderer, scene, camera, geometry, material, group);
      }
    };

    mesh.material = this.corruptionShaderVariant;
    return binding;
  }

  _unbindCorruptionVariantFromMesh(mesh) {
    if (!mesh?.userData) return;
    const binding = mesh.userData[CORRUPTION_BINDING];
    if (!binding) return;

    if (binding.sourceMaterial) {
      mesh.material = binding.sourceMaterial;
    }

    const original = mesh[CORRUPTION_ORIGINAL_ON_BEFORE_RENDER];
    if (typeof original === 'function') {
      mesh.onBeforeRender = original;
    } else {
      mesh.onBeforeRender = null;
    }

    delete mesh.userData[CORRUPTION_BINDING];
    delete mesh[CORRUPTION_ORIGINAL_ON_BEFORE_RENDER];
  }

  /**
   * Spawn chaos particles at high corruption levels
   */
  spawnChaosParticles(nodeModel, corruptionLevel, deltaTime, visualState) {
    if (!THREE) return;
    
    // HARD BLOCK: Validate nodeModel exists
    if (!nodeModel) {
      if (this.debugMode) console.log('[Corruption] orphan spawn blocked - no nodeModel');
      return;
    }
    
    // HARD BLOCK: Validate position exists
    if (!nodeModel.position && !nodeModel.mesh?.position) {
      if (this.debugMode) console.log('[Corruption] orphan spawn blocked - no position');
      return;
    }

    const now = performance.now();

    // Determine particle emission rate based on corruption
    if (this.hasCascadeCorruptionLink(nodeModel) && corruptionLevel > CASCADE_CORRUPTION_THRESHOLD) {
      const baseEmitRate = 5;  // particles per second at cascade corruption threshold
      const maxEmitRate = 30;  // particles per second at full corruption
      const thresholdRange = Math.max(0.001, 1.0 - CASCADE_CORRUPTION_THRESHOLD);
      const emitRate = baseEmitRate + (maxEmitRate - baseEmitRate) * ((corruptionLevel - CASCADE_CORRUPTION_THRESHOLD) / thresholdRange);

      // Emit particles based on rate
      const timeSinceLastEmit = now - visualState.lastParticleEmitTime;
      const emitInterval = 1000 / emitRate;

      if (timeSinceLastEmit > emitInterval) {
        const particleCount = Math.floor(timeSinceLastEmit / emitInterval);
        
        for (let i = 0; i < particleCount; i++) {
          this.emitChaosParticle(nodeModel, corruptionLevel);
        }

        visualState.lastParticleEmitTime = now;
      }
    }

    // Emit burst particles at extreme corruption
    if (corruptionLevel > 0.85 && Math.random() < corruptionLevel * 0.1) {
      // Occasional burst of 5-10 particles
      const burstCount = Math.floor(Math.random() * 5) + 5;
      for (let i = 0; i < burstCount; i++) {
        this.emitChaosParticle(nodeModel, corruptionLevel, true);
      }
    }
  }

  /**
   * Emit a single chaos particle
   */
  emitChaosParticle(nodeModel, corruptionLevel, isBurst = false) {
    if (!THREE) return;
    
    // HARD BLOCK: Validate nodeModel exists
    if (!nodeModel) {
      if (this.debugMode) console.log('[Corruption] orphan emit blocked - no nodeModel');
      return;
    }
    
    // HARD BLOCK: Validate position exists
    if (!nodeModel.position && !nodeModel.mesh?.position) {
      if (this.debugMode) console.log('[Corruption] orphan emit blocked - no position');
      return;
    }

    // Get position with fallback
    const nodePos = nodeModel?.position?.clone?.() 
      || nodeModel?.mesh?.position?.clone?.();
    
    // HARD GUARD: Block origin spawn (0,0,0)
    if (!nodePos || (nodePos.x === 0 && nodePos.y === 0 && nodePos.z === 0)) {
      if (this.debugMode) console.warn('[CorruptionVFX] origin spawn blocked - source at (0,0,0)');
      return;
    }

    // Particle properties
    const spawnOffset = this._particleSpawnOffset || (this._particleSpawnOffset = new THREE.Vector3());
    spawnOffset.set(
      (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.3
    );

    // SUPERNATURAL UPGRADE: Spectral void particle colors
    // Particles shift from magenta through spectral violet to void purple
    const spectralHue = 0.75 + corruptionLevel * 0.12 + Math.random() * 0.08;
    const spectralSat = 0.6 + corruptionLevel * 0.3;
    const spectralLit = 0.25 + corruptionLevel * 0.35;
    const particleBaseColor = new THREE.Color().setHSL(spectralHue % 1.0, spectralSat, spectralLit);

    // Void tendrils: at high corruption, some particles are deep void
    const isVoidParticle = corruptionLevel > 0.7 && Math.random() < (corruptionLevel - 0.7) * 0.5;
    if (isVoidParticle) {
      particleBaseColor.setHSL(0.78 + Math.random() * 0.05, 0.3, 0.08 + Math.random() * 0.06);
    }

    const particle = {
      position: nodePos.add(spawnOffset),
      startPosition: null, // will be set to position after creation
      baseVelocity: {
        x: (Math.random() - 0.5) * (isBurst ? 0.5 : 0.2),
        y: (Math.random() - 0.5) * (isBurst ? 0.5 : 0.2),
        z: (Math.random() - 0.5) * (isBurst ? 0.5 : 0.2)
      },
      age: 0,
      life: 1.0,
      maxLife: 0.5 + Math.random() * 0.5,
      baseColor: particleBaseColor,
      color: particleBaseColor.clone(),
      size: 0.1 + Math.random() * 0.1,
      // SUPERNATURAL: Track spectral type for color evolution
      spectralHue: spectralHue,
      isVoid: isVoidParticle
    };

    this._ensureParticleRoot();
    particle.mesh = this._createParticleMesh(particle);
    this.particleRoot.add(particle.mesh);

    this.activeParticles.push(particle);
    particle.startPosition = particle.position.clone();

    // Keep particles list from getting too large
    if (this.activeParticles.length > 1000) {
      this.activeParticles.shift();
    }
  }

  /**
   * Update all active particles
   */
  updateParticles(deltaTime) {
    // VisualTime.delta keeps particle integration aligned with RAF cadence.
    const dt = Number.isFinite(deltaTime) && deltaTime > 0 ? deltaTime : this.visualTime.delta;
    if (!this.activeParticles.length) return;

    this._ensureParticleRoot();

    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const particle = this.activeParticles[i];
      particle.age = (particle.age || 0) + dt;
      
      // Update particle life
      particle.life = 1 - (particle.age / particle.maxLife);

      // Update position with gravity using base position (no incremental adds)
      // HARD GUARD: Skip if no startPosition (orphan particle)
      if (!particle.startPosition) {
        this.activeParticles.splice(i, 1);
        continue;
      }
      const start = particle.startPosition;
      const vx = particle.baseVelocity?.x || 0;
      const vy = particle.baseVelocity?.y || 0;
      const vz = particle.baseVelocity?.z || 0;
      const dispX = vx * particle.age;
      const dispZ = vz * particle.age;
      const gravity = -0.5; // matches prior acceleration
      const dispY = vy * particle.age + 0.5 * gravity * particle.age * particle.age;
      particle.position.set(
        start.x + dispX,
        start.y + dispY,
        start.z + dispZ
      );

      // SUPERNATURAL UPGRADE: Spectral color evolution during particle lifetime
      // Void particles darken, spectral particles shift hue as they die
      if (particle.isVoid) {
        // Void particles: pulse between deep void and spectral edge
        const voidPulse = Math.sin(particle.age * 8.0) * 0.5 + 0.5;
        particle.color.setHSL(
          0.78 + voidPulse * 0.06,
          0.3 + voidPulse * 0.3,
          (0.06 + voidPulse * 0.15) * particle.life
        );
      } else if (particle.spectralHue !== undefined) {
        // Spectral particles: hue shifts as they age, cycling through void spectrum
        const ageShift = particle.age * 0.8;
        const evolvingHue = (particle.spectralHue + ageShift * 0.15) % 1.0;
        particle.color.setHSL(
          evolvingHue,
          0.6 + particle.life * 0.3,
          (0.2 + particle.life * 0.4)
        );
      } else {
        // Legacy fallback
        particle.color.copy(particle.baseColor || particle.color).multiplyScalar(particle.life);
      }
      if (particle.mesh?.material?.color) {
        particle.mesh.material.color.copy(particle.color);
        particle.mesh.material.opacity = Math.max(0, Math.min(1, particle.life));
      }
      if (particle.mesh) {
        particle.mesh.position.copy(particle.position);
        particle.mesh.scale.setScalar(particle.size * (0.6 + 0.4 * Math.max(0, particle.life)));
        particle.mesh.rotation.x += (particle.baseVelocity?.x || 0) * dt;
        particle.mesh.rotation.y += (particle.baseVelocity?.y || 0) * dt;
        particle.mesh.rotation.z += (particle.baseVelocity?.z || 0) * dt;
      }

      // Remove dead particles
      if (particle.life <= 0) {
        this._disposeParticleMesh(particle);
        this.activeParticles.splice(i, 1);
      }
    }
  }

  /**
   * Linear interpolation between two color objects
   */
  lerpColor(colorA, colorB, t) {
    return {
      r: colorA.r + (colorB.r - colorA.r) * t,
      g: colorA.g + (colorB.g - colorA.g) * t,
      b: colorA.b + (colorB.b - colorA.b) * t
    };
  }

  /**
   * Check if material supports emissive property
   */
  isMaterialEmissiveCapable(material) {
    if (!material) return false;
    return material.isMeshStandardMaterial ||
           material.isMeshPhongMaterial ||
           material.isMeshLambertMaterial;
  }

  /**
   * Render corruption particles (visual debug/demonstration)
   */
  renderCorruptionParticles(scene, camera, renderer) {
    if (!this.activeParticles.length) return;
    if (scene) {
      this.attachScene(scene);
    } else if (this.scene) {
      this._ensureParticleRoot();
    }

    this._syncParticleSystem();
  }

  /**
   * Debug console API
   */
  setupConsoleAPI() {
    if (typeof window === 'undefined') return;

    window.corruptionVisualDebug = {
      corrupt: (node, amount = 0.1) => {
        if (!node.userData.gameplay) node.userData.gameplay = {};
        node.userData.gameplay.corruptionLevel = Math.min(1, 
          (node.userData.gameplay.corruptionLevel || 0) + amount);
        console.log(`%c[Corruption +${amount}] Level: ${node.userData.gameplay.corruptionLevel.toFixed(2)}`, 
          'color: #ff4400;');
      },

      clean: (node, amount = 0.1) => {
        if (!node.userData.gameplay) node.userData.gameplay = {};
        node.userData.gameplay.corruptionLevel = Math.max(0,
          (node.userData.gameplay.corruptionLevel || 0) - amount);
        console.log(`%c[Cleaned -${amount}] Level: ${node.userData.gameplay.corruptionLevel.toFixed(2)}`,
          'color: #00ff88;');
      },

      setCorruption: (node, value) => {
        if (!node.userData.gameplay) node.userData.gameplay = {};
        node.userData.gameplay.corruptionLevel = Math.max(0, Math.min(1, value));
        console.log(`%c[Set Corruption] Level: ${value.toFixed(2)}`, 'color: #ffaa00;');
      },

      pulse: (node) => {
        if (!node.userData.gameplay) node.userData.gameplay = {};
        node.userData.gameplay.corruptionLevel = 1.0;
        setTimeout(() => {
          node.userData.gameplay.corruptionLevel = 0.0;
        }, 500);
        console.log('%c[Corruption Pulse] 0 → 1 → 0', 'color: #ff0000; font-weight: bold;');
      },

      particles: () => {
        const particleCount = (window.corruptionFX?.activeParticles?.length) || 0;
        console.log(`%c[Particles] Active: ${particleCount}`, 'color: #ffaa00;');
      },

      stats: () => {
        const states = window.corruptionFX?.nodeVisualState?.size || 0;
        const particles = window.corruptionFX?.activeParticles?.length || 0;
        console.log('%c[Corruption FX Stats]', 'color: #ff4400; font-weight: bold;', {
          trackedNodes: states,
          activeParticles: particles
        });
      }
    };

    console.log('%c[CorruptionVisualDebug] API available: window.corruptionVisualDebug', 
      'color: #ff4400;');
  }

  dispose() {
    const bus = this._getSemanticBus();
    const off = bus?.off?.bind(bus) || bus?.unsubscribe?.bind(bus);
    if (off) {
      for (const [eventName, handler] of this._semanticSubscriptions) {
        off(eventName, handler);
      }
    }
    this._semanticSubscriptions = [];

    // UNIFIED CLEANUP CONTRACT - Remove and dispose all tracked objects
    this._createdObjects.forEach(obj => {
      if (this.scene) this.scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
    this._createdObjects = [];

    for (const particle of this.activeParticles) {
      this._disposeParticleMesh(particle);
    }
    this.activeParticles.length = 0;

    if (this.particleRoot) {
      this.particleRoot.parent?.remove(this.particleRoot);
    }
    if (this._particleGeometry?.dispose) {
      this._particleGeometry.dispose();
    }
  }
}

export default CorruptionVisualFX_v1;
