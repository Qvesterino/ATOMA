/**
 * VISUAL TEMPLATE REFERENCE IMPLEMENTATIONS
 * 
 * Three canonical visual template implementations that define approved patterns
 * for consuming derived metric signals in ATOMA visual systems.
 * 
 * These are reference implementations showing the ONLY approved patterns.
 * 
 * All future visual systems must conform to these templates.
 * Deviation requires architectural review.
 */

// ============================================================================
// TEMPLATE 1: SYNERGY GLOW (Canonical Reference)
// ============================================================================

/**
 * SynergyGlowReference: Canonical pattern for link quality visualization
 * 
 * Consumes: link.userData.visualSynergy [0, 1]
 * Produces: Link glow effect communicating structural quality
 * 
 * Pattern:
 * - Read-only derived signal access
 * - Smooth, continuous scaling
 * - No stat mutation
 * - No gameplay event triggering
 * - No feedback loops
 */
class SynergyGlowReference {
  constructor(link, material) {
    this.link = link;
    this.material = material;
    
    // Smoothing state (for secondary temporal smoothing)
    this.smoothedIntensity = 0;
    this.smoothedBrightness = 0;
  }
  
  /**
   * Update glow based on synergy signal
   * Call once per frame
   */
  update(deltaTime) {
    // ✅ CORRECT: Read derived signal only
    const synergySignal = this.link?.userData?.visualSynergy || 0;
    
    // ✅ CORRECT: Compute target values (no side effects)
    const targetIntensity = 0.3 + (synergySignal * 0.7);   // [0.3, 1.0]
    const targetBrightness = synergySignal * 2.0;          // [0, 2]
    
    // ✅ CORRECT: Apply secondary smoothing for stability
    const alpha = 0.15;  // Secondary smoothing
    this.smoothedIntensity += (targetIntensity - this.smoothedIntensity) * alpha;
    this.smoothedBrightness += (targetBrightness - this.smoothedBrightness) * alpha;
    
    // ✅ CORRECT: Apply only to shader uniforms (no state mutation)
    if (this.material?.uniforms) {
      this.material.uniforms.glowIntensity.value = this.smoothedIntensity;
      this.material.uniforms.glowBrightness.value = this.smoothedBrightness;
      
      // ✅ CORRECT: Breathing motion (synchronized)
      const breathePhase = (Date.now() * 0.001 * 1.2) % (2 * Math.PI);
      const breatheModulation = 1.0 + (Math.sin(breathePhase) * 0.05);
      this.material.uniforms.glowPulse.value = breatheModulation;
    }
    
    // ✅ CORRECT: Never write to userData
    // ✅ CORRECT: Never trigger events
    // ✅ CORRECT: Never read raw stats
    // ✅ CORRECT: Never mutate game state
  }
  
  /**
   * Example: ✗ WRONG patterns (for reference)
   */
  static examplesOfWrongPatterns() {
    return `
    // ✗ WRONG: Reading raw stat
    const intensity = link.userData.synergy * 2.0;
    
    // ✗ WRONG: Mixing signals
    const mixedColor = lerpColor(synergy, corruption, stress);
    
    // ✗ WRONG: Threshold-based pop
    glow.brightness = synergy > 0.5 ? 1.0 : 0.3;
    
    // ✗ WRONG: Event triggering
    if (synergy > threshold) { triggerEffect(); }
    
    // ✗ WRONG: Stat mutation
    link.userData.synergy = glow.intensity;
    
    // ✗ WRONG: Feedback loop
    if (glow.brightness > 0.8) { link.userData.synergy += 0.01; }
    `;
  }
}

// ============================================================================
// TEMPLATE 2: HARMONY AURA (Canonical Reference)
// ============================================================================

/**
 * HarmonyAuraReference: Canonical pattern for node stability visualization
 * 
 * Consumes: node.userData.visualHarmonyAura [0, 1]
 * Produces: Aura effect communicating healing potential and stability
 * 
 * Pattern:
 * - Read-only derived signal (includes intrinsic breathing)
 * - Preserve temporal motion (don't over-smooth)
 * - Soft, protective visual semantics
 * - No gameplay coupling
 */
class HarmonyAuraReference {
  constructor(node, auraMesh, material) {
    this.node = node;
    this.auraMesh = auraMesh;
    this.material = material;
    
    // Minimal smoothing (preserve intrinsic breathing)
    this.smoothedOpacity = 0;
  }
  
  /**
   * Update aura based on harmony signal
   * Call once per frame
   */
  update(deltaTime) {
    // ✅ CORRECT: Read derived signal (breathing already included)
    const harmonySignal = this.node?.userData?.visualHarmonyAura || 0;
    
    // ✅ CORRECT: Compute target values from signal
    const targetOpacity = harmonySignal;                    // Direct [0, 1]
    const targetRadius = 1.0 + (harmonySignal * 0.5);      // [1.0, 1.5]
    const targetGlow = 0.5 + (harmonySignal * 0.5);        // [0.5, 1.0]
    
    // ✅ CORRECT: Very light smoothing (preserve breathing)
    const alpha = 0.08;
    this.smoothedOpacity += (targetOpacity - this.smoothedOpacity) * alpha;
    
    // ✅ CORRECT: Apply to geometry and material
    if (this.auraMesh) {
      this.auraMesh.scale.set(targetRadius, targetRadius, targetRadius);
    }
    
    if (this.material?.uniforms) {
      this.material.uniforms.auraOpacity.value = this.smoothedOpacity;
      this.material.uniforms.glowStrength.value = targetGlow;
    }
    
    // ✅ CORRECT: Breathing oscillation is intrinsic (already in signal)
    // No need for additional temporal modulation
    
    // ✅ CORRECT: Never write to userData
    // ✅ CORRECT: Never trigger healing or events
    // ✅ CORRECT: Never read raw harmony
    // ✅ CORRECT: Never mutate game state
  }
  
  /**
   * Example: ✗ WRONG patterns (for reference)
   */
  static examplesOfWrongPatterns() {
    return `
    // ✗ WRONG: Reading raw harmony
    aura.opacity = node.userData.harmony * 1.5;
    
    // ✗ WRONG: Mixing with corruption
    if (harmony > 0.5 && corruption < 0.3) { aura.color = mixed; }
    
    // ✗ WRONG: Triggering healing
    if (aura.opacity > 0.7) { healNearbyLinks(); }
    
    // ✗ WRONG: Writing state
    node.userData.harmonyVisualStrength = aura.strength;
    
    // ✗ WRONG: Over-smoothing (destroys breathing)
    const alpha = 0.5;  // Too much smoothing
    
    // ✗ WRONG: Feedback mutation
    if (aura.strong) { node.userData.harmony += 0.01; }
    
    // ✗ WRONG: Threshold behavior
    aura.visible = harmony > 0.3;  // Creates pop
    `;
  }
}

// ============================================================================
// TEMPLATE 3: NETWORK STRESS TURBULENCE (Canonical Reference)
// ============================================================================

/**
 * NetworkStressTurbulenceReference: Canonical pattern for global chaos visualization
 * 
 * Consumes: window.__ATOMA_METRICS.interpretation.network.stressVisualizationChaos [0, 1]
 * Produces: Environmental turbulence, jitter, particle effects
 * 
 * Pattern:
 * - Global signal consumption (not per-node)
 * - Hysteresis smoothing (fast rise, slow decay)
 * - Chaotic, non-synchronized motion
 * - No damage effects or color shifting to red
 */
class NetworkStressTurbulenceReference {
  constructor(scene, nodes, particleSystem) {
    this.scene = scene;
    this.nodes = nodes;
    this.particleSystem = particleSystem;
    
    // Hysteresis state (not simple EMA)
    this.smoothedChaos = 0;
  }
  
  /**
   * Update turbulence based on network stress signal
   * Call once per frame
   */
  update(deltaTime) {
    // ✅ CORRECT: Read global network stress signal
    const stressSignal = 
      window.__ATOMA_METRICS?.interpretation?.network?.stressVisualizationChaos || 0;
    
    // ✅ CORRECT: Apply HYSTERESIS (not simple smoothing)
    // Fast rise (responsive), slow decay (models inertia)
    const riseRate = 0.5;
    const decayRate = 0.05;
    
    if (stressSignal > this.smoothedChaos) {
      // Quick response to increasing stress
      this.smoothedChaos = Math.min(
        1.0,
        this.smoothedChaos + (stressSignal - this.smoothedChaos) * riseRate * deltaTime
      );
    } else {
      // Slow recovery when stress reduces
      this.smoothedChaos = Math.max(
        stressSignal,
        this.smoothedChaos * (1.0 - decayRate * deltaTime)
      );
    }
    
    const chaos = this.smoothedChaos;
    
    // ✅ CORRECT: Compute turbulence parameters
    const jitterAmount = chaos * 0.4;           // [0, 40%] position jitter
    const particleDensity = chaos * 500;        // [0, 500] particles
    const distortionAmount = chaos * 0.5;       // [0, 50%] distortion
    
    // ✅ CORRECT: Apply jitter to nodes (chaotic, not synchronized)
    for (const node of (this.nodes || [])) {
      if (!node) continue;
      
      const jitterX = this._randomInRange(-jitterAmount, jitterAmount);
      const jitterY = this._randomInRange(-jitterAmount, jitterAmount);
      const jitterZ = this._randomInRange(-jitterAmount, jitterAmount);
      
      node.userData.jitterOffset = { x: jitterX, y: jitterY, z: jitterZ };
    }
    
    // ✅ CORRECT: Emit particles based on stress (random bursts)
    const emissionRate = particleDensity;
    if (Math.random() < emissionRate * deltaTime * 0.01) {
      this.particleSystem?.emitChaosParticle?.(chaos);
    }
    
    // ✅ CORRECT: Global shader distortion
    if (this.scene?.userData) {
      this.scene.userData.stressTurbulenceIntensity = distortionAmount;
    }
    
    // ✅ CORRECT: Never write to userData stats
    // ✅ CORRECT: Never trigger damage or healing
    // ✅ CORRECT: Never mutate game state
    // ✅ CORRECT: Never read per-node corruption
  }
  
  _randomInRange(min, max) {
    return min + Math.random() * (max - min);
  }
  
  /**
   * Example: ✗ WRONG patterns (for reference)
   */
  static examplesOfWrongPatterns() {
    return `
    // ✗ WRONG: Reading per-node corruption for global effect
    const chaos = mean(nodes.map(n => n.userData.visualCorruptionChaos));
    
    // ✗ WRONG: Computing stress from raw stats
    const overloadRatio = countOverloaded() / nodeCount;
    turbulence.intensity = overloadRatio;
    
    // ✗ WRONG: Stress triggering gameplay effects
    if (stress > 0.8) { damageAllLinks(0.1); }
    
    // ✗ WRONG: Simple EMA smoothing (violates hysteresis)
    smoothedStress = stress * 0.1 + smoothedStress * 0.9;
    
    // ✗ WRONG: Synchronized motion (should be chaotic)
    nodes.forEach(n => {
      n.position.y += sin(time * 1.0) * stress;
    });
    
    // ✗ WRONG: Color shifting to red (implies damage)
    turbulenceColor = lerpColor(blue, red, stress);
    
    // ✗ WRONG: Threshold-based visibility
    turbulenceVisible = stress > 0.5;  // Creates pop
    
    // ✗ WRONG: Stat mutation
    nodes.forEach(n => {
      n.userData.corruption += stress * 0.01;
    });
    `;
  }
}

// ============================================================================
// AUDIT & VERIFICATION HELPERS
// ============================================================================

/**
 * TemplateConformanceValidator: Verify a visual system conforms to templates
 */
class TemplateConformanceValidator {
  /**
   * Check if a component uses only derived signals
   */
  static validateSignalAccess(component, code) {
    const violations = [];
    
    // Check for raw stat access
    const rawStatPatterns = [
      /\.userData\.synergy\b/,
      /\.userData\.harmony\b/,
      /\.userData\.corruption\b/,
      /\.userData\.integrity\b/,
      /\.userData\.networkStress\b/
    ];
    
    for (const pattern of rawStatPatterns) {
      if (pattern.test(code)) {
        violations.push(`Found raw stat access: ${pattern}`);
      }
    }
    
    // Check for derived signal usage
    const derivedSignalPatterns = [
      /visualSynergy/,
      /visualHarmonyAura/,
      /visualCorruptionChaos/,
      /visualIntegrity/,
      /stressVisualizationChaos/
    ];
    
    let hasDerivedSignal = false;
    for (const pattern of derivedSignalPatterns) {
      if (pattern.test(code)) {
        hasDerivedSignal = true;
        break;
      }
    }
    
    return {
      conformant: violations.length === 0 && hasDerivedSignal,
      violations,
      usesDerivedSignals: hasDerivedSignal
    };
  }
  
  /**
   * Check for forbidden patterns
   */
  static validateForbiddenPatterns(code) {
    const forbidden = [];
    
    // Check for stat mutations
    if (/\.userData\.(synergy|harmony|corruption|integrity|networkStress)\s*=/.test(code)) {
      forbidden.push('Stat mutation detected (CRITICAL)');
    }
    
    // Check for feedback loops
    if (/if\s*\(.*glow|aura|chaos.*\)\s*{[\s\S]*?(userData|mutation)/.test(code)) {
      forbidden.push('Potential feedback loop detected');
    }
    
    // Check for threshold-based pops
    if (/>\s*[0-9.]+\s*\?\s*[0-9.]+\s*:\s*[0-9.]+/.test(code)) {
      forbidden.push('Threshold-based pop behavior (use smooth scaling)');
    }
    
    // Check for event triggering
    if (/(triggerEffect|triggerEvent|trigger|damage|heal)\s*\(/.test(code)) {
      forbidden.push('Visual system triggering gameplay events (forbidden)');
    }
    
    return {
      conformant: forbidden.length === 0,
      violations: forbidden
    };
  }
  
  /**
   * Full conformance check
   */
  static checkConformance(componentName, code) {
    const signalCheck = this.validateSignalAccess(componentName, code);
    const forbiddenCheck = this.validateForbiddenPatterns(code);
    
    return {
      component: componentName,
      conformant: signalCheck.conformant && forbiddenCheck.conformant,
      signalAccess: signalCheck,
      forbidden: forbiddenCheck,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Setup console API for template verification
 */
function setupTemplateConsoleAPI() {
  if (typeof window === 'undefined') return;
  
  window.__ATOMA_VISUAL_TEMPLATES = {
    SynergyGlow: SynergyGlowReference,
    HarmonyAura: HarmonyAuraReference,
    StressTurbulence: NetworkStressTurbulenceReference,
    Validator: TemplateConformanceValidator,
    
    // Quick validation
    validateCode: (name, code) => 
      TemplateConformanceValidator.checkConformance(name, code),
    
    // Example patterns
    getWrongPatterns: (template) => {
      const templates = {
        synergy: () => SynergyGlowReference.examplesOfWrongPatterns(),
        harmony: () => HarmonyAuraReference.examplesOfWrongPatterns(),
        stress: () => NetworkStressTurbulenceReference.examplesOfWrongPatterns()
      };
      return templates[template?.toLowerCase()]?.() || 'Unknown template';
    }
  };
  
  console.log('[VisualTemplates] Console API ready: window.__ATOMA_VISUAL_TEMPLATES');
}

// Export everything
export {
  SynergyGlowReference,
  HarmonyAuraReference,
  NetworkStressTurbulenceReference,
  TemplateConformanceValidator,
  setupTemplateConsoleAPI
};
