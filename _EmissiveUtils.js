/**
 * ATOMA EMISSIVE UTILITIES
 * 
 * Centralized, safe emissive property management for all materials.
 * Provides type-safe methods for setting and querying emissive capabilities.
 * 
 * Usage:
 *   import { isEmissiveCapable, safeSetEmissive } from './_EmissiveUtils.js';
 *   
 *   if (isEmissiveCapable(material)) {
 *     safeSetEmissive(material, 0xff0000, 0.5);
 *   }
 */

/**
 * Check if a material supports emissive properties
 * @param {THREE.Material} mat - Material to check
 * @returns {boolean} True if material supports emissive
 */
export function isEmissiveCapable(mat) {
  if (!mat || typeof mat !== 'object') return false;
  return !!(
    mat.isMeshStandardMaterial ||
    mat.isMeshLambertMaterial ||
    mat.isMeshPhongMaterial ||
    mat.isMeshToonMaterial
  );
}

/**
 * MATERIAL SAFETY 4.0: Check if material can safely use emissive
 * Excludes line materials, shader materials, and other non-emissive types
 * @param {THREE.Material} mat - Material to check
 * @returns {boolean} True if material supports emissive
 */
export function canEmissive(mat) {
  if (!mat || typeof mat !== 'object') return false;
  
  // Explicitly exclude non-emissive material types
  if (mat.isLineBasicMaterial || mat.isLineDashedMaterial) return false;
  if (mat.isShaderMaterial || mat.isRawShaderMaterial) return false;
  if (mat.isPointsMaterial || mat.isMeshBasicMaterial) return false;
  
  // Include only confirmed emissive-capable types
  return !!(
    mat.isMeshStandardMaterial ||
    mat.isMeshLambertMaterial ||
    mat.isMeshPhongMaterial ||
    mat.isMeshToonMaterial
  );
}

/**
 * Safely set emissive color and/or intensity on a material
 * @param {THREE.Material} mat - Target material
 * @param {number|string|THREE.Color} [color] - Color value (hex, name, or THREE.Color)
 * @param {number} [intensity] - Emissive intensity (0-1+)
 */
export function safeSetEmissive(mat, color, intensity) {
  if (!isEmissiveCapable(mat)) return;

  // Set color if provided
  if (color !== undefined && color !== null) {
    if (color instanceof THREE.Color) {
      mat.emissive.copy(color);
    } else {
      // Accept hex numbers and color strings
      mat.emissive.set(color);
    }
  }

  // Set intensity if provided
  if (typeof intensity === 'number') {
    mat.emissiveIntensity = Math.max(0, intensity);
  }
}

/**
 * Get current emissive intensity from a material
 * @param {THREE.Material} mat - Target material
 * @returns {number} Current emissive intensity, or 0 if not capable
 */
export function getEmissiveIntensity(mat) {
  if (!isEmissiveCapable(mat)) return 0;
  return mat.emissiveIntensity || 0;
}

/**
 * Fade emissive intensity smoothly
 * @param {THREE.Material} mat - Target material
 * @param {number} targetIntensity - Target intensity value
 * @param {number} deltaTime - Time delta for this frame
 * @param {number} speed - Fade speed (higher = faster, default 2.0)
 */
export function fadeEmissiveIntensity(mat, targetIntensity, deltaTime, speed = 2.0) {
  if (!isEmissiveCapable(mat)) return;

  const current = mat.emissiveIntensity || 0;
  const diff = targetIntensity - current;
  const change = diff * speed * deltaTime;

  mat.emissiveIntensity = current + change;
}

/**
 * Pulse emissive intensity between min and max
 * @param {THREE.Material} mat - Target material
 * @param {number} baseIntensity - Base intensity value
 * @param {number} amplitude - Pulse amplitude (swing amount)
 * @param {number} time - Oscillation time (use frameTime)
 * @param {number} frequency - Pulse frequency in Hz (default 1.0)
 */
export function pulseEmissiveIntensity(mat, baseIntensity, amplitude, time, frequency = 1.0) {
  if (!isEmissiveCapable(mat)) return;

  const pulse = Math.sin(time * Math.PI * 2 * frequency) * amplitude;
  mat.emissiveIntensity = Math.max(0, baseIntensity + pulse);
}

/**
 * Batch apply emissive properties to multiple materials
 * @param {THREE.Material[]} materials - Array of materials
 * @param {number|string|THREE.Color} [color] - Color value
 * @param {number} [intensity] - Emissive intensity
 */
export function batchSetEmissive(materials, color, intensity) {
  if (!Array.isArray(materials)) return;

  materials.forEach(mat => {
    safeSetEmissive(mat, color, intensity);
  });
}

/**
 * Get all materials with emissive capability from an object
 * @param {THREE.Object3D} object - Object to traverse
 * @returns {THREE.Material[]} Array of emissive-capable materials
 */
export function getEmissiveMaterials(object) {
  const materials = [];

  object.traverse(child => {
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(mat => {
          if (isEmissiveCapable(mat)) {
            materials.push(mat);
          }
        });
      } else if (isEmissiveCapable(child.material)) {
        materials.push(child.material);
      }
    }
  });

  return materials;
}

// Global export for non-module environments
if (typeof window !== 'undefined') {
  window.ATOMA_EMISSIVE_UTILS = {
    isEmissiveCapable,
    canEmissive,
    safeSetEmissive,
    getEmissiveIntensity,
    fadeEmissiveIntensity,
    pulseEmissiveIntensity,
    batchSetEmissive,
    getEmissiveMaterials
  };
}
