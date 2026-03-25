/**
 * CorruptionDesaturationIntegrationPatch.js
 * ============================================================================
 * INTEGRATION PATCH FOR CORRUPTION VISUAL DESATURATION
 * 
 * Visually desaturates corrupted parts of the network.
 * Connects corruption metric with color desaturation.
 * 
 * @author VFX Technical Director — ATOMA Project
 * @version 1.0.0
 */

import * as THREE from 'three';

function getConduitLinkMaterials(link) {
  const materials = [];
  const conduitState = link?.group?.userData?.conduitState;

  if (conduitState?.skinMesh?.material) {
    materials.push(conduitState.skinMesh.material);
  }

  if (Array.isArray(conduitState?.strands)) {
    for (const strand of conduitState.strands) {
      if (strand?.material) {
        materials.push(strand.material);
      }
    }
  }

  if (!materials.length && link?.material) {
    const legacyMaterials = Array.isArray(link.material) ? link.material : [link.material];
    for (const material of legacyMaterials) {
      if (material) materials.push(material);
    }
  }

  return [...new Set(materials)];
}

/**
 * Apply corruption desaturation integration
 * 
 * This function applies visual desaturation to nodes and links based on their corruption level.
 * 
 * @param {Object} scene - THREE.Scene
 * @param {Array} nodes - Array of node objects
 * @param {Array} links - Array of link objects
 * @param {Object} config - Configuration options
 * 
 * Integration points:
 * - For each node/link: calculates corruption from userData.metrics.corruption
 * - Applies color desaturation: material.color.lerp(neutral gray, corruption * 0.7)
 * - Preserves original color as base
 */
export function applyCorruptionDesaturationIntegration(scene, nodes = [], links = [], config = {}) {
  if (!scene) {
    console.error('[CorruptionDesaturationIntegration] scene parameter is required');
    return;
  }

  const configOptions = {
    desaturationStrength: config.desaturationStrength ?? 0.7,
    neutralColor: config.neutralColor ?? new THREE.Color(0.5, 0.5, 0.5),
    updateInterval: config.updateInterval ?? 0.1, // Update every 0.1 seconds
    enabled: config.enabled ?? true,
    debugMode: config.debugMode ?? false,
  };

  // Store original colors for preservation
  const originalNodeColors = new Map();
  const originalLinkColors = new Map();

  // Store original colors
  for (const node of nodes) {
    if (node.material && node.material.color) {
      originalNodeColors.set(node.id, node.material.color.clone());
    }
  }

  for (const link of links) {
    const materials = getConduitLinkMaterials(link);
    if (!materials.length) continue;

    const snapshots = [];
    for (const material of materials) {
      if (material?.color) {
        snapshots.push({ material, color: material.color.clone() });
      }
    }

    if (snapshots.length) {
      originalLinkColors.set(link.id, snapshots);
    }
  }

  /**
   * Update node colors based on corruption
   */
  function updateNodeColors() {
    for (const node of nodes) {
      if (!node || !node.userData) continue;

      const corruption = node.userData.metrics?.corruption ?? node.userData?.corruption ?? 0;
      
      // Get original color (base)
      const originalColor = originalNodeColors.get(node.id);
      if (!originalColor) continue;

      // Get current material
      const material = node.material;
      if (!material || !material.color) continue;

      // Apply desaturation: lerp from original color to neutral gray
      // Higher corruption = more desaturated (closer to neutral gray)
      const desaturatedColor = originalColor.clone().lerp(
        configOptions.neutralColor,
        corruption * configOptions.desaturationStrength
      );

      // Apply to material
      material.color.copy(desaturatedColor);

      if (configOptions.debugMode) {
        console.log(`[CorruptionDesaturation] Node ${node.id}: corruption=${corruption.toFixed(2)}, desaturation applied`);
      }
    }
  }

  /**
   * Update link colors based on corruption
   */
  function updateLinkColors() {
    for (const link of links) {
      if (!link || !link.userData) continue;

      const corruption = link.userData.metrics?.corruption ?? link.userData?.corruption ?? 0;
      
      // Get original colors (base)
      const originalMaterials = originalLinkColors.get(link.id);
      if (!originalMaterials?.length) continue;

      for (const { material, color: originalColor } of originalMaterials) {
        if (!material || !material.color) continue;

        // Apply desaturation: lerp from original color to neutral gray
        // Higher corruption = more desaturated (closer to neutral gray)
        const desaturatedColor = originalColor.clone().lerp(
          configOptions.neutralColor,
          corruption * configOptions.desaturationStrength
        );

        // Apply to material
        material.color.copy(desaturatedColor);
      }

      if (configOptions.debugMode) {
        console.log(`[CorruptionDesaturation] Link ${link.id}: corruption=${corruption.toFixed(2)}, desaturation applied`);
      }
    }
  }

  /**
   * Update all colors
   */
  function updateAllColors() {
    if (!configOptions.enabled) return;

    updateNodeColors();
    updateLinkColors();
  }

  // Initial update
  updateAllColors();

  console.log('[CorruptionDesaturationIntegration] Integration applied successfully');
  console.log('[CorruptionDesaturationIntegration] - Corruption will be immediately visible');
  console.log('[CorruptionDesaturationIntegration] - Original colors preserved as base');
  console.log(`[CorruptionDesaturationIntegration] - Desaturation strength: ${configOptions.desaturationStrength}`);
  console.log(`[CorruptionDesaturationIntegration] - Nodes processed: ${nodes.length}`);
  console.log(`[CorruptionDesaturationIntegration] - Links processed: ${links.length}`);

  // Return update function for manual triggering
  return {
    update: updateAllColors,
    updateNodes: updateNodeColors,
    updateLinks: updateLinkColors,
    config: configOptions,
    originalNodeColors,
    originalLinkColors,
  };
}

/**
 * Apply corruption desaturation to specific node
 * 
 * @param {Object} node - Node object
 * @param {Object} originalColor - Original color (base)
 * @param {Number} desaturationStrength - Desaturation strength (0-1)
 */
export function applyNodeCorruptionDesaturation(node, originalColor, desaturationStrength = 0.7) {
  if (!node || !node.userData) return;

  const corruption = node.userData.metrics?.corruption ?? node.userData?.corruption ?? 0;
  const neutralColor = new THREE.Color(0.5, 0.5, 0.5);

  // Apply desaturation
  const desaturatedColor = originalColor.clone().lerp(neutralColor, corruption * desaturationStrength);

  // Apply to material
  if (node.material && node.material.color) {
    node.material.color.copy(desaturatedColor);
  }
}

/**
 * Apply corruption desaturation to specific link
 * 
 * @param {Object} link - Link object
 * @param {Object} originalColor - Original color (base)
 * @param {Number} desaturationStrength - Desaturation strength (0-1)
 */
export function applyLinkCorruptionDesaturation(link, originalColor, desaturationStrength = 0.7) {
  if (!link || !link.userData) return;

  const corruption = link.userData.metrics?.corruption ?? link.userData?.corruption ?? 0;
  const neutralColor = new THREE.Color(0.5, 0.5, 0.5);

  // Apply desaturation
  const desaturatedColor = originalColor.clone().lerp(neutralColor, corruption * desaturationStrength);

  // Apply to conduit materials first, legacy material as fallback
  const materials = getConduitLinkMaterials(link);
  for (const material of materials) {
    if (material?.color) {
      material.color.copy(desaturatedColor);
    }
  }
}
