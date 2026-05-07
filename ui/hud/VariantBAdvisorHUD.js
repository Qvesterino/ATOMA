/**
 * VARIANT B-A – COMPACT ADVISOR (SCAFFOLD)
 * --------------------------------------
 * Player-facing AI HUD
 * UI-only, no logic, no AI, no authority
 *
 * Placeholder layout only.
 * Language and data binding come later.
 */

import {
  UI_VISIBILITY_CHANGE_EVENT,
  isHudEffectivelyVisible,
} from '../config/UIVisibilityConfig.js';

let advisorVisibilityListenerBound = false;

function bindAdvisorHudVisibilityListener() {
  if (advisorVisibilityListenerBound || typeof window === 'undefined') {
    return;
  }

  advisorVisibilityListenerBound = true;
  window.addEventListener(UI_VISIBILITY_CHANGE_EVENT, syncAdvisorHudVisibility);
}

function syncAdvisorHudVisibility() {
  if (typeof document === 'undefined') {
    return;
  }

  const existing = document.querySelector('[data-hud-variant="b-advisor"]');

  if (!isHudEffectivelyVisible('advisorHUD')) {
    existing?.remove();
    return;
  }

  if (!existing) {
    mountVariantBAdvisorHUD(window.__ATOMA_VARIANT_B_ADVISOR_ROOT__ || document.body, { skipVisibilitySync: true });
  }

  updateVariantBAdvisorHUD();
}

export function mountVariantBAdvisorHUD(rootElement, { skipVisibilitySync = false } = {}) {
  const target = rootElement || document.body;
  if (!target) {
    return null;
  }

  window.__ATOMA_VARIANT_B_ADVISOR_ROOT__ = target;
  bindAdvisorHudVisibilityListener();

  if (!isHudEffectivelyVisible('advisorHUD')) {
    target.querySelectorAll('[data-hud-variant="b-advisor"]').forEach((node) => node.remove());
    return null;
  }

  const styleId = "variant-b-advisor-hud-style";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
.variant-b-advisor-hud {
  position: fixed;
  font-family: 'Rajdhani', 'Segoe UI', sans-serif;

  /* ⬅️ presun na PRAVÚ stranu */
  right: 18px;
  left: auto;

  /* ⬆️ NAD Atoma mood HUD */
  bottom: 92px;

  width: 260px;
  max-width: 260px;

  z-index: 160; /* vyššie než Core Metrics, nižšie než modálne UI */

  pointer-events: auto;
}


.variant-b-advisor-hud .panel {
  background: rgba(8, 12, 20, 0.75);
  border-right: 2px solid rgba(0, 200, 220, 0.35);
  border-radius: 8px 0 0 8px;
  backdrop-filter: blur(16px) saturate(1.2);
  -webkit-backdrop-filter: blur(16px) saturate(1.2);
  padding: 14px 16px;
  transition: border-color 0.3s ease;
}

.variant-b-advisor-hud:hover .panel {
  border-right-color: rgba(0, 200, 220, 0.55);
}

.variant-b-advisor-hud .header {
  font-size: 8px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: rgba(0, 200, 220, 0.4);
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(0, 200, 220, 0.1);
}

.variant-b-advisor-hud .body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 11px;
  line-height: 1.4;
}

.variant-b-advisor-hud .row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.variant-b-advisor-hud .label {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 9px;
  color: rgba(200, 225, 245, 0.4);
}

.variant-b-advisor-hud .value {
  color: rgba(200, 225, 245, 0.85);
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  font-size: 11px;
}

.variant-b-advisor-hud .muted {
  opacity: 0.5;
}
/* Disable legacy AI automation HUD */
.ai-automation-hud {
  display: none !important;
}
.variant-b-advisor-hud .extra {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transition: opacity 0.3s ease, max-height 0.3s ease, margin-top 0.3s ease;
}

.variant-b-advisor-hud:hover .extra {
  opacity: 1;
  max-height: 120px;
  margin-top: 6px;
}

.variant-b-advisor-hud .insight {
  margin-top: 8px;
  border-top: 1px solid rgba(0, 200, 220, 0.1);
  padding-top: 8px;
}

.variant-b-advisor-hud .insight-label {
  font-size: 8px;
  color: rgba(0, 200, 220, 0.4);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.variant-b-advisor-hud .insight-value {
  font-size: 11px;
  color: rgba(200, 225, 245, 0.85);
}
    `;
    document.head.appendChild(style);
  }

  const existing = target.querySelector('[data-hud-variant="b-advisor"]');
  if (existing) {
    return existing;
  }

  const container = document.createElement("div");
  container.className = "variant-b-advisor-hud";
  container.setAttribute("data-hud-variant", "b-advisor");
  container.innerHTML = `
      <div class="panel">
        <div class="header">AI STATUS</div>
        <div class="body">
          <div class="row">
            <span class="label">Stability</span>
            <span class="value muted" data-variant-value="stability">—</span>
          </div>
          <div class="row">
            <span class="label">Risk</span>
            <span class="value muted" data-variant-value="risk">—</span>
          </div>
          <div class="extra">
            <div class="row">
              <span class="label">Recovery</span>
              <span class="value muted" data-variant-value="recovery">—</span>
            </div>
            <div class="insight">
              <div class="insight-label">Insight:</div>
              <div class="insight-value muted" data-variant-value="insight">—</div>
            </div>
          </div>
        </div>
      </div>
    `;

  target.appendChild(container);
  if (!skipVisibilitySync) {
    updateVariantBAdvisorHUD();
  }
  return container;
}

function formatPercent(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }

  const percent = Math.round(value * 100);
  return `${percent}%`;
}

function getSafeText(value) {
  return value ? String(value) : "—";
}

function clamp01(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(1, numeric));
}

function buildFallbackAdvisorData() {
  const liveMetrics = window?.__ATOMA_LIVE_METRICS__ || {};
  const stress = clamp01(liveMetrics.networkStress ?? 0);
  const corruption = clamp01(liveMetrics.corruptionLevel ?? 0);
  const load = clamp01(liveMetrics.loadPressure ?? 0);
  const stability = clamp01(1 - stress);
  const risk = clamp01((stress * 0.55) + (corruption * 0.3) + (load * 0.15));

  const recovery = risk >= 0.75
    ? 'CRITICAL'
    : risk >= 0.5
      ? 'LOW'
      : stability >= 0.75
        ? 'HIGH'
        : 'MEDIUM';

  const networkState = risk >= 0.75
    ? 'critical'
    : risk >= 0.5
      ? 'stressed'
      : stability >= 0.75
        ? 'stable'
        : 'watch';

  return {
    meta: {
      mode: 'LIVE_FALLBACK',
      generatedAt: Date.now(),
      source: 'window.__ATOMA_LIVE_METRICS__'
    },
    snapshot: {
      linksCreated: liveMetrics.linkCount ?? 0,
      linksCollapsed: 0,
      recoveryReady: recovery
    },
    network: {
      state: networkState
    },
    stability,
    risk,
    recovery,
    insight: 'Live metrics fallback in use.'
  };
}

export function updateVariantBAdvisorHUD(data) {
  if (!isHudEffectivelyVisible('advisorHUD')) {
    return;
  }

  const container = document.querySelector('[data-hud-variant="b-advisor"]');
  if (!container) {
    return;
  }

  const source = data ?? window?.__ATOMA_AI_ADVISOR__ ?? buildFallbackAdvisorData();
  if (!source) {
    const fallbackKeys = container.querySelectorAll("[data-variant-value]");
    fallbackKeys.forEach((node) => {
      node.textContent = "—";
    });
    return;
  }

  const stabilityEl = container.querySelector('[data-variant-value="stability"]');
  const riskEl = container.querySelector('[data-variant-value="risk"]');
  const recoveryEl = container.querySelector('[data-variant-value="recovery"]');
  const insightEl = container.querySelector('[data-variant-value="insight"]');

  if (stabilityEl) {
    stabilityEl.textContent = formatPercent(source.stability);
  }
  if (riskEl) {
    riskEl.textContent = formatPercent(source.risk);
  }
  if (recoveryEl) {
    recoveryEl.textContent = getSafeText(source.recovery);
  }
  if (insightEl) {
    insightEl.textContent = getSafeText(source.insight);
  }
}
