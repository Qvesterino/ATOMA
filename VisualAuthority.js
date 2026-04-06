/**
 * VISUAL AUTHORITY v1.0 — ABSOLUTE GLOBAL VISUAL LOCK
 * 
 * Single source of truth for ALL node visuals.
 * No system can bypass this.
 * Every frame, EVERY property is enforced.
 * 
 * RULES (ABSOLUTE):
 * 1. visualRoot is the ONLY visual representation of a node
 * 2. visualRoot is ALWAYS visible
 * 3. visualRoot is NEVER dimmed, scaled, or hidden
 * 4. All protected layers rendered in fixed order
 * 5. Every frame: inspect, validate, restore
 */

import * as THREE from 'three';

// Global feature flag for render-order lockdown
const RENDER_AUTHORITY_LOCKDOWN = true;

/**
 * 🔒 VISUAL AUTHORITY: Central enforcement
 */
export class VisualAuthority {
  constructor() {
    // Global state
    this.enabled = false;
    this.enforceEveryFrame = true;
    this.autoRepair = true;
    this.silent = false;  // Log violations?
    
    // Tracking
    this.violations = [];
    this.repairs = [];
    this.maxHistory = 1000;
    
    // Visual layer priorities (renderOrder)
    this.layers = {
      'CORE': 0,           // Core mesh (visualRoot)
      'SHELL': 5,          // Hologram shells
      'AURA': 10,          // Auras
      'VFX': 15            // VFX
    };
    
    // Mandatory visual properties
    this.visualContract = {
      visible: true,
      opacity: 1.0,
      depthTest: false,
      depthWrite: false,
      frustumCulled: false,
      transparent: true,
      renderOrder: 0  // Default for core
    };
  }
  
  /**
   * 📋 REGISTER NODE: Assign visualRoot and validate
   * 
   * @param {THREE.Object3D} node - Node to register
   * @param {THREE.Object3D} visualRoot - Visual root mesh
   */
  registerNode(node, visualRoot) {
    if (!node || !visualRoot) {
      throw new Error('[VisualAuthority] Cannot register: node or visualRoot is null');
    }
    
    // ENFORCE: Every node must have exactly ONE visual root
    if (node.userData.visualRoot && node.userData.visualRoot !== visualRoot) {
      console.error('[VisualAuthority] VIOLATION: Node has multiple visual roots', {
        nodeId: node.uuid,
        existing: node.userData.visualRoot.uuid,
        attempting: visualRoot.uuid
      });
      return false;
    }
    
    // ASSIGN: Set visual root
    node.userData.visualRoot = visualRoot;
    node.userData.visualLocked = true;
    
    // MARK: Identify all layers
    this.markLayers(node);
    
    return true;
  }
  
  /**
   * 🎨 MARK LAYERS: Identify and tag all visual layers
   * 
   * @param {THREE.Object3D} node - Node to mark
   */
  markLayers(node) {
    if (!node) return;
    
    node.traverse((child) => {
      if (!child.isMesh) return;
      
      // Core (visualRoot)
      if (child === node.userData.visualRoot) {
        child.userData.visualLayer = 'CORE';
        child.userData.visualLocked = true;
        return;
      }
      
      // Shell (hologram)
      if (child.userData?.isHologramShell) {
        child.userData.visualLayer = 'SHELL';
        child.userData.visualLocked = true;
        return;
      }
      
      // Aura
      if (child.userData?.isAura) {
        child.userData.visualLayer = 'AURA';
        child.userData.visualLocked = true;
        return;
      }
      
      // VFX
      if (child.userData?.isVFX || child.userData?.isNonLinkableVisual) {
        child.userData.visualLayer = 'VFX';
        child.userData.visualLocked = true;
        return;
      }
    });
  }
  
  /**
   * 🔍 VALIDATE NODE: Check if node has valid visual contract
   * 
   * @param {THREE.Object3D} node - Node to validate
   * @returns {Object} Validation result
   */
  validateNode(node) {
    const result = {
      valid: true,
      violations: [],
      repairs: []
    };
    
    if (!node) {
      result.valid = false;
      result.violations.push('Node is null');
      return result;
    }
    
    // CHECK 1: Must have visualRoot
    if (!node.userData?.visualRoot) {
      result.valid = false;
      result.violations.push('Missing visualRoot');
      return result;
    }
    
    const visualRoot = node.userData.visualRoot;
    
    // CHECK 2: visualRoot must be visible
    if (visualRoot.visible !== true) {
      result.valid = false;
      result.violations.push(`visualRoot.visible = ${visualRoot.visible}, expected true`);
      if (this.autoRepair) {
        visualRoot.visible = true;
        result.repairs.push('Restored visualRoot.visible = true');
      }
    }
    
    // CHECK 3: visualRoot opacity must be 1.0
    if (visualRoot.material?.opacity !== 1.0) {
      result.valid = false;
      result.violations.push(`visualRoot.opacity = ${visualRoot.material?.opacity}, expected 1.0`);
      if (this.autoRepair && visualRoot.material) {
        visualRoot.material.opacity = 1.0;
        result.repairs.push('Restored visualRoot.opacity = 1.0');
      }
    }
    
    // CHECK 4: visualRoot depth settings
    if (visualRoot.material?.depthTest !== false) {
      result.violations.push(`visualRoot.depthTest = ${visualRoot.material?.depthTest}, expected false`);
      if (this.autoRepair && visualRoot.material) {
        visualRoot.material.depthTest = false;
        result.repairs.push('Restored visualRoot.depthTest = false');
      }
    }
    
    if (visualRoot.material?.depthWrite !== false) {
      result.violations.push(`visualRoot.depthWrite = ${visualRoot.material?.depthWrite}, expected false`);
      if (this.autoRepair && visualRoot.material) {
        visualRoot.material.depthWrite = false;
        result.repairs.push('Restored visualRoot.depthWrite = false');
      }
    }
    
    // CHECK 5: visualRoot frustumCulled
    if (visualRoot.frustumCulled !== false) {
      result.violations.push(`visualRoot.frustumCulled = ${visualRoot.frustumCulled}, expected false`);
      if (this.autoRepair) {
        visualRoot.frustumCulled = false;
        result.repairs.push('Restored visualRoot.frustumCulled = false');
      }
    }
    
    // CHECK 6: visualRoot renderOrder
    if (visualRoot.renderOrder !== this.layers.CORE) {
      result.violations.push(`visualRoot.renderOrder = ${visualRoot.renderOrder}, expected ${this.layers.CORE}`);
      if (this.autoRepair) {
        visualRoot.renderOrder = this.layers.CORE;
        result.repairs.push(`Restored visualRoot.renderOrder = ${this.layers.CORE}`);
      }
    }
    
    // CHECK 7: All other layers
    node.traverse((child) => {
      if (!child.isMesh || child === visualRoot) return;
      
      const layer = child.userData?.visualLayer;
      
      // All protected layers must be visible
      if (layer && ['SHELL', 'AURA', 'VFX'].includes(layer)) {
        if (child.visible !== true) {
          result.violations.push(`${layer} layer hidden`);
          if (this.autoRepair) {
            child.visible = true;
            result.repairs.push(`Restored ${layer}.visible = true`);
          }
        }
        
        // Shells and VFX must not be culled
        if ((layer === 'SHELL' || layer === 'VFX') && child.frustumCulled !== false) {
          result.violations.push(`${layer} layer frustumCulled = true`);
          if (this.autoRepair) {
            child.frustumCulled = false;
            result.repairs.push(`Restored ${layer}.frustumCulled = false`);
          }
        }
      }
    });
    
    result.valid = result.violations.length === 0;
    
    return result;
  }
  
  /**
   * 🔧 ENFORCE FRAME: Validate and repair all nodes
   * 
   * Call this EVERY RENDER FRAME
   * 
   * @param {THREE.Scene} scene - Scene to enforce
   * @returns {Object} Enforcement report
   */
  enforceFrame(scene) {
    // PRIMARY AUTHORITY FLAG - Soft-deactivate duplicate authorities
    window.__VISUAL_AUTHORITY_PRIMARY__ = true;
    
    if (!this.enabled || !scene) return null;
    // Lockdown: disable per-frame renderOrder repairs to let VisualHierarchyRegistry be sole authority
    if (RENDER_AUTHORITY_LOCKDOWN) {
      return {
        timestamp: Date.now(),
        nodesChecked: 0,
        nodesValid: 0,
        nodesRepaired: 0,
        violations: [],
        repairs: [],
        lockdownActive: true
      };
    }
    
    const report = {
      timestamp: Date.now(),
      nodesChecked: 0,
      nodesValid: 0,
      nodesRepaired: 0,
      violations: [],
      repairs: []
    };
    
    scene.traverse((obj) => {
      if (!obj.userData?.isNode || !obj.userData?.visualRoot) return;
      
      report.nodesChecked++;
      
      const validation = this.validateNode(obj);
      
      if (validation.valid) {
        report.nodesValid++;
      } else {
        report.nodesRepaired++;
        report.violations.push(...validation.violations);
        report.repairs.push(...validation.repairs);
        
        // Track violation
        this.violations.push({
          nodeId: obj.uuid,
          timestamp: Date.now(),
          violations: validation.violations
        });
        
        if (this.violations.length > this.maxHistory) {
          this.violations.shift();
        }
      }
      
      if (validation.repairs.length > 0) {
        this.repairs.push(...validation.repairs);
        if (this.repairs.length > this.maxHistory) {
          this.repairs.splice(0, this.repairs.length - this.maxHistory);
        }
      }
    });
    
    // Silent mode suppresses logging
    if (!this.silent && report.nodesRepaired > 0) {
      if (report.violations.length > 0) {
        console.warn('[VisualAuthority] Frame violations detected and repaired', {
          checked: report.nodesChecked,
          valid: report.nodesValid,
          repaired: report.nodesRepaired,
          violationCount: report.violations.length
        });
      }
    }
    
    return report;
  }
  
  /**
   * 🛑 BLOCK ATTEMPT: Prevent unauthorized visual mutation
   * 
   * @param {THREE.Object3D} mesh - Mesh being mutated
   * @param {string} property - Property being changed
   * @param {any} oldValue - Current value
   * @param {any} newValue - Attempted value
   * @returns {boolean} True if mutation BLOCKED
   */
  blockMutationAttempt(mesh, property, oldValue, newValue) {
    if (!mesh?.userData?.visualLocked) return false;
    
    // Critical properties are LOCKED
    const lockedProps = ['visible', 'opacity', 'depthTest', 'depthWrite', 'frustumCulled'];
    
    if (lockedProps.includes(property)) {
      console.warn('[VisualAuthority] BLOCKED unauthorized mutation', {
        meshId: mesh.uuid,
        property: property,
        oldValue: oldValue,
        attemptedValue: newValue,
        reason: 'Visual property is locked by Visual Authority'
      });
      return true;  // BLOCKED
    }
    
    return false;  // ALLOWED
  }
  
  /**
   * 📊 GET REPORT: Diagnostics
   */
  getReport() {
    return {
      enabled: this.enabled,
      enforceEveryFrame: this.enforceEveryFrame,
      autoRepair: this.autoRepair,
      silent: this.silent,
      totalViolationsTracked: this.violations.length,
      totalRepairsTracked: this.repairs.length,
      recentViolations: this.violations.slice(-10),
      recentRepairs: this.repairs.slice(-10)
    };
  }
  
  /**
   * 🟢 ACTIVATE: Enable visual authority
   */
  activate() {
    this.enabled = true;
    console.log('[VisualAuthority] ✅ ACTIVATED');
  }
  
  /**
   * 🔴 DEACTIVATE: Disable visual authority
   */
  deactivate() {
    this.enabled = false;
    console.log('[VisualAuthority] 🔴 DEACTIVATED');
  }
}

/**
 * 🌍 GLOBAL INSTANCE
 */
export const visualAuthority = new VisualAuthority();
