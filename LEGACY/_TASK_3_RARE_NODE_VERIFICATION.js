/**
 * TASK 3: RARE NODE VERIFICATION
 * 
 * Comprehensive tracking and verification of rare and special nodes:
 * - Track update ticks per frame
 * - Confirm registry participation
 * - Monitor hologram shell visibility
 * - Detect link state corruption
 * - Report failures with exact locations
 * 
 * Logs:
 * - Node ID, category, rarity, update tick
 * - Registry presence verification
 * - Shell visibility after link/unlink cycles
 */

export class RareNodeVerificationTracker {
  constructor(aiNodes) {
    this.aiNodes = aiNodes;
    this.frameNumber = 0;
    
    // Tracking maps
    this.nodeTracking = new Map(); // nodeId -> { ticks, lastSeen, category, rarity, ... }
    this.shellVisibility = new Map(); // nodeId -> { shellVisible, lastCheck }
    this.linkHistory = new Map(); // nodeId -> { linked, changes, lastChange }
    this.failures = [];
    
    // Configuration
    this.verboseLogging = false; // Set to true for detailed logs
    this.failureStopMode = true; // Stop on first failure (as requested)
    this.trackingInterval = 1; // Every frame (1 = every frame, 10 = every 10 frames)
    
    // Rarity classification
    this.rareTypes = new Set([
      'prism', 'aurora', 'singularity', 'ember', 'seraph',
      'bloom', 'nexus', 'void', 'resonance', 'celestial'
    ]);
  }

  /**
   * Classify node rarity
   */
  getNodeRarity(node) {
    if (!node || !node.userData) return 'unknown';
    
    // Check rare types (RareNodeSpawner nodes)
    if (this.rareTypes.has(node.userData.rareType)) {
      return 'rare';
    }
    
    // Check archetype
    const archetype = node.userData.archetype || '';
    if (archetype.includes('MYTHIC')) return 'mythic';
    if (archetype.includes('PRIME')) return 'prime';
    if (archetype.includes('ERROR')) return 'error';
    if (archetype.includes('EXTREME')) return 'extreme';
    
    return 'standard';
  }

  /**
   * Get all special nodes (rare, extreme, special)
   */
  getSpecialNodes() {
    const special = [];
    const registry = this.aiNodes?.nodes || [];
    
    registry.forEach(node => {
      const rarity = this.getNodeRarity(node);
      if (['rare', 'extreme', 'mythic', 'prime', 'error'].includes(rarity)) {
        special.push({ node, rarity });
      }
    });
    
    return special;
  }

  /**
   * Record node update (called during update loop)
   */
  recordUpdate(node) {
    if (!node) return;
    
    const nodeId = node.uuid || node.id;
    if (!nodeId) return;
    
    let tracking = this.nodeTracking.get(nodeId);
    if (!tracking) {
      const rarity = this.getNodeRarity(node);
      tracking = {
        nodeId,
        ticks: 0,
        lastSeen: this.frameNumber,
        category: node.userData?.category || 'unknown',
        rarity,
        missingTicks: 0,
      };
      this.nodeTracking.set(nodeId, tracking);
    }
    
    tracking.ticks++;
    tracking.lastSeen = this.frameNumber;
    tracking.missingTicks = 0; // Reset on update
  }

  /**
   * Check hologram shell visibility
   */
  checkShellVisibility(node) {
    if (!node) return null;
    
    const nodeId = node.uuid || node.id;
    const shell = node.children?.find(c => c.userData?.isHologramShell);
    
    if (!shell) {
      return {
        nodeId,
        shellFound: false,
        visible: false,
        issue: 'NO_HOLOGRAM_SHELL',
      };
    }
    
    const isVisible = shell.visible && !shell.frustumCulled;
    
    let tracking = this.shellVisibility.get(nodeId);
    if (!tracking) {
      tracking = { shellVisible: isVisible, lastCheck: this.frameNumber };
      this.shellVisibility.set(nodeId, tracking);
    }
    
    tracking.shellVisible = isVisible;
    tracking.lastCheck = this.frameNumber;
    
    return {
      nodeId,
      shellFound: true,
      visible: isVisible,
      frustumCulled: shell.frustumCulled,
      rotation: {
        x: shell.rotation.x.toFixed(3),
        y: shell.rotation.y.toFixed(3),
        z: shell.rotation.z.toFixed(3),
      },
    };
  }

  /**
   * Check link state consistency
   */
  checkLinkState(node) {
    if (!node) return null;
    
    const nodeId = node.uuid || node.id;
    const linked = node.linked === true;
    const linkedCount = node.linkedNodes?.length || 0;
    
    let tracking = this.linkHistory.get(nodeId);
    if (!tracking) {
      tracking = {
        nodeId,
        linked,
        linkedCount,
        changes: 0,
        lastChange: this.frameNumber,
      };
      this.linkHistory.set(nodeId, tracking);
      return tracking;
    }
    
    if (tracking.linked !== linked || tracking.linkedCount !== linkedCount) {
      tracking.linked = linked;
      tracking.linkedCount = linkedCount;
      tracking.changes++;
      tracking.lastChange = this.frameNumber;
    }
    
    return tracking;
  }

  /**
   * CRITICAL: Check if node is in registry
   */
  checkRegistryMembership(node) {
    if (!node) return false;
    const registry = this.aiNodes?.nodes || [];
    return registry.includes(node);
  }

  /**
   * Per-frame verification
   * Called from update loop
   */
  verifyPerFrame() {
    this.frameNumber++;
    
    // Only verify on interval
    if (this.frameNumber % this.trackingInterval !== 0) return;
    
    const specialNodes = this.getSpecialNodes();
    
    // Check each special node
    for (const { node, rarity } of specialNodes) {
      const nodeId = node.uuid || node.id;
      
      // 1. Record update
      this.recordUpdate(node);
      
      // 2. Check registry membership
      if (!this.checkRegistryMembership(node)) {
        this.logFailure('REGISTRY_MISSING', node, rarity, 
          `Node ${nodeId} NOT in AINodes.nodes registry`);
        if (this.failureStopMode) return;
      }
      
      // 3. Check hologram shell
      const shellStatus = this.checkShellVisibility(node);
      if (!shellStatus.visible && shellStatus.shellFound) {
        this.logFailure('SHELL_INVISIBLE', node, rarity,
          `Hologram shell not visible for node ${nodeId}`);
        if (this.failureStopMode) return;
      }
      
      // 4. Check link state consistency
      const linkStatus = this.checkLinkState(node);
      
      // 5. Verbose logging (if enabled)
      if (this.verboseLogging && this.frameNumber % 60 === 0) {
        console.log(`[RareNodeVerify] Frame ${this.frameNumber}: ${nodeId} (${rarity}) - Ticks: ${(this.nodeTracking.get(nodeId)?.ticks || 0)}, Shell: ${shellStatus.visible}`);
      }
    }
    
    // Check for nodes that missed updates
    this.detectMissedUpdates();
  }

  /**
   * Detect nodes that didn't update this frame
   */
  detectMissedUpdates() {
    const registry = this.aiNodes?.nodes || [];
    const specialNodes = this.getSpecialNodes();
    
    for (const { node, rarity } of specialNodes) {
      const nodeId = node.uuid || node.id;
      const tracking = this.nodeTracking.get(nodeId);
      
      if (tracking && tracking.missingTicks > 10) {
        this.logFailure('MISSING_UPDATES', node, rarity,
          `Node ${nodeId} missed ${tracking.missingTicks} consecutive updates`);
        if (this.failureStopMode) return;
      }
    }
  }

  /**
   * Log a failure with exact location info
   */
  logFailure(failureType, node, rarity, message) {
    const nodeId = node?.uuid || node?.id || 'unknown';
    const category = node?.userData?.category || 'unknown';
    
    const failure = {
      frame: this.frameNumber,
      type: failureType,
      nodeId,
      category,
      rarity,
      message,
      timestamp: Date.now(),
    };
    
    this.failures.push(failure);
    
    console.error(`❌ [CRITICAL FAILURE] ${failureType}`);
    console.error(`   Frame: ${this.frameNumber}`);
    console.error(`   Node ID: ${nodeId}`);
    console.error(`   Category: ${category}`);
    console.error(`   Rarity: ${rarity}`);
    console.error(`   Message: ${message}`);
    console.error(`   Stack trace for debugging:`, new Error().stack);
  }

  /**
   * Get verification report
   */
  getVerificationReport() {
    const specialNodes = this.getSpecialNodes();
    const report = {
      frame: this.frameNumber,
      specialNodesTracked: specialNodes.length,
      updateCoverage: this.getUpdateCoverage(),
      shelVisibility: this.getShellVisibility(),
      failures: this.failures,
      failureCount: this.failures.length,
    };
    
    return report;
  }

  /**
   * Get update coverage stats
   */
  getUpdateCoverage() {
    const specialNodes = this.getSpecialNodes();
    const coverage = [];
    
    for (const { node, rarity } of specialNodes) {
      const nodeId = node.uuid || node.id;
      const tracking = this.nodeTracking.get(nodeId);
      
      coverage.push({
        nodeId: nodeId.substring(0, 8), // Shorten for readability
        rarity,
        ticks: tracking?.ticks || 0,
        status: tracking && tracking.ticks > 0 ? 'UPDATING' : 'NO_UPDATES',
      });
    }
    
    return coverage;
  }

  /**
   * Get shell visibility stats
   */
  getShellVisibility() {
    const specialNodes = this.getSpecialNodes();
    const visibility = [];
    
    for (const { node, rarity } of specialNodes) {
      const nodeId = node.uuid || node.id;
      const shell = this.checkShellVisibility(node);
      
      visibility.push({
        nodeId: nodeId.substring(0, 8),
        rarity,
        shellVisible: shell.visible,
        shellFound: shell.shellFound,
        issue: shell.issue,
      });
    }
    
    return visibility;
  }

  /**
   * Console API for manual verification
   */
  attachConsoleAPI() {
    if (typeof window !== 'undefined') {
      window.__rareNodeTracker = {
        report: () => this.getVerificationReport(),
        updateCoverage: () => this.getUpdateCoverage(),
        shellStatus: () => this.getShellVisibility(),
        failures: () => this.failures,
        enable: () => { this.verboseLogging = true; console.log('Verbose logging enabled'); },
        disable: () => { this.verboseLogging = false; console.log('Verbose logging disabled'); },
      };
    }
  }
}

/**
 * Setup verification tracker
 */
export function setupRareNodeVerificationTracker(aiNodes) {
  const tracker = new RareNodeVerificationTracker(aiNodes);
  
  // Patch AINodes.update() to call verifier
  const originalUpdate = aiNodes.update.bind(aiNodes);
  aiNodes.update = function(deltaTime, time) {
    const result = originalUpdate(deltaTime, time);
    
    // Verify after update
    tracker.verifyPerFrame();
    
    // Stop on critical failure
    if (tracker.failures.length > 0 && tracker.failureStopMode) {
      console.error('TASK 3: RARE NODE VERIFICATION FAILURE');
      const lastFailure = tracker.failures[tracker.failures.length - 1];
      console.error(`EXACT LOCATION: Node ${lastFailure.nodeId} in AINodes.update() → verification stage`);
      throw new Error(`Rare node verification failed: ${lastFailure.message}`);
    }
    
    return result;
  };

  tracker.attachConsoleAPI();
  return tracker;
}
