Below is a read-only static audit (no files changed). You can copy it into `docs/variant_pool_static_audit.md` if you want to persist it.

---

## Category → pool size and index map (from `EnhancedNodeModels.create*`)
Variant index is `nodeId % variants.length`, where `nodeId` is `group.userData.id` or the passed `index` (strings hashed via charCode sum). Extra pools (`__EXTRA_FACTORIES`) extend arrays after initial length.

- **input** (11 entries, indices 0–10)  
  0 createInputNode0 — returns empty group → dead  
  1 createInputNode2 — empty → dead  
  2 createInputNode1 — empty → dead  
  3 createNewIcosahedron — returns null (NoFallbackPolicy) → dead/blocked  
  4 createInputSignalReceptor — OK  
  5 createInputDataGateway — OK  
  6 createInputIncomingFunnel — OK  
  7 createExtremeInput0 — OK (ExtremeAINodePack)  
  8 InputSensoryEnhanced.createInputSensory_TactileSensor — OK  
  9 InputSensoryEnhanced.createInputSensory_EchoDetector — OK  
  10 InputSensoryEnhanced.createInputSensory_NeuralReceptor — OK  
  + __EXTRA_FACTORIES.input (AINodeModel.createCoreNode) appended after ensureRegistry

- **process** (9 entries, indices 0–8)  
  0 createProcessNode0 — empty → dead  
  1 createProcessNode3 — empty → dead  
  2 createProcessNode2 — empty → dead  
  3 createProcessFluxChamber — OK  
  4 createProcessTransformationSpine — OK  
  5 createProcessConversionOrbit — OK  
  6 ProcessEnhancedVariants.createProcessEnhanced_FlowRecomposer — OK  
  7 ProcessEnhancedVariants.createProcessEnhanced_TemporalShifter — OK  
  8 ProcessEnhancedVariants.createProcessEnhanced_IterativeEngine — OK  
  + __EXTRA_FACTORIES.process (AINodeModel.createLogicNode) appended

- **integration** (11 entries, 0–10)  
  0 Trefoil knot — OK  
  1 Figure Eight — OK  
  2 InfiniteSelfIntersecting — OK  
  3 Chaotic knot — OK  
  4 Borromean — OK  
  5 Torus knot — OK  
  6 Triple Helix — OK  
  7 createExtremeInput1 (SingularityKnot) — OK  
  8 IntegrationEnhancedVariants.createIntegrationEnhanced_SignalKnot — OK  
  9 IntegrationEnhancedVariants.createIntegrationEnhanced_ProtocolTangle — OK  
  10 IntegrationEnhancedVariants.createIntegrationEnhanced_ContinuityBinder — OK  
  + __EXTRA_FACTORIES.integration (AINodeModel.createNeuralNode) appended

- **analytics** (10 entries, 0–9)  
  0 createAnalyticsNode1 — empty → dead  
  1 createAnalyticsNode2 — OK (cylinder stacks)  
  2 createAnalyticsNode3 — OK (cone + torus)  
  3 createAnalyticsObserverLens — OK  
  4 createAnalyticsFractalEcho — OK  
  5 createAnalyticsParallaxOracle — OK  
  6 createNewElongatedOctahedron — OK  
  7 AnalyticsEnhancedVariants.createAnalyticsEnhanced_SignalStratifier — OK  
  8 AnalyticsEnhancedVariants.createAnalyticsEnhanced_TrendExcavator — OK  
  9 AnalyticsEnhancedVariants.createAnalyticsEnhanced_AnomalyLedger — OK  
  + __EXTRA_FACTORIES.analytics (AINodeModel.createDataNode) appended

- **storage** (13 entries, 0–12)  
  0 createStorageNode0 — OK  
  1 createStorageNode1 — OK  
  2 createStorageNode3 — OK  
  3 createNewRhombicSolid — OK  
  4 createStorageMnemonicVault — OK  
  5 createStorageArchiveSpindle — OK  
  6 createStorageMemoryReef — OK  
  7 StorageEnhancedVariants.createStorageEnhanced_ArchiveNexus — OK  
  8 StorageEnhancedVariants.createStorageEnhanced_MemoryCrypts — OK  
  9 StorageEnhancedVariants.createStorageEnhanced_DepthLayers — OK  
  10 StorageNodesVisual.createObeliskCache — OK  
  11 StorageNodesVisual.createFractalReservoir — OK  
  12 StorageNodesVisual.createArchiveDrum — OK  
  (StorageNode2 exists but not in pool.)  
  + __EXTRA_FACTORIES.storage (AINodeModel.createMemoryNode) appended

- **control** (14 entries, 0–13)  
  0 createAxiomCrystalNode — OK  
  1 createControlNode0 — OK  
  2 createControlNode2 — OK  
  3 createControlNode1 — empty → dead  
  4 createControlCommandPyramid — OK  
  5 createControlHierarchyTower — OK  
  6 createControlSymmetryCore — OK  
  7 createExtremeControl0 — OK  
  8 ControlEnhancedVariants.createControlEnhanced_DecisionFork — OK  
  9 ControlEnhancedVariants.createControlEnhanced_AuthorityHelix — OK  
  10 ControlEnhancedVariants.createControlEnhanced_CommandMatrix — OK  
  11 ControlNodeSpecialGovernors.createPhrixFlowArbiter — OK  
  12 ControlNodeSpecialGovernors.createCrucisSuppressionGovernor — OK  
  13 ControlNodeSpecialGovernors.createVertexTemporalGate — OK  
  + __EXTRA_FACTORIES.control (none by default)

- **quantum** (4 entries, 0–3)  
  0 createSigmaNode0 — OK  
  1 createSigmaNode1 — OK  
  2 createSigmaNode3 — OK  
  3 createExtremeIntegration1 — OK  
  (__EXTRA_FACTORIES.quantum empty).  
  Sigma alias routes to same pool. SigmaNode2 exists but is not referenced.

- **mythic** (6 entries) → all CanonicalGeometryFamilies; all OK.  
- **prime** (6 entries) → CanonicalGeometryFamilies; all OK.  
- **error** (6 entries) → CanonicalGeometryFamilies; all OK.  
- **emotional** (6 entries) → CanonicalGeometryFamilies; all OK.

## Dead indices / empty-return builders
- input: 0,1,2 empty groups; 3 returns null (NoFallbackPolicy).  
- process: 0,1,2 empty groups.  
- analytics: 0 empty.  
- control: 3 (createControlNode1) empty.  
- quantum/sigma: none referenced dead; SigmaNode2 is dead but not in pool.  
- storage: none in pool (StorageNode2 dead but not referenced).  
- integration/mythic/prime/error/emotional: none.

## Builders blocked by NoFallbackPolicy
- createNewIcosahedron (input index 3) explicitly logs and returns null due to NoFallbackPolicy (legacy INPUT core removed). No other NoFallbackPolicy blocks found.

## Unused variant exports (module-level)
- `InputEnhancedVariants_Session84`: createInputEnhanced_SensorArray / PerceptionVortex / ResonanceChamber are exported but never referenced in pools.  
- `ControlSpineVariants_Session100`: only reachable via manual helper createControlSpineVariant; not in automatic pool.  
- `ControlNodeGeometries_v1`: createJudgmentSeal / SignalCitadel / LawCore helpers exist but not in variant arrays (only legacy helper functions call them; those helpers aren’t in pools).  
- `createNewDodecahedron`, `createNewEllipsoid`, `createNewTruncatedPyramid`, `createNewHexagonalPrism`, `createSigmaNode2` — defined but unused in pools.  
- Any _EXTRA_FACTORIES entries beyond defaults may add legacy AINodeModel factories but those are optional.

## Cross-system references to dead/legacy builders
- `AINodes.js` uses `EnhancedNodeModels.create(validatedCategory, variantIndex, coreColor)`; relies on `variantIndex` incrementing counter (deterministic) and expects null when builder returns nothing. It logs “No canonical visual available” or “Visual has no renderable content” when create() yields null or empty groups.  
- `ArchetypeVisualIntegrationPatch_v1.js`, `ArchetypeVisualProfiles_v1.js`, `ArchetypeVisualDifferentiationSystem_v1.js` have **no direct references** to individual builders (search shows none); they rely on higher-level create flows.  
- No other files reference the dead builders directly (search for createInputNode0 etc. only inside EnhancedNodeModels).

## Categories summarized
- input: valid indices 4–10; dead 0–3; blocked by NoFallbackPolicy at 3.  
- process: valid 3–8; dead 0–2.  
- integration: all 0–10 valid.  
- analytics: valid 1–9; dead 0.  
- storage: all 0–12 valid (dead StorageNode2 not referenced).  
- control: valid 0,2,4–13; dead 1 (empty).  
- quantum/sigma: valid 0,1,2,3; dead (unused) SigmaNode2.  
- mythic/prime/error/emotional: all entries valid.

## Safe-to-remove candidates (code + pools)
- Remove from pools: input indices 0–3, process 0–2, analytics 0, control 3, quantum (keep as-is; SigmaNode2 unused).  
- Remove unused modules/exports: InputEnhancedVariants_* exports, StorageNode2, SigmaNode2, createNewDodecahedron / Ellipsoid / TruncatedPyramid / HexagonalPrism, ControlNode1 if not needed.  
- Consider pruning NoFallbackPolicy index (input 3) or replacing with real visual.

---

If you want this persisted, let me know and I’ll write `docs/variant_pool_static_audit.md`; otherwise this summary is ready for Phase DELETE.