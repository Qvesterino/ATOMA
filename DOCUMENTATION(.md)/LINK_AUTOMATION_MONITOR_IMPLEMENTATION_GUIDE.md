# LinkAutomationMonitor2_0 — Implementation Guide

**Deep dive into architecture, data structures, and internal design.**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Automation Pipeline                      │
│  (LinkAutomationEngine1_0, NodeLinkingSystem, etc.)         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Event hooks
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          LinkAutomationMonitor2_0 (This Module)              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Event Ring Buffer (30 events)                          │ │
│  │ └─→ Most recent 15 events for HUD                      │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Session Statistics (aggregated)                        │ │
│  │ └─→ Totals, averages, best/worst                       │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Cycle History (20 cycles)                              │ │
│  │ └─→ Per-cycle metrics for trend analysis               │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ getStats()
                       ▼
┌─────────────────────────────────────────────────────────────┐
│        LinkAutomationMonitorHUD2_0 (Visualization)           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Synergy & Automation Monitor Panel (Neon UI)           │ │
│  │  • Top Recommendations                                 │ │
│  │  • Engine Status (ENABLED/DISABLED, config)            │ │
│  │  • Statistics (totals, quality metrics)                │ │
│  │  • Trend Indicator (↑↓→, volatility)                   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Structures

### Session Statistics Object

```js
_sessionStats = {
  // Timing
  startedAt: 1699564800000,                 // ms
  
  // Activity counts
  totalCycles: 12,
  totalRecommendations: 96,
  totalAutoLinksCreated: 24,
  totalManualLinksCreated: 3,
  
  // Rejection tracking (by reason)
  totalAutoLinksRejectedLowQuality: 48,     // Below quality threshold
  totalAutoLinksRejectedDuplicate: 16,      // Link already exists
  totalAutoLinksRejectedInvalid: 8,         // Null/missing nodes
  totalAutoLinksRejectedOther: 0,           // Unknown reasons
  totalEngineErrors: 2,                     // Exceptions during automation
  
  // Quality metrics
  avgSynergyCreated: 0.781,                 // Running average of auto-links
  bestSynergyCreated: 0.95,                 // Highest synergy ever created
  avgSynergyEvaluated: 0.62,                // Average of ALL recommendations
  
  // Performance
  totalCycleDurationMs: 480,                // Sum of all cycle times
  lastCycleDurationMs: 42,
  
  // Configuration snapshot
  currentQualityThreshold: 0.65,
  currentCooldownMs: 500
}
```

### Cycle History Record

```js
{
  cycleIndex: 5,                            // Which cycle number
  startedAt: 1699564900000,                 // ms timestamp
  durationMs: 45,                           // How long cycle took
  
  recommendationsEvaluated: 8,              // Total suggestions considered
  created: 3,                               // How many were created
  rejected: 5,                              // How many were rejected
  
  avgSynergyEval: 0.72,                     // Average synergy of all suggestions
  avgSynergyCreated: 0.82                   // Average synergy of created links
}
```

### Event Ring Buffer Entry

```js
{
  timestamp: 1699564902000,                 // ms when event occurred
  type: 'auto_link_created',                // Event type (see below)
  payload: {                                // Event-specific data
    linkId: 'link_123',
    fromNodeId: 'node_1',
    toNodeId: 'node_2',
    synergyScore: 0.87,
    fromCategory: 'input',
    toCategory: 'process'
  }
}
```

### Event Types

| Type | Payload | When |
|------|---------|------|
| `cycle_start` | `{ cycleIndex, startedAt }` | Automation cycle begins |
| `cycle_end` | `{ cycleIndex, durationMs, recommendations, created, rejected, avgSynergyEval, avgSynergyCreated }` | Automation cycle completes |
| `batch_scored` | `{ size, avgScore, maxScore }` | Recommendations are evaluated |
| `auto_link_created` | `{ linkId, fromNodeId, toNodeId, synergyScore, fromCategory, toCategory }` | Link created by automation |
| `auto_link_rejected` | `{ reason, synergyScore, fromCategory, toCategory }` | Suggestion rejected (reason: low_quality/duplicate/invalid/other) |
| `manual_link_created` | `{ fromNodeId, toNodeId, synergyScore }` | Player manually creates link |
| `config_changed` | `{ threshold, cooldown, enabled }` | Engine config modified |
| `engine_toggled` | `{ enabled, reason }` | Engine enabled/disabled |
| `engine_error` | `{ errorType, message }` | Error or exception occurred |

---

## Internal Methods

### Event Recording

```js
recordEvent(type, payload = {})
```
- Adds event to ring buffer (circular queue)
- **Complexity:** O(1), ~0.1ms
- **Ring buffer:** Automatically overwrites oldest when full (30 events max)
- **Index management:** Keeps track of insertion point for circular behavior

### Derived Metrics

#### `_calculateCyclesPerMinute()`
- Counts cycles in last 60 seconds
- Used to show automation activity rate
- Returns: 0–60 (cycles per minute)

#### `_calculateTrend()`
- Compares average synergy of recent cycles
- **Logic:** Split last N cycles in half, compare first vs second
- **Returns:** `'rising'` (>+0.05), `'falling'` (<-0.05), `'stable'` (else)
- **Minimum cycles:** 2 for meaningful result

#### `_calculateVolatility()`
- Calculates standard deviation of recent cycle synergy
- **Logic:** StdDev of last 5 cycles' avgSynergyCreated
- **Returns:** 
  - `'low'` if StdDev < 0.1 (stable quality)
  - `'medium'` if StdDev < 0.25
  - `'high'` if StdDev >= 0.25 (erratic quality)

#### `_calculateRecentAvgSynergy()`
- Running average of last 5 cycles
- Smooths out individual cycle noise
- **Returns:** 0.0–1.0

---

## Integration Points

### 1. Hook: `onCycleStart(meta)`
**When:** LinkAutomationEngine begins a cycle
**Call signature:**
```js
window.linkAutomationMonitor?.onCycleStart({
  cycleIndex: 1,           // Cycle number (0-indexed)
  startedAt: Date.now()    // Timestamp (optional)
});
```
**Effect:**
- Emits `cycle_start` event
- Logs cycle initiation for timing

### 2. Hook: `onCycleEnd(meta)`
**When:** LinkAutomationEngine completes a cycle
**Call signature:**
```js
window.linkAutomationMonitor?.onCycleEnd({
  cycleIndex: 1,
  durationMs: 45,
  recommendations: 8,      // Total suggestions evaluated
  created: 3,              // Links created
  rejected: 5,             // Links rejected
  avgSynergyEval: 0.72,
  avgSynergyCreated: 0.82
});
```
**Effect:**
- Appends cycle to history (keeps last 20)
- Increments `totalCycles`
- Updates `totalCycleDurationMs` and averages
- Emits `cycle_end` event
- Derives trend/volatility from this data

### 3. Hook: `onAutoLinkCreated(meta)`
**When:** A link is successfully created by automation
**Call signature:**
```js
window.linkAutomationMonitor?.onAutoLinkCreated({
  linkId: 'link_123',
  synergyScore: 0.87,
  fromCategory: 'input',
  toCategory: 'process'
});
```
**Effect:**
- Increments `totalAutoLinksCreated`
- Updates `bestSynergyCreated` if higher
- Updates running average of `avgSynergyCreated`
- Emits `auto_link_created` event

**Running Average Logic:**
```
new_avg = (old_avg × (count - 1) + new_score) / count
```

### 4. Hook: `onAutoLinkRejected(meta)`
**When:** A recommendation is rejected before creation
**Call signature:**
```js
window.linkAutomationMonitor?.onAutoLinkRejected({
  reason: 'low_quality',  // Reason for rejection
  synergyScore: 0.55,
  fromCategory: 'input',
  toCategory: 'process'
});
```
**Effect:**
- Increments appropriate rejection counter based on reason
- Emits `auto_link_rejected` event

---

## Statistics Generation

### `getStats()` — Complete Snapshot

**Flow:**
1. Validate initialization
2. Calculate derived metrics:
   - `acceptanceRate = created / (created + rejected) × 100`
   - `cyclesPerMinute` (from `_calculateCyclesPerMinute()`)
   - `trend` (from `_calculateTrend()`)
   - `volatility` (from `_calculateVolatility()`)
3. Format all numbers to fixed precision
4. Return comprehensive stats object

**Performance:** ~1ms for full calculation

### Dirty Checking (HUD Optimization)

The HUD uses `JSON.stringify()` to detect changes:
```js
const statsJson = JSON.stringify(stats);
if (statsJson === this._lastStatsJson) {
  return; // Skip DOM updates if unchanged
}
this._lastStatsJson = statsJson;
```

**Benefit:** Avoids DOM thrashing when stats don't change between frames

---

## Trend Analysis Algorithm

### Problem
How to detect if automation quality is improving or declining?

### Solution
**Compare halves of recent cycle window:**

```
Last 5 cycles: [C1, C2, C3, C4, C5]
                 ↑   ↑   ↑   ↑   ↑
                First half    Second half
                 (avg synergy)  (avg synergy)

If (second_avg - first_avg) > +0.05 → RISING (↑)
If (second_avg - first_avg) < -0.05 → FALLING (↓)
Else → STABLE (→)
```

**Why 0.05 threshold?**
- Small variations are noise (~5% change)
- Threshold of 0.05 filters out fluctuation
- Larger swings indicate real trend change

---

## Memory Layout

```
┌─────────────────────────────────────┐
│ LinkAutomationMonitor2_0 Singleton  │
├─────────────────────────────────────┤
│ _sessionStats                       │ ~4 KB
│ _cycleHistory (20 records)          │ ~6 KB
│ _eventRingBuffer (30 events)        │ ~40 KB
│ _config                             │ <1 KB
│ _systemReferences                   │ <1 KB
├─────────────────────────────────────┤
│ Total Baseline                      │ ~51 KB
└─────────────────────────────────────┘
```

**Per-event overhead:** ~1.3 KB (timestamp, type, payload)

---

## Performance Analysis

| Operation | Time | Complexity |
|-----------|------|-----------|
| `recordEvent()` | 0.1–0.2ms | O(1) |
| `onAutoLinkCreated()` | 0.2–0.3ms | O(1) |
| `getStats()` | 0.5–1.0ms | O(n) where n=cycle_history |
| `getRecentEvents()` | 0.1–0.2ms | O(n) where n=limit |
| HUD refresh (with dirty check) | 0.3–2ms | O(n) JSON stringify |

**Total per-frame overhead:** <0.5ms (negligible at 60 FPS)

---

## Null Safety

All public methods use safe navigation (`?.`):

```js
// Safe if window.linkAutomationMonitor is undefined
window.linkAutomationMonitor?.onCycleEnd({ ... })

// Returns gracefully if not initialized
const stats = window.linkAutomationMonitor?.getStats() || {}
```

**Guarantees:**
- No runtime errors if monitor not initialized
- Graceful fallback to empty data
- Console warnings for missing dependencies

---

## Configuration

### Default Config

```js
_config = {
  windowSizeMs: 300000,        // 5 minutes for sliding window
  trend_window_cycles: 5       // Compare last 5 cycles
}
```

### Customization

```js
window.linkAutomationMonitor.setConfig({
  windowSizeMs: 600000,        // Change to 10 minutes
  trend_window_cycles: 10      // More stable trend detection
});
```

---

## Debugging Workflow

### Step 1: Check Initialization
```js
window.linkAutomationMonitor.getStats()
// Should show: { initialized: true, ... }
```

### Step 2: Check Recent Events
```js
window.linkAutomationMonitor.debugPrintEvents()
// Shows: list of last 15 events
```

### Step 3: Check Cycles
```js
window.linkAutomationMonitor.debugPrintCycles()
// Shows: table of recent cycles with metrics
```

### Step 4: Full Summary
```js
window.linkAutomationMonitor.debugPrintSummary()
// Shows: formatted box with all key metrics
```

---

## Extension Points

### Add Custom Events
```js
window.linkAutomationMonitor.recordEvent('custom_event', {
  customData: 'value'
});
```

### Monitor Third-Party Links
```js
// If another system creates links:
window.linkAutomationMonitor.onManualLinkCreated({
  fromNodeId: 'node_1',
  toNodeId: 'node_2',
  synergyScore: 0.75
});
```

### Reset on Session Start
```js
window.linkAutomationMonitor.resetStats();
```

---

## Validation & Safety

### Event Validation
- All payload fields checked for null/undefined
- Numeric fields clamped to valid ranges
- String fields with fallback 'unknown'
- Ring buffer index wraps safely with modulo

### State Consistency
- Session stats never decrease (monotonic)
- Averages recalculated correctly after each event
- History trimmed to max size
- Event buffer is circular (no index overflow)

