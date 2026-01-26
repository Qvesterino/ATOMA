/**
 * QuantumIllusionRegistry.js
 * 
 * Central external registry for all quantum illusions
 * SAFE: Read-only state tracking, zero modifications to core systems
 * 
 * Manages lifetime, cleanup, and tracking of all illusion VFX objects
 */

export class QuantumIllusionRegistry {
  constructor(scene) {
    this.scene = scene;
    
    // Registry for all active illusions
    this.illusions = {
      echoes: [],           // Quantum Echo Doubles
      shards: [],           // Reality Shards
      drifts: [],           // Space Drift Warps
      afterPaths: [],       // Quantum After-Paths
      symbols: [],          // Floating Symbols
      focusEffects: [],     // Hyperfocus Moments
      ghostMarkers: [],     // Ghost-Warp Movement Markers
      worldBends: [],       // World Bend Moments
      hallucinations: []    // Sigma Hallucinations
    };
    
    // Global properties
    this.totalIllusions = 0;
    this.maxIllusions = 150;  // Budget limit
    this.illusionDensity = 1.0; // 0.5-1.0 for LOD
    
    // LOD state
    this.lodLevel = 'HIGH';   // HIGH, MEDIUM, LOW
    this.fpsTarget = 60;
    this.currentFPS = 60;
  }
  
  /**
   * Register a new illusion
   */
  registerIllusion(type, illusion, lifetime = 1.0) {
    if (!illusion || !illusion.mesh) return false;
    
    // Check budget
    if (this.totalIllusions >= this.maxIllusions) {
      this.pruneOldestIllusions();
    }
    
    // Add to appropriate registry
    const illusionEntry = {
      mesh: illusion.mesh,
      type: type,
      lifetime: lifetime,
      elapsed: 0,
      config: illusion,
      active: true
    };
    
    if (this.illusions[type]) {
      this.illusions[type].push(illusionEntry);
      this.totalIllusions++;
      return true;
    }
    
    return false;
  }
  
  /**
   * Unregister an illusion (cleanup)
   */
  unregisterIllusion(type, index) {
    if (!this.illusions[type] || !this.illusions[type][index]) return;
    
    const entry = this.illusions[type][index];
    if (entry.mesh && entry.mesh.parent) {
      entry.mesh.parent.remove(entry.mesh);
    }
    
    // Dispose geometry and material
    if (entry.mesh.geometry) entry.mesh.geometry.dispose();
    if (entry.mesh.material) entry.mesh.material.dispose();
    
    this.illusions[type].splice(index, 1);
    this.totalIllusions--;
  }
  
  /**
   * Update all illusions (lifetime tracking)
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunSimulation?.()) return;

    // Update FPS tracking for LOD
    this.updateLOD();
    
    // Update each illusion type
    for (const type in this.illusions) {
      const list = this.illusions[type];
      for (let i = list.length - 1; i >= 0; i--) {
        const entry = list[i];
        entry.elapsed += deltaTime;
        
        // Update progress for fade animations
        entry.progress = Math.min(entry.elapsed / entry.lifetime, 1.0);
        
        // Auto-remove expired illusions
        if (entry.elapsed >= entry.lifetime) {
          this.unregisterIllusion(type, i);
        }
      }
    }
  }
  
  /**
   * Update LOD based on FPS and illusion count
   */
  updateLOD() {
    const targetBudget = this.maxIllusions * 0.7;
    
    if (this.currentFPS < 50 || this.totalIllusions > targetBudget) {
      this.lodLevel = 'LOW';
      this.illusionDensity = 0.5;
    } else if (this.currentFPS < 55 || this.totalIllusions > targetBudget * 0.8) {
      this.lodLevel = 'MEDIUM';
      this.illusionDensity = 0.75;
    } else {
      this.lodLevel = 'HIGH';
      this.illusionDensity = 1.0;
    }
  }
  
  /**
   * Remove oldest illusions to make space
   */
  pruneOldestIllusions() {
    const cutoffCount = Math.ceil(this.maxIllusions * 0.1);
    let removed = 0;
    
    for (const type in this.illusions) {
      const list = this.illusions[type];
      for (let i = 0; i < list.length && removed < cutoffCount; i++) {
        if (list[i].elapsed > list[i].lifetime * 0.5) {
          this.unregisterIllusion(type, i);
          removed++;
          i--;
        }
      }
      if (removed >= cutoffCount) break;
    }
  }
  
  /**
   * Get all illusions for a specific type
   */
  getIllusionsByType(type) {
    return this.illusions[type] || [];
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      total: this.totalIllusions,
      byType: Object.entries(this.illusions).reduce((acc, [type, list]) => {
        acc[type] = list.length;
        return acc;
      }, {}),
      lodLevel: this.lodLevel,
      density: this.illusionDensity,
      fps: this.currentFPS
    };
  }
  
  /**
   * Clear all illusions
   */
  clearAll() {
    for (const type in this.illusions) {
      const list = this.illusions[type];
      while (list.length > 0) {
        this.unregisterIllusion(type, 0);
      }
    }
  }
  
  /**
   * Disable all illusions temporarily
   */
  disableAll() {
    for (const type in this.illusions) {
      const list = this.illusions[type];
      for (let i = 0; i < list.length; i++) {
        if (list[i].mesh) {
          list[i].mesh.visible = false;
        }
      }
    }
  }
  
  /**
   * Enable all illusions
   */
  enableAll() {
    for (const type in this.illusions) {
      const list = this.illusions[type];
      for (let i = 0; i < list.length; i++) {
        if (list[i].mesh) {
          list[i].mesh.visible = true;
        }
      }
    }
  }
}
