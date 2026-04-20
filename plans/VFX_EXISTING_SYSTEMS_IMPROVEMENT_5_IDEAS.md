# ATOMA — 5 Innovative Improvements to EXISTING Visual Systems

**Date:** 2026-04-20  
**Status:** PROPOSAL  
**Constraint:** All improvements work within existing files and systems — no new systems

---

## Key Difference from Previous Proposals

The previous 5 proposals were about creating NEW visual concepts. These 5 are about making EXISTING systems dramatically better through targeted improvements.

---

## 1. Link Heartbeat — Network-Wide Synchronized Pulse

**Target file:** [`LinkRendererConduit.js`](LinkRendererConduit.js)

### Current State
Links have static or slowly varying flow. Each link animates independently. There is no sense of the network as a unified organism.

### Improvement
Add a global "heartbeat" pulse that travels through ALL links simultaneously, synchronized to the `FrameScheduler` simulation tick (10Hz). Every 10 simulation ticks, a brightness wave originates from the network centroid and propagates outward through all links at once.

**Visual effect:** The entire network visibly PULSES as one organism. You can SEE the network breathing. Links closer to the centroid pulse first, outer links follow — like a real heartbeat propagating through a circulatory system.

**Implementation:** Add a global uniform `uHeartbeatPhase` to link shaders. Compute phase from `MetricsRuntime` time. Fragment shader modulates brightness with `sin(uHeartbeatPhase - distanceFromCenter * 0.3)`.

**Impact:** HIGH — transforms the network from a collection of individual links into a living, unified organism.

---

## 2. Corruption Creep — Directional Rot That Spreads Visibly

**Target file:** [`CorruptionVisualFX_v1.js`](CorruptionVisualFX_v1.js) + [`TIER4_CorruptionFeedbackVisuals_v1.js`](TIER4_CorruptionFeedbackVisuals_v1.js)

### Current State
Corruption is a uniform overlay — the entire node gets equally corrupted visually. There is no sense of corruption SPREADING or HAVING DIRECTION.

### Improvement
Make corruption visually "creep" from the direction of the corrupted link. Instead of the whole node darkening at once, the corruption starts at the link attachment point and spreads across the node surface like rot, with a visible "rot front" — a jagged, glowing edge between healthy and corrupted areas.

**Visual effect:** You can SEE which link brought the corruption. You can SEE how far the rot has spread. You can SEE it being pushed back when harmony heals it. The corruption has DIRECTION and PROGRESS.

**Implementation:** Pass `uCorruptionDirection` (vec3) and `uCorruptionProgress` (float) uniforms to node shaders. In fragment shader, compute `dot(worldPosition, uCorruptionDirection)` to determine which side of the node is corrupted. The rot front is a noisy threshold boundary.

**Impact:** VERY HIGH — makes corruption readable as a directional, progressive threat instead of a flat debuff.

---

## 3. Echo Ripple Scars — Persistent Memory of Network Events

**Target file:** [`EchoRippleSystem_Session125.js`](EchoRippleSystem_Session125.js)

### Current State
Echo ripples expand outward and fade to nothing. Once gone, there is no visual trace that anything happened.

### Improvement
When an echo ripple reaches its maximum radius and is about to fade, it leaves behind a faint "scar ring" — a barely visible circle that persists at that location. These scars slowly fade over 30-60 seconds. Active areas of the network accumulate many scars; quiet areas have few.

**Visual effect:** You can READ the network's activity history at a glance. Areas with many overlapping scars are "hot zones" where lots of events happened. Areas with no scars are quiet. The scars create a visible ACTIVITY TOPOGRAPHY.

**Implementation:** When a ripple reaches max age, instead of removing it, reduce its opacity to 2-3% and add it to a "scar pool". Scar pool rings slowly drift outward and fade over 30-60s. Pool is capped at ~50 scars for performance.

**Impact:** MEDIUM-HIGH — adds temporal depth without any new systems. Purely additive to existing echo ripple behavior.

---

## 4. Hub Aura Metric Sync — Breathing IS the Metric Update

**Target file:** [`HarmonicHubAuraSystem_Session126.js`](HarmonicHubAuraSystem_Session126.js)

### Current State
Hub auras "breathe" at a fixed rate defined in config. The breathing is decorative — it does not reflect actual metric changes.

### Improvement
Make the hub aura breathing rate directly proportional to the rate of metric change from `MetricsRuntime`. When metrics are changing rapidly (high instability, active cascades), the aura breathes faster. When metrics are stable, the aura breathes slowly and calmly.

**Visual effect:** You can FEEL the network's stress level through the aura rhythm. Fast breathing = something is happening. Slow breathing = calm. The visual IS the data — no HUD needed.

**Implementation:** In the aura update loop, compute `metricVelocity = abs(currentMetric - previousMetric) / deltaTime`. Map velocity to breathing speed: `breathSpeed = baseSpeed + metricVelocity * velocityMultiplier`. Use the existing `hubData.harmony` and `hubData.corruption` rates.

**Impact:** MEDIUM — subtle but powerful. Makes the entire scene feel responsive to actual data flow.

---

## 5. Selection Resonance Cascade — Visual Chain Reaction on Node Select

**Target files:** [`_NodeMicroEvents.js`](_NodeMicroEvents.js) + [`CascadeResonanceWaveVisualization_Session146.js`](CascadeResonanceWaveVisualization_Session146.js)

### Current State
Selecting a node highlights it. That is all. There is no visual sense of the node's CONNECTIONS or INFLUENCE.

### Improvement
When a node is selected, trigger a visual "resonance cascade" that travels through connected links to adjacent nodes, then their adjacent nodes (2-3 hops). Each hop, the effect diminishes in intensity. The cascade shows the selected node's REACH — how far its influence extends through the network.

**Visual effect:** Selecting a node creates a visible "awareness wave" — a bright pulse that travels from the selected node through its links to neighbors, then to their neighbors. You instantly SEE the topology around the selected node. Isolated nodes have small cascades. Hub nodes have cascades that reach far.

**Implementation:** On node selection, create a cascade event with `sourceNode`, `maxHops: 3`, `intensityDecayPerHop: 0.5`. Use existing cascade wave visualization to render the traveling pulse. The cascade follows link topology (BFS from selected node).

**Impact:** VERY HIGH — transforms node selection from a simple highlight into a powerful topology exploration tool. Makes the network structure immediately readable.

---

## Summary

| # | Improvement | Target System | Risk | Impact | Effort |
|---|------------|---------------|------|--------|--------|
| 1 | Link Heartbeat | LinkRendererConduit | LOW | HIGH | LOW |
| 2 | Corruption Creep | CorruptionVisualFX + TIER4 | LOW-MEDIUM | VERY HIGH | MEDIUM |
| 3 | Echo Ripple Scars | EchoRippleSystem | LOW | MEDIUM-HIGH | LOW |
| 4 | Hub Aura Metric Sync | HarmonicHubAuraSystem | LOW | MEDIUM | LOW |
| 5 | Selection Resonance Cascade | NodeMicroEvents + CascadeWaves | MEDIUM | VERY HIGH | MEDIUM |

### Recommended Order

1. **Link Heartbeat** — simplest, most impactful, touches only link shaders
2. **Selection Resonance Cascade** — transforms the core interaction
3. **Corruption Creep** — makes the primary threat visually readable
4. **Hub Aura Metric Sync** — subtle but makes everything feel alive
5. **Echo Ripple Scars** — adds temporal depth to existing effects
