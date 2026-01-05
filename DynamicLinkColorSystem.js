/**
 * DYNAMIC LINK COLOR SYSTEM v1.0
 * 
 * Real-time synergy-driven link color transitions
 * 
 * FEATURES:
 * - Updates link colors every frame based on current synergy
 * - Smooth color transitions between synergy states
 * - Synergy palette: Cyan (low) → Purple (mid) → Red (high)
 * - Efficient batch processing for network-wide updates
 * - Zero performance impact with caching
 * 
 * INTEGRATION:
 * - Call update() once per frame from main animation loop
 * - Automatically tracks synergy changes and applies colors
 * - Supports both immediate and smooth transitions
 * 
 * COLOR MEANING:
 * - 🔵 Cyan (0.0 synergy): Weak connection, incompatible types
 * - 🟣 Purple (0.5 synergy): Moderate connection, decent pairing
 * - 🔴 Red (1.0 synergy): Excellent connection, perfect synergy
 */

import * as THREE from 'three';
import {
  computeSynergyColor,
  applySynergyColorToLink,
  updateLinkColorTransition,
  applySynergyColorToParticles,
  getSynergyLevel,
  batchUpdateLinkColors
} from './LinkSynergyColorTransition.js';

export class DynamicLinkColorSystem {
  constructor(linkingSystem) {
    this.linkingSystem = linkingSystem;
    
    // Performance tracking
    this.stats = {
      linksProcessed: 0,
      synergyChanges: 0,
      framesProcessed: 0,
      lastUpdateTime: 0
    };
    
    // Configuration
    this.config = {
      enabled: true,
      updateFrequency: 1,        // Update every N frames (1 = every frame)
      transitionDuration: 0.3,   // Smooth transition time in seconds
      useParticleColors: true,   // Color particles with synergy
      batchSize: 50,             // Process links in batches for performance
      cacheExpiry: 1000          // Synergy cache validity in ms
    };
    
    // Synergy cache for change detection
    this.synergyCache = new Map();
    this.lastCacheUpdate = 0;
    
    // Frame counter for frequency control
    this.frameCounter = 0;
    
    console.log('✅ DynamicLinkColorSystem initialized');
  }
  
  /**
   * Main update function - call once per frame
   * @param {number} deltaTime - Time since last frame (seconds)
   */
  update(deltaTime) {
    if (!this.config.enabled || !this.linkingSystem) return;
    
    this.frameCounter++;
    this.stats.framesProcessed++;
    
    // Skip frames based on update frequency
    if (this.frameCounter % this.config.updateFrequency !== 0) {
      return;
    }
    
    const startTime = performance.now();
    
    // Update all link colors based on current synergy
    this.updateAllLinkColors(deltaTime);
    
    this.stats.lastUpdateTime = performance.now() - startTime;
  }
  
  /**
   * Update colors for all links in the system
   * Handles transitions and synergy changes
   */
  updateAllLinkColors(deltaTime) {
    if (!this.linkingSystem || !this.linkingSystem.links) {
      return;
    }
    
    const links = this.linkingSystem.links;
    this.stats.linksProcessed = links.length;
    
    // Process in batches for performance
    for (let i = 0; i < links.length; i += this.config.batchSize) {
      const batch = links.slice(i, i + this.config.batchSize);
      this.processBatch(batch, deltaTime);
    }
  }
  
  /**
   * Process a batch of links
   * @param {Array} batch - Batch of link objects
   * @param {number} deltaTime - Delta time
   */
  processBatch(batch, deltaTime) {
    for (const link of batch) {
      if (!link || !link.active) continue;
      
      // Get current synergy score
      const currentSynergy = this.getSynergyForLink(link);
      
      // Check if synergy has changed
      const cachedSynergy = this.synergyCache.get(link);
      const synergyChanged = !this.compareSynergy(cachedSynergy, currentSynergy);
      
      // Update color transition animation
      updateLinkColorTransition(link, deltaTime);
      
      // Apply new color if synergy changed
      if (synergyChanged) {
        this.updateLinkColor(link, currentSynergy);
        this.synergyCache.set(link, currentSynergy);
        this.stats.synergyChanges++;
      }
    }
  }
  
  /**
   * Get synergy score for a link
   * Prioritizes pre-calculated synergy, falls back to calculation
   */
  getSynergyForLink(link) {
    // Primary: Pre-calculated synergy score
    if (link.synergyScore !== undefined && link.synergyScore !== null) {
      return Math.max(0, Math.min(1, link.synergyScore));
    }
    
    // Fallback: Calculate from node types
    if (link.source && link.target) {
      return this.calculateSynergyFromNodes(link.source, link.target);
    }
    
    // Default: Neutral
    return 0.5;
  }
  
  /**
   * Calculate synergy between two nodes
   * Used as fallback when pre-calculated score unavailable
   */
  calculateSynergyFromNodes(sourceNode, targetNode) {
    if (!sourceNode || !targetNode) return 0.5;
    
    const sourceCategory = sourceNode.userData?.category || 'unknown';
    const targetCategory = targetNode.userData?.category || 'unknown';
    
    // Strong pairings get high synergy
    const strongPairs = [
      ['input', 'process'],
      ['process', 'integration'],
      ['integration', 'storage'],
      ['storage', 'control'],
      ['analytics', 'control']
    ];
    
    const isStrongPair = strongPairs.some(pair => 
      (sourceCategory === pair[0] && targetCategory === pair[1]) ||
      (sourceCategory === pair[1] && targetCategory === pair[0])
    );
    
    return isStrongPair ? 0.8 : 0.5;
  }
  
  /**
   * Compare two synergy values with tolerance
   * Prevents unnecessary updates due to floating-point precision
   */
  compareSynergy(synergy1, synergy2, tolerance = 0.01) {
    if (synergy1 === undefined || synergy2 === undefined) return false;
    return Math.abs(synergy1 - synergy2) < tolerance;
  }
  
  /**
   * Update color for a single link
   */
  updateLinkColor(link, synergy) {
    if (!link) return;
    
    // Use smooth transition if configured
    if (this.config.transitionDuration > 0) {
      const oldSynergy = link.lastSynergyValue ?? link.synergyScore ?? 0.5;
      
      // Only transition if synergy changed significantly
      if (!this.compareSynergy(oldSynergy, synergy, 0.05)) {
        // Start smooth transition
        const transitionDuration = this.config.transitionDuration;
        
        // Set up transition state
        const oldColor = link.synergyColor || computeSynergyColor(oldSynergy);
        const newColor = computeSynergyColor(synergy);
        
        link.colorTransition = {
          startColor: oldColor.clone(),
          targetColor: newColor,
          startSynergy: oldSynergy,
          targetSynergy: synergy,
          elapsed: 0,
          duration: transitionDuration,
          active: true
        };
      }
    } else {
      // Immediate update
      applySynergyColorToLink(link, synergy);
    }
    
    // Update particle colors if enabled
    if (this.config.useParticleColors) {
      applySynergyColorToParticles(link, synergy);
    }
    
    // Store current values
    link.lastSynergyValue = synergy;
  }
  
  /**
   * Force immediate update of all link colors
   * Useful for debugging or forced refresh
   */
  forceFullUpdate() {
    if (!this.linkingSystem || !this.linkingSystem.links) return;
    
    const links = this.linkingSystem.links;
    let updated = 0;
    
    for (const link of links) {
      if (!link || !link.active) continue;
      
      const synergy = this.getSynergyForLink(link);
      applySynergyColorToLink(link, synergy);
      this.synergyCache.set(link, synergy);
      updated++;
    }
    
    console.log(`[DynamicLinkColorSystem] Force updated ${updated} link colors`);
  }
  
  /**
   * Get color for a given synergy value
   * Exposed for external use (UI, debugging)
   */
  getColorForSynergy(synergy) {
    return computeSynergyColor(synergy);
  }
  
  /**
   * Get synergy level description
   * Exposed for UI/debugging
   */
  getSynergyLevelForScore(synergy) {
    return getSynergyLevel(synergy);
  }
  
  /**
   * Clear synergy cache
   * Forces all links to be re-evaluated next update
   */
  clearCache() {
    this.synergyCache.clear();
    this.lastCacheUpdate = 0;
    console.log('[DynamicLinkColorSystem] Cache cleared');
  }
  
  /**
   * Get system statistics
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.synergyCache.size,
      enabled: this.config.enabled,
      averageUpdateTime: this.stats.framesProcessed > 0 
        ? `${this.stats.lastUpdateTime.toFixed(2)}ms`
        : '0ms'
    };
  }
  
  /**
   * Update configuration
   */
  configure(options) {
    Object.assign(this.config, options);
    console.log('[DynamicLinkColorSystem] Configuration updated:', this.config);
  }
  
  /**
   * Enable/disable the system
   */
  setEnabled(enabled) {
    this.config.enabled = enabled;
    console.log(`[DynamicLinkColorSystem] ${enabled ? '✅ Enabled' : '❌ Disabled'}`);
  }
  
  /**
   * Cleanup
   */
  dispose() {
    this.synergyCache.clear();
    this.stats = null;
    console.log('[DynamicLinkColorSystem] Disposed');
  }
}

/**
 * Setup console debugging API
 */
export function setupDynamicLinkColorSystemConsoleAPI(colorSystem) {
  if (!window.debugDynamicLinkColors) {
    window.debugDynamicLinkColors = {};
  }
  
  Object.assign(window.debugDynamicLinkColors, {
    // Get system statistics
    getStats: () => {
      const stats = colorSystem.getStats();
      console.table(stats);
      return stats;
    },
    
    // Force update all link colors
    forceUpdate: () => {
      colorSystem.forceFullUpdate();
      console.log('✅ Forced full color update');
    },
    
    // Get color for synergy value
    getColor: (synergy) => {
      const color = colorSystem.getColorForSynergy(synergy);
      console.log(`Synergy ${synergy.toFixed(2)}: ${color.getHexString()}`);
      return color;
    },
    
    // Get synergy level
    getLevel: (synergy) => {
      const level = colorSystem.getSynergyLevelForScore(synergy);
      console.log(`Synergy ${synergy.toFixed(2)}: ${level}`);
      return level;
    },
    
    // Clear cache
    clearCache: () => {
      colorSystem.clearCache();
    },
    
    // Configure system
    configure: (options) => {
      colorSystem.configure(options);
    },
    
    // Toggle enabled
    setEnabled: (enabled) => {
      colorSystem.setEnabled(enabled);
    },
    
    // Test link color
    testLink: () => {
      const links = colorSystem.linkingSystem?.links || [];
      if (links.length === 0) {
        console.warn('❌ No links available');
        return;
      }
      
      const link = links[0];
      const synergy = colorSystem.getSynergyForLink(link);
      const level = colorSystem.getSynergyLevelForScore(synergy);
      const color = colorSystem.getColorForSynergy(synergy);
      
      console.log('📊 Link Color Test:', {
        linkId: link.id || 'unknown',
        synergy: synergy.toFixed(3),
        level: level,
        color: `#${color.getHexString().toUpperCase()}`,
        sourceNode: link.source?.userData?.nodeId?.substring(0, 8),
        targetNode: link.target?.userData?.nodeId?.substring(0, 8)
      });
    },
    
    // Show all link colors
    showAllLinkColors: () => {
      const links = colorSystem.linkingSystem?.links || [];
      if (links.length === 0) {
        console.warn('❌ No links available');
        return;
      }
      
      const colors = links.map((link, idx) => {
        const synergy = colorSystem.getSynergyForLink(link);
        const color = colorSystem.getColorForSynergy(synergy);
        return {
          linkIndex: idx,
          synergy: synergy.toFixed(3),
          level: colorSystem.getSynergyLevelForScore(synergy),
          color: `#${color.getHexString().toUpperCase()}`
        };
      });
      
      console.table(colors);
    },
    
    // Monitor synergy changes
    monitorSynergy: (durationMs = 5000) => {
      const startStats = colorSystem.getStats();
      console.log(`🔍 Starting 5-second synergy monitor...`);
      
      setTimeout(() => {
        const endStats = colorSystem.getStats();
        const report = {
          'Links Processed': endStats.linksProcessed,
          'Synergy Changes': endStats.synergyChanges,
          'Frames Processed': endStats.framesProcessed - startStats.framesProcessed,
          'Avg Update Time': endStats.lastUpdateTime.toFixed(2) + 'ms'
        };
        console.table(report);
      }, durationMs);
    }
  });
  
  console.log('✅ DynamicLinkColorSystem console API ready: debugDynamicLinkColors.*');
}
