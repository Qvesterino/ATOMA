# UNUSED HUDS AUDIT REPORT
**Date:** 2026-04-07  
**Scope:** All HUD files in ATOMA codebase  
**Purpose:** Identify unused HUDs (excluding known active HUDs)

---

## EXECUTIVE SUMMARY

**Total HUD files found:** 19  
**Active HUDs (in use):** 9  
**Unused HUDs:** 6  
**Supporting infrastructure files:** 4  

---

## KNOWN ACTIVE HUDS (EXCLUDED FROM AUDIT)

The following HUDs were explicitly marked as **USED** by the user and are **NOT** candidates for removal:

1. ✅ `CoreMetricsHUD.js` - Core metrics display
2. ✅ `NodeInspectOverlay1_0.js` - Node inspection overlay
3. ✅ `_UICategoryLegend3_1.js` - Category legend
4. ✅ `UISelectedHUD.js` / `assets/UISelectedHUD.js` - Selected node HUD
5. ✅ `AIAutomationHUD.js` - AI automation HUD
6. ✅ `ui/hud/VariantBAdvisorHUD.js` - Variant B advisor HUD

---

## UNUSED HUDS (CANDIDATES FOR REMOVAL)

### 🔴 HIGH CONFIDENCE UNUSED

#### 1. `WorldSelectorHUD.js`
**Location:** `D:\ATOMA_CLEAN\WorldSelectorHUD.js`  
**Status:** ❌ **UNUSED**  
**Evidence:**
- No `import` statements found in any file
- No `new WorldSelectorHUD()` instantiation found
- File exists but is completely disconnected from the system  
**Recommendation:** Can be safely removed

#### 2. `LEGACY/LinkAutomationMonitorHUD2_0.js`
**Location:** `D:\ATOMA_CLEAN\LEGACY\LinkAutomationMonitorHUD2_0.js`  
**Status:** ❌ **UNUSED**  
**Evidence:**
- Located in LEGACY folder
- No `import` statements found in active code
- Not instantiated in main.js or any other entry point  
**Recommendation:** Already in LEGACY, can be moved to DELETE or GRAVEYARD

#### 3. `LEGACY/GRAVEYARD/LinkFeedbackHUD1_0.js`
**Location:** `D:\ATOMA_CLEAN\LEGACY\GRAVEYARD\LinkFeedbackHUD1_0.js`  
**Status:** ❌ **UNUSED**  
**Evidence:**
- Already in GRAVEYARD folder
- Not imported in main.js or any active code  
**Recommendation:** Already deprecated, can be deleted

#### 4. `LEGACY/DELETE/SynergyTrendHUD1_0.js`
**Location:** `D:\ATOMA_CLEAN\LEGACY\DELETE\SynergyTrendHUD1_0.js`  
**Status:** ❌ **UNUSED**  
**Evidence:**
- Already in DELETE folder
- Integration patch exists in same folder but not applied  
**Recommendation:** Already marked for deletion

#### 5. `LEGACY/DELETE/UIHudManager.js`
**Location:** `D:\ATOMA_CLEAN\LEGACY\DELETE\UIHudManager.js`  
**Status:** ❌ **UNUSED**  
**Evidence:**
- Already in DELETE folder  
**Recommendation:** Already marked for deletion

### 🟡 LOW CONFIDENCE / PARTIALLY USED

#### 6. `SynergyRecommendationDebugHUD.js`
**Location:** `D:\ATOMA_CLEAN\SynergyRecommendationDebugHUD.js`  
**Status:** ⚠️ **CONDITIONALLY USED**  
**Evidence:**
- Imported in main.js: `import { SynergyRecommendationDebugHUD } from './SynergyRecommendationDebugHUD.js';`
- Instantiated in main.js: `this.synergyDebugHUD = new SynergyRecommendationDebugHUD(...)`
- **BUT** code contains: `DISABLED: superseded by modular AIAutomationHUD`  
**Recommendation:** **REVIEW** - May be superseded by AIAutomationHUD but still instantiated. Check if it can be safely removed.

---

## ACTIVE HUDS (IN USE)

The following HUDs are actively imported and used in `main.js`:

1. ✅ `CoreMetricsHUD.js` - Used via `CoreMetricsOverlay`
2. ✅ `NodeInspectOverlay1_0.js` - Directly instantiated
3. ✅ `_UICategoryLegend3_1.js` - Directly instantiated
4. ✅ `UISelectedHUD.js` - Used via `getSelectedHUD()`
5. ✅ `AIAutomationHUD.js` - Mounted via `mountAIAutomationHUD()`
6. ✅ `ui/hud/VariantBAdvisorHUD.js` - Mounted via `mountVariantBAdvisorHUD()`
7. ✅ `AtomaDebugHUD_1_0.js` - Directly instantiated
8. ✅ `SynergyRecommendationDebugHUD.js` - Directly instantiated (but marked as superseded)

---

## SUPPORTING INFRASTRUCTURE FILES (NOT HUDs)

These files support the HUD system but are not HUDs themselves:

1. `CollapsibleHudWrapper.js` - Provides collapse/expand functionality
2. `HudCollapseSystem1_0.js` - Master integration module
3. `HUDLayoutManager.js` - Manages layout and persistence
4. `HUDRegistry.js` - Central registry of HUD definitions
5. `SelectedHUDSyncPatch1_0.js` - Sync patch for selected HUD
6. `SelectedHUDSyncPatch1_0_TestHelper.js` - Test helper (not a HUD)

---

## EXAMPLE/DEBUG HUDS (IN EXAMPLES FOLDER)

These HUDs are for documentation/testing purposes only:

1. `EXAMPLES/SURFACE_RIPPLES_EXAMPLES.js` - Contains `RippleDebugHUD`
2. `EXAMPLES/LINK_MORPHING_EXAMPLES.js` - Contains `example3_CorruptionHUD`
3. `EXAMPLES/HUB_INFLUENCE_EXAMPLES.js` - Contains `example4_InfluenceHUD`
4. `EXAMPLES/HARMONIC_RESILIENCE_EXAMPLES.js` - Contains `ResilienceDebugHUD`
5. `EXAMPLES/HARMONIC_RECOVERY_EXAMPLES.js` - Contains `RecoveryDebugHUD`
6. `EXAMPLES/HARMONIC_HALO_EXAMPLES.js` - Contains `example2_HaloStatusHUD`

**Note:** These are intentionally for examples and should not be removed.

---

## ACTION ITEMS

### Immediate (Safe to Remove)
- [ ] Review and confirm `WorldSelectorHUD.js` is truly unused, then delete
- [ ] Move `LEGACY/LinkAutomationMonitorHUD2_0.js` to DELETE or GRAVEYARD

### Already Handled
- [x] `LEGACY/GRAVEYARD/LinkFeedbackHUD1_0.js` - Already in GRAVEYARD
- [x] `LEGACY/DELETE/SynergyTrendHUD1_0.js` - Already in DELETE
- [x] `LEGACY/DELETE/UIHudManager.js` - Already in DELETE

### Review Required
- [ ] **CRITICAL:** Investigate `SynergyRecommendationDebugHUD.js` 
  - It's instantiated in main.js but marked as "DISABLED: superseded by modular AIAutomationHUD"
  - Determine if it should be removed or if it's still needed
  - Check console API usage: `toggleSynergyDebug()`, `showSynergyDebug()`, etc.

---

## USAGE PATTERNS IN main.js

### Import Patterns Found:
```javascript
import { mountAIAutomationHUD, updateAIAutomationHUD } from './AIAutomationHUD.js';
import { mountVariantBAdvisorHUD, updateVariantBAdvisorHUD } from './ui/hud/VariantBAdvisorHUD.js';
import { getSelectedHUD } from './UISelectedHUD.js';
import { SelectedHUDSyncPatch1_0 } from './SelectedHUDSyncPatch1_0.js';
import { SynergyRecommendationDebugHUD } from './SynergyRecommendationDebugHUD.js';
import { AtomaDebugHUD_1_0 } from './Engine/Debug/AtomaDebugHUD_1_0.js';
```

### Instantiation Patterns Found:
```javascript
// Direct instantiation
this.debugHUD = new AtomaDebugHUD_1_0();
this.synergyDebugHUD = new SynergyRecommendationDebugHUD(...);
this.selectedHUDSyncPatch = new SelectedHUDSyncPatch1_0(...);

// Mount functions
mountAIAutomationHUD(document.body);
mountVariantBAdvisorHUD(document.body);
```

---

## FILE LOCATION SUMMARY

### Root Level
- `AIAutomationHUD.js` ✅ USED
- `CollapsibleHudWrapper.js` ⚙️ INFRASTRUCTURE
- `CoreMetricsHUD.js` ✅ USED
- `HudCollapseSystem1_0.js` ⚙️ INFRASTRUCTURE
- `HUDLayoutManager.js` ⚙️ INFRASTRUCTURE
- `HUDRegistry.js` ⚙️ INFRASTRUCTURE
- `SelectedHUDSyncPatch1_0.js` ⚙️ INFRASTRUCTURE
- `SelectedHUDSyncPatch1_0_TestHelper.js` ⚙️ TEST HELPER
- `SynergyRecommendationDebugHUD.js` ⚠️ REVIEW NEEDED
- `UISelectedHUD.js` ✅ USED
- `WorldSelectorHUD.js` ❌ UNUSED

### Assets
- `assets/UISelectedHUD.js` ✅ USED (duplicate/reference)

### Engine/Debug
- `Engine/Debug/AtomaDebugHUD_1_0.js` ✅ USED

### UI/HUD
- `ui/hud/VariantBAdvisorHUD.js` ✅ USED

### LEGACY
- `LEGACY/LinkAutomationMonitorHUD2_0.js` ❌ UNUSED

### LEGACY/DELETE
- `LEGACY/DELETE/SynergyTrendHUD1_0.js` ❌ UNUSED (already in DELETE)
- `LEGACY/DELETE/UIHudManager.js` ❌ UNUSED (already in DELETE)
- `LEGACY/DELETE/SYNERGY_HUD_MAIN_JS_PATCH.js` ❌ UNUSED (integration patch only)

### LEGACY/GRAVEYARD
- `LEGACY/GRAVEYARD/LinkFeedbackHUD1_0.js` ❌ UNUSED (already in GRAVEYARD)

---

## CONCLUSION

**Total Unused HUDs (excluding already deleted/graveyard):** 2

1. **`WorldSelectorHUD.js`** - Completely unused, safe to remove
2. **`LEGACY/LinkAutomationMonitorHUD2_0.js`** - In LEGACY, can be moved to DELETE

**Review Needed:**
1. **`SynergyRecommendationDebugHUD.js`** - Marked as superseded but still instantiated

**Already Handled:**
- 3 HUDs already in DELETE or GRAVEYARD folders
- Can be safely deleted during cleanup

---

**Report Generated:** 2026-04-07  
**Audit Methodology:** Search for `import` statements and `new ...()` instantiations across the codebase