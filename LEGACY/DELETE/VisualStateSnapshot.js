/**
 * VISUAL STATE SNAPSHOT — Session 98
 * 
 * Captures and stores valid visual states for auto-recovery.
 * Enables rollback to known-good states when enforcement violations occur.
 * 
 * FEATURES:
 * - Lightweight snapshots of aura/glyph properties
 * - Timestamp tracking for state age detection
 * - Differential snapshots (only changed properties)
 * - State validity indicators
 * - Batch snapshot management
 * 
 * USAGE:
 * const snapshot = new VisualStateSnapshot(aura, {
 *   captureOpacity: true,
 *   captureColor: true,
 *   captureScale: false
 * });
 * 
 * // Later: restore
 * snapshot.applyTo(aura);
 */

export class VisualStateSnapshot {
  /**
   * Capture a snapshot of current visual state
   * @param {THREE.Object3D|THREE.Material} target - Object or material to snapshot
   * @param {Object} options - What to capture (captureOpacity, captureColor, etc.)
   */
  constructor(target, options = {}) {
    this.target = target;
    this.timestamp = performance.now();
    this.isValid = true;
    this.captureOptions = options;
    
    // Snapshot data
    this.data = {
      // Geometry transforms
      position: null,
      rotation: null,
      scale: null,
      
      // Material properties
      opacity: null,
      color: null,
      emissive: null,
      emissiveIntensity: null,
      
      // Shader uniforms (stored as key-value pairs)
      uniforms: {},
      
      // User data (for reference)
      userData: {}
    };
    
    // Statistics
    this.appliedCount = 0;
    this.lastAppliedTime = null;
    
    // Capture the state
    this._captureState(target, options);
  }
  
  /**
   * Internal: Capture visual state from target
   */
  _captureState(target, options) {
    if (!target) return;
    
    // Capture transforms if it's a 3D object
    if (target.position && target.rotation && target.scale) {
      this.data.position = target.position.clone();
      this.data.rotation = target.rotation.clone();
      this.data.scale = target.scale.clone();
    }
    
    // Capture material properties
    if (target.material) {
      this._captureFromMaterial(target.material, options);
    } else if (target.opacity !== undefined) {
      // Direct material reference
      this._captureFromMaterial(target, options);
    }
    
    // Capture userData for context
    if (target.userData) {
      this.data.userData = { ...target.userData };
    }
  }
  
  /**
   * Internal: Capture material properties
   */
  _captureFromMaterial(material, options) {
    if (!material) return;
    
    // Opacity
    if (options.captureOpacity !== false && material.opacity !== undefined) {
      this.data.opacity = material.opacity;
    }
    
    // Color
    if (options.captureColor !== false && material.color) {
      this.data.color = material.color.clone();
    }
    
    // Emissive
    if (options.captureEmissive !== false && material.emissive) {
      this.data.emissive = material.emissive.clone();
      if (material.emissiveIntensity !== undefined) {
        this.data.emissiveIntensity = material.emissiveIntensity;
      }
    }
    
    // Shader uniforms
    if (material.uniforms && options.captureUniforms !== false) {
      for (const [key, uniform] of Object.entries(material.uniforms)) {
        this.data.uniforms[key] = this._cloneUniformValue(uniform.value);
      }
    }
  }
  
  /**
   * Clone a uniform value (handles Vector3, Color, numbers, etc.)
   */
  _cloneUniformValue(value) {
    if (!value) return value;
    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value;
    if (value.clone) return value.clone();
    if (Array.isArray(value)) return [...value];
    return value;
  }
  
  /**
   * Apply this snapshot to a target
   * @param {THREE.Object3D|THREE.Material} target - Where to apply state
   * @param {Object} options - What to restore (default: what was captured)
   * @returns {number} - Number of properties restored
   */
  applyTo(target, options = {}) {
    if (!target || !this.isValid) return 0;
    
    let restored = 0;
    const opts = { ...this.captureOptions, ...options };
    const material = target.material || target;
    // [B.3-C3] Snapshot restore stabilization guard
    const shaderProps = ['transparent', 'blending', 'side', 'depthWrite', 'depthTest'];
    const materialCache =
      material?.userData?.__b3c3SnapshotCache ||
      (material &&
        (material.userData = material.userData || {},
        (material.userData.__b3c3SnapshotCache = {})));
    let shaderChanged = false;
    const pendingShaderUpdates = [];
    const definesSnapshot = material?.defines ? JSON.stringify(material.defines) : null;
    
    // Restore transforms
    if (target.position && this.data.position) {
      target.position.copy(this.data.position);
      restored++;
    }
    if (target.rotation && this.data.rotation) {
      target.rotation.copy(this.data.rotation);
      restored++;
    }
    if (target.scale && this.data.scale) {
      target.scale.copy(this.data.scale);
      restored++;
    }
    
    // Restore material properties
    if (material) {
      // Runtime-only properties: apply without needsUpdate
      if (material.opacity !== undefined && this.data.opacity !== null) {
        material.opacity = this.data.opacity;
        restored++;
      }

      if (material.color && this.data.color) {
        material.color.copy(this.data.color);
        restored++;
      }

      if (material.emissive && this.data.emissive) {
        material.emissive.copy(this.data.emissive);
        if (this.data.emissiveIntensity !== null) {
          material.emissiveIntensity = this.data.emissiveIntensity;
        }
        restored++;
      }

      // Uniforms
      if (material.uniforms && Object.keys(this.data.uniforms).length > 0) {
        for (const [key, savedValue] of Object.entries(this.data.uniforms)) {
          if (material.uniforms[key]) {
            if (savedValue && savedValue.copy) {
              material.uniforms[key].value.copy(savedValue);
            } else {
              material.uniforms[key].value = savedValue;
            }
            restored++;
          }
        }
      }

      // Shader-affecting props: compare with cache before applying
      if (materialCache) {
        for (const prop of shaderProps) {
          if (this.data[prop] !== undefined) {
            const incoming = this.data[prop];
            if (material[prop] !== incoming) {
              pendingShaderUpdates.push([prop, incoming]);
              if (materialCache[prop] !== incoming) {
                shaderChanged = true;
              }
            }
          }
        }

        const incomingDefines = definesSnapshot;
        if (incomingDefines !== null && materialCache.__defines !== incomingDefines) {
          shaderChanged = true;
        }

        if (shaderChanged) {
          // Apply pending shader-affecting changes
          for (const [prop, val] of pendingShaderUpdates) {
            material[prop] = val;
          }
          if (incomingDefines !== null) {
            material.defines = material.defines || {};
            materialCache.__defines = incomingDefines;
          }

          // Update cache after apply
          for (const [prop, val] of pendingShaderUpdates) {
            materialCache[prop] = val;
          }

          material.needsUpdate = true;
          if (typeof window !== 'undefined') {
            window.__B3C3_NEEDSUPDATE_COUNT =
              (window.__B3C3_NEEDSUPDATE_COUNT || 0) + 1;
            if (window.__DEBUG_WAVE_NEEDSUPDATE_SOURCE_TRACE__ === true) {
              const key = 'VisualStateSnapshot.js:242 material.needsUpdate=true';
              const bucket = window.__WAVE_NEEDSUPDATE_SOURCE_TRACE__ || (window.__WAVE_NEEDSUPDATE_SOURCE_TRACE__ = {});
              bucket[key] = (bucket[key] || 0) + 1;
            }
          }
        }
      }
    }
    
    // Track application
    this.appliedCount++;
    this.lastAppliedTime = performance.now();
    
    if (typeof window !== 'undefined') {
      window.__B3C3_SNAPSHOT_RESTORE_COUNT =
        (window.__B3C3_SNAPSHOT_RESTORE_COUNT || 0) + 1;
    }

    return restored;
  }
  
  /**
   * Get age of this snapshot in milliseconds
   */
  getAge() {
    return performance.now() - this.timestamp;
  }
  
  /**
   * Check if snapshot is still fresh (< maxAge ms old)
   */
  isFresh(maxAgeMs = 5000) {
    return this.getAge() < maxAgeMs;
  }
  
  /**
   * Create a new snapshot from the current target state
   * Useful for updating a snapshot with current values
   */
  refresh() {
    this.timestamp = performance.now();
    this._captureState(this.target, this.captureOptions);
    return this;
  }
  
  /**
   * Invalidate this snapshot (mark as unusable)
   */
  invalidate() {
    this.isValid = false;
  }
  
  /**
   * Get debug information
   */
  getDebugInfo() {
    return {
      timestamp: this.timestamp,
      age: this.getAge(),
      isValid: this.isValid,
      isFresh: this.isFresh(),
      appliedCount: this.appliedCount,
      lastAppliedTime: this.lastAppliedTime,
      capturedProperties: {
        transforms: !!(this.data.position || this.data.rotation || this.data.scale),
        opacity: this.data.opacity !== null,
        color: !!this.data.color,
        emissive: !!this.data.emissive,
        uniforms: Object.keys(this.data.uniforms).length
      }
    };
  }
}

/**
 * SNAPSHOT POOL — Efficient management of snapshots
 * 
 * Stores multiple snapshots per object for recovery strategies.
 * Automatically prunes old/stale snapshots.
 */
export class VisualStateSnapshotPool {
  constructor(maxSnapshotsPerNode = 3, maxAgeMs = 5000) {
    this.snapshots = new Map();  // nodeId/linkId → array of snapshots
    this.maxSnapshotsPerNode = maxSnapshotsPerNode;
    this.maxAgeMs = maxAgeMs;
    this.stats = {
      totalSnapshots: 0,
      totalCaptures: 0,
      totalRestores: 0,
      totalPrunes: 0
    };
  }
  
  /**
   * Add a snapshot to the pool
   */
  addSnapshot(key, snapshot) {
    if (!this.snapshots.has(key)) {
      this.snapshots.set(key, []);
    }
    
    const list = this.snapshots.get(key);
    list.push(snapshot);
    this.stats.totalSnapshots++;
    this.stats.totalCaptures++;
    
    // Prune old/excess snapshots
    this._pruneList(key);
  }
  
  /**
   * Get the most recent valid snapshot
   */
  getLatestSnapshot(key) {
    const list = this.snapshots.get(key);
    if (!list || list.length === 0) return null;
    
    // Return last valid, fresh snapshot
    for (let i = list.length - 1; i >= 0; i--) {
      const snap = list[i];
      if (snap.isValid && snap.isFresh(this.maxAgeMs)) {
        return snap;
      }
    }
    
    return null;
  }
  
  /**
   * Get all valid snapshots for a key (oldest to newest)
   */
  getSnapshots(key, onlyFresh = true) {
    const list = this.snapshots.get(key);
    if (!list) return [];
    
    if (onlyFresh) {
      return list.filter(s => s.isValid && s.isFresh(this.maxAgeMs));
    }
    return list.filter(s => s.isValid);
  }
  
  /**
   * Restore from a snapshot
   */
  restoreSnapshot(key, target, index = -1) {
    const list = this.snapshots.get(key);
    if (!list || list.length === 0) return 0;
    
    // Get snapshot at index (default: last)
    const snapshot = index >= 0 ? list[index] : list[list.length - 1];
    if (!snapshot) return 0;
    
    const restored = snapshot.applyTo(target);
    if (restored > 0) {
      this.stats.totalRestores++;
    }
    return restored;
  }
  
  /**
   * Internal: Prune old/excess snapshots
   */
  _pruneList(key) {
    const list = this.snapshots.get(key);
    if (!list) return;
    
    const now = performance.now();
    
    // Remove invalid and expired snapshots
    for (let i = list.length - 1; i >= 0; i--) {
      const snap = list[i];
      if (!snap.isValid || (now - snap.timestamp) > this.maxAgeMs) {
        list.splice(i, 1);
        this.stats.totalPrunes++;
      }
    }
    
    // Keep only maxSnapshotsPerNode most recent
    while (list.length > this.maxSnapshotsPerNode) {
      list.shift();
      this.stats.totalPrunes++;
    }
    
    // Clean up empty lists
    if (list.length === 0) {
      this.snapshots.delete(key);
    }
  }
  
  /**
   * Clear all snapshots
   */
  clear() {
    this.snapshots.clear();
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalKeys: this.snapshots.size,
      poolSize: Array.from(this.snapshots.values()).reduce((sum, arr) => sum + arr.length, 0)
    };
  }
}
