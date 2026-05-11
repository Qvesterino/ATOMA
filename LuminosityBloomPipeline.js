import { BloomPass } from './PostProcessing.js';

export class LuminosityBloomPipeline {
  constructor(renderer, scene, camera, options = {}) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.sceneMetrics = null;
    this.enabled = options.enabled !== false;
    this._shaderWarmupComplete = false;
    this._shaderWarmupInFlight = false;
    this._shaderWarmupPromise = null;

    this.bloomPass = new BloomPass(renderer, scene, camera, {
      strength: options.bloomStrength ?? options.strength ?? 1.06,
      radius: options.bloomRadius ?? options.radius ?? 0.42,
      threshold: options.bloomThreshold ?? options.threshold ?? 0.84,
      ...options
    });
  }

  apply(sourceRenderTarget, scene = this.scene, camera = this.camera, metrics = null) {
    if (!this.enabled || !sourceRenderTarget) {
      return { operations: [], outputTexture: null };
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

    this.bloomPass.scene = this.scene;
    this.bloomPass.camera = this.camera;
    if (typeof this.bloomPass._refreshSelectiveBloomTargets === 'function') {
      const shouldForceBloomRefresh =
        this.bloomPass._selectiveBloomStats?.refreshedAt === 0 ||
        this.bloomPass._lastSelectiveBloomScene !== this.scene;
      this.bloomPass._lastSelectiveBloomScene = this.scene;
      this.bloomPass._refreshSelectiveBloomTargets(shouldForceBloomRefresh);
    }

    const operations = [];
    const useSelectiveBloom =
      this.bloomPass?.options?.selectiveBloomEnabled !== false &&
      !!this.bloomPass?.renderTargets?.selectiveBloom;

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

    const bloomSourceTarget = useSelectiveBloom
      ? this.bloomPass.renderTargets.selectiveBloom
      : sourceRenderTarget;
    operations.push(...this.bloomPass.getPasses(bloomSourceTarget));

    return {
      operations,
      outputTexture: this.getOutputTexture()
    };
  }

  getOutputTexture() {
    return this.bloomPass?.renderTargets?.blurred?.[1]?.texture || null;
  }

  updateParams(params) {
    this.bloomPass?.updateParams?.(params);
  }

  updateSceneMetrics(metrics = null) {
    this.sceneMetrics = metrics ? { ...metrics } : null;
  }

  onWindowResize(width, height) {
    this.bloomPass?.onWindowResize?.(width, height);
  }

  restoreRenderState(camera = this.camera) {
    return this.bloomPass?.restorePendingCameraLayerMask?.(camera) === true;
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      void this.warmup(this.renderer);
    }
    return this.enabled;
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
    const camera = this.bloomPass?.screenCamera;
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

  dispose() {
    this.bloomPass?.dispose?.();
  }
}

let __luminosityBloomSingleton = null;
export function getSharedLuminosityBloomPipeline(renderer, scene, camera, options = {}) {
  if (__luminosityBloomSingleton) {
    return __luminosityBloomSingleton;
  }
  __luminosityBloomSingleton = new LuminosityBloomPipeline(renderer, scene, camera, options);
  return __luminosityBloomSingleton;
}
