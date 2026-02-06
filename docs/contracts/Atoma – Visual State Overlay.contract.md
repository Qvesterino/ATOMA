# ATOMA – Visual State Overlay Contract

**Status:** Canonical
**Scope:** All visual systems operating above the Core Baseline
**Applies to:** Evolution, Archetype, Personality, Legendary, Colony, Visual Upgrade systems

---

## 0. PURPOSE

This contract defines **how visual state overlays are allowed to exist, animate, and terminate** in ATOMA.

It complements the **Global Visual Baseline Contract** and formalizes the rules for **Layer 2 (Visual State)** and **Layer 3 (FX)** systems.

The goal is to ensure:

* immutable baselines
* explicit visual authority
* reversible or lifetime-bound overlays
* predictable teardown
* safe coexistence of multiple visual systems

---

## 1. LAYER MODEL (CANONICAL)

ATOMA visuals are governed by **three immutable layers**:

### Layer 1 — Core Baseline (Immutable)

* Defined at node creation
* Deterministic
* Never mutated at runtime

### Layer 2 — Visual State Overlay (Persistent)

* Represents semantic node state
* Long-lived (seconds → lifetime)
* May animate internally
* Must NOT mutate baseline

### Layer 3 — FX / Transitional Overlay (Transient)

* Short-lived, event-driven
* May animate freely
* May use randomness
* Must never define identity

---

## 2. VISUAL STATE OVERLAY (LAYER 2)

### 2.1 Definition

A **Visual State Overlay** represents *what the node currently is*, not *how it was created*.

Examples:

* evolution stage
* archetype
* personality
* legendary state
* colony membership
* visual upgrade tier

---

### 2.2 Mandatory Properties

Every Layer 2 system MUST define:

* **ENTER(node)**

  * when and why the overlay attaches
* **ACTIVE(node)**

  * which properties it controls while active
* **EXIT(node)**

  * how it releases control and restores state

If EXIT does not exist, the overlay MUST be explicitly declared **lifetime-bound**.

---

### 2.3 Authority Rules

Layer 2 systems:

✅ MAY:

* attach/detach overlay meshes
* animate overlay materials
* animate overlay transforms
* store semantic state in `userData`

❌ MUST NOT:

* write to baseline node transforms
* write to baseline mesh materials
* assume ownership of baseline properties

---

## 3. FX / TRANSITIONAL OVERLAY (LAYER 3)

### 3.1 Definition

Layer 3 systems exist to visualize **events**, not **identity**.

Examples:

* bursts
* pulses
* transitions
* link effects
* momentary highlights

---

### 3.2 Mandatory Properties

Layer 3 systems MUST:

* have a finite lifetime
* auto-cleanup after completion
* never store persistent semantic state

---

### 3.3 Randomness Policy

Randomness is:

✅ ALLOWED:

* motion variation
* particle dispersion
* burst timing

❌ FORBIDDEN:

* identity changes
* baseline-defining values
* persistent material color/emissive

Randomness affecting identity MUST be:

* seeded
* recorded
* replayable

---

## 4. OVERLAY CONTAINERS (REQUIRED)

All overlays MUST attach to a dedicated container:

```
node.userData.overlayContainers = {
  evolution,
  archetype,
  visuals,
  personality,
  legendary,
  colony
}
```

Rules:

* one container per system per node
* no overlay writes outside its container
* containers must be detachable

---

## 5. RESTORATION CONTRACT

If an overlay temporarily touches any baseline-adjacent property, it MUST:

### 5.1 Capture Before Write

* material.color
* material.emissive / emissiveIntensity
* material.opacity / transparent
* object.scale
* object.position
* renderOrder
* visibility

### 5.2 Restore On Exit

* restore exact prior values
* restore order must be deterministic
* missing restore is a bug

---

## 6. PERSISTENCE TYPES

Every overlay MUST declare exactly one:

* **Transient** — auto-exits (FX)
* **Persistent** — reversible semantic state
* **Lifetime-bound** — exists until node disposal

Ambiguous persistence is forbidden.

---

## 7. CONFLICT RESOLUTION

If multiple overlays compete:

Priority order:

1. Core Baseline (never overridden)
2. Visual State Overlay (Layer 2)
3. FX Overlay (Layer 3)

Layer 3 MUST defer to Layer 2.

---

## 8. DEBUG & ENFORCEMENT

Recommended runtime counters:

* `activeOverlayCount`
* `restoreMissCount`
* `overlayLeakCount`
* `baselineDiffDetectedCount`

Any non-zero value indicates a contract violation.

---

## 9. PHILOSOPHICAL NOTE

ATOMA visuals are not ornamental.

They are:

* semantic
* layered
* governed by contracts

Baseline is truth.
State is meaning.
FX is expression.

---

**End of Contract**
