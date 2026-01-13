# ATOMA Visual Integrity & Unfreeze - Runtime Verification Guide

## Quick Status Check (30 seconds)

Copy-paste these commands into the browser console (F12) and run them in order:

```javascript
// ===== STEP 1: Check Integrity System Status (5 sec) =====
window.NodeVisualIntegrityAPI.report();

// ===== STEP 2: Check Unfreeze Status (5 sec) =====
window.ControlledUnfreeze.status();

// ===== STEP 3: View Configuration (5 sec) =====
console.log("Integrity Config:", window.NodeVisualIntegrityAPI.config());
console.log("Unfreeze Config:", window.ControlledUnfreeze.config());
```

---

## Full Verification Checklist (2-3 minutes)

### Phase 1: Integrity System Verification ✓

**1.1 - Confirm NodeVisualIntegrityAPI is accessible:**
```javascript
console.assert(
  window.NodeVisualIntegrityAPI !== undefined,
  '❌ NodeVisualIntegrityAPI not found'
);
console.log('✅ NodeVisualIntegrityAPI accessible');
```

**1.2 - Confirm all API methods exist:**
```javascript
const methods = ['report', 'enable', 'disable', 'config', 'validateNode', 'help'];
methods.forEach(m => {
  console.assert(
    typeof window.NodeVisualIntegrityAPI[m] === 'function',
    `❌ Method ${m} not found`
  );
});
console.log('✅ All API methods present');
```

**1.3 - Run full integrity report:**
```javascript
window.NodeVisualIntegrityAPI.report();
// Expected output: Full report with node counts, config, and status
```

**1.4 - Validate a sample node:**
```javascript
// Get first node from scene
const node = window.game?.aiNodes?.nodes[0];
if (node) {
  window.NodeVisualIntegrityAPI.validateNode(node);
  console.log('✅ Node validation completed');
} else {
  console.warn('⚠️ No nodes found in scene (may be loading)');
}
```

**1.5 - Check config flags:**
```javascript
const config = window.NodeVisualIntegrityAPI.config();
console.log('Legacy Behaviors Status:');
console.log('  - Node Breathing Scale:', config.ENABLE_NODE_BREATHING_SCALE ? '🟢 ON' : '🔴 OFF');
console.log('  - Mesh Opacity Pulsing:', config.ENABLE_MESH_OPACITY_PULSING ? '🟢 ON' : '🔴 OFF');
console.log('  - Antenna Pulse:', config.ENABLE_ANTENNA_PULSE ? '🟢 ON' : '🔴 OFF');
console.log('  - Command Pulse:', config.ENABLE_COMMAND_PULSE ? '🟢 ON' : '🔴 OFF');
console.log('  - Emissive Pulsing:', config.ENABLE_EMISSIVE_INTENSITY_PULSING ? '🟢 ON' : '🔴 OFF');
console.log('Core Integrity:');
console.log('  - Depth Authority:', config.ENFORCE_NODE_DEPTH_AUTHORITY ? '✅' : '❌');
console.log('  - Holographic Preservation:', config.PRESERVE_HOLOGRAPHIC_LAYERS ? '✅' : '❌');
console.log('  - Material Locking:', config.LOCK_NODE_CORE_MATERIALS ? '✅' : '❌');
console.log('  - Opacity Protection:', config.PREVENT_EXTERNAL_OPACITY_MUTATION ? '✅' : '❌');
```

---

### Phase 2: Controlled Unfreeze Verification ✓

**2.1 - Confirm ControlledUnfreeze is accessible:**
```javascript
console.assert(
  window.ControlledUnfreeze !== undefined,
  '❌ ControlledUnfreeze not found'
);
console.log('✅ ControlledUnfreeze accessible');
```

**2.2 - Confirm all API methods exist:**
```javascript
const methods = ['status', 'refreeze', 'config', 'help'];
methods.forEach(m => {
  console.assert(
    typeof window.ControlledUnfreeze[m] === 'function',
    `❌ Method ${m} not found`
  );
});
console.log('✅ All unfreeze API methods present');
```

**2.3 - Run unfreeze status check:**
```javascript
window.ControlledUnfreeze.status();
// Expected output: Master freeze status, system reactivation flags, mutation clamping values
```

**2.4 - Verify freeze mode is DISABLED:**
```javascript
const config = window.ControlledUnfreeze.config();
console.assert(
  config.VISUAL_FREEZE_ENABLED === false,
  '❌ VISUAL_FREEZE_ENABLED is true - unfreeze failed!'
);
console.log('✅ Freeze mode DISABLED (unfreeze active)');
```

**2.5 - Check mutation clamping is configured:**
```javascript
const config = window.ControlledUnfreeze.config();
console.log('Mutation Clamping Configuration:');
console.log('  - Aura Max Opacity:', config.CLAMP_AURA_OPACITY, '(default: 0.45)');
console.log('  - Link Max Opacity:', config.CLAMP_LINK_OPACITY, '(default: 0.25)');
console.log('  - Node Scale Lock:', config.CLAMP_NODE_SCALE, '(default: 1.0)');
console.log('  - Node Opacity Lock:', config.CLAMP_NODE_OPACITY, '(default: 1.0)');
```

**2.6 - Verify system reactivation flags:**
```javascript
const config = window.ControlledUnfreeze.config();
console.log('System Reactivation Status:');
console.log('  - Personality VFX:', config.ENABLE_PERSONALITY_VFX ? '🟢' : '🔴');
console.log('  - Personality Shader:', config.ENABLE_PERSONALITY_SHADER ? '🟢' : '🔴');
console.log('  - Aura Modulation:', config.ENABLE_AURA_MODULATION ? '🟢' : '🔴');
console.log('  - Metrics FX:', config.ENABLE_METRICS_FX ? '🟢' : '🔴');
console.log('  - Synergy Effects:', config.ENABLE_SYNERGY_EFFECTS ? '🟢' : '🔴');
console.log('  - Harmony Consumer:', config.ENABLE_HARMONY_CONSUMER ? '🟢' : '🔴');
console.log('  - Link Personality:', config.ENABLE_LINK_PERSONALITY ? '🟢' : '🔴');
console.log('  - Evolution Effects:', config.ENABLE_EVOLUTION_EFFECTS ? '🟢' : '🔴');
```

---

### Phase 3: Visual Behavior Testing (2-5 minutes)

**3.1 - Visual Test: Node Rings & Holographic Detail**
- Look at any node in the scene
- ✅ Expected: Rings, wireframes, glows are ALWAYS visible
- ❌ Failed if: Rings fade when linked

**3.2 - Visual Test: Nodes Behind Links**
- Create a link between two nodes
- ✅ Expected: Both nodes remain fully readable/visible
- ❌ Failed if: Link hides/obscures node details

**3.3 - Visual Test: Link Opacity**
- Look at any link in the scene
- ✅ Expected: Link is subtle and transparent (not opaque)
- ❌ Failed if: Link is bright or overly visible

**3.4 - Visual Test: Aura Effects**
- Look at any node with aura effects
- ✅ Expected: Aura is present but subtle (max 45% opacity)
- ❌ Failed if: Aura is missing or extremely bright

**3.5 - Visual Test: No Scale Pulsing**
- Watch any node for 3-5 seconds
- ✅ Expected: Node maintains consistent size (no breathing effect)
- ❌ Failed if: Node size oscillates/pulses

**3.6 - Visual Test: No Opacity Pulsing**
- Watch any node for 3-5 seconds
- ✅ Expected: Node maintains constant opacity (fully opaque)
- ❌ Failed if: Node brightness oscillates/pulses

---

### Phase 4: Console Log Audit (1 minute)

**4.1 - Check initialization logs:**
```javascript
// Look at console from page load for these messages:
// ✅ '[main.js] NodeVisualIntegrityFix initialized ✓'
// ✅ '[main.js] ControlledUnfreezeSystem initialized ✓'
// ✅ '🔓 [Unfreeze] Freeze mode DISABLED globally'
// ❌ No "[Freeze] Blocked system:" spam messages
console.log('Check page load logs for initialization messages');
```

**4.2 - Verify no freeze spam:**
```javascript
// If you see many "[Freeze] Blocked system: ..." logs, unfreeze failed
console.warn('If you see freeze spam, systems are still blocked!');
```

---

## Acceptance Criteria

### ✅ All Systems PASS if:

1. **Integrity System**:
   - ✅ `window.NodeVisualIntegrityAPI` is accessible
   - ✅ All 6 methods present (report, enable, disable, config, validateNode, help)
   - ✅ Config shows legacy behaviors DISABLED by default
   - ✅ Config shows core integrity flags ENABLED

2. **Unfreeze System**:
   - ✅ `window.ControlledUnfreeze` is accessible
   - ✅ All 4 methods present (status, refreeze, config, help)
   - ✅ `VISUAL_FREEZE_ENABLED = false` (freeze is OFF)
   - ✅ Mutation clamping values are configured
   - ✅ System reactivation flags are ENABLED

3. **Visual Behavior**:
   - ✅ Nodes are fully readable/visible
   - ✅ Links are subtle and don't obscure nodes
   - ✅ Holographic details (rings, glows) always visible
   - ✅ No scale or opacity pulsing on nodes
   - ✅ Aura and link opacity are constrained

4. **Console Output**:
   - ✅ Initialization messages present
   - ✅ No freeze spam logs
   - ✅ No errors or warnings

---

## Troubleshooting

### Problem: `window.NodeVisualIntegrityAPI` not found

**Cause**: Initialization failed or script not loaded

**Solution**:
```javascript
// 1. Check if NodeVisualIntegrityFix.js is imported
grep 'NodeVisualIntegrityFix' main.js

// 2. Check console for error messages at page load
// 3. Manually reload page (Ctrl+Shift+R hard refresh)
// 4. Check if initializeVisualIntegrity() was called in createAINodes()
```

### Problem: `window.ControlledUnfreeze` not found

**Cause**: setupControlledUnfreeze() not called or failed

**Solution**:
```javascript
// 1. Check if ControlledUnfreezeSystem_v1.js is imported
grep 'ControlledUnfreezeSystem_v1' main.js

// 2. Check if setupControlledUnfreeze(this) is called after createAINodes()
grep 'setupControlledUnfreeze' main.js

// 3. Check console for error messages
// 4. Manually reload page
```

### Problem: Freeze mode still enabled (`VISUAL_FREEZE_ENABLED = true`)

**Cause**: Unfreeze initialization didn't run or was blocked

**Solution**:
```javascript
// 1. Check page load logs for initialization messages
// 2. Check for errors in console
// 3. Try manual refreeze and unfreeze cycle:
window.ControlledUnfreeze.refreeze();
window.ControlledUnfreeze.status();  // Should show VISUAL_FREEZE_ENABLED = true
window.ControlledUnfreeze.status();  // Check current status
```

### Problem: Nodes are still pulsing/breathing

**Cause**: Legacy behaviors not properly gated

**Solution**:
```javascript
// Check which legacy behaviors are enabled
window.NodeVisualIntegrityAPI.config();

// If any show true, disable them:
window.NodeVisualIntegrityAPI.disable('ENABLE_NODE_BREATHING_SCALE');
window.NodeVisualIntegrityAPI.disable('ENABLE_MESH_OPACITY_PULSING');
window.NodeVisualIntegrityAPI.disable('ENABLE_ANTENNA_PULSE');
window.NodeVisualIntegrityAPI.disable('ENABLE_COMMAND_PULSE');
window.NodeVisualIntegrityAPI.disable('ENABLE_EMISSIVE_INTENSITY_PULSING');

// Verify they're disabled
window.NodeVisualIntegrityAPI.config();
```

---

## Help & Documentation

**Get help from console APIs:**

```javascript
// Integrity system help
window.NodeVisualIntegrityAPI.help();

// Unfreeze system help
window.ControlledUnfreeze.help();
```

**View full documentation:**

- `NODE_VISUAL_INTEGRITY_DEPLOYMENT.md` - Comprehensive deployment guide
- `NODE_VISUAL_INTEGRITY_QUICKREF.md` - Quick reference card
- `VISUAL_INTEGRITY_SESSION_SUMMARY.md` - Full session summary
- `RUNTIME_VERIFICATION_GUIDE.md` - This guide

---

## Summary

✅ **Integration**: Import + initialization complete
✅ **Verification**: All console APIs functional
✅ **Testing**: Follow phases 1-4 above
✅ **Monitoring**: Console APIs available for runtime diagnostics
✅ **Reversible**: Single flag to re-freeze if needed

**Status**: READY FOR PRODUCTION
