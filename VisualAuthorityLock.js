import { CONFIG } from './config.js';

/**
 * CRITICAL STABILIZATION: Visual Authority Lock System
 * 
 * Enforces hard locks on node and link visuals to prevent runtime mutations.
 * All systems must check these guards before modifying any visual properties.
 * 
 * This is the single source of truth for visual stability.
 * NO EXCEPTIONS.
 */

let loggedOnce = false;

export class VisualAuthorityLock {
  /**
   * Initialize and log lock status (once only)
   */
  static initialize() {
    if (loggedOnce) return;
    loggedOnce = true;
    
    const locks = {
      nodeVisuals: CONFIG.visuals?.LOCK_NODE_VISUALS ?? false,
      linkVisuals: CONFIG.visuals?.LOCK_LINK_VISUALS ?? false,
      interaction: CONFIG.visuals?.LOCK_INTERACTION ?? false,
      particleBounds: CONFIG.visuals?.PARTICLE_BOUNDS_CHECK ?? false,
      freezeModeSafe: CONFIG.visuals?.FREEZE_MODE_SAFE ?? false
    };
    
    if (Object.values(locks).some(v => v === true)) {
      console.log('[VisualAuthority] Node & Link visuals locked successfully.');
      console.debug('[VisualAuthority] Active locks:', locks);
    }
  }
  
  /**
   * CHECK: Can modify node visual properties?
   * Returns false if NODE_VISUAL_AUTHORITY is locked
   * All mutations must check this before proceeding
   */
  static canModifyNode() {
    return !(CONFIG.visuals?.LOCK_NODE_VISUALS === true);
  }
  
  /**
   * CHECK: Can modify link visual properties?
   * Returns false if LINK_VISUAL_AUTHORITY is locked
   */
  static canModifyLink() {
    return !(CONFIG.visuals?.LOCK_LINK_VISUALS === true);
  }
  
  /**
   * CHECK: Can use raycasting on visual meshes?
   * Returns false if INTERACTION_AUTHORITY is locked
   * (Should use interaction meshes instead)
   */
  static canRaycastVisuals() {
    return !(CONFIG.visuals?.LOCK_INTERACTION === true);
  }
  
  /**
   * CHECK: Are particles bound to curve?
   * Returns true if PARTICLE_BOUNDS_CHECK is enabled
   */
  static particlesBounded() {
    return CONFIG.visuals?.PARTICLE_BOUNDS_CHECK === true;
  }
  
  /**
   * CHECK: Freeze mode safe mode?
   * Returns true if FREEZE_MODE_SAFE is enabled
   */
  static freezeModeSafe() {
    return CONFIG.visuals?.FREEZE_MODE_SAFE === true;
  }
  
  /**
   * GUARD: Attempt to set node opacity
   * Silently blocks if locked, returns success status
   * 
   * @param {THREE.Mesh} node - Node mesh
   * @param {number} opacity - Target opacity (0-1)
   * @returns {boolean} True if mutation allowed, false if blocked
   */
  static setNodeOpacity(node, opacity) {
    if (!this.canModifyNode() || !node) return false;
    
    try {
      if (node.material && typeof node.material === 'object' && 'opacity' in node.material) {
        node.material.opacity = opacity;
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }
  
  /**
   * GUARD: Attempt to set node scale
   * Silently blocks if locked, returns success status
   */
  static setNodeScale(node, scale) {
    if (!this.canModifyNode() || !node || !node.scale) return false;
    
    try {
      node.scale.copy(typeof scale === 'number' ? { x: scale, y: scale, z: scale } : scale);
      return true;
    } catch (e) {
      return false;
    }
    return false;
  }
  
  /**
   * GUARD: Attempt to set node color
   * Silently blocks if locked, returns success status
   */
  static setNodeColor(node, color) {
    if (!this.canModifyNode() || !node) return false;
    
    try {
      if (node.material && typeof node.material === 'object' && node.material.color) {
        if (typeof color === 'number') {
          node.material.color.setHex(color);
        } else {
          node.material.color.copy(color);
        }
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }
  
  /**
   * GUARD: Attempt to set node emissive
   * Silently blocks if locked, returns success status
   */
  static setNodeEmissive(node, color, intensity = 0) {
    if (!this.canModifyNode() || !node) return false;
    
    try {
      if (node.material && typeof node.material === 'object') {
        if (node.material.emissive) {
          if (typeof color === 'number') {
            node.material.emissive.setHex(color);
          } else {
            node.material.emissive.copy(color);
          }
        }
        if (node.material.emissiveIntensity !== undefined) {
          node.material.emissiveIntensity = intensity;
        }
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }
  
  /**
   * GUARD: Attempt to set node visibility
   * Silently blocks if locked, returns success status
   */
  static setNodeVisible(node, visible) {
    if (!this.canModifyNode() || !node) return false;
    
    try {
      if ('visible' in node) {
        node.visible = visible;
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }
  
  /**
   * GUARD: Attempt to set link opacity
   * Silently blocks if locked, returns success status
   */
  static setLinkOpacity(link, opacity) {
    if (!this.canModifyLink() || !link) return false;
    
    try {
      if (link.material && typeof link.material === 'object' && 'opacity' in link.material) {
        link.material.opacity = opacity;
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }
  
  /**
   * GUARD: Attempt to set link color
   * Silently blocks if locked, returns success status
   */
  static setLinkColor(link, color) {
    if (!this.canModifyLink() || !link) return false;
    
    try {
      if (link.material && typeof link.material === 'object' && link.material.color) {
        if (typeof color === 'number') {
          link.material.color.setHex(color);
        } else {
          link.material.color.copy(color);
        }
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }
  
  /**
   * GUARD: Freeze mode safe check
   * Returns true if freeze mode can proceed safely
   * Ensures freeze mode NEVER hides/mutates visuals
   */
  static canApplyFreezeMode() {
    return this.freezeModeSafe();
  }
  
  /**
   * GUARD: Particle bounds check
   * Returns true if particles should be confined to curve bounds
   */
  static shouldCheckParticleBounds() {
    return this.particlesBounded() || !this.canModifyLink();
  }
  
  /**
   * DEBUG: Get current lock status as object
   */
  static getStatus() {
    return {
      nodeVisuals: !this.canModifyNode(),
      linkVisuals: !this.canModifyLink(),
      interaction: !this.canRaycastVisuals(),
      particleBounds: this.particlesBounded(),
      freezeModeSafe: this.freezeModeSafe(),
      timestamp: Date.now()
    };
  }
}

// Auto-initialize on import
VisualAuthorityLock.initialize();

export default VisualAuthorityLock;
