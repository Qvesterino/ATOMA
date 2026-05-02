/**
 * CascadeBurstVisual_Session147.js
 * ============================================================================
 * CASCADE BURST VISUAL EFFECT
 *
 * Creates a dramatic burst visual when a cascade triggers from a hub.
 * Energy shell expands outward + radial light rays + shockwave ring.
 *
 * TRIGGER:
 * - Subscribes to 'cascade.start' semantic event
 * - Activates when cascade strength crosses the secondary hub threshold
 *
 * VISUAL LAYERS:
 * 1. Energy Shell: Expanding translucent sphere with additive blending
 * 2. Radial Rays: 6-8 ray lines emanating from burst center
 * 3. Shockwave Ring: Expanding torus ring
 * 4. Core Flash: Brief bright point at center
 *
 * PERFORMANCE:
 * - Pre-allocated mesh pool (max 8 simultaneous bursts)
 * - Zero per-frame allocations (all reused)
 * - LOD: distance-based quality reduction
 * - Auto-recycle after burst completes
 * - Total: <0.5ms per active burst
 *
 * @author VFX Technical Director — ATOMA Project Session 147
 * @version 1.0.0
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { getEnvSpriteTexture } from './EnvironmentPointFXBase.js';

const MAX_BURSTS = 8;
const BURST_DURATION = 1.2; // seconds
const RAY_COUNT = 12;
const RAY_LENGTH = 3.0;
const STABILITY_BURST_COOLDOWN = 2.0; // seconds between stability-triggered bursts

export class CascadeBurstVisual_Session147 {
  /**
   * @param {THREE.Scene} scene
   * @param {Object} config
   */
  constructor(scene, config = {}) {
    this.scene = scene;
    this.semanticBus = (typeof globalThis !== 'undefined') ? globalThis.semanticBus : null;

    this.config = {
      enabled: config.enabled ?? true,
      debugMode: config.debugMode ?? false,
      maxBursts: config.maxBursts ?? MAX_BURSTS,
      burstDuration: config.burstDuration ?? BURST_DURATION,
      shellMaxRadius: config.shellMaxRadius ?? 3.5,
      shellOpacity: config.shellOpacity ?? 0.35,
      ringMaxRadius: config.ringMaxRadius ?? 5.0,
      ringThickness: config.ringThickness ?? 0.12,
      ringOpacity: config.ringOpacity ?? 0.40,
      bloomEnabled: config.bloomEnabled ?? true,
      bloomIntensity: config.bloomIntensity ?? 1.2,
      bloomRadius: config.bloomRadius ?? 1.4,
      chromaticEnabled: config.chromaticEnabled ?? true,
      chromaticStrength: config.chromaticStrength ?? 0.18,
      distortionEnabled: config.distortionEnabled ?? true,
      distortionMaxRadius: config.distortionMaxRadius ?? 4.5,
      distortionOpacity: config.distortionOpacity ?? 0.25,
      lightingFlashEnabled: config.lightingFlashEnabled ?? true,
      lightingFlashIntensity: config.lightingFlashIntensity ?? 8.0,
      lightingFlashRange: config.lightingFlashRange ?? 4.0,
      pushForceEnabled: config.pushForceEnabled ?? true,
      pushForceRadius: config.pushForceRadius ?? 3.2,
      pushForceStrength: config.pushForceStrength ?? 0.6,
      soundEnabled: config.soundEnabled ?? false,
      soundVolume: config.soundVolume ?? 0.3,
      shellLayerCount: config.shellLayerCount ?? 3,
      ringLayerCount: config.ringLayerCount ?? 3,
      rayLength: config.rayLength ?? RAY_LENGTH,
      rayCount: config.rayCount ?? RAY_COUNT,
      rayBeamThickness: config.rayBeamThickness ?? 0.04,
      rayOpacity: config.rayOpacity ?? 0.30,
      energyParticleCount: config.energyParticleCount ?? 24,
      coreSparkCount: config.coreSparkCount ?? 18,
      nebulaOpacity: config.nebulaOpacity ?? 0.22,
      coreFlashSize: config.coreFlashSize ?? 0.8,
      coreFlashOpacity: config.coreFlashOpacity ?? 0.9,
      colorHarmonic: config.colorHarmonic ?? new THREE.Color(0xffe8c0), // Celestial plasma gold-white
      colorSynergy: config.colorSynergy ?? new THREE.Color(0xffc040),   // Cosmic gold
      colorCorruption: config.colorCorruption ?? new THREE.Color(0xcc0030), // Void crimson
      lodNearDistance: config.lodNearDistance ?? 20.0,
      lodFarDistance: config.lodFarDistance ?? 50.0,
      renderOrder: config.renderOrder ?? VisualHierarchyRegistry.getRenderOrder(
        VisualHierarchyRegistry.LAYER_LINK_RESONANCE
      ) + 5,

      // ── Supernova Detonation Upgrade ──
      enableSupernovaUpgrade: config.enableSupernovaUpgrade ?? true,
      supernovaSpectrumHues: [0.12, 0.55, 0.75, 0.97], // sacred gold, arcane teal, mystic violet, ritual crimson
      supernovaCycleSpeed: config.supernovaCycleSpeed ?? 0.1,
    };

    // Burst pool
    this._burstPool = [];
    this._activeBursts = [];
    this._freeIndices = [];

    // Reusable vectors
    this._vec3A = new THREE.Vector3();
    this._vec3B = new THREE.Vector3();
    this._colorScratch = new THREE.Color();
    this._supernovaPhase = 0; // Supernova spectral cycling

    // Stats
    this.stats = {
      burstsTriggered: 0,
      activeBursts: 0,
      poolSize: 0,
    };

    // Semantic event subscription
    this._boundCascadeStart = null;
    this._boundStabilityLow = null;
    this._semanticBusAttached = null;

    // Stability burst cooldown tracking
    this._stabilityBurstCooldown = 0;
    this._stabilityBurstCooldownUntil = 0;

    // Initialize pool
    this._initPool();
    this._subscribeCascadeEvents();
  }

  /**
   * Initialize the burst mesh pool
   */
  _initPool() {
    const poolSize = this.config.maxBursts;

    // Shared geometries
    const shellGeometry = new THREE.IcosahedronGeometry(1, 2);
    const ringGeometry = new THREE.TorusGeometry(1, this.config.ringThickness, 8, 32);
    const beamGeometry = new THREE.CylinderGeometry(this.config.rayBeamThickness, this.config.rayBeamThickness, 1.0, 6, 1, true);
    beamGeometry.translate(0, 0.5, 0);
    const coreGeometry = new THREE.SphereGeometry(1, 8, 8);
    const nebulaGeometry = new THREE.SphereGeometry(1.2, 12, 12);
    const bloomGeometry = new THREE.IcosahedronGeometry(1.0, 1);
    const chromaticGeometry = new THREE.TorusGeometry(1.2, 0.14, 8, 64);
    const distortionGeometry = new THREE.TorusGeometry(1.0, 0.08, 16, 64);

    for (let i = 0; i < poolSize; i++) {
      // Shell mesh
      const shellMat = this._createShellMaterial(this.config.colorHarmonic);
      const shellMesh = new THREE.Mesh(shellGeometry, shellMat);
      shellMesh.visible = false;
      shellMesh.renderOrder = this.config.renderOrder;

      const shellLayers = [];
      for (let layerIndex = 0; layerIndex < this.config.shellLayerCount - 1; layerIndex++) {
        const layerMesh = new THREE.Mesh(shellGeometry, this._createShellMaterial(this.config.colorHarmonic));
        layerMesh.visible = false;
        layerMesh.renderOrder = this.config.renderOrder + 0.1 + layerIndex * 0.05;
        shellLayers.push(layerMesh);
      }

      // Ring mesh
      const ringMat = this._createRingMaterial(this.config.colorHarmonic);
      const ringMesh = new THREE.Mesh(ringGeometry, ringMat);
      ringMesh.visible = false;
      ringMesh.renderOrder = this.config.renderOrder + 1;

      const ringLayers = [];
      for (let layerIndex = 0; layerIndex < this.config.ringLayerCount - 1; layerIndex++) {
        const layerRing = new THREE.Mesh(ringGeometry, this._createRingMaterial(this.config.colorHarmonic));
        layerRing.visible = false;
        layerRing.renderOrder = this.config.renderOrder + 1.1 + layerIndex * 0.05;
        ringLayers.push(layerRing);
      }

      // Ray beams
      const rays = [];
      for (let r = 0; r < this.config.rayCount; r++) {
        const rayMat = this._createBeamMaterial(this.config.colorHarmonic);
        const rayMesh = new THREE.Mesh(beamGeometry, rayMat);
        rayMesh.visible = false;
        rayMesh.renderOrder = this.config.renderOrder + 2;
        rays.push(rayMesh);
      }

      // Energy particles
      const energyGeometry = new THREE.BufferGeometry();
      const energyPositions = new Float32Array(this.config.energyParticleCount * 3);
      for (let p = 0; p < energyPositions.length; p += 3) {
        energyPositions[p] = (Math.random() - 0.5) * 0.4;
        energyPositions[p + 1] = (Math.random() - 0.5) * 0.4;
        energyPositions[p + 2] = (Math.random() - 0.5) * 0.4;
      }
      energyGeometry.setAttribute('position', new THREE.BufferAttribute(energyPositions, 3));
      const energyParticles = new THREE.Points(energyGeometry, this._createParticleMaterial(this.config.colorHarmonic, 0.06));
      energyParticles.visible = false;
      energyParticles.renderOrder = this.config.renderOrder + 2.5;

      // Core sparks
      const coreSparkGeometry = new THREE.BufferGeometry();
      const coreSparkPositions = new Float32Array(this.config.coreSparkCount * 3);
      for (let p = 0; p < coreSparkPositions.length; p += 3) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const radius = 0.2 + Math.random() * 0.15;
        coreSparkPositions[p] = Math.sin(phi) * Math.cos(theta) * radius;
        coreSparkPositions[p + 1] = Math.cos(phi) * radius;
        coreSparkPositions[p + 2] = Math.sin(phi) * Math.sin(theta) * radius;
      }
      coreSparkGeometry.setAttribute('position', new THREE.BufferAttribute(coreSparkPositions, 3));
      // ── Supernova: spectral core sparks instead of plain white ──
      const coreSparkColor = this.config.enableSupernovaUpgrade
        ? new THREE.Color(0xffd700) // Sacred gold sparks
        : new THREE.Color(0xffffff);
      const coreSparks = new THREE.Points(coreSparkGeometry, this._createParticleMaterial(coreSparkColor, 0.08));
      coreSparks.visible = false;
      coreSparks.renderOrder = this.config.renderOrder + 2.5;

      // Bloom aura
      const bloomMesh = new THREE.Mesh(bloomGeometry, this._createBloomMaterial(this.config.colorHarmonic));
      bloomMesh.visible = false;
      bloomMesh.renderOrder = this.config.renderOrder + 0.4;
      bloomMesh.scale.setScalar(this.config.bloomRadius);

      // Chromatic aura
      const chromaticMesh = new THREE.Mesh(chromaticGeometry, this._createChromaticMaterial(this.config.colorHarmonic));
      chromaticMesh.visible = false;
      chromaticMesh.renderOrder = this.config.renderOrder + 0.45;
      chromaticMesh.rotation.x = Math.PI * 0.5;

      // Distortion wave
      const distortionMesh = new THREE.Mesh(distortionGeometry, this._createDistortionMaterial());
      distortionMesh.visible = false;
      distortionMesh.renderOrder = this.config.renderOrder + 0.2;
      distortionMesh.rotation.x = Math.PI * 0.5;

      // Nebula cloud
      const nebulaMesh = new THREE.Mesh(nebulaGeometry, this._createNebulaMaterial(this.config.colorHarmonic));
      nebulaMesh.visible = false;
      nebulaMesh.renderOrder = this.config.renderOrder + 0.5;
      nebulaMesh.scale.setScalar(0.9);

      // Lighting flash
      const flashLight = new THREE.PointLight(this.config.colorHarmonic.clone(), 0.0, this.config.lightingFlashRange, 2);
      flashLight.visible = false;

      // Push force pulse
      const pushWave = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 1), this._createPushForceMaterial(this.config.colorHarmonic));
      pushWave.visible = false;
      pushWave.renderOrder = this.config.renderOrder + 0.25;
      pushWave.material.side = THREE.DoubleSide;

      // Core flash mesh
      const coreMat = this._createCoreMaterial();
      const coreMesh = new THREE.Mesh(coreGeometry, coreMat);
      coreMesh.visible = false;
      coreMesh.renderOrder = this.config.renderOrder + 3;

      // Group
      const group = new THREE.Group();
      group.add(nebulaMesh);
      group.add(bloomMesh);
      group.add(chromaticMesh);
      group.add(distortionMesh);
      group.add(pushWave);
      group.add(flashLight);
      group.add(shellMesh);
      for (const shellLayer of shellLayers) {
        group.add(shellLayer);
      }
      group.add(ringMesh);
      for (const ringLayer of ringLayers) {
        group.add(ringLayer);
      }
      group.add(coreMesh);
      group.add(energyParticles);
      group.add(coreSparks);
      for (const ray of rays) {
        group.add(ray);
      }
      group.visible = false;

      if (this.scene) {
        this.scene.add(group);
      }

      const burstRig = {
        index: i,
        group,
        shell: shellMesh,
        shellLayers,
        ring: ringMesh,
        ringLayers,
        core: coreMesh,
        rays,
        energyParticles,
        coreSparks,
        nebula: nebulaMesh,
        bloom: bloomMesh,
        chromatic: chromaticMesh,
        distortion: distortionMesh,
        flashLight,
        pushWave,
        active: false,
        startTime: 0,
        position: new THREE.Vector3(),
        strength: 0,
        color: this.config.colorHarmonic.clone(),
        duration: this.config.burstDuration,
      };

      this._burstPool.push(burstRig);
      this._freeIndices.push(i);
    }

    this.stats.poolSize = poolSize;
  }

  /**
   * Subscribe to cascade.start semantic events
   */
  _createShellMaterial(baseColor) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: baseColor.clone() },
        uOpacity: { value: 0.0 },
        uStrength: { value: 1.0 },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uStrength;
        varying float vGlow;

        void main() {
          vec3 displaced = position + normal * sin(uTime * 4.0 + position.y * 3.0) * 0.10 * uStrength;
          vGlow = pow(max(0.0, dot(normalize(normal), normalize(vec3(0.0, 1.0, 0.2)))), 2.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uStrength;
        varying float vGlow;

        void main() {
          float rim = pow(1.0 - vGlow, 2.0);
          vec3 color = uColor * (0.6 + 0.4 * vGlow) + vec3(1.0) * 0.2 * rim;
          float alpha = uOpacity * (0.25 + 0.75 * vGlow) * uStrength;
          gl_FragColor = vec4(color, alpha);
          if (gl_FragColor.a < 0.01) discard;
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
  }

  _createRingMaterial(baseColor) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: baseColor.clone() },
        uOpacity: { value: 0.0 },
        uStrength: { value: 1.0 },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uStrength;
        varying vec2 vUv;
        varying float vPulse;

        void main() {
          vUv = uv;
          vPulse = sin(uTime * 6.0 + uv.y * 10.0) * 0.5 + 0.5;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uStrength;
        varying vec2 vUv;
        varying float vPulse;

        void main() {
          float dist = length(vUv - 0.5);
          float ring = smoothstep(0.40, 0.45, dist) * (1.0 - smoothstep(0.45, 0.50, dist));
          float glow = smoothstep(0.32, 0.40, dist) * 0.25;
          float alpha = (ring + glow * vPulse) * uOpacity * uStrength;
          vec3 color = uColor * (0.8 + 0.2 * vPulse) + vec3(1.0) * glow * 0.3;
          gl_FragColor = vec4(color, alpha);
          if (gl_FragColor.a < 0.01) discard;
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
  }

  _createCoreMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0xffffff) },
        uOpacity: { value: 0.0 },
        uStrength: { value: 1.0 },
      },
      vertexShader: `
        uniform float uTime;
        varying float vIntensity;

        void main() {
          vIntensity = pow(max(0.0, dot(normalize(normal), vec3(0.0, 0.0, 1.0))), 2.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uStrength;
        varying float vIntensity;

        void main() {
          vec3 color = uColor * (0.5 + 0.5 * vIntensity) + vec3(1.0) * (1.0 - vIntensity) * 0.25;
          float alpha = uOpacity * (0.40 + 0.60 * vIntensity) * uStrength;
          gl_FragColor = vec4(color, alpha);
          if (gl_FragColor.a < 0.01) discard;
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
  }

  _createRayMaterial(baseColor) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: baseColor.clone() },
        uOpacity: { value: 0.0 },
        uStrength: { value: 1.0 },
      },
      vertexShader: `
        uniform float uTime;
        varying float vPulse;

        void main() {
          vPulse = abs(sin(uTime * 14.0 + position.y * 8.0));
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uStrength;
        varying float vPulse;

        void main() {
          float alpha = uOpacity * mix(0.6, 1.0, vPulse) * uStrength;
          vec3 color = uColor * mix(0.7, 1.0, vPulse);
          gl_FragColor = vec4(color, alpha);
          if (gl_FragColor.a < 0.01) discard;
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      linewidth: 1,
    });
  }

  _createBeamMaterial(baseColor) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: baseColor.clone() },
        uOpacity: { value: 0.0 },
        uStrength: { value: 1.0 },
      },
      vertexShader: `
        uniform float uTime;
        varying float vPulse;

        void main() {
          vPulse = abs(sin(uTime * 8.0 + position.y * 6.0));
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uStrength;
        varying float vPulse;

        void main() {
          float alpha = uOpacity * mix(0.5, 1.0, vPulse) * uStrength;
          vec3 color = uColor * mix(0.7, 1.0, vPulse) + vec3(1.0) * (1.0 - vPulse) * 0.15;
          gl_FragColor = vec4(color, alpha);
          if (gl_FragColor.a < 0.01) discard;
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
  }

  _createParticleMaterial(baseColor, size) {
    return new THREE.PointsMaterial({
      color: baseColor.clone(),
      size,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      sizeAttenuation: true,
      map: getEnvSpriteTexture('plasma'),
      alphaTest: 0.02
    });
  }

  _createNebulaMaterial(baseColor) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: baseColor.clone() },
        uOpacity: { value: 0.0 },
        uStrength: { value: 1.0 },
      },
      vertexShader: `
        varying vec3 vPosition;

        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uStrength;
        varying vec3 vPosition;

        void main() {
          float radial = smoothstep(1.2, 0.5, length(vPosition));
          vec3 color = uColor * 0.4 + vec3(1.0) * 0.2 * radial;
          float alpha = uOpacity * radial * uStrength;
          gl_FragColor = vec4(color, alpha);
          if (gl_FragColor.a < 0.01) discard;
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
  }

  _createBloomMaterial(baseColor) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: baseColor.clone() },
        uOpacity: { value: 0.0 },
        uStrength: { value: 1.0 },
      },
      vertexShader: `
        uniform float uTime;
        varying float vPulse;

        void main() {
          vPulse = sin(uTime * 5.0 + position.y * 3.0) * 0.5 + 0.5;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uStrength;
        varying float vPulse;

        void main() {
          float alpha = uOpacity * (0.4 + 0.6 * vPulse) * uStrength;
          vec3 color = uColor * (0.6 + 0.4 * vPulse) + vec3(1.0) * 0.3 * (1.0 - vPulse);
          gl_FragColor = vec4(color, alpha);
          if (gl_FragColor.a < 0.01) discard;
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
  }

  _createChromaticMaterial(baseColor) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: baseColor.clone() },
        uOpacity: { value: 0.0 },
        uStrength: { value: 1.0 },
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uStrength;
        varying vec2 vUv;

        void main() {
          float offset = sin(uTime * 4.0 + length(vUv - 0.5) * 12.0) * 0.02 * uStrength;
          vec3 color = vec3(
            uColor.r * smoothstep(0.4, 0.7, vUv.x + offset),
            uColor.g * smoothstep(0.45, 0.75, vUv.x),
            uColor.b * smoothstep(0.5, 0.8, vUv.x - offset)
          );
          float radial = 1.0 - smoothstep(0.25, 0.5, length(vUv - 0.5));
          float alpha = uOpacity * radial * uStrength;
          gl_FragColor = vec4(color, alpha);
          if (gl_FragColor.a < 0.01) discard;
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
  }

  _createDistortionMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0.0 },
        uStrength: { value: 1.0 },
      },
      vertexShader: `
        uniform float uTime;
        varying float vPulse;

        void main() {
          vPulse = sin(uTime * 4.0 + position.y * 6.0) * 0.5 + 0.5;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        uniform float uStrength;
        varying float vPulse;

        void main() {
          float alpha = uOpacity * (0.4 + 0.6 * vPulse) * uStrength;
          gl_FragColor = vec4(vec3(1.0), alpha);
          if (gl_FragColor.a < 0.01) discard;
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
  }

  _createPushForceMaterial(baseColor) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: baseColor.clone() },
        uOpacity: { value: 0.0 },
        uStrength: { value: 1.0 },
      },
      vertexShader: `
        uniform float uTime;
        varying float vPulse;

        void main() {
          vPulse = abs(sin(uTime * 6.0 + position.y * 4.0));
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uStrength;
        varying float vPulse;

        void main() {
          float alpha = uOpacity * (0.2 + 0.8 * vPulse) * uStrength;
          vec3 color = uColor * 0.6 + vec3(1.0) * 0.4 * vPulse;
          gl_FragColor = vec4(color, alpha);
          if (gl_FragColor.a < 0.01) discard;
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
  }

  _triggerBurstSound(rig) {
    if (!this.config.soundEnabled || typeof window === 'undefined' || typeof window.AudioContext === 'undefined' && typeof window.webkitAudioContext === 'undefined') {
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    try {
      if (!this._audioContext) {
        this._audioContext = new AudioContext();
      }
      const audioContext = this._audioContext;
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
      }

      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const baseFreq = 220 + rig.strength * 420;
      osc.type = 'sine';
      osc.frequency.value = baseFreq;
      gain.gain.setValueAtTime(0, audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(this.config.soundVolume * 0.075 * rig.strength, audioContext.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.35);
      osc.connect(gain).connect(audioContext.destination);
      osc.start(audioContext.currentTime);
      osc.stop(audioContext.currentTime + 0.35);
    } catch (error) {
      // Audio may be blocked by browser policy; ignore safely.
    }
  }

  _subscribeCascadeEvents() {
    const bus = this.semanticBus || globalThis?.semanticBus;
    if (!bus?.on) return;

    this._boundCascadeStart = (event) => {
      if (!this.config.enabled) return;
      const position = event.sourcePosition || event.position;
      const strength = Math.max(0, Math.min(1, event.strength || event.intensity || 0));

      if (position && strength > 0.3) {
        this._vec3A.set(position.x || 0, position.y || 0, position.z || 0);
        this.triggerBurst(this._vec3A, strength);
      }
    };

    bus.on('cascade.start', this._boundCascadeStart);

    // ── Stability Low Burst Subscription ──
    // Triggers burst when a node's stability drops below threshold
    // Cooldown: 2 seconds between stability-triggered bursts
    this._boundStabilityLow = (event) => {
      if (!this.config.enabled) return;

      const now = performance.now() * 0.001;
      if (now < this._stabilityBurstCooldownUntil) return; // Cooldown active

      const position = event.sourcePosition || event.position || (event.node?.position);
      const strength = Math.max(0.4, Math.min(1, event.value || event.strength || 0.5));

      if (position) {
        this._vec3A.set(position.x || 0, position.y || 0, position.z || 0);
        this.triggerBurst(this._vec3A, strength);

        // Set cooldown
        this._stabilityBurstCooldownUntil = now + STABILITY_BURST_COOLDOWN;
      }
    };

    bus.on('node.stability.low', this._boundStabilityLow);
    this._semanticBusAttached = bus;
  }

  /**
   * Trigger a burst at the given position
   * @param {THREE.Vector3} position
   * @param {number} strength - 0 to 1
   * @param {THREE.Color} [color] - Optional override color
   */
  triggerBurst(position, strength, color = null) {
    if (!this.config.enabled) return;
    if (this._freeIndices.length === 0) return; // Pool exhausted

    const index = this._freeIndices.pop();
    const rig = this._burstPool[index];

    rig.active = true;
    rig.startTime = performance.now() * 0.001;
    rig.position.copy(position);
    rig.strength = Math.max(0.3, Math.min(1, strength));
    rig.duration = this.config.burstDuration * (0.8 + rig.strength * 0.4);

    // Determine color based on strength
    if (color) {
      rig.color.copy(color);
    } else if (rig.strength > 0.7) {
      // High strength = warm gold (synergy)
      rig.color.copy(this.config.colorSynergy);
    } else {
      // Normal = cyan-white (harmonic)
      rig.color.copy(this.config.colorHarmonic);
    }

    // Position the group
    rig.group.position.copy(position);
    rig.group.visible = true;

    // Initialize nebula
    rig.nebula.material.uniforms.uColor.value.copy(rig.color);
    rig.nebula.material.uniforms.uOpacity.value = 0;
    rig.nebula.material.uniforms.uStrength.value = rig.strength;
    rig.nebula.scale.setScalar(0.9);
    rig.nebula.visible = true;

    // Initialize bloom
    rig.bloom.material.uniforms.uColor.value.copy(rig.color);
    rig.bloom.material.uniforms.uOpacity.value = 0;
    rig.bloom.material.uniforms.uStrength.value = rig.strength;
    rig.bloom.scale.setScalar(this.config.bloomRadius);
    rig.bloom.visible = true;

    // Initialize chromatic aura
    rig.chromatic.material.uniforms.uColor.value.copy(rig.color);
    rig.chromatic.material.uniforms.uOpacity.value = 0;
    rig.chromatic.material.uniforms.uStrength.value = this.config.chromaticStrength;
    rig.chromatic.visible = true;

    // Initialize distortion wave
    rig.distortion.material.uniforms.uOpacity.value = 0;
    rig.distortion.material.uniforms.uStrength.value = rig.strength;
    rig.distortion.scale.setScalar(1.0);
    rig.distortion.visible = true;

    // Initialize lighting flash
    rig.flashLight.color.copy(rig.color);
    rig.flashLight.intensity = 0;
    rig.flashLight.distance = this.config.lightingFlashRange;
    rig.flashLight.visible = true;

    // Initialize push force wave
    rig.pushWave.material.uniforms.uColor.value.copy(rig.color);
    rig.pushWave.material.uniforms.uOpacity.value = 0;
    rig.pushWave.material.uniforms.uStrength.value = rig.strength;
    rig.pushWave.scale.setScalar(0.8);
    rig.pushWave.visible = true;

    this._triggerBurstSound(rig);

    // Initialize shell
    rig.shell.material.uniforms.uColor.value.copy(rig.color);
    rig.shell.material.uniforms.uOpacity.value = 0;
    rig.shell.material.uniforms.uStrength.value = rig.strength;
    rig.shell.scale.setScalar(0.1);
    rig.shell.visible = true;
    for (let layerIndex = 0; layerIndex < rig.shellLayers.length; layerIndex++) {
      const layerMesh = rig.shellLayers[layerIndex];
      layerMesh.material.uniforms.uColor.value.copy(rig.color);
      layerMesh.material.uniforms.uOpacity.value = 0;
      layerMesh.material.uniforms.uStrength.value = rig.strength;
      layerMesh.scale.setScalar(0.1 + (layerIndex + 1) * 0.08);
      layerMesh.visible = true;
    }

    // Initialize ring
    rig.ring.material.uniforms.uColor.value.copy(rig.color);
    rig.ring.material.uniforms.uOpacity.value = 0;
    rig.ring.material.uniforms.uStrength.value = rig.strength;
    rig.ring.scale.setScalar(0.1);
    rig.ring.rotation.x = Math.PI * 0.5; // Horizontal
    rig.ring.visible = true;
    for (let layerIndex = 0; layerIndex < rig.ringLayers.length; layerIndex++) {
      const layerRing = rig.ringLayers[layerIndex];
      layerRing.material.uniforms.uColor.value.copy(rig.color);
      layerRing.material.uniforms.uOpacity.value = 0;
      layerRing.material.uniforms.uStrength.value = rig.strength;
      layerRing.scale.setScalar(0.1 + (layerIndex + 1) * 0.08);
      layerRing.rotation.x = Math.PI * 0.5;
      layerRing.visible = true;
    }

    // Initialize core
    rig.core.material.uniforms.uOpacity.value = 0;
    rig.core.material.uniforms.uStrength.value = rig.strength;
    rig.core.scale.setScalar(0.1);
    rig.core.visible = true;

    // Initialize particles
    rig.energyParticles.material.color.copy(rig.color);
    rig.energyParticles.material.opacity = 0;
    rig.energyParticles.visible = true;

    rig.coreSparks.material.opacity = 0;
    rig.coreSparks.visible = true;

    // Initialize rays
    const up = new THREE.Vector3(0, 1, 0);
    for (let r = 0; r < rig.rays.length; r++) {
      const ray = rig.rays[r];
      ray.material.uniforms.uColor.value.copy(rig.color);
      ray.material.uniforms.uOpacity.value = 0;
      ray.material.uniforms.uStrength.value = rig.strength;
      ray.visible = true;

      const angle = (r / rig.rays.length) * Math.PI * 2;
      const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
      const len = this.config.rayLength * rig.strength;
      ray.position.set(0, 0, 0);
      ray.scale.set(1, len, 1);
      ray.quaternion.setFromUnitVectors(up, dir);
    }

    this._activeBursts.push(rig);
    this.stats.burstsTriggered++;
    this.stats.activeBursts = this._activeBursts.length;
  }

  /**
   * Update all active bursts
   * @param {number} deltaTime
   * @param {THREE.Camera} [camera] - For LOD
   */
  update(deltaTime, camera = null) {
    if (!this.config.enabled) return;

    // ── Supernova: advance spectral phase ──
    if (this.config.enableSupernovaUpgrade) {
      this._supernovaPhase = (this._supernovaPhase + deltaTime * this.config.supernovaCycleSpeed) % 1.0;
    }

    const now = performance.now() * 0.001;
    const toRemove = [];

    for (let i = 0; i < this._activeBursts.length; i++) {
      const rig = this._activeBursts[i];
      const elapsed = now - rig.startTime;
      const t = Math.min(1, elapsed / rig.duration); // 0→1 progress

      if (t >= 1) {
        // Burst complete — recycle
        this._recycleBurst(rig);
        toRemove.push(i);
        continue;
      }

      // Easing: fast attack, slow decay
      const attackT = Math.min(1, t * 4); // 0→1 in first 25% of duration
      const decayT = Math.max(0, 1 - t); // 1→0 linear

      // LOD: reduce quality at distance
      let lodScale = 1.0;
      if (camera) {
        const dist = camera.position.distanceTo(rig.position);
        if (dist > this.config.lodFarDistance) {
          lodScale = 0.3;
        } else if (dist > this.config.lodNearDistance) {
          const lodT = (dist - this.config.lodNearDistance) / (this.config.lodFarDistance - this.config.lodNearDistance);
          lodScale = 1.0 - lodT * 0.7;
        }
      }

      // ── Nebula animation ──
      const nebulaScale = 0.9 + attackT * 0.35 * lodScale;
      rig.nebula.scale.setScalar(Math.max(0.9, nebulaScale));
      rig.nebula.material.uniforms.uTime.value = now;
      rig.nebula.material.uniforms.uOpacity.value = this.config.nebulaOpacity * attackT * decayT * rig.strength;
      rig.nebula.material.uniforms.uStrength.value = rig.strength;

      // ── Bloom animation ──
      const bloomScale = this.config.bloomRadius * (0.8 + attackT * 0.4);
      rig.bloom.scale.setScalar(Math.max(0.9, bloomScale));
      rig.bloom.material.uniforms.uTime.value = now;
      rig.bloom.material.uniforms.uOpacity.value = this.config.bloomEnabled ? this.config.bloomIntensity * attackT * decayT * rig.strength * 0.6 : 0;
      rig.bloom.material.uniforms.uStrength.value = rig.strength;

      // ── Chromatic aura animation ──
      rig.chromatic.material.uniforms.uTime.value = now;
      rig.chromatic.material.uniforms.uOpacity.value = this.config.chromaticEnabled ? this.config.chromaticStrength * attackT * decayT * rig.strength * 0.5 : 0;
      rig.chromatic.rotation.z += deltaTime * 0.8;

      // ── Distortion wave animation ──
      const distortionScale = Math.min(this.config.distortionMaxRadius, 0.8 + attackT * this.config.distortionMaxRadius);
      rig.distortion.scale.setScalar(distortionScale);
      rig.distortion.material.uniforms.uTime.value = now;
      rig.distortion.material.uniforms.uOpacity.value = this.config.distortionEnabled ? this.config.distortionOpacity * decayT * rig.strength : 0;
      rig.distortion.material.uniforms.uStrength.value = rig.strength;

      // ── Lighting flash animation ──
      const flashIntensity = this.config.lightingFlashEnabled ? this.config.lightingFlashIntensity * coreIntensity * rig.strength * 2.0 : 0;
      rig.flashLight.intensity = flashIntensity;
      rig.flashLight.distance = this.config.lightingFlashRange;
      rig.flashLight.color.copy(rig.color);

      // ── Push force wave animation ──
      const pushScale = 0.8 + attackT * this.config.pushForceRadius * 0.55;
      rig.pushWave.scale.setScalar(pushScale * lodScale);
      rig.pushWave.material.uniforms.uTime.value = now;
      rig.pushWave.material.uniforms.uOpacity.value = this.config.pushForceEnabled ? this.config.pushForceStrength * attackT * decayT * rig.strength * 0.45 : 0;
      rig.pushWave.material.uniforms.uStrength.value = rig.strength;

      // ── Shell animation ──
      const shellScale = rig.strength * this.config.shellMaxRadius * attackT * lodScale;
      rig.shell.scale.setScalar(Math.max(0.01, shellScale));
      rig.shell.material.uniforms.uTime.value = now;
      rig.shell.material.uniforms.uOpacity.value = this.config.shellOpacity * decayT * rig.strength;
      rig.shell.material.uniforms.uStrength.value = rig.strength;
      rig.shell.rotation.y += deltaTime * 0.5;
      rig.shell.rotation.x += deltaTime * 0.3;
      for (let layerIndex = 0; layerIndex < rig.shellLayers.length; layerIndex++) {
        const shellLayer = rig.shellLayers[layerIndex];
        const scaleFactor = shellScale * (0.95 + layerIndex * 0.15);
        shellLayer.scale.setScalar(Math.max(0.01, scaleFactor));
        shellLayer.material.uniforms.uTime.value = now;
        shellLayer.material.uniforms.uOpacity.value = this.config.shellOpacity * decayT * rig.strength * 0.75;
        shellLayer.material.uniforms.uStrength.value = rig.strength;
        shellLayer.rotation.y += deltaTime * (0.6 + layerIndex * 0.1);
      }

      // ── Ring animation ──
      const ringScale = rig.strength * this.config.ringMaxRadius * attackT * lodScale;
      rig.ring.scale.setScalar(Math.max(0.01, ringScale));
      rig.ring.material.uniforms.uTime.value = now;
      rig.ring.material.uniforms.uOpacity.value = this.config.ringOpacity * decayT * rig.strength;
      rig.ring.material.uniforms.uStrength.value = rig.strength;
      for (let layerIndex = 0; layerIndex < rig.ringLayers.length; layerIndex++) {
        const ringLayer = rig.ringLayers[layerIndex];
        ringLayer.scale.setScalar(Math.max(0.01, ringScale * (0.9 + layerIndex * 0.10)));
        ringLayer.material.uniforms.uTime.value = now;
        ringLayer.material.uniforms.uOpacity.value = this.config.ringOpacity * decayT * rig.strength * 0.7;
        ringLayer.material.uniforms.uStrength.value = rig.strength;
      }

      // ── Core flash ──
      const coreIntensity = Math.max(0, 1 - t * 3);
      const coreScale = this.config.coreFlashSize * coreIntensity * rig.strength * lodScale;
      rig.core.scale.setScalar(Math.max(0.01, coreScale));
      rig.core.material.uniforms.uTime.value = now;
      rig.core.material.uniforms.uOpacity.value = this.config.coreFlashOpacity * coreIntensity * rig.strength;
      rig.core.material.uniforms.uStrength.value = rig.strength;

      // ── Particle animation ──
      rig.energyParticles.material.opacity = Math.min(1.0, this.config.rayOpacity * attackT * decayT * rig.strength * 1.4);
      rig.energyParticles.scale.setScalar(1.0 + attackT * 0.25);
      rig.coreSparks.material.opacity = Math.min(1.0, this.config.coreFlashOpacity * coreIntensity * rig.strength * 1.2);
      rig.coreSparks.scale.setScalar(1.0 + attackT * 0.2);

      // ── Rays animation ──
      const rayOpacity = this.config.rayOpacity * decayT * rig.strength * lodScale;
      const rayLength = this.config.rayLength * rig.strength * (0.8 + attackT * 0.4);
      for (const ray of rig.rays) {
        ray.material.uniforms.uTime.value = now;
        ray.material.uniforms.uOpacity.value = rayOpacity;
        ray.material.uniforms.uStrength.value = rig.strength;
        ray.scale.set(1, Math.max(0.01, rayLength), 1);
      }
    }

    // Remove completed bursts (reverse order to preserve indices)
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this._activeBursts.splice(toRemove[i], 1);
    }
    this.stats.activeBursts = this._activeBursts.length;
  }

  /**
   * Recycle a burst rig back to the pool
   */
  _recycleBurst(rig) {
    rig.active = false;
    rig.group.visible = false;
    rig.shell.visible = false;
    for (const shellLayer of rig.shellLayers) {
      shellLayer.visible = false;
    }
    rig.ring.visible = false;
    for (const ringLayer of rig.ringLayers) {
      ringLayer.visible = false;
    }
    rig.core.visible = false;
    rig.energyParticles.visible = false;
    rig.coreSparks.visible = false;
    rig.nebula.visible = false;
    rig.bloom.visible = false;
    rig.chromatic.visible = false;
    rig.distortion.visible = false;
    rig.flashLight.visible = false;
    rig.pushWave.visible = false;
    for (const ray of rig.rays) {
      ray.visible = false;
    }
    this._freeIndices.push(rig.index);
  }

  /**
   * Dispose all resources
   */
  dispose() {
    // Unsubscribe from semantic bus
    const bus = this._semanticBusAttached || globalThis?.semanticBus;
    if (bus?.off && this._boundCascadeStart) {
      bus.off('cascade.start', this._boundCascadeStart);
    }
    if (bus?.off && this._boundStabilityLow) {
      bus.off('node.stability.low', this._boundStabilityLow);
    }

    // Remove all meshes from scene
    for (const rig of this._burstPool) {
      if (this.scene) {
        this.scene.remove(rig.group);
      }
      // Dispose materials
      rig.shell.material.dispose();
      rig.ring.material.dispose();
      rig.core.material.dispose();
      rig.nebula.material.dispose();
      rig.bloom.material.dispose();
      rig.chromatic.material.dispose();
      rig.distortion.material.dispose();
      for (const shellLayer of rig.shellLayers) {
        shellLayer.material.dispose();
      }
      for (const ringLayer of rig.ringLayers) {
        ringLayer.material.dispose();
      }
      for (const ray of rig.rays) {
        ray.material.dispose();
      }
      rig.energyParticles.material.dispose();
      rig.coreSparks.material.dispose();
      rig.pushWave.material.dispose();
    }

    this._burstPool.length = 0;
    this._activeBursts.length = 0;
    this._freeIndices.length = 0;
    this.stats.poolSize = 0;
    this.stats.activeBursts = 0;
  }

  /**
   * Setup console API
   */
  setupConsoleAPI(globalWindow) {
    if (!globalWindow) return;

    globalWindow.cascadeBurst_info = () => {
      console.log('=== CASCADE BURST VISUAL ===');
      console.log(`Enabled: ${this.config.enabled}`);
      console.log(`Pool size: ${this.stats.poolSize}`);
      console.log(`Active bursts: ${this.stats.activeBursts}`);
      console.log(`Total triggered: ${this.stats.burstsTriggered}`);
      console.log(`Free slots: ${this._freeIndices.length}`);
    };

    globalWindow.cascadeBurst_trigger = (x = 0, y = 2, z = 0, strength = 0.8) => {
      this.triggerBurst(new THREE.Vector3(x, y, z), strength);
    };

    globalWindow.cascadeBurst_toggle = (enabled) => {
      this.config.enabled = enabled !== undefined ? enabled : !this.config.enabled;
      console.log(`[CascadeBurst] ${this.config.enabled ? 'enabled' : 'disabled'}`);
    };
  }
}
