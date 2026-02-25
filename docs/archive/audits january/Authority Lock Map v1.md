# Authority Lock Map

**Project:** ATOMA Engine
**Document type:** Architectural Authority Specification
**Scope:** Node mutation & ownership domains
**Status:** DRAFT v1 (normative)

---

## 0. Purpose

This document defines **exclusive mutation authority** for all major Node domains.

Its purpose is to:

* eliminate multi-writer conflicts,
* prevent order-dependent bugs,
* make Node behavior predictable and auditable,
* lock down responsibilities across systems.

If two systems mutate the same domain without an explicit hierarchy, **the architecture is broken**, even if it works.

---

## 1. Authority Domains Overview

Each Node is composed of multiple **mutation domains**.

For each domain:

* there MUST be exactly **one primary writer**,
* all other systems are observers or requesters.

Domains:

* Logic
* Visual Base State
* Metrics
* Links

---

## 2. Authority Table (Single Writer Rule)

| Domain                | Description                                                   | Primary Authority (Single Writer) | Allowed Readers                  | Forbidden Writers               |
| --------------------- | ------------------------------------------------------------- | --------------------------------- | -------------------------------- | ------------------------------- |
| **Logic**             | Gameplay state, flags, activation, readiness, evolution state | **Node Runtime / Logic Systems**  | Visuals, Metrics, HUD, Analytics | Visual systems, Metrics engines |
| **Visual Base State** | Core visual identity (mesh, base materials, scale baseline)   | **Visual State Binder**           | FX systems, Shaders, HUD         | Gameplay logic, FX packs        |
| **Metrics**           | Numerical tracking, analytics, progression values             | **Metrics Engine**                | HUD, Analytics, Debug            | Logic systems, Visual systems   |
| **Links**             | Node-to-node connectivity and link structure                  | **Linking System**                | Visual link renderers, Metrics   | Logic systems, Visual FX packs  |

---

## 3. Domain-Specific Laws

### 3.1 Logic Domain

The Logic domain includes:

* Node activation state
* lifecycle flags
* gameplay progression
* evolution triggers

Rules:

* Logic systems are the ONLY writers
* Visual feedback MUST be reactive
* Metrics MUST be observational

---

### 3.2 Visual Base State Domain

The Visual Base State defines:

* mesh identity
* baseline scale
* base materials
* render-layer membership

Rules:

* Exactly one system binds base visuals
* FX systems may only apply **derived** visuals
* Base visuals must be restorable

---

### 3.3 Metrics Domain

Metrics include:

* counters
* rates
* historical aggregates
* performance measurements

Rules:

* Metrics never cause gameplay effects directly
* Metrics never mutate visuals directly
* Metrics may emit signals, not commands

---

### 3.4 Links Domain

Links define:

* graph connectivity
* link directionality
* link lifecycle

Rules:

* Only the linking system may create or destroy links
* Visual link effects are derived
* Metrics observe links, never define them

---

## 4. Request vs Write Model

Systems MAY:

* request changes via events
* signal intent

Systems MUST NOT:

* write outside their authority domain

Authority is enforced by **ownership**, not by call order.

---

## 5. Conflict Resolution Rule

If two systems attempt to mutate the same domain:

1. The primary authority ALWAYS wins
2. Secondary writers are architectural violations
3. Order-dependent correctness is forbidden

---

## 6. Audit & Enforcement

During audits:

* identify every mutation
* map it to a domain
* verify the writer matches this table

Violations must be resolved architecturally, not masked.

---

## 7. Evolution of Authority Map

This map may evolve only if:

* a new domain is introduced, or
* a domain is explicitly split

Silent authority shifts are forbidden.

---

## 8. Final Principle

> **Every Node domain has exactly one pen.**
> Multiple pens mean rewritten history.

ATOMA stays coherent by respecting authority, not by hoping for order.
