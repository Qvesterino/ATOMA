/**
 * ============================================================================
 * SOAK TEST LOGGING SYSTEM v1.0 — Tier-5 Long-Term Behavior Observation
 * ============================================================================
 * 
 * Pure logging system for observing network behavior over 10-15 minute runs.
 * 
 * NO gameplay changes. NO UI. NO tuning.
 * 
 * Logging only:
 * - Aggregates metrics by category
 * - Logs periodically to console and buffer
 * - Toggle-able with feature flags
 * - Production-safe behind disabled flag
 * 
 * FEATURE FLAGS:
 *   window.ENABLE_SOAK_LOGGING = true/false
 *   window.SOAK_LOG_INTERVAL = 5.0 (seconds)
 * 
 * DATA SOURCES (read-only):
 *   node.userData.fatigue
 *   node.userData.metrics.harmony
 *   node.userData.metrics.corruption
 *   node.userData.metrics.synergy
 *   node.userData.metrics.stability (derive instability)
 *   node.userData.currentLinks / maxLinks
 *   node.userData.category
 * 
 * METRICS LOGGED (per category):
 *   time, category, avgFatigue, avgHarmony, avgCorruption,
 *   avgSynergy, avgInstability, avgLoadRatio, nodeCount
 * 
 * ============================================================================
 */

export class SoakTestLogging {
  constructor(aiNodes) {
    this.aiNodes = aiNodes;
    this.lastLogTime = 0;
    this.sessionStartTime = Date.now();
    
    // Feature flags
    if (window.ENABLE_SOAK_LOGGING === undefined) {
      window.ENABLE_SOAK_LOGGING = false; // Disabled by default
    }
    if (window.SOAK_LOG_INTERVAL === undefined) {
      window.SOAK_LOG_INTERVAL = 5.0;
    }
    
    // Log buffer for export
    window.__SOAK_LOG__ = window.__SOAK_LOG__ || [];
    
    this.setupDebugConsole();
  }
  
  /**
   * Main update call — check if logging interval elapsed
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunSimulation?.()) return;

    if (!window.ENABLE_SOAK_LOGGING) {
      return;
    }
    
    const now = performance.now();
    const timeSinceLastLog = (now - this.lastLogTime) / 1000; // Convert to seconds
    
    if (timeSinceLastLog >= window.SOAK_LOG_INTERVAL) {
      this.logSnapshot();
      this.lastLogTime = now;
    }
  }
  
  /**
   * Capture and log aggregated metrics by category
   */
  logSnapshot() {
    if (!this.aiNodes?.nodes) return;
    
    const aggregated = this.aggregateByCategory(this.aiNodes.nodes);
    const timestamp = this.getElapsedTime();
    
    // Log to console with timestamp
    console.log(`🔍 SOAK-LOG [${timestamp}]:`);
    console.table(aggregated);
    
    // Store in buffer
    window.__SOAK_LOG__.push({
      timestamp,
      timestampMs: Date.now(),
      data: aggregated
    });
    
    // Debug: show buffer size
    const bufferSize = window.__SOAK_LOG__.length;
    const memoryKB = (JSON.stringify(window.__SOAK_LOG__).length / 1024).toFixed(1);
    console.log(`   Buffer: ${bufferSize} snapshots, ~${memoryKB}KB`);
  }
  
  /**
   * Aggregate all metrics by node category
   */
  aggregateByCategory(nodes) {
    const buckets = {};
    
    for (const node of nodes) {
      const category = node.userData?.category || 'unknown';
      
      if (!buckets[category]) {
        buckets[category] = {
          count: 0,
          fatigue: 0,
          harmony: 0,
          corruption: 0,
          synergy: 0,
          instability: 0,
          load: 0
        };
      }
      
      const b = buckets[category];
      b.count++;
      
      // Read-only access to all metrics
      const metrics = node.userData?.metrics || {};
      const harmony = metrics.harmony ?? 0;
      const corruption = metrics.corruption ?? 0;
      const synergy = metrics.synergy ?? 0;
      const stability = metrics.stability ?? 1.0;
      const instability = 1 - stability;

      b.fatigue += node.userData?.fatigue ?? 0;
      b.harmony += harmony;
      b.corruption += corruption;
      b.synergy += synergy;
      b.instability += instability;
      
      // Calculate load ratio
      const currentLinks = node.userData?.currentLinks ?? 0;
      const maxLinks = node.userData?.maxLinks ?? 1;
      b.load += maxLinks > 0 ? currentLinks / maxLinks : 0;
    }
    
    // Convert to output format
    return Object.entries(buckets)
      .sort(([catA], [catB]) => catA.localeCompare(catB)) // Alphabetical order
      .map(([category, b]) => ({
        time: this.getElapsedTime(),
        category,
        avgFatigue: this.round(b.fatigue / b.count, 4),
        avgHarmony: this.round(b.harmony / b.count, 2),
        avgCorruption: this.round(b.corruption / b.count, 4),
        avgSynergy: this.round(b.synergy / b.count, 2),
        avgInstability: this.round(b.instability / b.count, 2),
        avgLoadRatio: this.round(b.load / b.count, 3),
        nodeCount: b.count
      }));
  }
  
  /**
   * Get elapsed time since session start (formatted)
   */
  getElapsedTime() {
    const elapsed = Date.now() - this.sessionStartTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  /**
   * Round number to N decimal places
   */
  round(num, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
  }
  
  /**
   * Export buffer to JSON (user calls copy())
   */
  exportBuffer() {
    const json = JSON.stringify(window.__SOAK_LOG__, null, 2);
    console.log('=== SOAK LOG EXPORT ===');
    console.log(json);
    console.log('Copy the log above and paste into a file.');
    console.log(`Total snapshots: ${window.__SOAK_LOG__.length}`);
    return json;
  }
  
  /**
   * Clear buffer and reset
   */
  clearBuffer() {
    window.__SOAK_LOG__ = [];
    this.lastLogTime = 0;
    this.sessionStartTime = Date.now();
    console.log('✓ Soak log buffer cleared, session reset');
  }
  
  /**
   * Get statistics about the current buffer
   */
  getBufferStats() {
    const buffer = window.__SOAK_LOG__;
    if (buffer.length === 0) {
      return { snapshots: 0, duration: 0, categories: [] };
    }
    
    const categories = new Set();
    buffer.forEach(snapshot => {
      snapshot.data.forEach(row => {
        categories.add(row.category);
      });
    });
    
    const durationMs = buffer[buffer.length - 1].timestampMs - buffer[0].timestampMs;
    const durationMin = (durationMs / 60000).toFixed(2);
    
    return {
      snapshots: buffer.length,
      durationMinutes: durationMin,
      categories: Array.from(categories).sort(),
      memoryKB: (JSON.stringify(buffer).length / 1024).toFixed(1)
    };
  }
  
  /**
   * Setup console debug API
   */
  setupDebugConsole() {
    if (typeof window === 'undefined') return;
    
    window.SOAK_DEBUG = {
      enable: () => {
        window.ENABLE_SOAK_LOGGING = true;
        console.log('✓ Soak logging ENABLED (interval: ' + window.SOAK_LOG_INTERVAL + 's)');
      },
      
      disable: () => {
        window.ENABLE_SOAK_LOGGING = false;
        console.log('✓ Soak logging DISABLED');
      },
      
      setInterval: (seconds) => {
        window.SOAK_LOG_INTERVAL = Math.max(1, seconds);
        console.log(`✓ Soak log interval set to ${seconds}s`);
      },
      
      snapshot: () => {
        if (this.aiNodes?.nodes) {
          this.logSnapshot();
          console.log('✓ Manual snapshot captured');
        } else {
          console.warn('⚠ No nodes available for logging');
        }
      },
      
      status: () => {
        const stats = this.getBufferStats();
        console.log('=== SOAK LOGGING STATUS ===');
        console.log(`Enabled: ${window.ENABLE_SOAK_LOGGING ? 'YES' : 'NO'}`);
        console.log(`Interval: ${window.SOAK_LOG_INTERVAL}s`);
        console.log(`Snapshots: ${stats.snapshots}`);
        console.log(`Duration: ${stats.durationMinutes} minutes`);
        console.log(`Categories: ${stats.categories.join(', ')}`);
        console.log(`Memory: ~${stats.memoryKB}KB`);
        return stats;
      },
      
      export: () => {
        return this.exportBuffer();
      },
      
      clear: () => {
        this.clearBuffer();
      },
      
      getBuffer: () => {
        return window.__SOAK_LOG__;
      }
    };
    
    console.log('✓ SOAK_DEBUG console API ready');
    console.log('  Use: SOAK_DEBUG.enable(), .status(), .snapshot(), .export(), etc.');
  }
}
