/**
 * RAYCAST AUTHORITY INITIALIZATION
 * 
 * Ensures that ALL visual-only meshes have raycasting disabled
 * so they NEVER intercept node selection raycasts.
 * 
 * Call this once after scene setup:
 *   initializeRaycastAuthority(scene);
 */

import { RaycastSanitizationEngine } from './RaycastSanitizationEngine_v1.js';

export function initializeRaycastAuthority(scene) {
  if (!scene) {
    console.warn('[RaycastAuthorityInit] No scene provided');
    return;
  }
  
  let disabledCount = 0;
  
  // Traverse entire scene and disable raycasting on visual-only meshes
  scene.traverse(obj => {
    if (!obj.isMesh) return;
    
    const userData = obj.userData || {};
    
    // Check if marked as visual-only
    const isVisualOnly = 
      userData.isAura === true ||
      userData.isShell === true ||
      userData.isHologramShell === true ||
      userData.isFX === true ||
      userData.isParticle === true ||
      userData.isGlyph === true ||
      userData.isLinkVisual === true ||
      userData.isLinkGlow === true ||
      userData.isSelectionGlow === true ||
      userData.isSelectionHighlight === true ||
      userData.nonInteractive === true ||
      userData.isNonLinkableVisual === true ||
      userData.visualLayer === 'AURA' ||
      userData.visualLayer === 'SHELL' ||
      userData.visualLayer === 'VISUAL_ONLY' ||
      userData.visualLayer === 'VFX' ||
      userData.visualLayer === 'CORE_SHELL';
    
    // Disable raycasting on visual-only meshes
    if (isVisualOnly) {
      RaycastSanitizationEngine.disableRaycastOnMesh(obj);
      disabledCount++;
    }
  });
  
  console.log(`[RaycastAuthorityInit] ✓ Initialized: ${disabledCount} visual meshes have raycasting disabled`);
  
  // Store initialized flag
  window.__raycastAuthorityInitialized = true;
}

/**
 * Disable raycasting on a specific mesh
 * Use this when dynamically adding visual elements
 * 
 * @param {THREE.Mesh} mesh - The mesh to disable raycasting on
 */
export function disableRaycastOnMesh(mesh) {
  return RaycastSanitizationEngine.disableRaycastOnMesh(mesh);
}

/**
 * Check if raycast authority is initialized
 * 
 * @returns {boolean} true if initialized
 */
export function isRaycastAuthorityInitialized() {
  return window.__raycastAuthorityInitialized === true;
}

// Export for global access
if (typeof window !== 'undefined') {
  window.RaycastAuthorityInit = {
    initialize: initializeRaycastAuthority,
    disableMesh: disableRaycastOnMesh,
    isInitialized: isRaycastAuthorityInitialized
  };
}
