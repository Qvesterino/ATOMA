/**
 * Metric Authority Guard
 *
 * Scope-aware authority registry and audit layer for canonical metrics.
 *
 * Canonical scopes:
 * - node-canonical  → node.userData.metrics.{synergy,harmony,stability,corruption,loadPressure}
 * - global-canonical → runtime global/network payloads
 * - link-canonical  → link.userData.metrics / link.userData.synergy payloads
 * - visual-local    → visualState or other non-canonical local payloads
 * - legacy-mirror   → backward-compat mirrors such as node.userData.corruption
 */

const warnedLegacyFields = new Set();
const warnedUnauthorizedWrites = new Set();

const MODES = {
  STRICT: 'strict',
  WARN: 'warn',
  OFF: 'off'
};

export const METRIC_AUTHORITY_SCOPE = Object.freeze({
  NODE: 'node-canonical',
  GLOBAL: 'global-canonical',
  LINK: 'link-canonical',
  VISUAL_LOCAL: 'visual-local',
  LEGACY_MIRROR: 'legacy-mirror'
});

let currentMode = MODES.WARN;
let readOnlyMode = false;
let strictMode = false;

const writersRegistry = new Map();
const auditLog = [];
const authorityViolations = [];

function normalizeMetrics(metrics) {
  if (!Array.isArray(metrics)) return [];
  return metrics
    .map((value) => String(value || '').trim())
    .filter(Boolean);
}

function normalizeScopes(scopes) {
  const list = Array.isArray(scopes) ? scopes : [scopes];
  return list
    .map((value) => String(value || '').trim())
    .filter(Boolean);
}

function inferTargetScope(path = '') {
  if (path.startsWith('node.')) return METRIC_AUTHORITY_SCOPE.NODE;
  if (path.startsWith('global.')) return METRIC_AUTHORITY_SCOPE.GLOBAL;
  if (path.startsWith('link.')) return METRIC_AUTHORITY_SCOPE.LINK;
  if (path.startsWith('visual.')) return METRIC_AUTHORITY_SCOPE.VISUAL_LOCAL;
  if (path.startsWith('legacy.')) return METRIC_AUTHORITY_SCOPE.LEGACY_MIRROR;
  return 'unknown';
}

function getRegisteredEntry(systemName) {
  return writersRegistry.get(systemName) || null;
}

function recordAuthorityViolation(entry) {
  authorityViolations.push({
    time: typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now(),
    ...entry
  });
}

/**
 * Register a metric writer or metric-adjacent producer.
 *
 * Supported signatures:
 * - registerWriter(name, ['metricA', 'metricB'])
 * - registerWriter(name, { metrics, scopes, role, notes })
 */
export function registerWriter(systemName, writerConfig) {
  if (!systemName) {
    console.error('[MetricAuthorityGuard] Missing writer name');
    return;
  }

  const normalizedName = String(systemName).trim();
  const entry = Array.isArray(writerConfig)
    ? {
        name: normalizedName,
        metrics: normalizeMetrics(writerConfig),
        scopes: [METRIC_AUTHORITY_SCOPE.NODE],
        role: 'canonical-writer',
        notes: ''
      }
    : {
        name: normalizedName,
        metrics: normalizeMetrics(writerConfig?.metrics),
        scopes: normalizeScopes(writerConfig?.scopes ?? METRIC_AUTHORITY_SCOPE.NODE),
        role: String(writerConfig?.role || 'canonical-writer'),
        notes: String(writerConfig?.notes || '')
      };

  if (!entry.metrics.length) {
    console.error('[MetricAuthorityGuard] Invalid writer metrics for:', normalizedName);
    return;
  }

  if (!entry.scopes.length) {
    entry.scopes = [METRIC_AUTHORITY_SCOPE.NODE];
  }

  writersRegistry.set(normalizedName, entry);
}

export function setMode(mode) {
  if (mode === MODES.STRICT || mode === MODES.WARN || mode === MODES.OFF) {
    currentMode = mode;
    console.log(`[MetricAuthorityGuard] Mode set to: ${mode}`);
  } else {
    console.error('[MetricAuthorityGuard] Invalid mode:', mode);
  }
}

export function setReadOnlyMode(readOnly) {
  readOnlyMode = readOnly;
  console.log(`[MetricAuthorityGuard] Read-only mode: ${readOnly}`);
}

export function setStrictMode(strict) {
  strictMode = strict;
  console.log(`[MetricAuthorityGuard] Strict mode: ${strict}`);
}

export function canWrite(systemName, metric, scope = METRIC_AUTHORITY_SCOPE.NODE) {
  const entry = getRegisteredEntry(systemName);
  if (!entry) return false;
  return entry.metrics.includes(metric) && entry.scopes.includes(scope);
}

export function assertMetricAuthority(systemName, metric, scope = METRIC_AUTHORITY_SCOPE.NODE) {
  if (!metric || !systemName) return;

  const entry = getRegisteredEntry(systemName);
  if (!entry) {
    handleUnauthorized(systemName, metric, scope, 'UNREGISTERED_WRITER');
    return;
  }

  if (!entry.metrics.includes(metric)) {
    handleUnauthorized(systemName, metric, scope, 'UNAUTHORIZED_METRIC');
    return;
  }

  if (!entry.scopes.includes(scope)) {
    handleUnauthorized(systemName, metric, scope, 'UNAUTHORIZED_SCOPE');
  }
}

export function reportScopeViolation(systemName, path, scope = inferTargetScope(path), details = {}) {
  const normalizedPath = String(path || 'unknown');
  const key = `SCOPE_VIOLATION::${systemName}::${scope}::${normalizedPath}`;
  if (warnedUnauthorizedWrites.has(key)) return false;
  warnedUnauthorizedWrites.add(key);

  const message = `[MetricAuthorityGuard] Scope violation: ${systemName} → ${normalizedPath} (${scope})`;
  recordAuthorityViolation({
    system: systemName,
    metric: normalizedPath,
    scope,
    type: 'SCOPE_VIOLATION',
    details
  });

  if (currentMode === MODES.STRICT || strictMode) {
    console.error(message, details);
    throw new Error(`MetricAuthorityGuard: ${message}`);
  }

  if (currentMode === MODES.WARN) {
    console.warn(message, details);
  }
  return true;
}

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

export function getAuditLog() {
  const entries = Array.from(writersRegistry.values());
  return {
    mode: currentMode,
    readOnlyMode,
    strictMode,
    registry: entries,
    canonicalNodeWriters: entries.filter((entry) =>
      entry.scopes.includes(METRIC_AUTHORITY_SCOPE.NODE) && entry.role === 'canonical-writer'
    ),
    canonicalGlobalWriters: entries.filter((entry) =>
      entry.scopes.includes(METRIC_AUTHORITY_SCOPE.GLOBAL) && entry.role === 'canonical-writer'
    ),
    authorizedNodeImpulseSources: entries.filter((entry) =>
      entry.scopes.includes(METRIC_AUTHORITY_SCOPE.NODE) && entry.role !== 'canonical-writer'
    ),
    linkLocalWriters: entries.filter((entry) =>
      entry.scopes.includes(METRIC_AUTHORITY_SCOPE.LINK) ||
      entry.scopes.includes(METRIC_AUTHORITY_SCOPE.VISUAL_LOCAL) ||
      entry.scopes.includes(METRIC_AUTHORITY_SCOPE.LEGACY_MIRROR)
    ),
    warnedLegacyFields: Array.from(warnedLegacyFields),
    warnedUnauthorized: Array.from(warnedUnauthorizedWrites),
    recentMutations: auditLog.slice(-50),
    recentViolations: authorityViolations.slice(-25)
  };
}

export function getAuthorityReport() {
  return getAuditLog();
}

export function traceMetricMutation(systemName, path, before, after, targetId, meta = {}) {
  if (currentMode === MODES.OFF) return;
  const targetScope = meta?.targetScope || inferTargetScope(path);
  const entry = {
    system: systemName,
    path,
    before,
    after,
    target: targetId,
    requestedBy: meta?.requestedBy || systemName,
    canonicalWriter: meta?.canonicalWriter || systemName,
    targetScope,
    time: typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now()
  };
  auditLog.push(entry);
}

function handleUnauthorized(systemName, metric, scope, type) {
  const key = `${type}::${systemName}::${metric}::${scope}`;
  if (warnedUnauthorizedWrites.has(key)) return;
  warnedUnauthorizedWrites.add(key);

  recordAuthorityViolation({
    system: systemName,
    metric,
    scope,
    type
  });

  const message = `[MetricAuthorityGuard] Unauthorized authority: ${systemName} → ${metric} (${scope}, ${type})`;

  switch (currentMode) {
    case MODES.STRICT:
      console.error(message);
      throw new Error(`MetricAuthorityGuard: ${message}`);
    case MODES.WARN:
      console.warn(message);
      return;
    case MODES.OFF:
      return;
  }
}

export function initializeRegistry() {
  writersRegistry.clear();

  registerWriter('NodeMetricEngine', {
    metrics: ['synergy', 'harmony', 'stability', 'corruption', 'loadPressure'],
    scopes: [METRIC_AUTHORITY_SCOPE.NODE],
    role: 'canonical-writer'
  });

  registerWriter('MetricsRuntime_v1', {
    metrics: ['networkSynergy', 'harmonyFlow', 'networkStress', 'corruptionLevel', 'loadPressure'],
    scopes: [METRIC_AUTHORITY_SCOPE.GLOBAL],
    role: 'canonical-writer'
  });

  registerWriter('LinkCorruptionTransmission_v1', {
    metrics: ['corruption', 'integrity', 'integrityState'],
    scopes: [METRIC_AUTHORITY_SCOPE.LINK],
    role: 'link-local-writer',
    notes: 'Node corruption changes must flow through applyMetricImpulse(source=link-corruption-transmission)'
  });

  registerWriter('HarmonyStabilization', {
    metrics: ['harmony'],
    scopes: [METRIC_AUTHORITY_SCOPE.NODE, METRIC_AUTHORITY_SCOPE.LINK],
    role: 'authorized-impulse-source',
    notes: 'Node harmony via setMetric(source=harmony-stabilization), link harmony is link-local only'
  });

  registerWriter('HarmonicHealingVisualSystem_Session134', {
    metrics: ['corruption', 'stability'],
    scopes: [METRIC_AUTHORITY_SCOPE.NODE, METRIC_AUTHORITY_SCOPE.VISUAL_LOCAL],
    role: 'authorized-impulse-source',
    notes: 'Node corruption via setMetric, link stability via visualState only'
  });

  registerWriter('PHASE5_CorruptionBridge', {
    metrics: ['corruption'],
    scopes: [METRIC_AUTHORITY_SCOPE.NODE, METRIC_AUTHORITY_SCOPE.LEGACY_MIRROR],
    role: 'external-node-impulse',
    notes: 'Must write through setNodeCorruption only'
  });

  registerWriter('PHASE5_NetworkSynchronization', {
    metrics: ['corruption'],
    scopes: [METRIC_AUTHORITY_SCOPE.NODE, METRIC_AUTHORITY_SCOPE.LEGACY_MIRROR],
    role: 'external-node-impulse',
    notes: 'Must write through setNodeCorruption only'
  });

  registerWriter('ComputeSynergyScore2_0', {
    metrics: ['synergy'],
    scopes: [METRIC_AUTHORITY_SCOPE.LINK],
    role: 'link-score-producer',
    notes: 'Not a canonical node writer'
  });

  console.log('[MetricAuthorityGuard] Registry initialized with scope-aware canonical writers');
}

export const metricAuthorityGuard = Object.freeze({
  registerWriter,
  setMode,
  setReadOnlyMode,
  setStrictMode,
  canWrite,
  assertMetricAuthority,
  reportScopeViolation,
  checkLegacyRead,
  getAuditLog,
  getAuthorityReport,
  traceMetricMutation,
  initializeRegistry
});

if (typeof window !== 'undefined') {
  window.__ATOMA_METRIC_AUTHORITY_REPORT__ = () => getAuthorityReport();
}

initializeRegistry();
