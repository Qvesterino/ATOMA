# Rhythm Event Map

## Cieľ
Tento dokument má byť jediným miestom, kde je jasne popísané:
- čo sú hlavné world event / ritual subsystémy,
- ako sa navzájom prepojujú,
- kde sa spúšťajú,
- aké metrické tagy / eventy používajú.

Týmto sa má zredukovať chaos pri práci so svetovými eventami, ktoré sú teraz roztrúsené v `main.js`, `EnvironmentDomainController.js`, `Phase8RitualVisualOrchestration.js`, `MetricReactiveWorldEvents.js`, `MythicRitualController.js` a ďalších moduloch.

---

## 1. Hlavné vrstvy world event architektúry

1. **Environment visual systems**
   - Spravuje ich `EnvironmentDomainController.js`.
   - Obsahuje vizuálne packy ako `SafeWorldFXPack`, `SafeAIWeatherPack`, `SafeQuantumIllusionsPack1`, `AmbientEntityManager`, `EmergentThoughtStorms5_0`, `EnvironmentalHazards`, `SafeColonyExpansion2`.
   - Toto nie je primárny event engine, ale render/asset/controller agregátor.
   - `EmergentThoughtStorms5_0` je lokálny recursive/link storm layer; `global.<metric>.high` patrí do globálnej orchestration vrstvy (`EnvironmentEventCoordinator.js` + `SafeLegendaryWorldEvents.js`).

2. **Global event / metric-driven world effects**
   - Sem patria `SafeLegendaryWorldEvents` a `MetricReactiveWorldEvents`.
   - Tieto sú riadené metrickými thresholdmi a emitujú globálne tagy ako `global.synergy.high`.

3. **Mood / ambient atmosphere layer**
   - `WorldPersonalityController.js`.
   - Analytická vrstva, ktorá číta metriky z node siete a aplikuje svetelnú, fog a particle atmosféru.

4. **Narrative / glyph layer**
   - `AINarrativePatterns6_0.js`.
   - Režim „glyph storytelling“ a cluster-based messaging, oddelený od environment stacku.

5. **Ritual / ceremony stack**
   - `NetworkRituals_v1.js` + `MythicRitualController.js` + `Phase8RitualVisualOrchestration.js`.
   - `NetworkRituals` spravuje lifecycle rituálov.
   - `MythicRitualController` rozhoduje, kedy a aký rituál sa má spustiť.
   - `Phase8RitualVisualOrchestration` je čisto vizuálna orchestration layer pre existujúce rituály.

6. **Temporal / epoch effects**
   - `TemporalEventEffects.js`.
   - Spúšťa časovo orientované prechody ako `newEpoch` alebo `newAeon`.

---

## 2. Kde sa robí inicializácia a update

### `main.js`

- `setupWorldEvents()` vytvára `this.worldEvents = new SafeLegendaryWorldEvents(...)`
- `environmentDomain = new EnvironmentDomainController(..., { worldEvents: this.worldEvents, ... })`
- `environmentDomain.init()` vytvára environmentálne systémy a pripojí render hooky
- `main.js` registruje update loopy:
  - `background.worldEvents` pre `worldEvents.update`
  - `background.weatherPack` pre `weatherPack.update`
  - `background.ambientEntityManager` pre `ambientEntityManager.update`
  - `background.narrativePatterns` pre `AINarrativePatterns6_0.update`
  - `background.worldPersonalityController` pre `worldPersonalityController.update`
  - `simulation.networkRituals` pre `networkRituals.updateRituals`
  - `simulation.phase8RitualOrchestration` pre `phase8RitualOrchestration.update`

### `EnvironmentDomainController.js`

- Vytvára vizuálne environment systémy.
- Posiela `worldEvents` ako závislosť do packov, ktoré ho môžu používať.
- Aplikuje render-layer politiky cez `VisualHierarchyRegistry`.
- Nemá vlastnú ritual logiku.

---

## 3. Čo robí čo

### `EnvironmentDomainController.js`
- Agreguje environmentálne vizuálne balíky.
- Používa `createSharedEnvironmentAssetRegistry()` pre zdieľané materiály/geometriu.
- Pridáva render-order a layer tagging na rooty systémov.
- Je lifecycle hub, nie event logika hub.

### `SafeLegendaryWorldEvents.js`
- Globálny „strategický“ event systém pre veľké world FX.
- Spravidla spúšťa výnimočné efekty: `COSMIC_PULSE`, `AURORA_STATE`, `SIGMA_INVASION`, `QUANTUM_ECLIPSE`, `FRACTAL_STORM`.
- Vizuálny jazyk legendárnych eventov je teraz vrstvený ako `CORE -> SURFACE -> OVERLAY -> ATMOSPHERE` a používa cached procedurálne masky pre halo, auroru, glitch, eclipse a fractal motívy.
- Mal by byť triggovaný cez globálne metrické eventy.

### `MetricReactiveWorldEvents.js`
- Priamo reaguje na metrické prahy.
- Vytvára world eventy/zmeny, keď sa metriky posunú do vysokých/stredných pásiem.
- Je vhodný na emitovanie globálnych tagov, ktoré môžu spotrebovať iné vizuálne vrstvy.

### `WorldPersonalityController.js`
- Číta node metriky, určuje global mood a animuje svetovú atmosféru.
- Nie je priamo súčasť render domain controllera.
- Beží cez vlastnú schedulovanú aktualizáciu.

### `AINarrativePatterns6_0.js`
- Naratívny overlay pre glyph messaging.
- Reaguje na správy, fusion udalosti a procedurálne glyphy.
- Nie je priamo event orchestrator world environmentu, ale semantický storytelling layer.

### `NetworkRituals_v1.js`
- Zodpovedá za lifecycle rituálov.
- Vydáva eventy `ritual:start`, `ritual:progress`, `ritual:complete`, `ritual:abort`.
- Spotrebúva ho vizuálna orchestrácia a môže ho monitorovať `MythicRitualController`.

### `MythicRitualController.js`
- Výber typu rituálu.
- Fázový workflow: trigger → active → complete/failure.
- Môže emitovať metrické tagy a vizuálne eventy cez `semanticBus`.

### `Phase8RitualVisualOrchestration.js`
- Čisto vizuálna layer pre rituály.
- Udržiava stav aktívnych rituálov a modifikuje renderables.
- Subscribuje na `NetworkRituals` eventy a má vlastné metric-globálne signály.

### `TemporalEventEffects.js`
- Časovo špecifické efekty.
- Spúšťa epoch/alignment efekty, keď sa metriky dlhodobo správajú špecificky.
- Mal by reagovať na `window.ATOMA_EVENTS` alebo podobné event busy.

---

## 4. Ako spolu súvisia

### Rozdelenie zodpovedností

- `EnvironmentDomainController` = vizuálny domov systémov.
- `SafeLegendaryWorldEvents` = strategické eventy.
- `MetricReactiveWorldEvents` = metrics-to-event logika.
- `WorldPersonalityController` = mood / aura.
- `NetworkRituals` / `MythicRitualController` / `Phase8RitualVisualOrchestration` = rituálna logika + ceremony visuals.
- `AINarrativePatterns6_0` = narrative glyph storytelling.

### Povrchová logika spúšťania

1. Metriky sa vyhodnocujú v `MetricsRuntime` / `MetricReactiveWorldEvents` / `WorldPersonalityController`.
2. Pri dosiahnutí thresholdu sa emitujú tagy ako `global.synergy.high`.
3. `SafeLegendaryWorldEvents` a `Phase8RitualVisualOrchestration` môžu tieto tagy zachytiť.
4. `NetworkRituals` prináša konkrétne rituálne eventy, ktoré vizuálne orchestrácie použijú.
5. `EnvironmentDomainController` je potom miesto, kde bežia environmentálne vizuálne systémy, ktoré môžu tieto eventy zobrazovať.

---

## 5. Navrhované globálne tagy a ich význam

| Tag | Význam | Primárne spotrebiče |
|---|---|---|
| `global.synergy.high` | kolektívna koherencia, silná sieťová spolupráca | `MetricReactiveWorldEvents`, `Phase8RitualVisualOrchestration`, `SafeLegendaryWorldEvents`, `MythicRitualController` |
| `global.synergy.mid` | stredná koherencia, build-up | `Phase8RitualVisualOrchestration`, `MetricReactiveWorldEvents`, `MythicRitualController` |
| `global.harmony.high` | upokojenie, konvergencia, stabilita | `SafeLegendaryWorldEvents`, `Phase8RitualVisualOrchestration`, `MythicRitualController` |
| `global.harmony.mid` | dobré nastavenie, hladké prechody | `MetricReactiveWorldEvents`, `Phase8RitualVisualOrchestration`, `MythicRitualController` |
| `global.stability.high` | silná štruktúra, bezpečná stabilita | `Phase8RitualVisualOrchestration`, `TemporalEventEffects`, `MythicRitualController` |
| `global.stability.mid` | mierna stabilita, pripravenosť | `MetricReactiveWorldEvents`, `MythicRitualController` |
| `global.loadPressure.high` | sieťový tlak, urgentnosť | `SafeLegendaryWorldEvents`, `Phase8RitualVisualOrchestration`, `MetricReactiveWorldEvents` |
| `global.corruption.high` | destabilizácia, chaos | `SafeLegendaryWorldEvents`, `MetricReactiveWorldEvents`, `EnvironmentalHazards` |

---

## 6. Rituálne mapovanie

| Ritual | Logika spustenia | Event tag | Potenciálna vizuálna reakcia |
|---|---|---|---|
| `Ascension` | veľa ascended nodov + vysoká harmónia | `global.harmony.high` | aurora / pillars / coherence pulse |
| `Quantum Fissure` | vysoká stabilita + vysoká intenzita | `global.stability.high` | dimenzionálny shift / quantum flash |
| `Harmony Convergence` | vysoká harmónia + vysoká čistota | `global.harmony.high` | calm bloom / synergy aura |
| `Chaos Ritual` | stredná/vysoká stabilita + vysoká energia | `global.stability.mid/high`, `global.loadPressure.high` | stress turbulence / wave motion |
| `Mythic Signal` | nízky balanceScore + dobrá stabilita | `global.synergy.high`, `global.harmony.mid` | signal burst / coherence pulse |
| `Echo Ritual` | nízka energia + vysoká čistota + ascended count | `global.synergy.mid`, `global.harmony.mid` | memory streaks / echo trails |

---

## 7. Ako to prepojiť rýchlo

### V `MythicRitualController.js`
- `triggerRitual()` emitovať `this.semanticBus?.emit('global.<metric>.<tier>', {...})`
- pri každom `create...Visuals()` emitovať `ritual.visual.<name>.started`
- `endRitual()` emitovať `ritual:complete|failure` + cleanup tagy

### V `MetricReactiveWorldEvents.js`
- pri detekcii prahu emitovať `global.synergy.high`, `global.harmony.high`, `global.loadPressure.high`, atď.
- zachovať `MetricReactiveWorldEvents` ako primárny zdroj globálneho metric-to-event pre procesy.

### V `Phase8RitualVisualOrchestration.js`
- subscribe na `NetworkRituals` eventy: `ritual:start`, `ritual:progress`, `ritual:complete`, `ritual:abort`
- subscribe na `global.*` eventy pre extra moduláciu
- eventy môžu byť použité na `preRitual` / `active` / `completion` modifiers

### V `SafeLegendaryWorldEvents.js`
- triggovať podľa globálnych metrických tagov
- používať cooldowny / spam suppression ako už existuje

### V `TemporalEventEffects.js`
- reagovať na `window.ATOMA_EVENTS?.emit('temporal.newEpoch')` alebo `newAeon`
- používať len čisté, časové prechody, nie chaosové korupčné efekty

---

## 8. Odporúčanie

1. Nechať `EnvironmentDomainController` ako vizuálny container, nie event orchestrator.
2. `MetricReactiveWorldEvents` použiť ako hlavnú metricky riadenú event vrstvu.
3. `Phase8RitualVisualOrchestration` použiť na vizuálnu orchestration rituálov, nie na výpočet prahov.
4. `MythicRitualController` nechať rozhodovať o type rituálu a emitovať udalosti.
5. `WorldPersonalityController` nechať fungovať paralelne ako mood/atmosphere layer.

---

## 9. Rýchly prehľad kto čo má robiť

- `main.js` → inicializácia + registrácia schedulerov
- `EnvironmentDomainController.js` → environmentálna vizuálna agregácia
- `SafeLegendaryWorldEvents.js` → veľké globálne world eventy
- `MetricReactiveWorldEvents.js` → metrics-to-event logika
- `WorldPersonalityController.js` → mood / aura / ambient
- `AINarrativePatterns6_0.js` → glyph narrative, nie primárne environment
- `NetworkRituals_v1.js` → rituálna lifecycle event pipeline
- `MythicRitualController.js` → výber a trigger konkrétneho rituálu
- `Phase8RitualVisualOrchestration.js` → vizuálna orchestration pre rituály
- `TemporalEventEffects.js` → time-based epoch/aeon efekty

---

## 10. Poznámka

Tento súbor je teraz jediný zdroj, ktorý vysvetľuje ako sa eventy navzájom prepájajú. Ak sa v priebehu práce niečo zmení, treba tu upraviť priamo zodpovedajúce sekcie.
