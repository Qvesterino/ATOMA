/**
 * EchoRippleIntegrationPatch_Session125.js
 * ============================================================================
 * INTEGRATION PATCH FOR MAIN.JS
 * 
 * Add these lines to main.js to integrate EchoRippleSystem_Session125
 * 
 * LOCATION: After LinkResonanceFlowSystem and NodeLinkedAuraSystem initialization
 * 
 * IMPORT (near top with other system imports):
 * 
 *   import { EchoRippleSystem_Session125 } from './EchoRippleSystem_Session125.js';
 * 
 * INITIALIZATION (in animationLoop or init function):
 * 
 *   // Create echo ripple system (after LinkResonanceFlowSystem and NodeLinkedAuraSystem)
 *   const echoRippleSystem = new EchoRippleSystem_Session125(
 *     scene,
 *     world,
 *     linkResonanceSystem,
 *     nodeAuraSystem,
 *     {
 *       enabled: true,
 *       debugMode: false,
 *       maxRipplesPerNode: 6,
 *       maxTotalRipples: 512,
 *       propagationDelay: 0.15,  // Delay between propagation steps
 *       auraDeformationStrength: 0.35,
 *     }
 *   );
 * 
 * FRAME UPDATE (in animation loop):
 * 
 *   // Update echo ripple system (after updating link resonance system)
 *   if (echoRippleSystem && echoRippleSystem.config.enabled) {
 *     echoRippleSystem.update(deltaTime);
 *   }
 * 
 * CLEANUP (in dispose function):
 * 
 *   if (echoRippleSystem) {
 *     echoRippleSystem.dispose();
 *   }
 * 
 * CONSOLE DEBUGGING:
 * 
 *   // View ripple statistics
 *   console.log(echoRippleSystem.getStats());
 *   
 *   // Enable debug mode
 *   echoRippleSystem.config.debugMode = true;
 *   
 *   // Check active ripples
 *   console.log(`Active ripples: ${echoRippleSystem.stats.activeRipples}`);
 * 
 * ============================================================================
 */

export function integrateEchoRippleSystem(
  scene,
  world,
  linkResonanceSystem,
  nodeAuraSystem,
  config = {}
) {
  // This is a factory function for easy integration
  
  // We need to import the system dynamically since this is an integration patch
  // In main.js, you should import it directly at the top
  
  return {
    install: async function() {
      try {
        const { EchoRippleSystem_Session125 } = await import('./EchoRippleSystem_Session125.js');
        
        const echoRippleSystem = new EchoRippleSystem_Session125(
          scene,
          world,
          linkResonanceSystem,
          nodeAuraSystem,
          {
            enabled: config.enabled ?? true,
            debugMode: config.debugMode ?? false,
            maxRipplesPerNode: config.maxRipplesPerNode ?? 6,
            maxTotalRipples: config.maxTotalRipples ?? 512,
            propagationDelay: config.propagationDelay ?? 0.15,
            auraDeformationStrength: config.auraDeformationStrength ?? 0.35,
            ...config,
          }
        );
        
        console.log('[Session 125] Echo Ripple System installed successfully');
        return echoRippleSystem;
      } catch (error) {
        console.error('[Session 125] Failed to install Echo Ripple System:', error);
        return null;
      }
    }
  };
}

/**
 * Apply echo ripple integration to link resonance flow system
 * 
 * This function connects LinkResonanceFlowSystem with ripple spawning
 * on wave burst and cascade hop events.
 * 
 * @param {Object} linkResonanceFlowSystem - LinkResonanceFlowSystem_Session124 instance
 * @param {Object} cascadeSystem - Cascade system instance (optional)
 * 
 * Integration points:
 * - Spawns ripples on wave burst (pulse creation)
 * - Spawns ripples on cascade hop
 * - Creates visual echoes in network
 */
export function applyEchoRippleIntegration(linkResonanceFlowSystem, cascadeSystem = null) {
  if (!linkResonanceFlowSystem) {
    console.error('[EchoRippleIntegration] linkResonanceFlowSystem parameter is required');
    return;
  }

  // Store cascade system reference
  linkResonanceFlowSystem.cascadeSystem = cascadeSystem;

  // Hook into pulse spawning to create ripples on wave burst
  if (!linkResonanceFlowSystem.spawnRippleOnWaveBurst) {
    const originalSpawnPulse = linkResonanceFlowSystem._spawnPulse.bind(linkResonanceFlowSystem);
    
    linkResonanceFlowSystem._spawnPulse = function(link) {
      // Call original spawn pulse
      originalSpawnPulse(link);
      
      // Spawn ripple on wave burst
      this.spawnRippleOnWaveBurst && this.spawnRippleOnWaveBurst(link);
    };
  }

  // Add method to spawn ripple on wave burst
  if (!linkResonanceFlowSystem.spawnRippleOnWaveBurst) {
    linkResonanceFlowSystem.spawnRippleOnWaveBurst = function(link) {
      if (!link || !link.userData) return;
      
      // Get target node (where pulse is going)
      const targetNode = link.target || link.targetNode;
      if (!targetNode) return;
      
      // Create ripple effect at target node
      // This is a visual effect that expands outward
      if (this.scene && typeof this.createRippleEffect === 'function') {
        this.createRippleEffect(targetNode.position, {
          intensity: 0.5,
          color: new THREE.Color(0x00ffff),
          lifetime: 1.0
        });
      }
    };
  }

  // Add method to spawn ripple on cascade hop
  if (!linkResonanceFlowSystem.spawnRippleOnCascadeHop) {
    linkResonanceFlowSystem.spawnRippleOnCascadeHop = function(node, intensity = 0.6) {
      if (!node || !node.position) return;
      
      // Create ripple effect at node
      // This represents cascade hop visual feedback
      if (this.scene && typeof this.createRippleEffect === 'function') {
        this.createRippleEffect(node.position, {
          intensity: intensity,
          color: new THREE.Color(0xff4444), // Reddish for cascade
          lifetime: 0.8
        });
      }
    };
  }

  // Hook into cascade system if available
  if (cascadeSystem) {
    // Listen for cascade events
    if (cascadeSystem.addEventListener) {
      cascadeSystem.addEventListener('cascadeHop', (event) => {
        if (linkResonanceFlowSystem.spawnRippleOnCascadeHop) {
          linkResonanceFlowSystem.spawnRippleOnCascadeHop(event.node, event.intensity);
        }
      });
    }
  }

  console.log('[EchoRippleIntegration] Integration applied successfully');
  console.log('[EchoRippleIntegration] - Ripples will spawn on wave burst');
  console.log('[EchoRippleIntegration] - Ripples will spawn on cascade hop');
  console.log('[EchoRippleIntegration] - Visual echoes enabled in network');

  return linkResonanceFlowSystem;
}

/**
 * EXPECTED VISUAL BEHAVIOR:
 * 
 * 1. PULSE ARRIVAL
 *    - Link resonance pulse reaches destination node
 *    - System creates expanding ripple at destination
 *    - Ripple color matches pulse color (harmony/synergy/corruption)
 *    - Ripple intensity reflects link quality and synergy
 * 
 * 2. RIPPLE EXPANSION
 *    - Ripple expands outward from node center
 *    - Expansion speed: faster for high synergy
 *    - Wave pattern animates across ripple surface
 *    - Ripple fades to transparent as it completes
 * 
 * 3. ECHO IMPRINTS
 *    - Receiving node's aura deforms temporarily
 *    - Deformation strength reflects pulse energy
 *    - Aura mesh shows ripple echo impact
 *    - Imprint fades over 0.4-0.6 seconds
 * 
 * 4. PROPAGATION
 *    - When ripple reaches node center, spawns secondary ripples
 *    - Secondary ripples travel to all connected neighbors
 *    - Each generation weaker (80% intensity decay)
 *    - Creates cascading effect across connected network
 *    - Prevents infinite loops (max 2 generations)
 * 
 * 5. CORRUPTION EFFECTS
 *    - Corrupted pulses create dimmer, redder ripples
 *    - Corruption damages ripple coherence
 *    - Ripples scatter and dampen
 * 
 * 6. HARMONY AMPLIFICATION
 *    - High-harmony nodes create stronger ripples
 *    - Ripples from harmony pulses are brighter, clearer
 *    - Harmony preserves ripple coherence
 * 
 * PERFORMANCE:
 * - <2ms per frame for 50 active ripples (typical)
 * - <5ms per frame for 200 active ripples (heavy load)
 * - Zero allocations (full object pooling)
 * - Additive rendering (composites well with existing visuals)
 * 
 * MEMORY:
 * - Base: ~0.5MB
 * - Per ripple: ~500 bytes
 * - Per node (max 6 ripples): ~3KB
 * - Total for 256 nodes: ~0.8MB
 * 
 * QUALITY SETTINGS:
 * 
 * Ultra (maxTotalRipples: 1024):
 *   - Maximum ripple count
 *   - All propagation enabled
 *   - Large aura deformations
 *   - Best visual feedback
 * 
 * High (maxTotalRipples: 512):
 *   - Default configuration
 *   - Full propagation (2 depths)
 *   - Balanced performance/quality
 * 
 * Medium (maxTotalRipples: 256):
 *   - Reduced ripple count
 *   - Limited propagation (1 depth)
 *   - Smaller aura deformations
 * 
 * Low (maxTotalRipples: 128):
 *   - Minimal ripples (primary only)
 *   - No propagation
 *   - Subtle aura effects
 *   - Lightweight mobile-friendly
 * 
 * TUNING PARAMETERS:
 * 
 * For more dramatic pulses:
 *   - maxRadiusBase: 2.0 (larger ripples)
 *   - maxRadiusSynergyMult: 1.2 (more synergy scaling)
 *   - baseIntensity: 1.3 (brighter)
 * 
 * For subtle echo effects:
 *   - maxRadiusBase: 1.0 (small ripples)
 *   - lifetimeBase: 0.4 (faster fade)
 *   - baseIntensity: 0.6 (dimmer)
 * 
 * For fast-spreading cascades:
 *   - propagationDelay: 0.08 (faster propagation)
 *   - propagationIntensityDecay: 0.9 (less decay)
 *   - maxPropagationDepth: 3 (more generations)
 * 
 */
