import * as THREE from 'three';
import { MobileControls } from './rosieMobileControls.js';

/**
 * PlayerController - Handles player movement and physics
 */
class PlayerController {
  constructor(player, options = {}) {
    this.player = player;

    // Configuration (moveSpeed doubled to 2× for faster traversal)
    this.moveSpeed = options.moveSpeed || 20;
    this.jumpForce = options.jumpForce || 15;
    this.gravity = options.gravity || 30;
    this.groundLevel = options.groundLevel || 1; // Assuming base ground is at y=0, player bottom at y=0.4
    this.collisionProvider = options.collisionProvider || null;
    this.worldBoundsProvider = options.worldBoundsProvider || null;
    this.groundHeightProvider = options.groundHeightProvider || null;
    this.maxStepHeightProvider = options.maxStepHeightProvider || null;
    this.groundProbeHeight = options.groundProbeHeight || 120;
    this.maxStepHeight = options.maxStepHeight || 1.25;
    this.playerHeight = options.playerHeight || player.geometry?.parameters?.height || 1.8;
    this.playerHalfWidth = options.playerHalfWidth || player.geometry?.parameters?.width * 0.5 || 0.3;
    this.collisionEpsilon = options.collisionEpsilon || 0.02;

    // State
    this.velocity = new THREE.Vector3();
    this.isOnGround = true;
    this.canJump = true;
    this.keys = {};
    this._raycaster = new THREE.Raycaster();
    this._rayOrigin = new THREE.Vector3();
    this._rayDirection = new THREE.Vector3(0, -1, 0);
    this._playerCollisionBox = new THREE.Box3();
    this._collisionObjectBox = new THREE.Box3();

    // Setup input handlers
    this.setupInput();

    // Initialize mobile controls (handles its own detection and activation)
    this.mobileControls = new MobileControls(this);
  }

  setupInput() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  getCollisionObjects() {
    const source = typeof this.collisionProvider === 'function'
      ? this.collisionProvider()
      : this.collisionProvider;

    if (!Array.isArray(source) || source.length === 0) {
      return [];
    }

    return source;
  }

  getMovementBounds() {
    if (typeof this.worldBoundsProvider !== 'function') {
      return null;
    }

    return this.worldBoundsProvider() || null;
  }

  isBlockingCollisionObject(object) {
    if (!object) {
      return false;
    }

    const data = object.userData || {};
    if (data.collisionEnabled === false) {
      return false;
    }

    if (data.isWalkable === true) {
      return false;
    }

    if (data.collisionRole === 'terrain') {
      return false;
    }

    return true;
  }

  getBlockingCollisionObjects(collisionObjects) {
    if (!Array.isArray(collisionObjects) || collisionObjects.length === 0) {
      return [];
    }

    return collisionObjects.filter((object) => this.isBlockingCollisionObject(object));
  }

  hasBlockingCollisionAt(x, z, collisionObjects) {
    const blockingObjects = this.getBlockingCollisionObjects(collisionObjects);
    if (!blockingObjects.length) {
      return false;
    }

    const minY = this.player.position.y;
    const maxY = minY + this.playerHeight;
    this._playerCollisionBox.min.set(x - this.playerHalfWidth, minY, z - this.playerHalfWidth);
    this._playerCollisionBox.max.set(x + this.playerHalfWidth, maxY, z + this.playerHalfWidth);

    for (const object of blockingObjects) {
      this._collisionObjectBox.setFromObject(object);
      if (this._playerCollisionBox.intersectsBox(this._collisionObjectBox)) {
        return true;
      }
    }

    return false;
  }

  getMaxStepHeight() {
    if (typeof this.maxStepHeightProvider === 'function') {
      const dynamicMaxStepHeight = this.maxStepHeightProvider();
      if (Number.isFinite(dynamicMaxStepHeight)) {
        return dynamicMaxStepHeight;
      }
    }

    return this.maxStepHeight;
  }

  getGroundLevelAt(x, z, collisionObjects) {
    if (typeof this.groundHeightProvider === 'function') {
      const analyticGroundLevel = this.groundHeightProvider(x, z, collisionObjects);
      if (Number.isFinite(analyticGroundLevel)) {
        return analyticGroundLevel;
      }
    }

    if (!collisionObjects.length) {
      return this.groundLevel;
    }

    this._rayOrigin.set(x, this.player.position.y + this.groundProbeHeight, z);
    this._raycaster.set(this._rayOrigin, this._rayDirection);

    const hits = this._raycaster.intersectObjects(collisionObjects, false);
    if (!hits.length) {
      return this.groundLevel;
    }

    const groundLevel = hits[0].point.y + this.groundLevel;
    return groundLevel;
  }

  isWithinMovementBounds(x, z, bounds) {
    if (!bounds) {
      return true;
    }

    const centerX = bounds.center?.x ?? bounds.x ?? 0;
    const centerZ = bounds.center?.z ?? bounds.z ?? 0;
    const radius = bounds.radius ?? bounds.limit ?? null;

    if (bounds.type === 'circle' && Number.isFinite(radius)) {
      const dx = x - centerX;
      const dz = z - centerZ;
      const targetDistSq = (dx * dx) + (dz * dz);
      const radiusSq = radius * radius;
      const currentDx = this.player.position.x - centerX;
      const currentDz = this.player.position.z - centerZ;
      const currentDistSq = (currentDx * currentDx) + (currentDz * currentDz);

      if (currentDistSq <= radiusSq) {
        return targetDistSq <= radiusSq;
      }

      return targetDistSq <= radiusSq || targetDistSq < currentDistSq;
    }

    return true;
  }

  canMoveTo(x, z, currentGroundLevel, collisionObjects, bounds, allowVerticalStep = false) {
    if (!this.isWithinMovementBounds(x, z, bounds)) {
      return false;
    }

    if (this.hasBlockingCollisionAt(x, z, collisionObjects)) {
      return false;
    }

    const targetGroundLevel = this.getGroundLevelAt(x, z, collisionObjects);
    if (!Number.isFinite(targetGroundLevel)) {
      return false;
    }

    if (allowVerticalStep) {
      return true;
    }

    return (targetGroundLevel - currentGroundLevel) <= this.getMaxStepHeight();
  }

  /**
   * Updates the player's state, velocity, and position.
   * @param {number} deltaTime Time elapsed since the last frame.
   * @param {number} cameraRotation The current horizontal rotation (yaw) of the active camera.
   */
  update(deltaTime, cameraRotation) {
    const collisionObjects = this.getCollisionObjects();
    const movementBounds = this.getMovementBounds();
    const currentGroundLevel = this.getGroundLevelAt(
      this.player.position.x,
      this.player.position.z,
      collisionObjects
    );

    const onGround = this.player.position.y <= (currentGroundLevel + this.collisionEpsilon);
    if (onGround) {
      this.player.position.y = currentGroundLevel;
      if (this.velocity.y < 0) {
        this.velocity.y = 0;
      }
      this.isOnGround = true;
      this.canJump = true;
    } else {
      this.velocity.y -= this.gravity * deltaTime;
      this.isOnGround = false;
    }

    // Handle jumping
    if (this.keys['Space'] && this.isOnGround && this.canJump) {
      this.velocity.y = this.jumpForce;
      this.isOnGround = false;
      this.canJump = false; // Prevent double jumps until grounded again
    }

    // --- Horizontal Movement ---

    // Reset horizontal velocity each frame
    // We calculate desired movement directly based on input and camera
    let moveX = 0;
    let moveZ = 0;

    // Calculate movement direction vectors relative to the camera's horizontal rotation
    // Forward direction (local -Z) rotated by camera yaw
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotation);
    // Right direction (local +X) rotated by camera yaw
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotation);

    // Apply movement based on keys pressed
    const currentMoveSpeed = this.moveSpeed; // Use the configured move speed

    if (this.keys['KeyW']) { // Forward
      moveX += forward.x;
      moveZ += forward.z;
    }
    if (this.keys['KeyS']) { // Backward
      moveX -= forward.x;
      moveZ -= forward.z;
    }
    if (this.keys['KeyA']) { // Left
      moveX -= right.x;
      moveZ -= right.z;
    }
    if (this.keys['KeyD']) { // Right
      moveX += right.x;
      moveZ += right.z;
    }

    // Normalize the movement vector if moving diagonally
    const moveDirection = new THREE.Vector3(moveX, 0, moveZ);
    if (moveDirection.lengthSq() > 0) { // Check if there's any horizontal movement input
        moveDirection.normalize();
    }

    // Apply speed and deltaTime to get the displacement for this frame
    this.velocity.x = moveDirection.x * currentMoveSpeed;
    this.velocity.z = moveDirection.z * currentMoveSpeed;

    const baseGroundLevel = currentGroundLevel;
    const proposedX = this.player.position.x + this.velocity.x * deltaTime;
    if (this.canMoveTo(
      proposedX,
      this.player.position.z,
      baseGroundLevel,
      collisionObjects,
      movementBounds,
      !this.isOnGround
    )) {
      this.player.position.x = proposedX;
    }

    const groundAfterX = this.getGroundLevelAt(
      this.player.position.x,
      this.player.position.z,
      collisionObjects
    );
    const proposedZ = this.player.position.z + this.velocity.z * deltaTime;
    if (this.canMoveTo(
      this.player.position.x,
      proposedZ,
      groundAfterX,
      collisionObjects,
      movementBounds,
      !this.isOnGround
    )) {
      this.player.position.z = proposedZ;
    }

    // --- Update Player Position ---
    // Apply calculated velocity scaled by deltaTime
    this.player.position.y += this.velocity.y * deltaTime; // Vertical velocity already includes gravity effect

    const updatedGroundLevel = this.getGroundLevelAt(
      this.player.position.x,
      this.player.position.z,
      collisionObjects
    );
    if (this.player.position.y <= updatedGroundLevel + this.collisionEpsilon) {
      this.player.position.y = updatedGroundLevel;
      if (this.velocity.y < 0) {
        this.velocity.y = 0;
      }
      this.isOnGround = true;
      this.canJump = true;
    } else {
      this.isOnGround = false;
    }

  }

  destroy() {
    // Clean up mobile controls
    this.mobileControls.destroy();
  }
}

/**
 * FirstPersonCameraController - Handles first-person camera controls
 */
class FirstPersonCameraController {
  constructor(camera, player, domElement, options = {}) {
    this.camera = camera;
    this.player = player;
    this.domElement = domElement;

    // Configuration
    this.eyeHeight = options.eyeHeight || 1.6;
    this.mouseSensitivity = options.mouseSensitivity || 0.002;

    // State
    this.enabled = false;
    this.rotationY = 0;
    this.rotationX = 0;
    
    // MOUSE EVENT FIX 2.0: Track listener registration to prevent duplication
    this.__mouseListenersRegistered = false;

    // Setup mouse controls
    this.setupMouseControls();
  }

  setupMouseControls() {
    // MOUSE EVENT FIX 2.0: Guard to prevent duplicate listener registration
    if (this.__mouseListenersRegistered) return;
    this.__mouseListenersRegistered = true;
    
    // Desktop pointer lock
    this.domElement.addEventListener('click', () => {
      if (this.enabled && document.pointerLockElement !== this.domElement) {
        this.domElement.requestPointerLock();
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.enabled || document.pointerLockElement !== this.domElement) return;

      this.rotationY -= e.movementX * this.mouseSensitivity;
      this.rotationX -= e.movementY * this.mouseSensitivity;

      // Limit vertical rotation
      this.rotationX = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, this.rotationX));
    });

    // Touch controls for mobile (only if mobile)
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      let touchStart = null;
      
      // Helper function to check if touch is over mobile UI elements
      const isTouchOverMobileUI = (touch) => {
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        return element && (
          element.id === 'mobile-game-controls' ||
          element.id === 'virtual-joystick' ||
          element.id === 'virtual-joystick-knob' ||
          element.id === 'jump-button' ||
          element.closest('#mobile-game-controls')
        );
      };
      
      this.domElement.addEventListener('touchstart', (e) => {
        if (!this.enabled || e.touches.length !== 1) return;
        
        // Don't handle touch if it's over mobile UI
        if (isTouchOverMobileUI(e.touches[0])) return;
        
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        e.preventDefault();
      });

      this.domElement.addEventListener('touchmove', (e) => {
        if (!this.enabled || !touchStart || e.touches.length !== 1) return;
        
        // Don't handle touch if it started over mobile UI
        if (isTouchOverMobileUI(e.touches[0])) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStart.x;
        const deltaY = touch.clientY - touchStart.y;
        
        this.rotationY -= deltaX * this.mouseSensitivity * 2;
        this.rotationX -= deltaY * this.mouseSensitivity * 2;
        this.rotationX = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, this.rotationX));
        
        touchStart = { x: touch.clientX, y: touch.clientY };
        e.preventDefault();
      });

      this.domElement.addEventListener('touchend', (e) => {
        touchStart = null;
        e.preventDefault();
      });
    }
  }

  enable() {
    this.enabled = true;

    this.rotationX = 0;

    // Hide player when in first-person mode
    this.hidePlayer();
  }

  disable() {
    this.enabled = false;

    // Show player when exiting first-person mode
    this.showPlayer();

    if (document.pointerLockElement === this.domElement) {
      document.exitPointerLock();
    }
  }

  hidePlayer() {
    // Store current player model visibility state
    this.originalVisibility = [];
    this.player.traverse(child => {
      if (child.isMesh) {
        this.originalVisibility.push({
          object: child,
          visible: child.visible
        });
        child.visible = false;
      }
    });
  }

  showPlayer() {
    // Restore player model visibility
    if (this.originalVisibility) {
      this.originalVisibility.forEach(item => {
        item.object.visible = item.visible;
      });
      this.originalVisibility = null;
    }
  }

  update() {
    if (!this.enabled) return 0;

    // Camera transform authority centralized — no secondary per-frame writers allowed
    // Set player rotation to match camera's horizontal rotation
    this.player.rotation.y = this.rotationY;

    // Position camera at player eye height
    this.camera.position.x = this.player.position.x;
    this.camera.position.y = this.player.position.y + this.eyeHeight;
    this.camera.position.z = this.player.position.z;

    // Set camera rotation
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.x = this.rotationX;
    this.camera.rotation.y = this.rotationY;

    return this.rotationY;
  }
}

export { PlayerController, FirstPersonCameraController };
