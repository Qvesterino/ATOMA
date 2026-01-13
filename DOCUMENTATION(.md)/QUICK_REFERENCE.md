# ATOMA Node Linking - Quick Reference Card

## 🎮 Controls

| Input | Action |
|-------|--------|
| **Left Click** | Click node |
| **Click + Drag** | Create link preview |
| **Release** | Confirm link |
| **Right Click** | Link menu |
| **Escape** | Clear highlights |

---

## 👻 Ghost Link System

```
What: Automatic prediction preview
When: Appears when you click a node
Color: Faint cyan line + pulsing dot
Timeout: Auto-removes after 3 seconds
Action: Drag to override, click target to confirm
```

---

## 🎨 Context Menu

```
Right-click any link's arrow to open:

┌─────────────────┐
│ ✗ Delete        │
│ ⬇ Priority: Low │
│ ⬇ Normal        │
│ ⬆ High          │
│ 📊 Inspect      │
└─────────────────┘
```

---

## 🟣🔷🟠 Special Nodes

| Node | Color | Outputs | Role |
|------|-------|---------|------|
| **Sigma** | Magenta | 4 | Hub |
| **Quantum** | Cyan | 3 | Distributor |
| **Emotional** | Orange | 2 | Merge |

**How to Spot:** Brighter glow, larger size, ~10% spawn rate

---

## 🎨 Link Colors

```
VALID:     Cyan (0x00ffff)
INVALID:   Red (0xff0000)
PREVIEW:   Cyan faint
SPECIAL:   Enhanced glow
```

---

## 🚨 Error Feedback

| Error | Color | Animation | Duration |
|-------|-------|-----------|----------|
| Incompatible | Red | Quick flash | 500ms |
| Conflict | Yellow | Soft pulse | 1000ms |
| Deleted | Red | Shatter burst | 500ms |
| Fade | Dim | Smooth out | 300ms |

---

## 📊 Traffic Indicators

```
FAST PARTICLES = High throughput ✓
SLOW PARTICLES = Bottleneck ⚠
LARGE PARTICLES = High priority
BRIGHT PARTICLES = High load
```

---

## ✅ Link Compatibility Matrix

```
INPUT       → Process, Integration
PROCESS     → Integration, Storage
INTEGRATION → Anything (except Input)
STORAGE     → Process, Integration
SPECIAL     → Same rules as category
```

---

## 🎯 Quick Start (30 seconds)

1. **Click a node** → Ghost link appears
2. **Drag to target** → Preview line turns green/red
3. **Release** → Link created!
4. **Right-click link** → Menu opens
5. **Select action** → Done!

---

## 🔍 UI Display

```
Top Left: Link Rules
Top Right: Node Status
Bottom Left: Traffic Stats
Bottom: Instructions

Traffic Shows:
├─ Active Links: [n]
├─ Avg Load: [%]
├─ Throughput: [%]
└─ Bottlenecks: [n]
```

---

## 🎬 Animation Times

```
Quick:     300-500ms
Normal:    1000ms
Extended:  3000ms
Continuous: Loop
```

---

## 💡 Pro Tips

1. **Auto-predict is 80% correct** - Use it for speed
2. **Special nodes are hubs** - Create from them for branching
3. **Inspect high-traffic links** - Right-click → Inspect
4. **Priority High for important** - Makes them stand out
5. **Shatter effect is cool** - Delete unused links!
6. **Drag overrides prediction** - Full manual control
7. **Watch the particles** - They show traffic flow
8. **Orange = warning** - Bottleneck detected

---

## 🚫 Common Issues

| Problem | Fix |
|---------|-----|
| No ghost link | No compatible nearby nodes |
| Can't create link | Check compatibility rules |
| Menu doesn't appear | Click arrow, not line |
| Slow particles | Bottleneck detected |

---

## 📱 Keyboard Reference

| Key | Action |
|-----|--------|
| **M** | Switch world |
| **WASD** | Move |
| **Space** | Jump |
| **ESC** | Release mouse |

---

## 🎓 Understanding Metrics

```
LOAD (0-100%)
├─ Fluctuates each frame
├─ Affects line visibility
└─ Over 80% = bottleneck warning

THROUGHPUT (0-100%)
├─ Follows from load
├─ Affects particle speed
└─ Lower = congestion

PRIORITY (0-1)
├─ Random starting value
├─ Affects particle size
└─ Set via context menu

BOTTLENECK
├─ Triggers when Load > 80% AND Throughput < 50%
├─ Link turns orange
└─ Yellow pulse warning
```

---

## 🌐 Link Lifecycle

```
1. CREATION
   └─ Drag source to target → Link appears

2. ACTIVE
   └─ Particles flow, pulses animate, traffic simulates

3. MODIFICATION
   └─ Right-click → Change priority, inspect, delete

4. DELETION
   └─ Via menu → Shatter effect → Fade away

5. INVALIDATION
   └─ Category mismatch → Fade-out effect
```

---

## 📊 Sample Network

```
[INPUT NODE]
    ↓ (Auto-predict)
[PROCESS NODE] ← Prediction shows here
    ↓ (Drag to create)
[INTEGRATION NODE]
    ├─→ [STORAGE]
    ├─→ [MEMORY]
    └─→ [SIGMA] ←─┐ Special multi-output
        ├─→ [DATA]│
        ├─→ [LOGIC]│ Can branch to 4 nodes
        ├─→ [DREAM]│
        └─→ [OTHER]│
```

---

## 🎨 Visual Hierarchy

```
MOST VISIBLE:
├─ Special node links (stronger glow)
├─ High priority links
└─ Active traffic (many particles)

MEDIUM VISIBLE:
├─ Standard links
├─ Normal priority
└─ Some traffic

LEAST VISIBLE:
├─ Low priority links
├─ Idle links (no particles)
└─ Ghost links (faint preview)
```

---

## ⚡ Performance

- **Normal:** <2ms per frame
- **Heavy Loading:** <5ms per frame
- **Max Links:** 100+ without slowdown
- **Target:** 60 FPS constant

---

## 🎯 Goal Checklist

- [ ] Create first link with drag
- [ ] Use auto-predict to create link
- [ ] Right-click link and change priority
- [ ] Inspect link traffic
- [ ] Find and link from special node
- [ ] See bottleneck warning (orange)
- [ ] Create branching network
- [ ] Delete link and see shatter effect

---

## 📞 Need Help?

See full documentation:
- `FEATURES.md` - All feature details
- `IMPLEMENTATION_SUMMARY.md` - Technical deep dive
- `INTERACTION_GUIDE.md` - Complete user guide
- `README_ADVANCED_FEATURES.md` - Feature overview

---

## 🌟 Key Takeaways

1. **Click to predict** - Auto-suggest target
2. **Drag to confirm** - Override with full control
3. **Right-click to manage** - Delete, priority, inspect
4. **Watch the visuals** - Colors and animations tell the story
5. **Special nodes are rare** - Use them as hubs
6. **Orange = warning** - Bottleneck ahead
7. **Keep networks clean** - Delete unused links
8. **Have fun!** - It's designed to feel good ✨

---

**Made with ❤️ for ATOMA players**
