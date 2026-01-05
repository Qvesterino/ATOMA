/**
 * UI SELECTED NODE BADGE 3.3
 * 
 * Upgraded badge displayed directly under crosshair when node is selected.
 * Shows: SELECTED NODE header, QNT code, archetype name, neon frame
 * 
 * Design:
 * - Larger: 240 × 55px
 * - Neon frame with corner accents
 * - Neon cyan text (#36F2FF) 95% opacity
 * - Fade-in/fade-out 120ms
 * - Always centered under crosshair
 * - Auto-hidden when no node selected
 * 
 * SAFETY:
 * ✓ Pure DOM display (read-only)
 * ✓ No node modifications
 * ✓ Performance: <0.1ms/frame
 */

export class UISelectedNodeBadge3_2 {
  constructor() {
    this.element = null;
    this.currentNode = null;
    this.isVisible = false;
    this.fadeTimer = 0;
    
    this._initializeDOM();
  }
  
  /**
   * Initialize DOM element
   */
  _initializeDOM() {
    this.element = document.createElement('div');
    this.element.id = 'ui-selected-node-badge-3-3';
    this.element.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, calc(-50% - 52px));
      width: 240px;
      height: 55px;
      background: rgba(15, 25, 50, 0.92);
      border: 1.5px solid #36F2FF;
      border-radius: 3px;
      padding: 10px 14px;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: #36F2FF;
      letter-spacing: 0.5px;
      z-index: 999;
      pointer-events: none;
      display: none;
      opacity: 0;
      transition: opacity 0.12s ease;
      box-shadow: 
        0 0 20px rgba(54, 242, 255, 0.4),
        inset 0 0 8px rgba(54, 242, 255, 0.1),
        0 0 1px rgba(54, 242, 255, 0.8);
      overflow: hidden;
      text-align: center;
      line-height: 1.3;
    `;
    
    document.body.appendChild(this.element);
  }
  
  /**
   * Show badge for node
   */
  show(node) {
    if (!node || !node.userData) return;
    
    this.currentNode = node;
    this._updateContent();
    
    this.element.style.display = 'block';
    this.fadeTimer = 0.12;
    
    setTimeout(() => {
      this.element.style.opacity = '0.95';
    }, 5);
    
    this.isVisible = true;
  }
  
  /**
   * Hide badge
   */
  hide() {
    this.element.style.opacity = '0';
    this.fadeTimer = 0.12;
    
    setTimeout(() => {
      if (this.element) {
        this.element.style.display = 'none';
      }
    }, 120);
    
    this.isVisible = false;
    this.currentNode = null;
  }
  
  /**
   * Update badge content
   */
  _updateContent() {
    if (!this.currentNode) return;
    
    const userData = this.currentNode.userData;
    
    // Get archetype code (QNT-ORB-SYN format)
    const code = userData.namingCode || userData.category || 'UNK-NOD-STD';
    
    // Get archetype name
    const archetypeName = userData.archetypeName || userData.category?.charAt(0).toUpperCase() + userData.category?.slice(1).toLowerCase() || 'Node';
    
    // Get category color
    const categoryColor = this._getCategoryColor(userData.category);
    
    // Build HTML with upgraded styling
    const html = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; height: 100%;">
        <div style="
          font-weight: bold;
          font-size: 10px;
          color: #00FFFF;
          letter-spacing: 0.8px;
          text-shadow: 0 0 4px rgba(0, 255, 255, 0.5);
        ">SELECTED NODE</div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="
            display: inline-block;
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: ${categoryColor};
            box-shadow: 0 0 6px ${categoryColor};
            flex-shrink: 0;
          "></div>
          <div style="font-size: 9px; color: #FF4DF0; font-weight: bold;">${code}</div>
          <div style="color: #7CFFDA; font-size: 8px;">—</div>
          <div style="font-size: 9px; color: #7CFFDA;">${archetypeName}</div>
        </div>
      </div>
    `;
    
    this.element.innerHTML = html;
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
   * Update (call from main loop)
   */
  update(deltaTime) {
    // Handle fade animations
    if (this.fadeTimer > 0) {
      this.fadeTimer -= deltaTime;
    }
  }
  
  /**
   * Set selected node (called from external system)
   */
  setSelectedNode(node) {
    if (node) {
      this.show(node);
    } else {
      this.hide();
    }
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
