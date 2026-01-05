# Node Linking System - Comprehensive Audit Phase 1
## Session 39 - Link Transition Invariant Definition & File Mapping

---

## LINK TRANSITION INVARIANT (MANDATORY)

### ✅ ALLOWED NODE STATE CHANGES AFTER LINKING:
1. Visual layer modifications (hologram on/off, aura changes)
2. Evolution to another node (controlled replacement with logging)
3. Merge into a new node (explicit, logged replacement)
4. Color/material updates (link state visual feedback)
5. Animation state changes (glow, pulse, rotation)

### ❌ FORBIDDEN NODE STATE CHANGES (CRITICAL):
1. **Silent Disposal** — Node disposed without explicit logging/intent
2. **Core Mesh Removal** — Primary geometry removed without replacement
3. **Loss of Interaction** — Node becomes un-clickable/non-selectable
4. **Unintended Parent Detachment** — Node removed from scene graph
5. **VFX Cleanup Affecting Core** — Effect disposal shouldn't impact node visuals
6. **Hologram Loss Without Intent** — Hologram disappears unintentionally

---

## FULL LINKING PIPELINE MAP

### **Core Systems:**
1. **NodeLinkingSystem.js** — Main linking orchestrator
   - `createLink(source, target)` — Line 1762
   - `removeLink(link)` — Line 3061
   - `updateLinkCurve(link)` — Line 2295
   - `updateLinkAnimations(link, time, dt)` — Line 2780

### **State Tracking Systems:**
2. **LinkIndex v3.0** (in NodeLinkingSystem.js)
   - Persistent link lookup: `linksByNode` Map
   - Stable node ID tracking: `nodeIdToLinks` Map
   - Purpose: Ensure links don't go stale when nodes change

3. **LinkPrioritySystem.js**
   - Tracks link importance
   - Non-destructive (read-only operations)

4. **LinkEventOrderValidator.js**
   - Validates link creation sequence
   - Prevents race conditions

### **Visual Systems Triggered by Linking:**
5. **EvolutionRegistry.js** (EXTERNAL - READ-ONLY)
   - Tracks node evolution stages
   - Creates VFX overlays (NOT modifying nodes)
   - Line 101: `unregisterNode(node)` — Only removes registry entries

6. **NeonLinkVisuals.js**
   - Renders link visuals
   - Multi-layer glow system
   - Safe VFX pack (7 effects, all additive)

7. **DynamicLinkThicknessSystem.js**
   - Updates link thickness based on traffic
   - Non-destructive (material updates only)

8. **ArchetypeVisualIntegrationPatch**
   - Applies archetype colors to nodes on link
   - Updates materials (non-destructive)

### **Dangerous Integration Points:**
9. **_ExtremeAINodeEvolution3.js**
   - May trigger node replacement/evolution
   - **NEEDS AUDIT** — Could remove node during evolution

10. **_MythicNodeCreation.js**
    - Creates special nodes
    - May have link-triggered side effects

11. **LinkEventVisualCoordinator_v1.js**
    - Coordinates visual feedback on linking
    - **NEEDS AUDIT** — May mutate node state

12. **_EvolvingLinkFX2_0.js**
    - Creates link-evolution visual effects
    - **NEEDS AUDIT** — May dispose nodes

13. **ComputeSynergyScore2_0.js**
    - Calculates link quality
    - Read-only (no mutations)

### **Side-Systems (Triggered By Linking):**
14. **SimulationEffectOrchestrator.js**
    - Manages all effect timing
    - **NEEDS AUDIT** — Effect cleanup could affect node cores

15. **WaveDynamicsShaderPack_v1.js**
    - Shader effects on nodes/links
    - Vertex/fragment level (safe)

16. **WaveTravelShaderPack_v1.js**
    - Travel wave animations
    - Shader level (safe)

17. **NodeCoreMaterialAuthority.js**
    - Controls core mesh materials
    - **NEEDS AUDIT** — Could replace/hide core

18. **AINodes.js**
    - Main node system
    - Line X: `this.scene.remove(node)` — **CRITICAL REVIEW NEEDED**

---

## DATA FLOW DURING LINK CREATION

```
User clicks Link (A→B)
  ↓
handleClick() validates nodes
  ↓
validateLink() checks compatibility
  ↓
createLink(A, B)
  ├─ Create link.group (visual container)
  ├─ Create link.coreLine (inner beam)
  ├─ Create link.midGlowLine (mid layer)
  ├─ Create link.haloLine (outer halo)
  ├─ Create link.bloomAuraLine (bloom)
  ├─ Create link.veins (energy streams)
  ├─ Create link.edgeLine (neon edge)
  ├─ Create link.particles (traffic particles)
  ├─ Create link.arrow (direction marker - DISABLED)
  ├─ scene.add(link.group)
  ├─ _addLinkToIndex(link) — Update link indices
  ├─ createMultiLayerGlow(link) — 4-layer glow VFX
  ├─ createEnergyPulseTravel(link) — Animated pulse
  ├─ createHolographicCircuit(link) — Circuit overlay
  ├─ createLinkEdgeHighlights(link) — Edge glow
  ├─ createSoftParticleStream(link) — Particle flow
  ├─ createQuantumLinkEffects(link) — Quantum shimmer
  ├─ createSigmaLinkEffects(link) — Sigma glitch
  ├─ LinkPrioritySystem.initializeLinkPriority(link)
  ├─ thicknessSystem.registerLinkCurve(link)
  ├─ _fireLinkCreatedCallbacks(A, B)
  └─ updateLinkCurve(link) — Position link geometry

  → Fire onLinkCreatedCallbacks
    → [DANGEROUS ZONE] External systems can be triggered here:
      ├─ ArchetypeVisualIntegrationPatch (may update node materials)
      ├─ EvolutionRegistry (may add VFX overlays - READ-ONLY)
      ├─ _ExtremeAINodeEvolution3.js (may evolve node - REVIEW NEEDED)
      ├─ LinkEventVisualCoordinator_v1 (may mutate node - REVIEW NEEDED)
      └─ Custom user callbacks (external, uncontrolled)

END: Link created, nodes unmodified (if no evolution)
```

---

## KNOWN ISSUES (TO BE FIXED)

### **Issue 1: Rare Node Disappearance**
- **Symptom**: integration/rare nodes lose hologram after linking
- **Suspected Cause**: 
  - Evolution system replacing core mesh?
  - Effect cleanup disposing node geometry?
  - Visual system removing nodes during state sync?
- **Categories Affected**: integration, prime, sigma, apex, mythic, special
- **Frequency**: Sporadic (not all links cause it)

### **Issue 2: Non-Interactive Nodes After Linking**
- **Symptom**: Nodes become un-clickable after linking
- **Suspected Cause**:
  - Node removed from aiNodes.nodes array?
  - Interactive root detached?
  - raycast target mesh removed?
- **Impact**: Cannot select, inspect, or link from affected nodes

### **Issue 3: Hologram Loss Without Intent**
- **Symptom**: Node hologram disappears while node still visible
- **Suspected Cause**:
  - Material disposal during effect cleanup?
  - Visual layer system removing shell?
  - Shader system disabling hologram?
- **Visibility Impact**: Node appears as solid mesh instead of holographic

### **Issue 4: Uncontrolled Node Removal**
- **Symptom**: Nodes silently disappear from scene during linking
- **Suspected Cause**:
  - EvolutionRegistry evolution replacing node?
  - Evolution system removing old mesh before adding new?
  - Scene.remove() called without logging?
- **Data Loss**: Links orphaned, node state lost

---

## AUDIT CHECKPOINTS

### **CP1: Link Creation Guards**
- [ ] Verify nodes still exist after createLink()
- [ ] Confirm nodes still interactive after createLink()
- [ ] Check nodes still have hologram after createLink()
- [ ] Validate link.source === original node (not replaced)
- [ ] Validate link.target === original node (not replaced)

### **CP2: Link Removal Guards**
- [ ] Verify source node unaffected by removeLink()
- [ ] Verify target node unaffected by removeLink()
- [ ] Confirm link visual completely removed from scene
- [ ] Validate no orphaned geometries/materials

### **CP3: Evolution Safety**
- [ ] If node evolves, old node logged as intentional replacement
- [ ] Evolution doesn't silently dispose old node
- [ ] Links updated to point to new node (if applicable)
- [ ] Node remains interactive during evolution

### **CP4: Effect Safety**
- [ ] Effect cleanup never disposes node core meshes
- [ ] Effect cleanup never removes nodes from scene
- [ ] Hologram layers separate from effect disposal
- [ ] Node always remains selectable/interactive

### **CP5: Rare Node Safety**
- [ ] Integration nodes don't vanish after linking
- [ ] Prime nodes retain full visuals after linking
- [ ] Sigma nodes stay interactive after linking
- [ ] Apex nodes keep hologram after linking
- [ ] Mythic nodes don't lose interaction after linking
- [ ] Special nodes remain visible after linking

---

## NEXT PHASE: DETAILED INVESTIGATION

**Files Requiring Deep Inspection:**
1. `_ExtremeAINodeEvolution3.js` — Evolution logic
2. `LinkEventVisualCoordinator_v1.js` — Link callback handlers
3. `_EvolvingLinkFX2_0.js` — Link FX disposal
4. `NodeCoreMaterialAuthority.js` — Core material management
5. `AINodes.js` — Node removal logic
6. `SimulationEffectOrchestrator.js` — Effect cleanup timing

**Instrumentation Needed:**
- Add logging to node removal points
- Add guards to effect cleanup (prevent node disposal)
- Add verification after each link operation
- Add diagnostic dump on node disappearance

