🧠 ATOMA – Linking System
Refactor Readiness & Execution Checklist v1.0
🔴 GATE 0 — PRE-REFRACTOR READINESS

(Ak čo i len jedna odpoveď = NIE → STOP)

 Existuje aktuálny Design Contract (v0.2 alebo vyšší)?

 Existujú Pilot Contracts (v0.1 alebo vyšší)?

 Je jasné, ktorý pilot tento refactor rieši?

 Viem jednou vetou povedať:

„Aký authority problém tento refactor rieši?“

❌ Ak odpoveď znie „len to trochu upracem / zrýchlim“ → STOP

🟠 GATE 1 — AUTHORITY CLARITY

(Pred dotykom kódu)

 Každý dotknutý súbor má jednu primárnu doménu?

Structural / Semantic / Visual / Temporal / Interaction

 Žiadny nový kód neporušuje smer:

Structural → Semantic → Visual → Interpretive


 Žiadny vizuálny alebo interaction kód:

 nepíše do link.userData

 nepíše do node.userData (okrem interaction namespace)

🟥 Ak vznikne multi-authority → musí byť explicitne označený

🟡 GATE 2 — WRITE SURFACE AUDIT

(Najdôležitejší gate)

Pre KAŽDÝ zápis, ktorý refactor mení alebo pridáva:

 Viem presne, KTO zapisuje?

 Viem presne, DO ČOHO zapisuje?

link.userData.*

node.userData.*

vizuálne uniformy

indexy / registry

 Je tento zápis:

 strukturálny

 semantický

 vizuálny

 Existuje iný writer na to isté miesto?

❌ Ak áno → porušuješ Single Writer invariant

🟣 GATE 3 — TEMPORAL CONSISTENCY

(Žiadne “len trochu throttlujem”)

 Viem, v akej časovej doméne tento kód beží?

Frame

Tick

Slow

Event

 Nezmenil som časovú doménu bez explicitného dôvodu?

 Ak ide o semantic mutation:

 nebeží per-frame bez dôvodu

 Ak ide o visual mutation:

 je lacná

 je reverzibilná

🟥 Ak miešaš frame + tick v jednom systéme → STOP

🔵 GATE 4 — PILOT-SPECIFIC CHECKS
🧨 Pilot 1: Request-Based Collapse

 Semantic systém:

 NEVOLÁ unlink / removeLink

 iba emitoval collapse request

 Structural systém:

 je jediný, kto vykonáva unlink

 Vizuály:

 len reagujú

 nikdy nespúšťajú unlink

⭐ Pilot 2: Priority Single Writer

 Existuje jednoznačný Priority Authority?

 Všetky ostatné systémy:

 len čítajú

 alebo emitujú návrhy

 Nikde neexistujú:

 dva zápisy do link.priority v jednom frame/tick

🎯 Pilot 3: Interaction Fence

 Interaction systémy zapisujú:

 len do interaction state

 Interaction systémy:

 nemenia semantiku

 nemenia štruktúru

 Vypnutie interaction:

 nemení výsledok simulácie

🟢 GATE 5 — BEHAVIOR PRESERVATION

Pred merge/refactor completion:

 Link creation/removal sa správa identicky

 Corruption / harmony / synergy sa vyvíjajú rovnako

 Vizualita:

 neklame

 nestráca význam

 Neobjavili sa nové implicitné závislosti

Ak sa niečo zmenilo → musí existovať explicitný design decision

⚫ GATE 6 — POST-REFACTOR CONTRACT CHECK

 Refactor neporušuje Design Contract v0.2

 Nevytvoril nový multi-authority systém

 Nevytvoril “dočasné riešenie bez kontraktu”

 Je dokumentované:

čo sa zmenilo

prečo

v ktorej doméne

🧾 QUICK FAIL CONDITIONS (okamžitý STOP)

❌ „Len som to zrýchlil“
❌ „To je len vizuál, nevadí“
❌ „To je len helper“
❌ „Takto je to jednoduchšie“

Ak niečo porušuje kontrakt, jednoduchosť nie je argument.

🧭 ZÁVEREČNÁ MANTRA

Najprv autorita.
Potom čas.
Potom dáta.
Až nakoniec výkon.