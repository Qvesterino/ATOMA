/**
 * LINK EVENT ORDER VALIDATOR
 * ATOMA Audit 6.2 - Final Seal Edition
 * 
 * Validates that events occur in the correct order:
 * 1. Node exists in scene (has parent)
 * 2. Node visuals bootstrapped
 * 3. Link objects created
 * 4. Events fired to HUD
 * 
 * No behavioral changes - pure validation and retry logic
 */

export class LinkEventOrderValidator {
  constructor() {
    this.deferredEvents = [];
    this.maxRetries = 3;
    this.frameDelay = 1;
  }

  /**
   * Validate if node is ready for linking
   */
  isNodeReady(node) {
    if (!node) return false;
    
    // Node must have parent (in scene)
    if (!node.parent) {
      return false;
    }
    
    // Node must have position (visual bootstrap complete)
    if (!node.position) {
      return false;
    }
    
    // Position must be valid Vector3
    if (typeof node.position.x !== 'number' ||
        typeof node.position.y !== 'number' ||
        typeof node.position.z !== 'number') {
      return false;
    }
    
    return true;
  }

  /**
   * Validate if link object is ready
   */
  isLinkReady(link, linkRegistry) {
    if (!link) return false;
    if (!link.source || !link.target) return false;
    if (!this.isNodeReady(link.source) || !this.isNodeReady(link.target)) {
      return false;
    }
    
    // If linkRegistry provided, check if link exists there
    if (linkRegistry && !linkRegistry.includes(link)) {
      return false;
    }
    
    return true;
  }

  /**
   * Validate and defer event if not ready
   * Returns: true if ready to execute, false if deferred
   */
  validateEventOrder(eventType, node, link = null, linkRegistry = null) {
    const isReady = this._checkEventReady(eventType, node, link, linkRegistry);
    
    if (!isReady) {
      // Defer event for next frame
      this._deferEvent(eventType, node, link, linkRegistry);
      return false;
    }
    
    return true;
  }

  /**
   * Check if event is ready
   * @private
   */
  _checkEventReady(eventType, node, link, linkRegistry) {
    switch (eventType) {
      case 'nodeSelected':
        return this.isNodeReady(node);
      
      case 'linkCreated':
        return this.isLinkReady(link, linkRegistry);
      
      case 'linkRemoved':
        return this.isLinkReady(link, linkRegistry);
      
      case 'refreshDisplay':
        return this.isNodeReady(node);
      
      default:
        return true;
    }
  }

  /**
   * Defer event for retry next frame
   * @private
   */
  _deferEvent(eventType, node, link, linkRegistry) {
    const deferred = {
      type: eventType,
      node,
      link,
      linkRegistry,
      retries: 0,
      createdAt: Date.now()
    };
    
    this.deferredEvents.push(deferred);
    
    // Debug log only if verbose
    if (window.__ATOMA_DEBUG_EVENTS) {
      console.debug(`[LinkEventOrderValidator] Deferred ${eventType}`, {
        nodeReady: node ? this.isNodeReady(node) : false,
        linkReady: link ? this.isLinkReady(link, linkRegistry) : false
      });
    }
  }

  /**
   * Process deferred events (call once per frame from main loop)
   */
  processDeferredEvents(callback) {
    if (this.deferredEvents.length === 0) return;
    
    const stillDeferred = [];
    
    for (const deferred of this.deferredEvents) {
      deferred.retries++;
      
      const isReady = this._checkEventReady(
        deferred.type,
        deferred.node,
        deferred.link,
        deferred.linkRegistry
      );
      
      if (isReady && deferred.retries <= this.maxRetries) {
        // Event ready - execute callback
        callback(deferred);
        
        if (window.__ATOMA_DEBUG_EVENTS) {
          console.debug(`[LinkEventOrderValidator] Processed deferred ${deferred.type} after ${deferred.retries} retries`);
        }
      } else if (deferred.retries > this.maxRetries) {
        // Max retries exceeded - give up silently
        console.warn(`[LinkEventOrderValidator] Event ${deferred.type} exceeded max retries, skipping`);
      } else {
        // Still not ready - defer again
        stillDeferred.push(deferred);
      }
    }
    
    this.deferredEvents = stillDeferred;
  }

  /**
   * Get current deferred event count
   */
  getDeferredCount() {
    return this.deferredEvents.length;
  }

  /**
   * Clear all deferred events
   */
  clearDeferred() {
    this.deferredEvents = [];
  }

  /**
   * Reset validator state
   */
  reset() {
    this.clearDeferred();
  }
}

// Export singleton
export const linkEventOrderValidator = new LinkEventOrderValidator();
