TIME-AUTHORITY-FORENSIC AUDIT REPORT
EXECUTIVE SUMMARY
Total Independent Time Authorities Identified: 7

The ATOMA codebase has a central timing architecture in main.js but suffers from multiple independent time sources creating potential inconsistencies. While core systems use the central clock.getDelta(), many peripheral systems compute their own deltas or use wall-clock timers.

CENTRAL TIME AUTHORITY
1. MAIN.JS CLOCK (PRIMARY AUTHORITY)
System/File: main.js:AtomaGame
Time Source: new THREE.Clock()
Update Frequency: Per frame (60 Hz nominal via requestAnimationFrame)
Inside FrameScheduler: NO (scheduler receives delta FROM this clock)
Delta Method: this.clock.getDelta() with clamp to 0.1s
Code:

this.clock = new THREE.Clock();
const deltaTime = Math.min(this.clock.getDelta(), 0.1);
this.time += deltaTime;
FRAME SCHEDULER SYSTEM
2. FRAME SCHEDULER (SECONDARY AUTHORITY)
System/File: FrameScheduler.js
Time Source: Receives deltaTime as parameter from main.js
Update Frequency: Layer-based (60/30/10/2 Hz)
Inside FrameScheduler: YES (this IS the scheduler)
Delta Method: Passed as parameter, NOT computed locally
Layers:
realtime: 60 Hz (camera, input, core rendering)
visual: 30 Hz (visual effects, shaders, auras)
simulation: 10 Hz (AI, glyphs, metrics)
background: 2 Hz (rare events, narrative)
Code:

tick(deltaTime) {
    for (const [layerName, layer] of Object.entries(this.layers)) {
        layer.accumulator += deltaTime;
        while (layer.accumulator >= layer.interval) {
            for (const entry of layer.functions) {
                entry.fn(layer.interval); // Uses fixed interval, not deltaTime
            }
            layer.accumulator -= layer.interval;
        }
    }
}
INDEPENDENT CLOCK INSTANCES (VIOLATIONS)
3. NEURAL CURVE LINK VISUALS
System/File: _NeuralCurveLinkVisuals.js
Time Source: this.clock = new THREE.Clock()
Update Frequency: Per frame (independent RAF loop)
Inside FrameScheduler: NO
Delta Method: clock.getDelta() (independent clock)
Risk: HIGH - Visual system with independent time
4. LINK MORPHING EXAMPLES
System/File: LINK_MORPHING_EXAMPLES.js
Time Source: clock.getDelta() (Clock instance in closure)
Update Frequency: Per frame (local RAF loop)
Inside FrameScheduler: NO
Delta Method: clock.getDelta()
Risk: MEDIUM - Example/snippet code
5. WEEK 8 ALT INTEGRATION SNIPPETS
System/File: WEEK8_ALT_INTEGRATION_SNIPPETS.js
Time Source: this.clock = new THREE.Clock()
Update Frequency: Per frame (local animate loop)
Inside FrameScheduler: NO
Delta Method: this.clock.getDelta()
Risk: LOW - Snippet/example file
6. WEEK 9 AURA INTEGRATION SNIPPETS
System/File: WEEK9_AURA_INTEGRATION_SNIPPET.js
Time Source: this.clock = new THREE.Clock()
Update Frequency: Per frame (render loop)
Inside FrameScheduler: NO
Delta Method: this.clock.getDelta()
Risk: LOW - Snippet/example file
7. WEEK 16 SHADER MODE SNIPPETS
System/File: WEEK16_SHADER_MODE_SNIPPETS.js
Time Source: clock.getDelta() (Clock instance)
Update Frequency: Per frame (RAF loop)
Inside FrameScheduler: NO
Delta Method: clock.getDelta()
Risk: LOW - Snippet/example file
WALL-CLOCK TIMING SYSTEMS
8. PERFORMANCE.NOW() USAGE
Systems using performance.now() directly:

NodeHierarchyVisualFeedback_v1.js - Animations with elapsed time
HARMONIC_HUB_INTEGRATION_EXAMPLES.js - Watch intervals
HarmonicHubDebugger.js - Debug timing
LinkAutomationMonitor3_0.js - Performance monitoring
W23_TRAVELING_WAVE_FX_SNIPPETS.js - Wave animation timing
Total instances: 15+ files
Risk: MEDIUM - Wall-clock timing not synchronized with game delta
SETINTERVAL SYSTEMS (PERIODIC TASKS)
9. HIGH-RISK INTERVALS
System/File	Interval	Purpose	Inside FrameScheduler
AtomaDebugHUD_1_0.js	~60Hz	Debug HUD refresh	NO
SynergyTrendHUD1_0.js	Configurable	Canvas rendering	NO
SynergyRecommendationDebugHUD.js	Configurable	Debug HUD	NO
LinkFeedbackHUD1_0.js	Configurable	Link feedback refresh	NO
LinkAutomationMonitorHUD2_0.js	500ms	Automation monitoring	NO
LinkAutomationMonitor3_0.js	Variable	Update loop	NO
AtomaAudioSystem.js	Variable	Sound delay scheduling	NO
AutoLinkFeedbackUI1_0.js	16ms (~60Hz)	Position updates	NO
ControlSpineVariants_Session100.js	Variable	Fade animations	NO
VisualSpherePolicy.js	25ms	Policy installation	NO
EnforcementViolationAutoRecovery.js	Variable	Frame-limited recovery	NO
NodeSurfaceProtectionRule_v2.js	Variable	Frame counter reset	NO
CoreMaterialMutationDetector.js	Variable	Frame counter reset	NO
GpuSanityPass.js	Configurable	GPU monitoring	NO
ShaderFreezeGuard.js	Variable	Warmup/checking	NO
_VisualLockCompleteIntegration.js	Variable	Repair loop	NO
Phase8RitualVisualOrchestration.js	Variable	Ritual checking	NO
PHASE5_MultiNetworkOrchestrator_v1.js	Variable	Network sync	NO
Total setInterval count: 40+ independent timers

Risk: HIGH - Multiple systems with independent periodic loops

SETTIMEOUT SYSTEMS (DELAYED TASKS)
10. HIGH-RISK TIMEOUTS
System/File	Purpose	Inside FrameScheduler
NodeLinkingSystem.js	Click handling, arrow fade, RMB reset	NO
_MythicNodeCreation.js	Ritual cleanup (FIXED in Session 37+)	PARTIALLY
_MythicRitualPlayer.js	Ritual HUD hide, node material fade	NO
_SafeLegendaryNodePack.js	VFX cleanup	NO
_SafeLegendaryLinkFX.js	Link VFX cleanup	NO
_RecursiveGlyphMessaging4_0.js	Chain cleanup	NO
_AtomaGlyphSystem4_0.js	Animation timing	NO
_AtomaLanguageEngine3_0.js	Auto-hide elements	NO
_AIEmotionalFeed3_1.js	Feed transitions	NO
AutoLinkFeedbackUI1_0.js	Pulse fade, tooltip fade, notifications	NO
TIER4_GameplayFeedbackUI_v1.js	Notification removal	NO
ArchetypeVisualTransitionEngine_v2.js	VFX glow transitions	NO
DynamicLinkColorSystem.js	Stats logging delay	NO
CorruptionVisualFX_v1.js	Corruption level reset	NO
DreamDepthEffectManager.js	Pulse effect delay	NO
LinkVisualMoodSystem.js	Mood activation delay	NO
LinkCorruptionTransmission_v1.js	Cascade cleanup	NO
Phase8RitualVisualOrchestration.js	Modifier cleanup	NO
SafeWorldResetFix1_0.js	Ready state polling	NO
NodeInspectOverlay1_0.js	Position repositioning	NO
NodeInspectOverlay3_0.js	Fade timing	NO
UINodeInspectPanel.js	Fade timing	NO
UISelectedNodeBadge3_2.js	Opacity transitions	NO
UISelectedNodeLabel3_3.js	Opacity transitions	NO
UISelectedNodeTopBar3_4.js	Opacity transitions	NO
UIPrimaryNodeTopBar3_7.js	Opacity/display transitions	NO
SynergyHighways2_0.js	Rebuild delay	NO
VisualAudit.js	DOM timing	NO
Total setTimeout count: 60+ delayed task instances

Risk: HIGH - Wall-clock delays not game-time aware

REQUESTANIMATIONFRAME SYSTEMS
11. INDEPENDENT RAF LOOPS
System/File	Purpose	Inside FrameScheduler
main.js	PRIMARY LOOP	N/A (source)
LINK_MORPHING_EXAMPLES.js	Example animate loop	NO
WAVE_INTERFERENCE_ENGINE_SNIPPETS.js	Example animate loop	NO
W23_TRAVELING_WAVE_FX_SNIPPETS.js	Wave animation loops	NO
WEEK16_SHADER_MODE_SNIPPETS.js	Example animate loop	NO
SYNERGY_MAIN_JS_EXAMPLE.js	Example animate loop	NO
HARMONIC_HALO_EXAMPLES.js	Example animate loop	NO
HARMONIC_HUB_INTEGRATION_EXAMPLES.js	Example animate loop	NO
WEEK25_CASCADE_FX_SNIPPETS.js	Cascade animation	NO
RITUAL_VISUAL_ORCHESTRATOR_EXAMPLES.js	Ritual animation	NO
FresnelAuraIntegrationExample.js	Example animate loop	NO
SYSTEM_INIT_VALIDATOR_MAINJS_PATCH.js	Example animate loop	NO
_AtomaGlyphSystem4_0.js	Animation fade-out	NO
_MythicSeedGlyph.js	Animation fade-out	NO
_FractalHexMarker.js	Animation fade-out	NO
NodeHierarchyVisuals_v1.js	Animation loop	NO
T4004_HARMONY_HEALING_TEST_RUNNER.js	Test runner loop	NO
Total requestAnimationFrame usage: 20+ instances

Risk: MEDIUM - Most are example files, but some are active systems

MIXED TIME UNITS DETECTED
SECONDS vs MILLISECONDS CONFLICTS
Using SECONDS:

main.js - clock.getDelta() returns seconds
FrameScheduler.js - Layer intervals in seconds
All update(deltaTime) methods expect seconds
Using MILLISECONDS:

performance.now() - Returns milliseconds
setTimeout/setInterval - Expects milliseconds
Most DOM/animation systems use performance.now() - Date.now() / 1000
Conversion Points:


// In main.js:
const deltaTime = Math.min(this.clock.getDelta(), 0.1); // SECONDS
const deltaTimeMs = deltaTime * 1000; // MS CONVERSION

// In many files:
const now = performance.now(); // MS
const elapsed = (Date.now() - startTime) / 1000; // MS → SECONDS
Risk: MEDIUM - Inconsistent unit tracking across systems

FIXED TIMESTEP LOOPS
12. FIXED TIMESTEP SYSTEMS
Systems using fixed/hardcoded deltas:

FrameScheduler.js - Uses layer.interval (fixed 1/60, 1/30, 1/10, 1/2)
HARMONIC_RESILIENCE_EXAMPLES.js - elapsed += 0.016 (hardcoded 60 FPS)
NetworkFatigueSystem_v0.js - Uses fixed interval loops
Various snippet files with elapsed += 0.1 patterns
Example from FrameScheduler:


while (layer.accumulator >= layer.interval) {
    for (const entry of layer.functions) {
        entry.fn(layer.interval); // FIXED interval, not actual delta!
    }
    layer.accumulator -= layer.interval;
}
Risk: LOW - Intentional design for layered frequencies, not a bug

SYSTEMS VIOLATING CENTRAL TIMING
HIGH-RISK SYSTEMS
_NeuralCurveLinkVisuals.js

Independent Clock instance
Own RAF loop
Not integrated with FrameScheduler
Visual system
LinkFeedbackHUD1_0.js

setInterval-based refresh loop
Independent periodic timer
Not game-time aware
UI system
AutoLinkFeedbackUI1_0.js

Multiple setInterval timers (16ms position updates)
setTimeout for fade timing
Not integrated
Visual feedback system
AtomaDebugHUD_1_0.js

setInterval refresh loop
Independent timing
Debug overlay
NodeLinkingSystem.js

Multiple setTimeout for click handling
setTimeout for arrow fade
setTimeout for RMB reset
Core gameplay system (HIGH RISK)
MEDIUM-RISK SYSTEMS
UI Systems (All _UI.js files)*

Extensive setTimeout for opacity transitions
Not game-time aware
UI layer only (acceptable)
Mythic Ritual Systems

Session 37+ partially fixed
Some setTimeout still present
Ritual VFX systems
Link Automation Monitors

setInterval-based monitoring
Independent refresh cycles
Gameplay-affecting systems
LOW-RISK SYSTEMS
Example/Snippet files (WEEK*, EXAMPLES*, SNIPPETS*)

Intentionally independent
Not production code
Test runner files (T4004_, TEST_)

Testing infrastructure
Not runtime systems
SUMMARY STATISTICS
Time Authorities by Type:
Central Clock: 1 (main.js THREE.Clock)
Independent Clocks: 5 (_NeuralCurveLinkVisuals + 4 snippet files)
setInterval timers: 40+ (active systems)
setTimeout delays: 60+ (active systems)
requestAnimationFrame loops: 20+ (1 primary, 4 active, 15 examples)
performance.now() usage: 15+ files
Systems Inside FrameScheduler:
YES: Core systems registered via scheduler.register()
NO: 80% of peripheral systems (UI, monitors, VFX, linking)
High-Risk Systems (Visual, Physics, Linking, World):
_NeuralCurveLinkVisuals - Independent clock + RAF
NodeLinkingSystem - setTimeout-based click/timing logic
LinkFeedbackHUD1_0 - Independent refresh interval
AutoLinkFeedbackUI1_0 - Multiple independent intervals
AtomaDebugHUD_1_0 - Independent refresh interval
Mythic Ritual Systems - Partial setTimeout usage
Link Automation Monitors - Independent timing
RECOMMENDATIONS
CRITICAL:
Migrate NodeLinkingSystem setTimeout logic to game-time tracking
Integrate _NeuralCurveLinkVisuals with FrameScheduler
Replace HUD/UI setTimeout with game-time driven transitions
HIGH PRIORITY:
Unify interval-based systems under FrameScheduler
Standardize all time units (choose seconds, enforce everywhere)
Create game-time aware delay system (replace setTimeout)
MEDIUM PRIORITY:
Audit all example files for production usage
Remove independent Clock instances from non-example files
Consolidate performance.now() usage into time authority
LOW PRIORITY:
Clean up snippet/example files
Document intentional fixed-timestep systems
Create time authority test suite
AUDIT COMPLETE Total Systems Analyzed: 200+ files Independent Time Authorities: 7 Violations of Central Timing: 45+ systems High-Risk Systems: 7