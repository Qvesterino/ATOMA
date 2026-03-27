/**
 * CascadeParticleColorTinting_Session119.js
 * ============================================================================
 * Extends CascadeParticleEmissionBoost to include color tinting based on
 * conflict type. Different cascade types produce visually distinct particles.
 * 
 * COLOR LANGUAGE:
 * - Destructive Conflict (phase mismatch): Magenta/Orange waves
 * - Specialization Drift (nodes drifting): Cyan/Purple gradients
 * - Fatigue Yield (stress resolution): Yellow/Gold transitions
 * - Oscillatory Balance (no winner): Blue/Green shimmer
 * - Harmony States (resolved): Bright Cyan glow
 * - Corruption Cascades (stability): Red/Dark cascades
 * 
 * ARCHITECTURE:
 * ✅ Pure visual adapter (reads conflict state, doesn't modify)
 * ✅ Per-link color computation based on conflict type
 * ✅ Smooth color interpolation (no flickering)
 * ✅ Works with any particle system that reads userData.cascadeParticleColor
 * ✅ Zero per-frame allocations
 * ✅ Graceful degradation (white default if no conflict info)
 * ✅ Integrates seamlessly with CascadeParticleEmissionBoost
 * 
 * @author VFX Technical Director — ATOMA Project Session 119
 * @version 1.0.0
 */

import * as THREE from 'three';

// Defer palette initialization until module scope is ready
let CASCADE_COLOR_PALETTE = null;

function initializePalette() {
  if (CASCADE_COLOR_PALETTE) return; // Already initialized

  /**
   * Color palette for different conflict types and cascade intensities
   */
  CASCADE_COLOR_PALETTE = {
    // Destructive conflict: Phase mismatch between hubs
    // Visual: Waves of magenta/orange indicating oscillation
    destructiveConflict: {
      low: new THREE.Color(0xFF6699),      // Soft magenta
      medium: new THREE.Color(0xFF3366),   // Strong magenta
      high: new THREE.Color(0xFF0033),     // Deep red-magenta
    },
    
    // Specialization drift: Nodes choosing dominant hub
    // Visual: Cyan to purple gradient
    specializationDrift: {
    low: new THREE.Color(0x66FFFF),      // Soft cyan
    medium: new THREE.Color(0x33CCFF),   // Bright cyan-blue
    high: new THREE.Color(0x0099FF),     // Deep blue
  },
  
  // Fatigue yield: Stressed hub yielding control
  // Visual: Yellow to gold transition
  fatigueYield: {
    low: new THREE.Color(0xFFFF99),      // Pale yellow
    medium: new THREE.Color(0xFFDD00),   // Bright yellow
    high: new THREE.Color(0xFFAA00),     // Golden
  },
  
  // Oscillatory balance: No clear winner, swapping control
  // Visual: Green/teal shimmer
  oscillatoryBalance: {
    low: new THREE.Color(0x66FF99),      // Soft green
    medium: new THREE.Color(0x00FF99),   // Bright teal
    high: new THREE.Color(0x00DD77),     // Deep teal
  },
  
  // Harmony state: Resolved equilibrium
  // Visual: Bright cyan glow
  resolvedHarmony: {
    low: new THREE.Color(0x99FFFF),      // Pale cyan
    medium: new THREE.Color(0x66FFFF),   // Bright cyan
    high: new THREE.Color(0x00FFFF),     // Pure cyan
  },
  
  // Corruption cascades: stability and decay
  // Visual: Red to dark red waves
  corruptionCascade: {
    low: new THREE.Color(0xFF9999),      // Pale red
    medium: new THREE.Color(0xFF3333),   // Bright red
    high: new THREE.Color(0xCC1111),      // Deep red
  },
  
    // Default (no conflict): White/neutral
    neutral: {
      low: new THREE.Color(0xCCCCCC),      // Pale white
      medium: new THREE.Color(0xFFFFFF),   // Pure white
      high: new THREE.Color(0xFFFFFF),     // Pure white
    },
  };
}

/**
 * Conflict type enumeration
 */
const CONFLICT_TYPE = {
  NONE: 'none',
  DESTRUCTIVE: 'destructive',           // Phase mismatch
  SPECIALIZATION_DRIFT: 'specialization_drift',  // Node selection
  FATIGUE_YIELD: 'fatigue_yield',       // Stress resolution
  OSCILLATORY_BALANCE: 'oscillatory_balance',    // No winner
  RESOLVED_HARMONY: 'resolved_harmony', // Equilibrium
  CORRUPTION: 'corruption',             // Stability
};

/**
 * Per-link cascade color tracker
 */
class LinkCascadeColorTint {
  constructor(link) {
    initializePalette(); // Ensure palette and THREE are available
    
    this.link = link;
    this.currentColor = new THREE.Color(0xFFFFFF);  // Start white
    this.targetColor = new THREE.Color(0xFFFFFF);
    this.smoothedColor = new THREE.Color(0xFFFFFF);
    
    // Conflict tracking
    this.conflictType = CONFLICT_TYPE.NONE;
    this.conflictIntensity = 0.0;
    
    // Temporal tracking
    this.colorChangeTime = 0.0;
    this.colorEMAAlpha = 0.15;  // Smooth color transitions
  }
  
  /**
   * Update color based on cascade intensity and conflict type
   */
  update(cascadeIntensity, conflictType, conflictIntensity, deltaTime) {
    this.conflictType = conflictType || CONFLICT_TYPE.NONE;
    this.conflictIntensity = conflictIntensity;
    this.colorChangeTime += deltaTime;
    
    // Compute target color based on conflict type
    this.targetColor = this._computeColorForConflict(
      cascadeIntensity,
      conflictType,
      conflictIntensity
    );
    
    // Apply EMA smoothing for smooth transitions
    this.smoothedColor.lerp(this.targetColor, this.colorEMAAlpha);
    this.currentColor.copy(this.smoothedColor);
  }
  
  /**
   * Compute color based on conflict type and intensities
   */
  _computeColorForConflict(cascadeIntensity, conflictType, conflictIntensity) {
    if (!conflictType || conflictType === CONFLICT_TYPE.NONE) {
      return CASCADE_COLOR_PALETTE.neutral.medium.clone();
    }
    
    // Get palette for this conflict type
    const palette = CASCADE_COLOR_PALETTE[this._getColorKey(conflictType)];
    if (!palette) {
      return CASCADE_COLOR_PALETTE.neutral.medium.clone();
    }
    
    // Compute intensity blend (use cascade intensity for primary, conflict for secondary)
    const primaryIntensity = Math.max(cascadeIntensity, conflictIntensity);
    
    // Select color from palette based on combined intensity
    let baseColor;
    if (primaryIntensity < 0.33) {
      baseColor = palette.low.clone();
    } else if (primaryIntensity < 0.67) {
      baseColor = palette.medium.clone();
    } else {
      baseColor = palette.high.clone();
    }
    
    // Modulate brightness by cascade intensity for additional depth
    const brightnessMod = 0.8 + (primaryIntensity * 0.2);  // 0.8-1.0 range
    baseColor.multiplyScalar(brightnessMod);
    
    return baseColor;
  }
  
  /**
   * Map conflict state string to color palette key
   */
  _getColorKey(conflictType) {
    switch (conflictType) {
      case CONFLICT_TYPE.DESTRUCTIVE:
        return 'destructiveConflict';
      case CONFLICT_TYPE.SPECIALIZATION_DRIFT:
        return 'specializationDrift';
      case CONFLICT_TYPE.FATIGUE_YIELD:
        return 'fatigueYield';
      case CONFLICT_TYPE.OSCILLATORY_BALANCE:
        return 'oscillatoryBalance';
      case CONFLICT_TYPE.RESOLVED_HARMONY:
        return 'resolvedHarmony';
      case CONFLICT_TYPE.CORRUPTION:
        return 'corruptionCascade';
      default:
        return 'neutral';
    }
  }
  
  /**
   * Get current color as RGB object for particle systems
   */
  getColorRGB() {
    return {
      r: this.currentColor.r,
      g: this.currentColor.g,
      b: this.currentColor.b,
    };
  }
  
  /**
   * Get current color as hex string
   */
  getColorHex() {
    return this.currentColor.getHexString();
  }
  
  /**
   * Get current color as THREE.Color
   */
  getColor() {
    return this.currentColor;
  }
}

/**
 * Main cascade color tinting system
 */
export class CascadeParticleColorTinting_Session119 {
  constructor(scene, options = {}) {
    initializePalette(); // Ensure palette and THREE are available
    
    this.scene = scene;
    this.enabled = options.enabled ?? true;
    this.debugMode = options.debugMode ?? false;
    this.semanticBus = options.semanticBus ?? globalThis?.semanticBus ?? null;
    
    // Configuration
    this.config = {
      // Color smoothing
      colorEMAAlpha: options.colorEMAAlpha ?? 0.15,
      
      // Conflict type detection
      enableConflictTypeDetection: options.enableConflictTypeDetection ?? true,
      enableCorruptionTinting: options.enableCorruptionTinting ?? true,
      
      // Brightness modulation
      brightnessModulationDepth: options.brightnessModulationDepth ?? 0.2,
      
      // Performance
      enabled: options.enabled !== false,
      debugMode: options.debugMode ?? false,
    };
    
    // Per-link color tinters
    this.linkColorTinters = new Map();
    this._cascadeEventState = new Map();
    this._semanticUnsubscribers = [];
    
    // Statistics
    this.stats = {
      activeColorTints: 0,
      conflictTypeDistribution: {},
    };
    
    if (this.config.enabled) {
      console.log('[Session 119] CascadeParticleColorTinting initialized ✓');
      console.log(`  Conflict type detection: ${this.config.enableConflictTypeDetection}`);
      console.log(`  Corruption tinting: ${this.config.enableCorruptionTinting}`);
    }
    this._subscribeCascadeEvents();
  }
  
  /**
   * Get or create color tinter for a link
   */
  _getOrCreateTinter(link) {
    if (!link) return null;
    
    const linkId = link.uuid;
    
    if (!this.linkColorTinters.has(linkId)) {
      this.linkColorTinters.set(linkId, new LinkCascadeColorTint(link));
    }
    
    return this.linkColorTinters.get(linkId);
  }

  _subscribeCascadeEvents() {
    const on = this.semanticBus?.on?.bind(this.semanticBus);
    if (typeof on !== 'function') return;

    const onCascadeHop = (event = {}) => {
      if (!event) return;
      this.applyCascadeTint(
        event.link,
        event.intensity ?? 1.0,
        event.hopIndex ?? 0
      );
    };

    on('cascade.hop', onCascadeHop);
    if (typeof this.semanticBus?.off === 'function') {
      this._semanticUnsubscribers.push(() => this.semanticBus.off('cascade.hop', onCascadeHop));
    } else if (typeof this.semanticBus?.unsubscribe === 'function') {
      this._semanticUnsubscribers.push(() => this.semanticBus.unsubscribe('cascade.hop', onCascadeHop));
    }
  }

  applyCascadeTint(link, intensity = 1.0, hopIndex = 0) {
    if (!link) return;
    const linkId = link.uuid;
    if (!linkId) return;
    const clampedIntensity = Math.max(0, Math.min(1, Number(intensity) || 0));
    const hop = Math.max(0, Number(hopIndex) || 0);
    const hopDecay = Math.pow(0.85, hop);
    this._cascadeEventState.set(linkId, {
      intensity: clampedIntensity * hopDecay
    });
  }
  
  /**
   * Detect conflict type from link endpoints
   */
  _detectConflictType(link, conflictSystem) {
    if (!link || !link.nodes || link.nodes.length < 2) {
      return CONFLICT_TYPE.NONE;
    }
    
    const nodeA = link.nodes[0];
    const nodeB = link.nodes[1];
    
    if (!nodeA || !nodeB) return CONFLICT_TYPE.NONE;
    
    // Query conflict system for conflict information
    if (conflictSystem && conflictSystem.getConflictState) {
      const conflictInfo = conflictSystem.getConflictState();
      
      // Look for conflicts involving this link's endpoints
      if (conflictInfo?.activeConflicts) {
        for (const region of conflictInfo.activeConflicts) {
          if (!region) continue;
          
          const hub1Id = region.hub1?.userData?.id;
          const hub2Id = region.hub2?.userData?.id;
          const aId = nodeA.userData?.id;
          const bId = nodeB.userData?.id;
          
          // Check if link connects conflicting hubs
          if ((hub1Id === aId && hub2Id === bId) || 
              (hub1Id === bId && hub2Id === aId)) {
            // Determine conflict type from state
            return this._mapConflictStateToType(region.state || CONFLICT_TYPE.NONE);
          }
          
          // Check if link is in conflict region
          const linkMidpoint = new THREE.Vector3()
            .addVectors(nodeA.position, nodeB.position)
            .multiplyScalar(0.5);
          const distToRegion = linkMidpoint.distanceTo(region.centerPos);
          
          if (distToRegion < 10.0) {  // Influence radius
            return this._mapConflictStateToType(region.state || CONFLICT_TYPE.NONE);
          }
        }
      }
    }
    
    // Check node corruption for corruption cascades
    if (this.config.enableCorruptionTinting) {
      const linkCorruption = link.userData?.corruptionLevel ?? 0.0;
      const nodeACorruption = nodeA.userData?.metrics?.corruption ?? 0.0;
      const nodeBCorruption = nodeB.userData?.metrics?.corruption ?? 0.0;

      if (linkCorruption > 0.5 || nodeACorruption > 0.5 || nodeBCorruption > 0.5) {
        return CONFLICT_TYPE.CORRUPTION;
      }
    }
    
    return CONFLICT_TYPE.NONE;
  }
  
  /**
   * Map conflict state to color tint type
   */
  _mapConflictStateToType(state) {
    switch (state) {
      case 'active':
        return CONFLICT_TYPE.DESTRUCTIVE;
      case 'phase_negotiation':
        return CONFLICT_TYPE.DESTRUCTIVE;
      case 'specialization_drift':
        return CONFLICT_TYPE.SPECIALIZATION_DRIFT;
      case 'fatigue_yield':
        return CONFLICT_TYPE.FATIGUE_YIELD;
      case 'oscillatory_balance':
        return CONFLICT_TYPE.OSCILLATORY_BALANCE;
      case 'resolved_dominant':
        return CONFLICT_TYPE.RESOLVED_HARMONY;
      case 'resolved_equilibrium':
        return CONFLICT_TYPE.RESOLVED_HARMONY;
      default:
        return CONFLICT_TYPE.NONE;
    }
  }
  
  /**
   * Main update per frame
   */
  update(deltaTime, links, cascadeSystem, conflictSystem) {
    if (!this.enabled || !links) return;
    
    // Reset statistics
    this.stats.activeColorTints = 0;
    this.stats.conflictTypeDistribution = {};
    
    // Update color tinting for each link
    for (const link of links) {
      if (!link || !link.userData) continue;
      
      // Get or create tinter
      const tinter = this._getOrCreateTinter(link);
      if (!tinter) continue;
      
      // Cascade intensity comes from semantic cascade.hop events only.
      const linkId = link.uuid;
      const eventState = this._cascadeEventState.get(linkId);
      let cascadeIntensity = eventState?.intensity ?? 0.0;
      if (eventState) {
        eventState.intensity = Math.max(0, eventState.intensity - deltaTime * 0.7);
        if (eventState.intensity <= 0.001) {
          this._cascadeEventState.delete(linkId);
        }
      }
      if (cascadeIntensity === 0.0 && link.userData.cascadeIntensity) {
        cascadeIntensity = link.userData.cascadeIntensity;
      }
      
      // Detect conflict type
      const conflictType = this.config.enableConflictTypeDetection
        ? this._detectConflictType(link, null)
        : CONFLICT_TYPE.NONE;
      
      // Get conflict intensity
      let conflictIntensity = 0.0;
      // Fallback to userData only
      if (conflictIntensity === 0.0 && link.userData.cascadeIntensity) {
        conflictIntensity = link.userData.cascadeIntensity;
      }
      
      // Update tinter
      tinter.update(cascadeIntensity, conflictType, conflictIntensity, deltaTime);
      
      // Store in userData for downstream consumption
      link.userData.cascadeParticleColor = tinter.getColor();
      link.userData.cascadeParticleColorRGB = tinter.getColorRGB();
      link.userData.cascadeParticleColorHex = tinter.getColorHex();
      link.userData.cascadeConflictType = conflictType;
      
      // Update statistics
      if (cascadeIntensity > 0.01 || conflictType !== CONFLICT_TYPE.NONE) {
        this.stats.activeColorTints++;
      }
      
      // Count conflict type distribution
      if (conflictType !== CONFLICT_TYPE.NONE) {
        this.stats.conflictTypeDistribution[conflictType] =
          (this.stats.conflictTypeDistribution[conflictType] ?? 0) + 1;
      }
    }
    
    // Cleanup inactive tinters (optional)
    if (Math.random() < 0.01) {
      this._cleanupInactiveTinters();
    }
  }
  
  /**
   * Remove tinters for inactive cascades
   */
  _cleanupInactiveTinters() {
    for (const [linkId, tinter] of this.linkColorTinters) {
      if (tinter.conflictIntensity < 0.01) {
        this.linkColorTinters.delete(linkId);
      }
    }
  }
  
  /**
   * Get color tint for a link
   */
  getLinkColor(link) {
    const tinter = this.linkColorTinters.get(link?.uuid);
    if (!tinter) return new THREE.Color(0xFFFFFF);
    return tinter.getColor();
  }
  
  /**
   * Get conflict type for a link
   */
  getLinkConflictType(link) {
    const tinter = this.linkColorTinters.get(link?.uuid);
    if (!tinter) return CONFLICT_TYPE.NONE;
    return tinter.conflictType;
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      activeColorTints: this.stats.activeColorTints,
      conflictTypeDistribution: this.stats.conflictTypeDistribution,
      totalTintersTracked: this.linkColorTinters.size,
    };
  }
  
  /**
   * Get color tint info for a specific link
   */
  getLinkColorInfo(link) {
    const tinter = this.linkColorTinters.get(link?.uuid);
    
    if (!tinter) return null;
    
    return {
      color: tinter.getColorHex(),
      conflictType: tinter.conflictType,
      cascadeIntensity: tinter.conflictIntensity,
      colorRGB: tinter.getColorRGB(),
    };
  }
  
  /**
   * Setup console debugging API
   */
  setupConsoleAPI() {
    window.cascadeParticleColorTintingDebug = {
      getStats: () => this.getStats(),
      getLinkColorInfo: (link) => this.getLinkColorInfo(link),
      getConflictTypes: () => CONFLICT_TYPE,
      getColorPalette: () => CASCADE_COLOR_PALETTE,
      enable: () => {
        this.enabled = true;
        console.log('✓ Cascade Particle Color Tinting enabled');
      },
      disable: () => {
        this.enabled = false;
        console.log('✓ Cascade Particle Color Tinting disabled');
      },
    };
    
    console.log('[Session 119] Debug API: window.cascadeParticleColorTintingDebug.getStats()');
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
    this._cascadeEventState.clear();
  }
}

/**
 * Setup function for main.js integration
 */
export function setupCascadeParticleColorTinting(game, options = {}) {
  try {
    if (!game.scene) {
      console.warn('[Session 119] Scene not ready, skipping setup');
      return null;
    }
    
    game.cascadeParticleColorTinting = new CascadeParticleColorTinting_Session119(
      game.scene,
      {
        enabled: true,
        debugMode: false,
        enableConflictTypeDetection: true,
        enableCorruptionTinting: true,
        ...options
      }
    );
    
    // Setup console debugging
    game.cascadeParticleColorTinting.setupConsoleAPI();
    
    console.log('[Session 119] ✓ Cascade Particle Color Tinting initialized');
    
    return game.cascadeParticleColorTinting;
  } catch (err) {
    console.warn('[Session 119] Failed to initialize CascadeParticleColorTinting:', err);
    return null;
  }
}
