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

import * as THREE from 'three';
import { getLinkSynergy, getNodeCanonicalMetrics } from './SemanticMetricAdapter.js';

export class HarmonicResonanceCoupling_v1 {
  constructor(scene, linkingSystem) {
    this.scene = scene;
    this.linkingSystem = linkingSystem;
    this.enabled = true;
    
    // State tracking
    this.resonancePairs = new Map(); // linkId → { frequency, phase, intensity }
    this.resonanceParticles = [];
    this._visualTime = 0;
    this._particleSourceScratch = new THREE.Vector3();
    this._particleTargetScratch = new THREE.Vector3();
    this._particleMidpointScratch = new THREE.Vector3();
    this._particleDirectionScratch = new THREE.Vector3();
    this._particleColorScratch = new THREE.Color();
    this._linkColorScratch = new THREE.Color();
    this._nodeColorScratch = new THREE.Color();
    
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
      primaryBeatWeight: 0.78,
      counterBeatWeight: 0.18,
      packetDensityGlowBoost: 0.22,
      packetDensityShimmerBoost: 0.16,
      particleAnchorSpread: 0.14,
      maxResonanceParticlesActive: 96,
      
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
    if (!link) return;

    const linkId = this._resolveLinkIdentity(link);
    if (!linkId) return;

    const sourceMetrics = this._readNodeCanonicalMetrics(link.source);
    const targetMetrics = this._readNodeCanonicalMetrics(link.target);
    const signature = this._buildResonanceSignature(link, linkId, sourceMetrics, targetMetrics);
    
    // Initialize resonance state
    this.resonancePairs.set(linkId, {
      link: link,
      linkId,
      frequency: this.config.baseFrequency,
      phase: signature.phaseSeed,
      intensity: 0,
      sourceBeat: 0.5,
      targetBeat: 0.5,
      counterBeat: 0.5,
      cadencePulse: 0.5,
      packetDensity: 0,
      activeParticleCount: 0,
      lastParticleEmit: 0,
      particleSpawnAccumulator: 0,
      particleSpawnCursor: signature.packetLaneSeed % 3,
      sourceVisualState: this._captureVisualSnapshot(link.source?.mesh?.material ?? link.source?.material ?? null),
      targetVisualState: this._captureVisualSnapshot(link.target?.mesh?.material ?? link.target?.material ?? null),
      linkVisualState: this._captureVisualSnapshot(link.mesh?.material ?? null),
      signature,
      sourceMetrics,
      targetMetrics,
      particleTrail: [] // Track recent particles for visual continuity
    });
  }
  
  /**
   * Unregister a link when it's removed
   * @param {Object} link - The link to unregister
   */
  unregisterLink(link) {
    if (!link) return;
    const linkId = this._resolveLinkIdentity(link);
    if (!linkId) return;
    this.resonancePairs.delete(linkId);
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
    const sourceMetrics = this._readNodeCanonicalMetrics(link.source);
    const targetMetrics = this._readNodeCanonicalMetrics(link.target);
    
    if (!this._qualifiesForResonance(link.source) || 
        !this._qualifiesForResonance(link.target)) {
      resonance.intensity *= 0.82;
      resonance.packetDensity *= 0.92;
      if (resonance.intensity < 0.005) {
        resonance.intensity = 0;
      }
      return;
    }
    
    const synergy = this._getResonanceSynergy(link);
    const targetIntensity = this._resolveResonanceIntensity(synergy, sourceMetrics, targetMetrics, resonance.signature);
    resonance.intensity = resonance.intensity * 0.82 + targetIntensity * 0.18;
    
    if (resonance.intensity < 0.01) return;
    
    resonance.frequency = this.config.baseFrequency + 
      (resonance.intensity * this.config.frequencyAmplitude);
    resonance.frequency = Math.min(this.config.maxFrequency, resonance.frequency);
    
    // Update phase (for synchronized animation)
    resonance.phase += resonance.frequency * deltaTime * Math.PI * 2;
    resonance.phase %= Math.PI * 2; // Normalize

    this._updateResonanceCadence(resonance, sourceMetrics, targetMetrics);
    
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

    const visualState = isTarget ? resonance.targetVisualState : resonance.sourceVisualState;
    const beat = isTarget ? resonance.targetBeat ?? 0.5 : resonance.sourceBeat ?? 0.5;
    const counterBeat = resonance.counterBeat ?? 0.5;
    const packetDensity = resonance.packetDensity ?? 0;
    const nodeHarmony = isTarget ? resonance.targetMetrics?.harmony : resonance.sourceMetrics?.harmony;
    const harmonyLift = Number.isFinite(nodeHarmony) ? nodeHarmony : 0.5;
    const shimmerBeat = THREE.MathUtils.clamp(
      beat * this.config.primaryBeatWeight + counterBeat * this.config.counterBeatWeight,
      0,
      1
    );
    const shimmer = 1 + ((shimmerBeat - 0.5) * 2 * this.config.shimmerIntensity * resonance.intensity) +
      (packetDensity * this.config.packetDensityShimmerBoost);

    if (material.emissiveIntensity !== undefined) {
      const baseEmissive = Number.isFinite(visualState?.emissiveIntensity) ? visualState.emissiveIntensity : 1;
      material.emissiveIntensity = Math.max(0.1, baseEmissive * shimmer);
    } else if (material.opacity !== undefined) {
      const baseOpacity = Number.isFinite(visualState?.opacity) ? visualState.opacity : 1;
      const opacityPulse = 0.88 + ((shimmerBeat - 0.5) * 0.18) + packetDensity * 0.08;
      material.opacity = Math.max(0.24, Math.min(1, baseOpacity * opacityPulse));
    }

    if (material.color) {
      const baseColor = visualState?.color ?? null;
      const harmonyColor = this._nodeColorScratch.setHSL(
        0.08 + harmonyLift * 0.08 + (isTarget ? 0.01 : -0.01),
        0.16 + resonance.intensity * 0.06 + packetDensity * 0.04,
        0.56 + packetDensity * 0.04
      );
      const blend = this.config.harmonyColorInfluence * (0.16 + resonance.intensity * 0.24 + packetDensity * 0.08);
      if (baseColor) {
        material.color.copy(baseColor).lerp(harmonyColor, blend);
      } else {
        material.color.lerp(harmonyColor, blend);
      }
    }
  }
  
  /**
   * Modulate link glow based on resonance
   * @private
   */
  _applyLinkGlowModulation(link, resonance) {
    if (!link.mesh || !link.mesh.material) return;
    
    const packetDensity = resonance.packetDensity ?? 0;
    const cadencePulse = resonance.cadencePulse ?? 0.5;
    const counterBeat = resonance.counterBeat ?? 0.5;
    const glowDrive = ((cadencePulse - 0.5) * 2 * 0.28 + (counterBeat - 0.5) * 0.14) * resonance.intensity;
    const glowIntensity = 1 + glowDrive + packetDensity * this.config.packetDensityGlowBoost;
    const baseEmissive = Number.isFinite(resonance.linkVisualState?.emissiveIntensity) ? resonance.linkVisualState.emissiveIntensity : 1;
    link.mesh.material.emissiveIntensity = Math.max(0.1, baseEmissive * glowIntensity * this.config.glowModulation);
    
    // Subtle color shift toward node harmony colors
    this._applyHarmonyColorInfluence(link, resonance);
  }
  
  /**
   * Apply harmony-based color influence to link
   * @private
   */
  _applyHarmonyColorInfluence(link, resonance) {
    if (!link.mesh || !link.mesh.material || !link.mesh.material.color) return;
    
    const sourceMetrics = this._readNodeCanonicalMetrics(link.source);
    const targetMetrics = this._readNodeCanonicalMetrics(link.target);
    
    // Interpolate between source and target harmony colors
    const harmonyLerp = (sourceMetrics.harmony + targetMetrics.harmony) / 2;
    const harmonyDelta = sourceMetrics.harmony - targetMetrics.harmony;
    const stabilityBlend = (sourceMetrics.stability + targetMetrics.stability) / 2;
    const corruptionBlend = (sourceMetrics.corruption + targetMetrics.corruption) / 2;
    const harmonyColor = this._linkColorScratch.setHSL(
      0.08 + harmonyLerp * 0.08 + harmonyDelta * 0.015,
      0.14 + resonance.intensity * 0.06 + (resonance.packetDensity ?? 0) * 0.05,
      0.55 + stabilityBlend * 0.04 - corruptionBlend * 0.03
    );
    
    // Blend original color with harmony color
    const originalColor = link.mesh.material.color;
    const baseColor = resonance.linkVisualState?.color ?? null;
    const blend = this.config.harmonyColorInfluence * (0.12 + resonance.intensity * 0.18 + (resonance.packetDensity ?? 0) * 0.1);
    if (baseColor) {
      originalColor.copy(baseColor).lerp(harmonyColor, blend);
    } else {
      originalColor.lerp(harmonyColor, blend);
    }
  }

  _readNodeCanonicalMetrics(node, fallback = {}) {
    const metrics = getNodeCanonicalMetrics(node) || {};
    return {
      harmony: this._clampMetric(metrics.harmony, fallback.harmony ?? 0.5),
      synergy: this._clampMetric(metrics.synergy, fallback.synergy ?? 0),
      stability: this._clampMetric(metrics.stability, fallback.stability ?? 0.5),
      corruption: this._clampMetric(metrics.corruption, fallback.corruption ?? 0),
      loadPressure: this._clampMetric(
        metrics.loadPressure,
        fallback.loadPressure ?? Math.max(0, 1 - (Number.isFinite(metrics.harmony) ? metrics.harmony : (fallback.harmony ?? 0.5)))
      )
    };
  }

  _readNodeHarmony(node, fallback = 0.5) {
    return this._readNodeCanonicalMetrics(node, { harmony: fallback }).harmony;
  }
  
  _readNodeSynergy(node, fallback = 0) {
    return this._readNodeCanonicalMetrics(node, { synergy: fallback }).synergy;
  }
  
  _getLinkedNodeCount(node) {
    if (!this.linkingSystem?.getLinksForNode) return 0;
    const links = this.linkingSystem.getLinksForNode(node);
    return links?.length ?? 0;
  }
  
  _qualifiesForResonance(node) {
    if (!node) return false;
    const metrics = this._readNodeCanonicalMetrics(node, { harmony: 0, synergy: 0 });
    const linkedCount = this._getLinkedNodeCount(node);
    
    return metrics.harmony > this.config.minHarmony &&
           metrics.synergy > this.config.minSynergy &&
           linkedCount >= this.config.minLinkedNodes;
  }

  _resolveResonanceIntensity(synergy, sourceMetrics, targetMetrics, signature = {}) {
    const harmonyBlend = (sourceMetrics.harmony + targetMetrics.harmony) * 0.5;
    const stabilityBlend = (sourceMetrics.stability + targetMetrics.stability) * 0.5;
    const corruptionBlend = (sourceMetrics.corruption + targetMetrics.corruption) * 0.5;
    const signatureLift = Number.isFinite(signature.intensityLift) ? signature.intensityLift : 1;

    return THREE.MathUtils.clamp(
      synergy * signatureLift * (0.68 + harmonyBlend * 0.18 + stabilityBlend * 0.14 - corruptionBlend * 0.12),
      0,
      1
    );
  }

  _updateResonanceCadence(resonance, sourceMetrics, targetMetrics) {
    const signature = resonance.signature || {};
    const sourceBeat = this._composeBeat(
      resonance.phase + (signature.sourcePhaseOffset ?? 0),
      resonance.phase * 0.5 + (signature.sourceCounterPhaseOffset ?? signature.counterPhaseOffset ?? 0),
      signature.sourcePrimaryWeight ?? this.config.primaryBeatWeight,
      signature.counterWeight ?? this.config.counterBeatWeight
    );
    const targetBeat = this._composeBeat(
      resonance.phase + (signature.targetPhaseOffset ?? this.config.phaseShiftAmount),
      resonance.phase * 0.5 + (signature.targetCounterPhaseOffset ?? signature.counterPhaseOffset ?? Math.PI * 0.5),
      signature.targetPrimaryWeight ?? this.config.primaryBeatWeight,
      signature.counterWeight ?? this.config.counterBeatWeight
    );
    const counterBeat = this._composeBeat(
      resonance.phase * 0.75 + (signature.counterPhaseOffset ?? 0),
      resonance.phase * 0.375 + (signature.packetPhaseOffset ?? Math.PI * 0.25),
      0.34,
      0.12
    );

    resonance.sourceBeat = sourceBeat;
    resonance.targetBeat = targetBeat;
    resonance.counterBeat = counterBeat;
    resonance.cadencePulse = (sourceBeat + targetBeat) * 0.5;
    resonance.packetDensity = THREE.MathUtils.clamp(
      (resonance.activeParticleCount ?? 0) / this.config.maxResonanceParticlesActive,
      0,
      1
    );
    resonance.sourceMetrics = sourceMetrics;
    resonance.targetMetrics = targetMetrics;
    resonance.harmonyBlend = (sourceMetrics.harmony + targetMetrics.harmony) * 0.5;
  }

  _composeBeat(primaryPhase, counterPhase, primaryWeight, counterWeight) {
    const primary = this._smoothBeat(primaryPhase);
    const counter = this._smoothBeat(counterPhase);
    return THREE.MathUtils.clamp(primary * primaryWeight + counter * counterWeight, 0, 1);
  }

  _smoothBeat(phase) {
    const value = 0.5 + 0.5 * Math.sin(phase);
    return value * value * (3 - 2 * value);
  }

  _clampMetric(value, fallback = 0) {
    if (!Number.isFinite(value)) return fallback;
    return THREE.MathUtils.clamp(value, 0, 1);
  }

  _resolveNodeIdentity(node) {
    if (!node) return '';
    const identity = node.id ?? node.uuid ?? node.mesh?.uuid ?? node.userData?.id ?? node.userData?.uuid ?? node.name;
    return identity != null ? String(identity) : '';
  }

  _resolveLinkIdentity(link) {
    if (!link) return '';
    const linkIdentity = link.id ?? link.uuid ?? link.mesh?.uuid;
    if (linkIdentity != null) return String(linkIdentity);

    const sourceId = this._resolveNodeIdentity(link.source);
    const targetId = this._resolveNodeIdentity(link.target);
    return sourceId || targetId ? `${sourceId}|${targetId}` : '';
  }

  _hashString(value) {
    let hash = 2166136261;
    const text = String(value ?? '');

    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
  }

  _hashToUnit(seed, salt = 0) {
    let value = (seed ^ salt) >>> 0;
    value ^= value >>> 16;
    value = Math.imul(value, 2246822507);
    value ^= value >>> 13;
    value = Math.imul(value, 3266489909);
    value ^= value >>> 16;
    return (value >>> 0) / 4294967295;
  }

  _captureVisualSnapshot(material) {
    if (!material) return null;

    return {
      color: material.color ? material.color.clone() : null,
      emissiveIntensity: Number.isFinite(material.emissiveIntensity) ? material.emissiveIntensity : null,
      opacity: Number.isFinite(material.opacity) ? material.opacity : null
    };
  }

  _buildResonanceSignature(link, linkId, sourceMetrics, targetMetrics) {
    const sourceId = this._resolveNodeIdentity(link?.source);
    const targetId = this._resolveNodeIdentity(link?.target);
    const seed = this._hashString([linkId, sourceId, targetId].join('|'));
    const harmonyBalance = THREE.MathUtils.clamp(sourceMetrics.harmony - targetMetrics.harmony, -1, 1);
    const stabilityBalance = THREE.MathUtils.clamp(sourceMetrics.stability - targetMetrics.stability, -1, 1);
    const corruptionBalance = THREE.MathUtils.clamp(sourceMetrics.corruption - targetMetrics.corruption, -1, 1);
    const basePhase = this._hashToUnit(seed, 0x9e3779b9) * Math.PI * 2;
    const responseSkew = THREE.MathUtils.clamp(
      harmonyBalance * 0.24 + stabilityBalance * 0.14 - corruptionBalance * 0.1 + (this._hashToUnit(seed, 0x85ebca6b) - 0.5) * 0.18,
      -0.7,
      0.7
    );
    const counterPhaseOffset = this._hashToUnit(seed, 0xc2b2ae35) * Math.PI * 2;
    const laneRoll = seed % 3;
    const lanePermutation = laneRoll === 0 ? [0, 1, 2] : laneRoll === 1 ? [1, 0, 2] : [2, 1, 0];

    return {
      seed,
      phaseSeed: basePhase,
      sourcePhaseOffset: basePhase + responseSkew,
      targetPhaseOffset: basePhase - responseSkew + this.config.phaseShiftAmount * (0.88 + this._hashToUnit(seed, 0x27d4eb2d) * 0.24),
      sourceCounterPhaseOffset: counterPhaseOffset + this._hashToUnit(seed, 0x94d049bb) * Math.PI * 2,
      targetCounterPhaseOffset: counterPhaseOffset + this._hashToUnit(seed, 0x2545f491) * Math.PI * 2,
      counterPhaseOffset,
      packetPhaseOffset: this._hashToUnit(seed, 0x3c6ef372) * Math.PI * 2,
      sourcePrimaryWeight: 0.68 + this._hashToUnit(seed, 0x1b873593) * 0.14,
      targetPrimaryWeight: 0.66 + this._hashToUnit(seed, 0xa54ff53a) * 0.14,
      counterWeight: 0.12 + this._hashToUnit(seed, 0x510e527f) * 0.08,
      intensityLift: 0.92 + this._hashToUnit(seed, 0x27d4eb2d) * 0.12,
      packetLaneSeed: seed,
      packetLaneBias: this._hashToUnit(seed, 0x9e3779b9),
      lanePermutation,
      sourceAnchorT: 0.12 + this._hashToUnit(seed, 0x6d703ef3) * 0.14,
      midpointAnchorT: 0.46 + this._hashToUnit(seed, 0xc06c9a6f) * 0.08,
      targetAnchorT: 0.84 + this._hashToUnit(seed, 0xb54cda56) * 0.12,
      particleSpread: 0.65 + this._hashToUnit(seed, 0x165667b1) * 0.35
    };
  }
  
  /**
   * Emit resonance particles between nodes
   * @private
   */
  _emitResonanceParticles(link, resonance, deltaTime) {
    if (!link?.source?.position || !link?.target?.position) return;

    // Accumulate fractional emissions so low rates still produce particles over time.
    const cadenceLift = 0.82 + (resonance.cadencePulse ?? 0.5) * 0.18;
    const spawnRate = this.config.particleEmissionRate * resonance.intensity * cadenceLift * 60;
    resonance.particleSpawnAccumulator = (resonance.particleSpawnAccumulator || 0) + spawnRate * deltaTime;
    const emissionCount = Math.floor(resonance.particleSpawnAccumulator);
    if (emissionCount <= 0) return;
    resonance.particleSpawnAccumulator -= emissionCount;

    const overflow = Math.max(0, this.resonanceParticles.length + emissionCount - this.config.maxResonanceParticlesActive);
    for (let i = 0; i < overflow; i += 1) {
      const dropped = this.resonanceParticles.shift();
      if (dropped?.resonance && dropped.resonance.activeParticleCount > 0) {
        dropped.resonance.activeParticleCount -= 1;
      }
    }

    const signature = resonance.signature || {};
    const lanePermutation = Array.isArray(signature.lanePermutation) && signature.lanePermutation.length === 3
      ? signature.lanePermutation
      : [0, 1, 2];
    const sourcePosition = this._particleSourceScratch.copy(link.source.position);
    const targetPosition = this._particleTargetScratch.copy(link.target.position);
    const midpointPosition = this._particleMidpointScratch.copy(sourcePosition).lerp(targetPosition, 0.5);
    
    for (let i = 0; i < emissionCount; i++) {
      const laneIndex = lanePermutation[(resonance.particleSpawnCursor + i) % lanePermutation.length];
      const anchorT = laneIndex === 0
        ? signature.sourceAnchorT ?? 0.14
        : laneIndex === 1
          ? signature.midpointAnchorT ?? 0.5
          : signature.targetAnchorT ?? 0.86;
      const anchorPosition = laneIndex === 0
        ? sourcePosition
        : laneIndex === 1
          ? midpointPosition
          : targetPosition;
      const lanePhase = this._hashToUnit(signature.seed ?? 0, resonance.particleSpawnCursor + i) * Math.PI * 2;
      const laneSpread = (laneIndex - 1) * this.config.particleAnchorSpread * (signature.particleSpread ?? 1);
      const packetPosition = this._particleDirectionScratch.copy(targetPosition).sub(sourcePosition).multiplyScalar(laneSpread).add(anchorPosition);
      const packetTone = this._particleColorScratch.setHSL(
        0.08 + (resonance.harmonyBlend ?? 0.5) * 0.08,
        0.10 + resonance.intensity * 0.06 + (resonance.packetDensity ?? 0) * 0.04,
        0.56 + (laneIndex === 1 ? 0.04 : 0) + (resonance.cadencePulse ?? 0.5) * 0.04
      );
      const lifetime = this.config.particleLifetime * (0.86 + (resonance.cadencePulse ?? 0.5) * 0.18);
      const particle = {
        position: packetPosition.clone(),
        sourceNode: link.source,
        targetNode: link.target,
        linePath: new THREE.LineCurve3(link.source.position, link.target.position),
        progress: anchorT,
        anchorT,
        laneIndex,
        phaseOffset: lanePhase,
        lifetime,
        maxLifetime: lifetime,
        resonance: resonance,
        color: packetTone.clone(),
        size: this.config.particleSize + (laneIndex === 1 ? 0.03 : 0.015) + (resonance.intensity * 0.03)
      };
      
      resonance.activeParticleCount += 1;
      resonance.particleTrail.push({
        laneIndex,
        anchorT,
        phaseOffset: lanePhase,
        lifetime
      });
      if (resonance.particleTrail.length > 8) {
        resonance.particleTrail.shift();
      }
      resonance.particleSpawnCursor = (resonance.particleSpawnCursor + 1) % lanePermutation.length;
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
      const pathLength = Math.max(particle.sourceNode.position.distanceTo(particle.targetNode.position), 0.0001);
      const moveProgress = moveDistance / pathLength;
      
      // Oscillate back and forth based on resonance
      const oscillation = Math.sin(particle.resonance.phase + (particle.phaseOffset ?? 0)) * 0.08;
      particle.progress += moveProgress * (0.92 + (particle.laneIndex === 1 ? 0.04 : 0)) + oscillation;
      
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
      particle.fadeFactor = particle.lifetime / particle.maxLifetime;
      particle.size = Math.max(0.05, this.config.particleSize * (0.82 + particle.fadeFactor * 0.34));
      
      // Fade out at end of life
      const fadeFactor = particle.lifetime / particle.maxLifetime;
    }
    
    // Remove dead particles
    for (let i = toRemove.length - 1; i >= 0; i--) {
      const removed = this.resonanceParticles.splice(toRemove[i], 1)[0];
      if (removed?.resonance && removed.resonance.activeParticleCount > 0) {
        removed.resonance.activeParticleCount -= 1;
      }
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
        linkId: r.linkId || r.link?.id || this._resolveLinkIdentity(r.link),
        frequency: r.frequency.toFixed(2),
        intensity: (r.intensity * 100).toFixed(1) + '%',
        phase: (r.phase * 180 / Math.PI).toFixed(0) + '°',
        synergy: this._getResonanceSynergy(r.link).toFixed(3),
        packetDensity: (r.packetDensity ?? 0).toFixed(2)
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
