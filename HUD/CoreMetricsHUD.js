import * as THREE from 'three';
import { projectHudMetrics } from '../SemanticMetricAdapter.js';
import { CoreMetricsCalculator } from './CoreMetricsCalculator.js';
import { VisualNetworkTimeElasticity_v1 } from '../VisualNetworkTimeElasticity_v1.js';
import { UIVisibilityConfig, UI_VISIBILITY_CHANGE_EVENT } from '../ui/config/UIVisibilityConfig.js';

const METRIC_DISPLAY_MODES = Object.freeze({
  NUMERIC: 'numeric',
  GLYPH: 'glyph'
});

const DIGIT_GLYPHS = {
  '0': '◯',
  '1': '|',
  '2': '∿',
  '3': '△',
  '4': '▢',
  '5': '⬟',
  '6': '⟡',
  '7': '⟐',
  '8': '◎',
  '9': '✶',
  '.': '·'
};

/**
 * CORE METRICS HUD
 * 
 * Visual overlay showing ATOMA core metrics and temporal units.
 * 100% visual-only, non-intrusive.
 * Positioned in bottom-left corner.
 * 
 * Displays:
 * - Synergy, Harmony, stability, Corruption, Network Load (with bars)
 * - Cycle time, Epoch number, Aeon number
 * 
 * Metrics Source: CoreMetricsCalculator (single source of truth)
 */

export class CoreMetricsHUD {
  constructor(renderer, coreMetricsCalculator = null) {
    this.renderer = renderer;
    this.coreMetricsCalculator = coreMetricsCalculator;
    this.enabled = true;
    
    // DOM elements
    this.hudContainer = null;
    this.hudElements = {
      synergy: null,
      harmony: null,
      stability: null,
      corruption: null,
      loadPressure: null,
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
    
    // Display smoothing: treat metric changes as a tween so link creation
    // does not snap the HUD to the final network state in a single frame.
    this.metricTweenMinDuration = 1.15;
    this.metricTweenMaxDuration = 3.0;
    this.metricTweenEase = (t) => 1 - Math.pow(1 - t, 3);
    this._metricTween = null;
    this.displayedMetrics = {
      synergy: 0,
      harmony: 0,
      stability: 0,
      corruption: 0,
      loadPressure: 0
    };
    
    // Previous values for color indication
    this.previousValues = {
      synergy: null,
      harmony: null,
      stability: null,
      corruption: null,
      loadPressure: null
    };
    
    // Color palette (ATOMA-themed)
    this.colors = {
      synergy: '#00ccdd',      // Cyan
      harmony: '#00dd99',      // Green-teal
      stability: '#ffdd00',  // Amber
      corruption: '#dd0099',   // Magenta
      loadPressure: '#aa00ff', // Violet
      text: '#00ffff',         // Bright cyan
      background: 'rgba(10, 10, 20, 0.8)',
      border: '#00ccdd'
    };

    // Metric display mode (numeric or glyph)
    this.metricDisplayMode = METRIC_DISPLAY_MODES.NUMERIC;
    this.modeToggleButton = null;
    this._lastMetrics = null;
    this._lastTemporalDisplay = null;
    this._lastNewEventFlags = null;
    this._lastDeltaTime = 0.016;
    
    // Visual Network Time Elasticity
    this.timeElasticity = new VisualNetworkTimeElasticity_v1();
    this.timeElasticityIndicator = null;

    this._handleUIVisibilityChange = () => this._syncVisibility();
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener(UI_VISIBILITY_CHANGE_EVENT, this._handleUIVisibilityChange);
    }
    
    this.createHUD();
    this._syncVisibility();

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
      font-family: 'Rajdhani', 'Segoe UI', sans-serif;
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
      max-width: 400px;
      box-shadow: 0 0 20px rgba(0, 200, 220, 0.3);
    `;
    
    // Metrics rows
    const metrics = [
      { key: 'synergy', label: 'NETWORK SYNERGY', color: this.colors.synergy },
      { key: 'harmony', label: 'HARMONY FLOW', color: this.colors.harmony },
      { key: 'stability', label: 'NETWORK STRESS', color: this.colors.stability },
      { key: 'corruption', label: 'CORRUPTION LEVEL', color: this.colors.corruption },
      { key: 'loadPressure', label: 'LOAD PRESSURE', color: this.colors.loadPressure }
    ];
    
    metrics.forEach(metric => {
      const row = this.createMetricRow(metric.label, metric.key, metric.color);
      this.hudContainer.appendChild(row);
    });
    
    // Network Time (Network Time Pressure mechanic)
    const networkTimeRow = document.createElement('div');
    networkTimeRow.style.cssText = 'margin: 8px 0 0 0; font-weight: bold;';
    networkTimeRow.innerHTML = `<span style="color: #00ffff;">NETWORK TIME:</span> <span id="network-time" style="color: #00ffff;">00000</span>`;
    this.hudContainer.appendChild(networkTimeRow);
    this.hudElements.networkTime = networkTimeRow.querySelector('#network-time');

    // Display mode toggle (numbers vs glyphs)
    const modeToggle = document.createElement('button');
    modeToggle.id = 'core-metrics-hud-display-mode-toggle';
    modeToggle.textContent = 'Switch to Glyph Mode';
    modeToggle.style.cssText = `
      margin-top: 8px;
      padding: 4px 8px;
      background: rgba(20, 20, 40, 0.9);
      border: 1px solid ${this.colors.border};
      color: ${this.colors.text};
      border-radius: 3px;
      cursor: pointer;
      font-size: 10px;
      font-family: 'Rajdhani', 'Segoe UI', sans-serif;
    `;
    modeToggle.addEventListener('click', () => this.toggleMetricDisplayMode());
    this.hudContainer.appendChild(modeToggle);
    this.modeToggleButton = modeToggle;
    
    // === CSS FOR ELASTICITY PULSE ANIMATION ===
    if (!document.getElementById('core-metrics-hud-pulse-style')) {
      const pulseStyle = document.createElement('style');
      pulseStyle.id = 'core-metrics-hud-pulse-style';
      pulseStyle.textContent = `
        @keyframes elasticity-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `;
      document.head.appendChild(pulseStyle);
    }
    
    document.body.appendChild(this.hudContainer);
  }

  /**
   * Switch display mode between numeric and glyph.
   */
  toggleMetricDisplayMode() {
    const newMode = this.metricDisplayMode === METRIC_DISPLAY_MODES.NUMERIC
      ? METRIC_DISPLAY_MODES.GLYPH
      : METRIC_DISPLAY_MODES.NUMERIC;
    this.setMetricDisplayMode(newMode);
  }

  /**
   * Set display mode explicitly.
   */
  setMetricDisplayMode(mode) {
    if (!Object.values(METRIC_DISPLAY_MODES).includes(mode)) return;
    this.metricDisplayMode = mode;
    if (this.modeToggleButton) {
      this.modeToggleButton.textContent = mode === METRIC_DISPLAY_MODES.GLYPH
        ? 'Switch to Numeric Mode'
        : 'Switch to Glyph Mode';
    }
    this.updateMetricDisplay('synergy', this.displayedMetrics.synergy);
    this.updateMetricDisplay('harmony', this.displayedMetrics.harmony);
    this.updateMetricDisplay('stability', this.displayedMetrics.stability);
    this.updateMetricDisplay('corruption', this.displayedMetrics.corruption);
    this.updateMetricDisplay('loadPressure', this.displayedMetrics.loadPressure);
  }

  /**
   * Format metric text according to display mode.
   */
  formatMetricValue(value) {
    const clamped = this.clamp01(value);
    if (this.metricDisplayMode === METRIC_DISPLAY_MODES.GLYPH) {
      return this.formatGlyphFromString(this.formatFloat(clamped));
    }
    return this.formatFloat(clamped);
  }

  /**
   * Convert formatted numeric string to glyph representation.
   */
  formatGlyphFromString(valueString) {
    if (typeof valueString !== 'string') return '';
    let out = '';
    for (const ch of valueString) {
      out += DIGIT_GLYPHS[ch] || ch;
    }
    return out;
  }

  
  /**
   * Create a single metric row with bar
   */
  createMetricRow(label, key, color) {
    const row = document.createElement('div');
    row.style.cssText = `
      margin: 4px 0;
      font-size: 10px;
    `;
    
    // Label and percentage - single line
    const labelSpan = document.createElement('span');
    labelSpan.style.cssText = `
      display: inline-block;
      color: ${color};
      font-family: 'Orbitron', 'Segoe UI', sans-serif;
      font-weight: bold;
      font-size: 10px;
    `;
    labelSpan.textContent = `${label}:`;
    
    const percentSpan = document.createElement('span');
    percentSpan.id = `${key}-percent`;
    percentSpan.style.cssText = `
      display: inline-block;
      margin-left: 8px;
      color: ${this.colors.text};
      font-family: 'Courier New', monospace;
      font-weight: bold;
      font-size: 10px;
    `;
    percentSpan.textContent = '0.000000';
    
    row.appendChild(labelSpan);
    row.appendChild(percentSpan);
    
    // Bar container
    const barContainer = document.createElement('div');
    barContainer.style.cssText = `
      width: 100%;
      height: 10px;
      background: rgba(0, 0, 0, 0.8);
      margin-top: 3px;
      border: 1px solid ${color};
      border-radius: 2px;
      overflow: hidden;
      box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.8);
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
  this._lastMetrics = metrics;
  this._lastTemporalDisplay = temporalDisplay;
  this._lastNewEventFlags = newEventFlags;
  this._lastDeltaTime = deltaTime;

  if (!UIVisibilityConfig.coreMetrics || !this.enabled || !this.hudContainer) return;

  const now = performance.now();

  // === RESOLVE TARGET METRICS ===
  // Prefer the explicit metrics input from the overlay, then fall back to runtime globals.
  let targetSource = null;
  if (metrics && typeof metrics === 'object' && Object.keys(metrics).length > 0) {
    targetSource = metrics;
  } else if (window.__ATOMA_LIVE_METRICS__) {
    targetSource = window.__ATOMA_LIVE_METRICS__;
  } else if (this.coreMetricsCalculator) {
    targetSource = this.coreMetricsCalculator.getMetrics();
  }

  const targetMetrics = projectHudMetrics(targetSource || {});

  // === SMOOTH DISPLAY STATE TOWARD TARGETS ===
  const dt = Number.isFinite(deltaTime) ? Math.max(0, deltaTime) : 0.016;
  const targetSnapshot = this._buildMetricSnapshot(targetMetrics);
  if (!this._metricTween || !this._snapshotEquals(this._metricTween.target, targetSnapshot, 0.001)) {
    this._metricTween = this._createMetricTween(targetSnapshot);
  }
  this._advanceMetricTween(dt);

  // === RENDER HUD (smoothed, 0..1 floats) ===
  this.updateMetricDisplay('synergy', this.displayedMetrics.synergy);
  this.updateMetricDisplay('harmony', this.displayedMetrics.harmony);
  this.updateMetricDisplay('stability', this.displayedMetrics.stability);
  this.updateMetricDisplay('corruption', this.displayedMetrics.corruption);
  this.updateMetricDisplay('loadPressure', this.displayedMetrics.loadPressure);

  // === VISUAL NETWORK TIME ELASTICITY ===
  // Update time elasticity state based on synergy
  this.timeElasticity.setAverageSynergy(this.displayedMetrics.synergy);
  this.timeElasticity.update(deltaTime, performance.now() / 1000);
  
  // Update visualization of time elasticity
  this.updateTimeElasticityVisualization();

  // === NETWORK TIME PRESSURE ===
  this.updateNetworkTime(this.displayedMetrics.synergy, deltaTime);


  // === EVENT GLOW ===
  if (newEventFlags?.newCycle) {
    this.triggerGlow();
  }

  // === OPTIONAL DEBUG (NO RENDER EFFECT) ===
  const snap = window.__ATOMA_METRICS_SNAPSHOT__;
  if (snap) {
    this.setValue('nodeCount', snap.nodeCount);
  }
  
  // === UPDATE TEMPORAL ELEMENTS ===
  this.updateTemporalElements(temporalDisplay);
  }
  
  /**
   * Create a canonical metric snapshot for display tweening.
   */
  _buildMetricSnapshot(source = {}) {
    return {
      synergy: this.clamp01(source?.networkSynergy ?? source?.synergy ?? 0),
      harmony: this.clamp01(source?.harmonyFlow ?? source?.harmony ?? 0),
      stability: this.clamp01(source?.networkStress ?? source?.stability ?? 0),
      corruption: this.clamp01(source?.corruptionLevel ?? source?.corruption ?? 0),
      loadPressure: this.clamp01(source?.loadPressure ?? source?.load ?? 0)
    };
  }

  /**
   * Compare metric snapshots with a small epsilon so tiny floating noise does not
   * restart the tween every frame.
   */
  _snapshotEquals(a, b, epsilon = 0.001) {
    if (!a || !b) return false;
    return (
      Math.abs((a.synergy ?? 0) - (b.synergy ?? 0)) <= epsilon &&
      Math.abs((a.harmony ?? 0) - (b.harmony ?? 0)) <= epsilon &&
      Math.abs((a.stability ?? 0) - (b.stability ?? 0)) <= epsilon &&
      Math.abs((a.corruption ?? 0) - (b.corruption ?? 0)) <= epsilon &&
      Math.abs((a.loadPressure ?? 0) - (b.loadPressure ?? 0)) <= epsilon
    );
  }

  /**
   * Start a new tween from the current displayed values toward the target snapshot.
   */
  _createMetricTween(targetSnapshot) {
    const start = { ...this.displayedMetrics };
    const target = { ...targetSnapshot };
    const maxDelta = Math.max(
      Math.abs(target.synergy - start.synergy),
      Math.abs(target.harmony - start.harmony),
      Math.abs(target.stability - start.stability),
      Math.abs(target.corruption - start.corruption),
      Math.abs(target.loadPressure - start.loadPressure)
    );
    const duration = Math.min(
      this.metricTweenMaxDuration,
      Math.max(this.metricTweenMinDuration, this.metricTweenMinDuration + maxDelta * 1.75)
    );

    return {
      start,
      target,
      elapsed: 0,
      duration
    };
  }

  /**
   * Advance the display tween and write the interpolated values into displayedMetrics.
   */
  _advanceMetricTween(deltaTime) {
    if (!this._metricTween) return;
    const tween = this._metricTween;
    tween.elapsed = Math.min(tween.elapsed + deltaTime, tween.duration);
    const t = tween.duration <= 0 ? 1 : tween.elapsed / tween.duration;
    const eased = this.metricTweenEase(Math.max(0, Math.min(1, t)));

    const lerp = (a, b) => a + (b - a) * eased;
    this.displayedMetrics.synergy = lerp(tween.start.synergy, tween.target.synergy);
    this.displayedMetrics.harmony = lerp(tween.start.harmony, tween.target.harmony);
    this.displayedMetrics.stability = lerp(tween.start.stability, tween.target.stability);
    this.displayedMetrics.corruption = lerp(tween.start.corruption, tween.target.corruption);
    this.displayedMetrics.loadPressure = lerp(tween.start.loadPressure, tween.target.loadPressure);

    if (t >= 1) {
      this.displayedMetrics.synergy = tween.target.synergy;
      this.displayedMetrics.harmony = tween.target.harmony;
      this.displayedMetrics.stability = tween.target.stability;
      this.displayedMetrics.corruption = tween.target.corruption;
      this.displayedMetrics.loadPressure = tween.target.loadPressure;
      this._metricTween = null;
    }
  }

  /**
   * Update temporal display elements (cycle, epoch, aeon)
   * Called every frame for smooth updates
   */
  updateTemporalElements(temporalDisplay) {
    if (!temporalDisplay) return;
    
    if (this.hudElements.cycleTime) {
      this.hudElements.cycleTime.textContent = temporalDisplay.cycle;
    }
    if (this.hudElements.epochNumber) {
      this.hudElements.epochNumber.textContent = temporalDisplay.epoch;
    }
    if (this.hudElements.aeonNumber) {
      this.hudElements.aeonNumber.textContent = temporalDisplay.aeon;
    }
  }

  /**
   * Update a single metric display with color indication
   * Green when value increases, red when decreases
   */
  updateMetricDisplay(key, value) {
    const element = this.hudElements[key];
    if (!element) return;
    
    if (window.DEBUG_HUD) {
      console.log('[HUD] updateMetricDisplay', key, value);
    }
    
    const clamped = this.clamp01(value);
    const previousValue = this.previousValues[key];
    
    // Determine color based on value direction
    if (previousValue !== null) {
      if (clamped > previousValue) {
        // Value increased - green
        element.percent.style.color = '#00ff00';
      } else if (clamped < previousValue) {
        // Value decreased - red
        element.percent.style.color = '#ff0000';
      } else {
        // Value unchanged - default color
        element.percent.style.color = this.colors.text;
      }
    } else {
      // First update - default color
      element.percent.style.color = this.colors.text;
    }
    
    // Update metric text (numeric or glyph depending on user selection)
    element.percent.textContent = this.formatMetricValue(clamped);

    // Update bar width
    const widthPercent = (clamped * 100).toFixed(2);
    element.bar.style.width = `${widthPercent}%`;
    
    // Store current value for next comparison
    this.previousValues[key] = clamped;
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
   * Update Visual Network Time Elasticity visualization
   * - Shows when time rewind effect is active (synergy > 85% for 5+ seconds)
   * - Changes color and adds visual indicator
   * - Smooth fade-in/fade-out based on fadeAlpha
   */
  updateTimeElasticityVisualization() {
    if (!this.hudElements.networkTime) return;
    
    const isRewinding = this.timeElasticity.isRewinding();
    const fadeAlpha = this.timeElasticity.getFadeAlpha();
    
    if (isRewinding) {
      // Change color based on fade intensity (gold → orange-red)
      const hue = 50 - (fadeAlpha * 30); // 50 (gold) → 20 (orangered)
      const saturation = 100;
      const lightness = 60;
      
      this.hudElements.networkTime.style.color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      
      // Add glow effect based on fade intensity
      const glowIntensity = 10 + (fadeAlpha * 10);
      this.hudElements.networkTime.style.textShadow = `0 0 ${glowIntensity}px hsl(${hue}, ${saturation}%, ${lightness}%)`;
      this.hudElements.networkTime.style.fontWeight = 'bold';
      
      // Add indicator element
      if (!this.timeElasticityIndicator) {
        const indicator = document.createElement('span');
        indicator.id = 'time-elasticity-indicator';
        indicator.style.cssText = `
          margin-left: 8px;
          font-size: 10px;
          color: #ffdd00;
          animation: elasticity-pulse 1s infinite;
          opacity: ${fadeAlpha};
        `;
        indicator.textContent = '⏪ TIME ELASTIC';
        this.hudElements.networkTime.parentElement.appendChild(indicator);
        this.timeElasticityIndicator = indicator;
      } else {
        // Update opacity of existing indicator
        this.timeElasticityIndicator.style.opacity = fadeAlpha.toString();
      }
    } else {
      // Normal state - reset to default
      this.hudElements.networkTime.style.color = '#00ffff';
      this.hudElements.networkTime.style.textShadow = '';
      this.hudElements.networkTime.style.fontWeight = 'normal';
      
      // Remove indicator element
      if (this.timeElasticityIndicator) {
        this.timeElasticityIndicator.remove();
        this.timeElasticityIndicator = null;
      }
    }
  }
  
  /**
   * Trigger glow animation on new cycle
   */
  triggerGlow() {
    if (document?.documentElement?.classList.contains('atoma-no-animated-glow')) {
      return;
    }
    this.glowActive = true;
    this.glowElapsedTime = 0;
  }

  
  /**
   * Update glow animation
   */
  updateGlow(deltaTime) {
    if (document?.documentElement?.classList.contains('atoma-no-animated-glow')) {
      return;
    }
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
      if (this.enabled) {
        if (!this.hudContainer.isConnected) {
          document.body.appendChild(this.hudContainer);
        }
      } else if (this.hudContainer.parentNode) {
        this.hudContainer.parentNode.removeChild(this.hudContainer);
      }
    }
  }
  
  /**
   * Show HUD
   */
  show() {
    this.enabled = true;
    if (this.hudContainer) {
      if (!this.hudContainer.isConnected) {
        document.body.appendChild(this.hudContainer);
      }
      if (this._lastMetrics || this._lastTemporalDisplay || this._lastNewEventFlags) {
        this.update(this._lastMetrics, this._lastTemporalDisplay, this._lastNewEventFlags, this._lastDeltaTime);
      }
    }
  }
  
  /**
   * Hide HUD
   */
  hide() {
    this.enabled = false;
    if (this.hudContainer) {
      if (this.hudContainer.parentNode) {
        this.hudContainer.parentNode.removeChild(this.hudContainer);
      }
    }
  }

  _syncVisibility() {
    if (!UIVisibilityConfig.coreMetrics) {
      this.hide();
      return;
    }

    this.show();
  }
  
  /**
   * Cleanup
   */
  destroy() {
    if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
      window.removeEventListener(UI_VISIBILITY_CHANGE_EVENT, this._handleUIVisibilityChange);
    }
    if (this.hudContainer && this.hudContainer.parentNode) {
      this.hudContainer.parentNode.removeChild(this.hudContainer);
    }
    this.hudContainer = null;
    this.hudElements = {};
  }
}
