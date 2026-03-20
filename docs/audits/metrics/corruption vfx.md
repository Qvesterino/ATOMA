# CORRUPTION VFX EFFECTS - AUDIT REPORT

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