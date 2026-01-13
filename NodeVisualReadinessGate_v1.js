/**
 * NODE VISUAL READINESS GATE v1.0 — ABSOLUTE LIFECYCLE AUTHORITY
 * 
 * ============================================================================
 * CORE PRINCIPLE: No visual mutations until lifecycle is COMPLETE
 * ============================================================================
 * 
 * PROBLEM:
 * WaveShaderBridge_v1 and FXRuntime_v1 operate globally and continuously,
 * processing nodes BEFORE their visual lifecycle is complete.
 * Result: Fallback material replacement even without linking.
 * 
 * SOLUTION:
 * 1. Mark node as `visualReady = false` on spawn
 * 2. Set `visualReady = true` ONLY after complete visual initialization
 * 3. WaveShaderBridge and FXRuntime SKIP non-ready nodes (no mutations)
 * 4. Once visualReady = true, core material becomes IMMUTABLE
 * 
 * VISUAL LIFECYCLE:
 * SPAWN PHASE (visualReady = false):
 *   - Node group created
 *   - Meshes instantiated
 *   - Materials applied
 *   - Geometry assigned
 *   ✓ WaveShaderBridge SKIPS (registry incomplete)
 *   ✓ FXRuntime SKIPS (no processing)
 * 
 * BOOTSTRAP PHASE (visualReady = true):
 *   - Archetype materials assigned
 *   - Shader registration complete
 *   - Visual group attached to scene
 *   ✓ WaveShaderBridge can register/update
 *   ✓ FXRuntime can process
 * 
 * LOCKED PHASE (visualReady = true + IMMUTABLE):
 *   - Node visible and fully rendered
 *   - Core material CANNOT be replaced
 *   - Core material CANNOT be mutated
 *   - FX systems add overlays ONLY
 *   ✓ Linking preserves visuals
 *   ✓ All maps preserve visuals
 * 
 * ============================================================================
 */

/**
 * Mark node as VISUALLY READY.
 * Called ONLY after:
 * - Materials assigned and registered
 * - Archetype applied
 * - visualGroup attached to scene
 * 
 * IDEMPOTENT: Safe to call multiple times
 * 
 * @param {THREE.Group} node - Node to mark ready
 * @returns {boolean} true if marked, false if already ready
 */
export function markNodeVisualReady(node) {
  if (!node || !node.userData) {
    return false;
  }

  // Already ready, skip
  if (node.userData.visualReady === true) {
    return false;
  }

  // Mark as ready
  node.userData.visualReady = true;
  node.userData.visualReadyAt = Date.now();

  // LOCK: Make core material immutable by wrapping access
  lockCoreMaterialAccess(node);

  if (false) {  // Debug flag
    console.log('[NodeVisualReadinessGate] ✓ Node marked visualReady:', {
      nodeId: node.userData?.nodeId,
      category: node.userData?.category,
      materialUUID: node.userData?.baseMaterialUUID
    });
  }

  return true;
}

/**
 * Check if node is VISUALLY READY.
 * Return false for nodes still in spawn/bootstrap phase.
 * 
 * @param {THREE.Group} node - Node to check
 * @returns {boolean} true if ready, false if not
 */
export function isNodeVisualReady(node) {
  return node?.userData?.visualReady === true;
}

/**
 * LOCK core material access to prevent replacement/mutation.
 * Once locked, attempts to assign new material will be rejected.
 * 
 * @private
 */
function lockCoreMaterialAccess(node) {
  if (!node) return;

  const coreMesh = node.children.find(c =>
    c.userData?.visualLayer === 'CORE' ||
    c.userData?.isNodeCore ||
    (c.isMesh && !c.material?.transparent && c.material?.opacity > 0.9)
  );

  if (!coreMesh || !coreMesh.material) {
    return;
  }

  // Store original material UUID
  node.userData.coreMaterialUUID = coreMesh.material.uuid;
  node.userData.coreMaterialOriginal = coreMesh.material;

  // Wrap mesh.material setter to prevent replacement
  try {
    const originalMaterial = coreMesh.material;
    
    Object.defineProperty(coreMesh, 'material', {
      get() {
        return originalMaterial;
      },
      set(newMaterial) {
        // Reject replacement
        if (newMaterial && newMaterial.uuid !== originalMaterial.uuid) {
          console.warn(
            '[NodeVisualReadinessGate] BLOCKED: Attempt to replace core material! ' +
            `Expected UUID ${originalMaterial.uuid}, got ${newMaterial.uuid}. ` +
            'Core material is immutable.'
          );
          return;  // Silently reject
        }
        // Allow if same material (re-assignment)
        if (newMaterial === originalMaterial) {
          return;
        }
      },
      configurable: false
    });
  } catch (e) {
    // Property already defined or not configurable
    console.warn('[NodeVisualReadinessGate] Could not lock core material:', e.message);
  }
}

/**
 * GUARD: Check if node is ready BEFORE processing.
 * Used by WaveShaderBridge, FXRuntime, and other FX systems.
 * 
 * Returns false for nodes not yet ready (skip processing).
 * 
 * @param {THREE.Group} node - Node to check
 * @param {string} system - System name (for logging)
 * @returns {boolean} true if safe to process, false if should skip
 */
export function canProcessNodeVisuals(node, system = 'System') {
  if (!node) {
    return false;
  }

  // If visualReady explicitly set to false, skip
  if (node.userData?.visualReady === false) {
    return false;  // Skip, no logging (expected during spawn phase)
  }

  // If visualReady not set yet, assume not ready
  if (node.userData?.visualReady !== true) {
    return false;  // Skip, no logging (still in spawn phase)
  }

  // Node is ready
  return true;
}

/**
 * FILTER array of nodes to only ready ones.
 * Safe alternative to processing all nodes.
 * 
 * @param {Array<THREE.Group>} nodes - All nodes
 * @returns {Array<THREE.Group>} Only visualReady nodes
 */
export function filterReadyNodes(nodes) {
  if (!Array.isArray(nodes)) {
    return [];
  }

  return nodes.filter(node => isNodeVisualReady(node));
}

/**
 * REPORT: Get readiness status of node for debugging.
 * 
 * @param {THREE.Group} node - Node to inspect
 * @returns {Object} { ready: boolean, phase: string, reason: string }
 */
export function getVisualReadinessReport(node) {
  if (!node) {
    return { ready: false, phase: 'INVALID', reason: 'Node is null' };
  }

  const visualReady = node.userData?.visualReady;

  if (visualReady === true) {
    return {
      ready: true,
      phase: 'LOCKED',
      reason: 'Node visual lifecycle complete, immutable'
    };
  }

  if (visualReady === false) {
    return {
      ready: false,
      phase: 'SPAWN',
      reason: 'Node still in spawn/bootstrap phase'
    };
  }

  // Undefined
  return {
    ready: false,
    phase: 'UNINITIALIZED',
    reason: 'visualReady flag not set (legacy node?)'
  };
}

/**
 * BATCH: Mark multiple nodes as ready (for initialization).
 * 
 * @param {Array<THREE.Group>} nodes - Nodes to mark ready
 * @param {string} reason - Reason for batch marking (for logging)
 * @returns {number} Count of nodes marked ready
 */
export function markBatchNodesReady(nodes, reason = 'batch-init') {
  if (!Array.isArray(nodes)) {
    return 0;
  }

  let count = 0;
  for (const node of nodes) {
    if (markNodeVisualReady(node)) {
      count++;
    }
  }

  if (false) {  // Debug flag
    console.log(`[NodeVisualReadinessGate] Batch marked ${count} nodes ready (${reason})`);
  }

  return count;
}

/**
 * EXPORT: Readiness gate as standalone utility object
 */
export const VisualReadinessGate = {
  markReady: markNodeVisualReady,
  isReady: isNodeVisualReady,
  canProcess: canProcessNodeVisuals,
  filterReady: filterReadyNodes,
  report: getVisualReadinessReport,
  markBatch: markBatchNodesReady
};

export default VisualReadinessGate;
