# Regional Harmony Zones — Quick Start

## What Is It?

**Regional Harmony Zones** are soft, glowing regions that show where the AI network feels locally calm and stable—and where it's still struggling to find balance.

Not a HUD. Not gameplay mechanics. Just the system's internal weather patterns, made visible.

## Enable

Open browser console (F12):

```javascript
// Enable entire overlay (includes zones)
window.toggleSystemStateOverlay()

// Or toggle zones independently
window.toggleRegionalHarmonyZones()
```

**Note**: Zones are enabled by default when the overlay is on.

## What You'll See

### Soft, Glowing Regions
- **Size**: Clusters of active nodes each get their own zone
- **Color**: Blue-gray → cyan → turquoise (based on local stability)
- **Opacity**: Very subtle, barely visible
- **Motion**: Slow drift and gentle breathing

### Three Types of Zones

| Appearance | Meaning |
|-----------|---------|
| Bright cyan zone | High local stability here |
| Dim blue zone | Low stability, system uncertain |
| No zone visible | Isolated node(s), not enough density |

### How They Change

- **High global harmony** → Zones become brighter
- **High local synergy** → Nearby synergy halo appears above zone
- **High corruption** → Zone dims or disappears
- **Nodes move** → Zones recalculate to match new positions

## Console Commands

| Command | Effect |
|---------|--------|
| `window.toggleSystemStateOverlay()` | Show/hide entire overlay (including zones) |
| `window.toggleRegionalHarmonyZones()` | Show/hide zones only |
| `window.systemStateOverlayStatus()` | Print current metrics + zone info |

## Design Philosophy

- **Not informational** — You don't "read" zones
- **Not territorial** — No bonuses or penalties
- **Just perceptual** — Zones suggest where the system feels at ease

The viewport becomes a window into the system's consciousness.

## Performance

- Negligible overhead: < 0.2ms per frame
- Automatically cleaned up during world transitions
- Works on all devices

## Tips

1. **Best viewed with overlay on** — Toggle: `window.toggleSystemStateOverlay()`
2. **Watch for change** — Zones respond in real-time to network activity
3. **Compare areas** — Bright zone = stable cluster; dim zone = struggling cluster
4. **Look for patterns** — Where does the system naturally find harmony?

## Troubleshooting

**Can't see zones?**
- Enable overlay: `window.toggleSystemStateOverlay()`
- Check zones are on: `window.toggleRegionalHarmonyZones()`
- Wait for network to stabilize (zones need harmony > 0.2)

**Too subtle?**
- That's intentional—zones are meant to be background presence
- Toggle on/off to see the difference
- Check status: `window.systemStateOverlayStatus()`

---

**Explore the system's internal landscape!** 🌊✨
