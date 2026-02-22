# ATOMA Spawn Timing Guard

## Overview

The Spawn Timing Guard is a **dev-only runtime guard** that detects unauthorized writes to `spawningConfig.nextTimeSpawn` outside the authorized `updateSpawning()` method.

This enforces the single-authority pattern where `updateSpawning()` is the ONLY method allowed to modify spawn timing.

## How It Works

1. **Guard Activation**: When `initializeNodeSpawning()` runs, it wraps `spawningConfig.nextTimeSpawn` with a property interceptor using `Object.defineProperty()`
2. **Token System**: A write-allow token (`allowWriteToken`) controls whether writes are permitted
3. **Authorized Writes**: `updateSpawning()` sets the token to `true` before writing, then immediately sets it to `false` after
4. **Unauthorized Writes**: Any code outside `updateSpawning()` that attempts to write will trigger a console error with full stack trace

## Enabling the Guard

The guard is **disabled by default** in production. To enable it:

```javascript
// Enable dev guards BEFORE initializing AINodes
window.ATOMA_DEV_GUARDS = true;

// Then initialize as normal
const aiNodes = new AINodes(scene, player, variantEngine);
```

## What Gets Detected

When enabled, the guard will detect and log:

- **Unauthorized writes** from any code path outside `updateSpawning()`
- **Stack trace** showing exactly where the illegal write originated
- **Value attempted** to help debug the issue

Example output:

```
[SPAWN_TIMING_GUARD] Unauthorized write to spawningConfig.nextTimeSpawn
Stack trace: Error: [SPAWN_TIMING_GUARD] Unauthorized write to spawningConfig.nextTimeSpawn
    at Object.set (AINodes.js:2670)
    at someOtherFunction (otherFile.js:123)
    ...
Value attempted: 1234567890
This property should ONLY be written by updateSpawning()
```

## Authorized Write Locations

The following writes to `nextTimeSpawn` are explicitly allowed:

### 1. Initial Seed Delay (First Spawn)
```javascript
// AINodes.js: ~line 3650
if (this.spawningConfig.seedDelayMs !== undefined && this._runtimeSpawnIndex === 0) {
  // ALLOWED WRITE
  if (this.__spawnTimingGuard) this.__spawnTimingGuard.setAllowWriteToken(true);
  this.spawningConfig.nextTimeSpawn = Date.now() + this.spawningConfig.seedDelayMs;
  if (this.__spawnTimingGuard) this.__spawnTimingGuard.setAllowWriteToken(false);
}
```

### 2. Re-arm After Batch Creation
```javascript
// AINodes.js: ~line 3658
if (this.spawningConfig.needsRearm) {
  const ms = 2000;
  // ALLOWED WRITE
  if (this.__spawnTimingGuard) this.__spawnTimingGuard.setAllowWriteToken(true);
  this.spawningConfig.nextTimeSpawn = Date.now() + ms;
  if (this.__spawnTimingGuard) this.__spawnTimingGuard.setAllowWriteToken(false);
}
```

### 3. Post-Spawn Rescheduling
```javascript
// AINodes.js: ~line 3690, 3698, 3706
if (spawned) {
  this._runtimeSpawnIndex = (this._runtimeSpawnIndex || 0) + 1;
  const ms = getRampIntervalMs(this._runtimeSpawnIndex);
  if (ms != null) {
    // ALLOWED WRITE (ramp interval)
    if (this.__spawnTimingGuard) this.__spawnTimingGuard.setAllowWriteToken(true);
    this.spawningConfig.nextTimeSpawn = Date.now() + ms;
    if (this.__spawnTimingGuard) this.__spawnTimingGuard.setAllowWriteToken(false);
    return;
  }
  // ALLOWED WRITE (normal interval)
  if (this.__spawnTimingGuard) this.__spawnTimingGuard.setAllowWriteToken(true);
  this.spawningConfig.nextTimeSpawn = currentTime + this.getRandomSpawnInterval();
  if (this.__spawnTimingGuard) this.__spawnTimingGuard.setAllowWriteToken(false);
} else {
  // ALLOWED WRITE (spawn failed - retry)
  if (this.__spawnTimingGuard) this.__spawnTimingGuard.setAllowWriteToken(true);
  this.spawningConfig.nextTimeSpawn = currentTime + this.getRandomSpawnInterval();
  if (this.__spawnTimingGuard) this.__spawnTimingGuard.setAllowWriteToken(false);
}
```

## Production Behavior

- **Zero performance impact**: Guard code only executes when `window.ATOMA_DEV_GUARDS === true`
- **No behavior change**: When disabled, `nextTimeSpawn` works as a normal property
- **Safe for all environments**: No runtime errors if flag not set

## Debugging Tips

### If You Get Unauthorized Write Warnings

1. **Check the stack trace** to find the source of the illegal write
2. **Review the code path** - should it be scheduling spawns?
3. **If valid**: Refactor to use the proper `updateSpawning()` mechanism
4. **If legacy**: Consider whether the code is still needed

### Common Anti-Patterns

```javascript
// ❌ WRONG: Direct write from event handler
onSomeEvent() {
  this.spawningConfig.nextTimeSpawn = Date.now() + 5000; // ILLEGAL!
}

// ❌ WRONG: Write from timer callback
setInterval(() => {
  this.spawningConfig.nextTimeSpawn = Date.now() + 3000; // ILLEGAL!
}, 3000);

// ✅ CORRECT: Let updateSpawning() handle timing
// Set state flags instead of manipulating nextTimeSpawn directly
onSomeEvent() {
  this.spawningConfig.needsRearm = true; // Flag for updateSpawning()
}
```

## Implementation Details

### Guard Function (Lines 2638-2670)

```javascript
const guardNextTimeSpawn = (configObj) => {
  if (!DEV_GUARDS_ENABLED) return;
  
  const rawNextTimeSpawn = Date.now() + 5000;
  
  Object.defineProperty(configObj, 'nextTimeSpawn', {
    get: () => rawNextTimeSpawn,
    set: (value) => {
      if (!allowWriteToken) {
        // Unauthorized write detected!
        const error = new Error('[SPAWN_TIMING_GUARD] Unauthorized write to spawningConfig.nextTimeSpawn');
        console.error(error.message);
        console.error('Stack trace:', error.stack);
        console.error('Value attempted:', value);
        console.error('This property should ONLY be written by updateSpawning()');
      } else {
        // Authorized write - allow it
        rawNextTimeSpawn = Date.now() + value;
      }
    },
    enumerable: true,
    configurable: true
  });
  
  configObj._rawNextTimeSpawn = rawNextTimeSpawn;
};
```

### Token Setter (Lines 2672-2675)

```javascript
this.__spawnTimingGuard = {
  setAllowWriteToken: (value) => { allowWriteToken = value; }
};
```

## Testing

To test the guard works:

```javascript
// 1. Enable guards
window.ATOMA_DEV_GUARDS = true;

// 2. Initialize system
const aiNodes = new AINodes(scene, player);
aiNodes.initializeNodeSpawning();

// 3. Attempt illegal write
aiNodes.spawningConfig.nextTimeSpawn = Date.now() + 5000;
// → Should show error: "[SPAWN_TIMING_GUARD] Unauthorized write..."

// 4. Legal write via updateSpawning should work fine
aiNodes.updateSpawning(Date.now());
// → Should complete without warnings
```

## Related Files

- `AINodes.js` - Contains guard implementation and authorized write locations
- `docs/contracts/Atoma.spawn.contract.md` - Spawn authority contract
- `ShaderFreezeGuard.js` - Similar pattern for material freeze protection

## Version History

- **v1.0** (2026-02-22): Initial implementation
  - Token-based write protection
  - Stack trace logging
  - Dev-only flag gating
  - Zero production overhead