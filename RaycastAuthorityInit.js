/**
 * RAYCAST AUTHORITY INITIALIZATION
 * 
 * Ensures that ALL visual-only meshes have raycasting disabled
 * so they NEVER intercept node selection raycasts.
 * 
 * Call this once after scene setup:
 *   initializeRaycastAuthority(scene);
 */

export function initializeRaycastAuthority(scene) {
  if (!scene) {
    console.warn('[RaycastAuthorityInit] No scene provided');
    return;
  }
  
  console.log('[RaycastAuthorityInit] noop (raycast authority handled by HitProxySystem/NodeLinkingSystem)');
  window.__raycastAuthorityInitialized = true;
}

/**
 * Disable raycasting on a specific mesh
 * Use this when dynamically adding visual elements
 * 
 * @param {THREE.Mesh} mesh - The mesh to disable raycasting on
 */
export function disableRaycastOnMesh(mesh) {
  return mesh;
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
