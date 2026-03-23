# UPDATE LANE ANALYSIS - Fáza C Bod 14
## 2026-03-23 18:10 CET

---

## 📊 AKTUÁLNY STAV: POZNÁMENÉ REGISTRÁCIE

### Background Systems (bežia prve)
1. **harmonicTopology** - background.harmonicTopology
2. **proceduralGlyphGenerator** - background.proceduralGlyphGenerator
3. **harmonicCycleController** - background.harmonicCycleController
4. **networkMetricsAggregator** - background.networkMetricsAggregator (metricsRuntime_v1)
5. **narrativePatterns** - background.narrativePatterns
6. **worldEvents** - background.worldEvents
7. **weatherPack** - background.weatherPack
8. **ambientEntityManager** - background.ambientEntityManager
9. **consciousnessLayer** - background.consciousnessLayer
10. **poetryEngine** - background.poetryEngine
11. **emotionalFeed** - background.emotionalFeed

### Simulation Systems (bežia neskôr)
12. **fxPerformanceScaler** - simulation.fxPerformanceScaler
13. **adaptivePerformanceMonitor** - simulation.adaptivePerformanceMonitor
14. **fxPerformanceTransition** - simulation.fxPerformanceTransition
15. **synapticFatigueAdapter** - simulation.synapticFatigueAdapter
16. **synapticSpecializationAdapter** - simulation.synapticSpecializationAdapter
17. **harmonyCascade** - simulation.harmonyCascade
18. **harmonyStabilizationSystem** - simulation.harmonyStabilizationSystem ✅
19. **effectOrchestrator** - simulation.effectOrchestrator
20. **nodeShellSizeAuthority** - simulation.nodeShellSizeAuthority
21. **linkPersonalityStateMachine** - simulation.linkPersonalityStateMachine
22. **synapticGatingAdapter** - simulation.synapticGatingAdapter
23. **influenceAttenuationAbsorption** - simulation.influenceAttenuationAbsorption
24. **influenceReflection** - simulation.influenceReflection
25. **waveStandingTraps** - simulation.waveStandingTraps (standingWaveTrapSystem)
26. **cascadeAccelSetup** - simulation.cascadeAccelSetup
27. **coreMetricsOverlay** - simulation.coreMetricsOverlay
28. **primaryNodeTopBar** - simulation.primaryNodeTopBar
29. **networkStressAggregator** - simulation.networkStress
30. **worldRuntime_v1** - simulation.worldRuntime_v1
31. **nodeEditorRuntime_v1** - simulation.nodeEditorRuntime_v1
32. **metricsRuntime_v1** - simulation.metricsRuntime_v1 ✅

### Visual Systems (bežia po simulation)
33. **t2CorruptionVisualIntegration** - visual.t2CorruptionVisualIntegration
34. **t2HarmonyVisualConsumer** - visual.t2HarmonyVisualConsumer ✅
35. **resonanceRupture** - visual.resonanceRupture ✅
36. **resonanceEchoTrail** - visual.resonanceEchoTrail
37. **particleSemanticDensity** - visual.particleSemanticDensity ✅
38. **cascadeParticleEmissionBoost** - visual.cascadeParticleEmissionBoost
39. **linkTrailParticles** - visual.linkTrailParticles
40. **nodeInteractionEngine** - realtime.nodeInteraction
41. **hitProxySystem** - realtime.hitProxy

---

## 🔍 ANALÝZA NODE METRIC ENGINE

**Pozorovanie:** NodeMetricEngine.js NIE JE priamo registrovaný vo FrameScheduler

**Hovorí to:**
- NodeMetricEngine je používaný interny ostatnými systémami
- Nie je registerovaný ani v 'background', ani v 'simulation', ani v 'visual'
- Jeho update() funkcia je volaná zvonku (pravdepodobne z iného systému)

**Možné volania:**
1. MetricsRuntime_v1 môže volať NodeMetricEngine
2. nodeDynamicMetrics môže volať NodeMetricEngine
3. Ďalšie systémy môžu importovať NodeMetricEngine funkcie priamo

**Dopad na update lane:**
- ❌ Nie je možné určiť presný poradie NodeMetricEngine vzhľadom na FrameScheduler
- ⚠️ NodeMetricEngine môže byť volaný z viacerých miest súčastne (potenciálny race condition)

---

## 🔍 ANALÝZA METRICS RUNTIME V1

**Pozorovanie:** metricsRuntime_v1 JE registrovaný:
- **background.networkMetricsAggregator** (riadok 4)
- **simulation.metricsRuntime_v1** (riadok 32)

**Dvojitá registrácia:**
- metricsRuntime_v1 je registrovaný DVAKRÁT
- Raz ako 'background.networkMetricsAggregator'
- Raz ako 'simulation.metricsRuntime_v1'

**Dopad:**
- ⚠️ Všetky systémy z background vrstvy sa spustia pred simulation
- ⚠️ To môže spôsobiť, že visual readers čítajú dáta predtým, ako sú zapísané

---

## 🎯 ODHALENÝ PROBLÉM

**1. Dvojitá registrácia MetricsRuntime_v1**
- background.networkMetricsAggregator → metricsRuntime_v1.runNetworkMetricsAggregator()
- simulation.metricsRuntime_v1 → metricsRuntime_v1.update(dt)
- **Poradie:** Background beží pred Simulation

**2. Neznámy poradie NodeMetricEngine**
- NodeMetricEngine nie je registrovaný vo FrameScheduler
- Neviem kedy a ako je volaný

**3. Potenciálne čítanie pred zápisom**
- Ak MetricsRuntime_v1 (background) beží pred visual readers
- Visual readers môžu čítať neaktuálne dáta

---

## 🎯 NAVRH RIEŠENIA

### Možnosť 1: Odstrániť dvojitú registráciu MetricsRuntime_v1
- Zachovať len 'simulation.metricsRuntime_v1'
- Odstrániť 'background.networkMetricsAggregator'
- Poradie: Background → Simulation → Visual (MetricsRuntime v simulation)

### Možnosť 2: Presunúť MetricsRuntime_v1 do Background
- Zachovať len 'background.networkMetricsAggregator'
- Odstrániť 'simulation.metricsRuntime_v1'
- Poradie: Background (MetricsRuntime) → Background → Simulation → Visual

### Možnosť 3: Pridať explicitné poradie
- Upraviť poradie registrácií v main.js
- Zabezpečiť, že writers bežia pred readers

---

## 📊 PREDVOLENÉ PORADIE (podľa TODO)

**Očakávané:**
NodeMetricEngine → MetricsRuntime → domain writers → visual readers

**Aktuálne (neznámy):**
??? → (background.networkMetricsAggregator) → ??? → visual readers

---

## ⚠️ RIZIKÁ BEZ ZMENY

1. **Race conditions:** Visual readers môžu čítať neaktuálne dáta
2. **Neúplný frame:** Dáta môžu byť nekompletné v istom frame
3. **Neindeterministické správanie:** Rozdielne výsledky v každom frame

---

## 📝 SUMMARY

**Pozorovania:**
- ❌ NodeMetricEngine nie je registrovaný vo FrameScheduler
- ⚠️ MetricsRuntime_v1 je registrovaný DVAKRÁT (background + simulation)
- ⚠️ Poradie je: Background (MetricsRuntime) → Background → Simulation → Visual
- ⚠️ Visual readers môžu čítať pred zápisom z MetricsRuntime

**DoD pre Fázu C bod 14:**
- ❌ Nastaviť poradie: NodeMetricEngine → MetricsRuntime → domain writers → visual readers
- ❌ Overiť, že žiadny reader nebeží pred svojím writerom v tom istom frame

**Status:** ⏸️ NEIMPLEMENTOVANÉ (nepoznámy poradie NodeMetricEngine, dvojitá registrácia MetricsRuntime)

---

**Dátum:** 2026-03-23 18:10 CET
**Analýza vykonaná:** Manual code review main.js
**Počet nájdených problémov:** 3
**Priorita fixu:** Medium (ovplyvuje deterministickosť runtime)
