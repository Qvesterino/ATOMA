# Storage & Control Enhanced Variants (Session 109 Update)

## 1. Overview
This update completes the "Visual Content Expansion" for the **Storage** and **Control** node categories. Following the "Process" category precedent, these static placeholders have been replaced with highly kinetic, "AI-Grown" designs that feel alive and mechanical.

## 2. New Storage Variants (Silver/Pale Blue)
*Theme: Data Persistence, Weaving, Containment*

### A. DataWeaver (formerly ArchiveNexus)
*   **Concept**: A digital loom weaving data into persistent memory.
*   **Visuals**: 4 vertical strands with floating "shuttles" weaving between them.
*   **Animation**: Strands oscillate rhythmically; shuttles drift vertically and horizontally between strands.
*   **Code**: `STORAGE_ARCHIVE_NEXUS`

### B. VaultStack (formerly MemoryCrypts)
*   **Concept**: A secure, shifting combination lock mechanism.
*   **Visuals**: Stack of 5 asymmetric hexagonal chambers with locking pins.
*   **Animation**: Chambers rotate in alternating directions; the whole stack "breathes" vertically as if unlocking.
*   **Code**: `STORAGE_MEMORY_CRYPTS`

### C. ContainmentField (formerly DepthLayers)
*   **Concept**: Unstable data singularities held in check by rotating forcefields.
*   **Visuals**: 3 nested icosahedral shells with orbiting data particulates.
*   **Animation**: Shells rotate on random independent axes; shells expand/contract (breathe) to contain the core.
*   **Code**: `STORAGE_DEPTH_LAYERS`

## 3. New Control Variants (Red/Magenta)
*Theme: Authority, Decision, Hierarchy*

### A. SynapseFork (formerly DecisionFork)
*   **Concept**: A neural decision tree pulsing with command authority.
*   **Visuals**: Asymmetric branching structure with orbiting "convergence nodes".
*   **Animation**: Branches pulse with emissive energy; convergence nodes orbit the trunk in undulating paths.
*   **Code**: `CONTROL_DECISION_FORK`

### B. CommandSpire (formerly AuthorityHelix)
*   **Concept**: A continuous, spiraling turbine of absolute order.
*   **Visuals**: A rotating helix wrapping a central axis, segmented by tiered rings.
*   **Animation**: Helix rotates continuously downward; rings counter-rotate and wobble.
*   **Code**: `CONTROL_AUTHORITY_HELIX`

### C. OverseerGrid (formerly CommandMatrix)
*   **Concept**: A distributed network of eyes/nodes observing the system.
*   **Visuals**: A 3x3 lattice of nodes connected by flux lines.
*   **Animation**: Individual nodes "bob" up and down independently; connection lines pulse in opacity.
*   **Code**: `CONTROL_COMMAND_MATRIX`

## 4. Integration Details
- **Files Modified**:
    - `StorageEnhancedVariants_Session81.js`: Full rewrite for kinetic geometry.
    - `ControlEnhancedVariants_Session83.js`: Full rewrite for kinetic geometry.
    - `EnhancedNodeModels.js`: Added animation blocks for all 6 variants in `animate()`.
- **Performance**:
    - Animations use `deltaTime` for frame-rate independence.
    - Geometry uses `BufferGeometry` where possible.
    - Animations are transform-only (rotation, position, scale) or material property pulses, avoiding expensive vertex updates.

## 5. Next Steps
- **Visual Polish**: Verify in-game lighting response for the new materials.
- **Gameplay**: Ensure hit-boxes (raycast targets) align well with the new moving geometries (the base `group` object handles this usually).
