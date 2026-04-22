# ACTIVE ROOT VFX EFFECTS

Prehlad root-level VFX efektov v aktualnej codebase.

Scope tohto dokumentu:
- iba root `.js` subory z aktualnej codebase
- bez `LEGACY/` a bez `legacy/`
- bez node base vizualov
- bez `LinkRendererConduit` pipeline a bez link-family efektov
- bez bridge / patch / adapter-only suborov, ktore same nic nevykresluju
- bez cisto color/material-only vrstiev, ktore nepridavaju samostatny efektovy objekt alebo VFX vetvu

Poznamka:
- v tejto faze je to iba zoznam efektov a kratky jedno-vetovy popis
- runtime trigger, wiring a aktivacne podmienky sa budu doplnat az v dalsej faze

## VFX Orchestrace A Core Drivery

HarmonicCascadeAmplification_Session145.js - VFX-centric orchestrator pre harmonic cascade vetvu, ktory spaja phase sync, pre-cascade hint a resonance wave vrstvy.

CascadingHarmonicResonanceAmplification.js - Pocita vrstvene sirenie harmonickej rezonancie napriec topologiou a tvori datovy zaklad pre nadstavbove cascade vizualy.

Phase8RitualVisualOrchestration.js - Cisto vizualna ritualna orchestrace, ktora diriguje ceremonialne vrstvy nad existujucimi template efektmi.

## Cascade A Resonance

PHASE5_CascadeVisuals.js - Kresli expanding ringy, ripple linie a dalsie cascade propagacne vrstvy vo world-space.

CascadeParticleSystem_Session120.js - GPU particle system pre cascade bursty, konfliktny tok a trailove stopy.

CascadeBurstVisual_Session147.js - Robi velky cascade burst shell, radialne luce, shockwave ringy a jadrove spark efekty.

CascadeWaveParticles.js - Drzi wave-front a doplnkove particle rodiny pre cascade vlny a ich dozvuky.

ResonanceCascadeVisualization_Session117B.js - Vizualizuje radialne a sietou sa siriace resonance/cascade impulzy ako bloom a ripple vrstvu.

CascadeResonanceWaveVisualization_Session146.js - Vytvara subtilne rezonancne vlny medzi harmonickymi hubmi a cascade vetvami.

ResonanceEchoTrailSystem.js - Zanechava staticke echo imprinty po wave burstoch a composite resonance udalostiach.

ResonanceRuptureVisualSystem_Session133.js - Vizualizuje standing-wave kolaps, rupture bursty, stresove pasma a doznievajuce scars.

CascadingRuptureSystem.js - Zobrazuje postupujucu rupture energiu a spatial tearing, ked sa rozpad siri cez regiony siete.

## Waves, Traps A Interference

StandingWaveVisualRenderer_Session131.js - Renderuje standing-wave zony, antinode glowy a trap-like vlnove vzory.

WaveInterferencePatternSystem_Session132.js - Kresli constructive a destructive interference clustre ako mesh overlay patterny.

WaveParticleEmitter_v1.js - Emituje world-space particle rodiny pre constructive, destructive a standing-wave stavy.

EchoRippleSystem_Session125.js - Generuje echo ripples, ktore sa siriu cez siet ako dozvuk rezonancnych a cascade impulzov.

HarmonicInfluencePropagationSystem_Session127.js - Vizualizuje sirenie harmonickeho vplyvu cez field meshe a spojovacie beam vrstvy.

## Harmony, Healing A Hub Field

HarmonicHubAuraSystem_Session126.js - Stavia zdielane resonance fieldy okolo harmonickych hubov ako priestorovu auricku vrstvu.

HarmonicNodeResonanceHalos.js - Pridava pulzujuce halo obalky okolo harmonickych hub nodov.

HarmonicHealingVisualSystem_Session134.js - Robi healing waves a opravne vizualne signaly pri harmonickom lieceni siete.

HealingParticleSystem_Session136.js - Sype healing trails a scar sparkles pre recovery a repair feedback.

HarmonicRecoveryVisualSystem_Session138.js - Zobrazuje recovery vlny, re-stitch beamy a navrat coherence po rupture udalostiach.

## Synergy A Topologia

SynergyCascadeVisualizer.js - Vizualizuje synergeticke chain reakcie ako wave fronty, ripple ringy a flow particles.

SynergyHighwayVisuals3D_1_0.js - Stavia 3D ribbon a tube highwaye medzi klastrami kategorii podla synergy toku.

TopologyBiasVisualizationLayer.js - Kresli bias vector fieldy a coarse flow cells pre dlhotrvajuce topology learning.

## Corruption, Conflict A Stress

CorruptionVisualFX_v1.js - Emituje corruption particle vrstvu a lokalne rozpadove vizualy naviazane na corruption stav.

TIER4_CorruptionFeedbackVisuals_v1.js - Pridava vyssiu corruption feedback vrstvu pre seed, warning a restoration momenty.

InterdimensionalConflictVisualizer.js - Robi organicke portal beams, rift disky a residue efekty pri konflikte medzi harmonic hubmi.

## Ritual, Consciousness, Glyph A Colony

TemporalEventEffects.js - Generuje epoch, aeon, hologram a aurora overlay vrstvy pre temporal udalosti.

AIConsciousnessLayer.js - Stavia globalnu consciousness vrstvu zo shellov, thread lines, choir lines a witness pointov.

NeuralConvergenceSingularity.js - Vytvara singularitne jadro s orbital streams, tendrilmi, rift vrstvami a pulse ringmi.

GlyphFusionZone.js - Sklada composite glyph zony pri convergence a pridava synteticke shell, edge a blade vrstvy.

ColonyVFXManager.js - Spravuje colony jadria, growth ringy, halo sigily, beamy a colony particle vrstvy.

## Environment, Atmosfera A Screen-Space

_SafeWorldFXPack.js - Pridava world breathing, rift waves, aurora horizonty, distortion vrstvy a dalsie ambient world VFX.

_AmbientEntityManager.js - Spawnuje ghost orbs, spectres, swarms, phantoms a wisps ako ambient entity VFX.

EnvironmentalHazards.js - Generuje electrical storms, gravitational anomalies a chrono-bloom hazard vizualy.

_SafeAIWeatherPack.js - Stavia neinvazivne weather pasma, haze a atmosfericke bandy ako samostatnu pocasiovu VFX vetvu.

SafeQuantumIllusionsPack1.js - Pridava quantum hallucination pack s ghost afterimages, ribbons, veils, halos a world bends.

_EmergentThoughtStorms5_0.js - Produkuje thought storm cores, orbitujuce symboly, arc lightning a ripple glow vrstvy.

VisualUpgradeSuperpack.js - Layeruje volumetricke lights, atmospheric veils, edge glows, distortion zony a dream particle geometriu.

CognitiveHorizonPlane.js - Pridava referencny horizon plane s vlnami, scar vrstvami a crown-like priestorovym glowom.

DreamDepthEffectManager.js - Stavia rich dream overlay vrstvy pre vignette, focus, pulse a glaze efekt.

SafeDreamDepthPack.js - Pridava lightweight fallback dream overlay vrstvu so sacred ring, neural lace a dream motes.
