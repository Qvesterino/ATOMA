/**
 * UndoRedoSystem - Comprehensive undo/redo history for ATOMA
 * 
 * Implements Command pattern for reversible operations:
 * - Link creation/removal (single and bulk)
 * - Selection state changes
 * - Multi-select operations
 * 
 * Features:
 * - History stack with configurable max size
 * - Keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z / Ctrl+Y)
 * - State restoration with node reference validation
 * - Memory-efficient command storage
 */

export class UndoRedoSystem {
  constructor(linkingSystem, options = {}) {
    this.linkingSystem = linkingSystem;
    
    // Configuration
    this.maxHistorySize = options.maxHistorySize || 50;
    this.verbose = options.verbose ?? false;
    
    // History stacks
    this.undoStack = [];  // Past commands that can be undone
    this.redoStack = [];  // Undone commands that can be redone
    
    // State
    this.enabled = true;
    this.isUndoing = false;  // Prevent recording during undo/redo
    this.isRedoing = false;
    
    // Keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    if (this.verbose) {
      console.log('[UndoRedo] Initialized with max history:', this.maxHistorySize);
    }
  }
  
  /**
   * Setup keyboard shortcuts for undo/redo
   */
  setupKeyboardShortcuts() {
    this.keyHandler = (event) => {
      // Check for Ctrl/Cmd + Z (undo)
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        this.undo();
        return;
      }
      
      // Check for Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y (redo)
      if ((event.ctrlKey || event.metaKey) && 
          ((event.key === 'z' && event.shiftKey) || event.key === 'y')) {
        event.preventDefault();
        this.redo();
        return;
      }
    };
    
    document.addEventListener('keydown', this.keyHandler);
  }
  
  /**
   * Record a command for undo/redo
   * @param {Object} command - Command object with execute/undo methods
   */
  recordCommand(command) {
    if (!this.enabled || this.isUndoing || this.isRedoing) {
      return;
    }
    
    // Add to undo stack
    this.undoStack.push(command);
    
    // Trim stack if exceeding max size
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
    
    // Clear redo stack (new action invalidates redo history)
    this.redoStack = [];
    
    if (this.verbose) {
      console.log(`[UndoRedo] Recorded: ${command.type} (stack: ${this.undoStack.length})`);
    }
  }
  
  /**
   * Undo the last command
   */
  undo() {
    if (this.undoStack.length === 0) {
      if (this.verbose) {
        console.log('[UndoRedo] Nothing to undo');
      }
      return false;
    }
    
    const command = this.undoStack.pop();
    
    this.isUndoing = true;
    
    try {
      command.undo();
      this.redoStack.push(command);
      
      console.log(`[UndoRedo] ✓ Undid: ${command.type}`);
      return true;
    } catch (error) {
      console.error('[UndoRedo] Error during undo:', error);
      // Put command back if undo failed
      this.undoStack.push(command);
      return false;
    } finally {
      this.isUndoing = false;
    }
  }
  
  /**
   * Redo the last undone command
   */
  redo() {
    if (this.redoStack.length === 0) {
      if (this.verbose) {
        console.log('[UndoRedo] Nothing to redo');
      }
      return false;
    }
    
    const command = this.redoStack.pop();
    
    this.isRedoing = true;
    
    try {
      command.execute();
      this.undoStack.push(command);
      
      console.log(`[UndoRedo] ✓ Redid: ${command.type}`);
      return true;
    } catch (error) {
      console.error('[UndoRedo] Error during redo:', error);
      // Put command back if redo failed
      this.redoStack.push(command);
      return false;
    } finally {
      this.isRedoing = false;
    }
  }
  
  /**
   * Clear all history
   */
  clear() {
    this.undoStack = [];
    this.redoStack = [];
    
    if (this.verbose) {
      console.log('[UndoRedo] Cleared all history');
    }
  }
  
  /**
   * Get undo stack size
   */
  getUndoCount() {
    return this.undoStack.length;
  }
  
  /**
   * Get redo stack size
   */
  getRedoCount() {
    return this.redoStack.length;
  }
  
  /**
   * Check if can undo
   */
  canUndo() {
    return this.undoStack.length > 0;
  }
  
  /**
   * Check if can redo
   */
  canRedo() {
    return this.redoStack.length > 0;
  }
  
  /**
   * Enable/disable undo system
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    
    if (this.verbose) {
      console.log(`[UndoRedo] ${enabled ? 'Enabled' : 'Disabled'}`);
    }
  }
  
  /**
   * Cleanup
   */
  dispose() {
    document.removeEventListener('keydown', this.keyHandler);
    this.clear();
    
    if (this.verbose) {
      console.log('[UndoRedo] Disposed');
    }
  }
}

// ============================================================================
// COMMAND IMPLEMENTATIONS
// ============================================================================

/**
 * Command for creating a single link
 */
export class CreateLinkCommand {
  constructor(linkingSystem, sourceNode, targetNode) {
    this.type = 'CreateLink';
    this.linkingSystem = linkingSystem;
    this.sourceNode = sourceNode;
    this.targetNode = targetNode;
    this.createdLink = null;
    
    // Store node IDs for validation
    this.sourceNodeId = linkingSystem.getNodeId(sourceNode);
    this.targetNodeId = linkingSystem.getNodeId(targetNode);
  }
  
  execute() {
    // Validate nodes still exist
    if (!this._validateNodes()) {
      console.warn('[CreateLinkCommand] Nodes no longer valid');
      return;
    }
    
    // Create link
    this.createdLink = this.linkingSystem.createLink(this.sourceNode, this.targetNode);
    
    // Apply visual states
    if (this.linkingSystem.visualStateBinder) {
      this.linkingSystem.visualStateBinder.onNodeStateChange(this.sourceNode, 'LINKED');
      this.linkingSystem.visualStateBinder.onNodeStateChange(this.targetNode, 'LINKED');
    }
  }
  
  undo() {
    // Validate nodes still exist
    if (!this._validateNodes()) {
      console.warn('[CreateLinkCommand] Nodes no longer valid for undo');
      return;
    }
    
    // Find and remove the link
    if (this.createdLink) {
      this.linkingSystem.removeLink(this.createdLink);
    } else {
      // Fallback: find link by source/target
      const link = this.linkingSystem.links.find(l => 
        l.source === this.sourceNode && l.target === this.targetNode
      );
      if (link) {
        this.linkingSystem.removeLink(link);
      }
    }
  }
  
  _validateNodes() {
    return (
      this.sourceNode && 
      this.targetNode && 
      this.sourceNode.parent && 
      this.targetNode.parent &&
      this.linkingSystem.aiNodes.nodes.includes(this.sourceNode) &&
      this.linkingSystem.aiNodes.nodes.includes(this.targetNode)
    );
  }
}

/**
 * Command for removing a single link
 */
export class RemoveLinkCommand {
  constructor(linkingSystem, link) {
    this.type = 'RemoveLink';
    this.linkingSystem = linkingSystem;
    this.link = link;
    
    // Store link data for recreation
    this.sourceNode = link.source;
    this.targetNode = link.target;
    this.sourceNodeId = linkingSystem.getNodeId(link.source);
    this.targetNodeId = linkingSystem.getNodeId(link.target);
    
    // Store link properties
    this.linkData = {
      traffic: { ...link.traffic },
      category: link.category,
      synergyScore: link.userData?.synergy?.score ?? link?.synergyScore ?? 0
    };
  }
  
  execute() {
    // Validate nodes still exist
    if (!this._validateNodes()) {
      console.warn('[RemoveLinkCommand] Nodes no longer valid');
      return;
    }
    
    // Remove link
    this.linkingSystem.removeLink(this.link);
  }
  
  undo() {
    // Validate nodes still exist
    if (!this._validateNodes()) {
      console.warn('[RemoveLinkCommand] Nodes no longer valid for undo');
      return;
    }
    
    // Recreate link
    const newLink = this.linkingSystem.createLink(this.sourceNode, this.targetNode);
    
    // Restore link properties
    if (newLink && this.linkData) {
      Object.assign(newLink.traffic, this.linkData.traffic);
      newLink.category = this.linkData.category;
      if (!newLink.userData) newLink.userData = {};
      const score = Math.max(0, Math.min(1, this.linkData.synergyScore));
    }
    
    this.link = newLink;
  }
  
  _validateNodes() {
    return (
      this.sourceNode && 
      this.targetNode && 
      this.sourceNode.parent && 
      this.targetNode.parent &&
      this.linkingSystem.aiNodes.nodes.includes(this.sourceNode) &&
      this.linkingSystem.aiNodes.nodes.includes(this.targetNode)
    );
  }
}

/**
 * Command for bulk link creation (multi-select)
 */
export class BulkCreateLinksCommand {
  constructor(linkingSystem, sourceNodes, targetNode) {
    this.type = 'BulkCreateLinks';
    this.linkingSystem = linkingSystem;
    this.sourceNodes = Array.from(sourceNodes);
    this.targetNode = targetNode;
    this.createdLinks = [];
    
    // Store node IDs for validation
    this.sourceNodeIds = this.sourceNodes.map(n => linkingSystem.getNodeId(n));
    this.targetNodeId = linkingSystem.getNodeId(targetNode);
  }
  
  execute() {
    this.createdLinks = [];
    
    for (const sourceNode of this.sourceNodes) {
      // Validate node still exists
      if (!this._validateNode(sourceNode)) {
        continue;
      }
      
      // Skip if link already exists or would be invalid
      if (this.linkingSystem.linkExists(sourceNode, this.targetNode)) {
        continue;
      }
      
      if (this.linkingSystem.validateLink(sourceNode, this.targetNode)) {
        continue;  // Validation returned denial reason
      }
      
      // Create link
      const link = this.linkingSystem.createLink(sourceNode, this.targetNode);
      if (link) {
        this.createdLinks.push(link);
      }
    }
  }
  
  undo() {
    // Remove all created links
    for (const link of this.createdLinks) {
      if (link && link.active) {
        this.linkingSystem.removeLink(link);
      }
    }
  }
  
  _validateNode(node) {
    return (
      node && 
      node.parent &&
      this.linkingSystem.aiNodes.nodes.includes(node)
    );
  }
}

/**
 * Command for bulk link removal (multi-select)
 */
export class BulkRemoveLinksCommand {
  constructor(linkingSystem, nodes) {
    this.type = 'BulkRemoveLinks';
    this.linkingSystem = linkingSystem;
    this.nodes = Array.from(nodes);
    this.removedLinksData = [];
    
    // Store node IDs
    this.nodeIds = this.nodes.map(n => linkingSystem.getNodeId(n));
  }
  
  execute() {
    this.removedLinksData = [];
    
    // Collect all links from selected nodes
    const linksToRemove = [];
    for (const node of this.nodes) {
      if (!this._validateNode(node)) {
        continue;
      }
      
      const nodeLinks = this.linkingSystem.links.filter(link => 
        link.active && (
          link.source === node || link.target === node
        )
      );
      
      for (const link of nodeLinks) {
        if (!linksToRemove.includes(link)) {
          linksToRemove.push(link);
          
          // Store link data for restoration
          this.removedLinksData.push({
            sourceNode: link.source,
            targetNode: link.target,
            sourceNodeId: this.linkingSystem.getNodeId(link.source),
            targetNodeId: this.linkingSystem.getNodeId(link.target),
            linkData: {
              traffic: { ...link.traffic },
              category: link.category,
              synergyScore: link.userData?.synergy?.score ?? link?.synergyScore ?? 0
            }
          });
        }
      }
    }
    
    // Remove all links
    for (const link of linksToRemove) {
      this.linkingSystem.removeLink(link);
    }
  }
  
  undo() {
    // Recreate all removed links
    for (const linkInfo of this.removedLinksData) {
      // Validate nodes still exist
      if (!this._validateNode(linkInfo.sourceNode) || 
          !this._validateNode(linkInfo.targetNode)) {
        continue;
      }
      
      // Recreate link
      const newLink = this.linkingSystem.createLink(
        linkInfo.sourceNode, 
        linkInfo.targetNode
      );
      
      // Restore properties
      if (newLink && linkInfo.linkData) {
        Object.assign(newLink.traffic, linkInfo.linkData.traffic);
        newLink.category = linkInfo.linkData.category;
        if (!newLink.userData) newLink.userData = {};
        const score = Math.max(0, Math.min(1, linkInfo.linkData.synergyScore));
      }
    }
  }
  
  _validateNode(node) {
    return (
      node && 
      node.parent &&
      this.linkingSystem.aiNodes.nodes.includes(node)
    );
  }
}

/**
 * Command for selection state change (optional - for undo/redo selection)
 */
export class SetSelectionCommand {
  constructor(linkingSystem, node, previousNode) {
    this.type = 'SetSelection';
    this.linkingSystem = linkingSystem;
    this.node = node;
    this.previousNode = previousNode;
    
    // Store node IDs
    this.nodeId = node ? linkingSystem.getNodeId(node) : null;
    this.previousNodeId = previousNode ? linkingSystem.getNodeId(previousNode) : null;
  }
  
  execute() {
    if (this.node) {
      this.linkingSystem.setPrimaryNode(this.node);
    } else {
      this.linkingSystem.clearPrimaryNode();
    }
  }
  
  undo() {
    if (this.previousNode) {
      this.linkingSystem.setPrimaryNode(this.previousNode);
    } else {
      this.linkingSystem.clearPrimaryNode();
    }
  }
}
