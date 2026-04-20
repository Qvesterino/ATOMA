/**
 * HARMONIC RESONANCE COUPLING v1.1
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
 * - Node auras shimmer in sync (phase coupling)
 * - Link becomes a visual conduit for harmonic energy
 * - Frequency of resonance increases with synergy strength
 *
 * 🎯 PURE VISUAL SYSTEM:
 * - Zero gameplay impact (no stat modifications)
 * - Only affects visual parameters (scale, color, glow)
 * - Reads-only from node synergy/harmony stats
 * - Non-invasive to existing systems
 * - <1ms overhead per link update
 *
 * ⚡ RESONANCE MECHANICS (simplified):
 * Both nodes must meet: harmony > 0.50, synergy > 0.50, linkedNodes >= 2
 * Frequency = baseFrequency + (intensity × frequencyAmplitude)
 *
 * 📊 VISUAL FEEDBACK:
 * 1. Node Sync Shimmer: Target node pulses in sync with source
 * 2. Link Glow Modulation: Link becomes more prominent during resonance
 * 3. Harmonic Aura: Subtle color shift toward complementary harmony hue
 *
 * 🔒 ROLE SEPARATION (v1.1):
 * - This system: ambient glow/shimmer (relationship quality indicator)
 * - LinkResonanceFlowSystem: directional pulses (traffic/energy flow)
 * - NO traveling particles — those belong to Flow system
 *
 * 🔒 CONTRACTS:
 * - Only modifies: mesh.scale, material.color, material.emissive
 * - Never writes to: node.userData.* (read-only)
 * - Never affects: game time, deltaTime, physics, gameplay logic
 * - Never creates side effects: pure deterministic visual transform
 */

import * as THREE from 'three';
import { getLinkSynergy, getNodeCanonicalMetrics } from './SemanticMetricAdapter.js';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

export class HarmonicResonanceCoupling_v1 {
  constructor(scene, linkingSystem) {
    this.scene = scene;
    this.linkingSystem = linkingSystem;
    this.enabled = true;
    
    // State tracking
    this.resonancePairs = new Map(); // linkId → { frequency, phase, intensity }
    this._visualTime = 0;
    this._linkColorScratch = new THREE.Color();
    this._nodeColorScratch = new THREE.Color();
    this._stressColorScratch = new THREE.Color();
    this._stressColorScratchB = new THREE.Color();
    this._resonanceVisualGroup = new THREE.Group();
    this._resonanceVisualGroup.name = 'HarmonicResonanceCoupling';
    this._resonanceVisualGroup.renderOrder = VisualHierarchyRegistry?.getRenderOrder?.(VisualHierarchyRegistry.LAYER_LINK_RESONANCE) ?? 12;
    if (this.scene && typeof this.scene.add === 'function') {
      this.scene.add(this._resonanceVisualGroup);
    }
    
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
      
      
      // Visual parameters
      shimmerIntensity: 0.08,         // Node scale variation
      glowModulation: 1.4,            // Link glow intensity multiplier
      harmonyColorInfluence: 0.25,    // How much harmony color affects link
      phaseShiftAmount: Math.PI / 4,  // Phase offset between nodes
      primaryBeatWeight: 0.78,
      counterBeatWeight: 0.18,
      packetDensityGlowBoost: 0.22,
      packetDensityShimmerBoost: 0.16,
      
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
    
    const visuals = this._createResonanceVisuals(link);

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
      particleTrail: [], // Track recent particles for visual continuity
      visuals
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
    const resonance = this.resonancePairs.get(linkId);
    if (resonance?.visuals) {
      this._disposeResonanceVisuals(resonance.visuals);
    }
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
    if (resonance.intensity < 0.01) {
      resonance.intensity = 0;
      this._updateResonanceVisuals(resonance);
      return;
    }
    
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
    this._updateResonanceVisuals(resonance);
  }
  
  _createResonanceVisuals(link) {
    if (!this._resonanceVisualGroup) return null;

    const group = new THREE.Group();
    group.frustumCulled = false;

    // Spectral resonance line — dimensional conduit between nodes
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(6);
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xaaeeff,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    line.frustumCulled = false;
    group.add(line);

    // Resonance orb — diamond convergence point at midpoint
    const orbGeometry = new THREE.OctahedronGeometry(0.06, 0);
    const orbMaterial = new THREE.MeshBasicMaterial({
      color: 0xddf0ff,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      flatShading: true
    });
    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    orb.frustumCulled = false;
    orb.visible = false;
    group.add(orb);

    // Halo ring — dimensional aperture around the orb
    const haloGeometry = new THREE.TorusGeometry(0.12, 0.012, 6, 16);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    halo.frustumCulled = false;
    halo.visible = false;
    halo.rotation.x = Math.PI * 0.5;
    group.add(halo);

    this._resonanceVisualGroup.add(group);

    return { group, line, orb, halo };
  }

  _disposeResonanceVisuals(visuals) {
    if (!visuals) return;
    if (visuals.group && visuals.group.parent) {
      visuals.group.parent.remove(visuals.group);
    }
    if (visuals.line) {
      visuals.line.geometry?.dispose();
      visuals.line.material?.dispose();
    }
    if (visuals.orb) {
      visuals.orb.geometry?.dispose();
      visuals.orb.material?.dispose();
    }
    if (visuals.halo) {
      visuals.halo.geometry?.dispose();
      visuals.halo.material?.dispose();
    }
  }

  _updateResonanceVisuals(resonance) {
    if (!resonance || !resonance.visuals || !resonance.link || !resonance.link.source || !resonance.link.target) return;
    const { line, orb, halo } = resonance.visuals;
    if (!line || !orb) return;

    const sourcePos = resonance.link.source.position;
    const targetPos = resonance.link.target.position;
    if (!sourcePos || !targetPos) return;

    const linePositions = line.geometry.attributes.position.array;
    linePositions[0] = sourcePos.x;
    linePositions[1] = sourcePos.y;
    linePositions[2] = sourcePos.z;
    linePositions[3] = targetPos.x;
    linePositions[4] = targetPos.y;
    linePositions[5] = targetPos.z;
    line.geometry.attributes.position.needsUpdate = true;

    const intensity = THREE.MathUtils.clamp(resonance.intensity * 1.2, 0, 1);
    const cadencePulse = resonance.cadencePulse ?? 0.5;
    const sourceStress = this._readNodeStressField(resonance.link.source, this._stressColorScratch);
    const targetStress = this._readNodeStressField(resonance.link.target, this._stressColorScratchB);
    const pressureBias = (sourceStress.bias + targetStress.bias) * 0.5;
    const opacity = THREE.MathUtils.clamp(intensity * 0.85 + (cadencePulse - 0.5) * 0.14 + pressureBias * 0.08, 0, 0.9);
    line.material.opacity = opacity;

    // Spectral link color — shifts from cosmic cyan to prismatic white-gold with intensity
    const harmonyBlend = resonance.harmonyBlend ?? 0.5;
    const linkColor = this._linkColorScratch.setHSL(
      0.52 + harmonyBlend * 0.08,       // Cyan → blue shift with harmony
      0.35 + intensity * 0.25,           // Saturation rises with resonance
      0.55 + intensity * 0.2             // Brighter at high intensity
    );
    linkColor.lerp(sourceStress.color, sourceStress.bias * 0.14);
    linkColor.lerp(targetStress.color, targetStress.bias * 0.14);
    line.material.color.copy(linkColor);

    // Resonance orb — interdimensional convergence point
    orb.visible = intensity > 0.02;
    orb.position.copy(sourcePos).lerp(targetPos, 0.5);
    const baseSize = 0.04 + intensity * 0.12;
    const pulse = Math.sin(this._visualTime * (resonance.frequency || this.config.baseFrequency) * 1.5) * (0.015 + pressureBias * 0.01);
    orb.scale.setScalar(Math.max(0.02, baseSize + pulse));
    // Orb whitens at high intensity — spectral bloom
    const orbWhiten = THREE.MathUtils.smoothstep(intensity, 0.3, 0.9);
    orb.material.color.setRGB(
      Math.min(1, linkColor.r + orbWhiten * 0.4),
      Math.min(1, linkColor.g + orbWhiten * 0.35),
      Math.min(1, linkColor.b + orbWhiten * 0.2)
    );
    orb.material.color.lerp(this._nodeColorScratch.copy(sourceStress.color).lerp(targetStress.color, 0.5), pressureBias * 0.18);
    orb.material.opacity = THREE.MathUtils.clamp(intensity * 0.72 + 0.12, 0, 0.92);

    // Dimensional halo ring — aperture effect around convergence point
    if (halo) {
      halo.visible = intensity > 0.08;
      if (halo.visible) {
        halo.position.copy(orb.position);
        const haloScale = 0.8 + intensity * 0.6 + Math.sin(this._visualTime * 2.2) * 0.08;
        halo.scale.setScalar(Math.max(0.3, haloScale));
        halo.rotation.z = this._visualTime * 0.4;
        halo.material.color.copy(linkColor).lerp(sourceStress.color, sourceStress.bias * 0.12).lerp(targetStress.color, targetStress.bias * 0.12);
        halo.material.opacity = THREE.MathUtils.clamp(intensity * 0.35 + pressureBias * 0.06, 0, 0.56);
      }
    }
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
    const stressField = this._readNodeStressField(node, this._stressColorScratch);
    const shimmerBeat = THREE.MathUtils.clamp(
      beat * this.config.primaryBeatWeight + counterBeat * this.config.counterBeatWeight,
      0,
      1
    );
    const shimmer = 1 + ((shimmerBeat - 0.5) * 2 * this.config.shimmerIntensity * resonance.intensity) +
      (packetDensity * this.config.packetDensityShimmerBoost) +
      (stressField.bias * 0.1);

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
      // Spectral harmony color — prismatic shift based on harmony and resonance
      const harmonyColor = this._nodeColorScratch.setHSL(
        0.52 + harmonyLift * 0.08 + (isTarget ? 0.04 : -0.02),  // Cyan → blue with harmony
        0.4 + resonance.intensity * 0.15 + packetDensity * 0.06,
        0.58 + packetDensity * 0.06
      );
      harmonyColor.lerp(stressField.color, stressField.bias * 0.2);
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
    const sourceStress = this._readNodeStressField(link.source, this._stressColorScratch);
    const targetStress = this._readNodeStressField(link.target, this._stressColorScratchB);
    const pressureBias = (sourceStress.bias + targetStress.bias) * 0.5;
    const glowDrive = ((cadencePulse - 0.5) * 2 * 0.28 + (counterBeat - 0.5) * 0.14) * resonance.intensity;
    const glowIntensity = 1 + glowDrive + packetDensity * this.config.packetDensityGlowBoost + pressureBias * 0.18;
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
    const sourceStress = this._readNodeStressField(link.source, this._stressColorScratch);
    const targetStress = this._readNodeStressField(link.target, this._stressColorScratchB);
    const pressureBias = (sourceStress.bias + targetStress.bias) * 0.5;
    // Spectral link harmony — cosmic cyan with corruption-aware violet shift
    const harmonyColor = this._linkColorScratch.setHSL(
      0.52 + harmonyLerp * 0.06 + harmonyDelta * 0.02 - corruptionBlend * 0.08,
      0.4 + resonance.intensity * 0.15 + (resonance.packetDensity ?? 0) * 0.06,
      0.55 + stabilityBlend * 0.06 - corruptionBlend * 0.04
    );
    harmonyColor
      .lerp(sourceStress.color, sourceStress.bias * 0.14)
      .lerp(targetStress.color, targetStress.bias * 0.14);
    
    // Blend original color with harmony color
    const originalColor = link.mesh.material.color;
    const baseColor = resonance.linkVisualState?.color ?? null;
    const blend = this.config.harmonyColorInfluence * (0.12 + resonance.intensity * 0.18 + (resonance.packetDensity ?? 0) * 0.1 + pressureBias * 0.12);
    if (baseColor) {
      originalColor.copy(baseColor).lerp(harmonyColor, blend);
    } else {
      originalColor.lerp(harmonyColor, blend);
    }
  }

  _readNodeStressField(node, colorTarget = this._stressColorScratch) {
    const userData = node?.userData || {};
    const bias = this._clampMetric(userData.stressFieldBias, 0);
    const tension = this._clampMetric(userData.stressFieldTension, 0);
    const colorValue = userData.stressFieldColor;
    if (typeof colorValue === 'number' && Number.isFinite(colorValue)) {
      colorTarget.setHex(colorValue);
    } else {
      colorTarget.setHSL(0.54 - tension * 0.07, 0.5 + bias * 0.12, 0.56 + bias * 0.08);
    }
    return { bias, tension, color: colorTarget };
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
