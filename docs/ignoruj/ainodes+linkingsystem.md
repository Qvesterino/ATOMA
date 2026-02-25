Key Files

AINodes.js: core ai node lifecycle (spawn, activation, per-node visuals, simple connection lines), uses NodeVisualBootstrap3_0, EnhancedNodeModels, SpawnAuthorityComplianceGate, NodeMetricEngine, NodeDepthAndHoloPreservationFix.
main.js: wiring and cadence—creates aiNodes, NodeLinkingSystem, runs aiNodes.update and updateSpawning each frame, and drives link-side systems (quality/degradation/collapse/color bridges, etc.) at configured 60/30/10 Hz blocks.
NodeLinkingSystem.js: primary link engine (input surfaces, createLink/removeLink, conduit renderer, hover/crosshair raycasts, per-link animation, corruption contagion, index syncing).
Active link evaluators/bridges: LinkQualityCalculator.js, LinkDegradationSystem.js, LinkCollapseSystem.js, LinkPriorityDecayEngine.js, DynamicLinkColorSystem.js, LinkMetricsToVisualBridge_v1.js, LinkCategoryTransitionSystem.js, LinkEmissionPulsingSystem.js, LinkRendererConduit.js.
Link propagation/repair/input guards: LinkCorruptionTransmission_v1.js, _updateCorruptionContagion inside NodeLinkingSystem.js, NodeLinker2_RepairLayer1_0.js, NodeLinking2_3.js, LinkingSystemHardening.js, HitProxySystem_v1.js (raycast isolation).
Reference map: LINK SYSTEM_COMPLETE_INDEX.md (status of 67 link-related files; identifies active/orphaned subsystems).
aiNodes Runtime

Per-frame (60 Hz visual cadence in main.js): loop over every node to gate activation by player distance, smooth activationLevel, manage activeNodes set, and invoke updateNodeVisuals.
updateNodeVisuals: motion of node transforms (levitation/drift/jitter), shell reassertion, hologram material updates, aura/halo/glow opacity, core rotations; calls EnhancedNodeModels.animate and updateHologramShellMaterial.
Post-node pass: aura LOD culling (AuraLODCulling.updateCulling) and updateConnections for legacy straight-line visuals between nearby nodes.
Spawning: updateSpawning each frame uses Date.now thresholds (nextTimeSpawn, density checks, link-driven cooldowns); onLinkCreated (20% chance) may spawn; spawnNode performs validation/metrics/bootstrap, adds materialize effect, and optionally auto-links via nodeLinkingSystem.createLink.
One-time topology: createNodeConnections builds basic connections on initial create; node registry/authority checks enforced during spawn.
Linking Runtime

NodeLinkingSystem.update every frame: skips if worldReady false; initializes contagion config once; runs _updateCorruptionContagion; updates LinkCategoryTransitionSystem; 500 ms cadence for _syncIndexWithRuntime, priority decay, synergy recompute (ComputeSynergyScore2_0) with history logging; animates flowSystem; updates crosshair targeting (hit-proxy raycast) and hover states.
Per-link loop (active links): validate endpoints, updateLinkCurve to follow nodes, apply category transition visuals, updateTrafficSimulation (random load/throughput), updateLinkAnimations (emission pulsing, conduit renderer, metrics-to-visual wiring), color/particle transitions, dynamic thickness updates, then restore node visuals and remove invalid links.
Propagation/evaluations outside the loop: per-frame corruption contagion across links (writes userData.corruptionLevel on nodes), separate per-frame systems in main.js (DynamicLinkColorSystem, LinkQualityCalculator, LinkDegradationSystem, LinkCollapseSystem, LinkMetricsToVisualBridge_v1, StressBasedParticleScaler, cascade visualizer), plus less-frequent linkCorrelationEngine.tick (~3s) and LinkPriorityDecayEngine.
Background tasks: _syncIndexWithRuntime heals link indices every 500 ms; LinkPrioritySystem.applyTrafficDecay runs on same cadence; HitProxySystem.update syncs proxy positions each frame.
Event-driven: createLink registers metrics (onLinkCreated), fires category transitions/birth auras, and seeds traffic; removal triggers effects; inputs/hardening/repair handled by NodeLinking2_3, NodeLinker2_RepairLayer1_0, LinkingSystemHardening.
Logic Classification

Motion-critical: node transform animation and activation gating in AINodes.update/updateNodeVisuals; link curve anchoring + conduit renderer updates; crosshair/hover raycasts that drive selection accuracy.
Perceptual/visual smoothing: aura LOD, glow/halo/intensity easing, link color/particle/thickness transitions, category transition animations, animated link flow.
Semantic/interpretive: corruption contagion propagation, LinkQualityCalculator + degradation/collapse chains, spawn authority/registry checks, synergy recomputation/history logging, node metrics compatibility and relaxation.
Background/decay/bookkeeping: link index sync + priority decay (500 ms), UI throttles (node UI 0.1s, undo UI 0.1s), relaxNodeMetrics every 60 frames, density-based spawning grid scan, hit-proxy upkeep.
Risk Notes

High risk to touch: AINodes.update loop and updateNodeVisuals (moves/animates node roots); NodeLinkingSystem.update per-link operations (updateLinkCurve, conduit renderer, hover/crosshair); corruption contagion writes; LinkQuality/Degradation/Collapse pipeline (feeds many downstream visuals/logic); spawn pipeline (authority/metrics/bootstrap).
Medium risk: updateSpawning cadence/density logic; updateConnections straight-line visuals; updateTrafficSimulation randomness; synergy recompute every ~2s; category transition visuals; LinkPriority decay parameters.
Low risk: index sync/priority decay helpers (500 ms) provided they stay consistent; UI throttles; metrics compatibility/relaxation helpers; doc-indexed orphaned systems that are disabled unless explicitly wired.
Next steps if needed: drill deeper into specific heavy spots (e.g., per-link contagion loop, EnhancedNodeModels.animate) with profiling to separate visual vs semantic cost before proposing changes.