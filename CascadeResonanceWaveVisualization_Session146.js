import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { getEnvSpriteTexture } from './EnvironmentPointFXBase.js';

/**
 * CascadeResonanceWaveVisualization_Session146.js
 * ============================================================================
 * CASCADE RESONANCE WAVE VISUALIZATION SYSTEM
 *
 * Resonance wave visualization that propagates between phase-synchronized
 * harmonic hubs. Multi-phase visual system with wavefront rings, resonance
 * beams, particles, interference patterns, and dynamic lighting.
 *
 * DESIGN PHILOSOPHY:
 * The network reveals latent cascade potential through visible wave
 * propagation. Players see directional tension between synchronized hubs
 * as traveling wavefronts, beam pulses, and particle effects.
 *
 * VISUAL PHASES:
 * Phase 1 — Wavefront ripple rings (three-tier parallax: inner/middle/outer)
 * Phase 2 — Multi-layer resonance beams (core/glow/aura) between hub pairs
 * Phase 3 — Particles: wavefront, resonance sparks, echo trails, interference
 * Phase 4 — Post-processing: bloom, chromatic aberration, distortion
 * Phase 5 — Dynamic lighting, visual push, audio feedback
 *
 * WAVE BEHAVIOR:
 * - Wave phase computed per hub pair (0–1, normalized)
 * - Slow oscillation (2–4 second period)
 * - Influence: 25–50% of baseline parameters (clearly visible)
 * - Auto-decay when synchronization weakens (~3s lifetime)
 * - Zero per-frame allocations (reused buffers)
 * - Bootstrap from active hubs when no cascade events fire
 * - Event-driven via cascade.start / cascade.hop
 *
 * @author VFX Technical Director — ATOMA Project Session 146 Extended
 * @version 2.0.0 — Visibility upgrade (amplified from ghost-level)
 */

export class CascadeResonanceWaveVisualization_Session146 {
  /**
   * Constructor
   * @param {Object} cascadeSystem - Reference to HarmonicCascadeAmplification_Session145
   * @param {Object} harmonicHubSystem - Reference to HarmonicHubAuraSystem
   * @param {Object} linkResonanceSystem - Reference to LinkResonanceSystem (for link metadata)
   * @param {Object} config - Configuration object
   */
  constructor(cascadeSystem, harmonicHubSystem, linkResonanceSystem, config = {}) {
    this.cascadeSystem = cascadeSystem;
    this.harmonicHubSystem = harmonicHubSystem;
    this.linkResonanceSystem = linkResonanceSystem;
    this.semanticBus = config.semanticBus ?? globalThis?.semanticBus ?? null;
    this.camera = config.camera ?? this.harmonicHubSystem?.world?.camera ?? null;
    
    // Configuration
    this.config = {
      // Wave oscillation
      waveOscillationPeriod: config.waveOscillationPeriod ?? 3.0,  // Seconds
      waveInfluenceMin: config.waveInfluenceMin ?? 0.25,           // Amplified from 0.02 ghost-level
      waveInfluenceMax: config.waveInfluenceMax ?? 0.50,           // Amplified from 0.08 ghost-level

      // Wave trigger conditions
      minPhaseSyncStrength: config.minPhaseSyncStrength ?? 0.02,    // Lowered from 0.04 — trigger more easily
      minPhaseSyncStability: config.minPhaseSyncStability ?? 0.03, // Lowered from 0.04
      minCascadeStrengthTrigger: config.minCascadeStrengthTrigger ?? 0.08, // Lowered from 0.15
      minHubCorruptionThreshold: config.minHubCorruptionThreshold ?? 0.25,
      minHubStabilityThreshold: config.minHubStabilityThreshold ?? 0.65,

      // Temporal modulation
      linkPhaseCompression: config.linkPhaseCompression ?? 0.25,    // Amplified from 0.2
      auraNoiseReduction: config.auraNoiseReduction ?? 0.20,       // Amplified from 0.14

      // Wave decay
      waveDecayRate: config.waveDecayRate ?? 0.98,                 // Auto-decay speed (~3s lifetime at 60Hz
      waveDissolveThreshold: config.waveDissolveThreshold ?? 0.02, // Threshold to completely fade

      // Safety
      enabled: config.enabled ?? true,
      debugMode: config.debugMode ?? false,
      maxWaveActivePairs: config.maxWaveActivePairs ?? 30,
      
      // Phase 1: Visible wavefront ripples
      wavefrontRipplesEnabled: config.wavefrontRipplesEnabled ?? true,
      
      // Phase 2: Three-Tier Wave Rings (PARALLAX)
      threeTierRingsEnabled: config.threeTierRingsEnabled ?? true,
      
      // Inner Ring (fast, bright)
      innerRingSpeed: config.innerRingSpeed ?? 2.0,
      innerRingOpacity: config.innerRingOpacity ?? 0.45,
      innerRingLifetime: config.innerRingLifetime ?? 0.8,
      innerRingColor: config.innerRingColor ?? new THREE.Color(0xffffff), // White-cyan
      
      // Middle Ring (medium)
      middleRingSpeed: config.middleRingSpeed ?? 1.0,
      middleRingOpacity: config.middleRingOpacity ?? 0.30,
      middleRingLifetime: config.middleRingLifetime ?? 1.2,
      middleRingColor: config.middleRingColor ?? new THREE.Color(0x00ffff), // Cyan
      
      // Outer Ring (slow, diffuse)
      outerRingSpeed: config.outerRingSpeed ?? 0.5,
      outerRingOpacity: config.outerRingOpacity ?? 0.15,
      outerRingLifetime: config.outerRingLifetime ?? 2.0,
      outerRingColor: config.outerRingColor ?? new THREE.Color(0xaa88ff), // Violet
      
      // Common ring parameters
      wavefrontRingCount: config.wavefrontRingCount ?? 3,
      wavefrontRingMaxRadius: config.wavefrontRingMaxRadius ?? 4.0,
      wavefrontRingMinRadius: config.wavefrontRingMinRadius ?? 0.3,
      wavefrontRingSpeed: config.wavefrontRingSpeed ?? 2.0,
      wavefrontRingOpacity: config.wavefrontRingOpacity ?? 0.35,   // Amplified from 0.12
      
      // Phase 1: Aura tightening pulse
      auraTighteningPulseEnabled: config.auraTighteningPulseEnabled ?? true,
      auraTighteningAmount: config.auraTighteningAmount ?? 0.15,   // Amplified from 0.08
      auraPulseSpeed: config.auraPulseSpeed ?? 3.0,
      
      // Phase 1: Smooth wave phase transitions
      smoothPhaseTransitionsEnabled: config.smoothPhaseTransitionsEnabled ?? true,
      
      // Phase 3: Premium interference + echo effects
      interferenceEnabled: config.interferenceEnabled ?? true,
      interferenceBoost: config.interferenceBoost ?? 0.15,         // Amplified from 0.08
      interferenceDampening: config.interferenceDampening ?? 0.05,
      echoTrailEnabled: config.echoTrailEnabled ?? true,
      echoTrailDuration: config.echoTrailDuration ?? 0.8,
      echoTrailOpacity: config.echoTrailOpacity ?? 0.12,           // Amplified from 0.03
      echoTrailThreshold: config.echoTrailThreshold ?? 0.15,       // Lowered from 0.2,
      
      // Phase 3: Particle movement + detail
      wavefrontParticlesEnabled: config.wavefrontParticlesEnabled ?? true,
      wavefrontParticlesPerRing: config.wavefrontParticlesPerRing ?? 40,
      wavefrontParticleSizeMin: config.wavefrontParticleSizeMin ?? 0.08,
      wavefrontParticleSizeMax: config.wavefrontParticleSizeMax ?? 0.14,
      wavefrontParticleSpeedMin: config.wavefrontParticleSpeedMin ?? 0.5,
      wavefrontParticleSpeedMax: config.wavefrontParticleSpeedMax ?? 1.2,
      wavefrontParticleTrailSegments: config.wavefrontParticleTrailSegments ?? 3,

      resonanceSparksEnabled: config.resonanceSparksEnabled ?? true,
      resonanceSparkCountPerWave: config.resonanceSparkCountPerWave ?? 50,
      resonanceSparkSize: config.resonanceSparkSize ?? 0.1,
      resonanceSparkGravity: config.resonanceSparkGravity ?? 0.2,
      resonanceSparkLifetimeMin: config.resonanceSparkLifetimeMin ?? 0.6,
      resonanceSparkLifetimeMax: config.resonanceSparkLifetimeMax ?? 1.0,
      resonanceSparkBloom: config.resonanceSparkBloom ?? 0.6,

      echoTrailParticlesEnabled: config.echoTrailParticlesEnabled ?? true,
      echoTrailParticlesPerBeam: config.echoTrailParticlesPerBeam ?? 24,
      echoTrailParticleDriftSpeed: config.echoTrailParticleDriftSpeed ?? 0.01,
      echoTrailLifetimeMin: config.echoTrailLifetimeMin ?? 0.4,
      echoTrailLifetimeMax: config.echoTrailLifetimeMax ?? 0.7,
      echoTrailFade: config.echoTrailFade ?? 0.9,

      interferenceParticlesEnabled: config.interferenceParticlesEnabled ?? true,
      interferenceParticleCount: config.interferenceParticleCount ?? 30,
      interferenceOrbitalSpeed: config.interferenceOrbitalSpeed ?? 1.1,
      interferenceRadius: config.interferenceRadius ?? 1.2,
      interferenceConstructiveColor: config.interferenceConstructiveColor ?? new THREE.Color(0x99ffff),
      interferenceDestructiveColor: config.interferenceDestructiveColor ?? new THREE.Color(0x8a58ff),
      interferenceMinActiveWaves: config.interferenceMinActiveWaves ?? 2,

      // Phase 4: Post-processing and scene-wide energy effects
      postProcessingEnabled: config.postProcessingEnabled ?? true,
      innerRingBloomThreshold: config.innerRingBloomThreshold ?? 0.6,
      innerRingBloomStrength: config.innerRingBloomStrength ?? 1.5,
      middleRingBloomThreshold: config.middleRingBloomThreshold ?? 0.5,
      middleRingBloomStrength: config.middleRingBloomStrength ?? 1.0,
      outerRingBloomThreshold: config.outerRingBloomThreshold ?? 0.4,
      outerRingBloomStrength: config.outerRingBloomStrength ?? 0.6,
      coreBeamBloomStrength: config.coreBeamBloomStrength ?? 1.5,
      coreBeamBloomThreshold: config.coreBeamBloomThreshold ?? 0.6,
      resonanceSparkBloomStrength: config.resonanceSparkBloomStrength ?? 0.9,
      chromaticAberrationEnabled: config.chromaticAberrationEnabled ?? true,
      chromaticAberrationMin: config.chromaticAberrationMin ?? 0.001,
      chromaticAberrationMax: config.chromaticAberrationMax ?? 0.003,
      distortionEnabled: config.distortionEnabled ?? true,
      distortionStrengthMin: config.distortionStrengthMin ?? 0.002,
      distortionStrengthMax: config.distortionStrengthMax ?? 0.008,
      distortionRadiusMultiplier: config.distortionRadiusMultiplier ?? 1.2,
      cameraEffectDistance: config.cameraEffectDistance ?? 18.0,
      cameraEffectFalloff: config.cameraEffectFalloff ?? 28.0,
      maxWavePoolSize: config.maxWavePoolSize ?? 50,
      softWaveActiveLimit: config.softWaveActiveLimit ?? 30,
      dynamicLightingEnabled: config.dynamicLightingEnabled ?? true,
      waveLightCount: config.waveLightCount ?? 4,
      waveLightIntensityMax: config.waveLightIntensityMax ?? 3.0,
      waveLightRangeMin: config.waveLightRangeMin ?? 8.0,
      waveLightRangeMax: config.waveLightRangeMax ?? 12.0,
      waveLightDecay: config.waveLightDecay ?? 3.33,
      visualPushEnabled: config.visualPushEnabled ?? true,
      visualPushStrengthMin: config.visualPushStrengthMin ?? 0.5,
      visualPushStrengthMax: config.visualPushStrengthMax ?? 2.0,
      visualPushRadiusMin: config.visualPushRadiusMin ?? 5.0,
      visualPushRadiusMax: config.visualPushRadiusMax ?? 8.0,
      audioEnabled: config.audioEnabled ?? false,
      audioThumpVolume: config.audioThumpVolume ?? 0.18,
      audioShimmerVolume: config.audioShimmerVolume ?? 0.08,
      audioEchoVolume: config.audioEchoVolume ?? 0.06,
      lodNearDistance: config.lodNearDistance ?? 30.0,
      lodMidDistance: config.lodMidDistance ?? 80.0,
      lodFarDistance: config.lodFarDistance ?? 120.0,
      
      // Phase 2: Glow and beam effects
      hubGlowModulationEnabled: config.hubGlowModulationEnabled ?? true,
      hubGlowIntensity: config.hubGlowIntensity ?? 0.20,           // Amplified from 0.05
      hubGlowColor: config.hubGlowColor ?? new THREE.Color(0x7ffcff), // Cyan-white
      linkResonanceBeamEnabled: config.linkResonanceBeamEnabled ?? true,
      linkBeamOpacity: config.linkBeamOpacity ?? 0.25,             // Amplified from 0.08
      linkBeamColor: config.linkBeamColor ?? new THREE.Color(0x9fdfff),
      
      // Phase 2: Multi-Layer Link Beams
      multiLayerBeamsEnabled: config.multiLayerBeamsEnabled ?? true,
      
      // Core Beam (hot)
      coreBeamWidth: config.coreBeamWidth ?? 1.0,
      coreBeamOpacity: config.coreBeamOpacity ?? 0.5,
      coreBeamPulseSpeed: config.coreBeamPulseSpeed ?? 3.0,
      
      // Glow Layer
      glowLayerWidth: config.glowLayerWidth ?? 2.5,
      glowLayerOpacity: config.glowLayerOpacity ?? 0.25,
      glowLayerPulseSpeed: config.glowLayerPulseSpeed ?? 1.5,
      
      // Aura Layer
      auraLayerWidth: config.auraLayerWidth ?? 4.0,
      auraLayerOpacity: config.auraLayerOpacity ?? 0.12,
      auraLayerPulseSpeed: config.auraLayerPulseSpeed ?? 0.8,
      
      waveStrengthIndicatorEnabled: config.waveStrengthIndicatorEnabled ?? true
    };
    
    // Wave state tracking (per hub pair)
    // Key: "hubA-hubB", Value: { wavePhase, influence }
    this.activeWaves = new Map();
    
    // Phase 1: Wavefront ring pool (reused geometries)
    this._ringGeometryPool = null;
    this._ringMaterial = null;
    this._activeRings = []; // Array of { mesh, waveKey, startTime, hubAId, hubBId, tier }
    this._freeRingIndices = [];

    // Phase 2: Three-tier ring indices for parallax
    this._innerRingIndices = [];
    this._middleRingIndices = [];
    this._outerRingIndices = [];

    // Phase 2: Resonance beam pool (reused line meshes)
    this._beamGeometryPool = null;
    this._beamMaterial = null;
    this._activeBeams = [];
    this._freeBeamIndices = [];

    // Phase 3: Particle systems
    this._wavefrontParticlePool = [];
    this._freeWavefrontParticleIndices = [];
    this._activeWavefrontParticles = [];

    this._resonanceSparkPool = [];
    this._freeResonanceSparkIndices = [];
    this._activeResonanceSparks = [];

    this._echoTrailPool = [];
    this._freeEchoTrailIndices = [];
    this._activeEchoTrails = [];

    this._interferenceParticlePool = [];
    this._freeInterferenceParticleIndices = [];
    this._activeInterferenceParticles = [];

    // Phase 5: Interaction effects
    this._waveLightPool = [];
    this._freeWaveLightIndices = [];
    this._activeWaveLights = [];
    this._audioContext = null;

    // Reusable scratch objects
    this._scratchColor = new THREE.Color();

    // Global time accumulator for wave period calculation
    this.globalWaveTime = 0;
    
    // Statistics
    this.stats = {
      activeWaves: 0,
      affectedLinks: 0,
      affectedHubs: 0,
      avgWaveInfluence: 0,
      lastUpdateTime: 0,
    };

    this._semanticUnsubscribers = [];
    this._semanticBusRef = null;
    this._semanticSubscribed = false;
    this._subscribeCascadeEvents();
    
    // Phase 1: Initialize ring system
    this._initWavefrontRingSystem();
    
    // Phase 2: Initialize link resonance beam system
    this._initLinkResonanceBeamSystem();

    // Phase 3: Particle systems for movement and detail
    this._initPhase3ParticleSystems();

    // Phase 5: Interaction effects (lighting, push, audio)
    this._initPhase5InteractionSystems();
  }

  /**
   * Phase 2: Initialize link resonance beam system with EPIC shader (ATM_RESONANCE_BEAM_v2)
   * Phase 2: Multi-layer beams (Core, Glow, Aura) for depth and richness
   */
  _initLinkResonanceBeamSystem() {
    if (!this.config.linkResonanceBeamEnabled) return;
    if (!this.harmonicHubSystem?.world?.scene) return;

    const scene = this.harmonicHubSystem.world.scene;
    this._beamGeometryPool = [];
    this._freeBeamIndices = [];

    const beamCount = Math.max(1, Math.min(this.config.maxWaveActivePairs, 32));

    // EPIC RESONANCE BEAM SHADER (ATM_RESONANCE_BEAM_v2)
    // Features:
    // - Core hot line: exp(-dist²×18) — white-hot center
    // - Primary glow: exp(-dist²×6) — colored
    // - Secondary outer glow: exp(-dist²×2) — soft
    // - Energy pulse traveling: bright pulse moves along the beam
    // - Cross-interference: when beams overlap
    // - Harmony luminance boost: 0.85 + harmony × 0.20
    // - Corruption flicker: >0.3 corruption triggers high-frequency flicker
    const beamMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0x9fdfff) }, // Cyan-white
        uTime: { value: 0.0 },
        uOpacity: { value: 0.0 },
        uPulsePhase: { value: 0.0 }, // Pulse traveling phase
        uHarmony: { value: 0.5 }, // Harmony for luminance boost
        uCorruption: { value: 0.0 }, // Corruption for flicker
        uBeamLength: { value: 1.0 }, // Beam length for pulse calculation
        uLayerType: { value: 0 } // 0=core, 1=glow, 2=aura
        ,uBloomStrength: { value: 0.0 },
        uBloomThreshold: { value: 0.6 },
        uChromaticShift: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vDistFromCenter;
        
        void main() {
          vUv = uv;
          // Distance from center line (UV.x = 0.5 is center)
          vDistFromCenter = abs(uv.x - 0.5) * 2.0;
          
          // Path displacement: beam pulses along the link
          float pulseDisplacement = sin(uv.y * 10.0 - uTime * 3.0) * 0.02 * vDistFromCenter;
          
          vec3 newPos = position;
          newPos.x += pulseDisplacement;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uTime;
        uniform float uOpacity;
        uniform float uPulsePhase;
        uniform float uHarmony;
        uniform float uCorruption;
        uniform float uBeamLength;
        uniform float uLayerType;
        
        varying vec2 vUv;
        varying float vDistFromCenter;
        
        // Random function for flicker
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }
        
        void main() {
          // Layer-specific glow intensity
          float coreIntensity = (uLayerType == 0.0) ? 1.0 : 0.0;
          float glowIntensity = (uLayerType == 1.0) ? 1.0 : 0.0;
          float auraIntensity = (uLayerType == 2.0) ? 1.0 : 0.0;
          
          // Core hot line: exp(-dist²×18) — white-hot center
          float hotCore = exp(-pow(vDistFromCenter, 2.0) * 18.0) * coreIntensity;
          
          // Primary glow: exp(-dist²×6) — colored
          float primaryGlow = exp(-pow(vDistFromCenter, 2.0) * 6.0) * 0.8 * (coreIntensity + glowIntensity);
          
          // Secondary outer glow: exp(-dist²×2) — soft
          float outerGlow = exp(-pow(vDistFromCenter, 2.0) * 2.0) * 0.4 * (glowIntensity + auraIntensity);
          
          // Energy pulse traveling: bright pulse moves along the beam
          float pulsePos = (uPulsePhase + vUv.y) * 3.14159;
          float travelingPulse = exp(-pow(sin(pulsePos), 2.0) * 8.0) * 0.6;
          travelingPulse *= smoothstep(0.0, 0.2, vDistFromCenter);
          travelingPulse *= (coreIntensity + glowIntensity * 0.7);
          
          // Combine all glow layers
          float glow = hotCore + primaryGlow + outerGlow + travelingPulse;
          
          // Harmony luminance boost: 0.85 + harmony × 0.20
          float harmonyBoost = 0.85 + uHarmony * 0.20;
          glow *= harmonyBoost;
          
          // Corruption flicker: >0.3 corruption triggers high-frequency flicker
          float corruptionFlicker = 1.0;
          if (uCorruption > 0.3) {
            float flickerIntensity = (uCorruption - 0.3) / 0.7;
            float flickerNoise = random(vec2(uTime * 20.0, vUv.y * 10.0));
            corruptionFlicker = 1.0 + (flickerNoise - 0.5) * flickerIntensity * 0.5;
            glow *= corruptionFlicker;
          }
          
          // Cross-interference: subtle variation along beam
          float interference = sin(vUv.y * 20.0 + uTime * 2.0) * 0.5 + 0.5;
          glow *= (0.9 + interference * 0.1);
          
          // Hot core whitening: white center with colored glow
          vec3 finalColor = mix(uColor, vec3(1.0), hotCore * 0.8);
          finalColor += vec3(travelingPulse) * 0.3;

          float bloomMask = smoothstep(uBloomThreshold, uBloomThreshold + 0.1, glow);
          float bloomGlow = bloomMask * uBloomStrength;
          finalColor += vec3(1.0) * bloomGlow * 0.4;

          // Chromatic aberration pulse along the beam
          finalColor.r += uChromaticShift * smoothstep(0.0, 1.0, vUv.y) * 0.8;
          finalColor.b -= uChromaticShift * (1.0 - smoothstep(0.0, 1.0, vUv.y)) * 0.5;
          
          float alpha = glow * uOpacity;
          
          gl_FragColor = vec4(finalColor, alpha);
          
          // Early discard for performance
          if (alpha < 0.003) discard;
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
      customProgramCacheKey: () => 'ATM_RESONANCE_BEAM_v2'
    });

    // Create MULTI-LAYER beams (core, glow, aura per wave pair)
    const layersPerBeam = 3; // Core, Glow, Aura
    const totalMeshes = beamCount * layersPerBeam;

    for (let i = 0; i < totalMeshes; i++) {
      const wavePairIndex = Math.floor(i / layersPerBeam);
      const layerIndex = i % layersPerBeam;
      
      let radius;
      if (layerIndex === 0) {
        radius = this.config.coreBeamWidth * 0.15; // Core
      } else if (layerIndex === 1) {
        radius = this.config.glowLayerWidth * 0.15; // Glow
      } else {
        radius = this.config.auraLayerWidth * 0.15; // Aura
      }
      
      // Use CylinderGeometry for thick beam effect
      const geometry = new THREE.CylinderGeometry(radius, radius, 1.0, 8, 1, true);
      geometry.rotateZ(Math.PI / 2); // Rotate to align with Y-axis (beam direction)

      const material = beamMaterial.clone();
      material.uniforms.uLayerType.value = layerIndex;

      const line = new THREE.Mesh(geometry, material);
      line.visible = false;
      line.renderOrder = VisualHierarchyRegistry?.getRenderOrder?.(VisualHierarchyRegistry.LAYER_LINK_CASCADE) ?? 13;
      scene.add(line);

      this._beamGeometryPool.push({
        line,
        geometry,
        active: false,
        index: i,
        wavePairIndex: wavePairIndex,
        layerType: layerIndex // 0=core, 1=glow, 2=aura
      });
      this._freeBeamIndices.push(i);
    }
  }

  _initPhase3ParticleSystems() {
    if (!this.harmonicHubSystem?.world?.scene) return;
    const scene = this.harmonicHubSystem.world.scene;

    // Wavefront particles pool
    const wavefrontCount = Math.min(240, this.config.maxWaveActivePairs * this.config.wavefrontRingCount * this.config.wavefrontParticlesPerRing);
    for (let i = 0; i < wavefrontCount; i++) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(3);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particles = new THREE.Points(geometry, this._createWavefrontParticleMaterial());
      particles.visible = false;
      particles.renderOrder = VisualHierarchyRegistry?.getRenderOrder?.(VisualHierarchyRegistry.LAYER_LINK_CASCADE) ?? 13;
      scene.add(particles);
      this._wavefrontParticlePool.push({
        index: i,
        points: particles,
        geometry,
        active: false,
        life: 0,
        maxLife: 0,
        angle: 0,
        speed: 0,
        radius: 0,
        ringEntry: null,
        tier: 'inner',
        visible: false
      });
      this._freeWavefrontParticleIndices.push(i);
    }

    // Resonance spark pool
    const sparkCount = Math.min(120, this.config.maxWaveActivePairs * this.config.resonanceSparkCountPerWave);
    for (let i = 0; i < sparkCount; i++) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(3);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const points = new THREE.Points(geometry, this._createResonanceSparkMaterial());
      points.visible = false;
      points.renderOrder = VisualHierarchyRegistry?.getRenderOrder?.(VisualHierarchyRegistry.LAYER_LINK_CASCADE) ?? 13;
      scene.add(points);
      this._resonanceSparkPool.push({
        index: i,
        points,
        geometry,
        active: false,
        life: 0,
        maxLife: 0,
        velocity: new THREE.Vector3(),
        color: new THREE.Color(),
        visible: false
      });
      this._freeResonanceSparkIndices.push(i);
    }

    // Echo trail pool
    const echoCount = Math.min(120, this.config.maxWaveActivePairs * this.config.echoTrailParticlesPerBeam);
    for (let i = 0; i < echoCount; i++) {
      const trailSegments = 3;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(trailSegments * 3);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const line = new THREE.Line(geometry, this._createEchoTrailMaterial());
      line.visible = false;
      line.renderOrder = VisualHierarchyRegistry?.getRenderOrder?.(VisualHierarchyRegistry.LAYER_LINK_CASCADE) ?? 13;
      scene.add(line);
      this._echoTrailPool.push({
        index: i,
        line,
        geometry,
        active: false,
        life: 0,
        maxLife: 0,
        speed: 0,
        drift: 0,
        direction: new THREE.Vector3(),
        currentT: 0,
        startPos: new THREE.Vector3(),
        length: 0,
        visible: false
      });
      this._freeEchoTrailIndices.push(i);
    }

    // Interference particles pool
    const interferenceCount = Math.min(60, this.config.interferenceParticleCount);
    for (let i = 0; i < interferenceCount; i++) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(3);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const points = new THREE.Points(geometry, this._createInterferenceParticleMaterial());
      points.visible = false;
      points.renderOrder = VisualHierarchyRegistry?.getRenderOrder?.(VisualHierarchyRegistry.LAYER_LINK_CASCADE) ?? 13;
      scene.add(points);
      this._interferenceParticlePool.push({
        index: i,
        points,
        geometry,
        active: false,
        life: 0,
        maxLife: 0,
        angle: 0,
        radius: 0,
        speed: 0,
        hubId: null,
        constructive: true,
        visible: false
      });
      this._freeInterferenceParticleIndices.push(i);
    }
  }

  _initPhase5InteractionSystems() {
    if (!this.config.dynamicLightingEnabled) return;
    if (!this.harmonicHubSystem?.world?.scene) return;
    const scene = this.harmonicHubSystem.world.scene;

    const lightCount = Math.max(3, Math.min(this.config.waveLightCount, 5));
    for (let i = 0; i < lightCount; i++) {
      const light = new THREE.PointLight(new THREE.Color(0x99ffff), 0.0, this.config.waveLightRangeMax, 2);
      light.visible = false;
      light.renderOrder = VisualHierarchyRegistry?.getRenderOrder?.(VisualHierarchyRegistry.LAYER_LINK_CASCADE) ?? 13;
      scene.add(light);
      this._waveLightPool.push({
        index: i,
        light,
        active: false,
        life: 0,
        maxLife: 0,
        peakIntensity: 0,
        rangeStart: this.config.waveLightRangeMin,
        rangeEnd: this.config.waveLightRangeMax
      });
      this._freeWaveLightIndices.push(i);
    }
  }

  _allocateWaveLight() {
    if (!this._freeWaveLightIndices || this._freeWaveLightIndices.length === 0) return null;
    const index = this._freeWaveLightIndices.pop();
    const entry = this._waveLightPool[index];
    if (!entry) return null;
    entry.active = true;
    entry.light.visible = true;
    return entry;
  }

  _releaseWaveLight(entry) {
    if (!entry || entry.index === undefined) return;
    entry.active = false;
    entry.light.visible = false;
    entry.life = 0;
    entry.peakIntensity = 0;
    this._freeWaveLightIndices.push(entry.index);
  }

  _triggerWaveLightFlash(position, intensity) {
    if (!this.config.dynamicLightingEnabled || !position) return;
    const lightEntry = this._allocateWaveLight();
    if (!lightEntry) return;

    lightEntry.light.position.copy(position);
    lightEntry.light.color.set(0x99ffff);
    lightEntry.light.intensity = 0;
    lightEntry.light.distance = THREE.MathUtils.lerp(this.config.waveLightRangeMin, this.config.waveLightRangeMax, intensity);
    lightEntry.life = 0;
    lightEntry.maxLife = 0.3;
    lightEntry.peakIntensity = THREE.MathUtils.lerp(0.8, this.config.waveLightIntensityMax, intensity);
    this._activeWaveLights.push(lightEntry);
  }

  _updateWaveLights(deltaTime) {
    if (!this._activeWaveLights || this._activeWaveLights.length === 0) return;
    const toRelease = [];
    for (let i = 0; i < this._activeWaveLights.length; i++) {
      const entry = this._activeWaveLights[i];
      if (!entry || !entry.active) {
        toRelease.push(i);
        continue;
      }
      entry.life += deltaTime;
      if (entry.life >= entry.maxLife) {
        toRelease.push(i);
        continue;
      }
      const t = entry.life / entry.maxLife;
      const intensity = t < 0.5
        ? THREE.MathUtils.lerp(0.0, entry.peakIntensity, t * 2)
        : THREE.MathUtils.lerp(entry.peakIntensity, 0.0, (t - 0.5) * 2);
      entry.light.intensity = intensity;
      entry.light.distance = THREE.MathUtils.lerp(entry.rangeStart, entry.rangeEnd, t);
      entry.light.decay = 2.0;
    }
    for (let i = toRelease.length - 1; i >= 0; i--) {
      const index = toRelease[i];
      this._releaseWaveLight(this._activeWaveLights[index]);
      this._activeWaveLights.splice(index, 1);
    }
  }

  _triggerVisualPush(origin, influence) {
    if (!this.config.visualPushEnabled || !origin) return;
    const radius = THREE.MathUtils.lerp(this.config.visualPushRadiusMin, this.config.visualPushRadiusMax, influence);
    const strength = THREE.MathUtils.lerp(this.config.visualPushStrengthMin, this.config.visualPushStrengthMax, influence);

    const pushCandidate = (item, attrName = 'position') => {
      if (!item || !item.active || !item.geometry || !item.geometry.attributes.position) return;
      const posAttr = item.geometry.attributes.position;
      const x = posAttr.getX(0);
      const y = posAttr.getY(0);
      const z = posAttr.getZ(0);
      const pos = new THREE.Vector3(x, y, z);
      const distance = pos.distanceTo(origin);
      if (distance <= 0 || distance > radius) return;
      const push = pos.clone().sub(origin).normalize().multiplyScalar(strength * (1 - distance / radius) * 0.08);
      pos.add(push);
      posAttr.setXYZ(0, pos.x, pos.y, pos.z);
      posAttr.needsUpdate = true;
    };

    for (const spark of this._activeResonanceSparks) {
      pushCandidate(spark);
    }
    for (const interference of this._activeInterferenceParticles) {
      pushCandidate(interference);
    }
  }

  _triggerWaveAudio(intensity, position) {
    if (!this.config.audioEnabled || typeof window === 'undefined') return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!this._audioContext) {
      try { this._audioContext = new AudioContext(); } catch (e) { return; }
    }
    const now = this._audioContext.currentTime;
    const bass = this._audioContext.createOscillator();
    const bassGain = this._audioContext.createGain();
    bass.type = 'sine';
    bass.frequency.value = 80 + intensity * 40;
    bassGain.gain.setValueAtTime(0, now);
    bassGain.gain.linearRampToValueAtTime(this.config.audioThumpVolume * intensity, now + 0.02);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    bass.connect(bassGain).connect(this._audioContext.destination);
    bass.start(now);
    bass.stop(now + 0.2);

    const shimmer = this._audioContext.createOscillator();
    const shimmerGain = this._audioContext.createGain();
    shimmer.type = 'triangle';
    shimmer.frequency.value = 600 + intensity * 400;
    shimmerGain.gain.setValueAtTime(0, now);
    shimmerGain.gain.linearRampToValueAtTime(this.config.audioShimmerVolume * intensity, now + 0.02);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    shimmer.connect(shimmerGain).connect(this._audioContext.destination);
    shimmer.start(now);
    shimmer.stop(now + 0.25);
  }

  _createWavefrontParticleMaterial() {
    return new THREE.PointsMaterial({
      color: new THREE.Color(0x99ffff),
      size: 0.12,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      sizeAttenuation: true,
      toneMapped: false,
      map: getEnvSpriteTexture('plasma'),
      alphaTest: 0.02
    });
  }

  _createResonanceSparkMaterial() {
    return new THREE.PointsMaterial({
      color: new THREE.Color(0xffffff),
      size: this.config.resonanceSparkSize,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      sizeAttenuation: true,
      toneMapped: false,
      map: getEnvSpriteTexture('plasma'),
      alphaTest: 0.02
    });
  }

  _createEchoTrailMaterial() {
    return new THREE.LineBasicMaterial({
      color: new THREE.Color(0x99ffff),
      transparent: true,
      opacity: 0.0,
      linewidth: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      toneMapped: false
    });
  }

  _createInterferenceParticleMaterial() {
    return new THREE.PointsMaterial({
      color: new THREE.Color(0x99ffff),
      size: 0.14,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      sizeAttenuation: true,
      toneMapped: false,
      map: getEnvSpriteTexture('plasma'),
      alphaTest: 0.02
    });
  }

  /**
   * Phase 1: Initialize wavefront ring system with EPIC shader (ATM_WAVE_RING_v3)
   * Phase 2: Three-tier ring system for parallax effect
   */
  _initWavefrontRingSystem() {
    if (!this.config.wavefrontRipplesEnabled) return;
    if (!this.harmonicHubSystem?.world?.scene) return;
    
    const scene = this.harmonicHubSystem.world.scene;
    
    // Create ring geometry (plane with circle shader) - higher detail for EPIC shaders
    const ringGeometry = new THREE.PlaneGeometry(1, 1, 64, 64);
    
    // EPIC RING SHADER (ATM_WAVE_RING_v3)
    // Features:
    // - Multi-lobe glow: hot core (exp×12) + inner (exp×6) + soft halo (exp×3)
    // - Energy shimmer: radial sine pattern
    // - Iridescent color shift: cyan ↔ violet ↔ gold based on wave phase
    // - Hot core whitening: additive white at high intensity
    // - Interference pattern: cross-ring interference for multiple waves
    // - Sparkle fringe: high-frequency sparkle at outer edge
    // - Early discard: alpha < 0.003
    const ringMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0x7ffcff) }, // Cyan-white base
        uTime: { value: 0.0 },
        uOpacity: { value: 1.0 },
        uWavePhase: { value: 0.0 }, // Wave phase for iridescence
        uIntensity: { value: 1.0 }, // Intensity for hot core whitening
        uInterference: { value: 0.0 }, // Interference factor
        uBloomStrength: { value: 0.0 },
        uBloomThreshold: { value: 0.6 },
        uChromaticShift: { value: 0.0 },
        uDistortionStrength: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vDist;
        
        void main() {
          vUv = uv;
          vec2 center = uv - 0.5;
          vDist = length(center);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uTime;
        uniform float uOpacity;
        uniform float uWavePhase;
        uniform float uIntensity;
        uniform float uInterference;
        
        varying vec2 vUv;
        varying float vDist;
        
        // Hash function for noise
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);
          float angle = atan(center.y, center.x);
          
          // Circular ring with soft edges (expanded from simple ring)
          float ringBase = smoothstep(0.44, 0.465, dist) * (1.0 - smoothstep(0.465, 0.50, dist));
          
          // Multi-lobe glow: hot core + inner glow + soft halo
          float hotCore = exp(-pow(dist - 0.455, 2.0) * 12.0);
          float innerGlow = exp(-pow(dist - 0.455, 2.0) * 6.0) * 0.6;
          float softHalo = exp(-pow(dist - 0.455, 2.0) * 3.0) * 0.3;
          float multiLobe = hotCore + innerGlow + softHalo;
          
          // Energy shimmer: radial sine pattern
          float shimmer = sin(angle * 8.0 + uTime * 3.0 + dist * 20.0) * 0.5 + 0.5;
          shimmer *= smoothstep(0.50, 0.45, dist) * smoothstep(0.42, 0.45, dist);
          
          // Iridescent color shift: cyan ↔ violet ↔ gold based on wave phase
          vec3 cyanColor = vec3(0.0, 0.9, 1.0);
          vec3 violetColor = vec3(0.6, 0.2, 1.0);
          vec3 goldColor = vec3(1.0, 0.8, 0.0);
          
          float phaseShift = sin(uWavePhase * 6.28318 + dist * 4.0) * 0.5 + 0.5;
          vec3 iridescentColor;
          if (phaseShift < 0.5) {
            float t = phaseShift * 2.0;
            iridescentColor = mix(cyanColor, violetColor, t);
          } else {
            float t = (phaseShift - 0.5) * 2.0;
            iridescentColor = mix(violetColor, goldColor, t);
          }
          
          // Hot core whitening: additive white at high intensity
          float hotCoreWhite = hotCore * uIntensity;
          vec3 finalColor = mix(iridescentColor, vec3(1.0), hotCoreWhite * 0.7);
          finalColor += shimmer * 0.15;
          
          // Interference pattern: cross-ring interference for multiple waves
          float interferencePattern = sin(angle * 16.0 + uTime * 2.0) * 0.5 + 0.5;
          interferencePattern *= uInterference;
          finalColor += interferencePattern * 0.2;
          
          // Sparkle fringe: high-frequency sparkle at outer edge (enhanced visibility)
          float sparkleNoise = hash(vUv * 50.0 + uTime * 2.0);
          float sparkleFringe = smoothstep(0.46, 0.50, dist) * sparkleNoise * 0.55;
          finalColor += sparkleFringe;
          // Secondary sparkle: finer grain at inner edge for depth
          float innerSparkle = hash(vUv * 80.0 - uTime * 3.0) * smoothstep(0.44, 0.42, dist) * 0.2;
          finalColor += innerSparkle;

          // Bloom overlay around active rings
          float bloomMask = smoothstep(uBloomThreshold, uBloomThreshold + 0.12, multiLobe + shimmer * 0.2);
          float bloomGlow = bloomMask * uBloomStrength;
          finalColor += vec3(1.0) * bloomGlow * 0.35;

          // Distortion halo around outer ring
          float distortionHalo = smoothstep(0.48, 0.55, dist) * (1.0 - smoothstep(0.55, 0.62, dist)) * uDistortionStrength;
          finalColor += vec3(0.6, 0.8, 1.0) * distortionHalo * 0.25;
          float alpha = (multiLobe + shimmer * 0.2 + sparkleFringe) * uOpacity * (1.0 + uInterference * 0.3) + distortionHalo * 0.18;

          // Chromatic shift pulse
          finalColor.r += uChromaticShift * 0.6;
          finalColor.b -= uChromaticShift * 0.4;

          vec3 color = mix(uColor, finalColor, 0.7);
          color += vec3(1.0) * hotCoreWhite * 0.5;
          
          gl_FragColor = vec4(color, alpha);
          
          // Early discard for performance
          if (alpha < 0.003) discard;
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
      customProgramCacheKey: () => 'ATM_WAVE_RING_v3'
    });
    
    this._ringGeometry = ringGeometry;
    this._ringMaterial = ringMaterial;
    
    // Create ring pool (reused meshes) - THREE TIERS for parallax
    this._ringGeometryPool = [];
    const ringsPerTier = Math.ceil(this.config.maxWaveActivePairs * this.config.wavefrontRingCount / 3);
    const ringCount = ringsPerTier * 3; // 3 tiers
    
    for (let i = 0; i < ringCount; i++) {
      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial.clone());
      ringMesh.visible = false;
      ringMesh.renderOrder = VisualHierarchyRegistry?.getRenderOrder?.(VisualHierarchyRegistry.LAYER_LINK_CASCADE) ?? 13; // High render order for overlay effect
      scene.add(ringMesh);
      
      // Assign tier for parallax
      let tier;
      if (i < ringsPerTier) {
        tier = 'inner';
        this._innerRingIndices.push(i);
      } else if (i < ringsPerTier * 2) {
        tier = 'middle';
        this._middleRingIndices.push(i);
      } else {
        tier = 'outer';
        this._outerRingIndices.push(i);
      }
      
      this._ringGeometryPool.push({
        mesh: ringMesh,
        index: i,
        tier: tier,
        active: false
      });
      this._freeRingIndices.push(i);
    }
  }

  /**
   * Phase 1: Allocate ring from pool (tier-aware for parallax)
   */
  _allocateRing(tier = 'any') {
    if (!this._freeRingIndices || this._freeRingIndices.length === 0) return null;
    
    // Try to allocate from specific tier first, then any
    let targetIndex = -1;
    if (tier !== 'any') {
      const tierIndices = tier === 'inner' ? this._innerRingIndices : 
                          tier === 'middle' ? this._middleRingIndices : 
                          this._outerRingIndices;
      
      for (const idx of tierIndices) {
        if (this._freeRingIndices.includes(idx)) {
          targetIndex = idx;
          break;
        }
      }
    }
    
    if (targetIndex === -1) {
      targetIndex = this._freeRingIndices.pop();
    } else {
      const freeIdx = this._freeRingIndices.indexOf(targetIndex);
      if (freeIdx !== -1) {
        this._freeRingIndices.splice(freeIdx, 1);
      }
    }
    
    if (targetIndex === -1) return null;
    
    const ringEntry = this._ringGeometryPool[targetIndex];
    if (!ringEntry) return null;
    
    ringEntry.active = true;
    ringEntry.mesh.visible = true;
    return ringEntry;
  }

  /**
   * Phase 1: Release ring back to pool
   */
  _releaseRing(ringEntry) {
    if (!ringEntry) return;
    ringEntry.active = false;
    ringEntry.mesh.visible = false;
    if (ringEntry.index >= 0) {
      this._freeRingIndices.push(ringEntry.index);
    }
  }

  _clearCascadeSubscriptions() {
    for (const unsub of this._semanticUnsubscribers) {
      try {
        unsub?.();
      } catch (_) {
        // noop
      }
    }
    this._semanticUnsubscribers.length = 0;
    this._semanticBusRef = null;
    this._semanticSubscribed = false;
  }

  _subscribeCascadeEvents() {
    const bus = this.semanticBus || null;
    if (!bus) return;

    if (this._semanticSubscribed && this._semanticBusRef === bus) {
      return;
    }

    this._clearCascadeSubscriptions();

    const on = bus?.on?.bind(bus);
    if (typeof on !== 'function') return;

    const onCascadeStart = (event = {}) => {
      const activation = this._resolveWaveActivation(event);
      if (!activation) return;

      const sourceNode = this._resolveCascadeEndpoint(
        event.sourceNode ||
        event.source ||
        event.from ||
        event.sourceId ||
        event.sourceNodeId ||
        event.fromId,
        event.sourceNodeId ?? event.sourceId ?? event.fromId ?? null
      );
      const targetNode = this._resolveCascadeEndpoint(
        event.targetNode ||
        event.target ||
        event.to ||
        event.targetId ||
        event.targetNodeId ||
        event.toId,
        event.targetNodeId ?? event.targetId ?? event.toId ?? null
      );

      if (!sourceNode || !targetNode) return;

      this.handleCascadeStart({
        ...event,
        ...activation,
        sourceNode,
        targetNode
      });
    };

    const onCascadeHop = (event = {}) => {
      if (!event) return;
      const activation = this._resolveWaveActivation(event);
      if (!activation) return;

      const linkPayload = event.link || event;
      const sourceNode = this._resolveCascadeEndpoint(
        linkPayload?.source ||
        linkPayload?.sourceNode ||
        linkPayload?.from ||
        event.sourceNode ||
        event.fromNode ||
        event.sourceId ||
        event.sourceNodeId ||
        event.fromId,
        event.sourceNodeId ?? event.sourceId ?? event.fromId ?? null
      );
      const targetNode = this._resolveCascadeEndpoint(
        linkPayload?.target ||
        linkPayload?.targetNode ||
        linkPayload?.to ||
        event.targetNode ||
        event.toNode ||
        event.targetId ||
        event.targetNodeId ||
        event.toId,
        event.targetNodeId ?? event.targetId ?? event.toId ?? null
      );

      if (!sourceNode || !targetNode) return;

      this.handleCascadeHop({
        ...event,
        ...activation,
        sourceNode,
        targetNode
      });
    };

    on('cascade.start', onCascadeStart);
    on('cascade.hop', onCascadeHop);
    this._semanticBusRef = bus;
    this._semanticSubscribed = true;

    if (typeof bus?.off === 'function') {
      this._semanticUnsubscribers.push(() => bus.off('cascade.start', onCascadeStart));
      this._semanticUnsubscribers.push(() => bus.off('cascade.hop', onCascadeHop));
    } else if (typeof bus?.unsubscribe === 'function') {
      this._semanticUnsubscribers.push(() => bus.unsubscribe('cascade.start', onCascadeStart));
      this._semanticUnsubscribers.push(() => bus.unsubscribe('cascade.hop', onCascadeHop));
    }
  }

  rebind(config = {}) {
    if (config.cascadeSystem !== undefined) {
      this.cascadeSystem = config.cascadeSystem;
    }
    if (config.harmonicHubSystem !== undefined) {
      this.harmonicHubSystem = config.harmonicHubSystem;
    }
    if (config.linkResonanceSystem !== undefined) {
      this.linkResonanceSystem = config.linkResonanceSystem;
    }
    if (config.semanticBus !== undefined) {
      this.semanticBus = config.semanticBus;
    }
    if (config.frameScheduler !== undefined) {
      this.frameScheduler = config.frameScheduler;
    }
    if (config.camera !== undefined) {
      this.camera = config.camera;
    } else if (!this.camera) {
      this.camera = this.harmonicHubSystem?.world?.camera ?? this.camera;
    }

    this._subscribeCascadeEvents();
    return this;
  }

  _resolveNodeId(node) {
    if (!node) return null;

    if (node.primaryNode) {
      const primaryId = this._resolveNodeId(node.primaryNode);
      if (primaryId) return primaryId;
    }

    if (Array.isArray(node.nodes) && node.nodes.length > 0) {
      const firstNodeId = this._resolveNodeId(node.nodes[0]);
      if (firstNodeId) return firstNodeId;
    }

    return node?.userData?.nodeId ?? node?.userData?.id ?? node?.id ?? node?.uuid ?? node?.hubId ?? node?.userData?.hubId ?? null;
  }

  _resolveCascadeEndpoint(endpoint, endpointId = null) {
    if (endpoint && typeof endpoint === 'object') {
      return endpoint.primaryNode ?? endpoint.nodes?.[0] ?? endpoint;
    }

    const candidateId = endpointId ?? endpoint;
    if (candidateId === null || candidateId === undefined) {
      return null;
    }

    return this._findNodeById(candidateId) || null;
  }

  _clamp01(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
  }

  _computeCameraDistanceFade(position) {
    if (!this.camera || !position || !this.config.cameraEffectFalloff) return 1.0;
    const distance = position.distanceTo(this.camera.position);
    if (distance <= this.config.cameraEffectDistance) return 1.0;
    const fadeRange = Math.max(0.001, this.config.cameraEffectFalloff - this.config.cameraEffectDistance);
    return Math.max(0, 1.0 - (distance - this.config.cameraEffectDistance) / fadeRange);
  }

  _getLODLevel(position) {
    if (!this.camera || !position) return 'near';
    const dist = position.distanceTo(this.camera.position);
    if (dist <= this.config.lodNearDistance) return 'near';
    if (dist <= this.config.lodMidDistance) return 'mid';
    return 'far';
  }

  _getRingBloomParams(tier, influence) {
    if (!this.config.postProcessingEnabled) return { threshold: 1.0, strength: 0.0 };
    if (tier === 'inner') {
      return {
        threshold: this.config.innerRingBloomThreshold,
        strength: this.config.innerRingBloomStrength * Math.min(1, influence * 1.3)
      };
    }
    if (tier === 'middle') {
      return {
        threshold: this.config.middleRingBloomThreshold,
        strength: this.config.middleRingBloomStrength * Math.min(1, influence * 1.1)
      };
    }
    return {
      threshold: this.config.outerRingBloomThreshold,
      strength: this.config.outerRingBloomStrength * Math.min(1, influence * 0.9)
    };
  }

  _getBeamBloomParams(layerIndex, influence) {
    if (!this.config.postProcessingEnabled) return { threshold: 1.0, strength: 0.0 };
    const baseStrength = layerIndex === 0 ? this.config.coreBeamBloomStrength : this.config.coreBeamBloomStrength * 0.45;
    const threshold = layerIndex === 0 ? this.config.coreBeamBloomThreshold : Math.max(0.35, this.config.coreBeamBloomThreshold - 0.1);
    return {
      threshold,
      strength: baseStrength * Math.min(1, influence * 1.4)
    };
  }

  _resolveWaveActivation(event = {}) {
    const phaseSyncStrength = this._clamp01(
      event?.phaseSyncStrength ??
      event?.syncStrength ??
      event?.intensity ??
      event?.value ??
      event?.strength ??
      0
    );
    const phaseSyncStability = this._clamp01(
      event?.phaseSyncStability ??
      event?.syncStability ??
      event?.stability ??
      event?.harmony ??
      event?.intensity ??
      event?.value ??
      event?.strength ??
      0
    );

    if (phaseSyncStrength <= 0 || phaseSyncStability <= 0) {
      return null;
    }

    return {
      phaseSyncStrength,
      phaseSyncStability,
      intensity: this._clamp01(event?.intensity ?? event?.value ?? event?.strength ?? ((phaseSyncStrength + phaseSyncStability) * 0.5))
    };
  }

  _readHubWaveState(hub) {
    const primaryNode = hub?.primaryNode ?? hub?.nodes?.[0] ?? null;
    const hubMetrics = hub?.userData?.metrics ?? null;
    const primaryMetrics = primaryNode?.userData?.metrics ?? null;

    const read = (key, fallback = 0) => {
      const value =
        hubMetrics?.[key] ??
        hub?.[key] ??
        primaryMetrics?.[key] ??
        primaryNode?.userData?.[key] ??
        fallback;
      return this._clamp01(value);
    };

    const corruption = read('corruption', 0);
    const stability = read('stability', 1 - corruption);

    return {
      primaryNode,
      harmony: read('harmony', 0),
      synergy: read('synergy', 0),
      corruption,
      stability,
    };
  }

  _isHubWaveEligible(state) {
    if (!state) return false;
    return state.corruption < this.config.minHubCorruptionThreshold &&
      state.stability > this.config.minHubStabilityThreshold;
  }

  handleCascadeStart(event = {}) {
    const activation = this._resolveWaveActivation(event);
    if (!activation) return;
    if (activation.phaseSyncStrength < this.config.minPhaseSyncStrength) return;
    if (activation.phaseSyncStability < this.config.minPhaseSyncStability) return;
    if (activation.intensity < this.config.minCascadeStrengthTrigger) return;

    if (!event?.sourceNode || !event?.targetNode) return;

    this.spawnCascadeResonanceWave(
      event.sourceNode,
      event.targetNode,
      activation.intensity,
      event.hopIndex ?? 0
    );
  }

  handleCascadeHop(event = {}) {
    const activation = this._resolveWaveActivation(event);
    if (!activation) return;
    if (activation.phaseSyncStrength < this.config.minPhaseSyncStrength) return;
    if (activation.phaseSyncStability < this.config.minPhaseSyncStability) return;
    if (activation.intensity < this.config.minCascadeStrengthTrigger) return;

    if (!event?.sourceNode || !event?.targetNode) return;

    this.spawnCascadeResonanceWave(
      event.sourceNode,
      event.targetNode,
      activation.intensity,
      event.hopIndex ?? 0
    );
  }

  spawnCascadeResonanceWave(sourceNode, targetNode, intensity = 1.0, hopIndex = 0) {
    const resolvedSource = this._resolveCascadeEndpoint(sourceNode);
    const resolvedTarget = this._resolveCascadeEndpoint(targetNode);
    const sourceId = this._resolveNodeId(resolvedSource) ?? this._resolveNodeId(sourceNode);
    const targetId = this._resolveNodeId(resolvedTarget) ?? this._resolveNodeId(targetNode);
    if (!sourceId || !targetId) return;

    const waveKey = `${sourceId}-${targetId}`;
    const clampedIntensity = Math.max(0, Math.min(1, Number(intensity) || 0));
    if (clampedIntensity <= 0) return;

    const hop = Math.max(0, Number(hopIndex) || 0);
    const hopDecay = Math.pow(0.9, hop);
    const influenceRange = this.config.waveInfluenceMax - this.config.waveInfluenceMin;
    const influence = this.config.waveInfluenceMin + clampedIntensity * hopDecay * influenceRange;
    const resolvedInfluence = Math.max(this.config.waveInfluenceMin, Math.min(this.config.waveInfluenceMax, influence));

    if (this.activeWaves.has(waveKey)) {
      this.activeWaves.delete(waveKey);
    }

    if (this.activeWaves.size >= this.config.maxWavePoolSize) {
      let oldestKey = null;
      let oldestCreatedAt = Infinity;
      for (const [key, data] of this.activeWaves.entries()) {
        if ((data.createdAt ?? Infinity) < oldestCreatedAt) {
          oldestCreatedAt = data.createdAt;
          oldestKey = key;
        }
      }
      if (oldestKey) {
        this.activeWaves.delete(oldestKey);
      }
    } else if (this.activeWaves.size >= this.config.softWaveActiveLimit) {
      let lowestKey = null;
      let lowestInfluence = Infinity;
      for (const [key, data] of this.activeWaves.entries()) {
        if (data.influence < lowestInfluence) {
          lowestInfluence = data.influence;
          lowestKey = key;
        }
      }
      if (lowestKey && lowestInfluence < resolvedInfluence) {
        this.activeWaves.delete(lowestKey);
      }
    }

    const waveData = {
      wavePhase: this.globalWaveTime % 1,
      influence: resolvedInfluence,
      hubAId: sourceId,
      hubBId: targetId,
      createdAt: this.globalWaveTime,
      decayRate: this._resolveWaveDecayRate(resolvedInfluence),
      previousInfluence: 0,
      targetInfluence: resolvedInfluence,
      influenceTransitionProgress: 1.0
    };

    this.activeWaves.set(waveKey, waveData);

    const sourcePos = this._resolveNodeWorldPosition(resolvedSource) ?? this._resolveNodeWorldPosition(this._findNodeById(sourceId));
    const targetPos = this._resolveNodeWorldPosition(resolvedTarget) ?? this._resolveNodeWorldPosition(this._findNodeById(targetId));

    if (this.config.dynamicLightingEnabled) {
      this._triggerWaveLightFlash(sourcePos, resolvedInfluence);
      this._triggerWaveLightFlash(targetPos, resolvedInfluence);
    }

    if (this.config.visualPushEnabled) {
      this._triggerVisualPush(sourcePos, resolvedInfluence);
      this._triggerVisualPush(targetPos, resolvedInfluence);
    }

    if (this.config.audioEnabled) {
      this._triggerWaveAudio(resolvedInfluence, sourcePos || targetPos);
    }
  }

  /**
   * Update resonance wave visualization (called every frame)
   * @param {number} deltaTime - Delta time in seconds
   */
  update(deltaTime) {
    if (this.frameScheduler?.shouldRunVisual && !this.frameScheduler.shouldRunVisual()) return;
    
    if (!this.config.enabled) {
      this._decayAllWaves(deltaTime);
      return;
    }
    
    const startTime = performance.now();
    
    // Accumulate global wave time
    this.globalWaveTime += deltaTime;
    
    // Event-driven mode: no proximity scanning, no cascadeSystem/hub polling triggers.
    this._decayAllWaves(deltaTime);
    this._bootstrapWaveFromActiveHubs();

    let totalInfluence = 0;
    let waveCount = 0;
    const affectedHubSet = new Set();
    for (const waveData of this.activeWaves.values()) {
      totalInfluence += waveData.influence;
      waveCount += 1;
      if (waveData.hubAId) affectedHubSet.add(waveData.hubAId);
      if (waveData.hubBId) affectedHubSet.add(waveData.hubBId);
    }
    
    // Apply wave effects to visual systems
    this._applyWaveEffects(deltaTime);
    
    // Update statistics
    this.stats.activeWaves = waveCount;
    this.stats.affectedLinks = this.activeWaves.size;
    this.stats.affectedHubs = affectedHubSet.size;
    this.stats.avgWaveInfluence = waveCount > 0 ? totalInfluence / waveCount : 0;
    this.stats.lastUpdateTime = performance.now() - startTime;
    
    if (this.config.debugMode && waveCount > 0) {
      console.log(
        `[CascadeWave] active=${waveCount} | ` +
        `hubs=${affectedHubSet.size} | ` +
        `avgInfluence=${this.stats.avgWaveInfluence.toFixed(3)} | ` +
        `time=${this.stats.lastUpdateTime.toFixed(2)}ms`
      );
    }
  }

  _bootstrapWaveFromActiveHubs() {
    if (this.activeWaves.size >= this.config.softWaveActiveLimit) return false;
    if (!this.harmonicHubSystem?.hubs || typeof this.harmonicHubSystem.hubs.values !== 'function') return false;

    const activeHubs = Array.from(this.harmonicHubSystem.hubs.values()).filter((hub) => hub && hub.active !== false);
    if (activeHubs.length < 2) return false;

    const activeHubStates = activeHubs
      .map((hub) => ({ hub, state: this._readHubWaveState(hub) }))
      .filter(({ state }) => this._isHubWaveEligible(state));

    if (activeHubStates.length < 2) return false;

    const sortedHubs = activeHubStates
      .slice()
      .sort((a, b) => (Number(b.state.synergy) || 0) - (Number(a.state.synergy) || 0));

    const hubAEntry = sortedHubs[0];
    const hubBEntry = sortedHubs.find((entry) => this._resolveNodeId(entry?.hub?.primaryNode ?? entry?.hub?.nodes?.[0]) !== this._resolveNodeId(hubAEntry?.hub?.primaryNode ?? hubAEntry?.hub?.nodes?.[0]))
      ?? sortedHubs[1];

    const sourceNode = hubAEntry?.state?.primaryNode ?? hubAEntry?.hub?.primaryNode ?? hubAEntry?.hub?.nodes?.[0] ?? null;
    const targetNode = hubBEntry?.state?.primaryNode ?? hubBEntry?.hub?.primaryNode ?? hubBEntry?.hub?.nodes?.[0] ?? null;
    const sourceId = this._resolveNodeId(sourceNode);
    const targetId = this._resolveNodeId(targetNode);
    if (!sourceId || !targetId) return false;
    if (sourceId === targetId) return false;

    const now = performance.now();
    const bootstrapKey = `${sourceId}-${targetId}`;
    if (this._bootstrapWaveKey === bootstrapKey && now < (this._bootstrapWaveCooldownUntil ?? 0)) {
      return false;
    }

    const avgHubStrength = Math.max(0, Math.min(1, (hubAEntry.state.synergy + hubBEntry.state.synergy) * 0.5));
    const avgHubHarmony = Math.max(0, Math.min(1, (hubAEntry.state.harmony + hubBEntry.state.harmony) * 0.5));
    const bootstrapIntensity = Math.max(
      this.config.waveInfluenceMin,
      Math.min(
        this.config.waveInfluenceMax,
        0.2 + avgHubStrength * 0.35 + avgHubHarmony * 0.25
      )
    );

    this.spawnCascadeResonanceWave(sourceNode, targetNode, bootstrapIntensity, 0);
    this._bootstrapWaveKey = bootstrapKey;
    this._bootstrapWaveCooldownUntil = now + 750;
    return true;
  }

  _resolvePairCascadeData(pair) {
    const hubAData = this._resolveNodeCascadeData(pair?.hubAId);
    const hubBData = this._resolveNodeCascadeData(pair?.hubBId);

    const directIntensity = Number.isFinite(pair?.intensity) ? pair.intensity : 0;
    const directPhase = Number.isFinite(pair?.phase) ? pair.phase : null;

    return {
      intensity: Math.max(directIntensity, hubAData.intensity, hubBData.intensity),
      phase: directPhase ?? ((hubAData.phase + hubBData.phase) * 0.5)
    };
  }

  _resolveNodeCascadeData(nodeId) {
    if (!nodeId) return { intensity: 0, phase: 0 };

    if (typeof this.cascadeSystem?.getCascadeStrength === 'function') {
      const intensity = this.cascadeSystem.getCascadeStrength(nodeId);
      if (Number.isFinite(intensity)) {
        return { intensity, phase: 0 };
      }
    }

    if (typeof this.cascadeSystem?.getCascadeAmplification === 'function') {
      const amplification = this.cascadeSystem.getCascadeAmplification(nodeId);
      const ampIntensity = amplification?.intensity ?? amplification?.strength ?? amplification?.cascadeStrength;
      if (Number.isFinite(ampIntensity)) {
        return {
          intensity: ampIntensity,
          phase: Number.isFinite(amplification?.phase) ? amplification.phase : 0
        };
      }
    }

    if (this.harmonicHubSystem?.hubs?.has?.(nodeId)) {
      const hub = this.harmonicHubSystem.hubs.get(nodeId);
      return {
        intensity: this._clamp01(hub?.synergy ?? hub?.harmony ?? 0),
        phase: this._clamp01(hub?.harmonicPhase ?? 0),
      };
    }

    const node = this._findNodeById(nodeId);
    if (node?.userData) {
      const intensity = node.userData.cascadeIntensity ?? node.userData.cascadeStrength;
      const phase = node.userData.cascadePhase;
      if (Number.isFinite(intensity) || Number.isFinite(phase)) {
        return {
          intensity: Number.isFinite(intensity) ? intensity : 0,
          phase: Number.isFinite(phase) ? phase : 0
        };
      }
    }

    const hub = this.harmonicHubSystem?.hubs?.get?.(nodeId) ?? null;
    const hubIntensity = hub?.userData?.cascadeIntensity ?? hub?.userData?.cascadeStrength;
    const hubPhase = hub?.userData?.cascadePhase;
    if (Number.isFinite(hubIntensity) || Number.isFinite(hubPhase)) {
      return {
        intensity: Number.isFinite(hubIntensity) ? hubIntensity : 0,
        phase: Number.isFinite(hubPhase) ? hubPhase : 0
      };
    }

    return { intensity: 0, phase: 0 };
  }

  _findNodeById(nodeId) {
    const hub = this.harmonicHubSystem?.hubs?.get?.(nodeId) ?? null;
    if (hub) {
      return hub.primaryNode ?? hub.nodes?.[0] ?? hub;
    }

    const candidateSources = [
      this.cascadeSystem?.world?.nodes,
      this.harmonicHubSystem?.world?.nodes,
      this.linkResonanceSystem?.world?.nodes,
      globalThis?.game?.aiNodes?.nodes,
      globalThis?.aiNodes?.nodes
    ];

    for (const nodes of candidateSources) {
      if (!Array.isArray(nodes)) continue;
      for (const node of nodes) {
        const candidateId = node?.id ?? node?.userData?.nodeId ?? node?.userData?.id;
        if (candidateId === nodeId) return node;
      }
    }

    return null;
  }

  /**
   * Apply wave effects to link and aura systems
   * @private
   */
  _applyWaveEffects(deltaTime) {
    if (!this.harmonicHubSystem) {
      return;
    }
    
    // Phase 1: Update active rings
    this._updateWavefrontRipples();

    // Phase 3: Wavefront particles
    if (this.config.wavefrontParticlesEnabled) {
      this._updateWavefrontParticles(deltaTime);
    }

    // Phase 3: Resonance sparks
    if (this.config.resonanceSparksEnabled) {
      this._updateResonanceSparks(deltaTime);
    }

    // Phase 2: Update resonance beams
    if (this.config.linkResonanceBeamEnabled) {
      this._updateLinkResonanceBeams();
    }

    // Phase 5: Update lighting flash
    if (this.config.dynamicLightingEnabled) {
      this._updateWaveLights(deltaTime);
    }

    // Phase 3: Echo trail particles
    if (this.config.echoTrailParticlesEnabled) {
      this._updateEchoTrails(deltaTime);
    }

    // Phase 3: Interference particles
    if (this.config.interferenceParticlesEnabled) {
      this._updateInterferenceParticles(deltaTime);
    }

    // Phase 1: Apply aura tightening pulse
    if (this.config.auraTighteningPulseEnabled) {
      this._applyAuraTighteningPulse();
    }

    for (const hub of this.harmonicHubSystem.hubs?.values?.() ?? []) {
      if (!hub) continue;
      hub._waveInfluence = 0;
      hub._waveNoiseReduction = 0;

      const waveNodes = Array.isArray(hub.nodes) && hub.nodes.length > 0
        ? hub.nodes
        : (hub.primaryNode ? [hub.primaryNode] : []);

      for (const waveNode of waveNodes) {
        if (!waveNode) continue;
        waveNode._waveInfluence = 0;
        waveNode._waveNoiseReduction = 0;
      }
    }
    
    const hubWaveContributions = new Map();

    // Apply wave influence to each active wave path
    for (const [waveKey, waveData] of this.activeWaves.entries()) {
      // Apply temporal phase compression to link
      // This creates the subtle "pressure" effect along the link
      if (this.linkResonanceSystem && this.linkResonanceSystem.linkMetadata) {
        if (!this.linkResonanceSystem.linkMetadata.has(waveKey)) {
          this.linkResonanceSystem.linkMetadata.set(waveKey, {});
        }
        const metadata = this.linkResonanceSystem.linkMetadata.get(waveKey);
        
        // Compression increases as wave influence increases
        // Creates a traveling "pressure" effect
        metadata._wavePhaseCompression = waveData.influence * this.config.linkPhaseCompression;
        metadata._wavePhase = waveData.wavePhase;
      }
      
      const registerHubContribution = (hubId) => {
        if (!hubId) return;
        const entry = hubWaveContributions.get(hubId) || {
          totalInfluence: 0,
          phaseX: 0,
          phaseY: 0,
          count: 0
        };
        entry.totalInfluence += waveData.influence;
        const angle = (waveData.wavePhase || 0) * Math.PI * 2;
        entry.phaseX += Math.cos(angle) * waveData.influence;
        entry.phaseY += Math.sin(angle) * waveData.influence;
        entry.count += 1;
        hubWaveContributions.set(hubId, entry);
      };

      const registerWaveEcho = (hubId) => {
        const hub = this.harmonicHubSystem.hubs?.get(hubId);
        if (!hub) return;
        this._registerHubEcho(hub, waveData.influence);
      };

      registerHubContribution(waveData.hubAId);
      registerHubContribution(waveData.hubBId);
      registerWaveEcho(waveData.hubAId);
      registerWaveEcho(waveData.hubBId);

      // Apply wave tightening to hub auras
      // Auras briefly compress as wave passes through
      const hubA = this.harmonicHubSystem.hubs?.get(waveData.hubAId);
      const hubB = this.harmonicHubSystem.hubs?.get(waveData.hubBId);
      
      if (hubA) {
        hubA._waveInfluence = (hubA._waveInfluence ?? 0) + waveData.influence;
        hubA._waveNoiseReduction = waveData.influence * this.config.auraNoiseReduction;

        const nodeAList = Array.isArray(hubA.nodes) && hubA.nodes.length > 0
          ? hubA.nodes
          : (hubA.primaryNode ? [hubA.primaryNode] : []);
        for (const nodeA of nodeAList) {
          if (!nodeA) continue;
          nodeA._waveInfluence = (nodeA._waveInfluence ?? 0) + waveData.influence;
          nodeA._waveNoiseReduction = waveData.influence * this.config.auraNoiseReduction;
        }
      }
      
      if (hubB) {
        hubB._waveInfluence = (hubB._waveInfluence ?? 0) + waveData.influence;
        hubB._waveNoiseReduction = waveData.influence * this.config.auraNoiseReduction;

        const nodeBList = Array.isArray(hubB.nodes) && hubB.nodes.length > 0
          ? hubB.nodes
          : (hubB.primaryNode ? [hubB.primaryNode] : []);
        for (const nodeB of nodeBList) {
          if (!nodeB) continue;
          nodeB._waveInfluence = (nodeB._waveInfluence ?? 0) + waveData.influence;
          nodeB._waveNoiseReduction = waveData.influence * this.config.auraNoiseReduction;
        }
      }
    }

    if (this.config.interferenceEnabled) {
      this._applyWaveInterference(hubWaveContributions);
    }

    if (this.config.echoTrailEnabled) {
      this._updateWaveEchoTrails();
    }

    if (this.config.hubGlowModulationEnabled) {
      this._applyHubGlowModulation();
    }

    if (this.config.waveStrengthIndicatorEnabled) {
      this._applyWaveStrengthIndicator();
    }
  }

  _allocateWavefrontParticle() {
    if (!this._freeWavefrontParticleIndices || this._freeWavefrontParticleIndices.length === 0) return null;
    const index = this._freeWavefrontParticleIndices.pop();
    const particle = this._wavefrontParticlePool[index];
    if (!particle) return null;
    particle.active = true;
    particle.points.visible = true;
    return particle;
  }

  _releaseWavefrontParticle(particle) {
    if (!particle || particle.index === undefined) return;
    particle.active = false;
    particle.points.visible = false;
    particle.life = 0;
    particle.ringEntry = null;
    this._freeWavefrontParticleIndices.push(particle.index);
  }

  _spawnWavefrontParticles(activeRing) {
    if (!activeRing?.ringEntry || !this.config.wavefrontParticlesEnabled) return;
    const available = Math.min(this.config.wavefrontParticlesPerRing, this._freeWavefrontParticleIndices.length);
    for (let i = 0; i < available; i++) {
      const particle = this._allocateWavefrontParticle();
      if (!particle) break;
      const ringRadius = activeRing.ringEntry.mesh.scale.x;
      particle.life = 0;
      particle.maxLife = activeRing.tier === 'outer' ? this.config.outerRingLifetime : activeRing.tier === 'middle' ? this.config.middleRingLifetime : this.config.innerRingLifetime;
      particle.angle = Math.random() * Math.PI * 2;
      particle.speed = THREE.MathUtils.lerp(this.config.wavefrontParticleSpeedMin, this.config.wavefrontParticleSpeedMax, Math.random()) * (0.6 + activeRing.influence * 0.8);
      particle.radius = ringRadius;
      particle.ringEntry = activeRing.ringEntry;
      particle.tier = activeRing.tier;
      particle.visible = true;
      particle.points.material.size = THREE.MathUtils.lerp(this.config.wavefrontParticleSizeMin, this.config.wavefrontParticleSizeMax, Math.random());
      particle.points.material.opacity = 1.0;
      particle.points.material.color.copy(activeRing.tier === 'outer' ? new THREE.Color(0x88bbff) : activeRing.tier === 'middle' ? new THREE.Color(0x99ffff) : new THREE.Color(0xffffff));
      this._activeWavefrontParticles.push(particle);
    }
  }

  _updateWavefrontParticles(deltaTime) {
    if (!this._activeWavefrontParticles) return;
    const toRelease = [];
    for (let i = 0; i < this._activeWavefrontParticles.length; i++) {
      const particle = this._activeWavefrontParticles[i];
      if (!particle || !particle.ringEntry || !particle.ringEntry.active) {
        toRelease.push(i);
        continue;
      }
      particle.life += deltaTime;
      if (particle.life >= particle.maxLife) {
        toRelease.push(i);
        continue;
      }
      particle.angle += particle.speed * deltaTime;
      const radius = particle.ringEntry.mesh.scale.x;
      const hubPos = particle.ringEntry.mesh.position;
      const x = Math.cos(particle.angle) * radius;
      const z = Math.sin(particle.angle) * radius;
      const y = hubPos.y + (particle.tier === 'inner' ? 0.0 : 0.02);
      const posAttr = particle.geometry.attributes.position;
      posAttr.setXYZ(0, hubPos.x + x, y, hubPos.z + z);
      posAttr.needsUpdate = true;
      const alpha = 1.0 - particle.life / particle.maxLife;
      particle.points.material.opacity = alpha;
      particle.points.material.size = THREE.MathUtils.lerp(this.config.wavefrontParticleSizeMax, this.config.wavefrontParticleSizeMin, particle.life / particle.maxLife);
    }
    for (let i = toRelease.length - 1; i >= 0; i--) {
      const index = toRelease[i];
      this._releaseWavefrontParticle(this._activeWavefrontParticles[index]);
      this._activeWavefrontParticles.splice(index, 1);
    }
  }

  _allocateResonanceSpark() {
    if (!this._freeResonanceSparkIndices || this._freeResonanceSparkIndices.length === 0) return null;
    const index = this._freeResonanceSparkIndices.pop();
    const spark = this._resonanceSparkPool[index];
    if (!spark) return null;
    spark.active = true;
    spark.points.visible = true;
    return spark;
  }

  _releaseResonanceSpark(spark) {
    if (!spark || spark.index === undefined) return;
    spark.active = false;
    spark.points.visible = false;
    spark.life = 0;
    spark.velocity.set(0, 0, 0);
    this._freeResonanceSparkIndices.push(spark.index);
  }

  _spawnResonanceSparks(hubPosition, intensity) {
    if (!this.config.resonanceSparksEnabled) return;
    const count = Math.min(this.config.resonanceSparkCountPerWave, this._freeResonanceSparkIndices.length);
    for (let i = 0; i < count; i++) {
      const spark = this._allocateResonanceSpark();
      if (!spark) break;
      spark.life = 0;
      spark.maxLife = THREE.MathUtils.lerp(this.config.resonanceSparkLifetimeMin, this.config.resonanceSparkLifetimeMax, Math.random());
      const theta = Math.random() * Math.PI * 2;
      const radial = 0.1 + Math.random() * 0.15;
      spark.points.material.size = this.config.resonanceSparkSize * THREE.MathUtils.lerp(0.8, 1.2, Math.random());
      spark.points.material.opacity = 1.0;
      spark.points.material.color.copy(new THREE.Color(0xffffff));
      spark.color.copy(hubPosition ? new THREE.Color(0xffffff) : new THREE.Color(0xffffff));
      spark.velocity.set(Math.cos(theta), 0.1, Math.sin(theta)).multiplyScalar(THREE.MathUtils.lerp(1.2, 1.8, intensity));
      spark.velocity.y -= this.config.resonanceSparkGravity * 0.5;
      spark.geometry.attributes.position.setXYZ(0, hubPosition.x + Math.cos(theta) * radial, hubPosition.y + 0.05, hubPosition.z + Math.sin(theta) * radial);
      spark.geometry.attributes.position.needsUpdate = true;
      this._activeResonanceSparks.push(spark);
    }
  }

  _updateResonanceSparks(deltaTime) {
    const toRelease = [];
    for (let i = 0; i < this._activeResonanceSparks.length; i++) {
      const spark = this._activeResonanceSparks[i];
      if (!spark || !spark.active) {
        toRelease.push(i);
        continue;
      }
      spark.life += deltaTime;
      if (spark.life >= spark.maxLife) {
        toRelease.push(i);
        continue;
      }
      spark.velocity.y -= this.config.resonanceSparkGravity * deltaTime;
      const posAttr = spark.geometry.attributes.position;
      let x = posAttr.getX(0) + spark.velocity.x * deltaTime;
      let y = posAttr.getY(0) + spark.velocity.y * deltaTime;
      let z = posAttr.getZ(0) + spark.velocity.z * deltaTime;
      posAttr.setXYZ(0, x, y, z);
      posAttr.needsUpdate = true;
      const alpha = 1.0 - spark.life / spark.maxLife;
      const bloomAlpha = Math.min(1.0, alpha * this.config.resonanceSparkBloomStrength);
      spark.points.material.opacity = bloomAlpha * 0.85;
      spark.points.material.size = this.config.resonanceSparkSize * (1.0 + alpha * 0.35);
      spark.points.material.color.setHSL(0.55 + 0.2 * alpha, 1.0, 0.7 + alpha * 0.15);
    }
    for (let i = toRelease.length - 1; i >= 0; i--) {
      const index = toRelease[i];
      this._releaseResonanceSpark(this._activeResonanceSparks[index]);
      this._activeResonanceSparks.splice(index, 1);
    }
  }

  _allocateEchoTrail() {
    if (!this._freeEchoTrailIndices || this._freeEchoTrailIndices.length === 0) return null;
    const index = this._freeEchoTrailIndices.pop();
    const trail = this._echoTrailPool[index];
    if (!trail) return null;
    trail.active = true;
    trail.line.visible = true;
    return trail;
  }

  _releaseEchoTrail(trail) {
    if (!trail || trail.index === undefined) return;
    trail.active = false;
    trail.line.visible = false;
    trail.life = 0;
    trail.speed = 0;
    trail.drift = 0;
    this._freeEchoTrailIndices.push(trail.index);
  }

  _spawnEchoTrail(beamEntry) {
    if (!this.config.echoTrailParticlesEnabled || !beamEntry?.line) return;
    const trail = this._allocateEchoTrail();
    if (!trail) return;
    trail.life = 0;
    trail.maxLife = THREE.MathUtils.lerp(this.config.echoTrailLifetimeMin, this.config.echoTrailLifetimeMax, Math.random());
    trail.speed = THREE.MathUtils.lerp(0.2, 0.35, Math.random());
    trail.drift = (Math.random() - 0.5) * this.config.echoTrailParticleDriftSpeed;

    const start = new THREE.Vector3();
    const end = new THREE.Vector3();
    beamEntry.line.localToWorld(start.set(-0.5, 0, 0));
    beamEntry.line.localToWorld(end.set(0.5, 0, 0));
    trail.direction = new THREE.Vector3().subVectors(end, start).normalize();
    trail.currentT = Math.random();
    trail.startPos = start;
    trail.length = start.distanceTo(end);

    const positions = trail.geometry.attributes.position;
    for (let s = 0; s < positions.count; s++) {
      const t = trail.currentT - (s / (positions.count - 1)) * 0.1;
      const point = new THREE.Vector3().lerpVectors(start, end, THREE.MathUtils.clamp(t, 0, 1));
      positions.setXYZ(s, point.x, point.y, point.z);
    }
    positions.needsUpdate = true;
    trail.line.material.opacity = 1.0;
    this._activeEchoTrails.push(trail);
  }

  _updateEchoTrails(deltaTime) {
    const toRelease = [];
    for (let i = 0; i < this._activeEchoTrails.length; i++) {
      const trail = this._activeEchoTrails[i];
      if (!trail || !trail.active) {
        toRelease.push(i);
        continue;
      }
      trail.life += deltaTime;
      if (trail.life >= trail.maxLife) {
        toRelease.push(i);
        continue;
      }
      trail.currentT += trail.speed * deltaTime * 0.5;
      const positions = trail.geometry.attributes.position;
      for (let s = 0; s < positions.count; s++) {
        const t = trail.currentT - (s / (positions.count - 1)) * 0.08;
        const point = new THREE.Vector3().lerpVectors(trail.startPos, trail.startPos.clone().add(trail.direction.clone().multiplyScalar(trail.length)), THREE.MathUtils.clamp(t, 0, 1));
        point.x += Math.sin(t * Math.PI * 2 + s) * trail.drift;
        point.z += Math.cos(t * Math.PI * 2 + s) * trail.drift;
        positions.setXYZ(s, point.x, point.y, point.z);
      }
      positions.needsUpdate = true;
      trail.line.material.opacity = (1.0 - trail.life / trail.maxLife) * this.config.echoTrailFade;
    }
    for (let i = toRelease.length - 1; i >= 0; i--) {
      const index = toRelease[i];
      this._releaseEchoTrail(this._activeEchoTrails[index]);
      this._activeEchoTrails.splice(index, 1);
    }
  }

  _allocateInterferenceParticle() {
    if (!this._freeInterferenceParticleIndices || this._freeInterferenceParticleIndices.length === 0) return null;
    const index = this._freeInterferenceParticleIndices.pop();
    const particle = this._interferenceParticlePool[index];
    if (!particle) return null;
    particle.active = true;
    particle.points.visible = true;
    return particle;
  }

  _releaseInterferenceParticle(particle) {
    if (!particle || particle.index === undefined) return;
    particle.active = false;
    particle.points.visible = false;
    particle.life = 0;
    particle.hubId = null;
    this._freeInterferenceParticleIndices.push(particle.index);
  }

  _spawnInterferenceParticle(hubId, hubPosition, constructive) {
    if (!hubPosition || !this.config.interferenceParticlesEnabled) return;
    const particle = this._allocateInterferenceParticle();
    if (!particle) return;
    particle.life = 0;
    particle.maxLife = 1.0;
    particle.hubId = hubId;
    particle.radius = this.config.interferenceRadius * THREE.MathUtils.lerp(0.8, 1.2, Math.random());
    particle.angle = Math.random() * Math.PI * 2;
    particle.speed = this.config.interferenceOrbitalSpeed * THREE.MathUtils.lerp(0.8, 1.2, Math.random());
    particle.constructive = constructive;
    particle.points.material.opacity = 1.0;
    particle.points.material.color.copy(constructive ? this.config.interferenceConstructiveColor : this.config.interferenceDestructiveColor);
    particle.points.material.size = THREE.MathUtils.lerp(0.08, 0.12, Math.random());
    particle.points.geometry.attributes.position.setXYZ(0, hubPosition.x + Math.cos(particle.angle) * particle.radius, hubPosition.y + 0.1, hubPosition.z + Math.sin(particle.angle) * particle.radius);
    particle.points.geometry.attributes.position.needsUpdate = true;
    this._activeInterferenceParticles.push(particle);
  }

  _updateInterferenceParticles(deltaTime) {
    const hubCounts = new Map();
    for (const waveData of this.activeWaves.values()) {
      if (waveData.hubAId) hubCounts.set(waveData.hubAId, (hubCounts.get(waveData.hubAId) || 0) + 1);
      if (waveData.hubBId) hubCounts.set(waveData.hubBId, (hubCounts.get(waveData.hubBId) || 0) + 1);
    }

    // Spawn new interference nodes for hubs with 2+ waves
    for (const [hubId, count] of hubCounts.entries()) {
      if (count < this.config.interferenceMinActiveWaves) continue;
      const hub = this.harmonicHubSystem.hubs?.get(hubId);
      const hubPosition = this._resolveHubWorldPosition(hub);
      if (!hubPosition) continue;
      const constructive = count > 2;
      const spawnCount = Math.min(2, this._freeInterferenceParticleIndices.length);
      for (let i = 0; i < spawnCount; i++) {
        this._spawnInterferenceParticle(hubId, hubPosition, constructive);
      }
    }

    const toRelease = [];
    for (let i = 0; i < this._activeInterferenceParticles.length; i++) {
      const particle = this._activeInterferenceParticles[i];
      if (!particle || !particle.active) {
        toRelease.push(i);
        continue;
      }
      particle.life += deltaTime;
      if (particle.life >= particle.maxLife) {
        toRelease.push(i);
        continue;
      }
      particle.angle += particle.speed * deltaTime;
      const hub = this.harmonicHubSystem.hubs?.get(particle.hubId);
      const hubPosition = this._resolveHubWorldPosition(hub);
      if (!hubPosition) {
        toRelease.push(i);
        continue;
      }
      const x = hubPosition.x + Math.cos(particle.angle) * particle.radius;
      const z = hubPosition.z + Math.sin(particle.angle) * particle.radius;
      const y = hubPosition.y + 0.08 + Math.sin(particle.life * 10.0) * 0.02;
      particle.geometry.attributes.position.setXYZ(0, x, y, z);
      particle.geometry.attributes.position.needsUpdate = true;
      particle.points.material.opacity = 1.0 - (particle.life / particle.maxLife);
    }
    for (let i = toRelease.length - 1; i >= 0; i--) {
      const index = toRelease[i];
      this._releaseInterferenceParticle(this._activeInterferenceParticles[index]);
      this._activeInterferenceParticles.splice(index, 1);
    }
  }

  /**
   * Phase 1: Update wavefront ring ripples with EPIC shader parameters
   * Phase 2: Three-tier parallax effect with different speeds, colors, and lifetimes
   */
  _updateWavefrontRipples() {
    if (!this.config.wavefrontRipplesEnabled) return;
    if (!this._ringGeometryPool) return;

    // Update existing active rings
    for (let i = this._activeRings.length - 1; i >= 0; i--) {
      const activeRing = this._activeRings[i];
      
      // Get tier-specific parameters for parallax
      let ringSpeed, ringLifetime, ringOpacity, ringColor;
      if (activeRing.tier === 'inner') {
        ringSpeed = this.config.innerRingSpeed;
        ringLifetime = this.config.innerRingLifetime;
        ringOpacity = this.config.innerRingOpacity;
        ringColor = this.config.innerRingColor;
      } else if (activeRing.tier === 'middle') {
        ringSpeed = this.config.middleRingSpeed;
        ringLifetime = this.config.middleRingLifetime;
        ringOpacity = this.config.middleRingOpacity;
        ringColor = this.config.middleRingColor;
      } else {
        ringSpeed = this.config.outerRingSpeed;
        ringLifetime = this.config.outerRingLifetime;
        ringOpacity = this.config.outerRingOpacity;
        ringColor = this.config.outerRingColor;
      }
      
      const lodLevel = this._getLODLevel(activeRing.ringEntry.mesh.position);
      if (lodLevel === 'far' && activeRing.tier !== 'outer') {
        this._releaseRing(activeRing.ringEntry);
        this._activeRings.splice(i, 1);
        continue;
      }
      if (lodLevel === 'mid' && activeRing.tier === 'inner') {
        this._releaseRing(activeRing.ringEntry);
        this._activeRings.splice(i, 1);
        continue;
      }
      const detailFactor = lodLevel === 'near' ? 1.0 : lodLevel === 'mid' ? 0.65 : 0.25;
      
      const age = this.globalWaveTime - activeRing.startTime;
      const maxAge = this.config.wavefrontRingMaxRadius / (this.config.wavefrontRingSpeed * ringSpeed);
      const progress = age / maxAge;

      if (progress >= 1.0) {
        // Ring expired - release back to pool
        this._releaseRing(activeRing.ringEntry);
        this._activeRings.splice(i, 1);
        continue;
      }

      // Elastic expansion + damped oscillation + breathing scale
      const baseRadius = this.config.wavefrontRingMinRadius + progress * (this.config.wavefrontRingMaxRadius - this.config.wavefrontRingMinRadius);
      const burst = Math.sin(progress * Math.PI * 3.0) * Math.exp(-progress * 3.0) * 0.18;
      const overshoot = 1.0 + burst * (activeRing.tier === 'inner' ? 1.2 : 0.8);
      // Breathing: subtle sinusoidal scale oscillation for organic feel
      const breathe = 1.0 + Math.sin(this.globalWaveTime * 2.5 + activeRing.wavePhase * Math.PI * 2) * 0.025 * (1 - progress);
      const radius = baseRadius * (1.0 + (overshoot - 1.0) * 0.6) * breathe;
      activeRing.ringEntry.mesh.scale.setScalar(radius);
      
      // Slow ring rotation for visual richness (tier-dependent speed)
      const rotSpeed = activeRing.tier === 'inner' ? 0.4 : activeRing.tier === 'middle' ? -0.25 : 0.15;
      activeRing.ringEntry.mesh.rotation.z += rotSpeed * 0.016; // ~60fps normalized

      // Parallax fade-out: rings fade at different rates
      // Inner rings fade quickly, outer rings fade slowly
      let fadeProgress;
      if (activeRing.tier === 'inner') {
        fadeProgress = progress < 0.2 ? progress / 0.2 : 1 - (progress - 0.2) / 0.8;
      } else if (activeRing.tier === 'middle') {
        fadeProgress = progress < 0.25 ? progress / 0.25 : 1 - (progress - 0.25) / 0.75;
      } else {
        fadeProgress = progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7;
      }
      
      const opacity = fadeProgress * activeRing.influence * ringOpacity * detailFactor;
      
      const hubA = this.harmonicHubSystem?.hubs?.get(activeRing.hubAId);
      const hubB = this.harmonicHubSystem?.hubs?.get(activeRing.hubBId);
      const harmony = Math.max(0, Math.min(1, (this._readHubWaveState(hubA).harmony + this._readHubWaveState(hubB).harmony) * 0.5));
      const shiftedColor = this._scratchColor.copy(ringColor);
      // Smooth color transitions using smoothstep instead of hard thresholds
      if (harmony > 0.5) {
        const harmonyT = THREE.MathUtils.smoothstep(harmony, 0.5, 1.0);
        shiftedColor.lerp(new THREE.Color(0xffcc66), harmonyT * 0.6);
      }
      if (activeRing.influence > 0.6) {
        const infT = THREE.MathUtils.smoothstep(activeRing.influence, 0.6, 1.0);
        shiftedColor.lerp(new THREE.Color(0xffffff), infT * 0.4);
      }
      if (progress > 0.55) {
        const progT = THREE.MathUtils.smoothstep(progress, 0.55, 1.0);
        shiftedColor.lerp(new THREE.Color(0x4466ff), progT * 0.5);
      }

      // EPIC shader uniforms
      const uniforms = activeRing.ringEntry.mesh.material.uniforms;
      const distanceFade = this._computeCameraDistanceFade(activeRing.ringEntry.mesh.position);
      const bloomParams = this._getRingBloomParams(activeRing.tier, activeRing.influence);
      uniforms.uOpacity.value = opacity;
      uniforms.uTime.value = this.globalWaveTime;
      uniforms.uWavePhase.value = (this.globalWaveTime * 0.5 * ringSpeed + activeRing.wavePhase) % 1.0;
      uniforms.uIntensity.value = activeRing.influence;
      uniforms.uInterference.value = 0.3 * Math.sin(this.globalWaveTime * 3.0 + activeRing.wavePhase * Math.PI * 2) * 0.5 + 0.5;
      uniforms.uColor.value.copy(shiftedColor);
      uniforms.uBloomStrength.value = bloomParams.strength * distanceFade;
      uniforms.uBloomThreshold.value = bloomParams.threshold;
      uniforms.uChromaticShift.value = this.config.chromaticAberrationEnabled ? THREE.MathUtils.lerp(this.config.chromaticAberrationMin, this.config.chromaticAberrationMax, activeRing.influence) * distanceFade * 0.5 : 0.0;
      uniforms.uDistortionStrength.value = this.config.distortionEnabled ? THREE.MathUtils.lerp(this.config.distortionStrengthMin, this.config.distortionStrengthMax, activeRing.influence) * distanceFade : 0.0;
    }

    // Spawn new rings for active waves - THREE TIERS for parallax
    if (this.activeWaves.size > 0 && this._activeRings.length < this._ringGeometryPool.length) {
      for (const [waveKey, waveData] of this.activeWaves.entries()) {
        // Only spawn rings when wave phase crosses threshold (periodic spawn)
        const phaseInCycle = (this.globalWaveTime * this.config.wavefrontRingSpeed) % 1.0;
        const shouldSpawn = phaseInCycle < 0.08 && waveData.influence > 0.25;

        if (!shouldSpawn) continue;

        // Spawn ring at hub A position
        const hubA = this.harmonicHubSystem?.hubs?.get(waveData.hubAId);
        if (!hubA) continue;

        const hubPosition = this._resolveHubWorldPosition(hubA);
        if (!hubPosition) continue;

        // Try to spawn all three tiers for parallax effect
        const tiers = ['inner', 'middle', 'outer'];
        const spawnedRings = [];
        for (const tier of tiers) {
          const ringEntry = this._allocateRing(tier);
          if (!ringEntry) continue;

          ringEntry.mesh.position.copy(hubPosition);
          ringEntry.mesh.scale.setScalar(this.config.wavefrontRingMinRadius);

          // Stagger spawn times for parallax (inner first, then middle, then outer)
          let spawnDelay = 0;
          if (tier === 'inner') {
            spawnDelay = 0;
          } else if (tier === 'middle') {
            spawnDelay = 0.15; // 150ms delay
          } else {
            spawnDelay = 0.30; // 300ms delay
          }

          const ringData = {
            ringEntry,
            waveKey,
            startTime: this.globalWaveTime - spawnDelay, // Negative start time for staggered spawn
            influence: waveData.influence,
            wavePhase: waveData.wavePhase,
            hubAId: waveData.hubAId,
            hubBId: waveData.hubBId,
            tier: tier
          };
          this._activeRings.push(ringData);
          spawnedRings.push(ringData);
        }

        if (this.config.wavefrontParticlesEnabled) {
          for (const ringData of spawnedRings) {
            this._spawnWavefrontParticles(ringData);
          }
        }

        if (this.config.resonanceSparksEnabled) {
          this._spawnResonanceSparks(hubPosition, waveData.influence);
          const hubB = this.harmonicHubSystem?.hubs?.get(waveData.hubBId);
          const hubBPosition = this._resolveHubWorldPosition(hubB);
          if (hubBPosition) {
            this._spawnResonanceSparks(hubBPosition, waveData.influence);
          }
        }
      }
    }
  }

  /**
   * Phase 1: Apply aura tightening pulse to hubs under wave influence
   */
  _applyAuraTighteningPulse() {
    if (!this.harmonicHubSystem) return;

    // Collect total wave influence per hub
    const hubInfluenceMap = new Map();
    for (const waveData of this.activeWaves.values()) {
      const a = hubInfluenceMap.get(waveData.hubAId) ?? 0;
      const b = hubInfluenceMap.get(waveData.hubBId) ?? 0;
      hubInfluenceMap.set(waveData.hubAId, a + waveData.influence);
      hubInfluenceMap.set(waveData.hubBId, b + waveData.influence);
    }

    // Apply tightening pulse to affected hubs
    for (const [hubId, totalInfluence] of hubInfluenceMap.entries()) {
      const hub = this.harmonicHubSystem.hubs?.get(hubId);
      if (!hub) continue;

      // Tightening follows wave oscillation
      const pulse = Math.sin(this.globalWaveTime * this.config.auraPulseSpeed) * 0.5 + 0.5;
      const tightening = pulse * this.config.auraTighteningAmount * Math.min(1, totalInfluence);

      // Apply to hub aura scale + subtle breathing pulse
      if (hub.aura) {
        const baseScale = hub._baseAuraScale ?? hub.aura.scale.x ?? 1;
        if (!hub._baseAuraScale) hub._baseAuraScale = baseScale;
        const breathPulse = 1.0 + Math.sin(this.globalWaveTime * 1.8 + totalInfluence * Math.PI) * 0.015;
        hub.aura.scale.setScalar(baseScale * (1 - tightening) * breathPulse);
      }

      // Apply to node scale (subtle)
      const primaryNode = hub.primaryNode ?? hub.nodes?.[0];
      if (primaryNode) {
        const baseNodeScale = primaryNode._baseNodeScale ?? primaryNode.scale.x ?? 1;
        if (!primaryNode._baseNodeScale) primaryNode._baseNodeScale = baseNodeScale;
        const nodeTightening = tightening * 0.3; // Even more subtle
        primaryNode.scale.setScalar(baseNodeScale * (1 - nodeTightening));
      }
    }
  }

  _allocateBeam() {
    if (!this._freeBeamIndices || this._freeBeamIndices.length === 0) return null;
    const index = this._freeBeamIndices.pop();
    const beamEntry = this._beamGeometryPool[index];
    if (!beamEntry) return null;

    beamEntry.active = true;
    beamEntry.line.visible = true;
    return beamEntry;
  }

  _releaseBeam(beamEntry) {
    if (!beamEntry) return;
    beamEntry.active = false;
    beamEntry.line.visible = false;
    if (beamEntry.index >= 0) {
      this._freeBeamIndices.push(beamEntry.index);
    }
  }

  _updateLinkResonanceBeams() {
    if (!this.config.linkResonanceBeamEnabled) return;
    if (!this._beamGeometryPool || this._beamGeometryPool.length === 0) return;

    // Release any existing beam entries; we reassign per frame
    for (const beamEntry of this._activeBeams) {
      this._releaseBeam(beamEntry);
    }
    this._activeBeams.length = 0;

    let usedBeamPairs = 0;
    const layersPerBeam = 3; // Core, Glow, Aura
    const maxBeamPairs = Math.floor(this._beamGeometryPool.length / layersPerBeam);

    for (const waveData of this.activeWaves.values()) {
      if (usedBeamPairs >= maxBeamPairs) break;
      if (waveData.influence <= 0.15) continue;

      const hubA = this.harmonicHubSystem.hubs?.get(waveData.hubAId);
      const hubB = this.harmonicHubSystem.hubs?.get(waveData.hubBId);
      if (!hubA || !hubB) continue;

      const posA = this._resolveHubWorldPosition(hubA);
      const posB = this._resolveHubWorldPosition(hubB);
      if (!posA || !posB) continue;

      const midpoint = new THREE.Vector3().addVectors(posA, posB).multiplyScalar(0.5);
      const lodLevel = this._getLODLevel(midpoint);
      if (lodLevel === 'far' && waveData.influence < 0.55) continue;
      const targetLayerCount = lodLevel === 'mid' ? 2 : layersPerBeam;

      // Allocate beam layers for this wave pair
      let allocatedLayers = 0;
      for (let layerIndex = 0; layerIndex < targetLayerCount; layerIndex++) {
        const beamEntry = this._allocateBeam();
        if (!beamEntry) break;
        
        // Position and orient the beam (CylinderGeometry)
        const direction = new THREE.Vector3().subVectors(posB, posA);
        const beamLength = direction.length();
        beamEntry.line.scale.set(1, beamLength, 1);
        
        // Position at midpoint
        const beamMidpoint = new THREE.Vector3().addVectors(posA, posB).multiplyScalar(0.5);
        beamEntry.line.position.copy(beamMidpoint);
        
        // Orient to look at target
        beamEntry.line.lookAt(posB);
        
        // Layer-specific parameters
        let pulseSpeed, baseOpacity;
        if (layerIndex === 0) {
          // Core Beam (hot)
          pulseSpeed = this.config.coreBeamPulseSpeed;
          baseOpacity = this.config.coreBeamOpacity;
        } else if (layerIndex === 1) {
          // Glow Layer
          pulseSpeed = this.config.glowLayerPulseSpeed;
          baseOpacity = this.config.glowLayerOpacity;
        } else {
          // Aura Layer
          pulseSpeed = this.config.auraLayerPulseSpeed;
          baseOpacity = this.config.auraLayerOpacity;
        }
        
        // EPIC shader uniforms
        const uniforms = beamEntry.line.material.uniforms;
        const distanceFade = this._computeCameraDistanceFade(midpoint);
        const bloomParams = this._getBeamBloomParams(layerIndex, waveData.influence);
        
        // Pulse traveling phase (layer-specific speed)
        const phasePulse = Math.sin(this.globalWaveTime * pulseSpeed + waveData.wavePhase * Math.PI * 2) * 0.5 + 0.5;
        const opacity = Math.min(1.0, baseOpacity * waveData.influence * (0.6 + 0.4 * phasePulse));
        uniforms.uOpacity.value = opacity;
        uniforms.uTime.value = this.globalWaveTime;
        uniforms.uPulsePhase.value = this.globalWaveTime * 0.8 * (pulseSpeed / 3.0) + waveData.wavePhase;
        uniforms.uBeamLength.value = beamLength;
        uniforms.uLayerType.value = layerIndex;
        uniforms.uBloomStrength.value = bloomParams.strength * distanceFade;
        uniforms.uBloomThreshold.value = bloomParams.threshold;
        uniforms.uChromaticShift.value = this.config.chromaticAberrationEnabled ? THREE.MathUtils.lerp(this.config.chromaticAberrationMin, this.config.chromaticAberrationMax, waveData.influence) * distanceFade : 0.0;
        
        // Harmony and corruption from hubs
        const hubAState = this._readHubWaveState(hubA);
        const hubBState = this._readHubWaveState(hubB);
        const avgHarmony = (hubAState.harmony + hubBState.harmony) * 0.5;
        const avgCorruption = (hubAState.corruption + hubBState.corruption) * 0.5;
        
        uniforms.uHarmony.value = avgHarmony;
        uniforms.uCorruption.value = avgCorruption;
        
        // Color based on harmony (smooth transition toward gold when high harmony)
        if (avgHarmony > 0.4) {
          const harmonyT = THREE.MathUtils.smoothstep(avgHarmony, 0.4, 1.0);
          const harmonyColor = new THREE.Color(0xffcc66); // Gold
          uniforms.uColor.value.copy(this.config.linkBeamColor).lerp(harmonyColor, harmonyT * 0.65);
        } else {
          uniforms.uColor.value.copy(this.config.linkBeamColor);
        }
        
        // Corruption tint: shift toward red-magenta when high corruption
        if (avgCorruption > 0.4) {
          const corruptionT = THREE.MathUtils.smoothstep(avgCorruption, 0.4, 1.0);
          uniforms.uColor.value.lerp(new THREE.Color(0xff4488), corruptionT * 0.35);
        }

        // Add a slight motion bias along the link direction using userData
        beamEntry.line.userData._wavePhase = waveData.wavePhase;
        beamEntry.line.renderOrder = VisualHierarchyRegistry?.getRenderOrder?.(VisualHierarchyRegistry.LAYER_LINK_CASCADE) ?? 13;
        if (this.config.echoTrailParticlesEnabled && Math.random() < 0.18) {
          this._spawnEchoTrail(beamEntry);
        }
        
        this._activeBeams.push(beamEntry);
        allocatedLayers++;
      }
      
      if (allocatedLayers === layersPerBeam) {
        usedBeamPairs++;
      }
    }
  }

  _applyHubGlowModulation() {
    if (!this.harmonicHubSystem) return;

    const hubInfluenceMap = new Map();
    for (const waveData of this.activeWaves.values()) {
      const a = hubInfluenceMap.get(waveData.hubAId) ?? 0;
      const b = hubInfluenceMap.get(waveData.hubBId) ?? 0;
      hubInfluenceMap.set(waveData.hubAId, a + waveData.influence);
      hubInfluenceMap.set(waveData.hubBId, b + waveData.influence);
    }

    for (const [hubId, totalInfluence] of hubInfluenceMap.entries()) {
      const hub = this.harmonicHubSystem.hubs?.get(hubId);
      if (!hub || !hub.aura || !hub.aura.material) continue;

      const hubState = this._readHubWaveState(hub);
      
      // EPIC: Wave passing modulation with multiple layers
      const glowPulse = Math.sin((this.globalWaveTime + totalInfluence) * Math.PI * 2) * 0.5 + 0.5;
      const glowStrength = Math.min(1, totalInfluence) * this.config.hubGlowIntensity * glowPulse;
      const material = hub.aura.material;

      // Emissive intensity modulation
      if (Number.isFinite(material.emissiveIntensity)) {
        if (hub._baseAuraEmissiveIntensity === undefined) {
          hub._baseAuraEmissiveIntensity = material.emissiveIntensity;
        }
        // EPIC: Elastic overshoot for intensity
        const elasticOvershoot = 1.0 + Math.sin(this.globalWaveTime * 4.0) * 0.15 * totalInfluence;
        material.emissiveIntensity = hub._baseAuraEmissiveIntensity * (1 + glowStrength) * elasticOvershoot;
      }

      // Color lerp with iridescent shift
      if (material.emissive && typeof material.emissive.copy === 'function') {
        if (!hub._baseAuraEmissiveColor) {
          hub._baseAuraEmissiveColor = material.emissive.clone();
        }
        // EPIC: Iridescent color shift based on harmony
        const iridescentShift = Math.sin(this.globalWaveTime * 2.0 + hubState.harmony * Math.PI) * 0.5 + 0.5;
        const colorMix = Math.min(1, totalInfluence * 0.5) * (0.7 + iridescentShift * 0.3);
        material.emissive.copy(hub._baseAuraEmissiveColor).lerp(this.config.hubGlowColor, colorMix);
      }

      // EPIC: Wave passing distortion (Fresnel modulation)
      if (material.uniforms?.uGlowIntensity) {
        const wavePhase = Math.sin(this.globalWaveTime * 3.0) * 0.5 + 0.5;
        material.uniforms.uGlowIntensity.value = Math.max(material.uniforms.uGlowIntensity.value, glowStrength * wavePhase);
      }
      
      // EPIC: Phase-aligned shimmer
      if (material.uniforms?.uWavePhase) {
        material.uniforms.uWavePhase.value = this.globalWaveTime;
      }
      
      // EPIC: Fresnel wave distortion
      if (material.uniforms?.uWaveDistortion) {
        material.uniforms.uWaveDistortion.value = totalInfluence * 0.3;
      }
    }
  }

  _applyWaveStrengthIndicator() {
    if (!this.harmonicHubSystem) return;

    const hubInfluenceMap = new Map();
    for (const waveData of this.activeWaves.values()) {
      const a = hubInfluenceMap.get(waveData.hubAId) ?? 0;
      const b = hubInfluenceMap.get(waveData.hubBId) ?? 0;
      hubInfluenceMap.set(waveData.hubAId, a + waveData.influence);
      hubInfluenceMap.set(waveData.hubBId, b + waveData.influence);
    }

    for (const [hubId, totalInfluence] of hubInfluenceMap.entries()) {
      const hub = this.harmonicHubSystem.hubs?.get(hubId);
      if (!hub || !hub.aura || !hub.aura.material) continue;

      const hubState = this._readHubWaveState(hub);
      const strength = Math.min(1, totalInfluence);
      
      // EPIC: Multi-phase indicator pulse (not just simple sine)
      const indicatorPhase = this.globalWaveTime * 1.5 + strength * Math.PI;
      const indicatorPulse = Math.sin(indicatorPhase) * 0.5 + 0.5;
      
      // Add secondary harmonic for more organic feel
      const harmonicPulse = Math.sin(indicatorPhase * 2.1) * 0.25 + 0.75;
      const combinedPulse = indicatorPulse * harmonicPulse;
      
      const indicatorIntensity = strength * 0.15 * combinedPulse;
      const material = hub.aura.material;

      // Opacity modulation
      if (Number.isFinite(material.opacity)) {
        const baseOpacity = hub._baseAuraOpacity ?? material.opacity;
        if (hub._baseAuraOpacity === undefined) hub._baseAuraOpacity = baseOpacity;
        
        // EPIC: Elastic breathing
        const elasticBreathing = 1.0 + Math.sin(this.globalWaveTime * 3.5) * 0.1 * strength;
        material.opacity = Math.max(0, Math.min(1, baseOpacity + indicatorIntensity * elasticBreathing));
      }

      // Aura color modulation
      if (material.uniforms?.uAuraColor && material.uniforms.uAuraColor.value) {
        if (!hub._baseAuraColor) {
          hub._baseAuraColor = material.uniforms.uAuraColor.value.clone();
        }
        
        // EPIC: Color shift based on harmony + influence
        const colorShift = strength * 0.3;
        const harmonyBoost = hubState.harmony > 0.6 ? (hubState.harmony - 0.6) / 0.4 : 0;
        const finalColorMix = colorShift * (1.0 + harmonyBoost * 0.5);
        
        material.uniforms.uAuraColor.value.copy(hub._baseAuraColor).lerp(this.config.hubGlowColor, finalColorMix);
      }
      
      // EPIC: Wave passing distortion effect
      if (material.uniforms?.uWavePassing) {
        material.uniforms.uWavePassing.value = strength;
      }
      
      // EPIC: Wave speed modulation
      if (material.uniforms?.uWaveSpeed) {
        material.uniforms.uWaveSpeed.value = 1.0 + strength * 0.5;
      }
    }
  }

  _applyWaveInterference(hubWaveContributions) {
    if (!this.harmonicHubSystem || !hubWaveContributions) return;

    for (const [hubId, data] of hubWaveContributions.entries()) {
      const hub = this.harmonicHubSystem.hubs?.get(hubId);
      if (!hub || !hub.aura || !hub.aura.material) continue;
      if (data.count < 2) continue;

      const material = hub.aura.material;
      const total = data.totalInfluence;
      if (total <= 0) continue;

      const amplitude = Math.sqrt(data.phaseX * data.phaseX + data.phaseY * data.phaseY);
      const coherence = Math.max(0, Math.min(1, amplitude / total));
      const constructive = coherence;
      const destructive = 1 - coherence;

      // EPIC: Enhanced interference with visual feedback
      const interferenceDelta = constructive * this.config.interferenceBoost - destructive * this.config.interferenceDampening;
      
      // Emissive intensity with interference modulation
      if (Number.isFinite(material.emissiveIntensity)) {
        if (hub._baseAuraEmissiveIntensity === undefined) {
          hub._baseAuraEmissiveIntensity = material.emissiveIntensity;
        }
        // EPIC: Constructive = bright and hot, Destructive = dim and cool
        const intensityMod = 1.0 + interferenceDelta * 2.0;
        material.emissiveIntensity = Math.max(0, hub._baseAuraEmissiveIntensity * intensityMod);
      }

      // EPIC: Color shift based on interference type
      if (material.uniforms?.uGlowIntensity) {
        material.uniforms.uGlowIntensity.value = Math.max(material.uniforms.uGlowIntensity.value, Math.max(0, interferenceDelta));
      }
      
      // EPIC: Visual coherence indicator (uniform for aura shader)
      if (material.uniforms?.uCoherence) {
        material.uniforms.uCoherence.value = coherence;
      }
      
      // EPIC: Interference pattern uniform
      if (material.uniforms?.uInterferencePattern) {
        material.uniforms.uInterferencePattern.value = constructive;
      }

      const echoStrength = Math.min(1, total) * coherence;
      this._registerHubEcho(hub, echoStrength);
    }
  }

  _registerHubEcho(hub, strength) {
    if (!hub || strength <= 0) return;
    const now = this.globalWaveTime;
    hub._waveEchoStrength = Math.max(hub._waveEchoStrength ?? 0, Math.min(1, strength));
    hub._waveEchoExpiry = now + this.config.echoTrailDuration;
  }

  _updateWaveEchoTrails() {
    if (!this.harmonicHubSystem) return;

    const now = this.globalWaveTime;
    for (const hub of this.harmonicHubSystem.hubs?.values?.() ?? []) {
      if (!hub || !hub.aura || !hub.aura.material) continue;
      const material = hub.aura.material;
      const expiry = hub._waveEchoExpiry ?? 0;
      const strength = hub._waveEchoStrength ?? 0;

      if (expiry <= now || strength <= 0) {
        hub._waveEchoStrength = 0;
        hub._waveEchoExpiry = 0;
        continue;
      }

      const remaining = Math.max(0, expiry - now) / this.config.echoTrailDuration;
      const echoValue = strength * remaining;
      const targetOpacity = Math.max(0, Math.min(1, (hub._baseAuraOpacity ?? material.opacity) + echoValue * this.config.echoTrailOpacity));

      if (Number.isFinite(material.opacity)) {
        if (hub._baseAuraOpacity === undefined) hub._baseAuraOpacity = material.opacity;
        material.opacity = targetOpacity;
      }
    }
  }

  /**
   * Phase 1: Resolve hub world position
   */
  _resolveHubWorldPosition(hub) {
    const primaryNode = hub?.primaryNode ?? hub?.nodes?.[0] ?? null;
    if (!primaryNode) return null;
    
    if (typeof primaryNode.getWorldPosition === 'function') {
      const pos = new THREE.Vector3();
      primaryNode.getWorldPosition(pos);
      return pos;
    }
    return primaryNode.position?.clone?.() ?? null;
  }

  /**
   * Decay all active waves toward zero
   * @private
   * @param {number} deltaTime - Delta time in seconds
   */
  _decayAllWaves(deltaTime) {
    // Apply decay to all active waves
    for (const [waveKey, waveData] of this.activeWaves.entries()) {
      // Phase 1: Smooth influence transitions
      if (waveData.influenceTransitionProgress < 1.0) {
        waveData.influenceTransitionProgress = Math.min(1.0, waveData.influenceTransitionProgress + deltaTime * 2.0);
        const eased = waveData.influenceTransitionProgress * waveData.influenceTransitionProgress * (3 - 2 * waveData.influenceTransitionProgress);
        waveData.influence = waveData.previousInfluence + (waveData.targetInfluence - waveData.previousInfluence) * eased;
      }
      
      const decayed = waveData.influence * Math.pow(this.config.waveDecayRate, deltaTime * 60);
      
      if (decayed < this.config.waveDissolveThreshold) {
        this.activeWaves.delete(waveKey);
      } else {
        waveData.influence = decayed;
      }
    }
  }

  /**
   * Decay orphaned waves (no longer in active pairs)
   * @private
   * @param {number} deltaTime - Delta time in seconds
   */
  _decayOrphans(deltaTime) {
    // Called when active wave count drops
    // Existing orphan waves decay naturally
    this._decayAllWaves(deltaTime);
  }

  /**
   * Get wave influence for a specific hub pair
   * @param {string} hubAId - First hub ID
   * @param {string} hubBId - Second hub ID
   * @returns {number} Wave influence (0-1)
   */
  getWaveInfluence(hubAId, hubBId) {
    const waveKey = `${hubAId}-${hubBId}`;
    const wave = this.activeWaves.get(waveKey);
    return wave ? wave.influence : 0;
  }

  /**
   * Get wave phase (visual debugging)
   * @param {string} hubAId - First hub ID
   * @param {string} hubBId - Second hub ID
   * @returns {number} Wave phase (0-1)
   */
  getWavePhase(hubAId, hubBId) {
    const waveKey = `${hubAId}-${hubBId}`;
    const wave = this.activeWaves.get(waveKey);
    return wave ? wave.wavePhase : 0;
  }

  /**
   * Get current system status
   * @returns {Object} Status object
   */
  getStatus() {
    return {
      activeWaves: this.stats.activeWaves,
      affectedLinks: this.stats.affectedLinks,
      affectedHubs: this.stats.affectedHubs,
      avgWaveInfluence: this.stats.avgWaveInfluence,
      globalWaveTime: this.globalWaveTime,
    };
  }

  /**
   * Setup console debugging API
   * @param {Object} globalWindow - Window object
   */
  setupConsoleAPI(globalWindow) {
    if (!globalWindow) return;
    
    globalWindow.CASCADE_WAVE_STATS = this.stats;
    globalWindow.CASCADE_WAVE_CONFIG = this.config;
    
    globalWindow.toggleCascadeWaveDebug = (enabled = true) => {
      this.config.debugMode = enabled;
      console.log(`[CascadeWave] Debug mode: ${enabled ? 'ON' : 'OFF'}`);
    };
    
    globalWindow.cascadeWaveStatus = () => {
      const status = this.getStatus();
      console.log('=== CASCADE RESONANCE WAVE STATUS ===');
      console.log(`Active waves: ${status.activeWaves}`);
      console.log(`Affected links: ${status.affectedLinks}`);
      console.log(`Affected hubs: ${status.affectedHubs}`);
      console.log(`Avg wave influence: ${status.avgWaveInfluence.toFixed(3)}`);
      console.log(`Global wave time: ${status.globalWaveTime.toFixed(2)}s`);
      console.log('(Note: Wave phase values are 0-1, showing position in oscillation cycle)');
      return status;
    };
    
    globalWindow.tune_cascade_wave = (key, value) => {
      if (key in this.config) {
        this.config[key] = value;
        console.log(`[CascadeWave] ${key} = ${value}`);
      } else {
        console.warn(`Unknown config key: ${key}`);
      }
    };
    
    // Debug helper: show wave phase values for specific pair
    globalWindow.getWavePhaseDebug = (hubAId, hubBId) => {
      const phase = this.getWavePhase(hubAId, hubBId);
      const influence = this.getWaveInfluence(hubAId, hubBId);
      console.log(
        `Wave ${hubAId} <-> ${hubBId}: ` +
        `phase=${phase.toFixed(2)} (0=baseline, 0.5=peak, 1=return) | ` +
        `influence=${influence.toFixed(4)}`
      );
      return { phase, influence };
    };
  }

  /**
   * Cleanup and dispose
   */
  dispose() {
    this.activeWaves.clear();
    this._clearCascadeSubscriptions();
    
    // Phase 1: Cleanup rings
    if (this._ringGeometryPool) {
      for (const ring of this._ringGeometryPool) {
        if (ring.mesh?.parent) ring.mesh.parent.remove(ring.mesh);
      }
      this._ringGeometryPool = [];
      this._activeRings = [];
      this._freeRingIndices = [];
    }
    if (this._ringMaterial) {
      this._ringMaterial.dispose();
      this._ringMaterial = null;
    }
    if (this._ringGeometry) {
      this._ringGeometry.dispose();
      this._ringGeometry = null;
    }

    // Phase 2: Cleanup beams
    if (this._beamGeometryPool) {
      for (const beam of this._beamGeometryPool) {
        if (beam.line?.parent) beam.line.parent.remove(beam.line);
        if (beam.line?.material) beam.line.material.dispose();
        if (beam.geometry) beam.geometry.dispose();
      }
      this._beamGeometryPool = [];
      this._activeBeams = [];
      this._freeBeamIndices = [];
    }

    // Phase 3: Cleanup particle systems
    if (this._wavefrontParticlePool) {
      for (const particle of this._wavefrontParticlePool) {
        if (particle.points?.parent) particle.points.parent.remove(particle.points);
        if (particle.points?.material) particle.points.material.dispose();
        if (particle.geometry) particle.geometry.dispose();
      }
      this._wavefrontParticlePool = [];
      this._activeWavefrontParticles = [];
      this._freeWavefrontParticleIndices = [];
    }
    if (this._resonanceSparkPool) {
      for (const spark of this._resonanceSparkPool) {
        if (spark.points?.parent) spark.points.parent.remove(spark.points);
        if (spark.points?.material) spark.points.material.dispose();
        if (spark.geometry) spark.geometry.dispose();
      }
      this._resonanceSparkPool = [];
      this._activeResonanceSparks = [];
      this._freeResonanceSparkIndices = [];
    }
    if (this._echoTrailPool) {
      for (const trail of this._echoTrailPool) {
        if (trail.line?.parent) trail.line.parent.remove(trail.line);
        if (trail.line?.material) trail.line.material.dispose();
        if (trail.geometry) trail.geometry.dispose();
      }
      this._echoTrailPool = [];
      this._activeEchoTrails = [];
      this._freeEchoTrailIndices = [];
    }
    if (this._interferenceParticlePool) {
      for (const particle of this._interferenceParticlePool) {
        if (particle.points?.parent) particle.points.parent.remove(particle.points);
        if (particle.points?.material) particle.points.material.dispose();
        if (particle.geometry) particle.geometry.dispose();
      }
      this._interferenceParticlePool = [];
      this._activeInterferenceParticles = [];
      this._freeInterferenceParticleIndices = [];
    }
  }
}

/**
 * Console API setup function
 * @param {Object} globalWindow - Window object
 * @param {CascadeResonanceWaveVisualization_Session146} waveViz - Wave viz instance
 */
export function setupCascadeWaveConsoleAPI(globalWindow, waveViz) {
  if (waveViz && waveViz.setupConsoleAPI) {
    waveViz.setupConsoleAPI(globalWindow);
  }
}
