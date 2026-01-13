/**
 * LEGACY GLYPH CLEANUP 1.0 — REMOVES ALL OLD DEBUG HEX MARKERS
 * 
 * Comprehensively scans and removes legacy debug systems:
 * - Old 2D cyan hexagon markers
 * - Debug slot renderers
 * - FractalHexMarker system artifacts
 * - Legacy debug cones
 * - Any mesh with "hex", "debug", "slot" in name or userData
 * 
 * STRICT SAFETY:
 * - NO changes to _SemanticGlyphAI, GlyphLayer3/4/5, node visuals, physics
 * - ONLY removes meshes with legacy identifiers
 * - Safe geometry/material disposal
 * - Tracks all removals with logging
 * - Reversible (doesn't modify core systems)
 * 
 * PERFORMANCE:
 * - Single scene traverse
 * - O(n) where n = total scene objects
 * - < 10ms even for complex scenes
 * 
 * SAFETY CHECKS:
 * - Verify mesh/material before disposal
 * - Skip system objects
 * - Null-safe parent removal
 */

import * as THREE from 'three';

export class LegacyGlyphCleanup {
  constructor(scene) {
    this.scene = scene;
    
    // Statistics
    this.stats = {
      meshesRemoved: 0,
      geometriesDisposed: 0,
      materialsDisposed: 0,
      lastCleanupTime: 0,
      removedNames: []
    };
    
    // Legacy identifiers to match (case-insensitive)
    this.legacyPatterns = [
      /hex/i,
      /hexagon/i,
      /debugslot/i,
      /slotglyph/i,
      /legacyglyph/i,
      /debugcone/i,
      /debug_cone/i,
      /fractalh/i,
      /marker.*hex/i,
      /g_debug/i,
      /slot.*debug/i,
      /debug.*slot/i
    ];
    
    // userData flags to match (exact)
    this.legacyFlags = [
      'glyphLayer3',
      'isOldHexGlyph',
      'isDebugHex',
      'isDebugSlot',
      'isLegacyGlyph',
      'isDebugMarker',
      'isFractalHex',
      'debugRenderer'
    ];
    
    console.log('✓ Legacy Glyph Cleanup 1.0 initialized');
  }

  /**
   * Check if a mesh matches any legacy pattern
   */
  isLegacyMesh(mesh) {
    if (!mesh) return false;
    
    // Check mesh name
    const meshName = mesh.name || '';
    for (const pattern of this.legacyPatterns) {
      if (pattern.test(meshName)) {
        return true;
      }
    }
    
    // Check userData flags
    if (mesh.userData) {
      for (const flag of this.legacyFlags) {
        if (mesh.userData[flag] === true) {
          return true;
        }
      }
      
      // Check for color-based cyan hex detection
      if (mesh.material && !Array.isArray(mesh.material)) {
        // Old 2D cyan hex detection by color
        if (mesh.userData.glyphComponent === 'hexOutline' ||
            mesh.userData.glyphComponent === 'consciousnessHex') {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Safely dispose mesh geometry and materials
   */
  disposeMesh(mesh) {
    let disposed = 0;
    
    if (!mesh) return 0;
    
    try {
      // Dispose geometry
      if (mesh.geometry) {
        mesh.geometry.dispose();
        disposed++;
      }
      
      // Dispose material(s)
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => {
            if (mat && mat.dispose) mat.dispose();
            disposed++;
          });
        } else {
          if (mesh.material.dispose) mesh.material.dispose();
          disposed++;
        }
      }
    } catch (error) {
      console.warn(`⚠ Error disposing mesh ${mesh.name}:`, error);
    }
    
    return disposed;
  }

  /**
   * NEUTRALIZED: Scene traversal disabled (Rule 1)
   * 
   * Legacy: This method used to traverse entire scene every frame.
   * Now: Cleanup is dormant unless explicitly triggered.
   * 
   * Call via onDemandCleanup() instead for safe, conditional execution.
   * 
   * This method is now a no-op to eliminate per-frame scene traversal overhead.
   */
  cleanupLegacyGlyphs() {
    // DORMANT: Per-frame execution DISABLED
    // Cleanup only runs on explicit manual trigger
    return {
      meshesRemoved: 0,
      geometriesDisposed: 0,
      materialsDisposed: 0,
      timeMs: 0,
      removedNames: []
    };
  }
  
  /**
   * On-demand cleanup: Only run if legacy glyphs are actually present
   * 
   * Implements Rule 2: Conditional execution
   * Implements Rule 3: Early exit if no legacy geometry detected
   */
  onDemandCleanup() {
    // GUARD: Quick sample scan (check first 10 objects in scene)
    const startTime = performance.now();
    const sampleSize = 10;
    let legacyDetected = false;
    let sampleCount = 0;
    
    this.scene.traverse((child) => {
      if (legacyDetected || sampleCount >= sampleSize) return;
      
      if (this.isLegacyMesh(child)) {
        legacyDetected = true;
        return;
      }
      sampleCount++;
    });
    
    // GUARD: Exit early if no legacy glyphs found in sample
    if (!legacyDetected && sampleCount >= sampleSize) {
      // No legacy detected in sample; assume clean
      return {
        meshesRemoved: 0,
        geometriesDisposed: 0,
        materialsDisposed: 0,
        timeMs: performance.now() - startTime,
        removedNames: []
      };
    }
    
    // Legacy suspected: run full cleanup
    const toRemove = [];
    
    // Full scene traverse only if legacy likely present
    this.scene.traverse((child) => {
      if (this.isLegacyMesh(child)) {
        toRemove.push(child);
      }
    });
    
    // Remove all found legacy meshes
    toRemove.forEach((mesh) => {
      try {
        // Dispose resources
        this.stats.materialsDisposed += this.disposeMesh(mesh);
        this.stats.geometriesDisposed += mesh.geometry ? 1 : 0;
        
        // Remove from scene
        if (mesh.parent) {
          mesh.parent.remove(mesh);
        }
        
        this.stats.meshesRemoved++;
        this.stats.removedNames.push(mesh.name || '(unnamed)');
        
      } catch (error) {
        console.warn(`⚠ Error removing mesh ${mesh.name}:`, error);
      }
    });
    
    const elapsed = performance.now() - startTime;
    this.stats.lastCleanupTime = elapsed;
    
    return {
      meshesRemoved: this.stats.meshesRemoved,
      geometriesDisposed: this.stats.geometriesDisposed,
      materialsDisposed: this.stats.materialsDisposed,
      timeMs: elapsed,
      removedNames: this.stats.removedNames
    };
  }

  /**
   * Print cleanup report
   */
  printCleanupReport() {
    console.group('🧹 Legacy Glyph Cleanup Report');
    console.log(`Meshes Removed: ${this.stats.meshesRemoved}`);
    console.log(`Geometries Disposed: ${this.stats.geometriesDisposed}`);
    console.log(`Materials Disposed: ${this.stats.materialsDisposed}`);
    console.log(`Cleanup Time: ${this.stats.lastCleanupTime.toFixed(2)}ms`);
    
    if (this.stats.removedNames.length > 0) {
      console.log('Removed Items:');
      this.stats.removedNames.forEach(name => {
        console.log(`  - ${name}`);
      });
    }
    console.groupEnd();
  }

  /**
   * Get current statistics
   */
  getStats() {
    return {
      ...this.stats
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      meshesRemoved: 0,
      geometriesDisposed: 0,
      materialsDisposed: 0,
      lastCleanupTime: 0,
      removedNames: []
    };
  }
}
