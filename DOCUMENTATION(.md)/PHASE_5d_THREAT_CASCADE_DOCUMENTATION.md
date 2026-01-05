# Phase 5d: Threat Cascade — Bidirectional Resonance Amplification

## Overview

**Phase 5d** makes resonance truly bidirectional. Where Phase 5c amplifies healing propagation, **Phase 5d amplifies corruption threat propagation** through the same resonance-weighted mechanism.

Resonance is now **neutral**: it amplifies whatever flows through the network—healing or corruption.

---

## Design Intent

### Core Concept
Well-optimized clusters are more efficient at **everything**: propagating restoration AND transmitting pressure.

This introduces strategic tension:
- Build strong clusters to heal faster (Phase 5c)
- But under attack, those clusters also spread threat faster (Phase 5d)

### Why This Matters
1. **Resonance becomes neutral:** Not a defensive bonus—an amplifier
2. **Risk-reward emerges:** Power clustering has costs
3. **Strategic depth:** Players must decide when to optimize
4. **Bidirectional flow:** Energy flows in both directions through coherence

---

## Mechanic: Resonance-Weighted Threat Decay

### Formula

```
effectiveDecay = BASE_THREAT_DECAY / resonanceFactor
```

Where:
- **BASE_THREAT_DECAY** = 0.5 (default: 50% per hop)
- **resonanceFactor** = 1.0 to 1.15 (from Phase 5, 5a, 5b combined)

### Examples

| Resonance | Calculation | Effective Decay | Threat Transmitted | Impact |
|-----------|-------------|-----------------|---------------------|--------|
| 1.00 (none) | 0.5 / 1.00 | 0.50 | 50% to next hop | Standard spread |
| 1.05 (light) | 0.5 / 1.05 | 0.48 | 52% to next hop | +2% range |
| 1.10 (strong) | 0.5 / 1.10 | 0.45 | 55% to next hop | +5% range |
| 1.15 (max) | 0.5 / 1.15 | 0.43 | 57% to next hop | +7% range |

### Safety Clamping

After calculating effective decay, we clamp to safe bounds:

```
effectiveDecay = clamp(effectiveDecay, 0.35, 0.6)
```

- **Minimum (0.35):** Threat can transmit up to 65% strength per hop
- **Maximum (0.6):** Threat still decays at least 40% per hop

**Result:** Threat still always decays. Never grows per hop.

---

## Implementation Details

### Location
**File:** `LinkCorruptionTransmission_v1.js`

**Trigger:** `checkCascadeThresholds()` when link corruption ≥ 0.5 (line ~521)

**Method:** `initiateThreatCascadeFromLink()` (lines ~1064-1150)

### How It Works

1. **Corruption threshold reached** (≥ 50% on a link)
2. **Phase 5d checks:** THREAT_CASCADE_THRESHOLDS.ENABLED and threatCascadeEnabled
3. **Threat cascade initiates** with corruption level as strength
4. **For each hop:**
   - Get resonance factor
   - Calculate: `effectiveDecay = 0.5 / resonanceFactor`
   - Clamp to safe bounds: `[0.35, 0.6]`
   - Apply: `threatPressure = strength × effectiveDecay × 0.05`
   - Boost existing link corruption slightly
   - Recurse to next level (max depth 3)

### Key Difference from Phase 5c

**Phase 5c (Healing Cascade):**
- Triggered by link reaching zero corruption
- Heals connected links
- Reduces synergy/harmony stress

**Phase 5d (Threat Cascade):**
- Triggered by link reaching high corruption (50%)
- Accelerates corruption in connected links
- Increases network stress
- Counterbalance to healing

---

## Configuration

### Thresholds (LinkCorruptionTransmission_v1.js)

```javascript
const THREAT_CASCADE_THRESHOLDS = {
  ENABLED: true,                  // Can disable threat cascade for testing
  THREAT_ACTIVATION_LEVEL: 0.5,   // Corruption level required (50%)
  BASE_THREAT_DECAY: 0.5,         // Default decay (50% per hop)
  DECAY_MIN: 0.35,                // Hard minimum decay
  DECAY_MAX: 0.6,                 // Hard maximum decay
  HISTORY_LIMIT: 100              // Debug history
};
```

### Tuning Guide

| Parameter | Current | Effect | Range |
|-----------|---------|--------|-------|
| `THREAT_ACTIVATION_LEVEL` | 0.5 | Corruption needed to trigger threat | 0.3-0.7 |
| `DECAY_MIN` | 0.35 | Max threat transmission per hop | 0.20-0.50 |
| `DECAY_MAX` | 0.60 | Min threat transmission per hop | 0.50-0.80 |

**Conservative:** `ACTIVATION: 0.6, DECAY_MIN: 0.45, DECAY_MAX: 0.55`
**Aggressive:** `ACTIVATION: 0.4, DECAY_MIN: 0.25, DECAY_MAX: 0.65`

---

## Behavioral Examples

### Scenario 1: Non-Resonant Network

```
Link corruption: 0.5 (triggers threat cascade)
Resonance: 1.0 (no boost)
Decay: 0.5 / 1.0 = 0.5 (standard)
Result: Threat follows normal decay (50% per hop)
Phase 5d impact: None
```

### Scenario 2: Dense Optimized Cluster Under Attack

```
Link corruption: 0.7 (high threat)
Resonance: 1.10 (well-optimized neighborhood)
Decay: 0.5 / 1.10 = 0.45 (reduced)
Result: Threat travels further (45% decay instead of 50%)
Phase 5d impact: +5% threat transmission range
Risk: Strong clusters are also efficient at spreading stress
```

### Scenario 3: Cascading Threat Through Multiple Hops

```
Initial threat cascade strength: 0.7 (link corruption)

Hop 1 (resonance 1.10):
  decay = 0.5 / 1.10 = 0.45
  threat pressure = 0.7 × 0.45 × 0.05 = 0.016
  applied to next link corruption

Hop 2 (resonance 1.10):
  decay = 0.45
  threat pressure = 0.315 × 0.45 × 0.05 = 0.007
  applied to next link corruption

Hop 3 (depth limit):
  cascade stops
```

---

## Safety Constraints ✅

✅ **Threat still decays every hop** (minimum 40% decay)
✅ **No cascade ever grows** (strictly decreases per hop)
✅ **Hard cap on hop count** (MAX_CASCADE_DEPTH = 3)
✅ **Resonance is read-only** (no mutations)
✅ **No Synergy mutation**
✅ **No Harmony mutation**
✅ **No memory/persistence** (transient effects only)
✅ **Toggleable** (via ENABLED flag or debug API)

---

## Comparison: Phase 5c vs 5d

| Aspect | Phase 5c (Healing) | Phase 5d (Threat) |
|--------|-------------------|-------------------|
| Trigger | Healing cascade (link → 0) | Threat cascade (link ≥ 50%) |
| Effect | Reduces corruption | Accelerates corruption |
| Formula | Same decay modification | Same decay modification |
| Intent | Make healing flow further | Make threat flow further |
| Risk | None (purely beneficial) | Substantial (risk trade-off) |
| Symmetry | Mirrors Phase 5d | Mirrors Phase 5c |

---

## Debug API

### Commands

#### Toggle Phase 5d
```javascript
window.linkCorruptionDebug.toggleThreatCascade();
// Output: "[LinkCorruptionTransmission] Threat cascade: true"
```

#### View Recent Threat Events
```javascript
window.linkCorruptionDebug.threatCascadeStats();
// Returns: Recent 20 threat cascade events with decay info
```

#### Analyze All Threat Sources
```javascript
window.linkCorruptionDebug.threatCascadeInfo();
// Returns: All links with corruption ≥ 0.5 and their threat potential
```

### Example Output

```
threatCascadeStats():
┌─────────────────────────────────────────────────────┐
│ linkId │ resonance │ decay │ improvement │ depth │
├─────────────────────────────────────────────────────┤
│ L-1-2  │   1.08    │ 0.463 │    7.4%    │   2   │
│ L-2-3  │   1.12    │ 0.446 │   10.8%    │   3   │
└─────────────────────────────────────────────────────┘

Summary:
- Total events: 23
- Avg decay reduction: 0.0156
- Threat cascade enabled: true
```

---

## Integration with Other Phases

### Phase 1-2: Blocking
- **Unchanged:** Synergy and harmony still block corruption
- **New:** Under resonance, threat also travels faster
- **Net effect:** Blocking helps, but threat penetrates optimized zones

### Phase 3: Healing
- **Unchanged:** Healing still triggers at harmony ≥ 0.85
- **New:** Under resonance, healing travels faster (Phase 5c)
- **Symmetry:** Now balanced by threat traveling faster too (Phase 5d)

### Phase 5-5c: Resonance
- **Healing:** Phase 5c modulates healing cascade decay
- **Threat:** Phase 5d modulates threat cascade decay
- **Result:** Resonance amplifies both directions

---

## Gameplay Implications

### Strategic Tension

**Before Phase 5d:**
- Optimize network → Healing flows faster → Pure benefit

**With Phase 5d:**
- Optimize network → Healing flows faster AND threat flows faster
- Players must balance defensive clustering with vulnerability

### Decision Points

1. **Early game:** Spread out (no resonance yet, low risk)
2. **Mid game:** Start clustering (resonance activates, healing improves)
3. **Late game:** Dense clusters are powerful but risky under pressure
4. **Threat response:** Must increase harmony/synergy to handle faster threat

### Emergent Behaviors

- **Resilient defense:** Well-built networks resist threats better
- **Dangerous growth:** Clusters must be maintained carefully
- **Healing races:** Healing vs threat become parallel challenges
- **Strategic nodes:** Some nodes become pressure release valves

---

## Performance

### Computational Overhead

**Per threat cascade hop:**
- One `computeResonanceAmplification()` call: O(1) with caching
- Division, clamp, and pressure calculations: < 0.1ms

**Total impact:** < 0.5ms per frame for moderate threats

### Memory

- `threatCascadeHistory` Map: ~100 entries max (~8KB)
- No additional per-link state

### Optimization

- Caching via `linkNeighborCache` (shared with Phase 5)
- Only triggers when corruption ≥ 0.5 (not every frame)
- Recursive depth capped at 3 hops

---

## Testing Checklist

- [ ] Threat cascade doesn't trigger when corruption < 0.5
- [ ] Threat correctly decays with resonance: 0.5 / 1.1 = 0.45
- [ ] Decay clamps prevent < 0.35 or > 0.6
- [ ] Cascade stops at depth 3 regardless of resonance
- [ ] Debug API shows accurate stats
- [ ] Performance < 1ms per frame
- [ ] Non-resonant networks spread threat normally
- [ ] Resonant networks spread threat ~5-10% further (only under threat)
- [ ] Phase 5c healing unaffected by Phase 5d
- [ ] Synergy/Harmony remain unchanged (read-only)

---

## Future Extensions

### Phase 5e: Coherence Cascades
- Unifies threat and healing cascades
- Resonant zones become pressure regulators
- Intelligent network dynamics emerge

### Phase 6: Fracture Propagation
- Under extreme stress, networks fracture
- Phase 5d threat can trigger fractures
- Creates network topology changes

---

## Summary

**Phase 5d** makes resonance truly bidirectional by amplifying corruption threat propagation the same way Phase 5c amplifies healing.

This introduces **strategic risk-reward**: powerful, optimized networks are excellent at both healing AND threat transmission under pressure.

Result: Gameplay depth increases as players must carefully manage the cost of optimization.

**Key takeaway:** Resonance doesn't choose sides—it amplifies flow, in both directions.
