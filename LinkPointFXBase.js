import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { applyLinkRenderLayer } from './LinkRenderLayerPolicy.js';

const DEFAULT_RENDER_LAYER = 'LINK_PARTICLES';

const cloneColor = (value, fallback = 0xffffff) => {
  if (value instanceof THREE.Color) return value.clone();
  if (typeof value === 'number' || typeof value === 'string') return new THREE.Color(value);
  return new THREE.Color(fallback);
};

const makeSpriteTexture = (kind = 'ember') => {
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
  return texture;
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
  opacity = null
} = {}) {
  const resolved = resolveLinkPointFXPreset(preset);
  const baseTexture = texture || makeSpriteTexture(resolved.textureKind);
  const materialUniforms = {
    uMap: { value: baseTexture },
    uOpacity: { value: opacity ?? resolved.opacity },
    uSizeScale: { value: resolved.sizeScale },
    uBaseColor: { value: resolved.baseColor.clone() },
    uEdgeColor: { value: resolved.edgeColor.clone() },
    ...uniforms
  };

  if (vertexShader || fragmentShader) {
    return new THREE.ShaderMaterial({
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
      transparent,
      blending: blending ?? resolved.blending,
      depthTest: depthTest ?? resolved.depthTest,
      depthWrite: depthWrite ?? resolved.depthWrite,
      toneMapped: toneMapped ?? resolved.toneMapped,
      vertexColors
    });
  }

  return new THREE.PointsMaterial({
    map: baseTexture,
    transparent,
    blending: blending ?? resolved.blending,
    depthTest: depthTest ?? resolved.depthTest,
    depthWrite: depthWrite ?? resolved.depthWrite,
    toneMapped: toneMapped ?? resolved.toneMapped,
    vertexColors,
    opacity: opacity ?? resolved.opacity,
    size: resolved.sizeRange[0],
    sizeAttenuation: true,
    color: resolved.baseColor
  });
}

export class LinkPointFXBase {
  constructor(scene, options = {}) {
    this.scene = scene || null;
    this.options = {
      renderLayer: options.renderLayer ?? DEFAULT_RENDER_LAYER,
      preset: options.preset ?? 'spark',
      capacity: options.capacity ?? 1,
      textureKind: options.textureKind ?? null,
      ...options
    };
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
      ...materialOptions,
      texture: materialOptions.texture ?? (this.options.textureKind ? makeSpriteTexture(this.options.textureKind) : null)
    });
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
      texture: materialOptions.texture ?? (textureKind ? makeSpriteTexture(textureKind) : null),
      ...materialOptions
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.visible = true;
    points.renderOrder = VisualHierarchyRegistry?.getRenderOrder
      ? VisualHierarchyRegistry.getRenderOrder(this.options.renderLayer)
      : 0;
    applyLinkRenderLayer(points, this.options.renderLayer);
    Object.assign(points.userData || (points.userData = {}), userData);
    if (this.scene) {
      this.scene.add(points);
    }
    return { points, geometry, material };
  }

  ensureAttached(object3d) {
    if (!object3d || !this.scene) return object3d;
    if (object3d.parent !== this.scene) {
      this.scene.add(object3d);
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
