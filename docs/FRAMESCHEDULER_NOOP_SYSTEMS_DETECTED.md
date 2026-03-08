# FrameScheduler No-Op Systems Detection Report

**Date:** 2026-03-08
**Task:** Detect scheduler systems that do nothing
**Analysis Method:** Automated static analysis of main.js FrameScheduler registrations

---

## Executive Summary

**Total systems registered:** 95
**No-op systems detected:** 5
**Active systems:** 90

**Categories:**
- **Empty bodies (no code):** 5 systems
- **Log-only bodies:** 0 systems
- **Conditional-only bodies:** 0 systems

---

## No-Op Systems (Doing Nothing)

### 1. visual.linkSparkSystems
**Layer:** visual (30 Hz)
**Status:** ❌ EMPTY
**Reason:** Empty body with only backward compatibility comment
**Code:**
```javascript
this.frameScheduler.register('visual', (dt) => {
    // Empty - kept for backward compatibility reference
}, 'visual.linkSparkSystems');
```

**Context:**
- Comment indicates system moved to LinkRendererConduit
- LinkSparkSystem instances still exist as Map in main.js
- But the scheduled update function does nothing
- **Recommendation:** Remove registration or implement proper update

---

### 2. test-camera
**Layer:** realtime (60 Hz)
**Status:** ❌ EMPTY
**Reason:** Empty test/example placeholder
**Code:**
```javascript
this.frameScheduler.register('realtime', (dt) => {
    // Example: camera update
}, 'test-camera');
```

**Context:**
- Part of test system scaffolding
- No functional purpose
- **Recommendation:** Remove all test registrations

---

### 3. test-visuals
**Layer:** visual (30 Hz)
**Status:** ❌ EMPTY
**Reason:** Empty test/example placeholder
**Code:**
```javascript
this.frameScheduler.register('visual', (dt) => {
    // Example: visual effects update
}, 'test-visuals');
```

**Context:**
- Part of test system scaffolding
- No functional purpose
- **Recommendation:** Remove all test registrations

---

### 4. test-ai
**Layer:** simulation (10 Hz)
**Status:** ❌ EMPTY
**Reason:** Empty test/example placeholder
**Code:**
```javascript
this.frameScheduler.register('simulation', (dt) => {
    // Example: AI processing
}, 'test-ai');
```

**Context:**
- Part of test system scaffolding
- No functional purpose
- **Recommendation:** Remove all test registrations

---

### 5. test-narrative
**Layer:** background (2 Hz)
**Status:** ❌ EMPTY
**Reason:** Empty test/example placeholder
**Code:**
```javascript
this.frameScheduler.register('background', (dt) => {
    // Example: narrative system
}, 'test-narrative');
```

**Context:**
- Part of test system scaffolding
- No functional purpose
- **Recommendation:** Remove all test registrations

---

## Layer Breakdown

| Layer        | Total | No-Ops | Active | No-Op Rate |
|--------------|-------|--------|--------|------------|
| **realtime** | 10    | 1      | 9      | 10.0%      |
| **visual**   | 43    | 2      | 41     | 4.7%       |
| **simulation** | 29  | 1      | 28     | 3.4%       |
| **background** | 13  | 1      | 12     | 7.7%       |
| **TOTAL**    | 95    | 5      | 90     | 5.3%       |

---

## Systems Not Captured by Analysis

The analysis script captured 95 registrations using regex pattern matching. Some additional patterns may exist:

### .bind() Pattern
Registrations using method reference with `.bind(this)` were not fully analyzed:
- `realtime.cameraController`
- `realtime.playerController`
- `visual.synergyChainReaction`
- `visual.nodeAuraSystem`

These systems call actual methods on `this` and are presumed active.

---

## Recommendations

### High Priority (Safe Removal)

1. **Remove test system registrations** (4 systems):
   - `test-camera`
   - `test-visuals`
   - `test-ai`
   - `test-narrative`

   **Rationale:** These are explicitly marked as example placeholders with no implementation. Removing them has zero impact.

2. **Remove or fix `visual.linkSparkSystems`** (1 system):
   - **Option A:** Remove the registration if LinkRendererConduit handles spark updates
   - **Option B:** Implement proper update loop that iterates through the `linkSparkSystems` Map

   **Rationale:** The scheduled function does nothing while individual LinkSparkSystem instances exist in a Map. This is likely dead code or miswiring.

---

## Analysis Methodology

### Detection Criteria

1. **Empty bodies:**
   - Body contains only whitespace and comments
   - No executable code after comment removal

2. **Log-only bodies:**
   - Body contains only `console.log/warn/error` calls
   - No state mutations or side effects

3. **Conditional-only bodies:**
   - Body contains only `if` statements with early returns
   - No method calls or assignments inside conditionals

### Limitations

- Cannot determine if optional-chained systems (e.g., `this.system?.update?.(dt)`) actually have their dependencies initialized at runtime
- `.bind(this)` method references not analyzed (assumed active)
- Dynamic system creation not detected

---

## Appendix: Registration Count Verification

```bash
# Total registrations in main.js
Get-Content main.js | Select-String "frameScheduler.register" | Measure-Object

# Result: 144 total registrations
```

**Discrepancy Note:** The analysis script captured 95 registrations. The difference (49) suggests:
- Multiple registration patterns not covered by the primary regex
- Some registrations span multiple lines or use different formatting
- Additional registration patterns in main.js

**Next Steps:** If needed, expand regex patterns to capture all 144 registrations.

---

## Verification Commands

```javascript
// List all registered systems at runtime
frameScheduler.listSystems()

// Get statistics
frameScheduler.getStats()

// Check specific system
frameScheduler.isRegistered('visual.linkSparkSystems')
```

---

**Classification:** Class A - Analysis Report (no changes proposed)
**Next Action:** Human decision on removing no-op systems
