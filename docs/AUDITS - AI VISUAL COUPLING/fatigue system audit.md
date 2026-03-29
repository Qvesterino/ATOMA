# AUDIT REPORT: Fatigue Systems

## 📋 OVERVIEW

Two fatigue-related systems found:
1. **NetworkFatigueSystem_v0.js** - Long-term network dynamics (gameplay-affecting, now active)
2. **SynapticFatigueAdapter_v1.js** - Visual-only fatigue effects

---

## 1️⃣ NetworkFatigueSystem_v0.js

### ✅ FILE STATUS
- **Path**: `NetworkFatigueSystem_v0.js`
- **Type**: Gameplay system (affects metrics)
- **Version**: v0 (early/experimental)

### 📖 PURPOSE
Long-term network dynamics layer that:
- Accumulates fatigue based on stress (load, instability, corruption, low harmony)
- Recovers fatigue when conditions are healthy
- Modulates harmony/synergy/corruption decay rates
- Category-based sensitivity (INPUT nodes burn out fastest)

### 📥 READS
```javascript
node.userData.metrics.loadRatio
node.userData.metrics.instability
node.userData.metrics.corruption
node.userData.metrics.harmony
node.userData.category
```

### ✍️ WRITES
```javascript
node.userData.fatigue (0-1) - Main fatigue value
```

### 🔗 INITIALIZATION
**✅ ACTIVE**
- Instantiated in `main.js` during startup
- Exposed as `window.networkFatigue` and `window.ATOMA_NETWORK_FATIGUE`
- Console API available at `window.ATOMA_DEBUG.NetworkFatigue`

### 🔄 UPDATE LOOP
**✅ ACTIVE**
- Registered in FrameScheduler at `simulation.networkFatigueSystem`
- Calls `fatigue.update(deltaTime)` every frame
- System now writes live fatigue into `node.userData.fatigue`

### 👥 CONSUMPTION
**MetricsRuntime_v1.js** (fallback reader):
```javascript
// Reads from NetworkFatigueSystem if available
const fatigue = node.userData.fatigue ?? 0.0;
const networkFatigue = typeof metrics.networkFatigue === 'number' 
  ? metrics.networkFatigue 
  : fatigue; // Falls back to fatigue
```

### 📊 CONSOLE API
Exposes `window.ATOMA_DEBUG.NetworkFatigue` (if activated):
- `seedFatigue(nodeIndex, value)` - Set fatigue for testing
- `printDiagnostics()` - Show all nodes
- `runStressTest(duration)` - Controlled stress test
- `diagnose(nodeIndex)` - Single node diagnostics

### ⚡ STATUS
**✅ ACTIVE / WIRED**
- Fully implemented and now integrated
- Reads canonical node metrics and writes live fatigue back to nodes
- Canonical fatigue is now available to downstream consumers through MetricsRuntime_v1

---

## 2️⃣ SynapticFatigueAdapter_v1.js

### ✅ FILE STATUS
- **Path**: `SynapticFatigueAdapter_v1.js`
- **Type**: Visual-only system (NO gameplay effects)
- **Version**: v1 (production)

### 📖 PURPOSE
Visual narrative layer that:
- Tracks synaptic fatigue from gating activity and pulse density
- Applies visual effects (halo dulling, phase shift, flicker, glow reduction)
- Recovers slowly with non-linear easing
- Trigger relief pulses during recovery

**Key distinction**: PURELY VISUAL, never affects gameplay

### 📥 READS
```javascript
node.userData.metrics.harmony
node.userData.corruption (or node.userData.corruption)
node.userData.instability
node.userData.isHub
nodeGateMap (from SynapticGatingAdapter) - gateStrength per node
```

### ✍️ WRITES
```javascript
node.userData.synapticFatigue (0-1) - Fatigue value
node.userData.synapticFatigueLevel ('none'/'low'/'medium'/'high')
node.userData.synapticIsRecovering (boolean)
```

### 🔗 INITIALIZATION
**✅ ACTIVE**
- Instantiated in `main.js` via `setupSynapticFatigueIntegration(this)`
- Stores as `this.synapticFatigueAdapter`

### 🔄 UPDATE LOOP
**✅ ACTIVE**
- Registered in FrameScheduler at `'simulation.synapticFatigueAdapter'`
- Called every frame with:
  - `this.aiNodes.nodes`
  - `this.synapticGatingAdapter?.nodeGateMap`
  - `deltaTime`
  - `currentTime`
- **Workload capping**: Processes max 120 nodes per tick (cyclic)

### 👥 CONSUMPTION
**Active consumers:**
1. **ParticleSemanticDensityAdapter_Session121.js** (line 185)
   ```javascript
   const fatigue = link.userData.synapticFatigue;
   const fatigueUrgency = Math.max(0, (fatigue - 0.5) * 2);
   ```

2. **SynapticConflictAdaptiveResolution_Session117.js**
   ```javascript
   const h1Fatigue = this.hub1.userData?.synapticFatigue ?? 0.0;
   const h2Fatigue = this.hub2.userData?.synapticFatigue ?? 0.0;
   ```

### 🎨 VISUAL EFFECTS
Provides visual modulation via `getVisualModulation(nodeId)`:
- `haloDullFactor` - Reduces halo intensity
- `phaseShift` - Phase lag in animations
- `flickerAmount` - Subtle flicker (high fatigue only)
- `glowReduction` - Reduces glow brightness
- `reliefPulseActive/Intensity` - Recovery feedback

### 📊 CONSOLE API
Exposes `window.synapticFatigue`:
- `enable()` / `disable()` - Toggle system
- `setDebugMode(bool)` - Debug logging
- `setAccumulationRate(0-1)` - Fatigue build speed
- `setDecayRate(0-1)` - Recovery speed
- `setHarmonyRecoveryBoost(0-2)` - Harmony multiplier
- `getStatus()` - System status
- `help()` - Help text

### ⚡ STATUS
**✅ ACTIVE AND FUNCTIONAL**

---

## 📊 COMPARISON TABLE

| Aspect | NetworkFatigueSystem_v0 | SynapticFatigueAdapter_v1 |
|--------|------------------------|--------------------------|
| **Status** | ✅ ACTIVE | ✅ ACTIVE |
| **Initialized** | ✅ Yes | ✅ Yes |
| **Update Loop** | ✅ FrameScheduler | ✅ FrameScheduler |
| **Scope** | Gameplay + Metrics | Visual only |
| **Reads** | metrics (load, instability, corruption, harmony, category) | metrics (harmony, corruption, instability, isHub), nodeGateMap |
| **Writes** | `userData.fatigue` | `userData.synapticFatigue`, `synapticFatigueLevel`, `synapticIsRecovering` |
| **Consumption** | MetricsRuntime (fallback) | ParticleSemanticDensity, SynapticConflictAdaptive |
| **Console API** | ATOMA_DEBUG.NetworkFatigue (inactive) | synapticFatigue (active) |
| **Performance** | N/A (not running) | Workload capping (120 nodes/tick) |
| **Purpose** | Long-term network dynamics | Visual narrative layer |

---

## 🔍 KEY FINDINGS

### NetworkFatigueSystem_v0.js
✅ **Good**:
- Well-documented with clear design principles
- Comprehensive console API for testing
- Category-based sensitivity system
- Proper stress threshold logic

⚠️ **Issues**:
- Reads loadRatio/loadPressure canonically now that the runtime writer is active
- Stress normalization was corrected to 0..1 scaling

### SynapticFatigueAdapter_v1.js
✅ **Good**:
- Fully integrated and active
- Performance-conscious (workload capping)
- Clean visual-only separation
- Good console API for debugging
- Multiple active consumers

⚠️ **Issues**:
- None significant - system is working as designed

---

## 📝 RECOMMENDATIONS

### For NetworkFatigueSystem_v0.js
1. **Decide fate**: Either activate OR archive
2. **To activate**:
   - Instantiate in `main.js`
   - Connect to FrameScheduler (10Hz simulation lane)
   - Wire up to existing metrics
   - Test multipliers on harmony/synergy systems
3. **To archive**:
   - Move to `LEGACY/` folder
   - Update docs to mark as experimental/unused

### For SynapticFatigueAdapter_v1.js
1. **No changes needed** - system is healthy
2. Optional: Consider exposing `getVisualModulation()` to more visual systems if needed

---

## 🎯 SUMMARY

- **NetworkFatigueSystem_v0**: Well-implemented gameplay fatigue system, but completely dormant. Exists in codebase but never activated. Needs decision: integrate or archive.

- **SynapticFatigueAdapter_v1**: Fully functional visual fatigue system. Active, integrated, and consumed by multiple systems. No issues found.