**Link Lifecycle Map (High-Level)**
Player input → `NodeLinkingSystem.createLink(sourceNode, targetNode)` (`NodeLinkingSystem.js:3495`) → link object (id `link-${counter}`, refs to source/target, traffic metrics, userData holder) created and pushed into `linkingSystem.links` + nodeId indexes → visuals created via `LinkRendererConduit.createLinkVisuals(link)` (`LinkRendererConduit.js:581`) producing `link.group`, strands/skin/pulse/etc., and assigned back to `link.group` → `link.group` added to `linkRoot/scene` → ancillary registries: `visuals.registerLink(link.id, link.group)` (NeonLinkVisuals), thickness system, priority system, emission pulsing → per-frame `NodeLinkingSystem.update()` iterates `links`, builds frameState, calls `conduitRenderer.update(link, dt, time, frameState)` (computes curve, frames, updates all conduit VFX), updates flow/thickness/color transitions, then global pictogram tick `conduitRenderer.updatePictograms(dt,time)` → render via three.js scene graph (braid meshes, aura, particles, pictograms).

**Key Files & Roles**
- `NodeLinkingSystem.js`
  - Creation: `createLink()` (braided conduit, primary), `createLinkLegacy()` (fallback extreme mode).
  - Registration: pushes to `this.links`, `nodeIdToLinks`, marks dirty; registers with NeonLinkVisuals (`this.visuals.registerLink`), thickness system, priority, emission pulsing.
  - Per-frame update: `update()` (~link loop around 4721) -> conduit update; later `updatePictograms()` call (~4783); then trail/healing particles and thickness animate.
  - World lifecycle: `resetForWorldRebuild` (7040) disposes visuals but keeps link objects & queues rebuild; `resetForWorldSwitch` (7094) similar for world swap.
- `LinkRendererConduit.js`
  - Constructor wires pictogram system (`new LinkSemanticPictogramSystem_Enhanced(scene, linkingSystem, camera, conduitRoot)`).
  - `createLinkVisuals(link)` builds `link.group`, strands, aura skin, bead/spark/trail/healing/pulse/wave/arc/streak systems; freezes variant props; returns group.
  - `update(link, dt, time, frameState)`: computes start/end, builds `QuadraticBezierCurve3` (`link.curve = mainCurve`) and Frenet frames; stores `frameState.geometry` and `link.userData.linkDirection`; updates VFX modules.
  - `updatePictograms(dt,time)`: calls pictogram system once per frame.
  - `disposeLinkVisuals(linkGroup, link)`: tears down all per-link visuals.
- `LinkSemanticPictogramSystem_Enhanced.js`
  - Global pool; uses `link.curve.getPointAt(t)` for position; update called from Conduit.
  - Spawn log now minimal; pictograms ignore raycast.
- `NeonLinkVisuals.js`
  - Secondary visual system (neon line/glow/particles); `registerLink(linkId, mesh)` stores state in `linkStates`.
- Other visual modules touched via Conduit `createLinkVisuals`: `LinkBeadSystem`, `LinkSparkSystem`, `LinkBeadTrailSystem`, `LinkEnergyRingSystem`, `LinkPulseRing`, `LinkEnergyWave`, `LinkRingArcDischarges`, `LinkDirectionalStreaks`, `LinkCorruptionParticleSystem`, `LinkHealingParticleSystem`, `LinkTrailParticleSystem`, `LinkVisualStateAdapter`, `TransparentStateAuthority`, etc.

**Detailed Answers to Prompts**
1) Source of truth: `NodeLinkingSystem.createLink()` builds the link object (`id`, `source/target`, traffic metrics, `visualState`, `group`, later `curve`). Data structure: plain object stored in `this.links`.
2) Registration: push into `this.links` + `nodeIdToLinks` map; `LinkPrioritySystem.initializeLinkPriority`; `visuals.registerLink` (NeonLinkVisuals) with `link.group`; thickness/metrics hooks; `LinkEmissionPulsingSystem`. Optional deferred path: if `this.deferLinkVisuals` true, link queued in `pendingLinkVisualsQueue` for later visual creation (race risk if not drained).
3) `NodeLinkingSystem.update()`: for each link → build frameState → `conduitRenderer.update` (sets curve, updates VFX) → apply category transitions, traffic sim, animation/color/thickness updates. After loop → `conduitRenderer.updatePictograms` (global pictogram tick) → trail/healing particle updates → thickness animate-all. Logging heartbeat present.
4) Render pipeline modules acting on link: primary Conduit (braid/skin/particles/streaks/dissolves), NeonLinkVisuals (neon line/trails/priority glow), LinkSemanticPictogramSystem (glyphs), LinkGlowSynergyEngine (glow), LinkThicknessMetrics, LinkPrioritySystem, LinkCorruptionSpreadAnimator, Healing/Trail particles, DirectionalStreaks, VisualStateAdapter, Aura shader skin. Legacy extreme/legacy systems still present but gated.
5) Conduit curve: computed per-link each update in `update()` around lines ~896–910; Frenet frames right after; braid/strand generation uses these frames; `link.curve` stored on link for downstream (pictograms, particles).
6) Update order (runtime): FrameScheduler/main loop → `NodeLinkingSystem.update(dt,time)` → per-link Conduit update (curve, VFX) → per-link color/thickness/etc. → post-loop pictogram global update → trail/healing particle managers → thickness animate-all → (elsewhere FrameScheduler draws scene).
7) Pictograms: initialized in Conduit constructor; updated from Conduit `updatePictograms` called by `NodeLinkingSystem.update`; operates on `this.linkingSystem.links` live list, no separate cache.
8) World switch: `resetForWorldRebuild` disposes visuals, nulls `link.curve`, queues links for rebuild, recreates `linkRoot`; preserves link objects and indexes; on next updates visuals rebuilt from queue. `resetForWorldSwitch` similar semantics (not shown but paired).
9) Architectural duplicities / race points:
   - Dual creation paths: `createLink()` vs `createLinkLegacy()` (legacy extreme visuals) can coexist; potential divergence in structure.
   - Deferred visuals queue (`deferLinkVisuals`) can leave links without `group/curve` for a few frames; downstream systems must guard (pictograms, particles).
   - Multiple renderers: Conduit (braid) and NeonLinkVisuals (neon line) both render link geometry; risk of double-drawing/overlap if both enabled.
   - Multiple registration hooks: core createLink plus patches (`LinkingSystemHardening`, `LinkCategoryTransitionIntegrationPatch`, metrics integration) wrap `createLink`—ensure order to avoid duplicate logging or missed registration.
   - Pictogram system depends on `link.curve`; if deferred creation or legacy path leaves no curve, glyphs will stick at origin (currently guarded by warning).

**Recommended Target Architecture (succinct)**
NodeLinkingSystem (single creation authority, no legacy path) → registers link, adds to `links` and node indexes → immediately creates visuals through one renderer (Conduit) which sets `link.curve` and all per-link VFX → single visual adapter layer for optional modules (beads/sparks/pictograms/neon) behind Conduit → per-frame update: Conduit update (geometry + VFX) → pictogram update → ancillary thickness/priority/metrics; NeonLinkVisuals either integrated or disabled to avoid double renders.

**Relevant Files (primary)**
- `NodeLinkingSystem.js`
- `LinkRendererConduit.js`
- `LinkSemanticPictogramSystem_Enhanced.js`
- `NeonLinkVisuals.js`
- Support: `LinkBeadSystem.js`, `LinkSparkSystem.js`, `LinkBeadTrailSystem.js`, `LinkEnergyRingSystem.js`, `LinkPulseRing.js`, `LinkEnergyWave.js`, `LinkRingArcDischarges.js`, `LinkDirectionalStreaks.js`, `LinkCorruptionParticleSystem.js`, `LinkHealingParticleSystem.js`, `LinkTrailParticleSystem.js`, `VisualHierarchyRegistry.js`, `TransparentStateAuthority.js`
- Patches/wrappers: `LinkingSystemHardening.js`, `LinkRendererMetricsIntegrationPatch_v1.js`, `LinkThicknessMetricsIntegrationPatch_v1.js`, `LinkCategoryTransitionIntegrationPatch.js`, `LinkRendererMetricsIntegrationPatch_v1.js`.

If you want a simplified diagram rendered into the repo (SVG/MD) or a consolidation plan removing legacy/neon duplication, say the word.