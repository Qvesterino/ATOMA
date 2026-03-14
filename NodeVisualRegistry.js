// Canonical visual registry: visualCode -> { category, factoryName, metrics }
export const NODE_VISUAL_REGISTRY = {
  // Input (1xx)
  101: { category: 'input', factoryName: 'createInputSignalReceptor', metrics: { synergy: 0.601122, harmony: 0.654518, stability: 0.551914, corruption: 0.034695, loadPressure: 0.274425 } },
  102: { category: 'input', factoryName: 'createInputDataGateway', metrics: { synergy: 0.621924, harmony: 0.694511, stability: 0.521752, corruption: 0.051501, loadPressure: 0.429458 } },
  103: { category: 'input', factoryName: 'createInputIncomingFunnel', metrics: { synergy: 0.642725, harmony: 0.734505, stability: 0.491591, corruption: 0.068308, loadPressure: 0.334492 } },
  104: { category: 'input', factoryName: 'createInputSensory_TactileSensor', metrics: { synergy: 0.663527, harmony: 0.774498, stability: 0.461430, corruption: 0.005114, loadPressure: 0.489525 } },
  105: { category: 'input', factoryName: 'createInputSensory_EchoDetector', metrics: { synergy: 0.684329, harmony: 0.564491, stability: 0.681268, corruption: 0.021921, loadPressure: 0.394559 } },
  106: { category: 'input', factoryName: 'createInputSensory_NeuralReceptor', metrics: { synergy: 0.705131, harmony: 0.604484, stability: 0.651107, corruption: 0.038727, loadPressure: 0.299592 } },
  107: { category: 'input', factoryName: 'createInputNodeStyled_v2', metrics: { synergy: 0.725933, harmony: 0.644477, stability: 0.620945, corruption: 0.055534, loadPressure: 0.454626 } },
  108: { category: 'input', factoryName: 'createInputNode3', metrics: { synergy: 0.746735, harmony: 0.684470, stability: 0.590784, corruption: 0.072340, loadPressure: 0.359659 } },
  110: { category: 'input', factoryName: 'createExtremeInput0', metrics: { synergy: 0.568156, harmony: 0.725139, stability: 0.561598, corruption: 0.009299, loadPressure: 0.265218 } },
  111: { category: 'input', factoryName: 'createExtremeInput1', metrics: { synergy: 0.566018, harmony: 0.765132, stability: 0.531436, corruption: 0.026105, loadPressure: 0.420251 } },

  // Process (2xx)
  201: { category: 'process', factoryName: 'createProcessFluxChamber', metrics: { synergy: 0.675650, harmony: 0.580475, stability: 0.515875, corruption: 0.095772, loadPressure: 0.498325 } },
  202: { category: 'process', factoryName: 'createProcessTransformationSpine', metrics: { synergy: 0.704175, harmony: 0.624400, stability: 0.482600, corruption: 0.123480, loadPressure: 0.653358 } },
  203: { category: 'process', factoryName: 'createProcessConversionOrbit', metrics: { synergy: 0.732700, harmony: 0.648750, stability: 0.449325, corruption: 0.031188, loadPressure: 0.558392 } },
  204: { category: 'process', factoryName: 'createProcessEnhanced_FlowRecomposer', metrics: { synergy: 0.761225, harmony: 0.692675, stability: 0.416050, corruption: 0.058896, loadPressure: 0.463425 } },
  205: { category: 'process', factoryName: 'createProcessEnhanced_TemporalShifter', metrics: { synergy: 0.789750, harmony: 0.486600, stability: 0.632775, corruption: 0.086604, loadPressure: 0.618459 } },
  206: { category: 'process', factoryName: 'createProcessEnhanced_IterativeEngine', metrics: { synergy: 0.818275, harmony: 0.530525, stability: 0.599500, corruption: 0.114312, loadPressure: 0.523492 } },
  207: { category: 'process', factoryName: 'createProcessNode', metrics: { synergy: 0.846800, harmony: 0.574450, stability: 0.566225, corruption: 0.142020, loadPressure: 0.678526 } },
  208: { category: 'process', factoryName: 'createExtremeProcess0', metrics: { synergy: 0.625325, harmony: 0.618375, stability: 0.532950, corruption: 0.049728, loadPressure: 0.583559 } },
  209: { category: 'process', factoryName: 'createExtremeProcess1', metrics: { synergy: 0.653850, harmony: 0.662300, stability: 0.499675, corruption: 0.077436, loadPressure: 0.488593 } },

  // Integration (3xx)
  301: { category: 'integration', factoryName: 'createKnotTrefoil', metrics: { synergy: 0.808759, harmony: 0.665116, stability: 0.547053, corruption: 0.062599, loadPressure: 0.672225 } },
  302: { category: 'integration', factoryName: 'createKnotFigureEight', metrics: { synergy: 0.822438, harmony: 0.691232, stability: 0.527881, corruption: 0.072162, loadPressure: 0.827258 } },
  303: { category: 'integration', factoryName: 'createKnotInfiniteSelfIntersecting', metrics: { synergy: 0.836116, harmony: 0.717349, stability: 0.508709, corruption: 0.081724, loadPressure: 0.732292 } },
  304: { category: 'integration', factoryName: 'createKnotChaotic', metrics: { synergy: 0.849795, harmony: 0.743465, stability: 0.489537, corruption: 0.091287, loadPressure: 0.637325 } },
  305: { category: 'integration', factoryName: 'createKnotBorromean', metrics: { synergy: 0.863474, harmony: 0.769581, stability: 0.470365, corruption: 0.030849, loadPressure: 0.792359 } },
  306: { category: 'integration', factoryName: 'createKnotTorusKnot', metrics: { synergy: 0.877153, harmony: 0.795697, stability: 0.451193, corruption: 0.040411, loadPressure: 0.697392 } },
  307: { category: 'integration', factoryName: 'createKnotTripleHelix', metrics: { synergy: 0.890832, harmony: 0.571813, stability: 0.432021, corruption: 0.049974, loadPressure: 0.602426 } },
  308: { category: 'integration', factoryName: 'createIntegrationEnhanced_SignalKnot', metrics: { synergy: 0.904511, harmony: 0.597929, stability: 0.412849, corruption: 0.059536, loadPressure: 0.757459 } },
  309: { category: 'integration', factoryName: 'createIntegrationEnhanced_ProtocolTangle', metrics: { synergy: 0.918189, harmony: 0.624046, stability: 0.643676, corruption: 0.069099, loadPressure: 0.662493 } },
  310: { category: 'integration', factoryName: 'createIntegrationEnhanced_ContinuityBinder', metrics: { synergy: 0.931868, harmony: 0.650162, stability: 0.594279, corruption: 0.078661, loadPressure: 0.817526 } },
  311: { category: 'integration', factoryName: 'createIntegrationNode', metrics: { synergy: 0.945547, harmony: 0.676278, stability: 0.575107, corruption: 0.088224, loadPressure: 0.722560 } },
  312: { category: 'integration', factoryName: 'createIntegrationNode0', metrics: { synergy: 0.759226, harmony: 0.702394, stability: 0.555935, corruption: 0.097786, loadPressure: 0.627593 } },
  313: { category: 'integration', factoryName: 'createIntegrationNode1', metrics: { synergy: 0.772905, harmony: 0.728510, stability: 0.536763, corruption: 0.037348, loadPressure: 0.782627 } },
  314: { category: 'integration', factoryName: 'createIntegrationNode2', metrics: { synergy: 0.786584, harmony: 0.754626, stability: 0.517591, corruption: 0.046911, loadPressure: 0.687660 } },
  315: { category: 'integration', factoryName: 'createExtremeIntegration0', metrics: { synergy: 0.800262, harmony: 0.780743, stability: 0.498419, corruption: 0.056473, loadPressure: 0.842694 } },
  316: { category: 'integration', factoryName: 'createKnotMobius', metrics: { synergy: 0.813941, harmony: 0.556859, stability: 0.479247, corruption: 0.066036, loadPressure: 0.747727 } },

  // Analytics (4xx)
  401: { category: 'analytics', factoryName: 'createAnalyticsNode2', metrics: { synergy: 0.768150, harmony: 0.597742, stability: 0.524587, corruption: 0.130006, loadPressure: 0.596125 } },
  402: { category: 'analytics', factoryName: 'createAnalyticsNode3', metrics: { synergy: 0.792050, harmony: 0.634458, stability: 0.502533, corruption: 0.155062, loadPressure: 0.501158 } },
  403: { category: 'analytics', factoryName: 'createAnalyticsObserverLens', metrics: { synergy: 0.815950, harmony: 0.671175, stability: 0.456300, corruption: 0.050117, loadPressure: 0.656192 } },
  404: { category: 'analytics', factoryName: 'createAnalyticsFractalEcho', metrics: { synergy: 0.839850, harmony: 0.457892, stability: 0.434247, corruption: 0.075172, loadPressure: 0.561225 } },
  405: { category: 'analytics', factoryName: 'createAnalyticsParallaxOracle', metrics: { synergy: 0.863750, harmony: 0.494608, stability: 0.412193, corruption: 0.100228, loadPressure: 0.716259 } },
  406: { category: 'analytics', factoryName: 'createAnalyticsEnhanced_SignalStratifier', metrics: { synergy: 0.887650, harmony: 0.511750, stability: 0.590140, corruption: 0.125283, loadPressure: 0.621292 } },
  407: { category: 'analytics', factoryName: 'createAnalyticsEnhanced_TrendExcavator', metrics: { synergy: 0.882875, harmony: 0.548467, stability: 0.568087, corruption: 0.150338, loadPressure: 0.526326 } },
  408: { category: 'analytics', factoryName: 'createAnalyticsEnhanced_AnomalyLedger', metrics: { synergy: 0.656775, harmony: 0.585183, stability: 0.546033, corruption: 0.175394, loadPressure: 0.681359 } },
  409: { category: 'analytics', factoryName: 'createAnalyticsNodeStyled_v2', metrics: { synergy: 0.680675, harmony: 0.621900, stability: 0.523980, corruption: 0.070449, loadPressure: 0.586393 } },
  411: { category: 'analytics', factoryName: 'createExtremeAnalytics0', metrics: { synergy: 0.705350, harmony: 0.659292, stability: 0.502707, corruption: 0.095751, loadPressure: 0.741951 } },
  412: { category: 'analytics', factoryName: 'createExtremeAnalytics1', metrics: { synergy: 0.729250, harmony: 0.696008, stability: 0.480653, corruption: 0.120807, loadPressure: 0.646985 } },

  // Storage (5xx)
  501: { category: 'storage', factoryName: 'createStorageNode0', metrics: { synergy: 0.497275, harmony: 0.641181, stability: 0.799719, corruption: 0.033066, loadPressure: 0.320025 } },
  502: { category: 'storage', factoryName: 'createStorageNode1', metrics: { synergy: 0.511770, harmony: 0.668887, stability: 0.779288, corruption: 0.040318, loadPressure: 0.225058 } },
  503: { category: 'storage', factoryName: 'createStorageNode3', metrics: { synergy: 0.526265, harmony: 0.696594, stability: 0.758856, corruption: 0.047569, loadPressure: 0.380092 } },
  504: { category: 'storage', factoryName: 'createStorageMnemonicVault', metrics: { synergy: 0.540760, harmony: 0.724300, stability: 0.738425, corruption: 0.004820, loadPressure: 0.285125 } },
  505: { category: 'storage', factoryName: 'createStorageArchiveSpindle', metrics: { synergy: 0.555255, harmony: 0.502006, stability: 0.717994, corruption: 0.012071, loadPressure: 0.440159 } },
  506: { category: 'storage', factoryName: 'createStorageMemoryReef', metrics: { synergy: 0.569750, harmony: 0.529713, stability: 0.697563, corruption: 0.019322, loadPressure: 0.345192 } },
  507: { category: 'storage', factoryName: 'createStorageEnhanced_ArchiveNexus', metrics: { synergy: 0.584245, harmony: 0.557419, stability: 0.677131, corruption: 0.026574, loadPressure: 0.250226 } },
  508: { category: 'storage', factoryName: 'createStorageEnhanced_MemoryCrypts', metrics: { synergy: 0.598740, harmony: 0.585125, stability: 0.656700, corruption: 0.033825, loadPressure: 0.405259 } },
  509: { category: 'storage', factoryName: 'createStorageEnhanced_DepthLayers', metrics: { synergy: 0.413235, harmony: 0.612831, stability: 0.886269, corruption: 0.041076, loadPressure: 0.310293 } },
  510: { category: 'storage', factoryName: 'createObeliskCache', metrics: { synergy: 0.427730, harmony: 0.640537, stability: 0.865838, corruption: 0.048327, loadPressure: 0.215326 } },
  511: { category: 'storage', factoryName: 'createFractalReservoir', metrics: { synergy: 0.442225, harmony: 0.668244, stability: 0.845406, corruption: 0.005579, loadPressure: 0.370360 } },
  512: { category: 'storage', factoryName: 'createArchiveDrum', metrics: { synergy: 0.456720, harmony: 0.695950, stability: 0.824975, corruption: 0.012830, loadPressure: 0.275393 } },
  513: { category: 'storage', factoryName: 'createStorageNodeStyled_v2', metrics: { synergy: 0.471215, harmony: 0.723656, stability: 0.804544, corruption: 0.020081, loadPressure: 0.430427 } },
  515: { category: 'storage', factoryName: 'createExtremeStorage0', metrics: { synergy: 0.486330, harmony: 0.502038, stability: 0.785088, corruption: 0.027428, loadPressure: 0.335985 } },
  516: { category: 'storage', factoryName: 'createExtremeStorage1', metrics: { synergy: 0.500825, harmony: 0.529744, stability: 0.764656, corruption: 0.030594, loadPressure: 0.241019 } },

  // Control (6xx)
  601: { category: 'control', factoryName: 'createAxiomCrystalNode', metrics: { synergy: 0.651351, harmony: 0.806770, stability: 0.871890, corruption: 0.028834, loadPressure: 0.415140 } },
  602: { category: 'control', factoryName: 'createControlNode0', metrics: { synergy: 0.662543, harmony: 0.828040, stability: 0.856556, corruption: 0.030004, loadPressure: 0.339167 } },
  603: { category: 'control', factoryName: 'createControlNode2', metrics: { synergy: 0.673734, harmony: 0.849311, stability: 0.841221, corruption: 0.034442, loadPressure: 0.463194 } },
  604: { category: 'control', factoryName: 'createControlNode1', metrics: { synergy: 0.684926, harmony: 0.870581, stability: 0.825887, corruption: 0.038880, loadPressure: 0.387220 } },
  605: { category: 'control', factoryName: 'createControlCommandPyramid', metrics: { synergy: 0.696117, harmony: 0.891851, stability: 0.810552, corruption: 0.003318, loadPressure: 0.311247 } },
  606: { category: 'control', factoryName: 'createControlHierarchyTower', metrics: { synergy: 0.707309, harmony: 0.663121, stability: 0.795218, corruption: 0.007755, loadPressure: 0.435274 } },
  607: { category: 'control', factoryName: 'createControlSymmetryCore', metrics: { synergy: 0.718500, harmony: 0.684392, stability: 0.779883, corruption: 0.012193, loadPressure: 0.359301 } },
  608: { category: 'control', factoryName: 'createExtremeControl0', metrics: { synergy: 0.729691, harmony: 0.705662, stability: 0.764549, corruption: 0.016631, loadPressure: 0.483328 } },
  609: { category: 'control', factoryName: 'createControlEnhanced_DecisionFork', metrics: { synergy: 0.740883, harmony: 0.707357, stability: 0.749214, corruption: 0.021069, loadPressure: 0.407354 } },
  610: { category: 'control', factoryName: 'createControlEnhanced_AuthorityHelix', metrics: { synergy: 0.552074, harmony: 0.728627, stability: 0.733880, corruption: 0.025507, loadPressure: 0.331381 } },
  611: { category: 'control', factoryName: 'createControlEnhanced_CommandMatrix', metrics: { synergy: 0.563266, harmony: 0.749898, stability: 0.718545, corruption: 0.029945, loadPressure: 0.435668 } },
  612: { category: 'control', factoryName: 'createPhrixFlowArbiter', metrics: { synergy: 0.574457, harmony: 0.771168, stability: 0.703211, corruption: 0.034383, loadPressure: 0.359695 } },
  613: { category: 'control', factoryName: 'createCrucisSuppressionGovernor', metrics: { synergy: 0.585649, harmony: 0.792438, stability: 0.937876, corruption: 0.038821, loadPressure: 0.483722 } },
  614: { category: 'control', factoryName: 'createVertexTemporalGate', metrics: { synergy: 0.596840, harmony: 0.813708, stability: 0.922542, corruption: 0.003259, loadPressure: 0.407748 } },
  615: { category: 'control', factoryName: 'createControlNode3', metrics: { synergy: 0.608031, harmony: 0.834979, stability: 0.907207, corruption: 0.007697, loadPressure: 0.331775 } },
  616: { category: 'control', factoryName: 'createControlNodeStyled_v2', metrics: { synergy: 0.619223, harmony: 0.856249, stability: 0.891873, corruption: 0.012134, loadPressure: 0.455802 } },
  618: { category: 'control', factoryName: 'createControlNodeStyled_v2_Legacy', metrics: { synergy: 0.631034, harmony: 0.878194, stability: 0.877513, corruption: 0.016648, loadPressure: 0.380249 } },
  619: { category: 'control', factoryName: 'createControlSpecialGovernor', metrics: { synergy: 0.642226, harmony: 0.899464, stability: 0.862179, corruption: 0.021086, loadPressure: 0.304276 } },
  620: { category: 'control', factoryName: 'createControlSpineVariant', metrics: { synergy: 0.653417, harmony: 0.670735, stability: 0.816619, corruption: 0.025524, loadPressure: 0.428302 } },
  621: { category: 'control', factoryName: 'createExtremeControl1', metrics: { synergy: 0.664609, harmony: 0.692005, stability: 0.801285, corruption: 0.029962, loadPressure: 0.352329 } },

  // Quantum (7xx)
  701: { category: 'quantum', factoryName: 'createQuantumBloomNode', metrics: { synergy: 0.915500, harmony: 0.625125, stability: 0.459420, corruption: 0.116340, loadPressure: 0.817825 } },
  702: { category: 'quantum', factoryName: 'createQuantumLattice', metrics: { synergy: 0.760520, harmony: 0.462300, stability: 0.405400, corruption: 0.208320, loadPressure: 0.722858 } },
  703: { category: 'quantum', factoryName: 'createQuantumLotus', metrics: { synergy: 0.782600, harmony: 0.549475, stability: 0.351380, corruption: 0.100300, loadPressure: 0.877892 } },
  705: { category: 'quantum', factoryName: 'createQuantumNodeStyled_v2', metrics: { synergy: 0.828240, harmony: 0.637325, stability: 0.498140, corruption: 0.192660, loadPressure: 0.758775 } },

  // Sigma (8xx)
  804: { category: 'sigma', factoryName: 'createSigmaLatticeConductor', metrics: { synergy: 0.874740, harmony: 0.849175, stability: 0.788130, corruption: 0.030860, loadPressure: 0.518625 } },
  805: { category: 'sigma', factoryName: 'createSigmaNode2', metrics: { synergy: 0.719760, harmony: 0.686350, stability: 0.707100, corruption: 0.058454, loadPressure: 0.423658 } },
  806: { category: 'sigma', factoryName: 'createSigmaNodeStyled_v2', metrics: { synergy: 0.764780, harmony: 0.773525, stability: 0.889800, corruption: 0.026048, loadPressure: 0.578692 } },
  807: { category: 'sigma', factoryName: 'createSigmaBloomCrown', metrics: { synergy: 0.809800, harmony: 0.610700, stability: 0.808770, corruption: 0.053642, loadPressure: 0.483725 } },

  // Mythic (9xx)
  901: { category: 'mythic', factoryName: 'createMythicShardClusterNode', metrics: { synergy: 0.947249, harmony: 0.923730, stability: 0.716388, corruption: 0.002915, loadPressure: 0.629140 } },
  902: { category: 'mythic', factoryName: 'createMythicBrokenMonolithNode', metrics: { synergy: 0.972782, harmony: 0.767520, stability: 0.674550, corruption: 0.011559, loadPressure: 0.515180 } },
  903: { category: 'mythic', factoryName: 'createMythicFloatingFragmentsNode', metrics: { synergy: 0.818315, harmony: 0.811310, stability: 0.632713, corruption: 0.017753, loadPressure: 0.401220 } },
  904: { category: 'mythic', factoryName: 'createMythicCrackedPrismNode', metrics: { synergy: 0.843848, harmony: 0.855100, stability: 0.590875, corruption: 0.026397, loadPressure: 0.587261 } },
  905: { category: 'mythic', factoryName: 'createMythicAncientCoreWithMissingNode', metrics: { synergy: 0.869381, harmony: 0.898890, stability: 0.799038, corruption: 0.005042, loadPressure: 0.473301 } },
  906: { category: 'mythic', factoryName: 'createMythicCollapsedCrownNode', metrics: { synergy: 0.894914, harmony: 0.942680, stability: 0.757200, corruption: 0.013686, loadPressure: 0.659341 } },
  908: { category: 'mythic', factoryName: 'createMythicNodeStyled_v2', metrics: { synergy: 0.921005, harmony: 0.787010, stability: 0.716338, corruption: 0.022387, loadPressure: 0.546011 } },

  // Prime (10xx)
  1001: { category: 'prime', factoryName: 'createPrimeNestedIcosahedronNode', metrics: { synergy: 0.985495, harmony: 0.993513, stability: 0.946770, corruption: 0.001091, loadPressure: 0.714850 } },
  1002: { category: 'prime', factoryName: 'createPrimePerfectDodecahedronNode', metrics: { synergy: 0.999680, harmony: 0.876355, stability: 0.913300, corruption: 0.003972, loadPressure: 0.619883 } },
  1003: { category: 'prime', factoryName: 'createPrimeStellaOctangulaNode', metrics: { synergy: 0.913865, harmony: 0.909197, stability: 0.879830, corruption: 0.006853, loadPressure: 0.524917 } },
  1004: { category: 'prime', factoryName: 'createPrimePrecisionLatticeNode', metrics: { synergy: 0.928050, harmony: 0.942040, stability: 0.846360, corruption: 0.009735, loadPressure: 0.679950 } },
  1005: { category: 'prime', factoryName: 'createPrimeTesseractProjectionNode', metrics: { synergy: 0.942235, harmony: 0.974882, stability: 0.812890, corruption: 0.002616, loadPressure: 0.584984 } },
  1006: { category: 'prime', factoryName: 'createPrimeSymmetryLockedCoreNode', metrics: { synergy: 0.956420, harmony: 0.857725, stability: 0.979420, corruption: 0.005498, loadPressure: 0.740017 } },
  1008: { category: 'prime', factoryName: 'createPrimeNodeStyled_v2', metrics: { synergy: 0.970915, harmony: 0.890973, stability: 0.946730, corruption: 0.008398, loadPressure: 0.645576 } },

  // Error (11xx)
  1101: { category: 'error', factoryName: 'createErrorIntersectingSolidsNode', metrics: { synergy: 0.101638, harmony: 0.061212, stability: 0.340645, corruption: 0.710795, loadPressure: 0.786500 } },
  1102: { category: 'error', factoryName: 'createErrorInvertedNormalsNode', metrics: { synergy: 0.137100, harmony: 0.096375, stability: 0.290440, corruption: 0.797240, loadPressure: 0.672540 } },
  1103: { category: 'error', factoryName: 'createErrorSelfClippingNode', metrics: { synergy: 0.172562, harmony: 0.151112, stability: 0.240235, corruption: 0.883685, loadPressure: 0.558580 } },
  1104: { category: 'error', factoryName: 'createErrorFoldedImpossibleNode', metrics: { synergy: 0.208025, harmony: 0.205850, stability: 0.190030, corruption: 0.670130, loadPressure: 0.744621 } },
  1105: { category: 'error', factoryName: 'createErrorTopologyTearNode', metrics: { synergy: 0.243487, harmony: 0.260587, stability: 0.139825, corruption: 0.756575, loadPressure: 0.630661 } },
  1106: { category: 'error', factoryName: 'createErrorCorruptedManifoldNode', metrics: { synergy: 0.278950, harmony: 0.065325, stability: 0.389620, corruption: 0.843020, loadPressure: 0.516701 } },
  1108: { category: 'error', factoryName: 'createErrorNodeStyled_v2', metrics: { synergy: 0.315188, harmony: 0.120738, stability: 0.340585, corruption: 0.930035, loadPressure: 0.703371 } },

  // Emotional (12xx)
  1201: { category: 'emotional', factoryName: 'createEmotionalHeartCrystal', metrics: { synergy: 0.563035, harmony: 0.327325, stability: 0.517613, corruption: 0.094438, loadPressure: 0.417710 } },
  1202: { category: 'emotional', factoryName: 'createEmotionalNeuralLobe', metrics: { synergy: 0.605590, harmony: 0.436800, stability: 0.475775, corruption: 0.137660, loadPressure: 0.634757 } },
  1203: { category: 'emotional', factoryName: 'createEmotionalBloomingGem', metrics: { synergy: 0.648145, harmony: 0.546275, stability: 0.433937, corruption: 0.180883, loadPressure: 0.501804 } },
  1204: { category: 'emotional', factoryName: 'createEmotionalTearShaped', metrics: { synergy: 0.690700, harmony: 0.655750, stability: 0.392100, corruption: 0.061850, loadPressure: 0.718851 } },
  1205: { category: 'emotional', factoryName: 'createEmotionalFolded', metrics: { synergy: 0.733255, harmony: 0.765225, stability: 0.350262, corruption: 0.105072, loadPressure: 0.585898 } },
  1206: { category: 'emotional', factoryName: 'createEmotionalSymmetricSeed', metrics: { synergy: 0.775810, harmony: 0.374700, stability: 0.308425, corruption: 0.148295, loadPressure: 0.452944 } },
  1207: { category: 'emotional', factoryName: 'createEmotionalNodeStyled_v2', metrics: { synergy: 0.818365, harmony: 0.484175, stability: 0.516587, corruption: 0.191518, loadPressure: 0.669991 } },

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
