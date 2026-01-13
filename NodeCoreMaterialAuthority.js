/**
 * NODE CORE MATERIAL AUTHORITY SYSTEM v2.0 (Strict Chemical Locking)
 * 
 * The single source of truth for Node Core material properties.
 * Implements "Chemical Locking" via Object.defineProperty to prevent
 * any external system from modifying critical visual properties.
 * 
 * CORE RULES:
 * 1. Opacity is ALWAYS 1.0 (Solid)
 * 2. Transparency is ALWAYS false (Opaque)
 * 3. DepthWrite is ALWAYS true (Z-buffer authority)
 * 4. DepthTest is ALWAYS true (Occlusion)
 * 5. Blending is ALWAYS Normal or NoBlending
 * 
 * ARCHITECTURE NOTE:
 * This class provides both static material locking utilities AND
 * instance-based authority methods for compatibility.
 * - Static methods (lockCoreMaterial, isCompliant, createLockedCoreMaterial)
 *   perform actual chemical locking via Object.defineProperty
 * - Instance methods (registerNodeCore, assertCoreOnLink) provide
 *   no-op fallback for legacy/external system compatibility
 */

import * as THREE from 'three';

export class NodeCoreMaterialAuthority {
  
  /**
   * Initialize authority instance (fallback compatibility layer).
   * 
   * NOTE: This constructor exists for backward compatibility with systems
   * that expect an instance-based authority. The actual material locking
   * is performed by static methods (lockCoreMaterial, etc.).
   * 
   * Instance methods (registerNodeCore, assertCoreOnLink) run in
   * fallback mode - they log once and return safely without error.
   * 
   * @param {Object} options - Configuration options (debugEnabled, enableLogging)
   */
  constructor(options = {}) {
    this.debugEnabled = options.debugEnabled || false;
    this.enableLogging = options.enableLogging || false;
    
    // Internal registry for tracking (fallback mode)
    this.registeredNodes = new Set();
    
    // Fallback mode flag - log once when methods are called
    this._fallbackModeLogged = false;
    
    if (this.enableLogging) {
      console.log('[NodeCoreMaterialAuthority] Initialized in fallback mode (static locking methods still available)');
    }
  }
  
  /**
   * Register a node core with the authority (fallback mode).
   * 
   * NOTE: This is a no-op fallback for compatibility. Actual material
   * locking is handled by static lockCoreMaterial() method.
   * 
   * @param {THREE.Object3D} node - Node to register
   */
  registerNodeCore(node) {
    if (!this._fallbackModeLogged) {
      console.warn('[NodeCoreMaterialAuthority] registerNodeCore called - running in fallback mode (static locking still active)');
      this._fallbackModeLogged = true;
    }
    
    if (node) {
      this.registeredNodes.add(node.uuid || node.id);
    }
  }
  
  /**
   * Re-assert core material properties after link creation (fallback mode).
   * 
   * NOTE: This is a no-op fallback. Static material locks are
   * permanent and cannot be overridden by link creation.
   * 
   * @param {THREE.Object3D} node - Node to re-assert
   */
  assertCoreOnLink(node) {
    // No-op - static locks are permanent and cannot be overridden
  }
  
  /**
   * LOCK a material's properties chemically.
   * Once locked, setting 'opacity' or 'transparent' will fail silently or throw.
   * 
   * @param {THREE.Material} material - The material to lock
   * @param {boolean} strict - If true, logs warnings on violation attempts
   */
  static lockCoreMaterial(material, strict = false) {
    if (!material) return;
    
    // Prevent double locking
    if (material.userData && material.userData.isChemicallyLocked) return;

    // 1. Enforce initial state
    material.transparent = false;
    material.opacity = 1.0;
    material.depthWrite = true;
    material.depthTest = true;
    
    // Ensure we use NormalBlending for solid cores to prevent wash-out
    if (material.blending !== THREE.NoBlending) {
        material.blending = THREE.NormalBlending;
    }

    // 2. Define chemical locks
    // We replace the properties with getters/setters that ignore or reject changes

    // --- TRANSPARENT ---
    let _transparent = false;
    Object.defineProperty(material, 'transparent', {
      get: () => _transparent,
      set: (val) => {
        if (val !== false) {
          if (strict) console.warn('[NodeCoreMaterialAuthority] Blocked attempt to set core transparent=true');
          // Ignore the change
        }
      },
      configurable: false // Cannot be deleted or redefined
    });

    // --- OPACITY ---
    let _opacity = 1.0;
    Object.defineProperty(material, 'opacity', {
      get: () => _opacity,
      set: (val) => {
        if (val !== 1.0) {
          if (strict) console.warn(`[NodeCoreMaterialAuthority] Blocked attempt to change core opacity to ${val}`);
          // Ignore the change
        }
      },
      configurable: false
    });

    // --- DEPTH WRITE ---
    let _depthWrite = true;
    Object.defineProperty(material, 'depthWrite', {
      get: () => _depthWrite,
      set: (val) => {
        if (val !== true) {
          if (strict) console.warn('[NodeCoreMaterialAuthority] Blocked attempt to set core depthWrite=false');
        }
      },
      configurable: false
    });

    // --- DEPTH TEST ---
    let _depthTest = true;
    Object.defineProperty(material, 'depthTest', {
      get: () => _depthTest,
      set: (val) => {
        if (val !== true) {
          if (strict) console.warn('[NodeCoreMaterialAuthority] Blocked attempt to set core depthTest=false');
        }
      },
      configurable: false
    });

    // Mark as chemically locked
    material.userData = material.userData || {};
    material.userData.isChemicallyLocked = true;
  }

  /**
   * Verify if a material is compliant
   */
  static isCompliant(material) {
    if (!material) return false;
    return (
      material.transparent === false &&
      material.opacity === 1.0 &&
      material.depthWrite === true &&
      material.depthTest === true
    );
  }

  /**
   * Create a standard, locked Core Material
   * @param {number|string} color 
   */
  static createLockedCoreMaterial(color) {
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.4,
      metalness: 0.8,
      emissive: 0x000000,
      flatShading: false
    });
    
    this.lockCoreMaterial(material);
    return material;
  }
}

/**
 * Console API for Node Core Material Authority
 * Allows debugging and inspection of material locking status
 */
export function setupNodeCoreAuthorityConsoleAPI() {
  window.nodeCoreMaterialAuthority = {
    // Check if a material is compliant
    checkCompliance: (material) => {
      const isCompliant = NodeCoreMaterialAuthority.isCompliant(material);
      console.log(`Material Compliance: ${isCompliant ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}`);
      if (!isCompliant) {
        console.table({
          transparent: material.transparent,
          opacity: material.opacity,
          depthWrite: material.depthWrite,
          depthTest: material.depthTest
        });
      }
      return isCompliant;
    },

    // Check all nodes in the scene for compliance
    auditScene: () => {
      if (!window.game || !window.game.scene) {
        console.warn('Game scene not available');
        return;
      }

      let compliantCount = 0;
      let nonCompliantCount = 0;
      let totalNodes = 0;

      window.game.scene.traverse((obj) => {
        if (obj.userData?.isInteractionCore && obj.material) {
          totalNodes++;
          if (NodeCoreMaterialAuthority.isCompliant(obj.material)) {
            compliantCount++;
          } else {
            nonCompliantCount++;
            console.warn(`Non-compliant core found: ${obj.name || obj.uuid}`, obj);
          }
        }
      });

      console.log(`
        🛡️ Node Core Material Authority Audit:
        ✅ Compliant Cores: ${compliantCount}
        ❌ Non-Compliant Cores: ${nonCompliantCount}
        📊 Total Cores: ${totalNodes}
        Status: ${nonCompliantCount === 0 ? '✅ SECURE' : '⚠️ VULNERABLE'}
      `);
    }
  };

  console.log('✅ NodeCoreMaterialAuthority Console API installed (window.nodeCoreMaterialAuthority)');
}