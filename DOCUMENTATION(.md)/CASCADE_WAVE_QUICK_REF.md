# Cascade Resonance Wave — Quick Reference

## What It Is

A **ghost-level visualization** that suggests energy could propagate between phase-synchronized hubs — without actually doing so.

Not a cascade. Not energy transfer. Pure speculative visualization.

---

## Console Commands

### Status & Debugging

```javascript
// Full wave status
cascadeWaveStatus()
// → Active waves, affected links/hubs, avg influence

// Specific wave details (0=baseline, 0.5=peak, 1=return)
getWavePhaseDebug('hub1_id', 'hub2_id')
// → phase (0-1), influence (0-1)

// Enable debug logging
toggleCascadeWaveDebug(true)
```

### Tuning

```javascript
tune_cascade_wave('waveOscillationPeriod', 3.0)  // Cycle speed (seconds)
tune_cascade_wave('waveInfluenceMax', 0.08)      // Peak intensity (3-8% range)
tune_cascade_wave('linkPhaseCompression', 0.06)  // Link tightening
tune_cascade_wave('auraNoiseReduction', 0.04)    // Aura randomness reduction
tune_cascade_wave('waveDecayRate', 0.88)         // Auto-fade speed
```

---

## What You'll See

✅ Links between synchronized hubs feel slightly "tighter"  
✅ Auras briefly tighten as wave passes  
✅ Subtle temporal compression along strands  
✅ ~2-4 second oscillation cycle  
✅ Natural fade when hubs desync  

## What You WON'T See

❌ NO glow or colors  
❌ NO particles or rings  
❌ NO visible wavefront  
❌ NO geometry changes  
❌ NO gameplay impact  

---

## Key Metrics

| Parameter | Default | Range | Effect |
|-----------|---------|-------|--------|
| Period | 3.0s | 1-5s | Wave cycle speed |
| Influence Min | 3% | 1-5% | Baseline effect |
| Influence Max | 8% | 5-15% | Peak effect |
| Link Compress | 0.06 | 0.03-0.12 | Link tightening |
| Aura Reduce | 0.04 | 0.02-0.08 | Noise reduction |
| Decay Rate | 0.88 | 0.85-0.95 | Fade speed |

---

## Trigger Conditions

✅ Cascade system enabled  
✅ ≥2 hubs proximal (distance < 24 units)  
✅ Phase sync active (avgPhaseDelta > 0)  
✅ Proximity strength ≥ 0.2  

---

## Performance

- **Time**: <0.1ms per frame
- **Memory**: ~200 bytes per active wave
- **Allocations**: ZERO per-frame
- **Scales**: Linearly with wave count

---

## Common Scenarios

### "Waves look too strong"
```javascript
tune_cascade_wave('waveInfluenceMax', 0.05);      // Reduce peak
tune_cascade_wave('linkPhaseCompression', 0.03);  // Less compression
tune_cascade_wave('auraNoiseReduction', 0.02);    // Less tightening
```

### "Waves disappear too fast"
```javascript
tune_cascade_wave('waveDecayRate', 0.92);         // Longer fade
tune_cascade_wave('waveDissolveThreshold', 0.10); // Later dissolve
```

### "Waves feel too mechanical"
```javascript
tune_cascade_wave('waveOscillationPeriod', 3.5);  // Longer, more organic
```

### "Want more wave activity"
```javascript
tune_cascade_wave('minPhaseSyncStrength', 0.05);  // Easier triggering
tune_cascade_wave('maxWaveActivePairs', 50);      // More simultaneous waves
```

---

## Debugging Workflow

```javascript
// 1. Enable everything
cascade_tune('enabled', true);

// 2. Check basic status
cascade_info();                    // Overall system
getProximityPairs();              // Proximal hubs
getPhaseSyncStats();              // Phase convergence

// 3. Check wave system
cascadeWaveStatus();              // Wave counts and influence

// 4. Monitor specific pair
getWavePhaseDebug('hub_A', 'hub_B');

// 5. Enable live debug
toggleCascadeWaveDebug(true);
// Console will show per-frame updates
```

---

## Integration Stack

```
Proximity Detection (ground layer)
    ↓
Phase Synchronization (temporal layer)
    ↓
Pre-Cascade Hints (tension layer)
    ↓
Cascade Wave Visualization (resonance layer)
    ↓
Existing Visual Systems (rendering)
```

---

## Math Summary

**Wave Phase**: 
```
phase = (globalTime / period + uniqueOffset) % 1.0
influence = sin(phase × 2π) scaled to [min%, max%]
```

**Applied To**:
- Links: temporal phase compression
- Auras: noise randomness reduction
- Both: scale by proximity + phase sync quality

**Decay**:
```
influence *= 0.88 per frame until < 5% (dissolves)
```

---

## FAQ

**Q: Why can't I see the waves?**  
A: They're temporal modulation, not visible objects. Effects appear as subtle link tightening and aura changes.

**Q: Do waves affect gameplay?**  
A: No. Pure visualization. Zero gameplay impact.

**Q: What triggers waves?**  
A: Proximal + synchronized hubs. Wave phase = oscillating function.

**Q: How long do waves last?**  
A: Until hubs desync or move apart. Auto-decay at 0.88/frame.

**Q: Can I change wave intensity?**  
A: Yes. `tune_cascade_wave('waveInfluenceMax', value)` from 0.03 to 0.15.

**Q: What's next after waves?**  
A: Full cascade activation (phase 2) with resonance amplification.

---

## Tuning Checklist

- [ ] Enable cascade: `cascade_tune('enabled', true)`
- [ ] Check status: `cascadeWaveStatus()`
- [ ] Observe subtle effects on links/auras
- [ ] Enable debug: `toggleCascadeWaveDebug(true)`
- [ ] Adjust intensity as needed
- [ ] Document final tuning parameters

---

**System Status**: ✅ Production-ready  
**Per-Frame Cost**: <0.1ms  
**Memory Overhead**: ~1.6KB (typical)  
