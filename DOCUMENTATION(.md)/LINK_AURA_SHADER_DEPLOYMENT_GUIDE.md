# Link Aura Shader Alignment - Deployment Guide

## Pre-Deployment Checklist

### Code Review
- [x] LinkAuraShader.js created with identical noise function
- [x] LinkRendererConduit.js imports shader material
- [x] Material initialization uses correct config values
- [x] Uniform updates in frame loop are correct
- [x] Birth/removal intensity logic fixed
- [x] Disposal properly handled
- [x] No breaking changes to existing API

### Verification
- [x] Shader syntax valid (no compilation errors)
- [x] Uniforms initialized with correct default values
- [x] Opacity hierarchy enforced (link < node)
- [x] Color palette unified (no saturation spikes)
- [x] Directional deformation implemented
- [x] Amplitude reduction applied (60-70%)
- [x] Temporal synchronization enabled

---

## Deployment Steps

### 1. Verify Files Exist

```bash
# Check new files created
ls -la shaders/LinkAuraShader.js
ls -la LinkRendererConduit.js

# Verify imports
grep -n "createLinkAuraMaterial" LinkRendererConduit.js
```

**Expected**: 2 files present, 1+ import statements found

### 2. Validate Shader Code

```javascript
// In browser console
fetch('./shaders/LinkAuraShader.js')
  .then(r => r.text())
  .then(code => {
    console.log('Has permute:', code.includes('vec3 permute'));
    console.log('Has snoise:', code.includes('float snoise'));
    console.log('Has directional bias:', code.includes('directionalBias'));
  });
```

**Expected**: All three log `true`

### 3. Initialize Verification

```javascript
// Test initialization
import { createLinkAuraMaterial } from './shaders/LinkAuraShader.js';

const material = createLinkAuraMaterial();
console.log('Material created:', material instanceof THREE.ShaderMaterial);
console.log('Uniforms count:', Object.keys(material.uniforms).length);
```

**Expected**: Material is ShaderMaterial, 9 uniforms

### 4. Runtime Integration Test

```javascript
// After scene is loaded and links exist
window.verifyLinkAuraAlignment().then(results => {
  console.log(`Tests passed: ${results.summary.passed}/${results.summary.total}`);
});
```

**Expected**: All tests pass (or note which ones need attention)

### 5. Visual Integration

Create a test scenario:
1. Spawn 2-3 nodes
2. Create links between them
3. Observe link aura appearance
4. Compare with node aura motion

**Visual Expectations**:
- Link aura exists (see-through halo around link)
- Motion is smooth and synchronized with node aura
- Color is neutral gray-white (not saturated)
- Fades in/out smoothly on link creation/deletion

### 6. Performance Baseline

```javascript
// Measure before and after
console.time('linkRendererUpdate');
// ... trigger link renderer update
console.timeEnd('linkRendererUpdate');
```

**Expected**: No measurable regression (< 1% overhead)

---

## Post-Deployment Verification

### Immediate Tests (Next 30 minutes)

1. **Create a single link**
   - Aura should be visible
   - Motion should be smooth
   - No console errors

2. **Modify harmony/corruption**
   - Aura color should shift smoothly
   - Deformation should change appropriately
   - No visual artifacts

3. **Delete link**
   - Aura should fade out
   - Clean removal (no orphaned meshes)
   - No memory leaks

### Extended Tests (Next 24 hours)

1. **Stress test**: 100+ links in scene
   - FPS should remain stable
   - No visual glitches
   - Shader materials properly managed

2. **Corruption cascade**
   - Create link between corrupted nodes
   - Verify desaturation propagates
   - Check particle emission (if enabled)

3. **Node state changes**
   - Toggle harmony on/off
   - Verify link aura responds immediately
   - Check synchronization across multiple links

### Regression Tests

Run these tests to ensure no regressions:

```javascript
// Test 1: Link visual contract
const link = window.ATOMA.nodeLinks[0];
console.assert(
  link.group?.userData?.conduitState?.skinMesh?.material?.uniforms,
  'Link should have shader material with uniforms'
);

// Test 2: Strands still render correctly
console.assert(
  link.group.userData.conduitState.strands.length > 0,
  'Link strands should be present'
);

// Test 3: Subsystems functional
console.assert(
  link.group.userData.conduitState.pulseRing || 
  link.group.userData.conduitState.beads,
  'Link subsystems should exist'
);

// Test 4: No duplicate materials
const materialCount = new Set(
  link.group.children.map(c => c.material?.uuid)
).size;
console.log(`Unique materials in link: ${materialCount}`);
```

---

## Rollback Plan

If issues occur, rollback is simple (backward compatible):

### Immediate Rollback

```bash
# Revert LinkRendererConduit.js to previous version
git checkout HEAD -- LinkRendererConduit.js

# Keep LinkAuraShader.js (won't be used if not imported)
# Or delete it:
rm shaders/LinkAuraShader.js
```

The system will fall back to simple glow skin rendering automatically.

### Data Integrity

✅ **No data lost** - All changes are visual/rendering only
✅ **No state changes** - Node/link logic untouched
✅ **No breaking changes** - Existing API compatible

---

## Known Limitations & Workarounds

### Limitation 1: Custom Link Harmony/Corruption
If links don't have `harmonyLevel` or `corruptionLevel` properties:

**Workaround**:
```javascript
// In your link creation code:
link.harmonyLevel = link.source.personality?.harmony ?? 0.5;
link.corruptionLevel = link.source.corruption ?? 0.0;
```

### Limitation 2: Birth/Removal Flags Not Set
If `justLinked` / `justUnlinked` flags aren't being set:

**Workaround**:
```javascript
// Set these flags when link is created/deleted
link.justLinked = true;
// Let it persist for one frame, then clear
// (decay logic handles automatic clearing)
```

### Limitation 3: Link Direction Not Available
If `linkDir` (from source to target) isn't calculated:

**Already Handled**: LinkRendererConduit calculates this automatically
```javascript
const linkDir = new THREE.Vector3().subVectors(targetPos, sourcePos);
```

---

## Monitoring & Metrics

### Key Metrics to Track

| Metric | Baseline | Target | Warning |
|--------|----------|--------|---------|
| FPS (100 links) | 60 | 60+ | < 50 |
| Shader time | < 1ms | < 1ms | > 2ms |
| Memory (active) | 50MB | 55MB | > 80MB |
| Material count | N+1 | N+1 | > N+5 |

### Console Logging

Enable debug logging:
```javascript
// In LinkRendererConduit.js or wrapper:
const DEBUG_AURA = true;  // Set to false for production

if (DEBUG_AURA && frame % 60 === 0) {
  console.log('Link aura update:', {
    linkCount: links.length,
    activeLinks: links.filter(l => l.group?.userData?.conduitState?.skinMesh).length,
    avgUpdateTime: totalTime / links.length + 'ms'
  });
}
```

### Error Monitoring

Watch for these errors (none should occur):

```javascript
// Shader compilation errors
console.error('THREE.WebGLProgram');

// Material disposal issues
console.error('Trying to set property');

// Null reference errors
console.error('Cannot read property');
```

---

## Support & Troubleshooting

### Q: Link aura isn't visible
**A**: Check that:
1. Link has `group.userData.conduitState.skinMesh`
2. Shader material has valid uniforms
3. Link aura opacity isn't 0 (check `uOpacity`)
4. Link geometry isn't empty

### Q: Link aura flickers
**A**: Likely cause:
1. `uTime` not being updated (check update loop)
2. Material uniforms being reset improperly
3. Geometry recreation too frequent

### Q: Performance degradation
**A**: Check:
1. Shader compilation time (one-time cost)
2. Uniform update frequency (should be per-frame)
3. Geometry recreation (happening per-frame as before)

### Q: Link aura doesn't match node aura
**A**: Verify:
1. Both using same `uTime` value
2. `uHarmony` and `uCorruption` synced
3. `uLinkDirection` normalized correctly
4. Color uniforms match (should be identical)

---

## Documentation Updates

After deployment, update:

- [ ] Project README (add visual alignment note)
- [ ] Developer guide (link aura architecture)
- [ ] Changelog (version 1.0 of link aura shader)
- [ ] Architecture diagram (update rendering pipeline)

---

## Success Criteria

✅ **Deployment is successful when:**

1. All tests pass without errors
2. No visual regressions detected
3. Performance remains stable
4. Link aura looks like natural extension of node aura
5. No console warnings or errors related to aura rendering
6. Team feedback is positive

✅ **Visual Quality:**
- Link aura motion matches node aura rhythm
- Color is unified across node → link → node
- Harmony/corruption state clearly visible
- Birth/removal animations smooth and coordinated

---

## Maintenance

### Weekly
- [ ] Monitor console for errors
- [ ] Check performance metrics
- [ ] Verify visual appearance matches spec

### Monthly
- [ ] Review shader optimization opportunities
- [ ] Collect user feedback on visual quality
- [ ] Profile with profiler tools

### Quarterly
- [ ] Consider shader improvements
- [ ] Evaluate future enhancements
- [ ] Update documentation

---

## Sign-Off

**Implementation Status**: ✅ Complete
**Quality Assurance**: ✅ Ready
**Deployment Ready**: ✅ Yes

Prepared for production deployment.

