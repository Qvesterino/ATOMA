// ATOMA Spawn Filter + Fallback Audit
// Cieľ: Zistiť prečo mythic/prime nie sú vyberané alebo sú vyradené filtrom

export class ATOMASpawnFilterAudit {
  constructor() {
    this.logs = [];
    this.enabled = true;
  }

  log(stage, data) {
    if (!this.enabled) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, stage, ...data };
    this.logs.push(logEntry);
    
    console.group(`[SPAWN_AUDIT] ${stage}`);
    console.log('Category:', data.category || 'unknown');
    console.log('Requested:', data.requestedCategory || 'unknown');
    console.log('Reason:', data.reason || 'no reason');
    console.log('Valid:', data.valid !== undefined ? data.valid : 'unknown');
    console.log('Fallback:', data.fallback || 'none');
    if (data.metrics) console.log('Metrics:', data.metrics);
    console.groupEnd();
  }

  // Audit validácie kategórie
  auditCategoryValidation(ainodes, requestedCategory) {
    const validation = ainodes.validateCategory(requestedCategory);
    
    this.log('category_validation', {
      requestedCategory,
      category: validation.category,
      valid: validation.valid,
      reason: validation.reason,
      safeCategories: ainodes.constructor.SAFE_CATEGORIES,
      unsafeCategories: ainodes.constructor.UNSAFE_CATEGORIES,
      isMythic: requestedCategory === 'mythic',
      isPrime: requestedCategory === 'prime'
    });
    
    return validation;
  }

  // Audit spawn request validácie
  auditSpawnRequest(ainodes, category, forceArchetype = null) {
    const validation = ainodes.validateSpawnRequest({ category, forceArchetype });
    
    this.log('spawn_request_validation', {
      category,
      forceArchetype,
      requestedCategoryRaw: validation.requestedCategoryRaw,
      finalCategory: validation.category,
      allowed: validation.allowed,
      reason: validation.reason,
      fallbackReason: validation.fallbackReason,
      isFallbackSpawn: validation.isFallbackSpawn
    });
    
    return validation;
  }

  // Audit factory readiness
  auditFactoryReadiness(ainodes, category) {
    const isReady = ainodes.ensureFactoryReadyAndVisual(category);
    
    // Získaj factory registry info
    const EnhancedNodeModels = window.EnhancedNodeModels || ainodes.constructor;
    const registryEntry = EnhancedNodeModels._ALL_NODE_FACTORIES?.[category];
    const hasCanonicalVisual = Array.isArray(registryEntry) && registryEntry.length > 0;
    
    this.log('factory_readiness', {
      category,
      isReady,
      hasCanonicalVisual,
      registryEntry: registryEntry || 'missing',
      factoryCount: registryEntry?.length || 0,
      registryKeys: Object.keys(EnhancedNodeModels._ALL_NODE_FACTORIES || {})
    });
    
    return isReady;
  }

  // Audit metriky uzla
  auditNodeMetrics(category) {
    // Získaj metriky z NodeVisualRegistry
    const registry = window.NODE_VISUAL_REGISTRY;
    if (!registry) {
      this.log('metrics_missing_registry', { category, reason: 'NODE_VISUAL_REGISTRY not found' });
      return null;
    }
    
    // Nájdi uzly danej kategórie
    const categoryEntries = Object.entries(registry).filter(([code, def]) => 
      def.category === category
    );
    
    if (categoryEntries.length === 0) {
      this.log('metrics_no_entries', { category, reason: 'No entries found in registry' });
      return null;
    }
    
    // Analyzuj metriky
    const metricsAnalysis = categoryEntries.map(([code, def]) => ({
      visualCode: code,
      category: def.category,
      factoryName: def.factoryName,
      metrics: def.metrics,
      archetypeTag: def.archetypeTag,
      stability: def.metrics?.stability,
      corruption: def.metrics?.corruption,
      loadPressure: def.metrics?.loadPressure,
      // Porovnaj s prahovými hodnotami
      stabilityOk: def.metrics?.stability >= 0.5,
      corruptionOk: def.metrics?.corruption <= 0.3,
      loadPressureOk: def.metrics?.loadPressure <= 0.8
    }));
    
    const allMetricsOk = metricsAnalysis.every(m => 
      m.stabilityOk && m.corruptionOk && m.loadPressureOk
    );
    
    this.log('node_metrics_audit', {
      category,
      totalEntries: categoryEntries.length,
      allMetricsOk,
      metricsAnalysis,
      avgStability: metricsAnalysis.reduce((sum, m) => sum + m.stability, 0) / metricsAnalysis.length,
      avgCorruption: metricsAnalysis.reduce((sum, m) => sum + m.corruption, 0) / metricsAnalysis.length,
      avgLoadPressure: metricsAnalysis.reduce((sum, m) => sum + m.loadPressure, 0) / metricsAnalysis.length
    });
    
    return metricsAnalysis;
  }

  // Kompletný audit spawn pipeline pre danú kategóriu
  async performFullAudit(ainodes, category) {
    console.warn(`[SPAWN_AUDIT] Starting full audit for category: ${category}`);
    
    // 1. Audit validácie kategórie
    const catValidation = this.auditCategoryValidation(ainodes, category);
    
    // 2. Audit spawn requestu
    const spawnValidation = this.auditSpawnRequest(ainodes, category);
    
    // 3. Audit factory readiness
    const factoryReady = this.auditFactoryReadiness(ainodes, category);
    
    // 4. Audit metrík
    const metricsAnalysis = this.auditNodeMetrics(category);
    
    // Zhrnutie
    const summary = {
      category,
      canSpawn: catValidation.valid && spawnValidation.allowed && factoryReady,
      issues: []
    };
    
    if (!catValidation.valid) summary.issues.push('Category validation failed');
    if (!spawnValidation.allowed) summary.issues.push('Spawn request validation failed');
    if (!factoryReady) summary.issues.push('Factory not ready');
    if (metricsAnalysis && !metricsAnalysis.every(m => m.stabilityOk && m.corruptionOk && m.loadPressureOk)) {
      summary.issues.push('Some metrics exceed thresholds');
    }
    
    this.log('audit_summary', summary);
    
    console.warn(`[SPAWN_AUDIT] Summary for ${category}:`, summary);
    
    return {
      category,
      summary,
      catValidation,
      spawnValidation,
      factoryReady,
      metricsAnalysis,
      logs: this.logs
    };
  }

  // Testovacia funkcia pre mythic a prime
  async testMythicAndPrime(ainodes) {
    console.warn('[SPAWN_AUDIT] Testing MYTHIC and PRIME categories...');
    
    const mythicResult = await this.performFullAudit(ainodes, 'mythic');
    const primeResult = await this.performFullAudit(ainodes, 'prime');
    
    const finalReport = {
      timestamp: new Date().toISOString(),
      mythic: mythicResult,
      prime: primeResult,
      conclusion: {
        mythicCanSpawn: mythicResult.summary.canSpawn,
        primeCanSpawn: primeResult.summary.canSpawn,
        commonIssues: [...new Set([...mythicResult.summary.issues, ...primeResult.summary.issues])]
      }
    };
    
    console.warn('[SPAWN_AUDIT] FINAL REPORT:', finalReport);
    
    return finalReport;
  }

  exportLogs() {
    return {
      timestamp: new Date().toISOString(),
      totalLogs: this.logs.length,
      logs: this.logs
    };
  }

  clearLogs() {
    this.logs = [];
  }
}

// Globálna inštancia pre ľahké použitie
window.atomaSpawnAudit = new ATOMASpawnFilterAudit();

export default ATOMASpawnFilterAudit;