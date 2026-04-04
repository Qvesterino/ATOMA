/**
 * SYNERGY TREND HUD 1.0 — Real-Time Link Trend Visualization
 * 
 * Advanced HUD overlay that displays comprehensive link quality trends by integrating
 * LinkHistoryTracker1_0 with visual trend indicators.
 * 
 * Features:
 * - Real-time trend visualization (rising/falling/stable)
 * - Color-coded trend states (green/red/cyan neon)
 * - Stability and lifetime quality scores
 * - Sparkline graph (last 10 samples)
 * - Volatility and decay tracking
 * - Selection-driven updates
 * - 500ms refresh interval
 * - 100% null-safe
 * 
 * Display Format:
 * ┌──────────────────────────────────┐
 * │ 📊 SYNERGY TREND                 │
 * │ Trend: ↑ Rising (Δ +0.03)       │
 * │ Stability: 0.82                  │
 * │ Lifetime: 0.76                   │
 * │ Volatility: 0.05                 │
 * │ Samples: 87                      │
 * │ ────────────────────────────────  │
 * │ [Sparkline graph]                │
 * └──────────────────────────────────┘
 * 
 * Integration:
 * - Requires LinkHistoryTracker1_0 instance (window.linkHistoryTracker)
 * - Requires link selection capability
 * - Updates when link selection changes or every 500ms
 * 
 * Usage:
 *   const trendHUD = new SynergyTrendHUD1_0(nodeLinker, scene);
 *   trendHUD.onLinkSelected(link);  // When link selection changes
 */

export class SynergyTrendHUD1_0 {
  /**
   * Initialize Synergy Trend HUD
   * 
   * @param {Object} nodeLinker - Reference to NodeLinkingSystem
   * @param {THREE.Scene} scene - Three.js scene
   */
  constructor(nodeLinker, scene) {
    this.nodeLinker = nodeLinker;
    this.scene = scene;
    
    this.visible = true;
    this.selectedLink = null;
    this.refreshInterval = 500; // ms
    
    this.container = null;
    this.canvasContainer = null;
    this.canvas = null;
    this.ctx = null;
    this.timer = null;
    
    // Color palette
    this.colors = {
      rising: '#4dff99',      // Green-cyan neon
      falling: '#ff4d88',     // Neon pink-red
      stable: '#00c8ff',      // Light cyan
      background: 'rgba(0, 10, 20, 0.75)',
      border: 'rgba(77, 255, 153, 0.4)',
      text: '#7DFFDD',
      secondary: '#44FFAA',
      grid: 'rgba(77, 255, 153, 0.1)',
      danger: '#FF6B6B',
    };
    
    this._init();
  }
  
  /**
   * Initialize DOM and styling
   * @private
   */
  _init() {
    // Create main container
    this.container = document.createElement('div');
    this.container.id = 'synergy-trend-hud';
    
    Object.assign(this.container.style, {
      position: 'fixed',
      top: '80px',           // Below selected HUD
      right: '15px',
      width: '340px',
      padding: '12px',
      borderRadius: '8px',
      background: this.colors.background,
      backdropFilter: 'blur(6px)',
      border: `1.5px solid ${this.colors.border}`,
      color: this.colors.text,
      fontSize: '11px',
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      zIndex: 9997,
      boxShadow: `0 0 20px ${this.colors.border}`,
      lineHeight: '1.4',
      display: 'none',  // Hidden by default
      overflow: 'hidden',
      maxHeight: '320px',
    });
    
    document.body.appendChild(this.container);
    this.start();
  }
  
  /**
   * Start rendering cycle
   */
  start() {
    this.timer = setInterval(() => this.render(), this.refreshInterval);
  }
  
  /**
   * Stop rendering cycle
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  
  /**
   * When a link is selected (called from link selection system)
   * 
   * @param {Object} link - Selected link object
   */
  onLinkSelected(link) {
    this.selectedLink = link;
    
    if (link && link.id) {
      this.container.style.display = 'block';
      this.render();
    } else {
      this.container.style.display = 'none';
    }
  }
  
  /**
   * Toggle HUD visibility
   */
  toggle() {
    this.visible = !this.visible;
    this.container.style.display = this.visible ? 'block' : 'none';
  }
  
  /**
   * Show HUD
   */
  show() {
    this.visible = true;
    this.container.style.display = this.selectedLink ? 'block' : 'none';
  }
  
  /**
   * Hide HUD
   */
  hide() {
    this.visible = false;
    this.container.style.display = 'none';
  }
  
  /**
   * Main render method - updates HUD content
   * @private
   */
  render() {
    if (!this.visible || !this.selectedLink) return;
    
    try {
      const tracker = window.linkHistoryTracker;
      if (!tracker) {
        this._renderNoTracker();
        return;
      }
      
      const linkId = this.selectedLink.id;
      const stats = tracker.getStats(linkId);
      const trend = tracker.getTrend(linkId);
      const history = tracker.getHistory(linkId);
      const lifetime = tracker.getLifetimeScore(linkId);
      
      let html = `
        <div style="font-weight: bold; margin-bottom: 8px; color: ${this.colors.secondary}; border-bottom: 1px solid ${this.colors.grid}; padding-bottom: 6px;">
          📊 SYNERGY TREND
        </div>
      `;
      
      if (!stats || !history || history.length < 2) {
        html += `<div style="opacity: 0.6; font-style: italic;">⏳ Collecting samples...</div>`;
      } else {
        html += this._renderTrendSection(trend, stats, lifetime);
        html += this._renderSparklineSection(history);
      }
      
      this.container.innerHTML = html;
    } catch (error) {
      console.warn('[SynergyTrendHUD] Render error:', error.message);
      this.container.innerHTML = `<div style="color:${this.colors.danger};">Error rendering HUD</div>`;
    }
  }
  
  /**
   * Render main trend statistics section
   * @private
   */
  _renderTrendSection(trend, stats, lifetime) {
    try {
      if (!stats || !trend) {
        return `<div style="opacity: 0.5;">No data available</div>`;
      }
      
      // Determine trend arrow and color
      const { arrow, trendColor, trendText } = this._getTrendIndicator(trend);
      
      // Format delta
      const trendDelta = trend.strength.toFixed(3);
      const deltaSign = trend.direction > 0 ? '+' : trend.direction < 0 ? '−' : '±';
      
      // Determine stability indicator
      const stabilityEmoji = stats.stabilityScore > 0.8 ? '✓' : stats.stabilityScore > 0.6 ? '~' : '✗';
      
      // Volatility level
      const volatilityLevel = stats.volatility > 0.15 ? '⚡ HIGH' : stats.volatility > 0.08 ? '~ MED' : '○ LOW';
      const volColor = stats.volatility > 0.15 ? this.colors.falling : stats.volatility > 0.08 ? '#FFD480' : this.colors.rising;
      
      const html = `
        <div style="margin-bottom: 10px; background: rgba(77, 255, 153, 0.05); padding: 8px; border-radius: 4px; border-left: 2px solid ${this.colors.secondary};">
          <div style="margin-bottom: 4px;">
            <span style="color: ${trendColor}; font-weight: bold;">Trend:</span>
            <span style="color: ${trendColor}; font-weight: bold; margin-left: 6px;">${arrow} ${trendText}</span>
            <span style="color: #888; font-size: 10px;">(Δ ${deltaSign}${trendDelta})</span>
          </div>
          
          <div style="margin-bottom: 3px;">
            <span style="color: ${this.colors.text};">Stability:</span>
            <span style="color: ${stats.stabilityScore > 0.8 ? this.colors.rising : this.colors.falling}; font-weight: bold; margin-left: 4px;">${stabilityEmoji} ${stats.stabilityScore.toFixed(2)}</span>
          </div>
          
          <div style="margin-bottom: 3px;">
            <span style="color: ${this.colors.text};">Lifetime:</span>
            <span style="color: #FFD480; font-weight: bold; margin-left: 4px;">${lifetime.toFixed(2)}</span>
          </div>
          
          <div style="margin-bottom: 3px;">
            <span style="color: ${this.colors.text};">Volatility:</span>
            <span style="color: ${volColor}; font-weight: bold; margin-left: 4px;">${volatilityLevel}</span>
            <span style="color: #888; font-size: 10px;">${stats.volatility.toFixed(3)}</span>
          </div>
          
          <div style="opacity: 0.7; font-size: 10px; margin-top: 4px;">
            Samples: ${stats.sampleCount} | Decaying: ${stats.decayingCycles}
          </div>
        </div>
      `;
      
      return html;
    } catch (error) {
      console.warn('[SynergyTrendHUD] Trend section error:', error.message);
      return '';
    }
  }
  
  /**
   * Render sparkline graph section
   * @private
   */
  _renderSparklineSection(history) {
    try {
      if (!history || history.length < 2) {
        return '';
      }
      
      const canvasId = `trend-sparkline-${Date.now()}`;
      
      const html = `
        <div style="margin-top: 10px; border-top: 1px solid ${this.colors.grid}; padding-top: 8px;">
          <div style="font-size: 10px; color: #888; margin-bottom: 4px;">Last 10 Samples</div>
          <canvas id="${canvasId}" width="310" height="60" style="display: block; border-radius: 3px; background: rgba(0,0,0,0.3);"></canvas>
        </div>
      `;
      
      // Defer canvas rendering to next tick
      setTimeout(() => {
        this._renderSparkline(canvasId, history);
      }, 0);
      
      return html;
    } catch (error) {
      console.warn('[SynergyTrendHUD] Sparkline section error:', error.message);
      return '';
    }
  }
  
  /**
   * Render sparkline on canvas
   * @private
   */
  _renderSparkline(canvasId, history) {
    try {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const width = canvas.width;
      const height = canvas.height;
      const padding = 8;
      
      // Get last 10 samples
      const samples = history.slice(-10);
      if (samples.length < 2) return;
      
      // Get min/max quality for scaling
      let minQ = Infinity;
      let maxQ = -Infinity;
      
      samples.forEach(s => {
        minQ = Math.min(minQ, s.quality);
        maxQ = Math.max(maxQ, s.quality);
      });
      
      // Add some padding to min/max
      const range = maxQ - minQ || 0.1;
      minQ = Math.max(0, minQ - range * 0.1);
      maxQ = Math.min(1, maxQ + range * 0.1);
      
      const plotWidth = width - padding * 2;
      const plotHeight = height - padding * 2;
      
      // Clear canvas
      ctx.fillStyle = 'transparent';
      ctx.clearRect(0, 0, width, height);
      
      // Draw grid lines
      ctx.strokeStyle = this.colors.grid;
      ctx.lineWidth = 0.5;
      
      for (let i = 0; i <= 4; i++) {
        const y = padding + (plotHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
      }
      
      // Draw sparkline
      ctx.strokeStyle = this.colors.rising;  // Default green
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      
      samples.forEach((sample, idx) => {
        const x = padding + (plotWidth / (samples.length - 1)) * idx;
        const normalizedQ = (sample.quality - minQ) / (maxQ - minQ);
        const y = height - padding - normalizedQ * plotHeight;
        
        // Color based on trend
        if (idx === samples.length - 1) {
          // Last point - use current trend color
          const trend = sample.trend || 0;
          if (trend > 0.01) {
            ctx.strokeStyle = this.colors.rising;
          } else if (trend < -0.01) {
            ctx.strokeStyle = this.colors.falling;
          } else {
            ctx.strokeStyle = this.colors.stable;
          }
        }
        
        if (idx === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // Draw sample points
      samples.forEach((sample, idx) => {
        const x = padding + (plotWidth / (samples.length - 1)) * idx;
        const normalizedQ = (sample.quality - minQ) / (maxQ - minQ);
        const y = height - padding - normalizedQ * plotHeight;
        
        // Determine point color
        let pointColor = this.colors.stable;
        if (sample.trend > 0.01) {
          pointColor = this.colors.rising;
        } else if (sample.trend < -0.01) {
          pointColor = this.colors.falling;
        }
        
        // Last point is larger and brighter
        const isLast = idx === samples.length - 1;
        const radius = isLast ? 3 : 2;
        
        ctx.fillStyle = pointColor;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow effect for last point
        if (isLast) {
          ctx.strokeStyle = pointColor;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      });
      
    } catch (error) {
      console.warn('[SynergyTrendHUD] Sparkline rendering error:', error.message);
    }
  }
  
  /**
   * Get trend indicator (arrow, color, text)
   * @private
   */
  _getTrendIndicator(trend) {
    if (!trend) {
      return { arrow: '→', trendColor: this.colors.stable, trendText: 'Stable' };
    }
    
    if (trend.type === 'rising') {
      return { arrow: '↑', trendColor: this.colors.rising, trendText: 'Rising' };
    } else if (trend.type === 'falling') {
      return { arrow: '↓', trendColor: this.colors.falling, trendText: 'Falling' };
    } else {
      return { arrow: '→', trendColor: this.colors.stable, trendText: 'Stable' };
    }
  }
  
  /**
   * Render when tracker is not available
   * @private
   */
  _renderNoTracker() {
    this.container.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px; color: ${this.colors.secondary}; border-bottom: 1px solid ${this.colors.grid}; padding-bottom: 6px;">
        📊 SYNERGY TREND
      </div>
      <div style="opacity: 0.5; font-style: italic;">⚠ LinkHistoryTracker not initialized</div>
    `;
  }
  
  /**
   * Set refresh interval (ms)
   */
  setRefreshInterval(ms) {
    this.refreshInterval = ms;
    this.stop();
    this.start();
  }
  
  /**
   * Dispose - remove HUD from DOM
   */
  dispose() {
    this.stop();
    if (this.container && this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
  }
  
  /**
   * Get current HUD state
   */
  getState() {
    return {
      visible: this.visible,
      selectedLink: this.selectedLink?.id || null,
      refreshInterval: this.refreshInterval,
    };
  }
}

/**
 * Global console API exposure
 * Called from main.js after initialization
 */
export function exposeSynergyTrendHUDConsoleAPI(hud) {
  if (!hud) {
    console.warn('[SynergyTrendHUD] No HUD instance provided');
    return;
  }
  
  window.synergyTrendHUD = {
    toggle: () => hud.toggle(),
    show: () => hud.show(),
    hide: () => hud.hide(),
    onLinkSelected: (link) => hud.onLinkSelected(link),
    setRefreshInterval: (ms) => hud.setRefreshInterval(ms),
    getState: () => hud.getState(),
  };
  
  console.log('[SynergyTrendHUD] Console API exposed at window.synergyTrendHUD');
}
