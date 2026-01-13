# PHASE 3C WEEK 16 — MAIN.JS DRY-RUN PATCH PREVIEW
## Proposed Code Insertions (NOT YET APPLIED)

**STATUS:** 🚫 **PROPOSED ONLY — DO NOT APPLY YET** 🚫

This document shows exact code blocks that WOULD be inserted in Phase 2. This is for planning and verification only.

---

## PATCH BLOCK A: IMPORT STATEMENT

**Target Location:** After line 124 (after PersonalityShaderAdvancedFX_v1 import)

**Surrounding Context (Unchanged):**
```javascript
// Line 123–125 (existing, not changing)
import { PersonalityShaderAdvancedFX_v1 } from './PersonalityShaderAdvancedFX_v1.js';

// ============================================================================
// HUD COLLAPSE SYSTEM 1.0 (Lightweight collapsible HUD management)
// ============================================================================
```

**PROPOSED INSERTION (DO NOT ADD):**
```javascript
// ============================================================================
// PHASE 3C ARCHETYPE SHADER PERSONALITY MODES (Week 16 - GPU Personality)
// ============================================================================
import { ArchetypeShaderModes_v1 } from './ArchetypeShaderModes_v1.js';
```

**After Insertion (Hypothetical):**
```javascript
// Line 123–125
import { PersonalityShaderAdvancedFX_v1 } from './PersonalityShaderAdvancedFX_v1.js';

// ============================================================================
// PHASE 3C ARCHETYPE SHADER PERSONALITY MODES (Week 16 - GPU Personality)
// ============================================================================
import { ArchetypeShaderModes_v1 } from './ArchetypeShaderModes_v1.js';

// ============================================================================
// HUD COLLAPSE SYSTEM 1.0 (Lightweight collapsible HUD management)
// ============================================================================
```

**Validation:**
- ✅ Import statement syntactically valid ES6
- ✅ File path correct (relative from project root)
- ✅ No circular dependencies
- ✅ Placed in proper chronological section

---

## PATCH BLOCK B: CONSTRUCTOR FIELD

**Target Location:** After line 341 (after `this.fxPerformanceTransition = null;`)

**Surrounding Context (Unchanged):**
```javascript
// Line 340–343 (existing, not changing)
// Phase 3c Smooth Transition Layer (Week 4.5 - polished quality mode transitions)
this.fxPerformanceTransition = null;

// Core Metrics Overlay 1.0 (network metrics + temporal units)
```

**PROPOSED INSERTION (DO NOT ADD):**
```javascript
// Phase 3c Archetype Shader Personality Modes (Week 16 - GPU personality shaders)
this.archetypeShaderModes = null;
```

**After Insertion (Hypothetical):**
```javascript
// Phase 3c Smooth Transition Layer (Week 4.5 - polished quality mode transitions)
this.fxPerformanceTransition = null;

// Phase 3c Archetype Shader Personality Modes (Week 16 - GPU personality shaders)
this.archetypeShaderModes = null;

// Core Metrics Overlay 1.0 (network metrics + temporal units)
```

**Validation:**
- ✅ Follows `this.fieldName = null;` pattern
- ✅ Placed in Phase 3C section
- ✅ Chronologically after Week 4.5, before metrics
- ✅ No syntax errors

---

## PATCH BLOCK C: INITIALIZATION IN createAINodes()

**Target Location:** After line 1346 (after `advancedShaderFX` initialization block)

**Surrounding Context (Unchanged):**
```javascript
// Line 1339–1346 (existing, not changing)
try {
    this.advancedShaderFX = new PersonalityShaderAdvancedFX_v1({
        scene: this.scene,
        lowFXProvider: () => this.lowFXModeEnabled ?? false,
    });
    console.log('[main.js] AdvancedFX initialized ✓');
} catch (err) {
    console.warn('[main.js] AdvancedFX init error:', err);
}

// Line 1348
// ====================================================================
// PHASE 3C PERFORMANCE MODE (Centralized FX Scaling)
// ====================================================================
```

**PROPOSED INSERTION (DO NOT ADD):**
```javascript
// ====================================================================
// PHASE 3C ARCHETYPE SHADER PERSONALITY MODES (Week 16 - GPU Shaders)
// ====================================================================
// Initialize ArchetypeShaderModes_v1 (GPU-driven personality shader modes)
// Reads: archetypeCurves (Week 13), archetypeAuraFX (Week 14), 
//        archetypeColorFX (Week 15), aura materials
// Writes: GPU shader uniforms for archetype visual identity
try {
    this.archetypeShaderModes = new ArchetypeShaderModes_v1({
        archetypeCurves: this.archetypeCurves,
        archetypeAuraFX: this.archetypeAuraFX,
        archetypeColorFX: this.archetypeColorFX,
        nodeAuraSystem: this.nodeAuraSystem,
        linkAuraSystem: this.linkAuraSystem,
        debugEnabled: false,
    });
    console.log('[main.js] ArchetypeShaderModes_v1 initialized ✓');
} catch (err) {
    console.warn('[main.js] ArchetypeShaderModes_v1 init error:', err);
}
```

**After Insertion (Hypothetical):**
```javascript
try {
    this.advancedShaderFX = new PersonalityShaderAdvancedFX_v1({
        scene: this.scene,
        lowFXProvider: () => this.lowFXModeEnabled ?? false,
    });
    console.log('[main.js] AdvancedFX initialized ✓');
} catch (err) {
    console.warn('[main.js] AdvancedFX init error:', err);
}

// ====================================================================
// PHASE 3C ARCHETYPE SHADER PERSONALITY MODES (Week 16 - GPU Shaders)
// ====================================================================
// Initialize ArchetypeShaderModes_v1 (GPU-driven personality shader modes)
// Reads: archetypeCurves (Week 13), archetypeAuraFX (Week 14), 
//        archetypeColorFX (Week 15), aura materials
// Writes: GPU shader uniforms for archetype visual identity
try {
    this.archetypeShaderModes = new ArchetypeShaderModes_v1({
        archetypeCurves: this.archetypeCurves,
        archetypeAuraFX: this.archetypeAuraFX,
        archetypeColorFX: this.archetypeColorFX,
        nodeAuraSystem: this.nodeAuraSystem,
        linkAuraSystem: this.linkAuraSystem,
        debugEnabled: false,
    });
    console.log('[main.js] ArchetypeShaderModes_v1 initialized ✓');
} catch (err) {
    console.warn('[main.js] ArchetypeShaderModes_v1 init error:', err);
}

// ====================================================================
// PHASE 3C PERFORMANCE MODE (Centralized FX Scaling)
// ====================================================================
```

**Validation:**
- ✅ Uses safe try-catch pattern
- ✅ All parameters exist at this point:
  - `this.archetypeCurves` - from Week 13 (must be initialized first)
  - `this.archetypeAuraFX` - from Week 14 (must be initialized first)
  - `this.archetypeColorFX` - from Week 15 (must be initialized first)
  - `this.nodeAuraSystem` - from Week 9 (exists earlier in createAINodes)
  - `this.linkAuraSystem` - from Week 10 (exists earlier in createAINodes)
- ✅ Console logging consistent
- ✅ Error handling defensive
- ✅ No syntax errors

---

## PATCH BLOCK D: UPDATE CALL IN animate()

**Target Location:** After line 2007 (after `advancedShaderFX.update` call)

**Surrounding Context (Unchanged):**
```javascript
// Line 2000–2007 (existing, not changing)
// ====================================================================
// PHASE 3C: Update Personality Shader Advanced FX (Week 5)
// ====================================================================
// Apply procedural GPU distortion based on personality signals
// Effects: chaos wobble, energy ripples, resonance waves, focus warp, corruption jitter
if (this.advancedShaderFX?.update) {
    this.advancedShaderFX.update(deltaTime);
}

// Line 2009
// Update Node Personality System 2.0 (personality-driven animations)
```

**PROPOSED INSERTION (DO NOT ADD):**
```javascript
// ====================================================================
// PHASE 3C: Update Archetype Shader Personality Modes (Week 16)
// ====================================================================
// Inject personality-driven shader uniforms to GPU materials
// Updates: Archetype-specific shader modes based on signals + ascension
if (this.archetypeShaderModes?.update) {
    this.archetypeShaderModes.update(deltaTime);
}
```

**After Insertion (Hypothetical):**
```javascript
// PHASE 3C: Update Personality Shader Advanced FX (Week 5)
// ====================================================================
// Apply procedural GPU distortion based on personality signals
// Effects: chaos wobble, energy ripples, resonance waves, focus warp, corruption jitter
if (this.advancedShaderFX?.update) {
    this.advancedShaderFX.update(deltaTime);
}

// ====================================================================
// PHASE 3C: Update Archetype Shader Personality Modes (Week 16)
// ====================================================================
// Inject personality-driven shader uniforms to GPU materials
// Updates: Archetype-specific shader modes based on signals + ascension
if (this.archetypeShaderModes?.update) {
    this.archetypeShaderModes.update(deltaTime);
}

// Update Node Personality System 2.0 (personality-driven animations)
```

**Validation:**
- ✅ Uses safe optional chaining `?.update`
- ✅ Passed `deltaTime` correctly
- ✅ Follows existing pattern exactly
- ✅ Placement before personality animations (depends on GPU state)
- ✅ No syntax errors

---

## PATCH BLOCK E: CLEANUP IN switchMode()

**Target Location:** After line 1548 (after personalityVFXLayer cleanup)

**Surrounding Context (Unchanged):**
```javascript
// Line 1542–1548 (existing, not changing)
// Dispose PersonalityVFXLayer (safe cleanup)
if (this.personalityVFXLayer) {
    if (this.personalityVFXLayer.clearCache) {
        this.personalityVFXLayer.clearCache();
    }
    this.personalityVFXLayer = null;
}

// Line 1550
// (Next cleanup code)
```

**PROPOSED INSERTION (DO NOT ADD):**
```javascript
// Dispose ArchetypeShaderModes_v1 (safe cleanup)
if (this.archetypeShaderModes) {
    this.archetypeShaderModes.dispose();
    this.archetypeShaderModes = null;
}
```

**After Insertion (Hypothetical):**
```javascript
// Dispose PersonalityVFXLayer (safe cleanup)
if (this.personalityVFXLayer) {
    if (this.personalityVFXLayer.clearCache) {
        this.personalityVFXLayer.clearCache();
    }
    this.personalityVFXLayer = null;
}

// Dispose ArchetypeShaderModes_v1 (safe cleanup)
if (this.archetypeShaderModes) {
    this.archetypeShaderModes.dispose();
    this.archetypeShaderModes = null;
}

// (Next cleanup code)
```

**Validation:**
- ✅ Calls `dispose()` method
- ✅ Sets to null after disposal
- ✅ Safe null check before access
- ✅ Follows existing cleanup pattern
- ✅ No syntax errors

---

## PATCH BLOCK F: CLEANUP IN dispose() (END OF CLASS)

**Target Location:** In final cleanup method of AtomaGame class (likely near end)

**Surrounding Context (Hypothetical):**
```javascript
// Typical location in final dispose() method
// Dispose advanced systems first
if (this.advancedShaderFX) {
    this.advancedShaderFX.dispose?.();
}

// Dispose Week 16
// (NEW CODE GOES HERE)

// Dispose Week 15
if (this.archetypeColorFX) {
    this.archetypeColorFX.dispose?.();
}
```

**PROPOSED INSERTION (DO NOT ADD):**
```javascript
// Dispose ArchetypeShaderModes_v1
if (this.archetypeShaderModes) {
    this.archetypeShaderModes.dispose?.();
    this.archetypeShaderModes = null;
}
```

**Validation:**
- ✅ Safe optional chaining with `dispose?.()`
- ✅ Sets to null after disposal
- ✅ Cleanup order: Week 16 → Week 15 → earlier weeks
- ✅ No syntax errors

---

## SUMMARY OF ALL PROPOSED INSERTIONS

| Block | Location | Type | Lines | Complexity |
|-------|----------|------|-------|------------|
| A | ~125 | Import | 3 | Simple |
| B | ~342 | Field init | 1 | Simple |
| C | ~1350 | Constructor init | 14 | Medium (try-catch) |
| D | ~2010 | Update loop | 6 | Simple |
| E | ~1550 | Cleanup | 4 | Simple |
| F | End | Final cleanup | 4 | Simple |

**Total additions:** ~32 lines  
**Total complexity:** LOW (mostly straightforward)  
**Risk level:** MINIMAL (follows existing patterns exactly)

---

## PREREQUISITE ALERT ⚠️

**CRITICAL: This patch depends on Week 13, 14, 15 being integrated first!**

Dependencies that must exist:
- `this.archetypeCurves` (Week 13 system)
- `this.archetypeAuraFX` (Week 14 system)
- `this.archetypeColorFX` (Week 15 system)

These are **NOT currently in main.js** and will cause errors if Week 16 is integrated before them.

**Recommended action:**
1. Stage Week 13 integration first (add archetypeCurves)
2. Stage Week 14 integration second (add archetypeAuraFX)
3. Stage Week 15 integration third (add archetypeColorFX)
4. **Then** apply this Week 16 patch

---

## SAFETY VALIDATION ✅

All proposed insertions:
- ✅ Follow existing code patterns exactly
- ✅ Use safe optional chaining (`?.`)
- ✅ Include proper error handling (try-catch)
- ✅ Have defensive null checks
- ✅ Include console logging for debugging
- ✅ Maintain bracket balance
- ✅ Have no syntax errors
- ✅ Are fully reversible (just delete if needed)

---

**END OF DRY-RUN PATCH PREVIEW**

**REMINDER: This document is for planning only. No code has been modified.**

*Generated for Phase 3C Week 16 — MAIN.JS EXTREME-SAFE PREP (Phase 1)*
