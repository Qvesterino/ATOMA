# T4-004: HARMONY HEALING TEST PROCEDURE

## Objective

Validate harmony healing behavior under real network conditions with category-aware propagation and interaction rules active.

Verify that:
- Harmony spreads measurably and progressively
- Corruption is reduced proportionally, not instantly
- Oasis zones form naturally through clustering
- High load/instability weakens harmony (no binary on/off)

---

## Prerequisites Validation

### Required Systems
1. **LinkCorruptionTransmission_v1** - Active corruption propagation engine
2. **HarmonyStabilizationSystem_v1** - Active harmony healing system
3. **Category-aware propagation rates** - Corruption/harmony/synergy multipliers enabled
4. **Active network** - At least 10+ nodes present
5. **Link system** - NodeLinkingSystem or equivalent

### Validation Command
```javascript
window.validateHarmonyHealingPrerequisites()
```

**Expected Output:**
```
✅ LinkCorruptionTransmission_v1 active
✅ HarmonyStabilizationSystem_v1 active
✅ Category-aware propagation rates active
✅ Active network with [N] nodes found
✅ Link system active

✅ ALL PREREQUISITES MET
```

**If any check fails → STOP. Do not proceed.**

---

## Test Procedure

### Phase 1: Corruption Seeding (Baseline Setup)

**Goal:** Create moderate corruption state without cascading

**Command:**
```javascript
window.seedCorruptionForTest(0.45)
```

**Parameters:**
- Target level: 0.45 (45% corruption, pre-cascade threshold)
- Distribution: 60% of nodes get moderate corruption, 25% get light

**Expected:**
```
✅ Corruption seeded: [N] nodes, [M] links
```

**What it does:**
- Randomizes corruption across network
- Avoids cascade thresholds (0.45 → distortion starts at 0.45)
- Seeds links to ~30% baseline

---

### Phase 2: Harmony Source Activation

**Goal:** Introduce harmony in a key location

**Command:**
```javascript
window.activateHarmonySource(0)
```

**Parameters:**
- Node index: 0 (first node, or another strategic location)
- Harmony level: 0.9 (high but not max)
- Anchor status: Set as harmony anchor

**Expected:**
```
✅ Harmony source activated on [CATEGORY] node (index [I])
```

**What it does:**
- Sets single node to 0.9 harmony (high but stable)
- Marks as anchor point for healing cascade
- Initiates harmony flow through links

---

### Phase 3: Main Test Execution (20 seconds)

**Goal:** Observe healing progression

**Command:**
```javascript
window.runHarmonyHealingTest(20)
```

**Parameters:**
- Duration: 20 seconds
- Data collection: Every 100ms (~6 FPS analysis)
- Stress applied: At 50% mark (10 seconds)

**Expected:**
```
ℹ️  Test running. Collecting data every 100ms...
[Test completes and finalizes after 20s]
```

**What it measures:**
- Node harmony levels over time
- Link harmony propagation
- Corruption reduction per frame
- Oasis zone formation (3+ nodes with harmony > 0.6)
- Response to stress conditions

---

### Phase 4: Stress Injection (Automatic, at 10s mark)

**Automatic trigger:** Happens halfway through test

**What happens:**
- Corruption increases in 40% of random nodes (+0.15 each)
- Simulates load pressure or threat
- Tests harmony resilience

**Expect:**
- Temporary corruption spike
- Harmony may stabilize or continue healing
- Oasis zones should hold or recover

---

### Phase 5: Results Analysis

**Command:**
```javascript
window.printHarmonyTestReport()
```

**Displays:**
1. **Harmony Spread Metrics**
   - Initial harmony: Starting value
   - Peak harmony: Maximum reached
   - Final harmony: End state
   - Spread rate: Units/second

2. **Corruption Reduction**
   - Initial corruption: Baseline after seeding
   - Minimum corruption: Lowest point
   - Final corruption: End state
   - Total reduction: Absolute change

3. **Oasis Formation**
   - Events observed: How many oasis zones detected
   - Peak count: Maximum simultaneous oases
   - Nodes clustered: Size of largest cluster

4. **Stress Response**
   - Corruption before stress: Value at 50% mark
   - Corruption after stress: Value right after spike
   - Harmony before/after: Healing system resilience

5. **Anomalies**
   - No corruption reduction → Healing may not be active
   - No oasis zones → Clustering not working
   - Large spike after stress → System fragile
   - Resilience detected → Good stress handling

---

## Success Criteria

### ✅ HARMONY SPREAD IS MEASURABLE
- Harmony increases from baseline (0.0) to peak (>0.3)
- Spread continues progressively over 20 seconds
- Not instant / not binary

### ✅ CORRUPTION IS REDUCED PROPORTIONALLY
- Corruption decreases measurably (>10% reduction)
- Reduction correlates with harmony level
- Not instant erasure (no binary on/off)

### ✅ OASIS ZONES FORM NATURALLY
- At least 1 oasis zone detected (3+ nodes with harmony > 0.6)
- Zones persist for multiple frames
- Load pressure can suppress but not eliminate

### ✅ HIGH LOAD/INSTABILITY WEAKENS HARMONY
- Stress injection causes temporary corruption increase
- Harmony continues but at reduced pace
- System is resilient but not invincible

### ❌ FAILURES

| Failure | Symptom | Cause |
|---------|---------|-------|
| Harmony not spreading | Peak harmony ~0 | Harmony system not linked |
| No corruption reduction | Corruption unchanged | Healing not applied |
| Binary on/off | Corruption drops to 0 instantly | Harmony blocking too strong |
| No oasis | No clusters form | Category-aware propagation not working |
| Harmony ignores stress | No change at 50% mark | Stress conditions not applying |

---

## Expected Values (Baseline)

**Ideal harmony healing test should show:**

| Metric | Expected Range | Notes |
|--------|-----------------|-------|
| Spread rate | 0.01–0.05 units/sec | Slow, measured healing |
| Corruption reduction | 10–30% total | Partial recovery |
| Oasis zones | 1–3 | Small clusters |
| Stress spike | +0.1–0.2 corruption | Temporary, then recovery |
| Harmony resilience | <20% drop | System survives load |

---

## Console Commands Reference

| Command | Purpose | Returns |
|---------|---------|---------|
| `validateHarmonyHealingPrerequisites()` | Check system setup | Prerequisites report |
| `seedCorruptionForTest(0.45)` | Create baseline corruption | Seeding report |
| `activateHarmonySource(0)` | Start harmony propagation | Activation report |
| `runHarmonyHealingTest(20)` | Execute 20-second test | (Test running...) |
| `getHarmonyTestReport()` | Get raw data | Full JSON report |
| `printHarmonyTestReport()` | Display formatted results | Formatted output |

---

## Data Structure

Raw report contains:
```javascript
{
  timestamp: ISO timestamp,
  duration: 20 (seconds),
  framesCollected: ~200,
  
  harmonySpread: {
    initial: 0.0,
    peak: 0.45,
    final: 0.38,
    spreadRate: 0.015 units/sec
  },
  
  corruptionReduction: {
    initial: 0.45,
    minimum: 0.28,
    final: 0.32,
    totalReduction: 0.13
  },
  
  oasisFormation: {
    oasisEventsObserved: 3,
    peakOasisCount: 2,
    nodesClustered: 7
  },
  
  stressResponse: {
    corruptionBeforeStress: 0.35,
    corruptionAfterStress: 0.48,
    harmonyBeforeStress: 0.42,
    harmonyAfterStress: 0.40
  },
  
  anomalies: [],
  harmonyTimeline: [...],
  corruptionTimeline: [...],
  oasisEvents: [...]
}
```

---

## Troubleshooting

### "Prerequisites not validated"
→ Run `validateHarmonyHealingPrerequisites()` first and check all pass

### "No test data collected"
→ Run `runHarmonyHealingTest(20)` and wait 20+ seconds

### "Peak harmony is 0"
→ Harmony system not propagating; check HarmonyStabilizationSystem_v1 is active

### "Corruption reduction is 0"
→ Healing not being applied; check harmony→corruption link in updateNodeHarmony()

### "No oasis zones"
→ Category-aware propagation may not be scaling correctly; check multiplier values

### "Corruption spikes to 100%"
→ Normal under extreme stress; check stress spike magnitude

---

## Non-Invasive Nature

✅ **Read-only console API** - No modifications to game logic  
✅ **Non-breaking** - Test runner doesn't interfere with gameplay  
✅ **Temporary seeding** - Corruption/harmony only set for test duration  
✅ **No UI changes** - Test data collected in background  
✅ **No network topology changes** - Existing nodes/links unmodified  
✅ **Reversible** - Game continues normally after test  

---

## Next Steps After Testing

1. **Successful test** → Document baseline; proceed to fine-tuning
2. **Failed prerequisite** → Debug missing system
3. **Weak healing** → Increase harmony spread rate parameters
4. **Binary on/off** → Adjust blocking thresholds (currently at 0.8 harmony)
5. **No oasis zones** → Check category multiplier effectiveness

**Status:** Ready for production testing
