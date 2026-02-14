SPATIAL-AUTHORITY-MAP — ATOMA Codebase Audit
Summary Statistics
Number of spatial authorities found: 15 distinct systems
Conflicting distance values detected: 4 conflicts
Largest world scale assumption: 300 units (FractalValley floor)
Smallest world scale assumption: 8 units (nodes.minDistance)
Systems likely to break if world size changes: 8 systems
TABLE: SPATIAL PARAMETERS BY SYSTEM
System / File	Parameter / Variable	Purpose	Value	Configurable?	Global Authority?
config.js	camera.near	Camera visibility	0.5	yes	YES (main camera)
config.js	camera.far	Camera visibility	1000	yes	YES (main camera)
config.js	fog.near	Visibility culling	30	yes	YES (global fog)
config.js	fog.far	Visibility culling	80	yes	YES (global fog)
config.js	chamber.radius	World boundary	40	yes	unknown (per-mode)
config.js	chamber.height	World boundary	30	yes	unknown (per-mode)
config.js	nodes.minDistance	Spawn limit	8	yes	unknown
config.js	nodes.maxDistance	Spawn limit	25	yes	unknown
config.js	nodes.minHeight	Spawn limit	3	yes	unknown
config.js	nodes.maxHeight	Spawn limit	12	yes	unknown
AuraLODCulling.js	distanceThreshold	LOD	30	yes	unknown
AuraLODCulling.js	hysteresis	LOD stability	3	yes	unknown
AuraLODCulling.js	updateInterval	LOD update rate	100ms	yes	unknown
DreamDesert.js	desertSize	World boundary	200	no	unknown (map-specific)
DreamDesert.js	dune distance	Spawn limit	20-60	no	unknown (map-specific)
DreamDesert.js	crystal distance	Spawn limit	10-60	no	unknown (map-specific)
DreamDesert.js	fragment distance	Spawn limit	15-60	no	unknown (map-specific)
DreamDesert.js	particle reset radius	World boundary	90	no	unknown (map-specific)
FractalValley.js	floorSize	World boundary	300	no	unknown (map-specific)
FractalValley.js	hex distance	Spawn limit	20-80	no	unknown (map-specific)
FractalValley.js	mountain range offset	World boundary	±80	no	unknown (map-specific)
FractalValley.js	fragment distance	Spawn limit	30-90	no	unknown (map-specific)
main.js	camera.near (re-assert)	Camera visibility	0.5	no (hardcoded)	YES
main.js	camera.far (re-assert)	Camera visibility	1000	no (hardcoded)	YES
DETECTED RISKS
HIGH RISK: Multiple Interaction Distances
Issue: Three different distance regimes for spawning

config.js: nodes.minDistance=8, nodes.maxDistance=25
DreamDesert.js: spawn radius 20-60
FractalValley.js: spawn radius 20-90
Impact: Nodes spawned in different maps will have inconsistent density and coverage.

HIGH RISK: Multiple World Size Assumptions
Issue: Maps use different world scale parameters

config.js chamber.radius: 40
DreamDesert.js desertSize: 200
FractalValley.js floorSize: 300
Impact: Camera fog (near=30, far=80) will cut off visibility in larger maps prematurely.

HIGH RISK: Hardcoded Magic Numbers
Issue: Map-specific distances are hardcoded without configuration


// DreamDesert.js (line ~42)
const desertSize = 200;

// FractalValley.js (line ~41)  
const floorSize = 300;
Impact: No centralized way to adjust world scale across all maps.

MEDIUM RISK: Fog vs LOD Threshold Mismatch
Issue: Fog far (80) == Aura LOD threshold (30)

Fog: near=30, far=80
Aura LOD: threshold=30
Impact: Auras disappear at the same distance where fog starts, creating visual discontinuity.

MEDIUM RISK: Camera Far Clip (1000) vs World Sizes
Issue: Camera far clip (1000) is much larger than any map

Largest map: 300 (FractalValley)
Camera far: 1000
Impact: Wasted rendering capacity for distant empty space.

SYSTEMS LIKELY TO BREAK IF WORLD SIZE CHANGES
System	Dependency	Why It Breaks
AuraLODCulling	distanceThreshold=30	Fixed LOD threshold assumes 30-unit scale; larger maps need larger threshold
config.js fog	near=30, far=80	Fog assumes ~80-unit world; larger worlds will be fogged too early
DreamDesert.js	desertSize=200	Hardcoded terrain size doesn't scale with config
FractalValley.js	floorSize=300	Hardcoded terrain size doesn't scale with config
NodeLinkingSystem	maxLinkDistance: 50	(implied) Links limited by hardcoded max distance
Particles (all maps)	Reset bounds 90	Particles reset at fixed radius regardless of map size
Camera controller	Far clip 1000	While generous, doesn't adapt to actual world bounds
Spawn systems	min/maxDistance: 8-25	Fixed spawn distances don't scale with map size
RECOMMENDATIONS
Create WorldConfig authority - Centralize world scale parameters (radius, bounds) per map type
Derive LOD from world size - Aura LOD threshold should be percentage of world radius, not fixed 30
Scale fog to world - Fog near/far should be proportional to chamber.radius or map-specific bounds
Make map sizes configurable - Extract hardcoded values (200, 300) to MapConfigBase.js
Unify distance units - Standardize on "chamber units" with conversion factors for different map types
FINDINGS SUMMARY
Metric	Value
Total spatial authorities	15
Conflicting distance values	4
Configurable parameters	8
Hardcoded magic numbers	9
Systems with global authority	3 (camera, fog, chamber)
Map-specific authorities	12
READ ONLY AUDIT COMPLETE — No code modifications made.