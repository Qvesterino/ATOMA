# Session 99 Quick Start — Developer Guide

## TL;DR

✅ **Node auras (large discs) are now disabled by default**  
✅ **Node spawn validation system created (ready to integrate)**  
✅ **Both changes are reversible via config flags**

---

## Current State (Right Now)

### What's Different?

1. **No large translucent spheres** around nodes
2. **Node cores always readable** without obscuration
3. **Spawn validation gate available** for integration
4. **All changes controlled by config flags**

### What's the Same?

- Links render normally
- Selection outlines work
- Glyphs display on nodes
- Particles flow along links
- World environment unchanged
- All gameplay unaffected

---

## Enabling/Disabling Features

### Node Auras

**In config.js**:
```javascript
features: {
  ENABLE_NODE_AURAS: false,  // ← false = disabled (current)
                             //   true = enabled
}
```

**At runtime** (console):
```javascript
CONFIG.features.ENABLE_NODE_AURAS = true;  // Re-enable auras
```

### Node Spawn Validation

**In config.js**:
```javascript
features: {
  ENFORCE_NODE_MODEL_SOURCE: true,  // ← true = enforced (current)
                                    //   false = permissive
}
```

**At runtime** (console):
```javascript
nodeSpawnGate.setEnforced(false);  // Switch to permissive mode
```

---

## For QA Testers

### Verify Auras Are Disabled

1. Launch game
2. Look at nodes
3. **Expected**: Clean nodes without large discs
4. Check console:
   ```
   [NodeAuraSystem_v1] ⊘ Node auras disabled...
   ```

### Test Spawn Validation (When Integrated)

```javascript
// In console, after integration:
nodeSpawnGate.getStats();
// Shows validation statistics

// Try spawning invalid node type
// Should be rejected with warning
```

---

## For Feature Developers

### Re-enable Auras

```javascript
// In config.js
ENABLE_NODE_AURAS: true
```

Restart app. Auras render.

### Integrate Spawn Validation

**Step 1**: Import gate
```javascript
import { NodeSpawnValidationGate_v1 } from './NodeSpawnValidationGate_v1.js';
```

**Step 2**: Initialize
```javascript
const gate = new NodeSpawnValidationGate_v1(enhancedNodeModel);
window.nodeSpawnGate = gate;  // Expose for debugging
```

**Step 3**: Use before spawning
```javascript
if (!gate.canSpawnNode(nodeType)) {
  console.warn(`Spawn rejected: ${nodeType}`);
  return;
}
// ... create node ...
```

**Step 4**: Test
```javascript
gate.getStats();  // Check validation stats
gate.setDebug(true);  // Enable logging
```

---

## Console API Reference

### Aura Flag

```javascript
// Check status
CONFIG.features.ENABLE_NODE_AURAS
// Output: false or true

// Toggle
CONFIG.features.ENABLE_NODE_AURAS = !CONFIG.features.ENABLE_NODE_AURAS;
```

### Spawn Gate

```javascript
// Check status
nodeSpawnGate.getStats()
// Output: { validSpawns, rejectedSpawns, enforced, etc. }

// Get valid types
nodeSpawnGate.getValidNodeTypes()
// Output: ["input", "process", "storage", ...]

// Toggle enforcement
nodeSpawnGate.setEnforced(false);  // Permissive
nodeSpawnGate.setEnforced(true);   // Enforced

// Enable debug
nodeSpawnGate.setDebug(true);
// Now all spawn attempts are logged
```

---

## File Changes at a Glance

| File | What Changed | Why |
|------|--------------|-----|
| config.js | Added feature flags | Central control |
| NodeAuraSystem_v1.js | Early exit if ENABLE_NODE_AURAS=false | Disable auras |
| HarmonyAuraController.js | Early exit if ENABLE_NODE_AURAS=false | Disable harmony aura |
| MythicAuraIntegration_v1.js | Early exit if ENABLE_NODE_AURAS=false | Disable mythic enhancements |
| NodeSpawnValidationGate_v1.js | NEW FILE (231 lines) | Validation system |

**No files deleted. No major refactors. All reversible.**

---

## Common Questions

**Q: Why disable auras?**  
A: Large discs obscure node cores. Disabling ensures visual clarity.

**Q: Can I re-enable them?**  
A: Yes, change ONE flag in config.js to `true`.

**Q: Will this break anything?**  
A: No. Auras are pure visuals. Gameplay unchanged.

**Q: What's the spawn validation for?**  
A: Ensures ONLY nodes in enhancedNodeModel can exist. Safety measure.

**Q: How do I integrate spawn validation?**  
A: See integration guide (2-3 lines of code per spawn point).

**Q: Is this permanent?**  
A: No, purely a stabilization measure. Can be reverted anytime.

---

## Troubleshooting

### Auras still appearing?

```javascript
// Check flag
CONFIG.features.ENABLE_NODE_AURAS
// Should be false

// Force refresh
location.reload();
```

### Spawn gate not working?

```javascript
// Check if initialized
window.nodeSpawnGate
// Should exist

// Check stats
window.nodeSpawnGate.getStats()
// Check validations count
```

### Performance issues?

- Aura disabling should help performance (not hurt it)
- Spawn validation is negligible overhead
- Check console for errors

---

## Before/After Comparison

### Visual (Aura Disabling)

**BEFORE** (with auras):
- Nodes surrounded by large semi-transparent spheres
- Cores partially obscured
- Visual "noise" around each node

**AFTER** (auras disabled):
- Clean nodes with visible cores
- Shells and geometry readable
- Minimal visual clutter

### Gameplay

**BEFORE & AFTER**: Identical
- Links work the same
- Selection unchanged
- Interactions work
- Metrics unchanged

---

## Integration Checklist

- [ ] Read this guide
- [ ] Check config.js flags
- [ ] Verify no aura discs appear
- [ ] (Optional) Integrate spawn validation gate
- [ ] Test with flags both true/false
- [ ] Document any findings
- [ ] Run soak tests

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `config.js` | Feature flags (ENABLE_NODE_AURAS, ENFORCE_NODE_MODEL_SOURCE) |
| `NodeSpawnValidationGate_v1.js` | Spawn validation system |
| `SESSION_99_STABILIZATION_INTEGRATION_GUIDE.md` | Detailed integration manual |
| `_AUDIT_SESSION_99_QUICK_REFERENCE.md` | Audit quick reference |

---

## Quick Links

**Audit Documents**:
- Full audit: `_AUDIT_COMPREHENSIVE_NON_NODE_VISUAL_OVERLAYS_SESSION_99.md`
- Quick ref: `_AUDIT_SESSION_99_QUICK_REFERENCE.md`

**Integration Guides**:
- Main guide: `SESSION_99_STABILIZATION_INTEGRATION_GUIDE.md`
- Completion: `SESSION_99_TASKS_1_2_COMPLETION_SUMMARY.md`

**This Document**:
- Quick start: `SESSION_99_QUICK_START_DEVELOPER_GUIDE.md` (you are here)

---

## One-Liners for Developers

```javascript
// Check aura flag
CONFIG.features.ENABLE_NODE_AURAS  // false = disabled

// Check spawn gate
window.nodeSpawnGate?.getStats()

// Re-enable auras
CONFIG.features.ENABLE_NODE_AURAS = true;

// Enable spawn debug
window.nodeSpawnGate?.setDebug(true);

// Get valid node types
window.nodeSpawnGate?.getValidNodeTypes()
```

---

## Status Dashboard

| System | Status | Flag |
|--------|--------|------|
| Node Auras | 🟢 Disabled | ENABLE_NODE_AURAS = `false` |
| Spawn Validation | 🟢 Ready | ENFORCE_NODE_MODEL_SOURCE = `true` |
| Visual Clarity | 🟢 Improved | No discs visible |
| Backward Compat | 🟢 Yes | Reversible |

---

## Next Steps

1. **Verify** — Check that auras are gone, nodes look clean
2. **Integrate** — Add spawn validation gate to main spawn paths (if using)
3. **Test** — Run soak tests with both flags
4. **Document** — Note any observations
5. **Feedback** — Report findings to team

---

**Session**: 99  
**Status**: 🟢 COMPLETE & READY  
**Time to Read This**: ~5 minutes  
**Time to Integrate**: ~15 minutes (per spawn point)
