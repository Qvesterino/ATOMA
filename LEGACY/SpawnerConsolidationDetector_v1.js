/**
 * SPAWNER CONSOLIDATION DETECTOR v1.0
 * ====================================
 * [HOTFIX] Detect and consolidate multiple node spawners
 * 
 * Mode: Non-blocking consolidation
 * - Detect which spawners are actively firing
 * - Mark 1-2 as authoritative
 * - Silence others with logging
 * - Do NOT block spawning, just consolidate execution
 * 
 * Implementation:
 * 1. Install hooks on known spawner entry points
 * 2. Track which are actually called during gameplay
 * 3. Flag non-authoritative ones to exit early
 * 4. Provide statistics
 */

/**
 * Spawner tracking state
 */
const SPAWNER_REGISTRY = {
  spawners: [],
  active: new Set(),
  authoritative: null,
  stats: {
    calls: {},
    silenced: 0
  }
};

/**
 * Spawner Consolidation Detector
 */
export class SpawnerConsolidationDetector_v1 {
  constructor() {
    this.enabled = true;
    this.learning = true;  // Learning phase - detect active spawners
    this.learningDuration = 30000;  // 30 seconds learning
    this.learningStart = Date.now();
    this.registry = SPAWNER_REGISTRY;
    
    console.log('[SpawnerConsolidationDetector] Initialized - learning phase active (30s)');
  }

  /**
   * Register a spawner for tracking
   * @param {string} name - Spawner identifier
   * @param {Function} spawnerFunction - The actual spawn function to wrap
   * @returns {Function} Wrapped spawner that tracks calls
   */
  registerSpawner(name, spawnerFunction) {
    this.registry.spawners.push({
      name,
      active: false,
      callCount: 0,
      lastCall: null
    });
    
    this.registry.stats.calls[name] = 0;
    
    const self = this;
    
    // Wrap spawner to track calls
    return function wrappedSpawner(...args) {
      const isLearning = self.learning && (Date.now() - self.learningStart < self.learningDuration);
      
      // Track this call
      self.registry.stats.calls[name]++;
      
      // Find spawner entry in registry
      const entry = self.registry.spawners.find(s => s.name === name);
      if (entry) {
        entry.active = true;
        entry.callCount++;
        entry.lastCall = Date.now();
      }
      
      // Record active spawner
      self.registry.active.add(name);
      
      // In learning phase, allow all spawners
      if (isLearning) {
        return spawnerFunction.apply(this, args);
      }
      
      // After learning: check if this spawner is authorized
      if (self.registry.authoritative && name !== self.registry.authoritative) {
        console.log(`[SPAWN CONSOLIDATION] Non-authoritative spawner ${name} ignored`);
        self.registry.stats.silenced++;
        return null;  // Silent exit
      }
      
      // Authoritative or not yet consolidated - proceed
      return spawnerFunction.apply(this, args);
    };
  }

  /**
   * Set authoritative spawner (consolidate to single source)
   */
  setAuthoritative(spawnerName) {
    this.registry.authoritative = spawnerName;
    this.learning = false;
    
    console.log(`[SpawnerConsolidationDetector] Authoritative spawner set: ${spawnerName}`);
    console.log(`[SpawnerConsolidationDetector] Other spawners will be silenced`);
  }

  /**
   * End learning phase and consolidate
   */
  endLearning() {
    if (!this.learning) return;
    
    this.learning = false;
    
    // Find most active spawner
    let mostActive = null;
    let maxCalls = 0;
    
    for (const spawner of this.registry.spawners) {
      if (spawner.callCount > maxCalls) {
        maxCalls = spawner.callCount;
        mostActive = spawner.name;
      }
    }
    
    if (mostActive) {
      console.log(`[SpawnerConsolidationDetector] Learning complete`);
      console.log(`[SpawnerConsolidationDetector] Most active: ${mostActive} (${maxCalls} calls)`);
      console.log(`[SpawnerConsolidationDetector] Active spawners detected: ${Array.from(this.registry.active).join(', ')}`);
      
      this.setAuthoritative(mostActive);
    } else {
      console.log('[SpawnerConsolidationDetector] Learning complete, no active spawners detected');
    }
  }

  /**
   * Force consolidation to specific spawner
   */
  consolidateTo(spawnerName) {
    this.endLearning();
    this.setAuthoritative(spawnerName);
  }

  /**
   * Get consolidation report
   */
  getReport() {
    return {
      learning: this.learning,
      learningTimeRemaining: Math.max(0, this.learningDuration - (Date.now() - this.learningStart)),
      authoritative: this.registry.authoritative,
      detectedSpawners: this.registry.spawners.map(s => ({
        name: s.name,
        active: s.active,
        calls: s.callCount,
        lastCall: s.lastCall ? new Date(s.lastCall).toISOString() : null
      })),
      activeSpawners: Array.from(this.registry.active),
      silencedCalls: this.registry.stats.silenced,
      callCounts: this.registry.stats.calls
    };
  }

  /**
   * Check current spawner status
   */
  isActive(spawnerName) {
    return this.registry.active.has(spawnerName);
  }

  /**
   * Check if spawner is authorized
   */
  isAuthorized(spawnerName) {
    if (!this.registry.authoritative) {
      return true;  // All authorized during learning
    }
    return spawnerName === this.registry.authoritative;
  }
}

/**
 * Global consolidator instance
 */
export const globalSpawnerDetector = new SpawnerConsolidationDetector_v1();

export default SpawnerConsolidationDetector_v1;
