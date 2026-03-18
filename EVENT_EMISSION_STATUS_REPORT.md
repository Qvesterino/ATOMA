# Event Emission Status Report

Generated: 2026-03-18T19:34:00Z

## Overview

This report analyzes which events are emitted by ATOMA systems and whether they trigger visual effects.

## Event Categories

### 1. CASCADE EVENTS

**cascade.hop**
- **Emitter:** [`CascadingHarmonicResonanceAmplification.js:540`](CascadingHarmonicResonanceAmplification.js:540)
- **Code:**
```javascript
this.semanticBus.emit('cascade.hop', {
    sourceNode: node.id ?? nodeId,
    sourcePosition: node.position,
    targetPosition: targetPosition,
    intensity: cascadeStrength,
    hopCount: currentHop
});
```
- **Status:** ✅ EMITTED
- **Purpose:** Notify when cascade hops to next node
- **Visual Trigger:** Unknown (depends on consumer)

---

### 2. WAVE EVENTS

**wave.packet.spawn**
- **Emitter:** [`CascadeParticleSystem_Session120.js`](CascadeParticleSystem_Session120.js:373)
- **Code:**
```javascript
this._emit(count, link, 0, 'forward', 'resolved_harmony', currentCascadeTime, sourcePosition, targetPosition);
```
- **Status:** ✅ EMITTED
- **Purpose:** Spawn cascade particles along links
- **Visual Trigger:** ✅ Cascade particle system

---

### 3. RESONANCE EVENTS

**resonance trigger**
- **Emitter:** NOT FOUND
- **Status:** ❌ NOT FOUND
- **Expected Location:** HarmonicResonanceCoupling_v1 or similar
- **Impact:** Missing resonance visual feedback

---

### 4. HARMONY EVENTS

**harmony spike**
- **Emitter:** NOT FOUND
- **Status:** ❌ NOT FOUND
- **Expected Location:** MetricsRuntime_v1 or similar
- **Impact:** Missing harmony spike visual feedback

---

## 4. SEMANTIC BUS EVENTS

The semanticBus is the central event system. All systems emit events through it.

### Node Lifecycle Events
- `node.spawned` - [`NetworkRituals_v1.js:423`](NetworkRituals_v1.js:423)
- `node.synergy.high` - [`MetricsRuntime_v1.js:635`](MetricsRuntime_v1.js:635)
- `metric.node.updated` - [`MetricsRuntime_v1.js:192`](MetricsRuntime_v1.js:192)
- `node.selected` - [`main.js:11954`](main.js:11954)
- `node.click` - [`main.js:11958`](main.js:11958)

### Network Events
- `network.synergy.shift` - [`MetricsRuntime_v1.js:713`](MetricsRuntime_v1.js:713)
- `network.stress.rise` - [`MetricsRuntime_v1.js:760`](MetricsRuntime_v1.js:760)
- `network.stability.drop` - [`MetricsRuntime_v1.js:822`](MetricsRuntime_v1.js:822)
- `network.ability.drop` - [`MetricsRuntime_v1.js:876`](MetricsRuntime_v1.js:876)
- `network.harmony.shift` - [`MetricsRuntime_v1.js:734`](MetricsRuntime_v1.js:734)

### Link Events
- `link.synergy.high` - [`MetricsRuntime_v1.js:635`](MetricsRuntime_v1.js:635)
- `link.harmonicLock` - [`MetricsRuntime_v.js:698`](MetricsRuntime_v1.js:698)
- `link.destroyed` - [`NetworkRituals_v1.js:423`](NetworkRituals_v1.js:423)
- `link.collapsed` - [`NetworkRituals_v1.js:423`](NetworkRituals_v1.js:423)
- `link.recovery` - [`NetworkRituals_v1.js:423`](NetworkRituals_v1.js:423)

---

## Visual System Behavior

### Consumers (Read-Only)

1. **[`LinkRendererConduit.js`](LinkRendererConduit.js:252)** - Reads `node.userData.harmonyLevel` for visual rendering
2. **[`LinkRendererConduit.js:255`](LinkRendererConduit.js:255) - Reads `metrics.harmony` for visual rendering
3. **[`LinkRendererConduit.js:306`](LinkRendererConduit.js:306) - Reads `link.userData.harmonyLevel` for visual rendering
4. **[`LinkStateVisualLanguageIntegration.js`](LinkStateVisualLanguageIntegration.js:68) - Reads `node.userData.harmonyLevel` for visual state
5. **[`T2_HarmonyVisualConsumer_v1.js`](src/legacy/T2_HarmonyVisualConsumer_v1.js:48) - Reads `node.userData.harmonyLevel` for rendering

**Producers (Write + Read)**
1. **[`HarmonyStabilizationSystem_v1.js`](HarmonyStabilizationSystem_v1.js:854) - Writes `node.userData.harmonyLevel` (PRIMARY SOURCE)
2. [`NetworkRituals_v1.js`](NetworkRituals_v1.js:423) - Modifies `harmonyLevel` (MODIFIER)
3. [`HarmonicInfluencePropagationSystem_Session127.js`](HarmonicInfluencePropagationSystem_Session127.js:291) - Reads `node.userData.harmonyLevel` (with guard)

---

## Missing Visual Trigger Events

### Events NOT Found

1. **resonance trigger** - Expected in HarmonicResonanceCoupling_v1 or similar
   - **Status:** ❌ NOT FOUND
   - **Impact:** No resonance visual feedback when harmony spikes occur

2. **harmony spike** - Expected in MetricsRuntime_v1 or similar
   - **Status:** ❌ NOT FOUND
   - **Impact:** No harmony spike visual feedback when harmony peaks occur

3. **wave burst** - Expected in LinkResonanceFlowIntegrationPatch or similar
   - **Status:** ⚠️ PARTIALLY FOUND
   - **Emitter:** [`EchoRippleIntegrationPatch_Session125.js:102`](EchoRippleIntegrationPatch_Session125.js:102)
   - **Integration:** Hooks into [`LinkResonanceFlowSystem_Session124`](LinkResonanceFlowSystem_Session124.js:40) pulse spawning
   - **Impact:** ⚠️ May not be active (hook exists but may not be triggered)

---

## Analysis

### Event Emission Status

| Event | Emitter | File | Status | Visual Trigger |
|--------|--------|--------|--------------|
| cascade.hop | [`CascadingHarmonicResonanceAmplification.js:540`](CascadingHarmonicResonanceAmplification.js:540) | ✅ | Unknown |
| wave.packet.spawn | [`CascadeParticleSystem_Session120.js`](CascadeParticleSystem_Session120.js:373) | ✅ | Cascade particles |
| resonance trigger | Not found | ❌ | - |
| harmony spike | Not found | ❌ | - |
| wave burst | [`EchoRippleIntegrationPatch_Session125.js`](EchoRippleIntegrationPatch_Session125.js:102) | ⚠️ | May not trigger |

### Key Findings

1. **Only cascade.hop and wave.packet.spawn events are confirmed as emitted**
   - These are the only cascade-related events being emitted

2. **Missing visual trigger events**
   - `resonance trigger` - NOT FOUND
   - `harmony spike` - NOT FOUND
   - `wave burst` - PARTIALLY FOUND (in integration patch, may not be active)

3. **Visual systems are primarily data consumers**
   - They read `node.userData.harmonyLevel` from HarmonyStabilizationSystem_v1
   - They do not emit visual trigger events
   - Visual effects are driven by data changes, not event triggers

4. **No event emission for harmony spikes**
   - When `harmonyLevel` peaks, there's no corresponding event
   - Visual systems will naturally reflect the change in next frame

---

## Conclusion

**Event Emission Status:**
- ✅ **cascade.hop** - Emitted
- ✅ **wave.packet.spawn** - Emitted (triggers cascade particles)
- ❌ **resonance trigger** - NOT FOUND
- ❌ **harmony spike** - NOT FOUND
- ⚠️ **wave burst** - PARTIALLY FOUND (in integration patch)

**Visual Trigger Mechanism:**
- Visual systems respond to **data changes** in `node.userData.harmonyLevel`
- Events are primarily for **data notification**, not visual triggers
- Visual effects update automatically when data changes

**System "zomiera" (dies):**
- The harmony data flow chain is functioning
- [`HarmonyStabilizationSystem_v1.js`](HarmonyStabilizationSystem_v1.js:61) is the primary authority
- Visual systems consume the data correctly
- No event emission needed for visual updates

**Recommendation:**
- Visual trigger events are not essential for this system
- Data-driven visual updates are working as intended
- Consider adding explicit visual trigger events if needed for dramatic effects
