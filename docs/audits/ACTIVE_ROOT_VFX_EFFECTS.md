# ACTIVE ROOT VFX EFFECTS

Prehlad root-level VFX efektov v aktualnej codebase.

Scope:
- iba root `.js` subory z aktualnej codebase
- bez `LEGACY/` a bez `legacy/`
- bez node base vizualov
- bez `LinkRendererConduit` pipeline a bez link-family efektov
- bez bridge / patch / adapter-only suborov, ktore same nic nevykresluju
- bez cisto color/material-only vrstiev, ktore nepridavaju samostatny efektovy objekt alebo VFX objekt

Splitting pravidlo:
- `DIRECT_MESH_GEOMETRY_EMITTER` = system priamo vytvara alebo spravuje viditelne `Mesh`, `Points`, `Line`, `Group`, `InstancedMesh`, overlay plane alebo iny viditelny render payload
- `VFX_ORCHESTRATOR` = system hlavne koordinuje, pocita alebo moduluje ine VFX vetvy; sam nie je hlavny producent viditelnej geometrie

Status legenda:
- `active` = system je zapojeny v aktualnom runtime a ma viditelny output
- `conditional` = system je zapojeny, ale viditelnost zavisi od stavu, thresholdu alebo mapy
- `dormant` = system je pritomny, ale nie je momentalne bootnuty, alebo je runtime vetva vypnuta

Lane legenda:
- `visual-scheduler`
- `frame-scheduler`
- `environment-domain`
- `overlay`
- `main-loop`
- `map-bootstrap`
- `internal`

Poznamka:
- `Wiring` hovori, kde alebo cez co je system zapojeny do runtime
- `Events` hovori, ktore eventy alebo trigger menia jeho stav; ak exact event nebol overeny, je to napisane priamo

## DIRECT_MESH_GEOMETRY_EMITTER

### Cascade A Resonance

- **PHASE5_CascadeVisuals.js** - Kresli expanding ringy, ripple linie a dalsie cascade propagacne vrstvy vo world-space.
  - Status: active | Owner: main.js / Phase 5 cascade visual setup | Lane: visual-scheduler | Events: `cascade.start`, `cascade.hop`, `cascade.end`

- **CascadeParticleSystem_Session120.js** - GPU particle system pre cascade bursty, konfliktny tok a trailove stopy.
  - Status: active | Owner: main.js / cascade particle setup | Lane: visual-scheduler | Events: `cascade` event bridge, `onLinkCreated`, `onLinkUpdated`, `onLinkDestroyed`

- **CascadeBurstVisual_Session147.js** - Robi velky cascade burst shell, radialne luce, shockwave ringy a jadrove spark efekty.
  - Status: active | Owner: main.js / semantic-bus burst consumer | Lane: visual-scheduler | Events: `cascade.start`, peak burst momenty cascade vetvy

- **CascadeWaveParticles.js** - Drzi wave-front a doplnkove particle rodiny pre cascade vlny a ich dozvuky.
  - Status: active | Owner: cascade-wave subsystem | Lane: visual-scheduler | Events: `wave.burst.lifecycle`, `wave.packet.spawn`, cascade wave propagation state

- **ResonanceCascadeVisualization_Session117B.js** - Vizualizuje radialne a sietou sa siriace resonance/cascade impulzy ako bloom a ripple vrstvu.
  - Status: active | Owner: main.js / resonance cascade visual setup | Lane: visual-scheduler | Events: `cascade.start`, `cascade.hop`, `cascade.end`

- **CascadeResonanceWaveVisualization_Session146.js** - Vytvara subtilne rezonancne vlny medzi harmonickymi hubmi a cascade vetvami.
  - Status: active | Owner: main.js / harmonic cascade dependency bundle | Lane: visual-scheduler | Events: `cascade.start`, `cascade.hop`, active harmonic-cascade resonance

- **ResonanceEchoTrailSystem.js** - Zanechava staticke echo imprinty po wave burstoch a composite resonance udalostiach.
  - Status: active | Owner: main.js / resonance echo trail setup | Lane: visual-scheduler | Events: `wave.burst.lifecycle`, `wave.packet.spawn`

- **ResonanceRuptureVisualSystem_Session133.js** - Vizualizuje standing-wave kolaps, rupture bursty, stresove pasma a doznievajuce scars.
  - Status: conditional | Owner: main.js / rupture visual tick | Lane: visual-scheduler | Events: standing-wave trap stress, rupture threshold crossing

### Waves, Traps A Interference

- **StandingWaveVisualRenderer_Session131.js** - Renderuje standing-wave zony, antinode glowy a trap-like vlnove vzory.
  - Status: conditional | Owner: main.js / standing-wave renderer | Lane: visual-scheduler | Events: standing-wave trap activation, waveField.standing

- **WaveInterferencePatternSystem_Session132.js** - Kresli constructive a destructive interference clustre ako mesh overlay patterny.
  - Status: active | Owner: main.js / interference visual setup | Lane: visual-scheduler | Events: reflection-wave collisions, constructive/destructive overlap

- **WaveParticleEmitter_v1.js** - Emituje world-space particle rodiny pre constructive, destructive a standing-wave stavy.
  - Status: active | Owner: main.js / wave particle emitter | Lane: visual-scheduler | Events: constructiveThreshold, destructiveThreshold, standingWaveThreshold

- **EchoRippleSystem_Session125.js** - Generuje echo ripples, ktore sa siriu cez siet ako dozvuk rezonancnych a cascade impulzov.
  - Status: active | Owner: main.js / ripple visual setup | Lane: visual-scheduler | Events: `wave.burst.lifecycle`, `wave.packet.spawn`, `loadPressureSpawn`

- **HarmonicInfluencePropagationSystem_Session127.js** - Vizualizuje sirenie harmonickeho vplyvu cez field meshe a spojovacie beam vrstvy.
  - Status: active | Owner: main.js / harmonic influence propagation | Lane: visual-scheduler | Events: harmonic influence update, propagation state refresh

### Harmony, Healing A Hub Field

- **HarmonicHubAuraSystem_Session126.js** - Stavia zdielane resonance fieldy okolo harmonickych hubov ako priestorovu auricku vrstvu.
  - Status: conditional | Owner: main.js / harmonic hub aura setup | Lane: visual-scheduler | Events: hub with `2+` links, harmony above corruption bias threshold

- **HarmonicNodeResonanceHalos.js** - Pridava pulzujuce halo obalky okolo harmonickych hub nodov.
  - Status: conditional | Owner: main.js / node halo system | Lane: visual-scheduler | Events: `activeLinkCount >= 2`, `hubSynchronizationStrength > 0`

- **HarmonicHealingVisualSystem_Session134.js** - Robi healing waves a opravne vizualne signaly pri harmonickom lieceni siete.
  - Status: dormant | Owner: main.js / harmonic healing bootstrap | Lane: visual-scheduler | Events: healing state, global harmony recovery; bootstrap vetva sa momentalne nespusta

- **HealingParticleSystem_Session136.js** - Sype healing trails a scar sparkles pre recovery a repair feedback.
  - Status: dormant | Owner: HarmonicHealingVisualSystem_Session134.js | Lane: visual-scheduler | Events: healing wave, scar dissipation; setup vetva je momentalne nebootnuta

- **HarmonicRecoveryVisualSystem_Session138.js** - Zobrazuje recovery vlny, re-stitch beamy a navrat coherence po rupture udalostiach.
  - Status: dormant | Owner: main.js / harmonic recovery system | Lane: visual-scheduler | Events: `link.harmony.high`, `link.harmony.mid`; scheduler hook nie je potvrdeny

### Synergy A Topologia

- **SynergyCascadeVisualizer.js** - Vizualizuje synergeticke chain reakcie ako wave fronty, ripple ringy a flow particles.
  - Status: active | Owner: main.js / synergy cascade visual consumer | Lane: visual-scheduler | Events: cascade / chain-reaction eventy zo semantic busu

- **SynergyHighwayVisuals3D_1_0.js** - Stavia 3D ribbon a tube highwaye medzi klastrami kategorii podla synergy toku.
  - Status: active | Owner: main.js / synergy highway module | Lane: visual-scheduler | Events: highway data refresh, route aggregation zmeny

- **TopologyBiasVisualizationLayer.js** - Kresli bias vector fieldy a coarse flow cells pre dlhotrvajuce topology learning.
  - Status: conditional | Owner: main.js / topology-bias visual layer | Lane: visual-scheduler | Events: topology learning readiness, influence activation

### Corruption A Conflict

- **CorruptionVisualFX_v1.js** - Emituje corruption particle vrstvu a lokalne rozpadove vizualy naviazane na corruption stav.
  - Status: active | Owner: main.js / corruption visual system | Lane: visual-scheduler | Events: corruption threshold crossing, corruption state update

- **TIER4_CorruptionFeedbackVisuals_v1.js** - Pridava vyssiu corruption feedback vrstvu pre seed, warning a restoration momenty.
  - Status: conditional | Owner: corruption feedback pipeline | Lane: visual-scheduler | Events: link create/destroy, corruption seed, warning, restoration moments

- **InterdimensionalConflictVisualizer.js** - Robi organicke portal beams, rift disky a residue efekty pri konflikte medzi harmonic hubmi.
  - Status: conditional | Owner: setupInterdimensionalConflictIntegration() | Lane: visual-scheduler | Events: conflict detection, escalation, explosion, residue

### Ritual, Consciousness, Glyph A Colony

- **TemporalEventEffects.js** - Generuje epoch, aeon, hologram a aurora overlay vrstvy pre temporal udalosti.
  - Status: active | Owner: CoreMetricsOverlay | Lane: overlay | Events: `time.epoch.changed`, `time.aeon.changed`, `global.harmony.high`, `global.synergy.high`

- **AIConsciousnessLayer.js** - Stavia globalnu consciousness vrstvu zo shellov, thread lines, choir lines a witness pointov.
  - Status: active | Owner: main.js / consciousness layer bootstrap | Lane: visual-scheduler | Events: consciousness state update, signature state momenty, thought-storm mood update

- **NeuralConvergenceSingularity.js** - Vytvara singularitne jadro s orbital streams, tendrilmi, rift vrstvami a pulse ringmi.
  - Status: conditional | Owner: GlyphFusionZone.js | Lane: visual-scheduler | Events: glyph convergence, fusion singularity payload

- **GlyphFusionZone.js** - Sklada composite glyph zony pri convergence a pridava synteticke shell, edge a blade vrstvy.
  - Status: conditional | Owner: LinkSemanticPictogramSystem_WithFusion | Lane: visual-scheduler | Events: glyph convergence, convergence threshold, fusion-zone activation

- **ColonyVFXManager.js** - Spravuje colony jadria, growth ringy, halo sigily, beamy a colony particle vrstvy.
  - Status: active | Owner: SafeColonyExpansion2 | Lane: environment-domain | Events: `colony.birth`, `colony.growth`, `colony.merge`, `colony.split`, `colony.transformation`

### Environment, Atmosfera A Screen-Space

- **_SafeWorldFXPack.js** - Pridava world breathing, rift waves, aurora horizonty, distortion vrstvy a dalsie ambient world VFX.
  - Status: active | Owner: EnvironmentDomainController | Lane: environment-domain | Events: world-state update tick, metric bias signals, periodic world FX cadence

- **_AmbientEntityManager.js** - Spawnuje ghost orbs, spectres, swarms, phantoms a wisps ako ambient entity VFX.
  - Status: active | Owner: EnvironmentDomainController | Lane: environment-domain | Events: weather inputs, legendary inputs, world-event inputs, spawn chance tick

- **EnvironmentalHazards.js** - Generuje electrical storms, gravitational anomalies a chrono-bloom hazard vizualy.
  - Status: conditional | Owner: EnvironmentDomainController | Lane: environment-domain | Events: hazard system enable, fractal mode demo branch, hazard event activation

- **_SafeAIWeatherPack.js** - Stavia neinvazivne weather pasma, haze a atmosfericke bandy ako samostatnu pocasiovu VFX vetvu.
  - Status: dormant | Owner: EnvironmentDomainController | Lane: environment-domain | Events: weather state change, global/world bias; auto-trigger vetva je momentalne oslabena

- **SafeQuantumIllusionsPack1.js** - Pridava quantum hallucination pack s ghost afterimages, ribbons, veils, halos a world bends.
  - Status: dormant | Owner: EnvironmentDomainController / main.js | Lane: environment-domain | Events: quantum/dream state shift; `update()` vetva je runtime vypnuta

- **_EmergentThoughtStorms5_0.js** - Produkuje thought storm cores, orbitujuce symboly, arc lightning a ripple glow vrstvy.
  - Status: dormant | Owner: EnvironmentDomainController | Lane: environment-domain | Events: thought density, synergy, corruption, harmony thresholds; runtime deps chybaju

- **VisualUpgradeSuperpack.js** - Layeruje volumetricke lights, atmospheric veils, edge glows, distortion zony a dream particle geometriu.
  - Status: active | Owner: main.js / visual bootstrap | Lane: visual-scheduler | Events: visual init, applyFullUpgrade(), quality / enhancement refresh

- **CognitiveHorizonPlane.js** - Pridava referencny horizon plane s vlnami, scar vrstvami a crown-like priestorovym glowom.
  - Status: conditional | Owner: MapReferencePlaneFactory.js | Lane: map-bootstrap | Events: `initMapReferencePlane(...)`, world/map initialization

- **DreamDepthEffectManager.js** - Stavia rich dream overlay vrstvy pre vignette, focus, pulse a glaze efekt.
  - Status: active | Owner: CoreMetricsOverlay / main.js | Lane: overlay | Events: weather keys (`calm`, `pressure`, `resonance`, `stormBias`, `ascensionHaze`), pulse queue, world-event bias

- **SafeDreamDepthPack.js** - Pridava lightweight fallback dream overlay vrstvu so sacred ring, neural lace a dream motes.
  - Status: active | Owner: EnvironmentDomainController | Lane: overlay | Events: weather/world-event inputs, baseline overlay update tick

## VFX_ORCHESTRATOR

- **HarmonicCascadeAmplification_Session145.js** - VFX-centric orchestrator pre harmonic cascade vetvu, ktory spaja phase sync, pre-cascade hint a resonance wave vrstvy.
  - Status: active | Owner: main.js / harmonic cascade scheduler | Lane: frame-scheduler | Events: `cascade.start`, `cascade.hop`, phase sync / proximity thresholds

- **CascadingHarmonicResonanceAmplification.js** - Pocita vrstvene sirenie harmonickej rezonancie napriec topologiou a tvori datovy zaklad pre nadstavbove cascade vizualy.
  - Status: active | Owner: HarmonicCascadeAmplification_Session145.js | Lane: internal | Events: harmonic cascade update loop, layer strength refresh, secondary hub propagation

- **Phase8RitualVisualOrchestration.js** - Cisto vizualna ritualna orchestrace, ktora diriguje ceremonialne vrstvy nad existujucimi template efektmi.
  - Status: active | Owner: NetworkRituals_v1 / VisualTemplateRegistry | Lane: frame-scheduler | Events: `semantic.ritual.started`, `semantic.ritual.completed`, ritual phase transitions

- **CascadingRuptureSystem.js** - Orchestruje sirenie rupture stavu medzi regionmi a zapisuje vizualne payloady pre nadstavbove rupture vetvy.
  - Status: active | Owner: regional equilibrium / rupture pipeline | Lane: frame-scheduler | Events: `onCascadeStart`, `onCascadeHop`, `onCascadeComplete`, `onNodeCritical`
