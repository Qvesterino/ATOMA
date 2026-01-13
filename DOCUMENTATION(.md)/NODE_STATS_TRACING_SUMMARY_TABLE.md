# NODE STATS TRACING — SUMMARY TABLE ONLY

## PRIMARY STAT TRACE

| Stat | UI Component | Source File | Property Path | Base / Derived | Updated By | Lines |
|------|--------------|-------------|---|---|---|---|
| **ENERGY** | UINodeInspectPanel | NodeDynamicMetrics.js | `node.userData.metrics.energy` | Derived | Frame loop | 126-143 |
| **STABILITY** | UINodeInspectPanel | NodeDynamicMetrics.js | `node.userData.metrics.stability` | Derived | Frame loop | 146-154 |
| **CLARITY** | UINodeInspectPanel | NodeDynamicMetrics.js | `node.userData.metrics.clarity` | Derived | Frame loop | 165-169 |
| **HARMONY** | UINodeInspectPanel | NodeDynamicMetrics.js | `node.userData.metrics.harmony` | Derived | Frame loop | 159-163 |
| **CORRUPTION** | UINodeInspectPanel | NodeDynamicMetrics.js | `node.userData.metrics.corruption` | Derived | Frame loop | 171-188 |
| **INSTABILITY** | UINodeInspectPanel | NodeDynamicMetrics.js | `node.userData.metrics.instability` | Derived | Frame loop | 156-157 |
| **Link Count** | (Internal) | NodeDynamicMetrics.js | `node.userData.metrics.linkCount` | Derived | Frame loop | 117-119 |
| **Load Ratio** | (Internal) | NodeDynamicMetrics.js | `node.userData.metrics.loadRatio` | Derived | Frame loop | 121 |

---

## NUMERIC CONSTANTS (PRIMARY BALANCING TARGETS)

| Constant | File | Line | Current Value | Use |
|----------|------|------|---|---|
| `energyMaximum` | NodeDynamicMetrics.js | 45 | 120 | Energy cap |
| `energyMinimum` | NodeDynamicMetrics.js | 46 | 0 | Energy floor |
| `energyDecayRate` | NodeDynamicMetrics.js | 47 | 0.15 | Idle energy loss % per sec |
| `energyGainPerLink` | NodeDynamicMetrics.js | 48 | 8 | Energy gained per active link |
| `baseStability` | NodeDynamicMetrics.js | 52 | 60 | Stability baseline (0-100) |
| `loadStressFactor` | NodeDynamicMetrics.js | 53 | 40 | Load pressure on stability |
| `linkCountPenalty` | NodeDynamicMetrics.js | 54 | 2 | Stability loss per link |
| `corruptionDecayRate` | NodeDynamicMetrics.js | 60 | 0.05 | Natural corruption decay % per sec |
| `sigmaCorruptionGain` | NodeDynamicMetrics.js | 62 | 15 | Sigma node corruption gain per sec |
| `emasAlpha` | NodeDynamicMetrics.js | 42 | 0.2 | Smoothing factor (0-1) |
| `defaultLoadMax` | NodeDynamicMetrics.js | 57 | 4 | Node link capacity |

---

## SECONDARY MODIFIERS (SYSTEMS)

| System | File | Role | Affects |
|--------|------|------|---------|
| LinkCorruptionTransmission_v1 | LinkCorruptionTransmission_v1.js | Corruption spread | corruption level, cascades |
| HarmonyStabilizationSystem_v1 | HarmonyStabilizationSystem_v1.js | Harmony interaction | harmony effectiveness |
| NodeDynamicMetrics | NodeDynamicMetrics.js | Core computation | all 6 soft metrics |

---

## ARCHETYPE CATEGORIES (NO GAMEPLAY MODIFIERS YET)

| Layer | Count | Where Defined | Color Scheme |
|-------|-------|---|---|
| CORE | 12 | AINodes.js:153 | Per-category |
| OUTER | 12 | AINodes.js:166 | Per-category |
| EXTREME | 13 | AINodes.js:180 | Per-category |
| SPECIAL | 12 | AINodes.js:195 | Per-category |
| **TOTAL** | **49** | AINodes.js | 9 unique colors |

**Important**: Extreme nodes have NO numeric gameplay modifiers currently assigned

---

## FILES FOR BALANCING

| File | Purpose | Edit For |
|------|---------|----------|
| `/NodeDynamicMetrics.js` | Metric computation | Change lines 40-63 (constants) or lines 123-188 (formulas) |
| `/AINodes.js` | Node creation | Change lines 141-147 (categories) or 737-752 (colors) |
| `/LinkCorruptionTransmission_v1.js` | Corruption spread | Change lines 52-59 (thresholds) or 1524+ (transmission rate) |
| `/HarmonyStabilizationSystem_v1.js` | Harmony effects | TBD (needs tracing) |
| `/UINodeInspectPanel.js` | Display | Read-only (no balancing changes) |

---

## METRIC COMPUTATION SUMMARY

### Energy
```
Base: 50
Gain: +8 per link per second
Decay: -15% when idle (>2 sec)
Cap: 0-120
```

### Stability
```
Base: 60
Load Stress: (1 - loadRatio) × 40
Link Penalty: -2 per link
Formula: BASE + LOAD_STRESS - LINK_PENALTY
Cap: 0-100
```

### Harmony
```
Formula: (stability × 0.7) + ((1 - loadRatio) × 30)
Cap: 0-100
```

### Clarity
```
Formula: 50 + (stability × 0.5 - 30)
Cap: 0-100
```

### Corruption
```
Sigma Gain: +15 per second
Normal Decay: -5% per second
Cap: 0-100
```

### Instability
```
Formula: 100 - stability
Cap: 0-100
```

---

## DATA FLOW (Quick Version)

```
AINodes.js (createNode)
    ↓
SafeMetricsDNAIntegration1_0 (attachMetrics)
    ↓
NodeDynamicMetrics.update() [Per Frame]
    ├→ updateNodeMetrics() [Per Node]
    │   ├→ Compute link metrics
    │   ├→ Calculate energy
    │   ├→ Calculate stability
    │   ├→ Calculate clarity, harmony, corruption
    │   └→ Apply EMA smoothing
    └→ Store in node.userData.metrics
           ↓
LinkCorruptionTransmission_v1.updateTransmission()
    └→ Modifies corruption level
           ↓
UINodeInspectPanel.show()
    └→ Reads metrics, displays to player
```

---

## STATUS

✅ **Energy**: Traced (link-based, decay-based)  
✅ **Stability**: Traced (load-based calculation)  
✅ **Clarity**: Traced (stability-influenced)  
✅ **Harmony**: Traced (stability + load hybrid)  
✅ **Corruption**: Traced (sigma gain / normal decay)  
✅ **Instability**: Traced (inverse of stability)  
✅ **All source files**: Located  
✅ **All numeric constants**: Found  
✅ **All formulas**: Documented  

❌ **Extreme node modifiers**: NOT IMPLEMENTED (no gameplay multipliers)  
❌ **Archetype-specific stats**: NOT IMPLEMENTED  

**Next Task**: Propose numeric adjustments for balancing
