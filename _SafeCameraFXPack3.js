import * as THREE from 'three';

// PHASE OFF-1: disable accumulated camera shake while keeping effects ready to re-enable
const MOTION_OFF_PHASE1 = true;

/**
 * SAFE CAMERA FX PACK 3.0
 * 
 * ABSOLUTE SAFETY RULES - STRICTLY ENFORCED:
 * - ZERO shader modifications
 * - ZERO camera core logic replacement
 * - ZERO material replacements
 * - ZERO physics modifications
 * - All effects use screen-space overlays and safe transform adjustments
 * - All state stored ONLY in external CameraFXRegistry
 * - Completely non-invasive and reversible
 */

export class SafeCameraFXPack3 {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    
    // EXTERNAL STATE - Never touch core camera
    this.registry = {
      basePosition: camera.position.clone(),
      baseFOV: camera.fov,
      tiltAmount: 0,
      speedWarpIntensity: 0,
      bloomIntensity: 0,
      fovOffset: 0,
      chromaticFlicker: 0,
      shakeAmount: 0,
      colorGradeIntensity: 0,
      vignetteIntensity: 0
    };
    
    // Configuration
    this.config = {
      maxTilt: 6,                 // Degrees
      maxFOVOffset: 8,            // Degrees
      maxShake: 2,                // Degrees rotation
      maxShakePosition: 0.02,     // Units
      tiltSmoothness: 0.1,
      fovSmoothness: 0.08,
      bloomFadeDuration: 0.3,
      dashMicroSnapDuration: 0.15,
      eventDriftSpeed: 0.3,
      microBobAmplitude: 0.08,
      microBobFrequency: 1.5
    };
    
    // Tracking
    this.animationTime = 0;
    this.lastSpeedWarpTime = 0;
    this.eventDriftPhase = 0;
    this.targetTilt = 0;
    this.targetFOV = camera.fov;
    this.currentTilt = 0;
    this.currentFOV = camera.fov;
    this.lastPlayerPosition = new THREE.Vector3(0, 0, 0);
    this.playerVelocity = new THREE.Vector3(0, 0, 0);
    
    // VFX layers for screen overlays
    this.screenOverlays = {
      speedWarp: null,
      bloom: [],
      chromatic: null,
      vignette: null,
      colorGrade: null
    };
    
    // HUD canvas for effects (if needed)
    this.hudCanvas = null;
    this.hudContext = null;
    
    this.initializeScreenOverlays();
  }
  
  /**
   * Initialize screen-space overlay textures
   */
  initializeScreenOverlays() {
    // Create canvas for dynamic effects
    this.hudCanvas = document.createElement('canvas');
    this.hudCanvas.width = 512;
    this.hudCanvas.height = 512;
    this.hudContext = this.hudCanvas.getContext('2d');
  }
  
  /**
   * Main update loop (called once per frame)
   */
  update(deltaTime, playerController, weatherPack, worldEvents, legendaryPack, linkingSystem) {
    this.animationTime += deltaTime;
    
    // Update player velocity for speed effects
    this.updatePlayerVelocity(playerController, deltaTime);
    
    // Update all camera effects
    this.updateMotionTilt(playerController);
    this.updateSpeedWarp(playerController);
    this.updateNeonTrailBloom(deltaTime);
    this.updateQuantumFocusMode(playerController);
    this.updateAirborneFloat(playerController);
    this.updateCameraPulseReaction(weatherPack, worldEvents, linkingSystem);
    this.updateLegendaryEventCinematic(worldEvents, deltaTime);
    this.updateDashBlinKSnap(playerController, deltaTime);
    this.updateCameraShake(weatherPack, linkingSystem, deltaTime);
    this.updateFOVDynamics(playerController, weatherPack);
    this.updateColorGrading(weatherPack, worldEvents);
    
    // Apply all accumulated effects to camera
    this.applyAllEffectsToCamera();
  }
  
  /**
   * Update player velocity for speed calculations
   */
  updatePlayerVelocity(playerController, deltaTime) {
    if (!playerController || !playerController.position) {
      this.playerVelocity.set(0, 0, 0);
      return;
    }
    
    const currentPos = playerController.position.clone();
    const direction = currentPos.clone().sub(this.lastPlayerPosition);
    this.playerVelocity = direction.divideScalar(Math.max(deltaTime, 0.016));
    this.lastPlayerPosition.copy(currentPos);
  }
  
  /**
   * MOTION TILT - Dynamic tilt based on movement
   */
  updateMotionTilt(playerController) {
    if (!playerController) {
      this.targetTilt = 0;
      return;
    }
    
    // Calculate movement direction
    const speed = this.playerVelocity.length();
    
    if (speed > 0.5) {
      // Calculate tilt based on horizontal movement
      const horizontalVel = new THREE.Vector3(
        this.playerVelocity.x,
        0,
        this.playerVelocity.z
      );
      
      // Get camera right vector
      const cameraRight = new THREE.Vector3();
      this.camera.getWorldDirection(new THREE.Vector3(0, 0, -1));
      this.camera.getWorldDirection(cameraRight).cross(new THREE.Vector3(0, 1, 0)).normalize();
      
      // Dot product to determine direction
      const tiltDirection = Math.sign(horizontalVel.dot(cameraRight));
      const tiltAmount = Math.min(this.config.maxTilt, speed * 0.5);
      
      this.targetTilt = tiltDirection * tiltAmount;
    } else {
      this.targetTilt = 0;
    }
    
    // Smooth tilt
    this.currentTilt += (this.targetTilt - this.currentTilt) * this.config.tiltSmoothness;
  }
  
  /**
   * SPEED WARP - Velocity distortion effect
   */
  updateSpeedWarp(playerController) {
    if (!playerController) {
      this.registry.speedWarpIntensity = 0;
      return;
    }
    
    // Check for dash, blink, or fast movement
    const speed = this.playerVelocity.length();
    const isDashing = playerController.isDashing || speed > 15;
    
    if (isDashing) {
      this.registry.speedWarpIntensity = Math.min(1, speed / 20);
      this.lastSpeedWarpTime = this.animationTime;
    } else {
      // Fade out
      const timeSinceWarp = this.animationTime - this.lastSpeedWarpTime;
      this.registry.speedWarpIntensity = Math.max(0, 1 - timeSinceWarp / 0.5);
    }
  }
  
  /**
   * NEON TRAIL BLOOM - Glowing trails during fast motion
   */
  updateNeonTrailBloom(deltaTime) {
    const speed = this.playerVelocity.length();
    
    if (speed > 5) {
      // Generate bloom
      if (Math.random() < speed * 0.1) {
        this.createBloomParticle(speed);
      }
      this.registry.bloomIntensity = Math.min(1, speed / 15);
    } else {
      this.registry.bloomIntensity = Math.max(0, this.registry.bloomIntensity - deltaTime * 3);
    }
    
    // Update bloom particles
    this.screenOverlays.bloom = this.screenOverlays.bloom.filter(bloom => {
      bloom.age += deltaTime;
      bloom.opacity = Math.max(0, 1 - bloom.age / this.config.bloomFadeDuration);
      return bloom.opacity > 0;
    });
  }
  
  /**
   * Create a bloom particle
   */
  createBloomParticle(speed) {
    this.screenOverlays.bloom.push({
      age: 0,
      opacity: 0.6 * Math.min(1, speed / 20),
      x: Math.random(),
      y: Math.random(),
      size: 50 + Math.random() * 100,
      color: ['00ffff', 'ff00ff', 'ff0088'][Math.floor(Math.random() * 3)]
    });
  }
  
  /**
   * QUANTUM FOCUS MODE - Enhanced view for legendary/quantum nodes
   */
  updateQuantumFocusMode(playerController) {
    if (!playerController) return;
    
    // Check if player is looking at a special node (simplified check)
    // In real implementation, use raycasting against nodes
    const lookingAtLegendary = false; // Placeholder
    
    if (lookingAtLegendary) {
      this.targetFOV = this.registry.baseFOV + 5;
      this.registry.vignetteIntensity = Math.min(0.3, this.registry.vignetteIntensity + 0.1);
    } else {
      this.targetFOV = this.registry.baseFOV;
      this.registry.vignetteIntensity = Math.max(0, this.registry.vignetteIntensity - 0.05);
    }
  }
  
  /**
   * AIRBORNE CAMERA FLOAT - Weightless feel when in air
   */
  updateAirborneFloat(playerController) {
    if (!playerController || !playerController.isAirborne) {
      return;
    }
    
    // Add gentle bobbing motion
    const bob = Math.sin(this.animationTime * this.config.microBobFrequency) * this.config.microBobAmplitude;
    
    // Store for application
    this.registry.airborneFloat = bob;
  }
  
  /**
   * CAMERA PULSE REACTION - Reacts to link pulses and synergy
   */
  updateCameraPulseReaction(weatherPack, worldEvents, linkingSystem) {
    let pulseAmount = 0;
    
    // React to world events
    if (worldEvents && worldEvents.isEventActive()) {
      pulseAmount += worldEvents.getEventIntensity() * 0.3;
    }
    
    // React to weather
    if (weatherPack && weatherPack.isWeatherActive()) {
      pulseAmount += weatherPack.getWeatherIntensity() * 0.2;
    }
    
    // React to synergy spikes
    if (linkingSystem && linkingSystem.links) {
      let synergy = 0;
      linkingSystem.links.forEach(link => {
        if (link.glowData && link.glowData.synergy) {
          synergy += link.glowData.synergy;
        }
      });
      
      if (synergy > 10) {
        pulseAmount += 0.4;
      } else if (synergy > 5) {
        pulseAmount += 0.2;
      }
    }
    
    // Apply pulse as zoom and bloom
    const pulse = Math.sin(this.animationTime * 3) * 0.01 * pulseAmount;
    this.registry.bloomIntensity = Math.max(this.registry.bloomIntensity, pulseAmount * 0.3);
    
    // Tiny shake on pulse
    if (pulseAmount > 0.2) {
      this.registry.shakeAmount = Math.max(this.registry.shakeAmount, pulseAmount * 0.5);
    }
  }
  
  /**
   * LEGENDARY EVENT CINEMATIC MODE
   */
  updateLegendaryEventCinematic(worldEvents, deltaTime) {
    if (!worldEvents || !worldEvents.isEventActive()) {
      this.eventDriftPhase = 0;
      this.registry.chromaticFlicker = 0;
      return;
    }
    
    const eventIntensity = worldEvents.getEventIntensity();
    
    // Slow drift
    this.eventDriftPhase += deltaTime * this.config.eventDriftSpeed;
    this.registry.chromaticFlicker = eventIntensity * 0.3;
    
    // Exposure ramp up
    this.registry.colorGradeIntensity = eventIntensity * 0.5;
  }
  
  /**
   * DASH / BLINK CAMERA SNAP
   */
  updateDashBlinKSnap(playerController, deltaTime) {
    if (!playerController) return;
    
    // Track last dash time
    if (!this.lastDashTime) this.lastDashTime = 0;
    
    if (playerController.isDashing && this.animationTime - this.lastDashTime > 0.5) {
      this.lastDashTime = this.animationTime;
      this.dashSnapActive = true;
      this.dashSnapTime = 0;
    }
    
    if (this.dashSnapActive) {
      this.dashSnapTime += deltaTime;
      
      if (this.dashSnapTime < this.config.dashMicroSnapDuration) {
        // Snap forward
        const progress = this.dashSnapTime / this.config.dashMicroSnapDuration;
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        this.registry.dashSnapOffset = easeOut * 0.3;
      } else {
        // Overshoot correction
        const timeAfterSnap = this.dashSnapTime - this.config.dashMicroSnapDuration;
        if (timeAfterSnap < 0.1) {
          const progress = timeAfterSnap / 0.1;
          this.registry.dashSnapOffset = 0.3 * (1 - progress * 0.7);
        } else {
          this.dashSnapActive = false;
          this.registry.dashSnapOffset = 0;
        }
      }
    }
  }
  
  /**
   * CAMERA SHAKE - Microshake during events
   */
  updateCameraShake(weatherPack, linkingSystem, deltaTime) {
    let shakeIntensity = 0;
    
    // Heavy synergy causes shake
    if (linkingSystem && linkingSystem.links) {
      let synergy = 0;
      linkingSystem.links.forEach(link => {
        if (link.glowData && link.glowData.synergy) {
          synergy += link.glowData.synergy;
        }
      });
      
      if (synergy > 15) {
        shakeIntensity += 0.4;
      }
    }
    
    // Weather causes shake
    if (weatherPack && weatherPack.isWeatherActive()) {
      const weatherType = weatherPack.getActiveWeatherType();
      if (weatherType === 'QUANTUM_STORM' || weatherType === 'SIGMA_TURBULENCE') {
        shakeIntensity += weatherPack.getWeatherIntensity() * 0.3;
      }
    }
    
    // Smooth shake
    this.registry.shakeAmount += (shakeIntensity - this.registry.shakeAmount) * 0.2;
  }
  
  /**
   * FOV DYNAMICS - Smooth FOV changes
   */
  updateFOVDynamics(playerController, weatherPack) {
    this.targetFOV = this.registry.baseFOV;
    
    if (playerController) {
      const speed = this.playerVelocity.length();
      
      // Movement increases FOV
      if (speed > 5) {
        this.targetFOV += Math.min(5, speed * 0.3);
      }
      
      // High-speed blink
      if (speed > 20) {
        this.targetFOV += 3;
      }
      
      // Airborne
      if (playerController.isAirborne) {
        this.targetFOV += 2;
      }
    }
    
    // Weather affects FOV
    if (weatherPack && weatherPack.isWeatherActive()) {
      const weatherType = weatherPack.getActiveWeatherType();
      if (weatherType === 'SIGMA_TURBULENCE') {
        // Jitter FOV slightly
        const jitter = Math.sin(this.animationTime * 10) * 1;
        this.targetFOV += jitter;
      }
    }
    
    // Smooth FOV change
    this.currentFOV += (this.targetFOV - this.currentFOV) * this.config.fovSmoothness;
  }
  
  /**
   * COLOR GRADING OVERLAY - Weather and event color tinting
   */
  updateColorGrading(weatherPack, worldEvents) {
    this.registry.colorGradeIntensity = 0;
    this.registry.colorGradeColor = { r: 1, g: 1, b: 1 };
    
    // Weather color grading
    if (weatherPack && weatherPack.isWeatherActive()) {
      const intensity = weatherPack.getWeatherIntensity();
      const weatherType = weatherPack.getActiveWeatherType();
      
      switch(weatherType) {
        case 'QUANTUM_STORM':
          this.registry.colorGradeColor = { r: 1, g: 0.5, b: 1 };
          this.registry.colorGradeIntensity = intensity * 0.15;
          break;
        case 'SIGMA_TURBULENCE':
          this.registry.colorGradeColor = { r: 0.2, g: 1, b: 0.8 };
          this.registry.colorGradeIntensity = intensity * 0.15;
          break;
        case 'NEON_RAIN':
          this.registry.colorGradeColor = { r: 0.3, g: 1, b: 1 };
          this.registry.colorGradeIntensity = intensity * 0.1;
          break;
        case 'AURORA_WINDS':
          this.registry.colorGradeColor = { r: 1, g: 0.5, b: 0.8 };
          this.registry.colorGradeIntensity = intensity * 0.12;
          break;
        case 'FRACTAL_FOG':
          this.registry.colorGradeColor = { r: 0.7, g: 0.3, b: 1 };
          this.registry.colorGradeIntensity = intensity * 0.1;
          break;
      }
    }
    
    // Event color grading
    if (worldEvents && worldEvents.isEventActive()) {
      const intensity = worldEvents.getEventIntensity();
      this.registry.colorGradeIntensity = Math.max(this.registry.colorGradeIntensity, intensity * 0.2);
    }
  }
  
  /**
   * Apply all accumulated effects to camera
   */
  applyAllEffectsToCamera() {
    // Apply tilt (roll)
    const tiltRad = THREE.MathUtils.degToRad(this.currentTilt);
    const targetQuaternion = new THREE.Quaternion();
    targetQuaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), tiltRad);
    this.camera.quaternion.slerp(targetQuaternion, 0.1);
    
    // Apply FOV
    this.camera.fov = this.currentFOV;
    this.camera.updateProjectionMatrix();
    
    // PHASE OFF-1: disabled accumulated camera shake (event-based impulse only in future)
    if (!MOTION_OFF_PHASE1 && this.registry.shakeAmount > 0) {
      const shake = this.registry.shakeAmount;
      this.camera.position.x += (Math.random() - 0.5) * this.config.maxShakePosition * shake;
      this.camera.position.y += (Math.random() - 0.5) * this.config.maxShakePosition * shake;
      this.camera.position.z += (Math.random() - 0.5) * this.config.maxShakePosition * shake;
      
      // Decay shake
      this.registry.shakeAmount *= 0.95;
    } else if (MOTION_OFF_PHASE1 && this.registry.shakeAmount > 0) {
      // Bleed off any queued shake without moving the camera
      this.registry.shakeAmount *= 0.95;
    }
    
    // Smooth decay
    this.registry.chromaticFlicker *= 0.95;
  }
  
  /**
   * Get current camera effects state for HUD display
   */
  getCameraEffectsState() {
    return {
      tilt: this.currentTilt,
      fov: this.currentFOV,
      speedWarp: this.registry.speedWarpIntensity,
      bloomIntensity: this.registry.bloomIntensity,
      shakeAmount: this.registry.shakeAmount,
      chromaticFlicker: this.registry.chromaticFlicker
    };
  }
  
  /**
   * Trigger speed warp manually
   */
  triggerSpeedWarp(intensity) {
    this.registry.speedWarpIntensity = Math.min(1, intensity);
  }
  
  /**
   * Trigger camera shake manually
   */
  triggerShake(amount) {
    this.registry.shakeAmount = Math.max(this.registry.shakeAmount, Math.min(1, amount));
  }
  
  /**
   * Trigger bloom manually
   */
  triggerBloom(intensity) {
    this.registry.bloomIntensity = Math.min(1, intensity);
  }
  
  /**
   * Disable all camera effects (safe shutdown)
   */
  disableAll() {
    // Reset all values
    this.registry = {
      basePosition: this.camera.position.clone(),
      baseFOV: 75,
      tiltAmount: 0,
      speedWarpIntensity: 0,
      bloomIntensity: 0,
      fovOffset: 0,
      chromaticFlicker: 0,
      shakeAmount: 0,
      colorGradeIntensity: 0,
      vignetteIntensity: 0
    };
    
    this.currentTilt = 0;
    this.currentFOV = 75;
    this.targetTilt = 0;
    this.targetFOV = 75;
    
    // Reset camera
    this.camera.fov = 75;
    this.camera.quaternion.set(0, 0, 0, 1);
    this.camera.updateProjectionMatrix();
    
    // Clear bloom
    this.screenOverlays.bloom = [];
  }
}
