/**
 * LINKING SYSTEM HARDENING v1.0
 * 
 * Patches NodeLinkingSystem to enforce linking invariants.
 * Prevents node disappearance, loss of interaction, and silent corruption.
 * 
 * PATCHES:
 * 1. Guard removeLink() to prevent collateral damage
 * 2. Add verification hooks to createLink()
 * 3. Protect effect cleanup from node disposal
 * 4. Verify node state after each operation
 * 
 * INSTALLATION:
 * import { hardnNodeLinkingSystem } from './LinkingSystemHardening.js';
 * hardnNodeLinkingSystem(nodeLinkingSystem, aiNodes, scene, linkGuard);
 */

export function hardenNodeLinkingSystem(linkingSystem, aiNodes, scene, linkGuard) {
  if (!linkingSystem || !linkGuard) {
    console.warn('[LinkingSystemHardening] Cannot harden: missing linkingSystem or linkGuard');
    return;
  }
  
  console.log('[LinkingSystemHardening] Applying protections to NodeLinkingSystem');
  
  // ========== PATCH 1: Guard createLink() ==========
  const originalCreateLink = linkingSystem.createLink.bind(linkingSystem);
  linkingSystem.createLink = function(sourceNode, targetNode) {
    // PRE-LINK VERIFICATION
    const preCheckPassed = linkGuard.verifyNodesBeforeLink(sourceNode, targetNode);
    if (!preCheckPassed) {
      console.error('[LinkingSystemHardening] ❌ Pre-link check failed - aborting link creation');
      return null;
    }
    
    // EXECUTE ORIGINAL CREATE LINK
    try {
      const result = originalCreateLink(sourceNode, targetNode);
      
      // POST-LINK VERIFICATION
      const postCheckPassed = linkGuard.verifyNodesAfterLink(sourceNode, targetNode);
      if (!postCheckPassed) {
        console.error('[LinkingSystemHardening] ❌ Post-link corruption detected!');
        // Try to repair
        linkGuard.repairBrokenNode(sourceNode);
        linkGuard.repairBrokenNode(targetNode);
      }
      
      return result;
    } catch (err) {
      console.error('[LinkingSystemHardening] Exception during createLink:', err);
      // Emergency repair
      linkGuard.repairBrokenNode(sourceNode);
      linkGuard.repairBrokenNode(targetNode);
      throw err;
    }
  };
  
  // ========== PATCH 2: Guard removeLink() ==========
  const originalRemoveLink = linkingSystem.removeLink.bind(linkingSystem);
  linkingSystem.removeLink = function(link) {
    if (!link || !link.source || !link.target) {
      console.warn('[LinkingSystemHardening] removeLink called with invalid link');
      return;
    }
    
    // SNAPSHOT NODES BEFORE REMOVAL
    linkGuard.captureNodeState(link.source, 'preRemoveLink-source');
    linkGuard.captureNodeState(link.target, 'preRemoveLink-target');
    
    // EXECUTE ORIGINAL REMOVE LINK
    try {
      originalRemoveLink(link);
      
      // POST-REMOVAL VERIFICATION
      // Nodes should STILL exist after link removal
      if (!aiNodes.nodes.includes(link.source)) {
        console.error('[LinkingSystemHardening] ❌ Source node disappeared after removeLink!');
        linkGuard.repairBrokenNode(link.source);
      }
      
      if (!aiNodes.nodes.includes(link.target)) {
        console.error('[LinkingSystemHardening] ❌ Target node disappeared after removeLink!');
        linkGuard.repairBrokenNode(link.target);
      }
      
      // Verify links didn't corrupt the nodes
      if (link.source && !link.source.parent) {
        console.error('[LinkingSystemHardening] ❌ Source detached from parent after removeLink!');
        scene.add(link.source);
      }
      
      if (link.target && !link.target.parent) {
        console.error('[LinkingSystemHardening] ❌ Target detached from parent after removeLink!');
        scene.add(link.target);
      }
      
      console.debug('[LinkingSystemHardening] ✓ removeLink completed safely');
    } catch (err) {
      console.error('[LinkingSystemHardening] Exception during removeLink:', err);
      // Emergency repair
      if (link.source) linkGuard.repairBrokenNode(link.source);
      if (link.target) linkGuard.repairBrokenNode(link.target);
      throw err;
    }
  };
  
  // ========== PATCH 3: Guard updateLinkCurve() ==========
  const originalUpdateLinkCurve = linkingSystem.updateLinkCurve.bind(linkingSystem);
  linkingSystem.updateLinkCurve = function(link) {
    // Safety check: is link structure still valid?
    if (!link || !link.source || !link.target) {
      console.debug('[LinkingSystemHardening] updateLinkCurve skipped (invalid link)');
      return;
    }
    
    // Safety check: are nodes still in scene?
    if (!link.source.parent || !link.target.parent) {
      console.warn('[LinkingSystemHardening] updateLinkCurve skipped (node detached)');
      // Try to repair
      if (link.source && !link.source.parent) scene.add(link.source);
      if (link.target && !link.target.parent) scene.add(link.target);
      return;
    }
    
    try {
      return originalUpdateLinkCurve(link);
    } catch (err) {
      console.warn('[LinkingSystemHardening] updateLinkCurve error:', err.message);
      // Non-fatal - just skip this frame
    }
  };
  
  // ========== PATCH 4: Guard effect orchestrator integration ==========
  // Prevent effect cleanup from disposing node-related objects
  if (linkingSystem.effectOrchestrator) {
    const originalEffectTick = linkingSystem.effectOrchestrator.tick.bind(linkingSystem.effectOrchestrator);
    linkingSystem.effectOrchestrator.tick = function(deltaTime, time) {
      try {
        return originalEffectTick(deltaTime, time);
      } catch (err) {
        console.warn('[LinkingSystemHardening] Effect orchestrator error:', err.message);
        // Non-fatal - effects are cosmetic
      }
    };
  }
  
  // ========== PATCH 5: Add health check to update loop ==========
  // Periodically scan for broken nodes
  let healthCheckCounter = 0;
  const originalUpdate = linkingSystem.update.bind(linkingSystem);
  
  linkingSystem.update = function(deltaTime, time) {
    // Call original update
    const result = originalUpdate(deltaTime, time);
    
    // Every 60 frames, do a health check
    healthCheckCounter++;
    if (healthCheckCounter >= 60) {
      healthCheckCounter = 0;
      
      const brokenReport = linkGuard.detectBrokenNodes();
      if (brokenReport.brokenCount > 0) {
        console.warn('[LinkingSystemHardening] Found broken nodes during health check');
        
        // Auto-repair
        for (const detail of brokenReport.details) {
          const node = aiNodes.nodes.find(n => 
            (n.userData?.nodeId === detail.nodeId || n.uuid === detail.nodeId)
          );
          if (node) {
            linkGuard.repairBrokenNode(node);
          }
        }
      }
    }
    
    return result;
  };
  
  // ========== INSTALL REMOVAL GUARDS ==========
  // Prevent accidental scene.remove() on nodes
  linkGuard.createRemovalGuard();
  
  // ========== INSTALL DIAGNOSTIC HELPERS ==========
  // Add health check command to window for manual inspection
  window.__checkLinkingHealth = () => {
    const report = linkGuard.getHealthReport();
    console.table(report);
    return report;
  };
  
  window.__repairAllNodes = () => {
    const brokenReport = linkGuard.detectBrokenNodes();
    console.log(`[Manual Repair] Repairing ${brokenReport.brokenCount} broken nodes...`);
    
    for (const detail of brokenReport.details) {
      const node = aiNodes.nodes.find(n => 
        (n.userData?.nodeId === detail.nodeId || n.uuid === detail.nodeId)
      );
      if (node) {
        linkGuard.repairBrokenNode(node);
      }
    }
    
    return linkGuard.getHealthReport();
  };
  
  console.log('[LinkingSystemHardening] ✓ All protections installed');
  console.log('[LinkingSystemHardening] Commands: __checkLinkingHealth(), __repairAllNodes()');
}

export default hardenNodeLinkingSystem;
