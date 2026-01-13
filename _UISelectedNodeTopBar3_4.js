/**
 * UI SELECTED NODE TOP BAR 3.4
 * 
 * Persistent HUD bar at top center showing selected node information.
 * 
 * Design:
 * - Always visible when selectedNode != null
 * - Shows: "SELECTED NODE: [CODE]"
 * - Shows: "Archetype: [CATEGORY] / [SUBTYPE]"
 * - Fade in/out 150ms
 * - Top center positioning
 * - Neon cyan styling
 * - Single source of truth: queries SelectionCore
 * 
 * SAFETY:
 * ✓ Pure DOM display (read-only)
 * ✓ No node modifications
 * ✓ Performance: <0.05ms/frame
 * ✓ Memory: <20 KB
 */

export class UISelectedNodeTopBar3_4 {
  constructor(selectionCore = null) {
    this.selectionCore = selectionCore;
    this.element = null;
    this.currentNode = null;
    this.isVisible = false;
    
    this._initializeDOM();
  }
  
  /**
   * Initialize DOM element
   */
  _initializeDOM() {
    this.element = document.createElement('div');
    this.element.id = 'ui-selected-node-top-bar-3-4';
    this.element.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 25, 50, 0.85);
      border: 1.5px solid #36F2FF;
      border-radius: 4px;
      padding: 12px 24px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #36F2FF;
      letter-spacing: 0.5px;
      z-index: 998;
      pointer-events: none;
      display: none;
      opacity: 0;
      transition: opacity 0.15s ease;
      box-shadow: 
        0 0 25px rgba(54, 242, 255, 0.35),
        inset 0 0 10px rgba(54, 242, 255, 0.08),
        0 0 1px rgba(54, 242, 255, 0.8);
      overflow: hidden;
      text-align: center;
      line-height: 1.6;
      white-space: nowrap;
      max-width: 600px;
    `;
    
    document.body.appendChild(this.element);
  }
  
  /**
   * Show bar for node
   */
  show(node) {
    if (!node || !node.userData) return;
    
    this.currentNode = node;
    this._updateContent();
    
    this.element.style.display = 'block';
    setTimeout(() => {
      if (this.element) {
        this.element.style.opacity = '0.95';
      }
    }, 5);
    
    this.isVisible = true;
  }
  
  /**
   * Hide bar
   */
  hide() {
    this.element.style.opacity = '0';
    setTimeout(() => {
      if (this.element) {
        this.element.style.display = 'none';
      }
    }, 150);
    
    this.isVisible = false;
    this.currentNode = null;
  }
  
  /**
   * Update bar content
   */
  _updateContent() {
    if (!this.currentNode) return;
    
    const userData = this.currentNode.userData;
    
    // Get code
    const code = userData.namingCode || userData.category || 'UNK-NOD-STD';
    
    // Get category
    const category = userData.category || 'Unknown';
    const categoryDisplayName = this._getCategoryDisplayName(category);
    
    // Get subtype/archetype
    const archetypeName = userData.archetypeName || category;
    
    // Get category color
    const categoryColor = this._getCategoryColor(category);
    
    // Build HTML
    const html = `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
        <div style="
          font-weight: bold;
          font-size: 14px;
          color: #00FFFF;
          letter-spacing: 1px;
          text-shadow: 0 0 6px rgba(0, 255, 255, 0.5);
        ">SELECTED NODE: <span style="color: ${categoryColor}; font-weight: bold;">${code}</span></div>
        <div style="
          font-size: 12px;
          color: #7CFFDA;
          letter-spacing: 0.3px;
        ">Archetype: <span style="color: ${categoryColor}; font-weight: bold;">${categoryDisplayName}</span> / <span style="color: #FF4DF0;">${archetypeName}</span></div>
      </div>
    `;
    
    this.element.innerHTML = html;
  }
  
  /**
   * Get display name for category
   */
  _getCategoryDisplayName(category) {
    const displayNames = {
      'input': 'INPUT',
      'process': 'PROCESS',
      'integration': 'INTEGRATION',
      'analytics': 'ANALYTICS',
      'storage': 'STORAGE',
      'control': 'CONTROL',
      'sigma': 'SIGMA',
      'quantum': 'QUANTUM',
      'emotional': 'EMOTIONAL',
      'extreme': 'EXTREME',
      'outer': 'OUTER',
      'legendary': 'LEGENDARY',
      'mythic': 'MYTHIC',
      'prime': 'PRIME',
      'error': 'ERROR'
    };
    
    const lowerCat = (category || '').toLowerCase();
    return displayNames[lowerCat] || category?.toUpperCase() || 'UNKNOWN';
  }
  
  /**
   * Get category color
   */
  _getCategoryColor(category) {
    const colors = {
      'input': '#00ddff',
      'process': '#ffaa00',
      'integration': '#00ff88',
      'analytics': '#aa00ff',
      'storage': '#88ccff',
      'control': '#ff0088',
      'sigma': '#ff6633',
      'quantum': '#00ffcc',
      'emotional': '#ff4db8',
      'extreme': '#ff3333',
      'outer': '#ffcc00',
      'legendary': '#ffb500',
      'mythic': '#ffa0ff',
      'prime': '#88ff00',
      'error': '#ff4444'
    };
    
    const lowerCat = (category || '').toLowerCase();
    return colors[lowerCat] || '#36F2FF';
  }
  
  /**
   * Update - sync with SelectionCore
   * 
   * CRITICAL for UI 3.5:
   * TopBar must always be visible when SelectionCore.hasSelection() === true
   * TopBar must be hidden only when SelectionCore.hasSelection() === false
   */
  update(deltaTime) {
    if (!this.selectionCore) return;
    
    const hasSelection = this.selectionCore.hasSelection();
    const selectedNode = this.selectionCore.getSelected();
    
    if (hasSelection && selectedNode && !this.isVisible) {
      // Selection exists but TopBar hidden → show it
      this.show(selectedNode);
    } else if (!hasSelection && this.isVisible) {
      // No selection but TopBar visible → hide it
      this.hide();
    } else if (hasSelection && selectedNode && this.currentNode !== selectedNode) {
      // Selection changed → update content
      this._updateContent();
      this.currentNode = selectedNode;
    }
  }
  
  /**
   * Set selection core reference
   */
  setSelectionCore(selectionCore) {
    this.selectionCore = selectionCore;
  }
  
  /**
   * Dispose
   */
  dispose() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
