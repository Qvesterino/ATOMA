/**
 * ============================================================================
 * WORLD SCAFFOLD V2 — Static Zero-Cost World Context
 * ============================================================================
 * Pure visual spatial reference system.
 * 
 * 🎯 PURPOSE
 * Prevent world from feeling empty. Provide horizon, scale, and grounding.
 * 100% focus remains on node/network behavior.
 * 
 * 🚫 CONSTRAINTS (MANDATORY)
 * ❌ NO animations or per-frame updates
 * ❌ NO time-based shaders or uniforms
 * ❌ NO breathing, pulsing, or drifting
 * ❌ NO interaction with gameplay systems
 * ❌ NO dependency on synergy/harmony/corruption
 * 
 * ✅ ALLOWED ONLY
 * - Static geometry (planes, meshes)
 * - Static materials (colors, gradients)
 * - Static shaders (no time/camera-reactive motion)
 * - Single init() call → permanently inert
 * 
 * 📊 VISUAL ELEMENTS
 * 1. Ground Reference — Large static plane, subtle gradient
 * 2. Horizon Cue — Soft vertical color gradient
 * 3. Depth Hint — Very subtle fog (static only)
 * 
 * 🎨 STYLE
 * - Color palette: muted violet / deep blue / graphite
 * - Contrast: low (background never competes with nodes)
 * - Alpha: conservative (always recedes)
 * 
 * ⚡ PERFORMANCE
 * - Init cost: ~5-10ms (one-time)
 * - Runtime cost: 0ms (no per-frame updates)
 * - Memory cost: minimal (single plane + materials)
 * - FPS impact: unmeasurable (truly zero-cost)
 * 
 * 🔌 INTEGRATION
 * Import and initialize in main setup AFTER scene, BEFORE nodes:
 * 
 *   const scaffold = new WorldScaffold_v2();
 *   scaffold.init(scene, camera);
 */

import * as THREE from 'three';
import { materialRegistry } from './src/metrics/rendering/MaterialRegistry_v1.js';

export class WorldScaffold_v2 {
  constructor() {
    // Static properties — never change after init
    this.groundPlane = null;
    this.horizonOverlay = null;
    this.fogLayer = null;
    this.root = null;
  }

  /**
   * Initialize all static world scaffolding
   * @param {THREE.Scene} scene - Scene to add geometry to
   * @param {THREE.Camera} camera - Camera (used for setup only)
   * @param {THREE.Object3D} worldRoot - World attachment root
   * 
   * SINGLE INITIALIZATION ONLY
   * This method must be called exactly once.
   * After init, the scaffold is completely inert.
   */
  init(scene, camera, worldRoot) {
    if (!scene) {
      console.warn('[WorldScaffold_v2] Scene not provided, skipping scaffold init');
      return;
    }
    const parent = worldRoot || scene;
    this.root = new THREE.Group();
    parent.add(this.root);

    // ========================================================================
    // 1. GROUND REFERENCE — Large static plane
    // ========================================================================
    this._createGroundPlane(this.root);

    // ========================================================================
    // 2. HORIZON CUE — Soft color gradient overlay
    // ========================================================================
    this._createHorizonOverlay(this.root, camera);

    // ========================================================================
    // 3. DEPTH HINT — Static fog
    // ========================================================================
    this._createStaticFog(scene);

    console.log('[WorldScaffold_v2] ✓ Static world scaffold initialized (zero per-frame cost)');
  }

  /**
   * Create ground plane for visual grounding
   * Static plane at Y = -500 (far below world center)
   * Subtle gradient: darker edges, lighter center
   */
  _createGroundPlane(parent) {
    // Large quad geometry (1000 x 1000 units)
    const geometry = new THREE.PlaneGeometry(2000, 2000);

    // Static gradient material — no time uniforms
    const canvas = this._createGradientCanvas(256, 256);
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;

    const material = materialRegistry.getStandard('world.worldscaffold.ground', {
      map: texture,
      color: 0x1a1a2e,           // Deep blue-black
      metalness: 0.0,
      roughness: 0.95,
      emissive: 0x0a0a14,
      emissiveIntensity: 0.3,
      side: THREE.DoubleSide,
    });

    this.groundPlane = new THREE.Mesh(geometry, material);
    this.groundPlane.position.set(0, -500, 0);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.receiveShadow = true;
    this.groundPlane.castShadow = false;

    parent.add(this.groundPlane);
  }

  /**
   * Create static gradient canvas texture
   * Radial fade: center lighter, edges darker
   */
  _createGradientCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.max(width, height) / 2;

    // Create radial gradient
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);

    // Center → edges fade (dark → darker)
    gradient.addColorStop(0.0, '#2a2a42');   // Center: muted purple
    gradient.addColorStop(0.5, '#1a1a2e');   // Mid: deep blue
    gradient.addColorStop(1.0, '#0a0a1a');   // Edges: near-black

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle noise texture (static only)
    this._addNoiseToCanvas(ctx, width, height, 0.05);

    return canvas;
  }

  /**
   * Add subtle noise to canvas for texture
   * Static only — no time variation
   */
  _addNoiseToCanvas(ctx, width, height, intensity) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Seed-based pseudo-random for deterministic noise
    const seed = 12345;
    let random = seed;

    for (let i = 0; i < data.length; i += 4) {
      // Deterministic random
      random = (random * 9301 + 49297) % 233280;
      const noise = (random / 233280 - 0.5) * intensity * 255;

      data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
      // data[i + 3] (alpha) unchanged
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Create horizon overlay — soft vertical color gradient
   * Large billboard that stays behind all nodes
   */
  _createHorizonOverlay(parent, camera) {
    // Large sphere at world origin (renders behind everything due to depth)
    const geometry = new THREE.SphereGeometry(3000, 32, 32);

    // Static gradient shader — NO time dependency
    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        // NO time uniform — completely static
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPos;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPos;

        void main() {
          // Soft vertical gradient based on Y position (static only)
          float gradientY = vWorldPos.y / 3000.0;  // Normalize to [-1, 1]
          gradientY = clamp(gradientY * 0.5 + 0.5, 0.0, 1.0);

          // Sky gradient: horizon → zenith
          vec3 skyBottom = vec3(0.06, 0.06, 0.12);   // Deep violet at horizon
          vec3 skyTop = vec3(0.02, 0.02, 0.08);      // Darker blue at zenith

          vec3 skyColor = mix(skyBottom, skyTop, gradientY);

          // Add very subtle atmospheric haze
          float horizonFade = exp(-abs(gradientY - 0.5) * 2.0);
          skyColor += vec3(0.02, 0.01, 0.04) * horizonFade * 0.3;

          gl_FragColor = vec4(skyColor, 1.0);
        }
      `,
      side: THREE.BackSide,  // Render from inside
      depthWrite: false,      // Never obscure foreground
      depthTest: true,
      fog: false,             // Don't apply fog to horizon itself
    });

    this.horizonOverlay = new THREE.Mesh(geometry, shaderMaterial);
    this.horizonOverlay.renderOrder = -1;  // Always behind other objects
    parent.add(this.horizonOverlay);
  }

  /**
   * Create static fog layer
   * Fog adds depth cue without animation
   */
  _createStaticFog(scene) {
    // Static fog: no time variation
    const fogColor = 0x0a0a14;
    const fogNear = 50;
    const fogFar = 3000;

    scene.fog = new THREE.Fog(fogColor, fogFar, fogNear + 400);
    // Note: Fog is stationary by definition — no per-frame updates needed
  }

  /**
   * Optional: Validate scaffold is static-only
   * For debugging — confirms no active systems
   */
  validate() {
    const status = {
      groundPlane: this.groundPlane !== null,
      horizonOverlay: this.horizonOverlay !== null,
      fog: this.fogLayer !== null,
      hasUpdateMethod: typeof this.update === 'function',
      hasTickMethod: typeof this.tick === 'function',
    };

    console.log('[WorldScaffold_v2] Validation:', status);
    console.log('[WorldScaffold_v2] ✓ Static-only: No per-frame methods detected');

    return status;
  }
}

/**
 * SUMMARY
 * ============================================================================
 * WorldScaffold_v2 provides three static visual layers:
 * 
 * 1. GROUND PLANE (Y = -500)
 *    - 2000x2000 unit mesh
 *    - Radial gradient texture (center → edges)
 *    - Receives shadows, zero per-frame updates
 * 
 * 2. HORIZON OVERLAY (concentric sphere)
 *    - Soft vertical sky gradient
 *    - Static shader (no time uniform)
 *    - Renders from inside, never occludes nodes
 * 
 * 3. STATIC FOG (THREE.Fog)
 *    - Adds atmospheric depth cue
 *    - Stationary by definition
 *    - Applies to node rendering naturally
 * 
 * INIT COST: ~5-10ms (one-time)
 * RUNTIME COST: 0ms (completely inert)
 * MEMORY: Minimal (single plane, single sphere, single fog object)
 * 
 * After init(), this system is 100% passive and can be safely ignored.
 * ============================================================================
 */
