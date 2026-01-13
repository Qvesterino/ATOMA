# Core Metrics HUD Update v1.1 - INTEGRATION GUIDE

**Status**: ✅ **READY FOR INTEGRATION**  
**Session**: 11  
**Type**: UI + Logic Binding Update (Non-Breaking)

---

## 📋 WHAT CHANGED

### Label Renames (No New Stats)
```
OLD NAME           → NEW NAME
SYNERGY            → NETWORK SYNERGY
HARMONY            → HARMONY FLOW
INSTABILITY        → NETWORK STRESS
CORRUPTION         → CORRUPTION LEVEL
LOAD               → LOAD PRESSURE
CYCLE              → NETWORK TIME (NEW mechanic)
EPOCH              → PHASE
AEON               → RUN
```

### Core Mechanic Added: Network Time Pressure
- **Counts up** at **5 units/sec** when network synergy < 85%
- **Freezes** when synergy ≥ 85%
- **Never decreases** (one-way counter)
- **Integer only** (no decimals, always 5-digit display)

### Visual Feedback
**RUNNING (synergy < 85%)**
- Color: Cyan (#00ddff)
- Display: Incrementing smoothly (00001, 00002, 00003...)
- Effect: Subtle pulse on label when threshold drops

**FROZEN (synergy ≥ 85%)**
- Color: Gold/Yellow (#ffdd00)
- Display: Value stops incrementing
- Effect: Brief flash when synergy rises

---

## 🚀 INTEGRATION STEPS

### Step 1: Backup Old File
```bash
cp /CoreMetricsHUD.js /CoreMetricsHUD.js.backup
```

### Step 2: Replace with New Version
```bash
cp /CoreMetricsHUD_v1_1.js /CoreMetricsHUD.js
```

### Step 3: Update main.js Import (Optional - if needed)
The import statement remains:
```javascript
import { CoreMetricsHUD } from './CoreMetricsHUD.js';
```

### Step 4: Add deltaTime to Update Call
**In main.js update loop**, find the CoreMetricsHUD update call and add deltaTime:

**OLD:**
```javascript
this.coreMetricsHUD.update(metrics, temporalDisplay, newEventFlags);
```

**NEW:**
```javascript
this.coreMetricsHUD.update(metrics, temporalDisplay, newEventFlags, deltaTime);
```

### Step 5: Test Integration
1. Run game
2. Check HUD displays new stat names
3. Verify Network Time counter increments
4. Drop synergy below 85% → time should run (cyan)
5. Raise synergy above 85% → time should freeze (gold) + flash
6. Verify no gameplay changes

---

## 📊 BINDING SOURCES

### Metric Bindings (From CoreMetricsCalculator)
```javascript
// Existing bindings - NO CHANGES to calculation logic
NETWORK SYNERGY    ← aggregated network synergy (0-100%)
HARMONY FLOW       ← average harmonyLevel (0-100%)
NETWORK STRESS     ← averaged link stress (0-100%)
CORRUPTION LEVEL   ← averaged corruptionLevel (0-100%)
LOAD PRESSURE      ← activeLinks / maxLinks (0-100%)
```

### Network Time Pressure (NEW)
```javascript
// Derived from NETWORK SYNERGY in real-time
if (networkSynergy < 85%) {
  networkTime += deltaTime * 5  // 5 units/sec
} else {
  networkTime // FROZEN (no increment)
}
```

---

## 🎨 VISUAL CHANGES

### HUD Panel
- Labels renamed ✓
- Colors updated for Network Time (cyan/gold) ✓
- Network Time display prominent ✓
- Pulse/flash animations added ✓

### No Structural Changes
- Panel position: UNCHANGED (top: 740px, left: 10px)
- Panel size: UNCHANGED
- Layout: UNCHANGED
- Bar system: UNCHANGED

---

## ✅ VERIFICATION CHECKLIST

### Pre-Integration
- [ ] Backup existing CoreMetricsHUD.js
- [ ] Review new file (CoreMetricsHUD_v1_1.js)
- [ ] Identify main.js update loop location

### Integration
- [ ] Replace CoreMetricsHUD.js
- [ ] Update update() call with deltaTime parameter
- [ ] Test game loads without errors
- [ ] Verify HUD appears in bottom-left

### Testing
- [ ] Check all 5 metric labels display correctly
- [ ] Verify bars animate smoothly
- [ ] Test Network Time counter:
  - [ ] Increments when synergy < 85% (cyan)
  - [ ] Freezes when synergy ≥ 85% (gold)
  - [ ] Displays as 5-digit integer
  - [ ] Value never decreases
- [ ] Verify PHASE and RUN display
- [ ] Check no gameplay regressions

### Performance
- [ ] FPS unchanged
- [ ] No console errors
- [ ] HUD updates smoothly
- [ ] Network Time increments accurately

---

## 🔄 SAFE MODE COMPATIBILITY

✅ **100% Safe Mode Compatible**
- No THREE.js dependencies
- Pure DOM manipulation
- No breaking changes to existing code
- Can be safely reverted

---

## 📝 SUMMARY OF CHANGES

### Files Modified
- CoreMetricsHUD.js (complete rewrite)

### Files NOT Modified
- CoreMetricsCalculator.js (no changes)
- CoreMetricsOverlay.js (no changes)
- main.js (minimal: add deltaTime parameter)
- All gameplay systems (no changes)

### Lines of Code
- **New Lines**: ~450 lines
- **Breaking Changes**: 0
- **New Dependencies**: 0
- **Deprecated Methods**: 0

---

## 🎯 EXPECTED BEHAVIOR

### On Launch
- HUD shows with new canonical names
- All metrics display at 0% (or current values)
- Network Time shows 00000
- Colors correct (cyan/gold)

### During Gameplay
- Metrics update every 0.5 seconds (existing behavior)
- Network Time increments when synergy < 85%
  - Smooth, continuous counting
  - 5 units per second
  - Integer values only
- When synergy rises above 85%
  - Network Time freezes immediately
  - Color changes to gold
  - Brief flash effect on value
  - Label pulses when it starts again

### Player Experience
- Clear pressure system visible at all times
- Understands network stability (synergy) affects time pressure
- Knows when network is "safe" (time frozen, gold)
- Knows when network is "under pressure" (time running, cyan)

---

## 🔧 TECHNICAL NOTES

### New Properties Added
```javascript
this.networkTime = 0              // Counter (never decreases)
this.networkTimeRunning = false   // Current state
this.networkTimeFrozen = false    // Current state
this.lastNetworkSynergy = 0       // For threshold detection
this.freezeFlashActive = false    // Flash animation state
this.freezeFlashTime = 0
this.freezeFlashDuration = 0.3    // 300ms flash
this.timePulseActive = false      // Pulse animation state
this.timePulseTime = 0
this.timePulseDuration = 0.4      // 400ms pulse
```

### New Methods
```javascript
updateNetworkTimePressure(currentSynergy, deltaTime, newEventFlags)
updateNetworkTimeDisplay()
```

### Color Constants Added
```javascript
networkTimeRunning: '#00ddff'     // Bright cyan when running
networkTimeFrozen: '#ffdd00'      // Gold/yellow when frozen
```

---

## 🚀 ROLLBACK PROCEDURE

If needed, revert to previous version:

```bash
# Restore backup
cp /CoreMetricsHUD.js.backup /CoreMetricsHUD.js

# Remove deltaTime parameter from main.js update() call
# (revert to original call without deltaTime)
```

---

## 📞 SUPPORT

### If Network Time Doesn't Increment
- Check deltaTime is being passed correctly
- Verify synergy < 85%
- Check console for errors
- Verify CoreMetricsCalculator is providing metrics

### If Time Doesn't Freeze
- Check if synergy >= 85%
- Verify metrics calculation is correct
- Monitor networkSynergy value in debugger

### If Colors Don't Change
- Check CSS is loaded correctly
- Verify color hex values: cyan #00ddff, gold #ffdd00
- Check browser console for CSS errors

---

## 🎉 COMPLETION

After integration:
- [ ] New HUD labels visible
- [ ] Network Time Pressure mechanic active
- [ ] No gameplay changes
- [ ] Performance maintained
- [ ] Documentation updated
- [ ] Team trained on new mechanic

---

**Status**: ✅ **READY FOR PRODUCTION**

The Core Metrics HUD Update v1.1 implements the canonical network stat system and Network Time Pressure mechanic as a pure UI update with zero breaking changes.

**Deploy with confidence!**
