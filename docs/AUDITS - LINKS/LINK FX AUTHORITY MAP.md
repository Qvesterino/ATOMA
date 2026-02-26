RIBBON CORE (braided strands)
- Create: `LinkRendererConduit.createLinkVisuals` builds 3–5 strand meshes per link; stored in `conduitState.strands` and added to the link group.
- Update: `LinkRendererConduit.update` (per-frame, scheduler-driven via NodeLinkingSystem) adjusts strand render state and emissive in-place while computing VFX inputs; no dedicated subsystem class.
- Metrics: reads `synergy` and `traffic` (and derived `vfx` factors); color/width/emissive scaled in `computeLinkVfxInput` and subsequent per-frame strand mutations.
- State: per-link in `group.userData.conduitState.strands`; update assumes strands exist; if missing, rebuild path triggers `createLinkVisuals`.
- Risks: shared material mutations with other layers (skin, energy wave) can overlap; relies on conduitState presence.

SKIN AURA
- Create: `createLinkAuraMaterial` + `createLinkAuraGeometry` in `createLinkVisuals`; stored `conduitState.skinMesh`.
- Update: no dedicated updater; only static material/opacity baked at creation.
- Metrics: none at runtime.
- State: `skinMesh` in conduitState.
- Risks: static; potential duplicate depth/opacity writes if other layers touch same material (rare).

BEADS (LinkBeadVisualizer / LinkBeadSystem)
- Create: per link in `createLinkVisuals`; stored `conduitState.beads`.
- Update: `state.beads.update(visualDelta, onArrivalCb)` in `LinkRendererConduit.update`; scheduler-driven each frame; uses deltaTime.
- Metrics: uses `synergy` and `traffic` internally (`getActivityLevel`, opacity scaling, spawn rates).
- State: bead pool inside `LinkBeadVisualizer` plus callback to impacts; requires conduitState.beads.
- Risks: bead→mesh callback also feeds TrailSystem; duplicate color writes minimal.

TRAILS (LinkBeadTrailSystem)
- Create: per link in `createLinkVisuals`; stored `conduitState.trails`.
- Update: `state.trails.update(visualTime, visualDelta, state.beads.beadToMesh)` each frame.
- Metrics: indirectly via bead emitter positions; no direct metric reads.
- State: internal buffers; depends on bead mapping; update early-returns if emitter absent.
- Risks: buffer uploads every frame; shares timing with beads.

SPARKS (LinkSparkSystem)
- Create: per link in `createLinkVisuals`; stored `conduitState.sparks`.
- Update: `state.sparks.update(visualTime, visualDelta, curve, {synergy, traffic, intensity}, currentColor)` per frame.
- Metrics: direct `synergy`, `traffic`, plus `intensity` from VFX input.
- State: internal pool; conduitState reference required.
- Risks: writes emissive/opacity on spark material only.

TRAIL PARTICLES (LinkTrailParticleSystem + LinkTrailEmitter)
- Create: per link in `createLinkVisuals` when TrailParticles exist; emitter stored in `trailEmitters` map.
- Update: emitter.update(visualDelta, visualTime, curve, linkDir, harmony, corruption) per frame.
- Metrics: `harmony`, `corruption` modulate rate/color; uses curve for placement.
- State: emitter + system internal pools; keyed by link id.
- Risks: relies on linkDir and curve; missing state skips update.

HEALING PARTICLES (LinkHealingParticleSystem + LinkHealingEmitter)
- Create: per link in `createLinkVisuals`; stored in `healingEmitters`.
- Update: emitter.update(visualDelta, visualTime, curve, linkDir, harmony, corruption) per frame.
- Metrics: `harmony`/`corruption` drive emission; reverse direction (target→source).
- State: emitter per link.
- Risks: similar to trail particles; skips if emitter missing.

PULSE RING (LinkPulseRing)
- Create: per link in `createLinkVisuals`; stored `conduitState.pulseRing`.
- Update: `state.pulseRing.update(curve, synergy, traffic, visualDelta, sourceColor, targetColor)` each frame.
- Metrics: `synergy`, `traffic`; colors from source/target categories.
- State: ring object; uses curve; assumes presence.
- Risks: drives downstream arc discharges via progress; relies on curve.

ENERGY WAVE (LinkEnergyWave)
- Create: per link in `createLinkVisuals`; stored `conduitState.energyWave`.
- Update: `state.energyWave.update(state.strands, visualDelta, synergy, traffic, baseEmissiveIntensity)` per frame.
- Metrics: `synergy`, `traffic`; modulates speed/intensity.
- State: uses strand meshes as targets.
- Risks: emissive writes on strand materials overlap with base strand updates.

ARC DISCHARGES (LinkRingArcDischarges)
- Create: per link in `createLinkVisuals` when class available; stored `conduitState.arcDischarges`; owns its internal THREE.Group.
- Update: `state.arcDischarges.update(mainCurve, ringProgress, synergy, trafficLoad, visualDelta, ringColor, ringScale)` per frame.
- Metrics: `synergy`, `traffic`; ringProgress from pulse ring.
- State: internal activeArcs array; uses curve; assumes pulse ring provides progress.
- Risks: creates/destroys geometries frequently; color writes isolated to arc materials.

CORRUPTION ANIMATOR (LinkCorruptionSpreadAnimator)
- Create: per link in `createLinkVisuals`; stored via `conduitState.strands`.
- Update: `this.corruptionAnimator.update(link, visualDelta, state.strands)` per frame.
- Metrics: uses `link.harmonyLevel` and `link.corruptionLevel`.
- State: internal animation state keyed by link id.
- Risks: writes colors on strand materials (shares with base/energy wave).

CORRUPTION PARTICLES (LinkCorruptionParticleSystem)
- Create: shared system; per-link tracking via link id.
- Update: `updateLinkParticles(link, visualDelta)` per frame.
- Metrics: uses `link.corruptionLevel` (and occasionally harmony/traffic internally).
- State: internal particle pools keyed by link id.
- Risks: particles add material writes separate from strand materials.

VISUAL STATE ADAPTER (LinkVisualStateAdapter)
- Create: per link in `createLinkVisuals`; stored `conduitState.visualStateAdapter`.
- Update: `state.visualStateAdapter.update(link.group, harmonyLevel, corruptionLevel, instability, visualDelta, synergyLevel)` per frame.
- Metrics: direct `harmony`, `corruption`, `instability`, `synergy`.
- State: internal; acts on group meshes (potential overlap with strands/skin).
- Risks: broad writes across link group; overlapping with other effects.

DIRECTIONAL STREAKS (LinkDirectionalStreaks)
- Create: manager shared; per-link streak state stored in `conduitState.directionalStreaks`; initialized in `createLinkVisuals`.
- Update: `directionalStreaks.update(link.group, curve, visualDelta, synergy, harmony, corruption, instability, sourceColor, targetColor, link, visualTime, specialization)` per frame.
- Metrics: direct `synergy`, `harmony`, `corruption`, `instability`; color dynamics via `LinkStreakColorDynamics`.
- State: `conduitState.directionalStreaks`; guard returns if missing.
- Risks: geometry/material writes for streak mesh; depends on prior initialization.

BEAD IMPACTS / IMPACT MANAGER
- Create: `ImpactManagerCollection` global per conduit; impacts spawned from beads/healing/corruption callbacks; added to scene.
- Update: `updateImpacts(state, visualDelta)` per frame; handles lifetime/opacity.
- Metrics: inherits color/intensity from bead/link context; not directly reading metrics.
- State: `conduitState.impacts`.
- Risks: transient meshes; separate materials.

FX CREATION AUTHORITY SUMMARY
- All per-link visuals are instantiated inside `LinkRendererConduit.createLinkVisuals`; lifecycle owned by LinkRendererConduit (disposeLinkVisuals cleans up).
- DirectionalStreaks manager is shared, but per-link streak buffers live in `conduitState`.
- Corruption/Healing/Trail particle systems share global managers with per-link emitters.

UPDATE AUTHORITY SUMMARY
- Single scheduler entry: `LinkRendererConduit.update(link, deltaTime, time)` invoked by NodeLinkingSystem each frame; it fans out to all effect updates in-order.
- Auxiliary managers (NodeInterferenceManager, NodeHarmonicManager, cascade propagation) are also driven per-frame by LinkRendererConduit.

METRIC BINDING SUMMARY
- Synergy: strands, beads, sparks, pulse ring, energy wave, arc discharges, directional streaks, corruption animator (indirect), VFX input.
- Harmony: trail/healing particles, directional streaks, visualStateAdapter, corruption animator.
- Corruption: directional streaks, trail/healing particles, corruption animator/particles, visualStateAdapter, VFX inputs (color bias).
- Instability: directional streaks; visualStateAdapter.
- Traffic/loadPressure: strands via VFX input, sparks, pulse ring, energy wave, arc discharges; VFX input uses `traffic` and `loadPressure` as load.

STATE STORAGE SUMMARY
- Per-link `group.userData.conduitState` holds all effect handles and some derived values (baseColor, phaseOffset, impacts).
- Additional per-link emitters (trail/healing) stored in conduit maps keyed by link id.
- Shared managers: DirectionalStreaks, CorruptionParticles, ImpactManagerCollection exist once but keep per-link state.
- Many updates assume state exists; some rebuild if `conduitState` missing; streaks guard-return if state missing.

DEBUG / LEGACY CHECK
- Debug logging throttles in directional streaks and conduit (vertex/opacity logs).
- VisualStateAdapter and CorruptionAnimator have overlapping color writes on strands (potential duplication).
- Strand emissive also touched by EnergyWave; corruption animator also adjusts strand colors → duplicate material writes on same meshes.
- ArcDischarges uses LinkBufferSafetyAudit (safety/debug).
- Trail/Healing particle systems partially integrated via emitters; no-op if emitter missing.

SYSTEM RISKS SUMMARY
- Ordering: all effect updates occur in a fixed sequence inside `LinkRendererConduit.update`; later systems (corruption animator, directional streaks) can overwrite strand material changes from earlier systems (energy wave, visualStateAdapter).
- Lifecycle: if `createLinkVisuals` is skipped or state reset, updates may no-op; streaks depend on prior initialize; pulse ring progress drives arc discharges.
- Redundant writes: strand materials are touched by base strand logic, EnergyWave, VisualStateAdapter, CorruptionAnimator—multiple writes per frame on same material.
- Metric duplication: synergy/traffic influence both VFX input and individual subsystems (pulse ring, energy wave, sparks), leading to overlapping intensity scaling.