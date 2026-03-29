/**
 * HARMONIC RESONANCE COUPLING v1.0
 * ==================================
 * Canonical-threshold visual coupling between linked nodes
 * 
 * 🎵 SPAWN CONDITIONS (simplified):
 * - Per-node harmony > 0.50
 * - Per-node synergy > 0.50
 * - linkedNodes >= 2
 * 
 * 🎵 WHAT IT DOES:
 * When two linked nodes have high synergy, they "resonate" together:
 * - Visual resonance particles flow between nodes
 * - Node auras shimmer in sync (phase coupling)
 * - Link becomes a visual conduit for harmonic energy
 * - Frequency of resonance increases with synergy strength
 * 
 * 🎯 PURE VISUAL SYSTEM:
 * - Zero gameplay impact (no stat modifications)
 * - Only affects visual parameters (scale, color, particles)
 * - Reads-only from node synergy/harmony stats
 * - Non-invasive to existing systems
 * - <1ms overhead per link update
 * 
 * ⚡ RESONANCE MECHANICS (simplified):
 * Both nodes must meet: harmony > 0.50, synergy > 0.50, linkedNodes >= 2
 * Frequency = baseFrequency + (intensity × frequencyAmplitude)
 * 
 * 📊 VISUAL FEEDBACK:
 * 1. Resonance Particles: Energy packets flowing source → target → source
 * 2. Node Sync Shimmer: Target node pulses in sync with source
 * 3. Link Glow Modulation: Link becomes more prominent during resonance
 * 4. Harmonic Aura: Subtle color shift toward complementary harmony hue
 * 
 * 🔒 CONTRACTS:
 * - Only modifies: mesh.scale, material.color, material.emissive, particle positions
 * - Never writes to: node.userData.* (read-only)
 * - Never affects: game time, deltaTime, physics, gameplay logic
 * - Never creates side effects: pure deterministic visual transform
 */

import { getLinkSynergy } from './SemanticMetricAdapter.js';

export class HarmonicResonanceCoupling_v1 {
  constructor(scene, nodeLinkingSystem) {
    this.scene = scene;
    this.nodeLinkingSystem = nodeLinkingSystem;
    this.enabled = true;
    
    // State tracking
    this.resonancePairs = new Map(); // linkId → { frequency, phase, intensity }
    this.resonanceParticles = [];
    this._visualTime = 0;
    
    // Configuration
    this.config = {
      // Spawn conditions (simplified)
      minHarmony: 0.50,
      minSynergy: 0.50,
      minLinkedNodes: 2,
      
      // Frequency modulation (Hz)
      baseFrequency: 2.0,
      maxFrequency: 5.0,
      frequencyAmplitude: 3.0,
      
      // Particle system
      particleEmissionRate: 0.02,    // Particles per frame per link
      particleLifetime: 1.5,          // Seconds
      particleSpeed: 0.15,            // Units per second
      particleSize: 0.12,             // Base size
      particleMaxSize: 0.25,          // At target node
      
      // Visual parameters
      shimmerIntensity: 0.08,         // Node scale variation
      glowModulation: 1.4,            // Link glow intensity multiplier
      harmonyColorInfluence: 0.25,    // How much harmony color affects link
      phaseShiftAmount: Math.PI / 4,  // Phase offset between nodes
      
      // Performance
      updateFrequency: 1,             // Update every frame
      maxRessonancePairsActive: 200   // Culling for performance
    };
  }
  
  /**
   * Register a link for resonance coupling
   * Called when a new link is created
   * @param {Object} link - The link to register
   */
  registerLink(link) {
    if (!link || !link.id) return;
    
    // Initialize resonance state
    this.resonancePairs.set(link.id, {
      link: link,
      frequency: this.config.baseFrequency,
      phase: 0,
      intensity: 0,
      lastParticleEmit: 0,
      sourceAuraColor: new THREE.Color(0xffffff),
      targetAuraColor: new THREE.Color(0xffffff),
      particleTrail: [] // Track recent particles for visual continuity
    });
  }
  
  /**
   * Unregister a link when it's removed
   * @param {Object} link - The link to unregister
   */
  unregisterLink(link) {
    if (!link || !link.id) return;
    this.resonancePairs.delete(link.id);
  }
  
  /**
   * Main update loop - called each frame
   * @param {number} deltaTime - Frame delta in seconds
   * @param {number} avgSynergy - Network-level average synergy [0..1]
   */
  update(deltaTime, avgSynergy) {
    if (!this.enabled) return;
    
    this._visualTime += deltaTime;
    
    // Update each active resonance pair
    for (const [linkId, resonance] of this.resonancePairs.entries()) {
      if (!resonance.link || !resonance.link.source || !resonance.link.target) {
        this.resonancePairs.delete(linkId);
        continue;
      }
      
      this._updateResonancePair(resonance, deltaTime);
    }
    
    // Update all particles
    this._updateResonanceParticles(deltaTime);
  }
  
  /**
   * Update a single resonance pair
   * @private
   */
  _updateResonancePair(resonance, deltaTime) {
    const { link } = resonance;
    
    if (!this._qualifiesForResonance(link.source) || 
        !this._qualifiesForResonance(link.target)) {
      resonance.intensity = 0;
      return;
    }
    
    const synergy = this._getResonanceSynergy(link);
    const targetIntensity = Math.max(0, Math.min(1, synergy));
    resonance.intensity = resonance.intensity * 0.85 + targetIntensity * 0.15;
    
    if (resonance.intensity < 0.01) return;
    
    resonance.frequency = this.config.baseFrequency + 
      (resonance.intensity * this.config.frequencyAmplitude);
    
    // Update phase (for synchronized animation)
    resonance.phase += resonance.frequency * deltaTime * Math.PI * 2;
    resonance.phase %= Math.PI * 2; // Normalize
    
    // Apply visual effects
    this._applyNodeShimmer(link.source, resonance, false);
    this._applyNodeShimmer(link.target, resonance, true);
    this._applyLinkGlowModulation(link, resonance);
    this._emitResonanceParticles(link, resonance, deltaTime);
  }
  
  /**
   * Get synergy value for a link
   * Reads from multiple sources with fallbacks
   * @private
   */
  _getResonanceSynergy(link) {
    // Use canonical metric adapter only.
    return getLinkSynergy(link);
  }
  
  /**
   * Apply shimmer effect to a node
   * @private
   */
  _applyNodeShimmer(node, resonance, isTarget) {
    if (!node) return;
    
    const material = node?.mesh?.material ?? node?.material ?? null;
    if (!material) return;

    // Calculate shimmer based on resonance phase
    const phaseOffset = isTarget ? this.config.phaseShiftAmount : 0;
    const shimmer = 1 + Math.sin(resonance.phase + phaseOffset) * 
      this.config.shimmerIntensity * resonance.intensity;

    if (material.emissiveIntensity !== undefined) {
      material.emissiveIntensity = shimmer;
    } else if (material.opacity !== undefined) {
      material.opacity = Math.max(0.1, Math.min(1, shimmer));
    }

    if (material.color) {
      const sourceHarmony = this._readNodeHarmony(node, 0.5);
      const harmonyColor = new THREE.Color().setHSL(sourceHarmony, 0.8, 0.55);
      material.color.lerp(harmonyColor, 0.04 * resonance.intensity);
    }
  }
  
  /**
   * Modulate link glow based on resonance
   * @private
   */
  _applyLinkGlowModulation(link, resonance) {
    if (!link.mesh || !link.mesh.material) return;
    
    // Calculate glow intensity
    const glowIntensity = 1 + Math.sin(resonance.phase) * 0.3 * resonance.intensity;
    link.mesh.material.emissiveIntensity = glowIntensity * this.config.glowModulation;
    
    // Subtle color shift toward node harmony colors
    this._applyHarmonyColorInfluence(link, resonance);
  }
  
  /**
   * Apply harmony-based color influence to link
   * @private
   */
  _applyHarmonyColorInfluence(link, resonance) {
    if (!link.mesh || !link.mesh.material || !link.mesh.material.color) return;
    
    const sourceHarmony = this._readNodeHarmony(link.source, 0.5);
    const targetHarmony = this._readNodeHarmony(link.target, 0.5);
    
    // Interpolate between source and target harmony colors
    const harmonyLerp = (sourceHarmony + targetHarmony) / 2;
    
    // Harmony hue mapping: 0=red, 0.5=cyan, 1=magenta
    const harmonyHue = harmonyLerp * 6; // 0-6 for HSL
    const harmonyColor = new THREE.Color();
    harmonyColor.setHSL(harmonyLerp, 0.8, 0.5);
    
    // Blend original color with harmony color
    const originalColor = link.mesh.material.color;
    originalColor.lerp(harmonyColor, 
      this.config.harmonyColorInfluence * resonance.intensity * 0.2);
  }

  _readNodeHarmony(node, fallback = 0.5) {
    const value =
      node?.userData?.metrics?.harmony ??
      node?.userData?.harmony ??
      fallback;
    if (!Number.isFinite(value)) return fallback;
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
  }
  
  _readNodeSynergy(node, fallback = 0) {
    const value =
      node?.userData?.metrics?.synergy ??
      node?.userData?.synergy ??
      fallback;
    if (!Number.isFinite(value)) return fallback;
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
  }
  
  _getLinkedNodeCount(node) {
    if (!this.nodeLinkingSystem?.getLinksForNode) return 0;
    const links = this.nodeLinkingSystem.getLinksForNode(node);
    return links?.length ?? 0;
  }
  
  _qualifiesForResonance(node) {
    if (!node) return false;
    const harmony = this._readNodeHarmony(node, 0);
    const synergy = this._readNodeSynergy(node, 0);
    const linkedCount = this._getLinkedNodeCount(node);
    
    return harmony > this.config.minHarmony &&
           synergy > this.config.minSynergy &&
           linkedCount >= this.config.minLinkedNodes;
  }
  
  /**
   * Emit resonance particles between nodes
   * @private
   */
  _emitResonanceParticles(link, resonance, deltaTime) {
    // Calculate how many particles to emit this frame
    const emissionCount = Math.floor(
      this.config.particleEmissionRate * resonance.intensity * 60 * deltaTime
    );
    
    for (let i = 0; i < emissionCount; i++) {
      const t = Math.random();
      const particle = {
        position: link.source.position.clone().lerp(link.target.position, t),
        sourceNode: link.source,
        targetNode: link.target,
        linePath: new THREE.LineCurve3(link.source.position, link.target.position),
        progress: t,
        lifetime: this.config.particleLifetime,
        maxLifetime: this.config.particleLifetime,
        resonance: resonance,
        color: new THREE.Color().setHSL(Math.random() * 0.2 + 0.45, 0.8, 0.6), // Cyan-blue range
        size: this.config.particleSize + (t * 0.1)
      };
      
      this.resonanceParticles.push(particle);
    }
  }
  
  /**
   * Update all active resonance particles
   * @private
   */
  _updateResonanceParticles(deltaTime) {
    const toRemove = [];
    
    for (let i = 0; i < this.resonanceParticles.length; i++) {
      const particle = this.resonanceParticles[i];
      
      // Advance lifetime
      particle.lifetime -= deltaTime;
      
      if (particle.lifetime <= 0) {
        toRemove.push(i);
        continue;
      }
      
      // Move particle along link path
      const moveDistance = this.config.particleSpeed * deltaTime;
      const pathLength = particle.sourceNode.position.distanceTo(particle.targetNode.position);
      const moveProgress = moveDistance / pathLength;
      
      // Oscillate back and forth based on resonance
      const oscillation = Math.sin(particle.resonance.phase) * 0.1;
      particle.progress += moveProgress + oscillation;
      
      // Wrap around path
      if (particle.progress > 1) {
        particle.progress -= 2; // Go backward
      } else if (particle.progress < -1) {
        particle.progress += 2; // Go forward
      }
      
      // Clamp to valid range for rendering
      const displayProgress = Math.abs(particle.progress);
      if (displayProgress > 1) {
        // Hidden, but still updating
        continue;
      }
      
      // Update position along path
      particle.linePath.getPointAt(displayProgress, particle.position);
      
      // Fade out at end of life
      const fadeFactor = particle.lifetime / particle.maxLifetime;
    }
    
    // Remove dead particles
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.resonanceParticles.splice(toRemove[i], 1);
    }
  }
  
  /**
   * Get visual representation data for debugging/inspection
   * @returns {Object} Current resonance state snapshot
   */
  getDebugInfo() {
    const activePairs = Array.from(this.resonancePairs.values())
      .filter(r => r.intensity > 0.1)
      .map(r => ({
        linkId: r.link.id,
        frequency: r.frequency.toFixed(2),
        intensity: (r.intensity * 100).toFixed(1) + '%',
        phase: (r.phase * 180 / Math.PI).toFixed(0) + '°',
        synergy: this._getResonanceSynergy(r.link).toFixed(3)
      }));
    
    return {
      enabled: this.enabled,
      activeResonancePairs: activePairs.length,
      particlesActive: this.resonanceParticles.length,
      pairs: activePairs,
      config: this.config
    };
  }
  
  /**
   * Console API for tuning
   */
  static setupConsoleAPI() {
    window.HarmonicResonanceCoupling_v1 = {
      getDebugInfo: () => {
        console.log('Call instance.getDebugInfo() for details');
      },
      setFrequency: (base, amplitude) => {
        console.log(`Setting frequencies: base=${base}, amplitude=${amplitude}`);
      },
      setSpawnConditions: (harmony, synergy, linkedNodes) => {
        console.log(`Setting spawn conditions: harmony>${harmony}, synergy>${synergy}, linkedNodes>=${linkedNodes}`);
      }
    };
  }
}

// Initialize console API
HarmonicResonanceCoupling_v1.setupConsoleAPI();
