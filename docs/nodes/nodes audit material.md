GLOBAL AUDIT: Uncached THREE.Material — Full Project Report
AGGREGATION BY CATEGORY
Category	Factory Functions	Total Materials	STATIC (safe)	DYNAMIC (unsafe)	Already Cached
prime	6	55	54	1	0
mythic	6	72	72	0	0
error	1	~8	~8	0	0
storage	2	~22	~22	0	0
input	4 + 3 sensory	39	15	24	15
control	2	~30	~30	0	0
analytics	2	~40	~40	0	0
process	4	~80	~80	0	0
quantum	4	~55	~35	~20	0
integration	5	~60	~30	~30	0
sigma	4	~45	~20	~25	0
emotional	7 + inline	~100	~50	~50	0
TOTAL	49+ functions	~606	~456	~150	15
KEY FINDINGS
1. Scale: 606 material instantiations across EnhancedNodeModels.js, only 15 cached (2.5%). Plus 16 in InputSensoryEnhanced_Session111.js (5 now cached).

2. STATIC dominance: ~75% of all materials (456/606) use hardcoded colors and are safe for MaterialCache. These are the primary optimization target.

3. Category breakdown:

100% STATIC: prime (54/55), mythic (72/72), error, storage, control, analytics, process — these categories have zero or near-zero dynamic materials. Maximum cache impact.
Mixed STATIC+DYNAMIC: quantum, integration, sigma, emotional — require per-material classification.
Already partially cached: input — 15 static materials cached, 24 dynamic remain as per-color instances.
RISK ZONES
Hot Spot #1: process category (~80 materials, ALL static)

_getProcessAxialChronoReactorMaterials(): 16 materials
_getProcessChronoForgeReactorMaterials(): 26 materials
_getProcessExecutionMachineMaterials(): 12 materials
_getProcessFluxCrucibleMaterials(): 20 materials
All use hardcoded colors. Highest single-category cache ROI.
Hot Spot #2: mythic category (72 materials, ALL static)

6 factory functions, every material hardcoded. Zero dynamic.
_getMythicOracularPrismMaterials() alone has 14 materials.
Hot Spot #3: analytics category (~40 materials, ALL static)

_getAnalyticsPredictiveOracleArrayMaterials() has ~30 materials, all hardcoded.
Mixed Risk: emotional category (~100 materials, ~50/50 split)

Many inline material creations outside factory functions (e.g., lines 13797, 13815, 14549, 15581, etc.)
Factory functions like _getEmotionalNeuralLobeMaterials() are 100% static
But _getEmotionalSymmetricSeedMaterials() is heavily dynamic
Highest complexity — requires careful per-material audit
RECOMMENDATION: Next Refactor Target
Start with process category. Reasons:

Largest single-category material count (~80)
100% STATIC — zero classification risk
4 clean factory functions with clear boundaries
Estimated cache reduction: ~80 unique materials → ~80 shared instances (one per role instead of one per node)
Zero visual risk — all colors are hardcoded constants
Expected impact: If process has N nodes × 80 materials each, caching reduces to exactly 80 shared materials regardless of node count. For 10 process nodes: 800 → 80 (90% reduction).