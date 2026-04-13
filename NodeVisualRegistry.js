// Canonical visual registry: visualCode -> { category, factoryName, metrics }
// Metrics rebalanced per plans/node-metrics-rebalance-plan.md
// Design: every category has a unique fingerprint with meaningful trade-offs
// Hard cap: no metric exceeds 0.820 except category-defining traits (max 0.840)
// All values are organic (non-round) and synergy ≠ harmony ≠ stability always
export const NODE_VISUAL_REGISTRY = {
  // Input (1xx) — "The First Breath"
  // Fingerprint: harmony > stability > synergy — in-tune, reliable, not powerful
  101: { category: 'input', factoryName: 'createInputSignalReceptor', archetypeTag: 'stabilizer', metrics: { synergy: 0.382741, harmony: 0.461283, stability: 0.423817, corruption: 0.037142, loadPressure: 0.218473 } },
  102: { category: 'input', factoryName: 'createInputDataGateway', archetypeTag: 'pressure', metrics: { synergy: 0.398627, harmony: 0.475168, stability: 0.437294, corruption: 0.040583, loadPressure: 0.229381 } },
  103: { category: 'input', factoryName: 'createInputIncomingFunnel', archetypeTag: 'harmonizer', metrics: { synergy: 0.414513, harmony: 0.489054, stability: 0.450771, corruption: 0.044025, loadPressure: 0.240289 } },
  104: { category: 'input', factoryName: 'createInputSensory_TactileSensor', archetypeTag: 'pressure', metrics: { synergy: 0.430399, harmony: 0.502939, stability: 0.464248, corruption: 0.047466, loadPressure: 0.251197 } },
  105: { category: 'input', factoryName: 'createInputSensory_EchoDetector', archetypeTag: 'stabilizer', metrics: { synergy: 0.446285, harmony: 0.516825, stability: 0.477725, corruption: 0.050908, loadPressure: 0.262105 } },
  106: { category: 'input', factoryName: 'createInputSensory_NeuralReceptor', archetypeTag: 'stabilizer', metrics: { synergy: 0.462171, harmony: 0.530710, stability: 0.491202, corruption: 0.054349, loadPressure: 0.273013 } },
  107: { category: 'input', factoryName: 'createInputNodeStyled_v2', archetypeTag: 'amplifier', metrics: { synergy: 0.478057, harmony: 0.544596, stability: 0.504679, corruption: 0.057791, loadPressure: 0.283921 } },
  108: { category: 'input', factoryName: 'createInputNode3', archetypeTag: 'amplifier', metrics: { synergy: 0.493943, harmony: 0.558481, stability: 0.518156, corruption: 0.061232, loadPressure: 0.294829 } },
  110: { category: 'input', factoryName: 'createExtremeInput0', archetypeTag: 'harmonizer', metrics: { synergy: 0.509829, harmony: 0.572367, stability: 0.531633, corruption: 0.064674, loadPressure: 0.305737 } },
  111: { category: 'input', factoryName: 'createInputCelestialReceptorOrgan', archetypeTag: 'harmonizer', metrics: { synergy: 0.525715, harmony: 0.586252, stability: 0.545110, corruption: 0.068115, loadPressure: 0.316645 } },
  // Process (2xx) — "Where Pressure Becomes Structure"
  // Fingerprint: synergy > harmony > stability — transformative, volatile
  201: { category: 'process', factoryName: 'createProcessFluxChamber', archetypeTag: 'risky', metrics: { synergy: 0.518473, harmony: 0.412836, stability: 0.384721, corruption: 0.091847, loadPressure: 0.382174 } },
  202: { category: 'process', factoryName: 'createProcessTransformationSpine', archetypeTag: 'pressure', metrics: { synergy: 0.536281, harmony: 0.428174, stability: 0.398263, corruption: 0.099382, loadPressure: 0.397481 } },
  203: { category: 'process', factoryName: 'createProcessConversionOrbit', archetypeTag: 'harmonizer', metrics: { synergy: 0.554089, harmony: 0.443512, stability: 0.411805, corruption: 0.106917, loadPressure: 0.412788 } },
  204: { category: 'process', factoryName: 'createProcessEnhanced_FlowRecomposer', archetypeTag: 'harmonizer', metrics: { synergy: 0.571897, harmony: 0.458850, stability: 0.425347, corruption: 0.114452, loadPressure: 0.428095 } },
  205: { category: 'process', factoryName: 'createProcessEnhanced_TemporalShifter', archetypeTag: 'stabilizer', metrics: { synergy: 0.589705, harmony: 0.474188, stability: 0.438889, corruption: 0.121987, loadPressure: 0.443402 } },
  206: { category: 'process', factoryName: 'createProcessEnhanced_IterativeEngine', archetypeTag: 'amplifier', metrics: { synergy: 0.607513, harmony: 0.489526, stability: 0.452431, corruption: 0.129522, loadPressure: 0.458709 } },
  207: { category: 'process', factoryName: 'createProcessNode', archetypeTag: 'pressure', metrics: { synergy: 0.625321, harmony: 0.504864, stability: 0.465973, corruption: 0.137057, loadPressure: 0.474016 } },
  208: { category: 'process', factoryName: 'createExtremeProcess0', archetypeTag: 'pressure', metrics: { synergy: 0.643129, harmony: 0.520202, stability: 0.479515, corruption: 0.144592, loadPressure: 0.489323 } },
  209: { category: 'process', factoryName: 'createExtremeProcess1', archetypeTag: 'harmonizer', metrics: { synergy: 0.660937, harmony: 0.535540, stability: 0.493057, corruption: 0.152127, loadPressure: 0.504630 } },
  // Integration (3xx) — "Where Distinct Truths Become One"
  // Fingerprint: synergy >> harmony > stability — connects well, fragile
  301: { category: 'integration', factoryName: 'createKnotTrefoil', archetypeTag: 'stabilizer', metrics: { synergy: 0.583721, harmony: 0.438174, stability: 0.347289, corruption: 0.047283, loadPressure: 0.472839 } },
  302: { category: 'integration', factoryName: 'createKnotFigureEight', archetypeTag: 'pressure', metrics: { synergy: 0.594836, harmony: 0.448261, stability: 0.355412, corruption: 0.049817, loadPressure: 0.482741 } },
  303: { category: 'integration', factoryName: 'createKnotInfiniteSelfIntersecting', archetypeTag: 'harmonizer', metrics: { synergy: 0.605951, harmony: 0.458348, stability: 0.363535, corruption: 0.052351, loadPressure: 0.492643 } },
  304: { category: 'integration', factoryName: 'createKnotChaotic', archetypeTag: 'harmonizer', metrics: { synergy: 0.617066, harmony: 0.468435, stability: 0.371658, corruption: 0.054885, loadPressure: 0.502545 } },
  305: { category: 'integration', factoryName: 'createKnotBorromean', archetypeTag: 'harmonizer', metrics: { synergy: 0.628181, harmony: 0.478522, stability: 0.379781, corruption: 0.057419, loadPressure: 0.512447 } },
  306: { category: 'integration', factoryName: 'createKnotTorusKnot', archetypeTag: 'harmonizer', metrics: { synergy: 0.639296, harmony: 0.488609, stability: 0.387904, corruption: 0.059953, loadPressure: 0.522349 } },
  307: { category: 'integration', factoryName: 'createKnotTripleHelix', archetypeTag: 'amplifier', metrics: { synergy: 0.650411, harmony: 0.498696, stability: 0.396027, corruption: 0.062487, loadPressure: 0.532251 } },
  308: { category: 'integration', factoryName: 'createIntegrationEnhanced_SignalKnot', archetypeTag: 'amplifier', metrics: { synergy: 0.661526, harmony: 0.508783, stability: 0.404150, corruption: 0.065021, loadPressure: 0.542153 } },
  309: { category: 'integration', factoryName: 'createIntegrationEnhanced_ProtocolTangle', archetypeTag: 'stabilizer', metrics: { synergy: 0.672641, harmony: 0.518870, stability: 0.412273, corruption: 0.067555, loadPressure: 0.552055 } },
  310: { category: 'integration', factoryName: 'createIntegrationEnhanced_ContinuityBinder', archetypeTag: 'pressure', metrics: { synergy: 0.683756, harmony: 0.528957, stability: 0.420396, corruption: 0.070089, loadPressure: 0.561957 } },
  311: { category: 'integration', factoryName: 'createIntegrationNode', archetypeTag: 'amplifier', metrics: { synergy: 0.694871, harmony: 0.539044, stability: 0.428519, corruption: 0.072623, loadPressure: 0.571859 } },
  312: { category: 'integration', factoryName: 'createIntegrationNode0', archetypeTag: 'stabilizer', metrics: { synergy: 0.705986, harmony: 0.549131, stability: 0.436642, corruption: 0.075157, loadPressure: 0.581761 } },
  313: { category: 'integration', factoryName: 'createIntegrationNode1', archetypeTag: 'pressure', metrics: { synergy: 0.717101, harmony: 0.559218, stability: 0.444765, corruption: 0.077691, loadPressure: 0.591663 } },
  314: { category: 'integration', factoryName: 'createIntegrationNode2', archetypeTag: 'harmonizer', metrics: { synergy: 0.728216, harmony: 0.569305, stability: 0.452888, corruption: 0.080225, loadPressure: 0.601565 } },
  315: { category: 'integration', factoryName: 'createExtremeIntegration0', archetypeTag: 'pressure', metrics: { synergy: 0.739331, harmony: 0.579392, stability: 0.461011, corruption: 0.082759, loadPressure: 0.611467 } },
  316: { category: 'integration', factoryName: 'createKnotMobius', archetypeTag: 'pressure', metrics: { synergy: 0.750446, harmony: 0.589479, stability: 0.469134, corruption: 0.085293, loadPressure: 0.621369 } },
  // Analytics (4xx) — Observation, Insight
  // Fingerprint: synergy > harmony > stability — insightful, unstable
  401: { category: 'analytics', factoryName: 'createAnalyticsNode2', archetypeTag: 'risky', metrics: { synergy: 0.538174, harmony: 0.392847, stability: 0.318263, corruption: 0.103847, loadPressure: 0.402817 } },
  402: { category: 'analytics', factoryName: 'createAnalyticsNode3', archetypeTag: 'harmonizer', metrics: { synergy: 0.553826, harmony: 0.406392, stability: 0.331748, corruption: 0.111283, loadPressure: 0.418473 } },
  403: { category: 'analytics', factoryName: 'createAnalyticsObserverLens', archetypeTag: 'harmonizer', metrics: { synergy: 0.569478, harmony: 0.419937, stability: 0.345233, corruption: 0.118719, loadPressure: 0.434129 } },
  404: { category: 'analytics', factoryName: 'createAnalyticsFractalEcho', archetypeTag: 'amplifier', metrics: { synergy: 0.585130, harmony: 0.433482, stability: 0.358718, corruption: 0.126155, loadPressure: 0.449785 } },
  405: { category: 'analytics', factoryName: 'createAnalyticsParallaxOracle', archetypeTag: 'pressure', metrics: { synergy: 0.600782, harmony: 0.447027, stability: 0.372203, corruption: 0.133591, loadPressure: 0.465441 } },
  406: { category: 'analytics', factoryName: 'createAnalyticsEnhanced_SignalStratifier', archetypeTag: 'stabilizer', metrics: { synergy: 0.616434, harmony: 0.460572, stability: 0.385688, corruption: 0.141027, loadPressure: 0.481097 } },
  407: { category: 'analytics', factoryName: 'createAnalyticsEnhanced_TrendExcavator', archetypeTag: 'amplifier', metrics: { synergy: 0.632086, harmony: 0.474117, stability: 0.399173, corruption: 0.148463, loadPressure: 0.496753 } },
  408: { category: 'analytics', factoryName: 'createAnalyticsEnhanced_AnomalyLedger', archetypeTag: 'pressure', metrics: { synergy: 0.647738, harmony: 0.487662, stability: 0.412658, corruption: 0.155899, loadPressure: 0.512409 } },
  409: { category: 'analytics', factoryName: 'createAnalyticsNodeStyled_v2', archetypeTag: 'harmonizer', metrics: { synergy: 0.663390, harmony: 0.501207, stability: 0.426143, corruption: 0.163335, loadPressure: 0.528065 } },
  411: { category: 'analytics', factoryName: 'createExtremeAnalytics0', archetypeTag: 'pressure', metrics: { synergy: 0.679042, harmony: 0.514752, stability: 0.439628, corruption: 0.170771, loadPressure: 0.543721 } },
  412: { category: 'analytics', factoryName: 'createExtremeAnalytics1', archetypeTag: 'harmonizer', metrics: { synergy: 0.694694, harmony: 0.528297, stability: 0.453113, corruption: 0.178207, loadPressure: 0.559377 } },
  // Storage (5xx) — "Where Yesterday Becomes Tomorrow"
  // Fingerprint: stability >> harmony > synergy — rock-solid, isolated
  501: { category: 'storage', factoryName: 'createStorageNode0', archetypeTag: 'stabilizer', metrics: { synergy: 0.284731, harmony: 0.418263, stability: 0.623847, corruption: 0.021847, loadPressure: 0.218473 } },
  502: { category: 'storage', factoryName: 'createStorageNode1', archetypeTag: 'harmonizer', metrics: { synergy: 0.294128, harmony: 0.427481, stability: 0.632174, corruption: 0.023926, loadPressure: 0.224837 } },
  503: { category: 'storage', factoryName: 'createStorageNode3', archetypeTag: 'harmonizer', metrics: { synergy: 0.303525, harmony: 0.436699, stability: 0.640501, corruption: 0.026005, loadPressure: 0.231201 } },
  504: { category: 'storage', factoryName: 'createStorageMnemonicVault', archetypeTag: 'harmonizer', metrics: { synergy: 0.312922, harmony: 0.445917, stability: 0.648828, corruption: 0.028084, loadPressure: 0.237565 } },
  505: { category: 'storage', factoryName: 'createStorageArchiveSpindle', archetypeTag: 'pressure', metrics: { synergy: 0.322319, harmony: 0.455135, stability: 0.657155, corruption: 0.030163, loadPressure: 0.243929 } },
  506: { category: 'storage', factoryName: 'createStorageMemoryReef', archetypeTag: 'amplifier', metrics: { synergy: 0.331716, harmony: 0.464353, stability: 0.665482, corruption: 0.032242, loadPressure: 0.250293 } },
  507: { category: 'storage', factoryName: 'createStorageEnhanced_ArchiveNexus', archetypeTag: 'amplifier', metrics: { synergy: 0.341113, harmony: 0.473571, stability: 0.673809, corruption: 0.034321, loadPressure: 0.256657 } },
  508: { category: 'storage', factoryName: 'createStorageEnhanced_MemoryCrypts', archetypeTag: 'amplifier', metrics: { synergy: 0.350510, harmony: 0.482789, stability: 0.682136, corruption: 0.036400, loadPressure: 0.263021 } },
  509: { category: 'storage', factoryName: 'createStorageEnhanced_DepthLayers', archetypeTag: 'stabilizer', metrics: { synergy: 0.359907, harmony: 0.492007, stability: 0.690463, corruption: 0.038479, loadPressure: 0.269385 } },
  510: { category: 'storage', factoryName: 'createObeliskCache', archetypeTag: 'stabilizer', metrics: { synergy: 0.369304, harmony: 0.501225, stability: 0.698790, corruption: 0.040558, loadPressure: 0.275749 } },
  511: { category: 'storage', factoryName: 'createFractalReservoir', archetypeTag: 'stabilizer', metrics: { synergy: 0.378701, harmony: 0.510443, stability: 0.707117, corruption: 0.042637, loadPressure: 0.282113 } },
  512: { category: 'storage', factoryName: 'createArchiveDrum', archetypeTag: 'harmonizer', metrics: { synergy: 0.388098, harmony: 0.519661, stability: 0.715444, corruption: 0.044716, loadPressure: 0.288477 } },
  513: { category: 'storage', factoryName: 'createStorageNodeStyled_v2', archetypeTag: 'harmonizer', metrics: { synergy: 0.397495, harmony: 0.528879, stability: 0.723771, corruption: 0.046795, loadPressure: 0.294841 } },
  515: { category: 'storage', factoryName: 'createExtremeStorage0', archetypeTag: 'pressure', metrics: { synergy: 0.406892, harmony: 0.538097, stability: 0.732098, corruption: 0.048874, loadPressure: 0.301205 } },
  516: { category: 'storage', factoryName: 'createExtremeStorage1', archetypeTag: 'stabilizer', metrics: { synergy: 0.416289, harmony: 0.547315, stability: 0.740425, corruption: 0.050953, loadPressure: 0.307569 } },
  // Control (6xx) — Command, Governance
  // Fingerprint: stability > harmony > synergy — firm authority, not cooperative
  601: { category: 'control', factoryName: 'createAxiomCrystalNode', archetypeTag: 'stabilizer', metrics: { synergy: 0.392847, harmony: 0.583721, stability: 0.674839, corruption: 0.018472, loadPressure: 0.318473 } },
  602: { category: 'control', factoryName: 'createControlNode0', archetypeTag: 'stabilizer', metrics: { synergy: 0.401263, harmony: 0.591847, stability: 0.682174, corruption: 0.019836, loadPressure: 0.326841 } },
  603: { category: 'control', factoryName: 'createControlNode2', archetypeTag: 'pressure', metrics: { synergy: 0.409679, harmony: 0.599973, stability: 0.689509, corruption: 0.021200, loadPressure: 0.335209 } },
  604: { category: 'control', factoryName: 'createControlNode1', archetypeTag: 'harmonizer', metrics: { synergy: 0.418095, harmony: 0.608099, stability: 0.696844, corruption: 0.022564, loadPressure: 0.343577 } },
  605: { category: 'control', factoryName: 'createControlCommandPyramid', archetypeTag: 'harmonizer', metrics: { synergy: 0.426511, harmony: 0.616225, stability: 0.704179, corruption: 0.023928, loadPressure: 0.351945 } },
  606: { category: 'control', factoryName: 'createControlHierarchyTower', archetypeTag: 'amplifier', metrics: { synergy: 0.434927, harmony: 0.624351, stability: 0.711514, corruption: 0.025292, loadPressure: 0.360313 } },
  607: { category: 'control', factoryName: 'createControlSymmetryCore', archetypeTag: 'amplifier', metrics: { synergy: 0.443343, harmony: 0.632477, stability: 0.718849, corruption: 0.026656, loadPressure: 0.368681 } },
  608: { category: 'control', factoryName: 'createExtremeControl0', archetypeTag: 'amplifier', metrics: { synergy: 0.451759, harmony: 0.640603, stability: 0.726184, corruption: 0.028020, loadPressure: 0.377049 } },
  609: { category: 'control', factoryName: 'createControlEnhanced_DecisionFork', archetypeTag: 'amplifier', metrics: { synergy: 0.460175, harmony: 0.648729, stability: 0.733519, corruption: 0.029384, loadPressure: 0.385417 } },
  610: { category: 'control', factoryName: 'createControlEnhanced_AuthorityHelix', archetypeTag: 'risky', metrics: { synergy: 0.468591, harmony: 0.656855, stability: 0.740854, corruption: 0.030748, loadPressure: 0.393785 } },
  611: { category: 'control', factoryName: 'createControlEnhanced_CommandMatrix', archetypeTag: 'pressure', metrics: { synergy: 0.477007, harmony: 0.664981, stability: 0.748189, corruption: 0.032112, loadPressure: 0.402153 } },
  612: { category: 'control', factoryName: 'createPhrixFlowArbiter', archetypeTag: 'harmonizer', metrics: { synergy: 0.485423, harmony: 0.673107, stability: 0.755524, corruption: 0.033476, loadPressure: 0.410521 } },
  613: { category: 'control', factoryName: 'createCrucisSuppressionGovernor', archetypeTag: 'pressure', metrics: { synergy: 0.493839, harmony: 0.681233, stability: 0.762859, corruption: 0.034840, loadPressure: 0.418889 } },
  614: { category: 'control', factoryName: 'createVertexTemporalGate', archetypeTag: 'stabilizer', metrics: { synergy: 0.502255, harmony: 0.689359, stability: 0.770194, corruption: 0.036204, loadPressure: 0.427257 } },
  615: { category: 'control', factoryName: 'createControlNode3', archetypeTag: 'stabilizer', metrics: { synergy: 0.510671, harmony: 0.697485, stability: 0.777529, corruption: 0.037568, loadPressure: 0.435625 } },
  616: { category: 'control', factoryName: 'createControlNodeStyled_v2', archetypeTag: 'stabilizer', metrics: { synergy: 0.519087, harmony: 0.705611, stability: 0.784864, corruption: 0.038932, loadPressure: 0.443993 } },
  618: { category: 'control', factoryName: 'createControlNodeStyled_v2_Legacy', archetypeTag: 'harmonizer', metrics: { synergy: 0.527503, harmony: 0.713737, stability: 0.792199, corruption: 0.040296, loadPressure: 0.452361 } },
  619: { category: 'control', factoryName: 'createControlSpecialGovernor', archetypeTag: 'stabilizer', metrics: { synergy: 0.535919, harmony: 0.721863, stability: 0.799534, corruption: 0.041660, loadPressure: 0.460729 } },
  620: { category: 'control', factoryName: 'createControlSpineVariant', archetypeTag: 'pressure', metrics: { synergy: 0.544335, harmony: 0.729989, stability: 0.806869, corruption: 0.043024, loadPressure: 0.469097 } },
  621: { category: 'control', factoryName: 'createExtremeControl1', archetypeTag: 'amplifier', metrics: { synergy: 0.552751, harmony: 0.738115, stability: 0.814204, corruption: 0.044388, loadPressure: 0.477465 } },
  // Quantum (7xx) — "Where Possibility Becomes Reality"
  // Fingerprint: synergy moderate-high, harmony LOW, stability LOW, corruption HIGH — glass cannon
  701: { category: 'quantum', factoryName: 'createQuantumBloomNode', archetypeTag: 'amplifier', metrics: { synergy: 0.583742, harmony: 0.194721, stability: 0.142836, corruption: 0.284731, loadPressure: 0.518473 } },
  702: { category: 'quantum', factoryName: 'createQuantumLattice', archetypeTag: 'risky', metrics: { synergy: 0.618471, harmony: 0.228394, stability: 0.168257, corruption: 0.321584, loadPressure: 0.551826 } },
  703: { category: 'quantum', factoryName: 'createQuantumLotus', archetypeTag: 'pressure', metrics: { synergy: 0.653200, harmony: 0.262067, stability: 0.193678, corruption: 0.358437, loadPressure: 0.585179 } },
  705: { category: 'quantum', factoryName: 'createQuantumNodeStyled_v2', archetypeTag: 'harmonizer', metrics: { synergy: 0.687929, harmony: 0.295740, stability: 0.219099, corruption: 0.395290, loadPressure: 0.618532 } },
  // Sigma (8xx) — "Where Anomaly Becomes Law"
  // Fingerprint: stability > harmony > synergy — balanced excellence, orderly
  804: { category: 'sigma', factoryName: 'createSigmaLatticeConductor', archetypeTag: 'harmonizer', metrics: { synergy: 0.524731, harmony: 0.583612, stability: 0.642847, corruption: 0.031842, loadPressure: 0.347291 } },
  805: { category: 'sigma', factoryName: 'createSigmaNode2', archetypeTag: 'risky', metrics: { synergy: 0.558174, harmony: 0.614738, stability: 0.671923, corruption: 0.042517, loadPressure: 0.381634 } },
  806: { category: 'sigma', factoryName: 'createSigmaNodeStyled_v2', archetypeTag: 'pressure', metrics: { synergy: 0.591617, harmony: 0.645864, stability: 0.700999, corruption: 0.053192, loadPressure: 0.415977 } },
  807: { category: 'sigma', factoryName: 'createSigmaBloomCrown', archetypeTag: 'amplifier', metrics: { synergy: 0.625060, harmony: 0.676990, stability: 0.730075, corruption: 0.063867, loadPressure: 0.450320 } },
  // Mythic (9xx) — "Where Pattern Becomes Meaning"
  // Fingerprint: harmony > synergy > stability — meaningful, shifting, carries darkness
  901: { category: 'mythic', factoryName: 'createMythicShardClusterNode', archetypeTag: 'pressure', metrics: { synergy: 0.523847, harmony: 0.618432, stability: 0.482163, corruption: 0.067124, loadPressure: 0.384721 } },
  902: { category: 'mythic', factoryName: 'createMythicBrokenMonolithNode', archetypeTag: 'amplifier', metrics: { synergy: 0.543191, harmony: 0.637816, stability: 0.498527, corruption: 0.073258, loadPressure: 0.398154 } },
  903: { category: 'mythic', factoryName: 'createMythicFloatingFragmentsNode', archetypeTag: 'harmonizer', metrics: { synergy: 0.562535, harmony: 0.657201, stability: 0.514891, corruption: 0.079392, loadPressure: 0.411587 } },
  904: { category: 'mythic', factoryName: 'createMythicCrackedPrismNode', archetypeTag: 'harmonizer', metrics: { synergy: 0.581879, harmony: 0.676585, stability: 0.531255, corruption: 0.085527, loadPressure: 0.425020 } },
  905: { category: 'mythic', factoryName: 'createMythicAncientCoreWithMissingNode', archetypeTag: 'stabilizer', metrics: { synergy: 0.601223, harmony: 0.695970, stability: 0.547619, corruption: 0.091661, loadPressure: 0.438453 } },
  906: { category: 'mythic', factoryName: 'createMythicCollapsedCrownNode', archetypeTag: 'pressure', metrics: { synergy: 0.620567, harmony: 0.715354, stability: 0.563983, corruption: 0.097795, loadPressure: 0.451886 } },
  908: { category: 'mythic', factoryName: 'createMythicNodeStyled_v2', archetypeTag: 'amplifier', metrics: { synergy: 0.639911, harmony: 0.734739, stability: 0.580347, corruption: 0.103929, loadPressure: 0.465319 } },
  // Prime (10xx) — "Where Origin Becomes Transcendence"
  // Fingerprint: stability > harmony > synergy — pure, transcendent, isolated. Lonely perfection.
  1001: { category: 'prime', factoryName: 'createPrimeNestedIcosahedronNode', archetypeTag: 'pressure', metrics: { synergy: 0.483721, harmony: 0.641583, stability: 0.738214, corruption: 0.014728, loadPressure: 0.392847 } },
  1002: { category: 'prime', factoryName: 'createPrimePerfectDodecahedronNode', archetypeTag: 'stabilizer', metrics: { synergy: 0.501683, harmony: 0.657421, stability: 0.751836, corruption: 0.017394, loadPressure: 0.408631 } },
  1003: { category: 'prime', factoryName: 'createPrimeStellaOctangulaNode', archetypeTag: 'harmonizer', metrics: { synergy: 0.519645, harmony: 0.673259, stability: 0.765458, corruption: 0.020061, loadPressure: 0.424415 } },
  1004: { category: 'prime', factoryName: 'createPrimePrecisionLatticeNode', archetypeTag: 'harmonizer', metrics: { synergy: 0.537607, harmony: 0.689097, stability: 0.779080, corruption: 0.022727, loadPressure: 0.440199 } },
  1005: { category: 'prime', factoryName: 'createPrimeTesseractProjectionNode', archetypeTag: 'harmonizer', metrics: { synergy: 0.555569, harmony: 0.704935, stability: 0.792702, corruption: 0.025394, loadPressure: 0.455983 } },
  1006: { category: 'prime', factoryName: 'createPrimeSymmetryLockedCoreNode', archetypeTag: 'pressure', metrics: { synergy: 0.573531, harmony: 0.720773, stability: 0.806324, corruption: 0.028060, loadPressure: 0.471767 } },
  1008: { category: 'prime', factoryName: 'createPrimeNodeStyled_v2', archetypeTag: 'stabilizer', metrics: { synergy: 0.591493, harmony: 0.736611, stability: 0.819946, corruption: 0.030727, loadPressure: 0.487551 } },
  // Error (11xx) — Broken, Corrupted
  // Fingerprint: corruption >> stability > synergy ≈ harmony — dangerous failure
  1101: { category: 'error', factoryName: 'createErrorIntersectingSolidsNode', archetypeTag: 'pressure', metrics: { synergy: 0.062847, harmony: 0.054721, stability: 0.148263, corruption: 0.723841, loadPressure: 0.514728 } },
  1102: { category: 'error', factoryName: 'createErrorInvertedNormalsNode', archetypeTag: 'risky', metrics: { synergy: 0.082174, harmony: 0.073283, stability: 0.167391, corruption: 0.738217, loadPressure: 0.538461 } },
  1103: { category: 'error', factoryName: 'createErrorSelfClippingNode', archetypeTag: 'risky', metrics: { synergy: 0.101502, harmony: 0.091845, stability: 0.186519, corruption: 0.752593, loadPressure: 0.562194 } },
  1104: { category: 'error', factoryName: 'createErrorFoldedImpossibleNode', archetypeTag: 'pressure', metrics: { synergy: 0.120829, harmony: 0.110407, stability: 0.205647, corruption: 0.766969, loadPressure: 0.585927 } },
  1105: { category: 'error', factoryName: 'createErrorTopologyTearNode', archetypeTag: 'harmonizer', metrics: { synergy: 0.140157, harmony: 0.128969, stability: 0.224775, corruption: 0.781345, loadPressure: 0.609660 } },
  1106: { category: 'error', factoryName: 'createErrorCorruptedManifoldNode', archetypeTag: 'stabilizer', metrics: { synergy: 0.159484, harmony: 0.147531, stability: 0.243903, corruption: 0.795721, loadPressure: 0.633393 } },
  1108: { category: 'error', factoryName: 'createErrorNodeStyled_v2', archetypeTag: 'amplifier', metrics: { synergy: 0.178812, harmony: 0.166093, stability: 0.263031, corruption: 0.810097, loadPressure: 0.657126 } },
  // Emotional (12xx) — Feeling, Intuition
  // Fingerprint: synergy > harmony > stability — empathetic, volatile
  1201: { category: 'emotional', factoryName: 'createEmotionalHeartCrystal', archetypeTag: 'stabilizer', metrics: { synergy: 0.523847, harmony: 0.342163, stability: 0.298471, corruption: 0.094728, loadPressure: 0.362847 } },
  1202: { category: 'emotional', factoryName: 'createEmotionalNeuralLobe', archetypeTag: 'pressure', metrics: { synergy: 0.548263, harmony: 0.364721, stability: 0.318394, corruption: 0.105382, loadPressure: 0.384721 } },
  1203: { category: 'emotional', factoryName: 'createEmotionalBloomingGem', archetypeTag: 'risky', metrics: { synergy: 0.572679, harmony: 0.387279, stability: 0.338317, corruption: 0.116036, loadPressure: 0.406595 } },
  1204: { category: 'emotional', factoryName: 'createEmotionalTearShaped', archetypeTag: 'pressure', metrics: { synergy: 0.597095, harmony: 0.409837, stability: 0.358240, corruption: 0.126690, loadPressure: 0.428469 } },
  1205: { category: 'emotional', factoryName: 'createEmotionalFolded', archetypeTag: 'harmonizer', metrics: { synergy: 0.621511, harmony: 0.432395, stability: 0.378163, corruption: 0.137344, loadPressure: 0.450343 } },
  1206: { category: 'emotional', factoryName: 'createEmotionalSymmetricSeed', archetypeTag: 'amplifier', metrics: { synergy: 0.645927, harmony: 0.454953, stability: 0.398086, corruption: 0.147998, loadPressure: 0.472217 } },
  1207: { category: 'emotional', factoryName: 'createEmotionalNodeStyled_v2', archetypeTag: 'amplifier', metrics: { synergy: 0.670343, harmony: 0.477511, stability: 0.418009, corruption: 0.158652, loadPressure: 0.494091 } },
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
