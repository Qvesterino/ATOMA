/**
 * GAMEPLAY HINT LAYER — Alpha Clarity
 * ===================================
 * Minimal, non-intrusive hint system for first-time player clarity.
 * Shows at most one hint at a time. Auto-dismisses after a timeout.
 * No tutorial mode, no sequences — just 3 situational nudges.
 *
 * Triggers:
 *   - start:      first world load
 *   - firstLink:  first successful link creation
 *   - rewindBlock:first time rewind is blocked with a reason
 */
import { FIRST_RUN_GUIDANCE_COPY } from './FirstRunGuidanceDirector.js';

function resolveWorldKey(context = {}) {
  return String(context?.world || '').toLowerCase();
}

function resolveStartHint(context = {}) {
  const world = resolveWorldKey(context);
  if (world === 'quantum') {
    return 'Stabilize the living network. On Quantum Island, strong bonds calm the shimmer between possibilities.';
  }
  if (world === 'desert') {
    return 'Stabilize the living network. In Dream Desert, patient links turn distance into coherence.';
  }
  return 'Stabilize the living network. Place nodes, then forge strong links to hold it together.';
}

function resolveFirstLinkHint(context = {}) {
  const world = resolveWorldKey(context);
  if (world === 'quantum') {
    return 'Good. The island answered your first bond. Quantum rewards bold momentum, but dirty bonds will punish greed.';
  }
  if (world === 'desert') {
    return 'Good. Distance is starting to hold. Dream Desert rewards patient, cleaner bonds before you overexpand.';
  }
  return 'Good. Every stable link strengthens the network. Match categories for cleaner, stronger bonds.';
}

function resolveRewindBlockHint(context = {}) {
  switch (context?.reason) {
    case 'need-more-nodes':
      return 'The lattice is too thin to hold a surge yet. Expand your anchor base before you try to stabilize it.';
    case 'need-more-links':
      return 'Your anchors exist, but the surge still lacks enough routes. Build more bonds before you push harder.';
    case 'quality-too-low':
      return 'You forced momentum through unstable bonds. Consolidate with cleaner links before the surge slips.';
    case 'tension-critical':
      return 'A hotspot is flaring inside the lattice. Relieve that corridor before you try to hold the surge.';
    case 'chokepoint-fragile':
      return 'Too much pressure is riding one brittle route. Reinforce it or build an alternate lane.';
    case 'synergy-too-low':
      return 'The network is safe but too quiet. Risk bolder categories or denser bonds to open the surge.';
    default:
      return 'The network is still unstable. Grow it, strengthen it, and prepare the surge.';
  }
}

function resolveRewindStartHint(context = {}) {
  const world = resolveWorldKey(context);
  if (world === 'quantum') {
    return 'Stabilization surge achieved. Hold Quantum Island steady while collapse pressure rewinds.';
  }
  if (world === 'desert') {
    return 'Stabilization surge achieved. Keep the Dream Desert lattice coherent while pressure falls away.';
  }
  return 'Stabilization surge achieved. Hold the network together and prevent collapse.';
}

function resolveSoftFailurePressureHint(context = {}) {
  switch (context?.reason) {
    case 'quality-too-low':
      return 'The hold is breaking. Clean up weaker bonds before you push the surge again.';
    case 'need-more-links':
      return 'Pressure is rising faster than the lattice can route it. Add cleaner bonds first.';
    case 'need-more-nodes':
      return 'The lattice is too thin. Add anchors before collapse pressure hardens.';
    case 'tension-critical':
      return 'Pressure is pooling into a live hotspot. Fix the corridor before the hold breaks again.';
    case 'chokepoint-fragile':
      return 'A brittle chokepoint is carrying too much. Route around it before pressure spikes.';
    default:
      return 'Pressure is rising. Stabilize bonds before you push further.';
  }
}

function resolveSoftFailureDriftHint(context = {}) {
  const world = resolveWorldKey(context);
  if (world === 'desert') {
    return 'The surge slipped and the dunes are drifting again. Slow down and rebuild a cleaner hold.';
  }
  if (world === 'quantum') {
    return 'The hold broke and the island is slipping back into noise. Rebuild with cleaner bonds.';
  }
  return 'The hold broke. Rebuild the lattice before pressure outruns you again.';
}

function resolveSoftFailureNodeFailureHint(context = {}) {
  const severed = Number(context?.severedLinks ?? 0);
  if (severed >= 3) {
    return 'A critical anchor failed and tore multiple bonds open. Stabilize the damaged side before expanding.';
  }
  return 'A critical anchor failed. Repair the local lattice before you push the network wider.';
}

function resolveCollapseReadabilityHint(context = {}) {
  const { state, reason, action, text, nodeLabel, corridorLabel } = context;
  const label = corridorLabel || nodeLabel || 'corridor';

  if (state === 'fracturing') {
    if (reason === 'node-countdown') {
      return `Structural failure in ${label}. ${action} now or lose the chain.`;
    }
    if (reason === 'cascade-propagating') {
      return `Cascade tearing through ${label}. ${action}.`;
    }
    return `Fracturing detected in ${label}. ${action} immediately.`;
  }

  if (state === 'critical') {
    if (reason === 'chokepoint-overload') {
      return `Critical chokepoint: ${action} or lose chain.`;
    }
    if (reason === 'corruption-spike') {
      return `Corruption link unstable under hold: ${action}.`;
    }
    if (reason === 'hub-overload') {
      return `Hub overloading: ${action} before collapse spreads.`;
    }
    return `Critical corridor: ${action}.`;
  }

  if (state === 'strained') {
    return `${label} strained. ${action} before it hardens.`;
  }

  return `${label} under stress. ${action}.`;
}

const HINTS = Object.freeze({
  start: {
    text: resolveStartHint,
    durationMs: 6500,
    priority: 1
  },
  firstLink: {
    text: resolveFirstLinkHint,
    durationMs: 5600,
    priority: 2
  },
  rewindBlock: {
    text: resolveRewindBlockHint,
    durationMs: 5600,
    priority: 3
  },
  rewindStart: {
    text: resolveRewindStartHint,
    durationMs: 5200,
    priority: 4
  },
  softFailurePressure: {
    text: resolveSoftFailurePressureHint,
    durationMs: 4200,
    priority: 4,
    variant: 'warning'
  },
  softFailureDrift: {
    text: resolveSoftFailureDriftHint,
    durationMs: 4600,
    priority: 5,
    variant: 'warning'
  },
  softFailureNodeFailure: {
    text: resolveSoftFailureNodeFailureHint,
    durationMs: 4800,
    priority: 6,
    variant: 'warning'
  },
  guidedStart: {
    text: FIRST_RUN_GUIDANCE_COPY.guidedStart,
    durationMs: 7000,
    priority: 7
  },
  guidedFirstBond: {
    text: FIRST_RUN_GUIDANCE_COPY.guidedFirstBond,
    durationMs: 5600,
    priority: 8
  },
  guidedLocalLattice: {
    text: FIRST_RUN_GUIDANCE_COPY.guidedLocalLattice,
    durationMs: 5200,
    priority: 9
  },
  guidedSurgeBlocked: {
    text: FIRST_RUN_GUIDANCE_COPY.guidedSurgeBlocked,
    durationMs: 5400,
    priority: 10
  },
  guidedSurgeActive: {
    text: FIRST_RUN_GUIDANCE_COPY.guidedSurgeActive,
    durationMs: 6200,
    priority: 11,
    variant: 'major'
  },
  collapseReadability: {
    text: resolveCollapseReadabilityHint,
    durationMs: 5200,
    priority: 12,
    variant: 'default'
  },
  abandonSacrifice: {
    text: (ctx) => `Corridor ${ctx.corridorLabel || 'sacrificed'}. Core lattice relieved.`,
    durationMs: 4200,
    priority: 13,
    variant: 'warning'
  },
  reinforceUnavailable: {
    text: 'Corridor not threatened enough to reinforce.',
    durationMs: 2800,
    priority: 14,
    variant: 'default'
  },
  rerouteSuccess: {
    text: (ctx) => `Reroute opened. Hotspot ${ctx.hotspotLabel || 'relieved'} cooling.`,
    durationMs: 3800,
    priority: 13,
    variant: 'default'
  }
});

export class GameplayHintLayer {
  constructor() {
    this._container = null;
    this._active = false;
    this._timer = null;
    this._shownKeys = new Set();
    this._lastShownAt = new Map();
    this._createDOM();
  }

  _createDOM() {
    if (typeof document === 'undefined') return;

    if (!document.getElementById('atoma-hint-styles')) {
      const style = document.createElement('style');
      style.id = 'atoma-hint-styles';
      style.textContent = `
        #atoma-gameplay-hints {
          position: fixed;
          bottom: 120px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 2000;
          pointer-events: none;
          font-family: 'Rajdhani', 'Segoe UI', sans-serif;
        }
        .atoma-hint-toast {
          background: rgba(8, 12, 20, 0.85);
          backdrop-filter: blur(12px) saturate(1.1);
          -webkit-backdrop-filter: blur(12px) saturate(1.1);
          border: 1px solid rgba(0, 200, 220, 0.25);
          border-radius: 6px;
          padding: 10px 18px;
          color: rgba(200, 225, 245, 0.9);
          font-size: 12px;
          letter-spacing: 0.08em;
          text-align: center;
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 0.4s ease, transform 0.4s ease;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        .atoma-hint-toast.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .atoma-hint-toast--major {
          border-color: rgba(255, 166, 0, 0.42);
          background: rgba(18, 12, 8, 0.88);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.42), 0 0 24px rgba(255, 140, 0, 0.18);
          color: rgba(255, 233, 204, 0.96);
          font-size: 13px;
          letter-spacing: 0.1em;
        }
        .atoma-hint-toast--warning {
          border-color: rgba(255, 122, 184, 0.34);
          background: rgba(22, 10, 16, 0.90);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.40), 0 0 18px rgba(255, 61, 142, 0.16);
          color: rgba(255, 216, 230, 0.96);
        }
      `;
      document.head.appendChild(style);
    }

    this._container = document.createElement('div');
    this._container.id = 'atoma-gameplay-hints';
    document.body.appendChild(this._container);
  }

  /**
   * Show a hint by key if it hasn't been shown yet.
   * @param {string} key — 'start' | 'firstLink' | 'rewindBlock' | 'rewindStart'
   * @param {Object} [context]
   * @returns {boolean} true if shown, false if already shown or unknown
   */
  show(key, context = {}, options = {}) {
    const fingerprint = typeof options?.fingerprint === 'string' && options.fingerprint.trim()
      ? options.fingerprint.trim()
      : key;
    const config = HINTS[key];
    if (!config) return false;

    const allowRepeat = options?.allowRepeat === true;
    const cooldownMs = Math.max(0, Number(options?.cooldownMs) || 0);
    const now = typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();
    const lastShownAt = this._lastShownAt.get(fingerprint) || 0;

    if (!allowRepeat && this._shownKeys.has(fingerprint)) return false;
    if (allowRepeat && cooldownMs > 0 && (now - lastShownAt) < cooldownMs) return false;

    this._shownKeys.add(fingerprint);
    this._lastShownAt.set(fingerprint, now);
    const text = typeof config.text === 'function'
      ? config.text(context)
      : config.text;
    this._render(text, config.durationMs, config.variant || options?.variant || 'default');
    return true;
  }

  _render(text, durationMs, variant = 'default') {
    if (!this._container) return;

    // Clear any existing hint
    this._container.innerHTML = '';
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }

    const toast = document.createElement('div');
    toast.className = 'atoma-hint-toast';
    if (variant === 'major') {
      toast.classList.add('atoma-hint-toast--major');
    } else if (variant === 'warning') {
      toast.classList.add('atoma-hint-toast--warning');
    }
    toast.textContent = text;
    this._container.appendChild(toast);

    // Force reflow for transition
    void toast.offsetWidth;
    toast.classList.add('visible');

    this._timer = setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 500);
    }, durationMs);
  }

  /** Reset shown state (e.g. on new game / world switch). */
  reset() {
    this._shownKeys.clear();
    this._lastShownAt.clear();
    if (this._container) this._container.innerHTML = '';
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  destroy() {
    this.reset();
    if (this._container?.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
    this._container = null;
  }
}
