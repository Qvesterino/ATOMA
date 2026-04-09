# Synergy Visual Systems Audit — 2026-03-12

Scope: synergy-labelled visual systems and related shader/particle pipelines. Classification from live wiring in `main.js`, FrameScheduler registrations, LinkRendererConduit usage, and node visual hooks.

## System Table
SYSTEM | FILE | TYPE | ACTIVE | SCHEDULER | VISUAL TARGET
---|---|---|---|---|---
SynergyPulseVisuals_v1 | SynergyPulseVisuals_v1.js | Node pulse (scale) | ACTIVE (main.js:11511) | yes (`synergyPulseVisuals.realtime`) | Nodes (scale mod)
SynergyCascadeVisualizer | SynergyCascadeVisualizer.js | Link cascade (waves + particles) | ACTIVE (main.js:6509) | yes (`cascadeVisualizer.realtime`) | Links + flow particles
SynergyBonusVisualization_v1 | SynergyBonusVisualization_v1.js | Derived link metric writer | ACTIVE (main.js:7684) | yes (`visual.synergyBonusVisualization`) | Link visualMetrics.synergyBonus
SynergyBonusFXLayer_v1 | SynergyBonusFXLayer_v1.js | Shader flares | ACTIVE (main.js:7701) | yes (`visual.synergyBonusFXLayer`) | Link materials (flares)
SynergyResonanceShaderPack_v1 | SynergyResonanceShaderPack_v1.js | Shader pack (resonance bands) | ACTIVE (main.js:7722) | yes (`visual.synergyResonanceShaderPack`) | Link materials
SynergyChainReaction_v1 | SynergyChainReaction_v1.js | Synergy event propagation | ACTIVE (main.js:7762) | yes (`visual.synergyChainReaction`) | Node/link event streams
SynergyCascadeFXBridge_v1 | SynergyCascadeFXBridge_v1.js | Event→shader bridge | ACTIVE (main.js:7806) | yes (`visual.synergyCascadeFXBridge`) | Resonance/BonusFX/NodeAura/Archetype shaders
SynergyRecommendationDebugHUD | SynergyRecommendationDebugHUD.js | HUD (automation/synergy) | DORMANT (DISABLED flag true despite instantiation) | no | HUD overlay (disabled)
SynergyTravelingWaveFX_v1 | SynergyTravelingWaveFX_v1.js | Wave shader modulator | DORMANT (only referenced in FXDebugSandbox) | no | Link materials (would use wave packs)
SynergyHighways1_0 | SynergyHighways1_0.js | Link ribbon/beams | DORMANT (no imports) | no | Links (beams)
SynergyHighways2_0 | SynergyHighways2_0.js | Link ribbon/beams | DORMANT (no imports) | no | Links (beams)
SynergyHighwayVisuals3D_1_0 | SynergyHighwayVisuals3D_1_0.js | 3D beam set | DORMANT (no imports) | no | Links (volumetric)
LinkGlowSynergyEngine1_0 | LinkGlowSynergyEngine1_0.js | Link glow scaler | DORMANT (no imports; superseded by LinkRendererConduit) | no | Links (glow)
LinkGlowSynergyEngine_v2 | LinkGlowSynergyEngine_v2.js | Link glow scaler v2 | DORMANT (no imports; redundant) | no | Links (glow)
LinkSynergyColorTransition | LinkSynergyColorTransition.js | Gradient colorizer | DORMANT (no imports) | no | Links (color)
SynergyDrivenAuraColorSystem | SynergyDrivenAuraColorSystem.js | Node aura color | DORMANT (integration patch unused) | no | Node auras
SynergyAuraColorIntegrationPatch | SynergyAuraColorIntegrationPatch.js | Aura wiring helper | DORMANT (not applied in main.js) | no | Node auras
SynergyAuraColorIntegrationExample | SynergyAuraColorIntegrationExample.js | Example harness | DORMANT | no | Node auras
SynergyVFX1_0 | SynergyVFX1_0.js | Full VFX engine (glow, trails, bursts) | DORMANT (demo-only; not constructed) | no | Nodes+links (particles/shaders)
SynergyVFXEngine1_0 | SynergyVFXEngine1_0.js | Heavy VFX orchestrator | DORMANT (not referenced) | no | Nodes+links (particles/shaders)
SynergyTrendHUD1_0 | SynergyTrendHUD1_0.js | UI HUD | DORMANT | no | HUD
SynergyTravelingWaveFX_v1 (SNIPPETS) | SNIPPETS/W23_TRAVELING_WAVE_FX_SNIPPETS.js | Snippet/demo | LEGACY/demo | no | Links (wave)
SynergyStateResolver | SynergyStateResolver.js | Threshold helper | DORMANT (only used by dormant NeonLinkVisuals) | no | Shared logic
NodeSynergyIntegration1_0 | NodeSynergyIntegration1_0.js | Metric/VFX bridge | DORMANT (not wired in main.js) | no | Link metric events → VFX
NodeSynergyInterferenceController | NodeSynergyInterferenceController.js | Node interference calc | DORMANT (not instantiated) | no | Node aura/interference
LEGACY SynergyGlowController | LEGACY/aura/SynergyGlowController.js | Legacy aura glow | LEGACY | no | Node auras
LEGACY SynergyGlowShaderMaterial | LEGACY/aura/SynergyGlowShaderMaterial.js | Legacy shader | LEGACY | no | Node auras

## Activation & Wiring Notes
- FrameScheduler: Active systems registered under `visual.*` or `*.realtime` ticks (e.g., `visual.synergyBonusFXLayer` and `synergyPulseVisuals.realtime` in `main.js`). DORMANT/LEGACY rows have no scheduler hooks.
- LinkRendererConduit: currently drives synergy-responsive materials/particles internally via `link.userData.metrics.synergy` (see LinkRendererConduit.js:1910–2460) but does not call any of the dormant LinkGlow/SynergyVFX/Highway systems. Active synergy bonuses/resonance packs operate in parallel, not through Conduit.
- Node visual systems: only SynergyPulseVisuals_v1 attaches to node lists (`main.js:11511`); no active aura color integrator is applied.

## Shader Integrations (detected)
- WaveShaderBridge_v1 (main.js:5072, FrameScheduler `visual.waveShaderBridge`) — ACTIVE.
- WaveTravelShaderPack_v1 (main.js:5094, scheduler `visual.waveTravelShaderPack`) — ACTIVE.
- WaveDynamicsShaderPack_v1 (main.js:5103, scheduler `visual.waveDynamicsShaderPack`) — ACTIVE.
- SynergyTravelingWaveFX_v1 is DORMANT and not registered with the above packs (orphaned).

## Particle / Beam Systems
- Active particles: SynergyCascadeVisualizer (flow particles along cascade paths). LinkRendererConduit emits synergy-influenced sparks/trails but via its own pool, not a dedicated synergy-named system.
- Beam/ribbon systems: SynergyHighways* and LinkGlowSynergyEngine* are present but unused.
- Aura-related: SynergyDrivenAuraColorSystem and legacy SynergyGlow* are not wired; active aura responses currently come only via SynergyCascadeFXBridge → NodeAuraSystem when a cascade fires.

## Unused / Duplicate Synergy Effects
- Redundant link-glow stack: LinkGlowSynergyEngine1_0, LinkGlowSynergyEngine_v2, LinkSynergyColorTransition, SynergyHighways* — all superseded by LinkRendererConduit’s built-in synergy handling and remain dormant.
- Heavy VFX engines (SynergyVFX1_0 / SynergyVFXEngine1_0) are unused and not connected to canonical metrics; keeping them disabled avoids duplicate particle fields.
- SynergyTravelingWaveFX_v1 overlaps with active Wave* shader packs but is never wired; safe to keep dormant unless an explicit wave-based synergy visual is reintroduced.

## Visual systems not connected to metrics.synergy
- SynergyRecommendationDebugHUD (disabled) and SynergyTrendHUD1_0 are UI-only and do not read canonical `metrics.synergy`.
- Dormant aura/color systems (SynergyDrivenAuraColorSystem, SynergyAuraColorIntegrationPatch/Example) are not currently fed the canonical synergy metric because they are not instantiated.
