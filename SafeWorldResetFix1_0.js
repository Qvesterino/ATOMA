/**
 * SAFE WORLD RESET FIX 1.0
 * 
 * Handles safe initialization and cleanup of visual-only systems
 * when switching between map scenes.
 * 
 * CRITICAL REQUIREMENTS:
 * - Never modify gameplay logic, physics, node/link logic, or camera
 * - Only manage visual module lifecycle
 * - Prevent crashes during map transitions
 * - Ensure all overlays are cleaned up on scene unload
 * - Wait for scene readiness before visual init
 * 
 * SAFE SYSTEMS MANAGED:
 * - CoreMetricsOverlay
 * - MetricReactiveWorldEvents
 * - NodePersonality2_0
 * - EvolvingLinkFX2_0
 * - SafeWorldFXPack
 * - All temporal timers and effect managers
 * 
 * [Persistent World State Cache 1.0]
 * - Caches last known good world state (node/link counts, metadata)
 * - Enables intelligent warm-start for faster transitions
 * - 100% backward compatible, disabled gracefully on any error
 */

// ==================== WORLD STATE CACHE 1.0 ====================

/**
 * WorldStateCache1_0 - Defensive warm-cache for faster transitions
 * 
 * Never stores raw node/link references.
 * Only tracks simple primitives (counts, IDs, timestamps).
 * Read-only from outside this file.
 * Gracefully disables if any error occurs.
 */
const WorldStateCache1_0 = {
  enabled: true,

  // Snapshot metadata
  lastWorldId: null,         // string | number | null - unique world identifier
  lastNodeCount: 0,          // number - last known good node count
  lastLinkCount: 0,          // number - last known good link count
  lastReady: false,          // boolean - was last world successfully ready?

  // Timestamps
  lastSnapshotTime: 0,       // performance.now() - when was snapshot taken?
  lastTransitionTime: 0,     // performance.now() - when was last transition?

  // Diagnostics
  snapshotsTaken: 0,         // number - total successful snapshots
  warmStarts: 0,             // number - successful warm-start uses
  warmStartsSkipped: 0,      // number - warm-starts rejected due to mismatch
  errors: 0,                 // number - errors encountered
};

/**
 * Safely take a snapshot of current world state
 * Called after successful transition when world is known good
 * 
 * @param {Object} aiNodes - The AINodes reference
 * @param {Object} linkingSystem - The NodeLinkingSystem reference (optional)
 * @private
 */
function takeWorldSnapshot(aiNodes, linkingSystem) {
  if (!WorldStateCache1_0.enabled) {
    return;
  }

  try {
    // Defensive checks
    if (!aiNodes) {
      console.debug('[WorldCache] Cannot snapshot: aiNodes missing');
      return;
    }

    if (!Array.isArray(aiNodes.nodeArray)) {
      console.debug('[WorldCache] Cannot snapshot: nodeArray invalid or missing');
      return;
    }

    // Get world identifier
    let worldId = aiNodes.worldId || aiNodes.sceneId || `auto-${Date.now()}`;

    // Count current nodes
    const nodeCount = aiNodes.nodeArray.length;

    // Try to get link count (optional, if method exists)
    let linkCount = 0;
    try {
      if (linkingSystem && typeof linkingSystem.getTotalLinkCount === 'function') {
        linkCount = linkingSystem.getTotalLinkCount();
      } else if (linkingSystem && Array.isArray(linkingSystem.links)) {
        linkCount = linkingSystem.links.length;
      }
    } catch (e) {
      // Link count is optional; proceed without it
      linkCount = 0;
    }

    // Store snapshot
    WorldStateCache1_0.lastWorldId = worldId;
    WorldStateCache1_0.lastNodeCount = nodeCount;
    WorldStateCache1_0.lastLinkCount = linkCount;
    WorldStateCache1_0.lastReady = true;
    WorldStateCache1_0.lastSnapshotTime = performance.now();
    WorldStateCache1_0.snapshotsTaken++;

    console.debug(`[WorldCache] Snapshot taken: world=${worldId}, nodes=${nodeCount}, links=${linkCount}`);
  } catch (err) {
    console.warn('[WorldCache] Snapshot error:', err.message);
    WorldStateCache1_0.errors++;
    
    // Disable cache after error to prevent cascading failures
    if (WorldStateCache1_0.errors > 5) {
      console.warn('[WorldCache] Too many errors, disabling WorldStateCache1_0');
      WorldStateCache1_0.enabled = false;
    }
  }
}

/**
 * Check if we can warm-start using cached world state
 * Returns true only if current world matches cache closely
 * 
 * @param {Object} aiNodes - The AINodes reference
 * @param {Object} linkingSystem - The NodeLinkingSystem reference (optional)
 * @returns {boolean} true if safe to warm-start, false if should use normal path
 * @private
 */
function canWarmStart(aiNodes, linkingSystem) {
  if (!WorldStateCache1_0.enabled || !WorldStateCache1_0.lastReady) {
    return false;
  }

  try {
    // Defensive checks
    if (!aiNodes || !Array.isArray(aiNodes.nodeArray)) {
      return false;
    }

    // Check if snapshot is too old (> 30 seconds)
    const now = performance.now();
    const ageMs = now - WorldStateCache1_0.lastSnapshotTime;
    if (ageMs > 30000) {
      console.debug('[WorldCache] Warm-start skipped: snapshot too old');
      WorldStateCache1_0.warmStartsSkipped++;
      return false;
    }

    // Check current world ID
    let currentWorldId = aiNodes.worldId || aiNodes.sceneId || null;
    if (currentWorldId !== null && currentWorldId !== WorldStateCache1_0.lastWorldId) {
      // Different world, cannot warm-start
      console.debug('[WorldCache] Warm-start skipped: world ID mismatch');
      WorldStateCache1_0.warmStartsSkipped++;
      return false;
    }

    // Check node count ratio (allow 50%-200% variance)
    const currentNodeCount = aiNodes.nodeArray.length;
    const ratio = currentNodeCount / Math.max(WorldStateCache1_0.lastNodeCount, 1);
    
    if (ratio < 0.5 || ratio > 2.0) {
      console.debug(`[WorldCache] Warm-start skipped: topology changed (nodes: ${WorldStateCache1_0.lastNodeCount} → ${currentNodeCount})`);
      WorldStateCache1_0.warmStartsSkipped++;
      return false;
    }

    // All checks passed - safe to warm-start
    WorldStateCache1_0.warmStarts++;
    console.debug(`[WorldCache] Warm-start accepted: world stable (${currentNodeCount} nodes)`);
    return true;
  } catch (err) {
    console.warn('[WorldCache] canWarmStart error:', err.message);
    WorldStateCache1_0.errors++;
    return false;
  }
}

// ==================== END CACHE ====================

export class SafeWorldResetFix1_0 {
  constructor() {
    // State tracking
    this.isTransitioning = false;
    this.sceneReady = false;
    this.lastSceneTimestamp = 0;
    
    // System references (managed by main game)
    this.systemRefs = {
      coreMetricsOverlay: null,
      metricReactiveEvents: null,
      nodePersonality: null,
      evolvingLinkFX: null,
      worldFXPack: null,
      scene: null,
      renderer: null,
      aiNodes: null  // VISUAL BOOTSTRAP 3.0: AINodes reference
    };
    
    // Cleanup queue for deferred object disposal
    this.cleanupQueue = [];
    
    // VISUAL BOOTSTRAP 3.0: Protected visual promises (skip cancellation)
    this.protectedVisualPromises = new Set();
    
    console.log('✓ Safe World Reset Fix 1.0 initialized');
  }

  /**
   * VISUAL BOOTSTRAP 3.0: Collect protected visual promises
   * These won't be cancelled during reset
   */
  _collectProtectedPromises() {
    if (!this.systemRefs.aiNodes || !this.systemRefs.aiNodes.visualBootstrap) return;
    
    const bootstrap = this.systemRefs.aiNodes.visualBootstrap;
    const protectedPromises = bootstrap.getProtectedPromises();
    
    protectedPromises.forEach(p => {
      this.protectedVisualPromises.add(p);
    });
    
    if (protectedPromises.length > 0) {
      console.log(`[SafeWorldResetFix] Protected ${protectedPromises.length} visual promises from cancellation`);
    }
  }
  
  /**
   * PHASE 1: BEGIN MAP TRANSITION
   * Called BEFORE disposing old world systems
   */
  beginMapTransition(systemRefs) {
    if (this.isTransitioning) {
      console.warn('⚠ Transition already in progress, aborting duplicate');
      return;
    }
    
    this.isTransitioning = true;
    this.lastSceneTimestamp = Date.now();
    
    console.group('🔄 BEGIN MAP TRANSITION (Phase 1)');
    
    // Store references
    this.systemRefs = { ...this.systemRefs, ...systemRefs };
    
    // VISUAL BOOTSTRAP 3.0: Protect pending visual promises before reset
    this._collectProtectedPromises();
    
    // STEP 1: Pause all temporal timers
    try {
      this._pauseTemporalTimers();
    } catch (e) {
      console.warn('⚠ Failed to pause temporal timers:', e.message);
    }
    
    // STEP 2: Pause metrics calculation
    try {
      if (this.systemRefs.coreMetricsOverlay) {
        this.systemRefs.coreMetricsOverlay.enabled = false;
      }
    } catch (e) {
      console.warn('⚠ Failed to pause metrics overlay:', e.message);
    }
    
    // STEP 3: DISABLED - Cancel pending events in MetricReactiveWorldEvents (legacy system)
    try {
      if (false && this.systemRefs.metricReactiveEvents) {
        this._cancelPendingEvents();
      }
    } catch (e) {
      console.warn('⚠ Failed to cancel pending events:', e.message);
    }
    
    console.log('✓ Transition phase 1 complete');
    console.groupEnd();
  }
  
  /**
   * PHASE 2: CLEAN OLD SCENE
   * Called to safely remove all visual overlays from old scene
   */
  cleanOldScene() {
    if (!this.isTransitioning) {
      console.warn('⚠ Not in transition state, aborting cleanup');
      return;
    }
    
    console.group('🧹 CLEAN OLD SCENE (Phase 2)');
    
    try {
      // Remove metric overlay visuals
      this._removeMetricsOverlayVisuals();
    } catch (e) {
      console.warn('⚠ Failed to remove metrics overlay visuals:', e.message);
    }
    
    try {
      // Remove world event visuals
      this._removeWorldEventVisuals();
    } catch (e) {
      console.warn('⚠ Failed to remove world event visuals:', e.message);
    }
    
    try {
      // Remove personality FX overlays
      this._removePersonalityFXOverlays();
    } catch (e) {
      console.warn('⚠ Failed to remove personality FX overlays:', e.message);
    }
    
    try {
      // Remove link FX overlays
      this._removeLinkFXOverlays();
    } catch (e) {
      console.warn('⚠ Failed to remove link FX overlays:', e.message);
    }
    
    try {
      // Remove world FX overlays (sky tints, vignettes, beams)
      this._removeWorldFXOverlays();
    } catch (e) {
      console.warn('⚠ Failed to remove world FX overlays:', e.message);
    }
    
    // Process deferred cleanup queue
    while (this.cleanupQueue.length > 0) {
      const item = this.cleanupQueue.shift();
      try {
        item.dispose();
      } catch (e) {
        // Silently skip disposal errors
      }
    }
    
    console.log('✓ Scene cleanup complete');
    console.groupEnd();
  }
  
  /**
   * PHASE 3: WAIT FOR NEW SCENE READY
   * Monitors that new scene has nodes/links ready before re-init
   * [WorldStateCache1_0] Supports warm-start for faster transitions
   */
  waitForNewSceneReady(scene, aiNodes, linkingSystem) {
    return new Promise((resolve) => {
      const maxAttempts = 100; // ~1 second at 100ms intervals
      let attempts = 0;
      
      const checkReady = () => {
        attempts++;
        
        // Check scene exists
        if (!scene || !scene.children) {
          if (attempts >= maxAttempts) {
            console.warn('⚠ Scene failed to initialize after waiting');
            resolve(false);
          } else {
            setTimeout(checkReady, 10);
          }
          return;
        }
        
        // Check nodes spawned (at least 1 node required)
        if (!aiNodes) {
          if (attempts >= maxAttempts) {
            console.warn('⚠ No nodes spawned in new scene');
            resolve(false);
          } else {
            setTimeout(checkReady, 10);
          }
          return;
        }
        
        // Defensive guard: Check if nodeArray exists and is an array
        if (!aiNodes.nodeArray || !Array.isArray(aiNodes.nodeArray)) {
          if (attempts >= maxAttempts) {
            console.warn('⚠ nodeArray not ready or invalid');
            resolve(false);
          } else {
            setTimeout(checkReady, 10);
          }
          return;
        }
        
        // [WorldStateCache1_0] Try warm-start before expensive waits
        if (canWarmStart(aiNodes, linkingSystem)) {
          console.log('✓ New scene ready via warm-start (cached state match)');
          this.sceneReady = true;
          resolve(true);
          return;
        }
        
        // Check if nodeArray has at least 1 node
        if (aiNodes.nodeArray.length === 0) {
          if (attempts >= maxAttempts) {
            console.warn('⚠ No nodes spawned in new scene');
            resolve(false);
          } else {
            setTimeout(checkReady, 10);
          }
          return;
        }
        
        // Check world root ready (if linkingSystem has worldRoot)
        if (linkingSystem && linkingSystem.worldRoot && !linkingSystem.worldRoot) {
          if (attempts >= maxAttempts) {
            console.warn('⚠ World root not ready in new scene');
            resolve(false);
          } else {
            setTimeout(checkReady, 10);
          }
          return;
        }
        
        // All checks passed
        console.log(`✓ New scene ready after ${attempts * 10}ms`);
        this.sceneReady = true;
        resolve(true);
      };
      
      checkReady();
    });
  }
  
  /**
   * PHASE 4: RE-INITIALIZE VISUAL SYSTEMS
   * Called AFTER new scene is ready
   */
  async reinitializeVisualSystems(systemRefs) {
    if (!this.isTransitioning) {
      console.warn('⚠ Not in transition state, aborting reinit');
      return;
    }
    
    console.group('🚀 REINITIALIZE VISUAL SYSTEMS (Phase 4)');
    
    // Update refs with new systems
    this.systemRefs = { ...this.systemRefs, ...systemRefs };
    
    // STEP 1: Resume temporal timers
    try {
      this._resumeTemporalTimers();
    } catch (e) {
      console.warn('⚠ Failed to resume temporal timers:', e.message);
    }
    
    // STEP 2: Re-enable metrics overlay
    try {
      if (this.systemRefs.coreMetricsOverlay && !this.systemRefs.coreMetricsOverlay.enabled) {
        this.systemRefs.coreMetricsOverlay.enabled = true;
        this.systemRefs.coreMetricsOverlay.metricsCalculator.resetCaches();
      }
    } catch (e) {
      console.warn('⚠ Failed to resume metrics overlay:', e.message);
    }
    
    // STEP 3: DISABLED - Rebuild visual references for MetricReactiveWorldEvents (legacy system)
    try {
      if (false && this.systemRefs.metricReactiveEvents) {
        this._rebuildEventReferences();
      }
    } catch (e) {
      console.warn('⚠ Failed to rebuild event references:', e.message);
    }
    
    // STEP 4: Re-attach personality FX to new nodes
    try {
      if (this.systemRefs.nodePersonality) {
        this._reattachPersonalityFX();
      }
    } catch (e) {
      console.warn('⚠ Failed to reattach personality FX:', e.message);
    }
    
    // STEP 5: Re-attach link FX to new links
    try {
      if (this.systemRefs.evolvingLinkFX) {
        this._reattachLinkFX();
      }
    } catch (e) {
      console.warn('⚠ Failed to reattach link FX:', e.message);
    }
    
    console.log('✓ Visual systems reinitialized');
    console.groupEnd();
  }
  
  /**
   * PHASE 5: COMPLETE TRANSITION
   * Called to finalize and re-enable all systems
   * [WorldStateCache1_0] Stores snapshot for faster next transition
   */
  completeTransition() {
    if (!this.isTransitioning) {
      console.warn('⚠ Not in transition state, aborting completion');
      return;
    }
    
    // [WorldStateCache1_0] Take snapshot of successful world state for next transition
    try {
      takeWorldSnapshot(this.systemRefs.aiNodes, this.systemRefs.linkingSystem);
      console.log('[WorldCache] Snapshot stored after successful transition');
    } catch (err) {
      console.warn('[WorldCache] Failed to store snapshot:', err.message);
    }
    
    this.isTransitioning = false;
    this.sceneReady = false;
    
    console.log('✅ MAP TRANSITION COMPLETE - All visual systems restored');
  }
  
  // ==================== INTERNAL HELPERS ====================
  
  _pauseTemporalTimers() {
    if (!this.systemRefs.coreMetricsOverlay) return;
    
    const overlay = this.systemRefs.coreMetricsOverlay;
    
    // Pause temporal system
    if (overlay.temporalSystem) {
      overlay.temporalSystem.paused = true;
    }
    
    console.log('  ⏸ Temporal timers paused');
  }
  
  _resumeTemporalTimers() {
    if (!this.systemRefs.coreMetricsOverlay) return;
    
    const overlay = this.systemRefs.coreMetricsOverlay;
    
    // Resume temporal system
    if (overlay.temporalSystem) {
      overlay.temporalSystem.paused = false;
    }
    
    console.log('  ▶ Temporal timers resumed');
  }
  
  _cancelPendingEvents() {
    // DISABLED: Legacy metric reactive system
    const eventMgr = null; // this.systemRefs.metricReactiveEvents;
    if (!eventMgr) return;
    
    // SAFETY FIX 4.0: Cancel any pending event cooldowns with type validation
    if (eventMgr.eventStates) {
      for (const eventType in eventMgr.eventStates) {
        const eventState = eventMgr.eventStates[eventType];
        
        // SAFETY FIX 4.0: Ensure state is an object before accessing properties
        if (typeof eventState !== 'object' || eventState === null) {
          // Initialize malformed state as safe object
          eventMgr.eventStates[eventType] = { lastTriggered: 0, isActive: false };
          continue;
        }
        
        // Safe to access properties now
        eventState.lastTriggered = -Infinity;
        eventState.isActive = false;
      }
    }
    
    console.log('  ⊗ Pending events cancelled');
  }
  
  _removeMetricsOverlayVisuals() {
    const overlay = this.systemRefs.coreMetricsOverlay;
    if (!overlay) return;
    
    // Remove HUD canvas
    if (overlay.hud && overlay.hud.canvas) {
      try {
        overlay.hud.canvas.parentNode?.removeChild(overlay.hud.canvas);
      } catch (e) {
        // Canvas already removed or detached
      }
    }
    
    // Remove temporal effect particles
    if (overlay.temporalEffects && overlay.temporalEffects.particleGroup) {
      try {
        this.systemRefs.scene?.remove(overlay.temporalEffects.particleGroup);
      } catch (e) {
        // Already removed or invalid
      }
    }
    
    console.log('  ✓ Metrics overlay visuals removed');
  }
  
  _removeWorldEventVisuals() {
    const eventMgr = this.systemRefs.metricReactiveEvents;
    if (!eventMgr) return;
    
    // Remove all active effect groups
    if (eventMgr.effectGroups) {
      for (const groupKey in eventMgr.effectGroups) {
        try {
          const group = eventMgr.effectGroups[groupKey];
          if (group && group.parent) {
            group.parent.remove(group);
          }
        } catch (e) {
          // Already removed
        }
      }
      eventMgr.effectGroups = {};
    }
    
    // Remove particles
    if (eventMgr.particleGroup) {
      try {
        this.systemRefs.scene?.remove(eventMgr.particleGroup);
      } catch (e) {
        // Already removed
      }
    }
    
    console.log('  ✓ World event visuals removed');
  }
  
  _removePersonalityFXOverlays() {
    const personality = this.systemRefs.nodePersonality;
    if (!personality) return;
    
    // Clear all node animation states
    if (personality.nodeStates) {
      personality.nodeStates.clear();
    }
    
    console.log('  ✓ Personality FX overlays cleared');
  }
  
  _removeLinkFXOverlays() {
    const linkFX = this.systemRefs.evolvingLinkFX;
    if (!linkFX) return;
    
    // Remove all link FX particles and trails
    if (linkFX.linkEffects) {
      for (const linkId in linkFX.linkEffects) {
        try {
          const effect = linkFX.linkEffects[linkId];
          if (effect && effect.group && effect.group.parent) {
            effect.group.parent.remove(effect.group);
          }
        } catch (e) {
          // Already removed
        }
      }
      linkFX.linkEffects = {};
    }
    
    console.log('  ✓ Link FX overlays removed');
  }
  
  _removeWorldFXOverlays() {
    const worldFX = this.systemRefs.worldFXPack;
    if (!worldFX) return;
    
    // Remove sky tint layers
    if (worldFX.skyTintGroup) {
      try {
        this.systemRefs.scene?.remove(worldFX.skyTintGroup);
      } catch (e) {
        // Already removed
      }
    }
    
    // Remove vignette layers
    if (worldFX.vignetteGroup) {
      try {
        this.systemRefs.scene?.remove(worldFX.vignetteGroup);
      } catch (e) {
        // Already removed
      }
    }
    
    // Remove particle effect groups
    if (worldFX.effectGroups) {
      for (const groupKey in worldFX.effectGroups) {
        try {
          const group = worldFX.effectGroups[groupKey];
          if (group && group.parent) {
            group.parent.remove(group);
          }
        } catch (e) {
          // Already removed
        }
      }
      worldFX.effectGroups = {};
    }
    
    console.log('  ✓ World FX overlays removed');
  }
  
  _rebuildEventReferences() {
    // DISABLED: Legacy metric reactive system
    const eventMgr = null; // this.systemRefs.metricReactiveEvents;
    if (!eventMgr) return;
    
    // Reset event group cache so new references are built
    // eventMgr.effectGroups = eventMgr.effectGroups || {};
    //
    // Mark event manager as needing reference rebuild
    // if (eventMgr.needsReferenceRebuild) {
    //   eventMgr.needsReferenceRebuild = true;
    // }
    
    // console.log('  ✓ Event visual references rebuilt');
  }
  
  _reattachPersonalityFX() {
    const personality = this.systemRefs.nodePersonality;
    if (!personality || !personality.update) return;
    
    // Personality FX uses node references directly in update()
    // No explicit reattach needed - just ensure update() is called
    console.log('  ✓ Personality FX ready for new nodes');
  }
  
  _reattachLinkFX() {
    const linkFX = this.systemRefs.evolvingLinkFX;
    if (!linkFX || !linkFX.update) return;
    
    // Link FX uses link references directly in update()
    // No explicit reattach needed - just ensure update() is called
    console.log('  ✓ Link FX ready for new links');
  }
  
  /**
   * Get transition status (for debugging)
   */
  getStatus() {
    return {
      isTransitioning: this.isTransitioning,
      sceneReady: this.sceneReady,
      cleanupQueueLength: this.cleanupQueue.length,
      systemsActive: {
        metricsOverlay: !!this.systemRefs.coreMetricsOverlay,
        metricEvents: false, // DISABLED: Legacy system (was !!this.systemRefs.metricReactiveEvents)
        personality: !!this.systemRefs.nodePersonality,
        linkFX: !!this.systemRefs.evolvingLinkFX,
        worldFX: !!this.systemRefs.worldFXPack
      }
    };
  }
}

// ==================== DIAGNOSTICS HELPERS ====================

/**
 * Attach debug helpers to window for console access
 * Only in development/debug contexts
 */
if (typeof window !== 'undefined') {
  window.worldCacheStatus = function () {
    console.group('[WorldCache] Status Report');
    console.log('Enabled:', WorldStateCache1_0.enabled);
    console.log('Last World ID:', WorldStateCache1_0.lastWorldId);
    console.log('Last Node Count:', WorldStateCache1_0.lastNodeCount);
    console.log('Last Link Count:', WorldStateCache1_0.lastLinkCount);
    console.log('Last Ready:', WorldStateCache1_0.lastReady);
    console.log('Snapshots Taken:', WorldStateCache1_0.snapshotsTaken);
    console.log('Warm Starts:', WorldStateCache1_0.warmStarts);
    console.log('Warm Starts Skipped:', WorldStateCache1_0.warmStartsSkipped);
    console.log('Errors:', WorldStateCache1_0.errors);
    
    if (WorldStateCache1_0.snapshotsTaken > 0) {
      const ratio = WorldStateCache1_0.warmStarts / WorldStateCache1_0.snapshotsTaken;
      console.log(`Success Ratio: ${(ratio * 100).toFixed(1)}%`);
    }
    
    console.groupEnd();
  };

  window.worldCacheDisable = function () {
    WorldStateCache1_0.enabled = false;
    console.log('[WorldCache] Disabled');
  };

  window.worldCacheEnable = function () {
    WorldStateCache1_0.enabled = true;
    console.log('[WorldCache] Enabled');
  };

  window.worldCacheReset = function () {
    WorldStateCache1_0.lastWorldId = null;
    WorldStateCache1_0.lastNodeCount = 0;
    WorldStateCache1_0.lastLinkCount = 0;
    WorldStateCache1_0.lastReady = false;
    WorldStateCache1_0.lastSnapshotTime = 0;
    WorldStateCache1_0.snapshotsTaken = 0;
    WorldStateCache1_0.warmStarts = 0;
    WorldStateCache1_0.warmStartsSkipped = 0;
    WorldStateCache1_0.errors = 0;
    console.log('[WorldCache] Reset to initial state');
  };
}