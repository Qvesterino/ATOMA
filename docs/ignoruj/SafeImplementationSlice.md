🅿️ P4 – First Safe Implementation Slice
cieľ: optimalizovať bez zmeny významu
🧭 Základné pravidlá P4 (nemenné)

P4 NESMIE:

meniť význam priority / collapse / integrity

zaviesť nové writery

zaviesť nové stavy

meniť vizuálne správanie

P4 SMIE:

znížiť počet výpočtov

zjednotiť cadence

presunúť veci z frame → tick

memoizovať, cacheovať, agregovať

➡️ teda výkon bez filozofie.

🎯 Odporúčam začať týmto (najvyšší ROI):
✅ P4.1 – Priority Update Cadence Unification
Prečo práve toto

už máš single-writer

už máš authority funnel

ale priority sa stále:

dotýkajú frame-loopu

miešajú deltaTime / ms

updateujú častejšie než treba

👉 toto je low-risk / high-gain optimalizácia.

🔬 Čo presne optimalizujeme (konkrétne)
Stav DNES:

computePriorityScore môže bežať:

na usage event

na decay tick

niekde ešte frame-adjacent

_lastTrafficUpdate, _lastScoreUpdate existujú, ale:

cadence nie je formálne uzavretá

systém môže robiť redundantné výpočty

🎯 Cieľ P4.1

Každý link má maximálne 1 priority recompute za tick.

Nie za frame.
Nie za event spam.
Za tick.

🛠️ P4.1 – návrh (bez kódu, len plán)
1️⃣ Zavedieme Priority Tick Contract (interný)

cadence: 500 ms (už existuje implicitne)

priority sa:

označí ako dirty

prepočíta len na ticku

2️⃣ Eventy (usage, decay) robia iba:

markPriorityDirty(linkId, reason)

ukladajú inputs (traffic sample, decay hint)

3️⃣ Na ticku:

authority funnel:

skontroluje dirty

spraví 1 recompute

aplikuje patch

zruší dirty flag

➡️ Význam ostáva 100 % rovnaký
➡️ Počet výpočtov klesne dramaticky

📈 Čo tým získaš

menej CPU v animate()

stabilnejší priority signál

predvídateľný timing

pripravenú pôdu pre:

region batching

async priority eval

LOD-based link logic

A hlavne:

žiadne riziko collapse bugov

🧪 Ako spoznáš, že P4.1 je hotové

Checklist:

 priority recompute nebeží z frame loopu

 max 1 recompute / link / tick

 žiadna zmena správania v hre

 FPS rovnaké alebo lepšie

 žiadne nové writery

🔀 Alternatívy (ak by si chcel iný slice)

Len pre prehľad, nie teraz:

P4.2 – Link Region Aggregation (batching)

P4.3 – Visual LOD gating for stress/tension

P4.4 – Hover / crosshair read-only fast path

P4.5 – Debug-only metrics throttling

Ale P4.1 je najčistejší štart.