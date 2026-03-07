/**
 * HOTFIX: EMERGENCY VISUAL STABILIZATION v1.0
 * ============================================
 * 
 * Integrates three critical safety systems:
 * 1. Emergency Aura Kill Switch (stop all halos/discs)
 * 2. Force Node Opaque Body System (ensure nodes are solid)
 * 3. Spawner Consolidation Detector (consolidate spawn sources)
 * 
 * INTEGRATION PATTERN:
 * 
 * In main.js:
 * 
 *   import { setupEmergencyVisualStabilization } from './HOTFIX_EmergencyVisualStabilization_v1.js';
 *   
 *   // After scene + renderer setup
 *   const stabilization = await setupEmergencyVisualStabilization({
 *     scene,
 *     renderer,
 *     debugMode: true
 *   });
 * 
 *   // In render loop, call each frame:
 *   stabilization.update();
 */

import { EmergencyAuraKillSwitch_v1 } from '../aura/EmergencyAuraKillSwitch_v1.js';
import { ForceNodeOpaqueBodySystem_v1 } from './ForceNodeOpaqueBodySystem_v1.js';
import { SpawnerConsolidationDetector_v1 } from './SpawnerConsolidationDetector_v1.js';

/**
 * Unified stabilization system
 */
export class EmergencyVisualStabilizationSystem_v1 {
  constructor(options = {}) {
    this.scene = options.scene;
    this.debugMode = options.debugMode ?? true;
    
    // Initialize subsystems
    this.auraKillSwitch = new EmergencyAuraKillSwitch_v1();
    this.opaqueNodeSystem = new ForceNodeOpaqueBodySystem_v1();
    this.spawnerDetector = new SpawnerConsolidationDetector_v1();
    
    // Install aura interceptor on scene immediately
    if (this.scene) {
      this.auraKillSwitch.installSceneInterceptor(this.scene);
    }
    
    this.stats = {
      framesSinceStart: 0,
      lastUpdate: Date.now()
    };
    
    console.log('[EmergencyVisualStabilizationSystem] HOTFIX ACTIVE');
    console.log('  ✓ Aura kill switch installed');
    console.log('  ✓ Node opaque enforcement ready');
    console.log('  ✓ Spawner consolidation detector active');
  }

  /**
   * Call each frame from render loop
   * Continuously enforces visual stability
   */
  update() {
    // Monitor and remove any auras that appear
    if (this.scene) {
      this.auraKillSwitch.monitor(this.scene);
    }
    
    // Check if learning phase is over
    if (this.spawnerDetector.learning) {
      const elapsed = Date.now() - this.spawnerDetector.learningStart;
      if (elapsed > this.spawnerDetector.learningDuration) {
        this.spawnerDetector.endLearning();
      }
    }
    
    this.stats.framesSinceStart++;
  }

  /**
   * Register a node after creation
   * Applies opaque override immediately
   */
  registerNode(nodeGroup) {
    if (!nodeGroup) return;
    
    // Force opaque
    this.opaqueNodeSystem.forceNodeOpaque(nodeGroup);
    
    if (this.debugMode) {
      console.log(`[StabilizationSystem] Node registered: ${nodeGroup.name || nodeGroup.uuid}`);
    }
  }

  /**
   * Register a spawner for consolidation tracking
   */
  registerSpawner(name, spawnerFunction) {
    return this.spawnerDetector.registerSpawner(name, spawnerFunction);
  }

  /**
   * Emergency full reset (immediate cleanup)
   */
  fullReset() {
    console.log('[EmergencyVisualStabilizationSystem] FULL RESET TRIGGERED');
    
    if (this.scene) {
      this.auraKillSwitch.fullReset(this.scene);
    }
    
    console.log('[EmergencyVisualStabilizationSystem] Reset complete');
  }

  /**
   * Get comprehensive status report
   */
  getReport() {
    return {
      aura: this.auraKillSwitch.getStats(),
      opacity: this.opaqueNodeSystem.getStats(),
      spawners: this.spawnerDetector.getReport(),
      framesSinceStart: this.stats.framesSinceStart
    };
  }

  /**
   * Immediate scene sweep (removes all visible auras now)
   */
  immediateAuraSweep() {
    if (this.scene) {
      const removed = this.auraKillSwitch.sweepScene(this.scene);
      console.log(`[EmergencyVisualStabilizationSystem] Immediate sweep: ${removed} auras removed`);
    }
  }
}

/**
 * Setup function for easy integration
 */
export async function setupEmergencyVisualStabilization(options = {}) {
  const system = new EmergencyVisualStabilizationSystem_v1(options);
  
  // Expose to window for console access
  window.__visualStabilization__ = system;
  
  console.log('[HOTFIX] Emergency Visual Stabilization ready');
  console.log('  Console: window.__visualStabilization__');
  console.log('  Methods: update(), getReport(), immediateAuraSweep()');
  
  return system;
}

export default EmergencyVisualStabilizationSystem_v1;
