Original prompt: tak jako composite glyphy mali lietať po orbite nodov ako GlyphLayer4_MultiFusion. mohol by si to spraviť tak prosim ťa

## 2026-04-04
- `WaveParticleEmitter_v1` was moved toward direct semantic metric-tier listeners for node-driven particle emission.
- The emitter now binds to `node.synergy.*`, `node.harmony.*`, `node.stability.*`, `node.corruption.*`, and `node.loadPressure.*` via `semanticBus` and keeps the wave snapshot path only as fallback when no tier listeners are active.
- The constructive burst variant-C init typo was fixed by restoring the correct `constructiveBurstVariantC` pool key.
- `main.js` now passes `semanticBus` into `WaveParticleEmitter_v1` so the direct metric listener path is officially wired.
- Browser smoke verified that `node.synergy.high` now dispatches into the emitter listener and spawns constructive particles again; the visible path is captured in `output/web-game/direct-metric-tier-visible.png`.
- The emitter still keeps the legacy wave snapshot path as fallback, but node-tier semantic events are now the primary local trigger path for wave particles.

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

