/**
 * MYTHIC RITUAL EVENTS 2.0 — PLAYER PARTICIPATION (SAFE EDITION)
 * 
 * Extends the ritual system to include optional player participation.
 * Makes the player feel connected to rituals through visual effects and interactions.
 * 
 * HARD SAFETY RULES:
 * - NO modifications to player physics, gravity, movement speed, dash, jump, camera
 * - Player interaction is purely visual and optional
 * - No gameplay mechanics or damage systems
 * - Everything gracefully disables after ritual ends
 * - All effects are cosmetic children of player (never modify player directly)
 * 
 * FEATURES:
 * 1. RITUAL CIRCLE - Holographic ring follows player
 * 2. PLAYER AURA - Ritual-colored glow around player
 * 3. HARMONIC ALIGNMENT - 3 rotating symbols (optional interaction)
 * 4. ENERGY PULSE - "E" key emits visual pulse
 * 5. COMPLETION MOMENT - Sigil + beam at peak→fall transition
 * 6. COSMETIC BUFFS - Temporary trail/particle effects after ritual
 */

import * as THREE from 'three';

export class MythicRitualPlayer {
  constructor(scene, camera, player) {
    this.scene = scene;
    this.camera = camera;
    this.player = player;
    
    // Ritual state (provided by controller)
    this.isRitualActive = false;
    this.ritualType = null;
    this.ritualPhase = 'NONE';
    this.ritualIntensity = 0;
    
    // Player effect group (all effects are children)
    this.playerEffectGroup = new THREE.Group();
    this.playerEffectGroup.userData.isPlayerRitualFX = true;
    this.scene.add(this.playerEffectGroup);
    
    // Visual elements
    this.ritualCircle = null;
    this.playerAura = null;
    this.harmonicSymbols = [];
    this.completionSigil = null;
    this.completionBeam = null;
    
    // Cosmetic buff state
    this.activeBuff = null;
    this.buffEndTime = 0;
    this.buffVisuals = null;
    
    // Input tracking
    this.keyPressed = false;
    this.lastPulseTime = 0;
    this.pulseCooldown = 2.0; // 2s between pulses
    
    // Harmonic alignment state
    this.symbolsActive = false;
    this.symbolRotation = 0;
    this.lastSymbolCheck = 0;
    this.symbolCheckInterval = 0.2; // 5Hz
    
    // Performance mode
    this.performanceMode = 'normal';
    
    // Completion moment tracking
    this.lastPhase = 'NONE';
    this.completionTriggered = false;
    
    // Setup input listener
    this.setupInputListener();
    
    console.log('✓ Mythic Ritual Player 2.0 initialized');
  }
  
  /**
   * Setup input listener for energy pulse
   */
  setupInputListener() {
    document.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'e' && !this.keyPressed) {
        this.keyPressed = true;
        this.tryTriggerEnergyPulse();
      }
    });
    
    document.addEventListener('keyup', (e) => {
      if (e.key.toLowerCase() === 'e') {
        this.keyPressed = false;
      }
    });
  }
  
  /**
   * Main update loop
   */
  update(deltaTime, isRitualActive, ritualType, ritualPhase, ritualIntensity) {
    if (!this.player) return;
    
    // Update ritual state
    const wasActive = this.isRitualActive;
    this.isRitualActive = isRitualActive;
    this.ritualType = ritualType;
    this.ritualPhase = ritualPhase;
    this.ritualIntensity = ritualIntensity || 0;
    
    // Detect phase transition (PEAK → FALL = completion moment)
    if (this.lastPhase === 'PEAK' && ritualPhase === 'FALL' && !this.completionTriggered) {
      this.triggerCompletionMoment();
      this.completionTriggered = true;
    }
    
    // Reset completion flag if new phase
    if (ritualPhase !== 'FALL') {
      this.completionTriggered = false;
    }
    
    this.lastPhase = ritualPhase;
    
    // Update player effect group position
    if (this.player.position) {
      this.playerEffectGroup.position.copy(this.player.position);
    }
    
    // Update ritual-active effects
    if (isRitualActive) {
      this.updateRitualCircle(deltaTime);
      this.updatePlayerAura(deltaTime);
      this.updateHarmonicAlignment(deltaTime);
      this.updateCompletionEffects(deltaTime);
    } else {
      // Ritual ended, cleanup
      if (wasActive) {
        this.onRitualEnd();
      }
    }
    
    // Update cosmetic buffs (persist after ritual)
    this.updateCosmeticBuff(deltaTime);
  }
  
  /**
   * Get ritual color based on type
   */
  getRitualColor(ritualType) {
    const colors = {
      'ASCENSION_RITUAL': new THREE.Color(0xffd700), // Gold
      'QUANTUM_FISSURE': new THREE.Color(0xff00ff), // Magenta
      'HARMONY_CONVERGENCE': new THREE.Color(0x00ffaa), // Cyan
      'CHAOS_RITUAL': new THREE.Color(0xff0088), // Pink
      'MYTHIC_SIGNAL': new THREE.Color(0xffffff), // White
      'ECHO_RITUAL': new THREE.Color(0x8888ff), // Blue
    };
    
    return colors[ritualType] || new THREE.Color(0x00ffff);
  }
  
  /**
   * Update ritual circle under player
   */
  updateRitualCircle(deltaTime) {
    // Create circle if doesn't exist
    if (!this.ritualCircle) {
      const circleGeometry = new THREE.RingGeometry(1.5, 1.8, 32);
      const circleMaterial = new THREE.MeshBasicMaterial({
        color: this.getRitualColor(this.ritualType),
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      
      this.ritualCircle = new THREE.Mesh(circleGeometry, circleMaterial);
      this.ritualCircle.rotation.x = -Math.PI / 2;
      this.ritualCircle.position.y = 0.05; // Slightly above ground
      this.playerEffectGroup.add(this.ritualCircle);
    }
    
    // Update circle
    const targetOpacity = 0.4 * this.ritualIntensity;
    this.ritualCircle.material.opacity = THREE.MathUtils.lerp(
      this.ritualCircle.material.opacity,
      targetOpacity,
      0.1
    );
    
    // Update color
    const targetColor = this.getRitualColor(this.ritualType);
    this.ritualCircle.material.color.lerp(targetColor, 0.1);
    
    // Gentle rotation
    this.ritualCircle.rotation.z += deltaTime * 0.3;
    
    // Pulsing scale
    const pulseFactor = 1 + Math.sin(Date.now() / 500) * 0.05;
    this.ritualCircle.scale.setScalar(pulseFactor);
  }
  
  /**
   * Update player aura
   */
  updatePlayerAura(deltaTime) {
    // Create aura if doesn't exist
    if (!this.playerAura) {
      const auraGeometry = new THREE.SphereGeometry(0.8, 16, 16);
      const auraMaterial = new THREE.MeshBasicMaterial({
        color: this.getRitualColor(this.ritualType),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthTest: false,   // ⚠️ CRITICAL: Aura overlay does NOT read depth
        depthWrite: false   // ⚠️ CRITICAL: Aura overlay does NOT write depth
      });
      
      this.playerAura = new THREE.Mesh(auraGeometry, auraMaterial);
      this.playerAura.position.y = 1.0; // At player center height
      this.playerEffectGroup.add(this.playerAura);
    }
    
    // Update aura
    const targetOpacity = 0.15 * this.ritualIntensity;
    this.playerAura.material.opacity = THREE.MathUtils.lerp(
      this.playerAura.material.opacity,
      targetOpacity,
      0.08
    );
    
    // Update color
    const targetColor = this.getRitualColor(this.ritualType);
    this.playerAura.material.color.lerp(targetColor, 0.1);
    
    // Gentle breathing
    const breathFactor = 1 + Math.sin(Date.now() / 800) * 0.1;
    this.playerAura.scale.setScalar(breathFactor);
  }
  
  /**
   * Update harmonic alignment symbols
   */
  updateHarmonicAlignment(deltaTime) {
    // Only activate during RISE and PEAK phases
    const shouldBeActive = (this.ritualPhase === 'RISE' || this.ritualPhase === 'PEAK') &&
                          this.performanceMode === 'normal';
    
    // Create symbols if needed
    if (shouldBeActive && this.harmonicSymbols.length === 0) {
      this.createHarmonicSymbols();
    }
    
    // Update symbols
    if (this.harmonicSymbols.length > 0) {
      // Rotate around player
      this.symbolRotation += deltaTime * 0.5;
      
      this.harmonicSymbols.forEach((symbol, index) => {
        const angle = this.symbolRotation + (index / 3) * Math.PI * 2;
        const radius = 3.0;
        
        symbol.position.x = Math.cos(angle) * radius;
        symbol.position.z = Math.sin(angle) * radius;
        symbol.position.y = 1.5 + Math.sin(Date.now() / 1000 + index) * 0.3;
        
        // Face camera
        symbol.lookAt(this.camera.position);
        
        // Gentle rotation
        symbol.rotation.z += deltaTime * 0.5;
        
        // Update opacity
        const targetOpacity = shouldBeActive ? 0.6 : 0;
        symbol.material.opacity = THREE.MathUtils.lerp(
          symbol.material.opacity,
          targetOpacity,
          0.1
        );
      });
      
      // Check proximity (throttled)
      this.lastSymbolCheck += deltaTime;
      if (this.lastSymbolCheck >= this.symbolCheckInterval) {
        this.checkSymbolProximity();
        this.lastSymbolCheck = 0;
      }
      
      // Remove symbols if not active
      if (!shouldBeActive && this.harmonicSymbols[0].material.opacity < 0.05) {
        this.removeHarmonicSymbols();
      }
    }
  }
  
  /**
   * Create harmonic alignment symbols
   */
  createHarmonicSymbols() {
    const symbolCount = 3;
    
    for (let i = 0; i < symbolCount; i++) {
      // Create simple geometric symbol
      const shape = new THREE.Shape();
      const sides = 6;
      const radius = 0.5;
      
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
        color: this.getRitualColor(this.ritualType),
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      
      const symbol = new THREE.Mesh(geometry, material);
      symbol.userData.isHarmonicSymbol = true;
      symbol.userData.activated = false;
      
      this.harmonicSymbols.push(symbol);
      this.playerEffectGroup.add(symbol);
    }
  }
  
  /**
   * Check if player is near any symbol
   */
  checkSymbolProximity() {
    if (!this.player || !this.player.position) return;
    
    this.harmonicSymbols.forEach(symbol => {
      if (symbol.userData.activated) return;
      
      const symbolWorldPos = new THREE.Vector3();
      symbol.getWorldPosition(symbolWorldPos);
      
      const distance = this.player.position.distanceTo(symbolWorldPos);
      
      if (distance < 1.0) {
        // Player stepped into symbol!
        this.activateHarmonicSymbol(symbol);
      }
    });
  }
  
  /**
   * Activate harmonic symbol
   */
  activateHarmonicSymbol(symbol) {
    symbol.userData.activated = true;
    
    // Flash effect
    symbol.material.opacity = 1.0;
    
    // Create pulse ring
    const pulseGeometry = new THREE.RingGeometry(0.5, 0.6, 32);
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: this.getRitualColor(this.ritualType),
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    
    const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
    pulse.position.copy(symbol.position);
    pulse.userData.isPulse = true;
    pulse.userData.startTime = Date.now() / 1000;
    pulse.userData.duration = 1.0;
    
    this.playerEffectGroup.add(pulse);
    
    // Trigger world pulse effect
    this.triggerWorldPulseEffect();
    
    // Trigger micro-events in nearby nodes
    this.triggerNearbyNodeEvents();
    
    console.log('✨ Harmonic Symbol Activated');
  }
  
  /**
   * Remove harmonic symbols
   */
  removeHarmonicSymbols() {
    this.harmonicSymbols.forEach(symbol => {
      this.playerEffectGroup.remove(symbol);
      symbol.geometry.dispose();
      symbol.material.dispose();
    });
    
    this.harmonicSymbols = [];
  }
  
  /**
   * Try to trigger energy pulse (E key)
   */
  tryTriggerEnergyPulse() {
    if (!this.isRitualActive) return;
    
    // Check cooldown
    const timeSinceLastPulse = Date.now() / 1000 - this.lastPulseTime;
    if (timeSinceLastPulse < this.pulseCooldown) return;
    
    this.lastPulseTime = Date.now() / 1000;
    
    // Create radial pulse
    const pulseGeometry = new THREE.RingGeometry(0.5, 0.7, 32);
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: this.getRitualColor(this.ritualType),
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    
    const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
    pulse.rotation.x = -Math.PI / 2;
    pulse.position.y = 0.1;
    pulse.userData.isPulse = true;
    pulse.userData.startTime = Date.now() / 1000;
    pulse.userData.duration = 1.5;
    
    this.playerEffectGroup.add(pulse);
    
    // Trigger nearby node glow
    this.triggerNearbyNodeGlow();
    
    console.log('⚡ Player Energy Pulse Triggered');
  }
  
  /**
   * Trigger world pulse effect
   */
  triggerWorldPulseEffect() {
    // Create expanding ring at ground level
    const worldPulseGeometry = new THREE.RingGeometry(1, 1.2, 32);
    const worldPulseMaterial = new THREE.MeshBasicMaterial({
      color: this.getRitualColor(this.ritualType),
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    
    const worldPulse = new THREE.Mesh(worldPulseGeometry, worldPulseMaterial);
    worldPulse.rotation.x = -Math.PI / 2;
    worldPulse.position.copy(this.player.position);
    worldPulse.position.y = 0.05;
    worldPulse.userData.isWorldPulse = true;
    worldPulse.userData.startTime = Date.now() / 1000;
    worldPulse.userData.duration = 2.0;
    
    this.scene.add(worldPulse);
  }
  
  /**
   * Trigger micro-events in nearby nodes (visual only)
   */
  triggerNearbyNodeEvents() {
    if (!this.player || !this.player.position) return;
    
    // Find nearby nodes
    const nearbyNodes = this.scene.children.filter(obj => {
      if (!obj.userData || !obj.userData.category) return false;
      const distance = obj.position.distanceTo(this.player.position);
      return distance < 10.0;
    });
    
    // Boost their emissive briefly
    nearbyNodes.forEach(node => {
      if (!node.material || node.material.emissiveIntensity === undefined) return;
      
      const originalIntensity = node.material.emissiveIntensity;
      node.material.emissiveIntensity = originalIntensity * 1.5;
      
      // Reset after delay
      setTimeout(() => {
        if (node.material) {
          node.material.emissiveIntensity = originalIntensity;
        }
      }, 500);
    });
  }
  
  /**
   * Trigger nearby node glow (from energy pulse)
   */
  triggerNearbyNodeGlow() {
    if (!this.player || !this.player.position) return;
    
    const nearbyNodes = this.scene.children.filter(obj => {
      if (!obj.userData || !obj.userData.category) return false;
      const distance = obj.position.distanceTo(this.player.position);
      return distance < 8.0;
    });
    
    nearbyNodes.forEach(node => {
      if (!node.material || node.material.emissiveIntensity === undefined) return;
      
      const originalIntensity = node.material.emissiveIntensity;
      node.material.emissiveIntensity = originalIntensity * 1.8;
      
      setTimeout(() => {
        if (node.material) {
          node.material.emissiveIntensity = originalIntensity;
        }
      }, 800);
    });
  }
  
  /**
   * Trigger completion moment (PEAK → FALL transition)
   */
  triggerCompletionMoment() {
    console.log('✨ Ritual Completion Moment');
    
    // Create sigil above player
    const sigilGeometry = new THREE.RingGeometry(0.8, 1.0, 8);
    const sigilMaterial = new THREE.MeshBasicMaterial({
      color: this.getRitualColor(this.ritualType),
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    
    this.completionSigil = new THREE.Mesh(sigilGeometry, sigilMaterial);
    this.completionSigil.position.y = 3.5;
    this.completionSigil.rotation.x = -Math.PI / 2;
    this.completionSigil.userData.startTime = Date.now() / 1000;
    this.playerEffectGroup.add(this.completionSigil);
    
    // Create beam upward
    const beamGeometry = new THREE.CylinderGeometry(0.2, 0.4, 3.0, 16);
    const beamMaterial = new THREE.MeshBasicMaterial({
      color: this.getRitualColor(this.ritualType),
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    
    this.completionBeam = new THREE.Mesh(beamGeometry, beamMaterial);
    this.completionBeam.position.y = 2.0;
    this.completionBeam.userData.startTime = Date.now() / 1000;
    this.playerEffectGroup.add(this.completionBeam);
    
    // Grant cosmetic buff
    this.grantCosmeticBuff();
  }
  
  /**
   * Update completion effects (sigil + beam)
   */
  updateCompletionEffects(deltaTime) {
    // Update sigil
    if (this.completionSigil) {
      const elapsed = Date.now() / 1000 - this.completionSigil.userData.startTime;
      
      if (elapsed > 1.0) {
        // Fade out and remove
        this.completionSigil.material.opacity -= deltaTime * 2;
        
        if (this.completionSigil.material.opacity <= 0) {
          this.playerEffectGroup.remove(this.completionSigil);
          this.completionSigil.geometry.dispose();
          this.completionSigil.material.dispose();
          this.completionSigil = null;
        }
      } else {
        // Rise and rotate
        this.completionSigil.position.y += deltaTime * 0.5;
        this.completionSigil.rotation.z += deltaTime * 2;
      }
    }
    
    // Update beam
    if (this.completionBeam) {
      const elapsed = Date.now() / 1000 - this.completionBeam.userData.startTime;
      
      if (elapsed > 1.0) {
        // Fade out and remove
        this.completionBeam.material.opacity -= deltaTime * 2;
        
        if (this.completionBeam.material.opacity <= 0) {
          this.playerEffectGroup.remove(this.completionBeam);
          this.completionBeam.geometry.dispose();
          this.completionBeam.material.dispose();
          this.completionBeam = null;
        }
      }
    }
    
    // Update pulse rings
    const pulsesToRemove = [];
    this.playerEffectGroup.children.forEach(child => {
      if (child.userData.isPulse) {
        const elapsed = Date.now() / 1000 - child.userData.startTime;
        const progress = elapsed / child.userData.duration;
        
        if (progress >= 1.0) {
          pulsesToRemove.push(child);
        } else {
          // Expand
          const scale = 1 + progress * 5;
          child.scale.setScalar(scale);
          
          // Fade
          child.material.opacity = 0.8 * (1 - progress);
        }
      }
    });
    
    pulsesToRemove.forEach(pulse => {
      this.playerEffectGroup.remove(pulse);
      pulse.geometry.dispose();
      pulse.material.dispose();
    });
    
    // Update world pulses
    const worldPulsesToRemove = [];
    this.scene.children.forEach(child => {
      if (child.userData.isWorldPulse) {
        const elapsed = Date.now() / 1000 - child.userData.startTime;
        const progress = elapsed / child.userData.duration;
        
        if (progress >= 1.0) {
          worldPulsesToRemove.push(child);
        } else {
          // Expand
          const scale = 1 + progress * 10;
          child.scale.setScalar(scale);
          
          // Fade
          child.material.opacity = 0.5 * (1 - progress);
        }
      }
    });
    
    worldPulsesToRemove.forEach(pulse => {
      this.scene.remove(pulse);
      pulse.geometry.dispose();
      pulse.material.dispose();
    });
  }
  
  /**
   * Grant random cosmetic buff
   */
  grantCosmeticBuff() {
    const buffTypes = ['trail', 'particles', 'aura_color', 'sparkle'];
    const randomBuff = buffTypes[Math.floor(Math.random() * buffTypes.length)];
    
    this.activeBuff = randomBuff;
    this.buffEndTime = Date.now() / 1000 + 15 + Math.random() * 5; // 15-20s
    
    console.log(`✨ Cosmetic Buff Granted: ${randomBuff}`);
    
    this.createBuffVisuals(randomBuff);
  }
  
  /**
   * Create buff visuals
   */
  createBuffVisuals(buffType) {
    // Clean up old buff
    if (this.buffVisuals) {
      this.cleanupBuffVisuals();
    }
    
    switch (buffType) {
      case 'trail':
        this.createTrailEffect();
        break;
      
      case 'particles':
        this.createParticleEffect();
        break;
      
      case 'aura_color':
        this.createAuraColorEffect();
        break;
      
      case 'sparkle':
        this.createSparkleEffect();
        break;
    }
  }
  
  /**
   * Create trail effect
   */
  createTrailEffect() {
    const trailGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(30 * 3); // 30 trail points
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const trailMaterial = new THREE.LineBasicMaterial({
      color: this.getRitualColor(this.ritualType),
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });
    
    const trail = new THREE.Line(trailGeometry, trailMaterial);
    trail.userData.isBuffFX = true;
    trail.userData.buffType = 'trail';
    trail.userData.trailPoints = [];
    
    this.buffVisuals = trail;
    this.scene.add(trail);
  }
  
  /**
   * Create particle effect
   */
  createParticleEffect() {
    const particleGeometry = new THREE.BufferGeometry();
    const positions = [];
    
    for (let i = 0; i < 20; i++) {
      positions.push(0, 0, 0);
    }
    
    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: this.getRitualColor(this.ritualType),
      size: 0.1,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particles.userData.isBuffFX = true;
    particles.userData.buffType = 'particles';
    
    this.buffVisuals = particles;
    this.playerEffectGroup.add(particles);
  }
  
  /**
   * Create aura color effect
   */
  createAuraColorEffect() {
    // This just changes the aura color
    this.buffVisuals = {
      type: 'aura_color',
      originalColor: this.playerAura ? this.playerAura.material.color.clone() : null,
    };
  }
  
  /**
   * Create sparkle effect
   */
  createSparkleEffect() {
    const sparkleCount = 5;
    const group = new THREE.Group();
    group.userData.isBuffFX = true;
    group.userData.buffType = 'sparkle';
    
    for (let i = 0; i < sparkleCount; i++) {
      const sparkleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
      const sparkleMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });
      
      const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial);
      sparkle.userData.sparklePhase = Math.random() * Math.PI * 2;
      
      group.add(sparkle);
    }
    
    this.buffVisuals = group;
    this.playerEffectGroup.add(group);
  }
  
  /**
   * Update cosmetic buff
   */
  updateCosmeticBuff(deltaTime) {
    if (!this.activeBuff) return;
    
    // Check if buff expired
    const now = Date.now() / 1000;
    if (now >= this.buffEndTime) {
      this.cleanupBuffVisuals();
      this.activeBuff = null;
      return;
    }
    
    // Update buff visuals
    if (!this.buffVisuals) return;
    
    switch (this.activeBuff) {
      case 'trail':
        this.updateTrailEffect(deltaTime);
        break;
      
      case 'particles':
        this.updateParticleEffect(deltaTime);
        break;
      
      case 'aura_color':
        this.updateAuraColorEffect(deltaTime);
        break;
      
      case 'sparkle':
        this.updateSparkleEffect(deltaTime);
        break;
    }
  }
  
  /**
   * Update trail effect
   */
  updateTrailEffect(deltaTime) {
    if (!this.player || !this.player.position) return;
    if (!this.buffVisuals || this.buffVisuals.userData.buffType !== 'trail') return;
    
    // Add current position to trail
    this.buffVisuals.userData.trailPoints.push(this.player.position.clone());
    
    // Keep only last 30 points
    if (this.buffVisuals.userData.trailPoints.length > 30) {
      this.buffVisuals.userData.trailPoints.shift();
    }
    
    // Update geometry
    const positions = this.buffVisuals.geometry.attributes.position.array;
    this.buffVisuals.userData.trailPoints.forEach((point, i) => {
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y + 1.0;
      positions[i * 3 + 2] = point.z;
    });
    
    this.buffVisuals.geometry.attributes.position.needsUpdate = true;
  }
  
  /**
   * Update particle effect
   */
  updateParticleEffect(deltaTime) {
    if (!this.player || !this.player.position) return;
    if (!this.buffVisuals || this.buffVisuals.userData.buffType !== 'particles') return;
    
    // Orbit particles around player
    const positions = this.buffVisuals.geometry.attributes.position.array;
    const time = Date.now() / 1000;
    
    for (let i = 0; i < positions.length / 3; i++) {
      const angle = (i / (positions.length / 3)) * Math.PI * 2 + time;
      const radius = 1.0;
      const height = Math.sin(time + i) * 0.5;
      
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 1.0 + height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    
    this.buffVisuals.geometry.attributes.position.needsUpdate = true;
  }
  
  /**
   * Update aura color effect
   */
  updateAuraColorEffect(deltaTime) {
    if (!this.playerAura) return;
    
    // Shift aura color through spectrum
    const hue = (Date.now() / 3000) % 1;
    this.playerAura.material.color.setHSL(hue, 1.0, 0.5);
  }
  
  /**
   * Update sparkle effect
   */
  updateSparkleEffect(deltaTime) {
    if (!this.buffVisuals || this.buffVisuals.userData.buffType !== 'sparkle') return;
    
    const time = Date.now() / 1000;
    
    this.buffVisuals.children.forEach((sparkle, i) => {
      const phase = sparkle.userData.sparklePhase + time;
      const angle = phase * 2;
      const radius = 0.8;
      const height = Math.sin(phase * 3) * 0.5;
      
      sparkle.position.x = Math.cos(angle) * radius;
      sparkle.position.y = 1.5 + height;
      sparkle.position.z = Math.sin(angle) * radius;
      
      // Twinkle
      sparkle.material.opacity = 0.5 + Math.sin(phase * 5) * 0.3;
    });
  }
  
  /**
   * Cleanup buff visuals
   */
  cleanupBuffVisuals() {
    if (!this.buffVisuals) return;
    
    if (this.buffVisuals.type === 'aura_color') {
      // Restore original aura color
      if (this.playerAura && this.buffVisuals.originalColor) {
        this.playerAura.material.color.copy(this.buffVisuals.originalColor);
      }
    } else if (this.buffVisuals.geometry) {
      // Remove from scene
      if (this.buffVisuals.parent === this.scene) {
        this.scene.remove(this.buffVisuals);
      } else if (this.buffVisuals.parent === this.playerEffectGroup) {
        this.playerEffectGroup.remove(this.buffVisuals);
      }
      
      this.buffVisuals.geometry.dispose();
      
      if (this.buffVisuals.material) {
        if (Array.isArray(this.buffVisuals.material)) {
          this.buffVisuals.material.forEach(m => m.dispose());
        } else {
          this.buffVisuals.material.dispose();
        }
      }
      
      // Cleanup children (for sparkle group)
      if (this.buffVisuals.children) {
        this.buffVisuals.children.forEach(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
      }
    }
    
    this.buffVisuals = null;
  }
  
  /**
   * Called when ritual ends
   */
  onRitualEnd() {
    console.log('Ritual ended, cleaning up player effects');
    
    // Fade out circle
    if (this.ritualCircle) {
      this.ritualCircle.material.opacity = 0;
    }
    
    // Fade out aura
    if (this.playerAura) {
      this.playerAura.material.opacity = 0;
    }
    
    // Remove harmonic symbols
    this.removeHarmonicSymbols();
    
    // Remove completion effects
    if (this.completionSigil) {
      this.playerEffectGroup.remove(this.completionSigil);
      this.completionSigil.geometry.dispose();
      this.completionSigil.material.dispose();
      this.completionSigil = null;
    }
    
    if (this.completionBeam) {
      this.playerEffectGroup.remove(this.completionBeam);
      this.completionBeam.geometry.dispose();
      this.completionBeam.material.dispose();
      this.completionBeam = null;
    }
    
    // Note: Cosmetic buffs persist after ritual
  }
  
  /**
   * Destroy controller (cleanup)
   */
  destroy() {
    // Remove all effects
    if (this.ritualCircle) {
      this.playerEffectGroup.remove(this.ritualCircle);
      this.ritualCircle.geometry.dispose();
      this.ritualCircle.material.dispose();
    }
    
    if (this.playerAura) {
      this.playerEffectGroup.remove(this.playerAura);
      this.playerAura.geometry.dispose();
      this.playerAura.material.dispose();
    }
    
    this.removeHarmonicSymbols();
    this.cleanupBuffVisuals();
    
    // Remove effect group
    this.scene.remove(this.playerEffectGroup);
  }
}
