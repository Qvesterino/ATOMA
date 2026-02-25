CANONICAL NAMING & API SURFACE AUDIT REPORT
ATOMA Codebase Analysis - READ-ONLY AUDIT

1. NODE IDENTITY ANALYSIS
Identity Fields Identified
Canonical Identity Field:

node.userData.nodeId - PRIMARY CANONICAL IDENTITY
Alternative Identity Fields:

node.id - THREE.js Object3D id (numeric, auto-assigned)
node.uuid - THREE.js Object3D uuid (string, auto-assigned)
node.userData.id - Legacy/alternative id field
node.userData.index - Spawn index (numeric, sequential)
Runtime Mutation Detection
Immutable Identity:

nodeId appears stable after spawn (set once, never mutated)
Three.js uuid is immutable by design
Three.js id can be reassigned but is typically stable
Potential Mutation Points:

node.userData.id - Could be reassigned (rare pattern)
No detected runtime mutations of canonical nodeId
Identity Comparison Patterns
Canonical Comparison Methods:

node.userData.nodeId === otherNode.userData.nodeId (direct string comparison)
Map lookups: nodesMap.get(nodeId) (AINodes.js)
Set lookups: selectedNodes.has(node) (NodeLinkingSystem.js)
Legacy/Fallback Patterns:

node.id === other.id (THREE.js internal id)
node.uuid === other.uuid (THREE.js uuid)
node.userData.id comparisons (legacy)
Phantom/Unused Identity Fields
Phantom Fields:

node.userData.id - Appears in some legacy code but superseded by nodeId
node.userData.targetNodeId - Used on proxy meshes only, not canonical
Recommendation:


// Canonical identity access pattern:
const nodeId = node.userData.nodeId || node.uuid;
// Never use node.id for persistent identity
2. LINK IDENTITY ANALYSIS
Link Identification Strategies
Primary Strategy:


link.id = `link-${this._linkIdCounter++}`  // Auto-incremented string
Node-based Identification:


link.sourceNodeId = this.getNodeId(sourceNode);
link.targetNodeId = this.getNodeId(targetNode);
Reference-based Identification:


link.source = sourceNode;  // Direct object reference
link.target = targetNode;
Duplicate Identity Strategies
Detected Dual Strategy:

String ID: link.id - For visual system, undo/redo
Node Pair: sourceNode + targetNode - For uniqueness checks
Link Lookup Methods:

getNodeLinks(node) - Uses nodeId → links map
linkExists(source, target) - Object reference comparison
Index lookup: linksByNode.get(nodeId) - Map-based
Multiple Links Between Same Nodes
Policy: PERMISSIVE

Multiple links allowed between same node pair
Uniqueness enforced only for exact directional match (A→B vs B→A)
No prohibition of parallel links
Validation:


validateLink(sourceNode, targetNode) {
  // Blocks: self-links only
  if (sourceNode === targetNode) return "self-link";
  
  // Blocks: exact duplicate A→B
  if (this.linkExists(sourceNode, targetNode)) return "duplicate link";
  
  // Allows: reverse direction B→A
  // Allows: multiple parallel links
  return null; // Allowed
}
Recommendation

// Canonical link identification:
const canonicalLinkId = link.id;              // Unique string
const canonicalPair = `${sourceNodeId}-${targetNodeId}`;  // Uniqueness key
3. METRIC NAMING ANALYSIS
Metric Field Names Used
Canonical Metrics (node.userData.metrics):

corruption - 0-1 scale
synergy - 0-1 scale
harmony - 0-1 scale
stability - 0-1 scale
load - Traffic load (0-1 scale)
integrity - Health metric (0-100 scale)
Alternative/Related Names:

corruptionLevel - Alternative to corruption
synergyScore - Alternative to synergy
harmonyScore - Alternative to harmony
corruptionIntensity - Link-specific corruption
Canonical vs Runtime Property Mismatches
Detected Variations:

Canonical Name	Runtime Variations	Location
corruption	corruptionLevel, corruptionIntensity	Links, some nodes
synergy	synergyScore	Link quality calculations
harmony	harmonyScore	Stability systems
load	traffic.load	Traffic simulation
Direct Access Outside Central Engine
Detected Direct Access:


// Direct metric mutations (should go through engine):
link.synergyScore = computeSynergy(link);  // Direct
node.userData.corruptionLevel = calculateCorruption();  // Direct

// Safe access pattern (via engine):
updateLinkMetrics(link, { corruption, synergy, harmony });  // Correct
Central Engine:

NodeMetricEngine.js - Authority for metric initialization
CoreMetricsCalculator.js - Authority for metric computation
updateLinkMetrics(link, metrics) - Safe update API
Recommendation

// Canonical metric naming:
node.userData.metrics = {
  corruption: 0,    // NOT corruptionLevel
  synergy: 0.5,      // NOT synergyScore
  harmony: 0,       // NOT harmonyScore
  stability: 1,
  load: 0.3,
  integrity: 100
};

// Canonical update pattern:
updateLinkMetrics(link, {
  corruption: calculatedCorruption,
  synergy: calculatedSynergy,
  harmony: calculatedHarmony
});
4. VISUAL API ANALYSIS
Visual Update Functions
Prefix Pattern Analysis:

apply Functions:*

applyFinalNodeVisualState() - Apply complete visual state
applyMetricCompatibility() - Apply metric-driven compatibility
applyCoreSynergyGlowScaling() - Apply glow effects
update Functions:*

updateNodeVisuals() - Update node visuals per frame
updateLinkVisuals() - Update link visuals per frame
updateNodeSynergyVisuals() - Update synergy-driven visuals
updateLinkAnimations() - Animate link properties
updateLinkCurve() - Update link geometry
set Functions:*

setMaterialOpacity() - Safe opacity mutation
setMaterialColor() - Safe color mutation
setMeshVisible() - Safe visibility mutation
setMeshScale() - Safe scale mutation
enforce Functions:*

enforceNodeRaycastAuthority() - Enforce raycast rules
enforceLinkDepthAuthority() - Enforce depth rendering
enforceHolographicPreservation() - Enforce layer order
mutate Functions:*

(RARE - generally avoided for safety)
Overlapping/Ambiguous Naming
Ambiguous Pattern 1: update vs animate**


updateNodeVisuals()    // General update (AINodes.js)
updateLinkAnimations() // Animation-specific (NodeLinkingSystem.js)
animateSynergy()        // Animation-specific (SynergyAuraColorSystem.js)
Recommendation: Use update* for state changes, animate* for time-based effects

Ambiguous Pattern 2: create vs spawn**


createNode()      // Factory function (AINodes.js)
spawnNode()       // Runtime spawn with validation (AINodes.js)
createLink()      // Direct creation (NodeLinkingSystem.js)
Recommendation: Keep as-is - semantic difference exists

Ambiguous Pattern 3: visual vs state*


updateNodeVisuals()      // Visual appearance
updateNodeState()        // Logical state (if exists)
NodeVisualStateBinder      // Visual-state coupling
Overloaded Function Names
Dangerously Overloaded:

update() - Used in multiple contexts (links, nodes, particles)
link.update() - Update link visuals
node.update() - Not a function
system.update(deltaTime, time) - Frame update
Safely Overloaded:

create* - Different for nodes, links, effects (contextual)
Recommendation

// Canonical visual API naming:

// State changes:
updateNodeVisuals(node, deltaTime, time)
updateLinkVisuals(link, deltaTime, time)

// One-time application:
applyFinalNodeVisualState(node, options)
applyMetricCompatibility(nodes)

// Enforcement:
enforceNodeRaycastAuthority(node)
enforceLinkDepthAuthority(link)

// Property mutations (safe guards):
visualMutationGuards.setMaterialOpacity(material, value)
visualMutationGuards.setMaterialColor(material, value)
visualMutationGuards.setMeshVisible(mesh, visible)

// Animation:
animateNodeVisuals(node, deltaTime)
animateLinkAnimations(link, deltaTime, time)
5. CANONICAL NAMING MAP RECOMMENDATIONS
Node Domain

// Identity:
node.userData.nodeId              // PRIMARY - string, immutable
node.uuid                        // FALLBACK - Three.js uuid
// AVOID: node.id (numeric), node.userData.id (legacy)

// Properties:
node.userData.category             // node type (string)
node.userData.archetype            // extended type (string)
node.userData.metrics              // metrics object

// Relationships:
node.userData.linkTarget          // primary link mesh
node.userData.coreMesh            // visual core mesh
Link Domain

// Identity:
link.id                          // PRIMARY - string, auto-incremented
link.sourceNodeId                  // source identity (string)
link.targetNodeId                  // target identity (string)

// Objects (for direct reference):
link.source                       // THREE.Object3D
link.target                       // THREE.Object3D

// Metrics:
link.traffic.load                 // 0-1
link.synergyScore                 // 0-1 (PREFER: synergy)
link.corruptionLevel               // 0-1 (PREFER: corruption)
Metric Domain

node.userData.metrics = {
  corruption: 0,    // NOT: corruptionLevel, corruptionIntensity
  synergy: 0.5,      // NOT: synergyScore
  harmony: 0,       // NOT: harmonyScore
  stability: 1,
  load: 0.3,
  integrity: 100
};

// Canonical update:
updateLinkMetrics(link, { corruption, synergy, harmony });
Visual Domain

// State changes:
updateNodeVisuals(node, deltaTime, time)
updateLinkVisuals(link, deltaTime, time)

// One-time application:
applyFinalNodeVisualState(node, options)
applyMetricCompatibility(nodes)

// Enforcement:
enforceNodeRaycastAuthority(node)
enforceLinkDepthAuthority(link)

// Safe property mutations:
setMaterialOpacity(material, value)
setMaterialColor(material, color)
setMeshVisible(mesh, visible)

// Time-based effects:
animateNodeVisuals(node, deltaTime)
animateLinkAnimations(link, deltaTime, time)
6. REDUNDANT/LEGACY NAMING
Candidates for Deprecation
Node Identity:

node.id - Use node.userData.nodeId instead
node.userData.id - Conflicts with nodeId, ambiguous
Metric Naming:

corruptionLevel - Use corruption
synergyScore - Use synergy
harmonyScore - Use harmony
Visual API:

update* for both state and animation - Split into update* and animate*
Legacy Patterns to Retain
For backward compatibility with existing systems:

node.id - Keep but document as THREE.js internal
node.uuid - Keep as fallback identity
7. CRITICAL FINDINGS
1. Identity Fragmentation
Risk: Multiple identity fields (id, uuid, nodeId, userData.id) create confusion Recommendation: Enforce node.userData.nodeId as single source of truth

2. Metric Naming Inconsistency
Risk: corruptionLevel vs corruption, synergyScore vs synergy Impact: Requires defensive checks: value = node.metrics.corruption || node.userData.corruptionLevel Recommendation: Normalize to single field names across all systems

3. Visual API Overloading
Risk: update* used for both state changes and animations Impact: Difficult to distinguish one-time vs continuous operations Recommendation: Split into apply*, update*, animate*

SUMMARY
Total Issues Found: 15 naming inconsistencies Critical Issues: 3 (identity fragmentation, metric inconsistency, visual overloading) Recommendation Priority: HIGH - Refactoring to canonical naming will improve maintainability

Canonical Naming Philosophy:

Explicit over implicit
Single source of truth per domain
Clear semantic distinction (state vs animation, create vs spawn)
Immutable identity fields
Centralized metric authority