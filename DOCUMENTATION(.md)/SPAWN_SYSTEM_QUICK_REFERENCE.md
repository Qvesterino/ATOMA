# Extended Spawn System 1.0 — Quick Reference

## 🚀 Get Started in 30 Seconds

```javascript
// See what's spawned
spawn.stats()

// Spawn specific types
spawn.mythic()          // Ultra-rare gold node
spawn.prime()           // Rare white node
spawn.error()           // Unstable red node
spawn.extreme()         // Random EXTREME archetype

// View distribution
spawn.weights()         // Show spawn probabilities
spawn.list()            // List all 49 archetypes
```

---

## 📊 The Numbers

| Type | Chance | Count | Color | Rarity |
|------|--------|-------|-------|--------|
| Standard | 65% | 6 | Various | Common |
| Special | 10% | 3 | Various | Common |
| EXTREME | 5% | 13 | Various | Medium-Rare |
| PRIME | 2.5% | 1 | White | Rare |
| MYTHIC | 1% | 1 | Gold | Ultra-Rare |
| ERROR | 1% | 1 | Red | Ultra-Rare |

---

## 🎯 Commands

### Spawn

```javascript
spawn.mythic()                              // Mythic node
spawn.prime()                               // Prime node
spawn.error()                               // Error node
spawn.extreme()                             // Random extreme
spawn.archetype('CORE-HARMONIC-RESONANT')   // Specific archetype
```

### Info

```javascript
spawn.stats()                               // Distribution stats
spawn.list()                                // All 49 archetypes
spawn.weights()                             // Weight percentages
```

---

## 🧬 The 49 Archetypes

### CORE Layer (12)
- CORE-HARMONIC-RESONANT
- CORE-QUANTUM-ENTANGLED
- CORE-CHAOS-FRACTURED
- CORE-STELLAR-ASCENDED
- CORE-PRIME-PERFECT
- CORE-VOID-SILENT
- CORE-FLUX-ADAPTIVE
- CORE-NEXUS-CONVERGENT
- CORE-ECHO-RECURSIVE
- CORE-SURGE-DYNAMIC
- CORE-STATIC-ANCHORED
- CORE-WHISPER-SUBTLE

### OUTER Layer (12)
- OUTER-RADIANT-EXPANSIVE
- OUTER-SPIRAL-TEMPORAL
- OUTER-VOID-ABSORBING
- OUTER-CROWN-SOVEREIGN
- OUTER-LATTICE-PERFECT
- OUTER-PULSE-RHYTHMIC
- OUTER-TIDE-FLOWING
- OUTER-DEPTH-PROFOUND
- OUTER-SPARK-VIVID
- OUTER-SHADOW-VEILED
- OUTER-STORM-TURBULENT
- OUTER-LIGHT-ETERNAL

### EXTREME Layer (13)
- EXTREME-SINGULARITY-DENSE
- EXTREME-ENTROPY-CHAOTIC
- EXTREME-INFINITY-BOUNDLESS
- EXTREME-NEXUS-INFINITE
- EXTREME-VOID-ABSOLUTE
- EXTREME-APOTHEOSIS-ASCENDED
- EXTREME-PARADOX-UNSTABLE
- EXTREME-ZENITH-PINNACLE
- EXTREME-VOID-CONSUMING
- EXTREME-HARMONIC-PERFECT
- EXTREME-CHAOS-PRIMORDIAL
- EXTREME-TRANSCENDENT-ETERNAL
- EXTREME-BALANCE-EQUILIBRIUM

### SPECIAL Layer (12)
- SPECIAL-SIGMA-DIMENSIONAL
- SPECIAL-QUANTUM-SUPERPOSED
- SPECIAL-EMOTIONAL-RESONANT
- SPECIAL-MYTHIC-CEREMONIAL
- SPECIAL-PRIME-CRYSTALLINE
- SPECIAL-ERROR-ANOMALY
- SPECIAL-SIGMA-ANOMALY
- SPECIAL-QUANTUM-ENTANGLED
- SPECIAL-EMOTIONAL-EMPATHIC
- SPECIAL-UNITY-CONVERGENT
- SPECIAL-APEX-SUPREME
- SPECIAL-GENESIS-PRIMORDIAL

---

## 💡 Examples

### Spawn Specific Archetype

```javascript
spawn.archetype('EXTREME-INFINITY-BOUNDLESS')
// ✓ Archetype EXTREME-INFINITY-BOUNDLESS spawned at (25.3, 4.1, -12.8)
```

### Check Current Distribution

```javascript
spawn.stats()
// Shows total nodes and rarity breakdown
```

### See All Options

```javascript
spawn.list()
// Displays table of all 49 archetypes
```

---

## 🎨 Node Colors

| Category | Color | Hex |
|----------|-------|-----|
| input | Cyan | #00dddd |
| process | Blue | #0066ff |
| integration | Violet | #aa00ff |
| analytics | Magenta | #ff00ff |
| storage | Teal | #00ddaa |
| control | Amber | #ffaa00 |
| sigma | Green | #00ff00 |
| quantum | Indigo | #4400ff |
| **mythic** | **Gold** | **#ffdd00** |
| **prime** | **White** | **#ffffff** |
| **error** | **Red** | **#ff3333** |

---

## 🔍 Debug Tips

### View current stats
```javascript
spawn.stats()
```

### List all archetypes
```javascript
spawn.list()
```

### Show weight distribution
```javascript
spawn.weights()
```

### Spawn a specific rarity
```javascript
spawn.mythic()    // 1%
spawn.prime()     // 2.5%
spawn.error()     // 1%
spawn.extreme()   // 5%
```

### Spawn specific archetype
```javascript
spawn.archetype('CORE-HARMONIC-RESONANT')
```

---

## 📈 Spawn Rates

- **Time-based:** Every 20-40 seconds (weighted random)
- **Event-based:** 20% chance on link creation (weighted random)
- **Density-based:** When below 70% of 50-node target (weighted random)
- **Total rate:** ~1 new node per 25 seconds average

---

## ✨ Features

✅ All 49 archetypes can spawn naturally  
✅ Balanced weights prevent overpopulation  
✅ Works across all world types  
✅ Statistics tracking for diagnostics  
✅ Easy console API for testing  
✅ Backward compatible with existing code  
✅ No gameplay modifications  
✅ Production-ready  

---

## 🎯 Common Use Cases

### "Give me a MYTHIC node"
```javascript
spawn.mythic()
```

### "What's the current network?"
```javascript
spawn.stats()
```

### "Spawn this specific archetype"
```javascript
spawn.archetype('EXTREME-SINGULARITY-DENSE')
```

### "Show all available types"
```javascript
spawn.list()
```

### "What are the spawn chances?"
```javascript
spawn.weights()
```

---

**Quick Tip:** Use `spawn.stats()` often to monitor network composition! 📊
