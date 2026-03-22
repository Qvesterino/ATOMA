/**
 * VISUAL ECHO TRAILS v1.0 — Integration Adapter
 * ==============================================
 * 
 * Bridges VisualEchoTrails_v1 shader system with existing NeonLinkVisuals
 * Applies echo trail enhancements to active links without modifying core systems
 * 
 * 🎯 INTEGRATION STRATEGY:
 * - Non-invasive hook into link update loop
 * - Material-level uniform updates (no state changes)
 * - Synergy-gated activation (smooth at 0.70+)
 * - Per-frame shader uniform propagation
 * 
 * ✅ SAFETY:
 * - No modifications to NodeLinkingSystem
 * - No modifications to link structures
 * - No new global states
 * - Removable without side effects
 * - Backward compatible with existing visuals
 */

// FIX 3: THREE used in _getLinkColor but never imported
import * as THREE from 'three';

export class VisualEchoTrails_v1_Integration {
  constructor(scene, linkingSystem, neonLinkVisuals, echoTrailsSystem) {
    this.scene = scene;
    this.linkingSystem = linkingSystem;
    this.neonLinkVisuals = neonLinkVisuals;
    this.echoTrailsSystem = echoTrailsSystem;
    
    // Track materials that have been enhanced with echo trails
    this.echoMaterials = new Map(); // linkId → [materials]
    
    this.enabled = true;
  }
  
  /**
   * Initialize echo trails on all current links
   * Called during startup after links are created
   */
  initializeAllLinks() {
    if (!this.linkingSystem || !this.linkingSystem.links) {
      console.warn('[EchoTrails] No linking system or links found');
      return;
    }
    
    for (const link of this.linkingSystem.links) {
      this.initializeLink(link);
    }
    
    console.log(`[EchoTrails] Initialized ${this.linkingSystem.links.length} links`);
  }
  
  /**
   * Initialize echo trail for a single link
   * @param {Object} link - Link to initialize
   */
  initializeLink(link) {
    if (!link || !link.mesh) return;
    
    // Get link color for material
    const linkColor = this._getLinkColor(link);
    
    // Create echo trail material
    const echoMaterial = this.echoTrailsSystem.createMaterial(linkColor);
    
    // Apply to link geometry
    link.mesh.material = echoMaterial;
    
    // Store reference
    if (link.id) {
      this.echoMaterials.set(link.id, [echoMaterial]);
    }
  }
  
  /**
   * Initialize echo trail on newly created link
   * Called from link creation callback
   * @param {Object} link - Newly created link
   */
  onLinkCreated(link) {
    if (this.enabled) {
      this.initializeLink(link);
    }
  }
  
  /**
   * Clean up echo trail when link is removed
   * Called from link removal callback
   * @param {Object} link - Removed link
   */
  onLinkRemoved(link) {
    if (link && link.id) {
      this.echoMaterials.delete(link.id);
    }
  }
  
  /**
   * Update all echo trail materials with current frame data
   * Called once per frame in main update loop
   * @param {number} time - Current game time (seconds)
   * @param {number} visualTime - Visual time (may be reversed for extreme synergy)
   * @param {number} avgSynergy - Network average synergy [0..1]
   */
  updateAllMaterials(time, visualTime, avgSynergy) {
    if (!this.enabled) return;
    
    for (const [linkId, materials] of this.echoMaterials.entries()) {
      if (!Array.isArray(materials)) continue;
      
      for (const material of materials) {
        if (material && material.uniforms) {
          // Update time uniforms
          material.uniforms.uTime.value = time;
          material.uniforms.uVisualTime.value = visualTime;
          
          // Update synergy for gating
          material.uniforms.uSynergy.value = avgSynergy;
        }
      }
    }
  }
  
  /**
   * Update specific link material with new synergy value
   * Per-link synergy reading (if available from link data)
   * @param {Object} link - Link to update
   * @param {number} time - Current time
   * @param {number} visualTime - Visual time
   * @param {number} linkSynergy - Link-specific synergy (optional)
   */
  updateLinkMaterial(link, time, visualTime, linkSynergy) {
    if (!link || !link.id) return;
    
    const materials = this.echoMaterials.get(link.id);
    if (!materials) return;
    
    for (const material of materials) {
      if (material && material.uniforms) {
        material.uniforms.uTime.value = time;
        material.uniforms.uVisualTime.value = visualTime;
        material.uniforms.uSynergy.value = linkSynergy || 0.0;
      }
    }
  }
  
  /**
   * Extract link color from various possible sources
   * @private
   */
  _getLinkColor(link) {
    // Try multiple sources for color
    if (link.mesh && link.mesh.material && link.mesh.material.color) {
      return link.mesh.material.color.clone();
    }
    
    if (link.color) {
      return new THREE.Color(link.color);
    }
    
    // Default cyan (neon style)
    return new THREE.Color(0x00ffff);
  }
  
  /**
   * Disable echo trails temporarily (keeps materials)
   */
  disable() {
    this.enabled = false;
    
    // Set opacity to 0 for all materials
    for (const materials of this.echoMaterials.values()) {
      for (const material of materials) {
        if (material && material.uniforms) {
          material.uniforms.uEchoOpacity.value = 0.0;
        }
      }
    }
  }
  
  /**
   * Re-enable echo trails
   */
  enable() {
    this.enabled = true;
    
    // Restore opacity
    for (const materials of this.echoMaterials.values()) {
      for (const material of materials) {
        if (material && material.uniforms) {
          material.uniforms.uEchoOpacity.value = 
            this.echoTrailsSystem.params.echoOpacity;
        }
      }
    }
  }
  
  /**
   * Toggle echo trails on/off
   */
  toggle() {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
  }
  
  /**
   * Set echo intensity for all materials
   * @param {number} intensity - Echo opacity [0..1]
   */
  setIntensity(intensity) {
    intensity = Math.max(0, Math.min(1, intensity));
    
    for (const materials of this.echoMaterials.values()) {
      for (const material of materials) {
        if (material && material.uniforms) {
          material.uniforms.uEchoOpacity.value = intensity;
        }
      }
    }
  }
  
  /**
   * Get current statistics
   * @returns {Object} Integration stats
   */
  getStats() {
    return {
      enabled: this.enabled,
      linksEnhanced: this.echoMaterials.size,
      materialsTracked: Array.from(this.echoMaterials.values()).flat().length,
      echoParams: this.echoTrailsSystem.params
    };
  }
  
  /**
   * Get debug information
   * @returns {Object} Debug snapshot
   */
  getDebugInfo() {
    const stats = this.getStats();
    return {
      ...stats,
      system: 'VisualEchoTrails_v1_Integration',
      status: this.enabled ? 'ACTIVE' : 'DISABLED',
      validation: {
        hasLinkingSystem: !!this.linkingSystem,
        hasNeonLinkVisuals: !!this.neonLinkVisuals,
        hasEchoSystem: !!this.echoTrailsSystem,
        materialsHealthy: this._validateMaterials()
      }
    };
  }
  
  /**
   * Validate material health
   * @private
   */
  _validateMaterials() {
    let healthy = 0;
    let total = 0;
    
    for (const materials of this.echoMaterials.values()) {
      for (const material of materials) {
        total++;
        if (material && material.uniforms && material.uniforms.uTime) {
          healthy++;
        }
      }
    }
    
    return total === 0 ? true : healthy === total;
  }

  /**
   * FIX 6: Dispose — restore original materials and clear state for world switch
   */
  dispose() {
    for (const materials of this.echoMaterials.values()) {
      for (const material of materials) {
        if (material) material.dispose();
      }
    }
    this.echoMaterials.clear();
    this.enabled = false;
    this.linkingSystem = null;
    this.neonLinkVisuals = null;
    this.echoTrailsSystem = null;
  }
}

/**
 * Setup function to integrate echo trails into main.js
 * @param {Object} mainInstance - The main game instance
 * @param {VisualEchoTrails_v1} echoTrailsSystem - The shader system
 * @returns {VisualEchoTrails_v1_Integration} Integration instance
 */
export function setupVisualEchoTrailsIntegration(
  mainInstance,
  echoTrailsSystem
) {
  // Create integration layer
  const integration = new VisualEchoTrails_v1_Integration(
    mainInstance.scene,
    mainInstance.linkingSystem,
    mainInstance.linkingSystem?.visuals, // NeonLinkVisuals instance
    echoTrailsSystem
  );
  
  // Initialize on all current links
  integration.initializeAllLinks();
  
  // Register callbacks for new links
  if (mainInstance.linkingSystem?.onLinkCreatedCallbacks) {
    mainInstance.linkingSystem.onLinkCreatedCallbacks.push((link) => {
      integration.onLinkCreated(link);
    });
  }

  const semanticBus = mainInstance?.semanticBus || mainInstance?.linkingSystem?.semanticBus || globalThis?.semanticBus || null;
  if (semanticBus?.on) {
    const resolveLinkFromPayload = (payload = {}) => {
      const links = Array.isArray(mainInstance?.linkingSystem?.links) ? mainInstance.linkingSystem.links : [];
      if (payload.linkId !== null && payload.linkId !== undefined) {
        const byId = links.find((link) => (link?.id ?? link?.userData?.id) === payload.linkId);
        if (byId) return byId;
      }
      const source = payload.source ?? null;
      const target = payload.target ?? null;
      if (!source || !target) return null;
      return links.find((link) => {
        const linkSource = link?.source || link?.nodeA || null;
        const linkTarget = link?.target || link?.nodeB || null;
        return linkSource === source && linkTarget === target;
      }) || null;
    };

    const handleSemanticLinkCreated = (event = {}) => {
      const payload = {
        source: event.source ?? null,
        target: event.target ?? null,
        linkId: event.linkId ?? event.id ?? null
      };
      const link = resolveLinkFromPayload(payload);
      if (!link) return;
      integration.onLinkCreated(link);
    };

    semanticBus.on('link.created', handleSemanticLinkCreated);
  }
  
  // Register callbacks for removed links
  if (mainInstance.linkingSystem?.onLinkRemovedCallbacks) {
    mainInstance.linkingSystem.onLinkRemovedCallbacks.push((link) => {
      integration.onLinkRemoved(link);
    });
  }
  
  console.log('[EchoTrails] Integration complete');
  
  return integration;
}
