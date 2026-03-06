**Aura Renderer Identification (focused files only)**

**REAL aura renderer (moving node aura)**
- File: `NodeLinkedAuraSystem.js`
- Creation function: `createAura(node)` → `createTornAuraGeometry()` + `new THREE.Mesh(geometry, material)`
- Scene attachment: `this.scene.add(mesh)` and `mesh.add(orbit.mesh)` (orbit from NodeSegmentedOrbitRings)
- Update function: `update(deltaTime, nodes)` → `updateAura()` + `applyFlameMotion()` + `orbit.update()`
- Runtime active: **Yes**. Instantiated in `main.js` (`this.nodeAuraSystem = new NodeLinkedAuraSystem(...)`) and updated via `frameScheduler.register('visual', runNodeAuraSystemTick)`.

**Orbit ring mesh (child of aura)**
- File: `shaders/NodeSegmentedOrbitRings.js`
- Creation function: constructor → `new THREE.InstancedMesh(...)`
- Scene attachment: **Not directly**; added as child in `NodeLinkedAuraSystem.createAura()` via `mesh.add(orbit.mesh)`
- Update function: `update()` (shader uniform time)

**Harmonic hub resonance fields (not per-node aura)**
- File: `HarmonicHubAuraSystem_Session126.js`
- Creation function: `_createResonanceFieldMesh()` → `new THREE.Mesh(IcosahedronGeometry, MeshPhongMaterial)`
- Scene attachment: `init()` creates `fieldGroup` and attaches to `worldRoot|scene`, `_updateResonanceFields()` adds meshes to `fieldGroup`
- Update function: `update(deltaTime)` → `_detectHarmonyHubs()` + `_updateResonanceFields()` + `_animateFieldVertices()`
- Runtime active: **Yes**. `setupHarmonicHubAuraSystem()` is called in `main.js` and updated by `harmonicHubAuraSystemTick` in scheduler. This is a shared field between hubs, not the “node aura” shell.

**Baseline aura system (inactive)**
- File: `NodeAuraSystem_v1.js`
- Creation function: `registerNode()` → `new THREE.Mesh(this.auraGeometry, shared.material)`  
- Scene attachment: `_safeAttachAura()` → `this.scene.add(mesh)`
- Update function: `update(deltaTime)`
- Runtime active: **No** in current runtime. Not imported/instantiated in `main.js`, and creation is gated by `enableBaselineAura` (default false).

**Controller only (no mesh creation)**
- File: `HarmonyAuraController.js`
- Creation: **none** (no Mesh/InstancedMesh)
- Update: `update(dt, timeSeconds)` updates shader uniforms only
- Runtime active: **No evidence in `main.js`**

**Node model meshes (not aura system)**
- File: `EnhancedNodeModels.js`
- Contains many node-specific meshes/halos/glows during model construction, but **no global aura system** and no per-frame aura update here.

**Conclusion**
The moving node aura you see in the scene is rendered by `NodeLinkedAuraSystem.js` (torn shell + orbit ring), instantiated and updated in `main.js`. Harmonic hub fields are separate volumetric meshes (shared resonance zones), and `NodeAuraSystem_v1` is currently inactive.