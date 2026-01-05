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

  /**
   * Log a node spawn event with full validation
   * @param {THREE.Object3D} node - The spawned node object
   * @param {string} category - Node category (input, process, error, mythic, etc.)
   * @param {THREE.Vector3} position - Spawn position
   */
  logSpawn(node, category, position) {
    if (!this.enabled) return;

    const ts = performance.now().toFixed(2);

    const safeCategory =
      category || node?.userData?.category || node?.category || "undefined";

    console.groupCollapsed(
      `%c[Spawn ${ts}ms] Node ID: ${node.uuid || node.id || "??"} | Category: ${safeCategory}`,
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
    if (node.visual && node.visual.material) {
      mat = node.visual.material;
    } else if (node.material) {
      mat = node.material;
    }

    if (!mat) {
      console.warn(
        "%c[WARN] No material detected on node — could cause invisible or corrupted geometry!",
        "color: orange; font-weight:bold;"
      );
    } else {
      console.log("• Material type:", mat.type || mat.constructor.name);

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

      const materialType = mat.type || mat.constructor.name;
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
          console.log("• Material emissive protection: ✅ (Line material, no emissive)");
        }
      } else if (mat.isMeshStandardMaterial || mat.isMeshLambertMaterial || mat.isMeshPhongMaterial) {
        if (mat.emissive) {
          console.log("• Emissive color:", `#${mat.emissive.getHexString()}`);
          console.log("• Emissive intensity:", mat.emissiveIntensity || 0);
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
      console.log(
        `• Position: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`
      );
    }

    // ========== VALIDATION 4: EVOLUTION STATE ==========
    if (node.userData && node.userData.evolutionStage !== undefined) {
      console.log("• Evolution Stage:", node.userData.evolutionStage);
    }

    // ========== VALIDATION 5: CATEGORY PRESETS READY ==========
    if (node.userData && node.userData.category) {
      console.log("• userData.category verified:", node.userData.category);
    }

    // ========== VALIDATION 6: NAMING SYSTEM ==========
    if (node.userData && node.userData.namingCode) {
      console.log("• Naming Code:", node.userData.namingCode);
      if (node.userData.namingMeaning) {
        console.log("• Meaning:", node.userData.namingMeaning);
      }
    }

    // ========== SUMMARY ==========
    console.log("✅ Node spawn validation complete");

    console.groupEnd();
  },

  /**
   * Enable/disable logging
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`[NodeSpawnLogger] Logging ${enabled ? "ENABLED" : "DISABLED"}`);
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
