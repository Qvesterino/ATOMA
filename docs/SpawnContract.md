# Spawn Contract (v1.0 — post Phases 1–12)

## Single Entry
- All spawns must enter via `requestSpawn()` → `_processSpawnRequests()` → `#spawnNode()`.

## Guard Layers (max 4)
1. `validateSpawnRequest()` — category validation, uniqueness, canonical fallback (single point).
2. `ensureFactoryReadyAndVisual()` — registry + canonical visual presence.
3. `createNode()` — factory realization (no remap/fallback).
4. Final integrity check + attach to scene.

## Fallback Rules
- Only `validateSpawnRequest` may remap/abort a category.
- LegacyNodeModelFilter is warn-only; no remap/block.

## State & Determinism
- `spawnState { phase, lastSpawnTime, cooldownMs, seed }`
- `spawnStats { attempts, success, skippedCap, lastSpawnAt }`
- `spawnHealth { successRate, avgAttemptsPerSuccess, lastFailureReason, blockedByCap, blockedByUniqueness }`
- Deterministic visual selection: seedable via `setSpawnSeed(seed)`.

## Isolation
- Spawn mutates only:
  - node registry / unique registry
  - scene attach
  - postSpawnObservers
- All side-effects (metrics attach, link jobs, wave debug, HUD counts) run via postSpawnObservers.

## Diagnostics
- `spawnDiagnostics.report(...)` gated by `window.__SPAWN_DIAG === true`.
- `_traceSpawn` gated by `window.__SPAWN_TRACE === true`.
- `_lastSpawnResult` records stage+reason for last attempt.
- `getSpawnDeterminismState()` exposes seed + counters.

## Link Growth
- `ATOMA_LINK_SPAWN_ENABLED` defaults to true; link spawns respect cap & cooldown; diagnostics on by default for tests.

## Prohibited
- No direct calls to `#spawnNode` or direct category remap in `createNode`.
- No metric or AI mutations outside observers.

