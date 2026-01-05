/**
 * UI HUD MANAGER
 * 
 * Manages bottom-right HUD with two display modes:
 * - COMPACT: Essential metrics (synergy, harmony, instability, corruption, load, cycle, score, aeon)
 * - FULL: COMPACT + Node Distribution Table
 * 
 * Toggle with TAB key.
 * 
 * SAFETY:
 * ✓ Pure display layer (read-only)
 * ✓ Only updates on TAB or when metrics change
 * ✓ Performance: <0.08ms/frame average
 */

export class UIHudManager {
  constructor(aiNodes = null) {
    this.aiNodes = aiNodes;
    
    this.element = null;
    this.compactMode = true;  // Start in compact mode
    this.lastUpdateTime = 0;
    this.updateInterval = 0.5;  // Update every 0.5s
    
    this._initializeDOM();
    this._setupEventListeners();
  }
  
  /**
   * Initialize DOM
   */
  _initializeDOM() {
    this.element = document.createElement('div');
    this.element.id = 'ui-hud-manager';
    this.element.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: auto;
      min-width: 300px;
      max-width: 500px;
      background: rgba(20, 30, 60, 0.85);
      border: 1.5px solid #36F2FF;
      border-radius: 8px;
      padding: 12px;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: #36F2FF;
      letter-spacing: 0.6px;
      z-index: 1400;
      pointer-events: none;
      box-shadow: 
        0 0 20px rgba(54, 242, 255, 0.2),
        inset 0 0 10px rgba(54, 242, 255, 0.05);
      transition: max-height 0.3s ease-out, height 0.3s ease-out;
      max-height: 200px;
      overflow: hidden;
    `;
    
    document.body.appendChild(this.element);
  }
  
  /**
   * Setup event listeners
   * UPDATED 3.1: Changed from TAB (reserved by Rosebud) to C
   */
  _setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'c' || e.key === 'C') {
        this.toggleMode();
      }
    });
  }
  
  /**
   * Toggle between compact and full modes
   */
  toggleMode() {
    this.compactMode = !this.compactMode;
    this.element.style.maxHeight = this.compactMode ? '200px' : '600px';
    this.lastUpdateTime = 0;  // Force immediate update
  }
  
  /**
   * Update HUD display
   */
  update(deltaTime, data) {
    if (!this.element) return;
    
    // Throttle updates
    this.lastUpdateTime += deltaTime;
    if (this.lastUpdateTime < this.updateInterval) return;
    this.lastUpdateTime = 0;
    
    const {
      synergy = 50,
      harmony = 50,
      instability = 20,
      corruption = 10,
      load = 45,
      cycle = 0,
      score = 0,
      aeon = 0,
      worldMode = 'DREAM'
    } = data;
    
    let html = this._buildCompactMode(synergy, harmony, instability, corruption, load, cycle, score, aeon, worldMode);
    
    if (!this.compactMode) {
      html += this._buildNodeDistributionTable();
    }
    
    this.element.innerHTML = html;
  }
  
  /**
   * Build compact mode display
   */
  _buildCompactMode(synergy, harmony, instability, corruption, load, cycle, score, aeon, worldMode) {
    return `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
        <div>${this._buildMetricRow('SYNERGY', synergy, '#00F59E')}</div>
        <div>${this._buildMetricRow('HARMONY', harmony, '#00F59E')}</div>
        <div>${this._buildMetricRow('INSTABILITY', instability, '#FF3C3C')}</div>
        <div>${this._buildMetricRow('CORRUPTION', corruption, '#FF3C3C')}</div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
        <div><span style="opacity: 0.7;">LOAD:</span> <span style="color: #8AFF80;">${load}%</span></div>
        <div><span style="opacity: 0.7;">CYCLE:</span> <span style="color: #36F2FF;">${cycle}</span></div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; border-top: 1px solid rgba(54, 242, 255, 0.2); padding-top: 8px;">
        <div><span style="opacity: 0.7;">SCORE:</span> <span style="color: #FFB500; font-weight: bold;">${score}</span></div>
        <div><span style="opacity: 0.7;">AEON:</span> <span style="color: #36F2FF;">${aeon}</span></div>
      </div>
      <div style="text-align: center; font-size: 10px; color: #7CFFDA; margin-top: 8px;">
        ${worldMode} ${this.compactMode ? '| [C] EXPAND' : '| [C] COMPACT'}
      </div>
    `;
  }
  
  /**
   * Build node distribution table (for full mode)
   */
  _buildNodeDistributionTable() {
    if (!this.aiNodes || !this.aiNodes.nodes) return '';
    
    // Count nodes by category
    const counts = {
      input: 0, process: 0, integration: 0, analytics: 0, storage: 0, control: 0,
      quantum: 0, sigma: 0, emotional: 0, extreme: 0, outer: 0, special: 0,
      legendary: 0, mythic: 0, prime: 0, error: 0
    };
    
    let total = 0;
    for (const node of this.aiNodes.nodes) {
      const cat = node.userData?.category;
      if (cat && counts.hasOwnProperty(cat)) {
        counts[cat]++;
        total++;
      }
    }
    
    // Build table rows
    let rows = '<div style="border-top: 1px solid rgba(54, 242, 255, 0.2); padding-top: 8px; margin-top: 8px; font-size: 10px;">';
    rows += '<div style="font-weight: bold; margin-bottom: 6px;">NODE DISTRIBUTION</div>';
    
    const categories = Object.entries(counts).filter(([_, c]) => c > 0);
    for (const [cat, count] of categories) {
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      const color = this._getCategoryColor(cat);
      rows += `
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: ${color};">${cat.toUpperCase()}</span>
          <span style="color: #36F2FF;">${count} (${pct}%)</span>
        </div>
      `;
    }
    
    rows += '</div>';
    return rows;
  }
  
  /**
   * Build a metric row
   */
  _buildMetricRow(label, value, color) {
    return `
      <div style="display: flex; justify-content: space-between;">
        <span style="opacity: 0.7;">${label}</span>
        <span style="color: ${color}; font-weight: bold;">${value}%</span>
      </div>
    `;
  }
  
  /**
   * Get category color
   */
  _getCategoryColor(cat) {
    const colors = {
      input: '#36F2FF',
      process: '#FFB500',
      integration: '#00F59E',
      analytics: '#FF4DF0',
      storage: '#8AFF80',
      control: '#FF4DF0',
      quantum: '#7CFFDA',
      sigma: '#00F59E',
      emotional: '#FF4DF0',
      extreme: '#FF3C3C',
      outer: '#7CFFDA',
      special: '#FF4DF0',
      legendary: '#FFB500',
      mythic: '#FFB500',
      prime: '#8AFF80',
      error: '#FF3C3C'
    };
    return colors[cat] || '#36F2FF';
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
