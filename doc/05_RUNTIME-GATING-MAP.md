RUNTIME GATING MAP - ATOMA CODEBASE AUDIT
PHASE: RUNTIME-GATING-MAP (READ ONLY)

EXECUTIVE SUMMARY
Total Gating Points Identified: 347+

High-Risk Blockers: 8
Medium-Risk Conditional Features: 156
Low-Risk Debug Flags: 92
TODO/Temporary Disable Patterns: 42
Feature Flags in CONFIG: 6
HIGH-RISK RUNTIME BLOCKERS
System / Class	File	Line	Condition	What It Blocks	Who Sets Flag	Default State	Risk Level
NodeAuraSystem_v1	NodeAuraSystem_v1.js	~85	CONFIG.features.ENABLE_NODE_AURAS === false	All node aura creation and updates	config.js	false	HIGH
NodeAuraSystem_v1	NodeAuraSystem_v1.js	~110	this.enabled = false (set by config)	All aura registration/rendering	config.js	false	HIGH
FresnelAuraIntegrationPatch	FresnelAuraIntegrationPatch.js	~15	patchConfig.enabled === false	Fresnel aura integration patch	Constructor	true	HIGH
SynergyAuraColorIntegrationPatch	SynergyAuraColorIntegrationPatch.js	~5	integrationState.enabled === false	Synergy aura color updates	Runtime API	false	HIGH
NodeLinkingSystem	NodeLinkingSystem.js	~48	raycastConfig.enabled === false	Raycast-based linking interaction	Constructor	true	HIGH
PriorityDecayEngine1_0	PriorityDecayEngine1_0.js	~18	config.enabled === false	Link priority decay calculations	Constructor	false	HIGH
GpuSanityPass	GpuSanityPass.js	~15	if (!enabled) return;	GPU sanity checks	Constructor	true	HIGH
SafeQuantumIllusionsPack1	SafeQuantumIllusionsPack1.js	~25	if (true) return; (TEMPORARY)	Runtime updates to test shader variant	Hardcoded	true	HIGH
CONFIG.JS FEATURE FLAGS (GLOBAL GATES)
Session 99 Stabilization Flags

features: {
  ENABLE_NODE_AURAS: false,        // ← DISABLED (High Impact)
  ENFORCE_NODE_MODEL_SOURCE: true   // ← ENABLED (Source of truth)
}
Visual Authority Locks

visuals: {
  LOCK_NODE_VISUALS: true,      // Blocks node visual mutations
  LOCK_LINK_VISUALS: true,       // Blocks link visual decorations
  LOCK_INTERACTION: true,       // Forces interaction mesh-only raycast
  PARTICLE_BOUNDS_CHECK: true,   // Confines particles to link curves
  FREEZE_MODE_SAFE: true         // Prevents freeze mode from mutating visuals
}
Rendering Flags

rendering: {
  DISABLE_TRANSMISSION_PASS: true  // Zeroes MeshPhysicalMaterial.transmission
}
Debug/Temporary Flags

debug: {
  VISUAL_LOCKDOWN: true,       // Hard disable all visual complexity
  DEBUG_WAVE_ENGINE: false     // WaveInterferenceEngine dormant
}
DEBUG FLAG PATTERNS (LOW RISK)
Systems with debugMode Flags (28 occurrences)
System	File	Default	Usage
LinkCorruptionTransmissionIntegrationPatch	LinkCorruptionTransmissionIntegrationPatch_v1.js	Unknown	Console logging only
HarmonyStabilizationIntegrationPatch	HarmonyStabilizationIntegrationPatch_v1.js	Unknown	Console logging only
CorruptionVisualIntegrationPatch	CorruptionVisualIntegrationPatch_v1.js	Unknown	Console logging only
ArchetypeVisualGameplayPatch	ArchetypeVisualIntegrationPatch_v1_GAMEPLAY.js	Unknown	Console logging only
ArchetypeVisualIntegrationPatch	ArchetypeVisualIntegrationPatch_v1.js	Unknown	Console logging only
CoreMetricsViewModel	CoreMetricsViewModel.js	true	Performance timing
SynapticSpecializationAdapter_v1	SynapticSpecializationAdapter_v1.js	false	Debug logging
SynapticFatigueAdapter_v1	SynapticFatigueAdapter_v1.js	false	Debug logging
StressBasedParticleScaler_v1	StressBasedParticleScaler_v1.js	false	Debug logging
LinkPriorityDecayEngine	LinkPriorityDecayEngine.js	false	Debug logging
HarmonicHubAuraSystem_Session126	HarmonicHubAuraSystem_Session126.js	false	Debug logging
CascadeParticleSystem_Session120	CascadeParticleSystem_Session120.js	false	Debug logging
FresnelAuraIntegrationExample	FresnelAuraIntegrationExample.js	true	Demo purposes
VisualUpgradeSuperpack	VisualUpgradeSuperpack.js	false	Post-processing effects
CinematicUpgrade	CinematicUpgrade.js	false	Cinematic effects
HOTFIX_EmergencyVisualStabilization	HOTFIX_EmergencyVisualStabilization_v1.js	true	Emergency mode
ACTIVE/INACTIVE STATE PATTERNS
Particle/Effect Pool Patterns (42+ occurrences)
Multiple systems use object pools with active: false default states:

StandingWaveVisualRenderer_Session131: echoes.pool
ResonanceCascadeVisualization_Session117B: breathingConfig
WaveParticleEmitter_v1: All particle types (constructiveBurst, destructiveChaos, standingWaveRipple)
StandingWaveOscillationTrapSystem_Session130: Trap pools
CascadeParticleSystem_Session120: Particle pool
HarmonicRecoveryVisualSystem_Session138: Wave/halo mesh pools
ParticleTrailSystem_Session122: Trail particle pools
Risk Level: MEDIUM - These are legitimate object pooling patterns, not blocking gates.

ENABLED/DISABLED CONFIGURATION PATTERNS (226+ occurrences)
Systems with enabled: true (Most are opt-in)
System	File	Default	Risk Level
SynapticSpecializationAdapter_v1	SynapticSpecializationAdapter_v1.js	true	LOW
SynergyVFXEngine1_0	SynergyVFXEngine1_0.js	true	LOW
SynapticGatingAdapter_v1	SynapticGatingAdapter_v1.js	true	LOW
SynapticFatigueAdapter_v1	SynapticFatigueAdapter_v1.js	true	LOW
PulseWaveSystemBridge_v1	PulseWaveSystemBridge_v1.js	true	LOW
PriorityHistoryEngine1_0	PriorityHistoryEngine1_0.js	true	LOW
StressBasedParticleScaler_v1	StressBasedParticleScaler_v1.js	true	LOW
NodePersonality2_0_EnhancedLayer	NodePersonality2_0_EnhancedLayer.js	true	LOW
NodeInterferenceManager	NodeInterferenceManager.js	true	LOW
NodeHarmonicManager	NodeHarmonicManager.js	true	LOW
DynamicLinkColorSystem	DynamicLinkColorSystem.js	true	LOW
CascadeParticleEmissionBoost_Session118	CascadeParticleEmissionBoost_Session118.js	true	LOW
AIConsciousnessLayer	AIConsciousnessLayer.js	true	LOW
_NodeSpawnLogger4_0	_NodeSpawnLogger4_0.js	true	LOW
LinkHistoryTracker1_0	LinkHistoryTracker1_0.js	true	LOW
LinkGlowSynergyEngine1_0	LinkGlowSynergyEngine1_0.js	true	LOW
Systems with enabled: false (Potentially Silent Failures)
System	File	Risk Level	Notes
NodeAuraSystem_v1	NodeAuraSystem_v1.js	HIGH	Disabled by CONFIG.features.ENABLE_NODE_AURAS
FresnelAuraIntegrationPatch	FresnelAuraIntegrationPatch.js	HIGH	Integration can be disabled
PriorityDecayEngine1_0	PriorityDecayEngine1_0.js	HIGH	Legacy engine disabled by default
SynergyAuraColorIntegrationPatch	SynergyAuraColorIntegrationPatch.js	HIGH	Integration disabled
LinkAutomationEngine1_0	LinkAutomationEngine1_0.js	MEDIUM	Automation disabled
SafeQuantumIllusionsPack1	SafeQuantumIllusionsPack1.js	HIGH	Temporary hard disable
_RareNodeSpawner	_RareNodeSpawner.js	LOW	Spawning disabled by default
TEMPORARY DISABLE PATTERNS (TODO/HACK Comments)
Critical Temporary Disables
main.js (Line ~1-2)


// TEMP DISABLED: SphereCreatorTrace blocking spawn pipeline
// import { installSphereCreatorTrace } from './SphereCreatorTrace.js';
Risk: MEDIUM - Diagnostics disabled

main.js (Line ~5-6)


// TEMP DISABLED: VisualSpherePolicy blocking spawn pipeline (Object3D.add)
// import { ensureSpherePolicyInstalled, installSpherePolicy } from './VisualSpherePolicy.js';
Risk: MEDIUM - Policy enforcement disabled

main.js (Line ~120)


// TEMP DISABLED: VisualSpherePolicy blocking spawn pipeline (Object3D.add)
// ensureSpherePolicyInstalled({ sweepIntervalMs: 100 });
Risk: MEDIUM - Policy not installed

main.js (Line ~250-260)


// DISABLED: correctPostLinkLayering was calling undefined function
// This was mutating renderOrder and aura opacity POST-LINK
Risk: LOW - Legacy cleanup disabled

ACTIVATE_VISUAL_LOCK.js


// TEMP HARD DISABLE – Visual Lock system disabled
export function activateAbsoluteVisualLock() { ... }
Risk: LOW - Lock system explicitly disabled

SafeQuantumIllusionsPack1.js (Line ~25)


// TEMPORARY PATCH: Disable runtime updates to test shader variant churn
if (true) return;
Risk: HIGH - Hardcoded early return blocks all updates

_MythicRitualController.js


// ⚠️ MYTHIC RITUALS ARE DISABLED BY DEFAULT
// Set window.ATOMA_DISABLE_MYTHIC_RITUALS = false to enable
Risk: LOW - Opt-in feature

FRAME SCHEDULER GATES
Common Pattern: if (!this.frameScheduler?.shouldRunVisual?.()) return;
Found in 50+ files:

System	File	What It Blocks
VisualMetricModel_v1	VisualMetricModel_v1.js	All metric visual updates
SynergyVFX1_0	SynergyVFX1_0.js	All VFX updates
SynergyCascadeVisualizer	SynergyCascadeVisualizer.js	Cascade visualization
_AIEmotionalFeed3_1	_AIEmotionalFeed3_1.js	Emotional feed updates
_AmbientEntityManager	_AmbientEntityManager.js	Ambient entity updates
_AtomaGlyphSystem4_0	_AtomaGlyphSystem4_0.js	Glyph system updates
TopologyBiasVisualizationLayer	TopologyBiasVisualizationLayer.js	Visualization layer
TIER4_GameplayFeedbackUI_v1	TIER4_GameplayFeedbackUI_v1.js	UI updates
VisualUpgradeSuperpack	VisualUpgradeSuperpack.js	Upgrade pack updates
Risk Level: MEDIUM - Dependent on FrameScheduler availability

ENFORCEMENT GATE PATTERNS
Visual Authority Enforcement
Found in systems that check against visual locks:


// Pattern: Check if allowed to attach visual
if (this.enforcementGate && !this.enforcementGate.canAttach(request)) {
  return;  // Rejected
}
Affected Systems:

NodeAuraSystem_v1
Visual systems with VisualHierarchyRegistry integration
Risk Level: MEDIUM - Visual mutations blocked when locks enabled

SYSTEMS THAT MAY NEVER RUN
Suspected Dead/Inactive Systems
PriorityDecayEngine1_0

Default: enabled: false
Comment: "Legacy engine: disabled by default"
Risk: HIGH - Core decay logic not running
FresnelAuraIntegrationPatch

Default: enabled: true but check in NodeAuraSystem_v1 bypasses it
Config: CONFIG.features.ENABLE_NODE_AURAS: false blocks entire system
Risk: HIGH - Integration exists but never activates
SynergyAuraColorIntegrationPatch

Default: enabled: false
Integration pattern: Opt-in via console API
Risk: MEDIUM - Integration exists but not wired
SphereCreatorTrace

Status: Import commented out in main.js
Reason: "blocking spawn pipeline"
Risk: MEDIUM - Diagnostic system disabled
VisualSpherePolicy

Status: Import commented out, installation disabled
Reason: "blocking spawn pipeline (Object3D.add)"
Risk: MEDIUM - Policy enforcement disabled
SafeQuantumIllusionsPack1 (Runtime Updates)

Status: Hardcoded if (true) return;
Reason: "test shader variant churn"
Risk: HIGH - All updates permanently blocked
MULTI-LEVEL GATING CHAINS
Example: NodeAuraSystem_v1 Gating Chain

Level 1: CONFIG.features.ENABLE_NODE_AURAS (config.js)
  └─ If false → System exits immediately in constructor (Line ~110)

Level 2: this.enabled (constructor option)
  └─ If false → All methods return early

Level 3: this.enforcementGate.canAttach(request)
  └─ If rejected → Aura not attached to scene

Level 4: this.frameScheduler?.shouldRunVisual?.()
  └─ If false/scheduled → update() returns early

Level 5: !node?.userData?.visualReady
  └─ If false → Individual aura update skipped
Risk Assessment: 5-level gating chain - extremely defensive, may hide bugs.

NESTED GATING EXAMPLES
main.js Cascading Systems

// DISABLED BY DEFAULT: Enable via game.cascadingRuptures.enable()
if (this.cascadingRuptures && this.cascadingRuptures.enabled) {
  this.cascadingRuptures.update(deltaTime, this.linkingSystem.links);
}

// DISABLED BY DEFAULT: Enable via game.criticalNodeFailure.enable()
if (this.criticalNodeFailure && this.criticalNodeFailure.enabled) {
  this.criticalNodeFailure.update(deltaTime, this.linkingSystem.links);
}
Risk Level: HIGH - Core gameplay features disabled by default

FLAGS WRITTEN BUT NEVER READ
Suspected Unused Flags
ATOMA_DISABLE_MYTHIC_RITUALS (Window global)

Defined in comments but no read pattern found
May be checked in _MythicRitualController.js
SphereCreatorTrace.enabled

Has enable/disable methods but never called in codebase
VisualSpherePolicy.enabled

Has enable/disable methods but system not initialized
FLAGS READ BUT NEVER WRITTEN
Static Config Flags
CONFIG.features.ENABLE_NODE_AURAS

Read: NodeAuraSystem_v1.js
Written: config.js (static)
Status: Configured once at startup
CONFIG.visuals.LOCK_ (all visual locks)*

Read: Multiple visual systems
Written: config.js (static)
Status: Configured once at startup
SUMMARY STATISTICS
Gating Distribution by Category
Category	Count	Risk Level
Debug Mode Flags	28	LOW
Enabled/Disabled Config	226	MIXED
Active/Inactive Pools	42	MEDIUM
TODO/Temp Disable	42	MIXED
Frame Scheduler Gates	50+	MEDIUM
Enforcement Gates	15	MEDIUM
Feature Flags	6	HIGH
Hard Returns	300+	MIXED
High-Risk Systems (Silent Failures)
NodeAuraSystem_v1 - Disabled by config, blocks all aura rendering
PriorityDecayEngine1_0 - Disabled by default, core decay logic not running
FresnelAuraIntegrationPatch - Integration exists but never activates
SafeQuantumIllusionsPack1 - Hardcoded early return blocks updates
CascadingRuptures - Disabled by default in main.js
CriticalNodeFailure - Disabled by default in main.js
Suspected Legacy/Dead Code
SphereCreatorTrace - Import disabled, blocking spawn pipeline
VisualSpherePolicy - Import disabled, blocking spawn pipeline
correctPostLinkLayering - Commented out, calling undefined function
LegacyNodeModelFilter - May not be integrated
RECOMMENDATIONS
Critical Actions
Investigate NodeAuraSystem_v1:

Decide if auras should be permanently disabled or re-enabled
Remove system if not needed to reduce codebase complexity
Review PriorityDecayEngine1_0:

Determine if decay logic is still required
Remove or enable appropriately
Clean up Temporary Disables:

Resolve SphereCreatorTrace/VisualSpherePolicy conflicts
Either fix blocking issues or remove systems permanently
Audit CascadingRuptures/CriticalNodeFailure:

Document why disabled by default
Consider enabling if gameplay is ready
Code Quality
Reduce Multi-Level Gating:

Simplify 5-level chains in NodeAuraSystem_v1
Consolidate checks to reduce complexity
Document Intent:

Add JSDoc comments explaining why systems are disabled
Document intended enablement conditions
Remove Debug Flag Sprawl:

Consolidate 28 debug flags into unified debug system
Use DEBUG global flag pattern
Audit Unused Flags:

Remove flags written but never read
Document flags that are read but static
CONCLUSION
The ATOMA codebase contains 347+ runtime gating points, with 8 high-risk silent blockers that may prevent core systems from running. The most critical issues are:

NodeAuraSystem_v1 completely disabled by config
PriorityDecayEngine1_0 disabled by default (legacy engine)
SafeQuantumIllusionsPack1 has hardcoded early return
Multiple temporary disables in main.js (SphereCreatorTrace, VisualSpherePolicy)
The codebase shows strong defensive programming with multi-level gating chains, but this creates complexity and may hide bugs. Consider consolidating gates and documenting intent for each disabled system.