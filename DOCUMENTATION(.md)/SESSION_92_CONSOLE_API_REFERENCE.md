# SESSION 92: VISUAL OVERLAY AUDIT — CONSOLE API REFERENCE

## Quick Start

```javascript
// Check for opaque overlays
visualOverlayAudit.reportStats();

// Full audit of all nodes
const report = visualOverlayAudit.scanAllNodes();
console.log(report);

// Enable strict mode (prevents opaque overlays)
visualOverlayAudit.enableStrictMode(true);
```

---

## Visual Overlay Audit API

### `visualOverlayAudit.scanAllNodes()`
Scans entire scene for visual overlays on all nodes.

**Returns:**
```javascript
{
  timestamp: number,
  summary: {
    totalNodes: number,
    nodesWithOverlays: number,
    totalOverlayMeshes: number,
    opaqueViolations: number,        // ⚠️ violations
    wireframeOutlines: number,       // ✓ OK
    helperGeometry: number           // ✓ OK
  },
  violations: [
    {
      nodeId: string,
      layerName: string,
      issue: 'OPAQUE_FILLED_MESH',
      opacity: number,
      geometry: 'PlaneGeometry' | 'CircleGeometry' | ...
    }
  ],
  status: 'CLEAN' | 'VIOLATIONS_DETECTED'
}
```

**Example:**
```javascript
const report = visualOverlayAudit.scanAllNodes();
if (report.status === 'VIOLATIONS_DETECTED') {
  console.warn(`Found ${report.violations.length} opaque overlays`);
  report.violations.forEach(v => {
    console.warn(`  Node ${v.nodeId}: ${v.layerName} (${v.geometry})`);
  });
}
```

---

### `visualOverlayAudit.getNodeOverlays(node)`
Get overlay details for a specific node.

**Parameters:**
- `node`: THREE.Object3D - The node to inspect

**Returns:**
```javascript
{
  nodeId: string,
  category: string,
  overlays: [
    {
      layerName: string,
      isOpaque: boolean,
      isWireframe: boolean,
      opacity: number,
      geometryType: string,
      size: number  // Estimated mesh size
    }
  ]
}
```

**Example:**
```javascript
// Click on a node in the scene, then in console:
const selectedNode = window.aiNodes?.nodes[0]; // get a node
if (selectedNode) {
  const details = visualOverlayAudit.getNodeOverlays(selectedNode);
  console.log('Overlays on this node:', details.overlays);
}
```

---

### `visualOverlayAudit.reportStats()`
Print formatted audit report to console.

**Example:**
```javascript
visualOverlayAudit.reportStats();

// Output:
// ✓ VISUAL OVERLAY AUDIT REPORT
// Total Nodes: 125
// Nodes with Overlays: 42
// Total Overlay Meshes: 87
// 
// Breakdown:
//   Wireframe Outlines (OK): 42
//   Helper Geometry (OK): 45
//   OPAQUE VIOLATIONS: 0
// ✓ No opaque overlays detected
```

---

### `visualOverlayAudit.enableStrictMode(enabled)`
Enable/disable strict enforcement of visual layer rules.

**Parameters:**
- `enabled`: boolean - true to enable, false to disable

**Behavior (strict mode ON):**
- Blocks opaque filled planes/circles from rendering
- Logs errors for unregistered layers
- Prevents unknown overlays

**Example:**
```javascript
visualOverlayAudit.enableStrictMode(true);
// 🔒 STRICT MODE: Enforcing overlay rules

// Later:
visualOverlayAudit.enableStrictMode(false);
// ✓ Strict mode disabled
```

---

### `visualOverlayAudit.validateOverlay(mesh, layerName)`
Validate if an overlay is allowed to render.

**Parameters:**
- `mesh`: THREE.Mesh - The mesh to validate
- `layerName`: string - The visual layer name

**Returns:** boolean - true if allowed, false if forbidden

**Example:**
```javascript
const allowed = visualOverlayAudit.validateOverlay(overlayMesh, 'GLYPH_LAYER');
if (!allowed) {
  console.error('This overlay is not permitted');
  scene.remove(overlayMesh);
}
```

---

## Visual Layer Debugger API

### `visualLayerDebugger.enable()`
Start monitoring all visual layer additions.

```javascript
visualLayerDebugger.enable();
// 🔍 Visual Layer Debugger: ENABLED (monitoring node.add() calls)
```

---

### `visualLayerDebugger.disable()`
Stop monitoring.

```javascript
visualLayerDebugger.disable();
// ⚫ Visual Layer Debugger: DISABLED
```

---

### `visualLayerDebugger.logLayerAddition(node, mesh, layerName, details)`
Manually log a visual layer addition (called by visual systems).

**Parameters:**
- `node`: THREE.Object3D - The node
- `mesh`: THREE.Mesh - The overlay mesh
- `layerName`: string - Layer identifier
- `details`: object - Optional metadata

**Example:**
```javascript
visualLayerDebugger.logLayerAddition(node, glyphMesh, 'GLYPH_LAYER', {
  reason: 'corruption_indicator',
  value: node.userData.corruption
});
```

---

### `visualLayerDebugger.getLog()`
Get all logged events.

**Returns:** Array of log entries

```javascript
const allEvents = visualLayerDebugger.getLog();
console.log(`Total layer additions: ${allEvents.length}`);
```

---

### `visualLayerDebugger.getNodeLog(node)`
Get all layer additions for a specific node.

```javascript
const nodeEvents = visualLayerDebugger.getNodeLog(node);
nodeEvents.forEach(e => {
  console.log(`${e.layerName}: ${e.geometryType} (opacity=${e.opacity})`);
});
```

---

### `visualLayerDebugger.getLayerLog(layerName)`
Get all additions for a specific layer type.

```javascript
const glyphEvents = visualLayerDebugger.getLayerLog('GLYPH_LAYER');
console.log(`GLYPH_LAYER used ${glyphEvents.length} times`);
```

---

### `visualLayerDebugger.getSuspiciousEntries()`
Get entries that violate visual layer rules.

**Returns:** Array of suspicious entries

```javascript
const suspicious = visualLayerDebugger.getSuspiciousEntries();
if (suspicious.length > 0) {
  console.warn('⚠️ Found suspicious overlays:');
  suspicious.forEach(e => {
    console.warn(`  ${e.layerName} on node ${e.nodeId}`);
  });
}
```

---

### `visualLayerDebugger.reportSummary()`
Print formatted debug report.

```javascript
visualLayerDebugger.reportSummary();

// Output:
// 📊 VISUAL LAYER DEBUG REPORT
// Total Entries: 234
// Unknown Layers: 0
// Opaque Overlays: 0
// ✓ No suspicious entries found
```

---

### `visualLayerDebugger.clearLog()`
Clear the debug log.

```javascript
visualLayerDebugger.clearLog();
// ✓ Log cleared (234 entries removed)
```

---

### `visualLayerDebugger.registerLayer(layerName)`
Register a known visual layer type.

```javascript
visualLayerDebugger.registerLayer('CUSTOM_EFFECT');
// ✓ Registered visual layer: "CUSTOM_EFFECT"
```

---

### `visualLayerDebugger.getRegisteredLayers()`
Get all known layer types.

```javascript
const layers = visualLayerDebugger.getRegisteredLayers();
console.log('Registered layers:', layers.join(', '));

// Output: Registered layers: AURA, CORE, DECORATION, EDGE_GLOW, GLYPH_LAYER, GLOW, ...
```

---

## Common Workflows

### Workflow 1: Check for any opaque overlays
```javascript
const report = visualOverlayAudit.scanAllNodes();
if (report.status === 'VIOLATIONS_DETECTED') {
  console.error(`❌ Found ${report.violations.length} opaque overlays!`);
  console.table(report.violations);
} else {
  console.log('✓ Scene is clean - no opaque overlays');
}
```

### Workflow 2: Inspect a specific node
```javascript
// Select node in scene, then:
const selectedNode = window.selectedNode; // or get from UI
const overlays = visualOverlayAudit.getNodeOverlays(selectedNode);
console.log('Overlays:', overlays.overlays);
```

### Workflow 3: Monitor for new violations
```javascript
visualLayerDebugger.enable();
// ... play the game ...
visualLayerDebugger.reportSummary();

// If suspicious:
const suspicious = visualLayerDebugger.getSuspiciousEntries();
visualLayerDebugger.clearLog();
```

### Workflow 4: Enable strict enforcement
```javascript
visualOverlayAudit.enableStrictMode(true);
// Now any opaque overlays will be rejected at validation
```

---

## Troubleshooting

### "No opaque overlays detected" but still seeing discs?
1. Check if it's a node core or shell (not an overlay)
2. Run: `visualLayerDebugger.reportSummary()`
3. Look for "Unknown Layers" entries
4. Check if SafeNodePersonalityFX was re-enabled

### "OPAQUE_FILLED_MESH" violations appearing?
1. Note the layer name and node ID
2. Disable that system in main.js
3. Re-scan with `visualOverlayAudit.scanAllNodes()`
4. Verify violation cleared

### Getting "Unregistered layer" warnings?
1. This layer needs to be added to `knownLayers` in VisualLayerDebugger
2. Or the system needs updating
3. Register with: `visualLayerDebugger.registerLayer('LAYER_NAME')`

---

## Session 92 Status

✅ SafeNodePersonalityFX disabled  
✅ Visual Overlay Audit System active  
✅ Visual Layer Debugger active  
✅ Console APIs available  
✅ Zero opaque overlays detected  
✅ Scene readability restored  

**Ready for production deployment**
