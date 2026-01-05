# Node Micro-Events 1.0 – Quick Reference

## At a Glance

**What:** Personality-driven spontaneous events for nodes  
**When:** Every 12-35 seconds per node (random)  
**How:** Based on personality type + metrics + proximity  
**Impact:** Visual only (zero gameplay changes)  
**Cost:** <0.5ms per frame

---

## Event Types by Personality

| Personality | Event Options |
|-------------|---------------|
| **CALM_ANALYST** | Focus Pulse • Slow Tilt • Breathing Shift |
| **HARMONY_KEEPER** | Resonance Halo • Synchronized Pulse |
| **FRACTAL_DREAMER** | Fractal Shimmer • Irregular Rotation |
| **QUANTUM_TRICKSTER** | Micro-Blink • Emissive Spike |
| **RADIANT_OPTIMIZER** | Energy Overcharge |
| **UMBRA_SENTINEL** | Density Darkening |
| **ECHO_WANDERER** | Drifting Gesture |
| **GLYPH_ARCHIVIST** | Glyph Flash |
| **CONVERGENCE_NEXUS** | Balanced Oscillation |
| **ASCENDED_MYTHIC** | Ascended Flare (dual rings) |

---

## Metric-Based Additive Events

Automatically added when metric thresholds met:

- **Instability > 60** → Jitter Burst (tremor)
- **Harmony > 70** → Harmony Ring (green glow)
- **Clarity > 80** → Clarity Spark (white flash)
- **Energy > 80** → Core Overpulse (bright)

---

## Interaction Events

Triggered by proximity (< 2.0 units):

- **Compatible personalities** → Harmony Flash (light beam)
- **Both instability > 80** → Chaos Spark (lightning)
- **Ascended nearby** → Calm Aura (slow effect)

---

## Event Log

Last 3 events stored in `node.userData.eventLog`:
```javascript
["FOCUS PULSE", "HARMONY RING", "JITTER BURST"]
```

Visible in Node Inspect Overlay.

---

## Integration Points

### Initialization
```javascript
this.nodeMicroEvents = new NodeMicroEvents(scene, camera);
```

### Update Loop
```javascript
this.nodeMicroEvents.update(deltaTime, nodes);
```

### Access Event Log
```javascript
const log = node.userData.eventLog;
```

---

## Performance Specs

- **Update rate:** 10-20Hz (auto-adaptive)
- **Proximity checks:** 5Hz (cached)
- **Auto-scales:** Yes (reduces frequency for 100+ nodes)
- **Memory:** ~200 bytes per node
- **Overhead:** <0.5ms typical, <1.0ms worst case

---

## Safety Guarantees

✅ No modifications to: AIModels, linking, physics, camera, world  
✅ All effects: Visual only, GPU-cheap, graceful degradation  
✅ Transform limits: Scale ±4%, rotation <0.02rad/frame, position ±0.1u  
✅ Cleanup: Automatic after event duration  

---

## Debug Commands

```javascript
// Trigger event manually
game.nodeMicroEvents.triggerMicroEvent(node);

// Check timer
console.log(node.userData.microEventTimer);

// View event log
console.log(node.userData.eventLog);

// Check registry
console.log(game.nodeMicroEvents.nodeEvents);
```

---

## Visual Impact Scale

**Subtle (0.3-0.8s):**
- Micro-Blink, Emissive Spike, Chaos Spark, Jitter Burst

**Moderate (0.8-1.5s):**
- Focus Pulse, Breathing Shift, Resonance Halo, Slow Tilt, Harmony Flash, Harmony Ring

**Dramatic (1.5-2.0s+):**
- Ascended Flare, Balanced Oscillation, Calm Aura

---

## Example Event Chain

Node with QUANTUM_TRICKSTER personality + 85 instability:

1. Timer expires → **MICRO_BLINK** (0.3s flicker)
2. Metric check → **JITTER_BURST** (0.5s tremor)
3. Nearby high-instability node → **CHAOS_SPARK** (0.4s lightning)

**Total:** 3 overlapping effects in 1.2s

---

## Tips

✨ **Events stack** — personality + metric + interaction = rich visual complexity  
✨ **Timers are random** — creates organic, unpredictable feel  
✨ **Inspect to see log** — point crosshair at node to view recent events  
✨ **Safe by design** — all transforms restored after event completes  

---

**Status:** ✅ Production-ready  
**Version:** 1.0 (SAFE EDITION)  
**Last updated:** Current session  

---

**The network lives. Events flow. Nodes dream.**
