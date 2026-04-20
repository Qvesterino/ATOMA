/**
 * VISUAL AUTHORITY FLAG - CENTRALIZED ACCESS
 * 
 * Provides single source of truth for visual lock state.
 * Replaces direct global variable access with controlled interface.
 * 
 * USAGE:
 *   import { isVisualLocked, setVisualLock } from './VisualAuthorityFlag.js';
 *   
 *   if (isVisualLocked()) { /* skip visual updates *\/ }
 *   setVisualLock(true);
 * 
 * ARCHITECTURE:
 * - Keeps window.VISUAL_AUTHORITY_LOCK as underlying storage
 * - Enforces strict boolean coercion
 * - Provides centralized access point for future authority logic
 */

/**
 * Check if visual authority lock is active
 * @returns {boolean} True if locked
 */
export function isVisualLocked() {
  return window.VISUAL_AUTHORITY_LOCK === true;
}

/**
 * Set visual authority lock state
 * @param {boolean} value - Lock state to set
 */
export function setVisualLock(value) {
  window.VISUAL_AUTHORITY_LOCK = !!value;
}

/**
 * Toggle visual authority lock state
 * @returns {boolean} New lock state
 */
export function toggleVisualLock() {
  window.VISUAL_AUTHORITY_LOCK = !window.VISUAL_AUTHORITY_LOCK;
  return window.VISUAL_AUTHORITY_LOCK;
}

/**
 * Get current lock state (for debugging)
 * @returns {boolean} Current lock state
 */
export function getVisualLockState() {
  return window.VISUAL_AUTHORITY_LOCK === true;
}

export default {
  isLocked: isVisualLocked,
  setLocked: setVisualLock,
  toggleLocked: toggleVisualLock,
  getLocked: getVisualLockState
};
