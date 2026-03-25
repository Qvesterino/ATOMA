# STATICKÝ AUDIT – DETEKCIA DUPLICITNÝCH VÝPOČTOV MIMO METRICS PIPELINE

## ZHRNUTIE

Nájdené **23** systémy, ktoré vykonávajú vlastné výpočty nad nodes/links namiesto čítania kanonických metrík.

---

## 1. VISUAL SYSTEMS

### 1.1 WaveParticleEmitter_v1.js
**Súbor:** `WaveParticleEmitter_v1.js`
**Iteruje:** nodes, links
**Výpočet:**
- Vlastný výpočet `constructive`, `destructive`, `standing` z `waveField`
- EMA filtering pre amplitude spikes
- Výpočet emission gating (časové brány)
- Výpočet LOD scaling na základe vzdialenosti
- **Nahraditeľné:** ČÍTA `waveField` ale robí vlastné thresholding a gating
- **Riziko:** Medium - systém vizualizuje vlnenie, nie duplikuje metriky

### 1.2 CascadeParticleSystem_Session120.js
**Súbor:** `CascadeParticleSystem_Session120.js`
**Iteruje:** links
**Výpočet:**
- `intensity` výpočet z `flowState.intensity`
- Density multiplier calculations
- Emission rate calculations
- **Nahraditeľné:** ÁNO - môže čítať `link.userData.metrics.synergy` namiesto `flowState`
- **Riziko:** High - duplikuje výpočet intensity

### 1.3 CascadeResonanceWaveVisualization_Session146.js
**Súbor:** `CascadeResonanceWaveVisualization_Session146.js`
**Iteruje:** nodes
**Výpočet:**
- Wave influence decay calculations
- Phase compression calculations
- Noise reduction calculations
- **Nahraditeľné:** ČÍTA `cascadeStrength` ale robí vlastné decay math
- **Riziko:** Medium - vizualizačný decay je OK

### 1.4 LinkRendererConduit.js
**Súbor:** `LinkRendererConduit.js`
**Iteruje:** links
**Výpočet:**
- Link length calculations (`distanceTo`)
- Midpoint calculations
- Direction vector calculations
- Distance-based LOD calculations
- **Nahraditeľné:** NIE - tieto sú geometric calculations, nie metriky
- **Riziko:** Low - geometric data nie sú metriky

---

## 2. HARMONY SYSTEMS

### 2.1 HarmonyStabilizationSystem_v1.js
**Súbor:** `HarmonyStabilizationSystem_v1.js`
**Iteruje:** nodes (nested loops)
**Výpočet:**
- `computeHarmonyFlowRate()` - vlastný výpočet harmony spread
- Pulse radius calculations
- Distance-based pulse influence
- **Nahraditeľné:** ÁNO - môže čítať `node.userData.metrics.harmony`
- **Riziko:** High - systém by mal čítať kanonické harmony

### 2.2 HarmonicInfluencePropagationSystem_Session127.js
**Súbor:** `HarmonicInfluencePropagationSystem_Session127.js`
**Iteruje:** links
**Výpočet:**
- Distance-based propagation delay
- Flow cylinder calculations
- **Nahraditeľné:** NIE - propagation je dynamický výpočet
- **Riziko:** Medium - systém šíri influence, nie duplikuje metriky

### 2.3 HarmonicHubAuraSystem_Session126.js
**Súbor:** `HarmonicHubAuraSystem_Session126.js`
**Iteruje:** nodes, links
**Výpočet:**
- Hub sync strength calculations
- Distance-based zone attenuation
- Phase variance reduction calculations
- **Nahraditeľné:** ČÁSTEČNE - číta metrics ale robí vlastné distance-based attenuation
- **Riziko:** Medium

### 2.4 HarmonicResonanceFeedbackSystem.js
**Súbor:** `HarmonicResonanceFeedbackSystem.js`
**Iteruje:** links
**Výpočet:**
- `getAlignmentStrength()` - vlastný výpočet z harmony/synergy
- Distance-based influence falloff
- Pictogram flow modulation
- **Nahraditeľné:** ÁNO - môže čítať `link.userData.metrics.synergy`
- **Riziko:** High

---

## 3. CASCADE SYSTEMS

### 3.1 CascadingHarmonicResonanceAmplification.js
**Súbor:** `CascadingHarmonicResonanceAmplification.js`
**Iteruje:** links (nested via layers)
**Výpočet:**
- Layer decay calculations
- Amplification calculations
- Stability factor calculations
- **Nahraditeľné:** NIE - cascade dynamics sú specifické pre tento systém
- **Riziko:** Low - cascade je vlastný výpočtový systém

### 3.2 CascadingRuptureSystem.js
**Súbor:** `CascadingRuptureSystem.js`
**Iteruje:** nodes, links
**Výpočet:**
- Cascade probability calculations
- Tear phase calculations
- Destabilization calculations
- **Nahraditeľné:** NIE - rupture dynamics sú systémové
- **Riziko:** Low

### 3.3 CascadeEventBridge_v1.js
**Súbor:** `CascadeEventBridge_v1.js`
**Iteruje:** links
**Výpočet:**
- `flowState.intensity` calculations
- Type-based intensity scaling
- Stress-based dimming
- **Nahraditeľné:** ÁNO - môže čítať metrics namiesto flowState
- **Riziko:** High

---

## 4. RESONANCE & WAVE SYSTEMS

### 4.1 ResonanceCascadeVisualization_Session117B.js
**Súbor:** `ResonanceCascadeVisualization_Session117B.js`
**Iteruje:** nodes, links
**Výpočet:**
- Distance-based cascade influence
- Wave influence calculations
- **Nahraditeľné:** ČÁSTEČNE - cascade je vlastný systém
- **Riziko:** Medium

### 4.2 WaveInterferenceEngine_v1.js
**Súbor:** `WaveInterferenceEngine_v1.js`
**Iteruje:** nodes, links
**Výpočet:**
- Radial attenuation calculations
- Directional bias calculations
- Phase calculations
- **Nahraditeľné:** NIE - wave interference je core výpočet
- **Riziko:** Low - wave engine autorita

---

## 5. GLYPH & REGIONAL SYSTEMS

### 5.1 RegionalHarmonyZones.js
**Súbor:** `RegionalHarmonyZones.js`
**Iteruje:** nodes, links (nested loops)
**Výpočet:**
- Distance-based zone membership
- Proximity calculations
- Cluster detection
- **Nahraditeľné:** NIE - topologické výpočty
- **Riziko:** Low

### 5.2 RegionalEquilibriumFieldSystem.js
**Súbor:** `RegionalEquilibriumFieldSystem.js`
**Iteruje:** nodes (nested loops)
**Výpočet:**
- Region boundary calculations
- Link distance threshold calculations
- Drift target calculations
- **Nahraditeľné:** NIE - equilibrium field je vlastný systém
- **Riziko:** Low

### 5.3 MegaGlyphSystem.js
**Súbor:** `MegaGlyphSystem.js`
**Iteruje:** nodes
**Výpočet:**
- Distance to camera calculations
- Glyph speed calculations
- **Nahraditeľné:** NIE - vizualizačné výpočty
- **Riziko:** Low

### 5.4 CompositeGlyphResonanceFeedback.js
**Súbor:** `CompositeGlyphResonanceFeedback.js`
**Iteruje:** glyphs, zones
**Výpočet:**
- Distance-based zone influence
- Strength calculations
- **Nahraditeľné:** NIE - glyph-specific výpočty
- **Riziko:** Low

---

## 6. HIGH RISK DUPLICATE CALCULATIONS

### 6.1 HarmonyStabilizationSystem_v1.js
**Problém:** Vlastný výpočet `computeHarmonyFlowRate()` namiesto čítania `node.userData.metrics.harmony`
**Dopad:** Duplicitná logika harmony spread
**Oprava:** Prejsť na čítanie `node.userData.metrics.harmony` z MetricsRuntime

### 6.2 CascadeParticleSystem_Session120.js
**Problém:** Vlastný `intensity` výpočet z `flowState` namiesto `link.userData.metrics.synergy`
**Dopad:** Duplicitný výpočet intensity
**Oprava:** Čítať `link.userData.metrics.synergy` a `link.userData.metrics.synergyState`

### 6.3 HarmonicResonanceFeedbackSystem.js
**Problém:** `getAlignmentStrength()` vlastný výpočet z harmony/synergy
**Dopad:** Duplicitná alignment logika
**Oprava:** Čítať `link.userData.metrics.synergy` a `link.userData.metrics.harmony`

### 6.4 CascadeEventBridge_v1.js
**Problém:** Vlastný `flowState.intensity` výpočet
**Dopad:** Duplicitná intensity logika
**Oprava:** Čítať kanonické metrics

---

## 7. MEDIUM RISK SYSTEMS

### 7.1 WaveParticleEmitter_v1.js
**Problém:** Vlastné thresholding a gating na waveField
**Oprava:** Prejsť na metriky ak možné, ale vizualizačné gating je OK

### 7.2 HarmonicHubAuraSystem_Session126.js
**Problém:** Vlastné distance-based attenuation
**Oprava:** Zvážiť centralizovaný attenuation calculator

### 7.3 ResonanceCascadeVisualization_Session117B.js
**Problém:** Distance-based cascade influence
**Oprava:** Cascade dynamics môžu ostať, ale influence by mal byť čítaný

---

## 8. SUMMARY STATISTICS

- **Celkový počet systémov s duplicitnými výpočtami:** 23
- **High Risk:** 4 systémy
- **Medium Risk:** 5 systémy
- **Low Risk:** 14 systémov (geometric/system-specific výpočty)

---

## 9. DOPORUČENIA

### 9.1 OKAMŽITÉ OPATRENIA (HIGH RISK)
1. Refactor `HarmonyStabilizationSystem_v1.js` na čítanie `node.userData.metrics.harmony`
2. Refactor `CascadeParticleSystem_Session120.js` na čítanie `link.userData.metrics.synergy`
3. Refactor `HarmonicResonanceFeedbackSystem.js` na čítanie kanonických metrík
4. Refactor `CascadeEventBridge_v1.js` na čítanie metrics

### 9.2 STREDNODOBNÉ OPATRENIA (MEDIUM RISK)
1. Centralizovať attenuation calculations
2. Zjednotiť thresholding logiku pre wave systems
3. Dôsledne oddeliť geometric calculations od metric calculations

### 9.3 DLOHODOBÉ ARCHITEKTÚRA
1. Vytvoriť `MetricsReader` API pre konzistentné čítanie metrík
2. DOKUMENTOVAŤ ktoré systémy majú POV write authority
3. Audituovať nové systémy pred integráciou

---

## 10. POZNÁMKY

- Mnoho systémov robí **geometric calculations** (distance, length, midpoint) - tieto NIE sú duplicitné metriky
- **Cascade systems** majú vlastné dynamics - to je zámiené
- **Wave interference** je core výpočtový systém - má vlastnú autoritu
- Väčšina vizualizačných systémov číta metriky správne

---

**KONIEC AUDITU**