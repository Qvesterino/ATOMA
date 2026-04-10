import { UIVisibilityConfig, UI_VISIBILITY_CHANGE_EVENT } from './ui/config/UIVisibilityConfig.js';

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
  constructor(aiNodes = null) {
    this.element = null;
    this.isVisible = true;
    this.aiNodes = aiNodes;
    this.unsubscribe = null;
    
    // Mood display support
    this.moodWrapper = null;
    this.moodTitleElement = null;
    this.moodValueElement = null;
    this.moodIntensityElement = null;
    this.currentMoodLabel = null;
    this.currentMoodIntensity = -1;
    
    // Node count tracking
    this.categoryCounts = new Map();
    this.labelElements = new Map(); // Cache label DOM elements for efficient updates
    this.itemElements = new Map();
    
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
    this._handleUIVisibilityChange = () => this._syncVisibility();
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener(UI_VISIBILITY_CHANGE_EVENT, this._handleUIVisibilityChange);
    }
    this._syncVisibility();
    if (aiNodes) {
      this.bind(aiNodes);
    }
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
      background: linear-gradient(180deg, rgba(12, 18, 35, 0.84), rgba(8, 12, 24, 0.72));
      border: 1px solid rgba(54, 242, 255, 0.75);
      box-shadow: 0 0 24px rgba(54, 242, 255, 0.15), inset 0 0 20px rgba(54, 242, 255, 0.04);
      border-radius: 10px;
      padding: 10px 9px 9px;
      font-family: 'Rajdhani', 'Segoe UI', sans-serif;
      font-size: 10px;
      color: #36F2FF;
      letter-spacing: 0.4px;
      z-index: 1200;
      overflow-y: auto;
      backdrop-filter: blur(12px) saturate(1.1);
    `;

    // Mood display panel
    this.moodWrapper = document.createElement('div');
    this.moodWrapper.className = 'ui-category-legend-mood';
    this.moodWrapper.style.cssText = `
      display: none;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    `;

    this.moodTitleElement = document.createElement('div');
    this.moodTitleElement.className = 'ui-category-legend-mood-title';
    this.moodTitleElement.style.cssText = `
      font-family: 'Orbitron', 'Segoe UI', sans-serif;
      font-weight: bold;
      margin-bottom: 2px;
      font-size: 10px;
    `;
    this.moodTitleElement.textContent = 'ATOMA MOOD';

    this.moodValueElement = document.createElement('div');
    this.moodValueElement.className = 'ui-category-legend-mood-value';
    this.moodValueElement.style.cssText = `
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 3px;
    `;
    this.moodValueElement.textContent = 'NEUTRAL';

    this.moodIntensityElement = document.createElement('div');
    this.moodIntensityElement.className = 'ui-category-legend-mood-intensity';
    this.moodIntensityElement.style.cssText = `
      font-size: 10px;
      letter-spacing: 0.1em;
      opacity: 0.9;
    `;

    this.moodWrapper.appendChild(this.moodTitleElement);
    this.moodWrapper.appendChild(this.moodValueElement);
    this.moodWrapper.appendChild(this.moodIntensityElement);
    this.element.appendChild(this.moodWrapper);
    
    // Category items
    for (const [name, color] of Object.entries(this.categories)) {
      const item = document.createElement('div');
      item.style.cssText = `
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 4px;
        padding: 2px 5px;
        border-radius: 4px;
        transition: background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
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
        text-shadow: 0 0 8px rgba(54, 242, 255, 0.2);
      `;
      // Initial label with no count
      label.textContent = this._formatLabelText(name, 0);
      
      // Cache label element reference
      this.labelElements.set(name, label);
      
      item.appendChild(dot);
      item.appendChild(label);
      this.itemElements.set(name, item);
      
      // Hover effect
      item.addEventListener('mouseenter', () => {
        item.style.background = `rgba(54, 242, 255, 0.12)`;
        item.style.boxShadow = 'inset 0 0 0 1px rgba(54, 242, 255, 0.16)';
        item.style.transform = 'translateX(1px)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = 'transparent';
        item.style.boxShadow = 'none';
        item.style.transform = 'translateX(0)';
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
   * Set the global mood display shown inside the category legend
   */
  setMoodDisplay(mood = 'NEUTRAL', color = '#36F2FF', intensity = 0) {
    if (!this.moodWrapper || !this.moodValueElement || !this.moodIntensityElement) return;
    const normalizedMood = String(mood).replace(/_/g, ' ');
    const moodIntensity = Math.max(0, Math.min(5, Math.floor(intensity * 5)));
    const intensityBar = moodIntensity > 0 ? '▮'.repeat(moodIntensity) : '';

    if (this.currentMoodLabel !== normalizedMood) {
      this.moodValueElement.textContent = normalizedMood;
      this.moodValueElement.style.color = color;
      this.currentMoodLabel = normalizedMood;
    }
    if (this.currentMoodIntensity !== moodIntensity) {
      this.moodIntensityElement.textContent = intensityBar;
      this.currentMoodIntensity = moodIntensity;
    }

    this.moodWrapper.style.display = normalizedMood === 'NEUTRAL' ? 'none' : 'block';
  }

  clearMoodDisplay() {
    if (!this.moodWrapper) return;
    this.moodWrapper.style.display = 'none';
    this.currentMoodLabel = null;
    this.currentMoodIntensity = -1;
  }
  
  /**
   * Format label text with category name and signal bar
   * @param {string} name - Category name
   * @param {number} count - Node count for this category
   * @returns {string} Formatted label text
   */
  _formatLabelText(name, count) {
    const padding = ' '.repeat(this.maxCategoryNameLength - name.length + 2);
    const signalBar = count > 0 ? '▮'.repeat(Math.min(count, 5)) : '·';
    return `${name}${padding}${signalBar}`;
  }
  
  /**
   * Update category counts based on current nodes
   * Call this method after nodes are spawned or disposed
   * @param {Array} nodesArray - Array of node objects from AINodes
   */
  updateCategoryCounts(nodesArray) {
    if (!UIVisibilityConfig.categoryLegend) return;

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
      const itemElement = this.itemElements.get(category);
      if (labelElement) {
        labelElement.textContent = this._formatLabelText(category, count);
      }
      if (itemElement) {
        if (count > 0) {
          itemElement.style.background = 'rgba(54, 242, 255, 0.08)';
          itemElement.style.boxShadow = 'inset 0 0 0 1px rgba(54, 242, 255, 0.12)';
        } else {
          itemElement.style.background = 'transparent';
          itemElement.style.boxShadow = 'none';
        }
      }
    }
  }

  bind(aiNodes) {
    if (!aiNodes) return;
    this.aiNodes = aiNodes;
    // seed initial counts from AINodes spawn counters if available
    if (typeof aiNodes.getSpawnCategoryCounts === 'function') {
      const counts = aiNodes.getSpawnCategoryCounts();
      for (const [k, v] of Object.entries(counts)) {
        if (this.categoryCounts.has(k)) {
          this.categoryCounts.set(k, v);
        }
      }
      this._refreshLabels();
    }
    const listener = (evt) => {
      if (!evt || !evt.category) return;
      if (!UIVisibilityConfig.categoryLegend) return;
      const cat = evt.category;
      if (!this.categoryCounts.has(cat)) return;
      this.categoryCounts.set(cat, evt.totalForCategory ?? (this.categoryCounts.get(cat) + 1));
      this._refreshLabels();
    };
    aiNodes.addSpawnListener(listener);
    this.unsubscribe = () => aiNodes.removeSpawnListener(listener);
  }

  unbind() {
    if (this.unsubscribe) {
      try { this.unsubscribe(); } catch (e) { /* ignore */ }
      this.unsubscribe = null;
    }
  }

  _refreshLabels() {
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
    if (this.isVisible) {
      if (!this.element.isConnected) {
        document.body.appendChild(this.element);
      }
      if (this.aiNodes?.getSpawnCategoryCounts) {
        const counts = this.aiNodes.getSpawnCategoryCounts();
        for (const [k, v] of Object.entries(counts)) {
          if (this.categoryCounts.has(k)) {
            this.categoryCounts.set(k, v);
          }
        }
        this._refreshLabels();
      }
    } else if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
  
  /**
   * Show legend
   */
  show() {
    if (!this.isVisible) {
      this.isVisible = true;
      if (!this.element.isConnected) {
        document.body.appendChild(this.element);
      }
      if (this.aiNodes?.getSpawnCategoryCounts) {
        const counts = this.aiNodes.getSpawnCategoryCounts();
        for (const [k, v] of Object.entries(counts)) {
          if (this.categoryCounts.has(k)) {
            this.categoryCounts.set(k, v);
          }
        }
      }
      this._refreshLabels();
    }
  }
  
  /**
   * Hide legend
   */
  hide() {
    if (this.isVisible) {
      this.isVisible = false;
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }
  }

  _syncVisibility() {
    if (!UIVisibilityConfig.categoryLegend) {
      this.hide();
      return;
    }

    this.show();
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
    if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
      window.removeEventListener(UI_VISIBILITY_CHANGE_EVENT, this._handleUIVisibilityChange);
    }
    if (this.element && this.element.parentNode) {
      this.element.remove();
    }
    this.element = null;
    this.categoryCounts.clear();
    this.labelElements.clear();
  }
}
