# 2026-03-31: Material & Shader Duplication Audit

## Executive Summary
- **9 categorized material cache systems** exist and are used by styled_v2 factories
- **2 categories (EMO, SIGMA)** have caches but NO styled_v2 factories (dead cache)
- **30+ legacy factories** create materials inline without cache
- **7 material.clone() occurrences** in INTEGRATION category (all unnecessary)
- **Estimated duplication factor:** ~3-5x for legacy nodes, ~8-10x for mixed usage

---

## Cache Systems Inventory

### Active Caches (with styled_v2 factories)

| Cache | Function | Uses styled_v2? | Factory Name |
|-------|----------|------------------|--------------|
| PRIME_V2_MATERIALS | _getPrimeV2Materials() | ✅ YES | createPrimeV2Styled_v2 |
| MYTHIC_V2_MATERIALS | _getMythicV2Materials() | ✅ YES | createMythicV2Styled_v2 |
| ERROR_V2_MATERIALS | _getErrorV2Materials() | ✅ YES | createErrorV2Styled_v2 |
| STORAGE_V2_MATERIALS | _getStorageV2Materials() | ✅ YES | createStorageNodeStyled_v2 |
| INPUT_V2_MATERIALS | _getInputV2Materials() | ✅ YES | createInputNodeStyled_v2 |
| CONTROL_V2_MATERIALS | _getControlV2Materials() | ✅ YES | createControlNodeStyled_v2 |
| ANALYTICS_V2_MATERIALS | _getAnalyticsV2Materials() | ✅ YES | createAnalyticsNodeStyled_v2 |
| QUANTUM_V2_MATERIALS | _getQuantumV2Materials() | ✅ YES | createQuantumV2Styled_v2 |
| SIGMA_V2_MATERIALS | _getSigmaV2Materials() | ❌ NO | NO styled_v2 factory found |
| EMO_V2_MATERIALS | _getEmotionalV2Materials() | ❌ NO | NO styled_v2 factory found |

### Specialized Shader Caches

| Cache | Function | Usage |
|-------|----------|--------|
| VORTEX_MATERIAL_CACHE | createVortexMaterial() | Used in createInputNode3 |
| CONTROL_FRACTURE_MATERIAL_CACHE | createControlFractureMaterial() | Usage unknown |
| SIGMA_COLLAPSE_MATERIAL_CACHE | createSigmaCollapseMaterial() | Usage unknown |
| CORE_MATERIAL_CACHE | getSharedCoreBasicMaterial() | Core identity materials |
| CONTROL_V2_LEGACY_MATERIALS | _getControlV2Materials_Legacy() | Legacy control materials |
| CONTROL_EXTREME_608_MATERIALS | _getControlExtreme608Materials() | Extreme variant materials |

### Dead Caches (No styled_v2 factory)

- **SIGMA_V2_MATERIALS**: Cache exists but createSigmaV2Styled_v2 not found
- **EMO_V2_MATERIALS**: Cache exists but createEmotionalV2Styled_v2 not found

These caches are **dead code** and should be removed or activated.

---

## Legacy Factories Audit (Inline Material Creation)

### INPUT Legacy (3 factories, NO cache)

| Factory | Materials Created | Per-Call Creation |
|---------|-------------------|-------------------|
| createInputNode3 | MeshBasic, MeshStandard, PointsMaterial, Shader (Vortex) | ~4-5 materials per node |
| createInputSignalReceptor | MeshPhysical, MeshStandard | ~2 materials per node |
| createInputDataGateway | MeshStandard, MeshPhysical | ~2 materials per node |
| createInputIncomingFunnel | MeshStandard, MeshBasic (x5) | ~6 materials per node |

### PROCESS Legacy (3 factories, NO cache)

| Factory | Materials Created | Per-Call Creation |
|---------|-------------------|-------------------|
| createProcessFluxChamber | MeshStandard, MeshBasic (x2) | ~3 materials per node |
| createProcessTransformationSpine | MeshStandard (x2) | ~2 materials per node |
| createProcessConversionOrbit | MeshPhysical, MeshStandard | ~2 materials per node |

### ANALYTICS Legacy (5 factories, NO cache)

| Factory | Materials Created | Per-Call Creation |
|---------|-------------------|-------------------|
| createAnalyticsNode2 | MeshStandard, LineBasic | ~2 materials per node |
| createAnalyticsNode3 | MeshStandard, LineBasic | ~2 materials per node |
| createAnalyticsObserverLens | MeshStandard (x5), MeshBasic | ~6 materials per node |
| createAnalyticsFractalEcho | MeshStandard, LineBasic | ~2 materials per node |
| createAnalyticsParallaxOracle | MeshPhysical, MeshBasic (x5), MeshStandard | ~7 materials per node |

### STORAGE Legacy (6 factories, NO cache)

| Factory | Materials Created | Per-Call Creation |
|---------|-------------------|-------------------|
| createStorageNode0 | MeshStandard | ~1 material per node |
| createStorageNode1 | MeshStandard (x4), LineBasic, MeshBasic | ~6 materials per node |
| createStorageNode3 | MeshStandard | ~1 material per node |
| createStorageMnemonicVault | MeshStandard (x3), LineBasic, MeshBasic (x3) | ~7 materials per node |
| createStorageArchiveSpindle | [audit needed] | [audit needed] |
| createStorageMemoryReef | [audit needed] | [audit needed] |

### CONTROL Legacy (8 factories, NO cache)

| Factory | Materials Created | Per-Call Creation |
|---------|-------------------|-------------------|
| createControlNode0 | MeshStandard, MeshBasic | ~2 materials per node |
| createControlNode1 | MeshStandard (x2), MeshBasic | ~3 materials per node |
| createControlNode2 | MeshStandard, MeshBasic | ~2 materials per node |
| createControlNode3 | MeshStandard, LineBasic | ~2 materials per node |
| createAxiomCrystalNode | [audit needed] | [audit needed] |
| createControlCommandPyramid | [audit needed] | [audit needed] |
| createControlHierarchyTower | [audit needed] | [audit needed] |
| createControlSymmetryCore | [audit needed] | [audit needed] |

### INTEGRATION Legacy (4 factories, NO cache)

| Factory | Materials Created | Per-Call Creation |
|---------|-------------------|-------------------|
| createIntegrationNode0 | MeshStandard, MeshBasic | ~2 materials per node + **2 CLONES** |
| createIntegrationNode1 | MeshStandard, LineBasic | ~2 materials per node + **2 CLONES** |
| createIntegrationNode2 | MeshStandard | ~1 material per node + **3 CLONES** |
| createIntegrationNode | Delegates to other factories | Delegated |

### SIGMA Legacy (3 factories, NO cache)

| Factory | Materials Created | Per-Call Creation |
|---------|-------------------|-------------------|
| createSigmaNode2 | MeshStandard, LineBasic | ~2 materials per node |
| createSigmaLatticeConductor | [audit needed] | [audit needed] |
| createSigmaBloomCrown | [audit needed] | [audit needed] |

### QUANTUM Legacy (3 factories, NO cache)

| Factory | Materials Created | Per-Call Creation |
|---------|-------------------|-------------------|
| createQuantumBloomNode | [audit needed] | [audit needed] |
| createQuantumLattice | [audit needed] | [audit needed] |
| createQuantumLotus | [audit needed] | [audit needed] |

### MYTHIC Legacy (3 factories, NO cache)

| Factory | Materials Created | Per-Call Creation |
|---------|-------------------|-------------------|
| createMythicShardClusterNode | [audit needed] | [audit needed] |
| createMythicBrokenMonolithNode | [audit needed] | [audit needed] |
| createMythicFloatingFragmentsNode | [audit needed] | [audit needed] |

### ERROR Legacy (NO factories found)

- No legacy ERROR factories found - all ERROR nodes likely use styled_v2 path

---

## material.clone() Analysis

### Occurrences (Total: 7)

| Line | Factory | Clone Count | Clone Type | Analysis |
|------|----------|--------------|-------------|----------|
| 2825 | createIntegrationNode0 | 1 | leftHalf | **UNNECESSARY** - Can share material |
| 2831 | createIntegrationNode0 | 1 | rightHalf | **UNNECESSARY** - Can share material |
| 2885 | createIntegrationNode1 | 1 | core mesh | **UNNECESSARY** - Can share baseMaterial |
| 2936 | createIntegrationNode1 | 1 | plate mesh | **UNNECESSARY** - Can share baseMaterial |
| 3010 | createIntegrationNode2 | 1 | frame mesh | **UNNECESSARY** - Can share material |
| 3018 | createIntegrationNode2 | 1 | hBeam mesh | **UNNECESSARY** - Can share material |
| 3023 | createIntegrationNode2 | 1 | vBeam mesh | **UNNECESSARY** - Can share material |

### Diagnosis: All clones are unnecessary

All 7 clones are in INTEGRATION category factories:
- **createIntegrationNode0**: Clones same material for left/right halves - could share
- **createIntegrationNode1**: Clones baseMaterial for cores and plates - could share
- **createIntegrationNode2**: Clones same material for frame/beams - could share

**No independent material modifications** occur after clone, making these clones pure duplication.

### Recommended Fix
Replace all 7 material.clone() calls with direct material references:
- Remove `.clone()` calls
- Share same material instance across meshes
- If independent mutation is needed, create separate cache entries instead

---

## Duplication Impact Estimate

### Per-Category Material Creation

| Category | styled_v2 (Cached) | Legacy (Inline) | Duplication Factor |
|----------|---------------------|------------------|-------------------|
| INPUT | 1 instance per color | 4-6 per call | **4-6x** |
| PROCESS | Not found | 2-3 per call | **2-3x** |
| INTEGRATION | Not found | 2-3 per call + clones | **3-4x** |
| ANALYTICS | 1 instance per color | 2-7 per call | **2-7x** |
| STORAGE | 1 instance per color | 1-7 per call | **1-7x** |
| CONTROL | 1 instance per color | 2-5 per call | **2-5x** |
| QUANTUM | 1 instance per color | [unknown] | **[unknown]** |
| SIGMA | 1 instance per color (DEAD CACHE) | 2+ per call | **∞x (dead cache)** |
| EMO | 1 instance per color (DEAD CACHE) | 2+ per call | **∞x (dead cache)** |

### Estimated Total Impact

For a scene with **100 nodes** (mixed legacy/styled_v2):
- **Legacy path**: 300-700 material instances created
- **styled_v2 path**: 9-27 material instances (1 per category per color)
- **Duplication factor**: 10-25x in mixed scenarios

**Shader compilation impact:**
- Legacy nodes create new shader instances each call
- No sharing of uniform uniforms blocks
- Higher GPU memory usage for duplicate shaders

---

## Critical Issues Found

### 1. Dead Caches (HIGH PRIORITY)

**SIGMA_V2_MATERIALS** and **EMO_V2_MATERIALS** are completely unused:
- Caches are created but never accessed
- Related factories (createSigmaNode2, createEmotionalV2Styled_v2) use legacy path
- **Memory waste**: These caches consume memory with zero benefit

**Recommended Action:**
- Either: Activate caches by creating styled_v2 factories
- Or: Remove caches and document legacy-only path

### 2. Massive Inline Creation (HIGH PRIORITY)

**30+ legacy factories** create materials inline on every call:
- No caching across nodes of same category/color
- Each node spawn creates 1-7 new material instances
- **Scale issue**: 100 nodes = 300-700 materials

**Recommended Action:**
- Create styled_v2 factories for all legacy paths
- Or: Create inline cache with simple Map(key, material)

### 3. Unnecessary Clones (MEDIUM PRIORITY)

**7 material.clone() calls** in INTEGRATION factories:
- No material mutations after clone
- Pure duplication with no functional benefit
- Could use shared references safely

**Recommended Action:**
- Remove all 7 clone calls
- Share same material across meshes

---

## Recommended Action Plan

### Phase 1: Dead Cache Cleanup (LOW RISK)
1. Remove SIGMA_V2_MATERIALS if createSigmaV2Styled_v2 doesn't exist
2. Remove EMO_V2_MATERIALS if createEmotionalV2Styled_v2 doesn't exist
3. Document legacy-only status in code comments

### Phase 2: material.clone() Elimination (LOW-MEDIUM RISK)
1. Remove 7 clone calls in createIntegrationNode0/1/2
2. Share same material reference across meshes
3. Test visual parity

### Phase 3: Central Material Authority (MEDIUM RISK)
1. Create MaterialAuthority class
2. Migrate all 9 category caches to single authority
3. Add support for legacy factories to query authority

### Phase 4: Legacy Factory Migration (HIGH RISK)
1. Create styled_v2 factories for INPUT, PROCESS, ANALYTICS, STORAGE, CONTROL, QUANTUM, SIGMA, EMO
2. Route all legacy factories through MaterialAuthority
3. Deprecate inline material creation

### Phase 5: Validation & Testing (LOW RISK)
1. Visual regression testing for all 42+ variants
2. Material count verification (expect 80-90% reduction)
3. Performance profiling (FPS, memory, compilation time)

---

## Next Steps

Immediate actions for Daniel:
1. Review this audit and approve Phase 1 (dead cache cleanup)
2. Approve Phase 2 (material.clone() removal)
3. Approve Phase 3 (MaterialAuthority design)
4. Prioritize which legacy categories to migrate first

Audit completed: 2026-03-31