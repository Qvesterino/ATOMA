# NODE AUDIT SYSTEM - QUICK REFERENCE CARD

## 🎯 API CHEAT SHEET

### Basic Audits
```javascript
// Full audit with everything
aiNodes.auditVisualIntegrity().printReport();

// Quick summary only
aiNodes.quickAudit();

// Single node
aiNodes.auditNode(node);

// Entire category
aiNodes.auditCategory('extreme');
```

### Auto-Repair
```javascript
const result = aiNodes.auditVisualIntegrity();
aiNodes.fixAnomalies(result.report.detailedIssues);
```

### Export Data
```javascript
const result = aiNodes.auditVisualIntegrity();
console.log(result.exportJSON());
console.log(result.exportCSV());
```

### Detailed Analysis
```javascript
const result = aiNodes.auditVisualIntegrity();
console.log(result.summary);      // Severity breakdown
console.log(result.byType);       // Issues by type
console.log(result.bySeverity);   // Issues by severity
```

---

## 📊 ISSUE TYPES QUICK LOOKUP

### CRITICAL (Fix Immediately)
```
MISSING_NODE_ROOT
MISSING_CORE_MESH
MISSING_HOLOGRAM_SHELL
INVALID_NODE_ROOT_TYPE
CORE_MESH_NO_GEOMETRY
CORE_MESH_NO_MATERIAL
HOLOGRAM_SHELL_NO_GEOMETRY
HOLOGRAM_SHELL_NO_MATERIAL
HOLOGRAM_SHELL_WRONG_MATERIAL_TYPE
```

### HIGH (Fix Soon)
```
HOLOGRAM_SHELL_FRUSTUM_CULL_ENABLED
HOLOGRAM_SHELL_WRONG_RENDER_ORDER
EXTREME_NODE_MISSING_HOLOGRAM
QUANTUM_NODE_MISSING_HOLOGRAM
```

### MEDIUM (Fix During Maintenance)
```
CORE_MESH_FRUSTUM_CULL_ENABLED
CORE_MESH_WRONG_RENDER_ORDER
AURA_WRONG_RENDER_ORDER
HOLOGRAM_MATERIAL_DEPTH_TEST_ENABLED
HOLOGRAM_MATERIAL_DEPTH_WRITE_ENABLED
HOLOGRAM_MATERIAL_NOT_TRANSPARENT
HOLOGRAM_MATERIAL_WRONG_SIDE
HOLOGRAM_MATERIAL_WRONG_BLENDING
```

### LOW (Optional)
```
CORE_MESH_MISSING_VISUAL_LAYER
HOLOGRAM_SHELL_MISSING_VISUAL_LAYER
LINK_MESHES_MISSING
AURA_NO_MATERIAL
UNMARKED_NODE_ROOT
```

---

## 🔧 QUICK FIXES

### Fix Frustum Culling
```javascript
const result = aiNodes.auditVisualIntegrity();
const frustumIssues = result.report.detailedIssues.filter(i =>
  i.type.includes('FRUSTUM_CULL')
);
aiNodes.fixAnomalies(frustumIssues);
```

### Fix Render Order
```javascript
const result = aiNodes.auditVisualIntegrity();
const orderIssues = result.report.detailedIssues.filter(i =>
  i.type.includes('WRONG_RENDER_ORDER')
);
aiNodes.fixAnomalies(orderIssues);
```

### Fix Missing Holograms
```javascript
const result = aiNodes.auditVisualIntegrity();
const holoIssues = result.report.detailedIssues.filter(i =>
  i.type.includes('MISSING_HOLOGRAM')
);
aiNodes.fixAnomalies(holoIssues);
```

### Fix All (Supported)
```javascript
const result = aiNodes.auditVisualIntegrity();
aiNodes.fixAnomalies(result.report.detailedIssues);
```

---

## 📈 COMMON SCENARIOS

### Scenario 1: Node Not Visible
```javascript
// Check if it's a visual issue
const audit = aiNodes.auditNode(node);
if (!audit.isHealthy) {
  console.error('Visual anomalies:', audit.issues);
  // Fix or investigate
}
```

### Scenario 2: All EXTREME Nodes Look Wrong
```javascript
// Check category health
const audit = aiNodes.auditCategory('extreme');
if (audit.anomalous > 0) {
  console.error('EXTREME issues:', audit.issues);
  aiNodes.fixAnomalies(audit.issues);
}
```

### Scenario 3: Post-Update Verification
```javascript
const before = aiNodes.quickAudit();
console.log(`Before: ${before.anomalies} anomalies`);

// [make code changes]

const after = aiNodes.quickAudit();
console.log(`After: ${after.anomalies} anomalies`);

if (after.anomalies > before.anomalies) {
  console.error('Update degraded visual quality!');
}
```

### Scenario 4: Continuous Monitoring
```javascript
setInterval(() => {
  const summary = aiNodes.quickAudit();
  if (summary.anomalies > 0) {
    console.warn(`⚠️ ${summary.anomalies} visual issues detected`);
    // Could auto-fix or notify player
  }
}, 5000);
```

### Scenario 5: Debug Report Export
```javascript
const result = aiNodes.auditVisualIntegrity();

// Share with team
const json = result.exportJSON();
localStorage.setItem('audit_report', json);

// Analyze in spreadsheet
const csv = result.exportCSV();
console.log(csv);
```

---

## 🎨 CHECK CATEGORIES

```
✓ Check 1: Node Root Container
  └─ Validates nodeRoot exists and is marked

✓ Check 2: Core Mesh
  └─ Checks identity mesh configuration

✓ Check 3: Hologram Shell
  └─ Verifies shell presence and integrity

✓ Check 4: Render Order
  └─ Validates hierarchy (0, 5, 10)

✓ Check 5: Material Properties
  └─ Checks locked shader settings

✓ Check 6: Frustum Culling
  └─ Ensures culling is disabled

✓ Check 7: Visual Layer Markers
  └─ Validates identification tags

✓ Check 8: Aura System
  └─ Checks aura configuration

✓ Check 9: Link System
  └─ Verifies link visualization

✓ Check 10: Category-Specific
  └─ EXTREME/QUANTUM/Input checks
```

---

## 📋 TYPICAL WORKFLOW

```javascript
// 1. Run audit
const audit = aiNodes.auditVisualIntegrity();

// 2. Check results
if (audit.report.anomaliesFound > 0) {
  // 3. Analyze severity
  console.log('Critical:', audit.summary.CRITICAL);
  console.log('High:', audit.summary.HIGH);
  
  // 4. Fix automatically (if possible)
  const fixResults = aiNodes.fixAnomalies(
    audit.report.detailedIssues
  );
  console.log(`Fixed: ${fixResults.fixed}/${fixResults.attempted}`);
  
  // 5. Report results
  audit.printReport();
  
  // 6. Export for analysis
  const json = audit.exportJSON();
}
```

---

## ⚡ PERFORMANCE TIPS

### Don't Audit Too Frequently
```javascript
// BAD: Every frame
update() {
  aiNodes.auditVisualIntegrity();  // ❌ Expensive
}

// GOOD: Occasionally
setInterval(() => {
  aiNodes.quickAudit();  // ✅ Cheap
}, 5000);
```

### Use quickAudit for Monitoring
```javascript
// GOOD: O(n) but minimal overhead
const summary = aiNodes.quickAudit();

// BAD: O(n) with full details
const full = aiNodes.auditVisualIntegrity();
```

### Batch Fixes Together
```javascript
// GOOD: One call
const result = aiNodes.auditVisualIntegrity();
aiNodes.fixAnomalies(result.report.detailedIssues);

// Inefficient: Multiple calls
aiNodes.fixAnomalies([issue1]);
aiNodes.fixAnomalies([issue2]);
aiNodes.fixAnomalies([issue3]);
```

---

## 🎯 RETURN VALUE REFERENCE

### auditVisualIntegrity()
```javascript
{
  report: { ...full report... },
  summary: { CRITICAL, HIGH, MEDIUM, LOW },
  byType: { TYPE: [...] },
  bySeverity: { LEVEL: [...] },
  printReport: Function,
  exportJSON: Function,
  exportCSV: Function
}
```

### quickAudit()
```javascript
{
  total: number,
  anomalies: number,
  summary: { CRITICAL, HIGH, MEDIUM, LOW },
  healthy: number
}
```

### auditNode(node)
```javascript
{
  nodeId: string,
  category: string,
  issues: [...],
  isHealthy: boolean
}
```

### auditCategory(category)
```javascript
{
  category: string,
  total: number,
  healthy: number,
  anomalous: number,
  issues: [...],
  stats: { ... }
}
```

### fixAnomalies(issues)
```javascript
{
  attempted: number,
  fixed: number,
  failed: number,
  details: [
    { issue: string, result: string }
  ]
}
```

---

## 🚀 PRODUCTION DEPLOYMENT

### Pre-Launch
```javascript
// 1. Run full audit
const audit = aiNodes.auditVisualIntegrity();

// 2. Check for critical issues
if (audit.summary.CRITICAL > 0) {
  throw new Error('Critical visual issues detected');
}

// 3. Log summary
console.log(`Node health: ${audit.report.totalNodesAudited - audit.report.anomaliesFound}/${audit.report.totalNodesAudited}`);
```

### Runtime Monitoring
```javascript
// Quick health check every 10 seconds
setInterval(() => {
  const summary = aiNodes.quickAudit();
  if (summary.anomalies > 5) {
    // Alert or auto-fix
    const full = aiNodes.auditVisualIntegrity();
    aiNodes.fixAnomalies(full.report.detailedIssues);
  }
}, 10000);
```

### Error Reporting
```javascript
// When player reports visual issue
function handlePlayerReport(nodeId) {
  const audit = aiNodes.auditNode(
    aiNodes.nodes.find(n => n.userData.nodeId === nodeId)
  );
  
  if (!audit.isHealthy) {
    // Report issue to dev team
    reportToTeam({
      nodeId,
      category: audit.category,
      issues: audit.issues
    });
  }
}
```

---

## 📞 NEED HELP?

- **Full Audit Report**? → `auditVisualIntegrity().printReport()`
- **Quick Check**? → `quickAudit()`
- **Single Node Issue**? → `auditNode(node)`
- **Category Problem**? → `auditCategory('extreme')`
- **Auto-Fix Issues**? → `fixAnomalies(issues)`
- **Export Data**? → `exportJSON()` or `exportCSV()`

---

**Status: PRODUCTION READY ✅**
