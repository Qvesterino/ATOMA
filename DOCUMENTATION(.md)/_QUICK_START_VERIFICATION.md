# QUICK START: VERIFICATION IN 5 MINUTES ⚡

**Goal**: Quickly verify all systems working  
**Time**: ~5 minutes  
**Location**: Browser console (F12)

---

## 🚀 STEP 1: Verify Deployment (30 seconds)

Load game and check console for:
```
✓ Simulation Invariant Enforcement initialized (TASK 2)
✓ Rare Node Verification Tracker initialized (TASK 3)
```

**Expected**: ✅ Both messages visible

---

## 🔍 STEP 2: Check APIs (30 seconds)

Run in console:
```javascript
window.__rareNodeTracker && window.__simulationInvariant
```

**Expected**: ✅ Returns `true`

---

## ⏰ STEP 3: Wait for Rare Node (60+ seconds)

Just play normally. Rare nodes spawn every ~60 seconds with 5-15% chance.

---

## 📊 STEP 4: Run Report (30 seconds)

In console:
```javascript
window.__rareNodeTracker.report()
```

**Expected Output**:
```javascript
{
  frame: 1234,
  specialNodesTracked: > 0,      // ✅ Rare nodes exist
  failures: [],                   // ✅ No failures
  failureCount: 0                 // ✅ Zero failures
}
```

---

## 📈 STEP 5: Check Coverage (30 seconds)

In console:
```javascript
window.__rareNodeTracker.updateCoverage()
```

**Expected**: All nodes show `status: 'UPDATING'` ✅

---

## 👁️ STEP 6: Check Shells (30 seconds)

In console:
```javascript
window.__rareNodeTracker.shellStatus()
```

**Expected**: All show `shellVisible: true` ✅

---

## 🔗 STEP 7: Link Test (2 minutes)

1. Find a rare node in the world
2. Link it to another node
3. Run: `window.__rareNodeTracker.shellStatus()`
4. **Expected**: Shells still visible ✅
5. Unlink
6. Run: `window.__rareNodeTracker.shellStatus()`
7. **Expected**: Shells STILL visible ✅

---

## ✅ FINAL CHECK (30 seconds)

Run all diagnostics:
```javascript
console.log('=== VERIFICATION SUMMARY ===');
console.log('Invariant Coverage:', window.__simulationInvariant.coverage());
console.log('Rare Nodes Report:', window.__rareNodeTracker.report());
console.log('Update Coverage:', window.__rareNodeTracker.updateCoverage());
console.log('Shell Status:', window.__rareNodeTracker.shellStatus());
```

**All should show healthy status** ✅

---

## 🎯 PASS/FAIL CRITERIA

### ✅ PASS if:
- Deployment messages visible
- APIs accessible
- Rare nodes spawned
- All nodes updating
- All shells visible
- No failures detected
- Links work correctly

### ❌ FAIL if:
- Any console error
- APIs undefined
- Failures array not empty
- Any node not updating
- Any shell invisible
- Execution stops

---

## 🔧 Quick Command Reference

```javascript
// Status check (MOST IMPORTANT)
window.__rareNodeTracker.report()

// Individual checks
window.__rareNodeTracker.updateCoverage()  // Are nodes updating?
window.__rareNodeTracker.shellStatus()     // Are shells visible?
window.__rareNodeTracker.failures()        // Any failures?

// Invariant check
window.__simulationInvariant.coverage()    // Update coverage %

// Turn on detailed logging
window.__rareNodeTracker.enable()
```

---

## ⏱️ TIMELINE

| Time | Action | Expected |
|------|--------|----------|
| 0:00 | Load game | Deployment messages |
| 0:30 | Check APIs | Both return true |
| 1:30 | Run report | Zero failures |
| 2:00 | Check coverage | 100% updating |
| 2:30 | Check shells | All visible |
| 4:30 | Link test | Shells remain visible |
| 5:00 | Final check | All green ✅ |

---

## 🎬 COMMON SCENARIOS

### No Rare Nodes Spawning Yet
- **Wait**: Rare nodes check every 60s with 5-15% chance
- **Expected**: First node usually within 2-5 minutes
- **Action**: Be patient, natural spawning system

### Shell Not Visible
- **Check**: `shellFound: false` vs `shellVisible: false`
- **If Not Found**: Rare node type might be missing shell
- **If Invisible**: Visual lock might have issue

### Failures Detected
- **Check**: Failure type
- **REGISTRY_MISSING**: Node not in AINodes.nodes
- **SHELL_INVISIBLE**: Shell not visible
- **MISSING_UPDATES**: Node not updating

---

## 🚨 Trouble? Check This

```javascript
// 1. Is it deployed?
typeof window.__rareNodeTracker  // Should be 'object'

// 2. Any immediate errors?
window.__rareNodeTracker.failures()  // Should be []

// 3. Is anything tracked?
window.__rareNodeTracker.report().specialNodesTracked  // Should be > 0

// 4. Enable logging to see what's happening
window.__rareNodeTracker.enable()
// Watch console for: [RareNodeVerify] Frame XXX: ...
```

---

## ✅ YOU'RE DONE WHEN

All of these return "green" (truthy/empty/true):
```javascript
// 1. Deployment messages in console ✅
// 2. APIs exist ✅
window.__rareNodeTracker && window.__simulationInvariant

// 3. No failures ✅
window.__rareNodeTracker.report().failureCount === 0

// 4. Nodes updating ✅
window.__rareNodeTracker.updateCoverage().every(n => n.status === 'UPDATING')

// 5. Shells visible ✅
window.__rareNodeTracker.shellStatus().every(s => s.shellVisible === true)
```

---

## 🏆 VERIFICATION COMPLETE ✅

If all checks pass in 5 minutes = **SYSTEMS OPERATIONAL**

**Status**: 🟢 READY FOR PRODUCTION

---

**NEED MORE DETAIL?**  
See: `/_TASK_3_VERIFICATION_GUIDE.md` for complete verification guide
