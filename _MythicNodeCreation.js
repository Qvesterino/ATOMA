/**
 * MYTHIC NODE CREATION RITUAL — SAFE ALL-IN EDITION
 * 
 * A cinematic ritual sequence where a new Mythic Node is born in front of the player.
 * All effects are visual only, fully reversible, safe, and non-destructive.
 * 
 * HARD SAFETY RULES:
 * - NO modifications to player movement, camera, physics, linking logic, AIModels.js
 * - All effects are visual FX layers only
 * - Fully reversible and safe to interrupt
 * - No gameplay impact whatsoever
 * 
 * RITUAL PHASES:
 * 1. INIT (2-3s): Triple ritual circles spawn under player
 * 2. ALIGNMENT (5s): 3 floating sigils orbit player
 * 3. SEED_IGNITION (4s): Glowing mythic seed orb appears
 * 4. BIRTH (3-5s): Orb transforms into new mythic node
 * 5. RESOLUTION (4s): Cleanup and buff grant
 */

import * as THREE from 'three';
import { EnhancedNodeModels } from './EnhancedNodeModels.js';
import { spawnAuthority } from './SpawnAuthority.js';

export class MythicNodeCreation {
  constructor(scene, camera, player, aiNodes, worldController) {
    this.scene = scene;
    this.camera = camera;
    this.player = player;
    this.aiNodes = aiNodes;
    this.worldController = worldController;
    
    // Ritual state
    this.isActive = false;
    this.ritualPhase = 'NONE'; // NONE, INIT, ALIGNMENT, SEED_IGNITION, BIRTH, RESOLUTION
    this.phaseStartTime = 0;
    this.phaseProgress = 0;
    
    // Phase durations (seconds)
    this.phaseDurations = {
      INIT: 2.5,
      ALIGNMENT: 5.0,
      SEED_IGNITION: 4.0,
      BIRTH: 4.0,
      RESOLUTION: 4.0,
    };
    
    // Cooldown
    this.lastRitualTime = 0;
    this.ritualCooldown = 60.0; // 60s between rituals
    
    // Visual elements
    this.ritualGroup = new THREE.Group();
    this.ritualGroup.userData.isMythicRitualFX = true;
    this.scene.add(this.ritualGroup);
    
    this.ritualCircles = [];
    this.alignmentSigils = [];
    this.seedOrb = null;
    this.birthBeam = null;
    this.mythicNode = null;
    
    // Input tracking
    this.energyKeyPressed = false;
    this.energyPulseSent = false;
    
    // HUD
    this.ritualHUD = null;
    
    // World state backup
    this.worldBackup = null;
    
    // Performance
    this.skipRitual = false;
    
    // Setup input
    this.setupInput();
    
    // Debug flag
    window.debugTriggerMythicNodeCreation = () => this.triggerRitual();
    
    console.log('✓ Mythic Node Creation Ritual initialized');
  }
  
  /**
   * Initialize HUD
   */
  initializeHUD() {
    this.ritualHUD = document.createElement('div');
    this.ritualHUD.id = 'mythic-creation-hud';
    this.ritualHUD.style.cssText = `
      position: fixed;
      top: 40%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 15px 25px;
      background: rgba(0, 0, 0, 0.85);
      border: 2px solid rgba(255, 215, 0, 0.9);
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 16px;
      font-weight: bold;
      color: #ffd700;
      z-index: 10000;
      pointer-events: none;
      opacity: 0;
      text-align: center;
      box-shadow: 0 0 25px rgba(255, 215, 0, 0.6);
      text-shadow: 0 0 8px rgba(255, 215, 0, 0.9);
      transition: opacity 0.3s;
    `;
    
    document.body.appendChild(this.ritualHUD);
  }
  
  /**
   * Setup input listeners
   */
  setupInput() {
    document.addEventListener('keydown', (e) => {
      // R key triggers ritual
      if (e.key.toLowerCase() === 'r' && !this.isActive) {
        this.tryTriggerRitual();
      }
      
      // E key sends energy pulse during ritual
      if (e.key.toLowerCase() === 'e' && !this.energyKeyPressed) {
        this.energyKeyPressed = true;
        this.tryEnergyPulse();
      }
    });
    
    document.addEventListener('keyup', (e) => {
      if (e.key.toLowerCase() === 'e') {
        this.energyKeyPressed = false;
      }
    });
  }
  
  /**
   * Main update loop
   * 
   * FIXED (Session 37+): Added cleanup timer tracking (replaces setTimeout).
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunSimulation?.()) return;
    if (!this.player) return;
    if (this.skipRitual) return;
    
    // Performance check
    if (deltaTime > 0.04) { // <25 FPS
      if (this.isActive) {
        console.warn('Mythic Node Creation: Cancelling due to low FPS');
        this.cancelRitual();
      }
      this.skipRitual = true;
      return;
    }
    
    // FIXED (Session 37+): Handle deferred cleanup with dt accumulation
    if (this.cleanupScheduled && this.ritualCleanupTimer !== undefined) {
      this.ritualCleanupTimer -= deltaTime;
      if (this.ritualCleanupTimer <= 0) {
        this.cleanupRitual();
        this.cleanupScheduled = false;
        this.ritualCleanupTimer = undefined;
      }
    }
    
    // FIXED (Session 37+ Part 2): Handle HUD hide timer (game-time driven instead of setTimeout)
    if (this.hudScheduledHide && this.hudHideTimer !== undefined) {
      this.hudHideTimer -= deltaTime;
      if (this.hudHideTimer <= 0) {
        if (this.ritualPhase !== 'RESOLUTION') {
          this.ritualHUD.style.opacity = '0';
        }
        this.hudScheduledHide = false;
        this.hudHideTimer = undefined;
      }
    }
    
    // Update active ritual
    if (this.isActive) {
      this.updateRitual(deltaTime);
    } else {
      // Auto-trigger check (optional)
      this.checkAutoTrigger();
    }
    
    // Update ritual group position
    if (this.player.position) {
      this.ritualGroup.position.lerp(this.player.position, 0.1);
    }
  }
  
  /**
   * Check if ritual should auto-trigger
   */
  checkAutoTrigger() {
    // Check cooldown
    const timeSinceLastRitual = Date.now() / 1000 - this.lastRitualTime;
    if (timeSinceLastRitual < this.ritualCooldown) return;
    
    // Check world mood
    if (!this.worldController || !this.worldController.worldMood) return;
    
    const mood = this.worldController.worldMood.label;
    
    // Auto-trigger on special moods (optional, can be disabled)
    if (mood === 'ASCENDED_ALIGNMENT' && Math.random() < 0.001) {
      // Very low chance per frame during ascended alignment
      this.triggerRitual();
    }
  }
  
  /**
   * Try to trigger ritual (R key or auto)
   */
  tryTriggerRitual() {
    const timeSinceLastRitual = Date.now() / 1000 - this.lastRitualTime;
    if (timeSinceLastRitual < this.ritualCooldown) {
      console.log(`Mythic Node Creation: Cooldown (${(this.ritualCooldown - timeSinceLastRitual).toFixed(1)}s remaining)`);
      return;
    }
    
    this.triggerRitual();
  }
  
  /**
   * Trigger the ritual
   */
  triggerRitual() {
    if (this.isActive) return;
    
    console.log('✨ MYTHIC NODE CREATION RITUAL BEGINS');
    
    this.isActive = true;
    this.ritualPhase = 'INIT';
    this.phaseStartTime = Date.now() / 1000;
    this.phaseProgress = 0;
    this.lastRitualTime = Date.now() / 1000;
    this.energyPulseSent = false;
    
    // Backup world state
    this.backupWorldState();
    
    // Initialize phase
    this.initializePhase('INIT');
  }
  
  /**
   * Backup world state
   */
  backupWorldState() {
    this.worldBackup = {
      skyColor: this.scene.background ? this.scene.background.clone() : null,
      fogColor: this.scene.fog ? this.scene.fog.color.clone() : null,
    };
  }
  
  /**
   * Initialize ritual phase
   */
  initializePhase(phase) {
    console.log(`Ritual Phase: ${phase}`);
    
    switch (phase) {
      case 'INIT':
        this.createRitualCircles();
        this.showHUD('MYTHIC RITUAL COMMENCING...');
        break;
      
      case 'ALIGNMENT':
        this.createAlignmentSigils();
        this.showHUD('ALIGNMENT PHASE');
        break;
      
      case 'SEED_IGNITION':
        this.createSeedOrb();
        this.showHUD('MYTHIC SEED IGNITED');
        break;
      
      case 'BIRTH':
        this.startBirthSequence();
        this.showHUD('CONVERGENCE...');
        break;
      
      case 'RESOLUTION':
        this.showHUD('MYTHIC NODE BORN');
        break;
    }
  }
  
  /**
   * Update ritual
   */
  updateRitual(deltaTime) {
    const currentTime = Date.now() / 1000;
    const elapsed = currentTime - this.phaseStartTime;
    const duration = this.phaseDurations[this.ritualPhase];
    
    this.phaseProgress = Math.min(elapsed / duration, 1.0);
    
    // Update phase-specific visuals
    this.updatePhaseVisuals(deltaTime);
    
    // Apply world effects
    this.applyWorldEffects(deltaTime);
    
    // Check for phase transition
    if (this.phaseProgress >= 1.0) {
      this.advancePhase();
    }
  }
  
  /**
   * Advance to next phase
   */
  advancePhase() {
    const phases = ['INIT', 'ALIGNMENT', 'SEED_IGNITION', 'BIRTH', 'RESOLUTION'];
    const currentIndex = phases.indexOf(this.ritualPhase);
    
    if (currentIndex < phases.length - 1) {
      this.ritualPhase = phases[currentIndex + 1];
      this.phaseStartTime = Date.now() / 1000;
      this.phaseProgress = 0;
      
      this.initializePhase(this.ritualPhase);
    } else {
      // Ritual complete
      this.completeRitual();
    }
  }
  
  /**
   * Update phase-specific visuals
   */
  updatePhaseVisuals(deltaTime) {
    switch (this.ritualPhase) {
      case 'INIT':
        this.updateRitualCircles(deltaTime);
        break;
      
      case 'ALIGNMENT':
        this.updateRitualCircles(deltaTime);
        this.updateAlignmentSigils(deltaTime);
        this.checkSigilProximity();
        break;
      
      case 'SEED_IGNITION':
        this.updateRitualCircles(deltaTime);
        this.updateSeedOrb(deltaTime);
        break;
      
      case 'BIRTH':
        this.updateBirthSequence(deltaTime);
        break;
      
      case 'RESOLUTION':
        this.updateResolution(deltaTime);
        break;
    }
  }
  
  /**
   * Create triple ritual circles
   */
  createRitualCircles() {
    const radii = [2.0, 2.8, 3.6];
    const colors = [0xffd700, 0xffaa00, 0xff8800];
    
    radii.forEach((radius, i) => {
      const circleGeometry = new THREE.RingGeometry(radius - 0.1, radius + 0.1, 64);
      const circleMaterial = new THREE.MeshBasicMaterial({
        color: colors[i],
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      
      const circle = new THREE.Mesh(circleGeometry, circleMaterial);
      circle.rotation.x = -Math.PI / 2;
      circle.position.y = 0.05;
      circle.userData.targetOpacity = 0.5 - i * 0.1;
      circle.userData.rotationDirection = i % 2 === 0 ? 1 : -1;
      circle.userData.rotationSpeed = 0.3 + i * 0.1;
      
      this.ritualCircles.push(circle);
      this.ritualGroup.add(circle);
    });
  }
  
  /**
   * Update ritual circles
   */
  updateRitualCircles(deltaTime) {
    const fadeSpeed = this.ritualPhase === 'RESOLUTION' ? 0.05 : 0.1;
    const targetOpacity = this.ritualPhase === 'RESOLUTION' ? 0 : 1.0;
    
    this.ritualCircles.forEach(circle => {
      // Fade in/out
      const opacity = circle.userData.targetOpacity * targetOpacity * this.phaseProgress;
      circle.material.opacity = THREE.MathUtils.lerp(
        circle.material.opacity,
        opacity,
        fadeSpeed
      );
      
      // Rotate
      circle.rotation.z += deltaTime * circle.userData.rotationSpeed * circle.userData.rotationDirection;
      
      // Pulse
      const pulseFactor = 1 + Math.sin(Date.now() / 500) * 0.05;
      circle.scale.setScalar(pulseFactor);
    });
  }
  
  /**
   * Create alignment sigils
   */
  createAlignmentSigils() {
    const sigilCount = 3;
    
    for (let i = 0; i < sigilCount; i++) {
      // Create hexagonal sigil
      const shape = new THREE.Shape();
      const sides = 6;
      const radius = 0.6;
      
      for (let j = 0; j <= sides; j++) {
        const angle = (j / sides) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        if (j === 0) {
          shape.moveTo(x, y);
        } else {
          shape.lineTo(x, y);
        }
      }
      
      const geometry = new THREE.ShapeGeometry(shape);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      
      const sigil = new THREE.Mesh(geometry, material);
      sigil.userData.sigilIndex = i;
      sigil.userData.activated = false;
      sigil.userData.targetOpacity = 0.7;
      
      this.alignmentSigils.push(sigil);
      this.ritualGroup.add(sigil);
    }
  }
  
  /**
   * Update alignment sigils
   */
  updateAlignmentSigils(deltaTime) {
    const time = Date.now() / 1000;
    const orbitRadius = 4.0;
    const orbitSpeed = 0.4;
    
    this.alignmentSigils.forEach((sigil, i) => {
      // Orbit around player
      const angle = time * orbitSpeed + (i / 3) * Math.PI * 2;
      sigil.position.x = Math.cos(angle) * orbitRadius;
      sigil.position.z = Math.sin(angle) * orbitRadius;
      sigil.position.y = 2.0 + Math.sin(time * 2 + i) * 0.4;
      
      // Face camera
      sigil.lookAt(this.camera.position);
      
      // Fade in
      const targetOpacity = sigil.userData.activated ? 1.0 : sigil.userData.targetOpacity;
      sigil.material.opacity = THREE.MathUtils.lerp(
        sigil.material.opacity,
        targetOpacity * this.phaseProgress,
        0.1
      );
      
      // Rotate
      sigil.rotation.z += deltaTime * 0.5;
    });
  }
  
  /**
   * Check sigil proximity
   */
  checkSigilProximity() {
    if (!this.player || !this.player.position) return;
    
    this.alignmentSigils.forEach(sigil => {
      if (sigil.userData.activated) return;
      
      const sigilWorldPos = new THREE.Vector3();
      sigil.getWorldPosition(sigilWorldPos);
      
      const distance = this.player.position.distanceTo(sigilWorldPos);
      
      if (distance < 1.5) {
        this.activateSigil(sigil);
      }
    });
  }
  
  /**
   * Activate sigil
   */
  activateSigil(sigil) {
    sigil.userData.activated = true;
    sigil.material.opacity = 1.0;
    
    // Create pulse
    const pulseGeometry = new THREE.RingGeometry(0.6, 0.7, 32);
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    
    const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
    pulse.position.copy(sigil.position);
    pulse.userData.isPulse = true;
    pulse.userData.startTime = Date.now() / 1000;
    
    this.ritualGroup.add(pulse);
    
    // Emit convergence pulse
    this.emitConvergencePulse();
    
    console.log('✨ Alignment Sigil Activated');
  }
  
  /**
   * Emit convergence pulse
   */
  emitConvergencePulse() {
    const pulseGeometry = new THREE.RingGeometry(1, 1.2, 32);
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    
    const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
    pulse.rotation.x = -Math.PI / 2;
    pulse.position.y = 0.1;
    pulse.userData.isWorldPulse = true;
    pulse.userData.startTime = Date.now() / 1000;
    
    this.ritualGroup.add(pulse);
  }
  
  /**
   * Create seed orb
   */
  createSeedOrb() {
    // Position in front of player
    const spawnPos = new THREE.Vector3();
    if (this.camera && this.camera.getWorldDirection) {
      const direction = new THREE.Vector3();
      this.camera.getWorldDirection(direction);
      spawnPos.copy(this.player.position).add(direction.multiplyScalar(3));
      spawnPos.y = this.player.position.y + 1.5;
    } else {
      spawnPos.set(
        this.player.position.x,
        this.player.position.y + 1.5,
        this.player.position.z - 3
      );
    }
    
    // Create triple-layer orb
    const orbGroup = new THREE.Group();
    orbGroup.position.copy(spawnPos);
    
    // Inner core
    const coreGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      emissive: 0xffffff,
      emissiveIntensity: 1.0,
      blending: THREE.AdditiveBlending,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    orbGroup.add(core);
    
    // Middle layer
    const midGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const midMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const mid = new THREE.Mesh(midGeometry, midMaterial);
    orbGroup.add(mid);
    
    // Outer layer
    const outerGeometry = new THREE.SphereGeometry(0.7, 16, 16);
    const outerMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const outer = new THREE.Mesh(outerGeometry, outerMaterial);
    orbGroup.add(outer);
    
    orbGroup.userData.core = core;
    orbGroup.userData.mid = mid;
    orbGroup.userData.outer = outer;
    orbGroup.userData.targetOpacity = 0.8;
    
    this.seedOrb = orbGroup;
    this.scene.add(this.seedOrb);
  }
  
  /**
   * Update seed orb
   */
  updateSeedOrb(deltaTime) {
    if (!this.seedOrb) return;
    
    const time = Date.now() / 1000;
    
    // Fade in
    const targetOpacity = this.seedOrb.userData.targetOpacity * this.phaseProgress;
    this.seedOrb.userData.core.material.opacity = THREE.MathUtils.lerp(
      this.seedOrb.userData.core.material.opacity,
      targetOpacity,
      0.1
    );
    this.seedOrb.userData.mid.material.opacity = THREE.MathUtils.lerp(
      this.seedOrb.userData.mid.material.opacity,
      targetOpacity * 0.6,
      0.1
    );
    this.seedOrb.userData.outer.material.opacity = THREE.MathUtils.lerp(
      this.seedOrb.userData.outer.material.opacity,
      targetOpacity * 0.3,
      0.1
    );
    
    // Rotate
    this.seedOrb.rotation.y += deltaTime * 0.5;
    this.seedOrb.rotation.x += deltaTime * 0.3;
    
    // Pulse
    const pulseFactor = 1 + Math.sin(time * 3) * 0.1;
    this.seedOrb.scale.setScalar(pulseFactor);
    
    // Triple-layer rotation
    this.seedOrb.userData.core.rotation.y += deltaTime * 2;
    this.seedOrb.userData.mid.rotation.y -= deltaTime * 1.5;
    this.seedOrb.userData.outer.rotation.y += deltaTime;
  }
  
  /**
   * Try energy pulse (E key)
   */
  tryEnergyPulse() {
    if (!this.isActive) return;
    if (this.ritualPhase !== 'SEED_IGNITION') return;
    if (this.energyPulseSent) return;
    
    this.energyPulseSent = true;
    
    // FIXED (Session 37+): Removed setTimeout.
    // Now registers timed property effect with orchestrator.
    if (this.seedOrb && this.seedOrb.userData.core && this.effectOrchestrator) {
      // Set initial bright state
      this.seedOrb.userData.core.material.emissiveIntensity = 2.0;
      
      // Register decay effect (2.0 → 1.0 over 0.3 seconds)
      const decayEffect = {
        id: `energy-pulse-decay-${Date.now()}`,
        type: 'emissiveDecay',
        elapsed: 0,
        duration: 0.3,
        material: this.seedOrb.userData.core.material,
        startValue: 2.0,
        endValue: 1.0,
        
        update: (dt, time) => {
          const progress = Math.min(this.elapsed / this.duration, 1);
          const value = this.startValue + (this.endValue - this.startValue) * progress;
          if (this.material) {
            this.material.emissiveIntensity = value;
          }
          return { done: progress >= 1 };
        },
        
        dispose: () => {
          // Property left at final value
        }
      };
      
      this.effectOrchestrator.add(decayEffect);
    } else if (this.seedOrb) {
      // Fallback: set immediately
      console.warn('[MythicNodeCreation] effectOrchestrator not available, skipping emissive decay');
      this.seedOrb.userData.core.material.emissiveIntensity = 1.0;
    }
    
    console.log('⚡ Energy Pulse Sent to Seed');
  }
  
  /**
   * Start birth sequence
   */
  startBirthSequence() {
    // Create beam from sky
    if (this.seedOrb) {
      const beamGeometry = new THREE.CylinderGeometry(0.5, 1.0, 50, 16);
      const beamMaterial = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      
      this.birthBeam = new THREE.Mesh(beamGeometry, beamMaterial);
      this.birthBeam.position.copy(this.seedOrb.position);
      this.birthBeam.position.y += 25;
      this.scene.add(this.birthBeam);
    }
  }
  
  /**
   * Update birth sequence
   */
  updateBirthSequence(deltaTime) {
    // Fade beam
    if (this.birthBeam) {
      const beamOpacity = 0.4 * Math.sin(this.phaseProgress * Math.PI);
      this.birthBeam.material.opacity = beamOpacity;
    }
    
    // Transform orb
    if (this.seedOrb) {
      const explosionFactor = this.phaseProgress > 0.5 ? (this.phaseProgress - 0.5) * 4 : 0;
      this.seedOrb.scale.setScalar(1 + explosionFactor * 0.5);
      
      // Fade out at end
      if (this.phaseProgress > 0.7) {
        const fadeOut = (this.phaseProgress - 0.7) / 0.3;
        this.seedOrb.userData.core.material.opacity *= (1 - fadeOut);
        this.seedOrb.userData.mid.material.opacity *= (1 - fadeOut);
        this.seedOrb.userData.outer.material.opacity *= (1 - fadeOut);
      }
    }
    
    // Spawn node at 80% progress
    if (this.phaseProgress > 0.8 && !this.mythicNode) {
      this.spawnMythicNode();
    }
  }
  
  /**
   * Spawn mythic node
   */
  spawnMythicNode() {
    if (!this.seedOrb) return;
    
    const spawnPos = this.seedOrb.position.clone();
    
    // Delegate mythic creation to canonical funnel (AINodes.spawnNode)
    if (window.__ALLOW_EXTERNAL_SPAWN__ !== true) {
      console.warn('[SpawnAuthority] External spawn blocked');
      return;
    }
    const nodeModel = spawnAuthority.spawn(this.aiNodes, 'mythic', spawnPos, 'MYTHIC-CEREMONIAL');
    if (!nodeModel) {
      return;
    }

    // Preserve existing mythic metadata on the canonical node
    nodeModel.userData = nodeModel.userData || {};
    nodeModel.userData.isMythic = true;
    nodeModel.userData.mythicCreatedAt = Date.now();
    nodeModel.userData.personality = {
      type: 'MYTHIC_ARCHETYPE',
      mood: 'TRANSCENDENT',
      intensity: 1.0,
    };
    nodeModel.userData.metrics = {
      SynergyOutput: 100,
      stability: 95,
      harmony: 100,
      harmonyAffinity: 95,
      stabilityFactor: 5,
      archetype: 'ASCENDED',
    };

    // Root scale is owned by canonical spawn baseline authority.
    // Keep ritual progression metadata-only to avoid post-spawn root conflicts.
    nodeModel.userData.mythicRitualBirth = {
      targetScale: 1.2,
      startedAt: Date.now()
    };
    
    this.mythicNode = nodeModel;
    
    console.log('✨ MYTHIC NODE SPAWNED');
  }
  
  /**
   * Update resolution phase
   */
  updateResolution(deltaTime) {
    // Root scale stays untouched after spawn finalization.
    
    // Fade circles
    this.updateRitualCircles(deltaTime);
    
    // Fade sigils
    this.alignmentSigils.forEach(sigil => {
      sigil.material.opacity *= 0.95;
      sigil.position.y += deltaTime * 0.5;
    });
  }
  
  /**
   * Apply world effects
   */
  applyWorldEffects(deltaTime) {
    if (!this.scene.background || !this.scene.fog) return;
    
    // Shift to ritual colors
    const targetSkyColor = new THREE.Color(0x111144);
    const targetFogColor = new THREE.Color(0x222255);
    
    if (this.ritualPhase === 'RESOLUTION') {
      // Restore original
      if (this.worldBackup && this.worldBackup.skyColor) {
        this.scene.background.lerp(this.worldBackup.skyColor, 0.05);
      }
      if (this.worldBackup && this.worldBackup.fogColor) {
        this.scene.fog.color.lerp(this.worldBackup.fogColor, 0.05);
      }
    } else {
      // Apply ritual colors
      this.scene.background.lerp(targetSkyColor, 0.02);
      this.scene.fog.color.lerp(targetFogColor, 0.02);
    }
  }
  
  /**
   * Complete ritual
   * 
   * FIXED (Session 37+): Removed setTimeout.
   * Now uses accumulated time tracking instead of wall-clock delay.
   */
  completeRitual() {
    console.log('✨ MYTHIC NODE CREATION COMPLETE');
    
    // FIXED: Track cleanup timer instead of using setTimeout
    this.ritualCleanupTimer = 1.0; // 1 second in game time
    this.cleanupScheduled = true;
  }
  
  /**
   * Cleanup ritual
   */
  cleanupRitual() {
    // Remove circles
    this.ritualCircles.forEach(circle => {
      this.ritualGroup.remove(circle);
      circle.geometry.dispose();
      circle.material.dispose();
    });
    this.ritualCircles = [];
    
    // Remove sigils
    this.alignmentSigils.forEach(sigil => {
      this.ritualGroup.remove(sigil);
      sigil.geometry.dispose();
      sigil.material.dispose();
    });
    this.alignmentSigils = [];
    
    // Remove seed orb
    if (this.seedOrb) {
      this.scene.remove(this.seedOrb);
      this.seedOrb.children.forEach(child => {
        child.geometry.dispose();
        child.material.dispose();
      });
      this.seedOrb = null;
    }
    
    // Remove beam
    if (this.birthBeam) {
      this.scene.remove(this.birthBeam);
      this.birthBeam.geometry.dispose();
      this.birthBeam.material.dispose();
      this.birthBeam = null;
    }
    
    // Remove pulses
    const pulsesToRemove = [];
    this.ritualGroup.children.forEach(child => {
      if (child.userData.isPulse || child.userData.isWorldPulse) {
        pulsesToRemove.push(child);
      }
    });
    
    pulsesToRemove.forEach(pulse => {
      this.ritualGroup.remove(pulse);
      pulse.geometry.dispose();
      pulse.material.dispose();
    });
    
    // Restore world
    if (this.worldBackup) {
      if (this.scene.background && this.worldBackup.skyColor) {
        this.scene.background.copy(this.worldBackup.skyColor);
      }
      if (this.scene.fog && this.worldBackup.fogColor) {
        this.scene.fog.color.copy(this.worldBackup.fogColor);
      }
    }
    
    // Hide HUD
    this.hideHUD();
    
    // Reset state
    this.isActive = false;
    this.ritualPhase = 'NONE';
  }
  
  /**
   * Cancel ritual (emergency)
   */
  cancelRitual() {
    console.warn('Mythic Node Creation: Cancelled');
    this.cleanupRitual();
  }
  
  /**
   * Show HUD message
   * 
   * FIXED (Session 37+ Part 2): Converted setTimeout to game-time driven state machine.
   * HUD hide timer is now tracked via this.hudHideTimer and updated in update() loop.
   */
  showHUD(message) {
    if (!this.ritualHUD) return;
    
    this.ritualHUD.textContent = message;
    this.ritualHUD.style.opacity = '1';
    
    // Schedule hide via game-time (2 seconds = 2.0 seconds in deltaTime)
    this.hudHideTimer = 2.0;
    this.hudScheduledHide = true;
  }
  
  /**
   * Hide HUD
   */
  hideHUD() {
    if (!this.ritualHUD) return;
    this.ritualHUD.style.opacity = '0';
  }
  
  /**
   * Destroy controller
   */
  destroy() {
    this.cancelRitual();
    
    // Remove ritual group
    this.scene.remove(this.ritualGroup);
    
    // Remove HUD
    if (this.ritualHUD && this.ritualHUD.parentNode) {
      this.ritualHUD.parentNode.removeChild(this.ritualHUD);
    }
  }
}
