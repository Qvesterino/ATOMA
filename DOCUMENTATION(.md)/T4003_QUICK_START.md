# T4-003: Quick Start Guide — Corruption Cascade Test

**TL;DR**: Open browser console, run one command, get test results.

---

## VERIFY SYSTEM IS READY

```javascript
window.checkCorruptionSystemStatus()
```

Look for:
- ✅ `active: true`
- ✅ `linkCount: ≥ 1`
- ✅ `updateMethod: "updateTransmission"`

---

## RUN THE TEST

```javascript
window.runCorruptionCascadeTest()
```

**This will:**
1. Check system initialized ✓
2. Seed corruption to 0.92 ✓
3. Run 60 frames ✓
4. Log threshold crossings ✓
5. Return full report ✓

---

## READ THE RESULTS

Test output shows:

```
=== TEST RESULTS ===

Initialization Status:
✓ Corruption system: ACTIVE
✓ Frame loop: ACTIVE
✓ Linking system: ACTIVE

Propagation Trace:
  Initial Corruption: 0.920
  Cascades Logged: 3

Cascade Threshold Results:
  0.45 → triggered=YES, gameplayEffect=ACTIVE, visualEffect=DISTORTION_SHADER
  0.65 → triggered=YES, gameplayEffect=ACTIVE, visualEffect=PARTICLE_BURST
  0.85 → triggered=YES, gameplayEffect=ACTIVE, visualEffect=CASCADE_WAVE

✅ TEST PASSED
```

---

## WHAT'S BEING TESTED

| Threshold | Event | Gameplay | Visual |
|-----------|-------|----------|--------|
| 0.45 | Distortion | Shader active | Distortion effect |
| 0.65 | Particles | Emission active | Particle burst |
| 0.85 | Cascade | Node infection | Wave animation |

---

## IF TEST FAILS

**Corruption doesn't propagate?**
- Check link corruption is seeded: `window.snapshotCorruptionState()`
- Manual seed: `window.setLinkCorruption(0, 0.95)`

**Threshold not triggered?**
- Corruption may spread too slowly
- Run test again with more frames
- Check harmony/synergy aren't blocking (see detailed report)

**Visual effects missing?**
- Check console for errors
- Verify T2_CorruptionVisualIntegration_v1 initialized
- Look for userData fields on links

---

## DETAILED COMMANDS

```javascript
// Check status (fast)
window.checkCorruptionSystemStatus()

// See current link state (snapshot)
window.snapshotCorruptionState()

// Manually set corruption on specific link
window.setLinkCorruption(linkIndex, level)
// Example: window.setLinkCorruption(2, 0.95)

// Run full test (1-2 seconds)
window.runCorruptionCascadeTest()
```

---

## EXPECTED OUTPUT

Test completes in ~1-2 seconds and returns:

```javascript
{
  timestamp: "2024-...",
  initializationStatus: {
    corruptionSystem: "ACTIVE",
    frameLoop: "ACTIVE",
    linkingSystem: "ACTIVE"
  },
  prerequisitesMetAll: true,
  propagationTrace: {
    sourceLink: "node-1-node-2",
    framesUntilFirstSpread: 5,
    spreadFrames: [
      { frame: 15, threshold: 0.45, level: 0.450, event: "DISTORTION_ACTIVATE" },
      { frame: 32, threshold: 0.65, level: 0.651, event: "PARTICLE_BURST" },
      { frame: 51, threshold: 0.85, level: 0.852, event: "CASCADE_EVENT" }
    ]
  },
  cascadeThresholdTable: {
    0.45: { triggered: true, event: "DISTORTION_ACTIVATE", ... },
    0.65: { triggered: true, event: "PARTICLE_BURST", ... },
    0.85: { triggered: true, event: "CASCADE_EVENT", ... }
  },
  anomalies: [],
  success: true
}
```

---

## KEY METRICS

- **Corruption Seeded**: 0.92 (high, triggers all cascades)
- **Simulation Duration**: 60 frames (~1 sec at 60 FPS)
- **Thresholds Tested**: 3 (0.45, 0.65, 0.85)
- **Frame Rate**: 60 FPS (deltaTime = 1/60)
- **Spread Rate**: Variable (depends on synergy/harmony)

---

## SUCCESS = All Three Cascades Triggered

✅ 0.45 → DISTORTION  
✅ 0.65 → PARTICLES  
✅ 0.85 → CASCADE  

Each one:
- Crosses threshold in ascending order ✓
- Triggers gameplay effect ✓
- Triggers visual effect ✓
- Logged to history ✓

---

## Document Locations

- **Full System**: `/LinkCorruptionTransmission_v1.js`
- **Test Runner**: `/_T4003_CORRUPTION_CASCADE_TEST_RUNNER.js`
- **Executive Summary**: `/T4003_CORRUPTION_CASCADE_TEST_EXECUTION_SUMMARY.md`
- **Integration Point**: `/main.js` line 2325

---

**Ready?** Open browser console and type:
```
window.runCorruptionCascadeTest()
```
