import * as THREE from 'three';
import VisualTime from './src/time/VisualTime.js';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

const WORLD_BACKGROUND_ORDER = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_WORLD_BACKGROUND);
const WORLD_OVERLAY_ORDER = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_WORLD_OVERLAY);

const HORIZON_WORLD_PROFILE = {
  default: {
    colors: {
      base: 0x071c26,
      horizon: 0x2f7ea5,
      memory: 0x66f6ff,
      scar: 0x8d5cff,
      glow: 0x66f6ff,
      veilStartHue: 0.53,
      crownStartHue: 0.53
    },
    motion: {
      waveSpeedMul: 1.0,
      waveAmplitudeMul: 1.0,
      phaseDrift: 0.08,
      shearStrength: 0.06,
      verticalLift: 0.04,
      archivalPulse: 1.0,
      crownSpinMul: 1.0,
      seamFlickerMul: 1.0
    }
  },
  quantum: {
    colors: {
      base: 0x11152e,
      horizon: 0x5d66d6,
      memory: 0x70ffe5,
      scar: 0xd06dff,
      glow: 0x8da6ff,
      veilStartHue: 0.6,
      crownStartHue: 0.64
    },
    motion: {
      waveSpeedMul: 1.18,
      waveAmplitudeMul: 1.12,
      phaseDrift: 0.34,
      shearStrength: 0.1,
      verticalLift: 0.06,
      archivalPulse: 1.04,
      crownSpinMul: 1.15,
      seamFlickerMul: 1.12
    }
  },
  memory: {
    colors: {
      base: 0x0a1824,
      horizon: 0x5f93b4,
      memory: 0xa4f3ff,
      scar: 0xffd37a,
      glow: 0x8bdfff,
      veilStartHue: 0.5,
      crownStartHue: 0.46
    },
    motion: {
      waveSpeedMul: 0.72,
      waveAmplitudeMul: 0.96,
      phaseDrift: 0.06,
      shearStrength: 0.04,
      verticalLift: 0.05,
      archivalPulse: 0.62,
      crownSpinMul: 0.74,
      seamFlickerMul: 0.7
    }
  },
  sigma: {
    colors: {
      base: 0x050915,
      horizon: 0x22c8d6,
      memory: 0x7dffb3,
      scar: 0xff5de4,
      glow: 0x39e9ff,
      veilStartHue: 0.49,
      crownStartHue: 0.36
    },
    motion: {
      waveSpeedMul: 1.06,
      waveAmplitudeMul: 1.14,
      phaseDrift: 0.18,
      shearStrength: 0.32,
      verticalLift: 0.05,
      archivalPulse: 1.1,
      crownSpinMul: 1.22,
      seamFlickerMul: 1.42
    }
  },
  desert: {
    colors: {
      base: 0x17111a,
      horizon: 0xb6876b,
      memory: 0x8ef6ff,
      scar: 0xffb786,
      glow: 0xffd3a2,
      veilStartHue: 0.08,
      crownStartHue: 0.12
    },
    motion: {
      waveSpeedMul: 0.88,
      waveAmplitudeMul: 1.08,
      phaseDrift: 0.1,
      shearStrength: 0.05,
      verticalLift: 0.22,
      archivalPulse: 0.86,
      crownSpinMul: 0.92,
      seamFlickerMul: 0.82
    }
  },
  desert2: {
    colors: {
      base: 0x1b111c,
      horizon: 0xc1918e,
      memory: 0xa7f8ff,
      scar: 0xffa3d6,
      glow: 0xffddb9,
      veilStartHue: 0.98,
      crownStartHue: 0.04
    },
    motion: {
      waveSpeedMul: 0.82,
      waveAmplitudeMul: 1.06,
      phaseDrift: 0.12,
      shearStrength: 0.05,
      verticalLift: 0.24,
      archivalPulse: 0.82,
      crownSpinMul: 0.88,
      seamFlickerMul: 0.8
    }
  },
  fractal: {
    colors: {
      base: 0x07161a,
      horizon: 0x5fa8b2,
      memory: 0x95ffd7,
      scar: 0xb883ff,
      glow: 0x71e7ff,
      veilStartHue: 0.45,
      crownStartHue: 0.58
    },
    motion: {
      waveSpeedMul: 0.94,
      waveAmplitudeMul: 1.1,
      phaseDrift: 0.14,
      shearStrength: 0.08,
      verticalLift: 0.08,
      archivalPulse: 0.9,
      crownSpinMul: 1.02,
      seamFlickerMul: 0.92
    }
  }
};

/**
 * ============================================================================
 * COGNITIVE HORIZON PLANE (Session 112)
 * ============================================================================
 * A semi-transparent dream-like reference plane that provides spatial context
 * without being a physical terrain.
 * 
 * VISUAL DESIGN:
 * - Subtle procedural grid/lattice pattern
 * - Slow energy waves across surface
 * - Soft glow gradients toward horizon
 * - Very faint node reflections
 * - Deep blue to teal with cyan/violet hints
 * - Semi-transparent, minimal emissive
 * 
 * FUNCTIONAL ROLE:
 * - Provides scale and orientation
 * - Anchors nodes in shared dream-space
 * - Never visually competes with nodes
 * - Feels like collective subconscious surface
 */

export class CognitiveHorizonPlane {
  constructor(parent, camera) {
    this.parent = parent;
    this.camera = camera;
    this.worldProfile = this._resolveWorldProfile();
    this.time = 0;
    this._timeOrigin = undefined;
    this._targetMemoryPressure = 0;
    this._currentMemoryPressure = 0;
    this._lastMemoryScarTime = -Infinity;
    this._memoryScars = [];
    this._lastRealityTideTime = -Infinity;
    this._realityTides = [];
    this._horizonVeils = [];
    this._realitySeams = [];
    this._horizonCrownMeshes = [];
    this._horizonCrownRing = null;
    this.semanticBus = this._resolveSemanticBus();
    this._semanticSubscriptions = [];
    this._residueCoupling = {
      pressureBoost: 0,
      ttl: 0,
      maxTtl: 0
    };
    
    // Plane configuration
    this.config = {
      size: 420,
      segments: 128,
      surfaceY: -10,
      distortion: 0.18,
      waveSpeed: 0.08,
      waveAmplitude: 0.024,
      opacity: 0.24,
      emissiveIntensity: 0.14,
      gridOpacity: 0.08,
      reflectionOpacity: 0.065,
      memoryScarLifetime: 8.5,
      memoryScarCooldown: 0.85,
      memoryScarLimit: 16,
      realityTideLifetime: 11.0,
      realityTideCooldown: 1.2,
      realityTideLimit: 10,
      crownRadiusScale: 0.43,
      crownCount: 12,
      crownHeight: 18,
      crownPulse: 0.22,
      veilCount: 3,
      seamCount: 7
    };
    
    // Create materials
    this.materials = this.createMaterials();
    
    // Create plane
    this.planeGroup = new THREE.Group();
    this.planeGroup.renderOrder = WORLD_BACKGROUND_ORDER;
    this.planeGroup.userData = {
      isCognitiveHorizonRoot: true,
      __environmentLayerId: 'CognitiveHorizonPlane',
      __environmentOwner: 'CognitiveHorizonPlane',
      isWorldFX: true
    };
    this.memoryScarsGroup = new THREE.Group();
    this.memoryScarsGroup.userData = { isMemoryScars: true, isWorldFX: true };
    this.memoryScarsGroup.renderOrder = WORLD_OVERLAY_ORDER;
    this.realityTidesGroup = new THREE.Group();
    this.realityTidesGroup.userData = { isRealityTides: true, isWorldFX: true };
    this.realityTidesGroup.renderOrder = WORLD_OVERLAY_ORDER;
    this.horizonVeilsGroup = new THREE.Group();
    this.horizonVeilsGroup.userData = { isHorizonVeils: true, isWorldFX: true };
    this.horizonVeilsGroup.renderOrder = WORLD_OVERLAY_ORDER;
    this.realitySeamsGroup = new THREE.Group();
    this.realitySeamsGroup.userData = { isRealitySeams: true, isWorldFX: true };
    this.realitySeamsGroup.renderOrder = WORLD_OVERLAY_ORDER;
    this.planeGroup.add(this.memoryScarsGroup);
    this.planeGroup.add(this.realityTidesGroup);
    this.planeGroup.add(this.horizonVeilsGroup);
    this.planeGroup.add(this.realitySeamsGroup);
    this.createHorizonPlane();
    this.createGridOverlay();
    this.createGlowGradient();
    this.createHorizonVeils();
    this.createRealitySeams();
    this.createHorizonCrown();
    this._applyWorldProfile();
    this._setupResidueCoupling();
    
    this.parent.add(this.planeGroup);
  }
  
  /**
   * Resolve world profile from current world mode markers on parent/scene roots
   */
  _resolveWorldModeKey() {
    const rootMode = this.parent?.userData?.currentMode
      || this.parent?.parent?.userData?.currentMode
      || this.camera?.parent?.userData?.currentMode
      || 'default';

    const normalized = typeof rootMode === 'string' ? rootMode.toLowerCase() : 'default';
    if (normalized === 'quantum') return 'quantum';
    if (normalized === 'memory') return 'memory';
    if (normalized === 'sigma') return 'sigma';
    if (normalized === 'desert') return 'desert';
    if (normalized === 'desert2' || normalized === 'chamber') return 'desert2';
    if (normalized === 'fractal') return 'fractal';
    return 'default';
  }

  _resolveWorldProfile() {
    const modeKey = this._resolveWorldModeKey();
    const profile = HORIZON_WORLD_PROFILE[modeKey] || HORIZON_WORLD_PROFILE.default;
    return {
      modeKey,
      colors: { ...profile.colors },
      motion: { ...profile.motion }
    };
  }

  _resolveSemanticBus() {
    if (globalThis?.ATOMA_BUS || globalThis?.semanticBus) {
      return globalThis.ATOMA_BUS || globalThis.semanticBus || null;
    }
    const browserWindow = typeof window !== 'undefined' ? window : null;
    return browserWindow?.ATOMA_BUS || browserWindow?.semanticBus || null;
  }

  _setupResidueCoupling() {
    const bus = this.semanticBus;
    if (!bus) return;

    const handler = (payload = {}) => {
      this._applyResidueCoupling(payload);
    };

    if (typeof bus.on === 'function') {
      bus.on('environment.hazard.residueScar', handler);
      this._semanticSubscriptions.push({
        eventName: 'environment.hazard.residueScar',
        handler,
        method: 'off'
      });
      return;
    }

    if (typeof bus.subscribe === 'function') {
      bus.subscribe('environment.hazard.residueScar', handler);
      this._semanticSubscriptions.push({
        eventName: 'environment.hazard.residueScar',
        handler,
        method: 'unsubscribe'
      });
    }
  }

  _ensureResidueCouplingSubscription() {
    if (this._semanticSubscriptions.length > 0) return;
    if (!this.semanticBus) {
      this.semanticBus = this._resolveSemanticBus();
    }
    if (!this.semanticBus) return;
    this._setupResidueCoupling();
  }

  _detachResidueCoupling() {
    const bus = this.semanticBus;
    if (!bus || !this._semanticSubscriptions.length) return;

    for (const subscription of this._semanticSubscriptions) {
      if (subscription.method === 'off' && typeof bus.off === 'function') {
        bus.off(subscription.eventName, subscription.handler);
      } else if (subscription.method === 'unsubscribe' && typeof bus.unsubscribe === 'function') {
        bus.unsubscribe(subscription.eventName, subscription.handler);
      }
    }
    this._semanticSubscriptions = [];
  }

  _resolveCurrentWorldModeRaw() {
    const raw = this.parent?.userData?.currentMode
      || this.parent?.parent?.userData?.currentMode
      || this.camera?.parent?.userData?.currentMode
      || this.worldProfile?.modeKey
      || 'default';
    return typeof raw === 'string' ? raw.toLowerCase() : 'default';
  }

  _matchesResidueWorld(payload) {
    const localRaw = this._resolveCurrentWorldModeRaw();
    const payloadRaw = typeof payload?.worldModeRaw === 'string' ? payload.worldModeRaw.toLowerCase() : null;
    if (payloadRaw) {
      return payloadRaw === localRaw;
    }

    const payloadMode = typeof payload?.worldModeKey === 'string' ? payload.worldModeKey.toLowerCase() : null;
    if (!payloadMode) return true;
    if (payloadMode === localRaw) return true;
    if (payloadMode === 'default' && localRaw !== 'sigma' && localRaw !== 'memory') return true;
    return false;
  }

  _applyResidueCoupling(payload = {}) {
    if (!this._matchesResidueWorld(payload)) return;

    const coupling = payload?.coupling || {};
    const fallbackInfluence = THREE.MathUtils.clamp(
      0.18 + (payload?.intensity || 0) * 0.22 + (payload?.radius || 0) * 0.006,
      0.18,
      0.9
    );
    const influence = THREE.MathUtils.clamp(
      Number.isFinite(coupling.horizonPressure) ? coupling.horizonPressure : fallbackInfluence,
      0.12,
      0.95
    );
    const duration = THREE.MathUtils.clamp(
      Number.isFinite(coupling.duration) ? coupling.duration : 3.2,
      1.4,
      8.5
    );

    this._targetMemoryPressure = Math.max(this._targetMemoryPressure, influence);
    this._currentMemoryPressure = Math.max(this._currentMemoryPressure, influence * 0.58);
    this._residueCoupling.pressureBoost = Math.max(this._residueCoupling.pressureBoost, influence * 0.66);
    this._residueCoupling.ttl = Math.max(this._residueCoupling.ttl, duration);
    this._residueCoupling.maxTtl = Math.max(this._residueCoupling.maxTtl, duration);

    const x = Number(payload?.position?.x);
    const z = Number(payload?.position?.z);
    if (!Number.isFinite(x) || !Number.isFinite(z)) return;

    const focusPoint = new THREE.Vector3(x, this.config.surfaceY + 0.03, z);
    const scarColor = new THREE.Color(this.worldProfile?.colors?.scar || 0x8d5cff);
    if (payload?.hazardType === 'electricalStorm') {
      scarColor.lerp(new THREE.Color(this.worldProfile?.colors?.horizon || 0x66f6ff), 0.22);
    } else if (payload?.hazardType === 'chronoBloom') {
      scarColor.lerp(new THREE.Color(this.worldProfile?.colors?.memory || 0xa4f3ff), 0.34);
    }

    this._spawnMemoryScar(focusPoint, THREE.MathUtils.clamp(influence * 0.92, 0.2, 0.95), scarColor);
    if (influence >= 0.42) {
      this._spawnRealityTide(focusPoint, THREE.MathUtils.clamp(influence * 0.86, 0.28, 0.9), scarColor);
    }
  }

  _applyWorldProfile() {
    this.worldProfile = this._resolveWorldProfile();

    if (this.materials?.horizon?.uniforms) {
      this.materials.horizon.uniforms.baseColor.value.setHex(this.worldProfile.colors.base);
      this.materials.horizon.uniforms.horizonColor.value.setHex(this.worldProfile.colors.horizon);
      this.materials.horizon.uniforms.memoryColor.value.setHex(this.worldProfile.colors.memory);
      this.materials.horizon.uniforms.scarColor.value.setHex(this.worldProfile.colors.scar);
      this.materials.horizon.uniforms.phaseDrift.value = this.worldProfile.motion.phaseDrift;
      this.materials.horizon.uniforms.shearStrength.value = this.worldProfile.motion.shearStrength;
      this.materials.horizon.uniforms.verticalLift.value = this.worldProfile.motion.verticalLift;
      this.materials.horizon.uniforms.archivalPulse.value = this.worldProfile.motion.archivalPulse;
    }

    if (this.materials?.grid?.uniforms) {
      this.materials.grid.uniforms.phaseDrift.value = this.worldProfile.motion.phaseDrift;
      this.materials.grid.uniforms.archivalPulse.value = this.worldProfile.motion.archivalPulse;
    }

    if (this.materials?.glow?.uniforms) {
      this.materials.glow.uniforms.glowColor.value.setHex(this.worldProfile.colors.glow);
      this.materials.glow.uniforms.phaseDrift.value = this.worldProfile.motion.phaseDrift;
      this.materials.glow.uniforms.archivalPulse.value = this.worldProfile.motion.archivalPulse;
    }

    this._recolorWorldGeometry();
  }

  _recolorWorldGeometry() {
    const colors = this.worldProfile?.colors;
    if (!colors) return;

    this._horizonVeils.forEach((veil, index) => {
      if (veil?.material?.color) {
        veil.material.color.setHSL(colors.veilStartHue + index * 0.025, 0.72, 0.62);
      }
    });

    this._realitySeams.forEach((seam, index) => {
      if (seam?.material?.color) {
        seam.material.color.setHSL(colors.veilStartHue + 0.03 + index * 0.01, 0.78, 0.68);
      }
    });

    if (this._horizonCrownRing?.material?.color) {
      this._horizonCrownRing.material.color.setHex(colors.glow);
    }

    this._horizonCrownMeshes.forEach((spire, index) => {
      if (spire?.material?.color) {
        spire.material.color.setHSL(colors.crownStartHue + index * 0.012, 0.68, 0.58);
      }
    });
  }

  /**
   * Create custom shader materials for the horizon
   */
  createMaterials() {
    const horizonMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        waveAmplitude: { value: this.config.waveAmplitude },
        waveSpeed: { value: this.config.waveSpeed },
        distortion: { value: this.config.distortion },
        surfaceRadius: { value: this.config.size * 0.5 },
        opacity: { value: this.config.opacity },
        emissiveIntensity: { value: this.config.emissiveIntensity },
        memoryPressure: { value: this._currentMemoryPressure },
        breachStrength: { value: 0 },
        phaseDrift: { value: this.worldProfile.motion.phaseDrift },
        shearStrength: { value: this.worldProfile.motion.shearStrength },
        verticalLift: { value: this.worldProfile.motion.verticalLift },
        archivalPulse: { value: this.worldProfile.motion.archivalPulse },
        baseColor: { value: new THREE.Color(this.worldProfile.colors.base) },
        horizonColor: { value: new THREE.Color(this.worldProfile.colors.horizon) },
        memoryColor: { value: new THREE.Color(this.worldProfile.colors.memory) },
        scarColor: { value: new THREE.Color(this.worldProfile.colors.scar) }
      },
      vertexShader: `
        uniform float time;
        uniform float waveAmplitude;
        uniform float waveSpeed;
        uniform float distortion;
        uniform float surfaceRadius;
        uniform float memoryPressure;
        uniform float phaseDrift;
        uniform float shearStrength;
        uniform float verticalLift;

        varying float vRadial;
        varying float vBand;
        varying vec3 vPosition;

        void main() {
          vPosition = position;
          float radial = length(position.xz) / surfaceRadius;
          radial = clamp(radial, 0.0, 1.0);
          vRadial = radial;

          float phase = time * waveSpeed + radial * phaseDrift * 3.4;
          float ring = sin(radial * 10.0 - phase * 2.0);
          float weave = sin(position.x * 0.022 + phase + position.z * phaseDrift * 0.004) * cos(position.z * 0.026 - phase * 0.72);
          float basin = pow(radial, 2.0) * distortion * 4.8;
          float edgeLift = smoothstep(0.52, 1.0, radial) * distortion * 0.45;
          float pulse = ring * waveAmplitude * 0.8 + weave * waveAmplitude * 0.45;
          float memoryRipple = sin((position.x + position.z) * 0.05 + phase * 3.0) * memoryPressure * 0.06;
          float driftLift = sin(position.z * 0.018 + phase * 0.8) * verticalLift * (0.18 + radial * 0.52);

          vec3 displaced = position;
          displaced.y += pulse + memoryRipple;
          displaced.y -= basin;
          displaced.y += edgeLift;
          displaced.y += driftLift;
          displaced.x += sin(position.z * 0.018 + phase * 0.7) * shearStrength * radial * 5.0;
          displaced.z += cos(position.x * 0.016 - phase * 0.45) * phaseDrift * radial * 2.6;

          vBand = ring;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float opacity;
        uniform float emissiveIntensity;
        uniform float memoryPressure;
        uniform float breachStrength;
        uniform float phaseDrift;
        uniform float archivalPulse;
        uniform vec3 baseColor;
        uniform vec3 horizonColor;
        uniform vec3 memoryColor;
        uniform vec3 scarColor;

        varying float vRadial;
        varying float vBand;
        varying vec3 vPosition;

        void main() {
          float radialFade = smoothstep(0.0, 1.0, vRadial);
          float coreGlow = 1.0 - smoothstep(0.0, 0.4, vRadial);
          float ringPulse = 0.5 + 0.5 * sin(vRadial * 16.0 - time * 0.9 * archivalPulse);
          float fracture = smoothstep(0.35, 0.98, radialFade) * (0.5 + 0.5 * sin(vPosition.x * 0.03 - vPosition.z * 0.027 + time * (0.45 + phaseDrift)));
          float gridX = abs(fract(vPosition.x * 0.075) - 0.5);
          float gridZ = abs(fract(vPosition.z * 0.075) - 0.5);
          float grid = max(1.0 - smoothstep(0.46, 0.5, gridX), 1.0 - smoothstep(0.46, 0.5, gridZ));
          float memoryBand = smoothstep(0.25, 0.95, abs(vBand));

          vec3 color = mix(baseColor, horizonColor, radialFade);
          color += vec3(0.0, 0.12, 0.16) * grid * (1.0 - radialFade);
          color += memoryColor * memoryPressure * (0.08 + coreGlow * 0.12);
          color += scarColor * memoryBand * memoryPressure * 0.06;
          color += scarColor * fracture * breachStrength * 0.12;
          color += horizonColor * ringPulse * coreGlow * emissiveIntensity * 0.12;

          float alpha = opacity * (0.52 + radialFade * 0.48);
          alpha += memoryPressure * 0.06;
          alpha += breachStrength * fracture * 0.08;

          gl_FragColor = vec4(color, alpha);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending
    });

    const gridMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        gridOpacity: { value: this.config.gridOpacity },
        surfaceRadius: { value: this.config.size * 0.5 },
        memoryPressure: { value: this._currentMemoryPressure },
        archivalPulse: { value: this.worldProfile.motion.archivalPulse },
        phaseDrift: { value: this.worldProfile.motion.phaseDrift }
      },
      vertexShader: `
        varying vec3 vPosition;
        varying float vDistance;
        
        void main() {
          vPosition = position;
          vDistance = length(position.xz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float gridOpacity;
        uniform float surfaceRadius;
        uniform float memoryPressure;
        uniform float archivalPulse;
        uniform float phaseDrift;
        varying vec3 vPosition;
        varying float vDistance;
        
        void main() {
          float normalizedDistance = clamp(vDistance / surfaceRadius, 0.0, 1.0);
          float cellX = abs(fract(vPosition.x * 0.06) - 0.5);
          float cellZ = abs(fract(vPosition.z * 0.06) - 0.5);
          float line = 1.0 - smoothstep(0.42, 0.5, min(cellX, cellZ));
          float wave = 0.5 + 0.5 * sin((vPosition.x - vPosition.z) * (0.05 + phaseDrift * 0.01) + time * 0.9 * archivalPulse);
          float fade = smoothstep(0.98, 0.18, normalizedDistance);
          float pulse = gridOpacity * (0.42 + wave * 0.3 + memoryPressure * 0.55);

          vec3 gridColor = mix(vec3(0.0, 0.21, 0.25), vec3(0.16, 0.82, 0.88), wave * 0.35 + memoryPressure * 0.15);
          float opacity = line * pulse * fade * 0.72;

          gl_FragColor = vec4(gridColor, opacity);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending
    });

    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        glowColor: { value: new THREE.Color(this.worldProfile.colors.glow) },
        glowIntensity: { value: 0.15 },
        surfaceRadius: { value: this.config.size * 0.5 },
        memoryPressure: { value: this._currentMemoryPressure },
        breachStrength: { value: 0 },
        phaseDrift: { value: this.worldProfile.motion.phaseDrift },
        archivalPulse: { value: this.worldProfile.motion.archivalPulse }
      },
      vertexShader: `
        varying float vDistance;
        
        void main() {
          vDistance = length(position.xz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 glowColor;
        uniform float glowIntensity;
        uniform float surfaceRadius;
        uniform float memoryPressure;
        uniform float breachStrength;
        uniform float phaseDrift;
        uniform float archivalPulse;
        varying float vDistance;
        
        void main() {
          float normalizedDistance = clamp(vDistance / surfaceRadius, 0.0, 1.0);
          float horizonGlow = smoothstep(0.92, 0.35, normalizedDistance);
          float pulse = 0.84 + 0.16 * sin(time * 0.9 * archivalPulse + vDistance * (0.04 + phaseDrift * 0.01));
          float alpha = glowIntensity * horizonGlow * pulse;
          alpha += memoryPressure * 0.08;
          alpha += breachStrength * smoothstep(0.32, 0.95, normalizedDistance) * 0.12;
          
          gl_FragColor = vec4(glowColor, alpha);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending
    });
    
    return {
      horizon: horizonMaterial,
      grid: gridMaterial,
      glow: glowMaterial
    };
  }
  
  /**
   * Create the main horizon plane
   */
  createHorizonPlane() {
    const geometry = this._buildMembraneGeometry(this.config.size, this.config.segments, 1.0);
    const plane = new THREE.Mesh(geometry, this.materials.horizon);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = this.config.surfaceY;
    plane.userData = {
      isCognitiveHorizon: true,
      isCognitiveMembrane: true
    };
    plane.renderOrder = WORLD_OVERLAY_ORDER;
    plane.layers.set(0);

    this.planeGroup.add(plane);
    this.horizonPlane = plane;
  }
  
  /**
   * Create subtle grid overlay
   */
  createGridOverlay() {
    const geometry = this._buildMembraneGeometry(this.config.size, this.config.segments, 0.9);
    
    const grid = new THREE.Mesh(geometry, this.materials.grid);
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = this.config.surfaceY + 0.02;
    grid.userData = { isGridOverlay: true };
    grid.renderOrder = WORLD_OVERLAY_ORDER;
    
    this.planeGroup.add(grid);
    this.gridMesh = grid;
  }
  
  /**
   * Create glow gradient effect
   */
  createGlowGradient() {
    const geometry = this._buildMembraneGeometry(this.config.size * 1.02, 96, 0.7);
    
    const glow = new THREE.Mesh(geometry, this.materials.glow);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = this.config.surfaceY + 0.035;
    glow.userData = { isGlowGradient: true };
    glow.renderOrder = WORLD_OVERLAY_ORDER;
    
    this.planeGroup.add(glow);
    this.glowMesh = glow;
  }

  createHorizonVeils() {
    this._horizonVeils = [];
    const radius = this.config.size * 0.34;

    for (let i = 0; i < this.config.veilCount; i++) {
      const width = 120 + i * 18;
      const height = 34 + i * 10;
      const geometry = new THREE.PlaneGeometry(width, height, 1, 1);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.53 + i * 0.03, 0.72, 0.62),
        transparent: true,
        opacity: 0.045 + i * 0.015,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending
      });
      const veil = new THREE.Mesh(geometry, material);
      veil.rotation.x = -Math.PI / 2.64;
      veil.position.set(0, this.config.surfaceY + 18 + i * 5, -radius + i * 8);
      veil.renderOrder = WORLD_OVERLAY_ORDER;
      veil.userData = {
        isHorizonVeil: true,
        baseOpacity: material.opacity,
        phase: Math.random() * Math.PI * 2,
        driftRadius: radius * (0.8 + i * 0.1),
        baseY: veil.position.y
      };
      this.horizonVeilsGroup.add(veil);
      this._horizonVeils.push(veil);
    }
  }

  createRealitySeams() {
    this._realitySeams = [];

    for (let i = 0; i < this.config.seamCount; i++) {
      const length = 44 + Math.random() * 38;
      const geometry = new THREE.PlaneGeometry(length, 1.2 + Math.random() * 1.4);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.56 + Math.random() * 0.08, 0.78, 0.68),
        transparent: true,
        opacity: 0.05 + Math.random() * 0.04,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending
      });
      const seam = new THREE.Mesh(geometry, material);
      seam.rotation.x = -Math.PI / 2.9;
      seam.rotation.z = (Math.random() - 0.5) * 1.4;
      seam.position.set(
        (Math.random() - 0.5) * this.config.size * 0.6,
        this.config.surfaceY + 0.12 + Math.random() * 1.4,
        (Math.random() - 0.5) * this.config.size * 0.42
      );
      seam.renderOrder = WORLD_OVERLAY_ORDER;
      seam.userData = {
        isRealitySeam: true,
        baseOpacity: material.opacity,
        phase: Math.random() * Math.PI * 2,
        baseScaleX: 0.9 + Math.random() * 0.4
      };
      this.realitySeamsGroup.add(seam);
      this._realitySeams.push(seam);
    }
  }
  
  /**
   * Animate the horizon plane
   */
  animate(deltaTime, time) {
    this._ensureResidueCouplingSubscription();
    const currentTime = this._getCurrentTimeSeconds();
    const safeDelta = Number.isFinite(deltaTime) ? Math.max(0, deltaTime) : 0;
    const motion = this.worldProfile?.motion || HORIZON_WORLD_PROFILE.default.motion;
    const pressureMotion = this._currentMemoryPressure;
    this.time = currentTime;

    if (this._residueCoupling.ttl > 0) {
      this._residueCoupling.ttl = Math.max(0, this._residueCoupling.ttl - safeDelta);
      const weight = this._residueCoupling.maxTtl > 0
        ? this._residueCoupling.ttl / this._residueCoupling.maxTtl
        : 0;
      const residuePressure = this._residueCoupling.pressureBoost * weight;
      this._targetMemoryPressure = Math.max(this._targetMemoryPressure, residuePressure);
      if (this._residueCoupling.ttl <= 0) {
        this._residueCoupling.pressureBoost = 0;
        this._residueCoupling.maxTtl = 0;
      }
    }

    this._targetMemoryPressure = Math.max(0, this._targetMemoryPressure - safeDelta * 0.03);
    this._currentMemoryPressure += (this._targetMemoryPressure - this._currentMemoryPressure) * Math.min(1, safeDelta * 4.5);

    // Update horizon shader uniforms
    if (this.materials.horizon.uniforms) {
      this.materials.horizon.uniforms.time.value = currentTime;
      this.materials.horizon.uniforms.waveSpeed.value = this.config.waveSpeed * motion.waveSpeedMul;
      this.materials.horizon.uniforms.waveAmplitude.value = this.config.waveAmplitude * motion.waveAmplitudeMul;
      this.materials.horizon.uniforms.distortion.value = this.config.distortion;
      this.materials.horizon.uniforms.opacity.value = this.config.opacity;
      this.materials.horizon.uniforms.emissiveIntensity.value = this.config.emissiveIntensity;
      this.materials.horizon.uniforms.memoryPressure.value = this._currentMemoryPressure;
      this.materials.horizon.uniforms.breachStrength.value = Math.min(1, this._currentMemoryPressure * 0.85 + this._realityTides.length * 0.08);
      this.materials.horizon.uniforms.phaseDrift.value = motion.phaseDrift + pressureMotion * 0.08;
      this.materials.horizon.uniforms.shearStrength.value = motion.shearStrength + pressureMotion * 0.05;
      this.materials.horizon.uniforms.verticalLift.value = motion.verticalLift + pressureMotion * 0.03;
      this.materials.horizon.uniforms.archivalPulse.value = motion.archivalPulse;
    }
    
    // Update grid shader uniforms
    if (this.materials.grid.uniforms) {
      this.materials.grid.uniforms.time.value = currentTime;
      this.materials.grid.uniforms.gridOpacity.value = this.config.gridOpacity;
      this.materials.grid.uniforms.memoryPressure.value = this._currentMemoryPressure;
      this.materials.grid.uniforms.phaseDrift.value = motion.phaseDrift + pressureMotion * 0.06;
      this.materials.grid.uniforms.archivalPulse.value = motion.archivalPulse;
    }

    // Update glow shader uniforms
    if (this.materials.glow.uniforms) {
      this.materials.glow.uniforms.time.value = currentTime;
      this.materials.glow.uniforms.glowIntensity.value = 0.15 + this._currentMemoryPressure * 0.12;
      this.materials.glow.uniforms.memoryPressure.value = this._currentMemoryPressure;
      this.materials.glow.uniforms.breachStrength.value = Math.min(1, this._currentMemoryPressure * 0.85 + this._realityTides.length * 0.08);
      this.materials.glow.uniforms.phaseDrift.value = motion.phaseDrift + pressureMotion * 0.04;
      this.materials.glow.uniforms.archivalPulse.value = motion.archivalPulse;
    }

    this._updateMemoryScars(safeDelta, currentTime);
    this._updateRealityTides(safeDelta, currentTime);
    this._updateHorizonVeils(safeDelta, currentTime);
    this._updateRealitySeams(safeDelta, currentTime);
    this._updateHorizonCrown(safeDelta, currentTime);

    // Very subtle rotation for dreamlike quality
    this.planeGroup.rotation.z = currentTime * 0.003 * motion.crownSpinMul + Math.sin(currentTime * 0.008 * motion.archivalPulse) * motion.shearStrength * 0.04;
    this.planeGroup.rotation.y = Math.sin(currentTime * 0.012 * motion.archivalPulse) * (0.004 + motion.phaseDrift * 0.01);
    this.planeGroup.position.y = Math.sin(currentTime * 0.15 * motion.archivalPulse) * motion.verticalLift * 1.2;
  }
  
  /**
   * Update configuration
   */
  setConfig(configUpdate) {
    Object.assign(this.config, configUpdate);
    
    // Update uniforms
    if (this.materials.horizon.uniforms) {
      this.materials.horizon.uniforms.waveSpeed.value = this.config.waveSpeed;
      this.materials.horizon.uniforms.waveAmplitude.value = this.config.waveAmplitude;
      this.materials.horizon.uniforms.distortion.value = this.config.distortion;
      this.materials.horizon.uniforms.opacity.value = this.config.opacity;
      this.materials.horizon.uniforms.emissiveIntensity.value = this.config.emissiveIntensity;
      this.materials.horizon.uniforms.surfaceRadius.value = this.config.size * 0.5;
    }
    
    if (this.materials.grid.uniforms) {
      this.materials.grid.uniforms.gridOpacity.value = this.config.gridOpacity;
      this.materials.grid.uniforms.surfaceRadius.value = this.config.size * 0.5;
    }

    if (this.materials.glow.uniforms) {
      this.materials.glow.uniforms.surfaceRadius.value = this.config.size * 0.5;
    }

    if (typeof configUpdate.surfaceY === 'number') {
      if (this.horizonPlane) this.horizonPlane.position.y = this.config.surfaceY;
      if (this.gridMesh) this.gridMesh.position.y = this.config.surfaceY + 0.02;
      if (this.glowMesh) this.glowMesh.position.y = this.config.surfaceY + 0.035;
      if (this.horizonCrownGroup) this.horizonCrownGroup.position.y = this.config.surfaceY;
      for (const scar of this._memoryScars) {
        if (scar) scar.position.y = this.config.surfaceY + 0.03;
      }
      for (const tide of this._realityTides) {
        if (tide) tide.position.y = this.config.surfaceY + 0.05;
      }
      for (const veil of this._horizonVeils) {
        if (veil?.userData) {
          veil.userData.baseY = this.config.surfaceY + 18;
        }
      }
    }
  }
  
  /**
   * Get configuration
   */
  getConfig() {
    return { ...this.config };
  }
  
  /**
   * React to nearby nodes (slight glow intensification)
   */
  reactToNodes(nodes, influenceRadius = 30) {
    if (!nodes || nodes.length === 0) return;
    
    const currentTime = this._getCurrentTimeSeconds();
    const focusPoint = new THREE.Vector3();
    let totalWeight = 0;
    let maxInfluence = 0;
    let influencedCount = 0;
    
    for (const node of nodes) {
      if (!node.position) continue;
      
      const distance = Math.sqrt(
        node.position.x ** 2 + node.position.z ** 2
      );
      
      if (distance < influenceRadius) {
        const influence = 1 - (distance / influenceRadius);
        maxInfluence = Math.max(maxInfluence, influence);
        const weight = Math.max(0.05, influence * influence);
        focusPoint.addScaledVector(node.position, weight);
        totalWeight += weight;
        influencedCount++;
      }
    }
    
    const density = nodes.length > 0 ? Math.min(1, influencedCount / Math.max(1, nodes.length * 0.35)) : 0;
    const targetPressure = Math.min(1, (maxInfluence * 0.82) + (density * 0.18));
    this._targetMemoryPressure = Math.max(this._targetMemoryPressure * 0.92, targetPressure);
    this._currentMemoryPressure += (targetPressure - this._currentMemoryPressure) * 0.15;

    // Modulate wave amplitude based on nearby node activity
    const targetAmplitude = 0.02 + maxInfluence * 0.038 + density * 0.012;
    this.config.waveAmplitude += (targetAmplitude - this.config.waveAmplitude) * 0.08;
    
    if (this.materials.horizon.uniforms) {
      this.materials.horizon.uniforms.waveAmplitude.value = this.config.waveAmplitude;
      this.materials.horizon.uniforms.memoryPressure.value = this._currentMemoryPressure;
    }

    if (this.materials.grid.uniforms) {
      this.materials.grid.uniforms.memoryPressure.value = this._currentMemoryPressure;
    }

    if (this.materials.glow.uniforms) {
      this.materials.glow.uniforms.memoryPressure.value = this._currentMemoryPressure;
    }

    if (totalWeight > 0) {
      focusPoint.multiplyScalar(1 / totalWeight);
      focusPoint.y = this.config.surfaceY + 0.03;

      if (maxInfluence >= 0.2 && (currentTime - this._lastMemoryScarTime) >= this.config.memoryScarCooldown) {
        this._spawnMemoryScar(focusPoint, maxInfluence, this._selectMemoryScarColor(nodes, maxInfluence));
        this._lastMemoryScarTime = currentTime;
      }

      if (maxInfluence >= 0.42 && (currentTime - this._lastRealityTideTime) >= this.config.realityTideCooldown) {
        this._spawnRealityTide(focusPoint, maxInfluence, this._selectMemoryScarColor(nodes, maxInfluence));
        this._lastRealityTideTime = currentTime;
      }
    }
  }
  
  _getCurrentTimeSeconds() {
    if (this._timeOrigin === undefined) {
      this._timeOrigin = VisualTime.now;
    }
    return VisualTime.now - this._timeOrigin;
  }

  _buildMembraneGeometry(size, segments, distortionScale = 1) {
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    const positions = geometry.attributes.position;
    const halfSize = size * 0.5;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const radial = Math.min(1, Math.sqrt(x * x + z * z) / halfSize);
      const basin = Math.pow(radial, 2.05) * this.config.distortion * 4.2 * distortionScale;
      const ridge = Math.sin(radial * 9.0) * 0.014 * distortionScale;
      const edgeLift = Math.pow(radial, 5.0) * 0.03 * distortionScale;

      positions.setY(i, -basin + ridge + edgeLift);
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
  }

  _selectMemoryScarColor(nodes, influence) {
    const palette = new THREE.Color(0x66f6ff);
    const categoryBlob = (nodes || [])
      .map((node) => `${node?.userData?.category || ''} ${node?.userData?.state || ''} ${node?.userData?.rareType || ''}`.toLowerCase())
      .join(' ');

    if (categoryBlob.includes('corrupt') || categoryBlob.includes('rupture') || categoryBlob.includes('chaos')) {
      palette.lerp(new THREE.Color(0x8d5cff), 0.58);
    } else if (categoryBlob.includes('harmony') || categoryBlob.includes('stable') || categoryBlob.includes('control')) {
      palette.lerp(new THREE.Color(0xffd166), 0.52);
    } else if (categoryBlob.includes('synergy') || categoryBlob.includes('process')) {
      palette.lerp(new THREE.Color(0x89ffe4), 0.42);
    }

    if (influence > 0.78) {
      palette.lerp(new THREE.Color(0xffffff), 0.08);
    }

    return palette;
  }

  _spawnMemoryScar(center, influence, color) {
    if (!this.memoryScarsGroup) return;

    if (this._memoryScars.length >= this.config.memoryScarLimit) {
      const oldest = this._memoryScars.shift();
      this._disposeMesh(oldest);
    }

    const radius = 2.4 + influence * 6.5;
    const thickness = 0.14 + influence * 0.22;
    const geometry = new THREE.RingGeometry(Math.max(0.35, radius - thickness), radius + thickness, 48);
    const material = new THREE.MeshBasicMaterial({
      color: color.clone ? color.clone() : color,
      transparent: true,
      opacity: this.config.reflectionOpacity + influence * 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending
    });

    const scar = new THREE.Mesh(geometry, material);
    scar.rotation.x = -Math.PI / 2;
    scar.position.set(center.x, this.config.surfaceY + 0.03, center.z);
    scar.renderOrder = WORLD_OVERLAY_ORDER;
    scar.userData = {
      isMemoryScar: true,
      birthTime: this.time,
      lifetime: this.config.memoryScarLifetime,
      baseScale: 0.95 + influence * 0.5,
      pulsePhase: Math.random() * Math.PI * 2,
      driftPhase: Math.random() * Math.PI * 2
    };

    this.memoryScarsGroup.add(scar);
    this._memoryScars.push(scar);
  }

  _updateMemoryScars(deltaTime, currentTime) {
    if (!this._memoryScars.length) return;

    for (let i = this._memoryScars.length - 1; i >= 0; i--) {
      const scar = this._memoryScars[i];
      if (!scar || !scar.userData) {
        this._memoryScars.splice(i, 1);
        continue;
      }

      const age = currentTime - (scar.userData.birthTime ?? currentTime);
      const life = Math.max(0.1, scar.userData.lifetime ?? this.config.memoryScarLifetime);
      const life01 = Math.max(0, Math.min(1, age / life));

      if (life01 >= 1) {
        this._disposeMesh(scar);
        this._memoryScars.splice(i, 1);
        continue;
      }

      const pulse = 1.0 + Math.sin(currentTime * 2.2 + scar.userData.pulsePhase) * 0.05;
      const drift = Math.sin(currentTime * 0.7 + scar.userData.driftPhase) * 0.03;
      const fadeIn = Math.min(1, life01 / 0.16);
      const fadeOut = 1.0 - Math.max(0, (life01 - 0.62) / 0.38);

      scar.scale.setScalar((scar.userData.baseScale ?? 1) * (0.92 + life01 * 0.55) * pulse);
      scar.position.y = this.config.surfaceY + 0.03 + drift;
      if (scar.material) {
        scar.material.opacity = (this.config.reflectionOpacity + (1.0 - life01) * 0.18) * fadeIn * fadeOut;
      }
      scar.rotation.z += deltaTime * 0.08;
    }
  }

  _spawnRealityTide(center, influence, color) {
    if (!this.realityTidesGroup) return;

    if (this._realityTides.length >= this.config.realityTideLimit) {
      const oldest = this._realityTides.shift();
      this._disposeMesh(oldest);
    }

    const geometry = new THREE.RingGeometry(1.4 + influence * 1.8, 5.8 + influence * 8.4, 72, 1, Math.random() * Math.PI * 2, Math.PI * (1.1 + influence * 0.7));
    const material = new THREE.MeshBasicMaterial({
      color: color.clone ? color.clone() : color,
      transparent: true,
      opacity: 0.18 + influence * 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending
    });

    const tide = new THREE.Mesh(geometry, material);
    tide.rotation.x = -Math.PI / 2;
    tide.rotation.z = (Math.random() - 0.5) * 0.8;
    tide.position.set(center.x, this.config.surfaceY + 0.05, center.z);
    tide.renderOrder = WORLD_OVERLAY_ORDER;
    tide.userData = {
      isRealityTide: true,
      birthTime: this.time,
      lifetime: this.config.realityTideLifetime,
      baseScale: 0.8 + influence * 0.9,
      pulsePhase: Math.random() * Math.PI * 2,
      driftPhase: Math.random() * Math.PI * 2,
      baseX: center.x,
      baseZ: center.z
    };

    this.realityTidesGroup.add(tide);
    this._realityTides.push(tide);
  }

  _updateRealityTides(deltaTime, currentTime) {
    if (!this._realityTides.length) return;
    const motion = this.worldProfile?.motion || HORIZON_WORLD_PROFILE.default.motion;

    for (let i = this._realityTides.length - 1; i >= 0; i--) {
      const tide = this._realityTides[i];
      if (!tide?.userData) {
        this._realityTides.splice(i, 1);
        continue;
      }

      const age = currentTime - (tide.userData.birthTime ?? currentTime);
      const life = Math.max(0.1, tide.userData.lifetime ?? this.config.realityTideLifetime);
      const life01 = Math.max(0, Math.min(1, age / life));
      if (life01 >= 1) {
        this._disposeMesh(tide);
        this._realityTides.splice(i, 1);
        continue;
      }

      const pulse = 1.0 + Math.sin(currentTime * 1.7 * motion.archivalPulse + tide.userData.pulsePhase) * (0.08 + motion.phaseDrift * 0.04);
      tide.scale.setScalar((tide.userData.baseScale ?? 1) * (0.94 + life01 * 0.85) * pulse);
      tide.position.y = this.config.surfaceY + 0.05 + Math.sin(currentTime * 0.9 * motion.archivalPulse + tide.userData.driftPhase) * (0.22 + motion.verticalLift * 1.6);
      tide.position.x = (tide.userData.baseX ?? tide.position.x) + Math.sin(currentTime * 0.55 + tide.userData.driftPhase) * motion.phaseDrift * 3.2;
      tide.position.z = (tide.userData.baseZ ?? tide.position.z) + Math.cos(currentTime * 0.42 + tide.userData.driftPhase) * motion.shearStrength * 1.8;
      tide.rotation.z += deltaTime * (0.1 + motion.shearStrength * 0.18);
      if (tide.material) {
        tide.material.opacity = (0.18 + (1.0 - life01) * 0.16 + this._currentMemoryPressure * 0.08) * (1.0 - Math.max(0, (life01 - 0.7) / 0.3));
      }
    }
  }

  _updateHorizonVeils(deltaTime, currentTime) {
    const motion = this.worldProfile?.motion || HORIZON_WORLD_PROFILE.default.motion;
    for (let i = 0; i < this._horizonVeils.length; i++) {
      const veil = this._horizonVeils[i];
      if (!veil?.material) continue;
      const pulse = Math.sin(currentTime * 0.55 * motion.archivalPulse + (veil.userData.phase ?? 0));
      const pressure = this._currentMemoryPressure;
      veil.position.x = Math.sin(currentTime * (0.12 + motion.phaseDrift * 0.18) + i * 0.8) * (8 + pressure * 14 + motion.phaseDrift * 16);
      veil.position.y = (veil.userData.baseY ?? veil.position.y) + i * 4 + pulse * (1.2 + pressure * 2.6 + motion.verticalLift * 10);
      veil.rotation.z = pulse * (0.05 + pressure * 0.16 + motion.shearStrength * 0.4);
      veil.scale.x = 1 + pressure * 0.18 + motion.phaseDrift * 0.1;
      veil.scale.y = 1 + pressure * 0.24 + motion.verticalLift * 0.9;
      veil.material.opacity = (veil.userData.baseOpacity ?? 0.05) * (0.85 + pressure * 1.8);
    }
  }

  _updateRealitySeams(deltaTime, currentTime) {
    const motion = this.worldProfile?.motion || HORIZON_WORLD_PROFILE.default.motion;
    for (const seam of this._realitySeams) {
      if (!seam?.material) continue;
      const flicker = 0.5 + 0.5 * Math.sin(currentTime * 1.2 * motion.seamFlickerMul + (seam.userData.phase ?? 0));
      seam.scale.x = (seam.userData.baseScaleX ?? 1) * (0.9 + this._currentMemoryPressure * 0.3 + motion.shearStrength * 0.28);
      seam.scale.y = 1 + flicker * 0.25;
      seam.material.opacity = (seam.userData.baseOpacity ?? 0.06) * (0.55 + this._currentMemoryPressure * 2.2);
      seam.rotation.z += deltaTime * (0.01 + this._currentMemoryPressure * 0.06 + motion.shearStrength * 0.18);
    }
  }

  _createHorizonCrown() {
    const crownGroup = new THREE.Group();
    crownGroup.userData = { isHorizonCrown: true };
    crownGroup.renderOrder = WORLD_OVERLAY_ORDER;
    crownGroup.position.y = this.config.surfaceY;

    const radius = this.config.size * this.config.crownRadiusScale;
    const count = this.config.crownCount;

    const ringGeometry = new THREE.TorusGeometry(radius, 1.25, 8, 88);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x66f6ff,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.25;
    ring.renderOrder = WORLD_OVERLAY_ORDER;
    crownGroup.add(ring);
    this._horizonCrownRing = ring;

    this._horizonCrownMeshes = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const phase = angle * 2.7 + i * 0.31;
      const height = this.config.crownHeight * (0.58 + 0.36 * Math.sin(phase) + 0.12 * Math.cos(phase * 0.5));
      const cylinder = new THREE.CylinderGeometry(0.38, 1.05, height, 6, 1, false);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.53 + i * 0.012, 0.68, 0.58),
        transparent: true,
        opacity: 0.26,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending
      });

      const spire = new THREE.Mesh(cylinder, material);
      spire.position.set(
        Math.cos(angle) * radius,
        height * 0.5,
        Math.sin(angle) * radius
      );
      spire.rotation.y = angle + Math.PI * 0.5;
      spire.rotation.z = Math.sin(phase) * 0.12;
      spire.renderOrder = WORLD_OVERLAY_ORDER;
      spire.userData = {
        isHorizonSpire: true,
        baseHeight: height,
        pulsePhase: phase,
        anchorRadius: radius
      };

      crownGroup.add(spire);
      this._horizonCrownMeshes.push(spire);
    }

    this.horizonCrownGroup = crownGroup;
    this.planeGroup.add(crownGroup);
  }

  _updateHorizonCrown(deltaTime, currentTime) {
    if (!this.horizonCrownGroup) return;
    const motion = this.worldProfile?.motion || HORIZON_WORLD_PROFILE.default.motion;

    this.horizonCrownGroup.rotation.y = currentTime * 0.0015 * motion.crownSpinMul;
    this.horizonCrownGroup.rotation.z = Math.sin(currentTime * 0.008 * motion.archivalPulse) * (0.01 + motion.shearStrength * 0.03);

    if (this._horizonCrownRing?.material) {
      this._horizonCrownRing.material.opacity = 0.05 + this._currentMemoryPressure * 0.12;
      this._horizonCrownRing.rotation.z += deltaTime * (0.04 * motion.crownSpinMul + this._currentMemoryPressure * 0.06);
    }

    for (const spire of this._horizonCrownMeshes) {
      if (!spire?.userData) continue;
      const pulse = 1.0 + Math.sin(currentTime * 1.8 * motion.archivalPulse + spire.userData.pulsePhase) * (0.04 + this._currentMemoryPressure * 0.05 + motion.phaseDrift * 0.02);
      const lift = 1.0 + this._currentMemoryPressure * 0.18;
      spire.scale.setScalar(pulse * lift * (1 + motion.verticalLift * 0.18));
      spire.material.opacity = 0.18 + this._currentMemoryPressure * 0.18;
      spire.rotation.z = Math.sin(currentTime * 0.4 * motion.archivalPulse + spire.userData.pulsePhase) * (0.11 + this._currentMemoryPressure * 0.08 + motion.shearStrength * 0.08);
      spire.position.y = (spire.userData.baseHeight ?? 16) * 0.5 * (1 + this._currentMemoryPressure * 0.16 + motion.verticalLift * 0.22);
    }
  }

  _disposeMesh(mesh) {
    if (!mesh) return;

    if (mesh.parent) {
      mesh.parent.remove(mesh);
    }

    if (mesh.geometry && typeof mesh.geometry.dispose === 'function') {
      mesh.geometry.dispose();
    }

    if (Array.isArray(mesh.material)) {
      for (const material of mesh.material) {
        if (material && typeof material.dispose === 'function') {
          material.dispose();
        }
      }
    } else if (mesh.material && typeof mesh.material.dispose === 'function') {
      mesh.material.dispose();
    }
  }

  /**
   * Dispose resources
   */
  dispose() {
    this._detachResidueCoupling();

    if (this.planeGroup) {
      const meshesToDispose = [];
      this.planeGroup.traverse((object) => {
        if (object.isMesh) {
          meshesToDispose.push(object);
        }
      });

      for (const mesh of meshesToDispose) {
        this._disposeMesh(mesh);
      }
    }

    if (this.planeGroup?.parent) {
      this.planeGroup.parent.remove(this.planeGroup);
    }

    this.planeGroup?.clear?.();

    this._memoryScars.length = 0;
    this._realityTides.length = 0;
    this._horizonVeils.length = 0;
    this._realitySeams.length = 0;
    this._horizonCrownMeshes.length = 0;
    this._horizonCrownRing = null;
    this.memoryScarsGroup = null;
    this.realityTidesGroup = null;
    this.horizonVeilsGroup = null;
    this.realitySeamsGroup = null;
    this.horizonCrownGroup = null;
    this.horizonPlane = null;
    this.gridMesh = null;
    this.glowMesh = null;
    this.materials = {};
    this.semanticBus = null;
  }
}

/**
 * Console API for debugging and live parameter adjustment
 */
export function setupCognitiveHorizonConsoleAPI(horizonPlane) {
  window.CognitiveHorizonDebug = {
    /**
     * Get current configuration
     */
    getConfig() {
      return horizonPlane.getConfig();
    },
    
    /**
     * Update configuration
     */
    setConfig(configUpdate) {
      horizonPlane.setConfig(configUpdate);
      console.log('🌊 Cognitive Horizon config updated:', configUpdate);
    },
    
    /**
     * Set wave speed
     */
    setWaveSpeed(speed) {
      horizonPlane.setConfig({ waveSpeed: speed });
      console.log(`🌊 Wave speed: ${speed}`);
    },
    
    /**
     * Set wave amplitude
     */
    setWaveAmplitude(amplitude) {
      horizonPlane.setConfig({ waveAmplitude: amplitude });
      console.log(`🌊 Wave amplitude: ${amplitude}`);
    },
    
    /**
     * Set opacity
     */
    setOpacity(opacity) {
      horizonPlane.setConfig({ opacity });
      console.log(`🌊 Opacity: ${opacity}`);
    },
    
    /**
     * Set grid opacity
     */
    setGridOpacity(gridOpacity) {
      horizonPlane.setConfig({ gridOpacity });
      console.log(`🌊 Grid opacity: ${gridOpacity}`);
    },
    
    /**
     * Enable/disable wave animation
     */
    enableWaves(enabled) {
      horizonPlane.setConfig({ waveSpeed: enabled ? 0.08 : 0 });
      console.log(`🌊 Waves ${enabled ? 'enabled' : 'disabled'}`);
    },
    
    /**
     * Reset to defaults
     */
    reset() {
      horizonPlane.setConfig({
        waveSpeed: 0.08,
        waveAmplitude: 0.024,
        opacity: 0.24,
        gridOpacity: 0.08
      });
      horizonPlane._targetMemoryPressure = 0;
      horizonPlane._currentMemoryPressure = 0;
      if (Array.isArray(horizonPlane._memoryScars)) {
        const scars = [...horizonPlane._memoryScars];
        horizonPlane._memoryScars.length = 0;
        for (const scar of scars) {
          horizonPlane._disposeMesh(scar);
        }
      }
      if (Array.isArray(horizonPlane._realityTides)) {
        const tides = [...horizonPlane._realityTides];
        horizonPlane._realityTides.length = 0;
        for (const tide of tides) {
          horizonPlane._disposeMesh(tide);
        }
      }
      console.log('🌊 Cognitive Horizon reset to defaults');
    },

    /**
     * Manually set memory pressure for live testing
     */
    setMemoryPressure(level) {
      const pressure = Math.max(0, Math.min(1, Number(level) || 0));
      horizonPlane._targetMemoryPressure = pressure;
      horizonPlane._currentMemoryPressure = pressure;
      console.log(`🌊 Memory pressure: ${pressure.toFixed(2)}`);
    }
  };
  
  console.log('🌊 Cognitive Horizon Console API ready: window.CognitiveHorizonDebug');
}
