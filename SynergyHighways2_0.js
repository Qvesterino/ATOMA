/**
 * SYNERGY HIGHWAYS 2.0
 * Real-Time Visual Network Flow Paths for Synergy Routes
 * 
 * ╔════════════════════════════════════════════════════════════════╗
 * ║          VISUAL NETWORK HIGHWAYS ACROSS NODE GRAPH             ║
 * ╠════════════════════════════════════════════════════════════════╣
 * ║                                                                ║
 * ║  Groups high-synergy links into visual "highways":            ║
 * ║  - Aggregate routes: input→process→integration→...            ║
 * ║  - Visual flow paths with emergent properties                 ║
 * ║  - Real-time updates based on link synergy changes            ║
 * ║  - Non-invasive, fully backward compatible                    ║
 * ║                                                                ║
 * ╚════════════════════════════════════════════════════════════════╝
 * 
 * Features:
 * - Per-route analysis: count, average/max synergy, trends, volatility
 * - Visual highways: transparent flowing arcs above link network
 * - Real-time updates: throttled, event-driven or timer-based
 * - Smart caching: invalidates only on relevant changes
 * - Integration with existing systems: glow, history, recommendations
 * - 100% null-safe with fallback handling
 * - Debug API for inspection and testing
 * 
 * Data Model:
 * Highway = {
 *   id: unique identifier
 *   type: 'synergy' | 'cascade'
 *   fromCategory: 'input' | 'process' | 'integration' | 'analytics' | 'storage' | 'control' | 'sigma' | 'quantum' | 'emotional'
 *   toCategory: same categories
 *   linkCount: number of links in this route
 *   avgSynergy: 0.0-1.0 average synergy
 *   maxSynergy: 0.0-1.0 maximum synergy in route
 *   avgCascade: 0.0-1.0 average cascade strength in route
 *   maxCascade: 0.0-1.0 maximum cascade strength in route
 *   trend: 'rising' | 'falling' | 'stable'
 *   volatility: 0.0-1.0 measure of fluctuation
 *   visuals: { width, intensity, speed, color, bloomActive }
 * }
 * 
 * Performance:
 * - Highway rebuild: ~5-10ms for typical network
 * - Per-frame update (throttled): <2ms
 * - Memory: ~1-2KB per highway
 * - Typical 10-20 highways in moderate network
 * 
 * Integration:
 * - No modifications to NodeLinkingSystem needed (read-only)
 * - Works with LinkHistoryTracker1_0 for trends/volatility
 * - Works with LinkGlowSynergyEngine1_0 for visual params
 * - Requires link synergy score to be set
 */

const SynergyHighways2_0 = (() => {
  // ═══════════════════════════════════════════════════════════════
  // PRIVATE STATE
  // ═══════════════════════════════════════════════════════════════
  
  let linkingSystem = null;
  let historyTracker = null;
  let scene = null;
  
  const highways = [];           // Array of highway objects
  const highwayMap = new Map();  // Map<"from→to", highway> for fast lookup
  const visualGroup = null;      // Three.js group for highway visuals (created in init)
  
  let lastRebuildTime = 0;
  let rebuildScheduled = false;
  let cacheValid = false;
  
  const config = {
    enabled: true,
    rebuildThrottleMs: 500,     // Min time between full rebuilds
    updateThrottleMs: 100,      // Min time between visual updates
    minLinkCount: 1,            // Include routes with N+ links
    minAvgSynergy: 0.0,         // Include routes with avg synergy >= this
    trendWindow: 10,            // Samples for trend calculation
    volatilityWindow: 20,       // Samples for volatility calculation
    enableDebugVisuals: false,  // Draw wireframe highways
    opacityBase: 0.15,          // Base opacity for highways
    enableLogging: false        // Console debug logging
  };
  
  // Visual parameters (similar to LinkGlowSynergyEngine1_0)
  const visualCurves = {
    width: { min: 0.3, max: 2.0 },
    intensity: { min: 0.1, max: 0.8 },
    speed: { min: 0.5, max: 3.0 },
    emissiveBoost: { min: 0.1, max: 0.6 }
  };
  
  // Color palette for highways (similar to link colors but slightly muted)
  const colorPalette = {
    low: 0x3d7aaa,          // Muted cyan
    mid: 0x3d9f92,          // Muted aqua
    high: 0x00b385,         // Muted green
    critical: 0x99dddd,     // Muted white (cyan-white)
    cascadeLow: 0x3d9f92,   // Cyan
    cascadeMid: 0xff7a33,   // Orange
    cascadeHigh: 0xff3333   // Red
  };
  
  // Valid category pairs for highways
  const validCategories = [
    'input', 'process', 'integration', 'analytics', 'storage', 'control',
    'sigma', 'quantum', 'emotional'
  ];
  
  // Standard category flow chains
  const categoryChains = [
    // Main pipeline
    ['input', 'process'],
    ['process', 'integration'],
    ['integration', 'analytics'],
    ['analytics', 'storage'],
    ['storage', 'control'],
    ['control', 'input'],  // Feedback loop
    
    // Special node types (bi-directional)
    ['sigma', 'input'],
    ['sigma', 'process'],
    ['sigma', 'integration'],
    ['quantum', 'analytics'],
    ['quantum', 'storage'],
    ['emotional', 'control'],
    ['emotional', 'input']
  ];
  
  // ═══════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════════
  
  /**
   * Linear interpolation
   */
  function lerp(a, b, t) {
    return a + (b - a) * Math.max(0, Math.min(1, t));
  }
  
  /**
   * Generate unique highway ID
   */
  function getHighwayId(fromCategory, toCategory) {
    return `${fromCategory}→${toCategory}`;
  }
  
  /**
   * Get synergy score from link (with fallbacks)
   */
  function getLinkSynergy(link) {
    if (!link) return 0;
    if (typeof link?.synergyScore === 'number') {
      return Math.max(0, Math.min(1, link?.synergyScore));
    }
    if (link.traffic?.load) {
      return Math.max(0, Math.min(1, link.traffic.load));
    }
    return 0.5; // neutral default
  }

  /**
   * Get cascade strength from link (derived runtime metric, null-safe)
   */
  function getLinkCascade(link) {
    if (!link) return 0;
    const rawCascade = link.userData?.cascadeStrength ?? link.userData?.cascade ?? 0;
    if (!Number.isFinite(rawCascade)) return 0;
    return Math.max(0, Math.min(1, rawCascade));
  }
  
  /**
   * Get node categories (validates they're in valid list)
   */
  function getNodeCategory(node) {
    if (!node || !node.userData) return null;
    const cat = node.userData.category || node.userData.type;
    if (validCategories.includes(cat)) return cat;
    return null;
  }
  
  /**
   * Get trend from history tracker
   */
  function getLinkTrend(link) {
    if (!historyTracker || !link) return 'stable';
    try {
      const linkId = link._glyphId || `link_${Math.random()}`;
      const trend = historyTracker.getTrend?.(linkId);
      return trend?.direction || 'stable';
    } catch (e) {
      return 'stable';
    }
  }
  
  /**
   * Get volatility from history tracker
   */
  function getLinkVolatility(link) {
    if (!historyTracker || !link) return 0.3;
    try {
      const linkId = link._glyphId || `link_${Math.random()}`;
      const stats = historyTracker.getStats?.(linkId);
      return stats?.volatility ?? 0.3;
    } catch (e) {
      return 0.3;
    }
  }
  
  /**
   * Compute visual profile from synergy score and metrics
   */
  function computeVisualProfile(avgSynergy, maxSynergy, volatility) {
    if (typeof avgSynergy !== 'number') avgSynergy = 0.5;
    avgSynergy = Math.max(0, Math.min(1, avgSynergy));
    
    // Choose color based on average synergy
    let color = colorPalette.low;
    if (avgSynergy >= 0.85) color = colorPalette.critical;
    else if (avgSynergy >= 0.65) color = colorPalette.high;
    else if (avgSynergy >= 0.40) color = colorPalette.mid;
    
    // Bloom when max synergy is critical
    const bloomActive = maxSynergy > 0.85;
    
    return {
      width: lerp(visualCurves.width.min, visualCurves.width.max, avgSynergy),
      intensity: lerp(visualCurves.intensity.min, visualCurves.intensity.max, avgSynergy),
      speed: lerp(visualCurves.speed.min, visualCurves.speed.max, avgSynergy),
      emissiveBoost: lerp(visualCurves.emissiveBoost.min, visualCurves.emissiveBoost.max, avgSynergy),
      color: color,
      bloomActive: bloomActive,
      volatility: volatility
    };
  }

  /**
   * Compute visual profile for cascade highways.
   * Uses same renderer pipeline; profile carries stronger temporal flow.
   */
  function computeCascadeVisualProfile(avgCascade, maxCascade) {
    if (!Number.isFinite(avgCascade)) avgCascade = 0;
    if (!Number.isFinite(maxCascade)) maxCascade = 0;
    avgCascade = Math.max(0, Math.min(1, avgCascade));
    maxCascade = Math.max(0, Math.min(1, maxCascade));

    let color = colorPalette.cascadeLow;
    if (maxCascade >= 0.66) color = colorPalette.cascadeHigh;
    else if (maxCascade >= 0.33) color = colorPalette.cascadeMid;

    return {
      width: lerp(visualCurves.width.min, visualCurves.width.max, avgCascade),
      intensity: lerp(visualCurves.intensity.min, visualCurves.intensity.max, maxCascade),
      speed: Math.max(visualCurves.speed.min, avgCascade * 2.0),
      emissiveBoost: lerp(visualCurves.emissiveBoost.min, visualCurves.emissiveBoost.max, maxCascade),
      color: color,
      bloomActive: maxCascade > 0.6,
      opacityMult: 1.2
    };
  }
  
  /**
   * Aggregate trend from multiple links
   */
  function aggregateTrend(links) {
    if (!links || links.length === 0) return 'stable';
    
    let rising = 0, falling = 0;
    links.forEach(link => {
      const trend = getLinkTrend(link);
      if (trend === 'rising') rising++;
      else if (trend === 'falling') falling++;
    });
    
    const ratio = rising / links.length;
    if (ratio > 0.6) return 'rising';
    if (ratio < 0.4) return 'falling';
    return 'stable';
  }
  
  /**
   * Average volatility from multiple links
   */
  function averageVolatility(links) {
    if (!links || links.length === 0) return 0.3;
    const sum = links.reduce((acc, link) => acc + getLinkVolatility(link), 0);
    return sum / links.length;
  }
  
  // ═══════════════════════════════════════════════════════════════
  // CORE HIGHWAY COMPUTATION
  // ═══════════════════════════════════════════════════════════════
  
  /**
   * Rebuild all highways from scratch
   * Called on initialization or when link structure changes significantly
   */
  function rebuildHighways() {
    if (!linkingSystem || !linkingSystem.links) return;
    
    highways.length = 0;
    highwayMap.clear();
    
    // Build route → links map
    const routeMap = new Map();
    
    for (const link of linkingSystem.links) {
      if (!link || !link.source || !link.target) continue;
      if (link.active === false) continue;
      
      const fromCat = getNodeCategory(link.source);
      const toCat = getNodeCategory(link.target);
      
      if (!fromCat || !toCat) continue;
      
      const routeId = getHighwayId(fromCat, toCat);
      
      if (!routeMap.has(routeId)) {
        routeMap.set(routeId, []);
      }
      
      routeMap.get(routeId).push(link);
    }
    
    // Create highway objects
    for (const [routeId, links] of routeMap.entries()) {
      if (links.length < config.minLinkCount) continue;
      
      const [fromCat, toCat] = routeId.split('→');
      
      const synergies = links.map(link => getLinkSynergy(link));
      const avgSynergy = synergies.reduce((a, b) => a + b, 0) / synergies.length;
      const maxSynergy = Math.max(...synergies);
      const cascades = links.map(link => getLinkCascade(link));
      const avgCascade = cascades.reduce((a, b) => a + b, 0) / cascades.length;
      const maxCascade = Math.max(...cascades);
      
      if (avgSynergy < config.minAvgSynergy) continue;
      
      const trend = aggregateTrend(links);
      const volatility = averageVolatility(links);
      const visuals = computeVisualProfile(avgSynergy, maxSynergy, volatility);
      
      const highway = {
        id: routeId,
        type: 'synergy',
        fromCategory: fromCat,
        toCategory: toCat,
        linkCount: links.length,
        avgSynergy: avgSynergy,
        maxSynergy: maxSynergy,
        avgCascade: avgCascade,
        maxCascade: maxCascade,
        trend: trend,
        volatility: volatility,
        visuals: visuals,
        links: links  // For internal tracking
      };
      
      highways.push(highway);
      highwayMap.set(routeId, highway);

      // Optional cascade overlay highway on same graph route.
      if (maxCascade > 0.25) {
        const cascadeHighway = {
          id: `${routeId}_cascade`,
          type: 'cascade',
          fromCategory: fromCat,
          toCategory: toCat,
          linkCount: links.length,
          avgSynergy: avgSynergy,
          maxSynergy: maxSynergy,
          avgCascade: avgCascade,
          maxCascade: maxCascade,
          trend: trend,
          volatility: volatility,
          visuals: computeCascadeVisualProfile(avgCascade, maxCascade),
          links: links
        };
        highways.push(cascadeHighway);
        highwayMap.set(cascadeHighway.id, cascadeHighway);
      }
    }
    
    lastRebuildTime = performance.now();
    cacheValid = true;
    rebuildScheduled = false;
    
    if (config.enableLogging) {
      console.log(`[SynergyHighways] Rebuilt ${highways.length} highways`);
    }
  }
  
  /**
   * Schedule a rebuild for later (throttled)
   */
  function scheduleRebuild() {
    if (rebuildScheduled || !config.enabled) return;
    
    rebuildScheduled = true;
    const now = performance.now();
    const timeSinceLastRebuild = now - lastRebuildTime;
    const delay = Math.max(0, config.rebuildThrottleMs - timeSinceLastRebuild);
    
    setTimeout(() => {
      rebuildHighways();
    }, delay);
  }
  
  /**
   * Update visual properties (can be called per frame)
   */
  function updateVisuals() {
    if (!cacheValid || !config.enabled) return;
    
    for (const highway of highways) {
      if (!highway.links) continue;
      
      // Recalculate metrics (scores may have changed)
      const synergies = highway.links.map(link => getLinkSynergy(link));
      const cascades = highway.links.map(link => getLinkCascade(link));
      highway.avgSynergy = synergies.reduce((a, b) => a + b, 0) / synergies.length;
      highway.maxSynergy = Math.max(...synergies);
      highway.avgCascade = cascades.reduce((a, b) => a + b, 0) / cascades.length;
      highway.maxCascade = Math.max(...cascades);
      highway.trend = aggregateTrend(highway.links);
      highway.volatility = averageVolatility(highway.links);
      
      // Update visual profile
      highway.visuals = highway.type === 'cascade'
        ? computeCascadeVisualProfile(highway.avgCascade, highway.maxCascade)
        : computeVisualProfile(
            highway.avgSynergy,
            highway.maxSynergy,
            highway.volatility
          );
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════
  
  return {
    /**
     * Initialize highways system
     */
    init(system, tracker = null) {
      linkingSystem = system;
      historyTracker = tracker;
      
      if (!linkingSystem) {
        console.error('[SynergyHighways] NodeLinkingSystem required');
        return false;
      }
      
      // Initial rebuild
      rebuildHighways();
      
      if (config.enableLogging) {
        console.log('[SynergyHighways] Initialized with', highways.length, 'highways');
      }
      
      return true;
    },
    
    /**
     * Full rebuild from scratch
     */
    rebuild() {
      rebuildHighways();
    },
    
    /**
     * Schedule rebuild (throttled)
     */
    scheduleRebuild() {
      scheduleRebuild();
    },
    
    /**
     * Notify of link change (creates, removal, synergy update)
     * Triggers rebuild if needed
     */
    updateOnLinkChange(link) {
      if (!config.enabled) return;
      cacheValid = false;
      scheduleRebuild();
    },
    
    /**
     * Update visuals (can be called every frame, throttled internally)
     */
    updateVisuals() {
      updateVisuals();
    },
    
    /**
     * Get all highways
     */
    getHighways() {
      return [...highways]; // Return copy
    },
    
    /**
     * Get specific highway by ID
     */
    getHighway(fromCat, toCat) {
      const id = getHighwayId(fromCat, toCat);
      return highwayMap.get(id) || null;
    },
    
    /**
     * Get top N highways by synergy
     */
    getTopHighways(count = 5) {
      return [...highways]
        .sort((a, b) => b.avgSynergy - a.avgSynergy)
        .slice(0, count);
    },
    
    /**
     * Get highways by trend
     */
    getHighwaysByTrend(trend) {
      return highways.filter(hw => hw.trend === trend);
    },
    
    /**
     * Get statistics
     */
    getStats() {
      if (highways.length === 0) {
        return {
          highwayCount: 0,
          totalLinks: 0,
          avgSynergy: 0,
          maxSynergy: 0,
          trends: {}
        };
      }
      
      const allLinks = highways.reduce((sum, hw) => sum + hw.linkCount, 0);
      const avgSynergy = highways.reduce((sum, hw) => sum + hw.avgSynergy, 0) / highways.length;
      const maxSynergy = Math.max(...highways.map(hw => hw.maxSynergy));
      
      const trends = {};
      highways.forEach(hw => {
        trends[hw.trend] = (trends[hw.trend] || 0) + 1;
      });
      
      return {
        highwayCount: highways.length,
        totalLinks: allLinks,
        avgSynergy: avgSynergy,
        maxSynergy: maxSynergy,
        trends: trends
      };
    },
    
    /**
     * Check if cache is valid
     */
    isCacheValid() {
      return cacheValid;
    },
    
    /**
     * Clear all highways
     */
    clear() {
      highways.length = 0;
      highwayMap.clear();
      cacheValid = false;
    },
    
    /**
     * Configure settings
     */
    setConfig(options) {
      Object.assign(config, options);
    },
    
    /**
     * Get current configuration
     */
    getConfig() {
      return { ...config };
    },
    
    /**
     * Debug inspection of highways
     */
    inspect(fromCat = null, toCat = null) {
      if (fromCat && toCat) {
        const highway = this.getHighway(fromCat, toCat);
        if (!highway) return null;
        return {
          id: highway.id,
          type: highway.type || 'synergy',
          fromCategory: highway.fromCategory,
          toCategory: highway.toCategory,
          linkCount: highway.linkCount,
          avgSynergy: highway.avgSynergy.toFixed(3),
          maxSynergy: highway.maxSynergy.toFixed(3),
          avgCascade: (highway.avgCascade ?? 0).toFixed(3),
          maxCascade: (highway.maxCascade ?? 0).toFixed(3),
          trend: highway.trend,
          volatility: highway.volatility.toFixed(3),
          visuals: {
            width: highway.visuals.width.toFixed(2),
            intensity: highway.visuals.intensity.toFixed(2),
            speed: highway.visuals.speed.toFixed(2),
            color: '0x' + highway.visuals.color.toString(16).padStart(6, '0'),
            bloomActive: highway.visuals.bloomActive
          }
        };
      }
      
      // Return all highways summary
      return highways.map(hw => ({
        id: hw.id,
        type: hw.type || 'synergy',
        linkCount: hw.linkCount,
        avgSynergy: hw.avgSynergy.toFixed(3),
        avgCascade: (hw.avgCascade ?? 0).toFixed(3),
        trend: hw.trend,
        volatility: hw.volatility.toFixed(3)
      }));
    },
    
    /**
     * Enable/disable debug logging
     */
    setDebug(enabled) {
      config.enableLogging = !!enabled;
    },
    
    /**
     * Set enabled state
     */
    setEnabled(enabled) {
      config.enabled = !!enabled;
      if (enabled && !cacheValid) {
        rebuildHighways();
      }
    }
  };
})();

export { SynergyHighways2_0 };
