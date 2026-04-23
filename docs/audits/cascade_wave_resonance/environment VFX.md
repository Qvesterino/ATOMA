# Environment VFX Audit

Scope: world and environment visuals that are owned, created, or orchestrated by `EnvironmentDomainController`.

Excluded from the main list:
- node-only visuals
- LinkRendererConduit pipeline
- pure HUD overlays unless they are wired as controller support
- map/world geometry assets that are not part of the environment VFX runtime

Runtime lanes used by the controller:
- `visual` = 30Hz environment lane
- `simulation` = 10Hz world personality / ritual lane
- `event-driven` = coordinator or support layer without a per-frame visual loop of its own

## Controller-owned runtime systems

| System | Status | Lane | Owner | Trigger / event names | Notes |
| --- | --- | --- | --- | --- | --- |
| `SafeWorldFXPack` | active, but metrics-degraded | visual | `EnvironmentDomainController` | `global.synergy.high`, `global.loadPressure.high`, `global.corruption.high`, `global.stability.low`, `global.stability.high` | Main world ambience stack: dimensional shifts, rift waves, energy pulses, fractal sky, quantum rifts, sigma glitches, world breathing, energy streams, aurora horizon, screen overlays. The controller currently calls `update(dt)` only, so the pack does not receive the richer node/link/evolution/legendary inputs its update signature expects. |
| `SafeAIWeatherPack` | active | visual | `EnvironmentDomainController` | `world.weather.candidate`, `link.synergy.aggregate`, `link.loadPressure.aggregate`, `world.event.active` | Weather-state atmosphere layer; gate is driven by live links, legendary count, world events, and the active mood profile. |
| `SafeQuantumIllusionsPack1` | active, conditional runtime gating | visual | `EnvironmentDomainController` | `world.event.type.active`, `link.throughput.high`, `link.synergy.aggregate`, `node.synergy.high`, `node.motion.fast` | Illusion pack is instantiated by the controller when the required dependencies exist, then its own `runtimeEnabled` flag decides whether the illusion registry actually runs. Current update path is active. |
| `AmbientEntityManager` | active | visual | `EnvironmentDomainController` | `world.ambient.active` | Ambient ghost-orb / spectre / swarm / phantom / wisp system. This is the only controller-owned environment file in the quick scan that still uses explicit `BoxGeometry` for the `SIGMA_PHANTOM` body parts; that box look is intentional voxel/pixel silhouette, not a missing update loop. |
| `EmergentThoughtStorms5_0` | conditional | visual | `EnvironmentDomainController` | `system.recursiveGlyphMessaging.ready`, `system.semanticGlyphAI.ready` | Large-scale thought-storm weather. The controller only instantiates it when both dependencies are present, then passes `aiNodes` + `linkingSystem` to update. |
| `SafeLegendaryWorldEvents` | active | visual | `EnvironmentDomainController` | `world.legendary.eventPotential.high`, `world.event.cooldown.ready`, `world.event.roll.success` | Rare world-event presentation layer for legendary reveals and high-impact environmental states. |
| `WorldPersonalityController` | active | simulation | `EnvironmentDomainController` | `global.harmony.high`, `global.harmony.mid`, `global.loadPressure.high`, `global.stability.low`, `world.personality.aggregate.ready` | Global world mood / personality modulation. Runs on the simulation lane, not the visual lane. |
| `MythicRitualController` | active | simulation | `EnvironmentDomainController` | `semantic.ritual.started`, `semantic.ritual.completed` | Mythic ritual staging and ceremonial world-state visuals. Simulation lane only. |
| `MetricReactiveWorldEvents` | active | visual | `EnvironmentDomainController` | `global.metricFrame.updated`, `node.metric.updated`, `global.synergy.low|mid|high`, `global.harmony.low|mid|high`, `global.stability.low|mid|high`, `global.corruption.low|mid|high`, `global.loadPressure.low|mid|high` | Metric-driven world spectacle and lightweight visual modulation. |
| `SafeDreamDepthPack` | active | visual | `EnvironmentDomainController` | `world.weather.active`, `world.event.active`, `world.focusTarget.present` | Low-cost dream-depth fallback layer for haze, vignette, and focus mood. |
| `DreamDepthEffectManager` | active | visual | `EnvironmentDomainController` | weather keys `calm`, `pressure`, `resonance`, `stormBias`, `ascensionHaze`; pulse events such as `COSMIC_PULSE`, `QUANTUM_ECLIPSE`, `LUMINESCENT_BURST`, `STARFALL`, `SYNTHESIS_RITUAL`, `WEATHER_SHIFT`, `AETHER_SURGE` | Rich dream-depth overlay path. The controller wires the frame scheduler into it and keeps the focus targets/weather state synchronized. |
| `SafeColonyExpansion2` | conditional | visual | `EnvironmentDomainController` / `SafeColonyExpansion2` | `colony.cluster.detected`, `colony.linkConnectivity.valid`, `world.event.active`, `world.weather.active` | Colony expansion VFX is created only if the class is available in the current build. |
| `EnvironmentalHazards` | active | visual | `EnvironmentDomainController` | `global.corruption.high`, `global.loadPressure.high`, `global.stability.low`, `global.stability.high` | Hazard and anomaly layer. Uses world profile modes such as `default`, `sigma`, and `memory`. The hazard systems use rounded / faceted geometry rather than plain cubes. |

## Controller support systems

| System | Status | Lane | Owner | Trigger / event names | Notes |
| --- | --- | --- | --- | --- | --- |
| `EventDramaturgyEngine` | active | visual | `EnvironmentDomainController` | `cascade.start`, `cascade.end`, `network:corruptionSpread`, `event:harmonyResonance`, `semantic.ritual.started`, `semantic.ritual.completed`, `environment.hazard.active`, `dramaturgy.phase` | 3-phase event lifecycle engine: telegraph, escalation, payoff. This is the controller-owned orchestration layer for major environment events. |
| `EnvironmentEventCoordinator` | active | event-driven | `EnvironmentDomainController` | `global.synergy.high`, `global.harmony.high`, `global.corruption.high`, `global.stability.high`, `global.loadPressure.high`, `semantic.ritual.started`, `semantic.ritual.completed` | Coordinator that arbitrates ownership and sequencing between weather, world events, rituals, and metric-reactive layers. |
| `ColonyVFXManager` | active indirect support | visual-indirect | `SafeColonyExpansion2` | `colony.birth`, `colony.growth`, `colony.merge`, `colony.split`, `colony.transformation`, `world.event.active` | Internal colony payload builder for halos, rings, particles, and transitions. |
| `SafeMetricsFX1_1` | active | event-driven | `main.js` | `node.metric.updated` | Support polish layer that converts node metrics into lightweight feedback. |
| `TemporalEventEffects` | active | hud-loop | `CoreMetricsOverlay` | `global.harmony.high`, `global.synergy.high`, `time.epoch.changed`, `time.aeon.changed` | Temporal overlay support used by HUD / metrics layers rather than world-space rendering. |
| `CinematicUpgrade` | active | main-loop | `main.js` | `global.metricFrame.updated`, `quality.high` | Presentation-grade cinematic support layer. It is not a core environment system, but it is wired as controller support in the registry and should remain visible in the environment audit. |

## Environment-adjacent systems outside the controller

These are not owned by `EnvironmentDomainController`, but they still contribute to the world/environment surface and are easy to confuse with controller-owned effects.

| System | Status | Lane | Owner | Trigger / event names | Notes |
| --- | --- | --- | --- | --- | --- |
| `WaveParticleEmitter_v1` | active | visual | `main.js` | `node.synergy.low|mid|high`, `node.harmony.low|mid|high`, `node.stability.low|mid|high`, `node.corruption.low|mid|high`, `node.loadPressure.low|mid|high` | World-space wave particles and standing-wave motion. |
| `ResonanceCascadeVisualization_Session117B` | active | visual | `main.js` | `link.created`, `global.loadPressure.high` | Cascade / resonance propagation overlay for radial surges and echoes. |
| `HarmonicHubAuraSystem_Session126` | active | visual | `main.js` | `hub.harmony.high`, `hub.harmony.mid`, `hub.harmony.low` | Shared harmonic field around hub constellations. |
| `CanonicalTemplate3_StressVisuals` | active | main-loop | `main.js` | `global.metricFrame.updated`, `node.loadPressure.active` | Global stress-pressure ambience. |
| `AIConsciousnessLayer` | active | visual | `main.js` | `link.active`, `link.trafficIntensity.active`, `link.harmony.active`, `link.stability.active`, `system.storms.enabled` | Cognitive atmosphere layer with thought-thread presence. |
| `CognitiveHorizonPlane` | conditional | visual | `MapReferencePlaneFactory` | `map.referencePlane.selected`, `world.focusTarget.present`, `world.memoryPressure.active` | Map foundation plane, not controller-owned environment VFX. |

## Geometry notes

### Box geometry audit
- The only controller-owned environment system I found with explicit `BoxGeometry` in the active runtime pass is `_AmbientEntityManager.js`, inside `createSigmaPhantom()`. The boxes are intentional and update each tick.
- `SafeWorldFXPack` no longer uses box sprites for the world-scale cluster effects. Its moving clusters are `InstancedMesh` faceted shards / beads instead.
- The quick scan did not show `BoxGeometry` in `_SafeWorldFXPack.js`, `_SafeAIWeatherPack.js`, `DreamDepthEffectManager.js`, `EnvironmentalHazards.js`, or `_SafeQuantumIllusionsPack1.js`.

### Likely moving cluster source
- The world-space cluster that traverses the map is most likely `_SafeWorldFXPack.js`, specifically `fractal_sky.shards` and `energy_stream.*.beads`.
- Those clusters are updated by `updateFractalSky()` and `updateEnergyStreams()`.
- If they appear frozen in a browser, the likely cause is stale runtime wiring or a different build path, not missing animation code in the pack itself.

## Runtime conclusions

- `SafeAIWeatherPack` is active in the current controller wiring and is no longer a dormant placeholder.
- `SafeQuantumIllusionsPack1` is active and update-driven; it should be documented as a living environment layer, not a dead one.
- `SafeWorldFXPack` is the highest-risk controller-owned pack because its update signature expects richer world inputs than the controller currently passes.
- `AmbientEntityManager` is the main explicit box-geometry offender in the controller-owned environment surface, but it is intentional and animated.

## Square / quad surfaces to upgrade next

These are the current square-like or quad-like environment surfaces that should be upgraded to more expressive 2D forms.

| File | Effect / surface | Geometry currently used | Update status | Upgrade note |
| --- | --- | --- | --- | --- |
| [_SafeWorldFXPack.js](_SafeWorldFXPack.js) | `rift_wave` linear band | `PlaneGeometry(140, waveWidth, 1, 6)` | active | This is a major world-scale square/quad surface. It reads as a flat band right now and is the best candidate for a curved ribbon, segmented arc, or layered volumetric strip. |
| [_SafeWorldFXPack.js](_SafeWorldFXPack.js) | `screen_overlay_flash` | `PlaneGeometry(overlayStyle.flashSize.x, overlayStyle.flashSize.y)` | active | Screen-space flash quad. Could be upgraded to a radial burst mesh, layered sprite bloom, or segmented flare card. |
| [_SafeAIWeatherPack.js](_SafeAIWeatherPack.js) | weather veils | `PlaneGeometry(width, height, 1, 1)` | active | Repeated veil cards across weather moods. Good candidate for curved cloth strips or irregular ribbon sheets. |
| [_SafeAIWeatherPack.js](_SafeAIWeatherPack.js) | weather seams | `PlaneGeometry(length, thickness)` | active | Flat seam bands. Best upgraded into segmented arc ribbons or beveled strip meshes. |
| [_SafeAIWeatherPack.js](_SafeAIWeatherPack.js) | atmospheric wash | `PlaneGeometry(size, size)` | active | Full quad wash overlay. Could become a layered disk, softened radial dome, or gradient cloud sheet. |
| [_SafeAIWeatherPack.js](_SafeAIWeatherPack.js) | haze sheets | `PlaneGeometry(width, height)` | active | Multiple atmospheric layers. These are the most obvious square cards in the weather pack. |
| [_SafeAIWeatherPack.js](_SafeAIWeatherPack.js) | pulse clouds | `PlaneGeometry(size, size)` | active | Small square cloud cards; prime candidate for irregular blobby billboards or multi-lobed meshes. |
| [_SafeAIWeatherPack.js](_SafeAIWeatherPack.js) | aurora ribbons | `PlaneGeometry(260, 14)` | active | Long flat ribbon cards; should probably become curved ribbon strips or segmented shells. |
| [_SafeAIWeatherPack.js](_SafeAIWeatherPack.js) | pressure bands | `PlaneGeometry(320, 10)` | active | Similar to aurora ribbons but tighter. A strong candidate for a more organic pressure filament. |
| [_SafeAIWeatherPack.js](_SafeAIWeatherPack.js) | mood silhouettes | `PlaneGeometry(240, 22)`, `PlaneGeometry(280, 16)`, `PlaneGeometry(220, 24)` | active | These are the clearest square/quad silhouettes in the weather pack. Upgrade path: asymmetric silhouette meshes, broken arches, or layered outline geometry. |
| [DreamDepthEffectManager.js](DreamDepthEffectManager.js) | vignette / focus / pulse / glaze layers | `PlaneGeometry(2, 2)` | active | Classic full-screen quads. If you want them more sophisticated, this is a post-process layer redesign rather than a geometry swap. |
| [_AmbientEntityManager.js](_AmbientEntityManager.js) | `spectre.scanline` | `PlaneGeometry(0.6, 0.04)` | active | Thin quad scanline. Could become a segmented beam or soft ribbon slice. |
| [_AmbientEntityManager.js](_AmbientEntityManager.js) | `wisp.ribbon` | `PlaneGeometry(0.3, 2)` | active | Ribbon plane inside the wisp effect; a good candidate for curved strip geometry. |
| [EnvironmentalHazards.js](EnvironmentalHazards.js) | shared unit plane | `PlaneGeometry(1, 1)` normalized | active support geometry | The controller-owned hazard system keeps a normalized unit plane in shared geometry. It is support-level, not a visible effect by itself, but it is a quad primitive used by the hazard layer. |
| [_SafeQuantumIllusionsPack1.js](_SafeQuantumIllusionsPack1.js) | space drift veil / after-path ribbons / world bends sheet | `PlaneGeometry(8, 5, 16, 4)`, `PlaneGeometry(0.18, 3.5, 1, 4)`, `PlaneGeometry(0.05, 3.5, 1, 1)`, `PlaneGeometry(18, 9, 16, 8)` | active | These are the main illusion quads. The pack already animates them, but they still read as planes and could be upgraded to better 2D forms or curved layered ribbons. |

## Upgrade priority

If you want to replace square/quad forms with more sophisticated geometry, I would start in this order:

1. `_SafeAIWeatherPack.js` weather veils, seams, haze sheets, pulse clouds, and mood silhouettes.
2. `_SafeWorldFXPack.js` linear rift wave and screen-overlay flash.
3. `SafeQuantumIllusionsPack1.js` veil planes and after-path ribbons.
4. `DreamDepthEffectManager.js` only if you want to redesign the overlay style rather than the post-process shape itself.
5. `_AmbientEntityManager.js` scanline and wisp ribbon, if you want to move the ambient entity layer away from flat cards.

## Broader world / map quad sweep

These are additional quad-heavy environment systems outside the controller-owned core, but they still belong in the world/environment geometry review.

- [CascadeResonanceWaveVisualization_Session146.js](CascadeResonanceWaveVisualization_Session146.js) and [CascadeWaveParticles.js](CascadeWaveParticles.js): resonance rings, wave particles, and orbital plane geometry.
- [ColonyVFXManager.js](ColonyVFXManager.js): colony labels, panel cards, and atmosphere overlays built from quads.
- [SafeDreamDepthPack.js](SafeDreamDepthPack.js) and [DreamDepthEffectManager.js](DreamDepthEffectManager.js): the low-cost and rich screen-space depth layers.
- [SafeLegendaryWorldEvents.js](_SafeLegendaryWorldEvents.js): large banner, card, and overlay planes for rare event presentation.
- [MetricReactiveWorldEvents.js](MetricReactiveWorldEvents.js): metric bands, bars, flashes, and several large plane overlays.
- [WaveParticleEmitter_v1.js](WaveParticleEmitter_v1.js) and [_WorldPersonalityController.js](_WorldPersonalityController.js): world-scale pulse planes and mood bands.
- [_MythicRitualController.js](_MythicRitualController.js): ritual fissure plane and ceremonial overlay geometry.
- [DreamDesert.js](DreamDesert.js), [DreamDesert2.js](DreamDesert2.js), [QuantumIsland.js](QuantumIsland.js), [FractalValley.js](FractalValley.js), [SigmaRiftChamber.js](SigmaRiftChamber.js), [MemoryLane.js](MemoryLane.js), [CognitiveHorizonPlane.js](CognitiveHorizonPlane.js): map/world surfaces with large plane or sprite layers that are likely to need the same geometry upgrade pass.

This broader list is the best next source for the square-to-more-sophisticated-2D pass once the controller-owned world effects are handled.