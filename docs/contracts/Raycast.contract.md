# ATOMA – Raycast Contract
## Canonical Interaction & Hit Resolution Model
Version: 1.0  
Status: Constitution-Level Contract  
Scope: Node & Link Interaction  

---

# I. PURPOSE

The Raycast system exists solely to:

- Detect user interaction with world entities.
- Resolve a visual hit into a canonical gameplay identity.
- Forward interaction intent to `InteractionAuthority`.

Raycast is a **detection system only**.

Raycast must never:
- Mutate gameplay state.
- Modify metrics.
- Modify visual state.
- Traverse scene hierarchy heuristically.
- Depend on mesh structure or parent chains.

---

# II. CORE PRINCIPLE

> Raycast resolves to identity, never to mesh.

The only valid output of the Raycast pipeline is:

node.nodeId


or

link.linkId


Meshes are views.
Entities are authoritative.

---

# III. INTERACTION PIPELINE

## Step 1 – Input

PointerEvent → Normalized Device Coordinates (NDC)


No direct state mutation allowed at this stage.

---

## Step 2 – Raycast Scope Restriction

Raycasting must be restricted to interaction domains only:

scene.nodesRoot
scene.linksRoot


Raycast must never operate on:

scene.children (full traversal)


---

## Step 3 – Hit Proxy Requirement

Each interactive entity must expose exactly one canonical hit proxy.

### Required Metadata:

mesh.userData.hitType
mesh.userData.entityId


### Valid hitType values:

"node"
"link"


### entityId values:

node.nodeId
link.linkId


Traversal via `parent.parent.parent` is forbidden.

---

## Step 4 – Identity Resolution

Raycast must resolve through registries only:

```javascript
if (hitType === "node") {
    const node = NodeRegistry.get(entityId)
}

if (hitType === "link") {
    const link = LinkRegistry.get(entityId)
}
If registry lookup fails:

The hit must be ignored.

No fallback identity logic is allowed.

IV. REGISTRY REQUIREMENTS
NodeRegistry
Map<nodeId, Node>
LinkRegistry
Map<linkId, Link>
Registries are the sole authority for entity resolution.

Meshes are never treated as authoritative.

V. HIT PROXY DESIGN RULES
Each Node must define:

node.hitProxyMesh
Requirements:
Stable geometry.

No per-frame deformation.

No per-frame scaling.

No opacity mutations.

No shader-driven geometry changes.

Stable bounding volume.

Must NOT use:

Aura meshes.

VFX meshes.

Overlay meshes.

Deforming shader bodies.

Animated displacement geometry.

VI. LAYER ISOLATION (Recommended)
Three.js Layers must be used to isolate interaction surfaces.

Example:

LAYER_NODE_INTERACTION
LAYER_LINK_INTERACTION
Raycaster must be configured to target interaction layers only.

This guarantees:

VFX cannot intercept clicks.

Debug meshes cannot interfere.

Overlay visuals are ignored.

VII. SELECTION RESPONSIBILITY
Raycast does NOT handle:

Selection logic.

Highlight effects.

Visual feedback.

State transitions.

Raycast forwards identity to:

InteractionAuthority
InteractionAuthority decides what happens next.

VIII. PERFORMANCE RULES
Raycast executes only on pointer events.

Never per-frame.

Intersection list must be distance-sorted.

Only first valid hit is processed.

No dynamic reallocation per frame.

IX. FAILURE MODEL
If:

entityId is missing,

hitType is invalid,

registry lookup fails,

Raycast must:

Fail silently.

Log only in debug mode.

Never fallback to uuid.

Never crash.

X. FORBIDDEN PATTERNS
The following are constitution-level violations:

❌ Raycasting entire scene.children
❌ Identity resolution via uuid
❌ Identity resolution via mesh.name
❌ Parent-chain traversal for identity
❌ Interaction dependent on visual mutation state
❌ Raycast logic inside visual systems

XI. WORLD SWITCH SAFETY
Raycast must:

Be resilient to world switches.

Not retain stale mesh references.

Not hold direct entity references across world resets.

Always resolve through fresh registry lookup.

XII. FUTURE EXTENSIONS
The Raycast contract allows extension to:

Drag interactions

Multi-select

Link selection

Contextual targeting

But identity resolution rules remain immutable.

XIII. SUMMARY
Raycast pipeline:

Pointer → Ray → HitProxy → entityId → Registry → InteractionAuthority
No mesh logic.
No heuristics.
No identity guessing.

Raycast resolves identity.
Nothing more.
Nothing less.

