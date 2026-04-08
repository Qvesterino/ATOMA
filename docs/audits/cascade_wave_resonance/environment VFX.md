Static audit je hotový. Nižšie je zoznam world/environment/background/field VFX systémov, ktoré som našiel, s aktuálnym runtime stavom a triggerom.

Scope
Zahrnul som:

world-space environment efekty
background/reference plane efekty
field/zone/world particle efekty
map-specific environment visuals
Nezahrnul som:

čisto UI/overlay systémy
čisto link-material systémy bez world/field prejavu
data-only utility adaptéry
Active

EnvironmentDomainController
Stav: active
Trigger: inicializuje sa pri boote a znovu pri world rebuild-e; orchestruje environment domain systémy cez scheduler.
Evidence: main.js:4813, main.js:4834, main.js:6289, main.js:6310, EnvironmentDomainController.js:15
Poznámka: toto je koordinátor, nie samotný vizuálny efekt.

SafeWorldFXPack
Stav: active, ale metrics-degraded
Trigger: beží každý tick cez environment domain; robí periodické world efekty ako dimensional shifts, rift waves, quantum rifts, sigma glitches, aurora/world breathing.
Evidence: EnvironmentDomainController.js:45, EnvironmentDomainController.js:94, _SafeWorldFXPack.js:316, _SafeWorldFXPack.js:374, _SafeWorldFXPack.js:486, _SafeWorldFXPack.js:794, _SafeWorldFXPack.js:903
Trigger detail: časové intervaly bežia stále; synergy/legendary vetvy sú oslabené, lebo environment domain volá len update(dt) a neposúva mu nodes/linkingSystem/legendaryPack.

AmbientEntityManager
Stav: active
Trigger: beží cez environment domain; spawn pokusy robí priebežne s náhodnou šancou a zosilňuje ich aktívne počasie, legendary nodes alebo world events.
Evidence: EnvironmentDomainController.js:60, EnvironmentDomainController.js:73, _AmbientEntityManager.js:101, _AmbientEntityManager.js:128, _AmbientEntityManager.js:156
Vizuál: ghost orbs, spectres, swarms, phantoms, wisps.

EnvironmentalHazards
Stav: active, ale efekt je mode-conditional
Trigger: systém je vytvorený v environment domain; demo hazards sa automaticky spawnujú len vo fractal mode.
Evidence: EnvironmentDomainController.js:89, main.js:6311, EnvironmentalHazards.js:18, EnvironmentalHazards.js:115, EnvironmentalHazards.js:221
Vizuál: electrical storms, gravitational anomalies.

WaveParticleEmitter_v1
Stav: active, efekt conditional
Trigger: initne sa a updatuje každý frame; emituje len keď wave field prekročí constructive/destructive/standing thresholds.
Evidence: main.js:8553, main.js:8569, WaveParticleEmitter_v1.js:706, WaveParticleEmitter_v1.js:729, WaveParticleEmitter_v1.js:791
Vizuál: world-space synergy/destruction/standing-wave particles, nie link mesh.

CascadeParticleSystem_Session120
Stav: active
Trigger: boot setup + visual scheduler update; spawny prichádzajú cez cascade event bridge a cascade hop-y.
Evidence: main.js:4930, main.js:9192, main.js:3978
Vizuál: cascade particle bursts/trails v priestore.

ResonanceCascadeVisualization_Session117B
Stav: active
Trigger: boot setup + visual scheduler; reaguje na cascade.start, cascade.hop, cascade.end semantic eventy.
Evidence: main.js:4936, main.js:9285, main.js:3999, ResonanceCascadeVisualization_Session117B.js:124
Vizuál: radial/link-propagating cascade influence, node illumination, ripple-like cascade state.

PHASE5_CascadePropagationVisuals
Stav: active
Trigger: inicializovaný v Phase 5 wiring-u, updatuje sa cez visual scheduler, reaguje na cascade eventy nad activation threshold.
Evidence: main.js:8093, main.js:8121, main.js:3775, PHASE5_CascadePropagationVisuals_v1.js:84, PHASE5_CascadePropagationVisuals_v1.js:102
Vizuál: expanding cascade rings vo world-space.

PHASE5_CascadeVisualizationBridge
Stav: active
Trigger: bridge sa inicializuje a updatuje cez scheduler; číta corruption/threat/harmony cascade eventy a feeduje propagation visuals.
Evidence: main.js:8134, main.js:8149, main.js:3777, PHASE5_CascadeVisualizationBridge_v1.js:61, PHASE5_CascadeVisualizationBridge_v1.js:108
Poznámka: je to bridge, ale priamo drží cascade queue a riadi, čo sa vykreslí.

ResonanceRuptureVisualSystem_Session133
Stav: active, efekt conditional
Trigger: inicializuje sa a má vlastný visual tick; vizuály vznikajú len keď standing-wave trap systém akumuluje stress/rupture stav.
Evidence: main.js:4990, main.js:11771, main.js:3885
Vizuál: stress zones, rupture bursts, propagation scars, halo destabilization.

StandingWaveVisualRenderer_Session131
Stav: active, efekt conditional
Trigger: renderer sa normálne setupne a updatuje každý frame; viditeľný efekt sa objaví len keď existujú aktívne standing-wave traps/patterns.
Evidence: main.js:4972, main.js:11605, main.js:4096, StandingWaveVisualRenderer_Session131.js:219
Vizuál: trap zones, antinode glows, standing-wave zones.
Poznámka: je link-adjacent, ale produkuje aj reálne world-space trap/zone prejavy, preto som ho nechal v audite.

HarmonicHubAuraSystem_Session126
Stav: active, efekt conditional
Trigger: beží runtime update; shared resonance field sa objaví len pre harmonic hubs s 2+ linkami a harmony > corruption nad threshold.
Evidence: main.js:5073, main.js:12578, HarmonicHubAuraSystem_Session126.js:72, HarmonicHubAuraSystem_Session126.js:200, HarmonicHubAuraSystem_Session126.js:279
Vizuál: shared hub resonance fields v priestore.

HarmonicPhaseSynchronization_Session146
Stav: active, efekt conditional
Trigger: init + registered tick; synchronizačný efekt beží len ak existujú harmonické huby/cascade pairs na zosynchronizovanie.
Evidence: main.js:5077, main.js:12791, main.js:9596
Vizuál: temporal phase-lock pre harmonic field vetvu, nie samostatné mesh objekty.

HarmonicNodeResonanceHalos
Stav: active, efekt conditional
Trigger: setup + vlastný tick; halá sa aktivujú pre harmonic hub nodes pri activeLinkCount ≥ 2 a hubSynchronizationStrength > 0.
Evidence: main.js:5079, main.js:9414, main.js:9602, HarmonicNodeResonanceHalos.js:6
Vizuál: node-adjacent resonance halo field envelopes.

DreamDepthPack
Stav: active
Trigger: setupnutý v boot sekvencii a updatuje sa cez visual scheduler; baseline DOF/vignette je stále, pulse-y sa spúšťajú pri synergy spike, legendary eventoch a vybraných world eventoch.
Evidence: main.js:4838, main.js:3786, main.js:10684, SafeDreamDepthPack.js:423, SafeDreamDepthPack.js:510, SafeDreamDepthPack.js:524
Vizuál: screen-space dream depth / vignette / pulse / glaze.

DreamDepthEffectManager
Stav: active
Trigger: setupnutý a updatuje sa cez visual scheduler.
Evidence: main.js:3787, main.js:10686, DreamDepthEffectManager.js:246
Vizuál: vignette/focus/pulse/glaze overlay layers.
Riziko: konštruktor call v main.js:10686 nepasuje presne na signatúru v DreamDepthEffectManager.js:10, takže je to active with wiring risk.

Conditional / Map-Bound

SigmaRiftChamber, DreamDesert, QuantumIsland, FractalValley, MemoryLane
Stav: conditional
Trigger: vytvoria sa len keď currentMode zodpovedá danej mape/world-u.
Evidence: main.js:6318, main.js:6331, main.js:6338, main.js:6345

## Art Direction Sheet

### Core visual language
- civilization bloom
- living lattice
- sacred growth ring
- pulse crown
- coherence halo
- organismic architecture

### Colors
- ATOMA cyan: `#6DEAFF`
- growth mint: `#77F7DB`
- ritual white: `#F7FBFF`
- quantum violet: `#D07BFF`
- breach rose: `#FF73CF`
- void deep: `#05131A`

### Geometry palette
- `SphereGeometry` for core / nucleus forms
- `TorusGeometry` for growth rings
- `RingGeometry` for status halos and sigils
- `PlaneGeometry` for soft atmosphere sheets
- `Points` / small `SphereGeometry` for colony particles
- `Line` / `BufferGeometry` for coherence arcs and colony bridges

### Mood mapping
- `DEFAULT`: čistý cyan-white growth, jemný halo ring
- `LEGENDARY`: crown + stronger core, viac white contrastu
- `QUANTUM`: violet edges, trochu priehľadnejšie ringy
- `SIGMA`: rose/violet crack accents, ostrejší motion

> Subtílne mood states v registry by mali meniť len bias, nie celý vizuál.

### Motion signature
- colony = breathing
- merge = resonance
- split = cracking + new core
- growth = orbit expansion
- legendary = crown ignition

Vizuál: map-specific background/environment geometra a world ambience.

CognitiveHorizonPlane
Stav: conditional
Trigger: vzniká cez MapReferencePlaneFactory len v mapách, ktoré volajú initMapReferencePlane(...).
Evidence: MapReferencePlaneFactory.js:25, MapReferencePlaneFactory.js:76, DreamDesert.js:18, FractalValley.js:20, QuantumIsland.js:19
Vizuál: dream/quantum/logic/void reference plane pod scénou.

CascadeResonanceWaveVisualization_Session146
Stav: conditional
Trigger: setup sa podarí len ak sú pripravené harmonicCascadeAmplification, harmonicHubAuraSystem a linkResonanceSystem; potom dostáva visual tick.
Evidence: main.js:9243, main.js:3994, CascadeResonanceWaveVisualization_Session146.js:5
Vizuál: ghost-level temporal resonance wave, extrémne subtílna.

RegionalEquilibriumFieldSystem
Stav: conditional
Trigger: setupne sa vždy, ale update vetva je guardovaná pomalým semantic tickom a vyžaduje harmonySystem aj ruptureSystem; bez nich zostáva ticho.
Evidence: main.js:5002, main.js:11926, main.js:9843, RegionalEquilibriumFieldSystem.js:188
Vizuál: ambient regional haze / territorial equilibrium fields.

Nonactive / Effectively Dormant In Current Wiring

SafeAIWeatherPack
Stav: nonactive v auto-trigger režime
Dôvod: environment domain ho síce vytvorí a tickuje, ale volá len update(dt) bez legendaryPack/linkingSystem/evolutionManager/worldEvents; jeho trigger logika potom počíta potential = 0, takže nové počasie sa normálne nespustí.
Evidence: EnvironmentDomainController.js:45, EnvironmentDomainController.js:94, _SafeAIWeatherPack.js:121, _SafeAIWeatherPack.js:147, _SafeAIWeatherPack.js:193
Poznámka: ak by bolo počasie spustené manuálne, update vetva by vizuály renderovala.

SafeQuantumIllusionsPack1
Stav: nonactive
Dôvod: je síce vytvorený v environment domain, ale jeho update() je natvrdo zablokovaný if (true) return;.
Evidence: EnvironmentDomainController.js:52, SafeQuantumIllusionsPack1.js:112
Vizuál: quantum hallucination pack je momentálne runtime vypnutý.

EmergentThoughtStorms5_0
Stav: nonactive v aktuálnom wiring-u
Dôvod: environment domain ho vytvorí, ale scheduler mu dáva len update(dt); systém pritom potrebuje aiNodes a linkingSystem, inak hneď vracia.
Evidence: EnvironmentDomainController.js:79, EnvironmentDomainController.js:94, _EmergentThoughtStorms5_0.js:167
Trigger, ak by bol správne wired: thought density, synergy, corruption alebo harmony threshold v lokálnom clustri.

HarmonicRecoveryVisualSystem_Session138
Stav: nonactive
Dôvod: systém sa inicializuje, ale v main.js som nenašiel žiadny scheduler/update hook, ktorý by mu volal update(...).
Evidence: main.js:4996, main.js:11849, HarmonicRecoveryVisualSystem_Session138.js:169

HarmonicHealingVisualSystem_Session134
Stav: nonactive
Dôvod: existuje setup metóda, ale bootstrap ju nevolá.
Evidence: main.js:11874
Trigger, ak by bol aktívny: global harmony nad threshold a vhodné linky pre healing waves.

HealingParticleSystem_Session136
Stav: nonactive
Dôvod: vizuálny scheduler hook existuje, ale objekt sa vytvorí len v setupHarmonicHealingSystem(), ktorá sa momentálne nevolá.
Evidence: main.js:4011, main.js:11889

Najdôležitejšie zistenia

StandingWaveVisualRenderer je active, nie dormant.
SafeAIWeatherPack je v aktuálnom wiring-u prakticky neaktívny, lebo nedostáva runtime dependency argumenty.
SafeQuantumIllusionsPack1 je explicitne runtime vypnutý.
EmergentThoughtStorms5_0 je vytvorený, ale kvôli chýbajúcim update argumentom efektívne nespúšťa stormy.
HarmonicHealing vetva (HarmonicHealingVisualSystem + HealingParticleSystem) sa vôbec nebootuje.
HarmonicRecoveryVisualSystem sa síce initne, ale neupdatuje sa.
Krátky prehľad počtov

active: 14
conditional/map-bound: 4
nonactive/effectively dormant in current wiring: 6