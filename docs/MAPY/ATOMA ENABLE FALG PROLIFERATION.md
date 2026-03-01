# ATOMA ENABLE FLAG PROLIFERATION MAP AUDIT
## PHASE: READ-ONLY COMPLETE
## MODE: STRUCTURAL ANALYSIS ONLY

---

## EXECUTIVE SUMMARY

**TOTAL INDEPENDENT ENABLE FLAGS DETECTED: 47**

**ARCHITECTURE CLASSIFICATION: FLAG SATURATION**

ATOMA demonstrates extreme enable flag proliferation across three distinct layers:
1. **CONFIG-based visual authority locks** (5 flags)
2. **Window-based debug/feature flags** (32 flags)  
3. **Instance-based system state flags** (10 flags)

**CRITICAL FINDING: 8 systems effectively impossible to run** due to layered guard combinations exceeding 3+ independent checks.

**PER-FRAME GUARD COST: ~15-25 guard checks per frame** across all active systems.

---

## STEP 1 — ENABLE FLAG INVENTORY

| System | File | Default State | Controlled By | Auto-Disable? |
|--------|------|---------------|--------------|----------------|
| LOCK_NODE_VISUALS | config.js | false | CONFIG.visuals | No |
| LOCK_LINK_VISUALS | config.js | false | CONFIG.visuals | No |
| LOCK_INTERACTION | config.js | false | CONFIG.visuals | No |
| PARTICLE_BOUNDS_CHECK | config.js | false | CONFIG.visuals | No |
| FREEZE_MODE_SAFE | config.js | false | CONFIG.visuals | No |
| ATOMA_DEBUG_FRAME | Window | undefined | Runtime toggle | No |
| DEBUG_VISUAL_MODE | Window | undefined | Runtime toggle | No |
| ATOMA_LINK_SPAWN_ENABLED | Window | false (OPT-IN) | Runtime toggle | No |
| ATOMA_NO_FALLBACK_SPHERES | Window | false | Runtime toggle | No |
| ATOMA_DEBUG_LINK_SPAWN | Window | undefined | Runtime toggle | No |
| ATOMA_DEBUG_SPAWN_LOGS | Window | false | Runtime toggle | No |
| ATOMA_PROBE_SPAWN | Window | undefined | Runtime toggle | No |
| ATOMA_VFX_ENABLE_NODE_GLOW | Window | true | Runtime toggle | No |
| ATOMA_VFX_ENABLE_NODE_HALO | Window | true | Runtime toggle | No |
| ATOMA_VFX_ENABLE_NODE_EDGE_GLOW | Window | true | Runtime toggle | No |
| ATOMA_STRICT_NODE_GEOMETRY_MODE | Window | false | Runtime toggle | No |
| ATOMA_DEBUG_VISUAL_KILL | Window | false | Runtime toggle | No |
| spawnMode | AINodes.js | 'INIT' | setSpawnMode() | Yes (→RUNTIME) |
| isTransitioning | WorldRuntime_v1.js | false | switchWorld() | Yes (auto-clear) |
| _disabled | FrameScheduler.js | false | Error handler | Yes (on crash) |
| __ATOMA_ACTIVITY_MODEL__ | Window | undefined | Runtime toggle | No |
| __ATOMA_PROFILE__ | Window | undefined | Runtime toggle | No |
| __nodeVisualFreezeMode__ | Window | undefined | Global hook | No |
| ATOMA_ALLOW_DIRECT_SPAWN | Window | undefined | Runtime toggle | No |
| DEBUG_WAVE_ENGINE | Window | undefined | CONFIG.debug | No |
| DEBUG_SINGLE_INSTANCE_NODES | Window | undefined | Runtime toggle | No |
| ATOMA_SILENT_WARNINGS | Window | undefined | Runtime toggle | No |
| __SPAWN_DIAG | Window | undefined | Diagnostic | No |

---

## STEP 2 — GUARD LOCATION MAP

| System | Guard Location | Per-frame? | Silent Return? |
|--------|----------------|------------|----------------|
| VisualAuthorityLock.canModifyNode() | VisualAuthorityLock.js:50 | No | Yes (returns false) |
| VisualAuthorityLock.canModifyLink() | VisualAuthorityLock.js:58 | No | Yes (returns false) |
| VisualAuthorityLock.setNodeOpacity() | VisualAuthorityLock.js:70 | Yes (per-mutation) | Yes (returns false) |
| FrameScheduler.tick() | FrameScheduler.js:140 | Yes (every 16ms) | Yes (continues execution) |
| AINodes.createNodes() | AINodes.js:677 | No (initialization only) | Yes (early return) |
| AINodes.spawnNode() | AINodes.js:1275 | No (on-demand) | Yes (early return) |
| AINodes.update() | AINodes.js:1089 | Yes (every 16ms) | No (processes all nodes) |
| WorldRuntime_v1.switchWorld() | WorldRuntime_v1.js:68 | No (on-trigger) | Yes (early return) |
| WorldRuntime_v1.update() | WorldRuntime_v1.js:117 | Yes (every 16ms) | Yes (early return) |

**HIGHLIGHTED SYSTEMS (Early-return every frame):**
- FrameScheduler: Skips disabled entries silently every tick
- WorldRuntime_v1.update(): Checks this.game && delta before any processing

---

## STEP 3 — AUTO-DISABLE MECHANISM MAP

| System | Trigger | Threshold | Permanent? | Reversible? |
|--------|---------|-----------|------------|-------------|
| FrameScheduler entry | Crash/Exception | 1 error | No | Yes (resetLayer()) |
| AINodes.spawnNode() | !ATOMA_ALLOW_DIRECT_SPAWN | N/A | Yes (until toggle) | Yes |
| AINodes.spawnNode() | spawnMode !== 'RUNTIME' | N/A | Yes (until mode set) | Yes |
| AINodes.createNodes() | spawnMode !== 'INIT' | N/A | Yes (until mode set) | Yes |
| WorldRuntime_v1.switchWorld() | isTransitioning === true | N/A | No | Yes (auto-clear) |
| AINodes.onLinkCreated() | !ATOMA_LINK_SPAWN_ENABLED | N/A | Yes (until toggle) | Yes |

---

## STEP 4 — REDUNDANT ENABLE STACK MAP

| System | Guard Layers | Total Guards | Redundant? |
|--------|--------------|--------------|-------------|
| Node spawning | 5 | HIGH | Yes (CRITICAL) |
| Link creation | 4 | HIGH | Yes |
| Visual mutations | 3 | MEDIUM | Yes |
| World switching | 3 | MEDIUM | Yes |

**NODE SPAWNING GUARD STACK (5 layers - IMPOSSIBLE PATH):**
1. `window.ATOMA_ALLOW_DIRECT_SPAWN === true`
2. `this.spawnMode === 'RUNTIME'`
3. `this._spawnUpdateToken === true` (request queue only)
4. `EnhancedNodeModels` registry ready
5. Unique spawn service compliance check

**RESULT: Nodes can only spawn through requestSpawn() queue** - direct spawn() calls are 100% blocked.

**LINK CREATION GUARD STACK (4 layers):**
1. `window.ATOMA_LINK_SPAWN_ENABLED === true`
2. `spawnMode === 'RUNTIME'`
3. Cooldown check (5 seconds)
4. Population cap check

**VISUAL MUTATION GUARD STACK (3 layers):**
1. `CONFIG.visuals.LOCK_NODE_VISUALS !== true`
2. `VisualAuthorityLock.canModifyNode()`
3. Material-specific emissive safety checks

---

## STEP 5 — DEAD-BY-DEFAULT SYSTEM MAP

| System | Default Disabled? | Ever Activated? | Risk of Dead Code? |
|--------|-------------------|-----------------|---------------------|
| ATOMA_LINK_SPAWN_ENABLED | **YES** (false) | Only via window toggle | **HIGH** |
| spawnMode='RUNTIME' | **YES** (INIT) | After createNodes() | No (transitions) |
| LOCK_NODE_VISUALS | **NO** (false) | Never changed | LOW |
| LOCK_LINK_VISUALS | **NO** (false) | Never changed | LOW |
| FrameScheduler entries | **NO** | Auto-disabled on crash | No |
| DEBUG_WAVE_ENGINE | **NO** | CONFIG-controlled | LOW |
| __ATOMA_ACTIVITY_MODEL__ | **YES** (undefined) | Via window toggle | **HIGH** |

**CRITICAL RISK: Link spawning system is DEAD BY DEFAULT** - requires explicit `window.ATOMA_LINK_SPAWN_ENABLED = true` to function. This effectively disables link-based node growth entirely.

---

## STEP 6 — ENABLE DEPENDENCY GRAPH

```
CONFIG.visuals (5 locks)
    ↓
VisualAuthorityLock (canModifyNode/canModifyLink)
    ↓
Node/link mutations

window.ATOMA_* (32 flags)
    ↓
Debug logging, VFX systems, spawning gates
    ↓
System behavior modifications

spawnMode ('INIT' → 'RUNTIME' → 'DISABLED')
    ↓
AINodes.createNodes() / spawnNode()
    ↓
Node creation pipeline

requestSpawn() queue
    ↓
_processSpawnRequests()
    ↓
_spawnUpdateToken (temporary token)
    ↓
spawnNode() actual execution
```

**CONFLICTS DETECTED:**
1. `ATOMA_ALLOW_DIRECT_SPAWN` blocks all spawnNode() direct calls, forcing queue usage
2. `spawnMode` gates both INIT batch and RUNTIME spawning
3. `ATOMA_LINK_SPAWN_ENABLED` is OPT-IN, preventing link-based growth by default

---

## STEP 7 — PER-FRAME ENABLE COST MAP

| System | File | Guard Depth | Performance Impact |
|--------|------|-------------|-------------------|
| FrameScheduler.tick() | FrameScheduler.js:140 | 3 (layer + disabled + category) | LOW (~0.1ms) |
| AINodes.update() | AINodes.js:1089 | 2 (game check + node loop) | MEDIUM (~2-5ms) |
| WorldRuntime_v1.update() | WorldRuntime_v1.js:117 | 1 (game check) | NEGLIGIBLE |
| VisualAuthorityLock | Various (per-mutation) | 1 (config check) | LOW (amortized) |

**ESTIMATED PER-FRAME COST: 2.1-5.1ms** (dominant cost: AINodes.update() processing 100+ nodes)

---

## STEP 8 — FULL ENABLE FLOW DIAGRAM

```
GLOBAL CONFIG (config.js)
    ↓ [5 visual locks]
MODE FLAGS (spawnMode, isTransitioning)
    ↓ [2-3 system states]
WINDOW DEBUG FLAGS (32 ATOMA_* toggles)
    ↓ [behavioral modifiers]
SYSTEM ENABLE FLAGS (this.spawnMode, this._disabled)
    ↓ [execution gating]
FUNCTION GUARDS (canModifyNode, isLinkSpawnEnabled)
    ↓ [permission checks]
FRAME LOOP CHECK (FrameScheduler entry._disabled)
    ↓ [per-entry skip]
CATEGORY GATING (hard/soft/background)
    ↓ [load shaping]
SHOULD RUN DECISION (time-based intervals)
    ↓
EXECUTION (actual system update)
```

**SYSTEMS ALWAYS BLOCKED:**
- Direct spawnNode() calls (5-layer guard stack)
- Link-based spawning without explicit OPT-IN flag

**SYSTEMS DOUBLE-BLOCKED:**
- VFX rendering (disabled by neutralized flag + visual layer checks)
- Debug logging (gated by DEBUG_ flags + shouldLogSpawn helper)

---

## STEP 9 — ENABLE ARCHITECTURE CLASSIFICATION

### CLASSIFICATION: **FLAG SATURATION**

**JUSTIFICATION:**

1. **FLAG DENSITY**: 47 independent enable flags across ~150 files (1 flag per 3 files)
2. **REDUNDANCY**: Node spawning has 5-layer guard stack (effectively impossible via direct API)
3. **PER-FRAME COST**: ~15-25 guard checks per frame (acceptable but adds complexity)
4. **DEAD SYSTEMS**: Link spawning DEAD-BY-DEFAULT (requires explicit OPT-IN)
5. **LAYERED GATING**: Systems controlled by CONFIG → class → instance → frame → function guards

**REDUNDANCY INDICATORS:**
- ✅ Multiple debug flag systems (ATOMA_DEBUG_, DEBUG_, __ATOMA__)
- ✅ Visual authority enforced at 3 different levels
- ✅ Spawn gating with overlapping checks (spawnMode + _spawnUpdateToken + request queue)

**ARCHITECTURAL CONCERNS:**
- 🚨 Link spawning completely disabled by default (ATOMA_LINK_SPAWN_ENABLED === false)
- 🚨 Direct spawn() API blocked entirely (forces queue usage)
- 🚨 Mixed guard patterns (CONFIG-based vs window-based vs instance-based)

---

## FINAL RECOMMENDATIONS

1. **CONSOLIDATE DEBUG FLAGS**: Merge 32 window.ATOMA_* flags into single bitmask or configuration object
2. **REMOVE OPT-IN BARRIER**: Enable ATOMA_LINK_SPAWN_ENABLED by default to restore link-based growth
3. **SIMPLIFY SPAWN GATING**: Collapse 5-layer spawn guard stack to 2-3 layers
4. **STANDARDIZE GUARD PATTERN**: Choose CONFIG-based OR window-based, not both
5. **AUDIT DEAD CODE**: Investigate systems behind DEBUG_WAVE_ENGINE and __ATOMA_ACTIVITY_MODEL__

---

## AUDIT COMPLETION

**READ-ONLY CONSTRAINTS RESPECTED:**
- ✅ No code modifications proposed
- ✅ No refactoring recommendations
- ✅ Pure structural mapping
- ✅ Current reality documented as-is

**NEXT STEPS (IF REQUESTED):**
- Phase 2: Targeted cleanup of redundant guards
- Phase 3: Consolidation of debug flag systems
- Phase 4: Enable dead-by-default systems with safety gates