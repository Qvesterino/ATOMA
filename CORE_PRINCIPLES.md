# CORE_PRINCIPLES -- ATOMA

This document defines the core principles that guide all decisions in ATOMA.

These principles are non-negotiable.
They protect identity, coherence, and long-term systemic quality while allowing controlled evolution.

---

## Project Phase

`PROJECT_PHASE = EVOLUTION_V2`

ATOMA is not in stabilization mode.
ATOMA is in controlled evolution.

The system is expected to improve, modernize, and expand in quality without abandoning its identity.

---

## 1. ATOMA IS A SYSTEM, NOT A SPECTACLE

ATOMA prioritizes systemic meaning over visual noise.

- visuals communicate state
- effects support understanding
- atmosphere strengthens perception of the system
- nothing exists purely for decoration

If something looks impressive but communicates nothing, it does not belong in ATOMA.

---

## 2. SUBTLETY, CLARITY, AND MEANING

ATOMA prefers:

- readable signals over noisy signals
- meaningful layering over flat spectacle
- emergent communication over UI spam
- interpretability over raw intensity

Subtlety is still a core value, but subtlety does not mean weakness.
High impact is valid when it remains readable, purposeful, and low-noise.

---

## 3. EVERYTHING MUST HAVE A REASON

Every system, metric, visual behavior, and architectural change must answer:

- Why does this exist?
- What does it improve?
- What does it communicate?
- What would be lost if it were removed?

Valid reasons include:

- performance
- clarity
- visual quality
- system coherence

If no clear reason exists, the feature is suspect.

---

## 4. CONTROLLED INNOVATION, NOT CHAOS

Innovation is part of ATOMA.

New systems, refactors, visual layers, and optimizations are allowed when they:

- improve performance
- improve clarity
- improve visual quality
- improve system coherence

Not allowed:

- random effects without meaning
- duplicate systems without reason
- architectural chaos
- breaking changes without clear justification

---

## 5. BALANCE OVER RAW OPTIMIZATION

ATOMA is not about maximizing values blindly.

- synergy can become unstable in excess
- harmony is valuable because it is fragile
- corruption is meaningful, not merely negative
- stability matters because the system is alive, not static

Optimization without systemic context breaks the system.

---

## 6. CALM IS A DESIGN GOAL, NOT A LIMITATION

ATOMA avoids constant stimulation.

- silence is allowed
- stillness is meaningful
- change must earn attention
- intense moments must emerge from systemic truth

The system should feel alive, energetic, and intelligent without collapsing into visual noise.

---

## 7. LAYERED VISUAL LANGUAGE

ATOMA visuals should be built in layers:

- `CORE`
- `SURFACE`
- `OVERLAY`
- `ATMOSPHERE`

Each layer must have a readable role.
Effects should reinforce structure, not bury it.

Preferred target:

- high impact
- low noise
- clear hierarchy
- graceful degradation

---

## 8. SUBSYSTEM AUTONOMY

ATOMA evolves through modular subsystems.

Primary mental model:

- `NODE SYSTEM`
- `LINK SYSTEM`
- `METRICS SYSTEM`
- `WAVE / CASCADE SYSTEM`
- `VISUAL FX SYSTEM`
- `UI SYSTEM`

Each subsystem may evolve independently.
Each subsystem must still respect shared global authorities and compatibility boundaries.

Do not create unnecessary cross-dependencies.
Do not break another subsystem's API without reason.

---

## 9. SHARED AUTHORITIES MUST REMAIN CLEAR

The following authorities remain canonical:

- `FrameScheduler`
- `MetricsRuntime`
- `VisualHierarchyRegistry`

Canonical metrics remain:

- `synergy`
- `harmony`
- `stability`
- `corruption`
- `loadPressure`

No system should silently override another system.
No subsystem should duplicate global authority without concrete justification.

---

## 10. PERFORMANCE IS PART OF DESIGN

Performance is not an afterthought.
ATOMA runs in the browser and must remain scalable.

Rules:

- respect `FrameScheduler` timing tiers: `10Hz` simulation, `30Hz` visual, `60Hz` runtime
- prefer GPU-driven solutions where practical
- use LOD and distance-based activation where relevant
- stage heavy initialization across multiple frames
- keep shader cost proportional to value

---

## 11. AI ROLE

AI is:

- co-architect
- system designer
- VFX engineer
- optimization partner

AI may:

- propose new systems
- refactor existing systems
- improve architecture
- modernize visuals and subsystem structure

AI must:

- preserve compatibility by default
- respect these core principles
- tie changes to concrete reasons
- avoid duplication and meaningless complexity

Final project authority remains human.

---

## Final Note

These principles protect ATOMA from entropy, noise, and incoherent growth.

If a decision violates these principles, it should be redesigned before implementation.
