# ATOMA SPAWN AUTHORITY MAP AUDIT
**PHASE: READ-ONLY | MODE: NO FILE MODIFICATIONS**
**Generated: 2026-02-28**

---

## EXECUTIVE SUMMARY

The ATOMA spawn system is a **WRAPPED CENTRALIZED** architecture with significant validation duplication and registry proliferation. The system maintains spawn authority through multiple overlapping validation gates and registry systems, creating complexity but ensuring robust safety checks.

**Key Findings:**
- **6 distinct spawn entry points** with different trigger types
- **3 separate validation gates** (SpawnAuthorityComplianceGate, validateCategory, SpawnCycleValidator)
- **5 registry systems** tracking node existence and uniqueness
- **Centralized scene attachment** in `_finalizeSpawnedNode()`
- **Multiple fallback mechanisms** defaulting to 'input' category
- **Single canonical identity** (`nodeId`) with legacy compatibility layer

---

## STEP 1 — SPAWN ENTRY POINTS

| Entry Point | File | Function | Trigger Type | Direct or Indirect? |
|------------|------|----------|--------------|---------------------|
| createNodes | AINodes.js | createNodes(environment, count) | Time-based / Initialization | Direct |
| spawnNode | AINodes.js | spawnNode(category, position, forceArchetype) | Runtime spawn via queue | Indirect (requires token) |
| onLinkCreated | AINodes.js | onLinkCreated() | Event-based (link creation) | Indirect (via requestSpawn) |
| checkNetworkDensityAndSpawn | AINodes.js | checkNetworkDensityAndSpawn() | Density-based monitoring | Indirect (via requestSpawn) |
| spawnMythicNode | AINodes.js | spawnMythicNode(reason) | External API call | Indirect (via requestSpawn) |
| spawnPrimeNode | AINodes.js | spawnPrimeNode(reason) | External API call | Indirect (via requestSpawn) |
| spawnErrorNode | AINodes.js | spawnErrorNode(reason) | External API call | Indirect (via requestSpawn) |
| spawnExtremeNode | AINodes.js | spawnExtremeNode(reason) | External API call | Indirect (via requestSpawn) |
| spawnArchetype | AINodes.js | spawnArchetype(archetypeName) | External API call | Indirect (via requestSpawn) |

**Entry Point Analysis:**
- **Time-based:** `createNodes()` during initialization
- **Event-based:** `onLinkCreated()` (20% chance), `checkNetworkDensityAndSpawn()`
- **External API:** 6 specialized spawn methods (`spawnMythicNode`, `spawnPrimeNode`, etc.)
- **Request Queue:** All runtime spawns funnel through `requestSpawn()` → `_processSpawnRequests()` → `spawnNode()`
- **Token Guard:** `spawnNode()` requires `_spawnUpdateToken` to execute

---

## STEP 2 — SPAWN FLOW PIPELINE (CANONICAL PATH)

**Canonical Execution Order:**

| Step Order | Function | File | Responsibility | Mutates Node? |
|------------|----------|------|-----------------|----------------|
| 1 | `requestSpawn()` | AINodes.js | Queue spawn request | No |
| 2 | `_processSpawnRequests()` | AINodes.js | Dequeue and validate token | No |
| 3 | `spawnNode()` | AINodes.js | Main spawn orchestration | Yes (creates) |
| 4 | `spawnAuthorityComplianceGate.validateSpawnRequest()` | SpawnAuthorityComplianceGate.js | Compliance check (observation mode) | No |
| 5 | `validateCategory()` | AINodes.js | Category whitelist validation | No |
| 6 | `ensureFactoriesReady()` | AINodes.js | Verify EnhancedNodeModel availability | No |
| 7 | `uniqueSpawnService.check()` | UniqueSpawnService.js | Uniqueness enforcement | No |
| 8 | `createNode()` | AINodes.js | Create node geometry and visual | Yes |
| 9 | `EnhancedNodeModels.create()` | EnhancedNodeModels.js | Visual factory invocation | Yes |
| 10 | `spawnCycleValidator.validateCategory()` | SpawnCycleValidator.js | Secondary category validation | No |
| 11 | `spawnAuthorityComplianceGate.validateSpawnedNode()` | SpawnAuthorityComplianceGate.js | Post-spawn compliance check | No |
| 12 | `SafeMetricsDNAIntegration1_0.attachMetrics()` | SafeMetricsDNAIntegration1_0.js | Attach metrics metadata | Yes |
| 13 | `_finalizeSpawnedNode()` | AINodes.js | Scene attachment and registration | Yes |
| 14 | `registerNodeRoot()` | AINodes.js | Add to nodesMap and nodes array | Yes |
| 15 | `uniqueSpawnService.register()` | UniqueSpawnService.js | Register unique archetype | Yes |
| 16 | `_runPostSpawnObservers()` | AINodes.js | Execute registered observers | Yes |
| 17 | `materializeNode()` | AINodes.js | Visual fade-in animation | Yes |

**Pipeline Detection Summary:**
- ✅ **Duplicate validation:** Category validated in 3 places (steps 5, 10, 11)
- ✅ **Fallback logic:** Multiple fallback to 'input' when category invalid
- ✅ **Category coercion:** INPUT bypass enforcement when other canonical options exist
- ✅ **Extreme overrides:** EXTREME spawn chance (15%) during runtime

---

## STEP 3 — IDENTITY AUTHORITY MAP

| Identity Field | Generator | File | Overwrites? | Canonical? |
|----------------|-----------|------|-------------|------------|
| `nodeId` | `EnhancedNodeModels.create()` | EnhancedNodeModels.js | No (throws if missing) | **YES** |
| `uuid` | THREE.js (automatic) | Three.js core | No | Legacy fallback |
| `userData.id` | Mirror of nodeId | AINodes.js (spawnNode, _finalizeSpawnedNode) | Yes (mirrored from nodeId) | Legacy compatibility |
| `userData.nodeId` | EnhancedNodeModels.create() + fallback generation | AINodes.js (createNode, spawnNode, _finalizeSpawnedNode) | Yes (self-heal fallback) | **YES** |
| `userData.archetype` | Force parameter or category | AINodes.js (spawnNode) | Yes | No (derived) |
| `userData.visualCode` | EnhancedNodeModels.create() | EnhancedNodeModels.js | Yes | Visual identity |
| `userData.factoryName` | NODE_VISUAL_REGISTRY lookup | AINodes.js (spawnNode) | Yes | Factory identity |

**Identity Authority Findings:**
- **Canonical identity:** `userData.nodeId` is the single source of truth
- **Hard lock:** System throws `[IdentityLock] Node missing canonical identity` if nodeId absent
- **Self-healing:** `_finalizeSpawnedNode()` generates fallback nodeId if missing
- **Legacy support:** `userData.id` mirrors `nodeId` for backward compatibility
- **Visual identity:** `visualCode` + `factoryName` track factory origin

---

## STEP 4 — REGISTRY MAP

| Registry | File | Write Location | Read Location | Removal Location |
|----------|------|-----------------|-----------------|------------------|
| `this.nodesMap` | AINodes.js | `registerNodeRoot()` | `createNodeConnections()`, `_linkExists()`, `dispose()` | `dispose()` |
| `this.nodes` | AINodes.js | `registerNodeRoot()` | All node iteration loops | `dispose()` |
| `this.nodeRegistry` | AINodes.js | `spawnNode()` (via options.registryKey) | Spawn uniqueness checks | `dispose()` |
| `uniqueSpawnRegistry` | UniqueSpawnRegistry.js | `uniqueSpawnService.register()` | `uniqueSpawnService.check()` | `uniqueSpawnService.releaseByNodeId()` |
| `uniqueSpawnService` | UniqueSpawnService.js | `register()` | `check()` | `releaseByNodeId()` |
| `nodeSpawnRegistry` | NodeSpawnRegistry.js | `registerSpawn()` | Audit/debug APIs | Not exposed |

**Registry Analysis:**
- **Duplicate tracking:** `nodeRegistry` and `uniqueSpawnRegistry` both track unique spawns
- **Desync risk:** Manual registry removal required in `dispose()` - potential for orphaned entries
- **World switch survival:** All registries live on AINodes instance - cleared on world switch (in `dispose()`)
- **Registry proliferation:** 5 separate systems for tracking node existence (high complexity)

---

## STEP 5 — SCENE ATTACHMENT MAP

| Object | Attached By | File | Root Group | Conditional? |
|--------|--------------|------|------------|--------------|
| Node mesh | `_finalizeSpawnedNode()` | AINodes.js | `this.scene` (direct) | Yes (checks `!node.parent`) |
| Connection lines | `createConnection()` | AINodes.js | `this.scene` (direct) | Yes (on demand) |
| Activation pulse | `createActivationPulse()` | AINodes.js | `this.scene` (direct) | Yes (on activation) |
| Visual containers | Various VFX systems | Multiple files | Node visualGroup or scene | Yes (per system) |
| Link visual FX | Link systems | LinkRenderer.ts, etc. | Link group or scene | Yes (per link) |

**Scene Attachment Analysis:**
- **Centralized:** All node attachments occur in `_finalizeSpawnedNode()` at line ~4800
- **Single attachment point:** `this.scene.add(node)` is the only node root attachment
- **Conditional attachment:** Only attaches if `!node.parent && this.scene`
- **No root groups:** Nodes attach directly to scene root (no worldRoot for nodes)
- ** scattered visual attachments:** VFX systems may attach to scene independently (links, particles, etc.)

---

## STEP 6 — FALLBACK & CATEGORY COERCION MAP

| Condition | File | Fallback Result | Silent? |
|-----------|------|-----------------|----------|
| Unsupported category in SUPPORTED_CATEGORIES | AINodes.js (createNode) | `'input'` | No (logged) |
| UNSAFE_CATEGORIES (empty list) | AINodes.js (validateCategory) | `'input'` | No (logged with reason) |
| Unknown category | AINodes.js (validateCategory) | `'input'` | No (logged with whitelist) |
| SpawnCycleValidator returns invalid | AINodes.js (createNode) | `'input'` | No (logged) |
| Empty pool for category | AINodes.js (createNode) | Fallback to `process` or `input` | No (error logged) |
| INPUT bypass when canonical available | AINodes.js (spawnNode) | Random canonical category | Yes (info log once) |
| isFallbackSpawn flag set | AINodes.js (spawnNode) | `'input'` with metadata | No (warned once) |
| LegacyNodeModelFilter blocked | AINodes.js (createNode) | `'input'` | No (filter logged) |
| Missing EnhancedNodeModel | AINodes.js (createNode, spawnNode) | Abort (null) | No (error logged) |

**Fallback Analysis:**
- **Multiple fallback paths:** 6+ distinct fallback mechanisms to 'input'
- **Silent coercion:** INPUT bypass during spawn is the only silent coercion
- **Category coercion:** Active enforcement prevents INPUT domination
- **Fallback metadata:** `isFallback`, `originalCategory`, `fallbackReason` tracked for audit
- **Single-instance fallback:** Only one fallback INPUT node allowed (reused on subsequent failures)

---

## STEP 7 — COMPLETE SPAWN FLOW DIAGRAM

```
EXTERNAL TRIGGER
   ↓
┌─────────────────────────────────────────────────────────────────┐
│ SPAWN ENTRY POINTS                                           │
│ • createNodes() - Initialization                               │
│ • onLinkCreated() - Event (20% chance)                       │
│ • checkNetworkDensityAndSpawn() - Density monitoring            │
│ • spawnMythicNode/PrimeNode/ErrorNode() - External API       │
│ • spawnExtremeNode/spawnArchetype() - External API            │
└─────────────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────────┐
│ requestSpawn({category, archetype, reason, priority})           │
│   • Queue spawn request                                      │
│   • Assign priority and timestamp                             │
└─────────────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────────┐
│ _processSpawnRequests()                                        │
│   • Sort by priority                                          │
│   • Max 1 spawn per frame                                     │
│   • Acquire _spawnUpdateToken                                 │
└─────────────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────────┐
│ spawnNode(category, position, forceArchetype)                  │
│   • Token guard: Requires _spawnUpdateToken                    │
│   • Spawn mode check: Must be 'RUNTIME'                       │
│   • Direct call blocker: ATOMA_ALLOW_DIRECT_SPAWN required     │
└─────────────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────────┐
│ SPAWN AUTHORITY COMPLIANCE GATE (Gate 1)                      │
│   spawnAuthorityComplianceGate.validateSpawnRequest()           │
│   • Observe spawn request                                      │
│   • Check EnhancedNodeModel availability                       │
│   • Validate category support (observation only)               │
│   • Validate position validity (observation only)               │
│   • ALWAYS returns category (non-blocking)                     │
└─────────────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────────┐
│ CATEGORY VALIDATION 1 (AINodes.validateCategory)               │
│   • Check against SAFE_CATEGORIES whitelist                     │
│   • Fallback to 'input' if unknown/unsafe                     │
│   • Log reason for fallback                                   │
└─────────────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────────┐
│ CATEGORY VALIDATION 2 (createNode internal)                    │
│   • LegacyNodeModelFilter.validateSpawn()                     │
│   • Redirect legacy models to safe replacements                │
│   • Block unstable models → fallback to 'input'                 │
└─────────────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────────┐
│ UNIQUENESS CHECK                                              │
│   uniqueSpawnService.check({key, nodes, fallbackNodeId})        │
│   • Generate unified key (category + archetype)                 │
│   • Check existing nodes array                                  │
│   • Return decision: {allowed, existingNodeId}                 │
│   └── If not allowed: triggerUpgradePulse(existingNode)        │
│   └── If not allowed: return existingNode instead of spawning   │
└─────────────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────────┐
│ CATEGORY VALIDATION 3 (SpawnCycleValidator)                     │
│   spawnCycleValidator.validateCategory(category, pools)          │
│   • Secondary category validation                               │
│   • Return 'input' if not in availableCategories               │
└─────────────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────────┐
│ INPUT BYPASS ENFORCEMENT (if category === 'input')             │
│   • Check if canonical alternatives available                   │
│   • Randomly select from: [process, integration, analytics,    │
│     storage, control, quantum]                                 │
│   • Log once: "[CanonicalCategory] INPUT bypassed"            │
└─────────────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────────┐
│ FACTORY READINESS CHECK                                        │
│   ensureFactoriesReady()                                       │
│   • EnhancedNodeModels.ensureRegistryReady()                    │
│   • Verify totalFactories > 0                                 │
│   • Abort if registry unavailable                              │
└─────────────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────────┐
│ VISUAL CODE SELECTION (deterministic per-category counter)     │
│   • Get category pool from EnhancedNodeModels                  │
│   • Select visualCode: counter % pool.length                   │
│   • Increment per-category counter                              │
└─────────────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────────┐
│ createNode(category, position, index, isSpecial, options)       │
│   • Purge forbidden node primitives (disabled in bypass phase)  │
│   • Validate node visual integrity                               │
│   • Apply spawn options (isExtreme, extremeArchetype)           │
└─────────────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────────┐
│ VISUAL CREATION                                                │
│   EnhancedNodeModels.create(category, visualCode, coreColor)    │
│   • Call factory from NODE_VISUAL_REGISTRY                     │
│   • Generate canonical nodeId (HARD LOCK)                      │
│   • Set enhancedNodeModelBinding metadata                      │
│   • Return node mesh                                           │
└─────────────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────────┐
│ VISUAL INTEGRITY CHECKS                                        │
│   • debugCheckGeometry() - Check for NaN values                │
│   • hasRenderableVisual() - Verify renderable content          │
│   • validateNodeVisualIntegrity() - Check meshes/materials      │
│   • purgeForbiddenNodePrimitives() - Remove disallowed geoms    │
└─────────────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────────┐
│ SPAWN AUTHORITY COMPLIANCE GATE (Gate 2)                      │
│   spawnAuthorityComplianceGate.validateSpawnedNode()           │
│   • Validate node existence                                    │
│   • Check binding metadata (sourceModel, category, etc.)        │
│   • Verify category assignment                                 │
│   • Check core mesh existence                                  │
│   • Disable raycasting on visual-only meshes                    │
│   • Return compliance report (advisory, not fatal)             │
└─────────────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────────┐
│ METRICS ATTACHMENT                                            │
│   SafeMetricsDNAIntegration1_0.attachMetrics(node, archetype)  │
│   • Attach read-only metrics metadata                          │
│   • NO gameplay side effects                                  │
│   • Pure metadata storage                                     │
└─────────────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────────┐
│ _finalizeSpawnedNode(node, category, position, options)       │
│   • Ensure visibility (node.visible = true)                    │
│   • Validate scale sanity                                     │
│   • Check renderable count                                     │
│   • Validate bounding spheres                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ IDENTITY LOCK (Self-Heal)                              │   │
│   │   if (!node.userData.nodeId) {                         │   │
│   │     node.userData.nodeId = node.userData.id ||         │   │
│   │       `node-${Date.now()}-${Math.random()}`;           │   │
│   │   }                                                    │   │
│   │   if (!node.userData.nodeId) {                         │   │
│   │     throw Error('[IdentityLock] Missing canonical ID');   │   │
│   │   }                                                    │   │
│   └─────────────────────────────────────────────────────────┘   │
│   • Mirror nodeId to id (legacy compatibility)                 │
│   • Ensure category assignment                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ SCENE ATTACHMENT (CENTRALIZED)                         │   │
│   │   if (!node.parent && this.scene) {                    │   │
│     this.scene.add(node);  ← ONLY ATTACHMENT POINT         │   │
│     sceneAdded = true;                                     │   │
│   │   }                                                    │   │
│   └─────────────────────────────────────────────────────────┘   │
│   • registerNodeRoot() → nodesMap + nodes array               │
│   • nodeRegistry.set(options.registryKey, node)                 │
└─────────────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────────┐
│ UNIQUE SPAWN REGISTRATION                                     │
│   uniqueSpawnService.register({key, nodeId, meta})             │
│   • Register archetype key with node ID                        │
│   • Prevent future duplicate spawns                           │
└─────────────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────────┐
│ POST-SPAWN OBSERVERS                                          │
│   _runPostSpawnObservers(node, context)                         │
│   • visual-authority-runtime (order: 10)                      │
│   • Other registered observers                                 │
│   • Sorted by order priority                                   │
└─────────────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────────┐
│ METRICS LOGGING                                               │
│   NodeSpawnLogger.logSpawn({category, visualCode,              │
│     factoryName, nodeId, source})                              │
│   • Log spawn event with full context                          │
│   • Track for audit/debug                                     │
└─────────────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────────┐
│ SPAWN REGISTRY TRACKING                                       │
│   nodeSpawnRegistry.registerSpawn(node, source)                 │
│   • Track spawn by source (createNodes vs spawnNode)           │
│   • Audit/debug visibility                                    │
└─────────────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────────┐
│ ACTIVATION & MATERIALIZE                                      │
│   • Set initial activation state                               │
│   • materializeNode() - Visual fade-in animation                │
│   • Register materialization effect with orchestrator           │
└─────────────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────────┐
│ DEFERRED CONNECTIONS                                          │
│   pendingLinkJobs.push({newNodeId, startIndex, linksCreated})  │
│   • Queue link creation for next update                        │
│   • Process in _processLinkJobs() with budget                  │
└─────────────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────────┐
│ POST-SPAWN SYSTEMS                                            │
│   • onNodeSpawn() - Runtime metrics update                     │
│   • atomaNamingEngine - Assign naming code                     │
│   • NodeDepthAndHoloPreservationFix - Enforce render order     │
│   • Visual bootstrap queued to spawnVisualQueue                │
└─────────────────────────────────────────────────────────────────┘
   ↓
NODE LIVE IN SCENE
```

---

## CONFLICT HIGHLIGHTS

### 🔴 CRITICAL CONFLICTS

1. **Triple Category Validation**
   - Location 1: `spawnAuthorityComplianceGate.validateSpawnRequest()` - Observer mode
   - Location 2: `AINodes.validateCategory()` - Whitelist enforcement
   - Location 3: `spawnCycleValidator.validateCategory()` - Secondary check
   - **Impact:** Redundant validation with different behaviors
   - **Risk:** Validation logic divergence between gates

2. **Registry Proliferation**
   - `this.nodesMap` - Main node lookup by ID
   - `this.nodes` - Iteration array
   - `this.nodeRegistry` - Unique archetype tracking (legacy)
   - `uniqueSpawnRegistry` - Unique archetype tracking (new)
   - `uniqueSpawnService` - Unique spawn management
   - **Impact:** 5 registries for overlapping concerns
   - **Risk:** Desync if manual cleanup incomplete

3. **Multiple Identity Writes**
   - `EnhancedNodeModels.create()` - Sets canonical nodeId
   - `spawnNode()` - Mirrors nodeId to id
   - `_finalizeSpawnedNode()` - Self-heals missing nodeId
   - **Impact:** Identity written in 3 places
   - **Risk:** Identity overwrite if order changes

### 🟡 MEDIUM CONFLICTS

4. **Fallback Path Multiplicity**
   - 6+ distinct fallback mechanisms to 'input'
   - Some silent (INPUT bypass), some logged
   - **Impact:** Hard to track which fallback activated
   - **Risk:** Silent coercion may mask issues

5. **Visual Factory Bypass**
   - `ATOMA_NO_FALLBACK_SPHERES` flag can disable fallback
   - Visual rejection phase bypassed
   - **Impact:** May spawn invalid visuals
   - **Risk:** Broken nodes in scene

6. **Token Guard Circumvention**
   - `_spawnUpdateToken` required for spawnNode()
   - Token only set in `_processSpawnRequests()`
   - **Impact:** Prevents direct spawnNode() calls
   - **Risk:** Legitimate spawns blocked if token mishandled

### 🟢 LOW-IMPACT OBSERVATIONS

7. **Scene Attachment Centralization**
   - Only `_finalizeSpawnedNode()` attaches nodes
   - VFX systems may attach independently
   - **Impact:** Generally clean, but VFX scattered

8. **Post-Spawn Observer Ordering**
   - Observables sorted by order priority
   - Single execution pipeline
   - **Impact:** Predictable and well-managed

---

## STEP 8 — SPAWN ARCHITECTURE CLASSIFICATION

### CLASSIFICATION: **WRAPPED CENTRALIZED**

**Justification:**

#### ✅ CENTRALIZED COMPONENTS
1. **Single scene attachment point:** `_finalizeSpawnedNode()` is the only location where nodes are attached to scene
2. **Centralized spawn orchestration:** `spawnNode()` is the main entry point for all runtime spawns
3. **Unified request queue:** All external spawns funnel through `requestSpawn()` → `_processSpawnRequests()`
4. **Single visual factory:** `EnhancedNodeModels.create()` is the canonical source for all node visuals
5. **Post-spawn observer pipeline:** Ordered, single-pass execution of post-spawn hooks

#### ⚠️ WRAPPER LAYERS
1. **Multiple validation gates:** Spawn authority compliance, category whitelist, cycle validator (3 gates)
2. **Registry proliferation:** 5 separate registry systems for overlapping concerns
3. **Identity management layers:** nodeId (canonical) + id (legacy) + uuid (automatic)
4. **Fallback coercion:** Multiple fallback paths with different behaviors

#### ❌ NOT FRAGMENTED
1. No direct `scene.add()` scattered across multiple files for node roots
2. No independent spawn systems running in parallel
3. Single source of truth for visual factory (EnhancedNodeModels)
4. Clear entry points with funnel to central spawn logic

#### ❌ NOT HIGH RISK
1. Robust validation at multiple gates
2. Token guard prevents unauthorized spawns
3. Identity hard lock with self-heal
4. Comprehensive logging and audit trails

#### 🔬 ARCHITECTURE SCORE

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **Entry Point Centralization** | 8/10 | All spawns funnel through request queue, but 9 distinct entry methods |
| **Validation Duplication** | 4/10 | Triple category validation creates complexity |
| **Registry Coherence** | 5/10 | 5 registries for overlapping concerns, potential desync |
| **Identity Authority Clarity** | 8/10 | Canonical nodeId with hard lock, but multiple write locations |
| **Scene Attachment Centralization** | 10/10 | Single attachment point, no scattered adds |
| **Fallback Complexity** | 4/10 | 6+ fallback mechanisms with different behaviors |

**OVERALL CLASSIFICATION:** **WRAPPED CENTRALIZED**
- Core spawn flow is centralized and well-structured
- Wrapped in multiple validation and registry layers
- Functional but complex due to legacy accumulation

---

## RECOMMENDATIONS (FOR FUTURE WORK)

### HIGH PRIORITY
1. **Consolidate category validation** to single gate with unified behavior
2. **Merge registry systems** - eliminate duplicate tracking between nodeRegistry and uniqueSpawnRegistry
3. **Document fallback paths** - create matrix of all fallback conditions and their behaviors

### MEDIUM PRIORITY
4. **Reduce identity write locations** - ensure nodeId is written once, read everywhere
5. **Audit VFX scene attachments** - centralize visual system scene adds
6. **Standardize spawn logging** - single comprehensive log entry per spawn

### LOW PRIORITY
7. **Consider spawn mode simplification** - INIT/RUNTIME/DISABLED could be reduced
8. **Visual rejection bypass cleanup** - remove disabled bypass phase code
9. **Post-spawn observer registration API** - formalize observer contract

---

## APPENDIX: KEY FILES

| File | Responsibility |
|------|----------------|
| `AINodes.js` | Main spawn orchestration, createNode, spawnNode, _finalizeSpawnedNode |
| `SpawnAuthorityComplianceGate.js` | Compliance validation (observation mode) |
| `SpawnCycleValidator.js` | Category pool validation |
| `UniqueSpawnRegistry.js` | Unique archetype tracking (legacy) |
| `UniqueSpawnService.js` | Unique spawn management (current) |
| `NodeSpawnRegistry.js` | Spawn tracking for audit/debug |
| `EnhancedNodeModels.js` | Visual factory - canonical source of visuals |
| `NodeVisualRegistry.js` | Visual code to factory mapping |
| `SafeMetricsDNAIntegration1_0.js` | Metrics attachment (read-only metadata) |

---

## AUDIT METADATA

- **Phase:** READ-ONLY
- **Mode:** NO FILE MODIFICATIONS
- **Scope:** Full spawn lifecycle from trigger to scene attachment
- **Date:** 2026-02-28
- **Analyzer:** ATOMA Spawn Authority Audit Tool
- **Status:** COMPLETE

---

**END OF AUDIT**