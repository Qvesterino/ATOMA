# VISUAL LOCK CONSOLE API — QUICK REFERENCE

Available immediately after game startup via `window.__visualLock`

## 🔍 DIAGNOSTIC COMMANDS

### 1. Find All Unregistered or Broken Nodes
```javascript
window.__visualLock.findUnregisteredNodes()
```

**What it does**:
- Scans all AI nodes
- Identifies missing visualRoot
- Finds property violations (opacity, frustumCulled, etc)
- Returns counts of healthy, broken, unregistered

**Output Example**:
```
✓ Healthy nodes: 30
✗ Broken nodes: 0
⚠ Unregistered nodes: 0

TOTAL HEALTH: 100%
```

**When to use**: After linking, after zooming far away, anytime nodes seem invisible

---

### 2. Inspect Specific Node's Visual State
```javascript
window.__visualLock.dumpNodeVisual(nodeId)
```

**Parameters**:
- `nodeId`: Either node ID (string) or UUID

**What it does**:
- Prints node metadata
- Shows visualRoot info and properties
- Lists all child objects
- Shows material settings
- Indicates any violations

**Output Example**:
```
Node ID: input-node-001
UUID: 12345-67890
Category: input
Archetype: CORE-HARMONIC-RESONANT
Has visualRoot: true

📊 VisualRoot Properties:
  Name: coreA
  Position: (0.50, 1.20, -2.45)
  Scale: (1.00, 1.00, 1.00)
  Visible: true
  FrustumCulled: false

🎨 Material:
    Type: MeshBasicMaterial
    Opacity: 1.0
    Transparent: true
    DepthTest: false
    DepthWrite: false

📦 Full Hierarchy:
  🎯 coreA [Mesh] opacity=1
    shell [Group]
      aura [Mesh] opacity=0.1
```

**When to use**: To debug a specific node that seems to have issues

---

### 3. Force Re-bind All Nodes
```javascript
window.__visualLock.forceRebindAll()
```

**What it does**:
- Scans every node
- Auto-discovers visualRoot if missing
- Re-registers with visual authority
- Enforces properties
- Reports success/failures

**Output Example**:
```
Fixed: 2
Failed: 0

TOTAL: 2 nodes rebound
```

**When to use**: If you suspect orphaned nodes exist, or after world transitions

---

### 4. Enable/Disable Continuous Monitoring
```javascript
window.__visualLock.enableMonitoring(true)   // Enable
window.__visualLock.enableMonitoring(false)  // Disable
```

**What it does**:
- If enabled: logs violations every 2 seconds (max)
- Only logs if violations detected
- Non-blocking

**Output Example** (when violations exist):
```
[VISUAL_VIOLATION] 2 nodes have visual issues
```

**When to use**: During testing to catch transient violations

---

## 📊 OPERATIONAL COMMANDS

### 5. Get Registration Statistics
```javascript
window.__visualLock.getStats()
```

**Returns**:
```javascript
{
  registered: 15,           // Nodes registered at spawn
  autodiscovered: 2,        // Nodes discovered at runtime
  failed: 0,               // Failed registrations
  total: 17               // Total processed
}
```

**When to use**: To track system performance and coverage

---

### 6. Manually Register a Node
```javascript
window.__visualLock.registerNode(nodeObject, 'legacy')
```

**Parameters**:
- `nodeObject`: THREE.Object3D node instance
- `nodeType`: 'legacy'|'enhanced'|'extreme'|'mythic'|'prime'

**Returns**: `true` if successful, `false` otherwise

**When to use**: For advanced debugging or manual node creation

---

### 7. Manually Autodiscover a Node
```javascript
window.__visualLock.autodiscover(nodeObject)
```

**Parameters**:
- `nodeObject`: THREE.Object3D node instance

**Returns**: `true` if discovered and registered, `false` otherwise

**When to use**: If a node has no visualRoot but should be fixed

---

## 🧪 TYPICAL DEBUGGING SESSION

```javascript
// 1. Check overall health
window.__visualLock.findUnregisteredNodes()

// 2. If any broken nodes found, get details
window.__visualLock.dumpNodeVisual('node-uuid-from-output')

// 3. Try to fix
window.__visualLock.forceRebindAll()

// 4. Verify fix
window.__visualLock.findUnregisteredNodes()

// 5. Check stats
window.__visualLock.getStats()
```

---

## 💊 COMMON ISSUES & SOLUTIONS

### Issue: "1 Broken node" reported

**Solution**:
```javascript
window.__visualLock.forceRebindAll()
window.__visualLock.findUnregisteredNodes()  // Verify fix
```

### Issue: Node disappears after linking

**Troubleshoot**:
```javascript
window.__visualLock.dumpNodeVisual('node-id')
// Look for violations like:
//   visible=false
//   opacity=0
//   frustumCulled=true
```

### Issue: Shell culled when far away

**Check**:
```javascript
window.__visualLock.dumpNodeVisual('node-id')
// Should see: frustumCulled=false
```

### Issue: Multiple orphaned nodes

**Fix**:
```javascript
window.__visualLock.forceRebindAll()
// Wait 5 seconds (auto-discovery runs every 5s)
window.__visualLock.getStats()  // Should show autodiscovered count
```

---

## 📈 MONITORING BEST PRACTICES

**Development/Testing**:
```javascript
// Enable detailed monitoring
window.__visualLock.enableMonitoring(true)

// Check every 30 seconds
setInterval(() => window.__visualLock.findUnregisteredNodes(), 30000)
```

**Before Linking Test**:
```javascript
// Baseline
const before = window.__visualLock.findUnregisteredNodes()

// Link nodes...

// After linking
const after = window.__visualLock.findUnregisteredNodes()
```

**Production Validation**:
```javascript
// One-time check at startup
window.__visualLock.findUnregisteredNodes()

// If 100%, you're good
// If not, call: window.__visualLock.forceRebindAll()
```

---

## 🔧 TECHNICAL DETAILS

### Auto-Discovery Strategy (in order of attempt)
1. By node type hints (EXTREME, Enhanced, Mythic)
2. By naming convention (core, sphere, nucleus)
3. By material properties (emissive glow)
4. By size (largest mesh)
5. First mesh found (fallback)

### Properties Enforced
- `visible = true`
- `frustumCulled = false`
- `material.opacity = 1.0`
- `material.depthTest = false`
- `material.depthWrite = false`
- `renderOrder = 0` (for core)

### Runtime Repair Frequency
- **Spawn-time**: Immediate registration
- **Runtime scan**: Every 5 seconds
- **Per-frame monitor**: Every 60th frame (report only, no enforcement)

---

## ✅ SUCCESS INDICATORS

All of these should be true:

```javascript
// Should return empty arrays
window.__visualLock.findUnregisteredNodes().unregistered.length === 0
window.__visualLock.findUnregisteredNodes().broken.length === 0

// Should show positive registered count
window.__visualLock.getStats().registered > 0

// Should show 0 failed
window.__visualLock.getStats().failed === 0
```

---

**Remember**: These commands are always available after game startup. Use them frequently during development to ensure 100% node visibility guarantee.
