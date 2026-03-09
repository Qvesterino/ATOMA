/**
 * Link Directional Gradient Polish — Integration Examples
 * 
 * Complete working examples for applying subtle directional gradients
 * to various link rendering systems.
 */

// ============================================================================
// EXAMPLE 1: Basic Link Material Update
// ============================================================================
/**
 * Simplest integration: apply gradient to link material uniforms.
 * 
 * Effect: Links gradually shift from source (brighter/more saturated)
 * to target (slightly dimmer/desaturated) along their length.
 */

function exampleBasicLinkGradientUpdate(link, gradientPolish, position_t) {
  // Get gradient values at position t along link (0 → 1)
  const brightness = gradientPolish.getBrightnessMultiplier(link.id, position_t);
  const saturation = gradientPolish.getSaturationMultiplier(link.id, position_t);
  const emissiveBoost = gradientPolish.getEmissiveBoost(link.id, position_t);

  // Apply to material uniforms
  const material = link.material;
  if (material?.uniforms) {
    if (material.uniforms.uBrightnessMultiplier) {
      material.uniforms.uBrightnessMultiplier.value = brightness;
    }
    if (material.uniforms.uSaturationMultiplier) {
      material.uniforms.uSaturationMultiplier.value = saturation;
    }
    if (material.uniforms.uEmissiveBoost) {
      material.uniforms.uEmissiveBoost.value = emissiveBoost;
    }
  }

  return {
    brightness,
    saturation,
    emissiveBoost
  };
}

// Usage:
// ─────────────────────────────────────────────────────────────
// for (let segment = 0; segment < link.segments; segment++) {
//   const t = segment / link.segments;
//   exampleBasicLinkGradientUpdate(link, gradientPolish, t);
// }

// ============================================================================
// EXAMPLE 2: Vertex Color Application
// ============================================================================
/**
 * Apply gradient to vertex colors for smooth per-vertex gradation.
 * 
 * Effect: Each vertex along the link gets a slightly different color
 * multiplier, creating smooth gradient from source to target.
 */

function exampleVertexColorGradientApplication(link, gradientPolish) {
  const geometry = link.geometry;
  if (!geometry?.attributes?.color) {
    console.warn('Link geometry lacks color attribute');
    return false;
  }

  const colors = geometry.attributes.color.array;
  const positionArray = geometry.attributes.position.array;
  
  if (!positionArray) return false;

  // Determine link direction for t parameter calculation
  const numVertices = positionArray.length / 3;

  for (let i = 0; i < numVertices; i++) {
    // Estimate t parameter based on vertex index
    const t = i / (numVertices - 1);

    // Get gradient at this position
    const gradient = gradientPolish.getGradientAtT(link.id, t);
    if (!gradient) continue;

    // Apply gradient to vertex color
    const colorIndex = i * 3;
    colors[colorIndex] *= gradient.brightness * gradient.saturation;     // R
    colors[colorIndex + 1] *= gradient.brightness * gradient.saturation; // G
    colors[colorIndex + 2] *= gradient.brightness * gradient.saturation; // B
  }

  geometry.attributes.color.needsUpdate = true;
  return true;
}

// ============================================================================
// EXAMPLE 3: Per-Segment Gradient for Curve Rendering
// ============================================================================
/**
 * Apply gradient to each segment of a curved link.
 * 
 * For links rendered as curves (Catmull-Rom, Bezier, etc.),
 * apply gradient based on parameterization.
 */

function exampleCurveSegmentGradientApplication(link, gradientPolish, curvePoints) {
  if (!curvePoints || curvePoints.length < 2) return [];

  const segmentGradients = [];

  for (let i = 0; i < curvePoints.length - 1; i++) {
    // Parameterize this segment
    const t = i / (curvePoints.length - 1);

    // Get gradient
    const gradient = gradientPolish.getGradientAtT(link.id, t);
    if (!gradient) continue;

    segmentGradients.push({
      segmentIndex: i,
      t: t,
      brightness: gradient.brightness,
      saturation: gradient.saturation,
      emissiveBoost: gradient.emissiveBoost,
      point: curvePoints[i]
    });
  }

  return segmentGradients;
}

// Usage:
// ─────────────────────────────────────────────────────────────
// const segments = exampleCurveSegmentGradientApplication(link, gradientPolish, link.curvePoints);
// for (const seg of segments) {
//   drawSegmentWithGradient(seg.point, seg.brightness, seg.saturation);
// }

// ============================================================================
// EXAMPLE 4: Emissive Boost for Particle Emission
// ============================================================================
/**
 * Use emissive boost to drive particle emission rates.
 * 
 * Effect: Source side has higher emissive boost → emit more particles
 * Target side has lower boost → fewer particles
 * Creates visual flow of "particles streaming" along link.
 */

function exampleParticleEmissionBiasFromGradient(link, gradientPolish, particleSystem) {
  // Get gradient at source and target
  const sourceGradient = gradientPolish.getGradientAtT(link.id, 0);
  const midGradient = gradientPolish.getGradientAtT(link.id, 0.5);
  const targetGradient = gradientPolish.getGradientAtT(link.id, 1);

  if (!sourceGradient || !midGradient || !targetGradient) return false;

  // Compute emission distribution along link
  const sourceEmissionRate = 0.5 + sourceGradient.emissiveBoost * 10;
  const midEmissionRate = 0.5 + midGradient.emissiveBoost * 10;
  const targetEmissionRate = 0.5 + targetGradient.emissiveBoost * 10;

  // Apply to particle system
  if (particleSystem) {
    particleSystem.setEmissionBias(link.id, {
      source: Math.max(0, sourceEmissionRate),
      mid: Math.max(0, midEmissionRate),
      target: Math.max(0, targetEmissionRate)
    });
  }

  return true;
}

// ============================================================================
// EXAMPLE 5: State-Aware Link Rendering with Gradient
// ============================================================================
/**
 * Complete link rendering example that considers:
 * - Base link color
 * - Gradient polish
 * - Link state (harmony/corruption/synergy)
 */

function exampleStateAwareLinkRenderingWithGradient(link, gradientPolish, time) {
  // Get base link properties
  const baseColor = link.color || new (typeof THREE !== 'undefined' ? 
    THREE.Color : class { setHex() {} })().setHex(0x00ccff);
  
  const harmony = link.harmony || 0.5;
  const synergy = link.userData?.synergy?.score ?? link?.synergyScore ?? 0.5;
  const corruption = link.corruption || 0;

  // Get gradient info
  const gradientInfo = gradientPolish.getGradientInfo(link.id);
  if (!gradientInfo) return baseColor;

  const { finalStrength } = gradientInfo;

  // Compute effective color along link
  const result = {
    sourceColor: baseColor.clone(),
    midColor: baseColor.clone(),
    targetColor: baseColor.clone()
  };

  // Apply gradient modulation
  result.sourceColor.multiplyScalar(1 + finalStrength * 0.5);
  result.midColor.multiplyScalar(1.0);
  result.targetColor.multiplyScalar(1 - finalStrength * 0.2);

  // Apply state-aware desaturation for corruption
  if (corruption > 0.3) {
    const desaturation = corruption * 0.3;
    result.sourceColor.lerp(
      new (baseColor.constructor)().setHSL(0, 0, result.sourceColor.getBrightness()),
      desaturation
    );
    result.targetColor.lerp(
      new (baseColor.constructor)().setHSL(0, 0, result.targetColor.getBrightness()),
      desaturation
    );
  }

  return result;
}

// ============================================================================
// EXAMPLE 6: Batch Link Rendering with Gradient
// ============================================================================
/**
 * Efficient batch rendering for many links with gradient polish.
 * 
 * Updates gradient for all links in one pass, then applies to materials.
 */

function exampleBatchLinkGradientRendering(links, gradientPolish) {
  const updatedLinks = [];

  for (const link of links) {
    // Skip inactive links
    if (!link.active && !link.mesh) continue;

    // Get gradient info
    const gradientInfo = gradientPolish.getGradientInfo(link.id);
    if (!gradientInfo) continue;

    // Sample gradient at key points
    const sourceGradient = gradientPolish.getGradientAtT(link.id, 0);
    const midGradient = gradientPolish.getGradientAtT(link.id, 0.5);

    // Apply to material
    if (link.material?.uniforms) {
      link.material.uniforms.uGradientBrightness = { value: sourceGradient.brightness };
      link.material.uniforms.uGradientSaturation = { value: sourceGradient.saturation };
    }

    updatedLinks.push({
      linkId: link.id,
      gradientStrength: gradientInfo.finalStrength,
      synergy: gradientInfo.synergy,
      harmony: gradientInfo.harmony
    });
  }

  return updatedLinks;
}

// ============================================================================
// EXAMPLE 7: Gradient Debug Visualization
// ============================================================================
/**
 * Visualize gradients for debugging: draw gradient intensity as color.
 * 
 * Green = source side (bright)
 * Yellow = mid (neutral)
 * Red = target side (dim)
 */

function exampleDebugVisualizeGradient(link, gradientPolish, numSamples = 10) {
  const samples = [];

  for (let i = 0; i <= numSamples; i++) {
    const t = i / numSamples;
    const gradient = gradientPolish.getGradientAtT(link.id, t);

    if (!gradient) continue;

    // Map gradient to debug color
    let debugColor;
    if (t < 0.33) {
      // Source: green
      debugColor = `rgb(0, ${Math.floor(gradient.brightness * 255)}, 0)`;
    } else if (t < 0.66) {
      // Mid: yellow
      debugColor = `rgb(${Math.floor(gradient.brightness * 255)}, ${Math.floor(gradient.brightness * 255)}, 0)`;
    } else {
      // Target: red
      debugColor = `rgb(${Math.floor(gradient.brightness * 255)}, 0, 0)`;
    }

    samples.push({
      position_t: t,
      brightness: gradient.brightness,
      saturation: gradient.saturation,
      debugColor: debugColor
    });
  }

  return samples;
}

// Usage:
// ─────────────────────────────────────────────────────────────
// const samples = exampleDebugVisualizeGradient(link, gradientPolish);
// for (const sample of samples) {
//   console.log(`t=${sample.position_t.toFixed(2)}: ${sample.debugColor}`);
// }

// ============================================================================
// EXAMPLE 8: Gradient Parameter Tuning Helper
// ============================================================================
/**
 * Helper to adjust gradient parameters based on network state.
 */

function exampleTuneGradientForNetworkState(gradientPolish, network) {
  // Compute network statistics
  let avgSynergy = 0;
  let avgCorruption = 0;
  let linkCount = 0;

  for (const link of network.links || []) {
    avgSynergy += link.userData?.synergy?.score ?? link?.synergyScore ?? 0;
    avgCorruption += link.corruption || 0;
    linkCount++;
  }

  if (linkCount > 0) {
    avgSynergy /= linkCount;
    avgCorruption /= linkCount;
  }

  // Adaptive tuning
  if (avgSynergy > 0.7) {
    // High synergy network: make gradient more obvious
    gradientPolish.setGradientStrength(0.10, 0.14);
  } else if (avgSynergy < 0.3) {
    // Low synergy network: keep gradient subtle
    gradientPolish.setGradientStrength(0.06, 0.09);
  } else {
    // Normal network: default settings
    gradientPolish.setGradientStrength(0.08, 0.12);
  }

  if (avgCorruption > 0.6) {
    // High corruption: increase corruption flatteninig
    gradientPolish.setCorrectionFlatteningFactor(0.6);
  } else {
    // Normal: standard flatteninig
    gradientPolish.setCorrectionFlatteningFactor(0.5);
  }

  return {
    avgSynergy,
    avgCorruption,
    tuning: {
      baseGradient: gradientPolish.baseGradientStrength,
      maxGradient: gradientPolish.maxGradientStrength,
      corruptionFlatteninig: gradientPolish.corruptionFlatteningFactor
    }
  };
}

// ============================================================================
// EXAMPLE 9: Complete Link Visual Update Function
// ============================================================================
/**
 * All-in-one link visual update integrating gradient polish.
 */

function exampleCompleteLinksVisualUpdate(link, gradientPolish, time) {
  // 1. Get gradient info
  const gradientInfo = gradientPolish.getGradientInfo(link.id);
  if (!gradientInfo) return null;

  // 2. Sample gradient at key positions
  const samples = {
    source: gradientPolish.getGradientAtT(link.id, 0),
    quarter: gradientPolish.getGradientAtT(link.id, 0.25),
    mid: gradientPolish.getGradientAtT(link.id, 0.5),
    threeQuarter: gradientPolish.getGradientAtT(link.id, 0.75),
    target: gradientPolish.getGradientAtT(link.id, 1)
  };

  // 3. Apply to material
  const material = link.material;
  if (material?.uniforms) {
    // Use mid-link gradient as reference
    material.uniforms.uBrightnessMultiplier.value = samples.mid.brightness;
    material.uniforms.uSaturationMultiplier.value = samples.mid.saturation;
    
    // Store gradient strength for other systems
    material.userData.gradientStrength = gradientInfo.finalStrength;
  }

  // 4. Return complete state
  return {
    gradient: gradientInfo,
    samples: samples,
    applied: true
  };
}

// ============================================================================
// EXAMPLE 10: Main Render Loop Integration
// ============================================================================
/**
 * Integration point to be called from main render loop.
 */

function exampleMainRenderLoopLinkGradientIntegration(world, gradientPolish, time) {
  // 1. Update gradient system
  gradientPolish.update(time);

  // 2. Apply to all links
  if (world.network?.links) {
    for (const link of world.network.links) {
      if (!link.material) continue;

      // Get gradient at mid-link (representative)
      const midGradient = gradientPolish.getGradientAtT(link.id, 0.5);
      if (!midGradient) continue;

      // Apply modulation
      link.material.uniforms.uBrightnessMultiplier.value = midGradient.brightness;
      link.material.uniforms.uSaturationMultiplier.value = midGradient.saturation;
    }
  }

  // Optional: log stats
  const stats = gradientPolish.getDebugStats();
  return stats;
}

// ============================================================================
// EXPORT
// ============================================================================

export {
  exampleBasicLinkGradientUpdate,
  exampleVertexColorGradientApplication,
  exampleCurveSegmentGradientApplication,
  exampleParticleEmissionBiasFromGradient,
  exampleStateAwareLinkRenderingWithGradient,
  exampleBatchLinkGradientRendering,
  exampleDebugVisualizeGradient,
  exampleTuneGradientForNetworkState,
  exampleCompleteLinksVisualUpdate,
  exampleMainRenderLoopLinkGradientIntegration
};
