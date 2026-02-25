**Findings**
- Canonical creation path is `EnhancedNodeModels.create` → `AINodes.createNode` → `scene.add(nodeModel)` → `registerNodeRoot(newNode, this.nodes)`; only these steps place a root in the scene and in `aiNodes.nodes` (`EnhancedNodeModels.js:333`, `AINodes.js:832`, `AINodes.js:1344`, `AINodes.js:2781`).
- All spawn entry points ultimately call `AINodes.spawnNode`; parallel triggers exist: scheduler (`AINodes.js:2986`), link events (`AINodes.js:3002`), density checks (`AINodes.js:3032`), rare/mythic helpers (`_RareNodeSpawner.js:202`, `_MythicNodeCreation.js:775`), and console tests (`SpawnAuthorityConsoleAPI.js:81,119`).
- `registerNodeRoot` is the only writer to `this.nodes`; it pushes when `userData.nodeId` is missing, otherwise replaces by nodeId (`AINodes.js:249-261`).
- Several wrappers monkey‑patch `spawnNode`/`createNode` but all call the original and do not add to `this.nodes`: `NodeHierarchyBridge_v1.js:335-343`, `HitProxyAutoRegistrar.js:64-73`, `_VisualLockCompleteIntegration.js:43-65`, plus main.js debug wrappers (`main.js:4834-4842`, `5273`, `5369`, `5434`, `5494`, `5567`).
- No other module calls `scene.add` for node roots permanently; non-canonical adds are transient warmups removed immediately (`NodeLinkingSystem.js:6755-6762`).

**Spawn/Registration Graph Table**
file:line | call | creates root? | adds to scene? | registers in `aiNodes.nodes`? | writes `nodeRegistry`? | multi-call risk
--- | --- | --- | --- | --- | --- | ---
`AINodes.js:832` | `createNode` | yes (Group) | yes (`scene.add` at 1344) | yes (2781 via `registerNodeRoot`) | yes (2845/2872) | yes (called by all spawners)
`AINodes.js:2512` | `spawnNode` | delegates | after create | after create | after create | yes (multiple triggers)
`AINodes.js:658` | initial seeding loop | yes | yes | yes (`registerNodeRoot` at 680) | no | once per init
`AINodes.js:2781` | `registerNodeRoot` | no | no | yes | no | replaces by nodeId
`AINodes.js:2845/2872` | unique registry set | no | no | no | yes | duplicates benign
`_MythicNodeCreation.js:775` | `aiNodes.spawnNode('mythic',…)` | via AINodes | via AINodes | via AINodes | via AINodes | rare ritual
`_RareNodeSpawner.js:202` | `aiNodes.spawnNode('input',…, archetypeKey)` | via AINodes | via AINodes | via AINodes | via AINodes | legacy/diagnostic
`SpawnAuthorityConsoleAPI.js:81,119` | console tests | via AINodes | via AINodes | via AINodes | via AINodes | manual
`NodeHierarchyBridge_v1.js:335-343` | wrapper | no | no | no | no | wraps `spawnNode`
`HitProxyAutoRegistrar.js:64-73` | wrapper | no | no | no | no | wraps `spawnNode`
`_VisualLockCompleteIntegration.js:43-65` | wrapper | no | no | no | no | wraps `createNode`
`main.js:4834-4842` (and 5273, 5369, 5434, 5494, 5567) | wrappers | no | no | no | no | wrap `createNode` / `spawnNode` for one-shot logging/guards
`NodeLinkingSystem.js:6755-6762` | shader warmup | yes temp | yes temp | no | no | removed immediately (no registry touch)
`AINodes.js:3116-3137` | `dispose` | no | removes | clears | clears | run on world change

**Root Cause Verdict**
- H1 Multiple AINodes instances: **FALSE** — `createAINodes` creates one instance per world and `aiNodes.dispose()` is called before world reset (`main.js:4785-4883`, `main.js:7389-7394`).
- H2 Parallel spawn triggers without strong dedupe: **TRUE** — multiple runtime triggers all funnel to `spawnNode`; only singleton archetypes are deduped, so standard spawns can accumulate. If any root is later detached, `this.nodes` keeps the entry.
- H3 Wrapper ghost registration: **FALSE** — all wrappers call the original and never push to `this.nodes`; no `registerNodeRoot` outside AINodes.
- H4 Secondary scene.add/remove of roots outside AINodes: **FALSE** — only transient warmup adds removed immediately (`NodeLinkingSystem.js:6755-6762`); no permanent extra `scene.add`.
- H5 nodeId instability: **FALSE** — nodeId assigned once in `spawnNode` and used by `registerNodeRoot`; no reassignment paths found.

**Minimal Fix Patch Plan**
Goal: `aiNodes.nodes` == scene node roots, no ghosts, stable ids, single registration.
1) Harden identity before registration  
   - In `AINodes.createNode` (after `nodeModel` creation, before `scene.add`), force `nodeModel.userData.nodeId` to existing value or `nodeModel.uuid`, and set `userData.isNodeRoot = true` if missing.
2) Guard registration against non-scene roots  
   - In `registerNodeRoot` (`AINodes.js:249`), return early if `!root.parent || root.parent !== this.scene` or `root.userData?.isNodeRoot !== true`.
3) Single registration gate in `spawnNode`  
   - After `scene.add` succeeds and before `registerNodeRoot`, set a one-time flag on the root (`__registeredInAINodes`) to avoid double insertion if wrappers ever re-enter; if flag already true, skip.
4) Optional on-demand audit helper (manual only)  
   - Add `window.ATOMA_SPAWN_SANITY_CHECK = () => { ... }` behind `if (window.ATOMA_SPAWN_AUDIT)` in `AINodes.js` exporting counts:  
     - rootsInScene = children with `userData.isNodeRoot === true`  
     - rootsInRegistry = `this.nodes.length`  
     - mismatches up to 20 ids (in one not the other).  
   - No automatic invocation; no recurring logs.

**Refactor Plan**
- Phase 1 (safety net): Keep fixes above; add unitary helper `isNodeRoot(obj)` in AINodes to centralize the definition (has `userData.isNodeRoot === true` and `userData.nodeId`).
- Phase 2 (factory isolation): Move **all** node root instantiation to `EnhancedNodeModels.create`; prohibit new `THREE.Group` roots elsewhere via lint/grep checks and code comments; export a single `createNodeRoot` helper.
- Phase 3 (single registrar): Restrict `scene.add` of node roots to `AINodes.createNode`; wrappers may observe but cannot mutate. Introduce a typed `registerRoot(root)` API that sets nodeId and records registry; mark `spawnNode`, `createNode`, `registerNodeRoot` as the only mutation points.
- Phase 4 (caller funnel): Ensure every system that needs a node uses `AINodes.spawnNode`; remove or deprecate legacy direct calls (`_RareNodeSpawner`, console tests) behind a shared spawn service.
- Phase 5 (removal parity): Add a complementary `removeNode(root)` in AINodes that removes from scene and registry; require all removals to call it. Validate with periodic manual `ATOMA_SPAWN_SANITY_CHECK`.
- Phase 6 (enforcement): Add CI grep checks for `scene.add(` on roots and `this.nodes.push` outside AINodes; document the funnel in `docs/SPAWN_PIPELINE_FULL.md`.