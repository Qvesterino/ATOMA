# ATOMA NODE SCALE INFLUENCE AUDIT
**PHASE VD-AUDIT-1 – Scale Influence Scan**

Generated: 2026-02-07

---

## SUMMARY

This audit identifies ALL code paths that modify node/mesh scale across the ATOMA codebase. Scale modifications are categorized by timing (per-frame vs event-based) and filtered for targets: `node`, `mesh`, `coreMesh`, `nodeModel`, `visual.node`.

**Total Findings:** 50+ scale modification sites across 25+ files

---

## PER-FRAME SCALE MODIFICATIONS

### 1. NodePersonalitySystem2_0.js

**Target:** `node` (AI nodes)

| Function | Scale Operation | Condition | Frequency |
|----------|----------------|-----------|------------|
| `applyCalmAnalystMotion()` | `node.scale.setScalar(breathScale * 0.9)` | Personality type = CALM_ANALYST | Every frame |
| `applyHarmonyKeeperMotion()` | `node.scale.setScalar(...)` | Personality type = HARMONY_KEEPER | Every frame |
| `applyRadiantOptimizerMotion()` | `node.scale.setScalar(pulseScale * 0.9)` | Personality type = RADIANT_OPTIMIZER | Every frame |
| `applyFractalDreamerMotion()` | `node.scale.setScalar(scaleVar * 0.9)` | Personality type = FRACTAL_DREAMER | Every frame |
| `applyQuantumTricksterMotion()` | `node.scale.setScalar(quantumScale * 0.9)` | Personality type = QUANTUM_TRICKSTER | Every frame |
| `applyUmbraSentinelMotion()` | `node.scale.setScalar(breathScale * 0.9)` | Personality type = UMBRA_SENTINEL | Every frame |
| `applyEchoWandererMotion()` | `node.scale.setScalar(breathScale * 0.9)` | Personality type = ECHO_WANDERER | Every frame |
| `applyGlyphArchivistMotion()` | `node.scale.setScalar(pulseScale * 0.9)` | Personality type = GLYPH_ARCHIVIST | Every frame |
| `applyConvergenceNexusMotion()` | `node.scale.setScalar(breathScale * 0.9)` | Personality type = CONVERGENCE_NEXUS | Every frame |
| `applyAscendedMythicMotion()` | `node.scale.setScalar(pulseScale * 0.9)` | Personality type = ASCENDED_MYTHIC | Every frame |

**Pattern:** All personality motions use `node.scale.setScalar()` with 0.9 base scale multiplier, animated via sine waves on `state.breathPhase` or `state.pulsePhase`.

---

### 2. Various Visual Effect Files (Per-Frame)

| File | Target | Function | Condition | Timing |
|------|--------|----------|-----------|---------|
| `SafeQuantumIllusionsPack1.js` | `entry.mesh` | Pulse animation | Per-frame |
| `StandingWaveVisualRenderer_Session131.js` | `trapZoneMesh.mesh` | Zone radius update | Event-based (zone creation) |
| `SynergyCascadeVisualizer.js` | `particle.mesh`, `ripple.mesh` | Cascade effect | Per-frame during cascade |
| `WaveInterferencePatternSystem_Session132.js` | `meshItem.mesh` | Zone intensity | Per-frame |
| `TIER4_CorruptionFeedbackVisuals_v1.js` | `mesh` | Corruption effect | Event-based |

---

## EVENT-BASED SCALE MODIFICATIONS

### 3. _NodeMicroEvents.js

**Target:** `node` (visual.node)

| Event Type | Scale Operation | Function | Condition | Timing |
|------------|----------------|----------|-----------|---------|
| `breathing_shift` | `visual.node.scale.setScalar(breathScale)` | `updateVisualByType()` | Micro-event trigger (12-35s intervals) |
| `synchronized_pulse` | `visual.node.scale.setScalar(syncScale)` | `updateVisualByType()` | Micro-event trigger (12-35s intervals) |
| `balanced_oscillation` | `visual.node.scale.setScalar(oscScale)` | `updateVisualByType()` | Micro-event trigger (12-35s intervals) |
| `jitter_burst` | `visual.node.position` offset (indirect scale visual) | `updateVisualByType()` | High stability metric event |
| `harmony_ring` | `ring.scale.setScalar(harmonyScale)` | `updateVisualByType()` | High harmony metric event |

**Pattern:** Event-driven, timed micro-events (12-35s random intervals), scale calculated from `baseScale` with sine wave progress.

---

### 4. NodeLinkingSystem.js

**Target:** `mesh`, `pulse`, `ring`, `particle` (link visual elements)

| Context | Scale Operation | Function | Condition | Timing |
|----------|----------------|----------|-----------|---------|
| Link creation success | `pulse.scale.setScalar(scale)` | `createLinkSuccessPulse()` | Link creation event (0.5s duration) |
| Link creation success | `pulse.scale.set(scale, scale, 1)` | `createLinkSuccessPulse()` | Link creation event (0.5s duration) |
| Link removal | `pulse.scale.setScalar(scale)` | `createLinkRemovalPulse()` | Link removal event (0.4s duration) |
| Link removal | `pulse.scale.set(scale, scale, 1)` | `createLinkRemovalPulse()` | Link removal event (0.4s duration) |
| Incompatibility warning | `ring.scale.setScalar(scale)` | `createIncompatibilityWarning()` | Denied link event (0.3s duration) |
| Traffic particles | `particle.scale.setScalar(scale)` | `updateLinkAnimations()` | Per-frame during active link |
| Energy pulse | `link.energyPulse.scale.setScalar(pulseScale)` | `updateLinkAnimations()` | Per-frame during active link |
| Multi-output glows | `glowMesh.scale` updates | `updateMultiOutputGlows()` | Per-frame |

**Pattern:** Link visual effects are short-lived (0.3-0.5s), traffic/particle animations run per-frame while link active.

---

### 5. Node State Transitions

| File | Target | Operation | Condition | Timing |
|------|--------|-----------|-----------|---------|
| `NodeStateMachine_v1.js` | `node.scale` | Spawn fade-in | Spawn event (1-2s transition) |
| `NodeStateMachine_v1.js` | `node.scale.set(1,1,1)` | State reset | Event-based |
| `_NodeEvolution2_0.js` | `node.scale.setScalar(scale)` | Evolution stage change | Event-based (evolution) |
| `_RareNodeSpawner.js` | `node.scale.set(0.1,0.1,0.1)` | Spawn initialization | Spawn event |
| `_MythicNodeCreation.js` | `nodeModel.scale.setScalar(...)` | Mythic node creation | Spawn event |
| `AINodes.js` | `node.scale.setScalar(0)` | Materialization start | Spawn event (fade-in) |
| `AINodes.js` | `node.scale.setScalar(0.9 * easeProgress)` | Materialization progress | Per-frame during materialization |

---

### 6. Link Visual Effects (Scale Operations)

| File | Target | Operation | Function | Timing |
|------|--------|-----------|----------|---------|
| `LinkAuraSystem_v1.js` | `instance.mesh.scale` | Bézier curve + breathing | Per-frame |
| `LinkRendererConduit.js` | `grp.scale.setScalar(data.maxScale * ease)` | Link visual creation | Event-based (creation animation) |
| `LinkPulseRing.js` | `visual.scale.setScalar(baseScale * oscillation)` | Pulse animation | Per-frame |
| `LinkMicroImpulseAdapter.js` | `visual.scale.setScalar(scale)` | Impulse creation | Event-based (short-lived) |
| `LinkHealingParticleSystem.js` | `mesh.scale.setScalar(currentScale)` | Healing particle | Event-based (particle lifecycle) |
| `LinkEnergyRingSystem.js` | `sprite.scale.set(...)` | Energy ring | Event-based |
| `AnimatedLinkFlow.js` | `packet.mesh.scale.setScalar(...)` | Flow packet animation | Per-frame |
| `LinkSemanticPictogramSystem.js` | `pulse.mesh.scale.setScalar(size)` | Pictogram pulse | Event-based |

---

### 7. Special Node Effects

| File | Target | Operation | Condition | Timing |
|------|--------|-----------|-----------|---------|
| `QuantumNode.js` | `this.orb.scale.setScalar(1.0 + pulseFactor * 0.15)` | Quantum node pulse | Per-frame |
| `SigmaNode.js` | `glowMesh.scale` updates | Sigma node effects | Per-frame |
| `ProcessEnhancedVariants_Session81.js` | `visual.scale.setScalar(scale)` | Process node variant | Per-frame (conditional) |
| `PulseIntersectionImpulseAdapter_v1.js` | `node.scale.set(scaleFactor, ...)` | Intersection event | Event-based |

---

### 8. Input/Sensory Effects

| File | Target | Operation | Condition | Timing |
|------|--------|-----------|-----------|---------|
| `InputSensoryAnimationPatch.js` | `node.scale.set(...)` | Input sensory animation | Per-frame during input |
| `_WorldPersonalityController.js` | `visual.object.scale.setScalar(scale)` | World personality | Per-frame (event-gated) |

---

### 9. Visual Template Implementations

| File | Target | Operation | Timing |
|------|--------|-----------|---------|
| `VisualTemplateReferenceImplementations.js` | `node.scale.set(...)` | Template-based animations |
| `_NodeVisuals4_0.js` | `child.scale.set(...)` | Visual children animations | Per-frame |
| `_NewNodeCategoryVisuals.js` | `visual.node.scale.setScalar(...)` | Category-specific animations | Per-frame |
| `_ProceduralMeaningEngine.js` | `child.scale.set(...)` | Procedural animations | Per-frame |

---

## SCALE.X / SCALE.Y / SCALE.Z ASSIGNMENTS

### Direct Axis Modifications

| File | Target | Axis Assignment | Condition | Timing |
|------|--------|----------------|-----------|---------|
| `SynergyPulseVisuals_v1.js` | `node` | `scale.x/y/z = originalScale * pulse` | Per-frame |
| `_AmbientEntityManager.js` | `mesh` | `scale.y = 1 + Math.sin(...) * 0.2` | Per-frame (distance < 15) |
| `_ExtremeNodeArchetypes_SafePack.js` | `point` | `scale.z = 2` | Initialization (event) |
| `_RecursiveGlyphMessaging4_0.js` | `core` | `scale.x = 1 + wobbleAmount` | Per-frame |
| `_RecursiveGlyphMessaging4_0.js` | `core` | `scale.z = 1 - wobbleAmount * 0.5` | Per-frame |
| `_EmergentThoughtStorms5_0.js` | `glyph` | `scale.z = 1.0 + breathe` | Per-frame |
| `_AIThoughtStorms2_0.js` | `arc` | `scale.y = 0.8 + Math.sin(...) * 0.2` | Per-frame |
| `NeonLinkVisuals.js` | `child` | `scale.y = 1.3` (stretch) | Corruption-based |
| `EnhancedNodeModels.js` | `child` | `scale.x/y/z = baseScale * (1.0 ± wave * 0.5)` | Per-frame |

---

## CRITICAL FINDINGS

### 1. Multiple Per-Frame Systems Modifying Node Scale
- **NodePersonalitySystem2_0.js** applies per-frame scale to ALL nodes based on personality
- **InputSensoryAnimationPatch.js** applies per-frame scale during input events
- **Various visual systems** apply per-frame scale to node children

**Risk:** Potential scale conflicts if multiple systems modify same node simultaneously.

---

### 2. Base Scale Assumption
Most systems assume a base scale of 0.9 or 1.0:
- NodePersonalitySystem2_0: `node.scale.setScalar(xxx * 0.9)`
- AINodes: `node.scale.setScalar(0.9)`
- Many VFX systems use scale relative to node current scale

**Risk:** Scale drift if base assumptions don't match actual node scale.

---

### 3. Event-Based Scale Reset Pattern
Several systems reset scale to (1,1,1) or base scale:
- NodeStateMachine_v1.js: `node.scale.set(1,1,1)` on state exit
- _NodeMicroEvents.js: `visual.node.scale.setScalar(visual.originalScale)` on cleanup

**Pattern:** Safe restoration pattern - prevents scale drift.

---

### 4. No Central Scale Authority
No single system is the definitive authority for node scale:
- NodePersonalitySystem2_0 applies per-frame personality animations
- _NodeMicroEvents applies event-based micro-events
- InputSensoryAnimationPatch applies input-driven animations
- Various VFX systems apply visual effects

**Risk:** Uncoordinated scale modifications, potential visual conflicts.

---

## RECOMMENDATIONS

### 1. Establish Scale Authority System
Create a centralized `NodeScaleAuthority` that:
- Is the single source of truth for node scale
- Coordinates between all scale-modifying systems
- Uses a priority system: events override per-frame, cleanup restores base

### 2. Add Scale Mutation Guards
Similar to existing visual mutation guards in NodeLinkingSystem.js:
```javascript
const scaleMutationGuards = {
  setNodeScale: (node, scale) => {
    if (node && typeof node === 'object' && node.scale) {
      node.scale.setScalar(scale);
      return true;
    }
    return false;
  }
};
```

### 3. Implement Scale Drift Detection
Add periodic validation to detect scale drift from base values:
```javascript
detectScaleDrift(node) {
  const baseScale = node.userData.baseScale || 0.9;
  const currentScale = node.scale.x;
  const drift = Math.abs(currentScale - baseScale);
  if (drift > 0.1) {
    console.warn('[ScaleDrift]', node.uuid, 'drift:', drift);
    // Auto-correct
    node.scale.setScalar(baseScale);
  }
}
```

### 4. Document Base Scale Conventions
- Standard base scale: 0.9
- Spawn scale: 0.1 → 0.9 (fade-in)
- Per-frame modulation range: ±0.1 to ±0.2
- Event pulse range: 0.5 to 2.0

---

## FILES AUDITED

### Per-Frame Scale Modifications (Primary)
1. NodePersonalitySystem2_0.js
2. InputSensoryAnimationPatch.js
3. _WorldPersonalityController.js
4. _NodeVisuals4_0.js
5. _NewNodeCategoryVisuals.js
6. _ProceduralMeaningEngine.js
7. SafeQuantumIllusionsPack1.js
8. QuantumNode.js
9. SigmaNode.js
10. ProcessEnhancedVariants_Session81.js

### Event-Based Scale Modifications
1. _NodeMicroEvents.js
2. NodeLinkingSystem.js
3. NodeStateMachine_v1.js
4. _NodeEvolution2_0.js
5. _RareNodeSpawner.js
6. _MythicNodeCreation.js
7. AINodes.js

### Link Visual Scale Modifications
1. LinkAuraSystem_v1.js
2. LinkRendererConduit.js
3. LinkPulseRing.js
4. LinkMicroImpulseAdapter.js
5. LinkHealingParticleSystem.js
6. LinkEnergyRingSystem.js
7. AnimatedLinkFlow.js
8. LinkSemanticPictogramSystem.js

### Direct Axis Assignments (.scale.x/y/z =)
1. SynergyPulseVisuals_v1.js
2. _AmbientEntityManager.js
3. _ExtremeNodeArchetypes_SafePack.js
4. _RecursiveGlyphMessaging4_0.js
5. _EmergentThoughtStorms5_0.js
6. _AIThoughtStorms2_0.js
7. NeonLinkVisuals.js
8. EnhancedNodeModels.js

---

## SCALE MODIFICATION PATTERNS

### Pattern A: Sine Wave Breathing (Most Common)
```javascript
const breathScale = 1.0 + Math.sin(phase) * amplitude;
node.scale.setScalar(breathScale * base);
```
**Used by:** NodePersonalitySystem2_0, _NodeMicroEvents, InputSensoryAnimationPatch

### Pattern B: Progress-Based Pulse
```javascript
const progress = Math.min(elapsed / duration, 1);
const pulseScale = 1 + Math.sin(progress * Math.PI) * amplitude;
mesh.scale.setScalar(pulseScale);
```
**Used by:** _NodeMicroEvents, NodeLinkingSystem

### Pattern C: Event Easing
```javascript
const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
const currentScale = baseScale + (maxScale - baseScale) * easeProgress;
node.scale.setScalar(currentScale);
```
**Used by:** AINodes, _MythicNodeCreation.js

### Pattern D: Direct Axis Modulation
```javascript
mesh.scale.x = baseScale.x * factor;
mesh.scale.y = baseScale.y * factor;
mesh.scale.z = baseScale.z * factor;
```
**Used by:** SynergyPulseVisuals_v1.js, EnhancedNodeModels.js

---

## PERFORMANCE IMPACT

### High-Per-Frame Systems (Every Frame)
- NodePersonalitySystem2_0.js: 10 personality types × all nodes
- InputSensoryAnimationPatch.js: Input-driven (may skip most frames)
- Link visual systems: Per-link animations

### Event-Driven Systems (12-35s Intervals)
- _NodeMicroEvents.js: Low frequency per-node events
- Link creation/removal events: User-driven frequency

### One-Time Events
- Spawn fade-in: 1-2s per node
- State transitions: Rare, short duration

---

## AUDIT COMPLETION

**Total Files Scanned:** 600+ JavaScript files
**Scale Modification Sites Found:** 50+
**Per-Frame Modifications:** 25+
**Event-Based Modifications:** 20+
**Direct Axis Assignments:** 8+

**Status:** ✅ Complete
**Confidence Level:** High (exhaustive search of .scale patterns)