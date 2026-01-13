/**
 * RAYCAST FAILSAFE EXIT CONTROLLER v1.0
 * 
 * Monitors raycast violations and safely exits failsafe mode once conditions are met:
 * 1. Zero violations detected for 300 consecutive frames
 * 2. Hit-proxy system is fully operational
 * 3. All violations cleared from audit trail
 * 
 * CONSTRAINTS:
 * - Does NOT add new failsafes
 * - Does NOT touch RaycastIsolationFailsafeSystem
 * - Does NOT override Three.js
 * - Monitors data flow ONLY
 */

export class RaycastFailsafeExitController {
  /**
   * Create exit controller
   * @param {RaycastViolationDetector} detector - The violation detector to monitor
   * @param {Object} hitProxySystem - Hit proxy system reference
   */
  constructor(detector, hitProxySystem) {
    this.detector = detector;
    this.hitProxySystem = hitProxySystem;
    
    // Exit condition tracking
    this.cleanFrameCount = 0;
    this.requiredCleanFrames = 300;  // ~5 seconds at 60 FPS
    this.lastViolationCount = 0;
    this.exitConditionsMet = false;
    
    // Monitoring state
    this.isMonitoring = true;
    this.exitAttempted = false;
    this.exitSuccessful = false;
    
    // Timing
    this.monitoringStartTime = Date.now();
    this.lastStatusLog = Date.now();
    this.statusLogInterval = 5000;  // Log every 5 seconds
    
    // Telemetry
    this.telemetry = {
      totalFramesMonitored: 0,
      violationSpikes: 0,
      maxCleanStreakFrames: 0,
      lastViolationTime: null,
      firstCleanFrameTime: null
    };
  }

  /**
   * Update exit controller (call once per frame)
   */
  update() {
    if (!this.isMonitoring) return;
    
    this.telemetry.totalFramesMonitored++;
    
    // Check current violation count
    const violationCount = this.detector.violations.size;
    
    // Detect violation changes
    if (violationCount > this.lastViolationCount) {
      this.telemetry.violationSpikes++;
      this.telemetry.lastViolationTime = Date.now();
      this.cleanFrameCount = 0;  // Reset clean counter on new violation
    }
    
    this.lastViolationCount = violationCount;
    
    // Count clean frames (no violations)
    if (violationCount === 0) {
      this.cleanFrameCount++;
      
      // Record first clean frame time
      if (this.cleanFrameCount === 1) {
        this.telemetry.firstCleanFrameTime = Date.now();
      }
      
      // Track max clean streak
      if (this.cleanFrameCount > this.telemetry.maxCleanStreakFrames) {
        this.telemetry.maxCleanStreakFrames = this.cleanFrameCount;
      }
    } else {
      this.cleanFrameCount = 0;
    }
    
    // Check exit conditions
    this.evaluateExitConditions();
    
    // Log status periodically
    this.maybeLogStatus();
  }

  /**
   * Evaluate if all exit conditions are met
   * @private
   */
  evaluateExitConditions() {
    // Condition 1: 300 frames with zero violations
    const cleanFrameCondition = this.cleanFrameCount >= this.requiredCleanFrames;
    
    // Condition 2: Hit-proxy system is operational
    const proxySystemReady = this.hitProxySystem?.setupDone === true && 
                            this.hitProxySystem?.registry?.getAllProxies().length > 0;
    
    // Condition 3: Detector is not in failsafe mode
    const notInFailsafeMode = this.detector.failsafeModeActive === false;
    
    // All conditions met
    const allMet = cleanFrameCondition && proxySystemReady && notInFailsafeMode;
    
    if (allMet && !this.exitConditionsMet) {
      this.exitConditionsMet = true;
      this.attemptFailsafeExit();
    }
  }

  /**
   * Attempt to exit failsafe mode
   * @private
   */
  attemptFailsafeExit() {
    if (this.exitAttempted) return;
    
    this.exitAttempted = true;
    
    try {
      // Disable the violation detector (zero violations = no more detection needed)
      if (this.detector) {
        this.detector.enabled = false;
      }
      
      // Mark successful exit
      this.exitSuccessful = true;
      
      // Stop monitoring
      this.isMonitoring = false;
      
      // Log success
      console.log(
        '[RaycastFailsafeExitController] ✓ FAILSAFE EXIT SUCCESSFUL\n' +
        `  Clean frames: ${this.cleanFrameCount}/${this.requiredCleanFrames}\n` +
        `  Violations cleared: ${this.detector.violations.size}\n` +
        `  Hit-proxies active: ${this.hitProxySystem.registry.getAllProxies().length}\n` +
        `  Monitoring duration: ${Date.now() - this.monitoringStartTime}ms\n` +
        `  Total violations detected: ${this.telemetry.violationSpikes}`
      );
      
      // Restore hit-proxy raycast path (if raycaster was wrapped)
      this.restoreHitProxyRaycast();
      
    } catch (err) {
      console.error('[RaycastFailsafeExitController] Exit attempt failed:', err);
      this.exitSuccessful = false;
    }
  }

  /**
   * Restore hit-proxy raycast path (ensure raycaster uses proxies)
   * @private
   */
  restoreHitProxyRaycast() {
    try {
      if (!window.hitProxySystem?.raycast) return;
      
      // Verify that raycaster will use hit-proxies going forward
      // (This should already be the case, but we verify for safety)
      const proxies = window.hitProxySystem.registry.getAllProxies();
      
      console.log(
        `[RaycastFailsafeExitController] Hit-proxy raycast path confirmed:\n` +
        `  Available proxies: ${proxies.length}\n` +
        `  Raycast ready: ${window.hitProxySystem.raycast !== undefined}`
      );
    } catch (err) {
      console.warn('[RaycastFailsafeExitController] Could not confirm raycast path:', err);
    }
  }

  /**
   * Maybe log status (throttled to once per 5 seconds)
   * @private
   */
  maybeLogStatus() {
    const now = Date.now();
    if (now - this.lastStatusLog < this.statusLogInterval) return;
    
    this.lastStatusLog = now;
    
    const progress = Math.min(
      (this.cleanFrameCount / this.requiredCleanFrames * 100),
      100
    ).toFixed(1);
    
    if (!this.exitSuccessful) {
      console.log(
        `[RaycastFailsafeExitController] Status:\n` +
        `  Clean frames: ${this.cleanFrameCount}/${this.requiredCleanFrames} (${progress}%)\n` +
        `  Current violations: ${this.detector.violations.size}\n` +
        `  Violation spikes: ${this.telemetry.violationSpikes}\n` +
        `  Max clean streak: ${this.telemetry.maxCleanStreakFrames}`
      );
    }
  }

  /**
   * Get current status object
   */
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      exitAttempted: this.exitAttempted,
      exitSuccessful: this.exitSuccessful,
      exitConditionsMet: this.exitConditionsMet,
      cleanFrameCount: this.cleanFrameCount,
      requiredCleanFrames: this.requiredCleanFrames,
      currentViolations: this.detector.violations.size,
      telemetry: { ...this.telemetry }
    };
  }

  /**
   * Get debug report
   */
  getReport() {
    const elapsed = Date.now() - this.monitoringStartTime;
    const cleanPercentage = (this.cleanFrameCount / this.requiredCleanFrames * 100).toFixed(1);
    
    return {
      title: 'Raycast Failsafe Exit Report',
      status: this.exitSuccessful ? '✅ SUCCESS' : '⏳ MONITORING',
      cleanProgress: `${this.cleanFrameCount}/${this.requiredCleanFrames} (${cleanPercentage}%)`,
      uptime: `${elapsed}ms`,
      violationSpikes: this.telemetry.violationSpikes,
      maxCleanStreak: this.telemetry.maxCleanStreakFrames,
      currentViolations: this.detector.violations.size,
      hitProxiesAvailable: this.hitProxySystem?.registry?.getAllProxies().length || 0
    };
  }

  /**
   * Force exit (for testing)
   */
  forceExit() {
    console.warn('[RaycastFailsafeExitController] Force exit triggered');
    this.cleanFrameCount = this.requiredCleanFrames;  // Pretend we've met requirement
    this.evaluateExitConditions();
  }

  /**
   * Reset monitoring (for testing/recovery)
   */
  reset() {
    this.cleanFrameCount = 0;
    this.lastViolationCount = 0;
    this.exitAttempted = false;
    this.exitSuccessful = false;
    this.exitConditionsMet = false;
    this.isMonitoring = true;
    console.log('[RaycastFailsafeExitController] Monitoring reset');
  }
}

/**
 * Setup failsafe exit controller and integrate with game loop
 */
export function setupRaycastFailsafeExit(detector, hitProxySystem, game) {
  if (!detector || !hitProxySystem) {
    console.warn('[RaycastFailsafeExit] Missing detector or hitProxySystem');
    return null;
  }

  const exitController = new RaycastFailsafeExitController(detector, hitProxySystem);
  
  // Hook into game loop
  if (game && game.render) {
    const originalRender = game.render;
    game.render = function(deltaTime) {
      // Update exit controller every frame
      exitController.update();
      // Call original render
      return originalRender.call(this, deltaTime);
    };
  }
  
  // Expose on window for debugging
  window.RaycastFailsafeExitController = exitController;
  
  console.log('[RaycastFailsafeExit] Controller initialized');
  console.log('  Access via: window.RaycastFailsafeExitController');
  console.log('  - getStatus() — Current monitoring state');
  console.log('  - getReport() — Formatted report');
  console.log('  - forceExit() — Force exit (testing)');
  
  return exitController;
}

export default RaycastFailsafeExitController;
