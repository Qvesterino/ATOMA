/**
 * PulseIntersectionIntegrationSetup.js
 * ============================================================================
 * Integration orchestrator for PulseIntersectionImpulseAdapter
 * 
 * Handles:
 * - Adapter initialization
 * - Link registration
 * - Per-frame update wiring
 * - Console API setup
 * - Graceful error handling
 */

import {
  PulseIntersectionImpulseAdapter,
  setupPulseIntersectionImpulseConsoleAPI,
} from './PulseIntersectionImpulseAdapter_v1.js';

export function setupPulseIntersectionIntegration(game) {
  // =========================================================================
  // STEP 1: CREATE ADAPTER INSTANCE
  // =========================================================================
  const adapter = new PulseIntersectionImpulseAdapter(game.scene);
  console.log('[PulseIntersectionIntegration] Adapter created ✓');

  // =========================================================================
  // STEP 2: DEFERRED INITIALIZATION (wait for systems ready)
  // =========================================================================
  const setupTimeout = setTimeout(() => {
    try {
      // Register all existing links
      if (game.nodeLinking && game.nodeLinking.links) {
        let registeredCount = 0;
        for (const link of game.nodeLinking.links) {
          if (link && link.uuid) {
            try {
              // Estimate segment count from link geometry
              const segmentCount = link.geometry?.attributes?.position
                ? Math.min(Math.max(6, Math.floor(link.geometry.attributes.position.count / 10)), 16)
                : 6;

              adapter.registerLink(link.uuid, link, segmentCount);
              registeredCount++;
            } catch (err) {
              // Skip links that can't be registered
            }
          }
        }
        console.log(`[PulseIntersectionIntegration] Registered ${registeredCount} links ✓`);
      } else {
        console.warn('[PulseIntersectionIntegration] NodeLinkingSystem not ready');
      }

      // Setup console API
      setupPulseIntersectionImpulseConsoleAPI(adapter);

      // Store reference on game object
      game.pulseIntersectionAdapter = adapter;
      console.log('[PulseIntersectionIntegration] Setup complete ✓');
    } catch (err) {
      console.warn('[PulseIntersectionIntegration] Setup error:', err);
    }
  }, 600); // Defer slightly longer than micro-impulses (500ms)

  // =========================================================================
  // STEP 3: HOOK INTO PULSE WAVE UPDATES (optional - if system available)
  // =========================================================================
  // This would be implemented in a real pulse wave system:
  // const originalUpdatePulse = pulseSystem.updatePulse;
  // pulseSystem.updatePulse = (linkId, pulseT, config) => {
  //   originalUpdatePulse.call(pulseSystem, linkId, pulseT, config);
  //   adapter.updatePulsePosition(linkId, pulseT, config);
  // };

  return {
    adapter,
    cleanup: () => {
      clearTimeout(setupTimeout);
      if (adapter) adapter.dispose();
    },
  };
}
