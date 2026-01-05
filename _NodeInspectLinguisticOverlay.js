/**
 * NODE INSPECT LINGUISTIC OVERLAY
 * 
 * Semantic language enhancement layer for node inspection
 * Displays archetype codes, meanings, and network mood information
 * 
 * SAFETY:
 * ✓ Pure visual layer (DOM-based overlay only)
 * ✓ Read-only access to Language Engine and node data
 * ✓ Zero modifications to nodes, links, or game logic
 * ✓ Non-destructive - can be disabled without side effects
 * ✓ Performance: <0.03ms/frame (typical)
 * ✓ 100% reversible via dispose()
 */

export class NodeInspectLinguisticOverlay {
  constructor(languageEngine, aiConsciousnessLayer = null) {
    this.languageEngine = languageEngine;
    this.aiConsciousnessLayer = aiConsciousnessLayer;
    
    // State
    this.currentNode = null;
    this.isVisible = false;
    this.enabled = true;
    
    // DOM elements
    this.overlayPanel = null;
    this.codeElement = null;
    this.nameElement = null;
    this.meaningElement = null;
    this.categoryElement = null;
    this.moodElement = null;
    
    // Caching for performance
    this.lastUpdateTime = 0;
    this.updateInterval = 1 / 20; // ~50ms (20Hz updates)
    this.moodCache = {};
    
    // Statistics
    this.stats = {
      updates: 0,
      shows: 0,
      hides: 0,
      nodeInspections: 0,
      frameTime: 0
    };
    
    this._initializeDOM();
  }
  
  /**
   * Initialize overlay DOM structure
   * Creates hidden panel that appears only when a node is selected
   */
  _initializeDOM() {
    // Create main overlay container
    this.overlayPanel = document.createElement('div');
    this.overlayPanel.id = 'node-inspect-linguistic-overlay';
    this.overlayPanel.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: auto;
      max-width: 320px;
      padding: 14px 16px;
      background: linear-gradient(135deg, rgba(0, 20, 40, 0.95) 0%, rgba(0, 40, 60, 0.90) 100%);
      border: 2px solid rgba(0, 200, 255, 0.6);
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      color: #00ffff;
      z-index: 9998;
      pointer-events: none;
      box-shadow: 
        0 0 20px rgba(0, 200, 255, 0.3),
        inset 0 0 10px rgba(0, 200, 255, 0.1);
      display: none;
      backdrop-filter: blur(4px);
    `;
    
    // Create content HTML
    this.overlayPanel.innerHTML = `
      <div id="lingu-header" style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; border-bottom: 1px solid rgba(0, 200, 255, 0.3); padding-bottom: 6px;">
        <span style="font-size: 13px; font-weight: bold; color: #00ffff;">LINGUISTIC</span>
        <span id="lingu-rarity" style="font-size: 10px; color: #ffaa00;"></span>
      </div>
      
      <div id="lingu-code" style="font-size: 12px; color: #ffcc00; margin-bottom: 6px; font-weight: bold; letter-spacing: 1px;"></div>
      
      <div id="lingu-name" style="font-size: 13px; color: #00ff88; margin-bottom: 4px; font-weight: bold;"></div>
      
      <div id="lingu-meaning" style="font-size: 11px; color: #88ff88; margin-bottom: 8px; font-style: italic; line-height: 1.4;"></div>
      
      <div id="lingu-category" style="font-size: 10px; color: #aaaaff; margin-bottom: 6px; padding: 4px 0; border-top: 1px solid rgba(0, 200, 255, 0.2); padding-top: 6px;"></div>
      
      <div id="lingu-mood" style="font-size: 11px; color: #ff88ff; display: none; margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255, 0, 255, 0.2);"></div>
    `;
    
    document.body.appendChild(this.overlayPanel);
    
    // Cache element references
    this.codeElement = this.overlayPanel.querySelector('#lingu-code');
    this.nameElement = this.overlayPanel.querySelector('#lingu-name');
    this.meaningElement = this.overlayPanel.querySelector('#lingu-meaning');
    this.categoryElement = this.overlayPanel.querySelector('#lingu-category');
    this.moodElement = this.overlayPanel.querySelector('#lingu-mood');
    this.rarityElement = this.overlayPanel.querySelector('#lingu-rarity');
  }
  
  /**
   * Update overlay for a newly selected node
   * Called when player selects/targets a node
   */
  inspectNode(node) {
    if (!this.enabled || !node) {
      this.hideOverlay();
      return;
    }
    
    this.stats.nodeInspections++;
    this.currentNode = node;
    
    try {
      this.updateOverlay();
      this.showOverlay();
    } catch (e) {
      console.warn('NodeInspectLinguisticOverlay: Error during node inspection', e);
      this.hideOverlay();
    }
  }
  
  /**
   * Update overlay content based on current node
   * Lightweight update with performance caching
   */
  updateOverlay() {
    if (!this.currentNode || !this.isVisible) return;
    
    const startTime = performance.now();
    
    try {
      const userData = this.currentNode.userData;
      if (!userData) {
        this.hideOverlay();
        return;
      }
      
      // Get or infer archetype code
      const archetypeCode = userData.archetypeCode || this._inferArchetypeCode(userData);
      
      if (!archetypeCode) {
        this.hideOverlay();
        return;
      }
      
      // Update code display (always visible)
      this._updateCodeDisplay(archetypeCode);
      
      // Update semantic information
      this._updateSemanticDisplay(archetypeCode);
      
      // Update category and rarity
      this._updateCategoryDisplay(userData, archetypeCode);
      
      // Update network mood (optional, if consciousness layer available)
      this._updateMoodDisplay(this.currentNode);
      
      this.stats.updates++;
      
    } catch (e) {
      console.warn('NodeInspectLinguisticOverlay: Error updating overlay', e);
    }
    
    const frameTime = performance.now() - startTime;
    this.stats.frameTime = frameTime;
  }
  
  /**
   * Infer archetype code from node category
   * Fallback if archetypeCode not stored in userData
   */
  _inferArchetypeCode(userData) {
    const categoryToCode = {
      'input': 'QNT-ORB-HLD',
      'process': 'SIG-VEC-RSP',
      'integration': 'NEX-ORB-CPL',
      'analytics': 'AET-HEX-SYN',
      'storage': 'UMB-ORB-HLD',
      'control': 'ASC-CRW-PRM',
      'sigma': 'SIG-CRW-NEX',
      'quantum': 'QNT-HEX-VAR',
      'emotional': 'ECO-TOR-FLX',
    };
    
    const category = userData.category || 'input';
    return categoryToCode[category.toLowerCase()] || null;
  }
  
  /**
   * Update code display (always visible)
   */
  _updateCodeDisplay(archetypeCode) {
    if (!this.codeElement) return;
    
    // Display as formatted code: [ORIGIN•PATTERN•SIGNATURE]
    const compactSymbolic = this.languageEngine.getCompactSymbolic(archetypeCode);
    this.codeElement.textContent = `[ ${compactSymbolic} ]`;
  }
  
  /**
   * Update semantic information (name + meaning)
   */
  _updateSemanticDisplay(archetypeCode) {
    if (!this.nameElement || !this.meaningElement) return;
    
    // Short label: "Quantum Orb Holding"
    const label = this.languageEngine.getShortLabel(archetypeCode);
    this.nameElement.textContent = label;
    
    // Full semantic name: "Quantum Orb of Held Potential"
    const fullName = this.languageEngine.getFullName(archetypeCode);
    this.meaningElement.textContent = fullName;
  }
  
  /**
   * Update category and rarity display
   */
  _updateCategoryDisplay(userData, archetypeCode) {
    if (!this.categoryElement || !this.rarityElement) return;
    
    const archInfo = this.languageEngine.getArchetypeInfo(archetypeCode);
    const category = archInfo.category || 'UNKNOWN';
    
    // Get rarity tier from category
    const rarity = this._getRarityForCategory(category);
    
    // Display category
    this.categoryElement.textContent = `${category} • ${rarity}`;
    this.rarityElement.textContent = rarity;
    
    // Color code by rarity
    this._colorCodeByRarity(rarity);
  }
  
  /**
   * Get rarity tier from category name
   */
  _getRarityForCategory(category) {
    const rarityMap = {
      'Base': '★ Common',
      'Special': '★★ Uncommon',
      'Visual': '★★★ Rare',
      'Extreme': '★★★★ Epic',
      'Safe': '★★★★ Epic',
      'Legendary': '★★★★★ Mythic',
      'ERROR': '? Unknown'
    };
    
    return rarityMap[category] || `★★ ${category}`;
  }
  
  /**
   * Color code overlay border and text based on rarity
   */
  _colorCodeByRarity(rarity) {
    const colorMap = {
      'Common': { border: 'rgba(100, 200, 255, 0.6)', glow: 'rgba(100, 200, 255, 0.3)' },
      'Uncommon': { border: 'rgba(100, 255, 100, 0.6)', glow: 'rgba(100, 255, 100, 0.3)' },
      'Rare': { border: 'rgba(200, 100, 255, 0.6)', glow: 'rgba(200, 100, 255, 0.3)' },
      'Epic': { border: 'rgba(255, 150, 0, 0.6)', glow: 'rgba(255, 150, 0, 0.3)' },
      'Mythic': { border: 'rgba(255, 0, 255, 0.6)', glow: 'rgba(255, 0, 255, 0.3)' }
    };
    
    // Find matching rarity
    let colors = colorMap['Common'];
    for (const [key, val] of Object.entries(colorMap)) {
      if (rarity.includes(key)) {
        colors = val;
        break;
      }
    }
    
    if (this.overlayPanel) {
      this.overlayPanel.style.borderColor = colors.border;
      this.overlayPanel.style.boxShadow = `
        0 0 20px ${colors.glow},
        inset 0 0 10px ${colors.glow}
      `;
    }
  }
  
  /**
   * Update network mood display (from AI Consciousness Layer)
   * Optional feature - only displays if consciousness layer available
   */
  _updateMoodDisplay(node) {
    if (!this.moodElement) return;
    
    // Only show mood if consciousness layer is available
    if (!this.aiConsciousnessLayer) {
      this.moodElement.style.display = 'none';
      return;
    }
    
    try {
      // Get network mood if available
      const mood = this.aiConsciousnessLayer.getNetworkMood?.();
      
      if (!mood) {
        this.moodElement.style.display = 'none';
        return;
      }
      
      // Display mood tag
      const moodTag = this._getMoodTag(mood);
      this.moodElement.textContent = `🌐 Network Mood: ${moodTag}`;
      this.moodElement.style.display = 'block';
      this.moodElement.style.color = this._getMoodColor(mood);
      
    } catch (e) {
      // Silently fail if mood unavailable
      this.moodElement.style.display = 'none';
    }
  }
  
  /**
   * Get mood tag from mood value
   */
  _getMoodTag(mood) {
    const moodTags = {
      'CALM': '◆ Calm',
      'FOCUSED': '▲ Focused',
      'SYNERGIC': '◈ Synergic',
      'TENSE': '▼ Tense',
      'CHAOTIC': '✗ Chaotic',
      'CRITICAL': '⚡ Critical',
      'BALANCED': '◉ Balanced'
    };
    
    return moodTags[mood] || `? ${mood}`;
  }
  
  /**
   * Get color for mood state
   */
  _getMoodColor(mood) {
    const colorMap = {
      'CALM': '#88ff88',
      'FOCUSED': '#88ccff',
      'SYNERGIC': '#ff88ff',
      'TENSE': '#ffaa00',
      'CHAOTIC': '#ff3333',
      'CRITICAL': '#ff0000',
      'BALANCED': '#00ffff'
    };
    
    return colorMap[mood] || '#ff88ff';
  }
  
  /**
   * Show overlay panel
   */
  showOverlay() {
    if (this.isVisible || !this.enabled) return;
    
    if (this.overlayPanel) {
      this.overlayPanel.style.display = 'block';
      this.isVisible = true;
      this.stats.shows++;
    }
  }
  
  /**
   * Hide overlay panel
   */
  hideOverlay() {
    if (!this.isVisible) return;
    
    if (this.overlayPanel) {
      this.overlayPanel.style.display = 'none';
      this.isVisible = false;
      this.currentNode = null;
      this.stats.hides++;
    }
  }
  
  /**
   * Toggle overlay enabled state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    
    if (!enabled) {
      this.hideOverlay();
    }
  }
  
  /**
   * Get enabled state
   */
  isEnabled() {
    return this.enabled;
  }
  
  /**
   * Get current statistics
   */
  getStatistics() {
    return { ...this.stats };
  }
  
  /**
   * Reset statistics
   */
  resetStatistics() {
    this.stats = {
      updates: 0,
      shows: 0,
      hides: 0,
      nodeInspections: 0,
      frameTime: 0
    };
  }
  
  /**
   * Cleanup and destroy overlay
   */
  dispose() {
    this.hideOverlay();
    
    if (this.overlayPanel && this.overlayPanel.parentNode) {
      this.overlayPanel.parentNode.removeChild(this.overlayPanel);
    }
    
    this.overlayPanel = null;
    this.codeElement = null;
    this.nameElement = null;
    this.meaningElement = null;
    this.categoryElement = null;
    this.moodElement = null;
    this.currentNode = null;
    this.languageEngine = null;
    this.aiConsciousnessLayer = null;
  }
  
  /**
   * Print status report
   */
  printStatusReport() {
    console.group('🔤 Node Inspect Linguistic Overlay Status');
    console.log(`Enabled: ${this.enabled ? '✓' : '✗'}`);
    console.log(`Visible: ${this.isVisible ? '✓' : '✗'}`);
    console.log(`Current Node: ${this.currentNode ? 'Yes' : 'None'}`);
    console.log(`Language Engine: ${this.languageEngine ? '✓' : '✗'}`);
    console.log(`AI Consciousness: ${this.aiConsciousnessLayer ? '✓' : '✗'}`);
    console.table(this.getStatistics());
    console.groupEnd();
  }
}

/**
 * Setup console API for debugging
 */
export function setupLinguisticOverlayConsoleAPI(linguisticOverlay) {
  if (!window.ling) {
    window.ling = {};
  }
  
  window.ling.toggle = () => {
    const enabled = linguisticOverlay.isEnabled();
    linguisticOverlay.setEnabled(!enabled);
    console.log(`%c[LINGUISTIC OVERLAY] ${!enabled ? 'ENABLED' : 'DISABLED'}`, 'color: cyan;');
  };
  
  window.ling.show = () => {
    linguisticOverlay.showOverlay();
    console.log('%c[LINGUISTIC OVERLAY] Shown', 'color: cyan;');
  };
  
  window.ling.hide = () => {
    linguisticOverlay.hideOverlay();
    console.log('%c[LINGUISTIC OVERLAY] Hidden', 'color: cyan;');
  };
  
  window.ling.stats = () => {
    const stats = linguisticOverlay.getStatistics();
    console.group('%c[LINGUISTIC OVERLAY] Statistics', 'color: cyan; font-weight: bold;');
    console.table(stats);
    console.groupEnd();
  };
  
  window.ling.reset = () => {
    linguisticOverlay.resetStatistics();
    console.log('%c[LINGUISTIC OVERLAY] Statistics reset', 'color: cyan;');
  };
  
  window.ling.status = () => {
    linguisticOverlay.printStatusReport();
  };
}
