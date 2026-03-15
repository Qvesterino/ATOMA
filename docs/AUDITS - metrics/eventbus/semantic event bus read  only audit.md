**KROK 1 — EMIT miesta**

- `link.created` — D:\ATOMA_CLEAN\NodeLinkingSystem.js:3729 — systém: NodeLinkingSystem — pri úspešnom vytvorení linku po UI callbacku; posiela id zdroj/cieľ/linkId.  
- `link:collapsed` — D:\ATOMA_CLEAN\NodeLinkingSystem.js:6979 — systém: LinkCollapseExecutor (v NodeLinkingSystem) — pri kontrolovanom zrušení linku, pridá recovery kandidáta a oznámi dôvod.  
- `node:evolved` / `semantic.ascension` / `node:ascended` — D:\ATOMA_CLEAN\_NodeEvolution2_0.js:470–485 — systém: NodeEvolution2_0 — pri postupe na vyšší stupeň (Stage 4 = ascension).  
- `semantic.ritual.started` — D:\ATOMA_CLEAN\_MythicRitualController.js:267 — systém: MythicRitualController — keď sa spustí rituál, posiela typ a zoznam uzlov.  
- `semantic.ritual.completed` — D:\ATOMA_CLEAN\_MythicRitualController.js:1050 — systém: MythicRitualController — po dokončení rituálu.  
- `harmonic.cascade.start` — D:\ATOMA_CLEAN\HarmonicHubAuraSystem_Session126.js:747 — systém: HarmonicHubAuraSystem — pri detegovaní dominantného hubu spúšťa harmonický cascade.  
- `network.node.created` / `node:spawned` — D:\ATOMA_CLEAN\main.js:6112–6117 — systém: AINodes bootstrap wrapper — po vytvorení nového node (spawn).  
- `network.link.created` / `link:created` — D:\ATOMA_CLEAN\main.js:6489–6496 — systém: Link creation hook (wrapper okolo linking) — po spojení dvoch uzlov.  
- `link:synergyThreshold` — D:\ATOMA_CLEAN\main.js:6505 — systém: Link creation hook — ak synergy score linku ≥0.75.  
- `link:harmonicLock` — D:\ATOMA_CLEAN\main.js:6520 — systém: Link creation hook — ak priemer harmony oboch uzlov ≥0.8.  
- `network.link.destroyed` — D:\ATOMA_CLEAN\main.js:6556 — systém: Link removal hook — po odstránení linku.  
- `metrics.spike` — D:\ATOMA_CLEAN\main.js:9549 — systém: HUD/SystemStateOverlay — keď overlay deteguje spike alert.  
- `hud.visibility.change` — D:\ATOMA_CLEAN\main.js:9664 — systém: HUD visibility manager — pri prepnutí panelu HUD.  
- `node.selection` / `node:selected` — D:\ATOMA_CLEAN\main.js:11620–11632 — systém: SelectionCore hook — pri (de)selekte uzla.  
- `metric.corruption.spread` — D:\ATOMA_CLEAN\MetricsRuntime_v1.js:554 — systém: MetricsRuntime_v1 — pri detegovanej korupčnej delta po linku.  
- `metric:synergySpike` | `metric:harmonyPeak` | `metric:stabilityDrop` | `metric:corruptionRise` | `metric:loadPressureHigh` | `network:stressRise` | `network:stabilityDrop` | `network:corruptionSpread` | `network:harmonyShift` — D:\ATOMA_CLEAN\MetricsRuntime_v1.js:581–689 — systém: MetricsRuntime_v1 — agregované prahové udalosti na sieťovej úrovni.  
- `event:synergyCascade` | `event:harmonyResonance` | `event:corruptionOutbreak` | `event:loadCollapse` | `event:instabilityTrap` — D:\ATOMA_CLEAN\MetricsRuntime_v1.js:681–708 — systém: MetricsRuntime_v1 — gameplay / systémové triggery pri prekročení prahov.

**KROK 2 — Subscriberi**

- `event:harmonyResonance` — D:\ATOMA_CLEAN\HarmonicHubAuraSystem_Session126.js:169 — systém: HarmonicHubAuraSystem — spúšťa aktualizáciu/až: handleHarmonyResonance → rekalibrácia harmonic hub polí.  
- `camera.motion` — D:\ATOMA_CLEAN\main.js:3936 — systém: HUD wake — prebúdza HUD a označí coreMetrics dirty.  
- `node.selection` — D:\ATOMA_CLEAN\main.js:3940 — systém: HUD wake — prebúdza HUD (selection overlay).  
- `node.synergy.high`, `metric:synergySpike` — D:\ATOMA_CLEAN\WaveBurstRouter_v1.js:324–327 — systém: WaveBurstRouter — mapuje na synergy bursts (requestBurstIntent).  
- `cascade.triggered`, `harmonic.cascade.start`, `link:created` — D:\ATOMA_CLEAN\WaveBurstRouter_v1.js:332–338 — systém: WaveBurstRouter — spúšťa cascade vizuálne/FX bursty.  
- `node.corruption.high`, `node.failure`, `metric:corruptionRise`, `network:corruptionSpread`, `link:collapsed` — D:\ATOMA_CLEAN\WaveBurstRouter_v1.js:343–355 — systém: WaveBurstRouter — spúšťa corruption burst / stress routing.  
- `node.hover`, `node.click`, `node:selected` — D:\ATOMA_CLEAN\WaveBurstRouter_v1.js:360–366 — systém: WaveBurstRouter — interakčné debug bursty.  
- `event:synergyCascade`, `event:instabilityTrap`, `event:loadCollapse` — D:\ATOMA_CLEAN\WaveBurstRouter_v1.js:368–373 (globalThis.semanticBus.on) — systém: WaveBurstRouter — gameplay burst prepínače.  
- `network.link.created`, `link:created`, `network.link.destroyed`, `link:collapsed`, `semantic.state.changed`, `semantic.cluster.sync`, `semantic.ascension`, `node:ascended`, `semantic.ritual.started`, `semantic.ritual.completed`, `node.selection`, `node:selected` — D:\ATOMA_CLEAN\_GlyphFusionOverlay4_1.js:151–208 — systém: GlyphFusionOverlay4_1 — ovláda vizuálne overlaye (link fusion, ascension, ritual, selection).  
- `metric.node.updated` — D:\ATOMA_CLEAN\SynergyCascadeVisualizer.js:175 — systém: SynergyCascadeVisualizer — bufferuje per-node synergy hodnoty a aktualizuje cascade detekciu.

**KROK 3 — EVENT GRAPH**

(Producer → Consumer; Frequency: burst / user action / simulation / visual)

- **link.created**  
  Producers: NodeLinkingSystem (simulation core), main.js link hook (user action).  
  Consumers: WaveBurstRouter_v1 (burst trigger), GlyphFusionOverlay4_1 (visual).  
  Frequency: user action.

- **link:collapsed**  
  Producers: NodeLinkingSystem collapse executor.  
  Consumers: WaveBurstRouter_v1 (corruption burst), GlyphFusionOverlay4_1 (visual).  
  Frequency: simulation (collapse logic).

- **network.link.created**  
  Producer: main.js link hook.  
  Consumer: GlyphFusionOverlay4_1 (visual).  
  Frequency: user action.

- **network.link.destroyed**  
  Producer: main.js link removal.  
  Consumer: GlyphFusionOverlay4_1 (visual).  
  Frequency: simulation/user removal.

- **link:synergyThreshold**  
  Producer: main.js link hook.  
  Consumers: none found.  
  Frequency: simulation (post-link metric check).

- **link:harmonicLock**  
  Producer: main.js link hook.  
  Consumers: none found.  
  Frequency: simulation.

- **network.node.created / node:spawned**  
  Producer: main.js spawn wrapper.  
  Consumers: none found.  
  Frequency: user action.

- **node:evolved / semantic.ascension / node:ascended**  
  Producer: _NodeEvolution2_0.  
  Consumer: GlyphFusionOverlay4_1 (visual ascension response).  
  Frequency: simulation (progression).

- **semantic.ritual.started / semantic.ritual.completed**  
  Producer: _MythicRitualController.  
  Consumer: GlyphFusionOverlay4_1 (ritual visuals).  
  Frequency: user action / scripted.

- **harmonic.cascade.start**  
  Producer: HarmonicHubAuraSystem_Session126 (simulation hub analysis).  
  Consumer: WaveBurstRouter_v1 (burst routing).  
  Frequency: simulation.

- **metrics.spike**  
  Producer: main.js HUD/SystemStateOverlay.  
  Consumers: none found.  
  Frequency: simulation (overlay check).

- **hud.visibility.change**  
  Producer: main.js HUD manager.  
  Consumers: none found.  
  Frequency: user action.

- **node.selection / node:selected**  
  Producer: main.js selection hook.  
  Consumers: main.js HUD wake; GlyphFusionOverlay4_1 (visual selection); WaveBurstRouter_v1 (user interaction burst).  
  Frequency: user action.

- **metric.corruption.spread**  
  Producer: MetricsRuntime_v1 (per-link corruption delta).  
  Consumers: none found.  
  Frequency: simulation (metrics tick).

- **metric:synergySpike**  
  Producer: MetricsRuntime_v1.  
  Consumers: WaveBurstRouter_v1 (burst).  
  Frequency: simulation.

- **metric:harmonyPeak / metric:stabilityDrop / metric:loadPressureHigh / metric:corruptionRise / network:stressRise / network:stabilityDrop / network:corruptionSpread / network:harmonyShift**  
  Producer: MetricsRuntime_v1 (10 Hz aggregation).  
  Consumers: WaveBurstRouter_v1 only listens to `metric:corruptionRise`; others have no listeners.  
  Frequency: simulation.

- **event:synergyCascade / event:harmonyResonance / event:corruptionOutbreak / event:loadCollapse / event:instabilityTrap**  
  Producer: MetricsRuntime_v1 (gameplay triggers).  
  Consumers: WaveBurstRouter_v1 listens to synergyCascade & loadCollapse & instabilityTrap; HarmonicHubAuraSystem listens to harmonyResonance. corruptionOutbreak currently has no subscriber.  
  Frequency: simulation (aggregate threshold crossing).

- **metric.node.updated**  
  Producer: (not in emit scan; likely MetricRuntimeAdapter / NodeMetricEngine elsewhere) — used by SynergyCascadeVisualizer.  
  Consumer: SynergyCascadeVisualizer (visual cascade tracking).  
  Frequency: simulation (metric updates).

**KROK 4 — POLLING SYSTEMS (event candidate)**

Systémy čítajúce `node.userData.metrics` alebo `link.userData.*` v update slučke bez semanticBus subscription:

- D:\ATOMA_CLEAN\NodeDynamicMetrics.js — per-frame vizuálna derivácia metrík pre každý node (visual loop).  
- D:\ATOMA_CLEAN\LinkRendererConduit.js — per-frame render pipeline číta `link.userData`/`metrics` pre materiálové uniformy (visual loop).  
- D:\ATOMA_CLEAN\NodeLinkedAuraSystem_Session123.js — update() generuje aura stavy z `node.userData.metrics` a `state` (visual loop).  
- D:\ATOMA_CLEAN\HarmonicNodeResonanceHalos.js — per-frame halos používajú `node.userData.metrics.harmony` (visual loop).  
- D:\ATOMA_CLEAN\CoreMetricsOverlay.js — update() polluje agregované metrics/HUD bez eventov (UI loop).  

Tieto by mohli prijímať eventy namiesto polling (napr. `metric.node.updated`, `network:harmonyShift`, `metric:loadPressureHigh`).

**KROK 5 — Architektonické zhrnutie**

1) Najdôležitejšie eventy v engine  
   - `link.created` / `link:collapsed` (jadro topológie; viacerí konzumenti).  
   - `metric:synergySpike` a `event:synergyCascade` (prepája sieťové metriky so burst routingom).  
   - `event:harmonyResonance` (spúšťa harmonické vizuály).  
   - `node.selection` / `node:selected` (UI + vizuálne systémy).  

2) Eventy s producentom bez consumerov  
   - `link:synergyThreshold`, `link:harmonicLock` (main.js).  
   - `network.node.created`, `node:spawned` (main.js).  
   - `metrics.spike`, `hud.visibility.change` (main.js HUD).  
   - `metric.corruption.spread` (MetricsRuntime_v1).  
   - `metric:harmonyPeak`, `metric:stabilityDrop`, `metric:loadPressureHigh`, `network:stressRise`, `network:stabilityDrop`, `network:harmonyShift` (MetricsRuntime_v1).  
   - `event:corruptionOutbreak` (MetricsRuntime_v1).  

3) Systémy vhodné na prechod z polling → event  
   - NodeDynamicMetrics.js, LinkRendererConduit.js, NodeLinkedAuraSystem_Session123.js, HarmonicNodeResonanceHalos.js, CoreMetricsOverlay.js.  
   - Odporúčané eventy: `metric.node.updated` (per-node), `network:harmonyShift`, `metric:loadPressureHigh`, `network:corruptionSpread`, `link:created`/`link:collapsed` pre vizuálne reaktívne vrstvy.

4) Eventy, ktoré by mali existovať ale chýbajú (navrhované podľa polling správania)  
   - Per-node metric update event pre vizuály: `metric.node.updated` (už používa SynergyCascadeVisualizer, ale nie je emitovaný z MetricsRuntime_v1; treba jednotný emitter).  
   - Per-link metric/state update: `link.metrics.updated` (aby LinkRendererConduit nemusel pollovať).  
   - HUD/state alerts: `hud.panel.toggled` už existuje ako `hud.visibility.change`, ale nemá consumer – prepojiť alebo odstrániť.  
   - Global spike stream: `metrics.spike` by mal mať handler (napr. SystemStateOverlay/alerts) alebo byť zrušený.  

Bez zmien v kóde; čisto read-only audit.