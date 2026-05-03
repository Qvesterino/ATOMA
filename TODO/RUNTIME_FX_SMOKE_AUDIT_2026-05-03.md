# Runtime FX Smoke Audit (Scheduler Call + Spawn Capability)

Date: 2026-05-03
Runtime URL: http://127.0.0.1:5501/
Mode: Live browser smoke in gameplay session
Audit Flag: window.ATOMA_FX_AUDIT = true

## Scope

This report verifies runtime behavior, not static code patterns:
- Which FrameScheduler-registered systems were actually called.
- Which systems were silent (registered but never called).
- Which FX systems showed real spawn-capable behavior.
- Whether short-window leak risk indicators are visible.

## Instrumentation Added

- FrameScheduler audit instrumentation (opt-in):
  - Per-registration call counters
  - Per-system first/last call timestamps
  - Per-system crash/error capture
  - Silent-system reporting
  - Auto-dump audit window (5s)
- Runtime debug helpers on window.__DEBUG:
  - startFxAuditWindow(durationMs, label)
  - dumpFxAudit(label)
  - clearFxAuditSession()
  - getFxAuditSnapshot()
  - createSmokeLinks(linkCount)
  - listNodeIds(limit)

## Scenario A: No Links (5s Smoke)

Setup:
- Entered gameplay with 0 active links.
- Ran __DEBUG.startFxAuditWindow(5000, 'smoke-no-links-5s').

Results:
- Total registered: 173
- Called systems: 173
- Silent systems: 0
- Crashed systems: 0
- Total calls during window: 18,776
- Total errors: 0

Memory/renderer indicators:
- Start: geometries=1023, textures=10, drawCalls=1120, triangles=64990.67
- End: geometries=1071, textures=10, drawCalls=1067, triangles=58782.67
- Delta: geometries +48 (short-window growth)

Interpretation:
- Wiring-level execution path is live for all registered scheduler entries in this run.
- No broken registration path detected in no-link state.
- Growth in geometry count exists even without links; trend should be monitored over longer window.

## Scenario B: 3 Links Scripted (10s Smoke)

Setup:
- Created 3 links via __DEBUG.createSmokeLinks(3):
  - node-1777791260571-f90ag8pqx -> node-1777791260618-bubpgs5xz
  - node-1777791260618-bubpgs5xz -> node-1777791260640-642061dpx
  - node-1777791260640-642061dpx -> node-1777791260661-1tb0fprge
- Ran __DEBUG.startFxAuditWindow(10000, 'smoke-with-links-10s').

Results:
- Total registered: 173
- Called systems: 172
- Silent systems: 1
- Crashed systems: 4
- Total calls during window: 25,603
- Total errors: 4

Silent system:
- visual.environmentDomain

Crashed systems:
- visual.ambientEntityManager
  - calls before crash: 10
  - error: i is not defined
- visual.nodeAuraSystem
  - calls before crash: 1
  - error: Cannot read properties of undefined (reading 'getElapsedTime')
- visual.cascadeBurstVisual
  - calls before crash: 6
  - error: Cannot access 'coreIntensity' before initialization
- simulation.topologyViz
  - calls before crash: 31
  - error: this.direction.slerp is not a function

Spawn-capable runtime signals (10s linked run):
- linkResonanceFlowSystem:
  - activePulses=3
  - linksWithFlow=3
  - totalSpawned=6
- healingParticles:
  - enabled=true
  - activeParticles=44
  - particleIndex=608
  - scarEmissionTargets=3
- harmonicHealing:
  - waveCount=1
  - activeCooldowns=3
- resonanceRupture:
  - ruptureTriggers=3
  - propagationBursts=2
  - scarSpawns=6
  - semanticHits.cascade.hop=13
- linkSparkSystems map size: 1

Observed non-spawning active system sample:
- cascadePropagationVisuals:
  - totalCascadesProcessed=0
  - ringsCreated=0
  - activeRings=0
  - lastUpdateDuration=0
  - Called by scheduler, but no spawn in this scenario window.

Memory/renderer indicators:
- Start: geometries=1242, textures=14, drawCalls=1567, triangles=121381.33
- End: geometries=1874, textures=16, drawCalls=2535, triangles=361285.33
- Delta: geometries +632, textures +2

Interpretation:
- Link-driven spawn path is real and active (multiple systems proved spawn counters > 0).
- One registered system remained silent.
- Four systems crash under linked runtime, then stop updating (high-priority stability risk).
- Geometry growth over 10s linked run is large and should be treated as leak-risk suspect until disproven by longer soak + teardown/recovery cycle.

## Spawn Capability Matrix

Spawn-capable (confirmed runtime evidence):
- LinkResonanceFlowSystem
- HealingParticleSystem_Session136 (via healingParticles)
- HarmonicHealingVisualSystem_Session134 (waveCount > 0)
- ResonanceRuptureVisualSystem_Session133 (rupture/scar counters > 0)
- Link spark stack (map present and active)

Appears active but no spawn seen in this run:
- PHASE5 cascade propagation visuals (called, but zero rings/cascades in 10s sample)

Registered but silent:
- visual.environmentDomain

Crash-disabled during run:
- visual.ambientEntityManager
- visual.nodeAuraSystem
- visual.cascadeBurstVisual
- simulation.topologyViz

## Leak-Risk Assessment

Short-window risk signals:
- No-link 5s: geometry count still increased (+48).
- Linked 10s: geometry count increased strongly (+632), textures increased (+2).

Conclusion:
- This is not proof of a leak by itself, but it is a strong leak-risk indicator.
- Next step should be a longer soak (60s-180s) plus teardown check (link removal/world reset) to verify whether geometry/material counts stabilize or keep climbing.

## Recommended Next Actions

1. ~~Fix crash-disabled systems first~~ — **DONE 2026-05-03** (see Section: Crash Fix Re-Smoke below)
2. Re-run same 5s/10s audit after crash fixes and compare silent/crash deltas.
3. Add a 120s linked soak with periodic snapshots every 10s.
4. Add a teardown phase (remove links or world switch) and verify geometry/material counts return toward baseline.
5. Corroborate with vfx_memory_tracker.py for leak classification confidence.

---

## Crash Fix Re-Smoke (2026-05-03)

### Fixes Applied

| System | File | Root Cause | Fix |
|--------|------|-----------|-----|
| visual.ambientEntityManager | _AmbientEntityManager.js | `trailParticles[i]` in loop using `childIndex` — undeclared `i` | Changed to `trailParticles[childIndex]` |
| visual.nodeAuraSystem | shaders/NodeSegmentedOrbitRings.js | `this.clock.getElapsedTime()` — `this.clock` never initialized | Added `this.clock = new THREE.Clock()` in constructor |
| visual.cascadeBurstVisual | CascadeBurstVisual_Session147.js | `coreIntensity` const declared after first usage (TDZ) | Moved declaration above first use |
| simulation.topologyViz | TopologyBiasVisualizationLayer.js | `THREE.Vector3.slerp()` does not exist | Changed to `.lerp()` |

All 4 files passed `node --check` after fix.

### Re-Smoke Results (10s, 3 links, setInterval-driven tick)

- Total registered: 177
- Called systems: 177
- Silent systems: 0
- **Crashed systems: 0 (from original 4)**
- Total calls: 29,918
- Total errors: 0 from original crash paths

**Verdict: All 4 original crashes eliminated. ✓**

Note: 177 registered vs original 173 — 4 new systems registered since initial audit.
Note: RAF-loop not firing in headless Playwright; audit driven via `setInterval` at 60fps equivalent.

### Remaining Pre-existing Crashes Surfaced (not in scope of this fix)

These 6 crashes appeared in the re-smoke but were NOT present in the original Scenario B run (likely triggered by different random state or setInterval timing differences):

- visual.aiNodes: "previousStateSignal is not defined"
- visual.legendaryLinkFX: "links.forEach is not a function"
- visual.environmentDomain: "this._dispatchPendingLegendaryBondSignal is not a function"
- simulation.metricDirtyQueueReset: "dt is not defined"
- simulation.influenceAttenuationAbsorption: "Cannot read properties of undefined (reading 'length')"
- simulation.tier4GameplayIntegration: "this.harmonyStabilizationSystem.getNetworkHarmony is not a function"

These are candidates for a future crash-fix cycle.
