/**
 * ParticleSemanticDensityAdapter_Session121.js
 * ============================================================================
 * PARTICLE CLUSTERING & DENSITY AS SEMANTIC CHANNEL
 * 
 * Encodes intensity and urgency through particle distribution:
 * - DENSITY: How many particles appear (intensity of conflict)
 * - CLUSTERING: How tightly grouped (urgency of resolution)
 * 
 * SEMANTIC CHANNELS (Complete):
 * 1. Shape (Session 120): What kind of conflict?
 * 2. Motion (Session 120): Where is influence flowing?
 * 3. Density (Session 121): How strong is the conflict?
 * 4. Clustering (Session 121): How urgent is it?
 * 
 * ARCHITECTURE:
 * ✅ Pure adapter (reads state, modifies spawn parameters)
 * ✅ Zero per-frame allocations
 * ✅ Deterministic mapping from existing metrics
 * ✅ Graceful clamping and degradation
 * ✅ Smooth temporal blending (EMA)
 * ✅ Works with all existing systems
 * 
 * @author VFX Technical Director — ATOMA Project Session 121
 * @version 1.0.0
 */

/**
 * Particle Semantic Density Adapter
 * Controls particle spawn density and clustering based on synaptic state
 */
export class ParticleSemanticDensityAdapter_Session121 {
  constructor(config = {}) {
    this.semanticBus = config.semanticBus ?? globalThis?.semanticBus ?? null;
    this.config = {
      // Intensity mapping
      intensityEMAAlpha: config.intensityEMAAlpha ?? 0.2,
      maxDensityMultiplier: config.maxDensityMultiplier ?? 4.0,
      densitySafetyThreshold: config.densitySafetyThreshold ?? 3.5,
      
      // Urgency mapping
      urgencyEMAAlpha: config.urgencyEMAAlpha ?? 0.15,
      maxClusterCohesion: config.maxClusterCohesion ?? 1.0,
      minClusterRadius: config.minClusterRadius ?? 0.1,
      maxClusterRadius: config.maxClusterRadius ?? 2.0,
      
      // Safety
      enabled: config.enabled ?? true,
      debugMode: config.debugMode ?? false,
    };
    
    // Per-link tracking
    this.linkMetrics = new Map(); // linkId → { intensity, urgency, cohesion, ... }
    this._semanticUnsubscribers = [];
    this._semanticRefreshRequested = false;
    
    // Statistics
    this.stats = {
      activeLinkCount: 0,
      avgIntensity: 0,
      avgUrgency: 0,
      densityEvents: 0,
    };
    
    if (this.config.debugMode) {
      console.log('[Session 121] ParticleSemanticDensityAdapter initialized');
    }

    this._setupSemanticSubscriptions();
  }

  _setupSemanticSubscriptions() {
    if (!this.semanticBus || typeof this.semanticBus.subscribe !== 'function') return;

    const requestRefresh = () => {
      this._semanticRefreshRequested = true;
    };

    const unsubMetric = this.semanticBus.subscribe('metric.node.updated', requestRefresh);
    const unsubLink = this.semanticBus.subscribe('link.created', requestRefresh);
    const unsubSpawn = this.semanticBus.subscribe('node.spawned', requestRefresh);

    if (typeof unsubMetric === 'function') this._semanticUnsubscribers.push(unsubMetric);
    if (typeof unsubLink === 'function') this._semanticUnsubscribers.push(unsubLink);
    if (typeof unsubSpawn === 'function') this._semanticUnsubscribers.push(unsubSpawn);
  }
  
  /**
   * Main update loop
   */
  update(deltaTime, links, conflictSystem, cascadeSystem) {
    if (!this.config.enabled || !links) return;
    
    // Reset stats
    this.stats.activeLinkCount = 0;
    this.stats.avgIntensity = 0;
    this.stats.avgUrgency = 0;
    
    // Update each link
    for (const link of links) {
      if (!link) continue;
      if (!link.userData) link.userData = {};
      
      // Compute intensity and urgency
      const intensity = this._computeIntensity(link, cascadeSystem);
      const urgency = this._computeUrgency(link, conflictSystem, cascadeSystem);
      
      // Get or create metrics
      const metrics = this._getOrCreateMetrics(link);
      
      // Smooth temporal blending
      metrics.intensitySmoothed = this._smoothValue(
        metrics.intensitySmoothed ?? 0,
        intensity,
        this.config.intensityEMAAlpha,
        deltaTime
      );
      
      metrics.urgencySmoothed = this._smoothValue(
        metrics.urgencySmoothed ?? 0,
        urgency,
        this.config.urgencyEMAAlpha,
        deltaTime
      );
      
      // Compute derived parameters
      const densityMultiplier = this._densityFromIntensity(metrics.intensitySmoothed);
      const clusterCohesion = this._cohesionFromUrgency(metrics.urgencySmoothed);
      const clusterRadius = this._radiusFromCohesion(clusterCohesion);
      
      // Clamp to safety limits
      metrics.densityMultiplier = Math.min(
        densityMultiplier,
        this.config.densitySafetyThreshold
      );
      
      metrics.clusterCohesion = Math.max(0, Math.min(
        clusterCohesion,
        this.config.maxClusterCohesion
      ));
      
      metrics.clusterRadius = Math.max(
        this.config.minClusterRadius,
        Math.min(
          clusterRadius,
          this.config.maxClusterRadius
        )
      );
      
      // Compute urgency-driven oscillation (for visual feedback)
      metrics.urgencyOscillation = Math.sin(Date.now() * 0.003 * (1 + urgency * 5)) * urgency;
      
      // Write to userData for downstream consumption
      link.userData.particleIntensity = metrics.intensitySmoothed;
      link.userData.particleUrgency = metrics.urgencySmoothed;
      link.userData.particleDensityMultiplier = metrics.densityMultiplier;
      link.userData.particleClusterCohesion = metrics.clusterCohesion;
      link.userData.particleClusterRadius = metrics.clusterRadius;
      link.userData.particleUrgencyOscillation = metrics.urgencyOscillation;

      // Stamp canonical writes for particle fields
      link.userData.__canonicalWriteAt = link.userData.__canonicalWriteAt || {};
      link.userData.__canonicalWriteAt.particleIntensity = Date.now();
      link.userData.__canonicalWriteAt.particleUrgency = Date.now();
      
      // Update stats
      this.stats.activeLinkCount++;
      this.stats.avgIntensity += metrics.intensitySmoothed;
      this.stats.avgUrgency += metrics.urgencySmoothed;
    }
    
    // Normalize stats
    if (this.stats.activeLinkCount > 0) {
      this.stats.avgIntensity /= this.stats.activeLinkCount;
      this.stats.avgUrgency /= this.stats.activeLinkCount;
    }
    
    // Cleanup inactive metrics (optional)
    if (this._semanticRefreshRequested || Math.random() < 0.01) {
      this._cleanupInactiveMetrics();
      this._semanticRefreshRequested = false;
    }
  }
  
  /**
   * Compute intensity scalar (0-1) from conflict state
   */
  _computeIntensity(link, cascadeSystem) {
    let intensity = 0;
    
    // Source 1: Cascade intensity (direct from cascade system)
    if (cascadeSystem && link.userData) {
      const cascadeInfo = cascadeSystem.getLinkCascadeInfo?.(link);
      if (cascadeInfo && cascadeInfo.intensity) {
        intensity = Math.max(intensity, cascadeInfo.intensity);
      }
    }
    
    // Source 2: Direct cascade intensity stored in userData
    if (typeof link.userData?.cascadeIntensity === 'number') {
      intensity = Math.max(intensity, link.userData.cascadeIntensity);
    }

    // Source 3: Shared flowState intensity (fallback)
    if (typeof link.userData?.flowState?.intensity === 'number') {
      intensity = Math.max(intensity, link.userData.flowState.intensity);
    }
    
    // Source 4: Conflict/corruption state (endpoints)
    if (link.nodes && link.nodes.length >= 2) {
      const nodeA = link.nodes[0];
      const nodeB = link.nodes[1];
      
      // Corruption multiplies intensity
      const nodeACorruption = nodeA?.userData?.metrics?.corruption ?? 0;
      const nodeBCorruption = nodeB?.userData?.metrics?.corruption ?? 0;
      const corruptionFactor = 1 + Math.max(nodeACorruption, nodeBCorruption) * 0.5;
      
      intensity *= corruptionFactor;
    }
    
    // Clamp to 0-1
    return Math.max(0, Math.min(1, intensity));
  }
  
  /**
   * Compute urgency scalar (0-1) from change rates and thresholds
   */
  _computeUrgency(link, conflictSystem, cascadeSystem) {
    let urgency = 0;
    
    // Urgency Source 1: Rapid cascade changes (derivative)
    if (link.userData) {
      const prevCascade = link.userData._prevCascadeIntensity ?? 0;
      const currCascade = link.userData.cascadeIntensity ?? 0;
      const cascadeChange = Math.abs(currCascade - prevCascade);
      
      // High change rate = urgent
      urgency = Math.max(urgency, Math.min(1, cascadeChange * 5));
      
      // Store for next frame
      link.userData._prevCascadeIntensity = currCascade;
    }
    
    // Urgency Source 2: Unresolved conflicts (sustained high state)
    if (conflictSystem && link.userData) {
      const timeInConflict = link.userData._timeInConflict ?? 0;
      const conflictPersistence = Math.min(1, timeInConflict / 3.0); // Urgent if > 3 sec
      urgency = Math.max(urgency, conflictPersistence * 0.7);
    }
    
    // Urgency Source 3: Instability spikes (rapid oscillation)
    if (link.userData?.cascadeOscillation) {
      const oscillationIntensity = Math.abs(link.userData.cascadeOscillation);
      urgency = Math.max(urgency, oscillationIntensity * 0.6);
    }
    
    // Urgency Source 4: Approaching fatigue threshold
    if (link.userData?.synapticFatigue) {
      const fatigue = link.userData.synapticFatigue;
      const fatigueUrgency = Math.max(0, (fatigue - 0.5) * 2); // Urgent above 0.5
      urgency = Math.max(urgency, fatigueUrgency * 0.5);
    }
    
    // Clamp to 0-1
    return Math.max(0, Math.min(1, urgency));
  }
  
  /**
   * Map intensity → particle density multiplier
   * Quadratic curve for non-linear perception
   */
  _densityFromIntensity(intensity) {
    // Quadratic mapping: low values stay sparse, high values cluster
    const quadratic = intensity * intensity;
    
    // Scale to multiplier range (1.0 = baseline, up to maxDensity)
    return 1.0 + quadratic * (this.config.maxDensityMultiplier - 1.0);
  }
  
  /**
   * Map urgency → cluster cohesion strength
   * Higher urgency = particles pull together more tightly
   */
  _cohesionFromUrgency(urgency) {
    // Sigmoid-like curve for smooth cohesion ramp
    const cohesion = urgency * this.config.maxClusterCohesion;
    
    // At urgency 0: cohesion = 0 (no clustering)
    // At urgency 1: cohesion = maxClusterCohesion (tight clusters)
    return cohesion;
  }
  
  /**
   * Map cohesion → effective cluster radius
   * Higher cohesion = tighter, smaller clusters
   */
  _radiusFromCohesion(cohesion) {
    const maxRadius = this.config.maxClusterRadius;
    const minRadius = this.config.minClusterRadius;
    
    // Inverse mapping: cohesion 0 → max radius, cohesion 1 → min radius
    const radius = maxRadius - (cohesion * (maxRadius - minRadius));
    
    return radius;
  }
  
  /**
   * Smooth value with exponential moving average
   */
  _smoothValue(prev, curr, alpha, deltaTime) {
    // Adaptive alpha based on deltaTime for frame-rate independence
    const dt_alpha = 1 - Math.pow(1 - alpha, deltaTime * 60); // Assumes 60 FPS baseline
    return prev * (1 - dt_alpha) + curr * dt_alpha;
  }
  
  /**
   * Get or create metrics for link
   */
  _getOrCreateMetrics(link) {
    const linkId = link.uuid;
    
    if (!this.linkMetrics.has(linkId)) {
      this.linkMetrics.set(linkId, {
        // Current values
        intensitySmoothed: 0,
        urgencySmoothed: 0,
        
        // Derived
        densityMultiplier: 1.0,
        clusterCohesion: 0,
        clusterRadius: this.config.maxClusterRadius,
        urgencyOscillation: 0,
        
        // Tracking
        timeActive: 0,
      });
    }
    
    return this.linkMetrics.get(linkId);
  }
  
  /**
   * Cleanup inactive metrics
   */
  _cleanupInactiveMetrics() {
    for (const [linkId, metrics] of this.linkMetrics) {
      // Remove if both intensity and urgency are near zero
      if (metrics.intensitySmoothed < 0.01 && metrics.urgencySmoothed < 0.01) {
        this.linkMetrics.delete(linkId);
      }
    }
  }
  
  /**
   * Get metrics for a link
   */
  getLinkMetrics(link) {
    return this.linkMetrics.get(link?.uuid);
  }
  
  /**
   * Get current statistics
   */
  getStats() {
    return {
      activeLinkCount: this.stats.activeLinkCount,
      avgIntensity: this.stats.avgIntensity.toFixed(3),
      avgUrgency: this.stats.avgUrgency.toFixed(3),
      trackedMetrics: this.linkMetrics.size,
    };
  }
  
  /**
   * Setup console API
   */
  setupConsoleAPI() {
    window.particleSemanticDensityDebug = {
      getStats: () => this.getStats(),
      getLinkMetrics: (link) => this.getLinkMetrics(link),
      enable: () => {
        this.config.enabled = true;
        console.log('✓ Particle Semantic Density enabled');
      },
      disable: () => {
        this.config.enabled = false;
        console.log('✓ Particle Semantic Density disabled');
      },
      setMaxDensity: (val) => {
        this.config.maxDensityMultiplier = val;
        console.log(`✓ Max density set to ${val}x`);
      },
      setMaxCohesion: (val) => {
        this.config.maxClusterCohesion = val;
        console.log(`✓ Max cohesion set to ${val}`);
      },
    };
    
    console.log('[Session 121] Debug API: window.particleSemanticDensityDebug');
  }

  dispose() {
    for (const unsub of this._semanticUnsubscribers) {
      try {
        unsub?.();
      } catch (_) {
        // noop
      }
    }
    this._semanticUnsubscribers.length = 0;
  }

  /**
   * Rebind system references after world switch
   * Updates links, conflictSystem, and cascadeSystem to prevent stale references
   */
  rebind({ links, conflictSystem, cascadeSystem }) {
    if (links !== undefined) {
      this.links = links;
    }
    if (conflictSystem !== undefined) {
      this.conflictSystem = conflictSystem;
    }
    if (cascadeSystem !== undefined) {
      this.cascadeSystem = cascadeSystem;
    }
    // config and semanticBus are not updated during rebind to preserve original state
  }
}

/**
 * Setup adapter for main.js integration
 */
export function setupParticleSemanticDensity(game, options = {}) {
  try {
    const adapter = new ParticleSemanticDensityAdapter_Session121(options);
    game.particleSemanticDensity = adapter;
    adapter.setupConsoleAPI();
    return adapter;
  } catch (err) {
    console.error('[Session 121] Failed to initialize:', err);
    return null;
  }
}
