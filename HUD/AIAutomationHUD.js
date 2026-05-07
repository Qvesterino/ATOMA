// UI ONLY – Debug scaffold for AI Automation HUD (read-only, no data wiring, no authority)
import * as HudCollapseSystem from './HudCollapseSystem1_0.js';
import { UIVisibilityConfig, UI_VISIBILITY_CHANGE_EVENT } from '../ui/config/UIVisibilityConfig.js';
import { applyAutomationHudWaveAnchor } from './HUDDragManager.js';
/**
 * VARIANT A – FROZEN
 * ------------------
 * Observer-only AI Automation HUD
 * Read-only, UI-only, session-only
 *
 * This module is a reference implementation.
 * Do not extend behavior here.
 *
 * Future variants (B, C) must wrap or reinterpret,
 * never modify this layer.
 */

function createStyles() {
  const style = document.createElement('style');
  style.id = 'ai-automation-hud-style';
  style.textContent = `
    #ai-automation-hud {
      position: fixed;
      right: 12px;
      top: 340px;
      width: 18vw;
      min-width: 260px;
      max-width: 340px;
      height: auto;
      max-height: none;
      background: rgba(8, 12, 20, 0.75);
      border-right: 2px solid rgba(0, 200, 220, 0.35);
      border-radius: 8px 0 0 8px;
      backdrop-filter: blur(16px) saturate(1.2);
      -webkit-backdrop-filter: blur(16px) saturate(1.2);
      font-family: 'Rajdhani', 'Segoe UI', sans-serif;
      letter-spacing: 0.04em;
      color: rgba(200, 225, 245, 0.85);
      pointer-events: auto;
      overflow: hidden;
      transition: opacity 180ms ease, max-height 180ms ease;
      opacity: 0.95;
      z-index: 150;
      user-select: none;
    }

    #ai-automation-hud.collapsed {
      max-height: auto;
      height: auto;
    }

    #ai-automation-hud .ai-hud-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px 10px;
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: rgba(0, 200, 220, 0.4);
      cursor: pointer;
      user-select: none;
      border-bottom: 1px solid rgba(0, 200, 220, 0.1);
      margin-bottom: 2px;
    }

    #ai-automation-hud .ai-hud-subtitle {
      font-size: 10px;
      font-weight: 400;
      color: rgba(200, 225, 245, 0.35);
      margin-top: 2px;
    }
    #ai-automation-hud .ai-hud-chevron {
      font-size: 10px;
      color: rgba(0, 200, 220, 0.4);
      margin-left: 6px;
      line-height: 1;
    }

    #ai-automation-hud .ai-hud-body {
      padding: 10px 16px 14px;
      font-size: 10px;
      font-weight: 400;
      color: rgba(200, 225, 245, 0.75);
    }

    #ai-automation-hud.collapsed .hud-body {
      display: none;
    }

    #ai-automation-hud.collapsed .ai-hud-body {
      display: none;
    }

    #ai-automation-hud .ai-section {
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(0, 200, 220, 0.06);
    }

    #ai-automation-hud .ai-section:last-child {
      border-bottom: none;
    }

    #ai-automation-hud .ai-section-title {
      font-size: 8px;
      font-weight: 700;
      color: rgba(0, 200, 220, 0.4);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.15em;
    }

    #ai-automation-hud .ai-line {
      font-size: 10px;
      color: rgba(200, 225, 245, 0.75);
      margin: 3px 0;
    }

    #ai-automation-hud .ai-muted {
      color: rgba(200, 225, 245, 0.4);
    }

    #ai-automation-hud .ai-bullet {
      margin-left: 10px;
      display: block;
    }

    #ai-automation-hud .ai-empty {
      color: rgba(120, 160, 180, 0.45);
      font-style: italic;
    }

    #ai-automation-hud .ai-observation-grid {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 4px;
    }

    #ai-automation-hud .ai-observation-row {
      display: grid;
      grid-template-columns: 96px 1fr;
      gap: 8px;
      align-items: start;
    }

    #ai-automation-hud .ai-observation-key {
      color: rgba(120, 160, 180, 0.75);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: 9px;
    }

    #ai-automation-hud .ai-observation-value {
      color: rgba(190, 239, 255, 0.9);
      word-break: break-word;
    }

    /* UI ONLY – Recommendation severity visualization */
    .ai-reco {
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: 12px;
      line-height: 1.3;
      margin-top: 4px;
      transition: opacity 0.7s ease-out, transform 0.7s ease-out;
    }

    .ai-reco-icon {
      width: 14px;
      text-align: center;
      opacity: 0.9;
    }

    .ai-reco--info {
      color: #7FE7FF;
      text-shadow: 0 0 6px rgba(127, 231, 255, 0.35);
    }

    .ai-reco--warn {
      color: #FFC857;
      text-shadow: 0 0 6px rgba(255, 200, 87, 0.45);
    }

    .ai-reco--critical {
      color: #FF5C7C;
      text-shadow: 0 0 8px rgba(255, 92, 124, 0.55);
    }

    /* UI-only fade-out for resolved recommendations */
    .ai-reco.resolving {
      opacity: 0;
      transform: translateX(6px);
      pointer-events: none;
    }

    /* UI-only acknowledgment controls (cognitive, no authority) */
    .ai-reco-controls {
      margin-left: auto;
      display: flex;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.2s ease;
      font-size: 11px;
      color: rgba(180, 220, 240, 0.8);
    }
    .ai-reco:hover .ai-reco-controls {
      opacity: 1;
    }
    .ai-ack-btn,
    .ai-dismiss-btn {
      cursor: pointer;
      user-select: none;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(200, 230, 255, 0.15);
    }
    .ai-reco.acknowledged {
      opacity: 0.75;
    }
    .ai-reco.dismissed {
      opacity: 0.45;
      filter: grayscale(0.4);
    }

    /* Subtle mood shift when many dismissals occur (observer-only) */
    #ai-automation-hud.ignored-state {
      opacity: 0.92;
      filter: saturate(0.9);
    }
    #ai-automation-hud.ignored-state .ai-reco-icon {
      opacity: 0.8;
      filter: saturate(0.85);
    }
    #ai-automation-hud.regaining-trust {
      opacity: 0.96;
      filter: saturate(0.95);
      transition: opacity 0.4s ease, filter 0.4s ease;
    }
    .ai-hud-observation-line {
      display: none;
      font-size: 10px;
      color: rgba(120, 160, 180, 0.55);
      font-style: italic;
      margin-top: 6px;
      text-align: right;
    }

    /* Confidence (persistence-based, render-count only) */
    .ai-reco.confidence-high { opacity: 1; }
    .ai-reco.confidence-medium { opacity: 0.85; }
    .ai-reco.confidence-low { opacity: 0.65; }
    .ai-reco.confidence-faded { opacity: 0.45; filter: saturate(0.8); }

    /* UI-only tooltip for recommendation reasoning (hover only, read-only) */
    .ai-reco-tooltip {
      position: fixed;
      background: rgba(10, 18, 28, 0.92);
      border: 1px solid rgba(0, 255, 255, 0.35);
      box-shadow: 0 0 16px rgba(0, 200, 255, 0.15);
      backdrop-filter: blur(6px);
      padding: 10px 12px;
      font-size: 11.5px;
      color: #CFEFFF;
      max-width: 260px;
      z-index: 1000;
      opacity: 0;
      transform: translateY(-4px);
      transition: opacity 120ms ease, transform 120ms ease;
      pointer-events: none;
    }
    .ai-reco-tooltip.visible {
      opacity: 1;
      transform: translateY(0);
    }
    .ai-tooltip-title {
      color: #7FE7FF;
      font-weight: 600;
      margin-bottom: 6px;
      font-size: 11.5px;
    }
    .ai-tooltip-body {
      color: rgba(207, 239, 255, 0.9);
      font-size: 11px;
      line-height: 1.35;
    }
    .ai-tooltip-line {
      color: rgba(207, 239, 255, 0.85);
      margin-bottom: 4px;
    }
    .ai-tooltip-body ul {
      margin: 0 0 4px 14px;
      padding: 0;
    }
    .ai-tooltip-body li {
      margin: 0 0 2px 0;
      padding: 0;
      list-style: disc;
    }
    .ai-tooltip-note {
      color: rgba(207, 239, 255, 0.7);
      font-style: italic;
      margin-top: 4px;
    }
    .ai-tooltip-refs {
      color: rgba(207, 239, 255, 0.65);
      font-size: 10px;
      margin-top: 3px;
    }
  `;
  return style;
}

function createHUD() {
  const hud = document.createElement('div');
  hud.id = 'ai-automation-hud';
  hud.setAttribute('data-hud-key', 'automationHUD');
  hud.innerHTML = `
  

    <div class="ai-hud-body hud-body">
      <div class="ai-section">
        <div class="ai-section-title">Status</div>
        <div class="ai-line ai-line-status">Status: <span class="ai-muted">DISABLED</span></div>
        <div class="ai-line ai-line-mode">Mode: <span class="ai-muted">QA / Debug</span></div>
        <div class="ai-line ai-line-last-update">Last Update: <span class="ai-muted">--</span></div>
      </div>

      <div class="ai-section">
        <div class="ai-section-title">Engine Snapshot</div>
        <div class="ai-line ai-line-links-created">Links Created: <span class="ai-muted">--</span></div>
        <div class="ai-line ai-line-links-collapsed">Links Collapsed: <span class="ai-muted">--</span></div>
        <div class="ai-line ai-line-recovery-ready">Recovery Ready: <span class="ai-muted">--</span></div>
      </div>

      <div class="ai-section">
        <div class="ai-section-title">Observation</div>
        <div class="ai-line ai-line-network-state">Network State: <span class="ai-muted ai-network-state-value">--</span></div>
        <div class="ai-observation-grid">
          <div class="ai-line ai-observation-row" data-observation-key="cascadeHop">
            <span class="ai-observation-key">cascade.hop</span>
            <span class="ai-observation-value">--</span>
          </div>
          <div class="ai-line ai-observation-row" data-observation-key="cascadeIntensity">
            <span class="ai-observation-key">cascadeIntensity</span>
            <span class="ai-observation-value">--</span>
          </div>
          <div class="ai-line ai-observation-row" data-observation-key="waveBurst">
            <span class="ai-observation-key">waveBurst</span>
            <span class="ai-observation-value">--</span>
          </div>
          <div class="ai-line ai-observation-row" data-observation-key="waveField">
            <span class="ai-observation-key">waveField</span>
            <span class="ai-observation-value">--</span>
          </div>
        </div>
      </div>

      <div class="ai-section">
        <div class="ai-section-title">Recommendations</div>
        <div class="ai-recommendations">
          <div class="ai-line ai-empty">No recommendations available.</div>
        </div>
      </div>

      <div class="ai-hud-observation-line">Observation continues.</div>
    </div>
  `;
  return hud;
}


function createTooltip() {
  const tip = document.createElement('div');
  tip.className = 'ai-reco-tooltip';
  tip.style.display = 'none';
  tip.innerHTML = `
    <div class="ai-tooltip-title">Why AI thinks this</div>
    <div class="ai-tooltip-body">
      <div class="ai-tooltip-line">AI did not provide detailed reasoning for this observation.</div>
    </div>
  `;
  return tip;
}

let automationVisibilityListenerBound = false;

function bindAutomationHudVisibilityListener() {
  if (automationVisibilityListenerBound || typeof window === 'undefined') {
    return;
  }

  automationVisibilityListenerBound = true;
  window.addEventListener(UI_VISIBILITY_CHANGE_EVENT, syncAutomationHudVisibility);
}

function syncAutomationHudVisibility() {
  if (typeof document === 'undefined') {
    return;
  }

  const hud = getAutomationHudRoot();
  const tooltip = document.querySelector('.ai-reco-tooltip');

  if (!UIVisibilityConfig.aiHUD) {
    hud?.remove();
    tooltip?.remove();
    return;
  }

  if (!hud) {
    mountAIAutomationHUD(window.__ATOMA_AIAUTOMATION_HUD_ROOT__ || document.body, { skipVisibilitySync: true });
  }

  applyAutomationHudWaveAnchor();
  updateAIAutomationHUD();
}

// UI-only acknowledgment state (epistemic only; no authority, no feedback)
const ackState = new Map(); // recId -> 'ack' | 'dismiss'
const IGNORE_THRESHOLD = 3;

function clamp01(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(1, numeric));
}

function buildFallbackAutomationReport() {
  const liveMetrics = window?.__ATOMA_LIVE_METRICS__ || {};
  const stress = clamp01(liveMetrics.networkStress ?? 0);
  const corruption = clamp01(liveMetrics.corruptionLevel ?? 0);
  const load = clamp01(liveMetrics.loadPressure ?? 0);
  const stability = clamp01(1 - stress);
  const risk = clamp01((stress * 0.55) + (corruption * 0.3) + (load * 0.15));

  const recoveryReady = risk >= 0.75
    ? 'CRITICAL'
    : risk >= 0.5
      ? 'LOW'
      : stability >= 0.75
        ? 'HIGH'
        : 'MEDIUM';

  const selectedNode = window?.game?.linkingSystem?.primaryNode || window?.game?.selectedNode || null;
  const recommendationAI = window?.game?.linkRecommendationAI || null;
  const candidateScores = recommendationAI?.candidateScores;
  const recommendations = [];
  const observation = buildFallbackObservationData();

  if (selectedNode && candidateScores?.size > 0) {
    const sortedCandidates = Array.from(candidateScores.values())
      .filter((entry) => entry?.node)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 4);

    sortedCandidates.forEach((entry, index) => {
      const candidateName = entry.node.userData?.name || entry.node.name || entry.node.id || `node-${index}`;
      recommendations.push({
        id: `candidate:${candidateName}:${index}`,
        severity: (entry.score ?? 0) >= 0.85 ? 'critical' : (entry.score ?? 0) >= 0.7 ? 'warn' : 'info',
        message: `${candidateName} is a ${Math.round((entry.score ?? 0) * 100)}% fit`,
        reasoning: {
          signals: [
            `Score ${Math.round((entry.score ?? 0) * 100)}%`,
            Number.isFinite(entry.confidence) ? `Confidence ${Math.round(entry.confidence * 100)}%` : null,
            `Target category ${entry.node.userData?.category || 'unknown'}`
          ].filter(Boolean),
          snapshotRefs: [
            `selected:${selectedNode.userData?.name || selectedNode.name || selectedNode.id || 'none'}`,
            `risk:${Math.round(risk * 100)}%`
          ],
          note: 'Fallback automation report derived from live engine state.'
        }
      });
    });
  }

  return {
    meta: {
      mode: 'LIVE_FALLBACK',
      generatedAt: Date.now(),
      source: 'window.__ATOMA_LIVE_METRICS__'
    },
    snapshot: {
      linksCreated: liveMetrics.linkCount ?? 0,
      linksCollapsed: 0,
      recoveryReady
    },
    network: {
      state: risk >= 0.75 ? 'critical' : risk >= 0.5 ? 'stressed' : stability >= 0.75 ? 'stable' : 'watch'
    },
    observation,
    recommendations
  };
}

function buildFallbackObservationData() {
  const liveMetrics = window?.__ATOMA_LIVE_METRICS__ || {};
  const links = Array.isArray(window?.game?.linkingSystem?.links) ? window.game.linkingSystem.links : [];
  const totalLinks = links.length;
  const cascadeLinks = links.filter((link) => Number.isFinite(link?.userData?.cascadeIntensity) && link.userData.cascadeIntensity > 0);
  const cascadeHopCount = Number.isFinite(window?._cascadeHopCount) ? window._cascadeHopCount : 0;
  const cascadeHopRate = typeof window?.getCascadeHopRate === 'function' ? window.getCascadeHopRate() : null;
  const cascadeIntensityLive = Number.isFinite(liveMetrics.cascadeIntensity) ? liveMetrics.cascadeIntensity : null;
  const cascadeIntensityAverage = Number.isFinite(cascadeIntensityLive)
    ? clamp01(cascadeIntensityLive)
    : clamp01(
        cascadeLinks.length > 0
          ? cascadeLinks.reduce((sum, link) => sum + (link?.userData?.cascadeIntensity || 0), 0) / cascadeLinks.length
          : 0
      );
  const cascadeIntensityPeak = clamp01(
    cascadeLinks.reduce((max, link) => Math.max(max, link?.userData?.cascadeIntensity || 0), 0)
  );

  const waveBurstState = typeof window?.getWaveInterferenceBurstState === 'function'
    ? window.getWaveInterferenceBurstState()
    : null;
  const waveBurstSnapshot = waveBurstState?.activeSnapshot || null;
  const waveBurstMetrics = waveBurstState?.metrics || null;
  const waveBurstLifecycle = Array.isArray(window?.game?.waveInterferenceEngine?.getBurstLifecycleEvents?.(3))
    ? window.game.waveInterferenceEngine.getBurstLifecycleEvents(3)
    : [];
  const waveBurstLabel = waveBurstSnapshot
    ? `${waveBurstSnapshot.type}${waveBurstSnapshot.sourceId ? ` · ${waveBurstSnapshot.sourceId}` : ''}`
    : waveBurstMetrics?.activeBurstType
      ? `${waveBurstMetrics.activeBurstType} · idle`
      : 'idle';
  const waveFieldLabel = waveBurstMetrics?.activeBurstType
    ? `${waveBurstMetrics.activeBurstType} · ${waveBurstMetrics.fieldSuppressed ? 'suppressed' : 'open'}`
    : 'idle';

  return {
    cascadeHop: `${Number(cascadeHopCount).toLocaleString()} total · ${cascadeHopRate?.rate || '0/s'}`,
    cascadeIntensity: `${Math.round(cascadeIntensityAverage * 100)}% avg · ${Math.round(cascadeIntensityPeak * 100)}% peak · ${cascadeLinks.length}/${totalLinks} links`,
    waveBurst: `${waveBurstLabel} · lifecycle ${waveBurstMetrics?.lifecycleEventsTracked ?? 0} · recent ${waveBurstLifecycle.length}`,
    waveField: `${waveFieldLabel} · lifecycle ${waveBurstMetrics?.lifecycleEventsTracked ?? 0}`
  };
}

export function mountAIAutomationHUD(rootElement, { skipVisibilitySync = false } = {}) {
  const target = rootElement || document.body;
  if (!target) return;

  window.__ATOMA_AIAUTOMATION_HUD_ROOT__ = target;
  bindAutomationHudVisibilityListener();

  if (!UIVisibilityConfig.aiHUD) {
    document.querySelectorAll('#ai-automation-hud').forEach((node) => node.remove());
    document.querySelectorAll('.ai-reco-tooltip').forEach((node) => node.remove());
    return null;
  }

  document.querySelectorAll('#ai-automation-hud').forEach((node) => node.remove());
  document.querySelectorAll('.ai-reco-tooltip').forEach((node) => node.remove());

  const existingStyle = document.getElementById('ai-automation-hud-style');
  if (existingStyle) {
    existingStyle.remove();
  }

  const style = createStyles();
  const hud = createHUD();
  const tooltip = createTooltip();

  // UI ONLY – Debug scaffold toggle (no data, no authority)
  const toggle = hud.querySelector('#ai-hud-toggle');
  const chevron = hud.querySelector('#ai-hud-chevron');
  if (toggle && chevron) {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const collapsed = hud.classList.toggle('collapsed');
      chevron.textContent = collapsed ? 'ˇ' : '^';
    });
  }

  target.appendChild(style);
  target.appendChild(hud);
  target.appendChild(tooltip);
  applyAutomationHudWaveAnchor();

  if (!skipVisibilitySync) {
    updateAIAutomationHUD();
  }

  return hud;
}

export default mountAIAutomationHUD;

function getAutomationHudRoot() {
  const huds = Array.from(document.querySelectorAll('#ai-automation-hud'));
  if (huds.length === 0) {
    return null;
  }

  if (huds.length > 1) {
    huds.slice(0, -1).forEach((node) => node.remove());
  }

  return huds[huds.length - 1];
}

// READ-ONLY AI HUD BINDING
// No authority. No execution. Debug / QA only.
export function updateAIAutomationHUD(report) {
  if (!UIVisibilityConfig.aiHUD) {
    return;
  }

  const hud = getAutomationHudRoot();
  if (!hud) return;

  const safe = (path, fallback = '--') => {
    try {
      const val = path();
      if (val === undefined || val === null || val === '') return fallback;
      return val;
    } catch {
      return fallback;
    }
  };

  const source = report ?? window?.__ATOMA_AI_AUTOMATION_REPORT__ ?? buildFallbackAutomationReport();

  const statusEl = hud.querySelector('.ai-line-status');
  const modeEl = hud.querySelector('.ai-line-mode');
  const lastUpdateEl = hud.querySelector('.ai-line-last-update');
  const linksCreatedEl = hud.querySelector('.ai-line-links-created');
  const linksCollapsedEl = hud.querySelector('.ai-line-links-collapsed');
  const recoveryReadyEl = hud.querySelector('.ai-line-recovery-ready');
  const networkStateEl = hud.querySelector('.ai-line-network-state');
  const networkStateValueEl = hud.querySelector('.ai-network-state-value');
  const recommendationsEl = hud.querySelector('.ai-recommendations');
  const tooltip = document.querySelector('.ai-reco-tooltip');
  const observation = source?.observation ?? buildFallbackObservationData();

  const mode = safe(() => source?.meta?.mode);
  const lastUpdate = safe(() => {
    const ts = source?.meta?.generatedAt;
    return ts ? new Date(ts).toLocaleTimeString() : '--';
  });
  const linksCreated = safe(() => source?.snapshot?.linksCreated);
  const linksCollapsed = safe(() => source?.snapshot?.linksCollapsed);
  const recoveryReady = safe(() => source?.snapshot?.recoveryReady);
  const networkState = safe(() => source?.network?.state);

  if (statusEl) statusEl.textContent = `Status: ${source ? 'ENABLED' : 'DISABLED'}`;
  if (modeEl) modeEl.textContent = `Mode: ${mode}`;
  if (lastUpdateEl) lastUpdateEl.textContent = `Last Update: ${lastUpdate}`;
  if (linksCreatedEl) linksCreatedEl.textContent = `Links Created: ${linksCreated}`;
  if (linksCollapsedEl) linksCollapsedEl.textContent = `Links Collapsed: ${linksCollapsed}`;
  if (recoveryReadyEl) recoveryReadyEl.textContent = `Recovery Ready: ${recoveryReady}`;
  if (networkStateEl) networkStateEl.textContent = `Network State: ${networkState}`;
  if (networkStateValueEl) networkStateValueEl.textContent = networkState;

  const observationKeys = ['cascadeHop', 'cascadeIntensity', 'waveBurst', 'waveField'];
  observationKeys.forEach((key) => {
    const row = hud.querySelector(`[data-observation-key="${key}"]`);
    const valueEl = row?.querySelector('.ai-observation-value');
    if (valueEl) {
      valueEl.textContent = observation?.[key] ?? '--';
    }
  });

  if (recommendationsEl) {
    // UI-only fade-out for resolved recommendations
    // No authority, no execution, no engine interaction
    const allowedSev = ['info', 'warn', 'critical'];
    const recs = Array.isArray(source?.recommendations) ? source.recommendations : [];

    recommendationsEl.querySelectorAll('.ai-empty').forEach((node) => {
      if (!node.classList.contains('ai-reco')) {
        node.remove();
      }
    });

    // Build a map of existing DOM nodes keyed by id
    const existing = new Map();
    recommendationsEl.querySelectorAll('.ai-reco').forEach((node) => {
      const id = node.dataset.id;
      if (id) existing.set(id, node);
    });

    const activeIds = new Set();

    recs.forEach((rec, idx) => {
      if (!rec || typeof rec !== 'object') return;
      const sevRaw = (rec.severity || 'info').toString().toLowerCase();
      const severity = allowedSev.includes(sevRaw) ? sevRaw : 'info';
      const id = rec.id ?? `${severity}:${rec.message ?? '--'}:${idx}`;
      activeIds.add(id);

      let node = existing.get(id);
      if (!node) {
        // Create new recommendation element
        node = document.createElement('div');
        node.className = `ai-reco ai-reco--${severity}`;
        node.dataset.id = id;
        node.dataset.age = '0'; // persistence counter (render-based, not time)

        const icon = document.createElement('span');
        icon.className = 'ai-reco-icon';
        icon.textContent = severity === 'critical' ? '?' : severity === 'warn' ? '?' : '?';

        const text = document.createElement('span');
        text.className = 'ai-reco-text';
        text.textContent = rec.message ?? '--';

        node.appendChild(icon);
        node.appendChild(text);
        recommendationsEl.appendChild(node);
      } else {
        // Update in place, cancel resolving if reappeared
        node.className = `ai-reco ai-reco--${severity}`;
        node.classList.remove('resolving');
        const age = parseInt(node.dataset.age ?? '0', 10);
        node.dataset.age = Number.isFinite(age) ? String(age + 1) : '0';
        const icon = node.querySelector('.ai-reco-icon');
        const text = node.querySelector('.ai-reco-text');
        if (icon) icon.textContent = severity === 'critical' ? '?' : severity === 'warn' ? '?' : '?';
        if (text) text.textContent = rec.message ?? '--';
      }

      // Apply confidence class based on render persistence
      const ageVal = parseInt(node.dataset.age ?? '0', 10);
      node.classList.remove('confidence-high', 'confidence-medium', 'confidence-low', 'confidence-faded');
      if (ageVal <= 1) {
        node.classList.add('confidence-high');
      } else if (ageVal <= 3) {
        node.classList.add('confidence-medium');
      } else if (ageVal <= 5) {
        node.classList.add('confidence-low');
      } else {
        node.classList.add('confidence-faded');
      }

      // Apply acknowledgment UI state (epistemic only; no authority)
      attachAckControls(node, id);
      applyAckState(node, id);

      // Attach hover handlers for reasoning tooltip (read-only)
      if (tooltip) {
        node.addEventListener('mouseenter', (e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const reasoning = rec?.reasoning || {};
          tooltip.style.display = 'block';
          tooltip.classList.add('visible');

          // Position to the right of HUD with slight vertical offset
          const top = Math.min(rect.top + window.scrollY, window.innerHeight - tooltip.offsetHeight - 10);
          const left = Math.min(rect.right + 12, window.innerWidth - tooltip.offsetWidth - 10);
          tooltip.style.top = `${top}px`;
          tooltip.style.left = `${left}px`;

          const body = tooltip.querySelector('.ai-tooltip-body');
          if (body) {
            body.innerHTML = '';
            const title = document.createElement('div');
            title.className = 'ai-tooltip-line';
            title.textContent = 'Observed because:';
            body.appendChild(title);

            const signals = Array.isArray(reasoning.signals) ? reasoning.signals : [];
            const refs = Array.isArray(reasoning.snapshotRefs) ? reasoning.snapshotRefs : [];
            const note = reasoning.note;

            if (signals.length > 0) {
              const ul = document.createElement('ul');
              signals.forEach(s => {
                const li = document.createElement('li');
                li.textContent = s;
                ul.appendChild(li);
              });
              body.appendChild(ul);
            } else {
              const line = document.createElement('div');
              line.className = 'ai-tooltip-line';
              line.textContent = 'AI did not provide detailed reasoning for this observation.';
              body.appendChild(line);
            }

            if (note) {
              const noteEl = document.createElement('div');
              noteEl.className = 'ai-tooltip-note';
              noteEl.textContent = note;
              body.appendChild(noteEl);
            }

            if (refs.length > 0) {
              const refsEl = document.createElement('div');
              refsEl.className = 'ai-tooltip-refs';
              refsEl.textContent = `Snapshot refs: ${refs.join(', ')}`;
              body.appendChild(refsEl);
            }

            // Optional confidence echo from current class
            const confidence = node.classList.contains('confidence-faded')
              ? 'low'
              : node.classList.contains('confidence-low')
                ? 'low'
                : node.classList.contains('confidence-medium')
                  ? 'medium'
                  : 'high';
            const confEl = document.createElement('div');
            confEl.className = 'ai-tooltip-line';
            confEl.textContent = `AI confidence: ${confidence}`;
            body.appendChild(confEl);
          }
        });

        node.addEventListener('mouseleave', () => {
          tooltip.classList.remove('visible');
          tooltip.style.display = 'none';
        });
      }
    });

    // Mark missing recs for fade-out
    existing.forEach((node, id) => {
      if (!activeIds.has(id)) {
        node.classList.add('resolving');
        const removeAfter = () => {
          node.removeEventListener('transitionend', removeAfter);
          node.remove();
          // If nothing left after removal, restore empty state
          if (!recommendationsEl.querySelector('.ai-reco')) {
            const empty = document.createElement('div');
            empty.className = 'ai-line ai-empty';
            empty.textContent = 'No recommendations available.';
            recommendationsEl.appendChild(empty);
          }
        };
        node.addEventListener('transitionend', removeAfter, { once: true });
      }
    });

    // Ensure empty state if no recs and none resolving
    const hasActive = recs.length > 0;
    const hasNodes = recommendationsEl.querySelector('.ai-reco');
    const hasResolving = recommendationsEl.querySelector('.ai-reco.resolving');
    const hasEmpty = recommendationsEl.querySelector('.ai-empty');
    if (!hasActive && !hasNodes && !hasResolving && !hasEmpty) {
      const empty = document.createElement('div');
      empty.className = 'ai-line ai-empty';
      empty.dataset.aiEmptyState = 'recommendations';
      empty.textContent = 'No recommendations available.';
      recommendationsEl.appendChild(empty);
    }
  }
}

// UI-only acknowledgment state application (epistemic only; no authority, no feedback)
function applyAckState(node, id) {
  if (!node || !id) return;
  const state = ackState.get(id);
  node.classList.remove('acknowledged', 'dismissed');
  if (state === 'ack') node.classList.add('acknowledged');
  if (state === 'dismiss') node.classList.add('dismissed');
}

// UI-only controls to mark awareness/soft ignore (no execution, no authority)
function attachAckControls(node, id) {
  if (!node || !id) return;
  let controls = node.querySelector('.ai-reco-controls');
  if (!controls) {
    controls = document.createElement('div');
    controls.className = 'ai-reco-controls';

    const ackBtn = document.createElement('span');
    ackBtn.className = 'ai-ack-btn';
    ackBtn.textContent = 'I see';
    ackBtn.title = 'Mark as seen (no action)';

    const dismissBtn = document.createElement('span');
    dismissBtn.className = 'ai-dismiss-btn';
    dismissBtn.textContent = 'Ignore';
    dismissBtn.title = 'Soft dismiss (UI only)';

    const onAck = (e) => {
      e.stopPropagation();
      const current = ackState.get(id);
      if (current === 'ack') {
        ackState.delete(id); // reversible
      } else {
        ackState.set(id, 'ack');
      }
      applyAckState(node, id);
      applyIgnoredMood();
    };

    const onDismiss = (e) => {
      e.stopPropagation();
      const current = ackState.get(id);
      if (current === 'dismiss') {
        ackState.delete(id); // reversible
      } else {
        ackState.set(id, 'dismiss');
      }
      applyAckState(node, id);
      applyIgnoredMood();
    };

    ackBtn.addEventListener('click', onAck);
    dismissBtn.addEventListener('click', onDismiss);

    controls.appendChild(ackBtn);
    controls.appendChild(dismissBtn);
    node.appendChild(controls);
  }
}

// AI observes patterns of attention.
// Observation does not imply intent, action, or judgment.
// UI-only mood shift based on dismissals (session-only, no authority).
function applyIgnoredMood() {
  const hud = getAutomationHudRoot();
  if (!hud) return;
  const note = hud.querySelector('.ai-hud-observation-line');

  let dismissCount = 0;
  let ackCount = 0;
  ackState.forEach((v) => {
    if (v === 'dismiss') dismissCount++;
    if (v === 'ack') ackCount++;
  });

  const inIgnored = hud.classList.contains('ignored-state');
  // Enter ignored state if dismissals reach threshold
  if (dismissCount >= IGNORE_THRESHOLD) {
    hud.classList.add('ignored-state');
    hud.classList.remove('regaining-trust');
    if (note) note.style.display = 'block';
    return;
  }

  // If previously ignored and acknowledgments are present, ease back visually
  if (inIgnored && ackCount > 0) {
    hud.classList.remove('ignored-state');
    hud.classList.add('regaining-trust');
    if (note) note.style.display = 'none';
    return;
  }

  // Default: normal state
  hud.classList.remove('ignored-state');
  hud.classList.remove('regaining-trust');
  if (note) note.style.display = 'none';
}

