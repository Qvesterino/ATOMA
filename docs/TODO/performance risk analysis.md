# PERFORMANCE RISK ANALYSIS REPORT - ATOMA

## CRITICAL BOTTLENECKS

### 1. **Per-Frame Object Allocations (HIGH RISK)**
**Location:** Multiple files, especially `CascadeParticleSystem_Session120.js`

**Issues:**
- `new THREE.Vector3()`, `new THREE.Color()`, `new THREE.Quaternion()` called frequently in update loops
- Example in `AINodes.js`: Multiple `new THREE.Vector3()` calls in spawn functions
- `CascadeParticleSystem_Session120.js`: Creates temp vectors repeatedly in `_updateParticles()`

**Impact:**
- Garbage collection pressure
- Memory fragmentation
- Frame stuttering during GC cycles

**Fix:**
- Reuse temp vectors as class properties
- Use object pools for frequently allocated objects

---

### 2. **Particle System Inefficiency (HIGH RISK)**
**Location:** `CascadeParticleSystem_Session120.js`

**Issues:**
- Linear pool search: `_allocateParticle()` scans entire pool (3000 particles)
- Updates ALL particle buffers every frame regardless of active count
- `setDrawRange(0, maxParticles)` renders inactive particles (positioned at 99999)
- Multiple Map/Set operations per frame (`_linkSpawnState`, `_linkHopCooldowns`)

**Impact:**
- O(n) allocation search every spawn
- Unnecessary buffer uploads
- Wasted vertex processing for invisible particles

**Fix:**
- Maintain free-index stack for O(1) allocation
- Only upload active particle data
- Use proper draw range for active particles only

---

### 3. **Event System Overhead (MEDIUM RISK)**
**Location:** `constitution v2/zaloha/30.3/main.js`, multiple subsystems

**Issues:**
- High-frequency events: `cascade.start`, `cascade.hop`, `node.selection`, `camera.motion`
- Multiple event emitters for similar semantics
- No event throttling or batching
- Events emitted every frame during cascade (up to 60Hz)

**Impact:**
- CPU overhead from event dispatch
- Listener execution stack growth
- Unnecessary work for idle systems

**Fix:**
- Implement event throttling (emit only on state change)
- Batch events where possible
- Remove redundant event paths

---

### 4. **Metrics Calculation Frequency (MEDIUM RISK)**
**Location:** `CoreMetricsCalculator.js`

**Issues:**
- Iterates ALL nodes and links every 0.5 seconds
- `forEach` loops over large arrays
- Multiple metric aggregations per calculation
- No early exit if data unchanged

**Impact:**
- O(n) complexity where n = node count
- CPU spikes every 500ms
- Redundant calculations when network is stable

**Fix:**
- Implement dirty flag system
- Only recalculate changed nodes/links
- Cache intermediate results

---

### 5. **Material and Shader Duplication (MEDIUM RISK)**
**Location:** Multiple node variant files

**Issues:**
- `material.clone()` called frequently in node creation
- Multiple shader instances for same effect
- No material sharing across similar nodes
- Uniform updates on many materials

**Impact:**
- Memory usage bloat
- Shader compilation overhead
- Slower uniform updates

**Fix:**
- Share materials where possible
- Use instanced meshes for repeated geometries
- Reduce material count per archetype

---

### 6. **Geometry Creation Overhead (MEDIUM RISK)**
**Location:** `AINodeModel.js`, variant files

**Issues:**
- `new THREE.TorusGeometry`, `new THREE.SphereGeometry`, etc. for every node
- High segment counts (32, 64) on small objects
- No geometry reuse
- `BufferGeometry` attributes not optimized

**Impact:**
- Memory usage proportional to node count
- Slow node creation
- GPU vertex buffer pressure

**Fix:**
- Create shared geometry cache per archetype
- Reduce segment counts where visual difference is minimal
- Use primitive geometry where appropriate

---

## SUBOPTIMAL PATTERNS

### 7. **Raycasting Without Spatial Index (LOW-MEDIUM RISK)**
**Location:** `AINodes.js`, collision detection

**Issues:**
- Raycast against all nodes for collision
- No octree or spatial partitioning
- O(n) per raycast

**Impact:**
- Slow selection at high node counts (>100)

**Fix:**
- Implement octree or BVH
- Cache raycast results
- Use distance-based culling first

---

### 8. **Unnecessary Console Logging (LOW RISK)**
**Location:** `CascadeParticleSystem_Session120.js`, debug systems

**Issues:**
- Conditional console.warn/log in hot paths
- Debug logging in production builds
- String concatenation for logs

**Impact:**
- Minor CPU overhead
- Can accumulate in dev mode

**Fix:**
- Remove all production logging
- Use build-time flag stripping

---

### 9. **FrameScheduler Inefficiency (LOW RISK)**
**Location:** `FrameScheduler.js`

**Issues:**
- Linear scan of all registered functions per layer
- No prioritization within layers
- While loop for accumulator can execute multiple times

**Impact:**
- O(m) per frame where m = registered functions
- Potential for multi-tick in one frame if lag occurs

**Fix:**
- Already mitigated by layer separation
- Consider priority queue for critical systems
- Add frame budget limiting

---

## MEMORY LEAK RISKS

### 10. **Event Listener Leaks (LOW-MEDIUM RISK)**
**Location:** `CascadeParticleSystem_Session120.js`, UI systems

**Issues:**
- Event subscriptions not always cleaned up
- Link lifecycle callbacks accumulate
- No automatic cleanup on system disposal

**Impact:**
- Memory growth over time
- Dangling references prevent GC

**Fix:**
- Ensure all `addEventListener` has matching `removeEventListener`
- Implement disposal hooks
- Weak references for optional callbacks

---

## RECOMMENDED OPTIMIZATION PRIORITY

### IMMEDIATE (Critical Performance)
1. Fix particle pool allocation (use free stack)
2. Eliminate per-frame `new THREE.Vector3()` allocations
3. Reduce active particle buffer updates

### SHORT TERM (Noticeable Improvement)
4. Implement dirty flag for metrics calculation
5. Share materials across similar nodes
6. Throttle high-frequency events

### MEDIUM TERM (Scalability)
7. Spatial indexing for raycasting
8. Geometry caching system
9. Event system consolidation

### LONG TERM (Architecture)
10. Consider instanced rendering for repetitive node elements
11. Implement LOD for node visual detail
12. Profile and optimize shader complexity

---

## POSITIVE FINDINGS

✅ **FrameScheduler** - Well-designed frequency separation (60/30/10/2 Hz)
✅ **CoreMetricsCalculator** - Runs at low frequency (0.5s interval)
✅ **CascadeParticleSystem** - Uses object pool (with room for optimization)
✅ **Shader-driven visuals** - GPU-first approach in many systems
✅ **No explicit leaks found** - System appears to manage resources responsibly

---

## ESTIMATED PERFORMANCE GAINS

- Fixing particle allocation: **30-50%** particle system performance
- Reducing per-frame allocations: **10-20%** frame time reduction
- Metrics dirty flag: **50-70%** metrics calculation reduction
- Material sharing: **20-40%** memory reduction
- Event throttling: **5-15%** CPU reduction during high activity

Overall estimated improvement: **40-60%** better frame stability and reduced input latency at scale.