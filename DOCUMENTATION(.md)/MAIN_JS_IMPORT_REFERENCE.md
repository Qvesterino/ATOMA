# main.js — Import Reference for Network Dashboard v1.0

**Purpose:** Guide for adding dashboard imports to main.js  
**Lines to Add:** 3 imports  
**Location:** After existing engine imports (approximately line 83–100)

---

## Where to Add Imports

In **main.js**, find this section (around line 83–100):

```javascript
// ============================================================================
// SYNERGY ANALYSIS & SCORING SYSTEM (Session 19 Extended)
// ============================================================================
import { computeSynergyScore } from './ComputeSynergyScore2_0.js';
import { LinkRecommendationAI1_0 } from './LinkRecommendationAI1_0.js';
import { LinkAutomationEngine1_0 } from './LinkAutomationEngine1_0.js';

// ============================================================================
// AUTO LINK VISUALIZATION FEEDBACK UI 1.0 (Session 19 Extended)
// ============================================================================
import { AutoLinkFeedbackUI1_0 } from './AutoLinkFeedbackUI1_0.js';
```

**After the AUTO LINK section, add this:**

```javascript
// ============================================================================
// NETWORK VISUALIZATION & DIAGNOSTICS 1.0 (Session 24)
// ============================================================================
import { dashboard as networkDashboard } from './NetworkVisualizationDashboard1_0.js';
import EngineHealthDiagnostics1_0 from './EngineHealthDiagnostics1_0.js';
import { 
  createToggleInput, 
  createControlledInput,
  createSelectInput,
  createNumericInput,
  UIControlledStateFixAPI
} from './UIControlledStateFix_1_0.js';
```

---

## Complete Import Block

Here's the complete section with context:

```javascript
// ============================================================================
// AUTO LINK VISUALIZATION FEEDBACK UI 1.0 (Session 19 Extended)
// ============================================================================
import { AutoLinkFeedbackUI1_0 } from './AutoLinkFeedbackUI1_0.js';

// ============================================================================
// LINK QUALITY PREDICTOR 1.0 (Session 19 Extended)
// ============================================================================
import { LinkQualityPredictor1_0 } from './LinkQualityPredictor1_0.js';

// ============================================================================
// SYNERGY RECOMMENDATION DEBUG HUD 1.0 (Session 19 Extended)
// ============================================================================
import { SynergyRecommendationDebugHUD } from './SynergyRecommendationDebugHUD.js';

// ============================================================================
// NETWORK VISUALIZATION & DIAGNOSTICS 1.0 (Session 24)
// ============================================================================
import { dashboard as networkDashboard } from './NetworkVisualizationDashboard1_0.js';
import EngineHealthDiagnostics1_0 from './EngineHealthDiagnostics1_0.js';
import { 
  createToggleInput, 
  createControlledInput,
  createSelectInput,
  createNumericInput,
  UIControlledStateFixAPI
} from './UIControlledStateFix_1_0.js';

// ============================================================================
// ATOMA UI 3.1 - DISABLED (Replaced by 3.4–3.7)
// ============================================================================
```

---

## What Each Import Provides

### NetworkVisualizationDashboard1_0

```javascript
import { dashboard as networkDashboard } from './NetworkVisualizationDashboard1_0.js';

// Provides:
// - window.networkDashboard — main API object
// - Auto-initializes on import
// - Auto-spawns canvas in top-right corner

// Usage:
window.networkDashboard.show()
window.networkDashboard.emit('nodeActivated', {...})
window.networkDashboard.getMetrics()
```

### EngineHealthDiagnostics1_0

```javascript
import EngineHealthDiagnostics1_0 from './EngineHealthDiagnostics1_0.js';

// Provides:
// - window.engineDiagnostics — diagnostics API
// - Auto-initializes on import

// Usage:
window.engineDiagnostics.quickHealth()
window.engineDiagnostics.printFullSystemReport()
window.engineDiagnostics.getHealthScore()
```

### UIControlledStateFix_1_0

```javascript
import { 
  createToggleInput, 
  createControlledInput,
  createSelectInput,
  createNumericInput,
  UIControlledStateFixAPI
} from './UIControlledStateFix_1_0.js';

// Provides:
// - Controlled input helpers (functions)
// - window.UIControlledStateFixAPI — console diagnostics
// - Auto-initializes on import

// Usage in React components:
const [visible, setVisible] = createToggleInput(false);
const [text, setText] = createControlledInput('default');

// Console diagnostics:
window.UIControlledStateFixAPI.runTests()
```

---

## Complete After-Import Initialization

After adding imports, the modules **auto-initialize**. You can verify in console immediately:

```javascript
// In browser console (after page loads)

// Check all three systems are ready
console.log('Dashboard:', window.networkDashboard._initialized);
console.log('Diagnostics:', window.engineDiagnostics);
console.log('React fixes:', window.UIControlledStateFixAPI);

// Show dashboard
window.networkDashboard.show();

// Quick health check
window.engineDiagnostics.quickHealth();

// Test React helpers
window.UIControlledStateFixAPI.runTests();
```

---

## Optional: Initialization in AtomaGame Constructor

After imports are added, you can optionally add initialization code in the **AtomaGame** constructor (around line 171–250):

```javascript
class AtomaGame {
  constructor() {
    // ... existing code ...
    
    // ================================
    // Initialize Network Monitoring
    // ================================
    console.log('[AtomaGame] Network dashboard systems initialized');
    console.log('  ✅ NetworkVisualizationDashboard1_0 ready');
    console.log('  ✅ EngineHealthDiagnostics1_0 ready');
    console.log('  ✅ UIControlledStateFix1_0 ready');
    
    // Show dashboard on startup (optional)
    window.networkDashboard.show();
    
    // Log initial health
    const health = window.engineDiagnostics.getHealthScore();
    console.log(`[AtomaGame] Engine health: ${health}/100`);
  }
```

---

## Full Context: Where This Goes in main.js

Here's the complete structure of imports (showing before/after):

```javascript
// ============================================================================
// IMPORTS AT TOP OF main.js (lines 1–85)
// ============================================================================
import * as THREE from 'three';
import { PlayerController, FirstPersonCameraController } from './rosie/controls/rosieControls.js';
import { World } from './World.js';
// ... [existing 80+ imports] ...

// ============================================================================
// SYNERGY ANALYSIS & SCORING SYSTEM (Session 19 Extended)
// ============================================================================
import { computeSynergyScore } from './ComputeSynergyScore2_0.js';
import { LinkRecommendationAI1_0 } from './LinkRecommendationAI1_0.js';
import { LinkAutomationEngine1_0 } from './LinkAutomationEngine1_0.js';

// ============================================================================
// AUTO LINK VISUALIZATION FEEDBACK UI 1.0 (Session 19 Extended)
// ============================================================================
import { AutoLinkFeedbackUI1_0 } from './AutoLinkFeedbackUI1_0.js';

// ============================================================================
// LINK QUALITY PREDICTOR 1.0 (Session 19 Extended)
// ============================================================================
import { LinkQualityPredictor1_0 } from './LinkQualityPredictor1_0.js';

// ============================================================================
// SYNERGY RECOMMENDATION DEBUG HUD 1.0 (Session 19 Extended)
// ============================================================================
import { SynergyRecommendationDebugHUD } from './SynergyRecommendationDebugHUD.js';

// ============================================================================
// ✨ NEW: NETWORK VISUALIZATION & DIAGNOSTICS 1.0 (Session 24)
// ============================================================================
import { dashboard as networkDashboard } from './NetworkVisualizationDashboard1_0.js';
import EngineHealthDiagnostics1_0 from './EngineHealthDiagnostics1_0.js';
import { 
  createToggleInput, 
  createControlledInput,
  createSelectInput,
  createNumericInput,
  UIControlledStateFixAPI
} from './UIControlledStateFix_1_0.js';

// ============================================================================
// ATOMA UI 3.1 - DISABLED (Replaced by 3.4–3.7)
// ============================================================================
import { UICategoryLegend3_1 } from './_UICategoryLegend3_1.js';
// ... [rest of existing imports] ...
```

---

## Copy-Paste Ready

**Just copy this entire block and paste after the "SYNERGY RECOMMENDATION DEBUG HUD" section:**

```javascript
// ============================================================================
// NETWORK VISUALIZATION & DIAGNOSTICS 1.0 (Session 24)
// ============================================================================
import { dashboard as networkDashboard } from './NetworkVisualizationDashboard1_0.js';
import EngineHealthDiagnostics1_0 from './EngineHealthDiagnostics1_0.js';
import { 
  createToggleInput, 
  createControlledInput,
  createSelectInput,
  createNumericInput,
  UIControlledStateFixAPI
} from './UIControlledStateFix_1_0.js';
```

---

## Verification After Adding Imports

Run this in browser console:

```javascript
// 1. Check all three modules loaded
console.assert(window.networkDashboard, '❌ Dashboard missing');
console.assert(window.engineDiagnostics, '❌ Diagnostics missing');
console.assert(window.UIControlledStateFixAPI, '❌ React fix missing');

// 2. Quick health check
window.engineDiagnostics.quickHealth()

// 3. Show dashboard
window.networkDashboard.show()

// 4. Test React helpers
window.UIControlledStateFixAPI.runTests()

console.log('✅ All systems loaded and ready!');
```

---

## Troubleshooting Import Issues

### Error: "Cannot find module"

**Cause:** File not in project directory  
**Solution:** Ensure these 3 files exist in root:
- `/NetworkVisualizationDashboard1_0.js`
- `/EngineHealthDiagnostics1_0.js`
- `/UIControlledStateFix_1_0.js`

### Error: "dashboard is not exported"

**Cause:** Wrong import name  
**Solution:** Use exactly:
```javascript
import { dashboard as networkDashboard } from './NetworkVisualizationDashboard1_0.js';
// NOT: import { NetworkVisualizationDashboard1_0 } ...
```

### window.networkDashboard undefined

**Cause:** Import added but not reached yet  
**Solution:** Check console after page fully loads (not in DevTools immediately on refresh)

### React warnings still appearing

**Cause:** Not importing the fix  
**Solution:** Ensure this import is present:
```javascript
import { 
  createToggleInput, 
  // ... other helpers
} from './UIControlledStateFix_1_0.js';
```

---

## Related Files

- **Integration Guide:** `/NETWORK_DASHBOARD_INTEGRATION.md`
- **Quick Start:** `/NETWORK_DASHBOARD_QUICKSTART.md`
- **Patch Locations:** `/NETWORK_DASHBOARD_INTEGRATION_PATCHES.md`
- **Summary:** `/NETWORK_DASHBOARD_SUMMARY.md`

---

**Status:** Ready to integrate  
**Complexity:** 🟢 Very Easy (just copy-paste imports)  
**Time:** 1 minute  
**Risk:** None (additive only, no changes to existing imports)
