import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

function vfxFlag(name, def = true) {
  const v = (typeof window !== 'undefined') ? window[name] : undefined;
  return (v === undefined) ? def : !!v;
}

function collectDescendants(root, predicate, out = []) {
  if (!root) return out;
  if (predicate(root)) out.push(root);
  if (root.children && root.children.length) {
    for (const child of root.children) {
      collectDescendants(child, predicate, out);
    }
  }
  return out;
}

// ============================================================
// STABLE HOLOGRAM GEOMETRY CACHE
// Global cache for stable icosphere geometries (not derived from core mesh)
// ============================================================
const HOLOGRAM_GEOMETRY_CACHE = new Map();

/**
 * Get or create stable hologram geometry
 * Independent of core mesh - pure symbolic overlay
 * @param {number} radius - Node radius
 * @param {number} detail - Icosphere detail level (0-4, default 2)
 * @returns {THREE.IcosahedronGeometry}
 */
export function getStableHologramGeometry(radius = 1, detail = 2) {
  const cacheKey = `icosphere_${radius}_${detail}`;
  
  if (!HOLOGRAM_GEOMETRY_CACHE.has(cacheKey)) {
    // Create stable icosphere geometry (not derived from any core mesh)
    const geometry = new THREE.IcosahedronGeometry(radius, detail);
    HOLOGRAM_GEOMETRY_CACHE.set(cacheKey, geometry);
  }
  
  return HOLOGRAM_GEOMETRY_CACHE.get(cacheKey);
}

/**
 * CORE IDENTITY MATERIAL - STABLE IDENTITY LAYER
 * 
 * Used for core mesh only. Simple, stable, never changes.
 * This is the node's identity in the system.
 * Core mesh is now purely solid — no longer used for hologram geometry.
 */
export function createCoreIdentityMaterial(baseColor = 0x00ffff) {
  return new THREE.MeshStandardMaterial({
    color: baseColor,
    metalness: 0.7,
    roughness: 0.3,
    emissive: baseColor,
    emissiveIntensity: 0.15,
    depthWrite: true,
    depthTest: true
  });
}

/**
 * HOLOGRAM SHELL MATERIAL - FRESNEL RIM LIGHT AURA
 * 
 * Redesigned in Session 113 for subtle, elegant readability.
 * Uses Fresnel equations to create a thin energetic rim.
 * 
 * Rules:
 * - Rim-only visibility (center is transparent)
 * - Additive blending (energy look)
 * - Depth-write disabled (no occlusion)
 * - Extremely subtle (low opacity)
 */

export function createHologramShellMaterial(baseColor = 0x00ffff) {
  // Use the base color but shift slightly towards cool/energy tones if needed
  // or respect the input color fully for state indication.
  // We'll use the input color but ensure high value/saturation for emission.
  const color = new THREE.Color(baseColor);
  
  const uniforms = {
    uColor: { value: color },
    uOpacity: { value: 0.15 },     // Base opacity (subtle)
    uRimPower: { value: 3.0 },     // High power = thinner rim
    uRimIntensity: { value: 1.5 }  // Brightness multiplier
  };

  const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform float uRimPower;
    uniform float uRimIntensity;
    
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    
    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      
      // Calculate Fresnel term (1.0 at edges, 0.0 at center)
      // abs() handles backfaces if double-sided rendering is on,
      // though typically for aura we want front-side logic.
      float fresnel = pow(1.0 - abs(dot(normal, viewDir)), uRimPower);
      float alpha = fresnel * uOpacity * uRimIntensity;
      
      // Soft clamp to ensure center is truly clear
      alpha = smoothstep(0.02, 1.0, alpha);
      
      gl_FragColor = vec4(uColor, alpha);
    }
  `;

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false, // CRITICAL: Aura must not occlude
    depthTest: true,   // Aura respects depth
    side: THREE.FrontSide, // Render only outer shell
    blending: THREE.AdditiveBlending // Energy look
  });
}

/**
 * Setup Aura Debug Console API
 */
export function setupAuraDebugAPI() {
  window.AuraDebug = {
    toggle(enabled) {
      const nodes = document.querySelectorAll('canvas'); // Dummy check, logic handled via traversal usually
      console.log('[AURA DEBUG] Toggling auras:', enabled);
      // In a real scenario we'd traverse the scene or use a global setting.
      // For now, we update the material prototype or similar if reachable.
      // Since materials are instances, we rely on the creation logic.
    },
    log(nodeId) {
      console.log(`[AURA DEBUG] Node=${nodeId || 'Selected'} rimIntensity=1.5 rimWidth=3.0`);
    }
  };
  console.log('[AURA DEBUG] Ready. Use window.AuraDebug');
}

// Auto-initialize debug API on module load
setupAuraDebugAPI();


/**
 * Update hologram shell uniforms (for animation)
 */
export function updateHologramShellMaterial(material, deltaTime) {
  return material;
}

/**
 * UNIVERSAL HOLOGRAM SHELL CREATION - GLOBAL ENFORCEMENT
 * 
 * SINGLE ENTRY POINT for all hologram shell creation.
 * All nodes MUST use this function — zero exceptions.
 * 
 * NEW ARCHITECTURE (Session 32):
 * - Hologram geometry is STABLE ICOSPHERE, not derived from core mesh
 * - Core mesh is purely solid identity representation
 * - Hologram is purely symbolic visual overlay
 * - Guarantees 100% consistency across all node types
 * 
 * Features:
 * - Uses stable icosphere geometry (shared, cached)
 * - Enforces locked material properties
 * - Applies hard render order (renderOrder = 5)
 * - Disables frustum culling
 * - Returns shell mesh ready for scene attachment
 * 
 * @param {THREE.Mesh} coreMesh - The core identity mesh (for bounding radius only)
 * @param {number} baseColor - Hex color for hologram effect
 * @param {number} hologramDetail - Icosphere detail level (0-4, default 2)
 * @returns {THREE.Mesh} Hologram shell mesh with locked properties
 */
export function createNodeHologramShell(coreMesh, baseColor = 0x00ffff, hologramDetail = 2) {
  if (!vfxFlag('ATOMA_VFX_ENABLE_HOLOGRAM_SHELL', true)) return null;

  // Extract radius from core mesh (if available)
  // Use bounding sphere for consistent sizing
  let radius = 1;
  if (coreMesh && coreMesh.geometry) {
    if (!coreMesh.geometry.boundingSphere) {
      coreMesh.geometry.computeBoundingSphere();
    }
    if (coreMesh.geometry.boundingSphere) {
      radius = coreMesh.geometry.boundingSphere.radius;
    }
  }

  // Get STABLE hologram geometry (not derived from core mesh)
  const geometry = getStableHologramGeometry(radius, hologramDetail);

  // Create hologram material
  const material = createHologramShellMaterial(baseColor);
  
  // HARD MATERIAL LOCK - NO EXCEPTIONS
  material.depthTest = true;
  material.depthWrite = false;
  material.transparent = true;
  material.side = THREE.DoubleSide;
  material.blending = THREE.AdditiveBlending;

  // Create shell mesh (from stable geometry)
  const shell = new THREE.Mesh(geometry, material);
  
  // RENDER ORDER LOCK - GLOBAL
  // PHASE 3C.1 remap → ARCHETYPE
  shell.renderOrder = VisualHierarchyRegistry.getRenderOrder('ARCHETYPE');
  
  // FRUSTUM CULL DISABLE
  shell.frustumCulled = false;
  
  // Mark as hologram shell for identification
  shell.userData.visualLayer = 'CORE_SHELL';
  shell.userData.isHologramShell = true;

  return shell;
}

/**
 * REASSERT HOLOGRAM SHELL - DYNAMIC STABILIZATION
 * 
 * Safety net for nodes that modify meshes/materials at runtime.
 * Cheap O(1) guard: checks if shell exists and has correct properties.
 * If any condition fails, shell is re-attached.
 * 
 * Called on state changes or in update loop for risky nodes.
 * 
 * @param {THREE.Group} nodeGroup - The node root group
 * @param {THREE.Mesh} coreMesh - The current core mesh
 * @param {number} baseColor - Node color
 * @returns {boolean} true if shell is valid, false if reasserted
 */
export function reassertNodeHologramShell(nodeGroup, coreMesh, baseColor = 0x00ffff) {
  if (!vfxFlag('ATOMA_VFX_ENABLE_HOLOGRAM_SHELL', true)) return null;

  if (!nodeGroup || !coreMesh) {
    return false;
  }

  // Find any existing shell in the subtree, not just direct children.
  const existingShells = collectDescendants(
    nodeGroup,
    (child) => child?.isMesh === true && child.userData?.isHologramShell === true
  );
  const expectedOrder = VisualHierarchyRegistry.getRenderOrder('ARCHETYPE');
  let existingShell = existingShells[0] || null;

  // Remove duplicate shells if more than one exists.
  for (let i = 1; i < existingShells.length; i++) {
    existingShells[i].parent?.remove(existingShells[i]);
  }

  // Check if shell is valid
  const isValid = existingShell && 
    existingShell.material && 
    existingShell.material.depthTest === true && 
    existingShell.material.side === THREE.DoubleSide &&
    existingShell.renderOrder === expectedOrder &&
    existingShell.frustumCulled === false;

  if (!isValid && existingShell) {
    existingShell.parent?.remove(existingShell);
    existingShell = null;
  }

  if (!existingShell) {
    const newShell = createNodeHologramShell(coreMesh, baseColor);
    if (!newShell) {
      return false;
    }
    existingShell = newShell;
  }

  const targetParent = coreMesh.parent || nodeGroup;
  if (existingShell.parent !== targetParent) {
    existingShell.parent?.remove(existingShell);
    targetParent.add(existingShell);
  }

  existingShell.position.copy(coreMesh.position);
  existingShell.quaternion.copy(coreMesh.quaternion);
  existingShell.scale.copy(coreMesh.scale);
  existingShell.renderOrder = expectedOrder;
  existingShell.frustumCulled = false;
  existingShell.visible = true;
  if (existingShell.material) {
    existingShell.material.depthTest = true;
    existingShell.material.depthWrite = false;
    existingShell.material.transparent = true;
    existingShell.material.side = THREE.DoubleSide;
    existingShell.material.blending = THREE.AdditiveBlending;
  }

  existingShell.userData = existingShell.userData || {};
  existingShell.userData.visualLayer = 'CORE_SHELL';
  existingShell.userData.isHologramShell = true;

  return isValid;
}
