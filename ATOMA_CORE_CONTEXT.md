# ATOMA Core Context

This document is the runtime and subsystem truth layer for ATOMA.

Use it to understand what actually boots, which systems are canonical, and what the current release slice contains.

---

## Canonical Runtime Entry

Default live runtime validation target:

- `http://127.0.0.1:5173/`

Use the Vite runtime as the canonical truth for smoke tests and gameplay validation.

Legacy/static paths may still exist, but they are not the default source of truth.

---

## Boot Chain

The current boot chain is:

1. `MainMenu.js` presents world selection, settings, onboarding/meta profile state
2. `AtomaBoot.js` owns menu flow, pause flow, major loading transitions, and world launch orchestration
3. `main.js` builds the chosen world, runtime systems, HUD, audio, and score-facing orchestration
4. world setup initializes nodes, links, environment, metrics, guidance, identity, setpieces, audio, and adaptive performance layers

This is the first mental model a new agent should load before touching gameplay or presentation wiring.

---

## Canonical Authorities

The stable runtime authorities are:

- `FrameScheduler`
- `MetricsRuntime_v1`
- `VisualHierarchyRegistry`

Supporting canonical runtime layers:

- `src/metrics/NodeMetricEngine.js` — node metric mutation/update authority
- `SemanticMetricAdapter.js` — safe read/projection layer for UI and VFX consumers
- `NodeLinkingSystem.js` — canonical node select/link authority
- `LinkQualityCalculator.js` — canonical link-quality and sustain-quality input layer

Visual, HUD, audio, and FX systems should consume canonical runtime truth. They must not become parallel gameplay authorities.

---

## Canonical Metrics and Cadence

Primary canonical metrics:

- `synergy`
- `harmony`
- `stability`
- `corruption`
- `loadPressure`

Scheduler truth:

- `10Hz` simulation
- `30Hz` visual
- `60Hz` runtime responsiveness

These are invariants, not suggestions.

---

## Current Gameplay Slice

ATOMA is currently centered on a stabilizer gameplay loop:

1. build node relationships
2. improve network coherence and quality
3. sustain enough network strength to open `REWIND`
4. hold the network together long enough to prevent collapse
5. reach `WON` through successful stabilization

Current player-facing gameplay readability layers include:

- stabilizer fantasy framing
- build-state labels:
  - `VOLATILE SURGE`
  - `STABILIZED LATTICE`
  - `FRAGILE EXPANSION`
  - `COLLAPSE DRIFT`
- first-run guidance via `HUD/FirstRunGuidanceDirector.js`
- run identity selection via `HUD/RunIdentityDirector.js` and `RunIdentityProfiles.js`
- score/HUD projection via `HUD/CoreMetricsHUD.js`

ATOMA does not currently use a traditional hard fail screen.
Collapse pressure and loss-of-hold states are communicated as recoverable soft failure.

---

## Release-Priority Worlds

Full release-priority treatment is currently focused on:

- `Quantum Island`
- `Dream Desert`

These worlds currently receive the strongest authored support across:

- onboarding
- run identity selection
- signature setpieces
- audio-reactive identity
- UX polish

Other worlds may still boot and remain valid engineering surfaces, but they are not the primary onboarding slice.

---

## Active Release Layers

The current release slice includes these authored/systemic layers:

- **First-run guidance**
  - `HUD/FirstRunGuidanceDirector.js`
  - first-run-only beats, objective strip, guided payoff moments

- **Run identity**
  - `RunIdentityProfiles.js`
  - `HUD/RunIdentityDirector.js`
  - run packages:
    - `surge_thread`
    - `pivot_covenant`
    - `lattice_keeper`
  - release world states for `quantum` and `desert`

- **Signature setpieces**
  - `SignatureMomentDirector.js`
  - curated release-world allowlist
  - authored victory transformation path coordinated from `main.js`

- **Audio-reactive identity**
  - `AtomaAudioSystem.js`
  - `AtomaAudioEventManifest.js`
  - `AtomaAudioModulation.js`
  - `harmony/HarmonicAudioReactivitySystem_Session135.js`

- **Adaptive performance discipline**
  - `AdaptivePerformanceMonitor_v1.js`
  - `DistanceLODController.js`
  - `main.js` quality-tier orchestration

- **UX / pause / soft-failure polish**
  - `MainMenu.js`
  - `PauseMenu.js`
  - `AtomaLoadingOverlay.js`
  - `HUD/CoreMetricsHUD.js`
  - `HUD/GameplayHintLayer.js`

---

## Practical Subsystem Map

Primary subsystem anchors:

- `LINK SYSTEM`
  - `NodeLinkingSystem.js`
  - `LinkRendererConduit.js`
  - link VFX and link-quality consumers

- `NODE SYSTEM`
  - `AINodes.js`
  - `EnhancedNodeModels.js`
  - node visuals and spawn/growth logic

- `METRICS SYSTEM`
  - `src/metrics/NodeMetricEngine.js`
  - `MetricsRuntime_v1.js`
  - `src/metrics/NetworkMetricsAggregator.js`

- `WAVE / CASCADE SYSTEM`
  - cascade, resonance, and wave visual families
  - semantic bus consumers must use `Engine/EventRegistrationRegistry.js`

- `UI / HUD SYSTEM`
  - menu, pause, HUD, overlays, onboarding, hints, run identity

---

## Event and Cleanup Contracts

Durable VFX/runtime contract:

- semantic event subscriptions must go through `Engine/EventRegistrationRegistry.js`
- systems that create scene objects must follow the unified cleanup contract
- world switches must not leave orphan subscriptions or scene objects behind

These are not optional style preferences. They are current runtime safety rules.

---

## Read Next

- `CORE_PRINCIPLES.md` for invariants
- `IDENTITY.md` for the compact startup snapshot
- `BOOT.md` for practical runtime boot/smoke steps
- `MEMORY.md` for stable lessons and durable historical decisions
