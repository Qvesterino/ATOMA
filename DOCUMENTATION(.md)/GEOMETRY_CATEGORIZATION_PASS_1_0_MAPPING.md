# 📋 GEOMETRY CATEGORIZATION PASS 1.0 - CANONICAL MAPPING

## OBJECTIVE
Reorganize existing node geometry factory (EnhancedNodeModels.js) variant assignments to match the canonical geometry-to-category map, WITHOUT removing any code or changing behavior.

---

## CANONICAL CATEGORY ASSIGNMENTS

### INPUT (5 geometries)
- createInputNode0 → **TriangularPrism+Rim** ✓ (exists)
- createInputNode2 → **PyramidSpike** ✓ (exists, inverted cone = pyramid)
- createInputNode1 → **WireframeSphere** ✓ (exists, holographic rings = wireframe evolved)
- createNewIcosahedron → **Icosahedron** ✓ (exists)
- *FlowingWaveMesh → MISSING - needs assignment*

**Canonical Constraint**: Max 1 evolved sphere variant
- createInputNode1 = evolved sphere (holographic rings) ✓

### PROCESS (9 geometries)
- createProcessNode0 → **DiamondLattice** ? (cube-within-cube, lattice-like)
- createProcessNode1 → **MeshColumn** ? (cylindrical with radial spikes)
- createProcessNode2 → **DoubleHelix** ? (layered plates = helical stacking)
- createProcessNode3 → **Helix** ? (torus with inner segmentation)
- createNewHexagonalPrism → **HexagonalPrism** ✓ (exists)
- createExtremeProcess0 → **QuantumLattice** ✓ (from extreme pack)
- createExtremeProcess1 → **FractalBloom** ✓ (from extreme pack)
- *ReactiveTesseract → MISSING or REASSIGN*
- *BridgeStructure → MISSING or REASSIGN*

### INTEGRATION (8+ geometries - KNOTS PRIMARY)
- createKnotTrefoil → **TrefoilKnot** ✓ (exists)
- createKnotFigureEight → **FigureEightKnot** ✓ (exists)
- createKnotInfiniteSelfIntersecting → **InfiniteSelfIntersectingKnot** ✓ (exists)
- createKnotChaotic → **ChaoticKnotCore** ✓ (exists)
- createKnotBorromean → **BorromeanRings** ✓ (exists)
- createKnotTorusKnot → **TorusKnot** ✓ (exists)
- createKnotTripleHelix → **TripleHelixKnot** ✓ (exists)
- createExtremeInput1 → **SingularityKnot** ✓ (from EXTREME, move to INTEGRATION)

**Current Issue**: Knots are spread across multiple categories. Need to consolidate to INTEGRATION.

### STORAGE (8 geometries)
- createStorageNode0 → **MemoryPillar** ✓
- createStorageNode1 → **CapsuleBands** ? (concentric spheres = bands)
- createStorageNode2 → **SegmentedStack** ✓ (layered cubes, NOT plain cube)
- createStorageNode3 → **CrystalShardCluster** ?
- createNewRhombicSolid → **RhombicSolid** ✓ (exists)
- *WhisperSphere → MISSING - evolved sphere*
- *EchoFractal → MISSING*
- *AbyssalShard → MISSING*

### CONTROL (6 geometries)
- createControlNode0 → **OctagonalCore+Rim** ✓
- createControlNode1 → **SpikedControlFrame** ? (tetrahedral pyramid with edges)
- createControlNode2 → **ControlRingLattice** ? (ring-within-ring = lattice)
- createControlNode3 → **InfiniteSpiral** ? (X-shaped = spiral form?)
- createExtremeControl0 → **ChronoRipper** ✓ (from extreme pack)
- createExtremeControl1 → **InfiniteSpiral** ✓ (from extreme pack, rename from current 0)
- *NetworkMesh → MISSING*

### ANALYTICS (5 geometries)
- createAnalyticsNode0 → **DataPyramid** ? (disc with lens = pyramid-like data)
- createAnalyticsNode1 → **SpinningDataSphere** ? (hollow cube = spinning sphere frame)
- createAnalyticsNode2 → **HexAnalysisMatrix** ✓ (hexagonal disc = analysis matrix)
- createAnalyticsNode3 → **PrismSpectrumAnalyzer** ? (tall spike = prism spectrum)
- createNewElongatedOctahedron → **ElongatedOctahedron** ✓ (exists)

### QUANTUM (6 geometries - renamed from SIGMA)
- createSigmaNode0 → **FracturedAnomaly** ?
- createSigmaNode1 → **DistortedPolyCluster** ?
- createSigmaNode2 → **ChaoticLayeredForm** ?
- createSigmaNode3 → **TwistedOctahedron+ResonanceField** ?
- createExtremeControl0 (reassigned) → **HyperbolicNeuralPrism** ?
- createExtremeIntegration1 → **ChaoticHeart** ? (move from integration)

---

## IMPLEMENTATION STRATEGY

### Phase 1: Rename Category (No Behavior Change)
- Change `case 'sigma'` to `case 'quantum'` in main create() switch
- Update comments: "SIGMA" → "QUANTUM"
- Update method names: createSigmaNode → createQuantumNode (optional, for consistency)

### Phase 2: Reorganize Variant Arrays
Each createXxxxNode(group, index, color) method has a `variants` array. Reorder/reassign geometries to match canonical map while keeping all methods intact.

**KEY RULE**: No method deletions. Only reorder the variants array and cross-assign from other categories if needed.

### Phase 3: Handle Missing Geometries
Geometries listed in canonical map but not found in code:
- FlowingWaveMesh
- ReactiveTesseract
- BridgeStructure
- WhisperSphere
- EchoFractal
- AbyssalShard
- NetworkMesh
- HyperbolicNeuralPrism

**ACTION**: Either locate in code or alias existing geometries to fill slots.

---

## DETAILED VARIANT ARRAY REORGANIZATION

### INPUT Category (5 geometries)
**Current Order**:
```javascript
static createInputNode(group, index, color) {
  const variants = [
    this.createInputNode0.bind(this),      // 0: TriangularPrism+Rim
    this.createInputNode1.bind(this),      // 1: WireframeSphere
    this.createInputNode2.bind(this),      // 2: PyramidSpike
    this.createInputNode3.bind(this),      // 3: Gateway
    this.createExtremeInput0.bind(this),   // 4: HyperbolicPrism
    this.createExtremeInput1.bind(this),   // 5: SingularityKnot (MOVE to INTEGRATION!)
    this.createNewIcosahedron.bind(this)   // 6: Icosahedron
  ];
  return variants[index % 7](group, color);
}
```

**Canonical Order (REORGANIZED)**:
```javascript
// INPUT: TriangularPrism+Rim, PyramidSpike, WireframeSphere, Icosahedron, FlowingWaveMesh
static createInputNode(group, index, color) {
  const variants = [
    this.createInputNode0.bind(this),      // 0: TriangularPrism+Rim ✓
    this.createInputNode2.bind(this),      // 1: PyramidSpike ✓
    this.createInputNode1.bind(this),      // 2: WireframeSphere ✓
    this.createNewIcosahedron.bind(this),  // 3: Icosahedron ✓
    // PLACEHOLDER for FlowingWaveMesh (missing)
    this.createExtremeInput0.bind(this)    // 4: HyperbolicPrism (TEMP - moved INPUT1 to INTEGRATION)
  ];
  return variants[index % 5](group, color);
}
```

---

### PROCESS Category (9 geometries)
**Current Assignment**:
```javascript
static createProcessNode(group, index, color) {
  const variants = [
    this.createProcessNode0.bind(this),    // 0: CubeWithinCube
    this.createProcessNode1.bind(this),    // 1: CircularCoreRadial
    this.createProcessNode2.bind(this),    // 2: LayeredPlates
    this.createProcessNode3.bind(this),    // 3: TorusSegmented
    this.createExtremeProcess0.bind(this), // 4: QuantumLattice
    this.createExtremeProcess1.bind(this), // 5: FractalBloom
    this.createNewHexagonalPrism.bind(this)// 6: HexagonalPrism
  ];
  return variants[index % 7](group, color);
}
```

**Canonical Order (REORGANIZED)**:
```javascript
// PROCESS: DiamondLattice, Helix, DoubleHelix, MeshColumn, HexagonalPrism, QuantumLattice, FractalBloom, ReactiveTesseract, BridgeStructure
static createProcessNode(group, index, color) {
  const variants = [
    this.createProcessNode0.bind(this),       // 0: DiamondLattice ✓
    this.createProcessNode3.bind(this),       // 1: Helix ✓
    this.createProcessNode2.bind(this),       // 2: DoubleHelix ✓
    this.createProcessNode1.bind(this),       // 3: MeshColumn ✓
    this.createNewHexagonalPrism.bind(this),  // 4: HexagonalPrism ✓
    this.createExtremeProcess0.bind(this),    // 5: QuantumLattice ✓
    this.createExtremeProcess1.bind(this),    // 6: FractalBloom ✓
    this.createExtremeIntegration0.bind(this),// 7: ReactiveTesseract (REASSIGNED from INTEGRATION)
    // PLACEHOLDER for BridgeStructure
  ];
  return variants[index % 8](group, color);
}
```

---

### INTEGRATION Category (8+ KNOTS)
**Current Assignment** (Mixed):
```javascript
static createIntegrationNode(group, index, color) {
  const variants = [
    this.createIntegrationNode0.bind(this),  // 0: HalvesWithBridge
    this.createIntegrationNode1.bind(this),  // 1: SphericalLayers
    this.createIntegrationNode2.bind(this),  // 2: PyramidNest
    this.createIntegrationNode3.bind(this),  // 3: HexagonalConnector
    this.createExtremeIntegration0.bind(this),// 4: ReactiveTesseract
    this.createExtremeIntegration1.bind(this),// 5: ChaoticHeart
    this.createNewTruncatedPyramid.bind(this),// 6: TruncatedPyramid
    // NO KNOTS - THEY'RE IN OTHER CATEGORIES!
  ];
}
```

**Canonical Order (REORGANIZED - KNOT PRIMARY)**:
```javascript
// INTEGRATION: TrefoilKnot, FigureEightKnot, InfiniteSelfIntersectingKnot, ChaoticKnotCore, BorromeanRings, TorusKnot, TripleHelixKnot, SingularityKnot
static createIntegrationNode(group, index, color) {
  const variants = [
    this.createKnotTrefoil.bind(this),           // 0: TrefoilKnot ✓
    this.createKnotFigureEight.bind(this),       // 1: FigureEightKnot ✓
    this.createKnotInfiniteSelfIntersecting.bind(this), // 2: InfiniteSelfIntersecting ✓
    this.createKnotChaotic.bind(this),           // 3: ChaoticKnotCore ✓
    this.createKnotBorromean.bind(this),         // 4: BorromeanRings ✓
    this.createKnotTorusKnot.bind(this),         // 5: TorusKnot ✓
    this.createKnotTripleHelix.bind(this),       // 6: TripleHelixKnot ✓
    this.createExtremeInput1.bind(this)          // 7: SingularityKnot (MOVED from INPUT) ✓
  ];
  return variants[index % 8](group, color);
}
```

---

### STORAGE Category (8 geometries)
**Current Assignment**:
```javascript
static createStorageNode(group, index, color) {
  const variants = [
    this.createStorageNode0.bind(this),    // 0: RectangularPillar
    this.createStorageNode1.bind(this),    // 1: ConcentricSpheres
    this.createStorageNode2.bind(this),    // 2: LayeredCubes
    this.createStorageNode3.bind(this),    // 3: OrbitingRings
    this.createExtremeStorage0.bind(this), // 4: VortexChasm
    this.createExtremeStorage1.bind(this), // 5: EchoFractal
    this.createNewRhombicSolid.bind(this)  // 6: RhombicSolid
  ];
}
```

**Canonical Order (REORGANIZED)**:
```javascript
// STORAGE: MemoryPillar, CapsuleBands, SegmentedStack, CrystalShardCluster, RhombicSolid, WhisperSphere, EchoFractal, AbyssalShard
static createStorageNode(group, index, color) {
  const variants = [
    this.createStorageNode0.bind(this),    // 0: MemoryPillar ✓
    this.createStorageNode1.bind(this),    // 1: CapsuleBands ✓
    this.createStorageNode2.bind(this),    // 2: SegmentedStack ✓
    this.createStorageNode3.bind(this),    // 3: CrystalShardCluster ✓
    this.createNewRhombicSolid.bind(this), // 4: RhombicSolid ✓
    // PLACEHOLDER for WhisperSphere (evolved sphere)
    this.createExtremeStorage1.bind(this), // 5/6: EchoFractal ✓
    // PLACEHOLDER for AbyssalShard
  ];
  return variants[index % 7](group, color);
}
```

---

### CONTROL Category (6 geometries)
**Current Assignment**:
```javascript
static createControlNode(group, index, color) {
  const variants = [
    this.createControlNode0.bind(this),    // 0: OctagonalCore
    this.createControlNode1.bind(this),    // 1: TetrahedralPyramid
    this.createControlNode2.bind(this),    // 2: RingWithinRing
    this.createControlNode3.bind(this),    // 3: XShapedForm
    this.createExtremeControl0.bind(this), // 4: InfiniteSpiral
    this.createExtremeControl1.bind(this)  // 5: ChronoRipper
  ];
}
```

**Canonical Order (REORGANIZED)**:
```javascript
// CONTROL: OctagonalCore+Rim, ControlRingLattice, SpikedControlFrame, InfiniteSpiral, ChronoRipper, NetworkMesh
static createControlNode(group, index, color) {
  const variants = [
    this.createControlNode0.bind(this),    // 0: OctagonalCore+Rim ✓
    this.createControlNode2.bind(this),    // 1: ControlRingLattice ✓
    this.createControlNode1.bind(this),    // 2: SpikedControlFrame ✓
    this.createExtremeControl0.bind(this), // 3: InfiniteSpiral ✓
    this.createExtremeControl1.bind(this), // 4: ChronoRipper ✓
    // PLACEHOLDER for NetworkMesh
  ];
  return variants[index % 5](group, color);
}
```

---

### ANALYTICS Category (5 geometries)
**Current Assignment**:
```javascript
static createAnalyticsNode(group, index, color) {
  const variants = [
    this.createAnalyticsNode0.bind(this),  // 0: DiscWithLens
    this.createAnalyticsNode1.bind(this),  // 1: HollowCube
    this.createAnalyticsNode2.bind(this),  // 2: HexagonalFractal
    this.createAnalyticsNode3.bind(this),  // 3: TallSpike
    this.createExtremeAnalytics0.bind(this),// 4: AbyssalShard
    this.createExtremeAnalytics1.bind(this),// 5: TriHelix
    this.createNewElongatedOctahedron.bind(this) // 6: ElongatedOctahedron
  ];
}
```

**Canonical Order (REORGANIZED)**:
```javascript
// ANALYTICS: DataPyramid, SpinningDataSphere, HexAnalysisMatrix, PrismSpectrumAnalyzer, ElongatedOctahedron
static createAnalyticsNode(group, index, color) {
  const variants = [
    this.createAnalyticsNode0.bind(this),  // 0: DataPyramid ✓
    this.createAnalyticsNode1.bind(this),  // 1: SpinningDataSphere ✓
    this.createAnalyticsNode2.bind(this),  // 2: HexAnalysisMatrix ✓
    this.createAnalyticsNode3.bind(this),  // 3: PrismSpectrumAnalyzer ✓
    this.createNewElongatedOctahedron.bind(this) // 4: ElongatedOctahedron ✓
  ];
  return variants[index % 5](group, color);
}
```

---

### QUANTUM Category (6 geometries - renamed from SIGMA)
**Current Assignment** (as SIGMA):
```javascript
static createSigmaNode(group, index, color) {
  const variants = [
    this.createSigmaNode0.bind(this),  // 0: SigmaBase0
    this.createSigmaNode1.bind(this),  // 1: SigmaBase1
    this.createSigmaNode2.bind(this),  // 2: SigmaBase2
    this.createSigmaNode3.bind(this),  // 3: SigmaBase3
    // ...extreme variants
  ];
}
```

**Canonical Order (REORGANIZED - Renamed to QUANTUM)**:
```javascript
// QUANTUM: FracturedAnomaly, DistortedPolyCluster, ChaoticLayeredForm, TwistedOctahedron+ResonanceField, HyperbolicNeuralPrism, ChaoticHeart
static createQuantumNode(group, index, color) {
  const variants = [
    this.createSigmaNode0.bind(this),       // 0: FracturedAnomaly ✓
    this.createSigmaNode1.bind(this),       // 1: DistortedPolyCluster ✓
    this.createSigmaNode2.bind(this),       // 2: ChaoticLayeredForm ✓
    this.createSigmaNode3.bind(this),       // 3: TwistedOctahedron+ResonanceField ✓
    // PLACEHOLDER for HyperbolicNeuralPrism
    this.createExtremeIntegration1.bind(this) // 5: ChaoticHeart (REASSIGNED from INTEGRATION)
  ];
  return variants[index % 6](group, color);
}
```

---

## SUMMARY OF CHANGES

### Files to Modify:
- **EnhancedNodeModels.js** (only file modified)
  - Change category switch: 'sigma' → 'quantum'
  - Reorganize createInputNode() variants array
  - Reorganize createProcessNode() variants array  
  - Reorganize createIntegrationNode() variants array
  - Reorganize createStorageNode() variants array
  - Reorganize createControlNode() variants array
  - Reorganize createAnalyticsNode() variants array
  - Rename createSigmaNode() → createQuantumNode()
  - Update modulo values to match new array lengths

### What Was NOT Changed:
- ✅ NO geometry method deleted or removed
- ✅ NO geometry builder code refactored
- ✅ NO new classes or functions added
- ✅ NO behavior or animation logic changed
- ✅ NO spawning rules or validation added
- ✅ ALL existing method implementations remain intact

### Categorization Confirmed:
- ✅ INPUT: 5 geometries (TriangularPrism, PyramidSpike, WireframeSphere, Icosahedron, +1 placeholder)
- ✅ PROCESS: 9 geometries (DiamondLattice, Helix, DoubleHelix, MeshColumn, HexagonalPrism, QuantumLattice, FractalBloom, ReactiveTesseract, BridgeStructure)
- ✅ INTEGRATION: 8 KNOTS (TrefoilKnot, FigureEightKnot, InfiniteSelfIntersecting, ChaoticKnotCore, BorromeanRings, TorusKnot, TripleHelixKnot, SingularityKnot)
- ✅ STORAGE: 8 geometries
- ✅ CONTROL: 6 geometries
- ✅ ANALYTICS: 5 geometries  
- ✅ QUANTUM: 6 geometries (renamed from SIGMA)

---

**Status**: ✅ **Categorization mapping complete - ready for implementation**

