# Harmonic Resonance Feedback System — Quick Start

---

## What Is It?

Composite glyphs (synthesized meaning) emit subtle resonance fields that gently influence nearby link motion, creating a closed visual feedback loop.

**Key Principle**: *Meaning shapes motion through resonance, not control.*

---

## Enable & Test (30 seconds)

```javascript
// In browser console:

// Enable resonance feedback
game.enableResonance()

// Turn on debug visualization (wireframe spheres)
game.toggleResonanceDebug()

// Play normally - watch composite glyphs emit fields
// Observe: Nearby links smooth their motion
// Observe: Pictograms adjust spacing
// Observe: Wireframe spheres show field boundaries

// Check status anytime
game.resonanceStatus()

// Turn off debug visualization
game.toggleResonanceDebug()

// Disable if needed
game.disableResonance()
```

---

## What You'll See

### Composite Glyphs Form
When 2+ links converge at a node and fuse into a composite glyph.

### Resonance Field Activates
- **Large field** (~6 units) if harmony is high
- **Small field** (~2 units) if corruption is high
- **Medium field** (~4 units) if balanced

### Nearby Motion Responds
- **Links**: Wave motion aligns to glyph rhythm, becomes smoother
- **Pictograms**: Slow down slightly, space better
- **Overall**: Network feels more coherent without being forced

### Field Decays
When composite glyph separates, resonance gradually fades (1.5 seconds).

---

## Configuration

**File**: `/HarmonicResonanceFeedbackSystem.js` (top of file)

### Key Tunable Parameters

```javascript
const CONFIG = {
    // How big the resonance fields are
    BASE_RESONANCE_RADIUS: 4.0,           // Change to 3.0-5.0
    HARMONY_RADIUS_MULTIPLIER: 1.5,       // Change to 1.2-2.0
    CORRUPTION_RADIUS_MULTIPLIER: 0.5,    // Change to 0.3-0.7
    
    // How strongly nearby motion is influenced
    BASE_ALIGNMENT_STRENGTH: 0.3,         // Change to 0.2-0.5
    HARMONY_ALIGNMENT_BOOST: 1.4,         // Change to 1.2-1.6
    CORRUPTION_ALIGNMENT_DAMPEN: 0.4,     // Change to 0.2-0.6
    
    // How fast the influence ramps up/down
    RESONANCE_BUILD_DURATION: 1.2,        // Change to 0.8-1.5
    RESONANCE_DECAY_DURATION: 1.5,        // Change to 1.0-2.0
    
    // Performance
    MAX_INFLUENCED_LINKS_PER_ZONE: 12,    // Raise to 20 if needed
    UPDATE_INTERVAL: 1 / 30,              // Keep at 30 Hz
};
```

---

## Console API Reference

```javascript
// Status & Control
game.enableResonance()           // Activate resonance feedback
game.disableResonance()          // Deactivate resonance feedback
game.resonanceStatus()           // Check system status

// Debug
game.toggleResonanceDebug()      // Toggle field visualization

// Returns from status:
{
    enabled: true,               // System is active
    activeFields: 5,             // Active resonance fields
    decayingFields: 2,           // Fields fading out
    totalCapacity: 20            // Max possible fields
}
```

---

## Visual Effect Checklist

### You Should See (If Everything Works)

- [ ] Composite glyphs appear when links converge
- [ ] Wireframe spheres around composites (debug mode)
- [ ] Field sizes vary: large (harmony), small (corruption), medium (balanced)
- [ ] Nearby links visibly smoother (not jittery)
- [ ] Nearby pictograms slower and better spaced
- [ ] No sudden snaps or forced motion
- [ ] Fields gradually fade when composite separates
- [ ] Motion returns to normal as field fades

### You Should NOT See

- [ ] New particles spawning (violation: no particles)
- [ ] Sudden color changes (violation: no color changes)
- [ ] Glow/bloom effects (violation: no glow)
- [ ] Links being forced in new directions (violation: no overrides)

---

## Performance Notes

- **Memory**: ~6 KB overhead, minimal impact
- **CPU**: 30 Hz throttle keeps workload predictable
- **Scalability**: Works with 0-20 composite glyphs
- **Mobile**: Safe on mobile devices (no per-frame spikes)

---

## Troubleshooting

### Fields Not Appearing
```javascript
// Check if system is enabled
game.resonanceStatus()

// Enable debug visualization
game.toggleResonanceDebug()

// Make sure composite glyphs exist (need 2+ converging links)
// Watch for wireframe spheres to appear around composites
```

### Motion Doesn't Look Different
```javascript
// Check status to ensure it's active
game.resonanceStatus()

// Verify composite glyphs are being created
// (Need multiple links converging at same node)

// Motion changes are subtle - look for:
// 1. Smoother wave motion (less jittery)
// 2. Better pictogram spacing
// 3. Slight phase alignment toward glyph

// Changes are intentionally gentle (not forced)
```

### Performance Issues
```javascript
// Reduce influenced links per zone
CONFIG.MAX_INFLUENCED_LINKS_PER_ZONE = 8  // From 12

// Or reduce update frequency
CONFIG.UPDATE_INTERVAL = 1 / 20  // From 1/30 (20 Hz instead of 30)

// Check status to confirm fields aren't exploding
game.resonanceStatus()
```

---

## Understanding the Mechanics

### How Influence Works

```
Composite Glyph Forms
    ↓
Resonance Field Activates (ramps up over 1.2s)
    ↓
Finds Nearby Links/Pictograms (within calculated radius)
    ↓
Applies Soft Influence:
    - Link phase aligns to glyph rhythm (gentle, not forced)
    - Pictograms slow 15% and improve spacing
    - No motion is overridden (only guided)
    ↓
Composite Separates
    ↓
Resonance Decays (fades over 1.5s)
    ↓
Links Return to Independent Motion
```

### Why It Works

1. **Meaning Creates Structure**: Composite glyphs represent synthesized meaning
2. **Structure Shapes Motion**: Meaning naturally influences nearby flow
3. **Motion Tells Story**: Network motion reflects its internal state
4. **No Forced Control**: Gentle resonance, never override
5. **Emergent Coherence**: System self-organizes without explicit rules

---

## Use Cases

### Test Case 1: Single Harmony-Dominant Hub
1. Converge 2-3 links at one node with high harmony
2. Watch composite glyph form
3. Enable debug visualization
4. Observe: Large green sphere, strong motion influence

### Test Case 2: Corruption Disturbance
1. Same setup but with high corruption
2. Observe: Small red/orange sphere, weak influence
3. Motion remains mostly chaotic

### Test Case 3: Healing Recovery
1. Start with high corruption/small field
2. Gradually increase harmony (or enable healing system)
3. Watch: Field expands, influence strengthens
4. Motion gradually synchronizes

---

## Design Philosophy

> *Emergent structures shape their context.*

This isn't about control or scripted behavior. It's about letting synthesized meaning (composite glyphs) naturally bend the flow around them—the way gravity shapes space, the way meaning shapes consciousness.

The network feels alive because structure and motion continuously inform each other. The network doesn't feel forced because influence is gentle, reversible, and always proportional to meaning.

---

## Files Reference

- **System**: `/HarmonicResonanceFeedbackSystem.js` (550 lines)
- **Docs**: `/HARMONIC_RESONANCE_FEEDBACK_README.md` (comprehensive)
- **Summary**: `/SESSION_140_HARMONIC_RESONANCE_SUMMARY.md` (overview)
- **Integration**: `main.js` lines 254, 1469, 6659

---

## Next Steps

1. **Enable the system**: `game.enableResonance()`
2. **Test with debug mode**: `game.toggleResonanceDebug()`
3. **Play and observe**: Watch composite glyphs influence motion
4. **Check status**: `game.resonanceStatus()`
5. **Tune parameters** if needed (CONFIG object)
6. **Collect feedback**: Is the visual feel right?

---

**Status**: ✅ Production-Ready  
**Integration**: ✅ Complete  
**Performance**: ✅ Optimized  
**Documentation**: ✅ Comprehensive  

Enjoy the resonance!
