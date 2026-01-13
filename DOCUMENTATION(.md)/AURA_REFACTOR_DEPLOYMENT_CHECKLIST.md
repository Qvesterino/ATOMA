# Aura Refactor — Deployment Checklist

## Pre-Deployment

- [ ] Read `AURA_REFACTOR_SPECIFICATION.md` (design + technical details)
- [ ] Read `AURA_REFACTOR_INTEGRATION_GUIDE.md` (how to integrate)
- [ ] Backup current aura system (`NodeAuraSystem_v1.js` safe copy)
- [ ] Test files available:
  - [ ] `/NodeAuraRefactor_ElegantRim.js` (main system)
  - [ ] `/AuraRefactorValidationHelper.js` (debug API)
  - [ ] `/AURA_REFACTOR_*.md` (documentation)

---

## Integration Phase

### Step 1: Import (main.js, line ~90)

**Before**:
```javascript
import { NodeAuraSystem_v1 } from './NodeAuraSystem_v1.js';
```

**After**:
```javascript
import { NodeAuraRefactor_ElegantRim } from './NodeAuraRefactor_ElegantRim.js';
import { setupAuraValidationAPI } from './AuraRefactorValidationHelper.js';
```

**Status**: [ ] Complete

### Step 2: Initialize System (main.js, ~line 500-600)

**Find**: Existing aura system initialization
```javascript
const auraSystem = new NodeAuraSystem_v1({...});
```

**Replace with**:
```javascript
const auraSystem = new NodeAuraRefactor_ElegantRim({
  scene: this.scene,
  camera: this.camera,
  debugEnabled: true,           // TEMPORARY: Enable for testing
  rimWidthScale: 1.25,          // 1.15-1.35 range
  baseOpacity: 0.10,            // 0.05-0.15 range
});

// Setup debug console (temporary)
setupAuraValidationAPI(auraSystem);
```

**Status**: [ ] Complete

### Step 3: Find Node Registration Points

**Locations** (search for `auraSystem.register` or `NodeAuraSystem_v1`):
- [ ] `World.js` (on node spawn)
- [ ] `AINodes.js` (AI node creation)
- [ ] Node spawner code
- [ ] Other integration points

**Pattern** (stays the same):
```javascript
// OLD AND NEW both work the same way
auraSystem.registerNode(node);
```

**Status**: [ ] Complete

### Step 4: Find Node Unregistration Points

**Locations** (search for `auraSystem.unregister` or node cleanup):
- [ ] Node destruction code
- [ ] Scene cleanup
- [ ] Memory cleanup routines

**Pattern** (stays the same):
```javascript
auraSystem.unregisterNode(node);
```

**Status**: [ ] Complete

### Step 5: Find Update Loop

**Location** (search for `auraSystem.update`):
- [ ] Main render loop
- [ ] Animation frame handler

**Pattern** (stays the same):
```javascript
// In requestAnimationFrame or render loop
auraSystem.update(deltaTime);
```

**Status**: [ ] Complete

### Step 6: Find Cleanup/Dispose

**Location** (search for `auraSystem.dispose`):
- [ ] Scene reset
- [ ] App shutdown
- [ ] Memory cleanup

**Pattern** (stays the same):
```javascript
auraSystem.dispose();
```

**Status**: [ ] Complete

---

## Testing Phase

### Phase 1: Smoke Test (Does it run?)

1. [ ] Import succeeds (no syntax errors)
2. [ ] System initializes (no console errors)
3. [ ] Debug API available: `window.aura` exists
4. [ ] Nodes spawn without crashes

**Verify**:
```javascript
// In console
typeof aura // should be 'object'
aura.test() // should run without errors
```

**Status**: [ ] Pass / [ ] Fail

### Phase 2: Registration Test (Are nodes getting auras?)

1. [ ] Enable debug mode:
   ```javascript
   toggleAuraDebug()
   ```

2. [ ] Spawn a node and watch console:
   ```
   [AURA] Registered SignalKnot#... rimIntensity=0.10 rimWidth=125% color=#7fffd4
   ```

3. [ ] Run status check:
   ```javascript
   logAuraStatus()
   // Should show registered auras
   ```

4. [ ] Verify: Node count > 0

**Status**: [ ] Pass / [ ] Fail

### Phase 3: Visual Test (Does it look right?)

1. [ ] Spawn 5-10 nodes
2. [ ] Rotate camera around each node
3. [ ] **Verify silhouette**: Aura visible at edges only
4. [ ] **Verify fade**: Aura fades when facing camera directly
5. [ ] **Verify core**: Core geometry fully opaque, no obscuring
6. [ ] **Verify color**: Colors are cool/restrained (not neon)
7. [ ] **Verify breathing**: Smooth intensity pulsing (1 cycle/~3s)

**Expected Result**:
- Aura appears as thin, glowing edge outline
- Disappears toward center
- No "bubble" or full glow
- Smooth, calming animation

**Status**: [ ] Pass / [ ] Fail

### Phase 4: Profile Test (Do profiles work?)

1. [ ] Enable debug:
   ```javascript
   toggleAuraDebug()
   ```

2. [ ] Get a node ID
3. [ ] Change profile:
   ```javascript
   auraSystem.updateNodeProfile(node, 'corrupted')
   ```

4. [ ] Verify console:
   ```
   [AURA] Updated profile for NodeName → corrupted
   ```

5. [ ] Verify visual: Color changed to violet

**Test each profile**:
- [ ] default (aquamarine)
- [ ] clarity (bright cyan)
- [ ] resonance (teal)
- [ ] corrupted (pale violet)
- [ ] harmony (soft amber)

**Status**: [ ] Pass / [ ] Fail

### Phase 5: Full Validation Suite

```javascript
// In console with debug enabled
aura.test()
```

**Expected Output**:
```
[AURA VALIDATION] FULL TEST SUITE
  ✅ Core Validation - X/X checks passed
  ✅ Rim Validation - X/X checks passed
  ✅ Animation Validation - X/X checks passed
  ✅ Registry Check - X/X checks passed
FINAL RESULT: 4/4 validation groups passed
```

**Status**: [ ] Pass / [ ] Fail

---

## Performance Phase

### Performance Metrics

1. [ ] **Frame rate** acceptable (target: 60 FPS)
   - Measure before: note baseline
   - Measure after: should be similar or better

2. [ ] **GPU time** not excessive
   - Use DevTools GPU profiler
   - Should be <5% of frame time for aura system

3. [ ] **Memory** stable
   - Open DevTools Memory tab
   - Spawn/despawn nodes cyclically
   - Memory should not grow unbounded

### Stress Test (100+ nodes)

1. [ ] Spawn 100+ nodes
2. [ ] Verify frame rate stable
3. [ ] Run debug validation:
   ```javascript
   logAuraStatus()  // Should show all auras
   aura.test()      // Should pass
   ```

4. [ ] Rotate camera (test during motion)
5. [ ] Expected: Performance remains acceptable

**Status**: [ ] Pass / [ ] Fail

---

## Finalization Phase

### Disable Debug Mode (Production)

**In main.js**:
```javascript
const auraSystem = new NodeAuraRefactor_ElegantRim({
  scene: this.scene,
  camera: this.camera,
  debugEnabled: false,  // ✅ Set to false for production
  ...
});
```

**Status**: [ ] Complete

### Optional: Fine-Tune Parameters

If auras appear too subtle or too bright:

```javascript
// Option 1: Adjust overall opacity
auraSystem.baseOpacity = 0.08;  // Reduce
// or
auraSystem.baseOpacity = 0.12;  // Increase

// Option 2: Adjust rim width
auraSystem.rimWidthScale = 1.20; // Narrower
// or
auraSystem.rimWidthScale = 1.30; // Wider
```

**Status**: [ ] Tuning complete

### Remove Old System Files (Optional)

**Backup first**:
- [ ] Save copy of `NodeAuraSystem_v1.js`
- [ ] Save copy of related aura files

**Then optionally delete**:
- [ ] `NodeAuraSystem_v1.js` (old system)
- [ ] `AuraLODCulling.js` (old optimization)
- [ ] `AuraModulationSystem.js` (old effects)
- [ ] `EmergencyAuraKillSwitch_v1.js` (old safety)

**Note**: Keep until fully confident in new system

**Status**: [ ] Cleanup complete (or deferred)

---

## Post-Deployment

### Monitoring (First 24-48 Hours)

- [ ] No console errors in production
- [ ] Auras render on all browsers/devices
- [ ] Performance acceptable on target hardware
- [ ] No visual artifacts or flickering
- [ ] Color palette appropriate for game state

### Gather Feedback

- [ ] Artist feedback on visual appearance
- [ ] Designer feedback on state indication clarity
- [ ] QA feedback on edge cases
- [ ] Performance team feedback on metrics

### Make Adjustments

Based on feedback, adjust:
- [ ] Opacity (too bright/dim)
- [ ] Rim width (too thin/wide)
- [ ] Color palette (too warm/cool)
- [ ] Animation speed (too fast/slow)

---

## Rollback Plan

If critical issues discovered:

### Emergency Rollback

1. [ ] Revert main.js import:
   ```javascript
   import { NodeAuraSystem_v1 } from './NodeAuraSystem_v1.js';
   ```

2. [ ] Revert initialization:
   ```javascript
   const auraSystem = new NodeAuraSystem_v1({...});
   ```

3. [ ] Verify old system working

**Time to rollback**: <5 minutes

### Known Issues (Non-Critical)

If issues are minor (tuning, colors, etc.):
- [ ] Document in `AURA_REFACTOR_KNOWN_ISSUES.md`
- [ ] Keep new system active
- [ ] Plan Phase 2 improvements

---

## Sign-Off

**Developer**: _________________ **Date**: _______

**QA**: _________________ **Date**: _______

**Technical Lead**: _________________ **Date**: _______

### Deployment Approval

- [ ] All critical tests passed
- [ ] Performance acceptable
- [ ] No blocker issues
- [ ] Ready for production

**Deployment Date/Time**: _________________

**Environment**: [ ] Dev [ ] Staging [ ] Production

---

## Post-Deployment Monitoring

| Metric | Target | Status | Notes |
|--------|--------|--------|-------|
| Frame Rate | ≥60 FPS | [ ] | |
| GPU Time | <5% | [ ] | |
| Memory Growth | Stable | [ ] | |
| Console Errors | 0 | [ ] | |
| Visual Glitches | 0 | [ ] | |
| User Feedback | Positive | [ ] | |

---

## Success Criteria

✅ **Deployment is successful if**:
1. System initializes without errors
2. All tests pass (smoke, visual, validation, performance)
3. Auras visible and appearing correctly
4. Frame rate maintained
5. No regressions in existing features
6. Artist/designer approval

✅ **Ready to celebrate if**:
- All above criteria met
- User feedback positive
- No critical issues found
- System performing as designed

---

## Next Steps

1. **Phase 2**: Advanced features (distance modulation, synergy coupling)
2. **Phase 3**: Visual polish (glyph integration, particle trails)
3. **Phase 4**: Performance (LOD, culling, instancing)
4. **Community**: Share aura system design with team

---

## Notes for Team

### For Developers

- Simple integration (just swap imports)
- Debug API available for troubleshooting
- Validation tests confirm correctness
- Performance expected to improve

### For Artists

- Auras now rim-lighting only (more elegant)
- Colors indicate state clearly
- Breathing smooth and calming
- No jarring visual effects

### For QA

- Use `aura.test()` for validation
- Check for visual glitches in edge cases
- Verify performance on all target platforms
- Document any unexpected behavior

---

**End of Deployment Checklist**
