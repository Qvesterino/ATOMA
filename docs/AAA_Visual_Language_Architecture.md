# ATOMA AAA Visual Language Architecture

**Version:** 1.0  
**Date:** 2026-03-07  
**Author:** ATOMA VFX Architecture Team  
**Status:** Phase 1 Complete - Foundations

---

## Executive Summary

This document defines the unified visual language architecture for ATOMA, establishing the foundations for transforming the existing engine into a production-ready AAA experience. The architecture focuses on visual hierarchy, color semantics, temporal design, and shader consolidation while preserving ATOMA's philosophical essence.

### Core Principles

1. **Systems are Connected** - Links are the primary visual metaphor
2. **Systems Have State** - Visual feedback must be unambiguous
3. **Systems Live** - Organic motion without cliché

---

## Visual Hierarchy System

### Tier Structure

AToMA's visual hierarchy is organized into 5 tiers, each with distinct readability requirements:

```
Tier 0: Node Cores (Readability: CRITICAL)
├── Primary geometry (solid, opaque)
├── Category color (instant identification)
├── Selected state (strong contrast)
└── Active state (subtle breathing)

Tier 1: Link Structures (Readability: HIGH)
├── Braided rope base (substantial, readable)
├── Flow direction (clear energy movement)
├── Connection quality (synergy = brightness/smooth)
└── State indicators (corruption = decay patterns)

Tier 2: Aura Shells (Readability: MEDIUM)
├── Linked nodes only (selective visibility)
├── Subtle breathing (presence, not distraction)
├── Impact responses (feedback, not constant)
└── Corruption/harmony modulation (state communication)

Tier 3: Particle Systems (Readability: LOW-TO-MEDIUM)
├── Sparks (high-activity feedback)
├── Beads (connection events)
├── Trails (directional flow accent)
└── Impacts (arrival feedback)

Tier 4: Ambient Systems (Readability: VERY LOW)
├── Orbit rings (node type accent)
├── Dock rings (connection feedback)
└── Environmental particles (atmosphere)
```

### Readability Rules

**Rule 1:** Each tier must be visible in isolation from lower tiers, but not interfere with higher tiers.

**Rule 2:** Lower tiers use additive blending to avoid occluding higher tiers.

**Rule 3:** Render order must respect hierarchy (higher tiers render last).

**Rule 4:** Lower tiers respond to state changes more subtly than higher tiers.

---

## Color Palette System

### Node Category Colors (Semantic Identification)

| Category | Hex | Name | Temperature | Brightness | Purpose |
|----------|-----|------|-------------|------------|---------|
| INPUT | 00DDFF | Cyan | Cool | 1.0 | Data entry points, external inputs |
| PROCESS | FFAA00 | Amber | Warm | 0.9 | Processing, computation, transformation |
| STORAGE | 88CCFF | Sky | Cool | 0.85 | Memory, data persistence, databases |
| INTEGRATION | 00FF88 | Mint | Cool | 0.95 | System integration, API connections |
| ANALYTICS | AA00FF | Purple | Cool | 0.8 | Analysis, metrics, data insights |
| CONTROL | FF0088 | Pink | Warm | 0.9 | Control logic, decision making |
| QUANTUM | 00FFFF | Electric | Neutral | 1.1 | Quantum computing, advanced systems |

### State Modifiers (Applied to Base Colors)

**CORRUPTION:**
- Desaturation: 0.7
- Brightness: 0.6
- Red Shift: 0.3
- Jitter: 0.15
- **Visual Effect:** Decay, instability, darkening

**HARMONY:**
- Saturation: 1.1
- Brightness: 1.15
- Cyan Shift: 0.2
- Smoothing: 0.4
- **Visual Effect:** Stabilization, brightening, cyan tint

**STRESS:**
- Brightness: 1.25
- Flicker: 0.3
- Speed: 1.8
- **Visual Effect:** Overload, rapid motion, high activity

**HEALING:**
- Brightness: 1.1
- Cyan Shift: 0.35
- Smoothing: 0.6
- **Visual Effect:** Recovery, stabilization process

**COLLAPSE:**
- Desaturation: 0.9
- Brightness: 0.4
- Red Shift: 0.5
- **Visual Effect:** Critical failure, total decay

### Link Colors

**BASE:**
- Blend Mode: Linear interpolation (lerp)
- Blend Factor: 0.5
- Description: Base link color (blend of endpoints)

**FLOW:**
- Blending: Additive
- Brightness: 1.3
- Description: Energy flow accent

**SPARK:**
- Brightness: 1.5
- Desaturation: 0.3
- Description: Spark particles (bright, desaturated)

**BEAD:**
- Brightness: 1.2
- Blending: Additive
- Description: Connection bead accent

---

## Temporal Design System

### Global Rhythms

**Breathing (Base Idle Motion):**
- **SLOW:** Period: 4.0s, Amplitude: 0.03 (Calm systems)
- **MEDIUM:** Period: 2.5s, Amplitude: 0.04 (Normal systems)
- **FAST:** Period: 1.5s, Amplitude: 0.05 (Active systems)

**Flow (Energy Movement):**
- **RELAXED:** Speed: 0.3, Variance: 0.1
- **ACTIVE:** Speed: 0.8, Variance: 0.2
- **STRESSED:** Speed: 1.5, Variance: 0.4

### Event Timings

**LINK_CREATION:** Duration: 0.4s, Curve: easeOutCubic  
**LINK_REMOVAL:** Duration: 0.3s, Curve: easeInExpo  
**IMPACT_ARRIVAL:** Duration: 0.18s, Curve: easeOutQuad  
**HARMONY_PULSE:** Duration: 0.5s, Curve: easeOutQuad  
**CORRUPTION_SPIKE:** Duration: 0.25s, Curve: easeInOutQuad

### Particle Lifetimes

**SPARK:** Min: 0.25s, Max: 0.45s  
**BEAD:** Min: 0.8s, Max: 1.5s  
**TRAIL:** Min: 0.6s, Max: 1.2s

### Orbital Systems

**SLOW:** Period: 12.0s, Count: 3 (Ambience)  
**MEDIUM:** Period: 6.0s, Count: 5 (Normal)  
**FAST:** Period: 3.0s, Count: 7 (Active)

---

## Shader Architecture

### Base Components

**ATOMAShaderBase** provides:
1. **Uniform Definitions** - Shared across all shaders
2. **Path Sampling** - Bezier curves, tangents, coordinate frames
3. **Noise Functions** - Simplex 3D, layered noise
4. **Particle Masks** - Star, circle, diamond, glow
5. **Temporal Functions** - Oscillation, breathing, pulsing
6. **Color Functions** - Desaturation, temperature, harmony, corruption

### Shader Consolidation Pattern

```
ATOMAShaderBase
├── getBaseUniforms()
├── getPathSamplingFunctions()
├── getNoiseFunctions(layers)
├── getMaskFunctions(maskType)
├── getTemporalFunctions()
├── getColorFunctions()
├── getVertexShaderTemplate(options)
├── getFragmentShaderTemplate(options)
└── createBaseMaterial(params)
```

### Benefits

- **Consistency:** Uniform visual behavior across all systems
- **Maintainability:** Bug fixes apply everywhere
- **Performance:** Reduced shader variants, easier GPU optimization
- **Extensibility:** Clear extension points for new systems

---

## Material Definition Strategy

### Hard Surface Reads (Node Cores, Link Bases)

- High metallicness: 0.8-1.0
- Roughness variation: 0.3-0.6
- Specular highlights
- Clear normal detail
- **Purpose:** Instant readability, physical presence

### Soft Emission Reads (Auras, Glows, Particles)

- Additive blending
- Fresnel-based falloff
- Noise-based variation
- No hard edges
- **Purpose:** Atmospheric presence, state communication

### State Transitions

**Corruption:**
```
Desaturation → Darkening → Red Bias
(Gradual decay toward failure)
```

**Harmony:**
```
Saturation Boost → Brightening → Cyan Tint
(Gradual stabilization toward purity)
```

**Stress:**
```
Brightness Spike → Flicker → Speed Increase
(Rapid escalation toward overload)
```

---

## Performance Optimization

### Priority 1: Immediate Wins

1. **Reduce orbit ring instances:** 64 → 32-48 segments
2. **Limit spark particles per link:** 60 → 40
3. **Consolidate material updates:** Batch apply uniforms
4. **Implement LOD for distant links:** Reduce strand segments

### Priority 2: Quality Preservation

1. **Global time source:** Remove independent clocks
2. **Shader consolidation:** Reduce variants
3. **Geometry instancing:** For identical node types
4. **Distance culling:** Disable particle systems at distance

### Priority 3: Long-term Architecture

1. **Compute shaders:** For complex noise calculations
2. **Texture-based sampling:** Replace procedural where cheap
3. **Visual LOD system:** Automatic quality scaling

---

## Implementation Phases

### Phase 1: Foundations (COMPLETE)

- [x] ATOMAShaderBase class
- [x] ATOMAColorPalette system
- [x] ATOMARhythmAuthority
- [x] Visual Hierarchy documentation

### Phase 2: Shader Consolidation (2-3 weeks)

- [ ] Refactor LinkSparkSystem to use shader base
- [ ] Refactor LinkBeadSystem to use shader base
- [ ] Create particle mask library
- [ ] Consolidate noise functions

### Phase 3: Visual Tuning (2-3 weeks)

- [ ] Implement material definition strategy
- [ ] Adjust visual hierarchy (opacity, render order)
- [ ] Tune temporal rhythms
- [ ] Validate color communication

### Phase 4: Performance (1-2 weeks)

- [ ] Implement immediate optimizations
- [ ] Add LOD systems
- [ ] Profile and optimize hot paths
- [ ] Establish performance budgets

### Phase 5: Polish (1-2 weeks)

- [ ] Fine-tune particle counts
- [ ] Adjust emission intensities
- [ ] Validate visual communication
- [ ] Documentation and handoff

---

## API Reference

### ATOMAShaderBase

```javascript
// Get base uniform definitions
ATOMAShaderBase.getBaseUniforms() → Object

// Get shader code for path sampling (Bezier curves)
ATOMAShaderBase.getPathSamplingFunctions() → string

// Get shader code for noise functions
ATOMAShaderBase.getNoiseFunctions(layers) → string

// Get shader code for particle masks
ATOMAShaderBase.getMaskFunctions(maskType) → string

// Get shader code for temporal functions
ATOMAShaderBase.getTemporalFunctions() → string

// Get shader code for color functions
ATOMAShaderBase.getColorFunctions() → string

// Create base material with ATOMA uniforms
ATOMAShaderBase.createBaseMaterial(params) → THREE.ShaderMaterial
```

### ATOMAColorPalette

```javascript
// Get color for node category
ATOMAColorPalette.getNodeColor(category) → THREE.Color

// Apply state modifier to base color
ATOMAColorPalette.applyStateModifier(baseColor, state, intensity) → THREE.Color

// Blend two colors for link base
ATOMAColorPalette.blendLinkColors(color1, color2, factor) → THREE.Color

// Get flow accent color
ATOMAColorPalette.getFlowColor(baseColor, brightness) → THREE.Color

// Get spark particle color
ATOMAColorPalette.getSparkColor(baseColor, brightness, desaturate) → THREE.Color

// Calculate state color shift for shader
ATOMAColorPalette.calculateStateColorShift(corruption, harmony) → Object

// Get color for aura
ATOMAColorPalette.getAuraColor(harmony) → THREE.Color
```

### ATOMARhythmAuthority

```javascript
// Update rhythm authority (call every frame)
rhythmAuthority.update(deltaTime)

// Get global time
rhythmAuthority.getGlobalTime() → number

// Get breathing value (oscillation)
rhythmAuthority.getBreath(systemId, systemType, amplitude) → number

// Get flow speed (energy movement)
rhythmAuthority.getFlowSpeed(systemId, systemType) → number

// Get oscillation value (general purpose)
rhythmAuthority.oscillate(speed, phase) → number

// Get pulse value (sharp rise, slow fall)
rhythmAuthority.pulse(systemId, frequency, sharpness) → number

// Start a temporary event
rhythmAuthority.startEvent(eventId, eventName, intensity)

// Get event progress
rhythmAuthority.getEvent(eventId) → Object | null

// Set stress level (modulates rhythms)
rhythmAuthority.setStressLevel(level)

// Set harmony level (modulates rhythms)
rhythmAuthority.setHarmonyLevel(level)

// Get random value within lifetime range
rhythmAuthority.getRandomLifetime(rhythmName) → number

// Get orbit configuration
rhythmAuthority.getOrbitConfig(mode) → { period, count }
```

---

## Best Practices

### Shader Development

1. **Always use ATOMAShaderBase** for new shaders
2. **Reuse existing functions** before adding new ones
3. **Profile performance** of new shader features
4. **Document uniform purposes** in code comments
5. **Test on multiple hardware** (if possible)

### Color Usage

1. **Use ATOMAColorPalette** for all color definitions
2. **Apply state modifiers** through the palette system
3. **Validate contrast ratios** for accessibility
4. **Keep state transitions** smooth and gradual
5. **Avoid hardcoded colors** in shaders

### Temporal Design

1. **Use ATOMARhythmAuthority** for all timing
2. **Respect phase offsets** for variety
3. **Coordinate global rhythms** across systems
4. **Use appropriate easing** for events
5. **Keep particle lifetimes** within defined ranges

### Performance

1. **Minimize per-frame allocations**
2. **Use instancing** for identical objects
3. **Implement LOD** for distant elements
4. **Profile regularly** with real-world scenarios
5. **Establish budgets** for particle counts

---

## Appendix: File Structure

```
Engine/Visual/
├── ATOMAShaderBase.js          # Shader architecture foundation
├── ATOMAColorPalette.js        # Unified color system
├── ATOMARhythmAuthority.js     # Global time and rhythm management
└── (Future systems will extend these)

docs/
└── AAA_Visual_Language_Architecture.md  # This document
```

---

## Changelog

### v1.0 (2026-03-07)
- Initial Phase 1 foundations
- ATOMAShaderBase implementation
- ATOMAColorPalette implementation
- ATOMARhythmAuthority implementation
- Visual hierarchy documentation
- API reference documentation

---

**End of Document**