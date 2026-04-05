/**
 * ENGINE HEALTH DIAGNOSTICS 1.0 — Comprehensive System Health Monitor
 * 
 * Production-grade diagnostic API for validating ATOMA engine health,
 * consistency, and integration status. Detects issues before they become
 * problems with detailed human-readable reports.
 * 
 * Features:
 * - Full system initialization status report
 * - Node consistency validation (orphaned nodes, invalid refs)
 * - Link consistency validation (broken links, circular refs)
 * - Synergy engine validation (scoring, recommendations, automation)
 * - Performance metrics and bottleneck detection
 * - Memory usage analysis
 * - Live system health score (0–100)
 * 
 * Usage:
 *   // Quick health check
 *   window.engineDiagnostics.testEngineHealth()
 *   
 *   // Detailed reports
 *   window.engineDiagnostics.getEngineStatus()
 *   window.engineDiagnostics.getNodeConsistencyReport()
 *   window.engineDiagnostics.getLinkConsistencyReport()
 *   window.engineDiagnostics.validateSynergyEngines()
 *   window.engineDiagnostics.printFullSystemReport()
 *   
 * Console API:
 *   window.engineDiagnostics.quickHealth()          // 1-line status
 *   window.engineDiagnostics.getHealthScore()       // 0–100 number
 *   window.engineDiagnostics.getIssues()            // Array of problems
 *   window.engineDiagnostics.getMetrics()           // Performance data
 */

export const EngineHealthDiagnostics1_0 = {
  // ============================================================================
  // STATE & CONFIGURATION
  // ============================================================================
  
  _healthScore: 100,
  _issues: [],
  _lastCheckTime: 0,
  _checkInterval: 5000, // Re-check every 5 seconds
  _metrics: {},

  // ============================================================================
  // SYSTEM REFERENCES (populated during init)
  // ============================================================================

  _systems: {
    AINodes: null,
    NodeLinkingSystem: null,
    ComputeSynergyScore2_0: null,
    LinkRecommendationAI1_0: null,
    LinkAutomationEngine1_0: null,
    LinkAutomationMonitor2_0: null,
    SynergyHighways2_0: null,
    LinkGlowSynergyEngine1_0: null,
    LinkHistoryTracker1_0: null,
  },

  // ============================================================================
  // PUBLIC API: CORE DIAGNOSTICS
  // ============================================================================

  /**
   * Quick one-line system health status.
   * Returns: "🟢 HEALTHY" or "🟡 ISSUES" or "🔴 CRITICAL"
   */
  quickHealth() {
    const score = this.getHealthScore();
    if (score >= 80) return '🟢 HEALTHY';
    if (score >= 50) return '🟡 ISSUES';
    return '🔴 CRITICAL';
  },

  /**
   * Get numerical health score (0–100).
   * 100 = all systems perfect
   * 50 = major issues detected
   * 0 = critical failures
   */
  getHealthScore() {
    this._recalculateHealthScore();
    return Math.round(this._healthScore);
  },

  /**
   * Get array of detected issues.
   * Each issue: { severity: 'critical'|'warning'|'info', message: string }
   */
  getIssues() {
    this._runDiagnostics();
    return [...this._issues];
  },

  /**
   * Get current engine status with all metrics.
   */
  getEngineStatus() {
    const status = {
      timestamp: Date.now(),
      healthScore: this.getHealthScore(),
      status: this.quickHealth(),
      issues: this._issues.length,
      systemsInitialized: this._countInitializedSystems(),
      metrics: this.getMetrics(),
    };
    
    return status;
  },

  /**
   * Get performance metrics.
   */
  getMetrics() {
    return {
      nodeCount: this._countNodes(),
      linkCount: this._countLinks(),
      avgNodeHealth: this._calculateAvgNodeHealth(),
      avgLinkQuality: this._calculateAvgLinkQuality(),
      memoryUsage: this._estimateMemoryUsage(),
      lastCheckTime: this._lastCheckTime,
      checkInterval: this._checkInterval,
    };
  },

  /**
   * Comprehensive node consistency report.
   */
  getNodeConsistencyReport() {
    const report = {
      totalNodes: 0,
      validNodes: 0,
      orphanedNodes: 0,
      invalidRefs: 0,
      issues: [],
      details: [],
    };

    try {
      const nodes = window.aiNodes?.nodes || [];
      report.totalNodes = nodes.length;

      for (const node of nodes) {
        if (!node) {
          report.issues.push('Null node in registry');
          continue;
        }

        // Check for valid ID
        if (!node.id) {
          report.invalidRefs++;
          report.issues.push(`Node missing ID: ${node.name || '?'}`);
          continue;
        }

        // Check for valid position
        if (!node.position || !node.position.x || !node.position.y || !node.position.z) {
          report.issues.push(`Node ${node.id} has invalid position`);
          continue;
        }

        // Check for links (orphaned if no links)
        const linkCount = (node.linkedNodes?.size || 0) + (node.incomingLinks?.size || 0);
        if (linkCount === 0 && nodes.length > 1) {
          report.orphanedNodes++;
          report.details.push(`Orphaned: ${node.id} (${node.name})`);
        }

        report.validNodes++;
      }

      report.healthPercent = report.totalNodes > 0
        ? (report.validNodes / report.totalNodes) * 100
        : 100;

    } catch (e) {
      report.issues.push(`Error during node check: ${e.message}`);
    }

    return report;
  },

  /**
   * Comprehensive link consistency report.
   */
  getLinkConsistencyReport() {
    const report = {
      totalLinks: 0,
      validLinks: 0,
      brokenLinks: 0,
      circularRefs: 0,
      issues: [],
      details: [],
    };

    try {
      const linkSys = window.linkingSystem;
      if (!linkSys) {
        report.issues.push('linkingSystem not initialized');
        return report;
      }

      const links = linkSys.links || [];
      report.totalLinks = links.length;

      for (const link of links) {
        if (!link) {
          report.issues.push('Null link in registry');
          continue;
        }

        // Check for valid nodes
        if (!link.sourceNode || !link.targetNode) {
          report.brokenLinks++;
          report.issues.push(`Link ${link.id} missing source or target`);
          continue;
        }

        // Check for circular reference (same node)
        if (link.sourceNode === link.targetNode) {
          report.circularRefs++;
          report.issues.push(`Circular link: ${link.id} (self-reference)`);
          continue;
        }

        // Check for valid quality
        if (typeof link.quality !== 'number' || link.quality < 0 || link.quality > 1) {
          report.issues.push(`Link ${link.id} has invalid quality: ${link.quality}`);
          continue;
        }

        report.validLinks++;
      }

      report.healthPercent = report.totalLinks > 0
        ? (report.validLinks / report.totalLinks) * 100
        : 100;

    } catch (e) {
      report.issues.push(`Error during link check: ${e.message}`);
    }

    return report;
  },

  /**
   * Validate all synergy engines.
   */
  validateSynergyEngines() {
    const report = {
      ComputeSynergyScore2_0: this._checkSynergyScoring(),
      LinkRecommendationAI1_0: this._checkRecommendationEngine(),
      LinkAutomationEngine1_0: this._checkAutomationEngine(),
      LinkAutomationMonitor2_0: this._checkAutomationMonitor(),
      SynergyHighways2_0: this._checkHighwaysEngine(),
      LinkGlowSynergyEngine1_0: this._checkGlowEngine(),
      LinkHistoryTracker1_0: this._checkHistoryTracker(),
    };

    return report;
  },

  /**
   * Print full human-readable system report to console.
   */
  printFullSystemReport() {
    console.clear();
    this._runDiagnostics();

    const status = this.getEngineStatus();
    const nodeReport = this.getNodeConsistencyReport();
    const linkReport = this.getLinkConsistencyReport();
    const synergyReport = this.validateSynergyEngines();

    console.log(`
╔════════════════════════════════════════════════════════════╗
║     ATOMA ENGINE HEALTH DIAGNOSTICS 1.0 — FULL REPORT    ║
╚════════════════════════════════════════════════════════════╝

📊 OVERALL HEALTH
${this._formatHeader(status.status)}
  Health Score: ${status.healthScore}/100
  Issues: ${status.issues}
  
🔧 SYSTEMS INITIALIZED
  ${status.systemsInitialized}/${Object.keys(this._systems).length} systems active
  
📈 METRICS
  Nodes: ${status.metrics.nodeCount}
  Links: ${status.metrics.linkCount}
  Avg Node Health: ${status.metrics.avgNodeHealth.toFixed(1)}%
  Avg Link Quality: ${status.metrics.avgLinkQuality.toFixed(2)}
  Memory (est): ${status.metrics.memoryUsage.toFixed(1)} MB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 NODE CONSISTENCY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total: ${nodeReport.totalNodes}
  Valid: ${nodeReport.validNodes}
  Orphaned: ${nodeReport.orphanedNodes}
  Invalid Refs: ${nodeReport.invalidRefs}
  Health: ${nodeReport.healthPercent.toFixed(1)}%
  ${nodeReport.issues.length > 0 ? '⚠️  Issues: ' + nodeReport.issues.slice(0, 3).join('; ') : '✅ No issues'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 LINK CONSISTENCY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total: ${linkReport.totalLinks}
  Valid: ${linkReport.validLinks}
  Broken: ${linkReport.brokenLinks}
  Circular Refs: ${linkReport.circularRefs}
  Health: ${linkReport.healthPercent.toFixed(1)}%
  ${linkReport.issues.length > 0 ? '⚠️  Issues: ' + linkReport.issues.slice(0, 3).join('; ') : '✅ No issues'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚙️  SYNERGY ENGINES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${this._formatSynergyReport(synergyReport)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 ISSUES (${this._issues.length})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${this._issues.length > 0 ? this._issues.map((i, idx) => `${idx + 1}. [${i.severity}] ${i.message}`).join('\n') : '✅ No issues detected'}

╔════════════════════════════════════════════════════════════╗
║  Generated: ${new Date().toISOString()}
║  Report ID: ${Math.random().toString(36).slice(2, 9)}
╚════════════════════════════════════════════════════════════╝
    `);
  },

  // ============================================================================
  // PRIVATE: HELPER FUNCTIONS
  // ============================================================================

  _runDiagnostics() {
    const now = Date.now();
    if (now - this._lastCheckTime < this._checkInterval) {
      return; // Skip if recently checked
    }

    this._lastCheckTime = now;
    this._issues = [];

    // Run all checks
    this._checkInitialization();
    this._checkNodeConsistency();
    this._checkLinkConsistency();
    this._checkSynergyEngines();
    this._checkPerformance();

    // Recalculate health
    this._recalculateHealthScore();
  },

  _checkInitialization() {
    const systems = Object.entries(this._systems);
    let initialized = 0;

    for (const [name, ref] of systems) {
      const system = window[name] || window[name.replace(/([A-Z])/g, '_$1').slice(1).toLowerCase()];
      
      if (!system) {
        this._issues.push({
          severity: 'warning',
          message: `${name} not found on window`,
        });
        continue;
      }

      if (!system._initialized && system.init && typeof system.init !== 'function') {
        this._issues.push({
          severity: 'warning',
          message: `${name} may not be initialized`,
        });
        continue;
      }

      initialized++;
    }

    if (initialized < Object.keys(this._systems).length / 2) {
      this._issues.push({
        severity: 'critical',
        message: `Only ${initialized}/${Object.keys(this._systems).length} systems initialized`,
      });
    }
  },

  _checkNodeConsistency() {
    const report = this.getNodeConsistencyReport();
    
    if (report.orphanedNodes > report.totalNodes * 0.1) {
      this._issues.push({
        severity: 'warning',
        message: `High orphaned node ratio: ${report.orphanedNodes}/${report.totalNodes}`,
      });
    }

    if (report.invalidRefs > 0) {
      this._issues.push({
        severity: 'warning',
        message: `${report.invalidRefs} nodes with invalid references`,
      });
    }

    if (report.healthPercent < 80) {
      this._issues.push({
        severity: 'warning',
        message: `Node health: ${report.healthPercent.toFixed(0)}%`,
      });
    }
  },

  _checkLinkConsistency() {
    const report = this.getLinkConsistencyReport();
    
    if (report.brokenLinks > 0) {
      this._issues.push({
        severity: 'warning',
        message: `${report.brokenLinks} broken links detected`,
      });
    }

    if (report.circularRefs > 0) {
      this._issues.push({
        severity: 'info',
        message: `${report.circularRefs} circular references (may be intentional)`,
      });
    }

    if (report.healthPercent < 80) {
      this._issues.push({
        severity: 'warning',
        message: `Link health: ${report.healthPercent.toFixed(0)}%`,
      });
    }
  },

  _checkSynergyEngines() {
    const report = this.validateSynergyEngines();
    
    for (const [engine, status] of Object.entries(report)) {
      if (status.initialized === false) {
        this._issues.push({
          severity: 'warning',
          message: `${engine} not initialized`,
        });
      }
      if (status.error) {
        this._issues.push({
          severity: 'warning',
          message: `${engine}: ${status.error}`,
        });
      }
    }
  },

  _checkPerformance() {
    const metrics = this.getMetrics();
    
    if (metrics.memoryUsage > 200) {
      this._issues.push({
        severity: 'warning',
        message: `High memory usage: ${metrics.memoryUsage.toFixed(1)} MB`,
      });
    }
  },

  _recalculateHealthScore() {
    let score = 100;

    // Deduct for each issue
    for (const issue of this._issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 30;
          break;
        case 'warning':
          score -= 10;
          break;
        case 'info':
          score -= 2;
          break;
      }
    }

    this._healthScore = Math.max(0, Math.min(100, score));
  },

  _countInitializedSystems() {
    let count = 0;
    for (const system of Object.values(this._systems)) {
      if (system && system._initialized) count++;
    }
    return count;
  },

  _countNodes() {
    return window.aiNodes?.nodes?.length || 0;
  },

  _countLinks() {
    return window.linkingSystem?.links?.length || 0;
  },

  _calculateAvgNodeHealth() {
    const nodes = window.aiNodes?.nodes || [];
    if (nodes.length === 0) return 100;
    
    const total = nodes.reduce((sum, n) => sum + (n.health || 1), 0);
    return (total / nodes.length) * 100;
  },

  _calculateAvgLinkQuality() {
    const links = window.linkingSystem?.links || [];
    if (links.length === 0) return 1;
    
    const total = links.reduce((sum, l) => sum + (l.quality || 0), 0);
    return total / links.length;
  },

  _estimateMemoryUsage() {
    // Very rough estimate
    const nodes = this._countNodes();
    const links = this._countLinks();
    return (nodes * 0.05 + links * 0.02) || 0.1; // MB
  },

  _checkSynergyScoring() {
    try {
      const sys = window.ComputeSynergyScore2_0;
      return {
        initialized: !!sys?._initialized,
        status: sys ? 'OK' : 'NOT FOUND',
      };
    } catch (e) {
      return { initialized: false, error: e.message };
    }
  },

  _checkRecommendationEngine() {
    try {
      const sys = window.LinkRecommendationAI1_0;
      return {
        initialized: !!sys?._initialized,
        status: sys ? 'OK' : 'NOT FOUND',
      };
    } catch (e) {
      return { initialized: false, error: e.message };
    }
  },

  _checkAutomationEngine() {
    try {
      const sys = window.LinkAutomationEngine1_0;
      return {
        initialized: !!sys?._initialized,
        status: sys ? 'OK' : 'NOT FOUND',
      };
    } catch (e) {
      return { initialized: false, error: e.message };
    }
  },

  _checkAutomationMonitor() {
    try {
      const sys = window.linkAutomationMonitor;
      return {
        initialized: !!sys?._initialized,
        status: sys ? 'OK' : 'NOT FOUND',
      };
    } catch (e) {
      return { initialized: false, error: e.message };
    }
  },

  _checkHighwaysEngine() {
    try {
      const sys = window.SynergyHighways2_0;
      return {
        initialized: !!sys?._initialized,
        status: sys ? 'OK' : 'NOT FOUND',
      };
    } catch (e) {
      return { initialized: false, error: e.message };
    }
  },

  _checkGlowEngine() {
    try {
      const sys = window.LinkGlowSynergyEngine1_0;
      return {
        initialized: !!sys?._initialized,
        status: sys ? 'OK' : 'NOT FOUND',
      };
    } catch (e) {
      return { initialized: false, error: e.message };
    }
  },

  _checkHistoryTracker() {
    try {
      const sys = window.LinkHistoryTracker1_0;
      return {
        initialized: !!sys?._initialized,
        status: sys ? 'OK' : 'NOT FOUND',
      };
    } catch (e) {
      return { initialized: false, error: e.message };
    }
  },

  _formatHeader(status) {
    return `  ${status}`;
  },

  _formatSynergyReport(report) {
    return Object.entries(report)
      .map(([name, status]) => `  ${status.initialized ? '✅' : '⚠️ '} ${name}: ${status.status}`)
      .join('\n');
  },

  // ============================================================================
  // PUBLIC ALIAS METHODS (for backward compatibility with Session 23 API)
  // ============================================================================

  testEngineHealth() {
    return this.printFullSystemReport();
  },
};

// ============================================================================
// GLOBAL INITIALIZATION & API
// ============================================================================

if (typeof window !== 'undefined') {
  window.engineDiagnostics = EngineHealthDiagnostics1_0;
  console.log('✅ [EngineHealthDiagnostics1_0] Loaded - use window.engineDiagnostics.printFullSystemReport() for diagnostics');
}

export default EngineHealthDiagnostics1_0;
