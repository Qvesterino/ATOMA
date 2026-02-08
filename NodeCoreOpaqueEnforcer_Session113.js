/**
 * ============================================================================
 * NODE CORE OPAQUE ENFORCER (Session 113)
 * ============================================================================
 * 
 * CRITICAL RULE: Node cores are SACRED and ALWAYS opaque.
 * Only auras, shells, and effects may use transparency.
 * 
 * ARCHITECTURE:
 * 1. Separate rendering layers: core, aura, effects
 * 2. Core meshes have dedicated materials with opacity=1.0
 * 3. Core materials use transparent=false
 * 4. Auras are separate meshes with their own transparent materials
 * 5. Debug logging tracks any opacity changes
 * 
 * ENFORCEMENT:
 * - Per-frame validation in update loop
 * - Block any attempt to reduce core opacity
 * - Report violations with clear error messages
 * - Maintain material immutability for cores
 */

import * as THREE from 'three';

export class NodeCoreOpaqueEnforcer {
  constructor() {
    this.enabled = true;
    this.trackedNodes = new Map();
    this.violations = [];
    
    // SHADER STORM PROTECTION: Check for disable flag
    if (typeof window !== 'undefined' && window.ATOMA_DISABLE_OPAQUE_ENFORCER) {
      this.enabled = false;
      console.log('[ATOMA] NodeCoreOpaqueEnforcer disabled (shader storm protection)');
    } else {
      console.log('[NODE CORE OPAQUE ENFORCER] Initialized');
    }
  }

  /**
   * Register a node for core opacity tracking
   * Call immediately after node creation
   */
  registerNode(nodeGroup, coreGeometry = null) {
    if (!nodeGroup) return;

    const nodeId = nodeGroup.uuid || nodeGroup.id;
    
    // Find core meshes
    const coreMeshes = [];
    nodeGroup.traverse((child) => {
      if (!child.isMesh) return;
      
      // Identify core geometry
      const isCore = 
        child.userData?.visualLayer === 'CORE' ||
        child.userData?.isNodeCore === true ||
        child.geometry === coreGeometry ||
        (child.name && child.name.includes('body'));
      
      if (isCore && !child.userData?.isAura && !child.userData?.isEffect) {
        coreMeshes.push(child);
      }
    });

    if (coreMeshes.length === 0) {
      console.warn(`[NODE CORE OPAQUE ENFORCER] No core meshes found for node ${nodeId}`);
      return;
    }

    // Store original material state
    const originalStates = [];
    for (const mesh of coreMeshes) {
      if (!mesh.material) continue;
      
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of materials) {
        originalStates.push({
          mesh: mesh,
          material: mat,
          transparent: mat.transparent,
          opacity: mat.opacity,
          depthWrite: mat.depthWrite,
          depthTest: mat.depthTest
        });
      }
    }

    // Register node
    this.trackedNodes.set(nodeId, {
      nodeGroup: nodeGroup,
      coreMeshes: coreMeshes,
      originalStates: originalStates,
      createdAt: Date.now(),
      violationCount: 0
    });

    // Force opaque immediately
    this._enforceOpaqueOnNode(nodeId);

    console.log(`[NODE CORE OPAQUE ENFORCER] Registered node ${nodeId} with ${coreMeshes.length} core meshes`);
  }

  /**
   * Enforce opaque state on a tracked node
   */
  _enforceOpaqueOnNode(nodeId) {
    const record = this.trackedNodes.get(nodeId);
    if (!record) return;

    for (const mesh of record.coreMeshes) {
      if (!mesh.material) continue;

      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of materials) {
        // ENFORCE OPAQUE STATE
        mat.transparent = false;
        mat.opacity = 1.0;
        mat.depthWrite = true;
        mat.depthTest = true;
        mat.needsUpdate = true;
      }
    }
  }

  /**
   * Per-frame validation - detect and block violations
   * 
   * SHADER STORM PROTECTION: Disabled if window.ATOMA_DISABLE_OPAQUE_ENFORCER is true
   * to prevent runtime material mutations that cause shader recompilation.
   */
  validateFrame(deltaTime, time) {
    // SHADER STORM PROTECTION: Early return if disabled
    if (typeof window !== 'undefined' && window.ATOMA_DISABLE_OPAQUE_ENFORCER) {
      return 0;
    }
    
    if (!this.enabled) return 0;

    let violations = 0;

    for (const [nodeId, record] of this.trackedNodes) {
      // Skip if node is removed from scene
      if (!record.nodeGroup || !record.nodeGroup.parent) {
        this.trackedNodes.delete(nodeId);
        continue;
      }

      // Check each core mesh
      for (const mesh of record.coreMeshes) {
        if (!mesh.material) continue;

        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of materials) {
          let violated = false;

          // CHECK: transparent flag
          if (mat.transparent !== false) {
            console.error(
              `[NODE CORE OPAQUE ENFORCER] VIOLATION: Node ${nodeId} core material transparent=${mat.transparent} (should be false)`
            );
            mat.transparent = false;
            violated = true;
            violations++;
          }

          // CHECK: opacity value
          if (Math.abs(mat.opacity - 1.0) > 0.001) {
            console.error(
              `[NODE CORE OPAQUE ENFORCER] VIOLATION: Node ${nodeId} core material opacity=${mat.opacity} (should be 1.0)`
            );
            mat.opacity = 1.0;
            violated = true;
            violations++;
          }

          // CHECK: depthWrite
          if (mat.depthWrite !== true) {
            console.error(
              `[NODE CORE OPAQUE ENFORCER] VIOLATION: Node ${nodeId} core material depthWrite=${mat.depthWrite} (should be true)`
            );
            mat.depthWrite = true;
            violated = true;
            violations++;
          }

          // CHECK: depthTest
          if (mat.depthTest !== true) {
            console.error(
              `[NODE CORE OPAQUE ENFORCER] VIOLATION: Node ${nodeId} core material depthTest=${mat.depthTest} (should be true)`
            );
            mat.depthTest = true;
            violated = true;
            violations++;
          }

          if (violated) {
            mat.needsUpdate = true;
            record.violationCount++;
          }
        }
      }
    }

    if (violations > 0) {
      console.warn(`[NODE CORE OPAQUE ENFORCER] Frame violations detected: ${violations}`);
    }

    return violations;
  }

  /**
   * Debug: Log current state of all tracked nodes
   */
  debugReport() {
    console.log('\n========== NODE CORE OPAQUE ENFORCER DEBUG REPORT ==========');
    console.log(`Tracked nodes: ${this.trackedNodes.size}`);

    for (const [nodeId, record] of this.trackedNodes) {
      console.log(`\n[NODE] ${nodeId}`);
      console.log(`  Core meshes: ${record.coreMeshes.length}`);
      console.log(`  Violations: ${record.violationCount}`);

      for (let i = 0; i < record.coreMeshes.length; i++) {
        const mesh = record.coreMeshes[i];
        if (!mesh.material) continue;

        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (let j = 0; j < materials.length; j++) {
          const mat = materials[j];
          const status = 
            mat.transparent === false && 
            Math.abs(mat.opacity - 1.0) < 0.001 &&
            mat.depthWrite === true &&
            mat.depthTest === true
              ? '✓ OK'
              : '✗ FAIL';

          console.log(`  [MESH ${i}.MAT ${j}] ${status}`);
          console.log(`    transparent: ${mat.transparent}`);
          console.log(`    opacity: ${mat.opacity}`);
          console.log(`    depthWrite: ${mat.depthWrite}`);
          console.log(`    depthTest: ${mat.depthTest}`);
        }
      }
    }
    console.log('=========================================================\n');
  }

  /**
   * Get statistics
   */
  getStats() {
    let totalViolations = 0;
    for (const record of this.trackedNodes.values()) {
      totalViolations += record.violationCount;
    }

    return {
      enabled: this.enabled,
      trackedNodes: this.trackedNodes.size,
      totalViolations: totalViolations
    };
  }

  /**
   * Enable/disable enforcement
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`[NODE CORE OPAQUE ENFORCER] ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }
}

/**
 * Global instance
 */
export const globalNodeCoreOpaqueEnforcer = new NodeCoreOpaqueEnforcer();

/**
 * Console API for debugging
 */
export function setupNodeCoreOpaqueDebugAPI() {
  window.NodeCoreOpaqueDebug = {
    enable() {
      globalNodeCoreOpaqueEnforcer.setEnabled(true);
    },
    disable() {
      globalNodeCoreOpaqueEnforcer.setEnabled(false);
    },
    report() {
      globalNodeCoreOpaqueEnforcer.debugReport();
    },
    stats() {
      return globalNodeCoreOpaqueEnforcer.getStats();
    }
  };

  console.log('🔒 Node Core Opaque Debug API ready: window.NodeCoreOpaqueDebug');
}
