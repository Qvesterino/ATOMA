# ATOMA CANONICAL STAT REGISTRY
## Stable Reference for All Development

**Authority:** Phase D Balance Pass (Session 44+)  
**Status:** 🟢 LOCKED & VERIFIED  
**Last Updated:** Session 44

---

## QUICK REFERENCE: ACTIVE STATS ONLY

### NODE STATS (Active)
```javascript
node.userData.corruption          // Range: 0–1      | Writer: LinkCorruptionTransmission_v1
node.userData.harmonyLevel        // Range: 0–1      | Writer: HarmonyStabilizationSystem_v1
node.userData.personality         // Object          | Writer: NodePersonalitySystem2_0
node.userData.archetype           // String          | Writer: AINodes (setup)
```

### LINK STATS (Active)
```javascript
link.synergy                       // Range: 0–100    | Writer: ComputeSynergyScore2_0
link.userData.corruption          // Range: 0–1      | Writer: LinkCorruptionTransmission_v1
link.userData.integrity           // Range: 0–100    | Writer: LinkCorruptionTransmission_v1
link.userData.harmonyLevel        // Range: 0–1      | Writer: HarmonyStabilizationSystem_v1
link.userData.hasBarrier          // Boolean         | Writer: LinkCorruptionTransmission_v1 (Phase 7)
```

### GLOBAL CONSTANTS (T1-CRITICAL)
```javascript
SYNERGY_BLOCK_THRESHOLD = 85              // Synergy must be >= 85 for hard block
HARMONY_SYNERGY_THRESHOLD = 0.7           // Harmony must be >= 0.7 for amplification
HARMONY_SYNERGY_MULTIPLIER = 1.3          // Boost factor: 30% increase to effective synergy
```

---

## STAT PURPOSES (ONE PER STAT)

| Stat | Single Purpose |
|------|---|
| **corruption** | Spread of chaos through network; blocks healing, triggers decay |
| **harmony** | Stability force; counter to corruption; enables synergy amplification (T1-004) |
| **synergy** | Link affinity/quality; blocks corruption spread (T1-003) |
| **integrity** | Link structural stability; collapse at ≤8%, unstable 8–15% |
| **personality** | Node behavioral profile; drives visual intensity and event types |
| **archetype** | Node role/type; determines gameplay effects and visual differentiation |
| **hasBarrier** | Preventative barrier deployed; reduces stress accumulation (Phase 7) |

---

## CANONICAL RANGES

| Stat Type | Range | Scale |
|-----------|-------|-------|
| Corruption/Harmony | 0–1 | Float (normalized) |
| Synergy/Integrity | 0–100 | Integer (0-based) |
| Personality Intensity | 0–1 | Float (normalized) |
| Multipliers | 0.8–1.5 | Soft cap (hard caps vary by context) |

---

## TIER 1 CRITICAL INTEGRATION POINTS

### T1-003: Synergy Blocks Corruption
**File:** LinkCorruptionTransmission_v1.js, lines 1477–1521  
**How It Works:**
```javascript
const synergy = link.synergy ?? 0;  // READ: 0–100 scale
let synergyBlockMultiplier = 1.0;

if (synergy >= 85) {
  synergyBlockMultiplier = 0.0;    // Hard block
} else if (synergy >= 60) {
  synergyBlockMultiplier = 1.0 - ((synergy - 60) / 25);  // Soft damping
}

baseRate *= synergyBlockMultiplier;
```

### T1-004: Harmony Amplifies Synergy
**File:** LinkCorruptionTransmission_v1.js, lines 1482–1494  
**How It Works:**
```javascript
const harmonyForAmplification = link.userData?.harmonyLevel 
                              ?? sourceNode?.userData?.harmonyLevel 
                              ?? 0;  // READ: 0–1 scale
let effectiveSynergy = synergy;

if (harmonyForAmplification >= 0.7) {
  effectiveSynergy *= 1.3;  // 30% temporary boost
}

// Then apply T1-003 thresholds to effectiveSynergy
```

---

## STACKING RULES (ENFORCED)

✅ **One Blocker:** Synergy + Harmony both block corruption (multiplicative)  
✅ **One Amplifier:** Harmony amplifies synergy (×1.3, transient)  
✅ **One Decay Modifier:** Integrity degrades based on corruption + stress (capped 2.0×)  

**No Recursion. No Feedback Loops. No Runaway Growth.**

---

## SAFEGUARDS IN PLACE

| Guard | Mechanism | Status |
|-------|-----------|--------|
| Synergy hard cap | Blocks at 85+ (immutable threshold) | 🔒 Locked |
| Harmony hard cap | 1.0 (maximum possible) | 🔒 Locked |
| Corruption hard cap | 1.0 (full saturation) | 🔒 Locked |
| Integrity hard collapse | ≤ 8% (automatic collapse state) | 🔒 Locked |
| Stress multiplier hard cap | 2.0× maximum (network critical) | 🔒 Locked |
| Amplification scope | Harmony amplification is transient per-frame only | 🔒 Locked |

---

## LEGACY STATS (DO NOT USE)

| Stat | Reason |
|------|--------|
| `node.userData.synergy` | Superseded by link.synergy; no active writers |
| `node.userData.energy` | Purpose unclear; not actively written |
| `node.userData.stress` | Unclear implementation; use computed stress instead |

---

## RULES FOR ADDING NEW STATS

If a new stat must be added:

1. **Choose a clear single purpose** (not "related to X and Y")
2. **Define canonical range** (0–1, 0–100, or other)
3. **Identify exactly one writer** (no ambiguous multiple sources)
4. **Mark all readers** (audit what depends on it)
5. **Add to this registry** before coding
6. **Document stacking behavior** (how it interacts with existing multipliers)
7. **Get review** before integration

---

## VERIFICATION CHECKLIST

Use this before committing any stat-related changes:

- [ ] Stat has ONE clear purpose (not multiple)
- [ ] Stat range is defined and documented
- [ ] Stat is written by exactly ONE system
- [ ] Stat is NOT read recursively (no A→B→A chains)
- [ ] Stat does NOT create new multipliers (reuse existing if possible)
- [ ] Stat multiplication path does NOT exceed 2.0× total
- [ ] Stat changes are backward compatible (old code still works)
- [ ] Stat is registered in ATOMA_STAT_REGISTRY_CANONICAL.md
- [ ] No visual system depends on this stat (visuals read only from metrics)
- [ ] TIER 1 wiring is unchanged

---

## QUICK STAT LOOKUP

**"I need to read the current state of X"**
```javascript
node.corruption              → use link.corruption or spread from neighbors
node.harmonyLevel            → use node.userData.harmonyLevel
link.synergy                 → use link.synergy (ComputeSynergyScore2_0)
link quality / affinity      → use link.synergy
network stability            → compute from corruption spread rate
```

**"I need to modify X"**
```javascript
DO modify:   corruption, harmonyLevel, integrity (internal systems only)
DO NOT:      synergy (read-only from ComputeSynergyScore2_0)
DO NOT:      personality (read-only from NodePersonalitySystem)
DO NOT:      archetype (set at node creation, never change)
```

---

## STATUS: 🟢 CANONICAL & LOCKED

This registry represents the authoritative stat system for ATOMA.  
All future development must conform to these definitions.  
No unapproved additions or modifications permitted.

**Effective Date:** Session 44  
**Authority:** Systems Integrator (Phase D Balance Pass)  
**Review Cycle:** Session 50+ (or if major new feature requires new stat)

---

