/**
 * SIMULATION AUDIT DEBUG HELPERS
 * Session 37+ Final Verification
 * 
 * Usage in browser console:
 * - window.__simAudit.findInvariantViolations()
 * - window.__simAudit.verifyTimingSync()
 * - window.__simAudit.verifyRareNodeRegistry()
 */

export function setupSimulationAuditHelpers(aiNodes, scene, effectOrchestrator) {
  const audit = {
    
    /**
     * Find potential simulation invariant violations
     */
    findInvariantViolations() {
      console.log('\n🔍 SIMULATION INVARIANT AUDIT\n');
      
      const violations = {
        rAF: [],
        setTimeout: [],
        setInterval: [],
        sceneNodesMissing: [],
        orphanedEffects: []
      };
      
      // Check orchestrator effects
      if (effectOrchestrator && effectOrchestrator.effects) {
        console.log(`📊 Orchestrator Status:`);
        console.log(`   Active Effects: ${effectOrchestrator.effects.length}`);
        console.log(`   Frame Index: ${effectOrchestrator.frameIndex}`);
        
        effectOrchestrator.effects.forEach(effect => {
          if (!effect.id || !effect.update) {
            violations.orphanedEffects.push({
              effect: effect,
              issue: 'Missing id or update method'
            });
          }
        });
      }
      
      // Check scene nodes vs registry
      if (aiNodes && aiNodes.nodes && scene) {
        console.log(`\n📊 Node Registry Status:`);
        console.log(`   Registry Total: ${aiNodes.nodes.length}`);
        
        // Count nodes in scene
        let sceneNodeCount = 0;
        scene.traverse((obj) => {
          if (obj.userData && obj.userData.isAINode) {
            sceneNodeCount++;
          }
        });
        
        console.log(`   Scene Total: ${sceneNodeCount}`);
        
        // Check for mismatches
        aiNodes.nodes.forEach((node, idx) => {
          if (!node || !node.parent) {
            violations.sceneNodesMissing.push({
              index: idx,
              nodeId: node?.uuid || 'unknown',
              issue: 'Node not in scene or orphaned'
            });
          }
        });
      }
      
      // Summary
      console.log(`\n⚠️  VIOLATIONS FOUND:`);
      console.log(`   requestAnimationFrame: ${violations.rAF.length}`);
      console.log(`   setTimeout: ${violations.setTimeout.length}`);
      console.log(`   setInterval: ${violations.setInterval.length}`);
      console.log(`   Missing Scene Nodes: ${violations.sceneNodesMissing.length}`);
      console.log(`   Orphaned Effects: ${violations.orphanedEffects.length}`);
      
      if (violations.sceneNodesMissing.length > 0) {
        console.warn(`\n❌ Node Registry Mismatches:`, violations.sceneNodesMissing);
      }
      
      if (violations.orphanedEffects.length > 0) {
        console.warn(`\n❌ Orphaned Effects:`, violations.orphanedEffects);
      }
      
      return {
        status: violations.sceneNodesMissing.length === 0 && violations.orphanedEffects.length === 0 ? 'PASS' : 'FAIL',
        violations
      };
    },
    
    /**
     * Verify all effects use deltaTime properly
     */
    verifyTimingSync() {
      console.log('\n⏱️  TIMING SYNCHRONIZATION AUDIT\n');
      
      if (!effectOrchestrator) {
        console.error('❌ Orchestrator not available');
        return { status: 'FAIL', reason: 'No orchestrator' };
      }
      
      const stats = {
        totalEffects: effectOrchestrator.effects.length,
        byType: {},
        allUsingElapsed: true,
        allUseDuration: true
      };
      
      effectOrchestrator.effects.forEach(effect => {
        const type = effect.type || 'unknown';
        stats.byType[type] = (stats.byType[type] || 0) + 1;
        
        // Check if effect has required properties
        if (effect.elapsed === undefined) stats.allUsingElapsed = false;
        if (effect.duration === undefined) stats.allUseDuration = false;
      });
      
      console.log(`📊 Effect Statistics:`);
      console.log(`   Total Active: ${stats.totalEffects}`);
      console.log(`   By Type:`, stats.byType);
      console.log(`   All Using Elapsed: ${stats.allUsingElapsed ? '✅' : '❌'}`);
      console.log(`   All Have Duration: ${stats.allUseDuration ? '✅' : '❌'}`);
      
      const passed = stats.allUsingElapsed && stats.allUseDuration;
      console.log(`\n${passed ? '✅ PASS' : '❌ FAIL'}: All effects frame-locked`);
      
      return {
        status: passed ? 'PASS' : 'FAIL',
        stats
      };
    },
    
    /**
     * Verify rare node registry integration
     */
    verifyRareNodeRegistry() {
      console.log('\n🌟 RARE NODE REGISTRY AUDIT\n');
      
      if (!aiNodes || !aiNodes.nodes) {
        console.error('❌ AINodes not available');
        return { status: 'FAIL', reason: 'No aiNodes' };
      }
      
      const rareNodes = aiNodes.nodes.filter(n => 
        n && n.userData && n.userData.rareType
      );
      
      console.log(`📊 Rare Node Status:`);
      console.log(`   Total Rare Nodes: ${rareNodes.length}`);
      
      const rareTypes = {};
      rareNodes.forEach(n => {
        const type = n.userData.rareType;
        rareTypes[type] = (rareTypes[type] || 0) + 1;
      });
      
      console.log(`   By Type:`, rareTypes);
      
      // Check registry alignment
      let registryErrors = 0;
      rareNodes.forEach((node, idx) => {
        if (!node.parent) {
          console.warn(`   ⚠️  Rare node ${idx} orphaned (not in scene)`);
          registryErrors++;
        }
        if (!node.userData.isAINode && !node.userData.isMaterializing) {
          console.warn(`   ⚠️  Rare node ${idx} missing AI flags`);
          registryErrors++;
        }
      });
      
      console.log(`\n${registryErrors === 0 ? '✅ PASS' : '❌ FAIL'}: ${registryErrors} registry errors`);
      
      return {
        status: registryErrors === 0 ? 'PASS' : 'FAIL',
        totalRareNodes: rareNodes.length,
        byType: rareTypes,
        errors: registryErrors
      };
    },
    
    /**
     * Run full diagnostic suite
     */
    runFullDiagnostics() {
      console.log('🔧 RUNNING FULL SIMULATION DIAGNOSTICS\n');
      console.log('════════════════════════════════════════\n');
      
      const invariants = this.findInvariantViolations();
      const timing = this.verifyTimingSync();
      const rareRegistry = this.verifyRareNodeRegistry();
      
      console.log('\n════════════════════════════════════════');
      console.log('\n📋 DIAGNOSTIC SUMMARY:\n');
      
      const allPass = invariants.status === 'PASS' && 
                      timing.status === 'PASS' && 
                      rareRegistry.status === 'PASS';
      
      console.log(`  Invariant Violations: ${invariants.status}`);
      console.log(`  Timing Synchronization: ${timing.status}`);
      console.log(`  Rare Node Registry: ${rareRegistry.status}`);
      
      console.log(`\n${allPass ? '✅ ALL CHECKS PASSED' : '❌ SOME CHECKS FAILED'}\n`);
      console.log('════════════════════════════════════════\n');
      
      return {
        overallStatus: allPass ? 'PASS' : 'FAIL',
        invariants,
        timing,
        rareRegistry
      };
    },
    
    /**
     * Get orchestrator statistics
     */
    getOrchestratorStats() {
      if (!effectOrchestrator) {
        console.error('❌ Orchestrator not available');
        return null;
      }
      
      const stats = {
        frameIndex: effectOrchestrator.frameIndex,
        activeEffects: effectOrchestrator.effects.length,
        effectsByType: {},
        totalDuration: 0,
        totalElapsed: 0
      };
      
      effectOrchestrator.effects.forEach(effect => {
        const type = effect.type || 'unknown';
        stats.effectsByType[type] = (stats.effectsByType[type] || 0) + 1;
        stats.totalDuration += effect.duration || 0;
        stats.totalElapsed += effect.elapsed || 0;
      });
      
      return stats;
    },
    
    /**
     * Print current effect list
     */
    listActiveEffects() {
      if (!effectOrchestrator) {
        console.error('❌ Orchestrator not available');
        return;
      }
      
      console.log('\n📋 ACTIVE EFFECTS\n');
      console.log('ID | Type | Elapsed | Duration | Progress');
      console.log('─'.repeat(60));
      
      effectOrchestrator.effects.forEach(effect => {
        const id = (effect.id || 'unknown').substring(0, 20).padEnd(20);
        const type = (effect.type || 'unknown').padEnd(15);
        const elapsed = (effect.elapsed || 0).toFixed(2).padEnd(8);
        const duration = (effect.duration || 0).toFixed(2).padEnd(8);
        const progress = ((effect.elapsed / effect.duration) * 100 || 0).toFixed(0) + '%';
        
        console.log(`${id} | ${type} | ${elapsed} | ${duration} | ${progress}`);
      });
    }
  };
  
  // Expose globally
  window.__simAudit = audit;
  
  console.log('✓ Simulation Audit Helpers Initialized');
  console.log('  Usage: window.__simAudit.runFullDiagnostics()');
  
  return audit;
}
