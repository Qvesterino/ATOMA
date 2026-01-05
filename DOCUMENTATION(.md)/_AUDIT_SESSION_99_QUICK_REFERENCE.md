# Session 99 Audit: Non-Node Visual Overlays — Quick Reference

## One-Sentence Summary
**19 world-space overlay systems (node auras, link fields, world environment) render directly to `scene`, bypassing node-bound enforcement gate.**

---

## The 12 Translucent Discs Mystery — SOLVED

### Root Cause
**NodeAuraSystem_v1.js adds spherical GPU halos directly to scene at node positions.**

```javascript
// NodeAuraSystem_v1.js, line 432
const mesh = new THREE.Mesh(this.auraGeometry, material);
this.scene.add(mesh);  // ← NOT node.group, it's world-space
```

**Why Enforcement Gate Doesn't Stop It**: Gate only controls attachments INSIDE `node.group`. World-space objects are outside its jurisdiction.

---

## 19 Overlay Systems at a Glance

| # | System | File | Type | Opacity | World-Space? |
|---|--------|------|------|---------|--------------|
| 1 | Node Aura (v1.0) | `NodeAuraSystem_v1.js` | Sphere halo | 0.24-0.64 | ✅ YES |
| 2 | Link Aura | `LinkAuraSystem_v1.js` | Influence field | ~0.4 | ✅ YES |
| 3 | Harmony Aura | `HarmonyAuraShaderMaterial.js` | Link stabilization | Varies | ✅ YES |
| 4 | Data Flow Particles | `NeonLinkVisuals.js` | Sphere (r=0.08) | 1.0→fade | ✅ YES |
| 5 | Synergy Flow Particles | `NeonLinkVisuals.js` | Sphere (variable) | ~0.9 | ✅ YES |
| 6 | Error Pulse | `NeonLinkVisuals.js` | Sphere (r=0.15) | 1.0 | ✅ YES |
| 7 | Shatter Effect | `NeonLinkVisuals.js` | Box fragments | 1.0→fade | ✅ YES |
| 8 | Link Preview | `NeonLinkVisuals.js` | Curve line | 0.25-0.3 | ✅ YES |
| 9 | Multi-Output Glow | `NeonLinkVisuals.js` | Torus rings | 0.6 | ✅ YES |
| 10 | Chamber Floor | `World.js` | Circle (r=12) | 0.3-0.4 | ✅ YES |
| 11 | Holographic Grid | `World.js` | Lines (12x) | 0.15 | ✅ YES |
| 12 | Data Wires | `World.js` | Curves (8x) | 0.2 | ✅ YES |
| 13 | Ripple Rings | `World.js` | Torus (8x) | 0→anim | ✅ YES |
| 14 | Cascade VFX | `PHASE5_CascadePropagationVisuals_v1.js` | Rings | Event | ✅ YES |
| 15 | Inter-Network | `PHASE5_InterNetworkConnectionVisuals_v1.js` | Beams | Event | ✅ YES |
| 16 | Legendary Node VFX | `_SafeLegendaryNodePack.js` | Multi | Event | ✅ YES |
| 17 | Glyph Fusion | `_GlyphFusionOverlay4_1.js` | Multi | Event | ✅ YES |
| 18 | Weather Effects | `_SafeAIWeatherPack.js` | Multi (12+) | ~0.3-0.6 | ✅ YES |
| 19 | Environment (Dream/Quantum) | `DreamDesert.js`, etc. | Multi | Varies | ✅ YES |

---

## Policy Gaps

### Gap 1: Aura Opacity Not Constrained
- **Current**: Node aura opacity 0.24-0.64 independent of node core opacity
- **Risk**: Aura halo can obscure low-opacity nodes
- **Fix**: Link aura opacity to node core opacity rule

### Gap 2: Link Fields Not Occupancy-Aware
- **Current**: Link influence fields overlap any node, regardless of relationship
- **Risk**: Link auras visually interfere with unrelated nodes
- **Fix**: Implement NodeSurfaceProtectionRule_v2-style attenuation for link auras

### Gap 3: World Environment Not Proximity-Aware
- **Current**: Floor ring (Y=0.01) opacity 0.3-0.4 at fixed level
- **Risk**: Occludes nodes positioned near chamber floor
- **Fix**: Fade world rings when nodes approach Y-position

### Gap 4: Particle Lifetime Not Coordinated
- **Current**: Particles spawned/destroyed individually, no shared pool
- **Risk**: Frame rate impact from uncontrolled particle creation
- **Fix**: Implement particle budget + lifecycle manager

---

## What's NOT a Problem

✅ Link preview lines (temporary, short-lived)  
✅ Event-driven VFX (cascade, legendary, glyph) — time-limited  
✅ World environment (intentional world-layer, separate from nodes)  
✅ UI overlays (inspection panels, metrics) — contextual to user interaction  

---

## Enforcement Gate Scope

### Protected (Inside node.group)
```
node.group
├── visualRoot
│   ├── core geometry ✅ PROTECTED
│   ├── hologram shell ✅ PROTECTED
│   ├── attachment layer ✅ PROTECTED
│   └── evolution layer ✅ PROTECTED
```

### Unprotected (World-space)
```
scene
├── NodeAura meshes ❌ NOT PROTECTED
├── LinkAura meshes ❌ NOT PROTECTED
├── Particles ❌ NOT PROTECTED
├── Environment rings ❌ NOT PROTECTED
└── Event VFX ❌ NOT PROTECTED
```

---

## Files to Review if Extending Enforcement

| Component | File | Lines | Function |
|-----------|------|-------|----------|
| Aura registration | `NodeAuraSystem_v1.js` | 440-482 | `registerNode()` |
| Aura attachment | `NodeAuraSystem_v1.js` | 413-435 | `_safeAttachAura()` |
| Link particle spawn | `NeonLinkVisuals.js` | 604-673 | `createDataFlowParticles()` |
| Link preview | `NeonLinkVisuals.js` | 1005-1026 | `createPreviewLine()` |
| World rings | `World.js` | 27-70 | `createChamberFloor()` |
| Grid lines | `World.js` | 198-228 | `createHolographicGrid()` |

---

## Key Code Patterns

### Pattern 1: Scene.add() for World-Space Overlays
```javascript
// NodeAuraSystem_v1.js line 432
const mesh = new THREE.Mesh(this.auraGeometry, material);
this.scene.add(mesh);  // ← Direct world-space attachment
```

### Pattern 2: Enforcement Gate Check (Limited Scope)
```javascript
// NodeAuraSystem_v1.js line 426
if (this.enforcementGate && !this.enforcementGate.canAttach(request)) {
  return false;  // ← Only gates ATTACHMENT, not opacity
}
```

### Pattern 3: World Environment (Intentional)
```javascript
// World.js line 39
this.scene.add(floor);  // ← Permanent world asset
```

---

## Why This Matters

1. **Node Visibility**: Aura halos can visually dominate low-opacity nodes
2. **Link Context**: Link influence fields interfere with node identity
3. **Performance**: Uncoordinated particles can cause frame stutters
4. **Visual Hierarchy**: World overlays can contradict enforcement rules

---

## Recommended Actions (Future Work)

### Short-term
- [ ] Document which overlays should be "node-aware"
- [ ] Define opacity cap for world-space auras when node core is opaque
- [ ] Add proximity fade for floor ring mesh

### Medium-term
- [ ] Create `WorldSpaceOverlayPolicy` class (similar to NodeSurfaceProtectionRule_v2)
- [ ] Integrate link aura attenuation for unrelated nodes
- [ ] Implement particle pool + budget

### Long-term
- [ ] Unified visual hierarchy that includes world-space layers
- [ ] Automatic rescaling of world overlays based on node identity state
- [ ] Performance monitoring for overlay creation rates

---

## Detection: How to Spot These Overlays

### Visual Inspection
1. Look for large translucent spheres near each node → NodeAuraSystem
2. Look for semi-transparent rings at Y=0-0.1 → World environment
3. Look for flowing particles along links → Data flow/synergy particles
4. Look for temporary rings during cascades → Event VFX

### Console Detection
```javascript
// Count all meshes in scene not attached to nodes
scene.traverse((obj) => {
  if (obj.isMesh && !obj.parent.userData?.isNodeGroup) {
    console.log('Non-node mesh:', obj.name, obj.geometry.constructor.name, obj.material.opacity);
  }
});
```

### Programmatic Detection
```javascript
// Find all aura meshes
const auras = [];
scene.traverse((obj) => {
  if (obj.userData?.visualLayer === 'AURA') {
    auras.push(obj);
  }
});
console.log(`Found ${auras.length} aura meshes in world-space`);
```

---

## Glossary

- **World-space**: Objects attached to `scene`, not to node hierarchy
- **Node-bound**: Objects inside `node.group`, subject to enforcement gate
- **Overlay**: Translucent/additive mesh rendered over scene
- **Aura**: GPU halo field around node (personality-driven)
- **Influence field**: Area around link representing connection strength
- **Enforcement gate**: System that validates visual attachments to nodes

---

## Related Documentation

- **Full audit**: `_AUDIT_COMPREHENSIVE_NON_NODE_VISUAL_OVERLAYS_SESSION_99.md`
- **Enforcement gate**: `VisualLayerEnforcementGate.js` 
- **Node surface protection**: `NodeSurfaceProtectionRule_v2.js`
- **Aura system**: `NodeAuraSystem_v1.js`

---

**Status**: ✅ READ-ONLY AUDIT COMPLETE  
**Session**: 99  
**Generated**: Comprehensive Non-Node Overlay Audit System
