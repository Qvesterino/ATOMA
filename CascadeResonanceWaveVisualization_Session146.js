import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

/**
 * CascadeResonanceWaveVisualization_Session146.js
 * ============================================================================
 * CASCADE RESONANCE WAVE VISUALIZATION SYSTEM
 * 
 * Introduces a ghost-level resonance wave visualization that propagates between
 * phase-synchronized harmonic hubs. This is pure temporal modulation — no visible
 * objects, no particles, no energy transfer. The wave suggests latent cascade
 * potential without actually triggering cascade mechanics.
 * 
 * DESIGN PHILOSOPHY:
 * The network "tests" resonance paths without committing. Players sense
 * latent directional tension, as if the system rehearses internally.
 * 
 * WAVE BEHAVIOR:
 * - Virtual wave phase per hub pair (0–1, normalized)
 * - Slow oscillation (2–4 second period)
 * - Temporal modulation only (affects animation timing, not brightness)
 * - Influence: 5–8% of baseline parameters (barely perceptible)
 * - Auto-decay when synchronization weakens
 * - Zero per-frame allocations (reused buffers)
 * 
 * MANIFESTATION (EXTREMELY SUBTLE):
 * 
 * Links Between Synchronized Hubs:
 * - Slight temporal phase drift compression
 * - Micro delay alignment across braided strands
 * - Appears as soft "pressure" moving along link
 * - NO directional beam, NO pulse, NO brightness change
 * 
 * Hub Interaction:
 * - While synchronized: wave influence oscillates
 * - Influence scales with phase sync stability
 * - If sync weakens: wave dissolves immediately
 * 
 * Auras:
 * - Brief tightening as wave passes (NO opacity/color change)
 * - Micro reduction in noise randomness
 * - Barely visible to careful observation
 * 
 * CONSTRAINTS:
 * ❌ NO glow, color modulation, particles, rings, ripples
 * ❌ NO camera effects, visible "wavefront"
 * ❌ NO new geometry or mesh objects
 * ❌ NO gameplay state changes
 * ❌ NO actual energy transfer
 * 
 * IMPLEMENTATION:
 * - Wave phase computed per hub pair (virtual wave)
 * - Wave propagation driven by phase sync quality
 * - Temporal bias applied to existing animation parameters
 * - All effects normalized (0–1) and auto-decay
 * - Zero per-frame allocations
 * 
 * @author VFX Technical Director — ATOMA Project Session 146 Extended
 * @version 1.0.0
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
      waveDecayRate: config.waveDecayRate ?? 0.94,                 // Auto-decay speed
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
        uInterference: { value: 0.0 } // Interference factor
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
          
          // Sparkle fringe: high-frequency sparkle at outer edge
          float sparkleNoise = hash(vUv * 50.0 + uTime * 2.0);
          float sparkleFringe = smoothstep(0.48, 0.50, dist) * sparkleNoise * 0.4;
          finalColor += sparkleFringe;
          
          // Combine all effects
          float alpha = (multiLobe + shimmer * 0.2 + sparkleFringe) * uOpacity * (1.0 + uInterference * 0.3);
          
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

    this.activeWaves.set(waveKey, {
      wavePhase: this.globalWaveTime % 1,
      influence: Math.max(this.config.waveInfluenceMin, Math.min(this.config.waveInfluenceMax, influence)),
      hubAId: sourceId,
      hubBId: targetId,
      // Phase 1: Smooth phase transition tracking
      previousInfluence: 0,
      targetInfluence: Math.max(this.config.waveInfluenceMin, Math.min(this.config.waveInfluenceMax, influence)),
      influenceTransitionProgress: 1.0
    });
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
    this._applyWaveEffects();
    
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
    if (this.activeWaves.size > 0) return false;
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
  _applyWaveEffects() {
    if (!this.harmonicHubSystem) {
      return;
    }
    
    // Phase 1: Update active rings
    this._updateWavefrontRipples();

    // Phase 2: Update resonance beams
    if (this.config.linkResonanceBeamEnabled) {
      this._updateLinkResonanceBeams();
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
      
      const age = this.globalWaveTime - activeRing.startTime;
      const maxAge = this.config.wavefrontRingMaxRadius / (this.config.wavefrontRingSpeed * ringSpeed);
      const progress = age / maxAge;

      if (progress >= 1.0) {
        // Ring expired - release back to pool
        this._releaseRing(activeRing.ringEntry);
        this._activeRings.splice(i, 1);
        continue;
      }

      // Expand ring
      const radius = this.config.wavefrontRingMinRadius + progress * (this.config.wavefrontRingMaxRadius - this.config.wavefrontRingMinRadius);
      activeRing.ringEntry.mesh.scale.setScalar(radius);

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
      
      const opacity = fadeProgress * activeRing.influence * ringOpacity;
      
      // EPIC shader uniforms
      const uniforms = activeRing.ringEntry.mesh.material.uniforms;
      uniforms.uOpacity.value = opacity;
      uniforms.uTime.value = this.globalWaveTime;
      uniforms.uWavePhase.value = (this.globalWaveTime * 0.5 * ringSpeed + activeRing.wavePhase) % 1.0;
      uniforms.uIntensity.value = activeRing.influence;
      uniforms.uInterference.value = 0.3 * Math.sin(this.globalWaveTime * 3.0 + activeRing.wavePhase * Math.PI * 2) * 0.5 + 0.5;
      uniforms.uColor.value.copy(ringColor);
    }

    // Spawn new rings for active waves - THREE TIERS for parallax
    if (this.activeWaves.size > 0 && this._activeRings.length < this._ringGeometryPool.length) {
      for (const [waveKey, waveData] of this.activeWaves.entries()) {
        // Only spawn rings when wave phase crosses threshold (periodic spawn)
        const phaseInCycle = (this.globalWaveTime * this.config.wavefrontRingSpeed) % 1.0;
        const shouldSpawn = phaseInCycle < 0.05 && waveData.influence > 0.3;

        if (!shouldSpawn) continue;

        // Spawn ring at hub A position
        const hubA = this.harmonicHubSystem?.hubs?.get(waveData.hubAId);
        if (!hubA) continue;

        const hubPosition = this._resolveHubWorldPosition(hubA);
        if (!hubPosition) continue;

        // Try to spawn all three tiers for parallax effect
        const tiers = ['inner', 'middle', 'outer'];
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

          this._activeRings.push({
            ringEntry,
            waveKey,
            startTime: this.globalWaveTime - spawnDelay, // Negative start time for staggered spawn
            influence: waveData.influence,
            wavePhase: waveData.wavePhase,
            hubAId: waveData.hubAId,
            hubBId: waveData.hubBId,
            tier: tier
          });
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

      // Apply to hub aura scale
      if (hub.aura) {
        const baseScale = hub._baseAuraScale ?? hub.aura.scale.x ?? 1;
        if (!hub._baseAuraScale) hub._baseAuraScale = baseScale;
        hub.aura.scale.setScalar(baseScale * (1 - tightening));
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

      // Allocate all three layers for this wave pair
      let allocatedLayers = 0;
      for (let layerIndex = 0; layerIndex < layersPerBeam; layerIndex++) {
        const beamEntry = this._allocateBeam();
        if (!beamEntry) break;
        
        // Position and orient the beam (CylinderGeometry)
        const direction = new THREE.Vector3().subVectors(posB, posA);
        const beamLength = direction.length();
        beamEntry.line.scale.set(1, beamLength, 1);
        
        // Position at midpoint
        const midpoint = new THREE.Vector3().addVectors(posA, posB).multiplyScalar(0.5);
        beamEntry.line.position.copy(midpoint);
        
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
        
        // Pulse traveling phase (layer-specific speed)
        const phasePulse = Math.sin(this.globalWaveTime * pulseSpeed + waveData.wavePhase * Math.PI * 2) * 0.5 + 0.5;
        const opacity = Math.min(1.0, baseOpacity * waveData.influence * (0.6 + 0.4 * phasePulse));
        uniforms.uOpacity.value = opacity;
        uniforms.uTime.value = this.globalWaveTime;
        uniforms.uPulsePhase.value = this.globalWaveTime * 0.8 * (pulseSpeed / 3.0) + waveData.wavePhase;
        uniforms.uBeamLength.value = beamLength;
        uniforms.uLayerType.value = layerIndex;
        
        // Harmony and corruption from hubs
        const hubAState = this._readHubWaveState(hubA);
        const hubBState = this._readHubWaveState(hubB);
        const avgHarmony = (hubAState.harmony + hubBState.harmony) * 0.5;
        const avgCorruption = (hubAState.corruption + hubBState.corruption) * 0.5;
        
        uniforms.uHarmony.value = avgHarmony;
        uniforms.uCorruption.value = avgCorruption;
        
        // Color based on harmony (shift toward gold when high harmony)
        if (avgHarmony > 0.7) {
          const harmonyColor = new THREE.Color(0xffcc66); // Gold
          uniforms.uColor.value.lerp(harmonyColor, (avgHarmony - 0.7) / 0.3);
        } else {
          uniforms.uColor.value.copy(this.config.linkBeamColor);
        }

        // Add a slight motion bias along the link direction using userData
        beamEntry.line.userData._wavePhase = waveData.wavePhase;
        beamEntry.line.renderOrder = VisualHierarchyRegistry?.getRenderOrder?.(VisualHierarchyRegistry.LAYER_LINK_CASCADE) ?? 13;
        
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
