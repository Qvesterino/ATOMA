# ATOMA — 5 Innovative Visual Proposals

**Date:** 2026-04-20  
**Status:** PROPOSAL — awaiting human review  
**Scope:** MEDIUM-to-HIGH innovation budget  
**Constraint:** All proposals must respect FrameScheduler, MetricsRuntime, VisualHierarchyRegistry

---

## Context

ATOMA already has a rich VFX layer: node auras, link particles, cascade waves, healing pulses, corruption desaturation, echo ripples, hub proximity effects, glyph systems, and a cognitive horizon plane.

**What ATOMA does NOT have — and what these proposals target:**

- Temporal depth — the network has no visible memory of its own history
- Spatial atmosphere — the void between nodes is inert and uninformative
- Shape-as-language — node geometry is static; metrics only modulate overlays
- Persistent flow — particles are event-driven bursts, not a living circulatory system
- Topographic readability — metric terrain is invisible; you read numbers, not landscape

Each proposal below addresses one of these gaps with a concrete, implementable concept.

---

## Proposal 1: Metric Tide Pool — The Space Between Nodes Becomes Alive

### Concept

Transform the empty space between nodes into a visible metric flow field. Instead of decorating nodes and links, make the VOID respond to the metrics flowing through the network.

High harmony creates smooth, slow-flowing luminous currents visible as subtle color gradients in the space between nodes. Corruption creates turbulent dark eddies. Synergy creates bright confluence points where flows merge. Load pressure creates visible gravity wells that bend nearby flow lines.

**The space between nodes becomes as informative as the nodes themselves.**

### Why This Is Different

Current ATOMA visuals are node-centric and link-centric. The space between is empty. This proposal makes the negative space the primary atmospheric layer — like looking at a tide pool and seeing currents, temperature gradients, and ecosystems in the water itself.

### Visual Language

```
Harmony  → smooth laminar flow, cyan-green gradients, slow drift
Corruption → turbulent eddies, dark violet swirls, chaotic motion  
Synergy  → bright confluence points, golden mergers
LoadPressure → gravity wells, space bends inward toward overloaded nodes
Stability → stillness, clarity, transparent calm water
```

### Implementation Sketch

- Low-res 3D scalar field texture updated at 10Hz by MetricsRuntime
- Fullscreen shader pass at 30Hz samples the field and renders flow visualization
- Uses existing canonical metrics as input — zero new data sources
- LOD: field resolution drops with camera distance
- Estimated cost: 1 draw call, 1 texture sample per pixel

### Risk: LOW  
Fits cleanly into existing `WORLD_OVERLAY` tier. Purely additive atmosphere layer.

---

## Proposal 2: Temporal Palimpsest — Network Memory as Ghost Layers

### Concept

Every N seconds, snapshot the current network state and render it as a transparent, desaturated ghost layer BENEATH the current state. Over time, you see a stratigraphic cross-section of how the network evolved — old link paths, former node positions, past metric states.

This creates genuine DEPTH IN TIME. You can literally SEE where cascades happened, where corruption spread and was healed, where nodes migrated. The network accumulates visible history like geological strata.

### Why This Is Different

Current ATOMA has no temporal memory in its visuals. Events happen and disappear. This proposal gives the network a visible past — like tree rings or archaeological layers. It turns the scene from a snapshot into a timeline.

### Visual Language

```
Current state  → full color, full opacity, normal rendering
1 snapshot ago → 60% opacity, slightly desaturated
2 snapshots ago → 35% opacity, more desaturated, slight blue shift
3 snapshots ago → 15% opacity, nearly monochrome, deep blue tint
4-5 snapshots   → ghost traces, barely visible, like old photographs
```

### Implementation Sketch

- Render network to a render target every 5 seconds
- Keep last 5-6 targets as a ring buffer
- Blend them with decreasing opacity in a final composite pass
- Snapshots store: node positions, link paths, dominant metric colors
- Cost: 5-6 extra texture lookups per pixel in composite pass

### Risk: MEDIUM  
Requires render-to-texture pipeline. Memory cost for snapshot buffers. Needs careful opacity tuning to avoid visual clutter.

---

## Proposal 3: Breathing Architecture — Node Geometry IS the Metric

### Concept

Instead of nodes being static geometry with effects layered on top, make the node geometry ITSELF respond to metrics through procedural morphing:

- **High harmony** → node SWELLS, becomes rounder, smoother, more organic — like a healthy cell
- **High corruption** → node CONTRACTS, becomes angular, develops crystalline facets — like a diseased cell
- **High load pressure** → node FLATTENS like a pancake under pressure
- **High stability** → node becomes perfectly geometric, Platonic solid
- **High synergy** → node develops subtle internal complexity, like a fractal starting to bloom

**The node IS the metric visualization.** No separate aura needed — the shape itself communicates everything.

### Why This Is Different

Current ATOMA nodes are static meshes with shader overlays. The shape never changes. This proposal makes shape the PRIMARY communication channel — you can read the network state from node silhouettes alone, without any overlays at all.

### Visual Language

```
Harmony  → organic swelling, smooth normals, soft edges
Corruption → crystalline contraction, hard edges, angular facets
Load     → flattening along load axis, compression
Stability → perfect geometry, clean Platonic forms
Synergy  → internal fractal complexity, nested structures
```

### Implementation Sketch

- Vertex shader displacement based on canonical metrics
- Morph targets or procedural noise displacement
- Uses existing metric uniforms already passed to node shaders
- No extra draw calls — just modify existing vertex shader
- LOD: displacement amplitude reduces with distance

### Risk: LOW-MEDIUM  
Modifies existing node shaders. Must preserve node readability at all distances. Morphing must be smooth, not jarring. Needs archetype-aware baselines.

---

## Proposal 4: Chromatic Stress Topography — 3D Contour Lines of Metric Terrain

### Concept

Render actual 3D contour lines — like a topographic map — around nodes and links based on their metric values. These are geometric rings and curves floating in space, not a flat heatmap.

High harmony creates smooth, wide-spaced contours in cool colors. High corruption creates jagged, tight contours in warm colors. Where metrics from different nodes overlap, the contour lines interfere — creating visible interference patterns that reveal hidden relationships between nodes that are NOT directly linked.

### Why This Is Different

Topographic visualization is common in data viz but almost unknown in real-time game visuals. The interference patterns created when metric fields overlap are genuinely beautiful and informative — they reveal relationships that exist in the data but are invisible in the current node-link graph view.

### Visual Language

```
Harmony contours  → smooth circles, wide spacing, cyan-green
Corruption contours → jagged polygons, tight spacing, red-orange
Overlap zones     → interference patterns, moiré-like visual complexity
Stable regions    → concentric, regular, calming
Unstable regions  → broken, fragmented, anxious
```

### Implementation Sketch

- Marching squares algorithm in 3D, rendered as line geometry
- Updated at 10Hz from MetricsRuntime data
- Contour geometry pooled and reused between frames
- LOD: fewer contour levels at distance, skip small features
- Fits into `BASELINE_AURA` visual tier

### Risk: MEDIUM  
New geometry generation pipeline. Must not clutter the scene. Contour density needs careful control. Performance depends on number of active metric fields.

---

## Proposal 5: Circulatory Particle Ecosystem — The Network's Bloodstream

### Concept

Replace the current event-driven particle systems with a PERSISTENT particle ecosystem that lives IN the network. Thousands of tiny particles flow through links like blood cells through veins. Their behavior is governed by network state:

- In high-harmony links: particles flow smoothly in coherent streams — like a healthy river
- In high-corruption links: particles scatter, collide, and form clots — like blocked arteries
- When a cascade happens: particles RUSH like a burst dam through the affected region
- At nodes: particles orbit briefly — processing — then continue — like a heart pumping
- Dead links: particles avoid them, creating visible dead zones

**These particles are NOT spawned on events. They are ALWAYS there, ALWAYS flowing. They ARE the network's circulatory system.**

### Why This Is Different

Current ATOMA particles are decorative — sparks, bursts, trails that appear and disappear. This proposal makes particles the PRIMARY visual metaphor for network health. You can read the entire network state by watching how particles behave, the same way a doctor reads health from blood flow.

### Visual Language

```
Healthy flow  → smooth streams, coherent direction, warm glow
Corrupted flow → chaotic scattering, clumping, dark discoloration
Cascade event  → rush wave, acceleration, bright flash
Node processing → orbital dance, brief accumulation, release
Dead zones    → particle avoidance, visible voids, emptiness
```

### Implementation Sketch

- GPU particle system with ~10K persistent particles
- Flow field derived from link topology and metric state
- Updated at 30Hz in visual tier
- Particles have lifetime but are immediately recycled — always ~10K active
- LOD: particle count reduces with camera distance
- Uses existing link topology data — no new data sources

### Risk: HIGH  
Largest implementation effort. GPU particle management is complex. Must not interfere with existing particle systems during migration. Performance-sensitive — needs strict budget.

---

## Summary Matrix

| # | Proposal | Innovation | Risk | Visual Impact | Perf Cost |
|---|----------|-----------|------|---------------|-----------|
| 1 | Metric Tide Pool | Atmosphere from void | LOW | HIGH | LOW |
| 2 | Temporal Palimpsest | Time as visible depth | MEDIUM | HIGH | MEDIUM |
| 3 | Breathing Architecture | Shape IS data | LOW-MEDIUM | VERY HIGH | LOW |
| 4 | Stress Topography | Topographic contours | MEDIUM | MEDIUM-HIGH | MEDIUM |
| 5 | Circulatory Ecosystem | Persistent living flow | HIGH | VERY HIGH | HIGH |

### Recommended Priority Order

1. **Breathing Architecture** — highest impact-to-effort ratio, modifies existing shaders
2. **Metric Tide Pool** — simplest to implement, transforms atmosphere immediately
3. **Temporal Palimpsest** — unique temporal depth, moderate implementation
4. **Stress Topography** — beautiful interference patterns, needs new geometry pipeline
5. **Circulatory Ecosystem** — most ambitious, needs dedicated implementation phase

---

## Next Steps

Awaiting human review and selection. Any combination of these can be pursued independently — they are designed to be orthogonal and non-conflicting.
