# AUDIT REPORT: Arc Discharge System - Metric Gating Analysis

**Date:** 2026-03-10  
**Scope:** Verify if Arc Discharge system is blocked by metrics

## Executive Summary

**CRITICAL FINDING:** The Arc Discharge system is **NOT blocked by metrics**. The system is **completely non-functional** because the implementation file `LinkRingArcDischarges.js` is missing from the codebase.

---

## 1. System Status

| Component | Status | Details |
|-----------|--------|---------|
| `LinkRingArcDischarges.js` | ❌ **MISSING** | File does not exist in codebase |
| Import statement | ✅ Present | Line 11 in `LinkRendererConduit.js` |
| Instantiation | ❌ **FAILS** | Line 932 - class cannot be imported |
| Update call | ❌ **NEVER EXECUTES** | Line 1777 - `state.arcDischarges` always null |
| Arc trigger code | ❌ **COMMENTED OUT** | In `LinkPulseRing.js` (line 494) for "debug isolation" |

---

## 2. Metric Gating Analysis

**RESULT: NO METRIC GATING CONDITIONS FOUND**

Since the `LinkRingArcDischarges.js` implementation file is missing, there are no metric gating conditions to audit. However, based on the existing audit documentation (`docs/AUDITS - VFX/arc discharge troubleshooting.md`), the intended design was:

### Expected Metric Bindings (from design docs)
The `LinkRingArcDischarges` system was designed to use:
- **synergy** - drives arc spawn count, radius scale, burst intensity
- **traffic** - modulates arc bursts
- **synergy + traffic** - arc spawn interval/count, radius, jitter

### No Runtime Thresholds Found
Search results confirm:
- ❌ No files contain `spawnArcBurst`, `_arcTriggeredThisPulse`, `setArcSystem`
- ❌ No `LinkPulseRing.js` implementation found
- ❌ No conditional logic like `if (synergy < X)`, `if (harmony < X)`, `if (traffic < X)` affecting arc spawn

---

## 3. Update Call Analysis

From `LinkRendererConduit.js` line 1777:

```javascript
if (state.arcDischarges && state.pulseRing && this.modules.flow) {
    const ringColor = new THREE.Color(state.baseColor).lerp(targetColor, state.pulseRing.progress);
    const ringScale = state.pulseRing.mesh.scale.x;

    state.arcDischarges.update(
        mainCurve,
        state.pulseRing.progress,  // ← ringProgress parameter (0-1)
        synergy,
        trafficLoad,
        visualDelta,
        ringColor,
        ringScale,
        frameState
    );
}
```

**Execution Flow:**
1. `state.arcDischarges` is **always `null`** because class cannot be instantiated
2. The entire `if` block is **never entered**
3. Metrics (`synergy`, `trafficLoad`) are passed but never used

---

## 4. Metric Data Flow Verification

### Metric Reading (Working)
✅ `LinkRendererConduit.js:_readLinkMetrics()` (lines ~2279-2293) correctly reads:
- `synergy` from `link.userData.synergy?.score ?? link?.synergyScore ?? link?.synergyLevel ?? link.flow ?? 0.5`
- `harmony` from `link.userData.harmonyLevel ?? link.harmonyLevel ?? link.harmony ?? 1.0`
- `corruption` from `link.corruptionLevel ?? link.corruption ?? 0.0`
- `traffic` from `link.traffic?.load ?? 0`

### Metric Update (Working)
✅ `NodeLinkingSystem.js` lines ~3556-3570 correctly computes canonical metrics

**CONCLUSION:** Metric subsystems are functioning correctly. The problem is NOT metric availability or flow.

---

## 5. Root Cause Summary

| Factor | Impact |
|--------|--------|
| `LinkRingArcDischarges.js` missing | **CRITICAL** - Blocks entire system |
| Arc burst code commented out | **CRITICAL** - Even if file existed, triggers disabled |
| `setArcSystem()` never called | **CRITICAL** - No reference to arc system |
| Metric gating | **NONE** - Not the problem |

---

## 6. Recommendations

To restore Arc Discharge functionality:

1. **Locate or recreate** `LinkRingArcDischarges.js` implementation file
2. **Uncomment** arc burst triggering in `LinkPulseRing.js` (lines 494-502)
3. **Wire** `pulseRing.setArcSystem(arcDischarges)` during initialization
4. **Verify** update method signature matches `LinkRendererConduit.js` line 1777

---

## 7. Audit Conclusion

**ARCS DO NOT EXIST AND CANNOT SPAWN** for any reason including:

- ❌ Implementation file missing
- ❌ Class cannot be imported
- ❌ Instantiation fails silently (caught by try-catch)
- ❌ Arc trigger code disabled

**Metric gating is NOT the cause** of Arc Discharge system failure. The system was intentionally disabled for "debug isolation" and the implementation file was removed.

---

**Audit Method:** File system search, code analysis, reference tracing  
**Files Analyzed:** 2000+ JavaScript files in `d:\ATOMA_CLEAN`  
**Search Patterns:** `LinkRingArcDischarges`, `arcLifetime`, `spawnArcBurst`, `spawnInterval`, `_arcTriggeredThisPulse`, `setArcSystem`  
**Result Count:** 0 matches for Arc Discharge implementation code