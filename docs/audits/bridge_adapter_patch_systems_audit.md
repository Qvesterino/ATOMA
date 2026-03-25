# BRIDGE / ADAPTER / PATCH SYSTEMS AUDIT

**Date:** 2026-03-25  
**Type:** Static Analysis  
**Scope:** All bridge, adapter, integration, and patch systems

---

## EXECUTIVE SUMMARY

Found **9** bridge/adapter/patch systems in the ATOMA codebase. These systems serve as middleware layers that:

1. **Read** canonical metrics from nodes/links
2. **Transform** data into visual or runtime state
3. **Write** to `userData.runtime.*` or modify materials directly

All systems are **data transformers** without their own render loops.

---

## SYSTEM CATALOG

### 1. CascadeToWaveBridge_v1.js

**Type:** Bridge  
**Purpose:** Connects cascade particle system to wave visual system

**Data Flow:**
- **Reads:** Cascade particles (position, intensity, lifetime)
- **Transforms:** Particle data → Wave emission parameters
- **Writes:** Delegates to wave system (no direct userData writes)

**Integration Pattern:**
- Observer-based listening to cascade events
- Converts particle emissions to wave spawns
- Non-invasive bridge between two visual subsystems

**Verdict:** Pure bridge - no userData modification

---

### 2. CascadeEventBridge_v1.js

**Type:** Bridge  
**Purpose:** Bridges cascade system events to global event bus

**Data Flow:**
- **Reads:** Cascade system internal events
- **Transforms:** System-specific events → Standardized semantic events
- **Writes:** Emits to global event bus (window events or MultiNetworkManager)

**Integration Pattern:**
- Event transformation and routing
- Decouples cascade system from downstream consumers
- Provides semantic event abstraction

**Verdict:** Pure bridge - no userData modification

---

### 3. SemanticMetricAdapter.js

**Type:** Adapter  
**Purpose:** Single source of truth for canonical metric reading

**Data Flow:**
- **Reads:** `userData.metrics.{synergy, harmony, stability, corruption, loadPressure}`
- **Transforms:** Raw metric values → Normalized visual metrics
- **Writes:** Returns computed values (no userData writes)

**Integration Pattern:**
- Centralized metric authority
- Delegates to specialized calculators (SynergyCalculator, HarmonyCalculator)
- Provides normalization and validation

**Key Methods:**
- `getNodeCanonicalMetrics()` - Returns all node metrics
- `getLinkSynergy()` - Returns link synergy
- `getLinkCorruption()` - Returns link corruption
- `getLinkSynergyVisualMetrics()` - Returns visual profile for links

**Verdict:** Read-only adapter - data source, no writes

---

### 4. MetricRuntimeAdapter.js (src/metrics/)

**Type:** Adapter  
**Purpose:** Manages runtime visual state in `userData.runtime.*`

**Data Flow:**
- **Reads:** Delegates to SemanticMetricAdapter for canonical metrics
- **Transforms:** Canonical metrics → Runtime visual state structure
- **Writes:** `node.userData.runtime.*` and `link.userData.runtime.*`

**Integration Pattern:**
- Runtime state manager
- Structured runtime state hierarchy:
  - `visualState.*` - Visual flags and timestamps
  - `effectsState.*` - Active effects (synergyPulse, harmonyStabilized, corruptionVisual, harmonyVisual)
  - `animationState.*` - Animation parameters
  - `metadata.*` - Visual metadata (visualRoot, visualType, visualProfile)

**Key Methods:**
- `NodeMetricRuntimeAdapter.getRuntimeState(node, path)` - Get runtime state
- `NodeMetricRuntimeAdapter.setRuntimeState(node, path, value)` - Set runtime state
- `LinkMetricRuntimeAdapter.getRuntimeState(link, path)` - Get link runtime state
- `LinkMetricRuntimeAdapter.setRuntimeState(link, path, value)` - Set link runtime state

**Write Destinations:**
- `node.userData.runtime.visualState.*`
- `node.userData.runtime.effectsState.*`
- `node.userData.runtime.animationState.*`
- `node.userData.runtime.metadata.*`
- `link.userData.runtime.visualState.*`
- `link.userData.runtime.effectsState.*`
- `link.userData.runtime.animationState.*`

**Verdict:** Runtime state adapter - writes to userData.runtime

---

### 5. CorruptionVisualIntegrationPatch_v1.js

**Type:** Integration Patch  
**Purpose:** Patches AINodes and archetype visual system with corruption FX

**Data Flow:**
- **Reads:** `node.userData.gameplay.corruptionLevel` or `node.userData.metrics.corruption`
- **Transforms:** Corruption level → Visual effects (particles, color tint, desaturation)
- **Writes:** 
  - Delegates to CorruptionVisualFX_v1 for particle updates
  - Writes `node.userData.gameplay.corruptionLevel` when modified via API
  - Emits events to MultiNetworkManager

**Integration Pattern:**
- Monkey-patching of existing methods
- Wraps `updateArchetypeEffects()` and `updateNodeVisuals()`
- Adds control APIs: `increaseCorruption()`, `decreaseCorruption()`, `setCorruptionLevel()`

**Write Destinations:**
- `node.userData.gameplay.corruptionLevel`
- `node.userData.gameplay.isCorrupted`
- Particle system state (via CorruptionVisualFX_v1)
- Event emissions (corruptionThresholdCrossed)

**Verdict:** Integration patch - writes to userData.gameplay and delegates to FX system

---

### 6. HarmonyStabilizationIntegrationPatch_v1.js

**Type:** Integration Patch  
**Purpose:** Patches AINodes with harmony stabilization system

**Data Flow:**
- **Reads:** Delegates to HarmonyStabilizationSystem_v1
- **Transforms:** Harmony state → Visual parameters
- **Writes:** 
  - `node.userData.harmonyLevel`
  - `node.userData.harmonyVisualState`
  - `link.userData.harmonyLevel`

**Integration Pattern:**
- Adds harmony system instance to AINodes
- Wraps update loop integration
- Provides convenience methods: `updateNodeHarmony()`, `setNodeHarmonyLevel()`, `triggerHarmonyPulse()`

**Write Destinations:**
- `node.userData.harmonyLevel`
- `node.userData.harmonyVisualState`
- `link.userData.harmonyLevel`
- Internal harmony system state (nodeHarmony, linkHarmony maps)

**Verdict:** Integration patch - writes to userData.harmonyLevel and userData.harmonyVisualState

---

### 7. AuraModulationIntegration_v1.js

**Type:** Integration  
**Purpose:** Redirects event intensity to aura modulation system

**Data Flow:**
- **Reads:** Event intensity from EventVisualSuppression
- **Transforms:** Event type/intensity → Aura modulation parameters
- **Writes:** Delegates to AuraModulationSystem (no direct userData writes)

**Integration Pattern:**
- Patches `EventVisualSuppression.redirectToAura()` method
- Observer pattern for node spawn and link creation
- Hooks into aura objects by name/hierarchy/material detection

**Write Destinations:**
- Aura modulation system state (via pushModulation)
- No direct userData writes

**Verdict:** Integration - delegates to external system, no userData writes

---

### 8. CompetitionDominanceAdapter_v1.js

**Type:** Adapter  
**Purpose:** Computes dominance scores for territorial competition visualization

**Data Flow:**
- **Reads:** 
  - `node.synapticBias`
  - `node.metrics.{harmony, corruption, synergy, resilience, fatigue}`
- **Transforms:** Metric aggregation → Dominance score [0,1]
- **Writes:** `node.userData.dominanceVisuals.*`

**Integration Pattern:**
- Region-based dominance computation
- BFS neighborhood search within hop radius
- Smooth transitions with lerp

**Write Destinations:**
- `node.userData.dominanceVisuals.dominanceLevel`
- `node.userData.dominanceVisuals.haloClarity`
- `node.userData.dominanceVisuals.pulseCoherence`
- `node.userData.dominanceVisuals.phaseAuthority`
- `node.userData.dominanceVisuals.rippleStrength`
- `node.userData.dominanceVisuals.role`
- `node.userData.dominanceVisuals.phaseOffset`
- `node.userData.dominanceVisuals.beatFrequency`

**Verdict:** Data adapter - computes and writes dominance visual parameters

---

### 9. CorruptionDesaturationIntegrationPatch.js

**Type:** Integration Patch  
**Purpose:** Applies color desaturation based on corruption level

**Data Flow:**
- **Reads:** `node.userData.metrics.corruption` or `node.userData.corruption`
- **Transforms:** Corruption level → Color desaturation (lerp to neutral gray)
- **Writes:** `node.material.color` and `link.material.color`

**Integration Pattern:**
- Direct material manipulation
- Preserves original colors as base
- Applies desaturation: `color.lerp(neutralGray, corruption * strength)`

**Write Destinations:**
- `node.material.color` (direct material write)
- `link.material.color` (direct material write)
- `link.group.userData.conduitState.skinMesh.material.color`
- `link.group.userData.conduitState.strands[].material.color`

**Verdict:** Integration patch - writes directly to material properties (not userData)

---

## CLASSIFICATION MATRIX

| System | Type | Reads Metrics | Transforms | Writes to userData | Own Render | Primary Destination |
|--------|------|---------------|------------|-------------------|-------------|---------------------|
| CascadeToWaveBridge_v1.js | Bridge | ❌ | ✅ | ❌ | ❌ | Wave system |
| CascadeEventBridge_v1.js | Bridge | ❌ | ✅ | ❌ | ❌ | Event bus |
| SemanticMetricAdapter.js | Adapter | ✅ | ✅ | ❌ | ❌ | Return values |
| MetricRuntimeAdapter.js | Adapter | ✅ | ✅ | ✅ | ❌ | userData.runtime.* |
| CorruptionVisualIntegrationPatch_v1.js | Patch | ✅ | ✅ | ✅ | ❌ | userData.gameplay.* |
| HarmonyStabilizationIntegrationPatch_v1.js | Patch | ✅ | ✅ | ✅ | ❌ | userData.harmonyLevel |
| AuraModulationIntegration_v1.js | Integration | ❌ | ✅ | ❌ | ❌ | Aura modulation system |
| CompetitionDominanceAdapter_v1.js | Adapter | ✅ | ✅ | ✅ | ❌ | userData.dominanceVisuals.* |
| CorruptionDesaturationIntegrationPatch.js | Patch | ✅ | ✅ | ❌ | ❌ | material.color |

---

## WRITE DESTINATIONS MAP

### userData.runtime.* (MetricRuntimeAdapter)
```
node.userData.runtime.visualState.*
node.userData.runtime.effectsState.synergyPulse.*
node.userData.runtime.effectsState.harmonyStabilized.*
node.userData.runtime.effectsState.corruptionVisual.*
node.userData.runtime.effectsState.harmonyVisual.*
node.userData.runtime.animationState.*
node.userData.runtime.metadata.*

link.userData.runtime.visualState.*
link.userData.runtime.effectsState.synergyCollapse.*
link.userData.runtime.effectsState.corruptionVisual.*
link.userData.runtime.effectsState.glow.*
link.userData.runtime.animationState.*
```

### userData.gameplay.* (CorruptionVisualIntegrationPatch_v1)
```
node.userData.gameplay.corruptionLevel
node.userData.gameplay.isCorrupted
```

### userData.harmony* (HarmonyStabilizationIntegrationPatch_v1)
```
node.userData.harmonyLevel
node.userData.harmonyVisualState
link.userData.harmonyLevel
```

### userData.dominanceVisuals.* (CompetitionDominanceAdapter_v1)
```
node.userData.dominanceVisuals.dominanceLevel
node.userData.dominanceVisuals.haloClarity
node.userData.dominanceVisuals.pulseCoherence
node.userData.dominanceVisuals.phaseAuthority
node.userData.dominanceVisuals.rippleStrength
node.userData.dominanceVisuals.role
node.userData.dominanceVisuals.phaseOffset
node.userData.dominanceVisuals.beatFrequency
```

### material.color (CorruptionDesaturationIntegrationPatch)
```
node.material.color
link.material.color
link.group.userData.conduitState.skinMesh.material.color
link.group.userData.conduitState.strands[].material.color
```

---

## KEY INSIGHTS

### 1. Separation of Concerns
- **SemanticMetricAdapter** is the single source of truth for reading
- **MetricRuntimeAdapter** is the single authority for runtime state writing
- All other adapters delegate to these two or write to specific subsystems

### 2. No Redundant Rendering
- None of these systems have their own render loops
- All are pure data transformers
- Rendering is handled by specialized visual systems

### 3. Layered Architecture
```
Canonical Metrics (userData.metrics.*)
         ↓
SemanticMetricAdapter (read authority)
         ↓
Specialized Adapters (transform)
         ↓
Runtime State (userData.runtime.*)
         ↓
Visual Systems (consume & render)
```

### 4. Non-Breaking Integration Pattern
- Most systems use monkey-patching or method wrapping
- Preserve original functionality
- Add new behavior without breaking existing code

### 5. Event-Based Decoupling
- CascadeToWaveBridge and CascadeEventBridge use events
- Loose coupling between subsystems
- Allows independent evolution of systems

---

## RISK ASSESSMENT

### High Risk (Direct Material Writes)
- **CorruptionDesaturationIntegrationPatch.js** writes directly to `material.color`
- Bypasses userData layer
- May conflict with other color modification systems

### Medium Risk (userData.gameplay Writes)
- **CorruptionVisualIntegrationPatch_v1.js** writes to `userData.gameplay.*`
- Gameplay domain contamination with visual concerns
- Possible confusion about data ownership

### Low Risk (userData.runtime Writes)
- **MetricRuntimeAdapter.js** writes to structured `userData.runtime.*`
- Clear visual-only domain
- Well-structured hierarchy

### Low Risk (Delegation Patterns)
- **AuraModulationIntegration_v1.js** delegates to external system
- **CascadeToWaveBridge_v1.js** delegates to wave system
- Clean separation, minimal side effects

---

## RECOMMENDATIONS

### 1. Standardize Runtime State Writing
All runtime visual state should flow through **MetricRuntimeAdapter** to avoid fragmentation.

### 2. Clarify Gameplay vs Visual Data
Corruption data currently lives in both `userData.gameplay.*` and `userData.metrics.*`. Choose one canonical location.

### 3. Document Material Modification
**CorruptionDesaturationIntegrationPatch.js** should document its direct material writes and potential conflicts.

### 4. Consider Adapter Consolidation
**CompetitionDominanceAdapter_v1.js** could potentially use MetricRuntimeAdapter for its userData writes instead of writing directly.

### 5. Audit Event Flow
Cascade bridges use different event patterns. Consider standardizing event emission format.

---

## CONCLUSION

The ATOMA codebase contains **9 bridge/adapter/patch systems** that serve as middleware layers between core metrics and visual systems. All systems are pure data transformers without their own render loops.

**Write Distribution:**
- 3 systems write to `userData.runtime.*` (via MetricRuntimeAdapter)
- 1 system writes to `userData.gameplay.*`
- 1 system writes to `userData.harmony*`
- 1 system writes to `userData.dominanceVisuals.*`
- 1 system writes directly to `material.color`
- 2 systems delegate to external systems (no userData writes)

**Overall Assessment:** Well-structured middleware layer with clear separation of concerns. Primary risk is direct material modification in CorruptionDesaturationIntegrationPatch.js, which may conflict with other color systems.

---

**Audit Complete** ✅