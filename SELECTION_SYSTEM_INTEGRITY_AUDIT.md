# SELECTION SYSTEM INTEGRITY AUDIT

## 1) CATEGORY SOURCES — WHO CAN REQUEST WHAT

Source table (pre-`createNode`):

| Source | Function | Possible categories | Selection logic | Can repeat? why |
|--------|----------|---------------------|-----------------|-----------------|
| Bulk INIT picker | `AINodes.createNodes` | `specialNodeTypes` = [`sigma`,`quantum`,`emotional`] (10% after first), else `nodeCategories` = [`input`,`process`,`integration`,`analytics`,`storage`,`control`,`mythic`,`prime`,`error`,`emotional`] | Pure `Math.random()` choice per array; EXTREME 15% flag decided separately | Yes – random, no cooldown; loop over positions may pick same repeatedly. |
| Runtime cyclic intent | `getRuntimeSpawnCategoryIntent` → `getNextCyclicSpawnCategory` | Ordered cycle: `input,process,storage,analytics,integration,control,quantum,sigma,mythic,prime,error,emotional` | Deterministic cursor; advances only on successful spawn | Repeats only after full cycle; stalls if spawns abort (cursor doesn’t advance). |
| Runtime weighted fallback | `getWeightedRandomCategory` | All categories above + `specialNodeTypes` + literal `'extreme'` | Uniform `Math.random()` over concatenated list | Yes – random, no memory. |
| Link event trigger | `onLinkCreated` | Uses `getRuntimeSpawnCategoryIntent()` | 20% chance after cooldown; same cycle as above | Cycle; can repeat if abort prevents cursor advance. |
| Density intent seeding | `checkNetworkDensityAndSpawn` | Sets `pendingDensityIntent` = `getRuntimeSpawnCategoryIntent()` | No direct spawn; seeds intent for scheduler (currently disabled) | Same as cycle. |
| Wrapper: mythic | `spawnMythicNode` | `mythic` | Direct constant | Always mythic. |
| Wrapper: prime | `spawnPrimeNode` | `prime` | Direct constant | Always prime. |
| Wrapper: error | `spawnErrorNode` | `error` | Direct constant | Always error. |
| Wrapper: extreme | `spawnExtremeNode` | Base category from `extremeArchetypes` map; archetype forced | Random archetype from map, category from map | Can repeat depending on random pick; uniqueness gate may reuse existing. |
| Wrapper: spawnArchetype | `spawnArchetype(name)` | Category lookup from `extremeArchetypes[name]` | Deterministic by name | Always that category. |

Evidence:
- Bulk picker with special chance and EXTREME roll — AINodes.js:875-935 citelocal
- Cycle order + pending candidate + success advance — AINodes.js:596-820 citelocal
- Weighted random list including `'extreme'` — AINodes.js:3050-3065 citelocal
- Link trigger 20% → spawnNode(categoryIntent) — AINodes.js:3945-3978 citelocal
- Wrapper constants — AINodes.js:4138-4176 citelocal

## 2) NORMALIZATION & COMPLIANCE — WHERE CATEGORY CHANGES

Flow (runtime path):
`requestedCategory` → **Compliance gate** `SpawnAuthorityComplianceGate.validateSpawnRequest` (may return `'input'` or null to abort) → **EnhancedNodeModels whitelist** (non-supported ⇒ `'input'`) → **Legacy filter** `LegacyNodeModelFilter` (redirect/block ⇒ `'input'`) → **validateCategory`** (safe list; unknown ⇒ `'input'`) → **Canonical enforcement** (if `'input'` but alternatives valid ⇒ random pick from canonical set) → `createNode` uses resulting `safeCategory`.

Fallback/abort points:
- Compliance null ⇒ hard abort (no spawn) — AINodes.js:3336-3360 citelocal
- Unsupported category ⇒ forced `'input'` — AINodes.js:3376-3394 citelocal
- Legacy block/redirect ⇒ `'input'` or replacement — AINodes.js:1208-1239 citelocal
- Safe-list failure ⇒ `'input'` — AINodes.js:116-150 citelocal
- Canonical enforcement swapping `'input'` to another safe cat — AINodes.js:3400-3430 citelocal

Diagram:
```
requestedCategory
  ↓ SpawnAuthorityComplianceGate.validateSpawnRequest
    → null → abort
    → cat'
  ↓ whitelist/enhanced support (unsupported → 'input')
  ↓ legacy filter (redirect/block → 'input')
  ↓ validateCategory (unknown → 'input')
  ↓ canonical enforcement (if cat=='input' and alternates exist → random alt)
  = final category into createNode/pool
```

## 3) POOL SOURCE & LEGACY MIX — WHICH REGISTRY DEFINES POOLS

- `CATEGORY_POOLS` built once from `NODE_VISUAL_REGISTRY` (canonical map visualCode→{category,factoryName}) and sorted per category — NodeVisualRegistry.js:1-124 citelocal
- `EnhancedNodeModels.getCategoryPool(cat)` simply returns `CATEGORY_POOLS[cat.toLowerCase()]` — EnhancedNodeModels.js:6870-6876 citelocal
- No legacy registry referenced in selection path; legacy builders are blocked earlier.
- Alias mapping:
  - Sigma shares quantum pool via registry entries 801-805 pointing to sigma category but factories identical to quantum; still distinct pool key (`sigma`) — NodeVisualRegistry.js:60-96 citelocal
  - No code remaps `error` to another pool; `error` has its own 1101-1106 entries.
- Pool sizes (from registry):
  - input: 6 codes (101-106)
  - process: 6 (201-206)
  - integration: 10 (301-310)
  - analytics: 8 (401-408)
  - storage: 12 (501-512)
  - control: 15 (601-615)
  - quantum: 4 (701-704); sigma: 5 (801-805)
  - mythic: 6 (901-906)
  - prime: 6 (1001-1006)
  - error: 6 (1101-1106)
  - emotional: 6 (1201-1206)

Pool resolution inside factories:
```
const pool = CATEGORY_POOLS[cat] || [];
... const resolvedVisualCode = resolveVisualCode(cat, visualToken);
```
(EnhancedNodeModels.js:1715-1739) citelocal

## 4) VARIANT SELECTION — WHY VISUALS COLLAPSE

- Counter key: raw `category` argument passed into `createNode`; `_variantCounterByCategory[category]` initialized on first use, incremented after selection. Normalization to safeCategory affects pool choice, but **counter key is NOT normalized**, so different raw strings that map to same pool restart at 0. — AINodes.js:1268-1320 citelocal
- Index: `idx = counter % pool.length`; `finalVisualCode = pool[idx]`; no randomness/hashing. — same excerpt.
- Reset points: `_variantCounterByCategory` created in constructor (AINodes.js:449-470) and not persisted; any new `AINodes` instance (e.g., world reload) resets all counters to zero.
- Bypass paths: none — all createNode calls go through this counter. However, if pool is empty and fallback switches category, selection restarts at fallback pool[0] because counter key differs.

Concrete failure modes:
1) **Raw key mismatch** — caller passes `‘Quantum’` (capitalized); compliance/validation normalize pool to `'quantum'`, but counter key `'Quantum'` starts at 0 each time ⇒ always selects pool[0] while using quantum pool. Evidence: counter keyed by original `category` string before normalization (AINodes.js:1268-1315) and poolCategory derived from `safeCategory` (AINodes.js:1320-1343). citelocal
2) **Instance reset** — world reload recreates `AINodes`, reinitializing `_variantCounterByCategory = {}` (AINodes.js:449-470); first spawns after reload use pool[0] for every category until counters advance. citelocal
3) **Small pools** — categories with 4–6 entries will repeat visuals every 4–6 spawns even with correct counters; deterministic modulo makes pattern visible (pool sizes listed above). Evidence: modulo selection (AINodes.js:1300-1320) and pool lengths in NodeVisualRegistry.js. citelocal

## 5) “WHY 3× ERROR OUT OF 8” — EXPLANATION (RANKED)

1) **Selection bias / cycle stall** — If error was explicitly requested (wrapper) or the cycle cursor stalled due to earlier aborts (cursor advances only on success), repeated calls will keep returning `error` until a spawn succeeds. Evidence: `_commitSpawnCycleSuccess` only advances on success (AINodes.js:804-820) and `spawnNode` aborts early on compliance/visual failures without advancing. citelocal
   - Must be true: error is at current cursor position and previous spawns failed/blocked, so cursor doesn’t move.
2) **Raw-key counter reset** — Non-canonical category strings that normalize to `'error'` use counter key of raw string, so each call starts at pool[0] (1101), appearing as identical error visuals. Evidence: counter keyed pre-normalization (AINodes.js:1268-1320). citelocal
   - Must be true: caller supplies varying/incorrect case or alias that normalizes to error.
3) **Small pool modulo** — Error pool has 6 codes; deterministic modulo repeats every 6 spawns. Evidence: pool size and modulo selection. citelocal
   - Must be true: ≥7 successful error spawns occurred in session; repetition after index wraps.
4) **Uniqueness reuse** — If error archetype marked unique (forceArchetype differs) uniqueness gate will return existing node; observer sees same visual multiple times. Evidence: `uniqueSpawnService.check` can return existing node (AINodes.js:3365-3388). citelocal
   - Must be true: forceArchetype provided and matches existing unique key.
5) **Multi-entry trigger duplication** — Link event + manual call could both trigger near-simultaneously; both pull same cycle category/error intent. Evidence: Link trigger and wrappers all call same `spawnNode`; no debouncing beyond link cooldown. citelocal
   - Must be true: two triggers fire before cursor advances.

## Consistency Verdict

INCONSISTENT — The selection pipeline is deterministic but not consistently keyed: category normalization and pool selection are separated, so the per-category counter can reset when raw request strings differ from normalized poolCategory. This, combined with small fixed-size pools and cursor-advance-only-on-success, makes repeated visuals (including repeated ERROR nodes) plausible without any randomness bugs.

