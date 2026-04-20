# Cascade / Resonance / Rupture / Healing — System State Machine Contracts

> Generated from audit `SYSTEM_DEEP_DIVE_AUDIT_CASCADE_RESONANCE_RUPTURE_HEALING_2026-04-20.md`
> Covers init/update/dispose lifecycle for each subsystem.

---

## Universal Lifecycle Pattern

All systems in this domain follow the same three-phase lifecycle:

```
CONSTRUCT → INIT/REBIND → UPDATE (loop) → DISPOSE
                ↑              |
                └── rebind() ──┘  (world switch)
```

| Phase | Method | Called By | Purpose |
|-------|--------|-----------|---------|
| Construct | `constructor()` | `main.js` setup | Config, pool allocation, no scene access |
| Init | `init()` or first `rebind()` | `main.js` | Acquire scene refs, subscribe to events |
| Update | `update(dt, time, state)` | FrameScheduler | Per-frame simulation + visual |
| Rebind | `rebind({ linkingSystem, aiNodes, semanticBus, scene })` | `_rebindWorldLifecycleSystems()` | Re-acquire refs after world switch |
| Dispose | `dispose()` | World teardown | Release geometry, materials, subscriptions |

---

## 1. Cascade System

### CascadeEventBridge_v1
**Role:** Producer — writes `flowState` to `link.userData`

| Method | Signature | Notes |
|--------|-----------|-------|
| constructor | `(config)` | No scene refs needed |
| rebind | `({ linkingSystem, aiNodes, semanticBus })` | Re-acquires link/node access |
| update | `(deltaTime)` | Reads metrics, writes `link.userData.flowState` |
| dispose | `()` | Clears subscriptions |

**State:**
- `IDLE` → no active cascades
- `PROPAGATING` → writing flowState to links
- `DECAYING` → cascade ending, flowState normalizing

### CascadeParticleSystem_Session120
**Role:** Consumer — reads `link.userData.flowState`

| Method | Signature | Notes |
|--------|-----------|-------|
| constructor | `(config)` | Allocates particle pool, geometry |
| setSemanticBus | `(bus)` | Subscribe to cascade events |
| attachLinkLifecycleSource | `(linkingSystem)` | Track link create/destroy |
| update | `(deltaTime)` | Reads flowState, spawns/moves particles |
| dispose | `()` | Releases mesh, geometry, materials |

**State:**
- `DORMANT` → no particles active
- `EMITTING` → spawning particles on cascade links
- `FADING` → cascade ended, particles decaying

### CascadeResonanceWaveVisualization_Session146
**Role:** Visual — wave propagation between synchronized hubs

| Method | Signature | Notes |
|--------|-----------|-------|
| constructor | `(cascadeSystem, hubSystem, linkResonanceSystem, config)` | Allocates ring/beam/particle pools |
| rebind | `({ cascadeSystem, harmonicHubSystem, linkResonanceSystem, semanticBus, frameScheduler })` | Re-acquires all refs |
| update | `(deltaTime)` | Bootstraps waves from hubs, applies visual effects |
| spawnCascadeResonanceWave | `(sourceNode, targetNode, intensity, hopIndex)` | Creates a wave entry |
| dispose | `()` | Releases all pools, subscriptions |

**State:**
- `IDLE` → no active waves
- `BOOTSTRAPPING` → scanning hubs for eligible pairs
- `WAVE_ACTIVE` → waves propagating, visuals rendering
- `DECAYING` → waves fading, auto-cleanup

**Event subscriptions:** `cascade.start`, `cascade.hop` (via SemanticEventBus)

---

## 2. Resonance System

### HarmonicResonanceCoupling_v1
**Role:** Visual — node shimmer + link glow between resonance-paired nodes

| Method | Signature | Notes |
|--------|-----------|-------|
| constructor | `(config)` | Config only |
| registerLink | `(link)` | Start tracking a link for resonance |
| unregisterLink | `(link)` | Stop tracking |
| update | `(deltaTime, avgSynergy)` | Compute resonance, apply shimmer/glow |
| dispose | `()` | Release visuals |

**Visual territory:** Node shimmer + link glow (particles removed in v1.1)

### LinkResonanceFlowSystem_Session124
**Role:** Visual — traffic visualization (pulses traveling along links)

| Method | Signature | Notes |
|--------|-----------|-------|
| constructor | `(config)` | Pulse material templates |
| init | `()` | Initialize pulse mesh pool |
| rebindScene | `(scene)` | Re-acquire scene ref |
| update | `(deltaTime, links, camera)` | Spawn/update/cull pulses |
| clearLink | `(linkOrId)` | Remove all pulses for a link |
| dispose | `()` | Release meshes, materials |

**Visual territory:** Traveling pulses, flow direction, consensus state visualization

---

## 3. Rupture System

### CascadingRuptureSystem
**Role:** Gameplay — detects and propagates link ruptures

| Method | Signature | Notes |
|--------|-----------|-------|
| constructor | `(config)` | Config, thresholds |
| rebind | `({ linkingSystem, aiNodes, semanticBus })` | Re-acquire refs |
| update | `(deltaTime)` | Check rupture conditions, propagate |
| dispose | `()` | Clear state |

**State:**
- `MONITORING` → watching for rupture conditions
- `RUPTURING` → cascade rupture propagating
- `RECOVERING` → rupture stabilized, awaiting healing

---

## 4. Healing System

### HarmonicHealingVisualSystem_Session134
**Role:** Visual — healing waves traveling along damaged links

| Method | Signature | Notes |
|--------|-----------|-------|
| constructor | `(config)` | Wave pool allocation |
| attachScene | `(scene)` | Acquire scene ref |
| rebind | `({ linkingSystem, aiNodes, semanticBus, scene })` | Re-acquire all refs |
| update | `(deltaTime, time, networkState)` | Spawn/update healing waves |
| triggerWaveBatch | `(count)` | Debug: force spawn waves |
| dispose | `()` | Release waves, subscriptions |

**Event subscriptions:** `harmony.high`, `harmony.mid`, `harmony.low`, `link.corruption.high`, `link.stability.low`, `node.corruption.high`

**State:**
- `IDLE` → no active healing
- `HEALING` → waves traveling along damaged links
- `IMPACT` → wave arrived at target, applying healing visual

### HarmonicRecoveryVisualSystem_Session138
**Role:** Visual — recovery stitching and coherence waves post-rupture

| Method | Signature | Notes |
|--------|-----------|-------|
| constructor | `(config)` | Pool allocation |
| attachScene | `(scene)` | Acquire scene ref |
| rebind | `({ linkingSystem, aiNodes, semanticBus, scene })` | Re-acquire all refs |
| update | `(deltaTime, time, networkState)` | Manage recovering zones |
| triggerRecoveryPulse | `(linkOrId, time)` | Force trigger recovery |
| dispose | `()` | Release all resources |

**Event subscriptions:** `harmony.high`, `harmony.mid`, `link.stability.mid`, `node.stability.low`

**State:**
- `IDLE` → no active recovery
- `RECOVERING` → stitching/coherence waves active
- `COMPLETE` → recovery visual finished

### HarmonyStabilizationSystem_v1
**Role:** Gameplay — proactive harmony management, corruption blocking, oasis zones

| Method | Signature | Notes |
|--------|-----------|-------|
| constructor | `(config)` | Harmony maps initialization |
| initializeNodeHarmony | `(node)` | Set up harmony tracking for a node |
| initializeLinkHarmony | `(link)` | Set up harmony tracking for a link |
| updateHarmony | `(deltaTime)` | Main harmony update loop |
| rebind | `({ linkingSystem, aiNodes, semanticBus })` | Re-acquire refs |

**State:**
- `NORMAL` → harmony within thresholds
- `BLOCKING` → corruption detected, blocking active
- `ANCHOR` → node acting as harmony anchor
- `PULSE` → harmony pulse propagating
- `OASIS` → oasis zone active

---

## Integration Patch Registry

Active integration patches and their wiring role:

| Patch | Wire Target | Called In |
|-------|-------------|-----------|
| `ArchetypeVisualIntegrationPatch_v1` | AINodes → ArchetypeVisuals | `createAINodes()` |
| `ParticleStreamCascadeAccelerationIntegrationPatch` | CascadeSystem → ParticleEmitter | `init()` |
| `_HitProxyIntegrationPatch` | Scene → HitProxy system | `init()` |
| `LinkResonanceFlowIntegrationPatch_Session124` | LinkResonanceFlow → Harmony metrics | `createAINodes()` |
| `EchoRippleIntegrationPatch_Session125` | EchoRipple → SemanticBus | `createAINodes()` |
| `CorruptionDesaturationIntegrationPatch` | Corruption → Node desaturation | `createAINodes()` |
| `HarmonyStabilizationIntegrationPatch_v1` | HarmonyStabilization → MetricsRuntime | `init()` |
| `FresnelAuraIntegrationPatch` | NodeLinkingSystem → Fresnel auras | `NodeLinkingSystem.js` |

**Dead patches moved to `LEGACY/patches/`:**
- `CorruptionVisualIntegrationPatch_v1.js`
- `HarmonicInfluencePropagationIntegrationPatch_Session127.js`
- `LinkCorruptionTransmissionIntegrationPatch_v1.js`
- `LinkRendererMetricsIntegrationPatch_v1.js`
- `ParticleEmissionIntegrationPatch.js`
