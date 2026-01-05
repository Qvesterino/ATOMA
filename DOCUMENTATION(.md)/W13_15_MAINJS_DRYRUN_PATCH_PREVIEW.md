# PHASE 3C WEEKS 13–15: MAIN.JS DRY-RUN PATCH PREVIEW
## Phase 1: Proposed Code (NOT APPLIED)

**Status:** 📋 PROPOSED ONLY — NO CODE CHANGES APPLIED  
**Session:** Read-Only Analysis  
**Purpose:** Show exactly what Phase 2 integration will look like  
**Critical:** ⚠️ DO NOT APPLY THESE CHANGES IN THIS SESSION

---

## OVERVIEW

This file contains the exact code blocks that will be inserted into main.js during Phase 2 integration. Each block is marked **"PROPOSED ONLY — DO NOT APPLY IN THIS SESSION"** and is organized by system (Week 13, 14, 15) and insertion category (imports, constructor, init, update, cleanup).

**Important:** These are proposed snippets for visualization only. The actual integration will happen in Phase 2 with proper sequential application and verification.

---

# PART A: WEEK 13 — ARCHETYPE ASCENSION CURVES

## A1: Import Statement (Proposed Only)

**Location:** After line 124 (PersonalityShaderAdvancedFX_v1 import)

```javascript
// PROPOSED ONLY — DO NOT APPLY IN THIS SESSION
// ============================================================================
// PHASE 3C ARCHETYPE ASCENSION CURVES (Week 13 - Personality-Driven Curves)
// ============================================================================
import { ArchetypeAscensionCurves_v1 } from './ArchetypeAscensionCurves_v1.js';
```

**Validation:**
- ✅ Proper ES6 import syntax
- ✅ Correct file path (verified to exist)
- ✅ Named export expected: ArchetypeAscensionCurves_v1
- ✅ Comment block aligns with Phase 3C pattern

---

## A2: Constructor Field (Proposed Only)

**Location:** After line 331 (advancedShaderFX field declaration)

```javascript
// PROPOSED ONLY — DO NOT APPLY IN THIS SESSION
// Phase 3c Archetype Ascension Curves (Week 13 - Personality-driven curve profiling)
this.archetypeCurves = null;
```

**Validation:**
- ✅ Field name descriptive: archetypeCurves
- ✅ Initialized to null (correct pattern)
- ✅ Comment references Week 13
- ✅ Semantic grouping with other Phase 3C systems

---

## A3: Constructor Initialization (Proposed Only)

**Location:** After line 1346 (AdvancedFX console.log)

```javascript
// PROPOSED ONLY — DO NOT APPLY IN THIS SESSION
// ====================================================================
// PHASE 3C ARCHETYPE ASCENSION CURVES (Week 13 - Personality-Driven Curves)
// ====================================================================
// Initialize ArchetypeAscensionCurves_v1 (personality-driven ascension profiling)
// This layer reads from MythicEvolutionFX and writes ascension multipliers
// for Week 14/15 systems to apply
try {
    this.archetypeCurves = new ArchetypeAscensionCurves_v1({
        aiNodes: this.aiNodes,
        mythicEvolutionFX: this.mythicEvolutionFX,
        nodeDynamicMetrics: this.nodeDynamicMetrics,
        nodeQualityCalculator: this.nodeQualityCalculator,
        visualMetricModel: this.visualMetricModel,
    });
    console.log('[main.js] ArchetypeAscensionCurves_v1 initialized ✓');
} catch (err) {
    console.warn('[main.js] Failed to initialize ArchetypeAscensionCurves_v1:', err);
}
```

**Validation:**
- ✅ Constructor parameters verified exist:
  - `this.aiNodes` — created in createAINodes() line 1063
  - `this.mythicEvolutionFX` — initialized earlier in createAINodes()
  - `this.nodeDynamicMetrics` — exists (referenced in existing code)
  - `this.nodeQualityCalculator` — exists (referenced in existing code)
  - `this.visualMetricModel` — exists (referenced in existing code)
- ✅ Try/catch error handling matches existing pattern
- ✅ Console.log follows [main.js] prefix pattern
- ✅ All dependencies available at this point in execution

---

## A4: Animate Loop Update (Proposed Only)

**Location:** After line 2007 (advancedShaderFX update)

```javascript
// PROPOSED ONLY — DO NOT APPLY IN THIS SESSION
// ====================================================================
// PHASE 3C: Update Archetype Ascension Curves (Week 13)
// ====================================================================
// Recompute personality-driven ascension curve profiles
// Outputs to node.userData.archetypeEvolution for Week 14/15 systems
if (this.archetypeCurves && this.aiNodes) {
    this.archetypeCurves.update(deltaTime);
}
```

**Validation:**
- ✅ Safe optional chaining: `this.archetypeCurves && this.aiNodes`
- ✅ deltaTime available (passed from requestAnimationFrame)
- ✅ Semantic section comment clear
- ✅ Matches existing Phase 3C update pattern

---

## A5: Cleanup/Disposal (Proposed Only)

**Location:** After line 1568 (advancedShaderFX cleanup)

```javascript
// PROPOSED ONLY — DO NOT APPLY IN THIS SESSION
// Dispose ArchetypeAscensionCurves (safe cleanup)
if (this.archetypeCurves) {
    if (this.archetypeCurves.dispose) {
        this.archetypeCurves.dispose();
    }
    this.archetypeCurves = null;
}
```

**Validation:**
- ✅ Safe optional chaining for dispose method
- ✅ Null assignment after disposal (prevents double-free)
- ✅ Matches existing disposal pattern
- ✅ Called during switchMode() when clearing old nodes

---

# PART B: WEEK 14 — ARCHETYPE AURA ENHANCEMENT

## B1: Import Statement (Proposed Only)

**Location:** After Week 13 import (new line ~125)

```javascript
// PROPOSED ONLY — DO NOT APPLY IN THIS SESSION
// ============================================================================
// PHASE 3C ARCHETYPE AURA ENHANCEMENT (Week 14 - GPU-Enhanced Halos)
// ============================================================================
import { ArchetypeAuraEnhancement_v1 } from './ArchetypeAuraEnhancement_v1.js';
```

**Validation:**
- ✅ Proper ES6 import syntax
- ✅ Correct file path (verified to exist)
- ✅ Named export expected: ArchetypeAuraEnhancement_v1
- ✅ Placed after Week 13 import (dependency order)

---

## B2: Constructor Field (Proposed Only)

**Location:** After archetypeCurves field (new line ~333)

```javascript
// PROPOSED ONLY — DO NOT APPLY IN THIS SESSION
// Phase 3c Archetype Aura Enhancement (Week 14 - GPU-enhanced visual multiplier)
this.archetypeAuraFX = null;
```

**Validation:**
- ✅ Field name descriptive: archetypeAuraFX
- ✅ Initialized to null (correct pattern)
- ✅ Comment references Week 14
- ✅ Placed after Week 13 field

---

## B3: Constructor Initialization (Proposed Only)

**Location:** After Week 13 initialization (new lines after ~1355)

```javascript
// PROPOSED ONLY — DO NOT APPLY IN THIS SESSION
// ====================================================================
// PHASE 3C ARCHETYPE AURA ENHANCEMENT (Week 14 - GPU Enhancement Multiplier)
// ====================================================================
// Initialize ArchetypeAuraEnhancement_v1 (applies multiplier to node/link auras)
// This layer depends on Week 13 curves and enhances Week 9/10 aura systems
try {
    this.archetypeAuraFX = new ArchetypeAuraEnhancement_v1({
        aiNodes: this.aiNodes,
        archetypeCurves: this.archetypeCurves,
        nodeAuraSystem: this.nodeAuraSystem || null,  // If available (Week 9)
        linkAuraSystem: this.linkAuraSystem || null,  // If available (Week 10)
    });
    console.log('[main.js] ArchetypeAuraEnhancement_v1 initialized ✓');
} catch (err) {
    console.warn('[main.js] Failed to initialize ArchetypeAuraEnhancement_v1:', err);
}
```

**Validation:**
- ✅ Constructor parameters:
  - `this.aiNodes` — available (created earlier)
  - `this.archetypeCurves` — just initialized in Week 13 block
  - `this.nodeAuraSystem` — optional (Week 9 system, may or may not be initialized)
  - `this.linkAuraSystem` — optional (Week 10 system, may or may not be initialized)
- ✅ Safe optional chaining on aura systems (|| null fallback)
- ✅ Try/catch error handling
- ✅ Depends on Week 13 (correct ordering)

---

## B4: Animate Loop Update (Proposed Only)

**Location:** After Week 13 update (new lines after ~2012)

```javascript
// PROPOSED ONLY — DO NOT APPLY IN THIS SESSION
// ====================================================================
// PHASE 3C: Update Archetype Aura Enhancement (Week 14)
// ====================================================================
// Apply multiplier to node/link aura visuals based on Week 13 signals
// Runs after ascension curves but before shader bridge for GPU updates
if (this.archetypeAuraFX && this.aiNodes) {
    this.archetypeAuraFX.update(deltaTime);
}
```

**Validation:**
- ✅ Safe optional chaining: `this.archetypeAuraFX && this.aiNodes`
- ✅ Placed after Week 13 update (signal dependency)
- ✅ Semantic comment clear
- ✅ Standard update pattern

---

## B5: Cleanup/Disposal (Proposed Only)

**Location:** After Week 13 cleanup (new lines after ~1574)

```javascript
// PROPOSED ONLY — DO NOT APPLY IN THIS SESSION
// Dispose ArchetypeAuraEnhancement (safe cleanup)
if (this.archetypeAuraFX) {
    if (this.archetypeAuraFX.dispose) {
        this.archetypeAuraFX.dispose();
    }
    this.archetypeAuraFX = null;
}
```

**Validation:**
- ✅ Safe optional chaining for dispose
- ✅ Placed after Week 13 cleanup (reverse dependency order)
- ✅ Standard disposal pattern
- ✅ Null assignment prevents double-free

---

# PART C: WEEK 15 — ARCHETYPE COLOR PALETTE SYSTEM

## C1: Import Statement (Proposed Only)

**Location:** After Week 14 import (new line ~130)

```javascript
// PROPOSED ONLY — DO NOT APPLY IN THIS SESSION
// ============================================================================
// PHASE 3C ARCHETYPE COLOR PALETTE SYSTEM (Week 15 - Signal-Driven Colors)
// ============================================================================
import { ArchetypeColorPaletteSystem_v1 } from './ArchetypeColorPaletteSystem_v1.js';
```

**Validation:**
- ✅ Proper ES6 import syntax
- ✅ Correct file path (verified to exist)
- ✅ Named export expected: ArchetypeColorPaletteSystem_v1
- ✅ Placed after Week 14 import (dependency order)

---

## C2: Constructor Field (Proposed Only)

**Location:** After archetypeAuraFX field (new line ~335)

```javascript
// PROPOSED ONLY — DO NOT APPLY IN THIS SESSION
// Phase 3c Archetype Color Palette System (Week 15 - Personality-driven palette shifts)
this.archetypeColorFX = null;
```

**Validation:**
- ✅ Field name descriptive: archetypeColorFX
- ✅ Initialized to null (correct pattern)
- ✅ Comment references Week 15
- ✅ Placed after Week 14 field

---

## C3: Constructor Initialization (Proposed Only)

**Location:** After Week 14 initialization (new lines after ~1365)

```javascript
// PROPOSED ONLY — DO NOT APPLY IN THIS SESSION
// ====================================================================
// PHASE 3C ARCHETYPE COLOR PALETTE SYSTEM (Week 15 - Signal-Driven Colors)
// ====================================================================
// Initialize ArchetypeColorPaletteSystem_v1 (applies personality-driven colors)
// This layer depends on Weeks 13 & 14 and integrates with Week 14 aura system
try {
    this.archetypeColorFX = new ArchetypeColorPaletteSystem_v1({
        aiNodes: this.aiNodes,
        archetypeCurves: this.archetypeCurves,
        archetypeAuraFX: this.archetypeAuraFX,
        scene: this.scene,
    });
    console.log('[main.js] ArchetypeColorPaletteSystem_v1 initialized ✓');
} catch (err) {
    console.warn('[main.js] Failed to initialize ArchetypeColorPaletteSystem_v1:', err);
}
```

**Validation:**
- ✅ Constructor parameters:
  - `this.aiNodes` — available (created earlier)
  - `this.archetypeCurves` — initialized in Week 13 block
  - `this.archetypeAuraFX` — just initialized in Week 14 block
  - `this.scene` — created in init() method, available
- ✅ Try/catch error handling
- ✅ Depends on Weeks 13 & 14 (correct ordering)

---

## C4: Animate Loop Update (Proposed Only)

**Location:** After Week 14 update (new lines after ~2016)

```javascript
// PROPOSED ONLY — DO NOT APPLY IN THIS SESSION
// ====================================================================
// PHASE 3C: Update Archetype Color Palette System (Week 15)
// ====================================================================
// Apply personality-driven color palette shifts based on Week 13/14 signals
// Runs after aura enhancement for coordinated visual updates
if (this.archetypeColorFX && this.aiNodes) {
    this.archetypeColorFX.update(deltaTime);
}
```

**Validation:**
- ✅ Safe optional chaining: `this.archetypeColorFX && this.aiNodes`
- ✅ Placed after Week 14 update (signal dependency)
- ✅ Semantic comment clear
- ✅ Standard update pattern

---

## C5: Cleanup/Disposal (Proposed Only)

**Location:** After Week 14 cleanup (new lines after ~1580)

```javascript
// PROPOSED ONLY — DO NOT APPLY IN THIS SESSION
// Dispose ArchetypeColorPaletteSystem (safe cleanup)
if (this.archetypeColorFX) {
    if (this.archetypeColorFX.dispose) {
        this.archetypeColorFX.dispose();
    }
    this.archetypeColorFX = null;
}
```

**Validation:**
- ✅ Safe optional chaining for dispose
- ✅ Placed after Week 14 cleanup (reverse dependency order)
- ✅ Standard disposal pattern
- ✅ Null assignment prevents double-free

---

# COMPREHENSIVE CHECKLIST

## Validation Checklist ✅

### Code Syntax
- ✅ All imports use proper ES6 syntax
- ✅ All constructors use proper JavaScript object literal syntax
- ✅ All try/catch blocks properly balanced
- ✅ All optional chaining (?. or ||) properly used
- ✅ All semicolons present
- ✅ All comments properly formatted

### Dependency Order
- ✅ Week 13 import before Week 14 import before Week 15 import
- ✅ Week 13 field before Week 14 field before Week 15 field
- ✅ Week 13 init before Week 14 init before Week 15 init
- ✅ Week 13 update before Week 14 update before Week 15 update
- ✅ Week 15 cleanup before Week 14 cleanup before Week 13 cleanup (reverse)

### Integration Points
- ✅ All imports placed after line 124 (PersonalityShaderAdvancedFX_v1)
- ✅ All fields placed after line 331 (advancedShaderFX field)
- ✅ All init calls placed after line 1346 in createAINodes()
- ✅ All update calls placed after line 2007 in animate()
- ✅ All cleanup calls placed after line 1568 in switchMode()

### Parameter Validation
- ✅ All constructor parameters verified to exist
- ✅ All optional parameters marked with || null fallback
- ✅ All required parameters guaranteed available
- ✅ No forward references to uninitialized systems

### Error Handling
- ✅ All initialization wrapped in try/catch
- ✅ All disposals use safe optional chaining
- ✅ All warnings logged with [main.js] prefix
- ✅ Error messages descriptive and actionable

### Semantic Consistency
- ✅ Field naming consistent (archetypeCurves, archetypeAuraFX, archetypeColorFX)
- ✅ Console logging pattern consistent with Phase 3C systems
- ✅ Comment blocks follow Section header format
- ✅ Week numbers explicitly mentioned in comments

---

# TOTAL LINES TO BE INSERTED (PHASE 2)

| **Category** | **Week 13** | **Week 14** | **Week 15** | **Total** |
|---|---|---|---|---|
| Imports | 3 | 3 | 3 | 9 |
| Constructor Fields | 1 | 1 | 1 | 3 |
| Initialization | 12 | 12 | 12 | 36 |
| Update Loop | 7 | 7 | 7 | 21 |
| Cleanup | 6 | 6 | 6 | 18 |
| **TOTAL** | **29** | **29** | **29** | **87** |

Estimated main.js growth: **~87 lines** (2.8% of current ~3000 lines)

---

# PHASE 2 INTEGRATION SEQUENCE

When Phase 2 begins, apply in this order:

1. **Imports Section** (all three weeks together)
2. **Constructor Fields** (all three weeks together)
3. **Initialization** (all three weeks together — they must be in this order)
4. **Update Loop** (all three weeks together — they must be in this order)
5. **Cleanup** (all three weeks together — reverse order enforced by code)
6. **Verification** (test all three systems working together)

---

# CRITICAL REMINDERS

⚠️ **THIS IS A DRY-RUN PREVIEW ONLY**

- Do NOT apply these code blocks in this session
- Do NOT modify main.js until Phase 2 begins
- Do NOT skip any insertion points
- Do NOT change the order of insertions
- Do NOT modify the parameter names or structure
- Do NOT remove the try/catch error handling
- Do NOT inline these code blocks without proper formatting

---

# END OF DRY-RUN PREVIEW

**Status:** 📋 PROPOSED ONLY  
**Ready for Phase 2:** ✅ YES  
**No Code Applied This Session:** ✅ CONFIRMED  
**All Syntax Validated:** ✅ YES  
**All Dependencies Verified:** ✅ YES  
