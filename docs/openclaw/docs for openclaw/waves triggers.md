# ATOMA WAVE TRIGGER AUDIT REPORT

## Executive Summary
Audit complete. Identified **4** trigger systems with **2** active pathways to the WaveInterferenceEngine.

---

## 1. PRIMARY WAVE ENGINE ENTRY POINT

**File:** `WaveInterferenceEngine_v1.js`
- **Method:** `requestBurstIntent(intentPayload)`
- **Status:** ✅ ACTIVE - Main entry point for all wave bursts
- **Accepts:** `{ type, fromRegime, toRegime, center, intensity, sourceId, metadata }`

---

## 2. WAVE BURST ROUTER (PRIMARY ACTIVE TRIGGER)

**File:** `WaveBurstRouter_v1.js`
- **Status:** ✅ **ACTIVE** - Main trigger system
- **Init:** Called from `main.js` init() phase
- **Cooldown:** 1.5 seconds between bursts
- **Intensity Clamp:** 0-1 range
- **Origin Jitter:** ±0.3 units

### Trigger Events (13 total):

#### Synergy Events (2)
- `node.synergy.high` → harmonic burst
- `metric:synergySpike` → harmonic burst
- **Threshold:** synergy ≥ 0.7

#### Cascade Events (3)
- `cascade.triggered` → cascade burst
- `harmonic.cascade.start` → cascade burst
- `link.created` → cascade burst (NEW)

#### Corruption Events (5)
- `node.corruption.high` → destructive burst
- `node.failure` → destructive burst
- `metric:corruptionRise` → destructive burst
- `network:corruptionSpread` → destructive burst
- `link:collapsed` → destructive burst
- **Threshold:** corruption ≥ 0.5

#### User Interaction Events (3)
- `node.hover` → probe burst (intensity 0.4)
- `node.click` → probe burst (intensity 0.4)
- `node:selected` → probe burst (intensity 0.4)

#### Global Gameplay Events (5) - via semanticBus.on()
- `event:synergyCascade` → synergy burst
- `event:harmonyResonance` → harmonic burst
- `event:corruptionOutbreak` → corruption burst
- `event:instabilityTrap` → corruption burst
- `event:loadCollapse` → corruption burst

#### Ambient System (1)
- **Auto-trigger** every 2.0 seconds
- Type: `ambient` → harmonic burst
- Intensity: 0.15 (max 0.2)

---

## 3. MAIN.JS INTEGRATION

**Location:** `main.js` init() method (lines ~2600-2630)

```javascript
// Initialize Wave Burst Router
try {
    this.waveBurstRouter = setupWaveBurstRouter(this);
    console.log('[main.js] WaveBurstRouter initialized ✓');
} catch (err) {
    console.warn('[main.js] WaveBurstRouter failed:', err);
}
```

**Console APIs Exposed:**
- `window.debugWaveRouterStatus()` - View router state
- `window.debugWaveBurst(type)` - Manually trigger burst
- `window.debugWaveSnapshot()` - Get active wave state

---

## 4. HARMONIC CASCADE AMPLIFICATION (INACTIVE)

**File:** `HarmonicCascadeAmplification_Session145.js`
- **Status:** ❌ **DISABLED** - Safe skeleton only
- **Reason:** All cascade methods commented out with `// DISABLED: Cascades are OFF`
- **Comment:** "All cascade methods are disabled - safe skeleton for future reactivation"
- **Methods:** All return early, no logic executed
- **Wave Triggering:** NONE

---

## 5. CASCADE RESONANCE WAVE VISUALIZATION (BROKEN TRIGGER)

**File:** `CascadeResonanceWaveVisualization_Session146.js`
- **Status:** ⚠️ **LISTENING BUT NEVER TRIGGERED**
- **Listens to:** `cascade.hop` semantic bus event
- **Action:** Creates ripple visual when cascade hops between nodes

**PROBLEM:**
```
Search for "cascade.hop" across ALL .js files: 0 results
```

**Conclusion:** This system listens to an event that is never emitted anywhere in the codebase.

**Where it should come from:**
- HarmonicCascadeAmplification (BUT: disabled)
- CascadingRuptureSystem (NO: does not emit cascade.hop)
- PHASE5CascadePropagationVisuals (NO: uses cascadeTriggered, not cascade.hop)

---

## SUMMARY TABLE

| System | File | Status | Triggers Waves? | Notes |
|--------|-------|---------|------------------|-------|
| WaveInterferenceEngine | WaveInterferenceEngine_v1.js | ✅ ACTIVE | N/A | Engine itself, accepts intents |
| WaveBurstRouter | WaveBurstRouter_v1.js | ✅ ACTIVE | YES | Main trigger (13 event types + ambient) |
| HarmonicCascadeAmplification | HarmonicCascadeAmplification_Session145.js | ❌ DISABLED | NO | All methods commented out |
| CascadeResonanceWaveVisualization | CascadeResonanceWaveVisualization_Session146.js | ⚠️ LISTENING | NO | cascade.hop event never emitted |

---

## ACTIVE TRIGGER PATHWAYS

### Path 1: WaveBurstRouter → WaveInterferenceEngine
```
Semantic Events → WaveBurstRouter.requestBurstIntent() → WaveInterferenceEngine.requestBurstIntent()
```

**Events:** 13 semantic + 1 ambient (14 total)
**Cooldown:** 1.5s
**Active:** ✅ YES

### Path 2: Manual Console API → WaveInterferenceEngine
```
window.debugWaveBurst(type) → WaveInterferenceEngine.requestBurstIntent()
```

**Active:** ✅ YES (manual debug tool)

---

## INACTIVE/DEAD TRIGGER PATHWAYS

### Path 3: cascade.hop event → CascadeResonanceWaveVisualization
```
??? → cascade.hop event → CascadeResonanceWaveVisualization (never fires)
```

**Status:** ❌ BROKEN - Event never emitted
**Recommendation:** Fix emitter or disable listener

### Path 4: HarmonicCascadeAmplification → ??? → waves
```
HarmonicCascadeAmplification (disabled) → ??? → (no output)
```

**Status:** ❌ DISABLED - All cascade methods commented out

---

## RECOMMENDATIONS

### High Priority
1. **Fix or disable CascadeResonanceWaveVisualization**
   - Option A: Implement cascade.hop emitter in active system
   - Option B: Disable the listener to prevent dead code

2. **Document WaveBurstRouter event contracts**
   - Add JSDoc comments for each event handler
   - Document threshold values and cooldown behavior

### Medium Priority
3. **Consider merging duplicate event subscriptions**
   - WaveBurstRouter has 13 subscriptions
   - Some events (node.synergy.high, metric:synergySpike) may overlap

4. **Add event audit logging**
   - Track which events actually trigger bursts in production
   - Help balance ambient vs. reactive wave frequency

### Low Priority
5. **Re-enable HarmonicCascadeAmplification if needed**
   - Currently all methods disabled
   - Should be either fully removed or fully documented

---

## CONCLUSION

**Active Wave Triggers:** 1 (WaveBurstRouter)  
**Inactive/Broken Wave Triggers:** 2 (HarmonicCascadeAmplification, CascadeResonanceWaveVisualization)  
**Total Event Sources:** 13 semantic + 1 ambient + 1 manual (15 total)  
**Primary Entry Point:** WaveInterferenceEngine.requestBurstIntent()

Wave trigger system is functional but has one dead listener (cascade.hop) and one disabled cascade system.