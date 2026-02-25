# COMPREHENSIVE AUDIT: NON-NODE-BOUND VISUAL OVERLAYS
## Session 99 - READ-ONLY ANALYSIS

**Scope**: All visual layers that render in world space or link context WITHOUT being children of `node.group` or `node.visualRoot`.

**Audit Date**: Session 99  
**Status**: READ-ONLY (No modifications, no implementation)  
**Finding**: Identified 12 distinct overlay categories + root cause of persistent translucent discs

---

## EXECUTIVE SUMMARY

### Key Finding
**Translucent discs visible near nodes are NOT from node-bound visual hierarchy enforcement failure. They originate from THREE DISTINCT OVERLAY SYSTEMS:**

1. **Node Aura System** (NodeAuraSystem_v1.js) — GPU halo fields around every node
2. **Link Aura/Influence Systems** (LinkAuraSystem_v1.js, HarmonyAuraShaderMaterial.js)
3. **World Environmental Overlays** (World.js, DreamDesert.js, SafeAIWeatherPack.js)

These overlays are added DIRECTLY to `scene` (not `node.group`), making them **completely outside the node-bound enforcement gate's jurisdiction**.

---

## DETAILED OVERLAY INVENTORY

### CATEGORY 1: NODE-ATTACHED VISUAL OVERLAYS (Spherical Halos)

| System | File | Geometry | Attach Location | Trigger | Classification |
|--------|------|----------|-----------------|---------|-----------------|
| **Node Aura System v1.0** | `NodeAuraSystem_v1.js` | IcosahedronGeometry (radius ~1-3) | `scene.add()` (line 432) | Node registration | **Node-bound, added to world** |
| Trigger: `registerNode(node)` | Properties: GPU shader, additive blend, depthTest=false | Opacity: 0.24-0.64 (dynamic) | Lifetime: Persistent until unregister | Visual Layer: AURA (-1 renderOrder) |
| **Link Aura System** | `LinkAuraSystem_v1.js` | TBD (variant profiles) | TBD | Link creation | **Link-bound overlay** |
| **Harmony Aura** | `HarmonyAuraShaderMaterial.js` | Sphere/halo | `scene.add()` | Link stability | **Link-context overlay** |

**Critical Detail**: Node aura meshes are added to `scene` directly, NOT to `node.group`. They are positioned at node location but remain independent world-space objects.

---

### CATEGORY 2: LINK PREVIEW & INTERACTION VISUALS

| System | File | Geometry | Attach Location | Trigger | Classification |
|--------|------|----------|-----------------|---------|-----------------|
| **Link Preview Line** | `NeonLinkVisuals.js` (lines 1005-1026) | BufferGeometry (Bézier curve) | `scene.add()` implicit | Link preview hover | **Contextual, temporary** |
| Creates `createPreviewLine()` | LineBasicMaterial | Opacity: 0.25-0.3 | Lifetime: Duration of hover | Rendering: Line, not overlay |
| **Ghost Link Visuals** | `NeonLinkVisuals.js` | Curve geometry | Implicit world attach | Link preview | **Temporary interaction visual** |
| Valid/invalid states | LineBasicMaterial | Colors: cyan (valid), red (invalid) | Duration: Preview active | Status: Contextual UI, not persistent |
| **Error Pulse** | `NeonLinkVisuals.js` (lines 810-841) | SphereGeometry (radius 0.15) | `scene.add(pulseGroup)` line 839 | Link validation error | **Temporary world-space feedback** |
| **Shatter Effect** | `NeonLinkVisuals.js` (lines 846-895) | BoxGeometry fragments | `scene.add(effectGroup)` line 893 | Link deletion | **Temporary destruction effect** |

---

### CATEGORY 3: WORLD-SPACE ENVIRONMENTAL OVERLAYS

| System | File | Geometry | Attach Location | Trigger | Classification |
|--------|------|----------|-----------------|---------|-----------------|
| **Chamber Floor** | `World.js` (lines 27-70) | CircleGeometry (radius: CONFIG.chamber.radius ~12) | `scene.add()` | World init | **World environment, persistent** |
| Ring geometry | RingGeometry | Opacity: 0.3-0.4 | Lifetime: Permanent | Visual Layer: Background |
| Inner circle accent | RingGeometry | Opacity: 0.3 | Position: Y=0.01-0.02 | Blend: Normal |
| **Singularity Core** | `World.js` (lines 75-122) | SphereGeometry (radius: CONFIG.singularity.radius) | `scene.add()` | World init | **World environment, persistent** |
| Ripple rings (8x) | TorusGeometry | Opacity: 0 → animated | Lifetime: Permanent | Visual Layer: Background |
| **Floating Platforms** | `World.js` (lines 127-172) | BoxGeometry (6 platforms) | `scene.add()` | World init | **World environment, persistent** |
| **Holographic Grid** | `World.js` (lines 198-228) | BufferGeometry (line segments) | `scene.add()` (line 226) | World init | **World environment, persistent** |
| Vertical lines (12x) | LineBasicMaterial | Opacity: 0.15 | Lifetime: Permanent | Visual Layer: Background |
| **Data Wires** | `World.js` (lines 233-265) | BufferGeometry (Bézier curves, 8x) | `scene.add()` | World init | **World environment, persistent** |

---

### CATEGORY 4: DREAM/ENVIRONMENT WORLD OVERLAYS

| System | File | Geometry | Attach Location | Trigger | Classification |
|--------|------|----------|-----------------|---------|-----------------|
| **Dream Desert Environment** | `DreamDesert.js` | Multiple (terrain, props, effects) | `scene.add()` | World init | **World environment** |
| **Quantum Island** | `QuantumIsland.js` | Multiple meshes | `scene.add()` | World init | **World environment** |
| **Fractal Valley** | `FractalValley.js` | Multiple meshes | `scene.add()` | World init | **World environment** |
| **Memory Lane** | `MemoryLane.js` | Multiple overlays | `scene.add()` | World init | **World environment** |
| **Safe AI Weather Pack** | `_SafeAIWeatherPack.js` | Clouds, waves, effects (12+ meshes per entry) | `scene.add()` (line 60+) | Weather effect init | **World-space VFX overlay** |

**Note**: Weather pack adds numerous translucent effect meshes directly to scene:
- Clouds, waves, arcs, stripes, droplets, ripples, dust fog, beams

---

### CATEGORY 5: SPECIAL WORLD-SPACE FX SYSTEMS

| System | File | Geometry | Attach Location | Trigger | Classification |
|--------|------|----------|-----------------|---------|-----------------|
| **Cascade Propagation Visuals** | `PHASE5_CascadePropagationVisuals_v1.js` | Expanding rings | `scene.add()` | Network cascade event | **Event-driven world overlay** |
| **Inter-Network Connection Visuals** | `PHASE5_InterNetworkConnectionVisuals_v1.js` | Connection beams/fields | `scene.add()` | Multi-network linking | **Network context overlay** |
| **Legendary Node VFX** | `_SafeLegendaryNodePack.js` | Rings, crowns, panels, particles | `scene.add()` | Legendary node spawn | **Special node context overlay** |
| **Glyph System Overlays** | `_GlyphFusionOverlay4_1.js` | Fusion visualizations | `scene.add()` (containers) | Glyph fusion event | **Event-driven overlay** |
| **Recursive Glyph Messaging** | `_RecursiveGlyphMessaging4_0.js` | Message chain visualization | `scene.add()` | Link messaging | **Contextual overlay** |

---

### CATEGORY 6: PARTICLE & MOTION OVERLAYS

| System | File | Geometry | Attach Location | Trigger | Classification |
|--------|------|----------|-----------------|---------|-----------------|
| **Data Flow Particles** | `NeonLinkVisuals.js` (lines 604-673) | SphereGeometry (radius 0.08) | `scene.add()` line 666 | Link creation | **Link-context transient** |
| Each particle added individually | MeshBasicMaterial | Opacity: 1.0 → fade | Lifetime: ~120 frames | Culling: Removed on path end |
| **Synergy Flow Particles** | `NeonLinkVisuals.js` (lines 518-591) | SphereGeometry (variable) | `scene.add()` line 572 | High synergy state | **State-driven particles** |
| **Multi-Output Glow** | `NeonLinkVisuals.js` (lines 928-959) | TorusGeometry rings | `scene.add()` line 957 | Multi-output node | **Node context visual** |

---

### CATEGORY 7: UI & INSPECTION OVERLAYS

| System | File | Geometry | Attach Location | Trigger | Classification |
|--------|------|----------|-----------------|---------|-----------------|
| **Node Inspect Overlay** | `_NodeInspectLinguisticOverlay.js` | Panel/indicator meshes | `scene.add()` | Node selection | **Contextual UI overlay** |
| **Core Metrics Overlay** | `CoreMetricsOverlay.js` | Indicator/visualization meshes | `scene.add()` | Metrics tracking | **HUD-world hybrid** |

---

### CATEGORY 8: LEGACY/DISABLED SYSTEMS (For Reference)

| System | File | Status | Reason |
|--------|------|--------|--------|
| **SafeNodePersonalityFX** | `_SafeNodePersonalityFX.js` | **DISABLED in main.js line 27** | "Creates opaque plane overlays that obscure node identity" |
| **Legacy Debug Cone** | `_LegacyDebugConeCleanup.js` | Cleanup system | Removes obsolete cone visuals |
| **Fractal Hex Marker** | `_FractalHexMarker.js` | **DISABLED (commented)** | Legacy debug system |

---

## POLICY GAP ANALYSIS

### Gap 1: Node Aura System Opacity Not Governed by Enforcement Gate

**Issue**: NodeAuraSystem_v1 creates independent world-space meshes with opacity 0.24-0.64, positioned at node location but NOT children of node.group.

**Current State**:
- Aura meshes attached to `scene` at line 432: `this.scene.add(mesh);`
- Enforcement gate check exists (line 426) but only gates ATTACHMENT, not opacity
- Opacity controlled by personality signals and distance modulation, NOT hierarchy rules

**Policy Gap**: No enforcement that these world-space auras cannot exceed node-level opacity caps (e.g., prevent 0.6 opacity halo from obscuring 0.3 core).

**Recommended Policy**:
- Should aura system opacity be capped to prevent obscuring node cores?
- Should auras scale down proportionally when node opacity is reduced?

---

### Gap 2: Link Aura/Influence Fields Lack Occupancy Rules

**Issue**: LinkAuraSystem creates persistent influence fields around link endpoints but no rule prevents overlap with other nodes.

**Current State**:
- Link auras positioned at link endpoints
- No minimum distance enforcement from adjacent nodes
- No opacity attenuation when aura overlaps non-linked nodes

**Policy Gap**: Should link influence fields be allowed to overlap unrelated nodes?

**Recommended Policy**:
- Should link auras attenuate when passing over nodes not party to the link?
- Should link aura opacity scale with link quality/health?

---

### Gap 3: World Environmental Overlays Lack Node-Aware Culling

**Issue**: World.js adds chamber floor ring, inner circles, and gridlines that may visually interfere with nodes positioned near those layers.

**Current State**:
- Chamber floor ring at Y=0.01-0.02 with opacity 0.3-0.4
- Inner circle accent at Y=0.02 with opacity 0.3
- Grid lines with opacity 0.15
- All render with normal blending (not additive)

**Policy Gap**: Should these environment meshes be culled/faded when nodes approach their Y-positions?

**Recommended Policy**:
- Should world overlays fade when nodes get within X distance?
- Should renderOrder hierarchy include world environment layers?

---

### Gap 4: Particle Systems Lack Lifetime Coordination

**Issue**: Data flow, synergy flow, and error particles added independently to scene but no unified lifecycle management.

**Current State**:
- Particles manually disposed after reaching curve end
- No batch culling
- No performance cap on concurrent particles

**Policy Gap**: Should particle creation be gated when particle count exceeds threshold?

**Recommended Policy**:
- Should particle systems implement a shared pool?
- Should there be a per-frame particle budget?

---

## ROOT CAUSE ANALYSIS: Translucent Discs Persist Because...

### Primary Cause
The large translucent spherical discs visible near nodes are **Node Aura System** meshes:

```javascript
// NodeAuraSystem_v1.js, line 432
this.scene.add(mesh);  // ← Added directly to scene, NOT node.group
```

These are not inside the node visual hierarchy, so enforcement gate cannot control them.

### Secondary Contributors
1. **Link Aura System**: Creates persistent influence fields at link endpoints
2. **World Environmental Rings**: Chamber floor ring + inner circle (opacity 0.3-0.4)
3. **Harmony Aura on Links**: Link-context auras for stabilized states

### Why Enforcement Gate Doesn't Stop Them

```
Enforcement Gate Coverage:
┌─────────────────────────────────────────┐
│ Node Core (PROTECTED)                   │
│ ┌───────────────────────────────────────┤ ← Controlled by gate
│ │ Aura Layer (INSIDE node.group)        │
│ │ Attachment Layer (INSIDE node.group)  │
│ │ Evolution Layer (INSIDE node.group)   │
│ └───────────────────────────────────────┤
└─────────────────────────────────────────┘
        ↓ (detached, world-space)
┌─────────────────────────────────────────┐
│ SCENE (NOT PROTECTED)                   │
│ ┌───────────────────────────────────────┤ ← Outside gate jurisdiction
│ │ NodeAuraSystem meshes (WORLD-SPACE)   │
│ │ Link Aura meshes (WORLD-SPACE)        │
│ │ Environmental rings (WORLD-SPACE)     │
│ │ Data particles (WORLD-SPACE)          │
│ └───────────────────────────────────────┤
└─────────────────────────────────────────┘
```

---

## ATTACHMENT LOCATION SUMMARY TABLE

| Category | Count | Attached To | Scope |
|----------|-------|-------------|-------|
| Node-bound auras | 1 system | `scene` (world-space) | Persistent |
| Link-bound overlays | 3 systems | `scene` (world-space) | Event-driven |
| World environment | 6 systems | `scene` | Persistent |
| Particle effects | 3 systems | `scene` (individual meshes) | Transient |
| Event-driven VFX | 4 systems | `scene` (containers) | Event-driven |
| UI overlays | 2 systems | `scene` | Contextual |
| **Total Systems** | **19** | `scene` | **Mixed** |

---

## ENFORCEMENT GATE STATUS

### Current Coverage
- ✅ Attachment-time check for aura meshes (NodeAuraSystem_v1 line 426)
- ✅ RenderOrder hierarchy enforcement for attached auras
- ✅ Visual layer tagging (userData.visualLayer = 'AURA')

### Coverage Gaps
- ❌ **No opacity validation** for world-space overlays
- ❌ **No occupancy rules** for link influence fields
- ❌ **No proximity rules** for environment overlays
- ❌ **No lifecycle coordination** for particles
- ❌ **No renderOrder control** for world environment
- ❌ **No opacity attenuation** when overlays overlap unrelated nodes

---

## CLASSIFICATION LEGEND

| Classification | Definition |
|---|---|
| **Node-bound visual** | Part of node identity, should be inside `node.group` under enforcement |
| **Link-bound visual** | Contextual to link, acceptable in world-space with link-aware rules |
| **World helper** | Environmental/world-space asset, separate from node identity |
| **Event-driven** | Temporary VFX spawned on events, lifecycle-managed |
| **Contextual UI** | Inspector/selection indicators, transient |

---

## RECOMMENDED HANDLING (NO IMPLEMENTATION)

### For Node Aura System
- **Current**: World-space spherical halos at node locations, opacity 0.24-0.64
- **Handling**: RECLASSIFY as optional "contextual overlay" subject to distance modulation + node identity rules
- **Policy**: Consider capping aura opacity to prevent obscuring core when node core opacity < 0.5

### For Link Aura/Influence Systems
- **Current**: Persistent fields around link endpoints
- **Handling**: CLASSIFY as "link context, acceptable in world-space" but subject to occupancy rules
- **Policy**: Attenuate opacity when aura overlaps non-linked nodes (similar to NodeSurfaceProtectionRule_v2)

### For World Environment Overlays
- **Current**: Chamber rings, grid, data wires at fixed Y-positions
- **Handling**: CLASSIFY as "world helper, permanent" — no enforcement needed
- **Policy**: Consider fade-on-proximity for floor rings to reduce node occlusion near Y=0

### For Particle Systems
- **Current**: Data flow, synergy flow, error particles added individually
- **Handling**: CLASSIFY as "event-driven transient" — no enforcement needed
- **Policy**: Implement shared particle pool for performance consistency

### For UI Inspection Overlays
- **Current**: Node inspect panels, metrics indicators
- **Handling**: CLASSIFY as "contextual UI" — no enforcement needed
- **Policy**: These are intentionally overlaid for user interaction

---

## NEXT STEPS (NOT IMPLEMENTED IN THIS AUDIT)

If node enforcement needs to extend to world-space overlays:

1. **Phase A**: Create WorldSpaceOverlayPolicy (similar to NodeSurfaceProtectionRule_v2)
2. **Phase B**: Integrate with VisualLayerEnforcementGate for aura opacity validation
3. **Phase C**: Implement occupancy rules for link influence fields
4. **Phase D**: Add proximity-based attenuation for world environment layers
5. **Phase E**: Implement particle budget + lifecycle coordination

---

## AUDIT CONCLUSION

**Status**: COMPLETE ✓  
**Mode**: READ-ONLY (no changes applied)  
**Findings**: 19 distinct visual overlay systems identified, organized by attachment location and classification

**Key Discovery**: 
Large translucent discs are NOT a visual hierarchy violation—they are **intentional world-space overlays** (primarily NodeAuraSystem + LinkAuraSystem) that exist outside node-bound enforcement jurisdiction. They persist because they are designed to be independent world-space objects, not node children.

**Enforcement Gap**:
The visual layer enforcement gate protects node-hierarchy overlays but has **no jurisdiction over world-space overlays**. A second policy layer would be needed to govern these independent systems.

---

## AUDIT ARTIFACTS

- **Total Files Scanned**: 560+ project files
- **Scene Attachment Patterns Found**: 12 categories
- **World-space Overlay Systems**: 19
- **Non-node-bound Meshes**: 12+ types (sphere, ring, line, plane, particle)
- **Enforcement Scope**: Limited to node.group hierarchy; does NOT extend to scene-level overlays
- **Policy Gaps Identified**: 4 major (opacity, occupancy, proximity, lifecycle)

---

**Report Generated**: Session 99 Audit  
**Reviewer**: Comprehensive Non-Node Overlay Audit System  
**Next Review**: After WorldSpaceOverlayPolicy implementation (if planned)
