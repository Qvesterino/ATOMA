// Canonical visual registry: visualCode -> { category, factoryName, metrics }
export const NODE_VISUAL_REGISTRY = {
  // Input (1xx)
  101: { category: 'input', factoryName: 'createInputSignalReceptor', archetypeTag: 'stabilizer', metrics: { synergy: 0.614422, harmony: 0.644918, stability: 0.563694, corruption: 0.040635, loadPressure: 0.256825 } },
  102: { category: 'input', factoryName: 'createInputDataGateway', archetypeTag: 'pressure', metrics: { synergy: 0.613874, harmony: 0.687311, stability: 0.509212, corruption: 0.047981, loadPressure: 0.425608 } },
  103: { category: 'input', factoryName: 'createInputIncomingFunnel', archetypeTag: 'harmonizer', metrics: { synergy: 0.657075, harmony: 0.722905, stability: 0.506411, corruption: 0.070000, loadPressure: 0.322942 } },
  104: { category: 'input', factoryName: 'createInputSensory_TactileSensor', archetypeTag: 'pressure', metrics: { synergy: 0.656877, harmony: 0.770898, stability: 0.450410, corruption: 0.032494, loadPressure: 0.521675 } },
  105: { category: 'input', factoryName: 'createInputSensory_EchoDetector', archetypeTag: 'stabilizer', metrics: { synergy: 0.694479, harmony: 0.558891, stability: 0.700000, corruption: 0.054341, loadPressure: 0.379159 } },
  106: { category: 'input', factoryName: 'createInputSensory_NeuralReceptor', archetypeTag: 'stabilizer', metrics: { synergy: 0.694281, harmony: 0.595684, stability: 0.638567, corruption: 0.031907, loadPressure: 0.293542 } },
  107: { category: 'input', factoryName: 'createInputNodeStyled_v2', archetypeTag: 'amplifier', metrics: { synergy: 0.731883, harmony: 0.634877, stability: 0.635765, corruption: 0.060594, loadPressure: 0.437026 } },
  108: { category: 'input', factoryName: 'createInputNode3', archetypeTag: 'amplifier', metrics: { synergy: 0.800000, harmony: 0.677270, stability: 0.579764, corruption: 0.069260, loadPressure: 0.355809 } },
  110: { category: 'input', factoryName: 'createExtremeInput0', archetypeTag: 'harmonizer', metrics: { synergy: 0.580406, harmony: 0.713539, stability: 0.573378, corruption: 0.049219, loadPressure: 0.253668 } },
  111: { category: 'input', factoryName: 'createExtremeInput1', archetypeTag: 'harmonizer', metrics: { synergy: 0.556568, harmony: 0.761532, stability: 0.518896, corruption: 0.051925, loadPressure: 0.411451 } },

  // Process (2xx)
  201: { category: 'process', factoryName: 'createProcessFluxChamber', archetypeTag: 'risky', metrics: { synergy: 0.667600, harmony: 0.598075, stability: 0.509415, corruption: 0.103252, loadPressure: 0.514275 } },
  202: { category: 'process', factoryName: 'createProcessTransformationSpine', archetypeTag: 'pressure', metrics: { synergy: 0.718525, harmony: 0.637600, stability: 0.490960, corruption: 0.118860, loadPressure: 0.672608 } },
  203: { category: 'process', factoryName: 'createProcessConversionOrbit', archetypeTag: 'harmonizer', metrics: { synergy: 0.726050, harmony: 0.657150, stability: 0.439825, corruption: 0.070000, loadPressure: 0.571592 } },
  204: { category: 'process', factoryName: 'createProcessEnhanced_FlowRecomposer', archetypeTag: 'harmonizer', metrics: { synergy: 0.771375, harmony: 0.750000, stability: 0.428970, corruption: 0.070000, loadPressure: 0.470025 } },
  205: { category: 'process', factoryName: 'createProcessEnhanced_TemporalShifter', archetypeTag: 'stabilizer', metrics: { synergy: 0.778900, harmony: 0.497800, stability: 0.700000, corruption: 0.091664, loadPressure: 0.635509 } },
  206: { category: 'process', factoryName: 'createProcessEnhanced_IterativeEngine', archetypeTag: 'amplifier', metrics: { synergy: 0.824225, harmony: 0.535325, stability: 0.607860, corruption: 0.111232, loadPressure: 0.533392 } },
  207: { category: 'process', factoryName: 'createProcessNode', archetypeTag: 'pressure', metrics: { synergy: 0.842950, harmony: 0.592050, stability: 0.556725, corruption: 0.136000, loadPressure: 0.737387 } },
  208: { category: 'process', factoryName: 'createExtremeProcess0', archetypeTag: 'pressure', metrics: { synergy: 0.637575, harmony: 0.631575, stability: 0.545870, corruption: 0.070000, loadPressure: 0.602809 } },
  209: { category: 'process', factoryName: 'createExtremeProcess1', archetypeTag: 'harmonizer', metrics: { synergy: 0.644400, harmony: 0.670700, stability: 0.493215, corruption: 0.080736, loadPressure: 0.501793 } },

  // Integration (3xx)
  301: { category: 'integration', factoryName: 'createKnotTrefoil', archetypeTag: 'stabilizer', metrics: { synergy: 0.823109, harmony: 0.657916, stability: 0.557313, corruption: 0.065019, loadPressure: 0.663425 } },
  302: { category: 'integration', factoryName: 'createKnotFigureEight', archetypeTag: 'pressure', metrics: { synergy: 0.815788, harmony: 0.679632, stability: 0.522941, corruption: 0.065342, loadPressure: 0.811858 } },
  303: { category: 'integration', factoryName: 'createKnotInfiniteSelfIntersecting', archetypeTag: 'harmonizer', metrics: { synergy: 0.846266, harmony: 0.713749, stability: 0.514789, corruption: 0.086784, loadPressure: 0.726242 } },
  304: { category: 'integration', factoryName: 'createKnotChaotic', archetypeTag: 'harmonizer', metrics: { synergy: 0.838945, harmony: 0.737865, stability: 0.486497, corruption: 0.088207, loadPressure: 0.619725 } },
  305: { category: 'integration', factoryName: 'createKnotBorromean', archetypeTag: 'harmonizer', metrics: { synergy: 0.869424, harmony: 0.760781, stability: 0.480625, corruption: 0.068769, loadPressure: 0.788509 } },
  306: { category: 'integration', factoryName: 'createKnotTorusKnot', archetypeTag: 'harmonizer', metrics: { synergy: 0.873303, harmony: 0.786097, stability: 0.446253, corruption: 0.050000, loadPressure: 0.685842 } },
  307: { category: 'integration', factoryName: 'createKnotTripleHelix', archetypeTag: 'amplifier', metrics: { synergy: 0.903082, harmony: 0.564613, stability: 0.438101, corruption: 0.053274, loadPressure: 0.593626 } },
  308: { category: 'integration', factoryName: 'createIntegrationEnhanced_SignalKnot', archetypeTag: 'amplifier', metrics: { synergy: 0.895061, harmony: 0.586329, stability: 0.409809, corruption: 0.053376, loadPressure: 0.742059 } },
  309: { category: 'integration', factoryName: 'createIntegrationEnhanced_ProtocolTangle', archetypeTag: 'stabilizer', metrics: { synergy: 0.920000, harmony: 0.620446, stability: 0.700000, corruption: 0.075039, loadPressure: 0.656443 } },
  310: { category: 'integration', factoryName: 'createIntegrationEnhanced_ContinuityBinder', archetypeTag: 'pressure', metrics: { synergy: 0.906618, harmony: 0.644562, stability: 0.589339, corruption: 0.075141, loadPressure: 0.799926 } },
  311: { category: 'integration', factoryName: 'createIntegrationNode', archetypeTag: 'amplifier', metrics: { synergy: 0.920000, harmony: 0.667478, stability: 0.581187, corruption: 0.100000, loadPressure: 0.718710 } },
  312: { category: 'integration', factoryName: 'createIntegrationNode0', archetypeTag: 'stabilizer', metrics: { synergy: 0.751176, harmony: 0.692794, stability: 0.552895, corruption: 0.093166, loadPressure: 0.616043 } },
  313: { category: 'integration', factoryName: 'createIntegrationNode1', archetypeTag: 'pressure', metrics: { synergy: 0.787255, harmony: 0.721310, stability: 0.547023, corruption: 0.069768, loadPressure: 0.773827 } },
  314: { category: 'integration', factoryName: 'createIntegrationNode2', archetypeTag: 'harmonizer', metrics: { synergy: 0.779934, harmony: 0.743026, stability: 0.512651, corruption: 0.050000, loadPressure: 0.672260 } },
  315: { category: 'integration', factoryName: 'createExtremeIntegration0', archetypeTag: 'pressure', metrics: { synergy: 0.810412, harmony: 0.777143, stability: 0.504499, corruption: 0.061533, loadPressure: 0.874704 } },
  316: { category: 'integration', factoryName: 'createKnotMobius', archetypeTag: 'pressure', metrics: { synergy: 0.803091, harmony: 0.551259, stability: 0.476207, corruption: 0.062956, loadPressure: 0.730127 } },

  // Analytics (4xx)
  401: { category: 'analytics', factoryName: 'createAnalyticsNode2', archetypeTag: 'risky', metrics: { synergy: 0.761500, harmony: 0.610942, stability: 0.512047, corruption: 0.135066, loadPressure: 0.602725 } },
  402: { category: 'analytics', factoryName: 'createAnalyticsNode3', archetypeTag: 'harmonizer', metrics: { synergy: 0.802200, harmony: 0.642858, stability: 0.517353, corruption: 0.151982, loadPressure: 0.518208 } },
  403: { category: 'analytics', factoryName: 'createAnalyticsObserverLens', archetypeTag: 'harmonizer', metrics: { synergy: 0.805100, harmony: 0.685575, stability: 0.445280, corruption: 0.100000, loadPressure: 0.666092 } },
  404: { category: 'analytics', factoryName: 'createAnalyticsFractalEcho', archetypeTag: 'amplifier', metrics: { synergy: 0.845800, harmony: 0.469092, stability: 0.446027, corruption: 0.100000, loadPressure: 0.577175 } },
  405: { category: 'analytics', factoryName: 'createAnalyticsParallaxOracle', archetypeTag: 'pressure', metrics: { synergy: 0.859900, harmony: 0.499408, stability: 0.399653, corruption: 0.103528, loadPressure: 0.735509 } },
  406: { category: 'analytics', factoryName: 'createAnalyticsEnhanced_SignalStratifier', archetypeTag: 'stabilizer', metrics: { synergy: 0.899900, harmony: 0.529350, stability: 0.700000, corruption: 0.119123, loadPressure: 0.634492 } },
  407: { category: 'analytics', factoryName: 'createAnalyticsEnhanced_TrendExcavator', archetypeTag: 'amplifier', metrics: { synergy: 0.873425, harmony: 0.561667, stability: 0.557067, corruption: 0.156278, loadPressure: 0.532926 } },
  408: { category: 'analytics', factoryName: 'createAnalyticsEnhanced_AnomalyLedger', archetypeTag: 'pressure', metrics: { synergy: 0.661325, harmony: 0.593583, stability: 0.557813, corruption: 0.166734, loadPressure: 0.698409 } },
  409: { category: 'analytics', factoryName: 'createAnalyticsNodeStyled_v2', archetypeTag: 'harmonizer', metrics: { synergy: 0.675425, harmony: 0.636300, stability: 0.511440, corruption: 0.100000, loadPressure: 0.596293 } },
  411: { category: 'analytics', factoryName: 'createExtremeAnalytics0', archetypeTag: 'pressure', metrics: { synergy: 0.718650, harmony: 0.670492, stability: 0.517527, corruption: 0.100000, loadPressure: 0.795088 } },
  412: { category: 'analytics', factoryName: 'createExtremeAnalytics1', archetypeTag: 'harmonizer', metrics: { synergy: 0.721200, harmony: 0.750000, stability: 0.469633, corruption: 0.123227, loadPressure: 0.666235 } },

  // Storage (5xx)
  501: { category: 'storage', factoryName: 'createStorageNode0', archetypeTag: 'stabilizer', metrics: { synergy: 0.507425, harmony: 0.629581, stability: 0.808079, corruption: 0.040986, loadPressure: 0.302425 } },
  502: { category: 'storage', factoryName: 'createStorageNode1', archetypeTag: 'harmonizer', metrics: { synergy: 0.500920, harmony: 0.665287, stability: 0.769788, corruption: 0.036138, loadPressure: 0.221208 } },
  503: { category: 'storage', factoryName: 'createStorageNode3', archetypeTag: 'harmonizer', metrics: { synergy: 0.532215, harmony: 0.690994, stability: 0.771776, corruption: 0.060000, loadPressure: 0.368542 } },
  504: { category: 'storage', factoryName: 'createStorageMnemonicVault', archetypeTag: 'harmonizer', metrics: { synergy: 0.536910, harmony: 0.750000, stability: 0.731965, corruption: 0.028660, loadPressure: 0.276325 } },
  505: { category: 'storage', factoryName: 'createStorageArchiveSpindle', archetypeTag: 'pressure', metrics: { synergy: 0.567505, harmony: 0.492406, stability: 0.726354, corruption: 0.048011, loadPressure: 0.471363 } },
  506: { category: 'storage', factoryName: 'createStorageMemoryReef', archetypeTag: 'amplifier', metrics: { synergy: 0.560300, harmony: 0.522513, stability: 0.688063, corruption: 0.045802, loadPressure: 0.339142 } },
  507: { category: 'storage', factoryName: 'createStorageEnhanced_ArchiveNexus', archetypeTag: 'amplifier', metrics: { synergy: 0.588795, harmony: 0.545819, stability: 0.690051, corruption: 0.034054, loadPressure: 0.232626 } },
  508: { category: 'storage', factoryName: 'createStorageEnhanced_MemoryCrypts', archetypeTag: 'amplifier', metrics: { synergy: 0.718740, harmony: 0.581525, stability: 0.650240, corruption: 0.029205, loadPressure: 0.401409 } },
  509: { category: 'storage', factoryName: 'createStorageEnhanced_DepthLayers', archetypeTag: 'stabilizer', metrics: { synergy: 0.426535, harmony: 0.607231, stability: 0.894629, corruption: 0.043496, loadPressure: 0.298743 } },
  510: { category: 'storage', factoryName: 'createObeliskCache', archetypeTag: 'stabilizer', metrics: { synergy: 0.419680, harmony: 0.631737, stability: 0.856338, corruption: 0.041507, loadPressure: 0.206526 } },
  511: { category: 'storage', factoryName: 'createFractalReservoir', archetypeTag: 'stabilizer', metrics: { synergy: 0.456575, harmony: 0.658644, stability: 0.858326, corruption: 0.040639, loadPressure: 0.354960 } },
  512: { category: 'storage', factoryName: 'createArchiveDrum', archetypeTag: 'harmonizer', metrics: { synergy: 0.450070, harmony: 0.688750, stability: 0.818515, corruption: 0.039750, loadPressure: 0.269343 } },
  513: { category: 'storage', factoryName: 'createStorageNodeStyled_v2', archetypeTag: 'harmonizer', metrics: { synergy: 0.481365, harmony: 0.712056, stability: 0.812904, corruption: 0.028001, loadPressure: 0.412827 } },
  515: { category: 'storage', factoryName: 'createExtremeStorage0', archetypeTag: 'pressure', metrics: { synergy: 0.475480, harmony: 0.498438, stability: 0.775588, corruption: 0.023248, loadPressure: 0.332135 } },
  516: { category: 'storage', factoryName: 'createExtremeStorage1', archetypeTag: 'stabilizer', metrics: { synergy: 0.506775, harmony: 0.524144, stability: 0.777576, corruption: 0.033894, loadPressure: 0.229469 } },

  // Control (6xx)
  601: { category: 'control', factoryName: 'createAxiomCrystalNode', archetypeTag: 'stabilizer', metrics: { synergy: 0.596928, harmony: 0.786122, stability: 0.866950, corruption: 0.032134, loadPressure: 0.431090 } },
  602: { category: 'control', factoryName: 'createControlNode0', archetypeTag: 'stabilizer', metrics: { synergy: 0.599065, harmony: 0.768299, stability: 0.862636, corruption: 0.023844, loadPressure: 0.358417 } },
  603: { category: 'control', factoryName: 'createControlNode2', archetypeTag: 'pressure', metrics: { synergy: 0.609884, harmony: 0.801935, stability: 0.838181, corruption: 0.040382, loadPressure: 0.476394 } },
  604: { category: 'control', factoryName: 'createControlNode1', archetypeTag: 'harmonizer', metrics: { synergy: 0.613694, harmony: 0.780159, stability: 0.836147, corruption: 0.035360, loadPressure: 0.393820 } },
  605: { category: 'control', factoryName: 'createControlCommandPyramid', archetypeTag: 'harmonizer', metrics: { synergy: 0.605975, harmony: 0.818413, stability: 0.805612, corruption: 0.030798, loadPressure: 0.328297 } },
  606: { category: 'control', factoryName: 'createControlHierarchyTower', archetypeTag: 'amplifier', metrics: { synergy: 0.711859, harmony: 0.676321, stability: 0.801298, corruption: 0.023135, loadPressure: 0.445174 } },
  607: { category: 'control', factoryName: 'createControlSymmetryCore', archetypeTag: 'amplifier', metrics: { synergy: 0.713250, harmony: 0.692792, stability: 0.776843, corruption: 0.034613, loadPressure: 0.375251 } },
  608: { category: 'control', factoryName: 'createExtremeControl0', archetypeTag: 'amplifier', metrics: { synergy: 0.773077, harmony: 0.702114, stability: 0.774809, corruption: 0.029811, loadPressure: 0.567661 } },
  609: { category: 'control', factoryName: 'createControlEnhanced_DecisionFork', archetypeTag: 'amplifier', metrics: { synergy: 0.732833, harmony: 0.718557, stability: 0.744274, corruption: 0.026129, loadPressure: 0.420554 } },
  610: { category: 'control', factoryName: 'createControlEnhanced_AuthorityHelix', archetypeTag: 'risky', metrics: { synergy: 0.566424, harmony: 0.733427, stability: 0.739960, corruption: 0.022427, loadPressure: 0.337981 } },
  611: { category: 'control', factoryName: 'createControlEnhanced_CommandMatrix', archetypeTag: 'pressure', metrics: { synergy: 0.556616, harmony: 0.767498, stability: 0.715505, corruption: 0.037865, loadPressure: 0.452718 } },
  612: { category: 'control', factoryName: 'createPhrixFlowArbiter', archetypeTag: 'harmonizer', metrics: { synergy: 0.584607, harmony: 0.784368, stability: 0.713471, corruption: 0.030203, loadPressure: 0.369595 } },
  613: { category: 'control', factoryName: 'createCrucisSuppressionGovernor', archetypeTag: 'pressure', metrics: { synergy: 0.559417, harmony: 0.790583, stability: 0.900000, corruption: 0.042121, loadPressure: 0.499672 } },
  614: { category: 'control', factoryName: 'createVertexTemporalGate', archetypeTag: 'stabilizer', metrics: { synergy: 0.542790, harmony: 0.778588, stability: 0.928622, corruption: 0.020000, loadPressure: 0.426998 } },
  615: { category: 'control', factoryName: 'createControlNode3', archetypeTag: 'stabilizer', metrics: { synergy: 0.544181, harmony: 0.801652, stability: 0.904167, corruption: 0.033637, loadPressure: 0.344975 } },
  616: { category: 'control', factoryName: 'createControlNodeStyled_v2', archetypeTag: 'stabilizer', metrics: { synergy: 0.553611, harmony: 0.774256, stability: 0.902133, corruption: 0.028614, loadPressure: 0.462402 } },
  618: { category: 'control', factoryName: 'createControlNodeStyled_v2_Legacy', archetypeTag: 'harmonizer', metrics: { synergy: 0.545604, harmony: 0.811823, stability: 0.872573, corruption: 0.050000, loadPressure: 0.397299 } },
  619: { category: 'control', factoryName: 'createControlSpecialGovernor', archetypeTag: 'stabilizer', metrics: { synergy: 0.560762, harmony: 0.800979, stability: 0.868259, corruption: 0.020000, loadPressure: 0.314176 } },
  620: { category: 'control', factoryName: 'createControlSpineVariant', archetypeTag: 'pressure', metrics: { synergy: 0.648167, harmony: 0.679135, stability: 0.813579, corruption: 0.027944, loadPressure: 0.444252 } },
  621: { category: 'control', factoryName: 'createExtremeControl1', archetypeTag: 'amplifier', metrics: { synergy: 0.677909, harmony: 0.706405, stability: 0.811545, corruption: 0.023142, loadPressure: 0.371579 } },

  // Quantum (7xx)
  701: { category: 'quantum', factoryName: 'createQuantumBloomNode', archetypeTag: 'amplifier', metrics: { synergy: 0.920000, harmony: 0.621525, stability: 0.474240, corruption: 0.122280, loadPressure: 0.779025 } },
  702: { category: 'quantum', factoryName: 'createQuantumLattice', archetypeTag: 'risky', metrics: { synergy: 0.756670, harmony: 0.456700, stability: 0.394380, corruption: 0.198725, loadPressure: 0.677458 } },
  703: { category: 'quantum', factoryName: 'createQuantumLotus', archetypeTag: 'pressure', metrics: { synergy: 0.794850, harmony: 0.540675, stability: 0.363160, corruption: 0.107780, loadPressure: 0.942375 } },
  705: { category: 'quantum', factoryName: 'createQuantumNodeStyled_v2', archetypeTag: 'harmonizer', metrics: { synergy: 0.818790, harmony: 0.750000, stability: 0.618140, corruption: 0.188040, loadPressure: 0.711175 } },

  // Sigma (8xx)
  804: { category: 'sigma', factoryName: 'createSigmaLatticeConductor', archetypeTag: 'harmonizer', metrics: { synergy: 0.745652, harmony: 0.705718, stability: 0.778630, corruption: 0.038340, loadPressure: 0.495225 } },
  805: { category: 'sigma', factoryName: 'createSigmaNode2', archetypeTag: 'risky', metrics: { synergy: 0.732010, harmony: 0.697550, stability: 0.720020, corruption: 0.080000, loadPressure: 0.410708 } },
  806: { category: 'sigma', factoryName: 'createSigmaNodeStyled_v2', archetypeTag: 'pressure', metrics: { synergy: 0.668532, harmony: 0.678128, stability: 0.883340, corruption: 0.030000, loadPressure: 0.673550 } },
  807: { category: 'sigma', factoryName: 'createSigmaBloomCrown', archetypeTag: 'amplifier', metrics: { synergy: 0.808482, harmony: 0.624388, stability: 0.817130, corruption: 0.046822, loadPressure: 0.469675 } },

  // Mythic (9xx)
  901: { category: 'mythic', factoryName: 'createMythicShardClusterNode', archetypeTag: 'pressure', metrics: { synergy: 0.783460, harmony: 0.724072, stability: 0.722468, corruption: 0.025335, loadPressure: 0.611540 } },
  902: { category: 'mythic', factoryName: 'createMythicBrokenMonolithNode', archetypeTag: 'amplifier', metrics: { synergy: 0.853195, harmony: 0.725295, stability: 0.671510, corruption: 0.010000, loadPressure: 0.511330 } },
  903: { category: 'mythic', factoryName: 'createMythicFloatingFragmentsNode', archetypeTag: 'harmonizer', metrics: { synergy: 0.812336, harmony: 0.794691, stability: 0.642973, corruption: 0.022813, loadPressure: 0.389670 } },
  904: { category: 'mythic', factoryName: 'createMythicCrackedPrismNode', archetypeTag: 'harmonizer', metrics: { synergy: 0.825138, harmony: 0.838927, stability: 0.585935, corruption: 0.023317, loadPressure: 0.578461 } },
  905: { category: 'mythic', factoryName: 'createMythicAncientCoreWithMissingNode', archetypeTag: 'stabilizer', metrics: { synergy: 0.717592, harmony: 0.707290, stability: 0.805118, corruption: 0.030000, loadPressure: 0.457901 } },
  906: { category: 'mythic', factoryName: 'createMythicCollapsedCrownNode', archetypeTag: 'pressure', metrics: { synergy: 0.750822, harmony: 0.725018, stability: 0.754160, corruption: 0.010000, loadPressure: 0.692943 } },
  908: { category: 'mythic', factoryName: 'createMythicNodeStyled_v2', archetypeTag: 'amplifier', metrics: { synergy: 0.826010, harmony: 0.677392, stability: 0.726598, corruption: 0.025687, loadPressure: 0.528411 } },

  // Prime (10xx)
  1001: { category: 'prime', factoryName: 'createPrimeNestedIcosahedronNode', archetypeTag: 'pressure', metrics: { synergy: 0.726045, harmony: 0.578205, stability: 0.935750, corruption: 0.020000, loadPressure: 0.730800 } },
  1002: { category: 'prime', factoryName: 'createPrimePerfectDodecahedronNode', archetypeTag: 'stabilizer', metrics: { synergy: 0.744230, harmony: 0.570690, stability: 0.925080, corruption: 0.010892, loadPressure: 0.639133 } },
  1003: { category: 'prime', factoryName: 'createPrimeStellaOctangulaNode', archetypeTag: 'harmonizer', metrics: { synergy: 0.728615, harmony: 0.644095, stability: 0.867290, corruption: 0.014773, loadPressure: 0.538117 } },
  1004: { category: 'prime', factoryName: 'createPrimePrecisionLatticeNode', archetypeTag: 'harmonizer', metrics: { synergy: 0.741350, harmony: 0.637470, stability: 0.861180, corruption: 0.005555, loadPressure: 0.686550 } },
  1005: { category: 'prime', factoryName: 'createPrimeTesseractProjectionNode', archetypeTag: 'harmonizer', metrics: { synergy: 0.724185, harmony: 0.713945, stability: 0.801870, corruption: 0.015916, loadPressure: 0.602034 } },
  1006: { category: 'prime', factoryName: 'createPrimeSymmetryLockedCoreNode', archetypeTag: 'pressure', metrics: { synergy: 0.740000, harmony: 0.600000, stability: 0.900000, corruption: 0.005000, loadPressure: 0.818297 } },
  1008: { category: 'prime', factoryName: 'createPrimeNodeStyled_v2', archetypeTag: 'stabilizer', metrics: { synergy: 0.724265, harmony: 0.581545, stability: 0.934190, corruption: 0.014338, loadPressure: 0.661526 } },

  // Error (11xx)
  1101: { category: 'error', factoryName: 'createErrorIntersectingSolidsNode', archetypeTag: 'pressure', metrics: { synergy: 0.106188, harmony: 0.052412, stability: 0.353565, corruption: 0.718715, loadPressure: 0.808703 } },
  1102: { category: 'error', factoryName: 'createErrorInvertedNormalsNode', archetypeTag: 'risky', metrics: { synergy: 0.131850, harmony: 0.086775, stability: 0.283980, corruption: 0.793060, loadPressure: 0.657140 } },
  1103: { category: 'error', factoryName: 'createErrorSelfClippingNode', archetypeTag: 'risky', metrics: { synergy: 0.185862, harmony: 0.143912, stability: 0.248595, corruption: 0.824985, loadPressure: 0.552530 } },
  1104: { category: 'error', factoryName: 'createErrorFoldedImpossibleNode', archetypeTag: 'pressure', metrics: { synergy: 0.199975, harmony: 0.194250, stability: 0.180530, corruption: 0.663970, loadPressure: 0.727021 } },
  1105: { category: 'error', factoryName: 'createErrorTopologyTearNode', archetypeTag: 'harmonizer', metrics: { synergy: 0.257837, harmony: 0.380587, stability: 0.152745, corruption: 0.762515, loadPressure: 0.626811 } },
  1106: { category: 'error', factoryName: 'createErrorCorruptedManifoldNode', archetypeTag: 'stabilizer', metrics: { synergy: 0.272300, harmony: 0.059725, stability: 0.509620, corruption: 0.839500, loadPressure: 0.505151 } },
  1108: { category: 'error', factoryName: 'createErrorNodeStyled_v2', archetypeTag: 'amplifier', metrics: { synergy: 0.435188, harmony: 0.111938, stability: 0.348945, corruption: 0.825000, loadPressure: 0.694571 } },

  // Emotional (12xx)
  1201: { category: 'emotional', factoryName: 'createEmotionalHeartCrystal', archetypeTag: 'stabilizer', metrics: { synergy: 0.557785, harmony: 0.332125, stability: 0.637613, corruption: 0.097738, loadPressure: 0.424310 } },
  1202: { category: 'emotional', factoryName: 'createEmotionalNeuralLobe', archetypeTag: 'pressure', metrics: { synergy: 0.618890, harmony: 0.454400, stability: 0.486035, corruption: 0.131500, loadPressure: 0.651807 } },
  1203: { category: 'emotional', factoryName: 'createEmotionalBloomingGem', archetypeTag: 'risky', metrics: { synergy: 0.640095, harmony: 0.559475, stability: 0.428997, corruption: 0.168823, loadPressure: 0.511704 } },
  1204: { category: 'emotional', factoryName: 'createEmotionalTearShaped', archetypeTag: 'pressure', metrics: { synergy: 0.705050, harmony: 0.664150, stability: 0.398180, corruption: 0.060000, loadPressure: 0.741501 } },
  1205: { category: 'emotional', factoryName: 'createEmotionalFolded', archetypeTag: 'harmonizer', metrics: { synergy: 0.726605, harmony: 0.779625, stability: 0.347222, corruption: 0.112552, loadPressure: 0.605148 } },
  1206: { category: 'emotional', factoryName: 'createEmotionalSymmetricSeed', archetypeTag: 'amplifier', metrics: { synergy: 0.785960, harmony: 0.385900, stability: 0.318685, corruption: 0.143675, loadPressure: 0.466144 } },
  1207: { category: 'emotional', factoryName: 'createEmotionalNodeStyled_v2', archetypeTag: 'amplifier', metrics: { synergy: 0.807515, harmony: 0.488975, stability: 0.511647, corruption: 0.165938, loadPressure: 0.676591 } },

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
