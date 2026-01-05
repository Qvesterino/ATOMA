# Main.js Slimming Pass v1.0 — PHASE 3 VERIFICATION CHECKLIST

**Status:** TEMPLATE (To be filled during Phase 3)  
**Date:** [Session TBD]  
**Goal:** Validate extraction, syntax, behavior, and line count reduction

---

## ✅ PRE-EXTRACTION CHECKLIST (Phase 2 Complete)

- [ ] `/EnvironmentSetup_v1.js` created and syntax valid
- [ ] `/GlyphSystemSetup_v1.js` created and syntax valid
- [ ] `/WorldFXSetup_v1.js` created and syntax valid
- [ ] 3 imports added to main.js (lines ~162-164)
- [ ] Original methods removed from main.js
- [ ] New function calls added to constructor
- [ ] main.js has valid bracket balance (verify with linter)

---

## 🔍 PHASE 3A: STATIC SYNTAX VALIDATION

### Bracket & Brace Balance
```
[ ] main.js: All { } balanced
[ ] main.js: All [ ] balanced
[ ] main.js: All ( ) balanced
[ ] EnvironmentSetup_v1.js: Valid module syntax
[ ] GlyphSystemSetup_v1.js: Valid module syntax
[ ] WorldFXSetup_v1.js: Valid module syntax
[ ] All export statements valid (no missing semicolons)
```

### Import Verification
```
[ ] Line 162: import { initializeEnvironments } from './EnvironmentSetup_v1.js';
[ ] Line 163: import { initializeGlyphSystems } from './GlyphSystemSetup_v1.js';
[ ] Line 164: import { initializeWorldFX } from './WorldFXSetup_v1.js';
[ ] No duplicate imports
[ ] All imports appear before class declaration
[ ] No circular dependencies
```

### Constructor Call Verification
```
[ ] initializeEnvironments(this); called in correct location
[ ] initializeGlyphSystems(this); called in correct location
[ ] initializeWorldFX(this); called in correct location
[ ] All calls occur AFTER world creation but before runtimes
[ ] Exact original order preserved (setupModeSwitch, setupPerformanceMode, etc.)
```

---

## 🚀 PHASE 3B: RUNTIME BOOT TEST

### Startup Sequence
```
[ ] Game starts without ResourceError on main.js
[ ] Console shows no import errors
[ ] Console shows no undefined reference errors
[ ] Scene initializes successfully
[ ] Camera initializes successfully
[ ] Renderer initializes successfully
```

### Initialization Messages (Check Console)
```
ENVIRONMENT SETUP:
[ ] "✓ [v3.0] Legacy HUD DOM elements cleaned from page"
[ ] "✓ [main.js] NodeLinkingSystem created ✓"

WORLD SETUP:
[ ] (World successfully created message or silent success)

ENVIRONMENT SETUP:
[ ] One of:
    [ ] "✓ Sigma Rift environment ready" (or no explicit message)
    [ ] No errors from environment setup

GLYPH SYSTEM SETUP:
[ ] "✓ Semantic Glyph AI 5.0 initialized"
[ ] "✓ Glyph Fusion Overlay 4.1 initialized"
[ ] "✓ Procedural Meaning Engine 1.0 initialized"
[ ] "✓ Link Glyph Flow 1.0 initialized"
[ ] "✓ Linked Glyph Messaging 3.0 active"
[ ] "✓ Recursive Glyph Messaging 4.0 active"
[ ] "✓ Emergent Thought Storms 5.0 active"
[ ] "✓ AI Narrative Patterns 6.0 active"
[ ] "✓ ATOMA Language Engine 2.0 initialized"
[ ] "✓ Node Inspect Linguistic Overlay 1.0 initialized"
[ ] "✓ ATOMA Language Engine 3.0 initialized"

WORLD FX SETUP:
[ ] (Various setup messages from world systems)
[ ] No errors from world FX initialization
```

### Critical System Checks
```
[ ] Player visible and responsive to input
[ ] Camera working (mouse look works)
[ ] Scene has expected visual appearance
[ ] No unexpected black/white screen or infinite loops
[ ] Frame rate normal (not stuck at 1 FPS)
```

---

## 🎮 PHASE 3C: FUNCTIONAL BEHAVIOR VALIDATION

### Core Gameplay
```
[ ] Player can move (WASD keys)
[ ] Player can look around (mouse)
[ ] Can see AI nodes in scene
[ ] Nodes have expected visual properties (glow, color, etc.)
[ ] No nodes missing or duplicated
```

### Mode Switching (Press M)
```
[ ] Pressing M switches to next environment
[ ] World transitions cleanly
[ ] New nodes spawn correctly
[ ] All visual systems reinitialize
[ ] No console errors during transition
[ ] No memory leaks visible (frame rate stable)
```

### UI Systems
```
[ ] Node selection works (hover shows badge)
[ ] Primary node system works (double-click)
[ ] Context menu appears (E key)
[ ] Linking works (can create connections)
[ ] Glyph visuals appear on nodes
[ ] No UI overlap or rendering errors
```

### Performance
```
[ ] Frame rate stays above 30 FPS in typical scene
[ ] No performance regression vs. before extraction
[ ] Glyph updates smooth (no stuttering)
[ ] Camera polished and responsive
```

---

## 📊 PHASE 3D: LINE COUNT METRICS

### Before Extraction
```
main.js total lines:              [_____]  (~4,500 expected)
Import section:                   [_____]  (83 lines)
Constructor section:              [_____]  (~420 lines)
Setup methods section:            [_____]  (~3,500 lines)
Other methods:                    [_____]  (~200 lines)
```

### After Extraction
```
main.js total lines:              [_____]  (target: ~4,050-4,100)
Import section:                   [_____]  (~86 lines, +3)
Constructor section:              [_____]  (target: ~220-270 lines)
Setup methods section:            [_____]  (target: ~3,000-3,050 lines)
Other methods:                    [_____]  (~200 lines)
```

### Extracted File Metrics
```
EnvironmentSetup_v1.js:           [_____]  (expect: 198 lines)
GlyphSystemSetup_v1.js:           [_____]  (expect: 199 lines)
WorldFXSetup_v1.js:               [_____]  (expect: 102 lines)
TOTAL EXTRACTED:                  [_____]  (expect: ~499 lines)
```

### Line Reduction
```
Lines removed from main.js:       [_____]  (expect: ~450 lines)
Lines added (imports):            [_____]  (expect: 3 lines)
NET REDUCTION:                    [_____]  (target: ≥400 lines) ✅ or ❌
```

---

## 🧪 PHASE 3E: REGRESSION TESTING

### Systems That Should NOT Change
```
[ ] Node creation still works (old and new nodes spawn)
[ ] Link creation still works (connections form properly)
[ ] Player movement unchanged
[ ] Camera behavior unchanged
[ ] World physics/forces unchanged
[ ] Visual effects unchanged (same colors, glows, animations)
[ ] Performance unchanged or improved
[ ] All keyboard shortcuts still work
[ ] All debug commands still work (spawn.*, toggle*, debug*, etc.)
```

### Systems That Should Verify Safe
```
[ ] Environment switching (M key) still works
[ ] All 6 world environments initialize correctly
[ ] Glyph systems all active and functional
[ ] All FX systems active (weather, trails, illusions, etc.)
```

---

## 🎯 PHASE 3F: CONSOLE ERROR CHECK

### Critical Errors (❌ FAIL if any appear)
```
[ ] No "Uncaught TypeError" messages
[ ] No "undefined is not a function" errors
[ ] No "Cannot read property" errors
[ ] No "Failed to resolve module" errors
[ ] No "import statement outside module" errors
[ ] No "main.js" ResourceError in network tab
```

### Warnings That Are OK ⚠️
```
✅ Allowed: Old vendor warnings (react, three.js internal notes)
✅ Allowed: Physics/collision notices
❌ NOT allowed: "EnvironmentSetup_v1 not found" or similar
```

---

## ✅ FINAL VALIDATION SUMMARY

### Overall Health Checks
```
[ ] Code syntax: VALID ✅
[ ] Imports: ALL PRESENT ✅
[ ] Boot: SUCCESSFUL ✅
[ ] Gameplay: FUNCTIONAL ✅
[ ] Visual Systems: ACTIVE ✅
[ ] Performance: ACCEPTABLE ✅
[ ] Line Count: REDUCED ≥400 ✅
[ ] Regressions: ZERO ✅
```

### Pass/Fail Decision
```
PASS CRITERIA:
  [x] Game boots without errors
  [x] All visual systems initialize
  [x] Core gameplay works
  [x] No regressions detected
  [x] Line count reduced by ≥400 lines

CURRENT STATUS:  [ ] PASS  [ ] FAIL

If FAIL, document specific failures below:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

## 📋 ISSUES FOUND & RESOLUTIONS

### Issue #1: [Description]
```
Status:    [ ] NOT FOUND  [ ] FOUND & DOCUMENTED
Location:  [_________________]
Severity:  [ ] BLOCKER  [ ] MAJOR  [ ] MINOR
Fix:       [_________________________________________________]
Resolved:  [ ] YES  [ ] NO  [ ] PENDING
```

### Issue #2: [Description]
```
Status:    [ ] NOT FOUND  [ ] FOUND & DOCUMENTED
Location:  [_________________]
Severity:  [ ] BLOCKER  [ ] MAJOR  [ ] MINOR
Fix:       [_________________________________________________]
Resolved:  [ ] YES  [ ] NO  [ ] PENDING
```

---

## 🎬 SIGN-OFF

```
Verification Date:     ________________
Verified By:          ________________
Overall Status:       [ ] ✅ PASS    [ ] ❌ FAIL
Line Reduction:       _________ lines saved
Pass Status:          [ ] SUCCESS    [ ] NEEDS REVISION
Next Step:            [ ] Deploy     [ ] Debug & Retest
```

---

## 📝 NOTES FOR SESSION

```
[Space for additional observations, benchmarks, or notes]
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

**Template Complete** ✅  
**To be filled during Phase 3 Runtime Validation**

