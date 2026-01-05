# Link Semantic Pictogram System

## Overview

Floating pictograms above links that visually encode network meaning and state.

**Philosophy**: *Symbols of intent, memory, and meaning quietly traveling above the network — allowing the player to read the system without UI or text.*

---

## Core Concept

Above each active link, procedural pictograms drift along the path, slightly offset above the geometry. These pictograms represent semantic meaning flowing through the network — **not particles, not decoration**.

---

## Visual Design

### Style
- Minimalist sci-fi pictograms
- High-contrast silhouettes
- Simple geometry (lines, dots, arcs, glyph-like symbols)
- Consistent visual language

### Rendering
- Flat or very shallow 3D
- Slight thickness for depth readability
- Semi-transparent with subtle emissive edge
- Neutral grey-white base with category-specific tints

### Material
- No heavy glow, no bloom
- Subtle and readable
- Billboard facing (always face camera)

---

## Pictogram Types

### Harmony (Blue tint)
- **Circle Ring**: Circle with inner ring (stability)
- **Wave**: Soft wave symbol (flow)
- **Interlocking Arcs**: Connected arcs (unity)

### Corruption (Red tint)
- **Broken Circle**: Circle with gaps (fragmentation)
- **Offset Shards**: Scattered fragments (chaos)
- **Fractured Triangle**: Broken geometry (instability)

### Synergy (Green tint)
- **Chevron**: Directional arrow (momentum)
- **Triple Arrow**: Three parallel arrows (alignment)
- **Braided Line**: Woven pattern (entanglement)

### Instability (Orange tint)
- **Offset Dots**: Dots in irregular positions (disorder)
- **Phase-Shifted Bars**: Bars at different heights (desynchronization)
- **Incomplete Symbol**: Geometry with missing piece (incompleteness)

### Healing (Cyan tint)
- **Reforming Ring**: Almost-complete circle (recovery)
- **Closing Gap**: Two shapes moving together (reunion)
- **Soft Spiral**: Inward spiral (regeneration)

### Standing Wave (Purple tint)
- **Oscillation**: Multi-frequency wave (resonance)
- **Back-Forth Arrows**: Opposing arrows (trapped energy)
- **Looping Wave**: Circular wave pattern (cycle)

---

## Motion & Behavior

### Drift Motion
- Pictograms drift ABOVE links (vertical offset 0.5-1.2 units)
- Follow link curvature precisely
- Slow, deliberate movement
- Direction follows influence flow
- Speed scales with synergy (0.3 - 0.9 units/sec)

### Size Tiers
- **Small (70%)**: 0.15 units
- **Medium (25%)**: 0.25 units
- **Large (5%)**: 0.4 units (importance markers)

### Lifetime
- Fade in: 0.5 seconds
- Active: 8-15 seconds (randomized)
- Fade out: 0.8 seconds

---

## Semantic Mapping

### Harmony-Dominant Links
- Rounded pictograms
- Smooth motion
- Stable spacing
- Blue tint

### Corruption-Dominant Links
- Broken or angular pictograms
- Slight phase offset
- Irregular spacing
- Red tint

### High Synergy
- Improves rhythm and alignment
- Makes pictograms feel intentional
- Faster drift speed
- More pictograms spawn

### High Instability
- Reduces pictogram count
- Causes early fade
- No chaotic motion (remains smooth)
- Spawn chance reduced

### Standing Wave Present
- Pictograms oscillate locally
- May reverse direction briefly
- Appear trapped between nodes
- Subtle back-and-forth movement

### Healing Flow
- Pictograms brighten slightly (+30% opacity)
- Drift upward subtly
- Fade softly near node endpoints
- Cyan tint healing category favored

---

## Spawn & Density

### Spawn Rules
- Max 4 pictograms per link (hard cap)
- Spawn interval: 2 seconds
- Spawn based on dominant link state
- No spawn if no clear dominant state (weight < 0.3)

### Performance
- Pool size: 200 pictograms (pre-allocated)
- GPU instancing via shared geometries
- No per-frame allocations
- Update rate: 30Hz (throttled)

---

## Integration

### Coexistence Rules
**Must coexist with**:
- Braided rope links
- Pulse waves
- Directional streaks
- Link particles

**Must NEVER**:
- Occlude nodes
- Replace link geometry
- Spawn on severed links
- Cause visual clutter

### Data Flow
**Reads (adapter pattern)**:
- Link userData (synergy, quality, state)
- Node userData (harmony, corruption, stability, isHealing)
- Standing wave presence (if integrated)

**Writes**:
- Pictogram mesh positions only
- Material properties (opacity, color)
- Visibility flags

**Zero gameplay mutation**.

---

## Console Commands

```javascript
// Enable/disable
game.enablePictograms();
game.disablePictograms();

// Status
game.pictogramStatus();

// Help
game.cascadeHelp(); // Shows all commands including pictograms
```

---

## Configuration

### Spawn & Density
```javascript
MAX_PICTOGRAMS_PER_LINK: 4        // Hard cap per link
SPAWN_INTERVAL: 2.0               // Seconds between spawns
```

### Size Distribution
```javascript
SIZE_SMALL: 0.15                  // 70% of pictograms
SIZE_MEDIUM: 0.25                 // 25% of pictograms
SIZE_LARGE: 0.4                   // 5% of pictograms
```

### Motion
```javascript
BASE_DRIFT_SPEED: 0.3             // Base units/sec
SYNERGY_SPEED_MULTIPLIER: 2.0     // Speed scales with synergy
VERTICAL_OFFSET_MIN: 0.5          // Min height above link
VERTICAL_OFFSET_MAX: 1.2          // Max height above link
LATERAL_DRIFT_AMOUNT: 0.1         // Side-to-side drift
```

### Standing Wave
```javascript
STANDING_WAVE_OSCILLATION_AMOUNT: 0.3    // Local oscillation
STANDING_WAVE_OSCILLATION_SPEED: 2.0     // Hz
```

### Healing
```javascript
HEALING_UPWARD_DRIFT: 0.2         // Upward drift speed
HEALING_BRIGHTNESS_BOOST: 0.3     // Opacity boost
```

### Lifetime
```javascript
FADE_IN_DURATION: 0.5             // Seconds
FADE_OUT_DURATION: 0.8            // Seconds
LIFETIME_MIN: 8.0                 // Seconds
LIFETIME_MAX: 15.0                // Seconds
```

---

## Geometry Library

All pictograms are **procedurally generated** using Three.js ShapeGeometry and ExtrudeGeometry. No raster sprites.

**Advantages**:
- Infinite scalability
- Consistent visual language
- GPU-efficient
- Easy to modify
- Memory-efficient (shared geometries)

**Cache**:
All 18 pictogram types are pre-created at initialization and stored in geometry cache for instant reuse.

---

## Performance

### Optimizations
1. **Pooled instances**: 200 pre-allocated pictograms (reused)
2. **Shared geometries**: 18 types cached, never duplicated
3. **Throttled updates**: 30Hz update rate (not every frame)
4. **Coarse spawn timing**: 2-second intervals, not per-frame checks
5. **Graceful degradation**: System disables cleanly if needed

### Memory Footprint
- **Geometry cache**: ~18 geometries × 2KB ≈ 36KB
- **Instances**: 200 instances × 200 bytes ≈ 40KB
- **Total**: ~76KB (negligible)

### GPU Cost
- **Draw calls**: 1 per active pictogram (up to 200)
- **Triangles**: ~20-50 per pictogram
- **Total triangles**: <10,000 (negligible)

---

## Visual Philosophy

**Goal**: Pictograms should feel like symbols of intent, memory, and meaning quietly traveling above the network.

**Not**:
- ❌ Particles (too chaotic)
- ❌ Decoration (meaningless)
- ❌ Noise (distracting)

**Yes**:
- ✅ Semantic carriers (meaningful)
- ✅ Readable symbols (clear intent)
- ✅ Quiet presence (non-intrusive)

---

## Future Extensions

Potential enhancements:

1. **Rotation**: Slow rotation for depth
2. **Reaction to player**: Brighten when player looks at link
3. **Audio**: Subtle audio cues per pictogram type
4. **Grouping**: Pictograms cluster near important events
5. **Trails**: Faint trails behind pictograms
6. **Standing wave integration**: Full integration with standing wave system
7. **Custom pictograms**: Per-archetype pictogram types

---

## Technical Notes

### Billboard Effect
Pictograms are rotated to face camera for maximum readability. This is applied via mesh rotation update (not shader).

### Link Curvature
Currently uses linear interpolation between nodes. If links have curves (Bezier/Catmull-Rom), system can be extended to follow curve precisely.

### Material Sharing
All pictograms share a single material instance per category (6 materials total). Color and opacity updated per-instance.

---

## Philosophy Statement

*"Above the network, symbols drift — not randomly, but with purpose. They carry the memory of what flows below: harmony's smooth arcs, corruption's broken circles, synergy's aligned arrows. The player doesn't read text. They read geometry. They see intent made visible."*

Pictograms are the network's **visual language**. Silent, precise, and meaningful.
