# ATOMA – Global Visual Baseline Contract

## Phase B.3

**Status:** Canonical
**Scope:** All node visuals (all worlds, all archetypes)
**Intent:** Deterministic, stable, debuggable visuals

---

## 1. PURPOSE

This contract defines a **single, authoritative rule-set** for how node visuals are initialized, maintained, and modified in ATOMA.

The goal is to ensure that:

* Visuals are **deterministic**
* Idle nodes are **visually stable**
* No implicit or time-based visual drift exists
* All visual changes are **explicit, event-driven, and reversible**

This contract exists to prevent:

* ghost pulses
* brightness mismatches
* scale drift
* shared-material side effects
* non-debuggable visual state changes

---

## 2. CORE DEFINITIONS

### 2.1 Visual Baseline

**Visual Baseline** is the canonical, idle-state visual configuration of a node.

It includes:

* scale
* emissiveIntensity
* opacity
* transparency flags
* metalness / roughness (if relevant)
* material identity (clone ownership)

A baseline:

* is applied **once**
* is deterministic
* never changes implicitly

---

### 2.2 Baseline vs Overlay

| Layer    | Description                       | Mutability             |
| -------- | --------------------------------- | ---------------------- |
| Baseline | Idle, canonical visual state      | Immutable after create |
| Overlay  | Hover / select / activate visuals | Temporary, reversible  |

Overlays **must never** overwrite baseline values.

---

## 3. GLOBAL RULES (MANDATORY)

### RULE 1 — Baseline Is Set Once

Visual baseline:

* MUST be applied during node creation
* MUST NOT be reapplied later

Forbidden locations for baseline writes:

* update()
* animate()
* tick()
* sync / refresh systems
* background tasks

---

### RULE 2 — No Time-Based Baseline Modulation

Baseline visuals:

* MUST NOT depend on time
* MUST NOT use sin/cos/noise
* MUST NOT animate while idle

If it moves without interaction, it is **not baseline**.

---

### RULE 3 — No Randomness in Baseline

Baseline visuals:

* MUST NOT use Math.random()
* MUST NOT depend on spawn order or timing

If variation is desired:

* it must be explicit
* seed-based or archetype-based
* documented

---

### RULE 4 — No Shared Materials in Baseline

Each mesh participating in a baseline:

* MUST own its own material instance
* MUST use material.clone()

Shared materials are forbidden for baseline visuals.

---

### RULE 5 — Overlays Are Explicit and Scoped

All visual changes after baseline:

* MUST be event-driven
* MUST declare their scope
* MUST be reversible

Allowed overlay triggers:

* hover
* select
* activate
* link interaction

---

## 4. ALLOWED VISUAL WRITES BY PHASE

### 4.1 Creation Phase

Allowed:

* applyBaseline()
* material.clone()
* static property assignment

---

### 4.2 Runtime Idle Phase

Allowed:

* NOTHING

Idle visuals must be frame-stable.

---

### 4.3 Interaction Phase

Allowed:

* additive overlays
* temporary emissive boost
* outline / highlight

Required:

* clear entry
* clear exit
* no baseline mutation

---

## 5. CANONICAL FUNCTION PATTERN

Every node archetype SHOULD follow:

```
createNode() {
  mesh = buildGeometry()
  applyVisualBaseline(mesh)
  registerNode(mesh)
}
```

Where:

* applyVisualBaseline is pure
* deterministic
* side-effect free

---

## 6. DEBUGGING GUARANTEES

If this contract is respected:

* identical nodes look identical
* visual bugs are reproducible
* visual state can be reasoned about
* FPS behavior is predictable

Any violation of this contract is a **bug by definition**.

---

## 7. ENFORCEMENT

### 7.1 Code Review

Any code that:

* writes to scale / emissive / opacity
* outside of create or explicit overlay

MUST be rejected.

---

### 7.2 Audit Triggers

A visual audit MUST be triggered when:

* a node looks different without interaction
* visuals change after idle time
* two identical nodes differ

---

## 8. PHILOSOPHICAL NOTE

ATOMA nodes are:

* systems
* infrastructure
* machines

They are **not organisms**.

Motion is information.
Silence is stability.

---

## 9. VERSIONING

* Phase B.3 establishes this contract
* All future visual systems MUST comply
* Exceptions require explicit documentation

---

**End of Contract**
