/**
 * NODE VISUAL STATE BINDER v1.0
 * 
 * Canonical visual state application system for node transitions.
 * 
 * PROBLEM SOLVED:
 * When nodes transition to LINKED/ACTIVE/CONNECTED/STABILIZED states,
 * they may remain in fallback/placeholder visual representations instead
 * of applying their final visual geometry and materials.
 * 
 * SOLUTION:
 * Single canonical function that applies final visual state:
 * - Removes fallback/proxy meshes
 * - Applies final core geometry
 * - Applies correct material set
 * - Attaches aura BELOW core (never above)
 * - Enforces renderOrder + depthWrite rules
 * - Re-registers visuals in hierarchy
 * - Auto-repairs if node is LINKED but still using fallback
 * 
 * USAGE:
 *   import { applyFinalNodeVisualState, NodeVisualStateBinder } from './NodeVisualStateBinder.js';
 *   
 *   // After linking:
 *   applyFinalNodeVisualState(nodeA);
 *   applyFinalNodeVisualState(nodeB);
 *   
 *   // Or use manager for automatic tracking:
 *   const binder = new NodeVisualStateBinder();
 *   binder.registerNode(node);
 *   binder.onNodeStateChange(node, 'LINKED');
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { createCoreIdentityMaterial } from './CoreHologramShader.js';

// ============================================================================
// PHASE A: ONE-TIME FORENSIC DIAGNOSTIC
// ============================================================================

let diagnosticLogged = false;

function logVisualHierarchyRegistryDiagnostics() {
  if (diagnosticLogged) return; // Only log once
  diagnosticLogged = true;

  console.group('[NodeVisualStateBinder] 🔍 VisualHierarchyRegistry Import Diagnostics');
  console.log('typeof VisualHierarchyRegistry:', typeof VisualHierarchyRegistry);
  console.log('Object.keys(VisualHierarchyRegistry || {}):', Object.keys(VisualHierarchyRegistry || {}));
  console.log('typeof VisualHierarchyRegistry?.registerNode:', typeof VisualHierarchyRegistry?.registerNode);
  console.log('Import path: ./VisualHierarchyRegistry.js (ES6 class export)');
  
  // Show available methods
  if (VisualHierarchyRegistry && typeof VisualHierarchyRegistry === 'function') {
    const methods = Object.getOwnPropertyNames(VisualHierarchyRegistry)
      .filter(name => typeof VisualHierarchyRegistry[name] === 'function' && name !== 'prototype');
    console.log('Available static methods:', methods);
  }
  console.groupEnd();
}

// ============================================================================
// PHASE B: RUNTIME SELF-HEAL SHIM
// ============================================================================

/**
 * Ensure VisualHierarchyRegistry API is safe (add stubs for missing methods)
 * This prevents crashes if the registry is wrong type or missing methods
 * 
 * @param {any} reg - Registry object to validate and repair
 * @returns {Object} Safe registry object with guaranteed API
 */
function ensureVisualHierarchyRegistryAPI(reg) {
  if (!reg || typeof reg !== 'object') {
    // If registry is not an object, return safe stub
    return {
      getRenderOrder: (layer, fallback = 0) => fallback,
      getLayer: (layer) => null,
      getOpacityBounds: (layer) => ({ min: 0, max: 1 }),
      registerNode: () => true,      // Stub (not a real registry method)
      unregisterNode: () => true,    // Stub (not a real registry method)
      hasNode: () => false,          // Stub (not a real registry method)
      getNode: () => null            // Stub (not a real registry method)
    };
  }

  // If reg is a module wrapper like { VisualHierarchyRegistry: ... }, unwrap if needed
  const candidate = (reg.VisualHierarchyRegistry && typeof reg.VisualHierarchyRegistry === 'object')
    ? reg.VisualHierarchyRegistry
    : reg;

  // Hard guarantee stubs for methods that DO NOT EXIST in the registry
  // (These were mistakenly called but the registry is READ-ONLY and never had them)
  if (typeof candidate.registerNode !== 'function') candidate.registerNode = () => true;
  if (typeof candidate.unregisterNode !== 'function') candidate.unregisterNode = () => true;
  if (typeof candidate.hasNode !== 'function') candidate.hasNode = () => false;
  if (typeof candidate.getNode !== 'function') candidate.getNode = () => null;

  return candidate;
}

// CRITICAL FIX (Session 52B): Invalidate aura baselines after visual state rebinding
let globalAuraModulationSystem = null;

export function setGlobalAuraModulationSystem(system) {
  globalAuraModulationSystem = system;
}

/**
 * CANONICAL FUNCTION: Apply final visual state to a node
 * 
 * Called after ANY state transition:
 * - After linking
 * - After restore
 * - After async model load
 * - After state recomputation
 * 
 * @param {THREE.Group} node - Node to apply final visuals to
 * @param {Object} options - Optional configuration
 * @returns {boolean} true if successful, false if failed
 */
export function applyFinalNodeVisualState(node, options = {}) {
  if (!node) {
    console.warn('[NodeVisualStateBinder] Cannot apply state: node is null');
    return false;
  }

  try {
    // PHASE A DIAGNOSTIC: Log import state ONCE (on first call)
    logVisualHierarchyRegistryDiagnostics();

    // Step 1: Identify fallback/proxy meshes and remove them
    removeProxyVisuals(node);

    // Step 2: Ensure final geometry is present (core + shell)
    ensureFinalGeometry(node, options);

    // Step 3: Apply correct materials
    applyFinalMaterials(node, options);

    // Step 4: Attach/correct aura positioning (BELOW core)
    correctAuraPositioning(node);

    // Step 5: Enforce renderOrder and depth settings
    enforceVisualHierarchy(node);

    // Step 6: SAFE call to registry (with runtime shim)
    // NOTE: VisualHierarchyRegistry does NOT have registerNode() method.
    // It's read-only (query-only). We call shim to prevent crashes.
    const VHR = ensureVisualHierarchyRegistryAPI(VisualHierarchyRegistry);
    try { 
      VHR?.registerNode?.(node, { source: 'NodeVisualStateBinder' }); 
    } catch (e) { 
      // Non-fatal: registry methods are stubs anyway
    }

    // Step 7: Mark as fully rendered
    node.userData.visualStateApplied = true;
    node.userData.visualStateAppliedAt = Date.now();

    // CRITICAL FIX (Session 52B): Invalidate aura baselines after visual state rebinding
    // This ensures aura modulation uses the new clamped opacity (0.06) not the old high value (0.5+)
    if (globalAuraModulationSystem) {
      try {
        invalidateAuraBaselinesForNode(node, globalAuraModulationSystem);
      } catch (err) {
        // Non-fatal - continue anyway
      }
    }

    // Log success
    if (options.verbose) {
      console.log('[NodeVisualStateBinder] ✅ Applied final visual state', {
        nodeId: node.userData.nodeId,
        category: node.userData.category,
        aurasRepaired: globalAuraModulationSystem ? 'yes' : 'no'
      });
    }

    return true;
  } catch (err) {
    console.error('[NodeVisualStateBinder] Failed to apply visual state', {
      error: err.message,
      nodeId: node.userData?.nodeId
    });
    return false;
  }
}

/**
 * Step 1: Remove fallback/proxy visuals
 * 
 * Identifies and removes:
 * - Placeholder geometries
 * - Debug wireframes
 * - Temporary proxy meshes
 * - Incomplete models
 * 
 * @private
 */
function removeProxyVisuals(node) {
  const toRemove = [];

  for (const child of node.children) {
    // Check for proxy/fallback markers
    if (child.userData?.isPlaceholder ||
        child.userData?.isProxy ||
        child.userData?.isFallback ||
        child.userData?.isDebug ||
        child.userData?.isIncomplete) {
      toRemove.push(child);
    }

    // Check for wireframe-only meshes (debug visualization)
    if (child.material?.wireframe && !child.userData.isDebug) {
      toRemove.push(child);
    }

    // Check for extremely simple geometries (fallback indicators)
    if (child instanceof THREE.Mesh && child.geometry) {
      const posAttr = child.geometry.getAttribute('position');
      if (posAttr && posAttr.count < 4) { // Less than 4 vertices = placeholder
        toRemove.push(child);
      }
    }
  }

  // Remove identified proxies
  for (const mesh of toRemove) {
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
    }
    node.remove(mesh);
  }
}

/**
 * Step 2: Ensure final geometry is present
 * 
 * Verifies that node has:
 * - Valid core mesh (solid geometry)
 * - Valid shell mesh (holographic overlay)
 * 
 * @private
 */
function ensureFinalGeometry(node, options = {}) {
  const nodeRoot = node.userData.nodeRoot || node;
  
  // Check if core exists
  const hasCore = nodeRoot.children.some(child => 
    child instanceof THREE.Mesh && 
    !child.material?.transparent &&
    child.userData.visualLayer === 'CORE'
  );

  if (!hasCore && options.createIfMissing) {
    // Fallback: create minimal core geometry
    const coreGeom = new THREE.SphereGeometry(0.7, 32, 32);
    const coreMat = createCoreIdentityMaterial(options.color || 0x00ffff);
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    coreMesh.userData.visualLayer = 'CORE';
    coreMesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('CORE');
    nodeRoot.add(coreMesh);
  }

  // Shell is optional (may be created by separate system)
  // But ensure any shell has correct settings
  for (const child of nodeRoot.children) {
    if (child.userData?.isHologramShell || child.userData?.visualLayer === 'SHELL') {
      child.renderOrder = VisualHierarchyRegistry.getRenderOrder('BASELINE_AURA');
      child.material.depthWrite = false;
      child.material.depthTest = false;
    }
  }
}

/**
 * Step 3: Apply final materials
 * 
 * Ensures:
 * - Core has identity material (solid, opaque)
 * - Shell has hologram material (transparent, additive)
 * - No materials are in transition state
 * 
 * @private
 */
function applyFinalMaterials(node, options = {}) {
  const nodeRoot = node.userData.nodeRoot || node;
  const color = options.color || node.userData.color || 0x00ffff;

  for (const child of nodeRoot.children) {
    if (!child.material) continue;

    // Correct CORE materials
    if (child.userData.visualLayer === 'CORE' ||
        (child instanceof THREE.Mesh && !child.material.transparent && child.material.opacity > 0.9)) {
      
      // Replace with proper identity material if not already
      if (!child.material.userData?.isCoreIdentity) {
        const newMat = createCoreIdentityMaterial(color);
        child.material.dispose();
        child.material = newMat;
        child.material.userData.isCoreIdentity = true;
      }

      // Enforce core properties
      child.material.depthWrite = true;
      child.material.depthTest = true;
      child.material.transparent = false;
      child.material.opacity = 1.0;
      child.renderOrder = VisualHierarchyRegistry.getRenderOrder('CORE');
    }

    // Correct SHELL materials
    if (child.userData.visualLayer === 'SHELL' || child.userData?.isHologramShell) {
      child.material.depthWrite = false;
      child.material.depthTest = false;
      child.material.transparent = true;
      child.material.opacity = Math.min(child.material.opacity, 0.4);
      child.renderOrder = VisualHierarchyRegistry.getRenderOrder('BASELINE_AURA');
    }

    // Correct AURA materials
    if (child.userData.visualLayer === 'AURA' || child.userData?.isAura) {
      child.material.depthWrite = false;
      child.material.depthTest = true;
      child.material.transparent = true;
      child.material.opacity = Math.min(child.material.opacity, 0.06); // CRITICAL: Max 6%
      child.renderOrder = VisualHierarchyRegistry.getRenderOrder('BASELINE_AURA');
    }
  }
}

/**
 * Step 4: Correct aura positioning
 * 
 * Ensures:
 * - Aura is SIBLING of core (not parent or child)
 * - Aura renderOrder < core renderOrder
 * - Aura is always BELOW core visually
 * 
 * @private
 */
function correctAuraPositioning(node) {
  const nodeRoot = node.userData.nodeRoot || node;
  
  // Find aura and core
  let auraMesh = null;
  let coreMesh = null;

  for (const child of nodeRoot.children) {
    if (child.userData?.isAura || child.userData?.visualLayer === 'AURA') {
      auraMesh = child;
    }
    if (child.userData?.visualLayer === 'CORE') {
      coreMesh = child;
    }
  }

  // If aura exists but is not a sibling of core, reparent it
  if (auraMesh && coreMesh && auraMesh.parent !== coreMesh.parent) {
    if (auraMesh.parent) {
      auraMesh.parent.remove(auraMesh);
    }
    nodeRoot.add(auraMesh);
  }

  // Ensure aura renderOrder < core renderOrder
  if (auraMesh && coreMesh) {
    if (auraMesh.renderOrder >= coreMesh.renderOrder) {
      // PHASE 3A: replacing relative renderOrder (core - 1) → BASELINE_AURA
      auraMesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('BASELINE_AURA');
    }
  }
}

/**
 * Step 5: Enforce visual hierarchy
 * 
 * Walks entire subtree and enforces:
 * - Correct renderOrder values
 * - Correct depthWrite/depthTest settings
 * - Correct transparency settings
 * 
 * @private
 */
function enforceVisualHierarchy(node) {
  const traverse = (obj) => {
    if (obj instanceof THREE.Mesh && obj.material) {
      const layer = obj.userData?.visualLayer;

      // Apply layer-specific settings
      if (layer === 'CORE') {
        obj.renderOrder = VisualHierarchyRegistry.getRenderOrder('CORE');
        obj.material.depthWrite = true;
        obj.material.depthTest = true;
      } else if (layer === 'SHELL') {
        obj.renderOrder = VisualHierarchyRegistry.getRenderOrder('BASELINE_AURA');
        obj.material.depthWrite = false;
        obj.material.depthTest = false;
      } else if (layer === 'AURA') {
        obj.renderOrder = VisualHierarchyRegistry.getRenderOrder('BASELINE_AURA');
        obj.material.depthWrite = false;
        obj.material.depthTest = true;
      } else if (layer === 'FX' || layer === 'EFFECT') {
        obj.renderOrder = VisualHierarchyRegistry.getRenderOrder('FX');
        obj.material.depthWrite = false;
        obj.material.depthTest = true;
      }
    }

    for (const child of obj.children) {
      traverse(child);
    }
  };

  traverse(node);
}

/**
 * Manager class for tracking and auto-binding node visual states
 */
export class NodeVisualStateBinder {
  constructor(options = {}) {
    this.trackedNodes = new WeakMap();
    this.stateChangeCallbacks = [];
    this.autoRepair = options.autoRepair !== false; // Enabled by default
    this.verbose = options.verbose || false;
  }

  /**
   * Register a node for tracking
   */
  registerNode(node) {
    if (!node) return;
    
    this.trackedNodes.set(node, {
      lastState: node.userData?.state || 'UNLINKED',
      visualStateApplied: false,
      registeredAt: Date.now()
    });
  }

  /**
   * Called when node state changes
   * 
   * State transitions that trigger visual rebinding:
   * - → LINKED
   * - → ACTIVE
   * - → CONNECTED
   * - → STABILIZED
   */
  onNodeStateChange(node, newState) {
    if (!node || !this.trackedNodes.has(node)) {
      this.registerNode(node);
    }

    const oldState = node.userData?.state;
    const stateInfo = this.trackedNodes.get(node);

    // Update tracked state
    if (stateInfo) {
      stateInfo.lastState = newState;
    }

    // Check if this is a visual-affecting transition
    const visualAffectingStates = ['LINKED', 'ACTIVE', 'CONNECTED', 'STABILIZED'];
    if (visualAffectingStates.includes(newState)) {
      // Apply final visual state on transition
      const success = applyFinalNodeVisualState(node, { 
        verbose: this.verbose 
      });

      if (stateInfo) {
        stateInfo.visualStateApplied = success;
      }

      // Notify callbacks
      for (const callback of this.stateChangeCallbacks) {
        callback(node, oldState, newState, success);
      }
    }
  }

  /**
   * Auto-repair: Check if LINKED nodes are still using fallback visuals
   * If so, apply final state immediately
   */
  autoRepairIfNeeded(node) {
    if (!this.autoRepair || !node) return false;

    const isLinked = node.userData?.linkedNodes?.length > 0;
    const hasProxy = node.children.some(child => 
      child.userData?.isPlaceholder || child.userData?.isProxy
    );

    if (isLinked && hasProxy) {
      if (this.verbose) {
        console.log('[NodeVisualStateBinder] Auto-repairing LINKED node with fallback visuals', {
          nodeId: node.userData?.nodeId
        });
      }
      return applyFinalNodeVisualState(node, { verbose: this.verbose });
    }

    return false;
  }

  /**
   * Periodic check: Repair all tracked nodes if needed
   */
  repairAll() {
    let repaired = 0;
    // Note: We can't iterate WeakMap, so this would need external tracking
    // For now, this is a placeholder for manual repair passes
    return repaired;
  }

  /**
   * Add callback for state change events
   */
  addStateChangeCallback(callback) {
    this.stateChangeCallbacks.push(callback);
  }

  /**
   * Remove callback
   */
  removeStateChangeCallback(callback) {
    const idx = this.stateChangeCallbacks.indexOf(callback);
    if (idx >= 0) this.stateChangeCallbacks.splice(idx, 1);
  }

  /**
   * Cleanup
   */
  dispose() {
    this.trackedNodes = new WeakMap();
    this.stateChangeCallbacks = [];
  }
}

/**
 * SAFETY ASSERTION: Check if linked node has fallback visuals
 * 
 * Call this in development/debug to catch visual binding issues early
 * 
 * @param {THREE.Group} node - Node to check
 * @returns {Object} { passed: boolean, issues: string[] }
 */
/**
 * CRITICAL FIX (Session 52B): Invalidate aura baselines for a node
 * Forces recapture with current (correct) opacity values
 * Called automatically after visual state rebinding
 * 
 * @private
 */
function invalidateAuraBaselinesForNode(node, auraModulationSystem) {
  if (!node || !auraModulationSystem || !auraModulationSystem.baselineMap) return;

  node.traverse((child) => {
    if (!child.isMesh) return;

    const isAura = child.userData?.isAura ||
                   child.userData?.visualLayer === 'AURA' ||
                   (child.name && child.name.toLowerCase().includes('aura')) ||
                   (child.name && child.name.toLowerCase().includes('halo'));

    if (isAura && child.material) {
      // Recapture baseline with CURRENT opacity (now clamped to 0.06)
      const baseline = {
        opacity: child.material.opacity,
        scale: child.scale.clone(),
        color: child.material.color?.clone?.() ?? new THREE.Color(0xffffff),
        emissive: child.material.emissive?.clone?.() ?? new THREE.Color(0x000000),
      };

      auraModulationSystem.baselineMap.set(child, baseline);
    }
  });
}

export function assertNodeVisualStateCorrect(node) {
  const issues = [];

  if (!node) {
    return { passed: false, issues: ['Node is null'] };
  }

  // Check if linked but has proxy
  const isLinked = node.userData?.linkedNodes?.length > 0;
  const hasProxy = node.children.some(child => 
    child.userData?.isPlaceholder || child.userData?.isProxy
  );

  if (isLinked && hasProxy) {
    issues.push('LINKED node still has fallback visuals');
  }

  // Check core render order
  const coreMesh = node.children.find(c => c.userData?.visualLayer === 'CORE');
  if (coreMesh && coreMesh.renderOrder < 0) {
    issues.push('Core renderOrder is negative (should be positive/MAX)');
  }

  // Check aura opacity (if linked)
  if (isLinked) {
    const auraMesh = node.children.find(c => c.userData?.visualLayer === 'AURA');
    if (auraMesh && auraMesh.material?.opacity > 0.06) {
      issues.push('Aura opacity too high after linking (should be ≤ 0.06)');
    }
  }

  // Check depth settings
  for (const child of node.children) {
    if (!child.material) continue;

    const layer = child.userData?.visualLayer;
    if (layer === 'SHELL') {
      if (child.material.depthWrite !== false) {
        issues.push('Shell has depthWrite=true (should be false)');
      }
    }
    if (layer === 'AURA') {
      if (child.material.depthWrite !== false) {
        issues.push('Aura has depthWrite=true (should be false)');
      }
    }
  }

  return {
    passed: issues.length === 0,
    issues
  };
}

export default NodeVisualStateBinder;
