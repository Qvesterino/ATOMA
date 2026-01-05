/**
 * RAYCAST DISABLER
 * 
 * Disables raycasting on ALL non-interactive meshes.
 * 
 * Applied to:
 * - FX meshes
 * - Aura meshes
 * - Hologram rings
 * - Link meshes
 * - Preview meshes
 * - Glyph meshes
 * - Debug helpers
 * - Any visual-only overlay
 * 
 * Pattern:
 *   mesh.raycast = () => [];
 * 
 * This prevents raycaster from intersecting non-interactive geometry.
 */

export class RaycastDisabler {
  
  /**
   * Disable raycast on a single mesh
   * 
   * @param {THREE.Mesh} mesh
   */
  static disableMesh(mesh) {
    if (!mesh || !mesh.isMesh) return;
    
    // No-op raycast function
    mesh.raycast = () => [];
    
    // Mark for tracking
    mesh.userData = mesh.userData || {};
    mesh.userData.raycastDisabled = true;
  }

  /**
   * Disable raycast on entire group
   * 
   * @param {THREE.Group} group
   */
  static disableGroup(group) {
    group.traverse(child => {
      if (child.isMesh) {
        this.disableMesh(child);
      }
    });
  }

  /**
   * Disable raycast on all children of object
   * 
   * @param {THREE.Object3D} parent
   */
  static disableChildren(parent) {
    parent.children.forEach(child => {
      if (child.isMesh) {
        this.disableMesh(child);
      } else if (child.children?.length > 0) {
        this.disableChildren(child);
      }
    });
  }

  /**
   * Enable raycast on a mesh (rarely used)
   * 
   * @param {THREE.Mesh} mesh
   */
  static enableMesh(mesh) {
    if (!mesh || !mesh.isMesh) return;
    
    // Restore default raycast
    mesh.raycast = mesh.constructor.prototype.raycast;
    
    // Unmark
    mesh.userData.raycastDisabled = false;
  }
}

/**
 * USAGE PATTERN
 * 
 * When creating FX:
 * ─────────────────
 * import { RaycastDisabler } from './RaycastDisabler.js';
 * 
 * const auraMesh = createAuraMesh();
 * scene.add(auraMesh);
 * RaycastDisabler.disableMesh(auraMesh);
 * 
 * 
 * When creating FX group:
 * ──────────────────────
 * const fxGroup = new THREE.Group();
 * fxGroup.add(aura);
 * fxGroup.add(hologram);
 * scene.add(fxGroup);
 * RaycastDisabler.disableGroup(fxGroup);
 * 
 * 
 * When creating link meshes:
 * ──────────────────────────
 * const linkLine = createLinkLine();
 * scene.add(linkLine);
 * RaycastDisabler.disableMesh(linkLine);
 * 
 * const linkPreview = createPreview();
 * scene.add(linkPreview);
 * RaycastDisabler.disableMesh(linkPreview);
 */
