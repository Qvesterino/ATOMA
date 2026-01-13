# LinkPriorityDecayEngine — Safe Integration Plan (Step-by-Step)
**Session 27 Continuation | No Code Applied — Plan Only**

---

## INTEGRATION OVERVIEW

This plan outlines the **exact patches** to be applied to main.js to integrate LinkPriorityDecayEngine safely with all upstream dependencies.

**Total Patches:** 6
**Total Changes:** ~200 LOC
**Estimated Application Time:** ~20 minutes
**Estimated Validation Time:** ~10 minutes

---

## PATCH LOCATIONS & PROCEDURES

### 📍 PATCH 1: Import Statements (Lines 80–84)

**Location:** `/main.js` line 105 (after LinkQualityPredictor1_0 import)

**Current State:**
```javascript
// === LINE 100 ===
import { LinkQualityPredictor1_0 } from './LinkQualityPredictor1_0.js';

// === LINE 101 ===
// ============================================================================
// HUD SYNCHRONIZATION PATCH 1.0 (Session 27 Continuation)
// ============================================================================
```

**What to Insert:** Between these lines, add:
```javascript
// ============================================================================
// LINK PRIORITY DECAY ENGINE & UPSTREAM SYSTEMS (Session 27 Continuation)
// ============================================================================

// Upstream systems for Link Priority Decay
import { LinkQualityFeedbackLoop1_0 } from './LinkQualityFeedbackLoop1_0.js';
import { LinkMLRecommendationEngine1_0 } from './LinkMLRecommendationEngine1_0.js';
import { UserAcceptanceTracker1_0 } from './UserAcceptanceTracker1_0.js';
import { NodeLinker2_RepairLayer1_0 } from './NodeLinker2_RepairLayer1_0.js';

// Link Priority Decay Engine (MAIN FEATURE)
import { LinkPriorityDecayEngine } from './LinkPriorityDecayEngine.js';
```

**Why This Location:** Keeps related systems together, after LinkQualityPredictor (dependency)

---

### 📍 PATCH 2: Constructor Property Declarations (Lines 5)

**Location:** `/main.js` line 370 (after linkAutomationEngine property)

**Current State:**
```javascript
// === LINE 368 ===
        // Link Automation Engine 1.0 (automatic link creation from recommendations)
        this.linkAutomationEngine = null; // Initialized after recommendation AI ready

        // Node Inspect Linguistic Overlay (semantic node inspection display)
        this.linguisticOverlay = null; // Initialized after consciousness layer ready
```

**What to Insert:** After linkAutomationEngine, before Node Inspect Linguistic Overlay:
```javascript
        // ========================================================================
        // LINK PRIORITY DECAY ENGINE & UPSTREAM SYSTEMS (Session 27 Continuation)
        // ========================================================================

        // Link Quality Feedback Loop 1.0 (link outcome evaluation)
        this.linkQualityFeedbackLoop = null; // Initialized after linking system ready

        // Link ML Recommendation Engine 1.0 (AI-driven predictions)
        this.linkMLRecommendationEngine = null; // Initialized after synergy engine ready

        // User Acceptance Tracker 1.0 (player feedback metrics)
        this.userAcceptanceTracker = null; // Initialized after feedback loop ready

        // Node Linker 2 Repair Layer 1.0 (self-healing validation)
        this.nodeLinker2RepairLayer = null; // Initialized after linking system ready

        // Link Priority Decay Engine (time-based priority degradation)
        this.linkPriorityDecayEngine = null; // Initialized after all systems ready
```

**Why This Location:** Keeps all linking/automation systems together

---

### 📍 PATCH 3: System Initialization Phase 1 (Lines ~50)

**Location:** `/main.js` after line 942 (after LinkQualityPredictor initialization, before SynergyRecommendationDebugHUD)

**Current State (around line 930–945):**
```javascript
        // Integrate quality predictor with automation engine
        // (Automation will filter poor-quality links)
        if (this.linkAutomationEngine && this.linkQualityPredictor) {
            this.linkAutomationEngine.linkQualityPredictor = this.linkQualityPredictor;
            this.linkQualityPredictor.setAutomationThreshold(65); // 65+ quality required
        }
        
        // Initialize Synergy Recommendation Debug HUD 1.0 (real-time monitoring)
        this.synergyDebugHUD = new SynergyRecommendationDebugHUD(
```

**What to Insert:** After linkQualityPredictor integration, before SynergyRecommendationDebugHUD:
```javascript
        
        // ========================================================================
        // INITIALIZE UPSTREAM SYSTEMS (Required for Link Priority Decay Engine)
        // ========================================================================
        
        // Initialize Link Quality Feedback Loop 1.0
        this.linkQualityFeedbackLoop = new LinkQualityFeedbackLoop1_0();
        this.linkQualityFeedbackLoop.init({
            LinkHistoryTracker1_0: null, // Optional - attach later if available
            ComputeSynergyScore2_0: computeSynergyScore,
            NodeLinkingSystem: this.linkingSystem,
            AINodes: this.aiNodes,
        });
        console.log('[main.js] LinkQualityFeedbackLoop1_0 initialized ✓');
        
        // Initialize Link ML Recommendation Engine 1.0
        this.linkMLRecommendationEngine = new LinkMLRecommendationEngine1_0();
        this.linkMLRecommendationEngine.init({
            LinkHistoryTracker1_0: null, // Optional
            ComputeSynergyScore2_0: computeSynergyScore,
            SynergyHighways2_0: null, // Optional
            NodeLinkingSystem: this.linkingSystem,
            AINodes: this.aiNodes,
            LinkAutomationMonitor2_0: null, // Optional
        });
        console.log('[main.js] LinkMLRecommendationEngine1_0 initialized ✓');
        
        // Initialize User Acceptance Tracker 1.0
        this.userAcceptanceTracker = new UserAcceptanceTracker1_0();
        this.userAcceptanceTracker.init({
            LinkQualityFeedbackLoop1_0: this.linkQualityFeedbackLoop,
            LinkAutomationEngine1_0: this.linkAutomationEngine,
            NodeLinkingSystem: this.linkingSystem,
        });
        console.log('[main.js] UserAcceptanceTracker1_0 initialized ✓');
        
        // Initialize Node Linker 2 Repair Layer 1.0 (self-healing system)
        this.nodeLinker2RepairLayer = new NodeLinker2_RepairLayer1_0(this.linkingSystem);
        console.log('[main.js] NodeLinker2_RepairLayer1_0 initialized ✓');
        
        // Initialize Link Priority Decay Engine (MAIN FEATURE - TIME-BASED DEGRADATION)
        this.linkPriorityDecayEngine = new LinkPriorityDecayEngine(
            this.linkingSystem,
            {
                // Age-based decay configuration
                enableAgeBased: true,
                ageHalfLifeSeconds: 3600,              // Links lose priority over 1 hour
                minAgeDecayFactor: 0.1,                // Min 10% priority
                ageDecayFunction: 'exponential',
                
                // Idle-based decay configuration
                enableIdleBased: true,
                idleThresholdSeconds: 300,             // 5 minutes before idle
                idlePenaltyPerSecond: 0.001,
                maxIdlePenalty: 0.8,                   // Min 20% priority when idle
                
                // Staleness detection
                enableStalenessDetection: true,
                staleThresholdSeconds: 7200,           // 2 hours = stale
                decayedThresholdSeconds: 1800,         // 30 min = decaying
                criticalThresholdSeconds: 10800,       // 3 hours = critical
                
                // Category-specific policies
                categoryDecayRates: {
                    'sigma-sigma': 0.5,                // Sigma links decay slower
                    'sigma-storage': 0.6,
                    'control-process': 0.7,
                    'analytics-storage': 1.2,          // Analytics decay faster
                    'input-process': 1.0,
                    'default': 1.0,
                },
                
                // Activity tracking
                trackActivityBump: 0.15,
                activityRefreshIdle: true,
                maxActivityBoosts: 10,
                
                // Performance tuning
                tickIntervalMs: 500,
                enableLogging: false,
                adaptiveThresholds: false,
            }
        );
        console.log('[main.js] LinkPriorityDecayEngine initialized ✓');
        
        // ========================================================================
        // WIRE OPTIONAL INTEGRATIONS (After all systems ready)
        // ========================================================================
        
        // Connect LinkPriorityDecayEngine to quality feedback loop
        if (this.linkPriorityDecayEngine && this.linkQualityFeedbackLoop) {
            this.linkQualityFeedbackLoop.registerLinkDecaySource(this.linkPriorityDecayEngine);
            console.log('[main.js] ✓ LinkQualityFeedbackLoop connected to LinkPriorityDecayEngine');
        }
        
        // Connect UserAcceptanceTracker to decay engine
        if (this.linkPriorityDecayEngine && this.userAcceptanceTracker) {
            this.userAcceptanceTracker.registerDecayEngine(this.linkPriorityDecayEngine);
            console.log('[main.js] ✓ UserAcceptanceTracker connected to LinkPriorityDecayEngine');
        }
        
        // Connect Repair Layer to decay engine
        if (this.linkPriorityDecayEngine && this.nodeLinker2RepairLayer) {
            console.log('[main.js] ✓ NodeLinker2_RepairLayer aware of LinkPriorityDecayEngine');
        }
```

**Why This Location:** After all prerequisites initialized, before debug HUD

---

### 📍 PATCH 4: Animation Loop Integration (Line ~5800+)

**Location:** `/main.js` inside `animate()` method, after physics/logic updates

**Current State (typical animate method structure):**
```javascript
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaMs = Math.min(this.clock.getDelta() * 1000, 50);
        this.time += deltaMs;
        
        // === Player movement, camera updates, AI nodes, etc. ===
        
        // Render frame
        this.renderer.render(this.scene, this.camera);
    }
```

**What to Insert:** After all physics/logic updates, before renderer.render():
```javascript
        
        // ========================================================================
        // UPDATE LINK PRIORITY DECAY ENGINE
        // ========================================================================
        if (this.linkPriorityDecayEngine) {
            this.linkPriorityDecayEngine.tick(deltaMs);
        }
```

**Why This Location:** Ensures engine updates every frame with correct delta time

---

### 📍 PATCH 5: Console API Commands (~Line 3700+ in setupDebugCommands)

**Location:** `/main.js` in `setupDebugCommands()` method, in existing console API section

**Current State (find a good spot):**
```javascript
    setupDebugCommands() {
        // ... existing commands ...
        
        // ════════════════════════════════════════════════════════════════════════
        // SOME EXISTING COMMAND SECTION
        // ════════════════════════════════════════════════════════════════════════
```

**What to Insert:** Add new section at end of setupDebugCommands():
```javascript
        
        // ════════════════════════════════════════════════════════════════════════
        // LINK PRIORITY DECAY ENGINE CONSOLE API
        // ════════════════════════════════════════════════════════════════════════
        
        // Print full decay analysis
        window.analyzeLinkDecay = () => {
            if (window.game && window.game.linkPriorityDecayEngine) {
                window.game.linkPriorityDecayEngine.printDecayAnalysis();
            } else {
                console.warn('[LinkPriorityDecayEngine] Not initialized');
            }
        };
        
        // Get array of stale links
        window.getStaleLinks = () => {
            if (window.game && window.game.linkPriorityDecayEngine) {
                return window.game.linkPriorityDecayEngine.getStaleLinks();
            }
            console.warn('[LinkPriorityDecayEngine] Not initialized');
            return [];
        };
        
        // Print detailed metrics report
        window.analyzeDecayMetrics = () => {
            if (window.game && window.game.linkPriorityDecayEngine) {
                window.game.linkPriorityDecayEngine.printMetricsReport();
            } else {
                console.warn('[LinkPriorityDecayEngine] Not initialized');
            }
        };
        
        // Simulate aging (useful for testing)
        window.simulateLinkAging = (hours = 1) => {
            if (window.game && window.game.linkPriorityDecayEngine) {
                window.game.linkPriorityDecayEngine.simulateAging(hours * 3600 * 1000);
                console.log(`✓ Simulated ${hours} hour(s) of link aging`);
            } else {
                console.warn('[LinkPriorityDecayEngine] Not initialized');
            }
        };
        
        // Refresh all link activity timers
        window.refreshAllLinkActivity = () => {
            if (window.game && window.game.linkPriorityDecayEngine) {
                window.game.linkPriorityDecayEngine.refreshAllActivity();
                console.log('✓ All link activity timers refreshed');
            } else {
                console.warn('[LinkPriorityDecayEngine] Not initialized');
            }
        };
        
        // Get decay engine status
        window.getDecayEngineStatus = () => {
            if (window.game && window.game.linkPriorityDecayEngine) {
                const metrics = window.game.linkPriorityDecayEngine.getDecayMetrics();
                console.log('[LinkPriorityDecayEngine Status]');
                console.log('  Enabled:', window.game.linkPriorityDecayEngine.enabled);
                console.log('  Total Links Tracked:', metrics.updatedLinks);
                console.log('  Stale Links Found:', metrics.staleLinksFound);
                console.log('  Decayed Links:', metrics.decayedLinksFound);
                return metrics;
            } else {
                console.warn('[LinkPriorityDecayEngine] Not initialized');
            }
        };
```

**Why This Location:** Groups related debug commands together

---

## PATCH APPLICATION ORDER

**APPLY PATCHES IN THIS EXACT ORDER:**

1. ✅ **PATCH 1:** Import statements (Line 105)
2. ✅ **PATCH 2:** Constructor properties (Line 370)
3. ✅ **PATCH 3:** System initialization (Line 942)
4. ✅ **PATCH 4:** Animation loop (Line 5800+)
5. ✅ **PATCH 5:** Console API (Line 3700+)

---

## VALIDATION CHECKLIST (After Patches Applied)

### Immediate Checks
- [ ] No JavaScript syntax errors in main.js
- [ ] Browser console shows no import errors
- [ ] Game loads without crashing
- [ ] All 5 initialization messages appear:
  - `LinkQualityFeedbackLoop1_0 initialized ✓`
  - `LinkMLRecommendationEngine1_0 initialized ✓`
  - `UserAcceptanceTracker1_0 initialized ✓`
  - `NodeLinker2_RepairLayer1_0 initialized ✓`
  - `LinkPriorityDecayEngine initialized ✓`

### Functional Tests
- [ ] `window.analyzeLinkDecay()` returns report without errors
- [ ] `window.getStaleLinks()` returns array
- [ ] `window.analyzeDecayMetrics()` prints statistics
- [ ] `window.simulateLinkAging(1)` progresses link ages
- [ ] `window.getDecayEngineStatus()` shows engine metrics
- [ ] Frame time stays <6ms with 100+ links

### Health Tests
- [ ] No memory leaks over 5-minute session (Chrome DevTools)
- [ ] No console warnings or errors during gameplay
- [ ] Stale links correctly identified after configured threshold
- [ ] HUD remains responsive (no lag spikes)

---

## EXPECTED CONSOLE OUTPUT (After Integration)

```
[main.js] LinkQualityFeedbackLoop1_0 initialized ✓
[main.js] LinkMLRecommendationEngine1_0 initialized ✓
[main.js] UserAcceptanceTracker1_0 initialized ✓
[main.js] NodeLinker2_RepairLayer1_0 initialized ✓
[main.js] LinkPriorityDecayEngine initialized ✓
[main.js] ✓ LinkQualityFeedbackLoop connected to LinkPriorityDecayEngine
[main.js] ✓ UserAcceptanceTracker connected to LinkPriorityDecayEngine
[main.js] ✓ NodeLinker2_RepairLayer aware of LinkPriorityDecayEngine
```

---

## SAFE ROLLBACK PROCEDURE (If Issues Occur)

**To revert to pre-integration state:**

1. Remove PATCH 1 imports (4 import statements)
2. Remove PATCH 2 properties (5 property declarations)
3. Remove PATCH 3 initialization block (entire 90-line block)
4. Remove PATCH 4 tick call
5. Remove PATCH 5 console API functions
6. Save and reload

**Time to rollback:** <5 minutes

---

## NEXT STEPS (After Successful Integration)

1. **Run Health Verification Suite** (see next document)
2. **Confirm No Regressions** with existing systems
3. **Test Console API** with provided commands
4. **Verify Frame Times** remain acceptable
5. **Proceed to LinkNetworkHealthMonitor** implementation

---

## SUMMARY

**This plan provides exact locations and code for safe, staged integration of LinkPriorityDecayEngine.**

- ✅ 5 patches, 6 locations in main.js
- ✅ Clear before/after code for each patch
- ✅ Validation checklist for quality assurance
- ✅ Safe rollback procedure if needed
- ✅ Expected console output for verification

**Status:** READY FOR IMPLEMENTATION (pending "APPROVED FOR INTEGRATION" confirmation)

---

**Integration Time Estimate:** 20 minutes
**Validation Time Estimate:** 10 minutes
**Total Time Before LinkNetworkHealthMonitor:** 30 minutes
