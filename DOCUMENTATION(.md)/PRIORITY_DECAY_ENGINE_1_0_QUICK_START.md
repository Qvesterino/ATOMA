# Priority Decay Engine 1.0 — Quick Start (5 Minutes)

---

## 🚀 Installation (3 steps)

### Step 1: Import
```javascript
import { PriorityDecayEngine1_0 } from './PriorityDecayEngine1_0.js';
```

### Step 2: Initialize (in main.js after linkingSystem created)
```javascript
window.game.priorityDecayEngine = new PriorityDecayEngine1_0(
  window.game.linkingSystem,
  window.game.metricsSystem || null
);
```

### Step 3: Add to Animation Loop
```javascript
function animate(now) {
  const deltaMs = now - lastFrameTime;
  lastFrameTime = now;

  // Add this line:
  if (window.game.priorityDecayEngine) {
    window.game.priorityDecayEngine.tick(deltaMs);
  }

  // ... rest of render
  renderer.render(scene, camera);
}
```

**Done!** ✓ Engine is now running.

---

## 📊 Verify It Works (Developer Console)

```javascript
// Check status
window.game.priorityDecayEngine.status()

// Expected output:
{
  enabled: true,
  updatedLinks: 150,
  errors: 0,
  stats: {
    totalDecays: 123,
    totalBoosts: 234,
    avgDecayAmount: "0.0150",
    avgBoostAmount: "0.0240"
  }
}
```

If `updatedLinks > 0` and `enabled: true` → **✓ It's working!**

---

## 🎨 Visual Effects

### What You'll See

**Active Link (High Traffic):**
- Line gets **thicker**
- Glow becomes **brighter**
- Pulsing **faster**
- Tier: 2-3 (HIGH/CRITICAL)

**Idle Link (No Traffic):**
- Line gets **thinner**
- Glow **fades**
- Pulsing **slower**
- Tier: 0-1 (LOW/NORMAL)

### Why?

Engine updates `link.priority.tier` (0-3) based on traffic.
NeonLinkVisuals reads tier → adjusts VFX automatically. ✓

---

## ⚙️ Quick Configuration

### Aggressive (Fast Changes)
```javascript
window.game.priorityDecayEngine.setConfig({
  baseDecayRate: 0.08,    // Decay faster
  boostRate: 0.12,        // Boost more
  idleDelayMs: 1000,      // Mark idle sooner
});
```

### Smooth (Gradual Changes)
```javascript
window.game.priorityDecayEngine.setConfig({
  baseDecayRate: 0.01,    // Decay slower
  boostRate: 0.02,        // Boost gently
  idleDelayMs: 5000,      // Mark idle later
});
```

### Real-Time (Instant Response)
```javascript
window.game.priorityDecayEngine.setConfig({
  tickIntervalMs: 100,    // Update 10x/sec instead of 2x/sec
  stabilizeAlpha: 0.25,   // Faster lerp
});
```

---

## 🎯 Console Commands

| Command | Purpose |
|---------|---------|
| `window.game.priorityDecayEngine.status()` | Get full status report |
| `window.game.priorityDecayEngine.debugLink("id")` | Debug specific link |
| `window.game.priorityDecayEngine.enable()` | Resume updates |
| `window.game.priorityDecayEngine.disable()` | Freeze priorities |
| `window.game.priorityDecayEngine.reset()` | Clear all state |
| `window.game.priorityDecayEngine.cleanup()` | Remove dead links |
| `window.game.priorityDecayEngine.getDiagnosticReport()` | Full report |
| `window.game.priorityDecayEngine.setConfig({...})` | Update config |

---

## ✅ Testing

### Test 1: Active Link Boost (1 minute)
```javascript
// 1. Create 2 linked nodes
// 2. Generate traffic (interact with link)
// 3. Check priority increases:
window.game.priorityDecayEngine.status().stats.totalBoosts  // Should increase
// 4. Observe link gets brighter ✓
```

### Test 2: Idle Decay (3 minutes)
```javascript
// 1. Create linked nodes
// 2. Stop all traffic for 5+ seconds
// 3. Check priority decreases:
window.game.priorityDecayEngine.status().stats.totalDecays  // Should increase
// 4. Observe link fades ✓
```

### Test 3: Performance (<1 minute)
```javascript
// 1. Open DevTools → Performance
// 2. Record for 5 seconds
// 3. Look for PriorityDecayEngine calls
// 4. Check: <1ms per frame (even with 200+ links) ✓
```

---

## 🔍 Troubleshooting

| Problem | Solution |
|---------|----------|
| Nothing changes | Run `window.game.priorityDecayEngine.enable()` |
| Not in console | Check import/init in main.js |
| Extreme flickering | Lower `jitterAmount` to 0.005 |
| Too slow to respond | Lower `stabilizeAlpha` to 0.10 |
| Priorities drop too fast | Lower `baseDecayRate` to 0.01 |

---

## 📚 Configuration Reference

```javascript
{
  enabled: true,              // ✓ Enable globally
  tickIntervalMs: 500,        // Update every 500ms (2x/sec)
  idleDelayMs: 3000,          // Idle after 3 seconds
  baseDecayRate: 0.03,        // Decay 3% per tick
  boostRate: 0.06,            // Boost 6% when active
  maxScore: 1.0,              // Max (CRITICAL)
  minScore: 0.05,             // Min (prevents zero)
  stabilizeAlpha: 0.15,       // Smooth lerp
  jitterAmount: 0.01,         // ±1% random variation
  logWarnings: false,         // Debug logging
}
```

---

## 🎓 How It Works (30 seconds)

1. **Every 500ms:** Engine checks all links
2. **Per Link:**
   - Get traffic activity (0-1)
   - If traffic > 0.1: **Boost** `score += 0.06 × activity`
   - If idle > 3 seconds: **Decay** `score -= 0.03`
   - **Smooth** the score with lerp
   - Add **jitter** for natural feel
3. **Convert score → tier** (0-3)
4. **Write back** to `link.priority.score` and `link.priority.tier`
5. **NeonLinkVisuals** reads tier → updates VFX automatically ✓

**Result:** Priorities adapt in real-time! 🎉

---

## 🚀 Next Steps

1. ✓ Copy `PriorityDecayEngine1_0.js`
2. ✓ Add import to `main.js`
3. ✓ Initialize in startup
4. ✓ Add `tick()` to animation loop
5. ✓ Run console test: `window.game.priorityDecayEngine.status()`
6. ✓ Watch links respond to traffic!
7. ✓ Adjust config if needed
8. ✓ Deploy 🚀

---

## 📞 Need Help?

**Check the full guide:**
```javascript
// Open this in browser console for full diagnostic
console.log(window.game.priorityDecayEngine.getDiagnosticReport())
```

**Read full docs:**
- `PRIORITY_DECAY_ENGINE_1_0_INTEGRATION_GUIDE.md` — Complete reference
- `PRIORITY_DECAY_ENGINE_1_0_IMPLEMENTATION_SUMMARY.txt` — Technical overview

---

**Status:** 🟢 **READY TO GO!**

Install in 3 steps, test in 1 minute, deploy! 🎉
