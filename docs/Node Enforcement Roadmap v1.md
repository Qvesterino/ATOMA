# Node Enforcement Roadmap (v1)

**Project:** ATOMA Engine
**Document type:** Architectural Enforcement Plan
**Scope:** Node subsystem
**Status:** DRAFT v1 (non-destructive, forward-looking)

---

## 0. Purpose

This document defines a **non-destructive enforcement strategy** for bringing the Node subsystem
into alignment with the architectural law defined by:

* Node Constitution v1
* Canonical Node Funnel v1
* Authority Lock Map v1

The goal is **not** to refactor everything, but to:

* stop further architectural damage,
* prioritize what must be enforced first,
* allow gradual, low-risk convergence.

---

## 1. Enforcement Philosophy

ATOMA follows a **forward-enforcement model**:

* Existing Nodes may remain as-is unless they cause instability.
* New Nodes MUST obey the constitution.
* Enforcement starts at creation boundaries, not deep internals.

> We prevent new debt before paying old debt.

---

## 2. Enforcement Levels

Violations are classified into three enforcement levels.

### 🔥 Level 1 – Existential (BLOCKING)

Violations that undermine Node existence or identity.

Characteristics:

* multiple spawn funnels
* bypassed validation
* ambiguous lifecycle ownership

Policy:

* MUST be enforced for all NEW Nodes
* Legacy Nodes tolerated short-term

---

### ⚠️ Level 2 – Authority (HIGH PRIORITY)

Violations of the single-writer rule.

Characteristics:

* multi-writer visuals
* competing link mutation
* metrics influencing gameplay

Policy:

* Enforced gradually
* New systems must comply immediately

---

### 🟡 Level 3 – Hygiene (NON-BLOCKING)

Structural debt that increases friction but not instability.

Characteristics:

* duplicated allow-lists
* legacy factories
* naming overlap

Policy:

* Cleanup opportunistically
* Not blocking development

---

## 3. Enforcement Actions by Area

### 3.1 Spawn Funnel Enforcement (🔥 Level 1)

Immediate actions:

* Declare ONE canonical spawn funnel
* All new spawners must delegate to it
* Mark alternate spawners as LEGACY

Deferred actions:

* Migrate legacy spawners only if needed

---

### 3.2 Lifecycle Ownership Enforcement (🔥 Level 1)

Immediate actions:

* Declare a single runtime owner
* Freeze ownership expansion

Deferred actions:

* Consolidate deregistration paths

---

### 3.3 Visual Authority Enforcement (⚠️ Level 2)

Immediate actions:

* Designate ONE base visual binder
* Treat FX packs as derived-only

Deferred actions:

* Gradually retire legacy visual binders

---

### 3.4 Link Authority Enforcement (⚠️ Level 2)

Immediate actions:

* Linking system owns structural links
* FX systems may only decorate

Deferred actions:

* Audit link mutation APIs

---

### 3.5 Metrics Containment (⚠️ Level 2)

Immediate actions:

* Metrics engines emit signals only
* Gameplay must not read metrics directly

Deferred actions:

* Introduce explicit signal boundaries if needed

---

### 3.6 Definition Hygiene (🟡 Level 3)

Immediate actions:

* Declare ONE canonical definition source

Deferred actions:

* Merge or retire alternate factories

---

## 4. Enforcement Timeline (Suggested)

| Phase   | Focus               | Scope                    |
| ------- | ------------------- | ------------------------ |
| Phase A | Stop the bleeding   | Spawn funnel, ownership  |
| Phase B | Authority alignment | Visuals, links, metrics  |
| Phase C | Hygiene cleanup     | Definitions, allow-lists |

Timeline is **flexible** and risk-driven.

---

## 5. What This Roadmap Does NOT Do

* It does NOT mandate refactors
* It does NOT block shipping
* It does NOT require immediate cleanup

It defines **when enforcement begins**, not how cleanup happens.

---

## 6. Success Criteria

The roadmap is successful when:

* All new Nodes follow the canonical funnel
* No new multi-writer domains appear
* Node behavior is predictable by law

---

## 7. Final Principle

> **We enforce tomorrow before repairing yesterday.**

ATOMA evolves by constraining growth, not by erasing history.
