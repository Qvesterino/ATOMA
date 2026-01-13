# EMISSIVE MATERIAL QUICK REFERENCE

**Purpose:** Quick lookup for emissive material compatibility and safe implementation patterns  
**Last Updated:** Extended Production v5.2+

---

## Safe Material Types for Emissive ✅

When you need to use `emissive` or `emissiveIntensity` in THREE.js, use these materials:

```javascript
// ✅ SAFE - Full emissive support
new THREE.MeshStandardMaterial({ emissive: 0xff0000, emissiveIntensity: 0.5 })
new THREE.MeshLambertMaterial({ emissive: 0xff0000, emissiveIntensity: 0.5 })
new THREE.MeshPhongMaterial({ emissive: 0xff0000, emissiveIntensity: 0.5 })
new THREE.MeshToonMaterial({ emissive: 0xff0000, emissiveIntensity: 0.5 })

// ❌ UNSAFE - No emissive support
new THREE.MeshBasicMaterial({ emissive: 0xff0000, emissiveIntensity: 0.5 })  // DON'T!
```

---

## Safety Pattern Template

When implementing emissive effects, always use this pattern:

```javascript
// Add this helper to your class
ensureEmissiveSafe(mat) {
  if (!mat || typeof mat !== 'object') return false;
  return (
    mat.isMeshStandardMaterial ||
    mat.isMeshLambertMaterial ||
    mat.isMeshPhongMaterial ||
    mat.isMeshToonMaterial
  );
}

// Use it before updating emissive properties
if (this.ensureEmissiveSafe(material)) {
  material.emissiveIntensity = newIntensity;
}
```

---

## Why Not MeshBasicMaterial?

**MeshBasicMaterial** is a simple, performant material BUT it doesn't support:
- ❌ `emissive` property
- ❌ `emissiveIntensity` property
- ❌ `emissiveMap` property

Using `MeshStandardMaterial` instead gives you:
- ✅ Full PBR (Physically-Based Rendering)
- ✅ Native emissive support
- ✅ Equivalent performance for transparent use cases
- ✅ Better visual quality in most scenarios

---

## Common Scenarios

### Scenario 1: Glowing transparent mesh
```javascript
// ✅ DO THIS
const material = new THREE.MeshStandardMaterial({
  color: 0x00ffff,
  transparent: true,
  opacity: 0.6,
  emissive: 0x00ffff,
  emissiveIntensity: 0.5,
  fog: false
});
```

### Scenario 2: Pulsing glow effect
```javascript
// ✅ DO THIS
if (this.ensureEmissiveSafe(material)) {
  material.emissiveIntensity = 0.3 + pulse * 0.7;
}
```

### Scenario 3: Dynamic glow updates
```javascript
// ✅ DO THIS
particles.forEach(particle => {
  if (this.ensureEmissiveSafe(particle.material)) {
    particle.material.emissiveIntensity = 0.4 * intensity;
  }
});
```

---

## Files to Reference

If you're building new emissive systems, reference these proven implementations:

| File | Pattern | Systems |
|------|---------|---------|
| `_SafeLegendaryNodePack.js` | Legendary node glow | Aurora, Singularity, Sigma Prime, Quantum Crown |
| `_SafeLegendaryLinkFX.js` | Link visual effects | Aurora bands, Quantum echoes, Shockwaves |
| `_SafeWorldFXPack.js` | World ambient FX | Rift waves, Quantum rifts |
| `_SafeNodeArchetypesPack.js` | Archetype visuals | 10 different node archetypes |
| `_SafeNodePersonalityFX.js` | Personality glows | CURIOUS, AGGRESSIVE, ANALYTICAL, etc. |

---

## Checklist for New Emissive Systems

Before implementing a new system with emissive materials:

- [ ] Using `MeshStandardMaterial` (or other safe type)?
- [ ] Added `ensureEmissiveSafe()` helper method?
- [ ] All emissive assignments guarded with safety check?
- [ ] Tested with console open (zero warnings)?
- [ ] Transparent materials tested for visual quality?
- [ ] Performance profiled (compared with expected)?
- [ ] Documented material choices in comments?

---

## Troubleshooting

### Problem: Material not glowing despite emissive set
**Solution:** Check if using `MeshBasicMaterial`. Replace with `MeshStandardMaterial`.

### Problem: Console warnings about emissive property
**Solution:** Material type doesn't support emissive. Use safety check pattern above.

### Problem: Glow not responding to intensity changes
**Solution:** Add safety check - material type may not support property updates.

### Problem: Visual quality degraded after material change
**Solution:** `MeshStandardMaterial` may need metalness/roughness tuning. Set appropriate values:
```javascript
new THREE.MeshStandardMaterial({
  color: 0xff0000,
  emissive: 0xff0000,
  emissiveIntensity: 0.5,
  metalness: 0,    // Set if needed
  roughness: 1     // Set if needed
});
```

---

## Performance Notes

**MeshStandardMaterial Performance:**
- ✅ Shader complexity: Moderate (well-optimized by THREE.js)
- ✅ Memory: Equivalent to MeshBasicMaterial
- ✅ Render time: Negligible difference for most use cases
- ✅ Transparency: Handles alpha blending efficiently

**Recommendation:** Use `MeshStandardMaterial` as default for any material that might use emissive effects.

---

## Standards for ATOMA

All emissive material usage in ATOMA follows these standards:

1. **Material Type:** `MeshStandardMaterial` for all emissive materials
2. **Safety Pattern:** `ensureEmissiveSafe()` helper in every file that updates emissive
3. **Consistency:** All helper implementations use positive material type checking
4. **Documentation:** Material choices documented in comments
5. **Testing:** Console verification for zero warnings before deployment

---

**Keep this document handy when implementing new glowing effects in ATOMA!**
