/**
 * LinkResonanceFlowSystem_Session124.js
 * ============================================================================
 * DIRECTIONAL LINK RESONANCE FLOW VISUALIZATION
 * 
 * Creates pulsing directional energy flows along links that:
 * - Travel from source to destination node
 * - Pulse speed modulated by synergy and activity
 * - Intensity reflects the canonical link visual profile
 * - Multiple pulses travel simultaneously
 * - Color matches link state (harmony, corruption, synergy)
 * - Creates visual sense of "energy flowing through network"
 * 
 * FEATURES:
 * 1. Directional Pulses: Energy packets traveling along links
 * 2. Load Pressure Reactivity: Pulse speed increases with link loadPressure
 * 3. Stability Floor: Stable links seed deterministic visible bursts
 * 3. Multi-Pulse Support: Multiple energy packets per link
 * 4. Profile Encoding: Pulse intensity reflects canonical link metrics
 * 5. State Colors: Load pressure / corruption modulation
 * 6. Bidirectional Flow: Can show energy in both directions
 * 7. Pulse Spawning: Triggered by network activity
 * 8. Zero Allocations: Complete object pool
 * 
 * ARCHITECTURE:
 * ✅ Adapter-only (reads link state, no changes to gameplay)
 * ✅ GPU-driven rendering (custom line shader)
 * ✅ CPU-driven pulse positioning (bezier curve following)
 * ✅ Per-link pulse pool (reused across frames)
 * ✅ Deterministic spawning (based on loadPressure + stability metrics)
 * 
 * @author VFX Technical Director — ATOMA Project Session 124
 * @version 1.0.0
 */

import * as THREE from 'three';
import VisualTime from './src/time/VisualTime.js';
import { applyLinkRenderLayer } from './LinkRenderLayerPolicy.js';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { tagAllowedSphere, clampSphere } from './VisualSpherePolicy.js';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const _linkIdSeedCache = new Map();
const getLinkSeed = (linkId) => {
  if (linkId === null || linkId === undefined) return 0;
  const key = String(linkId);
  const cached = _linkIdSeedCache.get(key);
  if (cached !== undefined) return cached;
  let seed = 0;
  for (let i = 0; i < key.length; i += 1) {
    seed = (seed * 31 + key.charCodeAt(i)) >>> 0;
  }
  const normalized = seed / 0xFFFFFFFF;
  _linkIdSeedCache.set(key, normalized);
  return normalized;
};

export class LinkResonanceFlowSystem_Session124 {
  constructor(scene, world, config = {}) {
    this.scene = scene;
    this.world = world;
    
    this.config = {
      // Pulse spawning
      baseSpawnRate: config.baseSpawnRate ?? 2.0,        // Pulses per second
      repeatPulseIntervalSeconds: config.repeatPulseIntervalSeconds ?? 3.0,
      manualRepeatPauseSeconds: config.manualRepeatPauseSeconds ?? 10.0,
      loadPressureSpawnBoost: config.loadPressureSpawnBoost ?? config.synergySpawnBoost ?? 1.6,
      pulseSpeedBase: config.pulseSpeedBase ?? 0.96,     // Units per second
      pulseSpeedLoadPressureMult: config.pulseSpeedLoadPressureMult ?? config.pulseSpeedSynergyMult ?? 0.95,
      loadPressureVisualStart: config.loadPressureVisualStart ?? 0.35,
      loadPressureOverloadThreshold: config.loadPressureOverloadThreshold ?? 0.65,
      overloadSpawnBoost: config.overloadSpawnBoost ?? 1.28,
      overloadIntensityBoost: config.overloadIntensityBoost ?? 0.34,
      overloadSheathBoost: config.overloadSheathBoost ?? 0.38,
      overloadTrailBoost: config.overloadTrailBoost ?? 0.52,
      overloadJitter: config.overloadJitter ?? 0.075,

      // Stability floor
      stabilityVisualStart: config.stabilityVisualStart ?? 0.4,
      stabilityMediumThreshold: config.stabilityMediumThreshold ?? 0.6,
      stabilityStrongThreshold: config.stabilityStrongThreshold ?? 0.8,
      stabilityPulseCooldown: config.stabilityPulseCooldown ?? 2.0,
      stabilityPulseSpeedMult: config.stabilityPulseSpeedMult ?? 0.22,
      stabilityPulseRadiusMult: config.stabilityPulseRadiusMult ?? 0.14,
      stabilityPulseSheathBoost: config.stabilityPulseSheathBoost ?? 0.18,
      stabilityPulseTrailBoost: config.stabilityPulseTrailBoost ?? 0.16,
      stabilityIntensityBoost: config.stabilityIntensityBoost ?? 0.28,
      stabilityOpacityBoost: config.stabilityOpacityBoost ?? 0.24,
      
      // Pulse appearance
      pulseRadiusBase: config.pulseRadiusBase ?? 0.28,
      pulseRadiusLoadPressureMult: config.pulseRadiusLoadPressureMult ?? config.pulseRadiusSynergyMult ?? 0.18,
      pulseMaxRadius: config.pulseMaxRadius ?? 0.8,
      pulseGlowIntensity: config.pulseGlowIntensity ?? 1.5,
      pulseSheathOpacity: config.pulseSheathOpacity ?? 0.54,
      pulseTrailOpacity: config.pulseTrailOpacity ?? 0.34,
      pulseTrailLengthBase: config.pulseTrailLengthBase ?? 0.34,
      pulseTrailLengthLoadMult: config.pulseTrailLengthLoadMult ?? 1.4,
      
      // Pulse lifetime
      pulseLifetime: config.pulseLifetime ?? 2.0,         // Seconds before despawn
      pulseAlphaDecay: config.pulseAlphaDecay ?? 0.7,     // Fade at end

      // Phase-jump lifecycle
      phaseJumpEnabled: config.phaseJumpEnabled ?? true,
      phaseFadeInSeconds: config.phaseFadeInSeconds ?? 0.18,
      phaseFadeOutSeconds: config.phaseFadeOutSeconds ?? 0.24,
      phaseReseedSeconds: config.phaseReseedSeconds ?? 0.18,
      phaseHopWorldMin: config.phaseHopWorldMin ?? 1.85,
      phaseHopWorldMax: config.phaseHopWorldMax ?? 4.8,
      phaseJumpGapWorldMin: config.phaseJumpGapWorldMin ?? 0.55,
      phaseJumpGapWorldMax: config.phaseJumpGapWorldMax ?? 1.35,
      phaseTravelDurationMin: config.phaseTravelDurationMin ?? 0.14,
      phaseTravelDurationMult: config.phaseTravelDurationMult ?? 0.96,
      phaseTravelDurationJitter: config.phaseTravelDurationJitter ?? 0.28,
      
      // Intensity modulation
      baseIntensity: config.baseIntensity ?? 0.8,
      loadPressureIntensityFactor: config.loadPressureIntensityFactor ?? config.qualityIntensityFactor ?? 0.6,
      corruptionDampen: config.corruptionDampen ?? 0.6,
      
      // Flow direction
      bidirectional: config.bidirectional ?? false,       // Both directions
      pulseBidirectionalChance: config.pulseBidirectionalChance ?? 0.1,
      
      // LOD
      lodDistanceThreshold: config.lodDistanceThreshold ?? 60,
      lodPulseSuppression: config.lodPulseSuppression ?? 0.5,
      
      // Safety
      maxPulsesPerLink: config.maxPulsesPerLink ?? 8,
      maxTotalPulses: config.maxTotalPulses ?? 1024,
      enabled: config.enabled ?? true,
      debugMode: config.debugMode ?? false,
      debugPulseVisuals: config.debugPulseVisuals ?? config.debugMode ?? false,
      debugPulseScaleMult: config.debugPulseScaleMult ?? 6.0,
      debugPulseGlowMult: config.debugPulseGlowMult ?? 4.5,
      debugPulseOpacityMult: config.debugPulseOpacityMult ?? 1.5,
      debugPulseTrailMult: config.debugPulseTrailMult ?? 4.0,
    };
    
    // Pulse pools per link
    this.linkPulses = new Map();  // linkId → Array<pulse>
    this.globalPulses = [];        // All active pulses (for sorting)
    
    // Rendering
    this.pulseGeometry = null;
    this.pulseMaterial = null;
    this.pulseMeshGeometry = null;
    this.pulseSheathGeometry = null;
    this.pulseTrailGeometry = null;
    this.pulseShardGeometry = null;
    this.pulseHaloGeometry = null;
    this.pulseSwirlGeometry = null;
    this.pulseMaterialTemplate = null;
    this.pulseMeshPool = [];
    this.pulseGroup = null;
    
    // Spawn tracking
    this.spawnAccumulators = new Map(); // linkId → accumulated spawn time
    this._repeatSuppressedUntilByLinkId = new Map();
    this._timeOrigin = undefined;
    this._lastVisualTime = undefined;
    
    // Statistics
    this.stats = {
      activePulses: 0,
      pulseSpawnCount: 0,
      linksWithFlow: 0,
    };

    this._scratchVecA = new THREE.Vector3();
    this._scratchVecB = new THREE.Vector3();
    this._scratchQuat = new THREE.Quaternion();
    this._scratchUpVector = new THREE.Vector3(0, 1, 0);
    this._debugColor = new THREE.Color(1.0, 0.03, 0.05);
    this._debugAccentColor = new THREE.Color(1.0, 0.4, 0.4);
    this._debugVoidColor = new THREE.Color(0.08, 0.0, 0.0);
    
    this.init();
    
    console.log('[Session 124] LinkResonanceFlowSystem initialized');
  }

  setDebugPulseVisuals(enabled, options = {}) {
    this.config.debugPulseVisuals = !!enabled;

    if (options && typeof options === 'object') {
      if (Number.isFinite(options.scaleMult)) this.config.debugPulseScaleMult = Math.max(0.1, options.scaleMult);
      if (Number.isFinite(options.glowMult)) this.config.debugPulseGlowMult = Math.max(0.1, options.glowMult);
      if (Number.isFinite(options.opacityMult)) this.config.debugPulseOpacityMult = Math.max(0.1, options.opacityMult);
      if (Number.isFinite(options.trailMult)) this.config.debugPulseTrailMult = Math.max(0.1, options.trailMult);
    }

    for (const pulse of this.globalPulses) {
      pulse.debugPulse = this.config.debugPulseVisuals === true;
    }

    return this.config.debugPulseVisuals;
  }

  isDebugPulseVisualsEnabled() {
    return this.config.debugPulseVisuals === true;
  }

  _getLinkSource(link) {
    return link?.source || link?.sourceNode || link?.nodeA || link?.userData?.nodeA || link?.userData?.sourceNode || null;
  }

  _getLinkTarget(link) {
    return link?.target || link?.targetNode || link?.nodeB || link?.userData?.nodeB || link?.userData?.targetNode || null;
  }

  _readLinkPressureMetrics(link) {
    const metrics = link?.userData?.metrics || {};
    const sourceMetrics = link?.source?.userData?.metrics || link?.sourceNode?.userData?.metrics || {};
    const targetMetrics = link?.target?.userData?.metrics || link?.targetNode?.userData?.metrics || {};
    const endpointAvg = (key, fallback = 0) => {
      const a = Number.isFinite(sourceMetrics?.[key]) ? sourceMetrics[key] : null;
      const b = Number.isFinite(targetMetrics?.[key]) ? targetMetrics[key] : null;
      if (a === null && b === null) return fallback;
      if (a === null) return b;
      if (b === null) return a;
      return (a + b) * 0.5;
    };
    const loadPressure = clamp01(
      metrics.loadPressure ??
      link?.userData?.loadPressure ??
      link?.userData?.flowState?.loadPressure ??
      endpointAvg('loadPressure', 0) ??
      endpointAvg('load', 0) ??
      0
    );
    const stability = clamp01(
      metrics.stability ??
      link?.userData?.stability ??
      link?.userData?.flowState?.stability ??
      endpointAvg('stability', 0) ??
      (Number.isFinite(metrics.instability) ? 1 - metrics.instability : 0)
    );
    const synergy = clamp01(
      metrics.synergy ??
      link?.userData?.synergy ??
      link?.userData?.flowState?.synergy ??
      endpointAvg('synergy', 0)
    );

    return {
      loadPressure,
      corruption: clamp01(metrics.corruption ?? 0),
      synergy,
      stability
    };
  }

  _getLoadPressureProfile(loadPressure) {
    const visualStart = Math.max(0.01, this.config.loadPressureVisualStart ?? 0.35);
    const overloadStart = Math.max(visualStart + 0.01, this.config.loadPressureOverloadThreshold ?? 0.65);
    const pressurizedMix = clamp01((loadPressure - visualStart) / (overloadStart - visualStart));
    const overloadMix = clamp01((loadPressure - overloadStart) / (1.0 - overloadStart));

    return {
      stage: loadPressure >= overloadStart ? 'overload' : (loadPressure >= visualStart ? 'pressurized' : 'subtle'),
      pressurizedMix,
      overloadMix,
      visualStart,
      overloadStart
    };
  }

  _getStabilityProfile(stability) {
    const visualStart = Math.max(0.01, this.config.stabilityVisualStart ?? 0.4);
    const mediumStart = Math.max(visualStart + 0.01, this.config.stabilityMediumThreshold ?? 0.6);
    const strongStart = Math.max(mediumStart + 0.01, this.config.stabilityStrongThreshold ?? 0.8);

    const floorMix = clamp01((stability - visualStart) / (1.0 - visualStart));
    const mediumMix = clamp01((stability - mediumStart) / (1.0 - mediumStart));
    const strongMix = clamp01((stability - strongStart) / (1.0 - strongStart));

    let burstCount = 0;
    let stage = 'subtle';

    if (stability >= strongStart) {
      burstCount = 3;
      stage = 'locked';
    } else if (stability >= mediumStart) {
      burstCount = 2;
      stage = 'stable';
    } else if (stability >= visualStart) {
      burstCount = 1;
      stage = 'steady';
    }

    return {
      active: burstCount > 0,
      stage,
      burstCount,
      floorMix,
      mediumMix,
      strongMix,
      visualStart,
      mediumStart,
      strongStart
    };
  }

  _buildPhaseJumpStep(pulse, startPosition) {
    if (!pulse?.link) return null;

    const linkLength = Math.max(0.0001, this._getLinkLength(pulse.link));
    const direction = pulse.direction >= 0 ? 1 : -1;
    const terminalT = direction > 0 ? 1.0 : 0.0;
    const remainingT = direction > 0
      ? Math.max(0, terminalT - startPosition)
      : Math.max(0, startPosition - terminalT);

    if (remainingT <= 0.0001) return null;

    const segmentIndex = pulse.phaseSegmentIndex ?? 0;
    const rawSeed = (pulse.anomalySeed ?? 0) * 9.137 + segmentIndex * 1.731 + (pulse.phaseSeed ?? 0) * 0.173;
    const hopSeed = Math.sin(rawSeed * 1.21 + (pulse.driftSeed ?? 0) * 0.07) * 0.5 + 0.5;
    const gapSeed = Math.sin(rawSeed * 1.73 + (pulse.twistSeed ?? 0) * 0.05 + 0.93) * 0.5 + 0.5;
    const loadPressure = pulse.loadPressure ?? 0;
    const stabilityMix = pulse.stabilityMix ?? 0;
    const overpressure = pulse.overpressure ?? 0;

    const hopWorldMin = Math.max(0.18, this.config.phaseHopWorldMin ?? 1.85);
    const hopWorldMax = Math.max(hopWorldMin + 0.15, this.config.phaseHopWorldMax ?? 4.8);
    const gapWorldMin = Math.max(0.04, this.config.phaseJumpGapWorldMin ?? 0.55);
    const gapWorldMax = Math.max(gapWorldMin + 0.05, this.config.phaseJumpGapWorldMax ?? 1.35);

    const hopWorldBase = hopWorldMin + hopSeed * (hopWorldMax - hopWorldMin);
    const hopWorld = hopWorldBase * (0.88 + loadPressure * 0.16 + stabilityMix * 0.16 + overpressure * 0.06);
    const remainingWorld = remainingT * linkLength;
    const terminalSlackWorld = Math.max(0.24, linkLength * 0.055);
    const complete = remainingWorld <= hopWorld + terminalSlackWorld;
    const visibleWorld = complete ? remainingWorld : Math.min(remainingWorld, hopWorld);
    const gapWorldBase = gapWorldMin + gapSeed * (gapWorldMax - gapWorldMin);
    const gapWorld = complete ? 0 : Math.min(gapWorldBase, Math.max(0, remainingWorld - visibleWorld));

    const visibleT = Math.min(remainingT, visibleWorld / linkLength);
    const gapT = Math.min(Math.max(0, gapWorld / linkLength), Math.max(0, remainingT - visibleT));
    const endT = direction > 0
      ? Math.min(terminalT, startPosition + visibleT)
      : Math.max(terminalT, startPosition - visibleT);
    const nextStartT = complete
      ? terminalT
      : (direction > 0
        ? Math.min(terminalT, endT + gapT)
        : Math.max(terminalT, endT - gapT));

    const fadeInDuration = Math.max(0.08, (this.config.phaseFadeInSeconds ?? 0.18) * (0.82 + hopSeed * 0.34));
    const travelDuration = Math.max(
      this.config.phaseTravelDurationMin ?? 0.14,
      (visibleWorld / Math.max(0.12, pulse.speed)) *
        (this.config.phaseTravelDurationMult ?? 0.96) *
        (0.88 + hopSeed * (this.config.phaseTravelDurationJitter ?? 0.28))
    );
    const fadeOutDuration = Math.max(0.10, (this.config.phaseFadeOutSeconds ?? 0.24) * (0.86 + (1.0 - hopSeed) * 0.34));
    const reseedDuration = complete
      ? 0
      : Math.max(0.08, (this.config.phaseReseedSeconds ?? 0.18) + gapWorld * 0.12);

    return {
      segmentIndex,
      startT: startPosition,
      endT,
      nextStartT,
      direction,
      terminalT,
      visibleWorld,
      gapWorld,
      fadeInDuration,
      travelDuration,
      fadeOutDuration,
      reseedDuration,
      complete,
      hopSeed,
      gapSeed,
    };
  }
  
  /**
   * Initialize rendering system
   */
  init() {
    // Create pulse rendering group
    this.pulseGroup = new THREE.Group();
    this.pulseGroup.frustumCulled = true;
    this.pulseGroup.name = 'LinkResonancePulses_Session124';
    this.pulseGroup.userData.isLinkResonanceFlow = true;
    this.pulseGroup.userData.linkVisualFamily = 'resonanceFlow';
    applyLinkRenderLayer(this.pulseGroup, 'LINK_RESONANCE');
    this.scene?.add?.(this.pulseGroup);
    
    // Pre-allocate pulse meshes for efficient rendering
    this._initializePulseMeshes();
  }

  rebindScene(scene) {
    if (!scene || scene === this.scene && this.pulseGroup?.parent === scene) {
      return;
    }

    if (this.pulseGroup?.parent && this.pulseGroup.parent !== scene) {
      this.pulseGroup.parent.remove(this.pulseGroup);
    }

    this.scene = scene;
    if (this.scene && this.pulseGroup && this.pulseGroup.parent !== this.scene) {
      this.scene.add(this.pulseGroup);
    }
  }
  
  /**
   * Initialize pooled pulse meshes
   */
  _initializePulseMeshes() {
    // Shared geometries for pulse meshes.
    // The resonance entity should read as unstable alien presence:
    // low-poly base, but distorted through shader motion and shell layering.
    this.pulseMeshGeometry = new THREE.IcosahedronGeometry(1, 1);
    this.pulseSheathGeometry = new THREE.IcosahedronGeometry(1, 1);
    this.pulseTrailGeometry = new THREE.CylinderGeometry(0.05, 0.012, 1, 5, 1, true);
    this.pulseShardGeometry = new THREE.OctahedronGeometry(0.16, 0);
    this.pulseHaloGeometry = new THREE.TorusGeometry(1, 0.048, 6, 24, Math.PI * 1.84);
    this.pulseSwirlGeometry = new THREE.TorusKnotGeometry(0.52, 0.082, 32, 8, 2, 3);

    // Shared shader material template. Every pulse part clones this shader and
    // only varies uniforms, so the entity keeps one visual language.
    this.pulseMaterialTemplate = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uColor: { value: new THREE.Color(0x6ff6ff) },
        uAccentColor: { value: new THREE.Color(0xffffff) },
        uVoidColor: { value: new THREE.Color(0x080014) },
        uOpacity: { value: 1.0 },
        uGlowSize: { value: this.config.pulseGlowIntensity },
        uDistortion: { value: 0.14 },
        uNoiseScale: { value: 2.4 },
        uNoiseSpeed: { value: 0.9 },
        uPulsePhase: { value: 0.0 },
        uPulseSeed: { value: 0.0 },
        uFresnelPower: { value: 2.4 },
        uIridescence: { value: 0.24 },
        uVoidMix: { value: 0.28 },
        uCorruption: { value: 0.0 },
        uShellBreath: { value: 0.12 },
        uShellBias: { value: 0.0 },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying float vNoise;
        varying float vPulse;
        uniform float uTime;
        uniform float uDistortion;
        uniform float uNoiseScale;
        uniform float uNoiseSpeed;
        uniform float uPulsePhase;
        uniform float uPulseSeed;
        uniform float uShellBreath;
        uniform float uShellBias;

        float spectralNoise(vec3 p) {
          float a = sin(dot(p, vec3(1.41, 1.73, 1.11)) + uTime * uNoiseSpeed + uPulsePhase);
          float b = sin(dot(p, vec3(2.11, 1.17, 2.67)) - uTime * (uNoiseSpeed * 1.37) + uPulseSeed * 11.0);
          return (a * 0.72 + b * 0.28) * 0.5;
        }

        void main() {
          vec3 localPos = position;
          float noiseSample = spectralNoise(localPos * uNoiseScale + normal * 0.33);
          float pulseWave = 0.5 + 0.5 * sin(uTime * uNoiseSpeed * 1.7 + uPulsePhase + localPos.y * 3.4 + uPulseSeed * 6.28318530718);
          float shellLift = uShellBreath * (0.5 + 0.5 * sin(uTime * 0.58 + uShellBias * 3.0));
          float displacement = noiseSample * uDistortion + (pulseWave - 0.5) * shellLift;
          vec3 displaced = position + normal * displacement;
          vNoise = noiseSample;
          vPulse = pulseWave;
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
          vWorldPos = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform vec3 uAccentColor;
        uniform vec3 uVoidColor;
        uniform float uOpacity;
        uniform float uGlowSize;
        uniform float uFresnelPower;
        uniform float uIridescence;
        uniform float uVoidMix;
        uniform float uCorruption;
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying float vNoise;
        varying float vPulse;

        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          float fresnel = pow(1.0 - abs(dot(normalize(vNormal), viewDir)), uFresnelPower);
          float depthField = smoothstep(-0.55, 0.85, 1.0 - abs(vNoise));
          float pulseGlow = 0.5 + 0.5 * sin(vPulse * 6.28318530718 + vNoise * 8.0);
          float innerGlow = clamp(fresnel * 0.72 + depthField * 0.28 + pulseGlow * 0.1, 0.0, 1.0);

          vec3 color = mix(uVoidColor, uColor, innerGlow);
          color = mix(color, uAccentColor, clamp(fresnel * 0.55 + depthField * 0.15, 0.0, 1.0));

          color = mix(color, vec3(0.78, 0.46, 1.0), uIridescence * 0.12);

          if (uCorruption > 0.0) {
            color = mix(color, vec3(0.96, 0.16, 0.24), uCorruption * 0.24);
            color = mix(color, vec3(0.62, 0.08, 0.95), uCorruption * 0.18);
          }

          float alpha = uOpacity * (0.12 + fresnel * uGlowSize + depthField * 0.18 + pulseGlow * 0.04);
          color *= 0.76 + fresnel * 0.9 + depthField * 0.22;

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
      fog: false,
    });
  }
  
  /**
   * Update resonance flow system each frame
   */
  update(deltaTime, links, camera) {
    if (!this.config.enabled || !Array.isArray(links) || links.length === 0) return;
    const deltaVisual = Number.isFinite(deltaTime) ? Math.max(0, deltaTime) : 0;
    const currentFrameId = Number.isFinite(VisualTime.frameId) ? VisualTime.frameId : null;
    if (currentFrameId !== null && this._lastUpdateFrameId === currentFrameId && deltaVisual <= 0) {
      return;
    }

    this._lastUpdateFrameId = currentFrameId;
    this._elapsedTime = (this._elapsedTime ?? 0) + deltaVisual;
    const currentVisualTime = this._elapsedTime;
    this._lastVisualTime = currentVisualTime;

    // Update spawn accumulators and spawn new pulses
    this._updateSpawning(currentVisualTime, links);

    // Update active pulses
    this._updateActivePulses(deltaVisual);

    // Update pulse mesh positions and appearances
    this._updatePulseMeshes();

    // Update LOD based on camera
    if (camera) {
      this._updateLOD(camera);
    }

    // Cleanup dead pulses
    this._cleanupDeadPulses();
    
    this.stats.activePulses = this.globalPulses.length;
    this.stats.linksWithFlow = this.linkPulses.size;
  }
  
  /**
   * Update pulse spawning based on link load pressure and stability floor
   */
  _updateSpawning(currentVisualTime, links) {
    for (const link of links) {
      if (!link || !link.userData || link.id === null || link.id === undefined) continue;
      
      const linkId = String(link.id ?? link.linkId ?? '');
      if (!linkId) continue;
      const repeatInterval = Math.max(0.15, this.config.repeatPulseIntervalSeconds ?? 3.0);
      const suppressedUntil = this._repeatSuppressedUntilByLinkId.get(linkId) ?? Number.NEGATIVE_INFINITY;
      if (currentVisualTime < suppressedUntil) continue;

      const linkPulses = this.linkPulses.get(linkId);
      if (Array.isArray(linkPulses) && linkPulses.some((pulse) => pulse?.active)) {
        if (this.spawnAccumulators.has(linkId)) {
          const accumulatorEntry = this.spawnAccumulators.get(linkId);
          accumulatorEntry.lastTime = currentVisualTime;
          accumulatorEntry.lastRepeatTime = currentVisualTime;
        }
        continue;
      }

      // Get or create spawn accumulator
      if (!this.spawnAccumulators.has(linkId)) {
        this.spawnAccumulators.set(linkId, {
          accumulator: 0,
          lastTime: currentVisualTime,
          lastStabilityBurstTime: Number.NEGATIVE_INFINITY
        });
      }

      const accumulatorEntry = this.spawnAccumulators.get(linkId);
      const delta = currentVisualTime - (accumulatorEntry.lastTime ?? currentVisualTime);
      accumulatorEntry.lastTime = currentVisualTime;

      if (!Number.isFinite(accumulatorEntry.lastRepeatTime)) {
        accumulatorEntry.lastRepeatTime = currentVisualTime - repeatInterval;
      }

      const elapsedSinceRepeat = currentVisualTime - accumulatorEntry.lastRepeatTime;
      if (elapsedSinceRepeat >= repeatInterval) {
        const repeatCount = Math.max(1, Math.floor(elapsedSinceRepeat / repeatInterval));
        for (let i = 0; i < repeatCount; i += 1) {
          this._spawnPulse(link);
        }
        accumulatorEntry.lastRepeatTime += repeatCount * repeatInterval;
      }
    }
  }
  
  /**
   * Spawn new pulse on link
   */
  _spawnPulse(link) {
    if (this.globalPulses.length >= this.config.maxTotalPulses) return;
    
    const linkId = link?.id ?? link?.linkId;
    if (linkId === null || linkId === undefined) return;
    const linkSeed = getLinkSeed(linkId);
    const metrics = this._readLinkPressureMetrics(link);
    const loadPressure = metrics.loadPressure;
    const corruption = metrics.corruption;
    const synergy = metrics.synergy;
    const stabilityProfile = this._getStabilityProfile(metrics.stability);
    const stabilityMix = stabilityProfile.floorMix;
    const pressureProfile = this._getLoadPressureProfile(loadPressure);
    const overpressure = clamp01(loadPressure * (1.0 - metrics.stability * 0.35));
    const overloadMix = pressureProfile.overloadMix;
    const debugPulse = this.config.debugPulseVisuals === true;
    const anomalySeed = (linkSeed * 0.61803398875 + (this.stats.pulseSpawnCount + 1) * 0.173 + loadPressure * 0.11 + stabilityMix * 0.09 + overloadMix * 0.07) % 1;
    const direction = this.config.bidirectional && Math.random() < this.config.pulseBidirectionalChance ? -1 : 1;
    
    // Get or create pulse pool for this link
    if (!this.linkPulses.has(linkId)) {
      this.linkPulses.set(linkId, []);
    }
    
    const pulses = this.linkPulses.get(linkId);
    if (pulses.length >= this.config.maxPulsesPerLink) return;
    
    // Create pulse object
    const pulse = {
      linkId,
      link,
      
      // Position along link (0 = source, 1 = destination)
      position: direction > 0 ? 0 : 1,
      
      // Speed based on load pressure
      speed: (this.config.pulseSpeedBase + 
             loadPressure * this.config.pulseSpeedLoadPressureMult +
             stabilityMix * this.config.stabilityPulseSpeedMult) * (0.9 + anomalySeed * 0.08),
      overloadMix,
      
      // Appearance
      radius: Math.min(
        this.config.pulseRadiusBase +
        loadPressure * this.config.pulseRadiusLoadPressureMult +
        stabilityMix * this.config.stabilityPulseRadiusMult,
        this.config.pulseMaxRadius
      ) * (debugPulse ? 1.75 : 1.0),

      sheathOpacity: Math.min(1.0,
        this.config.pulseSheathOpacity +
        loadPressure * 0.22 +
        overloadMix * 0.22 +
        stabilityMix * this.config.stabilityPulseSheathBoost
      ) * (debugPulse ? 1.2 : 1.0),
      trailOpacity: Math.min(1.0,
        this.config.pulseTrailOpacity +
        overpressure * 0.24 +
        overloadMix * 0.28 +
        stabilityMix * this.config.stabilityPulseTrailBoost
      ) * (debugPulse ? 1.15 : 1.0),
      trailLength: this.config.pulseTrailLengthBase +
        loadPressure * this.config.pulseTrailLengthLoadMult +
        overloadMix * 0.22 +
        stabilityMix * this.config.stabilityPulseTrailBoost,
      intensity: Math.max(0.3, Math.min(1.0,
        this.config.baseIntensity +
        loadPressure * this.config.loadPressureIntensityFactor +
        overpressure * 0.18 +
        overloadMix * this.config.overloadIntensityBoost +
        stabilityMix * this.config.stabilityIntensityBoost
      )) * (debugPulse ? 1.25 : 1.0),
      
      // State
      life: 0,
      lifetime: this.config.pulseLifetime,
      debugPulse,
      active: true,
      
      // Flow direction
      direction,

      // Unstable presence identity
      anomalySeed,
      phaseSeed: anomalySeed * Math.PI * 2,
      driftSeed: anomalySeed * 11.0,
      twistSeed: anomalySeed * 17.0,
      phaseState: 'fadeIn',
      phaseElapsed: 0,
      phaseAlpha: 0,
      phaseSegmentIndex: 0,
      phaseStep: null,
      phaseRouted: false,
      
      // Metrics
      synergy,
      corruption,
      loadPressure,
      stability: metrics.stability,
      stabilityMix,
      stabilityStage: stabilityProfile.stage,
      overpressure,
    };

    pulse.phaseStep = this._buildPhaseJumpStep(pulse, pulse.position);
    const routeGuard = this._getLinkLength(link) / Math.max(0.12, pulse.speed);
    pulse.lifetime = Math.max(
      this.config.pulseLifetime,
      routeGuard * 2.75 + 1.2
    );
    pulse.phaseRouted = !!pulse.phaseStep?.complete;
    
    pulses.push(pulse);
    this.globalPulses.push(pulse);
    this.stats.pulseSpawnCount++;
  }

  spawnSinglePulse(linkOrId, options = {}) {
    const link = typeof linkOrId === 'object'
      ? linkOrId
      : this.world?.linkingSystem?._resolveLinkById?.(linkOrId)
        || this.world?.linkingSystem?.links?.find?.((entry) => entry?.id === linkOrId || entry?.linkId === linkOrId)
        || null;
    if (!link) return null;

    const linkId = link.id ?? link.linkId;
    if (linkId === null || linkId === undefined) return null;

    const previousDebug = this.config.debugPulseVisuals === true;
    const shouldDebugPulse = options.debugPulse !== false;
    if (shouldDebugPulse) {
      this.config.debugPulseVisuals = true;
    }

    this._spawnPulse(link);

    this.config.debugPulseVisuals = previousDebug;

    const pauseSeconds = Number.isFinite(options.pauseSeconds)
      ? Math.max(0, options.pauseSeconds)
      : Math.max(0, this.config.manualRepeatPauseSeconds ?? 10.0);
    if (pauseSeconds > 0) {
      const currentTime = this._lastVisualTime ?? this._timeOrigin ?? 0;
      this._repeatSuppressedUntilByLinkId.set(String(linkId), currentTime + pauseSeconds);
    }

    return this.linkPulses.get(linkId)?.at?.(-1) ?? null;
  }
  
  /**
   * Update all active pulses
   */
  _updateActivePulses(deltaVisual) {
    for (let i = this.globalPulses.length - 1; i >= 0; i--) {
      const pulse = this.globalPulses[i];
      if (!pulse.active) continue;

      pulse.life += deltaVisual;
      pulse.phaseElapsed = (pulse.phaseElapsed ?? 0) + deltaVisual;
      const motionSeed = pulse.anomalySeed ?? 0;
      const motionGate = 0.84 + 0.1 * Math.sin(pulse.life * 0.84 + motionSeed * Math.PI * 6.0) + 0.06 * Math.sin(pulse.life * 0.23 + motionSeed * Math.PI * 12.0);
      const phaseGate = Math.max(0.55, motionGate);

      const step = pulse.phaseStep || this._buildPhaseJumpStep(pulse, pulse.position);
      if (!step) {
        pulse.active = false;
        continue;
      }

      const phaseState = pulse.phaseState ?? 'fadeIn';
      const segmentStartT = step.startT;
      const segmentEndT = step.endT;
      const nextStartT = step.nextStartT;

      if (phaseState === 'fadeIn') {
        pulse.position = segmentStartT;
        const fadeT = clamp01(pulse.phaseElapsed / Math.max(0.001, step.fadeInDuration));
        pulse.phaseAlpha = fadeT * fadeT * (3 - 2 * fadeT);
        if (pulse.phaseElapsed >= step.fadeInDuration) {
          pulse.phaseState = 'travel';
          pulse.phaseElapsed = 0;
          pulse.phaseAlpha = 1.0;
        }
      } else if (phaseState === 'travel') {
        const travelT = clamp01(pulse.phaseElapsed / Math.max(0.001, step.travelDuration));
        const travelEase = travelT * travelT * (3 - 2 * travelT);
        pulse.position = segmentStartT + (segmentEndT - segmentStartT) * travelEase;
        pulse.phaseAlpha = 1.0;
        if (pulse.phaseElapsed >= step.travelDuration) {
          pulse.phaseState = 'fadeOut';
          pulse.phaseElapsed = 0;
        }
      } else if (phaseState === 'fadeOut') {
        pulse.position = segmentEndT;
        const fadeT = clamp01(pulse.phaseElapsed / Math.max(0.001, step.fadeOutDuration));
        const fadeCurve = 1.0 - (fadeT * fadeT);
        pulse.phaseAlpha = Math.max(0, fadeCurve);
        if (pulse.phaseElapsed >= step.fadeOutDuration) {
          if (step.complete) {
            pulse.phaseAlpha = 0;
            pulse.active = false;
            continue;
          }

          pulse.phaseState = 'reseed';
          pulse.phaseElapsed = 0;
          pulse.phaseAlpha = 0;
          pulse.position = nextStartT;
          pulse.phaseSegmentIndex = (pulse.phaseSegmentIndex ?? 0) + 1;
        }
      } else if (phaseState === 'reseed') {
        pulse.phaseAlpha = 0;
        pulse.position = nextStartT;
        if (pulse.phaseElapsed >= step.reseedDuration) {
          const nextStep = this._buildPhaseJumpStep(pulse, nextStartT);
          if (!nextStep) {
            pulse.active = false;
            continue;
          }

          pulse.phaseStep = nextStep;
          pulse.phaseState = 'fadeIn';
          pulse.phaseElapsed = 0;
          pulse.phaseAlpha = 0;
          pulse.position = nextStep.startT;
        }
      }

      if (pulse.life >= pulse.lifetime) {
        pulse.active = false;
        continue;
      }
    }
  }
  
  /**
   * Update pulse mesh positions and appearances
   */
  _updatePulseMeshes() {
    // Update or allocate meshes for active pulses (no per-frame reallocation)
    for (const pulse of this.globalPulses) {
      if (!pulse.active) continue;

      if (!pulse.mesh) {
        pulse.mesh = this.pulseMeshPool.pop() || this._createPulseMesh();
        this.pulseGroup?.add?.(pulse.mesh);
      }

      const worldPos = this._getPositionAlongLink(pulse, this._scratchVecA);
      const direction = this._getLinkDirection(pulse.link, pulse.direction, this._scratchVecB);
      const overloadMix = pulse.overloadMix ?? 0;
      const bandMix = this._getLoadPressureProfile(pulse.loadPressure ?? 0).pressurizedMix;
      const stabilityMix = pulse.stabilityMix ?? 0;
      const motionSeed = pulse.anomalySeed ?? getLinkSeed(pulse.linkId);
      const debugPulse = this.config.debugPulseVisuals === true || pulse.debugPulse === true;
      const phaseState = pulse.phaseState ?? 'fadeIn';
      const phaseAlpha = Number.isFinite(pulse.phaseAlpha) ? pulse.phaseAlpha : 1.0;
      const phaseCollapse = phaseState === 'fadeOut' ? (1.0 - phaseAlpha) : 0;
      const phaseEmergence = phaseState === 'fadeIn' ? phaseAlpha : 0;
      const opacity = (debugPulse ? 1.0 : this._getPulseOpacity(pulse)) * (pulse.lodSuppression ?? 1.0);
      const size = pulse.radius * (1.0 + Math.sin(pulse.life * Math.PI * 2) * 0.14 + overloadMix * 0.12 + stabilityMix * 0.08) * (0.84 + phaseAlpha * 0.34 + phaseCollapse * 0.08) * (debugPulse ? this.config.debugPulseScaleMult : 1.0);
      const entityDrift = 0.02 + overloadMix * 0.035 + stabilityMix * 0.03;
      const shellPulse = 1.0 + Math.sin(pulse.life * 1.45 + motionSeed * Math.PI * 6.0) * 0.04 + Math.sin(pulse.life * 0.33 + motionSeed * Math.PI * 12.0) * 0.025 + phaseEmergence * 0.06 + phaseCollapse * 0.09;

      pulse.mesh.visible = true;
      pulse.mesh.position.set(
        worldPos.x + Math.sin(pulse.life * 9.0 + motionSeed * Math.PI * 8.0) * entityDrift,
        worldPos.y + Math.cos(pulse.life * 7.0 + motionSeed * Math.PI * 6.0) * entityDrift * 0.7,
        worldPos.z + Math.sin(pulse.life * 11.0 + motionSeed * Math.PI * 10.0) * entityDrift * 0.78
      );
      this._scratchQuat.setFromUnitVectors(this._scratchUpVector, direction);
      pulse.mesh.quaternion.copy(this._scratchQuat);
      pulse.mesh.rotateY(Math.sin(pulse.life * 0.95 + motionSeed * Math.PI * 5.0) * (0.08 + overloadMix * 0.05 + stabilityMix * 0.03));
      pulse.mesh.rotateZ(Math.cos(pulse.life * 0.52 + motionSeed * Math.PI * 7.0) * 0.03);

      const parts = pulse.mesh.userData?.parts || {};
      const partConfigs = pulse.mesh.userData?.partConfigs || {};
      const baseDebugColor = debugPulse ? this._debugColor : null;
      const baseDebugAccent = debugPulse ? this._debugAccentColor : null;
      const baseDebugVoid = debugPulse ? this._debugVoidColor : null;

      const applyPart = (key, options = {}) => {
        const part = parts[key];
        const spec = partConfigs[key];
        if (!part || !spec) return;

        const visible = options.visible ?? true;
        part.visible = visible;
        if (!visible) return;

        const baseScale = spec.baseScale || [1, 1, 1];
        const basePosition = spec.basePosition || [0, 0, 0];
        const baseRotation = spec.baseRotation || [0, 0, 0];
        const rotationSpeed = spec.rotationSpeed || [0, 0, 0];
        const orbitStrength = spec.orbitStrength || [0, 0, 0];
        const phase = pulse.life * (spec.orbitSpeed ?? 1.0) + (spec.phaseOffset ?? 0) + motionSeed * Math.PI * 2;
        const wobbleA = Math.sin(phase * 1.13 + motionSeed * 5.0 + (spec.shellBias ?? 0) * 3.0);
        const wobbleB = Math.cos(phase * 0.91 + motionSeed * 7.0 + (spec.shellBias ?? 0) * 4.0);
        const wobbleC = Math.sin(phase * 1.37 + motionSeed * 9.0 + (spec.shellBias ?? 0) * 2.0);
        const scaleMul = options.scaleMul ?? 1.0;
        const driftMul = options.driftMul ?? 1.0;
        const opacityMul = options.opacityMul ?? 1.0;
        const glowMul = options.glowMul ?? 1.0;
        const distortionMul = options.distortionMul ?? 1.0;
        const noiseScaleMul = options.noiseScaleMul ?? 1.0;
        const noiseSpeedMul = options.noiseSpeedMul ?? 1.0;

        part.position.set(
          basePosition[0] + orbitStrength[0] * wobbleA * driftMul,
          basePosition[1] + orbitStrength[1] * wobbleB * driftMul,
          basePosition[2] + orbitStrength[2] * wobbleC * driftMul
        );
        part.rotation.set(
          baseRotation[0] + pulse.life * rotationSpeed[0] + wobbleA * 0.12,
          baseRotation[1] + pulse.life * rotationSpeed[1] + wobbleB * 0.16,
          baseRotation[2] + pulse.life * rotationSpeed[2] + wobbleC * 0.14
        );
        part.scale.set(
          baseScale[0] * size * shellPulse * scaleMul,
          baseScale[1] * size * shellPulse * scaleMul,
          baseScale[2] * size * shellPulse * scaleMul
        );

        const uniforms = part.material?.uniforms || {};
        if (uniforms.uTime) uniforms.uTime.value = pulse.life;
        if (uniforms.uOpacity) uniforms.uOpacity.value = opacity * (spec.opacity ?? 1.0) * opacityMul * (debugPulse ? 1.08 : 1.0);
        if (uniforms.uGlowSize) uniforms.uGlowSize.value = this.config.pulseGlowIntensity * (spec.glow ?? 1.0) * glowMul * (1.0 + pulse.loadPressure * 0.08 + overloadMix * 0.16 + stabilityMix * 0.1) * (debugPulse ? this.config.debugPulseGlowMult : 1.0);
        if (uniforms.uDistortion) uniforms.uDistortion.value = (spec.distortion ?? 0.1) * distortionMul * (1.0 + overloadMix * 0.14 + stabilityMix * 0.08);
        if (uniforms.uNoiseScale) uniforms.uNoiseScale.value = (spec.noiseScale ?? 2.0) * noiseScaleMul;
        if (uniforms.uNoiseSpeed) uniforms.uNoiseSpeed.value = (spec.noiseSpeed ?? 1.0) * noiseSpeedMul;
        if (uniforms.uPulsePhase) uniforms.uPulsePhase.value = phase;
        if (uniforms.uPulseSeed) uniforms.uPulseSeed.value = motionSeed + (spec.shellBias ?? 0);
        if (uniforms.uFresnelPower) uniforms.uFresnelPower.value = spec.fresnelPower ?? 2.4;
        if (uniforms.uIridescence) uniforms.uIridescence.value = spec.iridescence ?? 0.2;
        if (uniforms.uVoidMix) uniforms.uVoidMix.value = spec.voidMix ?? 0.2;
        if (uniforms.uCorruption) uniforms.uCorruption.value = pulse.corruption ?? 0;
        if (uniforms.uShellBreath) uniforms.uShellBreath.value = (spec.shellBreath ?? 0.1) * (1.0 + overloadMix * 0.1 + stabilityMix * 0.06);
        if (uniforms.uShellBias) uniforms.uShellBias.value = (spec.shellBias ?? 0) + pulse.loadPressure * 0.1;
        if (debugPulse) {
          if (uniforms.uColor) uniforms.uColor.value.copy(baseDebugColor);
          if (uniforms.uAccentColor) uniforms.uAccentColor.value.copy(baseDebugAccent);
          if (uniforms.uVoidColor) uniforms.uVoidColor.value.copy(baseDebugVoid);
        }
      };

      applyPart('core', {
        scaleMul: 1.08 + phaseEmergence * 0.16 + phaseCollapse * 0.08,
        glowMul: 1.05 + phaseEmergence * 0.14,
        distortionMul: 1.0 + phaseCollapse * 0.12,
        noiseScaleMul: 1.0,
        noiseSpeedMul: 1.0 + phaseCollapse * 0.08,
      });
      applyPart('sheath', {
        scaleMul: 0.98 + bandMix * 0.08 + phaseCollapse * 0.06,
        driftMul: 1.0,
        glowMul: 1.0 + phaseEmergence * 0.06,
      });
      applyPart('trail', {
        scaleMul: 0.92 + overloadMix * 0.04 + phaseCollapse * 0.07,
        driftMul: 1.15,
        glowMul: 0.92 + phaseCollapse * 0.08,
        distortionMul: 0.9 + phaseCollapse * 0.12,
        noiseScaleMul: 1.05,
        noiseSpeedMul: 1.2 + phaseCollapse * 0.12,
      });
      applyPart('halo', {
        scaleMul: 0.96 + stabilityMix * 0.05 + phaseCollapse * 0.04,
        driftMul: 1.0,
        glowMul: 0.88 + phaseEmergence * 0.05,
        distortionMul: 1.0 + phaseCollapse * 0.06,
        noiseScaleMul: 0.82,
        noiseSpeedMul: 0.72,
      });
      applyPart('swirl', {
        scaleMul: 0.98 + overloadMix * 0.02 + phaseCollapse * 0.05,
        driftMul: 1.0,
        glowMul: 0.95 + phaseEmergence * 0.04,
        distortionMul: 1.05 + phaseCollapse * 0.08,
        noiseScaleMul: 1.12,
        noiseSpeedMul: 1.15 + phaseCollapse * 0.1,
      });
      applyPart('overloadA', {
        visible: debugPulse || overloadMix > 0.02 || pulse.corruption > 0.06 || phaseCollapse > 0.18,
        scaleMul: 0.98 + overloadMix * 0.2 + phaseCollapse * 0.1,
        driftMul: 1.0 + overloadMix * 0.2 + phaseCollapse * 0.08,
        glowMul: 0.82 + overloadMix * 0.5 + phaseCollapse * 0.12,
        distortionMul: 0.95 + phaseCollapse * 0.08,
        noiseScaleMul: 1.08,
        noiseSpeedMul: 1.12 + phaseCollapse * 0.08,
      });
      applyPart('overloadB', {
        visible: debugPulse || overloadMix > 0.02 || pulse.corruption > 0.06 || phaseCollapse > 0.18,
        scaleMul: 0.97 + overloadMix * 0.16 + phaseCollapse * 0.1,
        driftMul: 1.0 + overloadMix * 0.18 + phaseCollapse * 0.08,
        glowMul: 0.78 + overloadMix * 0.46 + phaseCollapse * 0.12,
        distortionMul: 0.92 + phaseCollapse * 0.08,
        noiseScaleMul: 1.12,
        noiseSpeedMul: 1.18 + phaseCollapse * 0.08,
      });
    }
  }
  
  /**
   * Get world position of pulse along link curve
   */
  _getPositionAlongLink(pulse, target = new THREE.Vector3()) {
    const link = pulse.link;
    const nodeA = this._getLinkSource(link);
    const nodeB = this._getLinkTarget(link);
    
    if (!nodeA?.position || !nodeB?.position) return target.set(0, 0, 0);
    
    // Linear interpolation for now (could use Catmull-Rom for curves)
    const t = Math.max(0, Math.min(1, pulse.position));
    return target.copy(nodeA.position).lerp(nodeB.position, t);
  }
  
  /**
   * Calculate pulse color based on link state
   */
  _getPulseColor(pulse) {
    let color = new THREE.Color();
    const loadPressure = pulse.loadPressure ?? 0.5;
    const pressureHot = Math.pow(loadPressure, 1.24);
    const pressureCool = 1.0 - loadPressure;
    const overloadMix = pulse.overloadMix ?? 0;
    const stabilityMix = pulse.stabilityMix ?? 0;
    const bandMix = this._getLoadPressureProfile(loadPressure).pressurizedMix;

    color.setHSL(
      0.53 - pressureHot * 0.18,
      0.66 + pressureHot * 0.22 + overloadMix * 0.08,
      0.48 + pressureHot * 0.16 + overloadMix * 0.12
    );

    if (loadPressure > 0.7) {
      color.lerp(new THREE.Color(0xffb56a), (loadPressure - 0.7) * 0.72);
    } else if (loadPressure < 0.24) {
      color.lerp(new THREE.Color(0x74edff), pressureCool * 0.22);
    }

    if (bandMix > 0.0) {
      color.lerp(new THREE.Color(0xf4fbff), bandMix * 0.18);
    }

    if (stabilityMix > 0.0) {
      color.lerp(new THREE.Color(0xf8ffff), stabilityMix * 0.16);
      color.multiplyScalar(1.0 + stabilityMix * 0.08);
    }

    if (overloadMix > 0.0) {
      color.lerp(new THREE.Color(0xfff2d8), overloadMix * 0.42);
      color.multiplyScalar(1.0 + overloadMix * 0.12);
    }
    
    // Modulate by corruption
    const corruption = pulse.corruption ?? 0;
    if (corruption > 0.3) {
      const corruptRed = new THREE.Color(0xff4444);
      color.lerp(corruptRed, corruption * 0.6);
    }
    
    return color;
  }
  
  /**
   * Calculate pulse opacity with fade-out at ends
   */
  _getPulseOpacity(pulse) {
    const phaseAlpha = Number.isFinite(pulse.phaseAlpha) ? pulse.phaseAlpha : 1.0;

    // Apply intensity modulation
    const baseOpacity = pulse.intensity * this.config.pulseGlowIntensity;
    
    // Dampen by corruption
    const corruptionDampen = 1.0 - (pulse.corruption * this.config.corruptionDampen);

    const bandMix = this._getLoadPressureProfile(pulse.loadPressure ?? 0).pressurizedMix;
    const bandBoost = 0.72 + bandMix * 0.34 + pulse.overloadMix * 0.68;
    const stabilityMix = pulse.stabilityMix ?? 0;
    const pressureBoost = bandBoost + pulse.loadPressure * 0.32 + stabilityMix * 0.18;
    const stabilityBoost = 0.84 + stabilityMix * this.config.stabilityOpacityBoost;

    return phaseAlpha * baseOpacity * corruptionDampen * pressureBoost * stabilityBoost;
  }
  
  /**
   * Create pulse rig (reuses material, not geometry)
   */
  _createPulseMesh() {
    const debugPulse = this.config.debugPulseVisuals === true;
    const makeMaterial = (options = {}) => {
      const material = this.pulseMaterialTemplate.clone();
      material.uniforms = THREE.UniformsUtils.clone(this.pulseMaterialTemplate.uniforms);
      const uniforms = material.uniforms;
      if (Number.isFinite(options.opacity)) uniforms.uOpacity.value = options.opacity;
      if (Number.isFinite(options.glow)) uniforms.uGlowSize.value = this.config.pulseGlowIntensity * options.glow;
      if (Number.isFinite(options.distortion)) uniforms.uDistortion.value = options.distortion;
      if (Number.isFinite(options.noiseScale)) uniforms.uNoiseScale.value = options.noiseScale;
      if (Number.isFinite(options.noiseSpeed)) uniforms.uNoiseSpeed.value = options.noiseSpeed;
      if (Number.isFinite(options.phase)) uniforms.uPulsePhase.value = options.phase;
      if (Number.isFinite(options.seed)) uniforms.uPulseSeed.value = options.seed;
      if (Number.isFinite(options.fresnelPower)) uniforms.uFresnelPower.value = options.fresnelPower;
      if (Number.isFinite(options.iridescence)) uniforms.uIridescence.value = options.iridescence;
      if (Number.isFinite(options.voidMix)) uniforms.uVoidMix.value = options.voidMix;
      if (Number.isFinite(options.shellBreath)) uniforms.uShellBreath.value = options.shellBreath;
      if (Number.isFinite(options.shellBias)) uniforms.uShellBias.value = options.shellBias;
      if (options.color) uniforms.uColor.value = new THREE.Color(options.color);
      if (options.accentColor) uniforms.uAccentColor.value = new THREE.Color(options.accentColor);
      if (options.voidColor) uniforms.uVoidColor.value = new THREE.Color(options.voidColor);
      return material;
    };

    const debugColors = debugPulse ? {
      core: 0xff0000,
      sheath: 0xff3434,
      trail: 0xff8080,
      overloadA: 0xff3434,
      overloadB: 0xff8080,
      halo: 0xff2020,
      swirl: 0xff7a7a,
    } : null;

    const rig = new THREE.Group();
    rig.name = 'LinkResonancePulseRig';
    rig.visible = false;
    rig.userData.isLinkResonanceFlow = true;
    rig.userData.linkVisualFamily = 'resonanceFlow';
    rig.userData.debugPulseVisuals = debugPulse;

    const parts = {};
    const partConfigs = {
      core: {
        baseScale: [0.36, 0.50, 0.36],
        basePosition: [0, 0, 0],
        baseRotation: [0, 0, 0],
        rotationSpeed: [0.26, 0.34, 0.18],
        orbitStrength: [0.05, 0.06, 0.05],
        orbitSpeed: 0.84,
        phaseOffset: 0.0,
        distortion: 0.24,
        noiseScale: 3.8,
        noiseSpeed: 1.6,
        opacity: 1.0,
        glow: 1.55,
        fresnelPower: 3.0,
        iridescence: 0.36,
        voidMix: 0.46,
        shellBreath: 0.18,
        shellBias: 0.12,
        color: debugColors?.core ?? 0x78f8ff,
        accentColor: debugColors?.core ?? 0xffffff,
        voidColor: debugPulse ? 0x160000 : 0x070012,
      },
      sheath: {
        baseScale: [0.74, 0.90, 0.74],
        basePosition: [0, 0, 0],
        baseRotation: [0.08, 0.18, 0.04],
        rotationSpeed: [0.12, -0.16, 0.14],
        orbitStrength: [0.08, 0.03, 0.07],
        orbitSpeed: 0.62,
        phaseOffset: 1.34,
        distortion: 0.16,
        noiseScale: 2.6,
        noiseSpeed: 1.1,
        opacity: 0.42,
        glow: 1.08,
        fresnelPower: 2.7,
        iridescence: 0.3,
        voidMix: 0.32,
        shellBreath: 0.12,
        shellBias: 0.41,
        color: debugColors?.sheath ?? 0x6eeeff,
        accentColor: debugColors?.sheath ?? 0xdffcff,
        voidColor: debugPulse ? 0x120000 : 0x050010,
      },
      trail: {
        baseScale: [0.10, 1.08, 0.06],
        basePosition: [0, -0.34, 0],
        baseRotation: [0.04, 0.2, 0.0],
        rotationSpeed: [0.12, 0.42, 0.1],
        orbitStrength: [0.03, 0.08, 0.03],
        orbitSpeed: 1.6,
        phaseOffset: 2.18,
        distortion: 0.06,
        noiseScale: 4.4,
        noiseSpeed: 2.0,
        opacity: 0.18,
        glow: 0.9,
        fresnelPower: 2.45,
        iridescence: 0.2,
        voidMix: 0.10,
        shellBreath: 0.06,
        shellBias: 0.18,
        color: debugColors?.trail ?? 0xa7fbff,
        accentColor: debugColors?.trail ?? 0xf1ffff,
        voidColor: debugPulse ? 0x160000 : 0x070012,
      },
      overloadA: {
        baseScale: [0.07, 0.36, 0.07],
        basePosition: [0.28, 0.08, 0.02],
        baseRotation: [0.12, 0.42, 0.18],
        rotationSpeed: [0.26, 0.62, 0.16],
        orbitStrength: [0.04, 0.02, 0.04],
        orbitSpeed: 1.1,
        phaseOffset: 0.74,
        distortion: 0.05,
        noiseScale: 4.8,
        noiseSpeed: 2.2,
        opacity: 0.14,
        glow: 0.84,
        fresnelPower: 2.35,
        iridescence: 0.22,
        voidMix: 0.08,
        shellBreath: 0.05,
        shellBias: 0.62,
        color: debugColors?.overloadA ?? 0x8e7cff,
        accentColor: debugColors?.overloadA ?? 0xffecff,
        voidColor: debugPulse ? 0x160000 : 0x110018,
      },
      overloadB: {
        baseScale: [0.06, 0.30, 0.06],
        basePosition: [-0.24, -0.05, -0.02],
        baseRotation: [-0.16, -0.38, -0.12],
        rotationSpeed: [-0.20, -0.54, -0.14],
        orbitStrength: [0.03, 0.03, 0.03],
        orbitSpeed: 1.24,
        phaseOffset: 2.66,
        distortion: 0.045,
        noiseScale: 5.2,
        noiseSpeed: 2.35,
        opacity: 0.12,
        glow: 0.8,
        fresnelPower: 2.25,
        iridescence: 0.24,
        voidMix: 0.08,
        shellBreath: 0.04,
        shellBias: 0.84,
        color: debugColors?.overloadB ?? 0xb86dff,
        accentColor: debugColors?.overloadB ?? 0xffe3ff,
        voidColor: debugPulse ? 0x120000 : 0x130019,
      },
      halo: {
        baseScale: [1.26, 0.74, 1.18],
        basePosition: [0, 0.02, 0],
        baseRotation: [0.16, 0.36, 0.0],
        rotationSpeed: [0.06, 0.08, 0.04],
        orbitStrength: [0.02, 0.02, 0.02],
        orbitSpeed: 0.54,
        phaseOffset: 0.42,
        distortion: 0.12,
        noiseScale: 1.8,
        noiseSpeed: 0.72,
        opacity: 0.20,
        glow: 1.0,
        fresnelPower: 3.4,
        iridescence: 0.46,
        voidMix: 0.16,
        shellBreath: 0.05,
        shellBias: 0.9,
        color: debugColors?.halo ?? 0x8ef8ff,
        accentColor: debugColors?.halo ?? 0xffffff,
        voidColor: debugPulse ? 0x120000 : 0x05000d,
      },
      swirl: {
        baseScale: [0.62, 0.62, 0.62],
        basePosition: [0, 0, 0],
        baseRotation: [0.56, 0.12, 0.34],
        rotationSpeed: [0.42, 0.34, 0.26],
        orbitStrength: [0.02, 0.02, 0.02],
        orbitSpeed: 1.8,
        phaseOffset: 3.52,
        distortion: 0.16,
        noiseScale: 3.2,
        noiseSpeed: 1.55,
        opacity: 0.17,
        glow: 1.12,
        fresnelPower: 2.9,
        iridescence: 0.62,
        voidMix: 0.12,
        shellBreath: 0.09,
        shellBias: 0.74,
        color: debugColors?.swirl ?? 0xb58cff,
        accentColor: debugColors?.swirl ?? 0xffd4ff,
        voidColor: debugPulse ? 0x120000 : 0x12001a,
      },
    };

    const addPart = (key, geometry, spec, name) => {
      const material = makeMaterial(spec);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = name;
      mesh.userData.partKey = key;
      mesh.userData.partSpec = spec;
      mesh.userData.debugPulseVisuals = debugPulse;
      applyLinkRenderLayer(mesh, 'LINK_RESONANCE');
      parts[key] = mesh;
      rig.add(mesh);
      return mesh;
    };

    addPart('core', this.pulseMeshGeometry, partConfigs.core, 'LinkResonancePulseCore');
    addPart('sheath', this.pulseSheathGeometry, partConfigs.sheath, 'LinkResonancePulseSheath');
    addPart('trail', this.pulseTrailGeometry, partConfigs.trail, 'LinkResonancePulseTrail');
    addPart('overloadA', this.pulseShardGeometry, partConfigs.overloadA, 'LinkResonancePulseShardA');
    addPart('overloadB', this.pulseShardGeometry, partConfigs.overloadB, 'LinkResonancePulseShardB');
    addPart('halo', this.pulseHaloGeometry, partConfigs.halo, 'LinkResonancePulseHalo');
    addPart('swirl', this.pulseSwirlGeometry, partConfigs.swirl, 'LinkResonancePulseSwirl');

    rig.userData.parts = parts;
    rig.userData.partConfigs = partConfigs;
    if (parts.core) {
      tagAllowedSphere(parts.core, { role: 'vfx', source: 'LinkResonanceFlowSystem_Session124._createPulseMesh.core' });
      clampSphere(parts.core);
    }
    return rig;
  }

  _getLinkDirection(link, directionSign = 1, target = new THREE.Vector3()) {
    const nodeA = this._getLinkSource(link)?.position;
    const nodeB = this._getLinkTarget(link)?.position;
    if (!nodeA?.clone || !nodeB?.clone) {
      return target.set(0, 1, 0);
    }

    target.copy(nodeB).sub(nodeA);
    if (target.lengthSq() <= 0.000001) {
      return target.set(0, 1, 0);
    }

    target.normalize();
    if (directionSign < 0) target.negate();
    return target;
  }

  _getLinkLength(link) {
    const length = Number(link?.length);
    if (Number.isFinite(length) && length > 0) {
      return length;
    }

    const nodeA = this._getLinkSource(link)?.position;
    const nodeB = this._getLinkTarget(link)?.position;
    if (nodeA?.distanceTo && nodeB) {
      const computedLength = nodeA.distanceTo(nodeB);
      if (Number.isFinite(computedLength) && computedLength > 0) {
        return computedLength;
      }
    }

    return 1.0;
  }
  
  /**
   * Update LOD based on camera distance
   */
  _updateLOD(camera) {
    if (!camera?.position?.distanceTo) return;
    // Could suppress pulses on distant links
    // For now, basic distance check
    const threshold = this.config.lodDistanceThreshold;
    
    for (const pulse of this.globalPulses) {
      if (!pulse.link) continue;
      const nodeA = this._getLinkSource(pulse.link);
      const nodeB = this._getLinkTarget(pulse.link);
      if (!nodeA?.position || !nodeB?.position) continue;
      
      const distance = camera.position.distanceTo(
        this._scratchVecA.copy(nodeA.position).add(nodeB.position).multiplyScalar(0.5)
      );
      
      // Apply LOD suppression if far
      if (distance > threshold) {
        pulse.lodSuppression = this.config.lodPulseSuppression;
      } else {
        pulse.lodSuppression = 1.0;
      }
    }
  }
  
  /**
   * Remove dead pulses from tracking
   */
  _cleanupDeadPulses() {
    // Remove from link pools
    for (const [linkId, pulses] of this.linkPulses) {
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pulse = pulses[i];
        if (!pulse.active) {
          if (pulse.mesh) {
            pulse.mesh.visible = false;
            this.pulseGroup?.remove?.(pulse.mesh);
            this.pulseMeshPool.push(pulse.mesh);
            delete pulse.mesh;
          }
          pulses.splice(i, 1);
        }
      }
      
      // Remove empty link pools
      if (pulses.length === 0) {
        this.linkPulses.delete(linkId);
      }
    }
    
    // Remove from global pool
    for (let i = this.globalPulses.length - 1; i >= 0; i--) {
      const pulse = this.globalPulses[i];
      if (!pulse.active) {
        if (pulse.mesh) {
          pulse.mesh.visible = false;
          this.pulseGroup?.remove?.(pulse.mesh);
          this.pulseMeshPool.push(pulse.mesh);
          delete pulse.mesh;
        }
        this.globalPulses.splice(i, 1);
      }
    }
  }

  _releasePulseMesh(pulse) {
    if (pulse?.mesh) {
      pulse.mesh.visible = false;
      this.pulseGroup?.remove(pulse.mesh);
      this.pulseMeshPool.push(pulse.mesh);
      delete pulse.mesh;
    }
  }

  clearLink(linkOrId) {
    const linkId = typeof linkOrId === 'object' ? (linkOrId?.id ?? linkOrId?.linkId ?? null) : linkOrId;
    if (linkId === null || linkId === undefined) return;

    const pulses = this.linkPulses.get(linkId);
    if (Array.isArray(pulses)) {
      for (const pulse of pulses) {
        pulse.active = false;
        this._releasePulseMesh(pulse);
      }
      this.linkPulses.delete(linkId);
    }

    this.spawnAccumulators.delete(linkId);

    for (let i = this.globalPulses.length - 1; i >= 0; i--) {
      const pulse = this.globalPulses[i];
      if (pulse?.linkId === linkId) {
        pulse.active = false;
        this._releasePulseMesh(pulse);
        this.globalPulses.splice(i, 1);
      }
    }
  }
  
  /**
   * Get vertex shader
   */
  _getVertexShader() {
    return `
      varying vec3 vPosition;
      varying vec3 vNormal;
      
      void main() {
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }
  
  /**
   * Get fragment shader
   */
  _getFragmentShader() {
    return `
      uniform vec3 uPulseColor;
      uniform float uIntensity;
      uniform float uGlowSize;
      
      varying vec3 vPosition;
      varying vec3 vNormal;
      
      void main() {
        vec3 viewDir = normalize(cameraPosition - vec3(0.0));
        float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.0);
        
        // Radial glow effect
        float dist = length(vPosition);
        float glow = exp(-dist * dist * 2.0) * uGlowSize;
        
        float alpha = (fresnel + glow) * uIntensity;
        gl_FragColor = vec4(uPulseColor, alpha);
      }
    `;
  }
  
  /**
   * Create visual trail between pulses (optional)
   */
  _createPulseTrail(pulse) {
    // Could add trails showing pulse path
    // Not implemented in basic version
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      activePulses: this.globalPulses.length,
      linksWithFlow: this.linkPulses.size,
      totalSpawned: this.stats.pulseSpawnCount,
      avgPulsesPerLink: this.linkPulses.size > 0 ?
        (this.globalPulses.length / this.linkPulses.size).toFixed(1) : 0,
    };
  }
  
  /**
   * Reset system
   */
  reset() {
    for (const pulse of this.globalPulses) {
      this._releasePulseMesh(pulse);
    }
    this.globalPulses = [];
    this.linkPulses.clear();
    this.spawnAccumulators.clear();
    this.stats.pulseSpawnCount = 0;
    this._repeatSuppressedUntilByLinkId = new Map();
    this._lastVisualTime = undefined;
    this._lastUpdateFrameId = undefined;
  }
  
  /**
   * Cleanup resources
   */
  dispose() {
    if (this.pulseGroup) {
      this.scene?.remove?.(this.pulseGroup);
    }
    for (const pulse of this.globalPulses) {
      this._releasePulseMesh(pulse);
    }
    for (const mesh of this.pulseMeshPool) {
      mesh?.traverse?.((obj) => {
        obj?.material?.dispose?.();
      });
    }
    this.pulseMeshPool = [];
    this.pulseMeshGeometry?.dispose?.();
    this.pulseSheathGeometry?.dispose?.();
    this.pulseTrailGeometry?.dispose?.();
    this.pulseShardGeometry?.dispose?.();
    this.pulseHaloGeometry?.dispose?.();
    this.pulseSwirlGeometry?.dispose?.();
    this.pulseMaterialTemplate?.dispose?.();
    
    this.globalPulses = [];
    this.linkPulses.clear();
    this.spawnAccumulators.clear();
    this._repeatSuppressedUntilByLinkId = new Map();
  }
}

