# Network Fatigue v0 — TEST SCENARIOS & VALIDATION

Complete test suite for validating Network Fatigue behavior against spec.

---

## TEST SETUP

All tests require:
```javascript
// In console, verify initialization:
ATOMA_DEBUG.NetworkFatigue.printDiagnostics()

// Expected: Nodes listed with fatigue, state, metrics
```

---

## SCENARIO 1: Idle Node (No Stress)

**Objective**: Verify fatigue stays at 0 when node is healthy

**Setup**:
- Let network run naturally for 30 seconds
- Choose a node with: Load < 0.5, Instability < 30, Harmony > 40, Corruption < 30

**Validation**:
```javascript
ATOMA_DEBUG.NetworkFatigue.diagnose(0)  // Your chosen idle node
```

**Expected Result**:
```
fatigue: 0.0000
state: STABLE
stressComposite: 0.0000
multipliers: all 1.0
```

**Pass Criteria**: ✅ Fatigue remains 0.0

---

## SCENARIO 2: High Load Stress

**Objective**: Verify fatigue accumulates under high load

**Setup**:
```javascript
// Cause high load on node 0:
// - Create many links to node 0 (via UI click-linking)
// - Or trigger cascade that loads this node

// Wait 60 seconds, then verify:
ATOMA_DEBUG.NetworkFatigue.diagnose(0)
```

**Expected Result**:
```
state: ACCUMULATING
loadRatio: 0.8+ (> 0.75 threshold)
fatigue: 0.5-0.8 (depends on other stressors)
```

**Pass Criteria**: ✅ Fatigue increases smoothly, state = ACCUMULATING

---

## SCENARIO 3: High Instability Stress

**Objective**: Verify fatigue accumulates from instability

**Setup**:
```javascript
// Check current node with high instability:
// - High link count with low stability rating
// - Or corrupted nodes affecting stability

ATOMA_DEBUG.NetworkFatigue.diagnose(1)  // High instability node
```

**Expected Result**:
```
state: ACCUMULATING
instability: 60+
fatigue: 0.3-0.6
```

**Pass Criteria**: ✅ Fatigue increases when instability > 60

---

## SCENARIO 4: Corruption Stress

**Objective**: Verify fatigue accumulates when corrupted

**Setup**:
```javascript
// Find node with corruption > 0.40:
// - Let corruption build naturally
// - Or seed manually

ATOMA_DEBUG.NetworkFatigue.diagnose(2)
```

**Expected Result**:
```
state: ACCUMULATING
corruption: 40+
fatigue: increases gradually
```

**Pass Criteria**: ✅ Fatigue increases when corruption > 40

---

## SCENARIO 5: Harmony Deficit

**Objective**: Verify fatigue accumulates when harmony starved

**Setup**:
```javascript
// Find node with harmony < 20:
// - Usually under stress with no healing
// - Or corrupted

ATOMA_DEBUG.NetworkFatigue.diagnose(3)
```

**Expected Result**:
```
state: ACCUMULATING
harmony: < 20
stressComposite: 0.25+ (from harmony deficit)
```

**Pass Criteria**: ✅ Fatigue increases when harmony < 20

---

## SCENARIO 6: Recovery Under Healthy Conditions

**Objective**: Verify fatigue decreases when all conditions are healthy

**Setup**:
```javascript
// Seed a node with fatigue:
ATOMA_DEBUG.NetworkFatigue.seedFatigue(0, 0.8)

// Wait for metrics to stabilize (click around, load-balance)
// Eventually get to:
// - Load < 0.5
// - Instability < 30
// - Harmony > 40
// - Corruption < 30

// Monitor recovery:
ATOMA_DEBUG.NetworkFatigue.diagnose(0)
```

**Expected Sequence**:
```
Time 0s:   fatigue: 0.8000 | state: RECOVERING
Time 10s:  fatigue: 0.7500 | state: RECOVERING
Time 20s:  fatigue: 0.7000 | state: RECOVERING
Time 100s: fatigue: 0.0000 | state: STABLE
```

**Pass Criteria**: ✅ Fatigue decreases at ~0.005/s when all recovery conditions met

---

## SCENARIO 7: Category Sensitivity Comparison

**Objective**: Verify categories accumulate fatigue at different rates

**Setup**:
```javascript
// Identify nodes of different categories:
// - Find input node (category='input')
// - Find storage node (category='storage')
// - Expose both to identical stress conditions

// Seed to 0:
ATOMA_DEBUG.NetworkFatigue.seedFatigue(inputNodeIdx, 0)
ATOMA_DEBUG.NetworkFatigue.seedFatigue(storageNodeIdx, 0)

// Load both heavily, wait 60 seconds

ATOMA_DEBUG.NetworkFatigue.diagnose(inputNodeIdx)
ATOMA_DEBUG.NetworkFatigue.diagnose(storageNodeIdx)
```

**Expected Result**:
```
Input node:
  state: ACCUMULATING
  categorySensitivity: 1.15
  fatigue: 0.7+ (higher)

Storage node:
  state: ACCUMULATING
  categorySensitivity: 0.75
  fatigue: 0.3-0.4 (lower, accumulates slower)
```

**Pass Criteria**: ✅ Input fatigue > Storage fatigue under same stress (1.15/0.75 ≈ 1.53× ratio)

---

## SCENARIO 8: Multiplier Effects (Corruption Decay)

**Objective**: Verify fatigue reduces corruption decay rate

**Setup**:
```javascript
// Get corrupted node with fatigue:
ATOMA_DEBUG.NetworkFatigue.diagnose(corruptedNodeIdx)
// Note corruption value, fatigue value

// Check multiplier:
// Multiplier = 1 - (fatigue × 0.30)
// If fatigue = 0.8, multiplier = 1 - 0.24 = 0.76
// So decay should be 76% of normal
```

**Expected Result**:
```
fatigue: 0.8000
multipliers.corruptionDecay: 0.7600

// Corruption cleanup takes ~32% longer than at fatigue=0
```

**Pass Criteria**: ✅ Corruption decay multiplier follows formula

---

## SCENARIO 9: Harmony Rate Effect

**Objective**: Verify fatigue reduces harmony healing rate

**Setup**:
```javascript
// Find corrupted node needing healing
// Check harmony rate multiplier:
ATOMA_DEBUG.NetworkFatigue.diagnose(needsHealingNodeIdx)
```

**Expected Result**:
```
fatigue: 0.5000
multipliers.harmonyRate: 0.8000  // 1 - (0.5 × 0.40)

// Harmony healing 20% slower than normal
```

**Pass Criteria**: ✅ Harmony rate multiplier follows formula

---

## SCENARIO 10: Synergy Effect

**Objective**: Verify fatigue reduces synergy bonus

**Setup**:
```javascript
// Two linked nodes with different fatigue:
ATOMA_DEBUG.NetworkFatigue.diagnose(node1Idx)
ATOMA_DEBUG.NetworkFatigue.diagnose(node2Idx)

// Synergy multiplier = min(node1Mult, node2Mult)
// If node1 fatigue=0.3, node2 fatigue=0.6
// Mult1 = 1 - 0.105 = 0.895
// Mult2 = 1 - 0.210 = 0.790
// Combined synergy multiplier = 0.790
```

**Expected Result**:
```
Node 1:
  fatigue: 0.3000
  multipliers.synergy: 0.8950

Node 2:
  fatigue: 0.6000
  multipliers.synergy: 0.7900

// Link synergy uses minimum: 0.7900
```

**Pass Criteria**: ✅ Synergy multiplier = min(node1Mult, node2Mult)

---

## SCENARIO 11: Stalemate (Mixed Conditions)

**Objective**: Verify fatigue holds steady when neither accumulating nor recovering

**Setup**:
```javascript
// Create mixed conditions:
// - Load = 0.6 (between 0.5 and 0.75)
// - Instability = 0.4 (< 0.60)
// - Harmony = 0.35 (between 0.20 and 0.40)
// - Corruption = 0.25 (< 0.30)

// This meets some recovery conditions but not all
// AND doesn't meet full accumulation criteria

// Seed fatigue = 0.5, monitor:
ATOMA_DEBUG.NetworkFatigue.seedFatigue(0, 0.5)
// Wait 30 seconds
ATOMA_DEBUG.NetworkFatigue.diagnose(0)
```

**Expected Result**:
```
state: STABLE
fatigue: ~0.5000 (unchanged)
```

**Pass Criteria**: ✅ Fatigue doesn't change in stalemate state

---

## SCENARIO 12: Full Accumulation Arc (0 → Max)

**Objective**: Measure time to accumulate from 0 to 1.0 under sustained stress

**Setup**:
```javascript
ATOMA_DEBUG.NetworkFatigue.seedFatigue(0, 0.0)

// Create maximum stress:
// - Load ratio = 1.0 (saturated)
// - Instability = 100 (maximum)
// - Corruption = 100 (maximum)
// - Harmony = 0 (zero)

// Run stress test:
await ATOMA_DEBUG.NetworkFatigue.runStressTest(120)  // 2 minutes
```

**Expected Result**:
```
Start fatigue: 0.0000
End fatigue: 0.9+  (very close to 1.0)
Time to max: ~67 seconds at maximum stress (for baseline category)
```

**Pass Criteria**: ✅ Takes ~60-70s to reach max at max stress

---

## SCENARIO 13: Full Recovery Arc (Max → 0)

**Objective**: Measure time to recover from max fatigue to 0 under ideal conditions

**Setup**:
```javascript
ATOMA_DEBUG.NetworkFatigue.seedFatigue(0, 1.0)

// Create perfect health:
// - Load ratio = 0 (no links)
// - Instability = 0 (perfect stability)
// - Corruption = 0 (pristine)
// - Harmony = 100 (maximum)

// Monitor recovery for 5 minutes:
for (let i = 0; i < 10; i++) {
  await new Promise(r => setTimeout(r, 30000));
  console.log(`Time ${i*30}s:`, ATOMA_DEBUG.NetworkFatigue.diagnose(0).fatigue);
}
```

**Expected Result**:
```
Time 0s:   fatigue: 1.0000
Time 30s:  fatigue: 0.8500
Time 60s:  fatigue: 0.7000
Time 150s: fatigue: 0.2500
Time 200s: fatigue: 0.0000
```

**Pass Criteria**: ✅ Takes ~200s to fully recover from max

---

## SCENARIO 14: Stress Boundary Conditions

**Objective**: Verify stress composite calculation at threshold boundaries

**Setup**:
```javascript
// Create load-only stress (just at threshold):
// - Load ratio = 0.75 (exactly at highLoad threshold)
// - Instability = 30 (below 60)
// - Corruption = 30 (below 40)
// - Harmony = 50 (above 20)

ATOMA_DEBUG.NetworkFatigue.diagnose(0)
```

**Expected Result**:
```
stressComposite: 0.0 (no stress, all at thresholds)
state: STABLE
fatigue: stable (no change)

// Then increase load to 0.76:
stressComposite: 0.004+ (minimum stress detected)
state: ACCUMULATING
```

**Pass Criteria**: ✅ Fatigue transitions at exact thresholds

---

## VALIDATION CHECKLIST

- [ ] Scenario 1: Idle nodes stay fatigue=0
- [ ] Scenario 2: High load causes accumulation
- [ ] Scenario 3: High instability causes accumulation
- [ ] Scenario 4: Corruption causes accumulation
- [ ] Scenario 5: Low harmony causes accumulation
- [ ] Scenario 6: Recovery under healthy conditions works
- [ ] Scenario 7: Category sensitivities differ as spec'd
- [ ] Scenario 8: Corruption decay reduced by fatigue
- [ ] Scenario 9: Harmony rate reduced by fatigue
- [ ] Scenario 10: Synergy reduced by fatigue
- [ ] Scenario 11: Stalemate states don't change fatigue
- [ ] Scenario 12: Accumulation takes ~67s at max stress
- [ ] Scenario 13: Recovery takes ~200s from max
- [ ] Scenario 14: Boundary conditions work correctly

---

## PASS/FAIL CRITERIA

**PASS** if:
- All 14 scenarios show expected results
- Multipliers follow formulas exactly
- Times match spec (±10% variance acceptable)
- No fatigue values outside [0, 1]
- State transitions smooth and consistent

**FAIL** if:
- Any fatigue > 1.0 or < 0.0
- Accumulation < 30s or > 120s at max stress
- Recovery > 400s from max
- Multipliers < 0.6 or > 1.0
- State changes suddenly (not smooth)

---

## PERFORMANCE VALIDATION

```javascript
// In Chrome DevTools Performance tab:
// 1. Record 10 seconds of gameplay
// 2. Search for "NetworkFatigueSystem.update"
// 3. Expected: < 1ms per frame for 15-50 nodes
// 4. Memory: Zero allocations (pure scalar ops)
```

**Expected Overhead**: 0.1-0.9ms @ 60fps for typical node count

---

## NEXT STEPS

1. Run through all 14 scenarios
2. Document any deviations from expected results
3. If all pass: System ready for production
4. If failures: Check configuration, thresholds, formulas
5. Re-test after any adjustments
