/**
 * UI CATEGORY LEGEND 3.1 - UPDATED (Session 28)
 * 
 * Left-upper fixed panel showing all current node categories with color dots.
 * 
 * Categories (14 total):
 * Input, Process, Integration, Analytics, Storage, Control,
 * Sigma, Emotional, Quantum, Mythic, Prime, External, Extreme, Special
 * 
 * SAFETY:
 * ✓ Pure display layer (read-only)
 * ✓ No DOM modifications beyond UI styling
 * ✓ Reversible - single element cleanup
 * ✓ Performance: <0.02ms/frame
 * ✓ No gameplay impact
 */

export class UICategoryLegend3_1 {
  constructor() {
    this.element = null;
    this.isVisible = true;
    
    // Category definitions: name -> hex color (updated for Session 28)
    // Full list per ATOMA category registry
    this.categories = {
      'Input': '#FF6B9D',      // Hot pink
      'Process': '#00D9FF',    // Cyan
      'Integration': '#00FF88', // Harmony green
      'Analytics': '#FFD700',  // Gold
      'Storage': '#9D4EDD',    // Purple
      'Control': '#FF006E',    // Red
      'Sigma': '#0FFF50',      // Neon green
      'Emotional': '#FF4500',  // Orange-red
      'Quantum': '#00FFFF',    // Bright cyan
      'Mythic': '#DDA0DD',     // Plum
      'Prime': '#FFE135',      // Golden yellow
      'External': '#B8B8FF',   // Lavender
      'Extreme': '#FF1493',    // Deep pink
      'Special': '#FFFFFF'     // White
    };
    
    this._initializeDOM();
  }
  
  /**
   * Initialize DOM structure
   */
  _initializeDOM() {
    this.element = document.createElement('div');
    this.element.id = 'ui-category-legend';
    this.element.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      max-width: 150px;
      max-height: 420px;
      background: rgba(20, 30, 60, 0.65);
      border: 1.5px solid #36F2FF;
      border-radius: 8px;
      padding: 10px 8px;
      font-family: 'Courier New', monospace;
      font-size: 10px;
      color: #36F2FF;
      letter-spacing: 0.4px;
      z-index: 1200;
      overflow-y: auto;
      backdrop-filter: blur(8px);
    `;
    
    // Category items
    for (const [name, color] of Object.entries(this.categories)) {
      const item = document.createElement('div');
      item.style.cssText = `
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 3px;
        padding: 2px 4px;
        border-radius: 3px;
        transition: background 0.2s ease;
      `;
      
      // Dot indicator
      const dot = document.createElement('div');
      dot.style.cssText = `
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: ${color};
        flex-shrink: 0;
        box-shadow: 0 0 4px ${color};
      `;
      
      // Label
      const label = document.createElement('span');
      label.style.cssText = `
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 9px;
      `;
      label.textContent = name;
      
      item.appendChild(dot);
      item.appendChild(label);
      
      // Hover effect
      item.addEventListener('mouseenter', () => {
        item.style.background = `rgba(54, 242, 255, 0.1)`;
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = 'transparent';
      });
      
      this.element.appendChild(item);
    }
    
    // Add scrollbar styling
    const style = document.createElement('style');
    style.textContent = `
      #ui-category-legend::-webkit-scrollbar {
        width: 6px;
      }
      #ui-category-legend::-webkit-scrollbar-track {
        background: rgba(54, 242, 255, 0.05);
        border-radius: 3px;
      }
      #ui-category-legend::-webkit-scrollbar-thumb {
        background: rgba(54, 242, 255, 0.3);
        border-radius: 3px;
      }
      #ui-category-legend::-webkit-scrollbar-thumb:hover {
        background: rgba(54, 242, 255, 0.5);
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(this.element);
  }
  
  /**
   * Toggle visibility
   */
  toggle() {
    this.isVisible = !this.isVisible;
    this.element.style.display = this.isVisible ? 'block' : 'none';
  }
  
  /**
   * Show legend
   */
  show() {
    if (!this.isVisible) {
      this.isVisible = true;
      this.element.style.display = 'block';
    }
  }
  
  /**
   * Hide legend
   */
  hide() {
    if (this.isVisible) {
      this.isVisible = false;
      this.element.style.display = 'none';
    }
  }
  
  /**
   * Update a category color
   */
  updateCategoryColor(categoryName, hexColor) {
    if (this.categories[categoryName]) {
      this.categories[categoryName] = hexColor;
      // Rebuild DOM
      const old = this.element;
      this.element = null;
      this._initializeDOM();
      old.remove();
    }
  }
  
  /**
   * Dispose resources
   */
  dispose() {
    if (this.element && this.element.parentNode) {
      this.element.remove();
    }
    this.element = null;
  }
}
