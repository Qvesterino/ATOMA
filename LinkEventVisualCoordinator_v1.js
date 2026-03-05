/**
 * LINK EVENT VISUAL COORDINATOR v1.0
 * 
 * Prevents visual amplification when multiple systems activate during link events.
 * 
 * PROBLEM:
 * When a link is created between two nodes, multiple independent visual systems
 * activate simultaneously (NodeAuraSystem, Evolution, LinkAura, etc.), each
 * spawning full-scale meshes centered on the node → visual explosion.
 * 
 * SOLUTION:
 * Establish a priority hierarchy during link events. Only one system contributes
 * full-scale visuals; others enter "secondary mode" (reduced scale/opacity).
 * 
 * FEATURES:
 * - Non-invasive: only suppresses during active link events
 * - Priority-based: Evolution > Aura > LinkAura
 * - Temporary: no persistent state corruption
 * - Zero per-frame overhead: event-scoped only
 * - Backward compatible: all systems continue unchanged outside link events
 * 
 * INTEGRATION:
 * 1. Create coordinator: const coordinator = new LinkEventVisualCoordinator_v1();
 * 2. Register systems: coordinator.registerSystem('evolution', evolutionManager);
 * 3. Hook link events: nodeLinkingSystem.onLinkCreated(() => coordinator.onLinkEvent(nodes));
 * 4. Update systems: query coordinator.getSuppression(nodeId) before visual spawn
 */

export class LinkEventVisualCoordinator_v1 {
  constructor() {
    // Registered visual systems
    this.systems = {
      evolution: null,
      aura: null,
      linkAura: null
    };
    
    // Active link event tracking
    this.activeLinkEvents = new Map(); // nodeId → { activeSystem, timestamp }
    this.eventDuration = 200; // ms: how long to suppress after link event
    
    // Priority order (higher index = higher priority = full-scale)
    this.priorityOrder = ['linkAura', 'aura', 'evolution'];
    
    // Suppression rules - DISABLED per user request
    // Opacity multipliers and suppressed flags removed
    this.suppressionRules = {
      secondary: {
        scaleMax: 1.0,        // DISABLED: Full scale for secondary visuals
        opacityMax: 1.0,      // DISABLED: Full opacity for secondary visuals
        offsetFromOrigin: 0.0  // DISABLED: No offset required
      }
    };
  }
  
  /**
   * Register a visual system for coordination
   */
  registerSystem(name, systemInstance) {
    if (this.systems.hasOwnProperty(name) && systemInstance) {
      this.systems[name] = systemInstance;
    }
  }
  
  /**
   * Called when a link event occurs (node1-node2 link created)
   * Establishes which system gets priority for these two nodes
   */
  onLinkEvent(sourceNode, targetNode) {
    if (!sourceNode || !targetNode) return;
    
    const now = Date.now();
    
    // Mark both nodes as active in link event
    // Priority: whichever system is most "active" gets primary
    const sourcePrimary = this._determinePrimarySystem();
    const targetPrimary = this._determinePrimarySystem();
    
    this.activeLinkEvents.set(sourceNode.id || sourceNode.uuid, {
      activeSystem: sourcePrimary,
      timestamp: now,
      node: sourceNode
    });
    
    this.activeLinkEvents.set(targetNode.id || targetNode.uuid, {
      activeSystem: targetPrimary,
      timestamp: now,
      node: targetNode
    });
  }
  
  /**
   * Determine which system should be primary (has highest priority active)
   * @private
   */
  _determinePrimarySystem() {
    // Check in priority order (highest priority last = returns first active)
    for (let i = this.priorityOrder.length - 1; i >= 0; i--) {
      const systemName = this.priorityOrder[i];
      if (this.systems[systemName]) {
        return systemName;
      }
    }
    return null;
  }
  
  /**
   * Query suppression status for a node
   * Called by visual systems before spawning meshes
   * 
   * Returns:
   * - null: no suppression (spawn normally)
   * - { scale: 0.35, opacity: 0.25, offset: 0.3 }: apply suppression
   */
  getSuppression(nodeId, requestingSystem) {
    // Cleanup old events
    this._cleanupExpiredEvents();
    
    // Check if this node is in an active link event
    const event = this.activeLinkEvents.get(nodeId);
    if (!event) {
      return null; // No suppression
    }
    
    // Check if requesting system is the primary
    if (event.activeSystem === requestingSystem) {
      return null; // Primary system: no suppression
    }
    
    // Secondary system: apply suppression rules
    return {
      scale: this.suppressionRules.secondary.scaleMax,
      opacity: this.suppressionRules.secondary.opacityMax,
      offset: this.suppressionRules.secondary.offsetFromOrigin
    };
  }
  
  /**
   * Cleanup expired link events
   * @private
   */
  _cleanupExpiredEvents() {
    const now = Date.now();
    const expired = [];
    
    for (const [nodeId, event] of this.activeLinkEvents.entries()) {
      if (now - event.timestamp > this.eventDuration) {
        expired.push(nodeId);
      }
    }
    
    expired.forEach(nodeId => {
      this.activeLinkEvents.delete(nodeId);
    });
  }
  
  /**
   * Check if a node is currently in a link event
   */
  isNodeInLinkEvent(nodeId) {
    this._cleanupExpiredEvents();
    return this.activeLinkEvents.has(nodeId);
  }
  
  /**
   * Get all nodes currently in link events
   */
  getNodesInLinkEvents() {
    this._cleanupExpiredEvents();
    return Array.from(this.activeLinkEvents.values()).map(e => e.node);
  }
  
  /**
   * Manual cleanup
   */
  dispose() {
    this.activeLinkEvents.clear();
    this.systems = {
      evolution: null,
      aura: null,
      linkAura: null
    };
  }
}
