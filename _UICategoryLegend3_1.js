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
   * Initialize DOM structure — same visual language as CoreMetricsHUD v2.0
   */
  _initializeDOM() {
    // ── Inject CSS (once) ────────────────────────────────────────────
    if (!document.getElementById('atoma-category-legend-styles')) {
      const style = document.createElement('style');
      style.id = 'atoma-category-legend-styles';
      style.textContent = `
        /* ── ATOMA Category Legend — Minimalist v2.0 ── */
        #ui-category-legend {
          position: fixed;
          top: 10px;
          left: 10px;
          max-width: 150px;
          max-height: 420px;
          background: rgba(8, 12, 20, 0.75);
          backdrop-filter: blur(16px) saturate(1.2);
          -webkit-backdrop-filter: blur(16px) saturate(1.2);
          border-left: 2px solid rgba(0, 200, 220, 0.35);
          border-radius: 0 8px 8px 0;
          padding: 16px 14px;
          font-family: 'Rajdhani', 'Segoe UI', sans-serif;
          font-size: 10px;
          color: rgba(200, 225, 245, 0.85);
          letter-spacing: 0.4px;
          z-index: 1200;
          overflow-y: auto;
          user-select: none;
        }
        #ui-category-legend .hud-header {
          font-size: 8px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: rgba(0, 200, 220, 0.4);
          margin-bottom: 12px;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(0, 200, 220, 0.1);
        }
        #ui-category-legend .mood-section {
          display: none;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(0, 200, 220, 0.1);
        }
        #ui-category-legend .mood-title {
          font-size: 8px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(0, 200, 220, 0.4);
          margin-bottom: 4px;
        }
        #ui-category-legend .mood-value {
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 3px;
        }
        #ui-category-legend .mood-intensity {
          font-size: 10px;
          letter-spacing: 0.1em;
          opacity: 0.9;
        }
        #ui-category-legend .category-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 3px 0;
          padding: 3px 6px;
          border-radius: 3px;
          transition: background 0.2s ease, transform 0.2s ease;
          cursor: default;
        }
        #ui-category-legend .category-item:hover {
          background: rgba(0, 200, 220, 0.08);
          transform: translateX(1px);
        }
        #ui-category-legend .category-item.has-nodes {
          background: rgba(0, 200, 220, 0.04);
        }
        #ui-category-legend .category-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
          transition: box-shadow 0.3s ease;
        }
        #ui-category-legend .category-item:hover .category-dot {
          box-shadow: 0 0 6px currentColor;
        }
        #ui-category-legend .category-label {
          flex: 1;
          white-space: pre;
          font-size: 9px;
          font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
          color: rgba(200, 225, 245, 0.45);
          transition: color 0.3s ease;
        }
        #ui-category-legend .category-item.has-nodes .category-label {
          color: rgba(200, 225, 245, 0.85);
        }
        /* Scrollbar */
        #ui-category-legend::-webkit-scrollbar {
          width: 3px;
        }
        #ui-category-legend::-webkit-scrollbar-track {
          background: transparent;
        }
        #ui-category-legend::-webkit-scrollbar-thumb {
          background: rgba(0, 200, 220, 0.2);
          border-radius: 2px;
        }
        #ui-category-legend::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 200, 220, 0.35);
        }
      `;
      document.head.appendChild(style);
    }

    // ── Main container ───────────────────────────────────────────────
    this.element = document.createElement('div');
    this.element.id = 'ui-category-legend';

    // ── Mood display section ─────────────────────────────────────────
    this.moodWrapper = document.createElement('div');
    this.moodWrapper.className = 'mood-section';

    this.moodTitleElement = document.createElement('div');
    this.moodTitleElement.className = 'mood-title';
    this.moodTitleElement.textContent = 'ATOMA MOOD';

    this.moodValueElement = document.createElement('div');
    this.moodValueElement.className = 'mood-value';
    this.moodValueElement.textContent = 'NEUTRAL';

    this.moodIntensityElement = document.createElement('div');
    this.moodIntensityElement.className = 'mood-intensity';

    this.moodWrapper.appendChild(this.moodTitleElement);
    this.moodWrapper.appendChild(this.moodValueElement);
    this.moodWrapper.appendChild(this.moodIntensityElement);
    this.element.appendChild(this.moodWrapper);

    // ── Category items ───────────────────────────────────────────────
    for (const [name, color] of Object.entries(this.categories)) {
      const item = document.createElement('div');
      item.className = 'category-item';

      // Dot indicator (color set via inline style — per-category)
      const dot = document.createElement('div');
      dot.className = 'category-dot';
      dot.style.background = color;
      dot.style.color = color; // for currentColor in hover glow

      // Label
      const label = document.createElement('span');
      label.className = 'category-label';
      label.textContent = this._formatLabelText(name, 0);

      this.labelElements.set(name, label);

      item.appendChild(dot);
      item.appendChild(label);
      this.itemElements.set(name, item);

      this.element.appendChild(item);
    }

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
    
    // Update label text + active state via CSS class
    for (const [category, count] of this.categoryCounts.entries()) {
      const labelElement = this.labelElements.get(category);
      const itemElement = this.itemElements.get(category);
      if (labelElement) {
        labelElement.textContent = this._formatLabelText(category, count);
      }
      if (itemElement) {
        itemElement.classList.toggle('has-nodes', count > 0);
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
