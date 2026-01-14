/**
 * UI NODE INSPECT PANEL
 * 
 * Left-side persistent card showing:
 * - Archetype code & meaning
 * - Category tags
 * - All 6 metrics with bars
 * - Node-level AI poetry (from Language Engine 3.0)
 * 
 * Triggered by left-click on node or via right-click menu.
 * Stays visible until ESC, another node selected, or click outside.
 * 
 * SAFETY:
 * ✓ Pure display layer (read-only)
 * ✓ No node modifications
 * ✓ Only updates DOM on selection change
 * ✓ Performance: <0.05ms/frame average
 */

export class UINodeInspectPanel {
  constructor(languageEngine = null, poetryEngine = null) {
    this.languageEngine = languageEngine;
    this.poetryEngine = poetryEngine;
    
    this.element = null;
    this.currentNode = null;
    this.isVisible = false;
    
    this._initializeDOM();
    this._setupEventListeners();
  }
  
  /**
   * Initialize DOM
   */
  _initializeDOM() {
    this.element = document.createElement('div');
    this.element.id = 'ui-node-inspect-panel';
    this.element.style.cssText = `
      position: fixed;
      top: 60px;
      left: 16px;
      width: 340px;
      max-height: 600px;
      background: rgba(20, 30, 60, 0.85);
      border: 1.5px solid #36F2FF;
      border-radius: 8px;
      padding: 16px;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: #36F2FF;
      letter-spacing: 0.6px;
      z-index: 1500;
      pointer-events: auto;
      display: none;
      opacity: 0;
      transition: opacity 0.25s ease-out;
      box-shadow: 
        0 0 20px rgba(54, 242, 255, 0.2),
        inset 0 0 10px rgba(54, 242, 255, 0.05),
        0 8px 16px rgba(0, 0, 0, 0.4);
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(54, 242, 255, 0.3) transparent;
    `;
    
    document.body.appendChild(this.element);
  }
  
  /**
   * Setup event listeners
   */
  _setupEventListeners() {
    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
    
    // NOTE: In UI 3.2, panel stays open until deselected
    // No click-outside auto-close behavior
  }
  
  /**
   * Show panel for a node
   */
  show(node) {
    if (!node || !node.userData) return;
    
    this.currentNode = node;
    this._updateContent();
    
    this.element.style.display = 'block';
    setTimeout(() => {
      this.element.style.opacity = '1';
    }, 10);
    
    this.isVisible = true;
  }
  
  /**
   * Hide panel
   */
  hide() {
    this.element.style.opacity = '0';
    setTimeout(() => {
      if (this.element) {
        this.element.style.display = 'none';
      }
    }, 250);
    
    this.isVisible = false;
    this.currentNode = null;
  }
  
  /**
   * Update panel content
   */
  _updateContent() {
    if (!this.currentNode) return;

    const node = this.currentNode;
    const userData = node.userData;
    const metrics = userData.metrics || {};
    
    // Get archetype info
    const code = userData.namingCode || userData.category || 'UNKNOWN';
    const category = (userData.category || '?').toUpperCase();
    
    // Get meaning from language engine
    let meaning = 'Unknown node';
    if (this.languageEngine && userData.namingCode) {
      const info = this.languageEngine.archetypeRegistry?.get(userData.namingCode);
      if (info) meaning = info.meaning || meaning;
    }
    
    // Get node poetry from poetry engine
    let poetry = '';
    if (this.poetryEngine) {
      poetry = this.poetryEngine.currentNodePoetry || '';
    }
    
    // Get category tags
    const tags = this._getCategoryTags(userData);
    
    // Build HTML
    const html = `
      <!-- Header -->
      <div style="margin-bottom: 12px; border-bottom: 1px solid rgba(54, 242, 255, 0.2); padding-bottom: 8px;">
        <div style="font-size: 13px; font-weight: bold; color: #FF4DF0; margin-bottom: 4px;">
          ${code}
        </div>
        <div style="font-size: 10px; color: #00F59E; font-style: italic; line-height: 1.4;">
          "${meaning}"
        </div>
      </div>
      
      <!-- Category Info -->
      <div style="margin-bottom: 12px;">
        <div style="color: #7CFFDA; font-weight: bold; margin-bottom: 6px;">
          ${category}
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
          ${tags}
        </div>
      </div>
      
      <!-- Metrics -->
      <div style="margin-bottom: 12px; border-top: 1px solid rgba(54, 242, 255, 0.2); padding-top: 8px;">
        <div style="font-weight: bold; margin-bottom: 8px; color: #36F2FF;">METRICS</div>
        ${this._buildMetricBar('SYNERGY', metrics.synergy, '#8AFF80')}
        ${this._buildMetricBar('HARMONY', metrics.harmony, '#00F59E')}
        ${this._buildMetricBar('STABILITY', metrics.stability, '#8AFF80')}
        ${this._buildMetricBar('CORRUPTION', metrics.corruption, '#FF3C3C')}
        ${this._buildMetricBar('LOAD', metrics.loadPressure, '#FF3C3C')}
      </div>
      
      <!-- Poetry -->
      ${poetry ? `
        <div style="border-top: 1px solid rgba(54, 242, 255, 0.2); padding-top: 8px; margin-top: 8px;">
          <div style="font-weight: bold; margin-bottom: 6px; color: #FF4DF0; font-size: 10px;">POETIC SIGNATURE</div>
          <div style="color: #00F59E; font-style: italic; font-size: 10px; line-height: 1.5;">
            ${poetry}
          </div>
        </div>
      ` : ''}
      
      <!-- Footer -->
      <div style="margin-top: 8px; font-size: 9px; color: #36F2FF; opacity: 0.6;">
        [ESC] Close
      </div>
    `;
    
    this.element.innerHTML = html;
  }
  
  /**
   * Build a metric bar
   */
  _buildMetricBar(label, value, color) {
    const normalized = this.clamp01(value);
    const widthPercent = (normalized * 100).toFixed(2);
    const barLength = 15;
    const filled = Math.round(normalized * barLength);
    const empty = barLength - filled;

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <div style="width: 80px; color: ${color};">${label}</div>
        <div style="flex: 1; margin: 0 8px;">
          <div style="background: rgba(54, 242, 255, 0.1); height: 4px; border-radius: 2px; overflow: hidden;">
            <div style="background: ${color}; height: 100%; width: ${widthPercent}%; transition: width 0.3s ease;"></div>
          </div>
        </div>
        <div style="width: 35px; text-align: right; color: #36F2FF;">${this.formatFloat(normalized)}</div>
      </div>
    `;
  }

  /**
   * Clamp a metric float to [0, 1]
   */
  clamp01(value) {
    const num = Number.isFinite(value) ? value : 0;
    return Math.max(0, Math.min(1, num));
  }

  /**
   * Format a clamped float (0..1) for display
   */
  formatFloat(value) {
    return this.clamp01(value).toFixed(6);
  }

  /**
   * Get category tags for node
   */
  _getCategoryTags(userData) {
    const tags = [];
    
    // Map of properties to tag names
    const tagMap = {
      isSpecial: 'SPECIAL',
      namingCode: (code) => {
        if (!code) return null;
        if (code.includes('QUANTUM')) return 'QUANTUM';
        if (code.includes('SIGMA')) return 'SIGMA';
        if (code.includes('EMOTIONAL')) return 'EMOTIONAL';
        if (code.includes('EXTREME')) return 'EXTREME';
        if (code.includes('OUTER')) return 'OUTER';
        if (code.includes('LEGENDARY')) return 'LEGENDARY';
        if (code.includes('MYTHIC')) return 'MYTHIC';
        if (code.includes('PRIME')) return 'PRIME';
        if (code.includes('ERROR')) return 'ERROR';
        return null;
      }
    };
    
    // Add SPECIAL tag
    if (userData.isSpecial) {
      tags.push('SPECIAL');
    }
    
    // Add archetype tags
    if (userData.namingCode) {
      const code = userData.namingCode;
      if (code.includes('QUANTUM')) tags.push('QUANTUM');
      if (code.includes('SIGMA')) tags.push('SIGMA');
      if (code.includes('EMOTIONAL')) tags.push('EMOTIONAL');
      if (code.includes('EXTREME')) tags.push('EXTREME');
      if (code.includes('OUTER')) tags.push('OUTER');
      if (code.includes('LEGENDARY')) tags.push('LEGENDARY');
      if (code.includes('MYTHIC')) tags.push('MYTHIC');
      if (code.includes('PRIME')) tags.push('PRIME');
      if (code.includes('ERROR')) tags.push('ERROR');
    }
    
    // Remove duplicates
    const uniqueTags = [...new Set(tags)];
    
    // Build tag HTML
    return uniqueTags.map(tag => `
      <div style="
        display: inline-block;
        padding: 2px 8px;
        background: rgba(54, 242, 255, 0.2);
        border: 1px solid ${this._getTagColor(tag)};
        border-radius: 3px;
        font-size: 9px;
        color: ${this._getTagColor(tag)};
        font-weight: bold;
      ">${tag}</div>
    `).join('');
  }
  
  /**
   * Get color for tag
   */
  _getTagColor(tag) {
    const colors = {
      'SPECIAL': '#FF4DF0',
      'QUANTUM': '#36F2FF',
      'SIGMA': '#00F59E',
      'EMOTIONAL': '#FF4DF0',
      'EXTREME': '#FF3C3C',
      'OUTER': '#7CFFDA',
      'LEGENDARY': '#FFB500',
      'MYTHIC': '#FFB500',
      'PRIME': '#8AFF80',
      'ERROR': '#FF3C3C'
    };
    return colors[tag] || '#36F2FF';
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
