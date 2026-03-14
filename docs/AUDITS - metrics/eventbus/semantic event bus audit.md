**Event Systems Found**
- `SemanticEventBus` (lightweight queued bus) implemented in `D:\ATOMA_CLEAN\main.js:1055–1750`. Instantiated in the game constructor at `D:\ATOMA_CLEAN\main.js:3138` and exposed on `window.semanticBus`. Active and central; drains every frame (`main.js:9378`).
- `PHASE5_MultiNetworkManager` event queue/callback hub in `D:\ATOMA_CLEAN\PHASE5_MultiNetworkManager_v1.js:330–410`, consumed by `PHASE5_MultiNetworkOrchestrator_v1.js:35–120`. Instantiated and registered in `D:\ATOMA_CLEAN\main.js:6194–6216`. Active for corruption events.
- Link micro‑impulse event bridge (`LinkMicroImpulseAdapter_v1`) in `D:\ATOMA_CLEAN\LinkMicroImpulseAdapter_v1.js:286–470`, wired by `D:\ATOMA_CLEAN\LinkMicroImpulseIntegrationSetup.js:12–68`, called from `D:\ATOMA_CLEAN\main.js:4517` (setup) and `11941–11965` (method). Uses CustomEvent/addEventListener on `game.nodeLinking`; active if NodeLinking emits.
- Local emitters: `NodeStateMachine_v1` (`D:\ATOMA_CLEAN\NodeStateMachine_v1.js:444–470`), `LinkCollapseSystem` (`D:\ATOMA_CLEAN\LinkCollapseSystem.js:82–115`), CustomEvent publishers in `D:\ATOMA_CLEAN\ComputeSynergyScore2_0.js:423–490`. These appear auxiliary; no in-repo listeners found for the CustomEvents.

**SemanticEventBus – Emitters**
- `main.js`: network/node/link lifecycle (`6040`, `6408`, `6440`), metrics spike (`9433`), camera motion (`9492`), HUD visibility (`9548`), node selection (`11501`, `11510`).
- `_MythicRitualController.js`: ritual started/completed (`267`, `1050`).
- `_NodeEvolution2_0.js`: semantic ascension (`469`).

**SemanticEventBus – Subscribers**
- `main.js`: internal listeners for camera motion & node selection (`3867–3874`).
- `WaveBurstRouter_v1.js`: subscribes to semantic signals (`274–299`) to drive wave bursts; unregisters on teardown (`353–360`).
- `_GlyphFusionOverlay4_1.js`: listens to network/semantic events (`151–188`) for overlay updates.

**MultiNetwork Manager Bus**
- Emitters: internal `emitEvent` on register/unregister/propagation (`PHASE5_MultiNetworkManager_v1.js:100–210, 330–410`); corruption threshold publishers in `PHASE5_CorruptionBridge_v1.js:241` and `PHASE5_NetworkSynchronization_v1.js:372`; `HarmonyStabilizationSystem_v1.js:1146–1157` uses `multiNetworkManager.emitEvent`; `CorruptionVisualIntegrationPatch_v1.js:165–210` calls `multiNetworkManager.emit` (method name mismatch vs `emitEvent` – potential bug).
- Subscribers: `main.js` handles `corruptionThresholdCrossed` to trigger visuals (`6214–6236`); `PHASE5_MultiNetworkOrchestrator_v1.js:95–135, 203–236` routes events to bridges/visuals; corruption feedback visuals react via the same listener path (visual-only).

**Link Micro-Impulse Event Path**
- Adapter hooks `addEventListener` or `.emit` on `game.nodeLinking` for linkCreated/pulseReached/harmonicLock/synergyThreshold/corruptionSpread/influenceExpanded (`LinkMicroImpulseAdapter_v1.js:310–360`). Emits CustomEvents back to the source via `emitEvent` (`523–565`). Active if NodeLinking actually fires these events (no emitters found in repo; likely dormant/partial).

**Other Emit/On Systems (localized)**
- `LinkCollapseSystem.js`: simple on/_emit for link state events (`82–115`); not referenced elsewhere → likely dormant.
- `NodeStateMachine_v1.js`: on/off/emit for state transitions (`444–470`); only used in examples.
- `ComputeSynergyScore2_0.js`: dispatches window CustomEvents `synergyAuraPulse`, `synergyHighwayIntensity`, `synergyBeamGlowBoost` (`423–490`); no listeners detected → legacy or unused.

**Central Dispatcher**
- The only project-wide bus is `SemanticEventBus` in `main.js`. It is initialized on game construction, exposed globally, and actively used by multiple systems (network lifecycle, rituals, overlays, wave router).

**Activity Assessment**
- SemanticEventBus: ACTIVE (wired, emitting, and subscribed).
- MultiNetwork event callbacks: ACTIVE for corruption threshold flow; slight API mismatch (`emit` vs `emitEvent`) in `CorruptionVisualIntegrationPatch_v1`.
- LinkMicroImpulse bus: PARTIAL/DORMANT; wiring is initialized, but no confirmed emitters from NodeLinking found in repo.
- NodeStateMachine/LinkCollapse/CustomEvent publishers: LEGACY/UNWIRED (no active listeners observed).

No code was modified; verification not run (read-only audit).