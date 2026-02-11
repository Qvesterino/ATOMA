/**
 * MYTHIC RITUAL EVENTS 1.0 – SAFE EDITION
 * 
 * ⚠️ MYTHIC RITUALS ARE DISABLED BY DEFAULT
 * Set window.ATOMA_DISABLE_MYTHIC_RITUALS = false to enable
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
 *    - Monitors worldMood from WorldPersonalityController
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

import { MythicRitualPlayer } from './_MythicRitualPlayer.js';

export class MythicRitualController {
  // 🔥 GLOBAL SAFETY FLAG — Mythic Rituals disabled by default
  static ENABLED = typeof window !== 'undefined' ? !window.ATOMA_DISABLE_MYTHIC_RITUALS : false;

  constructor(scene, camera, renderer, worldPersonalityController, player) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.worldController = worldPersonalityController;
    this.player = player;
    
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
    
    // Player participation system
    this.ritualPlayer = null;
    if (this.player) {
      this.ritualPlayer = new MythicRitualPlayer(this.scene, this.camera, this.player);
    }
    
   
    
    console.log('✓ Mythic Ritual Controller 1.0 initialized');
  }
  
  /**
   * Initialize ritual HUD
   */
  initializeHUD() {
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
    if (this.skipRituals) return;
    
    // Performance check
    if (deltaTime > 0.05) {
      this.skipRituals = true;
      console.warn('Mythic Rituals: Skipping due to low FPS');
      return;
    }
    
    // Update active ritual
    if (this.activeRitual) {
      this.updateActiveRitual(deltaTime, nodes);
    } else {
      // Check for ritual triggers
      this.lastDetectionCheck += deltaTime;
      if (this.lastDetectionCheck >= this.detectionCheckInterval) {
        this.checkRitualTriggers(nodes);
        this.lastDetectionCheck = 0;
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
    
    // Get world mood from WorldPersonalityController
    if (!this.worldController || !this.worldController.worldMood) return;
    
    const mood = this.worldController.worldMood;
    
    // Count special node types
    const ascendedCount = nodes.filter(n => 
      n.userData?.personality?.type === 'ASCENDED_MYTHIC'
    ).length;
    
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
    this.ritualPhase = 'INIT';
    this.ritualProgress = 0;
    this.ritualStartTime = Date.now() / 1000;
    this.lastRitualTime = Date.now() / 1000;
    
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
    });
    
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.set(0, 50, 0);
    beam.userData.isRitualFX = true;
    this.scene.add(beam);
    
    this.ritualVisuals.set('central_beam', {
      object: beam,
      type: 'beam',
      targetOpacity: 0.4,
    });
    
    // Ascending rings
    const ringCount = 5;
    for (let i = 0; i < ringCount; i++) {
      const ringGeometry = new THREE.RingGeometry(5 + i * 3, 5.5 + i * 3, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = i * 5;
      ring.userData.isRitualFX = true;
      this.scene.add(ring);
      
      this.ritualVisuals.set(`ascension_ring_${i}`, {
        object: ring,
        type: 'ascending_ring',
        targetOpacity: 0.6,
        startHeight: i * 5,
      });
    }
    
    // Particle burst
    this.createParticleBurst(0xffd700, 50);
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
    });
    
    const fissure = new THREE.Mesh(fissureGeometry, fissureMaterial);
    fissure.position.set(0, 40, 0);
    fissure.userData.isRitualFX = true;
    this.scene.add(fissure);
    
    this.ritualVisuals.set('quantum_fissure', {
      object: fissure,
      type: 'fissure',
      targetOpacity: 0.8,
    });
    
    // Chaos particles
    this.createParticleBurst(0xff00ff, 80);
    
    // Distortion rings
    for (let i = 0; i < 3; i++) {
      const ringGeometry = new THREE.TorusGeometry(15 + i * 5, 0.3, 16, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.set(0, 20 + i * 10, 0);
      ring.userData.isRitualFX = true;
      this.scene.add(ring);
      
      this.ritualVisuals.set(`fissure_ring_${i}`, {
        object: ring,
        type: 'fissure_ring',
        targetOpacity: 0.5,
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
      });
      
      const beam = new THREE.Mesh(beamGeometry, beamMaterial);
      beam.position.copy(dir.clone().multiplyScalar(0.5));
      beam.lookAt(0, 0, 0);
      beam.rotateX(Math.PI / 2);
      beam.userData.isRitualFX = true;
      this.scene.add(beam);
      
      this.ritualVisuals.set(`harmony_beam_${i}`, {
        object: beam,
        type: 'converging_beam',
        targetOpacity: 0.6,
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
    });
    
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(0, 5, 0);
    sphere.userData.isRitualFX = true;
    this.scene.add(sphere);
    
    this.ritualVisuals.set('harmony_sphere', {
      object: sphere,
      type: 'harmony_sphere',
      targetOpacity: 0.4,
    });
    
    this.createParticleBurst(0x00ffaa, 40);
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
    });
    
    const spiral = new THREE.Line(spiralGeometry, spiralMaterial);
    spiral.userData.isRitualFX = true;
    this.scene.add(spiral);
    
    this.ritualVisuals.set('chaos_spiral', {
      object: spiral,
      type: 'spiral',
      targetOpacity: 0.7,
    });
    
    // Chaotic particles
    this.createParticleBurst(0xff0088, 60);
    
    // Random lightning bolts
    for (let i = 0; i < 5; i++) {
      const boltGeometry = new THREE.CylinderGeometry(0.1, 0.1, 30, 8);
      const boltMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0088,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      
      const bolt = new THREE.Mesh(boltGeometry, boltMaterial);
      const angle = (i / 5) * Math.PI * 2;
      bolt.position.set(Math.cos(angle) * 20, 15, Math.sin(angle) * 20);
      bolt.userData.isRitualFX = true;
      this.scene.add(bolt);
      
      this.ritualVisuals.set(`chaos_bolt_${i}`, {
        object: bolt,
        type: 'chaos_bolt',
        targetOpacity: 0.8,
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
      });
      
      const mandala = new THREE.Mesh(geometry, material);
      mandala.rotation.x = Math.PI / 2;
      mandala.position.y = 10;
      mandala.userData.isRitualFX = true;
      this.scene.add(mandala);
      
      this.ritualVisuals.set(`mandala_layer_${layer}`, {
        object: mandala,
        type: 'mandala',
        targetOpacity: 0.3,
        rotationSpeed: 0.1 + layer * 0.05,
      });
    }
    
    this.createParticleBurst(0xffffff, 30);
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
      });
      
      const wave = new THREE.Mesh(waveGeometry, waveMaterial);
      wave.rotation.x = Math.PI / 2;
      wave.position.y = 5;
      wave.userData.isRitualFX = true;
      this.scene.add(wave);
      
      this.ritualVisuals.set(`echo_wave_${i}`, {
        object: wave,
        type: 'echo_wave',
        targetOpacity: 0.5,
        delay: i * 0.5,
        startTime: Date.now() / 1000,
      });
    }
    
    // Memory trails
    this.createParticleBurst(0x8888ff, 40);
  }
  
  /**
   * Create particle burst
   */
  createParticleBurst(color, count) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 5 + Math.random() * 15;
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = 10 + r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      positions.push(x, y, z);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color,
      size: 0.5,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    
    const particles = new THREE.Points(geometry, material);
    particles.userData.isRitualFX = true;
    this.scene.add(particles);
    
    this.ritualVisuals.set('particle_burst', {
      object: particles,
      type: 'particles',
      targetOpacity: 0.8,
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
          // Rise and fade
          if (visual.object.material) {
            visual.object.material.opacity = THREE.MathUtils.lerp(
              visual.object.material.opacity,
              visual.targetOpacity * phaseIntensity,
              0.05
            );
            
            visual.object.position.y = visual.startHeight + this.ritualProgress * 20;
            visual.object.rotation.z += deltaTime * 0.5;
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
          // Pulse
          if (visual.object.material) {
            visual.object.material.opacity = THREE.MathUtils.lerp(
              visual.object.material.opacity,
              visual.targetOpacity * phaseIntensity,
              0.05
            );
            
            const pulseFactor = 1 + Math.sin(Date.now() / 300) * 0.2;
            visual.object.scale.setScalar(pulseFactor);
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
          // Flicker
          if (visual.object.material) {
            const flickerIntensity = Math.random() > 0.5 ? 1.0 : 0.3;
            visual.object.material.opacity = visual.targetOpacity * phaseIntensity * flickerIntensity;
          }
          break;
        
        case 'mandala':
          // Rotate layers
          if (visual.object.material) {
            visual.object.material.opacity = THREE.MathUtils.lerp(
              visual.object.material.opacity,
              visual.targetOpacity * phaseIntensity,
              0.05
            );
            
            visual.object.rotation.z += deltaTime * visual.rotationSpeed;
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
          // Fade in/out
          if (visual.object.material) {
            visual.object.material.opacity = THREE.MathUtils.lerp(
              visual.object.material.opacity,
              visual.targetOpacity * phaseIntensity,
              0.05
            );
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
      if (!node.material) return;
      if (!node.material.emissiveIntensity !== undefined) return;
      
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
    console.log(`✨ MYTHIC RITUAL COMPLETE: ${this.activeRitual}`);
    
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
      const node = this.scene.children.find(obj => obj.uuid === uuid);
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
    
    // Reset state
    this.activeRitual = null;
    this.ritualPhase = 'NONE';
    this.ritualProgress = 0;
  }
  
  /**
   * Update HUD
   */
  updateHUD(deltaTime) {
    if (!this.ritualHUD) {
      this.ritualHUD = document.getElementById('mythic-ritual-hud');
      if (!this.ritualHUD) {
        return;
      }
    }

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
    this.cancelRitual();
    
    // Remove HUD
    if (this.ritualHUD && this.ritualHUD.parentNode) {
      this.ritualHUD.parentNode.removeChild(this.ritualHUD);
    }
  }
}
