# T4-004: HARMONY HEALING TEST — QUICK START

## TL;DR: Run This

```javascript
// Step 1: Validate prerequisites (must pass)
window.validateHarmonyHealingPrerequisites()

// Step 2: Seed corruption (40-45% baseline)
window.seedCorruptionForTest(0.45)

// Step 3: Activate harmony in a node
window.activateHarmonySource(0)

// Step 4: Run test (20 seconds, auto stress at 10s)
window.runHarmonyHealingTest(20)

// Step 5: Wait ~20-25 seconds, then check results
window.printHarmonyTestReport()
```

## Expected Output

### If All Working ✅
```
✅ ALL PREREQUISITES MET

✅ Corruption seeded: [N] nodes, [M] links

✅ Harmony source activated on [CATEGORY] node

ℹ️  Test running. Collecting data every 100ms...
[... 20 second wait ...]

╔══════════════════════════════════════════════════════════════════╗
║          T4-004 HARMONY HEALING TEST REPORT                      ║
╚══════════════════════════════════════════════════════════════════╝

📊 HARMONY SPREAD METRICS:
  initial: 0.0
  peak: 0.45
  final: 0.38
  spreadRate: 0.015 units/sec

📉 CORRUPTION REDUCTION:
  initial: 0.45
  minimum: 0.28
  final: 0.32
  totalReduction: 0.13 (29% reduction)

🌿 OASIS FORMATION:
  oasisEventsObserved: 3
  peakOasisCount: 2
  nodesClustered: 7

⚡ STRESS RESPONSE:
  corruptionBeforeStress: 0.35
  corruptionAfterStress: 0.48
  harmonyBeforeStress: 0.42
  harmonyAfterStress: 0.40

✅ NO ANOMALIES - Test behavior within normal parameters
```

### If Something's Wrong ❌
```
❌ PREREQUISITES FAILED
  → Harmony system not initialized
  → Check HarmonyStabilizationSystem_v1 import in main.js

OR

❌ FAIL: No corruption reduction observed
  → Healing not spreading
  → Check harmony propagation multipliers

OR

❌ FAIL: No oasis zones formed
  → Category clustering not working
  → Check getHarmonyPropagationMultiplier() implementation
```

## Success Checklist

| Criterion | Must Pass |
|-----------|-----------|
| **Harmony spreads** | Peak > 0.2, not 0 |
| **Corruption reduces** | Total reduction > 10% |
| **Oasis forms** | ≥1 zone, ≥3 nodes each |
| **Stress resilient** | Harmony continues after spike |
| **No binary on/off** | Corruption doesn't drop to 0 |

## Key Metrics

**Good harmony healing looks like:**
- Spread rate: 0.01–0.05 units/sec (slow, measured)
- Corruption reduction: 10–30% (partial recovery)
- Oasis zones: 1–3 clusters formed
- Stress spike: +0.1–0.2 corruption (temporary)
- Resilience: <20% harmony drop after stress

**Bad harmony healing looks like:**
- Spread rate: 0 (not moving)
- Corruption reduction: 0 (not working)
- Oasis zones: 0 (no clustering)
- Stress spike: >0.3 corruption (system collapses)
- Resilience: >50% harmony drop (too fragile)

## Commands

| What | Command |
|------|---------|
| Check setup | `validateHarmonyHealingPrerequisites()` |
| Seed corruption | `seedCorruptionForTest(0.45)` |
| Start harmony | `activateHarmonySource(0)` |
| Run test | `runHarmonyHealingTest(20)` |
| Get raw data | `getHarmonyTestReport()` |
| Print report | `printHarmonyTestReport()` |

## Timing

- Prerequisite check: ~100ms
- Corruption seeding: ~50ms
- Harmony activation: ~10ms
- Test execution: 20 seconds
- Report generation: ~50ms

**Total time: ~20–25 seconds**

## Next Steps

1. ✅ Test passes → Document baseline, proceed to fine-tuning
2. ❌ Prerequisite fails → Debug missing system
3. ❌ Weak healing → Increase harmony spread multipliers
4. ❌ Binary behavior → Adjust harmony blocking thresholds
5. ❌ No oasis zones → Check category propagation rates

## Notes

- Non-invasive: Read-only console API
- Non-breaking: Doesn't modify game systems
- Temporary: Test seeding resets after completion
- Observable: All metrics captured every 100ms
- Repeatable: Run multiple times for consistency

**Status:** Ready for testing. Average 20–25 seconds per run.
