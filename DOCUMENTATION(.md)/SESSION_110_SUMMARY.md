# Session 110: Camera Stutter Fix & Node Spawn Safety

## Task 1: Camera Stutter Elimination
**Goal:** Decouple camera updates from expensive raycasting to ensure smooth movement.

**Implementation:**
- Modified `NodeLinkingSystem.js`
- Added `_checkCameraMotion()`: Detects camera position/rotation changes per frame.
- Updated `updateNodeHoverStates()`:
  - Checks camera motion status first.
  - **Throttles raycasting** to 10Hz (every 100ms) when camera is moving.
  - Resumes 60Hz (per frame) precision when camera is static.
  - This prevents the heavy raycast loop from blocking the render thread during camera sweeps.

**Result:**
- Camera movement remains smooth (uncoupled from interaction logic).
- Node selection is responsive when interaction is intentional (hover/stop).

## Task 2: Single-Instance Node Enforcement
**Goal:** Prevent duplicate spawning of unique archetypes (Mythic, Prime, etc).

**Implementation:**
- Modified `AINodes.js`
- Added `nodeRegistry` Map to track active singleton nodes.
- Added `_getRegistryKey(category, archetype)` logic:
  - **Generic Categories** (input, process, etc.) -> Returns `null` (allow multiples).
  - **Specific Archetypes** (MYTHIC-CEREMONIAL, etc.) -> Returns unique key.
- Updated `spawnNode()`:
  - Checks registry before spawning.
  - If duplicate found: **BLOCKS spawn**, returns existing node, and triggers soft highlight.
  - If new: Spawns and registers node.
- Updated `dispose()` to clear registry on world reset.

**Result:**
- Unique archetypes are guaranteed singletons.
- Standard nodes can still spawn multiple instances.
- Re-requesting an existing node safely returns the active instance instead of creating a ghost/overlap.
