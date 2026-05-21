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
  guidedStart: {
    text: FIRST_RUN_GUIDANCE_COPY.guidedStart,
    durationMs: 7000,
    priority: 5
  },
  guidedFirstBond: {
    text: FIRST_RUN_GUIDANCE_COPY.guidedFirstBond,
    durationMs: 5600,
    priority: 6
  },
  guidedLocalLattice: {
    text: FIRST_RUN_GUIDANCE_COPY.guidedLocalLattice,
    durationMs: 5200,
    priority: 7
  },
  guidedSurgeBlocked: {
    text: FIRST_RUN_GUIDANCE_COPY.guidedSurgeBlocked,
    durationMs: 5400,
    priority: 8
  },
  guidedSurgeActive: {
    text: FIRST_RUN_GUIDANCE_COPY.guidedSurgeActive,
    durationMs: 6200,
    priority: 9,
    variant: 'major'
  }
});

export class GameplayHintLayer {
  constructor() {
    this._container = null;
    this._active = false;
    this._timer = null;
    this._shownKeys = new Set();
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
    if (this._shownKeys.has(fingerprint)) return false;
    const config = HINTS[key];
    if (!config) return false;

    this._shownKeys.add(fingerprint);
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
