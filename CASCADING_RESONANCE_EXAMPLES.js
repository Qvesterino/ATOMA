/**
 * Cascading Harmonic Resonance Amplification — Integration Examples
 * 
 * Complete working examples for integrating cascading resonance into
 * various ATOMA visual systems.
 * 
 * Copy-paste these examples into your visual systems to connect them
 * to the cascade system.
 */

// ============================================================================
// EXAMPLE 1: Node Aura Intensity Scaling
// ============================================================================
/**
 * Integrate cascading resonance into node aura glow.
 * 
 * Before: aura intensity = constant or based on harmony
 * After: aura intensity = base + cascade strength bonus
 * 
 * Effect: Nodes in strong cascades glow brighter, creating visual
 * depth and making cascade layers visible.
 */

function exampleNodeAuraIntensity(node) {
  // Base aura intensity calculation (your existing system)
  const harmony = node.harmony || 0;
  const baseAuraIntensity = 0.5 + harmony * 0.5;

  // Add cascade amplification
  const cascadeStrength = node._cascadeStrength || 0;
  const cascadeBoost = cascadeStrength * 0.5; // 0-50% intensity increase
  const finalAuraIntensity = Math.min(1, baseAuraIntensity + cascadeBoost);

  // Optional: use cascade amplitude for peak effect
  const cascadeAmplitude = node._cascadeAmplitude || 0;
  const amplitudeFactor = 0.8 + cascadeAmplitude * 0.2; // 0.8-1.0x
  const auraIntensityWithPeak = finalAuraIntensity * amplitudeFactor;

  return {
    baseIntensity: baseAuraIntensity,
    cascadeBoost: cascadeBoost,
    finalIntensity: auraIntensityWithPeak
  };
}

// Usage in your node aura system:
// ─────────────────────────────────────────────────────────────
// const auraParams = exampleNodeAuraIntensity(node);
// material.uniforms.uAuraIntensity.value = auraParams.finalIntensity;

// ============================================================================
// EXAMPLE 2: Node Pulse Rate Modulation
// ============================================================================
/**
 * Modulate node pulse frequency based on cascade strength.
 * 
 * Effect: Nodes pulsate faster when in cascade paths, creating
 * visible wave-like propagation through layers.
 * 
 * Also synchronizes pulse phase with cascade phase.
 */

function exampleNodePulseModulation(node, time) {
  // Base pulse frequency
  const basePulseFrequency = 2.0; // Hz (cycles per second)

  // Cascade amplification
  const cascadeStrength = node._cascadeStrength || 0;
  const frequencyBoost = cascadeStrength * 0.4; // Up to 40% faster
  const finalPulseFrequency = basePulseFrequency * (1 + frequencyBoost);

  // Phase computation with cascade synchronization
  const cascadePhase = node._cascadePhase || 0;
  const timePhase = time * finalPulseFrequency * 2 * Math.PI; // time-based phase
  const finalPhase = timePhase + cascadePhase;

  // Compute pulse value (0-1)
  const pulseValue = 0.5 + 0.5 * Math.sin(finalPhase);

  return {
    frequency: finalPulseFrequency,
    phase: finalPhase,
    value: pulseValue
  };
}

// Usage:
// ─────────────────────────────────────────────────────────────
// const pulseParams = exampleNodePulseModulation(node, performance.now() / 1000);
// material.uniforms.uPulseIntensity.value = pulseParams.value;

// ============================================================================
// EXAMPLE 3: Link Glow Amplification
// ============================================================================
/**
 * Intensify link glow based on cascade strength of endpoint nodes.
 * 
 * Effect: Links connecting nodes in strong cascades glow brighter,
 * highlighting cascade pathways visually.
 */

function exampleLinkGlowAmplification(link, baseGlow = 0.5) {
  // Get cascade strength from both endpoints
  const cascadeA = link.a?._cascadeStrength || 0;
  const cascadeB = link.b?._cascadeStrength || 0;

  // Use maximum cascade strength (link is in both cascades' influence)
  const maxCascade = Math.max(cascadeA, cascadeB);

  // Apply cascade boost
  const cascadeGlowBoost = maxCascade * 0.3; // Up to 30% brighter
  const finalGlow = Math.min(1, baseGlow + cascadeGlowBoost);

  // Optional: compute average cascade for smoother blending
  const avgCascade = (cascadeA + cascadeB) * 0.5;
  const blendedGlow = baseGlow * (0.8 + avgCascade * 0.2) + cascadeGlowBoost * 0.5;

  return {
    baseGlow: baseGlow,
    cascadeBoost: cascadeGlowBoost,
    finalGlow: Math.min(1, blendedGlow),
    cascadeA: cascadeA,
    cascadeB: cascadeB
  };
}

// Usage:
// ─────────────────────────────────────────────────────────────
// const linkGlow = exampleLinkGlowAmplification(link, baseGlow);
// linkMaterial.uniforms.uEmissionIntensity.value = linkGlow.finalGlow;

// ============================================================================
// EXAMPLE 4: Glyph Intensity & Phase Synchronization
// ============================================================================
/**
 * Synchronize glyph intensity and animation phase with cascade state.
 * 
 * Effect: Glyphs brighten in cascade paths and pulse in synchronization
 * with cascade layers, creating harmonious animation.
 */

function exampleGlyphCascadeSync(node, time) {
  // Base glyph intensity
  const baseGlyphIntensity = 0.6;

  // Cascade-based modulation
  const cascadeAmplitude = node._cascadeAmplitude || 0;
  const cascadeStrength = node._cascadeStrength || 0;

  // Intensity scaling: cascade amplitude brightens, strength sustains brightness
  const intensityBoost = cascadeAmplitude * 0.3 + cascadeStrength * 0.15;
  const finalGlyphIntensity = baseGlyphIntensity * (0.7 + intensityBoost);

  // Phase synchronization
  const cascadePhase = node._cascadePhase || 0;
  const glyphPulseRate = 1.5; // cycles per second
  const timePhase = time * glyphPulseRate * 2 * Math.PI;
  const synchronizedPhase = timePhase + cascadePhase;

  // Compute glyph animation value (breathing/pulsing)
  const glyphValue = 0.5 + 0.5 * Math.sin(synchronizedPhase);

  return {
    intensity: finalGlyphIntensity,
    phase: synchronizedPhase,
    animationValue: glyphValue
  };
}

// Usage:
// ─────────────────────────────────────────────────────────────
// const glyphParams = exampleGlyphCascadeSync(node, time);
// glyphMaterial.uniforms.uIntensity.value = glyphParams.intensity;
// glyphMesh.material.uniforms.uPhase.value = glyphParams.phase;

// ============================================================================
// EXAMPLE 5: Layer-Aware Visual Intensification
// ============================================================================
/**
 * Apply different visual effects based on cascade layer.
 * 
 * Effect: Primary hub (layer 0) has intense effect, layer 1-3 moderate,
 * far field subtle. Creates visual hierarchy through layering.
 */

function exampleLayerAwareEffect(node) {
  const cascadeLayer = node._cascadeLayer || 0;
  const cascadeStrength = node._cascadeStrength || 0;

  let layerMultiplier = 0;
  let effectName = 'none';

  if (cascadeLayer === 0) {
    // Primary hub: intense effects
    layerMultiplier = 1.0;
    effectName = 'primary-hub';
  } else if (cascadeLayer === 1) {
    // Direct neighbors: strong effects
    layerMultiplier = 0.75;
    effectName = 'layer-1';
  } else if (cascadeLayer <= 3) {
    // Mid-layers: moderate effects
    layerMultiplier = 0.5;
    effectName = 'layer-2-3';
  } else {
    // Far field: subtle effects
    layerMultiplier = 0.25;
    effectName = 'far-field';
  }

  const finalIntensity = cascadeStrength * layerMultiplier;

  return {
    layer: cascadeLayer,
    layerMultiplier: layerMultiplier,
    finalIntensity: finalIntensity,
    effectName: effectName
  };
}

// Usage:
// ─────────────────────────────────────────────────────────────
// const layerEffect = exampleLayerAwareEffect(node);
// switch (layerEffect.effectName) {
//   case 'primary-hub':
//     applyIntenseGlow(node);
//     break;
//   case 'layer-1':
//     applyModerateGlow(node);
//     break;
//   default:
//     applySubtleGlow(node);
// }

// ============================================================================
// EXAMPLE 6: Multi-Cascade Interference Visualization
// ============================================================================
/**
 * Visualize multi-cascade interference by modulating color based on
 * how many cascades converge on a node.
 * 
 * Effect: Nodes where multiple cascades align become bright;
 * where cascades misalign, dims. Highlights network topology through
 * interference patterns.
 */

function exampleMultiCascadeVisualization(node) {
  const cascadeStrength = node._cascadeStrength || 0;
  const cascadeSourceCount = node._cascadeSourceCount || 0;

  // Single vs. multiple cascades have different visual treatments
  let colorMultiplier = 1;
  let saturation = 1;

  if (cascadeSourceCount === 0) {
    // No cascade
    colorMultiplier = 0.5;
    saturation = 0.5;
  } else if (cascadeSourceCount === 1) {
    // Single cascade: normal intensity
    colorMultiplier = 0.7 + cascadeStrength * 0.3;
    saturation = 0.8 + cascadeStrength * 0.2;
  } else {
    // Multiple cascades: constructive interference brightens
    colorMultiplier = 0.8 + cascadeStrength * 0.2;
    saturation = 1.0; // Full saturation for aligned cascades
  }

  return {
    cascadeCount: cascadeSourceCount,
    colorMultiplier: colorMultiplier,
    saturation: saturation,
    description: cascadeSourceCount === 0 ? 'isolated' 
              : cascadeSourceCount === 1 ? 'single-cascade'
              : 'multi-cascade-interference'
  };
}

// Usage:
// ─────────────────────────────────────────────────────────────
// const interference = exampleMultiCascadeVisualization(node);
// material.uniforms.uColorMultiplier.value = interference.colorMultiplier;
// material.uniforms.uSaturation.value = interference.saturation;

// ============================================================================
// EXAMPLE 7: Complete Node Visual Update Function
// ============================================================================
/**
 * All-in-one node visual update integrating all cascade systems.
 * 
 * Usage: Call once per frame for each node that's being rendered.
 */

function exampleCompleteNodeVisualUpdate(node, nodeMaterial, nodeAuraMaterial, time) {
  // 1. Update aura intensity
  const auraParams = exampleNodeAuraIntensity(node);
  nodeAuraMaterial.uniforms.uIntensity.value = auraParams.finalIntensity;

  // 2. Update pulse
  const pulseParams = exampleNodePulseModulation(node, time);
  nodeMaterial.uniforms.uPulseIntensity.value = pulseParams.value;

  // 3. Update glyph
  const glyphParams = exampleGlyphCascadeSync(node, time);
  nodeMaterial.uniforms.uGlyphIntensity.value = glyphParams.intensity;

  // 4. Layer-aware effects
  const layerEffect = exampleLayerAwareEffect(node);
  nodeMaterial.uniforms.uLayerIntensity.value = layerEffect.finalIntensity;

  // 5. Multi-cascade interference
  const interference = exampleMultiCascadeVisualization(node);
  nodeMaterial.uniforms.uColorMultiplier.value = interference.colorMultiplier;
  nodeMaterial.uniforms.uSaturation.value = interference.saturation;

  // Debug output (optional)
  return {
    aura: auraParams,
    pulse: pulseParams,
    glyph: glyphParams,
    layer: layerEffect,
    interference: interference,
    total_cascade_strength: node._cascadeStrength
  };
}

// ============================================================================
// EXAMPLE 8: Link Rendering with Cascade Integration
// ============================================================================
/**
 * Complete link rendering integration with cascade system.
 */

function exampleCompleteLinkVisualUpdate(link, linkMaterial, time) {
  // Base link glow from standard systems
  const baseGlow = computeBaseLinkGlow(link); // Your existing function

  // Apply cascade amplification
  const glowParams = exampleLinkGlowAmplification(link, baseGlow);
  linkMaterial.uniforms.uEmissionIntensity.value = glowParams.finalGlow;

  // Optional: phase synchronization based on endpoint cascades
  const cascadePhase = Math.max(
    link.a?._cascadePhase || 0,
    link.b?._cascadePhase || 0
  );
  const timePhase = time * 2 * Math.PI;
  linkMaterial.uniforms.uPhase.value = timePhase + cascadePhase;

  // Apply link morphing from corruption (if using LinkCorruptionMorphingSystem)
  if (link._cascadeStrength !== undefined) {
    // Cascade strength can reduce corruption appearance slightly
    const cascadeResilience = link.a?._cascadeStrength || link.b?._cascadeStrength || 0;
    const effectiveCorruption = Math.max(0, link.corruption - cascadeResilience * 0.1);
    linkMaterial.uniforms.uCorruption.value = effectiveCorruption;
  }

  return {
    glow: glowParams,
    cascadePhase: cascadePhase,
    finalGlow: glowParams.finalGlow
  };
}

// ============================================================================
// EXAMPLE 9: Batch Update for Many Nodes (Performance)
// ============================================================================
/**
 * Efficient batch update for rendering many nodes.
 * Uses bulk operations to minimize per-node overhead.
 */

function exampleBatchNodeVisualUpdate(nodes, time) {
  const results = [];

  for (const node of nodes) {
    // Skip nodes not in cascades
    const cascadeStrength = node._cascadeStrength || 0;
    if (cascadeStrength < 0.01) continue;

    // Update cascade-based properties
    const auraIntensity = 0.5 + (node.harmony || 0) * 0.5 + cascadeStrength * 0.5;
    const pulseValue = 0.5 + 0.5 * Math.sin(time * 2 * Math.PI + (node._cascadePhase || 0));

    // Update material (batch)
    if (node.material) {
      node.material.uniforms.uAuraIntensity.value = auraIntensity;
      node.material.uniforms.uPulseValue.value = pulseValue;
    }

    results.push({
      nodeId: node.id,
      auraIntensity,
      pulseValue,
      cascadeStrength
    });
  }

  return results;
}

// ============================================================================
// EXAMPLE 10: Cascade System Integration Hook
// ============================================================================
/**
 * Integration point to be called from main render loop.
 * 
 * Add this to your frame update function to connect cascading resonance
 * to all node/link visuals.
 */

function exampleMainRenderLoopIntegration(world, cascadeSystem, time) {
  // 1. Update cascade system (computes all cascade data)
  const deltaTime = time - (exampleMainRenderLoopIntegration.lastTime || 0);
  cascadeSystem.update(deltaTime);
  exampleMainRenderLoopIntegration.lastTime = time;

  // 2. Update all nodes with cascade integration
  for (const [nodeId, node] of world.network.nodes) {
    if (node.mesh && node.material) {
      exampleCompleteNodeVisualUpdate(node, node.material, node.auraMaterial, time);
    }
  }

  // 3. Update all links with cascade integration
  for (const link of world.network.links) {
    if (link.mesh && link.material) {
      exampleCompleteLinkVisualUpdate(link, link.material, time);
    }
  }

  // 4. Optional: collect stats
  const cascadeStats = cascadeSystem.getDebugStats();
  return cascadeStats;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function computeBaseLinkGlow(link) {
  // Your existing link glow computation
  // This is a placeholder—replace with your actual implementation
  const harmonyA = link.a?.harmony || 0;
  const harmonyB = link.b?.harmony || 0;
  const avgHarmony = (harmonyA + harmonyB) * 0.5;
  return 0.3 + avgHarmony * 0.4;
}

// ============================================================================
// EXPORT
// ============================================================================

export {
  exampleNodeAuraIntensity,
  exampleNodePulseModulation,
  exampleLinkGlowAmplification,
  exampleGlyphCascadeSync,
  exampleLayerAwareEffect,
  exampleMultiCascadeVisualization,
  exampleCompleteNodeVisualUpdate,
  exampleCompleteLinkVisualUpdate,
  exampleBatchNodeVisualUpdate,
  exampleMainRenderLoopIntegration
};
