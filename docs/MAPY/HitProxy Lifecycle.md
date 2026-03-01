**HitProxy lifecycle (observed code paths)**  
- **Registry init:** `_HitProxyIntegrationPatch.applyHitProxyIntegration` → `setupHitProxySystem(scene, aiNodes, …)` creates `HitProxySystem` with `HitProxyRegistry` and `HitProxyController`, then `initialize()` builds proxies for existing nodes and sets `setupDone=true` ( _HitProxySystem_v1.js_ around 500–520, 420–450). Registry lives on `hitProxySystem.registry`.  
- **Global publish:** `applyHitProxyIntegration` sets `window.hitProxySystem` and `window.safeProxyRaycaster` immediately after setup ( _HitProxyIntegrationPatch.js_ ~200–240).  
- **HITPROXY_READY true:** Only the **AutoRegistrar** flips it. `HitProxyAutoRegistrar.updateReadyGate()` sets `window.HITPROXY_READY = ready` when system+registry exist, `getAllProxies().length > 0`, and every proxy has `targetNodeId`; logs first true transition ( _HitProxyAutoRegistrar.js_ ~150–210). Called after each proxy registration and during rebuild.  
- **HITPROXY_READY reset false:**  
  - On registrar `cleanup()` (world reset hook) sets `HITPROXY_READY=false` and clears `_HITPROXY_READY_LOGGED` after removing proxies and clearing registry ( _HitProxyAutoRegistrar.js_ ~230–260).  
  - `updateReadyGate()` sets false on error.  
- **Proxy registration:**  
  - Initial batch: `HitProxySystem.initialize()` builds proxies for all current nodes (registry.registerProxy) and adds to scene; but does **not** touch HITPROXY_READY.  
  - Ongoing: `HitProxyAutoRegistrar.registerNodeProxy()` creates sphere, registers it to `hitProxySystem.registry`, adds to scene, tracks, then calls `updateReadyGate()` ( _HitProxyAutoRegistrar.js_ ~90–140).  
- **Disposal / world rebuild:**  
  - Registrar hooks `game.resetWorld` to run `cleanup()` before original reset ( _HitProxyAutoRegistrar.js_ ~330–345).  
  - In `main.js` world rebuild block, existing `hitProxySystem` is **not** disposed; instead registrar cleanup runs via hook, clearing registry and HITPROXY_READY before the rebuild executes.

**World rebuild ordering (main.js)**  
1) `applyHitProxyIntegration` (creates system + initial proxies, publishes globals).  
2) `setupHitProxyAutoRegistrar(this)` (attaches to game, hooks resetWorld, starts tracking).  
3) Later world rebuild (`main.js` ~5215–5240): glyph layer & world roots are replaced. No explicit hit-proxy teardown there; registrar hook handles cleanup when `resetWorld` is invoked.  
4) Node spawning after reset: AINodes likely respawn; registrar auto-wrap of spawn not shown, but initial HitProxySystem `hookNodeSpawning()` is empty ( _HitProxySystem_v1.js_ ~433–440), so continuous coverage relies on registrar registering proxies for existing and newly spawned nodes via its own listeners (setup() not shown but implied).  
5) HITPROXY_READY flips true only after registrar has registered at least one valid proxy post-rebuild.

**Race / integrity checks**  
- **Node spawn before registrar attaches?** Possible: If nodes are spawned between `applyHitProxyIntegration` and `setupHitProxyAutoRegistrar`, only the system’s initial batch covers existing nodes; new spawns during that gap won’t get proxies until registrar setup completes (but gap is a few lines in main init).  
- **HITPROXY_READY true before registry populated?** No: `updateReadyGate` requires `getAllProxies().length > 0` and all proxies have `targetNodeId`. Initial proxies built by HitProxySystem do **not** trigger the gate; HITPROXY_READY stays false until registrar registers something and calls `updateReadyGate()`.  
- **Registry cleared while HITPROXY_READY stays true?** Unlikely in intended flow: registrar `cleanup()` sets HITPROXY_READY false when clearing. However, external `hitProxySystem.registry.clear()` calls (none seen) could clear without updating the flag; also `HitProxySystem.clear()` (not invoked) would not touch HITPROXY_READY. Thus flag can become stale if registry is cleared by other code.

**Points where registry can become empty**  
- Registrar `cleanup()` on world reset (sets HITPROXY_READY false).  
- Manual `hitProxySystem.clear()` (would empty registry but not flip flag).  
- Disposal of proxies inside registrar cleanup or rebuild.  
- If applyHitProxyIntegration fails and hitProxySystem undefined.

**Reliability of HITPROXY_READY**  
- Accurate for “proxies exist and have targetNodeId” only when registrar is sole mutator.  
- Becomes unreliable if registry is cleared outside registrar or HitProxySystem.clear() is called; flag would remain true.  
- It also does not encode `setupDone` status of HitProxySystem (but registrar’s gate checks registry size, which indirectly reflects setup).

**Most fragile step**  
- Dependence on **AutoRegistrar** for the readiness flag: HitProxySystem itself doesn’t drive HITPROXY_READY. If registrar fails to initialize (e.g., `window.hitProxySystem` missing, AINodes missing), flag stays false and hover/selection pipelines are gated off despite proxies created by the system.