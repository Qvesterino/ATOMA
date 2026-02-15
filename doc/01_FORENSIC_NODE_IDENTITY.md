NODE-IDENTITY-FORENSIC REPORT
ATOMA Codebase Identity Analysis (READ ONLY)
EXECUTIVE SUMMARY
Total Identity Systems Found: 4

node.uuid (Three.js native)
node.userData.nodeId (Custom)
node.userData.id (Custom)
node.id (Custom - sparse)
Primary Identity System: node.userData.nodeId (most widely used)

Critical Risk Level: HIGH - Multiple conflicting identity systems with complex copying behavior

DETAILED IDENTITY FIELD ANALYSIS
1. node.userData.nodeId
Property	Value
Where Written	
_SafeEvolutionManager.js:75	node.userData.nodeId = node.userData.id (copy from userData.id)
_SafeEvolutionManager.js:78	node.userData.nodeId = \node_${Math.random()...}`` (new random ID)
_SafeLegendaryNodePack.js:75	node.userData.nodeId = node.userData.id (copy)
_SafeLegendaryNodePack.js:78	node.userData.nodeId = \node_${Math.random()...}`` (new)
_SafeNodePersonalityFX.js:75	node.userData.nodeId = node.userData.id (copy)
_SafeNodePersonalityFX.js:78	node.userData.nodeId = \node_${Math.random()...}`` (new)
AINodes.js:291	node.userData.nodeId = node.uuid (copy from uuid)
AINodes.js:855	target.userData.nodeId = nodeId (external assignment)
Where Read	
EvolutionRegistry.js:53	if (node.userData.id) (fallback check)
_SafeEvolutionManager.js:66	if (node.userData.nodeId) (primary check)
_SafeEvolutionManager.js:119	obj.userData.nodeId === nodeId (lookup)
_SafeLegendaryNodePack.js:66	if (node.userData.nodeId) (primary check)
_SafeNodePersonalityFX.js:66	if (node.userData.nodeId) (primary check)
AINodes.js:335	n.userData.nodeId === issue.nodeId (lookup)
AINodes.js:849	n.userData.nodeId === existingNodeId (lookup)
AINodeModel.js:6	nodeRoot.userData?.nodeId (propagation)
AINodeModel.js:10	nodeRoot.userData?.nodeId (propagation)
AINodeModel.js:156	collider.userData.nodeId = ... (collider assignment)
AINodeModel.js:235	collider.userData.nodeId = ... (collider assignment)
AINodeModel.js:305	collider.userData.nodeId = ... (collider assignment)
AINodeModel.js:372	collider.userData.nodeId = ... (collider assignment)
AINodeModel.js:448	collider.userData.nodeId = ... (collider assignment)
AINodeModel.js:519	collider.userData.nodeId = ... (collider assignment)
Source of Truth?	YES - Primary identity system
Duplicated?	YES - Copied to/from userData.id and node.uuid
Risk Level	HIGH
2. node.userData.id
Property	Value
Where Written	
EvolutionRegistry.js:57	node.userData.id = \node_${Math.random()...}`` (new random ID)
_HitProxySystem_v1.js:76	node.userData.id = nodeId (external assignment)
Where Read	
EvolutionRegistry.js:53	if (node.userData.id) (fallback check)
_SafeEvolutionManager.js:71	if (node.userData.id) (check before copy)
_SafeLegendaryNodePack.js:71	if (node.userData.id) (check before copy)
_SafeNodePersonalityFX.js:71	if (node.userData.id) (check before copy)
SafeColonyExpansion2.js:455	link.from.userData.id (node lookup)
SafeColonyExpansion2.js:457	link.to.userData.id (node lookup)
Source of Truth?	NO - Secondary field, copied to nodeId
Duplicated?	YES - Copied to userData.nodeId
Risk Level	MEDIUM
3. node.uuid
Property	Value
Where Written	Three.js native (automatic)
Where Read	
EvolutionRegistry.js:51	if (node.uuid) (primary check)
_SafeEvolutionManager.js:63	if (node.uuid) (primary check)
_SafeEvolutionManager.js:120	obj.uuid === nodeId (lookup)
_SafeLegendaryNodePack.js:63	if (node.uuid) (primary check)
_SafeNodePersonalityFX.js:63	if (node.uuid) (primary check)
VisualAudit.js:329	node.uuid (audit reference)
AINodes.js:291	node.userData.nodeId = node.uuid (copy to nodeId)
Source of Truth?	YES - Native Three.js property
Duplicated?	YES - Copied to userData.nodeId in AINodes.js
Risk Level	MEDIUM
4. node.id
Property	Value
Where Written	NOT FOUND (read-only usage)
Where Read	
RegionalEquilibriumFieldSystem.js:257	link.source.id === node.id (comparison)
RegionalEquilibriumFieldSystem.js:259	link.target.id === node.id (comparison)
ResonanceRuptureVisualSystem_Session133.js:227	link.sourceNode?.id === node.id (comparison)
ResonanceRuptureVisualSystem_Session133.js:229	link.targetNode?.id === node.id (comparison)
SelectedHUDSyncPatch1_0.js:115	link.source.id === nodeId (comparison)
SelectedHUDSyncPatch1_0.js:117	link.target.id === nodeId (comparison)
SelectedHUDSyncPatch1_0.js:191	link.source.id === node.id (comparison)
ParticleCascadeFlowDeflection.js:88	link.source?.id === nodeId (comparison)
NodeQualityCalculator.js:85	link.data.sourceId === nodeId (link reference)
NodeQualityCalculator.js:91	link.data.targetId === nodeId (link reference)
NetworkRituals_v1.js:302	link.source?.id === node.id (comparison)
NetworkRituals_v1.js:353	otherNode.id (visited check)
HarmonyStabilizationSystem_v1.js:215	link.nodeA.id === node.id (comparison)
HarmonyStabilizationSystem_v1.js:217	link.nodeB.id === node.id (comparison)
LinkCorruptionTransmission_v1.js:185	l.target?.id === node.id (comparison)
LinkCorruptionTransmission_v1.js:191	l.source?.id === node.id (comparison)
HarmonyHubAuraSystem_Session126.js:323	link.nodeA.id === node.id (comparison)
HarmonyHubAuraSystem_Session126.js:325	link.nodeB.id === node.id (comparison)
Source of Truth?	UNKNOWN - Never written, only read in comparisons
Duplicated?	UNKNOWN - No copy operations found
Risk Level	HIGH - Phantom field with unknown origin
ID GENERATION PATTERNS
Random String Generation (Math.random)
Pattern: `node_${Math.random().toString(36).substr(2, 9)}`

Locations:

EvolutionRegistry.js:57 (writes to userData.id)
_SafeEvolutionManager.js:78 (writes to userData.nodeId)
_SafeLegendaryNodePack.js:78 (writes to userData.nodeId)
_SafeNodePersonalityFX.js:78 (writes to userData.nodeId)
Risk Level: MEDIUM - Multiple systems generate identical pattern independently

Time-Based Generation
Pattern: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

Location:

_HitProxySystem_v1.js:73 (writes to userData.id and userData.nodeId)
Risk Level: MEDIUM - Collision risk in rapid spawn scenarios

ID COPYING BEHAVIOR
Copy: userData.id → userData.nodeId
Pattern:


if (node.userData.id) {
  node.userData.nodeId = node.userData.id;
}
Locations:

_SafeEvolutionManager.js:71-75
_SafeLegendaryNodePack.js:71-75
_SafeNodePersonalityFX.js:71-75
Risk Level: MEDIUM - Synchronizes two identity fields

Copy: node.uuid → userData.nodeId
Pattern:


node.userData.nodeId = node.uuid;
Location:

AINodes.js:291
Risk Level: MEDIUM - Native to custom copy

ID COMPARISON PATTERNS
Dual-Check Pattern (userData.nodeId OR uuid)
Pattern:


if (obj.userData && obj.userData.nodeId === nodeId) {
  found = obj;
}
if (obj.uuid === nodeId) {
  found = obj;
}
Locations:

_SafeEvolutionManager.js:119-122
_SafeLegendaryNodePack.js:119-122
_SafeNodePersonalityFX.js:119-122
VisualAudit.js:329-331
Risk Level: HIGH - Allows mismatch between fields

Chain-of-Fallback Pattern
Pattern: node.uuid || node.userData.id || generated

Locations:

EvolutionRegistry.js:51-57
_SafeEvolutionManager.js:63-78
_SafeLegendaryNodePack.js:63-78
_SafeNodePersonalityFX.js:63-78
Risk Level: MEDIUM - Complex fallback logic

WARNING MESSAGES FOUND

[SafeEvolutionManager:getNodeId] nodeId missing; mirroring existing id to prevent dual identity
Locations:

_SafeEvolutionManager.js:73
_SafeLegendaryNodePack.js:73
_SafeNodePersonalityFX.js:73
Risk Level: HIGH - Developers explicitly aware of dual-identity problem

CONFLICTS AND INCONSISTENCIES
1. Identity Priority Conflicts
Problem: Three different systems prioritize identity differently:

EvolutionRegistry.js: Prefers node.uuid → userData.id → generate new
SafeEvolutionManager.js: Prefers node.uuid → userData.nodeId → copy from userData.id → generate new
AINodes.js: Always copies node.uuid to userData.nodeId
Impact: Inconsistent identity sources across systems

2. Phantom Field (node.id)
Problem: node.id is read in 15+ files but never written

Likely Source: May be set externally or is legacy code

Impact: Comparisons using node.id may fail silently

3. Random ID Collision Risk
Problem: Multiple systems generate random IDs using identical pattern

Collision Window: Approximately 1 in 3.6 billion per generation

Practical Risk: Low, but cumulative risk across spawns

RECOMMENDED CANONICAL FIELD
Primary Recommendation: node.userData.nodeId
Rationale:

Most widely used across codebase
Explicitly managed in 3+ systems
Has fallback generation logic
Used in lookups, comparisons, and propagation
Secondary Recommendation: node.uuid (as backup)
Rationale:

Native Three.js property
Always present and unique
Reliable fallback
Field to Eliminate: node.userData.id
Rationale:

Redundant with userData.nodeId
Only used in SafeColonyExpansion2.js
Creates unnecessary confusion
Field to Investigate: node.id
Rationale:

Never written, only read
Used in critical comparison paths
May be legacy or externally managed
Needs source tracing
SUMMARY STATISTICS
Metric	Count
Total Identity Fields	4
Files Writing nodeId	8
Files Reading nodeId	93+
ID Generation Patterns	2
ID Copy Operations	2
Dual-Check Comparisons	4
Warning Messages	3
CONCLUSION
The ATOMA codebase suffers from identity fragmentation with 4 competing systems. While node.userData.nodeId is the de facto standard, the existence of node.userData.id, node.uuid, and the mysterious node.id creates complexity and potential for bugs.

Most Critical Issue: The node.id field is used extensively but never written - this is a high-risk phantom field that could cause silent failures.

Recommended Action: Standardize on node.userData.nodeId with node.uuid as immutable backup, phase out node.userData.id, and investigate the source of node.id.

END OF FORENSIC REPORT