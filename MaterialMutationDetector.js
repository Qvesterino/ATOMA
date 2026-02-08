/**
 * MaterialMutationDetector.js
 * 
 * Phase MMD-1 – Global Material Mutation Detector
 * 
 * Diagnostic-only system for detecting and logging runtime changes to THREE materials.
 * No behavior changes. Logging only.
 * 
 * Usage:
 * 1. Install in main.js: installMaterialMutationDetector(THREE);
 * 2. Enable at runtime: window.ATOMA_DEBUG_MATERIAL_MUTATIONS = true;
 * 3. Watch console for mutation logs
 */

/**
 * Global guard to check if material debugging is enabled
 * @returns {boolean} True if material debugging is enabled
 */
import { debugLog, debugWarn } from './Engine/Debug/DebugLog.js';

const shaderDebugFlag = () => (typeof window !== 'undefined' && window.ATOMA_DEBUG_SHADER === true);

const shaderDebugEnabled = () => (typeof window !== 'undefined' && window.ATOMA_DEBUG === true && window.ATOMA_DEBUG_SHADER === true);

function shaderLog(...args) {
  debugLog(shaderDebugFlag(), ...args);
}

function shaderWarn(...args) {
  debugWarn(shaderDebugFlag(), ...args);
}

function isMaterialDebugEnabled() {
  if (typeof window === 'undefined') return false;
  return window.ATOMA_DEBUG_MATERIAL_MUTATIONS === true;
}

/**
 * Install the Material Mutation Detector by patching THREE.Material
 * @param {THREE} THREE - The THREE.js library instance
 */
export function installMaterialMutationDetector(THREE) {
  if (!THREE || !THREE.Material) {
    shaderWarn('[MMD] THREE or THREE.Material not available');
    return;
  }

  const originalSetValues = THREE.Material.prototype.setValues;

  THREE.Material.prototype.setValues = function (values) {
    if (isMaterialDebugEnabled() && values) {
      for (const key in values) {
        const oldValue = this[key];
        const newValue = values[key];

        if (oldValue !== newValue && shaderDebugEnabled()) {
          console.group('[MMD] Material mutation via setValues');
          console.log('property:', key);
          console.log('old:', oldValue);
          console.log('new:', newValue);
          console.log('material:', this);

          const stack = new Error().stack;
          console.log('stack:', stack);

          console.groupEnd();
        }
      }
    }

    return originalSetValues.call(this, values);
  };
}

/**
 * Watch a specific property of a material for direct property writes
 * Uses Object.defineProperty to intercept property access
 * @param {THREE.Material} material - The material to watch
 * @param {string} propertyName - The property name to watch
 */
export function watchMaterialProperty(material, propertyName) {
  if (!material) return;

  let internalValue = material[propertyName];

  Object.defineProperty(material, propertyName, {
    get() {
      return internalValue;
    },
    set(value) {
      if (isMaterialDebugEnabled() && internalValue !== value && shaderDebugEnabled()) {
        console.group('[MMD] Direct property change');
        console.log('property:', propertyName);
        console.log('old:', internalValue);
        console.log('new:', value);
        console.log('material:', material);
        console.log('stack:', new Error().stack);
        console.groupEnd();
      }

      internalValue = value;
    }
  });
}

/**
 * Watch all material properties of a node's children
 * Useful for monitoring node visuals during interactions
 * @param {THREE.Object3D} node - The node to watch materials for
 */
export function watchNodeMaterials(node) {
  if (!node) return;

  node.traverse((child) => {
    if (child.material) {
      watchMaterialProperty(child.material, 'emissiveIntensity');
      watchMaterialProperty(child.material, 'opacity');
      watchMaterialProperty(child.material, 'transparent');
      watchMaterialProperty(child.material, 'color');
      watchMaterialProperty(child.material, 'emissive');
    }
  });
}

/**
 * Unwatch a specific property (restore original behavior)
 * Note: This requires recreating the property descriptor
 * @param {THREE.Material} material - The material to unwatch
 * @param {string} propertyName - The property name to unwatch
 */
export function unwatchMaterialProperty(material, propertyName) {
  if (!material) return;
  
  // Restore by using the descriptor from the prototype
  const proto = Object.getPrototypeOf(material);
  if (proto && proto.hasOwnProperty(propertyName)) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, propertyName);
    if (descriptor) {
      Object.defineProperty(material, propertyName, descriptor);
    }
  }
}

/**
 * Enable material mutation debugging in console
 * Helper function for runtime usage
 */
export function enableMaterialDebugging() {
  if (typeof window !== 'undefined') {
    window.ATOMA_DEBUG_MATERIAL_MUTATIONS = true;
    shaderLog('[MMD] Material mutation debugging enabled');
  }
}

/**
 * Disable material mutation debugging in console
 * Helper function for runtime usage
 */
export function disableMaterialDebugging() {
  if (typeof window !== 'undefined') {
    window.ATOMA_DEBUG_MATERIAL_MUTATIONS = false;
    shaderLog('[MMD] Material mutation debugging disabled');
  }
}
