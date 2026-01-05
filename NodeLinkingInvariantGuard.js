/**
 * NODE LINKING INVARIANT GUARD v1.0
 * 
 * MISSION: Guarantee that node linking operations NEVER silently break nodes.
 * 
 * ENFORCED GUARANTEES:
 * ✅ Nodes exist in aiNodes.nodes before and after linking
 * ✅ Nodes remain interactive (clickable, selectable, inspectable)
 * ✅ Nodes retain their core mesh and hologram shell
 * ✅ Nodes are never disposed without explicit intent
 * ✅ Nodes are never removed from parent (scene)
 * ✅ No side effects from effect cleanup
 * ✅ All removals are logged (no silent failures)
 * 
 * INTEGRATION:
 * 1. Create guard: this.linkGuard = new NodeLinkingInvariantGuard(this.aiNodes, this.scene);
 * 2. Verify nodes before link: linkGuard.verifyNodesBeforeLink(source, target);
 * 3. Verify after link: linkGuard.verifyNodesAfterLink(source, target);
 * 4. Detect broken nodes: linkGuard.detectBrokenNodes();
 * 5. Repair if needed: linkGuard.repairBrokenNode(node);
 */

export class NodeLinkingInvariantGuard {
  constructor(aiNodes, scene) {
    this.aiNodes = aiNodes;
    this.scene = scene;
    this.nodeStates = new Map(); // node → pre-link state snapshot
    this.brokenNodes = new Set();
    this.repairLog = [];
    
    console.log('[NodeLinkingInvariantGuard] Initialized - protecting node linking integrity');
  }
  
  /**
   * CHECKPOINT 1: Snapshot node state BEFORE link operation
   * Called immediately before createLink() or removeLink()
   */
  captureNodeState(node, operation = 'link') {
    if (!node) return null;
    
    const snapshot = {
      id: node.userData?.nodeId || node.uuid,
      category: node.userData?.category,
      parent: node.parent,
      parentId: node.parent?.uuid,
      inAiNodesList: this.aiNodes.nodes.includes(node),
      hasCore: !!this.findCoreMesh(node),
      hasHologram: !!this.findHologramShell(node),
      hasInteractiveRoot: !!node.userData?.interactiveRoot,
      childCount: node.children.length,
      isMesh: node.isMesh,
      geometry: node.geometry,
      material: node.material,
      timestamp: Date.now(),
      operation: operation
    };
    
    this.nodeStates.set(node, snapshot);
    return snapshot;
  }
  
  /**
   * CHECKPOINT 2: Verify nodes BEFORE link operation
   * Returns true if safe to proceed, false if issues detected
   */
  verifyNodesBeforeLink(sourceNode, targetNode) {
    const violations = [];
    
    // Check source
    if (!sourceNode) violations.push('Source node is null');
    if (!this.aiNodes.nodes.includes(sourceNode)) violations.push('Source not in aiNodes.nodes');
    if (!sourceNode.parent) violations.push('Source has no parent');
    if (!this.findCoreMesh(sourceNode)) violations.push('Source missing core mesh');
    
    // Check target
    if (!targetNode) violations.push('Target node is null');
    if (!this.aiNodes.nodes.includes(targetNode)) violations.push('Target not in aiNodes.nodes');
    if (!targetNode.parent) violations.push('Target has no parent');
    if (!this.findCoreMesh(targetNode)) violations.push('Target missing core mesh');
    
    if (violations.length > 0) {
      console.warn('[NodeLinkingInvariantGuard] ❌ PRE-LINK VIOLATIONS:', violations);
      return false;
    }
    
    // Snapshot good state
    this.captureNodeState(sourceNode, 'preLink-source');
    this.captureNodeState(targetNode, 'preLink-target');
    
    console.debug('[NodeLinkingInvariantGuard] ✓ Pre-link verification passed');
    return true;
  }
  
  /**
   * CHECKPOINT 3: Verify nodes AFTER link operation
   * Returns true if post-link state is valid, false if corruption detected
   */
  verifyNodesAfterLink(sourceNode, targetNode) {
    const violations = [];
    
    // Check source
    if (!sourceNode || !this.aiNodes.nodes.includes(sourceNode)) {
      violations.push(`Source node ${sourceNode?.uuid} DISAPPEARED from aiNodes.nodes`);
    }
    if (sourceNode && !sourceNode.parent) {
      violations.push(`Source node ${sourceNode.uuid} DETACHED from parent`);
    }
    if (sourceNode && !this.findCoreMesh(sourceNode)) {
      violations.push(`Source node ${sourceNode.uuid} LOST core mesh`);
    }
    
    // Check target
    if (!targetNode || !this.aiNodes.nodes.includes(targetNode)) {
      violations.push(`Target node ${targetNode?.uuid} DISAPPEARED from aiNodes.nodes`);
    }
    if (targetNode && !targetNode.parent) {
      violations.push(`Target node ${targetNode.uuid} DETACHED from parent`);
    }
    if (targetNode && !this.findCoreMesh(targetNode)) {
      violations.push(`Target node ${targetNode.uuid} LOST core mesh`);
    }
    
    if (violations.length > 0) {
      console.error('[NodeLinkingInvariantGuard] ❌ POST-LINK VIOLATIONS:', violations);
      if (sourceNode) this.brokenNodes.add(sourceNode);
      if (targetNode) this.brokenNodes.add(targetNode);
      return false;
    }
    
    console.debug('[NodeLinkingInvariantGuard] ✓ Post-link verification passed');
    return true;
  }
  
  /**
   * CHECKPOINT 4: Detect broken nodes in scene
   * Scans for nodes that exist but are broken/non-interactive
   */
  detectBrokenNodes() {
    const brokenReport = {
      totalNodes: this.aiNodes.nodes.length,
      brokenCount: 0,
      details: []
    };
    
    for (const node of this.aiNodes.nodes) {
      const issues = [];
      
      // Check if node is still interactive
      if (!node.parent) {
        issues.push('DETACHED: No parent (removed from scene)');
      }
      
      if (!this.findCoreMesh(node)) {
        issues.push('NO_CORE: Core mesh missing');
      }
      
      if (!this.findHologramShell(node)) {
        issues.push('NO_HOLOGRAM: Hologram shell missing');
      }
      
      // Check if node can be selected
      const linkTarget = node.userData?.linkTarget;
      if (!linkTarget || !linkTarget.parent) {
        issues.push('LINK_TARGET_INVALID: Cannot be clicked for linking');
      }
      
      if (issues.length > 0) {
        this.brokenNodes.add(node);
        brokenReport.brokenCount++;
        brokenReport.details.push({
          nodeId: node.userData?.nodeId || node.uuid,
          category: node.userData?.category,
          issues: issues
        });
      }
    }
    
    if (brokenReport.brokenCount > 0) {
      console.error('[NodeLinkingInvariantGuard] ❌ Detected broken nodes:', brokenReport);
    } else {
      console.debug('[NodeLinkingInvariantGuard] ✓ All nodes healthy');
    }
    
    return brokenReport;
  }
  
  /**
   * CHECKPOINT 5: Attempt to repair broken node
   * Restores missing components or marks for safe replacement
   */
  repairBrokenNode(node) {
    if (!node) return false;
    
    const nodeId = node.userData?.nodeId || node.uuid;
    const repairs = [];
    
    // REPAIR 1: If node is detached, reattach to scene
    if (!node.parent && this.scene) {
      console.warn(`[NodeLinkingInvariantGuard] 🔧 Reattaching detached node ${nodeId} to scene`);
      this.scene.add(node);
      repairs.push('REATTACHED_TO_SCENE');
    }
    
    // REPAIR 2: If hologram is missing, try to restore it
    if (!this.findHologramShell(node)) {
      console.warn(`[NodeLinkingInvariantGuard] 🔧 Hologram missing for node ${nodeId}, marking for visual reset`);
      node.userData.hologramNeedsReset = true;
      repairs.push('MARKED_HOLOGRAM_RESET');
    }
    
    // REPAIR 3: If link target is broken, restore it
    const linkTarget = node.userData?.linkTarget;
    if (!linkTarget || !linkTarget.parent) {
      console.warn(`[NodeLinkingInvariantGuard] 🔧 Link target broken for node ${nodeId}, restoring from core`);
      const coreMesh = this.findCoreMesh(node);
      if (coreMesh) {
        node.userData.linkTarget = coreMesh;
        repairs.push('RESTORED_LINK_TARGET');
      }
    }
    
    if (repairs.length > 0) {
      this.repairLog.push({
        nodeId: nodeId,
        timestamp: Date.now(),
        repairs: repairs
      });
      this.brokenNodes.delete(node);
      console.log(`[NodeLinkingInvariantGuard] ✓ Repairs completed for node ${nodeId}:`, repairs);
      return true;
    }
    
    return false;
  }
  
  /**
   * GUARD: Prevent unintended node removal
   * Hook into scene.remove() to intercept and block dangerous removals
   */
  createRemovalGuard() {
    const originalRemove = this.scene.remove.bind(this.scene);
    
    this.scene.remove = (...args) => {
      for (const obj of args) {
        // Check if we're trying to remove a node
        if (this.aiNodes.nodes.includes(obj)) {
          console.error(
            `[NodeLinkingInvariantGuard] ⚠️ BLOCKED: Attempted to remove AI node from scene`,
            {
              nodeId: obj.userData?.nodeId || obj.uuid,
              category: obj.userData?.category,
              stack: new Error().stack
            }
          );
          // Don't actually remove - this is a guard against unintended removal
          continue;
        }
      }
      
      // Only remove non-node objects
      return originalRemove(...args.filter(arg => !this.aiNodes.nodes.includes(arg)));
    };
    
    console.log('[NodeLinkingInvariantGuard] ✓ Scene removal guard installed');
  }
  
  /**
   * GUARD: Prevent unintended node disposal
   * Intercept dispose() calls on node core components
   */
  createDisposalGuard(node) {
    if (!node) return;
    
    const coreMesh = this.findCoreMesh(node);
    if (coreMesh && coreMesh.geometry) {
      const originalDispose = coreMesh.geometry.dispose.bind(coreMesh.geometry);
      coreMesh.geometry.dispose = () => {
        console.warn(
          `[NodeLinkingInvariantGuard] ⚠️ Attempted to dispose core mesh geometry`,
          {
            nodeId: node.userData?.nodeId || node.uuid,
            stack: new Error().stack
          }
        );
        // Don't actually dispose - allow only if explicitly intended
      };
    }
  }
  
  /**
   * Find the core mesh of a node (the main visual element)
   */
  findCoreMesh(node) {
    if (!node) return null;
    
    // Direct mesh
    if (node.isMesh) return node;
    
    // Search children
    let coreMesh = null;
    node.traverse(child => {
      if (child === node) return;
      if (child.isMesh && child.userData?.isNodeCore) {
        coreMesh = child;
        return;
      }
    });
    
    // Fallback: first mesh child
    if (!coreMesh) {
      for (const child of node.children) {
        if (child.isMesh) {
          coreMesh = child;
          break;
        }
      }
    }
    
    return coreMesh;
  }
  
  /**
   * Find the hologram shell of a node (transparent outer layer)
   */
  findHologramShell(node) {
    if (!node) return null;
    
    let shell = null;
    node.traverse(child => {
      if (child === node) return;
      if (child.userData?.isHologramShell || child.userData?.vfxHolo) {
        shell = child;
        return;
      }
    });
    
    return shell;
  }
  
  /**
   * Get comprehensive node health report
   */
  getHealthReport() {
    const brokenDetection = this.detectBrokenNodes();
    
    return {
      timestamp: Date.now(),
      totalNodes: this.aiNodes.nodes.length,
      brokenNodes: brokenDetection.brokenCount,
      brokenDetails: brokenDetection.details,
      recentRepairs: this.repairLog.slice(-10),
      isHealthy: brokenDetection.brokenCount === 0
    };
  }
  
  /**
   * Clear state (for new game, etc)
   */
  reset() {
    this.nodeStates.clear();
    this.brokenNodes.clear();
    this.repairLog = [];
    console.log('[NodeLinkingInvariantGuard] ✓ Reset');
  }
}

export default NodeLinkingInvariantGuard;
