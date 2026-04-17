Original prompt: tak jako composite glyphy mali lietať po orbite nodov ako GlyphLayer4_MultiFusion. mohol by si to spraviť tak prosim ťa

## 2026-04-09
- `FractalValley.js` got a stronger composition pass: the bridge-zone water feature is larger and brighter, nearby playable terrain now has explicit bank relief and rolling shape instead of flattening into one broad plain, and the hero bridge itself is larger with longer rails, wider deck collision, and invisible rail blockers so it reads and behaves like a real landmark.
- `rosie/controls/rosieControls.js` now passes the player's current Y into analytic ground providers, and `FractalValley.js` uses that to stop the hero bridge from snapping the player onto the deck when moving underneath it. The Fractal Valley bridge was also tuned with longer top rails, lower deck clearance, larger local water feature dimensions, and sloped stone approach pieces so the bridge reads as docked into the terrain instead of hovering above it.
- `FractalValley.js` no longer treats the river as a full-map crossing. The old blocker corridor approach was removed and replaced with a localized water feature under the hero bridge: river-driven terrain shaping is now scoped to the bridge zone, floor wet tint is local, and the water mesh is now a compact pool/stream patch instead of a map-wide band.
- `FractalValley.js` river authority was corrected again: the visible water sheet is now much narrower than the playable river corridor, the valley floor wet tint was tightened to the true water footprint, and `getGroundLevelAt()` no longer clamps the player to a flooded river surface. In Fractal Valley, only terrain and bridge surfaces define walkable ground; river water is visual only.
- `FractalValley.js` was tightened around one authority: the hero bridge was moved to the main river corridor, river visuals were collapsed to a single water surface, and the terrain sampler now includes broad ridge shoulders so the visible hills are much closer to the actual walkable terrain.
- `FractalValley.js` got a harder cleanup pass: the hero bridge now uses one continuous deck instead of floating split segments, the river meander was straightened so the bridge crossing reads as the single main channel, side backdrop ridges were pushed outward, and the valley floor mesh density was raised to reduce apparent terrain drop-through on slopes.
- `FractalValley.js` now fully skips the fallback reference plane when the map config does not declare one, which removes the fake cyan ground-sheet/grid that was reading as a second crossing; the visible river surface was also narrowed and its edge alpha reduced so the dark center channel stays the only obvious water path.
- `FractalValley.js` then pivoted to a single broad main channel: added `getRiverChannelHalfWidth()`, widened the actual water surface to match the carved corridor, deepened the carve, reduced floor wet-tint authority, and softened the river shader's bright edge reading so the bridge crossing should read as one central river instead of a dark slit inside a fake larger river.
- `FractalValley.js` now suppresses ridge mass close to the river so hills rise out of the banks instead of intruding into the channel, the bank blend was deepened for a clearer trench, the hero bridge was rebuilt as a simple continuous deck with clean rails/posts, and `createDistortionWaves()` was neutralized so stray vertical plane-like map geometry cannot appear from this world file.
- `FractalValley.js` received a cleanup pass for world leftovers and river readability: it now removes inherited horizon/debug/fallback ground artifacts on boot, softens the terrain carve so the river reads more like a flooded corridor than a sharp trench, widens the actual water sheet to fill gaps between banks, and pulls the bridge abutments inward with deck overlap so the bridge no longer leaves a visible landing gap.
- `main.js` no longer injects demo `GravitationalAnomaly` hazards into `fractal`, so the black core + ring + veil artifact should stop respawning from the world bootstrap path, and `FractalValley.getGroundLevelAt()` now clamps to a flooded river level inside the main channel to stop the player dropping under the visual corridor when moving close to the river.
- `MemoryLane.js` was refactored toward a central AI data hall: added multi-level galleries, a stronger rotating core reactor, wall-mounted data displays, ceiling lattice, data cables, zone fog, and lower/warmer hall geometry so it no longer reads like a long corridor.
- `DreamDesert.js` now borrows the DreamDesert2 motif in a lighter form: slow orbiting sun, softer cloud layers, and slightly calmer sky/fog so the desert feels more cinematic without losing its warm identity.
- `DreamDesert2.js` was softened visually: muted dune palette, less white ridge highlights, reduced lighting intensity, quieter cloud layers, and a gentler moving sun/glow so the scene reads as one unified terrain instead of a high-contrast neon field.
- `FractalValley.js` now keeps only the unbroken hero bridge; the distant/broken bridge was removed from the spawn list so the valley reads as one clean crossing.

## 2026-04-08
- `FractalValley.js` river composition was simplified: the secondary flow overlay was reduced so the map reads as one dominant river channel, and bridge placements were nudged to sit more cleanly on that axis.
- `FractalValley.js` got a composition pass: bridge placements were nudged, bridge decks sit higher above the river cut, and the terrain now carves a corridor around bridges so the valley reads as one river crossing instead of layered clutter.
- `FractalValley.js` was softened toward a more walkable valley: gentler ridge slopes, higher max step height, deeper river carve, and higher bridge decks so the two bridges read as spanning one river channel instead of sitting under the terrain.
- `MainMenu.js` now exposes `DreamDesert2` as `MIRAGE VEIL` and adds `Memory Lane` to map selection; `main.js` now has a real `desert2` bootstrap plus a bootable `memory` world registry entry and switch/theme cycling support for both ids.
- `DreamDesert.js` was reworked toward a warm semi-realistic dream desert: asymmetrical dunes, a meandering dry channel, two stone landmarks, softened neon, and cinematic warm lighting/fog.
- Added helper terrain noise, a sand normal texture, warm sun glow sprites, mirage bands, and toned-down floating particles/fragments/crystals to improve depth without adding much draw cost.
- Syntax check passed with `node --check DreamDesert.js`.
- Browser smoke passed on `output/dreamdesert-active.png` after selecting `Dream Desert` from the main menu; the scene now boots with the warmer palette and landmarks visible.
- Existing startup noise still shows a pre-existing `AtomaAudioSystem` `AudioContext` error on first interaction; it did not block the desert visual smoke.
- Deterministic controller smoke confirmed the dune terrain is walkable: the player advanced 36 units across the dune path and `canMoveAfter` stayed `true`.
- The stone arch torus collider is now confirmed as a true blocker: the torus centerline reports `hasBlockingCollisionAt=true` and `canMoveAtTorus=false`.
- Dream Desert collision taxonomy is now stable in runtime smoke: 10 terrain surfaces and 5 blockers (`stoneArchTorus`, `stoneArchLeft`, `stoneArchRight`, plus the monolith blockers).
- Fresh browser profile still defaults to `fractal`, so the smoke explicitly launched `desert` via `window.atomaApp.startNew('desert')` before running the controller checks.
- Visual smoke artifacts were written to `output/web-game/dreamdesert-collision/dune-pass.png` and `output/web-game/dreamdesert-collision2/scene.png`.
- Dune terrain collision in `DreamDesert.js` was tightened again by raising the analytic dune height profile and increasing the desert climb budget, so the big dunes read more like real walkable hills instead of paper-thin props.
- The dune collision sampler now uses broader analytic influence and a stronger peak height, keeping the fix raycast-free and terrain-driven.
- A follow-up browser smoke on a dune climb path completed without console errors and produced `output/web-game/dreamdesert-dune-fix/dune-climb.png`.

## 2026-04-04
- `PHASE5_CascadePropagationVisuals` now spawns a 3-ring echo burst on each trigger and uses a per-source 3 second cooldown so the cascade reads as a tighter repeated pulse instead of a single expanding ring.
- `TopologyBiasVisualizationLayer` now has a stronger default pass for bias vectors and flow fields, plus a fallback visual path from recent influence activity so the topology layer remains readable even when active learning regions are sparse.
- `HarmonicRecoveryVisualSystem_Session138` was softened slightly so the midpoint coherence wave stays present but no longer dominates the recovery stack.
- `PHASE5_CascadePropagationVisuals` now listens directly to `link.harmony.low|mid|high`, resolves a link anchor midpoint from the active linking system, and spawns a visibly separated 3-ring echo cluster with a 3 second cooldown. This replaced the invisible dependency on cascade bridge timing for the main visible path.
- `ResonanceRuptureVisualSystem_Session133` thresholds were relaxed so normal 4-5 link smoke runs produce visible scars again, which in turn reactivates `HealingParticleSystem_Session136` and `HarmonicHealingVisualSystem_Session134` output.

## 2026-04-04
- `WaveParticleEmitter_v1` was moved toward direct semantic metric-tier listeners for node-driven particle emission.
- The emitter now binds to `node.synergy.*`, `node.harmony.*`, `node.stability.*`, `node.corruption.*`, and `node.loadPressure.*` via `semanticBus` and keeps the wave snapshot path only as fallback when no tier listeners are active.
- The constructive burst variant-C init typo was fixed by restoring the correct `constructiveBurstVariantC` pool key.
- `main.js` now passes `semanticBus` into `WaveParticleEmitter_v1` so the direct metric listener path is officially wired.
- Browser smoke verified that `node.synergy.high` now dispatches into the emitter listener and spawns constructive particles again; the visible path is captured in `output/web-game/direct-metric-tier-visible.png`.
- The emitter still keeps the legacy wave snapshot path as fallback, but node-tier semantic events are now the primary local trigger path for wave particles.
- `HarmonicHealingVisualSystem_Session134` now resolves link endpoints through the same fallback chain as the rest of the link stack (`sourceNode/source/from/nodeA` and `targetNode/target/to/nodeB`) instead of hard-blocking on `source/target`.
- `HarmonicHealingVisualSystem_Session134` and `HarmonicRecoveryVisualSystem_Session138` now expose explicit rebind / scene-reattach paths for world switches, and `main.js` calls them from the world lifecycle rebind hook.
- `HarmonicRecoveryVisualSystem_Session138` now reattaches its pooled meshes and healing particle scene ownership when the world scene changes, so the visuals do not stay pinned to an old world root.

## 2026-04-02
- `ResonanceCascadeVisualization_Session117B` is now fully functional in runtime and visibly spawns a readable scene ripple.
- The cascade now has a flat ripple plane and a thicker torus-based ring so it reads clearly without needing a link-specific debug path.
- Manual runtime verification confirmed the cascade root is attached to the scene and the visual spawn path is live.
- Investigated a reported lag / visual regression in the current session.
- The clearest new cost was the storage-vault embellishment in `EnhancedNodeModels`: extra ring geometry, a point corona, and a per-frame animation hook were added to the storage builder.
- Reverted that embellishment back to the lighter baseline (restored the memory shell and removed the extra corona / ring layer) to reduce draw cost and visual clutter.
- Runtime reload after the revert looks cleaner; if lag still appears in dense link scenes, the next likely target is `LinkRendererConduit` bootstrap staging and debug logging.
- `LinkRenderLayerPolicy` now also carries the link bootstrap budget helper, and `LinkRendererConduit.updateAll()` uses it to time-slice bootstrap advancement across frames.
- Investigated the render hot path from the current profile and treated it as a link-VFX cost issue, not a node shader issue.
- Froze static link FX renderables by disabling `matrixAutoUpdate` on shared point-cloud pools, bead trails, corruption particles, spark pools, arc discharge lines, and static conduit strand/depth meshes.
- Next verification step is a fresh browser profile capture to confirm whether `updateMatrixWorld` shrinks enough or whether braid/skin geometry rebuilds are still the remaining hotspot.
- Added `LinkCreateStagePolicy.js` as the orchestration layer for staged link creation, with a 12-frame map plus prep phase and explicit out-of-band global systems.
- `LinkRendererConduit` now records bootstrap stage metadata and uses the new policy for its bootstrap phase ceiling, but the global bridges in `main.js` remain separate for now.

## 2026-03-28
- Composite glyphs now receive an orbit anchor and orbit parameters from `GlyphFusionZone`.
- `NeuralConvergenceSingularity` now updates its world position by orbiting around the anchor instead of sitting statically on the node center.
- Goal of this pass: match the orbit feel of `GlyphLayer4_MultiFusion` while keeping the internal singularity visuals intact.
- Validation result: orbit motion is visible in runtime screenshot `output/web-game-orbit/shot-0.png`.
- Existing console error still appears in the browser loop: `[SemanticGlyphAI] Integrity mismatch: fusionRegistry.size !== aiNodes.nodes.length ...`; this was present before the orbit change and is not caused by this patch.
- Root cause refinement: `CompositeGlyphGenerator` was flattening the orbit structure into a merged `BufferGeometry`, which can turn the visual into a static blob. Added `generateCompositeVisual()` so fusion can keep a live `Object3D` instead.
- Fixed a missing `getCompositeColor()` helper in `CompositeGlyphGenerator` that broke the new live visual path at runtime.
- Runtime smoke test now confirms `generateCompositeVisual(['RING','ARROW'], ...)` returns an `Object3D` with children instead of a geometry blob.

## 2026-04-12 -- Menu-owned environmental hazards toggle
- Added `environmentalHazards` to menu profile settings and exposed it in both Main Menu and Pause Menu alongside postprocessing and semantic pictograms.
- `main.js` now applies `menuSettings.environmentalHazards` at boot and exposes `setEnvironmentalHazardsEnabled(...)` for runtime toggling.
- `EnvironmentalHazards.js` now has a real enabled/disable gate that hides the root, skips update/effect queries, and can be re-enabled without reload.
- Browser smoke confirmed the toggle persists in localStorage, boots into `window.game.environmentalHazardsEnabled=false`, and can be flipped back on from the pause menu.

## 2026-04-12 -- NodeMetricEngine archetype seeding fix
- `ensureMetrics()` now seeds placeholder/default canonical metrics from `node.userData.archetypeMetrics` instead of leaving nodes at `{ stability: 1, corruption: 0 }` when a registry snapshot exists.
- Added regression coverage for placeholder seeding vs live-value preservation.
- Verification: `node --check src/metrics/NodeMetricEngine.js`, `node --check tests/MetricsAuthority.test.js`, `node tests/MetricsAuthority.test.js`.

## 2026-04-12 -- CoreMetricsHUD tween smoothing
- `CoreMetricsHUD` now animates metric display changes with an explicit tween state instead of stepping directly toward the new target each frame.
- This keeps HUD values and bars from snapping to the final post-link network metrics in a single update.
- Runtime probe on the local app confirmed the HUD values move gradually over successive 500 ms samples after forcing a stable target snapshot.
- Verification: `node --check CoreMetricsHUD.js`, `node --check CoreMetricsOverlay.js`, `node --check main.js`, plus a Playwright browser probe against `http://127.0.0.1:5500/index.html`.
- Added an origin safety guard in `ProceduralHarmonicGlyphGenerator` so procedural glyphs do not spawn in the center cluster when `region.center` is near the map origin.
- Found the middle-map pictogram artifact source: `LinkSemanticPictogramSystem_Enhanced` was resolving link endpoints only from `link.userData.nodeA/nodeB`, while active links in `main.js` store endpoints on `sourceNode/targetNode` and `source/target`. This left pictograms stuck at `(0,0,0)` when no curve was present.
- Fixed the enhanced pictogram link resolver to use the same endpoint fallbacks as the rest of the link stack so glyphs travel on links instead of accumulating at the world origin.
- Unlink cleanup pass: `main.js` now directly unregisters `LinkedGlyphMessaging3_0`, clears `SynergyCascadeVisualizer`, and clears `ResonanceCascadeVisualization_Session117B` from the link removal wrapper so unlinking a node removes the live visual residue immediately instead of waiting for fade-out.
- `SynergyCascadeVisualizer` now supports `clearLink(...)`, tags particles with link metadata, hides pooled meshes when they are returned, and fully clears active particles/ripples on cleanup.
- `ResonanceCascadeVisualization_Session117B` now supports `clearLink(...)` so active resonance waves tied to a removed link can be dropped instead of decaying in place.
- `LinkedGlyphMessaging3_0.unregisterLink()` now synchronizes its debug stats immediately after removal so the unlink state is reflected without waiting for the next update tick.
- `StandingWaveVisualRenderer_Session131` now gives antinode torus meshes a short lifetime, 5s cooldown, and a noisy dissolve profile so they fade out instead of popping.
- Runtime smoke test on `output/web-game-antinode/shot-0.png` stayed visually stable; only the pre-existing `SemanticGlyphAI` integrity mismatch console error remains in `output/web-game-antinode/errors-0.json`.
- The wave debug overlay in `main.js` now reports reflection pulses, active trap count, and trap amplitude peak/average under the existing `R/T/A` line.
- The wave debug overlay now also reports the primary standing-wave trap `state` and `trapRadius` so trap lifecycle is visible without opening the system internals.
- Fixed `StandingWaveVisualRenderer_Session131.clearLink(...)` by adding its missing `_resolveLinkId(...)` helper; unlinking a node no longer throws `this._resolveLinkId is not a function`.
- Runtime sweep on 10 links: standing-wave traps, resonance ruptures, echo trails, hub aura, and cascade particles all became active; `HarmonicResonanceFeedbackSystem` stayed at 0 active fields and `HarmonicInfluencePropagationSystem` stayed idle.
- Standing-wave trap zones remain a separate bug: the trap system reports active trap zones, but `StandingWaveVisualRenderer` leaves `trapZoneMeshPool` at 0 active meshes in the current scene.
- Trap-zone redesign pass: replaced the placeholder plane with a composite singularity-style visual (dark core, orbital torus rings, shock halo) in `StandingWaveVisualRenderer_Session131`, and wired trap-zone sync so the renderer gets fresh trap state immediately before draw.
- Runtime verification after the redesign: `trapZoneMeshPool` now reports active visible singularity meshes again, and the on-screen trap zone reads as a real event-horizon style VFX instead of a flat plane.
- Antinode redesign pass: replaced the single torus glow with a Broken Möbius-style segmented wireframe antinode (6 partial segments plus a small shell), with phase-mismatched rotation and dissolve behavior preserved.
- Runtime verification for the antinode pass: 6 links created successfully in the browser, standing-wave debug overlay reported `R:18 | T:6 | A:1` with `P:6`, `amp:2.32`, `peak:2.73`, and screenshot `output/broken-mobius-check.png` showed the segmented antinode visuals active in-scene.
- Trap-zone motion polish: softened the secondary orbit in the trap zone so the smaller torus uses a slower, more predictable drift and less phase noise while the primary torus remains unchanged.
- Runtime verification for the trap-zone polish: `node --check StandingWaveVisualRenderer_Session131.js` passed and screenshot `output/trapzone-secondary-tune.png` confirmed the calmer secondary orbit still renders with active traps.

## 2026-03-30
- `LinkResonanceFlowSystem_Session124.js` now has a stability-driven visible floor on top of the existing load-pressure flow. Stable links seed deterministic pulse bursts instead of staying ambient-only.
- `ResonanceEchoTrailSystem.js` now reads canonical fusion-state aliases (`harmonyBalance`, `averageSynergy`, `stability`, etc.) instead of falling back to default values, which was a real source of inconsistency.
- The echo trail spawn path is now visible-first: composite states are banded into deterministic echo counts instead of relying on a low random spawn chance.
- The burst path (`spawnEchoTrail`) now also uses the same visibility profile so wave/burst events do not go silent at moderate intensity.
- Browser smoke on the module directly confirmed the new behavior: a synthetic fusion state with `averageSynergy=0.44`, `harmonyBalance=0.62`, `stability=0.71` produced active echoes with stronger opacity/scale, and the status readout showed active echo pooling working.
- Console logging from the live app is still very noisy in the Playwright smoke, but the new echo system logs now show real spawn activity instead of a dormant summary.

## 2026-03-31
- Root cause for `LinkResonanceFlowSystem_Session124` staying at `linksWithFlow = 0`: `main.js` was calling `linkRendererConduit.updateLinkResonanceFlow()`, but the conduit instance in this runtime did not have `linkResonanceFlowSystem` wired in, so the call was a silent no-op.
- Fixed by wiring `this.linkRendererConduit.linkResonanceFlowSystem` and `this.linkRendererConduit.linkResonanceSystem` to the canonical flow system during setup, and by falling back to the direct system update when the conduit has no attached flow authority.
- Second root cause: the flow system was reading `loadPressure` and `stability` only from `link.userData.metrics`, but the live links had those metrics hydrated on their endpoint nodes, not on the link object itself.
- Fixed by making `_readLinkPressureMetrics()` endpoint-aware and by switching the flow update cadence to a `deltaTime` accumulator so the visual spawn loop keeps moving even if VisualTime/frameId is not reliable in this path.
- Browser smoke after the fix: creating 10 links produced `linksWithFlow = 10`, `pulseSpawnCount = 68` immediately after creation, and `pulseSpawnCount = 374` after 10 seconds. `cascadeVisualizer`, `resonanceEchoTrailSystem`, and `wavePatternSystem` also stayed active in the same run.
- `SynergyCascadeVisualizer` now seeds from the canonical `link.created` / link-birth path with the live link object, not just the one-shot create spike path.
- Cascade history retention is now age-based instead of random per-frame deletion, so heartbeat repeats can survive long enough to respawn on cooldown.
- Playwright smoke on 10 links confirmed `cascadeHistory.size = 10` after create, `cascadeActive = 10` after 10 seconds, and the visual stack still retained cascade state after 20 seconds instead of dropping to a dead zero-state immediately.
- `WaveInterferencePatternSystem_Session132` now seeds a birth-interference pair from link creation, resolves link ids against the live linking authority, and keeps orphaned birth pairs on a grace lifecycle instead of deleting them immediately on unlink.
- Playwright smoke on 10 links showed visible wave birth zones immediately after creation (`birthPairs = 10`, `zones = 165`, `meshes = 15`), confirming the birth-seed path is live-first. The runtime later cleared all links and wave state around the 10s mark, which looks like broader world lifecycle traffic rather than a wave-system crash.
- Follow-up 30-second uninterrupted smoke proved the network does not deterministically clear at 10s: 10 links stayed alive the entire run with `birthPairs = 10` and `linkCount = 10`. The earlier zero-state was caused by dev-server live reload / session churn during file edits, not by a runtime cleanup timer.
- Birth-seeded wave visuals now get a dedicated torus pulse ring, stronger spike bias, and a boosted emergence opacity so the seed reads as a distinct event rather than another center flash.
- `StandingWaveVisualRenderer_Session131` now has a matching pulse ring in trap zones so its standing-wave language stays visually aligned with the birth-seed wave style.
- `SynergyCascadeVisualizer` now uses a batch `THREE.Points` emitter for `flowParticles` while keeping burst particles and ripples mesh-based; this cut the flow draw cost while preserving the create/hop heartbeat behavior.
- Browser smoke after the batch pass on 8 links ended with `flowCount = 94`, `burstCount = 54`, `rippleCount = 36`, and `lastUpdateTime ≈ 1.4ms`, which is materially better than the pre-batch particle ceiling while still reading visually as a cascade flow.
- Cascade visibility thresholds were lowered to `0.1 / 0.2 / 0.3` for single/double/triple bands, with the visible floor reduced so low-synergy links still produce a readable effect instead of going silent.
- Added `window.__DEBUG.triggerCascadeAtNodeId(nodeId, intensity)` and the alias `window.__DEBUG.spawnSynergyCascadeAtNodeId(nodeId, intensity)` as a thin console helper for manual cascade spawning without needing a node object.
- The manual helper returns the resolved node on success, so it is easy to confirm from console that the spawn request actually hit the live runtime.
- `SynergyCascadeVisualizer` now has a forced burst heartbeat every 3 seconds per live link, independent of synergy metrics, so burst visuals do not rely on threshold gating to remain visible.
- Runtime smoke on 3 links confirmed the forced burst counter rising from `0` to `3` after ~4s and to `9` after ~8s, which matches the intended 3-second cadence.
Original prompt: reduce synergy cascade visual clutter and make the repeated beat easier to read

2026-03-31
- Swapped the repeated 3s beat in `SynergyCascadeVisualizer` from `burstParticles` to `flowParticles`.
- Reduced burst particle size/opacity and pushed burst back to metric-gated cooldowns at 5s.
- Controlled smoke confirmed `forcedFlowSpawns=3`, `flowParticles=240`, `burstParticles=12` after three simulated heartbeats.
- Current visual contract: `flowParticles` = recurring signature, `burstParticles` = smaller metric accent.

- Staggered the cheap heartbeat log win: LinkRendererConduit pictogram heartbeat is now debug-gated, and ResonanceEchoTrailSystem lifecycle/summary logs are now console.debug behind the render-discipline flag.

- Silenced the last visible heartbeat spam by moving GlyphFusionZone and LinkSemanticPictogramSystem_WithFusion lifecycle summaries behind explicit debug flags and console.debug.

- Switched the two successful main.js init messages (NetworkFatigueSystem and LinkSemanticPictogramSystem) from console.error to console.info, so the normal boot path no longer shows them as errors.

- Cleaned the last remaining boot error by changing the Network Fatigue console API bootstrap message in NetworkFatigueSystem_v0.js from console.error to console.info.
## 2026-04-02
- Tuned strand-tip sparks in LinkRendererConduit to be slightly more frequent, brighter, and longer-lived without touching LOD.
- Increased strand-tip spark frequency/visibility a bit more: lower spawn gate, longer life, brighter gain, and slightly larger size.
- Strand-tip sparks were pushed to a very aggressive visibility mode: 20x point size and near-zero spawn gate.
- Strand-tip sparks now follow a LinkSparkSystem-like lifecycle: explicit LINK_SPARKS render order, frozen matrix, and opacity scaled by active spark count.
- Strand-tip spark ownership moved out of `LinkRendererConduit` into `LinkTrailParticleSystem.js` as `LinkStrandTipSparkVisual`; the conduit now only delegates spawn/update while the spark buffers and scene attachment live in the trail subsystem.
- Smoke test after the move passed syntax checks and loaded `http://127.0.0.1:5500/index.html` cleanly, but the screenshot did not include an active spark-emission link yet.
- `LinkSparkSystem` point sprites were scaled up by 50% to read less tiny in-scene, without changing cadence or spawn rules.
- Final conduit performance cleanup reused the heavy-links scratch array and cached the shared particle-system cadence boolean in `updateAll()` to avoid per-frame `filter()` churn and duplicate cadence checks.
- Post-cleanup browser smoke on `http://127.0.0.1:5500/index.html` passed and the scene remained visually stable.

- 1003 prime redesign implemented in EnhancedNodeModels.js; next step is runtime smoke verification and visual inspection.
- Legacy CanonicalGeometryFamilies.createPrimeStellaOctangula() left untouched.


- Refactored 103 createInputIncomingFunnel into a ritual-aperture design in EnhancedNodeModels.js with dedicated caches/materials, keeping NodeVisualRegistry.js untouched.
- Runtime smoke intentionally skipped per request; syntax check passed.

2026-04-04
- NodeInspectOverlay_1_0 no longer auto-dismisses itself on link.created; the first link should not kill inspection state anymore.
- LinkQualityCalculator now emits initial link tier events on first observation, so `link.harmony.*` consumers can react immediately when a link is created.
- Fixed a missing `LinkQualityCalculator._clamp01()` helper that was preventing link-tier emission from completing.
- Aligned link-tier payload `linkId` with the runtime link id (`link.id`) so recovery/healing consumers can resolve the same link object.
- Verified in browser smoke: `link.harmony.mid` is emitted immediately on fresh link creation, `HealingParticleSystem_Session136` gains a wave, and NodeInspect stays visible with live metrics.
- Unified `HarmonicHealingVisualSystem_Session134` and `HarmonicRecoveryVisualSystem_Session138` to one per-link cooldown model each:
  - Healing uses `config.linkCooldown` instead of separate high/mid/low cooldowns.
  - Recovery uses `config.linkCooldown` instead of separate wave/stitching/halo cooldowns.
- Runtime smoke confirmed the shared gate behavior: first tier event spawns, the immediate follow-up is blocked, and the next event after cooldown spawns again.
- Moved the visible echo ring presentation into `SynergyCascadeVisualizer` for `link.harmony.*` and demoted `PHASE5_CascadePropagationVisuals` to a subtle single-ring support path.
- Browser smoke after the move confirmed the Synergy echo path is visible on 5 fresh links without the old PHASE5 echo burst dominating the frame.
- Moved topology visualization off the dedicated overlay and into `SynergyCascadeVisualizer` as a snapshot-driven visible feedback path.
- `TopologyBiasVisualizationLayer` now publishes `topology.bias.snapshot` and defaults its own debug draws off so it no longer competes with the showpiece layer.

2026-04-08
- Reworked `EmergentThoughtStorms5_0.js` so local storm spawning now uses real recursive/link scope data instead of the old placeholder density path.
- Added a layered ATOMA-v2 silhouette to Emergent storms: core, shell, halo, orbiting glyphs, tracked arcs, and expanding ripples.
- The storm update loop now uses storm-local elapsed time, so orbiting shapes and arcs animate consistently instead of leaning on the throttle accumulator.
- `EnvironmentEventCoordinator.js` already owns the `global.<metric>.high` legendary world-event bridge, so no extra global adapter was needed for this pass.
- Restored the root `_EmergentThoughtStorms5_0.js` entry as a shim to the legacy implementation path so `main.js` imports keep resolving cleanly.

## 2026-04-10
- Visual pass started around node/link presentation only: `EnhancedNodeModels` left untouched, while `_NodeVisuals4_0.js` gained deterministic outer shell/orbit accents and `NodeLinkingSystem.js` now tints selection glow from the node's own color instead of a fixed cyan/purple stack.
- `_UICategoryLegend3_1.js` got a lighter atmospheric polish so non-zero categories read as active and the legend matches the sharper node/link visual language.
- Follow-up visual pass strengthened the node silhouette and link language further: `_NodeVisuals4_0.js` now has a larger tri-axis aura stack and stronger outer shell presence, while `NodeLinkingSystem.js` adds anchor flares at link endpoints/midpoint and higher-contrast additive glow layers.
- `_UICategoryLegend3_1.js` marker text was corrected so the category bars no longer show the extra prefix marker.


## 2026-04-11
- Headless Playwright measurement in Edge confirmed the link-hot path is deferred to the next render frame, not the synchronous createLink call.
- One fresh link on a clean runtime raised enderer.info.programs from 96 to 108, with createLinkById sync time only ~11 ms but the next two frames taking ~611 ms total.
- A 4-link burst measured per-link frame stalls of ~1277 ms, ~372 ms, ~254 ms, and ~317 ms, so the issue is a shader compile/link burst on link visuals rather than an unbounded leak.
- Canonical lookup for link creation uses 
ode.userData.nodeId, not numeric 
ode.id; createLinkById must use the canonical string ids.


## 2026-04-11
- Identified the synergy shader hot path: SynergyBonusFXLayer_v1 and SynergyResonanceShaderPack_v1 are initialized in main.js around lines 10151/10171 and updated in the visual scheduler around lines 4609/4614 and 11443/11448.
- Added a runtime helper window.disableSynergyShaderStacks() in main.js to dispose/null the two synergy shader packs without touching the rest of the link stack.
- Added a boot-time flag in main.js and index.html to try disabling the stack by default, but the live browser verification still shows the flag being overridden / not sticking in the current boot path. That needs one more boot-order pass before it can be treated as verified.
- Verified main.js still passes 
ode --check after the change.

- 2026-04-11: Performance pass in link hot path started. Stabilized program cache keys for `LinkRendererConduit`, `WaveTravelShaderPack_v1`, `LinkStateVisualLanguageIntegration`, and `LinkAuraShader`; `LinkRendererConduit` now also binds a canonical key for `skinMaterial` coming from `createLinkAuraMaterial`. Next step is a browser timing run on first-link and multi-link bursts to see whether the render-frame compile spike dropped.
- 2026-04-11: Added canonical program cache keys to `LinkRendererConduit`, `WaveTravelShaderPack_v1`, `LinkStateVisualLanguageIntegration`, `LinkAuraShader`, and `LinkPointFXBase` (for spark/link point FX). Also bound the link skin material from `createLinkAuraMaterial` to the link cache key in `LinkRendererConduit`.
- 2026-04-11: Browser timing in `quantum` still shows a large first-link compile burst (`renderer.info.programs` jumping roughly 86 -> 106/103 on the first link and then small deltas after that). The four-module pass did not materially remove the first-link stall. Next hotspot to inspect is the post-link fanout in `main.js` (`LinkSparkSystem` / `linkAuraSystem.registerLink`) and any remaining link-specific FX helpers.
- 2026-04-11: `LinkSparkSystem` was refactored to use one shared module-level `ShaderMaterial` with per-object uniform binding via `onBeforeRender`. The spark visuals stayed intact in a screenshot sanity check, and the spark shader now compiles once instead of once per system instance.
- 2026-04-11: Even after the shared spark material pass, first-link timing in `quantum` still shows a large deferred render spike. That means the remaining cost is still in the broader link fanout / render path, not in spark material creation itself.
- 2026-04-11: Follow-up FX cleanup on the link stack: `LinkPulseRing` now reuses a shared segment geometry instead of building four torus geometries per instance, the dead aura path is now lazy/disabled by default, and `LinkBeadTrailSystem` now uses partial buffer uploads with a smaller default pool (384 instead of 600). Browser smoke on `http://127.0.0.1:5500/index.html` stayed visually intact; after creating one link, `pulseVisible=true`, `sparkVisible=true`, `trailVisible=true`, and the screenshot `output/web-game/fx-stack-smoke.png` shows the link FX stack still readable.
- 2026-04-11: The remaining next hotspot is likely the broader link fanout / update cadence in `LinkRendererConduit` rather than the basic pulse ring or bead trail materials. If first-link stalls remain high after this pass, inspect staging of `pulseRing`, `beadTrails`, and any deferred post-link FX spawns before introducing new visuals.
- 2026-04-11: Broader link fanout staging was tightened in `LinkRendererConduit`: phase 2 now creates only the core pulse ring, phase 3 now handles ring trail initialization plus the pulse dust emitter, and phase 4 remains the directional streak bootstrap. This spreads the first-link FX setup across more frames instead of packing ring, dust, and trails into the same early slice.
- 2026-04-11: `LinkCreateStagePolicy` was updated to match the new bootstrap split so the stage manifest stays aligned with runtime behavior (`ring trails + pulse dust emitter` now in phase 3, `pulse ring + arc discharge + directional streaks` in phase 4).
- 2026-04-11: Fresh browser smoke after the bootstrap split stayed clean and visually readable. On one created link, the staged samples progressed as expected: first the ring was absent, then the pulse ring appeared, then ring trails + dust emitter became visible, and finally sparks joined in. Screenshot artifact: `output/web-game/fx-stack-smoke-2.png`.
- 2026-04-11: `LinkRingArcDischarges` now boots in slices instead of all at once: constructor creates only the core group when `deferPools` is enabled, then the impact spark pool, ripple pool, and packet pool are warmed in later conduit bootstrap slices. Spawn paths can still lazy-init their pool if a pulse hits before the staged warmup completes. Browser smoke on a fresh reload stayed visually intact; the staged samples showed the ring first, then pulse ring / dust, then arc discharges, then sparks and trails.
- 2026-04-11: Continued link FX cleanup on the directional / ring side. `LinkDirectionalStreaks` now lazily creates its color-dynamics and gradient-polish helpers and no longer emits periodic opacity logs in the normal hot path. `LinkEnergyRingSystem` now supports deferred geometry-pool initialization, and `LinkRendererConduit` boots the ring system with deferred geometry then warms the pool later in the staged link bootstrap. Browser smoke on `http://127.0.0.1:5500/index.html` stayed visually intact: one created link showed `streaks=true`, `rings=true`, `arcDischarges=true`, and a manual `emitRing()` call succeeded with `poolReady=true`. Screenshot artifact: `output/web-game/link-stack-directional-energy-smoke.png`.
- 2026-04-12: Disabled `CanonicalTemplate3_StressVisuals` and `StressVisualShaderSystem` by default via `window.stressVisualSystemsEnabled = false` in `main.js`.
- Added runtime toggles: `window.enableStressVisualSystems()` and `window.disableStressVisualSystems()`.
- Verified in Edge smoke: `stressEnabled=false`, both helpers exist, stress node maps remain empty at boot.
## 2026-04-12 — Link semantic pictogram refactor

- Extracted the active glyph builders from `LinkSemanticPictogramSystem_Enhanced.js` into `LinkSemanticPictogramGlyphBuilders.js` so lifecycle/state code is separated from glyph construction.
- Added runtime glyph scale control on the pictogram system: `setGlyphScale()`, `setMetricGlyphScale()`, `getGlyphScale()`, and `refreshActiveGlyphScales()`.
- Fixed size handling so synergy glyphs now respect the same scale contract as the other active glyph builders.
- Fixed link removal cleanup order: semantic pictograms now dispose only after the link is removed from live link arrays, preventing respawn from stale `_lastLinks` cache.
- Verified with Node syntax checks and a Playwright/Edge smoke:
  - glyph scale helper exists and updates runtime scale
  - link create/remove path now drops active pictograms to zero after unlink

## 2026-04-12 — Core metrics semantics fix

- Fixed the `networkStress` drift in `SemanticMetricAdapter.js`: HUD/global projection now treats `networkStress` as the inverse of `stability`, while preserving `stability`/`stabilityNorm` as the stability value.
- `CoreMetricsViewModel.js` now stores actual stability separately from `networkStress`, instead of mirroring stress into `stabilityNorm`.
- `CoreMetricsOverlay.js` now normalizes its fallback calculator path through `withGlobalMetricAliases()`, so the HUD sees the same canonical metric shape in both overlay modes.
- `src/metrics/NetworkMetricsAggregator.js` now publishes `stability` alongside inverted `networkStress`.
- Added regression tests in `tests/MetricsAuthority.test.js` for:
  - empty HUD projection staying neutral
  - `stability -> networkStress` inversion
  - `updateHudMetrics()` deriving stress from `stabilityNorm`
- Verification:
  - `node --check` passed on all touched files
  - `node tests/MetricsAuthority.test.js` passed

## 2026-04-12 — Registry metrics propagation fix

- Fixed `MetricsRuntime_v1._ensureNodeCanonicalFallbacks()` so it no longer collapses registry-backed node stability to `1` when `userData.instability` is missing.
- The fallback now prefers `node.userData.metrics.stability` / `userData.stability` before deriving from instability, and mirrors `stability` + `instability` back onto `node.userData`.
- Fixed `CoreMetricsOverlay` event-fed cache reads so partial metric updates are merged with the node's canonical metrics instead of replacing them. This prevents harmony-only cache snapshots from zeroing `stability`, `corruption`, and `loadPressure`.
- Added a regression test for canonical fallback preservation on a prime node snapshot.
- Verification:
  - `node --check MetricsRuntime_v1.js`
  - `node --check CoreMetricsOverlay.js`
  - `node tests/MetricsAuthority.test.js`

## 2026-04-12 — Metrics write-path and wave emitter cleanup

- `NodeMetricEngine.updateNodeMetrics()` now batches clamp/load-alias writes by touched node instead of rewriting aliases repeatedly in the hot loop. This should reduce the `applyArchetypeClamp` / `syncLoadAliases` proxy churn visible in the performance call tree.
- `ParticleStreamCascadeAccelerationIntegrationPatch` no longer applies cascade acceleration to constructive bursts, so the synergy constructive-trident family keeps its original straight-out emission feel instead of picking up the sideways cascade deflection.
- Verification:
  - `node --check src/metrics/NodeMetricEngine.js`
  - `node --check ParticleStreamCascadeAccelerationIntegrationPatch.js`
  - `node tests/MetricsAuthority.test.js`

## 2026-04-12 — Cascade acceleration disabled

- `ParticleStreamCascadeAccelerationIntegrationSetup` is no longer booted by default in `main.js`.
- The runtime now leaves `window.ATOMA_DISABLE_PARTICLE_CASCADE_ACCELERATION = true` on startup, so the cascade acceleration / flow deflection layer stays disconnected and particles keep the simpler straight emission path.
- Runtime toggles were added for manual control if needed:
  - `window.enableParticleCascadeAcceleration()`
  - `window.disableParticleCascadeAcceleration()`
- Verification:
  - `node --check main.js`

## 2026-04-12 — Constructive particle path straightened

- `WaveParticleEmitter_v1` no longer emits constructive link bursts along the quadratic arc path with lateral offsets.
- Constructive link particles now spawn from the source position, keep zero build-offset, and continue with a straight release vector instead of the old side-bending curve.
- Verification:
  - `node --check WaveParticleEmitter_v1.js`
  - `node --check main.js`

## 2026-04-12 — WaveParticleEmitter rollback to commit baseline
- Restored constructive link burst behavior in WaveParticleEmitter_v1.js to match commit 5f0811c0a2bd5bc85ba1bc4cbf58e53b9a5085f8: link bursts use arcPath + tangent release again, and the extra straight-line fallback / helper was removed.
- Verified with git diff against the commit: WaveParticleEmitter_v1.js now matches the baseline exactly.
- Verification: node --check WaveParticleEmitter_v1.js passed.

## 2026-04-17
- QuantumIsland cleanup: disabled the map-owned reference plane for `QuantumIsland` and stopped creating the local mist plane so the square ground-sheet artifacts disappear from this world.
- Performance fix: `_SafeEvolutionManager` no longer does a full `scene.traverse()` for every registered node on every frame; it now rebuilds a per-frame node lookup from the provided `nodes` array and only falls back to traversal on cache misses.
- Validation: `node --check _SafeEvolutionManager.js`, `node --check MapConfigBase.js`, `node --check QuantumIsland.js`.
- Added temporary runtime debug toggles for `NodeVisuals4_0`, `SafeEvolutionManager`, and `NodeMicroEvents` via `window.__DEBUG` and `window.ATOMA_DEBUG_TOGGLES`.
- Each system now has a real `enabled` gate so the visual stack can be isolated live without reload.
- Verification: `node --check _NodeVisuals4_0.js`, `node --check _SafeEvolutionManager.js`, `node --check _NodeMicroEvents.js`, `node --check main.js`.
