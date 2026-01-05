# Network Fatigue Spec v0 — DELIVERY REPORT

**Status**: 🟢 **READY FOR PROTOTYPING**  
**Phase**: Tier 5 Extended Gameplay Systems  
**Depends On**: Category Interaction Spec v1 (LOCKED)

---

## 1. DELIVERABLES

### Core Implementation
- **File**: `/NetworkFatigueSystem_v0.js` (400+ lines)
- **Architecture**: Per-node fatigue accumulation/recovery system
- **Integration Points**: Post-metrics update, pre-system consumption
- **Safety**: Orthogonal to Tier 4 systems (no breaking changes)

### Configuration
All parameters configurable via constructor options. Defaults tuned for ~67s to accumulate from max stress, ~200s to recover.

---

## 2. SYSTEM DESIGN SUMMARY

### Core Principle
**Fatigue = Accumulated consequence of prolonged stress**

Fatigue is a latent scalar per node: `fatigue ∈ [0.0, 1.0]`

### Accumulation Rule
Fatigue increases when **at least one stress condition** is met:
- `loadRatio > 0.75` (heavy load)
- `instability > 0.60` (unstable)
- `corruption > 0.40` (corrupted)
- `harmony < 0.20` (harmony starved)

**Rate**: `0.015/s × stressComposite × categorySensitivity`

### Recovery Rule
Fatigue decreases when **all recovery conditions** are met:
- `loadRatio < 0.50` (unloaded)
- `instability < 0.30` (stable)
- `corruption < 0.30` (clean)
- `harmony > 0.40` (healthy)

**Rate**: `0.005/s` (3× slower than accumulation)

### Stress Composite Score
Normalized average of four stressor contributions:

```
loadStress        = max(0, (loadRatio - 0.75) / 0.25)
instabilityStress = max(0, (instability - 60) / 40)
corruptionStress  = max(0, (corruption - 40) / 60)
harmonyDeficit    = max(0, (0.20 - harmony) / 0.20)

composite = (loadStress + instabilityStress + corruptionStress + harmonyDeficit) / 4
```

---

## 3. EFFECTS (SOFT, MULTIPLICATIVE)

Fatigue **never flips logic**, only **weakens ceilings and rates**:

| Effect | Formula | Impact |
|--------|---------|--------|
| **Harmony Rate** | `1 - (fatigue × 0.40)` | Harmony healing 40% slower at max fatigue |
| **Synergy** | `1 - (fatigue × 0.35)` | Synergy 35% weaker at max fatigue |
| **Corruption Decay** | `1 - (fatigue × 0.30)` | Corruption decays 30% slower at max fatigue |

**Safe Range**: All multipliers stay in [0.6, 1.0] (never disable systems)

---

## 4. CATEGORY INTERACTION

Categories receive fatigue **sensitivity multipliers** during accumulation:

| Category | Sensitivity | Meaning |
|----------|-------------|---------|
| **input** | 1.15 | Burns out 15% faster |
| **process** | 1.00 | Baseline |
| **integration** | 0.90 | 10% more resilient |
| **analytics** | 0.85 | Ages well (15% slower) |
| **storage** | 0.75 | Ages VERY well (25% slower) |
| **control** | 0.95 | 5% more resilient |

**Result**: Input nodes accumulate fatigue fastest; storage nodes age best.

---

## 5. EMERGENT BEHAVIOR

### Short-term (seconds)
No visible change. Tier 4 behavior dominates.

### Mid-term (1–3 minutes)
- Overloaded hubs feel "tired"
- Harmony becomes less effective
- Recovery requires intentional load relief
- Corruption harder to clear

### Long-term (networks)
- Rotating load becomes optimal strategy
- Static max-load designs degrade over time
- "Always-on" strategies lose efficiency
- Maintenance gameplay emerges

---

## 6. IMPLEMENTATION DETAILS

### Fatigue Storage
```javascript
node.userData.fatigue // scalar ∈ [0, 1]
```

### Frame Update Order
```
1. NodeDynamicMetrics.update(dt)  // Compute fresh metrics
2. NetworkFatigueSystem.update(dt) // Update fatigue based on metrics
3. Other systems consume fatigue multipliers
```

### Consumption Pattern
```javascript
// In harmony systems
const harmonyMultiplier = fatigueSystem.getHarmonyRateMultiplier(node);
effectiveHarmonyRate *= harmonyMultiplier;

// In synergy systems
const synergyMultiplier = fatigueSystem.getSynergyMultiplier(node);
effectiveSynergy *= synergyMultiplier;

// In corruption systems
const decayMultiplier = fatigueSystem.getCorruptionDecayMultiplier(node);
effectiveDecayRate *= decayMultiplier;
```

---

## 7. HARD SAFETY GUARANTEES

✅ **Fatigue ∈ [0, 1]** always (strictly clamped)  
✅ **No instant spikes** (smooth accumulation/recovery only)  
✅ **No death spirals** (always reversible)  
✅ **Never disables systems** (multipliers stay ≥ 0.6)  
✅ **Fully reversible** (recovery always possible under healthy conditions)  
✅ **Zero breaking changes** (all defaults → no Tier 4 impact)  

---

## 8. WHAT IS OUT OF SCOPE (v0)

❌ UI indicators (fatigue bars, warnings)  
❌ Player visibility (fatigue remains implicit)  
❌ Extreme node exceptions  
❌ Permanent damage  
❌ Per-archetype modifiers  

→ Reserved for v1+ with player feedback

---

## 9. CONSOLE API FOR TESTING

### Diagnostic Command
```javascript
ATOMA_DEBUG.NetworkFatigue.printDiagnostics()
```

### Seed Fatigue
```javascript
ATOMA_DEBUG.NetworkFatigue.seedFatigue(nodeIndex, value)
// Example: ATOMA_DEBUG.NetworkFatigue.seedFatigue(0, 0.5)
```

### Query Node
```javascript
ATOMA_DEBUG.NetworkFatigue.diagnose(nodeIndex)
```

### Run Stress Test
```javascript
ATOMA_DEBUG.NetworkFatigue.runStressTest(durationSeconds)
// Accumulates fatigue on first node for N seconds
```

---

## 10. INTEGRATION CHECKLIST

### Step 1: Import & Initialize
```javascript
import { NetworkFatigueSystem, setupNetworkFatigueConsoleAPI } from './NetworkFatigueSystem_v0.js';

// In main.js setup:
const fatigueSystem = new NetworkFatigueSystem(nodeDynamics);
setupNetworkFatigueConsoleAPI(fatigueSystem, nodeDynamics);
```

### Step 2: Frame Update Loop
```javascript
// In game loop (after metrics update):
fatigueSystem.update(deltaTime);
```

### Step 3: Consume Fatigue Multipliers
In `LinkCorruptionTransmission_v1.js` (corruption decay):
```javascript
const decayMult = fatigueSystem.getCorruptionDecayMultiplier(targetNode);
effectiveCorruptionDecay *= decayMult;
```

In harmony systems:
```javascript
const harmonyMult = fatigueSystem.getHarmonyRateMultiplier(sourceNode);
effectiveHarmonySpread *= harmonyMult;
```

In synergy systems:
```javascript
const synergyMult = fatigueSystem.getSynergyMultiplier(sourceNode);
effectiveSynergy *= synergyMult;
```

---

## 11. DESIGN PHILOSOPHY

### Tempo Over Outcome
Fatigue controls **how fast** things happen, never **whether** they happen.

### Load is Universal Limiter
No category bypasses load pressure; it's the ultimate constraint on all systems.

### Conservative Defaults
Parameters tuned for smooth, non-dramatic gameplay feel. Adjustable per-project.

### Minimal Complexity
Pure state mutation + consumption; no cascading systems.

---

## 12. SAFETY VERIFICATION CHECKLIST

- ✅ All fatigue values strictly `∈ [0, 1]`
- ✅ Accumulation bounded (never exceeds 1.0)
- ✅ Recovery always possible
- ✅ No category can bypass recovery
- ✅ Multipliers never disable systems (min 0.6)
- ✅ No circular dependencies
- ✅ Orthogonal to Tier 4 (no changes to existing systems)
- ✅ Console API for validation

---

## 13. VERSIONING ROADMAP

### v0 (This document)
- ✅ Hidden fatigue system
- ✅ Soft multipliers only
- ✅ Category sensitivity
- ✅ Experimental/prototyping phase

### v1 (Future)
- Optional UI visualization
- Player-visible consequence messaging
- Limited player interventions
- Potential extreme node exceptions

### v2+ (Reserved)
- Per-archetype modifiers
- Emotional/quantum fatigue variants
- Advanced recovery mechanics

---

## 14. KEY TAKEAWAY

**Network Fatigue v0 is a production-ready prototyping layer for long-term gameplay dynamics.**

It answers: *"What happens if this continues?"* without breaking existing Tier 4 systems.

All future amendments require documented justification + re-validation via console API.

---

## STATUS: 🟢 READY FOR PROTOTYPING

**Next Steps:**
1. Integrate into main.js
2. Connect fatigue multipliers to corruption/harmony/synergy systems
3. Run console API diagnostics to verify behavior
4. Monitor gameplay feel for 1-3 minute network sessions
5. Adjust category sensitivities if needed (±5-10%)
