# Legacy Scale Pulse - Console API Reference

## Quick Status Check (10 seconds)

```javascript
// Check if all breathing is disabled
console.log('Scale Pulse Config:', EnhancedNodeModels.config);

// Expected output:
// {
//   DISABLE_LEGACY_SCALE_PULSE: true,      ← Master disable ON
//   DISABLE_SPINE_BREATHING: true,         ← All breathing OFF
//   DISABLE_FUNNEL_BREATHING: true,
//   DISABLE_FRACTAL_BREATHING: true,
//   DISABLE_ANTENNA_PULSE: true,
//   DISABLE_GLOW_PULSING: true
// }
```

---

## Master Control Commands

### Check Master Flag Status
```javascript
EnhancedNodeModels.config.DISABLE_LEGACY_SCALE_PULSE
// true = all breathing disabled ✅
// false = breathing potentially active ⚠️
```

### Disable All Breathing (DEFAULT - Recommended)
```javascript
EnhancedNodeModels.config.DISABLE_LEGACY_SCALE_PULSE = true;
console.log('✅ All node breathing DISABLED');
```

### Enable All Breathing (DEBUG ONLY)
```javascript
EnhancedNodeModels.config.DISABLE_LEGACY_SCALE_PULSE = false;
console.log('⚠️ Legacy breathing RE-ENABLED (DEBUG MODE)');
```

---

## Individual Behavior Control

### Check Individual Settings
```javascript
const cfg = EnhancedNodeModels.config;
console.log('TRANSFORMATION_SPINE:', cfg.DISABLE_SPINE_BREATHING);
console.log('INCOMING_FUNNEL:', cfg.DISABLE_FUNNEL_BREATHING);
console.log('FRACTAL_ECHO:', cfg.DISABLE_FRACTAL_BREATHING);
console.log('SIGNAL_RECEPTOR Antenna:', cfg.DISABLE_ANTENNA_PULSE);
console.log('COMMAND_PYRAMID Glow:', cfg.DISABLE_GLOW_PULSING);
```

### Enable Specific Behaviors (Individual Control)
```javascript
// Re-enable only TRANSFORMATION_SPINE breathing
EnhancedNodeModels.config.DISABLE_SPINE_BREATHING = false;

// Re-enable only SIGNAL_RECEPTOR antenna pulse
EnhancedNodeModels.config.DISABLE_ANTENNA_PULSE = false;

// Re-enable only COMMAND_PYRAMID glow pulsing
EnhancedNodeModels.config.DISABLE_GLOW_PULSING = false;
```

### Disable Specific Behaviors (Safety Lock)
```javascript
// Lock down TRANSFORMATION_SPINE breathing
EnhancedNodeModels.config.DISABLE_SPINE_BREATHING = true;

// Lock down all antenna pulsing
EnhancedNodeModels.config.DISABLE_ANTENNA_PULSE = true;
```

---

## Detailed Configuration

### View Full Config Object
```javascript
console.table(EnhancedNodeModels.config);
```

**Output**:
```
┌────────────────────────────────┬────────┐
│ Key                            │ Value  │
├────────────────────────────────┼────────┤
│ DISABLE_LEGACY_SCALE_PULSE     │ true   │
│ DISABLE_SPINE_BREATHING        │ true   │
│ DISABLE_FUNNEL_BREATHING       │ true   │
│ DISABLE_FRACTAL_BREATHING      │ true   │
│ DISABLE_ANTENNA_PULSE          │ true   │
│ DISABLE_GLOW_PULSING           │ true   │
└────────────────────────────────┴────────┘
```

### Get All Flags as Object
```javascript
const allFlags = { ...EnhancedNodeModels.config };
console.log('Current configuration:', allFlags);
```

---

## Diagnostic Commands

### Check If Nodes Are Breathing
```javascript
const cfg = EnhancedNodeModels.config;
const isBreathingActive = 
  !cfg.DISABLE_LEGACY_SCALE_PULSE || 
  (!cfg.DISABLE_SPINE_BREATHING && !cfg.DISABLE_LEGACY_SCALE_PULSE);

console.log(isBreathingActive ? 
  '⚠️ Nodes are breathing' : 
  '✅ Node breathing is disabled');
```

### Verify Default State (All Disabled)
```javascript
const cfg = EnhancedNodeModels.config;
const isDefaultState = 
  cfg.DISABLE_LEGACY_SCALE_PULSE === true &&
  cfg.DISABLE_SPINE_BREATHING === true &&
  cfg.DISABLE_FUNNEL_BREATHING === true &&
  cfg.DISABLE_FRACTAL_BREATHING === true &&
  cfg.DISABLE_ANTENNA_PULSE === true &&
  cfg.DISABLE_GLOW_PULSING === true;

console.log(isDefaultState ? 
  '✅ All breathing is DISABLED (default state)' : 
  '⚠️ Some behaviors are re-enabled');
```

---

## Comparison Commands

### Compare Before/After States
```javascript
// Before (what you DON'T want)
const beforeState = {
  DISABLE_LEGACY_SCALE_PULSE: false,
  DISABLE_SPINE_BREATHING: false,
  DISABLE_FUNNEL_BREATHING: false,
  DISABLE_FRACTAL_BREATHING: false,
  DISABLE_ANTENNA_PULSE: false,
  DISABLE_GLOW_PULSING: false
};

// After (what you DO want - current)
const afterState = EnhancedNodeModels.config;

console.log('Before (breathing ON):', beforeState);
console.log('After (breathing OFF):', afterState);
```

### Quick Health Check
```javascript
const cfg = EnhancedNodeModels.config;
const isHealthy = Object.values(cfg).every(v => v === true);

if (isHealthy) {
  console.log('✅ All breathing disabled - System HEALTHY');
} else {
  console.log('⚠️ Some breathing is active - Check config');
}
```

---

## Behavior-Specific Commands

### TRANSFORMATION_SPINE (Integration Node)
```javascript
// Check status
console.log('Spine breathing disabled:', 
  EnhancedNodeModels.config.DISABLE_SPINE_BREATHING);

// Disable (recommended)
EnhancedNodeModels.config.DISABLE_SPINE_BREATHING = true;

// Enable (debug only)
EnhancedNodeModels.config.DISABLE_SPINE_BREATHING = false;
```

### INCOMING_FUNNEL (Process Node)
```javascript
// Check status
console.log('Funnel width breathing disabled:', 
  EnhancedNodeModels.config.DISABLE_FUNNEL_BREATHING);

// Disable (recommended)
EnhancedNodeModels.config.DISABLE_FUNNEL_BREATHING = true;

// Enable (debug only)
EnhancedNodeModels.config.DISABLE_FUNNEL_BREATHING = false;
```

### FRACTAL_ECHO (Special Archetype)
```javascript
// Check status
console.log('Fractal breathing disabled:', 
  EnhancedNodeModels.config.DISABLE_FRACTAL_BREATHING);

// Disable (recommended)
EnhancedNodeModels.config.DISABLE_FRACTAL_BREATHING = true;

// Enable (debug only)
EnhancedNodeModels.config.DISABLE_FRACTAL_BREATHING = false;
```

### SIGNAL_RECEPTOR (Input Node - Antenna Pulse)
```javascript
// Check status
console.log('Antenna pulse disabled:', 
  EnhancedNodeModels.config.DISABLE_ANTENNA_PULSE);

// Disable (recommended)
EnhancedNodeModels.config.DISABLE_ANTENNA_PULSE = true;

// Enable (debug only)
EnhancedNodeModels.config.DISABLE_ANTENNA_PULSE = false;
```

### COMMAND_PYRAMID (Control Node - Glow Pulsing)
```javascript
// Check status
console.log('Glow pulsing disabled:', 
  EnhancedNodeModels.config.DISABLE_GLOW_PULSING);

// Disable (recommended)
EnhancedNodeModels.config.DISABLE_GLOW_PULSING = true;

// Enable (debug only)
EnhancedNodeModels.config.DISABLE_GLOW_PULSING = false;
```

---

## Restoration Commands

### Restore All Defaults (Safe)
```javascript
// Reset everything to default (all breathing disabled)
EnhancedNodeModels.config.DISABLE_LEGACY_SCALE_PULSE = true;
EnhancedNodeModels.config.DISABLE_SPINE_BREATHING = true;
EnhancedNodeModels.config.DISABLE_FUNNEL_BREATHING = true;
EnhancedNodeModels.config.DISABLE_FRACTAL_BREATHING = true;
EnhancedNodeModels.config.DISABLE_ANTENNA_PULSE = true;
EnhancedNodeModels.config.DISABLE_GLOW_PULSING = true;

console.log('✅ All settings restored to defaults (breathing DISABLED)');
```

### Emergency Re-Enable (Debug Only)
```javascript
// WARNING: Only use for debugging!
EnhancedNodeModels.config.DISABLE_LEGACY_SCALE_PULSE = false;

console.log('⚠️ Legacy breathing RE-ENABLED - This is DEBUG MODE');
console.log('⚠️ Remember to re-disable when done!');
```

---

## Visual Testing Commands

### Monitor Breathing State
```javascript
// Run in console, watch for any scale changes
setInterval(() => {
  const cfg = EnhancedNodeModels.config;
  const isBreathingDisabled = cfg.DISABLE_LEGACY_SCALE_PULSE;
  
  console.log(`[${new Date().toLocaleTimeString()}] Breathing disabled: ${isBreathingDisabled}`);
}, 5000);
```

### Performance Impact Check
```javascript
// Check if disabling breathing improves frame rate
console.log('Before:', window.performance.memory?.usedJSHeapSize);
EnhancedNodeModels.config.DISABLE_LEGACY_SCALE_PULSE = true;
console.log('After:', window.performance.memory?.usedJSHeapSize);
```

---

## Common Workflows

### Workflow 1: Verify System Health
```javascript
// 1. Check config
const cfg = EnhancedNodeModels.config;

// 2. Verify all disabled
console.assert(cfg.DISABLE_LEGACY_SCALE_PULSE === true, 'Master flag not set!');
console.assert(cfg.DISABLE_SPINE_BREATHING === true, 'Spine breathing not disabled!');
console.assert(cfg.DISABLE_FUNNEL_BREATHING === true, 'Funnel breathing not disabled!');
console.assert(cfg.DISABLE_FRACTAL_BREATHING === true, 'Fractal breathing not disabled!');
console.assert(cfg.DISABLE_ANTENNA_PULSE === true, 'Antenna pulse not disabled!');
console.assert(cfg.DISABLE_GLOW_PULSING === true, 'Glow pulsing not disabled!');

console.log('✅ All assertions passed - System is HEALTHY');
```

### Workflow 2: Temporary Debug (Re-Enable One)
```javascript
// 1. Save current state
const savedConfig = { ...EnhancedNodeModels.config };

// 2. Re-enable one behavior for testing
EnhancedNodeModels.config.DISABLE_SPINE_BREATHING = false;
console.log('Testing TRANSFORMATION_SPINE breathing...');

// 3. Observe nodes for 10 seconds
// 4. Restore saved state
EnhancedNodeModels.config = savedConfig;
console.log('✅ Testing complete - config restored');
```

### Workflow 3: Full System Check
```javascript
console.group('🔍 Scale Pulse System Check');

const cfg = EnhancedNodeModels.config;
console.log('Master Flag:', cfg.DISABLE_LEGACY_SCALE_PULSE ? '✅ ON' : '❌ OFF');
console.log('Spine Breathing:', cfg.DISABLE_SPINE_BREATHING ? '✅ Disabled' : '⚠️ Active');
console.log('Funnel Breathing:', cfg.DISABLE_FUNNEL_BREATHING ? '✅ Disabled' : '⚠️ Active');
console.log('Fractal Breathing:', cfg.DISABLE_FRACTAL_BREATHING ? '✅ Disabled' : '⚠️ Active');
console.log('Antenna Pulse:', cfg.DISABLE_ANTENNA_PULSE ? '✅ Disabled' : '⚠️ Active');
console.log('Glow Pulsing:', cfg.DISABLE_GLOW_PULSING ? '✅ Disabled' : '⚠️ Active');

const allDisabled = Object.values(cfg).every(v => v === true);
console.log('Overall Status:', allDisabled ? '✅ HEALTHY' : '⚠️ CHECK NEEDED');

console.groupEnd();
```

---

## Copy-Paste Commands

### Quick Check
```javascript
console.log(EnhancedNodeModels.config);
```

### Quick Disable All
```javascript
EnhancedNodeModels.config.DISABLE_LEGACY_SCALE_PULSE = true;
```

### Quick Enable All (Debug)
```javascript
EnhancedNodeModels.config.DISABLE_LEGACY_SCALE_PULSE = false;
```

### Quick Status
```javascript
const cfg = EnhancedNodeModels.config;
console.log(`Master: ${cfg.DISABLE_LEGACY_SCALE_PULSE}, Spine: ${cfg.DISABLE_SPINE_BREATHING}, Funnel: ${cfg.DISABLE_FUNNEL_BREATHING}, Fractal: ${cfg.DISABLE_FRACTAL_BREATHING}, Antenna: ${cfg.DISABLE_ANTENNA_PULSE}, Glow: ${cfg.DISABLE_GLOW_PULSING}`);
```

---

## Summary

| Command | Purpose |
|---------|---------|
| `EnhancedNodeModels.config` | View all settings |
| `config.DISABLE_LEGACY_SCALE_PULSE = true` | Disable all breathing (recommended) |
| `config.DISABLE_LEGACY_SCALE_PULSE = false` | Enable all breathing (debug only) |
| Individual flags | Fine-grained control per behavior |

**Default State**: All breathing is **DISABLED** ✅

---

*Console API Reference - Keep This Tab Open!*
