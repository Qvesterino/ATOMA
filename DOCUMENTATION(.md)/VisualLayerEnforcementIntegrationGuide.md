# VISUAL LAYER ENFORCEMENT GATE — INTEGRATION GUIDE

**Purpose**: Integrate the enforcement gate into existing visual systems  
**Scope**: Add gate checks before visual attachment points  
**Compatibility**: Zero breaking changes; insertion-only  
**Status**: Ready for deployment  

---

## INTEGRATION PATTERN

### Before Visual Attachment

All node-related visual systems follow this pattern:

**CURRENT (Without Gate)**:
```javascript
const mesh = new THREE.Mesh(geometry, material);
mesh.userData.visualLayer = 'GLYPH_LAYER';
scene.add(mesh);  // ← Visual added immediately
```

**WITH GATE (New Pattern)**:
```javascript
const mesh = new THREE.Mesh(geometry, material);
mesh.userData.visualLayer = 'GLYPH_LAYER';

// ✓ Check with enforcement gate
if (VisualLayerEnforcementGate.canAttach({
  nodeId: node.userData.index,
  nodeCategory: node.userData.category,
  layerType: 'GLYPH_LAYER',
  geometryType: 'PlaneGeometry',
  opacity: material.opacity,
  sourceSystem: 'GlyphLayer4_MultiFusion'
})) {
  scene.add(mesh);  // ← Only add if approved
} else {
  mesh.geometry.dispose();  // Clean up rejected mesh
  mesh.material.dispose();
}
```

### Key Points

1. **Gate is called BEFORE attachment** (not after)
2. **Request object documents the visual** (for audit trail)
3. **Rejection is silent** (gate handles logging)
4. **Cleanup is caller's responsibility** (dispose if rejected)
5. **No change to visual logic** (gate is pass-through check)

---

## INTEGRATION CHECKLIST

### Step 1: Initialize Gate in main.js

Add to initialization section:

```javascript
import { VisualLayerEnforcementGate } from './VisualLayerEnforcementGate.js';

// In setupVisualAuthority() or equivalent:
this.visualLayerGate = new VisualLayerEnforcementGate();

// Set mode (can change via console later)
this.visualLayerGate.setMode('DEV');  // Start in DEV for testing

// Set up console API
if (window.setupVisualLayerEnforcementGateAPI) {
  window.setupVisualLayerEnforcementGateAPI(this.visualLayerGate);
}
```

### Step 2: Identify Visual Attachment Points

Find all locations where node-related meshes are added:

**Key Systems** (typically):
- GlyphLayer4_MultiFusion
- SemanticGlyphAI
- NodeAuraSystem_v1
- CorruptionVisualFX
- UISelectedNodeHighlight3_2
- AINodeModel
- Any custom visual system

**Search Pattern**:
```
scene.add(mesh)
nodeGroup.add(mesh)
node.add(mesh)
parent.add(visualMesh)
```

### Step 3: Insert Gate Checks

For each attachment point, wrap with gate check:

```javascript
// Template
if (VisualLayerEnforcementGate.canAttach({
  nodeId: nodeIdValue,
  nodeCategory: categoryValue,
  layerType: 'LAYER_NAME',
  geometryType: geometryValue.constructor.name,
  opacity: materialValue.opacity || 1.0,
  sourceSystem: 'SystemName'
})) {
  targetContainer.add(mesh);
} else {
  // Optionally log rejection or take action
  mesh.geometry?.dispose();
  mesh.material?.dispose();
}
```

### Step 4: Test in Each Mode

```javascript
// DEV mode (development)
visualLayerGate.setMode('DEV');
// → Violations allowed but logged

// STRICT mode (QA/testing)
visualLayerGate.setMode('STRICT');
// → Violations blocked with warnings

// PROD mode (production)
visualLayerGate.setMode('PROD');
// → Violations silently blocked
```

---

## SYSTEM-BY-SYSTEM INTEGRATION

### GlyphLayer4_MultiFusion

**Current Code** (approximate):
```javascript
const glyphMesh = new THREE.Mesh(planeGeom, material);
this.scene.add(glyphMesh);
```

**With Gate**:
```javascript
const glyphMesh = new THREE.Mesh(planeGeom, material);

if (VisualLayerEnforcementGate.canAttach({
  nodeId: node.userData.index,
  nodeCategory: node.userData.category,
  layerType: 'GLYPH_LAYER',
  geometryType: 'PlaneGeometry',
  opacity: material.opacity,
  sourceSystem: 'GlyphLayer4_MultiFusion'
})) {
  this.scene.add(glyphMesh);
}
```

### SemanticGlyphAI

**Current Code**:
```javascript
const ring = new THREE.Mesh(torusGeom, material);
this.helperContainer.add(ring);
```

**With Gate**:
```javascript
const ring = new THREE.Mesh(torusGeom, material);

if (VisualLayerEnforcementGate.canAttach({
  nodeId: nodeId,
  nodeCategory: node.userData.category,
  layerType: 'STATE_GLYPH',
  geometryType: 'TorusGeometry',
  opacity: material.opacity,
  sourceSystem: 'SemanticGlyphAI'
})) {
  this.helperContainer.add(ring);
}
```

### NodeAuraSystem_v1

**Current Code**:
```javascript
const particle = new THREE.Mesh(sphereGeom, material);
this.scene.add(particle);
```

**With Gate**:
```javascript
const particle = new THREE.Mesh(sphereGeom, material);

if (VisualLayerEnforcementGate.canAttach({
  nodeId: node.userData.index,
  nodeCategory: node.userData.category,
  layerType: 'AURA_LAYER',
  geometryType: 'SphereGeometry',
  opacity: material.opacity,
  sourceSystem: 'NodeAuraSystem_v1'
})) {
  this.scene.add(particle);
}
```

### UISelectedNodeHighlight3_2

**Current Code**:
```javascript
const ringMesh = new THREE.Mesh(geometry, material);
this.scene.add(ringMesh);
```

**With Gate**:
```javascript
const ringMesh = new THREE.Mesh(geometry, material);

if (VisualLayerEnforcementGate.canAttach({
  nodeId: node.userData.index,
  nodeCategory: node.userData.category,
  layerType: 'SELECTION_HIGHLIGHT',
  geometryType: 'IcosahedronGeometry',
  opacity: material.opacity,
  sourceSystem: 'UISelectedNodeHighlight3_2'
})) {
  this.scene.add(ringMesh);
}
```

---

## REQUEST OBJECT SPECIFICATION

### Required Fields

```javascript
{
  nodeId: string,              // Node identifier (index or UUID)
  nodeCategory: string,        // Node category (input, process, etc.)
  layerType: string,           // Visual layer (GLYPH_LAYER, AURA, etc.)
  geometryType: string,        // Geometry type (PlaneGeometry, etc.)
  opacity: number              // 0.0 to 1.0
}
```

### Optional Fields

```javascript
{
  sourceSystem: string,        // Which system is attaching (for audit)
  modifiesNodeSize: boolean,   // Does this change node size? (default: false)
  coversCore: boolean,         // Does this cover core geometry? (default: false)
  blendMode: string            // Blend mode if relevant (default: 'normal')
}
```

### Example Requests

**Example 1: Glyph Layer**
```javascript
{
  nodeId: 'node_42',
  nodeCategory: 'analytics',
  layerType: 'GLYPH_LAYER',
  geometryType: 'PlaneGeometry',
  opacity: 0.6,
  sourceSystem: 'GlyphLayer4_MultiFusion'
}
```

**Example 2: Aura Particle**
```javascript
{
  nodeId: 'node_42',
  nodeCategory: 'analytics',
  layerType: 'AURA_LAYER',
  geometryType: 'SphereGeometry',
  opacity: 0.4,
  sourceSystem: 'NodeAuraSystem_v1'
}
```

**Example 3: Selection Highlight**
```javascript
{
  nodeId: 'node_42',
  nodeCategory: 'analytics',
  layerType: 'SELECTION_HIGHLIGHT',
  geometryType: 'IcosahedronGeometry',
  opacity: 0.5,
  sourceSystem: 'UISelectedNodeHighlight3_2',
  coversCore: false
}
```

---

## ENFORCEMENT RULES (What Gets Blocked)

### Rule 1: No Filled Discs/Planes for State/Personality

**Blocks**:
```javascript
{
  layerType: 'PERSONALITY_STATE',
  geometryType: 'PlaneGeometry',
  opacity: 0.7
  // ❌ BLOCKED: Filled plane for personality
}
```

**Allows**:
```javascript
{
  layerType: 'GLYPH_LAYER',
  geometryType: 'PlaneGeometry',
  opacity: 0.5
  // ✓ ALLOWED: Glyph layer with plane at acceptable opacity
}
```

### Rule 2: Opacity Bounds Per Layer

**Blocks**:
```javascript
{
  layerType: 'AURA_LAYER',
  opacity: 0.8
  // ❌ BLOCKED: Aura max is 0.6, requested 0.8
}
```

**Allows**:
```javascript
{
  layerType: 'AURA_LAYER',
  opacity: 0.5
  // ✓ ALLOWED: Within bounds (≤ 0.6)
}
```

### Rule 3: Size Modification Blocked

**Blocks**:
```javascript
{
  layerType: 'CUSTOM_LAYER',
  modifiesNodeSize: true
  // ❌ BLOCKED: Layers cannot change node size
}
```

### Rule 4: Core Occlusion Blocked

**Blocks**:
```javascript
{
  layerType: 'STRESS_INDICATOR',
  opacity: 0.95,
  coversCore: true
  // ❌ BLOCKED: Would obscure core geometry
}
```

### Rule 5: Unknown Layer Blocked

**Blocks**:
```javascript
{
  layerType: 'UNKNOWN_LAYER',
  // ❌ BLOCKED: Layer not defined in hierarchy
}
```

### Rule 6: Invalid Category Blocked

**Blocks**:
```javascript
{
  nodeCategory: 'invalid-category',
  // ❌ BLOCKED: Category not in allowed list
}
```

---

## MODE BEHAVIORS

### DEV Mode (Development)

```javascript
visualLayerGate.setMode('DEV');

// Behavior:
// ✓ Violations are ALLOWED to render
// ⚠️ Violations log WARNING to console
// 📊 Statistics tracked for audit
```

**Use Case**: Development, testing new visuals, finding violations

**Console Output**:
```
⚠️ [Visual Gate] VIOLATION (DEV MODE - ALLOWED): FORBIDDEN_FILLED_GEOMETRY
{nodeId: "node_42", layer: "PERSONALITY_STATE", reason: "Cannot use PlaneGeometry for PERSONALITY_STATE"}
```

### STRICT Mode (Testing/QA)

```javascript
visualLayerGate.setMode('STRICT');

// Behavior:
// ❌ Violations are BLOCKED from rendering
// ❌ Violations log ERROR to console
// 📊 Statistics tracked for audit
```

**Use Case**: QA testing, finding violations before production

**Console Output**:
```
❌ [Visual Gate] BLOCKED: FORBIDDEN_FILLED_GEOMETRY
{nodeId: "node_42", layer: "PERSONALITY_STATE", reason: "Cannot use PlaneGeometry for PERSONALITY_STATE"}
```

### PROD Mode (Production)

```javascript
visualLayerGate.setMode('PROD');

// Behavior:
// ❌ Violations are BLOCKED from rendering
// 🤐 Violations logged silently (no console output)
// 📊 Statistics tracked (queryable via API only)
```

**Use Case**: Production builds

**Console Output**: (none)

---

## CONSOLE API REFERENCE

### Get Current Statistics

```javascript
visualLayerGate.getStats();

// Output:
{
  mode: 'DEV',
  enabled: true,
  totalCheckpoints: 234,
  approvalsGranted: 230,
  approvalsDenied: 4,
  denialRate: '1.71%',
  recentViolations: [...]
}
```

### Get Violation Log

```javascript
const violations = visualLayerGate.getViolationLog();
console.table(violations);
```

### Change Mode

```javascript
visualLayerGate.setMode('STRICT');
// ✓ Visual Gate mode changed to: STRICT (Block + warn)
```

### Generate Full Report

```javascript
visualLayerGate.generateReport();

// Outputs detailed report with:
// - Mode and enabled status
// - Statistics
// - Summary by violation type
// - Summary by node
// - Summary by layer
// - Recent violations table
```

### Clear Violation Log

```javascript
visualLayerGate.clearViolationLog();
```

### Register Custom Layer

```javascript
visualLayerGate.registerLayer('RITUAL_EMPHASIS', {
  priority: 3.5,
  maxOpacity: 0.8,
  allowedGeometry: ['Lines', 'Particles'],
  opacityBounds: { min: 0.0, max: 0.8 }
});
```

---

## INTEGRATION TIMELINE

### Phase 1: Setup (Day 1)
1. Import VisualLayerEnforcementGate.js
2. Initialize gate in main.js
3. Set up console API
4. Set mode to DEV
5. Test: `visualLayerGate.getStats()`

### Phase 2: Integration (Days 2-5)
1. Identify all visual attachment points (5-10 systems typically)
2. Add gate checks around each attachment
3. Test in DEV mode (violations allowed, logged)
4. Fix any violations found during test
5. Gradually move systems to STRICT mode

### Phase 3: Validation (Days 6-7)
1. Enable STRICT mode globally
2. Verify no violations block valid visuals
3. Adjust bounds if needed (via registerLayer)
4. Performance testing
5. Final QA pass

### Phase 4: Production (Day 8+)
1. Switch to PROD mode
2. Deploy with silent violation blocking
3. Monitor stats via console API
4. Keep DEV/STRICT modes available for debugging

---

## TROUBLESHOOTING

### Issue: Too Many Violations Blocked

**Cause**: Opacity bounds too strict, or legitimate visual blocked

**Solution**:
1. Check violation details: `visualLayerGate.getRecentViolations()`
2. Identify which system is affected
3. Adjust opacity in that system, OR
4. Register layer with looser bounds: `visualLayerGate.registerLayer()`
5. Re-test

### Issue: Gate Not Working (Violations Still Appearing)

**Cause**: Gate not integrated at all attachment points, or disabled

**Check**:
```javascript
visualLayerGate.isEnabled()  // Should be true
visualLayerGate.totalCheckpoints  // Should be > 0
```

**Solution**: Find missing attachment points, add gate checks

### Issue: Performance Degradation

**Cause**: Gate checks adding overhead (unlikely)

**Check**:
1. Gate check is very fast (< 0.1ms per call)
2. Likely issue is elsewhere
3. Disable gate to test: `visualLayerGate.disable()`
4. Re-enable if not the issue

### Issue: Custom Layer Not Registering

**Cause**: Wrong parameter format

**Check Format**:
```javascript
visualLayerGate.registerLayer('LAYER_NAME', {
  priority: number,
  maxOpacity: number (0-1),
  allowedGeometry: [array of strings],
  opacityBounds: { min: number, max: number }
});
```

---

## BEST PRACTICES

### 1. Always Provide sourceSystem

```javascript
// ✓ GOOD
canAttach({
  ...
  sourceSystem: 'GlyphLayer4_MultiFusion'
})

// ❌ POOR
canAttach({
  ...
  sourceSystem: 'UNKNOWN'
})
```

### 2. Clean Up Rejected Meshes

```javascript
if (!VisualLayerEnforcementGate.canAttach(request)) {
  mesh.geometry?.dispose();
  mesh.material?.dispose();
  // ✓ Prevents memory leaks
}
```

### 3. Check Mode Before Development

```javascript
// Start in DEV mode for development
visualLayerGate.setMode('DEV');

// Switch to STRICT for QA
visualLayerGate.setMode('STRICT');

// Use PROD for shipping
visualLayerGate.setMode('PROD');
```

### 4. Monitor Statistics Regularly

```javascript
// In your test suite or monitoring dashboard
setInterval(() => {
  const stats = visualLayerGate.getStats();
  if (stats.approvalsDenied > stats.approvalsGranted * 0.05) {
    console.warn('High violation rate detected!');
  }
}, 60000); // Every minute
```

### 5. Audit Before Deployment

```javascript
// Pre-deployment checklist
console.assert(visualLayerGate.getStats().approvalsDenied === 0, 
  'Violations must be resolved before deployment');
```

---

## SUMMARY

✅ Gate initialized in main.js  
✅ Gate checks inserted at all visual attachment points  
✅ Mode set appropriately (DEV→STRICT→PROD)  
✅ Systems tested for violations  
✅ Statistics monitored via console API  
✅ Custom layers registered as needed  
✅ Ready for production deployment  

**The Visual Layer Enforcement Gate is now guarding node visual integrity globally.**
