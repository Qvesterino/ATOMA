/**
 * FRESNEL AURA INTEGRATION EXAMPLE
 * =================================
 * Copy-paste ready integration patterns for ATOMA project
 * Shows how to wire fresnel auras into existing world systems
 * 
 * Usage:
 * 1. Import patterns from this file
 * 2. Adapt to your specific world/AINodes structure
 * 3. Integrate into main.js initialization and render loop
 */

import * as THREE from 'three';
import { patchAINodesToUseFresnelAuras, updateFresnelAuraUniforms } from './FresnelAuraIntegrationPatch.js';

// ==============================================================================
// PATTERN 1: MINIMAL INTEGRATION (Recommended for most cases)
// ==============================================================================

/**
 * Initialize fresnel auras at world startup
 * Call this ONCE in your world initialization (right after AINodes setup)
 * 
 * @param {Object} AINodes The AINodes class/module
 */
export function initializeFresnelAurasMinimal(AINodes) {
  console.log('[FresnelAura] Initializing with minimal setup...');

  // Apply fresnel aura patch with defaults
  const patchResult = patchAINodesToUseFresnelAuras(AINodes, {
    enabled: true,
    variant: 'basic',        // Simple, fast, organic-looking
    rimPower: 2.0,           // Balanced edge sharpness
    rimScale: 1.5,           // Standard intensity
    fresnelMin: 0.3,         // Prevent edge from disappearing
    fresnelMax: 1.0,         // Allow full intensity at edges
  });

  console.log('[FresnelAura] Patch applied:', patchResult);
}

/**
 * Update all node auras in render loop (MINIMAL)
 * Call this EVERY FRAME in your animation function
 * 
 * @param {Array<THREE.Object3D>} nodeObjects All node meshes in scene
 * @param {number} time Current time in milliseconds (from requestAnimationFrame)
 */
export function updateFresnelAurasMinimal(nodeObjects, time) {
  const seconds = time / 1000;

  for (const nodeObj of nodeObjects) {
    // Find the aura mesh (marked with userData.isAura)
    const auraMesh = nodeObj.children?.find(c => c.userData?.isAura);
    if (!auraMesh || !auraMesh.material?.uniforms) continue;

    // Update core animation time
    auraMesh.material.uniforms.uTime.value = seconds;

    // Optional: Pulse aura based on harmony strength (if available)
    if (nodeObj.data?.harmonyAuraStrength !== undefined) {
      auraMesh.material.uniforms.uAuraStrength.value = nodeObj.data.harmonyAuraStrength;
    }
  }
}

// ==============================================================================
// PATTERN 2: ADVANCED INTEGRATION (With state tracking)
// ==============================================================================

/**
 * Initialize fresnel auras with advanced config
 * Use for performance tuning or specific visual goals
 * 
 * @param {Object} AINodes The AINodes class/module
 * @param {Object} config Custom configuration
 */
export function initializeFresnelAurasAdvanced(AINodes, config = {}) {
  const defaultConfig = {
    enabled: true,
    variant: 'basic',
    rimPower: 2.0,
    rimScale: 1.5,
  };

  const finalConfig = { ...defaultConfig, ...config };

  console.log('[FresnelAura] Advanced init with config:', finalConfig);
  patchAINodesToUseFresnelAuras(AINodes, finalConfig);

  // Create a module-level state tracker
  window._fresnelAuraState = {
    config: finalConfig,
    nodeAuras: new Map(),
    lastUpdateTime: 0,
    frameCount: 0,
  };
}

/**
 * Update auras with state-aware logic
 * Tracks node states and applies smooth transitions
 * 
 * @param {Array<THREE.Object3D>} nodeObjects All nodes
 * @param {number} time Current time in milliseconds
 */
export function updateFresnelAurasAdvanced(nodeObjects, time) {
  const state = window._fresnelAuraState;
  if (!state) return;

  const seconds = time / 1000;
  const deltaTime = seconds - state.lastUpdateTime;
  state.lastUpdateTime = seconds;
  state.frameCount++;

  for (const nodeObj of nodeObjects) {
    const auraMesh = nodeObj.children?.find(c => c.userData?.isAura);
    if (!auraMesh?.material?.uniforms) continue;

    const nodeId = nodeObj.data?.id || nodeObj.uuid;
    let auraState = state.nodeAuras.get(nodeId) || {
      targetStrength: 0.5,
      currentStrength: 0.5,
    };

    // Update target strength from node
    if (nodeObj.data?.harmonyAuraStrength !== undefined) {
      auraState.targetStrength = nodeObj.data.harmonyAuraStrength;
    }

    // Smooth interpolation (0.1 = 10% per frame at 60fps)
    const lerpFactor = 0.1;
    auraState.currentStrength += (auraState.targetStrength - auraState.currentStrength) * lerpFactor;

    // Update uniforms
    const uniforms = auraMesh.material.uniforms;
    uniforms.uTime.value = seconds;
    uniforms.uAuraStrength.value = auraState.currentStrength;

    // Apply breathing pulse
    const pulse = Math.sin(seconds * 1.5 + nodeId.charCodeAt(0)) * 0.2 + 1.0;
    uniforms.uAuraPulse.value = pulse;

    // Apply radius scaling (expansion based on corruption/synergy)
    if (nodeObj.data?.expansion !== undefined) {
      uniforms.uAuraRadius.value = 1.0 + nodeObj.data.expansion * 0.35;
    }

    // Cache state
    state.nodeAuras.set(nodeId, auraState);
  }

  // Log stats periodically
  if (state.frameCount % 300 === 0) {
    console.log(`[FresnelAura] Updated ${state.nodeAuras.size} auras in frame ${state.frameCount}`);
  }
}

// ==============================================================================
// PATTERN 3: DISTANCE-OPTIMIZED (For large networks)
// ==============================================================================

/**
 * Initialize with distance falloff for performance scaling
 * Useful when you have 500+ nodes
 * 
 * @param {Object} AINodes The AINodes class/module
 * @param {THREE.Camera} camera The scene camera
 */
export function initializeFresnelAurasDistanceOptimized(AINodes, camera) {
  console.log('[FresnelAura] Initializing distance-optimized variant...');

  patchAINodesToUseFresnelAuras(AINodes, {
    enabled: true,
    variant: 'distance',           // Use distance variant
    rimPower: 2.0,
    rimScale: 1.5,
    distanceFalloffStart: 15.0,    // Start falloff at 15 units
    distanceFalloffEnd: 60.0,       // Fully faded at 60 units
  });

  window._fresnelAuraDistanceState = {
    camera,
    lastCameraPos: camera.position.clone(),
  };
}

/**
 * Update auras with distance-aware culling
 * Skips updates for very distant nodes
 * 
 * @param {Array<THREE.Object3D>} nodeObjects All nodes
 * @param {number} time Current time
 */
export function updateFresnelAurasDistanceOptimized(nodeObjects, time) {
  const state = window._fresnelAuraDistanceState;
  if (!state) return;

  const seconds = time / 1000;
  const cameraPos = state.camera.position;
  const maxDistance = 80;  // Skip updates beyond this distance

  for (const nodeObj of nodeObjects) {
    const auraMesh = nodeObj.children?.find(c => c.userData?.isAura);
    if (!auraMesh?.material?.uniforms) continue;

    const distance = nodeObj.position.distanceTo(cameraPos);

    // Skip updates for very distant nodes (optimization)
    if (distance > maxDistance) {
      auraMesh.visible = false;
      continue;
    }

    auraMesh.visible = true;

    // Update camera position for distance falloff
    auraMesh.material.uniforms.uCameraPosition.value.copy(cameraPos);

    // Update animation
    auraMesh.material.uniforms.uTime.value = seconds;
    auraMesh.material.uniforms.uAuraStrength.value = nodeObj.data?.harmonyAuraStrength || 0.5;

    // Breathing (same for all)
    auraMesh.material.uniforms.uAuraPulse.value = Math.sin(seconds * 1.5) * 0.2 + 1.0;
  }
}

// ==============================================================================
// PATTERN 4: MULTI-BAND COMPLEX VARIANT
// ==============================================================================

/**
 * Initialize with complex multi-band fresnel
 * Use for hero/important nodes that need visual emphasis
 * 
 * @param {Object} AINodes The AINodes class/module
 */
export function initializeFresnelAurasMultiBand(AINodes) {
  console.log('[FresnelAura] Initializing multi-band variant...');

  patchAINodesToUseFresnelAuras(AINodes, {
    enabled: true,
    variant: 'multiband',          // Complex, visually rich
    rimPower: 2.5,                 // Balanced (used for second band)
  });
}

/**
 * Update multi-band auras with category-aware colors
 * 
 * @param {Array<THREE.Object3D>} nodeObjects All nodes
 * @param {number} time Current time
 */
export function updateFresnelAurasMultiBand(nodeObjects, time) {
  const seconds = time / 1000;

  for (const nodeObj of nodeObjects) {
    const auraMesh = nodeObj.children?.find(c => c.userData?.isAura);
    if (!auraMesh?.material?.uniforms) continue;

    // Update animation
    auraMesh.material.uniforms.uTime.value = seconds;
    auraMesh.material.uniforms.uAuraStrength.value = nodeObj.data?.harmonyAuraStrength || 0.5;

    // Multi-band variant has additional control
    if (auraMesh.material.uniforms.uRimPower1) {
      // Can adjust two separate powers
      auraMesh.material.uniforms.uRimPower1.value = 1.8;  // Softer outer band
      auraMesh.material.uniforms.uRimPower2.value = 3.0;  // Sharper inner band
    }

    // Category-specific edge color
    if (auraMesh.material.uniforms.uEdgeColor) {
      const edgeColor = getCategoryEdgeColor(nodeObj.data?.category);
      auraMesh.material.uniforms.uEdgeColor.value.copy(edgeColor);
    }
  }
}

/**
 * Get edge highlight color for node category
 */
function getCategoryEdgeColor(category) {
  const colors = {
    control: new THREE.Color(0xff0080),      // Magenta
    prime: new THREE.Color(0x00ff00),        // Lime
    axiom: new THREE.Color(0xffff00),        // Yellow
    emotional: new THREE.Color(0xff69b4),    // Hot pink
    error: new THREE.Color(0xff4444),        // Red
    mythic: new THREE.Color(0x9933ff),       // Purple
    default: new THREE.Color(0x00ffff),      // Cyan
  };
  return colors[category] || colors.default;
}

// ==============================================================================
// PATTERN 5: INTEGRATION INTO MAIN.JS
// ==============================================================================

/**
 * Example main.js integration
 * Shows how to wire everything together
 * 
 * USAGE:
 * 1. Copy this pattern into your main.js
 * 2. Replace placeholder references with actual variable names
 * 3. Adjust timing/parameters to your needs
 */
export const MAIN_JS_INTEGRATION_EXAMPLE = `
// In main.js, early in world initialization:

import { initializeFresnelAurasMinimal, updateFresnelAurasMinimal } from './FresnelAuraIntegrationExample.js';

// ... existing world setup ...

// After AINodes is created and ready:
initializeFresnelAurasMinimal(AINodes);

// In your animation/render loop:
function animate(time) {
  // ... existing animation logic ...

  // Update fresnel auras (after updating nodes)
  updateFresnelAurasMinimal(scene.children, time);

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);
`;

// ==============================================================================
// PATTERN 6: PERFORMANCE MONITORING
// ==============================================================================

/**
 * Monitor fresnel aura performance
 * Logs timing information
 * 
 * @param {Array<THREE.Object3D>} nodeObjects All nodes
 * @param {number} iterationCount How many times to test
 */
export function benchmarkFresnelAuraPerformance(nodeObjects, iterationCount = 100) {
  console.log(`[FresnelAura Benchmark] Starting with ${nodeObjects.length} nodes...`);

  const times = [];

  for (let iter = 0; iter < iterationCount; iter++) {
    const start = performance.now();

    // Simulate update
    for (const nodeObj of nodeObjects) {
      const auraMesh = nodeObj.children?.find(c => c.userData?.isAura);
      if (auraMesh?.material?.uniforms) {
        auraMesh.material.uniforms.uTime.value = Math.random() * 10;
        auraMesh.material.uniforms.uAuraStrength.value = Math.random();
      }
    }

    const elapsed = performance.now() - start;
    times.push(elapsed);
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  console.log(`[FresnelAura Benchmark] Results:`);
  console.log(`  Average: ${avg.toFixed(2)}ms per frame`);
  console.log(`  Min: ${min.toFixed(2)}ms`);
  console.log(`  Max: ${max.toFixed(2)}ms`);
  console.log(`  Per node: ${(avg / nodeObjects.length).toFixed(3)}ms`);
}

// ==============================================================================
// PATTERN 7: REAL-TIME PARAMETER ADJUSTMENT (Console)
// ==============================================================================

/**
 * Console commands for real-time tuning
 * Paste these into browser console to experiment with settings
 * 
 * Example usage in console:
 *   fresnelAuraConsole.setRimPower(2.5)
 *   fresnelAuraConsole.setRimScale(2.0)
 *   fresnelAuraConsole.updateAllAuras()
 */
export const fresnelAuraConsole = {
  /**
   * Update rim power for all auras
   */
  setRimPower(value) {
    console.log(`Setting rim power to ${value}`);
    scene.traverse(obj => {
      if (obj.userData.isAura && obj.material?.uniforms?.uRimPower) {
        obj.material.uniforms.uRimPower.value = value;
      }
    });
  },

  /**
   * Update rim scale for all auras
   */
  setRimScale(value) {
    console.log(`Setting rim scale to ${value}`);
    scene.traverse(obj => {
      if (obj.userData.isAura && obj.material?.uniforms?.uRimScale) {
        obj.material.uniforms.uRimScale.value = value;
      }
    });
  },

  /**
   * Update fresnel range
   */
  setFresnelRange(min, max) {
    console.log(`Setting fresnel range [${min}, ${max}]`);
    scene.traverse(obj => {
      if (obj.userData.isAura && obj.material?.uniforms) {
        obj.material.uniforms.uFresnelMin.value = min;
        obj.material.uniforms.uFresnelMax.value = max;
      }
    });
  },

  /**
   * Print current settings
   */
  printSettings() {
    const sample = Array.from(scene.children).find(
      obj => obj.userData.isAura && obj.material?.uniforms
    );
    if (!sample) {
      console.log('No fresnel aura found');
      return;
    }
    const u = sample.material.uniforms;
    console.log('Current Fresnel Aura Settings:');
    console.log(`  rimPower: ${u.uRimPower?.value}`);
    console.log(`  rimScale: ${u.uRimScale?.value}`);
    console.log(`  fresnelMin: ${u.uFresnelMin?.value}`);
    console.log(`  fresnelMax: ${u.uFresnelMax?.value}`);
    console.log(`  auraOpacity: ${u.uAuraOpacity?.value}`);
  },
};

// ==============================================================================
// PATTERN 8: QUICK START TEMPLATE
// ==============================================================================

/**
 * Complete quick-start template for main.js
 * Copy and adapt to your specific setup
 */
export const QUICKSTART_TEMPLATE = `
import { patchAINodesToUseFresnelAuras, updateFresnelAuraUniforms } from './FresnelAuraIntegrationPatch.js';

// Initialize (call once at startup)
function initWorld() {
  // ... existing world setup ...

  // Apply fresnel aura patch
  patchAINodesToUseFresnelAuras(AINodes, {
    enabled: true,
    variant: 'basic',
    rimPower: 2.0,
    rimScale: 1.5,
  });

  console.log('Fresnel auras initialized!');
}

// Update (call every frame)
function animate(time) {
  const seconds = time / 1000;

  // Update all node auras
  scene.children.forEach(node => {
    if (!node.data) return;
    const aura = node.children.find(c => c.userData?.isAura);
    if (!aura) return;

    updateFresnelAuraUniforms(aura, seconds, {
      auraStrength: node.data.harmonyAuraStrength || 0.5,
      auraOpacity: 0.3,
      auraRadius: 1.0,
      auraPulse: Math.sin(seconds * 1.5) * 0.2 + 1.0,
    });
  });

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

initWorld();
requestAnimationFrame(animate);
`;

// ==============================================================================
// EXPORT ALL PATTERNS
// ==============================================================================

export default {
  // Minimal pattern
  initializeFresnelAurasMinimal,
  updateFresnelAurasMinimal,

  // Advanced pattern
  initializeFresnelAurasAdvanced,
  updateFresnelAurasAdvanced,

  // Distance-optimized pattern
  initializeFresnelAurasDistanceOptimized,
  updateFresnelAurasDistanceOptimized,

  // Multi-band pattern
  initializeFresnelAurasMultiBand,
  updateFresnelAurasMultiBand,

  // Utilities
  benchmarkFresnelAuraPerformance,
  fresnelAuraConsole,

  // Templates
  MAIN_JS_INTEGRATION_EXAMPLE,
  QUICKSTART_TEMPLATE,
};
