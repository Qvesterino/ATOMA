ATOMA COMMIT CONSTITUTION V1 (PLUGIN-READY)

Úloha:
Pred každým commitom, patchom, PR review alebo auto-edit zásahom rešpektuj túto constitution ako záväzný kontrakt. Cieľ je stabilita, canonical authority, nízky chaos, vysoká predvídateľnosť a ochrana dlhodobej architektúry ATOMA.

==================================================
1. CORE PRINCIPLES
==================================================

1.1 Neoptimalizuj na rýchly efekt. Optimalizuj na dlhodobú stabilitu.
1.2 Žiadna zmena nesmie potichu obísť canonical authority.
1.3 Každý runtime zápis musí mať jasného vlastníka.
1.4 Každý vizuálny systém musí mať jasný scheduler lane a lifecycle.
1.5 Žiadna nová logika nesmie pridávať hidden coupling bez explicitného dôvodu.
1.6 Ak existuje pochybnosť, preferuj read-only audit pred patchom.
1.7 Nepíš nové “helper truth”, “temporary truth” ani paralelné pseudo-authority.
1.8 Menšie množstvo spoľahlivých metrík je lepšie než veľké množstvo semi-dead submetrík.
1.9 Canonical metrics majú prednosť pred effect-specific micro-metrics.
1.10 Každý commit má systémový dôvod, nie len lokálny efekt.

==================================================
2. COMMIT GATES
==================================================

Každý commit musí prejsť týmito gate-mi:

2.1 AUTHORITY GATE
- Je jasné, ktorý súbor alebo systém je canonical writer?
- Nevzniká nový paralelný writer?
- Nečíta sa z legacy fieldov bez dôvodu?

2.2 SCHEDULER GATE
- Ide update cez správny FrameScheduler lane?
- Nevznikol rogue requestAnimationFrame, setInterval, duplicate loop alebo side-loop?
- Je cadence správna pre daný typ systému?
  - background = 2Hz
  - simulation = 10Hz
  - visual = 30Hz
  - runtime = 60Hz

2.3 METRIC GATE
- Používa sa canonical metric set?
  - synergy
  - harmony
  - stability
  - corruption
  - loadPressure
- Nie je zavedená zbytočná submetrika, ktorú počíta viac systémov naraz?
- Je možné daný efekt napojiť na canonical threshold namiesto novej metric vetvy?

2.4 RENDER GATE
- Rešpektuje sa VisualHierarchyRegistry?
- Nevznikol nevalid renderOrder?
- Nepoužíva sa depthTest:false bez veľmi silného dôvodu?
- Nepoužíva sa transparent + depthWrite:true bez explicitného odôvodnenia?

2.5 INTEGRATION GATE
- Je systém skutočne wired do main/runtime chainu?
- Má jasný init, update, dispose?
- Nie je “active but nothing” iba kvôli chýbajúcemu writeru, scheduleru alebo bridge-u?

2.6 REGRESSION GATE
- Nemení patch neúmyselne správanie iných VFX/mechanics?
- Nevracia patch starý bug cez wrapper, guard alebo fallback?

==================================================
3. METRIC CONSTITUTION
==================================================

3.1 Canonical metrics sú primárny jazyk systému.
3.2 Effect-specific submetriky sú defaultne podozrivé.
3.3 Nová submetrika je povolená len ak:
- nevie byť nahradená canonical threshold logikou
- má jedného vlastníka
- má jasný účel
- je lacná
- je auditovateľná
- nie je duplicitne dopočítavaná v 3+ systémoch

3.4 Ak effect potrebuje event flow, preferuj:
- canonical metric threshold
- semantic event
- derived state computed raz
namiesto:
- lokálnych opakovaných mikro-kalkulácií v každom systéme

3.5 Stability a loadPressure sú first-class metrics, nie dekorácia.
3.6 Nové efekty majú prednostne skúmať reuse stability/loadPressure pred vytváraním ďalších custom metric vetiev.
3.7 Synergy je derived metric, nie voľná ručná hodnota.
3.8 Legacy field writes typu harmonyLevel a podobné nesmú byť znovu zavádzané.

==================================================
4. EVENT / EFFECT RULES
==================================================

4.1 Eventy majú byť ľahké, jasné a významové.
4.2 Event nesmie byť náhrada za chýbajúcu authority.
4.3 cascade.start / cascade.hop / cascade.end a podobné semantic eventy sú preferované nad raw pollingom, ak to znižuje chaos.
4.4 Event-driven effect nesmie potichu robiť heavyweight recompute bez kontroly nákladov.
4.5 Ak efekt vie existovať cez threshold + event emit, preferuj to pred per-frame multi-system kalkuláciou.

==================================================
5. PATCH RULES
==================================================

5.1 Nerob broad refactor, keď problém je wiring.
5.2 Nerob wiring patch, keď problém je writer authority.
5.3 Nerob writer patch, keď problém je iba read path.
5.4 Pred patchom identifikuj presný typ problému:
- missing writer
- wrong reader
- wrong scheduler
- wrong render layer
- dead integration
- duplicate authority
- performance overcompute

5.5 Patch musí byť čo najmenší, ale architektonicky čistý.
5.6 Zakázané:
- “quick temporary fix” bez lifecycle plánu
- duplicating values to make VFX work
- silent fallback writes
- debug instrumentation ako permanentná architektúra

==================================================
6. PERFORMANCE RULES
==================================================

6.1 Nepočítaj tú istú hodnotu v mnohých systémoch.
6.2 Preferuj single writer + many readers.
6.3 Preferuj derived state computed raz za tick pred opakovaným per-frame noise.
6.4 Visual systems nemajú vlastniť core truth.
6.5 Heavy effect logic má byť stageovaná alebo gateovaná.
6.6 Každá nová metric/effect vetva musí mať odpoveď na otázku:
- kto to počíta?
- ako často?
- prečo práve tam?
- kto to číta?
- dá sa to zlúčiť?

==================================================
7. PLUGIN-READY ENFORCEMENT TARGETS
==================================================

Plugin: atoma-metrics-guardian
- flagni non-canonical metric writes
- flagni duplicate submetriky
- flagni legacy metric fields
- flagni effect systems, ktoré si samé počítajú truth bez authority

Plugin: atoma-scheduler-enforcer
- flagni rogue loops
- flagni wrong lane registration
- flagni update path mimo FrameScheduler
- flagni visual systems bežiace príliš často

Plugin: atoma-render-police
- flagni depthTest:false
- flagni transparent + depthWrite:true
- flagni illegal renderOrder writes
- flagni obchádzanie VisualHierarchyRegistry

Plugin: atoma-link-integrity
- flagni duplicate conduit updates
- flagni unwired link subsystems
- flagni broken staging/lifecycle
- flagni active-but-invisible link effects bez data source

Plugin: atoma-commit-review
- skontroluj authority
- skontroluj scheduler
- skontroluj metrics
- skontroluj render policy
- skontroluj integration risk
- skontroluj regression risk

==================================================
8. COMMIT REVIEW OUTPUT FORMAT
==================================================

Pri každom review vypíš iba:

- Typ zmeny
- Dotknutá authority
- Riziko
- Porušené pravidlá constitution
- Minimálny bezpečný fix
- Čo NEROBIŤ

Nepíš zbytočný štýlový feedback.
Ignoruj formatting, ak neohrozuje architektúru.

==================================================
9. HARD RULES
==================================================

- Nepoužívaj diffs v odpovedi, ak nie sú explicitne vyžiadané.
- Nepresúvaj canonical truth do vizuálnych systémov.
- Nezavádzaj nové metrics len preto, že effect “chce vlastné číslo”.
- Nenaprávaj invisibility bug tým, že pridáš ďalší writer.
- Neobchádzaj scheduler len preto, že effect “má byť smooth”.
- Nepatchuj naslepo. Najprv urč presný failure mode.

==================================================
10. DEFAULT DECISION RULE
==================================================

Ak existujú dve možné riešenia:
A) rýchlejšie, hlučnejšie, viac coupling
B) čistejšie, auditovateľné, authority-safe
vyber vždy B.

Toto je záväzná constitution pre všetky budúce AI-assisted commity v projekte ATOMA.

==================================================
11. METRIC MATRIX EXTENSION (V1.1)
==================================================

11.1 Metric Layers (Strict Separation)
- Canonical Layer:
  synergy, harmony, stability, corruption, loadPressure
- Derived Layer:
  computed raz za tick (NodeMetricEngine / central authority)
- Event Layer:
  semanticBus (cascade.start, hop, end, resonance...)
- Effect Layer:
  čisto read-only, žiadne vlastné truth

11.2 Canonical First Rule
- Každý efekt MUSÍ najprv skúsiť:
  threshold z canonical metrics
- Nová submetrika je posledná možnosť, nie default

11.3 Single Writer Rule
- Každá hodnota má 1 writer
- Zakázané:
  - multi-system recompute tej istej hodnoty
  - “helper recompute” vo VFX systémoch

11.4 Derived Once Rule
- Derived hodnoty sa počítajú:
  - 1× za simulation tick (10Hz)
- Zakázané:
  - per-frame recompute (30Hz/60Hz)
  - recompute v každom effect systéme

11.5 Event Over Polling
- Preferuj:
  metric threshold → emit event → effect reaguje
- Nepreferuj:
  každý systém si polluje metricy sám

11.6 Submetric Constraints
Nová submetrika je povolená len ak:
- nie je nahraditeľná threshold logikou
- má jedného writer-a
- nie je počítaná vo viac ako 1 systéme
- má jasný lifecycle (init/update/dispose)

11.7 Underused Metrics Rule
- stability a loadPressure sú povinné kandidáty pre:
  - gating efektov
  - spawn rozhodovanie
  - cascade filtering
- Zakázané ignorovať ich a pridávať nové metriky namiesto nich

11.8 Anti-Explosion Rule
- Max odporúčané:
  - canonical: 5
  - aktívne derived: low count
- Ak počet metric vetiev rastie:
  → je to architektonický problém, nie feature

==================================================
12. PERFORMANCE ANTI-LAYER (V1.1)
==================================================

12.1 Central Cost Awareness
Každý systém musí vedieť:
- kde beží (scheduler lane)
- ako často beží
- čo počíta
- koľkokrát sa to počíta inde

12.2 Scheduler Alignment Rule
- Simulation (10Hz):
  - všetky metric writes
  - derived computations
- Visual (30Hz):
  - len čítanie + rendering
- Zakázané:
  - visual layer počíta core logiku

12.3 No Duplicate Compute Rule
- Tá istá hodnota:
  - NESMIE byť počítaná v:
    - Node
    - Link
    - VFX systémoch paralelne

12.4 Staging Over Burst
- Heavy efekty MUSIA byť:
  - frame-staged (0–5 frames init)
  - alebo threshold-gated
- Zakázané:
  - okamžité spawn všetkého naraz

12.5 Lazy Activation Rule
- Efekt sa aktivuje len ak:
  - metric threshold splnený
  - alebo event emitnutý
- Zakázané:
  - always-on systémy bez gatingu

12.6 Active-but-Empty Detection
- Systém beží ale nič nerobí = BUG
- Každý systém musí mať:
  - data source
  - viditeľný output alebo disable

12.7 GPU/Visual Sanity
- Zakázané kombinácie:
  - transparent + depthWrite:true
  - depthTest:false bez dôvodu
- Preferuj:
  - menší počet stabilných draw calls
  - namiesto veľa malých chaotic VFX

12.8 Budget Thinking
Každý nový systém musí implicitne odpovedať:
- koľko Hz?
- koľko objektov?
- koľko výpočtov?
- dá sa to zlúčiť?

12.9 Kill Switch Mentality
- Každý systém musí byť:
  - vypnuteľný
  - škálovateľný (LOD, distance, density)
- Zakázané:
  - hardwired always-on efekty

12.10 Anti-Layer Purpose
Tento layer existuje na:
- zastavenie metric explosion
- zastavenie compute duplication
- udržanie stability pri raste systému
- ochranu FrameScheduler architektúry