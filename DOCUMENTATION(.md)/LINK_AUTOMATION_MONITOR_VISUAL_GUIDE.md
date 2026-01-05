# LinkAutomationMonitor2_0 — Visual Integration Guide

**Diagrams and visual references for understanding the system.**

---

## System Architecture Diagram

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                      ATOMA Node System                      ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                              ┃
┃  ┌─────────────────────────────────────────────────────┐   ┃
┃  │        NodeLinkingSystem                            │   ┃
┃  │  (creates/manages links between nodes)             │   ┃
┃  │  • createLink(nodeA, nodeB)                        │   ┃
┃  │  • removeLink(link)                                │   ┃
┃  └───────────────────┬─────────────────────────────────┘   ┃
┃                      │                                       ┃
┃                      │ creates                              ┃
┃                      ▼                                       ┃
┃  ┌─────────────────────────────────────────────────────┐   ┃
┃  │     LinkAutomationEngine1_0                        │   ┃
┃  │  (decides which links to auto-create)             │   ┃
┃  │  • autoLinkFor(node)                              │   ┃
┃  │  • preview(node)                                  │   ┃
┃  └───────────────────┬─────────────────────────────────┘   ┃
┃                      │                                       ┃
┃                      │ uses                                  ┃
┃                      ▼                                       ┃
┃  ┌─────────────────────────────────────────────────────┐   ┃
┃  │    LinkRecommendationAI1_0                        │   ┃
┃  │  (generates link suggestions)                     │   ┃
┃  │  • updateRecommendations(node)                   │   ┃
┃  │  • getTopSuggestions()                           │   ┃
┃  └─────────────────────────────────────────────────────┘   ┃
┃                                                              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                              │
                              │ hooks
                              ▼
         ╔════════════════════════════════════╗
         ║  LinkAutomationMonitor2_0 (NEW)   ║  ← Observability Layer
         ║                                   ║
         ║  Event Recording API:             ║
         ║  • onCycleStart()                ║
         ║  • onCycleEnd()                  ║
         ║  • onAutoLinkCreated()           ║
         ║  • onAutoLinkRejected()          ║
         ║  • onManualLinkCreated()         ║
         ║  • onConfigChanged()             ║
         ║  • onEngineToggled()             ║
         ║  • onEngineError()               ║
         ║                                   ║
         ║  Data Storage:                    ║
         ║  • _sessionStats                 ║
         ║  • _cycleHistory (20)            ║
         ║  • _eventRingBuffer (30)         ║
         ║                                   ║
         ║  Query API:                       ║
         ║  • getStats()                    ║
         ║  • getCycleHistory()             ║
         ║  • getRecentEvents()             ║
         ║  • debugPrintSummary()           ║
         ╚════════════════╬═══════════════════╝
                          │
                          │ getStats()
                          ▼
      ╔════════════════════════════════════════╗
      ║  LinkAutomationMonitorHUD2_0 (NEW)    ║
      ║                                        ║
      ║  ⚙️ AUTOMATION MONITOR                ║
      ║  ════════════════════════════════      ║
      ║                                        ║
      ║  📊 TOP RECOMMENDATIONS               ║
      ║     Best: input → integration          ║
      ║     Synergy: 0.87 [EXCELLENT]         ║
      ║                                        ║
      ║  ⚡ ENGINE STATUS                     ║
      ║     Status: ENABLED                   ║
      ║     Threshold: 0.65                   ║
      ║     Cooldown: 500ms                   ║
      ║     Last Exec: 42ms                   ║
      ║                                        ║
      ║  📈 STATISTICS                        ║
      ║     Recommendations: 96               ║
      ║     Auto Links: 24                    ║
      ║     Accept Rate: 25.0%                ║
      ║     Avg Synergy: 0.781                ║
      ║                                        ║
      ║  Trend: 📈 | Volatility: LOW          ║
      ║                                        ║
      ║  (Refreshes every 500ms)              ║
      ╚════════════════════════════════════════╝
         (Displayed in bottom-left corner)
```

---

## Event Flow Diagram

```
LinkAutomationEngine.autoLinkFor(node)
│
├─ [START] ─→ onCycleStart({ cycleIndex, startedAt })
│            │ Records: 'cycle_start' event
│            └─ Updates: cycle tracking
│
├─ [EVALUATE] ─→ Get recommendations
│                │
│                ├─→ For each recommendation:
│                │
│                │  ┌─ CHECK QUALITY ─→ Too low?
│                │  │                    YES ─→ onAutoLinkRejected({ reason: 'low_quality' })
│                │  │
│                │  ├─ CHECK DUPLICATE ─→ Already exists?
│                │  │                      YES ─→ onAutoLinkRejected({ reason: 'duplicate' })
│                │  │
│                │  └─ CREATE LINK ─→ Success?
│                │                    YES ─→ onAutoLinkCreated({ linkId, synergyScore })
│                │                    NO  ─→ onAutoLinkRejected({ reason: 'error' })
│
└─ [END] ─→ onCycleEnd({ 
              cycleIndex,
              durationMs,
              recommendations,
              created,
              rejected,
              avgSynergyEval,
              avgSynergyCreated
            })
           │ Records: 'cycle_end' event
           │ Updates: session stats
           │ Appends: cycle to history
           └─ Calculates: trend, volatility
```

---

## Data Flow: Event to Display

```
Event Recorded          Data Aggregation         Query API            HUD Display
━━━━━━━━━━━━━━          ════════════════         ═════════            ════════════

onCycleEnd()
│
└─ recordEvent('cycle_end', {...})
   │
   └─ _eventRingBuffer[index] = event
      _cycleHistory.push(cycleData)
      _sessionStats.totalCycles++
      _sessionStats.totalCycleDurationMs += durationMs
      
                        ↓
                    
                    _calculateTrend()
                    _calculateVolatility()
                    _calculateCyclesPerMinute()
                    
                        ↓
                    
                    getStats() ──→ { totalCycles, trend, volatility, ... }
                    
                        ↓
                    
                    HUD.refresh()
                    │
                    └─ Update "STATISTICS" section
                       Update "Trend Indicator"
                       Update engine status
```

---

## Integration Points: Where to Add Hooks

```
main.js
────────────────────────────────────────────
│ LOCATION A: Import + Init (Add ~15 lines)
│
│ import { LinkAutomationMonitor2_0 } from './LinkAutomationMonitor2_0.js'
│ import { LinkAutomationMonitorHUD2_0, setupAutomationMonitorHUD } 
│   from './LinkAutomationMonitorHUD2_0.js'
│
│ window.linkAutomationMonitor.init({ ... })
│ setupAutomationMonitorHUD('#hud-monitor')
│
└─────────────────────────────────────────────


LinkAutomationEngine1_0.js
────────────────────────────────────────────
│ LOCATION B: enable() method
│ window.linkAutomationMonitor?.onEngineToggled({ enabled: true })
│
│ LOCATION C: disable() method
│ window.linkAutomationMonitor?.onEngineToggled({ enabled: false })
│
│ LOCATION D: autoLinkFor() start
│ window.linkAutomationMonitor?.onCycleStart({ cycleIndex, startedAt })
│
│ LOCATION E: autoLinkFor() end
│ window.linkAutomationMonitor?.onCycleEnd({ durationMs, created, rejected, ... })
│
│ LOCATION F: Link creation success
│ window.linkAutomationMonitor?.onAutoLinkCreated({ linkId, synergyScore, ... })
│
└─────────────────────────────────────────────


NodeLinkingSystem.js
────────────────────────────────────────────
│ LOCATION G: createLink() (manual)
│ if (!isAutomatic) {
│   window.linkAutomationMonitor?.onManualLinkCreated({ synergyScore, ... })
│ }
│
└─────────────────────────────────────────────


LinkRecommendationAI1_0.js (Optional)
────────────────────────────────────────────
│ LOCATION H: After batch scoring
│ window.linkAutomationMonitor?.onRecommendationEvaluated({ size, avgScore, ... })
│
└─────────────────────────────────────────────


SafeWorldReset
────────────────────────────────────────────
│ LOCATION I: On world transition
│ window.linkAutomationMonitor?.onWorldReset()
│
└─────────────────────────────────────────────
```

---

## Statistics Calculation Pipeline

```
Raw Data                  Aggregation                  Display
────────────             ──────────────               ────────

onAutoLinkCreated called
│
├─ _sessionStats.totalAutoLinksCreated++      getStats() called
├─ Update bestSynergyCreated if higher        │
└─ Update avgSynergyCreated (running avg)     │
                                               │
   [REPEAT for each link]                      │
                                               │
   ↓                                           ↓
   
   _sessionStats = {
     totalCycles: 12,
     totalAutoLinksCreated: 24,
     avgSynergyCreated: 0.781,
     bestSynergyCreated: 0.95,
     ...
   }
   
   ↓                                           ↓
   
   Derived calculations:
   
   totalRejected = (lowQuality + duplicate + invalid + other)
   totalEvaluated = created + rejected
   acceptanceRate = (created / totalEvaluated) × 100
   
   ─→ 24 / (24 + 72) × 100 = 25.0%
   
   cyclesPerMinute = count(cycles in last 60s)
   
   trend = compare first half vs second half of cycles
   volatility = stdDev of recent cycle synergy
   
   ↓                                           ↓
   
   → stats = {
       totalCycles: 12,
       totalAutoLinksCreated: 24,
       acceptanceRate: "25.0",
       avgSynergyCreated: "0.781",
       trend: "rising",
       volatility: "low",
       ...
     }
   
   ↓                                           ↓
   
   HUD.refresh() pulls stats via getStats()
   │
   └─ Updates DOM:
      "Acceptance: 25.0% │ Avg Synergy: 0.781"
      "Trend: 📈 | Volatility: LOW"
```

---

## HUD Panel Layout

```
╔════════════════════════════════════════════════════════════╗
║  ⚙️ AUTOMATION MONITOR                                    ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  📊 TOP RECOMMENDATIONS                                   ║
║  ╔─────────────────────────────────────────────────────╗  ║
║  │ Best: input → integration (synergy 0.87)            │  ║
║  │ Status: [EXCELLENT]                                 │  ║
║  └─────────────────────────────────────────────────────┘  ║
║                                                            ║
║  ⚡ ENGINE STATUS                                         ║
║  ╔─────────────────────────────────────────────────────╗  ║
║  │ Status: ENABLED  [green]                            │  ║
║  │ Threshold: 0.65                                     │  ║
║  │ Cooldown: 500ms                                     │  ║
║  │ Last Exec: 42ms                                     │  ║
║  └─────────────────────────────────────────────────────┘  ║
║                                                            ║
║  📈 STATISTICS                                            ║
║  ╔─────────────────────────────────────────────────────╗  ║
║  │ Recommendations: 96  │  Auto Links: 24              │  ║
║  │ Manual Links: 3      │  Accept Rate: 25.0%          │  ║
║  │ Avg Synergy: 0.781   │  Best: 0.95                  │  ║
║  │ Cycles/min: 12.0     │  Errors: 0                   │  ║
║  └─────────────────────────────────────────────────────┘  ║
║                                                            ║
║  Trend: 📈 (Rising)      |      Volatility: LOW          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

---

## Trend Detection Algorithm

```
Last 5 Cycles Data:
Cycle 1: avgSynergy = 0.65
Cycle 2: avgSynergy = 0.70
Cycle 3: avgSynergy = 0.72
Cycle 4: avgSynergy = 0.78
Cycle 5: avgSynergy = 0.80

Split in half:
├─ First half (C1-C2):  avg = (0.65 + 0.70) / 2 = 0.675
└─ Second half (C3-C5): avg = (0.72 + 0.78 + 0.80) / 3 = 0.767

Compare:
Δ = 0.767 - 0.675 = 0.092

Evaluate:
┌─ If Δ > +0.05  → RISING ↑ 📈  (quality improving)
├─ If Δ < -0.05  → FALLING ↓ 📉 (quality declining)
└─ Else          → STABLE → →   (quality steady)

Result: 0.092 > 0.05 → RISING ✓
```

---

## Performance Profile

```
Operation                          Time      Memory    Impact
═════════════════════════════════════════════════════════════════

recordEvent()                        0.1ms    0.5 KB   Minimal
onAutoLinkCreated()                  0.2ms    0.3 KB   Minimal
onCycleEnd()                         0.3ms    1.0 KB   Minimal

Calculations:
  _calculateTrend()                  0.1ms     -       During getStats
  _calculateVolatility()             0.1ms     -       During getStats
  _calculateCyclesPerMinute()        0.1ms     -       During getStats

getStats() (full)                    1.0ms     -       Query time
HUD.refresh() (with dirty-check)     2.0ms     -       Every 500ms

Total per 60fps frame:              <0.5ms     -       Negligible
═════════════════════════════════════════════════════════════════

Memory Baseline:     ~50 KB
Per 100 events:      +130 KB
Ring buffer (30):    ~40 KB
History (20):        ~6 KB
Session stats:       ~4 KB
```

---

## State Transitions Diagram

```
UNINITIALIZED
│
└─ init()
   │
   └─ INITIALIZED (ready to record events)
      │
      ├─ onCycleStart()
      │  │
      │  ├─ onAutoLinkCreated() → Stats increment ✓
      │  │
      │  ├─ onAutoLinkRejected() → Rejection counters increment
      │  │
      │  └─ onCycleEnd()
      │     │
      │     └─ Update _sessionStats
      │     └─ Append to _cycleHistory
      │     └─ Derive trend/volatility
      │     └─ Ready for next cycle
      │
      ├─ getStats()
      │  │
      │  └─ Calculate derived metrics
      │  └─ Format for display
      │  └─ Return snapshot
      │
      ├─ HUD.refresh()
      │  │
      │  └─ Call getStats()
      │  └─ Check if changed (dirty)
      │  └─ Update DOM if needed
      │
      └─ onWorldReset()
         │
         └─ Clear history (keep session stats)
         └─ Reset event buffer
         └─ Ready for new world
```

---

## Integration Effort Matrix

```
System                    File                      Hooks    LOC
─────────────────────────────────────────────────────────────────
main.js                                              2        15
LinkAutomationEngine      LinkAutomationEngine1_0    4        30
NodeLinkingSystem         NodeLinkingSystem.js       1         5
RecommendationAI          LinkRecommendationAI1_0    1         5  (opt)
WorldReset                SafeWorldReset*.js         1         1
─────────────────────────────────────────────────────────────────
TOTAL                                                9        56
```

**Average time per hook:** ~2 minutes
**Total integration time:** 15–20 minutes

---

## Console Debug Commands

```javascript
// 1. Check full stats
const stats = window.linkAutomationMonitor.getStats()
console.log(stats)
// Output: { initialized: true, totalCycles: 12, totalAutoLinksCreated: 24, ... }

// 2. Print summary
window.linkAutomationMonitor.debugPrintSummary()
// Output: Formatted ASCII box with key metrics

// 3. Show recent cycles
window.linkAutomationMonitor.debugPrintCycles()
// Output: Table of recent cycles with metrics

// 4. List recent events
window.linkAutomationMonitor.debugPrintEvents()
// Output: Timestamped list of last 15 events

// 5. Get cycle history
const cycles = window.linkAutomationMonitor.getCycleHistory(5)
// Output: [ { cycleIndex, durationMs, created, rejected, ... }, ... ]

// 6. Get recent events
const events = window.linkAutomationMonitor.getRecentEvents(10)
// Output: [ { timestamp, type, payload }, ... ]
```

---

## Success Indicators

After integration, you should see:

✅ **HUD appears** in bottom-left corner with neon cyan border
✅ **Title reads** "⚙️ AUTOMATION MONITOR"
✅ **Top Recommendations** shows best automation suggestion
✅ **Engine Status** shows ENABLED/DISABLED + config
✅ **Statistics** grid populates with live numbers
✅ **Trend indicator** shows (↑ ↓ →) after 5+ cycles
✅ **Console API works** - `debugPrintSummary()` prints box
✅ **Stats increment** when automation creates links
✅ **No errors** in browser console
✅ **HUD updates** every 500ms with fresh data

