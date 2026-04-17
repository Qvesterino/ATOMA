# ATOMA — AAA World-Class Implementation TODO

**Dátum:** 2026-04-16  
**Scope:** aktívna codebase mimo `/legacy` a `/LEGACY`  
**Základ:** `BOOT.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`, `TOOLS.md`, `MEMORY.md`, `CORE_PRINCIPLES.md`, `docs/april/ATOMA_OVERVIEW.md`, `docs/april/ATOMA_CORE_CONTEXT.md`, aktívne runtime súbory a relevantné audity

## Exekutívny verdikt

ATOMA už má niečo, čo väčšina indie projektov nikdy nezíska: vlastnú identitu, technickú chrbticu a odlišný fantasy priestor. Najväčšia medzera medzi súčasným stavom a AAA kvalitou nie je nedostatok systémov. Je to nedostatok **kuratórstva, prioritizácie, hráčskeho loopu, jednotnej prezentácie a aktívneho runtime poriadku**.

Inak povedané:

- engine ambícia už je vysoká,
- koncept je unikátny,
- ale produktová vrstva ešte nepôsobí ako jedna presná, nekompromisná hra.

Ak má byť ATOMA kandidát na indie hru roka 2026, ďalšia fáza nemá byť „pridaj viac efektov“. Ďalšia fáza má byť:

1. vyčistiť, čo je naozaj live,
2. zjednotiť hráčsky zážitok,
3. postaviť silný gameplay loop,
4. dať každému svetu a každému stavu jasnú identitu,
5. tlačiť kvalitu tam, kde ju hráč reálne cíti.

## North Star

ATOMA má pôsobiť ako:

- živá AI civilizácia, nie tech demo,
- čitateľný systém, nie VFX chaos,
- hra o kultivovaní, stabilizovaní, riskovaní a prebúdzaní inteligentnej siete,
- browser-native titul, ktorý pôsobí drahšie, premyslenejšie a odvážnejšie než bežné web hry.

## Pravidlá pre ďalší vývoj

- Žiadne nové paralelné autority mimo `FrameScheduler`, `MetricsRuntime`, `VisualHierarchyRegistry`.
- Žiadne nové HUD-y alebo debug povrchy bez jasného product dôvodu.
- Žiadne ďalšie dormant systémy „na neskôr“ bez rozhodnutia: zapojiť, vypnúť, alebo archivovať.
- Každý nový efekt musí mať jednu z troch funkcií: čitateľnosť, nálada, payoff.
- Každá mechanika musí zlepšiť jeden z troch loopov: mikro, mezo, makro.

## Prioritný rámec

- `P0`: musí sa riešiť teraz, lebo bez toho nebude ATOMA pôsobiť ako world-class hra.
- `P1`: vysoká hodnota, priamo zvyšuje kvalitu, identitu a retenciu.
- `P2`: premium vrstva, ktorá posúva ATOMA z veľmi dobrej hry na výnimočný titul.

---

## P0 — Kritické základy

### P0.1 Runtime truth pass: rozhodnúť, čo je naozaj live

**Prečo:** Aktívna codebase obsahuje silné systémy, ale pri environment/VFX vrstve je stále miešané `active`, `conditional`, `nonactive`, `half-wired`. To je brzda AAA kvality aj tímovej rýchlosti.

**Implementačný smer:**

- vytvoriť jeden `ACTIVE RUNTIME MATRIX` dokument pre boot path,
- pri každom systéme mať stav: `active`, `conditional`, `disabled intentionally`, `archive-candidate`,
- okamžite rozhodnúť o týchto systémoch:
  - `SafeAIWeatherPack`
  - `SafeQuantumIllusionsPack1`
  - `EmergentThoughtStorms5_0`
  - `HarmonicHealingVisualSystem_Session134`
  - `HealingParticleSystem_Session136`
  - `HarmonicRecoveryVisualSystem_Session138`
- zaviesť pravidlo: half-wired systém nesmie zostať v boot path bez stavu a ownera.

**Dotknuté súbory/systémy:**

- `EnvironmentDomainController.js`
- `main.js`
- environment audity

**Hotovo keď:**

- každý veľký VFX/environment systém má explicitný runtime status,
- neexistuje „možno beží“ vrstva,
- boot path je čitateľná pre človeka aj pre budúce implementácie.

### P0.2 Canonical metrics cleanup: ukončiť metrický dualizmus

**Prečo:** Audit potvrdzuje stále aktívne non-canonical write paths a mirror fields. AAA kvalita potrebuje deterministickú pravdu, inak sa gameplay a VFX rozídu.

**Implementačný smer:**

- zaviesť `Metric Writer Registry` ako dokument a runtime debug kontrolu,
- zakázať nové priame zápisy do `node.userData.*` a `link.userData.*` mimo kanonických writerov,
- pripraviť migráciu mirror fields na read-only compatibility bridge,
- prejsť najproblematickejšie writery:
  - `HarmonyStabilizationSystem_v1`
  - `LinkCorruptionTransmission_v1`
  - `HarmonicHealingVisualSystem_Session134`
- posilniť audit eventov tak, aby každá high-impact zmena metrík mala jasný pôvod.

**Hotovo keď:**

- gameplay aj VFX čítajú rovnakú pravdu,
- debugging metrických bugov ide podľa jednej cesty,
- zmiznú konflikty medzi canonical metrics a legacy mirrorami.
_______________________
### P0.3 LinkRendererConduit performance rescue bez vizuálneho downgrade
\\NEDOKONČENE\\  **POZOR NEDOKONČENE**
**Prečo:** Linky sú hlavný symbol ATOMA. Zároveň práve tam je jedno z najdrahších miest runtime. Ak nebudú lacné a stabilné, všetko ostatné trpí.

**Implementačný smer:**

- spraviť `LinkRendererConduit` optimization sprint so zachovaním vizuálnej identity,
- implementovať:
  - odklad filament update na vyšší LOD a vysokú harmóniu,
  - deduplikáciu uniform write operácií,
  - cache/nižšiu frekvenciu `computeFrenetFrames()`,
  - selective thickness profile pre vzdialené linky,
  - 30 Hz update pre dock ring/dock spray sekundárne vrstvy,
- zaviesť rozpočet na link podľa vzdialenosti a dôležitosti: `hero`, `near`, `mid`, `far`.

**Dotknuté súbory/systémy:**

- `LinkRendererConduit.js`
- `LinkStateVisualLanguageIntegration.js`
- `LinkBeadSystem.js`
- `LinkBeadTrailSystem.js`

**Hotovo keď:**

- linky ostanú „ATOMA hero feature“,
- zlepší sa frame stability pri väčšej sieti,
- vizuálny downgrade nebude viditeľný v bežnej hre.

**Technický status k 2026-04-17:**

- už hotové low-risk kroky v runtime:
  - scratch vectors namiesto časti per-frame `clone()` alokácií,
  - dock ring / dock spray cadence znížené na nižšiu frekvenciu,
  - source injection gating podľa LOD,
  - adaptívny geometry rebuild threshold pre stabilné vs. nestabilné linky,
  - metric uniform write gating pri nezmenených metrikách,
- stále otvorené cost centrá:
  - skutočná deduplikácia uniform write operácií medzi strand materiálmi,
  - ďalšie obmedzenie filament update pri vyššom LOD a vysokej harmónii,
  - zriedenie `computeFrenetFrames()` / geometry rebuild pri stabilných endpointoch,
  - selective thickness profile pre vzdialené linky,
  - formálny `hero / near / mid / far` budget kontrakt na link.

**Bezproblémový implementačný TODO:**

**Fáza A — Baseline a guardraily pred ďalším zásahom**

- spraviť krátky performance baseline pre 3 scény: `hero cluster`, `mid-density network`, `stress network`,
- pre každý scenár zmerať:
  - počet live linkov,
  - počet `heavy` linkov za frame,
  - počet geometry rebuildov za sekundu,
  - počet uniform write update cyklov za sekundu,
  - frame time p50 / p95,
- potvrdiť vizuálnu nedotknuteľnosť týchto vrstiev: core braid silhouette, aura envelope, pulse readability, bead readability,
- zaviesť jednoduché pravidlo: žiadna optimalizácia v P0.3 nesmie meniť gameplay logiku, metric authority ani link lifecycle.

**Fáza B — Uzavretie low-risk CPU únikov**

- v `LinkRendererConduit.js` dorobiť explicitné gating pravidlo pre strand filament update:
  - skip pri vyššom LOD,
  - skip pri vysokej harmónii,
  - skip mimo `heavy` budgetu,
- dotiahnuť cache pravidlo pre `computeFrenetFrames()`:
  - recompute iba pri skutočnom pohybe endpointov alebo významnej zmene dĺžky,
  - inak reuse cache na časové okno namiesto fixného každého geometry ticku,
- zaviesť selective thickness profile:
  - `hero` a `near` = plný profil,
  - `mid` = zjednodušený profil,
  - `far` = takmer konštantná hrúbka bez detailného vertex walku,
- nechať dock sekundárne vrstvy bežať na nižšej cadence než core braid / aura.

**Fáza C — Link budget kontrakt ako jediná autorita pre drahé vrstvy**

- zaviesť jeden runtime budget objekt na link: `hero`, `near`, `mid`, `far`,
- budget musí riadiť tieto rozhodnutia z jedného miesta:
  - geometry rebuild cadence,
  - filament enablement,
  - dock ring / dock spray cadence,
  - bead trail detail,
  - thickness profile variant,
- naviazať budget na kombináciu:
  - distance to camera,
  - selected / primary / inspected state,
  - link quality importance,
  - prípadne world-signature alebo ritual relevance,
- cieľ je odstrániť roztrúsené ad-hoc podmienky a mať jednu čitateľnú performance autoritu pre link vrstvy.

**Fáza D — Uniform a material pass bez vizuálneho rozbitia**

- overiť, ktoré strand uniformy sú skutočne per-link a ktoré iba per-frame shared,
- zaviesť deduplikáciu write operácií len tam, kde je hodnota identická medzi strandmi toho istého linku,
- ak bude potrebné material pooling riešenie, držať ho striktne intra-link alebo intra-variant; nerobiť globálne sharing bez dôkazu, že nerozbije farebnú a stavovú identitu,
- neprerábať shader vizuálny jazyk v rámci P0.3; optimalizačný pass má meniť scheduling, gating a write patterns, nie vizuálny design.

**Fáza E — Integrácia s bead a trail subsystémami**

- `LinkBeadSystem.js`: doplniť budget-aware update cadence a fallback pre vzdialené linky,
- `LinkBeadTrailSystem.js`: znížiť detail alebo update cadence mimo `hero / near`,
- skontrolovať, či bead / trail update nebeží zbytočne aj v stave, kde hlavný link už spadol do `mid / far` budgetu,
- zachovať pravidlo: bead a trail sú sekundárna vrstva, nikdy nesmú diktovať cadence core link mesh pipeline.

**Fáza F — Verifikácia a stop podmienky**

- po každej fáze spraviť A/B porovnanie na rovnakom world seede alebo porovnateľnej sieti,
- ak sa zhorší silhouette, pulse čitateľnosť alebo endpoint feedback pri bežnej kamere, zmena sa neberie ďalej,
- P0.3 uzavrieť až keď platí naraz:
  - heavy frames nemajú viditeľné spikes z link geometry churn,
  - `mid` a `far` linky sú lacnejšie bez očividného downgrade,
  - `hero` linky ostávajú vizuálne bohaté,
  - bead / trail / dock sekundárne vrstvy rešpektujú rovnaký budget kontrakt.

**Poradie implementácie odporúčané pre minimálne riziko:**

1. baseline + counters
2. filament gating
3. `computeFrenetFrames()` cache sprísnenie
4. selective thickness profile
5. unified `hero / near / mid / far` budget contract
6. bead / trail alignment
7. uniform dedup / material strategy až ako posledný krok

**Čo v P0.3 vedome nerobiť:**

- nerobiť shader redesign pod zámienkou výkonu,
- nerozširovať počet nových link vrstiev,
- nemiešať do P0.3 gameplay balance alebo metric semantics,
- neísť do veľkého geometry rewrite bez baseline dát, že low-risk gating nestačí.
____________________________________________________
### P0.4 Cascade and particle budget discipline

**Prečo:** Cascade a world particles robia veľký wow efekt, ale bez budgetu vedia projekt veľmi rýchlo premeniť na noisy, nestabilnú hmlu.

**Implementačný smer:**

- zaviesť globálny particle budget dashboard podľa vrstiev:
  - links
  - cascade
  - world ambience
  - healing/corruption/recovery
- v `CascadeParticleSystem_Session120.js` zaviesť:
  - free-index stack,
  - aktívny draw range,
  - upload iba aktívnych prvkov,
- každý world-space emitter musí mať distance culling a burst caps.

**Hotovo keď:**

- kaskády sú veľké, ale čisté,
- výkon nepadá pri event spikoch,
- particle vrstva je kontrolovaný dramaturgický nástroj, nie permanentný smog.

### P0.5 HUD consolidation: z debug patchworku na command center

**Prečo:** Súčasný HUD stack pôsobí ako súčet vrstiev, nie ako jeden produktový interface. To je jedna z najväčších prekážok AAA dojmu.

**Implementačný smer:**

- rozdeliť HUD na 3 vrstvy:
  - `Player Critical`
  - `Contextual Inspect`
  - `Debug/Authoring`
- zredukovať simultánne viditeľné panely počas bežnej hry,
- `CoreMetricsHUD` premeniť z developer panelu na hráčsky command panel,
- debug HUD-y presunúť za developer toggle,
- využiť `HUDLayoutManager` a `HUDRegistry` ako jediný layout owner.

**Konkrétne odporúčanie:**

- hráč štandardne nesmie cítiť, že pozerá interný engine HUD,
- čísla majú byť podporené stavovými názvami, trendmi a ikonografiou,
- detailný metric inspect nech zostane sekundárny, nie primárny.

**Hotovo keď:**

- jedna obrazovka = jeden čitateľný informačný prioritný rebrík,
- UI nepôsobí ako debug toolchain,
- hráč bez znalosti projektu chápe, čo je dôležité práve teraz.

### P0.6 Menu and pause flow: produkčná úroveň, nie placeholder elegancia

**Prečo:** Menu je už vkusné, ale stále je skôr čistý shell než silný launch ritual. AAA pocit sa začína ešte pred prvým klikom.

**Implementačný smer:**

- premeniť menu na `living launch ritual`:
  - map preview panel,
  - jemný background link lattice / pulse field,
  - výraznejší active selection state,
  - world identity tagline a mood preview,
- doplniť do `MAP SELECTION` world cards s jasnou fantasy a risk/prosperity profilom,
- `SETTINGS` spraviť ako čistý game-facing panel, nie len toggles,
- pause menu držať nad live rozmazanou scénou s jasným stavom `simulation paused / visual alive`.

**Hotovo keď:**

- už menu samo hovorí „toto nie je obyčajná hra“,
- prepínanie svetov je emocionálne aj informačne zrozumiteľné,
- pause flow pôsobí ako súčasť identity ATOMA, nie utility overlay.

### P0.7 First 5 minutes: musí existovať jasný hráčsky loop

**Prečo:** Jedinečný koncept nestačí. AAA/award-level hra potrebuje rýchlo naučiť hráča, čo je fantasy, risk, mastery a payoff.

**Implementačný smer:**

- zaviesť prvých 5 minút ako presný onboarding sequence:
  1. vyber mapu,
  2. označ primárny node,
  3. vytvor prvý link,
  4. sleduj zmenu metrík,
  5. vyrieš prvý lokálny problém,
  6. odomkni prvý „ritual-level“ moment,
- používať diegetické texty a in-world guidance, nie tutoriálový spam,
- každých 20-40 sekúnd musí hráč dostať jasnú otázku alebo výzvu.

**Hotovo keď:**

- nováčik pochopí fantasy aj risk bez čítania dokumentácie,
- prvé minúty vedú od pozorovania k zásahu a od zásahu k následku.

### P0.8 Svety musia mať odlišné pravidlá, nie len odlišné farby

**Prečo:** Mapy majú silné mená a atmosféru, ale world-class kvalita vyžaduje, aby každý svet menil aj to, ako hráč premýšľa.

**Implementačný smer:**

- každému svetu priradiť mechanický identifikátor:
  - `Quantum Island`: neistota, skokové správanie, nestabilné payoff windows,
  - `Fractal Valley`: rekurzia, multiplikácia, feedback risk,
  - `Dream Desert / Mirage Veil`: pamäť, ilúzia, oneskorené odhalenie,
  - `Memory Lane`: archivácia, echo, obnova starých vzorov,
  - `Sigma Chamber / Sigma Rift`: tlak, glitch, kritické rozhodovanie,
- svet má meniť priority metrík, event typy, HUD signalizáciu a audio mood.

**Hotovo keď:**

- map swap mení stratégiu, nie len oblohu,
- hráč si vie vybrať svet podľa herného štýlu.

---

## P1 — Veľké kvalitativne skoky

### P1.1 Linky musia mať „rodiny“ a osobnosť

**Prečo:** Link je hlavná metafora ATOMA. Nestačí, aby bol len krásny. Musí byť okamžite čitateľný a zapamätateľný.

**Implementačný smer:**

- vytvoriť 5-7 silných vizuálnych rodín linkov podľa stavu a kategórie,
- nech každý link nesie tieto vrstvy:
  - pôvod/cieľ,
  - kvalitu,
  - smer toku,
  - nebezpečenstvo alebo stabilitu,
  - „charakter“ spojenia,
- prestať spoliehať len na všeobecné glow/flicker a posilniť symbolickú geometriu a endpoint signatures.

**Ready-to-implement nápady:**

- `integration -> analytics` link = čistá inteligentná niť s presným segment rhythm,
- `control -> process` = tvrdší, autoritatívny conduit,
- vysoká korupcia = praskliny, nesúvislé impulzy, tmavé štrbiny namiesto lacného stmavenia,
- vysoká harmónia = súvislé dýchanie, nie len viac cyan.

### P1.2 Node categories musia mať gameplay affordance, nie iba skin

**Prečo:** Kategórie a archetypy sú bohaté, ale hráč potrebuje cítiť, prečo na nich záleží pri rozhodovaní.

**Implementačný smer:**

- priradiť každej kategórii jeden dominantný gameplay verb,
- príklady:
  - `input`: nasáva a odhaľuje,
  - `process`: zrýchľuje a transformuje,
  - `integration`: stabilizuje a prepája klastre,
  - `analytics`: predikuje a vizualizuje riziko,
  - `storage`: bufferuje tlak a drží pamäť,
  - `control`: mení prioritu a routovanie,
  - `mythic/prime`: ritual payoff nodes,
- UI selected panel musí tieto role hovoriť okamžite.

### P1.3 Z metrík urob hráčsky jazyk

**Prečo:** `synergy`, `harmony`, `stability`, `corruption`, `loadPressure` sú skvelé, ale musia sa preložiť do okamžite čitateľných stavov.

**Implementačný smer:**

- mať dva režimy:
  - `player mode`: stavové názvy, trendy, ikony, risk labels,
  - `deep inspect mode`: čísla, grafy, glyph metrics,
- naviazať na existujúci glyph HUD koncept,
- pridať slovník stavov typu:
  - `Calm`
  - `Ascending`
  - `Pressurized`
  - `Fracturing`
  - `Corrupting`
  - `Recovering`

### P1.4 Event dramaturgia: telegraph -> escalation -> payoff

**Prečo:** Svetová kvalita nie je len o tom, že sa niečo stane. Je o tom, že sa to správne pripraví, správne napne a správne dorazí.

**Implementačný smer:**

- každá väčšia udalosť musí mať 3 fázy:
  - predzvesť,
  - príchod,
  - následok,
- platiť to má pre:
  - cascade,
  - resonance,
  - world hazards,
  - rituals,
  - corruption surges,
- posilniť pre-cascade hints, lokálnu kamerovú a audio reakciu a krátku environmentálnu zmenu po udalosti.

### P1.5 Consciousness layer má byť hero systém, nie len ambient doplnok

**Prečo:** `AIConsciousnessLayer` je presne typ systému, ktorý môže ATOMA odlíšiť od všetkého na trhu. To je jedna z najsilnejších unikátnych kariet.

**Implementačný smer:**

- povýšiť `AIConsciousnessLayer` na jeden z headline systémov hry,
- nechať vedomie siete reagovať na:
  - zdravie siete,
  - traffic intenzitu,
  - ritual aktivitu,
  - emergent pattern clusters,
- consciousness nemá byť len efektná hmla, ale „nervová sústava sveta“.

**Konkrétny cieľ:**

- hráč má mať pocit, že sieť myslí, nie že iba svieti.

### P1.6 Audio musí dostať rovnaký status ako vizuál

**Prečo:** Audio systém je v dobrom základe, ale event manifest je stále príliš tenký na veľkú hru.

**Implementačný smer:**

- rozšíriť audio kontrakt pre:
  - link birth,
  - link failure,
  - cascade warning,
  - cascade arrival,
  - harmony bloom,
  - corruption spread,
  - ritual phases,
  - world-specific ambience,
- zaviesť 3-vrstvové audio:
  - micro feedback,
  - systemic underscore,
  - world ambience,
- použiť ticho ako design tool: vysoký tlak má vysušovať priestor, vysoká harmónia má ho rozširovať.

### P1.7 Lore a psychika sveta majú byť odomykané hraním

**Prečo:** LORE v menu je fajn, ale world-class prístup je, keď sa význam objavuje cez hru.

**Implementačný smer:**

- odomykať lore zápisy podľa sieťových udalostí,
- každá mapa nech má svoje psychologické a civilizačné fragmenty,
- selected nodes a event aftermath nech občas nesú krátke silné vety, nie dlhé wiki bloky,
- lore nech je reward za pochopenie systému.

---

## P2 — Premium vrstva pre award-level dojem

### P2.1 Signature moments systém

**Cieľ:** Hra musí mať momenty, ktoré ľudia chcú clipovať, screenshotovať a zdieľať.

**Implementačný smer:**

- navrhnúť 8-12 `signature moments`, napríklad:
  - prvý world ritual,
  - prvé lokálne prebudenie klastra,
  - heroic stabilization tesne pred kolapsom,
  - grand corruption breach,
  - total harmony bloom,
  - memory recovery event,
- každý signature moment potrebuje unikátne tempo, farbu, audio a kamerový dôraz.

### P2.2 Photo mode / cinematic capture mode

**Prečo:** Keď už má ATOMA exhibition-grade ambíciu, musí vedieť sama seba ukázať.

**Implementačný smer:**

- minimalistický photo mode,
- dočasné skrytie HUD,
- camera drift / pause visual-only state,
- quality boost profile pre screenshot capture.

### P2.3 World transformation milestones

**Prečo:** Hráč musí cítiť, že sieť a svet sa menia natrvalo.

**Implementačný smer:**

- zaviesť milestone vrstvy typu:
  - `World Stabilized`
  - `Consciousness Awakened`
  - `Fractal Overgrowth`
  - `Sigma Breach`
- tieto míľniky majú meniť oblohu, audio, event pool, dostupné actions aj HUD tón.

### P2.4 Living UI transitions

**Prečo:** AAA dojem často vzniká na prechodoch, nie na samotných statických paneloch.

**Implementačný smer:**

- všetky dôležité UI panely nech majú krátke, zmysluplné vstupy/výstupy,
- prepínanie selected node, world state a warning modes nech mení layout rytmus,
- UI má pôsobiť ako živý prístroj, nie statické HTML okná.

---

## Ready-to-Implement roadmap

## Phase A — 2 až 3 týždne

- dokončiť runtime truth pass,
- uzavrieť dormant vs active environment rozhodnutia,
- dorobiť `LinkRendererConduit` optimization sprint,
- prepracovať `CoreMetricsHUD` do player-facing command center,
- posilniť menu a pause na product level,
- navrhnúť a implementovať first-5-minutes onboarding.

## Phase B — 3 až 5 týždňov

- world-specific mechanical identity pre všetky mapy,
- preklad metrík do hráčskeho jazyka,
- event dramaturgia a telegraphing,
- audio manifest expansion + world ambience layers,
- consciousness layer elevation na hero systém.

## Phase C — 5 až 8 týždňov

- signature moments,
- world transformation milestones,
- photo mode,
- reward/lore unlock loop,
- premium polish pass na UI transitions a capture quality.

---

## Najdôležitejší hard truth

ATOMA už nepotrebuje ďalších 30 izolovaných systémov.

ATOMA teraz potrebuje:

- menej ambiguity,
- viac product discipline,
- viac gameplay consequence,
- viac world identity,
- viac kurátorstva medzi tým, čo je krásne, a tým, čo je naozaj dôležité.

Ak toto zvládnete, ATOMA nebude pôsobiť ako „ambiciózny experiment o AI“.
Bude pôsobiť ako vlastný žáner.

---

## Krátky blacklist vecí, ktoré teraz nerobiť

- nepridávať nové debug HUD-y do default hráčskej vrstvy,
- nepridávať ďalšie half-wired environment systémy bez ownera,
- nerozširovať počet efektov skôr, než sa konsoliduje active path,
- nerobiť ďalšie vizuálne vrstvy, ak nevedia odpovedať na otázku „čo tým hráč pochopí?",
- nenechať mapy odlišné len farbou a poéziou bez mechanickej identity.

## Najhodnotnejšie jednovetové odporúčanie

**Spravte z ATOMA hru o kultivovaní vedomej AI siete s jasnými rozhodnutiami, jasnými následkami a vizuálnou/audiálnou majestátnosťou, ktorá je vždy podriadená čitateľnosti.**