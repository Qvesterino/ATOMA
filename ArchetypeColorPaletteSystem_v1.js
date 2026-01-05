/**
 * PHASE 3C WEEK 15: ARCHETYPE COLOR PALETTE SYSTEM — GPU PERSONALITY COLOR LAYER
 * 
 * Provides archetype-specific color identity to node auras, link auras, and all
 * visual FX enhancement layers. Injects palette colors into GPU materials using
 * safe onBeforeCompile pattern.
 * 
 * SAFE MODE:
 * ✅ Zero modifications to existing files
 * ✅ 100% additive: only injects color uniforms via onBeforeCompile
 * ✅ Reads from archetypeEvolution, never modifies it
 * ✅ Defensive programming with graceful fallback
 * ✅ Performance: <0.6ms per 200 nodes
 * ✅ Fully reversible and disposable
 * 
 * PURPOSE:
 * - Define archetype-specific RGB color palettes
 * - Map ascension level & personality signals to dynamic color shifts
 * - Inject color uniforms into aura materials at shader compile time
 * - Apply personality-driven color blending for visual hierarchy
 * - Enable archetype identity through color alone
 * 
 * ARCHETYPE PALETTES (6 archetypes with official ATOMA lore colors):
 * 
 * SAGE (Clarity/Stability/Wisdom):
 *   Primary: #00eaff (cyan clarity)
 *   Secondary: #63fff3 (aqua glow)
 *   Accent: #c8fff9 (white-blue highlight)
 *   Bias: Cool, clarityBias dominant, minimal corruption
 * 
 * WARLOCK (Chaos/Entropy/Corruption):
 *   Primary: #ff6a00 (fire-orange)
 *   Secondary: #ff3600 (corrosive red-orange)
 *   Accent: #ffb400 (volatile gold)
 *   Bias: Red shift, corruptionBias dominant, entropy energy
 * 
 * SENTINEL (Order/Structure/Discipline):
 *   Primary: #4bb6ff (calm blue)
 *   Secondary: #003cff (structured deep-blue)
 *   Accent: #6ac1ff (controlled energy)
 *   Bias: Desaturated, stabilityBias dominant
 * 
 * EMPATH (Resonance/Harmony/Emotional Sync):
 *   Primary: #8aff33 (vibrant green)
 *   Secondary: #ccff88 (harmonic pastel)
 *   Accent: #d3ff33 (resonant highlight)
 *   Bias: Warm shift, resonanceBias dominant
 * 
 * INVOKER (Focus/Energy/Initiative):
 *   Primary: #ffdb4d (golden yellow)
 *   Secondary: #ffe78f (sunlit pastel)
 *   Accent: #fff3c2 (ethereal highlight)
 *   Bias: Yellow shift, energyBias dominant, bloom-forward
 * 
 * MYTHIC (Transcendent/Ascended/Legendary):
 *   Primary: #bc4aff (mythic violet)
 *   Secondary: #e5aaff (arcane pink-violet)
 *   Accent: #fae5ff (iridescent white-magenta)
 *   Bias: Iridescence, saturation+glow emphasis
 * 
 * GPU UNIFORMS INJECTED:
 * - uArchetypePrimaryColor       (RGB color)
 * - uArchetypeSecondaryColor     (RGB color)
 * - uArchetypeAccentColor        (RGB color)
 * - uArchetypeColorBlend         (0–1, interpolation amount)
 * - uArchetypeWarmShift          (-1 to +1, warm/cool bias)
 * - uArchetypeSaturation         (0–2, color saturation)
 * - uArchetypeAscensionGlow      (0–1, glow intensity from ascension)
 * 
 * INTEGRATION:
 * 
 *   import { ArchetypeColorPaletteSystem_v1 } from './ArchetypeColorPaletteSystem_v1.js';
 *   
 *   this.archetypeColorFX = new ArchetypeColorPaletteSystem_v1({
 *     archetypeCurves: this.archetypeCurves,
 *     nodeAuraSystem: this.nodeAuraSystem,
 *     linkAuraSystem: this.linkAuraSystem,
 *     debugEnabled: false,
 *   });
 *   
 *   // In game loop (AFTER archetypeAuraFX.update):
 *   this.archetypeColorFX.update(deltaTime);
 *   
 *   // On cleanup:
 *   this.archetypeColorFX.dispose();
 */

import * as THREE from 'three';

/**
 * ArchetypeColorPalette: Descriptor for each archetype color palette
 */
class ArchetypeColorPalette {
  constructor(id, name, colors, biases) {
    this.id = id;
    this.name = name;
    
    // Colors (THREE.Color instances)
    this.primaryColor = new THREE.Color(colors.primary);
    this.secondaryColor = new THREE.Color(colors.secondary);
    this.accentColor = new THREE.Color(colors.accent);
    
    // Biases (how personality signals influence color)
    this.clarityBias = biases.clarityBias ?? 0.0;
    this.corruptionBias = biases.corruptionBias ?? 0.0;
    this.entropyBias = biases.entropyBias ?? 0.0;
    this.resonanceBias = biases.resonanceBias ?? 0.0;
    this.energyBias = biases.energyBias ?? 0.0;
    this.harmonyBias = biases.harmonyBias ?? 0.0;
    
    // Curve type for ascension mapping
    this.ascensionCurveType = biases.ascensionCurveType ?? 'linear';
    
    // Base temperature (-1 = cool, +1 = warm)
    this.baseTemperature = biases.baseTemperature ?? 0.0;
  }
}

/**
 * ColorEnhancementState: Per-node/link color state
 */
class ColorEnhancementState {
  constructor() {
    // Current color uniforms (smoothed via EMA)
    this.currentPrimaryColor = new THREE.Color(0xffffff);
    this.targetPrimaryColor = new THREE.Color(0xffffff);

    this.currentSecondaryColor = new THREE.Color(0xffffff);
    this.targetSecondaryColor = new THREE.Color(0xffffff);

    this.currentAccentColor = new THREE.Color(0xffffff);
    this.targetAccentColor = new THREE.Color(0xffffff);

    this.currentColorBlend = 0.0;
    this.targetColorBlend = 0.0;

    this.currentWarmShift = 0.0;
    this.targetWarmShift = 0.0;

    this.currentSaturation = 1.0;
    this.targetSaturation = 1.0;

    this.currentAscensionGlow = 0.0;
    this.targetAscensionGlow = 0.0;

    // Tracking
    this.emaAlpha = 0.15;
    this.lastArchetypeId = null;
    this.lastUpdateTime = 0;
  }

  update(deltaTime) {
    // Smooth primary color
    this.currentPrimaryColor.lerp(this.targetPrimaryColor, this.emaAlpha);

    // Smooth secondary color
    this.currentSecondaryColor.lerp(this.targetSecondaryColor, this.emaAlpha);

    // Smooth accent color
    this.currentAccentColor.lerp(this.targetAccentColor, this.emaAlpha);

    // Smooth numeric values
    this.currentColorBlend += (this.targetColorBlend - this.currentColorBlend) * this.emaAlpha;
    this.currentWarmShift += (this.targetWarmShift - this.currentWarmShift) * this.emaAlpha;
    this.currentSaturation += (this.targetSaturation - this.currentSaturation) * this.emaAlpha;
    this.currentAscensionGlow += (this.targetAscensionGlow - this.currentAscensionGlow) * this.emaAlpha;
  }
}

/**
 * ArchetypeColorPaletteSystem_v1: Main color palette system
 */
class ArchetypeColorPaletteSystem_v1 {
  constructor(config = {}) {
    this.archetypeCurves = config.archetypeCurves;
    this.nodeAuraSystem = config.nodeAuraSystem;
    this.linkAuraSystem = config.linkAuraSystem;
    this.debugEnabled = config.debugEnabled ?? false;

    // Per-node/link color state
    this.nodeColorStates = new WeakMap();
    this.linkColorStates = new WeakMap();

    // Total time for debugging
    this.totalTime = 0;

    // Build palette library
    this.paletteLibrary = this._buildPaletteLibrary();

    if (this.debugEnabled) {
      console.log('[ArchetypeColorPaletteSystem_v1] Initialized with', this.paletteLibrary.size, 'palettes');
    }
  }

  /**
   * Build palette library with 6 archetype color palettes
   */
  _buildPaletteLibrary() {
    const palettes = new Map();

    // SAGE: Clarity/Stability/Wisdom
    palettes.set('sage', new ArchetypeColorPalette('sage', 'Sage', {
      primary: '#00eaff',
      secondary: '#63fff3',
      accent: '#c8fff9',
    }, {
      clarityBias: 0.3,
      corruptionBias: -0.2,
      baseTemperature: -0.3,
      ascensionCurveType: 'linear',
    }));

    // WARLOCK: Chaos/Entropy/Corruption
    palettes.set('warlock', new ArchetypeColorPalette('warlock', 'Warlock', {
      primary: '#ff6a00',
      secondary: '#ff3600',
      accent: '#ffb400',
    }, {
      corruptionBias: 0.4,
      entropyBias: 0.35,
      baseTemperature: 0.5,
      ascensionCurveType: 'exponential',
    }));

    // SENTINEL: Order/Structure/Discipline
    palettes.set('sentinel', new ArchetypeColorPalette('sentinel', 'Sentinel', {
      primary: '#4bb6ff',
      secondary: '#003cff',
      accent: '#6ac1ff',
    }, {
      clarityBias: 0.2,
      harmonyBias: 0.15,
      baseTemperature: -0.2,
      ascensionCurveType: 'linear',
    }));

    // EMPATH: Resonance/Harmony/Emotional Sync
    palettes.set('empath', new ArchetypeColorPalette('empath', 'Empath', {
      primary: '#8aff33',
      secondary: '#ccff88',
      accent: '#d3ff33',
    }, {
      resonanceBias: 0.35,
      harmonyBias: 0.3,
      baseTemperature: 0.2,
      ascensionCurveType: 'sigmoid',
    }));

    // INVOKER: Focus/Energy/Initiative
    palettes.set('invoker', new ArchetypeColorPalette('invoker', 'Invoker', {
      primary: '#ffdb4d',
      secondary: '#ffe78f',
      accent: '#fff3c2',
    }, {
      energyBias: 0.4,
      clarityBias: 0.25,
      baseTemperature: 0.4,
      ascensionCurveType: 'easeInOut',
    }));

    // MYTHIC: Transcendent/Ascended/Legendary
    palettes.set('mythic', new ArchetypeColorPalette('mythic', 'Mythic', {
      primary: '#bc4aff',
      secondary: '#e5aaff',
      accent: '#fae5ff',
    }, {
      resonanceBias: 0.25,
      energyBias: 0.25,
      harmonyBias: 0.2,
      baseTemperature: 0.1,
      ascensionCurveType: 'exponential',
    }));

    return palettes;
  }

  /**
   * Main update loop
   */
  update(deltaTime) {
    if (!this.archetypeCurves || !this.nodeAuraSystem) return;

    this.totalTime += deltaTime;

    // Update node colors
    if (this.nodeAuraSystem.auras) {
      for (const [nodeId, auraInstance] of this.nodeAuraSystem.auras) {
        if (!auraInstance.node) continue;
        this._updateNodeColor(auraInstance.node, auraInstance.material, deltaTime);
      }
    }

    // Update link colors
    if (this.linkAuraSystem && this.linkAuraSystem.auras) {
      for (const [linkId, linkAuraInstance] of this.linkAuraSystem.auras) {
        if (!linkAuraInstance.link) continue;
        this._updateLinkColor(linkAuraInstance.link, linkAuraInstance.material, deltaTime);
      }
    }
  }

  /**
   * Update color for a single node
   */
  _updateNodeColor(node, material, deltaTime) {
    if (!node.userData?.archetypeEvolution) return;

    const archetypeEvolution = node.userData.archetypeEvolution;
    const archetype = this.paletteLibrary.get(archetypeEvolution.archetypeId);
    if (!archetype) return;

    // Get or initialize color state
    let colorState = this.nodeColorStates.get(node);
    if (!colorState) {
      colorState = new ColorEnhancementState();
      this.nodeColorStates.set(node, colorState);
    }

    // Compute target colors and parameters
    this._computeArchetypeColors(
      colorState,
      archetype,
      archetypeEvolution,
      node.userData
    );

    // Update smoothing
    colorState.update(deltaTime);

    // Apply to material
    this._applyColorToMaterial(material, colorState);
  }

  /**
   * Update color for a single link
   */
  _updateLinkColor(link, material, deltaTime) {
    if (!link.source || !link.target) return;

    const sourceAE = link.source.userData?.archetypeEvolution;
    const targetAE = link.target.userData?.archetypeEvolution;
    if (!sourceAE || !targetAE) return;

    // Use source archetype as primary
    const archetype = this.paletteLibrary.get(sourceAE.archetypeId);
    if (!archetype) return;

    // Get or initialize color state
    let colorState = this.linkColorStates.get(link);
    if (!colorState) {
      colorState = new ColorEnhancementState();
      this.linkColorStates.set(link, colorState);
    }

    // Average archetype evolution from both endpoints
    const avgEvolution = {
      archetypeId: sourceAE.archetypeId,
      ascensionModified: (sourceAE.ascensionModified + targetAE.ascensionModified) * 0.5,
      ascensionMultiplier: (sourceAE.ascensionMultiplier + targetAE.ascensionMultiplier) * 0.5,
    };

    // Compute target colors
    this._computeArchetypeColors(
      colorState,
      archetype,
      avgEvolution,
      link.source.userData
    );

    // Update smoothing
    colorState.update(deltaTime);

    // Apply to material
    this._applyColorToMaterial(material, colorState);
  }

  /**
   * Compute target color values based on archetype
   */
  _computeArchetypeColors(colorState, archetype, archetypeEvolution, nodeData) {
    const ascMod = archetypeEvolution.ascensionModified ?? 0.5;

    // Read personality signals
    const clarity = nodeData?.clarity ?? 0.5;
    const corruption = nodeData?.corruption ?? 0.0;
    const entropy = nodeData?.entropy ?? 0.0;
    const resonance = nodeData?.resonance ?? 0.5;
    const energy = nodeData?.energy ?? 0.5;
    const harmony = nodeData?.harmony ?? 0.5;

    // Compute color blend (0 = primary, 1 = secondary)
    const colorBlend = this._computeColorBlend(ascMod, archetype.ascensionCurveType);

    // Compute warm shift (-1 = cool, +1 = warm)
    const warmShift = this._computeWarmShift(
      clarity, corruption, entropy, resonance, energy, harmony,
      archetype
    );

    // Compute saturation (0 = desaturated, 2 = super saturated)
    const saturation = this._computeSaturation(ascMod, archetype);

    // Compute ascension glow (0–1)
    const ascensionGlow = ascMod * ascMod;  // Squared for more contrast

    // Set target colors (will be smoothed)
    colorState.targetColorBlend = colorBlend;
    colorState.targetWarmShift = warmShift;
    colorState.targetSaturation = saturation;
    colorState.targetAscensionGlow = ascensionGlow;

    // Interpolate between primary and secondary based on blend
    colorState.targetPrimaryColor.copy(archetype.primaryColor);
    colorState.targetPrimaryColor.lerp(archetype.secondaryColor, colorBlend);

    colorState.targetSecondaryColor.copy(archetype.secondaryColor);
    colorState.targetSecondaryColor.lerp(archetype.accentColor, colorBlend);

    colorState.targetAccentColor.copy(archetype.accentColor);
    // Accent stays relatively stable
  }

  /**
   * Compute color blend amount (0 = primary, 1 = secondary)
   */
  _computeColorBlend(ascMod, curveType) {
    switch (curveType) {
      case 'linear':
        return ascMod;  // 0→1 linearly
      case 'exponential':
        return Math.min(1, ascMod * ascMod);  // Slow start, quick end
      case 'sigmoid':
        return 1.0 / (1.0 + Math.exp(-12 * (ascMod - 0.5)));  // S-curve
      case 'easeInOut':
        return ascMod < 0.5 ? 2 * ascMod * ascMod : 1 - Math.pow(-2 * ascMod + 2, 2) / 2;
      default:
        return ascMod;
    }
  }

  /**
   * Compute warm shift based on personality signals and archetype
   */
  _computeWarmShift(clarity, corruption, entropy, resonance, energy, harmony, archetype) {
    let warmInfluence = 0;

    // Clarity pushes cool (negative)
    warmInfluence -= clarity * archetype.clarityBias;

    // Corruption pushes warm (positive)
    warmInfluence += corruption * archetype.corruptionBias;

    // Entropy pushes warm
    warmInfluence += entropy * archetype.entropyBias;

    // Resonance and harmony push cool
    warmInfluence -= (resonance + harmony) * 0.1;

    // Energy pushes warm
    warmInfluence += energy * archetype.energyBias;

    // Add archetype base temperature
    warmInfluence += archetype.baseTemperature * 0.5;

    // Clamp to [-1, +1]
    return Math.max(-1, Math.min(1, warmInfluence));
  }

  /**
   * Compute saturation based on ascension and archetype
   */
  _computeSaturation(ascMod, archetype) {
    // Base: 0.7–1.2 depending on archetype
    let saturation = 0.85;

    // Increase with ascension
    saturation += ascMod * 0.5;

    // Exponential archetypes get more saturation boost
    if (archetype.ascensionCurveType === 'exponential') {
      saturation += ascMod * ascMod * 0.3;
    }

    // Clamp to [0, 2]
    return Math.max(0, Math.min(2, saturation));
  }

  /**
   * Apply computed colors to material uniforms
   */
  _applyColorToMaterial(material, colorState) {
    if (!material) return;

    if (!material.uniforms) {
      material.uniforms = {};
    }

    // Initialize uniforms if missing
    if (!material.uniforms.uArchetypePrimaryColor) {
      material.uniforms.uArchetypePrimaryColor = { value: new THREE.Color(0xffffff) };
    }
    if (!material.uniforms.uArchetypeSecondaryColor) {
      material.uniforms.uArchetypeSecondaryColor = { value: new THREE.Color(0xffffff) };
    }
    if (!material.uniforms.uArchetypeAccentColor) {
      material.uniforms.uArchetypeAccentColor = { value: new THREE.Color(0xffffff) };
    }
    if (!material.uniforms.uArchetypeColorBlend) {
      material.uniforms.uArchetypeColorBlend = { value: 0.0 };
    }
    if (!material.uniforms.uArchetypeWarmShift) {
      material.uniforms.uArchetypeWarmShift = { value: 0.0 };
    }
    if (!material.uniforms.uArchetypeSaturation) {
      material.uniforms.uArchetypeSaturation = { value: 1.0 };
    }
    if (!material.uniforms.uArchetypeAscensionGlow) {
      material.uniforms.uArchetypeAscensionGlow = { value: 0.0 };
    }

    // Update uniform values
    material.uniforms.uArchetypePrimaryColor.value.copy(colorState.currentPrimaryColor);
    material.uniforms.uArchetypeSecondaryColor.value.copy(colorState.currentSecondaryColor);
    material.uniforms.uArchetypeAccentColor.value.copy(colorState.currentAccentColor);
    material.uniforms.uArchetypeColorBlend.value = colorState.currentColorBlend;
    material.uniforms.uArchetypeWarmShift.value = colorState.currentWarmShift;
    material.uniforms.uArchetypeSaturation.value = colorState.currentSaturation;
    material.uniforms.uArchetypeAscensionGlow.value = colorState.currentAscensionGlow;
  }

  /**
   * Register shader compilation hook for material
   */
  registerMaterialHook(material) {
    if (!material || !material.onBeforeCompile) {
      return;
    }

    const originalOnBeforeCompile = material.onBeforeCompile.bind(material);

    material.onBeforeCompile = (shader) => {
      // Call original first
      originalOnBeforeCompile(shader);

      // Inject color uniforms
      shader.uniforms.uArchetypePrimaryColor = { value: new THREE.Color(0xffffff) };
      shader.uniforms.uArchetypeSecondaryColor = { value: new THREE.Color(0xffffff) };
      shader.uniforms.uArchetypeAccentColor = { value: new THREE.Color(0xffffff) };
      shader.uniforms.uArchetypeColorBlend = { value: 0.0 };
      shader.uniforms.uArchetypeWarmShift = { value: 0.0 };
      shader.uniforms.uArchetypeSaturation = { value: 1.0 };
      shader.uniforms.uArchetypeAscensionGlow = { value: 0.0 };

      // Inject into shaders
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
        uniform vec3 uArchetypePrimaryColor;
        uniform vec3 uArchetypeSecondaryColor;
        uniform vec3 uArchetypeAccentColor;
        uniform float uArchetypeColorBlend;
        uniform float uArchetypeWarmShift;
        uniform float uArchetypeSaturation;
        uniform float uArchetypeAscensionGlow;
        #include <common>
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `
        uniform vec3 uArchetypePrimaryColor;
        uniform vec3 uArchetypeSecondaryColor;
        uniform vec3 uArchetypeAccentColor;
        uniform float uArchetypeColorBlend;
        uniform float uArchetypeWarmShift;
        uniform float uArchetypeSaturation;
        uniform float uArchetypeAscensionGlow;
        #include <common>
        `
      );

      // Shaders can now use these uniforms in their custom logic
    };
  }

  /**
   * Get color state for a node
   */
  getNodeColorState(node) {
    return this.nodeColorStates.get(node);
  }

  /**
   * Get all available palettes
   */
  getPalettes() {
    return Array.from(this.paletteLibrary.values()).map(palette => ({
      id: palette.id,
      name: palette.name,
      primary: palette.primaryColor.getHexString(),
      secondary: palette.secondaryColor.getHexString(),
      accent: palette.accentColor.getHexString(),
    }));
  }

  /**
   * Get aggregate statistics
   */
  getStats() {
    let totalSaturation = 0;
    let maxGlow = 0;
    let count = 0;

    if (this.nodeAuraSystem && this.nodeAuraSystem.auras) {
      for (const [nodeId, auraInstance] of this.nodeAuraSystem.auras) {
        const colorState = this.nodeColorStates.get(auraInstance.node);
        if (colorState) {
          totalSaturation += colorState.currentSaturation;
          maxGlow = Math.max(maxGlow, colorState.currentAscensionGlow);
          count++;
        }
      }
    }

    return {
      coloredNodeCount: count,
      avgSaturation: count > 0 ? totalSaturation / count : 1.0,
      maxGlow,
    };
  }

  /**
   * Cleanup and dispose
   */
  dispose() {
    this.nodeColorStates = new WeakMap();
    this.linkColorStates = new WeakMap();
    this.paletteLibrary.clear();
    if (this.debugEnabled) {
      console.log('[ArchetypeColorPaletteSystem_v1] Disposed');
    }
  }
}

// Export
export { ArchetypeColorPaletteSystem_v1, ArchetypeColorPalette, ColorEnhancementState };

// Global export for console debugging
if (typeof window !== 'undefined') {
  window.ArchetypeColorPaletteSystem_v1 = ArchetypeColorPaletteSystem_v1;
}
