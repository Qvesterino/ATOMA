# SOAK TEST LOGGING v1.0 — Integration Guide

## Overview
Pure logging system for observing network behavior during 10-15 minute soak test runs. 
No gameplay changes. No UI. No tuning.

## Quick Start (2 steps)

### Step 1: Import
```javascript
import { SoakTestLogging } from './SoakTestLogging_v1.js';
```

### Step 2: Initialize & integrate
```javascript
// In your main.js setup (after aiNodes is created):
const soakLogging = new SoakTestLogging(aiNodes);

// In your main game loop (call once per frame):
soakLogging.update(deltaTime);
```

## Feature Flags

```javascript
// Enable logging
window.ENABLE_SOAK_LOGGING = true;

// Set logging interval (seconds, default 5)
window.SOAK_LOG_INTERVAL = 5.0;

// Disable logging
window.ENABLE_SOAK_LOGGING = false;
```

When disabled: zero behavior changes, zero logging output.

## Console Debug API

```javascript
// Enable logging
SOAK_DEBUG.enable();

// Disable logging
SOAK_DEBUG.disable();

// Set interval to 3 seconds
SOAK_DEBUG.setInterval(3);

// Manually trigger a snapshot
SOAK_DEBUG.snapshot();

// Print current status
SOAK_DEBUG.status();

// Export buffer as JSON
SOAK_DEBUG.export();

// Clear buffer and reset
SOAK_DEBUG.clear();

// Get raw buffer
SOAK_DEBUG.getBuffer();
```

## Metrics Logged (per category)

Each log entry contains:
- **time**: Elapsed time since session start (MM:SS format)
- **category**: Node category (input, process, storage, etc.)
- **avgFatigue**: Average fatigue (0-1)
- **avgHarmony**: Average harmony (0-100)
- **avgCorruption**: Average corruption (0-1)
- **avgSynergy**: Average synergy (0-100)
- **avgInstability**: Average instability (0-100)
- **avgLoadRatio**: Average load ratio (0-1, current/max links)
- **nodeCount**: Number of nodes in category

## Data Sources (Read-Only)

```javascript
node.userData.fatigue              // Tier 5: fatigue value
node.userData.harmony             // Base system
node.userData.corruption          // Base system
node.userData.synergy             // Base system
node.userData.instability         // Base system
node.userData.currentLinks        // Link count
node.userData.maxLinks            // Max link capacity
node.userData.category            // Category name
```

## Output Format

### Console Output
```
🔍 SOAK-LOG [0:05]:
(Table with aggregated metrics by category)
   Buffer: 1 snapshots, ~0.5KB
```

### Buffer Export (JSON)
```json
[
  {
    "timestamp": "0:05",
    "timestampMs": 1234567890,
    "data": [
      {
        "time": "0:05",
        "category": "input",
        "avgFatigue": 0.1234,
        "avgHarmony": 75.5,
        "avgCorruption": 0.2,
        ...
      },
      ...
    ]
  }
]
```

## Common Workflows

### Workflow 1: Monitor Live
```javascript
// Enable logging with 5-second interval
SOAK_DEBUG.enable();
SOAK_DEBUG.setInterval(5);

// Watch console.table output appear every 5 seconds
// Run network for 10-15 minutes
```

### Workflow 2: High-Frequency Capture
```javascript
// For detailed observation
SOAK_DEBUG.setInterval(1);  // Log every second
// Run for shorter duration (e.g., 3 minutes)
// Export and analyze
```

### Workflow 3: Manual Snapshots
```javascript
// For specific moments
SOAK_DEBUG.disable();  // Disable automatic logging

// Perform specific actions...
SOAK_DEBUG.snapshot();  // Capture moment 1

// Do more things...
SOAK_DEBUG.snapshot();  // Capture moment 2

// Export when done
SOAK_DEBUG.export();
```

### Workflow 4: Export & Analyze
```javascript
// After soak run:
SOAK_DEBUG.status();  // Print statistics
SOAK_DEBUG.export();  // Print JSON to console

// Copy JSON, paste into file or analysis tool
const json = JSON.stringify(SOAK_DEBUG.getBuffer(), null, 2);
// Use for plotting/comparison
```

## Integration Checklist

- [ ] Import SoakTestLogging in main.js
- [ ] Initialize with `new SoakTestLogging(aiNodes)`
- [ ] Call `soakLogging.update(deltaTime)` in game loop
- [ ] Test flags: `ENABLE_SOAK_LOGGING = true/false`
- [ ] Test console API: `SOAK_DEBUG.enable()`, `.status()`, etc.
- [ ] Verify logging disabled by default (disabled in production)
- [ ] Run 10-15 minute soak test
- [ ] Export logs at end of session

## Performance

- **Update cost**: < 0.1ms per frame when logging disabled
- **When logging**: ~0.5ms per snapshot (every 5 seconds = ~0.1ms avg)
- **Memory**: ~0.5-1KB per snapshot
- **Zero allocations**: In main loop (all pre-allocated)

## Validation Checklist

- [ ] Logging runs every ~5 seconds (when enabled)
- [ ] Categories aggregated correctly (no per-node spam)
- [ ] Disable flag fully stops logging
- [ ] No performance regression
- [ ] No gameplay behavior changes
- [ ] Buffer exports valid JSON
- [ ] Status command shows correct stats

## Troubleshooting

**Issue**: Logging not appearing in console
- Check: `window.ENABLE_SOAK_LOGGING === true`
- Check: Interval time passed (default 5 seconds)
- Check: AINodes has nodes: `SOAK_DEBUG.status()`

**Issue**: Buffer grows too large
- Solution: Set longer interval: `SOAK_DEBUG.setInterval(10)`
- Solution: Clear periodically: `SOAK_DEBUG.clear()`

**Issue**: Export shows empty array
- Check: Run soak test for at least one interval period
- Check: `SOAK_DEBUG.snapshot()` to force capture

## Next Steps

1. ✅ Add import to main.js
2. ✅ Initialize and add update() call
3. ✅ Test with `SOAK_DEBUG.enable()`
4. ✅ Run 10-15 minute soak test
5. ✅ Export logs with `SOAK_DEBUG.export()`
6. ✅ Analyze metrics per category

## File

- `/SoakTestLogging_v1.js` (240 lines)
- Integration: 2 lines (import + init) + 1 line (update call)

**Status**: ✅ Ready for integration

