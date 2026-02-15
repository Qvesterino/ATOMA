# world-switch.contract.md
Status: DRAFT (Constitution Phase: Worlds)
Scope: World switching, world lifecycle, teardown/re-init safety.
Out of scope: nodes, links, raycast, metrics, node visuals, shaders.

## 0) Glossary

- **World**: environment/map domain (sigma/memory/fractal/quantum/desert/chamber…).
- **WorldSwitch**: canonical transition from one world to another.
- **WorldManager**: the single authority that performs WorldSwitch (may initially live inside main.js, but must be logically centralized).
- **worldRoot**: THREE.Group that contains ALL world-owned objects.
- **Switch Transaction**: an atomic, deterministic sequence of phases with strict gating.

## 1) Authority

### 1.1 Single Authority Rule (HARD)
Only `WorldManager` may:
- set/modify `currentMode` (or equivalent world identifier)
- trigger world teardown
- trigger world init
- toggle `worldSwitchInProgress` or `worldState`

Input handlers (e.g. keydown 'M') MUST NOT:
- mutate `currentMode`
- call `setup*Environment()` directly
They may only call `WorldManager.requestSwitch(reason, desiredMode?)`.

### 1.2 Authority Surface (Minimal)
WorldManager exposes:
- `requestSwitch({ reason, direction | nextMode })`
- `switchTo(nextMode)` (internal; guarded)
- `getCurrentMode()`
- `isSwitchInProgress()`

## 2) WorldSwitch State Machine

WorldManager MUST maintain a canonical state machine:

- `RUNNING`
- `SWITCHING_FREEZE`
- `SWITCHING_TEARDOWN`
- `SWITCHING_INIT`
- `SWITCHING_START`
- `RUNNING` (again)
- `FAILED` (fail-closed state)

Allowed transitions:
- RUNNING -> SWITCHING_FREEZE
- SWITCHING_FREEZE -> SWITCHING_TEARDOWN
- SWITCHING_TEARDOWN -> SWITCHING_INIT
- SWITCHING_INIT -> SWITCHING_START
- SWITCHING_START -> RUNNING
- Any state -> FAILED (on unrecoverable error)

## 3) Switch Transaction Phases (Canonical)

### Phase A: FREEZE (Gate Everything)
Requirements:
- Set `worldSwitchInProgress = true`
- Enter state `SWITCHING_FREEZE`
- Disable world-tick execution (not necessarily renderer RAF)
- Prevent any world mutation from non-authoritative code during switch

Hard requirements:
- No world update calls during FREEZE except those driven by WorldManager for cleanup.
- No new world objects may be created/added during FREEZE (except cleanup helpers).

### Phase B: STOP (Stop World Runtime)
Requirements:
- Unregister world tasks from FrameScheduler (if used)
- Stop any world-owned periodic processes (timers, events) — ideally none exist in world modules.

Hard requirements:
- After STOP, there must be no code path that can mutate worldRoot except WorldManager.

### Phase C: TEARDOWN (Remove Root + Dispose)
Requirements:
- Enter state `SWITCHING_TEARDOWN`
- Remove `worldRoot` from scene:
  - `scene.remove(worldRoot)`
- Dispose all GPU/CPU resources created by the old world:
  - geometries
  - materials (including arrays)
  - textures (if present)
  - custom render targets (if any)
- Null out world references:
  - `activeWorld = null`
  - `worldRoot = null` (after dispose)
  - any caches owned by world

Hard requirements:
- Teardown MUST NOT use brute-force `scene.children = filter(...)`.
- Teardown MUST NOT rely on `scene.traverse()` to find world objects.
- World cleanup MUST be `worldRoot`-scoped.

### Phase D: INIT (Create New World)
Requirements:
- Enter state `SWITCHING_INIT`
- Set new mode deterministically:
  - `currentMode = nextMode`
- Create a fresh `worldRoot`:
  - `worldRoot = new THREE.Group()`
  - `worldRoot.name = "ATOMA_WorldRoot"`
  - `scene.add(worldRoot)`
- Instantiate world module with injected deps:
  - `newWorld = WorldFactory.create(nextMode, { scene, worldRoot, seed, rng, clock })`
- `newWorld.init()` may create objects ONLY under worldRoot.

Hard requirements:
- All world objects MUST be parented under `worldRoot` (directly or indirectly).
- World init MUST NOT add objects directly to `scene`.

### Phase E: START (Register Runtime)
Requirements:
- Enter state `SWITCHING_START`
- Register world update into scheduler or engine loop via WorldManager:
  - `WorldManager.tickWorld(deltaTime, time)`
- Only after start completes:
  - set `worldReady = true`

Hard requirements:
- If any registration fails, transition to FAILED and do not resume RUNNING.

### Phase F: UNFREEZE (Commit)
Requirements:
- Set state back to `RUNNING`
- Set `worldSwitchInProgress = false`
- Emit `WorldChanged` event (optional) AFTER commit, never mid-switch.

## 4) Determinism & Seed Contract (Switch-Related)

WorldManager MUST define:
- `worldSeed` (per mode) derived from:
  - globalSeed + mode + switchIndex (or explicit mapping)
- What resets on switch:
  - world-only ephemeral state MUST reset
- What persists across switch:
  - only worldManager-owned persistent state (explicit list)

Hard requirement:
- For same inputs (globalSeed + switch sequence), worlds MUST be reproducible.

## 5) Forbidden Patterns (HARD)

The following are forbidden in world switching:

1) Input handler directly mutates mode:
   - `keydown('M') -> this.currentMode = ...` ❌
2) Input handler directly calls setup functions:
   - `keydown('M') -> setupSigmaEnvironment()` ❌
3) Brute-force scene clearing:
   - `scene.children = scene.children.filter(...)` ❌
4) World objects added directly to scene:
   - `scene.add(worldMesh)` inside world modules ❌
5) World teardown via full-scene traversal:
   - `scene.traverse(...)` to find world objects ❌
6) Independent time sources not lifecycle-bound:
   - `setInterval` without `clearInterval` on switch ❌
   - independent RAF loops for world logic ❌
7) Mixed ownership:
   - world creates object, other subsystem disposes it (or vice-versa) ❌

## 6) Required Invariants

After a successful switch, all must be true:

- Exactly one `worldRoot` exists and is attached to `scene`.
- All world environment objects are descendants of `worldRoot`.
- No disposed world objects remain in scene graph.
- No world-owned timers/intervals remain running.
- `worldSwitchInProgress === false` and `worldState === RUNNING`.
- `currentMode` is consistent across:
  - WorldManager
  - activeWorld instance

## 7) Minimal Compliance Tests (Static/Runtime)

Static checks:
- grep: no `setup*Environment()` called from input handler
- grep: no `scene.children = filter` in switch
- grep: world modules contain no `scene.add(` (only `worldRoot.add(`)

Runtime sanity:
- switch 50 times: no progressive FPS drop / no GPU memory creep
- switch during stress: no exceptions, no partially alive old world

---
END
