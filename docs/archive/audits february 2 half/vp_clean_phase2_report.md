# Variant Pool Clean Phase 2 (Canonical-Only)

## Canonical Pools (unchanged)
- input: [4,5,6,7,8,9,10]
- process: [3,4,5,6,7,8]
- integration: [0,1,2,3,4,5,6,7,8,9,10]
- analytics: [1,2,3,4,5,6,7,8,9]
- storage: [0,1,2,3,4,5,6,7,8,9,10,11,12]
- control: [0,1,2,4,5,6,7,8,9,10,11,12,13]
- quantum/sigma: [0,1,2,3]
- mythic: [0,1,2,3,4,5]
- prime: [0,1,2,3,4,5]
- error: [0,1,2,3,4,5]
- emotional: [0,1,2,3,4,5]

## Removed indices per category
- input: removed 0,1,2,3
- process: removed 0,1,2
- analytics: removed 0
- storage: none (StorageNode2 unused and removed)
- control: none (index 1 retained per canonical list)
- integration/quantum/mythic/prime/error/emotional: none

## Builders removed
- Input: createInputNode0, createInputNode1, createInputNode2, createNewIcosahedron
- Process: createProcessNode0, createProcessNode1, createProcessNode2, createProcessNode3
- Analytics: createAnalyticsNode0, createAnalyticsNode1
- Storage: createStorageNode2
- Quantum/Sigma: createSigmaNode2
- Control (legacy helpers): createJudgmentSealNode, createSignalCitadelNode, createLawCoreNode
- Misc base shapes: createNewHexagonalPrism

## Imports removed
- InputEnhancedVariants_Session84 (unused)
- ControlNodeGeometries_v1 (legacy helpers removed)

## Files deleted
- None

## Alignment with CANONICAL_VARIANTS
All builder selection logic now maps only the canonical indices listed above; no dead indices remain in variant pools. Unreachable legacy builders and helper geometries have been removed from code.

## Status
Phase VP-CLEAN-1 runtime selection retained; Phase 2 cleanup complete — canonical-only builder surfaces remain.
