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
      strength: options.strength || 1.5,
      radius: options.radius || 0.4,
      threshold: options.threshold || 0.85,
      scale: options.scale || 8,
      exposure: options.exposure || 2.0,
      ...options
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
  }

  /**
   * Create render targets
   */
  createRenderTargets() {
    const width = Math.floor(this.width / this.options.scale);
    const height = Math.floor(this.height / this.options.scale);

    this.renderTargets = {
      luminosity: new THREE.WebGLRenderTarget(width, height, {
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
        exposure: { value: this.options.exposure }
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
        varying vec2 vUv;

        void main() {
          vec4 scene = texture2D(tScene, vUv);
          vec4 bloom = texture2D(tBloom, vUv);
          
          // Apply exposure to bloom
          vec3 bloomColor = bloom.rgb * strength * exposure;
          
          // Additive blend
          vec3 finalColor = scene.rgb + bloomColor;
          
          // Optional tone mapping
          finalColor = finalColor / (finalColor + vec3(1.0));
          
          gl_FragColor = vec4(finalColor, scene.a);
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
      this.materials.composite.uniforms.strength.value = params.strength;
    }
    if (params.threshold !== undefined) {
      this.materials.luminosity.uniforms.threshold.value = params.threshold;
    }
    if (params.exposure !== undefined) {
      this.materials.composite.uniforms.exposure.value = params.exposure;
    }
    if (params.radius !== undefined) {
      this.materials.blurHorizontal.uniforms.radius.value = params.radius;
      this.materials.blurVertical.uniforms.radius.value = params.radius;
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
      strength: options.bloomStrength || 1.5,
      radius: options.bloomRadius || 0.4,
      threshold: options.bloomThreshold || 0.85,
      ...options
    });

    this.enabled = options.enabled !== false;
  }

  /**
   * Build render operations for the current frame without issuing renderer.render
   * Consumers must execute the returned operations in order, then render the
   * composite output scene/camera.
   */
  apply(scene, camera) {
    if (!this.enabled) {
      return {
        operations: [],
        outputScene: scene,
        outputCamera: camera
      };
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

    // 2) Bloom passes (luminosity + blurs)
    operations.push(...this.bloomPass.getPasses(this.mainRenderTarget));

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
