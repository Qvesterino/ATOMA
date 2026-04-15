/**
 * MYTHIC RITUAL EVENTS 1.0 - SAFE EDITION
 *
 * ⚠️ MYTHIC RITUALS ARE ENABLED BY DEFAULT
 * Set window.ATOMA_DISABLE_MYTHIC_RITUALS = true to disable
 *
 * Creates rare, dramatic ceremonial events when the network reaches extraordinary states.
 * Rituals are visual spectacles triggered by specific network conditions.
 *
 * HARD SAFETY RULES:
 * - NO modifications to player movement, camera, physics, node position, linking logic
 * - Rituals are 100% visual + ambient only
 * - All effects fade in/out smoothly
 * - Fully reversible and safe if interrupted
 * - Graceful degradation on missing data
 *
 * FEATURES:
 * 1. RITUAL DETECTION
 *    - Consumes world.mood snapshots from WorldPersonalityController
 *    - Detects rare alignment patterns
 *    - Checks for trigger conditions
 *
 * 2. RITUAL TYPES (6)
 *    - ASCENSION_RITUAL: Many ascended nodes + high harmony
 *    - CHAOS_RITUAL: High stability dominance
 *    - HARMONY_CONVERGENCE: Very high harmony across network
 *    - MYTHIC_SIGNAL: Rare perfect balance state
 *    - ECHO_RITUAL: Low energy + high clarity + specific patterns
 *    - QUANTUM_FISSURE: Extreme stability spike
 *
 * 3. RITUAL PHASES
 *    - INIT (3s): Fade in, gather energy
 *    - RISE (5-8s): Build intensity, effects grow
 *    - PEAK (3-6s): Maximum visual spectacle
 *    - FALL (4s): Wind down, fade out
 *
 * 4. VISUAL EFFECTS
 *    - Sky gradient shifts
 *    - Fog adjustments
 *    - Holographic rings/sigils/runes
 *    - Vertical light beams
 *    - Particle bursts
 *    - Node glow boost
 *    - Subtle bloom/saturation
 *
 * 5. PERFORMANCE
 *    - One ritual at a time
 *    - Lightweight meshes
 *    - Auto-skip on low FPS
 *    - GPU-friendly particles
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { buildScopedMetricEventName } from './src/metrics/MetricTierClassifier.js';

export class MythicRitualController {
  // 🔥 GLOBAL SAFETY FLAG - Mythic Rituals disabled by default
  static get ENABLED() {
    return typeof window !== 'undefined' ? !window.ATOMA_DISABLE_MYTHIC_RITUALS : false;
  }

  constructor(scene, camera, renderer, worldPersonalityController, player, semanticBus) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.worldController = worldPersonalityController;
    this.player = player;
    this.semanticBus = semanticBus;
    this.metricBus = semanticBus || this._resolveMetricBus();
    this.latestWorldMood = null;
    this.latestWorldMoodAt = 0;
    this.pendingRitualEvaluation = false;
    this._worldMoodBridgeActive = false;
    this._worldMoodBridgeSubscriptions = [];

    // SAFETY: Early exit if rituals disabled
    if (!MythicRitualController.ENABLED) {
      console.log('[MythicRitualController] Disabled (window.ATOMA_DISABLE_MYTHIC_RITUALS = true)');
      return;
    }

    // Active ritual state
    this.activeRitual = null;
    this.ritualPhase = 'NONE'; // NONE, INIT, RISE, PEAK, FALL
    this.ritualProgress = 0;
    this.ritualStartTime = 0;

    // Phase durations (in seconds)
    this.phaseDurations = {
      INIT: 3.0,
      RISE: 6.0,
      PEAK: 4.5,
      FALL: 4.0,
    };

    // Ritual cooldown
    this.lastRitualTime = 0;
    this.ritualCooldown = 45.0; // Min 45s between rituals

    // Ritual detection
    this.lastDetectionCheck = 0;
    this.detectionCheckInterval = 5.0; // Check every 5s

    // Ritual visuals
    this.ritualVisuals = new Map();
    this._ritualVisualId = 0;
    this.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_WORLD_OVERLAY);

    // UNIFIED CLEANUP CONTRACT - Track all created objects
    this._createdObjects = [];

    // HUD element
    this.ritualHUD = null;
    this.hudFadeProgress = 0;

    // Performance tracking
    this.performanceMode = 'normal';
    this.skipRituals = false;

    // Node glow boost tracking
    this.nodeGlowBoosts = new Map();

    // Base world state backup
    this.worldStateBackup = null;

    this._setupWorldMoodBridge();



    console.log('✓ Mythic Ritual Controller 1.0 initialized');
  }

  _getRitualPalette(ritualType) {
    const palette = {
      ASCENSION_RITUAL: {
        primary: 0xffd700,
        secondary: 0xfff1a8,
        accent: 0xf7fbff,
        void: 0x142648
      },
      QUANTUM_FISSURE: {
        primary: 0xff4bff,
        secondary: 0xc775ff,
        accent: 0xf7d6ff,
        void: 0x1c0934
      },
      HARMONY_CONVERGENCE: {
        primary: 0x00ffaa,
        secondary: 0x77f7db,
        accent: 0xf7fbff,
        void: 0x06263a
      },
      CHAOS_RITUAL: {
        primary: 0xff2f7b,
        secondary: 0xff73cf,
        accent: 0xffd1ee,
        void: 0x2b061a
      },
      MYTHIC_SIGNAL: {
        primary: 0xf7fbff,
        secondary: 0xb9d9ff,
        accent: 0xffffff,
        void: 0x121824
      },
      ECHO_RITUAL: {
        primary: 0x8888ff,
        secondary: 0x8fe2ff,
        accent: 0xe7f1ff,
        void: 0x101d3b
      }
    };

    return palette[ritualType] || {
      primary: 0xf7fbff,
      secondary: 0xb9d9ff,
      accent: 0xffffff,
      void: 0x121824
    };
  }

  _computeRitualAnchor(nodes) {
    const validNodes = Array.isArray(nodes)
      ? nodes.filter((node) => node?.position?.isVector3)
      : [];

    if (!validNodes.length) {
      return { x: 0, y: 0, z: 0 };
    }

    const centroid = new THREE.Vector3();
    for (const node of validNodes) {
      centroid.add(node.position);
    }
    centroid.multiplyScalar(1 / validNodes.length);

    return { x: centroid.x, y: centroid.y, z: centroid.z };
  }

  _buildRitualEventPayload(ritualType, nodes = this._currentRitualNodes, overrides = {}) {
    const palette = this._getRitualPalette(ritualType);
    const payload = {
      ritualType,
      phase: overrides.phase ?? this.ritualPhase,
      phaseIntensity: Number.isFinite(overrides.phaseIntensity) ? overrides.phaseIntensity : this.getPhaseIntensity(),
      progress: Number.isFinite(overrides.progress) ? overrides.progress : this.ritualProgress,
      anchor: overrides.anchor ?? this._computeRitualAnchor(nodes),
      palette,
      worldMood: this.latestWorldMood ? { ...this.latestWorldMood } : null,
      targetNodeId: this._getNodeId(nodes?.[0]),
      nodes: nodes?.map((node) => this._getNodeId(node)).filter((id) => id !== null && id !== undefined) ?? [],
      timestamp: performance.now(),
      source: 'MythicRitualController',
      ...overrides
    };

    return payload;
  }

  /**
   * Initialize ritual HUD
   */
  initializeHUD() {
    if (typeof document === 'undefined') return;
    if (this.ritualHUD?.parentNode) {
      this.ritualHUD.parentNode.removeChild(this.ritualHUD);
    }

    this.ritualHUD = document.createElement('div');
    this.ritualHUD.id = 'mythic-ritual-hud';
    this.ritualHUD.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 20px 30px;
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid rgba(255, 215, 0, 0.8);
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 18px;
      font-weight: bold;
      color: #ffd700;
      z-index: 9999;
      pointer-events: none;
      opacity: 0;
      text-align: center;
      box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
      text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
    `;

    document.body.appendChild(this.ritualHUD);
  }

  /**
   * Main update loop
   */
  update(deltaTime, nodes) {
    // SAFETY: Exit early if rituals disabled
    if (!MythicRitualController.ENABLED) return;

    if (!nodes || nodes.length === 0) return;
    const now = Date.now() / 1000;
    if (this.skipRituals && now < this.skipRitualsUntil) return;
    if (this.skipRituals && now >= this.skipRitualsUntil) {
      this.skipRituals = false;
      this.skipRitualsUntil = 0;
    }

    // Performance check
    if (deltaTime > 0.05) {
      this.skipRituals = true;
      this.skipRitualsUntil = now + 5.0;
      console.warn('Mythic Rituals: Skipping due to low FPS');
      return;
    }

    // Update active ritual
    if (this.activeRitual) {
      this.updateActiveRitual(deltaTime, nodes);
    } else {
      // Event-driven path: react to world mood snapshots when available.
      const ritualCooldownReady = Date.now() / 1000 - this.lastRitualTime >= this.ritualCooldown;
      if (this.pendingRitualEvaluation && ritualCooldownReady) {
        this.checkRitualTriggers(nodes);
        this.pendingRitualEvaluation = false;
        this.lastDetectionCheck = 0;
      } else if (!this._worldMoodBridgeActive) {
        // Fallback polling when the mood bridge is unavailable.
        this.lastDetectionCheck += deltaTime;
        if (this.lastDetectionCheck >= this.detectionCheckInterval) {
          this.checkRitualTriggers(nodes);
          this.lastDetectionCheck = 0;
        }
      }

      // Update player system even when no ritual active (for cosmetic buffs)
      if (this.ritualPlayer) {
        this.ritualPlayer.update(deltaTime, false, null, 'NONE', 0);
      }
    }

    // Update HUD
    this.updateHUD(deltaTime);
  }

  /**
   * Check if conditions are met to trigger a ritual
   */
  checkRitualTriggers(nodes) {
    // Cooldown check
    const timeSinceLastRitual = Date.now() / 1000 - this.lastRitualTime;
    if (timeSinceLastRitual < this.ritualCooldown) return;

    const mood = this.latestWorldMood || this.worldController?.worldMood;
    if (!mood) return;
    if (!nodes || nodes.length === 0) return;

    // Count special node types
    const ascendedCount = Number.isFinite(mood.ascendedCount)
      ? mood.ascendedCount
      : this._countAscendedNodes(nodes);

    // Detection logic for each ritual type

    // ASCENSION_RITUAL: 4+ ascended nodes + high harmony
    if (ascendedCount >= 4 && mood.avgHarmony > 75) {
      this.triggerRitual('ASCENSION_RITUAL', nodes);
      return;
    }

    // QUANTUM_FISSURE: Extreme stability spike
    if (mood.avgStability > 85 && mood.intensity > 0.8) {
      this.triggerRitual('QUANTUM_FISSURE', nodes);
      return;
    }

    // HARMONY_CONVERGENCE: Very high harmony + high clarity
    if (mood.avgHarmony > 80 && mood.avgClarity > 75) {
      this.triggerRitual('HARMONY_CONVERGENCE', nodes);
      return;
    }

    // CHAOS_RITUAL: High stability + high energy
    if (mood.avgStability > 75 && mood.avgEnergy > 70) {
      this.triggerRitual('CHAOS_RITUAL', nodes);
      return;
    }

    // MYTHIC_SIGNAL: Perfect balance (rare)
    const balanceScore = Math.abs(mood.avgHarmony - 60) +
                        Math.abs(mood.avgClarity - 60) +
                        Math.abs(mood.avgEnergy - 60);
    if (balanceScore < 20 && mood.avgStability > 70) {
      this.triggerRitual('MYTHIC_SIGNAL', nodes);
      return;
    }

    // ECHO_RITUAL: Low energy + high clarity + ascended presence
    if (mood.avgEnergy < 40 && mood.avgClarity > 75 && ascendedCount >= 2) {
      this.triggerRitual('ECHO_RITUAL', nodes);
      return;
    }
  }

  /**
   * Trigger a ritual
   */
  triggerRitual(ritualType, nodes) {
    console.log(`✨ MYTHIC RITUAL TRIGGERED: ${ritualType}`);

    this.activeRitual = ritualType;
    this._currentRitualNodes = Array.isArray(nodes) ? nodes.slice() : [];
    this.pendingRitualEvaluation = false;
    this.ritualPhase = 'INIT';
    this.ritualProgress = 0;
    this.ritualStartTime = Date.now() / 1000;
    this.lastRitualTime = Date.now() / 1000;
    const ritualPayload = this._buildRitualEventPayload(ritualType, nodes, {
      phase: 'INIT',
      progress: 0,
      phaseIntensity: 0.08
    });

    // EMIT EVENT FOR EVENT-DRIVEN SYSTEMS
    if (this.semanticBus) {
      this.semanticBus.emit('ritual.prelude', ritualPayload, { priority: this.semanticBus.priority?.INTERACTIVE });
      this.semanticBus.emit('semantic.ritual.started', ritualPayload, { priority: this.semanticBus.priority?.INTERACTIVE });
      console.log(`✓ Ritual started event emitted: ${ritualType}`);
    }
    this._emitMetricBridgeForRitual(ritualType, 'started');

    // Backup world state
    this.backupWorldState();

    // Initialize ritual-specific visuals
    this.initializeRitualVisuals(ritualType, nodes);
  }

  /**
   * Backup current world state
   */
  backupWorldState() {
    this.worldStateBackup = {
      skyColor: this.scene.background ? this.scene.background.clone() : null,
      fogColor: this.scene.fog ? this.scene.fog.color.clone() : null,
    };
  }

  /**
   * Initialize ritual visuals
   *
   * PHASE 3 - VISUAL AUTHORITY GUARD:
   * Only initialize ritual visuals if nodes have completed their primary visual bootstrap.
   * This prevents secondary visual systems (rituals) from overlaying before core visuals ready.
   */
  initializeRitualVisuals(ritualType, nodes) {
    // Phase 3 Guard: Check if nodes are visually ready
    // Ritual visuals are secondary; wait for primary visual bootstrap
    if (nodes && nodes.length > 0) {
      const readyNodes = nodes.filter(n => n?.userData?.visualReady);
      if (readyNodes.length === 0) {
        console.log(`[MythicRitualController] Delaying ritual visuals until nodes visualReady`);
        return;
      }
    }

    switch (ritualType) {
      case 'ASCENSION_RITUAL':
        this.createAscensionVisuals(nodes);
        break;

      case 'QUANTUM_FISSURE':
        this.createQuantumFissureVisuals(nodes);
        break;

      case 'HARMONY_CONVERGENCE':
        this.createHarmonyConvergenceVisuals(nodes);
        break;

      case 'CHAOS_RITUAL':
        this.createChaosRitualVisuals(nodes);
        break;

      case 'MYTHIC_SIGNAL':
        this.createMythicSignalVisuals(nodes);
        break;

      case 'ECHO_RITUAL':
        this.createEchoRitualVisuals(nodes);
        break;
    }
  }

  /**
   * ASCENSION_RITUAL visuals
   */
  createAscensionVisuals(nodes) {
    // Central ascending beam
    const beamGeometry = new THREE.CylinderGeometry(2, 4, 100, 32);
    const beamMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });

    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.set(0, 50, 0);
    beam.renderOrder = this.renderOrder;
    beam.userData.isRitualFX = true;
    this.scene.add(beam);
    this._createdObjects.push(beam);

    this.ritualVisuals.set('central_beam', {
      object: beam,
      type: 'beam',
      targetOpacity: 0.55,
    });

    // Glory beam — wider, softer outer glow for volumetric feel
    const gloryGeometry = new THREE.CylinderGeometry(5, 9, 100, 32);
    const gloryMaterial = new THREE.MeshBasicMaterial({
      color: 0xffee88,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const gloryBeam = new THREE.Mesh(gloryGeometry, gloryMaterial);
    gloryBeam.position.set(0, 50, 0);
    gloryBeam.renderOrder = this.renderOrder;
    gloryBeam.userData.isRitualFX = true;
    this.scene.add(gloryBeam);
    this._createdObjects.push(gloryBeam);
    this.ritualVisuals.set('glory_beam', {
      object: gloryBeam,
      type: 'beam',
      targetOpacity: 0.18,
    });

    // Ascending rings — wider bands for visibility
    const ringCount = 5;
    for (let i = 0; i < ringCount; i++) {
      const ringGeometry = new THREE.RingGeometry(5 + i * 3, 7 + i * 3, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      });

      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = i * 5;
      ring.renderOrder = this.renderOrder;
      ring.userData.isRitualFX = true;
      this.scene.add(ring);
      this._createdObjects.push(ring);

      this.ritualVisuals.set(`ascension_ring_${i}`, {
        object: ring,
        type: 'ascending_ring',
        targetOpacity: 0.75,
        startHeight: i * 5,
      });
    }

    // Particle burst — enhanced count
    this.createParticleBurst(0xffd700, 75);
  }

  /**
   * QUANTUM_FISSURE visuals
   */
  createQuantumFissureVisuals(nodes) {
    // Vertical fissure plane
    const fissureGeometry = new THREE.PlaneGeometry(0.5, 80);
    const fissureMaterial = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });

    const fissure = new THREE.Mesh(fissureGeometry, fissureMaterial);
    fissure.position.set(0, 40, 0);
    fissure.renderOrder = this.renderOrder;
    fissure.userData.isRitualFX = true;
    this.scene.add(fissure);
    this._createdObjects.push(fissure);  // UNIFIED CLEANUP CONTRACT

    this.ritualVisuals.set('quantum_fissure', {
      object: fissure,
      type: 'fissure',
      targetOpacity: 0.9,
    });

    // Chaos particles
    this.createParticleBurst(0xff00ff, 110);

    // Distortion rings
    for (let i = 0; i < 3; i++) {
      const ringGeometry = new THREE.TorusGeometry(15 + i * 5, 0.3, 16, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      });

      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.set(0, 20 + i * 10, 0);
      ring.renderOrder = this.renderOrder;
      ring.userData.isRitualFX = true;
      this.scene.add(ring);
      this._createdObjects.push(ring);  // UNIFIED CLEANUP CONTRACT

      this.ritualVisuals.set(`fissure_ring_${i}`, {
        object: ring,
        type: 'fissure_ring',
        targetOpacity: 0.65,
      });
    }
  }

  /**
   * HARMONY_CONVERGENCE visuals
   */
  createHarmonyConvergenceVisuals(nodes) {
    // Converging beams from cardinal directions
    const directions = [
      new THREE.Vector3(50, 0, 0),
      new THREE.Vector3(-50, 0, 0),
      new THREE.Vector3(0, 0, 50),
      new THREE.Vector3(0, 0, -50),
    ];

    directions.forEach((dir, i) => {
      const beamGeometry = new THREE.CylinderGeometry(0.5, 1.5, 50, 16);
      const beamMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffaa,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      });

      const beam = new THREE.Mesh(beamGeometry, beamMaterial);
      beam.position.copy(dir.clone().multiplyScalar(0.5));
      beam.lookAt(0, 0, 0);
      beam.rotateX(Math.PI / 2);
      beam.renderOrder = this.renderOrder;
      beam.userData.isRitualFX = true;
      this.scene.add(beam);
      this._createdObjects.push(beam);  // UNIFIED CLEANUP CONTRACT

      this.ritualVisuals.set(`harmony_beam_${i}`, {
        object: beam,
        type: 'converging_beam',
        targetOpacity: 0.75,
        direction: dir,
      });
    });

    // Central harmony sphere
    const sphereGeometry = new THREE.SphereGeometry(3, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffaa,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });

    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(0, 5, 0);
    sphere.renderOrder = this.renderOrder;
    sphere.userData.isRitualFX = true;
    this.scene.add(sphere);
    this._createdObjects.push(sphere);  // UNIFIED CLEANUP CONTRACT

    this.ritualVisuals.set('harmony_sphere', {
      object: sphere,
      type: 'harmony_sphere',
      targetOpacity: 0.55,
    });

    // Orbiting motes around harmony sphere
    const moteCount = 12;
    for (let m = 0; m < moteCount; m++) {
      const moteGeo = new THREE.SphereGeometry(0.3, 8, 8);
      const moteMat = new THREE.MeshBasicMaterial({
        color: 0x88ffcc,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      });
      const mote = new THREE.Mesh(moteGeo, moteMat);
      mote.position.set(0, 5, 0);
      mote.renderOrder = this.renderOrder;
      mote.userData.isRitualFX = true;
      this.scene.add(mote);
      this._createdObjects.push(mote);
      this.ritualVisuals.set(`harmony_mote_${m}`, {
        object: mote,
        type: 'orbiting_mote',
        targetOpacity: 0.7,
        orbitAngle: (m / moteCount) * Math.PI * 2,
        orbitRadius: 5 + Math.random() * 2,
        orbitSpeed: 0.8 + Math.random() * 0.6,
        orbitTilt: (Math.random() - 0.5) * 0.5,
      });
    }

    this.createParticleBurst(0x00ffaa, 60);
  }

  /**
   * CHAOS_RITUAL visuals
   */
  createChaosRitualVisuals(nodes) {
    // Chaotic spiral
    const spiralPoints = [];
    for (let i = 0; i < 100; i++) {
      const t = i / 100;
      const angle = t * Math.PI * 10;
      const radius = 5 + t * 20;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = t * 40;

      spiralPoints.push(new THREE.Vector3(x, y, z));
    }

    const spiralGeometry = new THREE.BufferGeometry().setFromPoints(spiralPoints);
    const spiralMaterial = new THREE.LineBasicMaterial({
      color: 0xff0088,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });

    const spiral = new THREE.Line(spiralGeometry, spiralMaterial);
    spiral.renderOrder = this.renderOrder;
    spiral.userData.isRitualFX = true;
    this.scene.add(spiral);
    this._createdObjects.push(spiral);  // UNIFIED CLEANUP CONTRACT

    this.ritualVisuals.set('chaos_spiral', {
      object: spiral,
      type: 'spiral',
      targetOpacity: 0.85,
    });

    // Chaotic particles
    this.createParticleBurst(0xff0088, 90);

    // Random lightning bolts
    for (let i = 0; i < 5; i++) {
      const boltGeometry = new THREE.CylinderGeometry(0.1, 0.1, 30, 8);
      const boltMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0088,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      });

      const bolt = new THREE.Mesh(boltGeometry, boltMaterial);
      const angle = (i / 5) * Math.PI * 2;
      bolt.position.set(Math.cos(angle) * 20, 15, Math.sin(angle) * 20);
      bolt.renderOrder = this.renderOrder;
      bolt.userData.isRitualFX = true;
      this.scene.add(bolt);
      this._createdObjects.push(bolt);  // UNIFIED CLEANUP CONTRACT

      this.ritualVisuals.set(`chaos_bolt_${i}`, {
        object: bolt,
        type: 'chaos_bolt',
        targetOpacity: 0.9,
      });
    }
  }

  /**
   * MYTHIC_SIGNAL visuals
   */
  createMythicSignalVisuals(nodes) {
    // Perfect geometric mandala
    const layers = 4;
    for (let layer = 0; layer < layers; layer++) {
      const sides = 6 + layer * 2;
      const radius = 8 + layer * 5;

      const shape = new THREE.Shape();
      for (let i = 0; i <= sides; i++) {
        const angle = (i / sides) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (i === 0) {
          shape.moveTo(x, y);
        } else {
          shape.lineTo(x, y);
        }
      }

      const geometry = new THREE.ShapeGeometry(shape);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      });

      const mandala = new THREE.Mesh(geometry, material);
      mandala.rotation.x = Math.PI / 2;
      mandala.position.y = 10;
      mandala.renderOrder = this.renderOrder;
      mandala.userData.isRitualFX = true;
      this.scene.add(mandala);
      this._createdObjects.push(mandala);  // UNIFIED CLEANUP CONTRACT

      this.ritualVisuals.set(`mandala_layer_${layer}`, {
        object: mandala,
        type: 'mandala',
        targetOpacity: 0.45,
        rotationSpeed: 0.1 + layer * 0.05,
      });
    }

    this.createParticleBurst(0xffffff, 50);
  }

  /**
   * ECHO_RITUAL visuals
   */
  createEchoRitualVisuals(nodes) {
    // Echo waves expanding outward
    for (let i = 0; i < 6; i++) {
      const waveGeometry = new THREE.RingGeometry(5, 5.5, 32);
      const waveMaterial = new THREE.MeshBasicMaterial({
        color: 0x8888ff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      });

      const wave = new THREE.Mesh(waveGeometry, waveMaterial);
      wave.rotation.x = Math.PI / 2;
      wave.position.y = 5;
      wave.renderOrder = this.renderOrder;
      wave.userData.isRitualFX = true;
      this.scene.add(wave);
      this._createdObjects.push(wave);  // UNIFIED CLEANUP CONTRACT

      this.ritualVisuals.set(`echo_wave_${i}`, {
        object: wave,
        type: 'echo_wave',
        targetOpacity: 0.65,
        delay: i * 0.5,
        startTime: Date.now() / 1000,
      });
    }

    // Memory trails
    this.createParticleBurst(0x8888ff, 60);
  }

  /**
   * Create particle burst
   */
  createParticleBurst(color, count) {
    const actualCount = Math.ceil(count * 1.4);
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(actualCount * 3);
    const velocities = new Float32Array(actualCount * 3);

    for (let i = 0; i < actualCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3 + Math.random() * 12;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = 10 + r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      const i3 = i * 3;
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      // Outward drift velocity with slight upward bias
      const speed = 0.4 + Math.random() * 1.2;
      const len = Math.sqrt(x * x + (y - 10) * (y - 10) + z * z) || 1;
      velocities[i3] = (x / len) * speed;
      velocities[i3 + 1] = ((y - 10) / len) * speed + 0.25;
      velocities[i3 + 2] = (z / len) * speed;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color,
      size: 1.2,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(geometry, material);
    particles.renderOrder = this.renderOrder;
    particles.userData.isRitualFX = true;
    this.scene.add(particles);
    this._createdObjects.push(particles);

    const burstKey = `particle_burst_${this._ritualVisualId++}`;
    this.ritualVisuals.set(burstKey, {
      object: particles,
      type: 'particles',
      targetOpacity: 1.0,
      velocities,
    });
  }

  /**
   * Update active ritual
   */
  updateActiveRitual(deltaTime, nodes) {
    const currentTime = Date.now() / 1000;
    const timeInPhase = currentTime - this.ritualStartTime;

    // Get current phase duration
    const phaseDuration = this.phaseDurations[this.ritualPhase];

    // Calculate progress within phase
    this.ritualProgress = Math.min(timeInPhase / phaseDuration, 1.0);

    // Check for phase transition
    if (this.ritualProgress >= 1.0) {
      this.advanceRitualPhase();
    }

    // Update visuals based on phase
    this.updateRitualVisuals(deltaTime);

    // Apply world effects
    this.applyRitualWorldEffects(deltaTime);

    // Boost node glow
    this.updateNodeGlowBoosts(nodes, deltaTime);

    // Update player participation system
    if (this.ritualPlayer) {
      const intensity = this.getPhaseIntensity();
      this.ritualPlayer.update(
        deltaTime,
        true, // isRitualActive
        this.activeRitual,
        this.ritualPhase,
        intensity
      );
    }
  }

  /**
   * Advance to next ritual phase
   */
  advanceRitualPhase() {
    const phaseOrder = ['INIT', 'RISE', 'PEAK', 'FALL'];
    const currentIndex = phaseOrder.indexOf(this.ritualPhase);

    if (currentIndex < phaseOrder.length - 1) {
      this.ritualPhase = phaseOrder[currentIndex + 1];
      this.ritualStartTime = Date.now() / 1000;
      this.ritualProgress = 0;

      if (this.semanticBus) {
        const phasePayload = this._buildRitualEventPayload(this.activeRitual, this._currentRitualNodes, {
          phase: this.ritualPhase,
          progress: this.ritualProgress,
          phaseIntensity: this.getPhaseIntensity()
        });

        this.semanticBus.emit('semantic.ritual.phase', phasePayload, { priority: this.semanticBus.priority?.INTERACTIVE });

        if (this.ritualPhase === 'RISE') {
          this.semanticBus.emit('ritual.active', phasePayload, { priority: this.semanticBus.priority?.INTERACTIVE });
        } else if (this.ritualPhase === 'PEAK') {
          this.semanticBus.emit('ritual.crest', phasePayload, { priority: this.semanticBus.priority?.INTERACTIVE });
        } else if (this.ritualPhase === 'FALL') {
          this.semanticBus.emit('ritual.descend', phasePayload, { priority: this.semanticBus.priority?.INTERACTIVE });
        }
      }

      console.log(`Ritual phase: ${this.ritualPhase}`);
    } else {
      // Ritual complete
      this.endRitual();
    }
  }

  /**
   * Update ritual visuals
   */
  updateRitualVisuals(deltaTime) {
    const phaseIntensity = this.getPhaseIntensity();

    this.ritualVisuals.forEach((visual, key) => {
      if (!visual.object) return;

      switch (visual.type) {
        case 'beam':
          // Fade in/out based on phase
          if (visual.object.material) {
            visual.object.material.opacity = THREE.MathUtils.lerp(
              visual.object.material.opacity,
              visual.targetOpacity * phaseIntensity,
              0.05
            );
          }
          break;

        case 'ascending_ring':
          // Rise and fade with pulsing
          if (visual.object.material) {
            visual.object.material.opacity = THREE.MathUtils.lerp(
              visual.object.material.opacity,
              visual.targetOpacity * phaseIntensity,
              0.05
            );

            visual.object.position.y = visual.startHeight + this.ritualProgress * 20;
            visual.object.rotation.z += deltaTime * 0.5;
            // Scale pulse — rings breathe as they ascend
            const ringPulse = 1.0 + Math.sin(Date.now() / 500 + visual.startHeight) * 0.08;
            visual.object.scale.setScalar(ringPulse);
          }
          break;

        case 'fissure':
          // Glitch effect
          if (visual.object.material) {
            visual.object.material.opacity = visual.targetOpacity * phaseIntensity *
              (0.8 + Math.sin(Date.now() / 100) * 0.2);

            visual.object.rotation.y = Math.sin(Date.now() / 200) * 0.1;
          }
          break;

        case 'fissure_ring':
          // Expand and rotate
          if (visual.object.material) {
            visual.object.material.opacity = THREE.MathUtils.lerp(
              visual.object.material.opacity,
              visual.targetOpacity * phaseIntensity,
              0.05
            );

            visual.object.rotation.x += deltaTime * 2;
            visual.object.rotation.y += deltaTime;
          }
          break;

        case 'converging_beam':
          // Move toward center
          if (visual.object.material) {
            visual.object.material.opacity = THREE.MathUtils.lerp(
              visual.object.material.opacity,
              visual.targetOpacity * phaseIntensity,
              0.05
            );
          }
          break;

        case 'harmony_sphere':
          // Dramatic pulse
          if (visual.object.material) {
            visual.object.material.opacity = THREE.MathUtils.lerp(
              visual.object.material.opacity,
              visual.targetOpacity * phaseIntensity,
              0.05
            );

            const pulseFactor = 1 + Math.sin(Date.now() / 300) * 0.3 * phaseIntensity;
            visual.object.scale.setScalar(pulseFactor);
          }
          break;

        case 'orbiting_mote':
          // Orbit around harmony sphere center
          if (visual.object.material) {
            visual.object.material.opacity = THREE.MathUtils.lerp(
              visual.object.material.opacity,
              visual.targetOpacity * phaseIntensity,
              0.05
            );
            const t = Date.now() / 1000;
            const angle = visual.orbitAngle + t * visual.orbitSpeed;
            const r = visual.orbitRadius;
            visual.object.position.set(
              Math.cos(angle) * r,
              5 + Math.sin(angle * 0.7 + visual.orbitTilt) * 2,
              Math.sin(angle) * r
            );
          }
          break;

        case 'spiral':
          // Rotate
          if (visual.object.material) {
            visual.object.material.opacity = THREE.MathUtils.lerp(
              visual.object.material.opacity,
              visual.targetOpacity * phaseIntensity,
              0.05
            );

            visual.object.rotation.y += deltaTime;
          }
          break;

        case 'chaos_bolt':
          // Sinusoidal flicker — more organic than random
          if (visual.object.material) {
            const flicker = 0.25 + Math.abs(Math.sin(Date.now() / 80 + visual.object.position.x * 10)) * 0.75;
            visual.object.material.opacity = visual.targetOpacity * phaseIntensity * flicker;
          }
          break;

        case 'mandala':
          // Rotate layers with breathing
          if (visual.object.material) {
            visual.object.material.opacity = THREE.MathUtils.lerp(
              visual.object.material.opacity,
              visual.targetOpacity * phaseIntensity,
              0.05
            );

            visual.object.rotation.z += deltaTime * visual.rotationSpeed;
            // Breathing scale — sacred geometry breathes
            const breath = 1.0 + Math.sin(Date.now() / 800 + visual.rotationSpeed * 10) * 0.05;
            visual.object.scale.setScalar(breath);
          }
          break;

        case 'echo_wave':
          // Expand
          if (visual.object.material) {
            const timeSinceStart = Date.now() / 1000 - visual.startTime;
            const waveProgress = Math.max(0, timeSinceStart - visual.delay) / 3.0;

            if (waveProgress > 0 && waveProgress < 1) {
              const scale = 1 + waveProgress * 5;
              visual.object.scale.setScalar(scale);
              visual.object.material.opacity = visual.targetOpacity * phaseIntensity * (1 - waveProgress);
            }
          }
          break;

        case 'particles':
          // Fade in/out with outward drift
          if (visual.object.material) {
            visual.object.material.opacity = THREE.MathUtils.lerp(
              visual.object.material.opacity,
              visual.targetOpacity * phaseIntensity,
              0.05
            );
            // Drift particles outward
            if (visual.velocities && visual.object.geometry) {
              const pos = visual.object.geometry.attributes.position;
              const vel = visual.velocities;
              for (let i = 0; i < pos.count; i++) {
                const i3 = i * 3;
                pos.array[i3] += vel[i3] * deltaTime;
                pos.array[i3 + 1] += vel[i3 + 1] * deltaTime;
                pos.array[i3 + 2] += vel[i3 + 2] * deltaTime;
              }
              pos.needsUpdate = true;
            }
          }
          break;
      }
    });
  }

  /**
   * Get intensity multiplier based on current phase
   */
  getPhaseIntensity() {
    switch (this.ritualPhase) {
      case 'INIT':
        return this.ritualProgress; // Fade in

      case 'RISE':
        return 0.5 + this.ritualProgress * 0.5; // Build to 1.0

      case 'PEAK':
        return 1.0; // Full intensity

      case 'FALL':
        return 1.0 - this.ritualProgress; // Fade out

      default:
        return 0;
    }
  }

  /**
   * Apply ritual-specific world effects
   */
  applyRitualWorldEffects(deltaTime) {
    const intensity = this.getPhaseIntensity();

    // Sky color shift
    if (this.scene.background && this.scene.background.isColor) {
      const targetColor = this.getRitualSkyColor();
      this.scene.background.lerp(targetColor, intensity * 0.03);
    }

    // Fog color shift
    if (this.scene.fog) {
      const targetFogColor = this.getRitualFogColor();
      this.scene.fog.color.lerp(targetFogColor, intensity * 0.03);
    }
  }

  /**
   * Get target sky color for active ritual
   */
  getRitualSkyColor() {
    const colors = {
      'ASCENSION_RITUAL': new THREE.Color(0x112244),
      'QUANTUM_FISSURE': new THREE.Color(0x220044),
      'HARMONY_CONVERGENCE': new THREE.Color(0x002244),
      'CHAOS_RITUAL': new THREE.Color(0x330011),
      'MYTHIC_SIGNAL': new THREE.Color(0x111122),
      'ECHO_RITUAL': new THREE.Color(0x112233),
    };

    return colors[this.activeRitual] || new THREE.Color(0x000011);
  }

  /**
   * Get target fog color for active ritual
   */
  getRitualFogColor() {
    const colors = {
      'ASCENSION_RITUAL': new THREE.Color(0x224466),
      'QUANTUM_FISSURE': new THREE.Color(0x440088),
      'HARMONY_CONVERGENCE': new THREE.Color(0x004466),
      'CHAOS_RITUAL': new THREE.Color(0x660022),
      'MYTHIC_SIGNAL': new THREE.Color(0x222244),
      'ECHO_RITUAL': new THREE.Color(0x224466),
    };

    return colors[this.activeRitual] || new THREE.Color(0x000022);
  }

  /**
   * Update node glow boosts during ritual
   *
   * PHASE 3 - VISUAL AUTHORITY GUARD:
   * Only modify node glows if the node visual is ready.
   * Prevents premature glow modifications before primary visuals bootstrap.
   */
  updateNodeGlowBoosts(nodes, deltaTime) {
    const intensity = this.getPhaseIntensity();

    nodes.forEach(node => {
      if (!node?.material) return;
      if (node.material.emissiveIntensity === undefined) return;

      // Phase 3 Guard: Only boost glows if node visual is ready
      if (!node?.userData?.visualReady) return;

      // Store original intensity
      if (!this.nodeGlowBoosts.has(node.uuid)) {
        this.nodeGlowBoosts.set(node.uuid, {
          original: node.material.emissiveIntensity || 0.5,
        });
      }

      const boost = this.nodeGlowBoosts.get(node.uuid);
      const targetIntensity = boost.original * (1 + intensity * 0.5);

      node.material.emissiveIntensity = THREE.MathUtils.lerp(
        node.material.emissiveIntensity,
        targetIntensity,
        0.05
      );
    });
  }

  /**
   * End ritual and cleanup
   */
  endRitual() {
    const completedRitualType = this.activeRitual;
    console.log(`✨ MYTHIC RITUAL COMPLETE: ${completedRitualType}`);

    // Cleanup all visuals
    this.ritualVisuals.forEach((visual, key) => {
      if (visual.object) {
        this.scene.remove(visual.object);

        if (visual.object.geometry) {
          visual.object.geometry.dispose();
        }

        if (visual.object.material) {
          if (Array.isArray(visual.object.material)) {
            visual.object.material.forEach(m => m.dispose());
          } else {
            visual.object.material.dispose();
          }
        }
      }
    });

    this.ritualVisuals.clear();

    // Restore node glow
    this.nodeGlowBoosts.forEach((boost, uuid) => {
      const node = this.scene?.getObjectByProperty?.('uuid', uuid);
      if (node && node.material && node.material.emissiveIntensity !== undefined) {
        node.material.emissiveIntensity = boost.original;
      }
    });

    this.nodeGlowBoosts.clear();

    // Restore world state
    if (this.worldStateBackup) {
      if (this.scene.background && this.worldStateBackup.skyColor) {
        this.scene.background.copy(this.worldStateBackup.skyColor);
      }

      if (this.scene.fog && this.worldStateBackup.fogColor) {
        this.scene.fog.color.copy(this.worldStateBackup.fogColor);
      }
    }

    // EMIT EVENT FOR EVENT-DRIVEN SYSTEMS
    if (this.semanticBus) {
      const completionPayload = this._buildRitualEventPayload(completedRitualType, this._currentRitualNodes, {
        phase: 'COMPLETED',
        progress: 1,
        phaseIntensity: 0,
        success: true
      });
      this.semanticBus.emit('semantic.ritual.completed', completionPayload, { priority: this.semanticBus.priority.INTERACTIVE });
      this.semanticBus.emit('ritual.release', completionPayload, { priority: this.semanticBus.priority.INTERACTIVE });
      console.log(`✓ Ritual completed event emitted: ${completedRitualType}`);
    }
    this._emitMetricBridgeForRitual(completedRitualType, 'completed');

    // Reset state
    this.activeRitual = null;
    this._currentRitualNodes = [];
    this.ritualPhase = 'NONE';
    this.ritualProgress = 0;
  }

  /**
   * Update HUD
   */
  updateHUD(deltaTime) {
    if (!this.ritualHUD) return;

    if (this.activeRitual && this.ritualPhase !== 'NONE') {
      // Show HUD
      const targetOpacity = this.ritualPhase === 'INIT' ? 1.0 :
                          this.ritualPhase === 'FALL' ? 1.0 - this.ritualProgress :
                          0.8;

      this.hudFadeProgress = THREE.MathUtils.lerp(
        this.hudFadeProgress,
        targetOpacity,
        0.1
      );

      this.ritualHUD.style.opacity = this.hudFadeProgress;

      // Update text
      const ritualName = this.activeRitual.replace(/_/g, ' ');
      this.ritualHUD.textContent = `✦ MYTHIC RITUAL: ${ritualName} ✦`;
    } else {
      // Fade out HUD
      this.hudFadeProgress = Math.max(0, this.hudFadeProgress - deltaTime * 2);
      this.ritualHUD.style.opacity = this.hudFadeProgress;
    }
  }

  /**
   * Force cancel ritual (for cleanup/debugging)
   */
  cancelRitual() {
    if (this.activeRitual) {
      console.warn('Cancelling active ritual');
      this.endRitual();
    }
  }

  /**
   * Get current ritual state
   */
  getRitualState() {
    return {
      activeRitual: this.activeRitual,
      phase: this.ritualPhase,
      progress: this.ritualProgress,
      intensity: this.getPhaseIntensity(),
      activeVisuals: this.ritualVisuals.size,
    };
  }

  /**
   * Destroy controller (cleanup)
   */
  destroy() {
    this._disposeWorldMoodBridge();
    this.cancelRitual();
    if (this.ritualPlayer?.destroy) {
      this.ritualPlayer.destroy();
    }

    // Remove HUD
    if (this.ritualHUD && this.ritualHUD.parentNode) {
      this.ritualHUD.parentNode.removeChild(this.ritualHUD);
    }
  }

  _resolveMetricBus() {
    if (globalThis?.ATOMA_BUS || globalThis?.semanticBus) {
      return globalThis.ATOMA_BUS || globalThis.semanticBus || null;
    }

    const browserWindow = typeof window !== 'undefined' ? window : null;
    return browserWindow?.ATOMA_BUS || browserWindow?.semanticBus || null;
  }

  _setupWorldMoodBridge() {
    const bus = this.metricBus || this._resolveMetricBus();
    if (!bus?.subscribe) {
      this._worldMoodBridgeActive = false;
      return;
    }

    this.metricBus = bus;
    this._worldMoodBridgeActive = true;

    const handleWorldMood = (payload = {}) => {
      this.latestWorldMood = this._normalizeWorldMoodSnapshot(payload);
      this.latestWorldMoodAt = Date.now() / 1000;
      this.pendingRitualEvaluation = true;
    };

    this._registerWorldMoodSubscription('world.mood.snapshot', handleWorldMood);
    this._registerWorldMoodSubscription('world.mood.changed', handleWorldMood);

    if (this.worldController?.worldMood) {
      this.latestWorldMood = this._normalizeWorldMoodSnapshot({
        ...this.worldController.worldMood,
        source: 'WorldPersonalityController',
      });
      this.pendingRitualEvaluation = true;
    }
  }

  _registerWorldMoodSubscription(eventName, handler) {
    const bus = this.metricBus;
    if (!bus?.subscribe) return;

    const unsubscribe = bus.subscribe(eventName, handler);
    if (typeof unsubscribe === 'function') {
      this._worldMoodBridgeSubscriptions.push(unsubscribe);
      return;
    }

    if (typeof bus.unsubscribe === 'function') {
      this._worldMoodBridgeSubscriptions.push(() => bus.unsubscribe(eventName, handler));
    }
  }

  _disposeWorldMoodBridge() {
    while (this._worldMoodBridgeSubscriptions.length > 0) {
      const unsubscribe = this._worldMoodBridgeSubscriptions.pop();
      try {
        if (typeof unsubscribe === 'function') unsubscribe();
      } catch (err) {
        console.warn('[MythicRitualController] World mood bridge cleanup failed:', err);
      }
    }

    this._worldMoodBridgeActive = false;
  }

  _normalizeWorldMoodSnapshot(payload) {
    const mood = payload?.mood && typeof payload.mood === 'object' ? payload.mood : payload;
    return {
      label: mood?.label ?? 'NEUTRAL',
      intensity: Number.isFinite(mood?.intensity) ? mood.intensity : 0,
      dominantPersonality: mood?.dominantPersonality ?? null,
      avgHarmony: Number.isFinite(mood?.avgHarmony) ? mood.avgHarmony : 0,
      avgStability: Number.isFinite(mood?.avgStability) ? mood.avgStability : 0,
      avgClarity: Number.isFinite(mood?.avgClarity) ? mood.avgClarity : 0,
      avgEnergy: Number.isFinite(mood?.avgEnergy) ? mood.avgEnergy : 0,
      ascendedCount: Number.isFinite(mood?.ascendedCount) ? mood.ascendedCount : 0,
      nodeCount: Number.isFinite(mood?.nodeCount) ? mood.nodeCount : 0,
      previousLabel: mood?.previousLabel ?? null,
      moodChanged: !!mood?.moodChanged,
    };
  }

  _countAscendedNodes(nodes) {
    return (Array.isArray(nodes) ? nodes : []).filter(node =>
      node?.userData?.personality?.type === 'ASCENDED_MYTHIC'
    ).length;
  }

  _getNodeId(node) {
    return node?.id ?? node?.userData?.id ?? node?.userData?.nodeId ?? null;
  }

  _emitMetricBridgeForRitual(ritualType, phase) {
    if (!this.semanticBus || !ritualType) return;

    const emit = (metric, tier, value = 1) => {
      this.semanticBus.emit(buildScopedMetricEventName('global', metric, tier), {
        ritualType,
        phase,
        scope: 'global',
        metric,
        tier,
        value,
        timestamp: performance.now(),
        source: 'MythicRitualController'
      }, { priority: this.semanticBus.priority?.INTERACTIVE });
    };

    switch (ritualType) {
      case 'ASCENSION_RITUAL':
      case 'HARMONY_CONVERGENCE':
        emit(phase === 'completed' ? 'ritual.visual.harmony.completed' : 'ritual.visual.harmony.started');
        emit('harmony', 'high');
        break;
      case 'QUANTUM_FISSURE':
        emit('stability', 'high');
        break;
      case 'CHAOS_RITUAL':
        emit('stability', 'high');
        emit('loadPressure', 'mid', 0.65);
        break;
      case 'MYTHIC_SIGNAL':
        emit('synergy', 'high');
        break;
      case 'ECHO_RITUAL':
        emit('synergy', 'mid', 0.55);
        emit('harmony', 'mid', 0.55);
        break;
      default:
        break;
    }
  }
  
  /**
   * UNIFIED CLEANUP CONTRACT - Dispose all resources
   */
  dispose() {
    // Cancel active ritual
    this.cancelRitual();
    
    // Remove and dispose all created objects
    this._createdObjects.forEach(obj => {
      this.scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    this._createdObjects = [];
    
    // Clear ritual visuals map
    this.ritualVisuals.clear();
    
    // Clear node glow boosts
    this.nodeGlowBoosts.clear();
    
    // Dispose world mood bridge
    this._disposeWorldMoodBridge();
    
    // Dispose ritual player
    if (this.ritualPlayer && typeof this.ritualPlayer.dispose === 'function') {
      this.ritualPlayer.dispose();
      this.ritualPlayer = null;
    }
    
    // Remove HUD
    if (this.ritualHUD?.parentNode) {
      this.ritualHUD.parentNode.removeChild(this.ritualHUD);
      this.ritualHUD = null;
    }
  }
}
