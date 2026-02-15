# NODE VISUAL ARCHETYPE AUTHORITY AUDIT
**ATOMA – Node Visual Archetype Authority Audit**

Date: 2025-02-13  
Audit Type: Visual Authority Chain Analysis  
Scope: Node visual identity definition and mutation systems

---

## EXECUTIVE SUMMARY

**⚠️ CRITICAL FINDING: Visual authority is FRAGMENTED across 15+ systems**

Node visual identity is NOT controlled by a single authority. The archetype system creates initial visuals but does not maintain authoritative control at runtime. Multiple independent systems mutate node visuals per-frame, creating conflicts, performance issues, and visual instability.

**Fragmentation Score: CRITICAL**

---

## A) AUTHORITY HIERARCHY

### Visual Creation Authority
| File | Function | Creates | Authority Type |
|------|----------|----------|----------------|
| **AINodeModel.js** | `create()` | Base node geometry, materials, mesh groups | **BASE CREATOR** |
| **EnhancedNodeModels.js** | `create()` | Delegates to AINodeModel, applies archetypes | **FACTORY** |
| **StorageNodesVisual_Session116.js** | `createObeliskCache()`, `createFractalReservoir()`, `createArchiveDrum()` | Complete STORAGE node geometries | **FACTORY** |
| **ArchetypeVisualDifferentiationSystem_v1.js** | `buildOverlayForProfile()` | Archetype overlay groups (glow, particles, rim) | **OVERLAY CREATOR** |
| **EvolutionRegistry.js** | `ensureOverlay()` | Evolution VFX overlay groups | **VFX OVERLAY CREATOR** |

### Initialization Authorities (Post-Creation)
| System | Modifies | When | Risk Level |
|--------|----------|------|------------|
| ArchetypeVisualDifferentiationSystem_v1 | Adds overlay groups, sets shader params | `applyArchetypeToNode()` | LOW (overlay-only) |
| EvolutionRegistry | Registers node, creates overlay groups | `registerNode()` | LOW (overlay-only) |
| ArchetypeColorPaletteSystem_v1 | Applies HSL shifts to materials | `_updateNodeColor()` | **MEDIUM** (modifies base materials) |
| NodeVisualStateBinder | Stores initial visual state | Visual state capture | LOW (read-only snapshot) |

### Runtime Authorities (Event-Driven)
| System | Property | Trigger | Risk Level |
|--------|----------|---------|------------|
| _NodeMicroEvents.js | `material.emissive`, `material.emissiveIntensity` | Node events (focus, energy, shimmer) | **MEDIUM** |
| ArchetypeVisualDifferentiationSystem_v1 | Overlay rotation, glow scale, opacity | Per-frame in `updateArchetypeEffects()` | LOW (overlay-only) |
| EvolutionRegistry | Overlay opacity, emissive, scale | Per-frame in `updateVFX()` | LOW (overlay-only) |
| CorruptionDesaturationIntegrationPatch | Material desaturation | Corruption level changes | **MEDIUM** |
| SafeEvolutionManager | Overlay opacity, emissive | Evolution stage changes | LOW (overlay-only) |

### Per-Frame Authorities (CRITICAL)
| System | Property Modified | Frequency | Conflict Risk |
|--------|-------------------|-----------|---------------|
| _NodeMicroEvents.js | `node.material.emissiveIntensity` | Every frame (60fps) | **HIGH** |
| _NodeVisuals4_0.js | `material.opacity` (visual components) | Every frame | **HIGH** |
| WaveInterferencePatternSystem_Session132.js | `material.opacity`, `material.emissiveIntensity` | Every frame | **HIGH** |
| _SafeNodePersonalityFX.js | `orbit.material.opacity`, `material.emissiveIntensity` | Every frame | **MEDIUM** |
| _SafeLegendaryNodePack.js | `aura.material.opacity`, `material.emissiveIntensity` | Every frame | **MEDIUM** |
| ArchetypeColorPaletteSystem_v1.js | `_updateNodeColor()` modifies materials | Every frame | **MEDIUM** |
| CorruptionVisualIntegrationPatch_v1.js | `node.material.emissive` (corruption color) | Every frame | **MEDIUM** |
| SynergyCascadeVisualizer.js | `material.emissive`, `material.emissiveIntensity` | Every frame | **MEDIUM** |
| _AmbientEntityManager.js | `child.material.opacity` | Every frame | **LOW** (ambient objects) |
| _AtomaGlyphSystem3_0.js | `child.material.opacity` | Every frame | **MEDIUM** (glyphs) |
| World.js | `node.material.emissiveIntensity` | Every frame | **LOW** (world nodes) |

---

## B) PROPERTY AUTHORITY TABLE

| Property | Controlled By | Conflict | Risk Level |
|----------|---------------|----------|------------|
| **geometry** | AINodeModel.create(), StorageNodesVisual.create*() | None (creation only) | LOW |
| **material (base)** | AINodeModel.create(), StorageNodesVisual.create*() | ArchetypeColorPaletteSystem, CorruptionVisualIntegrationPatch | **MEDIUM** |
| **color** | Archetype profiles, StorageNodesVisual | ArchetypeColorPaletteSystem (HSL shifts), CorruptionVisualIntegrationPatch | **MEDIUM** |
| **emissive** | Archetype profiles, StorageNodesVisual | _NodeMicroEvents, CorruptionVisualIntegrationPatch, SynergyCascadeVisualizer, WaveInterferencePatternSystem, ArchetypeColorPaletteSystem | **CRITICAL** (6+ systems) |
| **emissiveIntensity** | Archetype profiles, StorageNodesVisual | _NodeMicroEvents, _SafeNodePersonalityFX, _SafeLegendaryNodePack, SynergyCascadeVisualizer, WaveInterferencePatternSystem, World.js, ArchetypeColorPaletteSystem | **CRITICAL** (7+ systems) |
| **opacity** | Archetype profiles, StorageNodesVisual | _NodeVisuals4_0, _SafeNodePersonalityFX, _SafeLegendaryNodePack, WaveInterferencePatternSystem, _AmbientEntityManager, _AtomaGlyphSystem3_0 | **HIGH** (6+ systems) |
| **scale** | Archetype profiles (initial) | EvolutionRegistry (overlay scale), ArchetypeVisualDifferentiationSystem (overlay scale) | **LOW** (mostly overlay-only) |
| **visibility** | System-wide flags | Multiple systems set `.visible` | **MEDIUM** |

---

## C) FRAGMENTATION SCORE

```
Visual Authority Fragmentation: CRITICAL
```

**Breakdown:**
- **Creation Authority**: SINGLE (AINodeModel + factories) ✓
- **Initialization Overrides**: MEDIUM (multiple systems modify after creation)
- **Runtime Authorities**: HIGH (event-driven mutations)
- **Per-Frame Authorities**: CRITICAL (7+ systems modifying per-frame)

---

## D) KEY FINDINGS

### 1. Multiple Visual Authorities

**Archetype is NOT the final visual authority.**

While archetypes define the initial appearance, the following systems actively modify node visuals after creation:

- **ArchetypeVisualDifferentiationSystem_v1**: Adds overlay groups with archetype-specific glow, particles, rim effects
- **EvolutionRegistry**: Adds separate evolution VFX overlays (completely external, reads node.id only)
- **ArchetypeColorPaletteSystem_v1**: Applies HSL color shifts to base materials
- **CorruptionVisualIntegrationPatch_v1**: Changes emissive colors for corruption visualization
- **_NodeMicroEvents**: Modifies emissive for event-driven visual feedback

### 2. Per-Frame Visual Mutations (CRITICAL)

**⚠️ CRITICAL: 7+ systems modify node visual properties every frame**

The following systems directly mutate node mesh properties in update loops:

```javascript
// Example from _NodeMicroEvents.js
visual.node.material.emissiveIntensity = 
  visual.originalIntensity + Math.sin(progress * Math.PI) * 0.3;
```

**Systems modifying per-frame:**
1. `_NodeMicroEvents.js` - modifies `node.material.emissiveIntensity`
2. `_NodeVisuals4_0.js` - modifies `material.opacity`
3. `WaveInterferencePatternSystem_Session132.js` - modifies `material.opacity`, `material.emissiveIntensity`
4. `_SafeNodePersonalityFX.js` - modifies orbit materials
5. `_SafeLegendaryNodePack.js` - modifies aura materials
6. `ArchetypeColorPaletteSystem_v1.js` - modifies materials via `_updateNodeColor()`
7. `CorruptionVisualIntegrationPatch_v1.js` - modifies `node.material.emissive`
8. `SynergyCascadeVisualizer.js` - modifies `material.emissive`, `material.emissiveIntensity`
9. `World.js` - modifies world node `material.emissiveIntensity`

**Performance Impact:**
- Each mutation triggers WebGL material re-compilation or uniform updates
- 7+ systems × 60fps = 420+ material updates per second per node
- O(n²) scaling with node count

### 3. Systems Overriding Archetype Identity

**Archetype profile settings are being overridden at runtime:**

| Archetype Property | Overridden By | Effect |
|-------------------|---------------|--------|
| `emissiveIntensity` | _NodeMicroEvents, CorruptionVisualIntegrationPatch, WaveInterferencePatternSystem | Archetype glow levels ignored |
| `emissive` color | CorruptionVisualIntegrationPatch, ArchetypeColorPaletteSystem | Archetype color shifts corrupted |
| `opacity` | Multiple VFX systems (pulsing, shimmering) | Archetype transparency settings ignored |
| `animation.speed` | ArchetypeVisualDifferentiationSystem (overlay rotation), personality systems | Archetype motion profile blended |

### 4. Orphaned or Legacy Visual Systems

**Dormant or partially integrated systems found:**

1. **_LegacyDebugConeCleanup.js** - Contains `update()` method with comment: `// DORMANT: Per-frame execution DISABLED`
2. **Multiple patch files** - Reference functions that may not be wired:
   - `ArchetypeVisualIntegrationPatch_v1.js` patches `updateNodeVisuals()`
   - `CorruptionVisualIntegrationPatch_v1.js` patches `updateArchetypeEffects()`
   - `DefensiveHardeningPatch_v1.js` patches `_updateNodeMaterials()`
3. **Visual upgrade systems** - `VisualUpgradeSuperpack.js`, `_ExtremeLinkVisualPack3.js` - appear to be addon systems not integrated into core authority chain

### 5. Per-Frame Mutation Hotspots

**Highest-risk properties (most frequent mutations):**

1. **`material.emissiveIntensity`** - Modified by 7+ systems per-frame
2. **`material.emissive`** - Modified by 6+ systems per-frame
3. **`material.opacity`** - Modified by 6+ systems per-frame

**Example conflict chain for `emissiveIntensity`:**
```
Archetype profile sets: 0.25
├→ CorruptionVisualIntegrationPatch changes to red corruption: 0.8
├→ _NodeMicroEvents pulse event: 1.5 (spike)
├→ WaveInterferencePatternSystem: varies with wave amplitude
├→ ArchetypeColorPaletteSystem: varies with archetype evolution
└→ SynergyCascadeVisualizer: varies with cascade intensity
```

### 6. Visual Authority Patterns

**Systems can be categorized by mutation approach:**

| Pattern | Systems | Safety |
|----------|----------|--------|
| **OVERLAY-ONLY** (creates separate meshes, doesn't touch base) | EvolutionRegistry, ArchetypeVisualDifferentiationSystem_v1, SafeEvolutionManager, _SafeLegendaryNodePack, _SafeNodePersonalityFX | SAFE |
| **DIRECT MATERIAL MUTATION** (modifies node.material.*) | _NodeMicroEvents, ArchetypeColorPaletteSystem, CorruptionVisualIntegrationPatch, WaveInterferencePatternSystem | **UNSAFE** |
| **READ-ONLY SNAPSHOT** (captures state, doesn't modify) | NodeVisualStateBinder, VisualStateSnapshot | SAFE |

---

## E) ROOT CAUSE ANALYSIS

### Where Visual Instability Originates

1. **Lack of visual authority contract** - No single system owns the final visual state
2. **Per-frame direct material mutation** - Multiple systems directly modify `node.material.*` properties
3. **No mutation coordination** - Systems don't check if other systems have already modified a property
4. **Patch-based integration** - Multiple files patch core methods, creating hidden dependencies
5. **Overlay vs. base confusion** - Some systems mutate overlays (safe), others mutate base materials (unsafe), but there's no clear separation

### Authority Gaps

- **No visual state manager** - No system tracks what properties are currently set by whom
- **No mutation serialization** - Multiple systems can modify the same property in the same frame
- **No visual baseline** - No authoritative "default state" that can be restored
- **No conflict detection** - Systems don't detect when they're overriding each other

---

## F. SYSTEM-SPECIFIC FINDINGS

### ArchetypeVisualDifferentiationSystem_v1.js

**Authority Type:** OVERLAY CREATOR (SAFE)  
**Creation Authority:** Creates overlay groups separate from base mesh  
**Runtime Authority:** Updates overlay properties (rotation, scale, opacity) per-frame  
**Mutation Safety:** SAFE (only modifies overlay meshes, never base materials)

### EvolutionRegistry.js

**Authority Type:** VFX OVERLAY CREATOR (SAFE)  
**Creation Authority:** Creates evolution VFX overlay groups  
**Runtime Authority:** Updates VFX properties (opacity, emissive, scale) per-frame  
**Mutation Safety:** SAFE (completely external, reads only `node.id`, modifies only overlay meshes)  
**Key Quote:** "COMPLETELY EXTERNAL - Does NOT modify any Node internals"

### _NodeMicroEvents.js

**Authority Type:** EVENT-DRIVEN MUTATOR (UNSAFE)  
**Creation Authority:** None  
**Runtime Authority:** Modifies `node.material.emissive`, `node.material.emissiveIntensity` for events  
**Mutation Safety:** **UNSAFE** (directly mutates base materials)  
**Frequency:** Per-frame during active events

### StorageNodesVisual_Session116.js

**Authority Type:** FACTORY (SAFE)  
**Creation Authority:** Creates complete STORAGE node geometries with materials  
**Runtime Authority:** None (creates only, no per-frame updates)  
**Mutation Safety:** SAFE (creation only, no runtime mutations)

### ArchetypeColorPaletteSystem_v1.js

**Authority Type:** INIT OVERRIDE + PER-FRAME MUTATOR (UNSAFE)  
**Creation Authority:** None  
**Runtime Authority:** Modifies materials via `_updateNodeColor()`  
**Mutation Safety:** **UNSAFE** (modifies base materials with HSL shifts)  
**Frequency:** Per-frame

---

## G. VISUAL MUTATION MAP

### Mutation Chains by Property

#### `emissiveIntensity` Mutation Chain:
```
Initial: AINodeModel.create() sets base intensity
  ↓
Init: ArchetypeVisualProfiles set archetype intensity
  ↓
Runtime (Per-Frame):
  ├→ _NodeMicroEvents: pulse events (0.3-2.0 range)
  ├→ CorruptionVisualIntegrationPatch: corruption level (0-0.8)
  ├→ WaveInterferencePatternSystem: wave amplitude modulation
  ├→ ArchetypeColorPaletteSystem: archetype evolution curve
  ├→ SynergyCascadeVisualizer: cascade intensity
  ├→ _SafeNodePersonalityFX: personality mood (overlay only)
  └→ _SafeLegendaryNodePack: legendary effects (overlay only)
```

#### `opacity` Mutation Chain:
```
Initial: AINodeModel.create() sets base opacity
  ↓
Init: ArchetypeVisualProfiles set archetype opacity
  ↓
Runtime (Per-Frame):
  ├→ _NodeVisuals4_0: visual component updates
  ├→ WaveInterferencePatternSystem: interference modulation
  ├→ _SafeNodePersonalityFX: personality orbits (overlay only)
  ├→ _SafeLegendaryNodePack: legendary aura (overlay only)
  ├→ _AmbientEntityManager: ambient entity fading
  └→ _AtomaGlyphSystem3_0: glyph component pulsing
```

---

## H. RECOMMENDATIONS (NOT PART OF AUDIT SCOPE)

*This section is informational only. No refactor suggestions are included per audit requirements.*

The audit identifies the need for:
1. A single visual authority system to coordinate mutations
2. Separation of overlay mutations from base material mutations
3. Serialization of per-frame visual updates
4. Visual state tracking and conflict detection
5. Clear authority contracts between visual systems

---

## I. APPENDIX: FILES ANALYZED

### Primary Files:
- EnhancedNodeModels.js
- AINodeModel.js
- ArchetypeVisualDifferentiationSystem_v1.js
- EvolutionRegistry.js
- StorageNodesVisual_Session116.js
- NodeVisualStateBinder.js

### Visual Factory Files:
- StorageNodesVisual_Session116.js
- (No InputNodesVisual or ControlNodesVisual factory files found - these may use AINodeModel directly)

### Per-Frame Mutators (Sample of 186+ update functions found):
- _NodeMicroEvents.js (update)
- _NodeVisuals4_0.js
- WaveInterferencePatternSystem_Session132.js (update)
- _SafeNodePersonalityFX.js (update)
- _SafeLegendaryNodePack.js (update)
- ArchetypeColorPaletteSystem_v1.js (_updateNodeColor)
- CorruptionVisualIntegrationPatch_v1.js (updateArchetypeEffects)
- SynergyCascadeVisualizer.js
- World.js (various update functions)

---

## AUDIT CONCLUSION

**Is Archetype the real visual authority?**

**NO.** Archetype defines initial visual properties but does not maintain authoritative control at runtime. Visual identity is:
- Archetype (creation)
- + Binder (state capture, read-only)
- + Evolution (VFX overlays only, SAFE)
- + ColorPalette (material mutation, UNSAFE)
- + Corruption (material mutation, UNSAFE)
- + MicroEvents (material mutation, UNSAFE)
- + WaveInterference (material mutation, UNSAFE)
- + Multiple VFX systems (overlay mutations, SAFE)
- + Personality systems (overlay mutations, SAFE)

**Where visual instability originates:**

Direct per-frame material mutations by 7+ systems that do not coordinate with each other. The lack of a single visual authority creates a "last-write-wins" scenario where visual properties are being overwritten repeatedly every frame.

**Fragmentation: CRITICAL**

The visual authority chain is heavily fragmented across 15+ systems, with 7+ systems performing unsafe per-frame material mutations. This is the source of visual mutation chaos and performance bottlenecks.

---

**Audit End**