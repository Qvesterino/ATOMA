import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { applyLinkRenderLayer, getLinkDistancePolicy } from './LinkRenderLayerPolicy.js';

const DEFAULT_RENDER_LAYER = 'LINK_PARTICLES';
const LINK_POINT_FX_TEXTURE_CACHE = new Map();
const LINK_POINT_FX_MATERIAL_CACHE = new Map();

const cloneColor = (value, fallback = 0xffffff) => {
  if (value instanceof THREE.Color) return value.clone();
  if (typeof value === 'number' || typeof value === 'string') return new THREE.Color(value);
  return new THREE.Color(fallback);
};

const hashString = (input = '') => {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};

const serializeMaterialValue = (value) => {
  const raw = value?.value !== undefined ? value.value : value;
  if (raw === null || raw === undefined) return String(raw);
  if (raw instanceof THREE.Color) return `color:${raw.getHexString()}`;
  if (raw instanceof THREE.Vector2) return `vec2:${raw.x},${raw.y}`;
  if (raw instanceof THREE.Vector3) return `vec3:${raw.x},${raw.y},${raw.z}`;
  if (raw instanceof THREE.Vector4) return `vec4:${raw.x},${raw.y},${raw.z},${raw.w}`;
  if (raw.isTexture) return `texture:${raw.uuid}`;
  if (Array.isArray(raw)) return `array:[${raw.map(serializeMaterialValue).join(',')}]`;
  if (typeof raw === 'number' || typeof raw === 'boolean' || typeof raw === 'bigint') return `${typeof raw}:${raw}`;
  if (typeof raw === 'string') return `string:${raw}`;
  if (typeof raw.toArray === 'function') {
    try {
      return `${raw.constructor?.name || 'object'}:${raw.toArray().join(',')}`;
    } catch {
      return `${raw.constructor?.name || 'object'}`;
    }
  }
  return `${raw.constructor?.name || typeof raw}:${String(raw)}`;
};

const buildUniformSignature = (uniforms = {}) => {
  const keys = Object.keys(uniforms).sort();
  if (keys.length === 0) return '';
  return keys.map((key) => `${key}=${serializeMaterialValue(uniforms[key])}`).join('|');
};

const getSpriteTexture = (kind = 'ember') => {
  const cacheKey = kind || 'ember';
  if (LINK_POINT_FX_TEXTURE_CACHE.has(cacheKey)) {
    return LINK_POINT_FX_TEXTURE_CACHE.get(cacheKey);
  }

  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, 64, 64);
  const cx = 32;
  const cy = 32;
  const gradient = ctx.createRadialGradient(cx, cy, 2, cx, cy, 32);

  if (kind === 'healing') {
    gradient.addColorStop(0.0, 'rgba(255,255,255,1.0)');
    gradient.addColorStop(0.18, 'rgba(120,255,200,0.95)');
    gradient.addColorStop(0.42, 'rgba(60,255,170,0.70)');
    gradient.addColorStop(1.0, 'rgba(0,0,0,0)');
  } else if (kind === 'spark') {
    gradient.addColorStop(0.0, 'rgba(255,255,255,1.0)');
    gradient.addColorStop(0.16, 'rgba(255,220,120,0.95)');
    gradient.addColorStop(0.45, 'rgba(255,120,40,0.65)');
    gradient.addColorStop(1.0, 'rgba(0,0,0,0)');
  } else if (kind === 'cascade') {
    gradient.addColorStop(0.0, 'rgba(255,255,255,1.0)');
    gradient.addColorStop(0.20, 'rgba(120,200,255,0.92)');
    gradient.addColorStop(0.52, 'rgba(60,120,255,0.62)');
    gradient.addColorStop(1.0, 'rgba(0,0,0,0)');
  } else if (kind === 'corruptionDust' || kind === 'dustGlyph') {
    gradient.addColorStop(0.0, 'rgba(255,255,255,1.0)');
    gradient.addColorStop(0.18, 'rgba(255,248,235,0.98)');
    gradient.addColorStop(0.48, 'rgba(255,155,72,0.96)');
    gradient.addColorStop(0.80, 'rgba(255,110,42,0.48)');
    gradient.addColorStop(1.0, 'rgba(0,0,0,0)');
  } else {
    gradient.addColorStop(0.0, 'rgba(255,255,255,1.0)');
    gradient.addColorStop(0.18, 'rgba(255,120,48,0.95)');
    gradient.addColorStop(0.42, 'rgba(177,26,45,0.72)');
    gradient.addColorStop(1.0, 'rgba(0,0,0,0)');
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.userData = texture.userData || {};
  texture.userData.isShared = true;
  texture.userData.linkPointFXTextureKind = cacheKey;
  LINK_POINT_FX_TEXTURE_CACHE.set(cacheKey, texture);
  return texture;
};

const buildMaterialCacheKey = ({
  preset = 'spark',
  texture = null,
  uniforms = {},
  vertexShader = null,
  fragmentShader = null,
  transparent = true,
  blending = null,
  depthTest = null,
  depthWrite = null,
  toneMapped = null,
  vertexColors = true,
  opacity = null,
  pointsMaterialOptions = {}
} = {}) => {
  const shaderSignature = `${vertexShader ? hashString(vertexShader) : 'default-vs'}:${fragmentShader ? hashString(fragmentShader) : 'default-fs'}`;
  const textureSignature = texture?.userData?.linkPointFXTextureKind
    || texture?.uuid
    || 'no-texture';
  const uniformSignature = buildUniformSignature(uniforms);
  return hashString([
    `preset=${preset}`,
    `texture=${textureSignature}`,
    `shader=${shaderSignature}`,
    `transparent=${transparent}`,
    `blending=${blending ?? 'null'}`,
    `depthTest=${depthTest ?? 'null'}`,
    `depthWrite=${depthWrite ?? 'null'}`,
    `toneMapped=${toneMapped ?? 'null'}`,
    `vertexColors=${vertexColors}`,
    `opacity=${opacity ?? 'null'}`,
    `pointsMaterialOptions=${buildUniformSignature(pointsMaterialOptions)}`,
    `uniforms=${uniformSignature}`
  ].join('|'));
};

const acquireSharedMaterial = (cacheKey, materialFactory) => {
  const existing = LINK_POINT_FX_MATERIAL_CACHE.get(cacheKey);
  if (existing) {
    existing.refCount += 1;
    existing.material.userData.__linkPointFXRefCount = existing.refCount;
    return existing.material;
  }

  const material = materialFactory();
  const originalDispose = typeof material.dispose === 'function' ? material.dispose.bind(material) : null;
  material.userData = material.userData || {};
  material.userData.isShared = true;
  material.userData.__linkPointFXCacheKey = cacheKey;
  material.userData.__linkPointFXRefCount = 1;
  material.userData.__linkPointFXDisposed = false;
  material.userData.__linkPointFXOriginalDispose = originalDispose;
  material.dispose = () => {
    const entry = LINK_POINT_FX_MATERIAL_CACHE.get(cacheKey);
    if (!entry || entry.material !== material) {
      if (!material.userData.__linkPointFXDisposed) {
        material.userData.__linkPointFXDisposed = true;
        originalDispose?.();
      }
      return;
    }

    entry.refCount -= 1;
    material.userData.__linkPointFXRefCount = entry.refCount;
    if (entry.refCount <= 0) {
      LINK_POINT_FX_MATERIAL_CACHE.delete(cacheKey);
      material.userData.__linkPointFXDisposed = true;
      originalDispose?.();
    }
  };

  LINK_POINT_FX_MATERIAL_CACHE.set(cacheKey, { material, refCount: 1, originalDispose });
  return material;
};

export const LINK_POINT_FX_PRESETS = {
  corruption: {
    layerKey: DEFAULT_RENDER_LAYER,
    textureKind: 'ember',
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
    baseColor: 0x9e1122,
    edgeColor: 0xff4a1d,
    opacity: 0.88,
    sizeRange: [2.0, 5.6],
    sizeScale: 144.0,
    distanceFade: [0.30, 0.60],
    minAlpha: 0.04,
    maxAlpha: 1.0
  },
  healing: {
    layerKey: DEFAULT_RENDER_LAYER,
    textureKind: 'healing',
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
    baseColor: 0x39ff14,
    edgeColor: 0x8bffd7,
    opacity: 0.96,
    sizeRange: [4.0, 10.0],
    sizeScale: 1.0,
    distanceFade: [0.30, 0.60],
    minAlpha: 0.04,
    maxAlpha: 1.0
  },
  spark: {
    layerKey: DEFAULT_RENDER_LAYER,
    textureKind: 'spark',
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
    baseColor: 0xffaa00,
    edgeColor: 0xffffff,
    opacity: 0.92,
    sizeRange: [1.2, 3.4],
    sizeScale: 1.0,
    distanceFade: [0.28, 0.55],
    minAlpha: 0.05,
    maxAlpha: 1.0
  },
  cascade: {
    layerKey: 'LINK_CASCADE',
    textureKind: 'cascade',
    blending: THREE.NormalBlending,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    baseColor: 0x66d9ff,
    edgeColor: 0xffffff,
    opacity: 0.78,
    sizeRange: [1.0, 20.0],
    sizeScale: 1.0,
    distanceFade: [0.24, 0.60],
    minAlpha: 0.03,
    maxAlpha: 1.0
  }
};

export function resolveLinkPointFXPreset(name = 'spark', overrides = {}) {
  const preset = LINK_POINT_FX_PRESETS[name] || LINK_POINT_FX_PRESETS.spark;
  return {
    ...preset,
    ...overrides,
    sizeRange: Array.isArray(overrides.sizeRange) ? overrides.sizeRange.slice(0, 2) : preset.sizeRange.slice(0, 2),
    distanceFade: Array.isArray(overrides.distanceFade) ? overrides.distanceFade.slice(0, 2) : preset.distanceFade.slice(0, 2),
    baseColor: cloneColor(overrides.baseColor ?? preset.baseColor, preset.baseColor),
    edgeColor: cloneColor(overrides.edgeColor ?? preset.edgeColor, preset.edgeColor)
  };
}

export function createLinkPointFXGeometry(capacity, attributeSchema = {}) {
  const safeCapacity = Math.max(1, capacity | 0);
  const geometry = new THREE.BufferGeometry();

  const position = new THREE.BufferAttribute(new Float32Array(safeCapacity * 3), 3).setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', position);

  for (const [name, spec] of Object.entries(attributeSchema)) {
    const itemSize = Math.max(1, spec?.itemSize | 0);
    const arrayLength = spec?.arrayLength ?? safeCapacity * itemSize;
    const array = new Float32Array(arrayLength);
    geometry.setAttribute(name, new THREE.BufferAttribute(array, itemSize).setUsage(THREE.DynamicDrawUsage));
  }

  geometry.setDrawRange(0, safeCapacity);
  return geometry;
}

export function createLinkPointFXMaterial({
  preset = 'spark',
  texture = null,
  uniforms = {},
  vertexShader = null,
  fragmentShader = null,
  transparent = true,
  blending = null,
  depthTest = null,
  depthWrite = null,
  toneMapped = null,
  vertexColors = true,
  opacity = null,
  shareMaterial = null,
  pointsMaterialOptions = {}
} = {}) {
  const resolved = resolveLinkPointFXPreset(preset);
  const baseTexture = texture || getSpriteTexture(resolved.textureKind);
  const shouldShare = shareMaterial ?? !(vertexShader || fragmentShader);
  const materialUniforms = {
    uMap: { value: baseTexture },
    uOpacity: { value: opacity ?? resolved.opacity },
    uSizeScale: { value: resolved.sizeScale },
    uBaseColor: { value: resolved.baseColor.clone() },
    uEdgeColor: { value: resolved.edgeColor.clone() },
    ...uniforms
  };

  const materialOptions = {
    transparent,
    blending: blending ?? resolved.blending,
    depthTest: depthTest ?? resolved.depthTest,
    depthWrite: depthWrite ?? resolved.depthWrite,
    toneMapped: toneMapped ?? resolved.toneMapped,
    vertexColors,
    opacity: opacity ?? resolved.opacity
  };
  const pointsMaterialOverrides = { ...pointsMaterialOptions };
  const shaderMaterialOptions = { ...materialOptions };
  const pointsMaterialDefaults = { ...materialOptions };

  const buildMaterial = () => {
    if (vertexShader || fragmentShader) {
      const material = new THREE.ShaderMaterial({
        uniforms: materialUniforms,
        vertexShader: vertexShader || `
          attribute float aSize;
          attribute vec3 aColor;
          attribute float aAlpha;
          varying vec3 vColor;
          varying float vAlpha;
          uniform float uSizeScale;
          void main() {
            vColor = aColor;
            vAlpha = aAlpha;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            float distScale = max(0.45, -mvPosition.z);
            gl_PointSize = aSize * uSizeScale / distScale;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: fragmentShader || `
          uniform sampler2D uMap;
          uniform float uOpacity;
          uniform vec3 uBaseColor;
          uniform vec3 uEdgeColor;
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            vec4 tex = texture2D(uMap, gl_PointCoord);
            float alpha = tex.a * vAlpha * uOpacity;
            if (alpha < 0.01) discard;
            vec3 color = mix(uBaseColor, uEdgeColor, 0.35) * vColor * tex.rgb;
            gl_FragColor = vec4(color, alpha);
          }
        `,
        ...shaderMaterialOptions
      });
      if (!material.userData) material.userData = {};
      if (!material.userData.__linkPointFXProgramCacheKeyBound) {
        const shaderSignature = `${vertexShader ? hashString(vertexShader) : 'default-vs'}:${fragmentShader ? hashString(fragmentShader) : 'default-fs'}`;
        const cacheSignature = [
          'ATOMA_LINK_POINT_FX_v1',
          `preset=${preset}`,
          `shader=${shaderSignature}`,
          `transparent=${material.transparent === true ? 'true' : 'false'}`,
          `blending=${material.blending ?? 'null'}`,
          `depthTest=${material.depthTest === true ? 'true' : 'false'}`,
          `depthWrite=${material.depthWrite === true ? 'true' : 'false'}`,
          `toneMapped=${material.toneMapped === true ? 'true' : 'false'}`,
          `vertexColors=${material.vertexColors === true ? 'true' : 'false'}`
        ].join('|');
        material.customProgramCacheKey = () => cacheSignature;
        material.userData.__linkPointFXProgramCacheKeyBound = true;
      }
      return material;
    }

    return new THREE.PointsMaterial({
      map: baseTexture,
      ...pointsMaterialDefaults,
      ...pointsMaterialOverrides,
      size: resolved.sizeRange[0],
      sizeAttenuation: true,
      color: resolved.baseColor
    });
  };

  if (!shouldShare) {
    const material = buildMaterial();
    material.userData = material.userData || {};
    material.userData.isShared = false;
    return material;
  }

  const cacheKey = buildMaterialCacheKey({
    preset,
    texture: baseTexture,
    uniforms: materialUniforms,
    vertexShader,
    fragmentShader,
    pointsMaterialOptions,
    ...materialOptions
  });

  return acquireSharedMaterial(cacheKey, buildMaterial);
}

export class LinkPointFXBase {
  constructor(scene, options = {}) {
    this.scene = scene || null;
    this._createdObjects = [];  // UNIFIED CLEANUP CONTRACT
    this.options = {
      renderLayer: options.renderLayer ?? DEFAULT_RENDER_LAYER,
      preset: options.preset ?? 'spark',
      capacity: options.capacity ?? 1,
      textureKind: options.textureKind ?? null,
      ...options
    };
  }
  
  /**
   * UNIFIED CLEANUP CONTRACT - Dispose all resources
   */
  dispose() {
    // Remove and dispose all created objects
    this._createdObjects.forEach(obj => {
      if (this.scene) this.scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
    this._createdObjects = [];
  }

  resolvePreset(overrides = {}) {
    return resolveLinkPointFXPreset(this.options.preset, {
      ...overrides,
      textureKind: overrides.textureKind ?? this.options.textureKind
    });
  }

  createGeometry(attributeSchema = {}) {
    return createLinkPointFXGeometry(this.options.capacity, attributeSchema);
  }

  createMaterial(materialOptions = {}) {
    return createLinkPointFXMaterial({
      preset: this.options.preset,
      shareMaterial: materialOptions.shareMaterial ?? !(materialOptions.vertexShader || materialOptions.fragmentShader),
      ...materialOptions,
      texture: materialOptions.texture ?? (this.options.textureKind ? getSpriteTexture(this.options.textureKind) : null)
    });
  }

  getDistanceLODProfile(lodLevel = 0) {
    return getLinkDistancePolicy(lodLevel);
  }

  createPointCloud({
    capacity = this.options.capacity,
    preset = this.options.preset,
    textureKind = this.options.textureKind,
    attributeSchema = {},
    materialOptions = {},
    userData = {}
  } = {}) {
    const geometry = createLinkPointFXGeometry(capacity, attributeSchema);
    const material = createLinkPointFXMaterial({
      preset,
      shareMaterial: materialOptions.shareMaterial ?? !(materialOptions.vertexShader || materialOptions.fragmentShader),
      texture: materialOptions.texture ?? (textureKind ? getSpriteTexture(textureKind) : null),
      ...materialOptions
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.visible = true;
    points.matrixAutoUpdate = false;
    points.updateMatrix();
    points.renderOrder = VisualHierarchyRegistry?.getRenderOrder
      ? VisualHierarchyRegistry.getRenderOrder(this.options.renderLayer)
      : 0;
    applyLinkRenderLayer(points, this.options.renderLayer);
    Object.assign(points.userData || (points.userData = {}), userData);
    if (this.scene) {
      this.scene.add(points);
      this._createdObjects.push(points);  // UNIFIED CLEANUP CONTRACT
    }
    return { points, geometry, material };
  }

  ensureAttached(object3d) {
    if (!object3d || !this.scene) return object3d;
    if (object3d.parent !== this.scene) {
      this.scene.add(object3d);
      // UNIFIED CLEANUP CONTRACT
      this._createdObjects.push(object3d);
    }
    return object3d;
  }

  setVisible(object3d, visible = true) {
    if (object3d) {
      object3d.visible = !!visible;
    }
    return object3d;
  }

  disposePointCloud(pointCloud) {
    const points = pointCloud?.points || pointCloud || null;
    if (!points) return;
    points.parent?.remove(points);
    points.geometry?.dispose?.();
    points.material?.dispose?.();
  }
}

export default LinkPointFXBase;
