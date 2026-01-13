# NODE STATS SOURCE TRACING REPORT
**Complete Data Flow: UI Display → Property Path → Source File**

---

## STAT ORIGIN TRACE TABLE

| Stat | UI Component | Property Path | Source File | Base/Derived | Updated By |
|------|--------------|---|---|---|---|
| **ENERGY** | UINodeInspectPanel | `node.userData.metrics.energy` | NodeDynamicMetrics.js (line 45) | Derived | `_updateNodeMetrics()` every frame (line 73) |
| **STABILITY** | UINodeInspectPanel | `node.userData.metrics.stability` | NodeDynamicMetrics.js (line 52) | Derived | `_updateNodeMetrics()` every frame |
| **CLARITY** | UINodeInspectPanel | `node.userData.metrics.clarity` | NodeDynamicMetrics.js (line 166) | Derived | `_updateNodeMetrics()` per frame |
| **HARMONY** | UINodeInspectPanel | `node.userData.metrics.harmony` | NodeDynamicMetrics.js (line 159) | Derived | `_updateNodeMetrics()` per frame |
| **CORRUPTION** | UINodeInspectPanel | `node.userData.metrics.corruption` | NodeDynamicMetrics.js (line 171) | Derived | `_updateNodeMetrics()` per frame |
| **INSTABILITY** | UINodeInspectPanel | `node.userData.metrics.instability` | NodeDynamicMetrics.js (line 156) | Derived | `_updateNodeMetrics()` per frame |
| **Link Count** | (Internal) | `node.userData.metrics.linkCount` | NodeDynamicMetrics.js (line 117) | Derived | `_computeLinkMetrics()` per frame |
| **Load Ratio** | (Internal) | `node.userData.metrics.loadRatio` | NodeDynamicMetrics.js (line 121) | Derived | Computed from linkCount per frame |
| **Last Active** | (Internal) | `node.userData.metrics.lastActiveSeconds` | NodeDynamicMetrics.js (line 191) | Derived | Time tracking per frame |

---

## PRIMARY STAT SOURCE FILES

### 1. **NodeDynamicMetrics.js** (Master Metrics Computation)
**Role**: Single source of truth for all node metrics  
**Update Frequency**: Every frame (called from game loop)  
**Entry Point**: `update(deltaTime)` → line 73

**Metric Definitions** (lines 282-303):
```javascript
_createBlankMetrics() {
  return {
    linkCount: 0,
    incomingLinks: 0,
    outgoingLinks: 0,
    loadMax: defaultLoadMax,
    loadRatio: 0,
    
    // 0-100 scale soft metrics
    energy: 50,
    stability: 60,
    harmony: 50,
    instability: 40,
    clarity: 50,
    corruption: 0,
    
    // Time-based
    lastActiveSeconds: 0,
    updatedAt: Date.now()
  };
}
```

**Numeric Constants** (lines 40-63):
| Constant | Value | Use |
|----------|-------|-----|
| `energyMaximum` | 120 | Energy cap |
| `energyMinimum` | 0 | Energy floor |
| `energyDecayRate` | 0.15 | Idle decay %/sec |
| `energyGainPerLink` | 8 | Per link bonus |
| `energyIdleThreshold` | 2 sec | Before decay starts |
| `baseStability` | 60 | Stability baseline |
| `loadStressFactor` | 40 | Load → stability penalty |
| `linkCountPenalty` | 2 | Per-link stability cost |
| `defaultLoadMax` | 4 | Node capacity |
| `corruptionDecayRate` | 0.05 | Natural decay %/sec |
| `corruptionGainRate` | 2.0 | Sigma corruption gain |
| `sigmaCorruptionGain` | 15 | Per-second sigma gain |

---

### 2. **UINodeInspectPanel.js** (UI Display Layer)
**Role**: Read-only display of metrics  
**Update Trigger**: Node selection (manual, not automatic)  
**Read Point**: `_updateContent()` → line 120

**Display Reads**:
- Energy: `metrics.energy || 0` (line 172)
- Stability: `metrics.stability || 0` (line 173)
- Clarity: `metrics.clarity || 0` (line 174)
- Harmony: `metrics.harmony || 0` (line 175)
- Corruption: `metrics.corruption || 0` (line 176)
- Instability: `metrics.instability || 0` (line 177)

**Safety**: Pure read access - no mutations

---

### 3. **AINodes.js** (Node Creation & Archetype)
**Role**: Node spawning, categorization, archetype assignment  
**Critical Sections**:

**Base Category Definition** (lines 141-147):
```javascript
this.nodeCategories = ['input', 'process', 'integration', 'analytics', 'storage', 'control'];
this.specialNodeTypes = ['sigma', 'quantum', 'emotional'];
this.newNodeCategories = ['mythic', 'prime', 'error'];
```

**Color Schemes** (lines 737-752):
```javascript
getLayerColorScheme(category) {
  const schemes = {
    'input': { primary: 0x00dddd, secondary: 0x0099ff },
    'process': { primary: 0x0066ff, secondary: 0x3399ff },
    // ... etc per category
  };
}
```

**Node Spawn** (lines 420-730):
- Creates node with category
- Attaches userData with metrics attachment
- Calls SafeMetricsDNAIntegration1_0.attachMetrics() (line 686)

**Extreme Archetype Assignment** (lines 1752-1757):
```javascript
const EXTREME_SPAWN_CHANCE = 0.15;
if (Math.random() < EXTREME_SPAWN_CHANCE) {
  newNode.userData.isExtreme = true;
  newNode.userData.extremeArchetype = Math.floor(Math.random() * 12);
  newNode.userData.extremeTier = 1;
}
```

---

### 4. **SafeMetricsDNAIntegration1_0.js** (Metrics Attachment)
**Role**: Initial metrics metadata attachment to nodes  
**Called During**: Node spawn (AINodes.js, line 686)  
**Impact**: Read-only metadata only

---

## SECONDARY MODIFIERS (Systems that Change Stats)

### A. LinkCorruptionTransmission_v1.js
**Affects**: Corruption level  
**Method**: `updateLinkCorruption()` → `applyLinkCorruptionVisuals()`  
**Impact**: Modifies link-level corruption, triggers cascades at thresholds

### B. HarmonyStabilizationSystem_v1.js
**Affects**: Harmony level  
**Method**: Reads harmony from nodes, applies stabilization effects  
**Impact**: Counteracts corruption spread

### C. NodeDynamicMetrics.js (Frame Loop)
**Affects**: All metrics (energy, stability, clarity, harmony, corruption, instability)  
**Method**: EMA smoothing + load-based calculations  
**Frequency**: Every frame

---

## METRIC COMPUTATION FORMULAS

### Energy (lines 126-143)
```
newEnergy = previousEnergy
newEnergy += energyGainPerLink × linkCount × deltaTime
if (isIdle && idleTime > 2 sec):
  newEnergy -= energyDecayRate × newEnergy × deltaTime
newEnergy = CLAMP(newEnergy, 0, 120)
energy = EMA(newEnergy, previousEnergy, alpha=0.2)
```

### Stability (lines 146-154)
```
loadStress = (1 - loadRatio) × loadStressFactor  // (1 - ratio) × 40
linkPenalty = linkCount × linkCountPenalty       // count × 2
newStability = MAX(0, baseStability + loadStress - linkPenalty)
newStability = MIN(100, newStability)
stability = EMA(newStability, previousStability, alpha=0.2)
```

### Harmony (lines 159-163)
```
newHarmony = (stability × 0.7) + ((1 - loadRatio) × 30)
newHarmony = CLAMP(newHarmony, 0, 100)
harmony = EMA(newHarmony, previousHarmony, alpha=0.2)
```

### Clarity (lines 165-169)
```
newClarity = 50 + (stability × 0.5 - 30)
newClarity = CLAMP(newClarity, 0, 100)
clarity = EMA(newClarity, previousClarity, alpha=0.2)
```

### Corruption (lines 171-188)
```
newCorruption = previousCorruption
if (isSigmaNode):
  newCorruption += sigmaCorruptionGain × deltaTime  // +15/sec
else:
  newCorruption -= corruptionDecayRate × newCorruption × deltaTime  // -5% decay
newCorruption = CLAMP(newCorruption, 0, 100)
corruption = EMA(newCorruption, previousCorruption, alpha=0.2)
```

### Instability (line 157)
```
instability = 100 - stability
```

---

## EXTREME NODE MODIFIERS (Currently Minimal/Not Implemented)

### Current State:
- Extreme flag: `node.userData.isExtreme = true` (random 15% chance)
- Extreme archetype: `node.userData.extremeArchetype` (0-11 random index)
- Extreme tier: `node.userData.extremeTier = 1` (always 1)
- Visual pack: `_ExtremeNodeArchetypes_SafePack.js` (12 visual archetypes, non-gameplay)

### Missing:
❌ Numeric gameplay modifiers for extreme nodes  
❌ Corruption resistance multipliers  
❌ Corruption spread amplification multipliers  
❌ Harmony absorption rate multipliers  
❌ Synergy sensitivity adjustments  

**Status**: Extreme nodes have VISUAL differences only, NO gameplay stat modifiers currently

---

## ARCHETYPE CATEGORIES (From AINodes.js lines 151-215)

### CORE Layer (12 archetypes):
| Archetype | Category | Color |
|-----------|----------|-------|
| CORE-HARMONIC-RESONANT | process | Blue |
| CORE-QUANTUM-ENTANGLED | quantum | Indigo |
| CORE-CHAOS-FRACTURED | error | Red |
| CORE-STELLAR-ASCENDED | mythic | Gold |
| CORE-PRIME-PERFECT | prime | White |
| CORE-VOID-SILENT | control | Amber |
| CORE-FLUX-ADAPTIVE | integration | Violet |
| CORE-NEXUS-CONVERGENT | storage | Teal |
| CORE-ECHO-RECURSIVE | analytics | Magenta |
| CORE-SURGE-DYNAMIC | input | Cyan |
| CORE-STATIC-ANCHORED | storage | Teal |
| CORE-WHISPER-SUBTLE | integration | Violet |

### OUTER Layer (12 archetypes):
| Archetype | Category |
|-----------|----------|
| OUTER-RADIANT-EXPANSIVE | input |
| OUTER-SPIRAL-TEMPORAL | analytics |
| OUTER-VOID-ABSORBING | error |
| OUTER-CROWN-SOVEREIGN | mythic |
| OUTER-LATTICE-PERFECT | prime |
| OUTER-PULSE-RHYTHMIC | control |
| OUTER-TIDE-FLOWING | integration |
| OUTER-DEPTH-PROFOUND | storage |
| OUTER-SPARK-VIVID | process |
| OUTER-SHADOW-VEILED | analytics |
| OUTER-STORM-TURBULENT | error |
| OUTER-LIGHT-ETERNAL | mythic |

### EXTREME Layer (13 archetypes):
| Archetype | Category | Role |
|-----------|----------|------|
| EXTREME-SINGULARITY-DENSE | prime | High concentration |
| EXTREME-ENTROPY-CHAOTIC | error | Corruption amplifier |
| EXTREME-INFINITY-BOUNDLESS | mythic | Unlimited potential |
| EXTREME-NEXUS-INFINITE | process | Hub node |
| EXTREME-VOID-ABSOLUTE | error | Total void |
| EXTREME-APOTHEOSIS-ASCENDED | mythic | Highest tier |
| EXTREME-PARADOX-UNSTABLE | error | Unstable |
| EXTREME-ZENITH-PINNACLE | prime | Peak perfect |
| EXTREME-VOID-CONSUMING | error | Corruption spreader |
| EXTREME-HARMONIC-PERFECT | prime | Stability anchor |
| EXTREME-CHAOS-PRIMORDIAL | error | Chaos source |
| EXTREME-TRANSCENDENT-ETERNAL | mythic | Transcendent |
| EXTREME-BALANCE-EQUILIBRIUM | integration | Balanced node |

### SPECIAL Layer (12 archetypes for multi-output nodes):
| Archetype | Category |
|-----------|----------|
| SPECIAL-SIGMA-DIMENSIONAL | sigma |
| SPECIAL-QUANTUM-SUPERPOSED | quantum |
| SPECIAL-EMOTIONAL-RESONANT | emotional |
| ... (9 more) | |

---

## DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                         GAME LOOP (Per Frame)                   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │ NodeDynamicMetrics       │
                    │ .update(deltaTime)       │
                    │ [Line 73]                │
                    └──────────────────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
                ▼                 ▼                 ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │ Compute Link │  │ Compute      │  │ Apply EMA    │
        │ Metrics      │  │ Energy,      │  │ Smoothing    │
        │ [Line 116]   │  │ Stability,   │  │ [Line 272]   │
        │              │  │ Harmony      │  │              │
        │ → linkCount  │  │ [Lines       │  │ → All 0-100  │
        │ → loadRatio  │  │  123-188]    │  │   metrics    │
        └──────────────┘  └──────────────┘  └──────────────┘
                │                 │                 │
                └─────────────────┼─────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │ Store in                 │
                    │ node.userData.metrics    │
                    │ {energy, stability,      │
                    │  harmony, clarity,       │
                    │  corruption,             │
                    │  instability, ...}       │
                    └──────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │ LinkCorruptionTransmission_v1 │
                    │ .updateTransmission()    │
                    │ [Updates corruption]     │
                    └──────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │ HarmonyStabilizationSystem_v1  │
                    │ .updateHarmony()         │
                    │ [Modulates harmony]      │
                    └──────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │ UINodeInspectPanel       │
                    │ (On Node Selection)      │
                    │ .show(node)              │
                    │ Reads:                   │
                    │ metrics.energy, etc.     │
                    │ [Display to Player]      │
                    └──────────────────────────┘
```

---

## STATISTICS

### Total Metrics per Node: **9**
1. Energy (0-120)
2. Stability (0-100)
3. Clarity (0-100)
4. Harmony (0-100)
5. Corruption (0-100)
6. Instability (0-100, derived)
7. Link Count (integer)
8. Load Ratio (0-1 normalized)
9. Last Active Time (seconds)

### Archetype Categories: **49 Total**
- Core Layer: 12
- Outer Layer: 12
- Extreme Layer: 13
- Special Layer: 12

### Node Base Categories: **9 Total**
- Standard: 6 (input, process, integration, analytics, storage, control)
- Special: 3 (sigma, quantum, emotional)
- Rare: 3 (mythic, prime, error)
- Extreme: (49 total, cross-cutting)

### Update Frequency: **Every Frame (60 FPS)**
- 60 nodes × 9 metrics × 60 FPS = 32,400 metric calculations per second
- EMA smoothing prevents visual flickering
- All calculations O(n) with caching

---

## MISSING/TODO ITEMS FOR BALANCING

### Not Yet Implemented:
❌ Extreme node gameplay multipliers (stats-based)  
❌ Corruption resistance per archetype  
❌ Corruption amplification (for chaos/error nodes)  
❌ Harmony absorption modifiers  
❌ Synergy sensitivity differences  
❌ Dynamic stat changes during gameplay  
❌ Stat degradation from corruption  
❌ Stat enhancement from harmony  

### Current Scope (Read-Only Visual Metrics):
✅ Energy calculation based on links  
✅ Stability calculation based on load  
✅ Harmony calculation based on stability & load  
✅ Clarity calculation based on stability  
✅ Corruption generation (sigma nodes)  
✅ Corruption decay (normal nodes)  
✅ Instability as inverse of stability  

---

## KEY FILES FOR BALANCING

| File | Purpose | Lines | Edit For |
|------|---------|-------|----------|
| NodeDynamicMetrics.js | Metric computation | 40-63, 123-188 | Numeric constants, formulas |
| AINodes.js | Node creation | 141-147, 737-752 | Category definitions, colors |
| LinkCorruptionTransmission_v1.js | Corruption spread | 52-59, 1524+ | Cascade thresholds, transmission rates |
| HarmonyStabilizationSystem_v1.js | Harmony effects | TBD | Harmony interaction with corruption |
| UINodeInspectPanel.js | Display layer | 172-177 | Display order/formatting (read-only) |

---

**Status**: ✅ All stats traced from UI to source  
**Next Step**: Propose numeric balancing adjustments (separate task)
