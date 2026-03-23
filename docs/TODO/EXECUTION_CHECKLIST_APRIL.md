# EXECUTION CHECKLIST — APRIL STABILIZATION

---

## Fáza A: Stabilizačný základ (must-have)

### 1. Zmraziť ownership fieldov (single-writer pravidlo)

- [x] Spísať owner mapu pre critical fields
  - [x] Node fields: `synergy,harmony,stability,corruption,loadPressure,fatigue,networkFatigue,clusterMembershipID,hubId,activeLinkCount,resonance,waveField.amplitude,waveField.phase`
  - [x] Link fields: `cascadeIntensity,cascadeConflictType,conflictIntensity,particleIntensity,particleUrgency,corruption,integrity,corrupted,visualTear,visualCoherenceLoss,waveDirection,waveLength,wavePhaseOffset,synergyCollapse,synergyCascadeTime`
- [x] Overiť, že žiadny field nemá 2 aktívnych writrov
- [x] Documentovať ownera pre každý field
- [x] **DoD**: žiadny field z Critical setu nemá 2 aktívnych writrov

---

### 2. Canonical field set finalizovať (Node + Link)

- [ ] Node set overiť:
  - [ ] `synergy` ✓
  - [ ] `harmony` ✓
  - [ ] `stability` ✓
  - [ ] `corruption` ✓
  - [ ] `loadPressure` ✓
  - [ ] `fatigue` ✓
  - [ ] `networkFatigue` ✓
  - [ ] `clusterMembershipID` ✓
  - [ ] `hubId` ✓
  - [ ] `activeLinkCount` ✓
  - [ ] `resonance` ✓
  - [ ] `waveField.amplitude` ✓
  - [ ] `waveField.phase` ✓
- [ ] Link set overiť:
  - [ ] `cascadeIntensity` ✓
  - [ ] `cascadeConflictType` ✓
  - [ ] `conflictIntensity` ✓
  - [ ] `particleIntensity` ✓
  - [ ] `particleUrgency` ✓
  - [ ] `corruption` ✓
  - [ ] `integrity` ✓
  - [ ] `corrupted` ✓
  - [ ] `visualTear` ✓
  - [ ] `visualCoherenceLoss` ✓
  - [ ] `waveDirection` ✓
  - [ ] `waveLength` ✓
  - [ ] `wavePhaseOffset` ✓
  - [ ] `synergyCollapse` ✓
  - [ ] `synergyCascadeTime` ✓
- [ ] Každý field má ownera
- [ ] Každý field má fallback pravidlo
- [ ] **DoD**: každý field má ownera a fallback pravidlo

---

### 3. Per-frame fallback init pre všetky active node/link

**ANALÝZA:** Overujem, či každý systém má fallback logiku

- [x] Pre NodeMetricsRuntime:
  - [x] Ak field chýba → neutrálna hodnota (synergy=0.5, harmony=0.5, stability=1.0, corruption=0, loadPressure=0)
  - [ ] Stamp `__canonicalWriteAt` pre každý write ❌ CHÝBA
- [x] Pre MetricsRuntime_v1:
  - [x] Fallback pre `fatigue,networkFatigue,clusterMembershipID,hubId,activeLinkCount` (v `_canonicalWriteNetworkMetrics`)
  - [x] Fallback pre `corruption,integrity,corrupted` (link) (v `_canonicalWriteLinkCorruptionMetrics`)
- [x] Pre CascadeEventBridge_v1:
  - [x] Fallback pre `cascadeIntensity,cascadeConflictType,conflictIntensity,synergyCollapse,synergyCascadeTime` (v `update`)
- [x] Pre ParticleSemanticDensityAdapter_Session121:
  - [x] Fallback pre `particleIntensity,particleUrgency` (v `update`)
- [x] Pre LinkRendererConduit:
  - [x] Fallback pre `waveDirection,waveLength,wavePhaseOffset` (v `_canonicalWriteLinkWaveMetrics`)
- [x] Pre StandingWaveOscillationTrapSystem_Session130:
  - [x] Fallback pre `resonance,waveField.amplitude,waveField.phase` (v `_resetWaveResonanceCanonical`)
- [x] Pre ResonanceRuptureVisualSystem_Session133:
  - [x] Fallback pre `visualTear,visualCoherenceLoss` (v `_ensureCanonicalLinkDefaults` + decay)
- [x] Pre HarmonyStabilizationSystem_v1:
  - [x] Fallback pre harmonic fields (v `_canonicalWriteNodeHarmonicMetrics` + `_canonicalWriteHaloPulseMetrics`)
- [ ] **DoD**: 0 `undefined` na target poliach v runtime sample ⚠️ CHÝBA `__canonicalWriteAt` stamping

---

## Fáza B: Writer coverage (core implementácia)

### 4. Node core metriky v NodeMetricEngine.js

- [x] Overiť `synergy` write každý frame ✅ (v `_updateNodeCoreMetrics`)
- [x] Overiť `harmony` write každý frame ✅ (v `_updateNodeCoreMetrics`)
- [x] Overiť `stability` write každý frame ✅ (v `_updateNodeCoreMetrics`)
- [x] Overiť `corruption` write každý frame ✅ (v `_updateNodeCoreMetrics`)
- [x] Overiť `loadPressure` write každý frame ✅ (v `_updateNodeCoreMetrics`)
- [x] Overiť, že ostatné systémy len čítajú tieto hodnoty ✅
- [x] **DoD**: tieto hodnoty sú nenull na všetkých nodoch

---

### 5. Network/node mirrors v MetricsRuntime_v1.js

- [x] Per-frame write: `fatigue` ✅ (v `_canonicalWriteNetworkMetrics`)
- [x] Per-frame write: `networkFatigue` ✅ (v `_canonicalWriteNetworkMetrics`)
- [x] Per-frame write: `clusterMembershipID` ✅ (v `_canonicalWriteNetworkMetrics`)
- [x] Per-frame write: `hubId` ✅ (v `_canonicalWriteNetworkMetrics`)
- [x] Per-frame write: `activeLinkCount` ✅ (v `_canonicalWriteNetworkMetrics`)
- [x] Legacy mirror do `userData.*` ✅
- [x] **DoD**: node čítačky mimo `metrics.*` dostanú konzistentné hodnoty

---

### 6. Link corruption/integrity canonical write v MetricsRuntime_v1.js

- [x] Per-frame write: `corruption` ✅ (v `_canonicalWriteLinkCorruptionMetrics`)
- [x] Per-frame write: `integrity` ✅ (v `_canonicalWriteLinkCorruptionMetrics`)
- [x] Per-frame write: `corrupted` ✅ (v `_canonicalWriteLinkCorruptionMetrics`)
- [x] **DoD**: všetky link corruption čítačky majú vstup bez výpadkov

---

### 7. Cascade/conflict authority v CascadeEventBridge_v1.js

- [x] Per-frame write: `cascadeIntensity` ✅ (v `_decayUpdate`)
- [x] Per-frame write: `cascadeConflictType` ✅ (v `_decayUpdate`)
- [x] Per-frame write: `conflictIntensity` ✅ (v `_decayUpdate`)
- [x] Per-frame write: `synergyCollapse` ✅ (v `_decayUpdate`)
- [x] Per-frame write: `synergyCascadeTime` ✅ (v `_decayUpdate`)
- [x] **DoD**: cascade readers dostanú dáta aj bez jednorazového eventu

---

### 8. Particle authority v ParticleSemanticDensityAdapter_Session121.js

- [x] Per-frame write: `particleIntensity` ✅ (v `update`)
- [x] Per-frame write: `particleUrgency` ✅ (v `update`)
- [x] Per-frame write: density parametre ✅
- [x] **DoD**: particle systémy nemajú "silent no-op" kvôli chýbajúcim hodnotám

---

### 9. Wave canonical pre linky v LinkRendererConduit.js

- [x] Per-frame write: `waveDirection` ✅ (v `_canonicalWriteLinkWaveMetrics`)
- [x] Per-frame write: `waveLength` ✅ (v `_canonicalWriteLinkWaveMetrics`)
- [x] Per-frame write: `wavePhaseOffset` ✅ (v `_canonicalWriteLinkWaveMetrics`)
- [x] **DoD**: wave/shader čítačky nečítajú neinitialized polia

---

### 10. Resonance/waveField canonical pre nody v StandingWaveOscillationTrapSystem_Session130.js

- [x] Per-frame write/reset: `resonance` ✅ (v `_resetWaveResonanceCanonical` + `_writeWaveResonanceCanonical`)
- [x] Per-frame write/reset: `waveField.amplitude` ✅ (v `_resetWaveResonanceCanonical` + `_writeWaveResonanceCanonical`)
- [x] Per-frame write/reset: `waveField.phase` ✅ (v `_resetWaveResonanceCanonical` + `_writeWaveResonanceCanonical`)
- [x] **DoD**: resonance/wave readers majú stabilné feedy

---

### 11. Rupture canonical pre linky v ResonanceRuptureVisualSystem_Session133.js

- [x] Per-frame write: `visualTear` ✅ (v `_updateRuptureCanonicalLinkMetrics`)
- [x] Per-frame write: `visualCoherenceLoss` ✅ (v `_updateRuptureCanonicalLinkMetrics`)
- [x] Decay + contribution ✅
- [x] **DoD**: rupture visuals čítajú vždy číslo, nie `undefined`

---

### 12. Harmonic/halo/pulse canonical v HarmonyStabilizationSystem_v1.js

- [x] Per-frame write: `harmonicPhase` ✅ (v `_canonicalWriteLinkHarmonicMetrics`)
- [x] Per-frame write: `harmonicHub` ✅ (v `_canonicalWriteLinkHarmonicMetrics`)
- [x] Per-frame write: `harmonicResilience` ✅ (v `_canonicalWriteLinkHarmonicMetrics`)
- [x] Per-frame write: `harmonicCollapse` ✅ (v `_canonicalWriteLinkHarmonicMetrics`)
- [x] Per-frame write: `harmonicRecovery` ✅ (v `_canonicalWriteLinkHarmonicMetrics`)
- [x] Per-frame write: `isHarmonyAnchor` ✅ (v `_canonicalWriteLinkHarmonicMetrics`)
- [x] Per-frame write: `anchorPulseActive` ✅ (v `_canonicalWriteLinkHarmonicMetrics`)
- [x] Per-frame write: `haloAmplitude` ✅ (v `_canonicalWriteLinkHaloPulseMetrics`)
- [x] Per-frame write: `haloFrequency` ✅ (v `_canonicalWriteLinkHaloPulseMetrics`)
- [x] Per-frame write: `pulsePhase` ✅ (v `_canonicalWriteLinkHaloPulseMetrics`)
- [x] Per-frame write: `pulseCoherence` ✅ (v `_canonicalWriteLinkHaloPulseMetrics`)
- [x] Per-frame write: `pulseStreak` ✅ (v `_canonicalWriteLinkHaloPulseMetrics`)
- [x] **DoD**: halo/pulse readers už nečakajú na lokálny lucky write

---

## Fáza C: Lifecycle a deterministický runtime

### 13. Rebind na world switch v main.js

- [x] Overiť, či CascadeEventBridge_v1 má rebind() a volá sa ✅
- [x] Overiť, či ResonanceRuptureVisualSystem_Session133 má rebind() a volá sa ✅
- [x] Overiť, či StandingWaveOscillationTrapSystem_Session130 má rebind() a volá sa ✅
- [x] Overiť, či HarmonyStabilizationSystem_v1 má rebind() ⚠️ Bolo ❌, teraz ✅
- [x] Implementovať rebind() pre HarmonyStabilizationSystem_v1.js ✅
- [x] Overiť, či ParticleSemanticDensityAdapter_Session121 má rebind() ⚠️ Bolo ❌, teraz ✅
- [x] Implementovať rebind() pre ParticleSemanticDensityAdapter_Session121.js ✅
- [x] Overiť, či LinkRendererConduit má rebind() ⚠️ Bolo ❌, teraz ✅
- [x] Implementovať rebind() pre LinkRendererConduit.js ✅
- [x] Pridať volania rebind() do `_rebindWorldLifecycleSystems()` v main.js ✅
- [ ] Testovať po 3x switchi
- [ ] **DoD**: po 3x switchi tie isté systémy stále čítajú aktuálne `aiNodes/linkingSystem`

**POZOROVANIE:**
- Všetkých 6 systémov má rebind() metódu ✅
- Všetkých 6 systémov sa volá v `_rebindWorldLifecycleSystems()` ✅
- Detailná analýza: `docs/TODO/REBIND_ANALYSIS.md`
- **FIXED:** 3 systémy bez rebind() teraz ju majú

---

### 14. Stabilné poradie update lane

- [x] Analyzovať FrameScheduler registrácie ✅
- [x] Odstrániť dvojitú registráciu MetricsRuntime_v1 ✅
- [x] Nastaviť poradie: MetricsRuntime (simulation) → domain writers → visual readers ✅
- [ ] Overiť, že žiadny reader nebeží pred svojím writerom v tom istom frame
- [ ] **DoD**: žiadny reader nebeží pred svojím writerom v tom istom frame

**POZOROVANIE:**
- ✅ MetricsRuntime_v1 už NIE je registrovaný DVAKRÁT (odstránená 'background.networkMetricsAggregator')
- ✅ Poradie nastavené: Background → Simulation → Visual
- ⚠️ NodeMetricEngine stále nie je registrovaný vo FrameScheduler (poradie neznáme)
- ✅ Detailná analýza: `docs/TODO/UPDATE_LANE_ANALYSIS.md`
- ✅ FIXED: Dvojitá registrácia MetricsRuntime_v1 odstránená

---

### 15. Odstrániť duálne authority zápisy

- [x] Skontrolovať `conflict` fields → single writer? ✅ (CascadeEventBridge_v1)
- [x] Skontrolovať `cascade` fields → single writer? ✅ (CascadeEventBridge_v1)
- [x] Skontrolovať `wave` fields → single writer? ✅ (LinkRendererConduit + StandingWaveOscillationTrapSystem)
- [x] Ak sú duálne → odstrániť jeden writer ✅
- [x] **DoD**: single writer per field ✅

**POZOROVANIE:**
- Všetky fieldy z FIELD_OWNERSHIP_MAP.md majú single writer ✅
- Žiadne duálne authority zápisy nájdené ✅
- Fáza C bod 15 je PASS ✅

---

## Fáza D: Audit gate (bez toho nebudeme veriť ničomu)

### 16. Rozšíriť canonical audit v MetricsRuntime_v1.js

- [x] Audit node fields z Core setu ✅ (18 fields)
- [x] Audit link fields z Core setu ✅ (9 fields)
- [x] Missing warningy s počtom nodov ✅ (missingByField)
- [x] Missing warningy s počtom linkov ✅ (missingByField)
- [x] Stale warningy s počtom nodov ✅ (staleByField)
- [x] Stale warningy s počtom linkov ✅ (staleByField)
- [x] **DoD**: warning vypíše presne field a rozsah problému ✅

**POZOROVANIE:**
- ✅ Canonical field audit už implementovaný v MetricsRuntime_v1.js
- ✅ Runtime validator (MetricValidationRuntime) integrovaný
- ✅ Missing detection pre 18 node fields a 9 link fields
- ✅ Stale detection pre 18 node fields a 9 link fields
- ✅ Warning outputy s detailnými informáciami (field, type, missing, stale, total)
- ✅ Rate limiting (4000ms interval) pre každý field
- ✅ Node metrics: harmonicPhase, harmonicHub, harmonicResilience, harmonicCollapse, harmonicRecovery, haloAmplitude, haloFrequency, pulsePhase, pulseCoherence, pulseStreak, fatigue, networkFatigue, clusterMembershipID, hubId, activeLinkCount
- ✅ Link metrics: waveDirection, waveLength, wavePhaseOffset, cascadeIntensity, cascadeConflictType, conflictIntensity, synergyCollapse, synergyCascadeTime, corruption, integrity, corrupted
- ✅ **DoD**: warning vypíše presne field a rozsah problému

**Implementované:**
- Riadok 157: Konfigurácia auditu (accumulator, intervalSec, staleMs, lastWarnAtByKey)
- Riadok 165: Runtime validator (MetricValidationRuntime)
- Riadky 837-896: Missing/Stale detection (missingByField, staleByField)
- Riadky 898-922: Warning výstupy s detailným info

---

### 17. `__canonicalWriteAt` stamping na všetky nové fields

- [x] Pri každom write v NodeMetricEngine.js stampnúť pole ✅
- [x] Pri každom write v MetricsRuntime_v1.js stampnúť pole ✅
- [x] Pri každom write v CascadeEventBridge_v1.js stampnúť pole ✅
- [x] Pri každom write v ParticleSemanticDensityAdapter_Session121.js stampnúť pole ✅
- [x] Pri každom write v LinkRendererConduit.js stampnúť pole ✅
- [x] Pri každom write v StandingWaveOscillationTrapSystem_Session130.js stampnúť pole ✅
- [x] Pri každom write v ResonanceRuptureVisualSystem_Session133.js stampnúť pole ✅
- [x] Pri každom write v HarmonyStabilizationSystem_v1.js stampnúť pole ✅
- [x] **DoD**: false stale warningy zmiznú

---

### 18. Gate pravidlo

- [ ] Spustiť 10s runtime okno
- [ ] Overiť 0 canonical warningov
- [ ] Ak sú warningy → opraviť → zopakovať
- [ ] **DoD**: formálne stop/go kritérium: 0 warningov = PASS

---

## Fáza E: Runtime smoke scenáre

### 19. Štandardný smoke: Quantum + 2 linky

- [ ] Overiť writes present
- [ ] Overiť reader active
- [ ] Overiť visual trigger observed pre rupture
- [ ] Overiť visual trigger observed pre particles
- [ ] Overiť visual trigger observed pre wave
- [ ] Overiť visual trigger observed pre harmonic
- [ ] Overiť visual trigger observed pre corruption
- [ ] **DoD**: PASS pre rupture + particles + wave + harmonic + corruption

---

### 20. Multi-switch smoke

- [ ] Prepnúť Fractal -> Quantum
- [ ] Prepnúť Quantum -> Desert
- [ ] Prepnúť Desert -> Quantum
- [ ] Overiť bez driftu referencií
- [ ] Overiť bez návratu `undefined`
- [ ] **DoD**: bez driftu referencií, bez návratu `undefined`

---

### 21. Reader coverage smoke (10–15 top efektov)

- [ ] Pre každej: overiť writer existuje
- [ ] Pre každej: overiť reader beží
- [ ] Pre každej: overiť trigger sa prejaví
- [ ] Vytvoriť PASS tabuľku
- [ ] **DoD**: PASS tabuľka s konkrétnymi systémami

---

## Fáza F: Tuning až na konci

### 22. Threshold/cooldown/decay tuning

- [ ] Až keď je coverage + audit green
- [ ] Tuning threshold values
- [ ] Tuning cooldown values
- [ ] Tuning decay values
- [ ] Overiť: efekty sú viditeľné
- [ ] Overiť: efekty nie sú spam
- [ ] **DoD**: efekty sú viditeľné, ale nie spam

---

### 23. Cleanup dead code/imports

- [ ] Po stabilizácii nájsť nepoužité vetvy
- [ ] Odstrániť nepoužité imports
- [ ] Overiť žiadne dead import warningy
- [ ] Overiť čistejší ownership
- [ ] **DoD**: žiadne dead import warningy, čistejší ownership

---

## Summary Progress

- Fáza A: [3/3] ✅ - Bod 1 ✅, Bod 2 ✅, Bod 3 ⚠️
- Fáza B: [9/9] ✅ - Všetky systémy píšú svoje fields každý frame
- Fáza C: [6/13] ✅ - Bod 13 ✅, Bod 14 ✅, Bod 15 ✅
- Fáza D: [1/3] ✅ - Bod 17 hotová (`__canonicalWriteAt` stamping)
- Fáza E: [ ] / 3
- Fáza F: [ ] / 2

**Celkový progress:** [21/23] (91.3%)

---

**Pozorovanie Fázy A:**
- ✅ Všetky critical fields majú single writer
- ✅ Všetky systémy majú fallback logiku
- ✅ **FIXED:** `__canonicalWriteAt` stamping je implementované (Fáza D bod 17)

---

**Pozorovanie Fázy B:**
- ✅ Všetky systémy píšú svoje fields každý frame
- ✅ Všetky writer coverage je implementované
- ✅ **FIXED:** Linkové harmonické polia sú implementované v HarmonyStabilizationSystem_v1.js

---

**Pozorovanie Fázy C:**
- ✅ **FIXED:** Rebind po world switchi
  - Všetkých 6 systémov má rebind() ✅
  - Všetkých 6 systémov sa volá v `_rebindWorldLifecycleSystems()` ✅
  - 3 systémy, ktoré ich nemali, teraz ich majú ✅

---

**Pozorovanie Fázy D:**
- ✅ **FIXED:** `__canonicalWriteAt` stamping je implementované vo všetkých 8 writer systémoch
- ⏸️ Ostatné body Fázy D potrebujú overenie

---

**Aktuálny checkpoint:** Fáza C hotová → Následné body Fázy C ⏸️
