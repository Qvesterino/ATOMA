# MEMORY.md — ATOMA Resident Persistent Memory

Project: ATOMA  
Nature: Long-term systemic engine (not a typical game)

---

## 1️⃣ Constitutional Reality

ATOMA is governed by:


- CORE_PRINCIPLES.md
- ATOMA_OVERVIEW.md
- ATOMA_CORE_CONTEXT.md

These documents define identity.
They are not casually modified.

---

## 2️⃣ Architectural Invariants (Current Era)

The following are considered canonical:

- Node identity unified via `node.userData.nodeId`
- WorldRoot and NodeRoot are explicit scene anchors
- Visual systems are separated from metrics logic
- Effects categorized (e.g. burst / field / signal)
- FrameScheduler controls visual timing authority
- GPU-first philosophy (CPU orchestrates, GPU renders)

These are structural decisions, not experiments.

---

## 3️⃣ Development Model

Human (Daniel) = final authority  
Resident Architect (this agent) = reasoning layer  
Executor models (Devstral / Nemotron / etc.) = patch layer  

Default workflow:
Analysis → Proposal → Approval → Execution

---

## 4️⃣ Guardrails

- No speculative refactors
- No visual spectacle without systemic meaning
- No duplication of metric logic
- No cross-layer leakage
- Prefer additive and reversible integration

---

## 🗂️ Legacy Code Removal (2026-03-03)

### Removed Systems

**Unique Spawn Systems (Removed 2026-03-03):**
- `UniqueSpawnService.js` - Redundant uniqueness enforcement (replaced by AINodes.nodeRegistry)
- `UniqueSpawnRegistry.js` - Duplicate uniqueness tracking
- `NodeSpawnRegistry.js` - Convenience wrapper (spawn counting, logging)
- **Rationale:** Uniqueness enforcement no longer needed - ATOMA allows duplicate spawns freely

**Legacy Spawner Systems (Moved to LEGACY folder 2026-03-03):**
- `_NodeLinking2_3.js` - Old/legacy linking system (superseded by NodeLinking2_3)
- `_RareNodeSpawner.js` - Rare node spawner system (no longer needed)
- `SpawnerConsolidationDetector_v1.js` - Spawner consolidation detector (still in use via HOTFIX)
- **Rationale:** NodeLinking2_3.js is active system; rare node spawner functionality not required

**Main.js Cleanup:**
- Removed imports for legacy linking systems (`_NodeLinking2_3`)
- Removed legacy comments referencing old systems
- **Impact:** Simplified imports, removed redundant legacy code references

**Documentation Updates:**
- `UNIQUE_SPAWN_DELETION_PLAN.md` - Status updated to "DELETED - ALL SYSTEMS REMOVED"

---

## 5️⃣ Long-Term Direction

ATOMA is evolving slowly.

Goals:

- Deterministic propagation of metrics
- Coherent link behavior
- Visuals as truthful system expression
- Stable lifecycle management across world rebuilds

The system must remain readable, calm, and interpretable.

---

## 6️⃣ Resident Awareness

This agent:

- does not assume dormant systems are active
- does not invent missing architecture
- defaults to architectural analysis
- optimizes for multi-year coherence

If uncertainty exists → ask before proposing structural change.
