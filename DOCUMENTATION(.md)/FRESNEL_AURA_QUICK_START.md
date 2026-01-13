# Fresnel Aura Shader — Quick Start Guide

## 60-Second Setup

```javascript
// In main.js (early initialization):
import { patchAINodesToUseFresnelAuras } from './FresnelAuraIntegrationPatch.js';

patchAINodesToUseFresnelAuras(AINodes, {
  enabled: true,
  variant: 'basic',
  rimPower: 2.0,
});
```

**That's it!** Nodes now render with physics-based fresnel rim-lighting.

---

## What It Does

Creates organic, camera-aware edge glow on node auras using Fresnel effect:

- **Head-on view**: Aura mostly invisible (natural falloff)
- **Grazing angle**: Aura edge brightens dramatically (silhouette effect)
- **Breathing**: Gentle pulse animation for life-like appearance
- **Responsive**: Automatically adjusts as you move camera

---

## Configuration Cheat Sheet

### Quick Presets

```javascript
// Subtle glow
patchAINodesToUseFresnelAuras(AINodes, {
  enabled: true,
  variant: 'basic',
  rimPower: 1.5,
  rimScale: 0.8,
});

// Default (recommended)
patchAINodesToUseFresnelAuras(AINodes, {
  enabled: true,
  variant: 'basic',
  rimPower: 2.0,
  rimScale: 1.5,
});

// Dramatic silhouette
patchAINodesToUseFresnelAuras(AINodes, {
  enabled: true,
  variant: 'basic',
  rimPower: 3.0,
  rimScale: 2.0,
  fresnelMin: 0.2,  // Darker center
});

// Distance-aware (for large networks)
patchAINodesToUseFresnelAuras(AINodes, {
  enabled: true,
  variant: 'distance',
  rimPower: 2.0,
  distanceFalloffStart: 15.0,  // Falloff begins at 15 units
  distanceFalloffEnd: 60.0,     // Fully faded at 60 units
});

// Complex layered
patchAINodesToUseFresnelAuras(AINodes, {
  enabled: true,
  variant: 'multiband',
  rimPower: 2.5,
});
```

---

## Parameter Guide

| Parameter | Range | Effect |
|-----------|-------|--------|
| `rimPower` | 1.5-3.5 | Edge sharpness (2.0 = organic) |
| `rimScale` | 0.5-2.5 | Overall brightness |
| `fresnelMin` | 0.1-0.5 | Prevent aura from disappearing |
| `fresnelMax` | 0.8-1.0 | Cap maximum intensity |
| `variant` | 'basic', 'distance', 'multiband' | Visual complexity |

---

## Render Loop Integration (Optional)

Only needed if you want aura to respond to node state changes:

```javascript
import { updateFresnelAuraUniforms } from './FresnelAuraIntegrationPatch.js';

function animate(time) {
  const seconds = time / 1000;
  
  // Update all node auras
  nodesArray.forEach(node => {
    const auraMesh = node.children.find(c => c.userData.isAura);
    if (auraMesh) {
      updateFresnelAuraUniforms(auraMesh, seconds, {
        auraStrength: node.harmonyAuraStrength || 0.5,
        auraOpacity: 0.3,
        auraRadius: 1.0,
        auraPulse: Math.sin(seconds * 1.5) * 0.2 + 1.0,
      });
    }
  });
  
  renderer.render(scene, camera);
}
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Too bright | Reduce `rimScale` (1.0-1.2) |
| Too dark | Increase `rimScale` (1.5-2.0) |
| Too sharp | Reduce `rimPower` (1.5-2.0) |
| Too soft | Increase `rimPower` (2.5-3.0) |
| Disappears at angles | Increase `fresnelMin` (0.4-0.5) |
| Distant nodes dark | Use `variant: 'distance'` |

---

## Files Included

- `FresnelRimLightAuraShader.js` — Shader implementations
- `FresnelAuraIntegrationPatch.js` — Integration + utilities
- `FRESNEL_AURA_SHADER_IMPLEMENTATION.md` — Full documentation
- `FRESNEL_AURA_QUICK_START.md` — This file

---

## Verification

```javascript
import { verifyFresnelAuraIntegration } from './FresnelAuraIntegrationPatch.js';

// Check if aura shader is valid
const report = verifyFresnelAuraIntegration(node.auraObject);
console.log(report.valid);  // true/false
```

---

## Performance Target

- **100 nodes**: <0.5ms GPU overhead
- **500 nodes**: <2ms GPU overhead
- **No CPU impact** (all GPU-resident)

---

## Next Steps

1. Copy both `.js` files to project root
2. Import in main.js
3. Call `patchAINodesToUseFresnelAuras()` once at init
4. (Optional) Add uniform updates to render loop
5. Test and tweak parameters

**That's all!** You now have production-ready fresnel-based auras.

---

## Need More Info?

See `FRESNEL_AURA_SHADER_IMPLEMENTATION.md` for:
- Physics background
- Advanced customization
- All shader uniforms
- Full troubleshooting guide
- Integration patterns

---

**Status**: Production-ready | **Performance**: GPU-optimized | **Integration**: Zero breaking changes
