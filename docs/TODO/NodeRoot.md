**Node Attach Points**
- `AINodes.js:3390-3440` `_finalizeSpawnedNode` – single canonical attach: `this.scene.add(node)` when root has no parent, then `registerNodeRoot(node)`.
- `NodeLinkingInvariantGuard.js:170-196` – repair path: if a node is detached it reattaches straight to `scene` (side-channel attachment).
- `NodeLinkingSystem.js:1169,1277,1708,1941,2014,2077,4245,4314` – link VFX helpers (highlights/pulses/rings/particles) add temporary meshes directly to `scene`; one shader warm‑up block (`~7120`) adds/removes a temp node in an offscreen scene.
- `SigmaNode.js:78-82` – legacy standalone Sigma node class spawns and attaches to `scene` outside AINodes pipeline.
- `World.js:336` – world décor “node” meshes added to `worldRoot` (not tagged as NodeRoot).
- `main.js:5355-5375` – scene hierarchy created: `scene` → `worldRoot` → `environmentRoot` & `worldLightingRoot`. Nodes bypass `worldRoot` and attach to `scene` root.

**NodeRoot Creation & Marking**
- `AINodeModel.js:35-90` (and other variants) create an inner `nodeRoot` `THREE.Group` per model and set `nodeRoot.userData.isNodeRoot = true`; core/holo meshes are parented here.
- `AINodes.js:1588-1600` stamps the top-level `nodeModel.userData.isNodeRoot = true` and `visualLayer = 'NODE_ROOT'`; `_finalizeSpawnedNode` later ensures `newNode.userData.isNodeRoot` again at `~3890`.
- Legacy factory `InputSensoryGeometries_v1.js:70-210` mirrors the inner `nodeRoot` pattern.
- No global `nodesRoot` container exists; `registerNodeRoot` (`AINodes.js:3234-3253`) only dedupes by `nodeId` and does not enforce parent or `isNodeRoot` flag.

**Spawn Pipeline (runtime)**
1) `AINodes.spawnNode`/`createNodes` select category & visual code.  
2) `EnhancedNodeModels.create(...)` builds a `THREE.Group` with inner `nodeRoot` and meshes.  
3) AINodes stamps metadata (`isNodeRoot`, visual overlays, interaction proxy) on the root group.  
4) `_finalizeSpawnedNode` → visibility/identity guards → `scene.add(node)` if parentless → `registerNodeRoot`.  
5) Visual bootstrap queues, observers, linking, etc., run after registration.  
Fallback/repair: `NodeLinkingInvariantGuard.repairBrokenNode` can later reattach a detached node directly to `scene`.

**Hierarchy Snapshot**
```
Scene
├─ WorldRoot (ATOMA_WorldRoot)
│  ├─ EnvironmentRoot
│  └─ WorldLightingRoot
├─ Node (THREE.Group, isNodeRoot=true)
│  └─ nodeRoot (child Group, isNodeRoot=true) → core/holo/FX meshes
└─ Link/selection VFX (added per-need by NodeLinkingSystem)
```
SigmaNode instances (legacy) sit directly under `scene`; world décor meshes sit under `worldRoot`.

**Cleanliness Assessment**
- Nodes share `scene` as their effective parent; there is **no shared `nodesRoot` group**, so node roots coexist alongside `worldRoot` and other systems.
- `isNodeRoot` is stamped on both the outer node group and an inner child group → duplicate “root” markers.
- Additional attachers exist (NodeLinkingInvariantGuard repair, SigmaNode legacy) creating fragmented authority over where a node can appear.
- All mesh creation still funnels through `EnhancedNodeModels`/AINodes pipeline for standard spawns; no evidence of nodes being attached to `worldRoot` or `environmentRoot`.
- Net: NodeRoot architecture is **fragmented** (multi-attach paths, no single parent container, duplicate root flags) but actual spawn pipeline remains centralized in `AINodes._finalizeSpawnedNode` with scene-root attachment.