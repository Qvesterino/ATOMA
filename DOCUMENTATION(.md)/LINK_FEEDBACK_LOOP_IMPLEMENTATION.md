# Link Quality Feedback Loop — Technical Implementation

Complete technical specification for all feedback loop systems.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     FEEDBACK LOOP SYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Input Layer (Observe Events)                                  │
│  ├─ NodeLinkingSystem (manual create/delete)                  │
│  └─ LinkAutomationEngine1_0 (automation create)                │
│                                                                 │
│  Processing Layer (Evaluate Outcomes)                          │
│  ├─ LinkQualityFeedbackLoop1_0 (collect & score)              │
│  ├─ ComputeSynergyScore2_0 (synergy queries)                  │
│  └─ LinkHistoryTracker1_0 (volatility, trends)                │
│                                                                 │
│  Learning Layer (Adapt Weights)                                │
│  ├─ LinkMLRecommendationEngine1_0 (boost/penalize)            │
│  └─ Weight adjustments per preset                              │
│                                                                 │
│  Analytics Layer (Display Metrics)                             │
│  ├─ UserAcceptanceTracker1_0 (acceptance rates)               │
│  └─ LinkFeedbackHUD1_0 (visual dashboard)                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. LinkQualityFeedbackLoop1_0

### State Management

**Internal Storage:**

```javascript
_linkMetadata: Map<linkId, {
  createdAt: timestamp,
  sourceNodeId: string,
  targetNodeId: string,
  categories: string[],
  createdByAutomation: boolean,
  createdManually: boolean,
  synergyAtCreation: number,
  synergyMeasurements: Array<{ timestamp, score }>,
  prediction: { quality, preset },
  removalEventTime: timestamp | null,
  removedByPlayer: boolean,
  autoRemoved: boolean,
}>

_pendingRecords: Array<LinkFeedbackRecord>  // Awaiting finalization
_completedRecords: Array<LinkFeedbackRecord>  // Ring buffer (max 1000)
```

### Lifecycle

```
onLinkCreated(event)
  ├─ Store metadata in _linkMetadata[linkId]
  ├─ Measure synergy immediately
  └─ Emit creation event

  (link exists)

onLinkRemoved(event)
  ├─ Update metadata with removal info
  ├─ Measure synergy one final time
  └─ Call _finalizeFeedback()

_finalizeFeedback(linkId, meta)
  ├─ Build LinkFeedbackRecord object
  ├─ Add to ring buffer _completedRecords
  └─ Add to pending _pendingRecords for ML

flushPending()
  ├─ Filter records ready for ML (>queryDelayMs old)
  ├─ Call LinkMLRecommendationEngine1_0.applyFeedback()
  ├─ Call UserAcceptanceTracker1_0.recordOutcome()
  └─ Remove from pending
```

### Outcome Scoring Formula

```
Base: outcome = BIAS

// Positive signals
if (lifetime > 60s):           outcome += 0.3
if (finalSynergy > 0.7):       outcome += 0.25
if (volatility < 0.2):         outcome += 0.2
if (isHighway):                outcome += 0.15
if (automation ∧ ¬removed):    outcome += 0.1

// Negative signals
if (removed quickly <15s):     outcome -= 0.35
if (automation ∧ removed):     outcome -= 0.2
if (synergyDrop > 0.4):        outcome -= 0.25
if (volatility > 0.5):         outcome -= 0.15

// Clamp
outcome = clamp(outcome, -1.0, +1.0)
```

### Weight Configuration

```javascript
_outcomeWeights: {
  longevityMultiplier: 0.3,
  higherSynergyAtEnd: 0.25,
  stableSynergy: 0.2,
  isPartOfHighway: 0.15,
  automationNotRemoved: 0.1,
  quicklyDeleted: -0.35,
  sharpSynergyDrop: -0.25,
  volatileSynergy: -0.15,
  automationRemovedByPlayer: -0.2,
  baseBiasPoor: -0.5,
  baseBiasGood: 0.2,
}
```

### Performance

- Per-creation: ~0.1ms
- Per-removal: ~0.5ms
- Per-flush: <1ms per record
- Memory per link: ~1KB (typical)

---

## 2. UserAcceptanceTracker1_0

### Metrics State

```javascript
_stats: {
  // Counts
  totalRecommendations: number,
  totalAutomationLinksCreated: number,
  totalAutomationLinksKept: number,
  totalAutomationLinksRemovedByPlayer: number,
  totalManualLinksCreated: number,
  manualLinksSimilarToRecommended: number,

  // Rates
  acceptanceRate: number,          // kept / created
  rejectionRate: number,           // removed / created
  avgOutcomeScore: number,

  // Per-category breakdown
  perCategoryStats: {
    [category]: {
      totalCreated: number,
      totalKept: number,
      totalRemoved: number,
      avgOutcomeScore: number,
      acceptanceRate: number,
    }
  }
}

_automationLinkTracker: Map<linkId, {
  linkId: string,
  createdAt: timestamp,
  createdByAutomation: true,
  predictedQuality: number,
  categories: string[],
  preset: string,
  removedByPlayer: boolean,
  removedAt: timestamp | null,
  outcome: number | null,
}>
```

### Recording Flow

```
recordAutomationLinkCreated(linkId, meta)
  ├─ Increment totalAutomationLinksCreated
  ├─ Create tracker entry
  └─ Record event

recordAutomationLinkRemovedByPlayer(linkId)
  ├─ Increment totalAutomationLinksRemovedByPlayer
  ├─ Mark tracker as removed
  └─ Update acceptance rate

recordOutcome(feedbackRecord)
  ├─ Store outcome in tracker
  ├─ Update per-category stats
  └─ Recalculate all rates
```

### Calculations

**Acceptance Rate:**
```
acceptanceRate = totalAutomationLinksKept / totalAutomationLinksCreated
```

**Per-Category:**
```
perCategory[cat].acceptanceRate = kept[cat] / created[cat]
perCategory[cat].avgOutcomeScore = mean(outcomes for cat)
```

### Performance

- Per-event: <0.5ms
- Per-calculation: <0.1ms
- Memory per link: ~200 bytes

---

## 3. LinkMLRecommendationEngine1_0 (Learning Extension)

### Learning State

```javascript
_learningState: {
  enabled: true,
  learningRate: 0.05,              // Adjustment magnitude

  // Per-preset weight deltas
  presetDeltas: {
    balanced: { key: delta, ... },
    history_heavy: { ... },
    structure_first: { ... },
  },

  feedbackCount: number,           // Total processed
  lastUpdateTime: timestamp,
  weightLowerBound: 0.01,
  weightUpperBound: 1.0,
}
```

### Learning Algorithm

```
applyFeedback(feedbackRecord):
  1. Only learn from automation-created links
  2. Only learn if prediction exists

  3. Map outcome (-1 to +1) → quality (0 to 1)
     normalizedOutcome = (outcomeScore + 1) / 2

  4. Compute prediction error
     predictionError = normalizedOutcome - predictedQuality

  5. Classify result
     if outcome > 0.3 && |error| > 0.2:
       → Call _boostWeightsForSuccess()
     else if outcome < 0.3 && predictedQuality > 0.7:
       → Call _penalizeWeightsForFailure()

  6. Increment feedbackCount
```

### Weight Adjustment

**Boost on Success:**
```
for each weight w:
  delta = lr * 0.02
  w_new = w + delta * w           // Proportional adjustment
  w_clamped = clamp(w_new)

// Extra boosts
if synergy > 0.7:    synergyWeight += lr * 0.05
if highway:          highwayRouteBonus += lr * 0.05
```

**Penalize on Failure:**
```
for each weight w:
  delta = -lr * 0.02              // Negative adjustment
  w_new = w + delta * w
  w_clamped = clamp(w_new)

// Extra penalizations
if volatile:         synergyWeight -= lr * 0.05
if automation_fail:  automationHealth -= lr * 0.03
```

### Safety

```javascript
_clampWeight(value):
  return max(0.01, min(1.0, value))
```

Prevents:
- Weights collapsing to zero (0.01 minimum)
- Weights exploding (1.0 maximum)
- Unstable oscillation

### Performance

- Per-feedback: <0.5ms
- Per-batch: <0.5ms per record
- Clamping: <0.01ms per weight

---

## 4. LinkFeedbackHUD1_0

### Visual Components

```
┌─────────────────────────────────────┐
│ ⚡ Link Quality Feedback            │
├─────────────────────────────────────┤
│ Acceptance Rate: 82%                │
│ [████████░░] 82%                   │
│                                     │
│ Avg Outcome: +0.45                 │
│ [███░░░░░░] +0.45                  │
│                                     │
│ ML Learning: ● Learning             │
│ Feedback processed: 127              │
│                                     │
│ Recent Events:                       │
│ 🤖 node-1→node-2      +0.62         │
│ 👤 node-3→node-4      +0.15         │
│ 🤖 node-5→node-6      -0.48         │
└─────────────────────────────────────┘
```

### DOM Structure

```html
<div id="link-feedback-hud">
  <!-- Title -->
  <div>⚡ Link Quality Feedback</div>

  <!-- Acceptance Rate -->
  <div>
    <span>Acceptance Rate:</span>
    <span id="feedback-acceptance">–</span>
    <div id="feedback-acceptance-bar">
      <div id="feedback-acceptance-bar-fill"></div>
    </div>
  </div>

  <!-- Avg Outcome -->
  <div>
    <span>Avg Outcome:</span>
    <span id="feedback-outcome">–</span>
    <div id="feedback-outcome-bar">
      <div id="feedback-outcome-bar-fill"></div>
    </div>
  </div>

  <!-- ML State -->
  <div id="feedback-ml-state">●</div>
  <div id="feedback-ml-count">Feedback processed: 0</div>

  <!-- Event Log -->
  <div id="feedback-event-log">
    <!-- Last 5 events -->
  </div>
</div>
```

### Styling

```css
Background: rgba(10, 15, 30, 0.92) + blur
Border: 1.5px solid #00ff88
Color: #00ff88 (main), #ffff00 (acceptance), #88ffff (outcome)
Position: bottom-right (configurable)
Z-index: 9998
Font: Monaco 11px
```

### Refresh Logic

```
refresh():
  ├─ Get stats from LinkQualityFeedbackLoop1_0
  ├─ Get stats from UserAcceptanceTracker1_0
  ├─ Get learning state from LinkMLRecommendationEngine1_0
  ├─ Update acceptance rate bar
  ├─ Update outcome score bar
  ├─ Update ML state indicator
  ├─ Update event log (last 5 events)
  └─ Update all text elements
```

### Performance

- Per-refresh: ~1ms
- Per-update: <0.5ms
- DOM reflows: Minimal (dirty checking)

---

## 5. Data Model: LinkFeedbackRecord

```typescript
interface LinkFeedbackRecord {
  // Identification
  linkId: string;
  sourceNodeId: string;
  targetNodeId: string;
  categories: string[];

  // Predictions (optional)
  predictedQuality: number | null;      // 0–1 or null if no ML prediction

  // Synergy Measurements
  synergyAtCreation: number | null;
  synergyAfterDelay: number | null;     // After queryDelayMs
  averageLifetimeSynergy: number | null;

  // Lifecycle
  createdByAutomation: boolean;
  createdManually: boolean;
  removedByPlayer: boolean;
  autoRemoved: boolean;
  lifetimeMs: number;

  // Outcome
  outcomeScore: number;                 // -1.0 to +1.0

  // Metadata
  timestamp: number;                    // When record was finalized
  tags: {
    highway: boolean;
    unstable: boolean;
    shortLived: boolean;
    automationFailure: boolean;
    highSynergy: boolean;
  };
}
```

---

## 6. Integration Points Summary

| System | Hook | Data Sent | Purpose |
|--------|------|-----------|---------|
| NodeLinkingSystem | createLink() | {linkId, nodeIds, categories, manual=true} | Track player links |
| NodeLinkingSystem | deleteLink() | {linkId, removedByPlayer=true} | Record player removal |
| LinkAutomationEngine1_0 | _createLink() | {linkId, predictedQuality, automation=true} | Track automation links |
| ComputeSynergyScore2_0 | (on demand) | getAllLinkScores() | Query synergy at decision points |
| LinkHistoryTracker1_0 | (on demand) | getStats(linkId) | Query volatility & trends |
| LinkMLRecommendationEngine1_0 | flush() | feedbackRecord | Apply feedback for learning |
| UserAcceptanceTracker1_0 | flush() | feedbackRecord | Update acceptance metrics |
| LinkFeedbackHUD1_0 | refresh() | getStats() | Display metrics |

---

## 7. Event Flow Sequence

### Manual Link Creation & Removal

```
T=0s:   Player clicks 2 nodes
        → NodeLinkingSystem.createLink()
        → LinkQualityFeedbackLoop1_0.onLinkCreated({
            linkId, sourceNodeId, targetNodeId,
            createdManually: true
          })
        → Measure synergy immediately
        → Store in _linkMetadata

T=0-45s: Link exists, synergy tracked

T=45s:  Player right-clicks to delete
        → NodeLinkingSystem.deleteLink()
        → LinkQualityFeedbackLoop1_0.onLinkRemoved({
            linkId,
            removedByPlayer: true
          })
        → Final synergy measurement
        → Compute outcomeScore (+0.6)
        → Add to _completedRecords

T=46s:  flushPending() called
        → No action (no ML prediction for manual link)
        → UserAcceptanceTracker1_0.recordOutcome() (optional)
```

### Automation Link Creation & User Keeps It

```
T=0s:   ML engine recommends link (quality 0.85)
        → LinkAutomationEngine1_0.createLink()
        → LinkQualityFeedbackLoop1_0.registerPrediction({
            quality: 0.85, preset: 'balanced'
          })
        → LinkQualityFeedbackLoop1_0.onLinkCreated({
            linkId, automation: true
          })
        → UserAcceptanceTracker1_0.recordAutomationLinkCreated({
            predictedQuality: 0.85
          })

T=0-120s: Link stays (user accepts)

T=120s: flushPending() called (>30s delay)
        → Compute outcomeScore (+0.82, survived long, kept)
        → LinkMLRecommendationEngine1_0.applyFeedback()
          • outcome +0.82 vs prediction 0.85 → good
          • Boost synergyWeight, highwayRouteBonus
        → UserAcceptanceTracker1_0.recordOutcome()
          • Mark as kept
          • Update acceptance rate (↑)
```

### Automation Link Removed Quickly

```
T=0s:   ML recommends link (quality 0.72)
        → Similar initialization as above

T=5s:   Player deletes it
        → LinkQualityFeedbackLoop1_0.onLinkRemoved({
            linkId, removedByPlayer: true
          })
        → UserAcceptanceTracker1_0.recordAutomationLinkRemovedByPlayer()

T=6s:   flushPending() called
        → Compute outcomeScore (-0.65, quickly deleted)
        → LinkMLRecommendationEngine1_0.applyFeedback()
          • outcome -0.65 vs prediction 0.72 → bad
          • Penalize synergyWeight, automationHealth
        → UserAcceptanceTracker1_0.recordOutcome()
          • Mark as removed
          • Update acceptance rate (↓)
```

---

## 8. Performance Characteristics

### Per-Operation Timing

| Operation | Time | Notes |
|-----------|------|-------|
| onLinkCreated() | ~0.1ms | Immediate |
| onLinkRemoved() | ~0.5ms | Includes synergy query |
| registerPrediction() | <0.1ms | Simple assignment |
| _finalizeFeedback() | ~1ms | Outcome scoring + storage |
| flushPending() | ~0.5ms/record | ML learning included |
| HUD refresh() | ~1–2ms | DOM updates, rate-limited |

### Memory Usage

| Item | Size | Typical Count | Total |
|------|------|---------------|-------|
| Per link metadata | ~1KB | 100–500 | 100–500KB |
| Per feedback record | ~400B | 1000 (ring buffer) | ~400KB |
| Per HUD state | ~50B | 1 | ~50B |
| ML weight deltas | ~1KB | 3 presets | ~3KB |
| **Total (active)** | — | — | **~500–900KB** |

### Scaling

- **Per-frame overhead:** <1% of 60fps budget
- **Memory scalable:** Ring buffers prevent unbounded growth
- **Safe degradation:** Graceful fallback if systems missing

---

## 9. Configuration Reference

```javascript
// LinkQualityFeedbackLoop1_0
{
  maxFeedbackRecords: 1000,       // Ring buffer size
  queryDelayMs: 30000,             // Wait time before finalizing
  flushIntervalMs: 5000,           // Flush frequency (not used internally)
  enableLogging: false,
}

// UserAcceptanceTracker1_0
{
  maxRecords: 500,                // Event history size
  enableLogging: false,
}

// LinkFeedbackHUD1_0
{
  updateIntervalMs: 1000,         // Refresh frequency
  maxEventLog: 5,                 // Events to show
  position: 'bottom-right',       // Screen location
  opacity: 0.92,
  enabled: true,
}

// LinkMLRecommendationEngine1_0 learning
{
  enabled: true,
  learningRate: 0.05,             // Adjustment magnitude
  weightLowerBound: 0.01,
  weightUpperBound: 1.0,
}
```

---

## 10. Error Handling

All systems use safe optional chaining:

```javascript
// Safe: No crash if system missing
window.LinkQualityFeedbackLoop1_0?.onLinkCreated?.({...})

// Graceful failure
try {
  // Operation
} catch (e) {
  console.error('[Module] Error:', e);
  // Continue without this system
}
```

No exceptions propagate to main game loop.

---

Done! Complete technical specification.
