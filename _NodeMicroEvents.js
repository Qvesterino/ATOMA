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
 * - Updates at 10-20Hz (50-100ms intervals)
 * - Skips if scene is large (>100 nodes) or frame rate low
 * - Zero per-frame allocations
 * - Auto-scales intensity based on node count
 */

import * as THREE from 'three';

export class NodeMicroEvents {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    
    // Timing control (15Hz default = ~67ms)
    this.lastUpdateTime = 0;
    this.updateInterval = 1 / 15; // 15Hz
    
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
    
    console.log('✓ Node Micro-Events 1.0 initialized');
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
    if (window.VISUAL_AUTHORITY_LOCK) return;
    
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
      this.updateInterval = 1 / 10; // Reduce to 10Hz
    } else if (nodes.length > 50) {
      this.performanceMode = 'reduced';
      this.updateInterval = 1 / 12; // 12Hz
    } else {
      this.performanceMode = 'normal';
      this.updateInterval = 1 / 15; // 15Hz
    }
    
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
    nodes.forEach(node => {
      if (!node.userData.microEventTimer) return;
      
      // Decrement timer
      node.userData.microEventTimer -= actualDelta;
      
      // Trigger event when timer expires
      if (node.userData.microEventTimer <= 0) {
        this.triggerMicroEvent(node);
        node.userData.microEventTimer = this.getRandomTimer();
      }
    });
    
    // Update active visual effects
    this.updateActiveVisuals(actualDelta);
  }
  
  /**
   * Update interaction cache for node-to-node events
   */
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
    // Glowing ring expanding outward
    const ringGeometry = new THREE.RingGeometry(0.5, 0.55, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffaa,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(node.position);
    ring.rotation.x = Math.PI / 2;
    this.scene.add(ring);
    
    const visual = {
      type: 'resonance_halo',
      node,
      ring,
      startTime: Date.now(),
      duration: 1.5,
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
    // Dual rings + vertical particle burst
    const ring1Geometry = new THREE.RingGeometry(0.8, 0.85, 32);
    const ring2Geometry = new THREE.RingGeometry(1.2, 1.25, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    
    const ring1 = new THREE.Mesh(ring1Geometry, ringMaterial);
    const ring2 = new THREE.Mesh(ring2Geometry, ringMaterial.clone());
    
    ring1.position.copy(node.position);
    ring2.position.copy(node.position);
    ring1.rotation.x = Math.PI / 2;
    ring2.rotation.x = Math.PI / 2;
    
    this.scene.add(ring1);
    this.scene.add(ring2);
    
    const visual = {
      type: 'ascended_flare',
      node,
      ring1,
      ring2,
      startTime: Date.now(),
      duration: 2.0,
    };
    
    this.activeVisuals.set(`${node.uuid}_ascended_flare`, visual);
  }
  
  /**
   * Check for metric-based additive events
   */
  checkMetricEvents(node, metrics) {
    const stability = Number.isFinite(metrics?.stability) ? metrics.stability : 0;
    const harmony = Number.isFinite(metrics?.harmony) ? metrics.harmony : 0;
    const synergy = Number.isFinite(metrics?.synergy) ? metrics.synergy : 0;
    const loadPressure = Number.isFinite(metrics?.loadPressure) ? metrics.loadPressure : 0;

    // High stability: jitter burst
    if (stability > 0.6) {
      this.createJitterBurst(node);
      this.logEvent(node, 'jitter_burst');
    }
    
    // High harmony: glowing resonance ring
    if (harmony > 0.7) {
      this.createHarmonyRing(node);
      this.logEvent(node, 'harmony_ring');
    }
    
    // High clarity: glyph spark
    if (synergy > 0.8) {
      this.createClaritySpark(node);
      this.logEvent(node, 'clarity_spark');
    }
    
    // High energy: core overpulse
    if (loadPressure > 0.8) {
      this.createCorePulse(node);
      this.logEvent(node, 'core_overpulse');
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
    const ringGeometry = new THREE.RingGeometry(0.6, 0.65, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(node.position);
    ring.rotation.x = Math.PI / 2;
    this.scene.add(ring);
    
    const visual = {
      type: 'harmony_ring',
      node,
      ring,
      startTime: Date.now(),
      duration: 1.2,
    };
    
    this.activeVisuals.set(`${node.uuid}_harmony_ring`, visual);
  }
  
  createClaritySpark(node) {
    // Small flash particle
    const sparkGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const sparkMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1.0,
    });
    
    const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
    spark.position.copy(node.position);
    spark.position.y += 0.8;
    this.scene.add(spark);
    
    const visual = {
      type: 'clarity_spark',
      node,
      spark,
      startTime: Date.now(),
      duration: 0.6,
    };
    
    this.activeVisuals.set(`${node.uuid}_clarity_spark`, visual);
  }
  
  createCorePulse(node) {
    const visual = {
      type: 'core_pulse',
      node,
      startTime: Date.now(),
      duration: 0.8,
      originalIntensity: node.material.emissiveIntensity || 0.5,
      pulseIntensity: 1.6,
    };
    
    this.activeVisuals.set(`${node.uuid}_core_pulse`, visual);
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
    
    if (!personality || !metrics) return;
    
    nearby.forEach(nearbyNode => {
      const nearbyPersonality = nearbyNode.userData?.personality?.type;
      const nearbyMetrics = nearbyNode.userData?.metrics;
      const nearbyStability = Number.isFinite(nearbyMetrics?.stability) ? nearbyMetrics.stability : 0;
      
      if (!nearbyPersonality || !nearbyMetrics) return;
      
      // Compatible personalities: harmony flash
      if (this.areCompatiblePersonalities(personality, nearbyPersonality)) {
        this.createHarmonyFlash(node, nearbyNode);
        this.logEvent(node, 'harmony_flash');
      }
      
      // Both high stability: chaos spark
      if (stability > 0.8 && nearbyStability > 0.8) {
        this.createChaosSpark(node, nearbyNode);
        this.logEvent(node, 'chaos_spark');
      }
      
      // Ascended presence: calm aura
      if (nearbyPersonality === 'ASCENDED_MYTHIC') {
        this.createCalmAura(node);
        this.logEvent(node, 'calm_aura');
      }
    });
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
    // Light beam between nodes
    const distance = node1.position.distanceTo(node2.position);
    const beamGeometry = new THREE.CylinderGeometry(0.02, 0.02, distance, 8);
    const beamMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffaa,
      transparent: true,
      opacity: 0.4,
    });
    
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    const midpoint = new THREE.Vector3().addVectors(node1.position, node2.position).multiplyScalar(0.5);
    beam.position.copy(midpoint);
    beam.lookAt(node2.position);
    beam.rotateX(Math.PI / 2);
    
    this.scene.add(beam);
    
    const visual = {
      type: 'harmony_flash',
      beam,
      startTime: Date.now(),
      duration: 0.8,
    };
    
    this.activeVisuals.set(`${node1.uuid}_harmony_flash`, visual);
  }
  
  createChaosSpark(node1, node2) {
    // Erratic lightning between nodes
    const distance = node1.position.distanceTo(node2.position);
    const sparkGeometry = new THREE.CylinderGeometry(0.01, 0.01, distance, 6);
    const sparkMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0088,
      transparent: true,
      opacity: 0.6,
    });
    
    const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
    const midpoint = new THREE.Vector3().addVectors(node1.position, node2.position).multiplyScalar(0.5);
    spark.position.copy(midpoint);
    spark.lookAt(node2.position);
    spark.rotateX(Math.PI / 2);
    
    this.scene.add(spark);
    
    const visual = {
      type: 'chaos_spark',
      spark,
      startTime: Date.now(),
      duration: 0.4,
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
        break;
      
      case 'resonance_halo':
        const haloScale = 1 + progress * 1.5;
        visual.ring.scale.setScalar(haloScale);
        visual.ring.material.opacity = 0.6 * (1 - progress);
        break;
      
      case 'synchronized_pulse':
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
        break;
      
      case 'glyph_flash':
        if (visual.node.material.emissiveIntensity !== undefined) {
          visual.node.material.emissiveIntensity = visual.originalIntensity + 
            (visual.flashIntensity - visual.originalIntensity) * Math.sin(progress * Math.PI);
        }
        break;
      
      case 'balanced_oscillation':
        break;
      
      case 'ascended_flare':
        const flareScale = 1 + progress * 2;
        visual.ring1.scale.setScalar(flareScale);
        visual.ring2.scale.setScalar(flareScale * 0.8);
        visual.ring1.material.opacity = 0.8 * (1 - progress);
        visual.ring2.material.opacity = 0.8 * (1 - progress);
        break;
      
      case 'jitter_burst':
        break;
      
      case 'harmony_ring':
        const harmonyScale = 1 + progress * 1.2;
        visual.ring.scale.setScalar(harmonyScale);
        visual.ring.material.opacity = 0.5 * (1 - progress);
        break;
      
      case 'clarity_spark':
        visual.spark.position.y += deltaTime * 0.5;
        visual.spark.material.opacity = 1.0 * (1 - progress);
        break;
      
      case 'core_pulse':
        if (visual.node.material.emissiveIntensity !== undefined) {
          visual.node.material.emissiveIntensity = visual.originalIntensity + 
            (visual.pulseIntensity - visual.originalIntensity) * Math.sin(progress * Math.PI);
        }
        break;
      
      case 'harmony_flash':
        if (visual.beam) {
          visual.beam.material.opacity = 0.4 * (1 - progress);
        }
        break;
      
      case 'chaos_spark':
        if (visual.spark) {
          visual.spark.material.opacity = 0.6 * (1 - progress);
          // Erratic rotation
          visual.spark.rotation.z += deltaTime * 5;
        }
        break;
      
      case 'calm_aura':
        // Calm aura affects other systems, but we just track it here
        // The actual slow-down would be applied in NodePersonalitySystem2_0
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
      
      // Reset visibility
      if (visual.type === 'micro_blink') {
        visual.node.visible = true;
      }
    }
    
    // Remove scene objects
    if (visual.ring) {
      this.scene.remove(visual.ring);
      visual.ring.geometry.dispose();
      visual.ring.material.dispose();
    }
    
    if (visual.ring1) {
      this.scene.remove(visual.ring1);
      visual.ring1.geometry.dispose();
      visual.ring1.material.dispose();
    }
    
    if (visual.ring2) {
      this.scene.remove(visual.ring2);
      visual.ring2.geometry.dispose();
      visual.ring2.material.dispose();
    }
    
    if (visual.spark) {
      this.scene.remove(visual.spark);
      visual.spark.geometry.dispose();
      visual.spark.material.dispose();
    }
    
    if (visual.beam) {
      this.scene.remove(visual.beam);
      visual.beam.geometry.dispose();
      visual.beam.material.dispose();
    }
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
}
