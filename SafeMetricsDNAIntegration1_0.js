/**
 * SAFE METRICS DNA INTEGRATION 1.0
 * 
 * Pure metadata storage - NO gameplay modifications
 * ONLY adds node.userData.metrics based on archetype
 * ZERO impact on physics, visuals, shaders, movement, links, or update loops
 * 
 * Metrics are READ-ONLY reference data
 */

import { NODE_VISUAL_REGISTRY } from './NodeVisualRegistry.js';

export class SafeMetricsDNAIntegration1_0 {
  static _ALLOWED_WRITERS = [
    'SafeMetricsDNAIntegration1_0.js',
    'NodeMetricEngine.js',
    'MetricsRuntime_v1.js',
  ];

  static _METRIC_KEYS = ['synergy', 'harmony', 'stability', 'corruption', 'loadPressure'];

  static _ALIASES = {
    'prime-node': 'prime',
    'mythic-core': 'mythic',
    'quantum-lab': 'quantum',
  };

  static _DEFAULT_PRESET = Object.freeze({
    synergy: 0.6,
    harmony: 0.6,
    stability: 0.6,
    corruption: 0.05,
    loadPressure: 0.4,
  });

  static _CATEGORY_PRESET_CACHE = null;

  static _wrapMetricsWithGuard(metricsObj) {
    if (!metricsObj || metricsObj.__guarded) return metricsObj;
    const warnedProps = new Set();
    const proxy = new Proxy(metricsObj, {
      set(target, prop, value) {
        const stack = new Error().stack || '';
        const isAllowed = SafeMetricsDNAIntegration1_0._ALLOWED_WRITERS.some(marker => stack.includes(marker));
        if (!isAllowed) {
          const key = String(prop);
          if (!warnedProps.has(key)) {
            console.warn('[MetricAuthorityGuard] external metrics write detected', { prop: key, stack });
            warnedProps.add(key);
          }
        }
        target[prop] = value;
        return true;
      }
    });
    metricsObj.__guarded = true;
    return proxy;
  }

  static _clamp01(value) {
    if (!Number.isFinite(value)) return 0;
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
  }

  static _normalizeCategoryKey(rawKey) {
    const normalized = String(rawKey || 'input').toLowerCase().trim();
    return this._ALIASES[normalized] || normalized;
  }

  static _resolveVisualCode(node) {
    const rawCode =
      node?.userData?.visualCode ??
      node?.userData?.spawnCycle?.visualCode ??
      node?.userData?.enhancedNodeModelBinding?.visualCode;
    const numericCode = Number(rawCode);
    return Number.isFinite(numericCode) ? numericCode : null;
  }

  static _getCategoryPresetCache() {
    if (this._CATEGORY_PRESET_CACHE) return this._CATEGORY_PRESET_CACHE;

    const accum = {};
    for (const entry of Object.values(NODE_VISUAL_REGISTRY)) {
      if (!entry || !entry.category || !entry.metrics) continue;
      if (!accum[entry.category]) {
        accum[entry.category] = {
          count: 0,
          synergy: 0,
          harmony: 0,
          stability: 0,
          corruption: 0,
          loadPressure: 0,
        };
      }
      const bucket = accum[entry.category];
      bucket.count += 1;
      for (const key of this._METRIC_KEYS) {
        bucket[key] += this._clamp01(Number(entry.metrics[key]));
      }
    }

    const cache = {};
    for (const [category, bucket] of Object.entries(accum)) {
      if (!bucket.count) continue;
      cache[category] = Object.freeze({
        synergy: this._clamp01(bucket.synergy / bucket.count),
        harmony: this._clamp01(bucket.harmony / bucket.count),
        stability: this._clamp01(bucket.stability / bucket.count),
        corruption: this._clamp01(bucket.corruption / bucket.count),
        loadPressure: this._clamp01(bucket.loadPressure / bucket.count),
      });
    }

    cache.default = this._DEFAULT_PRESET;
    this._CATEGORY_PRESET_CACHE = Object.freeze(cache);
    return this._CATEGORY_PRESET_CACHE;
  }

  static _resolveMetricPreset(node, archetype) {
    const categoryKey = this._normalizeCategoryKey(node?.userData?.category || archetype || 'input');
    const visualCode = this._resolveVisualCode(node);
    const registryEntry = visualCode !== null ? NODE_VISUAL_REGISTRY[String(visualCode)] : null;

    if (registryEntry?.metrics) {
      return {
        categoryKey: this._normalizeCategoryKey(registryEntry.category || categoryKey),
        visualCode,
        preset: registryEntry.metrics,
      };
    }

    const categoryCache = this._getCategoryPresetCache();
    const fallbackPreset = categoryCache[categoryKey] || categoryCache.default || this._DEFAULT_PRESET;
    if (visualCode !== null) {
      console.warn('[DNA] registry metrics missing for visualCode, using category fallback', {
        visualCode,
        categoryKey,
      });
    }

    return {
      categoryKey,
      visualCode,
      preset: fallbackPreset,
    };
  }

  static _normalizePreset(preset) {
    return {
      synergy: this._clamp01(Number(preset?.synergy)),
      harmony: this._clamp01(Number(preset?.harmony)),
      stability: this._clamp01(Number(preset?.stability)),
      corruption: this._clamp01(Number(preset?.corruption)),
      loadPressure: this._clamp01(Number(preset?.loadPressure)),
    };
  }

  // Compatibility accessor for older debug tooling.
  static get METRICS_TABLE() {
    return this.getAllMetrics();
  }

  /**
   * Attach metrics to a node based on its archetype
   * Called during node creation - SAFE pure metadata only
   * 
   * @param {THREE.Object3D} node - The node to attach metrics to
   * @param {string} archetype - The archetype name (category from AINodes)
   */
  static attachMetrics(node, archetype) {
    if (!node) return;
    if (!node.userData) node.userData = {};

    const resolved = this._resolveMetricPreset(node, archetype);
    const normalized = this._normalizePreset(resolved.preset);
    const {
      synergy,
      harmony,
      stability,
      corruption,
      loadPressure,
    } = normalized;

  // Immutable archetype snapshot - preserves original archetype identity
  // Written once at spawn-time; must not be modified by dynamic or legacy systems
  node.userData.archetypeMetrics = {
    synergy,
    harmony,
    stability,
    corruption,
    loadPressure,
  };

  node.userData.metrics = {
    synergy,
    harmony,
    stability,
    corruption,
    loadPressure,

    // Keep raw DNA snapshot for debug/tuning (optional but useful)
    _dna: {
      source: 'NodeVisualRegistry.metrics',
      visualCode: resolved.visualCode,
      category: resolved.categoryKey,
      ...normalized,
    },

    archetype: resolved.categoryKey,
    _isMetricSnapshot: true,
  };

  // Attach authority guard (logging only, no behavior change)
  node.userData.metrics = this._wrapMetricsWithGuard(node.userData.metrics);
}

  /**
   * Get metrics from a node (read-only access)
   * 
   * @param {THREE.Object3D} node - The node
   * @returns {Object|null} Metrics object or null if not attached
   */
  static getMetrics(node) {
    return (node && node.userData && node.userData.metrics) || null;
  }

  /**
   * Check if a node has metrics attached
   * 
   * @param {THREE.Object3D} node - The node
   * @returns {boolean} True if metrics are attached
   */
  static hasMetrics(node) {
    return !!(node && node.userData && node.userData.metrics);
  }

  /**
   * Get a single metric value from a node
   * 
   * @param {THREE.Object3D} node - The node
   * @param {string} metricName - Name of metric (synergy, stability, clarity, harmony, instability)
   * @returns {number|null} Metric value or null if not found
   */
  static getMetricValue(node, metricName) {
    const metrics = this.getMetrics(node);
    if (!metrics || !metricName) return null;
    return (metricName in metrics) ? metrics[metricName] : null;
  }

  /**
   * Batch attach metrics to multiple nodes
   * SAFE - no loops or timers, just assignment
   * 
   * @param {Array<THREE.Object3D>} nodes - Array of nodes
   * @param {Function} getArchetype - Function that returns archetype for each node
   */
  static attachMetricsToNodes(nodes, getArchetype) {
    if (!Array.isArray(nodes)) return;
    
    nodes.forEach((node, index) => {
      const archetype = getArchetype ? getArchetype(node, index) : null;
      this.attachMetrics(node, archetype);
    });
  }

  /**
   * Validate that metrics table is complete
   * (Debug/verification only - not called in production)
   * 
   * @returns {Object} Validation report
   */
  static validateMetricsTable() {
    const requiredFields = [...this._METRIC_KEYS];
    const report = {
      valid: true,
      archetypes: {},
      errors: [],
    };
    const uniqueness = new Set();

    Object.entries(NODE_VISUAL_REGISTRY).forEach(([visualCode, entry]) => {
      const archetype = entry?.category || 'unknown';
      const metrics = entry?.metrics;
      const archReport = {
        valid: true,
        visualCode: Number(visualCode),
        fields: {},
        missing: [],
      };

      requiredFields.forEach(field => {
        const value = metrics ? metrics[field] : undefined;
        const isNumber = typeof value === 'number';
        const inRange = isNumber && value >= 0 && value <= 1;

        archReport.fields[field] = {
          value: value,
          isNumber: isNumber,
          inRange: inRange,
        };

        if (!isNumber || !inRange) {
          archReport.valid = false;
          archReport.missing.push(field);
        }
      });

      const signature = requiredFields.map((field) => Number(metrics?.[field] ?? NaN).toFixed(6)).join('|');
      if (uniqueness.has(signature)) {
        archReport.valid = false;
        archReport.missing.push('non-unique-preset');
      } else {
        uniqueness.add(signature);
      }

      report.archetypes[`${archetype}:${visualCode}`] = archReport;

      if (!archReport.valid) {
        report.valid = false;
        report.errors.push(`${archetype}:${visualCode}: missing or invalid ${archReport.missing.join(', ')}`);
      }
    });

    return report;
  }

  /**
   * Get metrics for comparison (no game logic impact)
   * Useful for UI/analysis only
   * 
   * @param {string} archetype1 - First archetype
   * @param {string} archetype2 - Second archetype
   * @returns {Object} Comparison data
   */
  static compareMetrics(archetype1, archetype2) {
    const cache = this._getCategoryPresetCache();
    const arch1Key = this._normalizeCategoryKey(archetype1 || 'default');
    const arch2Key = this._normalizeCategoryKey(archetype2 || 'default');

    const metrics1 = cache[arch1Key] || cache.default || this._DEFAULT_PRESET;
    const metrics2 = cache[arch2Key] || cache.default || this._DEFAULT_PRESET;

    return {
      archetype1: arch1Key,
      archetype2: arch2Key,
      metrics1: Object.freeze({ ...metrics1 }),
      metrics2: Object.freeze({ ...metrics2 }),
      differences: {
        synergy: metrics2.synergy - metrics1.synergy,
        harmony: metrics2.harmony - metrics1.harmony,
        stability: metrics2.stability - metrics1.stability,
        corruption: metrics2.corruption - metrics1.corruption,
      },
    };
  }

  /**
   * Get all archetypes with their metrics
   * (Reference/debug only)
   * 
   * @returns {Object} All metrics by archetype
   */
  static getAllMetrics() {
    return this._getCategoryPresetCache();
  }

  /**
   * Get all archetype names in the table
   * 
   * @returns {Array<string>} Archetype names
   */
  static getArchetypeNames() {
    return Object.keys(this._getCategoryPresetCache()).filter((k) => k !== 'default');
  }
}
