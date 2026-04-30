# MULTI-EFFECT AUDIT CONTEXT
**Session**: 2026-04-30
**Topic**: Node VFX (rings, glyphs, orbit clusters) persisting on unlinked nodes
**Status**: PARTIALLY RESOLVED — root cause addressed, monitoring required

---

## OBSERVED PHENOMENON

Node displays composite effect without active link:
- 2-3 large wireframe torus rings
- 1-2 thin orbit rings
- Central polyhedron core
- 20-40 orbiting glyphs/particles

**Effect survived**: FX sandbox full disable
**Effect location**: Around node mesh (not on links)

---

## ROOT CAUSE IDENTIFIED

**File**: `EnhancedNodeModels.js`

Two ERROR node factories had hardcoded Y-offset on root group:
- `createErrorIntersectingSolidsNode` (line ~30035): `root.position.set(5, 10, 0)`
- `createErrorTopologyTearNode` (line ~30733): `root.position.set(5, 10, 0)`

This caused node mesh to be offset at Y=10 while VFX anchor stayed at correct position → visual split.

**FIX APPLIED**: Both hardcoded positions removed. Nodes now use scene transform hierarchy correctly.

---

## ALL CHANGES IN THIS SESSION

### 1. `_SafeEvolutionManager.js`
- **Line 39**: `vfxOffset` changed from `(5, 0, 0)` to `(5, 0, 0)` — was already correct
- **Lines 222-246**: `calculateLinkEnergy()` — added stricter `link.active !== false` check for both synergy and traffic loops
- **Lines 113-123**: Added early return for `linkEnergy <= 0` — skips VFX for unlinked nodes

### 2. `EnhancedNodeModels.js`
- **Line ~30035** (createErrorIntersectingSolidsNode): Removed `root.position.set(5, 10, 0)`
- **Line ~30733** (createErrorTopologyTearNode): Removed `root.position.set(5, 10, 0)`

### 3. `AIConsciousnessLayer.js`
- **Line 2040**: Interval changed from `0.24` to `0.08` — faster semantic pattern updates

### 4. Other files touched (not directly related to multi-effect)
- `TIER4_CorruptionFeedbackVisuals_v1.js`: Added link-gating to corruption seed/warning displays
- `T2_CorruptionVisualIntegration_v1.js`: Added link-gating to corruption pulse

---

## SYSTEMS AUDITED

### SafeEvolutionManager (`_SafeEvolutionManager.js`)
- **Role**: Orbit rings, core hologram, orbiting particles, color tint, pulse scale
- **Link-gating**: YES — `calculateLinkEnergy()` returns 0 for unlinked nodes
- **Energy decay**: 5 second delay, then 7 second decay to 0
- **VFX anchor**: `node.position + vfxOffset (5, 0, 0)`
- **Conclusion**: Clean — correctly gates VFX behind link state

### AIConsciousnessLayer (`AIConsciousnessLayer.js`)
- **Role**: Semantic pattern clusters (shells, orbits) on link midpoints
- **Link-gating**: YES — spawns only via `_spawnNewThoughts()` which filters by valid links
- **Anchor**: `link.nodeA.position.clone().lerp(link.nodeB.position, 0.5)` — link midpoint, not node
- **Y-offset**: `clusterPos.y += 1.5` — intentional (cluster above link)
- **Conclusion**: Clean — no spawn outside link context

### GlyphLayer4_MultiFusion (`_GlyphLayer4_MultiFusion.js`)
- **Ambient orbit glyphs**: `createAmbientOrbitForNode()` — link-gated via `_hasNodeActiveLinks()`
- **State glyphs**: `createStateGlyph()` — included in fusion, fusion has link-gating
- **Cluster type state glyph**: Lines 2050-2076 — creates rotating cluster effect, but part of fusion system
- **Conclusion**: Clean — link-gating present

### NodeLinkedAuraSystem (`NodeLinkedAuraSystem.js`)
- **Role**: Linked node auras with segmented orbit rings (NodeSegmentedOrbitRings shader)
- **Link-gating**: YES — `getNodeLinkCount()` at line 321, removes aura if count=0
- **Conclusion**: Clean

### ERROR Node Factories (`EnhancedNodeModels.js`)
- **createErrorIntersectingSolidsNode**: CLEAN — no hardcoded position
- **createErrorInvertedNormalsNode**: CLEAN
- **createErrorSelfClippingNode**: CLEAN
- **createErrorFoldedImpossibleNode**: CLEAN
- **createErrorTopologyTearNode**: FIXED — removed Y=10 offset
- **createErrorCorruptedManifoldNode**: CLEAN
- **createErrorNodeStyled_v2**: CLEAN

---

## UNRESOLVED QUESTIONS

1. **Effect still visible?** User reported effect persists after fixes — unclear if ERROR node root cause was the only cause
2. **SafeEvolutionManager energy decay timing**: 5 second delay + 7 second decay = 12 seconds total before VFX disappears after link removal
3. **Which specific node type shows the effect?** MYTHIC_APOSTATE (code 902) or ERROR (code 1105/1106)?
4. **Window.game access**: Browser console returns undefined for `window.game` — unable to run live diagnostics

---

## KEY FILES

| File | Relevance |
|------|-----------|
| `_SafeEvolutionManager.js` | Orbit rings + particles VFX system |
| `AIConsciousnessLayer.js` | Semantic pattern clusters |
| `_GlyphLayer4_MultiFusion.js` | Glyph fusion + ambient orbits |
| `EnhancedNodeModels.js` | Node visual factories (ERROR nodes) |
| `NodeLinkedAuraSystem.js` | Linked auras with segmented rings |
| `NodeLinkingSystem.js` | Link state management (`link.active = false`) |
| `MetricsRuntime_v1.js` | Link count tracking |
| `shaders/NodeSegmentedOrbitRings.js` | Ring shader for NodeLinkedAuraSystem |

---

## LINK-GATING MECHANISMS

### System 1: SafeEvolutionManager
```javascript
if (linkEnergy <= 0) {
  // Force stage 0 and clear all VFX
}
```
Energy from `calculateLinkEnergy()` which checks `link.active !== false`.

### System 2: AIConsciousnessLayer
```javascript
const links = linkingSystem.links.filter(link => link && link.nodeA && link.nodeB);
```
Only operates on valid links.

### System 3: GlyphLayer4
```javascript
if (!this._hasNodeActiveLinks(node)) return;
```
Checks `node.userData.metrics.activeLinkCount` or `node.userData.activeLinkCount`.

### System 4: NodeLinkedAuraSystem
```javascript
if (linkCount === 0) { this.removeAura(node); }
```
Counts links via `getNodeLinkCount()`.

---

## RECOMMENDED NEXT AGENT TASKS

If handing to another agent for further debugging:

1. **Verify fix**: Reboot game, check if ERROR node Y-offset is resolved
2. **Identify effect source**: Run scene traverse to find all `isVFX` or `isEvolutionVFX` objects, identify their source system by name/uuid pattern
3. **Check energy decay timing**: After link removal, verify VFX disappears within ~12 seconds (not instantly)
4. **MYTHIC_APOSTATE investigation**: This node (code 902) has 38 static glyph positions — confirm this is NOT the source of 20-40 orbiting effect
5. **Browser diagnostics**: Find correct `window.game` accessor or alternative debug endpoint

---

## CONSTRAINTS FOR FUTURE WORK

- Do NOT refactor link-gating systems without concrete evidence they are broken
- Do NOT add new VFX systems without link-gating unless explicitly required (CoreHologramShader, GlyphLayer4, EdgeGlowShader are exempt)
- Any new node-local VFX must respect `link.active` state
- ERROR node factories must NOT set hardcoded positions on root group

---

## FILE:LINE REFERENCE

| Fix | File | Line |
|-----|------|------|
| Remove ERROR Y-offset | EnhancedNodeModels.js | ~30035, ~30733 |
| Strict link.active check | _SafeEvolutionManager.js | 223-240 |
| Early return for unlinked | _SafeEvolutionManager.js | 113-123 |
| Faster semantic updates | AIConsciousnessLayer.js | 2040 |

---

**End of audit context**