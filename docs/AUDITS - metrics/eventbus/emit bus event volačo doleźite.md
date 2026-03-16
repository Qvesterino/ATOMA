# semanticBus.emit Calls: Wave, Cascade, Burst, and Resonance Events

## CRITICAL FINDING: Direct Code Search Returns No Results

All searches for `semanticBus.emit` calls in the codebase returned **zero results**. However, the audit documentation reveals that this is because:

1. **Event emission uses wrapper methods** - Systems use abstraction layers like `WaveBurstRouter_v1` rather than direct `semanticBus.emit` calls
2. **Events are documented but not fully implemented** - Many events are defined in listeners but never actually emitted

## EVENT ARCHITECTURE SUMMARY

Based on the audit documentation, here are the wave/cascade/burst/resonance events that **should be emitted** but have varying implementation status:

---

## WAVE EVENTS

### `wave.burst.lifecycle`
- **Intended Emitter:** WaveInterferenceEngine
- **Documented In:** Complete Event Inventory
- **Actual Status:** ❌ NOT EMITTED
- **Note:** Documented as an emitter but no actual emission found in audits

### `wave.regime.transition`
- **Intended Emitter:** WaveInterferenceEngine
- **Documented In:** Complete Event Inventory
- **Actual Status:** ❌ NOT EMITTED
- **Note:** Documented as an emitter but no actual emission found in audits

---

## CASCADE EVENTS

### `harmonic.cascade.start`
- **Intended Emitter:** HarmonicHubAuraSystem_Session126.js
- **Documented In:** Cascade Master Audit
- **Actual Status:** ❌ NOT EMITTED (despite being documented as active)
- **Trigger Condition:** Harmonic cascade triggers when hub strength > 0.3 and harmony > 0.4

### `cascade.triggered`
- **Intended Emitter:** Unknown (multiple candidates)
- **Documented In:** Wave Burst Audit
- **Actual Status:** ❌ NEVER EMITTED
- **Note:** WaveBurstRouter_v1 listens for this event, but audit confirms it's never emitted

### `cascade.hop`
- **Intended Emitter:** Cascade propagation system
- **Documented In:** Resonance Systems Runtime Audit
- **Listeners:**
  - CascadeResonanceWaveVisualization_Session146 (spawnCascadeResonanceWave)
  - ResonanceCascadeVisualization_Session117B (_boundHandleCascadeHop)
- **Actual Status:** ❌ NOT EMITTED

### `cascade.start`
- **Intended Emitter:** Cascade system
- **Documented In:** Resonance Systems Runtime Audit
- **Listeners:**
  - ResonanceCascadeVisualization_Session117B (_boundHandleCascadeStart)
- **Actual Status:** ❌ NOT EMITTED

### `cascade.end`
- **Intended Emitter:** Cascade system
- **Documented In:** Resonance Systems Runtime Audit
- **Listeners:**
  - ResonanceCascadeVisualization_Session117B (_boundHandleCascadeEnd)
- **Actual Status:** ❌ NOT EMITTED

---

## RESONANCE EVENTS

**No explicit resonance events are emitted via semanticBus.**

Resonance systems (6 active systems) use:
- **Direct method calls** for data flow
- **Polling** for state updates
- **Manual update loops** (60Hz) instead of events

---

## WAVE BURST EVENT SUBSCRIPTIONS

### WaveBurstRouter_v1 Event Listeners (12 total)

#### WORKING (3 events):
1. **`link.created`** ✅ EMITTED by NodeLinkingSystem/main.js
   - Condition: User creates a link
   - Effect: Triggers link creation cascade burst

2. **`link:collapsed`** ✅ EMITTED by NodeLinkingSystem
   - Condition: User collapses a link
   - Effect: Triggers link collapse corruption burst

3. **`node.selected`** ✅ EMITTED by main.js
   - Condition: User selects a node
   - Effect: Debug burst only

#### USER INTERACTION DEBUG (2 events):
4. **`node.hover`** ✅ EMITTED by InputRuntime_v1
   - Condition: User hovers over node
   - Effect: Debug burst only

5. **`node.click`** ✅ EMITTED by InputRuntime_v1
   - Condition: User clicks node
   - Effect: Debug burst only

#### NEVER EMITTED (7 events):
6. **`node.synergy.high`** ❌ Never emitted
7. **`metric:synergySpike`** ❌ Never emitted
8. **`cascade.triggered`** ❌ Never emitted
9. **`harmonic.cascade.start`** ❌ Never emitted
10. **`node.corruption.high`** ❌ Never emitted
11. **`node.failure`** ❌ Never emitted
12. **`metric:corruptionRise`** ❌ Never emitted

---

## TRIGGER CONDITIONS (From Documentation)

### Harmonic Cascade (Intended)
- **Condition:** Harmony > 0.4 AND Hub strength > 0.3
- **Resonance Energy:** harmony × (0.5 + synergy × 0.2 × resilience)
- **Should Emit:** `harmonic.cascade.start`

### Synergy Cascade (Intended)
- **Condition:** Synergy > 0.7
- **Should Emit:** `cascade.triggered` or `event:synergyCascade`

### Corruption Events (Intended)
- **Condition:** Corruption threshold crossed
- **Should Emit:** `metric:corruptionRise` or `network:corruptionSpread`

### Secondary Hub Crossing (Intended)
- **Condition:** Node crosses secondary-hub threshold (cascadeStrength > 0.7)
- **Should Emit:** Wave burst request via `requestBurstIntent()`
- **Actual Status:** ❌ CascadingHarmonicResonanceAmplification is NOT registered in FrameScheduler

---

## KEY ARCHITECTURAL ISSUES

1. **Event Definition Without Implementation**
   - Events are subscribed to but never emitted
   - WaveBurstRouter_v1 listens to 12 events, only 5 are actually emitted
   - Of those 5, only 3 are gameplay-relevant

2. **Polling Dominance**
   - Most systems use 60Hz polling instead of events
   - All resonance systems use manual update loops
   - No semanticBus event integration for most systems

3. **Missing Event Emitters**
   - HarmonicHubAuraSystem_Session126: Should emit `harmonic.cascade.start` (doesn't)
   - CascadingHarmonicResonanceAmplification: Should emit cascade events (doesn't)
   - LinkCorruptionTransmission: Should emit corruption events (doesn't)

4. **Cascade Hop Events Never Triggered**
   - Multiple systems listen to `cascade.hop` events
   - No system actually emits these events
   - Cascade wave visualizations never activate

---

## SUMMARY

| Event Type | Events | Emitters | Listeners | Actual Status |
|------------|--------|----------|-----------|---------------|
| Wave | 2 | 1 (intent) | 1 (router) | ❌ NOT EMITTED |
| Cascade | 5 | 1 (intent) | 3+ | ❌ NOT EMITTED |
| Burst | 0 | 0 | 1 (router) | ❌ DEAD |
| Resonance | 0 | 0 | 0 | ❌ N/A |

**CONCLUSION:** While the event infrastructure exists (listeners, routers, documentation), the actual `semanticBus.emit` calls for wave, cascade, burst, and resonance events are either:
1. Never implemented (most common)
2. Wrapped in abstraction layers that don't use `semanticBus.emit` directly
3. Implemented in dormant systems that aren't updated

The wave/cascade/burst/resonance systems primarily use **direct method calls** and **polling** rather than semantic events.