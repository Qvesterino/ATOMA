# NODE CATEGORY AUDIT SYSTEM - USER GUIDE
## Comprehensive Visual Anomaly Detection

---

## 🎯 QUICK START

### Run Full Audit
```javascript
// In console or game code:
const auditResult = aiNodes.auditVisualIntegrity();
auditResult.printReport(); // Print to console
```

### Quick Summary
```javascript
const summary = aiNodes.quickAudit();
console.log(`Total: ${summary.total}, Anomalies: ${summary.anomalies}, Healthy: ${summary.healthy}`);
```

### Audit Specific Node
```javascript
const nodeAudit = aiNodes.auditNode(myNode);
console.log(`Node is ${nodeAudit.isHealthy ? 'healthy' : 'anomalous'}`);
console.log(nodeAudit.issues);
```

### Audit Specific Category
```javascript
const categoryAudit = aiNodes.auditCategory('extreme');
console.log(`${categoryAudit.healthy} of ${categoryAudit.total} nodes healthy`);
```

---

## 📊 AUDIT REPORT STRUCTURE

### Full Report Object
```javascript
{
  report: {
    timestamp: "2024-01-15T10:30:45.123Z",
    totalNodesAudited: 42,
    anomaliesFound: 3,
    anomaliesByCategory: {
      "extreme": [
        {
          nodeId: "node_123",
          issues: [ {...}, {...} ]
        }
      ]
    },
    detailedIssues: [ {...}, {...}, {...} ],
    categoryStats: {
      "extreme": {
        total: 15,
        healthy: 14,
        anomalous: 1,
        issues: [ {...} ]
      },
      "input": {
        total: 27,
        healthy: 27,
        anomalous: 0,
        issues: []
      }
    }
  },
  summary: {
    CRITICAL: 0,
    HIGH: 2,
    MEDIUM: 1,
    LOW: 0
  },
  byType: {
    "HOLOGRAM_SHELL_FRUSTUM_CULL_ENABLED": [ {...}, {...} ],
    "MISSING_HOLOGRAM_SHELL": [ {...} ]
  },
  bySeverity: {
    CRITICAL: [],
    HIGH: [ {...}, {...} ],
    MEDIUM: [ {...} ],
    LOW: []
  }
}
```

---

## 🔍 AUDIT CHECKS (10 CATEGORIES)

### Check 1: Node Root Container
**Verifies**: Stable nodeRoot exists and is properly marked

**Issues Detected**:
- `MISSING_NODE_ROOT` — nodeRoot not found
- `INVALID_NODE_ROOT_TYPE` — nodeRoot is not a THREE.Group
- `UNMARKED_NODE_ROOT` — nodeRoot.userData.isNodeRoot not set

**Why It Matters**: nodeRoot is the single source of truth for all visual systems

---

### Check 2: Core Mesh Integrity
**Verifies**: Core identity mesh exists and is properly configured

**Issues Detected**:
- `MISSING_CORE_MESH` — Core mesh not found in nodeRoot
- `CORE_MESH_NO_GEOMETRY` — Core mesh has no geometry
- `CORE_MESH_NO_MATERIAL` — Core mesh has no material
- `CORE_MESH_FRUSTUM_CULL_ENABLED` — Frustum culling enabled (should be disabled)

**Why It Matters**: Core mesh is the node's identity representation

---

### Check 3: Hologram Shell Integrity
**Verifies**: Hologram shell exists with stable geometry

**Issues Detected**:
- `MISSING_HOLOGRAM_SHELL` — Hologram shell not found
- `HOLOGRAM_SHELL_NO_GEOMETRY` — Shell has no geometry
- `HOLOGRAM_SHELL_NO_MATERIAL` — Shell has no material
- `HOLOGRAM_SHELL_WRONG_MATERIAL_TYPE` — Material is not ShaderMaterial

**Why It Matters**: Hologram shell provides visual identity layer

---

### Check 4: Render Order Hierarchy
**Verifies**: Correct render order (core=0, shell=5, aura=10)

**Issues Detected**:
- `CORE_MESH_WRONG_RENDER_ORDER` — Core renderOrder ≠ 0
- `HOLOGRAM_SHELL_WRONG_RENDER_ORDER` — Shell renderOrder ≠ 5
- `AURA_WRONG_RENDER_ORDER` — Aura renderOrder ≠ 10

**Why It Matters**: Render order ensures visual layering

---

### Check 5: Material Properties
**Verifies**: Hologram shell material has locked properties

**Issues Detected**:
- `HOLOGRAM_MATERIAL_DEPTH_TEST_ENABLED` — depthTest should be false
- `HOLOGRAM_MATERIAL_DEPTH_WRITE_ENABLED` — depthWrite should be false
- `HOLOGRAM_MATERIAL_NOT_TRANSPARENT` — transparent should be true
- `HOLOGRAM_MATERIAL_WRONG_SIDE` — side should be DoubleSide
- `HOLOGRAM_MATERIAL_WRONG_BLENDING` — blending should be AdditiveBlending

**Why It Matters**: These properties are locked to ensure consistent hologram appearance

---

### Check 6: Frustum Culling
**Verifies**: Frustum culling disabled on core and shell

**Issues Detected**:
- `CORE_MESH_FRUSTUM_CULL_ENABLED` — Core frustum culling enabled
- `HOLOGRAM_SHELL_FRUSTUM_CULL_ENABLED` — Shell frustum culling enabled

**Why It Matters**: Prevents nodes from disappearing at screen edges

---

### Check 7: Visual Layer Markers
**Verifies**: Meshes marked with correct visual layer identifiers

**Issues Detected**:
- `CORE_MESH_MISSING_VISUAL_LAYER` — Core visualLayer ≠ "CORE"
- `HOLOGRAM_SHELL_MISSING_VISUAL_LAYER` — Shell visualLayer ≠ "CORE_SHELL"

**Why It Matters**: Markers help systems identify mesh types

---

### Check 8: Aura System
**Verifies**: Aura mesh (if present) is properly configured

**Issues Detected**:
- `AURA_NO_MATERIAL` — Aura has no material
- `AURA_WRONG_RENDER_ORDER` — Aura renderOrder ≠ 10

**Why It Matters**: Aura provides visual effect layer

---

### Check 9: Link System
**Verifies**: Link visualization exists when nodes are linked

**Issues Detected**:
- `LINK_MESHES_MISSING` — Node has linked nodes but no link meshes

**Why It Matters**: Links should be visually represented

---

### Check 10: Category-Specific
**Verifies**: Category-specific requirements

**Issues Detected**:
- `EXTREME_NODE_MISSING_HOLOGRAM` — EXTREME node missing hologram shell
- `QUANTUM_NODE_MISSING_HOLOGRAM` — QUANTUM node missing hologram shell

**Why It Matters**: All node types must have holograms regardless of complexity

---

## 🎨 SEVERITY LEVELS

### CRITICAL
**Impact**: Node visual system broken, immediate display issues

**Examples**:
- Missing core mesh
- Missing hologram shell
- Missing nodeRoot container

**Action**: Fix immediately

---

### HIGH
**Impact**: Visual inconsistency or potential issues

**Examples**:
- Hologram shell frustum culling enabled
- Hologram shell render order wrong
- Wrong material type on hologram

**Action**: Fix soon

---

### MEDIUM
**Impact**: Potential visual degradation under certain conditions

**Examples**:
- Core mesh frustum culling enabled
- Aura render order wrong
- Hologram material properties wrong

**Action**: Fix during maintenance

---

### LOW
**Impact**: Minor consistency issues

**Examples**:
- Link meshes missing (cosmetic)
- Visual layer marker missing (identification only)

**Action**: Fix when convenient

---

## 🛠️ AUTO-REPAIR SYSTEM

### Fix Issues Automatically
```javascript
const auditResult = aiNodes.auditVisualIntegrity();
const fixResults = aiNodes.fixAnomalies(auditResult.report.detailedIssues);

console.log(`Fixed: ${fixResults.fixed}/${fixResults.attempted}`);
fixResults.details.forEach(detail => {
  console.log(`${detail.issue}: ${detail.result}`);
});
```

### Supported Auto-Fixes
- ✅ Enable/disable frustum culling
- ✅ Fix render order values
- ✅ Re-create missing hologram shells

### Manual Fixes
Some issues require manual intervention:
- ❌ Missing nodeRoot (re-create node)
- ❌ Missing core mesh (re-create node)
- ❌ Material property violations (use reassertNodeHologramShell)

---

## 📈 REPORTING & EXPORT

### Print Human-Readable Report
```javascript
const auditResult = aiNodes.auditVisualIntegrity();
auditResult.printReport();
```

### Export as JSON
```javascript
const json = auditResult.exportJSON();
localStorage.setItem('audit_report', json);
```

### Export as CSV
```javascript
const csv = auditResult.exportCSV();
// Can import into Excel/Sheets for analysis
```

### Get Issues by Severity
```javascript
const {bySeverity} = aiNodes.auditVisualIntegrity();
console.log(`Critical issues: ${bySeverity.CRITICAL.length}`);
console.log(`High priority: ${bySeverity.HIGH.length}`);
```

### Get Issues by Type
```javascript
const {byType} = aiNodes.auditVisualIntegrity();
console.log(byType.MISSING_HOLOGRAM_SHELL); // All occurrences
```

---

## 🔬 USE CASES

### Case 1: Verify Game Launch
```javascript
// On game start
const summary = aiNodes.quickAudit();
if (summary.anomalies > 0) {
  console.warn(`⚠️ ${summary.anomalies} visual issues detected`);
  // Auto-fix or notify player
}
```

### Case 2: Debug Visual Glitches
```javascript
// Player reports node disappearing
const nodeAudit = aiNodes.auditNode(problematicNode);
if (!nodeAudit.isHealthy) {
  console.error('Issues:', nodeAudit.issues);
  // Apply fixes
}
```

### Case 3: Category Health Check
```javascript
// Monitor EXTREME nodes specifically
const extremeAudit = aiNodes.auditCategory('extreme');
console.log(`EXTREME nodes: ${extremeAudit.anomalous}/${extremeAudit.total} anomalous`);
```

### Case 4: Performance Analysis
```javascript
// Check health of all nodes
const fullAudit = aiNodes.auditVisualIntegrity();
const stats = fullAudit.report.categoryStats;
Object.entries(stats).forEach(([cat, data]) => {
  console.log(`${cat}: ${data.healthy}/${data.total} healthy`);
});
```

### Case 5: Post-Update Verification
```javascript
// After code changes, verify nothing broke
const before = aiNodes.quickAudit();
// [make changes]
const after = aiNodes.quickAudit();

if (after.anomalies > before.anomalies) {
  console.error('Changes introduced anomalies!');
  // Rollback or investigate
}
```

---

## 📋 INTEGRATION WITH MONITORING

### Continuous Monitoring (Optional)
```javascript
// Run audit periodically during gameplay
setInterval(() => {
  const summary = aiNodes.quickAudit();
  if (summary.anomalies > 0) {
    console.warn(`Visual anomalies detected: ${summary.anomalies}`);
  }
}, 5000); // Every 5 seconds
```

### Error Notification
```javascript
function checkNodeHealth(node) {
  const audit = aiNodes.auditNode(node);
  if (!audit.isHealthy) {
    // Notify game systems
    gameEventBus.emit('node_anomaly_detected', {
      nodeId: audit.nodeId,
      issues: audit.issues
    });
  }
}
```

### Performance Profiling
```javascript
const start = performance.now();
const audit = aiNodes.auditVisualIntegrity();
const elapsed = performance.now() - start;
console.log(`Audit completed in ${elapsed}ms`);
```

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue: "MISSING_HOLOGRAM_SHELL"
**Cause**: Hologram shell not created or removed

**Solution**:
```javascript
// Auto-repair
aiNodes.fixAnomalies([{
  nodeId: node.userData.nodeId,
  type: 'MISSING_HOLOGRAM_SHELL'
}]);
```

---

### Issue: "HOLOGRAM_SHELL_FRUSTUM_CULL_ENABLED"
**Cause**: Hologram shell visible only from certain angles

**Solution**:
```javascript
// Auto-repair (fixes most cases)
const auditResult = aiNodes.auditVisualIntegrity();
const issues = auditResult.report.detailedIssues.filter(i =>
  i.type === 'HOLOGRAM_SHELL_FRUSTUM_CULL_ENABLED'
);
aiNodes.fixAnomalies(issues);
```

---

### Issue: "HOLOGRAM_SHELL_WRONG_RENDER_ORDER"
**Cause**: Hologram renders behind core or aura

**Solution**:
```javascript
// Auto-repair
aiNodes.fixAnomalies([{
  type: 'HOLOGRAM_SHELL_WRONG_RENDER_ORDER',
  nodeId: node.userData.nodeId
}]);
```

---

### Issue: "MISSING_NODE_ROOT"
**Cause**: Node created without stable nodeRoot container

**Solution**: Re-create the node (cannot be fixed with auto-repair)

---

## 📊 SAMPLE AUDIT REPORT

```
================================================================================
NODE CATEGORY AUDIT REPORT
Timestamp: 2024-01-15T10:30:45.123Z
================================================================================

SUMMARY:
  Total Nodes Audited: 42
  Anomalies Found: 3
  Categories Scanned: 6

CATEGORY BREAKDOWN:

  EXTREME:
    Total: 15
    Healthy: 14
    Anomalous: 1
    Issues:
      - [HIGH] HOLOGRAM_SHELL_FRUSTUM_CULL_ENABLED: Shell frustum culling should be disabled
      - [MEDIUM] AURA_WRONG_RENDER_ORDER: Aura renderOrder should be 10


  INPUT:
    Total: 12
    Healthy: 12
    Anomalous: 0


  PROCESS:
    Total: 15
    Healthy: 15
    Anomalous: 0


DETAILED ANOMALIES:

  [1] Node: node_extreme_023 (extreme)
      Type: HOLOGRAM_SHELL_FRUSTUM_CULL_ENABLED
      Severity: HIGH
      Description: Hologram shell frustum culling should be disabled
      Suggestion: Set holoShell.frustumCulled = false

================================================================================
```

---

## ✅ PRODUCTION CHECKLIST

- ✅ Audit system detects all visual anomalies
- ✅ Auto-repair fixes common issues
- ✅ Reports exportable for analysis
- ✅ Category-specific audits available
- ✅ Integration with AINodes class
- ✅ Performance: O(n) complexity on node count
- ✅ 10 comprehensive check categories
- ✅ Severity-based prioritization
- ✅ Continuous monitoring ready

**Status: PRODUCTION READY**
