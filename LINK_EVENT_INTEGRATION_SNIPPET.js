/**
 * LINK EVENT VISUAL SUPPRESSION - INTEGRATION SNIPPETS
 * 
 * Copy-paste code sections to integrate LinkEventVisualCoordinator_v1
 * into existing systems without refactoring visual code.
 */

// ============================================================================
// SNIPPET 1: main.js - Initialization
// ============================================================================
/*
Add to main.js imports at the top:

import { LinkEventVisualCoordinator_v1 } from './LinkEventVisualCoordinator_v1.js';
*/

/*
Add to World class initialization (e.g., in constructor or initialize method):

// Initialize link event visual suppression coordinator
const visualCoordinator = new LinkEventVisualCoordinator_v1();

// Register visual systems
visualCoordinator.registerSystem('evolution', this.safeEvolutionManager);
visualCoordinator.registerSystem('aura', this.nodeAuraSystem);
// If LinkAuraSystem is initialized:
// visualCoordinator.registerSystem('linkAura', this.linkAuraSystem);

// Store reference for global access
this.visualCoordinator = visualCoordinator;

console.log('[LinkEventVisualCoordinator] Initialized and registered');
*/

// ============================================================================
// SNIPPET 2: NodeLinkingSystem - Hook Link Events
// ============================================================================
/*
In NodeLinkingSystem.createLink() method, add this after link creation:

// Notify visual coordinator of link event (prevent visual explosion)
if (window.world?.visualCoordinator) {
  window.world.visualCoordinator.onLinkEvent(sourceNode, targetNode);
}
*/

// Example context:
export class NodeLinkingSystem {
  createLink(sourceNode, targetNode) {
    // ... existing link creation code ...
    
    const link = {
      source: sourceNode,
      target: targetNode,
      // ... other properties ...
    };
    
    // Add to links collection
    this.links.push(link);
    
    // ← ADD THIS BLOCK:
    // Notify visual coordinator of link event (prevent visual explosion)
    if (window.world?.visualCoordinator) {
      window.world.visualCoordinator.onLinkEvent(sourceNode, targetNode);
    }
    
    // ... rest of link setup ...
  }
}

// ============================================================================
// SNIPPET 3: NodeAuraSystem_v1 - Query Suppression
// ============================================================================
/*
In NodeAuraSystem_v1.registerNode() method, after mesh creation but before
adding to scene, add suppression query:

// Query visual suppression from coordinator (link event prevention)
const nodeKey = node.id || node;
const suppression = window.world?.visualCoordinator?.getSuppression(nodeKey, 'aura');

// Apply suppression if node is in active link event
if (suppression) {
  // Scale suppression: reduce mesh size
  if (aura.mesh) {
    aura.mesh.scale.multiplyScalar(suppression.scale);
  }
  
  // Opacity suppression: reduce visibility
  if (aura.material) {
    aura.material.opacity *= suppression.opacity;
  }
  
  // Offset from origin: prevent exact overlap at node center
  if (aura.mesh && suppression.offset > 0) {
    const randomOffset = new THREE.Vector3(
      (Math.random() - 0.5) * suppression.offset * 2,
      (Math.random() - 0.5) * suppression.offset * 2,
      (Math.random() - 0.5) * suppression.offset * 2
    );
    aura.mesh.position.add(randomOffset);
  }
}
*/

// Example context:
export class NodeAuraSystem_v1 {
  registerNode(node) {
    if (!this.enabled || !node) return;
    
    // ... existing setup code ...
    
    // Create aura mesh
    const material = this._buildAuraMaterial(profileId);
    const mesh = new THREE.Mesh(this.auraGeometry, material);
    
    if (node.position) {
      mesh.position.copy(node.position);
    }
    
    // Set render order
    mesh.renderOrder = -1;
    
    // ← ADD THIS BLOCK:
    // Query visual suppression from coordinator (link event prevention)
    const nodeKey = node.id || node;
    const suppression = window.world?.visualCoordinator?.getSuppression(nodeKey, 'aura');
    
    // Apply suppression if node is in active link event
    if (suppression) {
      // Scale suppression: reduce mesh size
      mesh.scale.multiplyScalar(suppression.scale);
      
      // Opacity suppression: reduce visibility
      material.opacity *= suppression.opacity;
      
      // Offset from origin: prevent exact overlap at node center
      if (suppression.offset > 0) {
        const randomOffset = new THREE.Vector3(
          (Math.random() - 0.5) * suppression.offset * 2,
          (Math.random() - 0.5) * suppression.offset * 2,
          (Math.random() - 0.5) * suppression.offset * 2
        );
        mesh.position.add(randomOffset);
      }
    }
    
    // Add to scene
    if (this.scene) {
      this.scene.add(mesh);
    }
    
    // ... rest of registration ...
  }
}

// ============================================================================
// SNIPPET 4: SafeEvolutionManager - Query Suppression
// ============================================================================
/*
In SafeEvolutionManager.registerNode() method, after VFX mesh creation,
add suppression query:

// Query visual suppression from coordinator (link event prevention)
const nodeId = this.getNodeId(node);
const suppression = window.world?.visualCoordinator?.getSuppression(nodeId, 'evolution');

// Apply suppression if present (evolution has priority, usually no suppression)
if (suppression) {
  vfxMesh.scale.multiplyScalar(suppression.scale);
  // Material opacity handling depends on vfx type
}
*/

// Example context:
export class SafeEvolutionManager {
  registerNode(node) {
    const nodeId = this.getNodeId(node);
    
    if (this.registry[nodeId]) return;
    
    // Create external evolution state
    this.registry[nodeId] = {
      stage: 0,
      energy: 0,
      // ... other state ...
    };
    
    // Create VFX container
    this.vfxMeshes[nodeId] = {
      glowSphere: null,
      coreHologram: null,
      // ... other vfx ...
    };
    
    // ← ADD THIS BLOCK:
    // Query visual suppression from coordinator (link event prevention)
    const suppression = window.world?.visualCoordinator?.getSuppression(nodeId, 'evolution');
    
    // Note: Evolution has highest priority, rarely suppressed
    // Only apply if explicitly told to suppress (multiple evolutions on same node)
    if (suppression) {
      // Could apply scale reduction if needed
      // Most systems prefer to skip evolution suppression entirely
    }
  }
}

// ============================================================================
// SNIPPET 5: LinkAuraSystem - Query Suppression (if enabled)
// ============================================================================
/*
In LinkAuraSystem.registerNode() method, after mesh creation:

// Query visual suppression from coordinator (link event prevention)
const nodeKey = node.id || node;
const suppression = window.world?.visualCoordinator?.getSuppression(nodeKey, 'linkAura');

if (suppression) {
  mesh.scale.multiplyScalar(suppression.scale);
  material.opacity *= suppression.opacity;
  
  // Apply offset if needed
  if (suppression.offset > 0) {
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * suppression.offset * 2,
      (Math.random() - 0.5) * suppression.offset * 2,
      (Math.random() - 0.5) * suppression.offset * 2
    );
    mesh.position.add(offset);
  }
}
*/

// ============================================================================
// SNIPPET 6: Cleanup on World Dispose
// ============================================================================
/*
In World class dispose() method, add cleanup:

if (this.visualCoordinator) {
  this.visualCoordinator.dispose();
  this.visualCoordinator = null;
}
*/

// ============================================================================
// TESTING HELPERS
// ============================================================================

// Test 1: Verify coordinator is initialized
export function testVisualCoordinatorInit() {
  const coordinator = window.world?.visualCoordinator;
  if (!coordinator) {
    console.error('❌ Coordinator not initialized');
    return false;
  }
  console.log('✅ Coordinator initialized');
  console.log('  Systems:', Object.keys(coordinator.systems).filter(k => coordinator.systems[k]));
  return true;
}

// Test 2: Simulate link event and check suppression
export function testLinkEventSuppression() {
  const coordinator = window.world?.visualCoordinator;
  if (!coordinator) return false;
  
  // Create test nodes
  const nodeA = { id: 'test-a', uuid: 'uuid-a', userData: { category: 'test' } };
  const nodeB = { id: 'test-b', uuid: 'uuid-b', userData: { category: 'test' } };
  
  // Trigger link event
  coordinator.onLinkEvent(nodeA, nodeB);
  
  // Check suppression
  const suppA = coordinator.getSuppression('test-a', 'aura');
  const suppE = coordinator.getSuppression('test-a', 'evolution');
  
  console.log('✅ Link event triggered');
  console.log('  Aura suppression:', suppA ? '✓ suppressed' : '✗ not suppressed');
  console.log('  Evolution suppression:', suppE ? '✓ suppressed' : '✗ not suppressed');
  
  return suppA !== null;
}

// Test 3: Check cleanup after timeout
export async function testVisualCoordinatorCleanup() {
  const coordinator = window.world?.visualCoordinator;
  if (!coordinator) return false;
  
  const nodeA = { id: 'test-cleanup', uuid: 'uuid-cleanup' };
  coordinator.onLinkEvent(nodeA, nodeA);
  
  console.log('Active events before cleanup:', coordinator.activeLinkEvents.size);
  
  // Wait for event duration + buffer
  await new Promise(r => setTimeout(r, coordinator.eventDuration + 100));
  
  const supp = coordinator.getSuppression('test-cleanup', 'aura');
  console.log('✅ Cleanup test:', supp === null ? '✓ expired' : '✗ still active');
  
  return supp === null;
}

// Quick test suite
export function runCoordinatorTests() {
  console.log('\n=== LINK EVENT VISUAL COORDINATOR TESTS ===\n');
  
  testVisualCoordinatorInit();
  testLinkEventSuppression();
  testVisualCoordinatorCleanup();
  
  console.log('\n=== TESTS COMPLETE ===\n');
}

// Run in console: window.runCoordinatorTests()

