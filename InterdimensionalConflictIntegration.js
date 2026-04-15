/**
 * InterdimensionalConflictIntegration.js
 * ============================================================================
 * INTEGRATION PATCH: SynapticConflictAdaptiveResolution → InterdimensionalConflictVisualizer
 *
 * ÚČEL:
 * Prepojiť existujúci konfliktový systém (logika/detekcia) s novým
 * interdimenzionálnym vizualizerom (epické vizuálne efekty).
 *
 * ARCHITEKTÚRA:
 * - SynapticConflictAdaptiveResolution zostáva "authority" pre konfliktovú logiku
 * - InterdimensionalConflictVisualizer je "consumer" pre vizuálne efekty
 * - Tento patch prenáša dáta z jedného do druhého
 *
 * TOK DÁT:
 * 1. SynapticConflictAdaptiveResolution detekuje konflikty
 * 2. Tento patch zberá konfliktové dáta
 * 3. InterdimensionalConflictVisualizer renderuje efekty
 *
 * INTEGRÁCIA:
 * Volať setupInterdimensionalConflictIntegration(game) v main.js
 * pred frameScheduler.register pre SynapticConflictAdaptiveResolution.
 *
 * REQUIREMENTS:
 * - SynapticConflictAdaptiveResolution_Session117.js musí byť načítaný
 * - InterdimensionalConflictVisualizer.js musí byť načítaný
 * - game objekt musí mať scene a frameScheduler
 * ============================================================================
 */

import { setupInterdimensionalConflictSystem, CONFLICT_PHASES } from './InterdimensionalConflictVisualizer.js';

/**
 * Hlavná integration funkcia
 * Volať v main.js po inicializácii SynapticConflictAdaptiveResolution
 */
export function setupInterdimensionalConflictIntegration(game, options = {}) {
  try {
    // Check if required systems exist
    if (!game.synapticConflict) {
      console.warn('[InterdimensionalConflictIntegration] SynapticConflictAdaptiveResolution not found. Skipping integration.');
      return null;
    }

    // Initialize visualizer
    const visualizer = setupInterdimensionalConflictSystem(game, {
      enabled: options.enabled ?? true,
      debugMode: options.debugMode ?? false,
      maxParticles: options.maxParticles ?? 500,
      ...options
    });

    if (!visualizer) {
      console.warn('[InterdimensionalConflictIntegration] Failed to initialize visualizer.');
      return null;
    }

    // Store reference for cleanup
    game.interdimensionalConflictIntegration = {
      visualizer,
      originalUpdate: game.synapticConflict.update,
      cleanup: () => {
        if (visualizer) {
          visualizer.dispose();
        }
        if (game.frameScheduler?.isRegistered?.('visual.interdimensionalConflict')) {
          game.frameScheduler.unregister('visual.interdimensionalConflict');
        }
      }
    };

    console.log('[InterdimensionalConflictIntegration] ✓ Successfully integrated');
    console.log('[InterdimensionalConflictIntegration] Console API: window.interdimensionalConflict');

    return visualizer;
  } catch (err) {
    console.error('[InterdimensionalConflictIntegration] Integration failed:', err);
    return null;
  }
}

/**
 * Manual update call (ak nie je použitý frameScheduler)
 * Túto funkciu volať v main update loop ak nepoužívate frameScheduler
 */
export function updateInterdimensionalConflictVisuals(game, deltaTime, nodes) {
  try {
    const visualizer = game.interdimensionalConflictVisualizer;
    const conflictSystem = game.synapticConflict;

    if (!visualizer || !conflictSystem) return;

    // Get active conflict regions
    const activeRegions = [];
    for (const [hash, region] of conflictSystem.conflictRegions) {
      if (region.intensity > 0.1) { // Use detection threshold
        activeRegions.push([hash, region]);
      }
    }

    // Update visualizer
    visualizer.update(deltaTime, new Map(activeRegions));
  } catch (err) {
    console.warn('[InterdimensionalConflictIntegration] Update failed:', err);
  }
}

/**
 * Cleanup funkcia pre shutdown
 */
export function cleanupInterdimensionalConflictIntegration(game) {
  try {
    const integration = game.interdimensionalConflictIntegration;

    if (integration?.cleanup) {
      integration.cleanup();
    }

    if (game.interdimensionalConflictVisualizer) {
      game.interdimensionalConflictVisualizer.dispose();
      game.interdimensionalConflictVisualizer = null;
    }

    if (game.interdimensionalConflictIntegration) {
      game.interdimensionalConflictIntegration = null;
    }

    if (window.interdimensionalConflict) {
      delete window.interdimensionalConflict;
    }

    console.log('[InterdimensionalConflictIntegration] Cleaned up ✓');
  } catch (err) {
    console.warn('[InterdimensionalConflictIntegration] Cleanup failed:', err);
  }
}

/**
 * Příklad integrácie v main.js:
 *
 * // Load modules
 * import { setupSynapticConflictSystem } from './SynapticConflictAdaptiveResolution_Session117.js';
 * import { setupInterdimensionalConflictIntegration } from './InterdimensionalConflictIntegration.js';
 *
 * // Initialize systems (order matters!)
 * setupSynapticConflictSystem(game, {
 *   enabled: true,
 *   debugMode: false
 * });
 *
 * setupInterdimensionalConflictIntegration(game, {
 *   enabled: true,
 *   debugMode: false,
 *   maxParticles: 500
 * });
 *
 * // That's it! The visualizer will automatically receive conflict data
 * // and render epické interdimenzionálne efekty.
 *
 * // Console debugging:
 * // window.interdimensionalConflict.getStatus()
 * // window.conflictDebug.getActiveConflicts()
 */
