/**
 * LinkResonanceFlowIntegrationPatch_Session124.js
 * ============================================================================
 * INTEGRATION HELPERS FOR LINK RESONANCE FLOW SYSTEM
 * 
 * Provides setup, update, and lifecycle management functions
 * for seamless integration with main.js.
 * 
 * @author VFX Technical Director — ATOMA Project Session 124
 * @version 1.0.0
 */

import { LinkResonanceFlowSystem_Session124 } from './LinkResonanceFlowSystem_Session124.js';

/**
 * Setup link resonance flow system
 */
export function setupLinkResonanceFlowSystem(scene, world, config = {}) {
  const flowSystem = new LinkResonanceFlowSystem_Session124(scene, world, {
    // Pulse spawning
    baseSpawnRate: config.baseSpawnRate ?? 2.0,
    synergySpawnBoost: config.synergySpawnBoost ?? 1.5,
    pulseSpeedBase: config.pulseSpeedBase ?? 1.0,
    pulseSpeedSynergyMult: config.pulseSpeedSynergyMult ?? 0.8,
    
    // Pulse appearance
    pulseRadiusBase: config.pulseRadiusBase ?? 0.3,
    pulseRadiusSynergyMult: config.pulseRadiusSynergyMult ?? 0.15,
    pulseMaxRadius: config.pulseMaxRadius ?? 0.8,
    pulseGlowIntensity: config.pulseGlowIntensity ?? 1.5,
    
    // Pulse lifetime
    pulseLifetime: config.pulseLifetime ?? 2.0,
    pulseAlphaDecay: config.pulseAlphaDecay ?? 0.7,
    
    // Intensity modulation
    baseIntensity: config.baseIntensity ?? 0.8,
    qualityIntensityFactor: config.qualityIntensityFactor ?? 0.5,
    corruptionDampen: config.corruptionDampen ?? 0.6,
    
    // Flow direction
    bidirectional: config.bidirectional ?? false,
    pulseBidirectionalChance: config.pulseBidirectionalChance ?? 0.1,
    
    // LOD
    lodDistanceThreshold: config.lodDistanceThreshold ?? 60,
    lodPulseSuppression: config.lodPulseSuppression ?? 0.5,
    
    // Safety
    maxPulsesPerLink: config.maxPulsesPerLink ?? 8,
    maxTotalPulses: config.maxTotalPulses ?? 1024,
    enabled: config.enabled ?? true,
    debugMode: config.debugMode ?? false,
  });
  
  // Store on world
  world._linkResonanceFlowSystem = flowSystem;
  
  console.log('[Session 124] LinkResonanceFlowSystem integrated');
  
  return flowSystem;
}

/**
 * Update link resonance flow system each frame
 */
export function updateLinkResonanceFlowSystem(deltaTime, world, links, camera) {
  if (!world._linkResonanceFlowSystem) return;
  
  const flowSystem = world._linkResonanceFlowSystem;
  flowSystem.update(deltaTime, links, camera);
}

/**
 * Trigger pulse emission on specific link
 */
export function triggerLinkPulseEmission(link, world, count = 1) {
  if (!world._linkResonanceFlowSystem) return;
  
  const flowSystem = world._linkResonanceFlowSystem;
  for (let i = 0; i < count; i++) {
    flowSystem._spawnPulse(link);
  }
}

/**
 * Cleanup system
 */
export function cleanupLinkResonanceFlowSystem(world) {
  if (!world._linkResonanceFlowSystem) return;
  
  world._linkResonanceFlowSystem.dispose();
  world._linkResonanceFlowSystem = null;
  
  console.log('[Session 124] LinkResonanceFlowSystem disposed');
}

/**
 * Setup debug console API
 */
export function setupLinkResonanceFlowConsoleAPI(world) {
  window.AtomDebug = window.AtomDebug || {};
  
  window.AtomDebug.linkResonance = {
    getStats: () => {
      if (!world._linkResonanceFlowSystem) return null;
      return world._linkResonanceFlowSystem.getStats();
    },
    
    setSpawnRate: (rate) => {
      if (!world._linkResonanceFlowSystem) return;
      world._linkResonanceFlowSystem.config.baseSpawnRate = rate;
      console.log(`[Session 124] Spawn rate: ${rate}`);
    },
    
    setSpeedBase: (speed) => {
      if (!world._linkResonanceFlowSystem) return;
      world._linkResonanceFlowSystem.config.pulseSpeedBase = speed;
      console.log(`[Session 124] Pulse speed: ${speed}`);
    },
    
    setGlowIntensity: (intensity) => {
      if (!world._linkResonanceFlowSystem) return;
      world._linkResonanceFlowSystem.config.pulseGlowIntensity = intensity;
      console.log(`[Session 124] Glow intensity: ${intensity}`);
    },
    
    setPulseRadius: (radius) => {
      if (!world._linkResonanceFlowSystem) return;
      world._linkResonanceFlowSystem.config.pulseRadiusBase = radius;
      console.log(`[Session 124] Pulse radius: ${radius}`);
    },
    
    setCorruptionDampen: (factor) => {
      if (!world._linkResonanceFlowSystem) return;
      world._linkResonanceFlowSystem.config.corruptionDampen = factor;
      console.log(`[Session 124] Corruption dampen: ${factor}`);
    },
    
    setBidirectional: (enabled) => {
      if (!world._linkResonanceFlowSystem) return;
      world._linkResonanceFlowSystem.config.bidirectional = enabled;
      console.log(`[Session 124] Bidirectional: ${enabled}`);
    },
    
    enable: () => {
      if (!world._linkResonanceFlowSystem) return;
      world._linkResonanceFlowSystem.config.enabled = true;
      console.log('[Session 124] Link resonance enabled');
    },
    
    disable: () => {
      if (!world._linkResonanceFlowSystem) return;
      world._linkResonanceFlowSystem.config.enabled = false;
      console.log('[Session 124] Link resonance disabled');
    },
    
    reset: () => {
      if (!world._linkResonanceFlowSystem) return;
      world._linkResonanceFlowSystem.reset();
      console.log('[Session 124] Resonance flow reset');
    },
    
    triggerPulse: (linkIndex) => {
      if (!world._linkResonanceFlowSystem || !world.links) return;
      const link = world.links[linkIndex];
      if (link) {
        triggerLinkPulseEmission(link, world, 3);
        console.log(`[Session 124] Triggered 3 pulses on link ${linkIndex}`);
      }
    },
  };
  
  console.log('[Session 124] Debug API: Use window.AtomDebug.linkResonance.*');
}

/**
 * Create visual pulse on link activity (integration point)
 */
export function visualizeLinkActivity(link, world, intensity = 1.0) {
  if (!world._linkResonanceFlowSystem) return;
  
  // Trigger multiple pulses based on intensity
  const pulseCount = Math.max(1, Math.floor(intensity * 3));
  triggerLinkPulseEmission(link, world, pulseCount);
}

/**
 * Set all links to bidirectional flow (experimental)
 */
export function setBidirectionalFlow(enabled, world) {
  if (!world._linkResonanceFlowSystem) return;
  
  world._linkResonanceFlowSystem.config.bidirectional = enabled;
  console.log(`[Session 124] Bidirectional flow: ${enabled}`);
}

/**
 * Apply harmony integration to link resonance flow system
 * 
 * This function connects LinkResonanceFlowSystem with HarmonyStabilizationSystem
 * by updating link.userData.flowState.energy with the average harmony of connected nodes.
 * 
 * @param {Object} linkResonanceFlowSystem - LinkResonanceFlowSystem_Session124 instance
 * @param {Object} world - World object containing links
 * 
 * Integration points:
 * - Updates link.userData.flowState.energy with harmony levels
 * - Preserves existing flow direction
 * - Makes links "live" with harmony-driven energy
 */
export function applyLinkResonanceFlowHarmonyIntegration(linkResonanceFlowSystem, world) {
  if (!linkResonanceFlowSystem) {
    console.error('[LinkResonanceFlowHarmonyIntegration] linkResonanceFlowSystem parameter is required');
    return;
  }

  if (!world || !world.links) {
    console.error('[LinkResonanceFlowHarmonyIntegration] world.links is required');
    return;
  }

  // Store reference to world for updates
  linkResonanceFlowSystem.world = world;

  // Add method to update link flow state with harmony
  if (!linkResonanceFlowSystem.updateLinkFlowEnergy) {
    linkResonanceFlowSystem.updateLinkFlowEnergy = function(links) {
      if (!links) return;

      for (const link of links) {
        if (!link || !link.userData) continue;

        // Get source and target nodes
        const nodeA = link.source || link.sourceNode;
        const nodeB = link.target || link.targetNode;

        if (!nodeA || !nodeB) continue;

        // Get harmony levels from nodes
        const harmonyA = nodeA.userData?.harmonyLevel ?? 0;
        const harmonyB = nodeB.userData?.harmonyLevel ?? 0;

        // Initialize flowState if not exists
        if (!link.userData.flowState) {
          link.userData.flowState = {
            energy: 0,
            direction: 1, // 1 = forward, -1 = backward
            lastUpdateTime: Date.now()
          };
        }

        // Calculate energy as average of connected node harmony levels
        // This makes links "live" with harmony-driven energy
        // IMPORTANT: Use MAX to preserve event-driven energy from CascadeEventBridge
        // CascadeEventBridge is the PRIMARY writer, this patch only BOOSTS
        const previousEnergy = link.userData.flowState.energy || 0;
        const harmonyEnergy = (harmonyA * 0.5) + (harmonyB * 0.5);
        link.userData.flowState.energy = Math.max(previousEnergy, harmonyEnergy);

        // Preserve existing flow direction
        // Only update energy, not direction
        // Direction is controlled by the pulse system

        link.userData.flowState.lastUpdateTime = Date.now();
      }
    };
  }

  // Hook into update loop to update flow energy
  const originalUpdate = linkResonanceFlowSystem.update.bind(linkResonanceFlowSystem);
  linkResonanceFlowSystem.update = function(deltaTime, links, camera) {
    // Update link flow energy with harmony levels
    if (this.updateLinkFlowEnergy && links) {
      this.updateLinkFlowEnergy(links);
    }

    // Call original update
    return originalUpdate(deltaTime, links, camera);
  };

  console.log('[LinkResonanceFlowHarmonyIntegration] Integration applied successfully');
  console.log('[LinkResonanceFlowHarmonyIntegration] - Link flow energy will be driven by harmony levels');
  console.log('[LinkResonanceFlowHarmonyIntegration] - Existing flow direction preserved');

  return linkResonanceFlowSystem;
}
