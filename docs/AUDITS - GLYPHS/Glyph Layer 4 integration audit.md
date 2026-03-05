**Findings**

1) **GlyphLayer4_MultiFusion definition** (`_GlyphLayer4_MultiFusion.js`)
- Class: `GlyphLayer4_MultiFusion` (line 29)
- Constructor params: `(scene, enforcementGate = null, resonanceFeedback = null)` (line 30)
- Public API (named exports): `createGlyphFusion(node, nodeId)` (line ~828), `createGlyphFusionsForNodes(nodes)` (line ~948), `update(deltaTime)` (line ~977), plus `removeFusion(nodeId)`, `cleanup()`, `debugGlyphFusion()`, `printStatus()`, `enable()/disable()`.

2) **Initialization in `main.js`**
- Primary init (world start): lines 5089–5093  
  `this.glyphLayer4 = new GlyphLayer4_MultiFusion(this.scene, this.worldRoot, this.compositeResonanceFeedback || null);`
- Late re-init (world rebuild): lines 5521–5524 (old instance disposed just above).
- Bulk spawn call right after init: lines 5094–5095 `createGlyphFusionsForNodes(this.aiNodes.nodes)`; repeated after node creation block at lines 5680–5681.
- Instance name: `this.glyphLayer4`. Scene is passed; `aiNodes` is not passed (not required); `worldRoot` passed as second arg; resonance feedback optional third arg.

3) **FrameScheduler registration**
- Registered to visual layer (30 Hz) in `main.js` line 3472:  
  `frameScheduler.register('visual', (dt) => this.glyphLayer4?.update?.(dt), 'visual.glyphLayer4');`
- Guarded duplicate registration in system registry: line 8493 `regGuard('glyphLayer4', 'visual.glyphLayer4', (dt) => this.glyphLayer4?.update?.(dt));`
→ `update(dt)` is called every visual tick.

4) **Node spawn integration**
- Post-spawn hook in `main.js` lines 9761–9772:  
  `aiNodes.registerPostSpawnObserver('glyph-layer-fusion', (newNode) => { … this.glyphLayer4.createGlyphFusion(newNode, nodeId); }, order 60);`
- `AINodes.js` supports this via `registerPostSpawnObserver` (line ~831) and executes observers in `_runPostSpawnObservers` called from `createNodes` (line ~1188) and `spawnNode` (line ~3999).  
→ Glyph fusion is invoked for every newly spawned node (after nodeId set).

5) **Scene attachment**
- In `createGlyphFusion` (lines 828–855): ensures/creates `visualGroup` child on the node (`node.add(visualGroup)`), then creates `fusionGroup` (`new THREE.Group()`) and `visualGroup.add(fusionGroup)`. All layer glyph meshes are added under `fusionGroup`. Final hierarchy: `node → visualGroup → fusionGroup → glyph layer meshes`.

6) **Lifecycle**
- Creation: `createGlyphFusion` (initial bulk + per-node post-spawn).
- Per-frame update: `update` (FrameScheduler.visual).
- Removal: `removeFusion(nodeId)` (line ~1017) disposes geometry/materials and detaches from parent; `cleanup()` iterates `removeFusion` for all nodes. `update` also calls `removeFusion` if a stored fusion group is missing (line ~995). No explicit AINodes destroy hook, but cleanup covers registry and missing-parent cases.

7) **Failure scan**
- Instantiated and used: yes (bulk creation + post-spawn observer).
- Update registered: yes (visual scheduler + regGuard).
- Spawn call wired: yes (initial bulk and post-spawn observer).
- Attachment: yes (adds `visualGroup` on node, then fusion group).
- Multiple glyph groups per node: prevented by `if (fusionRegistry.has(nodeId)) return;` in `createGlyphFusion`.
- Potential gap: on world rebuild, new instance is created (line 5521) but bulk fusion relies on later call (lines 5680–5681); those lines run after nodes are built, so coverage is maintained. No direct hook on node disposal, but `cleanup()`/missing-parent guard mitigate.

**Summary**

1. **Initialization:** Correct — `GlyphLayer4_MultiFusion` is constructed with `scene` and `worldRoot`; resonance feedback optional. Instance `this.glyphLayer4` created on startup and after rebuilds.  
2. **Scheduler:** Registered to `FrameScheduler.visual` (`visual.glyphLayer4`), so `update(dt)` runs each visual tick.  
3. **Node spawn hook:** Yes — post-spawn observer `glyph-layer-fusion` calls `createGlyphFusion` for every new node; initial bulk call fuses existing nodes.  
4. **Scene graph:** Glyphs attach under each node’s `visualGroup`, with a child `fusionGroup` containing the layer meshes.  
5. **Integration issues:** None observed. Only minor note: node teardown relies on external cleanup or missing-parent detection; otherwise integration is complete and automatic.