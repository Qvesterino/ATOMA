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

const HINTS = Object.freeze({
  start: {
    text: 'Place nodes and link them to build synergy',
    durationMs: 6000,
    priority: 1
  },
  firstLink: {
    text: 'Match categories for stronger links',
    durationMs: 5000,
    priority: 2
  },
  rewindBlock: {
    text: 'Build quality network to rewind time',
    durationMs: 5000,
    priority: 3
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
      `;
      document.head.appendChild(style);
    }

    this._container = document.createElement('div');
    this._container.id = 'atoma-gameplay-hints';
    document.body.appendChild(this._container);
  }

  /**
   * Show a hint by key if it hasn't been shown yet.
   * @param {string} key — 'start' | 'firstLink' | 'rewindBlock'
   * @returns {boolean} true if shown, false if already shown or unknown
   */
  show(key) {
    if (this._shownKeys.has(key)) return false;
    const config = HINTS[key];
    if (!config) return false;

    this._shownKeys.add(key);
    this._render(config.text, config.durationMs);
    return true;
  }

  _render(text, durationMs) {
    if (!this._container) return;

    // Clear any existing hint
    this._container.innerHTML = '';
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }

    const toast = document.createElement('div');
    toast.className = 'atoma-hint-toast';
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
