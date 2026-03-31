/**
 * DebugLogger.js - Centralized debug logging with build-time flag support
 * 
 * USAGE:
 * - Production build: All logs are stripped (no overhead)
 * - Development build: Logs enabled via window.ATOMA_DEBUG
 * - Runtime control: window.ATOMA_DEBUG = true/false
 * 
 * LOG LEVELS:
 * - ERROR: Always logged (even in production if critical)
 * - WARN: Conditional logging
 * - INFO: Conditional logging
 * - DEBUG: Conditional logging
 * 
 * @version 1.0.0
 */

// Build-time constants (set by bundler)
const IS_PRODUCTION = false; // Set to true in production build
const IS_DEVELOPMENT = !IS_PRODUCTION;

// Runtime debug flag
let debugEnabled = IS_DEVELOPMENT;

/**
 * Enable/disable debug logging at runtime
 * @param {boolean} enabled - Enable or disable debug logging
 */
export function setDebugEnabled(enabled) {
  debugEnabled = enabled && IS_DEVELOPMENT;
}

/**
 * Get current debug state
 * @returns {boolean}
 */
export function isDebugEnabled() {
  return debugEnabled;
}

/**
 * Initialize debug logger from window flags
 * Checks window.ATOMA_DEBUG and related flags
 */
export function initDebugLogger() {
  if (typeof window === 'undefined') {
    return;
  }
  
  // Check for global debug flag
  if (window.ATOMA_DEBUG === true) {
    debugEnabled = true;
  }
  
  // Check for specific debug flags
  if (window.ATOMA_FLAGS?.debug?.enabled === true) {
    debugEnabled = true;
  }
}

/**
 * Debug logger class
 */
class DebugLogger {
  constructor(prefix) {
    this.prefix = prefix;
  }
  
  /**
   * Log error - always logged in development, conditionally in production
   * @param {...any} args
   */
  error(...args) {
    if (IS_DEVELOPMENT || this._shouldLogError()) {
      console.error(`[${this.prefix}]`, ...args);
    }
  }
  
  /**
   * Log warning - conditional
   * @param {...any} args
   */
  warn(...args) {
    if (debugEnabled) {
      console.warn(`[${this.prefix}]`, ...args);
    }
  }
  
  /**
   * Log info - conditional
   * @param {...any} args
   */
  info(...args) {
    if (debugEnabled) {
      console.info(`[${this.prefix}]`, ...args);
    }
  }
  
  /**
   * Log debug - conditional
   * @param {...any} args
   */
  log(...args) {
    if (debugEnabled) {
      console.log(`[${this.prefix}]`, ...args);
    }
  }
  
  /**
   * Log debug with condition check
   * @param {boolean} condition - Only log if true
   * @param {...any} args
   */
  logIf(condition, ...args) {
    if (debugEnabled && condition) {
      console.log(`[${this.prefix}]`, ...args);
    }
  }
  
  /**
   * Log warning with condition check
   * @param {boolean} condition - Only log if true
   * @param {...any} args
   */
  warnIf(condition, ...args) {
    if (debugEnabled && condition) {
      console.warn(`[${this.prefix}]`, ...args);
    }
  }
  
  /**
   * Log error with condition check
   * @param {boolean} condition - Only log if true
   * @param {...any} args
   */
  errorIf(condition, ...args) {
    if ((IS_DEVELOPMENT || this._shouldLogError()) && condition) {
      console.error(`[${this.prefix}]`, ...args);
    }
  }
  
  /**
   * Check if error should be logged (production override)
   * @private
   */
  _shouldLogError() {
    // In production, only log critical errors
    // This can be extended with error categorization
    return false;
  }
}

/**
 * Create a debug logger instance
 * @param {string} prefix - Logger prefix
 * @returns {DebugLogger}
 */
export function createLogger(prefix) {
  return new DebugLogger(prefix);
}

/**
 * Legacy compatibility - direct logging functions
 * These are deprecated - use createLogger() instead
 */
export const logger = {
  error: (...args) => console.error('[ATOMA]', ...args),
  warn: (...args) => debugEnabled && console.warn('[ATOMA]', ...args),
  info: (...args) => debugEnabled && console.info('[ATOMA]', ...args),
  log: (...args) => debugEnabled && console.log('[ATOMA]', ...args)
};

// Auto-initialize on load
if (typeof window !== 'undefined') {
  initDebugLogger();
}
