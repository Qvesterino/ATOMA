# Link Semantic Pictogram System — Enhanced

## Overview

Multi-layer semantic visual language system that creates living, intentional, context-aware pictograms above links.

**Philosophy**: *A symbolic nervous system — thoughts, tensions, and memories quietly traveling above the network, allowing the player to read meaning without UI or text.*

---

## Core Enhancements

### What Changed

**Before**: Flat icons floating above links
**After**: Living, layered, morphing semantic transport layer with depth and intelligence

### Key Improvements

1. **Multi-layer stack** (3 layers with hierarchy)
2. **Continuous morphing** (no abrupt swaps)
3. **Depth & parallax** (embedded in space, not stickers)
4. **Context-aware flow** (intelligent behavioral responses)
5. **Semantic density** (visual hierarchy through importance)
6. **Restrained aesthetics** (calm, neutral, sci-fi)

---

## Multi-Layer Stack System

### Layer A — Signal Glyphs (Primary Meaning)
- **Purpose**: Encode current dominant link state
- **Opacity**: 70%
- **Depth offset**: 0.8 units above link
- **Types**: Harmony circles, corruption fragments, healing spirals
- **Behavior**: Primary visual narrative

### Layer B — Modulator Marks (Secondary Modifiers)
- **Purpose**: Encode synergy, instability, resistance
- **Opacity**: 50%
- **Depth offset**: 1.0 units above link
- **Types**: Small arrows, offset dots, phase bars
- **Behavior**: Modifier symbols that orbit or attach to primary glyphs

### Layer C — Memory Traces (Tertiary, Rare)
- **Purpose**: Historical influence (past ruptures, healing, dominance)
- **Opacity**: 25%
- **Depth offset**: 1.2 units above link
- **Spawn chance**: 15%
- **Lifetime**: 2× longer than other layers
- **Behavior**: Faint echoes drifting slowly

### Layer Rules
- Layers never overlap visually (different depth offsets)
- Each additional layer reduces opacity for visual hierarchy
- Memory layer is optional and sparse
- Layers can coexist on same link without confusion

---

## Continuous Morphing System

### Morphing vs. Swapping

**Old behavior**: Pictogram A disappears, pictogram B appears (jarring)
**New behavior**: Pictogram A gradually transforms into pictogram B (smooth)

### Morphing Mechanics

- **Duration**: 1.5 seconds per morph
- **Smoothness**: 85% interpolation (very smooth)
- **Geometry switch**: At morph midpoint (50% progress)
- **Opacity fade**: Slight dip during morph for smoothness
- **Trigger**: Context change or random (after 3 seconds, 1% chance per update)

### Morphing Paths

Defined state machines for valid transitions:

**Harmony family**:
- Circle Ring ↔ Wave ↔ Interlocking Arcs
- Circle Ring ↔ Broken Circle (corruption onset)
- Circle Ring ↔ Reforming Ring (healing)

**Corruption family**:
- Broken Circle ↔ Offset Shards ↔ Fractured Triangle
- Broken Circle ↔ Incomplete Symbol

**Synergy family**:
- Chevron ↔ Triple Arrow ↔ Braided Line

**Healing family**:
- Reforming Ring ↔ Closing Gap ↔ Soft Spiral

**Standing wave family**:
- Oscillation ↔ Wave
- Back-Forth Arrows (trapped energy)

### Context-Driven Morphing

- **Healing context**: Morph toward healing states (reforming ring, closing gap)
- **Corruption context**: Morph toward corruption states (broken circle, fractured)
- **Standing wave**: Morph toward wave states (oscillation)
- **Default**: Random valid transition within family

---

## Depth & Parallax

### Spatial Embedding

Pictograms exist in **shallow depth layers** above links, not as flat billboards.

**Features**:
- **Parallax relative to camera**: 0.15 strength multiplier
- **Micro Z-rotation**: ±0.05 radians, slow oscillation
- **Vertical bob**: Gentle sine wave (0.05 amplitude)
- **Lateral drift**: Subtle side-to-side (0.08 amplitude)

**Result**: Pictograms feel **embedded in 3D space**, not pasted on.

### Layer Depth Offsets

- **Layer A**: 0.8 units above link
- **Layer B**: 1.0 units above link
- **Layer C**: 1.2 units above link

Creates natural visual separation and hierarchy.

---

## Context-Aware Flow Intelligence

### Flow Contexts

#### 1. **Normal Flow**
- Smooth drift along link
- Base speed: 0.25 units/sec
- Synergy multiplier: 1.8×

#### 2. **Approaching Resistant Node**
- **Behavior**: Slowing and spacing compression
- **Speed reduction**: 30% of normal
- **Spacing compression**: 70% of normal
- **Visual feel**: Glyphs "hesitate" before resistance

#### 3. **Standing Wave Present**
- **Behavior**: Local oscillation with occasional reversal
- **Oscillation amount**: 40%
- **Reversal chance**: 15% when near boundaries
- **Visual feel**: Glyphs "trapped" between nodes

#### 4. **Healing Wave Passing**
- **Behavior**: Temporary alignment and smoothing
- **Alignment strength**: 80%
- **Speed stabilization**: Consistent rhythm
- **Glow stabilization**: Subtle opacity boost (not brightness)
- **Visual feel**: Glyphs become "orderly"

#### 5. **Rupture Imminent**
- **Behavior**: Spacing tightens, motion hesitates, shapes tense
- **Speed reduction**: 20% of normal
- **Compression**: 50% spacing
- **Angle bias**: Slight perpendicular offset (tension)
- **Visual feel**: Glyphs become "nervous"

### Context Detection

System analyzes link state every update:
- **Resistance**: High corruption + low synergy
- **Standing wave**: Wave intensity > 30%
- **Healing**: Node healing flags active
- **Rupture risk**: Corruption × (1 - stability) > 60%

---

## Semantic Density & Visual Hierarchy

### Link Importance Scoring

Every link receives importance score (0-1) based on:
- **High synergy**: +0.3
- **High quality**: +0.2
- **Critical state**: +0.3 (stability < 30%)
- **Specialized nodes**: +0.2

### Glyph Density by Importance

| Importance | Max Glyphs | Size Preference | Visual Weight |
|------------|------------|----------------|---------------|
| **Critical (>0.85)** | 2 | Large/Anchor | Very high |
| **Important (>0.65)** | 3 | Large | High |
| **Normal (>0.35)** | 4 | Medium | Medium |
| **Minor (<0.35)** | 5 | Small | Low |

**Result**: Important links = fewer but larger glyphs. Minor links = more but smaller glyphs.

### Size Tiers

- **Anchor (rare)**: 0.5 units (10% chance on critical links)
- **Large**: 0.35 units (important signals)
- **Medium**: 0.2 units (standard glyphs)
- **Small**: 0.12 units (modulators, memory traces)

### Visual Hierarchy Benefits

- Natural eye guidance toward important links
- Reduced visual clutter on minor links
- Clear semantic differentiation
- Calm, professional aesthetic

---

## Visual Restraint Rules

### Absolute NO ❌

- Bright colors (saturation kept to 25%)
- Bloom-heavy glow
- Fast motion (max 0.45 units/sec)
- Particle spam
- Random jitter
- Emissive materials
- Rapid flashing

### Absolute YES ✅

- Neutral tones (grey base: 0xb0b0b0)
- Slow rhythm (10-20 second lifetimes)
- Intentional spacing (context-aware)
- Calm authority (deliberate motion)
- Subtle depth cues
- Smooth transitions
- Readable silhouettes

### Color Palette (Desaturated)

All colors use **very low saturation** (25%) with neutral grey base (70% brightness):

- **Harmony**: Light blue tint
- **Corruption**: Slight red tint
- **Synergy**: Slight green tint
- **Instability**: Slight orange tint
- **Healing**: Slight cyan tint
- **Standing Wave**: Slight purple tint

**Result**: Calm, sci-fi, non-gimmicky aesthetic.

---

## Performance

### Optimizations

1. **Pooled instances**: 250 pre-allocated pictograms
2. **Shared geometries**: 18 types cached, never duplicated
3. **Throttled updates**: 30Hz update rate
4. **Coarse spawn timing**: Variable intervals by importance
5. **Layer system**: No overlap checks needed (depth-separated)

### Memory Footprint

- **Geometry cache**: ~18 geometries × 2KB ≈ 36KB
- **Instances**: 250 instances × 250 bytes ≈ 62.5KB
- **Total**: ~100KB (negligible)

### GPU Cost

- **Draw calls**: 1 per active pictogram (up to 250)
- **Triangles**: ~20-50 per pictogram
- **Total triangles**: <12,500 (negligible)
- **Instancing**: Potential future optimization

---

## Integration

### Data Flow (Adapter Pattern)

**Reads**:
- Link userData (synergy, quality, state, hasStandingWave)
- Node userData (harmony, corruption, stability, isHealing)
- Camera position (for parallax)
- Link importance scores (calculated internally)

**Writes**:
- Pictogram mesh positions only
- Material properties (opacity, color)
- Visibility flags
- Morphing state (internal)

**Zero gameplay mutation**.

### Coexistence

Works alongside:
- ✅ Braided rope links
- ✅ Pulse waves
- ✅ Directional streaks
- ✅ Link particles
- ✅ Cascade rupture visuals
- ✅ Critical node failure indicators

Never:
- ❌ Occludes nodes
- ❌ Replaces link geometry
- ❌ Spawns on severed links
- ❌ Causes visual clutter

---

## Console Commands

```javascript
// Enable/disable
game.enablePictograms();
game.disablePictograms();

// Status
game.pictogramStatus();
// Shows: enabled/disabled, active count, layer distribution

// Help
game.cascadeHelp();
// Shows all commands including pictogram controls
```

---

## Configuration

### Layer System
```javascript
LAYER_A_ENABLED: true            // Signal glyphs
LAYER_B_ENABLED: true            // Modulator marks
LAYER_C_ENABLED: true            // Memory traces

LAYER_A_OPACITY: 0.7             // 70% opacity
LAYER_B_OPACITY: 0.5             // 50% opacity
LAYER_C_OPACITY: 0.25            // 25% opacity

MEMORY_SPAWN_CHANCE: 0.15        // 15% chance
MEMORY_LIFETIME_MULTIPLIER: 2.0  // 2× longer
```

### Morphing
```javascript
MORPH_DURATION: 1.5              // Seconds
MORPH_SMOOTHNESS: 0.85           // 85% smooth interpolation
```

### Context-Aware Flow
```javascript
RESISTANCE_SLOW_FACTOR: 0.3      // 30% speed near resistance
RESISTANCE_SPACING_COMPRESSION: 0.7  // 70% spacing
STANDING_WAVE_OSCILLATION: 0.4   // 40% oscillation
HEALING_ALIGNMENT_STRENGTH: 0.8  // 80% alignment
RUPTURE_HESITATION_FACTOR: 0.2   // 20% speed when tense
```

### Depth & Parallax
```javascript
PARALLAX_STRENGTH: 0.15          // 15% parallax effect
MICRO_ROTATION_AMOUNT: 0.05      // ±0.05 radians
MICRO_ROTATION_SPEED: 0.3        // Slow rotation speed
```

### Visual Restraint
```javascript
COLOR_SATURATION: 0.25           // 25% saturation (neutral)
BASE_COLOR: 0xb0b0b0            // Neutral grey base
```

---

## Technical Implementation

### State Machine

Each pictogram tracks:
- **Current state**: Active geometry key
- **Target state**: Morph destination (null if not morphing)
- **Morph progress**: 0.0 - 1.0
- **Context flags**: Slowing, oscillating, aligned, tense

### Update Pipeline

1. Age increment and lifetime check
2. Morphing update (if active)
3. Context awareness update (flags)
4. Speed calculation (context modifiers)
5. Progress along link update
6. Phase updates (lateral, vertical, rotation)
7. Position calculation (interpolation + offsets)
8. Opacity fade (in/out + morph + healing)
9. Micro-rotation application

### Morphing Implementation

**Midpoint switch**:
- Morph progresses 0.0 → 1.0 over duration
- At 0.5, geometry switches to target
- Opacity dips slightly for smoothness
- No visual popping (gradual transition)

---

## Visual Philosophy

### Goal

Pictograms should feel like a **symbolic nervous system**:
- **Thoughts**: Primary signal glyphs express intent
- **Tensions**: Context-aware behaviors show stress
- **Memories**: Faint traces preserve history

### Not

- ❌ Particles (too chaotic)
- ❌ Decoration (meaningless)
- ❌ Noise (distracting)
- ❌ Gimmicks (flashy effects)

### Yes

- ✅ **Intentional**: Every glyph has meaning
- ✅ **Alive**: Responds to context intelligently
- ✅ **Informative**: Player reads system state
- ✅ **Calm**: Restrained, professional aesthetic
- ✅ **Hierarchical**: Visual weight guides attention

---

## Future Extensions

Potential enhancements:

1. **GPU instancing**: Batch draw calls per geometry type
2. **Advanced morphing**: Vertex interpolation for smooth transitions
3. **Glyph clustering**: Glyphs group near important events
4. **Player interaction**: Brighten when player looks at link
5. **Audio cues**: Subtle sounds per glyph type
6. **Custom pictograms**: Per-archetype symbol sets
7. **Trail effects**: Faint motion trails behind glyphs
8. **Standing wave full integration**: Deep coupling with wave system
9. **Memory persistence**: Long-term storage of historical traces
10. **Adaptive LOD**: Reduce glyph count at distance

---

## Philosophy Statement

*"Above the network, symbols drift — not randomly, but with purpose. They slow near resistance, oscillate in waves, tense before rupture. Three layers tell three stories: signal, modifier, memory. They morph, not swap. They exist in space, not as stickers. The player doesn't read numbers. They read geometry. They see intent made visible. This is the network's language — calm, precise, alive."*

---

## Comparison: Before vs. After

| Aspect | Before | After |
|--------|--------|-------|
| **Layers** | Single layer | 3-layer stack (signal, modulator, memory) |
| **Transitions** | Abrupt swap | Continuous morphing (1.5s) |
| **Depth** | Flat billboard | Depth layers with parallax |
| **Motion** | Simple drift | Context-aware intelligence |
| **Density** | Fixed 4 per link | Semantic (2-5 based on importance) |
| **Size** | Fixed distribution | Importance-based hierarchy |
| **Color** | Saturated tints | Neutral grey with subtle tints (25%) |
| **Behavior** | Static | Responsive (slowing, oscillating, tensing) |
| **Feel** | Floating icons | Living symbolic nervous system |

---

This enhanced system transforms pictograms from decorative floating icons into a fully-realized semantic visual language that allows players to **read the network's state** through geometry, motion, and spatial positioning — without ever seeing a number or UI element.

