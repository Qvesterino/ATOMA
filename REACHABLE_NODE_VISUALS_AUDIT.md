# REACHABLE NODE VISUALS AUDIT

## 1) CATEGORY POOLS (from `NodeVisualRegistry.js`)

`CATEGORY_POOLS` is constructed by iterating `NODE_VISUAL_REGISTRY` and pushing each visualCode into the pool for `def.category`, then sorting each pool (NodeVisualRegistry.js:115-124). citelocal

| Category | Pool length | Codes (full) |
|----------|-------------|--------------|
| input | 6 | 101,102,103,104,105,106 |
| process | 6 | 201,202,203,204,205,206 |
| integration | 10 | 301,302,303,304,305,306,307,308,309,310 |
| analytics | 8 | 401,402,403,404,405,406,407,408 |
| storage | 12 | 501,502,503,504,505,506,507,508,509,510,511,512 |
| control | 15 | 601,602,603,604,605,606,607,608,609,610,611,612,613,614,615 |
| quantum | 4 | 701,702,703,704 |
| sigma | 5 | 801,802,803,804,805 |
| mythic | 6 | 901,902,903,904,905,906 |
| prime | 6 | 1001,1002,1003,1004,1005,1006 |
| error | 6 | 1101,1102,1103,1104,1105,1106 |
| emotional | 6 | 1201,1202,1203,1204,1205,1206 |

Result: All 12 categories have non-empty pools; no duplicate codes within pools.

## 2) Registry Coverage vs Pools

Each code in every pool originates from `NODE_VISUAL_REGISTRY` (same file). No pool codes lack a registry entry, and no registry entries point to a different category than the pool they populate.

- Construction loop uses `for (const [codeStr, def] of Object.entries(NODE_VISUAL_REGISTRY)) { … CATEGORY_POOLS[def.category].push(code); }` (NodeVisualRegistry.js:115-120). citelocal
- Therefore: `codesMissingRegistry = Ø`, `codesWithMismatchedCategory = Ø`, `duplicate codes = Ø` (by construction).

## 3) Factory Resolvability

`EnhancedNodeModels.create` resolves the factory for each visualCode via `resolveFactory` switch (EnhancedNodeModels.js:1784-1830). Key mappings cover every factoryName in the registry, including Enhanced/V2 variants:

- Input enhanced: `createInputSensory_*` → `InputSensoryEnhanced.*`
- Process enhanced: `createProcessEnhanced_*` → `ProcessEnhancedVariants.*`
- Integration enhanced: `createIntegrationEnhanced_*` → `IntegrationEnhancedVariants.*`
- Analytics enhanced: `createAnalyticsEnhanced_*` → `AnalyticsEnhancedVariants.*`
- Storage enhanced: `createStorageEnhanced_*` / `createObeliskCache` / `createFractalReservoir` / `createArchiveDrum` → `Storage*` modules
- Control enhanced & specials: `createControlEnhanced_*`, `createPhrixFlowArbiter`, `createCrucisSuppressionGovernor`, `createVertexTemporalGate` → `ControlEnhancedVariants` / `ControlNodeSpecialGovernors`

If `resolveFactory` returns null, the call logs `[EnhancedNodeModels] Factory not found…` and aborts (EnhancedNodeModels.js:1831-1865). No registry factory names are missing from the switch, so `missingFactoryNames = Ø`, `codesPointingToMissingFactory = Ø`. citelocal

## 4) V2 / Enhanced Detection

Registry entries referencing Enhanced/V2 builders:

| Category | VisualCodes | FactoryName |
|----------|-------------|-------------|
| process | 204,205,206 | createProcessEnhanced_FlowRecomposer / _TemporalShifter / _IterativeEngine |
| integration | 308,309,310 | createIntegrationEnhanced_SignalKnot / _ProtocolTangle / _ContinuityBinder |
| analytics | 406,407,408 | createAnalyticsEnhanced_SignalStratifier / _TrendExcavator / _AnomalyLedger |
| storage | 507,508,509 | createStorageEnhanced_ArchiveNexus / _MemoryCrypts / _DepthLayers |
| control | 609,610,611 | createControlEnhanced_DecisionFork / _AuthorityHelix / _CommandMatrix |

All of the above appear in CATEGORY_POOLS (Section 1) and have concrete factory mappings in `resolveFactory` (EnhancedNodeModels.js:1784-1830). Thus every Enhanced/V2 code is reachable via the standard spawn selection.

## 5) Reachability per Category (focus on input / control / storage)

| Category | ReachableCodes (registry+factory present) | UnreachableCodes | Notes |
|----------|--------------------------------------------|------------------|-------|
| input | 101-106 | Ø | All factories defined (static methods). |
| control | 601-615 | Ø | Enhanced codes 609-611 resolved via `resolveFactory`; specials 612-615 mapped to ControlNodeSpecialGovernors. |
| storage | 501-512 | Ø | Enhanced codes 507-509 plus 510-512 mapped via Storage modules; all in switch. |
| All others | All listed in Section 1 | Ø | No gaps detected. |

No category shows a pool code without a resolvable factory; no category mismatch; no missing registry entries.

## 6) Root-Cause Ranking for “V2 never appears”

1. **Not in pool/registry** — False: all Enhanced/V2 codes are in CATEGORY_POOLS and registry.  
2. **Factory missing** — False: switch covers all Enhanced/V2 factory names (EnhancedNodeModels.js:1784-1830). citelocal  
3. **Category mismatch** — False: pools are built from registry category, so categories match.  
4. **Selection coverage** — Likely cause if V2 is rarely seen: selection is deterministic round-robin per category; pools with many legacy entries (e.g., control has 15 codes) need ≥ pool length spawns to reach later V2 codes. Counter resets only on new AINodes instance.  

## Verdict

**REACHABLE** — Every pool code has a registry entry with a resolvable factory. Enhanced/V2 variants for control/storage/input are present in pools and mapped to factories; absence in runtime is most likely due to insufficient spawn count per category (round-robin) rather than missing data or mapping errors.
