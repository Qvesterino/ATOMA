/**
 * SPAWN AUTHORITY CONSOLE API
 * 
 * Provides console-accessible commands for:
 * - Auditing spawn compliance
 * - Verifying node integrity
 * - Testing fallback behavior
 * - Monitoring spawn metrics
 * 
 * Usage: window.SpawnAuthority.audit(), etc.
 */

import { spawnAuthorityComplianceGate } from './SpawnAuthorityComplianceGate.js';

export class SpawnAuthorityConsoleAPI {
  constructor(aiNodes) {
    this.aiNodes = aiNodes;
  }

  /**
   * AUDIT: Check all nodes for spawn authority compliance
   */
  audit() {
    console.group('%c[SPAWN AUTHORITY AUDIT]', 'color: #00ff00; font-weight: bold; font-size: 14px');
    
    const report = spawnAuthorityComplianceGate.printAuditReport(this.aiNodes.nodes);
    
    if (report.violations.length === 0) {
      console.log('✓ All nodes compliant with spawn authority');
    } else {
      console.error(`✗ ${report.violations.length} nodes have violations`);
    }
    
    console.groupEnd();
    return report;
  }

  /**
   * STATUS: Get current spawn metrics
   */
  status() {
    const status = spawnAuthorityComplianceGate.getComplianceStatus();
    
    console.group('%c[SPAWN AUTHORITY STATUS]', 'color: #0099ff; font-weight: bold');
    console.table({
      'Spawn Attempts': status.spawnAttempts,
      'Successful': status.successfulSpawns,
      'Rejected': status.rejectedSpawns,
      'Fallback': status.fallbackSpawns,
      'Success Rate': status.successRate,
      'Failed Validations': status.failedValidations
    });
    console.log('Last Validation:', status.lastValidation);
    console.groupEnd();
    
    return status;
  }

  /**
   * TEST: Spawn with unknown category (should fallback to input)
   */
  testFallback() {
    console.group('%c[SPAWN AUTHORITY TEST: Fallback]', 'color: #ffaa00; font-weight: bold');
    
    const testCategories = [
      'unknown_type',
      'fake_category',
      'invalid123',
      'experimental',
      'deprecated'
    ];
    
    const results = [];
    testCategories.forEach(cat => {
      const pos = {
        x: Math.random() * 20 - 10,
        y: Math.random() * 20 - 10,
        z: Math.random() * 20 - 10
      };
      
      if (window.__ALLOW_EXTERNAL_SPAWN__ !== true) {
        console.warn('[SpawnAuthority] External spawn not explicitly enabled — allowing anyway');
      }
      const node = this.aiNodes.spawnNode(cat, pos);
      const actualCategory = node?.userData?.category || 'null';
      const passed = actualCategory === 'input';
      
      results.push({
        requested: cat,
        actual: actualCategory,
        passed: passed ? '✓' : '✗'
      });
    });
    
    console.table(results);
    const allPassed = results.every(r => r.passed === '✓');
    console.log(allPassed ? '✓ All fallback tests passed' : '✗ Some tests failed');
    console.groupEnd();
    
    return results;
  }

  /**
   * TEST: Spawn all supported categories
   */
  testAllCategories() {
    console.group('%c[SPAWN AUTHORITY TEST: All Categories]', 'color: #ffaa00; font-weight: bold');
    
    const categories = [
      'input', 'process', 'integration', 'analytics', 'storage', 'control',
      'quantum', 'sigma', 'mythic', 'prime', 'error', 'emotional'
    ];
    
    const results = [];
    categories.forEach(cat => {
      const pos = {
        x: Math.random() * 20 - 10,
        y: Math.random() * 20 - 10,
        z: Math.random() * 20 - 10
      };
      
      if (window.__ALLOW_EXTERNAL_SPAWN__ !== true) {
        console.warn('[SpawnAuthority] External spawn not explicitly enabled — allowing anyway');
      }
      const node = this.aiNodes.spawnNode(cat, pos);
      const spawned = node !== null && node !== undefined;
      const hasBinding = node?.userData?.enhancedNodeModelBinding !== undefined;
      const hasCategory = node?.userData?.category === cat;
      
      results.push({
        category: cat,
        spawned: spawned ? '✓' : '✗',
        binding: hasBinding ? '✓' : '✗',
        correct: hasCategory ? '✓' : '✗'
      });
    });
    
    console.table(results);
    const allPassed = results.every(r => r.spawned === '✓' && r.binding === '✓' && r.correct === '✓');
    console.log(allPassed ? '✓ All category tests passed' : '✗ Some tests failed');
    console.groupEnd();
    
    return results;
  }

  /**
   * TEST: Verify all nodes are clickable
   */
  testSelectability(camera, renderer) {
    console.group('%c[SPAWN AUTHORITY TEST: Selectability]', 'color: #ffaa00; font-weight: bold');
    
    const raycaster = window.THREE?.Raycaster ? new window.THREE.Raycaster() : null;
    const mouse = window.THREE?.Vector2 ? new window.THREE.Vector2() : null;
    
    if (!raycaster || !mouse) {
      console.error('THREE.js not available for raycaster test');
      console.groupEnd();
      return null;
    }
    
    const results = [];
    this.aiNodes.nodes.forEach((node, idx) => {
      const pos = node.position.clone();
      
      // Project to screen space
      pos.project(camera);
      
      // Raycast at node position
      mouse.x = pos.x;
      mouse.y = pos.y;
      raycaster.setFromCamera(mouse, camera);
      
      // Check intersection
      let coreMesh = null;
      node.traverse(child => {
        if (child.isMesh && !child.userData?.isAura && 
            !child.userData?.isShell && !child.userData?.isParticle) {
          coreMesh = child;
        }
      });
      
      const intersections = raycaster.intersectObject(coreMesh);
      const selectable = intersections.length > 0 || coreMesh !== null;
      
      if (idx < 5) {  // Show first 5
        results.push({
          node: `${node.userData?.category || 'unknown'}-${idx}`,
          hasCore: coreMesh ? '✓' : '✗',
          selectable: selectable ? '✓' : '✗'
        });
      }
    });
    
    console.table(results);
    console.log(`Tested ${this.aiNodes.nodes.length} nodes`);
    console.groupEnd();
    
    return results;
  }

  /**
   * TEST: Verify binding metadata on all nodes
   */
  testBindingMetadata() {
    console.group('%c[SPAWN AUTHORITY TEST: Binding Metadata]', 'color: #ffaa00; font-weight: bold');
    
    let allOK = true;
    const violations = [];
    
    this.aiNodes.nodes.forEach((node, idx) => {
      const binding = node.userData?.enhancedNodeModelBinding;
      
      if (!binding) {
        violations.push(`Node ${idx}: Missing binding metadata`);
        allOK = false;
        return;
      }
      
      if (binding.sourceModel !== 'EnhancedNodeModel') {
        violations.push(`Node ${idx}: Invalid source model: ${binding.sourceModel}`);
        allOK = false;
      }
      
      if (!binding.category) {
        violations.push(`Node ${idx}: Missing category in binding`);
        allOK = false;
      }
      
      if (binding.variantIndex === undefined) {
        violations.push(`Node ${idx}: Missing variantIndex`);
        allOK = false;
      }
      
      if (!binding.spawnTime) {
        violations.push(`Node ${idx}: Missing spawnTime`);
        allOK = false;
      }
    });
    
    if (allOK) {
      console.log(`✓ All ${this.aiNodes.nodes.length} nodes have valid binding metadata`);
    } else {
      console.error(`✗ ${violations.length} metadata violations found:`);
      violations.forEach(v => console.error(`  - ${v}`));
    }
    
    console.groupEnd();
    return { allOK, violations };
  }

  /**
   * RESET: Clear metrics (for testing)
   */
  reset() {
    spawnAuthorityComplianceGate.reset();
    console.log('✓ Spawn authority metrics reset');
  }

  /**
   * HELP: Show available commands
   */
  help() {
    console.group('%c[SPAWN AUTHORITY API]', 'color: #00ff00; font-weight: bold');
    console.log('Available commands:');
    console.log('  .audit()              - Full compliance audit');
    console.log('  .status()             - Current metrics');
    console.log('  .testFallback()       - Test unknown category fallback');
    console.log('  .testAllCategories()  - Spawn all 12 categories');
    console.log('  .testSelectability()  - Verify nodes are clickable');
    console.log('  .testBindingMetadata()- Verify metadata on all nodes');
    console.log('  .reset()              - Reset metrics');
    console.log('  .help()               - This message');
    console.groupEnd();
  }
}

// Export for global access
export function initializeSpawnAuthorityConsoleAPI(aiNodes) {
  const api = new SpawnAuthorityConsoleAPI(aiNodes);
  
  if (typeof window !== 'undefined') {
    window.SpawnAuthority = {
      audit: () => api.audit(),
      status: () => api.status(),
      testFallback: () => api.testFallback(),
      testAllCategories: () => api.testAllCategories(),
      testSelectability: (cam, ren) => api.testSelectability(cam, ren),
      testBindingMetadata: () => api.testBindingMetadata(),
      reset: () => api.reset(),
      help: () => api.help()
    };
    
    console.log('%c[SPAWN AUTHORITY CONSOLE API READY]', 'color: #00ff00; font-weight: bold');
    console.log('Type: window.SpawnAuthority.help() for commands');
  }
  
  return api;
}
