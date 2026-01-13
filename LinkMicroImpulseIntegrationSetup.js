/**
 * LinkMicroImpulseIntegrationSetup.js
 * ============================================================================
 * Integration orchestrator for LinkMicroImpulseAdapter
 * 
 * Handles:
 * - Initialization sequence (waits for linking system ready)
 * - Event source connection
 * - Per-frame update wiring
 * - Console API setup
 * - Graceful error handling
 */

import { LinkMicroImpulseAdapter, setupLinkMicroImpulseConsoleAPI } from './LinkMicroImpulseAdapter_v1.js';

export function setupLinkMicroImpulseIntegration(game) {
  // =========================================================================
  // STEP 1: CREATE ADAPTER INSTANCE
  // =========================================================================
  const adapter = new LinkMicroImpulseAdapter(game.scene);
  console.log('[LinkMicroImpulseIntegration] Adapter created ✓');

  // =========================================================================
  // STEP 2: DEFERRED INITIALIZATION (wait for linking system ready)
  // =========================================================================
  const setupTimeout = setTimeout(() => {
    try {
      // Hook into NodeLinking system if available
      if (game.nodeLinking) {
        adapter.setEventSource(game.nodeLinking);
        console.log('[LinkMicroImpulseIntegration] Connected to NodeLinkingSystem ✓');
      } else {
        console.warn('[LinkMicroImpulseIntegration] NodeLinkingSystem not ready yet');
      }

      // Setup console API
      setupLinkMicroImpulseConsoleAPI(adapter);

      // Store reference on game object
      game.microImpulseAdapter = adapter;
      console.log('[LinkMicroImpulseIntegration] Setup complete ✓');
    } catch (err) {
      console.warn('[LinkMicroImpulseIntegration] Setup error:', err);
    }
  }, 500);

  // =========================================================================
  // STEP 3: REGISTER PER-FRAME UPDATE (via safeTick)
  // =========================================================================
  // The adapter will be updated in the main animate loop via:
  // safeTick(game.microImpulseAdapter, deltaTime);
  //
  // Alternatively, you can add it to game.animate() directly:
  // This happens in main.js animate loop

  return {
    adapter,
    cleanup: () => {
      clearTimeout(setupTimeout);
      if (adapter) adapter.dispose();
    },
  };
}
