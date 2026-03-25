Kde je skutočný problém

Nie je to jeden bug. Sú tam 3 vrstvy problému:

1. Chýba producer dát

VFX systémy veľa čítajú, ale málokto zapisuje.

Najkritickejšie chýbajúce / slabé dáta:

link.userData.cascadeIntensity
link.userData.flowState.intensity
node.userData.waveField
link.userData.waveField
prípadne burst/event bridge do wave vrstvy

To pekne sedí aj s auditom: fallbacky existujú, ale sú prázdne, lebo ich nikto neplní

2. Niektoré systémy bežia, ale čítajú nulu

To je ten “STARVED” stav:

thresholdy sú v poriadku
shader / particle systém môže byť v poriadku
ale amplitude, constructive, destructive, standing sú 0 alebo undefined

Čiže problém často nie je render, ale upstream data layer.

3. Niektoré systémy nie sú vôbec v update chain

To je druhý typ problému:

majú update()
možno aj event listener
ale nie sú v scheduleri alebo nemajú správne init/rebind napojenie
Je problém v LinkQualityCalculator?
Moja odpoveď:

Čiastočne áno, ale nie ako jediný root cause.

LinkQualityCalculator je dobrý kandidát na:

baseline výpočet cascadeIntensity
konflikt typ
základnú farbu / severity

Ale nie je to správne miesto pre celý wave layer.

Čo by mal riešiť LinkQualityCalculator
baseline “ako veľmi je link náchylný na cascade”
teda:
cascadeIntensity
možno cascadeConflictType
Čo by nemal riešiť
wave propagation fyziku
burst intent routing
temporal phase
particle cooldowny
semanticBus event orchestration

To patrí do separátneho bridge / infection / wave adapter systému.

Ako by som to rozdelil architektonicky
Vrstva A: Baseline link semantics

Sem patrí LinkQualityCalculator alebo nejaký LinkSemanticMetricsBridge.

Výstup:

link.userData.cascadeIntensity
link.userData.cascadeConflictType
Vrstva B: Temporal propagation

Sem patrí nový LinkCascadeInfectionSystem.

Výstup:

link.userData.cascadeInfection
dynamické prepísanie / modulácia cascadeIntensity
cascade.hop eventy
Vrstva C: Wave compatibility bridge

Sem patrí nový CascadeToWaveBridge_v1.

Výstup:

waveEngine.requestBurstIntent(...)
fallback link.userData.waveField
fallback node.userData.waveField
Vrstva D: VFX consumers

To už sú existujúce veci:

WaveParticleEmitter
CascadeParticleSystem
WaveShaderBridge
SynergyTravelingWaveFX
Čo dáta dnes najviac chýbajú

Toto je podľa mňa presný shortlist:

Kritické chýbajúce dáta
link.userData.cascadeIntensity
link.userData.flowState.intensity
link.userData.waveField.amplitude
link.userData.waveField.constructive
link.userData.waveField.destructive
link.userData.waveField.standing
link.userData.waveField.phase
Kritické chýbajúce väzby
cascade.hop → wave burst
infection state → visual consumer fields
world switch rebind pre event subscribers
scheduler registration pre orphan systems
Čo by som dal spraviť GLM-5 v OpenClaw ako prvé

Nie patch hneď. Najprv nech spraví diagnostický rozklad.
Inak ti začne generovať opravy do zlej vrstvy.

TODO LIST PRE GLM-5
Fáza 1: Zistiť writerov a authority
Krok 1

Nájsť všetkých writerov pre tieto fields:

link.userData.cascadeIntensity
link.userData.flowState
link.userData.waveField
node.userData.waveField

Výstup:

file
function
scheduler lane
write frequency
či je writer aktívny alebo len teoretický
Krok 2

Nájsť všetkých readerov tých istých fields.

Výstup:

file
exact fields
thresholdy
fallback path
čo sa stane pri undefined
Krok 3

Spraviť mapu:

writer → field → reader

A označiť:

no writer
multiple writers
stale writer
wrong lane
Fáza 2: Overiť scheduler a lifecycle
Krok 4

Pre každý relevantný systém overiť:

init existuje?
register vo FrameScheduler existuje?
world-switch rebind existuje?
dispose existuje?

Scope:

LinkCascadeInfectionSystem
CascadeParticleSystem
CascadeResonanceWaveVisualization
WaveParticleEmitter
WaveShaderBridge
SynergyTravelingWaveFX
WaveBurstRouter
Krok 5

Zoradiť systémy podľa stavu:

ACTIVE
PASSIVE
EVENT_ONLY
ORPHAN
STARVED
Fáza 3: Rozhodnúť authority model
Krok 6

Rozhodnúť, kto bude single writer pre cascadeIntensity.

Moje odporúčanie:

baseline writer = LinkQualityCalculator alebo LinkSemanticMetricsBridge
runtime override/modulation = LinkCascadeInfectionSystem

Nie opačne.

Krok 7

Rozhodnúť, kto bude single writer pre waveField.

Moje odporúčanie:

ak existuje reálny wave engine, on
ak neexistuje / je broken:
CascadeToWaveBridge_v1 ako fallback writer
Fáza 4: Minimal viable repair plan
Krok 8

Navrhnúť minimálny patch plan v poradí:

stabilize cascadeIntensity
expose infection → cascadeIntensity
expose cascade → waveField fallback
connect cascade.hop → wave burst
až potom znižovať thresholdy
Krok 9

Explicitne zakázať GLM-5:

nema refaktorovať LinkRendererConduit
nema meniť shader code
nema meniť viac systémov naraz bez authority mapy
Čo by som od GLM-5 chcel ako výstup

Nie diff. Nie patch hneď.

Chcel by som 4 sekcie:

1. Data authority table

| field | primary writer | secondary writer | readers | status |

2. Missing data table

| field | expected writer | real writer | current runtime risk |

3. Scheduler table

| system | init | registered | rebind | dispose | state |

4. Repair order

Presne 5-7 krokov, od najnižšieho rizika po vyššie.

Moje odporúčanie na prvú implementačnú vlnu

Po tomto rozbore by som išiel takto:

potvrdiť single writer pre cascadeIntensity
potvrdiť infection modulation nad tým writerom
spraviť CascadeToWaveBridge_v1
fallback waveField writer
až potom riešiť WaveParticleEmitter thresholds
ghost systems až nakoniec
Najdôležitejší záver

Áno, problém je aj v link calculator vrstve, ale len v tom zmysle, že tam chýba stabilný baseline producer pre cascade dáta.

Skutočný väčší problém je:

nemáš uzavretý data loop:
metrics → cascadeIntensity → infection → waveField → VFX consumer

Dnes máš kúsky. Nemáš potrubie.