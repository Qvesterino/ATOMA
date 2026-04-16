/**
 * Metric Authority Guard (Safe Mode → Strict Enforcement)
 * Logs/warns when an unauthorized system writes to canonical metrics.
 *
 * Canonical protected metrics:
 * - node.userData.metrics.* (synergy, harmony, stability, corruption, loadPressure)
 * - link.userData.synergy
 *
 * Allowed writers:
 * - NodeMetricEngine              → node canonical metrics
 * - ComputeSynergyScore2_1        → link.userData.synergy
 * - LinkCorruptionTransmission    → link/node corruption via authorized impulse
 * - HarmonyStabilizationSystem_v1 → node/link harmony (via PHASE_C3_METRIC_WRITE_LOCK)
 * - HarmonicHealingVisualSystem_Session134 → link stability/corruption healing
 * - PHASE5_CorruptionBridge_v1    → corruption synchronization
 * - PHASE5_NetworkSynchronization_v1 → corruption/nodes synchronization
 *
 * Goals:
 * - Enforce metric authority during migration
 * - Track legacy field usage
 * - Provide debug logging for unauthorized writes
 *
 * Usage:
 * - Strict mode: throw errors on unauthorized writes
 * - ReadOnly mode: throw errors on legacy field reads
 * - Log warnings for unauthorized/warning-level writes
 */

// Legacy field tracking (warn once per field)
const warnedLegacyFields = new Set();
const warnedUnauthorizedWrites = new Set();

// Runtime mode flags
const MODES = {
  STRICT: 'strict',
  WARN: 'warn',
  OFF: 'off'
};

// Default mode (can be changed via API)
let currentMode = MODES.WARN;
let readOnlyMode = false;
let strictMode = false;

// Allowed writers registry
const writersRegistry = new Map();
const auditLog = [];

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Register a metric writer with allowed metrics
 * @param {string} systemName - System name (e.g., 'HarmonyStabilizationSystem_v1')
 * @param {string[]} allowedMetrics - Array of metric names this system can write
 */
export function registerWriter(systemName, allowedMetrics) {
  if (!allowedMetrics || !Array.isArray(allowedMetrics)) {
    console.error('[MetricAuthorityGuard] Invalid allowed metrics for:', systemName);
    return;
  }
  writersRegistry.set(systemName, new Set(allowedMetrics));
  console.log(`[MetricAuthorityGuard] Registered writer: ${systemName} →`, allowedMetrics);
}

/**
 * Set guard mode
 * @param {string} mode - 'strict' | 'warn' | 'off'
 */
export function setMode(mode) {
  if (mode === MODES.STRICT || mode === MODES.WARN || mode === MODES.OFF) {
    currentMode = mode;
    console.log(`[MetricAuthorityGuard] Mode set to: ${mode}`);
  } else {
    console.error('[MetricAuthorityGuard] Invalid mode:', mode);
  }
}

/**
 * Enable/disable read-only mode for legacy fields
 * @param {boolean} readOnly
 */
export function setReadOnlyMode(readOnly) {
  readOnlyMode = readOnly;
  console.log(`[MetricAuthorityGuard] Read-only mode: ${readOnly}`);
}

/**
 * Enable/disable strict mode
 * @param {boolean} strict
 */
export function setStrictMode(strict) {
  strictMode = strict;
  console.log(`[MetricAuthorityGuard] Strict mode: ${strict}`);
}

/**
 * Check if a system is allowed to write a specific metric
 * @param {string} systemName
 * @param {string} metric
 * @returns {boolean}
 */
export function canWrite(systemName, metric) {
  const allowedList = writersRegistry.get(systemName);
  if (!allowedList) {
    // Unregistered system
    return false;
  }
  return allowedList.has(metric);
}

/**
 * Assert metric authority for writes
 * @param {string} systemName
 * @param {string} metric
 */
export function assertMetricAuthority(systemName, metric) {
  if (!metric || !systemName) return;

  const allowedList = writersRegistry.get(systemName);
  const key = `${systemName}::${metric}`;

  // Check if system is registered
  if (!allowedList) {
    handleUnauthorized(systemName, metric, 'UNREGISTERED_WRITER');
    return;
  }

  // Check if metric is allowed
  if (!allowedList.has(metric)) {
    handleUnauthorized(systemName, metric, 'UNAUTHORIZED_METRIC');
    return;
  }

  // All checks passed
  return;
}

/**
 * Check legacy field read
 * @param {string} field - e.g., 'node.userData.harmonyLevel'
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Skip guard-owned console output and let the caller log.
 */
export function checkLegacyRead(field, options = {}) {
  const silent = options?.silent === true;
  const key = `LEGACY_READ::${field}`;
  if (readOnlyMode) {
    if (!warnedLegacyFields.has(key)) {
      warnedLegacyFields.add(key);
    }
    if (!silent) {
      console.error(`[MetricAuthorityGuard] 🚫 LEGACY FIELD READ (read-only mode): ${field}`);
    }
    return false;
  }

  // Warning mode - just log
  if (!warnedLegacyFields.has(key)) {
    warnedLegacyFields.add(key);
    if (!silent) {
      console.warn(`[MetricAuthorityGuard] ⚠️ LEGACY FIELD: ${field}`);
    }
  } else if (!silent) {
    console.warn(`[MetricAuthorityGuard] ⚠️ LEGACY FIELD: ${field}`);
  }
  return true;
}

/**
 * Get audit log (for debugging)
 * @returns {Object}
 */
export function getAuditLog() {
  return {
    mode: currentMode,
    readOnlyMode,
    strictMode,
    registeredWriters: Array.from(writersRegistry.keys()),
    warnedLegacyFields: Array.from(warnedLegacyFields),
    warnedUnauthorized: Array.from(warnedUnauthorizedWrites),
  };
}

/**
 * Trace a metric mutation (audit helper)
 * @param {string} systemName - System performing the mutation
 * @param {string} path - Metric path (e.g., 'node.synergy')
 * @param {number} before - Previous value
 * @param {number} after - New value
 * @param {string} targetId - Target node/link ID
 */
export function traceMetricMutation(systemName, path, before, after, targetId) {
  if (currentMode === MODES.OFF) return;
  const entry = {
    system: systemName,
    path,
    before,
    after,
    target: targetId,
    time: performance.now()
  };
  auditLog.push(entry);
  if (currentMode === MODES.WARN) {
    console.warn(`[MetricAuthorityGuard] 📝 ${systemName} → ${path}: ${before} → ${after} (${targetId})`);
  }
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Handle unauthorized write
 */
function handleUnauthorized(systemName, metric, type) {
  const key = `${type}::${systemName}::${metric}`;

  // Don't spam console
  if (warnedUnauthorizedWrites.has(key)) return;
  warnedUnauthorizedWrites.add(key);

  const message = type === 'UNAUTHORIZED_METRIC'
    ? `[MetricAuthorityGuard] Unauthorized write: ${systemName} → ${metric}`
    : `[MetricAuthorityGuard] Unauthorized: ${systemName} → ${metric} (${type})`;

  switch (currentMode) {
    case MODES.STRICT:
      console.error(`[MetricAuthorityGuard] 🚫 ${message}`);
      throw new Error(`MetricAuthorityGuard: ${message}`);

    case MODES.WARN:
      console.warn(`[MetricAuthorityGuard] ⚠️ ${message}`);
      return;

    case MODES.OFF:
      return;
  }
}

// ============================================================================
// INITIAL REGISTRATION (Based on METRIC_AUTHORITY_MAP.md)
// ============================================================================

/**
 * Register canonical writers
 */
export function initializeRegistry() {
  // NodeMetricEngine - Primary canonical writer for all node metrics
  registerWriter('NodeMetricEngine', ['synergy', 'harmony', 'stability', 'corruption', 'loadPressure']);

  // LinkCorruptionTransmission - Link corruption via authorized impulse
  registerWriter('LinkCorruptionTransmission_v1', ['corruption']);

  // HarmonyStabilizationSystem - Node/link harmony
  registerWriter('HarmonyStabilizationSystem_v1', ['harmony']);

  // HarmonicHealingVisualSystem - Link stability/corruption healing
  registerWriter('HarmonicHealingVisualSystem_Session134', ['stability', 'corruption']);

  // PHASE5 systems - Corruption/network synchronization
  registerWriter('PHASE5_CorruptionBridge_v1', ['corruption']);
  registerWriter('PHASE5_NetworkSynchronization_v1', ['corruption']);

  // NodeLinkingSystem - Link synergy (canonical)
  registerWriter('NodeLinkingSystem', ['synergy']);

  // ComputeSynergyScore2_1 - Link synergy computation
  registerWriter('ComputeSynergyScore2_1', ['synergy']);

  console.log('[MetricAuthorityGuard] Registry initialized with canonical writers');
}

export const metricAuthorityGuard = Object.freeze({
  registerWriter,
  setMode,
  setReadOnlyMode,
  setStrictMode,
  canWrite,
  assertMetricAuthority,
  checkLegacyRead,
  getAuditLog,
  traceMetricMutation,
  initializeRegistry
});

// Auto-initialize on module load
initializeRegistry();
