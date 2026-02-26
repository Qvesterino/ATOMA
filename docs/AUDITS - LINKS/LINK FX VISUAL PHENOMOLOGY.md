RIBBON CORE
- Visual: Braided multi-strand rope; solid ribbons with emissive tint.
- Motion: Continuous twist/flow implied by strand texture; no pulses.
- Color authority: Source category color; modulated by VFX input (synergy/traffic) for emissive/width.
- Geometry layer: Separate strand meshes per link; own materials.
- Metric binding: Synergy, traffic (via VFX input).
- Visual priority: Core structure.
- Overlap risk: Emissive/opacity also touched by Energy Wave, VisualStateAdapter, Corruption Animator.

SKIN AURA
- Visual: Ghostly outer sheath around strands; faint additive glow.
- Motion: Static; no per-frame change.
- Color authority: Derived from strand base color at creation.
- Geometry layer: Separate mesh (aura shell).
- Metric binding: None at runtime.
- Visual priority: Accent.
- Overlap risk: Minimal; own material.

BEADS
- Visual: Small glowing beads moving along the link path.
- Motion: Constant flow from source→target with arrivals triggering impacts.
- Color authority: Inherited from link colors / bead system defaults.
- Geometry layer: Instanced/pooled meshes.
- Metric binding: Synergy, traffic (spawn rate/intensity).
- Visual priority: Accent / motion indicator.
- Overlap risk: Independent materials.

TRAILS (behind beads)
- Visual: Thin residual streaks following beads.
- Motion: Continuous flow, decaying trails.
- Color authority: From bead/link colors.
- Geometry layer: Trail mesh/buffer separate from strands.
- Metric binding: Indirect via bead activity.
- Visual priority: Accent.
- Overlap risk: Separate materials.

SPARKS
- Visual: Tiny spark points/lines along the curve; flickering glints.
- Motion: Continuous flicker; tied to flow.
- Color authority: Current link color passed in update.
- Geometry layer: Particle/point system.
- Metric binding: Synergy, traffic (intensity).
- Visual priority: Decorative accent.
- Overlap risk: Own materials.

TRAIL PARTICLES
- Visual: Small particles flowing along curve, with density shifts.
- Motion: Constant flow; rate/chaos modulated.
- Color authority: Harmony/corruption blend (cooler with harmony, hotter with corruption).
- Geometry layer: Particle system.
- Metric binding: Harmony, corruption.
- Visual priority: Decorative.
- Overlap risk: Independent materials.

HEALING PARTICLES
- Visual: Particles flowing backward (target→source) with gentle glow.
- Motion: Constant reverse flow; event-reactive to harmony.
- Color authority: Harmony-biased palette.
- Geometry layer: Particle system.
- Metric binding: Harmony, corruption (emission/behavior).
- Visual priority: Event-driven accent.
- Overlap risk: Independent materials.

PULSE RING
- Visual: Bright ring traveling along curve; halo-like band.
- Motion: Continuous traversal pulses; speed varies with traffic/synergy.
- Color authority: Lerp of source→target colors.
- Geometry layer: Separate mesh (ring).
- Metric binding: Synergy, traffic.
- Visual priority: Accent / state signal.
- Overlap risk: Own material; feeds arc discharges.

ENERGY WAVE
- Visual: Soft emissive modulation on strands (wave through rope).
- Motion: Continuous oscillation; tied to flow speed.
- Color authority: Uses strand material color; boosts emissive.
- Geometry layer: Writes to existing strand materials.
- Metric binding: Synergy, traffic (speed/intensity).
- Visual priority: Accent overlay on core.
- Overlap risk: Emissive writes overlap strand base and corruption/adapter.

ARC DISCHARGES
- Visual: Short jagged electric arcs near ring position.
- Motion: Burst on pulse-ring bucket crossings; quick fade.
- Color authority: From ring color.
- Geometry layer: Separate line geometries per arc.
- Metric binding: Synergy (radius/intensity), traffic (spawn context).
- Visual priority: Event-driven flare.
- Overlap risk: Own materials; no strand writes.

CORRUPTION ANIMATOR
- Visual: Color tint and emissive shifts along strands indicating corruption spread.
- Motion: Smooth color morph; may include subtle jitter via linked systems.
- Color authority: Corruption-driven tint overlay on strand materials.
- Geometry layer: Writes to strand materials directly.
- Metric binding: Corruption (primary), harmony (secondary).
- Visual priority: State indicator.
- Overlap risk: High—shares materials with strands/energy wave/adapter.

CORRUPTION PARTICLES
- Visual: Corruption-flavored particles along links.
- Motion: Continuous flow; density with corruption.
- Color authority: Corruption palette.
- Geometry layer: Particle system.
- Metric binding: Corruption.
- Visual priority: Decorative state cue.
- Overlap risk: Own materials.

VISUALSTATEADAPTER
- Visual: Layered adjustments (opacity/emissive/order) across link meshes for metric balance.
- Motion: Depends on metrics; generally subtle continuous adjustments.
- Color authority: Uses current link colors; may tweak opacity/emissive.
- Geometry layer: Writes to existing link meshes (strands, skin, etc.).
- Metric binding: Harmony, corruption, instability, synergy.
- Visual priority: Structural balancing.
- Overlap risk: High—touches multiple materials already used by other FX.

DIRECTIONAL STREAKS
- Visual: Thin luminous ribbons traveling along curve; additive glow.
- Motion: Continuous forward streaks with fade-in/out; pulse-aware.
- Color authority: Starts at baseColor→targetColor, then dynamic via colorDynamics (harmony, specialization, corruption, synergy).
- Geometry layer: Separate streak mesh with its own material.
- Metric binding: Synergy (speed/count), harmony (length/brightness), corruption (desaturation/jitter), instability (lifetime/suppression).
- Visual priority: Strong accent / flow indicator.
- Overlap risk: Own material; no strand writes.

IMPACTS
- Visual: Brief expanding shapes at nodes when beads/particles arrive (rings, torus, etc.).
- Motion: Short-lived expansion + fade.
- Color authority: Derived from node/link category colors.
- Geometry layer: Separate transient meshes.
- Metric binding: None direct; inherits event context.
- Visual priority: Event-driven spark.
- Overlap risk: Own materials; transient.