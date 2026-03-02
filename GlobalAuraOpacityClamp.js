/**
 * GLOBAL AURA OPACITY CLAMP v1.0 (Session 28)
 * 
 * Clamps all aura opacity to ≤ 0.10 after linking to prevent
 * auras from washing out or occluding node cores.
 * 
 * Multi-strategy identification:
 * - Name-based detection
 * - Hierarchy-based detection
 * - Material-based detection
 * 
 * Doesn't affect cores, effects, or particles.
 * 
 * Session 96: Visual Layer Enforcement Integration
 * - Opacity clamping now checked against enforcement gate
 * - Prevents invalid opacity modifications per layer hierarchy
 * - Ensures clamped values stay within AURA_LAYER bounds
 */

import * as THREE from 'three';
import { VisualLayerEnforcementIntegrationHelpers as IntegrationHelpers } from './VisualLayerEnforcementIntegrationHelpers.js';

export class GlobalAuraOpacityClamp {
  constructor(enforcementGate = null) {
    // Track clamped auras
    this.clampedAuras = new WeakSet();
    
    // Original opacity values
    this.originalOpacities = new WeakMap();
    
    // Session 96: Enforcement gate
    this.enforcementGate = enforcementGate;
    
    // Clamp parameters
    // [PERF FIX SESSION 74] Reduced from 0.18 to 0.10 to minimize fillrate cost
    // Balances visual clarity with GPU blend overhead
    // 0.10 = ~10% opacity typical, invisible at >2 layers overlap
    this.clampParameters = {
      maxAuraOpacity: 0.10,    // Reduced for aggressive fillrate optimization
      enforceOnLink: true,     // Apply clamp on link creation
      enforceGlobally: true,   // Periodically enforce globally
    };
  }
  
  /**
   * Find all auras in a node
   */
  findAuras(node) {
    const auras = [];
    
    if (!node) return auras;
    
    // Check direct children
    for (const child of node.children) {
      if (this.isAura(child)) {
        auras.push(child);
      }
    }
    
    // Recursively check children
    for (const child of node.children) {
      auras.push(...this.findAuras(child));
    }
    
    return auras;
  }
  
  /**
   * Check if object is an aura (multi-strategy)
   */
  isAura(obj) {
    if (!obj) return false;
    
    // Skip if it's a core-like object
    if (this.isCore(obj)) return false;
    
    return this.isAuraByName(obj) || 
           this.isAuraByHierarchy(obj) || 
           this.isAuraByMaterial(obj);
  }
  
  /**
   * Check if object is a core
   */
  isCore(obj) {
    if (!obj) return false;
    
    const name = obj.name?.toLowerCase() || '';
    
    // Cores have these name patterns
    if (name.includes('core') || 
        name === 'node' ||
        name.includes('sphere') ||
        name.includes('geometry')) {
      return true;
    }
    
    // Cores are typically solid (not transparent)
    if (obj.material && !obj.material.transparent && obj.material.opacity > 0.9) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if object is aura by name
   */
  isAuraByName(obj) {
    const name = obj.name?.toLowerCase() || '';
    return name.includes('aura') || 
           name.includes('halo') ||
           name.includes('glow') ||
           name.includes('corona') ||
           name.includes('halo');
  }
  
  /**
   * Check if object is aura by hierarchy
   */
  isAuraByHierarchy(obj) {
    if (!obj.parent || !obj.material) return false;
    
    // Auras are typically children of nodes with cores as siblings
    const siblings = obj.parent.children;
    
    // Has a core sibling
    const hasCoreSibling = siblings.some(s => 
      s !== obj && this.isCore(s)
    );
    
    if (!hasCoreSibling) return false;
    
    // Is transparent and larger than core
    return obj.material.transparent && 
           obj.scale.length() > 1.0;
  }
  
  /**
   * Check if object is aura by material
   */
  isAuraByMaterial(obj) {
    if (!obj.material) return false;
    
    const material = obj.material;
    
    // Auras have specific material signatures:
    // - Transparent
    // - Low opacity
    // - Emissive or bloom-enabled
    // - Larger scale
    
    const hasTransparency = material.transparent && material.opacity < 0.8;
    const hasEmissive = material.emissive && material.emissive.getHex() !== 0x000000;
    const isLarge = obj.scale.length() > 1.2;
    const hasBloom = material.toneMapped === false; // Bloom indicator
    
    return hasTransparency && (hasEmissive || hasBloom || isLarge);
  }
  
  /**
   * Clamp aura opacity to max value
   */
  clampAuraOpacity(aura, node = null) {
    if (!aura || !aura.material) return false;
    // Scope: only baseline auras are eligible
    if (aura.userData?.auraLayer && aura.userData.auraLayer !== 'AURA_BASELINE') return false;
    
    // Skip if already clamped
    if (this.clampedAuras.has(aura)) return false;
    
    // Store original opacity
    const originalOpacity = aura.material.opacity;
    this.originalOpacities.set(aura, originalOpacity);
    
    // Apply clamp
    const clamped = Math.min(originalOpacity, this.clampParameters.maxAuraOpacity);
    
    // Session 96: Check enforcement before applying clamp
    if (!this._canClampOpacity(clamped, node)) {
      return false;  // Gate rejected clamp
    }
    
    // Safe to apply clamp
    aura.material.opacity = clamped;
    
    // Mark as clamped
    this.clampedAuras.add(aura);
    
    return originalOpacity > clamped; // Return true if actually clamped
  }
  
  /**
   * Session 96: Check if opacity clamp is allowed
   */
  _canClampOpacity(clampedOpacity, node) {
    if (!this.enforcementGate || !node) return true;  // No gate - allow
    
    const request = IntegrationHelpers.createVisualAttachmentRequest({
      nodeId: node.userData?.id || node.uuid,
      nodeCategory: node.userData?.category || 'unknown',
      layerType: 'AURA_LAYER',
      geometryType: 'Spheres',
      opacity: clampedOpacity,  // Clamped value (0.10 or less)
      sourceSystem: 'GlobalAuraOpacityClamp',
      description: 'Global aura opacity clamping'
    });
    
    return this.enforcementGate.canAttach(request);
  }
  
  /**
   * Clamp all auras in a node hierarchy
   */
  clampNodeAuras(node) {
    if (!node) return;
    
    const auras = this.findAuras(node);
    let clampCount = 0;
    
    for (const aura of auras) {
      if (this.clampAuraOpacity(aura, node)) {  // Session 96: Pass node for enforcement
        clampCount++;
      }
    }
    
    return clampCount;
  }
  
  /**
   * Remove clamp from aura (restore original opacity)
   */
  removeAuraClamp(aura) {
    if (!aura || !aura.material) return false;
    
    const originalOpacity = this.originalOpacities.get(aura);
    if (originalOpacity === undefined) return false;
    
    aura.material.opacity = originalOpacity;
    
    this.clampedAuras.delete(aura);
    this.originalOpacities.delete(aura);
    
    return true;
  }
  
  /**
   * Remove clamp from all auras in node
   */
  removeNodeAurasClamping(node) {
    if (!node) return;
    
    const auras = this.findAuras(node);
    let unclampCount = 0;
    
    for (const aura of auras) {
      if (this.removeAuraClamp(aura)) {
        unclampCount++;
      }
    }
    
    return unclampCount;
  }
  
  /**
   * Enforce clamping globally (for all nodes in scene)
   */
  enforceGlobally(scene) {
    if (!scene) return;
    
    let totalClamped = 0;
    
    scene.traverse((obj) => {
      // Find auras
      if (this.isAura(obj) && !this.clampedAuras.has(obj)) {
        // Session 96: Find parent node for enforcement context
        let parentNode = obj.parent;
        while (parentNode && !parentNode.userData?.id) {
          parentNode = parentNode.parent;
        }
        
        if (this.clampAuraOpacity(obj, parentNode)) {
          totalClamped++;
        }
      }
    });
    
    return totalClamped;
  }
  
  /**
   * Check if aura is clamped
   */
  isClamped(aura) {
    return this.clampedAuras.has(aura);
  }
  
  /**
   * Get clamp info
   */
  getClampInfo(aura) {
    if (!aura || !aura.material) return null;
    
    return {
      isClamped: this.isClamped(aura),
      currentOpacity: aura.material.opacity,
      originalOpacity: this.originalOpacities.get(aura),
      maxAllowed: this.clampParameters.maxAuraOpacity,
    };
  }
  
  /**
   * Cleanup system
   */
  dispose() {
    this.clampedAuras = new WeakSet();
    this.originalOpacities = new WeakMap();
  }
}

/**
 * Setup console debugging API
 */
export function setupGlobalAuraOpacityClampConsoleAPI(opacityClamp) {
  if (!window.debugGlobalAuraOpacityClamp) {
    window.debugGlobalAuraOpacityClamp = {};
  }
  
  Object.assign(window.debugGlobalAuraOpacityClamp, {
    clampNode: (node) => {
      const count = opacityClamp.clampNodeAuras(node);
      console.log(`📍 Clamped ${count} auras in node`, node);
    },
    
    unclampNode: (node) => {
      const count = opacityClamp.removeNodeAurasClamping(node);
      console.log(`📍 Unclamped ${count} auras in node`, node);
    },
    
    clampAura: (aura) => {
      const clamped = opacityClamp.clampAuraOpacity(aura);
      console.log(`🎨 Aura clamped: ${clamped}`, aura);
    },
    
    unclampAura: (aura) => {
      const unclamped = opacityClamp.removeAuraClamp(aura);
      console.log(`🎨 Aura unclamped: ${unclamped}`, aura);
    },
    
    findAuras: (node) => {
      const auras = opacityClamp.findAuras(node);
      console.log(`🔍 Found ${auras.length} auras`, auras);
      return auras;
    },
    
    getClampInfo: (aura) => {
      const info = opacityClamp.getClampInfo(aura);
      console.table(info);
      return info;
    },
    
    enforceGlobally: (scene) => {
      const count = opacityClamp.enforceGlobally(scene);
      console.log(`🌍 Enforced global clamping: ${count} auras adjusted`);
    },
    
    getClampParameters: () => {
      console.table(opacityClamp.clampParameters);
      return opacityClamp.clampParameters;
    },
    
    setClampParameter: (param, value) => {
      if (opacityClamp.clampParameters.hasOwnProperty(param)) {
        opacityClamp.clampParameters[param] = value;
        console.log(`✅ Set ${param} to ${value}`);
      } else {
        console.warn(`❌ Unknown parameter: ${param}`);
      }
    },
  });
  
  console.log('✅ Global Aura Opacity Clamp console API ready: debugGlobalAuraOpacityClamp.*');
}
