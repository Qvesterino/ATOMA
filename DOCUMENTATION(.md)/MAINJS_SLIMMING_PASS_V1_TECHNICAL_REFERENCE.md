# Main.js Slimming Pass v1.0 — Technical Reference

**Purpose:** Deep technical details for developers executing Phases 2-3  
**Audience:** JavaScript engineers  
**Level:** Advanced

---

## 🔍 SUBSYSTEM EXTRACTION DETAILS

### SUBSYSTEM 1: ENVIRONMENT SETUP

#### Source Location (main.js)
```
Lines: 854–1052
Methods: 6
Total: 198 lines
```

#### Methods to Extract
```javascript
setupSigmaRiftEnvironment()          [Line 854-877]    [23 lines]
setupDreamDesertEnvironment()        [Line 882-913]    [32 lines]
setupChamberEnvironment()            [Line 918-941]    [24 lines]
setupQuantumIslandEnvironment()      [Line 946-979]    [33 lines]
setupFractalValleyEnvironment()      [Line 984-1017]   [34 lines]
setupMemoryLaneEnvironment()         [Line 1022-1052]  [30 lines]
                                                       ───────
                                                 Total: [198 lines]
```

#### Dependencies Analysis
```
External:
  - THREE (already imported)
  - CONFIG (already imported)

Internal:
  - this.scene
  - this.scene.background
  - this.scene.fog
  - this.scene.children
  - this.scene.add()

Self-Contained: ✅ YES
  - No cross-references to other setup methods
  - Pure scene configuration
  - No side effects outside scene
```

#### Extraction Pattern
```javascript
// NEW FILE: /EnvironmentSetup_v1.js

import * as THREE from 'three';
import { CONFIG } from './config.js';

export function initializeEnvironments(game) {
    // Each environment method called on game.scene
    setupSigmaRiftEnvironment(game.scene);
    setupDreamDesertEnvironment(game.scene);
    setupChamberEnvironment(game.scene);
    setupQuantumIslandEnvironment(game.scene);
    setupFractalValleyEnvironment(game.scene);
    setupMemoryLaneEnvironment(game.scene);
}

function setupSigmaRiftEnvironment(scene) {
    // [Copy body from main.js setupSigmaRiftEnvironment() exactly]
    const skyColors = {
        // ...
    };
}

// ... repeat for other 5 environment methods
```

#### Constructor Integration (main.js)
```javascript
// OLD (lines 845-1052 in init() method)
this.setupSigmaRiftEnvironment();
this.setupDreamDesertEnvironment();
this.setupChamberEnvironment();
this.setupQuantumIslandEnvironment();
this.setupFractalValleyEnvironment();
this.setupMemoryLaneEnvironment();

// NEW (1 line)
initializeEnvironments(this);
```

#### Line Count Impact
```
Removed from main.js:           198 lines
Added to main.js (imports):     +1 line (consolidated)
Added to new file:              200 lines (includes export)
NET main.js reduction:          197 lines
```

---

### SUBSYSTEM 2: GLYPH SYSTEM SETUP ⭐ CRITICAL

#### Source Location (main.js)
```
Lines: 3,470–3,730 (scattered across setup methods)
Methods: 11
Total: 199 lines
```

#### Methods to Extract (IN ORDER)
```javascript
setupSemanticGlyphAI()           [Line 3473-3485]     [12 lines]
setupGlyphFusionOverlay()        [Line 3490-3508]     [18 lines]
setupProceduralMeaningEngine()   [Line 3514-3530]     [16 lines]
setupLinkGlyphFlow()             [Line 3536-3549]     [14 lines]
setupLinkedGlyphMessaging()      [Line 3555-3569]     [14 lines]
setupRecursiveGlyphMessaging()   [Line 3575-3590]     [16 lines]
setupEmergentThoughtStorms()     [Line 3596-3616]     [20 lines]
setupAINarrativePatterns()       [Line 3622-3645]     [24 lines]
setupLanguageEngine()            [Line 3652-3671]     [20 lines]
setupLinguisticOverlay()         [Line 3678-3698]     [20 lines]
setupPoetryEngine()              [Line 3705-3730]     [25 lines]
                                                       ───────
                                                  Total: [199 lines]
```

#### Critical: Dependency Order
⚠️ **MUST maintain exact order:**
```
1. setupSemanticGlyphAI()
   └─ Creates: this.semanticGlyphAI
   └─ Depends on: this.glyphLayer4

2. setupGlyphFusionOverlay()
   └─ Creates: this.glyphFusionOverlay
   └─ Depends on: this.semanticGlyphAI ✅

3. setupProceduralMeaningEngine()
   └─ Creates: this.proceduralMeaningEngine
   └─ Depends on: this.semanticGlyphAI ✅

4. setupLinkGlyphFlow()
   └─ Creates: this.linkGlyphFlow
   └─ Depends on: this.linkingSystem (already exists)

5. setupLinkedGlyphMessaging()
   └─ Creates: this.linkedGlyphMessaging
   └─ Depends on: this.semanticGlyphAI ✅

6. setupRecursiveGlyphMessaging()
   └─ Creates: this.recursiveGlyphMessaging
   └─ Depends on: this.semanticGlyphAI ✅

7. setupEmergentThoughtStorms()
   └─ Creates: this.emergentThoughtStorms
   └─ Depends on: this.recursiveGlyphMessaging ✅
                  this.semanticGlyphAI ✅

8. setupAINarrativePatterns()
   └─ Creates: this.narrativePatterns
   └─ Depends on: this.emergentThoughtStorms ✅
                  this.recursiveGlyphMessaging ✅
                  this.linkedGlyphMessaging ✅
                  this.semanticGlyphAI ✅

9. setupLanguageEngine()
   └─ Creates: (already initialized in constructor)
   └─ Setup only

10. setupLinguisticOverlay()
    └─ Creates: this.linguisticOverlay
    └─ Depends on: this.languageEngine ✅

11. setupPoetryEngine()
    └─ Creates: this.poetryEngine
    └─ Depends on: this.languageEngine ✅
```

#### Extraction Pattern
```javascript
// NEW FILE: /GlyphSystemSetup_v1.js

export function initializeGlyphSystems(game) {
    // CRITICAL: Call in exact order shown above
    // Each method checks if dependencies exist before use
    
    game.setupSemanticGlyphAI?.();
    game.setupGlyphFusionOverlay?.();
    game.setupProceduralMeaningEngine?.();
    game.setupLinkGlyphFlow?.();
    game.setupLinkedGlyphMessaging?.();
    game.setupRecursiveGlyphMessaging?.();
    game.setupEmergentThoughtStorms?.();
    game.setupAINarrativePatterns?.();
    game.setupLanguageEngine?.();
    game.setupLinguisticOverlay?.();
    game.setupPoetryEngine?.();
}

// Note: Methods remain on AtomaGame.prototype
// This function just calls them in order
```

#### Constructor Integration (main.js)
```javascript
// NEW: Add imports
import { initializeGlyphSystems } from './GlyphSystemSetup_v1.js';

// OLD: Direct calls (11 lines scattered)
this.setupSemanticGlyphAI();
this.setupGlyphFusionOverlay();
// ... etc ...

// NEW: Single call
initializeGlyphSystems(this);
```

#### Line Count Impact
```
Removed from main.js:           ~140 lines (setup methods calls removed)
Added to main.js (imports):     +0 lines (already bundled)
Added to new file:              ~160 lines (just orchestration)
NET main.js reduction:          ~140 lines
```

---

### SUBSYSTEM 3: WORLD FX SETUP

#### Source Location (main.js)
```
Lines: 2,999–3,160 (scattered)
Methods: 10
Total: 102 lines
```

#### Methods to Extract (IN ORDER)
```javascript
setupWorldEvents()               [Line 3003-3007]     [4 lines]
setupWeatherPack()               [Line 3013-3017]     [4 lines]
setupCameraFX()                  [Line 3023-3027]     [4 lines]
setupPersonalityFX()             [Line 3033-3037]     [4 lines]
setupWorldFXPack()               [Line 3043-3047]     [4 lines]
setupAmbientEntities()           [Line 3053-3065]     [12 lines]
setupMemoryTrails()              [Line 3073-3091]     [18 lines]
setupQuantumIllusions()          [Line 3097-3109]     [10 lines]
setupColonyManager()             [Line 3115-3138]     [23 lines]
setupDreamDepthPack()            [Line 3144-3161]     [17 lines]
                                                       ───────
                                                  Total: [102 lines]
```

#### Dependencies Analysis
```
Order Constraints: ⚠️ SOME
  1. setupAmbientEntities() needs: legendaryPack, worldEvents, weatherPack, linkingSystem
  2. setupMemoryTrails() needs: aiNodes, linkingSystem, personalityFX, weatherPack, worldEvents, legendaryPack
  3. setupColonyManager() needs: aiNodes, linkingSystem
  4. setupDreamDepthPack() needs: scene, camera, renderer

Safe to call in groups:
  - Tier 1 (no dependencies): setupWorldEvents, setupWeatherPack, setupCameraFX, setupPersonalityFX, setupWorldFXPack
  - Tier 2 (depends on Tier 1): setupAmbientEntities
  - Tier 3 (depends on Tier 2): setupMemoryTrails
  - Tier 4 (independent): setupQuantumIllusions, setupColonyManager, setupDreamDepthPack
```

#### Extraction Pattern
```javascript
// NEW FILE: /WorldFXSetup_v1.js

export function initializeWorldFX(game) {
    // Tier 1: Basic world effects (no dependencies)
    game.setupWorldEvents?.();
    game.setupWeatherPack?.();
    game.setupCameraFX?.();
    game.setupPersonalityFX?.();
    game.setupWorldFXPack?.();
    
    // Tier 2: Ambient entities (depends on Tier 1)
    game.setupAmbientEntities?.();
    
    // Tier 3: Memory trails (depends on more systems)
    game.setupMemoryTrails?.();
    
    // Tier 4: Independent ecosystem managers
    game.setupQuantumIllusions?.();
    game.setupColonyManager?.();
    game.setupDreamDepthPack?.();
}
```

#### Constructor Integration (main.js)
```javascript
// NEW: Add imports
import { initializeWorldFX } from './WorldFXSetup_v1.js';

// OLD: Scattered calls (10 lines)
this.setupWorldEvents();
this.setupWeatherPack();
// ... etc ...

// NEW: Single call
initializeWorldFX(this);
```

#### Line Count Impact
```
Removed from main.js:           102 lines
Added to main.js (imports):     +0 lines (already bundled)
Added to new file:              ~110 lines
NET main.js reduction:          ~102 lines
```

---

## 🔧 PHASE 2 EXECUTION SCRIPT

### Step 1: Create EnvironmentSetup_v1.js
```bash
# Create new file with template
touch EnvironmentSetup_v1.js

# Copy methods verbatim from main.js lines 854-1052
# Wrap in export function initializeEnvironments(game)
# Add import statements for THREE, CONFIG
```

### Step 2: Create GlyphSystemSetup_v1.js
```bash
# Create new file
touch GlyphSystemSetup_v1.js

# Copy methods in EXACT ORDER shown above
# Call as: game.setupMethodName?.()
# Add proper error handling for missing dependencies
```

### Step 3: Create WorldFXSetup_v1.js
```bash
# Create new file
touch WorldFXSetup_v1.js

# Copy methods in tier order shown above
# Maintain initialization flow
```

### Step 4: Update main.js imports
```javascript
// Line ~162
import { initializeEnvironments } from './EnvironmentSetup_v1.js';
import { initializeGlyphSystems } from './GlyphSystemSetup_v1.js';
import { initializeWorldFX } from './WorldFXSetup_v1.js';
```

### Step 5: Update constructor
```javascript
// In init() method, around line 843-850:

// BEFORE (198 lines of environment setup)
this.setupSigmaRiftEnvironment();
this.setupDreamDesertEnvironment();
// ... etc ...

// AFTER (1 line)
initializeEnvironments(this);

// Similar for glyph systems and world FX
```

---

## 🧪 PHASE 3 TESTING PROTOCOL

### Static Analysis
```javascript
// Linter checks
eslint main.js --no-fix
eslint EnvironmentSetup_v1.js --no-fix
eslint GlyphSystemSetup_v1.js --no-fix
eslint WorldFXSetup_v1.js --no-fix

// Should report: 0 errors
```

### Syntax Validation
```javascript
// Node.js module check
node --check main.js
node --check EnvironmentSetup_v1.js
node --check GlyphSystemSetup_v1.js
node --check WorldFXSetup_v1.js

// Should report: all modules valid
```

### Runtime Validation
```javascript
// Boot game and check:
console.log('main.js loaded?');
console.log('imports working?');
console.log('ATOMA initialized?');

// Expected:
// ✓ [v3.0] Legacy HUD DOM elements cleaned from page
// ✓ [main.js] NodeLinkingSystem created ✓
// ✓ Semantic Glyph AI 5.0 initialized
// ... (all systems)
```

---

## 📊 METRICS CALCULATION

### Before Extraction
```
wc -l main.js
# Expected: ~4500 lines

wc -l *.js | grep -v node_modules | tail -1
# Expected: Total main.js contribution
```

### After Extraction
```
wc -l main.js
# Expected: ~4050 lines

wc -l EnvironmentSetup_v1.js GlyphSystemSetup_v1.js WorldFXSetup_v1.js
# Expected: ~500 lines total

# Calculation:
# main.js reduction = 4500 - 4050 = 450 lines
# New files = 500 lines
# NET reduction = 450 - 3 (imports) = 447 lines ✅ (meets 400 target)
```

---

## ⚠️ COMMON MISTAKES TO AVOID

### ❌ Mistake 1: Altering extracted code
```javascript
// WRONG: Don't refactor while extracting
// OLD
setupSigmaRiftEnvironment() {
    const ambientLight = new THREE.AmbientLight(0x0d4d40, 0.1);
}

// WRONG REFACTORING
export function setupSigmaRift(game) {
    const intensity = 0.1;  // ← DON'T CHANGE
    const light = new THREE.AmbientLight(0x0d4d40, intensity);  // ← DON'T CHANGE
}

// RIGHT: Copy exactly as-is
export function initializeEnvironments(game) {
    setupSigmaRiftEnvironment(game.scene);  // Just call it
}

function setupSigmaRiftEnvironment(scene) {
    // Copied EXACTLY from main.js — no changes
    const ambientLight = new THREE.AmbientLight(0x0d4d40, 0.1);
    // ...
}
```

### ❌ Mistake 2: Breaking initialization order
```javascript
// WRONG: Glyph systems out of order
export function initializeGlyphSystems(game) {
    game.setupAINarrativePatterns?.();     // ← CALLED TOO EARLY
    game.setupSemanticGlyphAI?.();         // ← NEEDS TO BE FIRST
}

// RIGHT: Strict order maintained
export function initializeGlyphSystems(game) {
    game.setupSemanticGlyphAI?.();         // 1st
    game.setupGlyphFusionOverlay?.();      // 2nd
    game.setupAINarrativePatterns?.();     // Last
}
```

### ❌ Mistake 3: Missing imports in new files
```javascript
// WRONG: New file uses THREE without importing
export function initializeEnvironments(game) {
    const light = new THREE.AmbientLight(0x0d4d40, 0.1);  // THREE undefined!
}

// RIGHT: Import all dependencies
import * as THREE from 'three';
import { CONFIG } from './config.js';

export function initializeEnvironments(game) {
    const light = new THREE.AmbientLight(0x0d4d40, 0.1);  // ✅ THREE available
}
```

### ❌ Mistake 4: Not accounting for `this` context
```javascript
// WRONG: Trying to use this.scene
export function initializeEnvironments(game) {
    // 'this' context lost!
    this.scene.background = new THREE.Color(0x0a0a14);  // ❌ ERROR
}

// RIGHT: Pass game reference
export function initializeEnvironments(game) {
    // game has access to all this.* properties
    game.scene.background = new THREE.Color(0x0a0a14);  // ✅ WORKS
}
```

---

## 🔄 ROLLBACK PROCEDURE

If critical issues emerge during Phase 3:

```javascript
// 1. Restore main.js from backup
git checkout main.js

// 2. Remove new files
rm EnvironmentSetup_v1.js
rm GlyphSystemSetup_v1.js
rm WorldFXSetup_v1.js

// 3. Verify boot
npm start  // or equivalent

// 4. Check console
// Should see no errors, all systems initialized

// 5. Document issue
// Record in MAINJS_SLIMMING_PASS_V1_DIFF_OVERVIEW.md
```

---

## 📞 TROUBLESHOOTING QUICK REFERENCE

| Symptom | Cause | Solution |
|---------|-------|----------|
| "Module not found" | Import path wrong | Check file name matches import |
| "Cannot read property X" | Missing dependency | Verify initialization order |
| Blank screen | Scene not created | Check game.scene exists |
| Methods not initializing | Order dependency broken | Review glyph system order |
| Performance drop | Regression (unlikely) | Check frame rate with profiler |
| Console errors on boot | Syntax error in new file | Run `node --check` |

---

**Document Version:** 1.0  
**Created:** Session 36  
**Updated:** Session 36  
**Status:** Ready for Phase 2 ✅

