# Memory 2026-03-08 — FrameScheduler No-Op Cleanup

## Task
Remove systems registered in FrameScheduler that perform no runtime work.

## Systems Removed (5)

### 1. visual.linkSparkSystems
- **Layer:** visual (30 Hz)
- **Issue:** Empty registration - LinkRendererConduit now handles spark updates
- **Action:** Removed registration, NOT the linkSparkSystems Map or spark system instances
- **Lines removed:**
  ```javascript
  // [DEPRECATED] LinkSparkSystem update is now handled by LinkRendererConduit
  // Sparks are updated inside NodeLinkingSystem.conduitRenderer.update()
  this.frameScheduler.register('visual', (dt) => {
      // Empty - kept for backward compatibility reference
  }, 'visual.linkSparkSystems');
  ```

### 2. test-camera
- **Layer:** realtime (60 Hz)
- **Issue:** Empty test/example placeholder
- **Action:** Removed from registerTestSystems()
- **Lines removed:** Entire registration block

### 3. test-visuals
- **Layer:** visual (30 Hz)
- **Issue:** Empty test/example placeholder
- **Action:** Removed from registerTestSystems()
- **Lines removed:** Entire registration block

### 4. test-ai
- **Layer:** simulation (10 Hz)
- **Issue:** Empty test/example placeholder
- **Action:** Removed from registerTestSystems()
- **Lines removed:** Entire registration block

### 5. test-narrative
- **Layer:** background (2 Hz)
- **Issue:** Empty test/example placeholder
- **Action:** Removed from registerTestSystems()
- **Lines removed:** Entire registration block

## Verification

**Before cleanup:**
- Total registrations: 95
- No-op systems: 5
- Active systems: 90

**After cleanup:**
- Total registrations: 90
- No-op systems: 0
- Active systems: 90

## What Was NOT Modified

- ❌ No files deleted
- ❌ No runtime logic modified
- ❌ No LinkRendererConduit modifications
- ❌ linkSparkSystems Map still exists (stores individual LinkSparkSystem instances)
- ❌ LinkSparkSystem class still works (instantiated per link)
- ❌ registerTestSystems() method still exists (simplified to log message)

## Change Classification

**Class A - Safe Surgery**
- Removes 5 no-op registrations
- No behavior change
- No visual change
- No gameplay change
- Reduces scheduler overhead by 5 tick calls

## Impact

- Cleaner FrameScheduler registration list
- Reduced unnecessary tick execution (5 fewer systems per frame)
- Better code clarity (no deprecated/placeholder registrations)
- Zero functional impact
