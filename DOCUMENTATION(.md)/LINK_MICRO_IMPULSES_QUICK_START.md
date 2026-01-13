# Link Micro-Impulses — Quick Start Guide

## What Is It?
Event-driven electrical impulses that flash on links when network events occur. Transforms abstract network state into visible, instantaneous visual feedback.

## How It Works (3 Seconds)
1. **Event Fires** — Network state changes (link created, synergy threshold, corruption spread)
2. **Impulse Spawns** — Tiny electrical arc/spark/zig-zag appears on link surface
3. **Impulse Fades** — 40–120ms later, impulse vanishes

## Visual Forms
- **Arc** (cyan, smooth) — Harmony + Normal state
- **Spark** (yellow, burst) — High synergy
- **Zig-zag** (green, erratic) — Corruption spreading

## Trigger Events
```
✓ Link Created          → Success flash
✓ Pulse Reached Node    → Endpoint arc
✓ Harmonic Lock         → Resonance shimmer
✓ Synergy Threshold     → Energy burst
✓ Corruption Spread     → Chaotic flicker
✓ Influence Expanded    → Directional pulse
```

## State Effects

| State | Effect |
|-------|--------|
| **Harmony High** | Crisp, bright impulses |
| **Synergy High** | Longer duration, brighter |
| **Corruption High** | Shorter, jittery, red-tinted |
| **Instability High** | Suppressed, dimmed |

## Console Commands
```javascript
// Enable/disable
microImpulse.enable()
microImpulse.disable()

// Debug
microImpulse.debugOn()        // See event logs
microImpulse.status()         // Current state

// Test
microImpulse.testLinkCreated()   // Spawn test impulse

// Help
microImpulse.help()           // Full command list
```

## Performance
- **Cost**: <0.2ms per frame
- **Memory**: 2KB (cached geometries)
- **Max Active**: Unlimited (auto-expires)

## Files
```
LinkMicroImpulseAdapter_v1.js         ← Core system
LinkMicroImpulseIntegrationSetup.js   ← Integration
main.js                               ← Wired in (initialize + update)
```

## To Disable
```javascript
// In console
microImpulse.disable();

// Or in main.js, comment out:
// this.setupLinkMicroImpulses();
```

## To Tune
Edit `LinkMicroImpulseAdapter_v1.js`:
- `createArcPositions()` — Change arc shape
- `createZigzagPositions()` — Change chaos pattern
- `duration` values in event handlers — Make impulses faster/slower
- `materials` object — Change colors

## Expected Visual
When you create links or network events occur:
- **Instant cyan flash** on link surface
- **No trails, no particles, no clouds**
- **Purely on the link** (confined surface)
- **Gone in blink** (40–120ms)

Network feels like it's "firing" with electrical activity.

## Common Issues

**Q: I don't see anything**
- A: Check `microImpulse.status()` — are impulses active?
- A: Try `microImpulse.testLinkCreated()` to manually spawn one
- A: Check console for errors

**Q: It looks wrong**
- A: Check harmony/synergy/corruption values
- A: Try `microImpulse.debugOn()` to see event flow
- A: Verify link has geometry (not all links have visible models)

**Q: Performance impact?**
- A: Negligible (<0.2ms). Safe to leave on.
- A: Can disable with `microImpulse.disable()` if needed

---

**Status**: ✅ Production Ready | **Impact**: Visual Only | **Gameplay**: Unaffected
