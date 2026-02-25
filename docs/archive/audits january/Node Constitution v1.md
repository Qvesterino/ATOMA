# Node Constitution (v1)

**Project:** ATOMA Engine
**Scope:** Node subsystem (logic, visuals, lifecycle, authority)
**Status:** DRAFT – ARCHITECTURAL LAW

---

## 0. Purpose

This document defines the **constitutional rules** of the Node subsystem in ATOMA.

Its purpose is to:

* eliminate ambiguity around Node authority,
* establish a single canonical creation and lifecycle model,
* prevent silent architectural drift,
* make future Node types safe, predictable, and extensible.

This document is **normative**, not descriptive.

If code behavior contradicts this constitution, **the code is wrong**, even if it works.

---

## 1. What a Node IS

A **Node** is a **runtime entity** composed of:

* logical identity (category, role, flags)
* lifecycle state (spawned, active, dormant, disposed)
* visual representation (mesh, aura, links, shaders)
* metadata (metrics, personality, evolution state)

A Node is **not**:

* just a mesh
* just a shader
* just a data object

A Node exists only when **all required layers are bound through the canonical spawn funnel**.

---

## 2. Canonical Ownership Model

### 2.1 Single Runtime Owner

There MUST be exactly **one runtime authority** responsible for Node existence.

Responsibilities of the runtime owner:

* Node creation and destruction
* Node registration and identity
* Per-frame lifecycle updates
* Activation / deactivation

All other systems are **consumers**, never owners.

---

## 3. Canonical Spawn Funnel (MANDATORY)

All Nodes MUST be created through a **single canonical spawn funnel**.

### 3.1 Funnel Guarantees

The canonical spawn funnel MUST:

* validate category and type
* enforce uniqueness rules
* attach mandatory metadata
* bind metrics, visuals, and link anchors
* register the Node in global registries

Any Node created outside this funnel is **NON-CANONICAL**.

---

## 4. Spawn Authority Rules

### 4.1 Forbidden Patterns

❌ Direct instantiation of Node-like objects outside the funnel
❌ Bypassing validation or compliance gates
❌ Visual-only spawns that later become logical Nodes

### 4.2 Allowed Patterns

✅ Helper functions that internally delegate to the canonical funnel
✅ Variant wrappers (e.g. Rare / Mythic) that do NOT bypass validation

---

## 5. Node Lifecycle Law

### 5.1 Lifecycle Phases

Each Node MUST follow this lifecycle:

1. **Spawn** – created via canonical funnel
2. **Register** – inserted into registries
3. **Initialize** – visuals, metrics, links bound
4. **Active** – participates in simulation and visuals
5. **Dormant (optional)** – inactive but retained
6. **Dispose** – removed and deregistered

Skipping phases is forbidden.

---

## 6. Mutation Authority

### 6.1 Single-Writer Rule

For each Node aspect, there MUST be **one primary mutation authority**:

* Logical state → logic systems only
* Visual base state → visual state authority only
* Metrics → metrics engine only
* Links → linking system only

Multiple writers to the same domain are forbidden.

---

## 7. Visual Boundary Law

### 7.1 Separation of Concerns

* Node logic MUST NOT directly manipulate rendering primitives
* Visual systems MUST NOT define Node identity or lifecycle

Visual representation is **derived**, never authoritative.

---

## 8. Metrics & Analytics Law

* Metrics are observational, not causal
* Metrics MUST NOT mutate Node logic or visuals directly
* All metric writes must be mediated by the metrics engine

---

## 9. Future-Proof Rule

Adding a new Node type MUST require:

* exactly one definition location
* zero changes to existing Node types
* zero bypasses of the canonical funnel

If adding a Node requires touching multiple allow-lists or spawn paths, the constitution is being violated.

---

## 10. Enforcement & Evolution

### 10.1 Enforcement

Violations of this constitution are architectural bugs.
They must be fixed even if no visible issues exist.

### 10.2 Evolution

This constitution may evolve, but:

* changes MUST be explicit
* changes MUST be documented
* changes MUST not be retroactive without migration rules

---

## 11. Final Principle

> **A Node that does not obey the constitution is not a Node.**

ATOMA evolves by law, not by accident.
