/**
 * MetricValidationRuntime
 * Lightweight runtime validator for canonical metrics.
 * - Detects NaN / non-finite values
 * - Detects out-of-range metrics (expected 0..1)
 * - Detects legacy metric fields (synergyNorm, harmonyNorm, corruptionNorm, energyNorm, stabilityNorm)
 *
 * Design:
 * - Read-only; emits console.warn only
 * - Low overhead: simple loops, intended for ~1 Hz invocation
 */

const LEGACY_FIELDS = [
  'synergyNorm',
  'harmonyNorm',
  'corruptionNorm',
  'energyNorm',
  'stabilityNorm'
];

export class MetricValidationRuntime {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.warned = new Set(); // deduplicate warnings
  }

  _warnOnce(key, message) {
    if (this.warned.has(key)) return;
    this.warned.add(key);
    console.warn(message);
  }

  _validateMetricValue(ownerId, metricName, value) {
    if (!Number.isFinite(value)) {
      this._warnOnce(
        `${ownerId}:${metricName}:nan`,
        `[MetricValidationRuntime] Non-finite metric detected (${metricName}) on ${ownerId}: ${value}`
      );
      return;
    }
    if (value < 0 || value > 1) {
      this._warnOnce(
        `${ownerId}:${metricName}:range`,
        `[MetricValidationRuntime] Out-of-range metric (${metricName}=${value.toFixed(3)}) on ${ownerId}; expected 0..1`
      );
    }
  }

  _detectLegacyFields(ownerId, obj) {
    if (!obj || typeof obj !== 'object') return;
    for (const key of LEGACY_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        this._warnOnce(
          `${ownerId}:legacy:${key}`,
          `[MetricValidationRuntime] Legacy metric field "${key}" present on ${ownerId}; remove or migrate to canonical metrics`
        );
      }
    }
  }

  validateNodes(nodes = []) {
    if (!this.enabled || !nodes) return;
    for (const node of nodes) {
      if (!node || !node.userData) continue;
      const id = node.userData.nodeId || node.uuid || node.id || 'node-unknown';
      const metrics = node.userData.metrics;
      if (!metrics) continue;

      this._detectLegacyFields(id, metrics);
      this._detectLegacyFields(id, node.userData);

      this._validateMetricValue(id, 'synergy', metrics.synergy);
      this._validateMetricValue(id, 'harmony', metrics.harmony);
      this._validateMetricValue(id, 'stability', metrics.stability);
      this._validateMetricValue(id, 'corruption', metrics.corruption);
      this._validateMetricValue(id, 'loadPressure', metrics.loadPressure);
    }
  }

  validateLinks(links = []) {
    if (!this.enabled || !links) return;
    for (const link of links) {
      if (!link || !link.userData) continue;
      const id = link.id || link.uuid || 'link-unknown';
      const synergy = link.userData.synergy?.score;
      const corruption = link.userData.metrics?.corruption ?? link.userData?.corruptionLevel;

      if (synergy !== undefined) {
        this._validateMetricValue(`link:${id}`, 'synergy.score', synergy);
      }
      if (corruption !== undefined) {
        this._validateMetricValue(`link:${id}`, 'corruptionLevel', corruption);
      }

      this._detectLegacyFields(`link:${id}`, link.userData);
      this._detectLegacyFields(`link:${id}`, link.userData.synergy);
    }
  }

  /**
    * Validate nodes and links; intended to be called at low frequency (e.g., 1 Hz).
    */
  validate({ nodes, links } = {}) {
    this.validateNodes(nodes);
    this.validateLinks(links);
  }
}

export default MetricValidationRuntime;
