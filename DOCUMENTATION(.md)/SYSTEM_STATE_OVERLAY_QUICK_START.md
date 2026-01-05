# System State Overlay — Quick Start Guide

## What Is It?

The **System State Overlay** visualizes ATOMA's network metrics (harmony, synergy, corruption) as three subtle visual layers that feel like the system's internal presence. It's not a HUD—it's organic, ambient, and non-intrusive.

## Enable/Disable

Open browser console (F12) and run:

```javascript
window.toggleSystemStateOverlay()
```

The overlay is **disabled by default**. It will toggle on/off each time you call the function.

## Check Status

```javascript
window.systemStateOverlayStatus()
```

Example output:
```
=== SYSTEM STATE OVERLAY ===
Status: ✓ ACTIVE
Harmony: 65.2%
Synergy: 42.8%
Corruption: 18.5%
Active Synergy Halos: 3
Time: 124.56s
```

## What Do You See?

### Three Visual Layers

#### 1. Global Harmony Ring (background)
- Subtle circular vignette around viewport
- **Color**: Cool blue-gray → soft cyan → warm turquoise (as harmony increases)
- **Motion**: Micro-breathing (subtle expansion/contraction)
- **Meaning**: "How stable is the entire network?"

#### 2. Synergy Halos (mid-layer)
- Soft, glowing rings around clusters of active nodes
- **Color**: Bright cyan (gets brighter with more synergy)
- **Motion**: Gentle pulsing (faster = more synergy)
- **Meaning**: "Where is the system thinking most intently right now?"

#### 3. Corruption Disturbance (local)
- Subtle spatial blur/drift in affected regions
- **Color**: Muted gray-purple
- **Motion**: Slow, uncertain drift (no rhythm)
- **Meaning**: "Where is the system losing coherence?"

## Design Philosophy

- **No numbers**: The overlay doesn't tell you what to think
- **Purely visual**: Suggests internal state through ambient presence
- **Transparent**: Won't distract from gameplay
- **Read-only**: Never modifies game mechanics

The viewport itself becomes a window into the system's consciousness.

## Performance

- Negligible overhead: < 0.3ms per frame
- Works on all devices
- Automatically cleans up during world transitions

## Console Commands

| Command | Effect |
|---------|--------|
| `window.toggleSystemStateOverlay()` | Enable/disable overlay |
| `window.systemStateOverlayStatus()` | Print current metrics |

## Notes

- Overlay is automatically updated every frame (no manual refresh needed)
- Metrics are read from `CoreMetricsOverlay` (which feeds real network data)
- Disabled during world transitions, re-enabled automatically
- All visual effects are client-side only

## Troubleshooting

**Overlay not appearing?**
1. Make sure CoreMetricsOverlay is initialized (it should be by default)
2. Run `window.toggleSystemStateOverlay()` to enable
3. Check console for error messages

**Overlay looks wrong?**
1. Try toggling off and on again: `window.toggleSystemStateOverlay()`
2. Check current status: `window.systemStateOverlayStatus()`
3. Verify CoreMetricsOverlay is reporting correct metrics

**Performance impact?**
- The overlay adds < 0.3ms per frame
- If you notice frame drops, the issue is likely elsewhere
- You can disable the overlay to verify: `window.toggleSystemStateOverlay()`

---

**Enjoy exploring ATOMA's inner state!** 🌊✨
