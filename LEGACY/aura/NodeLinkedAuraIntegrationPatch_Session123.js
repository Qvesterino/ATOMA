/**
 * NodeLinkedAuraIntegrationPatch_Session123.js
 * ============================================================================
 * INTEGRATION HELPERS FOR NODE-LINKED AURA SYSTEM
 * 
 * Provides setup, update, and lifecycle management functions
 * for seamless integration with main.js and node spawn/death events.
 * 
 * @author VFX Technical Director — ATOMA Project Session 123
 * @version 1.0.0
 */

import { NodeLinkedAuraSystem_Session123 } from './NodeLinkedAuraSystem_Session123.js';

/**
 * Setup node aura system
 */
export function setupNodeLinkedAuraSystem(scene, world, config = {}) {
  const auraSystem = new NodeLinkedAuraSystem_Session123(scene, world, {
    // Mesh generation
    minorRadius: config.minorRadius ?? 0.8,
    majorRadius: config.majorRadius ?? 2.0,
    radialSegments: config.radialSegments ?? 32,
    tubeSegments: config.tubeSegments ?? 48,
    
    // Fragmentation
    fragmentationLevel: config.fragmentationLevel ?? 0.3,
    
    // Deformation
    baseNoiseAmplitude: config.baseNoiseAmplitude ?? 0.15,
    linkDeformationStrength: config.linkDeformationStrength ?? 0.4,
    maxLinkInfluence: config.maxLinkInfluence ?? 3,
    
    // Dynamics
    pulseSpeed: config.pulseSpeed ?? 2.0,
    basePulseAmplitude: config.basePulseAmplitude ?? 0.1,
    synergyPulseBoost: config.synergyPulseBoost ?? 1.5,
    
    // Corruption/Harmony
    corruptionFragmentSpacing: config.corruptionFragmentSpacing ?? 0.08,
    instabilityPhaseJitter: config.instabilityPhaseJitter ?? 0.1,
    
    // LOD
    lodDistanceThreshold: config.lodDistanceThreshold ?? 50,
    
    enabled: config.enabled ?? true,
    debugMode: config.debugMode ?? false,
  });
  
  // Store on world
  world._nodeLinkedAuraSystem = auraSystem;
  
  console.log('[Session 123] NodeLinkedAuraSystem integrated');
  
  return auraSystem;
}

/**
 * Update aura system each frame
 */
export function updateNodeLinkedAuraSystem(deltaTime, world, nodes, camera) {
  if (!world._nodeLinkedAuraSystem) return;
  
  const auraSystem = world._nodeLinkedAuraSystem;
  auraSystem.update(deltaTime, nodes, camera);
}

/**
 * Create aura for spawned node
 */
export function createAuraForNode(node, world) {
  if (!world._nodeLinkedAuraSystem) return null;
  
  return world._nodeLinkedAuraSystem.createAura(node);
}

/**
 * Remove aura for deleted node
 */
export function removeAuraForNode(node, world) {
  if (!world._nodeLinkedAuraSystem) return;
  
  world._nodeLinkedAuraSystem.removeAura(node);
}

/**
 * Add echo imprint effect (called from wave/streak systems)
 */
export function addEchoImprintToAura(node, direction, strength = 0.5, world) {
  if (!world._nodeLinkedAuraSystem) return;
  
  world._nodeLinkedAuraSystem.addEchoImprint(node, direction, strength);
}

/**
 * Cleanup aura system
 */
export function cleanupNodeLinkedAuraSystem(world) {
  if (!world._nodeLinkedAuraSystem) return;
  
  world._nodeLinkedAuraSystem.dispose();
  world._nodeLinkedAuraSystem = null;
  
  console.log('[Session 123] NodeLinkedAuraSystem disposed');
}

/**
 * Setup debug console API
 */
export function setupNodeLinkedAuraConsoleAPI(world) {
  window.AtomDebug = window.AtomDebug || {};
  
  window.AtomDebug.nodeAuras = {
    getStats: () => {
      if (!world._nodeLinkedAuraSystem) return null;
      return world._nodeLinkedAuraSystem.getStats();
    },
    
    setFragmentation: (level) => {
      if (!world._nodeLinkedAuraSystem) return;
      world._nodeLinkedAuraSystem.config.fragmentationLevel = Math.clamp(level, 0, 1);
      console.log(`[Session 123] Fragmentation: ${level}`);
    },
    
    setLinkDeformation: (strength) => {
      if (!world._nodeLinkedAuraSystem) return;
      world._nodeLinkedAuraSystem.config.linkDeformationStrength = strength;
      console.log(`[Session 123] Link deformation strength: ${strength}`);
    },
    
    setPulseSpeed: (speed) => {
      if (!world._nodeLinkedAuraSystem) return;
      world._nodeLinkedAuraSystem.config.pulseSpeed = speed;
      console.log(`[Session 123] Pulse speed: ${speed}`);
    },
    
    setSynergyBoost: (boost) => {
      if (!world._nodeLinkedAuraSystem) return;
      world._nodeLinkedAuraSystem.config.synergyPulseBoost = boost;
      console.log(`[Session 123] Synergy pulse boost: ${boost}`);
    },
    
    setNoiseAmplitude: (amp) => {
      if (!world._nodeLinkedAuraSystem) return;
      world._nodeLinkedAuraSystem.config.baseNoiseAmplitude = amp;
      console.log(`[Session 123] Base noise amplitude: ${amp}`);
    },
    
    enable: () => {
      if (!world._nodeLinkedAuraSystem) return;
      world._nodeLinkedAuraSystem.config.enabled = true;
      console.log('[Session 123] Node auras enabled');
    },
    
    disable: () => {
      if (!world._nodeLinkedAuraSystem) return;
      world._nodeLinkedAuraSystem.config.enabled = false;
      console.log('[Session 123] Node auras disabled');
    },
    
    // Test echo imprints
    testEcho: (nodeId) => {
      if (!world._nodeLinkedAuraSystem) return;
      const nodes = world.nodes || [];
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        world._nodeLinkedAuraSystem.addEchoImprint(
          node,
          new THREE.Vector3(1, 0, 0),
          0.7,
          0.3
        );
        console.log('[Session 123] Echo imprint triggered');
      }
    },
  };
  
  console.log('[Session 123] Debug API: Use window.AtomDebug.nodeAuras.*');
}

/**
 * Hook into node spawn events
 */
export function setupNodeSpawnHook(world) {
  const originalSpawn = AINodes.prototype.spawn;
  if (!originalSpawn) return;
  
  AINodes.prototype.spawn = function(...args) {
    const node = originalSpawn.apply(this, args);
    
    if (node && world._nodeLinkedAuraSystem) {
      // Create aura for new node
      createAuraForNode(node, world);
    }
    
    return node;
  };
}

/**
 * Hook into node death events
 */
export function setupNodeDeathHook(world) {
  // This would need to hook into node deletion/death events
  // Placeholder for integration with existing node lifecycle system
}
