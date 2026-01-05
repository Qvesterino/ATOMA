# VISUAL LAYER HIERARCHY — CANONICAL REFERENCE

**Authority**: Session 92 Opaque Overlay Audit  
**Status**: AUTHORITATIVE — Defines visual truth for all nodes  
**Scope**: All node-related visual rendering  
**Purpose**: Prevent visual conflicts, forbid opaque overlays, establish single source of truth per layer

---

## 1. VISUAL LAYER STACK (RENDERING ORDER)

### Canonical Z-Order (Top → Bottom)

| Order | Layer | Purpose | Geometry Type | Opacity | Authority | Notes |
|-------|-------|---------|---------------|---------|-----------|-------|
| 1 | **DEBUG_OVERLAY** | Dev-only debugging (temporary) | Lines, text, debug shapes | 0.3-0.8 | Developer | Disabled in production |
| 2 | **SELECTION_HIGHLIGHT** | Node selection emphasis | Wireframe icosahedron | 0.4-0.75 | UISelectedNodeHighlight3_2 | Outline only, NO fill |
| 3 | **FOCUS_RING** | Currently-focused node indicator | Line loop / wireframe ring | 0.6-0.9 | UISelectedNodeHighlight3_2 | Outline only |
| 4 | **STRESS_INDICATOR** | Corruption/stress visual (OPTIONAL) | Particle emission, low-opacity rings | ≤0.4 | Multiple systems | Must NOT occlude core |
| 5 | **STATE_GLYPH** | Semantic/personality indicator | Rings, lines, small dots | ≤0.5 | SemanticGlyphAI, GlyphFusionOverlay | Low opacity helpers only |
| 6 | **GLYPH_LAYER** | Node meaning / category symbol | Rotating planes, symbols | ≤0.7 | GlyphLayer4, LinkedGlyph | Non-occluding, decorative |
| 7 | **AURA_LAYER** | Core personality / mood visualization | Particle cloud around shell | ≤0.6 | NodeAuraSystem_v1 | Dynamic based on metrics |
| 8 | **SHELL_OUTLINE** | Holographic shell (SIZE AUTHORITY) | Icosahedron mesh | ~1.0 | NodeShellSizeAuthority | Static size (category + tier) |
| 9 | **EDGE_GLOW** | Edge highlight enhancement | Line segments (edges) | 0.6-0.8 | AINodeModel | Thin decorative lines |
| 10 | **CORE_GEOMETRY** | Node identity (immutable) | Icosahedron, octahedron, etc. | 1.0 | CoreVisualAuthoritySystem | BOTTOM LAYER - Never occluded |

---

## 2. VISUAL LAYER DEFINITIONS

### Layer 1: DEBUG_OVERLAY
- **When Used**: Development/debugging only
- **Geometry**: Debug lines, wireframes, cone markers
- **Opacity**: 0.3-0.8 (varies)
- **Attachment**: Scene root (not to node)
- **Authority**: Developer (console commands)
- **Conflict Rules**: Disabled in production; harmless if present
- **Forbidden**: None (dev-only)
- **Examples**: Node position markers, collision boxes

### Layer 2: SELECTION_HIGHLIGHT
- **When Used**: Node is currently selected
- **Geometry**: Wireframe icosahedron (NOT filled)
- **Opacity**: 0.4-0.75
- **Attachment**: Scene root (positioned at node)
- **Authority**: UISelectedNodeHighlight3_2
- **Conflict Rules**: Only one node selected at a time
- **Forbidden**: Filled discs, planes, opaque geometry
- **Examples**: Selection pulse effect

### Layer 3: FOCUS_RING
- **When Used**: Node has keyboard/UI focus
- **Geometry**: Wireframe ring or line loop
- **Opacity**: 0.6-0.9
- **Attachment**: Scene root or node
- **Authority**: Focus controller (future)
- **Conflict Rules**: Priority over selection if focused
- **Forbidden**: Filled discs, planes
- **Examples**: Focused node pulse

### Layer 4: STRESS_INDICATOR
- **When Used**: Node has high corruption, load, or instability
- **Geometry**: Particle emission, low-opacity rings
- **Opacity**: ≤0.4 (must not obscure core)
- **Attachment**: Scene root (positioned at node)
- **Authority**: CorruptionVisualFX, LinkCollapseSystem
- **Conflict Rules**: Must not interfere with shell size
- **Forbidden**: Filled discs, planes, opaque geometry
- **Examples**: Red particle burst on corruption

### Layer 5: STATE_GLYPH
- **When Used**: Node has assigned personality/semantic state
- **Geometry**: Rotating rings, scan lines, tiny orbiting dots
- **Opacity**: ≤0.5
- **Attachment**: Scene root or node children
- **Authority**: SemanticGlyphAI, GlyphFusionOverlay4_1
- **Conflict Rules**: Must not overlap with core
- **Forbidden**: Large filled planes, discs, occluding geometry
- **Examples**: Analytical spiral, curious orbital dots

### Layer 6: GLYPH_LAYER
- **When Used**: Always (when glyph systems active)
- **Geometry**: Symbolic planes, rotating geometry
- **Opacity**: ≤0.7
- **Attachment**: As node children (in glyph container)
- **Authority**: AtomaGlyphSystem3_0, GlyphLayer4_MultiFusion
- **Conflict Rules**: Must render below shell
- **Forbidden**: Opaque discs covering node interior
- **Examples**: Rotating glyphs representing node meaning

### Layer 7: AURA_LAYER
- **When Used**: Always (core system)
- **Geometry**: Particle cloud, subtle halo
- **Opacity**: ≤0.6
- **Attachment**: Scene root (positioned at node)
- **Authority**: NodeAuraSystem_v1
- **Conflict Rules**: Dynamic opacity based on corruption/harmony
- **Forbidden**: Filled discs
- **Examples**: Glowing particle emission around shell

### Layer 8: SHELL_OUTLINE
- **When Used**: Always (core identity)
- **Geometry**: Icosahedron mesh (size-authoritative)
- **Opacity**: ~1.0 (fully opaque)
- **Attachment**: Node child
- **Authority**: NodeShellSizeAuthority (SINGLE AUTHORITY)
- **Conflict Rules**: Size immutable; color/intensity may vary
- **Forbidden**: Nothing (canonical layer)
- **Rationale**: Must always be visible; all other layers scale to fit

### Layer 9: EDGE_GLOW
- **When Used**: Always (core identity)
- **Geometry**: LineSegments (edge wireframe)
- **Opacity**: 0.6-0.8
- **Attachment**: Node child
- **Authority**: AINodeModel
- **Conflict Rules**: Decorative; never obscures core
- **Forbidden**: Filled geometry
- **Examples**: Edge highlighting on polyhedra

### Layer 10: CORE_GEOMETRY
- **When Used**: Always (immutable)
- **Geometry**: Solid polyhedron (icosahedron, octahedron, etc.)
- **Opacity**: 1.0
- **Attachment**: Node child (nodeRoot)
- **Authority**: CoreVisualAuthoritySystem (SINGLE AUTHORITY)
- **Conflict Rules**: NEVER occluded; highest render order
- **Forbidden**: Any layer obscuring this
- **Rationale**: Node identity; must always be readable

---

## 3. PER-CATEGORY ALLOW LIST

### Layer Access Matrix

| Category | Shell | Aura | Glyphs | State | Stress | Selection | Focus | Edge | Core |
|----------|-------|------|--------|-------|--------|-----------|-------|------|------|
| **input** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **process** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **analytics** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **storage** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **control** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **integration** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **emotional** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **quantum** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **sigma** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **outer** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **extreme** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **legendary** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **mythic** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **prime** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **error** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Summary**: All layers allowed on all categories.  
**Rationale**: Visual system is universal; per-category restrictions may be added later if needed.

### Custom Per-Category Modifiers (OPTIONAL)

Future extensions may add category-specific rules:
- **quantum** nodes: May have enhanced glyph intensity
- **mythic** nodes: May have special rituals layer (above aura)
- **error** nodes: May have damage particles (layer 4.5)

**Note**: These are NOT currently implemented; hierarchy supports them if added.

---

## 4. FORBIDDEN RULES (MANDATORY)

### Hard Rules (Applied Everywhere)

1. **NO FILLED DISCS OR PLANES FOR STATE/PERSONALITY**
   - ❌ FORBIDDEN: PlaneGeometry(0.4, 0.4) with opacity > 0.5
   - ❌ FORBIDDEN: CircleGeometry with opacity > 0.3
   - ✅ ALLOWED: Wireframe rings, thin lines, particles
   - **Rationale**: Filled geometry obscures node identity; violates spatial truth
   - **Exception**: None (absolute rule)

2. **NO LAYER MAY OCCLUDE CORE GEOMETRY**
   - ❌ FORBIDDEN: Rendering layer with opacity > 0.9 that covers core position
   - ✅ ALLOWED: Glows, halos, particles (see-through)
   - **Rationale**: Core must always be readable
   - **Check**: `if (layer.opacity > 0.9 && layer.covers(core.position)) REJECT`

3. **NO LAYER MAY CHANGE NODE WORLD-SPACE SIZE**
   - ❌ FORBIDDEN: Layer scaling node bounds beyond shell
   - ✅ ALLOWED: Position offset (glyph at distance), rotation
   - **Rationale**: NodeShellSizeAuthority is single authority
   - **Authority**: NodeShellSizeAuthority (only system that sets size)

4. **ONLY ONE SYSTEM CONTROLS SHELL SIZE**
   - **Single Authority**: NodeShellSizeAuthority
   - **Immutable**: Shell size = category + evolution tier (static after init)
   - **Other systems**: Must query shell size; never modify
   - **Violation**: Any system modifying shell → AUDIT ALERT

5. **SELECTION/FOCUS ONLY WIREFRAME**
   - ❌ FORBIDDEN: Filled highlight sphere
   - ✅ ALLOWED: Wireframe icosahedron, line loop
   - **Rationale**: Selection must not obscure node
   - **Current**: UISelectedNodeHighlight3_2 compliant

6. **DEBUG LAYER DISABLED IN PRODUCTION**
   - ❌ NOT ALLOWED: Debug overlays shipped to production
   - ✅ ALLOWED: Development builds with console flag
   - **Rationale**: Debug clutter not for players
   - **Control**: `window.VISUAL_DEBUG_ENABLED` flag

7. **AURA LAYER OPACITY ≤ 0.6 MAXIMUM**
   - ❌ FORBIDDEN: Aura with opacity > 0.6
   - ✅ ALLOWED: Opacity 0.0-0.6 (dynamic)
   - **Rationale**: Aura is ambient; must not obscure shells
   - **Current**: NodeAuraSystem_v1 compliant

8. **GLYPHS NON-OCCLUDING**
   - ❌ FORBIDDEN: Glyph opacity > 0.7 covering node interior
   - ✓ ALLOWED: Opacity ≤ 0.7, positioned offset from core
   - **Rationale**: Glyphs decorative; must not hide node
   - **Current**: GlyphLayer4, SemanticGlyphAI compliant

---

## 5. CONFLICT RESOLUTION RULES

### When Two Layers Compete for Same Visual Role

**Priority System** (Higher priority wins):

```
Priority 1: CORE_GEOMETRY (immutable)
Priority 2: SHELL_OUTLINE (size authority)
Priority 3: SELECTION_HIGHLIGHT (active user selection)
Priority 4: FOCUS_RING (keyboard focus)
Priority 5: STRESS_INDICATOR (critical network state)
Priority 6: STATE_GLYPH (personality/semantic)
Priority 7: GLYPH_LAYER (meaning symbols)
Priority 8: AURA_LAYER (ambient personality)
Priority 9: EDGE_GLOW (decorative)
Priority 10: DEBUG_OVERLAY (dev-only)
```

### Conflict Scenarios & Resolution

#### Scenario A: Selection + Stress Indicator both active
- **Conflict**: Both want visual emphasis
- **Resolution**: Selection highlight takes visual priority (layer 2 > layer 4)
- **Stress**: Still renders but behind selection
- **Outcome**: Node clearly selected; stress visible but secondary

#### Scenario B: Multiple glyph layers trying to render
- **Conflict**: SemanticGlyphAI + GlyphFusionOverlay both adding geometry
- **Resolution**: Blend both; apply opacity rules (≤0.7 combined)
- **Outcome**: Semantic state visible; fusion decorative
- **Mechanism**: Adjust individual opacities so combined ≤ 0.7

#### Scenario C: Aura intensity high + Selection active
- **Conflict**: Aura glow vs Selection highlight brightness
- **Resolution**: Selection maintains visibility (renderOrder + opacity)
- **Outcome**: Selection clear; aura as background glow
- **Mechanism**: Aura capped at 0.6 opacity; selection at 0.4-0.75

#### Scenario D: Stress indicator + Focus ring
- **Conflict**: Both decorative emphasis
- **Resolution**: Focus takes priority (keyboard focus > network state)
- **Outcome**: Focused node emphasized; stress still visible
- **Mechanism**: Different render orders (focus layer 3 > stress layer 4)

#### Scenario E: Corruption spike + Aesthetic glyph
- **Conflict**: Corruption wants red particles; glyph wants semantic color
- **Resolution**: Blend colors; corruption influences intensity
- **Outcome**: Corruption tints the glyph; semantic meaning preserved
- **Mechanism**: Particle emitter color = glyph color * (1 - corruption_blend)

### General Conflict Resolution Algorithm

1. **Identify layers competing** for same visual role
2. **Apply priority** from above list
3. **Higher priority layer** maintains full design
4. **Lower priority layer** degrades gracefully:
   - Reduce opacity to 50% of intended
   - Adjust position/rotation to avoid overlap
   - Disable non-essential sub-components
5. **Verify** core geometry never occluded

---

## 6. AUDIT & VIOLATION DETECTION

### Integration with Existing Tools

#### VisualOverlayAuditSystem
- **Scans**: All layers on all nodes
- **Detects**:
  - ❌ Opaque filled planes/circles (Rule 1 violation)
  - ❌ Layers occluding core (Rule 2 violation)
  - ❌ Unknown layer types
- **Reports**: Violation details with layer name, opacity, geometry
- **Action**: `visualOverlayAudit.reportStats()` to verify

#### VisualLayerDebugger
- **Monitors**: Real-time layer additions
- **Logs**: Each mesh addition to scene with layer type
- **Alerts**: Unknown layers, suspicious opacity values
- **Action**: `visualLayerDebugger.enable()` to monitor
- **Review**: `visualLayerDebugger.reportSummary()` for events

### Violation Detection Matrix

| Rule | Detection | Tool | Console Command |
|------|-----------|------|-----------------|
| 1: No filled discs | Opacity > 0.5 + PlaneGeometry | Audit | `visualOverlayAudit.reportStats()` |
| 2: No core occlusion | Layer covers core position | Audit | Check "opaqueCount" |
| 3: No size change | Shell size ≠ authority value | NodeShellSizeAuthority | `nodeShellSizeAuthority.getStatistics()` |
| 4: Single shell authority | Multiple systems modifying | CoreVisualAuthoritySystem | `window.CoreVisualAuthorityDebug` |
| 5: Selection wireframe only | Selection opacity > 0.75 + filled | Audit | Check "wireframeCount" |
| 6: Debug disabled | Debug layer in production | Debugger | `visualLayerDebugger.getSuspiciousEntries()` |
| 7: Aura ≤ 0.6 | Aura opacity > 0.6 | Audit | Check opacity values |
| 8: Glyphs non-occluding | Glyph > 0.7 or covers core | Debugger | Monitor with `enable()` |

### How to Run Audits

```javascript
// Quick health check
visualOverlayAudit.reportStats();
// Output: Violations count, wireframe count, helper count

// If violations found
const report = visualOverlayAudit.scanAllNodes();
report.violations.forEach(v => {
  console.warn(`${v.nodeId}: ${v.layerName} (${v.issue})`);
});

// Monitor for new violations
visualLayerDebugger.enable();
// ... play game ...
visualLayerDebugger.reportSummary();

// Inspect specific node
const details = visualOverlayAudit.getNodeOverlays(selectedNode);
console.table(details.overlays);
```

### Violation Severity Levels

| Severity | Example | Action |
|----------|---------|--------|
| **CRITICAL** | Opaque plane covering core | Remove immediately |
| **HIGH** | Aura opacity 0.8 (> 0.6) | Reduce to ≤ 0.6 |
| **MEDIUM** | Unknown layer name | Register or investigate |
| **LOW** | Glyph opacity 0.72 (> 0.7) | Document; adjust if needed |
| **INFO** | New layer registered | Log for tracking |

---

## 7. ARCHITECTURAL NOTES

### Visual System Authorities (Single Source of Truth)

| Layer | Authority System | Implementation | Override Allowed |
|-------|------------------|-----------------|-----------------|
| CORE | CoreVisualAuthoritySystem | Enforces immutability | ❌ NO |
| SHELL | NodeShellSizeAuthority | Static (category + tier) | ❌ NO |
| AURA | NodeAuraSystem_v1 | Dynamic intensity/color | ✓ YES (via metrics) |
| GLYPHS | GlyphLayer4_MultiFusion | Semantic rendering | ✓ YES (via states) |
| STRESS | CorruptionVisualFX | Corruption-driven | ✓ YES (via degradation) |
| SELECTION | UISelectedNodeHighlight3_2 | Input-driven | ❌ NO |
| STATE | SemanticGlyphAI | Metric-driven | ✓ YES (via events) |
| DEBUG | Developer console | Manual only | ✓ YES (dev-only) |

### Rendering Order (Three.js RenderOrder)

```
renderOrder 1000: CORE_GEOMETRY (via CoreVisualAuthoritySystem)
renderOrder 999:  SHELL_OUTLINE (via NodeShellSizeAuthority)
renderOrder 100:  EDGE_GLOW
renderOrder 50:   AURA_LAYER
renderOrder 40:   GLYPH_LAYER
renderOrder 30:   STATE_GLYPH
renderOrder 20:   STRESS_INDICATOR
renderOrder 10:   FOCUS_RING
renderOrder 5:    SELECTION_HIGHLIGHT
renderOrder 0:    DEBUG_OVERLAY (if enabled)
```

**Note**: Higher renderOrder renders on top in Three.js (subject to depthTest).

### Performance Considerations

| Layer | Per-Node Cost | Notes |
|-------|---------------|-------|
| CORE | ~0.1ms | Immutable; cached |
| SHELL | ~0.1ms | Static; no updates |
| EDGE | ~0.05ms | Simple line segments |
| AURA | ~0.2ms | Particle system (LOD aware) |
| GLYPHS | ~0.3ms | Multiple meshes; LOD culls |
| STATE | ~0.1ms | Small helper geometry |
| STRESS | ~0.2ms | Particle emission |
| SELECTION | ~0.1ms | Only on selected node |
| FOCUS | ~0.05ms | Only on focused node |
| DEBUG | ~0.05ms | Disabled in production |

**Budget**: ~1.2ms per 500 nodes (reasonable for 60 FPS)

---

## 8. FUTURE EXTENSIONS

### Approved for Future Addition

These layers have reserved slots in the hierarchy (between existing layers):

```
Layer 4.5: DAMAGE_INDICATOR (for error nodes, extreme states)
Layer 5.5: RITUAL_EMPHASIS (for mythic rituals, special events)
Layer 6.5: NETWORK_HARMONY_BLOOM (for phase 8+ harmony effects)
```

**Addition Process**:
1. Document layer in this file
2. Define opacity bounds (≤ previous layer)
3. List allowed categories
4. Add audit rules
5. Register with VisualLayerDebugger
6. Deploy with zero breaking changes

### Planned Restrictions (Not Yet Active)

- **Per-category layer limits**: Some categories may restrict glyphs
- **Performance mode layers**: Mobile builds may disable STATE_GLYPH
- **Accessibility layers**: High-contrast mode may adjust opacities

---

## 9. REFERENCE QUICK LOOKUP

### "Can I add a visual effect X to nodes?"

1. **Is X a filled disc or plane?** → ❌ FORBIDDEN (Rule 1)
2. **Does X occlude the core?** → ❌ FORBIDDEN (Rule 2)
3. **Does X change node size?** → ❌ FORBIDDEN (Rule 3)
4. **Is X for selection/focus?** → Must be wireframe (Rule 5)
5. **Is X higher-priority than existing layer?** → Apply conflict resolution (Section 5)
6. **Is X within a layer's opacity bounds?** → ✓ ALLOWED
7. **Is layer name in VisualLayerDebugger.knownLayers?** → ✓ ALLOWED

If all checks pass: **X is allowed; add documentation to this file.**

### "Why is my visual effect not rendering?"

- Check renderOrder (correct layer stack?)
- Verify opacity is > 0 and intended value
- Check if higher-priority layer is occluding it
- Run `visualOverlayAudit.getNodeOverlays(node)` to see all layers
- Check if geometry is inside scene (not removed)

### "How do I debug visual layer conflicts?"

```javascript
// 1. Get all layers on a node
const layers = visualOverlayAudit.getNodeOverlays(myNode);

// 2. Check priority of each layer
const priorities = {
  'CORE_GEOMETRY': 1,
  'SHELL_OUTLINE': 2,
  // ... etc (from Section 5)
};

// 3. Identify highest-priority active layer
const active = layers.overlays
  .sort((a, b) => priorities[a.layerName] - priorities[b.layerName]);
console.log('Active layer (highest priority):', active[0]);

// 4. Lower-priority layers should degrade
active.slice(1).forEach(layer => {
  console.warn(`${layer.layerName} is lower priority; may be degraded`);
});
```

---

## SUMMARY: VISUAL TRUTH

This hierarchy establishes **canonical truth** about node rendering:

✅ **ALLOWED**: 
- 10 defined layers in strict order
- Wireframe and low-opacity geometries
- Dynamic color/intensity based on metrics
- Conflict resolution via priority

❌ **FORBIDDEN**:
- Filled discs, planes, opaque overlays
- Any layer changing node size
- Core geometry occlusion
- Multiple systems controlling shell authority

🔍 **AUDITED BY**:
- VisualOverlayAuditSystem (scans all nodes)
- VisualLayerDebugger (monitors additions)
- Console APIs (real-time verification)

**This document is authoritative. Anything not explicitly allowed here must NOT render.**
