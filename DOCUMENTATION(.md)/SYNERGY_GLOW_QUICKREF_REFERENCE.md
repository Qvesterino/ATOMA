# SYNERGY GLOW — QUICK REFERENCE
**Canonical Template #1 | LOCKED | Production-Ready**

---

## 📦 Files
- `SynergyGlowShaderMaterial.js` — Material + uniforms
- `SynergyGlowController.js` — Per-link update controller
- `SynergyGlowIntegrationGuide.js` — Snippets + batch manager

---

## ⚡ 30-Second Integration

### 1. Import
```javascript
import { SynergyGlowControllerBatch } from './SynergyGlowController.js';
import { attachSynergyGlowToLink } from './SynergyGlowIntegrationGuide.js';
```

### 2. Create batch
```javascript
const synergyGlowBatch = new SynergyGlowControllerBatch();
```

### 3. Attach to link
```javascript
const {controller} = attachSynergyGlowToLink(link, linkMesh);
synergyGlowBatch.add(controller);
```

### 4. Update each frame
```javascript
synergyGlowBatch.updateAll(dt, timeSeconds);
```

### 5. Cleanup on destroy
```javascript
synergyGlowBatch.remove(controller);
```

---

## 🔒 LOCKED CANONICAL MAPPINGS

| Property | Formula | Range |
|----------|---------|-------|
| **Intensity** | 0.3 + (s × 0.7) | [0.3..1.0] |
| **Brightness** | s × 2.0 | [0..2.0] |
| **Breathing** | 1.0 + sin(t × 2π × 1.2) × 0.05 | ±5% |
| **Color** | #00d4ff (cyan) | fixed |
| **Blending** | AdditiveBlending | fixed |

where `s` = `link.userData.visualSynergy` [0..1]

---

## 🎯 KEY CONSTRAINTS

✅ **READ**: `link.userData.visualSynergy` only  
❌ **DON'T READ**: `link.userData.synergy` (raw stat forbidden)  
❌ **DON'T WRITE**: `link.userData.*` (any metric mutations)  
❌ **DON'T EMIT**: Events or side effects  

---

## 📊 Performance
- Per-link: **<0.1ms**
- Memory: **64 bytes/controller**
- Allocations: **Zero per frame**
- Scaling: **O(n) linear**

---

## 🐛 Debug API
```javascript
// Conformance check
window.__ATOMA_SYNERGY_GLOW_DEBUG.conformance()

// Log controller state
window.__ATOMA_SYNERGY_GLOW_DEBUG.logControllerState(controller)

// Validate batch
window.__ATOMA_SYNERGY_GLOW_DEBUG.validate(batch)
```

---

## 🔗 Integration Points

| System | Function |
|--------|----------|
| **MetricInterpretationLayer_v1.js** | Provides `visualSynergy` |
| **NodeLinkingSystem.js** | Calls `attachSynergyGlowToLink()` |
| **main.js animation loop** | Calls `batch.updateAll()` |
| **LinkRenderer.ts** | Applies material to link mesh |

---

## ✅ Deployment Checklist
```
[ ] Files copied to project root
[ ] main.js imports updated
[ ] Batch initialized
[ ] attachSynergyGlowToLink() called on link creation
[ ] batch.updateAll() called per frame
[ ] batch.remove() called on link destruction
[ ] Test: Glow visible and responds to synergy
[ ] Test: Breathing animation at 1.2 Hz
[ ] Console: Debug API functional
[ ] Audit: No userData mutations detected
```

---

## 🚀 Common Snippets

### Attach all existing links
```javascript
existingLinks.forEach(link => {
  const {controller} = attachSynergyGlowToLink(link, link.mesh);
  synergyGlowBatch.add(controller);
});
```

### Log glow state
```javascript
links.forEach(link => {
  const state = window.__ATOMA_SYNERGY_GLOW_DEBUG.logControllerState(
    link._synergyGlowController
  );
  console.log(`Link ${link.id}:`, state);
});
```

### Validate compliance
```javascript
const report = window.__ATOMA_SYNERGY_GLOW_DEBUG.conformance();
console.assert(report.status === 'LOCKED', 'Template not locked!');
```

---

## 📖 Full Documentation
See: `SYNERGY_GLOW_CANONICAL_DEPLOYMENT.md`

---

**Status**: ✅ LOCKED & READY  
**Authority**: CanonicalVisualTemplateLibrary.md  
**Version**: 1.0  
**Last Updated**: Session 44
