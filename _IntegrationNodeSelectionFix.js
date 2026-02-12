/**
 * ============================================================================
 * INTEGRATION NODE SELECTION FIX v1.0
 * ============================================================================
 * Targeted compatibility fix for INTEGRATION nodes only.
 * 
 * PROBLEM:
 * - INTEGRATION nodes store nodeId on parent Group
 * - Raycast hits child mesh without nodeId
 * - Resolution fails because child mesh lacks metadata
 * 
 * SOLUTION (MINIMAL):
 * - If raycast hits mesh without nodeId, walk parent chain
 * - If parent is INTEGRATION node with nodeId, use parent
 * - Allow Group objects as resolved nodes for INTEGRATION only
 * - Safety check: resolved object must exist in aiNodes.nodes
 * 
 * NO CHANGES TO:
 * - Global selection logic
 * - Raycast filtering
 * - Other node categories
 * - Deselect rules
 * ============================================================================
 */

const filterRaycastIntersections = (intersections) => intersections || [];

/**
 * Special resolution for INTEGRATION nodes
 * 
 * LOGIC:
 * 1. If mesh has nodeId directly → return it (normal case)
 * 2. If mesh lacks nodeId:
 *    a. Walk parent chain (max 10 levels)
 *    b. If parent has nodeId AND category === "INTEGRATION"
 *    c. Return parent (even if it's a Group without geometry)
 * 3. Otherwise → return null
 * 
 * @param {THREE.Mesh} mesh - The raycast-hit mesh
 * @param {AINodes} aiNodes - AI nodes system for validation
 * @returns {THREE.Object3D|null} The resolved node or null
 */
export function resolveIntegrationNode(mesh, aiNodes) {
  if (!mesh || !aiNodes) return null;
  
  // Step 1: If mesh itself has nodeId, use it directly
  if (mesh.userData?.nodeId && mesh.userData?.category === "INTEGRATION") {
    // Validate it exists in aiNodes
    if (aiNodes.nodes.includes(mesh)) {
      return mesh;
    }
  }
  
  // Step 2: Walk parent chain for INTEGRATION nodes
  let current = mesh.parent;
  let depth = 0;
  const maxDepth = 10;  // Conservative limit
  
  while (current && depth < maxDepth) {
    // Check if this parent is an INTEGRATION node
    if (
      current.userData?.nodeId &&
      current.userData?.category === "INTEGRATION"
    ) {
      // Validate it exists in aiNodes
      if (aiNodes.nodes.includes(current)) {
        return current;  // FOUND: Return parent (even if Group without geometry)
      }
    }
    
    current = current.parent;
    depth++;
  }
  
  // Step 3: No INTEGRATION node found in chain
  return null;
}

/**
 * Selection gate for INTEGRATION nodes
 * Validates resolved node is actually selectable
 * 
 * @param {THREE.Object3D} node - The potentially resolved node
 * @returns {boolean} True if node is valid for selection
 */
export function validateIntegrationNode(node) {
  if (!node || !node.userData) return false;
  
  // Must have nodeId
  if (!node.userData.nodeId) return false;
  
  // Must be INTEGRATION category
  if (node.userData.category !== "INTEGRATION") return false;
  
  // Must NOT be marked notSelectable
  if (node.userData.notSelectable === true) return false;
  
  return true;
}

/**
 * ============================================================================
 * PATCH INSTALLATION
 * ============================================================================
 * Integrate into existing NodeLinkingSystem.getNodeAtPosition()
 */

export function patchIntegrationNodeSelection(linkingSystem, aiNodes) {
  if (!linkingSystem || !aiNodes) {
    console.warn('[IntegrationFix] Missing linkingSystem or aiNodes');
    return false;
  }
  
  console.log('[IntegrationFix] 🔧 Installing INTEGRATION node selection patch...');
  
  // Save original getNodeAtPosition
  const originalGetNodeAtPosition = linkingSystem.getNodeAtPosition.bind(linkingSystem);
  
  // Override to add INTEGRATION node handling
  linkingSystem.getNodeAtPosition = function(clientX, clientY) {
    // GUARD 1: Hard DOM safety check (CRITICAL FIX)
    // Prevent getBoundingClientRect() on undefined/null/invalid elements
    if (!this.renderer || !this.renderer.domElement || !(this.renderer.domElement instanceof HTMLElement)) {
      if (window.DEBUG_NODE_SELECTION) {
        console.warn('[IntegrationFix] Skipped: Renderer DOM element invalid or missing');
      }
      return null;
    }

    // GUARD 2: Input validation
    if (typeof clientX !== 'number' || typeof clientY !== 'number') {
      return null;
    }

    try {
      // Step 1: Try original logic first
      const node = originalGetNodeAtPosition(clientX, clientY);
      
      // Step 2: If original found a node, return it
      if (node) {
        return node;
      }
      
      // Step 3: If original failed, try INTEGRATION resolution
      // Perform raycast manually to get the mesh that was hit
      const rect = this.renderer.domElement.getBoundingClientRect();
      
      // GUARD 3: Validate rect dimensions to avoid Infinity/NaN
      if (rect.width === 0 || rect.height === 0) {
        return null; 
      }

      this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      
      this.raycaster.setFromCamera(this.mouse, this.camera);
      this.raycaster.far = this.interactionConfig?.maxLinkingDistance || 4000;
      this.raycaster.layers.enableAll();
      
      // Collect raycastable objects
      const meshesToTest = [];
      // GUARD 4: Ensure aiNodes exists and has nodes
      if (!this.aiNodes || !this.aiNodes.nodes) {
         return null;
      }

      for (const testNode of this.aiNodes.nodes) {
        if (testNode.userData?.category === "INTEGRATION") {
          // For INTEGRATION nodes, include all children (not just linkTarget)
          if (testNode.userData?.linkTarget) {
            meshesToTest.push(testNode.userData.linkTarget);
          } else {
            // Add all mesh children for parent chain resolution
            testNode.traverse((child) => {
              if (child.isMesh && child !== testNode) {
                meshesToTest.push(child);
              }
            });
          }
        }
      }
      
      if (meshesToTest.length === 0) {
        return null;  // No INTEGRATION meshes to test
      }
      
      // Perform raycast
      const intersects = this.raycaster.intersectObjects(meshesToTest, false);
      const filtered = filterRaycastIntersections(intersects);
      
      if (filtered.length === 0) {
        return null;  // No hit
      }
      
      // Try to resolve the hit to an INTEGRATION node
      const hitMesh = filtered[0].object;
      const resolvedNode = resolveIntegrationNode(hitMesh, this.aiNodes);
      
      if (resolvedNode && validateIntegrationNode(resolvedNode)) {
        if (window.DEBUG_NODE_SELECTION) {
             console.log('[IntegrationFix] Resolved INTEGRATION node:', resolvedNode.userData.nodeId);
        }
        return resolvedNode;  // FOUND: Return INTEGRATION node
      }
      
      // No valid INTEGRATION node resolved
      return null;
    } catch (err) {
      if (window.DEBUG_NODE_SELECTION) {
        console.debug('[IntegrationFix] Resolution error:', err.message);
      }
      return null;  // Graceful fail
    }
  };
  
  console.log('[IntegrationFix] ✅ INTEGRATION node selection patch installed');
  return true;
}

/**
 * ============================================================================
 * DEBUG API
 * ============================================================================
 */

export function setupIntegrationDebugAPI(aiNodes) {
  window.IntegrationDebug = {
    /**
     * Find all INTEGRATION nodes
     */
    listIntegrationNodes: () => {
      const integrations = aiNodes.nodes.filter(n => 
        n.userData?.category === "INTEGRATION"
      );
      return integrations.map(n => ({
        nodeId: n.userData?.nodeId,
        category: n.userData?.category,
        isGroup: !n.isMesh,
        children: n.children?.length || 0,
        hasMetadata: !!n.userData?.nodeId
      }));
    },
    
    /**
     * Check if an INTEGRATION node is selectable
     */
    checkNode: (nodeId) => {
      const node = aiNodes.nodes.find(n => n.userData?.nodeId === nodeId);
      if (!node) return { error: 'Node not found' };
      
      return {
        category: node.userData?.category,
        nodeId: node.userData?.nodeId,
        isSelectable: node.userData?.selectable,
        isGroup: !node.isMesh,
        childCount: node.children?.length || 0,
        canResolve: validateIntegrationNode(node)
      };
    },
    
    /**
     * Test resolution on a mesh
     */
    testResolution: (mesh) => {
      if (!mesh) return { error: 'No mesh provided' };
      
      const resolved = resolveIntegrationNode(mesh, aiNodes);
      
      if (!resolved) {
        return {
          error: 'No INTEGRATION node resolved',
          meshCategory: mesh.userData?.category,
          meshNodeId: mesh.userData?.nodeId
        };
      }
      
      return {
        resolved: true,
        nodeId: resolved.userData?.nodeId,
        category: resolved.userData?.category,
        isValid: validateIntegrationNode(resolved)
      };
    },
    
    /**
     * Get status of all INTEGRATION nodes
     */
    status: () => {
      const integrations = this.listIntegrationNodes();
      const valid = integrations.filter(n => n.hasMetadata).length;
      
      return {
        total_integration_nodes: integrations.length,
        valid: valid,
        invalid: integrations.length - valid,
        nodes: integrations
      };
    }
  };
  
  console.log('[IntegrationFix] Debug API available: window.IntegrationDebug');
}
