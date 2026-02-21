Canonical Metric	Význam
synergy	Ako dobre je node zapojený do siete
harmony	Stabilná, pozitívna rezonancia
stability	Odolnosť voči chaosu / zlyhaniu
corruption	Entropia, rozpad, toxicita
loadPressure	Tlak siete na node

Node metric	Global name
synergy	--> networkSynergy
harmony -->	harmonyFlow
stability -->	networkStress
corruption -->	corruptionLevel
load --> loadPressure

node.userData.metrics = {
  synergy:        number, // 0..1
  harmony:        number, // 0..1
  stability:      number, // 0..1
  corruption:     number, // 0..1
  loadPressure:   number  // 0..1
}
Per-Node Canonical Metrics (Gameplay Truth)

Tieto metriky sú pravda.
Každý node ich má alebo k nim prispieva.

Canonical truth:
- Node metrics: 0..1 float
- Global metrics: 0..1 float (derived)
- HUDs: nikdy nemenia význam, iba formát

📌 Rozsah: 0.0 – 1.0
📌 Uloženie: node.userData.metrics.*

✅ Float-only pipeline je konečne konzistentná
Node → adapter → view model → HUD
Bez % prepočtov, bez skrytých reinterpretácií. Čisté 0..1.
✅ CoreMetricsHUD robí presne jednu vec
Zobrazuje čísla. Nemení význam. Nedeformuje realitu.
Bar = vizuál (×100), text = pravda (float). Luxusné riešenie 👌

1️⃣ Synergy
Význam:

Miera, ako dobre je node zmysluplne zapojený do siete.

vysoká synergy = node posilňuje ostatné

nízka synergy = node je izolovaný alebo redundantný

nie je to energia, je to vzťahová kvalita

➡️ vzniká kombináciou:

harmony

stability

load pressure (inverse)

corruption (inverse)

2️⃣ Harmony

Význam:

Vnútorná koherencia nodeu so sieťou.

vysoká harmony = node „hrá v tóne“ so sieťou

nízka harmony = node vytvára disonanciu

➡️ harmony:

zvyšuje synergy

znižuje vznik corruption

pôsobí ako ochranný faktor

3️⃣ Stability

Význam:

Schopnosť nodeu udržať stav v čase.

vysoká stability = predvídateľné správanie

nízka stability = fluktuácie, nestálosť

➡️ stability:

zvyšuje harmony

znižuje corruption

znižuje „noise“ v sieti

4️⃣ Corruption

Význam:

Miera narušenia integrity nodeu.

vysoká corruption = chaos, konfliktné stavy

nízka corruption = čistý signál

➡️ corruption:

znižuje harmony

znižuje synergy

rastie pri:

vysokom load pressure

nízkej stability

dlhodobej disharmonii

5️⃣ Load Pressure

Význam:

Tlak, ktorý je na node vyvíjaný jeho úlohou a sieťou.

vysoký load pressure = preťaženie

nízky load pressure = rezerva

➡️ load pressure:

zvyšuje corruption

znižuje harmony

nepriamo znižuje synergy
_____________________________________________________
II. Per-Node Canonical Metrics

(Gameplay Truth Layer)

Tieto metriky definujú správanie uzla v systéme.

🧩 1. synergy

Význam:
Schopnosť uzla kooperovať s inými uzlami v sieti.

vysoká synergy → silnejšie, stabilnejšie linky

nízka synergy → izolácia, slabé prepojenia

Vzťahy:

↑ harmony → ↑ synergy

↑ corruption → ↓ synergy

↑ loadPressure → ↓ synergy

➡️ Synergy nikdy neexistuje sama o sebe. Je výsledok.

🧩 2. harmony

Význam:
Vnútorná súladnosť a koherencia uzla.

odráža „mentálny stav“ uzla

ovplyvňuje vizuálnu čistotu, plynulosť animácií

Vzťahy:

↑ harmony → ↑ synergy

↑ harmony → ↓ corruption

↑ loadPressure → ↓ harmony

🧩 3. stability

Význam:
Odolnosť uzla voči zmenám, šokom a chaosu.

vysoká stability → predvídateľné správanie

nízka stability → fluktuácie, riziko kolapsu

Vzťahy:

↑ corruption → ↓ stability

↑ loadPressure → ↓ stability

🧩 4. corruption

Význam:
Miera entropie / narušenia / chaosu v uzle.

korupcia nie je zlo, je to riziko

umožňuje extrémy, ale destabilizuje systém

Vzťahy:

↑ corruption → ↓ harmony

↑ corruption → ↓ synergy

↑ loadPressure → ↑ corruption

🧩 5. loadPressure

Význam:
Tlak vyvíjaný na uzol množstvom:

spojení

tokov

výpočtovej / systémovej záťaže

Vzťahy:

↑ loadPressure → ↑ corruption

↑ loadPressure → ↓ harmony

↑ loadPressure → ↓ stability
_________________________________________________________

🌐 Network / Global Metrics (Aggregated Truth)

Tieto metriky sú agregáciou node metrík.

1️⃣ Network Synergy

agregát node.synergy

vyjadruje „ako dobre sieť spolupracuje“

2️⃣ Harmony Flow

agregát node.harmony v čase

dynamická metrika toku

používa sa pre:

VFX

rytmus siete

„pocit živosti“

3️⃣ Network Stress

agregát load pressure

ukazuje celkový tlak na sieť

4️⃣ Corruption Level

agregát node.corruption

ukazuje mieru systémovej degradácie

5️⃣ Load Pressure (Global)

celkový systémový tlak

môže spätne ovplyvňovať node load pressure

🔁 Povolené Interakcie (explicitne schválené)

✔️ vysoká corruption → znižuje synergy
✔️ vysoká harmony → zvyšuje synergy
✔️ vysoký load pressure → zvyšuje corruption & znižuje harmony

__________________________________________________
IV. Network / Global Metrics

(Aggregated View Layer)

🔹 3. Network / Global Metrics (Derived)

Tieto NIE SÚ nové metriky, iba agregácie:

Global Metric	Derived From
networkSynergy	avg(node.synergy)
harmonyFlow	avg(node.harmony)
networkStress	avg(node.loadPressure)
corruptionLevel	avg(node.corruption)
loadPressure	max / weighted avg
___________________________________________
V. Cross-Metric Rules (OFFICIAL)

Tieto pravidlá môžu byť implementované neskôr, ale významovo už platia:

vysoká corruption → znižuje synergy

vysoká harmony → zvyšuje synergy

vysoký loadPressure:
zvyšuje corruption
znižuje harmony a stability

4. Interaction Rules (už existovali – teraz oficiálne)

high corruption ↓ synergy

high harmony ↑ synergy

high loadPressure ↑ corruption ↓ harmony

_______________________________________________
🎛 K hodnoty pre každú metriku (raw → normalized)

Použijeme saturáciu:

norm(x,K)=1−e−x/K

K = „koľko je veľa“ (polovica pocitu sa deje zhruba okolo K, ťažisko krivky je tam).

Odporúčané K (v1)

Predpoklad: raw metriky rastú s pripojeniami / aktivitou a môžu ísť nad 100.

Metrika	Charakter	K (default)	Prečo
synergy	pomalé budovanie	80	nech synergy nie je „zadarmo“ po pár linkoch
harmony	stredná citlivosť	60	citlivá, ale nie prehnane
stability	pomalá, robustná	90	stabilita má byť „ťažká“ na rozbitie aj na vybudovanie
corruption	rýchlo eskaluje	40	korupcia je agresívna, keď sa rozbehne
loadPressure	veľmi citlivá	30	tlak systému nech cítiš skoro, je to „warning lamp“
Mikro pravidlo (super praktické)

K menšie = metrika sa rýchlo nasýti (prudko reaguje)

K väčšie = metrika sa nasýti pomaly (dlho buduješ)

🔁 Interakčné rovnice (corruption ↔ harmony + ďalšie)

Tu je môj návrh: urobíme jedno spoločné “interaction kernel” a z neho odvodené efekty.
Aby si nemal 50 ad-hoc hackov, ale jednu logickú „fyziku sveta“.

Základný princíp: všetko sa deje cez “gates”

Najprv normalizuj:

H = norm(harmonyRaw, K_H)        // 0..1
S = norm(synergyRaw, K_SY)       // 0..1
T = norm(stabilityRaw, K_ST)     // 0..1
C = norm(corruptionRaw, K_C)     // 0..1
L = norm(loadRaw, K_L)           // 0..1


A potom urob gates:

1) “Fragility gate” (kedy je systém zraniteľný)

Korupcia sa šíri viac, keď:

je nízka stabilita

je vysoký loadPressure

vulnerability = clamp01( (1 - T) * (0.6 + 0.4*L) );

2) “Coherence gate” (kedy harmony reálne pomáha)

Harmony pomáha viac, keď:

je aspoň trochu stabilita

nie je extrémny load

coherence = clamp01( T * (1 - 0.7*L) );


Toto sú dve najdôležitejšie páky. Zvyšok je z nich.

✅ Core rovnice (v1)
A) Corruption eats Harmony (korupcia žerie harmóniu)
dH = +aH * coherence
     - bH * C * (0.5 + 0.5*vulnerability);


aH napr. 0.02 * dt

bH napr. 0.05 * dt

Interpretácia:

Harmony sa regeneruje, ale len keď je systém “coherent”

Corruption ju zožiera, hlavne keď je systém zraniteľný

B) Harmony suppresses Corruption (harmónia tlmí korupciu)
dC = +aC * vulnerability
     - bC * H * coherence;


aC napr. 0.03 * dt

bC napr. 0.04 * dt

Interpretácia:

Korupcia rastie, keď je systém zraniteľný

Harmony ju vie tlmiť, ale len ak má “kde sa oprieť” (coherence)

🔁 Ostatné interakcie (logicky krásne a užitočné)
C) LoadPressure increases Corruption (tlak živí korupciu)
dC += +kLC * L * (0.4 + 0.6*(1 - T));


Korupcia rastie z loadu viac, keď je nízka stabilita.

D) High Harmony increases Synergy (harmónia zvyšuje synergickosť)
dS = +kHS * H * coherence
     - kCS * C * vulnerability;


Synergy rastie, keď je Harmony + koherencia, a padá, keď dominuje korupcia.

E) Corruption erodes Stability (korupcia narušuje stabilitu)
dT = +kHT * H * 0.5
     - kCT * C * (0.3 + 0.7*vulnerability);


Stabilita sa dá „liečiť“ harmóniou (pomaly), ale korupcia ju vie rozleptať rýchlejšie.

🎚 Odporúčané koeficienty (v1 default)

Aby si to vedel hneď ladiť, dávam “starter pack”:

Koeficient	Hodnota
aH	0.020
bH	0.050
aC	0.030
bC	0.040
kLC	0.025
kHS	0.030
kCS	0.020
kHT	0.010
kCT	0.030

Použi * dt (deltaTime v sekundách) alebo fix tick.

🧠 Moje vylepšenie pre Atomu (voliteľné, ale veľmi dobré)
1) “Tipping point” pre corruption (zlomový bod)

Korupcia je najzaujímavejšia, keď má fázy:

pod prahom: latentná

nad prahom: šíri sa

Urob jednoduchý multiplier:

corruptionPhase = smoothstep(0.55, 0.75, C); // 0..1
C_aggression = 1 + 1.5 * corruptionPhase;


A potom používaj C * C_aggression v dC a v poškodeniach.

Výsledok:
vysoká korupcia sa správa “ako požiar” 🔥, nie ako lineárny slider.

2) “Harmony resonance” (synergy boost pri stabilnom systéme)

Harmony nech dáva synergy boost len keď je stabilita vysoká:

resonance = smoothstep(0.6, 0.9, T) * H;
dS += +0.02 * resonance;


To je extrémne “Atoma”: stabilita umožní harmónii rezonovať do synergy.


1️⃣ Delta Time (dt) – „koľko času prešlo“

Delta time je len číslo:

„koľko reálneho času ubehlo od posledného update“

Príklad:

60 FPS → dt ≈ 0.016 s

30 FPS → dt ≈ 0.033 s

lag → dt ≈ 0.1 s

Keď píšeš:

value += rate * dt;


➡️ hovoríš:

„Nezáleží, ako rýchlo beží hra, zmena za sekundu má byť rovnaká.“

✅ Výhoda

fyzikálne korektné

nezávislé od FPS

❌ Nevýhoda

pri veľkom dt (lag spike) sa môžu veci „prestreliť“

potrebuješ clamp / max dt

2️⃣ Fixed Tick – „srdcový rytmus systému“

Fixed tick znamená:

systém sa updatne vždy po rovnakom časovom kroku

Príklad:

10 Hz → každých 100 ms

5 Hz → každých 200 ms

Pseudo:

ACC += realDt;
while (ACC >= FIXED_DT) {
  updateMetrics(FIXED_DT);
  ACC -= FIXED_DT;
}

🧠 Mentálny model

render môže bežať 144 FPS

metriky bijú ako srdce: bum… bum… bum…

✅ Výhody

extrémna stabilita

koeficienty sa nikdy nemenia

ideálne pre systémové metriky

❌ Nevýhody

nie úplne „plynulé“, ale to nám nevadí

mierne oneskorenie (100–200 ms)

➡️ Pre metriky je to výhra, nie problém.

3️⃣ Event-Driven – „svet reaguje, keď sa niečo stane“

Event-driven znamená:

metriky sa menia okamžite pri udalostiach

Príklady:

node sa pripojí → +loadPressure

link sa rozpadne → −synergy

corruption event → +corruption spike

onLinkCreated(node) {
  node.metrics.loadPressure += 5;

  
🧠 IDEÁLNA KOMBINÁCIA PRE ATOMU (môj verdikt)

Event-driven impulzy + Fixed Relax Tick

To je presne to, čo si intuitívne navrhol ❤️

🧬 Ako to vyzerá v praxi
🔹 1. Event-Driven (impulzy)

okamžité zmeny raw metrík

skoky, špičky, reakcie

onNodeLinked() {
  loadPressure += 8;
  synergy += 4;
}

🔹 2. Relax Tick (stabilizácia)

Beží napr. 5–10× za sekundu:

updateMetrics(FIXED_DT) {
  applyInteractions(FIXED_DT);
  relaxTowardsBaseline(FIXED_DT);
}


Relax robí:

tlmenie extrémov

návrat k rovnováhe

pomalé zmeny (harmony, stability)

4️⃣ Prečo je to šetrné na výkon (aj pri 50+ nodes)
❗ Kritický fakt

Metriky:

nemusia bežať per frame

nemusia bežať pre každý shader

nemusia reagovať na každý pixel

Ak máš:

50 nodes

relax tick 10 Hz

➡️ robíš 500 update krokov za sekundu
To je nič.

Aj 200 nodes × 10 Hz = 2000 jednoduchých výpočtov
JS sa ani nezapotí 💨

5️⃣ Ako udržať koeficienty stabilné pri 50 nodes
🔑 Zlaté pravidlo

Koeficienty vždy vyjadrujú „zmenu za sekundu“

Preto:

dC = rate * dt;


Nie:

dC = rate; // ❌ FPS dependent

🔹 Odporúčané FIXED_DT
Typ	Hodnota	Použitie
Relax tick	0.1 s	default
Jemnejší	0.05 s	citlivé systémy
Hrubší	0.2 s	pomalé, „organické“

👉 Ja by som začal 0.1 s (10 Hz).

6️⃣ Bezpečnostné poistky (odporúčam)
A) Clamp na delta
dt = Math.min(dt, 0.25);

B) Clamp na raw metriky (len proti záporným)
metric = Math.max(metric, 0);