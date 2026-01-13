// === THREE SAFE LOADER (v1.1) ===
// The system must NOT crash if THREE is missing (e.g. Rosebud runtime)
// Try to import THREE safely, fallback to window/globalThis, otherwise disable features.

let THREE_SAFE = null;

// Try global THREE first (works in browser + Atoma engine immediately)
THREE_SAFE =
  (typeof window !== 'undefined' && window.THREE) ||
  (typeof globalThis !== 'undefined' && globalThis.THREE) ||
  null;

if (!THREE_SAFE) {
  console.warn('[ArchetypeVisualSystem] THREE not detected – enabling SAFE MODE (no Color, no Material edits).');
}

// Expose as THREE
const THREE = THREE_SAFE;

/**
 * ARCHETYPE VISUAL PROFILES v1.0
 * 
 * Defines visual differentiation profiles for all 49 extreme archetypes.
 * Each profile specifies:
 * - Color shifts (primary, secondary)
 * - Animation parameters (speed, intensity)
 * - Particle behavior (count, velocity, lifetime)
 * - Glow characteristics (intensity, radius)
 * - Shader parameters (distortion, frequency)
 * 
 * Organized by layers: CORE, OUTER, EXTREME, SPECIAL
 */

export class ArchetypeVisualProfiles {
  static getProfileForArchetype(archetypeName) {
    const profiles = this.getAllProfiles();
    return profiles[archetypeName] || this.getDefaultProfile();
  }

  static getDefaultProfile() {
    return {
      colorShift: { hueRotation: 0, saturation: 1.0, luminance: 1.0 },
      animation: { rotationSpeed: 0.3, pulseSpeed: 1.0, floatAmplitude: 0.1 },
      particles: { count: 8, velocity: 1.0, lifetime: 2.0, spread: 1.0 },
      glow: { intensity: 0.3, radius: 1.0, breathingAmount: 0.2 },
      shader: { distortion: 0.0, frequency: 1.0, amplitude: 0.5 }
    };
  }

  static getAllProfiles() {
    return {
      // ══════════════════════════════════════════════════════════════════
      // CORE LAYER (12 archetypes)
      // ══════════════════════════════════════════════════════════════════
      
      'CORE-HARMONIC-RESONANT': {
        colorShift: { hueRotation: 0, saturation: 1.1, luminance: 1.15 },
        animation: { rotationSpeed: 0.5, pulseSpeed: 2.0, floatAmplitude: 0.15 },
        particles: { count: 12, velocity: 1.5, lifetime: 3.0, spread: 1.3 },
        glow: { intensity: 0.5, radius: 1.2, breathingAmount: 0.4 },
        shader: { distortion: 0.1, frequency: 2.0, amplitude: 0.8 },
        traitName: 'Resonant Harmony',
        description: 'Synchronized oscillation with harmonic glow'
      },

      'CORE-QUANTUM-ENTANGLED': {
        colorShift: { hueRotation: 30, saturation: 1.2, luminance: 1.0 },
        animation: { rotationSpeed: 0.8, pulseSpeed: 3.0, floatAmplitude: 0.2 },
        particles: { count: 15, velocity: 2.0, lifetime: 4.0, spread: 1.5 },
        glow: { intensity: 0.7, radius: 1.4, breathingAmount: 0.6 },
        shader: { distortion: 0.3, frequency: 3.0, amplitude: 1.0 },
        traitName: 'Quantum Entanglement',
        description: 'Probabilistic state with superposition effects'
      },

      'CORE-CHAOS-FRACTURED': {
        colorShift: { hueRotation: -30, saturation: 1.3, luminance: 1.2 },
        animation: { rotationSpeed: 1.2, pulseSpeed: 4.0, floatAmplitude: 0.25 },
        particles: { count: 20, velocity: 2.5, lifetime: 2.0, spread: 2.0 },
        glow: { intensity: 0.6, radius: 1.1, breathingAmount: 0.8 },
        shader: { distortion: 0.6, frequency: 4.0, amplitude: 1.5 },
        traitName: 'Chaotic Fracture',
        description: 'Volatile oscillation with turbulent distortion'
      },

      'CORE-STELLAR-ASCENDED': {
        colorShift: { hueRotation: 45, saturation: 1.0, luminance: 1.3 },
        animation: { rotationSpeed: 0.2, pulseSpeed: 0.8, floatAmplitude: 0.08 },
        particles: { count: 10, velocity: 1.0, lifetime: 5.0, spread: 0.8 },
        glow: { intensity: 0.8, radius: 1.5, breathingAmount: 0.3 },
        shader: { distortion: 0.05, frequency: 0.5, amplitude: 0.3 },
        traitName: 'Stellar Ascension',
        description: 'Radiant, stable presence with celestial glow'
      },

      'CORE-PRIME-PERFECT': {
        colorShift: { hueRotation: 0, saturation: 0.9, luminance: 1.4 },
        animation: { rotationSpeed: 0.15, pulseSpeed: 0.5, floatAmplitude: 0.05 },
        particles: { count: 6, velocity: 0.8, lifetime: 6.0, spread: 0.5 },
        glow: { intensity: 0.9, radius: 1.6, breathingAmount: 0.15 },
        shader: { distortion: 0.0, frequency: 0.2, amplitude: 0.1 },
        traitName: 'Prime Perfect',
        description: 'Geometrically perfect, crystalline precision'
      },

      'CORE-VOID-SILENT': {
        colorShift: { hueRotation: 270, saturation: 0.8, luminance: 0.8 },
        animation: { rotationSpeed: 0.05, pulseSpeed: 0.3, floatAmplitude: 0.02 },
        particles: { count: 2, velocity: 0.3, lifetime: 8.0, spread: 0.2 },
        glow: { intensity: 0.2, radius: 0.8, breathingAmount: 0.05 },
        shader: { distortion: 0.0, frequency: 0.0, amplitude: 0.0 },
        traitName: 'Void Silence',
        description: 'Minimal presence, shadow-like stillness'
      },

      'CORE-FLUX-ADAPTIVE': {
        colorShift: { hueRotation: 120, saturation: 1.1, luminance: 1.1 },
        animation: { rotationSpeed: 0.6, pulseSpeed: 2.5, floatAmplitude: 0.18 },
        particles: { count: 14, velocity: 1.8, lifetime: 3.5, spread: 1.4 },
        glow: { intensity: 0.5, radius: 1.3, breathingAmount: 0.5 },
        shader: { distortion: 0.2, frequency: 2.5, amplitude: 0.9 },
        traitName: 'Adaptive Flux',
        description: 'Flowing, shape-shifting energy patterns'
      },

      'CORE-NEXUS-CONVERGENT': {
        colorShift: { hueRotation: 180, saturation: 1.2, luminance: 1.05 },
        animation: { rotationSpeed: 0.4, pulseSpeed: 1.5, floatAmplitude: 0.12 },
        particles: { count: 16, velocity: 1.6, lifetime: 4.0, spread: 1.2 },
        glow: { intensity: 0.6, radius: 1.4, breathingAmount: 0.4 },
        shader: { distortion: 0.15, frequency: 2.0, amplitude: 0.7 },
        traitName: 'Nexus Convergence',
        description: 'Interconnected hub with attracting fields'
      },

      'CORE-ECHO-RECURSIVE': {
        colorShift: { hueRotation: 240, saturation: 1.15, luminance: 1.1 },
        animation: { rotationSpeed: 0.7, pulseSpeed: 3.5, floatAmplitude: 0.2 },
        particles: { count: 18, velocity: 1.7, lifetime: 3.0, spread: 1.6 },
        glow: { intensity: 0.55, radius: 1.2, breathingAmount: 0.6 },
        shader: { distortion: 0.25, frequency: 3.5, amplitude: 1.1 },
        traitName: 'Recursive Echo',
        description: 'Self-referential waves with feedback patterns'
      },

      'CORE-SURGE-DYNAMIC': {
        colorShift: { hueRotation: 30, saturation: 1.15, luminance: 1.2 },
        animation: { rotationSpeed: 0.9, pulseSpeed: 2.8, floatAmplitude: 0.22 },
        particles: { count: 13, velocity: 2.2, lifetime: 2.5, spread: 1.5 },
        glow: { intensity: 0.65, radius: 1.25, breathingAmount: 0.55 },
        shader: { distortion: 0.35, frequency: 2.8, amplitude: 1.2 },
        traitName: 'Dynamic Surge',
        description: 'Pulsing waves with forward momentum'
      },

      'CORE-STATIC-ANCHORED': {
        colorShift: { hueRotation: 180, saturation: 0.95, luminance: 1.0 },
        animation: { rotationSpeed: 0.1, pulseSpeed: 0.6, floatAmplitude: 0.06 },
        particles: { count: 5, velocity: 0.5, lifetime: 5.5, spread: 0.6 },
        glow: { intensity: 0.35, radius: 1.1, breathingAmount: 0.2 },
        shader: { distortion: 0.02, frequency: 0.3, amplitude: 0.15 },
        traitName: 'Static Anchor',
        description: 'Fixed foundation with minimal perturbation'
      },

      'CORE-WHISPER-SUBTLE': {
        colorShift: { hueRotation: 150, saturation: 1.05, luminance: 1.05 },
        animation: { rotationSpeed: 0.25, pulseSpeed: 1.2, floatAmplitude: 0.09 },
        particles: { count: 7, velocity: 0.9, lifetime: 4.5, spread: 0.9 },
        glow: { intensity: 0.3, radius: 1.0, breathingAmount: 0.25 },
        shader: { distortion: 0.08, frequency: 0.8, amplitude: 0.4 },
        traitName: 'Subtle Whisper',
        description: 'Soft presence with gentle modulations'
      },

      // ══════════════════════════════════════════════════════════════════
      // OUTER LAYER (12 archetypes)
      // ══════════════════════════════════════════════════════════════════

      'OUTER-RADIANT-EXPANSIVE': {
        colorShift: { hueRotation: 45, saturation: 1.2, luminance: 1.25 },
        animation: { rotationSpeed: 0.35, pulseSpeed: 1.8, floatAmplitude: 0.14 },
        particles: { count: 14, velocity: 1.4, lifetime: 3.5, spread: 1.3 },
        glow: { intensity: 0.7, radius: 1.4, breathingAmount: 0.45 },
        shader: { distortion: 0.12, frequency: 1.8, amplitude: 0.6 },
        traitName: 'Radiant Expansion',
        description: 'Outward radiating energy with warm glow'
      },

      'OUTER-SPIRAL-TEMPORAL': {
        colorShift: { hueRotation: 270, saturation: 1.15, luminance: 1.15 },
        animation: { rotationSpeed: 1.0, pulseSpeed: 2.2, floatAmplitude: 0.19 },
        particles: { count: 16, velocity: 1.9, lifetime: 3.2, spread: 1.7 },
        glow: { intensity: 0.6, radius: 1.25, breathingAmount: 0.5 },
        shader: { distortion: 0.28, frequency: 2.2, amplitude: 0.95 },
        traitName: 'Spiral Temporal',
        description: 'Helical time-distortion with cascading effects'
      },

      'OUTER-VOID-ABSORBING': {
        colorShift: { hueRotation: 0, saturation: 1.3, luminance: 0.7 },
        animation: { rotationSpeed: 0.8, pulseSpeed: 3.2, floatAmplitude: 0.21 },
        particles: { count: 12, velocity: 2.8, lifetime: 1.8, spread: 2.2 },
        glow: { intensity: 0.4, radius: 0.9, breathingAmount: 0.7 },
        shader: { distortion: 0.5, frequency: 3.8, amplitude: 1.4 },
        traitName: 'Void Absorption',
        description: 'Dark, pulling force with entropy signature'
      },

      'OUTER-CROWN-SOVEREIGN': {
        colorShift: { hueRotation: 60, saturation: 1.0, luminance: 1.35 },
        animation: { rotationSpeed: 0.2, pulseSpeed: 0.7, floatAmplitude: 0.1 },
        particles: { count: 8, velocity: 1.0, lifetime: 5.0, spread: 0.7 },
        glow: { intensity: 0.85, radius: 1.55, breathingAmount: 0.35 },
        shader: { distortion: 0.03, frequency: 0.4, amplitude: 0.2 },
        traitName: 'Sovereign Crown',
        description: 'Majestic presence with commanding radiance'
      },

      'OUTER-LATTICE-PERFECT': {
        colorShift: { hueRotation: 0, saturation: 0.85, luminance: 1.45 },
        animation: { rotationSpeed: 0.12, pulseSpeed: 0.4, floatAmplitude: 0.04 },
        particles: { count: 4, velocity: 0.6, lifetime: 6.5, spread: 0.4 },
        glow: { intensity: 0.95, radius: 1.7, breathingAmount: 0.1 },
        shader: { distortion: 0.0, frequency: 0.1, amplitude: 0.05 },
        traitName: 'Perfect Lattice',
        description: 'Crystalline geometric perfection'
      },

      'OUTER-PULSE-RHYTHMIC': {
        colorShift: { hueRotation: 0, saturation: 1.2, luminance: 1.15 },
        animation: { rotationSpeed: 0.5, pulseSpeed: 3.0, floatAmplitude: 0.17 },
        particles: { count: 11, velocity: 1.5, lifetime: 2.8, spread: 1.2 },
        glow: { intensity: 0.65, radius: 1.3, breathingAmount: 0.65 },
        shader: { distortion: 0.18, frequency: 3.0, amplitude: 1.0 },
        traitName: 'Rhythmic Pulse',
        description: 'Steady beat with harmonic overtones'
      },

      'OUTER-TIDE-FLOWING': {
        colorShift: { hueRotation: 180, saturation: 1.1, luminance: 1.1 },
        animation: { rotationSpeed: 0.4, pulseSpeed: 1.4, floatAmplitude: 0.13 },
        particles: { count: 13, velocity: 1.3, lifetime: 3.8, spread: 1.1 },
        glow: { intensity: 0.5, radius: 1.25, breathingAmount: 0.4 },
        shader: { distortion: 0.14, frequency: 1.6, amplitude: 0.65 },
        traitName: 'Flowing Tide',
        description: 'Smooth waves of flowing energy'
      },

      'OUTER-DEPTH-PROFOUND': {
        colorShift: { hueRotation: 240, saturation: 1.0, luminance: 0.95 },
        animation: { rotationSpeed: 0.15, pulseSpeed: 0.8, floatAmplitude: 0.08 },
        particles: { count: 6, velocity: 0.7, lifetime: 5.0, spread: 0.8 },
        glow: { intensity: 0.4, radius: 1.1, breathingAmount: 0.25 },
        shader: { distortion: 0.06, frequency: 0.6, amplitude: 0.35 },
        traitName: 'Profound Depth',
        description: 'Deep, contemplative presence'
      },

      'OUTER-SPARK-VIVID': {
        colorShift: { hueRotation: 30, saturation: 1.25, luminance: 1.2 },
        animation: { rotationSpeed: 0.85, pulseSpeed: 2.6, floatAmplitude: 0.2 },
        particles: { count: 15, velocity: 2.0, lifetime: 2.5, spread: 1.4 },
        glow: { intensity: 0.7, radius: 1.3, breathingAmount: 0.55 },
        shader: { distortion: 0.32, frequency: 2.6, amplitude: 1.15 },
        traitName: 'Vivid Spark',
        description: 'Bright, active energy bursts'
      },

      'OUTER-SHADOW-VEILED': {
        colorShift: { hueRotation: 270, saturation: 0.9, luminance: 0.85 },
        animation: { rotationSpeed: 0.3, pulseSpeed: 1.0, floatAmplitude: 0.1 },
        particles: { count: 4, velocity: 0.8, lifetime: 4.5, spread: 0.7 },
        glow: { intensity: 0.25, radius: 0.95, breathingAmount: 0.2 },
        shader: { distortion: 0.09, frequency: 0.7, amplitude: 0.42 },
        traitName: 'Veiled Shadow',
        description: 'Mysterious, partially hidden presence'
      },

      'OUTER-STORM-TURBULENT': {
        colorShift: { hueRotation: -30, saturation: 1.25, luminance: 1.1 },
        animation: { rotationSpeed: 1.1, pulseSpeed: 3.8, floatAmplitude: 0.24 },
        particles: { count: 18, velocity: 2.4, lifetime: 2.2, spread: 1.8 },
        glow: { intensity: 0.65, radius: 1.2, breathingAmount: 0.7 },
        shader: { distortion: 0.52, frequency: 3.8, amplitude: 1.35 },
        traitName: 'Turbulent Storm',
        description: 'Violent, chaotic energy discharge'
      },

      'OUTER-LIGHT-ETERNAL': {
        colorShift: { hueRotation: 45, saturation: 0.95, luminance: 1.4 },
        animation: { rotationSpeed: 0.18, pulseSpeed: 0.6, floatAmplitude: 0.07 },
        particles: { count: 9, velocity: 1.1, lifetime: 5.5, spread: 0.8 },
        glow: { intensity: 0.88, radius: 1.6, breathingAmount: 0.2 },
        shader: { distortion: 0.02, frequency: 0.3, amplitude: 0.15 },
        traitName: 'Eternal Light',
        description: 'Timeless radiance with golden aura'
      },

      // ══════════════════════════════════════════════════════════════════
      // EXTREME LAYER (13 archetypes)
      // ══════════════════════════════════════════════════════════════════

      'EXTREME-SINGULARITY-DENSE': {
        colorShift: { hueRotation: 0, saturation: 0.8, luminance: 1.5 },
        animation: { rotationSpeed: 0.08, pulseSpeed: 0.3, floatAmplitude: 0.03 },
        particles: { count: 3, velocity: 0.4, lifetime: 7.0, spread: 0.3 },
        glow: { intensity: 1.0, radius: 1.8, breathingAmount: 0.08 },
        shader: { distortion: 0.0, frequency: 0.1, amplitude: 0.05 },
        traitName: 'Dense Singularity',
        description: 'Infinitely condensed, ultra-luminous point'
      },

      'EXTREME-ENTROPY-CHAOTIC': {
        colorShift: { hueRotation: -45, saturation: 1.4, luminance: 0.65 },
        animation: { rotationSpeed: 1.5, pulseSpeed: 5.0, floatAmplitude: 0.3 },
        particles: { count: 25, velocity: 3.0, lifetime: 1.5, spread: 2.5 },
        glow: { intensity: 0.5, radius: 0.8, breathingAmount: 0.9 },
        shader: { distortion: 0.8, frequency: 5.0, amplitude: 1.8 },
        traitName: 'Chaotic Entropy',
        description: 'Maximum disorder with explosive dynamics'
      },

      'EXTREME-INFINITY-BOUNDLESS': {
        colorShift: { hueRotation: 60, saturation: 0.9, luminance: 1.3 },
        animation: { rotationSpeed: 0.1, pulseSpeed: 0.5, floatAmplitude: 0.05 },
        particles: { count: 5, velocity: 0.7, lifetime: 7.5, spread: 0.5 },
        glow: { intensity: 0.92, radius: 1.75, breathingAmount: 0.15 },
        shader: { distortion: 0.01, frequency: 0.2, amplitude: 0.08 },
        traitName: 'Boundless Infinity',
        description: 'Endless expanse with cosmic scale'
      },

      'EXTREME-NEXUS-INFINITE': {
        colorShift: { hueRotation: 180, saturation: 1.2, luminance: 1.2 },
        animation: { rotationSpeed: 0.5, pulseSpeed: 2.0, floatAmplitude: 0.15 },
        particles: { count: 20, velocity: 1.8, lifetime: 4.0, spread: 1.5 },
        glow: { intensity: 0.7, radius: 1.45, breathingAmount: 0.45 },
        shader: { distortion: 0.2, frequency: 2.0, amplitude: 0.8 },
        traitName: 'Infinite Nexus',
        description: 'Unlimited interconnection points'
      },

      'EXTREME-VOID-ABSOLUTE': {
        colorShift: { hueRotation: 270, saturation: 0.7, luminance: 0.5 },
        animation: { rotationSpeed: 0.02, pulseSpeed: 0.2, floatAmplitude: 0.01 },
        particles: { count: 1, velocity: 0.2, lifetime: 8.0, spread: 0.1 },
        glow: { intensity: 0.1, radius: 0.7, breathingAmount: 0.02 },
        shader: { distortion: 0.0, frequency: 0.0, amplitude: 0.0 },
        traitName: 'Absolute Void',
        description: 'Complete nothingness, null state'
      },

      'EXTREME-APOTHEOSIS-ASCENDED': {
        colorShift: { hueRotation: 45, saturation: 0.85, luminance: 1.45 },
        animation: { rotationSpeed: 0.12, pulseSpeed: 0.55, floatAmplitude: 0.06 },
        particles: { count: 7, velocity: 0.9, lifetime: 6.0, spread: 0.6 },
        glow: { intensity: 0.95, radius: 1.7, breathingAmount: 0.18 },
        shader: { distortion: 0.01, frequency: 0.25, amplitude: 0.12 },
        traitName: 'Ascended Apotheosis',
        description: 'Godlike transcendence and elevation'
      },

      'EXTREME-PARADOX-UNSTABLE': {
        colorShift: { hueRotation: -60, saturation: 1.35, luminance: 1.05 },
        animation: { rotationSpeed: 1.3, pulseSpeed: 4.5, floatAmplitude: 0.27 },
        particles: { count: 22, velocity: 2.7, lifetime: 2.0, spread: 2.3 },
        glow: { intensity: 0.6, radius: 1.15, breathingAmount: 0.75 },
        shader: { distortion: 0.65, frequency: 4.5, amplitude: 1.6 },
        traitName: 'Unstable Paradox',
        description: 'Contradictory states existing simultaneously'
      },

      'EXTREME-ZENITH-PINNACLE': {
        colorShift: { hueRotation: 30, saturation: 0.9, luminance: 1.4 },
        animation: { rotationSpeed: 0.14, pulseSpeed: 0.65, floatAmplitude: 0.08 },
        particles: { count: 8, velocity: 1.0, lifetime: 5.5, spread: 0.7 },
        glow: { intensity: 0.9, radius: 1.65, breathingAmount: 0.22 },
        shader: { distortion: 0.02, frequency: 0.35, amplitude: 0.18 },
        traitName: 'Pinnacle Zenith',
        description: 'Absolute peak and highest achievement'
      },

      'EXTREME-VOID-CONSUMING': {
        colorShift: { hueRotation: 240, saturation: 0.75, luminance: 0.6 },
        animation: { rotationSpeed: 0.6, pulseSpeed: 2.5, floatAmplitude: 0.16 },
        particles: { count: 8, velocity: 2.5, lifetime: 2.5, spread: 2.0 },
        glow: { intensity: 0.3, radius: 0.85, breathingAmount: 0.4 },
        shader: { distortion: 0.45, frequency: 3.0, amplitude: 1.2 },
        traitName: 'Consuming Void',
        description: 'Aggressive, devouring emptiness'
      },

      'EXTREME-HARMONIC-PERFECT': {
        colorShift: { hueRotation: 0, saturation: 0.88, luminance: 1.42 },
        animation: { rotationSpeed: 0.11, pulseSpeed: 0.45, floatAmplitude: 0.05 },
        particles: { count: 5, velocity: 0.65, lifetime: 6.5, spread: 0.45 },
        glow: { intensity: 0.93, radius: 1.72, breathingAmount: 0.12 },
        shader: { distortion: 0.0, frequency: 0.15, amplitude: 0.07 },
        traitName: 'Perfect Harmony',
        description: 'Ultimate balance and resonance'
      },

      'EXTREME-CHAOS-PRIMORDIAL': {
        colorShift: { hueRotation: -45, saturation: 1.4, luminance: 0.7 },
        animation: { rotationSpeed: 1.4, pulseSpeed: 4.8, floatAmplitude: 0.28 },
        particles: { count: 23, velocity: 2.9, lifetime: 1.8, spread: 2.4 },
        glow: { intensity: 0.55, radius: 0.9, breathingAmount: 0.8 },
        shader: { distortion: 0.75, frequency: 4.8, amplitude: 1.7 },
        traitName: 'Primordial Chaos',
        description: 'Ancient, primal disorder and violence'
      },

      'EXTREME-TRANSCENDENT-ETERNAL': {
        colorShift: { hueRotation: 60, saturation: 0.92, luminance: 1.38 },
        animation: { rotationSpeed: 0.09, pulseSpeed: 0.52, floatAmplitude: 0.04 },
        particles: { count: 6, velocity: 0.8, lifetime: 7.0, spread: 0.55 },
        glow: { intensity: 0.91, radius: 1.68, breathingAmount: 0.14 },
        shader: { distortion: 0.005, frequency: 0.22, amplitude: 0.1 },
        traitName: 'Eternal Transcendence',
        description: 'Timeless divine presence'
      },

      'EXTREME-BALANCE-EQUILIBRIUM': {
        colorShift: { hueRotation: 120, saturation: 1.0, luminance: 1.1 },
        animation: { rotationSpeed: 0.3, pulseSpeed: 1.2, floatAmplitude: 0.1 },
        particles: { count: 10, velocity: 1.1, lifetime: 4.5, spread: 1.0 },
        glow: { intensity: 0.5, radius: 1.2, breathingAmount: 0.3 },
        shader: { distortion: 0.1, frequency: 1.0, amplitude: 0.5 },
        traitName: 'Balanced Equilibrium',
        description: 'Perfect equipoise between opposites'
      },

      // ══════════════════════════════════════════════════════════════════
      // SPECIAL LAYER (12 archetypes - Multi-Output Compatible)
      // ══════════════════════════════════════════════════════════════════

      'SPECIAL-SIGMA-DIMENSIONAL': {
        colorShift: { hueRotation: 120, saturation: 1.15, luminance: 1.15 },
        animation: { rotationSpeed: 0.7, pulseSpeed: 2.5, floatAmplitude: 0.18 },
        particles: { count: 14, velocity: 1.6, lifetime: 3.5, spread: 1.3 },
        glow: { intensity: 0.65, radius: 1.35, breathingAmount: 0.5 },
        shader: { distortion: 0.22, frequency: 2.5, amplitude: 0.85 },
        traitName: 'Dimensional Sigma',
        description: 'Sigma node with dimensional gateway effect'
      },

      'SPECIAL-QUANTUM-SUPERPOSED': {
        colorShift: { hueRotation: 270, saturation: 1.2, luminance: 1.1 },
        animation: { rotationSpeed: 0.85, pulseSpeed: 3.2, floatAmplitude: 0.21 },
        particles: { count: 17, velocity: 2.0, lifetime: 3.2, spread: 1.5 },
        glow: { intensity: 0.7, radius: 1.4, breathingAmount: 0.6 },
        shader: { distortion: 0.3, frequency: 3.2, amplitude: 1.05 },
        traitName: 'Superposed Quantum',
        description: 'Quantum node with multiple state visualization'
      },

      'SPECIAL-EMOTIONAL-RESONANT': {
        colorShift: { hueRotation: 330, saturation: 1.25, luminance: 1.15 },
        animation: { rotationSpeed: 0.6, pulseSpeed: 2.2, floatAmplitude: 0.17 },
        particles: { count: 12, velocity: 1.4, lifetime: 3.8, spread: 1.2 },
        glow: { intensity: 0.65, radius: 1.3, breathingAmount: 0.55 },
        shader: { distortion: 0.18, frequency: 2.2, amplitude: 0.75 },
        traitName: 'Resonant Emotional',
        description: 'Emotional node with empathic resonance waves'
      },

      'SPECIAL-MYTHIC-CEREMONIAL': {
        colorShift: { hueRotation: 45, saturation: 1.0, luminance: 1.3 },
        animation: { rotationSpeed: 0.2, pulseSpeed: 0.8, floatAmplitude: 0.09 },
        particles: { count: 9, velocity: 1.0, lifetime: 5.0, spread: 0.8 },
        glow: { intensity: 0.8, radius: 1.5, breathingAmount: 0.35 },
        shader: { distortion: 0.05, frequency: 0.6, amplitude: 0.3 },
        traitName: 'Ceremonial Mythic',
        description: 'Mythic node with ritualistic golden aura'
      },

      'SPECIAL-PRIME-CRYSTALLINE': {
        colorShift: { hueRotation: 0, saturation: 0.92, luminance: 1.42 },
        animation: { rotationSpeed: 0.13, pulseSpeed: 0.45, floatAmplitude: 0.05 },
        particles: { count: 5, velocity: 0.65, lifetime: 6.5, spread: 0.45 },
        glow: { intensity: 0.93, radius: 1.7, breathingAmount: 0.12 },
        shader: { distortion: 0.0, frequency: 0.15, amplitude: 0.07 },
        traitName: 'Crystalline Prime',
        description: 'Prime node with perfect geometric lattice'
      },

      'SPECIAL-ERROR-ANOMALY': {
        colorShift: { hueRotation: -30, saturation: 1.3, luminance: 1.1 },
        animation: { rotationSpeed: 1.1, pulseSpeed: 3.8, floatAmplitude: 0.22 },
        particles: { count: 18, velocity: 2.3, lifetime: 2.3, spread: 1.8 },
        glow: { intensity: 0.6, radius: 1.15, breathingAmount: 0.65 },
        shader: { distortion: 0.48, frequency: 3.8, amplitude: 1.3 },
        traitName: 'Anomalous Error',
        description: 'Error node with corrupted data visualization'
      },

      'SPECIAL-SIGMA-ANOMALY': {
        colorShift: { hueRotation: 100, saturation: 1.2, luminance: 1.1 },
        animation: { rotationSpeed: 0.8, pulseSpeed: 2.8, floatAmplitude: 0.19 },
        particles: { count: 16, velocity: 1.8, lifetime: 3.3, spread: 1.4 },
        glow: { intensity: 0.65, radius: 1.3, breathingAmount: 0.55 },
        shader: { distortion: 0.26, frequency: 2.8, amplitude: 0.95 },
        traitName: 'Anomalous Sigma',
        description: 'Sigma node with dimensional anomaly cascade'
      },

      'SPECIAL-QUANTUM-ENTANGLED': {
        colorShift: { hueRotation: 280, saturation: 1.22, luminance: 1.12 },
        animation: { rotationSpeed: 0.88, pulseSpeed: 3.3, floatAmplitude: 0.22 },
        particles: { count: 18, velocity: 2.1, lifetime: 3.1, spread: 1.6 },
        glow: { intensity: 0.72, radius: 1.42, breathingAmount: 0.62 },
        shader: { distortion: 0.32, frequency: 3.3, amplitude: 1.08 },
        traitName: 'Entangled Quantum',
        description: 'Quantum node with particle entanglement effects'
      },

      'SPECIAL-EMOTIONAL-EMPATHIC': {
        colorShift: { hueRotation: 320, saturation: 1.27, luminance: 1.17 },
        animation: { rotationSpeed: 0.62, pulseSpeed: 2.3, floatAmplitude: 0.18 },
        particles: { count: 13, velocity: 1.5, lifetime: 3.9, spread: 1.3 },
        glow: { intensity: 0.68, radius: 1.32, breathingAmount: 0.58 },
        shader: { distortion: 0.2, frequency: 2.3, amplitude: 0.82 },
        traitName: 'Empathic Emotional',
        description: 'Emotional node with heightened empathy fields'
      },

      'SPECIAL-UNITY-CONVERGENT': {
        colorShift: { hueRotation: 180, saturation: 1.1, luminance: 1.15 },
        animation: { rotationSpeed: 0.4, pulseSpeed: 1.6, floatAmplitude: 0.12 },
        particles: { count: 14, velocity: 1.5, lifetime: 4.0, spread: 1.15 },
        glow: { intensity: 0.6, radius: 1.3, breathingAmount: 0.42 },
        shader: { distortion: 0.16, frequency: 1.8, amplitude: 0.7 },
        traitName: 'Convergent Unity',
        description: 'Integration node with convergence patterns'
      },

      'SPECIAL-APEX-SUPREME': {
        colorShift: { hueRotation: 15, saturation: 1.15, luminance: 1.25 },
        animation: { rotationSpeed: 0.25, pulseSpeed: 1.0, floatAmplitude: 0.11 },
        particles: { count: 10, velocity: 1.2, lifetime: 4.8, spread: 0.9 },
        glow: { intensity: 0.75, radius: 1.4, breathingAmount: 0.4 },
        shader: { distortion: 0.08, frequency: 1.0, amplitude: 0.5 },
        traitName: 'Supreme Apex',
        description: 'Control node with supreme authority signature'
      },

      'SPECIAL-GENESIS-PRIMORDIAL': {
        colorShift: { hueRotation: 30, saturation: 1.1, luminance: 1.2 },
        animation: { rotationSpeed: 0.3, pulseSpeed: 1.3, floatAmplitude: 0.12 },
        particles: { count: 11, velocity: 1.3, lifetime: 4.2, spread: 1.0 },
        glow: { intensity: 0.65, radius: 1.3, breathingAmount: 0.4 },
        shader: { distortion: 0.11, frequency: 1.3, amplitude: 0.6 },
        traitName: 'Primordial Genesis',
        description: 'Input node with creation origin essence'
      }
    };
  }
}
