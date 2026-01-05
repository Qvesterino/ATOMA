# Ritual Visual Orchestrator — Quick Reference

## One-Minute Summary

The **Ritual Visual Orchestrator** conducts existing canonical visual templates during Phase 8 Network Rituals. It modulates derived visual signals (intensity, phase, damping) **without** modifying templates, colors, or semantics.

- **File**: `RitualVisualOrchestrator.js`
- **Lines**: ~600 (implementation + docs)
- **Status**: ✅ Production-ready, LOCKED
- **Authority**: Canonical Visual Triad (SynergyGlow, HarmonyAura, StressTurbulence)

---

## API Reference

### Initialize

```javascript
import { RitualVisualOrchestrator } from './RitualVisualOrchestrator.js';

const orchestrator = new RitualVisualOrchestrator(autoWiringSystem);
```

### Start Ritual

```javascript
orchestrator.startRitual(
  ritual.id,                    // unique ID
  {
    type: 'cooperative_reconstruction',  // ritual type
    stage: 'channeling',               // current stage
    progress: 0.0,                     // 0..1
    duration: 24000,                   // milliseconds
  },
  affectedNodes,                // Array<node>
  affectedLinks                 // Array<link>
);
```

### Update Each Frame

```javascript
orchestrator.updateRitual(ritual.id, {
  stage: ritual.stage,
  progress: ritual.progress,
  duration: ritual.duration,
});
```

### End Ritual

```javascript
orchestrator.endRitual(ritual.id, 'complete');  // or 'failed', 'cancelled'
```

### Debug

```javascript
orchestrator.getStatus();     // { activeRituals, totalModifiers, ... }
orchestrator.getDebugInfo();  // detailed modifier state
```

---

## Allowed Modulations

| Template | Allowed | NOT Allowed |
|----------|---------|------------|
| **Synergy Glow** (cyan) | Intensity (≤1.5×), Phase sync, Fade | Color changes, Blinking |
| **Harmony Aura** (aquamarine) | Phase sync, Radius (≤1.25×), Coherence | Jitter, Urgency |
| **Stress Turbulence** (red-orange) | Sync, Damping (±30%), Coherence | Damage visuals, Spikes |

---

## Modifier Structure

```javascript
{
  intensityMultiplier: 1.0,   // Brightness scale
  phaseOffset: 0.0,           // Timing [0..1]
  radiusScale: 1.0,           // Size scale
  damping: 0.0,               // Chaos control [-1..1]
  envelope: (t) => t,         // Fade function
}
```

---

## Ritual Types

| Type | Effect | Intensity | Phase | Damping |
|------|--------|-----------|-------|---------|
| `cooperative_reconstruction` | Bright collaboration | 1.3× | 0.0 | 0.0 |
| `healing_cascade` | Calming restoration | 1.0× | 0.0 | -0.3 |
| `network_synchronization` | Coherent sync | 1.2× | 0.25 | 0.0 |
| `corruption_containment` | Controlled chaos | 1.1× | 0.0 | 0.2 |

---

## Lifecycle

```
CHANNELING (0-8s)    → Fade in, ramp intensity
RESONANCE (8-20s)    → Full sync, peak modulation
RESOLUTION (20-24s)  → Maintain, prepare fade
COMPLETE (24s+)      → Fade out, cleanup
```

---

## Conformance

✅ READ-ONLY ritual state  
✅ No metric mutations  
✅ No new templates  
✅ Semantics preserved  
✅ Fully reversible  
✅ Safe optional chaining  
✅ O(n) performance  

---

## Integration Pattern

```javascript
// main.js animation loop

// Update orchestrator for each active ritual
for (const ritual of networkRituals.getActiveRituals()) {
  ritual.progress += deltaTime;

  ritualVisualOrchestrator.updateRitual(ritual.id, {
    stage: ritual.stage,
    progress: ritual.progress,
    duration: ritual.duration,
  });

  // End if complete
  if (ritual.isComplete) {
    ritualVisualOrchestrator.endRitual(ritual.id, ritual.outcome);
  }
}
```

---

## Performance

- **Time**: <0.5ms per update (typical ritual)
- **Space**: O(n) modifiers for n renderables
- **Allocations**: Zero per frame (reuse objects)

---

## Debug Commands

```javascript
// Check status
window.__ATOMA_RITUAL_DEBUG = { orchestrator }
orchestrator.getStatus()
orchestrator.getDebugInfo()
```

---

## Common Mistakes to Avoid

❌ Don't modify template colors  
❌ Don't create new visual patterns  
❌ Don't read raw metrics (use derived signals)  
❌ Don't forget to call `endRitual()`  
❌ Don't skip optional chaining checks  

✅ Do use intensity multipliers  
✅ Do synchronize phases  
✅ Do apply smooth envelopes  
✅ Do clean up on ritual end  
✅ Do validate ritual structure  

---

## Files in Package

- `RitualVisualOrchestrator.js` — Core implementation
- `RITUAL_VISUAL_ORCHESTRATOR_INTEGRATION.md` — Full integration guide
- `RITUAL_VISUAL_ORCHESTRATOR_QUICKREF.md` — This file
- `RITUAL_VISUAL_ORCHESTRATOR_VERIFICATION.md` — Checklist + audit

---

**Rituals conduct the orchestra. They never rewrite the score.**
