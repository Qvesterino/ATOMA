# Core Metrics HUD Update v1.1 - QUICK START

**Time to Integration**: 2 minutes  
**Time to Testing**: 5 minutes  
**Breaking Changes**: 0

---

## 📋 LABEL CHANGES (Only Names, No New Stats)

```
SYNERGY           → NETWORK SYNERGY
HARMONY           → HARMONY FLOW
INSTABILITY       → NETWORK STRESS
CORRUPTION        → CORRUPTION LEVEL
LOAD              → LOAD PRESSURE
CYCLE             → NETWORK TIME (NEW)
EPOCH             → PHASE
AEON              → RUN
```

---

## ⚡ NETWORK TIME PRESSURE (NEW MECHANIC)

**RUNS** when synergy < 85%:
- Counts: 1, 2, 3, 4, 5... (5 units/sec)
- Color: Cyan (#00ddff)
- Format: 5 digits (00000)

**FREEZES** when synergy ≥ 85%:
- Stops incrementing
- Color: Gold (#ffdd00)
- Stays at current value

**Never decreases** - one-way counter only

---

## 🚀 INTEGRATION (2 MIN)

### 1. Replace File
```bash
cp CoreMetricsHUD_v1_1.js CoreMetricsHUD.js
```

### 2. Update main.js (One Line)
**Find this:**
```javascript
this.coreMetricsHUD.update(metrics, temporalDisplay, newEventFlags);
```

**Change to:**
```javascript
this.coreMetricsHUD.update(metrics, temporalDisplay, newEventFlags, deltaTime);
```

### 3. Done!
No other changes needed.

---

## 🧪 TESTING (5 MIN)

1. ✅ Game loads without errors
2. ✅ HUD shows new labels (NETWORK SYNERGY, etc.)
3. ✅ Network Time shows 00000
4. ✅ Drop synergy below 85% → Network Time increments (cyan)
5. ✅ Raise synergy above 85% → Network Time freezes (gold)
6. ✅ No gameplay changes
7. ✅ No FPS drop

---

## 📊 WHAT YOU'LL SEE

### Running (Synergy < 85%)
```
NETWORK TIME: 00347    [CYAN]
              ↑↑↑↑↑ (incrementing)
```

### Frozen (Synergy ≥ 85%)
```
NETWORK TIME: 00347    [GOLD]
              ↑↑↑↑↑ (stopped)
```

---

## ✅ VERIFICATION

- [ ] File replaced
- [ ] main.js updated
- [ ] Game launches
- [ ] HUD labels correct
- [ ] Network Time runs/freezes correctly
- [ ] No errors

---

## 🔄 ROLLBACK (1 MIN)

If needed:
```bash
# Restore backup
cp CoreMetricsHUD.js.backup CoreMetricsHUD.js

# Revert main.js (remove deltaTime parameter)
```

---

**Done!** Core Metrics HUD now shows network pressure with canonical stat names.
