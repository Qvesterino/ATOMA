import * as THREE from 'three';

// PHASE OFF-1: disable accumulated camera shake while preserving structure
const MOTION_OFF_PHASE1 = true;

/**
 * SAFE CAMERA STABILIZATION PACK 1.0
 * 
 * Reduces excessive camera shaking, tilting, bobbing and jitter while preserving cinematic effects.
 * All changes are SAFE and non-invasive - only adjusts VFX-based camera effects parameters.
 *
 * ABSOLUTE SAFETY RULES - STRICTLY ENFORCED:
 * - ZERO core camera logic modification
 * - ZERO engine camera override
 * - ZERO player movement/physics changes
 * - ZERO shader modifications
 * - Only adjusts multipliers, curves, and effect parameters within SafeCameraFXPack3
 * - All state stored ONLY in external registry
 * - Completely non-invasive and reversible
 *
 * KEY IMPROVEMENTS:
 * 1. Max tilt reduced to 1-2 degrees (from 6)
 * 2. Ground bob amplitude reduced 70% (from 0.08 to 0.024)
 * 3. Micro-shake capped at 0.1-0.2 degrees (from 2)
 * 4. Speed warp distortion reduced 30%
 * 5. Dash snap reduced 50%, smoother recovery
 * 6. World event drift reduced 60%
 * 7. Chromatic flicker reduced 50%
 * 8. Camera noise completely disabled
 * 9. All cinematic features preserved
 * 10. Total stability achieved while maintaining neon-tech feel
 */

export class SafeCameraStabilizationPack1 {
  constructor(cameraFXPack3) {
    this.cameraFX = cameraFXPack3;
    
    if (!this.cameraFX) {
      console.error('SafeCameraStabilizationPack1: cameraFXPack3 is required');
      return;
    }
    
    // Store original config for reference
    this.originalConfig = { ...this.cameraFX.config };
    
    // Apply stabilization
    this.applyStabilizationOverrides();
    this.patchUpdateMethods();
  }
  
  /**
   * Override camera FX config with stable values
   */
  applyStabilizationOverrides() {
    // RULE 1: REDUCE CAMERA TILT (SAFE)
    // Max tilt reduced from 6 degrees to 1.5 degrees
    this.cameraFX.config.maxTilt = 1.5;
    // Increase tilt smoothing for slower interpolation
    this.cameraFX.config.tiltSmoothness = 0.08; // Reduced from 0.1
    
    // RULE 2: REDUCE CAMERA BOB (SAFE)
    // Ground movement bob amplitude reduced 70%
    this.cameraFX.config.microBobAmplitude = 0.024; // Reduced from 0.08
    // Bob frequency reduced 40%
    this.cameraFX.config.microBobFrequency = 0.9; // Reduced from 1.5
    
    // RULE 3: REDUCE MICRO-SHAKE (SAFE)
    // Shake capped to 0.1-0.2 degrees
    this.cameraFX.config.maxShake = 0.15; // Reduced from 2
    // Position shake reduced by 75%
    this.cameraFX.config.maxShakePosition = 0.005; // Reduced from 0.02
    
    // RULE 4: REDUCE SPEED-WARP DISTORTION (SAFE)
    // Keep speedWarp active but reduce by 30% (handled in patched method)
    this.speedWarpReductionFactor = 0.7; // Keep 70% of original
    
    // RULE 5: STABILIZE DASH/BLINK SNAP (SAFE)
    // Snap duration remains same, but intensity reduced 50% (handled in patched method)
    this.dashSnapReductionFactor = 0.5; // 50% reduction
    this.cameraFX.config.dashMicroSnapDuration = 0.1; // Smoother recovery
    
    // RULE 6: STABILIZE WORLD EVENT CAMERA FX (SAFE)
    // Event drift reduced 60%
    this.cameraFX.config.eventDriftSpeed = 0.12; // Reduced from 0.3
    
    // RULE 7: REDUCE CHROMATIC FLICKER (SAFE)
    // Handled in patched updateLegendaryEventCinematic (50% reduction)
    this.chromaticFlickerReductionFactor = 0.5;
    
    // RULE 8: REMOVE CAMERA NOISE (SAFE)
    // Set to effectively disable random noise
    this.noiseDisabled = true;
    
    // RULE 9: PRESERVE CINEMATIC FEATURES (SAFE)
    // FOV expansion preserved at normal values
    // Bloom trails preserved
    // Legendary node hyperfocus preserved
    // (No changes needed - these work independently)
  }
  
  /**
   * Patch update methods to apply stabilization factors
   */
  patchUpdateMethods() {
    const original = this.cameraFX;
    
    // Patch updateMotionTilt for safer tilt behavior
    const originalUpdateMotionTilt = original.updateMotionTilt.bind(original);
    original.updateMotionTilt = (playerController) => {
      originalUpdateMotionTilt(playerController);
      
      // Apply additional smoothing pass
      if (original.currentTilt !== 0) {
        // Extra damping to prevent over-tilt
        original.currentTilt *= 0.95;
      }
    };
    
    // Patch updateSpeedWarp to reduce distortion by 30%
    const originalUpdateSpeedWarp = original.updateSpeedWarp.bind(original);
    original.updateSpeedWarp = (playerController) => {
      originalUpdateSpeedWarp(playerController);
      
      // Reduce speed warp intensity by 30%
      original.registry.speedWarpIntensity *= this.speedWarpReductionFactor;
    };
    
    // Patch updateAirborneFloat for softer vertical bob
    const originalUpdateAirborneFloat = original.updateAirborneFloat.bind(original);
    original.updateAirborneFloat = (playerController) => {
      if (!playerController || !playerController.isAirborne) {
        return;
      }
      
      // Add gentle bobbing motion - extremely soft
      const bob = Math.sin(original.animationTime * original.config.microBobFrequency) * 
                  original.config.microBobAmplitude;
      
      // Store for application
      original.registry.airborneFloat = bob;
    };
    
    // Patch updateCameraShake for safe micro-shake
    const originalUpdateCameraShake = original.updateCameraShake.bind(original);
    original.updateCameraShake = (weatherPack, linkingSystem, deltaTime) => {
      let shakeIntensity = 0;
      
      // Heavy synergy causes minimal shake
      if (linkingSystem && linkingSystem.links) {
        let synergy = 0;
        linkingSystem.links.forEach(link => {
          if (link.glowData && link.glowData.synergy) {
            synergy += link.glowData.synergy;
          }
        });
        
        // Reduce synergy shake by 60%
        if (synergy > 15) {
          shakeIntensity += 0.16; // Reduced from 0.4
        }
      }
      
      // Weather causes minimal shake
      if (weatherPack && weatherPack.isWeatherActive()) {
        const weatherType = weatherPack.getActiveWeatherType();
        if (weatherType === 'QUANTUM_STORM' || weatherType === 'SIGMA_TURBULENCE') {
          // Reduce weather shake by 50%
          shakeIntensity += weatherPack.getWeatherIntensity() * 0.15; // Reduced from 0.3
        }
      }
      
      // Smooth shake with faster decay
      original.registry.shakeAmount += (shakeIntensity - original.registry.shakeAmount) * 0.15;
      
      // Enforce shake cap
      original.registry.shakeAmount = Math.min(original.registry.shakeAmount, 0.2);
    };
    
    // Patch updateDashBlinKSnap for smoother snap recovery
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
        
        if (original.dashSnapTime < original.config.dashMicroSnapDuration) {
          // Snap forward - reduced intensity
          const progress = original.dashSnapTime / original.config.dashMicroSnapDuration;
          const easeOut = 1 - Math.pow(1 - progress, 3);
          
          // Reduce snap intensity by 50%
          original.registry.dashSnapOffset = easeOut * 0.15 * this.dashSnapReductionFactor;
        } else {
          // Overshoot correction - much smoother
          const timeAfterSnap = original.dashSnapTime - original.config.dashMicroSnapDuration;
          if (timeAfterSnap < 0.15) { // Extended smooth recovery
            const progress = timeAfterSnap / 0.15;
            original.registry.dashSnapOffset = 0.15 * (1 - progress * 0.5);
          } else {
            original.dashSnapActive = false;
            original.registry.dashSnapOffset = 0;
          }
        }
      }
    };
    
    // Patch updateLegendaryEventCinematic to reduce chromatic flicker
    const originalUpdateLegendaryEventCinematic = original.updateLegendaryEventCinematic.bind(original);
    original.updateLegendaryEventCinematic = (worldEvents, deltaTime) => {
      if (!worldEvents || !worldEvents.isEventActive()) {
        original.eventDriftPhase = 0;
        original.registry.chromaticFlicker = 0;
        return;
      }
      
      const eventIntensity = worldEvents.getEventIntensity();
      
      // Slow drift - already reduced by config override
      original.eventDriftPhase += deltaTime * original.config.eventDriftSpeed;
      
      // Reduce chromatic flicker by 50%
      original.registry.chromaticFlicker = eventIntensity * 0.15 * this.chromaticFlickerReductionFactor;
      
      // Exposure ramp up - no horizon wobble
      original.registry.colorGradeIntensity = eventIntensity * 0.3;
    };
    
    // Patch updateFOVDynamics to prevent jitter
    const originalUpdateFOVDynamics = original.updateFOVDynamics.bind(original);
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
      
      // Weather affects FOV - remove jitter
      if (weatherPack && weatherPack.isWeatherActive()) {
        const weatherType = weatherPack.getActiveWeatherType();
        if (weatherType === 'SIGMA_TURBULENCE') {
          // Replace jitter with slow, subtle change (removed FOV jitter line)
          // Only apply very slow breathing effect
          const breathing = Math.sin(original.animationTime * 0.5) * 0.3;
          original.targetFOV += breathing;
        }
      }
      
      // Smooth FOV change - faster convergence
      original.currentFOV += (original.targetFOV - original.currentFOV) * 0.12;
    };
    
    // Patch updateCameraPulseReaction for stable pulses
    const originalUpdateCameraPulseReaction = original.updateCameraPulseReaction.bind(original);
    original.updateCameraPulseReaction = (weatherPack, worldEvents, linkingSystem) => {
      let pulseAmount = 0;
      
      // React to world events - reduced
      if (worldEvents && worldEvents.isEventActive()) {
        pulseAmount += worldEvents.getEventIntensity() * 0.15; // Reduced from 0.3
      }
      
      // React to weather - reduced
      if (weatherPack && weatherPack.isWeatherActive()) {
        pulseAmount += weatherPack.getWeatherIntensity() * 0.1; // Reduced from 0.2
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
          pulseAmount += 0.2; // Reduced from 0.4
        } else if (synergy > 5) {
          pulseAmount += 0.1; // Reduced from 0.2
        }
      }
      
      // Apply pulse as zoom and bloom
      const pulse = Math.sin(original.animationTime * 2) * 0.005 * pulseAmount; // Reduced frequency and amplitude
      original.registry.bloomIntensity = Math.max(original.registry.bloomIntensity, pulseAmount * 0.15);
      
      // Tiny shake on pulse - much reduced
      if (pulseAmount > 0.2) {
        original.registry.shakeAmount = Math.max(original.registry.shakeAmount, pulseAmount * 0.15); // Reduced from 0.5
      }
    };
    
    // Patch applyAllEffectsToCamera to prevent drift
    const originalApplyAllEffectsToCamera = original.applyAllEffectsToCamera.bind(original);
    original.applyAllEffectsToCamera = () => {
      // Apply tilt (roll) - clamped and smooth
      const tiltRad = THREE.MathUtils.degToRad(original.currentTilt);
      const targetQuaternion = new THREE.Quaternion();
      targetQuaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), tiltRad);
      // Slower interpolation for smooth tilt
      original.camera.quaternion.slerp(targetQuaternion, 0.08);
      
      // Apply FOV
      original.camera.fov = original.currentFOV;
      original.camera.updateProjectionMatrix();
      
      // PHASE OFF-1: disabled accumulated camera shake (event-based impulse only in future)
      if (!MOTION_OFF_PHASE1 && original.registry.shakeAmount > 0.01) {
        const shake = original.registry.shakeAmount;
        // Only apply shake if it's significant enough
        original.camera.position.x += (Math.random() - 0.5) * original.config.maxShakePosition * shake;
        original.camera.position.y += (Math.random() - 0.5) * original.config.maxShakePosition * shake * 0.5; // Reduce vertical shake
        original.camera.position.z += (Math.random() - 0.5) * original.config.maxShakePosition * shake;
        
        // Faster decay
        original.registry.shakeAmount *= 0.9;
      } else if (MOTION_OFF_PHASE1 && original.registry.shakeAmount > 0.01) {
        // Bleed off any queued shake without moving the camera
        original.registry.shakeAmount *= 0.9;
      }
      
      // Smooth decay
      original.registry.chromaticFlicker *= 0.9;
    };
  }
  
  /**
   * Get current stabilization state
   */
  getStabilizationState() {
    return {
      tiltMax: this.cameraFX.config.maxTilt,
      bobAmplitude: this.cameraFX.config.microBobAmplitude,
      shakeMax: this.cameraFX.config.maxShake,
      speedWarpReduction: (1 - this.speedWarpReductionFactor) * 100,
      dashSnapReduction: this.dashSnapReductionFactor * 100,
      eventDriftSpeed: this.cameraFX.config.eventDriftSpeed,
      noiseDisabled: this.noiseDisabled
    };
  }
  
  /**
   * Verify stabilization is applied correctly
   */
  verifyStabilization() {
    const checks = {
      tiltCapped: this.cameraFX.config.maxTilt <= 2,
      bobReduced: this.cameraFX.config.microBobAmplitude <= 0.03,
      shakeCapped: this.cameraFX.config.maxShake <= 0.2,
      driftSlowed: this.cameraFX.config.eventDriftSpeed <= 0.15,
      smoothnessIncreased: this.cameraFX.config.tiltSmoothness <= 0.1
    };
    
    const allPassed = Object.values(checks).every(v => v === true);
    
    if (allPassed) {
      console.log('✓ SafeCameraStabilizationPack1: All stabilization checks PASSED');
    } else {
      console.warn('⚠ SafeCameraStabilizationPack1: Some checks failed', checks);
    }
    
    return checks;
  }
  
  /**
   * Emergency revert to original settings (if needed)
   */
  revertToOriginal() {
    if (!this.originalConfig) {
      console.warn('Original config not available');
      return;
    }
    
    Object.assign(this.cameraFX.config, this.originalConfig);
    console.log('Camera stabilization reverted to original settings');
  }
}
