# VFX METRICS AUDIT REPORT
## Audit vizuálnych systémov a ich metrických závislostí

**Dátum:** 2026-03-26
**Rozsah:** Wave, Particle, Cascade, Resonance VFX systémy

---

## LEGENDA

| Status | Význam |
|--------|--------|
| ✅ | Metrika je emitovaná a čítaná - správne zapojené |
| ⚠️ | Metrika je čítaná, ale emitovaná len interne (v rámci toho istého systému) |
| ❌ | Metrika je čítaná, ale NIKDE nie je emitovaná - ZOMBIE |
| 🔶 | Metrika má fallback/hardcoded default - funguje ale nie dynamicky |

---

## IDENTIFIKOVANÉ VFX SYSTÉMY

### 1. CASCADE SYSTÉMY

| Súbor | Status | Číta metriky | Emituje cascade eventy |
|-------|--------|--------------|------------------------|
| `ResonanceCascadeVisualization_Session117B.js` | ✅ | `cascade.start/hop/end` cez semanticBus | Nie (consumer) |
| `SynergyCascadeVisualizer.js` | ✅ | `cascade.start/hop/end` cez semanticBus | Nie (consumer) |
| `CascadeParticleSystem_Session120.js` | ✅ | `cascade.hop` cez semanticBus | Áno |
| `CascadeEventBridge_v1.js` | ✅ | `node.synergy.high`, `metric:corruptionRise`, `link:collapsed` | Áno |
| `CascadeResonanceWaveVisualization_Session146.js` | ✅ | `cascade.hop` cez semanticBus | Nie (consumer) |
| `CascadeParticleColorTinting_Session119.js` | ✅ | `link.userData.cascadeIntensity` | Nie (consumer) |
| `CascadeParticleEmissionBoost_Session118.js` | ✅ | `link.userData.cascadeIntensity` | Nie (consumer) |

**Verdikt CASCADE:** ✅ Všetky cascade systémy sú správne zapojené.

---

### 2. WAVE SYSTÉMY

| Súbor | Číta metriky | Status |
|-------|--------------|--------|
| `StandingWaveVisualRenderer_Session131.js` | `trap.amplitude`, `trap.phase` | ✅ (z StandingWaveTrapSystem) |
| `StandingWaveOscillationTrapSystem_Session130.js` | `node.userData.resonance`, `node.userData.waveField.amplitude` | ⚠️ (interné) |
| `WaveInterferencePatternSystem_Session132.js` | `node.instability`, `node.synergy`, `node.corruption` | ✅ |
| `WaveParticleEmitter_v1.js` | `waveInterferenceIntensity`, `standingWaveAmplitude` | 🔶 (hardcoded config) |
| `WaveInterferenceEngine_v1.js` | `stability`, `instability` | ✅ |
| `WaveBurstRouter_v1.js` | `cascade.hop`, `cascade.start` eventy | ✅ |
| `WaveShaderBridge_v1.js` | `link.userData.waveField` | ✅ |
| `WaveTravelShaderPack_v1.js` | shader uniforms | ✅ |
| `WaveDynamicsShaderPack_v1.js` | shader uniforms | ✅ |

**Verdikt WAVE:** ✅ Wave systémy sú väčšinou správne zapojené.

---

### 3. PARTICLE SYSTÉMY

| Súbor | Číta metriky | Status |
|-------|--------------|--------|
| `ParticleSemanticDensityAdapter_Session121.js` | `link.userData.cascadeIntensity` | ✅ |
| `ParticleTrailSystem_Session122.js` | cascade system state | ✅ |
| `ParticleCascadeFlowDeflection.js` | `nodeDynamicMetrics`, cascade | ✅ |
| `ParticleStreamCascadeAcceleration.js` | wave, cascade, node metrics | ✅ |
| `HealingParticleSystem_Session136.js` | resonance rupture system | ✅ |
| `LinkCorruptionParticleSystem.js` | `link.userData.corruptionLevel` | ✅ |
| `LinkHealingParticleSystem.js` | link state | ✅ |
| `LinkTrailParticleSystem.js` | link state | ✅ |

**Verdikt PARTICLE:** ✅ Particle systémy čítajú existujúce metriky.

---

### 4. RESONANCE SYSTÉMY

| Súbor | Číta metriky | Status |
|-------|--------------|--------|
| `ResonanceRuptureVisualSystem_Session133.js` | `link.userData.cascadeIntensity`, `metric.corruption.spike` | ✅ |
| `ResonanceFeedback_v1.js` | `node.userData.synergy`, `link.userData.synergy` | ✅ |
| `ResonanceEchoTrailSystem.js` | resonance state | ⚠️ (interné) |
| `HarmonicResonanceFeedbackSystem.js` | harmony, corruption | ✅ |
| `HarmonicResonanceCoupling_v1.js` | node metrics | ✅ |
| `CompositeGlyphResonanceFeedback.js` | glyph state | ⚠️ (interné) |

**Verdikt RESONANCE:** ✅ Resonance systémy sú zapojené.

---

## POTENCIÁLNE PROBLÉMY (ZOMBIE METRIKY)

### ❌ `node.userData.energy`

**Čítajú:**
- [`MegaGlyphSystem.js:563`](MegaGlyphSystem.js:563) - `energy: node.userData.energy || 0.5`
- [`_AtomaGlyphSystem4_0.js:158`](_AtomaGlyphSystem4_0.js:158) - `energy: node.userData.energy || 0.5`
- [`SNIPPETS/WEEK13_ARCHETYPE_CURVES_SNIPPETS.js:320`](SNIPPETS/WEEK13_ARCHETYPE_CURVES_SNIPPETS.js:320)

**Emitujú:**
- ŽIADNY canonical writer pre `node.userData.energy`
- Iba `link.userData.flowState.energy` v [`CascadeEventBridge_v1.js:198`](CascadeEventBridge_v1.js:198)

**Verdikt:** ❌ **ZOMBIE** - Node energy nie je emitovaná, vždy fallback na 0.5

---

### ❌ `node.userData.clarity`

**Čítajú:**
- [`MegaGlyphSystem.js:564`](MegaGlyphSystem.js:564) - `clarity: node.userData.clarity || 0.5`
- [`_AtomaGlyphSystem4_0.js:159`](_AtomaGlyphSystem4_0.js:159) - `clarity: node.userData.clarity || 0.5`

**Emitujú:**
- ŽIADNY writer pre `node.userData.clarity`
- `VisualMetricModel_v1.js` má `clarityNorm` ale mapuje z `nodeDynamicMetrics.clarity`

**Verdikt:** ❌ **ZOMBIE** - Clarity nie je emitovaná na node.userData

---

### ⚠️ `node.userData.resonance`

**Čítajú:**
- [`StandingWaveOscillationTrapSystem_Session130.js:730`](StandingWaveOscillationTrapSystem_Session130.js:730)
- [`SNIPPETS/WEEK13_ARCHETYPE_CURVES_SNIPPETS.js:319`](SNIPPETS/WEEK13_ARCHETYPE_CURVES_SNIPPETS.js:319)

**Emitujú:**
- Iba [`StandingWaveOscillationTrapSystem_Session130.js:733`](StandingWaveOscillationTrapSystem_Session130.js:733) - **interne**

**Verdikt:** ⚠️ **INTERNÉ** - Funguje len ak trap system beží

---

### ⚠️ `node.userData.integrity`

**Čítajú:**
- [`MetricInterpretationLayer_v1.js:77`](MetricInterpretationLayer_v1.js:77) - `integrity: node.userData.integrity || 1`

**Emitujú:**
- Iba `LinkCorruptionTransmission_v1.js` pre **link integrity**, nie node

**Verdikt:** ❌ **ZOMBIE** pre nodes - existuje len pre links

---

### ✅ `node.userData.instability`

**Čítajú:**
- Mnoho systémov (pozri search results)

**Emitujú:**
- [`MetricsRuntime_v1.js:634`](MetricsRuntime_v1.js:634) - `userData.instability = instability`

**Verdikt:** ✅ **SPRÁVNE** - Emitované v MetricsRuntime

---

### ✅ `link.userData.waveField`

**Čítajú:**
- [`StandingWaveOscillationTrapSystem_Session130.js`](StandingWaveOscillationTrapSystem_Session130.js)
- [`CascadingHarmonicResonanceAmplification.js`](CascadingHarmonicResonanceAmplification.js)
- [`LinkCascadeInfectionSystem.js`](LinkCascadeInfectionSystem.js)

**Emitujú:**
- [`CascadeToWaveBridge_v1.js:225`](CascadeToWaveBridge_v1.js:225)
- [`CascadingHarmonicResonanceAmplification.js:550`](CascadingHarmonicResonanceAmplification.js:550)
- [`LinkCascadeInfectionSystem.js:340`](LinkCascadeInfectionSystem.js:340)

**Verdikt:** ✅ **SPRÁVNE**

---

## ZHRNUTIE

### ✅ Fungujúce metriky (emitované a čítané):
- `harmony`, `harmonyLevel`
- `corruption`, `corruptionLevel`
- `synergy` (link)
- `loadPressure`
- `cascadeIntensity`
- `instability` (derived from stability)
- `stability`
- `waveField` (link)

### ❌ Zombie metriky (čítané, ale nie emitované):
- `node.userData.energy` - vždy 0.5
- `node.userData.clarity` - vždy 0.5
- `node.userData.integrity` - vždy 1

### ⚠️ Interné metriky (fungujú len v kontexte):
- `node.userData.resonance` - len v trap system

---

## ODPORÚČANIA

### 1. `energy` a `clarity` v MegaGlyphSystem

**Problém:** MegaGlyphSystem číta `node.userData.energy` a `node.userData.clarity` ktoré nie sú emitované.

**Riešenie:**
```javascript
// Option A: Odstrániť závislosť (použiť hardcoded)
energy: 0.5,  // alebo vypočítať z iných metrík
clarity: 0.5,

// Option B: Emitovať z MetricsRuntime
// V MetricsRuntime_v1.js pridať:
userData.energy = this._computeEnergy(metrics);
userData.clarity = this._computeClarity(metrics);
```

### 2. `integrity` v MetricInterpretationLayer

**Problém:** Číta `node.userData.integrity` ktorá neexistuje pre nodes.

**Riešenie:**
```javascript
// MetricInterpretationLayer_v1.js:77
integrity: node.userData.integrity ?? node.userData.metrics?.stability ?? 1,
```

### 3. `resonance` v SNIPPETS

**Problém:** Snippet kód ukazuje čítanie `node.userData.resonance` bez kontextu.

**Riešenie:** Dokumentovať že resonance vyžaduje `StandingWaveOscillationTrapSystem`.

---

## KANONICKÉ ZDROJE METRÍK

| Metrika | Kanonický zdroj |
|---------|-----------------|
| `harmony` | `MetricsRuntime_v1.js` → `userData.harmony`, `userData.harmonyLevel` |
| `corruption` | `MetricsRuntime_v1.js` → `userData.corruption`, `userData.corruptionLevel` |
| `synergy` (link) | `ComputeSynergyScore2_1.js` → `link.userData.synergy.score` |
| `loadPressure` | `MetricsRuntime_v1.js` → `userData.loadPressure` |
| `stability` | `MetricsRuntime_v1.js` → `userData.metrics.stability` |
| `instability` | `MetricsRuntime_v1.js` → `userData.instability` (derived: 1 - stability) |
| `cascadeIntensity` | `LinkSemanticMetricsBridge_v1.js`, `CascadeEventBridge_v1.js` |

---

## ZÁVER

**Väčšina VFX systémov je správne zapojená.** Hlavné problémy sú:

1. **`energy` a `clarity`** v glyph systémoch - hardcoded fallback
2. **`integrity`** pre nodes - neexistuje

Tieto metriky buď:
- Odstrániť z čítania (použiť iné metriky)
- Alebo pridať emisiu do `MetricsRuntime_v1.js`
