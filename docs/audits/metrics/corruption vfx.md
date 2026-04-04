# CORRUPTION VFX EFFECTS - AUDIT REPORT

## Osnova
- 1 Hlavné Corruption VFX Systémy
  - 1. CorruptionVisualFX_v1.js
  - 2. CorruptionDesaturationIntegrationPatch.js
  - 3. CorruptionDrivenAuraDesaturationSystem.js
  - 4. CascadeParticleSystem_Session120.js
  - 5. CascadeEventBridge_v1.js
- 5 SYNERGY VFX
  - 5.1. SynergyHighwayVisuals3D_1_0.js
  - 5.2. SynergyChainReaction_v1.js
- 6 HARMONY VFX
  - 6.1. HarmonicNodeResonanceHalos.js
- 7 CORRUPTION VFX
  - 7.1. CorruptionVisualFX_v1.js

## Hlavné Corruption VFX Systémy

### 1. **CorruptionVisualFX_v1.js**
**Trigger Events:**
- `metric.corruption.spike` - corruption pulse event
- Automatický update pri corruption > CASCADE_CORRUPTION_THRESHOLD (0.35)
- Chaos particle emission pri cascade corruption na linkoch

**Wiring:**
- Inicializovaný v `main.js`: `this.corruptionVisualFX = new CorruptionVisualFX_v1(this.scene, this.aiNodes, false)`
- Pripojený na SemanticBus pre `metric.corruption.spike` event
- Číta `node.userData.metrics.corruption` a `link.userData.metrics.corruption`
- Aplikuje efekty: color tinting, glow flicker, mesh jitter, shader distortion, chaos particles
- Integrácia s CorruptionVisualIntegrationPatch_v1.js a ArchetypeVisualDifferentiationSystem_v1

---

### 2. **CorruptionDesaturationIntegrationPatch.js**
**Trigger Events:**
- Žiadne explicitné trigger events (spúšťa sa pri inicializácii)
- Manuálny update cez `update()` funkciu

**Wiring:**
- Volaný v `main.js`: `applyCorruptionDesaturationIntegration(this.scene, this.aiNodes?.nodes, links)`
- Číta `node.userData.metrics.corruption` a `link.userData.metrics.corruption`
- Aplikuje desaturáciu farieb: lerp(originalColor, neutralGray, corruption * 0.7)
- Ukladá originálne farby do Map pre zachovanie baseline

---

### 3. **CorruptionDrivenAuraDesaturationSystem.js**
**Trigger Events:**
- Žiadne explicitné trigger events
- Automatický update v update loope

**Wiring:**
- Inicializovaný v `main.js`: `this.corruptionAuraDesaturation = new CorruptionDrivenAuraDesaturationSystem(this.aiNodes)`
- Číta `game.nodeAuraSystem.nodeAuras` Map
- Číta `node.userData.metrics.corruption`
- Používa `CorruptionDesaturationController` z LEGACY/aura/
- Kontroluje CASCADE_CORRUPTION_THRESHOLD (0.35) na linkoch

---

### 4. **CascadeParticleSystem_Session120.js**
**Trigger Events:**
- `cascade.hop` - spúšťa cascade particles
- Corruption cascade particles emitované pri `conflictType = 'corruption'`

**Wiring:**
- Inicializovaný cez `setupCascadeParticleSystem(game, options)`
- Pripojený na SemanticBus: `on('cascade.hop', onCascadeHop)`
- Shape index 2 = Fractured Shards (Corruption Conflict)
- Emituje particles cez `_emitCascadeHop()` s 0.3s cooldownom
- Číta `link.userData.flowState.type` pre conflict type

---

### 5. **CascadeEventBridge_v1.js**
**Trigger Events:**
- `metric:corruptionRise` → nastaví cascadeIntensity = 0.9, type = 'corruption'
- `node.synergy.high` → cascadeIntensity = 0.7, type = 'specialization_drift'
- `link:collapsed` → cascadeIntensity = 1.0, type = 'destructive'
- `node.hover` → cascadeIntensity = 0.3, type = 'oscillatory_balance'

**Wiring:**
- Inicializovaný s `linkingSystem`, `semanticBus`, `frameScheduler`, `waveEngine`
- Prepája eventy na `link.userData.flowState` (single source of truth)
- Registruje decay update na FrameScheduler: `register('visual', this._decayUpdate)`
- Emituje `cascade.start`, `cascade.end`, `cascade.hop` events
- Decay rate: 0.92 per frame (30 Hz visual layer)

---

## 5 SYNERGY VFX

### 5.1. SynergyHighwayVisuals3D_1_0.js
**Type:** 🎨 GEOMETRY/MESH EMITTER

**Scene Additions:**
- 3D arc/ribbon highway meshes connecting category clusters
- `TubeGeometry` flow meshes with animated UV shader scrolling
- Optional bloom/glow halo layers for critical routes
- Debug anchors for category positions and highway endpoints

**What it Does:**
- Renders real-time synergy highways from aggregated route data
- Drives width, color, speed, and bloom from link synergy metrics
- Updates highway geometry on data refresh and in the per-frame visual update loop

**Wiring:**
- Reads: `linkingSystem.links`, `link.userData.synergy`, `link.userData.cascadeStrength`
- Uses: `CatmullRomCurve3`, `TubeGeometry`, and shader-based flow animation
- Integrates with: `scene`, `renderer`, optional `historyTracker`, and category anchor computation

**Trigger conditions:**
- Highway data changes or explicit `refreshFromHighways()` calls
- Periodic rebuild/update cycles driven by route aggregation updates

**Submetrics Read:**
- `link.userData.synergy`
- `link.userData.cascadeStrength`
- trend/volatility from highway history
- category anchor positions derived from node categories

---

### 5.2. SynergyChainReaction_v1.js
**Type:** 🎨 EVENT-DRIVEN VISUAL LOGIC

**Scene Additions:**
- No direct geometry by default, but emits link/node reaction events
- Enables downstream shader/mesh systems to visualize chain reactions
- Supports event objects for link intensity, frequency, direction, and hop index

**What it Does:**
- Propagates synergy chain reactions through connected nodes and links
- Detects high-synergy nodes and spreads secondary/tertiary visual reaction events
- Applies decay per hop and limits propagation depth for stability

**Wiring:**
- Uses internal node state via `WeakMap` and per-frame cadence gating
- Reads: node synergy, resonance similarity, personality compatibility, link visual metrics
- Outputs: reusable link/node event payloads for shader integration

**Trigger conditions:**
- Node synergy crossing `primaryThreshold` (default ~0.75)
- Each hop propagates only if intensity stays above minimum and resonance remains compatible
- Stops when intensity < 0.1 or hop count > 8

**Submetrics Read:**
- node synergy and resonance similarity
- `link.userData.visualMetrics.synergyBonus`
- node personality compatibility and chain state

---

## 6 HARMONY VFX

### 6.1. HarmonicNodeResonanceHalos.js
**Type:** 🎨 GEOMETRY/MESH EMITTER

**Scene Additions:**
- Soft resonance halo meshes attached to harmonic hub nodes
- Emissive materials with phase-synced breathing and pulse modulation
- Single cached halo mesh per node, no per-frame geometry allocation

**What it Does:**
- Visualizes harmonic hub authority, stability, and health through halos
- Activates when nodes have sufficient active links and synchronization strength
- Modulates halo distortion based on harmony, synergy, corruption, and recovery

**Wiring:**
- Reads: hub phase, active link count, synchronization strength, resilience state
- Subscribes to semantic/harmony events and updates cached halo materials
- Uses: cached geometry/material and deterministic phase computation

**Trigger conditions:**
- `activeLinkCount >= 2` and `hubSynchronizationStrength > 0`
- Higher harmony levels increase clarity and smoothness
- Corruption/stress introduces wobble, distortion, and flicker

**Submetrics Read:**
- harmony, synergy, corruption, stability, resilience
- hub phase frequency and alignment
- active link density around the node

---

## 7 CORRUPTION VFX

### 7.1. CorruptionVisualFX_v1.js
**Type:** 🎨 GEOMETRY/MESH FX LAYER

**Scene Additions:**
- Dynamic color tinting and glow on corrupted nodes/links
- Shader UV distortion, warping, and mesh jitter effects
- `CorruptionVisualFX_Particles` group for chaos particle emission
- Delegates particle handling to `T2_CorruptionVisualIntegration_v1`

**What it Does:**
- Visualizes corruption progression from subtle to extreme
- Applies visual distortion, glow flicker, and particle feedback
- Uses `VisualTime` for canonical timing and safe THREE.js fallback

**Wiring:**
- Initialized via `new CorruptionVisualFX_v1(this.scene, this.aiNodes, false)`
- Reads corruption from: `nodeModel.userData.metrics.corruption`, `gameplay.corruptionLevel`, `userData.corruption`
- Does not bind direct semantic listeners in current shell; particle pulses are delegated to T2 integration
- `triggerCorruptionPulse(nodeId)` forwards to `T2_CorruptionVisualIntegration_v1.triggerCorruptionPulse`

**Trigger conditions:**
- corruption thresholds at ~0.25, 0.45, 0.65, 0.85
- `CASCADE_CORRUPTION_THRESHOLD` (0.35) enables stronger particle/chaos effects

**Submetrics Read:**
- node/link corruption values and flags
- high corruption state markers like `corruptionHigh` and `isCorrupted`
- cascade corruption state and per-node visual intensity

---

## Prívodné Body pre Corruption Metric

**Hlavný výpočet:**
- `CoreMetricsCalculator.calculateCorruption()` - priemer zo `node.userData.metrics.corruption`
- `ArchetypeGameplayEffects_v1.js` - aktualizuje `gameplayState.corruptionLevel` podľa stability

**Iné systémy používajúce corruption:**
- ArchetypeGameplayEffects_v1.js - corruptionRisk, isCorrupted flag
- CascadingRuptureSystem.js - CORRUPTION_THRESHOLD (0.35)
- CascadingHarmonicResonanceAmplification.js - corruptionDamping factor
- CompositeGlyphGenerator.js - corruptionFactor pre geometry
- LinkCorruptionTransmission_v1.js - prenos corruption na linkoch

---

## Summary

| Súbor | Trigger Events | Wiring |
|-------|---------------|--------|
| CorruptionVisualFX_v1.js | `metric.corruption.spike` | main.js → SemanticBus → node/link.userData.metrics |
| CorruptionDesaturationIntegrationPatch.js | žiadne (manual update) | main.js → applyCorruptionDesaturationIntegration() |
| CorruptionDrivenAuraDesaturationSystem.js | žiadne (auto update) | main.js → game.nodeAuraSystem.nodeAuras |
| CascadeParticleSystem_Session120.js | `cascade.hop` | SemanticBus → _emitCascadeHop() → particles |
| CascadeEventBridge_v1.js | `metric:corruptionRise` | SemanticBus → link.userData.flowState → FrameScheduler |

**Kľúčové konštanty:**
- `CASCADE_CORRUPTION_THRESHOLD = 0.35`
- Decay rate: 0.92 per frame
- Corruption cascade particles: Shape index 2 (Fractured Shards)