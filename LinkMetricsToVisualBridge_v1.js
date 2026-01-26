/**
 * LINK METRICS TO VISUAL BRIDGE v1.0
 * Real-time wiring of network metrics to link stress visualization
 */

export class LinkMetricsToVisualBridge {
  constructor(linkSystem, collapseSystem, corruptionSystem, neonLinkVisuals) {
    this.linkSystem = linkSystem;
    this.collapseSystem = collapseSystem;
    this.corruptionSystem = corruptionSystem;
    this.neonLinkVisuals = neonLinkVisuals;
    this.linkMetricsCache = new Map();
    this.updateCount = 0;
    
    this.config = {
      degradationWeight: 0.35,
      collapseWeight: 0.30,
      corruptionWeight: 0.25,
      contagionWeight: 0.10,
      minStressThreshold: 0.0,
      maxStressCap: 1.0,
      fractureLowThreshold: 0.15,
      fractureMidThreshold: 0.35,
      fractureHighThreshold: 0.65,
      kinksPerStress: 5.0,
      enableLogging: false,
      logInterval: 300
    };
  }

  computeLinkStress(linkId) {
    if (this.linkMetricsCache.has(linkId)) {
      const cached = this.linkMetricsCache.get(linkId);
      if (cached.frameComputed === this.updateCount - 1) {
        return cached.metrics;
      }
    }
    
    let degradationStress = this._getDegradationStress(linkId);
    let collapseStress = this._getCollapseStress(linkId);
    let corruptionStress = this._getCorruptionStress(linkId);
    let contagionStress = this._getContagionStress(linkId);
    
    const rawStress = 
      degradationStress * this.config.degradationWeight +
      collapseStress * this.config.collapseWeight +
      corruptionStress * this.config.corruptionWeight +
      contagionStress * this.config.contagionWeight;
    
    const stress = Math.max(
      this.config.minStressThreshold,
      Math.min(this.config.maxStressCap, rawStress)
    );
    
    const fractureIntensity = this._computeFractureIntensity(stress);
    const kinkIntensity = this._computeKinkIntensity(stress);
    const dropoutIntensity = contagionStress;
    
    const metrics = {
      stress,
      fractureIntensity,
      kinkIntensity,
      dropoutIntensity,
      degradationStress,
      collapseStress,
      corruptionStress,
      contagionStress
    };
    
    this.linkMetricsCache.set(linkId, {
      frameComputed: this.updateCount,
      metrics
    });
    
    return metrics;
  }

  _getDegradationStress(linkId) {
    if (!this.linkSystem) return 0;
    if (typeof this.linkSystem.getLinkQuality === 'function') {
      const quality = this.linkSystem.getLinkQuality(linkId);
      return Math.max(0, 1 - quality);
    }
    if (typeof this.linkSystem.getLink === 'function') {
      const link = this.linkSystem.getLink(linkId);
      if (link?.userData?.quality) {
        return Math.max(0, 1 - link.userData.quality);
      }
      if (link?.userData?.degradation?.severity) {
        return link.userData.degradation.severity;
      }
    }
    return 0;
  }

  _getCollapseStress(linkId) {
    if (!this.collapseSystem) return 0;
    if (typeof this.collapseSystem.getCollapseProgress === 'function') {
      return this.collapseSystem.getCollapseProgress(linkId);
    }
    if (typeof this.collapseSystem.getLink === 'function') {
      const link = this.collapseSystem.getLink(linkId);
      if (link?.userData?.collapseProgress) {
        return link.userData.collapseProgress;
      }
      if (link?.userData?.collapseWarning) return 0.4;
      if (link?.userData?.collapseCritical) return 0.7;
      if (link?.userData?.collapseActive) return 0.95;
    }
    return 0;
  }

  _getCorruptionStress(linkId) {
    if (!this.corruptionSystem) return 0;
    if (typeof this.corruptionSystem.getLinkCorruption === 'function') {
      return this.corruptionSystem.getLinkCorruption(linkId);
    }
    if (typeof this.corruptionSystem.getLink === 'function') {
      const link = this.corruptionSystem.getLink(linkId);
      if (link?.userData?.corruption) {
        return link.userData.corruption;
      }
    }
    return 0;
  }

  _getContagionStress(linkId) {
    if (!this.corruptionSystem) return 0;
    if (typeof this.corruptionSystem.getContagionIntensity === 'function') {
      return this.corruptionSystem.getContagionIntensity(linkId);
    }
    return 0;
  }

  _computeFractureIntensity(stress) {
    const { fractureLowThreshold, fractureMidThreshold, fractureHighThreshold } = this.config;
    
    if (stress < fractureLowThreshold) {
      return 0;
    } else if (stress < fractureMidThreshold) {
      return (stress - fractureLowThreshold) / (fractureMidThreshold - fractureLowThreshold) * 0.5;
    } else if (stress < fractureHighThreshold) {
      return 0.5 + (stress - fractureMidThreshold) / (fractureHighThreshold - fractureMidThreshold) * 0.4;
    } else {
      return 0.9 + Math.min(0.1, (stress - fractureHighThreshold) * 0.1);
    }
  }

  _computeKinkIntensity(stress) {
    const maxKinks = this.config.kinksPerStress;
    return Math.min(maxKinks, stress * stress * 3.0);
  }

  update(deltaTime) {
    this.updateCount++;
    if (!this.frameScheduler?.shouldRunVisual?.()) return;
    if (this.updateCount % 60 === 0) {
      this.linkMetricsCache.clear();
    }
    
    if (!this.neonLinkVisuals || !this.neonLinkVisuals.scene) return;
    
    this.neonLinkVisuals.scene.traverse((obj) => {
      if (!obj.material || !obj.material.uniforms) return;
      const linkId = obj.userData?.linkId || obj.parent?.userData?.linkId;
      if (!linkId) return;
      
      const metrics = this.computeLinkStress(linkId);
      if (obj.material.uniforms.uStress) {
        obj.material.uniforms.uStress.value = metrics.stress;
      }
      
      if (obj.userData) {
        obj.userData.computedStress = metrics;
      }
    });
  }

  wireLinkStress(linkMesh, linkId) {
    const metrics = this.computeLinkStress(linkId);
    const updateMaterial = (material) => {
      if (material?.uniforms?.uStress) {
        material.uniforms.uStress.value = metrics.stress;
      }
    };
    
    if (linkMesh.material) {
      if (Array.isArray(linkMesh.material)) {
        linkMesh.material.forEach(updateMaterial);
      } else {
        updateMaterial(linkMesh.material);
      }
    }
    
    if (linkMesh.children) {
      for (const child of linkMesh.children) {
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(updateMaterial);
          } else {
            updateMaterial(child.material);
          }
        }
        this.wireLinkStress(child, linkId);
      }
    }
  }

  getLinkMetrics(linkId) {
    return this.computeLinkStress(linkId);
  }

  setConfig(newConfig) {
    Object.assign(this.config, newConfig);
    this.linkMetricsCache.clear();
    console.log('[LinkMetricsToVisualBridge] Config updated');
  }

  dispose() {
    this.linkMetricsCache.clear();
  }
}

export function setupLinkMetricsBridgeConsoleAPI(bridge) {
  window.__linkMetricsBridge = { bridge, enabled: true };
  
  window.getMetricsForLink = function(linkId) {
    const metrics = bridge.getLinkMetrics(linkId);
    console.clear();
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`LINK METRICS FOR: ${linkId}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Total Stress: ${(metrics.stress * 100).toFixed(1)}%`);
    console.log(`Fracture: ${(metrics.fractureIntensity * 100).toFixed(1)}%`);
    console.log(`Kinks: ${metrics.kinkIntensity.toFixed(2)}`);
    console.log('═══════════════════════════════════════════════════════════');
  };
  
  window.reportMetricsBridge = function() {
    console.clear();
    console.log('✅ Link Metrics Bridge Console API ready');
    console.log('Commands: getMetricsForLink(linkId)');
  };
  
  console.log('✅ Link Metrics Bridge Console API ready');
}
