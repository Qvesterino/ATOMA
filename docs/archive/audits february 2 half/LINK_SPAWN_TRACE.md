# LINK-SPAWN-TRACE Documentation

**Phase: LINK-SPAWN-TRACE**

Goal: Find what system triggers node spawn/rebuild after a link is created.

---

## Summary

The system that triggers node spawn after link creation is:

### Primary Trigger: `onLinkCreated()` in AINodes.js

**File:** `AINodes.js`  
**Line:** ~2420 (in method `onLinkCreated`)  
**System Type:** Event-based spawn system (link creation event)

```javascript
onLinkCreated() {
  const currentTime = Date.now();
  if (currentTime - this.spawningConfig.lastLinkTime > this.spawningConfig.linkSpawnCooldown) {
    // Occasionally spawn node on link creation (20% chance)
    if (Math.random() < 0.2) {
      this.spawnNode(this.getRuntimeSpawnCategoryIntent());
      this.spawningConfig.lastLinkTime = currentTime;
    }
  }
}
```

**Behavior:**
- Called by `NodeLinkingSystem` after a link is finalized
- 20% chance to spawn a new node when a link is created
- 5-second cooldown between link-based spawns
- Uses `getRuntimeSpawnCategoryIntent()` to select category uniformly

---

## Full Call Chain

### Link Creation → Spawn Flow:

```
1. User creates link (click-to-link system)
   ↓
2. NodeLinkingSystem.createLink() or createLinkLegacy()
   ↓
3. [LINK-SPAWN-TRACE] Debug instrumentation fires:
   console.warn('[LINK] link finalized', {...})
   ↓
4. Link creation complete
   ↓
5. NodeLinkingSystem calls aiNodes.onLinkCreated()
   ↓
6. [LINK-SPAWN-TRACE] Debug instrumentation fires:
   console.warn('[LINK-SPAWN] onLinkCreated called (link -> spawn trigger)', {...})
   ↓
7. 20% random check passes
   ↓
8. AINodes.spawnNode() called
   ↓
9. [LINK-SPAWN-TRACE] Debug instrumentation fires:
   console.warn('[LINK-SPAWN] spawnNode called', {...})
   ↓
10. New node created and added to scene
```

---

## All Spawn Systems Identified

### 1. Event-Based Spawning (LINK → SPAWN)

**File:** `AINodes.js`  
**Method:** `onLinkCreated()`  
**Type:** Event-driven  
**Trigger:** Link creation event from `NodeLinkingSystem`

**Configuration:**
- Spawn chance: 20% per link
- Cooldown: 5000ms (5 seconds) between link spawns
- Category selection: Uniform (via `getRuntimeSpawnCategoryIntent()`)

---

### 2. Time-Based Spawning

**File:** `AINodes.js`  
**Method:** `updateSpawning(currentTime)`  
**Type:** Scheduled/Automated  
**Trigger:** Called from `main.js` game loop

**Configuration:**
- Interval: 20-40 seconds (random)
- Category selection: Uniform (via `getRuntimeSpawnCategoryIntent()`)

**Callers:**
- `main.js` - Game loop
- `_AmbientEntityManager.js` - Ambient entity manager

---

### 3. AI Growth/Density Spawning

**File:** `AINodes.js`  
**Method:** `checkNetworkDensityAndSpawn()`  
**Type:** AI growth monitoring  
**Trigger:** Periodic check every 10 seconds

**Behavior:**
- Monitors network density
- Spawns in underutilized areas (50% chance)
- Spawns in regular areas (50% chance)
- 10% chance to spawn rare node (sigma/quantum/emotional)

**Configuration:**
- Check interval: 10,000ms
- Max nodes target: 50
- Spawn threshold: 70% of max (spawn if below 35 nodes)

---

## Manual Spawn Systems (Debug/Console)

### SpawnAuthorityConsoleAPI.js

**File:** `SpawnAuthorityConsoleAPI.js`  
**Type:** Console API  
**Purpose:** Developer-controlled manual spawning

**Methods:**
- `spawnNode(cat, pos)` - Spawn node at position
- Rare and Mythic creation handlers

---

### _MythicNodeCreation.js

**File:** `_MythicNodeCreation.js`  
**Type:** Special archetype creation  
**Purpose:** Ceremonial mythic node spawning

---

### _RareNodeSpawner.js

**File:** `_RareNodeSpawner.js`  
**Type:** Rare event spawning  
**Purpose:** Bootstrap rare node types

---

### EXTREME_AI_NODES_CODE_PATCHES.js

**File:** `EXTREME_AI_NODES_CODE_PATCHES.js`  
**Type:** Extreme archetype spawning  
**Purpose:** EXTREME node manual spawning

---

## Debug Instrumentation

To enable trace logging:

```javascript
// Enable debug flag
window.ATOMA_DEBUG_LINK_SPAWN = true;
```

**Output Log Messages:**

1. Link Finalization:
   ```
   [LINK] link finalized { source: '...', target: '...', stack: ... }
   ```

2. Link → Spawn Trigger:
   ```
   [LINK-SPAWN] onLinkCreated called (link -> spawn trigger) {
     currentTime: ...,
     lastLinkTime: ...,
     linkSpawnCooldown: 5000,
     canSpawn: true/false,
     stack: ...
   }
   ```

3. Spawn Node Called:
   ```
   [LINK-SPAWN] spawnNode called {
     category: '...',
     position: {x, y, z},
     stack: ...
   }
   ```

4. Create Node Called:
   ```
   [LINK-SPAWN] createNode called {
     category: '...',
     position: {x, y, z},
     options: {...},
     stack: ...
   }
   ```

5. Update Spawning Called:
   ```
   [LINK-SPAWN] updateSpawning called {
     currentTime: ...,
     stack: ...
   }
   ```

6. Check Network Density Called:
   ```
   [LINK-SPAWN] checkNetworkDensityAndSpawn called {
     currentNodeCount: ...,
     stack: ...
   }
   ```

---

## System Classification

| System | File | Method | Type | Trigger |
|---------|-------|---------|-------|----------|
| Link-based spawn | AINodes.js | onLinkCreated() | Event (link creation) |
| Time-based spawn | AINodes.js | updateSpawning() | Timer (20-40s) |
| Density spawn | AINodes.js | checkNetworkDensityAndSpawn() | AI growth (10s check) |
| Manual console spawn | SpawnAuthorityConsoleAPI.js | spawnNode() | Console command |
| Mythic spawn | _MythicNodeCreation.js | createMythicNode() | Special event |
| Rare spawn | _RareNodeSpawner.js | spawnRareNode() | Bootstrap |
| Extreme spawn | EXTREME_AI_NODES_CODE_PATCHES.js | - | Manual/API |

---

## Key Findings

1. **Primary Trigger System:** The `onLinkCreated()` method in AINodes.js is the ONLY system that spawns nodes in response to link creation events.

2. **Call Flow:** 
   - NodeLinkingSystem → calls → `aiNodes.onLinkCreated()` → triggers → `spawnNode()`

3. **Probability-Based:** Not deterministic - only 20% chance per link (subject to cooldown)

4. **Independent Systems:** Time-based and density-based spawning operate independently of link events.

5. **Debug-Only:** All instrumentation is gated by `window.ATOMA_DEBUG_LINK_SPAWN` flag - no behavior changes when disabled.

---

## Constraints Met

✅ Debug only - all instrumentation gated by debug flag  
✅ No behavior changes - only console logging  
✅ Complete trace coverage - spawnNode, createNode, updateSpawning, checkNetworkDensityAndSpawn, onLinkCreated, link finalization  
✅ System classification - identified all spawn systems and their types