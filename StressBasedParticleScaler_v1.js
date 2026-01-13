/**
 * STRESS-BASED PARTICLE SCALER v1.0
 * Scale link particle emission rates based on per-link stress values
 */

export class StressBasedParticleScaler_v1 {
  constructor(metricsToVisualBridge, linkingSystem, config = {}) {
    this.metricsToVisualBridge = metricsToVisualBridge;
    this.linkingSystem = linkingSystem;
    this.updateCount = 0;
    
    this.config = {
      minParticleMultiplier: config.minParticleMultiplier ?? 0.5,
      maxParticleMultiplier: config.maxParticleMultiplier ?? 3.0,
      particleScalingCurve: config.particleScalingCurve ?? 'quadratic',
      minParticleSpeed: config.minParticleSpeed ?? 1.0,
      maxParticleSpeed: config.maxParticleSpeed ?? 2.5,
      enableStressColors: config.enableStressColors ?? true,
      stressColorMap: config.stressColorMap ?? {
        healthy: { r: 0.0, g: 1.0, b: 1.0 },
        mild: { r: 0.0, g: 1.0, b: 0.5 },
        moderate: { r: 1.0, g: 1.0, b: 0.0 },
        high: { r: 1.0, g: 0.5, b: 0.0 },
        critical: { r: 1.0, g: 0.0, b: 0.0 }
      },
      enableSmoothing: config.enableSmoothing ?? true,
      smoothingAlpha: config.smoothingAlpha ?? 0.2,
      enableCache: config.enableCache !== false,
      enableLogging: config.enableLogging ?? false,
      enabled: config.enabled !== false
    };
    
    this.linkParticleCache = new Map();
    this.smoothedMultipliers = new Map();
    
    if (this.config.enabled) {
      console.log('[StressBasedParticleScaler_v1] Initialized ✓');
    }
  }

  getParticleMultiplier(linkId) {
    if (!linkId) return 1.0;
    
    if (this.linkParticleCache.has(linkId)) {
      const cached = this.linkParticleCache.get(linkId);
      if (cached.frameComputed === this.updateCount - 1) {
        return cached.multiplier;
      }
    }
    
    const metrics = this.metricsToVisualBridge?.getLinkMetrics?.(linkId);
    if (!metrics) return 1.0;
    
    const stress = metrics.stress ?? 0;
    let rawMultiplier = 1.0;
    
    if (this.config.particleScalingCurve === 'linear') {
      rawMultiplier = this.config.minParticleMultiplier + 
        (this.config.maxParticleMultiplier - this.config.minParticleMultiplier) * stress;
    } else if (this.config.particleScalingCurve === 'quadratic') {
      rawMultiplier = this.config.minParticleMultiplier + 
        (this.config.maxParticleMultiplier - this.config.minParticleMultiplier) * (stress * stress);
    } else if (this.config.particleScalingCurve === 'exponential') {
      const exp = Math.pow(stress, 1.5);
      rawMultiplier = this.config.minParticleMultiplier + 
        (this.config.maxParticleMultiplier - this.config.minParticleMultiplier) * exp;
    }
    
    let smoothedMultiplier = rawMultiplier;
    if (this.config.enableSmoothing) {
      const prevSmoothed = this.smoothedMultipliers.get(linkId) ?? rawMultiplier;
      smoothedMultiplier = prevSmoothed * (1 - this.config.smoothingAlpha) + 
                          rawMultiplier * this.config.smoothingAlpha;
      this.smoothedMultipliers.set(linkId, smoothedMultiplier);
    }
    
    const cached = {
      frameComputed: this.updateCount,
      stress: stress,
      multiplier: smoothedMultiplier,
      speedMultiplier: this._computeSpeedMultiplier(stress),
      color: this._computeStressColor(stress)
    };
    
    this.linkParticleCache.set(linkId, cached);
    return smoothedMultiplier;
  }

  getParticleSpeedMultiplier(linkId) {
    if (!linkId) return 1.0;
    const cached = this.linkParticleCache.get(linkId);
    if (cached) return cached.speedMultiplier;
    
    const metrics = this.metricsToVisualBridge?.getLinkMetrics?.(linkId);
    if (!metrics) return 1.0;
    return this._computeSpeedMultiplier(metrics.stress ?? 0);
  }

  getParticleColor(linkId) {
    if (!this.config.enableStressColors) {
      return { r: 0, g: 1, b: 1 };
    }
    if (!linkId) return { r: 0, g: 1, b: 1 };
    
    const cached = this.linkParticleCache.get(linkId);
    if (cached) return cached.color;
    
    const metrics = this.metricsToVisualBridge?.getLinkMetrics?.(linkId);
    if (!metrics) return { r: 0, g: 1, b: 1 };
    return this._computeStressColor(metrics.stress ?? 0);
  }

  _computeSpeedMultiplier(stress) {
    return this.config.minParticleSpeed + 
      (this.config.maxParticleSpeed - this.config.minParticleSpeed) * stress;
  }

  _computeStressColor(stress) {
    const colorMap = this.config.stressColorMap;
    let color;
    
    if (stress < 0.2) {
      color = colorMap.healthy;
    } else if (stress < 0.4) {
      const t = (stress - 0.2) / 0.2;
      color = this._lerpColor(colorMap.healthy, colorMap.mild, t);
    } else if (stress < 0.6) {
      const t = (stress - 0.4) / 0.2;
      color = this._lerpColor(colorMap.mild, colorMap.moderate, t);
    } else if (stress < 0.8) {
      const t = (stress - 0.6) / 0.2;
      color = this._lerpColor(colorMap.moderate, colorMap.high, t);
    } else {
      const t = (stress - 0.8) / 0.2;
      color = this._lerpColor(colorMap.high, colorMap.critical, t);
    }
    
    return color;
  }

  _lerpColor(c1, c2, t) {
    return {
      r: c1.r + (c2.r - c1.r) * t,
      g: c1.g + (c2.g - c1.g) * t,
      b: c1.b + (c2.b - c1.b) * t
    };
  }

  update(deltaTime) {
    this.updateCount++;
    if (this.updateCount % 60 === 0) {
      this.linkParticleCache.clear();
    }
  }

  getHighStressLinks(threshold = 0.3) {
    const highStress = [];
    for (const [linkId, cached] of this.linkParticleCache) {
      if (cached.stress > threshold) {
        highStress.push({
          linkId,
          stress: cached.stress,
          particleMultiplier: cached.multiplier,
          speedMultiplier: cached.speedMultiplier
        });
      }
    }
    return highStress.sort((a, b) => b.stress - a.stress);
  }

  getCacheStats() {
    return {
      cachedLinks: this.linkParticleCache.size,
      smoothedLinks: this.smoothedMultipliers.size,
      updateCount: this.updateCount,
      memoryEstimate: this.linkParticleCache.size * 256 + ' bytes'
    };
  }

  dispose() {
    this.linkParticleCache.clear();
    this.smoothedMultipliers.clear();
  }
}

export function setupStressParticleScalerConsoleAPI(scaler) {
  window.__stressParticleScaler = { scaler, enabled: true };
  
  window.getParticleMultiplier = function(linkId) {
    const mult = scaler.getParticleMultiplier(linkId);
    const speed = scaler.getParticleSpeedMultiplier(linkId);
    const color = scaler.getParticleColor(linkId);
    
    console.clear();
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`PARTICLE SCALING FOR: ${linkId}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Emission Multiplier: ${mult.toFixed(2)}x`);
    console.log(`Speed Multiplier: ${speed.toFixed(2)}x`);
    console.log(`Color: rgb(${(color.r*255).toFixed(0)}, ${(color.g*255).toFixed(0)}, ${(color.b*255).toFixed(0)})`);
    console.log('═══════════════════════════════════════════════════════════');
  };
  
  window.reportHighStressParticles = function(threshold = 0.5) {
    console.clear();
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`HIGH STRESS LINKS (> ${(threshold * 100).toFixed(0)}%)`);
    console.log('═══════════════════════════════════════════════════════════');
    
    const highStress = scaler.getHighStressLinks(threshold);
    if (highStress.length === 0) {
      console.log('✓ No high-stress links');
    } else {
      for (const link of highStress.slice(0, 10)) {
        const color = scaler.getParticleColor(link.linkId);
        const colorHex = `rgb(${(color.r*255).toFixed(0)}, ${(color.g*255).toFixed(0)}, ${(color.b*255).toFixed(0)})`;
        console.log(`${link.linkId}: ${(link.stress*100).toFixed(1)}% stress, ${link.particleMultiplier.toFixed(2)}x particles`);
      }
    }
    console.log('═══════════════════════════════════════════════════════════');
  };
  
  window.reportParticleScalerStats = function() {
    const stats = scaler.getCacheStats();
    console.clear();
    console.log('═══════════════════════════════════════════════════════════');
    console.log('STRESS-BASED PARTICLE SCALER - STATISTICS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Cached Links: ${stats.cachedLinks}`);
    console.log(`Update Count: ${stats.updateCount}`);
    console.log(`Memory: ~${stats.memoryEstimate}`);
    console.log('═══════════════════════════════════════════════════════════');
  };
  
  console.log('✅ Stress-Based Particle Scaler Console API ready');
}
