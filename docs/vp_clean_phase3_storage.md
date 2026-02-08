# VP-CLEAN-3 Storage Pool Adjustment

## Storage pool before
[0,1,2,3,4,5,6,7,8,9,10,11,12]

## Findings (static trace)
- Index 0 › createStorageNode0: adds pillar + slices (non-empty)
- Index 1 › createStorageNode1: adds capsule + bands (non-empty)
- Index 2 › createStorageNode3: adds tetrahedron shards (non-empty)
- Index 3 › createNewRhombicSolid: returns group with no children (empty visual)
- Index 4 › createStorageMnemonicVault: non-empty
- Index 5 › createStorageArchiveSpindle: non-empty
- Index 6 › createStorageMemoryReef: non-empty
- Index 7 › StorageEnhancedVariants.createStorageEnhanced_ArchiveNexus: non-empty
- Index 8 › StorageEnhancedVariants.createStorageEnhanced_MemoryCrypts: non-empty
- Index 9 › StorageEnhancedVariants.createStorageEnhanced_DepthLayers: non-empty
- Index 10 › StorageNodesVisual.createObeliskCache: non-empty
- Index 11 › StorageNodesVisual.createFractalReservoir: non-empty
- Index 12 › StorageNodesVisual.createArchiveDrum: non-empty

## Removed indices
- 3 (createNewRhombicSolid) — returns empty group, causes NodeVisualError: Visual has no renderable content.

## Storage pool after
[0,1,2,4,5,6,7,8,9,10,11,12]

## Final statement
Canonical storage variants now exclude the empty RhombicSolid path. All remaining indices map to builders that populate meshes/children, aligning runtime selection with canonical visuals only.
