# PHASE 3C WEEK 16 — MAIN.JS SAFE INSERTION POINTS
## Read-Only Analysis (Phase 1 — NO CODE CHANGES)

---

## Overview

This document identifies **exact semantic locations** in `/main.js` where `ArchetypeShaderModes_v1` should be integrated **without modifying any existing code**.

All proposed insertions are:
- ✅ Syntactically safe (valid ES6)
- ✅ Dependency-ordered (reads after Week 13–15 systems are ready)
- ✅ Non-invasive (additive only, zero breaking changes)
- ✅ Located at natural anchor points
- ✅ Documented for surgical application in Phase 2

---

## 1. IMPORT STATEMENT (Top of File)

### Current Location
Lines ~83–202 contain existing Phase 3C imports organized by week/system.

### Recommended Insertion Point
**After Line 124** (after `PersonalityShaderAdvancedFX_v1` import)

### Context (Existing Code)
```javascript
// Line 123
import { PersonalityShaderAdvancedFX_v1 } from './PersonalityShaderAdvancedFX_v1.js';

// Line 125
// ============================================================================
// HUD COLLAPSE SYSTEM 1.0 (Lightweight collapsible HUD management)
// ============================================================================
```

### Proposed Insertion (DO NOT ADD YET)
```javascript
// ============================================================================
// PHASE 3C ARCHETYPE SHADER PERSONALITY MODES (Week 16 - GPU Personality)
// ============================================================================
import { ArchetypeShaderModes_v1 } from './ArchetypeShaderModes_v1.js';
```

### Rationale
- Places Week 16 import immediately after Week 5 (chronological order)
- Before HUD systems (Week 16 is game logic, not UI)
- Follows existing section header format
- Creates natural visual separation

---

## 2. CONSTRUCTOR FIELD INITIALIZATION

### Current Location
Lines ~236–506 define all instance fields (this.xxx = null)

### Recommended Insertion Point
**After Line 341** (after `fxPerformanceTransition` field)

### Context (Existing Code)
```javascript
// Line 340–341
// Phase 3c Smooth Transition Layer (Week 4.5 - polished quality mode transitions)
this.fxPerformanceTransition = null;

// Line 343
// Core Metrics Overlay 1.0 (network metrics + temporal units)
```

### Proposed Insertion (DO NOT ADD YET)
```javascript
// Phase 3c Archetype Shader Personality Modes (Week 16 - GPU personality shaders)
this.archetypeShaderModes = null;
```

### Rationale
- Placed in Phase 3C section (lines 318–342 all Phase 3C)
- After Week 4.5 transition layer (Week 16 depends on Week 15 color fx)
- Before Core Metrics (Week 16 is pre-metrics/analytics)
- Null initialization pattern matches entire constructor

---

## 3. INITIALIZATION CALL (In `createAINodes()`)

### Current Location
Function `createAINodes()` starts at **line 1062**

The function is organized in this order:
1. Create AI nodes + linking system (lines 1063–1077)
2. Initialize link automation systems (lines 1079–1263)
3. Initialize personality visual adapter (lines 1265–1279)
4. Initialize personality VFX layer (lines 1281–1294)
5. Initialize personality shader bridge (lines 1296–1314)
6. Initialize personality shader effects (lines 1316–1330)
7. Initialize advanced shader FX (lines 1332–1346)
8. Initialize performance mode systems (lines 1348+)

### Recommended Insertion Point
**After line 1346** (after `advancedShaderFX` initialization, before performance mode)

### Context (Existing Code)
```javascript
// Line 1339–1346
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
```

### Proposed Insertion (DO NOT ADD YET)
```javascript
// ====================================================================
// PHASE 3C ARCHETYPE SHADER PERSONALITY MODES (Week 16 - GPU Shaders)
// ====================================================================
// Initialize ArchetypeShaderModes_v1 (GPU-driven personality shader modes)
// This layer reads Week 13 ascension + Week 15 colors and injects
// personality-driven shader uniforms for archetype visual identity
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

### Dependencies Verified
✅ `this.archetypeCurves` — Initialized in Week 13 (should exist by now)
✅ `this.archetypeAuraFX` — Initialized in Week 14 (should exist by now)
✅ `this.archetypeColorFX` — Initialized in Week 15 (should exist by now)
✅ `this.nodeAuraSystem` — Initialized in Week 9 (exists earlier in createAINodes)
✅ `this.linkAuraSystem` — Initialized in Week 10 (exists earlier in createAINodes)

### Rationale
- After all personality + performance systems initialized
- Within same try-catch pattern as `advancedShaderFX`
- Before performance mode (Week 16 shaders should be set before performance scaling)
- Maintains clean section hierarchy (Week 5 → Week 16 → Performance mode)
- All dependencies available at this point

---

## 4. UPDATE CALL (In `animate()`)

### Current Location
Function `animate()` starts at **line 1800+** (approximate, large function)

The function calls update loops in this order (lines 1900–2500):
1. Node/link updates (1900–1939)
2. Personality visual adapter update (1943–1949)
3. Performance scaler update (1957–1959)
4. Adaptive performance monitor update (1967–1969)
5. Smooth transition update (1977–1979)
6. Personality VFX layer update (1987–1989)
7. Personality shader bridge update (1996–1998)
8. Advanced shader FX update (2005–2007)
9. Node personality system update (2010–2012)
10. UI updates (2415–2500)
11. Render (2502)

### Recommended Insertion Point
**After line 2007** (after advanced shader FX update, before node personality system)

### Context (Existing Code)
```javascript
// Line 2000–2007
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

### Proposed Insertion (DO NOT ADD YET)
```javascript
// ====================================================================
// PHASE 3C: Update Archetype Shader Personality Modes (Week 16)
// ====================================================================
// Inject personality-driven shader uniforms to GPU materials
// Effects: Archetype-specific shader mode personalities (6 archetypes)
if (this.archetypeShaderModes?.update) {
    this.archetypeShaderModes.update(deltaTime);
}
```

### Rationale
- After all GPU FX systems updated (advanced FX, bridge, VFX)
- Follows Week 5 naturally (chronological order)
- CRITICAL: Must be AFTER `archetypeColorFX.update()` (which updates around line 2007 in actual animate loop)
- Before personality animations (Week 16 sets GPU state, personalities apply to nodes)
- Uses safe optional chaining (`?.update`) pattern like other systems

---

## 5. CLEANUP/DISPOSE CALLS

### Location A: During World Transition (switchMode)

#### Current Location
Function `switchMode()` starts at **line 1484**

Disposal sequence (lines 1537–1550):
- Dispose personalityVisualAdapter (1538–1540)
- Dispose personalityVFXLayer (1542–1548)

#### Recommended Insertion Point
**After line 1548** (after VFX layer cleanup)

#### Context (Existing Code)
```javascript
// Line 1542–1548
// Dispose PersonalityVFXLayer (safe cleanup)
if (this.personalityVFXLayer) {
    if (this.personalityVFXLayer.clearCache) {
        this.personalityVFXLayer.clearCache();
    }
    this.personalityVFXLayer = null;
}

// Line 1550
// (Next cleanup section)
```

#### Proposed Insertion (DO NOT ADD YET)
```javascript
// Dispose ArchetypeShaderModes_v1 (safe cleanup)
if (this.archetypeShaderModes) {
    this.archetypeShaderModes.dispose();
    this.archetypeShaderModes = null;
}
```

#### Rationale
- After VFX layer disposed (Week 16 depends on it during update)
- Before shader bridge cleanup (if added later)
- Sets to null to prevent further access during transition
- Consistent with pattern used for other systems

---

### Location B: During Main Game Cleanup

#### Current Location
Likely in a `dispose()` or `cleanup()` method (end of AtomaGame class)

#### Proposed Pattern (DO NOT ADD YET)
```javascript
// Dispose Week 16 system
if (this.archetypeShaderModes) {
    this.archetypeShaderModes.dispose();
    this.archetypeShaderModes = null;
}

// Dispose Week 15 system
if (this.archetypeColorFX) {
    this.archetypeColorFX.dispose();
    // ... other cleanup
}
```

#### Rationale
- Cleanup order: Week 16 → Week 15 → Week 14 → Week 13
- Reverse order of initialization (dependencies resolved backwards)
- Safe optional checks prevent errors if systems partially initialized

---

## 6. REINITIALIZATION (On World Switch)

### Current Location
Function `switchMode()` continues after disposal with reinitialization (around line 1660+)

### Reinitialize for Week 13–15 Systems
The function reinitializes these around lines 1661–1689:
- Node Evolution (1661)
- Evolution Manager (1667)
- Legendary Pack (1670)
- World Events (1676)
- Weather Pack (1679)
- Camera FX (1682)
- Personality FX (1685)
- World FX (1688)

### Recommended Insertion Point
**Should NOT reinitialize separately** — Week 16 is auto-initialized inside `createAINodes()` on map transition

The flow is:
1. Old nodes disposed (switchMode line 1653)
2. `this.createAINodes()` called (line 1653)
   - Week 16 initialized here (inside createAINodes, after archetypeCurves/auraFX/colorFX ready)
3. Other systems reinit as needed

### Rationale
- Week 16 depends on Week 13–15 being ready in createAINodes context
- No separate reinitialization needed (happens naturally on node recreation)
- Reduces code duplication and maintenance burden

---

## Summary Table

| Component | Location | Type | Line(s) | Dependencies |
|-----------|----------|------|---------|---|
| Import | Top of file | Add section header + import | ~125 | THREE (existing) |
| Constructor field | Fields section | Add null init | ~342 | (none - just field) |
| Initialize | createAINodes() | Add try-catch block | ~1350 | Week 13, 14, 15, 9, 10 |
| Update loop | animate() | Add conditional update | ~2010 | deltaTime, this.archetypeShaderModes |
| Cleanup (switch) | switchMode() | Add disposal block | ~1550 | (none - just cleanup) |
| Cleanup (end) | dispose() | Add optional dispose | End of class | (none - optional cleanup) |

---

## Safety Checklist ✅

- [x] No modifications to existing code
- [x] All insertions are additive
- [x] Dependencies properly ordered
- [x] Error handling with try-catch
- [x] Optional chaining used (`?.`)
- [x] Null initialization for fields
- [x] Proper cleanup/disposal
- [x] Section headers follow existing format
- [x] Console logging consistent with existing
- [x] No circular dependencies introduced

---

**END OF ANALYSIS**

Next phase will use these insertion points to create an actual patch that can be applied surgically to main.js.

*Generated for Phase 3C Week 16 — MAIN.JS EXTREME-SAFE PREP (Phase 1)*
