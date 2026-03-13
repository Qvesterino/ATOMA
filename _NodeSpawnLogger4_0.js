/**
 * NODE SPAWN LOGGER v4.0 (SAFE MODE)
 * 
 * Ultra-safe logging + validation for all node spawns in ATOMA
 * Compatible with all existing emissive guards, category guards, and visual guards
 * 
 * Features:
 * - Performance-timestamped spawn tracking
 * - Category validation (detects undefined categories from timing races)
 * - Material type validation (ensures proper material classes)
 * - Position validation (catches NaN spawn coordinates)
 * - Evolution stage tracking
 * - Zero dependencies - safe for all environments
 */

export const NodeSpawnLogger = {
  enabled: true,
  sequence: 0,
  maxHistory: 100,
  history: [],

  /**
   * Log a node spawn event with full validation
   * New format: logSpawn({ category, visualCode, factoryName, nodeId, source })
   * Legacy format: logSpawn(node, category, position, source)
   * 
   * @param {Object|THREE.Object3D} paramsOrNode - Either spawn params object or node object
   * @param {string} category - Node category (legacy format only)
   * @param {THREE.Vector3} position - Spawn position (legacy format only)
   * @param {string} source - Spawn source
   */
  logSpawn(paramsOrNode, category, position, source = "unknown") {
    if (!this.enabled) return;
    try {

      const ts = (typeof performance !== 'undefined' && typeof performance.now === 'function')
        ? performance.now().toFixed(2)
        : Date.now().toString();
      if (typeof window !== 'undefined') {
        window.__SPAWN_LOG_HIT = (window.__SPAWN_LOG_HIT || 0) + 1;
        window.__SPAWN_LOG_LAST = paramsOrNode;
      }

      // Check if first argument is the new object format
      const isNewFormat = paramsOrNode && typeof paramsOrNode === 'object' && !paramsOrNode.isObject3D;
      
      if (isNewFormat) {
        // New simplified format: { category, visualCode, factoryName, nodeId, source }
        const { category: cat, visualCode, factoryName, nodeId, source: src } = paramsOrNode;
        const safeCategory = cat || "undefined";
        const safeVisualCode = visualCode !== undefined ? visualCode : "??";
        const safeFactoryName = factoryName || "unknown";
        const safeNodeId = nodeId || "??";
        const entry = {
          seq: ++this.sequence,
          ts,
          category: safeCategory,
          visualCode: safeVisualCode,
          factoryName: safeFactoryName,
          nodeId: safeNodeId,
          source: src || 'unknown'
        };
        this.history.push(entry);
        if (this.history.length > this.maxHistory) this.history.shift();
        if (typeof window !== 'undefined') {
          window.__ATOMA_SPAWN_LOG_HISTORY = this.history.slice();
        }
        
        // Print simplified one-line format
        console.info(
          `[Spawn#${entry.seq}] code=${safeVisualCode} cat=${safeCategory} factory=${safeFactoryName} id=${safeNodeId} src=${entry.source}`
        );
        return;
      }

      // Legacy format: logSpawn(node, category, position, source)
      const node = paramsOrNode;
      const safeCategory =
        category || node?.userData?.category || node?.category || "undefined";
      const actualSource = source || "unknown";

      console.error(
        `[Spawn ${ts}ms] Node ID: ${node?.uuid || node?.id || "??"} | Category: ${safeCategory} | Source: ${actualSource}`
      );
      console.groupCollapsed(
        `%c[Spawn ${ts}ms] Node ID: ${node?.uuid || node?.id || "??"} | Category: ${safeCategory} | Source: ${actualSource}`,
        "color:#7cf; font-weight:bold;"
      );

      console.log("• Raw node object:", node);

      // ========== VALIDATION 1: CATEGORY VALIDATION ==========
      if (safeCategory === "undefined") {
        console.warn(
          "%c[WARN] Node spawned with undefined category! AINodes.spawnNode() may be firing before presets are ready.",
          "color: orange; font-weight: bold;"
        );
      }

      // ========== VALIDATION 2: MATERIAL VALIDATION ==========
      let mat = null;
      if (node?.visual && node.visual.material) {
        mat = node.visual.material;
      } else if (node?.material) {
        mat = node.material;
      }

      if (!mat) {
        console.warn(
          "%c[WARN] No material detected on node — could cause invisible or corrupted geometry!",
          "color: orange; font-weight:bold;"
        );
      } else {
        console.error("• Material type:", mat.type || mat.constructor?.name);

        // Material safety validation
        const safeTypes = [
          "MeshStandardMaterial",
          "MeshBasicMaterial",
          "MeshLambertMaterial",
          "MeshPhongMaterial",
          "MeshToonMaterial",
          "LineBasicMaterial",
          "LineDashedMaterial"
        ];

        const materialType = mat.type || mat.constructor?.name;
        if (safeTypes.includes(materialType)) {
          console.log("• Material safe-class:", materialType);
        } else {
          console.warn(
            `%c[WARN] Node spawned with NON-standard material: ${materialType}`,
            "color: yellow; font-weight:bold;"
          );
        }

        // Emissive safety check
        if (mat.isLineBasicMaterial || mat.isLineDashedMaterial) {
          if (mat.emissive !== undefined) {
            console.warn(
              "%c[WARN] LineBasicMaterial has emissive property set (will be stripped by guard)",
              "color: yellow; font-weight:bold;"
            );
          } else {
            console.error("• Material emissive protection: ✅ (Line material, no emissive)");
          }
        } else if (mat.isMeshStandardMaterial || mat.isMeshLambertMaterial || mat.isMeshPhongMaterial) {
          if (mat.emissive) {
            console.error("• Emissive color:", `#${mat.emissive.getHexString()}`);
            console.error("• Emissive intensity:", mat.emissiveIntensity || 0);
          }
        }
      }

      // ========== VALIDATION 3: POSITION VALIDATION ==========
      if (position && (isNaN(position.x) || isNaN(position.y) || isNaN(position.z))) {
        console.warn(
          "%c[WARN] Spawn position contains NaN!",
          "color: red; font-weight:bold;"
        );
      } else if (position) {
        console.error(
          `• Position: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`
        );
      }

      // ========== VALIDATION 4: EVOLUTION STATE ==========
      if (node?.userData && node.userData.evolutionStage !== undefined) {
        console.error("• Evolution Stage:", node.userData.evolutionStage);
      }

      // ========== VALIDATION 5: CATEGORY PRESETS READY ==========
      if (node?.userData && node.userData.category) {
        console.error("• userData.category verified:", node.userData.category);
      }

      // ========== VALIDATION 6: NAMING SYSTEM ==========
      if (node?.userData && node.userData.namingCode) {
        console.error("• Naming Code:", node.userData.namingCode);
        if (node.userData.namingMeaning) {
          console.error("• Meaning:", node.userData.namingMeaning);
        }
      }

      // ========== SUMMARY ==========
      console.error("✅ Node spawn validation complete");

      console.groupEnd();
    } catch (err) {
      console.error('[NodeSpawnLogger] logSpawn error (logging skipped):', err?.message || err);
    }
  },

  /**
   * Enable/disable logging
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`[NodeSpawnLogger] Logging ${enabled ? "ENABLED" : "DISABLED"}`);
  },

  getRecent(limit = 20) {
    const size = Math.max(1, Number(limit) || 20);
    return this.history.slice(-size);
  },

  printRecent(limit = 20) {
    const rows = this.getRecent(limit);
    console.table(rows);
    return rows;
  },

  logBatchSummary(entries = [], source = 'unknown') {
    if (!this.enabled || !Array.isArray(entries) || entries.length === 0) return;

    const byCategory = {};
    const codes = [];

    for (const entry of entries) {
      const category = entry?.category || 'undefined';
      const visualCode = entry?.visualCode ?? '??';
      byCategory[category] = (byCategory[category] || 0) + 1;
      codes.push(`${category}:${visualCode}`);
    }

    const summary = Object.entries(byCategory)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([category, count]) => `${category}=${count}`)
      .join(', ');

    const batch = {
      total: entries.length,
      source,
      categories: byCategory,
      codes
    };
    if (typeof window !== 'undefined') {
      window.__ATOMA_SPAWN_BATCH_LAST = batch;
    }
    console.warn(
      `[SpawnBatch] total=${entries.length} src=${source} categories=[${summary}] codes=[${codes.join(', ')}]`
    );
    console.table(entries);
  },

  /**
   * Quick validation without full logging (faster)
   */
  validate(node, category, position) {
    const checks = {
      hasCategory: category && category !== "undefined",
      hasMaterial: !!(node.material || (node.visual && node.visual.material)),
      hasValidPosition: position && !isNaN(position.x) && !isNaN(position.y) && !isNaN(position.z),
      hasUserData: !!node.userData
    };

    const allValid = Object.values(checks).every(v => v);

    if (!allValid) {
      console.warn("[NodeSpawnLogger] Validation failed:", checks);
    }

    return allValid;
  }
};

// Global export for non-module environments
if (typeof window !== "undefined") {
  window.ATOMA_NODE_SPAWN_LOGGER = NodeSpawnLogger;
}
