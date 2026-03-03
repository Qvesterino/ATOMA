/**
 * PHASE 3C WEEK 8 ALT: INTEGRATION SNIPPET
 * 
 * Copy-paste ready code to integrate PersonalityShaderStabilizedFX_v1 into your project.
 * 
 * SAFE MODE: No modifications to main.js required.
 * Just add these snippets to appropriate locations.
 */

// ============================================================================
// SNIPPET 1: IMPORT (Add to top of main.js or initialization file)
// ============================================================================

import { PersonalityShaderStabilizedFX_v1 } from './PersonalityShaderStabilizedFX_v1.js';

// ============================================================================
// SNIPPET 2: INITIALIZE (Add in constructor or setup function)
// ============================================================================

// After PersonalityShaderAdvancedFX_v1 is initialized:
this.stabilizedFX = new PersonalityShaderStabilizedFX_v1({
  advancedFX: this.advancedShaderFX,
  lowFXProvider: () => this.lowFXModeEnabled,
  enabled: true
});

console.log('[Week 8 ALT] GPU Stabilization system initialized');

// ============================================================================
// SNIPPET 3: REGISTER ON NODE SPAWN (Add in node creation code)
// ============================================================================

// Profile mapping by node category
const profileMap = {
  'control': 'focus_stable',           // Radial breathing
  'integration': 'resonance_stable',   // Pulsing wave
  'sigma': 'chaos_stable',             // Turbulent
  'corrupted': 'corruption_stable',    // Red fracturing
  'analytics': 'clarity_stable',       // Smooth bloom
  'storage': 'entropy_stable',         // Slow morphing
  'mythical': 'resonance_stable',      // Mystical pulse
  'prime': 'clarity_stable',           // Bright stable
};

// On node creation, after mesh material is assigned:
const profile = profileMap[node.category] || 'entropy_stable';
if (this.stabilizedFX && nodeMesh && nodeMesh.material) {
  this.stabilizedFX.register(nodeMesh.material, profile);
  // console.log(`[Week 8 ALT] Registered ${node.category} node with profile: ${profile}`);
}

// ============================================================================
// SNIPPET 4: UPDATE PER FRAME (Add in render/update loop)
// ============================================================================

// In your main render or update function:
if (this.stabilizedFX) {
  this.stabilizedFX.update(deltaTime);
}

// Example in render loop:
//   render() {
//     const deltaTime = this.clock.getDelta();
//     this.stabilizedFX?.update(deltaTime);
//     this.renderer.render(this.scene, this.camera);
//   }

// ============================================================================
// SNIPPET 5: UNREGISTER ON NODE REMOVAL (Add in node cleanup code)
// ============================================================================

// On node removal/deletion:
if (this.stabilizedFX && nodeMesh && nodeMesh.material) {
  this.stabilizedFX.unregister(nodeMesh.material);
  // console.log('[Week 8 ALT] Unregistered node material');
}

// ============================================================================
// SNIPPET 6: CLEANUP ON WORLD RESET (Add in world reset handler)
// ============================================================================

// In resetWorld() or similar cleanup function:
if (this.stabilizedFX) {
  this.stabilizedFX.dispose();
  this.stabilizedFX = null;
  console.log('[Week 8 ALT] GPU Stabilization system disposed');
}

// Re-initialize if needed:
this.stabilizedFX = new PersonalityShaderStabilizedFX_v1({
  advancedFX: this.advancedShaderFX,
  lowFXProvider: () => this.lowFXModeEnabled,
  enabled: true
});

// ============================================================================
// OPTIONAL SNIPPET A: PROFILE DYNAMIC SELECTION
// ============================================================================

/**
 * Select profile based on multiple criteria
 * (Category, state, quality, etc.)
 */
function selectStabilizedProfile(node, quality = 'high') {
  // By category first
  const categoryMap = {
    'control': 'focus_stable',
    'integration': 'resonance_stable',
    'sigma': 'chaos_stable',
    'corrupted': 'corruption_stable',
    'analytics': 'clarity_stable',
    'storage': 'entropy_stable',
    'mythical': 'resonance_stable',
    'prime': 'clarity_stable',
  };

  let profile = categoryMap[node.category] || 'entropy_stable';

  // Override by state if needed
  if (node.isSelected) {
    profile = 'focus_stable';  // Emphasize selection
  } else if (node.isCorrupted) {
    profile = 'corruption_stable';  // Emphasize damage
  } else if (quality === 'low') {
    profile = 'clarity_stable';  // Lightest profile
  }

  return profile;
}

// Usage:
const profile = selectStabilizedProfile(node, 'high');
this.stabilizedFX.register(nodeMesh.material, profile);

// ============================================================================
// OPTIONAL SNIPPET B: PROFILE RUNTIME SWITCHING
// ============================================================================

/**
 * Switch a material's profile at runtime
 */
function changeNodeProfile(nodeMesh, newProfile) {
  if (!this.stabilizedFX || !nodeMesh.material) return;

  // Unregister old profile
  this.stabilizedFX.unregister(nodeMesh.material);

  // Register new profile
  this.stabilizedFX.register(nodeMesh.material, newProfile);
  console.log(`[Week 8 ALT] Switched profile to: ${newProfile}`);
}

// Usage on node selection change:
changeNodeProfile(selectedNodeMesh, 'focus_stable');

// ============================================================================
// OPTIONAL SNIPPET C: BATCH REGISTRATION (for existing nodes)
// ============================================================================

/**
 * Register all existing node materials at once
 */
function registerAllNodes(nodes) {
  const categoryMap = {
    'control': 'focus_stable',
    'integration': 'resonance_stable',
    'sigma': 'chaos_stable',
    'corrupted': 'corruption_stable',
    'analytics': 'clarity_stable',
    'storage': 'entropy_stable',
    'mythical': 'resonance_stable',
    'prime': 'clarity_stable',
  };

  let registered = 0;
  for (const node of nodes) {
    if (node.mesh && node.mesh.material) {
      const profile = categoryMap[node.category] || 'entropy_stable';
      this.stabilizedFX.register(node.mesh.material, profile);
      registered++;
    }
  }

  console.log(`[Week 8 ALT] Registered ${registered} node materials`);
  return registered;
}

// Usage:
registerAllNodes(this.nodes);

// ============================================================================
// OPTIONAL SNIPPET D: DEBUG/MONITORING
// ============================================================================

/**
 * Debug info for Week 8 ALT system
 */
function debugStabilizedFX() {
  const info = {
    enabled: this.stabilizedFX.enabled,
    materialCount: this.stabilizedFX.materials.size,
    globalTime: this.stabilizedFX.globalTime,
    profiles: Array.from(this.stabilizedFX.materials.values())
      .map(d => d.profile)
      .reduce((acc, p) => {
        acc[p] = (acc[p] || 0) + 1;
        return acc;
      }, {}),
  };

  console.group('[Week 8 ALT] Debug Info');
  console.table(info);
  console.log('Materials:', this.stabilizedFX.materials);
  console.groupEnd();

  return info;
}

// Usage in console:
// debugStabilizedFX();

// ============================================================================
// OPTIONAL SNIPPET E: PERFORMANCE MONITORING
// ============================================================================

/**
 * Measure Week 8 ALT update performance
 */
function benchmarkStabilizedFX(nodeCount = 200) {
  const iterations = 60;
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    this.stabilizedFX.update(0.016);  // ~60fps deltaTime
    const end = performance.now();
    times.push(end - start);
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const max = Math.max(...times);
  const min = Math.min(...times);

  console.group('[Week 8 ALT] Performance Benchmark');
  console.log(`Node count: ${nodeCount}`);
  console.log(`Iterations: ${iterations}`);
  console.log(`Average: ${avg.toFixed(3)}ms`);
  console.log(`Min: ${min.toFixed(3)}ms`);
  console.log(`Max: ${max.toFixed(3)}ms`);
  console.log(`Budget: <2ms ✓` + (avg < 2 ? ' PASS' : ' FAIL'));
  console.groupEnd();

  return { avg, max, min };
}

// Usage in console:
// benchmarkStabilizedFX();

// ============================================================================
// OPTIONAL SNIPPET F: FULL INTEGRATION EXAMPLE
// ============================================================================

/**
 * Complete example integration in AtomaGame class
 */
class AtomaGameWeek8Example {
  constructor() {
    this.clock = new THREE.Clock();
    this.advancedShaderFX = null;
    this.stabilizedFX = null;
    this.nodes = [];
  }

  initialize() {
    // 1. Initialize Week 5 (Advanced FX)
    // this.advancedShaderFX = new PersonalityShaderAdvancedFX_v1({...});

    // 2. Initialize Week 8 ALT (GPU Stabilization)
    this.stabilizedFX = new PersonalityShaderStabilizedFX_v1({
      advancedFX: this.advancedShaderFX,
      lowFXProvider: () => this.lowFXModeEnabled,
      enabled: true
    });

    console.log('[Week 8 ALT] System initialized');
  }

  createNode(nodeData) {
    // Create node mesh...
    const nodeMesh = this.createNodeMesh(nodeData);

    // Register with stabilized profile
    const profileMap = {
      'control': 'focus_stable',
      'integration': 'resonance_stable',
      'sigma': 'chaos_stable',
      'corrupted': 'corruption_stable',
      'analytics': 'clarity_stable',
      'storage': 'entropy_stable',
      'mythical': 'resonance_stable',
      'prime': 'clarity_stable',
    };
    const profile = profileMap[nodeData.category] || 'entropy_stable';

    if (this.stabilizedFX && nodeMesh.material) {
      this.stabilizedFX.register(nodeMesh.material, profile);
    }

    this.nodes.push({ ...nodeData, mesh: nodeMesh });
  }

  removeNode(node) {
    if (this.stabilizedFX && node.mesh && node.mesh.material) {
      this.stabilizedFX.unregister(node.mesh.material);
    }

    const idx = this.nodes.indexOf(node);
    if (idx >= 0) this.nodes.splice(idx, 1);
  }

  resetWorld() {
    // Cleanup all nodes
    for (const node of this.nodes) {
      if (this.stabilizedFX && node.mesh && node.mesh.material) {
        this.stabilizedFX.unregister(node.mesh.material);
      }
    }
    this.nodes = [];

    // Dispose Week 8 ALT
    if (this.stabilizedFX) {
      this.stabilizedFX.dispose();
      this.stabilizedFX = null;
    }

    // Re-initialize
    this.initialize();
  }

  render() {
    const deltaTime = this.clock.getDelta();

    // Update Week 8 ALT every frame
    if (this.stabilizedFX) {
      this.stabilizedFX.update(deltaTime);
    }

    // Render scene...
    this.renderer.render(this.scene, this.camera);
  }
}

// ============================================================================
// STEP-BY-STEP INTEGRATION CHECKLIST
// ============================================================================

/*
STEP 1: COPY MODULE FILE
  [ ] Copy /PersonalityShaderStabilizedFX_v1.js to project root
  [ ] Verify HTTP 200 on: /PersonalityShaderStabilizedFX_v1.js

STEP 2: ADD IMPORT
  [ ] Add "import { PersonalityShaderStabilizedFX_v1 } from '...';" at top
  [ ] Verify no import errors in console

STEP 3: INITIALIZE SYSTEM
  [ ] Initialize in constructor or setup function (after Week 5)
  [ ] Verify console log: "[Week 8 ALT] GPU Stabilization system initialized"

STEP 4: REGISTER MATERIALS
  [ ] Add registration code to node creation handler
  [ ] Test: Create a node, check materials map size grows
  [ ] Verify visual effects appear

STEP 5: UPDATE LOOP
  [ ] Add update(deltaTime) to render/update loop
  [ ] Measure FPS impact (should be <2ms for 200 nodes)

STEP 6: UNREGISTER ON REMOVAL
  [ ] Add unregister() to node removal handler
  [ ] Test: Delete node, check materials map size shrinks

STEP 7: CLEANUP ON RESET
  [ ] Add dispose() + re-init to world reset function
  [ ] Test: Reset world, verify no memory leaks

STEP 8: TEST & VERIFY
  [ ] Visual effects present and smooth (no flicker)
  [ ] FPS stable (<2ms per frame)
  [ ] No console errors or warnings
  [ ] Wave phases continuous (no popping)
  [ ] Memory stable over time (no leaks)

STEP 9: OPTIONAL - DEBUG
  [ ] Use debugStabilizedFX() to inspect system state
  [ ] Use benchmarkStabilizedFX() to measure performance

DONE: Week 8 ALT fully integrated and production-ready!
*/

// ============================================================================
// END OF INTEGRATION SNIPPET
// ============================================================================

/**
 * For more information, see:
 * - /WEEK8_ALT_GPU_STABILIZATION_GUIDE.md (comprehensive guide)
 * - /WEEK8_ALT_GPU_STABILIZATION_QUICKREF.txt (quick reference)
 * - /WEEK8_ALT_GPU_STABILIZATION_SUMMARY.md (executive summary)
 * - /PersonalityShaderStabilizedFX_v1.js (full source code)
 */
