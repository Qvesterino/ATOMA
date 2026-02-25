========================================
1) ENTRYPOINTS & CALL GRAPH (START → END)
========================================

- **Bulk init (`createNodes`, INIT mode)** — `AINodes.createNodes` (AINodes.js:875-1070) → `createNode` (1184-1500) → `EnhancedNodeModels.create` (EnhancedNodeModels.js:1704-1890) → `_finalizeSpawnedNode` (AINodes.js:3160-3370) → `registerNodeRoot` (3084-3106) → `_runPostSpawnObservers` (AIS nodes post observers incl. `NodeVisualAuthorityRuntime.applyBaseline`) → `nodeSpawnRegistry.registerSpawn(finalizedNode,'AINodes.createNodes')` (AINodes.js:1015-1024) → visible in scene.
  - Scene attachment occurs inside `_finalizeSpawnedNode` when `this.scene` exists (AINodes.js:3234-3244).
  - Unique-spawn enforcement happens **before** factory call via `uniqueSpawnService.check` in createNodes (AINodes.js:915-956).
  - Specialized EXTREME chance (15%) decided *before* category is handed to `createNode` (AINodes.js:904-934).
  - Bulk pathway runs only when `spawnMode==='INIT'`; switches to `RUNTIME` after batch completes (AINodes.js:1044-1056).

- **Runtime spawn (`spawnNode`, RUNTIME mode)** — Guarded entry (AINodes.js:3311-3490): checks spawnMode, `_spawnFromUpdate`, compliance (`SpawnAuthorityComplianceGate.validateSpawnRequest`), uniqueness (`uniqueSpawnService.check`), canonical category enforcement, visual registry readiness, then:
  `createNode` → `_finalizeSpawnedNode` → `_runPostSpawnObservers` → `uniqueSpawnService.register` (if unique key) → `NodeSpawnLogger.logSpawn` → `nodeSpawnRegistry.registerSpawn(newNode,'AINodes.spawnNode')` (AINodes.js:3820-3846). Materialize animation queued afterwards (AINodes.js:3860-3883).
  - Runtime spawns are triggered externally via:
    - `onLinkCreated` (AINodes.js:3945-3978): 20% chance after link cooldown → `spawnNode(categoryIntent)`; gated by link spawn cooldown and target population.
    - `spawnMythicNode/Prime/Error/Extreme/Archetype` wrappers (AINodes.js:4138-4176) → all call `spawnNode` with forced archetype.
    - `checkNetworkDensityAndSpawn` seeds `pendingDensityIntent` but does **not** directly call spawn (AINodes.js:3983-4015).
  - `updateSpawning` is currently a no-op (`return;` at AINodes.js:3574-3576), so scheduler-driven runtime spawning is disabled; only event/UI wrappers above can reach `spawnNode`.

- **World bootstraps (indirect entry)** — `main.js:createWorld()` builds scene then calls `createAINodes()`; `AINodes` constructor sets `spawnMode='INIT'` and later `createNodes` is invoked from main bootstrap (see AINodes_DuplicateInstantiation_Audit.md summary). `WorldRuntime_v1.initInitialWorld` can call `game.createWorld(); game.createAINodes();` (WorldRuntime_v1.js:60-85) but defers to the same pipeline; no alternate spawn path.

Call graph sketch (bulk path):
`createWorld → createAINodes → AINodes.createNodes → createNode → EnhancedNodeModels.create → _finalizeSpawnedNode → registerNodeRoot → postSpawnObservers(NodeVisualAuthorityRuntime) → nodeSpawnRegistry.registerSpawn/log → scene visible`

Call graph sketch (runtime path):
`spawn trigger (link/UI wrapper) → AINodes.spawnNode → category/uniqueness/registry gates → createNode → EnhancedNodeModels.create → _finalizeSpawnedNode → postSpawnObservers → uniqueSpawnService.register → NodeSpawnLogger → nodeSpawnRegistry.registerSpawn → materialize animation`

Evidence excerpts:
```
// Guarded runtime entry + registry/log registration
function spawnNode(...) { ... if (this.spawnMode !== 'RUNTIME') return null; ... nodeSpawnRegistry.registerSpawn(newNode, 'AINodes.spawnNode'); }
```
(AINodes.js:3311-3844)

```
// Bulk init call graph
createNodes(environment,count){ ... const node=this.createNode(...); ... const finalized=this._finalizeSpawnedNode(node,...); ... nodeSpawnRegistry.registerSpawn(finalizedNode,'AINodes.createNodes'); }
```
(AINodes.js:875-1030)

```
// Scene attach & registration
if (!node.parent && this.scene) { this.scene.add(node); } ... this.registerNodeRoot(node);
```
(AINodes.js:3234-3268)

========================================
2) CATEGORY SELECTION (BEFORE "category" EXISTS)
========================================

- **Bulk INIT**: `createNodes` picks category via `Math.random()` from `specialNodeTypes` (10% after first node) or `nodeCategories` (AINodes.js:895-923). EXTREME flag has separate 15% roll before uniqueness check.
- **Runtime**:
  - Deterministic cycle intent: `spawnCycleState.order` (`['input','process','storage','analytics','integration','control','quantum','sigma','mythic','prime','error','emotional']`) with cursor advance on success (AINodes.js:596-619, 763-820). `getRuntimeSpawnCategoryIntent()` returns the next valid category or `'input'` fallback (AINodes.js:3067-3078).
  - If caller passes no category, `spawnNode` uses `getWeightedRandomCategory()` — uniform `Math.random()` over standard+new+special+`'extreme'` (AINodes.js:3050-3065).
  - Compliance & normalization: `SpawnAuthorityComplianceGate.validateSpawnRequest` may return `'input'` fallback or null to abort (AINodes.js:3340-3360). Additional whitelist validation via `validateCategory()` (AINodes.js:116-150) and canonical enforcement to avoid overusing `'input'` (AINodes.js:3400-3430).
  - Forced categories via wrappers: `spawnMythicNode/Prime/Error/Extreme/Archetype` call `spawnNode` with explicit category+archetype (AINodes.js:4138-4176). Debug/automation triggers are routed through same entry.
  - Seeded RNG: **none**; all randomness uses `Math.random()` (non-seeded), so runs are non-deterministic except for the cyclic intent order.

Key excerpt:
```
const allCategories=[...nodeCategories,...newNodeCategories,...specialNodeTypes,'extreme'];
return allCategories[Math.floor(Math.random()*allCategories.length)];
```
(AINodes.js:3050-3065)

========================================
3) POOLS & VISUAL CODE RESOLUTION (WHY VISUALS REPEAT)
========================================

Resolution chain:
`category (validated) → poolCategory → pool = EnhancedNodeModels.getCategoryPool(poolCategory) → idx = _variantCounterByCategory[category] % pool.length → finalVisualCode = pool[idx] → EnhancedNodeModels.create(category, finalVisualCode)`

- **Pool source**: `CATEGORY_POOLS` built from `NODE_VISUAL_REGISTRY` and sorted once at load (NodeVisualRegistry.js:115-124). Each category pool is a numeric list of canonical visual codes.
- **Selection method**: deterministic per-category counter stored on `AINodes._variantCounterByCategory`. Counter key is the *requested category string* (pre-normalization), initialized to 0 when first seen (AINodes.js:1272-1320). No randomness; strictly round-robin modulo pool length.
- **Fallbacks**:
  - If `getCategoryPool` returns empty, createNode falls back from `process`→`input` or aborts with `POOL_EMPTY` (AINodes.js:1324-1343).
  - `EnhancedNodeModels.create` will also abort if pool empty or registry entry missing (EnhancedNodeModels.js:1735-1792).
- **Potential collapse causes**:
  - Small pools (many categories have 4–6 codes) + round-robin → repeated visuals after each pool length.
  - Counter keyed by raw `category` argument: if callers pass non-canonical strings that later remap to `'input'`, the counter resets per unknown key, always starting at `pool[0]`, producing identical visuals for those calls while still using the `'input'` pool.
  - AINodes re-instantiation resets `_variantCounterByCategory`, restarting pools from index 0 on every world load.
  - No per-node hashing; `finalVisualCode` does not depend on nodeId, position, or seed.

Table (source: NodeVisualRegistry.js & AINodes.js):

| Category | Pool source | Selection | Fallbacks | finalVisualCode emit |
|----------|-------------|-----------|-----------|----------------------|
| input | CATEGORY_POOLS['input'] (101-106) | idx = counter%len (AINodes.js:1300-1320) | If pool empty → fallback to `process` → abort | pool[idx] |
| process | CATEGORY_POOLS['process'] (201-206) | same | fallback to `input` | pool[idx] |
| integration | pool 301-310 | none | abort if empty | pool[idx] |
| analytics | pool 401-408 | none | abort if empty | pool[idx] |
| storage | pool 501-512 | none | abort if empty | pool[idx] |
| control | pool 601-615 (incl. extreme control) | none | abort if empty | pool[idx] |
| quantum | pool 701-704 | none | abort if empty | pool[idx] |
| sigma | pool 801-805 (shares factories with quantum) | none | abort if empty | pool[idx] |
| mythic | pool 901-906 | none | abort if empty | pool[idx] |
| prime | pool 1001-1006 | none | abort if empty | pool[idx] |
| error | pool 1101-1106 | none | abort if empty | pool[idx] |
| emotional | pool 1201-1206 | none | abort if empty | pool[idx] |

Evidence excerpts:
```
if (this._variantCounterByCategory[category] === undefined) this._variantCounterByCategory[category]=0;
... const idx = counter % pool.length;
const selectedVisualCode = pool[idx];
finalVisualCode = selectedVisualCode;
this._variantCounterByCategory[category] = idx + 1;
```
(AINodes.js:1268-1320)

```
export const CATEGORY_POOLS = {}; ... CATEGORY_POOLS[def.category].push(code); ... sort(...)
```
(NodeVisualRegistry.js:115-124)

```
const pool = CATEGORY_POOLS[cat] || []; ... return pool[token % pool.length];
```
(EnhancedNodeModels.js:1715-1739)

========================================
4) NODE CONSTRUCTION (GEOMETRY / MATERIAL / GROUP STRUCTURE)
========================================

- Factory resolution: `EnhancedNodeModels.create(category, visualToken, color)` resolves `resolvedVisualCode`, looks up `registryEntry.factoryName`, binds to the appropriate factory (category-specific modules), and executes it with a fresh `THREE.Group` root (EnhancedNodeModels.js:1704-1888).
- Root tagging: after factory returns, `userData.visualCode`, `factoryName`, and `category` are stamped on `rootGroup` (EnhancedNodeModels.js:1862-1877).
- Geometry integrity checks: rejects if registry/factory missing; logs `FACTORY_UNKNOWN_TRACE` and returns null (EnhancedNodeModels.js:1808-1849).
- Common hierarchy: root `Group` -> category-specific meshes/sub-groups; core meshes usually marked via userData (e.g., `visualLayer:'CORE'`, `isCoreMesh` set inside individual factories; not altered in spawn pipeline).
- No legacy builder fallback: only canonical EnhancedNodeModels factories are used; legacy creation paths are blocked by category validation and `LegacyNodeModelFilter` (AINodes.js:1208-1239).

Excerpt:
```
const resolveVisualCode = (...) => pool[token % pool.length];
... const registryEntry = NODE_VISUAL_REGISTRY[resolvedVisualCode];
... const factoryFn = resolveFactory(registryEntry.factoryName);
const rootGroup = factoryFn(nodeGroup, resolvedVisualCode, color);
if (rootGroup) { rootGroup.userData.visualCode = resolvedVisualCode; rootGroup.userData.factoryName = registryEntry.factoryName; rootGroup.userData.category = cat; }
```
(EnhancedNodeModels.js:1715-1877)

========================================
5) REGISTRATION & SCENE ATTACH (WHEN IT BECOMES REAL)
========================================

- `_finalizeSpawnedNode` adds to `this.scene` if no parent (AINodes.js:3234-3244), forces root visible, sets sane scales/layers, computes bounding spheres, then sets `userData.id/nodeId/category` if missing (AINodes.js:3246-3310).
- `registerNodeRoot` inserts node into `nodes` array and `nodesMap` keyed by nodeId (AINodes.js:3084-3106).
- Post-spawn observers (ordered map) run immediately; default registered observer `visual-authority-runtime` enforces baseline visibility/frustum/scale and locks core materials (AINodes.js:603-618; NodeVisualAuthorityRuntime.js:8-55).
- Unique registry & logging: both bulk and runtime paths call `nodeSpawnRegistry.registerSpawn(...)` after finalize (AINodes.js:1015-1024, 3826-3831), which forwards to `uniqueSpawnService.register` and logs metadata (NodeSpawnRegistry.js:18-64).
- Additional metadata: spawnNode path injects naming codes and schedules materialize animation after registration (AINodes.js:3848-3883).

Excerpts:
```
if (!node.parent && this.scene) { this.scene.add(node); sceneAdded=true; }
... this.registerNodeRoot(node);
```
(AINodes.js:3234-3258)

```
uniqueSpawnService.register({ key: finalizedNode.userData.uniqueArchetypeKey, nodeId: registerNodeId, ... });
nodeSpawnRegistry.registerSpawn(newNode, 'AINodes.spawnNode');
```
(AINodes.js:3812-3831)

```
applyBaseline(node,...){ node.visible=true; if(node.layers&&node.layers.mask===0) node.layers.mask=1; if(!allowRootFrustumDisable&&node.frustumCulled===false) node.frustumCulled=true; ... lock core materials; }
```
(NodeVisualAuthorityRuntime.js:8-52)

========================================
6) POST-SPAWN MUTATION (WHY IT CHANGES AFTER SPAWN)
========================================

- **Visual authority baseline**: `NodeVisualAuthorityRuntime.applyBaseline` resets root visibility, frustumCulled, layers, and locks core materials on every spawn (AINodes.js:603-618; NodeVisualAuthorityRuntime.js:8-52). This can re-enable frustum culling on roots (makes them cullable) but does not change visual code.
- **Visual state binder**: not automatically invoked in spawn flow; binder utilities exist but are not registered as observers, so no post-spawn mesh swaps.
- **Materialize animation**: scales/opacity easing applied to overlays; does not touch visualCode (AINodes.js:3883-3925).
- **Unique spawn reuse**: if a spawn is denied, caller reuses existing node (`uniqueSpawnService.check`), leading to perceived “duplicate” visuals because no new node is created (AINodes.js:3365-3388). This is reuse, not a new visual selection.
- No other systems in the default observer list mutate geometry/material immediately after spawn; link-related visual mutations are explicitly forbidden in NodeVisualStateBinder and guarded by authority checks.

========================================
7) ROOT-CAUSE RANKING (EVIDENCE-BASED)
========================================

1. **Deterministic per-category counter + small pools** — Round-robin `idx = counter % pool.length` with many pools of length 4–6 (AINodes.js:1268-1320; NodeVisualRegistry.js:1-140). After every `pool.length` spawns, visuals repeat identically. No randomness or hashing to spread variants.
2. **Counter keyed by raw requested category** — If callers pass non-canonical categories that are later remapped to `'input'`, the counter resets per raw key, always selecting `pool[0]` while still using the `'input'` pool, producing repeated visuals for those malformed requests (AINodes.js:1268-1320, 1196-1245).
3. **AINodes re-instantiation resets counters** — `_variantCounterByCategory` is initialized in constructor and never persisted; each world reload starts pools at index 0, so early runtime spawns after a reload mirror the first visuals (AINodes.js:449-470).
4. **Unique-spawn reuse** — When uniqueness blocks a new spawn, the existing node is returned, appearing as multiple spawn attempts but a single visual (AINodes.js:3365-3388; UniqueSpawnService.js:27-71). This does not change visualCode but explains “same node instead of new visual.”
5. **No post-spawn visual diversification** — Post-spawn observers only enforce baseline; no system reassigns visualCode or variant, so any collapse in selection remains visible (AINodes.js:603-618; NodeVisualAuthorityRuntime.js:8-52).

No evidence of: pool cursor drift, global counters across categories, or post-spawn canonicalization that remaps different visualCodes to one; all selection happens once in `createNode` and is deterministic.

========================================
APPENDIX: SHORT EXCERPT INDEX
========================================
- AINodes.js:875-1030 (createNodes call path & registry log)
- AINodes.js:1184-1345 (createNode validation, pool selection, counter modulo)
- AINodes.js:3311-3490 (spawnNode guards, category normalization, uniqueness)
- AINodes.js:3234-3310 (scene add, identity stamping, registerNodeRoot)
- AINodes.js:3812-3831 (post-finalize logging and registry registration)
- NodeVisualRegistry.js:1-140 (NODE_VISUAL_REGISTRY & CATEGORY_POOLS construction)
- EnhancedNodeModels.js:1704-1877 (create: pool resolve → factory → userData tags)
- UniqueSpawnService.js:1-71 (makeKey + check reuse decision)
- NodeVisualAuthorityRuntime.js:8-52 (baseline post-spawn mutation)

