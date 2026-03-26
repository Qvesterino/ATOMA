/**
 * METRIC INTERPRETATION & NORMALIZATION LAYER v1.0
 * 
 * Converts core stats into stable, perceptually meaningful signals for visuals and UI.
 * Read-only, non-mutating layer that bridges raw metrics to visual systems.
 */

const DEFAULT_CONFIG = {
  smoothingAlpha: 0.2,
  corruptionBands: {
    healthy: 0.2,
    elevated: 0.5,
    critical: 0.8,
    extreme: 1.0
  },
  integrityBands: {
    healthy: 0.7,
    caution: 0.4,
    danger: 0.0
  },
  harmonyBreathe: {
    minStrength: 0.3,
    maxStrength: 1.0,
    breatheFrequency: 1.2
  },
  synergySaturation: {
    appearThreshold: 0.3,
    resonanceMultiplier: 2.0
  },
  stressChaos: {
    minDensity: 0.0,
    maxDensity: 1.0,
    jitterScale: 0.5
  },
  vitalityWeights: {
    corruption: -0.3,
    integrity: 0.4,
    harmony: 0.2,
    synergy: 0.1
  }
};

class MetricInterpretationLayer_v1 {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.frameCount = 0;
    this.smoothedSignals = new Map();
    this.debugEnabled = config.debugEnabled || false;
    this.metricsCache = {
      nodes: new Map(),
      network: {
        networkMood: 0,
        averageCorruption: 0,
        averageHealth: 0,
        healthyNodeCount: 0,
        criticalNodeCount: 0
      }
    };
  }
  
  update(deltaTime, nodes = []) {
    this.frameCount++;
    this.metricsCache.nodes.clear();
    
    let totalCorruption = 0;
    let totalHealth = 0;
    let healthyCount = 0;
    let criticalCount = 0;
    
    for (const node of nodes) {
      if (!node?.userData) continue;
      
      const nodeId = node.userData.id || `node_${Math.random()}`;
      
      const rawStats = {
        corruption: node.userData?.metrics?.corruption ?? 0,
        integrity: node.userData?.metrics?.stability ?? 1,
        harmony: node.userData?.metrics?.harmony ?? 0.5,
        synergy: node.userData?.metrics?.synergy ?? 0,
        networkStress: this._computeNetworkStress(node)
      };
      
      const smoothedStats = this._smoothStats(nodeId, rawStats, deltaTime);
      const visualSignals = this._computeVisualSignals(smoothedStats, deltaTime, node);
      
      this.metricsCache.nodes.set(nodeId, {
        raw: rawStats,
        smoothed: smoothedStats,
        visual: visualSignals
      });
      
      this._writeSignalsToNode(node, visualSignals);
      
      totalCorruption += smoothedStats.corruption;
      totalHealth += visualSignals.nodeVitalityScore;
      if (visualSignals.nodeVitalityScore > 0.6) healthyCount++;
      if (visualSignals.nodeVitalityScore < 0.3) criticalCount++;
    }
    
    const nodeCount = Math.max(nodes.length, 1);
    this.metricsCache.network = {
      networkMood: this._computeNetworkMood(totalCorruption, totalHealth, nodes),
      averageCorruption: totalCorruption / nodeCount,
      averageHealth: totalHealth / nodeCount,
      healthyNodeCount: healthyCount,
      criticalNodeCount: criticalCount,
      networkStress: this._computeAggregateNetworkStress(nodes)
    };
    
    if (typeof window !== 'undefined') {
      window.__ATOMA_METRICS = window.__ATOMA_METRICS || {};
      window.__ATOMA_METRICS.interpretation = this.metricsCache;
    }
  }
  
  _computeNetworkStress(node) {
    if (!node?.userData?.links) return 0.5;
    const links = node.userData.links;
    let collapsedCount = 0;
    for (const link of links) {
      if (link.userData?.collapsed || link.userData?.integrity < 0.3) {
        collapsedCount++;
      }
    }
    return links.length > 0 ? collapsedCount / links.length : 0;
  }
  
  _computeAggregateNetworkStress(nodes) {
    let totalStress = 0;
    let count = 0;
    for (const node of nodes) {
      if (node?.userData) {
        totalStress += this._computeNetworkStress(node);
        count++;
      }
    }
    return count > 0 ? totalStress / count : 0;
  }
  
  _smoothStats(nodeId, rawStats, deltaTime) {
    let smoothed = this.smoothedSignals.get(nodeId);
    if (!smoothed) {
      smoothed = { ...rawStats };
      this.smoothedSignals.set(nodeId, smoothed);
      return smoothed;
    }
    
    const alpha = this.config.smoothingAlpha;
    smoothed.corruption = alpha * rawStats.corruption + (1 - alpha) * smoothed.corruption;
    smoothed.integrity = alpha * rawStats.integrity + (1 - alpha) * smoothed.integrity;
    smoothed.harmony = alpha * rawStats.harmony + (1 - alpha) * smoothed.harmony;
    smoothed.synergy = alpha * rawStats.synergy + (1 - alpha) * smoothed.synergy;
    smoothed.networkStress = alpha * rawStats.networkStress + (1 - alpha) * smoothed.networkStress;
    
    this.smoothedSignals.set(nodeId, smoothed);
    return smoothed;
  }
  
  _computeVisualSignals(smoothedStats, deltaTime, node = null) {
    const { corruption, integrity, harmony, synergy, networkStress } = smoothedStats;
    const config = this.config;
    const breathePhase = (Date.now() * 0.001) % (1 / config.harmonyBreathe.breatheFrequency);
    const breatheOscillation = Math.sin(breathePhase * Math.PI * 2);
    
    const corruptionIntensity = this._bandMap(corruption, config.corruptionBands, 0, 1);
    const integrityHealth = this._bandMap(integrity, { critical: 0, caution: 0.4, healthy: 0.7, max: 1 }, 0, 1);
    
    const harmonyBase = harmony * config.harmonyBreathe.maxStrength;
    const harmonyAuraStrength = config.harmonyBreathe.minStrength +
      (harmonyBase * (1 - config.harmonyBreathe.minStrength)) +
      (breatheOscillation * 0.1 * harmony);
    
    let synergyGlowIntensity = 0;
    if (synergy > config.synergySaturation.appearThreshold) {
      const normalized = (synergy - config.synergySaturation.appearThreshold) /
        (1 - config.synergySaturation.appearThreshold);
      synergyGlowIntensity = normalized * config.synergySaturation.resonanceMultiplier;
      synergyGlowIntensity = Math.min(synergyGlowIntensity, 1.0);
    }
    
    const networkStressVisualDensity = networkStress * config.stressChaos.maxDensity;
    
    const vitalityWeights = config.vitalityWeights;
    const nodeVitalityScore = Math.max(0, Math.min(1,
      0.5 +
      (vitalityWeights.corruption * corruption) +
      (vitalityWeights.integrity * integrity) +
      (vitalityWeights.harmony * harmony) +
      (vitalityWeights.synergy * synergy)
    ));
    
    return {
      corruptionIntensity,
      integrityHealth,
      harmonyAuraStrength,
      synergyGlowIntensity,
      networkStressVisualDensity,
      nodeVitalityScore,
      corruptionBand: this._getBand(corruption, config.corruptionBands),
      integrityBand: this._getBand(integrity, config.integrityBands),
      metadata: {
        breathePhase,
        breatheOscillation,
        timestamp: Date.now()
      }
    };
  }
  
  _bandMap(value, bands, min, max) {
    const sorted = Object.entries(bands)
      .map(([k, v]) => ({ name: k, value: v }))
      .sort((a, b) => a.value - b.value);
    
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      if (value >= current.value && value <= next.value) {
        const t = (value - current.value) / (next.value - current.value);
        return current.value + (next.value - current.value) * t;
      }
    }
    
    return value < sorted[0].value ? min : max;
  }
  
  _getBand(value, bands) {
    const sorted = Object.entries(bands)
      .map(([k, v]) => ({ name: k, value: v }))
      .sort((a, b) => a.value - b.value);
    
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (value >= sorted[i].value) {
        return sorted[i].name;
      }
    }
    
    return sorted[0].name;
  }
  
  _computeNetworkMood(totalCorruption, totalHealth, nodes) {
    const nodeCount = Math.max(nodes.length, 1);
    const avgCorruption = totalCorruption / nodeCount;
    const avgHealth = totalHealth / nodeCount;
    const mood = (avgHealth * 2 - 1) - (avgCorruption * 0.5);
    return Math.max(-1, Math.min(1, mood));
  }
  
  _writeSignalsToNode(node, visualSignals) {
    if (!node.userData) node.userData = {};
    node.userData.visualMetrics = visualSignals;
    node.userData.visualCorruptionIntensity = visualSignals.corruptionIntensity;
    node.userData.visualIntegrityHealth = visualSignals.integrityHealth;
    node.userData.visualHarmonyAuraStrength = visualSignals.harmonyAuraStrength;
    node.userData.visualSynergyGlowIntensity = visualSignals.synergyGlowIntensity;
    node.userData.visualNetworkStressDensity = visualSignals.networkStressVisualDensity;
    node.userData.visualNodeVitalityScore = visualSignals.nodeVitalityScore;
  }
  
  getNodeVisualSignals(nodeId) {
    return this.metricsCache.nodes.get(nodeId);
  }
  
  getNetworkSignals() {
    return this.metricsCache.network;
  }
  
  getDebugInfo() {
    return {
      frameCount: this.frameCount,
      cachedNodes: this.metricsCache.nodes.size,
      network: this.metricsCache.network,
      config: this.config
    };
  }
}

function setupMetricInterpretationConsoleAPI(layer) {
  if (typeof window === 'undefined') return;
  
  window.__ATOMA_INTERPRETATION = {
    layer,
    getNodeSignals: (nodeId) => layer.getNodeVisualSignals(nodeId),
    getNetworkSignals: () => layer.getNetworkSignals(),
    getDebugInfo: () => layer.getDebugInfo(),
    setConfig: (partial) => {
      Object.assign(layer.config, partial);
      console.log('[MetricInterpretation] Config updated:', layer.config);
    },
    printNodeSignals: (nodeId) => {
      const signals = layer.getNodeVisualSignals(nodeId);
      console.table(signals || { error: 'Node not found' });
    }
  };
  
  console.log('[MetricInterpretationLayer_v1] Console API ready: window.__ATOMA_INTERPRETATION');
}

export { MetricInterpretationLayer_v1, setupMetricInterpretationConsoleAPI };
