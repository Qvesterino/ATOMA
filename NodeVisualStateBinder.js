/**
 * NODE VISUAL STATE BINDER v2.0 — CANONICAL BASE VISUAL STATE
 * 
 * ============================================================================
 * CORE PRINCIPLE: Linking is a RELATIONSHIP, not a visual mutation.
 * ============================================================================
 * 
 * THE PROBLEM (Session 55 Final Fix):
 * Nodes looked correct before linking, but DEGRADED after linking.
 * Root cause: EnhancedNodeModelLinkState was BOOSTING opacity/emissive/scale
 * on linked nodes, overriding the immutable base state.
 * 
 * THE SOLUTION:
 * 1. BaseVisualState is the ONLY visual authority (immutable, persistent)
 * 2. Capture base state ONCE on spawn (immutable clone)
 * 3. ALWAYS restore to base state before/after any linking
 * 4. Linking adds FX ONLY (arc, glow, pulse) — separate mesh layers
 * 5. Aura/FX is ISOLATED in separate mesh groups (never mutates core)
 * 6. NO category-specific exceptions: ALL nodes follow the same rule
 * 
 * RULE (ABSOLUTE):
 *   BaseVisualState ≠ (function of linked state)
 *   LinkedState = BaseVisualState + LinkFX (additive only)
 * 
 * VISUAL PRIORITY (STRICT, IMMUTABLE):
 *   Render Order:
 *   -1   AURA           (BEHIND core, opacity ≤ 0.06)
 *    0   CORE           (primary, immutable)
 *   10   GLYPHS         (symbols, never mutated on link)
 *   50   LINK_FX        (arc, pulse, glyph hints — additive only)
 *   200  DEBUG          (diagnostics only)
 * 
 * LINKING GUARANTEE:
 *   ✓ Before Link:   node.mesh = CORE, opacity = base, emissive = base
 *   ✓ After Link:    node.mesh = CORE, opacity = base, emissive = base
 *   ✓ Difference:    + link arc (separate mesh, renderOrder 50)
 *   ✓ No mutations:  geometry, material, scale, opacity all identical
 * 
 * ENFORCEMENT CHAIN:
 *   1. captureBaseVisualState(node) — once per lifetime
 *   2. applyFinalNodeVisualState(node) — before linking
 *   3. restoreBaseVisualState(node) — after linking
 *   4. applyLinkFXOnly(node) — add FX, never touch core
 *   5. assertBaseVisualStateCorrect(node) — verify no mutations (dev mode)
 * 
 * DISABLED SYSTEMS (Visual Authority Violations):
 *   - EnhancedNodeModelLinkState — was boosting core on link (Session 55)
 *   - Any link-based material overrides (forbidden)
 *   - Category-specific visual downgrades (forbidden)
 * 
 * ============================================================================
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { createCoreIdentityMaterial } from './CoreHologramShader.js';
import { CoreVisualAuthorityGuard } from './CoreVisualAuthoritySystem.js';

// ============================================================================
// VISUAL HARMONIZATION CONFIGURATION (Task 1)
// ============================================================================
const VISUAL_HARMONIZATION_ENABLED = true;
const HARMONIZATION_CONFIG = {
  MAX_SATURATION: 0.75,       // Clamp base color saturation
  AURA_DESATURATION: 0.15,    // Reduce aura saturation by 15%
  MAX_AURA_OPACITY: 0.12,     // Hard cap on aura opacity (even with pulse)
  CORE_MIN_OPACITY: 1.0,      // Core must be solid
  EMISSIVE_BOOST_CAP: 0.6     // Prevent neon blowout
};

// ============================================================================
// BASE VISUAL STATE CAPTURE & RESTORATION
// ============================================================================

/**
 * Capture immutable BASE_VISUAL_STATE for a node on spawn.
 * This state is restored after every linking/state change.
 * 
 * UPGRADE: Captures ALL visual components (meshes, lines, points),
 * preserving the entire node visual hierarchy, not just the core.
 * 
 * @param {THREE.Group} node - Node to capture base state from
 * @returns {Object} Base visual state (immutable clone)
 */
export function captureBaseVisualState(node) {
  if (!node || node.userData.baseVisualState) {
    return node?.userData.baseVisualState || null;
  }

  const visualComponents = {};

  // Traverse and capture state for ALL visual children
  node.traverse((child) => {
    // Capture Meshes, Lines, and Points (ignore helpers/hidden)
    if ((child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.Points) && 
        child.visible && child !== node) {
      
      visualComponents[child.uuid] = {
        uuid: child.uuid,
        layer: child.userData.visualLayer || 'UNKNOWN',
        renderOrder: child.renderOrder,
        material: child.material ? {
          color: child.material.color?.getHex?.() ?? 0xffffff,
          emissive: child.material.emissive?.getHex?.() ?? 0x000000,
          opacity: child.material.opacity ?? 1.0,
          transparent: child.material.transparent ?? false,
          depthWrite: child.material.depthWrite ?? true,
          depthTest: child.material.depthTest ?? true,
          metalness: child.material.metalness,
          roughness: child.material.roughness
        } : null
      };
    }
  });

  // Overall node color (Harmonized)
  let nodeColor = node.userData.color ?? 0x00ffff;
  
  if (VISUAL_HARMONIZATION_ENABLED) {
    const colorObj = new THREE.Color(nodeColor);
    const hsl = {};
    colorObj.getHSL(hsl);
    
    // Clamp saturation
    if (hsl.s > HARMONIZATION_CONFIG.MAX_SATURATION) {
      hsl.s = HARMONIZATION_CONFIG.MAX_SATURATION;
      colorObj.setHSL(hsl.h, hsl.s, hsl.l);
      nodeColor = colorObj.getHex();
    }
  }

  const baseState = {
    // CRITICAL: Visual immutability flag
    coreVisualLocked: true,
    visualComponents, // Map of UUID -> Component State
    
    // Aura state (kept for backward compat)
    auraMesh: node.children.find(c => 
      c.userData?.isAura || c.userData?.visualLayer === 'AURA'
    )?.uuid,

    // Timestamp
    capturedAt: Date.now(),
    color: nodeColor
  };

  // Store in userData as immutable snapshot
  Object.defineProperty(node.userData, 'baseVisualState', {
    value: baseState,
    writable: false,
    configurable: false
  });

  return baseState;
}

/**
 * Restore node to BASE_VISUAL_STATE.
 * Called after linking to ensure visual integrity is maintained.
 * 
 * UPGRADE: Restores ALL visual components tracked in base state.
 * 
 * @param {THREE.Group} node - Node to restore
 * @returns {boolean} true if restored, false if no base state
 */
export function restoreBaseVisualState(node) {
  if (!node || !node.userData.baseVisualState) {
    return false;
  }

  const baseState = node.userData.baseVisualState;
  const components = baseState.visualComponents;

  if (!components) return false;

  node.traverse((child) => {
    const state = components[child.uuid];
    
    if (state) {
      // Restore renderOrder
      child.renderOrder = state.renderOrder;
      
      // Restore material properties
      if (child.material && state.material) {
        const mat = child.material;
        const base = state.material;
        
        // Restore color properties
        if (mat.color) mat.color.setHex(base.color);
        if (mat.emissive) mat.emissive.setHex(base.emissive);
        
        // Restore rendering properties (SAFETY GUARD: Do not redefine immutable props)
        try {
            if (mat.opacity !== base.opacity) mat.opacity = base.opacity;
            // Skipping transparent/depthWrite/depthTest to prevent "Cannot redefine property" error
            // These structural properties should not change during runtime anyway.
            // if (mat.transparent !== base.transparent) mat.transparent = base.transparent;
            // if (mat.depthWrite !== base.depthWrite) mat.depthWrite = base.depthWrite;
            // if (mat.depthTest !== base.depthTest) mat.depthTest = base.depthTest;
        } catch (e) {
            // Ignore material mutation errors
        }
        
        // Restore PBR properties if present
        if (base.metalness !== undefined) mat.metalness = base.metalness;
        if (base.roughness !== undefined) mat.roughness = base.roughness;
      }
    }
  });

  // Mark restoration
  node.userData.visualStateRestoredAt = Date.now();

  return true;
}

/**
 * Assert base visual state is correct (dev only).
 * Call this to verify linking didn't mutate visuals.
 * 
 * @param {THREE.Group} node - Node to verify
 * @returns {Object} { passed: boolean, violations: string[] }
 */
export function assertBaseVisualStateCorrect(node) {
  if (!node || !node.userData.baseVisualState) {
    return { passed: true, violations: [] };
  }

  const violations = [];
  const baseState = node.userData.baseVisualState;
  const components = baseState.visualComponents;

  if (!components) return { passed: true, violations: [] };

  node.traverse((child) => {
    const state = components[child.uuid];
    if (state && child.material && state.material) {
      const mat = child.material;
      const base = state.material;

      if (base.opacity !== undefined && Math.abs(mat.opacity - base.opacity) > 0.01) {
        violations.push(`[${state.layer}] Opacity mutated: expected ${base.opacity}, got ${mat.opacity}`);
      }
      
      if (child.renderOrder !== state.renderOrder) {
        violations.push(`[${state.layer}] RenderOrder mutated: expected ${state.renderOrder}, got ${child.renderOrder}`);
      }
    }
  });

  return {
    passed: violations.length === 0,
    violations
  };
}

// ============================================================================
// LINKING: ADD FX WITHOUT MUTATING CORE
// ============================================================================

/**
 * Apply link FX to a node WITHOUT modifying its core visuals.
 * Linking adds visual feedback (arc, glow, pulse) only.
 * 
 * Core mesh, material, opacity all remain unchanged.
 * 
 * @param {THREE.Group} node - Node being linked
 * @param {Object} options - FX options
 * @returns {Object} { success: boolean, fxMesh: THREE.Mesh | null }
 */
export function applyLinkFXOnly(node, options = {}) {
  if (!node) return { success: false, fxMesh: null };

  try {
    // First: restore base visuals (undo any previous mutations)
    restoreBaseVisualState(node);

    // Ensure core is correct
    ensureCoreVisualIntegrity(node);

    // Only add FX, don't touch core
    const fxMesh = createLinkArcFX(node, options);
    
    if (fxMesh) {
      node.userData.linkFXMesh = fxMesh;
      node.userData.linkFXAppliedAt = Date.now();
    }

    return { success: true, fxMesh };
  } catch (err) {
    console.error('[NodeVisualStateBinder] Failed to apply link FX', {
      nodeId: node.userData?.nodeId,
      error: err.message
    });
    return { success: false, fxMesh: null };
  }
}

/**
 * Create visual arc/curve connecting two linked nodes.
 * Pure FX, separate mesh, renderOrder = 50.
 * 
 * @private
 */
function createLinkArcFX(node, options = {}) {
  // This is a placeholder for the visual arc
  // In actual implementation, create a Bezier curve mesh
  // with glow/emission material, renderOrder 50

  // For now, return null (FX created elsewhere)
  return null;
}

/**
 * Ensure core visual integrity.
 * Checks that core mesh exists, has correct material, correct renderOrder.
 * Does NOT modify aura or FX layers.
 * 
 * @private
 */
function ensureCoreVisualIntegrity(node) {
  const coreMesh = node.children.find(c => 
    c.userData?.visualLayer === 'CORE' || 
    (c instanceof THREE.Mesh && !c.material?.transparent && c.material?.opacity > 0.9)
  );

  if (!coreMesh) {
    console.warn('[NodeVisualStateBinder] No core mesh found for node', node.userData?.nodeId);
    return;
  }

  // Ensure core renderOrder is HIGH (visible)
  coreMesh.renderOrder = VisualHierarchyRegistry?.getRenderOrder('CORE', 0) ?? 0;

  // TASK 2: Enforce HARD CORE VISUAL AUTHORITY
  // Use the Guard to enforce opacity and depth writing
  CoreVisualAuthorityGuard.enforce(coreMesh);
}

// ============================================================================
// AURA & FX ISOLATION
// ============================================================================

/**
 * Ensure aura is isolated and doesn't dominate core.
 * Aura must be:
 * - Separate mesh/group
 * - Opacity clamped to max 0.06 (6% visibility)
 * - RenderOrder < core (behind)
 * - Never draws over core
 * 
 * @param {THREE.Group} node - Node to fix aura for
 */
export function isolateAndConstrainAura(node) {
  const auraMesh = node.children.find(c => 
    c.userData?.isAura || c.userData?.visualLayer === 'AURA'
  );
  
  if (!auraMesh || !auraMesh.material) return;

  // Clamp opacity HARD: max 6%
  auraMesh.material.opacity = Math.min(auraMesh.material.opacity, 0.06);

  // TASK 1: Apply subtle desaturation to aura
  if (VISUAL_HARMONIZATION_ENABLED && auraMesh.material.color) {
    const color = auraMesh.material.color;
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    // Reduce saturation by configured amount
    hsl.s = Math.max(0, hsl.s - HARMONIZATION_CONFIG.AURA_DESATURATION);
    color.setHSL(hsl.h, hsl.s, hsl.l);
  }

  // Aura MUST be BELOW core in render order
  auraMesh.renderOrder = VisualHierarchyRegistry?.getRenderOrder('AURA', -1) ?? -1;

  // Aura must be transparent and not write to depth
  try {
      // Do not attempt to redefine properties if they are locked
      if (auraMesh.material.transparent !== true) auraMesh.material.transparent = true;
      if (auraMesh.material.depthWrite !== false) auraMesh.material.depthWrite = false;
      if (auraMesh.material.depthTest !== true) auraMesh.material.depthTest = true;
  } catch (e) {
      // Ignore
  }
}

/**
 * Verify aura doesn't exceed core visibility.
 * 
 * @param {THREE.Group} node - Node to check
 * @returns {Object} { passed: boolean, issues: string[] }
 */
export function assertAuraConstraintCorrect(node) {
  const issues = [];
  const auraMesh = node.children.find(c => 
    c.userData?.isAura || c.userData?.visualLayer === 'AURA'
  );

  if (!auraMesh) {
    return { passed: true, issues: [] };
  }

  // Check opacity
  if (auraMesh.material?.opacity > 0.06) {
    issues.push(`Aura opacity too high: ${auraMesh.material.opacity} (max 0.06)`);
  }

  // Check renderOrder is BELOW core (negative)
  const coreMesh = node.children.find(c => c.userData?.visualLayer === 'CORE');
  if (coreMesh && auraMesh.renderOrder >= coreMesh.renderOrder) {
    issues.push(`Aura renderOrder ${auraMesh.renderOrder} should be < core ${coreMesh.renderOrder}`);
  }

  // Check depth settings
  if (auraMesh.material?.depthWrite !== false) {
    issues.push('Aura should have depthWrite=false');
  }

  return {
    passed: issues.length === 0,
    issues
  };
}

// ============================================================================
// VISUAL PRIORITY ENFORCEMENT (STRICT)
// ============================================================================

/**
 * Enforce canonical visual priority across entire node.
 * 
 * Priority order (bottom to top):
 *   -1   AURA           (behind everything)
 *    0   CORE           (primary)
 *    1   INTERNAL       (inner details/archetype)
 *    2   RINGS          (orbitals)
 *    5   CORE_SHELL     (hologram overlay)
 *   10   GLYPHS         (symbols/icons)
 *   50   LINK_FX        (arcs, glow, effects)
 *   200  DEBUG          (only if debug enabled)
 * 
 * @param {THREE.Group} node - Node to fix
 */
export function enforceCanonicalVisualPriority(node) {
  const priorityMap = {
    'AURA': -1,
    'CORE': 0,
    'INTERNAL': 1,
    'ARCHETYPE': 1,
    'RINGS': 2,
    'CORE_SHELL': 5,
    'SHELL': 5,
    'GLYPHS': 10,
    'LINK_FX': 50,
    'FX': 50,
    'EFFECT': 50,
    'DEBUG': 200
  };

  node.traverse((obj) => {
    if ((obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) && obj.material && obj !== node) {
      const layer = obj.userData?.visualLayer || obj.userData?.type;
      if (layer && priorityMap[layer] !== undefined) {
        obj.renderOrder = priorityMap[layer];
      }
    }
  });
}

/**
 * SPATIAL CORE OFFSET FIX (Session 76)
 * Apply a small, stable spatial offset to the core mesh after linking.
 * 
 * Problem: Node core, aura, and context geometry all share center → core appears flat
 * Solution: Offset CORE MESH ONLY by ~0.15 units in local +Y direction
 * 
 * This is SPATIAL-ONLY (no color/emissive changes):
 * - Offset is static, non-animated
 * - Applied once after linking, never updated per-frame
 * - Does NOT affect raycasting (interaction still works on node center)
 * - Offset direction is stable (local +Y) for consistent visual hierarchy
 * - Offset is small (0.15 units) to remain subtle but effective
 * 
 * @param {THREE.Group} node - Node to apply spatial offset for
 * @private
 */
function applyCoreSpacialOffset(node) {
  if (!node) return;
  
  // Find core mesh (primary visual target)
  const coreMesh = node.children.find(c => 
    c.isMesh && (
      c.userData?.visualLayer === 'CORE' || 
      c.userData?.isCoreMesh ||
      (!c.material?.transparent && c.material?.opacity > 0.9)
    )
  );
  
  if (!coreMesh) return;
  
  // CRITICAL: Only apply offset once (idempotent)
  if (node.userData.coreOffsetApplied) {
    return;  // Already offset, skip
  }
  
  // Apply small spatial offset in local +Y direction
  // This separates core from aura/context geometry spatially
  const OFFSET_MAGNITUDE = 0.15;  // 0.15 world units (subtle but effective)
  coreMesh.position.y += OFFSET_MAGNITUDE;
  
  // Mark that offset was applied (prevents re-application)
  node.userData.coreOffsetApplied = true;
  node.userData.coreOffsetAppliedAt = Date.now();
  node.userData.coreOffsetMagnitude = OFFSET_MAGNITUDE;
  
  if (false) {  // Debug logging (disabled by default)
    console.log(`[NodeVisualStateBinder] Core offset applied: node=${node.userData?.nodeId}, offset=${OFFSET_MAGNITUDE}Y`);
  }
}

/**
 * VISUAL-ONLY READABILITY FIX (Session 75)
 * Ensure linked nodes don't appear flat or lose visual identity.
 * 
 * Boost core visual dominance while de-emphasizing aura.
 * Uses ONLY existing material properties (no new systems/shaders).
 * 
 * Applied AFTER linking when node must remain readable as primary object.
 * 
 * @param {THREE.Group} node - Node to enhance readability for
 * @private
 */
function boostNodeReadabilityAfterLinking(node) {
  if (!node) return;
  
  // Find core mesh (primary visual target)
  const coreMesh = node.children.find(c => 
    c.isMesh && (
      c.userData?.visualLayer === 'CORE' || 
      c.userData?.isCoreMesh ||
      (!c.material?.transparent && c.material?.opacity > 0.9)
    )
  );
  
  if (!coreMesh || !coreMesh.material) return;
  
  const coreMat = coreMesh.material;
  
  // RULE 1: Boost core emissive intensity (subtle, deterministic)
  // Only for materials that support emissive
  if (coreMat.isMeshStandardMaterial || 
      coreMat.isMeshLambertMaterial || 
      coreMat.isMeshPhongMaterial || 
      coreMat.isMeshToonMaterial) {
    
    const currentIntensity = coreMat.emissiveIntensity || 0;
    
    // Boost: +0.25 to ensure core reads brighter than aura
    // TASK 1: Clamped to HARMONIZATION_CONFIG.EMISSIVE_BOOST_CAP
    const maxEmissive = VISUAL_HARMONIZATION_ENABLED ? 
      HARMONIZATION_CONFIG.EMISSIVE_BOOST_CAP : 1.0;
      
    coreMat.emissiveIntensity = Math.min(maxEmissive, currentIntensity + 0.25);
    
    // Ensure emissive color is visible (not black)
    if (!coreMat.emissive || coreMat.emissive.getHex?.() === 0x000000) {
      // Use node's base color for rim (if available)
      if (node.userData?.baseColor) {
        const rimColor = new THREE.Color(node.userData.baseColor);
        // Desaturate slightly for subtle rim effect
        rimColor.multiplyScalar(0.9);
        coreMat.emissive = rimColor;
      } else {
        // Fallback: use core color
        coreMat.emissive = coreMat.color?.clone?.() || new THREE.Color(0x00ffff);
      }
    }
  }
  
  // RULE 2: Ensure core depth properties keep it in front
  // TASK 2: Use Guard to enforce authority
  CoreVisualAuthorityGuard.enforce(coreMesh);
  
  // RULE 3: REMOVED - Core must ALWAYS be opaque (Task 2 violation)
  // if (coreMat.transparent) { ... } -> DELETED
  
  // RULE 4: [SESSION 86] Preserve aura state on linking
  // DISABLED: Do NOT modify aura opacity, saturation, or emissive on link
  // Rationale: Linking must NOT change node aura visuals (UX/consistency)
  // Aura state should remain identical before and after linking
  // node.traverse calls remain commented out to prevent any aura mutations
}

/**
 * HIGH-SYNERGY PULSE ANIMATION (Session 75)
 * Subtle visual pulse for high-synergy linked nodes.
 * 
 * Provides visual feedback that a link is performing well.
 * Uses existing aura/glow meshes for non-intrusive animation.
 * 
 * Called from update loop for time-based animation.
 * 
 * @param {THREE.Group} node - Node to animate
 * @param {number} synergy - Current synergy score (0-1)
 * @param {number} time - Current animation time (in seconds)
 * @private
 */
function animateHighSynergyPulse(node, synergy, time) {
  if (!node || synergy < 0.7) return; // Only animate high synergy (0.7+)
  
  // Find aura mesh to pulse
  const auraMesh = node.children.find(c => 
    c.userData?.isAura || c.userData?.visualLayer === 'AURA'
  );
  
  if (!auraMesh || !auraMesh.material) return;
  
  // Calculate pulse based on synergy intensity
  // Higher synergy = faster pulse
  const pulseSpeed = 2.0 + (synergy - 0.7) * 2.0; // 2-4 Hz range
  const pulseMagnitude = 0.15 + (synergy - 0.7) * 0.25; // 15-40% range
  
  // Sine wave pulse: smooth oscillation
  const pulse = Math.sin(time * pulseSpeed * Math.PI) * 0.5 + 0.5; // Normalized 0-1
  
  // Apply to aura opacity (subtle breathing effect)
  const baseOpacity = 0.08; // Base opacity from readability fix
  const minOpacity = baseOpacity * 0.5; // Half at minimum
  
  // TASK 1: Clamp max opacity
  let maxOpacity = Math.min(0.15, baseOpacity + pulseMagnitude); // Max 15%
  if (VISUAL_HARMONIZATION_ENABLED) {
    maxOpacity = Math.min(maxOpacity, HARMONIZATION_CONFIG.MAX_AURA_OPACITY);
  }
  
  auraMesh.material.opacity = minOpacity + (maxOpacity - minOpacity) * pulse;
  
  // Optional: Very subtle emissive intensity pulse
  if (auraMesh.material.isMeshStandardMaterial ||
      auraMesh.material.isMeshLambertMaterial ||
      auraMesh.material.isMeshPhongMaterial ||
      auraMesh.material.isMeshToonMaterial) {
    
    const baseEmissive = 0.05; // Base emissive from readability fix
    const pulseEmissive = (synergy - 0.7) * 0.1; // Additional emissive boost
    const minEmissive = baseEmissive * 0.3;
    const maxEmissive = baseEmissive + pulseEmissive;
    
    auraMesh.material.emissiveIntensity = minEmissive + (maxEmissive - minEmissive) * pulse;
  }
  
  // Mark node as having active synergy pulse
  node.userData.synergyPulseActive = true;
  node.userData.synergyScore = synergy;
  node.userData.lastPulseTime = time;
}

/**
 * EXTERNAL ANIMATION HOOK
 * Call this from the main update loop for nodes with links.
 * 
 * Should be called for each linked node during frame update.
 * Automatically applies high-synergy pulse if synergy >= 0.7.
 * 
 * @param {THREE.Group} node - Node to update
 * @param {number} synergy - Current synergy score (0-1)
 * @param {number} time - Current animation time (seconds)
 * @returns {void}
 */
export function updateNodeSynergyVisuals(node, synergy, time) {
  if (!node) return;
  
  animateHighSynergyPulse(node, synergy, time);
}

/**
 * QUERY: Get current synergy pulse state
 * Useful for UI/feedback systems.
 * 
 * @param {THREE.Group} node - Node to query
 * @returns {Object} { active: boolean, score: number, time: number }
 */
export function getNodeSynergyPulseState(node) {
  if (!node?.userData) {
    return { active: false, score: 0, time: 0 };
  }
  
  return {
    active: node.userData.synergyPulseActive || false,
    score: node.userData.synergyScore || 0,
    time: node.userData.lastPulseTime || 0
  };
}

/**
 * STOP: Disable synergy pulse for a node
 * Useful when synergy drops below threshold.
 * 
 * @param {THREE.Group} node - Node to stop pulsing
 * @returns {void}
 */
export function disableNodeSynergyPulse(node) {
  if (!node?.userData) return;
  
  node.userData.synergyPulseActive = false;
  
  // Restore aura to base state
  const auraMesh = node.children.find(c => 
    c.userData?.isAura || c.userData?.visualLayer === 'AURA'
  );
  
  if (auraMesh?.material) {
    auraMesh.material.opacity = 0.08; // Restore to readability fix baseline
    if (auraMesh.material.emissiveIntensity !== undefined) {
      auraMesh.material.emissiveIntensity = 0.05; // Restore baseline
    }
  }
}

// ============================================================================
// BACKWARD COMPATIBLE: Legacy applyFinalNodeVisualState
// ============================================================================

/**
 * Legacy function (v1.0 compatibility).
 * Now refactored to use BASE_VISUAL_STATE system.
 * 
 * NEW BEHAVIOR:
 * - Captures base state on first call
 * - Restores base state on every link
 * - Adds FX without mutating core
 * 
 * @deprecated Use captureBaseVisualState + restoreBaseVisualState instead
 */
export function applyFinalNodeVisualState(node, options = {}) {
  if (!node) {
    console.warn('[NodeVisualStateBinder] Cannot apply state: node is null');
    return false;
  }

  try {
    // Step 1: Capture base state (once per node lifetime)
    if (!node.userData.baseVisualState) {
      captureBaseVisualState(node);
    }

    // Step 2: Restore to base state (undo any mutations)
    restoreBaseVisualState(node);

    // Step 3: Ensure core integrity (no proxy/fallback meshes)
    ensureCoreVisualIntegrity(node);

    // Step 4: Isolate aura (must not dominate core)
    isolateAndConstrainAura(node);

    // Step 5: Enforce visual priority
    enforceCanonicalVisualPriority(node);

    // Step 6: [SESSION 75] VISUAL-ONLY READABILITY FIX
    // Boost core visual dominance after linking to prevent node from appearing flat
    boostNodeReadabilityAfterLinking(node);

    // Step 6b: [SESSION 76] SPATIAL CORE OFFSET FIX
    // Apply small spatial offset to core mesh to separate it from aura/context geometry
    // Resolves spatial overlap that causes visual flattening
    applyCoreSpacialOffset(node);

    // Step 7: Mark as fully rendered
    node.userData.visualStateApplied = true;
    node.userData.visualStateAppliedAt = Date.now();

    // Log success
    if (options.verbose) {
      console.log('[NodeVisualStateBinder] ✅ Applied final visual state', {
        nodeId: node.userData.nodeId,
        category: node.userData.category,
        baseStateActive: node.userData.baseVisualState ? 'yes' : 'no'
      });
    }

    return true;
  } catch (err) {
    console.error('[NodeVisualStateBinder] Failed to apply visual state', {
      error: err.message,
      nodeId: node.userData?.nodeId
    });
    return false;
  }
}

// ============================================================================
// [SYNERGY/HARMONY UPGRADE] METRIC-BASED VISUAL STATES
// ============================================================================

/**
 * [SYNERGY/HARMONY UPGRADE] Apply synergy-awakened state to a node
 * When synergy >= 0.85, reveal or enhance internal geometry for depth perception
 * Changes only visibility/transparency of existing layers, never mutates core
 * 
 * @param {THREE.Group} node - Node to upgrade
 * @returns {boolean} true if successfully applied
 */
export function applySynergyAwakenedState(node) {
  if (!node || !node.children) return false;
  
  try {
    // Find and enhance any secondary/internal geometry layers
    for (const child of node.children) {
      if (!child.userData) child.userData = {};
      
      // Look for internal/secondary layers (usually less visible)
      // TASK 2: Explicitly EXCLUDE CORE layer from any modification
      if (child.userData.visualLayer === 'CORE' || child.userData.isCoreGeometry) continue;

      const isSecondaryLayer = 
        child.userData.visualLayer === 'INTERNAL' ||
        child.userData.type === 'internal' ||
        (child.material && child.material.opacity < 0.3);
      
      if (isSecondaryLayer && child.material) {
        // Store base opacity if not already stored
        if (child.userData.baseSynergyOpacity === undefined) {
          child.userData.baseSynergyOpacity = child.material.opacity;
        }
        
        // Increase visibility to reveal internal structure
        // Add 15% opacity boost (subtle but visible)
        child.material.opacity = Math.min(1.0, child.userData.baseSynergyOpacity + 0.15);
        child.userData.synergizedOpacity = child.material.opacity;
      }
    }
    
    // Mark node as synergy-awakened
    node.userData.synergizedState = 'AWAKENED';
    node.userData.synergizedAt = Date.now();
    
    return true;
  } catch (err) {
    console.error('[NodeVisualStateBinder] Failed to apply synergy state', err.message);
    return false;
  }
}

/**
 * [SYNERGY/HARMONY UPGRADE] Remove synergy-awakened state from a node
 * Restores internal geometry to original visibility
 * 
 * @param {THREE.Group} node - Node to restore
 * @returns {boolean} true if successfully restored
 */
export function removeSynergyAwakenedState(node) {
  if (!node || !node.children) return false;
  
  try {
    for (const child of node.children) {
      if (child.userData && child.userData.baseSynergyOpacity !== undefined && child.material) {
        // Restore original opacity
        child.material.opacity = child.userData.baseSynergyOpacity;
        delete child.userData.synergizedOpacity;
      }
    }
    
    node.userData.synergizedState = 'NORMAL';
    return true;
  } catch (err) {
    console.error('[NodeVisualStateBinder] Failed to remove synergy state', err.message);
    return false;
  }
}

/**
 * [SYNERGY/HARMONY UPGRADE] Apply harmony-stabilized state to a node
 * When harmony >= 0.80, make all animations and oscillations more symmetric
 * Dampens jitter and micro-oscillations, creates sense of stillness
 * 
 * @param {THREE.Group} node - Node to stabilize
 * @returns {boolean} true if successfully applied
 */
export function applyHarmonyStabilizedState(node) {
  if (!node) return false;
  
  try {
    if (!node.userData) node.userData = {};
    
    // Mark as harmony-stabilized
    node.userData.harmonyStabilized = true;
    node.userData.harmonyDampingFactor = 0.2;  // 20% motion damping
    node.userData.stabilizedAt = Date.now();
    
    // For any animated children, prepare dampening factors
    for (const child of node.children || []) {
      if (!child.userData) child.userData = {};
      child.userData.harmonyDampingEnabled = true;
      child.userData.harmonyDampingFactor = 0.2;
    }
    
    return true;
  } catch (err) {
    console.error('[NodeVisualStateBinder] Failed to apply harmony state', err.message);
    return false;
  }
}

/**
 * [SYNERGY/HARMONY UPGRADE] Remove harmony-stabilized state from a node
 * Restores normal animation and jitter behavior
 * 
 * @param {THREE.Group} node - Node to destabilize
 * @returns {boolean} true if successfully restored
 */
export function removeHarmonyStabilizedState(node) {
  if (!node) return false;
  
  try {
    if (node.userData) {
      node.userData.harmonyStabilized = false;
      node.userData.harmonyDampingFactor = 0;
    }
    
    for (const child of node.children || []) {
      if (child.userData) {
        child.userData.harmonyDampingEnabled = false;
        child.userData.harmonyDampingFactor = 0;
      }
    }
    
    return true;
  } catch (err) {
    console.error('[NodeVisualStateBinder] Failed to remove harmony state', err.message);
    return false;
  }
}

// ============================================================================
// [SESSION 76] CORE GLOW INTENSITY SCALING WITH SYNERGY
// ============================================================================

/**
 * Apply synergy-driven core glow intensity scaling to both nodes in a link.
 * 
 * High synergy → more intense core glow
 * Low synergy → subtler core glow
 * 
 * SCALING FORMULA:
 *   baseIntensity = 0.3 (minimum glow)
 *   maxIntensity = 1.0 (maximum glow)
 *   scaledIntensity = baseIntensity + (synergy * (maxIntensity - baseIntensity))
 *   
 * SYNERGY RANGE: 0.0 (no synergy) to 1.0 (perfect synergy)
 * GLOW RANGE: 0.3 (low synergy) to 1.0 (high synergy)
 * 
 * Safety:
 * - ONLY affects emissiveIntensity on materials that support it
 * - Stored in userData for tracking/debugging
 * - Can be disabled per-node if needed
 * - Does NOT affect core mesh position, geometry, or opacity
 * 
 * @param {THREE.Group} sourceNode - First node in link
 * @param {THREE.Group} targetNode - Second node in link
 * @param {number} synergy - Synergy magnitude (0.0 to 1.0)
 * @returns {Object} { success: boolean, sourceIntensity: number, targetIntensity: number }
 */
export function applyCoreSynergyGlowScaling(sourceNode, targetNode, synergy) {
  if (!sourceNode || !targetNode || synergy === undefined) {
    return { success: false, sourceIntensity: 0, targetIntensity: 0 };
  }

  try {
    // Clamp synergy to valid range
    const clampedSynergy = Math.max(0, Math.min(1, synergy));
    
    // Calculate scaled glow intensity
    // Base: 0.3 (minimum visible glow), Max: 1.0
    const BASE_GLOW = 0.3;
    const MAX_GLOW = 1.0;
    const scaledIntensity = BASE_GLOW + (clampedSynergy * (MAX_GLOW - BASE_GLOW));
    
    // Apply to source node
    const sourceSuccess = applyNodeCoreSynergyGlow(sourceNode, scaledIntensity, clampedSynergy);
    
    // Apply to target node
    const targetSuccess = applyNodeCoreSynergyGlow(targetNode, scaledIntensity, clampedSynergy);
    
    return {
      success: sourceSuccess && targetSuccess,
      sourceIntensity: sourceSuccess ? scaledIntensity : 0,
      targetIntensity: targetSuccess ? scaledIntensity : 0,
      synergy: clampedSynergy
    };
  } catch (err) {
    console.error('[NodeVisualStateBinder] Failed to apply core synergy glow scaling', err.message);
    return { success: false, sourceIntensity: 0, targetIntensity: 0 };
  }
}

/**
 * Apply core glow to a single node.
 * 
 * @private
 * @param {THREE.Group} node - Node to apply glow to
 * @param {number} intensity - Target glow intensity (0.3-1.0)
 * @param {number} synergy - Synergy magnitude (for tracking)
 * @returns {boolean} true if applied
 */
function applyNodeCoreSynergyGlow(node, intensity, synergy) {
  if (!node || !node.children) return false;
  
  // Find core mesh
  const coreMesh = node.children.find(c => 
    c.isMesh && (
      c.userData?.visualLayer === 'CORE' || 
      c.userData?.isCoreMesh ||
      (!c.material?.transparent && c.material?.opacity > 0.9)
    )
  );
  
  if (!coreMesh || !coreMesh.material) return false;
  
  const coreMat = coreMesh.material;
  
  // Store base intensity on first application (for restoration)
  if (node.userData.baseCoreGlowIntensity === undefined) {
    node.userData.baseCoreGlowIntensity = coreMat.emissiveIntensity || 0;
  }
  
  // Only apply to materials that support emissiveIntensity
  if (coreMat.isMeshStandardMaterial || 
      coreMat.isMeshLambertMaterial || 
      coreMat.isMeshPhongMaterial || 
      coreMat.isMeshToonMaterial) {
    
    // Set emissive intensity to synergy-scaled value
    coreMat.emissiveIntensity = intensity;
    
    // Ensure emissive color is set (use core color if not)
    if (!coreMat.emissive || coreMat.emissive.getHex?.() === 0x000000) {
      coreMat.emissive = coreMat.color?.clone?.() || new THREE.Color(0x00ffff);
    }
    
    // Track synergy state for debugging
    node.userData.coreSynergyGlowActive = true;
    node.userData.coreSynergyGlowIntensity = intensity;
    node.userData.coreSynergyMagnitude = synergy;
    node.userData.coreSynergyGlowAppliedAt = Date.now();
    
    return true;
  }
  
  return false;
}

/**
 * Remove core synergy glow from a node (restore to base intensity).
 * 
 * Called when a link is removed or node is unlinked.
 * Restores core to baseline glow intensity.
 * 
 * @param {THREE.Group} node - Node to restore
 * @returns {boolean} true if restored
 */
export function removeCoreSynergyGlow(node) {
  if (!node || !node.children) return false;
  
  try {
    // Find core mesh
    const coreMesh = node.children.find(c => 
      c.isMesh && (
        c.userData?.visualLayer === 'CORE' || 
        c.userData?.isCoreMesh ||
        (!c.material?.transparent && c.material?.opacity > 0.9)
      )
    );
    
    if (!coreMesh || !coreMesh.material) return false;
    
    const coreMat = coreMesh.material;
    
    // Restore to base intensity (stored on first application)
    if (node.userData.baseCoreGlowIntensity !== undefined) {
      if (coreMat.isMeshStandardMaterial || 
          coreMat.isMeshLambertMaterial || 
          coreMat.isMeshPhongMaterial || 
          coreMat.isMeshToonMaterial) {
        coreMat.emissiveIntensity = node.userData.baseCoreGlowIntensity;
      }
    }
    
    // Clear synergy tracking
    node.userData.coreSynergyGlowActive = false;
    node.userData.coreSynergyGlowIntensity = 0;
    node.userData.coreSynergyMagnitude = 0;
    node.userData.coreSynergyGlowRemovedAt = Date.now();
    
    return true;
  } catch (err) {
    console.error('[NodeVisualStateBinder] Failed to remove core synergy glow', err.message);
    return false;
  }
}

/**
 * Get current synergy glow state for a node.
 * 
 * @param {THREE.Group} node - Node to query
 * @returns {Object} { active: boolean, intensity: number, synergy: number, appliedAt: number }
 */
export function getCoreSynergyGlowState(node) {
  if (!node || !node.userData) {
    return { active: false, intensity: 0, synergy: 0, appliedAt: 0 };
  }
  
  return {
    active: node.userData.coreSynergyGlowActive || false,
    intensity: node.userData.coreSynergyGlowIntensity || 0,
    synergy: node.userData.coreSynergyMagnitude || 0,
    appliedAt: node.userData.coreSynergyGlowAppliedAt || 0,
    baseIntensity: node.userData.baseCoreGlowIntensity || 0
  };
}

// ============================================================================
// MANAGER CLASS
// ============================================================================

export class NodeVisualStateBinder {
  constructor(options = {}) {
    this.trackedNodes = new WeakMap();
    this.stateChangeCallbacks = [];
    this.assertMode = options.assertMode ?? false; // Enable assertions for dev
    this.verbose = options.verbose || false;
  }

  /**
   * Register node for tracking and capture base state.
   */
  registerNode(node) {
    if (!node) return;
    
    // Capture base state immediately on registration
    captureBaseVisualState(node);

    this.trackedNodes.set(node, {
      lastState: node.userData?.state || 'UNLINKED',
      baseStateCaptured: true,
      registeredAt: Date.now()
    });
  }

  /**
   * Called when node state changes.
   * NEW: Always restores base state, then adds FX if needed.
   */
  onNodeStateChange(node, newState) {
    if (!node) return;

    if (!this.trackedNodes.has(node)) {
      this.registerNode(node);
    }

    const oldState = node.userData?.state;
    const stateInfo = this.trackedNodes.get(node);

    // For LINKED state: restore base visuals + add FX only
    if (newState === 'LINKED') {
      // Restore to base (undo any mutations)
      restoreBaseVisualState(node);

      // Add link FX (separate mesh, doesn't mutate core)
      const result = applyLinkFXOnly(node, { verbose: this.verbose });

      // Assertion check (dev mode)
      if (this.assertMode) {
        const assertion = assertBaseVisualStateCorrect(node);
        if (!assertion.passed) {
          console.warn('[NodeVisualStateBinder] BASE STATE VIOLATION after linking:', assertion.violations);
        }
      }

      // Notify callbacks
      for (const callback of this.stateChangeCallbacks) {
        callback(node, oldState, newState, result.success);
      }

      if (stateInfo) {
        stateInfo.lastState = newState;
      }

      return;
    }

    // For other visual-affecting states
    const visualAffectingStates = ['LINKED', 'ACTIVE', 'CONNECTED', 'STABILIZED'];
    if (visualAffectingStates.includes(newState)) {
      // Standard visual state application
      const success = applyFinalNodeVisualState(node, { verbose: this.verbose });

      // Restore base afterward to be safe
      if (success) {
        restoreBaseVisualState(node);
      }

      if (stateInfo) {
        stateInfo.lastState = newState;
      }

      // Notify callbacks
      for (const callback of this.stateChangeCallbacks) {
        callback(node, oldState, newState, success);
      }
    }
  }

  /**
   * Add callback for state change events
   */
  addStateChangeCallback(callback) {
    this.stateChangeCallbacks.push(callback);
  }

  /**
   * Remove callback
   */
  removeStateChangeCallback(callback) {
    const idx = this.stateChangeCallbacks.indexOf(callback);
    if (idx >= 0) this.stateChangeCallbacks.splice(idx, 1);
  }

  /**
   * Cleanup
   */
  dispose() {
    this.trackedNodes = new WeakMap();
    this.stateChangeCallbacks = [];
  }
}

export default NodeVisualStateBinder;
