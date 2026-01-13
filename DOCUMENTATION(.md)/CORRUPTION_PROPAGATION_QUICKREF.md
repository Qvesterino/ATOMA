# Corruption Propagation System — Quick Reference

## Status
✅ **FULLY IMPLEMENTED AND ACTIVE**  
Running since line 5346 in main.js via `safeTick(this.linkCorruptionTransmission, deltaTime)`

## How It Works

**Corruption spreads through network links** based on:
- Node harmony (defense - blocks/heals)
- Node synergy (defense - slows spread)
- Archetype type (Sigma/Prime slow, Chaos/Error accelerate)
- Link distance (healing decays over hops)

## Propagation Phases

| Phase | Trigger | Effect |
|-------|---------|--------|
| **1** | Always | Corruption spreads through links |
| **2** | Harmony ≥ 0.4 | Transmission begins damping |
| **2** | Harmony ≥ 0.8 | Transmission blocks entirely |
| **3** | Harmony ≥ 0.85 | Active healing begins |
| **3b** | Healing active | Harmony reinforces itself |
| **4-lite** | Defense success | Node synergy increases |
| **5** | Harmony + Synergy | Resonance zones amplify defense |

## Visual Cascades

| Link Corruption | Visual Effect |
|---|---|
| 0.0 - 0.44 | None (hidden) |
| 0.45 - 0.64 | Shader distortion on link |
| 0.65 - 0.84 | Directional particles emit |
| 0.85 - 0.99 | Wave animation + node visual impact |
| 1.0 | Immediate cascade pulse |

## Console Testing

### Check Network Status
```javascript
// All nodes with corruption
window.game.aiNodes.nodes
  .filter(n => n.userData.corruption > 0)
  .map(n => ({
    id: n.id,
    corruption: n.userData.corruption.toFixed(2),
    harmony: n.userData.harmony?.toFixed(2) || '0.00',
    synergy: n.userData.synergy?.toFixed(2) || '0.00'
  }))

// All links with corruption
window.game.linkingSystem.links
  .filter(l => l.userData.corruptionLevel > 0)
  .map(l => ({
    from: l.a.id,
    to: l.b.id,
    level: l.userData.corruptionLevel.toFixed(2)
  }))
```

### Infect a Node
```javascript
const node = window.game.aiNodes.nodes[0];
node.userData.corruption = 0.8;
// Watch it spread to neighbors in real-time
```

### Create Harmonic Defense
```javascript
const node = window.game.aiNodes.nodes[0];
node.userData.harmony = 0.95;
// Node will block spread and heal corruption
```

### Test Resonance
```javascript
// Find two highly harmonic nodes
const n1 = window.game.aiNodes.nodes[0];
const n2 = window.game.aiNodes.nodes[5];
n1.userData.harmony = 0.95;
n1.userData.synergy = 0.85;
n2.userData.harmony = 0.95;
n2.userData.synergy = 0.85;
// Create corruption nearby
// Watch zone resist infection
```

## Archetype Multipliers

| Archetype | Multiplier | Effect |
|-----------|-----------|--------|
| **Sigma** | 0.3x | Blocks 70% of spread |
| **Prime** | 0.5x | Blocks 50% of spread |
| **Normal** | 1.0x | Normal spread rate |
| **Chaos** | 2.0x | Doubles spread rate |
| **Error** | 1.5x | 50% faster spread |
| **Quantum** | Varies | Unpredictable bursts |

## Thresholds

**Harmony Blocking**:
- 0.4+ → Damping begins
- 0.8+ → Transmission blocks
- 1.0 → Full immunity

**Harmony Healing**:
- 0.85+ → Active healing starts
- Rate: 0.05 per second (slow)
- Cascades: 50% decay per hop, max 3 hops

**Link Corruption Cascade**:
- 0.45 → Particles visible
- 0.60 → Target infection begins
- 0.85 → Wave animation triggers
- 1.0 → Immediate pulse

## Network Behaviors

### Pure Chaos (Low Harmony, Low Synergy)
```
Result: Rapid corruption spread, cascades everywhere
Expect: High visual activity, corruption reaches 1.0 quickly
```

### Pure Order (High Harmony, High Synergy)
```
Result: Corruption barely spreads, heals actively
Expect: Minimal visual activity, corruption stays <0.4
```

### Resonance Zone (High Harmony + Synergy)
```
Result: Defense amplifies, spreads become rare
Expect: Network becomes corruption-resistant
```

### Balanced (Medium Harmony + Synergy)
```
Result: Corruption spreads moderately, then stabilizes
Expect: Equilibrium reached after 10-30 seconds
```

## Performance

- **Cost**: ~2-5ms per frame
- **Update**: Every frame (deltaTime-based)
- **Memory**: O(n) where n = links
- **Optimization**: Only recalculates changed nodes

## Files

**Core System**: `/LinkCorruptionTransmission_v1.js` (~800 lines)
**Integration**: `main.js` line 5346  
**Initialization**: `main.js` lines 3589-3596  

## Integration with Auras

Node-linked auras **visually represent** corruption state:
- **High corruption** → Torn, irregular aura
- **High harmony** → Smooth, coherent aura
- **Propagation visible** → Real-time aura changes as corruption spreads

When corruption propagates:
1. Link corruption increases (particles visible)
2. Node corruption increases  
3. Node aura becomes more irregular
4. Harmony response (if present) begins healing

## Key Gameplay Properties

✅ **Emergent behavior** — Corruption/harmony balance creates dynamics  
✅ **Archetype matters** — Different types have different roles  
✅ **Defense is active** — Harmony and synergy aren't passive  
✅ **Self-reinforcing loops** — Harmony heals → increases harmony → heals more  
✅ **Visual feedback** — Particles/distortion show spread in real-time  
✅ **Strategic depth** — Network design affects resilience  

## Testing Checklist

- [ ] Corruption spreads from high → low node
- [ ] Particles visible at 0.65+ link corruption
- [ ] Wave animation triggers at 0.85+ link corruption
- [ ] High harmony blocks spread (≥0.8)
- [ ] High harmony heals (≥0.85)
- [ ] Sigma nodes slow spread (0.3x)
- [ ] Chaos nodes accelerate spread (2.0x)
- [ ] Auras update as corruption changes
- [ ] Resonance zones form (harmony + synergy)
- [ ] Network reaches equilibrium

## Tips

1. **To slow corruption**: Increase node harmony (passive defense)
2. **To accelerate corruption**: Use chaos-type nodes
3. **To create immunity**: Both high harmony AND synergy
4. **To visualize better**: Toggle between normal view and debug wireframe
5. **To test faster**: Set corruption to 0.9 directly via console

