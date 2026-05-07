/**
 * HUD DRAG MANAGER 1.0
 * 
 * Drag-to-reposition system for ATOMA HUD panels.
 * Allows the player to drag any registered HUD by its header.
 * Positions are auto-saved to localStorage on drag end.
 * 
 * FEATURES:
 * - Drag any HUD by header (or entire panel if no header)
 * - Auto-save position on drag end
 * - Load saved positions on init
 * - Layout lock/unlock mode (F3 key)
 * - Reset to defaults via console command
 * - Visual feedback during drag (opacity, cursor)
 * - Viewport clamping (HUD stays on screen)
 * 
 * CONTROLS:
 * - F3: Toggle layout edit mode (unlock/lock positions)
 * - Console: window.resetHudPositions() — reset all to defaults
 * - Console: window.saveHudPositions() — save current positions
 * 
 * SAFETY: Pure UI positioning — zero gameplay impact
 */

import { getAllHudIds, getHudConfig, getHudElement } from './HUDRegistry.js';

const POSITION_STORAGE_KEY = 'atoma.hud.positions.v1';
const LOCK_MODE_STORAGE_KEY = 'atoma.hud.layoutLocked';
const DEFAULT_LEFT_EDGE = 10;
const DEFAULT_TOP_EDGE = 10;
const DEFAULT_BOTTOM_EDGE = 20;
const DEFAULT_VERTICAL_GAP = 12;
const DEFAULT_RIGHT_EDGE = 12;
const DEFAULT_BOOTSTRAP_RETRY_MS = 100;
const DEFAULT_BOOTSTRAP_MAX_ATTEMPTS = 24;
const DEFAULT_LEFT_BOOTSTRAP_REQUIRED_IDS = Object.freeze([
  'ui-category-legend',
  'node-inspect-overlay',
  'core-metrics-hud',
]);
const DEFAULT_AUTOMATION_WAVE_REQUIRED_IDS = Object.freeze([
  'wave-debug-overlay',
  'ai-automation-hud',
]);

/** @type {boolean} Whether layout is locked (not draggable) */
let _layoutLocked = true;

/** @type {Map<string, {x: number, y: number}>} Saved positions per HUD key */
let _savedPositions = new Map();

/** @type {string|null} Currently dragged HUD key */
let _dragTarget = null;

/** @type {{startX: number, startY: number, origLeft: number, origTop: number}} Drag state */
let _dragState = { startX: 0, startY: 0, origLeft: 0, origTop: 0 };


/** @type {boolean} Whether key listener is attached */
let _keyListenerAttached = false;

/** @type {HTMLStyleElement|null} Injected style element for layout edit indicator */
let _lockStyleEl = null;

// ── INITIALIZATION ──────────────────────────────────────────────────

/**
 * Initialize HUD Drag Manager.
 * Loads saved positions and sets up drag listeners.
 */
export function initializeHudDragManager() {
  loadPositions();
  loadLockState();
  applyAllPositions();
  applyDefaultHudBootstrapLayout();
  attachDragListeners();
  attachKeyListener();
  createLockIndicator();
  exposeConsoleAPI();

  console.log('✓ HUD Drag Manager 1.0 initialized');
  console.log(`  Layout: ${_layoutLocked ? 'LOCKED' : 'UNLOCKED (editable)'}`);
  console.log('  Press F3 to toggle layout edit mode');
}

// ── POSITION PERSISTENCE ────────────────────────────────────────────

/**
 * Load saved positions from localStorage.
 * @private
 */
function loadPositions() {
  try {
    const raw = localStorage.getItem(POSITION_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object') return;
    for (const [key, pos] of Object.entries(parsed)) {
      if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
        _savedPositions.set(key, { x: pos.x, y: pos.y });
      }
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check whether the player already has saved HUD positions.
 * Safe to call before drag manager initialization.
 * @returns {boolean}
 */
export function hasSavedHudPositions() {
  if (_savedPositions.size > 0) {
    return true;
  }

  try {
    const raw = localStorage.getItem(POSITION_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return !!parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0;
  } catch {
    return false;
  }
}

/**
 * Check whether a specific HUD already has a saved drag position.
 * @param {string} hudKey
 * @returns {boolean}
 */
export function hasSavedHudPosition(hudKey) {
  if (!hudKey) {
    return false;
  }

  if (_savedPositions.has(hudKey)) {
    return true;
  }

  try {
    const raw = localStorage.getItem(POSITION_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return !!parsed && typeof parsed === 'object' && !!parsed[hudKey];
  } catch {
    return false;
  }
}

/**
 * Save all current positions to localStorage.
 */
export function savePositions() {
  const obj = {};
  for (const [key, pos] of _savedPositions) {
    obj[key] = pos;
  }
  try {
    localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(obj));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Load lock state from localStorage.
 * @private
 */
function loadLockState() {
  try {
    const raw = localStorage.getItem(LOCK_MODE_STORAGE_KEY);
    if (raw !== null) {
      _layoutLocked = raw !== 'false';
    }
  } catch {
    // Ignore
  }
}

/**
 * Save lock state to localStorage.
 * @private
 */
function saveLockState() {
  try {
    localStorage.setItem(LOCK_MODE_STORAGE_KEY, String(_layoutLocked));
  } catch {
    // Ignore
  }
}

// ── POSITION APPLICATION ────────────────────────────────────────────

/**
 * Apply saved position to a single HUD.
 * @param {string} hudKey
 */
export function applyPosition(hudKey) {
  const config = getHudConfig(hudKey);
  const el = getHudElement(hudKey);
  if (!config || !el) return;

  const saved = _savedPositions.get(hudKey);
  if (saved) {
    el.style.left = `${saved.x}px`;
    el.style.top = `${saved.y}px`;
    el.style.right = 'auto';
    el.style.bottom = 'auto';
  } else if (config.defaultPosition) {
    const dp = config.defaultPosition;
    if (dp.left !== undefined) { el.style.left = `${dp.left}px`; el.style.right = 'auto'; }
    if (dp.top !== undefined) { el.style.top = `${dp.top}px`; el.style.bottom = 'auto'; }
    if (dp.right !== undefined) { el.style.right = `${dp.right}px`; el.style.left = 'auto'; }
    if (dp.bottom !== undefined) { el.style.bottom = `${dp.bottom}px`; el.style.top = 'auto'; }
  }
}

/**
 * Apply saved positions to all registered HUDs.
 */
export function applyAllPositions() {
  getAllHudIds().forEach(hudKey => applyPosition(hudKey));
}

function setFixedPosition(el, position = {}) {
  if (!el) return;

  if (position.left !== undefined) {
    el.style.left = `${position.left}px`;
    el.style.right = 'auto';
  }
  if (position.top !== undefined) {
    el.style.top = `${position.top}px`;
    el.style.bottom = 'auto';
  }
  if (position.right !== undefined) {
    el.style.right = `${position.right}px`;
    el.style.left = 'auto';
  }
  if (position.bottom !== undefined) {
    el.style.bottom = `${position.bottom}px`;
    el.style.top = 'auto';
  }
}

function readRightOffset(el, fallback = DEFAULT_RIGHT_EDGE) {
  if (!el) return fallback;

  const rect = el.getBoundingClientRect();
  if (rect.width > 0) {
    return Math.max(0, Math.round(window.innerWidth - rect.right));
  }

  const inlineValue = Number.parseFloat(el.style.right);
  if (Number.isFinite(inlineValue)) {
    return inlineValue;
  }

  const computedValue = Number.parseFloat(window.getComputedStyle(el).right);
  if (Number.isFinite(computedValue)) {
    return computedValue;
  }

  return fallback;
}

function getRequiredBootstrapElements(requiredIds) {
  const elements = {};
  for (const id of requiredIds) {
    const el = document.getElementById(id);
    if (!el) {
      return null;
    }
    elements[id] = el;
  }
  return elements;
}

function applyLeftColumnBootstrapLayoutPass() {
  const required = getRequiredBootstrapElements(DEFAULT_LEFT_BOOTSTRAP_REQUIRED_IDS);
  if (!required) return false;

  const categoryHud = required['ui-category-legend'];
  const inspectorHud = required['node-inspect-overlay'];
  const coreMetricsHud = required['core-metrics-hud'];

  setFixedPosition(categoryHud, {
    left: DEFAULT_LEFT_EDGE,
    top: DEFAULT_TOP_EDGE,
  });

  setFixedPosition(coreMetricsHud, {
    left: DEFAULT_LEFT_EDGE,
    bottom: DEFAULT_BOTTOM_EDGE,
  });

  const categoryRect = categoryHud.getBoundingClientRect();
  const coreRect = coreMetricsHud.getBoundingClientRect();
  const inspectorTop = Math.round(categoryRect.bottom + DEFAULT_VERTICAL_GAP);
  const maxInspectorHeight = Math.max(
    0,
    Math.floor(coreRect.top - DEFAULT_VERTICAL_GAP - inspectorTop),
  );

  setFixedPosition(inspectorHud, {
    left: DEFAULT_LEFT_EDGE,
    top: inspectorTop,
  });
  inspectorHud.style.maxHeight = `${maxInspectorHeight}px`;
  inspectorHud.style.overflowY = 'auto';
  inspectorHud.style.overflowX = 'hidden';

  return true;
}

function applyAutomationHudWaveAnchorPass() {
  const required = getRequiredBootstrapElements(DEFAULT_AUTOMATION_WAVE_REQUIRED_IDS);
  if (!required) return false;

  const waveHud = required['wave-debug-overlay'];
  const automationHud = required['ai-automation-hud'];

  const waveRight = readRightOffset(waveHud, DEFAULT_RIGHT_EDGE);
  const waveRect = waveHud.getBoundingClientRect();
  const automationTop = Math.round(waveRect.bottom + DEFAULT_VERTICAL_GAP);

  setFixedPosition(automationHud, {
    right: waveRight,
    top: automationTop,
  });

  return true;
}

/**
 * Apply the canonical first-launch HUD bootstrap layout.
 * Saved player positions stay authoritative unless force is enabled.
 * @param {{ force?: boolean, attempt?: number }} [options]
 * @returns {boolean}
 */
export function applyDefaultHudBootstrapLayout({ force = false, attempt = 0 } = {}) {
  if (!force && hasSavedHudPositions()) {
    return false;
  }

  const leftApplied = applyLeftColumnBootstrapLayoutPass();
  const rightApplied = applyAutomationHudWaveAnchorPass();
  if (leftApplied && rightApplied) {
    return true;
  }

  if (attempt >= DEFAULT_BOOTSTRAP_MAX_ATTEMPTS) {
    return false;
  }

  setTimeout(() => {
    applyDefaultHudBootstrapLayout({ force, attempt: attempt + 1 });
  }, DEFAULT_BOOTSTRAP_RETRY_MS);
  return false;
}

/**
 * Re-anchor AI Automation HUD under the Wave System HUD.
 * Respects saved custom automation positions unless force is enabled.
 * @param {{ force?: boolean, attempt?: number }} [options]
 * @returns {boolean}
 */
export function applyAutomationHudWaveAnchor({ force = false, attempt = 0 } = {}) {
  if (!force && hasSavedHudPosition('automationHUD')) {
    return false;
  }

  const applied = applyAutomationHudWaveAnchorPass();
  if (applied) {
    return true;
  }

  if (attempt >= DEFAULT_BOOTSTRAP_MAX_ATTEMPTS) {
    return false;
  }

  setTimeout(() => {
    applyAutomationHudWaveAnchor({ force, attempt: attempt + 1 });
  }, DEFAULT_BOOTSTRAP_RETRY_MS);
  return false;
}

// ── DRAG HANDLING ───────────────────────────────────────────────────

/**
 * Attach mousedown listeners to all HUD headers for drag initiation.
 * @private
 */
function attachDragListeners() {
  getAllHudIds().forEach(hudKey => {
    const config = getHudConfig(hudKey);
    const el = getHudElement(hudKey);
    if (!el) return;

    // Find the draggable area: header first, then the whole panel
    const header = el.querySelector('.hud-header') || el.querySelector('.ai-hud-header') ||
                   el.querySelector('[class*="header"]');

    const dragHandle = header || el;
    
    dragHandle.addEventListener('mousedown', (e) => onDragStart(e, hudKey));
    dragHandle.addEventListener('touchstart', (e) => onTouchStart(e, hudKey), { passive: false });
  });

  // Global move/up listeners
  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
  document.addEventListener('touchmove', onTouchMove, { passive: false });
  document.addEventListener('touchend', onTouchEnd);
}

/**
 * Handle drag start (mouse).
 * @param {MouseEvent} e
 * @param {string} hudKey
 * @private
 */
function onDragStart(e, hudKey) {
  if (_layoutLocked) return;
  // Don't interfere with buttons and interactive elements
  if (e.target.closest('button, input, select, textarea, a')) return;

  e.preventDefault();
  startDrag(hudKey, e.clientX, e.clientY);
}

/**
 * Handle touch start.
 * @param {TouchEvent} e
 * @param {string} hudKey
 * @private
 */
function onTouchStart(e, hudKey) {
  if (_layoutLocked) return;
  if (e.target.closest('button, input, select, textarea, a')) return;

  e.preventDefault();
  const touch = e.touches[0];
  startDrag(hudKey, touch.clientX, touch.clientY);
}

/**
 * Common drag start logic.
 * @param {string} hudKey
 * @param {number} clientX
 * @param {number} clientY
 * @private
 */
function startDrag(hudKey, clientX, clientY) {
  const el = getHudElement(hudKey);
  if (!el) return;

  _dragTarget = hudKey;
  
  const rect = el.getBoundingClientRect();
  _dragState = {
    startX: clientX,
    startY: clientY,
    origLeft: rect.left,
    origTop: rect.top
  };

  // Visual feedback
  el.style.opacity = '0.85';
  el.style.cursor = 'grabbing';
  el.style.zIndex = '9999';
  el.style.transition = 'none'; // Disable transitions during drag
}

/**
 * Handle drag move (mouse).
 * @param {MouseEvent} e
 * @private
 */
function onDragMove(e) {
  if (!_dragTarget) return;
  moveDrag(e.clientX, e.clientY);
}

/**
 * Handle touch move.
 * @param {TouchEvent} e
 * @private
 */
function onTouchMove(e) {
  if (!_dragTarget) return;
  e.preventDefault();
  const touch = e.touches[0];
  moveDrag(touch.clientX, touch.clientY);
}

/**
 * Common drag move logic.
 * @param {number} clientX
 * @param {number} clientY
 * @private
 */
function moveDrag(clientX, clientY) {
  const el = getHudElement(_dragTarget);
  if (!el) return;

  const dx = clientX - _dragState.startX;
  const dy = clientY - _dragState.startY;

  let newX = _dragState.origLeft + dx;
  let newY = _dragState.origTop + dy;

  // Viewport clamping
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rect = el.getBoundingClientRect();
  const minX = 0;
  const minY = 0;
  const maxX = vw - Math.min(rect.width, 100); // Keep at least 100px visible
  const maxY = vh - 30; // Keep at least 30px visible

  newX = Math.max(minX, Math.min(maxX, newX));
  newY = Math.max(minY, Math.min(maxY, newY));

  el.style.left = `${newX}px`;
  el.style.top = `${newY}px`;
  el.style.right = 'auto';
  el.style.bottom = 'auto';
}

/**
 * Handle drag end (mouse).
 * @private
 */
function onDragEnd() {
  endDrag();
}

/**
 * Handle touch end.
 * @private
 */
function onTouchEnd() {
  endDrag();
}

/**
 * Common drag end logic.
 * @private
 */
function endDrag() {
  if (!_dragTarget) return;

  const hudKey = _dragTarget;
  const el = getHudElement(hudKey);

  if (el) {
    const rect = el.getBoundingClientRect();
    _savedPositions.set(hudKey, { x: Math.round(rect.left), y: Math.round(rect.top) });

    // Reset visual feedback
    el.style.opacity = '';
    el.style.cursor = '';
    el.style.zIndex = '';
    el.style.transition = '';
  }

  savePositions();
  _dragTarget = null;
}

// ── LOCK/UNLOCK ─────────────────────────────────────────────────────

/**
 * Toggle layout lock mode.
 */
export function toggleLayoutLock() {
  _layoutLocked = !_layoutLocked;
  saveLockState();
  updateLockIndicator();
  updateDragCursors();
  console.log(`✓ Layout: ${_layoutLocked ? 'LOCKED' : 'UNLOCKED (drag to reposition)'}`);
}

/**
 * Check if layout is locked.
 * @returns {boolean}
 */
export function isLayoutLocked() {
  return _layoutLocked;
}

/**
 * Update cursor styles on HUD headers based on lock state.
 * @private
 */
function updateDragCursors() {
  getAllHudIds().forEach(hudKey => {
    const el = getHudElement(hudKey);
    if (!el) return;

    const header = el.querySelector('.hud-header') || el.querySelector('.ai-hud-header') ||
                   el.querySelector('[class*="header"]');
    const dragHandle = header || el;

    if (_layoutLocked) {
      dragHandle.style.cursor = '';
    } else {
      dragHandle.style.cursor = 'grab';
    }
  });
}

// ── KEY LISTENER ────────────────────────────────────────────────────

/**
 * Attach F3 key listener for layout lock toggle.
 * @private
 */
function attachKeyListener() {
  if (_keyListenerAttached) return;
  document.addEventListener('keydown', handleKeyDown);
  _keyListenerAttached = true;
}

/**
 * Handle F3 key press.
 * @param {KeyboardEvent} e
 * @private
 */
function handleKeyDown(e) {
  if (e.key === 'F3') {
    e.preventDefault();
    toggleLayoutLock();
  }
}

// ── LOCK INDICATOR (CSS-only via body::before pseudo-element) ──────

/**
 * Inject CSS rule for layout edit indicator using body::before.
 * No DOM element created — pure CSS pseudo-element.
 * @private
 */
function createLockIndicator() {
  _lockStyleEl = document.createElement('style');
  _lockStyleEl.id = 'atoma-layout-edit-style';
  _lockStyleEl.textContent = `
    body.atoma-layout-edit::before {
      content: '✥ LAYOUT EDIT — drag headers to reposition';
      position: fixed;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      padding: 3px 12px;
      background: rgba(0, 200, 220, 0.12);
      border: 1px solid rgba(0, 200, 220, 0.3);
      border-radius: 3px;
      color: rgba(0, 200, 220, 0.6);
      font-family: 'Rajdhani', 'Segoe UI', sans-serif;
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      z-index: 99998;
      pointer-events: none;
      transition: opacity 0.3s ease;
      backdrop-filter: blur(4px);
    }
  `;
  document.head.appendChild(_lockStyleEl);
  updateLockIndicator();
}

/**
 * Toggle layout edit indicator via body class.
 * @private
 */
function updateLockIndicator() {
  if (_layoutLocked) {
    document.body.classList.remove('atoma-layout-edit');
  } else {
    document.body.classList.add('atoma-layout-edit');
  }
}

// ── CONSOLE API ─────────────────────────────────────────────────────

/**
 * Expose console commands.
 * @private
 */
function exposeConsoleAPI() {
  if (typeof window === 'undefined') return;

  window.resetHudPositions = () => {
    _savedPositions.clear();
    try { localStorage.removeItem(POSITION_STORAGE_KEY); } catch {}
    applyAllPositions();
    applyDefaultHudBootstrapLayout({ force: true });
    applyAutomationHudWaveAnchor({ force: true });
    console.log('✓ HUD positions reset to defaults');
  };

  window.saveHudPositions = () => {
    // Read current positions from DOM
    getAllHudIds().forEach(hudKey => {
      const el = getHudElement(hudKey);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      _savedPositions.set(hudKey, { x: Math.round(rect.left), y: Math.round(rect.top) });
    });
    savePositions();
    console.log('✓ HUD positions saved');
  };

  window.toggleLayoutLock = () => {
    toggleLayoutLock();
  };

  window.getHudPositions = () => {
    const positions = {};
    getAllHudIds().forEach(hudKey => {
      const el = getHudElement(hudKey);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      positions[hudKey] = { x: Math.round(rect.left), y: Math.round(rect.top) };
    });
    console.table(positions);
    return positions;
  };
}

// ── CLEANUP ─────────────────────────────────────────────────────────

/**
 * Clean up drag manager.
 */
export function destroyHudDragManager() {
  if (_keyListenerAttached) {
    document.removeEventListener('keydown', handleKeyDown);
    _keyListenerAttached = false;
  }
  document.body.classList.remove('atoma-layout-edit');
  if (_lockStyleEl && _lockStyleEl.parentNode) {
    _lockStyleEl.parentNode.removeChild(_lockStyleEl);
  }
  _lockStyleEl = null;
}

console.log('✓ HUD Drag Manager module loaded');
