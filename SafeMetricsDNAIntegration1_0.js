/**
 * SAFE METRICS DNA INTEGRATION 1.0
 * 
 * Pure metadata storage - NO gameplay modifications
 * ONLY adds node.userData.metrics based on archetype
 * ZERO impact on physics, visuals, shaders, movement, links, or update loops
 * 
 * Metrics are READ-ONLY reference data
 */

export class SafeMetricsDNAIntegration1_0 {
  static _ALLOWED_WRITERS = [
    'SafeMetricsDNAIntegration1_0.js',
    'NodeMetricEngine.js',
    'MetricsRuntime_v1.js',
  ];

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

  /**
   * Complete metrics table by archetype
   * Values from official Node Archetype DNA System
   */
  static METRICS_TABLE = {
    // Core categories
    'input': {
      synergy: 50,
      harmony: 40,
      stability: 70,
      corruption: 90,
      load: 3,
    },
    'process': {
      synergy: 60,
      harmony: 50,
      stability: 65,
      corruption: 70,
      load: 4,
    },
    'integration': {
      synergy: 70,
      harmony: 95,
      stability: 70,
      corruption: 60,
      load: 4,
    },
    'analytics': {
      synergy: 55,
      harmony: 50,
      stability: 75,
      corruption: 95,
      load: 4,
    },
    'storage': {
      synergy: 30,
      harmony: 30,
      stability: 95,
      corruption: 50,
      load: 6,
    },
    'control': {
      synergy: 65,
      harmony: 20,
      stability: 90,
      corruption: 70,
      load: 5,
    },
    // New canonical categories
    'prime': {
      synergy: 70,
      harmony: 70,
      stability: 90,
      corruption: 10,
      load: 3,
    },
    'error': {
      synergy: 40,
      harmony: 20,
      stability: 30,
      corruption: 95,
      load: 4,
    },
    'mythic': {
      synergy: 95,
      harmony: 85,
      stability: 60,
      corruption: 25,
      load: 2,
    },
    'sigma': {
      synergy: 60,
      harmony: 50,
      stability: 85,
      corruption: 15,
      load: 3,
    },
    'quantum': {
      synergy: 65,
      harmony: 15,
      stability: 15,
      corruption: 20,
      load: 4,
    },
    'emotional': {
      synergy: 75,
      harmony: 85,
      stability: 40,
      corruption: 45,
      load: 4,
    },
    // Fallback for unlabeled nodes
    'default': {
      synergy: 65,
      harmony: 65,
      stability: 65,
      corruption: 65,
      load: 3,
    },
  };

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

  const archetypeKey = (archetype || 'default').toLowerCase().trim();
  const raw = this.METRICS_TABLE[archetypeKey] || this.METRICS_TABLE['default'];

  // --- Normalization helpers (safe, deterministic) ---
  const clamp01 = (n) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
  const normPct = (v) => clamp01((Number(v) || 0) / 100);

  // If your table ever uses 0..120, this safely caps at 1.0.
  const synergy = normPct(raw.synergy);
  const harmony = normPct(raw.harmony);
  const stability = normPct(raw.stability);
  const corruption = normPct(raw.corruption);

  // load is capacity (int). Keep it as-is, also derive loadPressure (0..1) for HUD.
  const loadCap = Number.isFinite(raw.load) ? raw.load : 3;
  const LOAD_MAX = 6; // keep simple; matches your table range
  const loadPressure = clamp01(loadCap / LOAD_MAX);

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
      synergy: raw.synergy,
      harmony: raw.harmony,
      stability: raw.stability,
      corruption: raw.corruption,
      load: raw.load,
    },

    archetype: archetypeKey,
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
    const requiredFields = ['synergy','stability','harmony','corruption','load', ];
    const report = {
      valid: true,
      archetypes: {},
      errors: [],
    };

    Object.entries(this.METRICS_TABLE).forEach(([archetype, metrics]) => {
      const archReport = {
        valid: true,
        fields: {},
        missing: [],
      };

      requiredFields.forEach(field => {
        const value = metrics[field];
        const isNumber = typeof value === 'number';
        const inRange = isNumber && value >= 0 && value <= 120;

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

      report.archetypes[archetype] = archReport;

      if (!archReport.valid) {
        report.valid = false;
        report.errors.push(`${archetype}: missing or invalid ${archReport.missing.join(', ')}`);
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
    const arch1Key = (archetype1 || 'default').toLowerCase();
    const arch2Key = (archetype2 || 'default').toLowerCase();

    const metrics1 = this.METRICS_TABLE[arch1Key] || this.METRICS_TABLE['default'];
    const metrics2 = this.METRICS_TABLE[arch2Key] || this.METRICS_TABLE['default'];

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
    return Object.freeze({ ...this.METRICS_TABLE });
  }

  /**
   * Get all archetype names in the table
   * 
   * @returns {Array<string>} Archetype names
   */
  static getArchetypeNames() {
    return Object.keys(this.METRICS_TABLE).filter(k => k !== 'default');
  }
}
