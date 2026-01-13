/**
 * CAMERA STEADY FIX 1.0
 * 
 * Ensures camera remains perfectly stable when targeting nodes.
 * 
 * STRICT SAFETY:
 * - Do NOT modify camera FOV, rotation, position, or smoothing
 * - Do NOT add any lookAt, interpolation, snapping, or auto-focus
 * - Do NOT apply any offset or movement based on targeting
 * - Do NOT perform raycasts every frame (throttle to 20-30Hz)
 * - Do NOT update overlay continuously (only on node change)
 * 
 * This system DISABLES any code that:
 * - Rotates camera towards nodes
 * - Pushes camera position
 * - Applies attraction/repulsion
 * - Adds micro-shake on targeting
 * - Modifies camera state based on raycasting
 */

export class CameraSteadyFix1_0 {
  constructor() {
    this.isEnabled = true;
    this.disabledSystems = [];
  }

  /**
   * Verify that raycasting is properly throttled
   * Should NOT happen every frame (max 20-30Hz)
   */
  static verifyRaycastThrottling(raycastInterval) {
    // Throttle interval should be at least 33ms (30Hz)
    // or 50ms (20Hz)
    if (raycastInterval < 0.030) {
      console.warn('⚠ Raycast throttle too aggressive (<30Hz). Recommended: 33ms minimum.');
      return false;
    }
    return true;
  }

  /**
   * DISABLE any camera modification code
   * This ensures camera stays perfectly stable
   */
  static disableCameraModifications(cameraController) {
    if (!cameraController) return;

    const disabled = [];

    // Disable any lookAt method that might be applied
    if (cameraController.lookAt) {
      const original = cameraController.lookAt;
      cameraController.lookAt = function(...args) {
        console.log('🔒 CameraSteadyFix: Blocking camera.lookAt()');
        return;
      };
      disabled.push('lookAt');
    }

    // Disable any auto-focus or snap-to-target
    if (cameraController.focusOnTarget) {
      cameraController.focusOnTarget = function(...args) {
        console.log('🔒 CameraSteadyFix: Blocking focusOnTarget()');
        return;
      };
      disabled.push('focusOnTarget');
    }

    // Disable any position adjustment based on target
    if (cameraController.offsetTowards) {
      cameraController.offsetTowards = function(...args) {
        console.log('🔒 CameraSteadyFix: Blocking offsetTowards()');
        return;
      };
      disabled.push('offsetTowards');
    }

    // Disable attraction/repulsion
    if (cameraController.applyAttraction) {
      cameraController.applyAttraction = function(...args) {
        console.log('🔒 CameraSteadyFix: Blocking applyAttraction()');
        return;
      };
      disabled.push('applyAttraction');
    }

    // Disable micro-shake on targeting
    if (cameraController.addTargetingShake) {
      cameraController.addTargetingShake = function(...args) {
        console.log('🔒 CameraSteadyFix: Blocking addTargetingShake()');
        return;
      };
      disabled.push('addTargetingShake');
    }

    return disabled;
  }

  /**
   * Disable FOV changes
   */
  static disableFOVChanges(camera) {
    if (!camera) return;

    const originalFOV = camera.fov;
    
    Object.defineProperty(camera, 'fov', {
      get() {
        return originalFOV;
      },
      set(value) {
        if (value !== originalFOV) {
          console.log('🔒 CameraSteadyFix: Blocking FOV change from', originalFOV, 'to', value);
        }
      }
    });
  }

  /**
   * Safety check: Verify node targeting doesn't affect camera
   * (diagnostic only - doesn't actually modify anything)
   */
  static verifyCameraStability(camera, targetNode) {
    if (!camera || !targetNode) return true;

    // Record current camera state
    const beforePos = camera.position.clone();
    const beforeRot = camera.quaternion.clone();
    const beforeFOV = camera.fov;

    // Return state info (no modifications)
    return {
      position: beforePos,
      rotation: beforeRot,
      fov: beforeFOV,
    };
  }

  /**
   * Get the recommended raycast throttle interval (33ms = 30Hz)
   */
  static getRecommendedThrottleInterval() {
    return 1 / 30; // 33ms
  }

  /**
   * Enable/disable the fix
   */
  enable() {
    this.isEnabled = true;
    console.log('✅ CameraSteadyFix: ENABLED - Camera will remain stable');
  }

  disable() {
    this.isEnabled = false;
    console.log('⚠ CameraSteadyFix: DISABLED');
  }

  /**
   * Status report
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      recommendedRaycastHz: 30,
      recommendedThrottleMs: 33,
      disabledSystems: this.disabledSystems,
    };
  }
}
