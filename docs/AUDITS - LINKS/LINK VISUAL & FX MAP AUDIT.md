# LINK VISUAL & FX MAP AUDIT

---

## Executive Summary

**Architecture Classification**: Multi-layered with shared authority (moderate risk)

**Core Authority**:
- Link creation, ownership, and cleanup are centralized in `NodeLinkingSystem.js`
- Runtime visuals are layered inside `LinkRendererConduit` (core rope + pulse + beads/sparks/trails/aura/corruption/healing/directional streaks)
- Metrics feeding visuals: per-link `link.userData.synergy/corruption/quality/load` plus node metrics and global live metrics fallbacks

**Update Authority**:
- Multi-layered but routed through a single per-frame call chain
- Risk comes from many sub‑systems mutating materials in series and several legacy/optional add‑ons (corruption transmission, wave bridges, thickness, trails)

**Disposal**:
- Mostly centralized (NodeLinkingSystem.removeLink → conduit dispose + scene.remove)
- Orphan risk remains for optional add-ons not registered with the conduit

---

## Step 1 — Link Creation Map

| Step | File | Function | Responsibility | Attaches to Scene? |
|------|------|----------|---------------|-------------------|
| 1 | `NodeLinkingSystem.js` | `createLink()` | Instantiate link object + `link.group`, set userData, register indexes | Yes (`this.scene.add(link.group)`) |
| 2 | `LinkRendererConduit.js` | `registerLink(link)` | Build conduit geometry, materials, child visual layers, set variant locks | No (returns group already under link) |
| 3 | `NodeLinkingSystem.js` | `initializeLinkSynergyColor()` / `initializeParticleSynergyColors()` | Initial color based on metrics | Already attached |
| 4 | `NodeLinkingSystem.js` | `thicknessSystem.registerLinkCurve()` | Thickness visuals setup | Uses existing link group |
| 5 | `NodeLinkingSystem.js` | `flowSystem.registerLinkFlow()` (Animated flow) | Optional flow/particle layer init | Uses existing link group |
| 6 | `NodeLinkingSystem.js` | `linkSemanticPictograms.registerLink()` | Pictogram system registration | Uses existing link group |

---

## Step 2 — Link Visual Layer Map

### Core Conduit Layers

| Visual Layer | File | Owner System | Per-frame? | Uses deltaTime? | Reads Metrics? |
|--------------|------|--------------|------------|----------------|----------------|
| Conduit rope geometry | `LinkRendererConduit.js` | LinkRendererConduit | Yes | Yes | link positions |
| Pulse ring / energy wave | `LinkRendererConduit.js` (PulseRing, EnergyWave) | Conduit | Yes | Yes | link load/synergy |
| Directional streaks | `LinkDirectionalStreaks.js` | Conduit | Yes | Yes | synergy/flow |
| Aura (shader) | `shaders/LinkAuraShader.js` via Conduit | Conduit | Yes | Yes | link stress/load |
| Wave / shader bridge | `LinkEnergyWave.js`, `waveShaderBridge` (inside Conduit) | Conduit | Yes | Yes | load/synergy |

### Particle Systems

| Visual Layer | File | Owner System | Per-frame? | Uses deltaTime? | Reads Metrics? |
|--------------|------|--------------|------------|----------------|----------------|
| Beads | `LinkBeadSystem.js` via Conduit | Conduit | Yes | Yes | link traffic/synergy (via userData) |
| Sparks | `LinkSparkSystem.js` | Conduit | Yes | Yes | traffic/synergy |
| Trails | `LinkTrailParticleSystem.js` | Conduit | Yes | Yes | traffic/load |
| Bead trails | `LinkBeadTrailSystem.js` | Conduit | Yes | Yes | traffic |
| Corruption particles | `LinkCorruptionParticleSystem.js` | Conduit | Yes | Yes | link/user corruption |
| Healing particles | `LinkHealingParticleSystem.js` | Conduit | Yes | Yes | corruption inverse |

### FX & Overlays

| Visual Layer | File | Owner System | Per-frame? | Uses deltaTime? | Reads Metrics? |
|--------------|------|--------------|------------|----------------|----------------|
| Corruption overlay | `LinkCorruptionSpreadAnimator.js` | Conduit | Yes | Yes | link/user corruption |
| Visual echo trails | `VisualEchoTrails_v1_Integration.js` | Conduit | Yes | Yes | synergy/load |
| Energy rings | `LinkEnergyRingSystem.js` | Conduit | Yes | Yes | synergy/pulse |
| Point FX base | `LinkPointFXBase.js` | Conduit | Yes | Yes | visual profile data |

### Optional / Layered Systems

| Visual Layer | File | Owner System | Per-frame? | Uses deltaTime? | Reads Metrics? |
|--------------|------|--------------|------------|----------------|----------------|
| Thickness | `DynamicThicknessSystem` (via NodeLinkingSystem) | Thickness system | Yes | Yes | load / quality |
| Flow/Emission | `flowSystem.update(link, dt)` | Flow system | Yes | Yes | traffic/synergy |
| Animated link flow | `AnimatedLinkFlow.js` | Flow layer | Yes | Yes | link motion/traffic |
| Neon link visuals | `NeonLinkVisuals.js` | Core renderer | Yes | Yes | link state, synergy, corruption, flow |
| Link bead effects | `LinkBeadVisualEffects.js` | Bead enhancement | Yes | Yes | bead state |
| Link resonance flow | `LinkResonanceFlowSystem_Session124.js` | Resonance layer | Yes | Yes | loadPressure, metrics |
| Link pictograms | `LinkSemanticPictogramSystem_WithFusion.js` | Glyph layer | Yes | Yes | category, state |
| Cascade visuals | `PHASE5_CascadeVisuals.js` | Cascade layer | Yes | Yes | cascade events |

---

## Step 3 — Update Authority Map

| System | Update Entry | File | Frequency | Scheduler Controlled? |
|--------|--------------|------|-----------|------------------------|
| NodeLinkingSystem | `update(deltaTime)` | `NodeLinkingSystem.js` | Every frame (main loop) | Yes (FrameScheduler/main.js) |
| LinkRendererConduit | `update(link, dt, time)` called from NodeLinkingSystem | `LinkRendererConduit.js` | Per-link per-frame | Through NodeLinkingSystem |
| NeonLinkVisuals | `update()` | `NeonLinkVisuals.js` | Per-link per-frame | Through NodeLinkingSystem |
| ThicknessSystem | `updateLinkThickness()` | `NodeLinkingSystem.js` | Per-frame | Through NodeLinkingSystem |
| Corruption Transmission | `updateTransmission(dt)` | `LinkCorruptionTransmission_v1.js` | Per-frame (if enabled) | Called from NodeLinkingSystem |
| Flow/Emission | `flowSystem.update(link, dt)` | `NodeLinkingSystem.js` | Per-frame | Via NodeLinkingSystem |
| Link Resonance Flow | `update(deltaTime, links, camera)` | `LinkResonanceFlowSystem_Session124.js` | Per-frame | Through FrameScheduler |
| Link Semantic Pictograms | `update(deltaTime)` | `LinkSemanticPictogramSystem_WithFusion.js` | Per-frame | Through FrameScheduler |
| Cascade Visuals | `update(deltaTime)` | `PHASE5_CascadeVisuals.js` | Per-frame | Through FrameScheduler |
| Animated Link Flow | `update()` | `AnimatedLinkFlow.js` | Per-frame | Conditional (feature flag) |
| Misc FX (pulses, glows) | `updateLinkAnimations()` / `updateLinkVFXEffects()` | `NodeLinkingSystem.js` | Per-frame | Via NodeLinkingSystem |

**Double-update risk**: Low — single entry point in NodeLinkingSystem; optional debug/rAF snippets exist but are gated.

---

## Step 4 — Metric Dependency Map

| Visual System | Metric Source | Direct Read? | Derived? |
|---------------|---------------|--------------|----------|
| Conduit color/thickness | `link.userData.synergy`, `link.userData.loadPressure/traffic` | Yes | Derived blends |
| Corruption overlay | `link.userData.corruption` | Yes | - |
| Aura / stress visuals | `link.userData.stress/loadPressure` | Yes | Derived from load |
| Beads/Sparks/Trails | `link.userData.synergy`, traffic counts | Yes | Traffic-derived |
| ThicknessSystem | `link.userData.quality`, `metrics.loadPressure` | Yes | Uses load→linewidth |
| Corruption transmission FX | `node.userData.corruption`, `link.userData.corruption` | Yes | infection state |
| Wave/energy bridges | `link.userData.synergy/load` | Yes | Used for shader uniforms |
| Healing particles | `link.userData.corruption` (inverse) | Yes | - |
| HUD bridges (selection) | `link.userData.synergy` | Yes | - |
| Global fallbacks | `__ATOMA_LIVE_METRICS__` (rare) | Yes (HUD) | Derived |
| Link resonance flow | `link.userData.metrics.loadPressure/corruption/synergy/stability` | Yes | Direct |
| Link pictograms | `link.userData.category`, `link.userData.evolutionStage`, `link.userData.state` | Yes | Direct |
| Neon link visuals | `link.state`, `link.userData.synergy`, `link.userData.corruption`, `link.userData.flowMetrics` | Yes | Direct |
| Visual echo trails | `link.userData.synergy`, `link.userData.loadPressure` | Yes | Shader-based |
| Cascade visuals | `cascade.hop` events, `cascade.start` events | Yes | Event-derived |
| Animated link flow | `link.userData.flowMetrics`, `link.userData.traffic` | Yes | Direct |

---

## Step 5 — Scene Attachment & Root Map

| Component | Attached By | File | Root Group | Removal Owner |
|-----------|-------------|------|------------|----------------|
| Link group | `createLink()` | `NodeLinkingSystem.js` | `link.group` added to `scene` | `NodeLinkingSystem.removeLink` |
| Conduit visuals | `registerLink()` | `LinkRendererConduit.js` | Children of `link.group` | `conduitRenderer.disposeLinkVisuals()` via NodeLinkingSystem |
| Beads/Sparks/Trails/Aura/etc. | Conduit during register | `LinkRendererConduit.js` | Under `link.group` | Conduit dispose |
| Thickness data | Thickness system register | `NodeLinkingSystem.js` | Uses existing group | thickness unregister |
| Flow system | Flow register | `NodeLinkingSystem.js` | Under link group | flowSystem.removeLinkFlow |
| Neon link visuals | Neon link system | `NeonLinkVisuals.js` | Under link group | NeonLinkVisuals dispose |
| Link resonance flow | Resonance system | `LinkResonanceFlowSystem_Session124.js` | Scene top-level | Resonance system clearAll |
| Link pictograms | Pictogram system | `LinkSemanticPictogramSystem_WithFusion.js` | Scene top-level | Pictogram system dispose |
| Cascade visuals | Cascade system | `PHASE5_CascadeVisuals.js` | Scene top-level | Cascade system dispose |
| Animated link flow | Flow system | `AnimatedLinkFlow.js` | Under link group | Flow system removeLinkFlow |
| Selection/hover glows | NodeLinkingSystem | `NodeLinkingSystem.js` | Added under scene or link group | NodeLinkingSystem.dispose/removeLink |
| Optional FX patches | Various integration files | Mixed | Often under link.group | Mixed; some risk of orphan |

---

## Step 6 — Lifecycle Map

```
LINK CREATED
   ↓
NodeLinkingSystem.createLink
   ↓
link.group built & attached to scene
   ↓
Visuals registered:
   - LinkRendererConduit (conduit geometry, pulse, beads, sparks, trails, aura, corruption/healing FX, streaks)
   - Thickness system (linewidth)
   - Flow system (pulse/flow particles)
   - Link semantic pictograms (glyphs)
   - Optional: Animated link flow, Neon link visuals
   ↓
link indexed
   ↓
PER-FRAME UPDATES
   ↓
   - NodeLinkingSystem.update
   - updateLinkCurve (positions)
   - LinkRendererConduit.update(link, dt, time)
   - Thickness update
   - Flow/emission update
   - LinkResonanceFlowSystem.update(deltaTime, links, camera)
   - LinkSemanticPictogramSystem.update(deltaTime)
   - PHASE5_CascadeVisuals.update(deltaTime)
   - Corruption transmission update (if enabled)
   - VFX animations (pulses, glows, beads, sparks, trails, auras)
   ↓
METRIC-DRIVEN MUTATIONS
   ↓
   - synergy: color, brightness, pulse, particle rates
   - loadPressure: thickness, aura intensity, flow speed
   - corruption: overlay, particles, color shift
   - quality: thickness, visual fidelity
   - category: pictogram type
   ↓
UNLINK / REMOVE EVENT
   ↓
NodeLinkingSystem.removeLink
   ↓
   - flowSystem.removeLinkFlow
   - thicknessSystem.unregisterLinkCurve
   - conduitRenderer.disposeLinkVisuals
   - linkSemanticPictograms.dispose
   ↓
scene.remove(link.group)
   ↓
link.group.traverse(dispose)
   ↓
link removed from indexes
   ↓
GC eligible
```

**Risks**:
- Optional integrations (debug snippets, external FX packs) may add children without registering dispose hooks (orphan risk)
- Corruption transmission uses its own per-frame update; if disabled mid-run, residue state may stay in userData
- Top-level systems (LinkResonanceFlowSystem, LinkSemanticPictogramSystem, CascadeVisuals) require explicit cleanup on world switch

---

## Step 7 — Visual Lock / Policy Interference Map

| System | Guard Type | Effect | Frame Cost |
|--------|------------|--------|------------|
| `TransparentStateAuthority` (Conduit) | Material flag freeze | Prevents blend/depth changes post-setup | Minimal |
| Variant lock (`freezeMaterialFlags`) | Locks transparency/depth props | Avoids external mutation | Minimal |
| VisualAuthorityGuard (elsewhere) | Guarded writes on core materials | Blocks unauthorized visual edits | Minimal |
| LinkEventVisualCoordinator_v1 | Priority-based suppression | Prevents visual amplification during link events | Minimal |
| Config flags (`LOCK_LINK_VISUALS`, debug env) | Can skip visual mutation blocks | Branch only | - |

---

## Step 8 — Link Visual Flow Diagram

```
LINK CREATION EVENT
   ↓
NodeLinkingSystem.createLink()
   ├─ Build link object
   ├─ Add link.group to scene
   └─ Register indexes
   ↓
LinkRendererConduit.registerLink
   ├─ Conduit geometry (rope)
   ├─ Pulse/energy wave
   ├─ Beads
   ├─ Sparks
   ├─ Trails
   ├─ Aura (shader)
   ├─ Corruption/healing FX
   ├─ Directional streaks
   ├─ Energy rings
   ├─ Visual echo trails
   └─ Variant locks
   ↓
Thickness/Flow systems register
   ├─ Thickness (linewidth)
   ├─ Pulse/flow particles
   └─ Animated flow (optional)
   ↓
Link semantic pictograms register
   └─ Pictogram system for link glyphs
   ↓
PER-FRAME UPDATES (NodeLinkingSystem.update)
   ↓
   ├─ Update link curve positions
   ├─ Conduit update(link, dt, time)
   │  ├─ Rope geometry
   │  ├─ Pulse/energy wave
   │  ├─ Beads/Sparks/Trails
   │  ├─ Aura
   │  ├─ Corruption/healing FX
   │  ├─ Directional streaks
   │  ├─ Visual echo trails
   │  └─ Energy rings
   ├─ Thickness update
   ├─ Flow/emission update
   ├─ LinkResonanceFlowSystem.update(deltaTime, links, camera)
   ├─ LinkSemanticPictogramSystem.update(deltaTime)
   ├─ PHASE5_CascadeVisuals.update(deltaTime)
   ├─ Corruption transmission update (if enabled)
   └─ VFX animations
   ↓
METRIC READS (drive colors, opacity, thickness, particle rates)
   ↓
   ├─ synergy → color, brightness, pulse, particle rates
   ├─ loadPressure → thickness, aura intensity, flow speed
   ├─ corruption → overlay, particles, color shift
   ├─ quality → thickness, visual fidelity
   ├─ category → pictogram type
   └─ state → visual behavior
   ↓
UNLINK / REMOVE EVENT
   ↓
NodeLinkingSystem.removeLink
   ├─ flowSystem.removeLinkFlow
   ├─ thicknessSystem.unregisterLinkCurve
   ├─ conduitRenderer.disposeLinkVisuals
   └─ linkSemanticPictograms.dispose
   ↓
scene.remove(link.group)
   ↓
link.group.traverse(dispose)
   ↓
link removed from indexes
   ↓
GC eligible
```

**Hot Spots**:
- Many visual sublayers mutate materials sequentially each frame (ordering sensitivity)
- Corruption transmission writes link/user corruption while visuals also read it
- Top-level systems (LinkResonanceFlowSystem, LinkSemanticPictogramSystem, CascadeVisuals) require explicit cleanup
- Optional integrations may add children without dispose hooks (orphan risk)

---

## Step 9 — Architecture Classification

**Classification**: Multi-layered with shared authority (moderate risk)

**Rationale**:
- Creation/removal centralized in NodeLinkingSystem
- Updates funneled through NodeLinkingSystem
- But numerous sub-systems mutate link visuals each frame:
  - Conduit (rope, pulse, beads, sparks, trails, aura, corruption/healing, streaks, echo, rings)
  - Thickness system
  - Flow system
  - LinkResonanceFlowSystem (independent top-level)
  - LinkSemanticPictogramSystem (independent top-level)
  - Cascade visuals (independent top-level)
- All rely on shared userData metrics
- Variant/material locks mitigate but do not fully eliminate:
  - Ordering conflicts
  - Orphan risk from optional integrations
  - Residue state from mid-run disables

**Mitigations**:
- Visual lock/policy guards prevent unauthorized mutations
- LinkEventVisualCoordinator_v1 prevents visual amplification during events
- Config flags allow safe disable of visual mutation blocks
- Disposal path is mostly centralized through NodeLinkingSystem.removeLink

**Areas for Improvement**:
- Consider consolidating top-level systems into single cleanup hook on world switch
- Document all optional integrations and their disposal requirements
- Add validation for userData mutations during gameplay updates

---

## Step 10 — Missing Systems Checklist

### Recently Added (not in original audit):
- ✅ LinkResonanceFlowSystem_Session124.js
- ✅ LinkSemanticPictogramSystem_WithFusion.js
- ✅ NeonLinkVisuals.js
- ✅ AnimatedLinkFlow.js
- ✅ LinkBeadVisualEffects.js
- ✅ LinkEventVisualCoordinator_v1.js
- ✅ VisualEchoTrails_v1_Integration.js
- ✅ LinkPointFXBase.js
- ✅ EnergyVisualProfile.js
- ✅ PHASE5_CascadeVisuals.js

### Potential Future Additions:
- WaveInterferencePatternSystem integration (if affects links)
- Synergy VFX Engine integration (if affects link visuals)
- Archetype visual differentiation (if affects link state)
- Colony VFX Manager integration (if affects links)

---

## Conclusions

**Strengths**:
- Centralized link creation and ownership
- Clear update path through NodeLinkingSystem
- Comprehensive visual layer coverage
- Good documentation and audit trail

**Risks**:
- Multiple independent top-level systems requiring explicit cleanup
- Optional integrations with potential orphan risk
- Sequential material mutation each frame (ordering sensitivity)
- Residue state from mid-run disables

**Recommendations**:
1. Consolidate top-level system cleanup hooks
2. Document all optional integrations and disposal requirements
3. Add validation for userData mutations
4. Consider ordering guarantees for visual sublayers
5. Implement automatic cleanup detection for orphan objects

---

**Last Updated:** 2026-04-10
**Author:** Bystrik Matajzik
**Phase:** EVOLUTION_V2
**Status**: Organic audit completed, missing systems added
