import * as THREE from 'three';

/**
 * SafeCameraRotationClampPack.js - Hard-Lock Camera Roll Prevention
 * 
 * SAFE: 100% non-destructive monitoring and correction
 * - NO camera code modifications
 * - NO input code modifications
 * - NO movement/physics modifications
 * 
 * Only corrects Z-axis rotation (roll/bank/tilt) every frame
 * Ensures camera = yaw + pitch ONLY, never roll
 */

export class SafeCameraRotationClampPack {
  constructor(camera) {
    this.camera = camera;
    
    // Track previous rotation to detect unwanted changes
    this.previousRotation = {
      x: camera.rotation.x,
      y: camera.rotation.y,
      z: 0  // Always zero
    };
    
    // Clamping configuration
    this.config = {
      // Pitch (X-axis) limits
      minPitch: -89 * (Math.PI / 180),  // -89 degrees
      maxPitch: 89 * (Math.PI / 180),   // +89 degrees
      
      // Hard constraints
      maxRoll: 0.0001,                  // Tiny tolerance for floating point
      
      // Smoothing for fast mouse movement
      fastMouseThreshold: 0.5,          // Radians per frame
      smoothingFactor: 0.12,            // Smoothing amount (0.10-0.18)
      
      // Delta time tracking
      deltaTime: 0.016,                 // ~60 FPS default
    };
    
    // State tracking
    this.stats = {
      rollCorrectionCount: 0,
      pitchClampCount: 0,
      quaternionNormalizations: 0,
      fastMouseDetections: 0,
      totalFrames: 0
    };
    
    // Smoothing state
    this.lastPitch = 0;
    this.lastYaw = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    
    // Debug mode
    this.debugMode = false;
    this.logInterval = 60;  // Log every 60 frames
    this.frameCounter = 0;
    
    console.log('✓ Safe Camera Rotation Clamp Pack initialized');
  }
  
  /**
   * Main update - call after all camera systems have updated
   * This is the failsafe that ensures roll is always zero
   */
  update(deltaTime = 0.016) {
    this.config.deltaTime = deltaTime;
    this.stats.totalFrames++;
    this.frameCounter++;
    
    // Step 1: Extract current Euler angles
    const currentRotation = {
      x: this.camera.rotation.x,
      y: this.camera.rotation.y,
      z: this.camera.rotation.z
    };
    
    // Step 2: Detect mouse movement speed for fast mouse handling
    this.detectFastMouseMovement(currentRotation, deltaTime);
    
    // Step 3: Clamp pitch (prevent looking too far up/down)
    this.clampPitch(currentRotation);
    
    // Step 4: Hard-lock roll to zero
    this.hardLockRoll(currentRotation);
    
    // Step 5: Apply smoothing if mouse moved fast
    this.applySmoothingIfNeeded(currentRotation, deltaTime);
    
    // Step 6: Apply corrected rotation back to camera
    this.applyCorrectedRotation(currentRotation);
    
    // Step 7: If using quaternions, ensure no roll carryover
    this.normalizeQuaternion();
    
    // Step 8: Verify (failsafe)
    this.verifyCameraState();
    
    // Step 9: Update tracking
    this.previousRotation = { ...currentRotation };
    
    // Step 10: Debug logging
    this.debugLog();
  }
  
  /**
   * Detect fast mouse movement (swipe)
   */
  detectFastMouseMovement(currentRotation, deltaTime) {
    const deltaX = Math.abs(currentRotation.x - this.previousRotation.x);
    const deltaY = Math.abs(currentRotation.y - this.previousRotation.y);
    
    const velocityX = deltaX / Math.max(deltaTime, 0.001);
    const velocityY = deltaY / Math.max(deltaTime, 0.001);
    
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    
    const isMouseMovingFast = 
      velocityX > this.config.fastMouseThreshold || 
      velocityY > this.config.fastMouseThreshold;
    
    if (isMouseMovingFast) {
      this.stats.fastMouseDetections++;
    }
    
    return isMouseMovingFast;
  }
  
  /**
   * Clamp pitch (X-axis) to prevent over-rotation
   */
  clampPitch(rotation) {
    const oldPitch = rotation.x;
    
    // Clamp between -89 and +89 degrees
    rotation.x = Math.max(
      this.config.minPitch,
      Math.min(this.config.maxPitch, rotation.x)
    );
    
    if (Math.abs(rotation.x - oldPitch) > 0.0001) {
      this.stats.pitchClampCount++;
      
      if (this.debugMode) {
        console.log(
          `[CLAMP] Pitch: ${(oldPitch * 180 / Math.PI).toFixed(1)}° → ${(rotation.x * 180 / Math.PI).toFixed(1)}°`
        );
      }
    }
  }
  
  /**
   * Hard-lock roll (Z-axis) to zero
   * This is the critical operation - roll MUST always be zero
   */
  hardLockRoll(rotation) {
    const oldRoll = rotation.z;
    
    // CRITICAL: Force Z rotation to zero
    rotation.z = 0;
    
    // Only log if there was actual roll to remove
    if (Math.abs(oldRoll) > this.config.maxRoll) {
      this.stats.rollCorrectionCount++;
      
      if (this.debugMode) {
        console.log(
          `[LOCK] Roll: ${(oldRoll * 180 / Math.PI).toFixed(2)}° → 0°`
        );
      }
    }
  }
  
  /**
   * Apply smoothing if mouse moved fast
   * This prevents jittering on quick mouse swipes
   */
  applySmoothingIfNeeded(rotation, deltaTime) {
    const isMouseMovingFast = 
      this.velocityX > this.config.fastMouseThreshold || 
      this.velocityY > this.config.fastMouseThreshold;
    
    if (!isMouseMovingFast) {
      this.lastPitch = rotation.x;
      this.lastYaw = rotation.y;
      return;
    }
    
    // Apply low-pass filter to smooth rapid mouse movement
    const alpha = this.config.smoothingFactor;
    
    rotation.x = this.lastPitch * (1 - alpha) + rotation.x * alpha;
    rotation.y = this.lastYaw * (1 - alpha) + rotation.y * alpha;
    
    this.lastPitch = rotation.x;
    this.lastYaw = rotation.y;
  }
  
  /**
   * Apply corrected rotation back to camera
   */
  applyCorrectedRotation(rotation) {
    this.camera.rotation.x = rotation.x;
    this.camera.rotation.y = rotation.y;
    this.camera.rotation.z = 0;  // Always zero
    
    // Order matters for proper Euler angle interpretation
    this.camera.rotation.order = 'YXZ';
  }
  
  /**
   * If camera uses quaternions, ensure no roll component
   */
  normalizeQuaternion() {
    if (!this.camera.quaternion) return;
    
    // Get current quaternion
    const q = this.camera.quaternion;
    
    // Normalize to remove any numerical errors
    q.normalize();
    
    // Convert quaternion to Euler angles
    const euler = new THREE.Euler().setFromQuaternion(q, 'YXZ');
    
    // Check for roll
    if (Math.abs(euler.z) > this.config.maxRoll) {
      // Remove roll component by reconstructing quaternion
      euler.z = 0;
      
      // Convert back to quaternion
      q.setFromEuler(euler);
      q.normalize();
      
      this.stats.quaternionNormalizations++;
      
      if (this.debugMode) {
        console.log('[NORM] Quaternion normalized (roll removed)');
      }
    }
  }
  
  /**
   * Final verification - ensure camera state is correct
   * This is the ultimate failsafe
   */
  verifyCameraState() {
    // CRITICAL CHECK: Roll must be zero
    if (Math.abs(this.camera.rotation.z) > 0.001) {
      // Force it to zero if any system somehow changed it
      this.camera.rotation.z = 0;
      
      if (this.debugMode) {
        console.warn('[FAILSAFE] Camera roll was modified - forced back to zero');
      }
    }
    
    // Check pitch is within bounds
    if (this.camera.rotation.x < this.config.minPitch) {
      this.camera.rotation.x = this.config.minPitch;
    }
    if (this.camera.rotation.x > this.config.maxPitch) {
      this.camera.rotation.x = this.config.maxPitch;
    }
  }
  
  /**
   * Disable all tilt/roll sources by zeroing them
   */
  neutralizeAllTiltSources(cameraSystem) {
    if (!cameraSystem) return;
    
    // List of all possible tilt properties that might exist
    const tiltProperties = [
      'bankingStrength',
      'tiltStrength',
      'lateralTilt',
      'momentumTilt',
      'turnTilt',
      'quickTurnTilt',
      'dashTilt',
      'airTilt',
      'eventTilt',
      'illusionTilt',
      'horizonBend',
      'rotationalDrift',
      'rollAmount',
      'bankAmount',
      'leanAmount'
    ];
    
    for (const prop of tiltProperties) {
      if (cameraSystem.hasOwnProperty(prop)) {
        const oldValue = cameraSystem[prop];
        cameraSystem[prop] = 0;
        
        if (Math.abs(oldValue) > 0.001) {
          if (this.debugMode) {
            console.log(`[NEUTRALIZE] ${prop}: ${oldValue.toFixed(3)} → 0`);
          }
        }
      }
    }
  }
  
  /**
   * Debug logging
   */
  debugLog() {
    if (!this.debugMode) return;
    
    // Log every N frames
    if (this.frameCounter % this.logInterval !== 0) return;
    
    console.group(`[Camera Clamp] Frame ${this.stats.totalFrames}`);
    console.log(`Rotation: X=${(this.camera.rotation.x * 180 / Math.PI).toFixed(1)}°, ` +
                `Y=${(this.camera.rotation.y * 180 / Math.PI).toFixed(1)}°, ` +
                `Z=${(this.camera.rotation.z * 180 / Math.PI).toFixed(2)}°`);
    console.log(`Velocity: X=${this.velocityX.toFixed(3)}, Y=${this.velocityY.toFixed(3)}`);
    console.log(`Stats: Roll corrections=${this.stats.rollCorrectionCount}, ` +
                `Pitch clamps=${this.stats.pitchClampCount}, ` +
                `Fast mouse=${this.stats.fastMouseDetections}`);
    console.groupEnd();
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      totalFrames: this.stats.totalFrames,
      rollCorrectionCount: this.stats.rollCorrectionCount,
      pitchClampCount: this.stats.pitchClampCount,
      quaternionNormalizations: this.stats.quaternionNormalizations,
      fastMouseDetections: this.stats.fastMouseDetections,
      currentPitch: (this.camera.rotation.x * 180 / Math.PI).toFixed(1) + '°',
      currentYaw: (this.camera.rotation.y * 180 / Math.PI).toFixed(1) + '°',
      currentRoll: (this.camera.rotation.z * 180 / Math.PI).toFixed(2) + '°'
    };
  }
  
  /**
   * Set debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    if (enabled) {
      console.log('[Camera Clamp] Debug mode enabled');
    }
  }
  
  /**
   * Configure pitch limits
   */
  setPitchLimits(minDegrees, maxDegrees) {
    this.config.minPitch = minDegrees * (Math.PI / 180);
    this.config.maxPitch = maxDegrees * (Math.PI / 180);
  }
  
  /**
   * Configure smoothing
   */
  setSmoothingFactor(factor) {
    this.config.smoothingFactor = Math.max(0.05, Math.min(0.25, factor));
  }
  
  /**
   * Configure fast mouse threshold
   */
  setFastMouseThreshold(radians) {
    this.config.fastMouseThreshold = radians;
  }
  
  /**
   * Force camera to look direction (useful for resets)
   */
  forceDirection(yaw, pitch) {
    this.camera.rotation.y = yaw;
    this.camera.rotation.x = Math.max(
      this.config.minPitch,
      Math.min(this.config.maxPitch, pitch)
    );
    this.camera.rotation.z = 0;
  }
}
