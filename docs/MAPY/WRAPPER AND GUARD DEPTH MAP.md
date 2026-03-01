# ATOMA – WRAPPER & GUARD DEPTH MAP AUDIT
**PHASE: READ-ONLY ANALYSIS COMPLETE**
**DATE: 2026-02-28**

---

## EXECUTIVE SUMMARY

ATOMA exhibits **EXCESSIVE GUARD STACKING** with moderate-to-high wrapper density. The spawn system alone traverses **6-8 guard layers** before execution, with deep nesting (3-5 levels) in critical paths. Early return patterns dominate execution flow, with many functions aborting before reaching main logic.

**Key Findings:**
- Spawn system: 7 distinct guard layers before node creation
- Double routing patterns prevalent (createNodes→createNode, requestSpawn→spawnNode)
- Token-based authority gates preventing unauthorized access
- Multiple validation layers with overlapping responsibilities
- FrameScheduler adds additional gating with load shaping

---

## STEP 1 – WRAPPER INVENTORY

| Wrapper Function | File | Wraps | Depth Level | Mutates Behavior? |
|---|---|---|---|---|
| `createNodes()` | AINodes.js | `createNode()` (multiple times) | Level 1 | YES – applies uniqueness checks |
| `requestSpawn()` | AINodes.js | `_processSpawnRequests()` → `spawnNode()` | Level 2 | YES – queues & prioritizes |
| `_processSpawnRequests()` | AINodes.js | `spawnNode()` (token-gated) | Level 3 | NO – simple delegation |
| `spawnNode()` | AINodes.js | `createNode()` | Level 4 | YES – validates, enforces authority |
| `createNode()` | AINodes.js | `EnhancedNodeModels.create()` | Level 5 | YES – category fallbacks |
| `spawnMythicNode()` | AINodes.js | `requestSpawn()` | Level 2 | NO – thin wrapper |
| `spawnPrimeNode()` | AINodes.js | `requestSpawn()` | Level 2 | NO – thin wrapper |
| `spawnErrorNode()` | AINodes.js | `requestSpawn()` | Level 2 | NO – thin wrapper |
| `spawnArchetype()` | AINodes.js | `requestSpawn()` | Level 2 | NO – thin wrapper |
| `createConnection()` | AINodes.js | Direct line creation | Level 1 | NO |
| `updateNodeVisuals()` | AINodes.js | `EnhancedNodeModels.animate()` | Level 2 | NO – delegates |
| `update()` | AINodes.js | Per-node processing loop | Level 1 | YES – hysteresis gating |
| `_finalizeSpawnedNode()` | AINodes.js | Scene attachment + registration | Level 5 | YES – validates integrity |

**Observation:** Spawn APIs have 3+ wrapper layers (public → queue → token → factory). Specialized spawn methods (`spawnMythicNode`, etc.) are thin wrappers around `requestSpawn()`.

---

## STEP 2 – GUARD LAYER DEPTH MAP

### Spawn Subsystem (Most Guarded)
| Guard Layer | Type | Position | Description |
|---|---|---|---|
| 1 | Spawn Mode Check | `spawnNode()` entry | `if (this.spawnMode !== 'RUNTIME')` |
| 2 | Direct Call Block | `spawnNode()` entry | `if (!allowDirect)` + token check |
| 3 | Token Authority | `spawnNode()` entry | `if (!this._spawnUpdateToken)` |
| 4 | Factory Ready Check | `spawnNode()` | `if (!this.ensureFactoriesReady())` |
| 5 | Compliance Gate | `spawnNode()` | `spawnAuthorityComplianceGate.validateSpawnRequest()` |
| 6 | Uniqueness Check | `spawnNode()` | `uniqueSpawnService.check()` |
| 7 | Category Validation | `spawnNode()` | `validateCategory()` → SAFE_CATEGORIES |
| 8 | Visual Registry Check | `spawnNode()` | `if (!hasCanonicalVisual)` |
| 9 | Visual Integrity | `_finalizeSpawnedNode()` | `validateNodeVisualIntegrity()` |

**Total Guard Count: 9 layers before scene attachment**
**Max Nesting Depth: 5 levels** (category validation within uniqueness check within spawn)

### Visual Update Subsystem
| Guard Layer | Type | Position |
|---|---|---|
| 1 | Enabled Flag | `updateNodeVisuals()` | `if (!data.activationLevel)` |
| 2 | Interaction Check | `updateNodeVisuals()` | `if (!interactionActive)` |
| 3 | Visual Readiness | `_checkVisualReadiness()` | `if (data.visualReady)` |
| 4 | Bootstrap Monitor | `update()` | `this.visualBootstrap.updateMonitoring()` |
| 5 | FrameScheduler Gate | Various systems | `if (!this.frameScheduler?.shouldRunVisual?.())` |

### Link Subsystem
| Guard Layer | Type | Position |
|---|---|---|
| 1 | Link Spawn Enabled | `isLinkSpawnEnabled()` | `if (window.ATOMA_LINK_SPAWN_ENABLED !== true)` |
| 2 | Cooldown | `onLinkCreated()` | `if (currentTime - lastLinkTime < cooldown)` |
| 3 | Cap Check | `onLinkCreated()` | `if (nodeCount >= cap)` |
| 4 | Visual Authority | LinkFX systems | Material-level guards |
| 5 | Material State | Various | `if (!link.mesh?.material)` |

---

## STEP 3 – EARLY RETURN DENSITY MAP

| Function | File | Return Count | Early Return? | Risk of Silent Skip? |
|---|---|---|---|---|
| `spawnNode()` | AINodes.js | 8+ | YES | HIGH – multiple silent aborts |
| `createNode()` | AINodes.js | 12+ | YES | HIGH – early nulls |
| `_finalizeSpawnedNode()` | AINodes.js | 5+ | YES | MEDIUM |
| `updateNodeVisuals()` | AINodes.js | 2 | YES | LOW |
| `onLinkCreated()` | AINodes.js | 3 | YES | MEDIUM |
| `update()` | FrameScheduler.js | 1 per layer | YES | LOW (logged) |
| `checkNetworkDensityAndSpawn()` | AINodes.js | 2 | YES | MEDIUM |
| Various visual systems | Multiple | 2-4 each | YES | MEDIUM |

**Observation:** Early returns are pervasive, especially in spawn chain. Many are silent (no logging except in debug mode), creating risk of untracked execution skips.

---

## STEP 4 – CONDITIONAL COMPLEXITY MAP

| Function | File | Nested Depth | Branch Count | High Complexity? |
|---|---|---|---|---|
| `spawnNode()` | AINodes.js | 4-5 | 20+ | **YES** |
| `createNode()` | AINodes.js | 3-4 | 15+ | **YES** |
| `_finalizeSpawnedNode()` | AINodes.js | 3 | 10+ | YES |
| `updateNodeVisuals()` | AINodes.js | 2 | 8+ | NO |
| `validateCategory()` | AINodes.js | 2 | 4 | NO |
| `FrameScheduler.tick()` | FrameScheduler.js | 2 | 6 | NO |
| `update()` | AINodes.js | 2 | 5 | NO |

**Notable Complex Areas:**
- `spawnNode()`: Category validation → uniqueness → factory → integrity → finalize
- `createNode()`: Category resolution → pool selection → visual creation → overlay addition
- Multiple fallback chains with overlapping conditions

---

## STEP 5 – BEHAVIOR MUTATING WRAPPERS

| Wrapper | File | Modifies Input? | Modifies Output? | Hidden Behavior? |
|---|---|---|---|---|
| `spawnAuthorityComplianceGate.validateSpawnRequest()` | SpawnAuthorityComplianceGate.js | YES | YES | YES – silent fallbacks |
| `validateCategory()` | AINodes.js | YES | YES | YES – category remapping |
| `createNode()` | AINodes.js | YES | YES | YES – category injection |
| `LegacyNodeModelFilter.validateSpawn()` | LegacyNodeModelFilter.js | YES | YES | YES – redirects categories |
| `uniqueSpawnService.check()` | UniqueSpawnService.js | NO | YES | NO (observable) |
| `applyMetricCompatibility()` | MetricCompatibilityLayer.js | YES | NO | YES – fills missing data |
| `copySpawnIdentity()` | AINodes.js | NO | YES | NO (helper) |

**Key Mutation Patterns:**
- Category remapping (unsupported → 'input')
- Fallback nodes (single instance for unsupported categories)
- Metric filling (default values when missing)
- Archetype injection (when `forceArchetype` not provided)

---

## STEP 6 – DOUBLE ROUTING MAP

| Entry | Routed To | File | Duplicate Path Risk? |
|---|---|---|---|
| `createNodes()` | `createNode()` | AINodes.js | NO – batch init only |
| `spawnNode()` | `createNode()` | AINodes.js | YES – also via request queue |
| `requestSpawn()` | `_processSpawnRequests()` → `spawnNode()` | AINodes.js | YES – dual entry |
| `spawnMythicNode()` | `requestSpawn()` | AINodes.js | NO – thin wrapper |
| `update()` | `updateNodeVisuals()` | AINodes.js | NO – direct call |
| `update()` | FrameScheduler layers | FrameScheduler.js | NO – layered execution |
| `onLinkCreated()` | `requestSpawn()` | AINodes.js | YES – event-driven spawn |
| `checkNetworkDensityAndSpawn()` | `requestSpawn()` | AINodes.js | YES – density-driven spawn |
| `updateSpawning()` | `_processSpawnRequests()` | AINodes.js | YES – queue processing |

**Observation:** Spawn has **3+ entry points** (direct, queue, event) all converging on `spawnNode()`. Visual systems often call through FrameScheduler for gating.

---

## STEP 7 – FRAME-LOOP GUARD STACK MAP

| System | File | Guards per Frame | Nested? |
|---|---|---|---|
| AINodes.update() | AINodes.js | 5 | NO (sequential) |
| Visual bootstrap | NodeVisualBootstrap3_0.js | 2 | NO |
| Visual systems (generic) | Multiple | 1-2 | NO |
| Aura LOD | AuraLODCulling.js | 2 | NO |
| Activity model | AINodes.js | 2 | NO (per-pool gating) |
| FrameScheduler | FrameScheduler.js | 2 per layer | YES (accumulator + category) |
| Link systems | Multiple | 2-3 | NO |
| FX systems | Multiple | 2 | NO |

**Per-Frame Guard Evaluation:**
- Most systems: 1-2 guards (enabled flag + data existence)
- FrameScheduler: accumulator gate + load shaping category gate
- AINodes.update(): distance check, hysteresis, activation state, visual readiness, bootstrap monitoring

**Highlight:** Guard checks are **not heavily nested** in frame loops (good for performance), but many guards are evaluated every frame even when conditions don't change.

---

## STEP 8 – WRAPPER FLOW DIAGRAM

```
USER ACTION
   ↓
PUBLIC API (spawnMythicNode, spawnArchetype, etc.)
   ↓
requestSpawn() [PRIORITY QUEUE]
   ↓
_processSpawnRequests() [MAX 1/F]
   ↓
SPAWN TOKEN GATE (_spawnUpdateToken)
   ↓
SPAWN MODE GATE (spawnMode !== 'RUNTIME')
   ↓
DIRECT CALL BLOCK (ATOMA_ALLOW_DIRECT_SPAWN)
   ↓
FACTORY READY CHECK (ensureFactoriesReady)
   ↓
COMPLIANCE GATE (spawnAuthorityComplianceGate)
   ↓
UNIQUENESS CHECK (uniqueSpawnService)
   ↓
CATEGORY VALIDATION (validateCategory)
   ↓
CANONICAL VISUAL CHECK (EnhancedNodeModels registry)
   ↓
createNode() [INTERNAL]
   ↓
CATEGORY RESOLUTION (fallbacks, whitelists)
   ↓
POOL SELECTION (deterministic counter)
   ↓
EnhancedNodeModels.create() [FACTORY]
   ↓
VISUAL INTEGRITY VALIDATION
   ↓
_finalizeSpawnedNode() [SCENE ATTACH]
   ↓
POST-SPAWN OBSERVERS
   ↓
REGISTRY (nodeSpawnRegistry, uniqueSpawnService)
   ↓
MATERIALIZE ANIMATION
   ↓
DEFERRED CONNECTIONS
```

**Critical Observations:**
- **Unnecessary Layer:** Token gate could be removed if all spawns go through queue
- **Duplicate Validation:** Category checked twice (once in spawnNode, once in createNode)
- **Silent Path Risk:** Multiple abort points without user-facing feedback
- **Observer Pattern Good:** Post-spawn observers provide clean extension point

---

## STEP 9 – WRAPPER ARCHITECTURE CLASSIFICATION

### Overall Classification: **MODERATELY WRAPPED** with **HIGH GUARD STACKING**

**Justification:**

1. **Guard Density (Score: 8/10)**
   - Spawn system: 9 guard layers (excessive)
   - Visual updates: 2-3 guards (acceptable)
   - FrameScheduler: 2-layer gating (good)
   - **Average guard depth: 4-6 layers for critical paths**

2. **Wrapper-to-Core Ratio (Score: 6/10)**
   - Spawn: 3-4 wrapper layers before core logic
   - Visual updates: 1-2 wrapper layers
   - **Ratio: ~2.5:1 (moderate)**

3. **Nesting Depth (Score: 5/10)**
   - Max observed: 5 levels (spawnNode → validation → uniqueness → factory → integrity)
   - Most functions: 2-3 levels
   - **Verdict: Acceptable, but spawn chain is deep**

4. **Early Return Density (Score: 7/10)**
   - 8+ early returns in spawnNode (high)
   - 2-4 early returns in most visual systems (moderate)
   - **Silent skip risk: HIGH**

5. **Double Routing (Score: 7/10)**
   - 3 spawn entry points (queue, direct, event)
   - FrameScheduler adds routing layer
   - **Duplicate path risk: MODERATE**

6. **Behavior Mutation (Score: 6/10)**
   - Category fallbacks common
   - Metric filling observable
   - **Hidden behavior: MODERATE**

**Final Classification:**
```
┌─────────────────────────────────────────────────────────────┐
│ ATOMA WRAPPER ARCHITECTURE:                                │
│                                                              │
│ ██░░░░░░░░░░░░  GUARD STACKING      (HIGH - 8/10)         │
│ ████░░░░░░░░░░  WRAPPER DENSITY      (MEDIUM - 6/10)    │
│ █████░░░░░░░░░  NESTING DEPTH       (MEDIUM - 5/10)    │
│ ███████░░░░░░░  EARLY RETURN DENSITY (HIGH - 7/10)      │
│ ███████░░░░░░░  DOUBLE ROUTING       (HIGH - 7/10)      │
│ ██████░░░░░░░░  BEHAVIOR MUTATION   (MEDIUM - 6/10)    │
│                                                              │
│ OVERALL: MODERATELY WRAPPED with EXCESSIVE GUARD STACKING  │
└─────────────────────────────────────────────────────────────┘
```

---

## SILENT EXECUTION HIGHLIGHTS

### High-Risk Silent Skips:

1. **Spawn Authority Abort** (spawnNode)
   - `if (validatedCategory === null)` → returns null silently
   - No user-facing error
   - **Impact:** Spawn attempts disappear without trace

2. **Visual Rejection** (createNode)
   - `if (!hasRenderableVisual(node))` → returns null
   - Logs warning, but continues execution
   - **Impact:** Nodes silently not added to scene

3. **Factory Missing** (spawnNode)
   - `if (!hasCanonicalVisual)` → aborts spawn
   - Only logged if debug enabled
   - **Impact:** Categories silently unavailable

4. **Uniqueness Block** (spawnNode)
   - `if (!decision.allowed)` → returns existing node
   - No indication to caller
   - **Impact:** Duplicate spawn requests appear to succeed

5. **Frame Scheduler Crash Recovery**
   - Jobs marked `_disabled` after error
   - Silently skipped thereafter
   - **Impact:** Systems silently stop updating

### Medium-Risk Areas:

- Category fallback (unsupported → 'input') with no notification
- Visual readiness gates preventing updates without logging
- Link spawn blocked by flag without explanation
- Material validation failures silently skipping FX

---

## FINAL RECOMMENDATIONS (for future consideration, not part of this audit)

1. **Consolidate Guard Layers:** Reduce spawn guards from 9 to 4-5 by eliminating redundancy
2. **Explicit Abort Path:** Return error objects instead of null for better debugging
3. **Single Entry Point:** Route all spawns through request queue, remove direct spawn API
4. **Reduce Early Returns:** Combine conditions to reduce return statement count
5. **Observer Pattern Extension:** Use observers for validation instead of inline guards
6. **Guard Performance:** Cache guard results where possible (e.g., factory readiness)
7. **Logging Strategy:** Add optional verbose mode to track all abort reasons

---

**AUDIT COMPLETE** – This is a READ-ONLY structural analysis. No code modifications were made.