NODE-VISUAL-MUTATION-MAP - FORENSIC AUDIT REPORT
PHASE: READ-ONLY ANALYSIS
STEP 1 — NODE CREATION BASELINE
Primary Creation System: EnhancedNodeModels.js

What is defined at creation:

Property	Defined at Creation
scale	Base scale from geometry
material color	Archetype/base color applied
emissive	Initial emissive (often 0x000000)
opacity	Initial opacity (often 1.0 for core)
children meshes	Core, shell, surfaces
shells	Shell geometry added
particles	Particle systems attached
aura	Aura mesh added (if enabled)
geometry	Sphere geometries per category
Key Finding: Visual properties are established once during spawn via EnhancedNodeModels.js, but multiple systems modify them at runtime.

STEP 2 — VISUAL MUTATIONS AFTER CREATION
SYSTEMS MODIFIYING NODE VISUALS:
System	File	Function	Property Modified	Trigger
AuraModulationSystem	AuraModulationSystem.js	applyOpacityPulse	aura.material.opacity	Per-frame + Event-driven
AuraModulationSystem	AuraModulationSystem.js	applyScaleSwell	aura.scale	Per-frame + Event-driven
AuraModulationSystem	AuraModulationSystem.js	applyColorTint	aura.material.color	Per-frame + Event-driven
AuraModulationSystem	AuraModulationSystem.js	applyGlowIntensity	aura.material.emissive	Per-frame + Event-driven
HarmonyAuraController	HarmonyAuraController.js	update()	aura.uniforms.opacity	Per-frame
HarmonyAuraController	HarmonyAuraController.js	update()	aura.uniforms.radius	Per-frame
HarmonyAuraController	HarmonyAuraController.js	update()	aura.uniforms.pulse	Per-frame
EventVisualSuppression	EventVisualSuppression_v1.js	suppressVFXEventEffects	core.material.opacity	Event-driven
EventVisualSuppression	EventVisualSuppression_v1.js	suppressVFXEventEffects	core.material.emissive	Event-driven
ArchetypeVisualDifferentiation	ArchetypeVisualDifferentiationSystem_v1.js	buildOverlayForProfile	overlay.scale	Per-frame animation
ArchetypeVisualDifferentiation	ArchetypeVisualDifferentiationSystem_v1.js	buildOverlayForProfile	overlay.material.opacity	Per-frame animation
NodeVisualFreezeMode	NodeVisualFreezeMode_v1.js	freezeNode	core.material.*	One-time (spawn)
FXRuntime	FXRuntime_v1.js	update()	Delegates to all FX	Per-frame orchestration
STEP 3 — MUTATION TYPE CLASSIFICATION
System	Type	Frequency	Risk Level
AuraModulationSystem	Opacity/Scale/Color/Emissive/Aura	Per-frame	HIGH
HarmonyAuraController	Opacity/Radius/Pulse/Aura	Per-frame	HIGH
EventVisualSuppression	Opacity/Emissive/Core	Event-driven	MEDIUM
ArchetypeVisualDifferentiation	Overlay Geometry/Color/Scale	Per-frame	MEDIUM
NodeVisualFreezeMode	Core Material Lock	One-time	LOW
FXRuntime	Orchestration	Per-frame	HIGH (aggregator)
STEP 4 — MULTIPLE AUTHORITY CONFLICTS
CONFLICT MATRIX
Property	Systems Modifying It	Conflict Risk
aura.opacity	AuraModulationSystem, HarmonyAuraController	HIGH (2 systems, per-frame)
aura.scale	AuraModulationSystem	LOW (1 system)
aura.emissive	AuraModulationSystem	LOW (1 system)
aura.color	AuraModulationSystem	LOW (1 system)
core.opacity	EventVisualSuppression	LOW (1 system, suppressed)
core.emissive	EventVisualSuppression	LOW (1 system, suppressed)
core.material	NodeVisualFreezeMode	LOW (1 system, frozen)
overlay.opacity	ArchetypeVisualDifferentiation	LOW (1 system)
overlay.scale	ArchetypeVisualDifferentiation	LOW (1 system)
Key Finding: Only aura.opacity has 2 competing systems modifying it per-frame. Most properties have single authority.

STEP 5 — GLOBAL VISUAL OVERRIDES
Flag	File	What it Blocks
CONFIG.debug.VISUAL_LOCKDOWN	config.js	ALL visual complexity (emergency)
CONFIG.visuals.LOCK_NODE_VISUALS	config.js	All node visual mutations
CONFIG.visuals.LOCK_LINK_VISUALS	config.js	All link visual mutations
CONFIG.features.ENABLE_NODE_AURAS	config.js	DISABLED - All aura systems blocked
CONFIG.rendering.DISABLE_TRANSMISSION_PASS	config.js	MeshPhysicalMaterial.transmission
CRITICAL FINDING: CONFIG.features.ENABLE_NODE_AURAS = false effectively disables:

AuraModulationSystem
HarmonyAuraController
All aura-based mutations
CURRENT STATUS: AURA SYSTEMS ARE DISABLED by default in config.js

STEP 6 — WORLD/CONTEXT-LEVEL MUTATIONS
System	Trigger	Properties Affected
ArchetypeVisualDifferentiation	Archetype assignment	Overlay color, scale, particles
HarmonicResonanceFeedback	Composite glyph synthesis	Link phases (not direct node)
EventVisualSuppression	Game events	Core opacity/emissive (suppressed)
Note: Most world-level mutations affect aura/overlay layers, not core node materials.

FINAL SUMMARY
1) TOTAL VISUAL MUTATION SYSTEMS FOUND: 6
AuraModulationSystem (HIGH RISK)
HarmonyAuraController (HIGH RISK)
EventVisualSuppression_v1 (MEDIUM RISK)
ArchetypeVisualDifferentiationSystem_v1 (MEDIUM RISK)
NodeVisualFreezeMode_v1 (LOW RISK)
FXRuntime_v1 (HIGH RISK - orchestrator)
2) SYSTEMS RUNNING PER-FRAME: 3
AuraModulationSystem
HarmonyAuraController
FXRuntime_v1 (delegates to others)
3) PROPERTIES WITH MULTIPLE AUTHORITIES: 1
aura.opacity (AuraModulationSystem + HarmonyAuraController)
4) GLOBAL VISUAL LOCKS DETECTED: 5
VISUAL_LOCKDOWN (debug)
LOCK_NODE_VISUALS
LOCK_LINK_VISUALS
ENABLE_NODE_AURAS (DISABLED by default)
DISABLE_TRANSMISSION_PASS
5) HIGHEST-RISK MUTATION SOURCES:
AuraModulationSystem - Modifies 4 properties per-frame (opacity, scale, color, emissive)
HarmonyAuraController - Modifies 3 properties per-frame (opacity, radius, pulse)
FXRuntime_v1 - Orchestrates all FX systems, potential cascade
6) BASE CREATION VS RUNTIME OVERRIDE RATIO:
Base Creation: 1 system (EnhancedNodeModels.js)
Runtime Override: 6 systems (1 per-frame core + 3 per-frame aura + 2 overlay)
Ratio: ~6:1 (runtime:base)
KEY INSIGHTS
AURA SYSTEMS ARE CURRENTLY DISABLED via CONFIG.features.ENABLE_NODE_AURAS = false. This effectively neutralizes the highest-risk mutation systems.

CORE NODE VISUALS ARE PROTECTED by:

NodeVisualFreezeMode_v1 (creates authoritative material)
EventVisualSuppression_v1 (guards against core dilution)
CONFIG.visuals.LOCK_NODE_VISUALS
ONLY AURA PROPERTIES HAVE CONFLICTS between AuraModulationSystem and HarmonyAuraController. All other properties have single authority.

OVERLAY PATTERN ADOPTED: ArchetypeVisualDifferentiationSystem_v1 uses overlay-only approach, avoiding direct base mutations.

AUTHORITY LOCKDOWN ACTIVE: Multiple global flags (VISUAL_LOCKDOWN, LOCK_NODE_VISUALS, ENABLE_NODE_AURAS=false) provide emergency stability controls.

RISK ASSESSMENT
Overall Risk Level: LOW-MEDIUM

Why LOW:

Aura systems disabled by default
Core materials frozen at spawn
Event suppression guards against core dilution
Global locks in place
Why MEDIUM:

If auras are re-enabled, 2 systems compete for aura.opacity
FXRuntime_v1 orchestrates all mutations
No clear authority ordering documented
Recommendation: Keep auras disabled until conflict between AuraModulationSystem and HarmonyAuraController is resolved via single authority model.

END OF FORENSIC AUDIT - READ ONLY