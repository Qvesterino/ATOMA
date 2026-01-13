# Network Fatigue v0 — INTEGRATION CHECKLIST

Step-by-step checklist for integrating Network Fatigue into main codebase.

---

## PHASE 1: CORE SETUP (main.js)

### Step 1.1: Add Import Statement
**Location**: Top of main.js, with other imports

```javascript
import { NetworkFatigueSystem, setupNetworkFatigueConsoleAPI } from './NetworkFatigueSystem_v0.js';
```

**Verification**: No red underline, no import errors

**Status**: ☐ Complete

---

### Step 1.2: Initialize Fatigue System
**Location**: In initialization section, RIGHT AFTER NodeDynamicMetrics creation

**Current Code** (find this):
```javascript
const nodeDynamics = new NodeDynamicMetrics(aiNodes, nodeLinkingSystem);
```

**Add After**:
```javascript
// Initialize Network Fatigue System (v0 - experimental)
const fatigueSystem = new NetworkFatigueSystem(nodeDynamics);
setupNetworkFatigueConsoleAPI(fatigueSystem, nodeDynamics);

console.log('✓ Network Fatigue System initialized');
```

**Verification**: Console shows `✓ Network Fatigue System initialized`

**Status**: ☐ Complete

---

### Step 1.3: Add to Game Loop
**Location**: In main update/render function, RIGHT AFTER nodeDynamics.update()

**Current Code** (find this):
```javascript
function updateGameState(deltaTime) {
  // ... start of function
  
  nodeDynamics.update(deltaTime);
  
  // ... rest of function
}
```

**Change To**:
```javascript
function updateGameState(deltaTime) {
  // ... start of function
  
  nodeDynamics.update(deltaTime);
  fatigueSystem.update(deltaTime);  // ← ADD THIS LINE
  
  // ... rest of function
}
```

**Verification**: No console errors during gameplay

**Status**: ☐ Complete

---

### Step 1.4: Test Console API
**Action**: Open browser console and run:

```javascript
ATOMA_DEBUG.NetworkFatigue.printDiagnostics()
```

**Expected Output**:
```
================================================================================
NETWORK FATIGUE DIAGNOSTICS (X nodes)
================================================================================

Node 0 [process]:
  Fatigue: 0.0000 | State: STABLE
  ...
```

**Verification**: 
- ✅ No errors
- ✅ All nodes listed
- ✅ Fatigue values shown
- ✅ States shown (STABLE/ACCUMULATING/RECOVERING)

**Status**: ☐ Complete

---

## PHASE 2: CORRUPTION SYSTEM INTEGRATION (LinkCorruptionTransmission_v1.js)

### Step 2.1: Receive Fatigue System Reference
**Location**: Constructor of LinkCorruptionTransmission_v1

**Current Code** (find constructor):
```javascript
constructor(nodeDynamics, aiNodes, linkingSystem) {
  this.nodeDynamics = nodeDynamics;
  this.aiNodes = aiNodes;
  this.linkingSystem = linkingSystem;
```

**Change To**:
```javascript
constructor(nodeDynamics, aiNodes, linkingSystem, fatigueSystem) {
  this.nodeDynamics = nodeDynamics;
  this.aiNodes = aiNodes;
  this.linkingSystem = linkingSystem;
  this.fatigueSystem = fatigueSystem;  // ← ADD THIS LINE
```

**Verification**: No errors during initialization

**Status**: ☐ Complete

---

### Step 2.2: Update Constructor Call (main.js)
**Location**: In main.js, where LinkCorruptionTransmission_v1 is instantiated

**Find This**:
```javascript
const linkCorruptionSystem = new LinkCorruptionTransmission_v1(
  nodeDynamics,
  aiNodes,
  nodeLinkingSystem
);
```

**Change To**:
```javascript
const linkCorruptionSystem = new LinkCorruptionTransmission_v1(
  nodeDynamics,
  aiNodes,
  nodeLinkingSystem,
  fatigueSystem  // ← ADD THIS PARAMETER
);
```

**Verification**: No instantiation errors

**Status**: ☐ Complete

---

### Step 2.3: Apply Corruption Decay Multiplier
**Location**: In LinkCorruptionTransmission_v1, in the method that applies corruption decay

**Find This Pattern** (search for "corruptionDecayRate" or "newCorruption -="):
```javascript
// Regular nodes slowly decay corruption
newCorruption -= this.config.corruptionDecayRate * newCorruption * deltaTime;
```

**Change To**:
```javascript
// Regular nodes slowly decay corruption (with fatigue modulation)
const decayMultiplier = this.fatigueSystem.getCorruptionDecayMultiplier(targetNode);
newCorruption -= this.config.corruptionDecayRate * newCorruption * deltaTime * decayMultiplier;
```

**Verification**: 
- No errors
- Test with console: `ATOMA_DEBUG.NetworkFatigue.diagnose(nodeIndex)` shows multipliers

**Status**: ☐ Complete

---

## PHASE 3: HARMONY SYSTEM INTEGRATION (Location TBD)

### Step 3.1: Locate Harmony Spread/Healing Code
**Search For**: "harmony" in combined search + "spread" or "heal"

**Likely Files**:
- LinkCorruptionTransmission_v1.js (harmony spread during healing)
- HarmonyStabilizationSystem_v1.js (if exists)
- NodeDynamicMetrics.js (harmony calculation)

**Action**: Identify where harmony increases/spreads

**Status**: ☐ Located

---

### Step 3.2: Add Fatigue Reference (if new file)
**If harmony is in new file:**

```javascript
constructor(...params, fatigueSystem) {
  this.fatigueSystem = fatigueSystem;
  // ... other init
}
```

**Status**: ☐ Complete

---

### Step 3.3: Apply Harmony Rate Multiplier
**Find This Pattern**:
```javascript
const harmonyGain = baseHarmonyRate * harmonyMultiplier * deltaTime;
```

**Change To**:
```javascript
const harmonyMult = this.fatigueSystem.getHarmonyRateMultiplier(sourceNode);
const harmonyGain = baseHarmonyRate * harmonyMultiplier * harmonyMult * deltaTime;
```

**Verification**: 
- Harmony healing slows down when node is fatigued
- Test: Load a node heavily, check healing rate drops

**Status**: ☐ Complete

---

## PHASE 4: SYNERGY SYSTEM INTEGRATION (Location TBD)

### Step 4.1: Locate Synergy Calculation
**Search For**: "synergy" or "bonus" related to link effectiveness

**Likely Files**:
- ComputeSynergyScore2_1.js
- LinkGlowSynergyEngine1_0.js
- SynergyEngine.ts

**Status**: ☐ Located

---

### Step 4.2: Add Fatigue Reference
**If new file:**

```javascript
constructor(...params, fatigueSystem) {
  this.fatigueSystem = fatigueSystem;
}
```

**Status**: ☐ Complete

---

### Step 4.3: Apply Synergy Multiplier
**Find This Pattern**:
```javascript
const synergyBonus = calculateSynergy(node1, node2);
```

**Change To** (use minimum of both nodes' multipliers):
```javascript
const baseSynergy = calculateSynergy(node1, node2);
const fatigueMult1 = this.fatigueSystem.getSynergyMultiplier(node1);
const fatigueMult2 = this.fatigueSystem.getSynergyMultiplier(node2);
const synergyBonus = baseSynergy * Math.min(fatigueMult1, fatigueMult2);
```

**Verification**: 
- Synergy diminishes when either node is fatigued
- Test: Monitor synergy visuals on fatigued link

**Status**: ☐ Complete

---

## PHASE 5: VALIDATION & TESTING

### Step 5.1: Console Diagnostic Check
**Run in Console**:
```javascript
ATOMA_DEBUG.NetworkFatigue.printDiagnostics()
```

**Verify**:
- ✅ All nodes show fatigue values
- ✅ State shows correctly (STABLE/ACCUMULATING/RECOVERING)
- ✅ No NaN or undefined values
- ✅ Multipliers in range [0.6, 1.0]

**Status**: ☐ Pass

---

### Step 5.2: Stress Accumulation Test
**Run in Console**:
```javascript
// Seed initial fatigue = 0
ATOMA_DEBUG.NetworkFatigue.seedFatigue(0, 0.0)

// Wait 30 seconds (create heavy load)
// Then check:
ATOMA_DEBUG.NetworkFatigue.diagnose(0)
```

**Verify**:
- ✅ Fatigue increased (not 0)
- ✅ State = ACCUMULATING
- ✅ No errors

**Status**: ☐ Pass

---

### Step 5.3: Recovery Test
**Run in Console**:
```javascript
// Seed high fatigue
ATOMA_DEBUG.NetworkFatigue.seedFatigue(0, 0.8)

// Unload the node (remove links or let it idle)
// Wait 30+ seconds
// Then check:
ATOMA_DEBUG.NetworkFatigue.diagnose(0)
```

**Verify**:
- ✅ Fatigue decreased
- ✅ State = RECOVERING
- ✅ Smooth decrease (not sudden)

**Status**: ☐ Pass

---

### Step 5.4: Multiplier Effect Verification
**Run in Console**:
```javascript
// Find a fatigued node:
let details = ATOMA_DEBUG.NetworkFatigue.diagnose(0)

// Verify multipliers follow formula:
// harmonyRate = 1 - (fatigue × 0.40)
// synergy = 1 - (fatigue × 0.35)
// corruptionDecay = 1 - (fatigue × 0.30)

console.assert(
  Math.abs(details.multipliers.harmonyRate - (1 - details.fatigue * 0.40)) < 0.001,
  'Harmony multiplier formula incorrect'
)
```

**Verify**:
- ✅ No assertion failures
- ✅ Multipliers match formulas exactly

**Status**: ☐ Pass

---

### Step 5.5: Performance Profiling
**Action**: Chrome DevTools → Performance

1. Open DevTools
2. Performance tab → Record
3. Play for 10 seconds
4. Stop recording
5. Search for "NetworkFatigueSystem"

**Verify**:
- ✅ Each call < 1ms
- ✅ No yellow/red warnings
- ✅ Smooth frame rate (no hitches)

**Status**: ☐ Pass

---

### Step 5.6: Gameplay Feel Test
**Action**: Play normally for 5+ minutes

**Observe**:
- ✅ No unusual behavior
- ✅ Harmony healing seems slightly slower on old nodes
- ✅ Networks don't behave unexpectedly
- ✅ No visible bugs or glitches

**Status**: ☐ Pass

---

## PHASE 6: INTEGRATION COMPLETE

### Final Checklist
- ☐ Phase 1: Core setup complete
  - ☐ Import added
  - ☐ System initialized
  - ☐ Game loop updated
  - ☐ Console API working
  
- ☐ Phase 2: Corruption system integrated
  - ☐ Fatigue reference passed
  - ☐ Constructor updated
  - ☐ Decay multiplier applied
  
- ☐ Phase 3: Harmony system integrated
  - ☐ Located harmony code
  - ☐ Multiplier applied
  
- ☐ Phase 4: Synergy system integrated
  - ☐ Located synergy code
  - ☐ Multiplier applied
  
- ☐ Phase 5: Validation complete
  - ☐ Diagnostics working
  - ☐ Accumulation verified
  - ☐ Recovery verified
  - ☐ Multipliers correct
  - ☐ Performance acceptable
  - ☐ Gameplay feels good

### Sign-off
**Integration Complete**: 🟢 READY

**Next Steps**:
1. Document any tuning done
2. Commit changes to version control
3. Monitor gameplay for 1-2 weeks
4. Gather feedback on fatigue feel
5. Consider v1+ enhancements

---

## TROUBLESHOOTING

### "NetworkFatigueSystem is not defined"
**Fix**: Check import statement is correct and file exists

```javascript
import { NetworkFatigueSystem, setupNetworkFatigueConsoleAPI } from './NetworkFatigueSystem_v0.js';
```

### "ATOMA_DEBUG.NetworkFatigue is undefined"
**Fix**: Ensure `setupNetworkFatigueConsoleAPI` is called in init

```javascript
setupNetworkFatigueConsoleAPI(fatigueSystem, nodeDynamics);
```

### "getCorruptionDecayMultiplier is not a function"
**Fix**: Ensure `fatigueSystem` is passed to LinkCorruptionTransmission constructor

### "Fatigue always 0"
**Fix**: Check that `fatigueSystem.update(deltaTime)` is called in game loop

### "Performance degradation"
**Fix**: Verify no infinite loops. Expected: < 1ms per update

---

## ROLLBACK INSTRUCTIONS

If major issues occur:

1. **Remove from game loop**:
   ```javascript
   // fatigueSystem.update(deltaTime);  // Commented out
   ```

2. **Disable multipliers**:
   ```javascript
   const fatigueSystem = {
     getHarmonyRateMultiplier: () => 1.0,
     getSynergyMultiplier: () => 1.0,
     getCorruptionDecayMultiplier: () => 1.0,
     update: () => {},
     getDiagnostics: () => ({})
   };
   ```

3. **Test**: Verify all systems work normally

All other systems remain unaffected.
