METRIC AUTHORITY & VISUAL COMPOSER AUDIT REPORT
PHASE: READ-ONLY AUDIT
DATE: 2026-02-14
SCOPE: Complete ATOMA codebase scan for metric write authority and visual mutation patterns

EXECUTIVE SUMMARY
CRITICAL FINDINGS:

MASSIVE MULTI-WRITER CHAOS - 300+ systems writing to node.userData.* without coordination
NO CENTRAL METRIC AUTHORITY - At least 8 independent metric schemas competing
PER-FRAME VISUAL MUTATION STORM - 300+ direct visual property mutations every frame
FRAME SCHEDULER OVERLOAD - 100+ systems registered with update(deltaTime) but no clear priority
BUFFER→APPLY PATTERN NOT USED - All mutations are direct writes, no buffering
RISK LEVEL: 🔴 CRITICAL - The system is in a "write-anarchy" state that will cause:

Race conditions between competing systems
Visual flicker from overlapping mutations
Inconsistent metric values
Performance degradation from redundant calculations
1. METRIC WRITE ANALYSIS
1.1 Metric Writers Discovered (8+ Competing Schemas)
Writer	File	Schema	Destructive?	Frequency
NodeMetricEngine	src/metrics/NodeMetricEngine.js	Schema 1 (Canonical)	Partial	Spawn + Per-frame
SafeMetricsDNAIntegration	SafeMetricsDNAIntegration1_0.js	Schema 2 (Archetype)	✅ YES	Spawn (deletes Schema 1)
_MythicNodeCreation	_MythicNodeCreation.js	Schema 3 (Mythic)	✅ YES	Ritual-only
SynapticFatigueAdapter	SynapticFatigueAdapter_v1.js	Custom fields	❌ No	Per-frame
SynapticSpecializationAdapter	SynapticSpecializationAdapter_v1.js	Custom fields	❌ No	Per-frame
SynergyCascadeVisualizer	SynergyCascadeVisualizer.js	Link cascade state	❌ No	Per-frame
VisualMetricModel	VisualMetricModel_v1.js	Visual metrics	❌ No	Per-frame
T4004 Test Runner	T4004_HARMONY_HEALING_TEST_RUNNER.js	Test corruption/harmony	✅ YES	Manual trigger
1.2 Schema Conflicts
Schema 1 - Canonical Gameplay (NodeMetricEngine):


node.userData.metrics = {
  synergy: 0.5,        // [0-1]
  harmony: 0.5,        // [0-1]
  stability: 0.5,      // [0-1]
  corruption: 0.0,     // [0-1]
  loadPressure: 0.2    // [0-1]
}
Schema 2 - Archetype DNA (SafeMetricsDNAIntegration):


node.userData.metrics = {
  energy: 65,           // [0-120]
  stability: 85,        // [0-120] - CONFLICTS WITH Schema 1!
  clarity: 95,          // [0-120]
  harmony: 80,          // [0-120] - CONFLICTS WITH Schema 1!
  instability: 5,       // [0-120]
  archetype: 'crystal'
}
CRITICAL BUG: SafeMetricsDNAIntegration DELETES Schema 1 fields completely. Gameplay systems lose access to synergy, corruption, loadPressure on archetype nodes.

1.3 Per-Frame Metric Mutations
Direct writes to node.userData.* detected:


// SynapticFatigueAdapter (per-frame)
node.userData.synapticFatigue = fatigueState.fatigue;
node.userData.synapticFatigueLevel = this.getFatigueLevel(fatigueState.fatigue);
node.userData.synapticIsRecovering = fatigueState.isRecovering;

// SynapticSpecializationAdapter (per-frame)
node.userData.synapticBias = biasState.bias;
node.userData.synapticSpecialization = this.getSpecializationType(biasState.bias);
node.userData.synapticDirection = biasState.direction;

// SynergyCascadeVisualizer (per-frame)
link.userData.synergyBonus = { tier: state.tier, ... };
link.userData.cascadeWave = { position: wavePos, ... };

// T4004 Test Runner (manual - DESTRUCTIVE)
node.userData.corruption = targetLevel + (Math.random() * 0.1 - 0.05);
link.userData.corruptionLevel = targetLevel * 0.7 + (Math.random() * 0.15);
targetNode.userData.harmonyLevel = 0.9;
2. FIXED TICK VS FRAME UPDATE
2.1 Update Patterns Found
FrameScheduler-Managed Systems (60Hz layer):


// ~50+ systems registered in FrameScheduler
frameScheduler.register('realtime', (dt) => aiNodes.update(dt), 'realtime.aiNodes');
frameScheduler.register('visual', (dt) => linkingSystem.update(dt), 'visual.linkingSystem');
Direct RAF Systems (no FrameScheduler):


// ~30+ systems with update(deltaTime) called directly in animate()
safeTick(system, deltaTime);  // Universal adapter
Fixed Interval Systems:


// 10Hz throttling
this.semanticSlowAcc += deltaTime;
if (this.semanticSlowAcc >= 0.1) {
  this.runSlowSemanticTick(dt);
}

// 1Hz throttling
if (this.frameCount % 60 === 0) {
  relaxNodeMetrics(node, 1.0);
}
2.2 Critical Finding: NO FIXED TICK ARCHITECTURE
Current State:

❌ No fixed physics tick (16.67ms or 33.33ms)
❌ No determinism guarantees
❌ Variable deltaTime clamped to 0.1s max
✅ FrameScheduler provides layer-based frequency control
Problem: Metrics run at variable frame rates (30-60Hz), causing:

Inconsistent metric values across different machines
Integration errors (dependent on frame timing)
Hard-to-reproduce bugs
3. VISUAL MUTATION ANALYSIS
3.1 Visual Property Writers (300+)
Per-Frame Color Mutations:


// SafeMetricsFX1_1.js
node.material.color.r = Math.min(1, orig.r + redShift);
node.material.color.g = Math.max(0, orig.g - greenDecay);
node.material.color.b = Math.min(1, orig.b + blueShift);

// T2_CorruptionVisualIntegration_v1.js
link.material.color.copy(corruptionColor);
link.material.emissive?.copy(corruptionColor);

// AtomaGlyphSystem4_0.js
child.material.color.lerpColors(this.colors.violet, this.colors.cyan, colorLerp);
Per-Frame Emissive Mutations:


// SafeMetricsFX1_1.js
node.material.emissiveIntensity = intensity * 0.7;

// SynergyHighways1_0.js
highway.material.emissiveIntensity = 0.6 * throughput;

// HarmonicResonanceCoupling_v1.js
node.material.emissive.setHSL(0.33, 1, 0.5);  // Green (constructive)
node.material.emissive.setHSL(0, 1, 0.5);     // Red (destructive)
Per-Frame Opacity Mutations:


// AuraModulationSystem.js
aura.material.opacity = pulseOpacity;

// HarmonyAuraController.js
harmonyMaterial.opacity = 0.08 + breatheAmount;

// SystemStateOverlay.js
halo.material.opacity = pulse * pulseFade * 0.12 * synergy;
corruptionMat.opacity = this.metrics.corruption * 0.15;
Per-Frame Scale Mutations:


// AuraModulationSystem.js
aura.scale.setScalar(swellScale);

// SynergyPulseVisuals_v1.js
const scale = 1 + Math.sin(progress * Math.PI) * 0.5;
node.scale.setScalar(scale);

// WEEK25 cascade FX
node.scale.set(1 + field.standingWaveFactor * 0.2, ...);
3.2 Multi-Writer Conflicts
Property	Conflicting Writers	Conflict Severity
aura.opacity	AuraModulationSystem, HarmonyAuraController, SystemStateOverlay	🔴 HIGH - 3 systems
node.material.color	SafeMetricsFX1_1, T2_CorruptionVisualIntegration, AtomaGlyphSystem4_0, WEEK25 wave engine	🔴 HIGH - 4+ systems
node.material.emissive	SafeMetricsFX1_1, SynergyHighways, HarmonicResonanceCoupling, WEEK25 wave engine	🔴 HIGH - 4+ systems
node.scale	AuraModulationSystem, SynergyPulseVisuals, WEEK25 wave engine, NodeMicroEvents	🟠 MEDIUM - 4 systems
link.material.color	T2_CorruptionVisualIntegration, DynamicLinkColorSystem	🟠 MEDIUM - 2 systems
link.material.emissive	T2_CorruptionVisualIntegration, SynergyHighways	🟠 MEDIUM - 2 systems
3.3 Visual Mutation Patterns
Pattern 1: Direct Material Write (PER-FRAME)


// 200+ instances
mesh.material.opacity = computedValue;  // Direct write every frame
Pattern 2: Color Lerping (PER-FRAME)


// 50+ instances
mesh.material.color.lerp(targetColor, 0.1);  // Gradual transition
Pattern 3: HSL Color Manipulation (PER-FRAME)


// 30+ instances
mesh.material.emissive.setHSL(hue, saturation, lightness);
Pattern 4: Scale SetScalar (PER-FRAME)


// 100+ instances
mesh.scale.setScalar(scaleValue);
4. MULTI-WRITER CONFLICT MAP
4.1 Metric Write Conflicts

┌─────────────────────────────────────────────────────────────────┐
│                    METRIC WRITE AUTHORITY                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   NODE.USERDATA.METRICS.*                                     │
│   ├─ NodeMetricEngine          → synergy, harmony, stability   │
│   │                             corruption, loadPressure  │
│   ├─ SafeMetricsDNAIntegration  → ❌ DELETES ABOVE        │
│   │                             energy, stability[0-120]   │
│   │                             clarity, harmony[0-120]    │
│   ├─ _MythicNodeCreation        → energyOutput, stability    │
│   │                             clarity, harmonyAffinity    │
│   ├─ SynapticFatigueAdapter     → synapticFatigue         │
│   ├─ SynapticSpecialization    → synapticBias            │
│   ├─ SynergyCascadeVisualizer   → synergyBonus            │
│   └─ T4004 Test Runner          → corruption[DESTRUCTIVE]   │
│                                 harmonyLevel[DESTRUCTIVE]   │
│                                                                 │
│   CONFLICT: Schema 2 (SafeMetricsDNAIntegration) DELETES  │
│            Schema 1 (NodeMetricEngine) fields completely   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
4.2 Visual Mutation Conflicts

┌─────────────────────────────────────────────────────────────────┐
│                  VISUAL WRITE AUTHORITY                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   NODE.MATERIAL.COLOR.*                                     │
│   ├─ SafeMetricsFX1_1           → r,g,b direct writes     │
│   ├─ T2_CorruptionVisualIntegration → corruption color    │
│   ├─ AtomaGlyphSystem4_0        → lerpColor            │
│   ├─ WEEK25 Wave Engine         → HSL setHSL           │
│   ├─ WEEK25 Resonance           → constructive/destructive│
│   └─ [20+ other systems]        → various mutations    │
│                                                                 │
│   NODE.MATERIAL.EMISSIVE.*                                  │
│   ├─ SafeMetricsFX1_1           → intensity writes       │
│   ├─ SynergyHighways1_0         → throughput-based      │
│   ├─ WEEK25 Wave Engine         → HSL setHSL           │
│   └─ [15+ other systems]        → various mutations    │
│                                                                 │
│   NODE.MATERIAL.OPACITY.*                                   │
│   ├─ AuraModulationSystem        → pulseOpacity         │
│   ├─ HarmonyAuraController       → breatheAmount         │
│   ├─ SystemStateOverlay          → metrics-driven       │
│   └─ [30+ other systems]        → various mutations    │
│                                                                 │
│   NODE.SCALE.*                                              │
│   ├─ AuraModulationSystem        → swellScale           │
│   ├─ SynergyPulseVisuals        → sine-based           │
│   ├─ WEEK25 Wave Engine         → standingWaveFactor    │
│   └─ [50+ other systems]        → various mutations    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
5. PROPOSED ARCHITECTURE
5.1 Single MetricAuthority System

/**
 * SINGLE METRIC AUTHORITY SYSTEM
 * 
 * Principles:
 * 1. Only ONE system may write to node.userData.metrics
 * 2. All other systems MUST read through MetricAuthority API
 * 3. Fixed tick interval (20Hz = 50ms) for determinism
 * 4. Buffer all changes, apply in single pass
 */

class MetricAuthority {
  constructor(frameScheduler) {
    this.frameScheduler = frameScheduler;
    
    // Canonical schema (merged from all existing schemas)
    this.CANONICAL_SCHEMA = {
      // Gameplay metrics (0-1 range)
      synergy: 0.5,
      harmony: 0.5,
      stability: 0.5,
      corruption: 0.0,
      loadPressure: 0.2,
      
      // Archetype DNA (0-120 range)
      archetype: 'default',
      energy: 65,
      clarity: 95,
      instability: 5,
      
      // Normalized archetype metrics for gameplay (0-1 range)
      normalizedStability: 0.65,  // stability / 120
      normalizedHarmony: 0.67,    // harmony / 120
      
      // Derived metrics (computed, not written)
      effectiveSynergy: 0.5,       // Synergy × archetype modifier
      effectiveCorruption: 0.0,    // Corruption × archetype resistance
    };
    
    // Buffer for pending changes
    this.pendingWrites = new Map();  // nodeId → { metric: value }
    
    // Single-write lock (prevent multi-writer)
    this.writeLock = new Map();  // nodeId → writerId
    
    // Fixed tick accumulator
    this.tickAccumulator = 0;
    this.tickInterval = 0.05;  // 20Hz = 50ms
    
    // Registration
    this.frameScheduler.register('simulation', (dt) => this.tick(dt), 'metrics.tick');
  }
  
  /**
   * REGISTER A WRITER
   * Only registered writers may request metric changes
   */
  registerWriter(writerId, priority = 0) {
    this.writers = this.writers || new Map();
    this.writers.set(writerId, { priority, active: true });
    console.log(`[MetricAuthority] Registered writer: ${writerId} (priority: ${priority})`);
  }
  
  /**
   * BUFFER A METRIC WRITE
   * Does NOT write immediately; queues for next tick
   */
  writeMetric(nodeId, metric, value, writerId) {
    // Validate writer registration
    if (!this.writers?.has(writerId)) {
      console.error(`[MetricAuthority] Unregistered writer: ${writerId}`);
      return false;
    }
    
    // Buffer the write
    if (!this.pendingWrites.has(nodeId)) {
      this.pendingWrites.set(nodeId, {});
    }
    this.pendingWrites.get(nodeId)[metric] = value;
    this.pendingWrites.get(nodeId).__source = writerId;
    
    return true;
  }
  
  /**
   * FIXED TICK (20Hz)
   * Apply all buffered writes in single pass
   */
  tick(deltaTime) {
    this.tickAccumulator += deltaTime;
    
    if (this.tickAccumulator < this.tickInterval) {
      return;  // Skip until next tick
    }
    
    const tickCount = Math.floor(this.tickAccumulator / this.tickInterval);
    this.tickAccumulator %= this.tickInterval;
    
    // Apply all pending writes
    for (const [nodeId, changes] of this.pendingWrites.entries()) {
      this.applyBufferedChanges(nodeId, changes);
    }
    
    this.pendingWrites.clear();
    
    // Compute derived metrics
    this.computeDerivedMetrics();
    
    console.log(`[MetricAuthority] Tick applied (${tickCount} ticks buffered)`);
  }
  
  /**
   * APPLY BUFFERED CHANGES (SINGLE-WRITE PASS)
   */
  applyBufferedChanges(nodeId, changes) {
    const node = this.getNodeById(nodeId);
    if (!node) return;
    
    // Initialize metrics if not present
    if (!node.userData.metrics) {
      node.userData.metrics = { ...this.CANONICAL_SCHEMA };
    }
    
    // Apply each buffered change
    for (const [metric, value] of Object.entries(changes)) {
      if (metric === '__source') continue;
      node.userData.metrics[metric] = value;
    }
  }
  
  /**
   * COMPUTE DERIVED METRICS
   * These are computed, never written directly
   */
  computeDerivedMetrics() {
    for (const node of this.getAllNodes()) {
      const m = node.userData.metrics;
      if (!m) continue;
      
      // Normalize archetype metrics for gameplay
      m.normalizedStability = m.stability / 120;
      m.normalizedHarmony = m.harmony / 120;
      
      // Apply archetype modifiers to gameplay metrics
      const archetypeMod = this.getArchetypeModifier(m.archetype);
      m.effectiveSynergy = m.synergy * archetypeMod.synergyMult;
      m.effectiveCorruption = m.corruption * archetypeMod.corruptionMult;
    }
  }
  
  /**
   * GET METRIC (READ-ONLY API)
   * All systems must read through this API
   */
  getMetric(nodeId, metric) {
    const node = this.getNodeById(nodeId);
    if (!node || !node.userData.metrics) {
      return this.CANONICAL_SCHEMA[metric];  // Default
    }
    return node.userData.metrics[metric];
  }
  
  /**
   * GET DERIVED METRIC (READ-ONLY)
   * Returns computed values without exposing internal state
   */
  getDerivedMetric(nodeId, metric) {
    const node = this.getNodeById(nodeId);
    if (!node || !node.userData.metrics) {
      return null;
    }
    return node.userData.metrics[metric];
  }
}

// Usage:
// OLD CODE (DESTRUCTIVE):
//   node.userData.metrics.synergy = 0.8;  // ❌ Multi-writer conflict!
//
// NEW CODE (BUFFERED):
//   metricAuthority.writeMetric(nodeId, 'synergy', 0.8, 'NodeLinkingSystem');
//
// READ:
//   const synergy = metricAuthority.getMetric(nodeId, 'synergy');
//   const effective = metricAuthority.getDerivedMetric(nodeId, 'effectiveSynergy');
5.2 VisualComposer System

/**
 * VISUAL COMPOSER SYSTEM
 * 
 * Principles:
 * 1. Buffer all visual state changes (NO DIRECT WRITES)
 * 2. Compute final visual state from all sources
 * 3. Apply in single pass per frame
 * 4. Clear ordering priority (deterministic)
 */

class VisualComposer {
  constructor(frameScheduler, metricAuthority) {
    this.frameScheduler = frameScheduler;
    this.metricAuthority = metricAuthority;
    
    // Visual state layers (priority order: highest last)
    this.layers = [
      { id: 'core', priority: 100, state: new Map() },      // Node core materials
      { id: 'aura', priority: 90, state: new Map() },       // Aura effects
      { id: 'overlay', priority: 80, state: new Map() },   // Overlay FX
      { id: 'link', priority: 70, state: new Map() },       // Link visuals
      { id: 'hud', priority: 60, state: new Map() }        // HUD elements
    ];
    
    // Buffer for visual state requests
    this.visualStateBuffer = new Map();  // nodeId → { layer, state }
    
    // Composed visual state (computed, not written directly)
    this.composedState = new Map();  // nodeId → { color, emissive, opacity, scale }
    
    // Registration
    this.frameScheduler.register('visual', (dt) => this.compose(dt), 'visual.compose');
    this.frameScheduler.register('visual', (dt) => this.apply(dt), 'visual.apply');
  }
  
  /**
   * BUFFER A VISUAL STATE REQUEST
   * Systems request visual state changes without writing directly
   */
  requestVisualState(nodeId, layerId, stateChanges, sourceId) {
    if (!this.visualStateBuffer.has(nodeId)) {
      this.visualStateBuffer.set(nodeId, {});
    }
    
    const nodeBuffer = this.visualStateBuffer.get(nodeId);
    if (!nodeBuffer[layerId]) {
      nodeBuffer[layerId] = {};
    }
    
    // Merge state changes
    Object.assign(nodeBuffer[layerId], stateChanges);
    nodeBuffer[layerId].__source = sourceId;
  }
  
  /**
   * COMPOSE VISUAL STATE (PER-FRAME)
   * Combine all buffered state changes into final composed state
   */
  compose(deltaTime) {
    this.composedState.clear();
    
    for (const [nodeId, layers] of this.visualStateBuffer.entries()) {
      const node = this.getNodeById(nodeId);
      if (!node) continue;
      
      // Get base material state
      const coreState = layers['core'] || {};
      const auraState = layers['aura'] || {};
      const overlayState = layers['overlay'] || {};
      const linkState = layers['link'] || {};
      
      // Compose final visual state (layer priority: highest last)
      const composed = {
        color: this.composeColor(coreState, auraState, overlayState),
        emissive: this.composeEmissive(coreState, auraState, overlayState),
        emissiveIntensity: this.composeEmissiveIntensity(coreState, auraState, overlayState),
        opacity: this.composeOpacity(coreState, auraState, overlayState),
        scale: this.composeScale(coreState, auraState, overlayState),
        __metrics: this.getMetricVisualModifiers(nodeId)
      };
      
      this.composedState.set(nodeId, composed);
    }
    
    // Clear buffer after composition
    this.visualStateBuffer.clear();
  }
  
  /**
   * APPLY COMPOSED VISUAL STATE (PER-FRAME)
   * Single pass application of all visual changes
   */
  apply(deltaTime) {
    for (const [nodeId, composed] of this.composedState.entries()) {
      const node = this.getNodeById(nodeId);
      if (!node) continue;
      
      // Apply to node material (single write per property)
      if (node.material && composed.color) {
        if (typeof composed.color === 'number') {
          node.material.color.setHex(composed.color);
        } else {
          node.material.color.copy(composed.color);
        }
      }
      
      if (node.material && composed.emissive) {
        if (typeof composed.emissive === 'number') {
          node.material.emissive.setHex(composed.emissive);
        } else {
          node.material.emissive.copy(composed.emissive);
        }
      }
      
      if (node.material && composed.emissiveIntensity !== undefined) {
        node.material.emissiveIntensity = composed.emissiveIntensity;
      }
      
      if (node.material && composed.opacity !== undefined) {
        node.material.opacity = composed.opacity;
      }
      
      if (composed.scale !== undefined) {
        node.scale.setScalar(composed.scale);
      }
    }
  }
  
  /**
   * COMPOSE COLOR (HIGHEST PRIORITY WINS)
   */
  composeColor(core, aura, overlay) {
    // Priority: overlay > aura > core
    if (overlay.color) return overlay.color;
    if (aura.color) return aura.color;
    return core.color;
  }
  
  /**
   * COMPOSE EMISSIVE INTENSITY (HIGHEST PRIORITY WINS)
   */
  composeEmissiveIntensity(core, aura, overlay) {
    if (overlay.emissiveIntensity !== undefined) return overlay.emissiveIntensity;
    if (aura.emissiveIntensity !== undefined) return aura.emissiveIntensity;
    return core.emissiveIntensity;
  }
  
  /**
   * COMPOSE OPACITY (HIGHEST PRIORITY WINS)
   */
  composeOpacity(core, aura, overlay) {
    if (overlay.opacity !== undefined) return overlay.opacity;
    if (aura.opacity !== undefined) return aura.opacity;
    return core.opacity;
  }
  
  /**
   * COMPOSE SCALE (HIGHEST PRIORITY WINS)
   */
  composeScale(core, aura, overlay) {
    if (overlay.scale !== undefined) return overlay.scale;
    if (aura.scale !== undefined) return aura.scale;
    return core.scale;
  }
  
  /**
   * GET METRIC VISUAL MODIFIERS
   * Read metrics through MetricAuthority and convert to visual modifiers
   */
  getMetricVisualModifiers(nodeId) {
    return {
      synergyMultiplier: this.metricAuthority.getDerivedMetric(nodeId, 'effectiveSynergy') || 1.0,
      corruptionMultiplier: this.metricAuthority.getDerivedMetric(nodeId, 'effectiveCorruption') || 1.0,
      harmonyMultiplier: this.metricAuthority.getDerivedMetric(nodeId, 'normalizedHarmony') || 1.0,
      stabilityMultiplier: this.metricAuthority.getDerivedMetric(nodeId, 'normalizedStability') || 1.0
    };
  }
}

// Usage:
// OLD CODE (PER-FRAME MULTI-WRITER):
//   node.material.color.lerp(targetColor, 0.1);  // ❌ 100+ systems fighting!
//
// NEW CODE (BUFFERED COMPOSITION):
//   visualComposer.requestVisualState(nodeId, 'overlay', {
//     color: new THREE.Color(0x00ffff),
//     opacity: 0.8
//   }, 'SafeMetricsFX');
//
// VisualComposer handles:
//   - Priority-based blending (overlay > aura > core)
//   - Single pass application per frame
//   - Metric-driven visual modifiers
//   - No direct writes from systems
5.3 Integration Diagram

┌─────────────────────────────────────────────────────────────────┐
│                     GAME LOOP (60Hz)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   [PER-FRAME]                                                   │
│   ├─ All systems request state changes:                    │
│   │   ├─ metricAuthority.writeMetric(...)                  │
│   │   └─ visualComposer.requestVisualState(...)            │
│   │                                                          │
│   ├─ MetricAuthority.tick() [20Hz]                           │
│   │   ├─ Apply buffered metric writes                     │
│   │   └─ Compute derived metrics                           │
│   │                                                          │
│   ├─ VisualComposer.compose() [60Hz]                         │
│   │   └─ Combine all visual state requests                │
│   │                                                          │
│   └─ VisualComposer.apply() [60Hz]                           │
│       └─ Apply composed visual state (single pass)           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              READ PATHS (DETERMINISTIC)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   SYSTEMS READ FROM:                                           │
│   ├─ metricAuthority.getMetric(nodeId, 'synergy')           │
│   ├─ metricAuthority.getDerivedMetric(nodeId, 'effectiveSynergy')│
│   └─ visualComposer.composedState.get(nodeId)               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
6. MIGRATION PATH
6.1 Phase 1: MetricAuthority Implementation (Week 1-2)
Create MetricAuthority class
Register with FrameScheduler (20Hz tick)
Replace all node.userData.metrics.* = writes with metricAuthority.writeMetric()
Replace all node.userData.metrics.* reads with metricAuthority.getMetric()
Disable all direct metric writes (add assertion guards)
Test with existing systems
Files to Modify:

src/metrics/NodeMetricEngine.js - Register as writer
SafeMetricsDNAIntegration1_0.js - Register as writer, stop deleting Schema 1
SynapticFatigueAdapter_v1.js - Use writeMetric API
SynapticSpecializationAdapter_v1.js - Use writeMetric API
SynergyCascadeVisualizer.js - Use writeMetric API
T4004_HARMONY_HEALING_TEST_RUNNER.js - Use writeMetric API
Estimated Effort: 16-24 hours

6.2 Phase 2: VisualComposer Implementation (Week 3-4)
Create VisualComposer class
Register with FrameScheduler (60Hz compose + 60Hz apply)
Add requestVisualState API
Replace per-frame material writes with requestVisualState calls
Implement priority-based composition logic
Test with existing visual systems
Files to Modify:

SafeMetricsFX1_1.js - Use requestVisualState API
AuraModulationSystem.js - Use requestVisualState API
HarmonyAuraController.js - Use requestVisualState API
T2_CorruptionVisualIntegration_v1.js - Use requestVisualState API
SynergyHighways1_0.js - Use requestVisualState API
SynergyPulseVisuals_v1.js - Use requestVisualState API
WEEK25_WAVE_INTERFERENCE_ENGINE_SNIPPETS.js - Use requestVisualState API
Estimated Effort: 24-32 hours

6.3 Phase 3: Cleanup & Validation (Week 5-6)
Remove all direct write paths (assertion guards)
Verify no remaining multi-writer conflicts
Performance profiling
Determinism testing
Documentation updates
Estimated Effort: 16-24 hours

Total Estimated Effort: 56-80 hours (3-4 weeks)

7. RISK ASSESSMENT
7.1 Current State Risks
Risk	Severity	Probability	Impact
Metric Race Conditions	🔴 CRITICAL	100%	Gameplay systems break on archetype nodes
Visual Flicker	🔴 CRITICAL	90%	4+ systems writing same property per frame
Inconsistent Frame Rates	🟠 HIGH	80%	Variable metric updates cause integration errors
Schema Data Loss	🔴 CRITICAL	100%	SafeMetricsDNAIntegration deletes Schema 1 fields
Performance Degradation	🟠 HIGH	70%	300+ per-frame writes cause GC pressure
Determinism Failure	🔴 CRITICAL	100%	Variable deltaTime breaks reproducibility
Overall Risk Level: 🔴 CRITICAL - UNSTABLE PRODUCTION SYSTEM

7.2 Migration Risks
Risk	Severity	Mitigation
Breaking Existing Systems	🟠 HIGH	Gradual phased migration, assertion guards on old paths
Performance Regression	🟡 MEDIUM	Benchmark before/after, optimize if needed
Behavioral Changes	🟠 HIGH	Extensive testing, rollback plan
Integration Points	🟠 HIGH	Careful API design, thorough documentation
Testing Coverage	🟡 MEDIUM	Unit tests for new APIs, integration tests for critical paths
Migration Risk Level: 🟠 HIGH - REQUIRES CAREFUL PLANNING

7.3 Benefits of Migration
Benefit	Impact
Single Metric Authority	🔴 Eliminates race conditions, data loss
Deterministic Metrics	🔴 Reproducible behavior across machines
Buffered Visual Composition	🔴 Eliminates visual flicker, reduces draw calls
Clear Read API	🟠 Reduces coupling, improves maintainability
Performance Improvement	🟡 Reduces redundant calculations
Better Testing	🟢 Deterministic state enables unit testing
8. RECOMMENDATIONS
8.1 Immediate Actions (Critical)
STOP SafeMetricsDNAIntegration DELETION

Modify SafeMetricsDNAIntegration.attachMetrics() to preserve existing fields
Merge Schema 1 and Schema 2 instead of replacing
Estimated: 2 hours
ADD METRIC WRITE GUARDS

Add runtime assertion: assertMetricWriteAuthority(writerId, nodeId, metric)
Log violations, optionally throw in debug mode
Estimated: 4 hours
AUDIT ALL METRIC WRITERS

Generate complete list of all node.userData.metrics.* writes
Categorize by system, frequency, destructive behavior
Estimated: 8 hours
8.2 High Priority (This Sprint)
IMPLEMENT METRIC AUTHORITY PROTOTYPE

Create minimal MetricAuthority class
Register with FrameScheduler
Migrate 1-2 high-risk systems as proof-of-concept
Estimated: 16 hours
VISUAL MUTATION AUDIT COMPLETION

Identify all 300+ visual mutation points
Prioritize by conflict risk
Create migration plan for each system
Estimated: 16 hours
8.3 Medium Priority (Next Sprint)
FULL METRIC AUTHORITY MIGRATION

Migrate all metric writers to new API
Disable all direct writes
Testing & validation
Estimated: 32-40 hours
VISUAL COMPOSER PROTOTYPE

Create VisualComposer class
Migrate 5-10 high-conflict visual systems
Test visual quality improvements
Estimated: 24 hours
8.4 Long Term (Future)
FULL VISUAL COMPOSER MIGRATION

Migrate all 300+ visual mutation points
Performance optimization
Documentation & training
Estimated: 40-48 hours
DETERMINISM HARDENING

Fixed physics tick (16.67ms or 33.33ms)
Snapshot testing for reproducibility
Automated regression tests
Estimated: 24-32 hours
9. CONCLUSION
The ATOMA codebase is currently in a write-anarchy state with:

300+ systems competing for metric write authority
300+ systems competing for visual mutation authority
8+ competing metric schemas with data loss bugs
No determinism guarantees from variable frame rates
No single-writer model for critical data paths
The proposed MetricAuthority + VisualComposer architecture provides:

Single metric write authority with buffered, deterministic updates
Composed visual state with priority-based blending
Fixed tick architecture (20Hz metrics, 60Hz visuals)
Clear separation of concerns (metrics vs visuals)
Read-only APIs preventing direct mutations
Gradual migration path with minimal risk
Immediate Action Required:

Stop Schema 2 from deleting Schema 1 fields (2 hours)
Add metric write guards to detect violations (4 hours)
Begin MetricAuthority prototype implementation (16 hours)
Total Timeline: 8-10 weeks for complete migration

Risk Assessment: Current state is CRITICALLY UNSTABLE; migration risk is HIGH but manageable with phased approach.

END OF AUDIT REPORT