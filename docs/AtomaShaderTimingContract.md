
2 715
ATOMA Shader Timing Contract
Purpose

This document defines a binding contract for timing shaders and visual systems in the ATOMA engine. The goals are:

to preserve visual quality (smoothness, phase, continuity),

to enable aggressive scheduler optimization,

to prevent regressions such as phase popping, stepped waves, and visual ugliness.

This contract is architectural, not implementational.

Basic principles
1. Time is NOT a scheduler

The scheduler determines when the system executes. Time determines how the state changes.

These two things must be strictly separated.

2. Shader time must be monotonic

All shader animations based on:

sin / cos

phase

pulses

jitter

warp / glow / energy

MUST use time that:

is monotonic

runs every frame

is not quantized

is not throttled

Time types in ATOM

realTime

Definition: Monotonic time updated every frame (RAF cadence).

Properties:

smooth

no jumps

independent of scheduler layers

Usage (MANDATORY):

shader uniforms (time, phase, pulse, warp, energy)

per-frame visual deformations

link / aura / hologram / distortion effects

steppedTime

Definition: Time quantized according to scheduler cadence (10–30 Hz).

Features:

jump

optimized

suitable for slowly changing systems

Usage (ALLOWED):

metrics

UI texts

analytical aggregations

low-frequency effects without sin/cos dependence

System classification
Realtime systems (MUST NOT be throttled)

Use realTime.

Examples:

LinkRenderer

LinkAura / Resonance systems

Glow / Pulse / Distortion shaders

Camera FX

Node visual deformation

➡️ Scheduler must not affect their time input.

Stepped systems (MAY be throttled)

Use steppedTime or internal throttle.

Examples:

CoreMetrics calculations

HUD text refresh

Analytics

Debug overlay values

➡️ Visual continuity is not critical here.

Forbidden patterns (ANTI-PATTERNS)

❌ Use deltaTime from scheduler as shader time

❌ Move shader-driven systems from realtime layer

❌ Bind time to visual / simulation cadence

❌ Assume that "when shader code is the same, visual will be the same"

Allowed patterns (BEST PRACTICES)

✅ Separate:

EngineTime.real

EngineTime.stepped

✅ Always feed shader uniforms from realTime

✅ Optimize scheduler WITHOUT changing the meaning of time

✅ Visual system = time consumer, not its owner

Consequences of contract violation

If the contract is violated:

sin/cos phases jump

pulses fall apart

lines look "cheap"

visuals flicker on map switch

regressions appear without changing shader code

➡️ This is NOT a shader bug, but a time architecture bug.

Document Status

Status: ACTIVE

Mandatory for all new visual systems

Refactorers must respect this contract

ATOMA – An engine with memory, not chaos.
