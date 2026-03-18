# Event Emission Analysis

Generated: 2026-03-18T19:33:00Z

## Overview

This document analyzes which events are emitted by systems and whether they trigger visual effects or are just data consumption.

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
- **Visual Trigger:** Unknown (needs verification)

---

### 2. WAVE EVENTS

**wave.packet.spawn**
- **Emitter:** [`CascadeParticleSystem_Session120.js`](CascadeParticleSystem_Session120.js:373)
- **Code:**
```javascript
this._emit(count, link, 0, 'forward', 'resolved_harmony', currentCascadeTime, sourcePosition, targetPosition);
```
- **Status:** ✅ EMITTED
- **Visual Trigger:** Cascade particle system
- **Purpose:** Spawns cascade particles along links

---

### 3. RESONANCE EVENTS

**resonance trigger**
- **Emitter:** Not found in search
- **Status:** ❌ NOT FOUND
- **Expected Location:** HarmonicResonanceCoupling_v1 or similar

**wave.packet.spawn**
- **Emitter:** [`WaveInterferenceEngine_v1.js:800`](WaveInterferenceEngine_v1.js:800)
- **Code:**
```javascript
if (bus.priority) {
    bus.emit('wave.packet.spawn', payload, {
        priority: bus.priority.INTERACTIVE ?? bus.priority.NORMAL
    });
}
```
- **Status:** ✅ EMITTED
- **Visual Trigger:** Unknown (needs verification)

---

### 4. HARMONY EVENTS

**harmony spike**
- **Emitter:** Not found in search
- **Status:** ❌ NOT FOUND
- **Expected Location:** MetricsRuntime_v1 or similar

---

### 5. SEMANTIC BUS EVENTS

The semanticBus is the central event system. Many events are emitted here:

**Node Lifecycle Events:**
- `node.spawned` - [`NetworkRituals_v1.js:423`](NetworkRituals_v1.js:423)
- `node.synergy.high` - [`MetricsRuntime_v1.js:540`](MetricsRuntime_v1.js:540)
- `metric.node.updated` - [`MetricsRuntime_v1.js:192`](MetricsRuntime_v1.js:192)

**Network Events:**
- `network.synergy.shift`
- `network.stress.rise`
- `network.corruption.rise`
- `network.harmony.shift`
- `network.stability.drop`
- `network.ability.drop`
- `network.synergy.shift`
- `network.stress.rise`
- `network.corruption.rise`
- `network.harmony.shift`
- `network.stability.drop`
- `network.ability.drop`

**Link Events:**
- `link.synergy.high` - [`MetricsRuntime_v1.js:635`](MetricsRuntime_v1.js:635)
- `link.synergyThreshold`
- `link.harmonicLock`
- `link.destroyed`
- `link.created`
- `link.collapsed`
- `link.recovery`

**Metric Events:**
- `metric:corruption.spread` - [`LinkCorruptionTransmission_v1.js:849`](LinkCorruptionTransmission_v1.js:849)
- `metric:corruptionOutbreak` - [`LinkCorruptionTransmission_v1.js:905`](LinkCorruptionTransmission_v1.js:905)
- `metric:harmonyResonance` - Not found in search
- `metric:harmonyPeak` - [`MetricsRuntime_v1.js:698`](MetricsRuntime_v1.js:698)
- `metric:harmonyShift` - [`MetricsRuntime_v1.js:713`](MetricsRuntime_v1.js:713)
- `metric:stress.rise` - [`MetricsRuntime_v1.js:760`](MetricsRuntime_v1.js:760)
- `metric:stability.drop` - [`MetricsRuntime_v1.js:822`](MetricsRuntime_v1.js:822)
- `metric:loadPressure.rise` - [`MetricsRuntime_v1.js:868`](MetricsRuntime_v1.js:868)
- `metric:ability.drop` - [`MetricsRuntime_v1.js:876`](MetricsRuntime_v1.js:876)

**Other Events:**
- `metric:synergy.spike` - [`MetricsRuntime_v1.js:698`](MetricsRuntime_v1.js:698)
- `network:stress.rise` - [`MetricsRuntime_v1.js:760`](MetricsRuntime_v1.js:760)
- `network:stress.rise` - [`MetricsRuntime_v1.js:760`](MetricsRuntime_v1.js:760)
- `network:stability.drop` - [`MetricsRuntime_v1.js:822`](MetricsRuntime_v1.js:822)
- `network:ability.drop` - [`MetricsRuntime_v1.js:876`](MetricsRuntime_v1.js:876)

---

## Event Map

| Event | Emitter | File | Status | Visual Trigger |
|--------|---------|--------|--------------|
| cascade.hop | [`CascadingHarmonicResonanceAmplification.js:540`](CascadingHarmonicResonanceAmplification.js:540) | ✅ | Unknown |
| wave.packet.spawn | [`CascadeParticleSystem_Session120.js`](CascadeParticleSystem_Session120.js:373) | ✅ | Cascade particles |
| wave.packet.spawn | [`WaveInterferenceEngine_v1.js:800`](WaveInterferenceEngine_v1.js:800) | ✅ | Unknown |
| resonance trigger | Not found | - | ❌ | - |
| harmony spike | Not found | - | ❌ | - |

---

## Analysis

### Events Being Emitted

1. **cascade.hop** - Emitted via semanticBus
   - **Purpose:** Notify when cascade hops to next node
   - **Visual Impact:** Unknown (depends on consumer)

2. **wave.packet.spawn** - Emitted via CascadeParticleSystem
   - **Purpose:** Spawn cascade particles
   - **Visual Impact:** ✅ Cascade particles

3. **wave.packet.spawn** - Emitted via WaveInterferenceEngine
   - **Purpose:** Spawn wave packets
   - **Visual Impact:** Unknown (depends on consumer)

### Events NOT Found

1. **resonance trigger** - No emitter found
   - **Expected:** HarmonicResonanceCoupling_v1 or similar
   - **Impact:** Missing resonance visual feedback

2. **harmony spike** - No emitter found
   - **Expected:** MetricsRuntime_v1 or similar
   - **Impact:** Missing harmony spike visual feedback

---

## Visual System Behavior

**Consumers (Read-Only):**
- [`LinkRendererConduit.js`](LinkRendererConduit.js:252) - Reads `node.userData.harmonyLevel`
- [`LinkRendererConduit.js:255`](LinkRendererConduit.js:255) - Reads `link.userData.harmonyLevel`
- [`LinkRendererConduit.js:306`](LinkRendererConduit.js:306) - Reads `link.userData.harmonyLevel`
- [`T2_HarmonyVisualConsumer_v1.js`](src/legacy/T2_HarmonyVisualConsumer_v1.js:1) - Reads `node.userData.harmonyLevel`

**Producers (Write):**
- [`HarmonyStabilizationSystem_v1.js`](HarmonyStabilizationSystem_v1.js:854) - Writes `node.userData.harmonyLevel`
- [`HarmonyStabilizationSystem_v1.js`](HarmonyStabilizationSystem_v1.js:905) - Writes `link.userData.harmonyLevel`

---

## Conclusion

**Events are being emitted** by the semanticBus and cascade systems.

**Visual systems are primarily consuming data** from `node.userData.harmonyLevel`.

**Missing visual trigger events:**
- ❌ `resonance trigger` - Not found
- ❌ `harmony spike` - Not found

**Recommendation:**
- Verify if visual systems are responding to `cascade.hop` events
- Check if `wave.packet.spawn` events trigger visual effects
- Investigate if `resonance trigger` and `harmony spike` events exist or need to be added
