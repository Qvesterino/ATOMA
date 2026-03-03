// Canonical visual registry: visualCode -> { category, factoryName }
export const NODE_VISUAL_REGISTRY = {
  // Input (1xx)
  101: { category: 'input', factoryName: 'createInputSignalReceptor' },
  102: { category: 'input', factoryName: 'createInputDataGateway' },
  103: { category: 'input', factoryName: 'createInputIncomingFunnel' },
  104: { category: 'input', factoryName: 'createInputSensory_TactileSensor' },
  105: { category: 'input', factoryName: 'createInputSensory_EchoDetector' },
  106: { category: 'input', factoryName: 'createInputSensory_NeuralReceptor' },
  107: { category: 'input', factoryName: 'createInputNodeStyled_v2' },
  108: { category: 'input', factoryName: 'createInputNode3' },
  110: { category: 'input', factoryName: 'createExtremeInput0' },
  111: { category: 'input', factoryName: 'createExtremeInput1' },

  // Process (2xx)
  201: { category: 'process', factoryName: 'createProcessFluxChamber' },
  202: { category: 'process', factoryName: 'createProcessTransformationSpine' },
  203: { category: 'process', factoryName: 'createProcessConversionOrbit' },
  204: { category: 'process', factoryName: 'createProcessEnhanced_FlowRecomposer' },
  205: { category: 'process', factoryName: 'createProcessEnhanced_TemporalShifter' },
  206: { category: 'process', factoryName: 'createProcessEnhanced_IterativeEngine' },
  207: { category: 'process', factoryName: 'createProcessNode' },
  208: { category: 'process', factoryName: 'createExtremeProcess0' },
  209: { category: 'process', factoryName: 'createExtremeProcess1' },

  // Integration (3xx)
  301: { category: 'integration', factoryName: 'createKnotTrefoil' },
  302: { category: 'integration', factoryName: 'createKnotFigureEight' },
  303: { category: 'integration', factoryName: 'createKnotInfiniteSelfIntersecting' },
  304: { category: 'integration', factoryName: 'createKnotChaotic' },
  305: { category: 'integration', factoryName: 'createKnotBorromean' },
  306: { category: 'integration', factoryName: 'createKnotTorusKnot' },
  307: { category: 'integration', factoryName: 'createKnotTripleHelix' },
  308: { category: 'integration', factoryName: 'createIntegrationEnhanced_SignalKnot' },
  309: { category: 'integration', factoryName: 'createIntegrationEnhanced_ProtocolTangle' },
  310: { category: 'integration', factoryName: 'createIntegrationEnhanced_ContinuityBinder' },
  311: { category: 'integration', factoryName: 'createIntegrationNode' },
  312: { category: 'integration', factoryName: 'createIntegrationNode0' },
  313: { category: 'integration', factoryName: 'createIntegrationNode1' },
  314: { category: 'integration', factoryName: 'createIntegrationNode2' },
  315: { category: 'integration', factoryName: 'createExtremeIntegration0' },
  316: { category: 'integration', factoryName: 'createKnotMobius' },

  // Analytics (4xx)
  401: { category: 'analytics', factoryName: 'createAnalyticsNode2' },
  402: { category: 'analytics', factoryName: 'createAnalyticsNode3' },
  403: { category: 'analytics', factoryName: 'createAnalyticsObserverLens' },
  404: { category: 'analytics', factoryName: 'createAnalyticsFractalEcho' },
  405: { category: 'analytics', factoryName: 'createAnalyticsParallaxOracle' },
  406: { category: 'analytics', factoryName: 'createAnalyticsEnhanced_SignalStratifier' },
  407: { category: 'analytics', factoryName: 'createAnalyticsEnhanced_TrendExcavator' },
  408: { category: 'analytics', factoryName: 'createAnalyticsEnhanced_AnomalyLedger' },
  409: { category: 'analytics', factoryName: 'createAnalyticsNodeStyled_v2' },
  411: { category: 'analytics', factoryName: 'createExtremeAnalytics0' },
  412: { category: 'analytics', factoryName: 'createExtremeAnalytics1' },

  // Storage (5xx)
  501: { category: 'storage', factoryName: 'createStorageNode0' },
  502: { category: 'storage', factoryName: 'createStorageNode1' },
  503: { category: 'storage', factoryName: 'createStorageNode3' },
  504: { category: 'storage', factoryName: 'createStorageMnemonicVault' },
  505: { category: 'storage', factoryName: 'createStorageArchiveSpindle' },
  506: { category: 'storage', factoryName: 'createStorageMemoryReef' },
  507: { category: 'storage', factoryName: 'createStorageEnhanced_ArchiveNexus' },
  508: { category: 'storage', factoryName: 'createStorageEnhanced_MemoryCrypts' },
  509: { category: 'storage', factoryName: 'createStorageEnhanced_DepthLayers' },
  510: { category: 'storage', factoryName: 'createObeliskCache' },
  511: { category: 'storage', factoryName: 'createFractalReservoir' },
  512: { category: 'storage', factoryName: 'createArchiveDrum' },
  513: { category: 'storage', factoryName: 'createStorageNodeStyled_v2' },
  515: { category: 'storage', factoryName: 'createExtremeStorage0' },
  516: { category: 'storage', factoryName: 'createExtremeStorage1' },

  // Control (6xx)
  601: { category: 'control', factoryName: 'createAxiomCrystalNode' },
  602: { category: 'control', factoryName: 'createControlNode0' },
  603: { category: 'control', factoryName: 'createControlNode2' },
  604: { category: 'control', factoryName: 'createControlNode1' },
  605: { category: 'control', factoryName: 'createControlCommandPyramid' },
  606: { category: 'control', factoryName: 'createControlHierarchyTower' },
  607: { category: 'control', factoryName: 'createControlSymmetryCore' },
  608: { category: 'control', factoryName: 'createExtremeControl0' },
  609: { category: 'control', factoryName: 'createControlEnhanced_DecisionFork' },
  610: { category: 'control', factoryName: 'createControlEnhanced_AuthorityHelix' },
  611: { category: 'control', factoryName: 'createControlEnhanced_CommandMatrix' },
  612: { category: 'control', factoryName: 'createPhrixFlowArbiter' },
  613: { category: 'control', factoryName: 'createCrucisSuppressionGovernor' },
  614: { category: 'control', factoryName: 'createVertexTemporalGate' },
  615: { category: 'control', factoryName: 'createControlNode3' },
  616: { category: 'control', factoryName: 'createControlNodeStyled_v2' },
  618: { category: 'control', factoryName: 'createControlNodeStyled_v2_Legacy' },
  619: { category: 'control', factoryName: 'createControlSpecialGovernor' },
  620: { category: 'control', factoryName: 'createControlSpineVariant' },
  621: { category: 'control', factoryName: 'createExtremeControl1' },

  // Quantum (7xx)
  701: { category: 'quantum', factoryName: 'createQuantumBloomNode' },
  702: { category: 'quantum', factoryName: 'createQuantumLattice' },
  703: { category: 'quantum', factoryName: 'createQuantumLotus' },
  705: { category: 'quantum', factoryName: 'createQuantumNodeStyled_v2' },

  // Sigma (8xx) reuses quantum visuals
  804: { category: 'sigma', factoryName: 'createExtremeIntegration1' },
  805: { category: 'sigma', factoryName: 'createSigmaNode2' },
  806: { category: 'sigma', factoryName: 'createSigmaNodeStyled_v2' },

  // Mythic / Prime / Error / Emotional (9xx+)
  901: { category: 'mythic', factoryName: 'createMythicShardClusterNode' },
  902: { category: 'mythic', factoryName: 'createMythicBrokenMonolithNode' },
  903: { category: 'mythic', factoryName: 'createMythicFloatingFragmentsNode' },
  904: { category: 'mythic', factoryName: 'createMythicCrackedPrismNode' },
  905: { category: 'mythic', factoryName: 'createMythicAncientCoreWithMissingNode' },
  906: { category: 'mythic', factoryName: 'createMythicCollapsedCrownNode' },
  908: { category: 'mythic', factoryName: 'createMythicNodeStyled_v2' },

  1001:{ category: 'prime',  factoryName: 'createPrimeNestedIcosahedronNode' },
  1002:{ category: 'prime',  factoryName: 'createPrimePerfectDodecahedronNode' },
  1003:{ category: 'prime',  factoryName: 'createPrimeStellaOctangulaNode' },
  1004:{ category: 'prime',  factoryName: 'createPrimePrecisionLatticeNode' },
  1005:{ category: 'prime',  factoryName: 'createPrimeTesseractProjectionNode' },
  1006:{ category: 'prime',  factoryName: 'createPrimeSymmetryLockedCoreNode' },
  1008:{ category: 'prime',  factoryName: 'createPrimeNodeStyled_v2' },

  1101:{ category: 'error',  factoryName: 'createErrorIntersectingSolidsNode' },
  1102:{ category: 'error',  factoryName: 'createErrorInvertedNormalsNode' },
  1103:{ category: 'error',  factoryName: 'createErrorSelfClippingNode' },
  1104:{ category: 'error',  factoryName: 'createErrorFoldedImpossibleNode' },
  1105:{ category: 'error',  factoryName: 'createErrorTopologyTearNode' },
  1106:{ category: 'error',  factoryName: 'createErrorCorruptedManifoldNode' },
  1108:{ category: 'error',  factoryName: 'createErrorNodeStyled_v2' },

  1201:{ category: 'emotional', factoryName: 'createEmotionalHeartCrystal' },
  1202:{ category: 'emotional', factoryName: 'createEmotionalNeuralLobe' },
  1203:{ category: 'emotional', factoryName: 'createEmotionalBloomingGem' },
  1204:{ category: 'emotional', factoryName: 'createEmotionalTearShaped' },
  1205:{ category: 'emotional', factoryName: 'createEmotionalFolded' },
  1206:{ category: 'emotional', factoryName: 'createEmotionalSymmetricSeed' },
  1207:{ category: 'emotional', factoryName: 'createEmotionalNodeStyled_v2' },
};

export const CATEGORY_POOLS = {};
for (const [codeStr, def] of Object.entries(NODE_VISUAL_REGISTRY)) {
  const code = Number(codeStr);
  if (!CATEGORY_POOLS[def.category]) CATEGORY_POOLS[def.category] = [];
  CATEGORY_POOLS[def.category].push(code);
}
for (const cat of Object.keys(CATEGORY_POOLS)) {
  CATEGORY_POOLS[cat] = CATEGORY_POOLS[cat].filter(Number.isFinite);
  CATEGORY_POOLS[cat].sort((a, b) => a - b);
}
