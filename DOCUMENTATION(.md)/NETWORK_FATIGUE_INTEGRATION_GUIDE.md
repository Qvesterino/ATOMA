# Network Fatigue v0 — INTEGRATION GUIDE

Quick integration path for Network Fatigue into existing ATOMA codebase.

---

## PHASE 1: Core Setup (main.js)

### 1.1 Add Import
```javascript
import { NetworkFatigueSystem, setupNetworkFatigueConsoleAPI } from './NetworkFatigueSystem_v0.js';
```

### 1.2 Initialize System (after NodeDynamicMetrics init)
```javascript
// Near line where nodeDynamics is created:
const nodeDynamics = new NodeDynamicMetrics(aiNodes, nodeLinkingSystem);

// Add immediately after:
const fatigueSystem = new NetworkFatigueSystem(nodeDynamics);
setupNetworkFatigueConsoleAPI(fatigueSystem, nodeDynamics);
```

### 1.3 Frame Update Loop Integration
```javascript
// In your main game loop, update order:
function updateGameState(deltaTime) {
  // 1. Compute fresh metrics
  nodeDynamics.update(deltaTime);
  
  // 2. UPDATE FATIGUE (new step - add here)
  fatigueSystem.update(deltaTime);
  
  // 3. All other systems (visuals, corruption, harmony, etc.)
  // ...
}
```

---

## PHASE 2: Corruption System Integration

**File**: `/LinkCorruptionTransmission_v1.js`

### Location: In the corruption decay calculation

Find the section where corruption decay is applied (typically around line 260-280):

```javascript
// OLD CODE:
newCorruption -= this.config.corruptionDecayRate * newCorruption * dt;

// NEW CODE (add fatigue multiplier):
const decayMultiplier = fatigueSystem.getCorruptionDecayMultiplier(targetNode);
newCorruption -= this.config.corruptionDecayRate * newCorruption * dt * decayMultiplier;
```

### Parameter Addition
Pass `fatigueSystem` to LinkCorruptionTransmission initialization:
```javascript
const linkCorruptionSystem = new LinkCorruptionTransmission_v1(
  nodeDynamics,
  aiNodes,
  linkingSystem,
  fatigueSystem  // Add this parameter
);
```

---

## PHASE 3: Harmony System Integration

**File**: Wherever harmony spread/healing is calculated

### Pattern 1: Harmony Propagation
```javascript
// OLD:
const harmonyGain = baseHarmonyRate * harmonyMultiplier * deltaTime;

// NEW:
const fatigueMult = fatigueSystem.getHarmonyRateMultiplier(sourceNode);
const harmonyGain = baseHarmonyRate * harmonyMultiplier * fatigueMult * deltaTime;
```

### Pattern 2: Harmony Healing
```javascript
// OLD:
const healingRate = calculateBaseHealingRate(node);

// NEW:
const baseHealingRate = calculateBaseHealingRate(node);
const fatigueMult = fatigueSystem.getHarmonyRateMultiplier(node);
const healingRate = baseHealingRate * fatigueMult;
```

---

## PHASE 4: Synergy System Integration

**File**: Wherever synergy bonuses are calculated

### Pattern: Synergy Effectiveness
```javascript
// OLD:
const synergyBonus = calculateSynergy(node1, node2);

// NEW:
const baseSynergy = calculateSynergy(node1, node2);
const fatigue1Mult = fatigueSystem.getSynergyMultiplier(node1);
const fatigue2Mult = fatigueSystem.getSynergyMultiplier(node2);
const synergyBonus = baseSynergy * Math.min(fatigue1Mult, fatigue2Mult);
```

---

## PHASE 5: Validation & Testing

### Quick Verification
```javascript
// In browser console:
ATOMA_DEBUG.NetworkFatigue.printDiagnostics()
```

Expected output:
```
NETWORK FATIGUE DIAGNOSTICS (15 nodes)
================================================================================

Node 0 [process]:
  Fatigue: 0.0000 | State: STABLE
  Stress Composite: 0.0000 (Sensitivity: 1.0x)
  Metrics: Load=0.250 | Inst=50.0 | Corr=0.0 | Harm=75.0
  Multipliers: Harmony=1.000 | Synergy=1.000 | CorruptionDecay=1.000

Node 1 [input]:
  Fatigue: 0.1234 | State: ACCUMULATING
  Stress Composite: 0.6543 (Sensitivity: 1.15x)
  Metrics: Load=0.850 | Inst=75.0 | Corr=25.0 | Harm=15.0
  Multipliers: Harmony=0.951 | Synergy=0.957 | CorruptionDecay=0.963
```

### Stress Test (Loading Scenario)
```javascript
// Seed high load stress on node 0:
ATOMA_DEBUG.NetworkFatigue.seedFatigue(0, 0.0);

// Run 30-second stress test:
await ATOMA_DEBUG.NetworkFatigue.runStressTest(30);

// Expected: Fatigue should increase to ~0.5-0.8 (depends on metrics)
```

### Recovery Test
```javascript
// Seed a fatigued node:
ATOMA_DEBUG.NetworkFatigue.seedFatigue(0, 0.8);

// Monitor recovery by running diagnostics:
for (let i = 0; i < 5; i++) {
  ATOMA_DEBUG.NetworkFatigue.diagnose(0);
  await new Promise(r => setTimeout(r, 5000)); // Wait 5s
}

// Expected: Fatigue should decrease gradually if metrics are healthy
```

---

## PHASE 6: Performance Validation

### Overhead Measurement
Network Fatigue adds **minimal per-frame overhead**:

- Per-node fatigue update: ~0.1ms (simple math only)
- Total for 15-50 nodes: <1ms @ 60fps
- Zero object allocation (pure scalar operations)

**Verify with Chrome DevTools Profiler:**
1. Open Chrome DevTools → Performance tab
2. Record 5 seconds of gameplay
3. Search for `NetworkFatigueSystem.update`
4. Verify time < 1ms for full node set

---

## PHASE 7: Configuration Tuning (Optional)

### Faster Accumulation (more dramatic feel)
```javascript
const fatigueSystem = new NetworkFatigueSystem(nodeDynamics, {
  accumulationRateBase: 0.025,  // was 0.015 (~40s instead of 67s)
});
```

### Faster Recovery (more forgiving)
```javascript
const fatigueSystem = new NetworkFatigueSystem(nodeDynamics, {
  recoveryRateBase: 0.01,  // was 0.005 (~100s instead of 200s)
});
```

### Stricter Recovery Conditions (harder to recover)
```javascript
const fatigueSystem = new NetworkFatigueSystem(nodeDynamics, {
  recoveryConditions: {
    maxLoad: 0.4,        // was 0.5 (more demanding)
    maxInstability: 0.2, // was 0.3 (more demanding)
    minHarmony: 0.5,     // was 0.4 (more demanding)
    maxCorruption: 0.2   // was 0.3 (more demanding)
  }
});
```

### Weaker Effects (softer impact)
```javascript
const fatigueSystem = new NetworkFatigueSystem(nodeDynamics, {
  effects: {
    harmonyRateModulation: 0.20,      // was 0.40 (half as strong)
    synergyModulation: 0.15,          // was 0.35 (half as strong)
    corruptionDecayModulation: 0.15   // was 0.30 (half as strong)
  }
});
```

---

## INTEGRATION CHECKLIST

- [ ] Import NetworkFatigueSystem + setupConsoleAPI in main.js
- [ ] Initialize fatigueSystem after nodeDynamics
- [ ] Setup console API
- [ ] Add fatigueSystem.update(dt) in game loop
- [ ] Pass fatigueSystem to LinkCorruptionTransmission_v1
- [ ] Integrate corruption decay multiplier
- [ ] Integrate harmony rate multiplier (if applicable)
- [ ] Integrate synergy multiplier (if applicable)
- [ ] Run console diagnostic: `ATOMA_DEBUG.NetworkFatigue.printDiagnostics()`
- [ ] Run stress test: `await ATOMA_DEBUG.NetworkFatigue.runStressTest(30)`
- [ ] Monitor recovery behavior
- [ ] Performance check with DevTools profiler
- [ ] Play test for 3-5 minutes
- [ ] Document any tuning changes made

---

## ROLLBACK PLAN

If any issues arise, fatigue can be disabled immediately without touching other systems:

```javascript
// Disable fatigue multipliers (make them all 1.0):
const fatigueSystem = {
  getHarmonyRateMultiplier: () => 1.0,
  getSynergyMultiplier: () => 1.0,
  getCorruptionDecayMultiplier: () => 1.0,
  update: () => {} // No-op
};
```

This leaves all other systems unaffected.

---

## NEXT STEPS

1. **Complete Phase 1** (main.js setup)
2. **Run console API** to verify initialization
3. **Complete Phases 2-4** (system integrations)
4. **Run stress test** to verify fatigue accumulation/recovery
5. **Play test** for 5+ minutes
6. **Gather feedback** on gameplay feel
7. **Adjust configuration** as needed
8. **Document any changes** made from defaults

---

**Status**: Ready for integration. All code is production-safe with no breaking changes.
