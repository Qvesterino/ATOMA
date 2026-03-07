/**
 * PHASE 3C WEEK 9: AURA SYSTEM INTEGRATION SNIPPET
 * 
 * Copy-paste ready code to integrate NodeAuraSystem_v1 into your project.
 * 
 * SAFE MODE: No modifications to main.js required.
 * Add these snippets to appropriate locations in your code.
 */

// ============================================================================
// SNIPPET 1: IMPORT (Add to top of main.js or initialization file)
// ============================================================================

import { NodeAuraSystem_v1 } from './LEGACY/aura/NodeAuraSystem_v1.js';

// ============================================================================
// SNIPPET 2: INITIALIZE (Add in constructor or setup function)
// ============================================================================

// After scene is created:
this.auraSystem = new NodeAuraSystem_v1({
  scene: this.scene,
  fxPerformance: this.fxPerformance,  // Optional, for low-FX mode
  profileResolver: (node) => this._resolveAuraProfile(node),  // Optional
  enabled: true,
  lowFXFade: 0.2,        // Intensity multiplier in low-FX mode
  lowFXRadiusFade: 0.5   // Radius multiplier in low-FX mode
});

console.log('[Week 9 Aura System] Initialized');

// ============================================================================
// SNIPPET 3: PROFILE RESOLVER (Helper function)
// ============================================================================

_resolveAuraProfile(node) {
  // Map node categories to aura profiles
  const categoryProfileMap = {
    'control': 'focus_aura',           // Yellow breathing
    'integration': 'resonance_aura',   // Lime pulsing
    'sigma': 'chaos_aura',             // Orange turbulent
    'corrupted': 'corruption_aura',    // Red decay
    'analytics': 'clarity_aura',       // Cyan stable
    'storage': 'entropy_aura',         // Purple fog
    'mythical': 'resonance_aura',      // Lime mystique
    'prime': 'clarity_aura',           // Cyan bright
  };

  // Check category
  const category = node.category || node.userData?.category || 'default';
  
  // Override for corrupted nodes
  if (node.isCorrupted || node.userData?.corrupted) {
    return 'corruption_aura';
  }

  // Override for selected nodes (optional visual feedback)
  if (node.isSelected) {
    return 'focus_aura';
  }

  return categoryProfileMap[category] || 'entropy_aura';
}

// ============================================================================
// SNIPPET 4: REGISTER ON NODE SPAWN (Add in node creation code)
// ============================================================================

// In your node creation/spawn function:
createNode(nodeData) {
  // Create node mesh...
  const nodeMesh = this.createNodeMesh(nodeData);

  // Register with aura system
  if (this.auraSystem && nodeData) {
    this.auraSystem.registerNode(nodeData);
    // console.log(`[Aura] Registered node: ${nodeData.id}`);
  }

  // ... rest of node setup ...
}

// ============================================================================
// SNIPPET 5: UPDATE PER FRAME (Add in render/update loop)
// ============================================================================

// In your game loop (e.g., render() or animate()):
render() {
  const deltaTime = this.clock.getDelta();

  // Update aura system
  if (this.auraSystem) {
    this.auraSystem.update(deltaTime);
  }

  // ... rest of render code ...
  this.renderer.render(this.scene, this.camera);
}

// ============================================================================
// SNIPPET 6: UNREGISTER ON NODE REMOVAL (Add in node cleanup code)
// ============================================================================

// In your node removal/cleanup function:
removeNode(node) {
  // Unregister from aura system
  if (this.auraSystem && node) {
    this.auraSystem.unregisterNode(node);
    // console.log(`[Aura] Unregistered node: ${node.id}`);
  }

  // ... rest of cleanup code ...
}

// ============================================================================
// SNIPPET 7: CLEANUP ON WORLD RESET (Add in reset handler)
// ============================================================================

// In your resetWorld() or similar function:
resetWorld() {
  // Dispose aura system
  if (this.auraSystem) {
    this.auraSystem.dispose();
    console.log('[Week 9 Aura System] Disposed');
  }

  // ... rest of reset code ...

  // Re-initialize if needed
  this.auraSystem = new NodeAuraSystem_v1({
    scene: this.scene,
    fxPerformance: this.fxPerformance,
    profileResolver: (node) => this._resolveAuraProfile(node),
    enabled: true
  });

  console.log('[Week 9 Aura System] Re-initialized after reset');
}

// ============================================================================
// OPTIONAL SNIPPET A: BATCH REGISTRATION (for existing nodes)
// ============================================================================

/**
 * Register all existing nodes with auras (useful on startup)
 */
registerAllNodeAuras(nodes) {
  if (!this.auraSystem) return;

  let registered = 0;
  for (const node of nodes) {
    if (node) {
      this.auraSystem.registerNode(node);
      registered++;
    }
  }

  console.log(`[Aura] Batch registered ${registered} nodes`);
  return registered;
}

// Usage:
// this.registerAllNodeAuras(this.nodes);

// ============================================================================
// OPTIONAL SNIPPET B: DYNAMIC PROFILE SWITCHING
// ============================================================================

/**
 * Change a node's aura profile at runtime
 * (e.g., when node state changes)
 */
updateNodeAuraProfile(node, newProfile) {
  if (!this.auraSystem || !node) return;

  // Unregister with old profile
  this.auraSystem.unregisterNode(node);

  // Update profile resolver to return new profile for this node
  const oldResolver = this.auraSystem.profileResolver;
  this.auraSystem.profileResolver = (n) => {
    if (n === node) return newProfile;
    return oldResolver(n);
  };

  // Re-register with new profile
  this.auraSystem.registerNode(node);

  console.log(`[Aura] Changed profile to: ${newProfile}`);
}

// Usage on node state change:
// if (node.isCorrupted) {
//   this.updateNodeAuraProfile(node, 'corruption_aura');
// }

// ============================================================================
// OPTIONAL SNIPPET C: SELECTIVE AURA ENABLING
// ============================================================================

/**
 * Enable/disable auras for specific node types
 */
setAuraVisibility(nodeCategory, visible) {
  if (!this.auraSystem) return;

  // Iterate through auras and toggle visibility
  for (const [nodeKey, aura] of this.auraSystem.auras) {
    const node = aura.node;
    if (node.category === nodeCategory) {
      aura.mesh.visible = visible;
    }
  }

  console.log(`[Aura] Set ${nodeCategory} visibility: ${visible}`);
}

// Usage:
// this.setAuraVisibility('analytics', true);
// this.setAuraVisibility('corrupted', false);

// ============================================================================
// OPTIONAL SNIPPET D: DEBUG/MONITORING
// ============================================================================

/**
 * Debug information for aura system
 */
debugAuraSystem() {
  if (!this.auraSystem) return;

  const info = {
    enabled: this.auraSystem.enabled,
    auraCount: this.auraSystem.auras.size,
    globalTime: this.auraSystem.globalTime,
    profileCounts: {},
  };

  // Count profiles
  for (const [nodeKey, aura] of this.auraSystem.auras) {
    const profile = aura.profileId;
    info.profileCounts[profile] = (info.profileCounts[profile] || 0) + 1;
  }

  console.group('[Week 9 Aura System] Debug Info');
  console.table(info);
  console.log('Aura registry:', this.auraSystem.auras);
  console.log('Profile library:', this.auraSystem.profileLibrary);
  console.groupEnd();

  return info;
}

// Usage in console:
// game.debugAuraSystem();

// ============================================================================
// OPTIONAL SNIPPET E: PERFORMANCE MONITORING
// ============================================================================

/**
 * Measure aura system performance
 */
benchmarkAuraSystem(iterations = 60) {
  if (!this.auraSystem) return;

  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    this.auraSystem.update(0.016);  // ~60fps deltaTime
    const end = performance.now();
    times.push(end - start);
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const max = Math.max(...times);
  const min = Math.min(...times);

  console.group('[Week 9 Aura System] Performance Benchmark');
  console.log(`Aura count: ${this.auraSystem.auras.size}`);
  console.log(`Iterations: ${iterations}`);
  console.log(`Average: ${avg.toFixed(3)}ms`);
  console.log(`Min: ${min.toFixed(3)}ms`);
  console.log(`Max: ${max.toFixed(3)}ms`);
  console.log(`Budget: <1ms ✓` + (avg < 1 ? ' PASS' : ' FAIL'));
  console.groupEnd();

  return { avg, max, min };
}

// Usage in console:
// game.benchmarkAuraSystem(60);

// ============================================================================
// OPTIONAL SNIPPET F: FULL INTEGRATION EXAMPLE
// ============================================================================

/**
 * Complete example integration in AtomaGame class
 */
class AtomaGameWeek9Example {
  constructor() {
    this.clock = new THREE.Clock();
    this.auraSystem = null;
    this.nodes = [];
  }

  initialize() {
    // Initialize aura system
    this.auraSystem = new NodeAuraSystem_v1({
      scene: this.scene,
      fxPerformance: this.fxPerformance,
      profileResolver: (node) => this._resolveAuraProfile(node),
      enabled: true
    });

    console.log('[Week 9 Aura System] Initialized');
  }

  _resolveAuraProfile(node) {
    const categoryMap = {
      'control': 'focus_aura',
      'integration': 'resonance_aura',
      'sigma': 'chaos_aura',
      'corrupted': 'corruption_aura',
      'analytics': 'clarity_aura',
      'storage': 'entropy_aura',
      'mythical': 'resonance_aura',
      'prime': 'clarity_aura',
    };

    if (node.isCorrupted) return 'corruption_aura';
    if (node.isSelected) return 'focus_aura';

    return categoryMap[node.category] || 'entropy_aura';
  }

  createNode(nodeData) {
    // Create node mesh
    const nodeMesh = this.createNodeMesh(nodeData);

    // Register with aura system
    if (this.auraSystem && nodeData) {
      this.auraSystem.registerNode(nodeData);
    }

    this.nodes.push({ ...nodeData, mesh: nodeMesh });
  }

  removeNode(node) {
    // Unregister from aura system
    if (this.auraSystem && node) {
      this.auraSystem.unregisterNode(node);
    }

    const idx = this.nodes.indexOf(node);
    if (idx >= 0) this.nodes.splice(idx, 1);
  }

  resetWorld() {
    // Dispose all nodes
    for (const node of this.nodes) {
      if (this.auraSystem && node) {
        this.auraSystem.unregisterNode(node);
      }
    }
    this.nodes = [];

    // Dispose aura system
    if (this.auraSystem) {
      this.auraSystem.dispose();
    }

    // Re-initialize
    this.initialize();
  }

  render() {
    const deltaTime = this.clock.getDelta();

    // Update aura system
    if (this.auraSystem) {
      this.auraSystem.update(deltaTime);
    }

    // Render scene
    this.renderer.render(this.scene, this.camera);
  }
}

// ============================================================================
// STEP-BY-STEP INTEGRATION CHECKLIST
// ============================================================================

/*
INTEGRATION CHECKLIST FOR WEEK 9 AURA SYSTEM

STEP 1: COPY MODULE FILE
  [ ] Copy /NodeAuraSystem_v1.js to project root
  [ ] Verify HTTP 200 on: /NodeAuraSystem_v1.js

STEP 2: ADD IMPORT
  [ ] Add import statement (Snippet 1)
  [ ] Verify no import errors in console

STEP 3: INITIALIZE SYSTEM
  [ ] Add initialization code (Snippet 2)
  [ ] Add profile resolver function (Snippet 3)
  [ ] Verify console log: "[Week 9 Aura System] Initialized"

STEP 4: REGISTER NODES
  [ ] Add registration code to node creation (Snippet 4)
  [ ] Create a test node
  [ ] Verify aura appears around node
  [ ] Check visual profile matches category

STEP 5: UPDATE LOOP
  [ ] Add update code to render loop (Snippet 5)
  [ ] Run game
  [ ] Verify auras animate smoothly (no flickering)
  [ ] Measure FPS impact (<1ms)

STEP 6: UNREGISTER ON REMOVAL
  [ ] Add unregister code to node removal (Snippet 6)
  [ ] Delete a node
  [ ] Verify aura disappears

STEP 7: CLEANUP ON RESET
  [ ] Add cleanup code to world reset (Snippet 7)
  [ ] Reset world
  [ ] Verify aura system re-initializes
  [ ] Check no memory leaks

STEP 8: TEST ALL PROFILES
  [ ] Verify clarity_aura (cyan)
  [ ] Verify resonance_aura (lime)
  [ ] Verify chaos_aura (orange)
  [ ] Verify focus_aura (yellow)
  [ ] Verify corruption_aura (red)
  [ ] Verify entropy_aura (purple)
  [ ] All visually distinct and profile-appropriate

STEP 9: ADVANCED TESTING (optional)
  [ ] Use Snippet A for batch registration
  [ ] Use Snippet B for dynamic profile switching
  [ ] Use Snippet D for debug info
  [ ] Use Snippet E for performance benchmark

STEP 10: VERIFICATION
  [ ] All auras render correctly
  [ ] Auras react to personality signals
  [ ] Low-FX mode reduces intensity
  [ ] FPS stable (<1ms budget)
  [ ] No console errors
  [ ] Memory stable (no leaks over time)

DONE: Week 9 Aura System fully integrated and production-ready!
*/

// ============================================================================
// END OF INTEGRATION SNIPPET
// ============================================================================

/**
 * For more information, see:
 * - /WEEK9_AURA_SYSTEM_GUIDE.md (comprehensive guide)
 * - /WEEK9_AURA_SYSTEM_QUICKREF.txt (quick reference)
 * - /WEEK9_AURA_SYSTEM_SUMMARY.md (executive summary)
 * - /WEEK9_AURA_PROFILES_REFERENCE.md (profile documentation)
 * - /NodeAuraSystem_v1.js (full source code)
 */
