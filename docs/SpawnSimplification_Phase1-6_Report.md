# Spawn Simplification — Phases 1–6 (session report)

## Completed work (this session)
- **Phase 1 – Guard consolidation:** Vytvorená `validateSpawnRequest()` a `ensureFactoryReadyAndVisual()`; queue je jediný gateway; token je len interný.
- **Phase 2 – Visibility & Traceability:** Zavedené diagnostiky `spawnDiagnostics.report(...)`, `_traceSpawn`, `_lastSpawnResult` (stage + reason), všetky aborty majú centralizovaný log hook (gated `window.__SPAWN_DIAG` / `__SPAWN_TRACE`).
- **Phase 3 – Entry Point Purification:** Overené, že neexistujú priame volania `#spawnNode`; všetky špecializované API volajú len `requestSpawn()`.
- **Phase 4 – Spawn State Simplification:** Jednotná štruktúra `spawnState { phase, lastSpawnTime, cooldownMs }`, alias `setSpawnMode→setSpawnPhase`; štatistiky `spawnStats` doplnené o attempts/success.
- **Phase 5 – Fallback unification:** Jediný fallback bod je v `validateSpawnRequest`; z `createNode` odstránené dodatočné mapovania na `input/process`; ponechaný iba `LegacyNodeModelFilter` pre vizuálnu bezpečnosť.
- **Phase 6 – Performance/Cleanness:** Debug logy gateované cez flag, mikro‑čistka index výberu vizuálu, odstránené mŕtve polia.

## Aktuálny stav pipeline
`requestSpawn → _processSpawnRequests → #spawnNode → validateSpawnRequest → ensureFactoryReadyAndVisual → createNode → finalIntegrityCheck → attachToScene`

## Pozorovania
- `_lastSpawnResult` teraz vždy odráža posledný abort/úspech (stage + reason).
- `spawnStats` trackuje attempts/success/skippedCap; `spawnState.phase` riadi celý vstup.
- Všetky fallbacky a unikátne bloky sa vyhodnocujú raz, hneď po vstupe do `#spawnNode`.

## Odporúčané TODO (next steps)
1) **Diag surface:** pridať ľahký getter `getLastSpawnResult()` a `getSpawnStats()` pre externé UI/console (read‑only).  
2) **Pool visibility:** pri `POOL_EMPTY` doplniť diag hook s ukážkou chýbajúcich vizuálov (len ak `__SPAWN_DIAG`).  
3) **Lightweight test:** spustiť krátky smoke (1 valid, 1 invalid kategória) a uložiť result do `memory/YYYY-MM-DD.md`.  
4) **Legacy filter review:** skontrolovať, či `LegacyNodeModelFilter` ešte musí fallbackovať na `input`; ak nie, logovať warning namiesto zmeny kategórie.  
5) **Perf:** zvážiť throttle `spawnDiagnostics.report` (debounce) ak bude zapnutý dlhšie časovo.

## Files touched (this session)
- `AINodes.js` — guard konsolidácia, diag, state, fallback cleanup, micro‑perf.

