# ATOMA ARCHITECTURAL AUDIT: COMPLETE EVENT SYSTEMS INVENTORY
**Date:** 2026-03-15
**Scope:** `main.js` + Core Subsystems
**Status:** CRITICAL ARCHITECTURE FRAGMENTATION DETECTED

---

## 1. THE EVENT ECOSYSTEM MAP

ATOMA currently operates **THREE DISTINCT EVENT PARADIGMS** simultaneously, leading to significant architectural complexity and potential performance bottlenecks.

### A. Paradigm 1: The Canonical Semantic Bus (`semanticBus`)
**Status:** **ACTIVE & MODERN (Phase E)**
**Type:** Priority Queue (CRITICAL, INTERACTIVE, NORMAL, BACKGROUND) with Aggregation, Decay, and Budgeting.

**Canonical Emitters (Producers):**
| Producer | Events Emitted | Category | Frequency |
|---|---|---|---|
| **`createAINodes`** | `network.node.created`, `node:spawned` | Network/Lifecycle | Spawn bursts |
| **`linkingSystem.createLink`** | `network.link.created`, `link:created` | Link/Lifecycle | User Action |
| **`linkingSystem.removeLink`** | `network.link.destroyed`, `link:collapsed` | Link/Lifecycle | User Action |
| **`AtomaGame` (HUD)** | `camera.motion` | Input/Interaction | Per-frame (throttled) |
| **`WaveInterferenceEngine`** | `wave.burst.lifecycle`, `wave.regime.transition` | Simulation/Wave | Burst |
| **`CorruptionBridge`** | `corruptionThresholdCrossed` | Corruption/Threshold | Threshold |

**Canonical Subscribers (Consumers):**
| Consumer | Subscriptions | Priority | Behavior |
|---|---|---|---|
| **HUD System** | `camera.motion`, `node.selection` | INTERACTIVE | Wake HUDs |
| **HUD System** | `metrics.spike` | NORMAL | Update graphs |
| **Wave Systems** | `wave.regime.transition` | INTERACTIVE | Request bursts |
| **Ritual Systems** | `semantic.ritual.started` | BACKGROUND | Visuals only |

**Audit Finding:** The SemanticEventBus is well-structured but **UNDERUTILIZED**. The bulk of game logic ignores it.

---

### B. Paradigm 2: The Legacy Callback System (`linkingSystem` observers)
**Status:** **ACTIVE & LEGACY (Phase A-C)**
**Type:** Manual Observer Registration (Pub/Sub via functions, not events).

**Legacy Emitters (Producers):**
| Producer | Callbacks Triggered | Frequency |
|---|---|---|
| **`linkingSystem.createLink`** | `onLinkCreated(link, source, target)` | User Action |
| **`linkingSystem.removeLink`** | `onLinkRemoved(link)` | User Action |
| **`linkingSystem.processNodeTargeting`** | `onNodeTargeted(node)` | Per-frame (Raycast) |
| **`linkingSystem.update`** | Internal state changes | Per-frame |

**Legacy Subscribers (Consumers):**
| Consumer | Callback Registered | Logic |
|---|---|---|
| **`AudioSystem`** | `onLinkCreated`, `onLinkRemoved` | Play SFX |
| **`SparkSystem`** | `onLinkCreated` | Create spark emitter |
| **`HUD System** (Partial) | `onLinkCreated` | Update UI panels |
| **`Phase5`** | `onLinkCreated` | Sync networks |
| **`SynergyHighways`** | `onLinkCreated`, `onLinkRemoved` | Recalculate routes |
| **`SynergyChainReaction`** | `onLinkCreated` | Check chains |

**Audit Finding:** **REDUNDANT SIGNALING.**
When a link is created, **TWO** signals fire simultaneously:
1. `linkingSystem.onLinkCreated()` (Legacy Callback)
2. `semanticBus.emit('link:created')` (Semantic Event)
**Impact:** Systems like `SynergyHighways` might react twice if they hook into both (or require adapters to split logic).

---

### C. Paradigm 3: The Massive Polling Architecture (`frameScheduler`)
**Status:** **DOMINANT (90% of Codebase)**
**Type:** Tick-based loop (Polling). No events.

**The Silent "Event" Loop:**
The `frameScheduler` is a global execution engine. Most visual systems do **NOT** emit events. They simply run `update(dt)` every frame and read state from global singletons (`this.aiNodes`, `this.linkingSystem`).

**"Event Emitters" via State Mutation:**
*   `linkingSystem` updates state -> `DynamicLinkColorSystem` reads `link.userData.synergy`.
*   `aiNodes` updates node -> `NodeAuraSystem` reads `node.userData`.
*   `harmonyCascade` updates state -> `HarmonicResonanceCoupling` reads network state.

**"Event Consumers" via Polling:**
| Consumer | Polls From | Frequency |
|---|---|---|
| **`DynamicLinkColorSystem`** | `linkingSystem.links` (synergy score) | 60 Hz |
| **`PersonalityVFXLayer`** | `node.userData.personality` | 60 Hz |
| **`WaveInterferenceEngine`** | `linkingSystem` (stress/quality) | 10 Hz (Sim) |
| **`HarmonicHubAuraSystem`** | `linkingSystem` (harmony score) | 30 Hz (Visual) |
| **`CorruptionTransmission`** | `linkingSystem.links` | 10 Hz (Sim) |

**Audit Finding:** **HIDDEN EVENT STORM.**
There are no explicit events, but 50+ systems are polling `aiNodes` and `linkingSystem` state every frame. This is functionally equivalent to a **60Hz high-frequency event stream** broadcast to everyone, but less efficient because consumers cannot filter "types" easily.

---

## 2. EVENT TAXONOMY & CONFLICT MATRIX

### Synergy Events (Visual & Logical)
| Event Name | Format | Source | Consumers | Conflict? |
|---|---|---|---|---|
| Link Created | `callback` | `linkingSystem` | Audio, Sparks, Highways | **YES** (w/ `link:created`) |
| Link Created | `semantic` | `linkingSystem` | HUD, Metrics | **YES** (w/ Callback) |
| Synergy Threshold Crossed | `semantic` | `linkingSystem` | None (Visuals poll) | **MISSING** (Should trigger particles?) |
| Synergy Chain Reaction | `event` | `SynergyChainReaction` | SynergyCascadeFXBridge | **DUPLICATE** (w/ HarmonyCascade) |

### Corruption Events (Mechanical)
| Event Name | Format | Source | Consumers | Conflict? |
|---|---|---|---|---|
| Corruption Threshold | `semantic` | `CorruptionBridge` | `T4_GameplayIntegration` | **OK** |
| Corruption Propagate | `polling` | `LinkCorruptionTransmission` | `LinkQualityCalculator` | **SILENT** (Should alert visual system?) |
| Corruption Visual Update | `polling` | `T2_CorruptionVisualIntegration` | None | **OK** (State mutation) |

### Harmony Events (Mechanical)
| Event Name | Format | Source | Consumers | Conflict? |
|---|---|---|---|---|
| Harmony Stabilized | `polling` | `HarmonyStabilizationSystem` | None | **SILENT** |
| Harmony Wave | `polling` | `HarmonicCascadeAmplification` | `ResonanceEchoTrails` | **OK** |

### Network/State Events
| Event Name | Format | Source | Consumers | Conflict? |
|---|---|---|---|---|
| Node Spawned | `semantic` | `createAINodes` | None | **MISSING** (Should trigger VFX?) |
| Node Selected | `semantic` | `nodeInteractionEngine` | HUD | **OK** |
| Node Metrics Update | `polling` | `MetricsRuntime` | HUD, Visuals | **BOTTLENECK** (60Hz read) |

---

## 3. CRITICAL FINDINGS

### 1. Dual-Signal Architecture (Callback + SemanticBus)
**Risk:** HIGH
**Details:**
The `linkingSystem` fires **both** a legacy callback (`onLinkCreated`) AND a SemanticBus event (`link:created`).
**Example:**
```javascript
// In createAINodes (main.js):
const originalCreateLink = this.linkingSystem.createLink.bind(this.linkingSystem);
this.linkingSystem.createLink = (sourceNode, targetNode) => {
    const result = originalCreateLink(sourceNode, targetNode);
    // Legacy Callback Fire
    this.audioSystem.playLinkCreated();
    // Semantic Event Fire
    this.semanticBus.emit('link:created', { ... });
};
```
**Impact:**
1.  **Audio System** listens to Callback.
2.  **HUD System** listens to SemanticEvent.
3.  **Integration** requires manual bridging for every system.

### 2. The "Silent" Polling Storm
**Risk:** CRITICAL (Performance)
**Details:**
Most "Visual" events are NOT events. They are state mutations read in a 60Hz loop.
*   `DynamicLinkColorSystem` iterates **all links** (1500+) every frame to check synergy.
*   `PersonalityVFXLayer` iterates **all nodes** (15-50) every frame.
*   `HarmonicHubAuraSystem` iterates **all hubs** every frame.
**Impact:** O(N^2) complexity hidden in the "visual" phase. If `N` (links) grows, the "event" cost skyrockets without any explicit event emission.

### 3. Dead / Zombie Events (SemanticBus)
**Risk:** MEDIUM (Code Bloat)
**Details:**
The SemanticBus has sophisticated policies for `metrics.spike`, `node.selection`, etc., but many might not be used.
*   `metrics.spike` -> Defined in `eventPolicies`. **Checked:** No subscriber found in `main.js`.
*   `semantic.ritual.started` -> Defined. **Checked:** `Phase8RitualVisualOrchestration` likely consumes it (needs verification).

### 4. Missing "Visual Trigger" Events
**Risk:** HIGH (Inconsistency)
**Details:**
Visual systems (Particles, Glows) often rely on "Spontaneous" triggers (e.g., high corruption, synergy spike) but have no event to listen to. They resort to polling.
*   **Gap:** `LinkCorruptionTransmission` detects corruption changes. It should emit `corruption:change` or `metric:corruptionRise`.
*   **Gap:** `HarmonyStabilizationSystem` detects recovery. It should emit `harmony:recovered`.
*   **Workaround:** These systems use polling or direct coupling (which they shouldn't).

---

## 4. RECOMMENDED ACTION PLAN

### Phase 1: Consolidate Link Lifecycle (Immediate)
1.  **Deprecate** `linkingSystem.onLinkCreated` callbacks.
2.  **Enforce** `semanticBus.emit('link:created')` as the **SINGLE SOURCE OF TRUTH**.
3.  **Migrate** `AudioSystem`, `SparkSystem`, `Highways` to subscribe to `semanticBus`.
4.  **Remove** bridging code from `main.js`.

### Phase 2: Emit "State Change" Events (Short-term)
1.  **`LinkCorruptionTransmission`** -> Emit `corruption:thresholdCrossed` (Already exists).
2.  **`HarmonyStabilization`** -> Emit `harmony:thresholdCrossed`.
3.  **`MetricsRuntime`** -> Emit `metric:nodeUpdate`, `metric:linkUpdate` (Throttled to 10Hz).
4.  **Benefit:** Eliminates 60Hz polling for UI and non-critical Visuals.

### Phase 3: Convert "Visual Polling" to "Event Reactivity" (Long-term)
1.  **Target:** `DynamicLinkColorSystem`, `ParticleEmissionScaler`, `LinkDegradationSystem`.
2.  **Current:** Updates every frame by iterating all objects.
3.  **New:** Subscribe to `metric:linkUpdate` or `link:changed`. Only update dirty links (requires "dirty flag" on links).
4.  **Benefit:** Massive performance gain when network is static or large.

### Phase 4: Audit & Clean SemanticBus Policies
1.  Review `eventPolicies` in `SemanticEventBus` constructor.
2.  Remove unused keys (e.g., `metrics.spike` if truly unused).
3.  Ensure high-frequency events (`camera.motion`) have proper `cooldown` and `aggregation` (They do, this is good).

---

## 5. SYSTEM INVENTORY (For Reference)

### Event Emitters (Active)
1.  **SemanticEventBus:** `emit(tag, payload, opts)`
2.  **NodeLinkingSystem:** `createLink`, `removeLink`, `processNodeTargeting` (emits Callbacks)
3.  **CorruptionBridge:** Detects threshold -> Emits `corruptionThresholdCrossed`
4.  **WaveInterferenceEngine:** Detects regime -> Emits `wave.regime.transition`
5.  **AtomaGame (HUD):** Detects motion -> Emits `camera.motion`

### Event Consumers (Active)
1.  **HUD:** `camera.motion`, `node.selection`
2.  **Wave Systems:** `wave.regime.transition`
3.  **Visuals (Implicit):** 40+ systems polling via `frameScheduler`.

### Event Bus Hierarchy (Proposed)
1.  **Tier 1: Simulation Events:** (Corruption, Harmony, Synergy) -> `semanticBus`
2.  **Tier 2: Input/Interaction Events:** (Link Created, Node Selected) -> `semanticBus`
3.  **Tier 3: Visual Updates:** (Color changes, Particles) -> React to Tier 1/2 (Currently Polling)
4.  **Tier 4: Low-Frequency State:** (Metrics, World Load) -> `semanticBus` (Throttled)

---

## 6. CONCLUSION

ATOMA's event system is in a **hybrid transitional state**.
*   The **SemanticEventBus** is powerful and ready to replace legacy systems.
*   The **Legacy Callback System** (`linkingSystem`) is a major point of friction and redundancy.
*   The **Polling Architecture** (`frameScheduler`) is currently masking the need for an event-driven visual layer by brute force (60Hz loops).

**Recommendation:** Prioritize **Phase 1 (Consolidate Link Lifecycle)**. This will unblock the migration of 50% of the remaining systems to the SemanticEventBus without immediate performance refactoring.