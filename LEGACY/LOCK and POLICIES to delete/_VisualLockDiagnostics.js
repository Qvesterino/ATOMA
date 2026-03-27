/**
 * VISUAL LOCK DIAGNOSTICS v1.0
 * 
 * Comprehensive diagnostic system to find and report nodes with:
 * - Missing visualRoot
 * - Broken visual structure
 * - Inconsistent properties
 * - Silent visual mutations
 * 
 * Usage:
 * window.__visualDiagnostics.findUnregisteredNodes()
 * window.__visualDiagnostics.dumpNodeVisual(nodeId)
 * window.__visualDiagnostics.forceRebindAll()
 * window.__visualDiagnostics.enableMonitoring(true)
 */

import * as THREE from 'three';

export class VisualLockDiagnostics {
  constructor(scene, visualAuthority, aiNodes) {
    this.scene = scene;
    this.visualAuthority = visualAuthority;
    this.aiNodes = aiNodes;
    
    // Monitoring state
    this.monitoring = false;
    this.lastViolationReport = 0;
    this.violationReportInterval = 2000; // Only log every 2 seconds max
    
    // Violation tracking
    this.reportedViolations = new Set();
    this.fixedViolations = new Set();
  }
  
  /**
   * Find all nodes missing visualRoot or not registered
   */
  findUnregisteredNodes() {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('[VISUAL_DIAGNOSTICS] Scanning for unregistered nodes...');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const unregistered = [];
    const broken = [];
    const OK = [];
    
    if (!this.aiNodes || !this.aiNodes.nodes) {
      console.warn('[VISUAL_DIAGNOSTICS] AINodes not available');
      return { unregistered, broken, OK };
    }
    
    this.aiNodes.nodes.forEach((node, idx) => {
      const nodeId = node.userData?.nodeId || node.uuid;
      
      // Check 1: Has visualRoot?
      if (!node.userData?.visualRoot) {
        unregistered.push({
          index: idx,
          nodeId,
          category: node.userData?.category || 'unknown',
          archetype: node.userData?.archetype || 'unknown',
          hasChildren: node.children.length,
          issue: 'NO_VISUAL_ROOT'
        });
        return;
      }
      
      // Check 2: Validate visualRoot
      const vr = node.userData.visualRoot;
      const violations = [];
      
      if (vr.visible !== true) violations.push('visible=false');
      if (vr.material?.opacity !== 1.0) violations.push(`opacity=${vr.material?.opacity}`);
      if (vr.frustumCulled !== false) violations.push('frustumCulled=true');
      if (vr.material?.depthTest !== false) violations.push('depthTest=true');
      if (vr.material?.depthWrite !== false) violations.push('depthWrite=true');
      
      if (violations.length > 0) {
        broken.push({
          index: idx,
          nodeId,
          category: node.userData?.category || 'unknown',
          archetype: node.userData?.archetype || 'unknown',
          visualRoot: vr.name || 'unnamed',
          violations
        });
        return;
      }
      
      // All good
      OK.push({
        nodeId,
        category: node.userData?.category || 'unknown',
        visualRoot: vr.name || 'unnamed'
      });
    });
    
    // REPORT
    console.log(`✓ Healthy nodes: ${OK.length}`);
    console.log(`✗ Broken nodes: ${broken.length}`);
    console.log(`⚠ Unregistered nodes: ${unregistered.length}\n`);
    
    if (unregistered.length > 0) {
      console.log('━━━ UNREGISTERED (NO visualRoot) ━━━');
      unregistered.forEach((node) => {
        console.log(`  [${node.index}] ${node.nodeId.substring(0, 8)}...`);
        console.log(`      Category: ${node.category}`);
        console.log(`      Archetype: ${node.archetype}`);
        console.log(`      Children: ${node.hasChildren}`);
      });
      console.log('');
    }
    
    if (broken.length > 0) {
      console.log('━━━ BROKEN (visualRoot CORRUPTED) ━━━');
      broken.forEach((node) => {
        console.log(`  [${node.index}] ${node.nodeId.substring(0, 8)}...`);
        console.log(`      Category: ${node.category}`);
        console.log(`      VisualRoot: ${node.visualRoot}`);
        console.log(`      Violations: ${node.violations.join(', ')}`);
      });
      console.log('');
    }
    
    console.log(`═══════════════════════════════════════════════════════`);
    console.log(`TOTAL HEALTH: ${((OK.length / (OK.length + broken.length + unregistered.length)) * 100).toFixed(1)}%`);
    console.log(`═══════════════════════════════════════════════════════\n`);
    
    return { unregistered, broken, OK };
  }
  
  /**
   * Dump complete visual information for a node
   */
  dumpNodeVisual(nodeId) {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`[VISUAL_DIAGNOSTICS] Dumping visual state for: ${nodeId}`);
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Find node
    let targetNode = null;
    if (this.aiNodes?.nodes) {
      targetNode = this.aiNodes.nodes.find(n => 
        n.userData?.nodeId === nodeId || n.uuid === nodeId
      );
    }
    
    if (!targetNode) {
      console.warn('[VISUAL_DIAGNOSTICS] Node not found:', nodeId);
      return;
    }
    
    const nodeId_short = targetNode.userData?.nodeId?.substring(0, 8) || targetNode.uuid.substring(0, 8);
    
    console.log(`Node ID: ${nodeId_short}`);
    console.log(`UUID: ${targetNode.uuid}`);
    console.log(`Category: ${targetNode.userData?.category || 'unknown'}`);
    console.log(`Archetype: ${targetNode.userData?.archetype || 'unknown'}`);
    console.log(`Has visualRoot: ${!!targetNode.userData?.visualRoot}`);
    console.log('');
    
    // Dump visualRoot
    if (targetNode.userData?.visualRoot) {
      const vr = targetNode.userData.visualRoot;
      console.log('📊 VisualRoot Properties:');
      console.log(`  Name: ${vr.name || '(unnamed)'}`);
      console.log(`  Position: (${vr.position.x.toFixed(2)}, ${vr.position.y.toFixed(2)}, ${vr.position.z.toFixed(2)})`);
      console.log(`  Scale: (${vr.scale.x.toFixed(2)}, ${vr.scale.y.toFixed(2)}, ${vr.scale.z.toFixed(2)})`);
      console.log(`  Visible: ${vr.visible}`);
      console.log(`  FrustumCulled: ${vr.frustumCulled}`);
      
      if (vr.material) {
        console.log(`\n🎨 Material:
    Type: ${vr.material.type}
    Opacity: ${vr.material.opacity}
    Transparent: ${vr.material.transparent}
    DepthTest: ${vr.material.depthTest}
    DepthWrite: ${vr.material.depthWrite}
    BlendMode: ${vr.material.blending}`);
      }
    } else {
      console.log('⚠️  NO VISUAL ROOT - CRITICAL ISSUE\n');
      
      // List children
      console.log('Direct children:');
      targetNode.children.forEach((child, idx) => {
        console.log(`  [${idx}] ${child.name || '(unnamed)'} (${child.type})`);
        if (child.isMesh && child.material) {
          console.log(`        Material: ${child.material.type}`);
          console.log(`        Opacity: ${child.material.opacity}`);
          console.log(`        DepthTest: ${child.material.depthTest}`);
        }
      });
    }
    
    // Dump all children with userData
    console.log('\n📦 Full Hierarchy:');
    this.dumpHierarchy(targetNode, 0);
    
    console.log('\n═══════════════════════════════════════════════════════\n');
  }
  
  /**
   * Helper: Dump visual hierarchy
   */
  dumpHierarchy(node, depth, maxDepth = 5) {
    if (depth > maxDepth) return;
    
    const indent = '  '.repeat(depth);
    const marker = node === node.parent?.userData?.visualRoot ? '🎯' : '  ';
    const info = node.isMesh ? `[Mesh] opacity=${node.material?.opacity}` : `[${node.type}]`;
    
    console.log(`${indent}${marker} ${node.name || '(unnamed)'} ${info}`);
    
    // Log important userData
    if (node.userData?.visualLocked) {
      console.log(`${indent}    [LOCKED] visual layer: ${node.userData.visualLayer}`);
    }
    if (node.userData?.isHologramShell) {
      console.log(`${indent}    [SHELL] hologram`);
    }
    if (node.userData?.isAura) {
      console.log(`${indent}    [AURA]`);
    }
    
    // Recurse
    node.children.forEach(child => this.dumpHierarchy(child, depth + 1, maxDepth));
  }
  
  /**
   * Auto-discover and rebind visualRoot for all nodes
   */
  forceRebindAll() {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('[VISUAL_DIAGNOSTICS] Force rebinding all nodes...');
    console.log('═══════════════════════════════════════════════════════\n');
    
    let fixed = 0;
    let failed = 0;
    
    if (!this.aiNodes?.nodes) {
      console.warn('[VISUAL_DIAGNOSTICS] AINodes not available');
      return;
    }
    
    this.aiNodes.nodes.forEach((node, idx) => {
      // Skip if already has valid visualRoot
      if (node.userData?.visualRoot && this.isValidVisualRoot(node.userData.visualRoot)) {
        return;
      }
      
      // Try to auto-discover visualRoot
      const discovered = this.discoverVisualRoot(node);
      if (discovered) {
        node.userData.visualRoot = discovered;
        if (this.visualAuthority) {
          try {
            this.visualAuthority.registerNode(node, discovered);
          } catch (e) {
            console.warn(`[VISUAL_DIAGNOSTICS] Register failed for node ${idx}:`, e.message);
            failed++;
            return;
          }
        }
        fixed++;
        console.log(`[AUTOFIX] Node ${idx}: bound to ${discovered.name || 'unnamed'}`);
      } else {
        failed++;
        console.log(`[AUTOFIX_FAILED] Node ${idx}: could not discover visualRoot`);
      }
    });
    
    console.log(`\n━━━ REBIND SUMMARY ━━━`);
    console.log(`✓ Fixed: ${fixed}`);
    console.log(`✗ Failed: ${failed}`);
    console.log(`═══════════════════════════════════════════════════════\n`);
  }
  
  /**
   * Auto-discover visualRoot (best-guess strategy)
   */
  discoverVisualRoot(node) {
    // Strategy 1: First mesh child
    for (const child of node.children) {
      if (child.isMesh) return child;
    }
    
    // Strategy 2: First Group with mesh children
    for (const child of node.children) {
      if (child.isGroup && child.children.some(c => c.isMesh)) {
        return child;
      }
    }
    
    // Strategy 3: The largest mesh (by vertex count)
    let largest = null;
    let maxVertices = 0;
    
    node.traverse((obj) => {
      if (obj === node) return;
      if (!obj.isMesh) return;
      
      const vertexCount = obj.geometry?.attributes?.position?.count || 0;
      if (vertexCount > maxVertices) {
        maxVertices = vertexCount;
        largest = obj;
      }
    });
    
    return largest;
  }
  
  /**
   * Check if visualRoot is in valid state
   */
  isValidVisualRoot(vr) {
    if (!vr) return false;
    
    return vr.visible === true &&
           vr.material?.opacity === 1.0 &&
           vr.frustumCulled === false;
  }
  
  /**
   * Enable continuous monitoring (logs violations per frame if any)
   */
  enableMonitoring(enable) {
    this.monitoring = enable;
    if (enable) {
      console.log('[VISUAL_DIAGNOSTICS] Monitoring enabled - violations will be logged');
    } else {
      console.log('[VISUAL_DIAGNOSTICS] Monitoring disabled');
    }
  }
  
  /**
   * Per-frame monitor call (invoke from render loop)
   */
  monitorFrame() {
    if (!this.monitoring || !this.aiNodes?.nodes) return;
    
    const now = Date.now();
    if (now - this.lastViolationReport < this.violationReportInterval) return;
    
    let violationCount = 0;
    
    this.aiNodes.nodes.forEach((node) => {
      if (!node.userData?.visualRoot) {
        violationCount++;
        return;
      }
      
      const vr = node.userData.visualRoot;
      if (vr.visible !== true || vr.material?.opacity !== 1.0 || vr.frustumCulled !== false) {
        violationCount++;
      }
    });
    
    if (violationCount > 0) {
      console.log(`[VISUAL_VIOLATION] ${violationCount} nodes have visual issues`);
      this.lastViolationReport = now;
    }
  }
}
