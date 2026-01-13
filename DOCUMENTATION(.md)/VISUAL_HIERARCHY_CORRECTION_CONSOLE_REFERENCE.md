# VISUAL HIERARCHY CORRECTION v1.0 - CONSOLE API REFERENCE

**Quick Access**: Copy/paste ready console commands for debugging, monitoring, and control.

---

## SYSTEM DIAGNOSTICS

### Check Overall Statistics
```javascript
window.atoma.visualHierarchyCorrection.getStats()
```
**Returns**:
```javascript
{
  nodesRegistered: 12,           // Total nodes tracked
  constraintsEnforced: 12,       // Nodes with constraints applied
  layersRelocated: 3,            // Layers scaled down
  layersSuppressed: 2,           // Layers hidden
  updateTime: 0.15,              // Per-frame cost in milliseconds
  nodesTracked: 12               // Currently tracked nodes
}
```

### Get Detailed Report for a Single Node
```javascript
// Get first node
window.atoma.visualHierarchyCorrection.getNodeReport(
  window.atoma.aiNodes.nodes[0]
)
```
**Returns**:
```javascript
{
  nodeId: "abc123xyz...",                    // UUID or generated ID
  coreRadius: 0.88,                         // Effective core radius
  maxAuxiliaryRadius: 1.58,                 // Maximum auxiliary extent
  auxiliaryLayers: {
    rings: 2,
    phase: 0,
    evolution: 1,
    aura: 1,
    glyph: 0,
    extreme: 0
  },
  totalAuxiliaryMeshes: 4,                  // Sum of all types
  suppressedLayers: ["extreme-ring"],       // Hidden types
  enforced: true                            // Constraint status
}
```

### Check Performance Impact
```javascript
// Before running critical operations:
const before = performance.now();
window.atoma.visualHierarchyCorrection.update(0.016);
const after = performance.now();
console.log(`Update time: ${after - before}ms`);
```

---

## DEBUG MODE

### Enable Console Logging
```javascript
window.atoma.visualHierarchyCorrection.config.enableDebug = true
```
**Output**: System logs every constraint operation to console

### Disable Console Logging
```javascript
window.atoma.visualHierarchyCorrection.config.enableDebug = false
```

### Print Current Configuration
```javascript
console.log(window.atoma.visualHierarchyCorrection.config)
```
**Shows**: All current configuration values

---

## CONFIGURATION ADJUSTMENTS

### Change Enforcement Mode
```javascript
// Scale down oversized layers (default)
window.atoma.visualHierarchyCorrection.config.enforcementMode = 'constrain'

// Hide oversized layers
window.atoma.visualHierarchyCorrection.config.enforcementMode = 'suppress'

// Move layers outward
window.atoma.visualHierarchyCorrection.config.enforcementMode = 'relocate'
```

### Adjust Radius Scale Factor
```javascript
// Tighter constraints (smaller allowed auxiliary size)
window.atoma.visualHierarchyCorrection.config.radiusScaleFactor = 1.5

// Looser constraints (larger allowed auxiliary size)
window.atoma.visualHierarchyCorrection.config.radiusScaleFactor = 2.2

// Default (balanced)
window.atoma.visualHierarchyCorrection.config.radiusScaleFactor = 1.8
```

### Adjust Opacity Bounds
```javascript
// Allow brighter auxiliary layers
window.atoma.visualHierarchyCorrection.config.auxiliaryOpacityMax = 0.8

// Make auxiliary layers more subtle
window.atoma.visualHierarchyCorrection.config.auxiliaryOpacityMin = 0.2
```

### Toggle Legacy Extreme Suppression
```javascript
// Suppress default-enabled extreme visuals
window.atoma.visualHierarchyCorrection.config.suppressLegacyExtremes = true

// Allow all extreme visuals
window.atoma.visualHierarchyCorrection.config.suppressLegacyExtremes = false
```

---

## MANUAL CONTROL

### Enforce Constraints on Specific Node
```javascript
const node = window.atoma.aiNodes.nodes[0];
window.atoma.visualHierarchyCorrection.enforceNode(node);
```
**Effect**: Immediately applies all constraints to that node

### Disable Enforcement (Allow Visual Clutter)
```javascript
const node = window.atoma.aiNodes.nodes[0];
window.atoma.visualHierarchyCorrection.disableEnforcement(node);
```
**Effect**: Removes constraints (useful for testing or special cases)

### Re-enable Enforcement
```javascript
const node = window.atoma.aiNodes.nodes[0];
window.atoma.visualHierarchyCorrection.enableEnforcement(node);
```
**Effect**: Restores constraints on that node

---

## QUERY OPERATIONS

### Get All Registered Nodes
```javascript
// Count total nodes
window.atoma.visualHierarchyCorrection.nodeRegistry.length

// Iterate through all nodes
window.atoma.visualHierarchyCorrection.nodeRegistry.forEach((node, idx) => {
  console.log(`Node ${idx}:`, node.userData?.category);
});
```

### Find Nodes with Active Suppression
```javascript
// Get all nodes with suppressed layers
const suppressedNodes = window.atoma.visualHierarchyCorrection.nodeRegistry
  .filter(node => {
    const report = window.atoma.visualHierarchyCorrection.getNodeReport(node);
    return report.suppressedLayers.length > 0;
  });

console.log(`Nodes with suppression: ${suppressedNodes.length}`);
```

### Find Nodes Exceeding Core Radius
```javascript
// Get all nodes where auxiliary layers were constrained
const constrainedNodes = window.atoma.visualHierarchyCorrection.nodeRegistry
  .filter(node => {
    const report = window.atoma.visualHierarchyCorrection.getNodeReport(node);
    return report.totalAuxiliaryMeshes > report.coreRadius * 2;
  });

console.log(`Nodes with significant auxiliary layers: ${constrainedNodes.length}`);
```

---

## BATCH OPERATIONS

### Recompute All Constraints
```javascript
// Force recomputation of all nodes
window.atoma.visualHierarchyCorrection.nodeRegistry.forEach(node => {
  window.atoma.visualHierarchyCorrection.enforceNode(node);
});
console.log('✓ All constraints recomputed');
```

### Disable All Enforcement (Debug Mode)
```javascript
// Temporarily allow visual clutter across all nodes
window.atoma.visualHierarchyCorrection.nodeRegistry.forEach(node => {
  window.atoma.visualHierarchyCorrection.disableEnforcement(node);
});
console.log('✓ Enforcement disabled on all nodes');
```

### Re-enable All Enforcement
```javascript
// Restore all constraints
window.atoma.visualHierarchyCorrection.nodeRegistry.forEach(node => {
  window.atoma.visualHierarchyCorrection.enableEnforcement(node);
});
console.log('✓ Enforcement enabled on all nodes');
```

### Generate Report for All Nodes
```javascript
// Create detailed report for every node
const reports = window.atoma.visualHierarchyCorrection.nodeRegistry.map(node => {
  return window.atoma.visualHierarchyCorrection.getNodeReport(node);
});

console.table(reports);
```

---

## AUXILIARY MESH REGISTRATION

### Register External VFX Mesh
```javascript
// Called by external systems (EvolutionRegistry, NodeAuraSystem, etc.)
const node = window.atoma.aiNodes.nodes[0];
const vfxMesh = someExternalSystem.createVFXMesh(node);

window.atoma.visualHierarchyCorrection.registerAuxiliaryMesh(
  node,
  vfxMesh,
  'evolution'  // Type: 'rings'|'phase'|'evolution'|'aura'|'glyph'|'extreme'
);
```

### Supported Auxiliary Types
```javascript
// Orbital rings
'rings'

// Phase transition overlays
'phase'

// Evolution VFX
'evolution'

// Auras/halos
'aura'

// Glyph overlays
'glyph'

// Extreme geometries
'extreme'
```

---

## TROUBLESHOOTING COMMANDS

### Diagnose Visual Clutter on a Node
```javascript
const node = window.atoma.aiNodes.nodes[0];
const report = window.atoma.visualHierarchyCorrection.getNodeReport(node);

console.group('Node Diagnostic Report');
console.log('Core Radius:', report.coreRadius.toFixed(3));
console.log('Max Auxiliary Radius:', report.maxAuxiliaryRadius.toFixed(3));
console.log('Total Auxiliary Meshes:', report.totalAuxiliaryMeshes);
console.log('Suppressed Layers:', report.suppressedLayers);
console.log('Enforced:', report.enforced);
console.table(report.auxiliaryLayers);
console.groupEnd();
```

### Check if Constraints Are Active
```javascript
const stats = window.atoma.visualHierarchyCorrection.getStats();
console.log(`Constraints enforced: ${stats.constraintsEnforced} / ${stats.nodesRegistered}`);
console.log(`Layers constrained: ${stats.layersRelocated}`);
console.log(`Layers suppressed: ${stats.layersSuppressed}`);
console.log(`Frame cost: ${stats.updateTime.toFixed(3)}ms`);
```

### Verify System Initialization
```javascript
if (window.atoma.visualHierarchyCorrection) {
  console.log('✓ Visual Hierarchy Correction System initialized');
  console.log('Nodes tracked:', window.atoma.visualHierarchyCorrection.nodeRegistry.length);
} else {
  console.error('✗ Visual Hierarchy Correction System NOT initialized');
}
```

### Test Enforcement Algorithm
```javascript
// Manually test on a single node
const testNode = window.atoma.aiNodes.nodes[0];
window.atoma.visualHierarchyCorrection.config.enableDebug = true;
window.atoma.visualHierarchyCorrection.enforceNode(testNode);
window.atoma.visualHierarchyCorrection.config.enableDebug = false;

// Check result
const report = window.atoma.visualHierarchyCorrection.getNodeReport(testNode);
console.log('Test result:', report);
```

---

## PERFORMANCE MONITORING

### Profile System Performance
```javascript
const iterations = 100;
const before = performance.now();

for (let i = 0; i < iterations; i++) {
  window.atoma.visualHierarchyCorrection.update(0.016);
}

const after = performance.now();
const avgTime = (after - before) / iterations;

console.log(`Average per-frame time: ${avgTime.toFixed(3)}ms`);
console.log(`For ${window.atoma.visualHierarchyCorrection.nodeRegistry.length} nodes`);
```

### Monitor Memory Usage
```javascript
// Rough estimate of constraint data memory
const nodeCount = window.atoma.visualHierarchyCorrection.nodeRegistry.length;
const bytesPerNode = 200; // Approximate
const totalBytes = nodeCount * bytesPerNode;

console.log(`Nodes: ${nodeCount}`);
console.log(`Memory per node: ${bytesPerNode} bytes`);
console.log(`Total constraint memory: ${(totalBytes / 1024).toFixed(1)} KB`);
```

---

## QUICK COMMAND ALIASES

### Save Time with Aliases
```javascript
// Define shortcuts for frequent use
window.vhc = window.atoma.visualHierarchyCorrection;
window.vhcStats = () => window.vhc.getStats();
window.vhcReport = (nodeIdx = 0) => window.vhc.getNodeReport(window.atoma.aiNodes.nodes[nodeIdx]);
window.vhcDebug = () => { window.vhc.config.enableDebug = true; console.log('Debug ON'); };
window.vhcEnforce = () => { 
  window.vhc.nodeRegistry.forEach(n => window.vhc.enforceNode(n));
  console.log('All nodes enforced');
};

// Now use shorter commands:
window.vhcStats()
window.vhcReport(2)
window.vhcDebug()
window.vhcEnforce()
```

---

## EXAMPLE WORKFLOWS

### Workflow 1: Complete System Audit
```javascript
console.group('VISUAL HIERARCHY AUDIT');
console.log('System Stats:');
console.table(window.atoma.visualHierarchyCorrection.getStats());

console.log('\nNode Reports:');
window.atoma.visualHierarchyCorrection.nodeRegistry.slice(0, 3).forEach((node, idx) => {
  console.log(`Node ${idx}:`);
  console.table(window.atoma.visualHierarchyCorrection.getNodeReport(node));
});
console.groupEnd();
```

### Workflow 2: Test Enforcement Modes
```javascript
const node = window.atoma.aiNodes.nodes[0];

// Test each mode
['constrain', 'suppress', 'relocate'].forEach(mode => {
  window.atoma.visualHierarchyCorrection.config.enforcementMode = mode;
  window.atoma.visualHierarchyCorrection.enforceNode(node);
  console.log(`Mode: ${mode} - Constraints applied`);
});
```

### Workflow 3: Benchmark Performance
```javascript
console.group('PERFORMANCE BENCHMARK');
const nodeCount = window.atoma.visualHierarchyCorrection.nodeRegistry.length;

const startTime = performance.now();
for (let i = 0; i < 1000; i++) {
  window.atoma.visualHierarchyCorrection.update(0.016);
}
const endTime = performance.now();

const totalTime = endTime - startTime;
const avgPerFrame = totalTime / 1000;
const costPerNode = avgPerFrame / nodeCount;

console.log(`Nodes: ${nodeCount}`);
console.log(`Total time (1000 frames): ${totalTime.toFixed(2)}ms`);
console.log(`Average per-frame: ${avgPerFrame.toFixed(3)}ms`);
console.log(`Cost per node: ${(costPerNode * 1000).toFixed(2)}μs`);
console.groupEnd();
```

---

## REFERENCE QUICK LINKS

- **Main System File**: `_VisualHierarchyCorrectionSystem_v1.js`
- **Deployment Guide**: `VISUAL_HIERARCHY_CORRECTION_v1_0_DEPLOYMENT.md`
- **Quick Reference**: `VISUAL_HIERARCHY_CORRECTION_QUICKREF.md`
- **Session Summary**: `SESSION_20_VISUAL_HIERARCHY_SUMMARY.md`

---

**Visual Hierarchy Correction v1.0 - Console Reference**  
*Everything you need to debug, monitor, and control the system from the browser console.*

