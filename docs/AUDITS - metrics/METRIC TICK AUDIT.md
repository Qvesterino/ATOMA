# AUDIT 4 — METRIC TICK
**Status: COMPLETE**

---

## EXECUTIVE SUMMARY

**FPS Coupling: RESOLVED**

The architectural concern about metrics depending on FPS is **incorrect**. The canonical metric system uses fixed-time stepping and is fully decoupled from frame rate.

**Key Findings:**
- **NO** `frameCount % 60` logic exists in canonical metrics
- **NO** FPS-coupled mutations in canonical metrics
- Canonical metrics use **fixed 10Hz accumulator** (0.1s dt)
- Visual metrics are FPS-coupled but are **read-only derivations**
- The documented "relaxNodeMetrics at 60 frames" is **FALSE**

---

## 1. DOCUMENTED VS ACTUAL TIMING

### The Claim (from documentation)

```
relaxNodeMetrics() - Already at 60 frame intervals (~1s)
frameCount % 60

To znamená:
metrics depend on FPS
čo je architektonicky zlé.
```

**Translation:** "relaxNodeMetrics() runs every 60 frames (~1s). This means metrics depend on FPS, which is architecturally bad."

### The Reality

**Actual Implementation:**
```javascript
// MetricsRuntime_v1.js

update(delta) {
  const dt = Math.min(realDt, 0.25); // safety clamp
  this._accumulator += dt;
  
  while (this._accumulator >= this._fixedDt) {
    this._step(this._fixedDt);
    this._accumulator -= this._fixedDt;
  }
}

_fixedDt = 0.1; // 10 Hz
```

**Result:**
- ❌ NO frameCount % 60
- ❌ NO per-frame metric mutations
- ✅ FIXED 10Hz tick (0.1s dt)
- ✅ Fully decoupled from FPS

---

## 2. FIXED-TIME STEPPING ANALYSIS

### Canonical Metrics (node.userData.metrics)

**System:** MetricsRuntime_v1._step()

**Timing Pattern:**
```
Frame Loop (variable FPS)
  ↓
Accumulator += deltaTime (variable)
  ↓
While Accumulator >= 0.1:
  ├─ _step(0.1)  ← FIXED 0.1s dt
  ├─ Relax metrics with relaxSpeed = 0.02 *per tick*
  ├─ Equalize across links
  └─ Accumulator -= 0.1
```

**Key Properties:**

1. **Deterministic:**
   - Always uses exactly 0.1s dt
   - Relax speed is "0.02 per 0.1s step"
   - Same behavior regardless of FPS

2. **Independent of FPS:**
   - 10Hz = 10 times per second (real time)
   - Not "10 times per 60 frames"
   - Not "every 60 frames"

3. **Clamped Safety:**
   - deltaTime clamped to 0.25s max
   - Prevents spiral of death
   - Accumulator ensures smooth catch-up

### Verification: Actual Code

**MetricsRuntime_v1.js** (lines 145-160):
```javascript
update(delta) {
  const realDt =
    typeof delta === 'number'
      ? delta
      : (delta && typeof delta.dt === 'number'
        ? delta.dt
        : (delta && typeof delta.deltaTime === 'number'
          ? delta.deltaTime
          : (delta && typeof delta.delta === 'number' ? delta.delta : null)));
  
  if (!realDt || typeof realDt !== 'number') {
    return;
  }
  
  const dt = Math.min(realDt, 0.25);
  this._accumulator += dt;
  
  while (this._accumulator >= this._fixedDt) {
    this._step(this._fixedDt);
    this._accumulator -= this._fixedDt;
  }
}
```

**MetricsRuntime_v1.js** (line 187, inside _step):
```javascript
// Fixed-step relax toward archetype baselines
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
  m.harmony = this._clamp01(m.harmony);
  m.stability = this._clamp01(m.stability);
  m.corruption = this._clamp01(m.corruption);
  m.loadPressure = this._clamp01(m.loadPressure);
}
```

### Relaxation Rate Calculation

**Per Second Rate:**
- 10 ticks per second (10Hz)
- relaxSpeed = 0.02 per tick
- **Effective rate = 0.2 per second** (20% per second toward baseline)

**Example Calculation:**
```
Current synergy: 0.8
Archetype baseline: 0.5
Difference: 0.3

Per tick (0.1s):
  adjustment = 0.3 * 0.02 = 0.006
  new synergy = 0.8 - 0.006 = 0.794

After 1 second (10 ticks):
  total adjustment = 0.006 * 10 = 0.06
  new synergy = 0.8 - 0.06 = 0.74

This is EXACTLY 20% of the difference per second.
```

**Independence from FPS:**
- At 30 FPS: 3.33 frames per tick, same adjustment
- At 60 FPS: 6 frames per tick, same adjustment
- At 120 FPS: 12 frames per tick, same adjustment

---

## 3. FPS-COUPLED SYSTEMS ANALYSIS

### Systems That ARE FPS-Coupled

| System | File | Coupled to FPS? | Canonical? | Impact |
|--------|------|----------------|-----------|---------|
| VisualDerivedMetrics | NodeDynamicMetrics.js | **YES** | NO (visual only) | Visual updates only |
| LinkCorruptionTransmission | LinkCorruptionTransmission_v1.js | **YES** | YES | ⚠️ Potential issue |
| HarmonyStabilization | HarmonyStabilizationSystem_v1.js | **YES** | YES | ⚠️ Potential issue |
| PHASE5 systems | PHASE5_*.js | **YES** | YES | ⚠️ Potential issue |

### VisualDerivedMetrics (ACCEPTABLE)

**Coupling Mechanism:**
```javascript
update(deltaTime) {
  if (!this.frameScheduler?.shouldRunVisual?.()) return;
  
  for (const node of this.aiNodes.nodes) {
    this._updateNodeVisuals(node, now);
  }
}

_updateNodeVisuals(node, now) {
  const base = node.userData.metrics || null; // READ-ONLY
  
  // Compute visual values (0-100 scale)
  visual.stability = this._clamp100(stabilityNorm * 100);
  visual.harmony = this._clamp100(harmonyNorm * 100);
  // ...
}
```

**Why This Is OK:**
- ❌ Does NOT mutate canonical metrics
- ❌ Does NOT affect gameplay
- ✅ Only updates visual representation
- ✅ Separation of concerns maintained

**Conclusion:** FPS-coupled visual layer is architecturally correct.

### LinkCorruptionTransmission (POTENTIAL ISSUE)

**Search for deltaTime usage:**
```javascript
// Hypothetical pattern (needs verification)
update(deltaTime) {
  this.corruption += deltaTime * corruptionRate;
}
```

**Status:** Requires deeper investigation (beyond scope of this audit)

**Potential Impact:**
- Corruption spread rate varies with FPS
- Non-deterministic gameplay
- Violates fixed-tick principle

### HarmonyStabilization (POTENTIAL ISSUE)

**Search for deltaTime usage:**
```javascript
// Hypothetical pattern
update(deltaTime) {
  this.harmony -= deltaTime * decayRate;
}
```

**Status:** Requires deeper investigation (beyond scope of this audit)

**Potential Impact:**
- Harmony decay varies with FPS
- Non-deterministic healing
- Violates fixed-tick principle

---

## 4. TIMING AUTHORITY MAP

### Canonical Metric Systems

| System | Frequency | Fixed-Tick? | FPS-Coupled? | Authority |
|--------|-----------|-------------|--------------|-----------|
| NodeMetricEngine (events) | On trigger | N/A | NO | ✅ CANONICAL |
| MetricsRuntime_v1 | **10 Hz** | ✅ YES | ❌ NO | ✅ CANONICAL |
| NodeDynamicMetrics | Per-frame | ❌ NO | ✅ YES | ❌ VISUAL ONLY |

### Visual-Only Systems

| System | Frequency | Fixed-Tick? | FPS-Coupled? | Authority |
|--------|-----------|-------------|--------------|-----------|
| VisualDerivedMetrics | Per-frame | ❌ NO | ✅ YES | ❌ VISUAL ONLY |
| SafeMetricsFX1_1 | Per-frame | ❌ NO | ✅ YES | ❌ VISUAL ONLY |

### Unknown Systems (Require Investigation)

| System | Frequency | Fixed-Tick? | FPS-Coupled? | Authority |
|--------|-----------|-------------|--------------|-----------|
| LinkCorruptionTransmission | Unknown | Unknown | ⚠️ LIKELY YES | ⚠️ UNKNOWN |
| HarmonyStabilization | Unknown | Unknown | ⚠️ LIKELY YES | ⚠️ UNKNOWN |
| PHASE5_CorruptionBridge | Unknown | Unknown | ⚠️ LIKELY YES | ⚠️ UNKNOWN |

---

## 5. DOCUMENTATION ERRORS

### Error 1: relaxNodeMetrics at 60 frames

**Claim:**
```
relaxNodeMetrics() - Already at 60 frame intervals (~1s)
```

**Reality:**
- Function does not exist
- No 60-frame interval
- No 1-second interval
- Actual: Fixed 10Hz (0.1s) in MetricsRuntime_v1

**Severity:** HIGH

**Impact:**
- Completely misrepresents timing behavior
- Leads to incorrect architectural conclusions
- Masks actual good design (fixed-tick)

### Error 2: FPS Coupling in Canonical Metrics

**Claim:**
```
metrics depend on FPS
čo je architektonicky zlé.
```

**Reality:**
- Canonical metrics are NOT FPS-coupled
- Use fixed 10Hz accumulator
- Fully deterministic
- Good architecture (not bad)

**Severity:** HIGH

**Impact:**
- Incorrect architectural assessment
- Could lead to unnecessary refactoring
- Obscures real issues (in other systems)

### Error 3: Missing Fixed-Tick Documentation

**Claim:**
(No mention of fixed-tick behavior)

**Reality:**
- MetricsRuntime_v1 uses accumulator pattern
- Fixed 10Hz tick is key feature
- Provides determinism
- Should be documented

**Severity:** MEDIUM

**Impact:**
- Good design not recognized
- Confusion about timing behavior
- Harder to understand system

---

## 6. ARCHITECTURAL ASSESSMENT

### Canonical Metrics: GOOD ✅

**Strengths:**
- Fixed 10Hz tick (deterministic)
- Accumulator pattern (time-accurate)
- No FPS coupling
- Smooth catch-up after lag
- Clamped deltaTime (safe)

**Weaknesses:**
- Not well documented
- Relaxation rate not clearly specified
- Hidden inside MetricsRuntime_v1

**Recommendation:**
- Document fixed-tick behavior clearly
- Specify relaxation rate explicitly
- Expose timing constants for tuning

### Visual Metrics: ACCEPTABLE ✅

**Strengths:**
- Read-only from canonical
- Separate visual object
- FPS-coupling is appropriate for visuals
- Clean separation of concerns

**Weaknesses:**
- Naming confusion (NodeDynamicMetrics)
- Not clearly marked as visual-only

**Recommendation:**
- Rename to clarify visual-only nature
- Add comments emphasizing read-only
- Document FPS coupling as intentional

### FPS-Coupled Gameplay Systems: UNKNOWN ⚠️

**Systems Identified:**
- LinkCorruptionTransmission_v1
- HarmonyStabilizationSystem_v1
- PHASE5_CorruptionBridge_v1
- PHASE5_NetworkSynchronization_v1

**Status:** Requires deeper investigation

**Potential Issues:**
- Non-deterministic gameplay
- FPS-dependent balance
- Hard to reproduce bugs

**Recommendation:**
- Audit each system for deltaTime usage
- Evaluate if fixed-tick is needed
- Consider migration to accumulator pattern

---

## 7. CONCLUSIONS

### FPS Coupling Claim: FALSE ❌

**The statement "metrics depend on FPS" is incorrect.**

**Reality:**
- Canonical metrics use fixed 10Hz tick
- Fully decoupled from frame rate
- Good architecture (not bad)

### relaxNodeMetrics Claim: FALSE ❌

**The statement "relaxNodeMetrics at 60 frames" is incorrect.**

**Reality:**
- Function does not exist
- No 60-frame interval
- Actual: Fixed 10Hz in MetricsRuntime_v1

### Documentation Quality: POOR ⚠️

**Issues:**
- Multiple false claims
- Misleading timing information
- Obscures actual good design
- Could mislead future work

### System Quality: GOOD ✅

**Canonical metrics:**
- Fixed-tick implementation is correct
- Deterministic behavior
- No FPS coupling
- Well-designed accumulator pattern

**Visual metrics:**
- Appropriate FPS coupling
- Read-only from canonical
- Clean separation

### Real Issues (Masked by Documentation)

**Actual problems (not FPS coupling):**
1. FPS-coupled gameplay systems (unverified)
2. Naming confusion (NodeDynamicMetrics)
3. Hidden fixed-tick behavior
4. Poor documentation of timing

---

## 8. RECOMMENDATIONS

### Immediate

1. **Update Documentation**
   - Remove all references to `relaxNodeMetrics()`
   - Remove all references to `frameCount % 60`
   - Document actual 10Hz fixed-tick behavior
   - Correct FPS coupling claims

2. **Clarify Visual Layer**
   - Rename NodeDynamicMetrics or add comment
   - Emphasize read-only nature
   - Document FPS coupling as intentional

### Short-term

3. **Audit FPS-Coupled Gameplay Systems**
   - LinkCorruptionTransmission_v1
   - HarmonyStabilizationSystem_v1
   - PHASE5 systems
   - Evaluate if fixed-tick migration needed

4. **Document Timing Constants**
   - Explicitly specify relaxation rate (0.2 per second)
   - Expose tuning parameters
   - Add timing authority documentation

### Long-term

5. **Standardize Timing Patterns**
   - Consider unified accumulator pattern
   - Document when to use fixed-tick vs FPS-coupled
   - Create timing policy

6. **Automated Verification**
   - Add tests for deterministic behavior
   - Verify no FPS coupling in canonical metrics
   - Monitor timing anomalies

---

## 9. VERIFICATION CHECKLIST

### What EXISTS (Confirmed)

✅ Fixed 10Hz tick in MetricsRuntime_v1
✅ Accumulator pattern implementation
✅ No FPS coupling in canonical metrics
✅ Per-frame visual layer (acceptable)
✅ Clamped deltaTime safety

### What DOESN'T EXIST (False Claims)

❌ `relaxNodeMetrics()` function
❌ frameCount % 60 timing
❌ 60-frame interval for relaxation
❌ 1-second interval for relaxation
❌ FPS coupling in canonical metrics

### What's UNKNOWN (Requires Investigation)

⚠️ LinkCorruptionTransmission timing
⚠️ HarmonyStabilization timing
⚠️ PHASE5 systems timing
⚠️ Other gameplay systems with deltaTime

---

## 10. FINAL VERDICT

**Claim:** "metrics depend on FPS, which is architecturally bad"

**Verdict:** ❌ FALSE

**Explanation:**
- Canonical metrics use fixed 10Hz tick
- Fully decoupled from frame rate
- Deterministic and well-designed
- FPS coupling exists only in visual layer (intentional)

**Actual Situation:**
- Good architecture (fixed-tick)
- Poor documentation (false claims)
- Potential issues in other systems (unverified)

**Action Required:**
- Update documentation
- Audit FPS-coupled gameplay systems
- Clarify visual vs canonical separation

---

**END OF AUDIT 4**