/**
 * GLOBAL AURA OPACITY CLAMP INTEGRATION v1.0
 * 
 * Integrates the GlobalAuraOpacityClamp with NodeLinkingSystem
 * Automatically clamps aura opacity when nodes are linked
 * 
 * TASK 1 FIX: Ensures node aura never visually masks the node core after linking
 */

import * as THREE from 'three';

export function integrateGlobalAuraOpacityClamp(linkingSystem, opacityClamp) {
  if (!linkingSystem || !opacityClamp) {
    console.warn('[GlobalAuraOpacityClamp Integration] Missing linkingSystem or opacityClamp');
    return;
  }
  
  // Store reference for later use
  linkingSystem._globalAuraOpacityClamp = opacityClamp;
  
  // Hook into link creation callbacks
  linkingSystem.onLinkCreatedCallbacks = linkingSystem.onLinkCreatedCallbacks || [];
  linkingSystem.onLinkCreatedCallbacks.push((sourceNode, targetNode) => {
    // Clamp aura opacity on both nodes when they're linked
    clampNodeAurasOnLink(sourceNode, opacityClamp);
    clampNodeAurasOnLink(targetNode, opacityClamp);
  });
  
  console.log('[GlobalAuraOpacityClamp Integration] ✅ Integrated with NodeLinkingSystem');
}

/**
 * Clamp all auras in a node when it enters a linked state
 */
function clampNodeAurasOnLink(node, opacityClamp) {
  if (!node) return;
  
  const clampCount = opacityClamp.clampNodeAuras(node);
  
  if (clampCount > 0) {
    console.log(`[GlobalAuraOpacityClamp] ✅ Clamped ${clampCount} aura(s) on node ${node.userData?.nodeId?.substring(0, 8)}`);
  }
}

/**
 * Setup console debugging API for integration monitoring
 */
export function setupGlobalAuraOpacityClampIntegrationConsoleAPI(linkingSystem, opacityClamp) {
  if (!window.debugGlobalAuraOpacityClampIntegration) {
    window.debugGlobalAuraOpacityClampIntegration = {};
  }
  
  Object.assign(window.debugGlobalAuraOpacityClampIntegration, {
    // Verify integration is active
    checkIntegration: () => {
      const isIntegrated = linkingSystem && linkingSystem._globalAuraOpacityClamp;
      console.log(`✅ Integration status: ${isIntegrated ? 'ACTIVE' : 'INACTIVE'}`);
      return isIntegrated;
    },
    
    // Force clamp on selected node
    clampSelectedNode: () => {
      if (!linkingSystem.selectedNode) {
        console.warn('⚠️ No node selected');
        return;
      }
      const count = opacityClamp.clampNodeAuras(linkingSystem.selectedNode);
      console.log(`✅ Clamped ${count} auras on selected node`);
    },
    
    // Force clamp on all nodes in scene
    clampAllNodes: () => {
      let totalClamped = 0;
      for (const node of linkingSystem.aiNodes.nodes) {
        totalClamped += opacityClamp.clampNodeAuras(node) || 0;
      }
      console.log(`✅ Clamped ${totalClamped} auras across all nodes`);
    },
    
    // Get clamp statistics
    getStats: () => {
      const stats = {
        opacityClampActive: !!linkingSystem._globalAuraOpacityClamp,
        clampParameters: opacityClamp.clampParameters,
        maxAuraOpacity: opacityClamp.clampParameters.maxAuraOpacity
      };
      console.table(stats);
      return stats;
    },
    
    // Test: Create a link and verify aura clamping
    testLinkAndClamp: () => {
      if (linkingSystem.links.length < 1) {
        console.warn('⚠️ Need at least 1 link to test. Create a link first.');
        return;
      }
      
      const link = linkingSystem.links[0];
      console.log('📍 Testing first link:', link);
      
      // Check aura opacity before
      const sourceAuras = opacityClamp.findAuras(link.source);
      const targetAuras = opacityClamp.findAuras(link.target);
      
      console.log(`📊 Source node auras: ${sourceAuras.length}`);
      sourceAuras.forEach((aura, i) => {
        const info = opacityClamp.getClampInfo(aura);
        console.log(`  [${i}] Opacity: ${info.currentOpacity.toFixed(3)} (Original: ${info.originalOpacity?.toFixed(3) || 'unknown'}, Clamped: ${info.isClamped})`);
      });
      
      console.log(`📊 Target node auras: ${targetAuras.length}`);
      targetAuras.forEach((aura, i) => {
        const info = opacityClamp.getClampInfo(aura);
        console.log(`  [${i}] Opacity: ${info.currentOpacity.toFixed(3)} (Original: ${info.originalOpacity?.toFixed(3) || 'unknown'}, Clamped: ${info.isClamped})`);
      });
    },
    
    // Adjust clamp parameters dynamically
    setMaxOpacity: (value) => {
      if (value < 0 || value > 1) {
        console.warn('⚠️ Opacity must be between 0 and 1');
        return;
      }
      opacityClamp.clampParameters.maxAuraOpacity = value;
      console.log(`✅ Set maxAuraOpacity to ${value}`);
    }
  });
  
  console.log('✅ GlobalAuraOpacityClamp Integration console API ready: debugGlobalAuraOpacityClampIntegration.*');
}
