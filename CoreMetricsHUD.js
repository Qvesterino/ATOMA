import * as THREE from 'three';
import { projectHudMetrics } from './SemanticMetricAdapter.js';

/**
 * CORE METRICS HUD
 * 
 * Visual overlay showing ATOMA core metrics and temporal units.
 * 100% visual-only, non-intrusive.
 * Positioned in bottom-left corner.
 * 
 * Displays:
 * - Synergy, Harmony, Instability, Corruption, Network Load (with bars)
 * - Cycle time, Epoch number, Aeon number
 */

export class CoreMetricsHUD {
  constructor(renderer) {
    this.renderer = renderer;
    this.enabled = true;
    
    // DOM elements
    this.hudContainer = null;
    this.hudElements = {
      synergy: null,
      harmony: null,
      stability: null,
      corruption: null,
      networkLoad: null,
      cycleTime: null,
      epochNumber: null,
      aeonNumber: null,
      networkTime: null
    };
    
    // Glow animation state
    this.glowPhase = 0;
    this.glowActive = false;
    this.glowDuration = 0.3; // seconds
    this.glowElapsedTime = 0;
    
    // Network Time Pressure state
    this.networkTimeCounter = 0; // integer counter in units
    this.networkTimeFrozen = false;
    this.networkTimePulseActive = false;
    this.networkTimePulseElapsed = 0;
    
    // Color palette (ATOMA-themed)
    this.colors = {
      synergy: '#00ccdd',      // Cyan
      harmony: '#00dd99',      // Green-teal
      stability: '#ffdd00',  // Amber
      corruption: '#dd0099',   // Magenta
      networkLoad: '#aa00ff',  // Violet
      text: '#00ffff',         // Bright cyan
      background: 'rgba(10, 10, 20, 0.8)',
      border: '#00ccdd'
    };
    
    this.createHUD();
  }
  
  /**
   * Create HUD DOM elements
   */
  createHUD() {
    // Main container
    // ULTRA CLEAN PATCH (v2.5): Left column positioning (third in stack)
    // Position: top: 330px (below Node Inspector)
    // Left alignment: left: 10px (perfect left column)
    // Z-index: 1145 (third in hierarchy)
    this.hudContainer = document.createElement('div');
    this.hudContainer.id = 'core-metrics-hud';
    this.hudContainer.style.cssText = `
      position: fixed;
      top: 740px;
      left: 10px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.2;
      letter-spacing: 0.05em;
      color: ${this.colors.text};
      background: ${this.colors.background};
      border: 1px solid ${this.colors.border};
      border-radius: 4px;
      padding: 12px;
      z-index: 1145;
      text-shadow: 0 0 10px ${this.colors.border};
      max-width: 250px;
      box-shadow: 0 0 20px rgba(0, 200, 220, 0.3);
    `;
    
    // Metrics rows
    const metrics = [
      { key: 'synergy', label: 'NETWORK SYNERGY', color: this.colors.synergy },
      { key: 'harmony', label: 'HARMONY FLOW', color: this.colors.harmony },
      { key: 'stability', label: 'NETWORK STRESS', color: this.colors.stability },
      { key: 'corruption', label: 'CORRUPTION LEVEL', color: this.colors.corruption },
      { key: 'networkLoad', label: 'LOAD PRESSURE', color: this.colors.networkLoad }
    ];
    
    metrics.forEach(metric => {
      const row = this.createMetricRow(metric.label, metric.key, metric.color);
      this.hudContainer.appendChild(row);
    });
    
    // Separator
    const separator = document.createElement('div');
    separator.style.cssText = `
      border-top: 1px solid ${this.colors.border};
      margin: 8px 0;
      opacity: 0.3;
    `;
    this.hudContainer.appendChild(separator);
    
    // Temporal display
    const temporalContainer = document.createElement('div');
    temporalContainer.style.cssText = `
      font-size: 11px;
      letter-spacing: 0.05em;
    `;
    
    // Network Time (NEW: Network Time Pressure mechanic)
    const networkTimeRow = document.createElement('div');
    networkTimeRow.style.cssText = 'margin: 4px 0; font-weight: bold;';
    networkTimeRow.innerHTML = `<span style="color: #00ffff;">NETWORK TIME:</span> <span id="network-time" style="color: #00ffff;">00000</span>`;
    temporalContainer.appendChild(networkTimeRow);
    this.hudElements.networkTime = networkTimeRow.querySelector('#network-time');
    
    // Cycle time
    const cycleRow = document.createElement('div');
    cycleRow.style.cssText = 'margin: 4px 0;';
    cycleRow.innerHTML = `<span style="color: #00dd99;">CYCLE:</span> <span id="cycle-time">00:00</span>`;
    temporalContainer.appendChild(cycleRow);
    this.hudElements.cycleTime = cycleRow.querySelector('#cycle-time');
    
    // Phase (renamed from EPOCH)
    const epochRow = document.createElement('div');
    epochRow.style.cssText = 'margin: 4px 0;';
    epochRow.innerHTML = `<span style="color: #aa00ff;">PHASE:</span> <span id="epoch-number">00</span>`;
    temporalContainer.appendChild(epochRow);
    this.hudElements.epochNumber = epochRow.querySelector('#epoch-number');
    
    // Run (renamed from AEON)
    const aeonRow = document.createElement('div');
    aeonRow.style.cssText = 'margin: 4px 0;';
    aeonRow.innerHTML = `<span style="color: #ffdd00;">RUN:</span> <span id="aeon-number">00</span>`;
    temporalContainer.appendChild(aeonRow);
    this.hudElements.aeonNumber = aeonRow.querySelector('#aeon-number');
    
    this.hudContainer.appendChild(temporalContainer);
    document.body.appendChild(this.hudContainer);
  }
  
  /**
   * Create a single metric row with bar
   */
  createMetricRow(label, key, color) {
    const row = document.createElement('div');
    row.style.cssText = `
      margin: 4px 0;
      font-size: 11px;
    `;
    
    // Label and percentage
    const labelSpan = document.createElement('span');
    labelSpan.style.cssText = `
      display: inline-block;
      width: 85px;
      color: ${color};
      font-weight: bold;
    `;
    labelSpan.textContent = `${label}: `;
    
    const percentSpan = document.createElement('span');
    percentSpan.id = `${key}-percent`;
    percentSpan.style.cssText = `
      display: inline-block;
      width: 30px;
      text-align: right;
      color: ${this.colors.text};
    `;
    percentSpan.textContent = '00%';
    
    row.appendChild(labelSpan);
    row.appendChild(percentSpan);
    
    // Bar
    const barContainer = document.createElement('div');
    barContainer.style.cssText = `
      width: 120px;
      height: 2px;
      background: rgba(0, 0, 0, 0.5);
      margin-top: 2px;
      border: 0.5px solid ${color};
      border-radius: 1px;
      overflow: hidden;
    `;
    
    const barFill = document.createElement('div');
    barFill.id = `${key}-bar`;
    barFill.style.cssText = `
      height: 100%;
      width: 0%;
      background: ${color};
      box-shadow: 0 0 5px ${color};
      transition: width 0.2s ease;
    `;
    
    barContainer.appendChild(barFill);
    row.appendChild(barContainer);
    
    // Store element references
    this.hudElements[key] = {
      percent: percentSpan,
      bar: barFill,
      color: color
    };
    
    return row;
  }
  
  /**
   * Update HUD with current metrics and temporal data
   * All metrics are expected as floats in [0, 1].
   */
  update(metrics, temporalDisplay, newEventFlags, deltaTime = 0.016) {
    if (!this.enabled || !this.hudContainer) return;

    const display = projectHudMetrics(metrics);
    const synergy = this.clamp01(display.networkSynergy);      // Canonical: networkSynergy (0..1)
    const harmony = this.clamp01(display.harmonyFlow);         // Canonical: harmonyFlow (0..1)
    const stress = this.clamp01(display.networkStress);        // Canonical: networkStress (0..1)
    const corruption = this.clamp01(display.corruptionLevel);  // Canonical: corruptionLevel (0..1)
    const load = this.clamp01(display.loadPressure);           // Canonical: loadPressure (0..1)
    
    // Update metrics
    this.updateMetricDisplay('synergy', synergy);
    this.updateMetricDisplay('harmony', harmony);
    this.updateMetricDisplay('stability', stress);
    this.updateMetricDisplay('corruption', corruption);
    this.updateMetricDisplay('networkLoad', load);
    
    // Update Network Time Pressure mechanic
    this.updateNetworkTime(synergy, deltaTime);
    
    // Update temporal display
    if (this.hudElements.cycleTime) {
      this.hudElements.cycleTime.textContent = temporalDisplay.cycle;
    }
    if (this.hudElements.epochNumber) {
      this.hudElements.epochNumber.textContent = temporalDisplay.epoch;
    }
    if (this.hudElements.aeonNumber) {
      this.hudElements.aeonNumber.textContent = temporalDisplay.aeon;
    }
    
    // Trigger glow on new cycle
    if (newEventFlags.newCycle) {
      this.triggerGlow();
    }
  }


  /**
   * Update a single metric display
   */
  updateMetricDisplay(key, value) {
    const element = this.hudElements[key];
    if (!element) return;
    
    const clamped = this.clamp01(value);
    
    // Update float text (0..1 with six decimals)
    element.percent.textContent = this.formatFloat(clamped);
    
    // Update bar width
    const widthPercent = (clamped * 100).toFixed(2);
    element.bar.style.width = `${widthPercent}%`;
  }

  /**
   * Clamp value to [0, 1] for safe HUD display.
   */
  clamp01(value) {
    const num = Number.isFinite(value) ? value : 0;
    return Math.max(0, Math.min(1, num));
  }

  /**
   * Format clamped float for display (six decimals).
   */
  formatFloat(value) {
    return this.clamp01(value).toFixed(6);
  }
  
  /**
   * Update Network Time Pressure counter
   * - Increments by 5 units/sec when synergy < 85%
   * - Freezes when synergy >= 85%
   * - Never decreases or resets
   * - Displays as integer with cyan (running) or gold (frozen) color
   */
  updateNetworkTime(synergy, deltaTime) {
    if (!this.hudElements.networkTime) return;
    
    const safeSynergy = this.clamp01(synergy);
    const wasFrozen = this.networkTimeFrozen;
    this.networkTimeFrozen = safeSynergy >= 0.85;
    
    // Increment counter: 5 units per second
    if (!this.networkTimeFrozen) {
      this.networkTimeCounter += 5 * deltaTime;
    }
    
    // Format as 5-digit integer (00000)
    const displayValue = Math.floor(this.networkTimeCounter).toString().padStart(5, '0');
    this.hudElements.networkTime.textContent = displayValue;
    
    // Color based on state
    if (this.networkTimeFrozen) {
      this.hudElements.networkTime.style.color = '#ffdd00'; // Gold when frozen
    } else {
      this.hudElements.networkTime.style.color = '#00ffff'; // Cyan when running
    }
    
    // Pulse on state change
    if (wasFrozen !== this.networkTimeFrozen) {
      this.networkTimePulseActive = true;
      this.networkTimePulseElapsed = 0;
    }
    
    // Update pulse animation
    if (this.networkTimePulseActive) {
      this.networkTimePulseElapsed += deltaTime;
      if (this.networkTimePulseElapsed < 0.3) {
        const pulsePhase = (this.networkTimePulseElapsed / 0.3) * Math.PI;
        const pulseScale = Math.sin(pulsePhase);
        const opacity = 0.5 + pulseScale * 0.5;
        this.hudElements.networkTime.style.opacity = opacity.toString();
      } else {
        this.networkTimePulseActive = false;
        this.hudElements.networkTime.style.opacity = '1';
      }
    }
  }
  
  /**
   * Trigger glow animation on new cycle
   */
  triggerGlow() {
    this.glowActive = true;
    this.glowElapsedTime = 0;
  }
  
  /**
   * Update glow animation
   */
  updateGlow(deltaTime) {
    if (!this.glowActive) return;
    
    this.glowElapsedTime += deltaTime;
    
    if (this.glowElapsedTime >= this.glowDuration) {
      this.glowActive = false;
      this.hudContainer.style.boxShadow = `0 0 20px rgba(0, 200, 220, 0.3)`;
      return;
    }
    
    // Animate glow intensity
    const progress = this.glowElapsedTime / this.glowDuration;
    const glowIntensity = Math.sin(progress * Math.PI) * 0.7 + 0.3;
    const glowAlpha = glowIntensity * 0.5;
    
    this.hudContainer.style.boxShadow = `0 0 ${20 + glowIntensity * 20}px rgba(0, 200, 220, ${glowAlpha})`;
  }
  
  /**
   * Toggle HUD visibility
   */
  toggle() {
    this.enabled = !this.enabled;
    if (this.hudContainer) {
      this.hudContainer.style.display = this.enabled ? 'block' : 'none';
    }
  }
  
  /**
   * Show HUD
   */
  show() {
    this.enabled = true;
    if (this.hudContainer) {
      this.hudContainer.style.display = 'block';
    }
  }
  
  /**
   * Hide HUD
   */
  hide() {
    this.enabled = false;
    if (this.hudContainer) {
      this.hudContainer.style.display = 'none';
    }
  }
  
  /**
   * Cleanup
   */
  destroy() {
    if (this.hudContainer && this.hudContainer.parentNode) {
      this.hudContainer.parentNode.removeChild(this.hudContainer);
    }
    this.hudContainer = null;
    this.hudElements = {};
  }
}
