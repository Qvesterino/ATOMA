# VISUAL HIERARCHY REGISTRY — Adoption Checklist

**Purpose**: Track gradual adoption of VisualHierarchyRegistry across all visual systems.

**Status**: Phase 1 Complete ✅ | Phase 2 In Planning ⏳

---

## ✅ PHASE 1: FOUNDATION (Session 21 — COMPLETE)

### Core Implementation
- [x] Create VisualHierarchyRegistry.js (410 lines)
- [x] Define 7 canonical layers with renderOrder, opacity, blending
- [x] Implement query interface with fallback logic
- [x] Add validation and debugging utilities
- [x] Attach to window for console access
- [x] Create comprehensive documentation (800 lines)
- [x] Create quick integration guide
- [x] Create verification test suite

### Initial Integrations (Proof of Concept)
- [x] EnhancedNodeModels.js — CORE, ARCHETYPE layers
  - [x] Add import
  - [x] Add helper methods
  - [x] Integrate into createInputNode0() (proof)
  - [x] Test: Node children have userData.visualLayer
  
- [x] NodeAuraSystem_v1.js — AURA layer
  - [x] Add import
  - [x] Query registry in registerNode()
  - [x] Set userData.visualLayer
  - [x] Test: Aura meshes have correct renderOrder and layer
  
- [x] main.js
  - [x] Add import
  - [x] Attach registry to window

### Verification
- [x] Run VisualHierarchyVerificationTest.js
- [x] Manual console testing (window.printVisualHierarchy())
- [x] Verify no breaking changes
- [x] Confirm fallback logic works

---

## ⏳ PHASE 2: CORE VISUAL SYSTEMS (Session 22)

### Evolution Visual System

**System**: EvolutionRegistry / SafeEvolutionManager  
**Layer**: EVOLUTION (renderOrder = 50)  
**Current Status**: ❌ Not integrated  

**Integration Checklist**:
- [ ] Locate mesh creation in EvolutionRegistry or SafeEvolutionManager
- [ ] Add import: `import { VisualHierarchyRegistry }...`
- [ ] Replace hardcoded renderOrder with query
- [ ] Add userData.visualLayer = 'EVOLUTION'
- [ ] Test: Evolution overlays at correct renderOrder
- [ ] Verify: Can zoom in/out without visual explosion
- [ ] Verify: Evolution layer always below FX, always above CORE

**Estimated Lines**: 3–5  
**Priority**: HIGH (evolution visuals currently uncoordinated)  
**Difficulty**: Easy (single mesh creation site)

---

### Link Aura System

**System**: LinkAuraSystem_v1 / link effects  
**Layer**: EVOLUTION or FX (renderOrder = 50 or 100)  
**Current Status**: ❌ Not integrated  

**Integration Checklist**:
- [ ] Locate mesh creation in link aura system
- [ ] Determine appropriate layer (EVOLUTION or FX)
- [ ] Add import: `import { VisualHierarchyRegistry }...`
- [ ] Replace hardcoded renderOrder with query
- [ ] Add userData.visualLayer
- [ ] Test: Link auras render at correct layer
- [ ] Verify: Link auras don't obscure nodes

**Estimated Lines**: 3–5  
**Priority**: MEDIUM  
**Difficulty**: Easy

---

### Ritual / Event Effects

**System**: MythicRitualController / MetricReactiveWorldEvents  
**Layer**: FX (renderOrder = 100)  
**Current Status**: ❌ Not integrated  

**Integration Checklist**:
- [ ] Locate mesh/particle creation in ritual system
- [ ] Add import: `import { VisualHierarchyRegistry }...`
- [ ] Replace hardcoded renderOrder with query
- [ ] Add userData.visualLayer for meshes
- [ ] Test: Ritual effects render on top (as intended)
- [ ] Verify: Effects don't prevent node interaction
- [ ] Verify: Rituals disabled by default still work

**Estimated Lines**: 5–8  
**Priority**: MEDIUM  
**Difficulty**: Medium (multiple effect types)

---

## ⏳ PHASE 3: SECONDARY SYSTEMS (Session 23–24)

### Link Priority VFX

**System**: LinkPriorityVFX / LinkGlowSynergyEngine  
**Layer**: FX (renderOrder = 100)  
**Current Status**: ❌ Not integrated  

**Integration Checklist**:
- [ ] Locate VFX mesh creation
- [ ] Add registry import
- [ ] Query renderOrder for FX layer
- [ ] Test across different link priorities

**Estimated Lines**: 3–5  

---

### Synergy Visual Effects

**System**: SynergyVFXEngine / SynergyGlowSynergyEngine  
**Layer**: FX (renderOrder = 100)  
**Current Status**: ❌ Not integrated  

**Integration Checklist**:
- [ ] Locate synergy effect mesh creation
- [ ] Add registry import
- [ ] Query renderOrder for FX layer
- [ ] Test: Synergy effects stack properly

**Estimated Lines**: 3–5  

---

### Metric Reactive Events

**System**: MetricReactiveWorldEvents  
**Layer**: FX (renderOrder = 100)  
**Current Status**: ❌ Not integrated  

**Integration Checklist**:
- [ ] Locate event effect mesh creation
- [ ] Add registry import
- [ ] Query renderOrder for FX layer
- [ ] Test: Metric pulses don't obscure nodes

**Estimated Lines**: 3–5  

---

### Particle Effects (General)

**System**: Various particle emitters  
**Layer**: FX (renderOrder = 100)  
**Current Status**: ⏳ Audit needed  

**Integration Checklist**:
- [ ] Audit all particle system mesh creation
- [ ] Add registry import to systems using particles
- [ ] Query renderOrder for FX layer
- [ ] Test: Particles render at expected layer

**Estimated Lines**: 3–5 per system  

---

### Remaining Hardcoded renderOrder Values

**Current Status**: ⏳ Full audit needed  

**Integration Checklist**:
- [ ] Grep codebase: `grep -r "renderOrder\s*=" --include="*.js"`
- [ ] Catalog all hardcoded values
- [ ] Determine appropriate layer for each
- [ ] Convert to registry queries
- [ ] Test: Visual stack correct

---

## ⏳ PHASE 4: DEPRECATION & CLEANUP (Session 25–26)

### Remove Legacy Systems

**Systems to Deprecate**:
- [ ] LegacyDebugConeCleanup (DEBUG layer)
- [ ] LegacyGlyphCleanup (v1–v2 glyph removal)
- [ ] FractalHexMarker (if still present)

**Checklist**:
- [ ] Verify no active dependencies
- [ ] Remove from main.js imports
- [ ] Remove console methods
- [ ] Confirm no visual regressions

---

### DEBUG Layer Finalization

**Current Status**: DEBUG layer defined but not actively used

**Checklist**:
- [ ] Remove DEBUG layer code (deprecated legacy systems gone)
- [ ] Reduce to 6 core layers if DEBUG unused
- [ ] OR keep DEBUG for future debug visualizations
- [ ] Document decision

---

### Registry as De Facto Standard

**Objectives**:
- [ ] All visual systems query registry for renderOrder
- [ ] Hardcoded renderOrder values eliminated
- [ ] Registry becomes canonical source of truth
- [ ] Documentation updated with examples

---

## 📊 ADOPTION METRICS

### Phase 1 ✅
- **Systems Integrated**: 2 (EnhancedNodeModels, NodeAuraSystem_v1)
- **Layers Adopted**: 3 (CORE, ARCHETYPE, AURA)
- **Lines of Code**: 40
- **Completion**: 100%

### Phase 2 ⏳
- **Systems Planned**: 3 (Evolution, Links, Rituals)
- **Layers Planned**: 1 (EVOLUTION, FX shared)
- **Estimated Lines**: 15–20
- **Completion**: 0%

### Phase 3 ⏳
- **Systems Planned**: 5+ (Priority VFX, Synergy, Metrics, Particles, etc.)
- **Layers Planned**: 1 (FX)
- **Estimated Lines**: 20–40
- **Completion**: 0%

### Phase 4 ⏳
- **Systems to Deprecate**: 3 (LegacyDebugConeCleanup, LegacyGlyphCleanup, FractalHexMarker)
- **Completion**: 0%

---

## 🔄 PROCESS FOR EACH SYSTEM

### Standard Integration Workflow

**Step 1: Identify**
- Locate mesh creation code
- Identify appropriate layer

**Step 2: Import**
```javascript
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
```

**Step 3: Replace**
```javascript
// BEFORE:
mesh.renderOrder = 50;

// AFTER:
mesh.renderOrder = VisualHierarchyRegistry?.getRenderOrder('EVOLUTION', 50) ?? 50;
mesh.userData.visualLayer = 'EVOLUTION';
```

**Step 4: Test**
- Verify mesh renders at correct layer
- Run visual regression test
- Confirm no gameplay changes

**Step 5: Document**
- Add line to this checklist
- Update integration count

---

## ✅ SIGN-OFF & TRACKING

### Phase 1 Sign-Off
- **Completed**: Session 21
- **Status**: ✅ Production Ready
- **Verifier**: Forensic Audit (Session 21 complete)

### Phase 2 Sign-Off
- **Estimated**: Session 22
- **Expected Status**: Ready for Phase 3
- **Blocker**: None identified

### Overall Timeline
- **Phase 1 Complete**: Session 21 ✅
- **Phase 2 Target**: Session 22
- **Phase 3 Target**: Session 23–24
- **Phase 4 Target**: Session 25–26
- **De Facto Standard**: Session 27+

---

## 📋 QUICK STATS

| Metric | Value |
|--------|-------|
| Total Layers | 7 (canonical) |
| Systems Integrated (Phase 1) | 2 |
| Systems Targeted (Phase 2) | 3 |
| Systems Targeted (Phase 3) | 5+ |
| Total Estimated Lines (Full Rollout) | 100–150 |
| Breaking Changes | 0 |
| Backward Compatibility | 100% |
| Performance Impact | Negligible (~0.001ms per query) |

---

## 🎓 HELPFUL RESOURCES

- **Registry**: `/VisualHierarchyRegistry.js`
- **Quick Start**: `/VISUAL_HIERARCHY_INTEGRATION_QUICKSTART.md`
- **Full Guide**: `/VISUAL_HIERARCHY_REGISTRY_GUIDE.md`
- **Test Suite**: `/VISUAL_HIERARCHY_VERIFICATION_TEST.js`
- **Implementation Summary**: `/SESSION_21_RULE1_IMPLEMENTATION_SUMMARY.md`

---

## 🔔 REMINDERS

**DO**:
- ✅ Use registry for all new renderOrder assignments
- ✅ Include fallback logic in all queries
- ✅ Tag meshes with userData.visualLayer
- ✅ Test visual stack after each integration
- ✅ Update this checklist as you go

**DON'T**:
- ❌ Modify registry constants
- ❌ Hardcode renderOrder values
- ❌ Skip the fallback logic
- ❌ Forget userData.visualLayer tagging
- ❌ Assume registry is available (always include fallback)

---

**Status**: ACTIVE ADOPTION IN PROGRESS  
**Last Updated**: Session 21  
**Next Review**: Session 22

