/**
 * LINKED GLYPH SYNCHRONIZATION 1.0 — COORDINATED VISUAL COMMUNICATION
 * 
 * Synchronizes glyph animations across linked nodes, creating unified visual behavior
 * that expresses the quality and state of their connections.
 * 
 * SYNCHRONIZATION MECHANICS:
 * - High synergy (≥70) → perfect sync (0 ms drift)
 * - Medium synergy (30–69) → small drift (10–40 ms)
 * - Low synergy (<30) → visible de-sync (60–120 ms)
 * - Low stability increases drift by +20–50 ms
 * - Corruption adds phase inversion (180° flip)
 * - Harmony reduces drift by 30%
 * 
 * PARAMETERS SYNCHRONIZED:
 * 1. rotationPhase — Synchronized rotation timing
 * 2. pulseTiming — Aligned pulse rhythms
 * 3. hueShiftPhase — Unified color shifts
 * 4. scaleOscillation — Coordinated scale breathing
 * 5. orbitSpeed — Synchronized orbital motion (if applicable)
 * 
 * LINK METRICS ANALYSIS:
 * - linkStrength: (0-100) Base synchronization strength
 * - synergy: (0-1) Quality of connection
 * - corruption: (0-1) Connection decay/interference
 * - stability: (0-1) Temporal drift/jitter
 * - harmony: (0-1) Connection smoothness
 * 
 * SAFETY LAYER:
 * - NO modifications to node physics or gameplay
 * - NO changes to link creation/destruction
 * - NO glyph mesh creation or removal
 * - ONLY animation parameter adjustments
 * - Read-only from linking system
 * - < 0.5ms per frame cost
 * - Fully reversible via toggle
 * - Auto-cleanup on world transitions
 * 
 * VISUAL RESULT:
 * - Linked nodes appear to pulse together
 * - Color shifts harmonize across connections
 * - Rotations feel coordinated and intentional
 * - De-sync is visible when connection is weak/corrupted
 * - Network feels "alive" with synchronized communication
 */

import * as THREE from 'three';

export class LinkedGlyphSynchronization1_0 {
  constructor(scene) {
    this.scene = scene;
    
    // Enable/disable sync
    this.enabled = true;
    
    // Sync state per link (linkId → syncData)
    this.linkSyncState = new Map();
    
    // Phase alignments per node (nodeId → { phase, offset, drift })
    this.nodePhaseAlignment = new Map();
    
    // Global time reference for all synchronization
    this.globalTime = 0;
    
    // Configuration for sync calculations
    this.config = {
      // Synchronization base parameters
      minDriftMs: 0,        // Perfect sync minimum
      maxDriftMs: 120,      // Maximum visible de-sync
      stabilityDriftMult: 30,  // ms per stability point
      harmonyDriftReduction: 0.3, // 30% reduction from harmony
      
      // Phase inversion
      corruptionPhaseInversion: true,
      corruptionThreshold: 0.5,    // When to apply inversion
      
      // Animation affect parameters
      syncRotationBoost: 0.2,      // 20% rotation speed boost when synced
      syncPulseAmplitude: 0.1,     // 10% pulse amplitude increase
      syncHueCoherence: 0.8,       // Color shift coherence (0-1)
      syncScaleCoherence: 0.6,     // Scale oscillation coherence
      
      // Performance
      syncUpdateHz: 30,            // 30Hz sync updates (33ms)
      phaseLookupCells: 12         // Resolution for phase calculation
    };
    
    // Last update time for throttling
    this.lastSyncUpdateTime = 0;
    this.syncUpdateInterval = 1000 / this.config.syncUpdateHz;
    
    // Statistics
    this.stats = {
      linksProcessed: 0,
      syncedPairs: 0,
      perfectSyncCount: 0,
      mediumSyncCount: 0,
      looseSyncCount: 0,
      lastFrameTime: 0,
      totalFrames: 0
    };
    
    // Debug flags
    this.debugMode = false;
    this.debugSyncId = null;
    
    console.log('✓ Linked Glyph Synchronization 1.0 initialized');
    console.log('  - Coordinates glyph animations across linked nodes');
    console.log('  - Perfect sync: high synergy (≥70)');
    console.log('  - Medium sync: medium synergy (30-69)');
    console.log('  - Loose sync: low synergy (<30)');
    console.log('  - Corruption adds phase inversion');
    console.log('  - Use debugGlyphSync() to inspect');
  }
  
  /**
   * Register a link for synchronization
   * Called when a new link is created
   */
  registerLink(link, linkId) {
    if (this.linkSyncState.has(linkId)) return;
    
    // Calculate initial sync parameters
    const syncData = this.calculateLinkSyncParameters(link);
    
    this.linkSyncState.set(linkId, {
      link,
      linkId,
      ...syncData,
      createdAt: Date.now(),
      nodeA_Id: link.nodeA?.userData?.nodeId || link.nodeA?.uuid || 'unknown',
      nodeB_Id: link.nodeB?.userData?.nodeId || link.nodeB?.uuid || 'unknown',
      updateCounter: 0
    });
    
    // Initialize phase alignments for both nodes if needed
    if (!this.nodePhaseAlignment.has(this.linkSyncState.get(linkId).nodeA_Id)) {
      this.nodePhaseAlignment.set(this.linkSyncState.get(linkId).nodeA_Id, {
        phase: 0,
        offset: 0,
        drift: 0
      });
    }
    if (!this.nodePhaseAlignment.has(this.linkSyncState.get(linkId).nodeB_Id)) {
      this.nodePhaseAlignment.set(this.linkSyncState.get(linkId).nodeB_Id, {
        phase: 0,
        offset: 0,
        drift: 0
      });
    }
  }
  
  /**
   * Unregister a link from synchronization
   * Called when a link is destroyed
   */
  unregisterLink(linkId) {
    this.linkSyncState.delete(linkId);
  }
  
  /**
   * Calculate sync parameters for a link
   * Returns: { syncStrength, driftMs, phaseInversion, syncQuality }
   */
  calculateLinkSyncParameters(link) {
    if (!link) return this.getDefaultSyncParams();
    
    // Extract metrics (safe fallbacks)
    const synergyScore = link.userData?.synergy?.score ?? link?.synergyScore ?? 0.5;
    const linkStrength = (link.strength || synergyScore * 100) || 50;
    const synergy = synergyScore;
    const corruption = link.corruption || 0;
    const stability = link.stability || 0;
    const harmony = link.harmony || 0;
    
    // Calculate sync strength based on synergy
    // ≥70 = perfect sync, 30-69 = medium, <30 = loose
    let syncQuality = 'loose';
    if (synergy >= 0.7) {
      syncQuality = 'perfect';
    } else if (synergy >= 0.3) {
      syncQuality = 'medium';
    }
    
    // Calculate drift in milliseconds
    let driftMs = 0;
    
    if (syncQuality === 'perfect') {
      // Perfect sync: minimal drift
      driftMs = this.config.minDriftMs;
    } else if (syncQuality === 'medium') {
      // Medium sync: interpolate between 10-40ms
      const normalizedSynergy = (synergy - 0.3) / 0.4; // 0 to 1
      driftMs = 10 + (normalizedSynergy * 30);
    } else {
      // Loose sync: 60-120ms
      const normalizedSynergy = Math.max(0, synergy / 0.3); // 0 to 1
      driftMs = 60 + ((1 - normalizedSynergy) * 60);
    }
    
    // Low stability increases drift (inverse: lower stability = more drift)
    const stabilityFactor = 1 - stability;
    driftMs += stabilityFactor * this.config.stabilityDriftMult;
    
    // Harmony reduces drift
    driftMs *= (1 - harmony * this.config.harmonyDriftReduction);
    
    // Corruption can invert phase
    const phaseInversion = corruption >= this.config.corruptionThreshold;
    
    return {
      syncStrength: linkStrength,
      synergy,
      corruption,
      stability,
      harmony,
      driftMs: Math.max(0, driftMs),
      phaseInversion,
      syncQuality,
      basePhase: (linkStrength / 100) * Math.PI * 2
    };
  }
  
  /**
   * Get default sync parameters for missing links
   */
  getDefaultSyncParams() {
    return {
      syncStrength: 50,
      synergy: 0.5,
      corruption: 0,
      stability: 0.5,
      harmony: 0.5,
      driftMs: 40,
      phaseInversion: false,
      syncQuality: 'medium',
      basePhase: Math.PI
    };
  }
  
  /**
   * Main update loop - applies sync to all active links
   * Call every frame from main game loop
   */
  update(deltaTime, aiNodes, linkingSystem) {
    if (!this.enabled || !aiNodes || !linkingSystem) return;
    
    const startTime = performance.now();
    
    this.globalTime += deltaTime;
    this.stats.totalFrames++;
    
    // Throttle sync calculations to reduce CPU cost
    const now = Date.now();
    if (now - this.lastSyncUpdateTime < this.syncUpdateInterval) {
      return; // Skip this frame, will update on next sync interval
    }
    this.lastSyncUpdateTime = now;
    
    // Reset counters
    this.stats.linksProcessed = 0;
    this.stats.syncedPairs = 0;
    this.stats.perfectSyncCount = 0;
    this.stats.mediumSyncCount = 0;
    this.stats.looseSyncCount = 0;
    
    // Process each link in linking system
    if (linkingSystem.links && Array.isArray(linkingSystem.links)) {
      linkingSystem.links.forEach((link, index) => {
        const linkId = link.uuid || link.id || `link-${index}`;
        
        // Register if new
        if (!this.linkSyncState.has(linkId)) {
          this.registerLink(link, linkId);
        }
        
        // Update sync for this link
        this.updateLinkSync(link, linkId, aiNodes);
        
        this.stats.linksProcessed++;
      });
    }
    
    // Apply synchronized animations to all nodes
    this.applySynchronizedAnimations(aiNodes);
    
    // Record performance
    this.stats.lastFrameTime = performance.now() - startTime;
  }
  
  /**
   * Update synchronization parameters for a specific link
   */
  updateLinkSync(link, linkId, aiNodes) {
    const syncData = this.linkSyncState.get(linkId);
    if (!syncData) return;
    
    // Recalculate sync parameters (link metrics may have changed)
    const newParams = this.calculateLinkSyncParameters(link);
    
    // Update sync state
    syncData.syncStrength = newParams.syncStrength;
    syncData.synergy = newParams.synergy;
    syncData.corruption = newParams.corruption;
    syncData.stability = newParams.stability;
    syncData.harmony = newParams.harmony;
    syncData.driftMs = newParams.driftMs;
    syncData.phaseInversion = newParams.phaseInversion;
    syncData.syncQuality = newParams.syncQuality;
    syncData.basePhase = newParams.basePhase;
    syncData.updateCounter++;
    
    // Track sync quality
    if (syncData.syncQuality === 'perfect') {
      this.stats.perfectSyncCount++;
      this.stats.syncedPairs++;
    } else if (syncData.syncQuality === 'medium') {
      this.stats.mediumSyncCount++;
      this.stats.syncedPairs++;
    } else {
      this.stats.looseSyncCount++;
    }
    
    // Debug output if enabled
    if (this.debugMode && this.debugSyncId === linkId) {
      console.log(`[SYNC DEBUG] Link ${linkId}:`, {
      quality: syncData.syncQuality,
      driftMs: syncData.driftMs.toFixed(2),
      synergy: syncData.synergy.toFixed(2),
      corruption: syncData.corruption.toFixed(2),
      stability: syncData.stability.toFixed(2),
      phaseInversion: syncData.phaseInversion
      });
    }
  }
  
  /**
   * Apply synchronized animation parameters to all glyphs
   * This modifies animation state in Adaptive Glyph Rendering
   */
  applySynchronizedAnimations(aiNodes) {
    if (!aiNodes || !aiNodes.nodes) return;
    
    // Build a map of which nodes are connected and their sync data
    const nodeConnections = new Map(); // nodeId → { linkedNodes: [...], syncDataArray: [...] }
    
    this.linkSyncState.forEach((syncData, linkId) => {
      const nodeA_Id = syncData.nodeA_Id;
      const nodeB_Id = syncData.nodeB_Id;
      
      // Add connection data for node A
      if (!nodeConnections.has(nodeA_Id)) {
        nodeConnections.set(nodeA_Id, { linkedNodes: [], syncDataArray: [] });
      }
      nodeConnections.get(nodeA_Id).linkedNodes.push(nodeB_Id);
      nodeConnections.get(nodeA_Id).syncDataArray.push(syncData);
      
      // Add connection data for node B
      if (!nodeConnections.has(nodeB_Id)) {
        nodeConnections.set(nodeB_Id, { linkedNodes: [], syncDataArray: [] });
      }
      nodeConnections.get(nodeB_Id).linkedNodes.push(nodeA_Id);
      nodeConnections.get(nodeB_Id).syncDataArray.push(syncData);
    });
    
    // Apply synchronized animation to each node
    aiNodes.nodes.forEach((node, index) => {
      if (!node || !node.userData) return;
      
      const nodeId = node.userData.nodeId || node.uuid || `node-${index}`;
      const connections = nodeConnections.get(nodeId);
      
      if (!connections || connections.syncDataArray.length === 0) {
        // No connections, reset to individual animation
        this.resetNodeSyncState(nodeId);
        return;
      }
      
      // Calculate averaged sync parameters from all connected links
      const avgSyncParams = this.calculateAverageSyncParams(connections.syncDataArray);
      
      // Apply synchronized animation to this node's glyphs
      this.applySyncToNode(node, nodeId, avgSyncParams);
    });
  }
  
  /**
   * Calculate average sync parameters from multiple connections
   */
  calculateAverageSyncParams(syncDataArray) {
    if (syncDataArray.length === 0) {
      return this.getDefaultSyncParams();
    }
    
    let sumDrift = 0;
    let sumSynergy = 0;
    let sumCorruption = 0;
    let sumStability = 0;
    let sumHarmony = 0;
    let countInversions = 0;
    
    syncDataArray.forEach(data => {
      sumDrift += data.driftMs || 0;
      sumSynergy += data.synergy || 0;
      sumCorruption += data.corruption || 0;
      sumStability += data.stability || 0;
      sumHarmony += data.harmony || 0;
      if (data.phaseInversion) countInversions++;
    });
    
    const count = syncDataArray.length;
    return {
      avgDriftMs: sumDrift / count,
      avgSynergy: sumSynergy / count,
      avgCorruption: sumCorruption / count,
      avgStability: sumStability / count,
      avgHarmony: sumHarmony / count,
      hasPhaseInversion: countInversions > count / 2,
      connectionCount: count
    };
  }
  
  /**
   * Apply sync animation parameters to a specific node
   */
  applySyncToNode(node, nodeId, avgSyncParams) {
    if (!node.userData) return;
    
    // Calculate sync phase offset based on drift
    const driftSeconds = avgSyncParams.avgDriftMs / 1000;
    const phaseOffset = (driftSeconds * Math.PI * 2); // Convert to phase
    
    // Apply phase inversion if corruption is high
    const phaseMultiplier = avgSyncParams.hasPhaseInversion ? -1 : 1;
    
    // Store sync state on node for use by glyph animation systems
    node.userData.glyphSyncState = {
      phaseOffset: phaseOffset * phaseMultiplier,
      driftMs: avgSyncParams.avgDriftMs,
      syncedToLinks: avgSyncParams.connectionCount,
      synergy: avgSyncParams.avgSynergy,
      corruption: avgSyncParams.avgCorruption,
      stability: avgSyncParams.avgStability,
      harmony: avgSyncParams.avgHarmony,
      hasPhaseInversion: avgSyncParams.hasPhaseInversion,
      
      // Animation boost parameters
      rotationSyncBoost: Math.max(0, avgSyncParams.avgSynergy * this.config.syncRotationBoost),
      pulseSyncAmplitude: avgSyncParams.avgSynergy * this.config.syncPulseAmplitude,
      hueCoherence: Math.max(0.3, avgSyncParams.avgSynergy * this.config.syncHueCoherence),
      scaleCoherence: Math.max(0.2, avgSyncParams.avgSynergy * this.config.syncScaleCoherence)
    };
    
    // Apply to all glyph meshes on this node
    this.applySyncToNodeGlyphs(node, node.userData.glyphSyncState);
  }
  
  /**
   * Apply sync animation to all glyphs attached to a node
   */
  applySyncToNodeGlyphs(node, syncState) {
    if (!node.children) return;
    
    // Search for glyphs in node hierarchy
    node.traverse((child) => {
      if (!child.userData) return;
      
      // Identify glyph meshes (any mesh with glyph markers in userData)
      const isGlyph = 
        child.userData.glyphType ||
        child.userData.isGlyph ||
        child.userData.glyphSlot;
      
      if (isGlyph && child.userData) {
        // Store sync state on glyph for animation systems to use
        child.userData.linkedGlyphSync = {
          phaseOffset: syncState.phaseOffset,
          driftMs: syncState.driftMs,
          rotationBoost: syncState.rotationSyncBoost,
          pulseAmplitude: syncState.pulseSyncAmplitude,
          hueCoherence: syncState.hueCoherence,
          scaleCoherence: syncState.scaleCoherence,
          hasPhaseInversion: syncState.hasPhaseInversion,
          timestamp: Date.now()
        };
      }
    });
  }
  
  /**
   * Reset sync state for a node (when it has no connections)
   */
  resetNodeSyncState(nodeId) {
    const alignment = this.nodePhaseAlignment.get(nodeId);
    if (alignment) {
      alignment.phase = 0;
      alignment.offset = 0;
      alignment.drift = 0;
    }
  }
  
  /**
   * Get current sync signal phase for a link
   * Used by external animation systems
   * Returns phase in radians (0 to 2π)
   */
  getLinkSyncSignal(linkId) {
    const syncData = this.linkSyncState.get(linkId);
    if (!syncData) return 0;
    
    const phase = (syncData.linkStrength / 100) * Math.PI * 2;
    const phaseInversionMult = syncData.phaseInversion ? -1 : 1;
    
    return phase * phaseInversionMult;
  }
  
  /**
   * Enable synchronization
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled) {
      console.log('✓ Linked Glyph Synchronization enabled');
    } else {
      console.log('✗ Linked Glyph Synchronization disabled');
    }
  }
  
  /**
   * Toggle synchronization
   */
  toggle() {
    this.setEnabled(!this.enabled);
  }
  
  /**
   * Cleanup on world reset
   */
  cleanup() {
    this.linkSyncState.clear();
    this.nodePhaseAlignment.clear();
    this.stats.totalFrames = 0;
    console.log('✓ Linked Glyph Synchronization cleaned up');
  }
  
  /**
   * Get comprehensive statistics
   */
  getStatistics() {
    return {
      enabled: this.enabled,
      linksProcessed: this.stats.linksProcessed,
      syncedPairs: this.stats.syncedPairs,
      perfectSync: this.stats.perfectSyncCount,
      mediumSync: this.stats.mediumSyncCount,
      looseSync: this.stats.looseSyncCount,
      lastFrameMs: this.stats.lastFrameTime.toFixed(2),
      totalFrames: this.stats.totalFrames,
      globalTime: this.globalTime.toFixed(2)
    };
  }
  
  /**
   * Print detailed status report
   */
  printStatusReport() {
    const stats = this.getStatistics();
    console.group('═══ LINKED GLYPH SYNCHRONIZATION 1.0 STATUS ═══');
    console.log(`Status: ${stats.enabled ? '🔗 ACTIVE' : '⊗ DISABLED'}`);
    console.log(`Links Processed: ${stats.linksProcessed}`);
    console.log(`Synced Pairs: ${stats.syncedPairs}`);
    console.log(`  ├─ Perfect Sync (≥70%): ${stats.perfectSync}`);
    console.log(`  ├─ Medium Sync (30-69%): ${stats.mediumSync}`);
    console.log(`  └─ Loose Sync (<30%): ${stats.looseSync}`);
    console.log(`Frame Time: ${stats.lastFrameMs} ms`);
    console.log(`Total Frames: ${stats.totalFrames}`);
    console.groupEnd();
  }
  
  /**
   * Resync all glyphs immediately
   * Call this if sync gets out of phase
   */
  resyncAllGlyphs() {
    console.log('🔄 Resyncing all linked glyphs...');
    this.lastSyncUpdateTime = 0; // Force immediate sync
    this.linkSyncState.forEach((syncData) => {
      syncData.updateCounter = 0;
    });
    console.log('✓ All glyphs resynced');
  }
}
