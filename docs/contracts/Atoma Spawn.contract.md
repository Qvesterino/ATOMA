# ATOMA CONTRACT

## ArchetypeRegistry – Single Source of Truth

### Status

**ACTIVE CONTRACT**

This contract defines the canonical authority for all node archetypes used in spawning and creation.

---

# Purpose

Prevent:

* duplicate archetype definitions
* inconsistent naming
* hidden factory variants
* spawn/visual mismatches
* long-term registry drift

Goal:

> Every spawnable node archetype must be defined **once and only once**.

---

# Core Rule

**ArchetypeRegistry is the single source of truth.**

All systems must obtain archetype information from:

```
ArchetypeRegistry
```

No system may introduce archetypes independently.

---

# Canonical Flow

Spawn pipeline:

```
Scheduler
→ getNextCyclicSpawnCategory()
→ ArchetypeRegistry.getNext(category)
→ spawnNode(category, forceArchetype)
→ createNode(...)
→ EnhancedNodeModels.createX(...)
```

---

# Allowed Responsibilities

## ArchetypeRegistry

May define:

* archetypeKey (string, unique)
* category
* factory reference
* uniqueness flag (optional)
* weight / order (optional)

Example:

```
{
  key: "integration_trefoil",
  category: "integration",
  factory: IntegrationEnhancedVariants.createIntegrationEnhanced_SignalKnot,
  unique: false
}
```

---

## AINodes.spawnNode

May:

* enforce uniqueness via archetypeKey
* pass forceArchetype
* attach userData.archetypeKey

Must NOT:

* decide which archetypes exist
* generate new archetype names
* contain hardcoded variant lists

---

## EnhancedNodeModels / Variant Files

May:

* implement visual creation logic

Must NOT:

* decide spawn order
* register themselves implicitly
* create hidden archetypes

All factories must be referenced by ArchetypeRegistry.

---

# Forbidden Patterns

### ❌ Hardcoded variant arrays inside factories

```
const variants = [
  this.createKnotA,
  this.createKnotB
];
```

If these represent spawnable archetypes → they must move to ArchetypeRegistry.

---

### ❌ Runtime archetype name generation

```
newNode.userData.archetype = category + "_" + index;
```

Archetype keys must be predefined.

---

### ❌ Multiple registration points

Only one place may define archetypes.

---

# Identity Rules

Every spawned node must contain:

```
newNode.userData.archetypeKey   // canonical identity
newNode.userData.category
```

This key is used for:

* unique spawn guard
* analytics
* persistence (future)
* debugging

---

# Uniqueness Policy

If `unique: true` in registry:

```
spawnNode() must refuse duplicate instances
```

If duplicate detected:

* return null
* scheduler fallback handles next category

No internal retry loops inside spawnNode.

---

# Migration Policy (Important)

Existing code may still contain:

* legacy variant arrays
* category-based selection

**Do NOT refactor immediately.**

Rules:

* New archetypes → registry only
* Old systems → allowed until touched
* When modifying a variant system → migrate it

---

# Debug Contract

Optional debug check (recommended):

On spawn:

```
if (!newNode.userData.archetypeKey) {
  console.warn("[ArchetypeContract] Missing archetypeKey");
}
```

---

# Stability Principle

This contract exists to prevent:

* spawn unpredictability
* silent duplication
* variant explosion
* long-term architectural drift

If violated, spawn behavior becomes non-deterministic.

---

# Summary

**Single authority:**
ArchetypeRegistry

**Spawn identity:**
userData.archetypeKey

**No hidden variants**
**No implicit registration**
**No distributed archetype logic**

---

**Contract Level:** Architecture / Core Systems
**Applies to:** Spawn, Factories, Variants, Future Persistence
