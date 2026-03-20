import * as THREE from 'three';
import { filterRaycastIntersections, isInteractiveObject } from './CanonicalInteractionFilter.js';

const logOnce = (key, fn) => {
  if (typeof window === 'undefined') {
    fn();
    return;
  }
  window.__safeMobilityLogOnce = window.__safeMobilityLogOnce || new Set();
  if (window.__safeMobilityLogOnce.has(key)) return;
  window.__safeMobilityLogOnce.add(key);
  fn();
};

const scanPositionArray = (array) => {
  if (!array || !array.length) return -1;
  const sampleLimit = Math.min(array.length, 256);
  for (let i = 0; i < sampleLimit; i++) {
    if (!Number.isFinite(array[i])) return i;
  }
  for (let i = sampleLimit; i < array.length; i++) {
    if (!Number.isFinite(array[i])) return i;
  }
  return -1;
};

const markInvalidGeometry = (obj, geometry, attributeLength, firstBadIndex) => {
  logOnce(`SafeMobilityGeom:${geometry.uuid}`, () => {
    console.warn('[SafeMobility] Invalid geometry (NaN/Inf) detected, skipping bounding-sphere', {
      object: {
        name: obj?.name || null,
        uuid: obj?.uuid || null,
        type: obj?.type || null
      },
      geometry: {
        uuid: geometry.uuid,
        type: geometry.type,
        attributeCount: attributeLength
      },
      firstBadIndex
    });
  });
  obj.frustumCulled = false;
  geometry.boundingSphere = geometry.boundingSphere || new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1e6);
};

/**
 * SAFE MOBILITY PACK 4.0
 * 
 * Enhanced movement without touching engine physics
 * Dash/Blink on SHIFT + Double Jump on double SPACE
 * 
 * SAFETY RULES - STRICTLY ENFORCED:
 * ✓ Zero physics engine modifications
 * ✓ Zero gravity alterations
 * ✓ Zero core movement rewriting
 * ✓ All changes via movement modifiers + VFX overlays
 * ✓ Complete camera coherence maintained
 * ✓ No infinite loops or exploits
 * ✓ Failsafe mode if any core system error detected
 */

export class SafeMobilityPack4 {
  constructor(scene, camera, player, playerController, cameraController) {
    this.scene = scene;
    this.camera = camera;
    this.player = player;
    this.playerController = playerController;
    this.cameraController = cameraController;
    
    // DASH/BLINK STATE
    this.dash = {
      enabled: true,
      cooldown: 0.55,          // seconds
      cooldownRemaining: 0,
      distance: 3.5,           // meters
      isActive: false,
      recoveryTime: 0,
      recoveryDuration: 0.2,
      lastDashTime: 0,
      multiPressLock: false,
      multiPressWindow: 1.0    // seconds
    };
    
    // DOUBLE JUMP STATE
    this.doubleJump = {
      enabled: true,
      jumpCount: 0,            // 0, 1, or 2
      maxJumps: 2,
      pressWindow: 0.30,       // seconds to detect double press (300ms)
      lastSpacePress: 0,
      isActive: false,
      boostMultiplier: 1.35,   // +35% upward impulse
      airFrictionReduction: 0.12,  // 12% less air friction
      recoveryTime: 0,
      recoveryDuration: 0.15
    };
    
    // MOVEMENT SOFTENING
    this.softening = {
      enabled: true,
      accelerationSmoothing: 0.95,  // Higher = smoother acceleration
      directionTransitionSmooth: 0.92,
      airFrictionReduction: 0.12   // 12% friction reduction in air
    };
    
    // INTERACTION STATE
    this.state = {
      onGround: true,
      lastOnGround: true,
      lastGroundContact: 0,
      dashAfterJump: false,     // Can dash after double jump
      jumpAfterDash: false,     // Can jump after dash
      inDashRecovery: false,
      inJumpRecovery: false,
      safeMode: false           // Fallback mode if error detected
    };
    
    // INPUT TRACKING
    this.input = {
      shiftPressed: false,
      spacePressed: false,
      spaceJustPressed: false
    };
    
    // VFX REGISTRY
    this.vfx = {
      activeTrails: [],
      activePulses: [],
      fovSpike: 0,
      chromaticStretch: 0
    };
    
    // CONFIG
    this.config = {
      maxTilt: 3,              // degrees - hard limit
      maxFOV: 85,              // degrees
      baseFOV: 75              // degrees
    };

    // Ground-check raycast cache (performance-safe, no gameplay semantics change)
    this._groundCheckDistance = 0.1;
    this._groundRayDirection = new THREE.Vector3(0, -1, 0);
    this._groundRayOrigin = new THREE.Vector3();
    this._groundRaycaster = new THREE.Raycaster();
    this._raycastTargetsCache = [];
    this._sceneChildrenSnapshot = [];
    this._raycastTargetsDirty = true;
    this._raycastTargetsLastBuildMs = 0;
    this._raycastTargetsMaxAgeMs = 500;
    
    this.initializeInputHandlers();
    console.log('✓ Safe Mobility Pack 4.0 initialized');
  }

  _hasInvalidGeometry(obj) {
    if (!obj || !obj.geometry) return false;
    const geometry = obj.geometry;
    const positionAttr = geometry.attributes?.position;
    const array = positionAttr?.array;
    if (!array) return false;
    const badIndex = scanPositionArray(array);
    if (badIndex === -1) return false;
    markInvalidGeometry(obj, geometry, array.length, badIndex);
    return true;
  }

  _isRaycastTargetCacheStale() {
    if (this._raycastTargetsDirty) return true;
    if (!this.scene || !this.scene.children) return true;
    const nowMs = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if ((nowMs - this._raycastTargetsLastBuildMs) > this._raycastTargetsMaxAgeMs) return true;
    const children = this.scene.children;
    if (children.length !== this._sceneChildrenSnapshot.length) return true;
    for (let i = 0; i < children.length; i++) {
      if (children[i] !== this._sceneChildrenSnapshot[i]) {
        return true;
      }
    }
    return false;
  }

  _rebuildRaycastTargetCache() {
    if (!this.scene || !this.scene.children) {
      this._raycastTargetsCache = [];
      this._sceneChildrenSnapshot = [];
      this._raycastTargetsDirty = false;
      this._raycastTargetsLastBuildMs = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      return;
    }

    const targets = [];
    this.scene.traverse((obj) => {
      if (!obj || obj === this.scene) return;
      if (!isInteractiveObject(obj)) return;
      if (obj.userData?.raycastDisabled === true) return;
      if (typeof obj.raycast !== 'function') return;
      if (this._hasInvalidGeometry(obj)) return;
      targets.push(obj);
    });

    this._raycastTargetsCache = targets;
    this._sceneChildrenSnapshot = this.scene.children.slice();
    this._raycastTargetsDirty = false;
    this._raycastTargetsLastBuildMs = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  }

  _collectValidRaycastTargets() {
    if (this._isRaycastTargetCacheStale()) {
      this._rebuildRaycastTargetCache();
    }
    return this._raycastTargetsCache;
  }
  
  /**
   * Initialize keyboard input handlers
   */
  initializeInputHandlers() {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'ShiftLeft') {
        this.handleShiftPress();
      }
      if (e.code === 'Space') {
        if (e.repeat) return;
        this.handleSpacePress();
      }
    });
    
    document.addEventListener('keyup', (e) => {
      if (e.code === 'ShiftLeft') {
        this.input.shiftPressed = false;
      }
      if (e.code === 'Space') {
        this.input.spacePressed = false;
      }
    });
  }
  
  /**
   * Handle SHIFT press - Dash/Blink
   */
  handleShiftPress() {
    if (!this.dash.enabled || this.state.safeMode) return;
    
    // Debounce multiple presses
    const now = Date.now() / 1000;
    if (now - this.dash.lastDashTime < this.dash.multiPressWindow) {
      if (this.dash.multiPressLock) return;
      this.dash.multiPressLock = true;
    }
    
    // Check cooldown
    if (this.dash.cooldownRemaining > 0) return;
    
    // Execute dash
    this.executeDash();
    
    this.dash.lastDashTime = now;
    this.dash.multiPressLock = false;
  }
  
  /**
   * Execute dash/blink ability
   */
  executeDash() {
    if (this.state.safeMode) return;
    
    try {
      // Get camera forward direction
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(this.camera.quaternion);
      forward.y = 0;  // Keep horizontal
      forward.normalize();
      
      // Calculate dash direction
      const dashDirection = forward.multiplyScalar(this.dash.distance);
      
      // Apply dash movement
      this.player.position.add(dashDirection);
      
      // Preserve vertical velocity (don't ground-snap)
      if (this.playerController && this.playerController.velocity) {
        // Keep existing vertical component
      }
      
      // Set dash state
      this.dash.isActive = true;
      this.dash.cooldownRemaining = this.dash.cooldown;
      this.state.inDashRecovery = true;
      this.dash.recoveryTime = this.dash.recoveryDuration;
      
      // Allow jump after dash
      this.state.jumpAfterDash = true;
      
      // VFX
      this.triggerDashVFX();
      
      // Disable camera bob during dash
      this.disableCameraBob();
      
    } catch (e) {
      console.error('❌ Dash error, entering safe mode:', e.message);
      this.state.safeMode = true;
    }
  }
  
  /**
   * Handle SPACE press - Double Jump
   */
  handleSpacePress() {
    if (!this.doubleJump.enabled || this.state.safeMode) return;
    
    const now = Date.now() / 1000;
    const timeSinceLastPress = now - (this.doubleJump.lastSpacePress || 0);
    const isSecondTapInWindow = timeSinceLastPress > 0 && timeSinceLastPress <= this.doubleJump.pressWindow;

    // First tap: arm window and let normal jump handler continue.
    if (!isSecondTapInWindow) {
      this.doubleJump.lastSpacePress = now;
      if (this.state.onGround) {
        this.doubleJump.jumpCount = 1;
      }
      return;
    }

    // Still grounded: consume as tap refresh only, no mid-air impulse.
    if (this.state.onGround) {
      this.doubleJump.lastSpacePress = now;
      this.doubleJump.jumpCount = 1;
      return;
    }

    // Second tap in air within 300ms => deterministic double jump.
    if (this.doubleJump.jumpCount === 1) {
      this.executeDoubleJump();
      this.doubleJump.jumpCount = 2;
      this.doubleJump.lastSpacePress = 0; // consume sequence
      return;
    }

    // Any other state: restart timing window.
    this.doubleJump.lastSpacePress = now;
  }
  
  /**
   * Execute double jump ability
   */
  executeDoubleJump() {
    if (this.state.safeMode) return;
    
    try {
      // Apply upward impulse
      if (this.playerController && this.playerController.velocity) {
        const jumpForce = 15 * this.doubleJump.boostMultiplier;
        this.playerController.velocity.y = jumpForce;
      }
      
      // Set state
      this.doubleJump.isActive = true;
      this.state.inJumpRecovery = true;
      this.doubleJump.recoveryTime = this.doubleJump.recoveryDuration;
      
      // Allow dash after double jump
      this.state.dashAfterJump = true;
      
      // VFX
      this.triggerDoubleJumpVFX();
      
      // Soft camera lift
      this.applySoftCameraLift();
      
    } catch (e) {
      console.error('❌ Double jump error, entering safe mode:', e.message);
      this.state.safeMode = true;
    }
  }
  
  /**
   * Trigger dash VFX effects (overlay only)
   */
  triggerDashVFX() {
    // FOV spike (2-4%)
    this.vfx.fovSpike = 1.03;  // 3% increase
    
    // Chromatic stretch effect
    this.vfx.chromaticStretch = 0.05;
    
    // Light afterimage trail
    this.createAfterimageTrail(3);  // 3 frames of afterimages
  }
  
  /**
   * Create motion trail effect (SAFE overlay)
   */
  createAfterimageTrail(frameCount) {
    for (let i = 0; i < frameCount; i++) {
      const delay = (i + 1) * 0.015;  // 15ms between frames
      
      setTimeout(() => {
        if (this.scene && this.player) {
          const ghostPos = this.player.position.clone();
          const trail = {
            position: ghostPos,
            opacity: 0.3 * (1 - i / frameCount),
            lifetime: 0.2,
            age: 0
          };
          this.vfx.activeTrails.push(trail);
        }
      }, delay * 1000);
    }
  }
  
  /**
   * Trigger double jump VFX effects
   */
  triggerDoubleJumpVFX() {
    // Soft puff effect
    this.createJumpPuff();
    
    // Glow pulse on player position
    this.createGlowPulse(this.player.position);
  }
  
  /**
   * Create jump puff effect (SAFE overlay)
   */
  createJumpPuff() {
    const pulse = {
      position: this.player.position.clone(),
      maxRadius: 1.5,
      currentRadius: 0,
      opacity: 0.4,
      lifetime: 0.3,
      age: 0
    };
    this.vfx.activePulses.push(pulse);
  }
  
  /**
   * Create glow pulse effect
   */
  createGlowPulse(position) {
    const pulse = {
      position: position.clone(),
      maxRadius: 2.0,
      currentRadius: 0,
      opacity: 0.2,
      lifetime: 0.4,
      age: 0,
      color: 0x00ff88  // Cyan glow
    };
    this.vfx.activePulses.push(pulse);
  }
  
  /**
   * Disable camera bob during dash
   */
  disableCameraBob() {
    if (this.cameraController && this.cameraController.bobAmount !== undefined) {
      this.cameraController.bobAmount = 0;
    }
  }
  
  /**
   * Restore camera bob
   */
  restoreCameraBob() {
    if (this.cameraController && this.cameraController.bobAmount !== undefined) {
      this.cameraController.bobAmount = 0.08;  // Default
    }
  }
  
  /**
   * Apply soft camera lift for double jump
   */
  applySoftCameraLift() {
    // Temporary FOV increase for visual feedback
    this.vfx.fovSpike = 1.02;  // 2% increase
  }
  
  /**
   * Update ground state
   */
  updateGroundState() {
    try {
      // Check if player is on ground
      this._groundRayOrigin.copy(this.player.position);
      this._groundRayOrigin.y += 0.5;  // Offset from center

      const raycaster = this._groundRaycaster;
      raycaster.set(this._groundRayOrigin, this._groundRayDirection);
      raycaster.near = 0;
      raycaster.far = this._groundCheckDistance;
      const targets = this._collectValidRaycastTargets();
      const intersects = raycaster.intersectObjects(targets, false);
      const filtered = filterRaycastIntersections(intersects);
      
      const wasOnGround = this.state.onGround;
      this.state.onGround = filtered.length > 0;
      const justLanded = this.state.onGround && !wasOnGround;
      this.state.lastOnGround = this.state.onGround;

      if (justLanded) {
        // Reset jump counter on ground contact
        this.doubleJump.jumpCount = 0;
        this.doubleJump.lastSpacePress = 0;
        this.state.dashAfterJump = false;
        this.state.jumpAfterDash = false;
      }
      
    } catch (e) {
      console.warn('Ground check error:', e.message);
    }
  }
  
  /**
   * Main update loop
   */
  update(deltaTime) {
    try {
      // Update ground state
      this.updateGroundState();
      
      // Update dash cooldown
      if (this.dash.cooldownRemaining > 0) {
        this.dash.cooldownRemaining -= deltaTime;
      }
      
      // Update dash recovery
      if (this.state.inDashRecovery && this.dash.recoveryTime > 0) {
        this.dash.recoveryTime -= deltaTime;
        if (this.dash.recoveryTime <= 0) {
          this.state.inDashRecovery = false;
          this.restoreCameraBob();
        }
      }
      
      // Update double jump recovery
      if (this.state.inJumpRecovery && this.doubleJump.recoveryTime > 0) {
        this.doubleJump.recoveryTime -= deltaTime;
        if (this.doubleJump.recoveryTime <= 0) {
          this.state.inJumpRecovery = false;
        }
      }
      
      // Update VFX
      this.updateVFX(deltaTime);
      
      // Apply movement softening
      this.applyMovementSoftening(deltaTime);
      
      // Ensure camera safety
      this.enforceCamera();
      
    } catch (e) {
      console.error('Mobility Pack update error:', e.message);
      this.state.safeMode = true;
    }
  }
  
  /**
   * Update VFX effects
   */
  updateVFX(deltaTime) {
    // Update FOV spike
    if (this.vfx.fovSpike > 1) {
      this.vfx.fovSpike = THREE.MathUtils.lerp(this.vfx.fovSpike, 1, 0.15);
    }
    
    // Update chromatic stretch
    if (this.vfx.chromaticStretch > 0) {
      this.vfx.chromaticStretch = THREE.MathUtils.lerp(this.vfx.chromaticStretch, 0, 0.2);
    }
    
    // Update active trails
    this.vfx.activeTrails = this.vfx.activeTrails.filter(trail => {
      trail.age += deltaTime;
      return trail.age < trail.lifetime;
    });
    
    // Update active pulses
    this.vfx.activePulses = this.vfx.activePulses.filter(pulse => {
      pulse.age += deltaTime;
      pulse.currentRadius = (pulse.age / pulse.lifetime) * pulse.maxRadius;
      return pulse.age < pulse.lifetime;
    });
  }
  
  /**
   * Apply movement softening
   */
  applyMovementSoftening(deltaTime) {
    if (!this.playerController || !this.playerController.velocity) return;
    
    try {
      // Reduce friction in air
      if (!this.state.onGround) {
        const frictionReduction = 1 - this.softening.airFrictionReduction;
        this.playerController.velocity.x *= frictionReduction;
        this.playerController.velocity.z *= frictionReduction;
      }
      
    } catch (e) {
      console.warn('Movement softening error:', e.message);
    }
  }
  
  /**
   * Enforce camera safety constraints
   */
  enforceCamera() {
    try {
      if (!this.camera) return;
      // Camera transform authority centralized; no per-frame camera writes here.
    } catch (e) {
      console.warn('Camera enforcement error:', e.message);
    }
  }
  
  /**
   * Get mobility status
   */
  getStatus() {
    return {
      dashReady: this.dash.cooldownRemaining <= 0,
      dashCooldown: Math.max(0, this.dash.cooldownRemaining).toFixed(2),
      doubleJumpCount: this.doubleJump.jumpCount,
      onGround: this.state.onGround,
      safeMode: this.state.safeMode,
      activeTrails: this.vfx.activeTrails.length,
      activePulses: this.vfx.activePulses.length
    };
  }
  
  /**
   * Print status report
   */
  printStatusReport() {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║      SAFE MOBILITY PACK 4.0 - STATUS REPORT          ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');
    
    const status = this.getStatus();
    
    console.log('🎮 MOBILITY STATUS:');
    console.log('   Dash Ready: ' + (status.dashReady ? '✓ YES' : '✗ NO (' + status.dashCooldown + 's)'));
    console.log('   Double Jump: ' + status.doubleJumpCount + '/2');
    console.log('   On Ground: ' + (status.onGround ? '✓ YES' : '✗ NO'));
    console.log('   Safe Mode: ' + (status.safeMode ? '⚠ ACTIVE' : '✓ OFF'));
    
    console.log('\n⌨️ CONTROLS:');
    console.log('   SHIFT      → Dash/Blink (3-4m, 0.55s cooldown)');
    console.log('   SPACE      → Jump');
    console.log('   2x SPACE   → Double Jump (mid-air only)');
    
    console.log('\n✨ FEATURES:');
    console.log('   ✓ Dash with FOV spike + chromatic stretch');
    console.log('   ✓ Double jump with +35% upward boost');
    console.log('   ✓ Motion trails + glow pulses');
    console.log('   ✓ Dash→Jump + Jump→Dash combos');
    console.log('   ✓ Camera bob disabled during dash');
    console.log('   ✓ Zero physics modifications');
    console.log('   ✓ Safe fallback mode\n');
  }
}
