NODE CREATION PIPELINE AUDIT - READ ONLY
SUMMARY
Total Creation Pipelines Identified: 7

AINodes.createNode() - Primary canonical creation
AINodes.spawnNode() - Runtime spawn wrapper
EnhancedNodeModels.create() - Visual factory
NodeEditor.createNode() - Debug markers (blocked)
AINodes.createNodes() - Batch creation
Specialized spawn methods (spawnMythicNode, spawnPrimeNode, etc.)
Direct THREE.Group construction - Visual layer containers
DETAILED CREATION PATH TABLE
Function Name	File	Called From	Node Type	Fields Initialized	Registers Global?	Generates Identity?	Attaches to Scene?	Differs From Others
AINodes.createNode()	AINodes.js	createNodes(), spawnNode(), specialized spawns	Category-based (input, process, etc.)	id (nodeId), userData, category, archetype, isSpecial, position, index, variant, visualOwner, enhancedNodeModelBinding, overlays, spawnCycle	YES (nodesMap, nodes array)	YES (nodeId from uuid or userData)	NO (via _finalizeSpawnedNode)	Core creation logic - no scene attachment here
AINodes.spawnNode()	AINodes.js	updateSpawning(), onLinkCreated(), checkNetworkDensityAndSpawn(), external calls	Category-based + EXTREME (15% chance)	All createNode fields +: spawnContext, isFallback, fallbackReason, uniqueArchetypeKey, namingCode, namingMeaning, isExtreme, extremeArchetype, extremeTier	YES (nodesMap, nodes array, nodeRegistry, uniqueSpawnRegistry)	YES (nodeId)	YES (via _finalizeSpawnedNode)	Wraps createNode + validation + registration + finalization
EnhancedNodeModels.create()	EnhancedNodeModels.js	AINodes.createNode()	Visual mesh groups by category	archetype, category, visualVariant	NO	NO	NO	Returns THREE.Group with visual hierarchy only
AINodes.createNodes()	AINodes.js	Initialization (environment setup)	Category-based (random from pool)	Calls createNode indirectly	YES (via createNode → spawnNode)	YES (via createNode)	YES (via createNode)	Batch wrapper around createNode
NodeEditor.createNode()	NodeEditor.js	External (legacy)	Debug markers (THREE.LineSegments)	id, position, label, isDebugMarker, nonInteractive	NO	YES (generated id)	YES	Blocked by NODE_EDITOR_DEBUG_MARKERS_ENABLED flag
AINodes.spawnMythicNode()	AINodes.js	External API	Mythic category archetype	All spawnNode fields	YES	YES	YES	Specialized wrapper - calls spawnNode('mythic', position, 'MYTHIC-CEREMONIAL')
AINodes.spawnPrimeNode()	AINodes.js	External API	Prime category archetype	All spawnNode fields	YES	YES	YES	Specialized wrapper - calls spawnNode('prime', position, 'PRIME-PERFECT')
AINodes.spawnErrorNode()	AINodes.js	External API	Error category archetype	All spawnNode fields	YES	YES	YES	Specialized wrapper - calls spawnNode('error', position, 'ERROR-ANOMALY')
AINodes.spawnExtremeNode()	AINodes.js	External API	EXTREME archetype	All spawnNode fields + extremeArchetype	YES	YES	YES	Specialized wrapper - picks random EXTREME archetype
AINodes.spawnArchetype()	AINodes.js	External API	Named archetype	All spawnNode fields	YES	YES	YES	Specialized wrapper - spawns by archetype name
ADDITIONAL VISUAL CREATION (NOT NODES)
Function	File	Creates	Purpose	Registers?	Attaches?
new THREE.Group()	Multiple files (100+)	Visual containers	VFX, auras, glyphs, link visuals	NO	YES (by caller)
SigmaNode.constructor()	SigmaNode.js	Specialized node mesh	Sigma node visualization	NO	YES
QuantumNode.constructor()	QuantumNode.js	Specialized node mesh	Quantum node visualization	NO	YES
ANALYSIS FINDINGS
1. MOST USED CREATION PATH
AINodes.spawnNode() - This is the primary entry point for runtime spawning, used by:

Time-based spawning
Event-based spawning (link creation)
Network density monitoring
External API calls
All specialized spawn methods (spawnMythicNode, spawnPrimeNode, etc.)
2. CREATION FLOW HIERARCHY

External/API Calls
    ↓
spawnNode() / specialized spawns
    ↓
validateCategory() + spawnAuthorityComplianceGate
    ↓
createNode() (core geometry creation)
    ↓
EnhancedNodeModels.create() (visual factory)
    ↓
_finalizeSpawnedNode() (registration + scene attachment)
3. INCONSISTENT INITIALIZATION RISKS
Risk	Location	Details
Identity generation scattered	createNode(), spawnNode(), NodeEditor	Multiple places set nodeId - potential conflicts
Scene attachment timing	createNode() doesn't attach, _finalizeSpawnedNode() does	Two-step process容易遗漏
Category validation duplicated	validateCategory(), EnhancedNodeModels.create()	Separate validation in visual layer
Fallback handling	Multiple paths to 'input' fallback	Fallback logic in createNode() and spawnNode()
Registry proliferation	nodesMap, nodeRegistry, uniqueSpawnRegistry	Three separate registries for node tracking
4. FIELDS INITIALIZED COMPARISON
Core createNode() initializes:

nodeId, userData, category, requestedCategory, categoryValidation
index, isActive, activationLevel, targetActivation
particles, light, baseColor, basePosition, variant, pulseOffset
isSpecial, vfxGlow, vfxHalo, vfxHolo, vfxRings
layerColors, ultraMode, namingCode, namingMeaning
spawnCycle, visualOwner, enhancedNodeModelBinding, overlays
spawnNode() adds:

spawnContext, isFallback, fallbackReason
uniqueArchetypeKey, isExtreme, extremeArchetype, extremeTier
archetypeKey, archetype
linkTarget, coreMesh, interactionCollider
metrics (via initNodeMetrics)
NodeEditor.createNode() (when enabled):

id, position, label, isDebugMarker, nonInteractive
Minimal - only for debug visualization
5. CANDIDATE FOR CANONICAL CREATION PATH (ANALYSIS)
Current de facto canonical: AINodes.spawnNode()

Strengths:

Central validation (category whitelist, EnhancedNodeModel compatibility)
Duplicate prevention (unique spawn registry)
Proper identity generation (nodeId)
Complete initialization (all required fields)
Scene attachment via _finalizeSpawnedNode()
Integration with post-spawn observers
Compliance with spawn authority gates
Weaknesses:

Complex multi-step process (createNode → spawnNode → _finalizeSpawnedNode)
Fallback logic scattered across functions
Multiple registries to maintain
Category validation duplicated with visual layer
Recommended canonical path: A unified spawnNode() that consolidates:

Category validation (single source)
Visual creation (EnhancedNodeModels)
Identity generation (nodeId)
Metadata initialization (complete userData)
Registration (single registry)
Scene attachment
6. MULTIPLE CREATION FUNCTIONS DOING SIMILAR WORK
Overlap	Functions	Similar Work
Category validation	validateCategory(), EnhancedNodeModels.ensureRegistryReady(), spawnAuthorityComplianceGate.validateSpawnRequest()	Checking if category is valid
Identity generation	_ensureCanonicalNodeId(), createNode (line ~740), spawnNode (line ~1700)	Setting nodeId
Visual creation	createNode (direct), EnhancedNodeModels.create(), AINodeModel.create*()	Creating node geometry
Fallback to 'input'	createNode (line ~660), spawnNode (line ~1400, ~1500)	Default category handling
Scene attachment	_finalizeSpawnedNode(), individual scene.add() calls	Adding to scene
7. MISSING INITIALIZATION FIELDS IN SOME PATHS
Path	Missing Fields	Impact
createNode()	uniqueArchetypeKey, spawnContext, namingCode, namingMeaning, isExtreme, extremeArchetype	Partial initialization
NodeEditor.createNode()	category, archetype, metrics, visualOwner, enhancedNodeModelBinding	Debug-only, not functional nodes
EnhancedNodeModels.create()	nodeId, userData.category, userData.archetype	Visual factory only
CONCLUSION
Number of creation pipelines: 7 (excluding visual-only THREE.Group construction)

Most used: AINodes.spawnNode() - Runtime spawn entry point

Primary inconsistency risk: Scattered validation and initialization across multiple layers (createNode, spawnNode, EnhancedNodeModels, validation gates)

Canonical candidate: AINodes.spawnNode() already functions as the de facto canonical path, but would benefit from consolidation of validation logic and registry management.

Recommendation: Consolidate duplicate validation logic into a single pre-spawn validation step, and consider merging the three registries (nodesMap, nodeRegistry, uniqueSpawnRegistry) into a unified node registration system.