import * as THREE from 'three';

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

    // Configuration
    this.options = {
      strength: options.strength ?? 1.14,
      radius: options.radius ?? 0.42,
      threshold: options.threshold ?? 0.84,
      scale: options.scale ?? 6,
      exposure: options.exposure ?? 1.16,
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
    this._lastSelectiveBloomScene = null;
    this._smoothedAdaptive = {
      synergy: 0.5,
      harmony: 0.5,
      corruption: 0.1,
      stability: 0.5,
      loadPressure: 0.15,
      luminanceHint: 0.5
    };

    // Scene size
    this.width = renderer.domElement.clientWidth;
    this.height = renderer.domElement.clientHeight;

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
    if (!force && (this._bloomLayerRefreshFrame % this._bloomLayerRefreshInterval !== 0)) {
      return;
    }

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

  _saveCameraLayerMask(camera) {
    return camera?.layers?.mask ?? null;
  }

  _restoreCameraLayerMask(camera, mask) {
    if (!camera?.layers || !Number.isInteger(mask)) return;
    camera.layers.mask = mask;
  }

  markBloomTarget(object, recursive = true) {
    if (!object) return;
    object.userData = object.userData || {};
    object.userData.bloomLayer = true;
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
      this.options.strength * (0.74 + this._smoothedAdaptive.synergy * 0.16 + this._smoothedAdaptive.harmony * 0.08 - this._smoothedAdaptive.corruption * 0.08),
      0.42,
      1.85
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
      this.options.exposure * (0.9 + this._smoothedAdaptive.synergy * 0.05 + brightness * 0.04 - this._smoothedAdaptive.corruption * 0.04),
      0.78,
      1.8
    );
    const vignetteStrength = THREE.MathUtils.clamp(
      this.options.vignetteStrength + pressure * 0.05 + this._smoothedAdaptive.corruption * 0.05 + (1 - this._smoothedAdaptive.stability) * 0.03,
      0.08,
      0.28
    );
    const tintStrength = THREE.MathUtils.clamp(
      this.options.tintStrength + this._smoothedAdaptive.synergy * 0.035 + this._smoothedAdaptive.corruption * 0.025,
      0,
      0.09
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
      this.options.hazeStrength + pressure * 0.03 + this._smoothedAdaptive.corruption * 0.02 + (1 - this._smoothedAdaptive.stability) * 0.025 - this._smoothedAdaptive.synergy * 0.008,
      0,
      0.12
    );
    const hazeColor = new THREE.Color(this.options.hazeColor);
    hazeColor.r = THREE.MathUtils.clamp(hazeColor.r * (1.0 + this._smoothedAdaptive.corruption * 0.02 - this._smoothedAdaptive.synergy * 0.01), 0, 1.1);
    hazeColor.g = THREE.MathUtils.clamp(hazeColor.g * (1.0 + this._smoothedAdaptive.harmony * 0.025 + this._smoothedAdaptive.stability * 0.015), 0, 1.1);
    hazeColor.b = THREE.MathUtils.clamp(hazeColor.b * (1.0 + this._smoothedAdaptive.synergy * 0.04 + this._smoothedAdaptive.stability * 0.02), 0, 1.15);

    const tintColor = new THREE.Color(0xffffff);
    tintColor.r = THREE.MathUtils.clamp(1.0 + this._smoothedAdaptive.corruption * 0.08 + this._smoothedAdaptive.synergy * 0.02, 0, 1.1);
    tintColor.g = THREE.MathUtils.clamp(1.0 + this._smoothedAdaptive.harmony * 0.02 - this._smoothedAdaptive.corruption * 0.06, 0, 1.1);
    tintColor.b = THREE.MathUtils.clamp(1.0 + this._smoothedAdaptive.synergy * 0.08 + this._smoothedAdaptive.stability * 0.03, 0, 1.1);

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
      tintColor
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
    this.materials.blurVertical.uniforms.radius.value = state.radius;

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
        generateMipmaps: false
      }),
      selectiveBloom: new THREE.WebGLRenderTarget(width, height, {
        format: THREE.RGBAFormat,
        type: THREE.HalfFloatType,
        generateMipmaps: false
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

        float luminance(vec3 color) {
          return dot(color, vec3(0.299, 0.587, 0.114));
        }

        void main() {
          vec4 color = texture2D(tDiffuse, vUv);
          float lum = luminance(color.rgb);
          float smoothed = smoothstep(threshold - smoothWidth, threshold + smoothWidth, lum);
          gl_FragColor = vec4(color.rgb * smoothed, color.a);
        }
      `
    });

    // Horizontal blur material
    this.materials.blurHorizontal = this.createBlurMaterial(1.0, 0.0);
    
    // Vertical blur material
    this.materials.blurVertical = this.createBlurMaterial(0.0, 1.0);

    // Composite material (blend bloom with original)
    this.materials.composite = new THREE.ShaderMaterial({
      uniforms: {
        tScene: { value: null },
        tBloom: { value: null },
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
        uniform float time;
        varying vec2 vUv;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        vec3 sampleChromatic(vec2 uv) {
          vec2 centered = uv - vec2(0.5);
          vec2 offset = centered * chromaticStrength * 1.5;
          float r = texture2D(tScene, uv + offset).r;
          float g = texture2D(tScene, uv).g;
          float b = texture2D(tScene, uv - offset).b;
          return vec3(r, g, b);
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
          return clamp((color * (2.51 * color + 0.03)) / (color * (2.43 * color + 0.59) + 0.14), 0.0, 1.0);
        }

        void main() {
          vec3 sceneColor = texture2D(tScene, vUv).rgb;
          if (chromaticStrength > 0.00001) {
            sceneColor = sampleChromatic(vUv);
          }
          vec4 bloom = texture2D(tBloom, vUv);
          
          // Apply exposure to bloom
          vec3 bloomColor = bloom.rgb * strength * exposure;
          
          // Additive blend
          vec3 finalColor = sceneColor + bloomColor;
          float finalLuma = dot(finalColor, vec3(0.299, 0.587, 0.114));
          float bloomLuma = dot(bloomColor, vec3(0.299, 0.587, 0.114));

          // Subtle cinematic tinting / grading
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
  }

  /**
   * Create blur material
   */
  createBlurMaterial(dirX, dirY) {
    return new THREE.ShaderMaterial({
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
        camera: this.camera,
        label: 'bloom.luminosity',
        before: () => {
          setVisibility('luminosity');
          this.materials.luminosity.uniforms.tDiffuse.value = sourceRenderTarget.texture;
        }
      },
      {
        target: rt.blurred[0],
        scene: this.scene_scene,
        camera: this.camera,
        label: 'bloom.blurH',
        before: () => {
          setVisibility('blurH');
          this.materials.blurHorizontal.uniforms.tDiffuse.value = rt.luminosity.texture;
        }
      },
      {
        target: rt.blurred[1],
        scene: this.scene_scene,
        camera: this.camera,
        label: 'bloom.blurV',
        before: () => {
          setVisibility('blurV');
          this.materials.blurVertical.uniforms.tDiffuse.value = rt.blurred[0].texture;
        }
      }
    ];
  }

  /**
   * Get final composite scene/camera for a screen render
   */
  getCompositeOutput(sourceRenderTarget) {
    this.materials.composite.uniforms.tScene.value = sourceRenderTarget.texture;
    this.materials.composite.uniforms.tBloom.value = this.renderTargets.blurred[1].texture;
    Object.entries(this.planes).forEach(([key, mesh]) => {
      mesh.visible = key === 'composite';
    });
    return {
      scene: this.scene_scene,
      camera: this.screenCamera
    };
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
      this.materials.blurVertical.uniforms.radius.value = params.radius;
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
    if (params.scale !== undefined) {
      this.options.scale = params.scale;
      this.baseScale = Math.max(2, Math.round(params.scale));
      this._setDownsampleScale(this.baseScale);
    }
    if (params.selectiveBloomEnabled !== undefined) {
      this.options.selectiveBloomEnabled = params.selectiveBloomEnabled;
      this._selectiveBloomStats.refreshedAt = 0;
    }
    if (params.bloomLayerIndex !== undefined) {
      this.options.bloomLayerIndex = params.bloomLayerIndex;
      this._selectiveBloomStats.refreshedAt = 0;
    }
    if (params.bloomLayerRefreshInterval !== undefined) {
      this.options.bloomLayerRefreshInterval = params.bloomLayerRefreshInterval;
      this._bloomLayerRefreshInterval = Math.max(1, Math.round(params.bloomLayerRefreshInterval || 1));
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

    Object.values(this.materials).forEach(mat => {
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

    // Create main render target
    this.mainRenderTarget = new THREE.WebGLRenderTarget(
      renderer.domElement.clientWidth,
      renderer.domElement.clientHeight,
      {
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType
      }
    );

    // Create bloom pass
    this.bloomPass = new BloomPass(renderer, scene, camera, {
      strength: options.bloomStrength ?? options.strength ?? 1.14,
      radius: options.bloomRadius ?? options.radius ?? 0.42,
      threshold: options.bloomThreshold ?? options.threshold ?? 0.84,
      ...options
    });

    this.enabled = options.enabled !== false;

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
    }

    if (this.bloomPass) {
      this.bloomPass.scene = this.scene;
      this.bloomPass.camera = this.camera;
      if (typeof this.bloomPass._refreshSelectiveBloomTargets === 'function') {
        const shouldForceBloomRefresh =
          this.bloomPass._selectiveBloomStats?.refreshedAt === 0 ||
          this.bloomPass._lastSelectiveBloomScene !== this.scene;
        this.bloomPass._lastSelectiveBloomScene = this.scene;
        this.bloomPass._refreshSelectiveBloomTargets(shouldForceBloomRefresh);
      }
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

    const useSelectiveBloom = this.bloomPass?.options?.selectiveBloomEnabled !== false && !!this.bloomPass?.renderTargets?.selectiveBloom;
    if (useSelectiveBloom) {
      const bloomLayerIndex = this.bloomPass._getBloomLayerIndex();
      operations.push({
        target: this.bloomPass.renderTargets.selectiveBloom,
        scene: this.scene,
        camera: this.camera,
        label: 'bloom.selectiveSource',
        before: () => {
          this.bloomPass._pendingBloomCameraLayerMask = this.bloomPass._saveCameraLayerMask(this.camera);
          this.camera?.layers?.set?.(bloomLayerIndex);
        },
        after: () => {
          this.bloomPass._restoreCameraLayerMask(this.camera, this.bloomPass._pendingBloomCameraLayerMask);
          this.bloomPass._pendingBloomCameraLayerMask = null;
        }
      });
    }

    // 2) Bloom passes (luminosity + blurs)
    const bloomSourceTarget = useSelectiveBloom ? this.bloomPass.renderTargets.selectiveBloom : this.mainRenderTarget;
    operations.push(...this.bloomPass.getPasses(bloomSourceTarget));

    // 3) Prepare composite for screen render
    const output = this.bloomPass.getCompositeOutput(this.mainRenderTarget);

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

  updateSceneMetrics(metrics = null) {
    this.sceneMetrics = metrics ? { ...metrics } : null;
  }

  /**
   * Toggle post-processing
   */
  toggle() {
    this.enabled = !this.enabled;
  }

  /**
   * Handle resize
   */
  onWindowResize(width, height) {
    this.mainRenderTarget.setSize(width, height);
    this.bloomPass.onWindowResize(width, height);
  }

  /**
   * Dispose
   */
  dispose() {
    this.mainRenderTarget.dispose();
    this.bloomPass.dispose();
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
