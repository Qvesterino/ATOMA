/**
 * TIER 4: CORRUPTION FEEDBACK VISUALS v1.0 (Session 40)
 * 
 * Visual feedback for player actions affecting corruption
 * 
 * Purpose: Display gameplay feedback when links are created/destroyed
 * - Corruption seed visualization on link creation
 * - Cascade warning indicators
 * - Harmony restoration VFX on link destruction
 * - Real-time corruption network health display
 * 
 * Pure rendering layer — reads gameplay state, writes to THREE.js scene
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

const CORRUPTION_SEED_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying float vFractureNoise;

uniform float uCorruption;

float hash13(vec3 p) {
  return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
}

void main() {
  vUv = uv;

  vec3 displaced = position;
  float corruption = clamp(uCorruption, 0.0, 1.0);
  float scale = mix(1.0, 1.18 + corruption * 0.06, corruption);

  vec2 waveParams = vec2(position.x * 7.0 + position.z * 1.9, position.y * 9.0 - position.x * 1.5);
  vec2 waves = sin(waveParams);
  float noiseValue = hash13(position * 4.0 + vec3(corruption * 7.0));
  float deform = (waves.x * 0.58 + waves.y * 0.42 + (noiseValue - 0.5) * 1.4);
  displaced += normal * deform * (0.03 + corruption * 0.12);
  displaced *= scale;

  vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
  vWorldPosition = worldPosition.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vFractureNoise = hash13(displaced * 6.0 + vec3(corruption * 11.0));

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const CORRUPTION_SEED_FRAGMENT_SHADER = `
uniform float uCorruption;
uniform vec3 uColorBase;
uniform vec3 uColorCorrupt;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying float vFractureNoise;

float random(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  float corruption = clamp(uCorruption, 0.0, 1.0);
  float threshold = 0.18 + corruption * 0.68;
  
  vec2 randomOffset = vec2(10.0 + corruption * 6.0, 16.0 + corruption * 10.0);
  float baseNoise = random(vUv * randomOffset.x + vFractureNoise * 2.0);
  float bandNoise = random(vUv.yx * randomOffset.y + vFractureNoise * 0.75);
  float fracture = baseNoise * 0.68 + bandNoise * 0.32;

  if (step(fracture, threshold) > 0.5) discard;

  float edgeMask = smoothstep(threshold, threshold + 0.06, fracture);
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float viewDot = max(dot(normalize(vWorldNormal), viewDir), 0.0);
  float fresnelBase = 1.0 - viewDot;
  float fresnel = fresnelBase * fresnelBase + fresnelBase * fresnelBase * fresnelBase * 0.3;
  float pulse = 0.88 + vFractureNoise * 0.12;
  float lava = smoothstep(0.58, 1.0, fracture) * pulse;

  vec3 coreColor = mix(uColorBase, vec3(0.07, 0.01, 0.0), 0.7);
  vec3 edgeColor = mix(uColorCorrupt, vec3(1.0, 0.34, 0.06), 0.45 + 0.35 * pulse);
  vec3 color = mix(coreColor, edgeColor, edgeMask);
  color += edgeColor * fresnel * (0.45 + corruption * 0.75);
  color += edgeColor * lava * 0.18;

  gl_FragColor = vec4(color, 1.0);
}
`;

const CORRUPTION_SEED_VERTEX_SHADER_MEDIUM = `
varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying float vFractureNoise;

uniform float uCorruption;

float hash13(vec3 p) {
  return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
}

void main() {
  vUv = uv;

  vec3 displaced = position;
  float corruption = clamp(uCorruption, 0.0, 1.0);
  float scale = mix(1.0, 1.16 + corruption * 0.06, corruption);

  float wave = sin(position.x * 6.0 + position.z * 1.8);
  float noiseValue = hash13(position * 3.5 + vec3(corruption * 6.0));
  float deform = (wave * 0.72 + (noiseValue - 0.5) * 1.2);
  displaced += normal * deform * (0.028 + corruption * 0.11);
  displaced *= scale;

  vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
  vWorldPosition = worldPosition.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vFractureNoise = hash13(displaced * 5.0 + vec3(corruption * 9.0));

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const CORRUPTION_SEED_VERTEX_SHADER_LOW = `
varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying float vFractureNoise;

uniform float uCorruption;

float hash13(vec3 p) {
  return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
}

void main() {
  vUv = uv;

  vec3 displaced = position;
  float corruption = clamp(uCorruption, 0.0, 1.0);
  float scale = mix(1.0, 1.14 + corruption * 0.05, corruption);

  float noiseValue = hash13(position * 3.0 + vec3(corruption * 5.0));
  float deform = (noiseValue - 0.5) * 0.8;
  displaced += normal * deform * (0.025 + corruption * 0.10);
  displaced *= scale;

  vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
  vWorldPosition = worldPosition.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vFractureNoise = hash13(displaced * 4.0 + vec3(corruption * 8.0));

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const CORRUPTION_SEED_FRAGMENT_SHADER_MEDIUM = `
uniform float uCorruption;
uniform vec3 uColorBase;
uniform vec3 uColorCorrupt;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying float vFractureNoise;

float random(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  float corruption = clamp(uCorruption, 0.0, 1.0);
  float threshold = 0.20 + corruption * 0.66;
  
  float baseNoise = random(vUv * (9.0 + corruption * 5.0) + vFractureNoise * 1.8);
  float fracture = baseNoise;

  if (step(fracture, threshold) > 0.5) discard;

  float edgeMask = smoothstep(threshold, threshold + 0.07, fracture);
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float viewDot = max(dot(normalize(vWorldNormal), viewDir), 0.0);
  float fresnelBase = 1.0 - viewDot;
  float fresnel = fresnelBase * fresnelBase;
  float pulse = 0.86 + vFractureNoise * 0.14;
  float lava = smoothstep(0.60, 1.0, fracture) * pulse;

  vec3 coreColor = mix(uColorBase, vec3(0.07, 0.01, 0.0), 0.68);
  vec3 edgeColor = mix(uColorCorrupt, vec3(1.0, 0.34, 0.06), 0.44 + 0.34 * pulse);
  vec3 color = mix(coreColor, edgeColor, edgeMask);
  color += edgeColor * fresnel * (0.42 + corruption * 0.72);
  color += edgeColor * lava * 0.16;

  gl_FragColor = vec4(color, 1.0);
}
`;

const CORRUPTION_SEED_FRAGMENT_SHADER_LOW = `
uniform float uCorruption;
uniform vec3 uColorBase;
uniform vec3 uColorCorrupt;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying float vFractureNoise;

float random(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  float corruption = clamp(uCorruption, 0.0, 1.0);
  float threshold = 0.22 + corruption * 0.64;
  
  float fracture = random(vUv * (8.0 + corruption * 4.0) + vFractureNoise * 1.5);

  if (step(fracture, threshold) > 0.5) discard;

  float edgeMask = smoothstep(threshold, threshold + 0.08, fracture);
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float viewDot = max(dot(normalize(vWorldNormal), viewDir), 0.0);
  float fresnel = 1.0 - viewDot;
  float pulse = 0.84 + vFractureNoise * 0.16;
  float lava = smoothstep(0.62, 1.0, fracture) * pulse;

  vec3 coreColor = mix(uColorBase, vec3(0.07, 0.01, 0.0), 0.66);
  vec3 edgeColor = mix(uColorCorrupt, vec3(1.0, 0.34, 0.06), 0.42 + 0.32 * pulse);
  vec3 color = mix(coreColor, edgeColor, edgeMask);
  color += edgeColor * fresnel * (0.40 + corruption * 0.68);
  color += edgeColor * lava * 0.14;

  gl_FragColor = vec4(color, 1.0);
}
`;

function normalizeSeedMetric(value, fallback = 0.5) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return fallback;
  if (numericValue > 1) {
    return Math.max(0, Math.min(1, numericValue / 100));
  }
  return Math.max(0, Math.min(1, numericValue));
}

export class TIER4_CorruptionFeedbackVisuals {
  constructor(scene, config = {}) {
    // Debug guard (Priority 4 fix)
    this.debug = false;

    this.scene = scene;
    this.camera = config.camera ?? null;
    this.frameScheduler = config.frameScheduler ?? null;
    
    // UNIFIED CLEANUP CONTRACT - Track all created objects
    this._createdObjects = [];
    
    this.config = {
      enableDebug: config.enableDebug ?? false,
      
      // Link creation effects
      showCorruptionSeedPulse: config.showCorruptionSeedPulse ?? false,
      corruptionSeedColor: config.corruptionSeedColor ?? 0xff6600,
      corruptionSeedIntensity: config.corruptionSeedIntensity ?? 0.78,
      corruptionSeedDuration: config.corruptionSeedDuration ?? 0.95,
      maxCorruptionSeeds: config.maxCorruptionSeeds ?? 50,
      corruptionSeedLodDistance: config.corruptionSeedLodDistance ?? 22,
      corruptionSeedCullDistance: config.corruptionSeedCullDistance ?? 38,
      
      // Cascade warning
      showCascadeWarning: config.showCascadeWarning ?? true,
      cascadeWarningColor: config.cascadeWarningColor ?? 0xff0000,
      cascadeWarningPulseSpeed: config.cascadeWarningPulseSpeed ?? 4.0,
      
      // Harmony restoration
      showHarmonyPulse: config.showHarmonyPulse ?? true,
      harmonyPulseColor: config.harmonyPulseColor ?? 0x00ffff,
      harmonyPulseDuration: config.harmonyPulseDuration ?? 0.8,
      harmonyPulseIntensityBoost: config.harmonyPulseIntensityBoost ?? 1.5,
      harmonyPulseScaleBoost: config.harmonyPulseScaleBoost ?? 1.2
    };
    
    // Active visual effects
    this.activeCorruptionSeeds = [];
    this.activeCascadeWarnings = [];
    this.harmonyFieldConsumer = config.harmonyFieldConsumer ?? null;

    // LOD mode: HIGH, MEDIUM, LOW
    this.lodLevel = config.lodLevel ?? 'HIGH';

    // Corruption seed object pool for performance (reuse effect nodes)
    this.config.useCorruptionSeedPool = config.useCorruptionSeedPool ?? true;
    this.config.corruptionSeedPoolSize = config.corruptionSeedPoolSize ?? 24;
    this.seedEffectPool = [];

    // Material pool for reuse
    this.materialPool = {
      cascadeWarning: new THREE.MeshBasicMaterial({
        color: this.config.cascadeWarningColor,
        transparent: true,
        emissive: this.config.cascadeWarningColor,
        emissiveIntensity: 0.5
      })
    };

    // Preload corruption seed shader templates only when the seed effect is enabled
    this.seedMaterialCache = {};
    if (this.config.showCorruptionSeedPulse) {
      this._preloadCorruptionSeedMaterials();
    }
    
    // Geometry pool with LOD variants
    this.geometryPool = {
      HIGH: {
        sphere: new THREE.IcosahedronGeometry(0.3, 4),
        bloomPetal: new THREE.CylinderGeometry(0.04, 0.14, 0.86, 6, 1, false),
        bloomSpine: new THREE.CylinderGeometry(0.03, 0.07, 0.68, 6, 1, true),
        bloomHaloOuter: new THREE.TorusGeometry(0.92, 0.028, 10, 96, Math.PI * 1.42),
        bloomHaloInner: new THREE.TorusGeometry(0.56, 0.02, 8, 72, Math.PI * 1.48)
      },
      MEDIUM: {
        sphere: new THREE.IcosahedronGeometry(0.3, 3),
        bloomPetal: new THREE.CylinderGeometry(0.04, 0.14, 0.86, 6, 1, false),
        bloomSpine: new THREE.CylinderGeometry(0.03, 0.07, 0.68, 6, 1, true),
        bloomHaloOuter: new THREE.TorusGeometry(0.92, 0.028, 8, 64, Math.PI * 1.42),
        bloomHaloInner: new THREE.TorusGeometry(0.56, 0.02, 6, 48, Math.PI * 1.48)
      },
      LOW: {
        sphere: new THREE.IcosahedronGeometry(0.3, 2),
        bloomPetal: new THREE.CylinderGeometry(0.04, 0.14, 0.86, 4, 1, false),
        bloomSpine: new THREE.CylinderGeometry(0.03, 0.07, 0.68, 4, 1, true),
        bloomHaloOuter: new THREE.TorusGeometry(0.92, 0.028, 6, 48, Math.PI * 1.42),
        bloomHaloInner: new THREE.TorusGeometry(0.56, 0.02, 4, 32, Math.PI * 1.48)
      },
      cascadeWarningRing: new THREE.TorusGeometry(0.5, 0.1, 16, 32)
    };

    // initialize pool now that geometry is ready
    if (this.config.showCorruptionSeedPulse) {
      this._initializeSeedEffectPool();
    }
    
    // Statistics
    this.stats = {
      corruptionSeedsRendered: 0,
      cascadeWarningsRendered: 0,
      harmonyPulsesRendered: 0,
      totalEffectsActive: 0
    };
  }

  _readSeedCorruptionLevel(link) {
    const corruptionLevel = Number(
      link?.group?.userData?.conduitState?.metrics?.corruption ??
      link?.userData?.metrics?.corruption ??
      link?.userData?.corruptionLevel ??
      link?.userData?.corruption ??
      link?.corruptionLevel ??
      link?.corruption ??
      0
    );
    if (!Number.isFinite(corruptionLevel)) return 0;
    return Math.max(0, Math.min(1, corruptionLevel));
  }

  _createSeedEffect(corruptionLevel = 0) {
    const structure = this._buildCorruptionSeedStructure(corruptionLevel, 'HIGH');
    const mesh = structure.group;
    mesh.visible = false;

    return {
      mesh,
      type: 'corruptionSeed',
      node: null,
      link: null,
      fragmentRoot: structure.fragmentRoot,
      core: structure.core,
      spine: structure.spine,
      haloOuter: structure.haloOuter,
      haloInner: structure.haloInner,
      fragments: structure.fragments,
      connections: structure.connections,
      lodSprite: structure.lodSprite,
      startTime: 0,
      time: 0,
      duration: this.config.corruptionSeedDuration * 1000,
      startScale: new THREE.Vector3(0.0, 0.0, 0.0),
      endScale: new THREE.Vector3(0.0, 0.0, 0.0),
      fromPool: false,
      lodLevel: 'HIGH'
    };
  }

  _initializeSeedEffectPool() {
    if (!this.config.useCorruptionSeedPool) return;

    for (let i = 0; i < this.config.corruptionSeedPoolSize; i++) {
      const effect = this._createSeedEffect(0);
      effect.fromPool = true;
      this.seedEffectPool.push(effect);
    }
  }

  _resetSeedEffect(effect, node, link, corruptionLevel, bloomScaleMultiplier) {
    effect.node = node;
    effect.link = link;
    effect.startTime = Date.now();
    effect.duration = this.config.corruptionSeedDuration * 1000;
    effect.startScale.setScalar(0.08 * bloomScaleMultiplier);
    effect.endScale.setScalar((1.08 + corruptionLevel * 0.16) * bloomScaleMultiplier);

    effect.mesh.position.copy(node.position);
    effect.mesh.position.z += 0.58;
    effect.mesh.scale.copy(effect.startScale);
    effect.mesh.visible = true;
    effect.fragmentRoot.visible = true;
    effect.lodSprite.visible = false;
    effect.lodSprite.scale.setScalar(0.44 + corruptionLevel * 0.42);
    effect.lodSprite.material.opacity = 0.38 + corruptionLevel * 0.5;
    if (effect.haloOuter) {
      effect.haloOuter.scale.set(1.0, 0.72, 1.12);
    }
    if (effect.haloInner) {
      effect.haloInner.scale.set(0.86, 1.14, 0.92);
    }

    if (effect.core?.material?.uniforms?.uCorruption) {
      effect.core.material.uniforms.uCorruption.value = corruptionLevel;
    }
    if (effect.spine?.material?.uniforms?.uCorruption) {
      effect.spine.material.uniforms.uCorruption.value = corruptionLevel;
    }
    for (const fragment of effect.fragments) {
      if (fragment.mesh.material?.uniforms?.uCorruption) {
        fragment.mesh.material.uniforms.uCorruption.value = corruptionLevel;
      }
    }

    this._syncCorruptionSeedConnections(effect, corruptionLevel);
  }

  _preloadCorruptionSeedMaterials() {
    const profiles = ['core', 'spine', 'petal'];
    const lodLevels = ['HIGH', 'MEDIUM', 'LOW'];
    
    profiles.forEach(profile => {
      this.seedMaterialCache[profile] = {};
      lodLevels.forEach(lodLevel => {
        this.seedMaterialCache[profile][lodLevel] = this._buildCorruptionSeedMaterialTemplate(profile, lodLevel);
      });
    });
  }

  _buildCorruptionSeedMaterialTemplate(profile = 'petal', lodLevel = 'HIGH') {
    const palette = {
      core: {
        base: 0x080305,
        corrupt: 0xffb157
      },
      spine: {
        base: 0x11060a,
        corrupt: 0xff9a43
      },
      petal: {
        base: 0x150608,
        corrupt: 0xff7c2f
      }
    }[profile] ?? {
      base: 0x150608,
      corrupt: 0xff7c2f
    };

    const shaderVariants = {
      HIGH: { vertex: CORRUPTION_SEED_VERTEX_SHADER, fragment: CORRUPTION_SEED_FRAGMENT_SHADER },
      MEDIUM: { vertex: CORRUPTION_SEED_VERTEX_SHADER_MEDIUM, fragment: CORRUPTION_SEED_FRAGMENT_SHADER_MEDIUM },
      LOW: { vertex: CORRUPTION_SEED_VERTEX_SHADER_LOW, fragment: CORRUPTION_SEED_FRAGMENT_SHADER_LOW }
    };
    
    const shaders = shaderVariants[lodLevel] || shaderVariants.HIGH;

    return new THREE.ShaderMaterial({
      vertexShader: shaders.vertex,
      fragmentShader: shaders.fragment,
      uniforms: {
        uCorruption: { value: 0 },
        uColorBase: { value: new THREE.Color(palette.base) },
        uColorCorrupt: { value: new THREE.Color(palette.corrupt) }
      },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      toneMapped: false
    });
  }

  _createCorruptionSeedMaterial(corruptionLevel = 0, profile = 'petal', lodLevel = 'HIGH') {
    if (!this.seedMaterialCache[profile]) {
      this.seedMaterialCache[profile] = {};
    }
    if (!this.seedMaterialCache[profile][lodLevel]) {
      this.seedMaterialCache[profile][lodLevel] = this._buildCorruptionSeedMaterialTemplate(profile, lodLevel);
    }
    
    const material = this.seedMaterialCache[profile][lodLevel];
    material.uniforms.uCorruption.value = corruptionLevel;
    return material;
  }

  _createSeedConnectionMaterial() {
    return new THREE.LineBasicMaterial({
      color: 0xff6a24,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      depthTest: true,
      toneMapped: false
    });
  }

  _createSeedSpriteMaterial() {
    return new THREE.SpriteMaterial({
      color: 0xff6a24,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      depthTest: true,
      toneMapped: false
    });
  }

  _buildCorruptionSeedStructure(corruptionLevel = 0, lodLevel = 'HIGH') {
    const group = new THREE.Group();
    group.name = 'APOSTATE_BLOOM_ROOT';
    group.frustumCulled = true;

    const bloomRoot = new THREE.Group();
    bloomRoot.name = 'APOSTATE_BLOOM_CROWN';
    group.add(bloomRoot);

    const fragmentCount = 6 + Math.floor(Math.random() * 3);
    const fragments = [];
    const connections = [];

    const geometryLod = this.geometryPool[lodLevel] || this.geometryPool.HIGH;

    const coreMaterial = this._createCorruptionSeedMaterial(corruptionLevel, 'core', lodLevel);
    const spineMaterial = this._createCorruptionSeedMaterial(corruptionLevel, 'spine', lodLevel);
    const petalMaterial = this._createCorruptionSeedMaterial(corruptionLevel, 'petal', lodLevel);

    const voidCore = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.12, 0),
      new THREE.MeshBasicMaterial({
        color: 0x020102,
        transparent: true,
        opacity: 0.96,
        depthWrite: false,
        depthTest: true,
        toneMapped: false
      })
    );
    voidCore.name = 'ApostateBloomVoidHeart';
    voidCore.scale.set(1.0, 1.0, 1.0);
    bloomRoot.add(voidCore);

    const core = new THREE.Mesh(geometryLod.sphere, coreMaterial);
    core.name = 'ApostateBloomHeart';
    core.position.set(0.0, 0.03, 0.0);
    core.scale.set(0.42, 0.46, 0.36);
    core.rotation.set(0.42, -0.24, 0.18);
    bloomRoot.add(core);

    const spine = new THREE.Mesh(geometryLod.bloomSpine, spineMaterial);
    spine.name = 'ApostateBloomSpine';
    spine.position.set(0.0, 0.46, 0.02);
    spine.rotation.set(0.18, 0.34, -0.12);
    spine.scale.set(0.92, 1.08, 0.82);
    bloomRoot.add(spine);

    const haloOuter = new THREE.Mesh(
      geometryLod.bloomHaloOuter,
      new THREE.MeshBasicMaterial({
        color: 0x42101a,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
        depthTest: true,
        toneMapped: false
      })
    );
    haloOuter.name = 'ApostateBloomOuterHalo';
    haloOuter.rotation.set(0.82, -0.24, 0.44);
    haloOuter.scale.set(1.0, 0.72, 1.12);
    bloomRoot.add(haloOuter);

    const haloInner = new THREE.Mesh(
      geometryLod.bloomHaloInner,
      new THREE.MeshBasicMaterial({
        color: 0xffb55b,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        depthTest: true,
        toneMapped: false
      })
    );
    haloInner.name = 'ApostateBloomInnerHalo';
    haloInner.rotation.set(0.26, 0.48, -0.42);
    haloInner.scale.set(0.86, 1.14, 0.92);
    bloomRoot.add(haloInner);

    const petalRing = new THREE.Group();
    petalRing.name = 'ApostateBloomPetalRing';
    bloomRoot.add(petalRing);

    const crownAnchor = new THREE.Vector3(0, 0.02, 0);
    const baseRadius = 0.56 + corruptionLevel * 0.16;

    for (let i = 0; i < fragmentCount; i++) {
      const mesh = new THREE.Mesh(geometryLod.bloomPetal, petalMaterial);
      const angle = (i / fragmentCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.24;
      const baseScale = 0.35 + Math.random() * 0.18 + corruptionLevel * 0.08;
      const radius = baseRadius + Math.random() * 0.14;
      const offset = new THREE.Vector3(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 0.34 + Math.sin(angle * 2.0) * 0.08,
        Math.sin(angle) * radius * 0.82
      );

      mesh.position.copy(offset);
      mesh.rotation.set(
        0.28 + Math.random() * 0.88,
        angle + Math.PI * 0.5,
        (Math.random() - 0.5) * 0.9
      );
      mesh.scale.set(baseScale * 0.68, baseScale * 1.42, baseScale * 0.48);
      petalRing.add(mesh);

      fragments.push({
        mesh,
        phase: Math.random() * Math.PI * 2
      });
    }

    const connectedPairs = new Set();
    const addConnection = (a, b, kind = 'spoke') => {
      if (a === b && kind !== 'spoke') return;
      const key = a < b ? `${kind}:${a}:${b}` : `${kind}:${b}:${a}`;
      if (connectedPairs.has(key)) return;
      connectedPairs.add(key);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(6), 3));
      const line = new THREE.Line(geometry, this._createSeedConnectionMaterial());
      line.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_IMPACTS');
      bloomRoot.add(line);
      connections.push({ line, a, b, kind });
    };

    for (let i = 0; i < fragmentCount; i++) {
      addConnection(i, (i + 1) % fragmentCount, 'crown');
    }

    const extraConnections = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < extraConnections; i++) {
      addConnection(
        Math.floor(Math.random() * fragmentCount),
        Math.floor(Math.random() * fragmentCount),
        'crown'
      );
    }

    for (let i = 0; i < fragmentCount; i++) {
      addConnection(-1, i, 'spoke');
    }

    const syncConnectionVisuals = (connection) => {
      const fragmentA = connection.a >= 0 ? fragments[connection.a] : null;
      const fragmentB = connection.b >= 0 ? fragments[connection.b] : null;
      const anchorA = fragmentA?.mesh?.position ?? core.position;
      const anchorB = fragmentB?.mesh?.position ?? core.position;
      const positions = connection.line.geometry.attributes.position.array;
      positions[0] = anchorA.x;
      positions[1] = anchorA.y;
      positions[2] = anchorA.z;
      positions[3] = anchorB.x;
      positions[4] = anchorB.y;
      positions[5] = anchorB.z;
      connection.line.geometry.attributes.position.needsUpdate = true;

      const phaseA = fragmentA?.phase ?? 0.0;
      const phaseB = fragmentB?.phase ?? 0.0;
      const kindBias = connection.kind === 'spoke' ? 1.0 : 0.72;
      const staticPulse = 0.64 + 0.36 * Math.sin(phaseA + phaseB);
      connection.line.material.opacity = (0.14 + corruptionLevel * 0.42) * staticPulse * kindBias;
    };

    for (const connection of connections) {
      syncConnectionVisuals(connection);
    }

    const lodSprite = new THREE.Sprite(this._createSeedSpriteMaterial());
    lodSprite.visible = false;
    lodSprite.scale.setScalar(0.68 + corruptionLevel * 0.42);
    group.add(lodSprite);

    return { group, fragmentRoot: petalRing, core, spine, haloOuter, haloInner, fragments, connections, lodSprite, voidCore, crownAnchor };
  }

  _syncCorruptionSeedConnections(effect, corruptionLevel = 0) {
    for (const connection of effect.connections) {
      const fragmentA = connection.a >= 0 ? effect.fragments[connection.a] : null;
      const fragmentB = connection.b >= 0 ? effect.fragments[connection.b] : null;
      const anchorA = fragmentA?.mesh?.position ?? effect.core?.position ?? effect.mesh?.position;
      const anchorB = fragmentB?.mesh?.position ?? effect.core?.position ?? effect.mesh?.position;
      if (!anchorA || !anchorB) continue;

      const positions = connection.line.geometry.attributes.position.array;
      positions[0] = anchorA.x;
      positions[1] = anchorA.y;
      positions[2] = anchorA.z;
      positions[3] = anchorB.x;
      positions[4] = anchorB.y;
      positions[5] = anchorB.z;
      connection.line.geometry.attributes.position.needsUpdate = true;

      const phaseA = fragmentA?.phase ?? 0.0;
      const phaseB = fragmentB?.phase ?? 0.0;
      const kindBias = connection.kind === 'spoke' ? 1.0 : 0.72;
      const staticPulse = 0.64 + 0.36 * Math.sin(phaseA + phaseB);
      connection.line.material.opacity = (0.14 + corruptionLevel * 0.42) * staticPulse * kindBias;
    }
  }

  _disposeCorruptionSeedEffect(effect) {
    if (!effect?.mesh) return;

    if (effect.fromPool) {
      effect.mesh.visible = false;
      if (effect.mesh.parent) effect.mesh.parent.remove(effect.mesh);
      effect.node = null;
      effect.link = null;
      effect.fragmentRoot.visible = true;
      effect.lodSprite.visible = false;
      this.seedEffectPool.push(effect);
      return;
    }

    this.scene.remove(effect.mesh);

    effect.mesh.traverse((child) => {
      if (child.material?.dispose) child.material.dispose();
      if (child.geometry?.dispose && (child.isLine || child.isLineSegments || child.isPoints)) child.geometry.dispose();
    });
  }

  setHarmonyFieldConsumer(harmonyFieldConsumer) {
    this.harmonyFieldConsumer = harmonyFieldConsumer ?? null;
  }

  setLOD(lodLevel = 'HIGH') {
    const safe = String(lodLevel).toUpperCase();
    this.lodLevel = ['HIGH', 'MEDIUM', 'LOW'].includes(safe) ? safe : 'HIGH';
  }

  _calculateLODForDistance(distance) {
    const lodDistances = {
      HIGH: 0,
      MEDIUM: this.config.corruptionSeedLodDistance * 0.6,
      LOW: this.config.corruptionSeedLodDistance * 0.85
    };

    if (this.lodLevel === 'LOW') return 'LOW';
    if (this.lodLevel === 'MEDIUM') {
      return distance > lodDistances.MEDIUM ? 'LOW' : 'MEDIUM';
    }
    
    if (distance > lodDistances.LOW) return 'LOW';
    if (distance > lodDistances.MEDIUM) return 'MEDIUM';
    return 'HIGH';
  }

  _updateEffectLOD(effect, distance) {
    const targetLOD = this._calculateLODForDistance(distance);
    if (effect.lodLevel === targetLOD) return;

    effect.lodLevel = targetLOD;
    const profiles = ['core', 'spine', 'petal'];
    const profileMap = { core: effect.core, spine: effect.spine };

    profiles.forEach(profile => {
      const mesh = profileMap[profile] || effect.fragments?.[0]?.mesh;
      if (mesh?.material) {
        const newMaterial = this._createCorruptionSeedMaterial(
          mesh.material.uniforms.uCorruption.value,
          profile,
          targetLOD
        );
        mesh.material = newMaterial;
      }
    });

    effect.fragments?.forEach((fragment, i) => {
      if (fragment.mesh?.material) {
        const newMaterial = this._createCorruptionSeedMaterial(
          fragment.mesh.material.uniforms.uCorruption.value,
          'petal',
          targetLOD
        );
        fragment.mesh.material = newMaterial;
      }
    });
    
    effect.lodTransitionStart = Date.now();
    effect.lodTransitionDuration = 150;
  }

  _effectMatchesNode(effect, node) {
    if (!effect || !node) return false;
    const effectNode = effect.node;
    return effectNode === node || effectNode?.uuid === node?.uuid;
  }

  clearEffectsForNode(node) {
    if (!node) return 0;

    let cleared = 0;

    for (let i = this.activeCorruptionSeeds.length - 1; i >= 0; i--) {
      const effect = this.activeCorruptionSeeds[i];
      if (!this._effectMatchesNode(effect, node)) continue;
      this._disposeCorruptionSeedEffect(effect);
      this.activeCorruptionSeeds.splice(i, 1);
      cleared += 1;
    }

    for (let i = this.activeCascadeWarnings.length - 1; i >= 0; i--) {
      const effect = this.activeCascadeWarnings[i];
      if (!this._effectMatchesNode(effect, node)) continue;
      this.scene.remove(effect.mesh);
      effect.mesh.material.dispose();
      this.activeCascadeWarnings.splice(i, 1);
      cleared += 1;
    }

    return cleared;
  }

  clearEffectsForNodes(nodes = []) {
    let cleared = 0;
    for (const node of nodes) {
      cleared += this.clearEffectsForNode(node);
    }
    return cleared;
  }
  
  /**
   * Display corruption seed effect on link creation
   * Appears at source node, pulses with corruption color
   */
  displayCorruptionSeed(node, link = null) {
    if (!node || !this.config.showCorruptionSeedPulse) return;

    try {
      if (this.camera && node.position.distanceTo(this.camera.position) > this.config.corruptionSeedCullDistance) {
        return;
      }

      const bloomScaleMultiplier = 1.5;
      const corruptionLevel = this._readSeedCorruptionLevel(link);

      if (this.activeCorruptionSeeds.length >= this.config.maxCorruptionSeeds) {
        const oldest = this.activeCorruptionSeeds.shift();
        this._disposeCorruptionSeedEffect(oldest);
      }

      let effect = null;
      if (this.config.useCorruptionSeedPool && this.seedEffectPool.length > 0) {
        effect = this.seedEffectPool.pop();
        this._resetSeedEffect(effect, node, link, corruptionLevel, bloomScaleMultiplier);
        this.scene.add(effect.mesh);
        this._createdObjects.push(effect.mesh);  // UNIFIED CLEANUP CONTRACT
      } else {
        effect = this._createSeedEffect(corruptionLevel);
        this._resetSeedEffect(effect, node, link, corruptionLevel, bloomScaleMultiplier);
        this.scene.add(effect.mesh);
        this._createdObjects.push(effect.mesh);  // UNIFIED CLEANUP CONTRACT
      }

      this.activeCorruptionSeeds.push(effect);
      this.stats.corruptionSeedsRendered++;

      if (this.config.enableDebug) {
        if (this.debug) console.log('[TIER4_CorruptionFeedbackVisuals] Corruption seed displayed at node');
      }
    } catch (err) {
      console.warn('[TIER4_CorruptionFeedbackVisuals] displayCorruptionSeed error:', err);
    }
  }
  
  /**
   * Display cascade warning indicator
   * Pulsing red indicator around node showing cascade risk
   */
  displayCascadeWarning(node) {
    if (!node || !this.config.showCascadeWarning) return;
    
    try {
      const mesh = new THREE.Mesh(
        this.geometryPool.cascadeWarningRing,
        this.materialPool.cascadeWarning.clone()
      );
      
      // Position at node
      mesh.position.copy(node.position);
      mesh.scale.set(1.5, 1.5, 1.0);
      
      this.scene.add(mesh);
      this._createdObjects.push(mesh);  // UNIFIED CLEANUP CONTRACT
      
      // Create animation data
      const effect = {
        mesh,
        type: 'cascadeWarning',
        node,
        startTime: Date.now(),
        duration: 1000, // Stays visible for 1 second
        pulseSpeed: this.config.cascadeWarningPulseSpeed
      };
      
      this.activeCascadeWarnings.push(effect);
      this.stats.cascadeWarningsRendered++;
      
      if (this.config.enableDebug) {
        if (this.debug) console.log('[TIER4_CorruptionFeedbackVisuals] Cascade warning displayed');
      }
      
    } catch (err) {
      console.warn('[TIER4_CorruptionFeedbackVisuals] displayCascadeWarning error:', err);
    }
  }
  
  /**
   * Display harmony restoration pulse
   * Cyan expanding wave emanating from node
   */
  displayHarmonyPulse(node) {
    if (!node || !this.config.showHarmonyPulse || !this.harmonyFieldConsumer?.flashHarmonyField) return;
    
    try {
      const flashed = this.harmonyFieldConsumer.flashHarmonyField(node, {
        duration: this.config.harmonyPulseDuration,
        intensityMultiplier: this.config.harmonyPulseIntensityBoost,
        scaleMultiplier: this.config.harmonyPulseScaleBoost
      });

      if (!flashed) return;

      this.stats.harmonyPulsesRendered++;
      
      if (this.config.enableDebug) {
        if (this.debug) console.log('[TIER4_CorruptionFeedbackVisuals] Harmony field pulse flashed');
      }
      
    } catch (err) {
      console.warn('[TIER4_CorruptionFeedbackVisuals] displayHarmonyPulse error:', err);
    }
  }
  
  /**
   * Update all active visual effects
   * Call from main animation loop
   */
  update(deltaTime) {
    if (this.frameScheduler?.shouldRunVisual && !this.frameScheduler.shouldRunVisual()) return;

    const currentTime = Date.now();
    
    // Update corruption seeds
    for (let i = this.activeCorruptionSeeds.length - 1; i >= 0; i--) {
      const effect = this.activeCorruptionSeeds[i];
      const elapsed = currentTime - effect.startTime;
      const progress = Math.min(elapsed / effect.duration, 1.0);
      const corruptionLevel = this._readSeedCorruptionLevel(effect.link);

      const distanceToCamera = this.camera?.position ? effect.mesh.position.distanceTo(this.camera.position) : 0;
      const isCulled = this.camera && distanceToCamera > this.config.corruptionSeedCullDistance;
      const useSpriteLod = this.camera &&
        distanceToCamera > this.config.corruptionSeedLodDistance &&
        distanceToCamera <= this.config.corruptionSeedCullDistance;

      // Additional LOD-based skip: if not HIGH and too far for medium/low quality, skip heavy update.
      if (this.lodLevel !== 'HIGH' && distanceToCamera > this.config.corruptionSeedLodDistance * 0.75) {
        effect.mesh.visible = false;
        effect.fragmentRoot.visible = false;
        effect.lodSprite.visible = false;
        continue;
      }

      if (isCulled) {
        effect.mesh.visible = false;
        continue;
      }
      
      this._updateEffectLOD(effect, distanceToCamera);
      
      effect.mesh.visible = true;
      effect.fragmentRoot.visible = !useSpriteLod;
      effect.lodSprite.visible = !!useSpriteLod;
      
      if (effect.lodTransitionStart) {
        const transitionProgress = Math.min((Date.now() - effect.lodTransitionStart) / effect.lodTransitionDuration, 1.0);
        const transitionAlpha = 1.0 - Math.pow(1.0 - transitionProgress, 3);
        
        if (effect.core?.material) {
          effect.core.material.opacity = transitionAlpha;
        }
        if (effect.spine?.material) {
          effect.spine.material.opacity = transitionAlpha;
        }
        effect.fragments?.forEach(fragment => {
          if (fragment.mesh?.material) {
            fragment.mesh.material.opacity = transitionAlpha;
          }
        });
        
        if (transitionProgress >= 1.0) {
          delete effect.lodTransitionStart;
          delete effect.lodTransitionDuration;
        }
      }
      
      // Scale up
      const bloomEase = 0.54 + 0.46 * Math.sin(progress * Math.PI * 0.5);
      effect.mesh.scale.lerpVectors(effect.startScale, effect.endScale, bloomEase);

      if (useSpriteLod) {
        effect.lodSprite.scale.setScalar(0.44 + corruptionLevel * 0.42);
        effect.lodSprite.material.opacity = 0.38 + corruptionLevel * 0.5;
      } else {
        effect.lodSprite.material.opacity = 0.0;
      }
      
      // Remove when done
      if (progress >= 1.0) {
        this._disposeCorruptionSeedEffect(effect);
        this.activeCorruptionSeeds.splice(i, 1);
      }
    }
    
    // Update cascade warnings
    for (let i = this.activeCascadeWarnings.length - 1; i >= 0; i--) {
      const effect = this.activeCascadeWarnings[i];
      const elapsed = currentTime - effect.startTime;
      const progress = Math.min(elapsed / effect.duration, 1.0);
      
      // Pulse effect
      const pulse = Math.sin(progress * Math.PI * effect.pulseSpeed) * 0.5 + 0.5;
      effect.mesh.material.opacity = pulse;
      effect.mesh.material.emissiveIntensity = pulse;
      
      // Remove when done
      if (progress >= 1.0) {
        this.scene.remove(effect.mesh);
        this.activeCascadeWarnings.splice(i, 1);
      }
    }
    
    // Update stats
    this.stats.totalEffectsActive = 
      this.activeCorruptionSeeds.length + 
      this.activeCascadeWarnings.length;
  }
  
  /**
   * Get performance statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeEffects: this.stats.totalEffectsActive
    };
  }
  
  /**
   * Clear all active effects (for scene reset)
   */
  clear() {
    // Remove corruption seeds
    for (const effect of this.activeCorruptionSeeds) {
      this._disposeCorruptionSeedEffect(effect);
    }
    this.activeCorruptionSeeds = [];
    
    // Remove cascade warnings
    for (const effect of this.activeCascadeWarnings) {
      this.scene.remove(effect.mesh);
    }
    this.activeCascadeWarnings = [];
    
    this.stats.totalEffectsActive = 0;
  }
  
  /**
   * Dispose resources
   */
  dispose() {
    this.clear();

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

    // Dispose pooled seed effect meshes/materials
    while (this.seedEffectPool.length > 0) {
      const effect = this.seedEffectPool.pop();
      if (effect.mesh.parent) effect.mesh.parent.remove(effect.mesh);
      effect.mesh.traverse((child) => {
        if (child.material?.dispose) child.material.dispose();
        if (child.geometry?.dispose && (child.isLine || child.isLineSegments || child.isPoints)) child.geometry.dispose();
      });
    }

    // Dispose materials
    this.materialPool.cascadeWarning.dispose();
    
    // Dispose geometries
    this.geometryPool.sphere.dispose();
    this.geometryPool.cascadeWarningRing.dispose();
  }
}

export default TIER4_CorruptionFeedbackVisuals;
