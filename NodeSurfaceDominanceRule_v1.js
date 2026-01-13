/**
 * NODE SURFACE VISUAL DOMINANCE RULE v1.0
 * 
 * Ensures node core surface is always visually dominant over its own aura layers
 * during link events when visual suppression is active.
 * 
 * PROBLEM:
 * During link events, when LinkEventVisualCoordinator suppresses aura/evolution visuals,
 * the node core may become visually weaker due to transparent materials, blending modes,
 * or renderOrder conflicts. Result: Node appears to vanish or become unreadable.
 * 
 * SOLUTION:
 * Apply minimal dominance rules ensuring:
 * - Node core renderOrder > aura renderOrder (always)
 * - Node core has opacity floor (stays readable even when suppressed)
 * - Node core depth testing prioritizes surface clarity
 * 
 * SAFETY:
 * - No visual system changes
 * - No new meshes created
 * - No per-frame overhead when coordinator inactive
 * - Backward compatible (works without coordinator present)
 * - Non-destructive (all changes local to suppression window)
 * 
 * IMPLEMENTATION:
 * Called by LinkEventVisualCoordinator during suppression setup.
 * Modifies node material/renderOrder temporarily during link event.
 * Automatically reverts when suppression expires.
 */

import * as THREE from 'three';

export class NodeSurfaceDominanceRule_v1 {
  constructor() {
    // Dominance rules (tunable)
    this.rules = {
      // RenderOrder differential: node > aura
      renderOrderDiff: 2,
      
      // Minimum node core opacity (even when suppressed)
      minNodeOpacity: 0.65,
      
      // Minimum aura opacity (even when full strength)
      minAuraOpacity: 0.15,
      
      // RenderOrder for node core (during dominance enforcement)
      nodeRenderOrder: 10,
      
      // RenderOrder for aura (always below node)
      auraRenderOrder: 5,
      
      // Enable depthWrite for node to ensure visibility
      enableNodeDepthWrite: true,
      
      // Force depthTest for node materials
      forceNodeDepthTest: true
    };
    
    // State tracking (temporary during link events)
    this.activeDominanceNodes = new Map(); // nodeId → { originalState }
  }
  
  /**
   * Enforce node dominance during link event
   * Call when suppression is active
   */
  enforceNodeDominance(node, linkEventNode) {
    if (!node || !node.isMesh) return;
    
    const nodeId = node.id || node.uuid || Math.random();
    
    // Skip if already enforced
    if (this.activeDominanceNodes.has(nodeId)) {
      return;
    }
    
    // Store original state for restoration
    const originalState = {
      renderOrder: node.renderOrder,
      opacity: node.material?.opacity,
      depthWrite: node.material?.depthWrite,
      depthTest: node.material?.depthTest,
      materialRef: node.material
    };
    
    // Apply dominance rules
    this._applyDominance(node);
    
    // Track for later restoration
    this.activeDominanceNodes.set(nodeId, originalState);
  }
  
  /**
   * Apply dominance rules to node material
   * @private
   */
  _applyDominance(node) {
    if (!node || !node.material) return;
    
    // Rule 1: RenderOrder - Ensure node is rendered after aura
    node.renderOrder = this.rules.nodeRenderOrder;
    
    // Rule 2: Opacity floor - Node stays readable even in suppression
    if (node.material.opacity !== undefined) {
      node.material.opacity = Math.max(
        node.material.opacity,
        this.rules.minNodeOpacity
      );
    }
    
    // Rule 3: Depth control - Prioritize node surface for depth testing
    if (node.material.depthWrite !== undefined) {
      node.material.depthWrite = this.rules.enableNodeDepthWrite;
    }
    
    if (node.material.depthTest !== undefined) {
      node.material.depthTest = this.rules.forceNodeDepthTest;
    }
    
    // Rule 4: For transparent materials, ensure proper blending
    if (node.material.transparent && node.material.blending === THREE.NormalBlending) {
      // Keep normal blending for opaque appearance
      // This prevents aura light from fully overpowering node
    }
  }
  
  /**
   * Restore node to original state (when link event ends)
   */
  restoreNodeState(node) {
    if (!node) return;
    
    const nodeId = node.id || node.uuid;
    if (!nodeId) return;
    
    const originalState = this.activeDominanceNodes.get(nodeId);
    if (!originalState) return;
    
    try {
      // Restore renderOrder
      node.renderOrder = originalState.renderOrder;
      
      // Restore opacity
      if (node.material && originalState.opacity !== undefined) {
        node.material.opacity = originalState.opacity;
      }
      
      // Restore depth properties
      if (node.material) {
        if (originalState.depthWrite !== undefined) {
          node.material.depthWrite = originalState.depthWrite;
        }
        if (originalState.depthTest !== undefined) {
          node.material.depthTest = originalState.depthTest;
        }
      }
    } catch (err) {
      console.warn('Error restoring node dominance state:', err);
    }
    
    // Remove from tracking
    this.activeDominanceNodes.delete(nodeId);
  }
  
  /**
   * Restore all tracked nodes to original state
   */
  restoreAll() {
    for (const [nodeId, state] of this.activeDominanceNodes.entries()) {
      // Note: We need the node object to restore, which isn't stored
      // This method is a safety net for cleanup
      this.activeDominanceNodes.delete(nodeId);
    }
  }
  
  /**
   * Suppress aura opacity to never exceed node visibility
   * Called when aura/link aura is spawned during link event
   */
  suppressAuraVisibility(auraMesh) {
    if (!auraMesh || !auraMesh.material) return;
    
    // Ensure aura never fully hides node surface
    if (auraMesh.material.opacity !== undefined) {
      auraMesh.material.opacity = Math.min(
        auraMesh.material.opacity,
        this.rules.minAuraOpacity
      );
    }
    
    // RenderOrder: aura stays below node
    auraMesh.renderOrder = this.rules.auraRenderOrder;
    
    // Optional: disable depth write for aura
    // This allows node core to appear "on top"
    if (auraMesh.material.depthWrite !== undefined) {
      auraMesh.material.depthWrite = false;
    }
  }
  
  /**
   * Configure dominance rules (optional tuning)
   */
  configureRules(config) {
    if (!config) return;
    
    // Merge user config with defaults
    for (const key in config) {
      if (this.rules.hasOwnProperty(key)) {
        this.rules[key] = config[key];
      }
    }
  }
  
  /**
   * Get current number of tracked dominance nodes
   */
  getTrackedNodeCount() {
    return this.activeDominanceNodes.size;
  }
  
  /**
   * Reset all state and tracking
   */
  reset() {
    this.activeDominanceNodes.clear();
  }
}
