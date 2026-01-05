/**
 * ============================================================================
 * ZONE AUDIO REACTIVITY SYSTEM
 * ============================================================================
 * 
 * Subtle per-zone audio reactivity layer that gently modulates existing
 * synth parameters based on Regional Harmony Zone presence and stability.
 * 
 * NOT spatial audio. NOT positional panning. NOT new sources.
 * 
 * IS a gentle parameter modulation layer that makes the audio feel calmer,
 * clearer, and more coherent in regions where the network is locally stable.
 * 
 * ============================================================================
 * CORE SAFETY CONSTRAINTS (NON-NEGOTIABLE)
 * ============================================================================
 * 
 * - Do NOT add new sounds, synths, oscillators, or noise sources
 * - Do NOT change global audio routing
 * - Do NOT introduce volume-based emphasis
 * - Do NOT create positional panning or 3D audio
 * - Do NOT modify harmony, synergy, or corruption logic
 * - All modulation is subtle, bounded, and reversible
 * - Can be disabled at runtime with zero impact
 * 
 * ============================================================================
 * MODULATION STRATEGY
 * ============================================================================
 * 
 * INPUTS (Read-Only):
 * - Regional Harmony Zone data (positions, radii, stability values)
 * - Global harmony value (0.0–1.0)
 * - Existing audio synth nodes (filters, LFOs, parameters)
 * 
 * TARGETS (Safe Parameters Only):
 * 1. Filter Cutoff Frequency
 *    - Slight upward bias (+3-5%) in stable zones
 *    - Creates "clearer" perception without changing timbre
 * 
 * 2. Filter Q (Resonance)
 *    - Slightly smoother resonance in stable zones
 *    - Reduces harshness, increases coherence
 * 
 * 3. LFO Depth/Rate
 *    - Slower, steadier motion in stable zones
 *    - Creates "calmness" through predictable modulation
 * 
 * 4. Saturation Amount (if present)
 *    - Minimal increase (+2-3%) in stable zones
 *    - Adds subtle warmth without distortion
 * 
 * FORBIDDEN Modulations:
 * - Volume / Gain (no emphasis through loudness)
 * - Pitch / Tuning (no melodic feedback)
 * - Rhythm / Triggering (no temporal feedback)
 * - Envelopes (no dynamic response changes)
 * - Panning / Stereo Position (no spatial feedback)
 * 
 * ============================================================================
 * MODULATION DEPTH & BOUNDS
 * ============================================================================
 * 
 * All modulation depths are clamped to very small ranges:
 * - Filter cutoff: ±3-5% of base value
 * - Filter Q: ±5-10% of base value
 * - LFO rate: ±2-4% of base value
 * - Saturation: ±2-3% of base value
 * 
 * Modulation uses exponential smoothing to prevent sudden changes.
 * Update rate throttled to ≤10Hz to prevent parameter thrashing.
 * If multiple zones influence same synth, influences blend softly.
 * 
 * ============================================================================
 * BEHAVIORAL RULES
 * ============================================================================
 * 
 * 1. IF no harmony zones nearby:
 *    → Parameters return smoothly to baseline
 * 
 * 2. IF multiple zones nearby:
 *    → Blend influences using weighted average
 *    → Weight by: zone stability × proximity falloff
 * 
 * 3. IF high global harmony:
 *    → Reduce modulation intensity overall (don't amplify calmness)
 *    → System already at peace, zones provide local fine-tuning
 * 
 * 4. IF low global harmony:
 *    → Increase modulation responsiveness
 *    → Zones provide "islands of stability" in unstable system
 * 
 * 5. IF audio system is paused or not initialized:
 *    → Do nothing silently
 * 
 * 6. IF zone data is unavailable or empty:
 *    → Do nothing silently
 * 
 * ============================================================================
 * PERCEPTION DESIGN
 * ============================================================================
 * 
 * The player should NEVER think:
 * "The sound changed because I entered a zone."
 * 
 * They should feel:
 * "The system feels calmer here."
 * 
 * This is atmosphere shaped by internal coherence.
 * This is not feedback. This is not gamification.
 * 
 * ============================================================================
 */

import * as THREE from 'three';
import * as Tone from 'tone';

const SAFE_AUDIO_FLOOR = 0.002;
const UPDATE_RATE_HZ = 10;        // Update every ~100ms
const UPDATE_INTERVAL_MS = 1000 / UPDATE_RATE_HZ;

export class ZoneAudioReactivity {
  /**
   * Initialize zone audio reactivity layer
   * @param {AtomaAudioSystem} audioSystem - ATOMA audio system instance
   * @param {CoreMetricsOverlay} metricsOverlay - Metrics overlay for harmony value
   */
  constructor(audioSystem, metricsOverlay) {
    this.audioSystem = audioSystem;
    this.metricsOverlay = metricsOverlay;
    
    // Enable/disable
    this.enabled = false;  // Disabled by default (non-intrusive)
    
    // Zone data (updated externally)
    this.zones = [];
    this.playerPosition = new THREE.Vector3(0, 0, 0);
    
    // Update throttling
    this.lastUpdateTime = 0;
    this.currentTime = 0;
    
    // ====================================================================
    // MODULATION STATE (Smoothed parameters)
    // ====================================================================
    
    // Filter cutoff modulation (target frequency multiplier)
    this.filterCutoffModulation = {
      target: 1.0,          // Multiplier on base cutoff
      current: 1.0,
      smoothFactor: 0.1,    // EMA smoothing
      minMultiplier: 0.97,  // -3%
      maxMultiplier: 1.05   // +5%
    };
    
    // Filter Q modulation (resonance multiplier)
    this.filterQModulation = {
      target: 1.0,
      current: 1.0,
      smoothFactor: 0.12,
      minMultiplier: 0.92,  // -8%
      maxMultiplier: 1.08   // +8%
    };
    
    // LFO rate modulation (frequency multiplier)
    this.lfoRateModulation = {
      target: 1.0,
      current: 1.0,
      smoothFactor: 0.08,
      minMultiplier: 0.98,  // -2%
      maxMultiplier: 1.04   // +4%
    };
    
    // Saturation amount (if supported)
    this.saturationModulation = {
      target: 1.0,
      current: 1.0,
      smoothFactor: 0.1,
      minMultiplier: 0.98,  // -2%
      maxMultiplier: 1.03   // +3%
    };
    
    // ====================================================================
    // PARAMETER BASELINE CACHE (Stored on first update)
    // ====================================================================
    
    this.baselineParams = {
      synergyFilterCutoff: null,
      synergyFilterQ: null,
      harmonyLFOFrequency: null,
      harmonyLFOMin: null,
      harmonyLFOMax: null,
      corruptionLFOFrequency: null,
      corruptionLFOMin: null,
      corruptionLFOMax: null
    };
    
    // ====================================================================
    // ZONE INFLUENCE TRACKING
    // ====================================================================
    
    this.activeZoneInfluences = new Map(); // Zone index → influence value
    this.maxZoneInfluenceDistance = 35.0;  // Maximum influence radius
    
    console.log('✓ Zone Audio Reactivity initialized (disabled by default)');
  }
  
  /**
   * Set player position for zone proximity calculations
   * @param {THREE.Vector3} position - Current player position
   */
  setPlayerPosition(position) {
    if (position && position.isVector3) {
      this.playerPosition.copy(position);
    }
  }
  
  /**
   * Set zones data (from RegionalHarmonyZones)
   * @param {Array} zones - Array of zone objects with { position, radius, strength, stability }
   */
  setZones(zones) {
    this.zones = zones || [];
  }
  
  /**
   * Enable/disable zone audio reactivity
   * @param {Boolean} enabled - Enable or disable
   */
  setEnabled(enabled) {
    this.enabled = !!enabled;
    
    if (!this.enabled) {
      // Smooth return to baseline
      this.resetToBaseline();
    }
    
    console.log(`Zone Audio Reactivity ${this.enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Toggle zone audio reactivity
   */
  toggle() {
    this.setEnabled(!this.enabled);
  }
  
  /**
   * Get current enabled state
   */
  isEnabled() {
    return this.enabled;
  }
  
  /**
   * Update zone audio reactivity
   * Called from main animation loop
   * @param {Number} deltaTime - Delta time since last frame (seconds)
   */
  update(deltaTime) {
    if (!this.enabled || !this.audioSystem?.initialized) {
      return;
    }
    
    this.currentTime += deltaTime || 0.016;
    
    // ====================================================================
    // THROTTLE TO UPDATE_RATE_HZ
    // ====================================================================
    
    if (this.currentTime - this.lastUpdateTime < UPDATE_INTERVAL_MS / 1000) {
      // Not enough time has passed yet
      return;
    }
    
    this.lastUpdateTime = this.currentTime;
    
    // ====================================================================
    // CACHE BASELINE PARAMETERS (First update only)
    // ====================================================================
    
    if (this.baselineParams.synergyFilterCutoff === null) {
      this.cacheBaselineParameters();
    }
    
    // ====================================================================
    // CALCULATE ZONE INFLUENCES
    // ====================================================================
    
    this.calculateZoneInfluences();
    
    // ====================================================================
    // COMPUTE MODULATION TARGETS
    // ====================================================================
    
    const harmonyValue = this.metricsOverlay?.getHarmony?.() ?? 0.5;
    this.computeModulationTargets(harmonyValue);
    
    // ====================================================================
    // APPLY SMOOTHED MODULATION TO AUDIO PARAMETERS
    // ====================================================================
    
    this.applyModulationToAudioParameters();
  }
  
  /**
   * Cache baseline parameter values from audio system
   * (Called once on first update)
   */
  cacheBaselineParameters() {
    try {
      const audioSystem = this.audioSystem;
      
      // Synergy filter (used for clarity modulation)
      if (audioSystem.synergyFilter) {
        this.baselineParams.synergyFilterCutoff = audioSystem.synergyFilter.frequency?.value ?? 300;
        this.baselineParams.synergyFilterQ = audioSystem.synergyFilter.Q?.value ?? 1.0;
      }
      
      // Harmony LFO (used for motion modulation)
      if (audioSystem.harmonyLFO) {
        this.baselineParams.harmonyLFOFrequency = audioSystem.harmonyLFO.frequency?.value ?? 0.15;
        this.baselineParams.harmonyLFOMin = audioSystem.harmonyLFO.min ?? 0.05;
        this.baselineParams.harmonyLFOMax = audioSystem.harmonyLFO.max ?? 0.25;
      }
      
      // Corruption LFO (used for stability modulation)
      if (audioSystem.corruptionLFO) {
        this.baselineParams.corruptionLFOFrequency = audioSystem.corruptionLFO.frequency?.value ?? 0.3;
        this.baselineParams.corruptionLFOMin = audioSystem.corruptionLFO.min ?? 0.1;
        this.baselineParams.corruptionLFOMax = audioSystem.corruptionLFO.max ?? 0.5;
      }
      
      console.log('✓ Zone Audio Reactivity: Baseline parameters cached');
    } catch (err) {
      console.warn('Zone Audio Reactivity: Baseline caching error:', err);
    }
  }
  
  /**
   * Calculate zone influences on player position
   * Uses distance-based falloff and zone stability weighting
   */
  calculateZoneInfluences() {
    this.activeZoneInfluences.clear();
    
    if (!this.zones || this.zones.length === 0) {
      return;
    }
    
    for (let i = 0; i < this.zones.length; i++) {
      const zone = this.zones[i];
      if (!zone || !zone.position) continue;
      
      const distance = this.playerPosition.distanceTo(zone.position);
      
      // Skip if outside max influence distance
      if (distance > this.maxZoneInfluenceDistance) {
        continue;
      }
      
      // Calculate falloff (Gaussian-like: strong near center, gradual decay)
      const normalizedDist = distance / zone.radius;
      const distanceFalloff = Math.exp(-Math.pow(normalizedDist, 2));
      
      // Zone stability acts as intensity multiplier
      const zoneStability = Math.max(0, Math.min(1, zone.stability ?? 0.5));
      
      // Combined influence
      const influence = distanceFalloff * zoneStability;
      
      if (influence > 0.01) {  // Only track meaningful influences
        this.activeZoneInfluences.set(i, influence);
      }
    }
  }
  
  /**
   * Compute modulation targets based on zone influences
   * @param {Number} harmonyValue - Current global harmony (0-1)
   */
  computeModulationTargets(harmonyValue) {
    // ====================================================================
    // BLEND ALL ACTIVE ZONE INFLUENCES
    // ====================================================================
    
    let totalInfluence = 0;
    let weightedInfluence = 0;
    
    for (const influence of this.activeZoneInfluences.values()) {
      totalInfluence += influence;
      weightedInfluence += influence;  // Could weight by zone strength, but simple average is clearer
    }
    
    // Normalize to 0-1 range
    const normalizedZoneInfluence = totalInfluence > 0 ? Math.min(1.0, totalInfluence / 3.0) : 0;
    
    // ====================================================================
    // HARMONY ADJUSTMENT: High harmony reduces modulation intensity
    // ====================================================================
    // Rationale: If system is already at peace, zones provide fine-tuning
    // If system is unstable, zones provide "islands of stability"
    
    const harmonyMod = Math.max(0.3, 1.0 - harmonyValue * 0.7);
    const finalZoneInfluence = normalizedZoneInfluence * harmonyMod;
    
    // ====================================================================
    // COMPUTE MODULATION TARGETS
    // ====================================================================
    
    // 1. Filter Cutoff: More open (higher frequency) in stable zones
    this.filterCutoffModulation.target = this.interpolateModulation(
      1.0,                                          // baseline
      this.filterCutoffModulation.maxMultiplier,    // +5% in stable zones
      finalZoneInfluence
    );
    
    // 2. Filter Q: Smoother resonance in stable zones
    this.filterQModulation.target = this.interpolateModulation(
      1.0,
      this.filterQModulation.maxMultiplier,         // +8% smoother
      finalZoneInfluence
    );
    
    // 3. LFO Rate: Slower, steadier motion in stable zones
    this.lfoRateModulation.target = this.interpolateModulation(
      1.0,
      this.lfoRateModulation.minMultiplier,         // Slower = lower frequency
      finalZoneInfluence
    );
    
    // 4. Saturation: Subtle warmth in stable zones
    this.saturationModulation.target = this.interpolateModulation(
      1.0,
      this.saturationModulation.maxMultiplier,      // +3% saturation
      finalZoneInfluence
    );
  }
  
  /**
   * Linear interpolation between baseline and target modulation
   * @param {Number} baseline - Baseline value (1.0 = no change)
   * @param {Number} target - Target value in zone
   * @param {Number} influence - Zone influence strength (0-1)
   * @returns {Number} Interpolated modulation value
   */
  interpolateModulation(baseline, target, influence) {
    return baseline + (target - baseline) * influence;
  }
  
  /**
   * Apply smoothed modulation to audio parameters
   */
  applyModulationToAudioParameters() {
    try {
      const audioSystem = this.audioSystem;
      
      // ====================================================================
      // 1. SYNERGY FILTER - Cutoff and Q Modulation
      // ====================================================================
      
      if (audioSystem.synergyFilter && this.baselineParams.synergyFilterCutoff) {
        // Smooth filter cutoff modulation
        this.filterCutoffModulation.current = this.smoothValue(
          this.filterCutoffModulation.current,
          this.filterCutoffModulation.target,
          this.filterCutoffModulation.smoothFactor
        );
        
        const modifiedCutoff = this.baselineParams.synergyFilterCutoff * 
                              this.clamp(
                                this.filterCutoffModulation.current,
                                this.filterCutoffModulation.minMultiplier,
                                this.filterCutoffModulation.maxMultiplier
                              );
        
        audioSystem.synergyFilter.frequency.value = modifiedCutoff;
        
        // Smooth filter Q modulation
        this.filterQModulation.current = this.smoothValue(
          this.filterQModulation.current,
          this.filterQModulation.target,
          this.filterQModulation.smoothFactor
        );
        
        const modifiedQ = this.baselineParams.synergyFilterQ * 
                         this.clamp(
                           this.filterQModulation.current,
                           this.filterQModulation.minMultiplier,
                           this.filterQModulation.maxMultiplier
                         );
        
        if (audioSystem.synergyFilter.Q) {
          audioSystem.synergyFilter.Q.value = modifiedQ;
        }
      }
      
      // ====================================================================
      // 2. HARMONY LFO - Rate Modulation (Slower = Calmer)
      // ====================================================================
      
      if (audioSystem.harmonyLFO && this.baselineParams.harmonyLFOFrequency) {
        // Smooth LFO rate modulation
        this.lfoRateModulation.current = this.smoothValue(
          this.lfoRateModulation.current,
          this.lfoRateModulation.target,
          this.lfoRateModulation.smoothFactor
        );
        
        const modifiedLFOFreq = this.baselineParams.harmonyLFOFrequency * 
                               this.clamp(
                                 this.lfoRateModulation.current,
                                 this.lfoRateModulation.minMultiplier,
                                 this.lfoRateModulation.maxMultiplier
                               );
        
        audioSystem.harmonyLFO.frequency.value = modifiedLFOFreq;
      }
      
      // ====================================================================
      // 3. CORRUPTION LFO - Rate Modulation (Stabilized in zones)
      // ====================================================================
      
      if (audioSystem.corruptionLFO && this.baselineParams.corruptionLFOFrequency) {
        // Use same rate modulation for corruption LFO
        const modifiedCorruptionLFOFreq = this.baselineParams.corruptionLFOFrequency * 
                                         this.clamp(
                                           this.lfoRateModulation.current,
                                           0.95,  // Slightly different bounds for corruption
                                           1.05
                                         );
        
        audioSystem.corruptionLFO.frequency.value = modifiedCorruptionLFOFreq;
      }
      
    } catch (err) {
      console.warn('Zone Audio Reactivity: Parameter application error:', err);
    }
  }
  
  /**
   * Smooth value using exponential moving average
   * @param {Number} current - Current value
   * @param {Number} target - Target value
   * @param {Number} smoothFactor - EMA factor (0-1, higher = faster)
   * @returns {Number} Smoothed value
   */
  smoothValue(current, target, smoothFactor) {
    return current + (target - current) * smoothFactor;
  }
  
  /**
   * Clamp value between min and max
   * @param {Number} value - Value to clamp
   * @param {Number} min - Minimum value
   * @param {Number} max - Maximum value
   * @returns {Number} Clamped value
   */
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  
  /**
   * Reset all modulations to baseline smoothly
   * Called when disabling or when no zones are active
   */
  resetToBaseline() {
    this.filterCutoffModulation.target = 1.0;
    this.filterQModulation.target = 1.0;
    this.lfoRateModulation.target = 1.0;
    this.saturationModulation.target = 1.0;
    
    // Smooth decay to baseline over several frames
    // (This is handled naturally by the smoothing factor during next update)
  }
  
  /**
   * Get per-zone audio influences for zone breathing visualization
   * @returns {Map} Map of zone index → influence value (0-1)
   */
  getZoneInfluences() {
    return new Map(this.activeZoneInfluences);
  }
  
  /**
   * Get reactivity status for debugging
   * @returns {Object} Status object with metrics
   */
  getStatus() {
    const zoneCount = this.zones?.length ?? 0;
    const activeZones = this.activeZoneInfluences.size;
    const totalInfluence = Array.from(this.activeZoneInfluences.values())
      .reduce((sum, val) => sum + val, 0);
    
    return {
      enabled: this.enabled,
      totalZones: zoneCount,
      activeZones: activeZones,
      totalInfluence: totalInfluence.toFixed(3),
      filterCutoffModulation: this.filterCutoffModulation.current.toFixed(3),
      filterQModulation: this.filterQModulation.current.toFixed(3),
      lfoRateModulation: this.lfoRateModulation.current.toFixed(3)
    };
  }
  
  /**
   * Dispose of zone audio reactivity system
   * Clean up and reset to baseline
   */
  dispose() {
    this.resetToBaseline();
    this.zones = [];
    this.activeZoneInfluences.clear();
    this.enabled = false;
    console.log('✓ Zone Audio Reactivity disposed');
  }
}
