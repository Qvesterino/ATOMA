# Visual Audit (EnhancedNodeModels)

## Import Usage Summary
- THREE – USED across all geometry builders.
- _ExtremeAINodePack – USED by extreme wrappers (createExtremeInput0/1, Process0/1, Integration0/1, Storage0/1, Analytics0/1, Control0/1).
- VisualHierarchyRegistry – USED in _getCoreRenderOrder/_getArchetypeRenderOrder.
- CoreHologramShader (createCoreIdentityMaterial, createNodeHologramShell) – UNUSED (imports not referenced).
- ControlNodeGeometries_v1 – REFERENCED only inside dead builders (createJudgmentSealNode / createSignalCitadelNode / createLawCoreNode).
- CanonicalGeometryFamilies_v1 – USED in createMythicNode/createPrimeNode/createErrorNode/createEmotionalNode.
- AnalyticsEnhancedVariants_Session81 – USED (three variants in analytics pool).
- StorageEnhancedVariants_Session81 – USED (three variants in storage pool).
- ProcessEnhancedVariants_Session81 – USED (three variants in process pool).
- IntegrationEnhancedVariants_Session110 – USED (three variants in integration pool).
- ControlEnhancedVariants_Session83 – USED (three variants in control pool).
- ControlSpineVariants_Session100 – USED only by manual helper createControlSpineVariant (helper itself is unreachable internally).
- InputEnhancedVariants_Session84 – UNUSED (never referenced).
- InputSensoryEnhanced_Session111 – USED (three sensory variants in input pool).
- ControlNodeSpecialGoverners_Session114 – USED (three governors + createSpecialGovernor helper).
- StorageNodesVisual_Session116 – USED (ObeliskCache, FractalReservoir, ArchiveDrum in storage pool).
- AINodeModel – USED in __EXTRA_FACTORIES registry fallbacks.

## Reachable Builders
- createInputNode – Called from create() case 'input' and default; Status: REACHABLE.
- createProcessNode – Called from create() case 'process'; Status: REACHABLE.
- createIntegrationNode – Called from create() case 'integration'; Status: REACHABLE.
- createAnalyticsNode – Called from create() case 'analytics'; Status: REACHABLE.
- createStorageNode – Called from create() case 'storage'; Status: REACHABLE.
- createControlNode – Called from create() case 'control'; Status: REACHABLE.
- createQuantumNode – Called from create() case 'quantum'; Status: REACHABLE.
- createSigmaNode – Not invoked (create() maps sigma›createQuantumNode); Status: UNREACHABLE (alias only).
- createMythicNode – Called from create() case 'mythic'; Status: REACHABLE.
- createPrimeNode – Called from create() case 'prime'; Status: REACHABLE.
- createErrorNode – Called from create() case 'error'; Status: REACHABLE.
- createEmotionalNode – Called from create() case 'emotional'; Status: REACHABLE.
- createControlSpineVariant – No internal callers; Status: UNREACHABLE (manual-only helper).
- createControlSpecialGovernor – No internal callers; Status: UNREACHABLE (manual-only helper).

## Dead Builders
- createInputNode3 (basic gateway frame) – never in input variants.
- createProcessNode1 (radial cutouts) – never in process variants.
- createIntegrationNode0/1/2/3 – none wired into integration variants (knot pool only).
- createAnalyticsNode0 (DataPyramid) – excluded from analytics variants.
- createStorageNode2 (SegmentedStack) – excluded from storage variants.
- createControlNode3 (legacy) – excluded from control variants.
- createJudgmentSealNode / createSignalCitadelNode / createLawCoreNode – helper builders unused; only call ControlNodeGeometries.
- createSigmaNode2 – variant never selected in quantum/sigma pool.
- createNewDodecahedron / createNewEllipsoid / createNewTruncatedPyramid / createNewHexagonalPrism – defined but never referenced.

## Dead Variant Modules
- InputEnhancedVariants_Session84 – imported but not referenced anywhere.
- CoreHologramShader imports (createCoreIdentityMaterial, createNodeHologramShell) – symbols unused; module side effects not observed.

## Unused Variant Exports
- InputEnhancedVariants: createInputEnhanced_SensorArray, createInputEnhanced_PerceptionVortex, createInputEnhanced_ResonanceChamber (module unused).
- ControlNodeGeometries: createJudgmentSeal, createSignalCitadel, createLawCore (referenced only by dead builders › effectively unused).
- Misc internal creators: createNewDodecahedron, createNewEllipsoid, createNewTruncatedPyramid, createNewHexagonalPrism (never selected by any pool).

## Builders Without visualGroup (CRITICAL)
All reachable entry builders add meshes to the passed group but never assign group.visualGroup. Affected:
- createInputNode, createProcessNode, createIntegrationNode, createAnalyticsNode, createStorageNode, createControlNode, createQuantumNode (and sigma alias path), createMythicNode, createPrimeNode, createErrorNode, createEmotionalNode.
(Extreme wrappers only set 	empNode.visualGroup, not the returned group.)

## Safe-to-delete candidates (Phase 2)
- Remove unused import: InputEnhancedVariants_Session84 and its three exports.
- Remove unused CoreHologramShader symbols (createCoreIdentityMaterial, createNodeHologramShell) if no side effects required.
- Delete dead builders: createInputNode3, createProcessNode1, createIntegrationNode0/1/2/3, createAnalyticsNode0, createStorageNode2, createControlNode3, createJudgmentSealNode, createSignalCitadelNode, createLawCoreNode, createSigmaNode2, createNewDodecahedron, createNewEllipsoid, createNewTruncatedPyramid, createNewHexagonalPrism.
- ControlNodeGeometries exports become unreferenced if above deletions occur.

