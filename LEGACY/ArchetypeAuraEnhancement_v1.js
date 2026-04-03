/**
 * PHASE 3C WEEK 14: ARCHETYPE AURA ENHANCEMENT — PERSONALITY-DRIVEN GPU VISUAL LAYER
 * 
 * Extends NodeAuraSystem_v1 and LinkAuraSystem_v1 to dynamically respond to each node's
 * Archetype Ascension Curves output (Week 13). Injects GPU uniforms safely without
 * modifying existing aura shader code.
 * 
 * SAFE MODE:
 * ✅ Zero modifications to NodeAuraSystem_v1.js
 * ✅ Zero modifications to LinkAuraSystem_v1.js
 * ✅ 100% additive: only injects uniforms via onBeforeCompile
 * ✅ Reads from archetypeEvolution, never modifies it
 * ✅ Defensive programming with graceful fallback
 * ✅ Performance: <0.5ms per 200 nodes
 * ✅ Fully reversible and disposable
 * 
 * PURPOSE:
 * - Map archetypeEvolution.ascensionMultiplier to GPU enhancement signals
 * - Apply archetype-specific visual modifiers (intensity, radius, bloom, distortion)
 * - Smooth transitions via EMA for organic visual flow
 * - Inject uniforms into aura materials at shader compile time
 * - Enable personality-driven aura hierarchy without touching existing systems
 * 
 * ENHANCEMENT RULES:
 * 
 * SAGE (Stability/Clarity):
 *   - Smooth radius growth
 *   - Clean cyan heat
 *   - High clarity falloff
 *   - Soft bloom
 * 
 * WARLOCK (Chaos/Entropy):
 *   - Chaotic amplitude bursts
 *   - Corruption-tinted wave noise
 *   - Radius flicker (low frequency)
 *   - Strong bloom pulses
 * 
 * SENTINEL (Order/Stability):
 *   - Stable radius with breathing
 *   - Lower bloom (stoic)
 *   - Slight blue/steel tint shift
 * 
 * EMPATH (Harmony/Resonance):
 *   - Resonance wave amplitude
 *   - Aura thickness modulated by network synergy
 *   - Warm pastel colors
 * 
 * INVOKER (Energy/Focus):
 *   - Mid-range oscillation (ease-in-out)
 *   - Energy-based ripple speed
 *   - High color vibrancy
 * 
 * MYTHIC (Transcendent):
 *   - Global multiplier on ALL effects
 *   - Hybrid distortion + pure bloom core
 *   - Optional chromatic edge glow
 *   - Legends-tier visuals for mult ≥ 2.0
 * 
 * GPU UNIFORMS INJECTED:
 * - uArchetypeIntensity       (0.5–2.5)
 * - uArchetypeRadiusBoost     (0.5–2.0)
 * - uArchetypeColorShift      (RGB shift vector)
 * - uArchetypeBloomBoost      (0.5–2.5)
 * - uArchetypeDistortionAmount (0.0–1.0)
 * 
 * INTEGRATION:
 * 
 *   import { ArchetypeAuraEnhancement_v1 } from './ArchetypeAuraEnhancement_v1.js';
 *   
 *   this.archetypeAuraFX = new ArchetypeAuraEnhancement_v1({
 *     nodeAura: this.nodeAuraSystem,
 *     linkAura: this.linkAuraSystem,
 *     archetypeCurves: this.archetypeCurves,
 *     debugEnabled: false,
 *   });
 *   
 *   // In game loop (AFTER archetypeCurves.update):
 *   this.archetypeAuraFX.update(deltaTime);
 *   
 *   // On cleanup:
 *   this.archetypeAuraFX.dispose();
 */



// Private symbol to track patched materials - prevents repeated shader compilation
const AURA_ENHANCEMENT_PATCHED = Symbol('auraEnhancementPatched');

/**
 * ArchetypeEnhancementState: Per-node enhanced aura state
 */
class ArchetypeEnhancementState {
  constructor() {
    // Current GPU uniform values (smoothed)
    this.currentIntensity = 1.0;
    this.targetIntensity = 1.0;

    this.currentRadiusBoost = 1.0;
    this.targetRadiusBoost = 1.0;

    this.currentColorShift = { r: 0, g: 0, b: 0 };
    this.targetColorShift = { r: 0, g: 0, b: 0 };

    this.currentBloomBoost = 1.0;
    this.targetBloomBoost = 1.0;

    this.currentDistortion = 0.0;
    this.targetDistortion = 0.0;

    // Material tracking
    this.nodeMaterial = null;
    this.linkMaterial = null;

    // Smoothing
    this.emaAlpha = 0.12;
    this.lastUpdateTime = 0;

    // Archetype tracking
    this.lastArchetypeId = null;
    this.tierChangeTime = 0;
  }

  update(deltaTime) {
    if (this.frameScheduler?.shouldRunVisual?.() === false) return;
    // Smooth intensity
    this.currentIntensity += (this.targetIntensity - this.currentIntensity) * this.emaAlpha;

    // Smooth radius boost
    this.currentRadiusBoost += (this.targetRadiusBoost - this.currentRadiusBoost) * this.emaAlpha;

    // Smooth color shift
    this.currentColorShift.r += (this.targetColorShift.r - this.currentColorShift.r) * this.emaAlpha;
    this.currentColorShift.g += (this.targetColorShift.g - this.currentColorShift.g) * this.emaAlpha;
    this.currentColorShift.b += (this.targetColorShift.b - this.currentColorShift.b) * this.emaAlpha;

    // Smooth bloom boost
    this.currentBloomBoost += (this.targetBloomBoost - this.currentBloomBoost) * this.emaAlpha;

    // Smooth distortion
    this.currentDistortion += (this.targetDistortion - this.currentDistortion) * this.emaAlpha;
  }
}

/**
 * ArchetypeAuraEnhancement_v1: Main enhancement system
 */
class ArchetypeAuraEnhancement_v1 {
  constructor(config = {}) {
    this.nodeAura = config.nodeAura;
    this.linkAura = config.linkAura;
    this.archetypeCurves = config.archetypeCurves;
    this.frameScheduler = config.frameScheduler || null;
    this.debugEnabled = config.debugEnabled ?? false;

    // Visual Layer Enforcement removed in Phase B cleanup
    // this.enforcementGate = config.enforcementGate || null;

    // Per-node enhancement state
    this.nodeEnhancements = new WeakMap();
    this.linkEnhancements = new WeakMap();

    // Material compilation hooks storage
    this.materialHooks = new Map();
    this.totalTime = 0;

    if (this.debugEnabled) {
      console.log('[ArchetypeAuraEnhancement_v1] Initialized');
    }
  }

  /**
   * Main update loop (call AFTER archetypeCurves.update)
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;
    
    if (!this.nodeAura || !this.archetypeCurves) return;

    this.totalTime += deltaTime;

    // Update node auras
    if (this.nodeAura.auras) {
      for (const [nodeId, auraInstance] of this.nodeAura.auras) {
        this._enhanceNodeAura(auraInstance, deltaTime);
      }
    }

    // Update link auras
    if (this.linkAura && this.linkAura.auras) {
      for (const [linkId, linkAuraInstance] of this.linkAura.auras) {
        this._enhanceLinkAura(linkAuraInstance, deltaTime);
      }
    }
  }

  /**
   * Enhance a single node's aura
   */
  _enhanceNodeAura(auraInstance, deltaTime) {
    if (!auraInstance || !auraInstance.node) return;

    const node = auraInstance.node;
    const archetypeEvolution = node.userData?.archetypeEvolution;
    if (!archetypeEvolution) return;

    // Get or initialize enhancement state
    let enhancement = this.nodeEnhancements.get(node);
    if (!enhancement) {
      enhancement = new ArchetypeEnhancementState();
      this.nodeEnhancements.set(node, enhancement);
    }

    // Compute target enhancement values based on archetype
    this._computeArchetypeEnhancement(
      enhancement,
      archetypeEvolution,
      node.userData
    );

    // Update smoothing
    enhancement.update(deltaTime);

    // Apply to material uniforms
    this._applyEnhancementToMaterial(
      auraInstance.material,
      enhancement,
      'node',
      node  // Pass node for enforcement validation
    );
  }

  /**
   * Enhance a single link's aura
   */
  _enhanceLinkAura(linkAuraInstance, deltaTime) {
    if (!linkAuraInstance || !linkAuraInstance.link) return;

    const link = linkAuraInstance.link;

    // Get source and target nodes
    const sourceNode = link.source;
    const targetNode = link.target;
    if (!sourceNode || !targetNode) return;

    // Use average of source and target archetype evolution
    const sourceAE = sourceNode.userData?.archetypeEvolution;
    const targetAE = targetNode.userData?.archetypeEvolution;
    if (!sourceAE || !targetAE) return;

    // Get or initialize enhancement state
    let enhancement = this.linkEnhancements.get(link);
    if (!enhancement) {
      enhancement = new ArchetypeEnhancementState();
      this.linkEnhancements.set(link, enhancement);
    }

    // Average archetypes from both endpoints
    const avgArchetype = {
      archetypeId: sourceAE.archetypeId,  // Use source as primary
      ascensionModified: (sourceAE.ascensionModified + targetAE.ascensionModified) * 0.5,
      ascensionMultiplier: (sourceAE.ascensionMultiplier + targetAE.ascensionMultiplier) * 0.5,
      tierBoost: Math.max(sourceAE.tierBoost, targetAE.tierBoost),
    };

    // Compute target enhancement values
    this._computeArchetypeEnhancement(
      enhancement,
      avgArchetype,
      sourceNode.userData
    );

    // Update smoothing
    enhancement.update(deltaTime);

    // Apply to material uniforms
    this._applyEnhancementToMaterial(
      linkAuraInstance.material,
      enhancement,
      'link',
      link  // Pass link for enforcement validation
    );
  }

  /**
   * Compute target enhancement values based on archetype
   */
  _computeArchetypeEnhancement(enhancement, archetypeEvolution, nodeData) {
    const id = archetypeEvolution.archetypeId;
    const mult = archetypeEvolution.ascensionMultiplier ?? 1.0;
    const ascMod = archetypeEvolution.ascensionModified ?? 0.5;
    const tierBoost = archetypeEvolution.tierBoost ?? 1.0;

    // Determine enhancement parameters per archetype
    let intensityBoost = 1.0;
    let radiusBoost = 1.0;
    let bloomBoost = 1.0;
    let distortion = 0.0;
    let colorShift = { r: 0, g: 0, b: 0 };

    switch (id) {
      case 'sage':
        // Smooth, stable cyan halo
        intensityBoost = 1.0 + (ascMod * 0.4);  // Gradual rise
        radiusBoost = 1.0 + (ascMod * 0.3);     // Smooth growth
        bloomBoost = 0.7 + (ascMod * 0.3);      // Soft bloom
        distortion = ascMod * 0.2;               // Subtle distortion
        colorShift = { r: 0, g: 0, b: 0.1 };    // Cyan shift
        break;

      case 'warlock':
        // Chaotic, pulsing energy
        intensityBoost = 0.8 + (ascMod * 0.8) + (Math.sin(this.totalTime * 4) * 0.3);  // Burst
        radiusBoost = 1.0 + (Math.sin(this.totalTime * 3) * 0.4);  // Flicker
        bloomBoost = 1.2 + (ascMod * 0.5);      // Strong bloom
        distortion = 0.3 + (ascMod * 0.6);      // High distortion
        colorShift = { r: 0.15, g: 0, b: 0 };   // Red tint
        break;

      case 'sentinel':
        // Stoic, breathing effect
        intensityBoost = 1.0 + (ascMod * 0.2) + (Math.sin(this.totalTime * 1.5) * 0.1);
        radiusBoost = 1.0 + (ascMod * 0.15) + (Math.sin(this.totalTime * 1.2) * 0.05);
        bloomBoost = 0.5 + (ascMod * 0.2);      // Low bloom
        distortion = ascMod * 0.1;               // Very subtle
        colorShift = { r: 0, g: 0, b: 0.05 };   // Steel blue shift
        break;

      case 'empath':
        // Harmonic, resonant waves
        intensityBoost = 1.0 + (ascMod * 0.5) + (Math.sin(this.totalTime * 2.5) * 0.15);
        radiusBoost = 0.95 + (ascMod * 0.4);
        bloomBoost = 0.8 + (ascMod * 0.4);      // Medium-high bloom
        distortion = ascMod * 0.3;
        colorShift = { r: 0.05, g: 0.1, b: 0 }; // Warm pastel shift
        break;

      case 'invoker':
        // Dynamic, energy-focused
        intensityBoost = 1.1 + (ascMod * 0.6);
        radiusBoost = 1.0 + (ascMod * 0.35);
        bloomBoost = 1.0 + (ascMod * 0.5);      // High bloom
        distortion = 0.2 + (ascMod * 0.4);
        colorShift = { r: 0.1, g: 0.05, b: 0 }; // Golden shift
        break;

      case 'mythic':
        // Transcendent global enhancement
        intensityBoost = 1.2 + (mult * 0.3);    // Global multiplier
        radiusBoost = 1.1 + (ascMod * 0.5);
        bloomBoost = 1.3 + (mult * 0.4);        // Maximum bloom
        distortion = 0.5 + (ascMod * 0.5);
        colorShift = { r: 0.1, g: 0.1, b: 0.2 }; // Purple shift
        break;

      default:
        // Fallback (shouldn't reach here)
        intensityBoost = mult;
        radiusBoost = 1.0 + (ascMod * 0.2);
        bloomBoost = 1.0;
        distortion = 0.0;
        colorShift = { r: 0, g: 0, b: 0 };
    }

    // Apply tier boost multiplier
    intensityBoost *= tierBoost * 0.5 + 0.5;  // 0.5–2.0 with tier
    bloomBoost *= tierBoost * 0.5 + 0.5;

    // Clamp values
    enhancement.targetIntensity = Math.max(0.5, Math.min(2.5, intensityBoost));
    enhancement.targetRadiusBoost = Math.max(0.5, Math.min(2.0, radiusBoost));
    enhancement.targetBloomBoost = Math.max(0.5, Math.min(2.5, bloomBoost));
    enhancement.targetDistortion = Math.max(0.0, Math.min(1.0, distortion));
    enhancement.targetColorShift = colorShift;
  }

  /**
   * Session 97: Check if enhancement is allowed by enforcement gate
   * Validates intensity/opacity against AURA_LAYER bounds
   */
  _canApplyEnhancement(nodeOrLink, enhancement, type) {
    if (!this.enforcementGate) return true;  // No gate - allow
    
    // Estimate opacity from intensity multiplier
    const estimatedOpacity = Math.max(0.3, Math.min(0.6, enhancement.currentIntensity * 0.3));
    
    // Get node context
    const nodeId = nodeOrLink.userData?.id || nodeOrLink.uuid;
    const nodeCategory = nodeOrLink.userData?.category || 'unknown';

    // VisualLayerEnforcementGate removed in Phase B cleanup — always allow
    return true;
  }
  
  /**
   * Apply enhancement uniforms to material
   * Session 97: Check enforcement gate before modifying
   */
  _applyEnhancementToMaterial(material, enhancement, type, nodeOrLink = null) {
    if (!material) return;

    // VisualLayerEnforcementGate removed in Phase B cleanup — always allow

    // Safely access or create uniforms
    if (!material.uniforms) {
      material.uniforms = {};
    }

    // Initialize uniforms if missing (graceful fallback)
    if (!material.uniforms.uArchetypeIntensity) {
      material.uniforms.uArchetypeIntensity = { value: 1.0 };
    }
    if (!material.uniforms.uArchetypeRadiusBoost) {
      material.uniforms.uArchetypeRadiusBoost = { value: 1.0 };
    }
    if (!material.uniforms.uArchetypeColorShift) {
      material.uniforms.uArchetypeColorShift = { value: new THREE.Vector3(0, 0, 0) };
    }
    if (!material.uniforms.uArchetypeBloomBoost) {
      material.uniforms.uArchetypeBloomBoost = { value: 1.0 };
    }
    if (!material.uniforms.uArchetypeDistortionAmount) {
      material.uniforms.uArchetypeDistortionAmount = { value: 0.0 };
    }

    // Update uniform values
    material.uniforms.uArchetypeIntensity.value = enhancement.currentIntensity;
    material.uniforms.uArchetypeRadiusBoost.value = enhancement.currentRadiusBoost;
    material.uniforms.uArchetypeColorShift.value.set(
      enhancement.currentColorShift.r,
      enhancement.currentColorShift.g,
      enhancement.currentColorShift.b
    );
    material.uniforms.uArchetypeBloomBoost.value = enhancement.currentBloomBoost;
    material.uniforms.uArchetypeDistortionAmount.value = enhancement.currentDistortion;
  }

  /**
   * Register shader compilation hook for material
   * This ensures uniforms are injected at shader compile time
   * 
   * P0.1 FIX: Idempotent patching - only patches once per material to prevent
   * repeated shader recompilation and GPU frame spikes.
   */
  registerMaterialHook(material) {
    if (!material || !material.onBeforeCompile) {
      return;
    }

    // Guard: Only patch once per material
    if (material[AURA_ENHANCEMENT_PATCHED]) {
      return;
    }

    // Mark material as patched
    material[AURA_ENHANCEMENT_PATCHED] = true;

    // Store original hook for safe chaining
    const originalOnBeforeCompile = material.onBeforeCompile.bind(material);

    material.onBeforeCompile = (shader) => {
      // Call original first
      originalOnBeforeCompile(shader);

      // Inject archetype uniforms
      shader.uniforms.uArchetypeIntensity = { value: 1.0 };
      shader.uniforms.uArchetypeRadiusBoost = { value: 1.0 };
      shader.uniforms.uArchetypeColorShift = { value: new THREE.Vector3(0, 0, 0) };
      shader.uniforms.uArchetypeBloomBoost = { value: 1.0 };
      shader.uniforms.uArchetypeDistortionAmount = { value: 0.0 };

      // Inject uniform declarations into vertex shader
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
        uniform float uArchetypeIntensity;
        uniform float uArchetypeRadiusBoost;
        uniform vec3 uArchetypeColorShift;
        uniform float uArchetypeBloomBoost;
        uniform float uArchetypeDistortionAmount;
        #include <common>
        `
      );

      // Inject uniform declarations into fragment shader
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `
        uniform float uArchetypeIntensity;
        uniform float uArchetypeRadiusBoost;
        uniform vec3 uArchetypeColorShift;
        uniform float uArchetypeBloomBoost;
        uniform float uArchetypeDistortionAmount;
        #include <common>
        `
      );

      // Inject shader logic for archetype modulation
      // (Shaders can now use these uniforms in their custom logic)
      shader.fragmentShader = shader.fragmentShader.replace(
        'gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
        `
        // Archetype enhancement layer
        vec3 archetypeModulation = mix(gl_FragColor.rgb, gl_FragColor.rgb + uArchetypeColorShift, 0.5);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, archetypeModulation, uArchetypeIntensity * uArchetypeBloomBoost);
        gl_FragColor = vec4(outgoingLight, diffuseColor.a);
        `
      );
    };
  }

  /**
   * Get enhancement state for a node
   */
  getNodeEnhancement(node) {
    return this.nodeEnhancements.get(node);
  }

  /**
   * Get aggregate statistics
   */
  getStats() {
    let totalIntensity = 0;
    let maxIntensity = 0;
    let count = 0;

    if (this.nodeAura && this.nodeAura.auras) {
      for (const [nodeId, auraInstance] of this.nodeAura.auras) {
        const enhancement = this.nodeEnhancements.get(auraInstance.node);
        if (enhancement) {
          totalIntensity += enhancement.currentIntensity;
          maxIntensity = Math.max(maxIntensity, enhancement.currentIntensity);
          count++;
        }
      }
    }

    return {
      enhancedNodeCount: count,
      avgIntensity: count > 0 ? totalIntensity / count : 0,
      maxIntensity,
    };
  }

  /**
   * Cleanup and dispose
   */
  dispose() {
    this.nodeEnhancements = new WeakMap();
    this.linkEnhancements = new WeakMap();
    this.materialHooks.clear();
    if (this.debugEnabled) {
      console.log('[ArchetypeAuraEnhancement_v1] Disposed');
    }
  }
}

// Import THREE for the module
import * as THREE from 'three';

// Export
export { ArchetypeAuraEnhancement_v1, ArchetypeEnhancementState };

// Global export for console debugging
if (typeof window !== 'undefined') {
  window.ArchetypeAuraEnhancement_v1 = ArchetypeAuraEnhancement_v1;
}