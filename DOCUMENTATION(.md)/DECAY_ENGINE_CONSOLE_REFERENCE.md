# LinkPriorityDecayEngine 1.0 — Console Command Reference

## Quick Start

After ATOMA loads, open the browser console and try:

```javascript
// See overall engine status
getDecayEngineStatus()

// Monitor a link's decay
getDecayStats('node123', 'node456')

// Adjust behavior
setDecayRate(1.5)
setDecayHalfLife(45)

// Emergency reset
resetAllPriorities()
```

---

## 📊 `getDecayEngineStatus()`

**Purpose:** Get real-time metrics about the decay engine  
**Parameters:** None  
**Returns:** Console output (no return value)

### Output Example:
```
📊 Link Priority Decay Engine Status
├─ Active: true
├─ Total Links: 42
├─ Decayed Links: 12
├─ Average Priority: 78.45
├─ Decay Rate (%): 1.00
└─ Half-Life (seconds): 60
```

### What It Means:
- **Active:** Engine is running and processing
- **Total Links:** How many links currently exist
- **Decayed Links:** How many have priority < 100
- **Average Priority:** Mean priority across all links (0-100)
- **Decay Rate:** % decay per second
- **Half-Life:** Time for priority to reach 50 (exponential)

---

## 📉 `getDecayStats(nodeAId, nodeBId)`

**Purpose:** Get detailed decay stats for a specific link  
**Parameters:**
- `nodeAId` (string) - ID of source node
- `nodeBId` (string) - ID of target node

**Returns:** Console output with link statistics

### Usage:
```javascript
// Example: Check decay on a specific link
getDecayStats('qnt-001', 'syn-042')
```

### Output Example:
```
📉 Decay Stats: qnt-001 → syn-042
├─ Current Priority: 85.23
├─ Initial Priority: 100.00
├─ Age (seconds): 15.34
├─ Decay Applied (%): 14.77
└─ Is Active: true
```

### What It Means:
- **Current Priority:** Link's priority now (0-100)
- **Initial Priority:** What it started at
- **Age:** How long link has existed
- **Decay Applied:** How much priority lost (100 - current)
- **Is Active:** Whether link is currently being tracked

---

## 🔄 `resetAllPriorities()`

**Purpose:** Reset all link priorities back to 100  
**Parameters:** None  
**Returns:** Console message

### Usage:
```javascript
// Reset the decay timeline
resetAllPriorities()
```

### Output:
```
✓ All link priorities reset to 100
```

### When to Use:
- Testing decay behavior from scratch
- Emergency reset after tuning changes
- Starting a new test scenario
- Clearing old decay history

---

## ⚡ `setDecayRate(ratePercent)`

**Purpose:** Change how fast links decay per second  
**Parameters:**
- `ratePercent` (number) - Decay rate as percentage per second (0-100)

**Returns:** Console confirmation

### Usage Examples:
```javascript
// Slow decay (0.5% per second)
setDecayRate(0.5)

// Normal decay (1% per second)
setDecayRate(1)

// Fast decay (5% per second)
setDecayRate(5)
```

### Output:
```
✓ Decay rate set to 1.5% per second
```

### How It Works:
- **0.5%:** Very slow, links stay fresh longer
- **1%:** Default, balanced decay
- **5%:** Fast, links become stale quickly
- **100%:** Instant decay to zero (not recommended)

### Relationship to Half-Life:
```
half_life = -1 / log₂(1 - rate/100)

Examples:
rate=1%  → half-life ≈ 69 seconds
rate=2%  → half-life ≈ 34 seconds
rate=5%  → half-life ≈ 13 seconds
```

---

## ⏱️ `setDecayHalfLife(seconds)`

**Purpose:** Set how long until priority reaches 50 (exponential decay)  
**Parameters:**
- `seconds` (number) - Half-life in seconds (must be ≥ 1)

**Returns:** Console confirmation

### Usage Examples:
```javascript
// Very short half-life (links decay fast)
setDecayHalfLife(10)

// Medium half-life (default)
setDecayHalfLife(60)

// Long half-life (links stay fresh)
setDecayHalfLife(300)
```

### Output:
```
✓ Decay half-life set to 60 seconds
```

### How It Works:
- After N seconds: priority = 100 × (0.5)^(t/N)
- After 1 half-life: priority = 50
- After 2 half-lives: priority = 25
- After 3 half-lives: priority = 12.5
- After 7 half-lives: priority < 1 (effectively dead)

### Example Timeline (60-second half-life):
```
Age (sec) │ Priority
─────────┼──────────
0         │ 100%
30        │ 70.7%
60        │ 50%
90        │ 35.4%
120       │ 25%
180       │ 12.5%
420       │ < 1%
```

---

## 🧪 Testing Scenarios

### Scenario 1: Slow Decay
```javascript
setDecayRate(0.1)        // 0.1% per second
setDecayHalfLife(1000)   // 1000 second half-life
getDecayEngineStatus()   // Check status

// Links should stay at 100 for a long time
```

### Scenario 2: Fast Decay
```javascript
setDecayRate(10)        // 10% per second
setDecayHalfLife(7)     // 7 second half-life
getDecayEngineStatus()

// Links should drop quickly
// After ~50 seconds, most links < 1
```

### Scenario 3: Monitor Specific Link
```javascript
// Create a new link in the editor, then:
getDecayStats('nodeA', 'nodeB')   // T=0
// Wait 10 seconds
getDecayStats('nodeA', 'nodeB')   // T=10
// Wait 10 more seconds
getDecayStats('nodeA', 'nodeB')   // T=20

// Watch priority decrease over time
```

---

## ⚠️ Error Messages

### "⚠ LinkPriorityDecayEngine not available"
**Cause:** Engine not initialized yet (game still loading)  
**Solution:** Wait a few seconds and try again

### "⚠ Usage: getDecayStats(nodeAId, nodeBId)"
**Cause:** Missing node IDs  
**Solution:** Provide both source and target node IDs

### "⚠ No decay stats found for link X → Y"
**Cause:** Link doesn't exist or hasn't been tracked  
**Solution:** Verify node IDs are correct; link may have been deleted

### "⚠ Decay rate must be 0-100"
**Cause:** Invalid rate percentage  
**Solution:** Use value between 0 and 100

### "⚠ Half-life must be >= 1 second"
**Cause:** Half-life too small  
**Solution:** Use minimum 1 second

---

## 📈 Monitoring Best Practices

### 1. Establish Baseline
```javascript
getDecayEngineStatus()
// Note: average priority, total links count
```

### 2. Track Over Time
```javascript
// Every 30 seconds, check:
getDecayEngineStatus()
// Watch for: average priority dropping
```

### 3. Deep Dive on Link
```javascript
// When average priority seems off:
getDecayStats('specific_node_a', 'specific_node_b')
// Check: age, decay applied, current priority
```

### 4. Tune Parameters
```javascript
// If decay too fast:
setDecayRate(0.5)
setDecayHalfLife(120)

// If decay too slow:
setDecayRate(2)
setDecayHalfLife(30)
```

### 5. Verify Changes
```javascript
// After tuning:
resetAllPriorities()  // Start fresh
getDecayEngineStatus()
// Monitor new behavior
```

---

## 🎯 Default Parameters

| Parameter | Default | Range | Unit |
|-----------|---------|-------|------|
| Decay Rate | 1.0 | 0-100 | % per second |
| Half-Life | 60 | ≥1 | seconds |
| Initial Priority | 100 | 0-100 | score |
| Prune Threshold | 5 | 0-100 | score |

---

## 💡 Tips & Tricks

### Quick Status Check
```javascript
// Single line for active monitoring
getDecayEngineStatus(); console.clear(); // Clear clutter
```

### Batch Link Monitoring
```javascript
// Create a helper
function checkLinks(pairs) {
  pairs.forEach(([a, b]) => getDecayStats(a, b));
}

// Use it:
checkLinks([
  ['node1', 'node2'],
  ['node3', 'node4'],
  ['node5', 'node6']
])
```

### Extreme Decay Test
```javascript
setDecayRate(50)       // 50% per second
setDecayHalfLife(1.4)  // ~1.4 second half-life
// Links disappear in seconds
```

### Minimal Decay Test
```javascript
setDecayRate(0.01)        // 0.01% per second
setDecayHalfLife(10000)   // ~10000 second half-life (~3 hours)
// Links stay fresh forever (essentially)
```

---

## 📞 Support

If commands don't work:
1. Check browser console for errors
2. Verify game is fully loaded
3. Try `getDecayEngineStatus()` first
4. Check all parameters are correct type
5. Review error messages above

**Console API fully operational after main.js initialization completes.**
