# Variant Pool Audit (canonical filter applied)

## Category pools
- input: 11 variants (indices 0–10)
- process: 9 variants (0–8)
- integration: 11 variants (0–10)
- analytics: 10 variants (0–9)
- storage: 13 variants (0–12)
- control: 14 variants (0–13)
- quantum/sigma: 4 variants (0–3 shared)

## Dead indices per category (static inspection)
- input: [0,1,2] – builders return empty groups (no meshes).
- process: [0,1,2] – builders return empty groups.
- integration: [] – all variants construct non-primitive meshes.
- analytics: [0] empty; [1] uses CylinderGeometry only; [2] uses ConeGeometry; [3] uses CylinderGeometry plates › blocked by canonical filter.
- storage: [0] BoxGeometry pillar; [2] empty; [3] TetrahedronGeometry shards › blocked by filter. Others use non-banned or composite geometry and remain valid.
- control: none confirmed dead; legacy variants still add meshes (non-primitive mix). Canonical filter likely passes, but monitor logged nulls if any builder returns empty.
- quantum/sigma: [2] (SigmaNode2) returns empty group.

## Indices returning null (post-filter expectations)
- Any indices listed as dead above will log [VariantPool] INVALID SELECTION and return 
ull when selected.

## Indices blocked by NoFallbackPolicy
- None observed in code; failures are solely from canonical visual check or empty builders.

## Recommended new pool ranges (keep only canonical-producing variants)
- input: [3,4,5,6,7,8,9,10]
- process: [3,4,5,6,7,8]
- integration: [0,1,2,3,4,5,6,7,8,9,10]
- analytics: [4,5,6,7,8,9]
- storage: [1,4,5,6,7,8,9,10,11,12]
- control: [0,1,2,3,4,5,6,7,8,9,10,11,12,13]
- quantum/sigma: [0,1,3]

## Notes
- Logging added at create(category,index,color) emits the selected variant index per spawn and records invalid selections before returning null.
- Canonical validation rejects empty groups and visuals comprised solely of primitive geometries (Sphere/Box/Cone/Cylinder/Tetrahedron).
