# Mythic Ritual Controller 1.0 – Quick Reference

## At a Glance

**What:** Rare ceremonial events for extraordinary network states  
**When:** Triggered by specific metric alignments  
**Duration:** ~16.5 seconds (4 phases)  
**Cooldown:** 45 seconds between rituals  
**Impact:** 100% visual only (zero gameplay)

---

## 6 Ritual Types

| Ritual | Trigger | Color Theme | Key Visual |
|--------|---------|-------------|------------|
| **ASCENSION_RITUAL** | 4+ ascended, harmony >75 | Gold | Central beam + ascending rings |
| **QUANTUM_FISSURE** | Instability >85, intensity >0.8 | Magenta | Vertical fissure + chaos |
| **HARMONY_CONVERGENCE** | Harmony >80, clarity >75 | Cyan | Converging beams + sphere |
| **CHAOS_RITUAL** | Instability >75, energy >70 | Pink | Spiral + lightning |
| **MYTHIC_SIGNAL** | Balance <20, stability >70 | White | Geometric mandala |
| **ECHO_RITUAL** | Energy <40, clarity >75, 2+ ascended | Blue | Expanding waves |

---

## Ritual Phases

```
INIT  → RISE → PEAK → FALL
(3s)    (6s)   (4.5s)  (4s)

Total: ~16.5 seconds
```

**Phase Intensity:**
- INIT: 0.0 → 1.0 (fade in)
- RISE: 0.5 → 1.0 (build)
- PEAK: 1.0 (sustained)
- FALL: 1.0 → 0.0 (fade out)

---

## Visual Effects by Ritual

### ASCENSION_RITUAL ✨
- Central golden beam (height 100)
- 5 ascending/rotating rings
- 50 golden particles
- Sky: Deep blue (0x112244)

### QUANTUM_FISSURE ⚡
- Vertical magenta fissure (glitching)
- 80 chaos particles
- 3 distortion torus rings
- Sky: Dark purple (0x220044)

### HARMONY_CONVERGENCE 🌟
- 4 converging beams (cardinal directions)
- Central pulsing sphere
- 40 green particles
- Sky: Cyan-blue (0x002244)

### CHAOS_RITUAL 🔥
- Chaotic spiral (100 points)
- 5 flickering lightning bolts
- 60 pink particles
- Sky: Dark red (0x330011)

### MYTHIC_SIGNAL 🎆
- 4-layer geometric mandala
- Each layer rotates independently
- 30 white particles
- Sky: Grey-blue (0x111122)

### ECHO_RITUAL 🌊
- 6 expanding wave rings
- 40 blue-purple particles
- Sky: Blue-grey (0x112233)

---

## Trigger Formulas

```javascript
// ASCENSION_RITUAL
ascendedCount >= 4 && harmony > 75

// QUANTUM_FISSURE
instability > 85 && intensity > 0.8

// HARMONY_CONVERGENCE
harmony > 80 && clarity > 75

// CHAOS_RITUAL
instability > 75 && energy > 70

// MYTHIC_SIGNAL
balanceScore < 20 && stability > 70
// balanceScore = |harmony-60| + |clarity-60| + |energy-60|

// ECHO_RITUAL
energy < 40 && clarity > 75 && ascendedCount >= 2
```

---

## Node Glow Boost

**During ritual:**
```javascript
targetIntensity = originalIntensity × (1 + phaseIntensity × 0.5)
```

**Effect:** All nodes glow 50% brighter at peak

**Restoration:** Smooth lerp back to original after FALL

---

## HUD Display

**Format:**
```
✦ MYTHIC RITUAL: [RITUAL NAME] ✦
```

**Position:** Center screen  
**Color:** Gold (#ffd700)  
**Border:** 2px solid gold with 30px glow  
**Fade:** In during INIT, out during FALL  

---

## Integration

```javascript
// Initialize
this.mythicRitualController = new MythicRitualController(
  scene, camera, renderer, worldPersonalityController
);

// Update
this.mythicRitualController.update(deltaTime, nodes);

// Get state
const state = this.mythicRitualController.getRitualState();

// Cancel (debug)
this.mythicRitualController.cancelRitual();
```

---

## Performance

- **Detection:** Every 5s (not every frame)
- **Update:** 60 Hz during ritual
- **Geometry:** <500 vertices total
- **Particles:** 30-80 per ritual
- **Frame cost:** <0.5ms
- **Cooldown:** 45s minimum between rituals

---

## Safety Checklist

✅ No player movement changes  
✅ No camera modifications  
✅ No node position changes  
✅ No physics changes  
✅ All effects visual only  
✅ Smooth fade in/out  
✅ Fully reversible  
✅ GPU-friendly  
✅ Auto-skip on low FPS  
✅ One ritual at a time  

---

## Rarity Estimates

| Ritual | Rarity | Per 30min Session |
|--------|--------|-------------------|
| ASCENSION_RITUAL | Very Rare | 0-2 times |
| QUANTUM_FISSURE | Rare | 1-3 times |
| HARMONY_CONVERGENCE | Rare | 1-2 times |
| CHAOS_RITUAL | Uncommon | 2-4 times |
| MYTHIC_SIGNAL | Very Rare | 0-1 times |
| ECHO_RITUAL | Rare | 1-2 times |

---

## Debug Commands

```javascript
// View state
console.log(game.mythicRitualController.getRitualState());

// Cancel active ritual
game.mythicRitualController.cancelRitual();

// Check cooldown
const cooldown = 45 - (Date.now()/1000 - game.mythicRitualController.lastRitualTime);
console.log(`Cooldown: ${cooldown.toFixed(1)}s`);
```

---

## Example Timeline

```
T=0s    Detection: ASCENSION_RITUAL triggered
T=0-3s  INIT: Fade in, gather energy
T=3-9s  RISE: Build intensity, rise
T=9-14s PEAK: Maximum spectacle
T=14-18s FALL: Wind down, fade out
T=18s   Cleanup: Restore world, start cooldown
T=63s   Cooldown complete, can trigger again
```

---

## Tips

✨ **Rituals are earned** — achieve extraordinary states to witness them  
✨ **Rare by design** — 45s cooldown ensures they feel special  
✨ **Watch the HUD** — golden text announces ritual type  
✨ **Observe phases** — notice the build from INIT to PEAK  
✨ **Node glow** — all nodes shine brighter during ritual  
✨ **Sky shifts** — each ritual has unique atmospheric colors  

---

**Status:** ✅ Production-ready  
**Version:** 1.0 (SAFE EDITION)  
**Last updated:** Current session  

---

**When the network achieves the impossible, the cosmos celebrates with mythic ceremony.**
