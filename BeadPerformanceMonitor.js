/**
 * ============================================================================
 * BEAD PERFORMANCE MONITOR
 * ============================================================================
 * 
 * Real-time performance monitoring for the bead system.
 * Tracks metrics, detects bottlenecks, and provides optimization recommendations.
 * 
 * ============================================================================
 */

/**
 * Performance monitor for all beads in the system
 */
export class BeadPerformanceMonitor {
  constructor() {
    this.metrics = {
      totalBeads: 0,
      activeBeads: 0,
      totalBlinks: 0,
      avgBeadsPerLink: 0,
      updateTime: 0,
      memoryUsage: 0,
      spawnsPerSecond: 0,
      recycles: 0
    };
    
    this.frameMetrics = {
      framesRecorded: 0,
      totalUpdateTime: 0,
      peakUpdateTime: 0,
      avgUpdateTime: 0,
      fps: 60
    };
    
    this.warnings = [];
    this.recommendations = [];
  }
  
  /**
   * Record a frame update
   */
  recordFrameUpdate(deltaTime, updateTimeMs) {
    this.frameMetrics.framesRecorded++;
    this.frameMetrics.totalUpdateTime += updateTimeMs;
    this.frameMetrics.peakUpdateTime = Math.max(this.frameMetrics.peakUpdateTime, updateTimeMs);
    this.frameMetrics.avgUpdateTime = this.frameMetrics.totalUpdateTime / this.frameMetrics.framesRecorded;
    this.frameMetrics.fps = 1 / deltaTime;
  }
  
  /**
   * Update bead metrics
   */
  updateMetrics(links) {
    this.metrics.totalBeads = 0;
    this.metrics.activeBeads = 0;
    let totalLinks = 0;
    
    for (const link of links) {
      if (!link.group || !link.group.userData.conduitState || !link.group.userData.conduitState.beads) {
        continue;
      }
      
      const beadViz = link.group.userData.conduitState.beads;
      const pool = beadViz.pool;
      const active = pool.getActiveBead();
      
      this.metrics.totalBeads += pool.maxBeads;
      this.metrics.activeBeads += active.length;
      totalLinks++;
    }
    
    if (totalLinks > 0) {
      this.metrics.avgBeadsPerLink = this.metrics.totalBeads / totalLinks;
    }
    
    this.analyzePerformance();
  }
  
  /**
   * Analyze performance and generate warnings/recommendations
   */
  analyzePerformance() {
    this.warnings = [];
    this.recommendations = [];
    
    // Check for high update time
    if (this.frameMetrics.avgUpdateTime > 1.0) {
      this.warnings.push('⚠️ High bead update time (>1ms)');
      this.recommendations.push('→ Reduce spawn rate or max beads per link');
    }
    
    // Check for high peak time
    if (this.frameMetrics.peakUpdateTime > 2.0) {
      this.warnings.push('⚠️ Peak bead update time spike (>2ms)');
      this.recommendations.push('→ Check for garbage collection or geometry regeneration');
    }
    
    // Check for low FPS
    if (this.frameMetrics.fps < 55) {
      this.warnings.push('⚠️ Low frame rate (<55 FPS)');
      this.recommendations.push('→ Reduce visual effects or bead count');
    }
    
    // Check for too many beads
    if (this.metrics.activeBeads > 500) {
      this.warnings.push('⚠️ Very high active bead count (>500)');
      this.recommendations.push('→ Use PRESET_CONSERVATIVE or reduce spawn rate');
    }
    
    // Check for pool inefficiency
    if (this.metrics.totalBeads > 0) {
      const utilization = this.metrics.activeBeads / this.metrics.totalBeads;
      if (utilization < 0.2) {
        this.recommendations.push('→ Pool size might be too large (low utilization)');
      } else if (utilization > 0.9) {
        this.recommendations.push('→ Pool size might be too small (high utilization)');
      }
    }
  }
  
  /**
   * Get formatted metrics report
   */
  getReport() {
    return {
      beads: {
        total: this.metrics.totalBeads,
        active: this.metrics.activeBeads,
        avgPerLink: this.metrics.avgBeadsPerLink.toFixed(2),
        utilization: ((this.metrics.activeBeads / Math.max(1, this.metrics.totalBeads)) * 100).toFixed(1) + '%'
      },
      performance: {
        frames: this.frameMetrics.framesRecorded,
        fps: this.frameMetrics.fps.toFixed(1),
        avgUpdateMs: this.frameMetrics.avgUpdateTime.toFixed(2),
        peakUpdateMs: this.frameMetrics.peakUpdateTime.toFixed(2)
      },
      warnings: this.warnings,
      recommendations: this.recommendations
    };
  }
  
  /**
   * Print formatted report to console
   */
  printReport() {
    const report = this.getReport();
    
    console.group('%c🔍 Bead System Performance Report', 'color: #00ffff; font-weight: bold');
    
    console.group('Beads');
    console.log(`Total: ${report.beads.total}`);
    console.log(`Active: ${report.beads.active}`);
    console.log(`Avg per Link: ${report.beads.avgPerLink}`);
    console.log(`Utilization: ${report.beads.utilization}`);
    console.groupEnd();
    
    console.group('Performance');
    console.log(`FPS: ${report.performance.fps}`);
    console.log(`Frames: ${report.performance.frames}`);
    console.log(`Avg Update: ${report.performance.avgUpdateMs}ms`);
    console.log(`Peak Update: ${report.performance.peakUpdateMs}ms`);
    console.groupEnd();
    
    if (report.warnings.length > 0) {
      console.group('%c⚠️ Warnings', 'color: #ffaa00');
      report.warnings.forEach(w => console.warn(w));
      console.groupEnd();
    }
    
    if (report.recommendations.length > 0) {
      console.group('%c💡 Recommendations', 'color: #00ff88');
      report.recommendations.forEach(r => console.info(r));
      console.groupEnd();
    }
    
    console.groupEnd();
  }
  
  /**
   * Reset all metrics
   */
  reset() {
    this.frameMetrics = {
      framesRecorded: 0,
      totalUpdateTime: 0,
      peakUpdateTime: 0,
      avgUpdateTime: 0,
      fps: 60
    };
    this.warnings = [];
    this.recommendations = [];
  }
  
  /**
   * Get performance grade (A-F)
   */
  getPerformanceGrade() {
    const avgTime = this.frameMetrics.avgUpdateTime;
    
    if (avgTime < 0.2) return 'A (Excellent)';
    if (avgTime < 0.5) return 'B (Good)';
    if (avgTime < 1.0) return 'C (Fair)';
    if (avgTime < 2.0) return 'D (Poor)';
    return 'F (Critical)';
  }
}

/**
 * Global performance monitor instance
 */
let globalMonitor = null;

/**
 * Get global monitor instance
 */
export function getGlobalMonitor() {
  if (!globalMonitor) {
    globalMonitor = new BeadPerformanceMonitor();
  }
  return globalMonitor;
}

/**
 * Print global performance report
 */
export function printBeadPerformanceReport() {
  getGlobalMonitor().printReport();
}

/**
 * Get performance grade
 */
export function getBeadPerformanceGrade() {
  return getGlobalMonitor().getPerformanceGrade();
}

export default {
  BeadPerformanceMonitor,
  getGlobalMonitor,
  printBeadPerformanceReport,
  getBeadPerformanceGrade
};
