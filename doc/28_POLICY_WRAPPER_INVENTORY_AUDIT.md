# ATOMA POLICY & WRAPPER INVENTORY AUDIT
## Phase: Policy & Wrap Inventory Audit
## Mode: READ-ONLY (No File Modifications)
## Date: 2026-02-14

---

## EXECUTIVE SUMMARY

This audit catalogs all runtime gating mechanisms, policy wrappers, and mode-based conditionals that block or alter behavior in the ATOMA codebase.

**Key Findings:**
- **259+ enabled/disabled flags** across the codebase
- **4 major global policy systems** with overlapping responsibilities
- **209 mode-switch related patterns** (freezeMode, setMode, currentMode)
- **220 guard/wrapper patterns** (if (!enabled) returns)
- **Multiple conflicting control mechanisms** for same subsystems

---

## 1. POLICY FLAGS INVENTORY

### 1.1 Global Configuration Flags (config.js)

```javascript
CONFIG = {
  // Session 99 Stabilization
  features: {
    ENABLE_NODE_AURAS: false,              // Disables all node aura systems
    ENFORCE_NODE_MODEL_SOURCE: true         // Validates spawn sources
  },
  
  // Session 103 Emergency
  debug: {
    VISUAL_LOCKDOWN: true,                 // Hard disable visual complexity
    DEBUG_WAVE_ENGINE: false                // WaveInterferenceEngine pilot trigger
  },
  
  // Critical Stabilization
  rendering: {
    DISABLE_TRANSMISSION_PASS: true         // Zeroes MeshPhysicalMaterial.transmission
  },
  
  // Visual Authority Locks
  visuals: {
    LOCK_NODE_VISUALS: true,               // Blocks node opacity/scale/color/emissive mutations
    LOCK_LINK_VISUALS: true,               // Links render geometry-only
    LOCK_INTERACTION: true,                // Raycast targets interaction meshes ONLY
    PARTICLE_BOUNDS_CHECK: true,            // Confines particles to curve bounds
    FREEZE_MODE_SAFE: true                 // Prevents freeze mode artifacts
  }
}
```

### 1.2 Per-System Enabled Flags (Sample)

**Visual Systems:**
- `NodeAuraSystem_v1.enabled` - Controlled by CONFIG.features.ENABLE_NODE_AURAS
- `SynergyVFXEngine1_0.enabled` - Auto-disables on >50 errors
- `WorldStateCache1_0.enabled` - Auto-disables on >5 errors
- `VisualLayerDebugger.enabled` - Default false
- `VisualEchoTrails_v1_Integration.enabled` - Default true
- `_ExtremeLinkVisualPack3.enabled` - Default true
- `LinkSemanticPictogramSystem.enabled` - Default true

**AI/Semantic Systems:**
- `ProceduralMeaningEngine.enabled` - Controlled via console API
- `SemanticGlyphAI.enabled` - Default true
- `_AINarrativePatterns6_0.enabled` - Default true
- `_RecursiveGlyphMessaging4_0.enabled` - Default true

**Interaction Systems:**
- `NodeLinkingSystem.enabled` - Default true (can be set false)
- `ZeroGravityControls.enabled` - Default false
- `SelectedHUDSyncPatch1_0.enabled` - Validates on init

**Gameplay Systems:**
- `CriticalNodeFailureSystem.enabled` - Default false
- `CascadingRuptureSystem.enabled` - Default false
- `HarmonyStabilizationSystem_v1.enabled` - Default true

### 1.3 Mode-Specific Flags

**VisualEchoTrails_v1_Integration.js:**
```javascript
this.mode = 'DEV'; // 'DEV' | 'STRICT' | 'PROD'
this.enabled = true;
```

**VisualLayerEnforcementGate.js:**
```javascript
setMode(mode) {
  if (!['DEV', 'STRICT', 'PROD'].includes(mode)) {
    // Invalid mode handling
  }
}
```

---

## 2. WRAPPERS & GUARDS

### 2.1 Common Guard Patterns

#### Pattern A: Early Return on Disabled
```javascript
// Found in 50+ files
if (!this.enabled) return;

if (!this.enabled) return new Map();

if (!this.enabled) return null;

if (!this.enabled) {
  this.clearAllSignals();
  return;
}
```

#### Pattern B: Visual Authority Lock Guards
```javascript
// VisualAuthorityLock checks
if (!VisualAuthorityLock.canModifyNode()) return;
if (!VisualAuthorityLock.canModifyLink()) return;
if (!VisualAuthorityLock.canRaycastVisuals()) return;
```

#### Pattern C: FrameScheduler Guards
```javascript
if (!this.frameScheduler?.shouldRunVisual?.()) return;
if (!this.frameScheduler?.shouldRunSimulation?.()) return;
```

#### Pattern D: Configuration Guards
```javascript
if (!CONFIG.features.ENABLE_NODE_AURAS) {
  this.enabled = false;
  return;
}

if (CONFIG.visuals.LOCK_NODE_VISUALS) {
  // Block visual mutations
}
```

### 2.2 Systems Wrapped by Freeze/Lock/Guard

**Freeze Mode Systems:**
- `NodeVisualFreezeMode_v1` - Freezes all node materials
- `ControlledUnfreezeSystem_v1` - Global freeze mode controller
- `VisualAuthorityLock` - Authority-based visual locking

**Lock Systems:**
- `AbsoluteLinkStateNuclearLock.js`
- `AbsoluteRaycastLock.js`
- `CoreMaterialPropertyLock.js`
- `ACTIVATE_NUCLEAR_LOCK.js`
- `ACTIVATE_VISUAL_LOCK.js`

**Enforcement Systems:**
- `VisualLayerEnforcementGate` - Multi-layer visual enforcement
- `EnforcementViolationAutoRecovery` - Auto-recovery on violations
- `EnforcementGateAutoRecoveryBridge` - Bridge between gate and recovery

**Debug Systems:**
- `VisualLayerDebugger` - Layer debugging (default disabled)
- `BeadDebugUtils` - Bead system debugging (default disabled)

### 2.3 Auto-Disabling Safety Mechanisms

**Error-Based Auto-Disable:**
- `SynergyVFXEngine1_0` - Disables after >50 errors
- `WorldStateCache1_0` - Disables after >5 errors
- `PriorityHistoryEngine1_0` - Disables on excessive errors
- `LinkHistoryTracker1_0` - Disables on excessive errors

**Window-Based Controls:**
```javascript
window.ATOMA_DISABLE_OPAQUE_ENFORCER = true; // Disables ForceNodeOpaqueBodySystem
window.ATOMA_DISABLE_MYTHIC_RITUALS = true; // Disables MythicSeedGlyph
```

---

## 3. MODE SWITCH LOGIC

### 3.1 World Mode Switching (main.js)

**Current Modes:**
```javascript
// this.currentMode cycles through:
'sigma' → 'memory' → 'fractal' → 'quantum' → 'desert' → 'chamber' → 'sigma'
```

**Switch Logic:**
```javascript
async switchMode() {
  if (this._worldSwitchInProgress) return; // Cooldown guard
  if (now - this._lastWorldSwitchAt < 300) return; // 300ms cooldown
  
  // Cycle mode
  if (this.currentMode === 'sigma') {
    this.currentMode = 'memory';
  } else if (this.currentMode === 'memory') {
    this.currentMode = 'fractal';
  }
  // ... etc
  
  // Setup new environment
  if (this.currentMode === 'sigma') {
    this.setupSigmaRiftEnvironment();
  } else if (this.currentMode === 'desert') {
    this.setupDreamDesertEnvironment();
  }
  // ... etc
}
```

### 3.2 Visual Layer Modes

**VisualEchoTrails_v1_Integration:**
```javascript
this.mode = 'DEV' | 'STRICT' | 'PROD'
```

**VisualLayerEnforcementGate:**
```javascript
setMode('DEV' | 'STRICT' | 'PROD')
```

### 3.3 Neural Curve Link Modes

```javascript
this.currentMode = this.modes.SYMMETRIC;
// Modes: SYMMETRIC, ASYMMETRIC, etc.
```

### 3.4 Redundant/Overlapping Mode Controls

**Conflicts Identified:**
1. **Visual Lockdown vs Individual System Flags**
   - `CONFIG.debug.VISUAL_LOCKDOWN = true` disables all complexity
   - BUT individual systems still check `this.enabled` and their own config flags
   - Result: Double evaluation every frame

2. **NodeVisualFreezeMode vs VisualAuthorityLock**
   - Both control node visual mutations
   - Freeze mode creates frozen materials
   - VisualAuthorityLock checks CONFIG.visuals.LOCK_NODE_VISUALS
   - Overlapping responsibilities

3. **Freeze Mode Safe Flag**
   - `CONFIG.visuals.FREEZE_MODE_SAFE` prevents freeze mode artifacts
   - But freeze mode itself has `this.enabled` flag
   - Two flags controlling same behavior

---

## 4. CROSS-SYSTEM GATING

### 4.1 Dependency Chains

```
WorldStateCache1_0 (enabled)
  ↓
  canWarmStart()
    ↓
    Faster world transitions
    
VisualAuthorityLock (CONFIG.visuals.*)
  ↓
  canModifyNode(), canModifyLink(), canRaycastVisuals()
    ↓
  NeonLinkVisuals, _DynamicLinkThicknessSystem, etc.
    ↓
    Visual mutation blocking
    
FrameScheduler
  ↓
  shouldRunVisual(), shouldRunSimulation()
    ↓
  SynergyHighways, _NeuralCurveLinkVisuals, etc.
    ↓
    Performance-based throttling
    
VisualLayerEnforcementGate
  ↓
  setMode('DEV'|'STRICT'|'PROD')
    ↓
  HarmonyAuraController, FresnelRimLightAuraShader
    ↓
    Layer-based enforcement
```

### 4.2 Circular Dependencies Detected

**Potential Risk:**
1. `VisualAuthorityLock` checks CONFIG flags
2. CONFIG affects `VisualLayerEnforcementGate`
3. EnforcementGate can disable systems
4. Systems may re-enable themselves

**Dead Code Paths:**
1. `WorldStateCache1_0` warm-start logic skipped if topology changes >50%
2. FrameScheduler-based systems don't run if scheduler not available
3. Visual systems blocked by LOCK flags still initialize and check locks

### 4.3 Indirect Disabling

**Example: World Switch Flow**
```
switchMode() → clears scene → creates new world
  BUT:
    - _sceneAuditTimer continues running (known bug)
    - FrameScheduler tasks remain registered
    - Some RAF loops survive
```

**Example: Feature Flag Propagation**
```
CONFIG.features.ENABLE_NODE_AURAS = false
  ↓
NodeAuraSystem_v1.enabled = false
  ↓
All aura-related visual systems silently exit early
  ↓
Systems still initialized, just skip work
```

---

## 5. MODE CONFLICT MATRIX

| Subsystem | Global Flag | Local Flag | Lock Check | Scheduler Check | Conflict Risk |
|-----------|-------------|------------|------------|-----------------|---------------|
| **Node Visuals** | LOCK_NODE_VISUALS | enabled | VisualAuthorityLock | - | HIGH (3 flags) |
| **Link Visuals** | LOCK_LINK_VISUALS | enabled | VisualAuthorityLock | - | HIGH (3 flags) |
| **Raycasting** | LOCK_INTERACTION | - | VisualAuthorityLock | - | MEDIUM (2 flags) |
| **Particles** | PARTICLE_BOUNDS_CHECK | - | VisualAuthorityLock | - | LOW (2 flags) |
| **Auras** | ENABLE_NODE_AURAS | enabled | - | - | MEDIUM (2 flags) |
| **HUD/Metrics** | VISUAL_LOCKDOWN | enabled | - | FrameScheduler | MEDIUM (3 flags) |
| **Semantic Visuals** | - | enabled | - | FrameScheduler | LOW (2 flags) |
| **Link Dynamics** | - | enabled | VisualAuthorityLock | FrameScheduler | MEDIUM (2 flags) |

### Conflicts Summary

**HIGH CONFLICT:**
- Node Visuals controlled by 3 separate mechanisms
- Each guard evaluated every frame
- Performance overhead from redundant checks

**MEDIUM CONFLICT:**
- Multiple feature flags for same subsystem
- Indirect disabling via dependencies
- Systems initializing but immediately exiting

**LOW CONFLICT:**
- Simple enable/disable pattern
- Clear ownership
- Single point of control

---

## 6. PROPOSAL: SINGLE ENGINEMODE ABSTRACTION

### 6.1 Proposed EngineMode Enum

```javascript
export const EngineMode = {
  PRODUCTION: 'PRODUCTION',
  STABILIZATION: 'STABILIZATION',
  DEBUG: 'DEBUG',
  LOCKDOWN: 'LOCKDOWN'
};
```

### 6.2 Mode Definitions

**PRODUCTION:**
- All visual features enabled
- No hard locks
- Full performance
- All systems operational

**STABILIZATION:**
- Auras disabled (feature flag)
- Visuals partially locked
- Particle bounds enforced
- Core systems operational

**DEBUG:**
- All visual features enabled
- Debug layers active
- Debug guards disabled
- Diagnostic tools available

**LOCKDOWN:**
- All visual complexity disabled
- Hard material locks
- Only core interactions
- Emergency mode

### 6.3 Unified Control Interface

```javascript
class EngineModeController {
  constructor() {
    this.currentMode = EngineMode.PRODUCTION;
    this.systems = new Map(); // systemId → { enabled: boolean, mode: EngineMode }
  }

  setMode(mode) {
    this.currentMode = mode;
    this._applyMode(mode);
  }

  registerSystem(systemId, systemConfig) {
    this.systems.set(systemId, {
      enabled: systemConfig.enabled,
      minMode: systemConfig.minMode || EngineMode.PRODUCTION,
      maxMode: systemConfig.maxMode || EngineMode.DEBUG
    });
  }

  isSystemEnabled(systemId) {
    const system = this.systems.get(systemId);
    if (!system) return false;

    const modePriority = {
      [EngineMode.PRODUCTION]: 0,
      [EngineMode.STABILIZATION]: 1,
      [EngineMode.DEBUG]: 2,
      [EngineMode.LOCKDOWN]: 3
    };

    const currentPriority = modePriority[this.currentMode];
    const minPriority = modePriority[system.minMode];
    const maxPriority = modePriority[system.maxMode];

    return system.enabled && 
           currentPriority >= minPriority && 
           currentPriority <= maxPriority;
  }

  _applyMode(mode) {
    // Update all global flags based on mode
    switch (mode) {
      case EngineMode.PRODUCTION:
        CONFIG.features.ENABLE_NODE_AURAS = true;
        CONFIG.visuals.LOCK_NODE_VISUALS = false;
        CONFIG.visuals.LOCK_LINK_VISUALS = false;
        CONFIG.debug.VISUAL_LOCKDOWN = false;
        break;

      case EngineMode.STABILIZATION:
        CONFIG.features.ENABLE_NODE_AURAS = false;
        CONFIG.visuals.LOCK_NODE_VISUALS = false;
        CONFIG.visuals.LOCK_LINK_VISUALS = false;
        CONFIG.visuals.PARTICLE_BOUNDS_CHECK = true;
        CONFIG.debug.VISUAL_LOCKDOWN = false;
        break;

      case EngineMode.DEBUG:
        CONFIG.features.ENABLE_NODE_AURAS = true;
        CONFIG.visuals.LOCK_NODE_VISUALS = false;
        CONFIG.visuals.LOCK_LINK_VISUALS = false;
        CONFIG.debug.VISUAL_LOCKDOWN = false;
        // Enable debug systems
        VisualLayerDebugger.enabled = true;
        break;

      case EngineMode.LOCKDOWN:
        CONFIG.features.ENABLE_NODE_AURAS = false;
        CONFIG.visuals.LOCK_NODE_VISUALS = true;
        CONFIG.visuals.LOCK_LINK_VISUALS = true;
        CONFIG.visuals.LOCK_INTERACTION = true;
        CONFIG.debug.VISUAL_LOCKDOWN = true;
        break;
    }

    // Notify all registered systems
    this.systems.forEach((config, systemId) => {
      const enabled = this.isSystemEnabled(systemId);
      // System can react to mode change
    });
  }
}
```

### 6.4 System Registration Example

```javascript
// During system initialization
engineMode.registerSystem('NodeAuraSystem', {
  enabled: true,
  minMode: EngineMode.PRODUCTION,
  maxMode: EngineMode.DEBUG
});

engineMode.registerSystem('VisualLayerDebugger', {
  enabled: true,
  minMode: EngineMode.DEBUG,
  maxMode: EngineMode.DEBUG
});

engineMode.registerSystem('LinkCoreSystem', {
  enabled: true,
  minMode: EngineMode.LOCKDOWN,
  maxMode: EngineMode.DEBUG
});
```

### 6.5 Simplified Guard Pattern

```javascript
// Replace all enabled checks with single unified guard
class AnySystem {
  constructor() {
    this.systemId = 'AnySystem';
  }

  update(deltaTime) {
    if (!engineMode.isSystemEnabled(this.systemId)) {
      return;
    }
    
    // System logic
  }
}
```

### 6.6 Migration Path

**Phase 1: Dual Operation**
- Implement EngineModeController
- Keep existing flags for compatibility
- EngineModeController synchronizes with existing flags

**Phase 2: Gradual Migration**
- Update systems one by one
- Replace multiple guards with single `isSystemEnabled()`
- Deprecate redundant flags

**Phase 3: Cleanup**
- Remove deprecated flags
- Remove VisualAuthorityLock (replaced by mode-based control)
- Remove individual system `enabled` properties

---

## 7. RECOMMENDATIONS

### 7.1 Immediate Actions

1. **Consolidate Visual Control Flags**
   - Merge `LOCK_NODE_VISUALS`, `LOCK_LINK_VISUALS`, `VISUAL_LOCKDOWN` into single mode
   - Reduce per-frame guard evaluations

2. **Fix Ghost Loops**
   - Ensure `_sceneAuditTimer` cleared on world switch
   - Audit all intervals/setTimeouts for cleanup

3. **Remove Redundant Checks**
   - Identify systems with >2 guards
   - Consolidate into single point of control

### 7.2 Medium-Term

1. **Implement EngineModeController**
   - Create unified mode abstraction
   - Register all systems
   - Migrate systems incrementally

2. **Audit Auto-Disabling Logic**
   - Ensure auto-disable thresholds are appropriate
   - Add recovery mechanisms
   - Log all auto-disables

3. **Standardize Guard Pattern**
   - Single `if (!isSystemEnabled())` pattern everywhere
   - No multiple nested guards
   - Clear hierarchy of control

### 7.3 Long-Term

1. **Remove Legacy Systems**
   - Deprecate VisualAuthorityLock
   - Deprecate NodeVisualFreezeMode_v1
   - Consolidate all under EngineMode

2. **Dynamic Mode Switching**
   - Allow runtime mode changes without restart
   - Graceful transition between modes
   - Preserving state where possible

3. **Mode-Aware Performance Profiling**
   - Measure per-mode performance
   - Identify bottlenecks per mode
   - Optimize based on mode requirements

---

## 8. CONCLUSION

The ATOMA codebase has evolved organically, resulting in multiple overlapping control mechanisms that create complexity, redundancy, and potential conflicts. 

**Current State:**
- 259+ enabled/disabled flags
- 4+ major policy systems with overlapping responsibilities
- Multiple mode-switch patterns
- High risk of conflicting controls

**Proposed State:**
- Single EngineMode enum (4 modes)
- Unified EngineModeController
- Single guard pattern per system
- Clear hierarchy of control
- Reduced per-frame overhead

**Benefits:**
- Simpler mental model
- Reduced bug surface
- Better performance (fewer guards)
- Easier maintenance
- Clearer system boundaries

This proposal provides a path forward to consolidate the scattered policy mechanisms into a coherent, unified system while maintaining backward compatibility during migration.