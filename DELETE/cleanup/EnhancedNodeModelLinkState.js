/**
 * ENHANCED NODE MODEL LINK STATE v1.0 (Session 28)
 * 
 * Boosts core visual presence when nodes are linked.
 * Makes linked nodes visually stronger and more dominant.
 * 
 * Applied on link creation:
 * - Boost core opacity +5%
 * - Boost core emissive +15%
 * - Increase core scale +2%
 */

import * as THREE from 'three';
import { getLinkStateTarget, applyLinkStateMutation } from './LinkTargetContract.js';

export class EnhancedNodeModelLinkState {
  constructor() {
    // Track core boost state
    this.coreBoosts = new WeakMap();
    
    // Boost parameters
    this.boostParameters = {
      opacityBoost: 0.05,      // +5% opacity
      emissiveBoost: 0.15,     // +15% emissive intensity
      scaleBoost: 0,           // disabled
    };
    
    // Track original values for reversal
    this.originalCoreValues = new WeakMap();
  }
  
  /**
   * Find core geometry in node (handles multiple core implementations)
   */
  findCore(node) {
    if (!node) return null;
    
    // Strategy 1: Check direct children for core by name
    for (const child of node.children) {
      if (this.isCoreByName(child)) return child;
    }
    
    // Strategy 2: Check children by geometry type
    for (const child of node.children) {
      if (this.isCoreByGeometry(child)) return child;
    }
    
    // Strategy 3: Check for material properties
    for (const child of node.children) {
      if (this.isCoreByMaterial(child)) return child;
    }
    
    return null;
  }
  
  /**
   * Check if object is core by name
   */
  isCoreByName(obj) {
    const name = obj.name?.toLowerCase() || '';
    return name.includes('core') || 
           name === 'node' ||
           name.includes('sphere') ||
           name.includes('geometry');
  }
  
  /**
   * Check if object is core by geometry type
   */
  isCoreByGeometry(obj) {
    if (!obj.geometry) return false;
    
    // Cores are typically icosahedron or sphere
    return obj.geometry instanceof THREE.IcosahedronGeometry ||
           obj.geometry instanceof THREE.SphereGeometry ||
           (obj.geometry instanceof THREE.BufferGeometry && 
            obj.geometry.attributes.position.count > 100); // Has substantial vertex count
  }
  
  /**
   * Check if object is core by material properties
   */
  isCoreByMaterial(obj) {
    if (!obj.material) return false;
    
    const material = obj.material;
    
    // Cores typically have:
    // - Solid opacity (not transparent)
    // - Small to medium scale
    // - Emissive glow
    
    const isSolid = !material.transparent || material.opacity > 0.9;
    const isSmall = obj.scale.length() < 1.5;
    const hasGlow = material.emissive && material.emissive.getHex() !== 0x000000;
    
    return isSolid && (isSmall || hasGlow);
  }
  
  /**
   * Apply boost to core on link creation
   * 
   * CRITICAL: Core material (opacity, emissive, blend mode) is IMMUTABLE.
   * Only geometric properties (scale) may be boosted.
   * Link visual feedback is handled by aura modulation and link geometry.
   */
  applyLinkBoost(node) {
    if (!node) return;
    
    // ✓ CONTRACT-BASED APPROACH ✓
    // Get explicit linkTarget instead of finding/inferring core
    const target = getLinkStateTarget(node);
    if (!target) return;
    
    // Skip if already boosted
    if (this.coreBoosts.has(target)) return;
    
    // Store original scale (geometric property only - material is immutable)
    const original = {
      scaleX: target.scale.x,
      scaleY: target.scale.y,
      scaleZ: target.scale.z,
    };
    
    this.originalCoreValues.set(target, original);
    
    // Track boost (scale only)
    const boosts = {
      scaleApplied: 0,
    };
    
    // Boost scale (via contract, material never touched)
    applyLinkStateMutation(node, (mut) => {
      const scaleBoost = 1.0 + this.boostParameters.scaleBoost;
      mut.scale.multiplyScalar(scaleBoost);
    });
    
    boosts.scaleApplied = this.boostParameters.scaleBoost;
    this.coreBoosts.set(target, boosts);
    
    // NOTE: Core material NOT modified. NodeCoreMaterialAuthority ensures
    // core opacity, emissive, and blend mode remain immutable.
  }
  
  /**
   * Remove boost from core
   */
  removeLinkBoost(node) {
    if (!node) return;
    
    // ✓ CONTRACT-BASED APPROACH ✓
    const target = getLinkStateTarget(node);
    if (!target) return;
    
    const original = this.originalCoreValues.get(target);
    if (!original) return;
    
    // Restore original scale (via contract, material never modified)
    applyLinkStateMutation(node, (mut) => {
      mut.scale.set(original.scaleX, original.scaleY, original.scaleZ);
    });
    
    // Clean up
    this.coreBoosts.delete(target);
    this.originalCoreValues.delete(target);
  }
  
  /**
   * Check if core is boosted
   */
  isBoosted(node) {
    if (!node) return false;
    const core = this.findCore(node);
    return core ? this.coreBoosts.has(core) : false;
  }
  
  /**
   * Get boost info for core
   */
  getBoostInfo(node) {
    if (!node) return null;
    const core = this.findCore(node);
    if (!core) return null;
    
    return this.coreBoosts.get(core) || null;
  }
  
  /**
   * Cleanup system
   */
  dispose() {
    this.coreBoosts = new WeakMap();
    this.originalCoreValues = new WeakMap();
  }
}

/**
 * Setup console debugging API
 */
export function setupEnhancedNodeModelLinkStateConsoleAPI(enhancedLinkState) {
  if (!window.debugEnhancedNodeModelLinkState) {
    window.debugEnhancedNodeModelLinkState = {};
  }
  
  Object.assign(window.debugEnhancedNodeModelLinkState, {
    applyBoost: (node) => {
      enhancedLinkState.applyLinkBoost(node);
      console.log('⬆️ Link boost applied to node:', node);
    },
    
    removeBoost: (node) => {
      enhancedLinkState.removeLinkBoost(node);
      console.log('⬇️ Link boost removed from node:', node);
    },
    
    isBoosted: (node) => {
      const boosted = enhancedLinkState.isBoosted(node);
      console.log(`🔍 Node is boosted: ${boosted}`, node);
      return boosted;
    },
    
    getBoostInfo: (node) => {
      const info = enhancedLinkState.getBoostInfo(node);
      console.log('📊 Boost info:', info);
      return info;
    },
    
    getBoostParameters: () => {
      console.table(enhancedLinkState.boostParameters);
      return enhancedLinkState.boostParameters;
    },
    
    setBoostParameter: (param, value) => {
      if (enhancedLinkState.boostParameters.hasOwnProperty(param)) {
        enhancedLinkState.boostParameters[param] = value;
        console.log(`✅ Set ${param} to ${value}`);
      } else {
        console.warn(`❌ Unknown parameter: ${param}`);
      }
    },
  });
  
  console.log('✅ Enhanced Node Model Link State console API ready: debugEnhancedNodeModelLinkState.*');
  return window.debugEnhancedNodeModelLinkState;
}
