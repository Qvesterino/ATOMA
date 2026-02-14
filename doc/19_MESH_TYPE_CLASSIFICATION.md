MESH-TYPE-CLASSIFICATION REPORT
PHASE: READ-ONLY AUDIT OF BASE MESH VS OVERLAY VS VFX
STEP 1 — MESH CREATION MAPPING
CoreHologramShader.js
System	Mesh Type	Lifetime	Details
createCoreIdentityMaterial()	BASE	persistent	Solid core identity material - opaque, depthWrite=true, depthTest=true
createNodeHologramShell()	OVERLAY	persistent	Fresnel rim-light aura - transparent (opacity 0.15), depthWrite=false, additive blending
getStableHologramGeometry()	OVERLAY	persistent	Cached icosphere geometry for hologram shells
AINodeModel.js
Mesh	System	Mesh Type	Lifetime	userData flags
mainBody	createCoreNode/DataNode/etc	BASE	persistent	visualLayer='CORE', isNodeCore=true, isCoreMesh=true
holoShell	createNodeHologramShell()	OVERLAY	persistent	visualLayer='AURA', isAura=true, renderOrder=1
edges	LineSegments	OVERLAY	persistent	visualLayer='EFFECT', isEffect=true
rings (TorusGeometry)	createCoreNode	OVERLAY	persistent	visualLayer='EFFECT', isEffect=true
panels (PlaneGeometry)	createDataNode	OVERLAY	persistent	visualLayer='EFFECT', isEffect=true
frame (BoxGeometry)	createMemoryNode	OVERLAY	persistent	visualLayer='EFFECT', isEffect=true
corners (SphereGeometry)	createMemoryNode	OVERLAY	persistent	visualLayer='EFFECT', isEffect=true
plates (CircleGeometry)	createLogicNode	OVERLAY	persistent	visualLayer='EFFECT', isEffect=true
rings (TorusGeometry)	createNeuralNode	OVERLAY	persistent	visualLayer='EFFECT', isEffect=true
core (SphereGeometry)	createNeuralNode	OVERLAY	persistent	visualLayer='EFFECT', isEffect=true
collider (SphereGeometry)	ensureInteractionCollider()	BASE (hidden)	persistent	visualLayer='CORE', isInteractionCollider=true, opacity=0
EnhancedNodeModels.js
Base Geometries (BASE) - All persistent:

Input nodes: Octahedron cores, Torus rings, Icosahedron portals
Process nodes: Asymmetric chambers, octahedron cores, torus rings
Integration nodes: Half-spheres, box frames, knot geometries
Analytics nodes: Cylinder discs, cone spikes, layered plates
Storage nodes: Box pillars, capsule geometries, tetrahedron shards
Control nodes: Cylinder cores, torus rings, pyramidal structures
Overlay/Effect Geometries (OVERLAY) - All persistent:

EdgesGeometry (wireframe outlines)
TorusGeometry (rings, bands, guides)
PlaneGeometry (transparent plates, lenses)
BoxGeometry (stream segments, small accents)
SphereGeometry (small accent spheres, glow cores)
CylinderGeometry (axes, columns, spindles)
Special Cases:

All meshes marked with visualCoreImmutable=true flag
All created during node initialization (lifetime: persistent)
No temporary VFX mesh creation detected in EnhancedNodeModels
STEP 2 — MUTATION OWNERSHIP
Systems Modifying Child Properties
System	Property	Target Layer	Notes
AINodeModel.animate()	rotation	OVERLAY (rings)	Rotates rings only during interaction
EnhancedNodeModels.animate()	rotation	OVERLAY + BASE	Rotates various parts during interaction state
AINodeModel.animate()	opacity	LOCKED (Session 103)	Emergency lockdown prevents opacity mutation
updateHologramShellMaterial()	uniforms.uTime	OVERLAY (hologram)	Animates shader time for breathing effect
Conflicts Detected
MIXED MODIFICATION - BOTH AFFECTED:

EnhancedNodeModels.animate()

Affects: Base rotation (nodeGroup) AND overlay elements (rings, plates)
Conflict: Single method mutates multiple layers
Target: Both base mesh rotation AND overlay element rotation
AINodeModel.animate()

Affects: Main body (BASE) AND overlay rings
Conflict: Node-level rotation affects entire hierarchy
Mitigation: Raycast gates prevent overlay interaction
Systems Affecting Multiple Layers:
System	Base Affected?	Overlay Affected?	VFX Affected?
AINodeModel.animate()	YES (rotation)	YES (rings)	NO
EnhancedNodeModels.animate()	YES (rotation)	YES (many)	NO
updateHologramShellMaterial()	NO	YES (hologram)	NO
Emergency Visual Lockdown	YES	YES	YES
STEP 3 — HIERARCHY STRUCTURE
Current Hierarchy Pattern (AINodeModel.js)

nodeGroup (THREE.Group)
├── nodeRoot (THREE.Group) [isNodeRoot=true]
│   ├── mainBody (THREE.Mesh) [BASE, visualLayer='CORE']
│   ├── holoShell (THREE.Mesh) [OVERLAY, visualLayer='AURA']
│   └── collider (THREE.Mesh) [HIDDEN, visualLayer='CORE']
└── edges/rings/panels (THREE.Mesh) [OVERLAY, visualLayer='EFFECT']
Current Hierarchy Pattern (EnhancedNodeModels.js)

nodeGroup (THREE.Group)
├── Core geometries (THREE.Mesh) [BASE, visualLayer='CORE']
├── Effect geometries (THREE.Mesh) [OVERLAY, visualLayer='EFFECT']
└── Decorative elements (THREE.Mesh) [OVERLAY, visualLayer='EFFECT']
Hierarchy Analysis
Structure Quality: PARTIAL

Observations:

✅ nodeRoot group exists for base core separation
✅ Visual layers marked via userData.visualLayer
❌ No dedicated OverlayGroup container
❌ No dedicated VFXGroup container
❌ Mixed hierarchy - overlays added to both nodeRoot and nodeGroup
Boundary Clarity: PARTIAL

Base meshes are grouped under nodeRoot (GOOD)
Overlays are split between nodeRoot (hologram) and nodeGroup (edges/rings)
No VFX group detected (VFX created elsewhere in particle systems)
FINAL SUMMARY
Separation Quality Assessment
Aspect	Status	Rating
Base mesh isolated	YES	✅ CLEAR - Base meshes grouped under nodeRoot
Overlay separated	PARTIAL	⚠️ PARTIAL - Split between nodeRoot and nodeGroup, no dedicated container
VFX separated	NOT DETECTED	❌ N/A - VFX handled by separate particle systems
Systems mutating multiple layers	PRESENT	⚠️ 2 systems identified
Overall Separation Quality
RATING: PARTIAL

Systems Mutating Multiple Layers:
AINodeModel.animate()

Affects: nodeGroup.rotation (affects entire hierarchy)
Layers affected: BASE + OVERLAY
Severity: LOW - rotation is transform-only, doesn't modify materials
EnhancedNodeModels.animate()

Affects: nodeGroup.rotation + individual child rotations
Layers affected: BASE + OVERLAY
Severity: LOW - all transform-only mutations, materials immutable
Positive Findings:
✅ Visual layer classification exists (visualLayer flag)
✅ Interaction authority isolated (collider vs core vs overlay)
✅ Material immutability enforced via flags
✅ Raycast gating prevents overlay interaction
✅ Emergency visual lockdown prevents dangerous mutations
Issues/Concerns:
⚠️ No dedicated OverlayGroup container
⚠️ No dedicated VFXGroup container
⚠️ Overlays split across multiple parent groups
⚠️ Animation systems rotate entire nodeGroup (affects all layers)
⚠️ Hierarchy inconsistency between AINodeModel and EnhancedNodeModels
Recommendations for Clear Separation:
Standardize hierarchy structure:


nodeRoot
├── BaseMeshGroup
├── OverlayGroup
└── VFXGroup
Group overlays under dedicated container

Separate animation systems by layer

Avoid rotating entire nodeGroup - rotate individual layer groups

Audit particle systems for VFX mesh creation patterns

END OF MESH-TYPE-CLASSIFICATION REPORT