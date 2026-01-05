# Extended Spawn System 1.0 — Console Command Reference

## 📋 Complete Command Reference

All commands available through `window.spawn` namespace.

---

## 🎯 Spawn Commands

### spawn.mythic()

**Description:** Spawn a single MYTHIC node (ultra-rare)  
**Probability:** 0.5-1.5% natural spawn chance  
**Color:** Gold (#ffdd00)  
**Category:** mythic  
**Archetype:** MYTHIC-CEREMONIAL  

**Syntax:**
```javascript
spawn.mythic()
```

**Example Output:**
```
✓ MYTHIC node spawned at (15.3, 4.2, -8.7)
```

**Use Case:** Testing rare node behavior, creating ceremonial events

---

### spawn.prime()

**Description:** Spawn a single PRIME node (rare)  
**Probability:** 2-3% natural spawn chance  
**Color:** White (#ffffff)  
**Category:** prime  
**Archetype:** PRIME-PERFECT  

**Syntax:**
```javascript
spawn.prime()
```

**Example Output:**
```
✓ PRIME node spawned at (20.1, 3.8, 5.9)
```

**Use Case:** Testing perfect topology, crystalline structures

---

### spawn.error()

**Description:** Spawn a single ERROR node (unstable)  
**Probability:** 0.5-1.5% natural spawn chance  
**Color:** Red (#ff3333)  
**Category:** error  
**Archetype:** ERROR-ANOMALY  

**Syntax:**
```javascript
spawn.error()
```

**Example Output:**
```
✓ ERROR node spawned at (12.5, 2.3, -15.7)
```

**Use Case:** Testing chaos events, glitch effects

---

### spawn.extreme()

**Description:** Spawn a random EXTREME archetype (medium-rare)  
**Probability:** 4-6% natural spawn chance  
**Color:** Various (archetype-dependent)  
**Category:** Various (8 different categories)  
**Archetype:** Random from 13 EXTREME types  

**Syntax:**
```javascript
spawn.extreme()
```

**Example Output:**
```
✓ EXTREME node spawned at (8.2, 5.1, -3.4)
```

**Possible Archetypes:**
- EXTREME-SINGULARITY-DENSE (prime)
- EXTREME-ENTROPY-CHAOTIC (error)
- EXTREME-INFINITY-BOUNDLESS (mythic)
- EXTREME-NEXUS-INFINITE (process)
- EXTREME-VOID-ABSOLUTE (error)
- EXTREME-APOTHEOSIS-ASCENDED (mythic)
- EXTREME-PARADOX-UNSTABLE (error)
- EXTREME-ZENITH-PINNACLE (prime)
- EXTREME-VOID-CONSUMING (error)
- EXTREME-HARMONIC-PERFECT (prime)
- EXTREME-CHAOS-PRIMORDIAL (error)
- EXTREME-TRANSCENDENT-ETERNAL (mythic)
- EXTREME-BALANCE-EQUILIBRIUM (integration)

**Use Case:** Testing extreme behavior, stress testing network

---

### spawn.archetype(name)

**Description:** Spawn specific archetype by exact name  
**Parameter:** `name` (string) — exact archetype name  
**Returns:** Node object or null if archetype invalid  

**Syntax:**
```javascript
spawn.archetype('CORE-HARMONIC-RESONANT')
spawn.archetype('EXTREME-INFINITY-BOUNDLESS')
spawn.archetype('SPECIAL-QUANTUM-SUPERPOSED')
```

**Example Output:**
```
✓ Archetype CORE-HARMONIC-RESONANT spawned at (18.7, 3.5, 2.1)
```

**Error Output:**
```
Unknown archetype: INVALID-NAME
```

**Valid Archetype Names:**
See [Complete Archetype List](#complete-archetype-list) section below.

**Use Case:** Targeted testing, specific behavior verification

---

## 📊 Diagnostic Commands

### spawn.stats()

**Description:** Print current archetype statistics  
**Output:** Detailed breakdown by category and rarity  
**Frequency:** Safe to call frequently  

**Syntax:**
```javascript
spawn.stats()
```

**Example Output:**
```
🧬 ARCHETYPE STATISTICS
────────────────────────────────────
Total Nodes: 48

By Category: {
  input: 8,
  process: 7,
  integration: 6,
  analytics: 7,
  storage: 8,
  control: 7,
  mythic: 0,
  prime: 1,
  error: 0,
  sigma: 3,
  quantum: 2,
  emotional: 2
}

Rarity Distribution:
  MYTHIC: 0 (0.0%)
  PRIME:  1 (2.1%)
  ERROR:  0 (0.0%)
  EXTREME: 0 (0.0%)
```

**Interpretation:**
- **Total Nodes:** Current network size
- **By Category:** Distribution across all categories
- **Rarity Distribution:** Percentage of ultra-rare types

**Use Case:** Monitor network composition, track rarity spawns

---

### spawn.list()

**Description:** Display all 49 standardized archetypes  
**Output:** Table with archetype name and base category  
**Frequency:** Safe to call, output is verbose  

**Syntax:**
```javascript
spawn.list()
```

**Example Output:**
```
🧬 All 49 Standardized Archetypes:
┌─────────────────────────────┬─────────────┐
│ archetype                   │ baseCategory │
├─────────────────────────────┼─────────────┤
│ CORE-HARMONIC-RESONANT      │ process     │
│ CORE-QUANTUM-ENTANGLED      │ quantum     │
│ CORE-CHAOS-FRACTURED        │ error       │
│ CORE-STELLAR-ASCENDED       │ mythic      │
│ CORE-PRIME-PERFECT          │ prime       │
│ ... (44 more entries)       │             │
└─────────────────────────────┴─────────────┘
```

**Use Case:** Reference all available archetypes, debug archetype names

---

### spawn.weights()

**Description:** Show spawn weight distribution  
**Output:** Percentage breakdown by rarity tier  
**Frequency:** Safe to call  

**Syntax:**
```javascript
spawn.weights()
```

**Example Output:**
```
📊 Spawn Weight Distribution:
┌──────────┬─────────────────────────┐
│ Tier     │ Probability             │
├──────────┼─────────────────────────┤
│ standard │ 65.0% (6 categories)    │
│ mythic   │ 1.0% (ultra-rare)       │
│ prime    │ 2.5% (rare)             │
│ error    │ 1.0% (unstable)         │
│ extreme  │ 5.0% (13 archetypes)    │
│ special  │ 25.5% (sigma/quantum...) │
└──────────┴─────────────────────────┘
```

**Interpretation:**
- Each percentage shows the likelihood of spawning that tier
- All percentages sum to 100%
- Standard + Special = 90.5% (common)
- MYTHIC + PRIME + ERROR + EXTREME = 9.5% (rare)

**Use Case:** Verify spawn distribution, understand probabilities

---

## 🧬 Complete Archetype List

### CORE Layer (12 archetypes)

| # | Archetype | Category |
|---|-----------|----------|
| 1 | CORE-HARMONIC-RESONANT | process |
| 2 | CORE-QUANTUM-ENTANGLED | quantum |
| 3 | CORE-CHAOS-FRACTURED | error |
| 4 | CORE-STELLAR-ASCENDED | mythic |
| 5 | CORE-PRIME-PERFECT | prime |
| 6 | CORE-VOID-SILENT | control |
| 7 | CORE-FLUX-ADAPTIVE | integration |
| 8 | CORE-NEXUS-CONVERGENT | storage |
| 9 | CORE-ECHO-RECURSIVE | analytics |
| 10 | CORE-SURGE-DYNAMIC | input |
| 11 | CORE-STATIC-ANCHORED | storage |
| 12 | CORE-WHISPER-SUBTLE | integration |

### OUTER Layer (12 archetypes)

| # | Archetype | Category |
|---|-----------|----------|
| 13 | OUTER-RADIANT-EXPANSIVE | input |
| 14 | OUTER-SPIRAL-TEMPORAL | analytics |
| 15 | OUTER-VOID-ABSORBING | error |
| 16 | OUTER-CROWN-SOVEREIGN | mythic |
| 17 | OUTER-LATTICE-PERFECT | prime |
| 18 | OUTER-PULSE-RHYTHMIC | control |
| 19 | OUTER-TIDE-FLOWING | integration |
| 20 | OUTER-DEPTH-PROFOUND | storage |
| 21 | OUTER-SPARK-VIVID | process |
| 22 | OUTER-SHADOW-VEILED | analytics |
| 23 | OUTER-STORM-TURBULENT | error |
| 24 | OUTER-LIGHT-ETERNAL | mythic |

### EXTREME Layer (13 archetypes)

| # | Archetype | Category |
|---|-----------|----------|
| 25 | EXTREME-SINGULARITY-DENSE | prime |
| 26 | EXTREME-ENTROPY-CHAOTIC | error |
| 27 | EXTREME-INFINITY-BOUNDLESS | mythic |
| 28 | EXTREME-NEXUS-INFINITE | process |
| 29 | EXTREME-VOID-ABSOLUTE | error |
| 30 | EXTREME-APOTHEOSIS-ASCENDED | mythic |
| 31 | EXTREME-PARADOX-UNSTABLE | error |
| 32 | EXTREME-ZENITH-PINNACLE | prime |
| 33 | EXTREME-VOID-CONSUMING | error |
| 34 | EXTREME-HARMONIC-PERFECT | prime |
| 35 | EXTREME-CHAOS-PRIMORDIAL | error |
| 36 | EXTREME-TRANSCENDENT-ETERNAL | mythic |
| 37 | EXTREME-BALANCE-EQUILIBRIUM | integration |

### SPECIAL Layer (12 archetypes)

| # | Archetype | Category |
|---|-----------|----------|
| 38 | SPECIAL-SIGMA-DIMENSIONAL | sigma |
| 39 | SPECIAL-QUANTUM-SUPERPOSED | quantum |
| 40 | SPECIAL-EMOTIONAL-RESONANT | emotional |
| 41 | SPECIAL-MYTHIC-CEREMONIAL | mythic |
| 42 | SPECIAL-PRIME-CRYSTALLINE | prime |
| 43 | SPECIAL-ERROR-ANOMALY | error |
| 44 | SPECIAL-SIGMA-ANOMALY | sigma |
| 45 | SPECIAL-QUANTUM-ENTANGLED | quantum |
| 46 | SPECIAL-EMOTIONAL-EMPATHIC | emotional |
| 47 | SPECIAL-UNITY-CONVERGENT | integration |
| 48 | SPECIAL-APEX-SUPREME | control |
| 49 | SPECIAL-GENESIS-PRIMORDIAL | input |

---

## 💡 Usage Examples

### Example 1: Spawn and Check Distribution

```javascript
// Spawn a MYTHIC node
spawn.mythic()

// Check the impact
spawn.stats()

// Expected: MYTHIC count increased by 1
```

### Example 2: Test Specific Archetype

```javascript
// Spawn EXTREME-INFINITY-BOUNDLESS 5 times
spawn.archetype('EXTREME-INFINITY-BOUNDLESS')
spawn.archetype('EXTREME-INFINITY-BOUNDLESS')
spawn.archetype('EXTREME-INFINITY-BOUNDLESS')
spawn.archetype('EXTREME-INFINITY-BOUNDLESS')
spawn.archetype('EXTREME-INFINITY-BOUNDLESS')

// Check results
spawn.stats()

// Expected: 5 EXTREME nodes of mythic category
```

### Example 3: Monitor Natural Spawning

```javascript
// Check initial state
spawn.stats()

// Wait 30 seconds (natural spawn cycle)
// Archetypes will spawn naturally

// Check new state
spawn.stats()

// Expected: distribution follows spawn weights
```

### Example 4: View All Available Options

```javascript
// See all archetypes
spawn.list()

// View probability distribution
spawn.weights()
```

---

## 🎯 Command Decision Tree

```
Need to spawn a node?
│
├─ Know exact archetype?
│  └─ spawn.archetype('NAME')
│
├─ Want specific rarity?
│  ├─ MYTHIC? → spawn.mythic()
│  ├─ PRIME? → spawn.prime()
│  ├─ ERROR? → spawn.error()
│  └─ EXTREME? → spawn.extreme()
│
└─ Need diagnostics?
   ├─ Current distribution? → spawn.stats()
   ├─ All options? → spawn.list()
   └─ Probabilities? → spawn.weights()
```

---

## 📝 Tips & Tricks

### Quick Spawn Testing

```javascript
// Spawn different types in sequence
spawn.mythic()
spawn.prime()
spawn.error()
spawn.extreme()

// Then check
spawn.stats()
```

### Monitor Specific Archetype

```javascript
// Get baseline
const before = window.game.aiNodes.nodes.length

// Spawn many times
for (let i = 0; i < 10; i++) {
  spawn.archetype('EXTREME-SINGULARITY-DENSE')
}

// Check result
spawn.stats()
```

### Verify Probabilities

```javascript
// Spawn many random nodes and track
const counts = {}
for (let i = 0; i < 1000; i++) {
  spawn.extreme()
}
spawn.stats()  // Should show balanced distribution
```

---

## 🔍 Troubleshooting

### Command Not Found

**Issue:** `spawn is not defined`

**Solution:** Check game initialization
```javascript
if (window.spawn) {
  spawn.mythic()  // OK
} else {
  console.log('Game not fully loaded yet')
}
```

### Invalid Archetype Name

**Issue:** `Unknown archetype: TYPO-NAME-HERE`

**Solution:** Use exact names
```javascript
// Wrong
spawn.archetype('CORE-HARMONIC')

// Right
spawn.archetype('CORE-HARMONIC-RESONANT')

// Get correct names
spawn.list()
```

### No Visible Change

**Issue:** Spawned node not visible

**Solution:** Check position and camera
```javascript
const node = spawn.mythic()
console.log('Position:', node.position)
console.log('Camera:', window.game.camera.position)
// Move camera to see node
```

---

## 📊 Quick Reference Table

| Command | Purpose | Returns | Parameters |
|---------|---------|---------|-----------|
| `spawn.mythic()` | Spawn MYTHIC | Node | None |
| `spawn.prime()` | Spawn PRIME | Node | None |
| `spawn.error()` | Spawn ERROR | Node | None |
| `spawn.extreme()` | Spawn random EXTREME | Node | None |
| `spawn.archetype(name)` | Spawn specific | Node/null | String |
| `spawn.stats()` | Show distribution | void | None |
| `spawn.list()` | List all archetypes | void | None |
| `spawn.weights()` | Show probabilities | void | None |

---

## ✨ Pro Tips

1. **Use `spawn.stats()` frequently** to monitor network composition
2. **Call `spawn.list()`** when you forget archetype names
3. **Check `spawn.weights()`** to understand spawn odds
4. **Test specific archetypes** with `spawn.archetype(name)`
5. **Monitor with `spawn.stats()`** after spawning to verify

---

**Happy spawning!** 🎉

For more information, see:
- SPAWN_SYSTEM_UPDATE_SUMMARY.md — Full documentation
- SPAWN_SYSTEM_QUICK_REFERENCE.md — Quick start guide
- SPAWN_SYSTEM_ARCHITECTURE.md — Technical details
