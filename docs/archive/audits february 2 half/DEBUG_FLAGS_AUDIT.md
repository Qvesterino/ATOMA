# ATOMA Debug Flags Audit Report
**Phase DBG-AUDIT-1: Global Debug Switches Discovery**

Generated: 2025-02-08
Scope: Entire ATOMA codebase
Analysis: Systematic search for global debug controls, console commands, and window-level flags

---

## 1. Global Debug Flags

### 1.1 Core ATOMA Debug Flags

#### Flag: `window.ATOMA_DEBUG`
- **Default:** `false`
- **Location(s):**
  - `MaterialMutationDetector.js:25`
  - `main.js:371`
- **Effect:** Master debug flag for general ATOMA debugging
- **Usage:** `window.ATOMA_DEBUG = true`

#### Flag: `window.ATOMA_DEBUG_FRAME`
- **Default:** `false`
- **Location(s):**
  - `main.js:389`
  - `FrameScheduler.js:4`
- **Effect:** Enables frame-level debug logging
- **Usage:** `window.ATOMA_DEBUG_FRAME = true`

#### Flag: `window.ATOMA_DEBUG_SHADER`
- **Default:** `false`
- **Location(s):**
  - `main.js:390`
  - `Engine/Debug/ShaderFreezeGuard.js:5`
  - `Engine/Debug/ShaderVariantDetector.js:5`
  - `MaterialMutationDetector.js:8`
- **Effect:** Enables shader-specific debug logging
- **Usage:** `window.ATOMA_DEBUG_SHADER = true`

#### Flag: `window.ATOMA_DEBUG_LINK`
- **Default:** `false`
- **Location(s):**
  - `main.js:391`
  - `NodeLinkingSystem.js:9`
- **Effect:** Enables link system debug logging
- **Usage:** `window.ATOMA_DEBUG_LINK = true`

#### Flag: `window.ATOMA_DEBUG_WORLD`
- **Default:** `false`
- **Location(s):**
  - `main.js:392`
- **Effect:** Enables world event debug logging
- **Usage:** `window.ATOMA_DEBUG_WORLD = true`

#### Flag: `window.ATOMA_DEBUG_CADENCE`
- **Default:** `false`
- **Location(s):**
  - `main.js:393`
- **Effect:** Enables cadence/scheduling debug logging
- **Usage:** `window.ATOMA_DEBUG_CADENCE = true`

#### Flag: `window.ATOMA_DEBUG_MATERIAL_MUTATIONS`
- **Default:** `false`
- **Location(s):**
  - `main.js:394`
  - `MaterialMutationDetector.js:17`
  - `MaterialMutationDetector.js:42`
- **Effect:** Tracks and logs material property mutations
- **Usage:** `window.ATOMA_DEBUG_MATERIAL_MUTATIONS = true`

#### Flag: `window.ATOMA_DEBUG_WORLD_FX`
- **Default:** `false`
- **Location(s):**
  - `_SafeWorldFXPack.js:28`
  - `_SafeWorldFXPack.js:42`
- **Effect:** Logs world FX system updates
- **Usage:** `window.ATOMA_DEBUG_WORLD_FX = true`

#### Flag: `window.ATOMA_DEBUG_LINK_VISUALS`
- **Default:** `false`
- **Location(s):**
  - `NodeLinkingSystem.js:1676`
- **Effect:** Logs link visualization operations
- **Usage:** `window.ATOMA_DEBUG_LINK_VISUALS = true`

#### Flag: `window.ATOMA_DEBUG_ARCHETYPE`
- **Default:** `false`
- **Location(s):**
  - `ArchetypeVisualDifferentiationSystem_v1.js:95`
- **Effect:** Logs archetype visual operations
- **Usage:** `window.ATOMA_DEBUG_ARCHETYPE = true`

---

### 1.2 Visual Control Flags

#### Flag: `window.ATOMA_VISUAL_BASELINE`
- **Default:** `true`
- **Location(s):**
  - `main.js:377`
  - `_NodeEvolution2_0.js:67`
  - `_NodeMicroEvents.js:29`
  - `_NodeVisuals4_0.js:73`, `79`, `92`, `110`
  - `NodePersonality2_0.js:17`, `24`, `36`, `57`
  - `NodePersonalitySystem2_0.js:23`
  - `NodeLinkedAuraSystem.js:11`
  - `NodeShellSizeAuthority.js:22`
- **Effect:** Disables all visual updates when true (baseline mode)
- **Usage:** `window.ATOMA_VISUAL_BASELINE = false` (to enable visuals)

#### Flag: `window.VISUAL_AUTHORITY_LOCK`
- **Default:** `true` (set by HARD_AUTHORITY_SYSTEM)
- **Location(s):**
  - `HARD_AUTHORITY_DEBUG_API.js:21`, `30`
  - `HARD_INTERACTION_AUTHORITY_SYSTEM.js:16`, `23`, `29`, `34`
  - `main.js:426`
  - `SafeMetricsFX1_1.js:32`
  - `NeonLinkVisuals.js:53`
  - `_NodeMicroEvents.js:30`
  - `NodeSurfaceProtectionRule_v2.js:28`
- **Effect:** Hard lock preventing visual mutations
- **Usage:** `window.VISUAL_AUTHORITY_LOCK = false`

#### Flag: `window.DEBUG_VISUAL_MODE`
- **Default:** `true`
- **Location(s):**
  - `main.js:413`
  - `MaterialDebugGuard_v1.js:6`, `12`, `19`
  - `MaterialRegistry_v1.js:17`
  - `SafeMetricsFX1_1.js:33`
  - `NeonLinkVisuals.js:54`, `523`
  - `AINodes.js:551`
  - `AINodeModel.js:326`
  - `_NodeMicroEvents.js:29`
- **Effect:** Disables visuals and hardens interactions
- **Usage:** `window.DEBUG_VISUAL_MODE = false`

#### Flag: `window.ATOMA_LINK_VISUALS_ENABLED`
- **Default:** `true`
- **Location(s):**
  - `NodeVisualStateBinder.js:8`
  - `NodeLinkingSystem.js:1664`
- **Effect:** Toggles link rendering
- **Usage:** `window.ATOMA_LINK_VISUALS_ENABLED = false`

#### Flag: `window.VISUAL_TIME`
- **Default:** `undefined`
- **Location(s):**
  - `main.js:726`
- **Effect:** Stores visual network time for animation systems
- **Usage:** Set automatically by main.js, read-only

---

### 1.3 Performance & Safety Flags

#### Flag: `window.DEBUG_RAYCAST_COST`
- **Default:** `false`
- **Location(s):**
  - `NodeLinkingSystem.js:24`, `29`, `36`
- **Effect:** Enables raycast cost profiling
- **Usage:** `window.DEBUG_RAYCAST_COST = true`

#### Flag: `window.DEBUG_RAYCAST_PROXY`
- **Default:** `false`
- **Location(s):**
  - `NodeLinkingSystem.js:1743`
- **Effect:** Logs hit-proxy raycast behavior
- **Usage:** `window.DEBUG_RAYCAST_PROXY = true`

#### Flag: `window.DEBUG_CAMERA_INTERACTION_LOAD`
- **Default:** `false`
- **Location(s):**
  - `NodeLinkingSystem.js:1732`
- **Effect:** Logs camera motion gating of raycasts
- **Usage:** `window.DEBUG_CAMERA_INTERACTION_LOAD = true`

#### Flag: `window.DEBUG_NODE_SELECTION`
- **Default:** `false`
- **Location(s):**
  - `_IntegrationNodeSelectionFix.js:16`, `22`, `30`
- **Effect:** Logs node selection resolution
- **Usage:** `window.DEBUG_NODE_SELECTION = true`

#### Flag: `window.DEBUG_PARTICLE_EMISSION`
- **Default:** `false`
- **Location(s):**
  - `ParticleEmissionRateScaling.js:16`
- **Effect:** Logs particle emission initialization
- **Usage:** `window.DEBUG_PARTICLE_EMISSION = true`

#### Flag: `window.DEBUG_LINK_PULSING`
- **Default:** `false`
- **Location(s):**
  - `LinkEmissionPulsingSystem.js:16`
- **Effect:** Logs link emission pulsing
- **Usage:** `window.DEBUG_LINK_PULSING = true`

#### Flag: `window.DEBUG_SYNERGY_COLORS`
- **Default:** `false`
- **Location(s):**
  - `LinkSynergyColorTransition.js:20`, `38`
- **Effect:** Logs synergy color transitions
- **Usage:** `window.DEBUG_SYNERGY_COLORS = true`

---

### 1.4 Feature Control Flags

#### Flag: `window.ATOMA_DISABLE_MYTHIC_RITUALS`
- **Default:** `true`
- **Location(s):**
  - `main.js:443`
  - `_MythicRitualController.js:11`
  - `_MythicSeedGlyph.js:14`
- **Effect:** Disables mythic ritual system
- **Usage:** `window.ATOMA_DISABLE_MYTHIC_RITUALS = false`

#### Flag: `window.ATOMA_DISABLE_OPAQUE_ENFORCER`
- **Default:** `false`
- **Location(s):**
  - `NodeCoreOpaqueEnforcer_Session113.js:13`, `23`
- **Effect:** Disables node core opacity enforcement
- **Usage:** `window.ATOMA_DISABLE_OPAQUE_ENFORCER = true`

#### Flag: `window.ATOMA_DISABLE_PARASITIC_HUDS`
- **Default:** `true`
- **Location(s):**
  - `main.js:374`
- **Effect:** Disables parasitic HUD elements
- **Usage:** `window.ATOMA_DISABLE_PARASITIC_HUDS = false`

#### Flag: `window.ATOMA_HARD_KILL_PARASITIC_DOM`
- **Default:** `true`
- **Location(s):**
  - `main.js:375`
- **Effect:** Hard-kill parasitic DOM elements
- **Usage:** `window.ATOMA_HARD_KILL_PARASITIC_DOM = false`

#### Flag: `window.ATOMA_DEBUG_HUD_ENABLED`
- **Default:** `false`
- **Location(s):**
  - `main.js:468`
- **Effect:** Enables debug HUD visibility
- **Usage:** `window.ATOMA_DEBUG_HUD_ENABLED = true`

---

### 1.5 Soak Test Flags

#### Flag: `window.ENABLE_SOAK_LOGGING`
- **Default:** `false`
- **Location(s):**
  - `SoakTestLogging_v1.js:17`, `23`
- **Effect:** Enables periodic logging of system state
- **Usage:** `window.ENABLE_SOAK_LOGGING = true`

#### Flag: `window.SOAK_LOG_INTERVAL`
- **Default:** `5.0`
- **Location(s):**
  - `SoakTestLogging_v1.js:19`, `27`
- **Effect:** Sets soak test log interval (seconds)
- **Usage:** `window.SOAK_LOG_INTERVAL = 10.0`

---

### 1.6 Shader & Material Debug Flags

#### Flag: `window.__ATOMA_SHADER_TRACE`
- **Default:** `true`
- **Location(s):**
  - `Engine/Debug/ShaderFreezeGuard.js:18`, `28`, `35`
  - `Engine/Debug/ShaderVariantDetector.js:23`, `38`
- **Effect:** Enables shader trace logging
- **Usage:** `window.__ATOMA_SHADER_TRACE = false`

#### Flag: `window.__ATOMA_SHADER_FREEZE`
- **Default:** `undefined`
- **Location(s):**
  - `main.js:453`, `457`
  - `Engine/Debug/MaterialFreezeGuard.js:6`
  - `Engine/Debug/ShaderFreezeGuard.js:6`
- **Effect:** Enables shader freeze guard
- **Usage:** `window.__ATOMA_SHADER_FREEZE = true`

#### Flag: `window.__ATOMA_DEBUG_LINK_MATS__`
- **Default:** `false`
- **Location(s):**
  - `LinkStateVisualLanguageIntegration.js:45`
  - `LinkAuraSystem_v1.js:45`
- **Effect:** Enables link material debugging
- **Usage:** `window.__ATOMA_DEBUG_LINK_MATS__ = true`

#### Flag: `window.__DEBUG_LINK_MATERIAL_DEDUP`
- **Default:** `true`
- **Location(s):**
  - `NeonLinkVisuals.js:50`
- **Effect:** Enables link material deduplication
- **Usage:** `window.__DEBUG_LINK_MATERIAL_DEDUP = false`

#### Flag: `window.__DEBUG_LINK_MATERIAL_DEDUP_LOG`
- **Default:** `false`
- **Location(s):**
  - `NeonLinkVisuals.js:54`
- **Effect:** Logs link material deduplication
- **Usage:** `window.__DEBUG_LINK_MATERIAL_DEDUP_LOG = true`

---

### 1.7 Frame Budget & Tracing Flags

#### Flag: `window.__DEBUG_FRAME_BUDGET_ENABLED`
- **Default:** `false`
- **Location(s):**
  - `main.js:405`
- **Effect:** Enables frame budget enforcement
- **Usage:** `window.__DEBUG_FRAME_BUDGET_ENABLED = true`

#### Flag: `window.__DEBUG_FRAME_BUDGET_MS`
- **Default:** `3.0`
- **Location(s):**
  - `main.js:406`
- **Effect:** Sets max time allowed for heavy systems per frame
- **Usage:** `window.__DEBUG_FRAME_BUDGET_MS = 5.0`

#### Flag: `window.__DEBUG_FRAME_BUDGET_LOG`
- **Default:** `true`
- **Location(s):**
  - `main.js:407`
- **Effect:** Logs frame budget violations
- **Usage:** `window.__DEBUG_FRAME_BUDGET_LOG = false`

#### Flag: `window.__DBG_SPIKE_TRACE`
- **Default:** `false`
- **Location(s):**
  - `main.js:408`
- **Effect:** Enables RAF spike tracing
- **Usage:** `window.__DBG_SPIKE_TRACE = true`

---

### 1.8 Internal Counters & Trackers

#### Flag: `window.__raycastCost`
- **Default:** `{ enabled: false, ... }`
- **Location(s):**
  - `NodeLinkingSystem.js:32`, `36`
- **Effect:** Raycast cost instrumentation state
- **Usage:** Read-only, managed by NodeLinkingSystem

#### Flag: `window.__raycastProxyHitCount`
- **Default:** `0`
- **Location(s):**
  - `NodeLinkingSystem.js:1735`
- **Effect:** Count of successful hit-proxy raycasts
- **Usage:** Read-only, updated by system

#### Flag: `window.__raycastProxyMissCount`
- **Default:** `0`
- **Location(s):**
  - `NodeLinkingSystem.js:1739`
- **Effect:** Count of hit-proxy raycast misses
- **Usage:** Read-only, updated by system

#### Flag: `window.__raycastVisualFallbackCount`
- **Default:** `0`
- **Location(s):**
  - `NodeLinkingSystem.js:1741`
- **Effect:** Count of visual fallback raycasts
- **Usage:** Read-only, updated by system

#### Flag: `window.__RAYCAST_FALLBACK_ACTIVE`
- **Default:** `false`
- **Location(s):**
  - `NodeLinkingSystem.js:1759`, `1765`
- **Effect:** Indicates raycast fallback mode active
- **Usage:** Read-only, managed by system

#### Flag: `window.RAYCAST_PROXY_MISS_LOG_EVERY`
- **Default:** `120`
- **Location(s):**
  - `NodeLinkingSystem.js:1745`
- **Effect:** Controls frequency of miss logging
- **Usage:** `window.RAYCAST_PROXY_MISS_LOG_EVERY = 60`

#### Flag: `window.__B3_MUTATION_NEEDSUPDATE`
- **Default:** `0`
- **Location(s):**
  - `CoreMaterialMutationDetector.js:56`
- **Effect:** Count of needsUpdate mutations
- **Usage:** Read-only, updated by mutation detector

#### Flag: `window.__B3_MUTATION_ENFORCEMENTS`
- **Default:** `0`
- **Location(s):**
  - `CoreMaterialMutationDetector.js:61`
- **Effect:** Count of mutation enforcement actions
- **Usage:** Read-only, updated by mutation detector

#### Flag: `window.__B3_MUTATION_DETECTIONS`
- **Default:** `0`
- **Location(s):**
  - `CoreMaterialMutationDetector.js:66`, `74`
- **Effect:** Count of mutation detections
- **Usage:** Read-only, updated by mutation detector

#### Flag: `window.__B3_SURFACE_NEEDSUPDATE_COUNT`
- **Default:** `0`
- **Location(s):**
  - `NodeSurfaceProtectionRule_v2.js:28`
- **Effect:** Count of surface needsUpdate calls
- **Usage:** Read-only, updated by surface protection

#### Flag: `window.__B3_SURFACE_PROP_WRITES`
- **Default:** `0`
- **Location(s):**
  - `NodeSurfaceProtectionRule_v2.js:33`
- **Effect:** Count of surface property writes
- **Usage:** Read-only, updated by surface protection

#### Flag: `window.__B3_SURFACE_SHADER_CHANGES`
- **Default:** `0`
- **Location(s):**
  - `NodeSurfaceProtectionRule_v2.js:38`
- **Effect:** Count of surface shader changes
- **Usage:** Read-only, updated by surface protection

#### Flag: `window.__auraDebugLogCount__`
- **Default:** `0`
- **Location(s):**
  - `NodeVisualStateBinder.js:18`, `25`
- **Effect:** Count of aura debug logs
- **Usage:** Read-only, updated by visual state binder

#### Flag: `window.__linkDebugLogCount__`
- **Default:** `0`
- **Location(s):**
  - `NodeLinkingSystem.js:1692`, `1702`
- **Effect:** Count of link debug logs
- **Usage:** Read-only, updated by linking system

#### Flag: `window.__crosshairRaycastState`
- **Default:** `{ node: null, ... }`
- **Location(s):**
  - `NodeLinkingSystem.js:1727`
- **Effect:** Crosshair raycast state
- **Usage:** Read-only, managed by linking system

#### Flag: `window.__shaderWarmupDone`
- **Default:** `false`
- **Location(s):**
  - `NodeLinkingSystem.js:1827`, `1831`
- **Effect:** Indicates shader warmup complete
- **Usage:** Read-only, set by warmup system

---

### 1.9 Other Global Flags

#### Flag: `window.HITPROXY_READY`
- **Default:** `false`
- **Location(s):**
  - `NodeLinkingSystem.js:1730`
- **Effect:** Indicates hit-proxy system ready
- **Usage:** Read-only, set by hit-proxy system

#### Flag: `window.DEBUG_SINGLE_INSTANCE_NODES`
- **Default:** `false`
- **Location(s):**
  - `AINodes.js:529`, `537`
- **Effect:** Blocks duplicate node spawns
- **Usage:** `window.DEBUG_SINGLE_INSTANCE_NODES = true`

#### Flag: `window.LINK_SHADER_ENABLED`
- **Default:** `true`
- **Location(s):**
  - `LINK_SHADER_LANGUAGE_EXAMPLES.js:7`
- **Effect:** Toggles link shader system
- **Usage:** `window.LINK_SHADER_ENABLED = false`

#### Flag: `window.CAMERA_AUTHORITY_MODE`
- **Default:** `'fp_only'`
- **Location(s):**
  - `main.js:372`
- **Effect:** Camera authority mode
- **Usage:** `window.CAMERA_AUTHORITY_MODE = 'mixed'`

#### Flag: `window.DEBUG_HUD`
- **Default:** `undefined`
- **Location(s):**
  - `CoreMetricsHUD.js:14`
- **Effect:** Enables HUD debug logging
- **Usage:** `window.DEBUG_HUD = true`

---

## 2. Console Commands

### 2.1 Main Debug Commands (main.js)

#### Command: `window.correlationStatus()`
- **Location:** `main.js:546`
- **Description:** Reports link correlation engine status

#### Command: `window.getClusters()`
- **Location:** `main.js:560`
- **Description:** Gets cluster information from correlation engine

#### Command: `window.getCorrelationFor(linkId)`
- **Location:** `main.js:575`
- **Description:** Gets correlation data for specific link

#### Command: `window.checkLinkIntegrity()`
- **Location:** `main.js:590`
- **Description:** Checks link system integrity

#### Command: `window.toggleWorldEvents()`
- **Location:** `main.js:604`
- **Description:** Toggles world events

#### Command: `window.debugWorldEvents()`
- **Location:** `main.js:612`
- **Description:** Shows world event debug info

#### Command: `window.debugWorldResetFix()`
- **Location:** `main.js:620`
- **Description:** Debug world reset fix

#### Command: `window.debugMythicGlyphs()`
- **Location:** `main.js:628`
- **Description:** Debug mythic seed glyph system

#### Command: `window.debugExtremeShaders()`
- **Location:** `main.js:636`
- **Description:** Debug EXTREME archetype shaders

#### Command: `window.enableExtremeShaderDiagnostics()`
- **Location:** `main.js:644`
- **Description:** Enable per-frame shader validation

#### Command: `window.disableExtremeShaderDiagnostics()`
- **Location:** `main.js:652`
- **Description:** Disable per-frame shader validation

#### Command: `window.enableExtremeShaderDebugVisuals()`
- **Location:** `main.js:660`
- **Description:** Enable debug visualization overlays on EXTREME nodes

#### Command: `window.disableExtremeShaderDebugVisuals()`
- **Location:** `main.js:668`
- **Description:** Disable debug visualization overlays

#### Command: `window.printExtremeShaderSummary()`
- **Location:** `main.js:676`
- **Description:** Print concise status summary

#### Command: `window.exportExtremeShaderMetrics()`
- **Location:** `main.js:684`
- **Description:** Export metrics for telemetry

#### Command: `window.printNewNodeCategoriesStatus()`
- **Location:** `main.js:692`
- **Description:** Print status for all new node categories

#### Command: `window.applyMythicNodeVisuals(nodeIndex)`
- **Location:** `main.js:700`
- **Description:** Apply Mythic node visuals to specific node

#### Command: `window.applyPrimeNodeVisuals(nodeIndex)`
- **Location:** `main.js:708`
- **Description:** Apply Prime node visuals to specific node

#### Command: `window.applyErrorNodeVisuals(nodeIndex)`
- **Location:** `main.js:716`
- **Description:** Apply Error node visuals to specific node

#### Command: `window.demoNewNodeCategories()`
- **Location:** `main.js:724`
- **Description:** Demo: Apply all three categories to demo nodes

#### Command: `window.debugGlyphSync()`
- **Location:** `main.js:732`
- **Description:** Debug Linked Glyph Synchronization

#### Command: `window.toggleLinkedGlyphSync()`
- **Location:** `main.js:740`
- **Description:** Toggle Linked Glyph Synchronization

#### Command: `window.resyncAllGlyphs()`
- **Location:** `main.js:748`
- **Description:** Resync all glyphs immediately

#### Command: `window.debugPrintMessages()`
- **Location:** `main.js:756`
- **Description:** Debug Linked Glyph Messaging

#### Command: `window.toggleMessaging()`
- **Location:** `main.js:764`
- **Description:** Toggle Linked Glyph Messaging

#### Command: `window.clearAllGlyphMessages()`
- **Location:** `main.js:772`
- **Description:** Clear all glyph messages immediately

#### Command: `window.removeOldMarkers()`
- **Location:** `main.js:780`
- **Description:** Remove old markers manually

#### Command: `window.debugLegacyConeCleanup()`
- **Location:** `main.js:788`
- **Description:** Debug legacy cone cleanup

#### Command: `window.cleanLegacyCones()`
- **Location:** `main.js:796`
- **Description:** Manually trigger cone cleanup

#### Command: `window.cleanupLegacyGlyphs()`
- **Location:** `main.js:804`
- **Description:** Manual cleanup of all legacy cyan hexagon glyphs

#### Command: `window.debugLegacyGlyphCleanup()`
- **Location:** `main.js:812`
- **Description:** Debug legacy glyph cleanup statistics

#### Command: `window.purifyGlyphs()`
- **Location:** `main.js:820`
- **Description:** Remove all unauthorized glyphs

#### Command: `window.setPurityLevel(level)`
- **Location:** `main.js:828`
- **Description:** Set purity enforcement level (0-3)

#### Command: `window.debugPurityMode()`
- **Location:** `main.js:836`
- **Description:** Print comprehensive purity report

#### Command: `window.listApprovedGlyphs()`
- **Location:** `main.js:844`
- **Description:** List all approved glyph components

#### Command: `window.validateGlyphIntegrity()`
- **Location:** `main.js:852`
- **Description:** Validate entire scene integrity

#### Command: `window.togglePurityMode(enabled)`
- **Location:** `main.js:860`
- **Description:** Enable/disable purity enforcement

#### Command: `window.debugAdaptiveGlyphs()`
- **Location:** `main.js:868`
- **Description:** Debug adaptive glyph rendering status

#### Command: `window.toggleAdaptiveGlyphs(enabled)`
- **Location:** `main.js:876`
- **Description:** Toggle adaptive glyph rendering

#### Command: `window.debugNodeAdaptation(nodeIndex)`
- **Location:** `main.js:884`
- **Description:** Debug adaptive rendering for specific node

#### Command: `window.debugGlyphs()`
- **Location:** `main.js:892`
- **Description:** Debug ATOMA Glyph System

#### Command: `window.debugGlyphMapping()`
- **Location:** `main.js:900`
- **Description:** Debug glyph mapping distribution

#### Command: `window.autoAssignGlyphs()`
- **Location:** `main.js:908`
- **Description:** Auto-assign glyphs to all nodes

#### Command: `window.clearGlyphs()`
- **Location:** `main.js:916`
- **Description:** Clear all glyphs

#### Command: `window.debugGlyphs4()`
- **Location:** `main.js:924`
- **Description:** Debug ATOMA Glyph System 4.0

#### Command: `window.clearGlyphs4()`
- **Location:** `main.js:932`
- **Description:** Clear all glyphs (4.0)

#### Command: `window.createGlyph4(nodeId, glyphType)`
- **Location:** `main.js:940`
- **Description:** Create glyph with 4.0 system

#### Command: `window.createGlyph(nodeId, glyphType)`
- **Location:** `main.js:948`
- **Description:** Create specific glyph type

#### Command: `window.autoCreateGlyphFusions()`
- **Location:** `main.js:956`
- **Description:** Auto-create glyph fusions for all nodes

#### Command: `window.debugGlyphFusion(nodeIndex)`
- **Location:** `main.js:964`
- **Description:** Debug glyph fusion on specific node

#### Command: `window.debugGlyphLayer4Status()`
- **Location:** `main.js:972`
- **Description:** See Glyph Layer 4.0 status

#### Command: `window.disableGlyphLayer4()`
- **Location:** `main.js:980`
- **Description:** Disable Glyph Layer 4.0

#### Command: `window.enableGlyphLayer4()`
- **Location:** `main.js:988`
- **Description:** Enable Glyph Layer 4.0

#### Command: `window.clearGlyphLayer4()`
- **Location:** `main.js:996`
- **Description:** Clean up Glyph Layer 4.0

#### Command: `window.debugSemanticGlyph(nodeIndex)`
- **Location:** `main.js:1004`
- **Description:** Debug specific node's semantic state

#### Command: `window.debugSemanticStats()`
- **Location:** `main.js:1012`
- **Description:** Display semantic system statistics

#### Command: `window.disableSemanticGlyphAI()`
- **Location:** `main.js:1020`
- **Description:** Disable semantic AI updates

#### Command: `window.enableSemanticGlyphAI()`
- **Location:** `main.js:1028`
- **Description:** Enable semantic AI updates

#### Command: `window.recordNodeLink(nodeIndex)`
- **Location:** `main.js:1036`
- **Description:** Record link creation event on node

#### Command: `window.recordNodeRitual(nodeIndex)`
- **Location:** `main.js:1044`
- **Description:** Record ritual completion event on node

#### Command: `window.toggleCompositeResonanceDebug()`
- **Location:** `main.js:1052`
- **Description:** Toggle debug visualization of resonance influence zones

#### Command: `window.compositeResonanceStatus()`
- **Location:** `main.js:1060`
- **Description:** Show status of active composite glyph resonances

#### Command: `window.enableGlyphResonanceInfluence()`
- **Location:** `main.js:1068`
- **Description:** Enable optional glyph animation phase influence

#### Command: `window.disableGlyphResonanceInfluence()`
- **Location:** `main.js:1076`
- **Description:** Disable optional glyph animation phase influence

#### Command: `window.compositeGlyphDecayStatus()`
- **Location:** `main.js:1084`
- **Description:** Show detailed decay status of composite glyphs

#### Command: `window.recordNodeAscended(nodeIndex)`
- **Location:** `main.js:1092`
- **Description:** Record ascension event on node

#### Command: `window.debugFusionGlyph(nodeIndex)`
- **Location:** `main.js:1100`
- **Description:** Debug fusion glyph on specific node

#### Command: `window.debugFusionStats()`
- **Location:** `main.js:1108`
- **Description:** Display fusion glyph system statistics

#### Command: `window.enableFusionOverlay()`
- **Location:** `main.js:1116`
- **Description:** Enable Glyph Fusion Overlay

#### Command: `window.disableFusionOverlay()`
- **Location:** `main.js:1124`
- **Description:** Disable Glyph Fusion Overlay

#### Command: `window.glyphCleanupLegacy()`
- **Location:** `main.js:1132`
- **Description:** Remove legacy cyan hexagon glyphs (4.0 only)

#### Command: `window.debugProceduralGlyphs()`
- **Location:** `main.js:1140`
- **Description:** Debug procedural glyph system statistics

#### Command: `window.debugRemoveLegacyHex()`
- **Location:** `main.js:1148`
- **Description:** Remove legacy cyan hexagon glyphs

#### Command: `window.enableProceduralGlyphs()`
- **Location:** `main.js:1156`
- **Description:** Enable Procedural Meaning Engine

#### Command: `window.toggleAudio()`
- **Location:** `main.js:1164`
- **Description:** Enable/disable audio system

#### Command: `window.startAudio()`
- **Location:** `main.js:1172`
- **Description:** Start audio context (required on first interaction)

#### Command: `window.testAudio(soundName)`
- **Location:** `main.js:1180`
- **Description:** Test individual sounds

#### Command: `window.audioStatus()`
- **Location:** `main.js:1188`
- **Description:** Show audio system status

#### Command: `window.testAudioModulation()`
- **Location:** `main.js:1196`
- **Description:** Test audio modulation layers

#### Command: `window.disableProceduralGlyphs()`
- **Location:** `main.js:1204`
- **Description:** Disable Procedural Meaning Engine

#### Command: `window.debugLinkGlyphFlow()`
- **Location:** `main.js:1212`
- **Description:** Debug link glyph flow statistics

#### Command: `window.toggleLinkGlyphFlow()`
- **Location:** `main.js:1220`
- **Description:** Toggle link glyph flow

#### Command: `window.refreshLinkGlyphFlow()`
- **Location:** `main.js:1228`
- **Description:** Force refresh link glyph flow

#### Command: `window.testSynergyPair(cat1, cat2)`
- **Location:** `main.js:1236`
- **Description:** Test synergy scoring on category pair

#### Command: `window.testAllSynergyPairs()`
- **Location:** `main.js:1244`
- **Description:** Test all category pairs (full matrix)

#### Command: `window.enableSynergyDebug()`
- **Location:** `main.js:1252`
- **Description:** Enable synergy score debug logging

#### Command: `window.disableSynergyDebug()`
- **Location:** `main.js:1260`
- **Description:** Disable synergy score debug logging

#### Command: `window.getSynergyStats()`
- **Location:** `main.js:1268`
- **Description:** Get synergy score statistics

#### Command: `window.recommendFor(nodeName)`
- **Location:** `main.js:1276`
- **Description:** Get recommendations for node by name

#### Command: `window.recommendActive()`
- **Location:** `main.js:1284`
- **Description:** Get recommendations for currently selected node

#### Command: `window.printRecommendations()`
- **Location:** `main.js:1292`
- **Description:** Print current recommendations

#### Command: `window.getRecommendationStats()`
- **Location:** `main.js:1300`
- **Description:** Get recommendation statistics

#### Command: `window.enableRecommendationAI()`
- **Location:** `main.js:1308`
- **Description:** Enable/disable recommendation AI

#### Command: `window.disableRecommendationAI()`
- **Location:** `main.js:1316`
- **Description:** Disable recommendation AI

#### Command: `window.autoLinkActive()`
- **Location:** `main.js:1324`
- **Description:** Auto-link for currently selected node

#### Command: `window.previewAutoLink()`
- **Location:** `main.js:1332`
- **Description:** Preview what WOULD be created (without creating)

#### Command: `window.enableAutoLink()`
- **Location:** `main.js:1340`
- **Description:** Enable automation

#### Command: `window.disableAutoLink()`
- **Location:** `main.js:1348`
- **Description:** Disable automation

#### Command: `window.toggleAutoLink()`
- **Location:** `main.js:1356`
- **Description:** Toggle automation

#### Command: `window.getAutoLinkStats()`
- **Location:** `main.js:1364`
- **Description:** Get automation statistics

#### Command: `window.feedbackUIActive()`
- **Location:** `main.js:1372`
- **Description:** Check if feedback UI is active

#### Command: `window.testAutoLinkFeedback()`
- **Location:** `main.js:1380`
- **Description:** Test all feedback effects

#### Command: `window.enableFeedbackUI()`
- **Location:** `main.js:1388`
- **Description:** Enable feedback UI

#### Command: `window.disableFeedbackUI()`
- **Location:** `main.js:1396`
- **Description:** Disable feedback UI

#### Command: `window.toggleFeedbackUI()`
- **Location:** `main.js:1404`
- **Description:** Toggle feedback UI

#### Command: `window.clearAutoLinkFeedback()`
- **Location:** `main.js:1412`
- **Description:** Clear all active feedback effects

#### Command: `window.toggleSynergyDebug()`
- **Location:** `main.js:1420`
- **Description:** Toggle debug HUD visibility

#### Command: `window.showSynergyDebug()`
- **Location:** `main.js:1428`
- **Description:** Show debug HUD

#### Command: `window.hideSynergyDebug()`
- **Location:** `main.js:1436`
- **Description:** Hide debug HUD

#### Command: `window.getSynergyDebugStats()`
- **Location:** `main.js:1444`
- **Description:** Get debug HUD statistics

#### Command: `window.setSynergyDebugRefresh(ms)`
- **Location:** `main.js:1452`
- **Description:** Set debug HUD refresh interval

#### Command: `window.computeLinkQuality(nodeNameA, nodeNameB)`
- **Location:** `main.js:1460`
- **Description:** Compute quality for two nodes and explain

#### Command: `window.testQualityMatrix()`
- **Location:** `main.js:1468`
- **Description:** Test quality matrix

#### Command: `window.testRandomCandidates()`
- **Location:** `main.js:1476`
- **Description:** Test random candidates

#### Command: `window.getQualityStats()`
- **Location:** `main.js:1484`
- **Description:** Get quality predictor stats

#### Command: `window.setQualityThreshold(threshold)`
- **Location:** `main.js:1492`
- **Description:** Set automation quality threshold

#### Command: `window.getDecayEngineStatus()`
- **Location:** `main.js:1500`
- **Description:** Get decay engine status

#### Command: `window.getDecayStats(nodeAId, nodeBId)`
- **Location:** `main.js:1508`
- **Description:** Get individual link decay stats

#### Command: `window.resetAllPriorities()`
- **Location:** `main.js:1516`
- **Description:** Reset all link priorities

#### Command: `window.setDecayRate(ratePercent)`
- **Location:** `main.js:1524`
- **Description:** Set custom decay rate

#### Command: `window.setDecayHalfLife(seconds)`
- **Location:** `main.js:1532`
- **Description:** Set custom half-life

---

### 2.2 System-Specific Console APIs

#### Debug API: `window.HitProxyDebug`
- **Location:** `_HitProxyIntegrationPatch.js:36`
- **Description:** Hit-proxy system debugging
- **Methods:** `stats()`, etc.

#### Debug API: `window.__ATOMA_METRIC_AUDIT`
- **Location:** Multiple files
- **Description:** Metric audit mode flag

#### Debug API: `window.__ATOMA_METRICS`
- **Location:** Multiple files
- **Description:** Global metrics storage

#### Debug API: `window.__ATOMA_RENDERER__`
- **Location:** `LinkStateVisualLanguageIntegration.js:46`
- **Description:** Reference to THREE.js renderer

#### Debug API: `window.__ATOMA_MATERIAL_GUARD_INSTALLED__`
- **Location:** `MaterialDebugGuard_v1.js:10`
- **Description:** Indicates material guard installed

#### Debug API: `window.__ATOMA_MATERIAL_REGISTRY_SCOPE__`
- **Location:** `MaterialDebugGuard_v1.js:16`, `23`
- **Description:** Material registry scope flag

#### Debug API: `window.__ATOMA_STRESS_TURBULENCE_DEBUG`
- **Location:** `StressTurbulenceIntegrationGuide.js:12`
- **Description:** Stress turbulence debug API

#### Debug API: `window.__ATOMA_SYNERGY_GLOW_DEBUG`
- **Location:** `SynergyGlowIntegrationGuide.js:12`
- **Description:** Synergy glow debug API

#### Debug API: `window.__ATOMA_VISUAL_REGISTRY_DEBUG`
- **Location:** `VisualTemplateRegistry.js:12`
- **Description:** Visual template registry debug

#### Debug API: `window.__ATOMA_VISUAL_RESOLVER_DEBUG`
- **Location:** `VisualTemplateResolver.js:17`
- **Description:** Visual template resolver debug

#### Debug API: `window.__ATOMA_VISUAL_WIRING_DEBUG`
- **Location:** `VisualAutoWiringSystem.js:18`
- **Description:** Visual auto-wiring debug

#### Debug API: `window.__ATOMA_VISUAL_TEMPLATES`
- **Location:** `VisualTemplateReferenceImplementations.js:247`
- **Description:** Visual templates reference

#### Debug API: `window.__ATOMA_SHADER_VARIANT_DETECTOR`
- **Location:** `Engine/Debug/ShaderVariantDetector.js:58`
- **Description:** Shader variant detector API

#### Debug API: `window.__ATOMA_SHADER_VARIANT_SYSTEMS`
- **Location:** `Engine/Debug/ShaderFreezeGuard.js:56`
- **Description:** Registered shader variant systems

#### Debug API: `window.__ATOMA_CTX`
- **Location:** `NodeEditor.js:38`, `40`, `42`
- **Description:** ATOMA execution context (globalThis)

#### Debug API: `window.IntegrationDebug`
- **Location:** `_IntegrationNodeSelectionFix.js:41`
- **Description:** Integration node selection debug

#### Debug API: `window.InteractionIsolationDebug`
- **Location:** `VisualInteractionIsolationPatch.js:17`
- **Description:** Interaction isolation debug

#### Debug API: `window.UIControlledStateFixAPI`
- **Location:** `UIControlledStateFix_1_0.js:25`
- **Description:** UI state fix API

#### Debug API: `window.SpawnAuthority`
- **Location:** `SpawnAuthorityConsoleAPI.js:17`
- **Description:** Spawn authority debug API

#### Debug API: `window.RaycastAuthorityInit`
- **Location:** `RaycastAuthorityInit.js:19`
- **Description:** Raycast authority initialization API

#### Debug API: `window.PersonalityMaterialProfileRegistry_v1`
- **Location:** `PersonalityMaterialProfileRegistry_v1.js:19`
- **Description:** Personality material profiles

#### Debug API: `window.PersonalitySignalSmoother_v1`
- **Location:** `PersonalitySignalSmoother_v1.js:26`
- **Description:** Personality signal smoother

#### Debug API: `window.PersonalityShaderStabilizedFX_v1`
- **Location:** `PersonalityShaderStabilizedFX_v1.js:26`
- **Description:** Personality shader stabilized FX

#### Debug API: `window.VisualHierarchyRegistry`
- **Location:** `VisualHierarchyRegistry.js:24`
- **Description:** Visual hierarchy registry

#### Debug API: `window.AtomDebug`
- **Location:** `ParticleTrailIntegrationPatch_Session122.js:6`, `NodeLinkedAuraIntegrationPatch_Session123.js:6`
- **Description:** Generic ATOMA debug namespace

#### Debug API: `window.LinkAuraSystem_v1`
- **Location:** `shaders/LinkAuraSystem_v1.js:3`
- **Description:** Link aura system reference

#### Debug API: `window.LinkPrioritySystem`
- **Location:** `SelectedHUDSyncPatch1_0.js:15`
- **Description:** Link priority system reference

#### Debug API: `window.ComputeSynergyScore2_0`
- **Location:** Multiple files
- **Description:** Synergy score computation function

---

### 2.3 Visual Lock & Integrity APIs

#### Debug API: `window.__visualLock`
- **Location:** `_VisualLockCompleteIntegration.js:19`
- **Methods:**
  - `findUnregisteredNodes()` - Find nodes without visual binding
  - `dumpNodeVisual(nodeId)` - Dump visual state for node
  - `forceRebindAll()` - Force rebind all node visuals
  - `enableMonitoring(true)` - Enable monitoring
  - `getStats()` - Get visual lock statistics
  - `registerNode(node, type)` - Manually register node
  - `autodiscover(node)` - Auto-discover and register

#### Debug API: `window.NodeVisualIntegrityAPI`
- **Location:** `NodeVisualIntegrityFix.js:33`
- **Methods:**
  - `report()` - Print full integrity report
  - `disable(featureName)` - Disable specific legacy feature
  - `enable(featureName)` - Enable specific legacy feature

#### Debug API: `window.__nodeVisualFreezeMode__`
- **Location:** `NodeVisualFreezeMode_v1.js:23`
- **Methods:**
  - `freezeNode(node)` - Freeze specific node visuals
  - `enforceFreeze(scene)` - Enforce freeze on entire scene
  - `getStatus()` - Get freeze mode status

---

### 2.4 Hard Authority Debug API

#### Debug API: `window.__HARD_AUTHORITY_DEBUG__`
- **Location:** `HARD_AUTHORITY_DEBUG_API.js:11`
- **Methods:**
  - `checkAllNodes()` - Check all nodes for compliance
  - `countInteractiveCores()` - Count interactive core meshes
  - `checkNodeRaycasts(nodeId)` - Check raycast setup for node
  - `checkLinkVisualAuthority()` - Verify link visual authority
  - `testNodeClicking()` - Test node clicking interaction
  - `testVisualLock(enable)` - Toggle visual authority lock
  - `testSafetyNet()` - Run frame-end safety net
  - `getNodeCountByType()` - Get node count by category
  - `getInteractionStats()` - Get interaction statistics
  - `getAuthoritativeRenderer()` - Get authoritative renderer
  - `reportSystemStatus()` - Report all system statuses

---

### 2.5 Node & Link Debug APIs

#### Command: `window.debugSpawnAllNodes()`
- **Location:** `EnhancedNodeModels.js:224`
- **Description:** Spawn all node types for testing

#### Command: `window.debugFactoryCounts()`
- **Location:** `EnhancedNodeModels.js:229`
- **Description:** Show factory registry counts

#### Command: `window.debugFactoryList(category)`
- **Location:** `EnhancedNodeModels.js:234`
- **Description:** List factories in category

#### Command: `window.debugRegistrySummary()`
- **Location:** `EnhancedNodeModels.js:239`
- **Description:** Show registry summary

#### Command: `window.debugSpawnPools()`
- **Location:** `AINodes.js:539`
- **Description:** Debug spawn pools

#### Command: `window.debugComparePoolsVsRegistry()`
- **Location:** `AINodes.js:547`
- **Description:** Compare pools vs EnhancedNodeModels registry

#### Command: `window.dumpAiNodesProfile()`
- **Location:** `AINodes.js:559`
- **Description:** Dump AINodes profiling data

#### Command: `window.setLinkFlow(rate)`
- **Location:** `NeonLinkVisuals.js:311`
- **Description:** Set link flow animation rate

#### Command: `window.setLinkOpacity(opacity)`
- **Location:** `NeonLinkVisuals.js:316`
- **Description:** Set link opacity

#### Command: `window.setLinkStress(stress)`
- **Location:** `NeonLinkVisuals.js:321`
- **Description:** Set global link stress level

#### Command: `window.rebuildAllLinks()`
- **Location:** `NeonLinkVisuals.js:326`
- **Description:** Rebuild all link visuals

#### Command: `window.reportLinkVisuals()`
- **Location:** `NeonLinkVisuals.js:337`
- **Description:** Report link visual statistics

#### Command: `window.getMorphingInfo(linkId)`
- **Location:** `LINK_MORPHING_EXAMPLES.js:26`
- **Description:** Get morphing info for link

#### Command: `window.getCorruption(linkId)`
- **Location:** `LINK_MORPHING_EXAMPLES.js:31`
- **Description:** Get corruption for link

#### Command: `window.getPhase(linkId)`
- **Location:** `LINK_MORPHING_EXAMPLES.js:36`
- **Description:** Get phase name for link

#### Command: `window.getMorphingStats()`
- **Location:** `LINK_MORPHING_EXAMPLES.js:41`
- **Description:** Get morphing statistics

#### Command: `window.setMorphingSpeed(speed)`
- **Location:** `LINK_MORPHING_EXAMPLES.js:46`
- **Description:** Set morphing speed

#### Command: `window.verifyLinkAuraAlignment()`
- **Location:** `LINK_AURA_SHADER_VERIFICATION.js:14`
- **Description:** Verify link aura shader alignment

#### Command: `window.debugLinkAuraState(linkIndex)`
- **Location:** `LINK_AURA_SHADER_VERIFICATION.js:25`
- **Description:** Debug link aura state

---

### 2.6 Metrics & Overlay APIs

#### Command: `window.toggleMetricsOverlay()`
- **Location:** `CoreMetricsOverlay.js:9`
- **Description:** Toggle metrics overlay visibility

#### Command: `window.debugMetricsOverlay()`
- **Location:** `CoreMetricsOverlay.js:14`
- **Description:** Show metrics overlay debug info

#### Command: `window.getMetricsForLink(linkId)`
- **Location:** `LinkMetricsToVisualBridge_v1.js:17`
- **Description:** Get metrics for specific link

#### Command: `window.reportMetricsBridge()`
- **Location:** `LinkMetricsToVisualBridge_v1.js:24`
- **Description:** Report metrics bridge statistics

---

### 2.7 Soak Test API

#### Debug API: `window.SOAK_DEBUG`
- **Location:** `SoakTestLogging_v1.js:40`
- **Methods:**
  - `enable()` - Enable soak logging
  - `disable()` - Disable soak logging
  - `setInterval(seconds)` - Set log interval
  - `status()` - Show soak logging status
  - `getBuffer()` - Get log buffer

#### Debug API: `window.__SOAK_LOG__`
- **Location:** `SoakTestLogging_v1.js:21`
- **Description:** Soak test log buffer array

---

### 2.8 Network & System APIs

#### Debug API: `window.__rareNodeVerifier`
- **Location:** `_RareNodeSimulationVerifier.js:32`
- **Methods:**
  - `fullDiagnostics()` - Run full diagnostics
  - `isRareNodeUpdateActive()` - Check if rare nodes updating
  - `getRareNodeCount()` - Get rare node count
  - `getVerificationReport()` - Get verification report

#### Debug API: `window.__simAudit`
- **Location:** `_TASK_AUDIT_DEBUG_HELPERS.js:48`
- **Methods:**
  - `runFullDiagnostics()` - Run full simulation audit
  - `findInvariantViolations()` - Find invariant violations
  - `verifyTimingSync()` - Verify timing synchronization
  - `verifyRareNodeRegistry()` - Verify rare node registry

#### Debug API: `window.__simulationInvariant`
- **Location:** `_SIMULATION_INVARIANT_ENFORCEMENT.js:10`
- **Methods:**
  - `coverage()` - Get update coverage report

#### Debug API: `window.ObjectExtensibilityGuard`
- **Location:** `_ObjectExtensibilityGuard.js:15`
- **Methods:**
  - `isThreeJsEngineObject(obj)` - Check if THREE.js object

---

### 2.9 Visual & Rendering APIs

#### Debug API: `window.visualLayerDebugger`
- **Location:** `VisualLayerDebugger.js:23`
- **Methods:** (depends on debugProbe initialization)

#### Debug API: `window.visualOverlayAudit`
- **Location:** `VisualOverlayAuditSystem.js:22`
- **Methods:** (depends on auditSystem initialization)

#### Debug API: `window.visualLayerGate`
- **Location:** `VisualLayerEnforcementGate.js:46`
- **Methods:** (depends on gate initialization)

#### Command: `window.toggleLinkShader()`
- **Location:** `LINK_SHADER_LANGUAGE_EXAMPLES.js:7`
- **Description:** Toggle link shader system

---

### 2.10 World & Event APIs

#### Command: `window.worldCacheStatus()`
- **Location:** `SafeWorldResetFix1_0.js:33`
- **Description:** Show world cache status

#### Command: `window.worldCacheDisable()`
- **Location:** `SafeWorldResetFix1_0.js:44`
- **Description:** Disable world cache

#### Command: `window.worldCacheEnable()`
- **Location:** `SafeWorldResetFix1_0.js:49`
- **Description:** Enable world cache

#### Command: `window.worldCacheReset()`
- **Location:** `SafeWorldResetFix1_0.js:54`
- **Description:** Reset world cache

#### Command: `window.setParticleMultiplier(linkId)`
- **Location:** `StressBasedParticleScaler_v1.js:42`
- **Description:** Set particle multiplier for link

#### Command: `window.reportHighStressParticles(threshold)`
- **Location:** `StressBasedParticleScaler_v1.js:49`
- **Description:** Report high-stress particle links

#### Command: `window.reportParticleScalerStats()`
- **Location:** `StressBasedParticleScaler_v1.js:61`
- **Description:** Report particle scaler statistics

---

### 2.11 Engine Health & Diagnostics

#### Command: `window.testEngineHealth()`
- **Location:** `ENGINE_HEALTH_CHECK_CONSOLE_API.js:14`
- **Description:** Test overall engine health

#### Command: `window.debugEngineEvents()`
- **Location:** `ENGINE_HEALTH_CHECK_CONSOLE_API.js:44`
- **Description:** Debug engine events

#### Command: `window.debugVisualLayers()`
- **Location:** `ENGINE_HEALTH_CHECK_CONSOLE_API.js:72`
- **Description:** Debug visual layers

---

### 2.12 Verification & Testing APIs

#### Command: `window.__verify38()`
- **Location:** `_SESSION_38_VERIFICATION_SCRIPT.js:18`
- **Description:** Run Session 38 verification tests

#### Command: `window.verify38`
- **Location:** `_SESSION_38_VERIFICATION_SCRIPT.js:73`
- **Description:** Alias for __verify38()

#### Debug API: `window.__verifyContractUsage`
- **Location:** `LegacyLinkStateShutdown.js:16`
- **Description:** Verify contract usage patterns

---

### 2.13 Specialized Debug APIs

#### Debug API: `window.EnhancedNodeModels`
- **Location:** `EnhancedNodeModels.js` (class export)
- **Description:** Enhanced node models reference

#### Debug API: `window.NodeVisualIntegrity`
- **Location:** `NodeVisualIntegrityFix.js:28`
- **Description:** Node visual integrity system

#### Debug API: `window.NodeAuraSystem_v1`
- **Location:** `shaders/LinkAuraSystem_v1.js` (class export)
- **Description:** Node aura system reference

#### Debug API: `window.ATOMA_NODE_SPAWN_LOGGER`
- **Location:** `_NodeSpawnLogger4_0.js:47`
- **Description:** Node spawn logger reference

#### Debug API: `window.ATOMA_VISUAL_BOOTSTRAP`
- **Location:** `_NodeVisualBootstrap3_0.js:23`
- **Description:** Node visual bootstrap reference

#### Debug API: `window.__nucleusControl`
- **Location:** `NUCLEAR_LOCK_INTEGRATION.js:24`
- **Description:** Nuclear control system API

#### Debug API: `window.__nuclearLock`
- **Location:** `NUCLEAR_LOCK_INTEGRATION.js:27`
- **Description:** Nuclear lock validation API

#### Debug API: `window.__frameEnforcementConsole`
- **Location:** `NUCLEAR_LOCK_INTEGRATION.js:30`
- **Description:** Frame enforcement console API

#### Debug API: `window.__legacyShutdown`
- **Location:** `NUCLEAR_LOCK_INTEGRATION.js:44`
- **Description:** Legacy shutdown report API

---

## 3. Debug Log Gates

### 3.1 ATOMA_DEBUG_* Gates

#### Log Gate: `ATOMA_DEBUG_LINK`
- **Controls logs in:**
  - `NodeLinkingSystem.js:12` - linkLog function
  - `LinkRendererConduit.js:56`, `63`, `74`, `82`, `91`, `100` - Link rendering warnings
- **Effect:** Enables link system error/warning logging

#### Log Gate: `ATOMA_DEBUG_WORLD_FX`
- **Controls logs in:**
  - `_SafeWorldFXPack.js:28`, `42` - World FX system
- **Effect:** Logs world FX update skips

#### Log Gate: `ATOMA_DEBUG_LINK_VISUALS`
- **Controls logs in:**
  - `NodeLinkingSystem.js:1676` - Link visualization system
- **Effect:** Logs link visualization operations

#### Log Gate: `ATOMA_DEBUG_ARCHETYPE`
- **Controls logs in:**
  - `ArchetypeVisualDifferentiationSystem_v1.js:95` - Archetype system
- **Effect:** Logs archetype visual operations

---

### 3.2 Other Debug Gates

#### Log Gate: `ATOMA_DEBUG_FRAME`
- **Controls logs in:**
  - `main.js:775` - Frame clock stats
  - `FrameScheduler.js:4` - Frame scheduler logs
- **Effect:** Enables frame-level debug logging

#### Log Gate: `ATOMA_DEBUG_CADENCE`
- **Controls logs in:**
  - `main.js:779`, `783` - Semantic cadence logs
- **Effect:** Enables cadence/scheduling debug logging

#### Log Gate: `ATOMA_DEBUG_SHADER`
- **Controls logs in:**
  - `MaterialMutationDetector.js:8`, `11` - Shader mutations
  - `Engine/Debug/ShaderFreezeGuard.js:5`, `8` - Shader freeze guard
  - `Engine/Debug/ShaderVariantDetector.js:5`, `8` - Shader variants
- **Effect:** Enables shader-specific debug logging

#### Log Gate: `__ATOMA_DEBUG_LINK_MATS__`
- **Controls logs in:**
  - `LinkStateVisualLanguageIntegration.js:45` - Link materials
  - `LinkAuraSystem_v1.js:45` - Link aura materials
- **Effect:** Enables link material debugging

#### Log Gate: `__ATOMA_DEBUG_EVENTS`
- **Controls logs in:**
  - `LinkEventOrderValidator.js:25`, `31` - Link event ordering
- **Effect:** Logs link event deferred processing

#### Log Gate: `__ATOMA_QA__`
- **Controls logs in:**
  - `NodeLinkingSystem.js:1854`, `1860` - AI reasoning debug
- **Effect:** Enables AI reasoning debug logs

---

## 4. Performance & Safety Flags

### 4.1 Visual System Flags

#### Flag: `VISUAL_AUTHORITY_LOCK`
- **Default:** `true`
- **Location(s):**
  - `HARD_AUTHORITY_DEBUG_API.js:21`, `30`
  - `HARD_INTERACTION_AUTHORITY_SYSTEM.js:16`
  - `main.js:426`
- **Effect:** Hard lock preventing all visual mutations
- **Category:** VISUAL

#### Flag: `DEBUG_VISUAL_MODE`
- **Default:** `true`
- **Location(s):**
  - `main.js:413`
- **Effect:** Disables visuals and hardens interactions
- **Category:** VISUAL

#### Flag: `ATOMA_VISUAL_BASELINE`
- **Default:** `true`
- **Location(s):**
  - `main.js:377`
- **Effect:** Disables visual updates (baseline mode)
- **Category:** VISUAL

#### Flag: `ATOMA_LINK_VISUALS_ENABLED`
- **Default:** `true`
- **Location(s):**
  - `NodeVisualStateBinder.js:8`
  - `NodeLinkingSystem.js:1664`
- **Effect:** Toggles link rendering
- **Category:** VISUAL

#### Flag: `VISUAL_TIME`
- **Default:** `undefined`
- **Location(s):**
  - `main.js:726`
- **Effect:** Visual network time for animations
- **Category:** VISUAL

#### Flag: `VISUAL_TICKS_ENABLED`
- **Default:** `false`
- **Location(s):**
  - `main.js:730`, `753`, `768`
- **Effect:** Enables per-frame visual tick updates
- **Category:** VISUAL

#### Flag: `VISUAL_SYSTEMS_ENABLED`
- **Default:** `false`
- **Location(s):**
  - `main.js:732`, `743`, `749`, `761`
- **Effect:** Master switch for visual systems
- **Category:** VISUAL

#### Flag: `CONFIG.debug.VISUAL_LOCKDOWN`
- **Default:** `true`
- **Location(s):**
  - `config.js:19`
  - `AINodes.js:551`
- **Effect:** Emergency hard disable of all visual complexity
- **Category:** VISUAL

#### Flag: `CONFIG.visuals.FREEZE_MODE_SAFE`
- **Default:** `true`
- **Location(s):**
  - `config.js:25`
  - `VisualAuthorityLock.js:11`
  - `ControlledUnfreezeSystem_v1.js:15`
- **Effect:** Safe freeze/unfreeze mode
- **Category:** VISUAL

---

### 4.2 Scheduler & Frame Flags

#### Flag: `ATOMA_DEBUG_FRAME`
- **Default:** `false`
- **Location(s):**
  - `main.js:389`
  - `FrameScheduler.js:4`
- **Effect:** Enables frame-level debug logging
- **Category:** FRAME

#### Flag: `__DEBUG_FRAME_BUDGET_ENABLED`
- **Default:** `false`
- **Location(s):**
  - `main.js:405`
- **Effect:** Enables frame budget enforcement
- **Category:** FRAME

#### Flag: `__DEBUG_FRAME_BUDGET_MS`
- **Default:** `3.0`
- **Location(s):**
  - `main.js:406`
- **Effect:** Max time for heavy systems per frame
- **Category:** FRAME

#### Flag: `__DEBUG_FRAME_BUDGET_LOG`
- **Default:** `true`
- **Location(s):**
  - `main.js:407`
- **Effect:** Logs frame budget violations
- **Category:** FRAME

#### Flag: `__DBG_SPIKE_TRACE`
- **Default:** `false`
- **Location(s):**
  - `main.js:408`
- **Effect:** Enables RAF spike tracing
- **Category:** FRAME

#### Flag: `ATOMA_DEBUG_CADENCE`
- **Default:** `false`
- **Location(s):**
  - `main.js:393`
- **Effect:** Enables cadence/scheduling debug logging
- **Category:** SCHEDULER

---

### 4.3 Shader & Mutation Flags

#### Flag: `ATOMA_DEBUG_MATERIAL_MUTATIONS`
- **Default:** `false`
- **Location(s):**
  - `main.js:394`
  - `MaterialMutationDetector.js:17`, `42`
- **Effect:** Tracks material property mutations
- **Category:** MUTATION, SHADER

#### Flag: `__ATOMA_SHADER_TRACE`
- **Default:** `true`
- **Location(s):**
  - `Engine/Debug/ShaderFreezeGuard.js:18`, `28`, `35`
- **Effect:** Enables shader trace logging
- **Category:** SHADER

#### Flag: `__ATOMA_SHADER_FREEZE`
- **Default:** `undefined`
- **Location(s):**
  - `main.js:453`, `457`
- **Effect:** Enables shader freeze guard
- **Category:** SHADER, FREEZE

#### Flag: `ATOMA_DEBUG_SHADER`
- **Default:** `false`
- **Location(s):**
  - `main.js:390`
  - `Engine/Debug/ShaderFreezeGuard.js:5`
  - `Engine/Debug/ShaderVariantDetector.js:5`
- **Effect:** Enables shader debug logging
- **Category:** SHADER

#### Flag: `__B3_MUTATION_NEEDSUPDATE`
- **Default:** `0`
- **Location(s):**
  - `CoreMaterialMutationDetector.js:56`
- **Effect:** Count of needsUpdate mutations
- **Category:** MUTATION

#### Flag: `__B3_MUTATION_ENFORCEMENTS`
- **Default:** `0`
- **Location(s):**
  - `CoreMaterialMutationDetector.js:61`
- **Effect:** Count of mutation enforcement actions
- **Category:** MUTATION

#### Flag: `__B3_MUTATION_DETECTIONS`
- **Default:** `0`
- **Location(s):**
  - `CoreMaterialMutationDetector.js:66`, `74`
- **Effect:** Count of mutation detections
- **Category:** MUTATION

---

### 4.4 Performance & Raycast Flags

#### Flag: `DEBUG_RAYCAST_COST`
- **Default:** `false`
- **Location(s):**
  - `NodeLinkingSystem.js:24`, `29`, `36`
- **Effect:** Enables raycast cost profiling
- **Category:** PERF

#### Flag: `DEBUG_RAYCAST_PROXY`
- **Default:** `false`
- **Location(s):**
  - `NodeLinkingSystem.js:1743`
- **Effect:** Logs hit-proxy raycast behavior
- **Category:** PERF

#### Flag: `DEBUG_CAMERA_INTERACTION_LOAD`
- **Default:** `false`
- **Location(s):**
  - `NodeLinkingSystem.js:1732`
- **Effect:** Logs camera motion gating
- **Category:** PERF

#### Flag: `__raycastCost`
- **Default:** `{ enabled: false }`
- **Location(s):**
  - `NodeLinkingSystem.js:32`, `36`
- **Effect:** Raycast cost instrumentation state
- **Category:** PERF

---

### 4.5 Freeze & Safety Flags

#### Flag: `CONFIG.visuals.FREEZE_MODE_SAFE`
- **Default:** `true`
- **Location(s):**
  - `config.js:25`
- **Effect:** Safe freeze/unfreeze mode
- **Category:** FREEZE

#### Flag: `CONTROLLED_UNFREEZE.VISUAL_FREEZE_ENABLED`
- **Default:** `false`
- **Location(s):**
  - `ControlledUnfreezeSystem_v1.js:15`
- **Effect:** Master freeze toggle
- **Category:** FREEZE

#### Flag: `__ATOMA_SHADER_FREEZE`
- **Default:** `undefined`
- **Location(s):**
  - `main.js:453`, `457`
- **Effect:** Enables shader freeze guard
- **Category:** FREEZE, SHADER

---

## 5. CONFIG-Based Flags

### 5.1 Feature Flags (CONFIG.features)

#### Flag: `CONFIG.features.ENABLE_NODE_AURAS`
- **Default:** `false`
- **Location(s):**
  - `config.js:22`
  - `NodeAuraSystem_v1.js:13`, `28`
  - `MythicAuraIntegration_v1.js:26`
  - `HarmonyAuraController.js:7`
- **Effect:** Enables node aura system
- **Usage:** Modify in config.js

#### Flag: `CONFIG.debug.DEBUG_WAVE_ENGINE`
- **Default:** `false`
- **Location(s):**
  - `config.js:27`
  - `AINodes.js:511`
- **Effect:** Enables wave engine debugging
- **Usage:** Modify in config.js

---

### 5.2 Rendering Flags (CONFIG.rendering)

#### Flag: `CONFIG.rendering.DISABLE_TRANSMISSION_PASS`
- **Default:** `true`
- **Location(s):**
  - `config.js:17`
  - `main.js:451`
- **Effect:** Disables transmission pass (for stabilization)
- **Usage:** Modify in config.js

---

### 5.3 Visual System Config Flags

#### Flag: `NodeVisualIntegrityFix.config.ENABLE_NODE_BREATHING_SCALE`
- **Default:** `false`
- **Location(s):**
  - `NodeVisualIntegrityFix.js:11`
- **Effect:** Enables node scale breathing
- **Usage:** `window.NodeVisualIntegrityAPI.config.ENABLE_NODE_BREATHING_SCALE = true`

#### Flag: `NodeVisualIntegrityFix.config.ENABLE_MESH_OPACITY_PULSING`
- **Default:** `false`
- **Location(s):**
  - `NodeVisualIntegrityFix.js:12`
- **Effect:** Enables mesh opacity pulsing
- **Usage:** `window.NodeVisualIntegrityAPI.config.ENABLE_MESH_OPACITY_PULSING = true`

#### Flag: `NodeVisualIntegrityFix.config.ENABLE_ANTENNA_PULSE`
- **Default:** `false`
- **Location(s):**
  - `NodeVisualIntegrityFix.js:13`
- **Effect:** Enables antenna pulse
- **Usage:** `window.NodeVisualIntegrityAPI.config.ENABLE_ANTENNA_PULSE = true`

#### Flag: `NodeVisualIntegrityFix.config.ENABLE_COMMAND_PULSE`
- **Default:** `false`
- **Location(s):**
  - `NodeVisualIntegrityFix.js:14`
- **Effect:** Enables command pulse
- **Usage:** `window.NodeVisualIntegrityAPI.config.ENABLE_COMMAND_PULSE = true`

#### Flag: `NodeVisualIntegrityFix.config.ENABLE_EMISSIVE_INTENSITY_PULSING`
- **Default:** `false`
- **Location(s):**
  - `NodeVisualIntegrityFix.js:15`
- **Effect:** Enables emissive intensity pulsing
- **Usage:** `window.NodeVisualIntegrityAPI.config.ENABLE_EMISSIVE_INTENSITY_PULSING = true`

---

### 5.4 Enhanced Node Models Flags

#### Flag: `EnhancedNodeModels.config.DISABLE_LEGACY_SCALE_PULSE`
- **Default:** `true`
- **Location(s):**
  - `EnhancedNodeModels.js:14`
- **Effect:** Master disable for all breathing
- **Usage:** `window.EnhancedNodeModels.config.DISABLE_LEGACY_SCALE_PULSE = false`

#### Flag: `EnhancedNodeModels.config.DISABLE_SPINE_BREATHING`
- **Default:** `true`
- **Location(s):**
  - `EnhancedNodeModels.js:15`
- **Effect:** Disable TRANSFORMATION_SPINE breathing
- **Usage:** `window.EnhancedNodeModels.config.DISABLE_SPINE_BREATHING = false`

#### Flag: `EnhancedNodeModels.config.DISABLE_FUNNEL_BREATHING`
- **Default:** `true`
- **Location(s):**
  - `EnhancedNodeModels.js:16`
- **Effect:** Disable INCOMING_FUNNEL width breathing
- **Usage:** `window.EnhancedNodeModels.config.DISABLE_FUNNEL_BREATHING = false`

#### Flag: `EnhancedNodeModels.config.DISABLE_FRACTAL_BREATHING`
- **Default:** `true`
- **Location(s):**
  - `EnhancedNodeModels.js:17`
- **Effect:** Disable FRACTAL_ECHO breathing
- **Usage:** `window.EnhancedNodeModels.config.DISABLE_FRACTAL_BREATHING = false`

#### Flag: `EnhancedNodeModels.config.DISABLE_ANTENNA_PULSE`
- **Default:** `true`
- **Location(s):**
  - `EnhancedNodeModels.js:18`
- **Effect:** Disable SIGNAL_RECEPTOR antenna pulse
- **Usage:** `window.EnhancedNodeModels.config.DISABLE_ANTENNA_PULSE = false`

#### Flag: `EnhancedNodeModels.config.DISABLE_GLOW_PULSING`
- **Default:** `true`
- **Location(s):**
  - `EnhancedNodeModels.js:19`
- **Effect:** Disable COMMAND_PYRAMID glow pulsing
- **Usage:** `window.EnhancedNodeModels.config.DISABLE_GLOW_PULSING = false`

---

## 6. VFX Feature Flags

### 6.1 ATOMA_VFX_* Flags (vfxFlag helper)

These flags use the `vfxFlag()` helper function to control visual features.

#### Flag: `ATOMA_VFX_ENABLE_NODE_INNER_GLOW`
- **Default:** `true` (via vfxFlag default)
- **Location(s):**
  - `_NodeVisuals4_0.js:75`
- **Effect:** Enables node inner glow effect
- **Usage:** `window.ATOMA_VFX_ENABLE_NODE_INNER_GLOW = false`

#### Flag: `ATOMA_VFX_ENABLE_NODE_GLOW`
- **Default:** `true` (via vfxFlag default)
- **Location(s):**
  - `AINodes.js:165`
- **Effect:** Enables node outer glow effect
- **Usage:** `window.ATOMA_VFX_ENABLE_NODE_GLOW = false`

#### Flag: `ATOMA_VFX_ENABLE_NODE_HALO`
- **Default:** `true` (via vfxFlag default)
- **Location(s):**
  - `AINodes.js:177`
- **Effect:** Enables node halo effect
- **Usage:** `window.ATOMA_VFX_ENABLE_NODE_HALO = false`

#### Flag: `ATOMA_VFX_ENABLE_NODE_EDGE_GLOW`
- **Default:** `true` (via vfxFlag default)
- **Location(s):**
  - `AINodes.js:189`
- **Effect:** Enables node edge glow effect
- **Usage:** `window.ATOMA_VFX_ENABLE_NODE_EDGE_GLOW = false`

#### Flag: `ATOMA_VFX_ENABLE_HOLOGRAM_SHELL`
- **Default:** `true` (via vfxFlag default)
- **Location(s):**
  - `CoreHologramShader.js:11`, `23`
- **Effect:** Enables node hologram shell
- **Usage:** `window.ATOMA_VFX_ENABLE_HOLOGRAM_SHELL = false`

---

## 7. System-Specific Debug Flags

### 7.1 Network Fatigue System

#### Flag: `ENABLE_NETWORK_FATIGUE`
- **Default:** `false`
- **Location(s):**
  - `NetworkFatigueSystem_v0_DEBUG.js:10`
- **Effect:** Enables network fatigue simulation
- **Usage:** `setNetworkFatigueEnabled(true)`

#### Flag: `FATIGUE_DEBUG_LOG`
- **Default:** `true`
- **Location(s):**
  - `NetworkFatigueSystem_v0_DEBUG.js:11`, `23`, `29`, `37`
- **Effect:** Enables fatigue debug logging
- **Usage:** Set via API: `setLogging(enabled)`

---

### 7.2 Visual Debug Drawing Flags

These are CONFIG-based flags in various visual systems:

#### Flag: `TopolgyBiasVisualizationSystem.CONFIG.DEBUG_DRAW_BIAS_VECTORS`
- **Default:** `false`
- **Location:** `TopologyBiasVisualizationLayer.js:5`
- **Effect:** Draw bias vectors for topology visualization

#### Flag: `TopologyBiasVisualizationSystem.CONFIG.DEBUG_DRAW_FLOW_FIELDS`
- **Default:** `false`
- **Location:** `TopologyBiasVisualizationLayer.js:6`
- **Effect:** Draw flow fields for topology visualization

#### Flag: `TopologyBiasVisualizationSystem.CONFIG.DEBUG_SHOW_REGIONS`
- **Default:** `false`
- **Location:** `TopologyBiasVisualizationLayer.js:7`
- **Effect:** Show topology regions

#### Flag: `ResonanceEchoTrailSystem.CONFIG.DEBUG_DRAW_ECHOES`
- **Default:** `false`
- **Location:** `ResonanceEchoTrailSystem.js:8`
- **Effect:** Draw resonance echo trails
- **Usage:** Toggle via `window.game.toggleEchoDebug()`

#### Flag: `RegionalHarmonicCycleController.CONFIG.DEBUG_DRAW_CYCLES`
- **Default:** `false`
- **Location:** `RegionalHarmonicCycleController.js:9`
- **Effect:** Draw harmonic cycles
- **Usage:** Toggle via system method

#### Flag: `RegionalHarmonicCycleController.CONFIG.DEBUG_SHOW_PHASE`
- **Default:** `false`
- **Location:** `RegionalHarmonicCycleController.js:10`
- **Effect:** Show phase information

#### Flag: `ProceduralHarmonicGlyphGenerator.CONFIG.DEBUG_DRAW_GLYPHS`
- **Default:** `false`
- **Location:** `ProceduralHarmonicGlyphGenerator.js:9`
- **Effect:** Draw procedural glyphs
- **Usage:** Toggle via system method

#### Flag: `ProceduralHarmonicGlyphGenerator.CONFIG.DEBUG_SHOW_REGIONS`
- **Default:** `false`
- **Location:** `ProceduralHarmonicGlyphGenerator.js:10`
- **Effect:** Show glyph regions

#### Flag: `ProceduralHarmonicGlyphGenerator.CONFIG.DEBUG_SHOW_GENERATION_DATA`
- **Default:** `false`
- **Location:** `ProceduralHarmonicGlyphGenerator.js:11`
- **Effect:** Show glyph generation data

#### Flag: `HarmonicTopologyLearningSystem.CONFIG.DEBUG_DRAW_TOPOLOGY`
- **Default:** `false`
- **Location:** `HarmonicTopologyLearningSystem.js:9`
- **Effect:** Draw topology visualization
- **Usage:** Toggle via `window.game.toggleTopologyDebug()`

#### Flag: `HarmonicTopologyLearningSystem.CONFIG.DEBUG_SHOW_REINFORCEMENT`
- **Default:** `false`
- **Location:** `HarmonicTopologyLearningSystem.js:10`
- **Effect:** Show reinforcement vectors
- **Usage:** Toggle via `window.game.toggleTopologyReinforcement()`

#### Flag: `HarmonicTopologyLearningSystem.CONFIG.DEBUG_SHOW_SCARS`
- **Default:** `false`
- **Location:** `HarmonicTopologyLearningSystem.js:11`
- **Effect:** Show topology scars
- **Usage:** Toggle via `window.game.toggleTopologyScarDebug()`

#### Flag: `HarmonicResonanceFeedbackSystem.CONFIG.DEBUG_DRAW_FIELDS`
- **Default:** `false`
- **Location:** `HarmonicResonanceFeedbackSystem.js:7`
- **Effect:** Draw resonance fields
- **Usage:** Toggle via `window.game.toggleResonanceDebug()`

#### Flag: `CompositeGlyphResonanceFeedback.CONFIG.DEBUG_DRAW_INFLUENCE`
- **Default:** `false`
- **Location:** `CompositeGlyphResonanceFeedback.js:7`
- **Effect:** Draw composite glyph influence zones

#### Flag: `CompositeGlyphResonanceFeedback.CONFIG.DEBUG_SHOW_PHASE_VECTORS`
- **Default:** `false`
- **Location:** `CompositeGlyphResonanceFeedback.js:8`
- **Effect:** Show phase vectors

#### Flag: `CompositeGlyphResonanceFeedback.CONFIG.DEBUG_SHOW_SPACING_MODULATION`
- **Default:** `false`
- **Location:** `CompositeGlyphResonanceFeedback.js:9`
- **Effect:** Show spacing modulation

#### Flag: `CompositeGlyphResonanceFeedback.CONFIG.DEBUG_LOG_RESONANCE_EVENTS`
- **Default:** `false`
- **Location:** `CompositeGlyphResonanceFeedback.js:10`
- **Effect:** Log resonance events

#### Flag: `CompositeGlyphResonanceFeedback.CONFIG.DEBUG_LOG_DECAY_EVENTS`
- **Default:** `false`
- **Location:** `CompositeGlyphResonanceFeedback.js:11`
- **Effect:** Log decay events

#### Flag: `GlyphAnimationModulator.CONFIG.DEBUG_DRAW_ANIMATIONS`
- **Default:** `false`
- **Location:** `GlyphAnimationModulator.js:9`
- **Effect:** Draw glyph animations
- **Usage:** Toggle via system method

#### Flag: `GlyphAnimationModulator.CONFIG.DEBUG_SHOW_ROTATION`
- **Default:** `false`
- **Location:** `GlyphAnimationModulator.js:10`
- **Effect:** Show rotation data

#### Flag: `GlyphAnimationModulator.CONFIG.DEBUG_SHOW_SCALE`
- **Default:** `false`
- **Location:** `GlyphAnimationModulator.js:11`
- **Effect:** Show scale data

#### Flag: `GlyphAnimationModulator.CONFIG.DEBUG_SHOW_OPACITY`
- **Default:** `false`
- **Location:** `GlyphAnimationModulator.js:12`
- **Effect:** Show opacity data

---

## 8. ControlledUnfreezeSystem Flags

### 8.1 System Enable Flags

#### Flag: `ENABLE_PERSONALITY_VFX`
- **Default:** `true`
- **Location:** `ControlledUnfreezeSystem_v1.js:21`
- **Effect:** Enable personality visual effects
- **Usage:** `window.game.controlledUnfreeze.config.ENABLE_PERSONALITY_VFX = false`

#### Flag: `ENABLE_PERSONALITY_SHADER`
- **Default:** `true`
- **Location:** `ControlledUnfreezeSystem_v1.js:22`
- **Effect:** Enable personality shader effects
- **Usage:** `window.game.controlledUnfreeze.config.ENABLE_PERSONALITY_SHADER = false`

#### Flag: `ENABLE_AURA_MODULATION`
- **Default:** `true`
- **Location:** `ControlledUnfreezeSystem_v1.js:23`
- **Effect:** Enable aura modulation
- **Usage:** `window.game.controlledUnfreeze.config.ENABLE_AURA_MODULATION = false`

#### Flag: `ENABLE_METRICS_FX`
- **Default:** `true`
- **Location:** `ControlledUnfreezeSystem_v1.js:24`
- **Effect:** Enable metrics-driven FX
- **Usage:** `window.game.controlledUnfreeze.config.ENABLE_METRICS_FX = false`

#### Flag: `ENABLE_SYNERGY_EFFECTS`
- **Default:** `true`
- **Location:** `ControlledUnfreezeSystem_v1.js:25`
- **Effect:** Enable synergy effects
- **Usage:** `window.game.controlledUnfreeze.config.ENABLE_SYNERGY_EFFECTS = false`

#### Flag: `ENABLE_HARMONY_CONSUMER`
- **Default:** `true`
- **Location:** `ControlledUnfreezeSystem_v1.js:26`
- **Effect:** Enable harmony effects
- **Usage:** `window.game.controlledUnfreeze.config.ENABLE_HARMONY_CONSUMER = false`

#### Flag: `ENABLE_LINK_PERSONALITY`
- **Default:** `true`
- **Location:** `ControlledUnfreezeSystem_v1.js:27`
- **Effect:** Enable link personality
- **Usage:** `window.game.controlledUnfreeze.config.ENABLE_LINK_PERSONALITY = false`

#### Flag: `ENABLE_EVOLUTION_EFFECTS`
- **Default:** `true`
- **Location:** `ControlledUnfreezeSystem_v1.js:28`
- **Effect:** Enable evolution effects
- **Usage:** `window.game.controlledUnfreeze.config.ENABLE_EVOLUTION_EFFECTS = false`

---

## 9. globalThis Flags

### 9.1 Context Flags

#### Flag: `globalThis.__ATOMA_CTX`
- **Default:** `undefined`
- **Location(s):**
  - `NodeEditor.js:38`, `40`, `42`
  - `_NodeLinking2_3.js:4`, `6`, `8`
- **Effect:** ATOMA execution context tracking
- **Usage:** Read-only, set by withSelectionContext()

#### Flag: `globalThis.THREE`
- **Default:** `undefined`
- **Location(s):** Many files (fallback check)
- **Effect:** THREE.js library reference
- **Usage:** Read-only, set by THREE.js initialization

---

## 10. Recommended Core Debug Panel

### Most Useful Flags for Everyday Debugging

These flags are recommended for the core debug panel as they provide the most value for troubleshooting:

#### Primary Debug Switches
```javascript
// Master visual control
window.ATOMA_VISUAL_BASELINE = false;          // Enable visuals (default: true)
window.VISUAL_AUTHORITY_LOCK = false;          // Unlock visual mutations (default: true)
window.DEBUG_VISUAL_MODE = false;              // Enable visuals (default: true)

// Link system debugging
window.ATOMA_LINK_VISUALS_ENABLED = true;      // Enable link rendering (default: true)
window.ATOMA_DEBUG_LINK_VISUALS = true;         // Enable link visualization logs
window.ATOMA_DEBUG_LINK = true;                 // Enable link system debug logs
```

#### Shader & Material Debugging
```javascript
// Shader and material mutation tracking
window.ATOMA_DEBUG_MATERIAL_MUTATIONS = true;  // Track material mutations
window.ATOMA_DEBUG_SHADER = true;              // Enable shader debug logs
window.__ATOMA_SHADER_TRACE = true;            // Enable shader tracing
window.__ATOMA_DEBUG_LINK_MATS__ = true;       // Enable link material debugging
```

#### Performance Monitoring
```javascript
// Performance profiling
window.DEBUG_RAYCAST_COST = true;              // Enable raycast cost profiling
window.DEBUG_RAYCAST_PROXY = true;             // Log hit-proxy behavior
window.__DEBUG_FRAME_BUDGET_ENABLED = true;    // Enable frame budget enforcement
window.__DEBUG_FRAME_BUDGET_LOG = true;        // Log frame budget violations
```

#### Frame & Scheduling
```javascript
// Frame and scheduling debug
window.ATOMA_DEBUG_FRAME = true;               // Enable frame-level logging
window.ATOMA_DEBUG_CADENCE = true;             // Enable cadence logging
```

#### Archetype & Systems
```javascript
// Archetype and system debugging
window.ATOMA_DEBUG_ARCHETYPE = true;           // Enable archetype logging
window.ATOMA_DEBUG_WORLD_FX = true;            // Enable world FX logging
```

---

## 11. Summary Statistics

### Total Count Breakdown

- **Global Debug Flags:** ~45 window.* flags
- **Console Commands:** ~150+ window functions
- **Debug Log Gates:** ~10 ATOMA_DEBUG_* gates
- **Performance Flags:** ~20 PERF/FRAME/SCHEDULER flags
- **Visual Control Flags:** ~15 VISUAL flags
- **Shader Flags:** ~10 SHADER flags
- **Mutation Flags:** ~10 MUTATION flags
- **Feature Flags:** ~25 CONFIG-based flags
- **VFX Flags:** ~5 ATOMA_VFX_* flags
- **globalThis Flags:** ~2 flags

### Most Referenced Flags (by file count)

1. `window.ATOMA_VISUAL_BASELINE` - 12 files
2. `window.DEBUG_VISUAL_MODE` - 10 files
3. `window.VISUAL_AUTHORITY_LOCK` - 8 files
4. `window.ATOMA_DEBUG_MATERIAL_MUTATIONS` - 5 files
5. `window.ATOMA_DEBUG_SHADER` - 4 files
6. `window.ATOMA_DEBUG_LINK` - 2 files
7. `window.DEBUG_RAYCAST_COST` - 3 files

---

## 12. Quick Reference

### Enable Visuals (Full)
```javascript
window.ATOMA_VISUAL_BASELINE = false;
window.VISUAL_AUTHORITY_LOCK = false;
window.DEBUG_VISUAL_MODE = false;
window.ATOMA_LINK_VISUALS_ENABLED = true;
```

### Enable All Debug Logs
```javascript
window.ATOMA_DEBUG = true;
window.ATOMA_DEBUG_FRAME = true;
window.ATOMA_DEBUG_SHADER = true;
window.ATOMA_DEBUG_LINK = true;
window.ATOMA_DEBUG_WORLD = true;
window.ATOMA_DEBUG_CADENCE = true;
window.ATOMA_DEBUG_MATERIAL_MUTATIONS = true;
```

### Enable Performance Monitoring
```javascript
window.DEBUG_RAYCAST_COST = true;
window.DEBUG_RAYCAST_PROXY = true;
window.__DEBUG_FRAME_BUDGET_ENABLED = true;
window.__DEBUG_FRAME_BUDGET_LOG = true;
```

### Disable All Visuals (Safe Mode)
```javascript
window.ATOMA_VISUAL_BASELINE = true;
window.VISUAL_AUTHORITY_LOCK = true;
window.DEBUG_VISUAL_MODE = true;
window.ATOMA_LINK_VISUALS_ENABLED = false;
```

---

## 13. Audit Methodology

This audit was conducted using systematic regex searches across the entire ATOMA codebase:

1. **Window flags:** `window\.[A-Z_][A-Z0-9_]*` pattern
2. **GlobalThis flags:** `globalThis\.[A-Z_][A-Z0-9_]*` pattern
3. **ATOMA_DEBUG gates:** `ATOMA_DEBUG_` pattern
4. **Console commands:** `window\.[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*function` pattern
5. **Visual/Performance flags:** `VISUAL_|PERF_|SCHEDULER_|FRAME_|FREEZE_|SHADER_|MUTATION_` pattern
6. **Debug/Enable/Disable:** `DEBUG_|ENABLE_|DISABLE_` pattern

### Limitations

- This audit focuses on ATOMA internal systems only
- Third-party libraries (THREE.js, etc.) are excluded
- Some flags may be dynamically created at runtime and not visible in source code
- Default values may be overridden by initialization code

---

## 14. Maintenance Notes

### When Adding New Debug Flags

1. Follow naming convention: `window.ATOMA_DEBUG_*` for ATOMA-specific flags
2. Document default value, location(s), and effect
3. Consider impact on performance when enabled
4. Add to this audit document
5. If flag affects multiple systems, document all locations

### When Removing/Deprecated Debug Flags

1. Update this audit document
2. Remove from codebase
3. Check for references in documentation
4. Consider providing migration path if flag was widely used

---

**End of Debug Flags Audit Report**