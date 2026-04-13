# Harmony / Harmonic VFX Audit

This audit covers workspace modules that create harmony/harmonic visuals, drive those visuals, or exist as debug and legacy helpers. The main split is simple: does the module own visible geometry, or does it only modify existing meshes and materials?

Classification used below:
- geometry producer: creates its own visible mesh, points, or lines
- shader/material layer: changes existing geometry only
- controller/orchestrator: updates state used by other visual systems
- debug/legacy: useful for inspection, but not part of the primary runtime stack

## Visual Geometry Producers

- `HarmonicHubAuraSystem_Session126.js`: shared resonance field around harmonic hubs. Geometry: outer and inner `IcosahedronGeometry`, optional `TorusGeometry` ring, and a debug `SphereGeometry`. Notes: the field is built as a layered group, so the shell reads as a calm hub envelope instead of a flat glow.

- `HarmonicNodeResonanceHalos.js`: soft volumetric halo around hubs. Geometry: custom `BufferGeometry` ring/halo surface built from inner and outer radius layers. Notes: cached per node, so the halo behaves like a stable hub authority signal.

- `HarmonicResonanceCoupling_v1.js`: resonance line between linked nodes plus a midpoint orb. Geometry: `BufferGeometry` line rendered as `THREE.Line`, plus a `SphereGeometry(0.04, 8, 8)` orb. Notes: the visible pulse is line-first and orb-second.

- `HarmonicInfluencePropagationSystem_Session127.js`: transparent flame-like influence aura around active nodes and flow segments on links. Geometry: `IcosahedronGeometry(1.0, 3)` aura, LOD `IcosahedronGeometry(1.0, 2)`, and `CylinderGeometry` link flows. Notes: additive, subtle, and LOD-aware.

- `LinkResonanceFlowSystem_Session124.js`: the most complex link pulse rig in the stack. Geometry: `IcosahedronGeometry` core, sheath, shell, and ghost; `CylinderGeometry` trail; `OctahedronGeometry` shards; `TorusGeometry` halo; `TorusKnotGeometry` swirl. Notes: this is a composite `THREE.Group`, not a single primitive.

- `LinkSemanticPictogramSystem_Enhanced.js`: symbolic link pictograms for harmony, synergy, stability, corruption, and load pressure. Geometry: `TorusGeometry` family for rings and arcs, `SphereGeometry` for cores and sparks, `PlaneGeometry` for diamond tokens. Notes: this is the active semantic link language, and it owns the final pictogram scale.

- `RegionalHarmonyZones.js`: soft clustered regional harmony zones. Geometry: `IcosahedronGeometry(radius, 3)`. Notes: the zones are world overlays with very low opacity, not hard boundaries.

- `ProceduralHarmonicGlyphGenerator.js`: emergent glyph language derived from topology and regional history. Geometry: `BufferGeometry` line sets in arc, loop, radial, and woven patterns, rendered as stacked line layers. Notes: the glyphs are line-based, not mesh-based.

- `HarmonicResonanceFeedbackSystem.js`: probability clouds and resonance fields. Geometry: `BufferGeometry` + `THREE.Points`; debug field uses `SphereGeometry(1, 16, 16)`. Notes: the particle cloud is the effect, not a side object.

- `HarmonicRecoveryVisualSystem_Session138.js`: recovery waves and halo blooms after rupture. Geometry: `PlaneGeometry(1, 1)` for both the coherence wave and the recovery halo. Notes: fully shader-driven, flat quads with circular masks.

- `HealingParticleSystem_Session136.js`: healing trails and scar sparkles. Geometry: `BufferGeometry` + `THREE.Points`; debug cube uses `BoxGeometry(80, 80, 80)` and debug probe uses `SphereGeometry(0.25, 10, 10)`. Notes: the runtime effect is particle-based.

- `CascadeResonanceWaveVisualization_Session146.js`: subtle wavefront rings and link beams during cascade convergence. Geometry: `PlaneGeometry(1, 1, 32, 32)` ring planes and `BufferGeometry` line beams. Notes: the wave is intentionally ghost-level, but it is still a real mesh system.

- `HarmonicTopologyLearningSystem.js`: topology memory, flow bias, and scar traces. Geometry: debug `SphereGeometry(0.3, 8, 8)` markers, `SphereGeometry(0.5, 8, 8)` scar markers, and `BufferGeometry` lines for flow bias. Notes: geometry is debug-only unless the topology debug flag is enabled.

## Shader and Material Layers

- `HarmonyAuraController.js`: canonical node aura controller. Geometry: none; it only writes shader uniforms on an existing aura material. Notes: reads `node.userData.harmonyAuraStrength` and keeps the signal read-only.

- `HarmonyAuraShaderMaterial.js`: canonical harmony aura shader. Geometry: none; it is a material overlay for existing node geometry. Notes: soft cyan/teal/mint envelope with gentle breathing.

- `VisualEchoTrails_v1_Integration.js`: echo trails on link pulses. Geometry: none; the shader is applied to existing `THREE.Line` geometry. Notes: no standalone shape is created.

- `HarmonyDebugOverlay.js`: debug tint overlay for harmony state. Geometry: none; it only recolors existing node and link materials. Notes: debug-only and safe to keep disabled.

## Controllers and Orchestrators

- `HarmonicPhaseSynchronization_Session146.js`: elastic phase alignment between proximal hubs. Geometry: none. Notes: it updates `hub.harmonicPhase` for downstream visuals.

- `HarmonicCascadeAmplification_Session145.js`: cascade orchestration across proximity, phase sync, pre-cascade hints, and wave visualization. Geometry: none by itself. Notes: the submodules do the drawing.

- `PreCascadeVisualHint_Session146.js`: subtle tension cues before cascade. Geometry: none. Notes: it biases existing aura, link, and field animation only; no rings, particles, or new geometry.

- `HarmonicHealingVisualSystem_Session134.js`: high-level healing visual driver. Geometry: none. Notes: it mostly wraps the particle system and routes healing state into it.

- `HarmonicAudioReactivitySystem_Session135.js`: harmonic soundscape and rupture audio. Geometry: none. Notes: audio-only, so it is excluded from the visual geometry matrix.

- `HarmonicHubDebugger.js`: console inspection utilities for harmonic hubs. Geometry: none. Notes: debug tooling, not a render system.

## Legacy and Archived Visual Modules

- `src/legacy/T2_HarmonyVisualConsumer_v1.js`: archived harmony aura, oasis zones, and healing pulses. Geometry: `TubeGeometry` borromean rings, `BoxGeometry` pulse shards, and `SphereGeometry` aura/pulse volumes. Notes: archived because it violates the current visual policy.

## Geometry Family Index

- `IcosahedronGeometry`: hub fields, regional zones, influence auras, and several link pulse shells
- `TorusGeometry`: resonance rings, harmony glyphs, pictogram rings, and halo layers
- `SphereGeometry`: cores, sparks, orbs, debug markers, and probes
- `PlaneGeometry`: recovery waves, recovery halos, and cascade rings
- `CylinderGeometry`: link flow segments and trails
- `BufferGeometry`: custom halos, particles, point clouds, and line glyphs
- `OctahedronGeometry`: resonance shards in the link pulse rig
- `TorusKnotGeometry`: swirl accent in the link pulse rig
- `TubeGeometry`: archived borromean rings in the legacy harmony consumer

## Practical Read

The visually heaviest active systems are `LinkResonanceFlowSystem_Session124`, `HarmonicHubAuraSystem_Session126`, `LinkSemanticPictogramSystem_Enhanced`, and `HarmonicRecoveryVisualSystem_Session138`.

If you are checking for accidental origin spawns, only the geometry producer section can create visible world objects. The controller and shader layers cannot spawn standalone meshes by themselves.
