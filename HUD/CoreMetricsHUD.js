import * as THREE from 'three';
import { projectHudMetrics } from '../SemanticMetricAdapter.js';
import { CoreMetricsCalculator } from './CoreMetricsCalculator.js';
import { SCORE_DIRECTION } from '../VisualNetworkTimeElasticity_v1.js';
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
    
    // Score system reference (set via setScoreSystem)
    this._scoreSystem = null;
    this._lastDirection = SCORE_DIRECTION.FORWARD;
    
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
    
    // Color palette (ATOMA-themed — refined v2.0)
    this.colors = {
      synergy: '#00d4ff',
      harmony: '#00e5a0',
      stability: '#ffc107',
      corruption: '#ff3d8e',
      loadPressure: '#b44dff',
      text: 'rgba(200, 225, 245, 0.85)',
      background: 'rgba(8, 12, 20, 0.75)',
      accent: 'rgba(0, 200, 220, 0.35)'
    };

    // Metric display mode (numeric or glyph)
    this.metricDisplayMode = METRIC_DISPLAY_MODES.NUMERIC;
    this.modeToggleButton = null;
    this._lastMetrics = null;
    this._lastTemporalDisplay = null;
    this._lastNewEventFlags = null;
    this._lastDeltaTime = 0.016;
    
    // Network Time direction indicator
    this.timeElasticityIndicator = null;

    this._handleUIVisibilityChange = () => this._syncVisibility();
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener(UI_VISIBILITY_CHANGE_EVENT, this._handleUIVisibilityChange);
    }
    
    this.createHUD();
    this._syncVisibility();

  }
  
  /**
   * Create HUD DOM elements — World-Class Minimalist v2.0
   * Glass-morphism container, gradient bars, trend arrows, prominent Network Time.
   */
  createHUD() {
    // ── Inject CSS (once) ────────────────────────────────────────────
    if (!document.getElementById('atoma-core-hud-styles')) {
      const style = document.createElement('style');
      style.id = 'atoma-core-hud-styles';
      style.textContent = `
        /* ── ATOMA Core Metrics HUD — Minimalist v2.0 ── */
        #core-metrics-hud {
          position: fixed;
          top: 740px;
          left: 10px;
          z-index: 1145;
          font-family: 'Rajdhani', 'Segoe UI', sans-serif;
          color: rgba(200, 225, 245, 0.85);
          background: rgba(8, 12, 20, 0.75);
          backdrop-filter: blur(16px) saturate(1.2);
          -webkit-backdrop-filter: blur(16px) saturate(1.2);
          border-left: 2px solid rgba(0, 200, 220, 0.35);
          border-radius: 0 8px 8px 0;
          padding: 16px 18px;
          min-width: 240px;
          max-width: 300px;
          user-select: none;
          transition: box-shadow 0.4s ease;
        }
        #core-metrics-hud.atoma-glow-active {
          box-shadow: 0 0 30px rgba(0, 200, 220, 0.12),
                      inset 0 0 20px rgba(0, 200, 220, 0.03);
        }
        #core-metrics-hud .hud-header {
          font-size: 8px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: rgba(0, 200, 220, 0.4);
          margin-bottom: 12px;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(0, 200, 220, 0.1);
        }
        #core-metrics-hud .metric-row {
          display: flex;
          align-items: center;
          margin: 5px 0;
          gap: 10px;
        }
        #core-metrics-hud .metric-label {
          font-size: 8px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(200, 225, 245, 0.35);
          width: 28px;
          flex-shrink: 0;
          font-weight: 700;
        }
        #core-metrics-hud .metric-bar-track {
          flex: 1;
          height: 3px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 2px;
          overflow: hidden;
        }
        #core-metrics-hud .metric-bar-fill {
          height: 100%;
          width: 0%;
          border-radius: 2px;
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        #core-metrics-hud .metric-bar-fill.bar-synergy {
          background: linear-gradient(90deg, rgba(0, 212, 255, 0.15), #00d4ff);
          box-shadow: 0 0 6px rgba(0, 212, 255, 0.25);
        }
        #core-metrics-hud .metric-bar-fill.bar-harmony {
          background: linear-gradient(90deg, rgba(0, 229, 160, 0.15), #00e5a0);
          box-shadow: 0 0 6px rgba(0, 229, 160, 0.25);
        }
        #core-metrics-hud .metric-bar-fill.bar-stability {
          background: linear-gradient(90deg, rgba(255, 193, 7, 0.15), #ffc107);
          box-shadow: 0 0 6px rgba(255, 193, 7, 0.25);
        }
        #core-metrics-hud .metric-bar-fill.bar-corruption {
          background: linear-gradient(90deg, rgba(255, 61, 142, 0.15), #ff3d8e);
          box-shadow: 0 0 6px rgba(255, 61, 142, 0.25);
        }
        #core-metrics-hud .metric-bar-fill.bar-loadPressure {
          background: linear-gradient(90deg, rgba(180, 77, 255, 0.15), #b44dff);
          box-shadow: 0 0 6px rgba(180, 77, 255, 0.25);
        }
        #core-metrics-hud .metric-value {
          font-size: 11px;
          font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
          font-weight: 500;
          min-width: 38px;
          text-align: right;
          flex-shrink: 0;
          transition: color 0.4s ease;
        }
        #core-metrics-hud .metric-trend {
          font-size: 8px;
          width: 10px;
          text-align: center;
          flex-shrink: 0;
          opacity: 0.5;
          transition: color 0.3s ease;
        }
        #core-metrics-hud .network-time-section {
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid rgba(0, 200, 220, 0.1);
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        #core-metrics-hud .network-time-label {
          font-size: 8px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(0, 200, 220, 0.45);
          font-weight: 700;
        }
        #core-metrics-hud .network-time-value {
          font-size: 18px;
          font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
          font-weight: 700;
          color: #00ffff;
          letter-spacing: 0.06em;
          transition: color 0.4s ease, text-shadow 0.4s ease;
        }
        #core-metrics-hud .network-time-value.frozen {
          color: #ffc107;
        }
        #core-metrics-hud .network-time-arrow {
          font-size: 14px;
          font-weight: 700;
          color: #00d4ff;
          margin-right: 2px;
          transition: color 0.4s ease;
        }
        #core-metrics-hud .network-time-value.rewinding {
          color: #ff8c00;
          text-shadow: 0 0 12px rgba(255, 140, 0, 0.4);
        }
        #core-metrics-hud .network-time-value.won {
          color: #00ff88;
          text-shadow: 0 0 20px rgba(0, 255, 136, 0.6);
          animation: atoma-won-pulse 1.5s ease-in-out infinite;
        }
        @keyframes atoma-won-pulse {
          0%, 100% { text-shadow: 0 0 20px rgba(0, 255, 136, 0.3); }
          50% { text-shadow: 0 0 30px rgba(0, 255, 136, 0.8); }
        }
        #core-metrics-hud .temporal-rewinding {
          color: #ff8c00 !important;
          text-shadow: 0 0 10px rgba(255, 140, 0, 0.5);
          animation: atoma-temporal-rewind 1.2s ease-in-out infinite;
        }
        @keyframes atoma-temporal-rewind {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        #core-metrics-hud .time-elasticity-badge {
          font-size: 7px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #ffc107;
          margin-left: 4px;
          animation: atoma-pulse-soft 1.5s ease-in-out infinite;
        }
        @keyframes atoma-pulse-soft {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        #core-metrics-hud.drama-zone {
          border: 1px solid rgba(255, 193, 7, 0.3);
          box-shadow: 0 0 15px rgba(255, 193, 7, 0.15), inset 0 0 10px rgba(255, 193, 7, 0.05);
          animation: atoma-drama-zone-pulse 1.5s ease-in-out infinite;
        }
        @keyframes atoma-drama-zone-pulse {
          0%, 100% { border-color: rgba(255, 193, 7, 0.2); box-shadow: 0 0 10px rgba(255, 193, 7, 0.1); }
          50% { border-color: rgba(255, 193, 7, 0.6); box-shadow: 0 0 25px rgba(255, 193, 7, 0.3); }
        }
        #core-metrics-hud .sustain-progress-fill.drama-zone {
          background: linear-gradient(90deg, rgba(255, 193, 7, 0.6), #ffd700) !important;
          box-shadow: 0 0 6px rgba(255, 215, 0, 0.5);
        }
        #core-metrics-hud .network-time-value.drama-zone {
          color: #ffd700 !important;
          text-shadow: 0 0 12px rgba(255, 215, 0, 0.5);
        }
        #core-metrics-hud .combo-badge {
          font-size: 7px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #00e5ff;
          margin-left: 4px;
          font-weight: bold;
          opacity: 0;
          transition: opacity 0.3s ease, color 0.3s ease;
        }
        #core-metrics-hud .combo-badge.active {
          opacity: 1;
          animation: atoma-combo-pulse 1.2s ease-in-out infinite;
        }
        #core-metrics-hud .combo-badge.high-combo {
          color: #ff8c00;
        }
        #core-metrics-hud .combo-badge.max-combo {
          color: #ffd700;
        }
        @keyframes atoma-combo-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        #core-metrics-hud .sustain-progress-section {
          margin-top: 4px;
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        #core-metrics-hud .sustain-progress-section.visible {
          opacity: 1;
        }
        #core-metrics-hud .sustain-progress-track {
          height: 2px;
          background: rgba(0, 200, 220, 0.08);
          border-radius: 1px;
          overflow: hidden;
        }
        #core-metrics-hud .sustain-progress-fill {
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, rgba(0, 212, 255, 0.3), #00d4ff);
          border-radius: 1px;
          transition: width 0.15s linear;
          box-shadow: 0 0 4px rgba(0, 212, 255, 0.3);
        }
        #core-metrics-hud .sustain-progress-fill.complete {
          background: linear-gradient(90deg, rgba(255, 140, 0, 0.5), #ff8c00);
          box-shadow: 0 0 8px rgba(255, 140, 0, 0.5);
        }
        #core-metrics-hud .sustain-progress-label {
          font-size: 6px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(0, 200, 220, 0.35);
          margin-top: 2px;
        }
        #core-metrics-hud .nt-sparkline-container {
          margin-top: 6px;
          opacity: 0.8;
          transition: opacity 0.3s ease;
        }
        #core-metrics-hud .nt-sparkline-container:hover {
          opacity: 1;
        }
        #core-metrics-hud .nt-sparkline-label {
          font-size: 6px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(0, 200, 220, 0.3);
          margin-bottom: 3px;
        }
        #core-metrics-hud .nt-sparkline-canvas {
          display: block;
          width: 100%;
          height: 36px;
          border-radius: 3px;
          background: rgba(0, 0, 0, 0.2);
        }
      `;
      document.head.appendChild(style);
    }

    // ── Main container ───────────────────────────────────────────────
    this.hudContainer = document.createElement('div');
    this.hudContainer.id = 'core-metrics-hud';

    // Header (also serves as drag handle for HUDDragManager)
    const header = document.createElement('div');
    header.className = 'hud-header';
    header.textContent = 'ATOMA NETWORK';
    this.hudContainer.appendChild(header);

    // ── Metric rows ──────────────────────────────────────────────────
    const metrics = [
      { key: 'synergy', label: 'SYN', color: this.colors.synergy },
      { key: 'harmony', label: 'HRM', color: this.colors.harmony },
      { key: 'stability', label: 'STB', color: this.colors.stability },
      { key: 'corruption', label: 'CPT', color: this.colors.corruption },
      { key: 'loadPressure', label: 'LOD', color: this.colors.loadPressure }
    ];

    metrics.forEach(metric => {
      const row = this.createMetricRow(metric.label, metric.key, metric.color);
      this.hudContainer.appendChild(row);
    });

    // ── Network Time section (prominent) ─────────────────────────────
    const ntSection = document.createElement('div');
    ntSection.className = 'network-time-section';

    const ntLabel = document.createElement('span');
    ntLabel.className = 'network-time-label';
    ntLabel.textContent = 'NET TIME';

    const ntArrow = document.createElement('span');
    ntArrow.className = 'network-time-arrow';
    ntArrow.textContent = '↑';

    const ntValue = document.createElement('span');
    ntValue.className = 'network-time-value';
    ntValue.id = 'network-time';
    ntValue.textContent = '00000';

    ntSection.appendChild(ntLabel);
    ntSection.appendChild(ntArrow);
    ntSection.appendChild(ntValue);
    this.hudContainer.appendChild(ntSection);
    this.hudElements.networkTime = ntValue;
    this.hudElements.networkTimeArrow = ntArrow;

    // ── Sustain Progress Bar ──────────────────────────────────────────
    const sustainSection = document.createElement('div');
    sustainSection.className = 'sustain-progress-section';

    const sustainTrack = document.createElement('div');
    sustainTrack.className = 'sustain-progress-track';

    const sustainFill = document.createElement('div');
    sustainFill.className = 'sustain-progress-fill';

    sustainTrack.appendChild(sustainFill);
    sustainSection.appendChild(sustainTrack);

    const sustainLabel = document.createElement('div');
    sustainLabel.className = 'sustain-progress-label';
    sustainLabel.textContent = 'SYNERGY SUSTAIN';
    sustainSection.appendChild(sustainLabel);

    this.hudContainer.appendChild(sustainSection);
    this.hudElements.sustainProgress = sustainFill;
    this.hudElements.sustainSection = sustainSection;

    // ── Network Time Sparkline (Phase 6B) ─────────────────────────────
    const sparklineContainer = document.createElement('div');
    sparklineContainer.className = 'nt-sparkline-container';

    const sparklineLabel = document.createElement('div');
    sparklineLabel.className = 'nt-sparkline-label';
    sparklineLabel.textContent = 'NT HISTORY · 60s';

    const sparklineCanvas = document.createElement('canvas');
    sparklineCanvas.className = 'nt-sparkline-canvas';
    sparklineCanvas.width = 240;
    sparklineCanvas.height = 36;

    sparklineContainer.appendChild(sparklineLabel);
    sparklineContainer.appendChild(sparklineCanvas);
    this.hudContainer.appendChild(sparklineContainer);
    this.hudElements.ntSparkline = sparklineCanvas;

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
   * Create a single metric row — single-line layout with gradient bar + trend arrow.
   */
  createMetricRow(label, key, color) {
    const row = document.createElement('div');
    row.className = 'metric-row';

    // Label (3-char abbreviation)
    const labelSpan = document.createElement('span');
    labelSpan.className = 'metric-label';
    labelSpan.textContent = label;

    // Bar track + fill
    const barTrack = document.createElement('div');
    barTrack.className = 'metric-bar-track';

    const barFill = document.createElement('div');
    barFill.className = `metric-bar-fill bar-${key}`;
    barFill.id = `${key}-bar`;
    barTrack.appendChild(barFill);

    // Value (right-aligned, metric color)
    const valueSpan = document.createElement('span');
    valueSpan.className = 'metric-value';
    valueSpan.id = `${key}-percent`;
    valueSpan.style.color = color;
    valueSpan.textContent = '0.00';

    // Trend arrow (↑ ↓ →)
    const trendSpan = document.createElement('span');
    trendSpan.className = 'metric-trend';
    trendSpan.textContent = '→';

    row.appendChild(labelSpan);
    row.appendChild(barTrack);
    row.appendChild(valueSpan);
    row.appendChild(trendSpan);

    // Store element references (same API as before + trend)
    this.hudElements[key] = {
      percent: valueSpan,
      bar: barFill,
      trend: trendSpan,
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

  // === NETWORK TIME SCORE ===
  // Score system is updated by main.js simulation loop.
  // HUD only reads the current state for display.
  this.updateNetworkTimeDisplay();


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
    const scoreSynergy = this.clamp01(
      this._scoreSystem?.avgSynergy
      ?? source?.gameplayNetworkSynergy
      ?? source?.rawNetworkSynergy
      ?? source?.networkSynergy
      ?? source?.synergy
      ?? 0
    );
    return {
      synergy: scoreSynergy,
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
      // Toggle rewind visual state on cycle time element
      if (temporalDisplay.isRewinding) {
        this.hudElements.cycleTime.classList.add('temporal-rewinding');
      } else {
        this.hudElements.cycleTime.classList.remove('temporal-rewinding');
      }
    }
    if (this.hudElements.epochNumber) {
      this.hudElements.epochNumber.textContent = temporalDisplay.epoch;
    }
    if (this.hudElements.aeonNumber) {
      this.hudElements.aeonNumber.textContent = temporalDisplay.aeon;
    }
  }

  /**
   * Update a single metric display with trend arrow.
   * Value stays in metric's own color — direction shown by trend arrow only.
   */
  updateMetricDisplay(key, value) {
    const element = this.hudElements[key];
    if (!element) return;

    if (window.DEBUG_HUD) {
      console.log('[HUD] updateMetricDisplay', key, value);
    }

    const clamped = this.clamp01(value);
    const previousValue = this.previousValues[key];

    // Update metric text (numeric or glyph depending on user selection)
    element.percent.textContent = this.formatMetricValue(clamped);

    // Update bar width
    const widthPercent = (clamped * 100).toFixed(1);
    element.bar.style.width = `${widthPercent}%`;

    // Trend arrow — direction indicator
    if (previousValue !== null && element.trend) {
      const delta = clamped - previousValue;
      if (delta > 0.001) {
        element.trend.textContent = '↑';
        element.trend.style.color = '#00e5a0';
      } else if (delta < -0.001) {
        element.trend.textContent = '↓';
        element.trend.style.color = '#ff3d8e';
      } else {
        element.trend.textContent = '→';
        element.trend.style.color = 'rgba(200, 225, 245, 0.25)';
      }
    }

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
   * Format clamped float for display (two decimals — clean player-facing precision).
   */
  formatFloat(value) {
    return this.clamp01(value).toFixed(2);
  }
  
  /**
   * Set the score system reference.
   * The score system (VisualNetworkTimeElasticity_v1) is the single authority
   * for Network Time value and direction.
   * @param {Object} scoreSystem - VisualNetworkTimeElasticity_v1 instance
   */
  setScoreSystem(scoreSystem) {
    this._scoreSystem = scoreSystem;
  }

  /**
   * Update Network Time display from the score system.
   * Reads value and direction from the score authority.
   * Uses CSS classes for state styling.
   */
  updateNetworkTimeDisplay() {
    if (!this.hudElements.networkTime) return;

    // Fallback: if no score system, show dashes
    if (!this._scoreSystem) {
      this.hudElements.networkTime.textContent = '-----';
      return;
    }

    const direction = this._scoreSystem.getDirection();
    const displayValue = this._scoreSystem.getNetworkTimeFormatted();
    this.hudElements.networkTime.textContent = displayValue;

    // Remove all state classes
    this.hudElements.networkTime.classList.remove('frozen', 'rewinding', 'won');

    // Apply state class + direction arrow
    if (direction === SCORE_DIRECTION.WON) {
      this.hudElements.networkTime.classList.add('won');
      if (this.hudElements.networkTimeArrow) {
        this.hudElements.networkTimeArrow.textContent = '✓';
        this.hudElements.networkTimeArrow.style.color = '#00ff88';
      }
    } else if (direction === SCORE_DIRECTION.REWIND) {
      this.hudElements.networkTime.classList.add('rewinding');
      if (this.hudElements.networkTimeArrow) {
        this.hudElements.networkTimeArrow.textContent = '↓';
        this.hudElements.networkTimeArrow.style.color = '#ff8c00';
      }
    } else {
      // FORWARD
      if (this.hudElements.networkTimeArrow) {
        this.hudElements.networkTimeArrow.textContent = '↑';
        this.hudElements.networkTimeArrow.style.color = '#00d4ff';
      }
    }

    // Direction badge
    const prevDirection = this._lastDirection;
    this._lastDirection = direction;

    if (direction === SCORE_DIRECTION.REWIND) {
      // Show ELASTIC badge
      if (!this.timeElasticityIndicator) {
        const badge = document.createElement('span');
        badge.className = 'time-elasticity-badge';
        badge.textContent = 'ELASTIC';
        this.hudElements.networkTime.parentElement.appendChild(badge);
        this.timeElasticityIndicator = badge;
      }
      const fadeAlpha = this._scoreSystem.getFadeAlpha();
      this.timeElasticityIndicator.style.opacity = fadeAlpha.toString();
    } else if (direction === SCORE_DIRECTION.WON) {
      // Show WON badge
      if (this.timeElasticityIndicator) {
        this.timeElasticityIndicator.remove();
        this.timeElasticityIndicator = null;
      }
      if (!this.timeElasticityIndicator) {
        const badge = document.createElement('span');
        badge.className = 'time-elasticity-badge';
        badge.textContent = 'WON';
        badge.style.color = '#00ff88';
        this.hudElements.networkTime.parentElement.appendChild(badge);
        this.timeElasticityIndicator = badge;
      }
    } else {
      // FORWARD: remove badge
      if (this.timeElasticityIndicator) {
        this.timeElasticityIndicator.remove();
        this.timeElasticityIndicator = null;
      }
    }

    // ── Sustain progress bar ──────────────────────────────────────────
    if (this.hudElements.sustainProgress && this.hudElements.sustainSection) {
      const sustainRatio = this._scoreSystem.getSustainProgressRatio();
      const isSustaining = sustainRatio > 0.001;
      const isComplete = sustainRatio >= 1.0;

      // Show/hide sustain section
      this.hudElements.sustainSection.classList.toggle('visible', isSustaining || direction === SCORE_DIRECTION.REWIND);

      // Update fill width
      const fillPercent = (Math.min(sustainRatio, 1.0) * 100).toFixed(1);
      this.hudElements.sustainProgress.style.width = `${fillPercent}%`;

      // Complete state (orange glow when ready to rewind)
      this.hudElements.sustainProgress.classList.toggle('complete', isComplete || direction === SCORE_DIRECTION.REWIND);
    }

    // ── Drama Zone (Phase 4C) ──────────────────────────────────────────
    const inDramaZone = this._scoreSystem.isInDramaZone?.() ?? false;
    // Golden border on HUD container
    if (this.hudContainer) {
      this.hudContainer.classList.toggle('drama-zone', inDramaZone);
    }
    // Golden sustain fill
    if (this.hudElements.sustainProgress) {
      this.hudElements.sustainProgress.classList.toggle('drama-zone', inDramaZone);
    }
    // Golden network time text
    if (this.hudElements.networkTime) {
      this.hudElements.networkTime.classList.toggle('drama-zone', inDramaZone);
    }

    // ── Combo indicator (Phase 5A) ─────────────────────────────────────
    const comboCount = this._scoreSystem.getScoreState?.()?.combo ?? 0;
    if (comboCount >= 2) {
      if (!this._comboBadge) {
        const badge = document.createElement('span');
        badge.className = 'combo-badge';
        this.hudElements.networkTime.parentElement.appendChild(badge);
        this._comboBadge = badge;
      }
      const mult = this._scoreSystem.getScoreState?.()?.comboMultiplier ?? '1.0';
      this._comboBadge.textContent = `×${mult}`;
      this._comboBadge.classList.add('active');
      this._comboBadge.classList.toggle('high-combo', comboCount >= 3);
      this._comboBadge.classList.toggle('max-combo', comboCount >= 4);
    } else if (this._comboBadge) {
      this._comboBadge.classList.remove('active', 'high-combo', 'max-combo');
    }

    // Pulse on direction change
    if (prevDirection !== direction) {
      this.glowActive = true;
      this.glowElapsedTime = 0;
    }

    // ── Network Time Sparkline (Phase 6B) ─────────────────────────────
    this._drawNTSparkline();
  }

  /**
   * Draw the NT history sparkline onto the canvas element.
   * Reads from scoreSystem.getNetworkTimeHistory() → Array<{time, value}>
   */
  _drawNTSparkline() {
    const canvas = this.hudElements.ntSparkline;
    if (!canvas || !this._scoreSystem) return;

    const history = this._scoreSystem.getNetworkTimeHistory?.();
    if (!history || history.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const PAD_Y = 4;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Find value range
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (let i = 0; i < history.length; i++) {
      const v = history[i].value;
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
    }
    // Ensure minimum range to avoid division by zero
    const range = Math.max(maxVal - minVal, 1);
    // Add 10% padding top/bottom
    const paddedRange = range * 1.2;
    const baseY = minVal - range * 0.1;

    // Map data to pixels
    const xStep = W / (history.length - 1);
    const yScale = (H - PAD_Y * 2) / paddedRange;

    const toX = (i) => i * xStep;
    const toY = (v) => H - PAD_Y - (v - baseY) * yScale;

    // ── Fill gradient under the line ──────────────────────────────────
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(history[0].value));
    for (let i = 1; i < history.length; i++) {
      ctx.lineTo(toX(i), toY(history[i].value));
    }
    ctx.lineTo(toX(history.length - 1), H);
    ctx.lineTo(toX(0), H);
    ctx.closePath();

    const fillGrad = ctx.createLinearGradient(0, 0, 0, H);
    fillGrad.addColorStop(0, 'rgba(0, 200, 220, 0.15)');
    fillGrad.addColorStop(1, 'rgba(0, 200, 220, 0.02)');
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // ── Line stroke ───────────────────────────────────────────────────
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(history[0].value));
    for (let i = 1; i < history.length; i++) {
      ctx.lineTo(toX(i), toY(history[i].value));
    }
    const lineGrad = ctx.createLinearGradient(0, 0, W, 0);
    lineGrad.addColorStop(0, 'rgba(0, 212, 255, 0.3)');
    lineGrad.addColorStop(1, 'rgba(0, 212, 255, 0.9)');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // ── Current value dot (rightmost point) ───────────────────────────
    const lastX = toX(history.length - 1);
    const lastY = toY(history[history.length - 1].value);

    // Outer glow
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 212, 255, 0.25)';
    ctx.fill();

    // Inner dot
    ctx.beginPath();
    ctx.arc(lastX, lastY, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#00d4ff';
    ctx.fill();

    // ── Drama zone golden tint ────────────────────────────────────────
    if (this._scoreSystem.isInDramaZone?.()) {
      ctx.beginPath();
      ctx.moveTo(toX(0), toY(history[0].value));
      for (let i = 1; i < history.length; i++) {
        ctx.lineTo(toX(i), toY(history[i].value));
      }
      ctx.lineTo(toX(history.length - 1), H);
      ctx.lineTo(toX(0), H);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 215, 0, 0.08)';
      ctx.fill();
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
   * Update glow animation — CSS class toggle, no inline boxShadow.
   */
  updateGlow(deltaTime) {
    if (document?.documentElement?.classList.contains('atoma-no-animated-glow')) {
      return;
    }
    if (!this.glowActive) return;

    this.glowElapsedTime += deltaTime;

    if (this.glowElapsedTime >= this.glowDuration) {
      this.glowActive = false;
      this.hudContainer.classList.remove('atoma-glow-active');
      return;
    }

    // Activate glow via CSS class
    this.hudContainer.classList.add('atoma-glow-active');
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
