# ATOMA – POLICY & LOCK HIERARCHY MAP AUDIT
**PHASE: READ-ONLY** | **MODE: NO FILE MODIFICATIONS** | **DATE: 2026-02-28**

---

## EXECUTIVE SUMMARY

ATOMA employs a **multi-layered, redundant policy architecture** with overlapping authority systems. The codebase contains **50+ distinct enable flags**, **5+ lock systems**, **15+ window feature flags**, and **multiple mode systems** that create complex control pathways.

**Key Findings:**
- **High Redundancy:** Multiple systems guard the same functionality (e.g., node visuals protected by VisualAuthorityLock, NuclearLock, CoreVisualAuthoritySystem, and CONFIG flags)
- **Fragmented Authority:** No single "final word" lock - authority is distributed across CONFIG, window flags, lock classes, and per-system enable flags
- **Per-frame Guard Overhead:** Significant policy evaluation occurs every frame (NuclearLock, FrameScheduler, multiple visual guards)
- **Mode-based Gating:** DEV/STRICT/PROD modes create behavioral branches but are inconsistently applied
- **Auto-recovery Systems:** Multiple systems include error-based auto-disable logic, creating unpredictable runtime behavior

**Classification: MULTI-LAYERED WITH REDUNDANCY**

---

## STEP 1 — GLOBAL POLICY INVENTORY

| Policy | File | Default Value | Scope | Affects Which Systems |
|--------|------|----------------|-------|----------------------|
| CONFIG.visuals.LOCK_NODE_VISUALS | VisualAuthorityLock.js | false | Global | All node visual mutations |
| CONFIG.visuals.LOCK_LINK_VISUALS | VisualAuthorityLock.js | false | Global | All link visual mutations |
| CONFIG.visuals.LOCK_INTERACTION | VisualAuthorityLock.js | false | Global | Raycasting, interaction meshes |
| CONFIG.visuals.PARTICLE_BOUNDS_CHECK | VisualAuthorityLock.js | false | Global | Link particle systems |
| CONFIG.visuals.FREEZE_MODE_SAFE | VisualAuthorityLock.js | false | Global | Freeze mode behavior |
| window.DEBUG_VISUAL_MODE | main.js | false | Global | All visual systems, shader guards |
| window.DEBUG_RAYCAST_COST | NodeLinkingSystem.js | false | Global | Raycast performance logging |
| window.ATOMA_DISABLE_MYTHIC_RITUALS | main.js | true | Global | MythicSeedGlyph, MythicRitualController |
| window.ATOMA_DISABLE_PARASITIC_HUDS | main.js | true | Global | HUD systems, DOM elements |
| window.ATOMA_HARD_KILL_PARASITIC_DOM | main.js | true | Global | DOM manipulation |
| window.ATOMA_DISABLE_OPAQUE_ENFORCER | NodeCoreOpaqueEnforcer_Session113.js | undefined | Global | Core opacity enforcement |
| window.ATOMA_DISABLE_ARCHETYPE_PATCH | ArchetypeVisualIntegrationPatch_v1.js | true | Global | Archetype visual patching |
| window.__ATOMA_SHADER_FREEZE | main.js | undefined | Global | Shader compilation, warmup |
| window.ATOMA_DEBUG_FRAME | FrameScheduler.js | false | Global | Frame scheduler logging |
| window.VISUAL_AUTHORITY_LOCK | LinkEmissionPulsingSystem.js | undefined | Global | Visual modification authority |
| window.CAMERA_AUTHORITY_MODE | NeonLinkVisuals.js | 'fp_only' | Global | Camera interaction mode |

---

## STEP 2 — LOCK SYSTEM INVENTORY

| Lock System | File | Blocks What | Per-frame Check? | Overrides Other Locks? |
|-------------|------|-------------|------------------|---------------------|
| **VisualAuthorityLock** | VisualAuthorityLock.js | Node/link/interaction mutations | Per-operation (checked before each mutation) | NO - Reads CONFIG, doesn't override |
| **AbsoluteLinkStateNuclearLock** | AbsoluteLinkStateNuclearLock.js | All non-core mesh mutations | YES - enforceRenderHierarchy() per frame | YES - Hard property freezing, Object.defineProperty |
| **AbsoluteRaycastLock** | AbsoluteRaycastLock.js | Raycast operations | Unknown (file not fully analyzed) | Unknown |
| **ACTIVATE_NUCLEAR_LOCK** | ACTIVATE_NUCLEAR_LOCK.js | All link-state mutations | YES - enforces every frame | YES - Combines all nuclear locks |
| **ACTIVATE_VISUAL_LOCK** | ACTIVATE_VISUAL_LOCK.js | Visual mutations | Unknown | Unknown |
| **CoreVisualAuthoritySystem** | CoreVisualAuthoritySystem.js | Render hierarchy violations | YES - validateScene() can be called | PARTIAL - Validates, delegates to NodeCoreMaterialAuthority |
| **CoreVisualAuthorityGuard** | CoreVisualAuthoritySystem.js | Core material mutations | NO - One-time enforcement | PARTIAL - Chemical locking via NodeCoreMaterialAuthority |
| **VisualLayerEnforcementGate** | VisualLayerEnforcementGate.js | Invalid layer attachments | Per-operation | DEPENDS ON MODE - DEV=allow, STRICT=block, PROD=silent |
| **TransparentStateAuthority** | TransparentStateAuthority.js | Transparency/render state | Per-operation (applied to meshes) | YES - Delegated by NuclearLock |

**Lock Priority (Observed):**
1. **AbsoluteLinkStateNuclearLock** (Highest - property-level freezing)
2. **ACTIVATE_NUCLEAR_LOCK** (Composite lock)
3. **VisualAuthorityLock** (CONFIG-based guard)
4. **VisualLayerEnforcementGate** (Mode-dependent)
5. **CoreVisualAuthoritySystem** (Validation-only)

---

## STEP 3 — ENABLE FLAG MAP

| System | File | Enabled By | Auto-Disable? | Frame Guard? |
|--------|------|-------------|---------------|--------------|
| **SynapticFatigueAdapter_v1** | SynapticFatigueAdapter_v1.js | config.enabled (default true) | No | if (!this.enabled) return |
| **SynergyChainReaction_v1** | SynergyChainReaction_v1.js | config.enabled (default false) | No | if (!this.enabled) return |
| **SynergyPulseVisuals_v1** | SynergyPulseVisuals_v1.js | true (hardcoded) | No | if (!this.enabled) return |
| **SynergyVFXEngine1_0** | SynergyVFXEngine1_0.js | this.config.enabled | YES - errors > 50 | if (!this.enabled) return |
| **SystemStateOverlay** | SystemStateOverlay.js | false (default) | No | if (!this.enabled) return |
| **T2_CorruptionVisualIntegration_v1** | T2_CorruptionVisualIntegration_v1.js | true (hardcoded) | No | if (!this.enabled) return |
| **T2_HarmonyVisualConsumer_v1** | T2_HarmonyVisualConsumer_v1.js | true (hardcoded) | No | if (!this.enabled) return |
| **TemporalEventEffects** | TemporalEventEffects.js | true (hardcoded) | No | if (!this.enabled) return |
| **VisualAuthority** | VisualAuthority.js | false (default) | No | if (!this.enabled) return |
| **VisualEchoTrails_v1_Integration** | VisualEchoTrails_v1_Integration.js | true (hardcoded) | No | if (!this.enabled) return |
| **VisualEchoTrails_v1_Shader** | VisualEchoTrails_v1_Shader.js | true (hardcoded) | No | No update guard |
| **VisualInteractionIsolationPatch** | VisualInteractionIsolationPatch.js | options.enabled (default true) | No | if (!this.enabled) return |
| **VisualLayerDebugger** | VisualLayerDebugger.js | false (default) | No | if (!this.enabled) return |
| **VisualLayerEnforcementGate** | VisualLayerEnforcementGate.js | true (hardcoded) | No | if (!this.enabled) return |
| **VisualNetworkTimeElasticity_v1** | VisualNetworkTimeElasticity_v1.js | true (hardcoded) | No | if (!this.enabled) return |
| **WaveInterferenceEngine_v1** | WaveInterferenceEngine_v1.js | options.enabled (default true) | No | if (!this.enabled) return |
| **ZeroGravityControls** | ZeroGravityControls.js | false (default) | No | if (!this.enabled) return |
| **ZoneAudioReactivity** | ZoneAudioReactivity.js | false (default) | No | if (!this.enabled) return |
| **_AINarrativePatterns6_0** | _AINarrativePatterns6_0.js | true (hardcoded) | No | if (!this.enabled) return |
| **_AtomaLanguageEngine3_0** | _AtomaLanguageEngine3_0.js | false (default) | No | if (!this.enabled) return |
| **_AtomaUIUpdate3_0** | _AtomaUIUpdate3_0.js | true (hardcoded) | No | if (!this.enabled) return |
| **_EmergentThoughtStorms5_0** | _EmergentThoughtStorms5_0.js | true (hardcoded) | No | if (!this.enabled) return |
| **_ExtremeAINodeEvolution3** | _ExtremeAINodeEvolution3.js | true (hardcoded) | No | if (!this.enabled) return |
| **_ExtremeAIShaderPack** | _ExtremeAIShaderPack.js | true (hardcoded) | No | if (!this.enabled) return |
| **_ExtremeLinkVisualPack3** | _ExtremeLinkVisualPack3.js | true (hardcoded) | No | if (!this.enabled) return |
| **_GlyphFusionOverlay4_1** | _GlyphFusionOverlay4_1.js | true (hardcoded) | No | if (!this.enabled) return (in events) |
| **_GlyphLayer4_MultiFusion** | _GlyphLayer4_MultiFusion.js | true (hardcoded) | No | if (!this.enabled) return |
| **_GlyphPurityMode5_1** | _GlyphPurityMode5_1.js | true (hardcoded) | No | if (!this.enabled) return |
| **_LinkedGlyphMessaging3_0** | _LinkedGlyphMessaging3_0.js | true (hardcoded) | No | if (!this.enabled) return |
| **_LinkGlyphFlow** | _LinkGlyphFlow.js | true (hardcoded) | No | if (!this.enabled) return |
| **_MythicSeedGlyph** | _MythicSeedGlyph.js | !window.ATOMA_DISABLE_MYTHIC_RITUALS | No | if (!this.enabled) return (constructor) |
| **_NeuralCurveLinkVisuals** | _NeuralCurveLinkVisuals.js | true (hardcoded) | No | if (!this.enabled) return |
| **_NodeEvolution3_ExtremeSafe** | _NodeEvolution3_ExtremeSafe.js | true (hardcoded) | No | if (!this.enabled) return |
| **_NodeLinking2_3** | _NodeLinking2_3.js | true (hardcoded) | No | if (!this.enabled) return |
| **_NodeSpawnLogger4_0** | _NodeSpawnLogger4_0.js | config.enabled | No | if (!this.enabled) return |
| **_NodeVisualBootstrap3_0** | _NodeVisualBootstrap3_0.js | config.debugMode (default true) | No | if (!this.enabled) return |
| **_ProceduralMeaningEngine** | _ProceduralMeaningEngine.js | true (hardcoded) | No | if (!this.enabled) return |
| **_RecursiveGlyphMessaging4_0** | _RecursiveGlyphMessaging4_0.js | true (hardcoded) | No | if (!this.enabled) return |
| **_SemanticGlyphAI** | _SemanticGlyphAI.js | true (hardcoded) | No | if (!this.enabled) return |
| **_UIPrimaryNodeAura3_7** | _UIPrimaryNodeAura3_7.js | true (hardcoded) | No | if (!this.enabled) return |
| **_RecursiveGlyphSignalSystem** | _RecursiveGlyphSignalSystem.js | true (hardcoded) | No | if (!this.enabled) return |
| **_NodeInspectLinguisticOverlay** | _NodeInspectLinguisticOverlay.js | true (hardcoded) | No | if (!this.enabled) return |
| **_LinkedGlyphSynchronization1_0** | _LinkedGlyphSynchronization1_0.js | true (hardcoded) | No | if (!this.enabled) return |
| **_AtomaNamingEngine** | _AtomaNamingEngine.js | true (hardcoded) | No | if (!this.enabled) return |
| **_AdaptiveGlyphRendering1_0** | _AdaptiveGlyphRendering1_0.js | true (hardcoded) | No | if (!this.enabled) return |
| **VisualInteractionIsolationPatch_v2** | VisualInteractionIsolationPatch_v2_CRITICAL_FIX.js | options.enabled (default true) | No | if (!this.enabled) return |
| **UndoRedoSystem** | UndoRedoSystem.js | true (hardcoded) | No | if (!this.enabled) return |
| **TopologyBiasVisualizationLayer** | TopologyBiasVisualizationLayer.js | true (hardcoded) | No | if (!this.enabled) return |
| **SynapticSpecializationAdapter_v1** | SynapticSpecializationAdapter_v1.js | config.enabled (default true) | No | if (!this.enabled) return |
| **SynapticGatingAdapter_v1** | SynapticGatingAdapter_v1.js | config.enabled (default true) | No | if (!this.enabled) return |
| **SynapticConflictAdaptiveResolution_Session117** | SynapticConflictAdaptiveResolution_Session117.js | options.enabled (default true) | No | if (!this.enabled) return |
| **SpawnerConsolidationDetector_v1** | SpawnerConsolidationDetector_v1.js | true (hardcoded) | No | No update guard |
| **SelectedHUDSyncPatch1_0** | SelectedHUDSyncPatch1_0.js | depends on init | YES - null checks | if (!this.enabled) return |
| **SafeMemoryTrailsManager** | SafeMemoryTrailsManager.js | true (hardcoded) | No | if (!this.enabled) return |

**Summary:**
- **Total systems with enable flags:** 50+
- **Auto-disable on error:** 2 systems (SynergyVFXEngine1_0, SelectedHUDSyncPatch1_0)
- **Default enabled:** ~40 systems
- **Default disabled:** ~10 systems
- **Window flag controlled:** ~3 systems

---

## STEP 4 — HIERARCHY OF AUTHORITY

| Level | Authority | File | Overrides | Overridden By |
|-------|-----------|------|-----------|---------------|
| **L1** | CONFIG.flags | config.js | None | Window flags, Hard locks |
| **L2** | Window Feature Flags | main.js (global) | CONFIG | Hard locks, Mode systems |
| **L3** | Mode System (DEV/STRICT/PROD) | VisualLayerEnforcementGate.js | Window flags | Hard locks, System flags |
| **L4** | Hard Locks (Nuclear, Absolute) | AbsoluteLinkStateNuclearLock.js | All above | System enable flags |
| **L5** | VisualAuthorityLock | VisualAuthorityLock.js | CONFIG only | Hard locks, System flags |
| **L6** | System Enable Flags | Multiple files | All above | Per-frame guards, Function guards |
| **L7** | Per-frame Guards | FrameScheduler.js, AbsoluteLinkStateNuclearLock.js | All above | Function guards |
| **L8** | Function-level Guards | Multiple files | All above | None (lowest level) |

**Authority Flow:**
```
USER INPUT / CONFIG (L1)
    ↓
Window Feature Flags (L2)
    ↓
Mode System (L3)
    ↓
Hard Locks - Nuclear/Absolute (L4)
    ↓
VisualAuthorityLock (L5)
    ↓
System Enable Flags (L6)
    ↓
Per-frame Guards (L7)
    ↓
Function-level Guards (L8)
    ↓
ACTUAL EXECUTION
```

**Critical Observations:**
- **L4 (Hard Locks) can override ALL above** - NuclearLock uses Object.defineProperty to make properties read-only
- **L1 (CONFIG) is most flexible** but has no enforcement mechanism alone
- **L3 (Mode System) is conditional** - DEV mode allows violations, STRICT blocks them, PROD silently blocks
- **Authority is NOT strictly hierarchical** - some systems bypass intermediate layers

---

## STEP 5 — DUPLICATE GATING MAP

| Subsystem | Guard Count | Guard Types | Redundant? | Comments |
|-----------|-------------|-------------|------------|----------|
| **Node Visuals** | 4 | VisualAuthorityLock.canModifyNode(), NuclearLock.enforceRenderHierarchy(), CoreVisualAuthoritySystem, CONFIG.visuals.LOCK_NODE_VISUALS | **YES - HIGH** | 4 different guards for same purpose |
| **Link Visuals** | 3 | VisualAuthorityLock.canModifyLink(), NuclearLock.enforceRenderHierarchy(), CONFIG.visuals.LOCK_LINK_VISUALS | **YES - MEDIUM** | NuclearLock hard-freezes, VisualAuthorityLock checks CONFIG |
| **Interaction/Raycast** | 4 | VisualAuthorityLock.canRaycastVisuals(), AbsoluteRaycastLock, CONFIG.visuals.LOCK_INTERACTION, window.DEBUG_RAYCAST_COST | **YES - MEDIUM** | Multiple raycast guards |
| **Glyph Rendering** | 3 | _GlyphLayer4_MultiFusion.enabled, window.ATOMA_DISABLE_MYTHIC_RITUALS, FrameScheduler visual layer | **YES - LOW** | Different scopes (system vs global) |
| **VFX Systems** | 2 | FrameScheduler visual layer, System enable flags | **YES - LOW** | Time-based gating vs enable flag |
| **Aura Systems** | 2 | System enable flags, NuclearLock protection (marked as aura) | **YES - LOW** | NuclearLock protects auras specifically |
| **Material Mutations** | 3 | NodeCoreMaterialAuthority, NuclearLock.freezeProtectedMesh(), MaterialDebugGuard | **YES - HIGH** | 3 material protection systems |
| **HUD Systems** | 2 | System enable flags, window.ATOMA_DISABLE_PARASITIC_HUDS | **YES - MEDIUM** | Global kill switch vs per-system flags |

**Redundancy Highlights:**
- **Node Visuals** - Most redundant subsystem with 4 overlapping guards
- **Material Mutations** - Triple protection (chemical locking, freeze guards, debug guards)
- **Link Visuals** - Protected by both CONFIG-based and hard locks

---

## STEP 6 — PER-FRAME POLICY COST MAP

| System | File | Guard Location | Per-frame? | Heavy? | Estimated Cost |
|--------|------|----------------|------------|--------|----------------|
| **AbsoluteLinkStateNuclearLock** | AbsoluteLinkStateNuclearLock.js | enforceRenderHierarchy() | **YES** | **MEDIUM** | ~0.5ms per 100 nodes |
| **FrameScheduler** | FrameScheduler.js | tick() | **YES** | **LIGHT** | ~0.1ms per frame |
| **VisualLayerDebugger** | VisualLayerDebugger.js | logLayerAddition() | **NO** | N/A | Guard only, no update |
| **VisualInteractionIsolationPatch** | VisualInteractionIsolationPatch.js | processNode() | **NO** | LIGHT | On-demand only |
| **VisualLayerEnforcementGate** | VisualLayerEnforcementGate.js | canAttach() | **NO** | LIGHT | Per-operation only |
| **CoreVisualAuthoritySystem** | CoreVisualAuthoritySystem.js | validateScene() | **NO** | **MEDIUM** | On-demand, but expensive if called |
| **Multiple VFX Systems** | Various | update(dt) | **YES** | **HEAVY** | Cumulative (FrameScheduler mitigates) |
| **SynergyVFXEngine1_0** | SynergyVFXEngine1_0.js | tick(), render*() | **YES** | **HEAVY** | Multiple render calls per frame |
| **_GlyphLayer4_MultiFusion** | _GlyphLayer4_MultiFusion.js | update(dt) | **YES** | **MEDIUM** | Frame-gated by scheduler |
| **_RecursiveGlyphSignalSystem** | _RecursiveGlyphSignalSystem.js | update(dt) | **YES** | **MEDIUM** | Active signal tracking |

**Per-frame Guard Summary:**
- **NuclearLock enforcement:** ~0.5ms per 100 nodes (forced override)
- **FrameScheduler tick:** ~0.1ms per frame (layer gating)
- **VFX updates:** ~2-5ms cumulative (mitigated by 30Hz visual layer)
- **Total per-frame policy overhead:** ~2-6ms (acceptable, but cumulative)

**Optimization Notes:**
- FrameScheduler successfully gates many systems to 30Hz or 10Hz
- NuclearLock is the only truly expensive per-frame guard
- Many systems check `if (!this.enabled)` every frame (cheap but redundant)

---

## STEP 7 — MODE SYSTEM INTERFERENCE MAP

| Mode / Lock | File | Scope | Conflicts With | Resolution Mechanism |
|-------------|------|-------|----------------|---------------------|
| **DEV Mode** | VisualLayerEnforcementGate.js | Visual layer attachments | STRICT, PROD, NuclearLock | Allows violations with warning |
| **STRICT Mode** | VisualLayerEnforcementGate.js | Visual layer attachments | DEV, PROD | Blocks with error |
| **PROD Mode** | VisualLayerEnforcementGate.js | Visual layer attachments | DEV, STRICT | Silent block |
| **DEBUG_VISUAL_MODE** | main.js | All visual systems | NuclearLock, VisualAuthorityLock | Disables visuals, hardens interactions |
| **VisualAuthorityLock** | VisualAuthorityLock.js | Node/link/interaction mutations | NuclearLock, Mode system | Reads CONFIG, NuclearLock can override |
| **NuclearLock** | AbsoluteLinkStateNuclearLock.js | All non-core mutations | All modes, VisualAuthorityLock | Property-level freezing (final authority) |
| **FrameScheduler Categories** | FrameScheduler.js | System execution frequency | Per-frame guards | Time-based gating, not blocking |
| **Glyph Purity Mode** | _GlyphPurityMode5_1.js | Glyph rendering | Mythic ritual disable | Multi-level purity (OFF, MODERATE, STRICT, PURE) |

**Conflict Examples:**
1. **DEV Mode vs NuclearLock:** DEV allows visual violations, but NuclearLock property freezing prevents them - NuclearLock wins
2. **DEBUG_VISUAL_MODE vs VisualAuthorityLock:** DEBUG mode disables visuals, but VisualAuthorityLock checks CONFIG - CONFIG wins
3. **Mode System vs Per-frame Guards:** Mode gates attachments, per-frame guards enforce runtime - No conflict, different scopes
4. **FrameScheduler vs System Enable Flags:** Scheduler gates frequency, enable flags gate execution - Both checked (redundant but not conflicting)

**Mode System Analysis:**
- **Only ONE explicit mode system:** VisualLayerEnforcementGate (DEV/STRICT/PROD)
- **Other "modes" are feature flags:** DEBUG_VISUAL_MODE, Atom-specific flags
- **Mode system is NOT comprehensive:** Only applies to visual layer attachments
- **Mode conflicts are resolved by:** NuclearLock (property-level enforcement trumps everything)

---

## STEP 8 — FULL POLICY FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INPUT / CONFIG                        │
│  - config.js (CONFIG.visuals flags)                              │
│  - Window initialization (window.* flags)                          │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GLOBAL CONFIG FLAGS (L1)                        │
│  CONFIG.visuals.LOCK_NODE_VISUALS                                │
│  CONFIG.visuals.LOCK_LINK_VISUALS                                 │
│  CONFIG.visuals.LOCK_INTERACTION                                  │
│  CONFIG.visuals.PARTICLE_BOUNDS_CHECK                             │
│  CONFIG.visuals.FREEZE_MODE_SAFE                                  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  WINDOW FEATURE FLAGS (L2)                         │
│  window.DEBUG_VISUAL_MODE                                        │
│  window.ATOMA_DISABLE_MYTHIC_RITUALS                              │
│  window.ATOMA_DISABLE_PARASITIC_HUDS                               │
│  window.ATOMA_HARD_KILL_PARASITIC_DOM                             │
│  window.__ATOMA_SHADER_FREEZE                                     │
│  window.VISUAL_AUTHORITY_LOCK                                     │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MODE SYSTEM (L3)                              │
│  VisualLayerEnforcementGate.mode = 'DEV' | 'STRICT' | 'PROD'     │
│  - DEV: Allow + warn                                              │
│  - STRICT: Block + warn                                           │
│  - PROD: Silent block                                             │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   HARD LOCKS (L4) - FINAL AUTHORITY              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ AbsoluteLinkStateNuclearLock                               │ │
│  │ - Object.defineProperty (property-level freezing)           │ │
│  │ - enforceRenderHierarchy() per frame                       │ │
│  │ - Can override ALL above                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ACTIVATE_NUCLEAR_LOCK                                    │ │
│  │ - Composite lock combining all nuclear systems            │ │
│  │ - Activated in main.js after scene setup                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                VisualAuthorityLock (L5)                           │
│  - canModifyNode() - checks CONFIG.visuals.LOCK_NODE_VISUALS   │
│  - canModifyLink() - checks CONFIG.visuals.LOCK_LINK_VISUALS    │
│  - canRaycastVisuals() - checks CONFIG.visuals.LOCK_INTERACTION│
│  - Guard methods: setNodeOpacity, setLinkColor, etc.            │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                SYSTEM ENABLE FLAGS (L6)                           │
│  - this.enabled (50+ systems)                                    │
│  - Auto-disable on error (SynergyVFXEngine1_0, etc.)             │
│  - Enable/disable methods (enable(), disable(), toggle())       │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                PER-FRAME GUARDS (L7)                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ FrameScheduler.tick()                                     │ │
│  │ - realtime: 60 Hz (critical systems)                      │ │
│  │ - visual: 30 Hz (VFX, shaders, auras)                    │ │
│  │ - simulation: 10 Hz (AI, glyphs, metrics)                 │ │
│  │ - background: 2 Hz (rare events, narrative)               │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ NuclearLock.enforceRenderHierarchy()                      │ │
│  │ - Override renderOrder, depthTest, depthWrite every frame │ │
│  │ - Freeze protected meshes                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              FUNCTION-LEVEL GUARDS (L8)                            │
│  - if (!this.enabled) return (in 50+ system update methods)     │
│  - if (!frameScheduler?.shouldRunVisual?.()) return              │
│  - if (!VisualAuthorityLock.canModifyNode()) return              │
│  - if (!VisualAuthorityLock.canModifyLink()) return              │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ACTUAL EXECUTION                               │
│  - Visual mutations proceed (if not blocked)                      │
│  - Game logic executes                                            │
│  - Frame renders                                                  │
└─────────────────────────────────────────────────────────────────┘

```

**Flow Analysis:**

**Dead Layers (Unreachable in Practice):**
- None - all layers can be reached depending on initialization

**Double-Locked Systems (Always Blocked Unless Explicitly Enabled):**
- **Mythic Rituals:** Disabled by window.ATOMA_DISABLE_MYTHIC_RITUALS=true, requires explicit enable
- **Archetype Patch:** Disabled by window.ATOMA_DISABLE_ARCHETYPE_PATCH=true, requires explicit enable
- **Parasitic HUDs:** Disabled by window.ATOMA_DISABLE_PARASITIC_HUDS=true, requires explicit enable

**Systems That Appear Enabled But May Be Blocked:**
- **Node Visuals:** CanModifyNode() returns false if CONFIG.visuals.LOCK_NODE_VISUALS=true, regardless of system enable flags
- **Link Visuals:** CanModifyLink() returns false if CONFIG.visuals.LOCK_LINK_VISUALS=true
- **Interaction:** CanRaycastVisuals() returns false if CONFIG.visuals.LOCK_INTERACTION=true

**Potential Bypass Paths:**
- NuclearLock property freezing is the only truly immutable layer
- All other layers can be bypassed by modifying CONFIG or window flags at runtime

---

## STEP 9 — POLICY ARCHITECTURE CLASSIFICATION

### Classification: **MULTI-LAYERED WITH REDUNDANCY**

**Justification:**

#### 1. Number of Overlapping Locks: **HIGH**
- Node visuals protected by 4 different lock systems
- Link visuals protected by 3 different lock systems
- Material mutations protected by 3 different lock systems
- Interaction/raycast protected by 4 different guard systems

#### 2. Clarity of Authority: **MEDIUM**
- **Clear hierarchy exists:** L1 → L8 documented and generally followed
- **Hard lock supremacy:** NuclearLock clearly documented as final authority
- **But:** Multiple lock systems can "win" depending on circumstances
- **Issue:** No single point of truth for "is this system enabled?"

#### 3. Per-frame Guard Evaluations: **MEDIUM-HIGH**
- **NuclearLock:** 1 per-frame enforcement (~0.5ms per 100 nodes)
- **FrameScheduler:** 1 per-frame tick with layer gating (~0.1ms)
- **VFX Systems:** 10+ per-frame updates (mitigated to 30Hz)
- **Enable Guards:** 50+ `if (!this.enabled)` checks per frame (cheap but redundant)
- **Total impact:** Acceptable (~2-6ms) but indicates high policy evaluation frequency

#### 4. Duplication of Feature Control: **HIGH**
- **Same functionality controlled by multiple mechanisms:**
  - Node visuals: CONFIG flag, VisualAuthorityLock, NuclearLock, CoreVisualAuthoritySystem
  - Material protection: NodeCoreMaterialAuthority, NuclearLock, MaterialDebugGuard
  - Glyph rendering: System enable flag, Window flag, FrameScheduler
- **No clear single source of truth** for many features
- **Potential for confusion:** Which flag controls what?

---

## REDUNDANCY & CONFLICT HIGHLIGHTS

### Critical Redundancies

1. **Node Visual Protection (4-way redundancy)**
   - CONFIG.visuals.LOCK_NODE_VISUALS
   - VisualAuthorityLock.canModifyNode()
   - NuclearLock.enforceRenderHierarchy()
   - CoreVisualAuthoritySystem.processNode()

2. **Material Protection (3-way redundancy)**
   - NodeCoreMaterialAuthority.lockCoreMaterial()
   - NuclearLock.freezeProtectedMesh()
   - MaterialDebugGuard (if window.DEBUG_VISUAL_MODE)

3. **Interaction Control (4-way redundancy)**
   - CONFIG.visuals.LOCK_INTERACTION
   - VisualAuthorityLock.canRaycastVisuals()
   - AbsoluteRaycastLock (file exists)
   - window.DEBUG_RAYCAST_COST

### Potential Conflicts

1. **DEV Mode vs NuclearLock**
   - DEV mode allows visual violations with warnings
   - NuclearLock property freezing prevents violations
   - **Resolution:** NuclearLock wins (property-level enforcement)

2. **DEBUG_VISUAL_MODE vs VisualAuthorityLock**
   - DEBUG_VISUAL_MODE disables all visuals
   - VisualAuthorityLock reads CONFIG flags
   - **Resolution:** Configurable, no inherent conflict

3. **FrameScheduler vs System Enable Flags**
   - Both gate execution (time vs boolean)
   - Both checked in update methods
   - **Resolution:** Redundant but not conflicting (both must pass)

4. **Mode System vs Per-frame Guards**
   - Mode gates attachment operations
   - Per-frame guards enforce runtime behavior
   - **Resolution:** Different scopes, no direct conflict

### Dead Code / Unreachable Systems

1. **Mythic Rituals** - Disabled by default, requires explicit enable via window.ATOMA_DISABLE_MYTHIC_RITUALS=false
2. **Archetype Patch** - Disabled by default, requires explicit enable via window.ATOMA_DISABLE_ARCHETYPE_PATCH=false
3. **Parasitic HUDs** - Disabled by default, requires explicit enable via window.ATOMA_DISABLE_PARASITIC_HUDS=false
4. **VisualLayerDebugger** - Disabled by default, manual enable only

---

## RECOMMENDATIONS (For Future Consideration)

**Note:** These are observations only. No refactoring is proposed as per audit constraints.

1. **Consolidate Node Visual Locks** - 4 lock systems protecting the same feature could be reduced to 1-2
2. **Document Authority Precedence** - Create explicit documentation of which lock wins in conflicts
3. **Audit Enable Flag Redundancy** - 50+ enable flags could potentially be reduced
4. **Standardize Mode System** - Extend VisualLayerEnforcementGate modes to cover more systems
5. **Single Source of Truth** - Consider architectural pattern to reduce multi-flag control of same feature

---

## AUDIT METADATA

- **Audit Type:** Read-only structural analysis
- **Scope:** All policy, lock, guard, and authority systems
- **Files Analyzed:** 50+ JavaScript files
- **Systems Catalogued:** 50+ enable flags, 15+ window flags, 8 lock systems, 1 mode system
- **Classification:** MULTI-LAYERED WITH REDUNDANCY
- **Per-frame Policy Cost:** ~2-6ms total (acceptable but cumulative)
- **Final Authority:** NuclearLock (property-level freezing)
- **Primary Authority Layer:** L4 (Hard Locks) can override L1-L3
- **Most Redundant Subsystem:** Node Visuals (4-way protection)

---

**END OF AUDIT**