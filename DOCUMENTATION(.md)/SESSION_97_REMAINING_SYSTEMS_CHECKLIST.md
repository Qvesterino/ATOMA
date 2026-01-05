# SESSION 97: REMAINING SYSTEMS FOR ENFORCEMENT INTEGRATION
## Quick Reference & Status Tracker

---

## PRIORITY 1: LinkAuraSystem_v1 (Next Session)

**File**: `/LinkAuraSystem_v1.js` (zero-width space issue in path)

**Required Integration**:
1. Import `VisualLayerEnforcementIntegrationHelpers`
2. Add `enforcementGate` parameter to constructor
3. Create `_canApplyLinkAuraModification()` validation method
4. Check enforcement in `registerLink()` before scene attachment
5. Check enforcement in `update()` before material modifications

**Key Points**:
- Link auras are cylindrical meshes (LinkAuraInstance objects)
- Uniforms modified: `uAuraIntensity`, `uAuraRadius`, synergy/quality metrics
- Attachment happens in `registerLink()` → scene.add(mesh)
- Runtime updates happen in `update()` loop
- Opacity estimation should use profile-based intensity mapping

**Expected Lines**: ~60 lines

---

## PRIORITY 2: Remaining Aura Modifier Systems

### AuraModulationIntegration_v1
- **Status**: 📍 Not yet integrated
- **Purpose**: Bridges AuraModulationSystem to game events
- **Key Method**: Likely applies modulations via `pushModulation()`
- **Enforcement Point**: Before pushing new modulations onto stack

### FresnelIntegrationPatch.js
- **Status**: 📍 Not yet integrated
- **Purpose**: Patches fresnel rim-light into existing materials
- **Key Method**: Material uniform modification
- **Enforcement Point**: Before uniform updates

### Others to Identify

Run this to find all remaining aura-related files:
```bash
ls -la | grep -i aura
```

Expected candidates:
- `AuraLODCulling.js`
- `AuraBaselineInvalidationFix.js`
- Any `*Aura*Integration*.js` files

---

## SYSTEMS ALREADY INTEGRATED (SESSIONS 94-97)

### ✅ Session 94: Attachment Layer
| System | Lines | Status |
|--------|-------|--------|
| GlyphLayer4_MultiFusion | 50 | Complete |
| NodeAuraSystem_v1 | 30 | Complete |
| SemanticGlyphAI | 30 | Complete |

### ✅ Session 95: Modification Layer
| System | Lines | Status |
|--------|-------|--------|
| HarmonyAuraController | 50 | Complete |
| CorruptionDesaturationSystem | 65 | Complete |
| SynergyColorSystem | 60 | Complete |

### ✅ Session 96: Effects Layer
| System | Lines | Status |
|--------|-------|--------|
| FresnelRimLightController | 70 | Complete |
| GlobalAuraOpacityClamp | 45 | Complete |

### ✅ Session 97: Remaining Aura Systems
| System | Lines | Status |
|--------|-------|--------|
| AuraModulationSystem | 40 | Complete |
| ArchetypeAuraEnhancement_v1 | 50 | Complete |
| MythicAuraIntegration_v1 | 55 | Complete |

---

## ENFORCEMENT INTEGRATION PATTERN

Every remaining system should follow this 5-step pattern:

### Step 1: Import Helpers
```javascript
import { VisualLayerEnforcementIntegrationHelpers as IntegrationHelpers } from './VisualLayerEnforcementIntegrationHelpers.js';
```

### Step 2: Add Gate Parameter
```javascript
constructor(config = {}) {
  // ... existing params ...
  this.enforcementGate = config.enforcementGate || null;  // Optional
}
```

### Step 3: Create Validation Method
```javascript
_canApplyModification(node, value, layerType) {
  if (!this.enforcementGate) return true;
  
  const request = IntegrationHelpers.createVisualAttachmentRequest({
    nodeId: node.userData?.id || node.uuid,
    nodeCategory: node.userData?.category || 'unknown',
    layerType: layerType,  // e.g., 'AURA_LAYER'
    geometryType: 'Spheres',
    opacity: estimateOpacity(value),  // System-specific
    sourceSystem: this.constructor.name,
    description: `System description`
  });
  
  return this.enforcementGate.canAttach(request);
}
```

### Step 4: Check Before Modification
```javascript
update(deltaTime) {
  for (const item of items) {
    const newValue = computeNewValue(item);
    
    // Check enforcement before modifying material
    if (!this._canApplyModification(item.node, newValue, 'AURA_LAYER')) {
      continue;  // Skip this modification
    }
    
    // Safe to apply
    item.material.someProperty = newValue;
  }
}
```

### Step 5: Pass Gate to Constructor
In main.js:
```javascript
const system = new SystemName({
  // ... existing config ...
  enforcementGate: visualLayerEnforcementGate  // Inject gate
});
```

---

## OPACITY ESTIMATION BY SYSTEM TYPE

Reference for remaining integrations:

| System Type | Signal | Formula | Range |
|------------|--------|---------|-------|
| **Modulation** | Mod intensity | `curve.min + (curve.max - curve.min) * intensity` | 0.08–0.20 |
| **Archetype** | Intensity mult | `mult * 0.3` | 0.5–0.6 |
| **Mythic** | Boost | `boost * 0.2 + 0.3` | 0.3–0.6 |
| **Link Aura** | Profile intensity | Profile-based mapping | 0.3–0.6 |
| **Color System** | Color influence | Influence factor * 0.3 | 0.3–0.6 |

**Key**: All estimates should be clamped to AURA_LAYER bounds (0.3–0.6).

---

## VERIFICATION CHECKLIST FOR EACH SYSTEM

Before marking complete:

- [ ] Import statement added and correct
- [ ] Constructor accepts optional `enforcementGate` parameter
- [ ] Validation method created with proper request structure
- [ ] All material modification points check enforcement first
- [ ] Graceful fallback when gate is null
- [ ] Error handling for missing node/link context
- [ ] Console output shows system name in descriptions
- [ ] No performance regression (test with 100+ nodes)
- [ ] Backward compatible (existing code works unchanged)

---

## CONSOLE TESTING COMMANDS

After integration, verify each system works:

```javascript
// Check gate status
window.debugVisualLayer.getMode();

// Monitor stats
setInterval(() => {
  const stats = window.debugVisualLayer.getStats();
  console.log(`Approvals: ${stats.approvalsGranted}, Denials: ${stats.approvalsDenied}`);
}, 5000);

// List recent violations
window.debugVisualLayer.getRecentViolations(10);

// Manually test a system
const req = {
  nodeId: 'test-123',
  nodeCategory: 'input',
  layerType: 'AURA_LAYER',
  geometryType: 'Spheres',
  opacity: 0.55,
  sourceSystem: 'SystemName'
};
console.log('Allowed:', window.debugVisualLayer.canAttach(req));
```

---

## SESSION WORKFLOW

### Session 98 Plan
1. Integrate LinkAuraSystem_v1 (60 lines)
2. Identify 2-3 other aura systems from codebase
3. Integrate those systems (100-150 lines total)
4. Comprehensive testing in DEV mode
5. Prepare for STRICT mode switch

### Session 99 Plan
1. Switch enforcement gate to STRICT mode
2. Run full gameplay soak test (2-4 hours)
3. Monitor console for violations
4. Adjust opacity bounds if needed
5. Document findings

### Session 100 Plan
1. Deploy to PROD mode (silent enforcement)
2. Continuous monitoring via console APIs
3. Prepare next feature (link collapse audio)
4. Complete comprehensive QA pass

---

## FILES TO UPDATE IN MAIN.JS

After each system integration, main.js may need to pass enforcement gate:

```javascript
// Example injection pattern
const enforcementGate = new VisualLayerEnforcementGate();

const auraModulation = new AuraModulationSystem(enforcementGate);
const archetypeAura = new ArchetypeAuraEnhancement_v1({
  // ... config ...
  enforcementGate
});
const mythicAura = new MythicAuraIntegration_v1({
  // ... options ...
  enforcementGate
});

// Next systems
const linkAura = new LinkAuraSystem_v1({
  // ... options ...
  enforcementGate
});
```

---

## QUICK REFERENCE: LAYER HIERARCHY

For opacity estimation and validation:

```
Priority 10: DEBUG_OVERLAY (lines, text, markers) — maxOpacity 0.8
Priority 9:  SELECTION_HIGHLIGHT (wireframe) — maxOpacity 0.75
Priority 8:  FOCUS_RING (outline) — maxOpacity 0.9
Priority 7:  STRESS_INDICATOR (particles, lines) — maxOpacity 0.4
Priority 6:  STATE_GLYPH (rings, lines, particles) — maxOpacity 0.5
Priority 5:  GLYPH_LAYER (planes, particles) — maxOpacity 0.7
Priority 4:  AURA_LAYER (particles, spheres) ← TARGET — maxOpacity 0.6
Priority 3:  SHELL_OUTLINE (mesh, icosphere) — maxOpacity 1.0
Priority 2:  EDGE_GLOW (line segments) — maxOpacity 0.8
Priority 1:  CORE_GEOMETRY (mesh) — maxOpacity 1.0
```

All aura systems modify **AURA_LAYER (Priority 4)** with bounds **0.0–0.6 opacity**.

---

## SUMMARY

**Current Status**:
- ✅ 11 systems integrated (Sessions 94-97)
- ⏳ LinkAuraSystem_v1 ready for Session 98
- ⏳ 2-3 more aura systems to identify and integrate
- 📍 ~750 total lines of enforcement code across all systems

**Overall Progress**: ~73% complete (11 of ~15 systems)

**Target Completion**: End of Session 99

**Deployment Readiness**: 🟡 Ready for STRICT mode after LinkAuraSystem_v1 integration
