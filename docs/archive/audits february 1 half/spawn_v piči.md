# SPAWN-POLICY-PURGE AUDIT REPORT

## SECTION A – Category Blockers

### AINodes.js

**1. SAFE_CATEGORIES Whitelist (Line ~375)**
```javascript
static get SAFE_CATEGORIES() {
  return ['input', 'process', 'integration', 'analytics', 'storage', 'control', 'quantum', 'sigma', 'mythic', 'prime', 'error', 'emotional'];
}
```
- **Status**: ACTIVE - All 12 categories now whitelisted
- **Impact**: No blocking occurs for these categories
- **Note**: UNSAFE_CATEGORIES returns empty array (Line ~379)

**2. validateCategory() Method (Line ~389-421)**
```javascript
validateCategory(requestedCategory) {
  const requested = (requestedCategory || 'input').toLowerCase().trim();
  
  if (AINodes.SAFE_CATEGORIES.includes(requested)) {
    return { valid: true, category: requested, reason: '...', redirected: false };
  }
  
  if (AINodes.UNSAFE_CATEGORIES.includes(requested)) {
    return { valid: false, category: 'input', reason: '...', blocked: true };
  }
  
  // Unknown category treated as unsafe
  return { valid: false, category: 'input', reason: '...', unknown: true };
}
```
- **Status**: ACTIVE
- **Fallback**: All unknown/invalid categories → 'input'

**3. EnhancedNodeModel Category Check (createNode ~line 427)**
```javascript
const enhancedNodeModelsCategories = ['input', 'process', 'integration', 'analytics', 'storage', 'control', 'quantum', 'sigma', 'mythic', 'prime', 'error', 'emotional'];

if (!enhancedNodeModelsCategories.includes(requestedCategory)) {
  resolvedCategory = 'input'; // Hard fallback
}
```
- **Status**: ACTIVE

**4. Canonical Category Enforcement (spawnNode ~line 842)**
```javascript
const CANONICAL_ENFORCE_SET = ['process', 'integration', 'analytics', 'storage', 'control', 'quantum'];
const canUseCategory = (cat) => {
  const res = this.validateCategory(cat);
  return res?.valid === true && res.category === cat;
};

if (category === 'input' && requestedCategoryRaw && requestedCategoryRaw.toLowerCase() !== 'input' && !isFallbackSpawn) {
  const alternatives = CANONICAL_ENFORCE_SET.filter(canUseCategory);
  if (alternatives.length > 0) {
    const pick = alternatives[Math.floor(Math.random() * alternatives.length)];
    category = pick; // Redirects INPUT to canonical alternative
  }
}
```
- **Status**: ACTIVE
- **Effect**: INPUT category blocked when original request was non-INPUT but defaulted
- **Redirects to**: process, integration, analytics, storage, control, or quantum

**5. Visual Rejection Blockers (spawnNode ~line 884-930)**
- **Status**: BYPASSED (multiple `if (false)` guards)
- **Blocked checks** (all commented out):
  - `meshCount < 2` - would block nodes with 0-1 meshes
  - `hasOnlySpheres && meshCount <= 2` - would block primitive-only visuals
  - Forbidden geometry removal (SphereGeometry, IcosahedronGeometry, etc.)

**6. Analytics Special Block (createNode ~line 606-618)**
```javascript
// Analytics spawn sanity check
if (safeCategory === 'analytics') {
  let hasMesh = false;
  nodeModel.traverse(obj => {
    if (obj.isMesh === true) hasMesh = true;
  });

  if (!hasMesh) {
    console.error('[AnalyticsSpawn] Killed empty analytics node', nodeModel.userData?.nodeId);
    if (nodeModel.parent) {
      nodeModel.parent.remove(nodeModel);
    }
    return null; // IMPORTANT: abort spawn completely
  }
}
```
- **Status**: ACTIVE
- **Effect**: Analytics nodes without any meshes are killed immediately

### EnhancedNodeModels.js

**1. Canonical Variant Pools (Line ~24-36)**
```javascript
const CANONICAL_VARIANTS = {
  input:    [4, 5, 6, 7, 8, 9, 10],
  process:  [3, 4, 5, 6, 7, 8],
  integration: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  analytics: [1, 2, 3, 4, 5, 7, 8, 9],
  storage:  [0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  control:  [0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  quantum:  [3],
  sigma:    [],  // REMOVED: All variants are primitive orbs
  mythic:   [0, 1, 2, 3, 4, 5],
  prime:    [0, 1, 2, 3, 4, 5],
  error:    [0, 1, 2, 3, 4, 5],
  emotional:[0, 1, 2, 3, 4, 5]
};
```
- **Status**: ACTIVE
- **Critical**: sigma has EMPTY array → NO sigma nodes will spawn

**2. Forbidden Geometries Set (Line ~38-44)**
```javascript
const FORBIDDEN_CANONICAL_GEOMETRIES = new Set([
  'SphereGeometry',
  'IcosahedronGeometry',
  'RingGeometry',
  'CircleGeometry',
  'TorusGeometry'
]);
```
- **Status**: Defined but BYPASSED in create() method (Line ~286-295)
- **Note**: Logic exists to check and remove, but wrapped in `if (false)`

---

## SECTION B – Cooldowns

### AINodes.js

**1. Analytics Cooldown (updateSpawning ~line 1147-1151)**
```javascript
if (category === 'analytics') {
  const lastAnalyticsSpawn = this.spawningConfig.categoryLastSpawnAt['analytics'] || 0;
  if (currentTime - lastAnalyticsSpawn < this.spawningConfig.analyticsCooldown) {
    this.spawningConfig.nextTimeSpawn = currentTime + this.getRandomSpawnInterval();
    return; // Skip spawn
  }
}
```
- **Cooldown Duration**: 15 seconds (analyticsCooldown: 15000)
- **Status**: ACTIVE
- **Effect**: Analytics cannot spawn more than once per 15s during time-based spawns

**2. Link Spawn Cooldown (initializeNodeSpawning ~line 1028)**
```javascript
linkSpawnCooldown: 5000, // 5 second cooldown between link spawns
```
- **Status**: ACTIVE (checked in onLinkCreated ~line 1179-1181)
- **Effect**: Only one node spawn per 5s on link creation events

**3. Per-Category Cooldown Tracking (initializeNodeSpawning ~line 1033-1034)**
```javascript
categoryLastSpawnAt: {},  // category -> timestamp
analyticsCooldown: 15000  // 15 seconds cooldown for analytics
```
- **Status**: ACTIVE (storage defined, but only analytics actually used)
- **Note**: Object structure supports per-category cooldowns, but only analytics is enforced

**4. Network Check Interval (initializeNodeSpawning ~line 1025-1026)**
```javascript
networkCheckInterval: 10000, // Check every 10 seconds
```
- **Status**: ACTIVE - density-based spawning only evaluated every 10s

---

## SECTION C – Intent Overrides

### AINodes.js

**1. Runtime Spawn Category Intent (getRuntimeSpawnCategoryIntent ~line 1066)**
```javascript
getRuntimeSpawnCategoryIntent() {
  const category = this.getNextCyclicSpawnCategory();
  if (category) {
    if (!this._spawnIntentLogged) {
      console.info('[SpawnIntent] runtime spawn injected category:', category);
      this._spawnIntentLogged = true;
    }
    return category;
  }
  return 'input'; // Hard fallback
}
```
- **Status**: ACTIVE
- **Effect**: Overrides random category selection with cyclic intent
- **Fallback**: Always returns 'input' if cycle fails

**2. Cyclic Spawn Category (getNextCyclicSpawnCategory ~line 387-411)**
```javascript
getNextCyclicSpawnCategory() {
  if (this._pendingCyclicCandidate) {
    return this._pendingCyclicCandidate.category;
  }

  const state = this.spawnCycleState;
  const order = state.order || [];
  if (order.length === 0) return null;

  let cursor = state.cursor % order.length;
  for (let i = 0; i < order.length; i++) {
    const candidate = order[cursor];
    const validation = this.validateCategory(candidate);

    if (validation?.valid === true && validation.category) {
      this._pendingCyclicCandidate = {
        category: validation.category,
        cursor,
        nextCursor: (cursor + 1) % order.length,
      };
      state.cursor = cursor;
      state.lastAdvancedAt = Date.now();
      state.skippedSinceSuccess = 0;
      return validation.category;
    }

    cursor = (cursor + 1) % order.length;
    state.cursor = cursor;
    state.skippedSinceSuccess += 1;
  }

  return null;
}
```
- **Cyclic Order**: ['input','process','storage','analytics','integration','control','quantum','sigma','mythic','prime','error','emotional']
- **Status**: ACTIVE
- **Effect**: Systematically rotates through all categories
- **Validation**: Only returns valid categories (skips invalid ones)

**3. Spawn Cycle State (constructor ~line 298-304)**
```javascript
this.spawnCycleState = {
  order: ['input','process','storage','analytics','integration','control','quantum','sigma','mythic','prime','error','emotional'],
  cursor: 0,
  lastAdvancedAt: 0,
  skippedSinceSuccess: 0,
};
```
- **Status**: ACTIVE
- **Note**: 'storage' appears before 'analytics' in order (different from other lists)

**4. Weighted Random Category Override (spawnNode ~line 820)**
```javascript
if (!category) {
  category = this.getWeightedRandomCategory();
}
```
- **Status**: ACTIVE
- **Method**: getWeightedRandomCategory() ~line 1092
```javascript
getWeightedRandomCategory() {
  const allCategories = [
    ...this.nodeCategories,      // Standard: input, process, integration, analytics, storage, control
    ...this.newNodeCategories,  // New: mythic, prime, error
    ...this.specialNodeTypes,   // Special: sigma, quantum, emotional
    'extreme'                 // EXTREME archetypes
  ];
  return allCategories[Math.floor(Math.random() * allCategories.length)];
}
```
- **Effect**: Uniform random selection (equal probability for all)
- **Override**: Only used when category parameter is null/undefined

---

## SECTION D – Early Exits

### AINodes.js

**1. Link Spawn Enabled Check (multiple locations)**
```javascript
function isLinkSpawnEnabled() {
  if (typeof window === 'undefined') return false;
  return window.ATOMA_LINK_SPAWN_ENABLED === true; // OPT-IN only
}
```
- **Locations**: onLinkCreated ~line 1176
- **Status**: ACTIVE
- **Effect**: If `!window.ATOMA_LINK_SPAWN_ENABLED`, no spawns from link events

**2. Spawn Authority Compliance Gate (spawnNode ~line 826-834)**
```javascript
const validatedCategory = spawnAuthorityComplianceGate.validateSpawnRequest(category, spawnPos);

if (validatedCategory === null) {
  this._pendingCyclicCandidate = null;
  return null;  // Clean abort, no node added to scene
}
```
- **Status**: ACTIVE
- **Effect**: External compliance gate can block spawn entirely

**3. Canonical Visual Hard Gate (spawnNode ~line 860-869)**
```javascript
EnhancedNodeModels.ensureRegistryReady?.();
const registryEntry = EnhancedNodeModels._ALL_NODE_FACTORIES?.[category];
const hasCanonicalVisual = Array.isArray(registryEntry) && registryEntry.length > 0;
if (!hasCanonicalVisual) {
  console.error('[NodeSpawnBlocked]', {
    category,
    reason: 'No canonical visual registered'
  });
  this._pendingCyclicCandidate = null;
  return null;
}
```
- **Status**: ACTIVE
- **Effect**: Categories with empty factory arrays cannot spawn
- **Critical Impact**: sigma cannot spawn (empty array + this check)

**4. CreateNode Fail-Closed (createNode ~line 453-462)**
```javascript
const failClosedVisual = (node, reason) => {
  const target = node || { userData: {} };
  target.userData = target.userData || {};
  target.userData.visualFailed = true;
  target.userData.__visualFailed = true;
  target.visible = false;
  console.warn('[NODE_REJECT] Canonical visual missing - node not spawned');
  return null;
};
```
- **Called when**:
  - create() throws exception (line 457-459)
  - No canonical visual available (line 462)
  - Visual has no renderable content (line 467)
  - Visual invalid after primitive purge (line 473)
  - Empty visual root (line 478)

**5. EnhancedNodeModels.create() Null Returns (createNode ~line 484-485)**
```javascript
nodeModel = EnhancedNodeModels.create(validatedCategory, variantIndex, coreColor);
if (!nodeModel) { return failClosedVisual(null, 'No canonical visual available'); }
```
- **Status**: ACTIVE
- **Effect**: If factory returns null, spawn aborted

**6. Visual Failed Check (createNodes ~line 357-363)**
```javascript
if (!node) {
  return; // Spawn failed – skip safely
}
if (node.userData?.visualFailed === true) {
  if (!window.ATOMA_SILENT_WARNINGS) {
    console.warn('[NodeSpawnSkipped] Visual build failed, skipping node');
  }
  return;
}
```
- **Status**: ACTIVE

**7. Analytics Empty Check (createNode ~line 606-618 - see SECTION A)**
- **Status**: ACTIVE
- **Effect**: Immediate abort for analytics nodes with no meshes

**8. SpawnNode Early Returns (spawnNode)**
- Line ~line 842: Fallback node reuse (isFallbackSpawn && this._fallbackNode exists)
- Line ~line 870: CreateNode returns null
- Line ~line 909: Visual failed check
- Line ~line 930: Finalize returns null
- Line ~line 977: Duplicate unique archetype detected

**9. UpdateSpawning Early Returns (updateSpawning)**
- Line ~line 1147-1151: Analytics cooldown active → return
- Line ~line 1197-1199: Analytics cooldown in onLinkCreated → return
- Line ~line 1207-1209: Analytics cooldown in checkNetworkDensityAndSpawn → return

**10. FinalizeSpawnedNode Early Returns (_finalizeSpawnedNode)**
- Line ~line 663-669: Invalid node object
- Line ~line 693-701: Visual integrity gate (bypassed)
- Line ~line 734-738: No renderables
- Line ~line 745-753: No children/empty root

---

## SECTION E – Factory Null Sources

### EnhancedNodeModels.js

**1. THREE Guard (create ~line 259-268)**
```javascript
static create(category = 'input', index = 0, color = 0x00ffff) {
  if (!THREE || !THREE.Group) {
    if (window.ATOMA_DEBUG_VISUAL_BUILD === true) {
      console.error('[VisualBuildFail]', { archetype: category, category, reason: 'THREE_UNAVAILABLE' });
    }
    return null;
  }
  // ...
}
```
- **Status**: ACTIVE
- **Effect**: Returns null if THREE.js not available

**2. Registry Invalid Guard (create ~line 270-278)**
```javascript
const registryReady = this.ensureRegistryReady();
if (!registryReady || !this._isRegistryValid()) {
  if (window.ATOMA_DEBUG_VISUAL_BUILD === true) {
    console.error('[VisualBuildFail]', { archetype: category, category, reason: 'RegistryInvalid' });
  }
  return null;
}
```
- **Status**: ACTIVE
- **Effect**: Returns null if factory registry invalid

**3. Sigma Empty Pool Implicit Null (create ~line 285-294)**
```javascript
const cat = (category || 'input').toLowerCase();
const pool = CANONICAL_VARIANTS[cat] || [0]; // sigma returns []
let variantIndex = index;
if (!pool.includes(variantIndex)) {
  const pick = Math.floor(Math.random() * pool.length); // Math.random() * 0 = NaN
  variantIndex = pool[pick]; // undefined[NaN] = undefined
}
```
- **Status**: ACTIVE
- **Effect**: When cat='sigma', pool=[].length=0, causing NaN → variantIndex=undefined
- **Result**: Later poolFns lookup fails → default to pool[0] → undefined → crash or null

**4. Default Case Null Return (create ~line 324-329)**
```javascript
default:
  console.warn(`[NODE_REJECT] Canonical visual missing — node not spawned (${category})`);
  // BYPASSED FOR VISUAL-REJECTION-BYPASS PHASE - allow nodes without canonical visuals
  // return null;
```
- **Status**: COMMENTED OUT
- **Effect**: Would return null for unknown categories, but currently bypassed

**5. Visual Validation Null Returns (create ~line 331-363)**
- **Status**: BYPASSED (all wrapped in `if (false)`)
- **Would return null if**:
  - meshCount === 0
  - materiallessMeshes.length > 0
  - geometrylessMeshes.length > 0
  - meshCount < 2
  - hasOnlySpheres && meshCount <= 2
  - rootGroup.children.length === 0

**6. Individual Factory Null Returns**

**Input Node 3 (createInputNode3 ~line 368-372)**
```javascript
static createInputNode3(group, color) {
  if (window.ATOMA_DEBUG_VISUAL_BUILD === true) {
    console.error('[VisualBuildFail]', { archetype: 'input-3', category: 'input', reason: 'NoMesh' });
  }
  return group; // Returns empty group
}
```
- **Status**: ACTIVE
- **Effect**: Returns empty group (not null, but no meshes)

**Integration Node 1 (createIntegrationNode1 ~line 523-527)**
```javascript
static createIntegrationNode1(group, color) {
  if (window.ATOMA_DEBUG_VISUAL_BUILD === true) {
    console.error('[VisualBuildFail]', { archetype: 'integration-1', category: 'integration', reason: 'NoMesh' });
  }
  return group; // Returns empty group
}
```
- **Status**: ACTIVE

**Control Node 1 (createControlNode1 ~line 1246-1250)**
```javascript
static createControlNode1(group, color) {
  if (window.ATOMA_DEBUG_VISUAL_BUILD === true) {
    console.error('[VisualBuildFail]', { archetype: 'control-1', category: 'control', reason: 'NoMesh' });
  }
  return group; // Returns empty group
}
```
- **Status**: ACTIVE

**7. Try-Catch Wrapped Factories with Null Return**

**All node creation factories wrapped with:**
```javascript
try {
  // factory logic
  return group;
} catch (err) {
  console.error('[NodeVisualAbort]', {
    model: 'createInputSignalReceptor',
    category: 'input',
    reason: 'Visual build failed — fallback visuals are forbidden',
    error: err
  });
  return null;
}
```
- **Locations**: All enhanced variant factories
- **Status**: ACTIVE
- **Effect**: Any exception → logged → return null

**8. EXTREME Variant Wrappers with Null Return**

Example (createExtremeInput0 ~line 1819-1837):
```javascript
try {
  const tempNode = new THREE.Group();
  const extremeGroup = this.extremeNodePack.createHyperbolicPrism(tempNode, null);
  if (!extremeGroup) {
    if (window.ATOMA_DEBUG_VISUAL_BUILD === true) {
      console.error('[VisualBuildFail]', { archetype: 'extreme-input-0', category: 'input', reason: 'NoMesh' });
    }
    return group;
  }
  // ...
} catch (err) {
  console.error('[NodeVisualAbort]', { /* ... */ });
  return null;
}
```
- **Status**: ACTIVE for all 12 EXTREME variants
- **Effect**: EXTREME pack failure → logged → return null

**9. Analytics Factory Empty Check (createAnalyticsNode ~line 716-722)**
```javascript
const result = (poolFns[selected] || poolFns[pool[0]])(group, color);

// --- Analytics Factory Null Check ---
if (result === null) {
  console.error('[AnalyticsFactoryNull]', {
    factory: 'createAnalyticsNode',
    variantIndex: selected,
    poolIndex: pool[nodeId % pool.length]
  });
}

return result;
```
- **Status**: ACTIVE (logs but returns null anyway)

---

## SUMMARY OF ACTIVE BLOCKERS

### HIGH IMPACT (Prevents Spawning)
1. **Sigma category completely blocked** - Empty CANONICAL_VARIANTS array + validation
2. **Analytics 15s cooldown** - Prevents burst analytics spawning
3. **Canonical visual check** - Empty factory arrays cannot spawn
4. **Spawn Authority Gate** - External compliance can veto any spawn
5. **ATOMA_LINK_SPAWN_ENABLED opt-in** - Off by default, blocks all link spawns
6. **Analytics empty mesh check** - Kills analytics nodes without meshes

### MEDIUM IMPACT (Alters Distribution)
1. **Cyclic spawn intent** - Forces rotation through all categories
2. **Canonical category enforcement** - Redirects INPUT to alternatives when appropriate
3. **Link spawn 5s cooldown** - Limits spawn rate from link events
4. **Fallback node singleton** - Only one fallback INPUT node allowed

### LOW IMPACT (Visual/Debug)
1. **Visual rejection checks** - All bypassed with `if (false)`
2. **Factory debug logging** - No functional impact
3. **Spawn intent logging** - One-time log, no functional impact

---

## RECOMMENDATIONS

1. **Sigma category**: Either implement sigma variants or remove from all category lists
2. **Analytics cooldown**: Document clearly or remove if unnecessary
3. **Visual rejection**: Either activate or remove dead code (multiple `if (false)` blocks)
4. **Consistent category ordering**: Align spawnCycleState.order with other category lists
5. **Empty factories**: Remove createInputNode3, createIntegrationNode1, createControlNode1 or implement