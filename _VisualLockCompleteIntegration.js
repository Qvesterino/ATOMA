/**
 * VISUAL LOCK COMPLETE INTEGRATION v1.0
 * 
 * ONE-SHOT integration that:
 * 1. Sets up auto-register system at node spawn time
 * 2. Patches AINodes.js to call auto-register for every spawn
 * 3. Sets up runtime repair (autodiscovery)
 * 4. Installs console diagnostics
 * 
 * Usage in main.js:
 * import { setupCompleteVisualLock } from './_VisualLockCompleteIntegration.js';
 * setupCompleteVisualLock(scene, renderer, aiNodes, visualAuthority);
 */

import * as THREE from 'three';
import { VisualRootAutoRegister } from './_VisualRootAutoRegister.js';
import { VisualLockDiagnostics } from './_VisualLockDiagnostics.js';

let globalAutoRegister = null;
let globalDiagnostics = null;
let globalRepairInterval = null;

export function setupCompleteVisualLock(scene, renderer, aiNodes, visualAuthority) {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║ VISUAL LOCK COMPLETE INTEGRATION v1.0               ║');
  console.log('║ Ensuring 100% node visibility with universal lock ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
  
  // ============================================================================
  // PART 1: Initialize auto-register system
  // ============================================================================
  globalAutoRegister = new VisualRootAutoRegister(visualAuthority);
  globalDiagnostics = new VisualLockDiagnostics(scene, visualAuthority, aiNodes);
  
  console.log('[SETUP] ✓ Auto-register system initialized');
  
  // ============================================================================
  // PART 2: Patch AINodes.createNode() to auto-register on spawn
  // ============================================================================
  if (aiNodes && typeof aiNodes.createNode === 'function') {
    const originalCreateNode = aiNodes.createNode.bind(aiNodes);
    
    aiNodes.createNode = function(category, position, index, isSpecial = false) {
      // Call original
      const node = originalCreateNode(category, position, index, isSpecial);
      
      // Determine node type
      let nodeType = 'legacy';
      if (node.userData?.isExtreme) {
        nodeType = 'extreme';
      } else if (node.userData?.category === 'mythic') {
        nodeType = 'mythic';
      } else if (node.userData?.category === 'prime') {
        nodeType = 'prime';
      }
      
      // AUTO-REGISTER immediately
      try {
        globalAutoRegister.registerNodeOnSpawn(node, nodeType);
      } catch (e) {
        console.warn(`[INTEGRATION] Auto-register failed for ${nodeType}:`, e.message);
      }
      
      return node;
    };
    
    console.log('[SETUP] ✓ Patched AINodes.createNode() with auto-register');
  }
  
  // ============================================================================
  // PART 3: Runtime repair (periodic autodiscovery for orphaned nodes)
  // ============================================================================
  if (globalRepairInterval) clearInterval(globalRepairInterval);
  
  globalRepairInterval = setInterval(() => {
    if (!aiNodes || !aiNodes.nodes) return;
    
    // Scan for unregistered nodes
    const unregistered = aiNodes.nodes.filter(n => !n.userData?.visualRoot);
    
    if (unregistered.length === 0) return;
    
    console.log(`[VISUAL_REPAIR] Found ${unregistered.length} unregistered nodes - autodiscovering...`);
    
    let fixed = 0;
    unregistered.forEach((node) => {
      if (globalAutoRegister.autodiscoverAndRegister(node)) {
        fixed++;
      }
    });
    
    if (fixed > 0) {
      console.log(`[VISUAL_REPAIR] ✓ Autodiscovered and registered ${fixed} nodes`);
    }
  }, 5000); // Run every 5 seconds
  
  console.log('[SETUP] ✓ Runtime repair system started (5s interval)');
  
  // ============================================================================
  // PART 4: Register existing nodes (for nodes spawned before this call)
  // ============================================================================
  if (aiNodes && aiNodes.nodes && aiNodes.nodes.length > 0) {
    console.log(`[SETUP] Registering ${aiNodes.nodes.length} existing nodes...`);
    
    let registered = 0;
    aiNodes.nodes.forEach((node) => {
      if (!node.userData?.visualRoot) {
        if (globalAutoRegister.autodiscoverAndRegister(node)) {
          registered++;
        }
      }
    });
    
    console.log(`[SETUP] ✓ Registered ${registered} existing nodes`);
  }
  
  // ============================================================================
  // PART 5: Install console APIs for diagnostics
  // ============================================================================
  window.__visualLock = {
    /**
     * Find all unregistered or broken nodes
     */
    findUnregisteredNodes() {
      return globalDiagnostics.findUnregisteredNodes();
    },
    
    /**
     * Dump detailed visual state for a node
     */
    dumpNodeVisual(nodeId) {
      globalDiagnostics.dumpNodeVisual(nodeId);
    },
    
    /**
     * Force rebind visualRoot for all nodes
     */
    forceRebindAll() {
      globalDiagnostics.forceRebindAll();
    },
    
    /**
     * Enable continuous monitoring
     */
    enableMonitoring(enable) {
      globalDiagnostics.enableMonitoring(enable);
    },
    
    /**
     * Get registration statistics
     */
    getStats() {
      return globalAutoRegister.getStats();
    },
    
    /**
     * Manually register a node (advanced)
     */
    registerNode(node, nodeType = 'legacy') {
      return globalAutoRegister.registerNodeOnSpawn(node, nodeType);
    },
    
    /**
     * Manually autodiscover a node (advanced)
     */
    autodiscover(node) {
      return globalAutoRegister.autodiscoverAndRegister(node);
    }
  };
  
  console.log('[SETUP] ✓ Console APIs installed');
  console.log('        Available commands:');
  console.log('        - window.__visualLock.findUnregisteredNodes()');
  console.log('        - window.__visualLock.dumpNodeVisual(nodeId)');
  console.log('        - window.__visualLock.forceRebindAll()');
  console.log('        - window.__visualLock.enableMonitoring(true)');
  console.log('        - window.__visualLock.getStats()');
  console.log('        - window.__visualLock.registerNode(node, type)');
  console.log('        - window.__visualLock.autodiscover(node)');
  
  // ============================================================================
  // PART 6: Setup frame monitoring (hook into renderer)
  // ============================================================================
  const originalRender = renderer.render.bind(renderer);
  
  let frameCounter = 0;
  renderer.render = function(scene, camera) {
    // Call original render
    originalRender(scene, camera);
    
    // Monitor every 60th frame (~1 second at 60fps)
    frameCounter = (frameCounter + 1) % 60;
    if (frameCounter === 0) {
      globalDiagnostics.monitorFrame();
    }
  };
  
  console.log('[SETUP] ✓ Frame monitoring installed');
  
  // ============================================================================
  // FINAL REPORT
  // ============================================================================
  console.log('\n✅ VISUAL LOCK COMPLETE INTEGRATION READY');
  console.log('   Every node will be auto-registered on spawn');
  console.log('   Orphaned nodes will be auto-discovered every 5 seconds');
  console.log('   Console diagnostics available via window.__visualLock\n');
}

/**
 * Teardown: Stop repair loop
 */
export function teardownCompleteVisualLock() {
  if (globalRepairInterval) {
    clearInterval(globalRepairInterval);
    globalRepairInterval = null;
  }
  console.log('[TEARDOWN] Visual lock integration stopped');
}
