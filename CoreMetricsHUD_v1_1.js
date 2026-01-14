import * as THREE from 'three';
import { projectHudMetrics } from './SemanticMetricAdapter.js';

/**
 * CORE METRICS HUD - UPDATED v1.1
 * 
 * CANONICAL NETWORK STAT SYSTEM + NETWORK TIME PRESSURE
 * Visual overlay showing ATOMA core metrics and temporal units.
 * 100% visual-only, non-intrusive.
 * Positioned in bottom-left corner.
 * 
 * RENAMED LABELS:
 * - SYNERGY → NETWORK SYNERGY
 * - HARMONY → HARMONY FLOW
 * - INSTABILITY → NETWORK STRESS
 * - CORRUPTION → CORRUPTION LEVEL
 * - LOAD → LOAD PRESSURE
 * - CYCLE → NETWORK TIME (NEW: Pressure counter)
 * - EPOCH → PHASE
 * - AEON → RUN
 * 
 * NEW: Network Time Pressure mechanics
 * - Counts up at 5 units/sec when synergy < 85%
 * - Freezes at gold/yellow when synergy >= 85%
 * - Integer values only (no decimals)
 * - Cyan glow when running, gold when frozen
 */

export class CoreMetricsHUD {
  constructor(renderer) {
    this.renderer = renderer;
    this.enabled = true;
    
    // DOM elements
    this.hudContainer = null;
    this.hudElements = {
      networkSynergy: null,
      harmonyFlow: null,
      networkStress: null,
      corruptionLevel: null,
      loadPressure: null,
      networkTime: null,
      networkTimeLabel: null,
      networkTimeValueSpan: null,
      phase: null,
      run: null
    };
    
    // Network Time Pressure state
    this.networkTime = 0;
    this.networkTimeRunning = false;
    this.networkTimeFrozen = false;
    this.lastNetworkSynergy = 0;
    
    // Glow animation state
    this.glowPhase = 0;
    this.glowActive = false;
    this.glowDuration = 0.3; // seconds
    this.glowElapsedTime = 0;
    
    // Network Time freeze flash state
    this.freezeFlashActive = false;
    this.freezeFlashTime = 0;
    this.freezeFlashDuration = 0.3;
    
    // Network Time pulse state (when synergy drops)
    this.timePulseActive = false;
    this.timePulseTime = 0;
    this.timePulseDuration = 0.4;
    
    // Color palette (ATOMA-themed)
    this.colors = {
      networkSynergy: '#00ccdd',      // Cyan
      harmonyFlow: '#00dd99',         // Green-teal
      networkStress: '#ffdd00',       // Amber
      corruptionLevel: '#dd0099',     // Magenta
      loadPressure: '#aa00ff',        // Violet
      networkTimeRunning: '#00ddff',  // Bright cyan (running)
      networkTimeFrozen: '#ffdd00',   // Gold/yellow (frozen)
      text: '#00ffff',                // Bright cyan
      background: 'rgba(10, 10, 20, 0.8)',
      border: '#00ccdd'
    };
    
    this.createHUD();
  }
  
  /**
   * Create HUD DOM elements with new canonical stat names
   */
  createHUD() {
    // Main container
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
    
    // Metrics rows with NEW CANONICAL NAMES
    const metrics = [
      { key: 'networkSynergy', label: 'NETWORK SYNERGY', color: this.colors.networkSynergy },
      { key: 'harmonyFlow', label: 'HARMONY FLOW', color: this.colors.harmonyFlow },
      { key: 'networkStress', label: 'NETWORK STRESS', color: this.colors.networkStress },
      { key: 'corruptionLevel', label: 'CORRUPTION LEVEL', color: this.colors.corruptionLevel },
      { key: 'loadPressure', label: 'LOAD PRESSURE', color: this.colors.loadPressure }
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
    
    // NETWORK TIME - NEW PRESSURE COUNTER
    const networkTimeRow = document.createElement('div');
    networkTimeRow.style.cssText = 'margin: 4px 0;';
    networkTimeRow.innerHTML = `<span id="network-time-label" style="color: ${this.colors.networkTimeRunning};">NETWORK TIME:</span> <span id="network-time-value" style="font-weight: bold; color: ${this.colors.networkTimeRunning};">00000</span>`;
    temporalContainer.appendChild(networkTimeRow);
    this.hudElements.networkTimeLabel = networkTimeRow.querySelector('#network-time-label');
    this.hudElements.networkTimeValueSpan = networkTimeRow.querySelector('#network-time-value');
    
    // PHASE (was EPOCH)
    const phaseRow = document.createElement('div');
    phaseRow.style.cssText = 'margin: 4px 0;';
    phaseRow.innerHTML = `<span style="color: #aa00ff;">PHASE:</span> <span id="phase-number">00</span>`;
    temporalContainer.appendChild(phaseRow);
    this.hudElements.phase = phaseRow.querySelector('#phase-number');
    
    // RUN (was AEON)
    const runRow = document.createElement('div');
    runRow.style.cssText = 'margin: 4px 0;';
    runRow.innerHTML = `<span style="color: #ffdd00;">RUN:</span> <span id="run-number">00</span>`;
    temporalContainer.appendChild(runRow);
    this.hudElements.run = runRow.querySelector('#run-number');
    
    this.hudContainer.appendChild(temporalContainer);
    document.body.appendChild(this.hudContainer);
  }
  
  /**
   * Create a single metric row with bar (UNCHANGED STRUCTURE)
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
      width: 120px;
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
   * NEW: Includes Network Time Pressure calculation
   */
  update(metrics, temporalDisplay, newEventFlags, deltaTime = 0.016) {
    if (!this.enabled || !this.hudContainer) return;

    const display = projectHudMetrics(metrics);

    // Update metrics with NEW CANONICAL NAMES (floats 0..1 → percent)
    this.updateMetricDisplay('networkSynergy', this.toPercent(display.networkSynergy));
    this.updateMetricDisplay('harmonyFlow', this.toPercent(display.harmonyFlow));
    this.updateMetricDisplay('networkStress', this.toPercent(display.networkStress));
    this.updateMetricDisplay('corruptionLevel', this.toPercent(display.corruptionLevel));
    this.updateMetricDisplay('loadPressure', this.toPercent(display.loadPressure));

    // Update temporal display with NEW NAMES
    if (this.hudElements.phase) {
      this.hudElements.phase.textContent = temporalDisplay.epoch;
    }
    if (this.hudElements.run) {
      this.hudElements.run.textContent = temporalDisplay.aeon;
    }

    // UPDATE NETWORK TIME PRESSURE (NEW MECHANIC)
    this.updateNetworkTimePressure(display.networkSynergy, deltaTime, newEventFlags);

    // Trigger glow on new cycle
    if (newEventFlags.newCycle) {
      this.triggerGlow();
    }
  }

  /**
   * NEW: Update Network Time Pressure counter
   * 
   * Logic:
   * - Time increases at 5 units/sec when synergy < 85%
   * - Time freezes when synergy >= 85%
   * - Cyan running, gold frozen
   * - Integer only (no decimals)
   * - Pulses label when synergy drops
   * - Flashes when synergy rises (freeze)
   */
  updateNetworkTimePressure(currentSynergy, deltaTime, newEventFlags) {
    const isSynergySafe = currentSynergy >= 0.85; // canonical float threshold (85%)
    
    // Check for synergy state change
    const synergyCrossedThreshold = 
      (this.lastNetworkSynergy < 85 && currentSynergy >= 85) ||  // Synergy rose above 85 (FREEZE)
      (this.lastNetworkSynergy >= 85 && currentSynergy < 85);    // Synergy dropped below 85 (START TIMER)
    
    if (synergyCrossedThreshold) {
      if (isSynergySafe) {
        // FREEZE: Start flash animation
        this.freezeFlashActive = true;
        this.freezeFlashTime = 0;
      } else {
        // START: Pulse the label
        this.timePulseActive = true;
        this.timePulseTime = 0;
      }
    }
    
    // Update time counter
    this.networkTimeFrozen = isSynergySafe;
    if (!this.networkTimeFrozen) {
      // Time runs: 5 units per second
      this.networkTime += deltaTime * 5;
    }
    
    // Update display
    this.updateNetworkTimeDisplay();
    
    this.lastNetworkSynergy = currentSynergy;
  }

  /**
   * Update Network Time display with visual feedback
   */
  updateNetworkTimeDisplay() {
    if (!this.hudElements.networkTimeValueSpan || !this.hudElements.networkTimeLabel) return;

    // Integer value only
    const timeValue = Math.floor(this.networkTime);
    this.hudElements.networkTimeValueSpan.textContent = timeValue.toString().padStart(5, '0');

    // Color based on state
    const displayColor = this.networkTimeFrozen 
      ? this.colors.networkTimeFrozen   // Gold when frozen
      : this.colors.networkTimeRunning; // Cyan when running

    this.hudElements.networkTimeLabel.style.color = displayColor;
    this.hudElements.networkTimeValueSpan.style.color = displayColor;

    // Pulse animation when timer starts (synergy dropped)
    if (this.timePulseActive) {
      this.timePulseTime += 0.016; // Rough deltaTime
      if (this.timePulseTime >= this.timePulseDuration) {
        this.timePulseActive = false;
      } else {
        const progress = this.timePulseTime / this.timePulseDuration;
        const pulseScale = 1 + Math.sin(progress * Math.PI) * 0.2;
        this.hudElements.networkTimeLabel.style.transform = `scale(${pulseScale})`;
      }
    } else {
      this.hudElements.networkTimeLabel.style.transform = 'scale(1)';
    }

    // Flash animation when frozen (synergy rose)
    if (this.freezeFlashActive) {
      this.freezeFlashTime += 0.016;
      if (this.freezeFlashTime >= this.freezeFlashDuration) {
        this.freezeFlashActive = false;
        this.hudElements.networkTimeValueSpan.style.opacity = '1';
      } else {
        const flashProgress = this.freezeFlashTime / this.freezeFlashDuration;
        const flashOpacity = 0.3 + Math.sin(flashProgress * Math.PI * 3) * 0.4;
        this.hudElements.networkTimeValueSpan.style.opacity = flashOpacity.toString();
      }
    } else {
      this.hudElements.networkTimeValueSpan.style.opacity = '1';
    }
  }
  
  /**
   * Update a single metric display (UNCHANGED)
   */
  updateMetricDisplay(key, value) {
    const element = this.hudElements[key];
    if (!element) return;
    
    // Update percentage text
    element.percent.textContent = `${value.toString().padStart(2, '0')}%`;
    
    // Update bar width
    element.bar.style.width = `${value}%`;
  }

  /**
   * Convert canonical float (0..1) to integer percentage for HUD display.
   */
  toPercent(value) {
    const clamped = Math.max(0, Math.min(1, value ?? 0));
    return Math.round(clamped * 100);
  }
  
  /**
   * Trigger glow animation on new cycle (UNCHANGED)
   */
  triggerGlow() {
    this.glowActive = true;
    this.glowElapsedTime = 0;
  }
  
  /**
   * Update glow animation (UNCHANGED)
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
   * Toggle HUD visibility (UNCHANGED)
   */
  toggle() {
    this.enabled = !this.enabled;
    if (this.hudContainer) {
      this.hudContainer.style.display = this.enabled ? 'block' : 'none';
    }
  }
  
  /**
   * Show HUD (UNCHANGED)
   */
  show() {
    this.enabled = true;
    if (this.hudContainer) {
      this.hudContainer.style.display = 'block';
    }
  }
  
  /**
   * Hide HUD (UNCHANGED)
   */
  hide() {
    this.enabled = false;
    if (this.hudContainer) {
      this.hudContainer.style.display = 'none';
    }
  }
  
  /**
   * Cleanup (UNCHANGED)
   */
  destroy() {
    if (this.hudContainer && this.hudContainer.parentNode) {
      this.hudContainer.parentNode.removeChild(this.hudContainer);
    }
    this.hudContainer = null;
    this.hudElements = {};
  }
}
window.ATOMA_DEBUG_FLOATS = true
