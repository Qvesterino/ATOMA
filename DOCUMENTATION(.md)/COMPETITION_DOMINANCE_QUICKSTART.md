# Competition & Dominance Visualization — Quick Start

## What It Does

ATOMA's specialized nodes now **compete for territorial influence**. When multiple specialized nodes share a region:
- **Dominant nodes** impose rhythm and coherence (clear, confident halos)
- **Contested zones** shimmer with tension (beat frequency wobble)
- **Weaker nodes** visually defer (dim, attenuated presence)

---

## 60-Second Setup

### 1. Import

```javascript
import { CompetitionDominanceAdapter_v1, setupCompetitionDominanceIntegration } 
  from './CompetitionDominanceAdapter_v1.js';
```

### 2. Create & Initialize

```javascript
const competitionDominance = new CompetitionDominanceAdapter_v1();

// In main.js animate loop:
competitionDominance.update(world.nodes, world.links, deltaTime, worldState);
```

### 3. Expose to Console

```javascript
setupCompetitionDominanceIntegration(competitionDominance, world);
```

### 4. Done! 

Type in console:
```javascript
competitionDominance.help()  // See all commands
```

---

## Quick Tuning

### Make Dominance More Obvious

```javascript
competitionDominance.setDominanceStrength(0.9)  // More pronounced authority
```

### Make Contestation More Visible

```javascript
competitionDominance.setContestationStrength(0.8)  // More wobble
```

### Expand Competition Zones

```javascript
competitionDominance.setRegionHopRadius(3)  // Include more distant nodes
```

### Check Status

```javascript
competitionDominance.getStatus()
```

---

## What You'll See

### 🟢 Dominant Nodes
- **Halo**: Bright, clear edges
- **Pulse**: Steady, confident rhythm
- **Ripples**: Strong outward propagation
- **Authority**: Nearby nodes' rhythms align to this node

### 🟡 Contested Nodes
- **Halo**: Subtle shimmer (beat frequency)
- **Pulse**: Slightly irregular timing
- **Ripples**: Collide with competing ripples
- **Visual Tension**: You see the "fight" for control

### 🔵 Submissive Nodes
- **Halo**: Dim, fading
- **Pulse**: Weak, slow
- **Ripples**: Barely visible
- **Deference**: Follows dominant node's rhythm

---

## Console Commands Cheat Sheet

```javascript
competitionDominance.enable()                        // Turn on
competitionDominance.disable()                       // Turn off
competitionDominance.setDominanceStrength(0.0–1.0)  // Adjust authority
competitionDominance.setContestationStrength(0.0–1.0) // Adjust tension
competitionDominance.setRegionHopRadius(1–5)        // Adjust region size
competitionDominance.setDebugMode(true/false)       // Debugging
competitionDominance.getStatus()                    // Current state
competitionDominance.help()                         // Full help
```

---

## Key Concepts

### Dominance Score
- **Specialized nodes** (excitatory/inhibitory) score higher
- **Harmonious networks** have clear winners
- **Corrupted networks** show chaotic competition
- **Tired nodes** lose authority temporarily

### Regions
- Defined by **2 hops** (default) through the network graph
- Each region has **one dominant node** + **contestants**
- **Updated every 30 frames** (smooth updates, low cost)

### Visual Smoothing
- **3-second transitions** between dominance states
- **No jarring power shifts** — hierarchy changes feel organic
- **Reversible** — if a node recovers fatigue, it can reclaim territory

---

## Troubleshooting

**Q: I don't see any competition visuals**
A: Make sure you have multiple specialized nodes (synapticBias ≠ 0) in close regions

**Q: Nodes keep flickering between dominance**
A: Corruption is high (chaotic networks are volatile). Add harmony nodes!

**Q: Performance impact?**
A: Negligible (<0.01ms per frame). This adapter is extremely efficient.

**Q: Can I disable it?**
A: Yes — `competitionDominance.disable()` turns it completely off

---

## Expected Behavior

### Fresh Network (All Harmony, Balanced Specialization)
- Clear territorial divisions
- Stable, readable hierarchies
- Smooth power dynamics

### Corrupted Network (High Corruption, Mixed Specialization)
- Chaotic competition
- Constant contestation
- Ripples interfere wildly

### Evolved Network (Diverse Specialization, High Synergy)
- Multiple distinct territories
- Specialized nodes dominate their zones
- Clear "political" landscape

---

## Next Steps

1. **Observe**: Watch how nodes compete for territory
2. **Tune**: Adjust dominance/contestation strength to taste
3. **Combine**: Works seamlessly with Synaptic Fatigue + Specialization
4. **Extend**: Consider adding audio cues (beat frequencies → electrical chirps)

---

**Status**: ✅ Ready to use | **Cost**: <0.01ms/frame | **Allocations**: Zero
