import * as THREE from 'three';

/**
 * ZeroGravityControls - High-mobility zero-gravity flight system
 * No gravity, smooth acceleration, inertia damping
 * Player floats as a data-object through virtual space
 */
export class ZeroGravityControls {
  constructor(player, options = {}) {
    this.player = player;
    
    // Movement configuration
    this.moveSpeed = options.moveSpeed || 25;           // Forward/backward speed
    this.strafeSpeed = options.strafeSpeed || 20;       // Sideways speed (slightly lower)
    this.verticalSpeed = options.verticalSpeed || 20;   // Up/down speed
    
    // Inertia and damping
    this.acceleration = options.acceleration || 60;     // Acceleration rate
    this.damping = options.damping || 8;                // Friction/damping (lower = more gliding)
    this.maxVelocity = options.maxVelocity || 35;       // Velocity cap
    
    // Camera sway
    this.cameraSway = options.cameraSway || 0.08;       // Subtle camera bob
    this.swaySpeed = options.swaySpeed || 1.2;          // Speed of sway
    this.swayPhase = 0;
    
    // State
    this.velocity = new THREE.Vector3();
    this.desiredVelocity = new THREE.Vector3();
    this.keys = {};
    this.camera = null;
    this.cameraController = null;
    this.isActive = true;
    this.time = 0;
    
    // Setup input
    this.setupInput();
  }
  
  /**
   * Setup keyboard input
   */
  setupInput() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });
    
    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }
  
  /**
   * Set the camera for sway effects
   */
  setCamera(camera, cameraController) {
    this.camera = camera;
    this.cameraController = cameraController;
    this.initialCameraPosition = camera.position.clone();
  }
  
  /**
   * Update movement and physics
   */
  update(deltaTime, cameraRotation) {
    if (!this.isActive) return;
    
    this.time += deltaTime;
    
    // Calculate desired velocity based on input
    this.updateDesiredVelocity(cameraRotation);
    
    // Apply acceleration toward desired velocity
    this.applyAcceleration(deltaTime);
    
    // Update player position
    this.player.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    
    // Apply camera sway
    this.applyCameraSway(deltaTime);
  }
  
  /**
   * Calculate desired velocity from input
   */
  updateDesiredVelocity(cameraRotation) {
    this.desiredVelocity.set(0, 0, 0);
    
    // Movement vectors relative to camera
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotation);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotation);
    const up = new THREE.Vector3(0, 1, 0);
    
    // Forward/backward
    if (this.keys['KeyW']) {
      this.desiredVelocity.addScaledVector(forward, this.moveSpeed);
    }
    if (this.keys['KeyS']) {
      this.desiredVelocity.addScaledVector(forward, -this.moveSpeed);
    }
    
    // Strafe left/right
    if (this.keys['KeyD']) {
      this.desiredVelocity.addScaledVector(right, this.strafeSpeed);
    }
    if (this.keys['KeyA']) {
      this.desiredVelocity.addScaledVector(right, -this.strafeSpeed);
    }
    
    // Vertical - instant movement (no gravity)
    if (this.keys['Space']) {
      this.desiredVelocity.addScaledVector(up, this.verticalSpeed);
    }
    if (this.keys['ShiftLeft'] || this.keys['ShiftRight']) {
      this.desiredVelocity.addScaledVector(up, -this.verticalSpeed);
    }
    
    // Cap velocity magnitude
    if (this.desiredVelocity.length() > this.maxVelocity) {
      this.desiredVelocity.normalize().multiplyScalar(this.maxVelocity);
    }
  }
  
  /**
   * Apply smooth acceleration from current to desired velocity
   */
  applyAcceleration(deltaTime) {
    // Difference between desired and current
    const diff = this.desiredVelocity.clone().sub(this.velocity);
    const distance = diff.length();
    
    if (distance > 0.01) {
      // Accelerate toward desired velocity
      const accelAmount = Math.min(this.acceleration * deltaTime, distance);
      diff.normalize().multiplyScalar(accelAmount);
      this.velocity.add(diff);
    } else {
      // Close enough - just set it
      this.velocity.copy(this.desiredVelocity);
    }
    
    // Apply damping (wind resistance)
    this.velocity.multiplyScalar(1 - this.damping * deltaTime);
    
    // Stop if nearly stationary
    if (this.velocity.length() < 0.01) {
      this.velocity.set(0, 0, 0);
    }
  }
  
  /**
   * Apply subtle camera sway effect
   */
  applyCameraSway(deltaTime) {
    if (!this.camera) return;
    
    this.swayPhase += this.swaySpeed * deltaTime;
    
    // Calculate sway offset based on movement speed
    const speedFactor = Math.min(this.velocity.length() / this.maxVelocity, 1.0);
    const swayAmount = this.cameraSway * speedFactor;
    
    // Multi-axis sway for organic feel
    const swayX = Math.sin(this.swayPhase * 1.3) * swayAmount;
    const swayY = Math.sin(this.swayPhase * 0.8 + Math.PI / 4) * swayAmount * 0.6;
    const swayZ = Math.sin(this.swayPhase * 1.1 + Math.PI / 2) * swayAmount * 0.3;
    
    // Apply sway to camera (subtle, dream-like)
    // Camera transform authority centralized; no per-frame camera writes here.
  }
  
  /**
   * Get current velocity for external use
   */
  getVelocity() {
    return this.velocity.clone();
  }
  
  /**
   * Get current speed
   */
  getSpeed() {
    return this.velocity.length();
  }
  
  /**
   * Boost function - briefly increase speed
   */
  boost(factor = 1.5, duration = 0.3) {
    const boostVelocity = this.velocity.clone().multiplyScalar(factor - 1);
    this.velocity.add(boostVelocity);
    
    // Cap it
    if (this.velocity.length() > this.maxVelocity * factor) {
      this.velocity.normalize().multiplyScalar(this.maxVelocity * factor);
    }
  }
  
  /**
   * Stop all movement
   */
  stop() {
    this.velocity.set(0, 0, 0);
    this.desiredVelocity.set(0, 0, 0);
  }
  
  /**
   * Teleport to position
   */
  teleport(position) {
    this.player.position.copy(position);
    this.velocity.set(0, 0, 0);
    this.desiredVelocity.set(0, 0, 0);
  }
  
  /**
   * Enable/disable controls
   */
  setActive(active) {
    this.isActive = active;
    if (!active) {
      this.stop();
    }
  }
  
  /**
   * Check if moving
   */
  isMoving() {
    return this.velocity.length() > 0.1;
  }
  
  /**
   * Get movement direction
   */
  getDirection() {
    if (this.velocity.length() > 0.01) {
      return this.velocity.clone().normalize();
    }
    return new THREE.Vector3(0, 0, -1);
  }
  
  /**
   * Cleanup
   */
  destroy() {
    // No specific cleanup needed
  }
}

/**
 * FirstPersonCameraController - Mouse look with zero-gravity
 */
export class FirstPersonCameraController {
  constructor(camera, target, domElement, options = {}) {
    this.camera = camera;
    this.target = target;
    this.domElement = domElement;
    
    // Mouse sensitivity
    this.mouseSensitivity = options.mouseSensitivity || 0.002;
    this.eyeHeight = options.eyeHeight || 1.6;
    
    // State
    this.yaw = 0;   // Horizontal rotation
    this.pitch = 0; // Vertical rotation
    this.enabled = false;
    this.isLocked = false;
    
    // Setup
    this.setupPointerLock();
    this.setupMouseControls();
  }
  
  /**
   * Setup pointer lock API
   */
  setupPointerLock() {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        if (this.isLocked) {
          document.exitPointerLock();
        }
      }
    });
    
    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement;
    });
    
    // Click to lock
    this.domElement.addEventListener('click', () => {
      if (!this.isLocked) {
        this.domElement.requestPointerLock();
      }
    });
  }
  
  /**
   * Setup mouse movement
   */
  setupMouseControls() {
    document.addEventListener('mousemove', (e) => {
      if (!this.isLocked || !this.enabled) return;
      
      // Update rotation
      this.yaw -= e.movementX * this.mouseSensitivity;
      this.pitch -= e.movementY * this.mouseSensitivity;
      
      // Clamp pitch to prevent flipping
      this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
    });
  }
  
  /**
   * Enable/disable camera
   */
  enable() {
    this.enabled = true;
  }
  
  disable() {
    this.enabled = false;
  }
  
  /**
   * Update camera position and rotation
   */
  update() {
    if (!this.enabled) return this.yaw;
    
    // Camera transform authority centralized; skip per-frame camera writes.
    
    return this.yaw;
  }
  
  /**
   * Cleanup
   */
  destroy() {
    document.exitPointerLock?.();
  }
}
