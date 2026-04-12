# Link Visual Polish Facelift — Plan

**Date**: 2026-04-12  
**Scope**: MEDIUM — Light facelift across 5 link subsystems  
**Mode**: CONTROLLED INNOVATION  
**Goal**: More epic, more vivid link visuals without performance regression

---

## Design Philosophy

This is a **polish pass**, not a redesign. Every change targets one of:
- **Brightness / glow intensity** — make existing effects more visible
- **Color richness** — hotter cores, richer gradients, more contrast
- **Subtle light-based motion** — no drifts, no wandering, just light pulsing
- **Re-enabling disabled features** — several debug-isolated features are ready to return

Performance budget: near-zero additional cost. All changes are shader tuning, constant tweaks, or re-enabling existing code.

---

## Subsystem Changes

### 1. LinkAuraShader — Opacity Lift + Additive Glow

**File**: `shaders/LinkAuraShader.js`

**Current state**: Hard opacity cap at 0.16, NormalBlending. The aura is almost invisible — intentionally subdued for hierarchy but too subtle for epic feel.

**Changes**:

| Parameter | Before | After | Rationale |
|-----------|--------|-------|-----------|
| Opacity cap | 0.16 | 0.24 | Still below node aura but actually visible now |
| Blending | NormalBlending | AdditiveBlending | Glow instead of flat overlay — links feel like energy |
| Rim contribution | `rim * vec3(0.1)` | `rim * vec3(0.18)` | Stronger edge glow for depth |
| Birth pulse amplitude | 0.15 | 0.28 | More dramatic link creation flash |
| Inner glow term | none | `+ auraColor * 0.08` | Subtle self-illumination for richness |
| Base color warmth | `vec3(0.85, 0.85, 0.9)` | `vec3(0.88, 0.87, 0.94)` | Slightly warmer, more alive |

**Performance impact**: Zero. Same shader, different constants. Additive blending is actually cheaper than normal blending in most cases.

---

### 2. Strand Filaments — Vivid Gradient + Brightness Boost

**File**: `LinkRendererConduit.js` — `STRAND_FILAMENT_STYLE` config + `_updateStrandFilaments` color logic

**Current state**: Filaments use `LineBasicMaterial` with `linewidth: 1.6` (which WebGL ignores — lines are always 1px). The color gradient has gain multipliers but they are conservative. Filaments are subtle to the point of being hard to see.

**Changes**:

| Parameter | Before | After | Rationale |
|-----------|--------|-------|-----------|
| `BASE_OPACITY` | 0.54 | 0.68 | More visible filaments |
| Tip white lerp | 0.64 max | 0.78 max | Hotter, brighter tips |
| Start gain base | 0.66 | 0.78 | Brighter filament roots |
| Mid gain base | 0.76 | 0.88 | Fuller mid-section |
| Tip gain base | 1.0 | 1.15 | Overbright tips for glow feel |
| Detach tip boost | +0.78 | +1.05 | More dramatic detached tips |
| Spark spawn threshold | -0.35 | -0.42 | Slightly more frequent sparks |

**No structural changes** — same LineSegments, same vertex layout, same update loop. Just pushing the color/opacity values higher so filaments read as bright energy threads instead of faint whispers.

**Performance impact**: Zero. Same draw calls, same geometry, just different color values.

---

### 3. LinkBeadTrailSystem — Hot Core + Enhanced Shape

**File**: `LinkBeadTrailSystem.js` — fragment shader `TRAIL_FS`

**Current state**: Fragment shader creates an organic "amoeba smear" shape with membrane and lobes. The inner glow is `0.86 + core * 0.12`. The shape is readable but could be more vivid.

**Changes**:

| Aspect | Before | After | Rationale |
|--------|--------|-------|-----------|
| Inner glow | `0.86 + core * 0.12` | `0.92 + core * 0.22` | Hotter center for each particle |
| Core radius | `smoothstep(0.18, 0.78, ...)` | `smoothstep(0.14, 0.68, ...)` | Slightly larger bright core |
| Hot center addition | none | `+ core * vec3(0.15)` | White-hot center point |
| Alpha max | 0.76 | 0.88 | Brighter overall trail particles |
| Size multiplier config | 1.15 | 1.30 | Slightly larger particles for visibility |
| Emission rate | 96 | 110 | Denser trail for richer comet tail |

**Performance impact**: Negligible. Same shader complexity, same particle count ceiling. Slightly more particles emitted per frame but within the same 384-particle budget.

---

### 4. LinkPulseRing — Re-enable Life + Fresnel Boost

**File**: `LinkPulseRing.js`

**Current state**: Several features are disabled with comments like `// DEBUG ISOLATION`:
- Hue drift is commented out
- Primary/harmonic scale pulse is zeroed
- Aura mesh is hidden
- Scale spike on reset is commented out

**Changes**:

| Feature | Current | Change | Rationale |
|---------|---------|--------|-----------|
| Hue drift | commented out | Re-enable with `0.012` amplitude | Subtle living color without circus |
| Primary pulse | `const primary = 0` | `Math.sin(progress * PI * 6) * 0.10` | Gentle breathing scale |
| Harmonic pulse | `const harmonic = 0` | `Math.sin(progress * PI * 12) * 0.04` | Complex pulse rhythm |
| Fresnel intensity | 2.4 | 3.0 | Sharper, more dramatic rim |
| Fresnel power | 2.5 | 2.2 | Wider glow spread |
| Inner glow in frag | `base = uColor * 0.15` | `base = uColor * 0.22` | Brighter inner energy |
| Aura mesh | hidden | Re-enable at 0.35x opacity | Outer glow halo around ring |
| Trail count | 2 | 3 | Richer echo trail |

**Performance impact**: Minimal. Re-enabling existing code paths. Adding 1 trail ring = 1 extra torus draw per link. The aura mesh was already created, just hidden.

---

### 5. StrandTipSpark / LinkTrailParticleSystem — Brighter Sparks

**File**: `LinkTrailParticleSystem.js` — `strandSparkFragmentShader`

**Current state**: Sparks have 4 glyph shapes with a core brightness of `vec3(core * 0.32)`. Flicker is `0.88 + 0.12 * sin(...)`. These are good but could be more vivid.

**Changes**:

| Parameter | Before | After | Rationale |
|-----------|--------|-------|-----------|
| Core brightness | `core * 0.32` | `core * 0.48` | Hotter spark centers |
| Flicker range | `0.88 + 0.12` | `0.84 + 0.18` | More dynamic flicker |
| Fade-in speed | `smoothstep(0.0, 0.09, ...)` | `smoothstep(0.0, 0.06, ...)` | Faster appearance — snappier |
| Size profiles | current | +15% across all glyphs | Slightly larger, more visible |

**Performance impact**: Zero. Same shader, same particle count, different constants.

---

## Implementation Order

```
Phase 1: LinkAuraShader (biggest visual impact, simplest change)
Phase 2: Strand Filaments (brightness/opacity tuning)
Phase 3: LinkBeadTrailSystem (fragment shader polish)
Phase 4: LinkPulseRing (re-enable + tuning)
Phase 5: StrandTipSpark (brightness tuning)
```

Each phase is independent and can be tested in isolation.

---

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Opacity cap increase makes links dominate nodes | LOW | New cap 0.24 is still well below node aura at 0.25 |
| Additive blending changes color perception | LOW | Additive on dark background looks better, not worse |
| More particles in BeadTrail | LOW | Same 384 budget, just denser emission |
| Re-enabling PulseRing features | LOW | All features existed before, just debug-isolated |
| Overall performance | NEGLIGIBLE | All changes are constant tweaks or re-enabling |

---

## Files Modified

1. `shaders/LinkAuraShader.js` — opacity cap, blending, rim, birth pulse, inner glow
2. `LinkRendererConduit.js` — `STRAND_FILAMENT_STYLE` config + filament color gains
3. `LinkBeadTrailSystem.js` — fragment shader + config values
4. `LinkPulseRing.js` — re-enable disabled features, Fresnel tuning, trail count
5. `LinkTrailParticleSystem.js` — spark fragment shader brightness

---

## What This Plan Does NOT Touch

- Pictogram system — separate topic as requested
- Link skin mesh geometry or structure
- Strand shader (linkStateVertexShaderSimple / linkStateFragmentShaderSimple)
- Bootstrap phase ordering
- Any metric computation or gameplay logic
- Any movement/drift mechanics — only light-based changes
