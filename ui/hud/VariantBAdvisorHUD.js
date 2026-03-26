/**
 * VARIANT B-A – COMPACT ADVISOR (SCAFFOLD)
 * --------------------------------------
 * Player-facing AI HUD
 * UI-only, no logic, no AI, no authority
 *
 * Placeholder layout only.
 * Language and data binding come later.
 */

export function mountVariantBAdvisorHUD(rootElement) {
  const target = rootElement || document.body;
  if (!target) {
    return null;
  }

  const styleId = "variant-b-advisor-hud-style";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
.variant-b-advisor-hud {
  position: fixed;

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
  background: rgba(8, 14, 22, 0.55);
  border: 1px solid rgba(0, 220, 255, 0.28);
  box-shadow: 0 0 14px rgba(0, 200, 255, 0.12);
  backdrop-filter: blur(6px);
  border-radius: 6px;
  padding: 12px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.variant-b-advisor-hud:hover .panel {
  border-color: rgba(0, 220, 255, 0.4);
  box-shadow: 0 0 16px rgba(0, 200, 255, 0.18);
}

.variant-b-advisor-hud .header {
  font-size: 12px;
  letter-spacing: 0.08em;
  color: #6FF3FF;
  margin-bottom: 6px;
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
  letter-spacing: 0.04em;
}

.variant-b-advisor-hud .value {
  color: #BEEFFF;
}

.variant-b-advisor-hud .muted {
  opacity: 0.6;
}
/* Disable legacy AI automation HUD */
.ai-automation-hud {
  display: none !important;
}
.variant-b-advisor-hud .extra {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transition: opacity 0.2s ease, max-height 0.2s ease, margin-top 0.2s ease;
}
.variant-b-advisor-hud .label {
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(190, 239, 255, 0.85);
}
.variant-b-advisor-hud:hover .extra {
  opacity: 1;
  max-height: 120px;
  margin-top: 6px;
}

.variant-b-advisor-hud .insight {
  margin-top: 6px;
  border-top: 1px solid rgba(0, 220, 255, 0.18);
  padding-top: 6px;
}

.variant-b-advisor-hud .insight-label {
  font-size: 11px;
  color: #6FF3FF;
  letter-spacing: 0.04em;
  margin-bottom: 3px;
}

.variant-b-advisor-hud .insight-value {
  font-size: 11px;
  color: #BEEFFF;
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
