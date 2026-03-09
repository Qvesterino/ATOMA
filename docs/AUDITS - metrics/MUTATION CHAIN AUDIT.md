# AUDIT 3 — MUTATION CHAIN
**Status: COMPLETE**

---

## EXECUTIVE SUMMARY

**Mutation Chain: MAPPED**

The spawn pipeline and runtime mutation chain have been fully traced. The documentation correctly identifies the spawn sequence, but contains **critical errors** about `relaxNodeMetrics()` execution.

**Key Findings:**
- Spawn pipeline works as documented (DNA → initNodeMetrics → onNodeSpawn)
- **BUT** `relaxNodeMetrics()` function does NOT exist in the codebase
- The actual relaxation logic is in MetricsRuntime_v1._step() at fixed 10Hz
- Documentation references frameCount % 60 for relaxNodeMetrics - **this is FALSE**
- VisualDerivedMetrics runs per-frame but is READ-ONLY (not canonical)

---

## 1. SPAWN PIPELINE TRACING

### Call Chain (Confirmed)

```
AINodes.spawnNode()
  ↓
initNodeMetrics(node)  [NodeMetricEngine.js]
  ├─ ensureMetrics(node)
  │   ├─ Check: node.userData.metrics exists?
  │   └─ If not: allocate DEFAULT_METRICS
  └─ Wrap with MetricAuthorityGuard
      ↓
SafeMetricsDNAIntegration1_0.attachMetrics()
  ├─ node.userData.metrics = { archetype-based snapshot }
  └─ Sets _isMetricSnapshot = true
      ↓
onNodeSpawn(node)  [NodeMetricEngine.js]
  ├─ Check: node.userData.metrics?._isMetricSnapshot
  └─ If true: RETURN (SKIP)
  └─ Otherwise: applyArchetypeClamp(node)
```

### Verification: Actual Code Locations

**AINodes.js** (spawnNode function):
```javascript
if (!node.userData.metrics) {
  initNodeMetrics(node);  // Line ~3762
}
if (!node.userData?.metrics?._isMetricSnapshot) {
  onNodeSpawn(node);  // Line ~3765
}
```

**NodeMetricEngine.js**:
```javascript
export function initNodeMetrics(node) {
  return ensureMetrics(node);
}

export function onNodeSpawn(node) {
  if (node?.userData?.metrics?._isMetricSnapshot) {
    return;  // Skip spawn nudge for DNA nodes
  }
  const m = ensureMetrics(node);
  if (!m) return;
  applyArchetypeClamp(node);
}
```

### Spawn Sequence Timing

**All in same frame:**
1. `initNodeMetrics()` allocates DEFAULT_METRICS (if missing)
2. `SafeMetricsDNAIntegration1_0.attachMetrics()` OVERWRITES entire object
3. `onNodeSpawn()` SKIPS if _isMetricSnapshot is true

**Result:** DNA snapshot wins; NodeMetricEngine defaults never used for archetype nodes.

---

## 2. EVENT → RELAX → RUNTIME CHAIN

### Event-Driven Mutations

**NodeMetricEngine.js** (canonical event impulses):
```javascript
export function onLinkCreated(nodeA, nodeB, linkContext) {
  // Adjust metrics incrementally
  adjust(m, 'synergy', +0.02);
  adjust(m, 'harmony', +0.02);
  adjust(m, 'loadPressure', +0.01);
  adjust(m, 'corruption', -0.01);
}

export function onLinkRemoved(nodeA, nodeB) {
  adjust(m, 'synergy', -0.01);
  adjust(m, 'harmony', -0.01);
  adjust(m, 'loadPressure', -0.015);
}

export function onOverload(node, overloadAmount) {
  adjust(m, 'loadPressure', amt * 0.1);
  adjust(m, 'corruption', amt * 0.05);
  adjust(m, 'stability', -amt * 0.02);
}
```

**Triggers:**
- Link creation/removal via NodeLinkingSystem
- Overload events from various systems
- All use `+=` or `-=` adjustments (incremental)

### Relaxation Logic (CRITICAL FINDING)

**DOCUMENTATION CLAIMS:**
```
relaxNodeMetrics() - Already at 60 frame intervals (~1s)
```

**ACTUAL CODE:**
- **No function named `relaxNodeMetrics()` exists**
- Searches found 0 results for function definition
- Documentation references are **incorrect**

**REAL RELAXATION LOCATION:**

**MetricsRuntime_v1.js** (line ~187):
```javascript
_step(dt) {
  // 2. Fixed-step relax toward archetype baselines
  const nodeList = this.nodes?.nodes || this.nodes || [];
  for (const node of nodeList) {
    const m = node?.userData?.metrics;
    const base = node?.userData?.archetypeMetrics;
    if (!m || !base) continue;
    
    const relaxSpeed = 0.02; // gentle return per 10 Hz step
    m.synergy      += (base.synergy      - m.synergy)      * relaxSpeed;
    m.harmony      += (base.harmony      - m.harmony)      * relaxSpeed;
    m.stability    += (base.stability    - m.stability)    * relaxSpeed;
    m.corruption   += (base.corruption   - m.corruption)   * relaxSpeed;
    m.loadPressure += (base.loadPressure - m.loadPressure) * relaxSpeed;
    
    // Clamp to [0, 1]
    m.synergy = this._clamp01(m.synergy);
    // ... etc
  }
}
```

### Runtime Flow (Actual)

```
Frame Loop (60 Hz)
  ↓
MetricsRuntime_v1.update(dt)
  ├─ Accumulate: this._accumulator += dt
  ├─ While accumulator >= 0.1:
  │    ├─ _step(0.1)  ← Fixed 10 Hz
  │    │    ├─ nodeDynamicMetrics.update(0.1)
  │    │    ├─ linkQualityCalculator.update(0.1)
  │    │    ├─ RELAX ALL NODES toward archetype
  │    │    ├─ Equalize synergy/harmony across links
  │    │    ├─ Publish live metrics
  │    │    └─ this._accumulator -= 0.1
  │    └─ Repeat
  ↓
NodeDynamicMetrics.update(deltaTime)  [Visual only]
  ├─ Read canonical metrics
  ├─ Compute visualMetrics
  └─ Write to node.userData.visualMetrics  [NOT canonical]
```

### Key Differences from Documentation

| Documentation | Actual Code | Status |
|---------------|-------------|---------|
| `relaxNodeMetrics()` function exists | Does NOT exist | **FALSE** |
| Runs every 60 frames | Runs at fixed 10Hz (0.1s accumulator) | **FALSE** |
| ~1 second interval | 0.1 second interval | **FALSE** |

---

## 3. NODE DYNAMIC METRICS AUDIT

### System Identity

**File:** `NodeDynamicMetrics.js`

**Actual Class:** `VisualDerivedMetrics`

**Alias:** `NodeDynamicMetrics = VisualDerivedMetrics` (backward compatibility)

### Authority Level

```javascript
// VISUAL DERIVED LAYER
//
// Reads canonical node.userData.metrics (0..1).
// Computes derived visual values.
// Writes ONLY to node.userData.visualMetrics.
// No gameplay authority.
```

### Execution Pattern

```javascript
update(deltaTime) {
  if (!this.frameScheduler?.shouldRunVisual?.()) return;
  
  const now = Date.now();
  for (const node of this.aiNodes.nodes) {
    this._updateNodeVisuals(node, now);
  }
}
```

### What It Actually Does

1. **READ:** `node.userData.metrics` (canonical, READ-ONLY)
2. **COMPUTE:** Derived visual values (0-100 scale)
3. **WRITE:** `node.userData.visualMetrics` (non-canonical, visual-only)

### Critical Assessment

**Is this FPS-coupled?**
- Yes, runs per-frame with deltaTime
- **BUT** it's VISUAL-ONLY, not canonical gameplay metrics
- Writes to separate `visualMetrics` object
- Does NOT mutate `node.userData.metrics`

**Conclusion:**
- ❌ NOT canonical metrics
- ✅ Acceptable for visual layer
- ❌ Should NOT be documented as metrics writer

---

## 4. COMPLETE MUTATION CHAIN MAP

```
┌─────────────────────────────────────────────────────────────────┐
│  SPAWN FRAME (instantaneous, same frame)                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌─────────────────┐ ┌──────────────┐ ┌──────────────┐
│ initNodeMetrics │ │ SafeMetricsDNA│ │ onNodeSpawn  │
│ (allocate or    │ │ Integration   │ │ (conditional)│
│  return)        │ │ (overwrite)   │ │ (clamp only) │
└─────────────────┘ └──────┬───────┘ └──────┬───────┘
         │                │                │
         └────────────────┼────────────────┘
                          ▼
              ┌───────────────────┐
              │ node.userData.metrics│
              │ (DNA snapshot or    │
              │  defaults)           │
              └────────┬───────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│  EVENT CHAIN    │         │  FRAME LOOP     │
│ (link creation  │         │  (60 Hz)        │
│  removal, etc.)  │         └────────┬────────┘
└────────┬────────┘                  │
         │                          │
         │                  ┌───────┴───────┐
         │                  │               │
         │                  ▼               ▼
         │         ┌─────────────────┐ ┌─────────────────┐
         │         │ MetricsRuntime_ │ │ NodeDynamic     │
         │         │ v1.update(dt)   │ │ Metrics.update()│
         │         └────────┬────────┘ └────────┬────────┘
         │                  │                  │
         │         ┌────────┴────────┐         │
         │         │                 │         │
         │         ▼                 ▼         │
         │  ┌──────────────────────────────┐ │
         │  │ Accumulator: += dt           │ │
         │  │ While >= 0.1: _step(0.1)     │ │
         │  └────────────┬────────────────┘ │
         │               │                   │
         │               ▼                   │
         │  ┌──────────────────────────────┐ │
         │  │ FIXED 10 Hz TICK            │ │
         │  │ 1. Relax metrics to base    │ │
         │  │ 2. Equalize across links    │ │
         │  │ 3. Publish live metrics    │ │
         │  └────────────┬────────────────┘ │
         │               │                   │
         └───────────────┼───────────────────┘
                         ▼
              ┌───────────────────┐
              │ node.userData.metrics│
              │ (continuously mutated)│
              └───────────────────┘
```

---

## 5. TIMING ANALYSIS

### Documented vs Actual Timing

| System | Documentation | Actual Implementation | Accuracy |
|--------|---------------|----------------------|----------|
| relaxNodeMetrics | Every 60 frames (~1s) | **Does not exist** | ❌ FALSE |
| MetricsRuntime | Not documented | Fixed 10Hz (0.1s accumulator) | ✅ TRUE |
| NodeDynamicMetrics | Per-frame (LOCKED) | Per-frame, visual-only | ✅ TRUE |

### Actual Tick Rates

**Canonical Metrics:**
- Spawn: Instant (same frame)
- Events: Immediate (on trigger)
- Relaxation: **Fixed 10Hz** (MetricsRuntime_v1._step())
- Equalization: **Fixed 10Hz** (same _step())

**Visual Metrics:**
- VisualDerivedMetrics: **Per-frame** (60 Hz typical)
- Updates `visualMetrics` object only

---

## 6. ARCHITECTURAL ISSUES IDENTIFIED

### Issue 1: Documentation Mismatch

**Severity:** HIGH

**Problem:** Documentation references `relaxNodeMetrics()` at frameCount % 60, but:
- Function does not exist
- No code uses `frameCount % 60` for metrics
- Actual relaxation is in MetricsRuntime_v1 at fixed 10Hz

**Impact:**
- Misleading for anyone reading audits
- Could lead to incorrect assumptions about timing
- Makes debugging harder

### Issue 2: Naming Confusion

**Severity:** MEDIUM

**Problem:** `NodeDynamicMetrics` is an alias for `VisualDerivedMetrics`, but:
- Name suggests it modifies canonical metrics
- Actually reads-only from canonical
- Writes to separate visual object

**Impact:**
- Creates false impression of gameplay authority
- Confusing for code navigation
- Violates principle of least surprise

### Issue 3: Hidden 10Hz Fixed Tick

**Severity:** LOW

**Problem:** MetricsRuntime_v1 uses accumulator pattern:
- Fixed 10Hz tick (0.1s dt)
- Not obvious from outer interface
- Documentation doesn't highlight fixed-tick behavior

**Impact:**
- Good for determinism
- But not well documented
- Could cause confusion about FPS coupling

---

## 7. VERIFICATION SUMMARY

### What EXISTS (Confirmed)

✅ `initNodeMetrics()` - NodeMetricEngine.js
✅ `onNodeSpawn()` - NodeMetricEngine.js  
✅ `MetricsRuntime_v1._step()` - Fixed 10Hz relaxation
✅ `VisualDerivedMetrics.update()` - Per-frame visual layer
✅ Spawn pipeline: DNA → init → onNodeSpawn
✅ Accumulator pattern in MetricsRuntime_v1

### What DOESN'T EXIST (False Documentation)

❌ `relaxNodeMetrics()` function
❌ frameCount % 60 timing for metrics
❌ 1-second interval for relaxation
❌ Any function matching "relaxNodeMetrics\s*\("

### What's CONFUSING

⚠️ NodeDynamicMetrics = VisualDerivedMetrics (alias)
⚠️ Visual layer named "Metrics" but isn't canonical
⚠️ Fixed 10Hz hidden inside MetricsRuntime_v1

---

## 8. CONCLUSIONS

### Mutation Chain Status

**SPAWN:** ✅ Works as intended
- DNA snapshot wins
- Defaults only as fallback
- Clear priority order

**EVENTS:** ✅ Well-structured
- Incremental adjustments (+/-)
- Clamped to [0, 1]
- Event-driven architecture

**RELAXATION:** ⚠️ Misdocumented but correct
- Fixed 10Hz tick (good for determinism)
- No FPS coupling (good)
- But documentation is completely wrong

**RUNTIME:** ✅ Two-layer separation
- Canonical metrics: Fixed 10Hz
- Visual metrics: Per-frame
- Clean separation of concerns

### Documentation Issues

**Critical:** `relaxNodeMetrics()` referenced throughout audits but doesn't exist

**Recommendation:** Update all references to:
- "MetricsRuntime_v1._step() at fixed 10Hz"
- Remove all mentions of frameCount % 60
- Clarify NodeDynamicMetrics is visual-only

### Architectural Assessment

**Overall:** Mutation chain is actually better than documentation suggests
- Fixed 10Hz canonical tick is deterministic
- No FPS coupling in canonical metrics
- Visual layer correctly separated

**Risk:** Documentation confusion could lead to:
- Incorrect assumptions about timing
- Misguided refactoring attempts
- Debugging in wrong places

---

**END OF AUDIT 3**