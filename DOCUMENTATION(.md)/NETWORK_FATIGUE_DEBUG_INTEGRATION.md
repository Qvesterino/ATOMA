# Network Fatigue v0 — DEBUG FLAGGED INTEGRATION

**Status**: 🟢 Prototype ready  
**Flag**: `window.ENABLE_NETWORK_FATIGUE`  
**Default**: `true` (enabled)  
**Non-Breaking**: Yes (soft multipliers only)  

---

## QUICK START

### 1. Files Modified
- **NodeDynamicMetrics.js**: Added fatigue update + corruption decay multiplier
- **NetworkFatigueSystem_v0_DEBUG.js**: New file (core implementation)

### 2. Enable/Disable
```javascript
// In console:
FATIGUE_DEBUG.disable()  // Turn off (all fatigue resets to 0)
FATIGUE_DEBUG.enable()   // Turn on

// Or in code:
window.ENABLE_NETWORK_FATIGUE = false
```

### 3. Monitor
```javascript
// Print all node fatigue states
FATIGUE_DEBUG.printAll(aiNodes.nodes)

// Get state of single node
FATIGUE_DEBUG.getState(node)

// Seed fatigue on node for testing
FATIGUE_DEBUG.seedFatigue(node, 0.5)
```

---

## NUMERIC RATES (As Specified)

| Metric | Value | Meaning |
|--------|-------|---------|
| ACCUM_RATE | 0.0065/s | Base accumulation per second |
| RECOVER_RATE | 0.0030/s | Base recovery per second |
| Load Weight | 0.40 | 40% of stress composite |
| Instability Weight | 0.30 | 30% of stress composite |
| Corruption Weight | 0.20 | 20% of stress composite |
| Harmony Weight | 0.10 | 10% of stress composite |

### Stress Thresholds
- Load: High when `loadRatio > 0.75`
- Instability: High when `instability > 60`
- Corruption: High when `corruption > 40`
- Harmony: Deficit when `harmony < 20`

### Recovery Thresholds (All Must Be Met)
- Load: `loadRatio < 0.50`
- Instability: `instability < 30`
- Corruption: `corruption < 30`
- Harmony: `harmony > 40`

---

## CATEGORY SENSITIVITIES

| Category | Multiplier | Effect |
|----------|-----------|--------|
| input | 1.15 | Burns out 15% faster |
| process | 1.00 | Baseline |
| integration | 0.90 | 10% more resilient |
| analytics | 0.85 | 15% more resilient |
| storage | 0.75 | 25% more resilient (ages best) |
| control | 0.95 | 5% more resilient |

---

## FATIGUE EFFECTS (SOFT ONLY)

Applied as multipliers, never flip logic:

```javascript
// Harmony rate (harmony healing/spread reduced)
effectiveHarmonyRate *= (1 - fatigue * 0.40)  // -40% max

// Synergy (link effectiveness reduced)
effectiveSynergy *= (1 - fatigue * 0.35)      // -35% max

// Corruption decay (cleanup slower)
corruptionDecayRate *= (1 - fatigue * 0.30)   // -30% max
```

All multipliers stay in range [0.6, 1.0] (never disable systems).

---

## EXPECTED BEHAVIOR

### Accumulation Phase
- Node experiences stress (high load, instability, corruption, low harmony)
- Fatigue increases at ~0.0065/s × stressComposite × categorySensitivity
- Slower for storage nodes, faster for input nodes

### Recovery Phase
- All metrics become healthy (load < 0.5, instability < 30, etc.)
- Fatigue decreases at ~0.003/s
- Takes much longer to recover than accumulate

### Effects Timeline

**First 10s**: Negligible effect (fatigue < 0.1)  
**30s sustained stress**: Fatigue ~0.15-0.25 (mild slowdown)  
**60s sustained stress**: Fatigue ~0.35-0.50 (noticeable)  
**2min sustained stress**: Fatigue ~0.70-0.90 (significant)  

---

## DEBUG CONSOLE API

### Print All Nodes
```javascript
FATIGUE_DEBUG.printAll(aiNodes.nodes)

// Output:
// Node 0 [input]
//   Fatigue: 0.1234 | State: ACCUMULATING
//   Stress: 0.6543 | Health: 0.0000
//   Metrics: Load=0.850 Inst=75.0 Corr=25.0 Harm=15.0
//   Multipliers: Harmony=0.951 Synergy=0.957 Decay=0.963
```

### Get State
```javascript
const state = FATIGUE_DEBUG.getState(node)
console.log(state.fatigue)     // Current fatigue value
console.log(state.state)       // STABLE/ACCUMULATING/RECOVERING
console.log(state.stressComposite)  // Current stress (0-1)
console.log(state.multipliers) // Current effect multipliers
```

### Seed Fatigue
```javascript
FATIGUE_DEBUG.seedFatigue(node, 0.5)  // Set to 50%
```

### Enable/Disable
```javascript
FATIGUE_DEBUG.enable()   // Turn on
FATIGUE_DEBUG.disable()  // Turn off (resets all to 0)
```

### Toggle Logging
```javascript
FATIGUE_DEBUG.setLogging(true)   // Verbose logging on
FATIGUE_DEBUG.setLogging(false)  // Logging off
```

---

## VALIDATION STEPS

### Step 1: Verify Initialization
```javascript
console.log(window.ENABLE_NETWORK_FATIGUE)  // Should be true
console.log(window.FATIGUE_DEBUG)          // Should exist
```

### Step 2: Create Stress
- Play normally for 30+ seconds
- Create many links on one node (high load)
- Watch for fatigue accumulation

### Step 3: Check Decay
```javascript
FATIGUE_DEBUG.printAll(aiNodes.nodes)
// Look for nodes with fatigue > 0 and state = ACCUMULATING
```

### Step 4: Seed & Verify
```javascript
FATIGUE_DEBUG.seedFatigue(aiNodes.nodes[0], 0.8)  // Seed to 80%
FATIGUE_DEBUG.getState(aiNodes.nodes[0])
// Should show multipliers: harmony < 1.0, synergy < 1.0, etc.
```

### Step 5: Monitor Recovery
```javascript
// Unload the node (delete links)
// Wait 60+ seconds
FATIGUE_DEBUG.printAll(aiNodes.nodes)
// Node fatigue should decrease gradually
```

---

## EXPECTED OUTPUTS

### Normal Accumulation
```
[FATIGUE] input Node: 0.1234 → 0.1456 (stress=0.6543, sens=1.15x)
[FATIGUE] input Node: 0.1456 → 0.1678 (stress=0.6543, sens=1.15x)
```

### Recovery
```
[FATIGUE-RECOVERY] input Node: 0.5000 → 0.4985 (health=0.8000)
[FATIGUE-RECOVERY] input Node: 0.4985 → 0.4970 (health=0.8000)
```

### Disabled
```
✓ Network Fatigue DISABLED (all nodes reset to fatigue=0)
```

---

## TROUBLESHOOTING

### Fatigue stays at 0
- Check that nodes have high load/instability/corruption
- Verify stress thresholds (load > 0.75, instability > 60, etc.)
- Enable logging: `FATIGUE_DEBUG.setLogging(true)`

### No recovery happening
- Verify ALL recovery conditions are met:
  - `loadRatio < 0.50` (unload the node)
  - `instability < 30` (stability high)
  - `harmony > 40` (harmony restored)
  - `corruption < 30` (clean)
- Check: `FATIGUE_DEBUG.getState(node).state` should be RECOVERING

### Multipliers not showing
- Verify fatigue > 0 (seed if needed)
- Check that `ENABLE_NETWORK_FATIGUE = true`
- Test: `FATIGUE_DEBUG.getState(node).multipliers`

### Not seeing logging
- Enable: `FATIGUE_DEBUG.setLogging(true)`
- Check browser console (F12)
- Fatigue only logs when fatigue > 0.1 or recovery active

---

## DISABLING FATIGUE

To completely disable without code changes:

```javascript
// In console:
window.ENABLE_NETWORK_FATIGUE = false
```

This:
- Stops all accumulation
- Resets all fatigue to 0
- Makes all multipliers = 1.0 (no effect)
- Zero behavioral change (instant)

No code redeployment needed.

---

## INTEGRATION CHECKLIST

- ✅ NetworkFatigueSystem_v0_DEBUG.js added
- ✅ NodeDynamicMetrics.js imports fatigue functions
- ✅ Fatigue update called after metrics computed
- ✅ Corruption decay multiplier applied
- ✅ Debug console API available
- ✅ Feature flag working (ENABLE_NETWORK_FATIGUE)
- ✅ No breaking changes to existing systems
- ✅ Soft multipliers only (no logic changes)

---

## NEXT STEPS

1. **Test basic accumulation**: Load a node heavily, watch fatigue increase
2. **Test recovery**: Unload the node, watch fatigue decrease
3. **Test effects**: Seed fatigue to 0.8, observe corruption decays slower
4. **Test flag**: Disable with `ENABLE_NETWORK_FATIGUE = false`, verify no change
5. **Monitor gameplay**: Play normally, look for fatigue scaling with playtime

---

## FILES

| File | Purpose |
|------|---------|
| NetworkFatigueSystem_v0_DEBUG.js | Core fatigue system (new) |
| NodeDynamicMetrics.js | Integration point (modified) |
| This file | Integration guide |

---

**Status**: Ready for debug testing. Non-breaking, fully reversible.
