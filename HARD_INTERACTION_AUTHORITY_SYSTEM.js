import * as THREE from 'three';

/**
 * ============================================================================
 * HARD INTERACTION AUTHORITY SYSTEM v1.0
 * ============================================================================
 * 
 * CRITICAL STABILIZATION SYSTEM
 * Enforces single source of truth for node interaction and link visuals
 * 
 * Purpose:
 * - Every node ALWAYS clickable
 * - Links ALWAYS use authoritative renderer
 * - No visual system can override interaction
 * - No aura, shader, metric, or event can block raycasting
 * 
 * Pattern:
 * - Guard clauses at system entry points
 * - Hard raycast gates on non-interactive meshes
 * - Frame-end enforcement loop (safety net)
 */

// ============================================================================
// 1. GLOBAL AUTHORITY FLAG
// ============================================================================

export function setupHardInteractionAuthority() {
  // Global flag - ALL visual systems check this
  window.VISUAL_AUTHORITY_LOCK = true;
  console.log('🔒 [HARD_AUTHORITY] Global flag: VISUAL_AUTHORITY_LOCK = true');
  
  return {
    isLocked: () => window.VISUAL_AUTHORITY_LOCK === true,
    lock: () => { window.VISUAL_AUTHORITY_LOCK = true; },
    unlock: () => { window.VISUAL_AUTHORITY_LOCK = false; },
    toggle: () => { window.VISUAL_AUTHORITY_LOCK = !window.VISUAL_AUTHORITY_LOCK; }
  };
}

// ============================================================================
// 2. NODE INTERACTION CORE ENFORCEMENT
// ============================================================================

/**
 * Enforce strict raycast authority: ONLY one mesh per node is interactive
 */
export function enforceNodeInteractionCore(node) {
  if (!node || !node.userData) return;
  
  const nodeId = node.userData.nodeId;
  const existingCores = [];
  
  // 1. Identify existing cores
  node.traverse((child) => {
    if ((child.isMesh || child.isLine || child.isPoints) && child.userData?.interactionCore === true) {
      existingCores.push(child);
    }
  });
  
  // 2. Resolve to exactly ONE core
  let activeCore = null;
  
  if (existingCores.length === 0) {
    // CREATE MISSING CORE (SAFE MODE)
    // Invisible proxy sphere - covers typical node volume
    // Geometry size is roughly based on standard node scale
    const geometry = new THREE.SphereGeometry(1.2, 8, 8);
    // Note: Use transparent/opacity=0 for invisible but raycastable proxy
    // material.visible=false would block raycasting in standard Three.js
    const material = new THREE.MeshBasicMaterial({ 
        visible: true, 
        transparent: true, 
        opacity: 0.0,
        depthWrite: false,
        side: THREE.DoubleSide
    });
    activeCore = new THREE.Mesh(geometry, material);
    activeCore.name = 'InteractionProxy';
    activeCore.userData = {
      interactionCore: true,
      isInteractionCore: true,
      isProxy: true, // Marker to skip visual enforcement
      nodeId: nodeId
    };
    node.add(activeCore);
    // console.log(`[HARD_AUTHORITY] Auto-created InteractionCore for node ${nodeId}`);
  } else {
    // Keep first, disable others
    activeCore = existingCores[0];
    if (existingCores.length > 1) {
       for (let i = 1; i < existingCores.length; i++) {
         existingCores[i].userData.interactionCore = false;
         existingCores[i].userData.isInteractionCore = false;
       }
    }
  }
  
  // 3. Enforce properties on Active Core
  if (activeCore) {
    activeCore.layers.enable(10); // INTERACTION_LAYER
    activeCore.userData.isInteractionCore = true;
    
    // Restore raycast if it was blocked
    if (activeCore.raycast && activeCore.raycast.toString().includes('() => null')) {
       delete activeCore.raycast; 
    }
    
    // Set direct reference
    node.interactionCore = activeCore;
    
    // Ensure core is visible to raycaster (object.visible must be true)
    activeCore.visible = true; 
  }

  // 4. Hard block ALL other meshes
  node.traverse((child) => {
    if ((child.isMesh || child.isLine || child.isPoints) && child !== activeCore) {
      child.layers.disable(10);
      child.userData.isInteractionCore = false;
      child.userData.nonInteractive = true;
      child.raycast = () => null; // HARD GATE - no raycasting allowed
    }
  });

  return true;
}

/**
 * Scan entire scene and enforce interaction cores on all nodes
 */
export function enforceAllNodeInteractionCores(scene) {
  const nodes = [];
  scene.traverse((obj) => {
    if (obj.userData?.isAINode || obj.userData?.nodeId) {
      nodes.push(obj);
    }
  });
  
  let enforced = 0;
  nodes.forEach(node => {
    if (enforceNodeInteractionCore(node)) {
      enforced++;
    }
  });
  
  console.log(`✅ [HARD_AUTHORITY] Interaction cores enforced on ${enforced} nodes`);
  return enforced;
}

// ============================================================================
// 3. LINK VISUAL AUTHORITY (HARD)
// ============================================================================

/**
 * Force all links to use a single authoritative renderer
 * Hard-disable all competing renderers
 */
export function enforceHardLinkVisualAuthority(linkingSystem) {
  if (!linkingSystem) return;
  
  // The authoritative renderer is linkingSystem.visuals (NeonLinkVisuals)
  const authoritativeRenderer = linkingSystem.visuals;
  
  if (!authoritativeRenderer) {
    console.warn('⚠️ [HARD_AUTHORITY] No authoritative renderer found');
    return;
  }
  
  // HARD-disable all competing renderers
  // Check for any legacy/experimental link renderers and dispose them
  const competingRendererPatterns = [
    'legacyLinkRenderer',
    'experimentalLinkRenderer',
    'debugLinkRenderer',
    'fallbackRenderer',
    'tempRenderer'
  ];
  
  competingRendererPatterns.forEach(pattern => {
    if (linkingSystem[pattern]) {
      try {
        if (typeof linkingSystem[pattern].dispose === 'function') {
          linkingSystem[pattern].dispose();
        }
        linkingSystem[pattern] = null;
        console.log(`🔒 [HARD_AUTHORITY] Disposed competing renderer: ${pattern}`);
      } catch (err) {
        console.warn(`⚠️ [HARD_AUTHORITY] Error disposing ${pattern}:`, err);
      }
    }
  });
  
  // Set authoritative renderer as the only active one
  linkingSystem.renderer = authoritativeRenderer;
  
  console.log('🔒 [HARD_AUTHORITY] Link visual authority enforced - NeonLinkVisuals is ONLY renderer');
  
  return authoritativeRenderer;
}

/**
 * Rebuild all links using authoritative renderer
 * Called after authority lock is enabled
 */
export function rebuildAllLinksWithAuthority(linkingSystem) {
  if (!linkingSystem || !linkingSystem.links) return 0;
  
  const linkCount = linkingSystem.links.length;
  
  // Clear all visual link meshes from scene
  linkingSystem.visuals?.clearAllVisualLinks?.();
  
  // Rebuild each link using ONLY the authoritative renderer
  linkingSystem.links.forEach(link => {
    try {
      linkingSystem.visuals?.renderLink?.(link);
    } catch (err) {
      console.warn('⚠️ [HARD_AUTHORITY] Error rebuilding link:', err);
    }
  });
  
  console.log(`✅ [HARD_AUTHORITY] Rebuilt ${linkCount} links with authoritative renderer`);
  return linkCount;
}

// ============================================================================
// 4. GLOBAL VISUAL GUARD - PREVENT ALL VISUAL MUTATIONS
// ============================================================================

/**
 * Install guard clauses at entry points of ALL visual systems
 * This prevents any system from modifying node/link visuals when authority lock is enabled
 */
export function shouldSkipVisualUpdate() {
  return window.VISUAL_AUTHORITY_LOCK === true;
}

/**
 * Pattern for all visual systems:
 * 
 * update() {
 *   if (shouldSkipVisualUpdate()) return;  // <-- ADD THIS
 *   // ... rest of visual update logic
 * }
 */

// ============================================================================
// 5. VISUAL SAFETY NET - LAST LINE OF DEFENSE
// ============================================================================

/**
 * Frame-end enforcement: Guarantee node cores remain visible and interactive
 * Run this at end of each frame/tick
 */
export function enforceNodeVisualSafetyNet(scene) {
  let enforced = 0;
  
  scene.traverse((obj) => {
    if (obj.userData?.isInteractionCore === true) {
      // SKIP PROXIES from visual enforcement (they should remain invisible)
      if (obj.userData.isProxy) {
          // Ensure object is visible for raycasting, but do NOT force material opacity
          if (!obj.visible) obj.visible = true;
          return;
      }

      // HARD enforcement: visual cores ALWAYS visible and fully opaque
      obj.visible = true;
      
      // Enforce material properties if object has material
      if (obj.material) {
        if (!Array.isArray(obj.material)) {
          obj.material.opacity = 1.0;
          obj.material.transparent = false;
          obj.material.depthTest = true;
          obj.material.depthWrite = true;
          obj.material.renderOrder = 10; // High priority
        } else {
          obj.material.forEach(mat => {
            mat.opacity = 1.0;
            mat.transparent = false;
            mat.depthTest = true;
            mat.depthWrite = true;
            mat.renderOrder = 10;
          });
        }
      }
      
      enforced++;
    }
  });
  
  if (enforced > 0 && false) { // Silent unless debug enabled
    console.debug(`[HARD_AUTHORITY] Safety net enforced ${enforced} node cores`);
  }
  
  return enforced;
}

// ============================================================================
// 6. RAYCASTER ISOLATION - ONLY INTERACTION LAYER
// ============================================================================

/**
 * Create a hardened raycaster that ONLY hits interaction cores
 */
export function createHardenedRaycaster(scene) {
  const raycaster = new THREE.Raycaster();
  
  // Store original intersectObjects
  const originalIntersect = raycaster.intersectObjects.bind(raycaster);
  
  // Override to ONLY check interaction layer
  raycaster.intersectObjects = function(objects, recursive) {
    // Filter to ONLY objects with isInteractionCore = true
    const interactiveCores = [];
    
    const collectInteractiveCores = (obj) => {
      if (obj.userData?.isInteractionCore === true) {
        interactiveCores.push(obj);
      }
      if (recursive && obj.children) {
        obj.children.forEach(child => collectInteractiveCores(child));
      }
    };
    
    objects.forEach(obj => collectInteractiveCores(obj));
    
    return originalIntersect(interactiveCores, false);
  };
  
  return raycaster;
}

// ============================================================================
// 7. INITIALIZATION - CALL THIS ONCE AT STARTUP
// ============================================================================

export function initializeHardInteractionAuthority(game) {
  console.log('🔒 [HARD_AUTHORITY] Initializing Hard Interaction Authority System v1.0');
  
  // 1. Enable global flag
  setupHardInteractionAuthority();
  
  // 2. Enforce all node interaction cores
  enforceAllNodeInteractionCores(game.scene);
  
  // 3. Enforce hard link visual authority
  if (game.linkingSystem) {
    enforceHardLinkVisualAuthority(game.linkingSystem);
    rebuildAllLinksWithAuthority(game.linkingSystem);
  }
  
  // 4. Create hardened raycaster for linking system
  if (game.linkingSystem) {
    game.linkingSystem.raycaster = createHardenedRaycaster(game.scene);
  }
  
  console.log('✅ [HARD_AUTHORITY] System initialized - Interaction & link authority established');
  
  return {
    enforceNodeCores: () => enforceAllNodeInteractionCores(game.scene),
    rebuildLinks: () => rebuildAllLinksWithAuthority(game.linkingSystem),
    safetyNet: () => enforceNodeVisualSafetyNet(game.scene),
    lock: () => { window.VISUAL_AUTHORITY_LOCK = true; },
    unlock: () => { window.VISUAL_AUTHORITY_LOCK = false; }
  };
}
