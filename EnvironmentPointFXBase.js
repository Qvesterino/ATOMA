import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

/**
 * EnvironmentPointFXBase
 * ─────────────────────────────────────────────────────────────────────────
 * Lifecycle / cache base for environment-domain THREE.Points clouds.
 * Mirrors the contract of LinkPointFXBase but is domain-separated.
 *
 * Domain: world-space, field, atmosphere, ambient particle effects.
 * NOT for: link FX (→ LinkPointFXBase), node halos (→ EnhancedNodeModels).
 *
 * Usage pattern:
 *   const base = new EnvironmentPointFXBase(scene);
 *   const { points, geometry, material } = base.createEnvironmentPointCloud({
 *     count: 1200,
 *     preset: 'shimmer',
 *   });
 *   group.add(points);
 *   // on teardown:
 *   base.dispose();
 *
 * Render layers:
 *   WORLD_BACKGROUND (renderOrder 400) — background field / shard clouds
 *   WORLD_OVERLAY    (renderOrder 450) — atmosphere overlays, aura overlays
 */

// ─── Module-level caches (shared across all instances, scoped to env domain) ───

const ENV_POINT_FX_TEXTURE_CACHE = new Map();
const ENV_POINT_FX_MATERIAL_CACHE = new Map();

// ─── Internal helpers ─────────────────────────────────────────────────────────

const hashString = (input = '') => {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};

const cloneColor = (value, fallback = 0xffffff) => {
  if (value instanceof THREE.Color) return value.clone();
  if (typeof value === 'number' || typeof value === 'string') return new THREE.Color(value);
  return new THREE.Color(fallback);
};

const serializeMaterialValue = (value) => {
  const raw = value?.value !== undefined ? value.value : value;
  if (raw === null || raw === undefined) return String(raw);
  if (raw instanceof THREE.Color) return `color:${raw.getHexString()}`;
  if (raw instanceof THREE.Vector2) return `vec2:${raw.x},${raw.y}`;
  if (raw instanceof THREE.Vector3) return `vec3:${raw.x},${raw.y},${raw.z}`;
  if (raw.isTexture) return `texture:${raw.uuid}`;
  if (Array.isArray(raw)) return `array:[${raw.map(serializeMaterialValue).join(',')}]`;
  if (typeof raw === 'number' || typeof raw === 'boolean') return `${typeof raw}:${raw}`;
  if (typeof raw === 'string') return `string:${raw}`;
  return `${raw.constructor?.name || typeof raw}:${String(raw)}`;
};

const buildUniformSignature = (uniforms = {}) => {
  const keys = Object.keys(uniforms).sort();
  if (keys.length === 0) return '';
  return keys.map((key) => `${key}=${serializeMaterialValue(uniforms[key])}`).join('|');
};

// ─── Texture factory ──────────────────────────────────────────────────────────

/**
 * Returns a cached CanvasTexture for the given environment sprite kind.
 * All kinds produce soft circular radial gradients tuned for their visual role.
 *
 * kinds:
 *   soft    — generic white soft dot (default)
 *   shimmer — faint blue-white world shimmer
 *   dust    — warm amber dust / haze
 *   aura    — cool teal consciousness aura
 *   aurora  — warm pink aurora ribbon point
 *   plasma  — bright cyan quantum plasma
 *   haze    — misty grey atmospheric haze
 *   field   — electric blue shard field
 */
const getEnvSpriteTexture = (kind = 'soft') => {
  const cacheKey = kind || 'soft';
  if (ENV_POINT_FX_TEXTURE_CACHE.has(cacheKey)) {
    return ENV_POINT_FX_TEXTURE_CACHE.get(cacheKey);
  }

  if (typeof document === 'undefined') return null;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  const gradient = ctx.createRadialGradient(cx, cy, r * 0.03, cx, cy, r);

  switch (kind) {
    case 'shimmer':
      gradient.addColorStop(0.00, 'rgba(255,255,255,1.0)');
      gradient.addColorStop(0.14, 'rgba(200,230,255,0.95)');
      gradient.addColorStop(0.40, 'rgba(140,190,255,0.60)');
      gradient.addColorStop(0.72, 'rgba(100,160,255,0.20)');
      gradient.addColorStop(1.00, 'rgba(0,0,0,0)');
      break;

    case 'dust':
      gradient.addColorStop(0.00, 'rgba(255,255,255,1.0)');
      gradient.addColorStop(0.16, 'rgba(255,220,150,0.92)');
      gradient.addColorStop(0.42, 'rgba(220,160,80,0.60)');
      gradient.addColorStop(0.74, 'rgba(180,110,40,0.20)');
      gradient.addColorStop(1.00, 'rgba(0,0,0,0)');
      break;

    case 'aura':
      gradient.addColorStop(0.00, 'rgba(255,255,255,1.0)');
      gradient.addColorStop(0.16, 'rgba(160,255,230,0.96)');
      gradient.addColorStop(0.44, 'rgba(60,220,190,0.62)');
      gradient.addColorStop(0.74, 'rgba(20,180,160,0.20)');
      gradient.addColorStop(1.00, 'rgba(0,0,0,0)');
      break;

    case 'aurora':
      gradient.addColorStop(0.00, 'rgba(255,255,255,1.0)');
      gradient.addColorStop(0.16, 'rgba(255,210,210,0.96)');
      gradient.addColorStop(0.44, 'rgba(230,160,190,0.62)');
      gradient.addColorStop(0.74, 'rgba(200,130,180,0.20)');
      gradient.addColorStop(1.00, 'rgba(0,0,0,0)');
      break;

    case 'plasma':
      gradient.addColorStop(0.00, 'rgba(255,255,255,1.0)');
      gradient.addColorStop(0.14, 'rgba(180,255,255,0.97)');
      gradient.addColorStop(0.38, 'rgba(60,220,255,0.72)');
      gradient.addColorStop(0.70, 'rgba(20,150,255,0.24)');
      gradient.addColorStop(1.00, 'rgba(0,0,0,0)');
      break;

    case 'haze':
      gradient.addColorStop(0.00, 'rgba(255,255,255,0.85)');
      gradient.addColorStop(0.22, 'rgba(200,210,220,0.60)');
      gradient.addColorStop(0.50, 'rgba(160,170,180,0.28)');
      gradient.addColorStop(0.80, 'rgba(130,140,150,0.08)');
      gradient.addColorStop(1.00, 'rgba(0,0,0,0)');
      break;

    case 'field':
      gradient.addColorStop(0.00, 'rgba(255,255,255,1.0)');
      gradient.addColorStop(0.14, 'rgba(130,210,255,0.96)');
      gradient.addColorStop(0.38, 'rgba(60,150,255,0.68)');
      gradient.addColorStop(0.68, 'rgba(30,100,220,0.22)');
      gradient.addColorStop(1.00, 'rgba(0,0,0,0)');
      break;

    default: // 'soft'
      gradient.addColorStop(0.00, 'rgba(255,255,255,1.0)');
      gradient.addColorStop(0.18, 'rgba(255,255,255,0.90)');
      gradient.addColorStop(0.48, 'rgba(220,220,220,0.45)');
      gradient.addColorStop(0.80, 'rgba(200,200,200,0.12)');
      gradient.addColorStop(1.00, 'rgba(0,0,0,0)');
      break;
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.userData = texture.userData || {};
  texture.userData.isShared = true;
  texture.userData.envPointFXTextureKind = cacheKey;
  ENV_POINT_FX_TEXTURE_CACHE.set(cacheKey, texture);
  return texture;
};

// ─── Material cache (refcounted) ──────────────────────────────────────────────

const buildMaterialCacheKey = ({
  preset = 'field',
  texture = null,
  transparent = true,
  blending = null,
  depthTest = null,
  depthWrite = null,
  toneMapped = null,
  vertexColors = false,
  opacity = null,
  size = null,
  pointsMaterialOptions = {}
} = {}) => {
  const textureSignature = texture?.userData?.envPointFXTextureKind
    || texture?.uuid
    || 'no-texture';
  return hashString([
    'ATOMA_ENV_POINT_FX_v1',
    `preset=${preset}`,
    `texture=${textureSignature}`,
    `transparent=${transparent}`,
    `blending=${blending ?? 'null'}`,
    `depthTest=${depthTest ?? 'null'}`,
    `depthWrite=${depthWrite ?? 'null'}`,
    `toneMapped=${toneMapped ?? 'null'}`,
    `vertexColors=${vertexColors}`,
    `opacity=${opacity ?? 'null'}`,
    `size=${size ?? 'null'}`,
    `pointsMaterialOptions=${buildUniformSignature(pointsMaterialOptions)}`
  ].join('|'));
};

const acquireSharedMaterial = (cacheKey, materialFactory) => {
  const existing = ENV_POINT_FX_MATERIAL_CACHE.get(cacheKey);
  if (existing) {
    existing.refCount += 1;
    existing.material.userData.__envPointFXRefCount = existing.refCount;
    return existing.material;
  }

  const material = materialFactory();
  const originalDispose = typeof material.dispose === 'function' ? material.dispose.bind(material) : null;
  material.userData = material.userData || {};
  material.userData.isShared = true;
  material.userData.__envPointFXCacheKey = cacheKey;
  material.userData.__envPointFXRefCount = 1;
  material.userData.__envPointFXDisposed = false;
  material.dispose = () => {
    const entry = ENV_POINT_FX_MATERIAL_CACHE.get(cacheKey);
    if (!entry || entry.material !== material) {
      if (!material.userData.__envPointFXDisposed) {
        material.userData.__envPointFXDisposed = true;
        originalDispose?.();
      }
      return;
    }
    entry.refCount -= 1;
    material.userData.__envPointFXRefCount = entry.refCount;
    if (entry.refCount <= 0) {
      ENV_POINT_FX_MATERIAL_CACHE.delete(cacheKey);
      material.userData.__envPointFXDisposed = true;
      originalDispose?.();
    }
  };

  ENV_POINT_FX_MATERIAL_CACHE.set(cacheKey, { material, refCount: 1, originalDispose });
  return material;
};

// ─── Presets ──────────────────────────────────────────────────────────────────

/**
 * Environment point FX presets.
 * Each preset defines the visual defaults for a category of env particle cloud.
 */
export const ENV_POINT_FX_PRESETS = {
  /** Generic world field — shard clouds, background field particles */
  field: {
    layerKey: 'WORLD_BACKGROUND',
    textureKind: 'field',
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
    color: 0x88ccff,
    opacity: 0.72,
    size: 2.0,
    sizeAttenuation: true,
  },
  /** World personality shimmer — mood overlay clouds */
  shimmer: {
    layerKey: 'WORLD_OVERLAY',
    textureKind: 'shimmer',
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
    color: 0xaaddff,
    opacity: 0.55,
    size: 1.6,
    sizeAttenuation: true,
  },
  /** Environmental hazard / haze dust */
  dust: {
    layerKey: 'WORLD_BACKGROUND',
    textureKind: 'dust',
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
    color: 0xddaa66,
    opacity: 0.60,
    size: 1.4,
    sizeAttenuation: true,
  },
  /** Consciousness aura / ritual witness cloud */
  aura: {
    layerKey: 'WORLD_OVERLAY',
    textureKind: 'aura',
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
    color: 0x66ffdd,
    opacity: 0.46,
    size: 0.22,
    sizeAttenuation: true,
  },
  /** Quantum / plasma silhouette particles */
  plasma: {
    layerKey: 'WORLD_OVERLAY',
    textureKind: 'plasma',
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
    color: 0x66ddff,
    opacity: 0.68,
    size: 1.8,
    sizeAttenuation: true,
  },
  /** Atmospheric haze, dense mist */
  haze: {
    layerKey: 'WORLD_BACKGROUND',
    textureKind: 'haze',
    blending: THREE.NormalBlending,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
    color: 0xbbccdd,
    opacity: 0.30,
    size: 3.0,
    sizeAttenuation: true,
  },
  /** Aurora ribbon point cloud */
  aurora: {
    layerKey: 'WORLD_BACKGROUND',
    textureKind: 'aurora',
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    color: 0xffccdd,
    opacity: 0.52,
    size: 1.2,
    sizeAttenuation: true,
  },
};

// ─── Public factory functions ─────────────────────────────────────────────────

export function resolveEnvPointFXPreset(name = 'field', overrides = {}) {
  const preset = ENV_POINT_FX_PRESETS[name] || ENV_POINT_FX_PRESETS.field;
  return {
    ...preset,
    ...overrides,
    color: cloneColor(overrides.color ?? preset.color, preset.color),
  };
}

/**
 * Create a BufferGeometry for an environment point cloud.
 * Adds position by default; provide attributeSchema for extra per-point attributes.
 *
 * @param {number} capacity
 * @param {Object} attributeSchema  e.g. { aSize: { itemSize: 1 }, aAlpha: { itemSize: 1 } }
 */
export function createEnvPointFXGeometry(capacity, attributeSchema = {}) {
  const safeCapacity = Math.max(1, capacity | 0);
  const geometry = new THREE.BufferGeometry();

  const position = new THREE.BufferAttribute(new Float32Array(safeCapacity * 3), 3)
    .setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', position);

  for (const [name, spec] of Object.entries(attributeSchema)) {
    const itemSize = Math.max(1, spec?.itemSize | 0);
    const arrayLength = spec?.arrayLength ?? safeCapacity * itemSize;
    geometry.setAttribute(
      name,
      new THREE.BufferAttribute(new Float32Array(arrayLength), itemSize)
        .setUsage(THREE.DynamicDrawUsage)
    );
  }

  geometry.setDrawRange(0, safeCapacity);
  return geometry;
}

/**
 * Create a PointsMaterial for an environment point cloud.
 * Material is cached and refcounted at the module level when shareMaterial is true.
 *
 * @param {Object} options
 * @param {string} [options.preset='field']
 * @param {THREE.Texture|null} [options.texture]
 * @param {boolean} [options.transparent=true]
 * @param {number} [options.blending]
 * @param {boolean} [options.depthTest]
 * @param {boolean} [options.depthWrite]
 * @param {boolean} [options.toneMapped]
 * @param {boolean} [options.vertexColors=false]
 * @param {number|null} [options.opacity]
 * @param {number|null} [options.size]
 * @param {boolean} [options.sizeAttenuation]
 * @param {boolean} [options.shareMaterial=true]
 * @param {number|THREE.Color|string} [options.color]
 * @param {Object} [options.pointsMaterialOptions]
 */
export function createEnvPointFXMaterial({
  preset = 'field',
  texture = null,
  transparent = true,
  blending = null,
  depthTest = null,
  depthWrite = null,
  toneMapped = null,
  vertexColors = false,
  opacity = null,
  size = null,
  sizeAttenuation = null,
  shareMaterial = true,
  color = null,
  pointsMaterialOptions = {}
} = {}) {
  const resolved = resolveEnvPointFXPreset(preset, {
    ...(color !== null ? { color } : {}),
    ...(opacity !== null ? { opacity } : {}),
    ...(size !== null ? { size } : {}),
    ...(sizeAttenuation !== null ? { sizeAttenuation } : {}),
    ...(blending !== null ? { blending } : {}),
    ...(depthTest !== null ? { depthTest } : {}),
    ...(depthWrite !== null ? { depthWrite } : {}),
    ...(toneMapped !== null ? { toneMapped } : {}),
  });

  const baseTexture = texture || getEnvSpriteTexture(resolved.textureKind);

  const buildMaterial = () => new THREE.PointsMaterial({
    map: baseTexture,
    color: resolved.color,
    size: resolved.size,
    sizeAttenuation: resolved.sizeAttenuation,
    transparent,
    opacity: resolved.opacity,
    blending: resolved.blending,
    depthTest: resolved.depthTest,
    depthWrite: resolved.depthWrite,
    toneMapped: resolved.toneMapped,
    vertexColors,
    alphaTest: 0.02,
    ...pointsMaterialOptions,
  });

  if (!shareMaterial) {
    const material = buildMaterial();
    material.userData = material.userData || {};
    material.userData.isShared = false;
    return material;
  }

  const cacheKey = buildMaterialCacheKey({
    preset,
    texture: baseTexture,
    transparent,
    blending: resolved.blending,
    depthTest: resolved.depthTest,
    depthWrite: resolved.depthWrite,
    toneMapped: resolved.toneMapped,
    vertexColors,
    opacity: resolved.opacity,
    size: resolved.size,
    pointsMaterialOptions,
  });

  return acquireSharedMaterial(cacheKey, buildMaterial);
}

// ─── Class ────────────────────────────────────────────────────────────────────

export class EnvironmentPointFXBase {
  /**
   * @param {THREE.Scene|THREE.Object3D|null} scene
   * @param {Object} [options]
   * @param {string} [options.renderLayer='WORLD_BACKGROUND']
   * @param {string} [options.preset='field']
   * @param {number} [options.capacity=1]
   */
  constructor(scene, options = {}) {
    this.scene = scene || null;
    this._createdObjects = []; // UNIFIED CLEANUP CONTRACT
    this.options = {
      renderLayer: options.renderLayer ?? DEFAULT_RENDER_LAYER,
      preset: options.preset ?? 'field',
      capacity: options.capacity ?? 1,
      textureKind: options.textureKind ?? null,
      ...options,
    };
  }

  /** UNIFIED CLEANUP CONTRACT — dispose all tracked objects */
  dispose() {
    for (const obj of this._createdObjects) {
      if (this.scene) this.scene.remove(obj);
      obj.geometry?.dispose?.();
      obj.material?.dispose?.();
    }
    this._createdObjects = [];
  }

  resolvePreset(overrides = {}) {
    return resolveEnvPointFXPreset(this.options.preset, {
      ...overrides,
      ...(this.options.textureKind ? { textureKind: this.options.textureKind } : {}),
    });
  }

  createGeometry(attributeSchema = {}) {
    return createEnvPointFXGeometry(this.options.capacity, attributeSchema);
  }

  createMaterial(materialOptions = {}) {
    return createEnvPointFXMaterial({
      preset: this.options.preset,
      ...materialOptions,
      texture: materialOptions.texture
        ?? (this.options.textureKind ? getEnvSpriteTexture(this.options.textureKind) : null),
    });
  }

  /**
   * Create a fully wired point cloud and register it for cleanup.
   *
   * @param {Object} [options]
   * @param {number}  [options.count]           particle count (overrides capacity)
   * @param {string}  [options.preset]          preset name
   * @param {string}  [options.textureKind]     texture kind override
   * @param {Object}  [options.attributeSchema] extra BufferAttributes
   * @param {Object}  [options.materialOptions] createEnvPointFXMaterial options
   * @param {number}  [options.renderOrder]     explicit renderOrder override
   * @param {Object}  [options.userData]        userData to merge into the Points object
   * @param {boolean} [options.addToScene=false] if true, add directly to this.scene
   *
   * @returns {{ points: THREE.Points, geometry: THREE.BufferGeometry, material: THREE.PointsMaterial }}
   */
  createEnvironmentPointCloud({
    count = this.options.capacity,
    preset = this.options.preset,
    textureKind = this.options.textureKind,
    attributeSchema = {},
    materialOptions = {},
    renderOrder = null,
    userData = {},
    addToScene = false,
  } = {}) {
    const geometry = createEnvPointFXGeometry(count, attributeSchema);
    const material = createEnvPointFXMaterial({
      preset,
      ...materialOptions,
      texture: materialOptions.texture ?? (textureKind ? getEnvSpriteTexture(textureKind) : null),
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.visible = true;

    const resolved = resolveEnvPointFXPreset(preset);
    const layerKey = materialOptions.layerKey ?? resolved.layerKey;
    const defaultOrder = VisualHierarchyRegistry?.WORLD_LAYER_ORDER?.[layerKey] ?? 400;
    points.renderOrder = renderOrder ?? defaultOrder;

    Object.assign(points.userData || (points.userData = {}), {
      envPointFXPreset: preset,
      envPointFXLayer: layerKey,
      ...userData,
    });

    if (addToScene && this.scene) {
      this.scene.add(points);
    }
    this._createdObjects.push(points); // UNIFIED CLEANUP CONTRACT

    return { points, geometry, material };
  }

  /**
   * Dispose a single point cloud (removes from parent, disposes geo+mat).
   * Also removes it from the tracked _createdObjects list.
   */
  disposePointCloud(pointCloud) {
    const points = pointCloud?.points || pointCloud || null;
    if (!points) return;
    points.parent?.remove(points);
    points.geometry?.dispose?.();
    points.material?.dispose?.();
    const idx = this._createdObjects.indexOf(points);
    if (idx !== -1) this._createdObjects.splice(idx, 1);
  }

  /**
   * Convenience: ensure an Object3D is added to scene and tracked.
   */
  ensureAttached(object3d) {
    if (!object3d || !this.scene) return object3d;
    if (object3d.parent !== this.scene) {
      this.scene.add(object3d);
      this._createdObjects.push(object3d);
    }
    return object3d;
  }

  setVisible(object3d, visible = true) {
    if (object3d) object3d.visible = !!visible;
    return object3d;
  }
}

// ─── Named exports for direct (non-class) usage ───────────────────────────────

export { getEnvSpriteTexture };
export default EnvironmentPointFXBase;
