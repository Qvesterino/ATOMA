/**
 * AURA MODULATION SYSTEM v1.0 (Session 27)
 * 
 * Receives redirected event intensity and applies sophisticated modulation to auras
 * making them the visual feedback channel for events without diluting cores.
 * 
 * Five Modulation Types:
 * - opacity_pulse: Breathing effect
 * - scale_swell: Expanding effect  
 * - color_tint: Temporary color shift
 * - glow_intensity: Brightness boost
 * - multi: All combined
 */

import * as THREE from 'three';


export class AuraModulationSystem {
  constructor() {
    // Track baseline values (never modified, just decayed back to)
    this.baselineMap = new WeakMap();

    // Active modulations per node (uses Map for iteration compatibility)
    // Note: Not WeakMap because we need .forEach() iteration in update loop
    this.modulations = new Map();

    // VisualLayerEnforcementGate removed in Phase B cleanup
    // this.enforcementGate = enforcementGate;  // Optional enforcement gate
    
    // Event type → modulation type mapping
    this.eventTypeMapping = new Map([
      ['personality', 'multi'],
      ['link', 'scale_swell'],
      ['evolution', 'multi'],
      ['corruption', 'color_tint'],
      ['harmony', 'opacity_pulse'],
    ]);
    
    // Decay rate per modulation (opacity per frame)
    // CRITICAL (Session 30): INCREASED decay to prevent aura persistence
    // Higher decay = faster return to baseline = core visibility restored faster
    this.decayRates = {
      opacity_pulse: 0.12,    // Increased from 0.05: 2.4x faster decay
      scale_swell: 0.08,      // Increased from 0.03: 2.7x faster decay
      color_tint: 0.10,       // Increased from 0.04: 2.5x faster decay
      glow_intensity: 0.14,   // Increased from 0.06: 2.3x faster decay
      multi: 0.10,            // Increased from 0.04: 2.5x faster decay
    };
    
    // Animation curves for each modulation type
    // [AURA VISUAL AUDIT] Further reduced to guarantee core visibility in all conditions
    this.animationCurves = {
      // Opacity pulse: CLAMPED to atmospheric range (12-25% safe zone)
      // max: 0.5 → 0.20 (20% opacity max during pulse)
      opacity_pulse: {
        min: 0.08,      // Reduced from 0.2 (60% reduction): minimal aura baseline
        max: 0.20,      // CRITICAL: Reduced from 0.5 to atmospheric range (85% reduction from original 1.0)
        speed: 3.0,
      },
      // Scale swell: Maintained - already safe at 8% growth
      scale_swell: {
        min: 1.0,
        max: 1.08,      // ✅ Already optimal
        speed: 2.5,
      },
      color_tint: {
        duration: 1.0,
        intensity: 0.5,
      },
      // Glow intensity: Reduced to prevent emissive bloom
      // max: 1.2 → 0.80 (33% reduction)
      glow_intensity: {
        min: 0.5,
        max: 0.80,      // CRITICAL: Reduced from 1.2 to prevent core glow-out (60% from original 2.0)
        speed: 2.0,
      },
    };
  }

  _isBaselineAura(aura) {
    return aura?.userData?.auraLayer === 'AURA_BASELINE';
  }
  
  /**
   * Capture baseline aura state (called once per node)
   */
  captureBaseline(aura) {
    if (!aura) return;
    
    const baseline = {
      opacity: aura.material?.opacity ?? 1.0,
      scale: aura.scale.clone(),
      color: aura.material?.color?.clone() ?? new THREE.Color(0xffffff),
      emissive: aura.material?.emissive?.clone() ?? new THREE.Color(0x000000),
    };
    
    this.baselineMap.set(aura, baseline);
  }
  
  /**
   * Get or create modulation state for aura
   */
  getModulationState(aura) {
    let state = this.modulations.get(aura);
    
    if (!state) {
      state = {
        stack: [], // Array of active modulations
        elapsedTime: 0,
      };
      this.modulations.set(aura, state);
    }
    
    return state;
  }
  
  /**
   * Push a new modulation onto the stack
   */
  pushModulation(aura, modulationType, intensity = 1.0, duration = 1.0) {
    if (!aura || !aura.material) return;
    if (!this._isBaselineAura(aura)) return;
    
    // Ensure baseline is captured
    if (!this.baselineMap.has(aura)) {
      this.captureBaseline(aura);
    }
    
    const state = this.getModulationState(aura);
    
    state.stack.push({
      type: modulationType,
      intensity,
      duration,
      elapsed: 0,
      startTime: performance.now(),
    });
  }
  
  /**
   * Register custom event type → modulation mapping
   */
  registerEventTypeMapping(eventType, modulationType) {
    this.eventTypeMapping.set(eventType, modulationType);
  }
  
  /**
   * Update all active modulations (call in render loop)
   */
  update(deltaTime = 0.016) {
    // SAFETY: Defensive check - modulations must be iterable (Map, not WeakMap)
    if (!this.modulations || typeof this.modulations.forEach !== 'function') {
      console.warn('[AuraModulationSystem] Invalid modulations structure, reinitializing');
      this.modulations = new Map();
      return;
    }
    
    const toRemove = [];
    
    this.modulations.forEach((state, aura) => {
      if (!aura || !aura.material) return;
      if (!this._isBaselineAura(aura)) return;
      
      const baseline = this.baselineMap.get(aura);
      if (!baseline) return;
      
      // Decay elapsed time
      state.elapsedTime += deltaTime;
      
      // Update each active modulation
      for (let i = 0; i < state.stack.length; i++) {
        const mod = state.stack[i];
        mod.elapsed += deltaTime;
        
        // Apply modulation
        this.applyModulation(aura, mod, baseline, deltaTime);
        
        // Remove if expired
        if (mod.elapsed >= mod.duration) {
          state.stack.splice(i, 1);
          i--;
        }
      }
      
      // If no active modulations, decay back to baseline
      if (state.stack.length === 0) {
        this.decayToBaseline(aura, baseline, deltaTime);
      }
      
      // Mark for cleanup if no modulations for a while
      if (state.stack.length === 0 && state.elapsedTime > 2.0) {
        toRemove.push(aura);
      }
    });
    
    // Cleanup
    toRemove.forEach(aura => {
      this.modulations.delete(aura);
    });
  }

  /**
   * Apply individual modulation to aura
   */
  applyModulation(aura, modulation, baseline, deltaTime) {
    const progress = Math.min(modulation.elapsed / modulation.duration, 1.0);
    
    switch (modulation.type) {
      case 'opacity_pulse':
        this.applyOpacityPulse(aura, modulation, baseline, progress);
        break;
      case 'scale_swell':
        this.applyScaleSwell(aura, modulation, baseline, progress);
        break;
      case 'color_tint':
        this.applyColorTint(aura, modulation, baseline, progress);
        break;
      case 'glow_intensity':
        this.applyGlowIntensity(aura, modulation, baseline, progress);
        break;
      case 'multi':
        // Apply all modulations combined (REDUCED for link events)
        // CRITICAL (Session 30): Attenuate multi to prevent aura dominance during linking
        this.applyOpacityPulse(aura, modulation, baseline, progress * 0.5);  // Reduced from 1.0
        this.applyScaleSwell(aura, modulation, baseline, progress * 0.3);    // Reduced from 0.7
        this.applyGlowIntensity(aura, modulation, baseline, progress * 0.4); // Reduced from 1.0
        break;
    }
  }
  
  /**
   * Opacity pulse (breathing effect)
   * Session 97: Check enforcement gate before applying
   */
  applyOpacityPulse(aura, modulation, baseline, progress) {
    const curve = this.animationCurves.opacity_pulse;
    const breathe = Math.sin(progress * Math.PI * curve.speed) * 0.5 + 0.5;
    const targetOpacity = curve.min + (curve.max - curve.min) * breathe * modulation.intensity;

    // VisualLayerEnforcementGate removed in Phase B cleanup — always apply
    aura.material.opacity = baseline.opacity * targetOpacity;
  }
  
  /**
   * Scale swell (expanding effect)
   */
  applyScaleSwell(aura, modulation, baseline, progress) {
    const curve = this.animationCurves.scale_swell;
    const swell = Math.sin(progress * Math.PI * curve.speed) * 0.5 + 0.5;
    const targetScale = curve.min + (curve.max - curve.min) * swell * modulation.intensity;
    
    aura.scale.copy(baseline.scale).multiplyScalar(targetScale);
  }
  
  /**
   * Color tint (temporary color shift)
   */
  applyColorTint(aura, modulation, baseline, progress) {
    // Fade out the tint over time
    const fadeOut = 1.0 - progress;
    
    // Tint color (e.g., white for corruption, green for harmony)
    const tintColor = new THREE.Color(1, 1, 1);
    
    aura.material.color.copy(baseline.color).lerp(tintColor, fadeOut * modulation.intensity);
  }
  
  /**
   * Glow intensity (brightness boost)
   * Session 97: Check enforcement gate before applying
   */
  applyGlowIntensity(aura, modulation, baseline, progress) {
    const curve = this.animationCurves.glow_intensity;
    const glow = Math.sin(progress * Math.PI * curve.speed) * 0.5 + 0.5;
    const targetIntensity = curve.min + (curve.max - curve.min) * glow * modulation.intensity;
    
    // Glow intensity affects emissive brightness - estimate opacity impact
    const estimatedOpacityImpact = targetIntensity * 0.3;

    // VisualLayerEnforcementGate removed in Phase B cleanup — always apply
    if (aura.material.emissive) {
      aura.material.emissive.copy(baseline.emissive).multiplyScalar(targetIntensity);
    }
  }
  
  /**
   * Decay modulation back to baseline
   */
  decayToBaseline(aura, baseline, deltaTime) {
    if (!aura.material) return;
    
    const decayRate = 0.1; // per frame
    
    // Opacity
    aura.material.opacity += (baseline.opacity - aura.material.opacity) * decayRate;
    
    // Scale
    aura.scale.lerp(baseline.scale, decayRate);
    
    // Color
    aura.material.color.lerp(baseline.color, decayRate);
    
    // Emissive
    if (aura.material.emissive) {
      aura.material.emissive.lerp(baseline.emissive, decayRate);
    }
  }
  
  /**
   * Get modulation type for event type
   */
  getModulationTypeForEvent(eventType) {
    return this.eventTypeMapping.get(eventType) || 'multi';
  }
  
  /**
   * Clear all modulations for an aura
   */
  clearModulations(aura) {
    const state = this.modulations.get(aura);
    if (state) {
      state.stack.length = 0;
    }
  }
  
  /**
   * Clear all modulations system-wide
   */
  clearAllModulations() {
    this.modulations = new Map();
  }
}

/**
 * Setup console debugging API
 */
export function setupAuraModulationConsoleAPI(auraModulationSystem) {
  if (!window.debugAuraModulation) {
    window.debugAuraModulation = {};
  }
  
  Object.assign(window.debugAuraModulation, {
    pushModulation: (aura, type, intensity = 1.0, duration = 1.0) => {
      auraModulationSystem.pushModulation(aura, type, intensity, duration);
      console.log(`🎨 Aura modulation pushed: ${type} (intensity: ${intensity}, duration: ${duration}s)`);
    },
    
    registerEventType: (eventType, modulationType) => {
      auraModulationSystem.registerEventTypeMapping(eventType, modulationType);
      console.log(`📝 Registered event mapping: ${eventType} → ${modulationType}`);
    },
    
    getMapping: () => {
      const mapping = {};
      auraModulationSystem.eventTypeMapping.forEach((v, k) => {
        mapping[k] = v;
      });
      console.table(mapping);
      return mapping;
    },
    
    clearAll: () => {
      auraModulationSystem.clearAllModulations();
      console.log('🗑️ All aura modulations cleared');
    },
    
    listActiveModulations: () => {
      const count = auraModulationSystem.modulations.size;
      console.log(`📊 Active aura modulations: ${count}`);
    },
  });
  
  console.log('✅ Aura Modulation System console API ready: debugAuraModulation.*');
}
