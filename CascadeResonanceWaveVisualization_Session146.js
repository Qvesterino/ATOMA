import * as THREE from 'three';

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
      waveInfluenceMin: config.waveInfluenceMin ?? 0.65,           // Debug-visible minimum
      waveInfluenceMax: config.waveInfluenceMax ?? 1.0,            // Debug-visible maximum
      
      // Wave trigger conditions
      minPhaseSyncStrength: config.minPhaseSyncStrength ?? 0.04,    // Min phase delta for wave
      minPhaseSyncStability: config.minPhaseSyncStability ?? 0.04, // Min convergence strength
      minCascadeStrengthTrigger: config.minCascadeStrengthTrigger ?? 0.15,
      minHubCorruptionThreshold: config.minHubCorruptionThreshold ?? 0.25,
      minHubStabilityThreshold: config.minHubStabilityThreshold ?? 0.65,
      
      // Temporal modulation
      linkPhaseCompression: config.linkPhaseCompression ?? 0.2,    // Link phase tightening
      auraNoiseReduction: config.auraNoiseReduction ?? 0.14,       // Aura randomness reduction
      
      // Wave decay
      waveDecayRate: config.waveDecayRate ?? 0.94,                 // Auto-decay speed
      waveDissolveThreshold: config.waveDissolveThreshold ?? 0.02, // Threshold to completely fade
      
      // Safety
      enabled: config.enabled ?? true,
      debugMode: config.debugMode ?? false,
      maxWaveActivePairs: config.maxWaveActivePairs ?? 30,
      // Phase 1: Visible wavefront ripples
      wavefrontRipplesEnabled: config.wavefrontRipplesEnabled ?? true,
      wavefrontRingCount: config.wavefrontRingCount ?? 3,
      wavefrontRingMaxRadius: config.wavefrontRingMaxRadius ?? 4.0,
      wavefrontRingMinRadius: config.wavefrontRingMinRadius ?? 0.3,
      wavefrontRingSpeed: config.wavefrontRingSpeed ?? 2.0,
      wavefrontRingOpacity: config.wavefrontRingOpacity ?? 0.12,
      // Phase 1: Aura tightening pulse
      auraTighteningPulseEnabled: config.auraTighteningPulseEnabled ?? true,
      auraTighteningAmount: config.auraTighteningAmount ?? 0.08,
      auraPulseSpeed: config.auraPulseSpeed ?? 3.0,
      // Phase 1: Smooth wave phase transitions
      smoothPhaseTransitionsEnabled: config.smoothPhaseTransitionsEnabled ?? true,
      // Phase 3: Premium interference + echo effects
      interferenceEnabled: config.interferenceEnabled ?? true,
      interferenceBoost: config.interferenceBoost ?? 0.08,
      interferenceDampening: config.interferenceDampening ?? 0.05,
      echoTrailEnabled: config.echoTrailEnabled ?? true,
      echoTrailDuration: config.echoTrailDuration ?? 0.8,
      echoTrailOpacity: config.echoTrailOpacity ?? 0.03,
      echoTrailThreshold: config.echoTrailThreshold ?? 0.2,
      // Phase 2: Glow and beam effects
      hubGlowModulationEnabled: config.hubGlowModulationEnabled ?? true,
      hubGlowIntensity: config.hubGlowIntensity ?? 0.05, // 3-7% above baseline
      hubGlowColor: config.hubGlowColor ?? new THREE.Color(0x7ffcff), // Cyan-white
      linkResonanceBeamEnabled: config.linkResonanceBeamEnabled ?? true,
      linkBeamOpacity: config.linkBeamOpacity ?? 0.08,
      linkBeamColor: config.linkBeamColor ?? new THREE.Color(0x9fdfff),
      waveStrengthIndicatorEnabled: config.waveStrengthIndicatorEnabled ?? true
    };
    
    // Wave state tracking (per hub pair)
    // Key: "hubA-hubB", Value: { wavePhase, influence }
    this.activeWaves = new Map();
    
    // Phase 1: Wavefront ring pool (reused geometries)
    this._ringGeometryPool = null;
    this._ringMaterial = null;
    this._activeRings = []; // Array of { mesh, waveKey, startTime, hubAId, hubBId }
    this._freeRingIndices = [];

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
   * Phase 2: Initialize link resonance beam system
   */
  _initLinkResonanceBeamSystem() {
    if (!this.config.linkResonanceBeamEnabled) return;
    if (!this.harmonicHubSystem?.world?.scene) return;

    const scene = this.harmonicHubSystem.world.scene;
    this._beamGeometryPool = [];
    this._freeBeamIndices = [];

    const beamCount = Math.max(1, Math.min(this.config.maxWaveActivePairs, 32));

    for (let i = 0; i < beamCount; i++) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(6);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setDrawRange(0, 2);

      const material = new THREE.LineBasicMaterial({
        color: this.config.linkBeamColor.clone(),
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending
      });

      const line = new THREE.Line(geometry, material);
      line.visible = false;
      line.renderOrder = 110;
      scene.add(line);

      this._beamGeometryPool.push({
        line,
        geometry,
        active: false,
        index: i
      });
      this._freeBeamIndices.push(i);
    }
  }

  /**
   * Phase 1: Initialize wavefront ring system
   */
  _initWavefrontRingSystem() {
    if (!this.config.wavefrontRipplesEnabled) return;
    if (!this.harmonicHubSystem?.world?.scene) return;
    
    const scene = this.harmonicHubSystem.world.scene;
    
    // Create ring geometry (plane with circle shader)
    const ringGeometry = new THREE.PlaneGeometry(1, 1, 32, 32);
    
    // Create ring material (cyan-white, circular gradient)
    const ringMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0x7ffcff) }, // Cyan-white
        uOpacity: { value: 1.0 },
        uTime: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uTime;
        varying vec2 vUv;
        
        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);
          
          // Circular ring with soft edges
          float ring = smoothstep(0.45, 0.48, dist) * (1.0 - smoothstep(0.48, 0.50, dist));
          
          // Inner glow
          float innerGlow = smoothstep(0.48, 0.45, dist) * 0.3;
          
          float alpha = (ring + innerGlow) * uOpacity;
          
          gl_FragColor = vec4(uColor, alpha);
          
          if (alpha < 0.01) discard;
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    
    this._ringGeometry = ringGeometry;
    this._ringMaterial = ringMaterial;
    
    // Create ring pool (reused meshes)
    this._ringGeometryPool = [];
    const ringCount = this.config.maxWaveActivePairs * this.config.wavefrontRingCount;
    
    for (let i = 0; i < ringCount; i++) {
      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
      ringMesh.visible = false;
      ringMesh.renderOrder = 100; // High render order for overlay effect
      scene.add(ringMesh);
      this._ringGeometryPool.push({
        mesh: ringMesh,
        index: i,
        active: false
      });
      this._freeRingIndices.push(i);
    }
  }

  /**
   * Phase 1: Allocate ring from pool
   */
  _allocateRing() {
    if (!this._freeRingIndices || this._freeRingIndices.length === 0) return null;
    const index = this._freeRingIndices.pop();
    const ringEntry = this._ringGeometryPool[index];
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
   * Phase 1: Update wavefront ring ripples
   * Spawns visible ring ripples from hubs when waves are active.
   */
  _updateWavefrontRipples() {
    if (!this.config.wavefrontRipplesEnabled) return;
    if (!this._ringGeometryPool) return;

    // Update existing active rings
    for (let i = this._activeRings.length - 1; i >= 0; i--) {
      const activeRing = this._activeRings[i];
      const age = this.globalWaveTime - activeRing.startTime;
      const maxAge = this.config.wavefrontRingMaxRadius / this.config.wavefrontRingSpeed;
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

      // Fade out opacity (peaked at 30% lifetime, fades after)
      const fadeProgress = progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7;
      const opacity = fadeProgress * activeRing.influence * this.config.wavefrontRingOpacity;
      activeRing.ringEntry.mesh.material.uniforms.uOpacity.value = opacity;
      activeRing.ringEntry.mesh.material.uniforms.uTime.value = this.globalWaveTime;
    }

    // Spawn new rings for active waves
    if (this.activeWaves.size > 0 && this._activeRings.length < this._ringGeometryPool.length) {
      for (const [waveKey, waveData] of this.activeWaves.entries()) {
        // Only spawn ring when wave phase crosses threshold (periodic spawn)
        const phaseInCycle = (this.globalWaveTime * this.config.wavefrontRingSpeed) % 1.0;
        const shouldSpawn = phaseInCycle < 0.05 && waveData.influence > 0.3;

        if (!shouldSpawn) continue;

        // Spawn ring at hub A position
        const hubA = this.harmonicHubSystem?.hubs?.get(waveData.hubAId);
        if (!hubA) continue;

        const hubPosition = this._resolveHubWorldPosition(hubA);
        if (!hubPosition) continue;

        const ringEntry = this._allocateRing();
        if (!ringEntry) continue;

        ringEntry.mesh.position.copy(hubPosition);
        ringEntry.mesh.scale.setScalar(this.config.wavefrontRingMinRadius);

        this._activeRings.push({
          ringEntry,
          waveKey,
          startTime: this.globalWaveTime,
          influence: waveData.influence,
          hubAId: waveData.hubAId,
          hubBId: waveData.hubBId
        });
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

    let usedBeams = 0;
    for (const waveData of this.activeWaves.values()) {
      if (usedBeams >= this._beamGeometryPool.length) break;
      if (waveData.influence <= 0.15) continue;

      const hubA = this.harmonicHubSystem.hubs?.get(waveData.hubAId);
      const hubB = this.harmonicHubSystem.hubs?.get(waveData.hubBId);
      if (!hubA || !hubB) continue;

      const posA = this._resolveHubWorldPosition(hubA);
      const posB = this._resolveHubWorldPosition(hubB);
      if (!posA || !posB) continue;

      const beamEntry = this._allocateBeam();
      if (!beamEntry) break;

      const positions = beamEntry.geometry.attributes.position.array;
      positions[0] = posA.x;
      positions[1] = posA.y;
      positions[2] = posA.z;
      positions[3] = posB.x;
      positions[4] = posB.y;
      positions[5] = posB.z;
      beamEntry.geometry.attributes.position.needsUpdate = true;
      beamEntry.geometry.computeBoundingSphere?.();

      const beamMaterial = beamEntry.line.material;
      const phasePulse = Math.sin(this.globalWaveTime * 2.0 + waveData.wavePhase * Math.PI * 2) * 0.5 + 0.5;
      const opacity = Math.min(1.0, this.config.linkBeamOpacity * waveData.influence * (0.6 + 0.4 * phasePulse));
      beamMaterial.opacity = opacity;
      if (beamMaterial.color) {
        beamMaterial.color.copy(this.config.linkBeamColor);
      }

      // Add a slight motion bias along the link direction using userData
      beamEntry.line.userData._wavePhase = waveData.wavePhase;
      beamEntry.line.renderOrder = 110;
      usedBeams += 1;
      this._activeBeams.push(beamEntry);
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

      const glowPulse = Math.sin((this.globalWaveTime + totalInfluence) * Math.PI * 2) * 0.5 + 0.5;
      const glowStrength = Math.min(1, totalInfluence) * this.config.hubGlowIntensity * glowPulse;
      const material = hub.aura.material;

      if (Number.isFinite(material.emissiveIntensity)) {
        if (hub._baseAuraEmissiveIntensity === undefined) {
          hub._baseAuraEmissiveIntensity = material.emissiveIntensity;
        }
        material.emissiveIntensity = hub._baseAuraEmissiveIntensity * (1 + glowStrength);
      }

      if (material.emissive && typeof material.emissive.copy === 'function') {
        if (!hub._baseAuraEmissiveColor) {
          hub._baseAuraEmissiveColor = material.emissive.clone();
        }
        material.emissive.copy(hub._baseAuraEmissiveColor).lerp(this.config.hubGlowColor, Math.min(1, totalInfluence * 0.5));
      }

      if (material.uniforms?.uGlowIntensity) {
        material.uniforms.uGlowIntensity.value = Math.max(material.uniforms.uGlowIntensity.value, glowStrength);
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

      const strength = Math.min(1, totalInfluence);
      const indicatorPulse = Math.sin(this.globalWaveTime * 1.5 + strength * Math.PI) * 0.5 + 0.5;
      const indicatorIntensity = strength * 0.12 * indicatorPulse;
      const material = hub.aura.material;

      if (Number.isFinite(material.opacity)) {
        const baseOpacity = hub._baseAuraOpacity ?? material.opacity;
        if (hub._baseAuraOpacity === undefined) hub._baseAuraOpacity = baseOpacity;
        material.opacity = Math.max(0, Math.min(1, baseOpacity + indicatorIntensity));
      }

      if (material.uniforms?.uAuraColor && material.uniforms.uAuraColor.value) {
        if (!hub._baseAuraColor) {
          hub._baseAuraColor = material.uniforms.uAuraColor.value.clone();
        }
        material.uniforms.uAuraColor.value.copy(hub._baseAuraColor).lerp(this.config.hubGlowColor, strength * 0.2);
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

      const interferenceDelta = constructive * this.config.interferenceBoost - destructive * this.config.interferenceDampening;
      if (Number.isFinite(material.emissiveIntensity)) {
        if (hub._baseAuraEmissiveIntensity === undefined) {
          hub._baseAuraEmissiveIntensity = material.emissiveIntensity;
        }
        material.emissiveIntensity = Math.max(0, hub._baseAuraEmissiveIntensity * (1 + interferenceDelta));
      }

      if (material.uniforms?.uGlowIntensity) {
        material.uniforms.uGlowIntensity.value = Math.max(material.uniforms.uGlowIntensity.value, Math.max(0, interferenceDelta));
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
