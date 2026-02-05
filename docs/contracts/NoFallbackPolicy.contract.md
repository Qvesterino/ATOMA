# NoFallbackPolicy.contract.md

## Purpose

This document defines a **hard, non-negotiable policy** for node visual spawning in ATOMA.

The goal is to **eliminate all legacy and silent visual fallbacks** that produce incorrect, misleading, or low-quality node representations (e.g. spheres, boxes, icosahedrons used as emergency visuals).

ATOMA prioritizes **truthful failure over deceptive success**.

---

## Core Principle

> **A node that fails to spawn its canonical visual MUST NOT spawn any visual at all.**

If a node visual cannot be created correctly, the system must:

1. Log a clear error
2. Skip visual attachment for that node
3. Continue execution without crashing

Under no circumstances may a simplified or placeholder geometry be substituted silently.

---

## Definitions

* **Canonical Visual**
  The intended, category-specific, high-fidelity visual representation of a node.

* **Fallback Visual**
  Any simplified geometry (sphere, box, cone, icosahedron, etc.) created when a canonical visual fails.

* **Fail-Fast Visual Policy**
  A strategy where visual creation errors are surfaced immediately and explicitly, instead of being hidden behind fallbacks.

---

## Prohibited Patterns (STRICTLY FORBIDDEN)

The following patterns are **not allowed anywhere in the codebase**:

```js
catch (err) {
  return createFallbackVisual(...);
}
```

```js
if (!visual) {
  node.add(createBasicGeometry());
}
```

```js
try {
  createCanonicalVisual();
} catch {
  createIntegrationNode(); // legacy sphere / box core
}
```

Any code matching these patterns violates this contract.

---

## Required Behavior

### Visual Creation

All node visual creation functions MUST obey the following contract:

```js
try {
  return createCanonicalVisual(node);
} catch (err) {
  console.error('[NodeVisualError]', {
    nodeType: node.type,
    category: node.category,
    error: err
  });
  return null;
}
```

### Spawn Guard

Any code that attaches visuals to nodes MUST guard against null:

```js
const visual = createNodeVisual(node);

if (!visual) {
  console.warn('[NodeVisualSkipped]', node.id);
  return; // continue spawning other nodes
}

node.add(visual);
```

---

## Logging Requirements

All visual failures MUST:

* Use `console.error`
* Include node id, type, and category
* Preserve the original error object

Silent failures are forbidden.

---

## Debug vs Production

* **Production Mode**: No fallbacks, strict enforcement
* **Debug Mode**: Still no automatic fallbacks

Debug tools may provide **manual visualization helpers**, but they must never be part of the spawn pipeline.

---

## Rationale

Fallback visuals cause:

* Misleading game state representation
* Debugging blindness
* Accumulation of visual debt
* Masked systemic errors

A missing node visual is a **signal**.
A fallback visual is **noise**.

ATOMA chooses signal.

---

## Enforcement

* This contract applies to **all current and future code**
* Any PR introducing fallback visuals must be rejected
* Legacy code must be migrated to comply with this policy

---

## Status

* Policy: **ACTIVE**
* Enforcement level: **STRICT**
* Exceptions: **NONE**

---

## Final Statement

> If a node cannot be shown truthfully, it must not be shown at all.

This is a foundational rule for ATOMA visual integrity.
