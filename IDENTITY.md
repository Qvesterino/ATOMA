# IDENTITY.md -- ATOMA Boot Reference

This document is the compact launchpad for ATOMA startup reasoning.
It summarizes what is active after boot, which worlds are available, what node categories matter, which link and environment visual domains are used, and where metrics are computed.

---

## Core boot view

After boot, the important runtime picture is:

- `AtomaBoot.js` starts the menu and selects the world.
- `main.js` initializes the chosen world and the environment domain.
- `AINodes.js` spawns nodes with categories and archetypes.
- `NodeLinkingSystem.js` handles player link creation and core link visuals.
- `MetricsRuntime_v1.js` and `NodeMetricEngine` are canonical metric writers.
- Visual systems read metrics and render link/environment effects.

This is the first line of thinking when you read boot documentation.

A key runtime anchor is the frame scheduler: multiple update layers are active after boot — 2Hz background, 10Hz simulation, 30Hz visual, and 60Hz runtime responsiveness.

---

## Worlds available at boot

The playable startup worlds are:

- `quantum` — Quantum Island (`QuantumIsland.js`)
- `fractal` — Fractal Valley (`FractalValley.js`)
- `desert` — Dream Desert (`DreamDesert.js`)
- `desert2` — Mirage Veil (`DreamDesert2.js`)
- `memory` — Memory Lane (`MemoryLane.js`)
- `chamber` — Sigma Chamber (`SigmaRiftChamber.js`)
- `sigma` — Sigma Rift (`SigmaRift.js`)

The default fallback world is `quantum`.

Each world has its own environment setup and theme wiring in `main.js`:
- `setupQuantumIslandEnvironment()`
- `setupFractalValleyEnvironment()`
- `setupDreamDesertEnvironment()`
- `setupMemoryLaneEnvironment()`
- `setupSigmaRiftEnvironment()`

World selection is the first decision point for any booted test.

---

## Node category model

Nodes are grouped into canonical categories used across spawn, effects, and link visuals.

Supported node categories and their visual code ranges (from `NodeVisualRegistry.js`):

- `input` — 101-108, 110-111
- `process` — 201-209
- `integration` — 301-316
- `analytics` — 401-409, 411-412
- `storage` — 501-513, 515-516
- `control` — 601-616, 618-621
- `quantum` — 701-703, 705
- `sigma` — 804-807
- `mythic` — 901-906, 908
- `prime` — 1001-1006, 1008
- `error` — 1101-1106, 1108
- `emotional` — 1201-1207

These categories are the primary visual hooks for:
- category color bias
- link spark and aura styling
- HUD legend and category overlay
- archetype shader behavior

Node visuals are stored in `EnhancedNodeModel.js` and spawn orchestration is handled by `AINodes.js` (`AINodes.js` also implements the ~15 pre-spawn initial node set and the growth rules).

At game start, each map begins with about 15 pre-spawned nodes. New nodes are added over time by the spawn system: one node every 45 seconds and one node at each active-link milestone (3, 6, 9, ...) rather than on raw link-creation count.

Node archetypes are layered on top of categories, but category remains the primary semantic tag.

---

## Link visual domains after boot

The active link system is centered on `NodeLinkingSystem.js` and `LinkRendererConduit.js`.
Key link visual domains are:

- core braided strands + skin aura
- pulse rings and ring arc discharges
- spark/trail particles
- energy beads and traveling pulse flows
- semantic pictograms and glyph layer overlays
- corruption/healing emission effects

Link visuals are not static mesh dumps — they are built as a staged bootstrap and updated from link state.

Link visuals are driven by metrics and category state, with specific effects varying by:
- source node category
- target node category
- link synergy/harmony/corruption levels
- world/environment theme

If you need to understand link behavior, start with `NodeLinkingSystem.js` for creation and `LinkRendererConduit.js` for visuals.

---

## Environment visual domains after boot

Environment effects are coordinated by the environment domain and world setup.
Active environment systems include:

- `EnvironmentDomainController` — boots and schedules environment domains (`EnvironmentDomainController.js`)
- `SafeWorldFXPack` — periodic world breathing, rifts, aurora (`_SafeWorldFXPack.js`)
- `AmbientEntityManager` — ghost orbs, wisps, spectral entities (`_AmbientEntityManager.js`)
- `EnvironmentalHazards` — world-mode specific anomalies (e.g. fractal hazards) (`EnvironmentalHazards.js`)
- `WaveParticleEmitter_v1` — world-space wave particles (`WaveParticleEmitter_v1.js`)
- `CascadeParticleSystem_Session120` — cascade bursts and trails (`CascadeParticleSystem_Session120.js`)
- `ResonanceCascadeVisualization_Session117B` — radial cascade influence visuals (`ResonanceCascadeVisualization_Session117B.js`)
- `HarmonicHubAuraSystem_Session126` — hub aura fields for harmonic hubs (`HarmonicHubAuraSystem_Session126.js`)
- `DreamDepthPack` / `DreamDepthEffectManager` — screen-space depth, vignette, pulse glaze (`SafeDreamDepthPack.js`, `DreamDepthEffectManager.js`)

Not all environment systems are fully active in current wiring.
Some remain conditional or dormant unless specific world dependencies and scheduler hooks are present.

Important environment/VFX audit references:
- `docs/audits/cascade_wave_resonance/environment VFX.md` — active world/environment VFX systems, triggers, and runtime states.
- `docs/audits/VIZUALNE EFEKTY VFX.md` — broader link and visual effects catalog with environment and layer context.

Key environment VFX takeaways:
- `EnvironmentDomainController.js` is the runtime coordinator, not a visual effect itself.
- `SafeWorldFXPack` is active for world breathing, rifts, and aura effects, but it is currently metrics-constrained.
- `AmbientEntityManager` spawns ghost orbs/ghosts/whisps and is one of the main world-space ambient layers.
- `EnvironmentalHazards` drives mode-specific phenomena such as electrical storms and gravitational anomalies.
- `WaveParticleEmitter_v1`, `CascadeParticleSystem_Session120`, and `ResonanceCascadeVisualization_Session117B` are the primary active wave/cascade world-space visual systems.
- `HarmonicHubAuraSystem_Session126` and `DreamDepthPack` are the core aura and screen-space atmosphere systems.

---

## Metrics and authority

Canonical metric authority is split cleanly:

- Node metrics: `NodeMetricEngine` (`src/metrics/NodeMetricEngine.js`)
- Global/network metrics: `MetricsRuntime_v1.js`
- Link quality metrics: `LinkQualityCalculator.js`
- Hub metrics: `HarmonicHubAuraSystem_Session126.js`
- Semantic read/projection: `SemanticMetricAdapter.js`
- HUD projection: `CoreMetricsOverlay.js` / `CoreMetricsHUD.js`

Primary canonical metrics are:

- `synergy`
- `harmony`
- `stability`
- `corruption`
- `loadPressure`

Metric tiering is calculated with boundaries around 0.25 / 0.75 and hysteresis for stability:
- low entry: `0.25`
- high entry: `0.75`
- low exit: `0.32`
- high exit: `0.68`

Metric tags appear as canonical signals such as `link.synergy.high`, `hub.corruption.low`, `global.loadPressure.high`, and `node.metric.updated`.
`NodeVisualRegistry.js` also carries per-code `archetypeTag` values like `stabilizer`, `pressure`, `harmonizer`, and `amplifier` that seed visual behavior and metric bias.

Link effect authority is driven by link quality and cascade intensity from `LinkQualityCalculator.js`:
- `link.userData.quality`
- `link.userData.cascadeIntensity`

These are used by link visuals to modulate:
- strand intensity and width
- pulse ring strength
- spark/trail particle density
- corruption/healing emission state
- semantic pictogram layer choice

Metric flow after boot:

1. Node archetype seeds node metrics during spawn.
2. `NodeMetricEngine` updates node metrics on fixed tick.
3. `MetricsRuntime_v1` aggregates node metrics into live network/global payloads.
4. `LinkQualityCalculator` computes link quality and cascade signals.
5. Visual systems read projected metric values, not raw HUD aliases.

Important rule:
- UI and VFX should consume metrics through the adapter, not write canonical state.

---

## What this document is for

Use this page when you need a quick launch perspective:

- which world to choose at boot
- what runtime categories exist
- where link visuals are built
- which environment systems are active
- where metrics are computed and exposed

It is not the full implementation detail list.
It is the boot-level mental model for any follow-up investigation.

---

## Practical boot checklist

1. Start the game in `quantum` or another bootable world.
2. Confirm node categories appear in the category legend.
3. Create links and watch link VFX respond based on category and metrics.
4. Observe environment effects for the selected world.
5. Trace any metric behavior back to `NodeMetricEngine` and `MetricsRuntime_v1`.

If you need a deeper angle, the next documents are:
- `AINodes.js`
- `NodeLinkingSystem.js`
- `LinkRendererConduit.js`
- `MetricsRuntime_v1.js`
- `SemanticMetricAdapter.js`
- `main.js` world setup sections

