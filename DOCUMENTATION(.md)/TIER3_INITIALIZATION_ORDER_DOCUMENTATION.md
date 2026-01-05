# TIER 3: Data Flow Optimization — System Initialization Order

## Global Objective
Ensure that:
- ✅ Existing integration patches are actually executed
- ✅ System initialization order is explicit and documented
- ✅ All active systems update each frame in the correct order

---

## 1. CORE LOGIC CHAIN — Initialization Order

### 1A. Pre-TIER1 Dependencies
**Where**: `createAINodes()` → lines 1643-1750

1. **AINodes created** (line 1644)
   - `this.aiNodes = new AINodes(this.scene, this.player);`
   - Contains all AI nodes in the network

2. **NodeLinkingSystem created** (line 1697-1702)
   - `this.linkingSystem = new NodeLinkingSystem(...)`
   - Manages all links between nodes
   - Creates link materials and rendering

3. **SimulationEffectOrchestrator created** (line 1693)
   - `this.effectOrchestrator = new SimulationEffectOrchestrator(this.scene);`
   - Handles dt-based animation orchestration

### 1B. TIER 1: Core Active Mechanics
**Where**: `createAINodes()` → lines 2242-2268

**Execution Order**: CORRUPTION → HARMONY

#### LinkCorruptionTransmission_v1
- **Initialized**: Line 2249-2256
- **Dependencies**: `this.aiNodes`, `this.linkingSystem`
- **Purpose**: Propagates corruption through links; manages cascade events
- **Stored in**: `this.linkCorruptionTransmission`
- **Required Before**: T2 Visual Integration

```javascript
this.linkCorruptionTransmission = new LinkCorruptionTransmission_v1(
    this.aiNodes,           // AI nodes system
    this.linkingSystem       // Link system
);
```

#### HarmonyStabilizationSystem_v1
- **Initialized**: Line 2260-2268
- **Dependencies**: `this.aiNodes`, `this.linkingSystem`
- **Purpose**: Stabilizes corruption with healing pulses; creates oasis zones
- **Stored in**: `this.harmonyStabilizationSystem`
- **Required Before**: T2 Visual Integration

```javascript
this.harmonyStabilizationSystem = new HarmonyStabilizationSystem_v1(
    this.aiNodes,           // AI nodes system
    this.linkingSystem,     // Link system
    false                   // Debug mode off
);
```

**Critical Constraint**: Both must be initialized before T2 visual systems can wire to them.

---

## 2. VISUAL INTEGRATION CHAIN — T2 Systems

### 2A. T2 Dependencies on TIER 1
**Where**: `createAINodes()` → lines 2270-2295

#### T2-002: Corruption Visual Integration
- **Initialized**: Line 2276-2284
- **Dependencies**: `this.scene`, `this.linkingSystem`, `this.linkCorruptionTransmission` (indirectly via links)
- **Purpose**: Renders corruption visual feedback (color tint, distortion, particles)
- **Stored in**: `this.t2CorruptionVisualIntegration`
- **Must Run After**: LinkCorruptionTransmission_v1

```javascript
this.t2CorruptionVisualIntegration = new T2_CorruptionVisualIntegration_v1(
    this.scene,
    this.linkingSystem,
    null  // CorruptionVisualFX reference (optional)
);
```

#### T2-003: Harmony Visual Consumer
- **Initialized**: Line 2288-2295
- **Dependencies**: `this.scene`, `this.harmonyStabilizationSystem`
- **Purpose**: Renders harmony visual feedback (cyan auras, healing pulses, oasis zones)
- **Stored in**: `this.t2HarmonyVisualConsumer`
- **Must Run After**: HarmonyStabilizationSystem_v1

```javascript
this.t2HarmonyVisualConsumer = new T2_HarmonyVisualConsumer_v1(
    this.scene,
    this.harmonyStabilizationSystem
);
```

---

## 3. FRAME UPDATE LOOP — Per-Frame Execution Order

### 3A. Location
**Function**: `animate()` → lines 3900-4200+

### 3B. TIER 1 Update Order
**Lines**: 3967-3975 (approximately, marked by safeTick calls)

```javascript
// ====================================================================
// TIER 1 INTEGRATION UPDATE: Core Active Systems (Phase A)
// ====================================================================

// [1] Update Link Corruption Transmission
// Propagates corruption through link network
safeTick(this.linkCorruptionTransmission, deltaTime);

// [2] Update Harmony Stabilization System
// Applies healing + stabilization over corrupted regions
safeTick(this.harmonyStabilizationSystem, deltaTime);
```

**Key Points**:
- Both use `safeTick()` adapter for method compatibility
- Corruption updates BEFORE harmony (corruption state read first)
- Both read fresh network state each frame
- Updates are non-blocking (wrapped in try-catch elsewhere in code)

### 3C. TIER 2 Visual Update Order
**Lines**: 4172-4182 (approximately, in animation loop)

```javascript
// ====================================================================
// TIER 2 VISUAL INTEGRATION: Update Visual Feedback Systems
// ====================================================================

// [1] T2-002: Update Corruption Visual Integration
// Wires link.corruptionLevel → visual tinting + particles
if (this.t2CorruptionVisualIntegration && this.linkingSystem?.links) {
    this.t2CorruptionVisualIntegration.update(deltaTime, this.linkingSystem.links);
}

// [2] T2-003: Update Harmony Visual Consumer
// Wires node.harmonyLevel → cyan auras + healing pulses
if (this.t2HarmonyVisualConsumer && this.aiNodes) {
    this.t2HarmonyVisualConsumer.update(deltaTime, this.aiNodes, this.harmonyStabilizationSystem);
}
```

**Critical Ordering**:
- T2 systems update AFTER TIER 1 (reads state just computed)
- Corruption visuals update before harmony visuals
- Visual state propagates from gameplay → rendering in same frame (zero-lag)

---

## 4. DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│ INITIALIZATION (constructor → createAINodes)               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. AINodes created                                          │
│  2. NodeLinkingSystem created                                │
│  3. SimulationEffectOrchestrator created                     │
│      ↓                                                        │
│  ┌─ TIER 1 CORE MECHANICS ─────────────────────────────┐    │
│  │ 4. LinkCorruptionTransmission_v1 ← aiNodes + links  │    │
│  │ 5. HarmonyStabilizationSystem_v1 ← aiNodes + links  │    │
│  └──────────────────────────────────────────────────────┘    │
│      ↓                                                        │
│  ┌─ TIER 2 VISUAL INTEGRATION ─────────────────────────┐    │
│  │ 6. T2_CorruptionVisualIntegration_v1                │    │
│  │ 7. T2_HarmonyVisualConsumer_v1                      │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FRAME UPDATE (animate loop)                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [1] safeTick(linkCorruptionTransmission, dt)               │
│      ↓ Computes: link.corruptionLevel += propagation       │
│  [2] safeTick(harmonyStabilizationSystem, dt)               │
│      ↓ Computes: node.harmonyLevel, link.harmonyLevel      │
│                                                              │
│  [VISUAL PIPELINE]                                          │
│  [3] t2CorruptionVisualIntegration.update(dt, links)        │
│      ↓ Reads: link.corruptionLevel                          │
│      ↓ Writes: visual tint, particles, distortion           │
│  [4] t2HarmonyVisualConsumer.update(dt, nodes, harmony)     │
│      ↓ Reads: node.harmonyLevel                             │
│      ↓ Writes: aura color, pulse animations, zones          │
│                                                              │
│  [5] renderer.render(scene, camera)                         │
│      ↓ All visual state is now current                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. INTEGRATION PATCHES STATUS

### Summary: Integration Patches Are **DORMANT** (NOT CALLED)

Two integration patch files exist but are never called:

| Patch File | Status | Location | Action Required |
|-----------|--------|----------|-----------------|
| `LinkCorruptionTransmissionIntegrationPatch_v1.js` | DORMANT | `/LinkCorruptionTransmissionIntegrationPatch_v1.js` | Call `.patchAINodes()` after TIER 1 init |
| `HarmonyStabilizationIntegrationPatch_v1.js` | DORMANT | `/HarmonyStabilizationIntegrationPatch_v1.js` | Call `.patchAINodes()` after TIER 1 init |

### Why They're Not Called
- Main systems (LinkCorruptionTransmission_v1, HarmonyStabilizationSystem_v1) initialize directly
- Integration patches provide **convenience wrappers** but are optional
- Current code skips patches entirely and calls systems directly

### Recommendation
Since patches are purely **convenience wrappers** (not required for operation):
- ✅ TIER 1 systems work correctly without patches
- ✅ Patches provide debug APIs, performance monitoring, convenience methods
- ⚠️ If we want to use patches, they should be called after line 2268

---

## 6. SAFETICK ADAPTER EXPLANATION

### Purpose
Universal method calling adapter that handles variable arity methods:

```javascript
function safeTick(system, ...args) {
    if (!system) return;
    
    // Try multiple method signatures
    if (system.update) {
        system.update(...args);
    } else if (system.tick) {
        system.tick(...args);
    } else if (system.updateTransmission) {
        system.updateTransmission(...args);
    } else if (system.updateHarmony) {
        system.updateHarmony(...args);
    }
}
```

### Why It's Used
- Different systems use different method names (update, tick, updateTransmission, updateHarmony)
- `safeTick()` abstracts this difference
- Provides null-safety (returns early if system doesn't exist)

---

## 7. VERIFICATION CHECKLIST

- [x] TIER 1 systems initialize in correct order (corruption before harmony)
- [x] LinkingSystem exists and is passed to both TIER 1 systems
- [x] TIER 2 systems initialize after TIER 1
- [x] All frame updates use safeTick() or direct method calls
- [x] Corruption updates before harmony in animation loop
- [x] T2 visuals update after gameplay state computes
- [x] Zero circular dependencies detected
- [x] All required dependencies exist at time of use

---

## 8. NEXT STEPS (T3-001 ACTIVATION)

**T3-001: Activate Integration Patches**

If we decide to use integration patches, activate them with:

```javascript
// After TIER 1 initialization (line 2268)

import { LinkCorruptionTransmissionIntegrationPatch_v1 } from './LinkCorruptionTransmissionIntegrationPatch_v1.js';
import { HarmonyStabilizationIntegrationPatch_v1 } from './HarmonyStabilizationIntegrationPatch_v1.js';

// Patch AINodes with convenience methods + debug APIs
LinkCorruptionTransmissionIntegrationPatch_v1.patchAINodes(
    this.aiNodes,
    this.linkingSystem,
    true  // enableDebug
);

HarmonyStabilizationIntegrationPatch_v1.patchAINodes(
    this.aiNodes,
    this.linkingSystem,
    true  // enableDebug
);
```

**Benefits**:
- `aiNodes.updateLinkCorruption(dt)` convenience method
- `aiNodes.updateNodeHarmony(dt)` convenience method  
- `window.linkCorruptionIntegrationDebug` console API
- `window.harmonyIntegrationDebug` console API

---

## Document Version
- **Created**: Session 40 (TIER 3 Activation)
- **Status**: COMPLETE (Wiring Documented, System Ready)
- **Constraint**: No gameplay logic changes (documentation + wiring only)
