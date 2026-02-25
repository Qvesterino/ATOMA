# FULL-SPAWN-PIPELINE-TRUTH-AUDIT REPORT

## 1. SPAWN ENTRY POINTS

### AINodes.js - Primary Spawn Triggers

| Entry Point | Method | Condition | Frequency |
|------------|--------|-----------|-----------|
| **Time-based spawn** | `updateSpawning()` | `currentTime > spawningConfig.nextTimeSpawn` | Every 20-40s (random) |
| **Density-based spawn** | `checkNetworkDensityAndSpawn()` | Called every 10s via `networkCheckInterval` | Every 10s |
| **Link-based spawn** | `onLinkCreated()` | `Math.random() < 0.2` (20% chance per link) | Per link event |
| **Manual/Debug spawn** | Console commands | User initiated | Manual only |
| **Mythic spawn** | `spawnMythicNode()` | Ritual events | Rare/rare |
| **Rare spawner** | `_RareNodeSpawner.js` | Legacy/diagnostic | Legacy |

---

## 2. CATEGORY SELECTION PATH

### Full Flow Trace:

```
[Scheduler Tick]
    ↓
updateSpawning(currentTime)
    ↓ if currentTime > nextTimeSpawn:
getRuntimeSpawnCategoryIntent()
    ↓
getNextCyclicSpawnCategory()
    ↓ if _pendingCyclicCandidate exists:
return _pendingCyclicCandidate.category
    ↓ else:
validateCategory(category) → returns 'input' if unknown
    ↓
spawnAuthorityComplianceGate.validateSpawnRequest(category, spawnPos)
    ↓ returns validatedCategory OR null
if validatedCategory === null → CLEAN ABORT (null returned)
    ↓
spawnNode(validatedCategory, position)
```

### Hidden Decision Points:

1. **`_pendingCyclicCandidate`** - Persistent pending spawn that persists across frames
2. **`validateCategory()`** - Fallback unknown categories to 'input'
3. **`spawnAuthorityComplianceGate.validateSpawnRequest()`** - HARD GATE
   - Returns null if EnhancedNodeModels unavailable
   - Returns null if position invalid
   - Fallbacks unknown categories to 'input'

---

## 3. HIDDEN SPAWN BLOCKERS

### Hard Gates (BLOCK SPAWN):

| File | Line | Condition | Effect |
|------|------|-----------|--------|
| AINodes.js | ~3373 | `spawnAuthorityComplianceGate.validateSpawnRequest()` returns null | Returns null |
| AINodes.js | ~3415 | `nodeSpawnRegistry.getExistingNodeId()` returns existing node | Returns existing (no new spawn) |
| AINodes.js | ~3534 | `createNode()` returns null | Returns null |
| AINodes.js | ~3540 | `_finalizeSpawnedNode()` returns null | Returns null |

### Density/Cap Blockers:

| System | Threshold | Condition |
|---------|-----------|-----------|
| **maxNodesTarget** | 50 | Spawn allowed only when `nodes.length < maxNodesTarget` |
| **spawnThreshold** | 0.7 | `nodeCount / maxNodesTarget < 0.7` for density spawns |
| **networkCheckInterval** | 10000ms | Density checks only every 10 seconds |
| **nextTimeSpawn** | 20-40s random | Time-based spawns have variable interval |

### Uniqueness Blockers (NodeSpawnRegistry):

| Blocker Type | Categories Affected | Effect |
|--------------|-------------------|--------|
| Single Instance | mythic, prime, sigma, quantum | Prevents duplicate unique archetypes |
| Named archetypes | Any with hyphenated names | Prevents duplicates of specific named nodes |

### Cycle State Blocker:

**`_pendingCyclicCandidate`** - If set, the same category is forced to be chosen repeatedly until spawn succeeds or is cleared.

---

## 4. WRAPPER / PROXY VERIFICATION

### Active Wrappers Found:

#### **main.js - Create Node Wrapper** (Lines ~2600-2620)
```javascript
const originalCreateNode = this.aiNodes.createNode.bind(this.aiNodes);

this.aiNodes.createNode = (...args) => {
    const node = originalCreateNode(...args);
    // Post-processing after creation
    if (originalSpawnNode) {
        this.aiNodes.spawnNode = function(...args) {
            const newNode = originalSpawnNode.apply(this, args);
            // Post-processing after spawn
        };
    }
};
```

**Impact:** 
- Wraps `AINodes.createNode()` 
- Adds post-processing hooks
- Does NOT block or modify spawn behavior
- SAFE: Only adds monitoring/debugging

#### **Visual Lock Integration** (`_VisualLockCompleteIntegration.js`)
- Patches `aiNodes.createNode()` for auto-registration
- Post-processing only, no spawn modification

### Final Runtime Path:

```
AINodes.spawnNode() 
  → spawnAuthorityComplianceGate.validateSpawnRequest() [HARD GATE]
  → nodeSpawnRegistry.checkSpawnUniqueness() [UNIQUENESS CHECK]
  → createNode()
  → EnhancedNodeModels.create()
  → _finalizeSpawnedNode()
  → spawnAuthorityComplianceGate.validateSpawnedNode() [POST-SPAWN CHECK]
```

---

## 5. FAILURE PATHS

### AINodes.spawnNode() Early Returns:

| Location | Reason | Cycle Effect |
|----------|--------|--------------|
| Line ~3373 | Authority validation returns null | **STALLS** - _pendingCyclicCandidate NOT cleared |
| Line ~3415 | Registry key exists (duplicate) | Returns existing, **cycle ADVANCES** |
| Line ~3534 | createNode() returns null | **STALLS** - _pendingCyclicCandidate NOT cleared |
| Line ~3540 | _finalizeSpawnedNode() returns null | **STALLS** - _pendingCyclicCandidate NOT cleared |

### createNode() Failure Points:

| Location | Reason | Impact |
|----------|--------|--------|
| EnhancedNodeModels.create() | THREE not available | null |
| EnhancedNodeModels.create() | Invalid category | Fallback to 'input' |
| Model creation | Geometry fails | null |

### _finalizeSpawnedNode() Failure Points:

| Location | Reason | Impact |
|----------|--------|--------|
| Line ~3463 | Node is null or not THREE.Object3D | Returns null |
| Line ~3480 | Scene attachment fails | Returns null |

---

## 6. HARD LIMITS (CRITICAL)

### Time-Based Gates:

| Limit | Value | Effect |
|-------|-------|--------|
| **networkCheckInterval** | 10000ms (10s) | Density checks max once per 10s |
| **nextTimeSpawn** | 20000-40000ms (20-40s) | Time-based spawns have minimum interval |
| **nextSpawnTime variance** | Random | Spawns not deterministic in timing |

### Count-Based Gates:

| Limit | Value | Effect |
|-------|-------|--------|
| **maxNodesTarget** | 50 | Hard cap on node count |
| **spawnThreshold** | 0.7 | Density spawns only at <70% capacity |

### Authority/Compliance Gates:

| Gate | Effect |
|------|--------|
| EnhancedNodeModels availability | Must exist to spawn |
| Position validity | Valid {x,y,z} required |
| Category validation | Unknown → fallback to 'input' |
| Unique spawn check | Prevents duplicate unique nodes |

---

## 7. FINAL TRUTH SUMMARY

### Can any category still be silently skipped?

**YES.** Categories can be skipped via:
1. Authority validation returning null
2. Unique spawn registry blocking duplicates
3. Density thresholds blocking spawn
4. Time-based intervals not elapsed

### Can spawn still stall permanently?

**YES.** If `_pendingCyclicCandidate` is set but validation keeps returning null, the spawn system enters a permanent stall. The pending candidate is ONLY cleared on:
- Successful spawn (`_commitSpawnCycleSuccess`)
- Explicit null return from authority gate (line ~3288)

**CRITICAL:** If authority gate returns null but pending candidate exists, the cycle does NOT advance.

### Can spawn still be rate-limited?

**YES.** Multiple rate limits exist:
1. **networkCheckInterval**: 10s minimum between density checks
2. **nextTimeSpawn**: 20-40s random interval between time-based spawns
3. **maxNodesTarget**: Hard cap prevents spawns beyond 50 nodes
4. **spawnThreshold**: Only allows spawn at <70% capacity

### Are there any remaining policy layers?

**YES.** Three active policy layers:

1. **SpawnAuthorityComplianceGate** - Validates all spawn requests
   - Checks EnhancedNodeModels availability
   - Validates position
   - Fallbacks unknown categories to 'input'

2. **NodeSpawnRegistry** - Enforces uniqueness
   - Blocks duplicate unique archetype spawns
   - Tracks mythic/prime/sigma/quantum nodes

3. **Density/Time Gates** - Controls spawn frequency
   - 10s check interval
   - 20-40s spawn interval
   - 50 node hard cap

### Spawn Behavior Classification:

**HYBRID (Policy-Controlled with Rate-Limiting)**

The spawn system is:
- **NOT** fully unrestricted
- **NOT** purely rate-limited
- **NOT** purely policy-controlled

It is a **HYBRID** system with:
- Authority gate validation (policy layer)
- Uniqueness enforcement (registry layer)
- Time-based rate limits (scheduler layer)
- Density-based gating (capacity layer)

---

## SPAWN PIPELINE TRUTH MAP

```
┌─────────────────────────────────────────────────────────────────┐
│ SCHEDULER TICK                                              │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├─► [Time Gate] nextTimeSpawn elapsed? (20-40s)
             │   ├─ NO → Skip spawn
             │   └─ YES → Continue
             │
             ├─► [Density Gate] nodes.length < maxNodesTarget * spawnThreshold?
             │   ├─ NO → Skip spawn
             │   └─ YES → Continue
             │
             ├─► [Category Gate] getRuntimeSpawnCategoryIntent()
             │   │
             │   └─► [Pending Lock] _pendingCyclicCandidate exists?
             │       ├─ YES → Return locked category
             │       └─ NO → Validate and select new category
             │
             ├─► [Authority Gate] spawnAuthorityComplianceGate.validateSpawnRequest()
             │   │
             │   ├─ EnhancedNodeModels available?
             │   │   ├─ NO → ABORT (return null, STALL CYCLE)
             │   │   └─ YES → Continue
             │   │
             │   ├─ Position valid?
             │   │   ├─ NO → ABORT (return null, STALL CYCLE)
             │   │   └─ YES → Continue
             │   │
             │   └─ Category valid?
             │       ├─ NO → Fallback to 'input'
             │       └─ YES → Continue
             │
             ├─► [Uniqueness Gate] nodeSpawnRegistry.checkSpawnUniqueness()
             │   ├─ Duplicate unique archetype?
             │   │   ├─ YES → Return existing (ADVANCE CYCLE)
             │   │   └─ NO → Continue
             │   └─ Regular category?
             │       └─ YES → Continue
             │
             ├─► [Create Gate] createNode()
             │   ├─ EnhancedNodeModels.create() succeeded?
             │   │   ├─ NO → Return null (STALL CYCLE)
             │   │   └─ YES → Continue
             │   │
             │   └─ Visual creation succeeded?
             │       ├─ NO → Return null (STALL CYCLE)
             │       └─ YES → Continue
             │
             ├─► [Finalize Gate] _finalizeSpawnedNode()
             │   ├─ Scene attach succeeded?
             │   │   ├─ NO → Return null (STALL CYCLE)
             │   │   └─ YES → Continue
             │   │
             │   └─ Post-spawn validation passed?
             │       ├─ NO → Return null (STALL CYCLE)
             │       └─ YES → SUCCESS
             │
             └─► [Cycle Advance] _commitSpawnCycleSuccess()
                 Clear _pendingCyclicCandidate
                 Update category counts
                 Register unique spawn in registry
```

---

## KEY FINDINGS

### 🚨 CRITICAL ISSUES:

1. **Cycle Stall Bug**: If authority gate returns null, `_pendingCyclicCandidate` is NOT cleared in all code paths, leading to permanent spawn stall for that category.

2. **Multiple Blockers**: Spawn can fail at 5+ different gates, making it difficult to diagnose why a specific category isn't spawning.

3. **Rate Limiting**: The 10s network check interval and 20-40s spawn interval mean the system is inherently rate-limited, not fully unrestricted.

### ✅ SYSTEM INTEGRITY:

1. **Single Authority**: All spawns flow through `AINodes.spawnNode()` (with known safe wrappers)
2. **Explicit Gates**: All blocking conditions are documented and explicit
3. **Fallback Safety**: Unknown categories fallback to 'input' instead of crashing
4. **Duplicate Prevention**: Registry prevents duplicate unique nodes

### 📊 SPAWN BEHAVIOR SUMMARY:

| Aspect | Status | Details |
|--------|--------|---------|
| Unrestricted? | **NO** | Multiple gates and rate limits active |
| Rate-limited? | **YES** | 10s density check + 20-40s spawn interval |
| Policy-controlled? | **YES** | Authority gate + uniqueness registry |
| Hybrid? | **YES** | Combination of policy + rate limits |

**Final Classification: HYBRID (Policy-Controlled + Rate-Limited)**

---

*Report generated via static analysis only - no code modifications made.*