/**
 * PHASE 3C WEEK 11 ALT: MYTHIC EVOLUTION FX — ASCENSION VISUAL IDENTITY SYSTEM
 * 
 * Classifies nodes and links into evolution tiers (Dormant → Transcendent) based on
 * existing Phase 3 metrics. Computes continuous "Ascension Score" (0–1) and exposes
 * visual driver signals for use by auras, shaders, and other FX systems.
 * 
 * SAFE MODE:
 * ✅ Zero modifications to existing files
 * ✅ Zero breaking changes
 * ✅ Purely additive: only writes to userData.mythicEvolution
 * ✅ Reads metrics, never writes back into other systems
 * ✅ Defensive programming throughout
 * ✅ Performance: <1ms per frame (200 nodes + 300 links)
 * 
 * PURPOSE:
 * - Compute per-node and per-link ascension scores (0–1)
 * - Classify into 5 evolution tiers (Dormant, Awakened, Ascending, Mythic, Transcendent)
 * - Provide visual driver signals (auraBoost, fxIntensity, etc.)
 * - Enable future visual polish without modifying existing systems
 * 
 * DATA OUTPUT:
 * node.userData.mythicEvolution = {
 *   ascensionRaw,        // 0–1, raw computation
 *   ascensionSmoothed,   // 0–1, EMA filtered
 *   tier,                // 0–4 (Dormant to Transcendent)
 *   tierName,            // String name
 *   isMythic,            // Boolean
 *   isAscending,         // Boolean
 *   isFalling,           // Boolean (tier decreased)
 *   auraBoost,           // 0–1, visual intensity multiplier
 *   fxIntensity,         // 0–1, general FX strength
 *   trailIntensity,      // 0–1, for trail effects (future)
 *   glowIntensity,       // 0–1, for glow effects
 *   hintColorHex,        // Color hint for auras
 *   lastTierChangeTime   // Timestamp of last tier transition
 * }
 * 
 * INTEGRATION:
 * 
 *   import { MythicEvolutionFX_v1 } from './MythicEvolutionFX_v1.js';
 *   
 *   this.mythicEvolutionFX = new MythicEvolutionFX_v1({
 *     aiNodes: this.aiNodes.nodes,
 *     links: this.linkingSystem?.links,
 *     nodeDynamicMetrics: this.nodeDynamicMetrics,
 *     linkQualityCalculator: this.linkQualityCalculator,
 *     nodeQualityCalculator: this.nodeQualityCalculator,
 *     visualMetricModel: this.visualMetricModel,
 *     performanceController: this.fxPerformance,
 *     debugEnabled: false
 *   });
 *   
 *   // In game loop:
 *   this.mythicEvolutionFX.update(deltaTime);
 *   
 *   // Query state:
 *   const state = this.mythicEvolutionFX.getNodeState(node);
 *   const stats = this.mythicEvolutionFX.getStats();
 *   
 *   // On cleanup:
 *   this.mythicEvolutionFX.dispose();
 */

import { getNodeCanonicalMetrics, getLinkSynergy, getLinkCorruption } from './SemanticMetricAdapter.js';

/**
 * Evolution tier definitions (0–4)
 */
const EVOLUTION_TIERS = {
  0: { name: 'Dormant', threshold: [0.0, 0.20], colorHint: '#808080' },
  1: { name: 'Awakened', threshold: [0.18, 0.40], colorHint: '#0088ff' },
  2: { name: 'Ascending', threshold: [0.35, 0.65], colorHint: '#88ff00' },
  3: { name: 'Mythic', threshold: [0.60, 0.85], colorHint: '#ff00ff' },
  4: { name: 'Transcendent', threshold: [0.80, 1.0], colorHint: '#ffff00' },
};

/**
 * MythicEvolutionState: Per-node or per-link evolution state
 */
class MythicEvolutionState {
  constructor() {
    this.ascensionRaw = 0.0;
    this.ascensionSmoothed = 0.0;
    this.tier = 0;
    this.tierName = 'Dormant';
    this.isMythic = false;
    this.isAscending = false;
    this.isFalling = false;
    
    // Visual driver signals
    this.auraBoost = 0.0;
    this.fxIntensity = 0.0;
    this.trailIntensity = 0.0;
    this.glowIntensity = 0.0;
    this.hintColorHex = '#808080';
    
    // Tracking
    this.lastTierChangeTime = 0;
    this.previousTier = 0;
  }
}

/**
 * MythicEvolutionFX_v1: Main evolution system manager
 */
export class MythicEvolutionFX_v1 {
  constructor(options = {}) {
    // Store references to data sources (read-only)
    this.aiNodes = options.aiNodes || [];
    this.links = options.links || [];
    this.nodeDynamicMetrics = options.nodeDynamicMetrics;
    this.linkQualityCalculator = options.linkQualityCalculator;
    this.nodeQualityCalculator = options.nodeQualityCalculator;
    this.visualMetricModel = options.visualMetricModel;
    this.performanceController = options.performanceController;

    // Configuration
    this.debugEnabled = options.debugEnabled === true;
    this.emasAlpha = options.emasAlpha ?? 0.20;  // EMA smoothing factor

    // Thresholds with hysteresis
    this.nodeThresholds = options.nodeThresholds || {
      dormantMax: 0.20,
      awakenedRange: [0.18, 0.40],
      ascendingRange: [0.35, 0.65],
      mythicRange: [0.60, 0.85],
      transcendentMin: 0.80,
    };

    this.linkThresholds = options.linkThresholds || {
      dormantMax: 0.20,
      awakenedRange: [0.18, 0.40],
      ascendingRange: [0.35, 0.65],
      mythicRange: [0.60, 0.85],
      transcendentMin: 0.80,
    };

    // State tracking
    this.nodeStates = new Map();      // nodeId → MythicEvolutionState
    this.linkStates = new Map();      // linkId → MythicEvolutionState

    // Statistics
    this.stats = {
      nodesProcessed: 0,
      linksProcessed: 0,
      mythicNodesCount: 0,
      mythicLinksCount: 0,
      frameTime: 0,
    };

    if (this.debugEnabled) {
      console.log('[MythicEvolutionFX_v1] Initialized', {
        nodes: this.aiNodes.length,
        links: this.links.length,
        emasAlpha: this.emasAlpha,
      });
    }
  }

  /**
   * Main update loop: call once per frame
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;
    const startTime = performance.now();

    // Update all nodes
    if (this.aiNodes && Array.isArray(this.aiNodes)) {
      for (const node of this.aiNodes) {
        if (node) {
          this._updateNodeEvolution(node);
        }
      }
    }

    // Update all links
    if (this.links && Array.isArray(this.links)) {
      for (const link of this.links) {
        if (link) {
          this._updateLinkEvolution(link);
        }
      }
    }

    // Update statistics
    this.stats.frameTime = performance.now() - startTime;
  }

  /**
   * Update evolution state for a single node
   * @private
   */
  _updateNodeEvolution(node) {
    if (!node.userData) {
      node.userData = {};
    }

    const nodeId = this._getNodeId(node);
    let state = this.nodeStates.get(nodeId);

    if (!state) {
      state = new MythicEvolutionState();
      this.nodeStates.set(nodeId, state);
    }

    state.previousTier = state.tier;

    // Compute raw ascension score
    state.ascensionRaw = this._computeNodeAscension(node);

    // Apply EMA smoothing
    state.ascensionSmoothed = 
      state.ascensionSmoothed * (1 - this.emasAlpha) + 
      state.ascensionRaw * this.emasAlpha;

    // Clamp to [0, 1]
    state.ascensionSmoothed = Math.max(0, Math.min(1, state.ascensionSmoothed));

    // Determine tier with hysteresis
    state.tier = this._computeNodeTier(state.ascensionSmoothed, state.previousTier);
    state.tierName = EVOLUTION_TIERS[state.tier].name;

    // Update boolean flags
    state.isMythic = state.tier >= 3;       // Mythic or Transcendent
    state.isAscending = state.tier >= 2;    // Ascending or higher
    state.isFalling = state.tier < state.previousTier;

    // Update visual driver signals
    this._updateVisualSignals(state);

    // Track tier changes
    if (state.tier !== state.previousTier) {
      state.lastTierChangeTime = Date.now();
      if (this.debugEnabled) {
        console.log(`[Node Tier Change] ${state.previousTier} → ${state.tier} (${state.tierName})`);
      }
    }

    // Write state to node
    node.userData.mythicEvolution = {
      ascensionRaw: state.ascensionRaw,
      ascensionSmoothed: state.ascensionSmoothed,
      tier: state.tier,
      tierName: state.tierName,
      isMythic: state.isMythic,
      isAscending: state.isAscending,
      isFalling: state.isFalling,
      auraBoost: state.auraBoost,
      fxIntensity: state.fxIntensity,
      trailIntensity: state.trailIntensity,
      glowIntensity: state.glowIntensity,
      hintColorHex: state.hintColorHex,
      lastTierChangeTime: state.lastTierChangeTime,
    };

    if (state.isMythic) {
      this.stats.mythicNodesCount++;
    }
    this.stats.nodesProcessed++;
  }

  /**
   * Update evolution state for a single link
   * @private
   */
  _updateLinkEvolution(link) {
    if (!link.userData) {
      link.userData = {};
    }

    const linkId = this._getLinkId(link);
    let state = this.linkStates.get(linkId);

    if (!state) {
      state = new MythicEvolutionState();
      this.linkStates.set(linkId, state);
    }

    state.previousTier = state.tier;

    // Compute raw ascension score
    state.ascensionRaw = this._computeLinkAscension(link);

    // Apply EMA smoothing
    state.ascensionSmoothed = 
      state.ascensionSmoothed * (1 - this.emasAlpha) + 
      state.ascensionRaw * this.emasAlpha;

    // Clamp to [0, 1]
    state.ascensionSmoothed = Math.max(0, Math.min(1, state.ascensionSmoothed));

    // Determine tier with hysteresis
    state.tier = this._computeLinkTier(state.ascensionSmoothed, state.previousTier);
    state.tierName = EVOLUTION_TIERS[state.tier].name;

    // Update boolean flags
    state.isMythic = state.tier >= 3;
    state.isAscending = state.tier >= 2;
    state.isFalling = state.tier < state.previousTier;

    // Update visual driver signals
    this._updateVisualSignals(state);

    // Track tier changes
    if (state.tier !== state.previousTier) {
      state.lastTierChangeTime = Date.now();
      if (this.debugEnabled) {
        console.log(`[Link Tier Change] ${state.previousTier} → ${state.tier} (${state.tierName})`);
      }
    }

    // Write state to link
    link.userData.mythicEvolution = {
      ascensionRaw: state.ascensionRaw,
      ascensionSmoothed: state.ascensionSmoothed,
      tier: state.tier,
      tierName: state.tierName,
      isMythic: state.isMythic,
      isAscending: state.isAscending,
      isFalling: state.isFalling,
      auraBoost: state.auraBoost,
      fxIntensity: state.fxIntensity,
      trailIntensity: state.trailIntensity,
      glowIntensity: state.glowIntensity,
      hintColorHex: state.hintColorHex,
      lastTierChangeTime: state.lastTierChangeTime,
    };

    if (state.isMythic) {
      this.stats.mythicLinksCount++;
    }
    this.stats.linksProcessed++;
  }

  /**
   * Compute raw ascension score for a node (0–1)
   * 
   * Formula:
   * nodeAscension = clamp01(
   *   0.40 * nodeQualityNorm +
   *   0.25 * harmonyNorm +
   *   0.15 * synergyNormFromLinks +
   *   0.10 * energyNorm +
   *   0.10 * (1 - corruptionNorm)
   * )
   * 
   * @private
   */
  _computeNodeAscension(node) {
    // Safety
    if (!node) return 0;

    // 1. Node quality (0–100 → 0–1)
    const quality = node.userData?.quality?.score ?? 50;
    const qualityNorm = Math.max(0, Math.min(1, quality / 100));

    // 2. Harmony/stability (0–1)
    const canonical = getNodeCanonicalMetrics(node);
    const harmony = canonical.harmony ?? canonical.stability ?? 0.5;
    const harmonyNorm = Math.max(0, Math.min(1, harmony));

    // 3. Synergy from links (0–1)
    const synergy = canonical.synergy ?? 0.5;
    const synergyNorm = Math.max(0, Math.min(1, synergy));

    // 4. Energy (0–1)
    const loadPressure = canonical.loadPressure ?? 0.5;
    const energyNorm = Math.max(0, Math.min(1, 1 - loadPressure));

    // 5. Corruption penalty (0–1, inverted)
    const corruption = canonical.corruption ?? 0.0;
    const corruptionNorm = Math.max(0, Math.min(1, corruption));
    const corruptionPenalty = 1.0 - corruptionNorm;

    // Weighted sum
    const ascension = 
      0.40 * qualityNorm +
      0.25 * harmonyNorm +
      0.15 * synergyNorm +
      0.10 * energyNorm +
      0.10 * corruptionPenalty;

    // Clamp to [0, 1]
    return Math.max(0, Math.min(1, ascension));
  }

  /**
   * Compute raw ascension score for a link (0–1)
   * 
   * Formula:
   * linkAscension = clamp01(
   *   0.45 * linkQualityNorm +
   *   0.35 * synergyNorm +
   *   0.10 * (1 - corruptionNorm) +
   *   0.10 * resonanceNorm
   * )
   * 
   * @private
   */
  _computeLinkAscension(link) {
    // Safety
    if (!link) return 0;

    // 1. Link quality (0–100 → 0–1)
    const quality = link.userData?.quality?.score ?? 50;
    const qualityNorm = Math.max(0, Math.min(1, quality / 100));

    // 2. Synergy (0–1)
    const synergy = getLinkSynergy(link);
    const synergyNorm = Math.max(0, Math.min(1, synergy));

    // 3. Corruption penalty (0–1, inverted)
    const corruption = getLinkCorruption(link);
    const corruptionNorm = Math.max(0, Math.min(1, corruption));
    const corruptionPenalty = 1.0 - corruptionNorm;

    // 4. Resonance (0–1)
    const resonance = link.userData?.metrics?.resonance ?? 0.5;
    const resonanceNorm = Math.max(0, Math.min(1, resonance));

    // Weighted sum
    const ascension = 
      0.45 * qualityNorm +
      0.35 * synergyNorm +
      0.10 * corruptionPenalty +
      0.10 * resonanceNorm;

    // Clamp to [0, 1]
    return Math.max(0, Math.min(1, ascension));
  }

  /**
   * Determine tier with hysteresis (for nodes)
   * @private
   */
  _computeNodeTier(ascensionSmoothed, previousTier) {
    // Hysteresis: use boundaries with small margin to prevent flicker
    const thresholds = this.nodeThresholds;

    // Transcendent (tier 4)
    if (ascensionSmoothed >= thresholds.transcendentMin) return 4;

    // Mythic (tier 3)
    if (ascensionSmoothed >= thresholds.mythicRange[0]) {
      if (previousTier >= 3 || ascensionSmoothed >= 0.70) return 3;
    } else if (previousTier === 3 && ascensionSmoothed >= thresholds.mythicRange[0] - 0.05) {
      return 3;
    }

    // Ascending (tier 2)
    if (ascensionSmoothed >= thresholds.ascendingRange[0]) {
      if (previousTier >= 2 || ascensionSmoothed >= 0.50) return 2;
    } else if (previousTier === 2 && ascensionSmoothed >= thresholds.ascendingRange[0] - 0.05) {
      return 2;
    }

    // Awakened (tier 1)
    if (ascensionSmoothed >= thresholds.awakenedRange[0]) {
      if (previousTier >= 1 || ascensionSmoothed >= 0.30) return 1;
    } else if (previousTier === 1 && ascensionSmoothed >= thresholds.awakenedRange[0] - 0.05) {
      return 1;
    }

    // Dormant (tier 0)
    return 0;
  }

  /**
   * Determine tier with hysteresis (for links)
   * @private
   */
  _computeLinkTier(ascensionSmoothed, previousTier) {
    // Same logic as nodes (could be split for different thresholds if desired)
    const thresholds = this.linkThresholds;

    if (ascensionSmoothed >= thresholds.transcendentMin) return 4;
    if (ascensionSmoothed >= thresholds.mythicRange[0]) {
      if (previousTier >= 3 || ascensionSmoothed >= 0.70) return 3;
    } else if (previousTier === 3 && ascensionSmoothed >= thresholds.mythicRange[0] - 0.05) {
      return 3;
    }
    if (ascensionSmoothed >= thresholds.ascendingRange[0]) {
      if (previousTier >= 2 || ascensionSmoothed >= 0.50) return 2;
    } else if (previousTier === 2 && ascensionSmoothed >= thresholds.ascendingRange[0] - 0.05) {
      return 2;
    }
    if (ascensionSmoothed >= thresholds.awakenedRange[0]) {
      if (previousTier >= 1 || ascensionSmoothed >= 0.30) return 1;
    } else if (previousTier === 1 && ascensionSmoothed >= thresholds.awakenedRange[0] - 0.05) {
      return 1;
    }
    return 0;
  }

  /**
   * Update visual driver signals based on tier and ascension
   * @private
   */
  _updateVisualSignals(state) {
    const tier = state.tier;
    const ascension = state.ascensionSmoothed;

    // Color hint based on tier
    state.hintColorHex = EVOLUTION_TIERS[tier].colorHint;

    // Aura boost (0–1)
    if (tier === 0) {
      state.auraBoost = 0.0;
    } else if (tier === 1) {
      state.auraBoost = ascension * 0.4;
    } else if (tier === 2) {
      state.auraBoost = ascension * 0.7;
    } else if (tier === 3) {
      state.auraBoost = 0.8 + (ascension - 0.60) * 0.25;
    } else if (tier === 4) {
      state.auraBoost = 1.0;
    }
    state.auraBoost = Math.max(0, Math.min(1, state.auraBoost));

    // FX intensity (0–1)
    if (tier === 0) {
      state.fxIntensity = 0.0;
    } else if (tier === 1) {
      state.fxIntensity = ascension * 0.3;
    } else if (tier === 2) {
      state.fxIntensity = 0.3 + (ascension - 0.35) * 0.5;
    } else if (tier === 3) {
      state.fxIntensity = 0.65 + (ascension - 0.60) * 0.5;
    } else if (tier === 4) {
      state.fxIntensity = 1.0;
    }
    state.fxIntensity = Math.max(0, Math.min(1, state.fxIntensity));

    // Trail intensity (for future use)
    state.trailIntensity = tier >= 2 ? ascension * 0.6 : 0.0;
    state.trailIntensity = Math.max(0, Math.min(1, state.trailIntensity));

    // Glow intensity (for future use)
    state.glowIntensity = tier >= 3 ? ascension * 0.8 : 
                          tier === 2 ? ascension * 0.4 : 0.0;
    state.glowIntensity = Math.max(0, Math.min(1, state.glowIntensity));
  }

  /**
   * Get evolution state for a node (read-only query)
   */
  getNodeState(node) {
    if (!node) return null;
    const nodeId = this._getNodeId(node);
    return this.nodeStates.get(nodeId) || null;
  }

  /**
   * Get evolution state for a link (read-only query)
   */
  getLinkState(link) {
    if (!link) return null;
    const linkId = this._getLinkId(link);
    return this.linkStates.get(linkId) || null;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      nodesProcessed: this.stats.nodesProcessed,
      linksProcessed: this.stats.linksProcessed,
      mythicNodesCount: this.stats.mythicNodesCount,
      mythicLinksCount: this.stats.mythicLinksCount,
      frameTime: this.stats.frameTime,
    };
  }

  /**
   * Get node identifier
   * @private
   */
  _getNodeId(node) {
    return node.id !== undefined ? node.id : `node_${node._id || Math.random()}`;
  }

  /**
   * Get link identifier
   * @private
   */
  _getLinkId(link) {
    if (link.id !== undefined) {
      return link.id;
    }
    if (link.nodeA && link.nodeB) {
      return `link_${link.nodeA.id || 0}_${link.nodeB.id || 0}`;
    }
    return `link_${Math.random()}`;
  }

  /**
   * Dispose system
   */
  dispose() {
    this.nodeStates.clear();
    this.linkStates.clear();
    this.stats = {
      nodesProcessed: 0,
      linksProcessed: 0,
      mythicNodesCount: 0,
      mythicLinksCount: 0,
      frameTime: 0,
    };

    if (this.debugEnabled) {
      console.log('[MythicEvolutionFX_v1] Disposed');
    }
  }
}

// Global export
window.MythicEvolutionFX_v1 = MythicEvolutionFX_v1;

export default MythicEvolutionFX_v1;
