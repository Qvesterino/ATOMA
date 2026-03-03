# AUDIT: Active Policies, Freeze Modes, Visual Locks, Flags, Wrappers & Debug Features

## 1. ATOMA_FLAGS (Global Flag System - main.js)

### Debug Flags
**Location**: `main.js` lines ~60-100
**Status**: **ACTIVE**

```javascript
window.ATOMA_FLAGS = {
  debug: {
    logLevel: 'error',              // Console output gate
    enabled: false,                   // Master debug switch
    frame: false,                    // Frame timing debug
    shader: false,                   // Shader debug
    link: false,                     // Link system debug
    world: false,                    // World switch debug
    cadence: false,                  // Update cadence debug
    materialMutations: false,          // Material mutation detection
    spawn: false,                    // Spawn debug
    visual: false,                    // Visual system debug
    policy: false,                    // Policy system debug
    visualBuild: false,               // Visual build debug
    spawnLogs: false,                 // Spawn logs
    linkSpawn: false,                 // Link spawn debug
    visualKill: false,                // Visual kill switch
    glyphFusionIntegrity: false,      // Glyph fusion integrity
    probeSpawn: false,                // Spawn probe
    worldProbe: false,                // World probe
    strictNodeGeometry: false,        // Strict node geometry mode
    devGuards: false,                // Development guards
    silentWarnings: false,            // Silent warnings
    visualBaseline: false             // Visual baseline mode
  }
}
```

### Runtime Flags
```javascript
runtime: {
  linkSpawnEnabled: true,            // Links can spawn
  noFallbackSpheres: false          // No fallback spheres
}
```

### Safety Flags
```javascript
safety: {
  disableParasiticHUDs: true,       // ✅ KILLS PARASITIC HUDs
  hardKillParasiticDOM: true,        // ✅ HARD KILLS PARASITIC DOM
  hardOffLanguageEngine: true,       // ✅ HARD OFF LANGUAGE ENGINE
  disableMythicRituals: true        // ✅ DISABLE MYTHIC RITUALS
}
```

### Visual Authority Locks (window globals)
```javascript
window.VISUAL_AUTHORITY_LOCK = false;  // NOT ACTIVE
```

---

## 2. CONFIG.visuals (config.js)

**Location**: `config.js` lines ~85-110
**Status**: **MOSTLY DISABLED**

```javascript
visuals: {
  LOCK_NODE_VISUALS: false,          // ❌ NOT ACTIVE
  LOCK_INTERACTION: false,          // ❌ NOT ACTIVE (was true)
  PARTICLE_BOUNDS_CHECK: false,      // ❌ NOT ACTIVE
  FREEZE_MODE_SAFE: false           // ❌ NOT ACTIVE
}
```

### Feature Flags
```javascript
features: {
  ENABLE_NODE_AURAS: true,          // ✅ AURAS ACTIVE
  ENFORCE_NODE_MODEL_SOURCE: true     // ✅ SOURCE ENFORCEMENT ACTIVE
}
```

---

## 3. DEBUG VISUAL MODE

**Location**: `main.js` line ~350
**Status**: **INACTIVE**

```javascript
window.DEBUG_VISUAL_MODE = false;  // ❌ NOT ACTIVE
```

When active, disables visuals and hardens interactions.

---

## 4. REMOVED/DISABLED SYSTEMS

### Visual Lock Complete Integration
**File**: `_VisualLockCompleteIntegration.js`
**Status**: ❌ **REMOVED (2026-03-01)**

```javascript
// REMOVED (2026-03-01): CompleteVisualLock disabled for new visual modules
// import { setupCompleteVisualLock, teardownCompleteVisualLock } from './_VisualLockCompleteIntegration.js';
```

### Shader Freeze Guard
**File**: `Engine/Debug/ShaderFreezeGuard.js`
**Status**: ❌ **REMOVED (2026-03-01)**

```javascript
// REMOVED (2026-03-01): ShaderFreezeGuard disabled for new visual modules
// import { installShaderFreezeGuard, warmupAllVisualVariants } from './Engine/Debug/ShaderFreezeGuard.js';
```

### Link Metrics Sanity Guard
**File**: `LinkMetricsSanityGuard_v1.js`
**Status**: ❌ **REMOVED (2026-03-01)**

```javascript
// REMOVED (2026-03-01): LinkMetricsSanityGuard disabled for new visual modules
// import { LinkMetricsSanityGuard_v1 } from './LinkMetricsSanityGuard_v1.js';
```

### Visual Sphere Policy
**Status**: ❌ **DISABLED**

```javascript
// TEMP DISABLED: VisualSpherePolicy blocking spawn pipeline (Object3D.add)
// import { ensureSpherePolicyInstalled, installSpherePolicy } from './VisualSpherePolicy.js';
```

### Sphere Creator Trace
**Status**: ❌ **DISABLED**

```javascript
// TEMP DISABLED: SphereCreatorTrace blocking spawn pipeline
// import { installSphereCreatorTrace } from './SphereCreatorTrace.js';
```

---

## 5. ACTIVE VISUAL LOCKS & AUTHORITY SYSTEMS

### Nuclear Lock System
**File**: `ACTIVATE_NUCLEAR_LOCK.js`
**Status**: ✅ **ACTIVE** (unless ATOMA_FLAGS.disableNuclearLock = true)

```javascript
// Property-level freezing — physically impossible to mutate protected layers
activateNuclearLockEverywhere(renderer, scene, camera);
```

### Node Core Material Authority
**File**: `NodeCoreMaterialAuthority.js`
**Status**: ✅ **ACTIVE**

- Ensures node core holographic materials can NEVER be overridden
- Material-driven solution (not depth-buffer hacks)

### Event Visual Suppression
**File**: `EventVisualSuppression_v1.js`
**Status**: ✅ **ACTIVE**

- Prevents event effects from diluting or occluding node cores
- Redirects event intensity to aura system

### Core Material Property Lock
**File**: `CoreMaterialPropertyLock.js`
**Status**: ✅ **ACTIVE**

- Enforces immutability of core material properties at runtime
- Prevents opacity/transparent/depthWrite/emissive degradation

### Visual Hierarchy Correction System
**File**: `_VisualHierarchyCorrectionSystem_v1.js`
**Status**: ✅ **ACTIVE**

- Enforces visual dominance of core node geometry over auxiliary layers
- `enforcementMode: 'constrain'`

### Hologram Shell Authority System
**File**: `HologramShellAuthoritySystem.js`
**Status**: ✅ **ACTIVE**

- Ensures shells never obscure node cores
- `shellRenderOrder: -500`, `maxShellOpacity: 0.5`

### Node Shell Size Authority
**File**: `NodeShellSizeAuthority_v1.js`
**Status**: ✅ **ACTIVE**

- Enforce static shell sizes derived ONLY from node category and tier
- Decouple shell scale from network metrics

### Visual Interaction Isolation Patch
**File**: `VisualInteractionIsolationPatch_v2_CRITICAL_FIX.js`
**Status**: ✅ **ACTIVE**

- Uses intersection filtering instead of raycast disabling
- NO MORE TypeError: r.raycast is not a function

### Hit Proxy System
**File**: `_HitProxySystem_v1.js`
**Status**: ✅ **ACTIVE**

- Strict raycast proxy architecture — PHASE 1 PRIMARY SYSTEM
- Invisible hit-proxies for ALL nodes, real visuals 100% protected

### Hit Proxy Auto-Registrar
**File**: `HitProxyAutoRegistrar.js`
**Status**: ✅ **ACTIVE**

- Ensures every spawned node gets a valid hit-proxy automatically
- Prevents FPS death from missing/invalid proxies

---

## 6. FREEZE MODE SYSTEMS

### Node Visual Freeze Mode v1
**File**: `NodeVisualFreezeMode_v1.js`
**Status**: ⚠️ **INSTALLED BUT NOT ACTIVE**

```javascript
game.__nodeVisualFreezeMode__ = freezeMode;
```

**Installed blockers for**:
- T2_HarmonyVisualConsumer
- T2_CorruptionVisualIntegration
- SynergyPulseVisuals
- HarmonicResonanceCoupling
- AuraModulationIntegration
- PersonalityVisualAdapter
- PersonalityVFXLayer
- PersonalityShaderBridge
- NodePersonalitySystem
- NodeEvolution
- EvolvingLinkFX
- SafeMetricsFX
- CoreMaterialMutationDetector
- CoreMaterialPropertyLock
- LinkPersonalityStateMachine

**BUT**: `freezeMode.enabled` is `false` by default, so these blockers are **NOT ACTIVE**.

### Controlled Unfreeze System
**File**: `ControlledUnfreezeSystem_v1.js`
**Status**: ✅ **INSTALLED**

```javascript
setupControlledUnfreeze(this);
```

- Safe reactivation of visual systems after freeze
- Removes blockers and quiets logging

---

## 7. PARASITIC DOM GUARDS

**Status**: ✅ **ACTIVE** (via MutationObserver in main.js)

### HUD Kill IDs
```javascript
const HUD_KILL_IDS = [
  'ai-emotional-feed',
  'ui-selected-hud-stats',
];
```

### Protected HUD IDs (never killed)
```javascript
const PROTECTED_HUD_IDS = [
  'core-metrics-hud',
  'core-metrics-overlay',
  'node-inspect-overlay'
];
```

### Additional Kill Selectors
```javascript
const HUD_P05_KILL_SELECTORS = [
  '#tier4-gameplay-feedback-hud',
  '#node-inspect-linguistic-overlay',
  '#ui-primary-node-top-bar-3-7',
];
```

---

## 8. DEBUG CONSOLE APIs

### Visual Lock Diagnostics
**File**: `_VisualLockDiagnostics.js`
**Status**: ⚠️ **AVAILABLE BUT NOT INSTALLED** (CompleteVisualLock disabled)

### Hard Authority Debug API
**File**: `HARD_AUTHORITY_DEBUG_API.js`
**Status**: ✅ **ACTIVE**

```javascript
setupHardAuthorityDebugAPI();
// Available: reportSystemStatus()
```

### Material Mutation Detector
**File**: `MaterialMutationDetector.js`
**Status**: ✅ **INSTALLED**

```javascript
installMaterialMutationDetector(THREE);
// Enable with: window.ATOMA_FLAGS.debug.materialMutations = true
```

### Shader Freeze Guard (REMOVED)
**Status**: ❌ **NOT INSTALLED**

### Visual Audit Tool
**Status**: ✅ **ACTIVE**

```javascript
window.VisualAudit = VisualAudit;
// Available: window.VisualAudit.testLink(nodeA, nodeB)
```

---

## 9. PERFORMANCE MODE SYSTEMS

### FX Performance Controller
**File**: `FXPerformanceController_v1.js`
**Status**: ✅ **ACTIVE**

- Centralized FX scaling controller
- Toggle with F7 key
- `isLowFX()` check available

### Adaptive Performance Monitor
**File**: `AdaptivePerformanceMonitor_v1.js`
**Status**: ✅ **ACTIVE**

- Automatic FPS-based LowFX toggling
- Supports MANUAL_LOCKED mode (user override)

### FX Performance Smooth Transition
**File**: `FXPerformanceSmoothTransition_v1.js`
**Status**: ✅ **ACTIVE**

- Smooth 0.6s transitions between quality modes

---

## 10. OTHER ACTIVE SAFETY SYSTEMS

### Visual Authority
**File**: `VisualAuthority.js`
**Status**: ✅ **ACTIVE**

- `visualLocked` flag on node meshes
- Block mutation attempts on visual properties

### Link State Visual Lock
**File**: `LinkStateVisualLock.js`
**Status**: ✅ **ACTIVE**

- Validates link target contract compliance
- Prevents linkTarget = node (self-reference)

### Legacy Node Model Filter
**File**: `LegacyNodeModelFilter.js`
**Status**: ✅ **ACTIVE**

- Blocks unstable legacy models from spawning
- Warns about blocked models

### Node Visual Integrity Fix
**File**: `NodeVisualIntegrityFix.js`
**Status**: ✅ **ACTIVE**

- Ensures nodes retain full visual fidelity when linked
- Locks core materials, preserves holographic layers

### Defensive Hardening Patch
**File**: `DefensiveHardeningPatch_v1.js`
**Status**: ✅ **ACTIVE**

- Iterable safety + post-link visual dominance correction

---

## SUMMARY: ACTIVE VISUAL-AFFECTING SYSTEMS

### 🔴 HIGH IMPACT (Directly modify/block visuals)
1. **Nuclear Lock** - Property freezing, cannot be bypassed
2. **Node Core Material Authority** - Prevents core material overrides
3. **Core Material Property Lock** - Enforces material property immutability
4. **Visual Hierarchy Correction** - Enforces core dominance
5. **Hologram Shell Authority** - Limits shell opacity, ensures cores visible
6. **Node Shell Size Authority** - Locks shell scale from metrics
7. **Event Visual Suppression** - Redirects event intensity to auras

### 🟡 MEDIUM IMPACT (Filtering/protection)
8. **Visual Interaction Isolation** - Raycast filtering, no direct visual changes
9. **Hit Proxy System** - Invisible proxies, visual protection only
10. **Visual Authority** - `visualLocked` flag on meshes
11. **Link State Visual Lock** - Contract validation only

### 🟢 LOW IMPACT (Optimization/debugging)
12. **FX Performance Controller** - Quality scaling (F7 toggle)
13. **Adaptive Performance Monitor** - Automatic quality adjustment
14. **Parasitic DOM Guards** - HUD cleanup only
15. **Material Mutation Detector** - Diagnostic only (unless enabled)
16. **Legacy Node Model Filter** - Spawn filtering only

### ⚪ INACTIVE/REMOVED
- CompleteVisualLock (removed 2026-03-01)
- ShaderFreezeGuard (removed 2026-03-01)
- LinkMetricsSanityGuard (removed 2026-03-01)
- VisualSpherePolicy (disabled)
- SphereCreatorTrace (disabled)
- Node Visual Freeze Mode (installed but not enabled)
- DEBUG_VISUAL_MODE (false)

---

## KEY FLAGS TO CONTROL VISUALS

```javascript
// Master visual lock
window.VISUAL_AUTHORITY_LOCK = false;  // Set true to lock all visuals

// Safety switches
window.ATOMA_FLAGS.safety.disableParasiticHUDs = true;
window.ATOMA_FLAGS.safety.hardKillParasiticDOM = true;
window.ATOMA_FLAGS.safety.hardOffLanguageEngine = true;
window.ATOMA_FLAGS.safety.disableMythicRituals = true;

// Config visual locks
CONFIG.visuals.LOCK_NODE_VISUALS = false;
CONFIG.visuals.LOCK_INTERACTION = false;
CONFIG.visuals.FREEZE_MODE_SAFE = false;

// Debug mode
window.DEBUG_VISUAL_MODE = false;  // When true, disables all visuals
```