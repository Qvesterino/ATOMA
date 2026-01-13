# ATOMA Console API Quick Reference

## 🚀 30-Second Status Check

```javascript
window.NodeVisualIntegrityAPI.report();
window.ControlledUnfreeze.status();
```

---

## 📊 NodeVisualIntegrityAPI

### Report (Full System Status)
```javascript
window.NodeVisualIntegrityAPI.report();
```
Shows: Node count, config status, legacy behavior flags, integrity status

### Config (View Settings)
```javascript
window.NodeVisualIntegrityAPI.config();
```
Returns: All config flags and their current values

### Validate Node (Check Specific Node)
```javascript
const node = window.game.aiNodes.nodes[0];
window.NodeVisualIntegrityAPI.validateNode(node);
```
Shows: Node material status, layer consistency, visual health

### Enable/Disable Legacy Behaviors
```javascript
// Enable (re-activate)
window.NodeVisualIntegrityAPI.enable('ENABLE_NODE_BREATHING_SCALE');

// Disable (deactivate)
window.NodeVisualIntegrityAPI.disable('ENABLE_NODE_BREATHING_SCALE');
```

**Available Behaviors**:
- `ENABLE_NODE_BREATHING_SCALE` - ±2% scale pulsing
- `ENABLE_MESH_OPACITY_PULSING` - Opacity breathing
- `ENABLE_ANTENNA_PULSE` - Antenna elongation
- `ENABLE_COMMAND_PULSE` - Command glow pulsing
- `ENABLE_EMISSIVE_INTENSITY_PULSING` - Emissive breathing

### Help
```javascript
window.NodeVisualIntegrityAPI.help();
```

---

## 🔓 ControlledUnfreezeAPI

### Status (Current State)
```javascript
window.ControlledUnfreeze.status();
```
Shows: Freeze mode state, system reactivation flags, mutation clamping values

### Config (View Configuration)
```javascript
window.ControlledUnfreeze.config();
```
Returns: All configuration values:
- `VISUAL_FREEZE_ENABLED` - Master freeze flag (should be false)
- `CLAMP_AURA_OPACITY` - Max aura opacity (default 0.45)
- `CLAMP_LINK_OPACITY` - Max link opacity (default 0.25)
- `CLAMP_NODE_SCALE` - Node scale lock (default 1.0)
- `CLAMP_NODE_OPACITY` - Node opacity lock (default 1.0)
- System reactivation flags (all should be true)

### Re-Freeze (Emergency Only)
```javascript
window.ControlledUnfreeze.refreeze();
```
Re-enables freeze mode if needed (reversible, can unfreeze again)

### Help
```javascript
window.ControlledUnfreeze.help();
```

---

## ✅ What to Check

### Quick Health Check
```javascript
// 1. Are both APIs accessible?
console.assert(window.NodeVisualIntegrityAPI, 'Integrity API missing');
console.assert(window.ControlledUnfreeze, 'Unfreeze API missing');

// 2. Is freeze mode disabled?
console.assert(!window.ControlledUnfreeze.config().VISUAL_FREEZE_ENABLED, 'Freeze still ON!');

// 3. Are legacy behaviors disabled?
const cfg = window.NodeVisualIntegrityAPI.config();
console.assert(!cfg.ENABLE_NODE_BREATHING_SCALE, 'Node breathing still ON!');

console.log('✅ All systems OK');
```

### Get Config as Object
```javascript
const integrity = window.NodeVisualIntegrityAPI.config();
const unfreeze = window.ControlledUnfreeze.config();

console.log('Integrity:', integrity);
console.log('Unfreeze:', unfreeze);
```

### Check All System Reactivation Flags
```javascript
const cfg = window.ControlledUnfreeze.config();
const systems = [
  'ENABLE_PERSONALITY_VFX',
  'ENABLE_PERSONALITY_SHADER',
  'ENABLE_AURA_MODULATION',
  'ENABLE_METRICS_FX',
  'ENABLE_SYNERGY_EFFECTS',
  'ENABLE_HARMONY_CONSUMER',
  'ENABLE_LINK_PERSONALITY',
  'ENABLE_EVOLUTION_EFFECTS'
];
systems.forEach(sys => {
  console.log(`${sys}: ${cfg[sys] ? '🟢' : '🔴'}`);
});
```

---

## 🔧 Common Tasks

### I want to see what's happening
```javascript
window.NodeVisualIntegrityAPI.report();
window.ControlledUnfreeze.status();
```

### Nodes are still pulsing (shouldn't be)
```javascript
// Check if legacy behaviors are enabled
const cfg = window.NodeVisualIntegrityAPI.config();
console.log('Breathing:', cfg.ENABLE_NODE_BREATHING_SCALE);
console.log('Opacity Pulse:', cfg.ENABLE_MESH_OPACITY_PULSING);

// Disable them
window.NodeVisualIntegrityAPI.disable('ENABLE_NODE_BREATHING_SCALE');
window.NodeVisualIntegrityAPI.disable('ENABLE_MESH_OPACITY_PULSING');
```

### Links look too bright
```javascript
// Check link opacity clamping
const cfg = window.ControlledUnfreeze.config();
console.log('Link opacity clamped to:', cfg.CLAMP_LINK_OPACITY);

// Can adjust if needed (in ControlledUnfreezeSystem_v1.js)
```

### I want to re-freeze temporarily
```javascript
// Re-freeze (systems will be blocked again)
window.ControlledUnfreeze.refreeze();
window.ControlledUnfreeze.status();

// Later, to unfreeze again:
// You'll need to reload page or manually call setupControlledUnfreeze()
```

### I want to validate a specific node
```javascript
// Get a node
const node = window.game.aiNodes.nodes[0];

// Validate it
window.NodeVisualIntegrityAPI.validateNode(node);

// Check its materials
console.log('Material:', node.mesh?.material);
console.log('Opacity:', node.mesh?.material?.opacity);
console.log('RenderOrder:', node.mesh?.renderOrder);
```

---

## 📋 Expected Values

### After Initialization
- `window.NodeVisualIntegrityAPI` exists ✅
- `window.ControlledUnfreeze` exists ✅
- `VISUAL_FREEZE_ENABLED` = `false` ✅
- All legacy behaviors = `false` ✅
- All system reactivation flags = `true` ✅
- `CLAMP_AURA_OPACITY` = `0.45` ✅
- `CLAMP_LINK_OPACITY` = `0.25` ✅
- `CLAMP_NODE_SCALE` = `1.0` ✅
- `CLAMP_NODE_OPACITY` = `1.0` ✅

### Visual Observations
- Nodes are fully visible ✅
- Links are subtle/transparent ✅
- No scale pulsing ✅
- No opacity pulsing ✅
- Holographic details visible ✅

---

## 🚨 Troubleshooting

### API Not Found
```javascript
// Check if it exists
window.NodeVisualIntegrityAPI  // Should exist
window.ControlledUnfreeze      // Should exist

// If not, reload page and check console for errors
```

### Freeze Mode Still Enabled
```javascript
// Check status
window.ControlledUnfreeze.status();

// Should show: VISUAL_FREEZE_ENABLED = false

// If true, something went wrong - check page load logs
```

### Nodes Look Wrong
```javascript
// Get full report
window.NodeVisualIntegrityAPI.report();

// Validate a node
window.NodeVisualIntegrityAPI.validateNode(window.game.aiNodes.nodes[0]);

// Check legacy behaviors aren't interfering
window.NodeVisualIntegrityAPI.config();
```

---

## 📚 More Info

- Full Guide: `/RUNTIME_VERIFICATION_GUIDE.md`
- Quick Start: `/SESSION_107_INTEGRATION_COMPLETE.md`
- Deployment: `/NODE_VISUAL_INTEGRITY_DEPLOYMENT.md`
- Details: `/VISUAL_INTEGRITY_SESSION_SUMMARY.md`

---

*Quick Reference - Keep This Tab Open!*
