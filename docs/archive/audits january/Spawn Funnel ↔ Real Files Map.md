# Spawn Funnel ↔ Real Files Map

**Project:** ATOMA Engine
**Document type:** Architectural Reality Mapping
**Scope:** Node creation funnel vs current codebase
**Status:** DRAFT v1 (descriptive)

---

## 0. Purpose

This document maps the **Canonical Node Funnel** (normative law)
onto the **actual files and functions** currently implementing Node behavior in ATOMA.

It exists to:

* remove ambiguity during refactors,
* help humans and AI agents navigate the codebase safely,
* make violations immediately visible.

This document **does not propose changes**.

---

## 1. Canonical Funnel Overview

Canonical order:

```
1. Request
2. Validation
3. Create
4. Bind
5. Register
6. Activate
```

Each step below lists:

* Primary canonical file(s)
* Supporting files
* Known violations / overlaps

---

## 2. STEP 1 – Spawn Request

**Canonical responsibility:**

* Express intent to create a Node

**Observed files:**

* `AINodes.js`

  * `createNodes()`
  * `spawnNode()`

**Supporting files:**

* map loaders
* gameplay triggers

**Notes:**

* Request is mostly clean
* Some variant spawners embed creation logic prematurely

---

## 3. STEP 2 – Validation & Compliance

**Canonical responsibility:**

* Category allow-list
* Uniqueness rules
* Context checks

**Observed files:**

* `SpawnAuthorityComplianceGate.js`
* `NodeSpawnRegistry.js`

**Supporting files:**

* `AINodes.validateCategory()`

**Known gaps:**

* Rare/Mythic spawners bypass this step
* Allow-lists duplicated across files

---

## 4. STEP 3 – Canonical Creation

**Canonical responsibility:**

* Create Node identity
* Assign ID
* Initialize lifecycle

**Observed files:**

* `AINodes.createNode()`

**Supporting files:**

* `EnhancedNodeModels.js`

**Known gaps:**

* Some spawners directly construct `THREE.Group`
* Creation sometimes mixed with binding

---

## 5. STEP 4 – Mandatory Binding

### 4.1 Metrics Binding

**Observed files:**

* `NodeMetricEngine.js`

### 4.2 Visual Base Binding

**Observed files:**

* `NodeVisualStateBinder.js`
* `NodeVisualBootstrap3_0.js`

**Legacy overlaps:**

* `NodeVisualStateBinder_OLD_v1.js`

### 4.3 Link Anchors

**Observed files:**

* `NodeLinkingSystem.js`

**Known gaps:**

* Upgrade layers sometimes mutate base visuals

---

## 6. STEP 5 – Registration

**Canonical responsibility:**

* Global discoverability

**Observed files:**

* `AINodes.js`

  * `nodes[]`
  * `activeNodes`

**Supporting files:**

* `NodeSpawnRegistry.js`

**Known gaps:**

* Deregistration not symmetric

---

## 7. STEP 6 – Activation

**Canonical responsibility:**

* First frame of existence

**Observed files:**

* `AINodes.update()`
* Visual bootstrap monitors

**Known gaps:**

* Some visuals activate before registration

---

## 8. Parallel / Non-Canonical Paths (Summary)

The following files bypass or partially implement the funnel:

* `_RareNodeSpawner.js`
* `_MythicNodeCreation.js`
* Direct `EnhancedNodeModels.create()` usage
* Visual upgrade packs during spawn

These are considered **LEGACY or EXPERIMENTAL** paths.

---

## 9. How to Use This Map

* During refactors: verify each funnel step maps to exactly one responsibility
* During audits: flag any new code that introduces parallel paths
* For AI agents: this map is mandatory navigation context

---

## 10. Final Principle

> **If you cannot point to the funnel step, the code does not belong.**

ATOMA stays sane by mapping law to reality.
