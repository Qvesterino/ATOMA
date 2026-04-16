 /**
 * DEVELOPER TOGGLE 1.0
 * 
 * Global keyboard shortcut for toggling ATOMA developer mode.
 * When developer mode is OFF, all DEBUG_AUTHORING layer HUDs are hidden.
 * When ON, they become visible.
 * 
 * DEFAULT: F4 key
 * 
 * This module also exposes console commands for developer control.
 * 
 * SAFETY: Pure UI toggle — zero gameplay impact
 */

import {
  isDeveloperMode,
  toggleDeveloperMode,
  setDeveloperMode,
  debugLayerState,
  getLayerState
} from './HUDLayerManager.js';

const TOGGLE_KEY = 'F4';
const STORAGE_KEY = 'atoma.developerToggleEnabled';

/** @type {boolean} Whether the key listener is active */
let _listenerAttached = false;

/** @type {HTMLElement|null} Optional on-screen indicator */
let _indicator = null;

/**
 * Initialize the developer toggle.
 * Attaches keyboard listener and creates on-screen indicator.
 */
export function initializeDeveloperToggle() {
  if (_listenerAttached) return;

  // Keyboard listener
  document.addEventListener('keydown', handleKeyDown);
  _listenerAttached = true;

  // Create subtle on-screen indicator
  createIndicator();

  // Expose console API
  exposeConsoleAPI();

  console.log(`✓ Developer Toggle initialized — press ${TOGGLE_KEY} to toggle`);
}

/**
 * Handle keyboard event.
 * @param {KeyboardEvent} e
 * @private
 */
function handleKeyDown(e) {
  if (e.key === TOGGLE_KEY) {
    e.preventDefault();
    toggleDeveloperMode();
    updateIndicator();
  }
}

/**
 * Create CSS-only developer mode indicator via body class.
 * No DOM element created — uses ::after pseudo-element.
 * @private
 */
function createIndicator() {
  if (!document.getElementById('atoma-dev-mode-indicator-style')) {
    const style = document.createElement('style');
    style.id = 'atoma-dev-mode-indicator-style';
    style.textContent = `
      body.atoma-dev-mode::after {
        content: '⚙ DEV MODE';
        position: fixed;
        bottom: 8px;
        left: 50%;
        transform: translateX(-50%);
        padding: 3px 12px;
        background: rgba(255, 170, 0, 0.15);
        border: 1px solid rgba(255, 170, 0, 0.4);
        border-radius: 3px;
        color: rgba(255, 170, 0, 0.7);
        font-family: 'Rajdhani', 'Segoe UI', sans-serif;
        font-size: 10px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        z-index: 99999;
        pointer-events: none;
        backdrop-filter: blur(4px);
      }
    `;
    document.head.appendChild(style);
  }
  updateIndicator();
}

/**
 * Update indicator via body class toggle.
 * @private
 */
function updateIndicator() {
  if (typeof document === 'undefined') return;
  document.body.classList.toggle('atoma-dev-mode', isDeveloperMode());
}

/**
 * Expose developer console commands.
 * @private
 */
function exposeConsoleAPI() {
  if (typeof window === 'undefined') return;

  window.devMode = {
    toggle: () => {
      toggleDeveloperMode();
      updateIndicator();
    },
    on: () => {
      setDeveloperMode(true);
      updateIndicator();
    },
    off: () => {
      setDeveloperMode(false);
      updateIndicator();
    },
    status: () => {
      debugLayerState();
      return getLayerState();
    }
  };
}

/**
 * Clean up the developer toggle.
 */
export function destroyDeveloperToggle() {
  if (_listenerAttached) {
    document.removeEventListener('keydown', handleKeyDown);
    _listenerAttached = false;
  }
  document.body.classList.remove('atoma-dev-mode');
  const style = document.getElementById('atoma-dev-mode-indicator-style');
  if (style) style.remove();
}

console.log('✓ Developer Toggle module loaded');
