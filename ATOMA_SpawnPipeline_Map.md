# ATOMA Spawn Pipeline – Full Map

**Audit Date:** 2026-02-23  
**Audit Type:** Static Read-Only  
**Scope:** Full Node Spawn Pipeline from trigger to scene.add  
**Constraint:** Facts only, no refactoring suggestions

---

## Entry Points

### World Init Entry Points

| File | Function | Line Reference | When Called |
|------|-----------|-----------------|--------------|
| main.js | `createAINodes(reason)` | ~ | World initialization, before createWorld() |
| main.js | `AINodes.createNodes(environment, count)` | Called within createAINodes | Batch spawn during init |
| main.js | `AINodes.setSpawnMode('RUNTIME')` | After createNodes | Transition to runtime spawning |

### Runtime Entry Points

| File | Function | Line Reference | When Called |
|------|-----------|-----------------|--------------|
| AINodes.js | `spawnNode(category, position, forceArchetype)` | Line ~1730 | Runtime spawning, link events, density checks |
| AINodes.js | `spawnMythicNode(position)` | Line ~2620 | Explicit mythic spawn request |
| AINodes.js | `spawnPrimeNode(position)` | Line ~2628 | Explicit prime spawn request |
| AINodes.js | `spawnErrorNode(position)` | Line ~2636 | Explicit error spawn request |
| AINodes.js | `spawnExtremeNode(position)` | Line ~2644 | Explicit extreme spawn request |
| AINodes.js | `spawnArchetype(archetypeName, position)` | Line ~2653 | Spawn specific archetype by name |
| AINodes.js | `onLinkCreated()` | Line ~2700 | Called when link is created (20% chance to spawn) |

### Init Entry Points

| File | Function | Line Reference | When Called |
|------|-----------|-----------------|--------------|
| AINodes.js | `createAINodes(reason)` | Line ~ | Initial system bootstrap |
| AINodes.js | `createNodes(environment, count)` | Line ~ | Bulk spawn for initial node count (15 nodes by default) |

---

## Execution Flow

### Main Flow: createAINodes → createNodes → scene.add

```
World Init
  ↓
main.js: createAINodes(reason)
  ↓
AINodes constructor initialization
  ↓
AINodes.setSpawnMode('INIT')
  ↓
AINodes.createNodes(environment, count)
  ↓
[For each position in batch]
  ↓
Category Selection (random or special 10% chance)
  ↓
EXTREME SPAWN SYSTEM v1.0 (15% chance)
  ↓
UNIQUE SPAWN CHECK (uniqueSpawnService)
  ↓
AINodes.createNode(category, position, index, isSpecial, options)
  ↓
EnhancedNodeModels.create(category, visualCode, color)
  ↓
NODE_VISUAL_REGISTRY lookup → factory execution
  ↓
AINodes._finalizeSpawnedNode(node, category, position)
  ↓
scene.add(node)
  ↓
AINodes.setSpawnMode('RUNTIME')
```

### Runtime Flow: spawnNode → scene.add

```
Runtime Spawn Trigger (link event / density check / manual)
  ↓
AINodes.spawnNode(category, position, forceArchetype)
  ↓
SpawnMode Check (must be 'RUNTIME')
  ↓
_spawnFromUpdate Flag Check (must be true)
  ↓
ATOMA_ALLOW_DIRECT_SPAWN Check
  ↓
CATEGORY VALIDATION
  ├─ validateCategory(requestedCategory)
  ├─ Category whitelist check (SAFE_CATEGORIES)
  └─ Redirect to 'input' if invalid
  ↓
UNIQUE SPAWN CHECK
  ├─ uniqueSpawnService.makeKey({category, archetype, forceArchetype, registryKeyMode})
  └─ uniqueSpawnService.check({key, nodes, nodeRegistry, fallbackNodeId})
  ↓
POSITION RESOLUTION
  ├─ spawnPos = position || findSafeSpawnLocation()
  └─ Safe location within spawn range (15-55 units from player)
  ↓
CANONICAL CATEGORY ENFORCEMENT
  ├─ Check against EnhancedNodeModel categories
  ├─ Apply hard fallback to 'input' if unknown
  └─ Canonical enforcement (avoid INPUT domination)
  ↓
VISUAL CODE SELECTION
  ├─ CATEGORY_POOLS[category] access
  ├─ Per-category counter (_variantCounterByCategory[category])
  ├─ Index calculation: counter % pool.length
  └─ selectedVisualCode = pool[idx]
  ↓
FACTORY READINESS CHECK
  ├─ EnhancedNodeModels.ensureRegistryReady()
  ├─ THREE.js availability check
  └─ Registry validation
  ↓
EnhancedNodeModels.create(category, visualCode, color)
  ↓
REGISTRY LOOKUP
  ├─ NODE_VISUAL_REGISTRY[visualCode] access
  ├─ Get factoryName from registry entry
  └─ Resolve factory function (bind to EnhancedNodeModels or external modules)
  ↓
FACTORY EXECUTION
  ├─ factoryFn(nodeGroup, resolvedVisualCode, color)
  ├─ Category-specific builder execution:
  │   ├─ Input: createInputSignalReceptor, createInputDataGateway, createInputIncomingFunnel
  │   ├─ Process: createProcessFluxChamber, createProcessTransformationSpine, createProcessConversionOrbit
  │   ├─ Integration: createKnotTrefoil, createKnotFigureEight, etc.
  │   ├─ Analytics: createAnalyticsNode2, createAnalyticsNode3, createAnalyticsObserverLens, etc.
  │   ├─ Storage: createStorageNode0, createStorageNode1, createStorageNode3, etc.
  │   ├─ Control: createAxiomCrystalNode, createControlNode0-2, etc.
  │   ├─ Quantum/Sigma: createSigmaNode0-3, createExtremeIntegration1
  │   ├─ Mythic: createMythicShardClusterNode, createMythicBrokenMonolithNode, etc.
  │   ├─ Prime: createPrimeNestedIcosahedronNode, createPrimePerfectDodecahedronNode, etc.
  │   ├─ Error: createErrorIntersectingSolidsNode, createErrorInvertedNormalsNode, etc.
  │   └─ Emotional: createEmotionalNode (v2 pipeline)
  ↓
NODE BUILDS THREE.Group hierarchy with meshes/materials
  ↓
POST-CREATION NODE SETUP (in createNode)
  ├─ nodeModel.userData assignment (category, visualCode, factoryName, index, etc.)
  ├─ Node scaling (scale.setScalar(0.9))
  ├─ Position assignment
  ├─ Overlay duplication guard initialization
  ├─ EXTREME status application (if applicable)
  ├─ EnhancedNodeModel binding metadata
  ├─ Node root protection (userData.isNodeRoot = true)
  ↓
VISUAL INTEGRITY VALIDATION
  ├─ validateNodeVisualIntegrity(root) - mesh/material/geometry checks
  ├─ hasRenderableVisual() check
  ├─ purgeForbiddenNodePrimitives() - disallow SphereGeometry, IcosahedronGeometry, etc.
  ↓
INTERACTION AUTHORITY ENFORCEMENT
  ↓
Node Raycast Discipline (_enforceNodeRaycastAuthority)
  ├─ Disable raycasting on visual-only meshes (auras, shells, particles, etc.)
  ├─ Mark visual meshes: userData.visualLayer = 'AURA' | 'SHELL' | 'VFX_ONLY'
  ↓
FREEZE NODE CORE STATE
  ↓
FINALIZE SPAWNED NODE
  ├─ Visibility ensure (node.visible = true, node.frustumCulled = false)
  ├─ Scale validation (NaN/finite checks)
  ├─ Layer mask fix (ensure mask != 0)
  ├─ Visual integrity gate (meshCount, materialless, geometryless)
  ↓
SCENE ATTACHMENT
  ├─ if (!node.parent && this.scene) { this.scene.add(node) }
  ↓
REGISTRY INSERTION
  ├─ registerNodeRoot(node)
  ├─ this.nodes.push(node)
  ├─ this.nodesMap.set(nodeId, node)
  └─ nodeRegistry.set(registryKey, node) (if applicable)
  ↓
POST-SPAWN OBSERVERS
  ├─ _runPostSpawnObservers(finalizedNode, {source, category, position, archetype, ...})
  ├─ visual-authority-runtime.applyBaseline()
  ├─ onNodeSpawn() (metrics initialization)
  └─ NodeSpawnLogger.logSpawn() (v4.0 logging)
  ↓
MATERIALIZE ANIMATION (fade in)
  ↓
DEFERRED LINK CREATION
  ├─ pendingLinkJobs.push({newNodeId, startIndex: 0, linksCreated: 0})
  └─ Links created in _processLinkJobs() on subsequent frames
```

---

## File Responsibility Table

| Stage | File | Function | Responsibility |
|-------|------|----------|---------------|
| **Spawn Init** | main.js | `createAINodes(reason)` | World init entry, triggers AINodes system creation |
| **Spawn Init** | main.js | `AINodes.createNodes()` | Calls createNode in loop for initial node count |
| **Spawn Mode Gate** | AINodes.js | `setSpawnMode(mode)` | Controls INIT/RUNTIME/DISABLED spawn states |
| **Spawn Trigger** | AINodes.js | `spawnNode(category, position, forceArchetype)` | Main runtime spawn entry point |
| **Spawn Trigger** | AINodes.js | `onLinkCreated()` | Link-based spawn trigger (20% chance) |
| **Special Spawn** | AINodes.js | `spawnMythicNode()`, `spawnPrimeNode()`, `spawnErrorNode()` | Specialized archetype spawn wrappers |
| **Category Validation** | AINodes.js | `validateCategory(requestedCategory)` | Validates against SAFE_CATEGORIES, redirects invalid |
| **Unique Spawn Check** | AINodes.js | `uniqueSpawnService.makeKey()`, `uniqueSpawnService.check()` | Enforces single-instance archetypes (Mythic, Prime, Extreme) |
| **Position Resolution** | AINodes.js | `findSafeSpawnLocation()` | Finds safe spawn location away from geometry/overlap |
| **Category Enforcement** | AINodes.js | (in spawnNode) | Ensures category exists in EnhancedNodeModel, applies fallback |
| **Pool Access** | AINodes.js | `CATEGORY_POOLS[category]` | Provides array of visual codes for category |
| **Visual Code Selection** | AINodes.js | `_variantCounterByCategory[category]` | Deterministic counter per category for variant rotation |
| **Factory Readiness** | EnhancedNodeModels.js | `ensureRegistryReady()` | Ensures THREE.js and factory registry are initialized |
| **Registry Lookup** | NodeVisualRegistry.js | `NODE_VISUAL_REGISTRY[visualCode]` | Maps visual codes to factory names |
| **Factory Resolution** | EnhancedNodeModels.js | `resolveFactory(registryEntry.factoryName)` | Binds factory function name to actual implementation |
| **Model Creation** | EnhancedNodeModels.js | `create(category, visualToken, color)` | Main factory entry, routes to category-specific builders |
| **Input Builders** | EnhancedNodeModels.js | `createInputSignalReceptor`, `createInputDataGateway`, `createInputIncomingFunnel`, `createInputSensory_*` | Creates INPUT category visuals |
| **Process Builders** | EnhancedNodeModels.js | `createProcessFluxChamber`, `createProcessTransformationSpine`, `createProcessConversionOrbit`, `ProcessEnhancedVariants` | Creates PROCESS category visuals |
| **Integration Builders** | EnhancedNodeModels.js | `createKnotTrefoil`, `createKnotFigureEight`, `createKnotChaotic`, `createKnotBorromean`, etc., `IntegrationEnhancedVariants` | Creates INTEGRATION category visuals (knots) |
| **Analytics Builders** | EnhancedNodeModels.js | `createAnalyticsNode2`, `createAnalyticsNode3`, `createAnalyticsObserverLens`, `createAnalyticsFractalEcho`, etc., `AnalyticsEnhancedVariants` | Creates ANALYTICS category visuals |
| **Storage Builders** | EnhancedNodeModels.js | `createStorageNode0`, `createStorageNode1`, `createStorageNode3`, `createStorageMnemonicVault`, etc., `StorageEnhancedVariants`, `StorageNodesVisual` | Creates STORAGE category visuals |
| **Control Builders** | EnhancedNodeModels.js | `createAxiomCrystalNode`, `createControlNode0-2`, `createControlCommandPyramid`, etc., `ControlEnhancedVariants`, `ControlNodeSpecialGovernors` | Creates CONTROL category visuals |
| **Quantum Builders** | EnhancedNodeModels.js | `createQuantumNodeStyled_v2` | Creates QUANTUM category visuals (v2 pipeline, superposition) |
| **Sigma Builders** | EnhancedNodeModels.js | `createSigmaNodeStyled_v2` | Creates SIGMA category visuals (reuses quantum geometries) |
| **Mythic Builders** | EnhancedNodeModels.js | `createMythicNodeStyled_v2` | Creates MYTHIC category visuals (fractured relics) |
| **Prime Builders** | EnhancedNodeModels.js | `createPrimeNodeStyled_v2` | Creates PRIME category visuals (perfect axioms) |
| **Error Builders** | EnhancedNodeModels.js | `createErrorNodeStyled_v2` | Creates ERROR category visuals (frozen corruption) |
| **Emotional Builders** | EnhancedNodeModels.js | `createEmotionalNodeStyled_v2` | Creates EMOTIONAL category visuals (crystalline organics) |
| **Node Setup** | AINodes.js | `createNode(category, position, index, isSpecial, options)` | Post-creation node metadata assignment, scaling, overlays |
| **Visual Integrity** | AINodes.js | `validateNodeVisualIntegrity(root)`, `hasRenderableVisual(root)` | Checks meshes, materials, geometry validity |
| **Primitive Purge** | AINodes.js | `purgeForbiddenNodePrimitives(visualRoot)` | Removes forbidden geometries (SphereGeometry, etc.) |
| **Raycast Authority** | AINodes.js | `_enforceNodeRaycastAuthority(node)` | Disables raycasting on visual-only meshes |
| **Core Freeze** | AINodes.js | `freezeNodeCoreState(node)` | Freezes core mesh material properties |
| **Render Order Lock** | AINodes.js | (in createNode) - Sets renderOrder for core meshes | Ensures cores render above auras/links |
| **Finalization** | AINodes.js | `_finalizeSpawnedNode(node, category, position, options)` | Ensures visibility, attaches to scene, registers node |
| **Scene Addition** | AINodes.js | `this.scene.add(node)` (in _finalizeSpawnedNode) | Adds node to THREE.js scene |
| **Registry Insertion** | AINodes.js | `registerNodeRoot(node)` (in _finalizeSpawnedNode) | Adds to nodes array and nodesMap |
| **Unique Registry** | UniqueSpawnRegistry.js | `uniqueSpawnService.register()` | Tracks single-instance archetypes |
| **Node Spawn Registry** | NodeSpawnRegistry.js | `nodeSpawnRegistry.registerSpawn()` | Tracks all spawned nodes for debugging |
| **Spawn Logger** | _NodeSpawnLogger4_0.js | `NodeSpawnLogger.logSpawn()` | Logs spawn events with full validation (v4.0) |
| **Metrics Init** | src/metrics/NodeMetricEngine.js | `initNodeMetrics(node)`, `onNodeSpawn(node)` | Initializes node metrics |
| **Post-Spawn Observers** | AINodes.js | `_runPostSpawnObservers(node, context)` | Runs registered post-spawn callbacks (visual authority, etc.) |
| **Visual Bootstrap** | _NodeVisualBootstrap3_0.js | `bootstrapNode(node, category, archetype)` | Queued heavy visual work for spread across frames |
| **Materialization** | AINodes.js | `materializeNode(node)` | Fade-in animation for newly spawned nodes |
| **Link Creation** | AINodes.js | `createNodeConnections()` | Creates connections between nearby nodes |
| **Deferred Links** | AINodes.js | `_processLinkJobs()` | Processes pending link creation jobs |

---

## Failure / Exit Points

### Early Returns / Guards

| Location | Condition | Result | Counter Incremented |
|----------|-----------|--------|----------------------|
| AINodes.js:spawnNode() | `this.spawnMode !== 'RUNTIME'` | return null (block spawn) | `spawnNodeAbort` (implicit) |
| AINodes.js:spawnNode() | `!this._spawnFromUpdate` | return null (illegal spawn call) | `spawnNodeAbort` (implicit) |
| AINodes.js:spawnNode() | `!allowDirect` (ATOMA_ALLOW_DIRECT_SPAWN) | return null (block spawn) | `spawnNodeAbort` (implicit) |
| AINodes.js:spawnNode() | `validatedCategory === null` | return null (compliance gate failure) | `spawnNodeAbort.compliance_null` |
| AINodes.js:spawnNode() | `!decision.allowed` (unique spawn check) | return existing node or null | `spawnNodeAbort.unique_denied` |
| AINodes.js:spawnNode() | `!hasCanonicalVisual` (empty pool) | return null (no visual registered) | `spawnNodeAbort.missing_visual` |
| AINodes.js:spawnNode() | `EnhancedNodeModels.create()` throws | return false (VISUAL_THROW) | `spawnNodeAbort.VISUAL_THROW` |
| AINodes.js:spawnNode() | `newNode === null` (createNode returned null) | return false (CREATE_NODE_NULL) | `spawnNodeAbort.createNode_null` |
| AINodes.js:spawnNode() | `finalized === null` | return false (FINALIZE_NULL) | `spawnNodeAbort.finalize_null` |
| AINodes.js:createNode() | `!this.ensureFactoriesReady()` | return null (FACTORY_MISSING) | spawnMode = 'PAUSED_FACTORY_MISSING' |
| AINodes.js:createNode() | `!EnhancedNodeModels` | return null (THREE unavailable) | - |
| AINodes.js:createNode() | `finalVisualCode == null` | return null (NULL_VISUAL_CODE) | spawnMode = 'PAUSED_FACTORY_MISSING' |
| AINodes.js:createNode() | `nodeModel = null` (factory returned null) | return null (CREATE_RETURNED_NULL) | - |
| AINodes.js:createNode() | `!hasRenderableVisual(nodeModel)` | return null (no renderables) | finalizeNull.zero_renderables |
| AINodes.js:createNode() | `purgeResult.removed > 0` with visual rejection | return null (visual rejected) | finalizeNull (visual rejection) |
| AINodes.js:createNode() | `renderableCount === 0` (no children) | return null (no children) | finalizeNull.no_children |
| AINodes.js:createNode() | `visualFailed === true` (factory marked failed) | return null (visual failed) | - |
| AINodes.js:createNode() | `meshCount === 0` (analytics special case) | return null (no mesh) | - |

### CreateNodes Path Specific Exits

| Location | Condition | Result | Counter Incremented |
|----------|-----------|--------|----------------------|
| AINodes.js:createNodes() | `this.spawnMode !== 'INIT'` | return (skip batch) | `createNodesSkip` |
| AINodes.js:createNodes() | `!decision.allowed` (unique spawn) | return (skip node) | `spawnNodeAbort.unique_denied` |
| AINodes.js:createNodes() | `!node` (createNode returned null) | return (skip node) | `spawnNodeAbort.createNode_null` |
| AINodes.js:createNodes() | `!finalized` | return (skip node) | `spawnNodeAbort.finalize_null` |

### Try/Catch Blocks

| Location | Exception Type | Behavior |
|----------|---------------|----------|
| AINodes.js:spawnNode() | try/catch around `createNode()` | Catches factory throws, increments `spawnNodeAbort.VISUAL_THROW`, returns false |
| AINodes.js:spawnNode() | try/catch around `_finalizeSpawnedNode()` | Catches finalization errors, increments `spawnNodeAbort.VISUAL_THROW`, returns false |
| EnhancedNodeModels.js:create() | try/catch around `factoryFn()` | Catches factory builder errors, logs `[NodeVisualAbort]`, returns null |

### Mode-Based Exits

| Mode | Behavior |
|------|----------|
| 'INIT' | Allows createNodes(), blocks spawnNode() |
| 'RUNTIME' | Allows spawnNode(), blocks createNodes() |
| 'DISABLED' | Blocks all spawning |
| 'PAUSED_FACTORY_MISSING' | Blocks spawning until factories are ready |

---

## Final Pipeline Diagram

```
WORLD INIT PATH
═══════════════
main.js: createAINodes(reason)
  ↓
AINodes: constructor(scene, player, variantEngine)
  ├─ Initialize arrays: nodes, nodesMap, connections
  ├─ Initialize spawn state: spawnMode = 'INIT'
  ├─ Initialize visual bootstrap
  ├─ Initialize aura LOD culling
  ├─ Initialize EXTREME systems (archetypes)
  ├─ Initialize category pools
  ├─ Initialize unique spawn registry
  └─ Register post-spawn observers
  ↓
main.js: AINodes.createAINodes(reason)
  ├─ Patch AINodes.createNode for auto-registration
  └─ aiNodes.createNodes(currentMode, nodeCount)
  ↓
AINodes: createNodes(environment, count)
  ├─ SpawnMode check: if (spawnMode !== 'INIT') return
  ├─ Get positions: getNodePositions(environment, count)
  └─ For each position:
      ├─ Category selection (random or special 10%)
      ├─ EXTREME SPAWN chance (15%)
      ├─ UNIQUE SPAWN check (archetype level)
      ├─ createNode(category, pos, index, isSpecial, options)
      ├─ _finalizeSpawnedNode(node, category, pos)
      ├─ _runPostSpawnObservers(...)
      ├─ NodeSpawnLogger.logSpawn(...)
      └─ nodeSpawnRegistry.registerSpawn(...)
  ↓
AINodes: createNodeConnections()
  ├─ For each node pair:
  │   ├─ Calculate distance
  │   └─ If < connectionDistance: createConnection(node1, node2)
  └─ createConnection() adds line to scene
  ↓
AINodes: setSpawnMode('RUNTIME')
  ↓
[Transition to RUNTIME MODE]


RUNTIME SPAWN PATH
═══════════════════
[Trigger: link event / density check / manual spawn]
  ↓
AINodes: spawnNode(category, position, forceArchetype)
  ├─ SpawnMode check: if (spawnMode !== 'RUNTIME') return null
  ├─ _spawnFromUpdate flag check: if (!this._spawnFromUpdate) return null
  └─ ATOMA_ALLOW_DIRECT_SPAWN check
  ↓
CATEGORY VALIDATION
  ├─ validateCategory(requestedCategory)
  │   ├─ Check SAFE_CATEGORIES (11 categories)
  │   ├─ Redirect to 'input' if invalid
  │   └─ Apply legacy node model filter
  └─ validatedCategory = final category
  ↓
UNIQUE SPAWN CHECK
  ├─ uniqueSpawnService.makeKey({category, archetype, forceArchetype, registryKeyMode})
  ├─ uniqueSpawnService.check({key, nodes, nodeRegistry, fallbackNodeId})
  └─ if (!decision.allowed): return existing node or null
  ↓
POSITION RESOLUTION
  ├─ spawnPos = position || findSafeSpawnLocation()
  └─ findSafeSpawnLocation():
      ├─ Generate random position in spawn range
      ├─ Check distance to player (min 5 units)
      ├─ Check overlap with existing nodes (min 2 units)
      ├─ Raycast downward for geometry collision
      └─ Return safe position
  ↓
CANONICAL CATEGORY ENFORCEMENT
  ├─ Check category against EnhancedNodeModel categories
  ├─ Apply hard fallback to 'input' if unknown
  └─ Canonical enforcement (avoid INPUT domination)
  ↓
VISUAL CODE SELECTION
  ├─ CATEGORY_POOLS[category] access
  ├─ Per-category counter (_variantCounterByCategory[category])
  ├─ Index calculation: counter % pool.length
  └─ selectedVisualCode = pool[idx]
  ↓
FACTORY READINESS CHECK
  ├─ EnhancedNodeModels.ensureRegistryReady()
  ├─ THREE.js availability check
  └─ Registry validation
  ↓
EnhancedNodeModels: create(category, visualCode, color)
  ├─ Resolve visualCode from pool
  ├─ Lookup NODE_VISUAL_REGISTRY[visualCode]
  └─ Get factoryName from registry entry
  ↓
FACTORY RESOLUTION
  ├─ resolveFactory(registryEntry.factoryName)
  └─ Bind to EnhancedNodeModels or external modules:
      ├─ InputSensoryEnhanced (input sensory)
      ├─ ProcessEnhancedVariants (process enhanced)
      ├─ IntegrationEnhancedVariants (integration enhanced)
      ├─ AnalyticsEnhancedVariants (analytics enhanced)
      ├─ StorageEnhancedVariants (storage enhanced)
      ├─ ControlEnhancedVariants (control enhanced)
      ├─ ControlNodeSpecialGovernors (control special)
      └─ StorageNodesVisual (storage nodes)
  ↓
FACTORY EXECUTION
  ├─ factoryFn(nodeGroup, color)
  ├─ Create THREE.Group hierarchy
  ├─ Build category-specific geometry:
  │   ├─ INPUT: Signal receptors, data gateways, incoming funnels
  │   ├─ PROCESS: Flux chambers, transformation spines, conversion orbits
  │   ├─ INTEGRATION: Trefoil knots, figure-eights, chaotic knots
  │   ├─ ANALYTICS: Node stacks, observer lenses, fractal echoes
  │   ├─ STORAGE: Memory pillars, mnemonic vaults, archive spindles
  │   ├─ CONTROL: Axiom crystals, hierarchy towers, command pyramids
  │   ├─ QUANTUM: Superposition fractures, phase planes, quantum dust
  │   ├─ SIGMA: Minimalist harmonic cones (v2)
  │   ├─ MYTHIC: Fractured relics, broken monoliths, floating fragments (v2)
  │   ├─ PRIME: Perfect lattices, nested icosahedra, symmetry cores (v2)
  │   ├─ ERROR: Intersecting solids, inverted normals, corrupted manifolds (v2)
  │   └─ EMOTIONAL: Distorted cores, tendril shells, particle clouds (v2)
  ├─ Apply materials (MeshStandardMaterial, MeshBasicMaterial, etc.)
  ├─ Set renderOrder for proper depth layering
  └─ Return nodeModel
  ↓
POST-CREATION NODE SETUP (in createNode)
  ├─ nodeModel.userData assignment:
  │   ├─ category (final validated category)
  │   ├─ visualCode (selected visual code)
  │   ├─ factoryName (from registry)
  │   ├─ index (spawn index)
  │   ├─ isSpecial (special node flag)
  │   ├─ isExtreme (if applicable)
  │   ├─ extremeArchetype (if applicable)
  │   ├─ extremeTier (if applicable)
  │   ├─ archetype (forceArchetype or category)
  │   └─ enhancedNodeModelBinding (metadata)
  ├─ Node scaling (scale.setScalar(0.9))
  ├─ Position assignment (position.copy(pos))
  ├─ Overlay duplication guard initialization
  ├─ EXTREME status application (15% chance in runtime)
  ├─ EnhancedNodeModel binding metadata
  └─ Node root protection (userData.isNodeRoot = true)
  ↓
VISUAL INTEGRITY VALIDATION
  ├─ validateNodeVisualIntegrity(root)
  │   ├─ meshCount check
  │   ├─ materiallessMeshes check
  │   ├─ geometrylessMeshes check
  │   └─ hasLinesPoints check
  └─ hasRenderableVisual(root) check
  ↓
PRIMITIVE PURGE
  ├─ purgeForbiddenNodePrimitives(visualRoot)
  └─ Remove SphereGeometry, IcosahedronGeometry, RingGeometry, etc.
  ↓
INTERACTION AUTHORITY ENFORCEMENT
  └─ _enforceNodeRaycastAuthority(node)
      ├─ Traverse node hierarchy
      ├─ If userData.visualLayer is 'AURA' | 'SHELL' | 'VFX_ONLY'
      └─ Disable raycast: obj.raycast = () => null
  ↓
FREEZE NODE CORE STATE
  └─ freezeNodeCoreState(node)
      ├─ Lock material properties
      └─ Prevent material mutation
  ↓
RENDER ORDER LOCK
  └─ Set renderOrder for core meshes (100)
      ├─ Ensures cores render above auras/links
      └─ Lock depth properties
  ↓
FINALIZE SPAWNED NODE
  └─ _finalizeSpawnedNode(node, category, spawnPos, {registryKey})
      ├─ node.visible = true
      ├─ node.frustumCulled = false
      ├─ Scale validation (NaN/finite checks)
      ├─ Layer mask fix (ensure mask != 0)
      ├─ Visual integrity gate
      └─ SCENE ADDITION:
          ├─ if (!node.parent && this.scene)
          └─ this.scene.add(node)
      ├─ REGISTRY INSERTION:
          ├─ registerNodeRoot(node)
          ├─ this.nodes.push(node)
          ├─ this.nodesMap.set(nodeId, node)
          └─ nodeRegistry.set(registryKey, node) (if applicable)
      └─ Identity recovery from children (visualCode, factoryName, category)
  ↓
POST-SPAWN OBSERVERS
  └─ _runPostSpawnObservers(finalizedNode, {source, category, position, archetype, ...})
      ├─ visual-authority-runtime.applyBaseline(node, context)
      ├─ initNodeMetrics(finalizedNode)
      ├─ onNodeSpawn(finalizedNode)
      └─ Run all registered post-spawn observers in order
  ↓
NODE SPAWN LOGGER (v4.0)
  └─ NodeSpawnLogger.logSpawn({category, visualCode, factoryName, nodeId, source})
      ├─ Validates all spawn data
      ├─ Logs with full context
      └─ Increments diagnostic counters
  ↓
UNIQUE SPAWN REGISTRATION
  └─ uniqueSpawnService.register({key, nodeId, meta})
      ├─ Tracks single-instance archetypes (Mythic, Prime, Extreme)
      ├─ Stores metadata for upgrade pulses
      └─ Prevents duplicate spawns
  ↓
NODE SPAWN REGISTRY
  └─ nodeSpawnRegistry.registerSpawn(newNode, 'AINodes.spawnNode')
      ├─ Tracks all spawned nodes for debugging
      ├─ Records spawn source
      └─ Enables spawn history queries
  ↓
MATERIALIZE ANIMATION
  └─ materializeNode(node)
      ├─ Fade-in effect
      ├─ Registered with effectOrchestrator
      └─ Animated over ~800ms
  ↓
DEFERRED LINK CREATION
  └─ pendingLinkJobs.push({newNodeId, startIndex: 0, linksCreated: 0})
      ├─ Queued for batch processing
      ├─ Processed in _processLinkJobs()
      └─ Creates up to 8 links per node
  ↓
[Node now visible in scene and participating in simulation]


SPECIAL SPAWN PATHS
═══════════════════

MYTHIC SPAWN
AINodes: spawnMythicNode(position)
  ↓
return this.spawnNode('mythic', position, 'MYTHIC-CEREMONIAL')
  ↓
[Enters RUNTIME SPAWN PATH with category='mythic']

PRIME SPAWN
AINodes: spawnPrimeNode(position)
  ↓
return this.spawnNode('prime', position, 'PRIME-PERFECT')
  ↓
[Enters RUNTIME SPAWN PATH with category='prime']

ERROR SPAWN
AINodes: spawnErrorNode(position)
  ↓
return this.spawnNode('error', position, 'ERROR-ANOMALY')
  ↓
[Enters RUNTIME SPAWN PATH with category='error']

EXTREME SPAWN
AINodes: spawnExtremeNode(position)
  ↓
const extremeKeys = Object.keys(this.extremeArchetypes).filter(k => k.startsWith('EXTREME-'))
const archetype = extremeKeys[Math.floor(Math.random() * extremeKeys.length)]
const baseCategory = this.extremeArchetypes[archetype]
return this.spawnNode(baseCategory, position, archetype)
  ↓
[Enters RUNTIME SPAWN PATH with category and forceArchetype]

ARCHETYPE SPAWN
AINodes: spawnArchetype(archetypeName, position)
  ↓
const baseCategory = this.extremeArchetypes[archetypeName]
return this.spawnNode(baseCategory, position, archetypeName)
  ↓
[Enters RUNTIME SPAWN PATH with category and forceArchetype]


LINK-TRIGGERED SPAWN
═════════════════════
[Trigger: Link creation event]
  ↓
AINodes: onLinkCreated()
  ├─ SpawnMode check: if (spawnMode !== 'RUNTIME') return
  ├─ isLinkSpawnEnabled() check (ATOMA_LINK_SPAWN_ENABLED)
  ├─ Cooldown check: if (currentTime - lastLinkTime < linkSpawnCooldown) return
  └─ Random chance: if (Math.random() < 0.2)
      ├─ Cap check: if (this.getNodeCount() >= cap) return
      ├─ category = this.getRuntimeSpawnCategoryIntent()
      └─ this.spawnNode(category)
  ↓
[Enters RUNTIME SPAWN PATH]


DENSITY-TRIGGERED SPAWN
═════════════════════
[Trigger: Network density monitoring]
  ↓
AINodes: checkNetworkDensityAndSpawn()
  ├─ Cap check: if (currentNodeCount >= maxTarget) return
  ├─ Identify cluster areas (3x3 grid)
  ├─ category = this.getRuntimeSpawnCategoryIntent()
  └─ this.pendingDensityIntent = category
  ↓
[Pending intent picked up in subsequent spawnNode calls]


SPECIALIZED SPAWN WRAPPERS
═══════════════════════
All specialized spawn methods (spawnMythicNode, spawnPrimeNode, spawnErrorNode, spawnExtremeNode, spawnArchetype) ultimately delegate to:
  ↓
AINodes: spawnNode(category, position, forceArchetype)
  ↓
[Enters RUNTIME SPAWN PATH with specific category and/or forceArchetype]


POOL SELECTION MECHANISM
═══════════════════════════
CATEGORY_POOLS[category] access:
  ├─ Pool is array of visual codes (e.g., [101, 102, 103, 104, 105, 106] for INPUT)
  ├─ Codes map to NODE_VISUAL_REGISTRY entries
  ├─ Each entry: {visualCode, category, factoryName}
  ├─ Per-category counter: _variantCounterByCategory[category]
  └─ Deterministic rotation: selectedVisualCode = pool[counter % pool.length]

Example for INPUT category:
  ├─ Pool: [101, 102, 103, 104, 105, 106]
  ├─ Counter starts at 0, increments each spawn
  ├─ Sequence: 101 → 102 → 103 → 104 → 105 → 106 → 101 → ...
  └─ Provides fair variant distribution


FACTORY REGISTRY LOOKUP
═══════════════════════════════════
NODE_VISUAL_REGISTRY[visualCode] lookup:
  ├─ 101: {category: 'input', factoryName: 'createInputSignalReceptor'}
  ├─ 102: {category: 'input', factoryName: 'createInputDataGateway'}
  ├─ 201: {category: 'process', factoryName: 'createProcessFluxChamber'}
  ├─ 301: {category: 'integration', factoryName: 'createKnotTrefoil'}
  ├─ 901: {category: 'mythic', factoryName: 'createMythicShardClusterNode'}
  ├─ 1001: {category: 'prime', factoryName: 'createPrimeNestedIcosahedronNode'}
  └─ 1101: {category: 'error', factoryName: 'createErrorIntersectingSolidsNode'}

Factory name resolution:
  ├─ Direct methods: EnhancedNodeModels[factoryName]
  ├─ Enhanced variants: Imported from enhanced variant modules
  └─ External modules: InputSensoryEnhanced, ProcessEnhancedVariants, etc.


V2 PIPELINE DECISIONS
══════════════════════
USE_PRIME_V2 = true
USE_MYTHIC_V2 = true
USE_ERROR_V2 = true
USE_STORAGE_V2 = true
USE_INPUT_V2 = true
USE_CONTROL_V2 = true
USE_ANALYTICS_V2 = true
USE_QUANTUM_V2 = true
USE_SIGMA_V2 = true
USE_EMOTIONAL_V2 = true

V2 advantages:
  ├─ Shared geometry caches (reduce GC)
  ├─ Shared material caches (reduce material creation)
  ├─ Optimized instanced meshes
  ├─ Better visual quality
  └─ Consistent rendering

V2 fallback to legacy if v2 builder fails.


INITIALIZATION ORDER
═════════════════════
1. THREE.js scene created
2. AINodes constructor called
3. EnhancedNodeModels.ensureRegistryReady() called
4. NODE_VISUAL_REGISTRY and CATEGORY_POOLS initialized
5. Factory registry populated
6. AINodes.createNodes() called
7. Nodes created and added to scene
8. AINodes.setSpawnMode('RUNTIME')
9. Runtime spawning enabled
```

---

## Appendix: Category Pool Reference

### INPUT (codes 101-106)
| Visual Code | Factory Name | Description |
|-------------|--------------|-------------|
| 101 | createInputSignalReceptor | Multi-directional antenna receiving incoming signals |
| 102 | createInputDataGateway | Threshold/gateway where data enters system |
| 103 | createInputIncomingFunnel | Funnel structure concentrating incoming data/signals |
| 104 | createInputSensory_TactileSensor | Enhanced variant - Tactile sensing |
| 105 | createInputSensory_EchoDetector | Enhanced variant - Echo detection |
| 106 | createInputSensory_NeuralReceptor | Enhanced variant - Neural reception |

### PROCESS (codes 201-206)
| Visual Code | Factory Name | Description |
|-------------|--------------|-------------|
| 201 | createProcessFluxChamber | Hollow asymmetric chamber with internal path |
| 202 | createProcessTransformationSpine | Sequential computation stages stacked vertically |
| 203 | createProcessConversionOrbit | Central processor with two orbiting rings |
| 204 | createProcessEnhanced_FlowRecomposer | Enhanced variant - Flow recomposer |
| 205 | createProcessEnhanced_TemporalShifter | Enhanced variant - Temporal shifter |
| 206 | createProcessEnhanced_IterativeEngine | Enhanced variant - Iterative engine |

### INTEGRATION (codes 301-310)
| Visual Code | Factory Name | Description |
|-------------|--------------|-------------|
| 301 | createKnotTrefoil | Simplest non-trivial knot, 3-fold rotational symmetry |
| 302 | createKnotFigureEight | Four-crossing knot with distinctive figure-eight shape |
| 303 | createKnotInfiniteSelfIntersecting | Complex recursive structure with self-similar intersections |
| 304 | createKnotChaotic | Self-similar chaotic structure with fractal-like properties |
| 305 | createKnotBorromean | Three mutually linked rings, topologically inseparable |
| 306 | createKnotTorusKnot | (2,3) torus knot: wraps p times meridian, q times poloidal |
| 307 | createKnotTripleHelix | Three-stranded helical structure with topological twisting |
| 308 | createExtremeInput1 | EXTREME variant - Singularity knot |
| 309 | createIntegrationEnhanced_SignalKnot | Enhanced variant - Signal knot |
| 310 | createIntegrationEnhanced_ProtocolTangle | Enhanced variant - Protocol tangle |
| 311 | createIntegrationEnhanced_ContinuityBinder | Enhanced variant - Continuity binder |

### ANALYTICS (codes 401-408)
| Visual Code | Factory Name | Description |
|-------------|--------------|-------------|
| 401 | createAnalyticsNode2 | Hexagonal disc with fractal patterns |
| 402 | createAnalyticsNode3 | Recursive insight engine with layered rings |
| 403 | createAnalyticsObserverLens | Non-physical lens that bends perception |
| 404 | createAnalyticsFractalEcho | Recursive analysis feeding back into itself |
| 405 | createAnalyticsParallaxOracle | Multi-dimensional observer interpreting from multiple angles |
| 406 | createAnalyticsEnhanced_SignalStratifier | Enhanced variant - Signal stratifier |
| 407 | createAnalyticsEnhanced_TrendExcavator | Enhanced variant - Trend excavator |
| 408 | createAnalyticsEnhanced_AnomalyLedger | Enhanced variant - Anomaly ledger |

### STORAGE (codes 501-512)
| Visual Code | Factory Name | Description |
|-------------|--------------|-------------|
| 501 | createStorageNode0 | Tall rectangular pillar with layered slices |
| 502 | createStorageNode1 | Capsule with inner bands |
| 503 | createStorageNode3 | Cluster of crystal shards |
| 504 | createStorageMnemonicVault | Protected memory core suspended inside faceted containment shell |
| 505 | createStorageArchiveSpindle | Layered data strata compressed into vertical spindle structure |
| 506 | createStorageMemoryReef | Clustered memory fragments orbiting calm central anchor |
| 507 | createStorageEnhanced_ArchiveNexus | Enhanced variant - Archive nexus |
| 508 | createStorageEnhanced_MemoryCrypts | Enhanced variant - Memory crypts |
| 509 | createStorageEnhanced_DepthLayers | Enhanced variant - Depth layers |
| 510 | createObeliskCache | Enhanced variant - Obelisk cache |
| 511 | createFractalReservoir | Enhanced variant - Fractal reservoir |
| 512 | createArchiveDrum | Enhanced variant - Archive drum |

### CONTROL (codes 601-615)
| Visual Code | Factory Name | Description |
|-------------|--------------|-------------|
| 601 | createAxiomCrystalNode | Vertical crystal monolith with sharp facets |
| 602 | createControlNode0 | Strong octagonal core with magenta rim |
| 603 | createControlNode2 | Ring-within-ring hierarchy structure |
| 604 | createControlNode1 | Sharp tetrahedral pyramid |
| 605 | createControlCommandPyramid | Tall asymmetric pyramid with radiating command beams |
| 606 | createControlHierarchyTower | Hierarchical levels of command stacked vertically |
| 607 | createControlSymmetryCore | Perfect symmetry as a control principle (four-fold rotational symmetry) |
| 608 | createExtremeControl0 | EXTREME variant - Fractured authority core |
| 609 | createControlEnhanced_DecisionFork | Enhanced variant - Decision fork |
| 610 | createControlEnhanced_AuthorityHelix | Enhanced variant - Authority helix |
| 611 | createControlEnhanced_CommandMatrix | Enhanced variant - Command matrix |
| 612 | createPhrixFlowArbiter | Special governor - Phrix flow arbiter |
| 613 | createCrucisSuppressionGovernor | Special governor - Crucis suppression governor |
| 614 | createVertexTemporalGate | Special governor - Vertex temporal gate |
| 615 | createControlNode3 | X-shaped form with beveled edges |

### QUANTUM (codes 701-704)
| Visual Code | Factory Name | Description |
|-------------|--------------|-------------|
| 701 | createSigmaNode0 | Dodecahedron base |
| 702 | createSigmaNode1 | Icosahedron base |
| 703 | createSigmaNode3 | Icosahedron base (variant) |
| 704 | createExtremeIntegration1 | EXTREME variant - Chaos core |

### MYTHIC (codes 901-906)
| Visual Code | Factory Name | Description |
|-------------|--------------|-------------|
| 901 | createMythicShardClusterNode | Cluster of ancient crystal shards |
| 902 | createMythicBrokenMonolithNode | Broken monolith with fracture lines |
| 903 | createMythicFloatingFragmentsNode | Floating fragments surrounding core |
| 904 | createMythicCrackedPrismNode | Cracked prism revealing inner light |
| 905 | createMythicAncientCoreWithMissingNode | Ancient core with missing sections |
| 906 | createMythicCollapsedCrownNode | Collapsed crown with fallen segments |

### PRIME (codes 1001-1006)
| Visual Code | Factory Name | Description |
|-------------|--------------|-------------|
| 1001 | createPrimeNestedIcosahedronNode | Nested icosahedron structure |
| 1002 | createPrimePerfectDodecahedronNode | Perfect dodecahedron (12 faces) |
| 1003 | createPrimeStellaOctangulaNode | Stella octangula (8 faces) |
| 1004 | createPrimePrecisionLatticeNode | Precision lattice of geometric perfection |
| 1005 | createPrimeTesseractProjectionNode | 4D tesseract projected to 3D |
| 1006 | createPrimeSymmetryLockedCoreNode | Symmetry-locked core |

### ERROR (codes 1101-1106)
| Visual Code | Factory Name | Description |
|-------------|--------------|-------------|
| 1101 | createErrorIntersectingSolidsNode | Two solids intersecting impossibly |
| 1102 | createErrorInvertedNormalsNode | Inverted normals creating dark void effect |
| 1103 | createErrorSelfClippingNode | Geometry clips through itself |
| 1104 | createErrorFoldedImpossibleNode | Folded into impossible 4D shape |
| 1105 | createErrorTopologyTearNode | Topology tear in spacetime |
| 1106 | createErrorCorruptedManifoldNode | Corrupted manifold structure |

### EMOTIONAL (codes 1201-1206)
| Visual Code | Factory Name | Description |
|-------------|--------------|-------------|
| 1201-1206 | createEmotionalNode | Crystalline organic emotional nodes (v2 pipeline) |

---

**End of Audit**