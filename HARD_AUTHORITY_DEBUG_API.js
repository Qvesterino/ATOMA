/**
 * ============================================================================
 * HARD INTERACTION AUTHORITY - DEBUG CONSOLE API
 * ============================================================================
 * 
 * Testing & debugging commands for Session 104 stabilization system
 * 
 * Quick Reference:
 * 
 * 🔍 INSPECTION:
 * - checkAllNodes()           - Inspect all nodes and their interaction cores
 * - countInteractiveCores()   - Count nodes with exactly 1 interaction core
 * - checkNodeRaycasts()       - Verify ONLY cores are raycastable
 * - checkLinkVisualAuthority()- Verify link renderer authority
 * 
 * 🧪 TESTING:
 * - testNodeClicking()        - Test if all nodes are clickable
 * - testLinkVisuals()         - Verify links use authoritative renderer
 * - testVisualLock()          - Toggle VISUAL_AUTHORITY_LOCK
 * - testSafetyNet()           - Run frame-end safety net manually
 * 
 * 📊 DIAGNOSTICS:
 * - getNodeCountByType()      - Breakdown of node types
 * - getInteractionStats()     - Statistics on interaction cores
 * - getAuthoritativeRenderer()- Show which link renderer is active
 * 
 * 🎯 QUICK STATUS:
 * - reportSystemStatus()      - Full system health check
 */

export function setupHardAuthorityDebugAPI() {
  // Store reference to game instance
  window.__HARD_AUTHORITY_DEBUG__ = {
    lastTestResults: null,
    lastClickedNode: null,
    testStartTime: null
  };

  // ============================================================================
  // INSPECTION COMMANDS
  // ============================================================================

  /**
   * Inspect all nodes and their interaction cores
   */
  window.checkAllNodes = function() {
    if (!window.game || !window.game.scene) {
      console.log('❌ Game not ready');
      return;
    }

    const nodes = [];
    let totalCores = 0;

    window.game.scene.traverse((obj) => {
      if (obj.userData?.isAINode || obj.userData?.nodeId) {
        let coreCount = 0;
        obj.traverse((child) => {
          if (child.userData?.isInteractionCore) {
            coreCount++;
            totalCores++;
          }
        });
        nodes.push({
          id: obj.userData?.nodeId,
          name: obj.name,
          cores: coreCount,
          hasCollider: !!obj.userData?.collider
        });
      }
    });

    console.table(nodes);
    console.log(`✅ Total nodes: ${nodes.length}, Total cores: ${totalCores}`);
    
    return {
      nodes,
      totalCores,
      status: totalCores === nodes.length ? '✅ HEALTHY' : '⚠️ MISMATCH'
    };
  };

  /**
   * Count nodes with exactly 1 interaction core
   */
  window.countInteractiveCores = function() {
    const result = window.checkAllNodes();
    const healthy = result.nodes.filter(n => n.cores === 1).length;
    const warning = result.nodes.filter(n => n.cores !== 1).length;

    console.log(`
      ✅ Nodes with exactly 1 core: ${healthy}
      ⚠️  Nodes with wrong core count: ${warning}
      📊 Health: ${(healthy / result.nodes.length * 100).toFixed(1)}%
    `);

    return { healthy, warning, totalNodes: result.nodes.length };
  };

  /**
   * Verify ONLY cores are raycastable
   */
  window.checkNodeRaycasts = function() {
    if (!window.game || !window.game.scene) {
      console.log('❌ Game not ready');
      return;
    }

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(0, 0);
    raycaster.setFromCamera(mouse, window.game.camera);

    let nonCoreRaycastable = 0;
    let coresNotRaycastable = 0;

    window.game.scene.traverse((obj) => {
      if (obj.isMesh) {
        const isCore = obj.userData?.isInteractionCore === true;
        const hasCustomRaycast = obj.raycast !== THREE.Mesh.prototype.raycast;

        if (!isCore && !hasCustomRaycast) {
          nonCoreRaycastable++;
          console.warn(`⚠️ Non-core mesh is raycastable: ${obj.name}`);
        }
        if (isCore && hasCustomRaycast) {
          coresNotRaycastable++;
          console.warn(`⚠️ Core mesh has blocked raycast: ${obj.name}`);
        }
      }
    });

    const status = nonCoreRaycastable === 0 && coresNotRaycastable === 0 ? '✅ GOOD' : '⚠️ ISSUES';
    console.log(`
      Raycast Check: ${status}
      Non-core raycastable: ${nonCoreRaycastable}
      Core raycast blocked: ${coresNotRaycastable}
    `);

    return { nonCoreRaycastable, coresNotRaycastable, status };
  };

  /**
   * Verify link renderer authority
   */
  window.checkLinkVisualAuthority = function() {
    if (!window.game || !window.game.linkingSystem) {
      console.log('❌ Linking system not ready');
      return;
    }

    const linking = window.game.linkingSystem;
    const authoritativeRenderer = linking.visuals?.constructor?.name;
    const hasCompetingRenderers = !!(
      linking.legacyLinkRenderer ||
      linking.experimentalLinkRenderer ||
      linking.debugLinkRenderer
    );

    console.log(`
      🔒 Link Renderer Authority:
      Authoritative: ${authoritativeRenderer}
      Competing renderers disposed: ${!hasCompetingRenderers ? '✅ YES' : '❌ NO'}
      Active renderer: ${linking.renderer?.constructor?.name}
      Total links: ${linking.links?.length || 0}
    `);

    return {
      authoritativeRenderer,
      hasCompetingRenderers,
      activeLinksCount: linking.links?.length || 0
    };
  };

  // ============================================================================
  // TESTING COMMANDS
  // ============================================================================

  /**
   * Test if all nodes are clickable
   */
  window.testNodeClicking = function() {
    if (!window.game || !window.game.linkingSystem) {
      console.log('❌ Game not ready');
      return;
    }

    const linking = window.game.linkingSystem;
    const raycaster = linking.raycaster || new THREE.Raycaster();
    
    let clickableCount = 0;
    let unclickableCount = 0;
    const unclickableNodes = [];

    window.game.aiNodes?.nodes?.forEach((node, idx) => {
      // Simulate raycasting to node position
      const nodePos = node.position.clone();
      const cameraDir = nodePos.clone().sub(window.game.camera.position).normalize();
      
      raycaster.ray.direction.copy(cameraDir);
      raycaster.ray.origin.copy(window.game.camera.position);
      
      // Try to intersect this node
      globalThis.console?.log?.("[RAYCAST]", "HARD_AUTHORITY_DEBUG_API.js", "targets:", 1);
      const intersects = raycaster.intersectObject(node, true);
      
      if (intersects.length > 0) {
        clickableCount++;
      } else {
        unclickableCount++;
        unclickableNodes.push({
          index: idx,
          id: node.userData?.nodeId,
          name: node.name
        });
      }
    });

    console.log(`
      🎯 Node Clicking Test:
      ✅ Clickable: ${clickableCount}
      ❌ Unclickable: ${unclickableCount}
      Status: ${unclickableCount === 0 ? '✅ ALL CLICKABLE' : '⚠️ SOME UNCLICKABLE'}
    `);

    if (unclickableNodes.length > 0) {
      console.warn('Unclickable nodes:', unclickableNodes);
    }

    return {
      clickableCount,
      unclickableCount,
      unclickableNodes,
      allClickable: unclickableCount === 0
    };
  };

  /**
   * Verify links use authoritative renderer
   */
  window.testLinkVisuals = function() {
    if (!window.game || !window.game.linkingSystem) {
      console.log('❌ Linking system not ready');
      return;
    }

    const linking = window.game.linkingSystem;
    const links = linking.links || [];
    
    let linksWithVisuals = 0;
    let linksWithoutVisuals = 0;

    links.forEach(link => {
      if (link && link.mesh) {
        linksWithVisuals++;
      } else {
        linksWithoutVisuals++;
      }
    });

    const authorityStatus = linking.renderer === linking.visuals ? '✅ CORRECT' : '❌ WRONG';

    console.log(`
      🔗 Link Visual Authority Test:
      Renderer authority: ${authorityStatus}
      Links with visuals: ${linksWithVisuals}
      Links without visuals: ${linksWithoutVisuals}
      Total links: ${links.length}
      Status: ${linksWithoutVisuals === 0 ? '✅ HEALTHY' : '⚠️ DEGRADED'}
    `);

    return {
      linksWithVisuals,
      linksWithoutVisuals,
      authorityCorrect: linking.renderer === linking.visuals,
      totalLinks: links.length
    };
  };

  /**
   * Toggle visual authority lock
   */
  window.testVisualLock = function(enable = null) {
    if (enable === null) {
      // Toggle
      window.VISUAL_AUTHORITY_LOCK = !window.VISUAL_AUTHORITY_LOCK;
    } else {
      window.VISUAL_AUTHORITY_LOCK = enable;
    }

    const status = window.VISUAL_AUTHORITY_LOCK ? '🔒 LOCKED' : '🔓 UNLOCKED';
    console.log(`Visual Authority Lock: ${status}`);

    return window.VISUAL_AUTHORITY_LOCK;
  };

  /**
   * Run frame-end safety net manually
   */
  window.testSafetyNet = function() {
    if (!window.game || !window.game.hardInteractionAuthority) {
      console.log('❌ Hard authority system not ready');
      return;
    }

    const before = window.game.scene.children.length;
    window.game.hardInteractionAuthority.safetyNet();
    const after = window.game.scene.children.length;

    console.log(`
      🛡️ Safety Net Test:
      Scene objects before: ${before}
      Scene objects after: ${after}
      Status: ✅ RAN
    `);
  };

  // ============================================================================
  // DIAGNOSTIC COMMANDS
  // ============================================================================

  /**
   * Get breakdown of node types
   */
  window.getNodeCountByType = function() {
    const nodes = window.game.aiNodes?.nodes || [];
    const byType = {};

    nodes.forEach(node => {
      const category = node.userData?.category || 'unknown';
      byType[category] = (byType[category] || 0) + 1;
    });

    console.table(byType);
    return byType;
  };

  /**
   * Get interaction statistics
   */
  window.getInteractionStats = function() {
    const result = window.checkAllNodes();
    const healthy = result.nodes.filter(n => n.cores === 1).length;
    const multiCore = result.nodes.filter(n => n.cores > 1).length;
    const noCore = result.nodes.filter(n => n.cores === 0).length;

    const stats = {
      'Healthy (1 core)': healthy,
      'Multiple cores': multiCore,
      'No cores': noCore,
      'Total nodes': result.nodes.length,
      'Health %': (healthy / result.nodes.length * 100).toFixed(1)
    };

    console.table(stats);
    return stats;
  };

  /**
   * Show authoritative renderer
   */
  window.getAuthoritativeRenderer = function() {
    const linking = window.game?.linkingSystem;
    if (!linking) {
      console.log('❌ Linking system not ready');
      return;
    }

    return {
      authoritative: linking.visuals?.constructor?.name || 'unknown',
      current: linking.renderer?.constructor?.name || 'unknown',
      isCorrect: linking.renderer === linking.visuals
    };
  };

  // ============================================================================
  // STATUS REPORT
  // ============================================================================

  /**
   * Full system health check
   */
  window.reportSystemStatus = function() {
    console.clear();
    console.log('🔒 HARD INTERACTION AUTHORITY SYSTEM - STATUS REPORT\n');

    // 1. Authority Flag
    console.log(`1️⃣  Global Flags:`);
    console.log(`   VISUAL_AUTHORITY_LOCK: ${window.VISUAL_AUTHORITY_LOCK ? '🔒 ON' : '🔓 OFF'}`);
    console.log(`   DEBUG_VISUAL_MODE: ${window.DEBUG_VISUAL_MODE ? '⚠️ ON' : '✅ OFF'}\n`);

    // 2. Node Cores
    console.log(`2️⃣  Node Interaction Cores:`);
    const coreStats = window.getInteractionStats();
    Object.entries(coreStats).forEach(([k, v]) => {
      console.log(`   ${k}: ${v}`);
    });
    console.log();

    // 3. Link Authority
    console.log(`3️⃣  Link Visual Authority:`);
    const linkAuth = window.checkLinkVisualAuthority();
    console.log(`   Authoritative: ${linkAuth.authoritativeRenderer}`);
    console.log(`   No competing renderers: ${!linkAuth.hasCompetingRenderers ? '✅' : '❌'}`);
    console.log(`   Total links: ${linkAuth.activeLinksCount}\n`);

    // 4. Raycast Health
    console.log(`4️⃣  Raycast Health:`);
    const raycastCheck = window.checkNodeRaycasts();
    console.log(`   Non-core raycastable: ${raycastCheck.nonCoreRaycastable}`);
    console.log(`   Core raycast blocked: ${raycastCheck.coresNotRaycastable}`);
    console.log(`   Status: ${raycastCheck.status}\n`);

    // 5. Click Test
    console.log(`5️⃣  Node Clicking:`);
    const clickTest = window.testNodeClicking();
    console.log(`   Clickable: ${clickTest.clickableCount}`);
    console.log(`   Unclickable: ${clickTest.unclickableCount}`);
    console.log(`   All clickable: ${clickTest.allClickable ? '✅' : '❌'}\n`);

    // Summary
    const allGood = !linkAuth.hasCompetingRenderers &&
                    raycastCheck.status === '✅ GOOD' &&
                    clickTest.allClickable;

    console.log('═'.repeat(50));
    if (allGood) {
      console.log('✅ SYSTEM STATUS: ALL SYSTEMS OPERATIONAL');
    } else {
      console.log('⚠️  SYSTEM STATUS: ISSUES DETECTED');
    }
    console.log('═'.repeat(50));
  };

  console.log('✅ Hard Authority Debug API installed');
  console.log('   - reportSystemStatus() - Full system check');
  console.log('   - checkAllNodes() - Inspect all nodes');
  console.log('   - testNodeClicking() - Test if nodes are clickable');
  console.log('   - checkLinkVisualAuthority() - Verify link renderer');
}
