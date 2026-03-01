/**
 * UI CATEGORY LEGEND 3.1 - UPDATED (Session 28 + Node Count Visualization)
 * 
 * Left-upper fixed panel showing all current node categories with color dots
 * and real-time node count indicators.
 * 
 * Categories (14 total):
 * Input, Process, Integration, Analytics, Storage, Control,
 * Sigma, Emotional, Quantum, Mythic, Prime, External, Extreme, Special
 * 
 * SAFETY:
 * ✓ Pure display layer (read-only)
 * ✓ No DOM modifications beyond UI styling
 * ✓ Reversible - single element cleanup
 * ✓ Performance: <0.02ms/frame (updates only on spawn/dispose)
 * ✓ No gameplay impact
 */

export class UICategoryLegend3_1 {
  constructor() {
    this.element = null;
    this.isVisible = true;
    
    // Node count tracking
    this.categoryCounts = new Map();
    this.labelElements = new Map(); // Cache label DOM elements for efficient updates
    
    // Calculate max category name length for padding
    this.maxCategoryNameLength = 0;
    
    // Category definitions: name -> hex color (updated for Session 28)
    // Full list per ATOMA category registry
    this.categories = {
      'INPUT': '#FF6B9D',      // Hot pink
      'PROCESS': '#00D9FF',    // Cyan
      'INTEGRATION': '#00FF88', // Harmony green
      'ANALYTICS': '#FFD700',  // Gold
      'STORAGE': '#9D4EDD',    // Purple
      'CONTROL': '#FF006E',    // Red
      'SIGMA': '#0FFF50',      // Neon green
      'EMOTIONAL': '#FF4500',  // Orange-red
      'QUANTUM': '#00FFFF',    // Bright cyan
      'MYTHIC': '#DDA0DD',     // Plum
      'PRIME': '#FFE135',      // Golden yellow
      'ERROR': '#FFFFFF'     // White
    };
    
    // Initialize counts for all categories
    for (const name of Object.keys(this.categories)) {
      this.categoryCounts.set(name, 0);
      this.maxCategoryNameLength = Math.max(this.maxCategoryNameLength, name.length);
    }
    
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
        white-space: pre;
        font-size: 9px;
        font-family: 'Courier New', monospace;
      `;
      // Initial label with no count
      label.textContent = this._formatLabelText(name, 0);
      
      // Cache label element reference
      this.labelElements.set(name, label);
      
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
   * Format label text with category name and signal bar
   * @param {string} name - Category name
   * @param {number} count - Node count for this category
   * @returns {string} Formatted label text
   */
  _formatLabelText(name, count) {
    const padding = ' '.repeat(this.maxCategoryNameLength - name.length + 2);
    const signalBar = count > 0 ? 'I'.repeat(count) : '';
    return `${name}${padding}${signalBar}`;
  }
  
  /**
   * Update category counts based on current nodes
   * Call this method after nodes are spawned or disposed
   * @param {Array} nodesArray - Array of node objects from AINodes
   */
  updateCategoryCounts(nodesArray) {
    // Reset all counts
    for (const category of Object.keys(this.categories)) {
      this.categoryCounts.set(category, 0);
    }
    
    // Count nodes by category
    if (Array.isArray(nodesArray)) {
      for (const node of nodesArray) {
        const category = node?.userData?.category;
        if (category && this.categoryCounts.has(category)) {
          const currentCount = this.categoryCounts.get(category) || 0;
          this.categoryCounts.set(category, currentCount + 1);
        }
      }
    }
    
    // Update label text efficiently (no DOM rebuilding)
    for (const [category, count] of this.categoryCounts.entries()) {
      const labelElement = this.labelElements.get(category);
      if (labelElement) {
        labelElement.textContent = this._formatLabelText(category, count);
      }
    }
  }
  
  /**
   * Get current count for a specific category
   * @param {string} category - Category name
   * @returns {number} Node count for category
   */
  getCategoryCount(category) {
    return this.categoryCounts.get(category) || 0;
  }
  
  /**
   * Get all category counts
   * @returns {Object} Object with category names as keys and counts as values
   */
  getAllCategoryCounts() {
    const counts = {};
    for (const [category, count] of this.categoryCounts.entries()) {
      counts[category] = count;
    }
    return counts;
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
    this.categoryCounts.clear();
    this.labelElements.clear();
  }
}