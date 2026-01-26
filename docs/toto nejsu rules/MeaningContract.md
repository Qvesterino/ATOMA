🧠 P3.1 – Meaning Contracts (Tightened)
🔻 COLLAPSE CONTRACT (v1.1)
Definition

Collapse je autoritatívny sémantický stav indikujúci, že link alebo región zlyhal za hranicou obnoviteľnosti.
Strukturálne odstránenie (unlink/removal) je povolené iba ako následok explicitného collapse requestu, nie ako implicitný efekt samotného stavu.

Inputs

Integrity state machine (primary gate)

Stress / Load severity (advisory inputs)

Quality / Corruption degradation

Optional priority-derived thresholds (read-only)

Outputs

Semantic flags: collapsed, unstable→collapsed

Explicit collapse request (signal, nie akcia)

Visual cues (critical warnings, VFX)

Eligibility gating pre healing/reconstruction

Authority

Semantic systems môžu deklarovať collapse state.

Structural systems smú vykonať unlink/removal výhradne ako odpoveď na explicit collapse request schválený integrity gate.

Forbidden Behaviors (Non-Negotiable)

Žiadny implicitný unlink na základe vizuálu.

Žiadny vizuálny systém nesmie spôsobiť collapse.

Žiadny interaction systém nesmie vynútiť collapse.

Žiadne obchádzanie integrity/stress preconditions.

Žiadni duálni writeri collapse state.

Invariants

Collapse nikdy nemení topológiu sám o sebe.

Každý štrukturálny akt musí mať auditovateľný request.

Collapse request ≠ Collapse execution.

Edge Cases

Rapid oscillation (unstable ↔ collapsed): musí byť tlmená integrity gate (cooldown / hysteresis).

Region vs. link collapse: regionálny collapse nesmie automaticky kaskádovať unlink na jednotlivé linky bez per-link requestu.

Recovery race: ak healing začne pred exekúciou, collapse request sa musí zrušiť alebo expirovať.

Notes

Collapse je významový autoritatívny signál, nie mechanická akcia. Vizuál je deskriptívny, nie kauzálny.

⚙️ LOAD CONTRACT (v1.1)
Definition

Load je sémantická miera operačného tlaku (traffic, throughput, work) na uzly/linky.

Inputs

Traffic / usage signals

Throughput metrics

Category modifiers

Čas pod udržanou aktivitou

Outputs

Semantic load metrics (napr. loadPressure)

Advisory vplyv na stress / instability / priority

Read-only vizuálne škálovanie

Authority

Metrics systémy vlastnia výpočet load.

Load je advisory vstup pre downstream systémy.

Nemá štrukturálnu autoritu.

Forbidden Behaviors

Load nikdy priamo nespôsobí unlink alebo collapse.

Load nesmie obchádzať integrity.

Load nesmie byť riadený vizuálom alebo interakciou.

Invariants

Load ≠ Stress ≠ Collapse.

Load môže ovplyvniť rozhodnutia, nie ich vykonať.

Edge Cases

Burst vs. sustained: krátke špičky nesmú viesť k collapse bez potvrdenia stress/integrity.

Zero-activity decay: load musí klesať definovanou kadenciou, nie skokovo.

Notes

Load je vstupná veličina. Ak sa zmení na akciu, porušuje kontrakt.

🎭 TENSION CONTRACT (v1.1)
Definition

Tension je percepčný a naratívny signál konfliktu alebo latentného napätia. Je primárne metaforický.

Inputs

Narrative/contest metrics

Derivácie instability/stress

Designer-defined váhy

Outputs

Perceptuálne signály (vizuálne napätie, pacing)

Advisory flags pre mood/pacing

Authority

Neautoritívny.

Vizuálne/naratívne systémy môžu renderovať a tempo-vať.

Mechanické systémy ho ignorujú alebo čítajú len advisory.

Forbidden Behaviors

Tension nesmie spúšťať collapse, unlink, ani meniť topológiu.

Tension nesmie mutovať integrity ani priority.

Interaction systémy nesmú povýšiť tension na autoritu.

Invariants

Tension je informácia pre hráča, nie pravidlo pre systém.

Edge Cases

Feedback loop: vizuálne zvýšenie tension nesmie spätne zvyšovať stress/load.

Designer overrides: manuálne zvýšenie tension nesmie mať mechanický efekt.

Notes

Tension je atmosféra. Ak začne „rozhodovať“, je to bug.

🔒 Cross-Contract Invariants (Global)

Žiadny vizuál nikdy nespôsobí štrukturálnu zmenu.

Všetky štrukturálne zmeny musia byť auditovateľné (request → gate → execute).

Advisory ≠ Authority.

Single-writer pravidlá (P2) platia aj v P3.