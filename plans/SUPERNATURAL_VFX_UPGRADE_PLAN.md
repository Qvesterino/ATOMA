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

---

## Round 5: Sacred & Mystic-Sacred Upgrades

### System 9: HarmonicHubAuraSystem_Session126 → Divine Nexus Aura

**Current State**: Hub aura system with icosahedron resonance fields (outer MeshPhong + inner MeshBasic + torus ring). Basic HSL colors (corruption=purple, synergy=cyan, harmony=blue). Simple noise-based vertex deformation. Single ring per hub.

**Upgrade**: Transform hub auras into sacred divine nexus points — as if each hub is a temple altar radiating divine light with sacred geometry halos.

#### Divine Spectrum Cycling
- `divineSpectrumHues`: [0.12, 0.52, 0.75, 0.97] (sacred gold, celestial teal, mystic violet, ritual crimson)
- `_divineSpectrumPhase` advances each frame at `divineSpectrumCycleSpeed`
- Colors cycle through sacred spectrum based on hub state

#### Sacred Color Mapping
- Corruption → Ritual crimson with spectral void undertone (HSL 0.97+)
- High synergy → Celestial teal-gold sacred fusion (cycling between gold and teal)
- Harmony → Mystic violet-sacred gold cycling (full spectrum rotation)

#### Dual Sacred Halo Rings
- First halo: 45° tilted torus at 1.25× radius with sacred spectral tint
- Second halo: Perpendicular cross-aura at 1.15× radius with offset hue
- Both rotate independently with orbital animation
- Opacity modulated by ring pulse and divine breathing

#### Divine Breathing Override
- `divineBreathingRate: 1.8` replaces default 2.2
- Outer shell: Sacred spectral color cycling on emissive
- Inner core: Sacred white-gold pulse cycling
- Halos: Independent spectral tint cycling (gold + teal offset)

#### Master Switch
- `enableDivineNexusAura: true` — set to false for full legacy fallback

### System 10: CascadeResonanceWaveVisualization_Session146 → Sacred Wave Prophecy

**Current State**: Multi-phase wave system with EPIC ring shader (ATM_WAVE_RING_v3), EPIC beam shader (ATM_RESONANCE_BEAM_v2), three-tier parallax rings, particles, sparks, echo trails, interference particles. Colors: white-cyan/cyan/violet rings, white sparks, cyan particles.

**Upgrade**: Transform the cascade wave system into a sacred prophecy revelation — waves of divine light carrying ancient messages between hub temples.

#### Sacred Ring Colors (Three-Tier Parallax)
- Inner ring: Sacred white-gold (#FFF0D0) — divine revelation
- Middle ring: Celestial teal (#40E0D0) — spiritual channel
- Outer ring: Mystic violet-indigo (#7B5EA7) — prophecy veil

#### Sacred Beam & Glow Colors
- Hub glow: Sacred warm gold (#FFE4B5)
- Link beam: Celestial silver-teal (#B8D4E3)
- Harmony transition: Sacred gold (#FFD700) at 75% blend
- Corruption tint: Ritual dark magenta (#8B008B) at 45% blend

#### Sacred Particle Spectrum
- Wavefront particles: Spectral colors per tier (outer=violet-crimson cycling, middle=teal-gold cycling, inner=sacred white-gold)
- Resonance sparks: Random sacred hue from spectrum with luminance variation
- Echo trails: Celestial teal (#C0E8E0)
- Interference particles: Sacred gold (#FFD700)

#### Sacred Color Transitions
- Harmony > 0.5: Lerp toward sacred gold (#FFD700) at 65%
- Progress > 0.55: Lerp toward mystic violet (#7B5EA7) at 55%
- `_sacredSpectrumPhase` advances each frame for continuous cycling

#### Master Switch
- `enableSacredWaveUpgrade: true` — set to false for full legacy fallback

---

## Round 6: Paranormal & Iconic Upgrades

### System 11: StandingWaveVisualRenderer_Session131 → Ethereal Dimensional Membrane

**Current State**: Standing wave renderer with antinode broken Möbius segments (torus segments + shell sphere), trap zone singularity (core sphere + orbitA/B torus + halo ring). Colors: cyan-blue antinodes, pale blue trap zones, near-black core, white-blue halo.

**Upgrade**: Transform standing waves into paranormal dimensional membranes — as if the wave patterns are tears between dimensions, with ghostly violet energy bleeding through.

#### Paranormal Material Colors
- Antinode glow: Deep spectral violet (0.45, 0.25, 0.85) — dimensional membrane wireframe
- Antinode shell: Ghost lavender-white (0.85, 0.80, 1.0) — ethereal dimensional surface
- Trap zone: Ethereal violet (0.45, 0.35, 0.75) — dimensional rift boundary
- Trap core: Deep void (0.02, 0.01, 0.06) — singularity darkness
- Trap halo: Spectral violet (0.70, 0.50, 1.0) — dimensional rift glow
- Trap shock: Paranormal rupture flash (0.85, 0.70, 1.0)
- Trap pulse: Ethereal blue-violet (0.60, 0.80, 1.0)

#### Paranormal Antinode Color Cycling
- `_resolveAntinodeColor()` overridden when enabled
- Cycles through: mystic violet → arcane teal → sacred gold → ritual crimson
- `_etherealPhase` advances each frame for continuous cycling
- All legacy category-based color resolution preserved as fallback

#### Master Switch
- `enableEtherealMembrane: true` — set to false for full legacy fallback

### System 12: HarmonicInfluencePropagationSystem_Session127 → Psychic Energy Propagation

**Current State**: Influence propagation with neutral grey-white (0.93,0.93,0.95) flowing flame auras on nodes and link flows. MeshPhongMaterial with additive blending. Slight warmth shift with harmony.

**Upgrade**: Transform influence propagation into psychic energy radiation — as if thoughts and emotions are visible as spectral energy radiating through the network like telepathic signals.

#### Psychic Base Color
- baseColor: Ethereal lavender-white (0.85, 0.82, 0.95) — psychic perception base

#### Psychic Aura Color Cycling
- `_createNodeAuraMesh()` color logic overridden when enabled
- Cycles through: mystic violet → arcane teal → sacred gold → ritual crimson
- Harmony shifts hue toward sacred gold
- Synergy boosts lightness
- `_psychicPhase` advances each frame

#### Psychic Link Flow Colors
- `_createLinkFlowMesh()` uses spectral flow colors from psychic spectrum
- Enhanced emissive intensity (0.55 vs legacy 0.4)
- Each flow segment picks hue from current psychic phase

#### Master Switch
- `enablePsychicPropagation: true` — set to false for full legacy fallback

---

## Round 7: AAA Epic & Supernova Upgrades

### System 13: CascadeBurstVisual_Session147 → Supernova Detonation

**Current State**: Burst visual with energy shell (IcosahedronGeometry ShaderMaterial), radial ray beams (CylinderGeometry), shockwave ring (TorusGeometry), core flash, energy particles, core sparks, nebula cloud, bloom aura, chromatic aura, distortion wave, push force, point light flash. Colors: cyan-white harmonic, warm gold synergy, red corruption.

**Upgrade**: Transform cascade bursts into supernova detonations — cosmic explosions of sacred energy that look like dying stars birthing new dimensions.

#### Supernova Color Palette
- Harmonic: Celestial plasma gold-white `#FFE8C0`
- Synergy: Cosmic gold `#FFC040`
- Corruption: Void crimson `#CC0030`
- Core sparks: Sacred gold `#FFD700` (was plain white)

#### Supernova Spectral Cycling
- `_supernovaPhase` advances each frame
- Spectrum: sacred gold → arcane teal → mystic violet → ritual crimson
- Applied to burst color resolution during active detonations

#### Master Switch
- `enableSupernovaUpgrade: true` — set to false for full legacy fallback

### System 14: EchoRippleSystem_Session125 → Quantum Echo Resonance

**Current State**: Hexagonal ripple rings with octagonal halos, hexagonal cores, echo rings, propagation system, loadPressure spawning. Colors: cyan ripple, white halo, red corruption, cyan harmony, amber cascade. Has chromatic shift, energy shimmer, glow pulse.

**Upgrade**: Transform echo ripples into quantum-entangled resonance patterns — as if reality itself is being disturbed at the quantum level, with spectral colors that shift like probability wave functions.

#### Quantum Spectral Colors
- Ripple: Quantum spectral violet `#B090FF`
- Halo: Spectral white-gold `#FFF0D0`
- Corruption: Void crimson `#CC0030`
- Harmony: Celestial teal `#40E0D0`
- Cascade: Sacred gold `#FFD700`
- LoadPressure: Arcane amber `#E0A040`

#### Quantum Color Resolution
- `_resolveRippleColor()` fully overridden when enabled
- loadPressure: Arcane amber → shifts toward ritual crimson at high pressure
- cascadeHop: Sacred gold with quantum phase modulation
- propagation: Full spectrum cycling through quantum hues
- waveBurst: Void crimson (corruption) / celestial teal (harmony) / spectral cycling (default)
- `_quantumPhase` advances each frame for continuous cycling

#### Master Switch
- `enableQuantumEcho: true` — set to false for full legacy fallback

---

## Round 8: Sacred Healing Polish + Recovery Planning

### System 15: HealingParticleSystem_Session136 → Sacred Healing Polish

**Current State**: GPU-driven particle system with custom GLSL vertex/fragment shaders. Single draw call (THREE.Points) with circular buffer, 3500 max particles. Colors: warm gold, luminous cyan, white-cyan. Multi-lobe glow (hot core + inner glow + soft halo). Hypercube stereographic projection motion. Layer tint: pink → cyan.

**Upgrade**: Sacred spectral micro-polish — upgrade color palette to sacred gold / celestial teal / mystic violet without structural shader changes.

#### Sacred Spectral Color Evolution (Vertex Shader)
- Replaced flat cyan evolution with sacred spectral cycling: base → sacred gold → celestial teal → mystic violet shimmer
- Sacred spectral shimmer per layer using celestial teal modulation

#### Sacred Layer Tint (Fragment Shader)
- Layer tint: sacred gold → celestial teal (was pink → cyan)
- Creates coherent sacred glow across all particle layers

#### Sacred Spawn Colors (JS)
- Scar sparkle high harmony: celestial teal `(0.25, 0.88, 0.82)`
- Scar sparkle default: sacred gold `(1.0, 0.84, 0.0)`
- Trail default: celestial teal-gold `(0.35, 0.90, 0.82)`
- Splash: sacred gold / celestial teal / spectral white-gold `(1.0, 0.94, 0.82)`
- Ring particles: spectral white-gold / celestial teal alternation

#### Master Switch
- `enableSacredHealingPolish: true` — set to false for full legacy fallback

### System 16 (Planned): HarmonicRecoveryVisualSystem_Session138 → Sacred Recovery Convergence

**Status**: ✅ Implemented

**Changes Applied**:
1. ✅ Coherence wave shader: Sacred spectral evolution — sacred gold → celestial teal → mystic violet shimmer (was warm gold → luminous cyan). Sacred spectral sparkle fringe.
2. ✅ Recovery halo shader: Sacred convergence ring tinting — rings blend toward celestial teal, white-hot sacred core
3. ✅ Material base colors: Wave → celestial teal `0x40E0D0` (was `0x00ffff`), Halo → sacred gold `0xFFD700` (was `0xffff33`)
4. ✅ Re-stitching beam: Sacred gold `0xFFD700` beam (was `0x88ffdd`), sacred gold / celestial teal stitch alternation
5. ✅ HSL computation: Sacred spectrum range `0.12 + harmony * 0.38` (was `0.08 + harmony * 0.42`), reduced saturation 0.88 (was 0.92)
6. ✅ Master switch: `enableSacredRecovery: true`

---

## Round 9: Polish Duo — Harmony Consumer + Orbit Rings

### System 17: T2_HarmonyVisualConsumer_v1 → Sacred Harmony Aura Polish

**Current State**: Borromean ring auras around high-harmony nodes using TubeGeometry torus rings with flow shader. Oasis zones as soft radial bloom. Healing pulse shards. Ring radius 1.1, tube radius 0.08, scale variants [1.0, 0.96, 1.04].

**Upgrade**: Elegant polish — thinner torus rings, tighter spacing, sacred spectral palette, sacred shimmer in flow shader.

#### Changes Applied
1. **Thinner torus**: Tube radius `0.08` → `0.04` (50% thinner, more elegant)
2. **Tighter radius**: Ring radius `1.1` → `0.95` (closer to node)
3. **Tighter spacing**: Scale variants `[1.0, 0.96, 1.04]` → `[1.0, 0.985, 1.015]` (rings much closer together)
4. **Sacred palette**: Base color `0x66ffd9` → celestial teal `0x40E0D0`
5. **Sacred shimmer**: Fragment shader enhanced with sacred gold ↔ celestial teal spectral pulse
6. **Master switch**: `enableSacredHarmonyPolish: true`

### System 18: NodeSegmentedOrbitRings → Sacred Orbit Reactor

**Current State**: InstancedMesh orbit ring system with 64 segments per ring, dual-ring lanes, custom GLSL shaders with trails, hot core, pulse wave, iridescent color shift. PlaneGeometry(0.72, 0.42).

**Upgrade**: Thicker segments, inner particle trail (orbiting particle cluster), enhanced fog/mist trail.

#### Changes Applied
1. **Thicker segments**: PlaneGeometry `(0.72, 0.42)` → `(0.88, 0.56)` — 22% wider, 33% taller
2. **Wider base ring**: Fragment shader `abs(uv.y) * 7.5` → `* 5.5` with softer falloff `pow(..., 2.2)` for thicker appearance
3. **Enhanced fog trail**: Longer trail body, wider soft trail (`abs(uv.y) * 2.8` was `* 3.8`), stronger alpha for misty volumetric appearance
4. **Inner particle trail**: New `THREE.Points` system with 20 orbiting particles at inner circumference (82% of ring radius)
   - Custom GLSL vertex/fragment shaders for soft glow particles
   - Sacred spectral tint: celestial teal base with sacred gold highlights
   - Varied orbit speeds for organic cluster movement
   - Hot core + soft glow dual-lobe rendering
   - Synced with energy level and ring tilt
5. **Integration**: Trail mesh attached via `getTrailMesh()` in both NodeLinkedAuraSystem creation sites
6. **Performance**: 20 particles per node — lightweight, single draw call per orbit system

### System 19: VisualUpgradeSuperpack → Sacred Spectral Atmosphere

**Current State**: MEDIUM-tier visual quality layer with 8 enhancement packs: volumetric lights, ambient fog, edge glow, color grading, postFX, quantum distortion, sigma rifts, dream particles, camera aura. All using generic cyan/magenta/pink color palette.

**Upgrade**: Full sacred spectral palette alignment across all 8 packs — creating unified visual identity with the 18 previously upgraded systems.

#### Changes Applied
1. **Volumetric lights**: Sacred gold `0xFFD700`, celestial teal `0x40E0D0`, mystic violet `0x9466EB`, spectral white-gold `0xFFF0D0` (was cyan/magenta/pink)
2. **Fog layers**: Deep violet base `0x2A1840`, teal haze `0x1A3030`, gold horizon `0x302810` (was pink-white)
3. **Edge glow**: Sacred teal `0x40E0D0` (was cyan `0x00ffff`)
4. **Color grading**: Sacred gold-teal balance — teal shadows, warm midtones, gold highlights (was teal-magenta)
5. **Distortion zones**: Mystic violet `0x9466EB` (was cyan `0x00ffff`)
6. **Sigma rifts**: Mystic violet `0x9466EB`, sacred gold `0xFFD700`, celestial teal `0x40E0D0` (was generic green)
7. **Dream particles**: Sacred gold `0xFFD700`, celestial teal `0x40E0D0`, mystic violet `0x9466EB` (was pink/white)
8. **Camera aura**: Sacred gold, mystic violet, celestial teal, spectral white-gold (was cyan/pink)
