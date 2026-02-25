# Canonical Node Funnel

**Project:** ATOMA Engine
**Document type:** Architectural Specification
**Scope:** Node creation & lifecycle entry point
**Status:** DRAFT v1 (normative)

---

## 0. Purpose

This document defines the **single canonical spawn funnel** through which **all Nodes MUST be created** in ATOMA.

The funnel is a **conceptual and architectural contract**, not a refactor plan.
It describes **what must happen**, not how it is currently implemented.

Any Node that bypasses this funnel is considered **non-canonical**, even if it renders correctly.

---

## 1. High-Level Funnel Overview

The canonical Node funnel is a **linear, ordered sequence** of responsibilities.

```
Request → Validate → Create → Bind → Register → Activate
```

No step may be skipped, reordered, or partially applied.

---

## 2. Step-by-Step Funnel Specification

### STEP 1: Spawn Request

**Intent:** Express the desire to create a Node.

Characteristics:

* declarative (what Node, not how)
* contains no rendering or state mutation

Required inputs:

* node category / type
* spawn context (map, system, user action)
* optional variant flags (rare, mythic, etc.)

❌ Forbidden:

* creating meshes
* touching registries
* mutating global state

---

### STEP 2: Validation & Compliance

**Intent:** Ensure the Node is allowed to exist.

Responsibilities:

* category allow-list validation
* uniqueness checks
* positional / contextual validity
* rule compliance (gameplay, balance, mode)

Outputs:

* APPROVED or REJECTED spawn

❌ Forbidden:

* visual instantiation
* partial Node creation

---

### STEP 3: Canonical Node Creation

**Intent:** Instantiate the Node as a runtime entity.

Responsibilities:

* create the Node identity
* assign stable ID
* attach mandatory metadata
* initialize lifecycle state

Guarantees:

* Node exists as a logical entity
* Node has no visuals yet

❌ Forbidden:

* visual effects
* links
* metrics side-effects

---

### STEP 4: Binding Phase

**Intent:** Attach required subsystems to the Node.

Mandatory bindings:

* metrics schema
* base visual state
* link anchors / sockets
* interaction hooks

Order matters:

1. metrics
2. base visuals
3. links

❌ Forbidden:

* derived visuals
* upgrades
* effects

---

### STEP 5: Registration

**Intent:** Make the Node globally visible.

Responsibilities:

* insert into node registry
* add to active node sets
* expose to systems via stable references

Guarantees:

* Node can now be discovered
* Node identity is immutable

❌ Forbidden:

* deferred registration
* multiple registries

---

### STEP 6: Activation

**Intent:** Allow the Node to participate in the world.

Responsibilities:

* enable per-frame updates
* enable visuals and links
* allow interactions

Activation is the **first frame** where a Node may:

* render
* interact
* emit metrics

---

## 3. Variant & Special Case Rules

* Variants (rare, mythic, archetype) MUST:

  * delegate to the same funnel
  * apply differences only AFTER Step 4

* No variant may:

  * bypass validation
  * bypass registration
  * redefine lifecycle

---

## 4. Failure & Abort Rules

If any step fails:

* the funnel MUST abort immediately
* no partial Node may survive
* no visuals may persist

Partial Nodes are forbidden.

---

## 5. Canonical Funnel Invariants

The following MUST always be true:

* exactly one funnel exists
* every Node can name the funnel that created it
* every Node knows its lifecycle phase
* no Node is visible before registration

---

## 6. What This Document Does NOT Do

* It does NOT prescribe file names
* It does NOT mandate refactors
* It does NOT remove experimental paths

It only defines **what is canonical**.

---

## 7. Enforcement Philosophy

The funnel is enforced by:

* architectural reviews
* audits
* future refactors

Not by hacks or patches.

---

## 8. Final Principle

> **If a Node did not pass through the funnel, it does not exist.**

ATOMA grows by tightening funnels, not widening them.
