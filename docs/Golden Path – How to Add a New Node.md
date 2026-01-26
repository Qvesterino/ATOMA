# Golden Path – How to Add a New Node

**Project:** ATOMA Engine
**Document type:** Canonical Developer & Agent Guide
**Audience:** Human developers, AI agents (CODEX, reviewers)
**Status:** ACTIVE – SINGLE SOURCE OF TRUTH

---

## 0. Purpose

This document defines the **ONLY correct path** for adding a new Node type to ATOMA.

If you follow this page exactly:

* the Node will be canonical,
* it will be future-proof,
* it will not create architectural debt.

If you deviate from this page, the Node is **non-canonical**, even if it works.

---

## 1. Mental Model (Read First)

A Node is **not created** by spawning meshes.
A Node **comes into existence** only after passing the **Canonical Node Funnel**.

Think in this order:

```
Intent → Validation → Creation → Binding → Registration → Activation
```

Never think in terms of visuals first.

---

## 2. Step-by-Step: Adding a New Node Type

### STEP 1: Define the Node Type (ONE PLACE ONLY)

**Goal:** Declare that a new Node category exists.

Rules:

* There must be exactly **one definition location**.
* No duplicate allow-lists.
* No temporary category switches.

Checklist:

* [ ] Add the new Node type to the canonical Node definition source
* [ ] Assign category, role, and default flags
* [ ] Do NOT add visuals here

---

### STEP 2: Validation & Compliance

**Goal:** Make sure the Node is allowed to exist.

Rules:

* Validation must occur BEFORE any Node is created
* Validation logic must not instantiate anything

Checklist:

* [ ] Category is validated via ComplianceGate
* [ ] Uniqueness rules are respected
* [ ] Context (map/mode) allows this Node

---

### STEP 3: Canonical Spawn (Runtime Creation)

**Goal:** Create the Node as a logical runtime entity.

Rules:

* All spawns MUST go through the canonical spawn funnel
* No direct `new THREE.Group()` as Node

Checklist:

* [ ] Node ID is generated
* [ ] Mandatory metadata attached
* [ ] Lifecycle state initialized

---

### STEP 4: Mandatory Binding Phase

**Goal:** Attach required subsystems.

Order matters:

1. Metrics
2. Base Visual State
3. Link Anchors

Rules:

* Only base visuals here
* No effects or upgrades

Checklist:

* [ ] Metrics schema bound
* [ ] Base visual binder attached
* [ ] Link sockets registered

---

### STEP 5: Registration

**Goal:** Make the Node discoverable.

Rules:

* Registration must be atomic
* No deferred or partial registration

Checklist:

* [ ] Node added to global registry
* [ ] Node added to active node set

---

### STEP 6: Activation

**Goal:** Allow the Node to exist in the world.

Rules:

* This is the first frame the Node may render
* This is the first frame interactions are allowed

Checklist:

* [ ] Node marked active
* [ ] Visuals enabled
* [ ] Links enabled

---

## 3. What You Must NOT Do

❌ Spawn Nodes directly in visual systems
❌ Bypass ComplianceGate
❌ Attach FX during spawn
❌ Mutate base visuals outside the visual binder
❌ Write to metrics from logic systems
❌ Create "temporary" Nodes

---

## 4. Authority Reminder (Single Writer)

* Logic → logic systems only
* Visual base → visual binder only
* Metrics → metrics engine only
* Links → linking system only

If you are about to write outside your domain, STOP.

---

## 5. AI Agent Rules (MANDATORY)

If you are an AI agent modifying ATOMA:

* You MUST follow this Golden Path
* You MUST NOT invent new spawn paths
* You MUST ask for clarification if unsure
* You MUST treat violations as bugs

---

## 6. Self-Check Before Commit

Before committing changes, answer YES to all:

* Did the Node pass through the canonical funnel?
* Is there exactly one definition location?
* Is there exactly one writer per domain?
* Can this Node be removed cleanly?

If any answer is NO, the Node is invalid.

---

## 7. Final Principle

> **If adding a Node feels complicated, the path is wrong.**

ATOMA grows by clarity, not by shortcuts.
