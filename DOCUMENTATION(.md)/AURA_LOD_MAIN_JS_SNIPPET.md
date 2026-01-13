# Aura LOD Integration Snippet for main.js

## Quick Setup (3 lines)

Add this to your main.js after AINodes and camera are initialized:

```javascript
// After: const aiNodes = new AINodes(scene, playerController);
// After: const camera = new THREE.PerspectiveCamera(...);

aiNodes.setCamera(camera);  // Register camera for LOD culling
setupAuraLODCullingConsoleAPI(aiNodes.auraLOD);  // Optional: enable console API
```

## Full Example

```javascript
import { AINodes } from './AINodes.js';
import { setupAuraLODCullingConsoleAPI } from './AuraLODCulling.js';
import * as THREE from 'three';

// ... in your init function ...

async function initializeScene() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
  const playerController = new FirstPersonCameraController(camera);
  
  // Create AI nodes system
  const aiNodes = new AINodes(scene, playerController);
  
  // ===== NEW: Register camera for LOD culling =====
  aiNodes.setCamera(camera);
  
  // Optional: Setup console debugging API
  setupAuraLODCullingConsoleAPI(aiNodes.auraLOD);
  
  // Optional: Customize LOD parameters (before first update)
  aiNodes.auraLOD.setConfig({
    distanceThreshold: 30,     // Hide auras beyond 30 units
    hysteresis: 3,             // Prevent flickering
    updateInterval: 100,       // Check every 100ms
    keepVisibleWhenSelected: true,  // Keep visible when inspected
  });
  
  // Create world and add nodes
  aiNodes.createNodes('chamber', 20);
  
  // ... rest of initialization ...
  
  return { scene, camera, aiNodes, playerController };
}
```

## Console API Usage (in browser DevTools)

```javascript
// View current config
debugAuraLOD.getConfig();

// View statistics
debugAuraLOD.getStats();

// Adjust at runtime
debugAuraLOD.setThreshold(25);      // Change distance
debugAuraLOD.setHysteresis(2);      // Reduce flickering
debugAuraLOD.setUpdateHz(10);       // Change update rate

// Reset all auras to visible (for testing)
debugAuraLOD.resetAll(aiNodes.nodes);
```

## Default Configuration

| Parameter | Value | Notes |
|-----------|-------|-------|
| Distance Threshold | 30 | Hide auras beyond 30 world units |
| Hysteresis | 3 | 3-unit buffer zone prevents flickering |
| Update Interval | 100ms | ~10 Hz update rate |
| Keep Visible When Selected | true | Auras stay visible when node is inspected |

## Tuning for Different Hardware

### High-End (RTX 3070+)
```javascript
aiNodes.auraLOD.setConfig({
  distanceThreshold: 40,     // More visible auras
  hysteresis: 4,
  updateInterval: 50,        // 20 Hz
});
```

### Mobile (iPad/Android)
```javascript
aiNodes.auraLOD.setConfig({
  distanceThreshold: 15,     // Aggressive culling
  hysteresis: 2,
  updateInterval: 150,       // ~7 Hz
});
```

### VR (Low Latency Priority)
```javascript
aiNodes.auraLOD.setConfig({
  distanceThreshold: 20,
  hysteresis: 2,
  updateInterval: 16,        // 60 Hz (match frame rate)
});
```

## Performance Monitoring

```javascript
// Log LOD stats every 500ms
setInterval(() => {
  const stats = debugAuraLOD.getStats();
  const config = debugAuraLOD.getConfig();
  console.log(`LOD: culled=${stats.culledThisFrame} restored=${stats.restoredThisFrame} threshold=${config.distanceThreshold}`);
}, 500);
```

## Verification

After setup, verify in browser console:

```javascript
// Should log "Camera registered for Aura LOD culling"
// Check that stats.totalChecks > 0 after first frame
debugAuraLOD.getStats();
```

If you see `{totalChecks: 0}`, camera may not be set. Call:
```javascript
aiNodes.setCamera(camera);
```
