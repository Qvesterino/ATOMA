**Spawn Entries**
file | function | when called | frequency
--- | --- | --- | ---
`AINodes.js` | `updateSpawning` → `spawnNode` (currentTime > `nextTimeSpawn`) | main update loop driven by `this.effectOrchestrator`/player frame | per frame (60 Hz) when scheduler timer elapses (`AINodes.js:2986`)
`AINodes.js` | `onLinkCreated` → `spawnNode` (with 20 % chance) | called by `NodeLinkingSystem` after each link event | per link when event fires (`AINodes.js:3002`)
`AINodes.js` | `checkNetworkDensityAndSpawn` → `spawnNode` (plus rare `specialNodeTypes`) | invoked inside `updateSpawning` when node count drops below threshold | periodic (density check interval ~10 s) while under target (`AINodes.js:3032`)
`_MythicNodeCreation.js` | `spawnMythicNode` → `aiNodes.spawnNode('mythic', …)` | mythic ritual once `phaseProgress > 0.8` | rare ritual-driven single spawn (`_MythicNodeCreation.js:775`)
`_RareNodeSpawner.js` | rare spawner helper → `aiNodes.spawnNode('input', position, archetypeKey)` | legacy rare-spawn script triggered from performance/console hooks | legacy/rare (manual script or diagnostics) (`_RareNodeSpawner.js:202`)
`SpawnAuthorityConsoleAPI.js` | `testFallback` / `testAllCategories` → `spawnNode` | debug console commands | manual/testing only (`SpawnAuthorityConsoleAPI.js:81`)

**Root Creation Paths**
file | function | creates root? | how | risk
--- | --- | --- | --- | ---
`EnhancedNodeModels.js` | `create(category, index, color)` | yes | packages a fresh `new THREE.Group()` and dispatches to a variant factory (`new THREE.Group()` → `createInput/Process/...`) (`EnhancedNodeModels.js:333`) | canonical (single factory that always returns a `nodeModel`)
`AINodes.js` | `createNode` | yes | pulls `nodeModel` from `EnhancedNodeModels.create`, injects metadata, pushes to scheduler, then `scene.add(nodeModel)` (`AINodes.js:832`, `AINodes.js:1344`) | canonical (adds metadata, ensures `userData.nodeId`, then registers)
`AINodeModel.js` | various `create*Node` helpers | yes (sub‑root) | each helper creates an inner `nodeRoot` (`new THREE.Group()`) and adds it under the canonical `nodeModel` group (`AINodeModel.js:42`) | low (only internal child groups, no extra scene additions)

**Registration Paths**
file | line | operation | risk
--- | --- | --- | ---
`AINodes.js` | 249 | `registerNodeRoot` ensures `this.nodes` contains latest root by replacing entries with the same `nodeId` | canonical (single authoritative list) (`AINodes.js:249`)
`AINodes.js` | 272 | `this.nodes` initialized as `[]` and cleared in `dispose()` before reuse (`AINodes.js:272`, `AINodes.js:3116`) | canonical reset per instance
`AINodes.js` | 2781 | `ensureRootNodeIdentity` + `registerNodeRoot(newNode, this.nodes)` after bootstrapping visual state ensures nodes list and metadata align (`AINodes.js:2781`) | canonical (single write)
`AINodes.js` | 2845 | `nodeRegistry.set(registryKey, newNode)` (duplicated block at `AINodes.js:2872`) records unique archetypes without touching `this.nodes` | low (Map overwrite but duplicated logging; no double registration)
`AINodes.js` | 3116 | `dispose()` removes scene children, clears `this.nodes`, `connections`, `materializingNodes`, and calls `this.nodeRegistry.clear()` | cleanup ensures no leaked registrations (`AINodes.js:3116`)

**Scene Add Paths**
- `AINodes.js:1344` is the only place a node root (the `nodeModel` from `EnhancedNodeModels.create`) is permanently added to the scene; everything else (`scene.add(line)` at `AINodes.js:1482`, `scene.add(pulse)` at `AINodes.js:1967`, and warm‑up `scene.add(node)` inside `NodeLinkingSystem.js:6755`) either targets lower‑level visuals or is removed immediately, so no secondary node roots are injected.

**World / Mode Recreation Risks**
- `main.js:createAINodes()` resets `nodeSpawnRegistry` (`main.js:4803`), builds a fresh `AINodes`, wires the effect orchestrator, visual hierarchy correction, and handshakes with linking/metrics systems before enabling dynamic spawning (`main.js:4785-4883`), so only one `AINodes` lifecycle exists per world load.
- Switching worlds disposes linking and node systems (`main.js:7389-7394`) and the earlier `AINodes.dispose()` call strips each node from the scene, clears geometries/materials, and empties both `this.nodes` and `nodeRegistry` (`AINodes.js:3116-3137`), leaving no stale node roots behind.
- `WorldRuntime_v1.initInitialWorld()` still defers to `game.createAINodes()` (`WorldRuntime_v1.js:72-85`), so even runtime-driven reloads reuse the same canonical spawn pipeline.

**High-Risk Systems**
- `ArchetypeVisualIntegrationPatch_v1.js` – create nodes? NO (wrapping `aiNodes.createNode` and letting the original pipeline build the root at `Archetype…:56-69`); clones? NO; replaces roots? NO; re-registers? NO; touches `this.nodes`? NO.
- `_SIMULATION_INVARIANT_ENFORCEMENT.js` – create nodes? NO (only inspects `this.aiNodes.nodes`, validating entries at `SIM…:40-58`); clones/replaces/re-registers? NO; only reads registry and records update ticks (`SIM…:71-189`).
- `_TASK_3_RARE_NODE_VERIFICATION.js` – create nodes? NO (tracking/verification of existing nodes and rare metadata at `TASK_3…:1-122`); clones/replacements? NO; re-registers? NO; only reads `aiNodes.nodes` to verify metrics and shells.

**Conclusion**
- Root cause hypothesis: **Multiple spawn entry points** – the canonical `spawnNode` is invoked not just from its own scheduler but also from `onLinkCreated` (`AINodes.js:3002`), density checks (`AINodes.js:3032`), the mythic ritual (`_MythicNodeCreation.js:775`), the rare node spawner (`_RareNodeSpawner.js:202`), and even console tests (`SpawnAuthorityConsoleAPI.js:81`), creating many parallel triggers that can grow `this.nodes` faster than the scene count is reconciled.
- Canonical Architecture Recommendation: only `AINodes.spawnNode` (and, during world load, `createAINodes`) should create/register node roots; every other system must call that method (not push directly into `this.nodes`, register manually, or add to the scene) so metadata, `nodeId`, and `nodeRegistry` stay synchronized.

Next steps:
1. Instrument `this.nodes.length` vs. the count of `scene.children` whose `userData.isNodeRoot` is true after each spawn/link event to see exactly which trigger creates unmatched entries.
2. Audit any `spawnNode` wrappers (VisualLock auto-register, NodeHierarchyBridge, HitProxyAutoRegistrar, etc.) to confirm they only observe/augment and never mutate `this.nodes`/`nodeRegistry` or inject their own roots.