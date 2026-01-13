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
  /**
   * Complete metrics table by archetype
   * Values from official Node Archetype DNA System
   */
  static METRICS_TABLE = {
    'crystal': {
      energy: 65,
      stability: 85,
      clarity: 95,
      harmony: 80,
      instability: 5,
    },
    'harmonic': {
      energy: 50,
      stability: 60,
      clarity: 70,
      harmony: 95,
      instability: 10,
    },
    'fractal': {
      energy: 80,
      stability: 40,
      clarity: 30,
      harmony: 20,
      instability: 90,
    },
    'quantum': {
      energy: 95,
      stability: 15,
      clarity: 20,
      harmony: 5,
      instability: 100,
    },
    'umbra': {
      energy: 40,
      stability: 80,
      clarity: 25,
      harmony: 10,
      instability: 75,
    },
    'solar': {
      energy: 100,
      stability: 50,
      clarity: 60,
      harmony: 50,
      instability: 30,
    },
    'glyph': {
      energy: 70,
      stability: 70,
      clarity: 90,
      harmony: 65,
      instability: 10,
    },
    'echo': {
      energy: 45,
      stability: 30,
      clarity: 50,
      harmony: 40,
      instability: 60,
    },
    'convergence': {
      energy: 85,
      stability: 55,
      clarity: 40,
      harmony: 35,
      instability: 50,
    },
    'ascended': {
      energy: 120,
      stability: 120,
      clarity: 120,
      harmony: 120,
      instability: 0,
    },
    // Functional archetypes (inferred from functional role descriptions)
    'input': {
      energy: 50,
      stability: 70,
      clarity: 90,
      harmony: 40,
      instability: 10,
    },
    'process': {
      energy: 60,
      stability: 65,
      clarity: 70,
      harmony: 50,
      instability: 25,
    },
    'integration': {
      energy: 70,
      stability: 70,
      clarity: 60,
      harmony: 95,
      instability: 15,
    },
    'analytics': {
      energy: 55,
      stability: 75,
      clarity: 95,
      harmony: 50,
      instability: 5,
    },
    'storage': {
      energy: 30,
      stability: 95,
      clarity: 50,
      harmony: 30,
      instability: 5,
    },
    'control': {
      energy: 65,
      stability: 90,
      clarity: 70,
      harmony: 20,
      instability: 10,
    },
    // Fallback for unlabeled nodes
    'default': {
      energy: 65,
      stability: 65,
      clarity: 65,
      harmony: 65,
      instability: 35,
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

    // Normalize archetype name for lookup
    const archetypeKey = (archetype || 'default').toLowerCase().trim();
    
    // Get metrics from table, fallback to default
    const metrics = this.METRICS_TABLE[archetypeKey] || this.METRICS_TABLE['default'];
    
    // Attach as metadata (NOT frozen — Three.js needs extensibility)
    // Immutability enforced at API level, not via Object.freeze()
    node.userData.metrics = {
      energy: metrics.energy,
      stability: metrics.stability,
      clarity: metrics.clarity,
      harmony: metrics.harmony,
      instability: metrics.instability,
      archetype: archetypeKey, // Include archetype name for reference
      _isMetricSnapshot: true // Flag for identification
    };
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
   * @param {string} metricName - Name of metric (energy, stability, clarity, harmony, instability)
   * @returns {number|null} Metric value or null if not found
   */
  static getMetricValue(node, metricName) {
    const metrics = this.getMetrics(node);
    if (!metrics) return null;
    return metrics[metricName] || null;
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
    const requiredFields = ['energy', 'stability', 'clarity', 'harmony', 'instability'];
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
        energy: metrics2.energy - metrics1.energy,
        stability: metrics2.stability - metrics1.stability,
        clarity: metrics2.clarity - metrics1.clarity,
        harmony: metrics2.harmony - metrics1.harmony,
        instability: metrics2.instability - metrics1.instability,
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
