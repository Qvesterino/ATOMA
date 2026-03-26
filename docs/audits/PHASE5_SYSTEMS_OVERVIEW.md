# PHASE5 Systems Overview

> Audit Date: 2026-03-26  
> Purpose: Stručný prehľad všetkých PHASE5 systémov

---

## Summary Table

| File | Role | Emits | Creates | Calculates | Status |
|------|------|-------|---------|------------|--------|
| [`PHASE5_MultiNetworkOrchestrator_v1.js`](#1-phase5_multinetworkorchestrator_v1js) | Central hub | Events | None | Orchestration | ⚠️ Partial |
| [`PHASE5_MultiNetworkManager_v1.js`](#2-phase5_multinetworkmanager_v1js) | Registry | `network.registered`, `connection.created` | None | Network tracking | ⚠️ Partial |
| [`PHASE5_CorruptionBridge_v1.js`](#3-phase5_corruptionbridge_v1js) | Transfer | Cascades | None | Corruption flow | ⚠️ Partial |
| [`PHASE5_NetworkSynchronization_v1.js`](#4-phase5_networksynchronization_v1js) | Sync | Conflicts | None | State validation | ⚠️ Partial |
| [`PHASE5_CascadeVisualizationBridge_v1.js`](#5-phase5_cascadevisualizationbridge_v1js) | Bridge | None | None | Event routing | ⚠️ Partial |
| [`PHASE5_CascadePropagationVisuals_v1.js`](#6-phase5_cascadepropagationvisuals_v1js) | VFX | None | Ring meshes | Ring expansion | ⚠️ Partial |
| [`PHASE5_InterNetworkVisualizationBridge_v1.js`](#7-phase5_internetworkvisualizationbridge_v1js) | Bridge | None | Connection lines | Position sync | ⚠️ Partial |

---

## Detailed Analysis

### 1. PHASE5_MultiNetworkOrchestrator_v1.js

**Čo je:** Centrálny hub koordinujúci všetky PHASE5 subsystémy (Manager, CorruptionBridge, Synchronization).

**Čo emituje:** Network events cez `handleNetworkEvent()`.

**Čo vytvára do scény:** Nič - čisto koordinačná vrstva.

**Čo počíta:** Orchestration logic, subsystem coordination.

**Úloha:** Unified API pre multi-network operácie, inicializuje a prepája všetky PHASE5 komponenty.

**Wiring:**
```
main.js → PHASE5_MultiNetworkOrchestrator
           ├── PHASE5_MultiNetworkManager
           ├── PHASE5_CorruptionBridge
           └── PHASE5_NetworkSynchronization
```

**Status:** ⚠️ PARTIAL - Vyžaduje `frameScheduler.shouldRunSimulation()` ktorý nie je vždy dostupný.

---

### 2. PHASE5_MultiNetworkManager_v1.js

**Čo je:** Registry pre multiple network instances s event system.

**Čo emituje:** `onNetworkRegistered`, `onConnectionCreated` events.

**Čo vytvára do scény:** Nič - data layer.

**Čo počíta:** Network proximity, event propagation, connection tracking.

**Úloha:** Registrácia a tracking multiple AI networks, správa inter-network connections.

**Wiring:**
```
PHASE5_MultiNetworkOrchestrator → PHASE5_MultiNetworkManager
                                   ├── networks: Map<networkId, network>
                                   ├── networkConnections: Array
                                   └── eventCallbacks: Array
```

**Status:** ⚠️ PARTIAL - Funkčný ale vyžaduje explicitnú registráciu sietí.

---

### 3. PHASE5_CorruptionBridge_v1.js

**Čo je:** Simuluje corruption/harmony spread medzi connected networks.

**Čo emituje:** Cascade events pri `corruptionLevel > 0.75`.

**Čo vytvára do scény:** Nič - simulation layer.

**Čo počíta:** Corruption transfer rate, harmony transfer, distance attenuation.

**Úloha:** Bidirectional corruption/harmony propagation medzi sieťami s connection strength modifier.

**Wiring:**
```
PHASE5_MultiNetworkOrchestrator → PHASE5_CorruptionBridge
                                   └── multiNetworkManager.getConnections()
```

**Status:** ⚠️ PARTIAL - Vyžaduje `frameScheduler.shouldRunSimulation()`.

---

### 4. PHASE5_NetworkSynchronization_v1.js

**Čo je:** Synchronizuje state across multiple networks s conflict resolution.

**Čo emituje:** Conflict detection events.

**Čo vytvára do scény:** Nič - sync layer.

**Čo počíta:** State validation, conflict resolution (average/conservative/aggressive).

**Úloha:** Data integrity keď multiple networks interaktujú, conflict detection a resolution.

**Wiring:**
```
PHASE5_MultiNetworkOrchestrator → PHASE5_NetworkSynchronization
                                   └── multiNetworkManager.getConnections()
```

**Status:** ⚠️ PARTIAL - Funkčný ale sync interval 500ms môže byť príliš pomalý.

---

### 5. PHASE5_CascadeVisualizationBridge_v1.js

**Čo je:** Bridge medzi corruption systems a cascade visuals - event router.

**Čo emituje:** Nič - read-only consumer.

**Čo vytvára do scény:** Nič - deleguje na `cascadePropagationVisuals`.

**Čo počíta:** Threshold detection (corruption > 0.7, harmony > 0.8, threat > 0.5).

**Úloha:** Forward cascade events z `LinkCorruptionTransmission` do visual effects system.

**Wiring:**
```
LinkCorruptionTransmission → PHASE5_CascadeVisualizationBridge
                              ├── aiNodes
                              ├── linkCorruptionTransmission
                              └── cascadePropagationVisuals
                              
semanticBus ← subscribes to cascade events
```

**Status:** ⚠️ PARTIAL - Vyžaduje `linkCorruptionTransmission` a `cascadePropagationVisuals`.

---

### 6. PHASE5_CascadePropagationVisuals_v1.js

**Čo je:** Pure visual system - renderuje expanding rings pri cascade events.

**Čo emituje:** Nič - pure visual consumer.

**Čo vytvára do scény:** 
- `THREE.Group` (CascadeRings)
- `THREE.Line` ring meshes (pooled)
- Materials: `THREE.LineBasicMaterial`

**Čo počíta:** Ring expansion (8 units/sec), fade duration (0.8s), depth decay (0.7).

**Úloha:** Vizualizácia cascade propagation ako expanding rings s color coding (red=corruption, cyan=harmony, orange=threat).

**Wiring:**
```
PHASE5_CascadeVisualizationBridge → PHASE5_CascadePropagationVisuals
                                     └── scene.add(ringGroup)
```

**Status:** ⚠️ PARTIAL - Funkčný ale vyžaduje explicitné volanie `spawnCascade()`.

---

### 7. PHASE5_InterNetworkVisualizationBridge_v1.js

**Čo je:** Bridge medzi multi-network state a inter-network connection visuals.

**Čo emituje:** Nič - read-only consumer.

**Čo vytvára do scény:** Deleguje na `connectionVisuals` (ak je poskytnutý).

**Čo počíta:** Position sync, network health metrics, connection state.

**Úloha:** Synchronizuje visual state s network health metrics, wire multi-network state do visuals.

**Wiring:**
```
PHASE5_MultiNetworkManager → PHASE5_InterNetworkVisualizationBridge
                              ├── multiNetworkManager
                              ├── corruptionBridge
                              └── connectionVisuals (optional)
                              
Events: onNetworkRegistered, onConnectionCreated
```

**Status:** ⚠️ PARTIAL - `connectionVisuals` je optional, bez neho operuje v "data-only mode".

---

## Activation Status

⚠️ **Všetky PHASE5 systémy sú PARTIAL/INACTIVE**

Dôvody:
1. **frameScheduler dependency** - Väčšina systémov vyžaduje `frameScheduler.shouldRunSimulation()` ktorý nie je vždy dostupný
2. **Explicit wiring required** - Systémy vyžadujú explicitnú inicializáciu a wiring v `main.js`
3. **Optional dependencies** - Mnoho systémov má optional dependencies ktoré nie sú vždy poskytnuté

## Recommendations

1. **Overiť wiring v main.js** - Skontrolovať či sú PHASE5 systémy proper inicializované
2. **FrameScheduler integration** - Uistiť sa že `frameScheduler` je dostupný pre všetky systémy
3. **Dependency injection** - Revizia optional dependencies a ich fallback správania

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE5_MultiNetworkOrchestrator               │
│                         (Central Hub)                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
┌───────────────────┐ ┌───────────────┐ ┌─────────────────────┐
│ MultiNetworkManager│ │CorruptionBridge│ │NetworkSynchronization│
│   (Registry)       │ │  (Transfer)   │ │    (Sync)           │
└─────────┬─────────┘ └───────┬───────┘ └─────────────────────┘
          │                   │
          │    ┌──────────────┴──────────────┐
          │    │                             │
          ▼    ▼                             ▼
┌─────────────────────────────┐ ┌─────────────────────────────────┐
│ CascadeVisualizationBridge  │ │InterNetworkVisualizationBridge  │
│     (Event Router)          │ │     (Position Sync)             │
└─────────────┬───────────────┘ └─────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│              CascadePropagationVisuals                           │
│          (Ring Meshes, Expanding Waves)                         │
│                    ↓                                             │
│               THREE.Scene                                        │
└─────────────────────────────────────────────────────────────────┘
```
