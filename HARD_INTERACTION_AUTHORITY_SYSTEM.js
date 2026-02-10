import * as THREE from 'three';
import { tagAllowedSphere } from './VisualSpherePolicy.js';

const hardAuthDebugEnabled = () => (typeof window !== 'undefined' && window.ATOMA_DEBUG_HARD_INTERACTION_AUTHORITY === true);
const hardLog = (...args) => { if (hardAuthDebugEnabled()) hardLog(...args); };
const hardWarn = (...args) => { if (hardAuthDebugEnabled()) hardWarn(...args); };
const hardDebug = (...args) => { if (hardAuthDebugEnabled()) hardDebug(...args); };

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
  hardLog('🔒 [HARD_AUTHORITY] Global flag: VISUAL_AUTHORITY_LOCK = true');
  
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
    tagAllowedSphere(activeCore, {
      role: 'interactionProxy',
      source: 'HARD_INTERACTION_AUTHORITY_SYSTEM.enforceNodeInteractionCore',
      owner: nodeId
    });
    activeCore.name = 'InteractionProxy';
    activeCore.userData = {
      interactionCore: true,
      isInteractionCore: true,
      isProxy: true, // Marker to skip visual enforcement
      nodeId: nodeId
    };
    node.add(activeCore);
    // hardLog(`[HARD_AUTHORITY] Auto-created InteractionCore for node ${nodeId}`);
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
  
  hardLog(`✅ [HARD_AUTHORITY] Interaction cores enforced on ${enforced} nodes`);
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
    hardWarn('⚠️ [HARD_AUTHORITY] No authoritative renderer found');
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
        hardLog(`🔒 [HARD_AUTHORITY] Disposed competing renderer: ${pattern}`);
      } catch (err) {
        hardWarn(`⚠️ [HARD_AUTHORITY] Error disposing ${pattern}:`, err);
      }
    }
  });
  
  // Set authoritative renderer as the only active one
  linkingSystem.renderer = authoritativeRenderer;
  
  hardLog('🔒 [HARD_AUTHORITY] Link visual authority enforced - NeonLinkVisuals is ONLY renderer');
  
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
      hardWarn('⚠️ [HARD_AUTHORITY] Error rebuilding link:', err);
    }
  });
  
  hardLog(`✅ [HARD_AUTHORITY] Rebuilt ${linkCount} links with authoritative renderer`);
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
const FLAG_PROPS = ['transparent', 'depthWrite', 'depthTest', 'blending', 'side', 'alphaTest'];

function freezeInteractionFlags(material, props = FLAG_PROPS) {
  if (!material) return;
  if (!material.userData) material.userData = {};
  material.userData.__frozenVariantProps = material.userData.__frozenVariantProps || new Set();
  material.userData.__warnedVariantProp = material.userData.__warnedVariantProp || new Set();

  props.forEach((prop) => {
    if (material.userData.__frozenVariantProps.has(prop)) return;

    const desc = Object.getOwnPropertyDescriptor(material, prop);
    if (desc && desc.configurable === false) {
      if (!material.userData.__warnedVariantProp.has(prop)) {
        hardWarn('[HardInteractionAuthority] Prop already locked, skipping redefine', prop, material.uuid);
        material.userData.__warnedVariantProp.add(prop);
      }
      material.userData.__frozenVariantProps.add(prop);
      return;
    }

    const cachedValue = material[prop];
    try {
      Object.defineProperty(material, prop, {
        configurable: true,
        enumerable: true,
        get() { return cachedValue; },
        set(val) {
          if (val === cachedValue) return;
          if (!material.userData.__warnedVariantProp.has(prop)) {
            hardWarn('[HardInteractionAuthority] Blocked flag change after freeze:', prop, '->', val);
            material.userData.__warnedVariantProp.add(prop);
          }
        }
      });
      material.userData.__frozenVariantProps.add(prop);
    } catch (err) {
      if (!material.userData.__warnedVariantProp.has(prop)) {
        hardWarn('[HardInteractionAuthority] Failed to lock prop', prop, 'on', material.uuid, err?.message);
        material.userData.__warnedVariantProp.add(prop);
      }
    }
  });

  material.userData.__flagsFrozen = true;
  material.userData.__owner = material.userData.__owner || 'HardInteractionAuthority';
}

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

      // Apply once per core; skip if already frozen
      const materials = obj.material
        ? (Array.isArray(obj.material) ? obj.material : [obj.material])
        : [];

      let materialLocked = false;
      materials.forEach(mat => {
        if (!mat) return;

        if (!mat.userData?.__flagsFrozen) {
          // Set authoritative defaults once before freezing
          mat.opacity = 1.0;
          mat.transparent = false;
          mat.depthTest = true;
          mat.depthWrite = true;
          mat.renderOrder = 10; // High priority
        }

        freezeInteractionFlags(mat);
        materialLocked = materialLocked || mat.userData?.__flagsFrozen;
      });

      // Visibility enforcement is cheap; run once
      if (!obj.userData.__interactionVisibilityLocked) {
        obj.visible = true;
        obj.userData.__interactionVisibilityLocked = true;
      }
      
      if (materialLocked) enforced++;
    }
  });
  
  if (enforced > 0 && false) { // Silent unless debug enabled
    hardDebug(`[HARD_AUTHORITY] Safety net enforced ${enforced} node cores`);
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
  hardLog('🔒 [HARD_AUTHORITY] Initializing Hard Interaction Authority System v1.0');
  
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
  
  hardLog('✅ [HARD_AUTHORITY] System initialized - Interaction & link authority established');
  
  return {
    enforceNodeCores: () => enforceAllNodeInteractionCores(game.scene),
    rebuildLinks: () => rebuildAllLinksWithAuthority(game.linkingSystem),
    safetyNet: () => enforceNodeVisualSafetyNet(game.scene),
    lock: () => { window.VISUAL_AUTHORITY_LOCK = true; },
    unlock: () => { window.VISUAL_AUTHORITY_LOCK = false; }
  };
}

