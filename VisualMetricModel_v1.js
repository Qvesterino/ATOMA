import { getNodeCanonicalMetrics } from './SemanticMetricAdapter.js';

/**
 * ============================================================================
 * VISUAL METRIC MODEL v1.0
 * ============================================================================
 * Safe, non-invasive visual adapter layer that normalizes all metrics for shaders
 * 
 * PURPOSE:
 * - Reads from Phase 3 metrics (NodeDynamicMetrics, LinkQualityCalculator, NodeQualityCalculator)
 * - Normalizes all values to 0–1 shader-friendly range
 * - Writes normalized values to node.userData.visualMetrics and link.userData.visualMetrics
 * - Never modifies existing systems or metrics
 * - Purely additive read-only layer
 * 
 * RESPONSIBILITY:
 * - Compute normalized visual metrics once per frame for every node and link
 * - Use NodeDynamicMetrics, LinkQualityCalculator, NodeQualityCalculator as input sources
 * - Store results in node.userData.visualMetrics and link.userData.visualMetrics
 * - Apply safe optional chaining; no crashes if systems unavailable
 * - Never modify external systems
 * 
 * INTEGRATION:
 * const visualMetrics = new VisualMetricModel(
 *     aiNodes,
 *     linkingSystem,
 *     nodeDynamics,
 *     nodeQuality,
 *     linkQuality
 * );
 * 
 * UPDATE LOOP (in main game loop, once per frame after all metric systems):
 * visualMetrics.update(deltaTime);
 * 
 * READ ACCESS (from visual systems, shaders, VFX):
 * const visualMtx = node.userData.visualMetrics;
 * if (visualMtx) {
 *   const color = colorizeByQuality(visualMtx.qualityNorm, visualMtx.isPrime);
 *   const brightness = computeEmissive(visualMtx.harmonyNorm, visualMtx.energyNorm);
 * }
 * ============================================================================
 */

export class VisualMetricModel {
  /**
   * Initialize the visual metric model
   * @param {AINodes} aiNodes - Reference to the AINodes system
   * @param {NodeLinkingSystem} linkingSystem - Reference to the linking system
   * @param {NodeDynamicMetrics} nodeDynamics - Reference to node metrics (Phase 3.1)
   * @param {NodeQualityCalculator} nodeQuality - Reference to node quality (Phase 3.3)
   * @param {LinkQualityCalculator} linkQuality - Reference to link quality (Phase 3.2)
   * @param {Object} config - Optional configuration overrides
   */
  constructor(
    aiNodes,
    linkingSystem,
    nodeDynamics,
    nodeQuality,
    linkQuality,
    config = {}
  ) {
    // Store references
    this.aiNodes = aiNodes;
    this.linkingSystem = linkingSystem;
    this.nodeDynamics = nodeDynamics;
    this.nodeQuality = nodeQuality;
    this.linkQuality = linkQuality;

    // Configuration with sensible defaults
    this.config = {
      // Enabling specific normalizations
      enableNodeMetrics: config.enableNodeMetrics ?? true,
      enableLinkMetrics: config.enableLinkMetrics ?? true,

      // Safety timeouts
      maxFrameMs: config.maxFrameMs ?? 50, // Skip update if frame exceeds this

      // Quality level thresholds (for isPrime, isCritical flags)
      primeThreshold: config.primeThreshold ?? 85,
      criticalThreshold: config.criticalThreshold ?? 39,
    };

    // Internal tracking
    this.lastUpdateTime = 0;
    this.updateCount = 0;
    this.totalUpdateMs = 0;
  }

  /**
   * Main update cycle - call once per frame from game loop
   * Processes all nodes and links, normalizes metrics to 0–1 range
   * @param {number} deltaTime - Time elapsed since last frame (in seconds)
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;

    const startMs = performance.now();

    try {
      // Update nodes if enabled
      if (this.config.enableNodeMetrics) {
        this._updateNodeMetrics();
      }

      // Update links if enabled
      if (this.config.enableLinkMetrics) {
        this._updateLinkMetrics();
      }

      // Track performance
      const elapsedMs = performance.now() - startMs;
      this.totalUpdateMs += elapsedMs;
      this.updateCount++;

      // Safety check: warn if frame budget exceeded
      if (elapsedMs > this.config.maxFrameMs) {
        console.warn(
          `[VisualMetricModel] Frame budget exceeded: ${elapsedMs.toFixed(2)}ms (limit: ${this.config.maxFrameMs}ms)`
        );
      }
    } catch (err) {
      console.error("[VisualMetricModel] Update error:", err);
    }
  }

  /**
   * Update visual metrics for all nodes
   * @private
   */
  _updateNodeMetrics() {
    // Safety check: ensure systems exist
    if (!this.aiNodes || !this.aiNodes.nodes) {
      return;
    }

    const now = Date.now();

    // Iterate all nodes and extract/normalize metrics
    for (const node of this.aiNodes.nodes) {
      if (!node) continue;

      // Initialize userData if needed (defensive)
      if (!node.userData) {
        node.userData = {};
      }

      // Extract metrics from source systems
      try {
        const extractedMetrics = this._extractNodeMetrics(node);

        // Create normalized visual metrics object
        node.userData.visualMetrics = {
          // Normalized 0–1 values for all metrics
          synergyNorm: extractedMetrics.synergyNorm,
          stabilityNorm: extractedMetrics.stabilityNorm,
          harmonyNorm: extractedMetrics.harmonyNorm,
          corruptionNorm: extractedMetrics.corruptionNorm,
          energyNorm: extractedMetrics.energyNorm,
          clarityNorm: extractedMetrics.clarityNorm,
          instabilityNorm: extractedMetrics.instabilityNorm,
          loadNorm: extractedMetrics.loadNorm,
          qualityNorm: extractedMetrics.qualityNorm,

          // Boolean flags for critical visual states
          isPrime: extractedMetrics.isPrime,
          isCritical: extractedMetrics.isCritical,

          // Timestamp for debugging
          updatedAt: now,
        };
      } catch (err) {
        // Skip this node on error, but continue processing others
        console.warn(`[VisualMetricModel] Node extraction error:`, err);
      }
    }
  }

  /**
   * Update visual metrics for all links
   * @private
   */
  _updateLinkMetrics() {
    // Safety check: ensure systems exist
    if (!this.linkingSystem || !this.linkingSystem.links) {
      return;
    }

    const now = Date.now();

    // Iterate all links and extract/normalize metrics
    for (const link of this.linkingSystem.links) {
      if (!link) continue;

      // Initialize userData if needed (defensive)
      if (!link.userData) {
        link.userData = {};
      }

      // Extract metrics from source systems
      try {
        const extractedMetrics = this._extractLinkMetrics(link);

        // Create normalized visual metrics object
        link.userData.visualMetrics = {
          // Normalized 0–1 values
          qualityNorm: extractedMetrics.qualityNorm,
          stressNorm: extractedMetrics.stressNorm,

          // Timestamp for debugging
          updatedAt: now,
        };
      } catch (err) {
        // Skip this link on error, but continue processing others
        console.warn(`[VisualMetricModel] Link extraction error:`, err);
      }
    }
  }

  /**
   * Extract and normalize all node metrics from Phase 3 sources
   * @private
   * @returns {Object} Normalized metrics object with all 0–1 values
   */
  _extractNodeMetrics(node) {
    // Start with safe defaults
    const result = {
      synergyNorm: 0.5,
      stabilityNorm: 0.5,
      harmonyNorm: 0.5,
      corruptionNorm: 0,
      energyNorm: 0.5,
      clarityNorm: 0.5,
      instabilityNorm: 0.5,
      loadNorm: 0,
      qualityNorm: 0.5,
      isPrime: false,
      isCritical: false,
    };

    // ========== SOURCE 1: NodeDynamicMetrics via semantic adapter ==========
    const nodeDynamicMetrics = node.userData?.metrics;
    const canonicalMetrics = getNodeCanonicalMetrics(node);
    const hasDynamicMetrics = !!nodeDynamicMetrics;

    if (nodeDynamicMetrics) {
      // All dynamic metrics are 0–100 scale, normalize to 0–1
      result.stabilityNorm = this._clamp01(nodeDynamicMetrics.stability / 100);
      result.harmonyNorm = this._clamp01(nodeDynamicMetrics.harmony / 100);
      result.corruptionNorm = this._clamp01(nodeDynamicMetrics.corruption / 100);
      result.energyNorm = this._clamp01(nodeDynamicMetrics.energyNorm); // Already 0–1
      result.clarityNorm = this._clamp01(nodeDynamicMetrics.clarity / 100);
      result.instabilityNorm = this._clamp01(nodeDynamicMetrics.instability / 100);
      result.loadNorm = this._clamp01(nodeDynamicMetrics.loadRatio); // Already 0–1

      // Synergy: use harmony as proxy for synergy (connected harmony)
      result.synergyNorm = this._clamp01(
        (nodeDynamicMetrics.harmony * 0.6 + nodeDynamicMetrics.stability * 0.4) /
          100
      );
    } else {
      // Fallback to canonical metrics (normalize 0–100 → 0–1 if needed)
      const normalize = (value, fallback) => {
        if (value === undefined) return fallback;
        return value > 1 ? value / 100 : value;
      };

      result.synergyNorm = this._clamp01(normalize(canonicalMetrics.synergy, result.synergyNorm));
      result.stabilityNorm = this._clamp01(normalize(canonicalMetrics.stability, result.stabilityNorm));
      result.harmonyNorm = this._clamp01(normalize(canonicalMetrics.harmony, result.harmonyNorm));
      result.corruptionNorm = this._clamp01(normalize(canonicalMetrics.corruption, result.corruptionNorm));
      result.loadNorm = this._clamp01(normalize(canonicalMetrics.loadPressure, result.loadNorm));
      result.energyNorm = this._clamp01(normalize(canonicalMetrics.loadPressure, result.energyNorm));
    }

    // ========== SOURCE 2: NodeQualityCalculator ==========
    // Read-only access from node.userData.quality
    const nodeQualityData = node.userData?.quality;

    if (nodeQualityData) {
      // Quality score is 0–100 scale, normalize to 0–1
      result.qualityNorm = this._clamp01(nodeQualityData.score / 100);

      // Extract boolean quality level flags
      if (nodeQualityData.level) {
        result.isPrime = nodeQualityData.level === "Prime";
        result.isCritical = nodeQualityData.level === "Critical";
      }
    }

    // Safety: ensure all values are valid
    this._validateMetrics(result);

    return result;
  }

  /**
   * Extract and normalize all link metrics from Phase 3 sources
   * @private
   * @returns {Object} Normalized metrics object with all 0–1 values
   */
  _extractLinkMetrics(link) {
    // Start with safe defaults
    const result = {
      qualityNorm: 0.5,
      stressNorm: 0.5,
    };

    // ========== SOURCE: LinkQualityCalculator ==========
    // Read-only access from link.userData.quality
    const linkQualityData = link.userData?.quality;

    if (linkQualityData) {
      // Quality score is 0–100 scale, normalize to 0–1
      result.qualityNorm = this._clamp01(linkQualityData.score / 100);

      // Compute stress as inverse of structural quality
      // structuralScore is 0–100, so stress is 100 - structuralScore
      const structuralScore = linkQualityData.structuralScore ?? 80;
      const stressRaw = 100 - structuralScore;
      result.stressNorm = this._clamp01(stressRaw / 100);
    }

    // Safety: ensure all values are valid
    this._validateMetrics(result);

    return result;
  }

  /**
   * Normalize a value from 0–100 scale to 0–1
   * Clamps to [0, 1] range
   * @private
   */
  _norm100(x) {
    return this._clamp01(x / 100);
  }

  /**
   * Clamp value to [0, 1] range
   * Handles NaN, Infinity, and invalid values
   * @private
   */
  _clamp01(x) {
    // Handle NaN and Infinity
    if (!isFinite(x)) {
      return 0.5; // Default to middle value
    }

    // Clamp to [0, 1]
    return Math.max(0, Math.min(1, x));
  }

  /**
   * Validate metrics object to ensure no NaN or Infinity values
   * Repairs invalid values in-place
   * @private
   */
  _validateMetrics(metrics) {
    for (const [key, value] of Object.entries(metrics)) {
      if (typeof value === "number") {
        // Check for NaN or Infinity
        if (!isFinite(value)) {
          // Repair with safe default
          if (key.endsWith("Norm")) {
            metrics[key] = 0.5; // Middle value for normalized metrics
          } else if (key.startsWith("is")) {
            metrics[key] = false; // Default boolean flags to false
          } else {
            metrics[key] = 0;
          }
        }
      }
    }
  }

  /**
   * Get performance statistics
   * Useful for debugging and optimization
   * @returns {Object} Stats including average frame time
   */
  getPerformanceStats() {
    const avgMs = this.updateCount > 0 ? this.totalUpdateMs / this.updateCount : 0;

    return {
      updateCount: this.updateCount,
      totalUpdateMs: this.totalUpdateMs,
      averageFrameMs: avgMs,
      maxFrameBudgetMs: this.config.maxFrameMs,
      budgetUsagePercent: ((avgMs / this.config.maxFrameMs) * 100).toFixed(1),
    };
  }

  /**
   * Reset performance tracking
   */
  resetPerformanceStats() {
    this.updateCount = 0;
    this.totalUpdateMs = 0;
  }

  /**
   * Get visual metrics for a specific node (for debugging)
   * @returns {Object|null} Visual metrics or null if node not found
   */
  getNodeVisualMetrics(node) {
    if (!node || !node.userData) {
      return null;
    }

    return node.userData.visualMetrics ?? null;
  }

  /**
   * Get visual metrics for a specific link (for debugging)
   * @returns {Object|null} Visual metrics or null if link not found
   */
  getLinkVisualMetrics(link) {
    if (!link || !link.userData) {
      return null;
    }

    return link.userData.visualMetrics ?? null;
  }

  /**
   * Check if all systems are properly initialized
   * Useful for debugging initialization order
   * @returns {Object} Status report for each system
   */
  getSystemStatus() {
    return {
      aiNodes: !!this.aiNodes,
      linkingSystem: !!this.linkingSystem,
      nodeDynamics: !!this.nodeDynamics,
      nodeQuality: !!this.nodeQuality,
      linkQuality: !!this.linkQuality,
      allReady:
        !!this.aiNodes &&
        !!this.linkingSystem &&
        !!this.nodeDynamics &&
        !!this.nodeQuality &&
        !!this.linkQuality,
    };
  }
}

export default VisualMetricModel;
