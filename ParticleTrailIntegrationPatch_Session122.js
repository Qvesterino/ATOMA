/**
 * ParticleTrailIntegrationPatch_Session122.js
 * ============================================================================
 * INTEGRATION PATCH FOR PARTICLE TRAIL SYSTEM
 * 
 * Patches main.js to integrate ParticleTrailSystem_Session122 with
 * the existing cascade particle rendering pipeline.
 * 
 * INTEGRATION POINTS:
 * 1. After CascadeParticleSystem_Session120 initialization
 * 2. In frame update loop after particle system updates
 * 3. On world reset/cleanup
 * 
 * COPY-PASTE INTEGRATION:
 * See SESSION_122_INTEGRATION_GUIDE.md for main.js modifications
 * 
 * @author VFX Technical Director — ATOMA Project Session 122
 * @version 1.0.0
 */

import { ParticleTrailSystem_Session122 } from './ParticleTrailSystem_Session122.js';

/**
 * Setup particle trail system
 * Call this after cascade particle system is initialized
 */
export function setupParticleTrailSystem(scene, cascadeParticleSystem, world) {
  // Create trail system
  const trailSystem = new ParticleTrailSystem_Session122(
    scene,
    cascadeParticleSystem,
    {
      trailEmissionRate: 0.6,      // 60% of Forward particles get trails
      trailLengthFactor: 0.15,      // Velocity * 0.15 = trail length
      maxTrailLength: 8.0,
      minTrailLength: 0.5,
      trailBaseOpacity: 0.6,        // Trail start opacity
      trailFadeRate: 12.0,          // Exponential fade rate
      trailLifetime: 0.1,           // 100ms trail lifetime
      maxTrailParticles: 1000,
      enabled: true,
      debugMode: false,
    }
  );
  
  // Store on world for lifecycle management
  world._particleTrailSystem = trailSystem;
  
  console.log('[Session 122] ParticleTrailSystem integrated with cascade particles');
  
  return trailSystem;
}

/**
 * Update particle trail system
 * Call this in main frame update loop
 * 
 * Example placement in main.js update loop:
 * ```
 * // After cascadeParticleSystem.update() and colorTintSystem.update()
 * if (world._particleTrailSystem) {
 *   world._particleTrailSystem.update(
 *     deltaTime,
 *     cascadeParticleSystem.pool,
 *     cascadeParticleSystem.activeCount
 *   );
 * }
 * ```
 */
export function updateParticleTrailSystem(deltaTime, world, cascadeParticleSystem) {
  if (!world._particleTrailSystem || !cascadeParticleSystem) return;
  
  world._particleTrailSystem.update(
    deltaTime,
    cascadeParticleSystem.pool,
    cascadeParticleSystem.activeCount
  );
}

/**
 * Cleanup particle trail system
 * Call on world reset or application exit
 */
export function cleanupParticleTrailSystem(world) {
  if (!world._particleTrailSystem) return;
  
  world._particleTrailSystem.dispose();
  world._particleTrailSystem = null;
  
  console.log('[Session 122] ParticleTrailSystem disposed');
}

/**
 * Get trail system statistics
 */
export function getParticleTrailStats(world) {
  if (!world._particleTrailSystem) return null;
  
  return world._particleTrailSystem.getStats();
}

/**
 * Debug console API for particle trails
 */
export function setupParticleTrailConsoleAPI(world) {
  window.AtomDebug = window.AtomDebug || {};
  
  window.AtomDebug.particleTrails = {
    getStats: () => getParticleTrailStats(world),
    
    reset: () => {
      if (world._particleTrailSystem) {
        world._particleTrailSystem.reset();
        console.log('[Session 122] Trail system reset');
      }
    },
    
    setEmissionRate: (rate) => {
      if (world._particleTrailSystem) {
        world._particleTrailSystem.config.trailEmissionRate = Math.clamp(rate, 0, 1);
        console.log(`[Session 122] Trail emission rate: ${rate}`);
      }
    },
    
    setFadeRate: (rate) => {
      if (world._particleTrailSystem) {
        world._particleTrailSystem.trailMaterial.uniforms.uTrailFadeRate.value = rate;
        console.log(`[Session 122] Trail fade rate: ${rate}`);
      }
    },
    
    setOpacity: (opacity) => {
      if (world._particleTrailSystem) {
        world._particleTrailSystem.trailMaterial.uniforms.uBaseOpacity.value = Math.clamp(opacity, 0, 1);
        console.log(`[Session 122] Trail base opacity: ${opacity}`);
      }
    },
    
    enable: () => {
      if (world._particleTrailSystem) {
        world._particleTrailSystem.config.enabled = true;
        console.log('[Session 122] Particle trails enabled');
      }
    },
    
    disable: () => {
      if (world._particleTrailSystem) {
        world._particleTrailSystem.config.enabled = false;
        console.log('[Session 122] Particle trails disabled');
      }
    },
  };
  
  console.log('[Session 122] Debug API: Use window.AtomDebug.particleTrails.*');
}
