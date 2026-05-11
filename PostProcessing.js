import * as THREE from 'three';
import { checkLateMaterialCreation } from './src/metrics/MaterialDebugGuard_v1.js';

function getRendererBufferSize(renderer) {
  const domElement = renderer?.domElement;
  const domWidth = Math.max(1, Math.floor(domElement?.width || 0));
  const domHeight = Math.max(1, Math.floor(domElement?.height || 0));
  if (domWidth > 1 && domHeight > 1) {
    return { width: domWidth, height: domHeight };
  }

  if (renderer?.getDrawingBufferSize) {
    const size = new THREE.Vector2();
    renderer.getDrawingBufferSize(size);
    const bufferWidth = Math.max(1, Math.floor(size.x || 0));
    const bufferHeight = Math.max(1, Math.floor(size.y || 0));
    if (bufferWidth > 1 && bufferHeight > 1) {
      return { width: bufferWidth, height: bufferHeight };
    }
  }

  return {
    width: Math.max(1, Math.floor(domElement?.clientWidth || 1)),
    height: Math.max(1, Math.floor(domElement?.clientHeight || 1))
  };
}

/**
 * Post-Processing Bloom Pass
 * Enhanced glow effects for neon visuals
 * Uses luminosity-based bloom with blur passes
 */
export class BloomPass {
  constructor(renderer, scene, camera, options = {}) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.renderTargetSamples = renderer?.capabilities?.isWebGL2
      ? Math.max(0, Math.min(4, renderer?.capabilities?.maxSamples ?? 4))
      : 0;

    // Configuration
    this.options = {
      strength: options.strength ?? 1.06,
      radius: options.radius ?? 0.42,
      threshold: options.threshold ?? 0.84,
      scale: options.scale ?? 6,
      exposure: options.exposure ?? 1.08,
      vignetteStrength: options.vignetteStrength ?? 0.19,
      tintStrength: options.tintStrength ?? 0.035,
      chromaticStrength: options.chromaticStrength ?? 0.00045,
      grainStrength: options.grainStrength ?? 0.0045,
      contrast: options.contrast ?? 1.12,
      saturation: options.saturation ?? 0.98,
      lift: options.lift ?? 0.006,
      gamma: options.gamma ?? 0.99,
      gain: options.gain ?? 1.03,
      hazeStrength: options.hazeStrength ?? 0.065,
      hazeColor: options.hazeColor ?? 0x8ecfff,
      anamorphicStrength: options.anamorphicStrength ?? 0.18,
      anamorphicSpread: options.anamorphicSpread ?? 0.72,
      bloomGhostStrength: options.bloomGhostStrength ?? 0.08,
      bloomDirtStrength: options.bloomDirtStrength ?? 0.055,
      lightWrapStrength: options.lightWrapStrength ?? 0.12,
      warmLiftStrength: options.warmLiftStrength ?? 0.08,
      cyanShadowStrength: options.cyanShadowStrength ?? 0.06,
      corruptionSplitStrength: options.corruptionSplitStrength ?? 0.00035,
      bloomLayerIndex: options.bloomLayerIndex ?? 1,
      bloomLayerRefreshInterval: options.bloomLayerRefreshInterval ?? 12,
      selectiveBloomEnabled: options.selectiveBloomEnabled ?? true,
      ...options
    };

    this.baseScale = this.options.scale;
    this.sceneMetrics = null;
    this._frameCounter = 0;
    this._bloomLayerRefreshFrame = 0;
    this._bloomLayerRefreshInterval = Math.max(1, Math.round(this.options.bloomLayerRefreshInterval || 12));
    this._pendingBloomCameraLayerMask = null;
    this._selectiveBloomStats = { candidates: 0, tagged: 0, refreshedAt: 0 };
    this._selectiveBloomRefreshRequested = true;
    this._selectiveBloomRefreshReason = 'constructor';
    this._lastSelectiveBloomScene = null;
    this._smoothedAdaptive = {
      synergy: 0.5,
      harmony: 0.5,
      corruption: 0.1,
      stability: 0.5,
      loadPressure: 0.15,
      luminanceHint: 0.5
    };
    this._adaptiveHazeColor = new THREE.Color(this.options.hazeColor);
    this._adaptiveTintColor = new THREE.Color(0xffffff);

    // Scene size
    const initialSize = getRendererBufferSize(renderer);
    this.width = initialSize.width;
    this.height = initialSize.height;

    // Create render targets
    this.createRenderTargets();
    
    // Create materials
    this.materials = {};
    this.createMaterials();

    // Planes for effects
    this.scene_scene = new THREE.Scene();
    this.createEffectPlanes();

    // Store original state
    this.originalClearColor = new THREE.Color();
    this.renderer.getClearColor(this.originalClearColor);

    this._applyAdaptiveState(this.sceneMetrics || this._readLiveMetrics());
  }

  _clamp01(value, fallback = 0) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return THREE.MathUtils.clamp(numeric, 0, 1);
  }

  _normalizeMetric(value, fallback = 0) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    const normalized = Math.abs(numeric) > 1 ? numeric / 100 : numeric;
    return THREE.MathUtils.clamp(normalized, 0, 1);
  }

  _readLiveMetrics() {
    if (typeof window === 'undefined') return {};
    return window.__ATOMA_LIVE_METRICS__ || {};
  }

  _getBloomLayerIndex() {
    return Number.isInteger(this.options.bloomLayerIndex) ? this.options.bloomLayerIndex : 1;
  }

  _resolveMaterialList(material) {
    if (!material) return [];
    return Array.isArray(material) ? material.filter(Boolean) : [material];
  }

  _isBloomCandidate(object) {
    if (!object || object.visible === false) return false;

    const data = object.userData || {};
    if (
      data.bloomLayer === true ||
      data.bloom === true ||
      data.selectiveBloom === true ||
      data.isVFX === true ||
      data.isSelectionGlow === true ||
      data.isSelectionGlowHalo === true ||
      data.isSelectionGlowPortal === true ||
      data.isSelectionGlowSparkles === true ||
      data.isSemanticParticle === true ||
      data.isNodeCore === true ||
      data.isNodeRoot === true ||
      data.isNode === true ||
      data.isLinkFX === true ||
      data.isAura === true ||
      data.isHighlight === true ||
      data.linkVisual === true ||
      data.nodeVisual === true ||
      data.glowLayer ||
      data.vfxType
    ) {
      return true;
    }

    const name = String(object.name || '').toLowerCase();
    if (/(glow|halo|pulse|ring|flare|aura|bloom|spark|trail|beam|crown|shell|rim|core|emissive)/.test(name)) {
      return true;
    }

    const materials = this._resolveMaterialList(object.material);
    for (const material of materials) {
      if (!material) continue;

      const emissiveIntensity = Number.isFinite(material.emissiveIntensity) ? material.emissiveIntensity : 0;
      if (emissiveIntensity >= 0.18) return true;

      if (material.emissive?.isColor) {
        const emissiveLuma =
          (material.emissive.r * 0.299) +
          (material.emissive.g * 0.587) +
          (material.emissive.b * 0.114);
        if (emissiveLuma > 0.2 && emissiveIntensity > 0.05) return true;
      }

      if (material.transparent === true && Number.isFinite(material.opacity) && material.opacity < 0.9) {
        if (material.blending === THREE.AdditiveBlending || material.opacity <= 0.65) return true;
      }
    }

    return false;
  }

  _markBloomLayerRecursive(object) {
    if (!object) return;
    const bloomLayerIndex = this._getBloomLayerIndex();
    const apply = (item) => {
      if (!item?.layers) return;
      item.layers.enable(bloomLayerIndex);
      item.userData = item.userData || {};
      item.userData.__atomaBloomTagged = true;
      item.userData.__atomaBloomTaggedLayer = bloomLayerIndex;
    };

    apply(object);

    if (typeof object.traverse === 'function') {
      object.traverse((child) => {
        if (child !== object) {
          apply(child);
        }
      });
    }
  }

  _refreshSelectiveBloomTargets(force = false) {
    if (!this.options.selectiveBloomEnabled || !this.scene) return;

    this._bloomLayerRefreshFrame += 1;
    const shouldTraverse =
      force ||
      this._selectiveBloomRefreshRequested ||
      (this._bloomLayerRefreshFrame % this._bloomLayerRefreshInterval === 0);
    if (!shouldTraverse) {
      return;
    }

    this._selectiveBloomRefreshRequested = false;

    let candidates = 0;
    let tagged = 0;
    this.scene.traverseVisible((object) => {
      if (!this._isBloomCandidate(object)) return;
      candidates += 1;
      if (object.userData?.__atomaBloomTagged && object.userData?.__atomaBloomTaggedLayer === this._getBloomLayerIndex()) return;
      this._markBloomLayerRecursive(object);
      tagged += 1;
    });

    this._selectiveBloomStats = {
      candidates,
      tagged,
      refreshedAt: typeof performance !== 'undefined' ? performance.now() : Date.now()
    };
  }

  requestSelectiveBloomRefresh(reason = 'manual') {
    this._selectiveBloomRefreshRequested = true;
    this._selectiveBloomRefreshReason = reason;
    this._selectiveBloomStats.refreshedAt = 0;
  }

  _saveCameraLayerMask(camera) {
    return camera?.layers?.mask ?? null;
  }

  _restoreCameraLayerMask(camera, mask) {
    if (!camera?.layers || !Number.isInteger(mask)) return;
    camera.layers.mask = mask;
  }

  restorePendingCameraLayerMask(camera = this.camera) {
    const pendingMask = this._pendingBloomCameraLayerMask;
    if (!Number.isInteger(pendingMask)) return false;
    this._restoreCameraLayerMask(camera, pendingMask);
    this._pendingBloomCameraLayerMask = null;
    return true;
  }

  markBloomTarget(object, recursive = true) {
    if (!object) return;
    object.userData = object.userData || {};
    object.userData.bloomLayer = true;
    this.requestSelectiveBloomRefresh('markBloomTarget');
    if (recursive) {
      this._markBloomLayerRecursive(object);
    } else if (object.layers) {
      object.layers.enable(this._getBloomLayerIndex());
      object.userData.__atomaBloomTagged = true;
      object.userData.__atomaBloomTaggedLayer = this._getBloomLayerIndex();
    }
  }

  _resizeBloomTargets() {
    if (!this.renderTargets) return;

    const width = Math.max(1, Math.floor(this.width / this.options.scale));
    const height = Math.max(1, Math.floor(this.height / this.options.scale));

    this.renderTargets.luminosity?.setSize(width, height);
    this.renderTargets.selectiveBloom?.setSize(width, height);
    this.renderTargets.blurred?.[0]?.setSize(width, height);
    this.renderTargets.blurred?.[1]?.setSize(width, height);
  }

  _setDownsampleScale(scale) {
    const nextScale = Math.max(2, Math.round(scale || this.baseScale));
    if (this.options.scale === nextScale) return;

    this.options.scale = nextScale;
    this._resizeBloomTargets();
  }

  _resolveAdaptiveState(metrics = {}) {
    const metricsSource = {
      ...this._readLiveMetrics(),
      ...metrics
    };

    const synergy = this._normalizeMetric(
      metricsSource.avgSynergy ?? metricsSource.networkSynergy ?? metricsSource.synergy,
      this._smoothedAdaptive.synergy
    );
    const harmony = this._normalizeMetric(
      metricsSource.avgHarmony ?? metricsSource.harmonyFlow ?? metricsSource.harmony,
      this._smoothedAdaptive.harmony
    );
    const corruption = this._normalizeMetric(
      metricsSource.avgCorruption ?? metricsSource.corruptionLevel ?? metricsSource.corruption,
      this._smoothedAdaptive.corruption
    );
    const stability = this._normalizeMetric(
      metricsSource.avgStability ?? (Number.isFinite(metricsSource.networkStress) ? 1 - metricsSource.networkStress : undefined) ?? metricsSource.stability,
      this._smoothedAdaptive.stability
    );
    const loadPressure = this._normalizeMetric(
      metricsSource.avgLoadPressure ?? metricsSource.loadPressure,
      this._smoothedAdaptive.loadPressure
    );
    const luminanceHint = this._normalizeMetric(
      metricsSource.sceneLuminance ?? metricsSource.avgLuma ?? metricsSource.visualBrightness ?? metricsSource.brightness,
      this._smoothedAdaptive.luminanceHint
    );

    const smoothing = 0.14;
    const smooth = (current, target) => current + (target - current) * smoothing;

    this._smoothedAdaptive.synergy = smooth(this._smoothedAdaptive.synergy, synergy);
    this._smoothedAdaptive.harmony = smooth(this._smoothedAdaptive.harmony, harmony);
    this._smoothedAdaptive.corruption = smooth(this._smoothedAdaptive.corruption, corruption);
    this._smoothedAdaptive.stability = smooth(this._smoothedAdaptive.stability, stability);
    this._smoothedAdaptive.loadPressure = smooth(this._smoothedAdaptive.loadPressure, loadPressure);
    this._smoothedAdaptive.luminanceHint = smooth(this._smoothedAdaptive.luminanceHint, luminanceHint);

    const pressure = THREE.MathUtils.clamp(
      this._smoothedAdaptive.loadPressure * 0.7 + (typeof window !== 'undefined' && Number.isFinite(window.devicePixelRatio) ? Math.min(1, Math.max(0, (window.devicePixelRatio - 1) * 0.35)) : 0),
      0,
      1
    );
    const brightness = this._smoothedAdaptive.luminanceHint;
    const pixelRatio = (typeof window !== 'undefined' && Number.isFinite(window.devicePixelRatio)) ? window.devicePixelRatio : 1;

    let targetScale = this.baseScale;
    if (pressure > 0.7 || pixelRatio > 1.8) {
      targetScale = Math.max(this.baseScale, 16);
    } else if (pressure > 0.45 || pixelRatio > 1.35) {
      targetScale = Math.max(this.baseScale, 12);
    } else if (brightness > 0.78) {
      targetScale = Math.max(8, this.baseScale);
    }

    const strength = THREE.MathUtils.clamp(
      this.options.strength * (0.71 + this._smoothedAdaptive.synergy * 0.14 + this._smoothedAdaptive.harmony * 0.07 - this._smoothedAdaptive.corruption * 0.07),
      0.38,
      1.62
    );
    const threshold = THREE.MathUtils.clamp(
      this.options.threshold + brightness * 0.08 + pressure * 0.05 - this._smoothedAdaptive.synergy * 0.06 - (1 - this._smoothedAdaptive.stability) * 0.02,
      0.18,
      0.97
    );
    const radius = THREE.MathUtils.clamp(
      this.options.radius * (0.84 + this._smoothedAdaptive.synergy * 0.1 + this._smoothedAdaptive.stability * 0.08),
      0.18,
      1.5
    );
    const exposure = THREE.MathUtils.clamp(
      this.options.exposure * (0.88 + this._smoothedAdaptive.synergy * 0.045 + brightness * 0.035 - this._smoothedAdaptive.corruption * 0.035),
      0.72,
      1.58
    );
    const vignetteStrength = THREE.MathUtils.clamp(
      this.options.vignetteStrength + pressure * 0.05 + this._smoothedAdaptive.corruption * 0.05 + (1 - this._smoothedAdaptive.stability) * 0.03,
      0.08,
      0.28
    );
    const tintStrength = THREE.MathUtils.clamp(
      this.options.tintStrength + this._smoothedAdaptive.synergy * 0.035 + this._smoothedAdaptive.corruption * 0.025,
      0,
      0.12
    );
    const chromaticStrength = THREE.MathUtils.clamp(
      this.options.chromaticStrength + this._smoothedAdaptive.corruption * 0.0012 + pressure * 0.0004,
      0,
      0.0035
    );
    const grainStrength = THREE.MathUtils.clamp(
      this.options.grainStrength + this._smoothedAdaptive.corruption * 0.0045 + pressure * 0.0025,
      0,
      0.015
    );
    const contrast = THREE.MathUtils.clamp(
      this.options.contrast + this._smoothedAdaptive.synergy * 0.045 + this._smoothedAdaptive.stability * 0.035 - this._smoothedAdaptive.loadPressure * 0.035 - this._smoothedAdaptive.corruption * 0.025,
      0.95,
      1.3
    );
    const saturation = THREE.MathUtils.clamp(
      this.options.saturation + this._smoothedAdaptive.harmony * 0.05 + this._smoothedAdaptive.synergy * 0.03 - this._smoothedAdaptive.corruption * 0.08,
      0.82,
      1.15
    );
    const lift = THREE.MathUtils.clamp(
      this.options.lift + this._smoothedAdaptive.loadPressure * 0.015 + this._smoothedAdaptive.corruption * 0.012 - (1 - this._smoothedAdaptive.stability) * 0.008,
      -0.03,
      0.03
    );
    const gamma = THREE.MathUtils.clamp(
      this.options.gamma + (1 - brightness) * 0.045 - this._smoothedAdaptive.synergy * 0.02 + this._smoothedAdaptive.corruption * 0.025,
      0.9,
      1.08
    );
    const gain = THREE.MathUtils.clamp(
      this.options.gain + this._smoothedAdaptive.synergy * 0.035 + brightness * 0.03 - this._smoothedAdaptive.loadPressure * 0.02,
      0.96,
      1.12
    );
    const hazeStrength = THREE.MathUtils.clamp(
      this.options.hazeStrength + pressure * 0.034 + this._smoothedAdaptive.corruption * 0.024 + (1 - this._smoothedAdaptive.stability) * 0.026 - this._smoothedAdaptive.synergy * 0.006,
      0,
      0.15
    );
    const warmMetric = THREE.MathUtils.clamp(this._smoothedAdaptive.synergy * 0.55 + this._smoothedAdaptive.harmony * 0.45, 0, 1);
    const pressureMetric = THREE.MathUtils.clamp(this._smoothedAdaptive.corruption * 0.68 + this._smoothedAdaptive.loadPressure * 0.46 + (1 - this._smoothedAdaptive.stability) * 0.24, 0, 1);
    const anamorphicStrength = THREE.MathUtils.clamp(
      this.options.anamorphicStrength + warmMetric * 0.22 + brightness * 0.06 - pressureMetric * 0.035,
      0,
      0.55
    );
    const anamorphicSpread = THREE.MathUtils.clamp(
      this.options.anamorphicSpread + warmMetric * 0.22 + pressureMetric * 0.1,
      0.28,
      1.45
    );
    const bloomGhostStrength = THREE.MathUtils.clamp(
      this.options.bloomGhostStrength + warmMetric * 0.12 + brightness * 0.04,
      0,
      0.32
    );
    const bloomDirtStrength = THREE.MathUtils.clamp(
      this.options.bloomDirtStrength + pressureMetric * 0.06 + brightness * 0.02,
      0,
      0.18
    );
    const lightWrapStrength = THREE.MathUtils.clamp(
      this.options.lightWrapStrength + warmMetric * 0.14 + brightness * 0.05 - pressureMetric * 0.035,
      0,
      0.36
    );
    const warmLiftStrength = THREE.MathUtils.clamp(
      this.options.warmLiftStrength + warmMetric * 0.16 - pressureMetric * 0.035,
      0,
      0.34
    );
    const cyanShadowStrength = THREE.MathUtils.clamp(
      this.options.cyanShadowStrength + this._smoothedAdaptive.stability * 0.045 + this._smoothedAdaptive.harmony * 0.035 + pressureMetric * 0.025,
      0,
      0.26
    );
    const corruptionSplitStrength = THREE.MathUtils.clamp(
      this.options.corruptionSplitStrength + pressureMetric * 0.0024,
      0,
      0.0042
    );

    const hazeColor = this._adaptiveHazeColor.set(this.options.hazeColor);
    hazeColor.r = THREE.MathUtils.clamp(hazeColor.r * (1.0 + this._smoothedAdaptive.corruption * 0.02 - this._smoothedAdaptive.synergy * 0.01), 0, 1.1);
    hazeColor.g = THREE.MathUtils.clamp(hazeColor.g * (1.0 + this._smoothedAdaptive.harmony * 0.025 + this._smoothedAdaptive.stability * 0.015), 0, 1.1);
    hazeColor.b = THREE.MathUtils.clamp(hazeColor.b * (1.0 + this._smoothedAdaptive.synergy * 0.04 + this._smoothedAdaptive.stability * 0.02), 0, 1.15);

    const tintColor = this._adaptiveTintColor.set(0xffffff);
    tintColor.r = THREE.MathUtils.clamp(1.0 + this._smoothedAdaptive.corruption * 0.08 + this._smoothedAdaptive.synergy * 0.035 + this._smoothedAdaptive.harmony * 0.028, 0, 1.12);
    tintColor.g = THREE.MathUtils.clamp(1.0 + this._smoothedAdaptive.harmony * 0.02 - this._smoothedAdaptive.corruption * 0.06, 0, 1.1);
    tintColor.b = THREE.MathUtils.clamp(1.0 + this._smoothedAdaptive.synergy * 0.08 + this._smoothedAdaptive.stability * 0.03 - warmMetric * 0.018, 0, 1.1);

    return {
      scale: targetScale,
      strength,
      threshold,
      radius,
      exposure,
      vignetteStrength,
      tintStrength,
      chromaticStrength,
      grainStrength,
      contrast,
      saturation,
      lift,
      gamma,
      gain,
      hazeStrength,
      hazeColor,
      tintColor,
      anamorphicStrength,
      anamorphicSpread,
      bloomGhostStrength,
      bloomDirtStrength,
      lightWrapStrength,
      warmLiftStrength,
      cyanShadowStrength,
      corruptionSplitStrength
    };
  }

  updateSceneMetrics(metrics = null) {
    this.sceneMetrics = metrics ? { ...metrics } : null;
    return this._applyAdaptiveState(this.sceneMetrics || this._readLiveMetrics());
  }

  _applyAdaptiveState(metrics = null) {
    if (!this.materials?.composite || !this.materials?.luminosity || !this.materials?.blurHorizontal || !this.materials?.blurVertical) {
      return null;
    }

    const state = this._resolveAdaptiveState(metrics || {});
    this._setDownsampleScale(state.scale);

    this.materials.luminosity.uniforms.threshold.value = state.threshold;
    this.materials.blurHorizontal.uniforms.radius.value = state.radius;

    this.materials.composite.uniforms.strength.value = state.strength;
    this.materials.composite.uniforms.exposure.value = state.exposure;
    this.materials.composite.uniforms.vignetteStrength.value = state.vignetteStrength;
    this.materials.composite.uniforms.tintStrength.value = state.tintStrength;
    this.materials.composite.uniforms.chromaticStrength.value = state.chromaticStrength;
    this.materials.composite.uniforms.grainStrength.value = state.grainStrength;
    this.materials.composite.uniforms.contrast.value = state.contrast;
    this.materials.composite.uniforms.saturation.value = state.saturation;
    this.materials.composite.uniforms.lift.value = state.lift;
    this.materials.composite.uniforms.gamma.value = state.gamma;
    this.materials.composite.uniforms.gain.value = state.gain;
    this.materials.composite.uniforms.hazeStrength.value = state.hazeStrength;
    this.materials.composite.uniforms.hazeColor.value.copy(state.hazeColor);
    this.materials.composite.uniforms.tintColor.value.copy(state.tintColor);
    this.materials.composite.uniforms.anamorphicStrength.value = state.anamorphicStrength;
    this.materials.composite.uniforms.anamorphicSpread.value = state.anamorphicSpread;
    this.materials.composite.uniforms.bloomGhostStrength.value = state.bloomGhostStrength;
    this.materials.composite.uniforms.bloomDirtStrength.value = state.bloomDirtStrength;
    this.materials.composite.uniforms.lightWrapStrength.value = state.lightWrapStrength;
    this.materials.composite.uniforms.warmLiftStrength.value = state.warmLiftStrength;
    this.materials.composite.uniforms.cyanShadowStrength.value = state.cyanShadowStrength;
    this.materials.composite.uniforms.corruptionSplitStrength.value = state.corruptionSplitStrength;
    this.materials.composite.uniforms.time.value = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.001;

    return state;
  }

  /**
   * Create render targets
   */
  createRenderTargets() {
    const width = Math.max(1, Math.floor(this.width / this.options.scale));
    const height = Math.max(1, Math.floor(this.height / this.options.scale));

    this.renderTargets = {
      luminosity: new THREE.WebGLRenderTarget(width, height, {
        format: THREE.RGBAFormat,
        type: THREE.HalfFloatType,
        generateMipmaps: false,
        samples: this.renderTargetSamples
      }),
      selectiveBloom: new THREE.WebGLRenderTarget(width, height, {
        format: THREE.RGBAFormat,
        type: THREE.HalfFloatType,
        generateMipmaps: false,
        samples: this.renderTargetSamples
      }),
      blurred: [
        new THREE.WebGLRenderTarget(width, height, {
          format: THREE.RGBAFormat,
          type: THREE.HalfFloatType,
          generateMipmaps: false
        }),
        new THREE.WebGLRenderTarget(width, height, {
          format: THREE.RGBAFormat,
          type: THREE.HalfFloatType,
          generateMipmaps: false
        })
      ],
      composite: new THREE.WebGLRenderTarget(this.width, this.height, {
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType
      })
    };
  }

  /**
   * Create shader materials
   */
  createMaterials() {
    // Luminosity extraction material
    this.materials.luminosity = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        threshold: { value: this.options.threshold },
        smoothWidth: { value: 0.01 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float threshold;
        uniform float smoothWidth;
        varying vec2 vUv;

        float atomaBloomLuma(vec3 color) {
          return dot(color, vec3(0.299, 0.587, 0.114));
        }

        void main() {
          vec4 color = texture2D(tDiffuse, vUv);
          float lum = atomaBloomLuma(color.rgb);
          float smoothed = smoothstep(threshold - smoothWidth, threshold + smoothWidth, lum);
          gl_FragColor = vec4(color.rgb * smoothed, color.a);
        }
      `
    });
    checkLateMaterialCreation(undefined, 'BloomPass::LuminosityShaderMaterial');

    // Horizontal blur material
    const blurMaterial = this.createBlurMaterial(1.0, 0.0);
    this.materials.blurHorizontal = blurMaterial;
    this.materials.blurVertical = blurMaterial;

    // Composite material (blend bloom with original)
    this.materials.composite = new THREE.ShaderMaterial({
      uniforms: {
        tScene: { value: null },
        tBloom: { value: null },
        resolution: { value: new THREE.Vector2(this.width, this.height) },
        strength: { value: this.options.strength },
        exposure: { value: this.options.exposure },
        vignetteStrength: { value: this.options.vignetteStrength },
        tintColor: { value: new THREE.Color(0xffffff) },
        tintStrength: { value: this.options.tintStrength },
        chromaticStrength: { value: this.options.chromaticStrength },
        grainStrength: { value: this.options.grainStrength },
        contrast: { value: this.options.contrast },
        saturation: { value: this.options.saturation },
        lift: { value: this.options.lift },
        gamma: { value: this.options.gamma },
        gain: { value: this.options.gain },
        hazeStrength: { value: this.options.hazeStrength },
        hazeColor: { value: new THREE.Color(this.options.hazeColor) },
        anamorphicStrength: { value: this.options.anamorphicStrength },
        anamorphicSpread: { value: this.options.anamorphicSpread },
        bloomGhostStrength: { value: this.options.bloomGhostStrength },
        bloomDirtStrength: { value: this.options.bloomDirtStrength },
        lightWrapStrength: { value: this.options.lightWrapStrength },
        warmLiftStrength: { value: this.options.warmLiftStrength },
        cyanShadowStrength: { value: this.options.cyanShadowStrength },
        corruptionSplitStrength: { value: this.options.corruptionSplitStrength },
        time: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tScene;
        uniform sampler2D tBloom;
        uniform vec2 resolution;
        uniform float strength;
        uniform float exposure;
        uniform float vignetteStrength;
        uniform vec3 tintColor;
        uniform float tintStrength;
        uniform float chromaticStrength;
        uniform float grainStrength;
        uniform float contrast;
        uniform float saturation;
        uniform float lift;
        uniform float gamma;
        uniform float gain;
        uniform float hazeStrength;
        uniform vec3 hazeColor;
        uniform float anamorphicStrength;
        uniform float anamorphicSpread;
        uniform float bloomGhostStrength;
        uniform float bloomDirtStrength;
        uniform float lightWrapStrength;
        uniform float warmLiftStrength;
        uniform float cyanShadowStrength;
        uniform float corruptionSplitStrength;
        uniform float time;
        varying vec2 vUv;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float atomaCompositeLuma(vec3 color) {
          return dot(color, vec3(0.299, 0.587, 0.114));
        }

        float softDirt(vec2 uv) {
          vec2 p = uv * vec2(9.0, 5.0);
          float a = hash(floor(p));
          float b = hash(floor(p * 1.73 + 4.1));
          float vign = smoothstep(0.05, 0.86, distance(uv, vec2(0.5)));
          return mix(a, b, 0.42) * (0.28 + vign * 0.72);
        }

        vec3 sampleChromatic(vec2 uv) {
          vec2 centered = uv - vec2(0.5);
          vec2 drift = vec2(sin(time * 0.23), cos(time * 0.19)) * corruptionSplitStrength * 0.55;
          vec2 axis = normalize(centered + drift + vec2(0.0001, 0.0001));
          vec2 offset = axis * (chromaticStrength * 1.45 + corruptionSplitStrength * (1.0 + dot(centered, centered) * 2.4));
          float r = texture2D(tScene, uv + offset).r;
          float g = texture2D(tScene, uv).g;
          float b = texture2D(tScene, uv - offset).b;
          return vec3(r, g, b);
        }

        vec3 sampleAnamorphicBloom(vec2 uv) {
          vec3 accum = vec3(0.0);
          float total = 0.0;
          float spread = (0.0025 + anamorphicSpread * 0.0065) * (resolution.y / max(resolution.x, 1.0));
          for (int i = -4; i <= 4; i++) {
            float fi = float(i);
            float w = exp(-abs(fi) * 0.72);
            vec2 suv = uv + vec2(fi * spread, 0.0);
            accum += texture2D(tBloom, clamp(suv, vec2(0.001), vec2(0.999))).rgb * w;
            total += w;
          }
          return accum / max(total, 0.001);
        }

        vec3 sampleBloomGhosts(vec2 uv) {
          vec2 centered = uv - vec2(0.5);
          vec3 g1 = texture2D(tBloom, clamp(vec2(0.5) - centered * 0.62, vec2(0.001), vec2(0.999))).rgb;
          vec3 g2 = texture2D(tBloom, clamp(vec2(0.5) + centered * 0.36 + vec2(0.012, -0.008), vec2(0.001), vec2(0.999))).rgb;
          vec3 g3 = texture2D(tBloom, clamp(vec2(0.5) - centered * 0.24 + vec2(-0.018, 0.014), vec2(0.001), vec2(0.999))).rgb;
          float edgeFade = smoothstep(0.02, 0.58, length(centered)) * (1.0 - smoothstep(0.62, 0.92, length(centered)));
          return (g1 * 0.44 + g2 * 0.34 + g3 * 0.22) * edgeFade;
        }

        vec3 applyCinematicLift(vec3 color, float sceneLuma, float bloomLuma) {
          vec3 warm = vec3(1.12, 1.02, 0.84);
          vec3 cyan = vec3(0.78, 1.04, 1.14);
          float highlightMask = smoothstep(0.38, 1.1, sceneLuma + bloomLuma * 0.65);
          float shadowMask = 1.0 - smoothstep(0.08, 0.46, sceneLuma);
          color = mix(color, color * warm, warmLiftStrength * highlightMask);
          color = mix(color, color * cyan, cyanShadowStrength * shadowMask);
          return color;
        }

        vec3 applyContrast(vec3 color, float amount) {
          return (color - 0.5) * amount + 0.5;
        }

        vec3 applySaturation(vec3 color, float amount) {
          float luma = dot(color, vec3(0.299, 0.587, 0.114));
          return mix(vec3(luma), color, amount);
        }

        vec3 applyLiftGain(vec3 color, float liftAmount, float gammaAmount, float gainAmount) {
          vec3 lifted = max(color + vec3(liftAmount), vec3(0.0));
          lifted *= gainAmount;
          return pow(max(lifted, vec3(0.0)), vec3(max(gammaAmount, 0.001)));
        }

        vec3 filmicTonemap(vec3 color) {
          color = max(color, vec3(0.0));
          vec3 mapped = (color * (2.51 * color + 0.03)) / (color * (2.43 * color + 0.59) + 0.14);
          vec3 shoulder = color / (color + vec3(1.0));
          return clamp(mix(mapped, shoulder, 0.18), 0.0, 1.0);
        }

        void main() {
          vec3 sceneColor = texture2D(tScene, vUv).rgb;
          if (chromaticStrength > 0.00001) {
            sceneColor = sampleChromatic(vUv);
          }
          vec4 bloom = texture2D(tBloom, vUv);
          vec3 anamorphicBloom = sampleAnamorphicBloom(vUv);
          vec3 bloomGhosts = sampleBloomGhosts(vUv);
          float dirt = softDirt(vUv + vec2(time * 0.003, -time * 0.002));
          
          // Apply exposure to bloom
          vec3 bloomColor = bloom.rgb * strength * exposure;
          bloomColor += anamorphicBloom * anamorphicStrength * exposure;
          bloomColor += bloomGhosts * bloomGhostStrength * exposure;
          bloomColor *= 1.0 + dirt * bloomDirtStrength;
          
          // Additive blend
          vec3 finalColor = sceneColor + bloomColor;
          float finalLuma = atomaCompositeLuma(finalColor);
          float bloomLuma = atomaCompositeLuma(bloomColor);

          // Light-wrap haze: bright regions bleed into nearby atmosphere without another pass.
          vec3 wrapColor = mix(hazeColor, vec3(1.0, 0.9, 0.66), warmLiftStrength * 0.75);
          float wrapMask = smoothstep(0.03, 0.42, bloomLuma) * (0.62 + softDirt(vUv * 0.73) * 0.38);
          finalColor += wrapColor * wrapMask * lightWrapStrength;

          // Subtle cinematic tinting / grading
          finalColor = applyCinematicLift(finalColor, finalLuma, bloomLuma);
          finalColor = mix(finalColor, finalColor * tintColor, tintStrength);
          finalColor = applyContrast(finalColor, contrast);
          finalColor = applySaturation(finalColor, saturation);
          finalColor = applyLiftGain(finalColor, lift, gamma, gain);

          // Ambient atmospheric haze to soften the frame edges
          float distFromCenter = distance(vUv, vec2(0.5));
          float hazeMask = smoothstep(0.08, 0.92, distFromCenter);
          vec3 hazeMix = hazeColor * (0.28 + finalLuma * 0.12 + bloomLuma * 0.18);
          finalColor += hazeMix * hazeStrength * hazeMask;

          // Gentle edge vignette to focus the frame
          float vignette = smoothstep(0.34, 0.82, distFromCenter);
          finalColor *= 1.0 - vignette * vignetteStrength;

          // Filmic response so the frame reads more like a curated render than a raw bloom stack
          finalColor = filmicTonemap(finalColor);

          // Film grain to keep the image from feeling too flat
          float grainPhase = floor(time * 12.0) * 0.25;
          float grain = hash(vUv * vec2(1920.0, 1080.0) + grainPhase) - 0.5;
          finalColor += grain * grainStrength;
          finalColor = clamp(finalColor, 0.0, 1.0);
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    });
    checkLateMaterialCreation(undefined, 'BloomPass::CompositeShaderMaterial');
  }

  /**
   * Create blur material
   */
  createBlurMaterial(dirX, dirY) {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        direction: { value: new THREE.Vector2(dirX, dirY) },
        radius: { value: this.options.radius }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 direction;
        uniform float radius;
        varying vec2 vUv;

        vec4 blur(sampler2D tex, vec2 uv, vec2 dir, float r) {
          vec4 result = vec4(0.0);
          float total = 0.0;
          
          for(int i = -10; i <= 10; i++) {
            float offset = float(i);
            float weight = exp(-offset * offset / (2.0 * r * r));
            result += texture2D(tex, uv + dir * offset * 0.002) * weight;
            total += weight;
          }
          
          return result / total;
        }

        void main() {
          gl_FragColor = blur(tDiffuse, vUv, direction, radius);
        }
      `
    });
    checkLateMaterialCreation(undefined, 'BloomPass::BlurShaderMaterial');
    return material;
  }

  /**
   * Create effect planes
   */
  createEffectPlanes() {
    const geometry = new THREE.PlaneGeometry(2, 2);
    this.effectGeometry = geometry;
    
    this.planes = {
      luminosity: new THREE.Mesh(geometry, this.materials.luminosity),
      blurH: new THREE.Mesh(geometry, this.materials.blurHorizontal),
      blurV: new THREE.Mesh(geometry, this.materials.blurVertical),
      composite: new THREE.Mesh(geometry, this.materials.composite)
    };

    Object.values(this.planes).forEach(plane => {
      this.scene_scene.add(plane);
    });
  }

  /**
   * Render bloom effect
   */
  getPasses(sourceRenderTarget) {
    const rt = this.renderTargets;
    const setVisibility = (active) => {
      Object.entries(this.planes).forEach(([key, mesh]) => {
        mesh.visible = key === active;
      });
    };

    // Build ordered pass list; consumers execute renderer operations
    return [
      {
        target: rt.luminosity,
        scene: this.scene_scene,
        camera: this.screenCamera,
        label: 'bloom.luminosity',
        before: () => {
          setVisibility('luminosity');
          this.materials.luminosity.uniforms.tDiffuse.value = sourceRenderTarget.texture;
        }
      },
      {
        target: rt.blurred[0],
        scene: this.scene_scene,
        camera: this.screenCamera,
        label: 'bloom.blurH',
        before: () => {
          setVisibility('blurH');
          this.materials.blurHorizontal.uniforms.direction.value.set(1.0, 0.0);
          this.materials.blurHorizontal.uniforms.tDiffuse.value = rt.luminosity.texture;
        }
      },
      {
        target: rt.blurred[1],
        scene: this.scene_scene,
        camera: this.screenCamera,
        label: 'bloom.blurV',
        before: () => {
          setVisibility('blurV');
          this.materials.blurVertical.uniforms.direction.value.set(0.0, 1.0);
          this.materials.blurVertical.uniforms.tDiffuse.value = rt.blurred[0].texture;
        }
      }
    ];
  }

  /**
   * Get final composite scene/camera for a screen render
   */
  getCompositeOutput(sourceRenderTarget, bloomTexture = null) {
    this.materials.composite.uniforms.tScene.value = sourceRenderTarget.texture;
    this.materials.composite.uniforms.tBloom.value = bloomTexture || this.renderTargets.blurred[1].texture;
    Object.entries(this.planes).forEach(([key, mesh]) => {
      mesh.visible = key === 'composite';
    });
    return {
      scene: this.scene_scene,
      camera: this.screenCamera
    };
  }

  async warmup(renderer = this.renderer) {
    if (!renderer || (typeof renderer.compileAsync !== 'function' && typeof renderer.compile !== 'function')) {
      return null;
    }

    if (this._shaderWarmupComplete) {
      return this._shaderWarmupPromise;
    }
    if (this._shaderWarmupInFlight) {
      return this._shaderWarmupPromise;
    }
    if (this.enabled === false) {
      return null;
    }

    const scene = this.bloomPass?.scene_scene;
    const camera = this.bloomPass?.screenCamera ?? this.screenCamera;
    if (!scene || !camera) {
      return null;
    }

    this._shaderWarmupInFlight = true;
    const startedAt = performance.now();
    const restoreVisibility = [];

    if (this.bloomPass?.planes) {
      for (const mesh of Object.values(this.bloomPass.planes)) {
        if (!mesh) continue;
        restoreVisibility.push([mesh, mesh.visible]);
        mesh.visible = true;
      }
    }

    const promise = (async () => {
      try {
        if (typeof renderer.compileAsync === 'function') {
          await renderer.compileAsync(scene, camera);
        } else {
          renderer.compile(scene, camera);
        }
      } finally {
        for (const [mesh, visible] of restoreVisibility) {
          mesh.visible = visible;
        }
        this._shaderWarmupInFlight = false;
        this._shaderWarmupComplete = true;
        this._shaderWarmupReport = {
          durationMs: performance.now() - startedAt
        };
      }
    })();

    this._shaderWarmupPromise = promise;
    return promise;
  }

  /**
   * Update parameters
   */
  updateParams(params) {
    if (params.strength !== undefined) {
      this.options.strength = params.strength;
      this.materials.composite.uniforms.strength.value = params.strength;
    }
    if (params.threshold !== undefined) {
      this.options.threshold = params.threshold;
      this.materials.luminosity.uniforms.threshold.value = params.threshold;
    }
    if (params.exposure !== undefined) {
      this.options.exposure = params.exposure;
      this.materials.composite.uniforms.exposure.value = params.exposure;
    }
    if (params.radius !== undefined) {
      this.options.radius = params.radius;
      this.materials.blurHorizontal.uniforms.radius.value = params.radius;
    }
    if (params.vignetteStrength !== undefined) {
      this.options.vignetteStrength = params.vignetteStrength;
      this.materials.composite.uniforms.vignetteStrength.value = params.vignetteStrength;
    }
    if (params.tintStrength !== undefined) {
      this.options.tintStrength = params.tintStrength;
      this.materials.composite.uniforms.tintStrength.value = params.tintStrength;
    }
    if (params.chromaticStrength !== undefined) {
      this.options.chromaticStrength = params.chromaticStrength;
      this.materials.composite.uniforms.chromaticStrength.value = params.chromaticStrength;
    }
    if (params.grainStrength !== undefined) {
      this.options.grainStrength = params.grainStrength;
      this.materials.composite.uniforms.grainStrength.value = params.grainStrength;
    }
    if (params.contrast !== undefined) {
      this.options.contrast = params.contrast;
      this.materials.composite.uniforms.contrast.value = params.contrast;
    }
    if (params.saturation !== undefined) {
      this.options.saturation = params.saturation;
      this.materials.composite.uniforms.saturation.value = params.saturation;
    }
    if (params.lift !== undefined) {
      this.options.lift = params.lift;
      this.materials.composite.uniforms.lift.value = params.lift;
    }
    if (params.gamma !== undefined) {
      this.options.gamma = params.gamma;
      this.materials.composite.uniforms.gamma.value = params.gamma;
    }
    if (params.gain !== undefined) {
      this.options.gain = params.gain;
      this.materials.composite.uniforms.gain.value = params.gain;
    }
    if (params.hazeStrength !== undefined) {
      this.options.hazeStrength = params.hazeStrength;
      this.materials.composite.uniforms.hazeStrength.value = params.hazeStrength;
    }
    if (params.hazeColor !== undefined) {
      this.options.hazeColor = params.hazeColor;
      this.materials.composite.uniforms.hazeColor.value.set(params.hazeColor);
    }
    if (params.tintColor !== undefined) {
      this.options.tintColor = params.tintColor;
      this.materials.composite.uniforms.tintColor.value.set(params.tintColor);
    }
    if (params.anamorphicStrength !== undefined) {
      this.options.anamorphicStrength = params.anamorphicStrength;
      this.materials.composite.uniforms.anamorphicStrength.value = params.anamorphicStrength;
    }
    if (params.anamorphicSpread !== undefined) {
      this.options.anamorphicSpread = params.anamorphicSpread;
      this.materials.composite.uniforms.anamorphicSpread.value = params.anamorphicSpread;
    }
    if (params.bloomGhostStrength !== undefined) {
      this.options.bloomGhostStrength = params.bloomGhostStrength;
      this.materials.composite.uniforms.bloomGhostStrength.value = params.bloomGhostStrength;
    }
    if (params.bloomDirtStrength !== undefined) {
      this.options.bloomDirtStrength = params.bloomDirtStrength;
      this.materials.composite.uniforms.bloomDirtStrength.value = params.bloomDirtStrength;
    }
    if (params.lightWrapStrength !== undefined) {
      this.options.lightWrapStrength = params.lightWrapStrength;
      this.materials.composite.uniforms.lightWrapStrength.value = params.lightWrapStrength;
    }
    if (params.warmLiftStrength !== undefined) {
      this.options.warmLiftStrength = params.warmLiftStrength;
      this.materials.composite.uniforms.warmLiftStrength.value = params.warmLiftStrength;
    }
    if (params.cyanShadowStrength !== undefined) {
      this.options.cyanShadowStrength = params.cyanShadowStrength;
      this.materials.composite.uniforms.cyanShadowStrength.value = params.cyanShadowStrength;
    }
    if (params.corruptionSplitStrength !== undefined) {
      this.options.corruptionSplitStrength = params.corruptionSplitStrength;
      this.materials.composite.uniforms.corruptionSplitStrength.value = params.corruptionSplitStrength;
    }
    if (params.scale !== undefined) {
      this.options.scale = params.scale;
      this.baseScale = Math.max(2, Math.round(params.scale));
      this._setDownsampleScale(this.baseScale);
    }
    if (params.selectiveBloomEnabled !== undefined) {
      this.options.selectiveBloomEnabled = params.selectiveBloomEnabled;
      this._selectiveBloomStats.refreshedAt = 0;
      this.requestSelectiveBloomRefresh('selectiveBloomEnabled');
    }
    if (params.bloomLayerIndex !== undefined) {
      this.options.bloomLayerIndex = params.bloomLayerIndex;
      this._selectiveBloomStats.refreshedAt = 0;
      this.requestSelectiveBloomRefresh('bloomLayerIndex');
    }
    if (params.bloomLayerRefreshInterval !== undefined) {
      this.options.bloomLayerRefreshInterval = params.bloomLayerRefreshInterval;
      this._bloomLayerRefreshInterval = Math.max(1, Math.round(params.bloomLayerRefreshInterval || 1));
      this.requestSelectiveBloomRefresh('bloomLayerRefreshInterval');
    }
  }

  /**
   * Handle window resize
   */
  onWindowResize(width, height) {
    this.width = width;
    this.height = height;
    
    // Recreate render targets with new size
    this.renderTargets.composite.setSize(width, height);
    this.materials.composite.uniforms.resolution.value.set(width, height);
    this._resizeBloomTargets();
  }

  /**
   * Dispose
   */
  dispose() {
    Object.values(this.renderTargets).forEach(rt => {
      if (Array.isArray(rt)) {
        rt.forEach(r => r.dispose());
      } else {
        rt.dispose();
      }
    });

    const disposedMaterials = new Set();
    Object.values(this.materials).forEach(mat => {
      if (!mat || disposedMaterials.has(mat)) return;
      disposedMaterials.add(mat);
      if (mat.dispose) mat.dispose();
    });

    if (this.effectGeometry) {
      this.effectGeometry.dispose();
      this.effectGeometry = null;
    }

    if (this.scene_scene) {
      this.scene_scene.clear();
    }
  }
}

/**
 * Simple Bloom Implementation (faster alternative)
 * Uses additive blending for basic glow
 */
export class SimpleBloomEffect {
  constructor(scene) {
    this.scene = scene;
    this.bloomLayers = [];
    this.bloomLayer = new THREE.Layers();
    this.bloomLayer.set(1); // Use layer 1 for bloom objects
  }

  /**
   * Add object to bloom layer
   */
  addToBloom(object) {
    object.layers.enable(1);
  }

  /**
   * Remove object from bloom
   */
  removeFromBloom(object) {
    object.layers.disable(1);
  }

  /**
   * Enable bloom rendering (use with EffectComposer)
   */
  enableBloomLayer() {
    this.scene.traverse(child => {
      if (child.userData.bloomLayer) {
        this.addToBloom(child);
      }
    });
  }

  /**
   * Setup bloom with UnrealBloomPass
   */
  static createWithEffectComposer(renderer, scene, camera) {
    // This would require EffectComposer from Three.js examples
    // For now, return simplified version
    return new SimpleBloomEffect(scene);
  }
}

/**
 * Post-processing pipeline
 */
export class PostProcessingPipeline {
  constructor(renderer, scene, camera, options = {}) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.sceneMetrics = null;
    const initialSize = getRendererBufferSize(renderer);
    this.width = initialSize.width;
    this.height = initialSize.height;
    this.renderTargetSamples = this.renderer?.capabilities?.isWebGL2
      ? Math.max(0, Math.min(4, this.renderer?.capabilities?.maxSamples ?? 4))
      : 0;

    // Create main render target
    this.mainRenderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      samples: this.renderTargetSamples
    });

    // Create bloom pass
    this.bloomPass = new BloomPass(renderer, scene, camera, {
      strength: options.bloomStrength ?? options.strength ?? 1.06,
      radius: options.bloomRadius ?? options.radius ?? 0.42,
      threshold: options.bloomThreshold ?? options.threshold ?? 0.84,
      ...options
    });
    this._neutralBloomTexture = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1, THREE.RGBAFormat);
    this._neutralBloomTexture.needsUpdate = true;
    this._neutralBloomTexture.generateMipmaps = false;
    this._neutralBloomTexture.minFilter = THREE.NearestFilter;
    this._neutralBloomTexture.magFilter = THREE.NearestFilter;
    this._activeBloomTexture = this._neutralBloomTexture;

    this.enabled = options.enabled !== false;
    this._shaderWarmupComplete = false;
    this._shaderWarmupInFlight = false;
    this._shaderWarmupPromise = null;

    // [B.3-D2] Dev marker to indicate post pipeline ready at init time
    if (typeof window !== 'undefined') {
      window.__POST_PIPELINE_READY = true;
    }
  }

  /**
   * Build render operations for the current frame without issuing renderer.render
   * Consumers must execute the returned operations in order, then render the
   * composite output scene/camera.
   */
  apply(scene, camera, metrics = null) {
    if (!this.enabled) {
      return {
        operations: [],
        outputScene: scene,
        outputCamera: camera
      };
    }

    if (metrics) {
      this.sceneMetrics = { ...metrics };
    }

    if (scene) {
      this.scene = scene;
    }
    if (camera) {
      this.camera = camera;
    }

    if (typeof this.bloomPass?.updateSceneMetrics === 'function') {
      this.bloomPass.updateSceneMetrics(this.sceneMetrics || undefined);
      this.bloomPass.scene = this.scene;
      this.bloomPass.camera = this.camera;
    }

    // 1) Render base scene into main render target
    const operations = [
      {
        target: this.mainRenderTarget,
        scene,
        camera,
        label: 'baseSceneRender'
      }
    ];

    // 3) Prepare composite for screen render
    const output = this.getCompositeOutput(this.mainRenderTarget);

    return {
      operations,
      outputScene: output.scene,
      outputCamera: output.camera
    };
  }

  /**
   * Render with post-processing
   */
  render(renderCallback) {
    console.warn('[PostProcessingPipeline] render() is deprecated. Use apply() and execute operations via FrameScheduler.');
  }

  /**
   * Update parameters
   */
  updateParams(params) {
    this.bloomPass.updateParams(params);
  }

  setBloomTexture(texture = null) {
    this._activeBloomTexture = texture || this._neutralBloomTexture;
    return this._activeBloomTexture;
  }

  getCompositeOutput(sourceRenderTarget = this.mainRenderTarget) {
    return this.bloomPass.getCompositeOutput(sourceRenderTarget, this._activeBloomTexture || this._neutralBloomTexture);
  }

  updateSceneMetrics(metrics = null) {
    this.sceneMetrics = metrics ? { ...metrics } : null;
  }

  restoreRenderState(camera = this.camera) {
    return this.bloomPass?.restorePendingCameraLayerMask?.(camera) === true;
  }

  /**
   * Toggle post-processing
   */
  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      void this.warmup(this.renderer);
    }
    return this.enabled;
  }

  /**
   * Handle resize
   */
  onWindowResize(width, height) {
    const nextSize = Number.isFinite(width) && Number.isFinite(height)
      ? { width: Math.max(1, Math.floor(width)), height: Math.max(1, Math.floor(height)) }
      : getRendererBufferSize(this.renderer);

    this.width = nextSize.width;
    this.height = nextSize.height;
    this.mainRenderTarget.setSize(nextSize.width, nextSize.height);
    this.bloomPass.onWindowResize(width, height);
  }

  /**
   * Dispose
   */
  dispose() {
    this.mainRenderTarget.dispose();
    this.bloomPass.dispose();
    this._neutralBloomTexture?.dispose?.();
  }
}

// [B.3-D2] Shared, one-time-initialized pipeline to avoid runtime creation
let __postProcessingSingleton = null;
export function getSharedPostProcessingPipeline(renderer, scene, camera, options = {}) {
  if (__postProcessingSingleton) {
    return __postProcessingSingleton;
  }
  __postProcessingSingleton = new PostProcessingPipeline(renderer, scene, camera, options);
  return __postProcessingSingleton;
}
