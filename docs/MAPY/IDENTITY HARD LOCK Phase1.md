IDENTITY HARD LOCK: Phase 1 - Pre-Lock Validation Sweep
Status: AUDIT ONLY (no implementation)
Scope: Scan entire codebase before hard lock
Goal: Classify all identity-related patterns

SCAN RESULTS
1. WRITES TO userData.id
File	Line	Pattern	Context
AINodes.js	3819	userData.id = userData.id || random	Legacy mirror
AINodes.js	3342	userData.id = userData.nodeId || random	Legacy mirror
Total: 2 confirmed writes

Classification: ✅ LEGACY MIRROR (valid, single-direction nodeId → id)

2. WRITES TO userData.nodeId
File	Line	Pattern	Context
AINodes.js	3346	userData.nodeId = userData.id	Canonical assignment
AINodes.js	3823	userData.nodeId = userData.id	Canonical assignment
Total: 2 confirmed writes

Classification: ✅ SPAWN AUTHORITY (valid, written by spawn authority)

3. RANDOM ID GENERATION
File	Line	Pattern	Type
AINodes.js	3342	node-${Date.now()}-${Math.random()}	❌ RANDOM IN id
AINodes.js	3819	node-${Date.now()}-${Math.random()}	❌ RANDOM IN id
Total: 2 confirmed random generations

Classification: ❌ FALLBACK MASK (will be removed by hard lock)

4. OR-CHAIN FALLBACK PATTERNS
Pattern A: nodeId || id || uuid

// HitProxySystem_v1.js:49
return ud.id || ud.nodeId || node.uuid || null;
Classification: ❌ FALLBACK MASK (fallback reads, legacy compatibility)

Pattern B: id || nodeId

// GlyphLayer4_MultiFusion.js:807
nodeId: node.userData.id || node.uuid
Classification: ❌ FALLBACK MASK (fallback reads, legacy compatibility)

5. ILLEGAL WRITES TO userData.nodeId
Scan for: writes to userData.nodeId OUTSIDE spawn authority

Definition:

Legal: AINodes.createNode() and AINodes._finalizeSpawnedNode() set nodeId
Illegal: Any other system setting nodeId
Scan Results:

System	Result	Notes
_HitProxySystem_v1.js	✅ Clean	Uses targetNodeId field (separate)
_SafeEvolutionManager.js	❌ Illegal	Lines 51, 53 - mirrors id to nodeId
_SafeLegendaryNodePack.js	❌ Illegal	Lines 116, 118 - mirrors id to nodeId
_SafeNodePersonalityFX.js	❌ Illegal	Lines 147, 149 - mirrors id to nodeId
AINodes.js (other)	✅ Clean	Only createNode and _finalizeSpawnedNode write nodeId
CLASSIFICATION SUMMARY
Illegal Writers (must be zero after hard lock)
❌ _SafeEvolutionManager.js
   - Lines 51, 53
   - Writes: userData.nodeId = userData.id OR random
   - Issue: External system overriding spawn authority

❌ _SafeLegendaryNodePack.js
   - Lines 116, 118
   - Writes: userData.nodeId = userData.id OR random
   - Issue: External system overriding spawn authority

❌ _SafeNodePersonalityFX.js
   - Lines 147, 149
   - Writes: userData.nodeId = userData.id OR random
   - Issue: External system overriding spawn authority
Total Illegal Writers: 3 systems

Fallback Reads (to remove later)
❌ HitProxySystem_v1.js:49
   - Pattern: ud.id || ud.nodeId || node.uuid
   - Type: OR-chain fallback
   - Issue: Legacy compatibility, bypasses canonical authority

❌ GlyphLayer4_MultiFusion.js:807
   - Pattern: node.userData.id || node.uuid
   - Type: OR fallback
   - Issue: Legacy compatibility, bypasses canonical authority
Total Fallback Reads: 2 locations

Systems Depending on id Instead of nodeId
✅ HitProxySystem_v1.js:285
   - Writes: node.userData.id = nodeId
   - Type: External system writing to legacy field
   - Status: LEGACY (will use `id` mirror after hard lock)

✅ HitProxyAutoRegistrar.js:80
   - Writes: node.userData.id = random
   - Type: External system writing to legacy field
   - Status: LEGACY (should use `nodeId` instead)

✅ SafeColonyExpansion2.js:185-187
   - Reads: node.userData.id == currentId
   - Type: Legacy reads
   - Status: LEGACY (should use `nodeId`)

✅ CoreMaterialPropertyLock.js:79
   - Writes: coreMaterial.userData.nodeId = nodeId
   - Type: Separate field on material object
   - Status: LEGACY (separate identity tracking)

✅ _GlyphFusionOverlay4_1.js:282
   - Writes: fusionGroup.userData.nodeId = nodeId
   - Type: Fusion group tracking
   - Status: LEGACY (separate identity tracking)

✅ ControlSpineVariants_Session100_...:19,236,111,174,237
   - Writes: controlNode.userData.id = nodeId
   - Type: Control variant tracking
   - Status: LEGACY (separate identity tracking)
Total Legacy Systems: 7 systems

AUTHORITY MAP (Before Hard Lock)
Current Authority Distribution
┌─────────────────────────────────────────────────────────────────┐
│                                                          │
│  SPAWN AUTHORITY                                         │
│  ┌─────────────────────────────────────┐                     │
│  │ AINodes.js                    │                     │
│  │ ┌───────────────────────────┐      │                     │
│  │ │ EnhancedNodeModels      │      │                     │
│  │ │ createNode()           │      │                     │
│  │ │ ↓                     │      │                     │
│  │ │ node.userData.nodeId    │      │                     │
│  │ └───────────────────────────┘      │                     │
│  └─────────────────────────────────────┘                     │
│  ↓                                                     │
│  AINodes.js                                            │
│  ┌───────────────────────────────────┐                       │
│  │ _finalizeSpawnedNode()       │                       │
│  │ ↓                           │                       │
│  │ │ userData.id = userData.nodeId│ │                       │
│  └───────────────────────────────────┘                       │
│                                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                          │
│  ILLEGAL WRITERS (External Systems Override Authority)           │
│  ┌───────────────────────────────────┐                       │
│  │ _SafeEvolutionManager.js        │                       │
│  │ _SafeLegendaryNodePack.js      │                       │
│  │ _SafeNodePersonalityFX.js      │                       │
│  │ ↓                           │                       │
│  │ │ userData.nodeId = id OR rand│                       │
│  └───────────────────────────────────┘                       │
│                                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                          │
│  LEGACY SYSTEMS (Read/Write id instead of nodeId)        │
│  ┌───────────────────────────────────┐                       │
│  │ HitProxySystem (read/write)      │                       │
│  │ HitProxyAutoRegistrar (write)     │                       │
│  │ SafeColonyExpansion (read)        │                       │
│  │ CoreMaterialPropertyLock (write)    │                       │
│  │ GlyphFusionOverlay (write)        │                       │
│  │ ControlSpineVariants (write)       │                       │
│  └───────────────────────────────────┘                       │
│                                                          │
└─────────────────────────────────────────────────────────────────┘
PHASE 1 FINDINGS
✅ SPAWN AUTHORITY (Correct)
AINodes.js is the ONLY legal writer of userData.nodeId
EnhancedNodeModels.create() should set nodeId (needs verification)
Clear single source of truth when hard lock applied
❌ ILLEGAL WRITERS (Must be fixed)
3 external systems override userData.nodeId outside spawn authority
These systems mirror userData.id to nodeId OR generate random nodeId
Violate single authority principle
Impact: Can create identity divergence
⚠️ LEGACY SYSTEMS (Need migration)
7 external systems use userData.id instead of userData.nodeId
These systems will continue to work after hard lock (via id mirror)
Status: Safe but deprecated
Future: Should migrate to use nodeId directly
❌ FALLBACK MASKS (To be removed)
2 locations use OR-chain fallbacks (nodeId || id || uuid)
These bypass canonical authority
Status: Will fail silently after hard lock
Impact: Redundant logic, potential for bugs
NEXT STEPS (Phase 2)
Before Implementing Hard Lock
✅ VERIFY: EnhancedNodeModels.create() sets userData.nodeId consistently
✅ FIX ILLEGAL WRITERS: Remove/modify 3 external systems that override nodeId
✅ REMOVE FALLBACK MASKS: Replace OR-chain patterns with single-field access
✅ AUDIT LEGACY SYSTEMS: Document migration path for 7 systems
✅ APPLY HARD LOCK: Implement IDENTITY_HARD_LOCK_DIFF.md changes
SUMMARY
Scan Coverage: All .js files in workspace
Illegal Writers Found: 3 systems (SafeEvolution, SafeLegendary, SafeNodePersonality)
Legacy Systems Found: 7 systems (HitProxy, AutoRegistrar, ColonyExpansion, MaterialPropertyLock, FusionOverlay, ControlSpine, ControlSpineVariants)
Fallback Patterns Found: 2 OR-chain patterns
Spawn Authority: Clean (only AINodes.js writes nodeId)

Phase 1 Status: ✅ COMPLETE
Phase 2 Status: Ready to start (illegal writers must be fixed first)

No refactor yet - Authority map only, no code changes applied.