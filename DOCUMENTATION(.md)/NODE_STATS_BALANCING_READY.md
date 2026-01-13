# NODE STATS BALANCING — READY FOR PROPOSALS

**All stat origins traced. Ready for numeric rebalancing.**

---

## WHAT WAS TRACED

✅ **Every stat displayed in Node Inspector is now mapped to:**
- Concrete source file
- Concrete property path  
- Concrete computation formula
- Concrete numeric constant (where applicable)

---

## TRACING SUMMARY

### UI Display Layer
**File**: `/UINodeInspectPanel.js`  
**Display Method**: `_updateContent()` [line 120]  
**Reads**: `node.userData.metrics` object

### Computation Layer (Master)
**File**: `/NodeDynamicMetrics.js`  
**Update Method**: `update(deltaTime)` [line 73]  
**Called**: Every frame from game loop  
**Updates**: All 6 soft metrics + structural metrics

### Node Creation Layer  
**File**: `/AINodes.js`  
**Spawn Method**: `createNode()` [lines 420-730]  
**Attaches**: Metrics object via SafeMetricsDNAIntegration1_0

### Corruption System (Secondary)
**File**: `/LinkCorruptionTransmission_v1.js`  
**Modifies**: Corruption level after frame metrics computed

### Harmony System (Secondary)
**File**: `/HarmonyStabilizationSystem_v1.js`  
**Modifies**: Harmony effectiveness (needs deep tracing)

---

## NUMERIC CONSTANTS FOR BALANCING

### Energy System (NodeDynamicMetrics.js, lines 45-49)
```javascript
energyMaximum: 120
energyMinimum: 0
energyDecayRate: 0.15        // per second when idle
energyGainPerLink: 8          // per link per second
energyIdleThreshold: 2        // seconds before decay
```

### Stability System (NodeDynamicMetrics.js, lines 52-54)
```javascript
baseStability: 60
loadStressFactor: 40          // (1 - loadRatio) × 40
linkCountPenalty: 2           // linkCount × 2
```

### Load System (NodeDynamicMetrics.js, lines 57-58)
```javascript
defaultLoadMax: 4             // node link capacity
```

### Corruption System (NodeDynamicMetrics.js, lines 60-62)
```javascript
corruptionDecayRate: 0.05     // natural decay per second
corruptionGainRate: 2.0       // (unused, old)
sigmaCorruptionGain: 15       // sigma node corruption per sec
```

### Smoothing (NodeDynamicMetrics.js, line 42)
```javascript
emasAlpha: 0.2                // EMA smoothing factor (0-1)
```

---

## METRIC FORMULAS (Ready to Adjust)

### Energy (lines 126-143)
```
newEnergy = previousEnergy
newEnergy += (energyGainPerLink × linkCount × deltaTime)
if (isIdle): newEnergy -= (energyDecayRate × newEnergy × deltaTime)
newEnergy = CLAMP(0, 120)
energy = EMA(newEnergy, alpha=0.2)
```

### Stability (lines 146-154)
```
loadStress = (1 - loadRatio) × loadStressFactor
linkPenalty = linkCount × linkCountPenalty
newStability = MAX(0, baseStability + loadStress - linkPenalty)
newStability = MIN(100, newStability)
stability = EMA(newStability, alpha=0.2)
```

### Harmony (lines 159-163)
```
newHarmony = (stability × 0.7) + ((1 - loadRatio) × 30)
newHarmony = CLAMP(0, 100)
harmony = EMA(newHarmony, alpha=0.2)
```

### Clarity (lines 165-169)
```
newClarity = 50 + (stability × 0.5 - 30)
newClarity = CLAMP(0, 100)
clarity = EMA(newClarity, alpha=0.2)
```

### Corruption (lines 171-188)
```
newCorruption = previousCorruption
if (isSigmaNode):
  newCorruption += (sigmaCorruptionGain × deltaTime)
else:
  newCorruption -= (corruptionDecayRate × newCorruption × deltaTime)
newCorruption = CLAMP(0, 100)
corruption = EMA(newCorruption, alpha=0.2)
```

### Instability (line 157)
```
instability = 100 - stability
```

---

## ARCHETYPE SYSTEM (Ready for Modifiers)

**Current State**: Visual only (no gameplay multipliers)

**Extreme Archetypes** (AINodes.js, lines 180-193):
- 13 EXTREME- archetypes defined
- Each maps to base category
- NO numeric multipliers assigned yet

**Categories**: 9 total (6 standard + 3 special + rare overlays)

**Where Modifiers Should Go**:
- AINodes.js: `getExtremeGameplayModifiers()` (NOT YET IMPLEMENTED)
- NodeDynamicMetrics.js: Consume multiplier in metric formulas
- LinkCorruptionTransmission_v1.js: Apply to corruption resistance

---

## READY FOR REBALANCING

### Tasks You Can Do Now:

1. **Adjust Energy Constants** (NodeDynamicMetrics.js:45-49)
   - Change `energyGainPerLink` from 8 → ?
   - Change `energyDecayRate` from 0.15 → ?
   - Change `energyMaximum` from 120 → ?

2. **Adjust Stability Formulas** (NodeDynamicMetrics.js:52-54, 146-154)
   - Change `baseStability` from 60 → ?
   - Change `loadStressFactor` from 40 → ?
   - Change `linkCountPenalty` from 2 → ?

3. **Adjust Corruption Rates** (NodeDynamicMetrics.js:60-62, 171-188)
   - Change `sigmaCorruptionGain` from 15 → ?
   - Change `corruptionDecayRate` from 0.05 → ?

4. **Add Extreme Node Modifiers** (NEW, AINodes.js + NodeDynamicMetrics.js)
   - Create `getExtremeGameplayModifiers(archetypeId)` function
   - Return multipliers: `{ corruptionResistance, spreadAmplification, harmonyAbsorption, synergySensitivity }`
   - Apply in metric formulas

5. **Adjust Cascade Thresholds** (LinkCorruptionTransmission_v1.js:52-59)
   - Current: 0.45, 0.65, 0.85
   - Adjust as needed

---

## NO CHANGES MADE YET

✅ This is **read-only tracing only**  
✅ No modifications to source code  
✅ No tuning performed  
✅ All values remain at current state  

**Next**: You now have complete visibility to propose and execute rebalancing

---

## FILES REFERENCE

| File | Read For | Change For |
|------|----------|-----------|
| `/NodeDynamicMetrics.js` | Metric formulas | Constants (lines 40-63), formulas (lines 123-188) |
| `/AINodes.js` | Node creation, archetypes | New modifier function needed |
| `/LinkCorruptionTransmission_v1.js` | Cascade system | Thresholds (lines 52-59) |
| `/UINodeInspectPanel.js` | Display layer | Read-only (no changes) |
| `/HarmonyStabilizationSystem_v1.js` | Harmony logic | Needs tracing (not yet traced) |

---

## NEXT STEPS

1. ✅ Trace complete (this document)
2. ⏳ Propose numeric adjustments (pending your decision)
3. ⏳ Test mental impact
4. ⏳ Apply changes via edit_file
5. ⏳ Runtime validation

**Ready to propose rebalancing proposals? Answer the following:**

- Should corruption cascades start slower (0.45 threshold)?
- Should harmony healing be stronger or weaker?
- Should synergy differentiation be per-archetype or per-category?
- How should extreme nodes modify base stats?
- What should cascade "feel" like at each threshold?

---

**Status**: ✅ Ready for balancing proposals
