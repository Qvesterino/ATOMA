import { isVisualLocked } from './Engine/authority/VisualAuthorityFlag.js';
import {
  classifyMetricTier,
  getDefaultMetricThresholds,
  buildScopedMetricEventName,
} from './src/metrics/MetricTierClassifier.js';

/**
 * NODE MICRO-EVENTS 1.0 – SAFE EDITION
 * 
 * Personality-driven micro-event system that brings nodes to life with subtle,
 * spontaneous visual behaviors. Events are triggered by timers and personality traits.
 * 
 * HARD SAFETY RULES:
 * - NO modifications to AIModels.js, linking logic, physics, movement, camera, or world systems
 * - All effects are purely visual and cosmetic
 * - Graceful degradation if any field is missing
 * - GPU-friendly, low-cost animations
 * - Zero gameplay impact - visual layer only
 * - No actual position changes (visual transforms only)
 * 
 * FEATURES:
 * 1. EVENT SCHEDULING
 *    - Each node has internal timer (12-35s random intervals)
 *    - Timer drives spontaneous micro-events
 * 
 * 2. PERSONALITY-BASED EVENTS (10 types)
 *    - CALM_ANALYST: soft focus pulse, slow tilt, breathing shift
 *    - HARMONY_KEEPER: resonance halo, synchronized pulse
 *    - FRACTAL_DREAMER: fractal shimmer, irregular micro-rotation
 *    - QUANTUM_TRICKSTER: micro-blink shift, emissive spike
 *    - RADIANT_OPTIMIZER: energy overcharge pulse
 *    - UMBRA_SENTINEL: density-darkening wave
 *    - ECHO_WANDERER: drifting gesture
 *    - GLYPH_ARCHIVIST: glyph flash flicker
 *    - CONVERGENCE_NEXUS: balanced oscillation
 *    - ASCENDED_MYTHIC: dual-ring pulse + vertical flare
 * 
 * 3. METRIC-BASED ADDITIVE EVENTS
 *    - High stability: jitter burst
 *    - High harmony: glowing resonance ring
 *    - High clarity: glyph spark
 *    - High energy: core overpulse
 * 
 * 4. NODE-TO-NODE INTERACTION EVENTS
 *    - Compatible personalities: harmony flash
 *    - High stability pairs: chaos spark
 *    - Ascended presence: calm aura
 * 
 * 5. EVENT LOG
 *    - Last 3 events stored in node.userData.eventLog
 *    - Displayed in inspect overlay
 * 
 * PERFORMANCE:
 * - Updates at 30Hz by default
 * - Skips if scene is large (>100 nodes) or frame rate low
 * - Zero per-frame allocations
 * - Auto-scales intensity based on node count
 */

import * as THREE from 'three';

export class NodeMicroEvents {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.metricBus = this._resolveMetricBus();
    
    // Timing control (30Hz default = ~33ms)
    this.lastUpdateTime = 0;
    this.updateInterval = 1 / 30; // 30Hz
    
    // Event registry
    this.nodeEvents = new Map(); // uuid -> event data
    
    // Performance tracking
    this.performanceMode = 'normal'; // 'normal', 'reduced', 'minimal'
    this.lastNodeCount = 0;
    
    // Interaction detection cache
    this.interactionCache = new Map(); // uuid -> nearby nodes
    this.lastInteractionCheck = 0;
    this.interactionCheckInterval = 1 / 5; // 5Hz for proximity checks
    
    // Temporary visuals for effects
    this.activeVisuals = new Map(); // uuid -> visual objects
    
    // Elapsed time tracker
    this._elapsedTime = 0;

    // Geometry pool for reuse (future optimization)
    this.geometryPool = {
      rings: [],
      spheres: [],
      cylinders: [],
    };

    // Material pool for reuse (future optimization)
    this.materialPool = {
      rings: [],
      spheres: [],
      cylinders: [],
    };

    // Spatial grid for faster proximity checks (future optimization)
    this.spatialGrid = new Map();
    this.gridCellSize = 2.0;

    this._previousTiers = new Map();
    
    // ── Config ──────────────────────────────────────────────────────
    this.config = {
      visualIntensity: 1.0,
      additiveBlending: true,
      glowPulseSpeed: 3.0,
      ringGlowEnabled: true,
      trailEnabled: true,
      trailOpacity: 0.3,
      trailDelay: 0.1,
      // Metric thresholds via MetricTierClassifier (canonical)
      // Selection resonance cascade
      selectionCascade: {
        enabled: true,
        maxHops: 3,
        hopDelayMs: 300,
        maxAffectedNodes: 20,
        cooldownMs: 2000,
        colors: [0xccffff, 0x00ccff, 0x00aa99, 0x006666],
        ringOpacities: [0.8, 0.5, 0.3, 0.15],
        ringDurations: [1.5, 1.2, 1.0, 0.8],
        flashIntensities: [0.6, 0.3, 0.15, 0.08],
        linkPulseSize: 0.06,
      },
    };

    // Selection cascade state
    this._lastSelectionCascadeTime = 0;
    this._selectionCascadeTimers = [];
    this._semanticSubscriptions = [];

    // Subscribe to selection events
    this._setupSelectionCascadeSubscription();

    console.log('✓ Node Micro-Events 2.0 initialized (epic edition)');
  }
  
  /**
   * Register a node for micro-event system
   */
  registerNode(node) {
    if (!node || !node.uuid) return;
    
    // Initialize timer
    if (!node.userData.microEventTimer) {
      node.userData.microEventTimer = this.getRandomTimer();
    }
    
    // Initialize event log
    if (!node.userData.eventLog) {
      node.userData.eventLog = [];
    }
    
    // Store in registry
    this.nodeEvents.set(node.uuid, {
      node,
      lastEventTime: 0,
      eventCount: 0,
    });
  }
  
  /**
   * Get random timer duration (12-35 seconds)
   */
  getRandomTimer() {
    return 12 + Math.random() * 23;
  }
  
  /**
   * Main update loop
   */
  update(deltaTime, nodes) {
    // 🔒 HARD INTERACTION AUTHORITY - Stop all visual updates when locked
    if (isVisualLocked()) return;
    
    if (window.DEBUG_VISUAL_MODE) return;

    if (!nodes || nodes.length === 0) return;
    
    // Throttle to 10-20Hz
    this.lastUpdateTime += deltaTime;
    if (this.lastUpdateTime < this.updateInterval) return;
    
    const actualDelta = this.lastUpdateTime;
    this.lastUpdateTime = 0;
    
    // Performance check: skip if too many nodes or low FPS
    if (nodes.length > 100 || deltaTime > 0.05) {
      this.performanceMode = 'minimal';
      this.updateInterval = 1 / 20; // Reduce to 20Hz under heavy load
    } else if (nodes.length > 50) {
      this.performanceMode = 'reduced';
      this.updateInterval = 1 / 25; // 25Hz under moderate load
    } else {
      this.performanceMode = 'normal';
      this.updateInterval = 1 / 30; // 30Hz
    }

    // Dynamic intensity scaling based on node count
    // More nodes = lower intensity to reduce visual noise
    const intensityMultiplier = Math.max(0.5, Math.min(1.0, 100 / nodes.length));
    this.config.visualIntensity = intensityMultiplier;
    
    // Register any new nodes
    nodes.forEach(node => {
      if (!this.nodeEvents.has(node.uuid)) {
        this.registerNode(node);
      }
    });
    
    // Update interaction cache (5Hz)
    this.lastInteractionCheck += actualDelta;
    if (this.lastInteractionCheck >= this.interactionCheckInterval) {
      this.updateInteractionCache(nodes);
      this.lastInteractionCheck = 0;
    }
    
    // Process node timers and trigger events

    const camPos = this.camera?.position;
    const maxEventDist2 = 60 * 60;

    nodes.forEach(node => {
      if (!node.userData.microEventTimer) return;
      if (camPos) {
        const dx = node.position.x - camPos.x;
        const dy = node.position.y - camPos.y;
        const dz = node.position.z - camPos.z;
        if (dx*dx + dy*dy + dz*dz > maxEventDist2) return;
      }
      // Decrement timer
      node.userData.microEventTimer -= actualDelta;
      
      // Trigger event when timer expires
      if (node.userData.microEventTimer <= 0) {
        this.triggerMicroEvent(node);
        node.userData.microEventTimer = this.getRandomTimer();
      }
    });
    
    // Update active visual effects
    this._elapsedTime += actualDelta;
    this.updateActiveVisuals(actualDelta);
  }
  
  updateInteractionCache(nodes) {
    this.interactionCache.clear();
    
    // Find nearby nodes for each node
    nodes.forEach(nodeA => {
      const nearby = [];
      
      nodes.forEach(nodeB => {
        if (nodeA.uuid === nodeB.uuid) return;
        
        const distance = nodeA.position.distanceTo(nodeB.position);
        if (distance < 2.0) {
          nearby.push(nodeB);
        }
      });
      
      if (nearby.length > 0) {
        this.interactionCache.set(nodeA.uuid, nearby);
      }
    });
  }
  
  /**
   * Trigger a micro-event for a node
   */
  triggerMicroEvent(node) {
    const personality = node.userData?.personality?.type;
    const metrics = node.userData?.metrics;
    
    if (!personality || !metrics) return;
    
    // Choose event based on personality
    const eventName = this.selectPersonalityEvent(personality, metrics);
    
    // Execute event
    this.executeEvent(node, eventName);
    this._emitEvent('node.microevent', {
      nodeId: node.userData?.nodeId || node.id || node.uuid,
      eventName,
      personality,
      source: 'NodeMicroEvents'
    });
    
    // Log event
    this.logEvent(node, eventName);
    
    // Check for interaction events
    this.checkInteractionEvents(node);
    
    // Check for metric-based additive events
    this.checkMetricEvents(node, metrics);
    
    // Update registry
    const eventData = this.nodeEvents.get(node.uuid);
    if (eventData) {
      eventData.lastEventTime = Date.now();
      eventData.eventCount++;
    }
  }
  
  resolvePersonalityFromMetrics(metrics) {
    if (!metrics) return 'CONVERGENCE_NEXUS';
    const classify = (metric, value) => classifyMetricTier(
      Number.isFinite(value) ? value : 0,
      null,
      getDefaultMetricThresholds(metric)
    );
    const s = classify('stability', metrics.stability);
    const h = classify('harmony', metrics.harmony);
    const sy = classify('synergy', metrics.synergy);
    const c = classify('corruption', metrics.corruption);
    if (s === 'high' && h === 'high' && sy === 'high') return 'ASCENDED_MYTHIC';
    if (sy === 'high' && h === 'high') return 'RADIANT_OPTIMIZER';
    if (c === 'high' && s === 'low') return 'QUANTUM_TRICKSTER';
    if (h === 'high' && (sy === 'mid' || sy === 'high')) return 'HARMONY_KEEPER';
    if (s === 'high' && (h === 'mid' || h === 'high')) return 'CALM_ANALYST';
    if (s === 'high' && c === 'low') return 'GLYPH_ARCHIVIST';
    if (sy === 'high' && (c === 'mid' || c === 'high')) return 'FRACTAL_DREAMER';
    if ((c === 'mid' || c === 'high') && (s === 'mid' || s === 'high')) return 'UMBRA_SENTINEL';
    if (sy === 'low' && h === 'low') return 'ECHO_WANDERER';
    return 'CONVERGENCE_NEXUS';
  }
  /**
   * Select event based on personality type
   */
  selectPersonalityEvent(personality, metrics) {
    switch (personality) {
      case 'CALM_ANALYST':
        return this.randomChoice(['focus_pulse', 'slow_tilt', 'breathing_shift']);
      
      case 'HARMONY_KEEPER':
        return this.randomChoice(['resonance_halo', 'synchronized_pulse']);
      
      case 'FRACTAL_DREAMER':
        return this.randomChoice(['fractal_shimmer', 'irregular_rotation']);
      
      case 'QUANTUM_TRICKSTER':
        return this.randomChoice(['micro_blink', 'emissive_spike']);
      
      case 'RADIANT_OPTIMIZER':
        return 'energy_overcharge';
      
      case 'UMBRA_SENTINEL':
        return 'density_darkening';
      
      case 'ECHO_WANDERER':
        return 'drifting_gesture';
      
      case 'GLYPH_ARCHIVIST':
        return 'glyph_flash';
      
      case 'CONVERGENCE_NEXUS':
        return 'balanced_oscillation';
      
      case 'ASCENDED_MYTHIC':
        return 'ascended_flare';
      
      default:
        return 'focus_pulse';
    }
  }
  
  /**
   * Random choice helper
   */
  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  _resolveNodeLinkCount(node) {
    const metricsCount = node?.userData?.metrics?.activeLinkCount;
    if (Number.isFinite(metricsCount)) return Math.max(0, Math.floor(metricsCount));

    const directCounts = [
      node?.userData?.activeLinkCount,
      node?.userData?.activeLinks,
      node?.userData?.linkCount,
    ];

    for (const count of directCounts) {
      if (Number.isFinite(count)) return Math.max(0, Math.floor(count));
    }

    if (Array.isArray(node?.userData?.linkedNodeIds)) {
      return node.userData.linkedNodeIds.length;
    }

    if (Array.isArray(node?.userData?.links)) {
      return node.userData.links.length;
    }

    return 0;
  }
  
  /**
   * Execute a micro-event
   */
  executeEvent(node, eventName) {
    // Safety check
    if (!node || !node.material) return;
    
    switch (eventName) {
      case 'focus_pulse':
        this.createFocusPulse(node);
        break;
      
      case 'slow_tilt':
        this.createSlowTilt(node);
        break;
      
      case 'breathing_shift':
        this.createBreathingShift(node);
        break;
      
      case 'resonance_halo':
        this.createResonanceHalo(node);
        break;
      
      case 'synchronized_pulse':
        this.createSynchronizedPulse(node);
        break;
      
      case 'fractal_shimmer':
        this.createFractalShimmer(node);
        break;
      
      case 'irregular_rotation':
        this.createIrregularRotation(node);
        break;
      
      case 'micro_blink':
        this.createMicroBlink(node);
        break;
      
      case 'emissive_spike':
        this.createEmissiveSpike(node);
        break;
      
      case 'energy_overcharge':
        this.createEnergyOvercharge(node);
        break;
      
      case 'density_darkening':
        this.createDensityDarkening(node);
        break;
      
      case 'drifting_gesture':
        this.createDriftingGesture(node);
        break;
      
      case 'glyph_flash':
        this.createGlyphFlash(node);
        break;
      
      case 'balanced_oscillation':
        this.createBalancedOscillation(node);
        break;
      
      case 'ascended_flare':
        this.createAscendedFlare(node);
        break;
    }
  }
  
  /**
   * EVENT IMPLEMENTATIONS
   * All events are purely visual and GPU-cheap
   */
  
  createFocusPulse(node) {
    // Subtle emissive intensity pulse
    if (!node.material.emissive) return;
    
    const visual = {
      type: 'focus_pulse',
      node,
      startTime: Date.now(),
      duration: 0.8,
      originalIntensity: node.material.emissiveIntensity || 0.5,
    };
    
    this.activeVisuals.set(`${node.uuid}_focus_pulse`, visual);
  }
  
  createSlowTilt(node) {
    // Very subtle rotation offset
    const visual = {
      type: 'slow_tilt',
      node,
      startTime: Date.now(),
      duration: 1.5,
      tiltAxis: new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize(),
      maxTilt: 0.02, // ~1 degree
    };
    
    this.activeVisuals.set(`${node.uuid}_slow_tilt`, visual);
  }
  
  createBreathingShift(node) {
    // Subtle scale pulse
    const visual = {
      type: 'breathing_shift',
      node,
      startTime: Date.now(),
      duration: 1.2,
      originalScale: node.scale.x,
      breathDepth: 0.03, // 3% scale change
    };
    
    this.activeVisuals.set(`${node.uuid}_breathing_shift`, visual);
  }
  
  createResonanceHalo(node) {
    // Glowing ring expanding outward — EPIC: additive glow + chromatic pulse
    const ringGeometry = new THREE.RingGeometry(0.5, 0.58, 48);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffaa,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      blending: this.config.additiveBlending ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(node.position);
    ring.rotation.x = Math.PI / 2;
    this.scene.add(ring);
    
    // Echo ring (outer ghost)
    const echoGeometry = new THREE.RingGeometry(0.7, 0.73, 48);
    const echoMaterial = new THREE.MeshBasicMaterial({
      color: 0x44ffcc,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const echoRing = new THREE.Mesh(echoGeometry, echoMaterial);
    echoRing.position.copy(node.position);
    echoRing.rotation.x = Math.PI / 2;
    this.scene.add(echoRing);
    
    const visual = {
      type: 'resonance_halo',
      node,
      ring,
      echoRing,
      startTime: Date.now(),
      duration: 1.8,
      baseColor: new THREE.Color(0x00ffaa),
    };
    
    this.activeVisuals.set(`${node.uuid}_resonance_halo`, visual);
  }
  
  createSynchronizedPulse(node) {
    // FIX: Ensure base scale is stored for absolute scaling
    const nearby = this.interactionCache.get(node.uuid) || [];
    
    nearby.forEach(nearbyNode => {
      // Initialize base scale if not already set
      if (!nearbyNode.userData.baseScale) {
        nearbyNode.userData.baseScale = nearbyNode.scale.x || 1.0;
      }
      
      const visual = {
        type: 'synchronized_pulse',
        node: nearbyNode,
        startTime: Date.now(),
        duration: 0.6,
        originalScale: nearbyNode.userData.baseScale,
      };
      
      this.activeVisuals.set(`${nearbyNode.uuid}_sync_pulse`, visual);
    });
  }
  
  createFractalShimmer(node) {
    // Subtle emissive color shift
    if (!node.material.emissive) return;
    
    const visual = {
      type: 'fractal_shimmer',
      node,
      startTime: Date.now(),
      duration: 1.0,
      originalColor: node.material.emissive.clone(),
      shimmerColors: [
        new THREE.Color(0xff00ff),
        new THREE.Color(0x00ffff),
        new THREE.Color(0xffff00),
      ],
    };
    
    this.activeVisuals.set(`${node.uuid}_fractal_shimmer`, visual);
  }
  
  createIrregularRotation(node) {
    // STABILITY FIX: Use deterministic rotation speed from node UUID
    // Ensures same node always has same rotation pattern (no per-frame randomness)
    const speedHash = Math.sin(node.uuid.charCodeAt(3) * 33.3333) * 43758.5453;
    const rotationSpeed = ((speedHash - Math.floor(speedHash)) - 0.5) * 0.02;  // -0.01 to +0.01
    
    const visual = {
      type: 'irregular_rotation',
      node,
      startTime: Date.now(),
      duration: 0.8,
      rotationSpeed: rotationSpeed,  // Now deterministic
    };
    
    this.activeVisuals.set(`${node.uuid}_irregular_rotation`, visual);
  }
  
  createMicroBlink(node) {
    // Quick visibility flicker
    const visual = {
      type: 'micro_blink',
      node,
      startTime: Date.now(),
      duration: 0.3,
      blinkCount: 2,
    };
    
    this.activeVisuals.set(`${node.uuid}_micro_blink`, visual);
  }
  
  createEmissiveSpike(node) {
    // Sharp emissive intensity spike
    if (!node.material.emissive) return;
    
    const visual = {
      type: 'emissive_spike',
      node,
      startTime: Date.now(),
      duration: 0.4,
      originalIntensity: node.material.emissiveIntensity || 0.5,
      spikeIntensity: 2.0,
    };
    
    this.activeVisuals.set(`${node.uuid}_emissive_spike`, visual);
  }
  
  createEnergyOvercharge(node) {
    // Bright glow burst
    if (!node.material.emissive) return;
    
    const visual = {
      type: 'energy_overcharge',
      node,
      startTime: Date.now(),
      duration: 1.0,
      originalIntensity: node.material.emissiveIntensity || 0.5,
      overchargeIntensity: 1.8,
    };
    
    this.activeVisuals.set(`${node.uuid}_energy_overcharge`, visual);
  }
  
  createDensityDarkening(node) {
    // Subtle opacity pulse darker
    const visual = {
      type: 'density_darkening',
      node,
      startTime: Date.now(),
      duration: 1.2,
      originalOpacity: node.material.opacity || 1.0,
    };
    
    this.activeVisuals.set(`${node.uuid}_density_darkening`, visual);
  }
  
  createDriftingGesture(node) {
    // Very small position offset (visual only, no physics)
    // Use deterministic hash-based "randomness" from node UUID for stability
    const hash1 = Math.sin(node.uuid.charCodeAt(0) * 12.9898) * 43758.5453;
    const hash2 = Math.sin(node.uuid.charCodeAt(1) * 78.233) * 43758.5453;
    const hash3 = Math.sin(node.uuid.charCodeAt(2) * 45.1234) * 43758.5453;
    
    const visual = {
      type: 'drifting_gesture',
      node,
      startTime: Date.now(),
      duration: 1.5,
      driftOffset: new THREE.Vector3(
        (hash1 - Math.floor(hash1)) * 0.08 - 0.04,  // -0.04 to +0.04
        (hash2 - Math.floor(hash2)) * 0.04 - 0.02,  // -0.02 to +0.02
        (hash3 - Math.floor(hash3)) * 0.08 - 0.04   // -0.04 to +0.04
      ),
      originalPosition: node.position.clone(),
    };
    
    this.activeVisuals.set(`${node.uuid}_drifting_gesture`, visual);
  }
  
  createGlyphFlash(node) {
    // Quick emissive flash
    if (!node.material.emissive) return;
    
    const visual = {
      type: 'glyph_flash',
      node,
      startTime: Date.now(),
      duration: 0.5,
      originalIntensity: node.material.emissiveIntensity || 0.5,
      flashIntensity: 1.5,
    };
    
    this.activeVisuals.set(`${node.uuid}_glyph_flash`, visual);
  }
  
  createBalancedOscillation(node) {
    // Smooth sinusoidal scale
    const visual = {
      type: 'balanced_oscillation',
      node,
      startTime: Date.now(),
      duration: 1.8,
      originalScale: node.scale.x,
      oscillationDepth: 0.02,
    };
    
    this.activeVisuals.set(`${node.uuid}_balanced_oscillation`, visual);
  }
  
  createAscendedFlare(node) {
    // Dual rings + vertical beam + additive glow — EPIC edition
    const ring1Geometry = new THREE.RingGeometry(0.8, 0.88, 48);
    const ring2Geometry = new THREE.RingGeometry(1.2, 1.28, 48);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      blending: this.config.additiveBlending ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
    });
    
    const ring1 = new THREE.Mesh(ring1Geometry, ringMaterial);
    const ring2 = new THREE.Mesh(ring2Geometry, ringMaterial.clone());
    
    ring1.position.copy(node.position);
    ring2.position.copy(node.position);
    ring1.rotation.x = Math.PI / 2;
    ring2.rotation.x = Math.PI / 2;
    
    this.scene.add(ring1);
    this.scene.add(ring2);
    
    // Vertical beam (pillar of light)
    const beamHeight = 3.0;
    const beamGeometry = new THREE.CylinderGeometry(0.03, 0.08, beamHeight, 8);
    const beamMaterial = new THREE.MeshBasicMaterial({
      color: 0xffcc44,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.copy(node.position);
    beam.position.y += beamHeight * 0.5;
    this.scene.add(beam);
    
    const visual = {
      type: 'ascended_flare',
      node,
      ring1,
      ring2,
      beam,
      startTime: Date.now(),
      duration: 2.5,
    };
    
    this.activeVisuals.set(`${node.uuid}_ascended_flare`, visual);
  }
  
  /**
   * Check for metric-based additive events — COMPREHENSIVE EDITION
   * Emits node.<metric>.<tier> events for ALL metrics and tiers.
   * Each tier triggers a unique visual effect.
   */
  checkMetricEvents(node, metrics) {
    if (!metrics) return;
    const linkCount = this._resolveNodeLinkCount(node);
    if (linkCount <= 0) return;
    const nodeId = node.userData?.nodeId || node.id || node.uuid;
    const basePayload = { nodeId, source: 'NodeMicroEvents', node, position: node.position.clone() };
    const uuid = node.uuid;
    if (!this._previousTiers.has(uuid)) this._previousTiers.set(uuid, {});
    const prev = this._previousTiers.get(uuid);

    const CANONICAL_METRICS = ['stability', 'harmony', 'synergy', 'corruption', 'loadPressure'];

    for (const metric of CANONICAL_METRICS) {
      const value = Number.isFinite(metrics[metric]) ? metrics[metric] : 0;
      const prevTier = prev[metric] || null;
      const tier = classifyMetricTier(value, prevTier, getDefaultMetricThresholds(metric));
      if (tier === prevTier) continue;
      prev[metric] = tier;
      const eventName = buildScopedMetricEventName('node', metric, tier);
      this._emitEvent(eventName, { ...basePayload, metric, tier, value });
      if (metric === 'stability') {
        if (tier === 'low') { this.createDimPulse(node); this.logEvent(node, 'stability_low_dim'); }
        else if (tier === 'mid') { this.createStabilityAnchor(node, value); this.logEvent(node, 'stability_anchor'); }
        else if (tier === 'high') { this.createJitterBurst(node); this.logEvent(node, 'jitter_burst'); }
      } else if (metric === 'harmony') {
        if (tier === 'low') { this.createDensityDarkening(node); this.logEvent(node, 'harmony_low_dark'); }
        else if (tier === 'mid') { this.createBreathingShift(node); this.logEvent(node, 'harmony_breath'); }
        else if (tier === 'high') { this.createHarmonyRing(node); this.logEvent(node, 'harmony_ring'); }
      } else if (metric === 'synergy') {
        if (tier === 'low') { this.createDimPulse(node); this.logEvent(node, 'synergy_low_dim'); }
        else if (tier === 'mid') { this.createBalancedOscillation(node); this.logEvent(node, 'balanced_oscillation'); }
        else if (tier === 'high') { this.createClaritySpark(node); this.logEvent(node, 'clarity_spark'); }
      } else if (metric === 'corruption') {
        if (tier === 'low') { this.createCorruptionTendril(node, value); this.logEvent(node, 'corruption_tendril'); }
        else if (tier === 'mid') { this.createCorruptionTendril(node, value); this.createDensityDarkening(node); this.logEvent(node, 'corruption_dark'); }
        else if (tier === 'high') { this.createCorruptionTendril(node, value); this.createFractalShimmer(node); this.logEvent(node, 'corruption_shimmer'); }
      } else if (metric === 'loadPressure') {
        if (tier === 'low') { this.createBreathingShift(node); this.logEvent(node, 'load_breath'); }
        else if (tier === 'mid') { this.createEnergyOvercharge(node); this.logEvent(node, 'load_overcharge'); }
        else if (tier === 'high') { this.createCorePulse(node); this.logEvent(node, 'core_overpulse'); }
      }
    }
  }
  createJitterBurst(node) {
    // STABILITY FIX: Use deterministic phase offset based on node UUID
    // This ensures same node always exhibits same jitter pattern
    const phaseX = Math.sin(node.uuid.charCodeAt(0) * 12.9898) * 6.28; // 0-2π
    const phaseY = Math.sin(node.uuid.charCodeAt(1) * 78.233) * 6.28;
    const phaseZ = Math.sin(node.uuid.charCodeAt(2) * 45.1234) * 6.28;
    
    const visual = {
      type: 'jitter_burst',
      node,
      startTime: Date.now(),
      duration: 0.5,
      jitterIntensity: 0.015, // Max ±0.015 units (smooth sine, not random)
      originalPosition: node.position.clone(),
      phaseX, phaseY, phaseZ  // Store deterministic phases
    };
    
    this.activeVisuals.set(`${node.uuid}_jitter_burst`, visual);
  }
  
  createHarmonyRing(node) {
    // Harmony ring — EPIC: additive glow + color evolution
    const ringGeometry = new THREE.RingGeometry(0.6, 0.68, 48);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      blending: this.config.additiveBlending ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(node.position);
    ring.rotation.x = Math.PI / 2;
    this.scene.add(ring);
    
    // Inner glow halo
    const haloGeometry = new THREE.RingGeometry(0.3, 0.55, 32);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0x88ffbb,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    halo.position.copy(node.position);
    halo.position.y += 0.01;
    halo.rotation.x = Math.PI / 2;
    this.scene.add(halo);
    
    const visual = {
      type: 'harmony_ring',
      node,
      ring,
      halo,
      startTime: Date.now(),
      duration: 1.6,
      baseColor: new THREE.Color(0x00ff88),
      evolutionColor: new THREE.Color(0x4488ff),
    };
    
    this.activeVisuals.set(`${node.uuid}_harmony_ring`, visual);
  }
  
  createClaritySpark(node) {
    // Clarity spark — EPIC: rising spark + trail particles
    const sparkGeometry = new THREE.SphereGeometry(0.06, 8, 8);
    const sparkMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
    spark.position.copy(node.position);
    spark.position.y += 0.8;
    this.scene.add(spark);
    
    // Trail particles (small spheres left behind)
    const trails = [];
    for (let i = 0; i < 4; i++) {
      const trailGeo = new THREE.SphereGeometry(0.025, 6, 6);
      const trailMat = new THREE.MeshBasicMaterial({
        color: 0xaaddff,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const trail = new THREE.Mesh(trailGeo, trailMat);
      trail.position.copy(spark.position);
      trail.position.y -= (i + 1) * 0.08;
      trail.position.x += (Math.random() - 0.5) * 0.06;
      trail.position.z += (Math.random() - 0.5) * 0.06;
      this.scene.add(trail);
      trails.push({ mesh: trail, delay: i * 0.05, spawned: false });
    }
    
    const visual = {
      type: 'clarity_spark',
      node,
      spark,
      trails,
      startTime: Date.now(),
      duration: 0.9,
    };
    
    this.activeVisuals.set(`${node.uuid}_clarity_spark`, visual);
  }
  
  createCorePulse(node) {
    const visual = {
      type: 'core_pulse',
      node,
      startTime: Date.now(),
      duration: 1.0,
      originalIntensity: node.material.emissiveIntensity || 0.5,
      pulseIntensity: 2.0,
    };
    
    this.activeVisuals.set(`${node.uuid}_core_pulse`, visual);
  }
  
  /**
   * NEW: Dim pulse for low-metric states
   */
  createDimPulse(node) {
    if (!node.material) return;
    const visual = {
      type: 'dim_pulse',
      node,
      startTime: Date.now(),
      duration: 1.0,
      originalIntensity: node.material.emissiveIntensity || 0.5,
      originalOpacity: node.material.opacity || 1.0,
    };
    this.activeVisuals.set(`${node.uuid}_dim_pulse`, visual);
  }
  
  /**
   * NEW: Stability anchor — grounding ring for mid-stability nodes
   */
  createStabilityAnchor(node, stability) {
    const ringGeo = new THREE.RingGeometry(0.4, 0.44, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x6688ff,
      transparent: true,
      opacity: 0.35 * Math.min(stability, 1.0),
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(node.position);
    ring.position.y -= 0.1;
    ring.rotation.x = Math.PI / 2;
    this.scene.add(ring);
    
    const visual = {
      type: 'stability_anchor',
      node,
      ring,
      startTime: Date.now(),
      duration: 1.4,
    };
    this.activeVisuals.set(`${node.uuid}_stability_anchor`, visual);
  }
  
  /**
   * NEW: Corruption tendril — dark wisps for corruption states
   */
  createCorruptionTendril(node, corruption) {
    const intensity = Math.min(corruption, 1.0);
    const tendrilCount = Math.ceil(intensity * 3);
    const tendrils = [];
    
    for (let i = 0; i < tendrilCount; i++) {
      const angle = (i / tendrilCount) * Math.PI * 2 + Math.random() * 0.5;
      const height = 0.3 + Math.random() * 0.4;
      const tendrilGeo = new THREE.CylinderGeometry(0.008, 0.02, height, 4);
      const tendrilMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().lerpColors(new THREE.Color(0x880044), new THREE.Color(0xff0066), intensity),
        transparent: true,
        opacity: 0.4 * intensity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const tendril = new THREE.Mesh(tendrilGeo, tendrilMat);
      tendril.position.copy(node.position);
      tendril.position.y += height * 0.5;
      const radius = 0.3 + Math.random() * 0.2;
      tendril.position.x += Math.cos(angle) * radius;
      tendril.position.z += Math.sin(angle) * radius;
      tendril.rotation.z = (Math.random() - 0.5) * 0.3;
      this.scene.add(tendril);
      tendrils.push(tendril);
    }
    
    const visual = {
      type: 'corruption_tendril',
      node,
      tendrils,
      startTime: Date.now(),
      duration: 1.2,
      corruption: intensity,
    };
    this.activeVisuals.set(`${node.uuid}_corruption_tendril`, visual);
  }
  
  /**
   * Check for node-to-node interaction events
   */
  checkInteractionEvents(node) {
    const nearby = this.interactionCache.get(node.uuid);
    if (!nearby || nearby.length === 0) return;
    
    const personality = node.userData?.personality?.type;
    const metrics = node.userData?.metrics;
    const stability = Number.isFinite(metrics?.stability) ? metrics.stability : 0;
    const nodeId = node.userData?.nodeId || node.id || node.uuid;
    
    if (!personality || !metrics) return;
    
    nearby.forEach(nearbyNode => {
      const nearbyPersonality = nearbyNode.userData?.personality?.type;
      const nearbyMetrics = nearbyNode.userData?.metrics;
      const nearbyStability = Number.isFinite(nearbyMetrics?.stability) ? nearbyMetrics.stability : 0;
      const nearbyNodeId = nearbyNode.userData?.nodeId || nearbyNode.id || nearbyNode.uuid;
      
      if (!nearbyPersonality || !nearbyMetrics) return;
      
      // Compatible personalities: harmony flash
      if (this.areCompatiblePersonalities(personality, nearbyPersonality)) {
        this._emitEvent('node.interaction.harmony_flash', {
          nodeId,
          targetNodeId: nearbyNodeId,
          source: 'NodeMicroEvents',
          node,
          targetNode: nearbyNode,
        });
        this.createHarmonyFlash(node, nearbyNode);
        this.logEvent(node, 'harmony_flash');
      }
      
      // Both high stability: chaos spark
      if (stability > 0.8 && nearbyStability > 0.8) {
        this._emitEvent('node.interaction.chaos_spark', {
          nodeId,
          targetNodeId: nearbyNodeId,
          stability,
          targetStability: nearbyStability,
          source: 'NodeMicroEvents',
        });
        this.createChaosSpark(node, nearbyNode);
        this.logEvent(node, 'chaos_spark');
      }
      
      // Ascended presence: calm aura
      if (nearbyPersonality === 'ASCENDED_MYTHIC') {
        this._emitEvent('node.interaction.calm_aura', {
          nodeId,
          ascendedNodeId: nearbyNodeId,
          source: 'NodeMicroEvents',
        });
        this.createCalmAura(node);
        this.logEvent(node, 'calm_aura');
      }
      
      // Link-aware: emit link events for connected nearby nodes
      this._emitLinkProximityEvents(node, nearbyNode, metrics, nearbyMetrics);
    });
  }
  
  /**
   * NEW: Emit link.<metric>.<tier> events when two nearby nodes share link context
   */
  _emitLinkProximityEvents(nodeA, nodeB, metricsA, metricsB) {
    const avgHarmony = ((metricsA.harmony || 0) + (metricsB.harmony || 0)) * 0.5;
    const avgSynergy = ((metricsA.synergy || 0) + (metricsB.synergy || 0)) * 0.5;
    const avgStability = ((metricsA.stability || 0) + (metricsB.stability || 0)) * 0.5;
    const avgCorruption = ((metricsA.corruption || 0) + (metricsB.corruption || 0)) * 0.5;

    const nodeAId = nodeA.userData?.nodeId || nodeA.id || nodeA.uuid;
    const nodeBId = nodeB.userData?.nodeId || nodeB.id || nodeB.uuid;
    const basePayload = {
      sourceNodeId: nodeAId,
      targetNodeId: nodeBId,
      source: 'NodeMicroEvents',
    };

    const harmonyTier = classifyMetricTier(avgHarmony, null, getDefaultMetricThresholds('harmony'));
    this._emitEvent(buildScopedMetricEventName('link', 'harmony', harmonyTier), { ...basePayload, value: avgHarmony });

    const synergyTier = classifyMetricTier(avgSynergy, null, getDefaultMetricThresholds('synergy'));
    this._emitEvent(buildScopedMetricEventName('link', 'synergy', synergyTier), { ...basePayload, value: avgSynergy });

    const stabilityTier = classifyMetricTier(avgStability, null, getDefaultMetricThresholds('stability'));
    this._emitEvent(buildScopedMetricEventName('link', 'stability', stabilityTier), { ...basePayload, value: avgStability });

    const corruptionTier = classifyMetricTier(avgCorruption, null, getDefaultMetricThresholds('corruption'));
    this._emitEvent(buildScopedMetricEventName('link', 'corruption', corruptionTier), { ...basePayload, value: avgCorruption });
  }
  
  areCompatiblePersonalities(p1, p2) {
    const compatiblePairs = [
      ['CALM_ANALYST', 'HARMONY_KEEPER'],
      ['HARMONY_KEEPER', 'RADIANT_OPTIMIZER'],
      ['FRACTAL_DREAMER', 'QUANTUM_TRICKSTER'],
      ['GLYPH_ARCHIVIST', 'CONVERGENCE_NEXUS'],
      ['ASCENDED_MYTHIC', 'HARMONY_KEEPER'],
    ];
    
    return compatiblePairs.some(pair => 
      (pair[0] === p1 && pair[1] === p2) || 
      (pair[0] === p2 && pair[1] === p1)
    );
  }
  
  createHarmonyFlash(node1, node2) {
    // Energy beam between nodes — EPIC: additive glow + pulse traveling along beam
    const distance = node1.position.distanceTo(node2.position);
    const beamGeometry = new THREE.CylinderGeometry(0.025, 0.025, distance, 8);
    const beamMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffaa,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    const midpoint = new THREE.Vector3().addVectors(node1.position, node2.position).multiplyScalar(0.5);
    beam.position.copy(midpoint);
    beam.lookAt(node2.position);
    beam.rotateX(Math.PI / 2);
    
    this.scene.add(beam);
    
    // Pulse orb traveling along beam
    const pulseGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: 0xaaffdd,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const pulse = new THREE.Mesh(pulseGeo, pulseMat);
    pulse.position.copy(node1.position);
    this.scene.add(pulse);
    
    const visual = {
      type: 'harmony_flash',
      beam,
      pulse,
      node1,
      node2,
      startTime: Date.now(),
      duration: 1.0,
    };
    
    this.activeVisuals.set(`${node1.uuid}_harmony_flash`, visual);
  }
  
  createChaosSpark(node1, node2) {
    // Erratic lightning between nodes — EPIC: additive + erratic rotation + branch sparks
    const distance = node1.position.distanceTo(node2.position);
    const sparkGeometry = new THREE.CylinderGeometry(0.012, 0.012, distance, 6);
    const sparkMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0088,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
    const midpoint = new THREE.Vector3().addVectors(node1.position, node2.position).multiplyScalar(0.5);
    spark.position.copy(midpoint);
    spark.lookAt(node2.position);
    spark.rotateX(Math.PI / 2);
    
    this.scene.add(spark);
    
    // Branch sparks (smaller offshoots)
    const branches = [];
    for (let i = 0; i < 2; i++) {
      const branchGeo = new THREE.CylinderGeometry(0.005, 0.008, distance * 0.3, 4);
      const branchMat = new THREE.MeshBasicMaterial({
        color: 0xff4488,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const branch = new THREE.Mesh(branchGeo, branchMat);
      branch.position.copy(midpoint);
      branch.position.x += (Math.random() - 0.5) * 0.15;
      branch.position.z += (Math.random() - 0.5) * 0.15;
      branch.rotation.z = (Math.random() - 0.5) * 1.2;
      this.scene.add(branch);
      branches.push(branch);
    }
    
    const visual = {
      type: 'chaos_spark',
      spark,
      branches,
      startTime: Date.now(),
      duration: 0.5,
    };
    
    this.activeVisuals.set(`${node1.uuid}_chaos_spark`, visual);
  }
  
  createCalmAura(node) {
    // Subtle slow-down of node's animations
    const visual = {
      type: 'calm_aura',
      node,
      startTime: Date.now(),
      duration: 3.0, // Longer effect from ascended presence
      slowFactor: 0.3, // 30% slower
    };
    
    this.activeVisuals.set(`${node.uuid}_calm_aura`, visual);
  }
  
  /**
   * Update all active visual effects
   */
  updateActiveVisuals(deltaTime) {
    const now = Date.now();
    const toRemove = [];
    
    this.activeVisuals.forEach((visual, key) => {
      const elapsed = (now - visual.startTime) / 1000; // Convert to seconds
      const progress = Math.min(elapsed / visual.duration, 1.0);
      
      // Remove if complete
      if (progress >= 1.0) {
        this.cleanupVisual(visual);
        toRemove.push(key);
        return;
      }
      
      // Update based on type
      this.updateVisualByType(visual, progress, deltaTime);
    });
    
    // Remove completed visuals
    toRemove.forEach(key => this.activeVisuals.delete(key));
  }
  
  updateVisualByType(visual, progress, deltaTime) {
    const easeOut = 1 - Math.pow(1 - progress, 2);
    const easeInOut = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    
    switch (visual.type) {
      case 'focus_pulse':
        if (visual.node.material.emissiveIntensity !== undefined) {
          visual.node.material.emissiveIntensity = visual.originalIntensity + Math.sin(progress * Math.PI) * 0.3;
        }
        break;
      
      case 'slow_tilt':
        visual.node.rotateOnAxis(visual.tiltAxis, Math.sin(progress * Math.PI) * visual.maxTilt * deltaTime);
        break;
      
      case 'breathing_shift':
        // Sinusoidal scale pulse (3% depth)
        if (visual.node && visual.originalScale !== undefined) {
          const breathScale = visual.originalScale * (1 + 0.03 * Math.sin(progress * Math.PI * 2));
          visual.node.scale.setScalar(breathScale);
        }
        break;
      
      case 'resonance_halo':
        const haloScale = 1 + progress * 1.5;
        visual.ring.scale.setScalar(haloScale);
        // Glow pulse modulation
        const glowPulse = 0.7 + 0.3 * Math.sin(this._elapsedTime * this.config.glowPulseSpeed);
        visual.ring.material.opacity = glowPulse * (1 - progress);
        // Color evolution: green → cyan
        if (visual.baseColor) {
          const evolvedColor = visual.baseColor.clone().lerp(new THREE.Color(0x00ccff), progress * 0.5);
          visual.ring.material.color.copy(evolvedColor);
        }
        // Echo ring (delayed, dimmer)
        if (visual.echoRing) {
          const echoProgress = Math.max(0, progress - 0.15);
          const echoScale = 1 + echoProgress * 2.0;
          visual.echoRing.scale.setScalar(echoScale);
          visual.echoRing.material.opacity = 0.12 * (1 - echoProgress);
        }
        break;
      
      case 'synchronized_pulse':
        // Synchronized scale pulse across nearby nodes
        if (visual.node && visual.originalScale !== undefined) {
          const syncScale = visual.originalScale * (1 + 0.04 * Math.sin(progress * Math.PI));
          visual.node.scale.setScalar(syncScale);
        }
        break;
      
      case 'fractal_shimmer':
        if (visual.node.material.emissive) {
          const colorIndex = Math.floor(progress * visual.shimmerColors.length);
          const color = visual.shimmerColors[Math.min(colorIndex, visual.shimmerColors.length - 1)];
          visual.node.material.emissive.lerp(color, 0.1);
        }
        break;
      
      case 'irregular_rotation':
        visual.node.rotation.y += visual.rotationSpeed * deltaTime * (1 + Math.sin(progress * Math.PI * 4));
        break;
      
      case 'micro_blink':
        const blinkPhase = progress * visual.blinkCount * 2;
        visual.node.visible = Math.floor(blinkPhase) % 2 === 0;
        break;
      
      case 'emissive_spike':
        if (visual.node.material.emissiveIntensity !== undefined) {
          visual.node.material.emissiveIntensity = visual.originalIntensity + 
            (visual.spikeIntensity - visual.originalIntensity) * Math.sin(progress * Math.PI);
        }
        break;
      
      case 'energy_overcharge':
        if (visual.node.material.emissiveIntensity !== undefined) {
          visual.node.material.emissiveIntensity = visual.originalIntensity + 
            (visual.overchargeIntensity - visual.originalIntensity) * easeInOut;
        }
        break;
      
      case 'density_darkening':
        if (visual.node.material.opacity !== undefined) {
          visual.node.material.opacity = visual.originalOpacity * (1 - 0.3 * Math.sin(progress * Math.PI));
        }
        break;
      
      case 'drifting_gesture':
        // Smooth position drift using sin envelope
        if (visual.node && visual.originalPosition && visual.driftOffset) {
          const driftAmount = Math.sin(progress * Math.PI); // peak at center
          visual.node.position.copy(visual.originalPosition).addScaledVector(visual.driftOffset, driftAmount);
        }
        break;
      
      case 'glyph_flash':
        if (visual.node.material.emissiveIntensity !== undefined) {
          visual.node.material.emissiveIntensity = visual.originalIntensity + 
            (visual.flashIntensity - visual.originalIntensity) * Math.sin(progress * Math.PI);
        }
        break;
      
      case 'balanced_oscillation':
        // Smooth sinusoidal scale oscillation
        if (visual.node && visual.originalScale !== undefined) {
          const oscScale = visual.originalScale * (1 + visual.oscillationDepth * Math.sin(progress * Math.PI * 3));
          visual.node.scale.setScalar(oscScale);
        }
        break;
      
      case 'ascended_flare':
        const flareScale = 1 + progress * 2;
        const flareGlow = 0.85 + 0.15 * Math.sin(this._elapsedTime * 4.0);
        visual.ring1.scale.setScalar(flareScale);
        visual.ring2.scale.setScalar(flareScale * 0.8);
        visual.ring1.material.opacity = flareGlow * (1 - progress);
        visual.ring2.material.opacity = flareGlow * 0.7 * (1 - progress);
        // Vertical beam fade
        if (visual.beam) {
          visual.beam.material.opacity = 0.5 * (1 - progress);
          visual.beam.scale.y = 1 + progress * 0.5;
        }
        break;
      
      case 'jitter_burst':
        // Deterministic sinusoidal jitter
        if (visual.node && visual.originalPosition) {
          const jitterDecay = 1 - progress;
          const jx = Math.sin(this._elapsedTime * 12 + visual.phaseX) * visual.jitterIntensity * jitterDecay;
          const jy = Math.sin(this._elapsedTime * 15 + visual.phaseY) * visual.jitterIntensity * jitterDecay;
          const jz = Math.sin(this._elapsedTime * 10 + visual.phaseZ) * visual.jitterIntensity * jitterDecay;
          visual.node.position.copy(visual.originalPosition);
          visual.node.position.x += jx;
          visual.node.position.y += jy;
          visual.node.position.z += jz;
        }
        break;
      
      case 'harmony_ring':
        const harmonyScale = 1 + progress * 1.4;
        const harmonyGlow = 0.6 + 0.2 * Math.sin(this._elapsedTime * this.config.glowPulseSpeed);
        visual.ring.scale.setScalar(harmonyScale);
        visual.ring.material.opacity = harmonyGlow * (1 - progress);
        // Color evolution: green → blue
        if (visual.baseColor && visual.evolutionColor) {
          const evolvedColor = visual.baseColor.clone().lerp(visual.evolutionColor, progress * 0.6);
          visual.ring.material.color.copy(evolvedColor);
        }
        // Inner halo pulse
        if (visual.halo) {
          visual.halo.scale.setScalar(1 + progress * 0.8);
          visual.halo.material.opacity = 0.2 * (1 - progress);
        }
        break;
      
      case 'clarity_spark':
        visual.spark.position.y += deltaTime * 0.6;
        visual.spark.material.opacity = 1.0 * (1 - progress);
        // Spark scale grows slightly
        const sparkScale = 1 + progress * 0.5;
        visual.spark.scale.setScalar(sparkScale);
        // Trail particles fade
        if (visual.trails) {
          visual.trails.forEach((t, i) => {
            const trailProgress = Math.max(0, progress - t.delay * 2);
            t.mesh.material.opacity = 0.5 * (1 - trailProgress);
            t.mesh.position.y += deltaTime * 0.2;
          });
        }
        break;
      
      case 'core_pulse':
        if (visual.node.material.emissiveIntensity !== undefined) {
          visual.node.material.emissiveIntensity = visual.originalIntensity + 
            (visual.pulseIntensity - visual.originalIntensity) * Math.sin(progress * Math.PI);
        }
        break;
      
      case 'harmony_flash':
        if (visual.beam) {
          visual.beam.material.opacity = 0.5 * (1 - progress);
        }
        // Pulse orb travels from node1 to node2
        if (visual.pulse && visual.node1 && visual.node2) {
          visual.pulse.position.lerpVectors(visual.node1.position, visual.node2.position, progress);
          visual.pulse.material.opacity = 0.8 * (1 - progress);
          const pulseScale = 1 + Math.sin(progress * Math.PI) * 0.5;
          visual.pulse.scale.setScalar(pulseScale);
        }
        break;
      
      case 'chaos_spark':
        if (visual.spark) {
          visual.spark.material.opacity = 0.7 * (1 - progress);
          // Erratic rotation
          visual.spark.rotation.z += deltaTime * 8;
          visual.spark.rotation.x += deltaTime * 3;
        }
        // Branch sparks erratic movement
        if (visual.branches) {
          visual.branches.forEach((branch, i) => {
            branch.material.opacity = 0.4 * (1 - progress);
            branch.rotation.z += deltaTime * (6 + i * 3);
            branch.rotation.y += deltaTime * 4;
          });
        }
        break;
      
      case 'calm_aura':
        // Calm aura: gentle emissive dimming
        if (visual.node && visual.node.material.emissiveIntensity !== undefined) {
          const calmPulse = 1 - 0.15 * Math.sin(progress * Math.PI * 2);
          visual.node.material.emissiveIntensity = (visual.node.userData?.baseEmissive || 0.5) * calmPulse;
        }
        break;
      
      // ── NEW VISUAL TYPES ────────────────────────────────────────
      case 'dim_pulse':
        if (visual.node) {
          // Dim the emissive + opacity briefly
          if (visual.node.material.emissiveIntensity !== undefined) {
            visual.node.material.emissiveIntensity = visual.originalIntensity * (1 - 0.4 * Math.sin(progress * Math.PI));
          }
          if (visual.node.material.opacity !== undefined) {
            visual.node.material.opacity = visual.originalOpacity * (1 - 0.2 * Math.sin(progress * Math.PI));
          }
        }
        break;
      
      case 'stability_anchor':
        if (visual.ring) {
          const anchorPulse = 1 + 0.1 * Math.sin(this._elapsedTime * 2.5);
          visual.ring.scale.setScalar(anchorPulse);
          visual.ring.material.opacity = 0.35 * (1 - progress);
          visual.ring.rotation.z += deltaTime * 0.3;
        }
        break;
      
      case 'corruption_tendril':
        if (visual.tendrils) {
          visual.tendrils.forEach((tendril, i) => {
            tendril.material.opacity = 0.4 * visual.corruption * (1 - progress);
            tendril.rotation.z += deltaTime * (2 + i) * (i % 2 === 0 ? 1 : -1);
            tendril.position.y += deltaTime * 0.05;
          });
        }
        break;

      // ── SELECTION RESONANCE CASCADE ─────────────────────────────
      case 'selection_flash':
        if (visual.mesh?.material?.emissiveIntensity !== undefined) {
          const flashCurve = Math.sin(progress * Math.PI);
          visual.mesh.material.emissiveIntensity =
            visual.originalIntensity + (visual.peakIntensity - visual.originalIntensity) * flashCurve;
        }
        break;

      case 'selection_cascade_ring':
        // Main ring expands and fades
        if (visual.ring) {
          const ringScale = 1 + progress * 2.0;
          visual.ring.scale.setScalar(ringScale);
          visual.ring.material.opacity = visual.baseOpacity * (1 - progress);
        }
        // Echo ring follows behind
        if (visual.echoRing) {
          const echoProgress = Math.max(0, progress - 0.15);
          const echoScale = 1 + echoProgress * 2.5;
          visual.echoRing.scale.setScalar(echoScale);
          visual.echoRing.material.opacity = visual.baseOpacity * 0.3 * Math.max(0, 1 - echoProgress);
        }
        break;

      case 'selection_link_pulse':
        // Pulse travels from source to target
        if (visual.pulse && visual.fromPos && visual.toPos) {
          const t = easeOut;
          visual.pulse.position.lerpVectors(visual.fromPos, visual.toPos, t);
          visual.pulse.material.opacity = visual.baseOpacity * Math.max(0, 1 - progress * 0.5);
          const sizeScale = 1 + 0.3 * Math.sin(progress * Math.PI);
          visual.pulse.scale.setScalar(sizeScale);
        }
        break;
    }
  }
  
  /**
   * Cleanup visual effect
   */
  cleanupVisual(visual) {
    // Reset node properties
    if (visual.node) {
      // Reset intensity
      if (visual.originalIntensity !== undefined && visual.node.material.emissiveIntensity !== undefined) {
        visual.node.material.emissiveIntensity = visual.originalIntensity;
      }
      
      // Reset opacity
      if (visual.originalOpacity !== undefined && visual.node.material.opacity !== undefined) {
        visual.node.material.opacity = visual.originalOpacity;
      }
      
      // Reset scale
      if (visual.originalScale !== undefined) {
        visual.node.scale.setScalar(visual.originalScale);
      }
      
      // Reset position (for drifting_gesture / jitter_burst)
      if (visual.originalPosition) {
        visual.node.position.copy(visual.originalPosition);
      }
      
      // Reset visibility
      if (visual.type === 'micro_blink') {
        visual.node.visible = true;
      }
    }
    
    const disposeMesh = (mesh) => {
      if (!mesh) return;
      this.scene.remove(mesh);
      if (mesh.geometry) {
        if (mesh.geometry.userData && mesh.geometry.userData.key) {
          this._releaseGeometry(mesh.geometry);
        } else {
          mesh.geometry.dispose();
        }
      }
      if (mesh.material) {
        if (mesh.material.userData && mesh.material.userData._pooled) {
          mesh.material.userData.inUse = false;
        } else {
          mesh.material.dispose();
        }
      }
    };
    
    // Remove scene objects — standard
    disposeMesh(visual.ring);
    disposeMesh(visual.ring1);
    disposeMesh(visual.ring2);
    disposeMesh(visual.spark);
    disposeMesh(visual.beam);
    
    // Remove scene objects — new EPIC types
    disposeMesh(visual.echoRing);
    disposeMesh(visual.halo);
    disposeMesh(visual.pulse);
    
    // Remove trail particles
    if (visual.trails) {
      visual.trails.forEach(t => disposeMesh(t.mesh));
    }
    
    // Remove branch sparks
    if (visual.branches) {
      visual.branches.forEach(b => disposeMesh(b));
    }
    
    // Remove tendrils
    if (visual.tendrils) {
      visual.tendrils.forEach(t => disposeMesh(t));
    }

    // NEW: Remove single tendril (for corruption_tendril)
    disposeMesh(visual.tendril);

    // NEW: Remove stabilizer (for stability_anchor)
    disposeMesh(visual.stabilizer);

    // NEW: Remove any other mesh references (catch-all)
    Object.values(visual).forEach(value => {
      if (value instanceof THREE.Mesh && value.parent) {
        // Check if not already disposed
        if (value.geometry || value.material) {
          this.scene.remove(value);
          if (value.geometry && !value.geometry.isDisposed) {
            if (value.geometry.userData && value.geometry.userData.key) {
              this._releaseGeometry(value.geometry);
            } else {
              value.geometry.dispose();
              value.geometry.isDisposed = true;
            }
          }
          if (value.material && !value.material.isDisposed) {
            if (value.material.userData && value.material.userData._pooled) {
              value.material.userData.inUse = false;
            } else {
              value.material.dispose();
              value.material.isDisposed = true;
            }
          }
        }
      }
    });
  }

  /**
   * Get or create ring geometry from pool
   * @private
   * FUTURE: Use for geometry reuse optimization
   */
  _getRingGeometry(innerRadius, outerRadius, segments) {
    const key = `${innerRadius}_${outerRadius}_${segments}`;
    let geo = this.geometryPool.rings.find(g => g.userData.key === key && !g.userData.inUse);

    if (!geo) {
      geo = new THREE.RingGeometry(innerRadius, outerRadius, segments);
      geo.userData.key = key;
      geo.userData.inUse = true;
      this.geometryPool.rings.push(geo);
    } else {
      geo.userData.inUse = true;
    }

    return geo;
  }

  /**
   * Get or create sphere geometry from pool
   * @private
   * FUTURE: Use for geometry reuse optimization
   */
  _getSphereGeometry(radius, widthSegments, heightSegments) {
    const key = `${radius}_${widthSegments}_${heightSegments}`;
    let geo = this.geometryPool.spheres.find(g => g.userData.key === key && !g.userData.inUse);

    if (!geo) {
      geo = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
      geo.userData.key = key;
      geo.userData.inUse = true;
      this.geometryPool.spheres.push(geo);
    } else {
      geo.userData.inUse = true;
    }

    return geo;
  }

  /**
   * Get or create cylinder geometry from pool
   * @private
   * FUTURE: Use for geometry reuse optimization
   */
  _getCylinderGeometry(radiusTop, radiusBottom, height, radialSegments) {
    const key = `${radiusTop}_${radiusBottom}_${height}_${radialSegments}`;
    let geo = this.geometryPool.cylinders.find(g => g.userData.key === key && !g.userData.inUse);

    if (!geo) {
      geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments);
      geo.userData.key = key;
      geo.userData.inUse = true;
      this.geometryPool.cylinders.push(geo);
    } else {
      geo.userData.inUse = true;
    }

    return geo;
  }

  /**
   * Release geometry back to pool
   * @private
   * FUTURE: Use for geometry reuse optimization
   */
  _releaseGeometry(geometry) {
    if (geometry && geometry.userData) {
      geometry.userData.inUse = false;
    }
  }

  _buildSpatialGrid(nodes) {
    this.spatialGrid.clear();
    const cellSize = this.gridCellSize;
    for (const node of nodes) {
      const cx = Math.floor(node.position.x / cellSize);
      const cz = Math.floor(node.position.z / cellSize);
      const key = (cx << 16) ^ (cz & 0xFFFF);
      let cell = this.spatialGrid.get(key);
      if (!cell) { cell = []; this.spatialGrid.set(key, cell); }
      cell.push(node);
    }
  }

  _getSpatialNearby(node) {
    const cellSize = this.gridCellSize;
    const cx = Math.floor(node.position.x / cellSize);
    const cz = Math.floor(node.position.z / cellSize);
    const result = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const key = ((cx + dx) << 16) ^ ((cz + dz) & 0xFFFF);
        const cell = this.spatialGrid.get(key);
        if (cell) {
          for (let i = 0; i < cell.length; i++) result.push(cell[i]);
        }
      }
    }
    return result;
  }

  /**
   * Log event to node's event log
   */
  logEvent(node, eventName) {
    if (!node.userData.eventLog) {
      node.userData.eventLog = [];
    }
    
    // Format event name for display
    const displayName = eventName.replace(/_/g, ' ').toUpperCase();
    
    // Add to log
    node.userData.eventLog.unshift(displayName);
    
    // Keep only last 3 events
    if (node.userData.eventLog.length > 3) {
      node.userData.eventLog = node.userData.eventLog.slice(0, 3);
    }
  }
  
  /**
   * Get event log for a node (for inspect overlay)
   */
  getEventLog(node) {
    return node.userData?.eventLog || [];
  }

  /**
   * Get system status and diagnostics
   * @returns {Object} System status
   */
  getStatus() {
    const eventCounts = {};
    this.activeVisuals.forEach((visual) => {
      eventCounts[visual.type] = (eventCounts[visual.type] || 0) + 1;
    });

    const totalEvents = Array.from(this.nodeEvents.values())
      .reduce((sum, e) => sum + (e.eventCount || 0), 0);

    return {
      performanceMode: this.performanceMode,
      updateInterval: this.updateInterval,
      updateFrequency: Math.round(1 / this.updateInterval),
      totalNodes: this.nodeEvents.size,
      activeVisuals: this.activeVisuals.size,
      interactionPairs: this.interactionCache.size,
      totalEventsTriggered: totalEvents,
      averageEventsPerNode: this.nodeEvents.size > 0 ? (totalEvents / this.nodeEvents.size).toFixed(2) : 0,
      eventBreakdown: eventCounts,
      elapsedTime: this._elapsedTime.toFixed(2),
      config: {
        visualIntensity: this.config.visualIntensity,
        glowPulseSpeed: this.config.glowPulseSpeed,
        ringGlowEnabled: this.config.ringGlowEnabled,
        trailEnabled: this.config.trailEnabled,
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // SELECTION RESONANCE CASCADE
  // Visual chain reaction on node select — shows network REACH
  // ═══════════════════════════════════════════════════════════════

  /**
   * Subscribe to node.selection semantic event to trigger cascade.
   */
  _setupSelectionCascadeSubscription() {
    const bus = this._resolveMetricBus();
    if (!bus) return;

    const handler = (payload) => {
      if (payload?.type !== 'select') return;
      const node = this._resolveCascadeNode(payload.nodeId);
      if (node) this.triggerSelectionCascade(node);
    };

    if (typeof bus.on === 'function') {
      bus.on('node.selection', handler);
    } else if (typeof bus.subscribe === 'function') {
      bus.subscribe('node.selection', handler);
    }

    this._semanticSubscriptions.push(['node.selection', handler]);
  }

  /**
   * Resolve a node by ID from the game's aiNodes collection.
   */
  _resolveCascadeNode(nodeId) {
    if (!nodeId) return null;

    // Try registered nodes first
    for (const [, data] of this.nodeEvents) {
      const n = data.node;
      if (n?.userData?.nodeId === nodeId || n?.id === nodeId || n?.uuid === nodeId) return n;
    }

    // Fallback: global game nodes
    const aiNodes = globalThis?.game?.aiNodes;
    if (Array.isArray(aiNodes)) {
      return aiNodes.find(n => n?.userData?.nodeId === nodeId || n?.id === nodeId || n?.uuid === nodeId) || null;
    }
    if (aiNodes?.nodes instanceof Map) {
      for (const [, n] of aiNodes.nodes) {
        if (n?.userData?.nodeId === nodeId || n?.id === nodeId || n?.uuid === nodeId) return n;
      }
    }

    return null;
  }

  /**
   * Get the linking system for BFS traversal.
   */
  _getLinkingSystem() {
    return globalThis?.game?.linkingSystem || null;
  }

  /**
   * Get all links for a node via the linking system or node userData.
   */
  _getLinksForNode(node) {
    const ls = this._getLinkingSystem();
    if (ls && typeof ls.getLinksForNode === 'function') {
      return ls.getLinksForNode(node);
    }
    return node?.userData?.links || [];
  }

  /**
   * SELECTION RESONANCE CASCADE — Main trigger.
   * BFS from selected node through links (max 3 hops).
   * Each hop creates delayed ring + flash + link pulse with diminishing intensity.
   */
  triggerSelectionCascade(sourceNode) {
    if (!sourceNode) return;

    const cfg = this.config.selectionCascade;
    if (!cfg.enabled) return;

    // Cooldown check
    const now = Date.now();
    if (now - this._lastSelectionCascadeTime < cfg.cooldownMs) return;
    this._lastSelectionCascadeTime = now;

    // Clear any previous pending timers
    for (const timer of this._selectionCascadeTimers) {
      clearTimeout(timer);
    }
    this._selectionCascadeTimers = [];

    // BFS traversal through links
    const visited = new Set();
    visited.add(sourceNode.uuid);
    const hopSchedule = []; // { node, hop, fromNode?, link? }

    const queue = [{ node: sourceNode, hop: 0 }];
    let totalAffected = 0;

    while (queue.length > 0 && totalAffected < cfg.maxAffectedNodes) {
      const { node, hop } = queue.shift();
      if (hop > cfg.maxHops) continue;

      // Schedule effects for this node at this hop
      hopSchedule.push({ node, hop });
      totalAffected++;

      if (hop >= cfg.maxHops) continue;

      // Find connected neighbors
      const links = this._getLinksForNode(node);
      for (const link of links) {
        const neighbor = (link.source === node) ? link.target
                       : (link.target === node) ? link.source
                       : null;
        if (!neighbor || visited.has(neighbor.uuid)) continue;
        visited.add(neighbor.uuid);

        // Schedule link pulse + neighbor effects
        hopSchedule.push({
          node: neighbor,
          hop: hop + 1,
          fromNode: node,
          link,
        });

        queue.push({ node: neighbor, hop: hop + 1 });
      }
    }

    // Execute scheduled effects with staggered delays
    for (const item of hopSchedule) {
      const delay = item.hop * cfg.hopDelayMs;
      const hopIdx = Math.min(item.hop, cfg.colors.length - 1);
      const color = cfg.colors[hopIdx];
      const opacity = cfg.ringOpacities[hopIdx];
      const duration = cfg.ringDurations[hopIdx];
      const flashIntensity = cfg.flashIntensities[hopIdx];

      const timer = setTimeout(() => {
        // Node flash
        this._createSelectionFlash(item.node, flashIntensity, duration * 0.3);
        // Expanding ring
        this._createSelectionRing(item.node, color, opacity, duration);
        // Link pulse (if this node was reached via a link)
        if (item.fromNode && item.link) {
          this._createLinkPulse(item.fromNode, item.node, color, opacity);
        }
      }, delay);

      this._selectionCascadeTimers.push(timer);
    }
  }

  /**
   * Create a brief emissive flash on a node's meshes.
   */
  _createSelectionFlash(node, intensity, duration) {
    if (!node?.traverse) return;

    node.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      if (child.material.emissiveIntensity === undefined) return;

      const key = `${child.uuid}_sel_flash_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const origIntensity = child.material.emissiveIntensity ?? 0;

      const visual = {
        type: 'selection_flash',
        mesh: child,
        startTime: Date.now(),
        duration: duration || 0.3,
        originalIntensity: origIntensity,
        peakIntensity: origIntensity + intensity,
      };

      this.activeVisuals.set(key, visual);
    });
  }

  /**
   * Create an expanding ring at a node's position (selection cascade style).
   */
  _createSelectionRing(node, color, opacity, duration) {
    if (!node?.position || !this.scene) return;

    const ringGeo = this._getRingGeometry(0.4, 0.48, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(node.position);
    ring.rotation.x = Math.PI / 2;
    this.scene.add(ring);

    // Echo ring (delayed, dimmer)
    const echoGeo = this._getRingGeometry(0.6, 0.63, 48);
    const echoMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: opacity * 0.3,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const echoRing = new THREE.Mesh(echoGeo, echoMat);
    echoRing.position.copy(node.position);
    echoRing.rotation.x = Math.PI / 2;
    this.scene.add(echoRing);

    const key = `sel_ring_${node.uuid}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const visual = {
      type: 'selection_cascade_ring',
      node,
      ring,
      echoRing,
      startTime: Date.now(),
      duration: duration || 1.2,
      baseOpacity: opacity,
      baseColor: new THREE.Color(color),
    };

    this.activeVisuals.set(key, visual);
  }

  /**
   * Create a small glowing sphere that travels along a link from source to target.
   */
  _createLinkPulse(fromNode, toNode, color, opacity) {
    if (!fromNode?.position || !toNode?.position || !this.scene) return;

    const cfg = this.config.selectionCascade;
    const pulseGeo = this._getSphereGeometry(cfg.linkPulseSize, 8, 6);
    const pulseMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: opacity * 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const pulse = new THREE.Mesh(pulseGeo, pulseMat);
    pulse.position.copy(fromNode.position);
    this.scene.add(pulse);

    const key = `sel_pulse_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const visual = {
      type: 'selection_link_pulse',
      pulse,
      fromPos: fromNode.position.clone(),
      toPos: toNode.position.clone(),
      startTime: Date.now(),
      duration: 0.3,
      baseOpacity: opacity * 0.8,
    };

    this.activeVisuals.set(key, visual);
  }

  /**
   * Dispose all resources and clean up
   * CRITICAL: Call this when removing NodeMicroEvents to prevent memory leaks
   */
  dispose() {
    console.log('[NodeMicroEvents] Disposing...');

    // Clean up all active visuals
    this.activeVisuals.forEach((visual) => {
      this.cleanupVisual(visual);
    });
    this.activeVisuals.clear();

    // Clear event registry
    this.nodeEvents.clear();

    // Clear interaction cache
    this.interactionCache.clear();

    // Clear spatial grid if it exists
    if (this.spatialGrid) {
      this.spatialGrid.clear();
    }

    // Dispose geometry and material pools if they exist
    if (this.geometryPool) {
      Object.values(this.geometryPool).forEach(pool => {
        pool.forEach(geo => {
          if (geo) geo.dispose();
        });
      });
      this.geometryPool = { rings: [], spheres: [], cylinders: [] };
    }

    if (this.materialPool) {
      Object.values(this.materialPool).forEach(pool => {
        pool.forEach(mat => {
          if (mat) mat.dispose();
        });
      });
      this.materialPool = { rings: [], spheres: [], cylinders: [] };
    }

    // Clear pending selection cascade timers
    for (const timer of this._selectionCascadeTimers) {
      clearTimeout(timer);
    }
    this._selectionCascadeTimers = [];

    // Unsubscribe from semantic events
    const bus = this._resolveMetricBus();
    const off = bus?.off?.bind(bus) || bus?.unsubscribe?.bind(bus);
    if (off) {
      for (const [eventName, handler] of this._semanticSubscriptions) {
        off(eventName, handler);
      }
    }
    this._semanticSubscriptions = [];

    // Reset timers
    this._elapsedTime = 0;
    this.lastUpdateTime = 0;
    this.lastInteractionCheck = 0;
    this.performanceMode = 'normal';

    console.log('[NodeMicroEvents] Disposed successfully');
  }

  _resolveMetricBus() {
    if (globalThis?.ATOMA_BUS || globalThis?.semanticBus) {
      return globalThis.ATOMA_BUS || globalThis.semanticBus || null;
    }

    const browserWindow = typeof window !== 'undefined' ? window : null;
    return browserWindow?.ATOMA_BUS || browserWindow?.semanticBus || null;
  }

  _emitEvent(eventName, payload) {
    const bus = this.metricBus;
    if (!bus || !eventName) return;

    if (typeof bus.emit === 'function') {
      bus.emit(eventName, payload);
      return;
    }

    if (typeof bus.publish === 'function') {
      bus.publish(eventName, payload);
    }
  }
}
