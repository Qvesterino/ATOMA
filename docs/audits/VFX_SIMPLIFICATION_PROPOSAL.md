# VFX SIMPLIFICATION PROPOSAL
## Zjednodušenie metrických závislostí pre4 vybrané systémy

**Dátum:** 2026-03-26
**Cieľ:** Zredukovať počet podmienok z5 na 1-2, použiť len kanonické metriky

---

## ANALÝZA SÚČASNÉHO STAVU

### 1. ResonanceEchoTrailSystem.js

**Súčasný stav:**
- Číta: `harmonyBalance`, `stability`, `synergy` (interné glyph state)
- Zdroj: `compositeGlyph.glyphData` (nie kanonické)

**Problém:**
- Metriky prichádzajú z composite glyph internals, nie z node.userData.metrics
- 3 rôzne metriky na moduláciu lifetime

---

### 2. CompositeGlyphResonanceFeedback.js

**Súčasný stav:**
- Číta: `glyphData.harmonyDominance`, `glyphData.corruptionLevel`, `glyphData.synergyCoherence`, `glyphData.stabilityIndex`
- Zdroj: `compositeGlyph.glyphData` (nie kanonické)

**Problém:**
- 4 rôzne interné metriky
- Žiadna závislosť na kanonických node metrics

---

### 3. StandingWaveOscillationTrapSystem_Session130.js

**Súčasný stav:**
- Číta: `harmony`, `corruption`, `instability`, `synergy` cez `_readNodeMetric()`
- `_readNodeMetric` číta z: `node[metric]`, `node.userData[metric]`, `node.userData.metrics[metric]`

**Status:** ✅ **SPRÁVNE** - už používa kanonické metriky!

**Problém:**
- 4 rôzne metriky na výpočet amplitúdy
- Možné zjednodušenie

---

### 4. WaveParticleEmitter_v1.js

**Súčasný stav:**
- Používa hardcoded config: `constructiveThreshold: 0.08`, `destructiveThreshold: 0.10`, `standingWaveThreshold: 0.12`
- Číta: `waveInterferenceIntensity`, `standingWaveAmplitude` (z WaveInterferenceEngine)

**Problém:**
- Hardcoded thresholdy nie sú dynamické
- Závislosť na WaveInterferenceEngine (interné)

---

## KANONICKÉ METRIKY (emitované)

| Metrika | Zdroj | Hodnota |
|---------|-------|---------|
| `harmony` | MetricsRuntime_v1 | 0-1 |
| `corruption` | MetricsRuntime_v1 | 0-1 |
| `stability` | MetricsRuntime_v1 | 0-1 |
| `instability` | MetricsRuntime_v1 | 0-1 (derived: 1 - stability) |
| `synergy` (link) | ComputeSynergyScore2_1 | 0-1 |
| `cascadeIntensity` | LinkSemanticMetricsBridge | 0-1 |

---

## ODPORÚČANIA

### 1. ResonanceEchoTrailSystem.js

**Zjednodušenie:** Použiť len `harmony` a `corruption` z node metrics

```javascript
// BEFORE (3 metriky, interné)
spawn(position, compositeGeometry, harmonyBalance, stability, synergy, currentVisualTime)

// AFTER (2 metriky, kanonické)
spawn(position, compositeGeometry, nodeMetrics, currentVisualTime) {
    const harmony = nodeMetrics?.harmony ?? 0.5;
    const corruption = nodeMetrics?.corruption ?? 0;
    
    // Lifetime: harmony predlžuje, corruption skracuje
    const lifetimeMod = 1.0 + (harmony - corruption) * 0.3;
    this.lifetime = CONFIG.BASE_ECHO_LIFETIME * Math.max(0.7, Math.min(1.5, lifetimeMod));
}
```

**Zmena:** 3 interné → 2 kanonické

---

### 2. CompositeGlyphResonanceFeedback.js

**Zjednodušenie:** Použiť len `harmony` a `corruption` z pripojených nodes

```javascript
// BEFORE (4 interné metriky)
this.harmonyModulation = 1.0 + (glyphData.harmonyDominance * CONFIG.HARMONY_ENHANCEMENT);
this.corruptionModulation = 1.0 - (glyphData.corruptionLevel * CONFIG.CORRUPTION_SUPPRESSION);
this.synergyBoost = 1.0 + (glyphData.synergyCoherence * CONFIG.SYNERGY_COHERENCE_BOOST);
this.stabilityFactor = 1.0 - (glyphData.stabilityIndex * CONFIG.STABILITY_WEAKENING_FACTOR);

// AFTER (2 kanonické metriky)
updateFromCompositeState(nodeMetrics) {
    const harmony = nodeMetrics?.harmony ?? 0.5;
    const corruption = nodeMetrics?.corruption ?? 0;
    
    // Single combined modulation factor
    const resonanceStrength = harmony * (1 - corruption * 0.5);
    this.influenceRadius = CONFIG.BASE_INFLUENCE_RADIUS * (0.7 + resonanceStrength * 0.6);
}
```

**Zmena:** 4 interné → 2 kanonické

---

### 3. StandingWaveOscillationTrapSystem_Session130.js

**Status:** ✅ Už používa kanonické metriky

**Zjednodušenie:** Redukovať z4 na 2 metriky

```javascript
// BEFORE (4 metriky)
const harmonyA = this._readNodeMetric(trap.nodeA, 'harmony', 0.5);
const harmonyB = this._readNodeMetric(trap.nodeB, 'harmony', 0.5);
const corruptionA = this._readNodeMetric(trap.nodeA, 'corruption', 0.5);
const corruptionB = this._readNodeMetric(trap.nodeB, 'corruption', 0.5);
const instabilityA = this._readNodeMetric(trap.nodeA, 'instability', 0);
const instabilityB = this._readNodeMetric(trap.nodeB, 'instability', 0);
const synergyAvg = ...;

// AFTER (2 metriky)
_updateTrapAmplitude(trap) {
    const harmony = (
        this._readNodeMetric(trap.nodeA, 'harmony', 0.5) +
        this._readNodeMetric(trap.nodeB, 'harmony', 0.5)
    ) * 0.5;
    
    const corruption = (
        this._readNodeMetric(trap.nodeA, 'corruption', 0) +
        this._readNodeMetric(trap.nodeB, 'corruption', 0)
    ) * 0.5;
    
    // Harmony weakens trap, corruption strengthens
    const baseAmplitude = this.config.standingWaveAmplitude;
    trap.amplitude = baseAmplitude * (1 - harmony * 0.5 + corruption * 0.3);
    trap.amplitude = Math.max(0, Math.min(2, trap.amplitude));
}
```

**Zmena:** 4 metriky → 2 metriky

---

### 4. WaveParticleEmitter_v1.js

**Zjednodušenie:** Nahradiť hardcoded thresholdy kanonickými metrikami

```javascript
// BEFORE (hardcoded)
constructiveThreshold: 0.08,
destructiveThreshold: 0.10,
standingWaveThreshold: 0.12,

// AFTER (dynaické z cascadeIntensity)
shouldEmitConstructive(link) {
    const cascadeIntensity = link?.userData?.cascadeIntensity ?? 0;
    return cascadeIntensity > 0.15; // Single threshold
}

shouldEmitDestructive(link) {
    const corruption = link?.userData?.corruptionLevel ?? 0;
    return corruption > 0.5; // Single threshold
}
```

**Zmena:** 3 hardcoded → 2 kanonické

---

## ZHRNUTIE ZMIEN

| Systém | Pred | Po | Úspora |
|--------|------|-----|--------|
| ResonanceEchoTrailSystem | 3 interné | 2 kanonické | -1 metrika |
| CompositeGlyphResonanceFeedback | 4 interné | 2 kanonické | -2 metriky |
| StandingWaveOscillationTrapSystem | 4 kanonické | 2 kanonické | -2 metriky |
| WaveParticleEmitter | 3 hardcoded | 2 kanonické | -1 hardcoded |

**Celkovo:** 14 metrík → 8 metrík (43% redukcia)

---

## PRAVIDLÁ PRE IMPLEMENTÁCIU

1. **Vždy čítať z kanonických zdrojov:**
   - `node.userData.metrics.harmony`
   - `node.userData.metrics.corruption`
   - `node.userData.harmony` (fallback)
   - `link.userData.synergy.score`
   - `link.userData.cascadeIntensity`

2. **Maximálne 2 metriky per systém:**
   - Primary: `harmony` (pozitívny efekt)
   - Secondary: `corruption` (negatívny efekt)

3. **Žiadne interné "glyphData" metriky:**
   - Ak glyph systém potrebuje metriky, čítať z pripojených nodes

4. **Fallback hodnoty:**
   - `harmony`: 0.5 (neutrálne)
   - `corruption`: 0 (žiadna)
   - `cascadeIntensity`: 0 (neaktívne)

---

## ĎALŠIE KROKY

1. Implementovať zmeny v jednotlivých súboroch
2. Testovacie overenie vizuálneho správania
3. Odstrániť nepoužívané interné metriky z glyph systémov
4. Aktualizovať dokumentáciu
