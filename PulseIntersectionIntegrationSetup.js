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

function waitForLinkingSystemReady(game, onReady) {
  let resolved = false;
  let pollId = null;

  const settle = (linkingSystem) => {
    if (resolved || !linkingSystem) return false;
    resolved = true;
    onReady(linkingSystem);
    return true;
  };

  if (settle(game.linkingSystem)) {
    return () => {};
  }

  pollId = setInterval(() => {
    if (settle(game.linkingSystem) && pollId !== null) {
      clearInterval(pollId);
      pollId = null;
    }
  }, 16);

  return () => {
    resolved = true;
    if (pollId !== null) {
      clearInterval(pollId);
      pollId = null;
    }
  };
}

export function setupPulseIntersectionIntegration(game) {
  // =========================================================================
  // STEP 1: CREATE ADAPTER INSTANCE
  // =========================================================================
  const adapter = new PulseIntersectionImpulseAdapter(game.scene);
  console.log('[PulseIntersectionIntegration] Adapter created \u0413\u0428"');

  // =========================================================================
  // STEP 2: DEFERRED INITIALIZATION (wait for systems ready)
  // =========================================================================
  const finalizeSetup = linkingSystem => {
    try {
      if (linkingSystem?.links) {
        let registeredCount = 0;
        for (const link of linkingSystem.links) {
          if (link && link.uuid) {
            try {
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
        console.log(`[PulseIntersectionIntegration] Registered ${registeredCount} links \u0413\u0428"`);
      }

      // Setup console API
      setupPulseIntersectionImpulseConsoleAPI(adapter);

      // Store reference on game object
      game.pulseIntersectionAdapter = adapter;
      console.log('[PulseIntersectionIntegration] Setup complete \u0413\u0428"');
    } catch (err) {
      console.warn('[PulseIntersectionIntegration] Setup error:', err);
    }
  };

  const readinessCleanup = waitForLinkingSystemReady(game, finalizeSetup);

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
      readinessCleanup();
      if (adapter) adapter.dispose();
    },
  };
}
