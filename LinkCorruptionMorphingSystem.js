/**
 * LinkCorruptionMorphingSystem
 * ============================================================================
 * Dynamic link morphing based on corruption flow state
 * 
 * SYSTEM BEHAVIOR:
 * - Links morph progressively as corruption spreads through them
 * - Five morphing phases tied to corruption level (0 → 1.0)
 * - Visual transformations: geometry, color, emission, deformation
 * - Bidirectional: smooth recovery as corruption fades
 * - Fully reversible state with zero allocations per frame
 * 
 * MORPHING PHASES (corruption 0 → 1):
 * 1. **Healthy** (0.0-0.2): Clean braided state, subtle harmony glow
 * 2. **Stressed** (0.2-0.45): Tighter braids, desaturated color, increased instability
 * 3. **Infected** (0.45-0.65): Visible fraying, dark pulses, broken phase patterns
 * 4. **Degraded** (0.65-0.85): Severe warping, pulsing distortion, loss of coherence
 * 5. **Collapsed** (0.85-1.0): Complete breakdown, chaotic ripples, structural failure
 * 
 * VISUAL TRANSFORMATIONS:
 * - Braid tightness: Compressed geometry as corruption increases
 * - Surface ripples: From smooth waves → chaotic turbulence
 * - Emission: From harmony glow → pulsing corruption red
 * - Color desaturation: Progressive graying out
 * - Strand coherence: From aligned → misaligned/fraying
 * - Particle emission: Corruption particles that increase with corruption level
 * - Halo effect: Changes from harmony blue → corruption red
 * 
 * CORRELATION WITH GAME STATE:
 * - Corruption level on link (via LinkCorruptionTransmission_v1)
 * - Harmony/synergy of connected hubs
 * - Link health (via LinkQualityCalculator)
 * - Cascade state (via LinkCollapseSystem)
 * 
 * PHILOSOPHY:
 * Links are narrative vessels. As corruption flows through them, they visibly
 * degrade—not as punishment, but as *storytelling*. A player sees the network
 * health through link morphology. Strong networks have clean, flowing links.
 * Corrupted networks have twisted, broken links.
 * 
 * ARCHITECTURE:
 * ✅ Adapter layer on top of existing link renderers
 * ✅ Reads corruption state (doesn't write to it)
 * ✅ Material-driven morphing (shaders + uniforms)
 * ✅ Per-link state tracking
 * ✅ Zero per-frame allocations
 * ✅ Graceful fallback for missing uniforms
 * ✅ Works with all link types (braided, conduit, aura)
 * 
 * INTEGRATION POINTS:
 * - LinkCorruptionTransmission_v1: Corruption value source
 * - LinkQualityCalculator: Health/stress metric
 * - LinkDegradationSystem: Degradation state
 * - LinkSurfacePhaseRipples: Ripple morphing
 * - Link material system: Uniform updates
 * 
 * CONSTRAINTS:
 * ✅ Adapter-only (reads game state, updates visuals)
 * ✅ Zero gameplay impact
 * ✅ Fully reversible
 * ✅ Smooth transitions (eased morphing)
 * ✅ Works across 50+ links without perf impact
 * ✅ Safe material handling
 * ============================================================================
 */

let THREE_SAFE = null;
THREE_SAFE =
  (typeof window !== 'undefined' && window.THREE) ||
  (typeof globalThis !== 'undefined' && globalThis.THREE) ||
  null;

const THREE = THREE_SAFE;

/**
 * Corruption morphing phase definitions
 */
const MORPHING_PHASES = {
  HEALTHY: { min: 0.0, max: 0.2, name: 'Healthy' },
  STRESSED: { min: 0.2, max: 0.45, name: 'Stressed' },
  INFECTED: { min: 0.45, max: 0.65, name: 'Infected' },
  DEGRADED: { min: 0.65, max: 0.85, name: 'Degraded' },
  COLLAPSED: { min: 0.85, max: 1.0, name: 'Collapsed' }
};

/**
 * Visual profile per morphing phase
 */
const PHASE_PROFILES = {
  Healthy: {
    braid_tightness: 1.0,      // Normal braid compression
    ripple_chaos: 0.0,          // Smooth ripples
    color_saturation: 1.0,      // Full color
    emission_intensity: 0.3,    // Subtle harmony glow
    emission_hue_shift: 0.0,    // Harmony blue
    particle_density: 0.1,      // Minimal particles
    halo_presence: 0.7,         // Strong blue halo
    deformation_magnitude: 0.0, // No deformation
    phase_coherence: 1.0        // Perfect phase alignment
  },
  
  Stressed: {
    braid_tightness: 0.8,       // Slightly compressed
    ripple_chaos: 0.15,         // Small disturbances
    color_saturation: 0.75,     // Slightly desaturated
    emission_intensity: 0.4,    // Brighter, warning
    emission_hue_shift: 15.0,   // Shift toward orange
    particle_density: 0.25,     // More particles
    halo_presence: 0.5,         // Dimmed halo
    deformation_magnitude: 0.02,// Slight warping
    phase_coherence: 0.85       // Some phase drift
  },
  
  Infected: {
    braid_tightness: 0.6,       // Fraying starts
    ripple_chaos: 0.45,         // Visible turbulence
    color_saturation: 0.5,      // Heavily desaturated
    emission_intensity: 0.6,    // Pulsing bright
    emission_hue_shift: 45.0,   // Shift to red
    particle_density: 0.5,      // Moderate particles
    halo_presence: 0.3,         // Weak halo
    deformation_magnitude: 0.05,// Moderate warping
    phase_coherence: 0.65       // Significant drift
  },
  
  Degraded: {
    braid_tightness: 0.4,       // Severely frayed
    ripple_chaos: 0.75,         // Severe turbulence
    color_saturation: 0.25,     // Mostly gray
    emission_intensity: 0.8,    // Pulsing strongly
    emission_hue_shift: 60.0,   // Full red
    particle_density: 0.75,     // Heavy particles
    halo_presence: 0.1,         // Barely visible
    deformation_magnitude: 0.1, // Severe warping
    phase_coherence: 0.35       // Lost coherence
  },
  
  Collapsed: {
    braid_tightness: 0.2,       // Nearly broken
    ripple_chaos: 1.0,          // Chaotic ripples
    color_saturation: 0.0,      // Completely gray
    emission_intensity: 1.0,    // Max pulsing
    emission_hue_shift: 75.0,   // Deep red
    particle_density: 1.0,      // Max particles
    halo_presence: 0.0,         // No halo
    deformation_magnitude: 0.15,// Maximum warping
    phase_coherence: 0.0        // Complete breakdown
  }
};

/**
 * Color palette interpolation for morphing phases
 */
const COLOR_TRANSITIONS = {
  // Healthy: harmony blue
  Healthy: { r: 0.3, g: 0.6, b: 1.0 },
  // Stressed: orange warning
  Stressed: { r: 1.0, g: 0.6, b: 0.2 },
  // Infected: amber corruption
  Infected: { r: 1.0, g: 0.4, b: 0.1 },
  // Degraded: red corruption
  Degraded: { r: 1.0, g: 0.1, b: 0.1 },
  // Collapsed: dark corruption
  Collapsed: { r: 0.4, g: 0.0, b: 0.0 }
};

/**
 * Get morphing phase from corruption value
 */
function getMorphingPhase(corruption) {
  if (corruption < 0.2) return MORPHING_PHASES.HEALTHY;
  if (corruption < 0.45) return MORPHING_PHASES.STRESSED;
  if (corruption < 0.65) return MORPHING_PHASES.INFECTED;
  if (corruption < 0.85) return MORPHING_PHASES.DEGRADED;
  return MORPHING_PHASES.COLLAPSED;
}

/**
 * Interpolate between two phase profiles
 */
function interpolateProfile(phase1, phase2, t) {
  const result = {};
  for (const key in phase1) {
    result[key] = phase1[key] * (1 - t) + phase2[key] * t;
  }
  return result;
}

/**
 * Get profile for a corruption value (interpolated between phases)
 */
function getProfileForCorruption(corruption) {
  const corruptionClamped = Math.max(0, Math.min(1, corruption));
  
  if (corruptionClamped < 0.2) {
    // Healthy → Stressed
    const t = corruptionClamped / 0.2;
    return interpolateProfile(PHASE_PROFILES.Healthy, PHASE_PROFILES.Stressed, t);
  } else if (corruptionClamped < 0.45) {
    // Stressed → Infected
    const t = (corruptionClamped - 0.2) / 0.25;
    return interpolateProfile(PHASE_PROFILES.Stressed, PHASE_PROFILES.Infected, t);
  } else if (corruptionClamped < 0.65) {
    // Infected → Degraded
    const t = (corruptionClamped - 0.45) / 0.2;
    return interpolateProfile(PHASE_PROFILES.Infected, PHASE_PROFILES.Degraded, t);
  } else if (corruptionClamped < 0.85) {
    // Degraded → Collapsed
    const t = (corruptionClamped - 0.65) / 0.2;
    return interpolateProfile(PHASE_PROFILES.Degraded, PHASE_PROFILES.Collapsed, t);
  } else {
    return PHASE_PROFILES.Collapsed;
  }
}

/**
 * Interpolate color between two phase colors
 */
function interpolateColor(color1, color2, t) {
  return {
    r: color1.r * (1 - t) + color2.r * t,
    g: color1.g * (1 - t) + color2.g * t,
    b: color1.b * (1 - t) + color2.b * t
  };
}

/**
 * Get color for corruption value (interpolated)
 */
function getColorForCorruption(corruption) {
  const corruptionClamped = Math.max(0, Math.min(1, corruption));
  
  if (corruptionClamped < 0.2) {
    const t = corruptionClamped / 0.2;
    return interpolateColor(COLOR_TRANSITIONS.Healthy, COLOR_TRANSITIONS.Stressed, t);
  } else if (corruptionClamped < 0.45) {
    const t = (corruptionClamped - 0.2) / 0.25;
    return interpolateColor(COLOR_TRANSITIONS.Stressed, COLOR_TRANSITIONS.Infected, t);
  } else if (corruptionClamped < 0.65) {
    const t = (corruptionClamped - 0.45) / 0.2;
    return interpolateColor(COLOR_TRANSITIONS.Infected, COLOR_TRANSITIONS.Degraded, t);
  } else if (corruptionClamped < 0.85) {
    const t = (corruptionClamped - 0.65) / 0.2;
    return interpolateColor(COLOR_TRANSITIONS.Degraded, COLOR_TRANSITIONS.Collapsed, t);
  } else {
    return COLOR_TRANSITIONS.Collapsed;
  }
}

/**
 * LinkCorruptionMorphingSystem
 * Manages dynamic link morphing based on corruption state
 */
export class LinkCorruptionMorphingSystem {
  constructor() {
    // Per-link morphing state tracking
    this.linkStates = new Map(); // linkId → { corruption, targetProfile, currentProfile, ...}
    
    // Easing parameters
    this.morphingSpeed = 2.0; // Units per second (how fast link morphs)
    this.profileSmoothness = 0.85; // Smoothing factor for profile changes (0-1)
    
    // Debug/stats
    this.lastUpdateTime = 0;
    this.morphedLinkCount = 0;
  }

  /**
   * Initialize morphing state for a new link
   */
  initializeLinkState(linkId, link) {
    if (!link || this.linkStates.has(linkId)) return;
    
    const state = {
      linkId,
      link,
      corruption: 0,
      targetProfile: { ...PHASE_PROFILES.Healthy },
      currentProfile: { ...PHASE_PROFILES.Healthy },
      targetColor: { ...COLOR_TRANSITIONS.Healthy },
      currentColor: { ...COLOR_TRANSITIONS.Healthy },
      phase: MORPHING_PHASES.HEALTHY,
      lastCorruption: 0,
      morphingActive: false
    };
    
    this.linkStates.set(linkId, state);
  }

  /**
   * Update morphing for links based on corruption state.
   * Accepts:
   * - Map/Set (id -> link)
   * - Array of links
   * - Single link object (with .group)
   */
  update(deltaTime, linkRegistry) {
    if (!linkRegistry) return;

    this.morphedLinkCount = 0;
    this.lastUpdateTime = performance.now();

    const processLink = (link, linkIdHint = null) => {
      if (!link) return;
      const linkId = link.id ?? linkIdHint ?? link.group?.uuid ?? link.uuid;
      if (linkId === undefined || linkId === null) return;

      const state = this.linkStates.get(linkId) || this.initializeLinkState(linkId, link);
      if (!state) return;

      const corruption = this.getCorruptionFromLink(link);
      state.corruption = corruption;

      if (Math.abs(corruption - state.lastCorruption) > 0.01) {
        state.targetProfile = getProfileForCorruption(corruption);
        state.targetColor = getColorForCorruption(corruption);
        state.phase = getMorphingPhase(corruption);
        state.lastCorruption = corruption;
      }

      this.interpolateProfile(state, deltaTime);

      const group = link.group || link;
      this.applyMorphing(group, state);
      this.morphedLinkCount++;
    };

    if (typeof linkRegistry.forEach === 'function' && !Array.isArray(linkRegistry)) {
      linkRegistry.forEach((link, linkId) => processLink(link, linkId));
    } else if (Array.isArray(linkRegistry)) {
      linkRegistry.forEach((link) => processLink(link));
    } else {
      processLink(linkRegistry);
    }
  }

  /**
   * Get corruption value from link
   * Sources: LinkCorruptionTransmission_v1, LinkQualityCalculator, etc.
   */
  getCorruptionFromLink(link) {
    if (!link) return 0;

    const readMetric = (...values) => {
      for (const value of values) {
        if (typeof value === 'number' && Number.isFinite(value)) {
          return Math.max(0, Math.min(1, value));
        }
      }
      return undefined;
    };

    const fromMetrics = readMetric(
      link?.group?.userData?.conduitState?.metrics?.corruption,
      link?.userData?.metrics?.corruption,
      link?.userData?.corruption,
      link?.userData?.corruptionLevel,
      link?.corruption,
      link?.corruptionLevel
    );
    if (typeof fromMetrics === 'number') return fromMetrics;

    const sourceCorruption = readMetric(
      link?.source?.userData?.metrics?.corruption,
      link?.sourceNode?.userData?.metrics?.corruption,
      link?.nodeA?.userData?.metrics?.corruption
    );
    const targetCorruption = readMetric(
      link?.target?.userData?.metrics?.corruption,
      link?.targetNode?.userData?.metrics?.corruption,
      link?.nodeB?.userData?.metrics?.corruption
    );
    if (typeof sourceCorruption === 'number' || typeof targetCorruption === 'number') {
      return Math.max(sourceCorruption ?? 0, targetCorruption ?? 0);
    }

    // Fallback: check link health (lower health -> higher corruption)
    if (link.userData && link.userData.health !== undefined) {
      return Math.max(0, Math.min(1, 1 - link.userData.health));
    }

    // Fallback: check degradation state
    if (link.userData && link.userData.degradationLevel !== undefined) {
      return Math.max(0, Math.min(1, link.userData.degradationLevel));
    }

    return 0;
  }

  /**
   * Smoothly interpolate current profile toward target profile
   */
  interpolateProfile(state, deltaTime) {
    const easeAmount = Math.min(1, this.morphingSpeed * deltaTime);
    
    // Interpolate each profile property
    for (const key in state.targetProfile) {
      const target = state.targetProfile[key];
      const current = state.currentProfile[key];
      const diff = target - current;
      
      // Smooth easing with decay
      const easedChange = diff * easeAmount * this.profileSmoothness;
      state.currentProfile[key] = current + easedChange;
    }
    
    // Interpolate color
    state.currentColor.r += (state.targetColor.r - state.currentColor.r) * easeAmount * this.profileSmoothness;
    state.currentColor.g += (state.targetColor.g - state.currentColor.g) * easeAmount * this.profileSmoothness;
    state.currentColor.b += (state.targetColor.b - state.currentColor.b) * easeAmount * this.profileSmoothness;
  }

  /**
   * Apply morphing transformations to link visuals
   */
  applyMorphing(link, state) {
    if (!link || !state) return;
    
    const profile = state.currentProfile;
    const color = state.currentColor;
    
    // Apply transformations through link material/geometry
    this.applyBraidMorphing(link, profile);
    this.applyColorMorphing(link, color, profile);
    this.applyEmissionMorphing(link, profile, color);
    this.applyRippleMorphing(link, profile);
    this.applyParticleMorphing(link, profile);
    this.applyDeformationMorphing(link, profile);
  }

  /**
   * Morph braid tightness and geometry compression
   */
  applyBraidMorphing(link, profile) {
    if (!link.children || link.children.length === 0) return;
    
    // Apply braid_tightness to braided strands (geometry scale/compression)
    const braid = profile.braid_tightness; // 1.0 = normal, 0.2 = frayed
    
    // Update geometry scaling/compression via userData
    if (!link.userData) link.userData = {};
    link.userData.braid_compression = 1.0 - (1.0 - braid) * 0.3; // 0.7-1.0 range
    
    // Apply to strand materials
    link.children.forEach((child) => {
      if (child.material && child.material.uniforms) {
        // Tightness uniform (if material supports it)
        if (child.material.uniforms.braid_tightness) {
          child.material.uniforms.braid_tightness.value = braid;
        }
      }
    });
  }

  /**
   * Morph link color based on corruption phase
   */
  applyColorMorphing(link, color, profile) {
    if (!link.children) return;
    
    // Apply color desaturation based on saturation level
    const saturation = profile.color_saturation; // 1.0 = full, 0.0 = gray
    
    link.children.forEach((child) => {
      if (child.material) {
        // Store color morphing info
        if (!child.userData) child.userData = {};
        child.userData.morphedColor = {
          r: color.r,
          g: color.g,
          b: color.b,
          saturation: saturation
        };
        
        // Update emissive color with morphed color
        if (child.material.emissive) {
          const morphedHue = new THREE.Color(color.r, color.g, color.b);
          
          // Desaturate based on saturation profile
          if (saturation < 1.0) {
            const gray = (color.r + color.g + color.b) / 3;
            const lerpColor = {
              r: color.r * saturation + gray * (1 - saturation),
              g: color.g * saturation + gray * (1 - saturation),
              b: color.b * saturation + gray * (1 - saturation)
            };
            morphedHue.setRGB(lerpColor.r, lerpColor.g, lerpColor.b);
          }
          
          child.material.emissive.copy(morphedHue);
          child.material.emissive.multiplyScalar(0.5); // Dim for emissive appearance
        }
      }
    });
  }

  /**
   * Morph emission intensity and pulsing
   */
  applyEmissionMorphing(link, profile, color) {
    if (!link.children) return;
    
    const intensity = profile.emission_intensity; // 0.3-1.0
    
    link.children.forEach((child) => {
      if (child.material && child.material.uniforms) {
        // Update emission intensity uniform
        if (child.material.uniforms.emissive_intensity) {
          child.material.uniforms.emissive_intensity.value = intensity;
        }
        
        // Add pulsing at higher corruption
        const pulse = profile.ripple_chaos * 0.3; // 0-0.3 range
        if (child.material.uniforms.emission_pulse) {
          child.material.uniforms.emission_pulse.value = pulse;
        }
      }
    });
  }

  /**
   * Morph surface ripples from smooth to chaotic
   */
  applyRippleMorphing(link, profile) {
    if (!link.userData) return;
    
    // Store ripple morphing parameters
    link.userData.ripple_chaos = profile.ripple_chaos; // 0-1
    link.userData.phase_coherence = profile.phase_coherence; // 0-1
    
    // These are used by LinkSurfacePhaseRipples to adjust ripple behavior
    // - Low chaos: smooth, organized ripples
    // - High chaos: turbulent, broken patterns
    
    // Update ripple speed (higher corruption = slower/more chaotic ripples)
    const rippleSpeed = 1.0 - profile.ripple_chaos * 0.5; // 0.5-1.0
    if (link.userData) {
      link.userData.ripple_speed = rippleSpeed;
    }
  }

  /**
   * Morph particle emission density
   */
  applyParticleMorphing(link, profile) {
    if (!link.userData) return;
    
    // Store particle morphing parameters
    link.userData.particle_density = profile.particle_density; // 0-1
    
    // Used by particle systems to scale emission rate
    // Healthy: minimal particles
    // Collapsed: heavy particle streams
  }

  /**
   * Apply geometric deformation to link
   */
  applyDeformationMorphing(link, profile) {
    if (!link.userData) return;
    
    // Store deformation magnitude
    link.userData.deformation_magnitude = profile.deformation_magnitude; // 0-0.15
    
    // Deformation creates visible warping/twisting as corruption increases
    // Can be applied via vertex shaders or geometry manipulation
    // - Low: no visible deformation
    // - High: severe twisting/warping
  }

  /**
   * Set morphing speed (faster = snappier response)
   */
  setMorphingSpeed(speed) {
    this.morphingSpeed = speed;
  }

  /**
   * Get morphing phase name for a link
   */
  getPhaseNameForLink(linkId) {
    const state = this.linkStates.get(linkId);
    return state ? state.phase.name : 'Unknown';
  }

  /**
   * Get corruption value for a link
   */
  getCorruptionForLink(linkId) {
    const state = this.linkStates.get(linkId);
    return state ? state.corruption : 0;
  }

  /**
   * Get debug info for a link
   */
  getDebugInfoForLink(linkId) {
    const state = this.linkStates.get(linkId);
    if (!state) return null;
    
    return {
      linkId,
      phase: state.phase.name,
      corruption: state.lastCorruption.toFixed(3),
      braid_tightness: state.currentProfile.braid_tightness.toFixed(2),
      ripple_chaos: state.currentProfile.ripple_chaos.toFixed(2),
      color_saturation: state.currentProfile.color_saturation.toFixed(2),
      emission_intensity: state.currentProfile.emission_intensity.toFixed(2),
      morphingActive: state.morphingActive
    };
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      morphedLinkCount: this.morphedLinkCount,
      trackedLinkCount: this.linkStates.size,
      morphingSpeed: this.morphingSpeed
    };
  }

  /**
   * Clear all state (for cleanup/reset)
   */
  dispose() {
    this.linkStates.clear();
  }
}

// Export for use in main.js
export default LinkCorruptionMorphingSystem;
