# SUPERNATURAL VFX UPGRADE PLAN

**Date**: 2026-04-20  
**Scope**: MEDIUM-HIGH (2 subsystems, visual-only, no gameplay mutations)  
**Mode**: EVOLUTION_V2 — Controlled Innovation  

---

## Overview

Two VFX systems selected for supernatural design upgrade:

1. **WaveInterferencePatternSystem** → "Prismatic Holographic Interference"
2. **ResonanceRuptureVisualSystem** → "Dimensional Rift Fracture"

Both are visual-only systems. No gameplay mutations. No metric changes. Pure aesthetic evolution.

---

## System 1: WaveInterferencePatternSystem → Prismatic Holographic Interference

### Current State
- 4-layer group: core sphere + wireframe icosahedron shell + cone spikes + torus pulse ring
- Materials: `MeshBasicMaterial` with additive blending
- Colors: Cyan-white constructive, dark blue-grey destructive
- Animation: Beat frequency modulation, lifecycle fade, network state modulation
- Pool: 50 items max, 15 concurrent

### Upgrade: Prismatic Holographic Interference

**Concept**: Transform from solid geometric shapes into prismatic, holographic light phenomena. Wave interference should look like dimensional membranes where physics becomes visible as spectral light — like oil-on-water iridescence meets aurora borealis.

#### Visual Layers (replacing current 4-layer group)

**Layer 1: Iridescent Core → Spectral Orb**
- Replace: Solid sphere → Custom `ShaderMaterial` with thin-film interference simulation
- Effect: The core cycles through spectral colors based on viewing angle (Fresnel iridescence) and beat frequency
- Colors shift from cyan → magenta → gold → emerald based on phase relationship
- Constructive: Warm spectral bloom (gold-white center with rainbow halo)
- Destructive: Cool spectral void (deep indigo with dark rainbow edges)
- Shader: Fresnel-based hue rotation + thin-film thickness modulation from beat frequency

**Layer 2: Wireframe Shell → Holographic Membrane**
- Replace: Wireframe icosahedron → Semi-transparent `ShaderMaterial` sphere with holographic diffraction
- Effect: Shows thin-film interference patterns — rainbow bands that flow across the surface
- The membrane breathes with beat frequency, expanding/contracting organically
- Constructive: Bright, alive, flowing rainbow bands
- Destructive: Dark, muted, barely-visible ghost patterns
- Shader: View-angle dependent spectral color + noise-based pattern flow

**Layer 3: Cone Spikes → Spectral Light Rays**
- Replace: Solid cone meshes → Elongated beam-like meshes with gradient shader
- Effect: Light rays refracting through a prism, cycling through spectral colors
- Each ray has a different spectral hue, creating a crown-of-light effect
- Rays pulse in length with beat frequency
- Constructive: Bright, warm spectral rays (gold → cyan → white)
- Destructive: Dim, cold spectral rays (indigo → violet → black)

**Layer 4: Torus Pulse → Aurora Ring**
- Replace: Basic torus → Custom `ShaderMaterial` ring with aurora-borealis flowing bands
- Effect: Organic, flowing color bands that circulate around the ring like aurora
- Colors flow and shift independently from the core
- Constructive: Bright aurora (green → cyan → white)
- Destructive: Dark aurora (deep purple → dark blue → black)

#### Shader Additions

```glsl
// Thin-film interference (iridescence)
float thinFilmColor(float angle, float thickness, float time) {
    // Simulates optical thin-film interference
    // Returns spectral hue based on viewing angle and film thickness
    float delta = thickness * cos(angle);
    float hue = fract(delta * 2.0 + time * 0.1);
    return hue; // Used in HSL conversion for spectral color
}

// Fresnel iridescence
vec3 fresnelIridescence(vec3 viewDir, vec3 normal, float thickness, float time) {
    float cosAngle = 1.0 - abs(dot(viewDir, normal));
    float hue = thinFilmColor(cosAngle, thickness, time);
    return hsl2rgb(hue, 0.85, 0.6);
}
```

#### Config Changes
- New shader uniforms: `uBeatPhase`, `uIridescenceThickness`, `uSpectralShift`
- Constructive color palette: Spectral rainbow (hue-rotated) instead of static cyan
- Destructive color palette: Dark spectral (desaturated rainbow) instead of static grey
- New params: `iridescenceStrength`, `spectralFlowSpeed`, `auroraBandCount`

---

## System 2: ResonanceRuptureVisualSystem → Dimensional Rift Fracture

### Current State
- Stress indicators: `ShaderMaterial` planes with pulsing red-orange glow
- Rupture bursts: `IcosahedronGeometry` with `MeshBasicMaterial` or fracture bloom scar roots
- Propagation pulses: `SphereGeometry` with `MeshBasicMaterial`
- Resonance scars: Points-based particle system (4 tiers, custom shader)
- Colors: Orange-red rupture, purple-bruise scars, neon red-orange stress

### Upgrade: Dimensional Rift Fracture

**Concept**: When standing waves rupture, it should look like the fabric of reality is being torn apart. Void energy seeps through dimensional cracks. The rupture is not an explosion — it's a dimensional breach. Stress shows reality thinning. Scars show where dimensions bled together.

#### Visual Upgrades

**1. Stress Indicators → Reality Strain**
- Upgrade the existing stress shader to show dimensional membrane thinning
- Add: Chromatic aberration effect at stress edges (RGB channel separation)
- Add: Spatial distortion simulation (warping UV coordinates based on stress)
- Add: Dark void hints at high stress (reality becoming transparent)
- Color evolution: Red-orange → Chromatic edges → Dark void center at critical stress
- New shader features:
  - `chromaticAberration()` — RGB channel offset based on stress
  - `spatialWarp()` — UV distortion based on distance from center
  - `voidReveal()` — Dark center appearing at high stress levels

**2. Rupture Burst → Dimensional Rift Tear**
- Replace: `IcosahedronGeometry` burst → Custom multi-layer rift effect
- New visual: 3-layer rift composition:
  - **Void Core**: Dark, almost black center with subtle deep purple energy swirling
  - **Chromatic Edge**: Rainbow refraction at the tear boundary (like light bending around a black hole)
  - **Energy Tendrils**: Bright spectral tendrils escaping through the rift
- The rift opens (scales up) with a tearing animation, not a spherical expansion
- Shape: Elongated along the link direction (not spherical) — like an actual tear
- Shader: Custom `ShaderMaterial` with:
  - Noise-based rift edge distortion
  - Chromatic dispersion at boundaries
  - Swirling void energy in center
  - Spectral tendrils using procedural noise

**3. Propagation Pulses → Void Energy Cascade**
- Replace: Basic sphere → Elongated energy tendril with chromatic edges
- Effect: Dark energy with bright spectral edges, organic tendril movement
- The pulse should look like void energy reaching through the network
- Leaves a brief reality-distortion wake
- Shader: Custom `ShaderMaterial` with:
  - Dark core with bright chromatic edge
  - Organic noise-based shape distortion
  - Trail fade with spectral color shift

**4. Resonance Scars → Dimensional Scars**
- Upgrade: Existing particle system with new color/behavior tiers
- New particle tiers:
  - **Void particles**: Dark purple-black with chromatic edges (replaces some red particles)
  - **Ghost particles**: Semi-transparent, flickering in/out of existence
  - **Spectral remnants**: Rainbow-tinted particles that shift color over time
- Scar behavior:
  - Particles flicker between visible and invisible (dimensional instability)
  - Chromatic edges shift hue over the scar's lifetime
  - Subtle spatial distortion around the scar (particles drift in impossible directions)
- Color evolution over lifetime: Bright spectral → Ghost-like ethereal → Fading dimension tear

#### Shader Additions

```glsl
// Chromatic aberration for stress/rupture
vec3 chromaticAberration(sampler2D tex, vec2 uv, float offset) {
    float r = texture2D(tex, uv + vec2(offset, 0.0)).r;
    float g = texture2D(tex, uv).g;
    float b = texture2D(tex, uv - vec2(offset, 0.0)).b;
    return vec3(r, g, b);
}

// Rift edge distortion
float riftEdge(vec2 uv, float time, float intensity) {
    float noise = snoise(uv * 3.0 + time * 0.5);
    float edge = smoothstep(0.4, 0.6, length(uv) + noise * intensity);
    return edge;
}

// Void energy swirl
vec3 voidEnergy(vec2 uv, float time) {
    float angle = atan(uv.y, uv.x) + time * 0.3;
    float dist = length(uv);
    float swirl = sin(angle * 3.0 + dist * 5.0 - time * 2.0) * 0.5 + 0.5;
    return mix(vec3(0.02, 0.0, 0.05), vec3(0.15, 0.0, 0.3), swirl);
}
```

#### Config Changes
- Stress shader: Add `uChromaticStrength`, `uVoidReveal` uniforms
- Rupture burst: Replace `IcosahedronGeometry` with rift mesh + custom shader
- Propagation: Replace `SphereGeometry` with elongated tendril mesh + custom shader
- Scars: New particle tier colors (void, ghost, spectral)
- New params: `riftChromaticEdge`, `voidEnergyIntensity`, `dimensionalInstability`

---

## Implementation Order

1. **Phase 1**: WaveInterferencePatternSystem — Prismatic Holographic Interference
   - Replace `_createInterferenceVisualItem()` with new shader-based layers
   - Add new shader code (iridescence, holographic membrane, spectral rays, aurora ring)
   - Update `_applyInterferenceMaterialState()` for new material types
   - Update config with new parameters

2. **Phase 2**: ResonanceRuptureVisualSystem — Dimensional Rift Fracture
   - Upgrade stress indicator shader (chromatic aberration, void reveal)
   - Replace rupture burst with dimensional rift effect
   - Upgrade propagation pulse visuals
   - Upgrade scar particle tiers

3. **Phase 3**: Polish & Verification
   - Verify both systems work together without conflicts
   - Check performance (<2ms per frame combined)
   - Ensure LOD still works
   - Verify pool recycling

---

## Performance Budget

- WaveInterferencePatternSystem: <1.5ms per frame (current: ~1ms)
- ResonanceRuptureVisualSystem: <2ms per frame (current: ~1.5ms)
- Combined: <3.5ms per frame
- Custom shaders should be GPU-efficient (no complex noise in fragment shader per-pixel)
- Use vertex shader for distortion where possible
- Keep pool sizes unchanged

---

## Risk Assessment

- **Risk**: Custom shaders may not work on all GPUs
- **Mitigation**: Fallback to current MeshBasicMaterial if shader compilation fails
- **Risk**: Performance regression from shader complexity
- **Mitigation**: Profile on target hardware, simplify shaders if needed
- **Risk**: Visual conflict with other systems
- **Mitigation**: Both systems are in `LAYER_LINK_RESONANCE`, additive blending — should compose well

---

## Files Modified

### Round 1
- `WaveInterferencePatternSystem_Session132.js` — Visual upgrade (Prismatic Holographic)
- `ResonanceRuptureVisualSystem_Session133.js` — Visual upgrade (Dimensional Rift)

### Round 2
- `CorruptionVisualFX_v1.js` — Visual upgrade (Void Reality Unraveling)
- `ColonyVFXManager.js` — Visual upgrade (Bioluminescent Alien Civilization)

- No changes to `main.js` (same API surface)
- No changes to gameplay systems

---

## Round 2: Additional Supernatural Upgrades

### System 3: CorruptionVisualFX → Void Reality Unraveling

**Current State**: ShaderMaterial with warp-stripe distortion, directional creep mask, magenta glow particles. Functional but flat.

**Upgrade**: Transform corruption from "red tint + stripes" into a reality-unraveling void phenomenon. Matter dissolves into spectral components, void energy pulses consume light, and organic decay tendrils crawl across surfaces.

#### Shader Upgrades (applyCorruption)

**Layer 1**: Original warp-stripe distortion (preserved for compatibility)

**Layer 2: Chromatic Dissolution** — RGB channel separation at high corruption. Matter breaks into spectral components with directional chromatic shift proportional to corruption².

**Layer 3: Void Energy Pulsation** — Dark energy rhythmically consuming light. Radial void pulse from center, intensity = corruption³. Deep purple-black void color.

**Layer 4: Spectral Decay Tendrils** — Organic noise-based decay patterns. 3D gradient noise creates tendril structures that shift through spectral hues. Smoothstep-bounded for organic look.

#### Rot Front Glow Upgrade
- Original magenta glow preserved as base
- Spectral chromatic edge: HSL color cycling at the rot boundary based on angle + time
- Void core energy: Deep purple-black consuming glow at the center of corruption

#### Particle System Upgrade
- Spectral void particle colors: HSL-based palette from magenta through spectral violet to void purple
- Void particles: At corruption > 0.7, some particles become deep void (dark, pulsing)
- Spectral color evolution: Particles shift hue during lifetime instead of simple fade
- Void particle behavior: Pulse between deep void and spectral edge

#### Master Switch
- All shader upgrades are always active (no toggle needed — corruption is inherently supernatural)

### System 4: ColonyVFXManager → Bioluminescent Alien Civilization

**Current State**: MeshStandardMaterial with muted palette (deepBlue, slate, indigo). Flat, geometric colony visuals. Plain soft-circle particle texture.

**Upgrade**: Transform colonies from flat geometric shapes into living bioluminescent alien organisms. Neural signal pathways pulse across organic surfaces, translucent membranes glow with spectral light, and bioluminescent spores orbit the colony.

#### Custom GLSL Shaders

**BIOLUMINESCENT_NUCLEUS_FRAGMENT**:
- Fresnel rim glow (bioluminescent glow strongest at edges)
- Neural signal pathways: 3D gradient noise creates organic vein patterns
- Secondary deep neural layer: slower, wider pulses
- Bioluminescent heartbeat pulse
- Spectral vein color: HSL shift based on signal position
- Organic subsurface scattering approximation

**BIOLUMINESCENT_MEMBRANE_FRAGMENT**:
- Translucent membrane with flowing cellular patterns
- Bioluminescent pulse through membrane
- Spectral edge glow with cool color shift at edges
- Additive blending for ethereal feel

**BIOLUMINESCENT_GLOW_FRAGMENT**:
- BackSide-rendered volumetric bioluminescent aura
- Depth-based volumetric glow
- Pulsing bioluminescent intensity with breathing rhythm

#### Upgraded Methods
- `createConsciousCore()`: Nucleus + membrane use ShaderMaterial when enabled
- `createCentralGlow()`: Bioluminescent volumetric glow shader
- `createParticleTexture()`: Radial glow with organic ring pattern (bioluminescent spore)
- `createParticles()`: Spectral spore colors with additive blending
- `updateCores()`: Shader uniform updates (uTime, uPulsePhase)
- `updateCentralGlows()`: Shader uniform updates

#### Master Switch
- `enableBioluminescentUpgrade: true` (default) — set to `false` for instant legacy rollback

#### Performance Notes
- All shaders use simple gradient noise (no heavy computation)
- No per-frame allocations
- Object pooling preserved
- Additive blending composes well with existing colony VFX

---

## Round 3: Mystical VFX Upgrades

### System 5: SynergyCascadeVisualizer → Spectral Cascade Convergence

**Current State**: 3211-line system with 6 visual types (wave front, cascade glow, flow particles, burst particles, ripple effects, harmonic shimmer). Uses warm amber/gold color scheme with MeshBasicMaterial particles and LineBasicMaterial ripples. 500+ particle pool, multiple ripple cooldown maps.

**Upgrade**: Transform cascade energy from warm amber into spectral dimensional energy — ethereal wisps of light flowing through the network like energy from another dimension.

#### Config Additions
- `spectralCascadeHue: 0.08` — Base hue for spectral cascade (warm gold)
- `spectralFlowHueSpread: 0.25` — How far flow particles spread across the spectrum
- `spectralBurstHue: 0.83` — Arcane burst hue (mystical violet)
- `spectralRippleHue: 0.55` — Dimensional ripple hue (celestial blue)
- `spectralSaturation: 0.85` — Spectral color saturation
- `spectralLightBase: 0.55` — Base lightness for spectral colors
- `enableSpectralUpgrade: true` — Master switch

#### Flow Particle Upgrade
- Particles cycle through spectral hues using HSL color generation
- Each particle gets a unique hue based on time + random spread
- Colors shift continuously as cascade propagates

#### Burst Particle Upgrade
- Forced bursts use mystical violet spectral colors
- Regular bursts use spectral cascade gold with random variation
- Colors shift over time for living, breathing effect

#### Ripple Upgrade
- Ripple rings use celestial blue spectral hue
- Colors shift with time for dimensional resonance feel
- Legacy fallback preserved when upgrade disabled

### System 6: HarmonicHealingVisualSystem → Ethereal Restoration Sanctum

**Current State**: Healing wave system with autonomous spawning, dramaturgy modulation, and cyan trail particles (`0x66f7ff`). Waves travel along links, emit trails via HealingParticleSystem.

**Upgrade**: Transform healing from simple cyan trails into a celestial restoration spectrum — divine light cycling through gold → white → celestial blue → emerald, like sacred light refracting through a prism.

#### Spectral Healing Colors
- `_spectralHealingHues: [0.12, 0.0, 0.55, 0.35]` — gold, white, celestial blue, emerald
- `_spectralHealingCycleSpeed: 0.15` — Spectrum cycling speed
- White flash: saturation drops to near-zero for celestial white moments
- Colors breathe with sinusoidal intensity modulation

#### Trail Color Cycling
- `_updateWaves()` now advances `_spectralHealingPhase` each frame
- Trail color smoothly interpolates between spectrum hues
- Each healing wave carries the current spectral color
- The entire network sees healing cycling through the celestial spectrum

#### Master Switch
- `enableEtherealUpgrade: true` (default) — set to `false` for legacy cyan trails

---

## Round 4: Ritual & Mystic VFX Upgrades

### System 7: Phase8RitualVisualOrchestration → Arcane Ritual Convergence

**Current State**: Ritual archetype profiles with clean digital colors (bright white, cyan, violet). Modulates existing visual templates during ritual phases (PRELUDE → ACTIVE → CREST → RELEASE). 5 archetypes: Ascension, Convergence, QuantumFracture, ChaosCeremony, MemoryEcho.

**Upgrade**: Transform all ritual profiles from clean digital aesthetics to deep arcane ceremonial palette — as if the network performs ancient rites beyond human comprehension.

#### Archetype Profile Upgrades
- **Ascension**: Sacred inner light (warm divine white), ancient parchment ring, ritual gold sigil, deep ceremonial teal atmosphere. Stronger ritual ribbons and divine halo.
- **Convergence**: Arcane convergence (medium slate blue), spectral white ring, medium purple sigil, ethereal lavender wash.
- **QuantumFracture**: Deep violet void fracture, indigo void ring, near-void black atmosphere. Intense void ribbons and powerful void flash.
- **ChaosCeremony**: Blood crimson core, ceremonial pink ring, dark magenta ritual sigil, deep ceremonial purple atmosphere. Intense chaotic ribbons.
- **MemoryEcho**: Dark turquoise ethereal memory, powder blue ring, light cyan ghost sigil, thistle atmosphere.
- **NEW: ArcaneRitual**: Sacred gold core, burgundy ritual ring, indigo arcane sigil, deep night atmosphere. Strong ritual ribbons and powerful ritual flash.

#### Intensity Upgrades
- All ribbon intensities increased (12-30% → 15-30%)
- All halo intensities increased (12-24% → 16-24%)
- All phase flash intensities increased (18-30% → 22-38%)

### System 8: _AtomaGlyphSystem4_0 → Mystic Rune Architecture

**Current State**: Glyph system with digital neon color palette (cyan, mint, magenta, violet, gold, etc.). Creates hexagonal glyphs, seed glyphs, ascended node glyphs, evolution stage glyphs, personality glyphs. Uses LineBasicMaterial.

**Upgrade**: Transform glyph colors from digital neon to arcane mystical pigments — as if carved from ancient temples.

#### Arcane Color Palette
- `sacredGold`: Ancient temple gold (#C9A84C)
- `ritualCrimson`: Blood ceremony crimson (#DC143C)
- `voidIndigo`: Deep void indigo (#4B0082)
- `spectralViolet`: Spectral deep violet (#8B00FF)
- `arcaneTeal`: Ceremonial teal (#4A90A4)
- `ghostCyan`: Ethereal ghost cyan (#E0FFFF)
- `parchment`: Ancient parchment (#E8D5B7)
- `nightVeil`: Deep night veil (#1A0A2E)

#### Mystic Rune Spectral Cycling
- `_mysticRunePhase` advances each frame
- Sacred gold and ritual crimson slowly cycle through ritual spectrum
- Hues: gold → crimson → violet → indigo → teal
- Colors breathe and shift as if the runes are alive with ancient power
- Master switch: `_enableMysticRunes: true`
