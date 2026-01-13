# Synergy Recommendation Debug HUD 1.0 — Quick Reference Card

## 🎯 One-Command Start

```javascript
showSynergyDebug()  // Panel appears in bottom-left corner
```

---

## 🎮 Console Commands

| Command | Effect | Output |
|---------|--------|--------|
| `showSynergyDebug()` | Show HUD | ✓ Synergy Debug HUD shown |
| `hideSynergyDebug()` | Hide HUD | ✓ Synergy Debug HUD hidden |
| `toggleSynergyDebug()` | Toggle | ✓ Toggled to VISIBLE/HIDDEN |
| `getSynergyDebugStats()` | Get stats | Full diagnostic report |
| `setSynergyDebugRefresh(ms)` | Change speed | ✓ Refresh interval set to Xms |

---

## 📊 What You See

```
⚡ SYNERGY & AUTOMATION MONITOR

📊 Top Recommendations:
   #1 PROCESS → STORAGE
   synergy: 0.847
   reason: correlation

🤖 Automation Engine:
   Status: ✓ ENABLED
   Links Created: 5

📈 Statistics:
   Recommendations: 12
   Avg Update: 0.42ms
```

---

## 🎨 Color Guide

- 🟢 **Green (0.8+)** — Excellent synergy
- 🟡 **Orange (0.6-0.8)** — Good synergy
- 🔴 **Red (<0.6)** — Fair synergy
- 🔵 **Blue section** — Automation status
- 🟡 **Orange section** — Statistics

---

## ⚡ Quick Workflows

### Monitor Recommendations
```javascript
recommendActive()
showSynergyDebug()
// Watch top 5 suggestions update
```

### Watch Automation
```javascript
enableAutoLink()
showSynergyDebug()
autoLinkActive()
// Watch "Links Created" counter
```

### Performance Check
```javascript
showSynergyDebug()
getSynergyDebugStats()
// Check "Avg Update" < 1ms
```

### Faster Updates
```javascript
setSynergyDebugRefresh(300)  // Every 300ms
showSynergyDebug()
// More responsive, slightly more CPU
```

---

## 🔴 Common Issues

| Problem | Fix |
|---------|-----|
| HUD not visible | `showSynergyDebug()` |
| Empty recommendations | `recommendActive()` first |
| Slow to update | `setSynergyDebugRefresh(300)` |
| HUD not refreshing | Might be hidden - try `toggleSynergyDebug()` |

---

## 📋 Typical Session

```javascript
// 1. Start monitoring
showSynergyDebug()

// 2. Generate recommendations
recommendActive()

// 3. Enable automation
enableAutoLink()

// 4. Create links and watch
autoLinkActive()

// 5. Check stats
getSynergyDebugStats()

// 6. Hide when done
hideSynergyDebug()
```

---

## 🎯 Synergy Score Meanings

| Score | Meaning | Color |
|-------|---------|-------|
| 0.9-1.0 | Perfect match | 🟢 Green |
| 0.8-0.9 | Excellent | 🟢 Green |
| 0.6-0.8 | Good | 🟡 Orange |
| 0.4-0.6 | Fair | 🔴 Red |
| <0.4 | Poor | ⚫ Gray |

---

## 💡 Pro Tips

1. **Keep refresh at 800ms** — Good balance, minimal CPU
2. **Faster refresh (300ms)** — For real-time monitoring sessions
3. **Slower refresh (1500ms)** — For long analysis periods
4. **Combines with other tools** — Use with `autoLinkActive()` and `testAutoLinkFeedback()`
5. **Stats show session totals** — Reset on map transition

---

## 📊 What's Being Tracked

- **Top 5 AI recommendations** with synergy scores
- **Automation engine status** (enabled/disabled/cooldown)
- **Total links created** this session
- **Performance metrics** (update time, cycles)
- **All data updates** every 800ms (customizable)

---

## 🚀 Ready to Use

HUD auto-starts on game load. It's visible by default and monitoring everything. Just use commands to show/hide or change speed.

**That's it! You're monitoring the entire AI system in real-time.** 🎯
