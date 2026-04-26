# SYNERGY UNIFIED ARCHITECTURE — Analytical Study & Design Proposal

**Date:** 2026-04-25  
**Phase:** EVOLUTION_V2 · CONTROLLED INNOVATION  
**Scope:** HIGH — Architecture redesign across 10 synergy subsystems  
**Status:** ANALYSIS COMPLETE · AWAITING APPROVAL

---

## 1. EXECUTIVE SUMMARY

Synergy is the **absolute core metric** of ATOMA. It determines Network Time direction (FORWARD/REWIND), which directly computes the final game score. Currently, this critical metric flows through **10 independent subsystems** with **no central orchestration**, **conflicting thresholds**, **duplicate tier systems**, and **fragmented visual pipelines**.

This document proposes the consolidation of all synergy subsystems into a single coherent **SynergyRuntime** — a unified authority that owns the synergy lifecycle from raw computation through state resolution to visual rendering and Network Time feedback.

---

## 2. CURRENT SYSTEM INVENTORY

### 2.1 System Map

| # | File | Role | Lines | Active |
|---|------|------|-------|--------|
| 1 | `SynergyStateResolver.js` | State classification (numeric → discrete) | 301 | ✅ Active |
| 2 | `SynergyResonanceShaderPack_v1.js` | GPU shader FX (multi-freq pulse, chromatic ripple, coherence flow) | 619 | ✅ Active |
| 3 | `SynergyBonusFXLayer_v1.js` | GPU shader FX (emissive boost, chromatic flare, ripples) | 644 | ✅ Active |
| 4 | `SynergyHighwayVisuals3D_1_0.js` | 3D highway visualization (category flow arcs) | 1595 | ✅ Active |
| 5 | `SynergyTravelingWaveFX_v1.js` | Traveling wave shader (cascade propagation) | 700 | ✅ Active |
| 6 | `SynergyChainReaction_v1.js` | Chain reaction logic (node state machine, propagation) | 689 | ⚠️ Starts disabled |
| 7 | `SynergyCascadeVisualizer.js` | Cascade visual effects (particles, ripples, bursts) | 3248 | ✅ Active |
| 8 | `HUD/SynergyRecommendationDebugHUD.js` | Debug HUD | 357 | ❌ DISABLED |
| 9 | `ComputeSynergyScore2_0.js` | Per-link synergy score computation (5-factor) | 573 | ✅ Active |
| 10 | `VisualNetworkTimeElasticity_v1.js` | Network Time score + visual time elasticity | 703 | ✅ Active |

**Supporting:**
- `SemanticMetricAdapter.js` — Canonical metric bridge (`getLinkSynergyVisualMetrics()`)

### 2.2 Data Flow (Current — Fragmented)

```
                         ┌─────────────────────┐
                         │  ComputeSynergyScore │
                         │      2_0.js          │
                         │  (5-factor formula)  │
                         └──────────┬───────────┘
                                    │ score, tier
                                    ▼
                    ┌───────────────────────────────┐
                    │   link.userData.synergy.score  │◄── Canonical storage
                    └───────┬───────────────────────┘
                            │
              ┌─────────────┼─────────────────────────┐
              │             │                          │
              ▼             ▼                          ▼
   ┌──────────────┐  ┌──────────────┐     ┌──────────────────────┐
   │ SemanticMetric│  │ SynergyState │     │ SynergyHighwayVisuals│
   │   Adapter.js  │  │  Resolver.js │     │     3D_1_0.js        │
   │ (visual tier) │  │ (state class)│     │ (reads raw synergy)  │
   └──────┬───────┘  └──────────────┘     └──────────────────────┘
          │
    ┌─────┼──────────────────────────────────┐
    │     │                                  │
    ▼     ▼                                  ▼
┌──────────────┐ ┌──────────────────┐  ┌──────────────────┐
│ Resonance    │ │ BonusFXLayer_v1  │  │ TravelingWaveFX  │
│ ShaderPack   │ │ (emissive boost) │  │ (cascade waves)  │
│ (GPU shader) │ │ (GPU shader)     │  │ (GPU shader)     │
└──────────────┘ └──────────────────┘  └──────────────────┘

          ┌──────────────────────┐
          │ SynergyChainReaction │──► SynergyCascadeVisualizer
          │     _v1.js           │    (semanticBus events)
          │ (propagation logic)  │    (particles, ripples)
          └──────────────────────┘

          ┌──────────────────────────────────────┐
          │ VisualNetworkTimeElasticity_v1.js     │
          │ (reads avgSynergy only, no subsystem  │
          │  integration, no enriched feedback)   │
          └──────────────────────────────────────┘
```

---

## 3. PROBLEM ANALYSIS

### 3.1 CRITICAL: Threshold Duplication & Conflict

Six different threshold sets exist across the codebase:

| System | Thresholds | States/Tiers |
|--------|-----------|--------------|
| `SynergyStateResolver` | 0.50 / 0.75 / 0.85 | LOW / ACTIVE / STRONG / AWAKENED |
| `SemanticMetricAdapter` | 0.40 / 0.70 / 0.90 | NONE / SOFT_BOOST / STRONG_PULSE / MYTHIC_RESONANCE |
| `ComputeSynergyScore2_0` | 0.25 / 0.50 / 0.75 | low / medium / high / critical |
| `VisualNetworkTimeElasticity` | 0.82 (single) | FORWARD / REWIND / WON |
| `SynergyChainReaction` | 0.75 (primary) | idle / charged / reacting / stabilizing / cooled |
| `SynergyCascadeVisualizer` | 0.70 (detection) | (visual bands) |

**Impact:** A link at synergy 0.78 is simultaneously:
- `STRONG` (SynergyStateResolver)
- `STRONG_PULSE` (SemanticMetricAdapter)
- `high` (ComputeSynergyScore2_0)
- Not yet triggering chain reactions (needs 0.75+ sustained)
- Not yet rewinding Network Time (needs 0.82 sustained 7s)

This creates **semantic incoherence** — the same value means different things to different systems.

### 3.2 HIGH: Duplicate Code

1. **`getConduitLinkMaterials()`** — Identical function copy-pasted in:
   - `SynergyResonanceShaderPack_v1.js` (lines 8–32)
   - `SynergyBonusFXLayer_v1.js` (lines 8–32)

2. **Material patching pattern** — Both ShaderPack and BonusFXLayer independently:
   - Use `onBeforeCompile` to inject shader code
   - Track materials via `WeakMap`
   - Use `Symbol()` for patch guards
   - Chain `customProgramCacheKey`
   - Inject into `#include <output_fragment>`

3. **Tier computation** — SemanticMetricAdapter computes tier internally, SynergyBonusFXLayer re-computes tier internally, SynergyStateResolver provides a third tier system.

### 3.3 HIGH: No Central Orchestration

- Each system has its own `update(deltaTime, ...)` method
- Called independently from `main.js` at different cadences
- No guaranteed update order
- No shared state between visual systems
- Potential for visual tearing (one system updates, another hasn't yet)

### 3.4 MEDIUM: Shader Conflict Risk

Both `SynergyResonanceShaderPack_v1` and `SynergyBonusFXLayer_v1` patch the same materials and both replace `#include <output_fragment>`. The second patch's replacement string contains the first's `#include <output_fragment>` — so they chain. But:
- Order-dependent (whichever patches first wins the inner position)
- Both add emissive/color modifications — potential oversaturation
- No coordination of effect intensity between the two

### 3.5 MEDIUM: Disconnected Network Time Feedback

`VisualNetworkTimeElasticity_v1` only reads `avgSynergy` — a flat scalar. It has no access to:
- Per-link synergy distribution
- Synergy trend (rising/falling)
- Chain reaction energy
- Cascade propagation state
- Synergy state distribution (how many links in AWAKENED vs LOW)

This means the most critical gameplay system operates on **impoverished data**.

### 3.6 LOW: Dead Code

- `SynergyRecommendationDebugHUD` — DISABLED, superseded
- `ComputeSynergyScore2_0` trigger hooks — all three are empty legacy stubs
- `SynergyChainReaction` — starts disabled by default

---

## 4. UNIFIED ARCHITECTURE: SynergyRuntime

### 4.1 Design Philosophy

**One metric. One authority. One pipeline.**

Synergy is too important to be fragmented. The unified `SynergyRuntime` owns the complete lifecycle:

```
RAW DATA → SCORE COMPUTATION → STATE RESOLUTION → VISUAL DISPATCH → NETWORK TIME FEEDBACK
```

### 4.2 Architecture Overview

```
╔══════════════════════════════════════════════════════════════════════════╗
║                        SYNERGY RUNTIME                                  ║
║                   (Single Authority, Single Pipeline)                   ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                         ║
║  ┌─────────────────────────────────────────────────────────────────┐    ║
║  │                    LAYER 1: COMPUTATION                         │    ║
║  │  SynergyScoreEngine (unified ComputeSynergyScore2_0)            │    ║
║  │  • 5-factor weighted formula per link                           │    ║
║  │  • Batch computation for all links                              │    ║
║  │  • Writes canonical link.userData.synergy                       │    ║
║  └──────────────────────────┬──────────────────────────────────────┘    ║
║                             │                                           ║
║  ┌──────────────────────────▼──────────────────────────────────────┐    ║
║  │                    LAYER 2: STATE RESOLUTION                     │    ║
║  │  SynergyStateResolver (enhanced)                                │    ║
║  │  • Single threshold set (unified)                               │    ║
║  │  • Per-link AND network-level state                             │    ║
║  │  • State transition events                                      │    ║
║  │  • Trend detection (rising/falling/stable)                      │    ║
║  └──────────────────────────┬──────────────────────────────────────┘    ║
║                             │                                           ║
║              ┌──────────────┼──────────────┐                            ║
║              │              │              │                             ║
║  ┌───────────▼──────┐ ┌────▼──────────┐ ┌─▼──────────────────────┐     ║
║  │  LAYER 3A:       │ │ LAYER 3B:     │ │ LAYER 3C:              │     ║
║  │  VISUAL DISPATCH │ │ CASCADE LOGIC │ │ NETWORK TIME FEEDBACK  │     ║
║  │                  │ │               │ │                         │     ║
║  │ UnifiedShaderFX  │ │ ChainReaction │ │ ElasticityController   │     ║
║  │ HighwayVisuals   │ │ (enhanced)    │ │ (enhanced VNT)         │     ║
║  │ CascadeVFX       │ │               │ │                         │     ║
║  │ TravelingWaves   │ │               │ │ Reads ENRICHED data:   │     ║
║  │                  │ │               │ │ • avgSynergy           │     ║
║  │ Single material  │ │               │ │ • synergyDistribution  │     ║
║  │ pipeline, no     │ │               │ │ • trend                │     ║
║  │ conflicts        │ │               │ │ • chainEnergy          │     ║
║  └──────────────────┘ └───────────────┘ │ • cascadeIntensity     │     ║
║                                        │                         │     ║
║                                        │ Elastic rewind with    │     ║
║                                        │ ENRICHED feedback      │     ║
║                                        └─────────────────────────┘     ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### 4.3 Unified Threshold Contract

**One threshold set to rule them all:**

```javascript
const SYNERGY_THRESHOLDS = Object.freeze({
  // State boundaries (SynergyStateResolver authority)
  active:   0.40,    // Link becomes "active"
  strong:   0.70,    // Strong connection
  awakened: 0.85,    // Peak connection
  
  // Gameplay triggers
  chainReaction:  0.75,   // Chain reaction primary trigger
  networkRewind:  0.82,   // Network Time rewind activation
  networkSustain: 7.0,    // Seconds of sustained high synergy for rewind
  
  // Visual tier boundaries (aligned with state boundaries)
  tierBoundaries: [0.40, 0.70, 0.90],  // NONE/SOFT/STRONG/MYTHIC
});
```

**Alignment rules:**
- Visual tier boundaries align with state boundaries (0.40 = ACTIVE, 0.70 = STRONG)
- The 0.90 MYTHIC_RESONANCE visual tier aligns with the upper range of AWAKENED
- Network Time rewind (0.82) sits between STRONG and AWAKENED — requires near-peak synergy
- Chain reaction (0.75) sits at the STRONG boundary — requires strong connections

### 4.4 Layer 1: SynergyScoreEngine

**Consolidates:** `ComputeSynergyScore2_0.js`

```
Responsibilities:
- Compute per-link synergy score (5-factor formula)
- Batch computation for all links
- Write canonical link.userData.synergy
- Publish score change events via semanticBus
- Compute network-level aggregates (avgSynergy, distribution, trend)

New capabilities:
- Network-level aggregation (currently scattered)
- Trend detection (rising/falling/stable per link AND network)
- Synergy distribution histogram (how many links at each state)
- Integration with SynergyStateResolver for state-aware scoring
```

### 4.5 Layer 2: SynergyStateResolver (Enhanced)

**Consolidates:** `SynergyStateResolver.js` + tier logic from `SemanticMetricAdapter.js`

```
Enhanced responsibilities:
- Single threshold set (from SYNERGY_THRESHOLDS)
- Per-link state resolution (existing)
- Network-level state resolution (NEW)
- State transition detection with events (NEW)
- Visual tier computation (absorbed from SemanticMetricAdapter)
- Hysteresis for state transitions (NEW — prevents flickering)

Removed from other systems:
- SemanticMetricAdapter tier computation → moved here
- SynergyBonusFXLayer tier computation → moved here
- SynergyHighwayVisuals threshold comparisons → moved here
```

### 4.6 Layer 3A: Unified Visual Dispatch

**Consolidates:** `SynergyResonanceShaderPack_v1` + `SynergyBonusFXLayer_v1` → `SynergyUnifiedShaderFX`

```
Key design: SINGLE material patch, SINGLE onBeforeCompile chain

Current problem: Two independent shader patches on the same material
Solution: Merge into one unified shader injection

Unified shader pipeline:
1. getConduitLinkMaterials() — extracted to shared utility (ONE copy)
2. Single SynergyMaterialState per material (not two)
3. Single onBeforeCompile with ALL effects in one injection:
   - Multi-frequency pulse (from ResonanceShaderPack)
   - Chromatic ripple (from ResonanceShaderPack)
   - Coherence flow (from ResonanceShaderPack)
   - Emissive boost (from BonusFXLayer)
   - Chromatic flare (from BonusFXLayer)
   - Vertex ripple distortion (from BonusFXLayer)
4. Single customProgramCacheKey: "|SYNERGY_UNIFIED_v1"
5. Coordinated effect intensity (no oversaturation)
6. Shared EMA smoothing

Benefits:
- Eliminates shader conflict risk
- Halves material state tracking overhead
- Guarantees effect coordination
- Single debug point
```

**SynergyHighwayVisuals3D** remains semi-independent (different geometry type — 3D tubes, not link materials) but reads from the unified state resolver instead of raw synergy.

**SynergyCascadeVisualizer** remains semi-independent (particle-based, not shader-based) but receives enriched events from the unified pipeline.

**SynergyTravelingWaveFX** gets absorbed into the unified shader FX as an additional mode, triggered by chain reaction events rather than independently polling snapshots.

### 4.7 Layer 3B: Chain Reaction Logic

**Consolidates:** `SynergyChainReaction_v1.js` (enhanced)

```
Enhanced responsibilities:
- Enable by default (currently starts disabled)
- Read from SynergyStateResolver for trigger conditions
- Emit events through semanticBus for visual dispatch
- Feed chain energy metrics back to Layer 3C (Network Time)

Integration:
- Trigger condition: SynergyState >= STRONG (from resolver, not raw value)
- Propagation uses SynergyState for filtering (not raw synergyNorm)
- Output events feed SynergyCascadeVisualizer AND SynergyTravelingWaveFX
- Chain energy metric feeds Network Time elasticity
```

### 4.8 Layer 3C: Elastic Network Time Feedback (NEW DESIGN)

**Consolidates:** `VisualNetworkTimeElasticity_v1.js` (enhanced)

This is the critical innovation — **elastic synergy→time feedback**:

```
Current behavior:
  avgSynergy >= 0.82 sustained 7s → REWIND at 3 units/sec
  Otherwise → FORWARD at 5 units/sec

Enhanced behavior:
  The rewind is ELASTIC — it responds to the QUALITY of synergy,
  not just a binary threshold.

  Enriched inputs:
  ┌─────────────────────────────────────────────────────────────┐
  │ 1. avgSynergy (existing) — flat network average             │
  │ 2. synergyDistribution — histogram of states across links   │
  │    • What % of links are AWAKENED? STRONG? ACTIVE?          │
  │    • Higher concentration of AWAKENED = stronger rewind     │
  │ 3. synergyTrend — network-level trend                       │
  │    • RISING: synergy accelerating → rewind speed bonus      │
  │    • FALLING: synergy decelerating → rewind speed penalty   │
  │    • STABLE: synergy holding → base rewind speed            │
  │ 4. chainEnergy — total energy from active chain reactions   │
  │    • Active chains amplify rewind (network is "alive")      │
  │ 5. cascadeIntensity — aggregate cascade propagation level   │
  │    • Active cascades add momentum to rewind                 │
  │ 6. networkCoherence — how uniformly distributed synergy is  │
  │    • Uniform high synergy = coherent = stronger rewind      │
  │    • Pockets of high/low = incoherent = weaker rewind       │
  └─────────────────────────────────────────────────────────────┘

  Elastic Rewind Formula:
  ─────────────────────────────────────────────────────────────
  effectiveRewindSpeed = baseRewindSpeed
                       × qualityMultiplier      (synergy above threshold)
                       × trendMultiplier         (rising/stable/falling)
                       × coherenceMultiplier     (network uniformity)
                       × chainEnergyMultiplier   (active chain reactions)
                       × comboMultiplier         (consecutive rewinds)
  ─────────────────────────────────────────────────────────────

  Multiplier ranges:
  - qualityMultiplier: 1.0 – 2.0 (based on avgSynergy above 0.82)
  - trendMultiplier:   0.7 – 1.3 (rising=1.3, stable=1.0, falling=0.7)
  - coherenceMultiplier: 0.8 – 1.2 (uniform=1.2, scattered=0.8)
  - chainEnergyMultiplier: 1.0 – 1.5 (proportional to active chain energy)
  - comboMultiplier: 1.0 – 1.8 (existing combo stacking)

  Elastic Forward Formula (pressure):
  ─────────────────────────────────────────────────────────────
  effectiveForwardSpeed = baseForwardSpeed
                        × escalationFactor      (existing: grows with NT)
                        × incoherencePenalty     (more incoherent = more pressure)
  ─────────────────────────────────────────────────────────────

  This creates a RICH FEEDBACK LOOP:
  - Player builds synergy → triggers chains → cascades propagate
  - Network coherence rises → rewind strengthens → Network Time drops
  - If synergy becomes patchy → coherence drops → rewind weakens
  - If synergy falls below threshold → forward pressure resumes
  - Chain reactions add "energy" that amplifies the rewind

  NEW: Sustain Gradient (replaces binary sustain)
  ─────────────────────────────────────────────────────────────
  Current: 7 seconds at 0.82 → instant rewind activation
  Proposed: Gradient activation over 7 seconds:
  
  sustainRatio = sustainedDuration / sustainDuration  (0→1)
  
  At sustainRatio 0.0–0.5: No rewind (building up)
  At sustainRatio 0.5–0.8: Partial rewind (50% speed)
  At sustainRatio 0.8–1.0: Strong partial rewind (80% speed)
  At sustainRatio 1.0:     Full rewind activation
  
  This eliminates the binary "suddenly rewinding" feel and creates
  a smooth elastic transition that the player can feel building.
```

### 4.9 Update Pipeline (Unified Cadence)

```
FrameScheduler (existing authority)
  │
  ├── 10Hz (simulation)
  │   ├── SynergyScoreEngine.update()        — recompute scores
  │   ├── SynergyStateResolver.resolveAll()  — resolve states
  │   ├── SynergyChainReaction.update()      — propagate chains
  │   └── ElasticityController.update()      — update Network Time
  │
  ├── 30Hz (visual)
  │   ├── SynergyUnifiedShaderFX.update()    — GPU shader uniforms
  │   ├── SynergyHighwayVisuals3D.update()   — highway meshes
  │   ├── SynergyCascadeVisualizer.update()  — particles, ripples
  │   └── SynergyTravelingWaveFX.update()    — wave effects
  │
  └── 60Hz (runtime)
      └── (existing runtime systems)
```

---

## 5. FILE STRUCTURE (Proposed)

```
synergy/                              ← New directory
├── SynergyRuntime.js                 ← Main orchestrator (entry point)
├── SynergyScoreEngine.js             ← Layer 1: Score computation
├── SynergyStateResolver.js           ← Layer 2: State resolution (enhanced)
├── SynergyUnifiedShaderFX.js         ← Layer 3A: Merged GPU shader effects
├── SynergyChainReaction.js           ← Layer 3B: Chain reaction logic
├── SynergyCascadeVisualizer.js       ← Layer 3C: Cascade particle effects
├── SynergyHighwayVisuals3D.js        ← Layer 3D: Highway visualization
├── SynergyElasticityController.js    ← Layer 3E: Network Time elasticity
├── SynergyThresholds.js              ← Single threshold contract
├── utils/
│   ├── getConduitLinkMaterials.js    ← Shared utility (one copy)
│   └── SynergyMaterialState.js       ← Shared material state tracker
└── HUD/
    └── SynergyDebugHUD.js            ← Unified debug panel (optional)
```

**Files removed/absorbed:**
- `SynergyResonanceShaderPack_v1.js` → absorbed into `SynergyUnifiedShaderFX.js`
- `SynergyBonusFXLayer_v1.js` → absorbed into `SynergyUnifiedShaderFX.js`
- `SynergyTravelingWaveFX_v1.js` → absorbed into `SynergyUnifiedShaderFX.js`
- `ComputeSynergyScore2_0.js` → becomes `SynergyScoreEngine.js`
- `VisualNetworkTimeElasticity_v1.js` → becomes `SynergyElasticityController.js`
- `HUD/SynergyRecommendationDebugHUD.js` → removed (already disabled)

**Files preserved (relocated):**
- `SynergyStateResolver.js` → enhanced in place
- `SynergyChainReaction_v1.js` → enhanced, renamed
- `SynergyCascadeVisualizer.js` → preserved, wired to new pipeline
- `SynergyHighwayVisuals3D_1_0.js` → preserved, wired to new pipeline

---

## 6. MIGRATION STRATEGY

### Phase 1: Foundation (LOW RISK)
1. Create `SynergyThresholds.js` — single threshold contract
2. Extract `getConduitLinkMaterials.js` — shared utility
3. Align `SemanticMetricAdapter` thresholds with `SynergyStateResolver`
4. **No behavioral changes** — just alignment

### Phase 2: Score Engine Integration (MEDIUM RISK)
1. Create `SynergyScoreEngine.js` from `ComputeSynergyScore2_0.js`
2. Add network-level aggregation (avgSynergy, distribution, trend)
3. Wire to `SynergyStateResolver` for state-aware scoring
4. **Test:** Verify scores match old system exactly

### Phase 3: Shader Consolidation (MEDIUM RISK)
1. Merge `SynergyResonanceShaderPack_v1` + `SynergyBonusFXLayer_v1` → `SynergyUnifiedShaderFX`
2. Single material patch, single onBeforeCompile
3. Coordinate effect intensities
4. **Test:** Visual comparison with old system (should look identical or better)

### Phase 4: Elastic Network Time (HIGH IMPACT)
1. Create `SynergyElasticityController.js` from `VisualNetworkTimeElasticity_v1.js`
2. Add enriched inputs (distribution, trend, chain energy, coherence)
3. Implement elastic rewind formula
4. Implement sustain gradient
5. **Test:** Gameplay feel — rewind should feel organic, not binary

### Phase 5: Orchestrator (LOW RISK)
1. Create `SynergyRuntime.js` — wires all layers together
2. Unified update pipeline via FrameScheduler
3. Remove individual system init from `main.js`
4. **Test:** Full integration test

---

## 7. RISK ASSESSMENT

| Risk | Severity | Mitigation |
|------|----------|------------|
| Shader consolidation breaks visuals | HIGH | Side-by-side testing, visual comparison screenshots |
| Threshold alignment changes gameplay feel | MEDIUM | Phase 1 is alignment-only, no behavioral change |
| Elastic Network Time makes game too easy/hard | MEDIUM | Configurable multipliers, extensive playtesting |
| Cascade visualizer event contract changes | LOW | Preserve semanticBus event names |
| Performance regression from unified pipeline | LOW | Single material patch is actually faster than two |
| Migration breaks existing save games | LOW | Network Time persists via session stats, synergy is recomputed |

---

## 8. PERFORMANCE EXPECTATIONS

**Current state (estimated per frame):**
- SynergyResonanceShaderPack: ~0.5ms (1500 links)
- SynergyBonusFXLayer: ~0.5ms (1500 links)
- SynergyHighwayVisuals: ~1ms (20 highways)
- SynergyTravelingWaveFX: ~0.3ms (500 materials)
- SynergyChainReaction: ~0.5ms (300 nodes)
- SynergyCascadeVisualizer: ~3ms (particles, ripples)
- **Total: ~6ms per frame**

**After consolidation (estimated):**
- SynergyUnifiedShaderFX: ~0.6ms (single pass, no double-patch)
- SynergyHighwayVisuals: ~1ms (unchanged)
- SynergyChainReaction: ~0.5ms (unchanged)
- SynergyCascadeVisualizer: ~3ms (unchanged)
- SynergyScoreEngine: ~1ms (batch computation)
- SynergyElasticityController: ~0.1ms (pure math)
- **Total: ~6.2ms per frame**

Performance is **neutral to slightly better** due to eliminated duplicate material patching.

---

## 9. NETWORK TIME ELASTICITY — DETAILED DESIGN

### 9.1 Enriched Synergy Signal

The core innovation is replacing the flat `avgSynergy` scalar with an **enriched synergy signal**:

```javascript
// Current: flat scalar
elasticity.setAverageSynergy(0.85);

// Proposed: enriched signal
elasticity.updateSynergySignal({
  avgSynergy: 0.85,
  
  // Distribution: what % of links are in each state
  stateDistribution: {
    LOW: 0.05,      // 5% of links barely connected
    ACTIVE: 0.15,   // 15% connected
    STRONG: 0.45,   // 45% high quality
    AWAKENED: 0.35  // 35% peak connection
  },
  
  // Network coherence: how uniform is synergy across the network
  // 1.0 = all links identical synergy, 0.0 = extreme variance
  coherence: 0.78,
  
  // Trend: network-level direction
  trend: 'rising',  // rising | stable | falling
  
  // Chain reaction energy
  chainEnergy: 2.4,  // sum of active reaction levels
  
  // Cascade propagation intensity
  cascadeIntensity: 0.6  // aggregate cascade level
});
```

### 9.2 Elastic Rewind Activation

Instead of binary sustain → full rewind:

```
Time ─────────────────────────────────────────────────►

Synergy:     ▂▃▄▅▆▇████████████████████▇▆▅▄▃▂
             │                           │
             │◄── sustain builds ──────►│
             │                           │
Rewind:      ░░░░░░░░▒▒▒▒▓▓▓▓████████▓▓▓▓▒▒▒▒░░░░░░
             │       │       │       │       │
             0%     25%     50%     75%    100%
             
             ░ = no rewind
             ▒ = gentle rewind (25% speed)
             ▓ = moderate rewind (60% speed)  
             █ = full rewind (100% speed)
```

The rewind strength builds GRADUALLY as synergy sustains, creating an organic "pulling" feeling rather than a sudden switch.

### 9.3 Coherence-Weighted Rewind

Network coherence affects rewind strength:

```
High coherence (0.9):
  All links at similar synergy → network is unified → strong rewind
  coherenceMultiplier = 1.2

Medium coherence (0.6):
  Some variation → network is partially aligned → normal rewind
  coherenceMultiplier = 1.0

Low coherence (0.3):
  Extreme variation → network is fragmented → weak rewind
  coherenceMultiplier = 0.8
```

This rewards players who build synergy UNIFORMLY across the network, not just in pockets.

### 9.4 Chain Energy Amplification

Active chain reactions add momentum:

```
No chains active:
  chainEnergyMultiplier = 1.0

Several chains propagating:
  chainEnergy = 3.0 (sum of active reaction levels)
  chainEnergyMultiplier = 1.0 + (3.0 × 0.1) = 1.3

Maximum chain energy:
  chainEnergy = 5.0 (cap)
  chainEnergyMultiplier = 1.5
```

This creates a positive feedback loop: synergy → chains → faster rewind → motivation to maintain synergy.

---

## 10. SUMMARY OF CHANGES BY FILE

| File | Action | Reason |
|------|--------|--------|
| `SynergyStateResolver.js` | ENHANCE | Add network-level resolution, hysteresis, transition events |
| `SynergyResonanceShaderPack_v1.js` | ABSORB | Merged into SynergyUnifiedShaderFX |
| `SynergyBonusFXLayer_v1.js` | ABSORB | Merged into SynergyUnifiedShaderFX |
| `SynergyTravelingWaveFX_v1.js` | ABSORB | Wave mode merged into SynergyUnifiedShaderFX |
| `SynergyHighwayVisuals3D_1_0.js` | REWIRE | Read from unified state resolver |
| `SynergyChainReaction_v1.js` | ENHANCE | Enable by default, use state resolver, feed energy to elasticity |
| `SynergyCascadeVisualizer.js` | PRESERVE | Already well-structured, wire to new event sources |
| `HUD/SynergyRecommendationDebugHUD.js` | REMOVE | Already disabled |
| `ComputeSynergyScore2_0.js` | EVOLVE | Becomes SynergyScoreEngine with aggregation |
| `VisualNetworkTimeElasticity_v1.js` | EVOLVE | Becomes SynergyElasticityController with enriched feedback |
| `SemanticMetricAdapter.js` | SIMPLIFY | Remove duplicate tier computation, delegate to resolver |

---

## 11. APPROVAL CHECKLIST

Before implementation begins, confirm:

- [ ] Threshold contract (Section 4.3) is acceptable
- [ ] Elastic rewind formula (Section 4.8) aligns with game design intent
- [ ] Sustain gradient (Section 9.2) is the desired feel
- [ ] Coherence weighting (Section 9.3) adds meaningful gameplay
- [ ] Chain energy amplification (Section 9.4) is balanced
- [ ] Migration phasing (Section 6) is acceptable
- [ ] File structure (Section 5) is acceptable
- [ ] Shader consolidation approach (Section 4.6) is approved

---

*"Synergy is not a metric. It is the heartbeat of the network. Treat it as one system, not many."*
