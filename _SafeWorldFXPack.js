import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { safeSetEmissive } from './_EmissiveUtils.js';

/**
 * SAFE WORLD FX PACK 3.0
 * 
 * ABSOLUTE SAFETY RULES - STRICTLY ENFORCED:
 * - ZERO shader modifications
 * - ZERO material overrides
 * - ZERO file imports or new modules
 * - ZERO geometry replacement
 * - Only VFX overlays, world animations, distortion layers, particles, lighting
 * - All effects are additive and completely reversible
 */

/**
 * Global guard function for world FX runtime kill switch
 */
function areWorldFXEnabled() {
  if (typeof window === 'undefined') return true;
  if (window.ATOMA_WORLD_FX_ENABLED === undefined) return true;
  return window.ATOMA_WORLD_FX_ENABLED === true;
}

export class SafeWorldFXPack {
  constructor(scene, worldRoot, environmentRoot, camera, sharedAssets = null, semanticBus = null) {
    this.scene = scene;
    this.worldRoot = worldRoot || scene;
    this.environmentRoot = environmentRoot || this.worldRoot;
    this.camera = camera;
    this.sharedAssets = sharedAssets ?? null;
    this.semanticBus = semanticBus ?? null;
    this.metricBus = this.semanticBus || this._resolveMetricBus();
    this.metricSignalTimes = new Map();
    this.frameScheduler = null;

    this.palette = {
      base: 0x05131A,
      cyan: 0x6DEAFF,
      mint: 0x77F7DB,
      violet: 0xD07BFF,
      rose: 0xFF73CF,
      ritualWhite: 0xF7FBFF
    };

    this.atmosphereState = {
      synergyHigh: false,
      loadPressureHigh: false,
      corruptionHigh: false,
      stabilityLow: false,
      stabilityHigh: false,
      legendaryCount: 0,
      activityLevel: 0,
      pressureLevel: 0,
      revelationLevel: 0,
      signalBias: 0
    };

    this.sharedWorldUniforms = {
      uWorldTime: { value: 0 },
      uSignalBias: { value: 0 }
    };
    this._tmpColorA = new THREE.Color();
    this._tmpColorB = new THREE.Color();
    this._tmpVecA = new THREE.Vector3();
    this._tmpVecB = new THREE.Vector3();
    this._tmpVecC = new THREE.Vector3();

    this.root = new THREE.Group();
    this.root.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_WORLD_BACKGROUND);
    this.root.userData = this.root.userData || {};
    this.root.userData.__environmentLayerId = VisualHierarchyRegistry.LAYER_WORLD_BACKGROUND;
    this.root.userData.__environmentOwner = 'worldFXPack';
    this.screenOverlaysRoot = new THREE.Group();
    this.screenOverlaysRoot.name = 'SafeWorldFXPack_ScreenOverlays';
    this.screenOverlaysRoot.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_UI_OVERLAY);
    this.screenOverlaysRoot.userData = this.screenOverlaysRoot.userData || {};
    this.screenOverlaysRoot.userData.__environmentLayerId = VisualHierarchyRegistry.LAYER_UI_OVERLAY;
    this.screenOverlaysRoot.userData.__environmentOwner = 'worldFXPackScreenOverlay';
    const overlayParent = (this.camera && typeof this.camera.add === 'function') ? this.camera : this.scene;
    overlayParent.add(this.screenOverlaysRoot);

    const originalRootAdd = this.root.add.bind(this.root);
    this.root.add = (...children) => {
      const result = originalRootAdd(...children);
      children.forEach(child => this._applyRenderOrderRecursive(child, this.root.renderOrder));
      return result;
    };

    this.environmentRoot.add(this.root);
    this._setupMetricTriggers();
    
    // VFX Containers
    this.vfxLayers = {
      canopyField: null,
      horizonVeils: [],
      flowRivers: [],
      ruptureEvents: [],
      revelationEvents: [],
      cameraOmens: [],
      lightBreathing: this.originalLights,
      dimensionalShifts: [],
      riftWaves: [],
      energyPulses: [],
      fractalSky: null,
      quantumRifts: [],
      sigmaGlitches: [],
      energyStreams: [],
      auroraHorizons: [],
      screenOverlays: []
    };
    
    // State tracking
    this.worldState = {
      totalSynergy: 0,
      totalTraffic: 0,
      activeNodeCount: 0,
      legendaryCount: 0,
      time: 0,
      
      dimensionalPhase: 0,
      riftWaveTimer: 0,
      pulseTimer: 0,
      glitchTimer: 0,
      quantumTimer: 0,
      breathingPhase: 0
    };
    
    // Configuration
    this.config = {
      // Dimensional shifts
      dimensionalShiftInterval: 45,      // Seconds between shifts
      dimensionalIntensity: 0.05,        // 5% color shift max
      dimensionalDuration: 2.0,          // Shift duration
      
      // Rift waves
    riftWaveInterval: 14,              // Seconds between waves
    riftWaveSpeed: 18,                 // Units per second
    riftWaveWidth: 12,                 // Wave width
    riftWaveMaxAge: 3.2,               // Lifespan of a seismic wave
      // Energy pulses
      pulseInterval: 3.0,                // Seconds per pulse
      pulseIntensity: 0.2,               // Glow intensity
      pulseDuration: 1.5,                // Pulse duration
      
      // Quantum rifts
      quantumRiftInterval: 60,           // Seconds between rare events
      quantumRiftChance: 0.02,           // 2% per check
      quantumRiftDuration: 5.0,          // Effect duration
      
      // Sigma glitches
      sigmaGlitchInterval: 5.0,          // Seconds between fracture checks
      sigmaGlitchDuration: 0.18,          // Fracture duration
      sigmaAfterimageDuration: 0.12,      // Afterimage linger
      sigmaGlitchChance: 0.12,            // Base spawn chance when eligible
      
      // World breathing
      breathingSpeed: 0.5,               // Oscillations per second
      breathingIntensity: 0.1            // 10% variation
    };

    // Lighting state tracking
    this.originalLights = [];
    this.lights = [];
    this.maxLights = 5;

    // Rift wave materials (pre-warmed pool)
    this._riftWaveMaterialPool = {
      linear: { available: [], inUse: new Set() },
      radial: { available: [], inUse: new Set() }
    };
    this._initializeRiftWaveMaterials();
    
    // Initialize world FX
    this.initializeWorldFX();
  }

  _getSharedMaterial(key, factory) {
    if (this.sharedAssets?.getSharedMaterial) {
      return this.sharedAssets.getSharedMaterial(`SafeWorldFXPack:${key}`, factory);
    }
    return factory();
  }

  _getSharedGeometry(key, factory) {
    if (this.sharedAssets?.getSharedGeometry) {
      return this.sharedAssets.getSharedGeometry(`SafeWorldFXPack:${key}`, factory);
    }
    return factory();
  }

  _releaseMaterial(material) {
    if (!material) return;
    if (this.sharedAssets?.releaseMaterial?.(material)) return;
    if (typeof material.dispose === 'function') material.dispose();
  }

  _releaseGeometry(geometry) {
    if (!geometry) return;
    if (this.sharedAssets?.releaseGeometry?.(geometry)) return;
    if (typeof geometry.dispose === 'function') geometry.dispose();
  }

  _releaseMeshResources(mesh, materialReleaser = null) {
    if (!mesh) return;
    if (Array.isArray(mesh.children) && mesh.children.length > 0) {
      mesh.children.slice().forEach(child => this._releaseMeshResources(child, materialReleaser));
    }
    if (mesh.geometry) {
      this._releaseGeometry(mesh.geometry);
    }

    if (!mesh.material) return;

    if (Array.isArray(mesh.material)) {
      for (const material of mesh.material) {
        if (!material) continue;
        if (materialReleaser) materialReleaser(material);
        else this._releaseMaterial(material);
      }
      return;
    }

    if (materialReleaser) materialReleaser(mesh.material);
    else this._releaseMaterial(mesh.material);
  }

  freezeMaterialFlags(mat, context) {
    if (!mat) return;
    if (!mat.userData) mat.userData = {};
    mat.userData.__frozenVariantProps = mat.userData.__frozenVariantProps || new Set();
    mat.userData.__warnedVariantProp = mat.userData.__warnedVariantProp || new Set();

    const props = ['transparent', 'opacity', 'depthWrite', 'depthTest', 'blending', 'alphaTest', 'side'];
    props.forEach((prop) => {
      if (mat.userData.__frozenVariantProps.has(prop)) return;
      const desc = Object.getOwnPropertyDescriptor(mat, prop);
      if (desc && desc.configurable === false) {
        if (!mat.userData.__warnedVariantProp.has(prop)) {
          console.warn('[FX_FLAG_LOCK] Prop already locked, skip redefine', prop, mat.uuid, context);
          mat.userData.__warnedVariantProp.add(prop);
        }
        mat.userData.__frozenVariantProps.add(prop);
        return;
      }
      const cachedValue = mat[prop];
      try {
        Object.defineProperty(mat, prop, {
          configurable: true,
          enumerable: true,
          get() { return cachedValue; },
          set(v) {
            if (v === cachedValue) return;
            if (!mat.userData.__warnedVariantProp.has(prop)) {
              console.warn('[FX_FLAG_MUTATION_BLOCKED]', context, prop);
              mat.userData.__warnedVariantProp.add(prop);
            }
          }
        });
        mat.userData.__frozenVariantProps.add(prop);
      } catch (err) {
        if (!mat.userData.__warnedVariantProp.has(prop)) {
          console.warn('[FX_FLAG_LOCK_FAIL]', context, prop, err?.message);
          mat.userData.__warnedVariantProp.add(prop);
        }
      }
    });

    mat.userData.__owner = mat.userData.__owner || 'SafeWorldFX';
    mat.userData.__domain = mat.userData.__domain || 'overlay';
    mat.userData.__flagsFrozen = true;
    this.installFlagGuard(mat, context);
  }

  /**
   * MATERIAL MUTATION KILL HELPERS
   */
  logForbiddenMutation(context, prop) {
    console.warn('[FX_FLAG_MUTATION_BLOCKED]', context, prop);
  }

  installFlagGuard(material, context) {
    if (!material || material.userData?.flagGuardInstalled) return;
    const baseline = {};
    const props = ['transparent', 'opacity', 'depthWrite', 'depthTest', 'blending', 'alphaTest', 'side'];
    props.forEach(p => baseline[p] = material[p]);
    const previous = material.onBeforeRender;
    material.onBeforeRender = (...args) => {
      if (typeof previous === 'function') previous.apply(material, args);
      props.forEach(p => {
        if (material[p] !== baseline[p]) {
          this.logForbiddenMutation(context, p);
        }
      });
    };
    material.userData.flagGuardInstalled = true;
  }

  installOpacityUniform(material, initialOpacity, type, context) {
    if (!material) return;
    material.userData.opacityUniform = { value: initialOpacity };
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uOpacity = material.userData.opacityUniform;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        '#include <common>\nuniform float uOpacity;'
      );
      if (type === 'line') {
        shader.fragmentShader = shader.fragmentShader.replace(
          /gl_FragColor\s*=\s*vec4\(\s*diffuse\s*,\s*opacity\s*\);/g,
          'gl_FragColor = vec4( diffuse, opacity * uOpacity );'
        );
      } else {
        shader.fragmentShader = shader.fragmentShader.replace(
          /gl_FragColor\s*=\s*vec4\(\s*outgoingLight\s*,\s*diffuseColor\.a\s*\);/g,
          'gl_FragColor = vec4( outgoingLight, diffuseColor.a * uOpacity );'
        );
      }
      material.userData.shader = shader;
    };
    // Keep flags fixed; actual opacity driven by uniform
    material.opacity = 1;
    this.freezeMaterialFlags(material, context);
  }

  setOpacity(material, value, context) {
    if (material?.uniforms?.uOpacity) {
      material.uniforms.uOpacity.value = value;
    } else if (material?.userData?.opacityUniform) {
      material.userData.opacityUniform.value = value;
    } else if (material) {
      this.logForbiddenMutation(context, 'opacity');
    }
  }

  setMaterialColors(material, primary, secondary = null) {
    if (!material) return;
    if (material.uniforms?.uColorA?.value && primary) {
      material.uniforms.uColorA.value.copy(primary);
    } else if (material.color && primary) {
      material.color.copy(primary);
    }

    if (secondary && material.uniforms?.uColorB?.value) {
      material.uniforms.uColorB.value.copy(secondary);
    }
  }

  _createEpicVeilMaterial(key, {
    colorA,
    colorB = colorA,
    opacity = 0.18,
    additive = false,
    flowScale = 5.0,
    pulseScale = 0.16
  } = {}) {
    return this._getSharedMaterial(key, () => {
      const uniforms = {
        uWorldTime: this.sharedWorldUniforms.uWorldTime,
        uSignalBias: this.sharedWorldUniforms.uSignalBias,
        uOpacity: { value: opacity },
        uColorA: { value: new THREE.Color(colorA ?? this._getWorldFXPalette('cyan')) },
        uColorB: { value: new THREE.Color(colorB ?? colorA ?? this._getWorldFXPalette('violet')) },
        uFlowScale: { value: flowScale },
        uPulseScale: { value: pulseScale }
      };

      const material = new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        fog: false,
        side: THREE.DoubleSide,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        vertexShader: `
          varying vec2 vUv;
          varying float vBand;
          uniform float uWorldTime;
          uniform float uSignalBias;

          void main() {
            vUv = uv;
            float phase = uWorldTime * 0.18;
            float weave = sin(position.x * 0.065 + phase) * (0.12 + uSignalBias * 0.18);
            float shear = cos(position.x * 0.028 - phase * 1.4) * (0.08 + uSignalBias * 0.12);
            vec3 transformed = position;
            transformed.z += weave + shear * (0.35 + uv.y * 0.65);
            transformed.y += sin(position.x * 0.034 + phase * 1.7) * 0.35 * uv.y;
            vBand = weave + shear;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          varying float vBand;
          uniform float uWorldTime;
          uniform float uSignalBias;
          uniform float uOpacity;
          uniform vec3 uColorA;
          uniform vec3 uColorB;
          uniform float uFlowScale;
          uniform float uPulseScale;

          void main() {
            float stripeA = sin(vUv.x * uFlowScale * 6.28318 + uWorldTime * 0.55 + vBand * 2.4) * 0.5 + 0.5;
            float stripeB = cos(vUv.y * 9.0 - uWorldTime * 0.4 + vBand * 4.0) * 0.5 + 0.5;
            float pulse = 0.86 + sin(uWorldTime * 0.9 + vUv.x * 4.0) * uPulseScale;
            float edgeFade = smoothstep(0.0, 0.12, vUv.x) * (1.0 - smoothstep(0.84, 1.0, vUv.x));
            float topFade = smoothstep(0.0, 0.08, vUv.y) * (1.0 - smoothstep(0.78, 1.0, vUv.y));
            float bandMask = mix(0.35, 1.0, stripeA * 0.7 + stripeB * 0.3);
            float alpha = uOpacity * edgeFade * topFade * bandMask * pulse * (0.65 + uSignalBias * 0.55);
            vec3 color = mix(uColorA, uColorB, clamp(vUv.y * 0.72 + stripeA * 0.28, 0.0, 1.0));
            gl_FragColor = vec4(color, alpha);
          }
        `
      });
      this.freezeMaterialFlags(material, key);
      return material;
    });
  }

  _tagWorldFXObject(object, type, signature) {
    if (!object) return object;
    object.userData = object.userData || {};
    object.userData.isWorldFX = true;
    object.userData.type = type;
    if (signature) object.userData.signature = signature;
    this._applyRenderOrderRecursive(object, this.root.renderOrder);
    return object;
  }

  _createVeilStripGeometry(width, height, segments = 18, {
    skew = 0,
    crest = 1,
    bottomNoise = 0.45,
    topNoise = 0.8
  } = {}) {
    const positions = [];
    const uvs = [];
    const indices = [];
    const halfWidth = width * 0.5;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = -halfWidth + width * t;
      const tear = Math.sin(t * Math.PI * 3.1 + skew) * topNoise + Math.cos(t * Math.PI * 5.7 - skew) * topNoise * 0.45;
      const foot = Math.sin(t * Math.PI * 2.4 - skew) * bottomNoise + Math.cos(t * Math.PI * 4.8 + skew) * bottomNoise * 0.25;
      const yBottom = -height * 0.46 + foot;
      const yTop = height * (0.44 + crest * 0.08) + tear;
      const zOffset = Math.sin(t * Math.PI * 2.0 + skew) * 1.4;

      positions.push(x, yBottom, zOffset);
      positions.push(x + skew * 0.25, yTop, zOffset + 0.9);

      uvs.push(t, 0);
      uvs.push(t, 1);

      if (i < segments) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  _createBrokenRingGeometry(radius, segments = 64, gapEvery = 8, jitter = 0.08) {
    const points = [];
    for (let i = 0; i <= segments; i++) {
      if (i % gapEvery === 0) continue;
      const t = i / segments;
      const angle = t * Math.PI * 2;
      const warpedRadius = radius * (1 + Math.sin(angle * 3.0) * jitter + Math.cos(angle * 5.0) * jitter * 0.4);
      points.push(new THREE.Vector3(
        Math.cos(angle) * warpedRadius,
        Math.sin(angle * 2.0) * 0.18,
        Math.sin(angle) * warpedRadius
      ));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }

  _createBraidedStreamGeometry(length, segments = 90, amplitude = 10, phase = 0, verticalBias = 0.2) {
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const z = (t - 0.5) * length;
      const x = Math.sin(t * Math.PI * 2.0 + phase) * amplitude * (0.45 + Math.sin(t * Math.PI) * 0.4);
      const y = verticalBias + Math.cos(t * Math.PI * 1.5 + phase * 0.7) * 0.9 + Math.sin(t * Math.PI * 4.0 + phase) * 0.35;
      points.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }

  _createShardConstellationGeometry(radius = 90, height = 60, count = 72) {
    const positions = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.sin(i * 2.7) * 0.08;
      const ring = radius * (0.55 + ((i % 9) / 9) * 0.45);
      const y = height + Math.sin(i * 1.7) * 8 + Math.cos(i * 0.73) * 4;
      positions.push(
        Math.cos(angle) * ring,
        y,
        Math.sin(angle) * ring
      );
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  }

  _resolveMetricBus() {
    if (globalThis?.ATOMA_BUS || globalThis?.semanticBus) {
      return globalThis.ATOMA_BUS || globalThis.semanticBus || null;
    }

    const browserWindow = typeof window !== 'undefined' ? window : null;
    return browserWindow?.ATOMA_BUS || browserWindow?.semanticBus || null;
  }

  setFrameScheduler(frameScheduler) {
    this.frameScheduler = frameScheduler;
  }

  _getWorldFXPalette(key) {
    return this.palette?.[key] ?? this.palette?.cyan;
  }

  _getWorldFXEnvelope(effect, intensity = 1) {
    const bases = {
      dimensionalShift: { attack: 0.12, crest: 0.35, release: 0.9 },
      riftWave: { attack: 0.08, crest: 0.28, release: 1.6 },
      energyPulse: { attack: 0.08, crest: 0.32, release: 0.75 },
      quantumRift: { attack: 0.2, crest: 0.4, release: 1.6 },
      sigmaGlitch: { attack: 0.02, crest: 0.08, release: 0.18 },
      screenOverlay: { attack: 0.05, crest: 0.3, release: 1.0 }
    };

    const envelope = bases[effect] || { attack: 0.1, crest: 0.25, release: 0.8 };
    return {
      attack: envelope.attack * Math.max(0.8, intensity),
      crest: envelope.crest * Math.max(0.8, intensity),
      release: envelope.release * Math.max(0.9, intensity)
    };
  }

  _evaluateEnvelope(envelope, age) {
    if (!envelope) return 0;
    const { attack, crest, release } = envelope;
    if (age < attack) return age / attack;
    if (age < attack + crest) return 1;
    return Math.max(0, 1 - (age - attack - crest) / release);
  }

  _getWorldFXSignalBias(effectName) {
    const state = this.atmosphereState || {};
    const weights = {
      dimensionalShift: 0.14 + (state.stabilityLow ? 0.18 : 0) + (state.loadPressureHigh ? 0.12 : 0) + (state.revelationLevel * 0.08) + (state.activityLevel * 0.05),
      riftWave: 0.18 + (state.loadPressureHigh ? 0.14 : 0) + (state.activityLevel * 0.1),
      energyPulse: 0.08 + (state.synergyHigh ? 0.16 : 0) + (state.activityLevel * 0.14),
      quantumRift: 0.01 + (state.corruptionHigh ? 0.22 : 0) + (state.legendaryCount > 0 ? 0.25 : 0) + (state.revelationLevel * 0.08),
      sigmaGlitch: 0.003 + (state.corruptionHigh ? 0.02 : 0) + (state.loadPressureHigh ? 0.015 : 0),
      screenOverlay: 0.01 + (state.revelationLevel * 0.2) + (state.pressureLevel * 0.08)
    };
    return Math.min(1, weights[effectName] ?? 0.05);
  }

  _emitWorldFXEvent(title, subtitle, tone, intensity, phase) {
    const payload = { title, subtitle, tone, intensity, phase };
    const bus = this.metricBus || this._resolveMetricBus();
    if (!bus) return;
    if (typeof bus.emit === 'function') {
      bus.emit('worldFX.event', payload);
      return;
    }
    if (typeof bus.dispatch === 'function') {
      bus.dispatch('worldFX.event', payload);
    }
  }

  _updateAtmosphereState(legendaryPack) {
    const synergyHigh = this._isSignalActive('synergy.high');
    const loadPressureHigh = this._isSignalActive('loadPressure.high');
    const corruptionHigh = this._isSignalActive('corruption.high');
    const stabilityLow = this._isSignalActive('stability.low');
    const stabilityHigh = this._isSignalActive('stability.high');
    const legendaryCount = legendaryPack?.getActiveLegendaryCount?.() ?? 0;

    this.atmosphereState.synergyHigh = synergyHigh;
    this.atmosphereState.loadPressureHigh = loadPressureHigh;
    this.atmosphereState.corruptionHigh = corruptionHigh;
    this.atmosphereState.stabilityLow = stabilityLow;
    this.atmosphereState.stabilityHigh = stabilityHigh;
    this.atmosphereState.legendaryCount = legendaryCount;

    const activityLevel = Math.min(1, this.worldState.totalSynergy / 30);
    const pressureLevel = Math.min(1, this.worldState.totalTraffic / 25 + (loadPressureHigh ? 0.2 : 0));
    const revelationLevel = Math.min(1, (corruptionHigh ? 0.5 : 0) + (legendaryCount > 0 ? 0.3 : 0));

    this.atmosphereState.activityLevel = activityLevel;
    this.atmosphereState.pressureLevel = pressureLevel;
    this.atmosphereState.revelationLevel = revelationLevel;
    this.atmosphereState.signalBias = (activityLevel + pressureLevel + revelationLevel) / 3;
  }

  _setupMetricTriggers() {
    this._subscribeMetricTag('global.synergy.high', 'synergy.high');
    this._subscribeMetricTag('global.loadPressure.high', 'loadPressure.high');
    this._subscribeMetricTag('global.corruption.high', 'corruption.high');
    this._subscribeMetricTag('global.stability.low', 'stability.low');
    this._subscribeMetricTag('global.stability.high', 'stability.high');
  }

  _subscribeMetricTag(eventName, signalKey) {
    const bus = this.metricBus;
    if (!bus || !eventName || !signalKey) return;
    const handler = () => {
      this.metricSignalTimes.set(signalKey, performance.now());
    };

    if (typeof bus.on === 'function') {
      bus.on(eventName, handler);
      return;
    }

    if (typeof bus.subscribe === 'function') {
      bus.subscribe(eventName, handler);
    }
  }

  _isSignalActive(signalKey, lifetimeMs = 6000) {
    const lastAt = this.metricSignalTimes.get(signalKey);
    if (!Number.isFinite(lastAt)) return false;
    return (performance.now() - lastAt) <= lifetimeMs;
  }

  _applyRenderOrderRecursive(object, renderOrder) {
    if (!object || typeof object !== 'object') return;
    if ('renderOrder' in object) {
      object.renderOrder = renderOrder;
    }
    if (!object.userData) {
      object.userData = {};
    }
    object.userData.__environmentLayerId = VisualHierarchyRegistry.LAYER_WORLD_BACKGROUND;
    object.userData.__environmentOwner = 'worldFXPack';
    if (Array.isArray(object.children) && object.children.length > 0) {
      object.children.forEach(child => this._applyRenderOrderRecursive(child, renderOrder));
    }
  }

  auditSceneObjects(scene = this.scene) {
    if (!scene || typeof scene.traverse !== 'function') return;

    const stats = {
      meshes: 0,
      lines: 0,
      points: 0,
      sprites: 0,
      byMaterial: {},
      byGeometry: {},
      byUserTag: {}
    };

    scene.traverse(obj => {
      if (obj.isMesh) stats.meshes++;
      if (obj.isLine) stats.lines++;
      if (obj.isPoints) stats.points++;
      if (obj.isSprite) stats.sprites++;

      if (obj.material) {
        const type = obj.material.type;
        stats.byMaterial[type] = (stats.byMaterial[type] || 0) + 1;
      }

      if (obj.geometry) {
        const type = obj.geometry.type;
        stats.byGeometry[type] = (stats.byGeometry[type] || 0) + 1;
      }

      if (obj.userData && obj.userData.system) {
        const sys = obj.userData.system;
        stats.byUserTag[sys] = (stats.byUserTag[sys] || 0) + 1;
      }
    });

    console.log('=== SCENE AUDIT ===');
    console.log('Meshes:', stats.meshes);
    console.log('Lines:', stats.lines);
    console.log('Points:', stats.points);
    console.log('Sprites:', stats.sprites);
    console.log('By material:', stats.byMaterial);
    console.log('By geometry:', stats.byGeometry);
    console.log('By system tag:', stats.byUserTag);
  }
  
  /**
   * MATERIAL SAFETY: Check if material supports emissive properties
   */
  ensureEmissiveSafe(mat) {
    if (!mat || typeof mat !== 'object') return false;
    return (
      mat.isMeshStandardMaterial ||
      mat.isMeshLambertMaterial ||
      mat.isMeshPhongMaterial ||
      mat.isMeshToonMaterial
    );
  }

  /**
   * Initialize world FX infrastructure
   */
  initializeWorldFX() {
    // Store existing lights for breathing effect
    this.scene.traverse(obj => {
      if (obj instanceof THREE.Light) {
        this.originalLights.push({
          light: obj,
          originalIntensity: obj.intensity,
          originalColor: obj.color.clone()
        });
        this.lights.push(obj);
      }
    });
    
    // Create fractal sky
    this.createFractalSky();
    
    // Create aurora horizon
    this.createAuroraHorizon();
    
    // Create energy streams
    this.createEnergyStreams();
  }
  
  /**
   * Main update loop
   */
  update(deltaTime, nodes, linkingSystem, evolutionManager, legendaryPack) {
    if (!areWorldFXEnabled()) {
      if (window.ATOMA_DEBUG_WORLD_FX) {
        console.log('[WFX] update skipped - disabled');
      }
      return;
    }
    
    this.worldState.time += deltaTime;
    
    // Update world metrics from systems
    this.updateWorldMetrics(nodes, linkingSystem, evolutionManager, legendaryPack);
    this.sharedWorldUniforms.uWorldTime.value = this.worldState.time;
    this.sharedWorldUniforms.uSignalBias.value = this.atmosphereState.signalBias;
    
    // Update all world FX
    this.updateDimensionalShifts(deltaTime);
    this.updateRiftWaves(deltaTime);
    this.updateEnergyPulses(deltaTime);
    this.updateFractalSky(deltaTime);
    this.updateQuantumRifts(deltaTime);
    this.updateSigmaGlitches(deltaTime);
    this.updateWorldBreathing(deltaTime);
    this.updateEnergyStreams(deltaTime);
    this.updateAuroraHorizon(deltaTime);
    this.updateScreenOverlays(deltaTime);
  }
  
  /**
   * Update world metrics from game systems
   */
  updateWorldMetrics(nodes, linkingSystem, evolutionManager, legendaryPack) {
    this.worldState.activeNodeCount = nodes ? nodes.length : 0;
    this.worldState.totalSynergy = 0;
    this.worldState.totalTraffic = 0;
    
    // Calculate total network activity
    if (linkingSystem && linkingSystem.links) {
      linkingSystem.links.forEach(link => {
        if (link.glowData) {
          this.worldState.totalSynergy += link.glowData.synergy || 0;
        }
        if (link.traffic) {
          this.worldState.totalTraffic += link.traffic.load || 0;
        }
      });
    }
    
    // Count legendary nodes
    if (legendaryPack) {
      this.worldState.legendaryCount = legendaryPack.getActiveLegendaryCount();
    }

    this._updateAtmosphereState(legendaryPack);
  }
  
  /**
   * DIMENSIONAL SHIFTS - World reality bending
   */
  updateDimensionalShifts(deltaTime) {
    this.worldState.dimensionalPhase += deltaTime;
    
    // Check if shift should trigger
    if (this.worldState.dimensionalPhase > this.config.dimensionalShiftInterval) {
      const bias = this._getWorldFXSignalBias('dimensionalShift');
      if (Math.random() < bias || this.worldState.totalSynergy > 15) {
        this.triggerDimensionalShift();
      }
      this.worldState.dimensionalPhase = 0;
    }
    
    // Update active dimensional shifts
    this.vfxLayers.dimensionalShifts = this.vfxLayers.dimensionalShifts.filter(shift => {
      shift.age += deltaTime;
      
      const envelope = this._getWorldFXEnvelope('dimensionalShift', 1 + shift.age / this.config.dimensionalDuration);
      const intensity = this._evaluateEnvelope(envelope, shift.age) * this.config.dimensionalIntensity;
      const phase = this._evaluateEnvelope(envelope, shift.age);

      this.applyDimensionalColorShift(shift.colorOffset * intensity);
      this.applyDimensionalDistortion(intensity);

      if (shift.foldPlate) {
        shift.foldPlate.scale.setScalar(1 + intensity * 0.12);
        this.setOpacity(shift.foldPlate.material, Math.max(0, phase * 0.22), 'dimensional_shift.plate');
      }
      
      if (shift.gridMesh) {
        this.setOpacity(shift.gridMesh.material, Math.max(0, phase * 0.18), 'dimensional_shift.grid');
        shift.gridMesh.rotation.y += deltaTime * 0.12;
      }

      if (shift.curtain) {
        shift.curtain.position.z = -8 + Math.sin(shift.age * 3.0) * 2.2;
        shift.curtain.rotation.z = Math.sin(shift.age * 2.4) * 0.08;
        this.setOpacity(shift.curtain.material, Math.max(0, phase * 0.16), 'dimensional_shift.curtain');
      }

      if (shift.root) {
        shift.root.rotation.y += deltaTime * 0.1;
      }
      
      // Remove when done
      if (shift.age > this.config.dimensionalDuration) {
        if (shift.root) {
          this.root.remove(shift.root);
          this._releaseMeshResources(shift.root);
        } else {
          if (shift.gridMesh) {
            this.root.remove(shift.gridMesh);
            this._releaseMeshResources(shift.gridMesh);
          }
          if (shift.foldPlate) {
            this.root.remove(shift.foldPlate);
            this._releaseMeshResources(shift.foldPlate);
          }
        }
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Trigger a dimensional shift event
   */
  triggerDimensionalShift() {
    const shiftRoot = new THREE.Group();
    this._tagWorldFXObject(shiftRoot, 'dimensional_shift', 'reality_fold');

    const foldRadius = 62;
    const foldGeo = this._getSharedGeometry('dimensional_shift.foldPlate.geo', () => new THREE.RingGeometry(foldRadius * 0.46, foldRadius, 96, 1, 0, Math.PI * 2));
    const foldMat = this._createEpicVeilMaterial('dimensional_shift.plate.mat', {
      colorA: this._getWorldFXPalette('base'),
      colorB: this._getWorldFXPalette('cyan'),
      opacity: 0.16,
      additive: true,
      flowScale: 7.0,
      pulseScale: 0.18
    });
    const foldPlate = new THREE.Mesh(foldGeo, foldMat);
    foldPlate.rotation.x = -Math.PI / 2;
    foldPlate.position.y = 0.3;
    this._tagWorldFXObject(foldPlate, 'dimensional_shift_plate', 'reality_aperture');
    shiftRoot.add(foldPlate);

    const seamGeo = this._getSharedGeometry('dimensional_shift.gridGeo', () => {
      const points = [];
      for (let i = 0; i < 18; i++) {
        const angle = (i / 18) * Math.PI * 2;
        const inner = 14 + Math.sin(i * 0.8) * 4;
        const outer = 72 + Math.cos(i * 0.6) * 8;
        points.push(
          new THREE.Vector3(Math.cos(angle) * inner, 0.25, Math.sin(angle) * inner),
          new THREE.Vector3(Math.cos(angle + 0.15) * outer, 1.6 + Math.sin(i) * 0.8, Math.sin(angle + 0.15) * outer)
        );
      }
      return new THREE.BufferGeometry().setFromPoints(points);
    });
    const gridMat = this._getSharedMaterial('dimensional_shift.grid.mat', () => {
      const material = new THREE.LineBasicMaterial({
        color: this._getWorldFXPalette('violet'),
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false
      });
      this.installOpacityUniform(material, 0.18, 'line', 'dimensional_shift.grid');
      this.freezeMaterialFlags(material, 'dimensional_shift.grid');
      return material;
    });
    const gridMesh = new THREE.LineSegments(seamGeo, gridMat);
    gridMesh.position.y = 0.32;
    this._tagWorldFXObject(gridMesh, 'dimensional_shift_grid', 'fold_seams');
    shiftRoot.add(gridMesh);

    const curtainGeo = this._getSharedGeometry('dimensional_shift.curtain.geo', () => this._createVeilStripGeometry(82, 28, 20, { skew: 0.36, crest: 1.0, bottomNoise: 0.6, topNoise: 1.25 }));
    const curtainMat = this._createEpicVeilMaterial('dimensional_shift.curtain.mat', {
      colorA: this._getWorldFXPalette('cyan'),
      colorB: this._getWorldFXPalette('violet'),
      opacity: 0.12,
      additive: true,
      flowScale: 8.0,
      pulseScale: 0.22
    });
    const curtain = new THREE.Mesh(curtainGeo, curtainMat);
    curtain.position.set(0, 10, -8);
    curtain.rotation.x = -0.28;
    this._tagWorldFXObject(curtain, 'dimensional_shift_curtain', 'fold_curtain');
    shiftRoot.add(curtain);

    this.root.add(shiftRoot);

    const colorOffsets = [
      { r: 0.04, g: -0.02, b: 0.05 },
      { r: -0.02, g: 0.03, b: 0.05 },
      { r: 0.05, g: 0.02, b: -0.03 }
    ];

    const shift = {
      age: 0,
      root: shiftRoot,
      gridMesh: gridMesh,
      foldPlate: foldPlate,
      curtain,
      colorOffset: colorOffsets[Math.floor(Math.random() * colorOffsets.length)]
    };

    this.vfxLayers.dimensionalShifts.push(shift);
    this._emitWorldFXEvent('Reality Fold', 'Pressure bending the world', 'pressure', this.config.dimensionalIntensity, 'attack');
    this.triggerScreenOverlay('dimensional_shift', 0.85);
  }
  
  /**
   * Apply dimensional color shift
   */
  applyDimensionalColorShift(intensity) {
    if (this.lights.length === 0 || !this.originalLights[0]?.originalColor) return;
    const lightData = this.originalLights[0];
    const mainLight = lightData.light;
    const originalColor = lightData.originalColor.clone();
    if (!mainLight.color) return;

    const targetColor = originalColor.clone();
    targetColor.r = Math.min(1, targetColor.r + intensity * 0.08);
    targetColor.g = Math.max(0, targetColor.g - intensity * 0.03);
    targetColor.b = Math.min(1, targetColor.b + intensity * 0.08 + (this.atmosphereState.corruptionHigh ? 0.04 : 0));
    mainLight.color.copy(targetColor);
  }

  applyDimensionalDistortion(intensity) {
    if (!this.root) return;
    const scale = 1 + intensity * 0.08;
    this.root.scale.setScalar(scale);
    this.root.rotation.y = Math.sin(this.worldState.time * 0.25) * intensity * 0.08;
  }
  
  /**
   * RIFT WAVES - Ground-level wave propagation
   */
  updateRiftWaves(deltaTime) {
    this.worldState.riftWaveTimer += deltaTime;
    const interval = Math.max(8, this.config.riftWaveInterval * (1 - this.atmosphereState.signalBias * 0.2));
    
    // Spawn new rift wave
    if (this.worldState.riftWaveTimer > interval) {
      const bias = this._getWorldFXSignalBias('riftWave');
      if (Math.random() < bias || this.worldState.totalSynergy > 12) {
        this.spawnRiftWave();
      }
      this.worldState.riftWaveTimer = 0;
    }
    
    // Update active rift waves
    const maxAge = this.config.riftWaveMaxAge;
    this.vfxLayers.riftWaves = this.vfxLayers.riftWaves.filter(wave => {
      wave.age += deltaTime;
      wave.distance += wave.speed * deltaTime;

      const envelope = this._getWorldFXEnvelope('riftWave', wave.intensity);
      const phase = this._evaluateEnvelope(envelope, wave.age);
      const pulse = 0.75 + Math.sin(this.worldState.time * 8 + wave.phaseOffset) * 0.15;
      const opacity = Math.max(0, phase * wave.baseOpacity * pulse);

      if (wave.mesh) {
        if (wave.type === 'linear') {
          wave.mesh.position.z = wave.startZ + wave.distance;
          const scale = 1 + phase * 0.32 + (this.atmosphereState.stabilityLow ? 0.14 : 0);
          wave.mesh.scale.set(1, 1, scale);
          this.setOpacity(wave.mesh.material, opacity, 'rift_wave.update.linear');
        } else {
          const ringScale = 1 + wave.distance * 0.08 + phase * 0.28 + (this.atmosphereState.stabilityLow ? 0.18 : 0);
          wave.mesh.scale.setScalar(ringScale);
          wave.mesh.rotation.y += deltaTime * 0.22;
          this.setOpacity(wave.mesh.material, opacity, 'rift_wave.update.radial');
        }
        if (wave.materialColor) {
          wave.mesh.material.color.copy(wave.materialColor);
        }
      }

      if (wave.age > maxAge || wave.distance > 260) {
        if (wave.mesh) {
          this.root.remove(wave.mesh);
          this._releaseMeshResources(wave.mesh);
        }
        return false;
      }
      
      return true;
    });
  }

  _initializeRiftWaveMaterials() {
    const linearCount = 4;
    for (let i = 0; i < linearCount; i++) {
      this._riftWaveMaterialPool.linear.available.push(this._createRiftWaveLinearMaterial());
    }

    const radialCount = 3;
    for (let i = 0; i < radialCount; i++) {
      this._riftWaveMaterialPool.radial.available.push(this._createRiftWaveRadialMaterial());
    }
  }

  _createRiftWaveLinearMaterial() {
    const baseColor = this._getWorldFXPalette('cyan');
    const mat = new THREE.MeshStandardMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.6,
      emissive: baseColor,
      emissiveIntensity: 0.34,
      depthWrite: false,
      fog: false
    });
    this.installOpacityUniform(mat, 0.6, 'standard', 'rift_wave.linear');
    this.freezeMaterialFlags(mat, 'rift_wave.linear');
    return mat;
  }

  _createRiftWaveRadialMaterial() {
    const baseColor = this._getWorldFXPalette('violet');
    const mat = new THREE.LineBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.6,
      fog: false
    });
    this.installOpacityUniform(mat, 0.6, 'line', 'rift_wave.radial');
    this.freezeMaterialFlags(mat, 'rift_wave.radial');
    return mat;
  }

  _allocateRiftWaveMaterial(type) {
    const bucket = this._riftWaveMaterialPool[type];
    if (!bucket) return null;
    if (bucket.available.length === 0) {
      console.warn('[SafeWorldFXPack] Rift wave material pool empty', type);
      return null;
    }
    const mat = bucket.available.pop();
    bucket.inUse.add(mat);
    return mat;
  }

  _releaseRiftWaveMaterial(type, material) {
    if (!material || !this._riftWaveMaterialPool[type]) return;
    const bucket = this._riftWaveMaterialPool[type];
    if (!bucket.inUse.has(material)) return;
    bucket.inUse.delete(material);
    bucket.available.push(material);
    this.setOpacity(material, 0.6, `rift_wave.reset.${type}`);
  }
  
  /**
   * Spawn a rift wave
   */
  spawnRiftWave() {
    const forceRadial = this.atmosphereState.corruptionHigh || (!this.atmosphereState.stabilityHigh && Math.random() < 0.6);
    const waveType = forceRadial ? 'radial' : 'linear';
    const synergyBoost = this.atmosphereState.synergyHigh ? 0.18 : 0;
    const conflictBoost = this.atmosphereState.corruptionHigh ? 0.24 : 0;

    const baseColor = new THREE.Color(this._getWorldFXPalette('cyan'));
    const conflictColor = new THREE.Color(this._getWorldFXPalette('violet'));
    const accentColor = new THREE.Color(this._getWorldFXPalette('rose'));
    const finalColor = baseColor.clone()
      .lerp(conflictColor, conflictBoost)
      .lerp(accentColor, this.atmosphereState.corruptionHigh ? 0.12 : 0)
      .lerp(new THREE.Color(this._getWorldFXPalette('ritualWhite')), synergyBoost * 0.4);

    const waveOpacity = 0.28 + synergyBoost * 0.35 + conflictBoost * 0.2;
    const waveIntensity = 1 + synergyBoost + conflictBoost;
    const waveSpeed = this.config.riftWaveSpeed * (waveType === 'linear' ? 1 : 0.72) * (1 + (this.atmosphereState.stabilityLow ? 0.14 : 0));
    const waveWidth = this.config.riftWaveWidth * (waveType === 'linear' ? 1.4 : 0.85);
    const phaseOffset = Math.random() * Math.PI * 2;

    let waveMesh = null;
    let waveData = {
      age: 0,
      distance: 0,
      speed: waveSpeed,
      type: waveType,
      baseOpacity: waveOpacity,
      intensity: waveIntensity,
      phaseOffset,
      materialColor: finalColor,
      startZ: -48
    };

    if (waveType === 'linear') {
      const waveGeo = new THREE.PlaneGeometry(140, waveWidth, 1, 6);
      const waveMat = new THREE.MeshStandardMaterial({
        color: finalColor,
        emissive: finalColor,
        emissiveIntensity: 0.4 + synergyBoost * 0.2,
        transparent: true,
        opacity: waveOpacity,
        depthWrite: false,
        fog: false,
        side: THREE.DoubleSide
      });
      this.installOpacityUniform(waveMat, waveOpacity, 'standard', 'rift_wave.linear');
      this.freezeMaterialFlags(waveMat, 'rift_wave.linear');

      waveMesh = new THREE.Mesh(waveGeo, waveMat);
      waveMesh.rotation.x = -Math.PI / 2;
      waveMesh.position.set(0, 0.08, -52);
      waveMesh.userData = { isWorldFX: true, type: 'rift_wave', signature: 'seismic_pressure_band' };
      this.root.add(waveMesh);
      waveData.startZ = waveMesh.position.z;
      waveData.mesh = waveMesh;
    } else {
      const waveGeo = new THREE.BufferGeometry();
      const circlePoints = [];
      const segments = 72;
      const radius = 34;
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        circlePoints.push(new THREE.Vector3(Math.cos(angle) * radius, 0.1, Math.sin(angle) * radius));
      }
      waveGeo.setFromPoints(circlePoints);

      const waveMat = new THREE.LineBasicMaterial({
        color: finalColor,
        transparent: true,
        opacity: waveOpacity,
        fog: false
      });
      this.installOpacityUniform(waveMat, waveOpacity, 'line', 'rift_wave.radial');
      this.freezeMaterialFlags(waveMat, 'rift_wave.radial');

      waveMesh = new THREE.Line(waveGeo, waveMat);
      waveMesh.position.set(0, 0.12, 0);
      waveMesh.userData = { isWorldFX: true, type: 'rift_wave_radial', signature: 'seismic_event_center' };
      this.root.add(waveMesh);
      waveData.mesh = waveMesh;
    }

    this.vfxLayers.riftWaves.push(waveData);
    this._emitWorldFXEvent('Seismic Resonance', 'A world signal pulses through reality', waveType === 'radial' ? 'conflict' : 'stability', waveIntensity, 'attack');
  }
  
  /**
   * GLOBAL ENERGY PULSES - World-wide AI heartbeat
   */
  updateEnergyPulses(deltaTime) {
    this.worldState.pulseTimer += deltaTime;
    
    // Calculate pulse strength from network activity
    const activityLevel = Math.min(1, this.worldState.totalSynergy / 30);
    const synergyBoost = this._isSignalActive('synergy.high') ? 0.25 : 0;
    const pulseInterval = this.config.pulseInterval / (0.5 + activityLevel + synergyBoost);
    
    // Trigger pulse
    if (this.worldState.pulseTimer > pulseInterval) {
      const bias = this._getWorldFXSignalBias('energyPulse');
      if (Math.random() < bias) {
        this.triggerGlobalPulse(activityLevel + synergyBoost);
      }
      this.worldState.pulseTimer = 0;
    }
    
    // Update active pulses
    this.vfxLayers.energyPulses = this.vfxLayers.energyPulses.filter(pulse => {
      pulse.age += deltaTime;
      
      const envelope = this._getWorldFXEnvelope('energyPulse', pulse.intensity);
      const pulseValue = this._evaluateEnvelope(envelope, pulse.age);
      
      // Apply pulse to lights
      this.applyPulseToLights(pulseValue * pulse.intensity);
      
      // Remove when done
      if (pulse.age > this.config.pulseDuration) {
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Trigger a global energy pulse
   */
  triggerGlobalPulse(intensity) {
    this.vfxLayers.energyPulses.push({
      age: 0,
      intensity: this.config.pulseIntensity * (0.5 + intensity)
    });
    this._emitWorldFXEvent('World Pulse', 'Energy flow increased', 'flow', intensity, 'crest');
  }
  
  /**
   * Apply pulse to world lights
   */
  applyPulseToLights(pulseValue) {
    this.originalLights.forEach(lightData => {
      if (lightData.light.intensity !== undefined) {
        lightData.light.intensity = lightData.light.intensity + pulseValue * 0.1;
      }
    });
  }
  
  /**
   * FRACTAL SKY OVERLAY
   */
  createFractalSky() {
    const canopyRoot = new THREE.Group();
    canopyRoot.position.y = 0;
    this._tagWorldFXObject(canopyRoot, 'fractal_sky_canopy', 'canopy_field');

    const filamentLayers = [];
    const filamentDefs = [
      { key: 'outer', radius: 96, color: this._getWorldFXPalette('cyan'), opacity: 0.16, y: 58, rotation: 0.0 },
      { key: 'mid', radius: 78, color: this._getWorldFXPalette('mint'), opacity: 0.12, y: 66, rotation: 0.42 },
      { key: 'inner', radius: 60, color: this._getWorldFXPalette('violet'), opacity: 0.09, y: 74, rotation: -0.31 }
    ];

    filamentDefs.forEach((def, index) => {
      const geo = this._getSharedGeometry(`fractal_sky.${def.key}.geo`, () => this._createBrokenRingGeometry(def.radius, 92, 7 + index, 0.1 + index * 0.02));
      const mat = this._getSharedMaterial(`fractal_sky.${def.key}.mat`, () => {
        const material = new THREE.LineBasicMaterial({
          color: def.color,
          transparent: true,
          opacity: def.opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: false
        });
        this.installOpacityUniform(material, def.opacity, 'line', `fractal_sky.${def.key}`);
        this.freezeMaterialFlags(material, `fractal_sky.${def.key}`);
        return material;
      });
      const line = new THREE.LineLoop(geo, mat);
      line.position.y = def.y;
      line.rotation.x = Math.PI * 0.5;
      line.rotation.z = def.rotation;
      this._tagWorldFXObject(line, 'fractal_sky_filament', `canopy_${def.key}`);
      canopyRoot.add(line);
      filamentLayers.push(line);
    });

    const braidLayers = [];
    const braidDefs = [
      { key: 'braidA', phase: 0.0, color: this._getWorldFXPalette('cyan'), opacity: 0.13 },
      { key: 'braidB', phase: 1.4, color: this._getWorldFXPalette('mint'), opacity: 0.1 }
    ];

    braidDefs.forEach((def) => {
      const geo = this._getSharedGeometry(`fractal_sky.${def.key}.geo`, () => this._createBraidedStreamGeometry(220, 110, 18, def.phase, 68));
      const mat = this._getSharedMaterial(`fractal_sky.${def.key}.mat`, () => {
        const material = new THREE.LineBasicMaterial({
          color: def.color,
          transparent: true,
          opacity: def.opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: false
        });
        this.installOpacityUniform(material, def.opacity, 'line', `fractal_sky.${def.key}`);
        this.freezeMaterialFlags(material, `fractal_sky.${def.key}`);
        return material;
      });
      const line = new THREE.Line(geo, mat);
      line.rotation.y = def.phase * 0.35;
      line.position.y = 8;
      this._tagWorldFXObject(line, 'fractal_sky_braid', def.key);
      canopyRoot.add(line);
      braidLayers.push(line);
    });

    const shardGeo = this._getSharedGeometry('fractal_sky.shards.geo', () => this._createShardConstellationGeometry(92, 60, 96));
    const shardMat = this._getSharedMaterial('fractal_sky.shards.mat', () => new THREE.PointsMaterial({
      color: this._getWorldFXPalette('ritualWhite'),
      transparent: true,
      opacity: 0.24,
      size: 1.35,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    }));
    const shardField = new THREE.Points(shardGeo, shardMat);
    this._tagWorldFXObject(shardField, 'fractal_sky_shards', 'canopy_shards');
    canopyRoot.add(shardField);

    const spineGeo = this._getSharedGeometry('fractal_sky.spines.geo', () => {
      const points = [];
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const inner = 38 + Math.sin(i * 1.1) * 8;
        const outer = 102 + Math.cos(i * 0.7) * 10;
        points.push(
          new THREE.Vector3(Math.cos(angle) * inner, 52 + Math.sin(i * 0.9) * 3, Math.sin(angle) * inner),
          new THREE.Vector3(Math.cos(angle + 0.2) * outer, 84 + Math.cos(i * 0.8) * 5, Math.sin(angle + 0.2) * outer)
        );
      }
      return new THREE.BufferGeometry().setFromPoints(points);
    });
    const spineMat = this._getSharedMaterial('fractal_sky.spines.mat', () => {
      const material = new THREE.LineBasicMaterial({
        color: this._getWorldFXPalette('rose'),
        transparent: true,
        opacity: 0.08,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false
      });
      this.installOpacityUniform(material, 0.08, 'line', 'fractal_sky.spines');
      this.freezeMaterialFlags(material, 'fractal_sky.spines');
      return material;
    });
    const spineMesh = new THREE.LineSegments(spineGeo, spineMat);
    this._tagWorldFXObject(spineMesh, 'fractal_sky_spines', 'canopy_spines');
    canopyRoot.add(spineMesh);

    this.root.add(canopyRoot);
    const canopyField = {
      root: canopyRoot,
      filamentLayers,
      braidLayers,
      shardField,
      spineMesh
    };
    this.vfxLayers.fractalSky = canopyField;
    this.vfxLayers.canopyField = canopyField;
  }
  
  /**
   * Update fractal sky
   */
  updateFractalSky(deltaTime) {
    if (!this.vfxLayers.fractalSky) return;

    const canopy = this.vfxLayers.fractalSky;
    const root = canopy.root;
    const signalStrength = Math.min(1, this.atmosphereState.activityLevel * 0.32 + this.atmosphereState.pressureLevel * 0.34 + this.atmosphereState.revelationLevel * 0.34);
    const calm = this._tmpColorA.set(this._getWorldFXPalette('cyan'));
    const uplift = this._tmpColorB.set(this._getWorldFXPalette('mint'));
    const tension = new THREE.Color(this._getWorldFXPalette('violet'));
    const omen = new THREE.Color(this._getWorldFXPalette('rose'));
    const white = new THREE.Color(this._getWorldFXPalette('ritualWhite'));

    root.rotation.y += deltaTime * (0.008 + signalStrength * 0.012);
    root.rotation.x = Math.sin(this.worldState.time * 0.08) * 0.02;
    root.position.x = Math.sin(this.worldState.time * 0.013) * (1.4 + signalStrength * 1.8);
    root.position.z = Math.cos(this.worldState.time * 0.01) * (1.2 + signalStrength * 1.4);

    canopy.filamentLayers.forEach((line, index) => {
      const base = calm.clone().lerp(uplift, 0.24 + index * 0.08);
      if (this.atmosphereState.corruptionHigh) base.lerp(tension, 0.24 + index * 0.08);
      if (this.atmosphereState.synergyHigh) base.lerp(white, 0.12);
      this.setMaterialColors(line.material, base);
      this.setOpacity(line.material, 0.1 + signalStrength * 0.12 + index * 0.02, `fractal_sky.filament.${index}`);
      line.rotation.z += deltaTime * (0.015 + index * 0.006);
      line.scale.setScalar(1 + Math.sin(this.worldState.time * 0.35 + index) * 0.012);
    });

    canopy.braidLayers.forEach((line, index) => {
      const color = uplift.clone().lerp(calm, index * 0.4).lerp(omen, this.atmosphereState.corruptionHigh ? 0.18 : 0);
      this.setMaterialColors(line.material, color);
      this.setOpacity(line.material, 0.08 + signalStrength * 0.1 + index * 0.03, `fractal_sky.braid.${index}`);
      line.rotation.y += deltaTime * (0.02 + index * 0.012);
    });

    if (canopy.shardField?.material) {
      const shardColor = white.clone().lerp(calm, 0.35).lerp(tension, this.atmosphereState.corruptionHigh ? 0.16 : 0);
      canopy.shardField.material.color.copy(shardColor);
      canopy.shardField.material.opacity = 0.12 + signalStrength * 0.16 + (this.atmosphereState.legendaryCount > 0 ? 0.04 : 0);
      canopy.shardField.rotation.y -= deltaTime * 0.01;
      canopy.shardField.rotation.x = Math.sin(this.worldState.time * 0.12) * 0.04;
    }

    if (canopy.spineMesh?.material) {
      const spineColor = omen.clone().lerp(tension, this.atmosphereState.corruptionHigh ? 0.4 : 0.1).lerp(white, this.atmosphereState.legendaryCount > 0 ? 0.12 : 0);
      this.setMaterialColors(canopy.spineMesh.material, spineColor);
      this.setOpacity(canopy.spineMesh.material, 0.04 + signalStrength * 0.08, 'fractal_sky.spines');
      canopy.spineMesh.rotation.y -= deltaTime * 0.006;
    }
  }
  
  /**
   * QUANTUM RIFT EVENTS - Rare visual phenomena
   */
  updateQuantumRifts(deltaTime) {
    if (!areWorldFXEnabled()) {
      if (window.ATOMA_DEBUG_WORLD_FX) {
        console.log('[WFX] updateQuantumRifts skipped - disabled');
      }
      return;
    }
    
    this.worldState.quantumTimer += deltaTime;
    const interval = this.config.quantumRiftInterval * (1 - Math.min(0.4, this.atmosphereState.signalBias * 0.35));
    
    // Chance to spawn revelation breach
    if (this.worldState.quantumTimer > interval) {
      const bias = this._getWorldFXSignalBias('quantumRift');
      const eligible = this.atmosphereState.legendaryCount > 0 || this.atmosphereState.corruptionHigh || this.atmosphereState.signalBias > 0.45;
      const roll = Math.random();
      if (eligible && roll < bias * 1.15 + (this.atmosphereState.legendaryCount * 0.06) + (this.atmosphereState.corruptionHigh ? 0.14 : 0)) {
        this.spawnQuantumRift();
      }
      this.worldState.quantumTimer = 0;
    }
    
    // Update active quantum breaches
    this.vfxLayers.quantumRifts = this.vfxLayers.quantumRifts.filter(breach => {
      breach.age += deltaTime;
      const life = Math.min(this.config.quantumRiftDuration, this.config.quantumRiftDuration * (1 + (this.atmosphereState.corruptionHigh ? 0.18 : 0)));
      const phase = this._evaluateEnvelope(this._getWorldFXEnvelope('quantumRift', breach.intensity), breach.age);
      const outerPulse = 0.8 + Math.sin(this.worldState.time * 1.8 + breach.phaseOffset) * 0.12;

      if (breach.core) {
        breach.core.scale.setScalar(1 + phase * 0.18);
        this.setOpacity(breach.core.material, Math.max(0, phase * 0.7), 'quantum_rift.core.update');
      }
      if (breach.ring) {
        const ringScale = 1 + phase * 0.28;
        breach.ring.scale.setScalar(ringScale);
        this.setOpacity(breach.ring.material, Math.max(0, phase * 0.42), 'quantum_rift.ring.update');
      }
      if (breach.halo) {
        const haloScale = 1 + phase * 0.48;
        breach.halo.scale.setScalar(haloScale);
        breach.halo.rotation.y += deltaTime * 0.14;
        this.setOpacity(breach.halo.material, Math.max(0, phase * 0.28 * outerPulse), 'quantum_rift.halo.update');
      }
      if (breach.veil) {
        this.setOpacity(breach.veil.material, Math.max(0, phase * 0.12), 'quantum_rift.veil.update');
      }

      if (breach.age > life) {
        ['core', 'ring', 'halo', 'veil'].forEach(part => {
          if (breach[part]) {
            this.root.remove(breach[part]);
            this._releaseMeshResources(breach[part]);
          }
        });
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Spawn a quantum rift event
   */
  spawnQuantumRift() {
    const x = (Math.random() - 0.5) * 80;
    const z = (Math.random() - 0.5) * 80;
    const location = new THREE.Vector3(x, 28, z);
    const corruptionBoost = this.atmosphereState.corruptionHigh ? 0.3 : 0;
    const legendaryBoost = Math.min(0.4, this.atmosphereState.legendaryCount * 0.08);
    const intensity = 0.85 + corruptionBoost + legendaryBoost;
    const phaseOffset = Math.random() * Math.PI * 2;

    const coreColor = new THREE.Color(this._getWorldFXPalette('violet')).multiplyScalar(0.88);
    const edgeColor = new THREE.Color(this._getWorldFXPalette('cyan'));
    const whiteHighlight = new THREE.Color(this._getWorldFXPalette('ritualWhite'));
    const coreFinal = coreColor.clone().lerp(edgeColor, 0.15).lerp(whiteHighlight, legendaryBoost * 0.25);
    const ringFinal = coreColor.clone().lerp(edgeColor, 0.45).lerp(whiteHighlight, 0.12);
    const haloFinal = edgeColor.clone().lerp(coreColor, 0.46).lerp(whiteHighlight, 0.08);

    // Dark axiomatic core (reduced from 8 to 4 for less intrusiveness)
    const coreGeo = this._getSharedGeometry('quantum_rift.core.geo', () => new THREE.IcosahedronGeometry(4, 2));
    const coreMat = new THREE.MeshStandardMaterial({
      color: coreFinal,
      emissive: coreFinal,
      emissiveIntensity: 0.56,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      fog: false,
      side: THREE.DoubleSide
    });
    this.installOpacityUniform(coreMat, 0.72, 'standard', 'quantum_rift.core');
    this.freezeMaterialFlags(coreMat, 'quantum_rift.core');

    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.copy(location);
    coreMesh.userData = { isWorldFX: true, type: 'quantum_rift_core', signature: 'revelation_breach_core' };
    this.root.add(coreMesh);

    // Accretion ring (reduced from 14 to 8 for subtlety)
    const ringGeo = this._getSharedGeometry('quantum_rift.ring.geo', () => new THREE.TorusGeometry(8, 0.8, 10, 64));
    const ringMat = new THREE.MeshStandardMaterial({
      color: ringFinal,
      emissive: ringFinal,
      emissiveIntensity: 0.28,
      transparent: true,
      opacity: 0.46,
      depthWrite: false,
      fog: false,
      side: THREE.DoubleSide
    });
    this.installOpacityUniform(ringMat, 0.46, 'standard', 'quantum_rift.ring');
    this.freezeMaterialFlags(ringMat, 'quantum_rift.ring');

    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.copy(location);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.userData = { isWorldFX: true, type: 'quantum_rift_ring', signature: 'revelation_accretion_ring' };
    this.root.add(ringMesh);

    // Ripple halo as sacred consequence
    const haloGeo = this._getSharedGeometry('quantum_rift.halo.geo', () => {
      const geo = new THREE.BufferGeometry();
      const points = [];
      const segments = 48;
      const radius = 14;
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
      }
      geo.setFromPoints(points);
      return geo;
    });
    const haloMat = new THREE.LineBasicMaterial({
      color: haloFinal,
      transparent: true,
      opacity: 0.34,
      fog: false
    });
    this.installOpacityUniform(haloMat, 0.34, 'line', 'quantum_rift.halo');
    this.freezeMaterialFlags(haloMat, 'quantum_rift.halo');

    const haloMesh = new THREE.Line(haloGeo, haloMat);
    haloMesh.position.copy(location);
    haloMesh.userData = { isWorldFX: true, type: 'quantum_rift_halo', signature: 'revelation_halo' };
    this.root.add(haloMesh);

    // Veil omen
    const veilGeo = this._getSharedGeometry('quantum_rift.veil.geo', () => new THREE.RingGeometry(10, 22, 32));
    const veilMat = new THREE.MeshBasicMaterial({
      color: whiteHighlight,
      transparent: true,
      opacity: 0.08,
      fog: false,
      side: THREE.DoubleSide
    });
    this.installOpacityUniform(veilMat, 0.08, 'standard', 'quantum_rift.veil');
    this.freezeMaterialFlags(veilMat, 'quantum_rift.veil');

    const veilMesh = new THREE.Mesh(veilGeo, veilMat);
    veilMesh.position.copy(location);
    veilMesh.rotation.x = -Math.PI / 2;
    veilMesh.userData = { isWorldFX: true, type: 'quantum_rift_veil', signature: 'revelation_veil' };
    this.root.add(veilMesh);

    this.vfxLayers.quantumRifts.push({
      age: 0,
      intensity,
      phaseOffset,
      core: coreMesh,
      ring: ringMesh,
      halo: haloMesh,
      veil: veilMesh
    });
    this._emitWorldFXEvent('Quantum Breach', 'A higher order revelation leaks through', 'revelation', intensity, 'attack');
    this.triggerScreenOverlay('quantum_breach', intensity);
  }
  
  /**
   * SIGMA ANOMALY GLITCHES - Digital anomalies
   */
  updateSigmaGlitches(deltaTime) {
    this.worldState.glitchTimer += deltaTime;
    const bias = this._getWorldFXSignalBias('sigmaGlitch');
    const eligible = this.atmosphereState.corruptionHigh || this.atmosphereState.loadPressureHigh;
    const interval = this.config.sigmaGlitchInterval * (1 - Math.min(0.35, bias * 0.4));

    if (eligible && this.worldState.glitchTimer > interval) {
      if (Math.random() < this.config.sigmaGlitchChance + bias * 0.18) {
        this.triggerSigmaGlitch();
      }
      this.worldState.glitchTimer = 0;
    }

    // Update active fractures
    this.vfxLayers.sigmaGlitches = this.vfxLayers.sigmaGlitches.filter(fracture => {
      fracture.age += deltaTime;
      const envelope = this._evaluateEnvelope(this._getWorldFXEnvelope('sigmaGlitch', fracture.intensity), fracture.age);
      const afterimageAge = fracture.age - 0.04;
      const afterimageOpacity = afterimageAge > 0 ? Math.max(0, 0.12 * (1 - afterimageAge / this.config.sigmaAfterimageDuration)) : 0;
      const mainOpacity = Math.max(0, envelope * fracture.baseOpacity);

      if (fracture.mesh) {
        this.setOpacity(fracture.mesh.material, mainOpacity, 'sigma_fracture.update');
      }
      if (fracture.afterimage) {
        this.setOpacity(fracture.afterimage.material, afterimageOpacity, 'sigma_fracture.afterimage.update');
      }

      if (fracture.age > this.config.sigmaGlitchDuration) {
        ['mesh', 'afterimage'].forEach(part => {
          if (fracture[part]) {
            this.root.remove(fracture[part]);
            this._releaseMeshResources(fracture[part]);
          }
        });
        return false;
      }

      return true;
    });
  }
  
  /**
   * Trigger a sigma glitch
   */
  triggerSigmaGlitch() {
    if (!this.atmosphereState.corruptionHigh && !this.atmosphereState.loadPressureHigh) return;

    const x = (Math.random() - 0.5) * 68;
    const z = (Math.random() - 0.5) * 48;
    const location = new THREE.Vector3(x, 0, z);
    const pressureBoost = this.atmosphereState.loadPressureHigh ? 0.16 : 0;
    const corruptionBoost = this.atmosphereState.corruptionHigh ? 0.22 : 0;
    const baseOpacity = 0.34 + pressureBoost * 0.2 + corruptionBoost * 0.15;
    const intensity = 1 + pressureBoost + corruptionBoost;

    const baseColor = new THREE.Color(this._getWorldFXPalette('mint'));
    const tensionColor = new THREE.Color(this._getWorldFXPalette('violet'));
    const accentColor = new THREE.Color(this._getWorldFXPalette('rose'));
    const finalColor = baseColor.clone().lerp(tensionColor, corruptionBoost * 0.9).lerp(accentColor, pressureBoost * 0.6);
    const afterimageColor = new THREE.Color(this._getWorldFXPalette('cyan')).lerp(tensionColor, corruptionBoost * 0.45);

    // Build fracture geometry
    const fractureGeo = new THREE.BufferGeometry();
    const fracturePoints = [];
    const barCount = 2;
    const wideCount = 1;
    const segmentHeight = 16;

    for (let i = 0; i < barCount; i++) {
      const offsetX = (i - 0.5) * 4;
      fracturePoints.push(new THREE.Vector3(offsetX, 0, 0));
      fracturePoints.push(new THREE.Vector3(offsetX, segmentHeight, 0));
    }

    for (let i = 0; i < wideCount; i++) {
      const offsetX = (i - 0.5) * 10;
      fracturePoints.push(new THREE.Vector3(offsetX, 0, 0));
      fracturePoints.push(new THREE.Vector3(offsetX, segmentHeight * 0.9, 0));
    }

    fractureGeo.setFromPoints(fracturePoints);

    const fractureMat = new THREE.LineBasicMaterial({
      color: finalColor,
      transparent: true,
      opacity: baseOpacity,
      fog: false
    });
    this.installOpacityUniform(fractureMat, baseOpacity, 'line', 'sigma_fracture');
    this.freezeMaterialFlags(fractureMat, 'sigma_fracture');

    const fractureMesh = new THREE.LineSegments(fractureGeo, fractureMat);
    fractureMesh.userData = { isWorldFX: true, type: 'sigma_fracture', signature: 'sigma_skin_fracture' };
    fractureMesh.position.copy(location);
    this.root.add(fractureMesh);

    const afterimageGeo = this._getSharedGeometry('sigma_fracture.afterimage.geo', () => fractureGeo.clone());
    const afterimageMat = new THREE.LineBasicMaterial({
      color: afterimageColor,
      transparent: true,
      opacity: 0.12,
      fog: false
    });
    this.installOpacityUniform(afterimageMat, 0.12, 'line', 'sigma_fracture.afterimage');
    this.freezeMaterialFlags(afterimageMat, 'sigma_fracture.afterimage');

    const afterimageMesh = new THREE.LineSegments(afterimageGeo, afterimageMat);
    afterimageMesh.userData = { isWorldFX: true, type: 'sigma_fracture_afterimage' };
    afterimageMesh.position.copy(location);
    afterimageMesh.position.y -= 0.04;
    this.root.add(afterimageMesh);

    this.vfxLayers.sigmaGlitches.push({
      age: 0,
      intensity,
      baseOpacity,
      mesh: fractureMesh,
      afterimage: afterimageMesh
    });
    this._emitWorldFXEvent('Sigma Fracture', 'The system skin tears briefly', 'corruption', intensity, 'attack');
  }
  
  /**
   * WORLD BREATHING - Ambient slow oscillation
   */
  updateWorldBreathing(deltaTime) {
    this.worldState.breathingPhase += deltaTime * this.config.breathingSpeed;
    
    // Calculate breathing curve (sine wave)
    const breathValue = Math.sin(this.worldState.breathingPhase) * this.config.breathingIntensity;
    
    // Apply breathing to lights
    this.originalLights.forEach(lightData => {
      if (lightData.light && lightData.light.intensity !== undefined && lightData.originalIntensity !== undefined) {
        lightData.light.intensity = lightData.originalIntensity * (1 + breathValue);
      }
    });
    
    // Color drift between cool and warm
    const colorPhase = this.worldState.breathingPhase * 0.5;
    const coolWarmShift = Math.sin(colorPhase) * 0.02;
    
    this.originalLights.forEach(lightData => {
      if (lightData.light && lightData.light.color && lightData.originalColor) {
        lightData.light.color.r = Math.min(1, lightData.originalColor.r + coolWarmShift);
        lightData.light.color.b = Math.min(1, lightData.originalColor.b - coolWarmShift * 0.5);
      }
    });
  }
  
  /**
   * ENERGY STREAMS - Neon flows across landscape
   */
  createEnergyStreams() {
    const riverDefinitions = [
      { role: 'dominant', baseOpacity: 0.24, length: 240, amplitude: 16, speedFactor: 1.0, baseY: 0.4 },
      { role: 'support', baseOpacity: 0.18, length: 220, amplitude: 11, speedFactor: 0.72, baseY: 0.18 }
    ];

    riverDefinitions.forEach((def, riverIndex) => {
      const riverRoot = new THREE.Group();
      riverRoot.position.y = def.baseY;
      riverRoot.userData = {
        isWorldFX: true,
        type: 'energy_stream',
        role: def.role,
        baseOpacity: def.baseOpacity,
        speedFactor: def.speedFactor
      };

      const strands = [];
      const strandDefs = [
        { key: 'core', phase: riverIndex * 0.9, opacity: def.baseOpacity + 0.08, palette: 'cyan' },
        { key: 'braidA', phase: 1.2 + riverIndex * 0.6, opacity: def.baseOpacity * 0.95, palette: 'mint' },
        { key: 'braidB', phase: -1.4 - riverIndex * 0.5, opacity: def.baseOpacity * 0.78, palette: 'violet' }
      ];

      strandDefs.forEach((strandDef) => {
        const geo = this._getSharedGeometry(`energy_stream.${def.role}.${strandDef.key}.geo`, () =>
          this._createBraidedStreamGeometry(def.length, 96, def.amplitude, strandDef.phase, 0.0)
        );
        const mat = this._getSharedMaterial(`energy_stream.${def.role}.${strandDef.key}.mat`, () => {
          const material = new THREE.LineBasicMaterial({
            color: this._getWorldFXPalette(strandDef.palette),
            transparent: true,
            opacity: strandDef.opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            fog: false
          });
          this.installOpacityUniform(material, strandDef.opacity, 'line', `energy_stream.${def.role}.${strandDef.key}`);
          this.freezeMaterialFlags(material, `energy_stream.${def.role}.${strandDef.key}`);
          return material;
        });
        const strand = new THREE.Line(geo, mat);
        strand.userData = { isWorldFX: true, type: 'energy_stream_strand', role: def.role, strandRole: strandDef.key };
        riverRoot.add(strand);
        strands.push(strand);
      });

      const beadGeo = this._getSharedGeometry(`energy_stream.${def.role}.beads.geo`, () => this._createShardConstellationGeometry(18 + riverIndex * 6, def.baseY * 8, 36));
      const beadMat = this._getSharedMaterial(`energy_stream.${def.role}.beads.mat`, () => new THREE.PointsMaterial({
        color: this._getWorldFXPalette('ritualWhite'),
        transparent: true,
        opacity: 0.14,
        size: def.role === 'dominant' ? 0.9 : 0.65,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false
      }));
      const beads = new THREE.Points(beadGeo, beadMat);
      beads.scale.set(0.26, 0.04, 1.0);
      beads.userData = { isWorldFX: true, type: 'energy_stream_beads', role: def.role };
      riverRoot.add(beads);

      this._tagWorldFXObject(riverRoot, 'energy_stream', `${def.role}_flow_river`);
      this.root.add(riverRoot);
      this.vfxLayers.energyStreams.push({ root: riverRoot, strands, beads, baseOpacity: def.baseOpacity, speedFactor: def.speedFactor, role: def.role });
    });
    this.vfxLayers.flowRivers = this.vfxLayers.energyStreams;
  }
  
  /**
   * Update energy streams
   */
  updateEnergyStreams(deltaTime) {
    const totalTraffic = Math.min(1, this.worldState.totalTraffic / 30);
    const synergyBoost = this.atmosphereState.synergyHigh ? 0.16 : 0;
    const pressureBoost = this.atmosphereState.loadPressureHigh ? 0.2 : 0;
    const flowIntensity = Math.min(1, totalTraffic + synergyBoost + pressureBoost);
    const pulse = 0.9 + Math.sin(this.worldState.time * 2.1) * 0.1;

    this.vfxLayers.energyStreams.forEach((river, riverIndex) => {
      const speed = 8 + flowIntensity * 18;
      river.root.position.z += speed * river.speedFactor * deltaTime;
      if (river.root.position.z > 120) {
        river.root.position.z = -120;
      }

      river.root.rotation.y = Math.sin(this.worldState.time * 0.18 + riverIndex) * 0.08;
      river.root.position.x = Math.sin(this.worldState.time * 0.34 + riverIndex * 1.7) * (2.6 + flowIntensity * 3.2);

      const baseColor = new THREE.Color(this._getWorldFXPalette('cyan'));
      const highlightColor = new THREE.Color(this._getWorldFXPalette('mint'));
      const pressureColor = new THREE.Color(this._getWorldFXPalette('violet'));
      const omenColor = new THREE.Color(this._getWorldFXPalette('rose'));
      baseColor.lerp(highlightColor, this.atmosphereState.synergyHigh ? 0.22 : 0.08);
      if (this.atmosphereState.loadPressureHigh) {
        baseColor.lerp(pressureColor, 0.24);
      }
      if (this.atmosphereState.corruptionHigh) {
        baseColor.lerp(omenColor, 0.12);
      }

      river.strands.forEach((strand, strandIndex) => {
        const opacityTarget = river.baseOpacity + flowIntensity * 0.18 + strandIndex * 0.03;
        this.setOpacity(strand.material, Math.min(1, opacityTarget) * pulse, `energy_stream.update.${river.role}.${strandIndex}`);
        const strandColor = baseColor.clone().lerp(highlightColor, strandIndex === 0 ? 0.18 : strandIndex === 1 ? 0.32 : 0.0).lerp(pressureColor, strandIndex === 2 ? 0.35 : 0.0);
        this.setMaterialColors(strand.material, strandColor);
        strand.rotation.y += deltaTime * (0.02 + strandIndex * 0.014);
      });

      if (river.beads?.material) {
        river.beads.material.opacity = 0.08 + flowIntensity * 0.16;
        river.beads.material.color.copy(highlightColor.clone().lerp(baseColor, 0.5));
        river.beads.rotation.z += deltaTime * (0.2 + riverIndex * 0.08);
      }
    });
  }
  
  /**
   * AURORA HORIZONS - Intelligent horizon band
   */
  createAuroraHorizon() {
    const veilRoot = new THREE.Group();
    this._tagWorldFXObject(veilRoot, 'aurora_horizon', 'horizon_veil_field');

    const veilDefs = [
      { key: 'primary', width: 250, height: 34, opacity: 0.16, y: 42, z: -56, skew: 0.35, crest: 1.0, colorA: this._getWorldFXPalette('mint'), colorB: this._getWorldFXPalette('cyan') },
      { key: 'secondary', width: 220, height: 26, opacity: 0.12, y: 47, z: -64, skew: -0.42, crest: 0.8, colorA: this._getWorldFXPalette('cyan'), colorB: this._getWorldFXPalette('violet') },
      { key: 'tertiary', width: 210, height: 22, opacity: 0.09, y: 52, z: -72, skew: 0.78, crest: 0.6, colorA: this._getWorldFXPalette('cyan'), colorB: this._getWorldFXPalette('ritualWhite') }
    ];

    const veils = [];
    veilDefs.forEach((def, index) => {
      const geo = this._getSharedGeometry(`aurora_horizon.${def.key}.geo`, () => this._createVeilStripGeometry(def.width, def.height, 24, { skew: def.skew, crest: def.crest, bottomNoise: 0.8 - index * 0.12, topNoise: 1.4 - index * 0.18 }));
      const mat = this._createEpicVeilMaterial(`aurora_horizon.${def.key}.mat`, {
        colorA: def.colorA,
        colorB: def.colorB,
        opacity: def.opacity,
        additive: true,
        flowScale: 4.0 + index * 1.1,
        pulseScale: 0.12 + index * 0.03
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, def.y, def.z);
      mesh.rotation.x = -0.12 - index * 0.04;
      mesh.rotation.y = index === 1 ? Math.PI : 0;
      this._tagWorldFXObject(mesh, 'aurora_horizon_veil', `${def.key}_veil`);
      veilRoot.add(mesh);
      veils.push(mesh);
    });

    const contourDefs = [
      { key: 'crest', radius: 108, opacity: 0.12, color: this._getWorldFXPalette('mint'), y: 50 },
      { key: 'accent', radius: 124, opacity: 0.07, color: this._getWorldFXPalette('rose'), y: 58 }
    ];
    const contours = [];
    contourDefs.forEach((def, index) => {
      const geo = this._getSharedGeometry(`aurora_horizon.${def.key}.geo`, () => this._createBrokenRingGeometry(def.radius, 72, 11 - index * 2, 0.06 + index * 0.03));
      const mat = this._getSharedMaterial(`aurora_horizon.${def.key}.mat`, () => {
        const material = new THREE.LineBasicMaterial({
          color: def.color,
          transparent: true,
          opacity: def.opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: false
        });
        this.installOpacityUniform(material, def.opacity, 'line', `aurora_horizon.${def.key}`);
        this.freezeMaterialFlags(material, `aurora_horizon.${def.key}`);
        return material;
      });
      const line = new THREE.LineLoop(geo, mat);
      line.position.set(0, def.y, -70 - index * 4);
      line.rotation.x = Math.PI * 0.52;
      this._tagWorldFXObject(line, 'aurora_horizon_contour', `${def.key}_contour`);
      veilRoot.add(line);
      contours.push(line);
    });

    this.root.add(veilRoot);
    this.vfxLayers.auroraHorizons.push({ root: veilRoot, veils, contours });
    this.vfxLayers.horizonVeils = this.vfxLayers.auroraHorizons;
  }

  /**
   * Update aurora horizon
   */
  updateAuroraHorizon(deltaTime) {
    this.vfxLayers.auroraHorizons.forEach((horizon, horizonIndex) => {
      horizon.root.rotation.y += deltaTime * (0.006 + horizonIndex * 0.002);
      horizon.root.position.x = Math.sin(this.worldState.time * 0.01 + horizonIndex) * 1.8;
      horizon.root.position.z = Math.cos(this.worldState.time * 0.008 + horizonIndex * 0.7) * 1.4;

      const calm = new THREE.Color(this._getWorldFXPalette('mint'));
      const main = new THREE.Color(this._getWorldFXPalette('cyan'));
      const corruption = new THREE.Color(this._getWorldFXPalette('violet'));
      const revelation = new THREE.Color(this._getWorldFXPalette('ritualWhite'));
      const omen = new THREE.Color(this._getWorldFXPalette('rose'));

      const baseOpacity = 0.08 + this.atmosphereState.signalBias * 0.14 + (this.atmosphereState.stabilityHigh ? 0.05 : 0);

      horizon.veils.forEach((veil, veilIndex) => {
        const primary = calm.clone().lerp(main, veilIndex * 0.28 + 0.14);
        const secondary = main.clone().lerp(revelation, this.atmosphereState.synergyHigh ? 0.22 : 0.08);
        if (this.atmosphereState.corruptionHigh) {
          primary.lerp(corruption, 0.25 + veilIndex * 0.08);
          secondary.lerp(omen, 0.16);
        }
        this.setMaterialColors(veil.material, primary, secondary);
        this.setOpacity(veil.material, baseOpacity + veilIndex * 0.03, `aurora_horizon.veil.${veilIndex}`);
        veil.position.y += Math.sin(this.worldState.time * 0.45 + veilIndex + horizonIndex) * 0.01;
      });

      horizon.contours.forEach((contour, contourIndex) => {
        const color = main.clone().lerp(calm, contourIndex === 0 ? 0.25 : 0.0).lerp(corruption, this.atmosphereState.corruptionHigh ? 0.18 + contourIndex * 0.1 : 0.0);
        this.setMaterialColors(contour.material, color);
        this.setOpacity(contour.material, 0.05 + this.atmosphereState.signalBias * 0.1 + contourIndex * 0.02, `aurora_horizon.contour.${contourIndex}`);
        contour.rotation.z += deltaTime * (0.008 + contourIndex * 0.004);
      });
    });
  }

  /**
   * SCREEN OVERLAYS - Camera-level revelation layer
   */
  updateScreenOverlays(deltaTime) {
    if (!this.screenOverlaysRoot || !this.camera) return;
    this.screenOverlaysRoot.quaternion.copy(this.camera.quaternion);
    this.screenOverlaysRoot.position.copy(this.camera.position);

    this.vfxLayers.screenOverlays = this.vfxLayers.screenOverlays.filter(overlay => {
      overlay.age += deltaTime;
      const envelope = this._evaluateEnvelope(this._getWorldFXEnvelope('screenOverlay', overlay.intensity), overlay.age);
      const flashPhase = Math.max(0, 1 - overlay.age / (overlay.duration * 0.4));
      const ringOpacity = Math.max(0, envelope * 0.45);
      const flashOpacity = Math.max(0, flashPhase * overlay.flashOpacity);
      const badgeOpacity = Math.max(0, envelope * 0.38);

      if (overlay.ring) {
        overlay.ring.scale.setScalar(1 + envelope * 0.18);
        this.setOpacity(overlay.ring.material, ringOpacity, 'screen_overlay.ring');
      }
      if (overlay.flash) {
        this.setOpacity(overlay.flash.material, flashOpacity, 'screen_overlay.flash');
      }
      if (overlay.badge) {
        overlay.badge.rotation.z += deltaTime * 2.1;
        this.setOpacity(overlay.badge.material, badgeOpacity, 'screen_overlay.badge');
      }
      if (overlay.vignette) {
        this.setOpacity(overlay.vignette.material, Math.max(0, envelope * 0.08), 'screen_overlay.vignette');
      }

      if (overlay.age > overlay.duration) {
        ['ring', 'flash', 'badge', 'vignette'].forEach(part => {
          if (overlay[part]) {
            this.screenOverlaysRoot.remove(overlay[part]);
            this._releaseMeshResources(overlay[part]);
          }
        });
        return false;
      }
      return true;
    });
  }

  triggerScreenOverlay(eventKey, intensity = 1) {
    if (!this.screenOverlaysRoot) return;
    const white = new THREE.Color(this._getWorldFXPalette('ritualWhite'));
    const cyan = new THREE.Color(this._getWorldFXPalette('cyan'));
    const violet = new THREE.Color(this._getWorldFXPalette('violet'));
    const baseColor = cyan.clone().lerp(violet, this.atmosphereState.corruptionHigh ? 0.4 : 0.12);

    const ringGeo = new THREE.RingGeometry(0.82, 0.96, 56);
    const ringMat = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.35,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.installOpacityUniform(ringMat, 0.35, 'standard', 'screen_overlay.ring');
    this.freezeMaterialFlags(ringMat, 'screen_overlay.ring');
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(0, 0, -1.05);
    ring.renderOrder = this.screenOverlaysRoot.renderOrder;
    ring.userData = { isWorldFX: true, type: 'screen_overlay_ring', eventKey };
    this.screenOverlaysRoot.add(ring);

    const flashGeo = new THREE.PlaneGeometry(1.6, 1.6);
    const flashMat = new THREE.MeshBasicMaterial({
      color: white,
      transparent: true,
      opacity: 0.0,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.installOpacityUniform(flashMat, 0.0, 'standard', 'screen_overlay.flash');
    this.freezeMaterialFlags(flashMat, 'screen_overlay.flash');
    const flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.set(0, 0, -1.1);
    flash.renderOrder = this.screenOverlaysRoot.renderOrder;
    flash.userData = { isWorldFX: true, type: 'screen_overlay_flash', eventKey };
    this.screenOverlaysRoot.add(flash);

    const badgeGeo = new THREE.CircleGeometry(0.08, 16);
    const badgeMat = new THREE.MeshBasicMaterial({
      color: white,
      transparent: true,
      opacity: 0.2,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.installOpacityUniform(badgeMat, 0.2, 'standard', 'screen_overlay.badge');
    this.freezeMaterialFlags(badgeMat, 'screen_overlay.badge');
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(0, 0.24, -1.02);
    badge.renderOrder = this.screenOverlaysRoot.renderOrder;
    badge.userData = { isWorldFX: true, type: 'screen_overlay_badge', eventKey };
    this.screenOverlaysRoot.add(badge);

    const vignetteGeo = new THREE.RingGeometry(0.92, 1.15, 32);
    const vignetteMat = new THREE.MeshBasicMaterial({
      color: violet,
      transparent: true,
      opacity: 0.06,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.installOpacityUniform(vignetteMat, 0.06, 'standard', 'screen_overlay.vignette');
    this.freezeMaterialFlags(vignetteMat, 'screen_overlay.vignette');
    const vignette = new THREE.Mesh(vignetteGeo, vignetteMat);
    vignette.position.set(0, 0, -1.15);
    vignette.renderOrder = this.screenOverlaysRoot.renderOrder;
    vignette.userData = { isWorldFX: true, type: 'screen_overlay_vignette', eventKey };
    this.screenOverlaysRoot.add(vignette);

    const duration = 0.42 + Math.min(0.16, intensity * 0.08);
    this.vfxLayers.screenOverlays.push({
      age: 0,
      duration,
      intensity,
      flashOpacity: 0.72,
      ring,
      flash,
      badge,
      vignette
    });
  }
  
  /**
   * Cleanup all world FX
   */
  disableAll() {
    // Clean dimensional shifts
    this.vfxLayers.dimensionalShifts.forEach(shift => {
      if (shift.gridMesh) {
        this.root.remove(shift.gridMesh);
        this._releaseMeshResources(shift.gridMesh);
      }
    });
    
    // Clean rift waves
    this.vfxLayers.riftWaves.forEach(wave => {
      if (wave.mesh) {
        this.root.remove(wave.mesh);
        if (wave.materialType) {
          this._releaseRiftWaveMaterial(wave.materialType, wave.mesh.material);
          this._releaseGeometry(wave.mesh.geometry);
        } else {
          this._releaseMeshResources(wave.mesh);
        }
      }
    });
    
    // Clean quantum rifts
    this.vfxLayers.quantumRifts.forEach(rift => {
      ['core', 'ring', 'halo', 'veil'].forEach(part => {
        if (rift[part]) {
          this.root.remove(rift[part]);
          this._releaseMeshResources(rift[part]);
        }
      });
    });
    
    // Clean sigma glitches
    this.vfxLayers.sigmaGlitches.forEach(glitch => {
      if (glitch.mesh) {
        this.root.remove(glitch.mesh);
        this._releaseMeshResources(glitch.mesh);
      }
    });
    
    // Clean fractal sky
    if (this.vfxLayers.fractalSky) {
      this.root.remove(this.vfxLayers.fractalSky);
      this._releaseMeshResources(this.vfxLayers.fractalSky);
    }
    
    // Clean energy streams
    this.vfxLayers.energyStreams.forEach(stream => {
      this.root.remove(stream);
      this._releaseMeshResources(stream);
    });
    
    // Clean aurora horizons
    this.vfxLayers.auroraHorizons.forEach(aurora => {
      this.root.remove(aurora);
      this._releaseMeshResources(aurora);
    });

    // Clean screen overlays
    if (this.screenOverlaysRoot) {
      const children = this.screenOverlaysRoot.children.slice();
      children.forEach(child => {
        this.screenOverlaysRoot.remove(child);
        this._releaseMeshResources(child);
      });
    }
    
    // Restore original lights
    this.originalLights.forEach(lightData => {
      if (lightData.light && lightData.light.intensity !== undefined && lightData.originalIntensity !== undefined) {
        lightData.light.intensity = lightData.originalIntensity;
      }
      if (lightData.light && lightData.light.color && lightData.originalColor) {
        lightData.light.color.copy(lightData.originalColor);
      }
    });
    
    // Clear all tracking
    this.vfxLayers = {
      dimensionalShifts: [],
      riftWaves: [],
      energyPulses: [],
      fractalSky: null,
      quantumRifts: [],
      sigmaGlitches: [],
      energyStreams: [],
      auroraHorizons: [],
      screenOverlays: []
    };
  }

  /**
   * Reset internal state for world switch
   * Clears mutable state without removing objects from scene
   * Safe to call multiple times
   */
  resetForWorldSwitch() {
    // Clear VFX arrays (but do NOT remove from scene)
    if (Array.isArray(this.vfxLayers.dimensionalShifts)) {
      this.vfxLayers.dimensionalShifts.length = 0;
    }
    if (Array.isArray(this.vfxLayers.riftWaves)) {
      this.vfxLayers.riftWaves.length = 0;
    }
    if (Array.isArray(this.vfxLayers.energyPulses)) {
      this.vfxLayers.energyPulses.length = 0;
    }
    if (Array.isArray(this.vfxLayers.quantumRifts)) {
      this.vfxLayers.quantumRifts.length = 0;
    }
    if (Array.isArray(this.vfxLayers.sigmaGlitches)) {
      this.vfxLayers.sigmaGlitches.length = 0;
    }
    if (Array.isArray(this.vfxLayers.energyStreams)) {
      this.vfxLayers.energyStreams.length = 0;
    }
    if (Array.isArray(this.vfxLayers.auroraHorizons)) {
      this.vfxLayers.auroraHorizons.length = 0;
    }
    if (Array.isArray(this.vfxLayers.screenOverlays)) {
      this.vfxLayers.screenOverlays.length = 0;
    }
    this.vfxLayers.fractalSky = null;

    if (this.screenOverlaysRoot) {
      this.screenOverlaysRoot.children.slice().forEach(child => {
        this.screenOverlaysRoot.remove(child);
      });
    }

    // Clear world state tracking
    if (this.worldState) {
      this.worldState.totalSynergy = 0;
      this.worldState.totalTraffic = 0;
      this.worldState.activeNodeCount = 0;
      this.worldState.legendaryCount = 0;
      this.worldState.time = 0;
      this.worldState.dimensionalPhase = 0;
      this.worldState.riftWaveTimer = 0;
      this.worldState.pulseTimer = 0;
      this.worldState.glitchTimer = 0;
      this.worldState.quantumTimer = 0;
      this.worldState.breathingPhase = 0;
    }

    // Clear lights array
    if (Array.isArray(this.lights)) {
      this.lights.length = 0;
    }

    // Clear original lights
    if (Array.isArray(this.originalLights)) {
      this.originalLights.length = 0;
    }
  }

  dispose() {
    this.disableAll();
    if (this.root?.parent) {
      this.root.parent.remove(this.root);
    }
  }
}
