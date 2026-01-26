# ATOMA Shader Timing Contract

## Purpose

This document defines a **binding architectural contract** for time usage in shaders
and visual systems within the ATOMA engine.

Its goals are:

- preserve visual quality (smoothness, phase continuity, coherence),
- enable aggressive scheduler optimization,
- prevent regressions such as phase popping, stepped waves, flicker, and visual drift,
- eliminate ambiguity around time ownership and responsibility.

This contract is **architectural, not implementational**.
Violations indicate engine design errors, not shader bugs.

---

## Core Axioms

### 1. Time is NOT a scheduler

The scheduler determines **when** systems execute.  
Time determines **how state evolves**.

These concepts must remain strictly separated.

Scheduler optimizations must **never** change the semantic meaning of time.

---

### 2. Shader time MUST be monotonic

All shader-driven animation involving:

- sin / cos
- phase
- pulses
- jitter
- glow / warp / energy / distortion

MUST use time that is:

- monotonic
- updated every frame
- non-quantized
- independent of scheduler cadence

Any violation results in visual instability.

---

### 3. Visual systems are time consumers, never time owners

Visual systems:
- receive time
- interpret time
- never define or mutate canonical time

Time ownership belongs to the engine timing layer only.

---

## Canonical Time Model

ATOMA defines **one canonical visual time** and **optional derived channels**.

### Canonical Visual Time

**Name:** `VisualTime`  
**Role:** authoritative real-time reference for all visuals

Properties:
- monotonic
- per-frame updated (RAF cadence)
- smooth
- scheduler-independent

**MANDATORY usage:**
- shader uniforms (`time`, `phase`, `pulse`, `energy`)
- per-frame visual deformation
- link / aura / hologram / distortion effects
- camera FX
- node visual deformation

➡️ Any realtime visual system MUST default to `VisualTime`.

---

## Derived Time Channels (Advanced)

ATOMA MAY expose **derived visual time channels** for specialized effects.

Example:
- elastic / cinematic visual modulation
- resonance amplification
- dream-like slow/fast warps

### Rules for Derived Channels

Derived channels:

- MUST be derived from canonical `VisualTime`
- MUST remain monotonic
- MUST be updated every frame
- MUST NOT be quantized
- MUST NOT be scheduler-bound

Derived channels are **opt-in**, never implicit.

---

### Global Exposure Rule

If a derived time channel is exposed via `window.*`:

- it MUST be clearly named as a channel (not a clock)
- it MUST be explicitly marked `INTERNAL_ONLY`
- it MUST have a single, documented owner
- it MUST provide a safe fallback to canonical time

Example (conceptual):

```js
visualTime = window.ATOMA_TIME_CHANNELS?.elasticVisual ?? VisualTime.now
Global exposure does NOT imply public API.

NO-MIX Rule (CRITICAL)
Within a single consumer and a single visual effect:

❌ FORBIDDEN:

mixing VisualTime and any derived channel

blending phases from different time sources

driving the same sin/cos domain with multiple clocks

Reason:

phase beating

ghost jitter

non-deterministic flicker

invisible regressions on map switch

Each visual consumer MUST commit to exactly one time source.

Stepped / Quantized Time
Stepped Time
Definition: time quantized to scheduler cadence (e.g. 10–30 Hz)

Allowed usage:

metrics

UI text refresh

analytics

debug overlays

low-frequency systems without phase continuity

FORBIDDEN usage:

shader uniforms

phase-based animation

pulses, waves, glows, warps

Stepped time must never drive visual continuity.

System Classification
Realtime Systems (MUST NOT be throttled)
Use canonical VisualTime only.

Examples:

LinkRenderer

LinkAura / Resonance systems

Glow / Pulse / Distortion shaders

Camera FX

Node deformation

Scheduler may throttle execution, never time input.

Stepped Systems (MAY be throttled)
Use stepped time or internal throttling.

Examples:

CoreMetrics

HUD text

Analytics

Debug overlays

Visual continuity is not critical here.

Forbidden Patterns (ANTI-PATTERNS)
❌ Use scheduler deltaTime as shader time
❌ Quantize shader-driven time
❌ Bind time meaning to scheduler cadence
❌ Assume identical shader code guarantees identical visuals
❌ Implicitly override canonical time
❌ Mix multiple time sources inside one effect

Allowed Patterns (BEST PRACTICES)
✅ One canonical visual time (VisualTime)
✅ Optional derived channels for explicit visual modulation
✅ Always fallback to canonical time
✅ Scheduler optimizations without semantic time changes
✅ Visual systems consume time, never define it

Consolidation & Review Triggers
A timing architecture review MUST be triggered if:

a second consumer adopts a derived visual time channel

a visual flicker / phase pop bug references elastic or derived time

VisualTime v2 consolidation is planned

Until then, derived channels remain INTERNAL and controlled.

Consequences of Contract Violation
Violations cause:

phase jumps

broken pulses

cheap-looking waves

flicker on map switch

regressions without shader code changes

These are time architecture bugs, not shader bugs.

Document Status
Status: ACTIVE

Mandatory for:

all new visual systems

all refactors touching timing

performance optimization passes

ATOMA is an engine with memory, not chaos.