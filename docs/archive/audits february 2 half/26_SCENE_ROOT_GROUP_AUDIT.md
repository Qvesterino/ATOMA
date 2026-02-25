ATOMA SCENE ROOT GROUP STRUCTURE AUDIT
READ-ONLY ANALYSIS COMPLETE
1. SCENE ADD/REMOVE SUMMARY
scene.add() Pattern Analysis (300+ occurrences)
NODES (Primary Entities)

Creators: AINodes.js, EnhancedNodeModels.js, NodeSpawnLogger, RareNodeSpawner
Objects: Node meshes, core geometry, collider meshes, halo rings
Lifecycle: Created via AINodes.createNode(), removed on world switch
LINKS (Connections)

Creators: NodeLinkingSystem.js, NeonLinkVisuals.js, LinkAuraSystem.js, LinkRendererConduit.js
Objects: Link groups, conduit meshes, glow meshes, trail lines, bead systems
Lifecycle: Created on link formation, removed on link deletion or world switch
VFX (Visual Effects)

Creators: SafeLegendaryNodePack.js, SafeWorldFXPack.js, SafeAIWeatherPack.js, SafeEvolutionManager.js, SynergyVFXEngine1_0.js, CascadeParticleSystem_Session120.js
Objects: Particle systems, glow spheres, rifts, auroras, shockwaves, emission bursts
Lifecycle: Created for events, auto-expire or manual cleanup
UI (Interface)

Creators: UISelectedNodeHighlight3_2.js, UISelectedNodeLabel3_3.js, UIPrimaryNodeAura3_7.js, NodeInspectOverlay3_0.js
Objects: Selection rings, labels, highlight glows, overlay sprites
Lifecycle: Created on interaction, removed on deselection or world switch
DEBUG (Diagnostics)

Creators: NodeHierarchyVisuals_v1.js, NodeHierarchyVisualFeedback_v1.js, NodeEditor.js
Objects: Hierarchy lines, debug markers, visual feedback particles, edit helpers
Lifecycle: Created for debugging, manual or auto cleanup
WORLD (Environment)

Creators: World.js, SigmaRiftChamber.js, DreamDesert.js, QuantumIsland.js, FractalValley.js
Objects: Floor planes, rings, platforms, decorations, particles
Lifecycle: Static environment, removed on world switch only
scene.remove() Pattern Analysis (231 occurrences)
Node Removal:

AINodes.js: Traverses scene, removes nodes by userData.nodeId
NodeLinkingInvariantGuard.js: Re-attaches detached nodes
Link Removal:

NodeLinkingSystem.js: Removes link.group on unlink
NeonLinkVisuals.js: Removes visual components
VFX Removal:

Auto-expire: Many VFX systems check progress >= 1.0 and remove
Manual cleanup: dispose() methods with scene.remove() calls
UI Removal:

UISelectedNodeHighlight3_2.js, UISelectedNodeLabel3_3.js: Remove on deselection
World Switch:

main.js.switchMode(): Full scene traversal, removes all nodes, proxies, links
2. OBJECT OWNERSHIP PATTERNS
Object Type	Creator System	Remover System	Cleanup Strategy
Nodes	AINodes.createNode()	AINodes.world switch	Scene traversal by nodeId
Links	NodeLinkingSystem	NodeLinkingSystem	Explicit link.group.remove()
Node VFX	SafeLegendaryNodePack	SafeLegendaryNodePack	Auto-expire + manual dispose()
World VFX	SafeWorldFXPack	SafeWorldFXPack	Auto-expire + manual dispose()
UI Highlights	UISelectedNodeHighlight	UISelectedNodeHighlight	On deselection/switch
UI Labels	UISelectedNodeLabel	UISelectedNodeLabel	On deselection/switch
Debug Lines	NodeHierarchyVisuals	NodeHierarchyVisuals	Manual dispose()
World Decor	World/SigmaRift/etc	main.js.switchMode()	Full scene reset
Orphan-Prone Patterns Identified:
Incomplete Initialization Failures: If a system crashes mid-init, objects already added may lack removal
Partial World Switch: If scene traversal fails mid-way, some objects persist
VFX Auto-Expire Failures: If progress tracking breaks, VFX never removes
Memory Leaks: Some VFX systems lack explicit dispose() methods
UI Cleanup on Crashes: UI elements may persist if system crashes before cleanup
3. ROOT GROUP PROPOSAL
Canonical Root Groups

// Proposed root group structure
this.nodesRoot = new THREE.Group();
this.nodesRoot.name = 'ATOMA_Nodes_Root';

this.linksRoot = new THREE.Group();
this.linksRoot.name = 'ATOMA_Links_Root';

this.vfxRoot = new THREE.Group();
this.vfxRoot.name = 'ATOMA_VFX_Root';

this.uiRoot = new THREE.Group();
this.uiRoot.name = 'ATOMA_UI_Root';

this.debugRoot = new THREE.Group();
this.debugRoot.name = 'ATOMA_Debug_Root';

this.worldRoot = new THREE.Group();
this.worldRoot.name = 'ATOMA_World_Root';

// Add to scene in order (bottom to top render order)
this.scene.add(this.worldRoot);
this.scene.add(this.linksRoot);
this.scene.add(this.nodesRoot);
this.scene.add(this.vfxRoot);
this.scene.add(this.debugRoot);
this.scene.add(this.uiRoot);
Object Type Mapping
Object Type	Target Root	Rationale
All node meshes (AINodes, EnhancedNodeModels)	nodesRoot	Centralize node geometry for batch operations
Hit-proxy spheres	nodesRoot	Keeps proxies with their nodes
Link groups (conduits, neon visuals)	linksRoot	Separate link rendering pipeline
Link visual effects (auras, beads, particles)	linksRoot	Link VFX grouped with links
Particle systems (SafeLegendary*, SafeWorld*)	vfxRoot	Centralized VFX management
Weather effects (SafeAIWeather)	vfxRoot	VFX system
Selection highlights/rings	uiRoot	UI layer rendering
Node labels	uiRoot	UI layer rendering
Inspect overlays	uiRoot	UI layer rendering
Hierarchy lines	debugRoot	Debug visualization layer
Debug markers	debugRoot	Debug visualization layer
Edit helpers	debugRoot	Debug visualization layer
Floor planes	worldRoot	Static environment
Platforms/rings	worldRoot	Static environment
Decorative objects	worldRoot	Static environment
4. MIGRATION RISK ANALYSIS
Raycast Dependencies
Status: MINIMAL RISK

Raycast System: Uses hitProxySystem.raycast() which collects meshes from registry
Impact: Root groups don't affect raycasting as long as raycaster.intersectObjects() is called with proper target list
Mitigation: Ensure hit-proxy registry continues to provide target list
Direct Scene Traversal Dependencies
Systems using scene.children:

NodeLinkingInvariantGuard.js - Re-attaches detached nodes
VisualAudit.js - Finds nodes by nodeId or uuid
SafeLegendaryNodePack.js - Finds nearby nodes for VFX
MythicRitualController.js - Finds nearby nodes
_MythicRitualPlayer.js - Finds nearby nodes
AutoLinkFeedbackUI1_0.js - Finds all AI nodes
main.js.switchMode() - Full scene cleanup
Systems using scene.traverse:

NodeHierarchyVisuals_v1.js - Builds hierarchy lines
VisualOverlayAuditSystem.js - Counts nodes
VisualUpgradeSuperpack.js - Scans for edge glow objects
LegacyGlyphCleanup.js - Cleans up old glyphs
SafeWorldFXPack.js - Stats collection
_ProceduralMeaningEngine.js - Finds glyphs
SafeEvolutionManager.js - Finds nodes
_SafeLegendaryNodePack.js - Finds nodes
Multiple authority/validation systems
Risk Assessment:

LOW RISK: Most traversals use userData filtering (nodeId, isNode, category)
MITIGATION: Update traversals to target specific root groups instead of scene
Hard-Coded Scene-Level Queries
Pattern: this.scene.children.filter(obj => obj.userData?.nodeId)

Affected Systems:

SafeLegendaryNodePack.js - Nearby node queries
MythicRitualController.js - Nearby node queries
AutoLinkFeedbackUI1_0.js - All nodes query
VisualOverlayAuditSystem.js - Node counting
Mitigation: Replace this.scene.children with this.nodesRoot.children

Performance Impact
POSITIVE:

Cleaner scene graph, easier to optimize
Batch culling possible by root group
Faster world switch (remove groups vs traverse scene)
NEGATIVE:

Minimal overhead from extra Group wrappers
Potential rendering order changes (manage with renderOrder)
Cleanup/Safety Impact
IMPROVEMENTS:

World switch: this.scene.remove(this.nodesRoot) vs traversal
Cleaner disposal: System can clear its root group
Easier debugging: Isolate object types by root
5. FILE-BY-FILE MIGRATION PLAN
Phase 1: Infrastructure Setup (main.js)
File: main.js

Changes:

Create root groups in init() or constructor
Add groups to scene in correct order
Update switchMode() to remove groups instead of traversal

// In init() or constructor
this.nodesRoot = new THREE.Group();
this.linksRoot = new THREE.Group();
this.vfxRoot = new THREE.Group();
this.uiRoot = new THREE.Group();
this.debugRoot = new THREE.Group();
this.worldRoot = new THREE.Group();

this.scene.add(this.worldRoot);
this.scene.add(this.linksRoot);
this.scene.add(this.nodesRoot);
this.scene.add(this.vfxRoot);
this.scene.add(this.debugRoot);
this.scene.add(this.uiRoot);
Risk: LOW - Purely additive, no behavior change

Phase 2: Node System Migration
Files:

AINodes.js
EnhancedNodeModels.js
_RareNodeSpawner.js
Changes: Replace this.scene.add(node) with this.nodesRoot.add(node)

Lines affected: ~50

Risk: LOW - Direct replacement, visual behavior unchanged

Phase 3: Link System Migration
Files:

NodeLinkingSystem.js
NeonLinkVisuals.js
LinkAuraSystem.js
LinkRendererConduit.js
Changes: Replace this.scene.add(linkGroup) with this.linksRoot.add(linkGroup)

Lines affected: ~30

Risk: LOW - Direct replacement

Phase 4: VFX System Migration
Files:

SafeLegendaryNodePack.js
SafeWorldFXPack.js
SafeAIWeatherPack.js
SafeEvolutionManager.js
SafeLegendaryLinkFX.js
SafeLegendaryWorldEvents.js
SynergyVFXEngine1_0.js
CascadeParticleSystem_Session120.js
HarmonyRecoveryVisualSystem_Session138.js
Changes: Replace this.scene.add(vfxObject) with this.vfxRoot.add(vfxObject)

Lines affected: ~200

Risk: LOW - Direct replacement

Phase 5: UI System Migration
Files:

UISelectedNodeHighlight3_2.js
UISelectedNodeLabel3_3.js
UIPrimaryNodeAura3_7.js
NodeInspectOverlay3_0.js
_NodeMicroEvents.js
UIPrimaryNodeTopBar3_7.js
Changes: Replace this.scene.add(uiObject) with this.uiRoot.add(uiObject)

Lines affected: ~20

Risk: LOW - Direct replacement, renderOrder may need adjustment

Phase 6: Debug System Migration
Files:

NodeHierarchyVisuals_v1.js
NodeHierarchyVisualFeedback_v1.js
NodeEditor.js
Changes: Replace this.scene.add(debugObject) with this.debugRoot.add(debugObject)

Lines affected: ~15

Risk: LOW - Direct replacement

Phase 7: World System Migration
Files:

World.js
SigmaRiftChamber.js
DreamDesert.js
QuantumIsland.js
FractalValley.js
MemoryLane.js
Changes: Replace this.scene.add(worldObject) with this.worldRoot.add(worldObject)

Lines affected: ~40

Risk: LOW - Direct replacement

Phase 8: Scene Traversal Updates
Files:

SafeLegendaryNodePack.js
MythicRitualController.js
_MythicRitualPlayer.js
AutoLinkFeedbackUI1_0.js
VisualOverlayAuditSystem.js
main.js.switchMode()
Changes: Replace this.scene.children or this.scene.traverse() with root-specific queries:


// Before
this.scene.children.filter(obj => obj.userData?.nodeId)

// After
this.nodesRoot.children.filter(obj => obj.userData?.nodeId)
Lines affected: ~25

Risk: MEDIUM - Logic changes, requires careful testing

Phase 9: World Switch Optimization
File: main.js.switchMode()

Changes: Replace scene traversal with group removal:


// Before
this.scene.children = this.scene.children.filter(child => 
    child === this.player || child instanceof THREE.Light
);

// After
this.nodesRoot.clear();
this.linksRoot.clear();
this.vfxRoot.clear();
this.uiRoot.clear();
this.debugRoot.clear();
this.worldRoot.clear();
Risk: MEDIUM - High-impact change, requires thorough testing

SUMMARY
Total Files to Modify: ~40 Total Lines to Change: ~380 Estimated Effort: 2-4 hours Risk Level: LOW-MEDIUM Recommended Approach: Incremental migration with testing after each phase

Key Benefits:

Cleaner scene organization
Faster world switches
Easier debugging and profiling
Batch operations possible by object type
Better isolation for feature development
Critical Success Factors:

Preserve render order (UI on top, debug above VFX)
Test world switch thoroughly
Verify raycasting still works
Ensure all VFX cleanup properly
No memory leaks from orphaned objects