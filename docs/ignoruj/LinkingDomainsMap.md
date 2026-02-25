Linking Domains Map

Structural: NodeLinkingSystem.js (topology: createLink/removeLink/indexes/cursor lookup), NodeLinker2_RepairLayer1_0.js, LinkingSystemHardening.js, HitProxySystem_v1.js (raycast authority only), main.js wiring of linkingSystem lifecycle.
Semantic: LinkCorruptionTransmission_v1.js, NodeLinkingSystem.js:_updateCorruptionContagion (semantic slice), LinkQualityCalculator.js, LinkDegradationSystem.js, LinkCollapseSystem.js, LinkPrioritySystem.js, LinkPriorityDecayEngine.js, LinkQualityFeedbackLoop1_0.js, LinkAutomationEngine1_0.js (uses quality/priority), LinkMetricsToVisualBridge_v1.js (semantic→visual stress aggregation; primary = semantic writer of stress metrics), any synergy/harmony recompute in NodeLinkingSystem.update.
Visual: NodeLinkingSystem conduit/flow/thickness rendering (conduitRenderer, flowSystem, thicknessSystem, glow/color updates), LinkCategoryTransitionSystem.js, LinkStateVisualLanguageIntegration.js, LinkPulseWaveInjector.js, HarmonyAuraShaderMaterial.js, Neon/particle/link visual packs, LinkMetricsToVisualBridge_v1.js consumption side, visual HUDs consuming link events.
Temporal Orchestration: main.js frame loop + safeTick scheduling, FrameScheduler.js, FrameUpdateLoopOrderValidator_v1.js, SystemInitializationOrderValidator_v1.js, FrameClock.js (cadence definition).
Authority Contracts

Structural Domain
Allowed writes: link topology (create/remove), link indexes/maps (linksByNode/nodeIdToLinks), link event callbacks, raycast targets, repair/hardening flags.
Forbidden writes: quality/priority/corruption/synergy/harmony metrics; node visuals; shaders; semantic decay/collapse decisions.
Allowed reads: node validity, categories/ids/positions for topology checks.
Semantic Domain
Allowed writes: link.userData semantic fields (quality, degradation, corruption, contagion, priority, collapse state), node.userData fields derived from links (corruptionLevel/harmony/synergy feedback), stress/aging metadata, semantic caches.
Forbidden writes: link creation/removal, link geometry/materials, node visuals, shader uniforms.
Allowed reads: link topology/indexes, node attributes, structural validity, visual state only as read.
Visual Domain
Allowed writes: materials, geometries, shader uniforms, visual caches; visual-only link fields (color/thickness buffers) that do not affect logic.
Forbidden writes: link topology, semantic metrics, node.userData logic fields, priority/quality/collapse decisions.
Allowed reads: semantic outputs (quality/degradation/corruption/priority/stress), structural positions, categories, selection state.
Temporal Orchestration Domain
Allowed: schedule when subsystems run; enforce order; gate cadences.
Forbidden: mutating link/node state; embedding logic.
Reads: subsystem readiness/health; timing data.
Mutation Flow

Semantic stress → collapse: Corruption (LinkCorruptionTransmission_v1 + NodeLinkingSystem._updateCorruptionContagion) updates link/user corruption; LinkQualityCalculator and LinkDegradationSystem convert to quality/efficiency; LinkPriority/Decay adjust semantic priority; LinkCollapseSystem watches corruption + load/stress (from quality/degradation) to mark collapse state in link.userData and issue a collapse request.
Collapse request → structural change: CollapseSystem raises a “collapse/unlink” request to Structural Domain; Structural Domain (NodeLinkingSystem/LinkerHardening/RepairLayer) executes unlinkNodes/removeLink, updates indexes, and fires link removal callbacks; no semantic logic executed during structural act.
Visual reaction: Visual Domain observes semantic flags (corruption, quality, collapseWarning/critical), updates materials/flows/thickness/auras; once Structural removes a link, Visual disposes its own resources; visuals never alter semantic or structural state.
Future-Proofing Notes

Boundaries: keep Structural as sole owner of topology/maps; funnel all semantic writes through a semantic coordinator (order: corruption/contagion → quality → degradation/priority → collapse) before visuals read.
Collapse/repair handshake: require explicit “collapse request” from Semantic to Structural to avoid silent unlink side-effects.
Cadence hygiene: keep per-frame semantic processes limited to contagion/visual needs; batch slower semantic (priority decay, index sync) under orchestration to avoid drift; ensure a single cadence source (Temporal domain) defines frame vs 500 ms ticks.
Multi-authority risks to monitor: NodeLinkingSystem currently mixes structural/semantic/visual—treat as architectural risk until roles are isolated; LinkMetricsToVisualBridge straddles semantic→visual—keep semantic writes confined to stress outputs only.