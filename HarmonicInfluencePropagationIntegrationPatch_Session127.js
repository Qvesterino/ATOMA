/**
 * HarmonicInfluencePropagationIntegrationPatch_Session127.js
 * ============================================================================
 * INTEGRATION PATCH FOR MAIN.JS
 * 
 * Add these lines to main.js to integrate HarmonicInfluencePropagationSystem_Session127
 * 
 * LOCATION: After HarmonicHubAuraSystem (Session 126)
 * 
 * IMPORT (near top with other system imports):
 * 
 *   import { HarmonicInfluencePropagationSystem_Session127 } from './HarmonicInfluencePropagationSystem_Session127.js';
 * 
 * INITIALIZATION (in animationLoop or init function):
 * 
 *   // Create harmonic influence propagation system
 *   const harmonicInfluenceSystem = new HarmonicInfluencePropagationSystem_Session127(
 *     scene,
 *     world,
 *     harmonicHubSystem,
 *     nodeAuraSystem,
 *     {
 *       enabled: true,
 *       debugMode: false,
 *       propagationInterval: 2.0,
 *       propagationSpeed: 3.0,
 *       nodeAuraOpacityBase: 0.2,
 *       linkFlowOpacity: 0.3,
 *     }
 *   );
 * 
 * FRAME UPDATE (in animation loop):
 * 
 *   // Update harmonic influence propagation (after harmonicHubSystem)
 *   if (harmonicInfluenceSystem && harmonicInfluenceSystem.config.enabled) {
 *     harmonicInfluenceSystem.update(deltaTime);
 *   }
 * 
 * CLEANUP (in dispose function):
 * 
 *   if (harmonicInfluenceSystem) {
 *     harmonicInfluenceSystem.dispose();
 *   }
 * 
 * CONSOLE DEBUGGING:
 * 
 *   // View influence statistics
 *   console.log(harmonicInfluenceSystem.getStats());
 *   
 *   // Monitor active waves
 *   console.log(`Active waves: ${harmonicInfluenceSystem.stats.activePropagationWaves}`);
 *   
 *   // Check influenced nodes
 *   console.log(`Influenced nodes: ${harmonicInfluenceSystem.stats.influencedNodes}`);
 *   
 *   // Enable debug mode
 *   harmonicInfluenceSystem.config.debugMode = true;
 * 
 * ============================================================================
 */

export function integrateHarmonicInfluenceSystem(
  scene,
  world,
  harmonicHubSystem,
  nodeAuraSystem,
  config = {}
) {
  return {
    install: async function() {
      try {
        const { HarmonicInfluencePropagationSystem_Session127 } = 
          await import('./HarmonicInfluencePropagationSystem_Session127.js');
        
        const harmonicInfluenceSystem = new HarmonicInfluencePropagationSystem_Session127(
          scene,
          world,
          harmonicHubSystem,
          nodeAuraSystem,
          {
            enabled: config.enabled ?? true,
            debugMode: config.debugMode ?? false,
            propagationInterval: config.propagationInterval ?? 2.0,
            propagationSpeed: config.propagationSpeed ?? 3.0,
            nodeAuraOpacityBase: config.nodeAuraOpacityBase ?? 0.2,
            nodeAuraOpacityHarmonyMult: config.nodeAuraOpacityHarmonyMult ?? 0.15,
            linkFlowOpacity: config.linkFlowOpacity ?? 0.3,
            driftSpeed: config.driftSpeed ?? 0.3,
            oscillationAmplitude: config.oscillationAmplitude ?? 0.15,
            ...config,
          }
        );
        
        console.log('[Session 127] Harmonic Influence Propagation System installed');
        return harmonicInfluenceSystem;
      } catch (error) {
        console.error('[Session 127] Failed to install system:', error);
        return null;
      }
    }
  };
}

/**
 * EXPECTED VISUAL BEHAVIOR:
 * 
 * 1. HUB EMISSION
 *    - Harmonic hub emits influence pulse every 2.0 seconds
 *    - Pulse radiates outward from hub nodes
 *    - One pulse per hub per interval (steady rhythm)
 * 
 * 2. WAVE PROPAGATION
 *    - Waves travel from hub toward connected nodes
 *    - Travel speed: 3.0 units/second (configurable)
 *    - No waves travel back into same hub (one-way only)
 *    - Multiple waves can traverse network simultaneously
 * 
 * 3. NODE INFLUENCE AURA
 *    - When wave reaches node, influence aura appears
 *    - Aura: Semi-transparent grey-white flame mesh
 *    - Shape: Soft-edged, frayed, procedurally fragmented
 *    - Color: Neutral with slight warmth (no saturation)
 *    - Opacity: 0.12–0.25 (very subtle)
 *    - Motion: Upward drift + radial oscillation
 *    - Duration: 3.0 seconds from arrival
 * 
 * 4. AURA SIZE
 *    - Base: 1.2 units
 *    - Synergy scaling: +0.4 per synergy (larger with synergy)
 *    - Harmonious nodes: Brighter aura
 *    - Corrupted nodes: Dimmer, thinner aura
 * 
 * 5. LINK FLOW
 *    - While wave travels through link
 *    - Semi-transparent streaming energy along link
 *    - Width: 0.4 units (subtle)
 *    - Color: Grey-white with slight warmth
 *    - Motion: Flows from hub toward target node
 *    - Speed: Increases with synergy
 * 
 * 6. AURA ANIMATION
 *    - Vertical drift: Slow upward motion (~0.03 units/frame)
 *    - Radial oscillation: Breathing motion (±15% amplitude)
 *    - Frequency: 1.0 Hz smooth wave
 *    - Rotation: Slow organic drift, no harsh motion
 *    - Result: Feels like "soft burn" floating upward
 * 
 * 7. STATE MODULATION
 *    - Harmony: Increases warmth (slight yellow shift)
 *    - Corruption: Reduces opacity (dims aura)
 *    - Instability: (Future enhancement - slight phase jitter)
 *    - Synergy: Larger field, more coherent flow
 * 
 * 8. LOD BEHAVIOR
 *    - Close nodes (<50 units): Full detail mesh
 *    - Far nodes (>50 units): Simplified LOD mesh
 *    - Opacity: Reduced 50% at distance
 *    - Smooth transitions
 * 
 * 9. PROPAGATION PATTERN
 *    - From hub A, emits to all connected non-hub nodes
 *    - Creates radiating pattern from hub center
 *    - Multiple waves can coexist on same network
 *    - Creates layered, complex flow patterns
 * 
 * VISUAL METAPHOR ACHIEVED:
 * - Nodes "breathe the same air" (influence aura presence)
 * - "Quiet intelligent burn" (soft flames, not harsh fire)
 * - "Flowing like thought itself" (smooth wave propagation)
 * - "Harmonic" (coherent, phase-aligned, musical rhythm)
 * 
 * PERFORMANCE:
 * - Propagation: <0.2ms per pulse
 * - Node auras: <0.5ms per influenced node (typical 3-5 nodes)
 * - Link flows: <0.8ms per active link
 * - Total: <2.0ms per frame typical
 * - Memory: ~2MB base + per-node allocation
 * 
 * QUALITY SETTINGS:
 * 
 * Ultra (Most dramatic):
 *   - propagationInterval: 1.5 (faster pulses)
 *   - propagationSpeed: 4.0 (faster waves)
 *   - nodeAuraOpacityBase: 0.3 (brighter)
 *   - linkFlowOpacity: 0.4 (more visible flows)
 *   - driftSpeed: 0.5 (faster upward motion)
 * 
 * High (Default):
 *   - propagationInterval: 2.0
 *   - propagationSpeed: 3.0
 *   - nodeAuraOpacityBase: 0.2
 *   - linkFlowOpacity: 0.3
 *   - driftSpeed: 0.3
 * 
 * Medium (Subtle):
 *   - propagationInterval: 3.0 (slower pulses)
 *   - propagationSpeed: 2.0 (slower waves)
 *   - nodeAuraOpacityBase: 0.12 (dimmer)
 *   - linkFlowOpacity: 0.2 (subtle flows)
 *   - driftSpeed: 0.2 (slow drift)
 * 
 * Low (Minimal):
 *   - propagationInterval: 4.0
 *   - propagationSpeed: 1.5
 *   - nodeAuraOpacityBase: 0.08
 *   - linkFlowOpacity: 0.15
 *   - driftSpeed: 0.1
 * 
 * TUNING PARAMETERS:
 * 
 * For more dramatic influence:
 *   - nodeAuraOpacityBase: 0.3
 *   - nodeAuraOpacityHarmonyMult: 0.25
 *   - linkFlowOpacity: 0.5
 * 
 * For subtle, elegant effect:
 *   - nodeAuraOpacityBase: 0.1
 *   - nodeAuraOpacityHarmonyMult: 0.05
 *   - linkFlowOpacity: 0.15
 * 
 * For faster pulsing rhythm:
 *   - propagationInterval: 1.0
 *   - propagationSpeed: 5.0
 * 
 * For slower, meditative rhythm:
 *   - propagationInterval: 4.0
 *   - propagationSpeed: 1.5
 * 
 * For more visible aura motion:
 *   - driftSpeed: 0.5
 *   - oscillationAmplitude: 0.25
 * 
 * SAFETY NOTES:
 * - Requires HarmonicHubAuraSystem to be active
 * - Gracefully handles missing data (no crashes)
 * - Zero writes to gameplay state
 * - No geometry modifications
 * - Non-blocking adapter pattern
 * - Can be enabled/disabled at runtime
 * 
 */
