/**
 * CUSTOM RAYCAST OVERRIDE — INTEGRATION EXAMPLES
 * 
 * Copy-paste ready code snippets for integrating custom raycast system.
 * 
 * @module CustomRaycastIntegrationExamples
 */

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Node Creation (NodeFactory / EnhancedNodeModel)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Integration Point 1: After node mesh is created
 * 
 * Where to add: NodeFactory.js or wherever nodes are spawned
 * When to add: After createNodeMesh() / geometry setup
 */
export function createNodeWithRaycast(nodeData) {
  // Import at top of file
  import { initializeNodeRaycast } from './CustomRaycastOverride.js';

  // ... existing node creation code ...
  
  const geometry = new THREE.IcosahedronGeometry(1, 4);
  const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  const nodeMesh = new THREE.Mesh(geometry, material);
  
  // Add to scene
  scene.add(nodeMesh);
  
  // ✅ CRITICAL: Initialize raycast (NEW)
  const nodeId = nodeData.id || 'node_' + Date.now();
  initializeNodeRaycast(nodeMesh, nodeId);
  
  // ... rest of node setup ...
  
  return nodeMesh;
}

/**
 * Integration Point 1B: For existing node creation code
 * 
 * Find where nodes are created and add this pattern:
 */
function exampleNodeCreationPatch() {
  // FIND THIS:
  // ─────────
  // const nodeMesh = createNodeMesh(...);
  // scene.add(nodeMesh);
  // return nodeMesh;
  
  // ADD THIS AFTER scene.add():
  // ──────────────────────────
  // import { initializeNodeRaycast } from './CustomRaycastOverride.js';
  // initializeNodeRaycast(nodeMesh, nodeId);
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: FX/Aura Creation (NodeAuraSystem, AuraModulationSystem)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Integration Point 2: After FX mesh is created
 * 
 * Where to add: Any FX creation code (auras, links, glyphs, holograms)
 * When to add: After mesh creation and scene.add()
 */
export function createAuraWithRaycastDisabled(nodePosition, nodeSize) {
  // Import at top of file
  import { disableNonInteractiveMesh } from './CustomRaycastOverride.js';

  // Create aura mesh (existing code)
  const auraMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.3
  });
  
  const auraGeometry = new THREE.IcosahedronGeometry(nodeSize * 2, 4);
  const auraMesh = new THREE.Mesh(auraGeometry, auraMaterial);
  
  auraMesh.position.copy(nodePosition);
  scene.add(auraMesh);
  
  // ✅ CRITICAL: Disable raycast for FX (NEW)
  disableNonInteractiveMesh(auraMesh);
  
  return auraMesh;
}

/**
 * Integration Point 2B: For existing aura/FX code
 * 
 * Find where FX meshes are created and add this pattern:
 */
function exampleFXCreationPatch() {
  // FIND THIS:
  // ─────────
  // const auraMesh = createAuraMesh();
  // scene.add(auraMesh);
  
  // ADD THIS AFTER scene.add():
  // ──────────────────────────
  // import { disableNonInteractiveMesh } from './CustomRaycastOverride.js';
  // disableNonInteractiveMesh(auraMesh);
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: Raycasting (NodeLinkingSystem / Interaction)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Integration Point 3: Raycast operation
 * 
 * Where to add: NodeLinkingSystem.js or anywhere raycasting happens
 * When to add: In click handler, preview creation, any raycast logic
 */
export function performRaycastSafely(raycaster, camera, mouse, scene) {
  // Import at top of file
  import { RaycastTargetRegistry } from './RaycastTargetRegistry.js';

  // Set raycaster from camera and mouse
  raycaster.setFromCamera(mouse, camera);
  
  // ✅ CRITICAL: Use registry instead of scene (CHANGED)
  const raycastables = RaycastTargetRegistry.get();
  const hits = raycaster.intersectObjects(raycastables, false);
  
  // Process hits
  if (hits.length > 0) {
    const selectedNode = hits[0].object;
    console.log('Selected node:', selectedNode.name);
    selectNode(selectedNode);
  }
  
  return hits;
}

/**
 * Integration Point 3B: For existing raycasting code
 * 
 * FIND THIS:
 * ──────────
 * const hits = raycaster.intersectObjects(scene.children, true);
 * 
 * REPLACE WITH THIS:
 * ──────────────────
 * import { RaycastTargetRegistry } from './RaycastTargetRegistry.js';
 * const raycastables = RaycastTargetRegistry.get();
 * const hits = raycaster.intersectObjects(raycastables, false);
 */
function exampleRaycastingPatch() {
  // OLD (crashes):
  // ──────────────
  // const hits = raycaster.intersectObjects(scene.children, true);

  // NEW (safe):
  // ───────────
  // import { RaycastTargetRegistry } from './RaycastTargetRegistry.js';
  // const raycastables = RaycastTargetRegistry.get();
  // const hits = raycaster.intersectObjects(raycastables, false);
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Node Deletion
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Integration Point 4: Node cleanup/deletion
 * 
 * Where to add: Node deletion functions
 * When to add: Before removing node from scene
 */
export function deleteNodeWithCleanup(nodeMesh) {
  // Import at top of file
  import { RaycastTargetRegistry } from './RaycastTargetRegistry.js';

  // ✅ CRITICAL: Unregister from raycast system (NEW)
  RaycastTargetRegistry.unregister(nodeMesh);
  
  // Remove from scene
  scene.remove(nodeMesh);
  
  // Dispose resources
  if (nodeMesh.geometry) {
    nodeMesh.geometry.dispose();
  }
  if (nodeMesh.material) {
    nodeMesh.material.dispose();
  }
  
  console.log('Node deleted and cleaned up');
}

/**
 * Integration Point 4B: For existing deletion code
 * 
 * FIND THIS:
 * ──────────
 * scene.remove(nodeMesh);
 * nodeMesh.geometry?.dispose();
 * 
 * ADD BEFORE IT:
 * ──────────────
 * import { RaycastTargetRegistry } from './RaycastTargetRegistry.js';
 * RaycastTargetRegistry.unregister(nodeMesh);
 */
function exampleDeletionPatch() {
  // ADD BEFORE:
  // ──────────
  // import { RaycastTargetRegistry } from './RaycastTargetRegistry.js';
  // RaycastTargetRegistry.unregister(nodeMesh);
  
  // THEN EXISTING:
  // ──────────────
  // scene.remove(nodeMesh);
  // nodeMesh.geometry?.dispose();
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: Scene Initialization / Reset
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Integration Point 5: Scene reset/cleanup
 * 
 * Where to add: main.js or World.js initialization
 * When to add: In scene reset function
 */
export function initializeSceneWithRaycast(scene) {
  // Import at top of file
  import { RaycastTargetRegistry } from './RaycastTargetRegistry.js';

  // Clear registry at start
  RaycastTargetRegistry.clear();
  
  // ... rest of scene initialization ...
  
  console.log('Scene initialized, raycast registry cleared');
}

/**
 * Integration Point 5B: Scene reset function
 */
export function resetSceneWithCleanup() {
  // Import at top of file
  import { RaycastTargetRegistry } from './RaycastTargetRegistry.js';

  // ✅ CRITICAL: Clear raycast registry (NEW)
  RaycastTargetRegistry.clear();
  
  // Remove all objects
  scene.traverse(child => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
    scene.remove(child);
  });
  
  console.log('Scene reset complete');
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 6: Validation & Testing
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validation Example: Check specific node
 */
export function validateNodeSetup(nodeMesh) {
  import { validateRaycastSetup } from './CustomRaycastOverride.js';

  const result = validateRaycastSetup(nodeMesh);
  
  console.group('[Validation] Node Raycast Setup');
  console.log('Valid:', result.valid);
  console.log('Has Custom Raycast:', result.hasCustomRaycast);
  console.log('Has Precomputed Sphere:', result.hasPrecomputedSphere);
  console.log('Is Registered:', result.isRegistered);
  console.log('Mesh Name:', result.meshName);
  console.groupEnd();
  
  return result.valid;
}

/**
 * Audit Example: System-wide check
 */
export function auditRaycastSystem(scene) {
  import { printRaycastSafetyReport } from './CustomRaycastOverride.js';

  console.log('Running raycast safety audit...');
  printRaycastSafetyReport(scene);
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 7: Complete Node Lifecycle
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Complete example showing full node lifecycle with raycast integration
 */
export class NodeWithCompleteRaycast {
  constructor(nodeData, scene) {
    this.nodeData = nodeData;
    this.scene = scene;
    this.mesh = null;
    this.aura = null;
  }

  // 1. Create node
  spawn() {
    import { initializeNodeRaycast } from './CustomRaycastOverride.js';

    const geometry = new THREE.IcosahedronGeometry(1, 4);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    this.mesh = new THREE.Mesh(geometry, material);
    
    this.mesh.position.copy(this.nodeData.position);
    this.scene.add(this.mesh);
    
    // ✅ Initialize raycast
    initializeNodeRaycast(this.mesh, this.nodeData.id);
    
    // Create aura
    this.createAura();
  }

  // 2. Create aura (FX)
  createAura() {
    import { disableNonInteractiveMesh } from './CustomRaycastOverride.js';

    const auraMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3
    });
    
    const auraGeometry = new THREE.IcosahedronGeometry(2, 4);
    this.aura = new THREE.Mesh(auraGeometry, auraMaterial);
    
    this.aura.position.copy(this.mesh.position);
    this.scene.add(this.aura);
    
    // ✅ Disable raycast for aura
    disableNonInteractiveMesh(this.aura);
  }

  // 3. Validate setup
  validate() {
    import { validateRaycastSetup } from './CustomRaycastOverride.js';

    const validation = validateRaycastSetup(this.mesh);
    console.log('Node validation:', validation);
    return validation.valid;
  }

  // 4. Delete node
  dispose() {
    import { RaycastTargetRegistry } from './RaycastTargetRegistry.js';

    // ✅ Unregister from raycast
    RaycastTargetRegistry.unregister(this.mesh);
    
    // Remove from scene
    this.scene.remove(this.mesh);
    this.scene.remove(this.aura);
    
    // Dispose resources
    this.mesh.geometry?.dispose();
    this.mesh.material?.dispose();
    this.aura.geometry?.dispose();
    this.aura.material?.dispose();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 8: Click Handler Integration
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Complete click handler with raycast integration
 */
export function setupClickHandler(scene, camera) {
  import { RaycastTargetRegistry } from './RaycastTargetRegistry.js';

  const raycaster = new THREE.Raycaster();
  
  document.addEventListener('click', (event) => {
    // Get mouse position
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Perform raycast
    raycaster.setFromCamera(mouse, camera);
    
    // ✅ Use registry (safe)
    const raycastables = RaycastTargetRegistry.get();
    const hits = raycaster.intersectObjects(raycastables, false);
    
    if (hits.length > 0) {
      const selectedNode = hits[0].object;
      console.log('Selected:', selectedNode.name);
      // Handle selection...
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 9: Stress Testing (100+ clicks)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Stress test: Rapid clicking should not crash
 */
export function stressTestRaycast(scene, camera) {
  import { RaycastTargetRegistry } from './RaycastTargetRegistry.js';

  const raycaster = new THREE.Raycaster();
  const raycastables = RaycastTargetRegistry.get();
  
  console.log('Starting stress test (100 rapid raycasts)...');
  
  const startTime = performance.now();
  
  for (let i = 0; i < 100; i++) {
    // Random mouse position
    const mouse = new THREE.Vector2(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    );
    
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(raycastables, false);
    
    // Each hit should be valid
    if (hits.length > 0) {
      const distance = hits[0].distance;
      if (distance < 0) {
        throw new Error('Invalid distance!');
      }
    }
  }
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log(`✅ Stress test passed!`);
  console.log(`   100 raycasts in ${duration.toFixed(2)}ms`);
  console.log(`   Average: ${(duration / 100).toFixed(3)}ms per raycast`);
  console.log(`   Registry size: ${raycastables.length}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY: Integration Checklist
// ═══════════════════════════════════════════════════════════════════════════

/*
INTEGRATION CHECKLIST:
══════════════════════

1. NODE CREATION
   ├─ Import: import { initializeNodeRaycast } from './CustomRaycastOverride.js';
   ├─ Find: After nodeMesh is created and added to scene
   └─ Add: initializeNodeRaycast(nodeMesh, nodeId);

2. FX/AURA CREATION
   ├─ Import: import { disableNonInteractiveMesh } from './CustomRaycastOverride.js';
   ├─ Find: After FX mesh is created and added to scene
   └─ Add: disableNonInteractiveMesh(fxMesh);

3. RAYCASTING
   ├─ Import: import { RaycastTargetRegistry } from './RaycastTargetRegistry.js';
   ├─ Find: Where raycasting is performed
   └─ Replace: raycaster.intersectObjects(RaycastTargetRegistry.get(), false);

4. NODE DELETION
   ├─ Import: import { RaycastTargetRegistry } from './RaycastTargetRegistry.js';
   ├─ Find: Before scene.remove(nodeMesh);
   └─ Add: RaycastTargetRegistry.unregister(nodeMesh);

5. SCENE RESET
   ├─ Import: import { RaycastTargetRegistry } from './RaycastTargetRegistry.js';
   ├─ Find: In scene initialization
   └─ Add: RaycastTargetRegistry.clear();

6. VALIDATION
   ├─ Import: import { printRaycastSafetyReport } from './CustomRaycastOverride.js';
   ├─ Run: printRaycastSafetyReport(scene);
   └─ Check: All nodes show valid ✅

RESULT: Zero raycast crashes, deterministic behavior!
*/
