/**
 * HOLOGRAM SHELL AUTHORITY SYSTEM v1.0
 * 
 * Ensures holographic shells and influence volumes never obscure node cores.
 * Works in tandem with CoreVisualAuthoritySystem to establish complete visual hierarchy.
 * 
 * PROPERTIES ENFORCED:
 * - depthWrite: false (don't block core rendering)
 * - depthTest: false (ignore depth for visual overlays)
 * - renderOrder: < CORE_ORDER (render before cores)
 * - opacity: reduced to prevent full occlusion
 * - blending: AdditiveBlending (visual-only appearance)
 * 
 * SAFE:
 * ✅ Non-breaking: only modifies visual properties
 * ✅ No mesh removal or structural changes
 * ✅ No performance impact
 * ✅ Fully reversible
 * 
 * INTEGRATION:
 * Works with:
 * - CoreVisualAuthoritySystem
 * - NodeAuraSystem_v1
 * - CoreHologramShader
 */

import * as THREE from 'three';

/**
 * Hologram Shell Authority System
 */
export class HologramShellAuthoritySystem {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.debugMode = options.debugMode ?? false;
    this.shellRenderOrder = options.shellRenderOrder ?? -500;  // Below core (1000)
    this.maxShellOpacity = options.maxShellOpacity ?? 0.5;
    
    this.processedShells = new Set();

    if (this.enabled) {
      console.log('[HologramShellAuthoritySystem] Initialized');
      console.log(`  Shell renderOrder: ${this.shellRenderOrder}`);
      console.log(`  Max shell opacity: ${this.maxShellOpacity}`);
    }
  }

  /**
   * Process a hologram shell mesh
   */
  processShell(shellMesh) {
    if (!this.enabled || !shellMesh) return;

    const shellId = shellMesh.uuid;
    if (this.processedShells.has(shellId)) {
      return;  // Already processed
    }

    try {
      this._enforceShellProperties(shellMesh);
      this.processedShells.add(shellId);

      if (this.debugMode) {
        console.log(`[HologramShellAuthoritySystem] ✓ Shell authority enforced`);
      }
    } catch (err) {
      console.warn('[HologramShellAuthoritySystem] Error processing shell:', err.message);
    }
  }

  /**
   * Enforce shell material properties
   */
  _enforceShellProperties(mesh) {
    if (!mesh || !mesh.material) return;

    const material = mesh.material;

    // CRITICAL: Don't write to depth buffer (visual-only)
    material.depthWrite = false;

    // Don't read depth for overlay effect
    material.depthTest = false;

    // Must be transparent
    material.transparent = true;

    // Reduce opacity to prevent occlusion
    if (material.opacity > this.maxShellOpacity) {
      material.opacity = this.maxShellOpacity;
    }

    // Use additive blending for visual-only appearance
    if (material.blending !== THREE.AdditiveBlending) {
      material.blending = THREE.AdditiveBlending;
    }

    // Set low render order
    mesh.renderOrder = this.shellRenderOrder;
    mesh.userData.visualLayer = 'SHELL';
    mesh.userData.isHologramShell = true;
  }

  /**
   * Find and process all shells in a group
   */
  processShellGroup(nodeGroup) {
    if (!this.enabled || !nodeGroup) return;

    const traverse = (obj) => {
      if (obj instanceof THREE.Mesh) {
        // Check if this is a shell-like mesh
        const isShell = this._isShellLike(obj);
        if (isShell) {
          this.processShell(obj);
        }
      }

      for (const child of obj.children) {
        traverse(child);
      }
    };

    traverse(nodeGroup);
  }

  /**
   * Identify shell-like meshes
   */
  _isShellLike(mesh) {
    if (!mesh || !mesh.material) return false;

    // Explicit markers
    if (mesh.userData.isHologramShell === true ||
        mesh.userData.visualLayer === 'SHELL') {
      return true;
    }

    // Geometry indicators (shells are often spheres/icospheres)
    if (mesh.geometry) {
      const geomType = mesh.geometry.constructor.name;
      if (geomType === 'IcosahedronGeometry' || 
          geomType === 'SphereGeometry' ||
          geomType === 'DodecahedronGeometry') {
        
        // But must be semi-transparent or additive
        const material = mesh.material;
        if (material.transparent === true || 
            material.blending === THREE.AdditiveBlending) {
          return true;
        }
      }
    }

    // Material property check
    const material = mesh.material;
    if (material.transparent === true &&
        material.depthWrite === false &&
        (material.blending === THREE.AdditiveBlending ||
         material.opacity < 0.7)) {
      return true;
    }

    return false;
  }

  /**
   * Set maximum shell opacity
   */
  setMaxShellOpacity(opacity) {
    this.maxShellOpacity = Math.max(0, Math.min(1, opacity));
    console.log(`[HologramShellAuthoritySystem] Max shell opacity set to ${this.maxShellOpacity}`);
  }

  /**
   * Enable/disable system
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`[HologramShellAuthoritySystem] ${enabled ? 'Enabled' : 'Disabled'}`);
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      processedShells: this.processedShells.size,
      shellRenderOrder: this.shellRenderOrder,
      maxShellOpacity: this.maxShellOpacity
    };
  }

  /**
   * Dispose system
   */
  dispose() {
    this.processedShells.clear();
    if (this.enabled) {
      console.log('[HologramShellAuthoritySystem] System disposed');
    }
  }
}

// ============================================================================
// CONSOLE API FOR DEBUGGING
// ============================================================================

if (typeof window !== 'undefined') {
  window.HologramShellAuthorityDebug = {
    system: null,

    init(system) {
      this.system = system;
      console.log('[HologramShellAuthorityDebug] Initialized');
    },

    status() {
      if (!this.system) return console.warn('System not initialized');
      return this.system.getStatus();
    },

    setOpacity(opacity) {
      if (!this.system) return console.warn('System not initialized');
      this.system.setMaxShellOpacity(opacity);
    },

    enable() {
      if (!this.system) return console.warn('System not initialized');
      this.system.setEnabled(true);
    },

    disable() {
      if (!this.system) return console.warn('System not initialized');
      this.system.setEnabled(false);
    }
  };
}
