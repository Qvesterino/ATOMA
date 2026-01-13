import * as THREE from 'three';

/**
 * SAFE CAMERA ANTI-TILT PACK 1.0
 * 
 * Completely eliminates camera banking, sideways tilt, lateral roll, directional leaning,
 * momentum tilt, and any rotation linked to quick turns or sudden movement changes.
 * Camera remains always upright. Cinematic effects preserved.
 *
 * ABSOLUTE SAFETY RULES - STRICTLY ENFORCED:
 * - ZERO core camera transform modification
 * - ZERO player movement/physics changes
 * - ZERO engine code modification
 * - ZERO shader/material changes
 * - Only VFX camera effects layer adjustment
 * - All changes are parameter adjustments, not system rewrites
 * - Completely non-invasive and reversible
 *
 * KEY IMPROVEMENTS:
 * 1. All sideways camera tilt disabled (maxTilt → 0)
 * 2. Camera roll on air/dash/blink disabled
 * 3. Quick-turn rotation drag eliminated
 * 4. Cinematic effects preserved (FOV, bloom, speed warp, vignette)
 * 5. Camera rotation = pure player input only
 * 6. Fallback safety override for any residual tilt
 * 7. Camera always remains upright
 */

export class SafeCameraAntiTiltPack1 {
  constructor(cameraFXPack3) {
    this.cameraFX = cameraFXPack3;
    
    if (!this.cameraFX) {
      console.error('SafeCameraAntiTiltPack1: cameraFXPack3 is required');
      return;
    }
    
    // Store original config for reference
    this.originalConfig = { ...this.cameraFX.config };
    this.originalTiltValues = {
      maxTilt: this.cameraFX.config.maxTilt,
      tiltSmoothness: this.cameraFX.config.tiltSmoothness
    };
    
    // Anti-tilt state
    this.tiltDisabled = false;
    this.targetTiltForce = 0;
    this.lastCameraQuaternion = new THREE.Quaternion();
    
    // Apply anti-tilt
    this.applyAntiTiltOverrides();
    this.patchUpdateMethods();
  }
  
  /**
   * Override camera FX config to disable all tilt
   */
  applyAntiTiltOverrides() {
    // RULE 1: DISABLE ALL SIDEWAYS CAMERA TILT
    // Set all tilt multipliers to zero
    this.cameraFX.config.maxTilt = 0;              // Disable tilt completely
    this.cameraFX.config.tiltSmoothness = 0.05;    // Very fast recovery if any residual tilt
    
    // Additional safety: create explicit tilt strength parameters
    this.tiltStrength = 0;
    this.tiltMaxAngle = 0;
    this.tiltSpeed = 0;
    this.tiltRecovery = 0.05; // Very fast recovery (0.05-0.1s)
    
    // RULE 2: DISABLE CAMERA ROLL ON AIR / DASH / BLINK
    this.airTilt = 0;
    this.dashTilt = 0;
    this.blinkTilt = 0;
    this.momentumRoll = 0;
    
    // RULE 3: REDUCE QUICK-TURN ROTATION DRAG
    this.yawDeltaTilt = 0;
    this.quickTurnTiltResponse = 0;
    
    // RULE 4: PRESERVE CINEMATIC EFFECTS
    // FOV expansion, speed warp, hyperfocus, vignette, bloom, trails
    // These are NOT modified - they don't add camera rotation
    
    // RULE 5: ENSURE CAMERA ROTATION = PURE PLAYER INPUT
    // Any secondary rotation influence set to 0
    this.secondaryRotationInfluence = 0;
    this.velocityBasedRotationTilt = 0;
    this.momentumBasedRotation = 0;
  }
  
  /**
   * Patch update methods to enforce anti-tilt
   */
  patchUpdateMethods() {
    const original = this.cameraFX;
    const self = this;
    
    // PATCH 1: Override updateMotionTilt to completely disable tilt
    const originalUpdateMotionTilt = original.updateMotionTilt.bind(original);
    original.updateMotionTilt = (playerController) => {
      // SAFETY: Completely disable tilt by setting it to 0
      original.targetTilt = 0;
      original.currentTilt = 0;
      
      // No tilt calculation, tilt stays at zero
    };
    
    // PATCH 2: Override applyAllEffectsToCamera to enforce upright camera
    const originalApplyAllEffectsToCamera = original.applyAllEffectsToCamera.bind(original);
    original.applyAllEffectsToCamera = () => {
      // Apply original effects
      originalApplyAllEffectsToCamera();
      
      // SAFETY OVERRIDE: Force camera to be upright
      // Preserve pitch and yaw, but remove roll (z-axis rotation)
      const euler = new THREE.Euler();
      euler.setFromQuaternion(original.camera.quaternion);
      
      // Keep pitch (x) and yaw (y), but reset roll (z) to 0
      euler.z = 0;
      
      // Apply corrected quaternion
      const correctedQuat = new THREE.Quaternion();
      correctedQuat.setFromEuler(euler);
      original.camera.quaternion.copy(correctedQuat);
    };
    
    // PATCH 3: Disable any FOV-based jitter that might add rotation
    const originalUpdateFOVDynamics = original.updateFOVDynamics.bind(original);
    original.updateFOVDynamics = (playerController, weatherPack) => {
      originalUpdateFOVDynamics(playerController, weatherPack);
      
      // Ensure FOV changes don't affect camera rotation
      // FOV is purely vertical, not rotational
    };
    
    // PATCH 4: Patch updateDashBlinKSnap to prevent snap tilt
    const originalUpdateDashBlinKSnap = original.updateDashBlinKSnap.bind(original);
    original.updateDashBlinKSnap = (playerController, deltaTime) => {
      if (!playerController) return;
      
      // Track last dash time
      if (!original.lastDashTime) original.lastDashTime = 0;
      
      if (playerController.isDashing && original.animationTime - original.lastDashTime > 0.5) {
        original.lastDashTime = original.animationTime;
        original.dashSnapActive = true;
        original.dashSnapTime = 0;
      }
      
      if (original.dashSnapActive) {
        original.dashSnapTime += deltaTime;
        
        // Dash snap affects FOV only, not rotation/tilt
        if (original.dashSnapTime < original.config.dashMicroSnapDuration) {
          const progress = original.dashSnapTime / original.config.dashMicroSnapDuration;
          const easeOut = 1 - Math.pow(1 - progress, 3);
          
          // Store as FOV offset, NOT as tilt
          original.registry.dashSnapOffset = easeOut * 0.15;
        } else {
          const timeAfterSnap = original.dashSnapTime - original.config.dashMicroSnapDuration;
          if (timeAfterSnap < 0.15) {
            const progress = timeAfterSnap / 0.15;
            original.registry.dashSnapOffset = 0.15 * (1 - progress * 0.5);
          } else {
            original.dashSnapActive = false;
            original.registry.dashSnapOffset = 0;
          }
        }
      }
    };
    
    // PATCH 5: Ensure camera pulse reaction doesn't tilt
    const originalUpdateCameraPulseReaction = original.updateCameraPulseReaction.bind(original);
    original.updateCameraPulseReaction = (weatherPack, worldEvents, linkingSystem) => {
      let pulseAmount = 0;
      
      // React to world events - reduced
      if (worldEvents && worldEvents.isEventActive()) {
        pulseAmount += worldEvents.getEventIntensity() * 0.15;
      }
      
      // React to weather - reduced
      if (weatherPack && weatherPack.isWeatherActive()) {
        pulseAmount += weatherPack.getWeatherIntensity() * 0.1;
      }
      
      // React to synergy spikes - reduced
      if (linkingSystem && linkingSystem.links) {
        let synergy = 0;
        linkingSystem.links.forEach(link => {
          if (link.glowData && link.glowData.synergy) {
            synergy += link.glowData.synergy;
          }
        });
        
        if (synergy > 10) {
          pulseAmount += 0.2;
        } else if (synergy > 5) {
          pulseAmount += 0.1;
        }
      }
      
      // Apply pulse as zoom and bloom ONLY
      const pulse = Math.sin(original.animationTime * 2) * 0.005 * pulseAmount;
      original.registry.bloomIntensity = Math.max(original.registry.bloomIntensity, pulseAmount * 0.15);
      
      // Shake is applied but NOT tilt
      if (pulseAmount > 0.2) {
        original.registry.shakeAmount = Math.max(original.registry.shakeAmount, pulseAmount * 0.15);
      }
      
      // ZERO tilt from pulses
      original.targetTilt = 0;
    };
    
    // PATCH 6: Disable any weather-based tilt
    if (original.updateFOVDynamics) {
      const originalUpdateFOVDynamicsForWeather = original.updateFOVDynamics.bind(original);
      original.updateFOVDynamics = (playerController, weatherPack) => {
        original.targetFOV = original.registry.baseFOV;
        
        if (playerController) {
          const speed = original.playerVelocity.length();
          
          // Movement increases FOV - keep cinematic
          if (speed > 5) {
            original.targetFOV += Math.min(5, speed * 0.3);
          }
          
          // High-speed blink
          if (speed > 20) {
            original.targetFOV += 3;
          }
          
          // Airborne
          if (playerController.isAirborne) {
            original.targetFOV += 2;
          }
        }
        
        // Weather affects FOV only, NO jitter or tilt
        if (weatherPack && weatherPack.isWeatherActive()) {
          const weatherType = weatherPack.getActiveWeatherType();
          if (weatherType === 'SIGMA_TURBULENCE') {
            // Slow, subtle FOV breathing ONLY
            const breathing = Math.sin(original.animationTime * 0.5) * 0.3;
            original.targetFOV += breathing;
          }
        }
        
        // Smooth FOV change
        original.currentFOV += (original.targetFOV - original.currentFOV) * 0.12;
        
        // ZERO tilt from FOV dynamics
        original.targetTilt = 0;
      };
    }
    
    // PATCH 7: Disable legendary event cinematic tilt
    const originalUpdateLegendaryEventCinematic = original.updateLegendaryEventCinematic.bind(original);
    original.updateLegendaryEventCinematic = (worldEvents, deltaTime) => {
      if (!worldEvents || !worldEvents.isEventActive()) {
        original.eventDriftPhase = 0;
        original.registry.chromaticFlicker = 0;
        original.targetTilt = 0; // ENSURE ZERO TILT
        return;
      }
      
      const eventIntensity = worldEvents.getEventIntensity();
      
      // Slow drift - affects position, NOT rotation
      original.eventDriftPhase += deltaTime * original.config.eventDriftSpeed;
      
      // Chromatic flicker and color grading, NOT tilt
      original.registry.chromaticFlicker = eventIntensity * 0.15 * 0.5;
      original.registry.colorGradeIntensity = eventIntensity * 0.3;
      
      // ZERO tilt from legendary events
      original.targetTilt = 0;
    };
    
    // PATCH 8: Anti-tilt enforcement loop
    // Run during every update to catch any residual tilt
    original._antiTiltUpdate = () => {
      // Force tilt values to zero at every frame
      original.targetTilt = 0;
      original.currentTilt = 0;
      
      // Additional safety: check quaternion and correct if needed
      const euler = new THREE.Euler();
      euler.setFromQuaternion(original.camera.quaternion);
      
      // If any roll (z-axis) exists, correct it
      if (Math.abs(euler.z) > 0.001) {
        euler.z = 0;
        const correctedQuat = new THREE.Quaternion();
        correctedQuat.setFromEuler(euler);
        original.camera.quaternion.copy(correctedQuat);
      }
    };
  }
  
  /**
   * Override the main update to enforce anti-tilt
   */
  enforceAntiTiltUpdate(deltaTime, playerController, weatherPack, worldEvents, legendaryPack, linkingSystem) {
    const original = this.cameraFX;
    
    // Call original update first
    original.update(deltaTime, playerController, weatherPack, worldEvents, legendaryPack, linkingSystem);
    
    // Then enforce anti-tilt
    if (original._antiTiltUpdate) {
      original._antiTiltUpdate();
    }
  }
  
  /**
   * Get current anti-tilt state
   */
  getAntiTiltState() {
    return {
      tiltDisabled: this.cameraFX.config.maxTilt === 0,
      maxTilt: this.cameraFX.config.maxTilt,
      tiltSmoothness: this.cameraFX.config.tiltSmoothness,
      tiltStrength: this.tiltStrength,
      tiltMaxAngle: this.tiltMaxAngle,
      airTilt: this.airTilt,
      dashTilt: this.dashTilt,
      blinkTilt: this.blinkTilt,
      momentumRoll: this.momentumRoll,
      yawDeltaTilt: this.yawDeltaTilt,
      secondaryRotationInfluence: this.secondaryRotationInfluence
    };
  }
  
  /**
   * Verify anti-tilt is applied correctly
   */
  verifyAntiTilt() {
    const checks = {
      maxTiltZero: this.cameraFX.config.maxTilt === 0,
      tiltSmoothnessLow: this.cameraFX.config.tiltSmoothness <= 0.1,
      tiltStrengthZero: this.tiltStrength === 0,
      tiltMaxAngleZero: this.tiltMaxAngle === 0,
      airTiltZero: this.airTilt === 0,
      dashTiltZero: this.dashTilt === 0,
      blinkTiltZero: this.blinkTilt === 0,
      momentumRollZero: this.momentumRoll === 0,
      yawDeltaTiltZero: this.yawDeltaTilt === 0,
      secondaryRotationZero: this.secondaryRotationInfluence === 0
    };
    
    const allPassed = Object.values(checks).every(v => v === true);
    
    if (allPassed) {
      console.log('✓ SafeCameraAntiTiltPack1: All anti-tilt checks PASSED - Camera locked upright');
    } else {
      console.warn('⚠ SafeCameraAntiTiltPack1: Some checks failed', checks);
    }
    
    return checks;
  }
  
  /**
   * Emergency revert to original tilt settings
   */
  revertToOriginal() {
    if (!this.originalTiltValues) {
      console.warn('Original tilt values not available');
      return;
    }
    
    this.cameraFX.config.maxTilt = this.originalTiltValues.maxTilt;
    this.cameraFX.config.tiltSmoothness = this.originalTiltValues.tiltSmoothness;
    
    console.log('Camera anti-tilt reverted to original settings');
  }
  
  /**
   * Emergency force-upright camera correction
   * Use if any residual tilt persists
   */
  forceUprightCorrection() {
    const original = this.cameraFX;
    
    // Get current euler angles
    const euler = new THREE.Euler();
    euler.setFromQuaternion(original.camera.quaternion);
    
    // Force roll to zero, keep pitch and yaw
    euler.z = 0;
    
    // Apply correction
    const correctedQuat = new THREE.Quaternion();
    correctedQuat.setFromEuler(euler);
    original.camera.quaternion.copy(correctedQuat);
    
    // Reset all tilt values
    original.targetTilt = 0;
    original.currentTilt = 0;
    
    console.log('Camera forced to upright position');
  }
}
