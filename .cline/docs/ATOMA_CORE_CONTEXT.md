# ATOMA — CORE CONTEXT

This project is called ATOMA.

It is a long-running, modular game engine project.

Rules:

- Always search the codebase before referencing files or functions
- Do not assume file names or locations
- Prefer minimal, safe changes
- Do not rewrite systems unless explicitly asked
- Respect existing architecture and naming conventions
- Ask before making structural changes if unsure

## 1. What ATOMA Is

ATOMA is a living, node-based AI simulation and visual system.
It is NOT a traditional game.

ATOMA represents:

- Nodes as entities with internal state
- Links as living relationships between nodes
- Metrics (synergy, harmony, corruption, stress) as invisible forces
- Visuals as real-time expressions of system state

ATOMA behaves more like an organism or ecosystem than a static application.

---

## 2. Technology Stack

- Language: TypeScript
- Rendering: Three.js (WebGL2), future WebGPU
- Architecture: modular, layered, GPU-first
- Rendering style: shader-heavy, minimal CPU animation
- Tooling: VS Code, Vite, npm
- AI: Local LLMs via Ollama

---

## 3. Core Design Principles

These rules are NON-NEGOTIABLE:

- Stability > performance
- Minimal change > large rewrites
- Additive changes > destructive refactors
- Visual clarity > visual spectacle
- GPU does rendering and simulation
- CPU orchestrates systems and state

No system should silently override another system.

---

## 4. Nodes

Nodes are not simple meshes.

Each node has:

- A core (must ALWAYS remain visible)
- A state (metrics, flags, phase)
- Optional aura or effects (never opaque)
- Personality or behavior traits (optional)

Rules:

- Node cores must NEVER be hidden by aura, postprocessing, or events
- Node visuals are controlled by shader uniforms
- Node animation should be GPU-driven where possible

---

## 5. Links

Links are living connections, not static lines.

Links express:

- Load
- Direction
- Quality
- Stress
- Historical memory (optional)

Rules:

- Links must not visually dominate nodes
- Link visuals must reflect metrics truthfully
- Link logic and visuals are separated systems

---

## 6. Metrics

Core metrics include (but are not limited to):

- Synergy
- Harmony
- Corruption
- Stress / Load
- Phase / Resonance

Rules:

- Metrics are computed first
- Visuals only READ metrics, never invent them
- Metrics propagation must be deterministic

---

## 7. Visual System

Visuals are an interpretation layer, not gameplay logic.

Visual layers include:

- Node core materials
- Auras and shells (additive, transparent)
- Links
- Particles and fields
- Postprocessing (bloom, fog, distortion)

Rules:

- Postprocessing must never hide gameplay-critical visuals
- No visual system may permanently modify core materials
- All visuals must be safely disableable

---

## 8. GPU Philosophy

ATOMA is GPU-first.

- Prefer shaders over CPU animation
- Prefer instancing over individual meshes
- Prefer uniform-driven behavior over per-object logic
- Prepare systems for future WebGPU compute migration

---

## 9. Safety Rules for AI

Any AI assisting on ATOMA must follow:

- Do NOT assume missing files
- Do NOT invent APIs or systems
- Do NOT refactor unless explicitly instructed
- Do NOT touch files not provided
- Warn before risky changes
- Ask if context is missing

Silence is preferred over guessing.

---

## 10. Project Goal

The goal of ATOMA is not visual realism.
The goal is:

- clarity
- coherence
- emergent behavior
- a world that feels alive and reactive

ATOMA should feel like observing a living system, not playing a scripted game.
