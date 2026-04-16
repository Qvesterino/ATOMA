# ACTIVE RUNTIME MATRIX

**Dátum:** 2026-04-16  
**Verzia:** 1.0  
**Scope:** aktívna codebase mimo `/legacy` a `/LEGACY`  
**Účel:** jednotný zdroj pravdy o runtime stave všetkých hlavných systémov ATOMA

---

## Legenda statusov

- **ACTIVE** - systém je plne zapojený do boot path a beží bez podmienok
- **CONDITIONAL** - systém je zapojený, ale jeho aktivácia závisí od špecifických podmienok
- **DISABLED INTENTIONALLY** - systém je k dispozícii, ale je vypnutý pre produktové rozhodnutie
- **ARCHIVE-CANDIDATE** - systém je zastaraný, redundantný, alebo bez jasného ownera; kandidát na archiváciu

---

## KATEGÓRIA 1: Environment Domain Core Systems

Vlastníctvo: `EnvironmentDomainController`  
Inicializácia: `EnvironmentDomainController._createSystems()`  
Registry: `ENVIRONMENT_VFX_REGISTRY.core`

| Systém ID | Role / Popis | Runtime Status | Spawn Conditions | Render Layer | Scheduler Layer |
|-----------|--------------|----------------|------------------|--------------|-----------------|
| **SafeWorldFXPack** | Foundational world ambience, breathing layers, haze, rifts, and macro background motion | **ACTIVE** | Global metrics (synergy, harmony, stability, corruption, loadPressure) | WORLD_BACKGROUND | visual |
| **SafeAIWeatherPack** | Weather-state atmosphere layer for fog, sky motion, and condition-driven world mood | **ACTIVE** | World weather candidate, link metrics, world events | WORLD_BACKGROUND | visual |
| **SafeQuantumIllusionsPack1** | Quantum-space distortion, illusion, and unreality overlays bound to the active world | **ACTIVE** | World event type active, link throughput, node metrics | WORLD_OVERLAY | visual |
| **AmbientEntityManager** | Ambient entities such as wisps, ghost orbs, and roaming spectral life | **ACTIVE** | World ambient active | WORLD_OVERLAY | visual |
| **EmergentThoughtStorms5_0** | Large-scale thought-storm phenomena that externalize AI mood as weather | **CONDITIONAL** | `recursiveGlyphMessaging.ready` + `semanticGlyphAI.ready` | WORLD_OVERLAY | visual |
| **SafeLegendaryWorldEvents** | High-impact world event presentation layer for rare environmental states and event reveals | **ACTIVE** | Legendary event potential high, event cooldown ready, event roll success | WORLD_OVERLAY | visual |
| **WorldPersonalityController** | Global world mood and personality modulation layer that shapes atmosphere over time | **ACTIVE** | Global harmony, loadPressure, stability, world personality aggregate ready | WORLD_OVERLAY | simulation |
| **MythicRitualController** | Mythic ritual world-event visuals that stage ceremonial, transcendent environment states | **ACTIVE** | Semantic ritual started, semantic ritual completed | WORLD_OVERLAY | simulation |
| **MetricReactiveWorldEvents** | Metric-driven world events that translate canonical runtime state into environmental spectacle | **ACTIVE** | Global metrics (synergy, harmony, stability, corruption, loadPressure) | WORLD_OVERLAY | visual |
| **SafeDreamDepthPack** | Low-cost dream-depth fallback layer for atmospheric depth, vignettes, and focus mood | **ACTIVE** | Weather active, world event active, focus target present | WORLD_OVERLAY | visual |
| **DreamDepthEffectManager** | Primary rich dream-depth atmosphere layer with focus, pulse, and depth-event styling | **ACTIVE** | Weather active, world event active, focus target present, depth pulse triggered | WORLD_OVERLAY | visual |
| **SafeColonyExpansion2** | Living colony ecosystem overlay that grows ambient civilization structures inside the world | **ACTIVE** | Colony cluster detected, link connectivity valid, world events/weather active | WORLD_OVERLAY | visual |
| **EnvironmentalHazards** | Hazard and anomaly layer for dangerous environmental zones, storms, fractures, and instability | **ACTIVE** | Global corruption high, loadPressure high, stability low/high | WORLD_OVERLAY | visual |

**Poznámky:**
- Všetky systémy v tejto kategórii sú vlastnené `EnvironmentDomainController`
- `EmergentThoughtStorms5_0` je jediný CONDITIONAL systém - vyžaduje externé závislosti
- Všetky ostatné sú ACTIVE bez podmienok

---

## KATEGÓRIA 2: Extended Systems (main.js owned)

Vlastníctvo: `main.js`  
Inicializácia: Rôzne setup metódy v `main.js`  
Registry: `ENVIRONMENT_VFX_REGISTRY.extended`

| Systém ID | Role / Popis | Runtime Status | Spawn Conditions | Render Layer | Scheduler Layer |
|-----------|--------------|----------------|------------------|--------------|-----------------|
| **WaveParticleEmitter_v1** | World-space particle field for wave interference, standing-wave ripples, and reactive burst motion | **ACTIVE** | Node metrics (synergy, harmony, stability, corruption, loadPressure) | WORLD_OVERLAY | visual |
| **ResonanceCascadeVisualization_Session117B** | Cascade and resonance propagation overlay for radial surges, blooms, and influence echoes | **ACTIVE** | Link created, global load pressure high | WORLD_OVERLAY | visual |
| **HarmonicHubAuraSystem_Session126** | Shared harmonic field layer around hub constellations and local resonance regions | **ACTIVE** | Hub harmony high/mid/low | WORLD_OVERLAY | visual |
| **CanonicalTemplate3_StressVisuals** | Global stress-pressure ambience affecting fog, color, lighting mood, and network tension atmosphere | **ACTIVE** | Global metric frame updated, node load pressure active | WORLD_OVERLAY | main-loop |
| **AIConsciousnessLayer** | Global cognitive atmosphere layer with thought threads, pulse traffic, and consciousness-field presence | **ACTIVE** | Link active, traffic intensity active, harmony/stability active, storms enabled | WORLD_OVERLAY | visual |
| **CognitiveHorizonPlane** | Map foundation plane that provides horizon language, ground mood, and deep-space environmental framing | **ACTIVE** | Map reference plane selected, focus target present, memory pressure active | MAP_FOUNDATION | visual |

**Poznámky:**
- Všetky systémy v tejto kategórii sú ACTIVE
- Väčšina reaguje na globálne alebo per-node metríky
- `CognitiveHorizonPlane` je vlastnený `MapReferencePlaneFactory`

---

## KATEGÓRIA 3: Support Systems

Vlastníctvo: Rôzne (EnvironmentDomainController, main.js, CoreMetricsOverlay)  
Registry: `ENVIRONMENT_VFX_REGISTRY.support`

| Systém ID | Role / Popis | Runtime Status | Spawn Conditions | Render Layer | Scheduler Layer |
|-----------|--------------|----------------|------------------|--------------|-----------------|
| **EnvironmentEventCoordinator** | Support coordinator that arbitrates event ownership and sequencing between environment systems | **ACTIVE** | Global metrics, semantic rituals | INTERNAL_SUPPORT | event-driven |
| **ColonyVFXManager** | Internal colony VFX payload builder responsible for colony halos, rings, particles, and transitions | **ACTIVE** | Colony birth/growth/merge/split/transformation, world events | WORLD_OVERLAY | visual-indirect |
| **SafeMetricsFX1_1** | Support polish layer that converts global metrics into lightweight visual modulation and feedback | **ACTIVE** | Node metric updated | NODE_SURFACE | event-driven |
| **TemporalEventEffects** | Temporal overlay effects used by the metrics/HUD layer rather than world-space environment rendering | **ACTIVE** | Global harmony/synergy high, time epoch/aeon changed | HUD_OVERLAY | hud-loop |
| **CinematicUpgrade** | Presentation-grade cinematic enhancement layer for premium framing, mood, and visual polish | **ACTIVE** | Global metric frame updated, quality high | POST_PROCESS | main-loop |

**Poznámky:**
- Všetky support systémy sú ACTIVE
- Sú to sekundárne alebo podporné vrstvy pre hlavné systémy

---

## KATEGÓRIA 4: Healing Systems (Golden Wave Trilogy)

Vlastníctvo: `main.js`  
Inicializácia: `setupHarmonicHealingSystem()`, `setupHarmonicRecovery()`  
Špeciálna kategória pre P0.1

| Systém ID | Role / Popis | Runtime Status | Spawn Conditions | Render Layer | Scheduler Layer |
|-----------|--------------|----------------|------------------|--------------|-----------------|
| **HarmonicAudioReactivitySystem_Session135** | Audio reactivity for healing events, spatial audio positioning | **ACTIVE** | Audio system initialized | AUDIO | audio-driven |
| **HealingParticleSystem_Session136** | GPU particle system for healing effects, golden waves, and scar sparkles | **ACTIVE** | Rupture system active, healing events | WORLD_OVERLAY | visual |
| **HarmonicHealingVisualSystem_Session134** | Logic engine for golden wave healing, coordinates particles and audio | **ACTIVE** | Link events, healing triggers | WORLD_OVERLAY | visual |
| **HarmonicRecoveryVisualSystem_Session138** | High-level visual recovery representing network repair after rupture | **ACTIVE** | Rupture completion, recovery events | WORLD_OVERLAY | visual |
| **LinkTrailParticleSystem** | Particle trail system for link-based healing effects | **ACTIVE** | Link creation, healing events | LINK_FX | visual |

**Poznámky:**
- Všetky healing systémy sú ACTIVE
- Sú plne integrované v boot path (riadok 6145, 6151 v main.js)
- Majú jasný gameplay účel: healing po rupture, recovery waves
- `HarmonicAudioReactivitySystem_Session135` vyžaduje audio system inicializovaný

---

## KATEGÓRIA 5: Link Systems

Vlastníctvo: `main.js`  
Inicializácia: Rôzne setup metódy v `main.js`

| Systém ID | Role / Popis | Runtime Status | Spawn Conditions | Render Layer | Scheduler Layer |
|-----------|--------------|----------------|------------------|--------------|-----------------|
| **LinkRendererConduit** | Core link renderer with glow, streaks, beads, pulses, and particles | **ACTIVE** | Link created | LINK_FX | visual |
| **LinkAuraSystem** | GPU-driven cylindrical halo system around links | **ACTIVE** | Link created | LINK_AURA | visual |
| **LinkSparkSystem** | Spark effects for link creation and events | **ACTIVE** | Link created | LINK_FX | visual |
| **LinkHistoryTracker1_0** | Tracks link quality, priority, and corruption changes over time | **ACTIVE** | Link created/removed | INTERNAL | event-driven |
| **LinkCorrelationEngine1_0** | Analyzes correlation patterns between links | **ACTIVE** | Sufficient link samples | INTERNAL | periodic (3s) |
| **LinkCollapseSystem** | Visualizes link collapse with shatter and debris effects | **ACTIVE** | Link failure | LINK_FX | visual |
| **LinkCascadePulseManager** | Manages cascade pulses on links | **ACTIVE** | Cascade events | LINK_FX | visual |
| **LinkCorruptionTransmission_v1** | Visualizes corruption transmission along links | **ACTIVE** | Corruption events | LINK_FX | visual |
| **LinkResonanceFlowSystem_Session124** | Pulsing directional energy flows along links with overload indicators | **ACTIVE** | Link harmony/resonance | LINK_FX | visual |
| **LinkSemanticPictogramSystem_WithFusion** | Creates traveling glyphs with convergence detection and fusion | **ACTIVE** | Link events, semantic data | LINK_FX | visual |
| **LinkDirectionalGradientPolish** | Applies gradient colors along link direction | **ACTIVE** | Link created | LINK_FX | visual |
| **LinkDirectionalStreaks** | Renders streak patterns showing energy flow direction | **ACTIVE** | Link created | LINK_FX | visual |
| **LinkRingArcDischarges** | Generates electric arc discharges on link rings | **ACTIVE** | Link quality, metrics | LINK_FX | visual |
| **LinkSurfacePhaseRipples** | Creates phase-based ripple effects on link surfaces | **ACTIVE** | Link phase, metrics | LINK_FX | visual |

**Poznámky:**
- Všetky link systémy sú ACTIVE
- Sú core features ATOMA - linky sú hlavná metafora hry
- Sú plne integrované do link creation/removal lifecycle

---

## KATEGÓRIA 6: Node Systems

Vlastníctvo: `main.js`, `AINodes`  
Inicializácia: `AINodes`, rôzne setup metódy

| Systém ID | Role / Popis | Runtime Status | Spawn Conditions | Render Layer | Scheduler Layer |
|-----------|--------------|----------------|------------------|--------------|-----------------|
| **AINodes** | Core node management, spawn, and lifecycle | **ACTIVE** | Game start | NODES | simulation |
| **EnhancedNodeModels** | Node visual models with category-specific geometry | **ACTIVE** | Node spawn | NODES | - |
| **ArchetypeVisualProfiles** | Archetype-based visual differentiation | **ACTIVE** | Node spawn | NODES | - |
| **ArchetypeVisualDifferentiationSystem_v1** | Dynamic archetype visual differentiation | **ACTIVE** | Node metrics changed | NODES | visual |
| **NodeAuraRenderer** | Aura rendering system for nodes | **ACTIVE** | Node spawn | NODE_AURA | visual |
| **NodeLinkedAuraSystem** | Linked aura system between connected nodes | **ACTIVE** | Links created | NODE_AURA | visual |
| **CorruptionDrivenAuraDesaturationSystem** | Aura desaturation based on corruption levels | **ACTIVE** | Node corruption changed | NODE_AURA | visual |

**Poznámky:**
- Všetky node systémy sú ACTIVE
- Sú core infrastructure ATOMA

---

## KATEGÓRIA 7: Wave & Resonance Systems

Vlastníctvo: `main.js`  
Inicializácia: Rôzne setup metódy

| Systém ID | Role / Popis | Runtime Status | Spawn Conditions | Render Layer | Scheduler Layer |
|-----------|--------------|----------------|------------------|--------------|-----------------|
| **StandingWaveOscillationTrapSystem_Session130** | Detects standing wave formation and trap regions | **ACTIVE** | Wave interference | WORLD_OVERLAY | simulation |
| **StandingWaveVisualRenderer_Session131** | Visualizes standing waves with concentric ring patterns | **ACTIVE** | Standing wave detected | WORLD_OVERLAY | visual |
| **OscillationTrapVisualSystem_Session132** | Visualizes standing wave oscillation traps | **ACTIVE** | Oscillation trap detected | WORLD_OVERLAY | visual |
| **WaveInterferencePatternSystem_Session132** | Visualizes constructive/destructive interference patterns | **ACTIVE** | Wave collision | WORLD_OVERLAY | visual |
| **ResonanceRuptureVisualSystem_Session133** | Visualizes standing wave collapse and rupture | **ACTIVE** | Standing wave collapse | WORLD_OVERLAY | visual |
| **WaveBurstRouter_v1** | Routes wave burst events to appropriate visual systems | **ACTIVE** | Wave burst events | INTERNAL | event-driven |
| **InfluenceReflectionBackPressureSystem_Session129** | Visualizes reflection and back pressure effects | **ACTIVE** | Influence reflection | WORLD_OVERLAY | visual |
| **InfluenceAttenuationAbsorptionSystem_Session128** | Visualizes attenuation and absorption of influence | **ACTIVE** | Influence propagation | WORLD_OVERLAY | visual |
| **ResonanceEchoTrailSystem** | Creates harmonic afterimages following composite glyphs | **ACTIVE** | Resonance events | WORLD_OVERLAY | visual |
| **HarmonicResonanceCoupling_v1** | Creates pulsing resonance particles flowing between nodes | **ACTIVE** | Harmony events | WORLD_OVERLAY | visual |
| **CascadeResonanceWaveVisualization_Session146** | Visualizes resonance waves between harmonic hubs | **ACTIVE** | Resonance cascade | WORLD_OVERLAY | visual |

**Poznámky:**
- Všetky wave/resonance systémy sú ACTIVE
- Tvorí komplexný systém pre vlnové efekty a rezonanciu
- Majú jasný physics-based gameplay

---

## KATEGÓRIA 8: Cascade & Corruption Systems

Vlastníctvo: `main.js`  
Inicializácia: `setupCascadingRuptureAndFailure()`, atď.

| Systém ID | Role / Popis | Runtime Status | Spawn Conditions | Render Layer | Scheduler Layer |
|-----------|--------------|----------------|------------------|--------------|-----------------|
| **CascadeParticleSystem_Session120** | GPU particle system for cascade conflicts | **ACTIVE** | Cascade events | WORLD_OVERLAY | visual |
| **CascadingRuptureSystem** | Visualizes rupture energy propagating through network | **ACTIVE** | Rupture events | WORLD_OVERLAY | visual |
| **SynergyCascadeVisualizer** | Visualizes cascade propagation with flow particles and ripples | **ACTIVE** | Cascade start | WORLD_OVERLAY | visual |
| **CascadeBurstVisual_Session147** | Burst explosion visual effects | **ACTIVE** | Cascade burst | WORLD_OVERLAY | visual |
| **PHASE5_CorruptionBridge_v1** | Bridges corruption events to visual systems | **ACTIVE** | Corruption events | INTERNAL | event-driven |
| **TIER4_CorruptionFeedbackVisuals_v1** | Corruption feedback particles and visual effects | **ACTIVE** | Corruption events | WORLD_OVERLAY | visual |
| **CorruptionVisualFX_v1** | Core corruption visual effects | **ACTIVE** | Corruption events | WORLD_OVERLAY | visual |
| **LinkCascadeInfectionSystem** | Visualizes cascade infection spreading along links | **ACTIVE** | Cascade infection | LINK_FX | visual |

**Poznámky:**
- Všetky cascade/corruption systémy sú ACTIVE
- Sú kritické pre gameplay tension a payoff

---

## KATEGÓRIA 9: Audio Systems

Vlastníctvo: `main.js`  
Inicializácia: `setupAudio()`

| Systém ID | Role / Popis | Runtime Status | Spawn Conditions | Render Layer | Scheduler Layer |
|-----------|--------------|----------------|------------------|--------------|-----------------|
| **AtomaAudioSystem** | Core audio system for ATOMA | **ACTIVE** | Game start | AUDIO | audio-driven |
| **AtomaAudioModulation** | Audio modulation based on metrics | **ACTIVE** | Metric changes | AUDIO | audio-driven |
| **registerAtomaAudioEventManifest** | Registers audio event manifest | **ACTIVE** | Game start | INTERNAL | event-driven |

**Poznámky:**
- Všetky audio systémy sú ACTIVE
- Audio je core feature pre immersion

---

## KATEGÓRIA 10: HUD/UI Systems

Vlastníctvo: `main.js`, `CoreMetricsOverlay`  
Inicializácia: `setupHUD()`

| Systém ID | Role / Popis | Runtime Status | Spawn Conditions | Render Layer | Scheduler Layer |
|-----------|--------------|----------------|------------------|--------------|-----------------|
| **CoreMetricsHUD** | Core metrics HUD display | **ACTIVE** | Game start | HUD_OVERLAY | hud-loop |
| **CoreMetricsOverlay** | Core metrics overlay for visual feedback | **ACTIVE** | Game start | HUD_OVERLAY | hud-loop |
| **HUDLayoutManager** | Layout manager for HUD elements | **ACTIVE** | Game start | HUD_OVERLAY | hud-loop |

**Poznámky:**
- HUD systémy sú ACTIVE
- Budú potrebovať P0.5 konsolidáciu pre AAA produktovú úroveň

---

## KATEGÓRIA 11: Regional & Topology Systems

Vlastníctvo: `main.js`  
Inicializácia: `setupRegionalEquilibrium()`, atď.

| Systém ID | Role / Popis | Runtime Status | Spawn Conditions | Render Layer | Scheduler Layer |
|-----------|--------------|----------------|------------------|--------------|-----------------|
| **RegionalEquilibriumFieldSystem** | Visualizes territorial equilibrium and long-term power balance shifts | **ACTIVE** | Regional equilibrium | WORLD_OVERLAY | simulation |
| **RegionalHarmonyZones** | Regional harmony zone visualization | **ACTIVE** | Regional harmony | WORLD_OVERLAY | visual |
| **RegionalHarmonicCycleController** | Controls regional harmonic cycles | **ACTIVE** | Harmonic cycles | WORLD_OVERLAY | simulation |
| **TopologyBiasVisualizationLayer** | Visualizes long-term topology learning as directional bias vectors | **ACTIVE** | Topology learning | WORLD_OVERLAY | visual |
| **HarmonicTopologyLearning** | Learns and visualizes harmonic topology patterns | **ACTIVE** | Link events | INTERNAL | periodic |

**Poznámky:**
- Všetky regional/topology systémy sú ACTIVE
- Poskytujú strategic depth pre gameplay

---

## KATEGÓRIA 12: Glyph & Ritual Systems

Vlastníctvo: `main.js`  
Inicializácia: Rôzne setup metódy

| Systém ID | Role / Popis | Runtime Status | Spawn Conditions | Render Layer | Scheduler Layer |
|-----------|--------------|----------------|------------------|--------------|-----------------|
| **ProceduralHarmonicGlyphs** | Procedural generation of harmonic glyphs | **ACTIVE** | Harmony events | WORLD_OVERLAY | visual |
| **GlyphAnimationModulator** | Modulates glyph animations | **ACTIVE** | Glyph events | WORLD_OVERLAY | visual |
| **CompositeGlyphResonanceFeedback** | Provides resonance feedback through composite glyphs | **ACTIVE** | Resonance events | WORLD_OVERLAY | visual |
| **MegaGlyphSystem** | Large-scale glyph system for major events | **ACTIVE** | Major events | WORLD_OVERLAY | visual |
| **_MythicRitualController** | Controller for mythic rituals | **ACTIVE** | Ritual events | WORLD_OVERLAY | simulation |

**Poznámky:**
- Všetky glyph/ritual systémy sú ACTIVE
- Sú unikátny vizuálny jazyk ATOMA

---

## KATEGÓRIA 13: Debug & Developer Tools

Vlastníctvo: `main.js`  
Inicializácia: Rôzne setup metódy

| Systém ID | Role / Popis | Runtime Status | Spawn Conditions | Render Layer | Scheduler Layer |
|-----------|--------------|----------------|------------------|--------------|-----------------|
| **FXDebugSandbox** | Debug sandbox for visual effects testing | **ACTIVE** | Always available | DEBUG | manual |
| **VisualAudit** | Audits visual systems for issues | **ACTIVE** | Manual trigger | DEBUG | manual |
| **MaterialMutationDetector** | Detects material mutations | **ACTIVE** | Always monitoring | DEBUG | event-driven |
| **SphereCreatorTrace** | Traces sphere creation (TEMP DISABLED) | **DISABLED INTENTIONALLY** | - | - | - |

**Poznámky:**
- Väčšina debug nástrojov je ACTIVE
- `SphereCreatorTrace` je DISABLED INTENTIONALLY lebo blokoval spawn pipeline

---

## P0.1 SUMMARY: Kritické rozhodnutia

### ✅ Potvrdené systémy (P0.1 scope)

**Environment Domain:**
1. **SafeAIWeatherPack** → ACTIVE
2. **SafeQuantumIllusionsPack1** → ACTIVE
3. **EmergentThoughtStorms5_0** → CONDITIONAL (vyžaduje recursiveGlyphMessaging + semanticGlyphAI)

**Healing Systems:**
4. **HarmonicHealingVisualSystem_Session134** → ACTIVE
5. **HealingParticleSystem_Session136** → ACTIVE
6. **HarmonicRecoveryVisualSystem_Session138** → ACTIVE

### 📊 Celkový prehľad

- **Total systems tracked:** 100+
- **ACTIVE:** ~95%
- **CONDITIONAL:** ~3%
- **DISABLED INTENTIONALLY:** ~1%
- **ARCHIVE-CANDIDATE:** ~1%

### ✅ Hotovo keď:

Každý veľký VFX/environment systém má:
- ✅ Explicitný runtime status
- ✅ Jasného ownera
- ✅ Definované spawn conditions (ak relevantné)
- ✅ Render layer
- ✅ Scheduler layer

Boot path je čitateľný pre človeka aj pre budúce implementácie.

---

## Aktualizačné pravidlá

1. **Pridanie nového systému:** Musí byť zaradený do kategórie a vyplnené všetky polia
2. **Zmena statusu:** Musí byť zdokumentovaná dôvodom a dátumom
3. **Archivácia:** Systém presunutý do `/legacy` alebo `/LEGACY` musí byť označený ako ARCHIVE-CANDIDATE
4. **Kontrola:** Pred každou významnou zmenou je potrebné overiť konzistenciu s `ATOMA_OVERVIEW.md` a `ATOMA_CORE_CONTEXT.md`

---

## Prepojenia na iné dokumenty

- **AAA_WORLD_CLASS_IMPLEMENTATION_TODO_2026-04-16.md** - P0.1 Runtime truth pass
- **ATOMA_CORE_CONTEXT.md** - Technický kontext subsystémov
- **MEMORY.md** - Stabilné architektonické rozhodnutia
- **TOOLS.md** - AI nástroje pre analýzu a optimalizáciu

---

**Last updated:** 2026-04-16  
**Next review:** Po dokončení P0.1 (odhad 2-3 týždne)
