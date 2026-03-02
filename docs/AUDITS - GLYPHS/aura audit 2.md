**Aura Systems Map (read‑only)**  
Scopes narrowed to active/impactful systems surfaced by search; minor docs/templates omitted.

1) System facts  
- `NodeAuraSystem_v1.js` — Baseline node aura. Creates ShaderMaterial mesh per node. depthTest true, depthWrite false, NormalBlending, renderOrder from VisualHierarchyRegistry (defaults −1). Writes per‑frame: shader uniforms, `mesh.scale` (radius), no direct material.opacity writes (opacity via shader intensity).  
- `_UISelectedNodeHighlight3_2.js` — Selected highlight (Fresnel shell + emissive lift). depthTest true, depthWrite false, NormalBlending (shader), renderOrder 0.5. Writes per‑frame: shader uniforms (uAuraPulse), node.material.emissiveIntensity; no opacity/scale changes on the shell.  
- `_UIPrimaryNodeAura3_7.js` — Primary-node UI aura (two torus meshes). depthTest false, depthWrite false, NormalBlending (MeshBasicMaterial), renderOrder −1. Writes per‑frame: ring/pulse opacity and positions; no emissive on node.  
- `NodeLinkedAuraSystem.js` — Linked/flame aura. MeshStandardMaterial, depthTest true, depthWrite false, NormalBlending, renderOrder default (not set). Writes per‑frame: material.opacity, mesh.scale, vertex positions.  
- `AuraModulationSystem.js` — Cross‑cut modulation. No meshes; per‑frame writes to target aura/material: opacity, scale, color/emissive with decay.  
- `GlobalAuraOpacityClamp.js` (+ integration) — Clamp utility; sets material.opacity ≤0.10 on detected auras (node/link) and can re‑enforce globally.  
- `AuraLODCulling.js` — Visibility gate; toggles `mesh.visible` based on distance/frustum; no opacity/scale.  
- `NodeCorruptionAuraDegradation.js` — Adjusts aura material color/desaturation and opacity based on corruption inside NodeAuraSystem.  
- `CorruptionDrivenAuraDesaturationSystem.js` — Color/saturation modulation for corruption (opacity indirectly via saturation).  
- `LinkAuraSystem_v1.js` / `shaders/LinkAuraShader.js` — Link aura cylinders; depthTest configurable (defaults from profile), blending Normal; caps opacity at 0.16 inside shader; per‑frame updates scale/opacity uniforms.  
- `SynergyGlow*` (Controller/ShaderMaterial) — Link glow; AdditiveBlending, depthTest default true; per‑frame intensity updates (controller), writes opacity/color; separate link meshes.  
- `FresnelAuraIntegrationPatch.js` — Optional fresnel replacement for AINodes.createAura; creates ShaderMaterial, renderOrder −1; writes uniforms when host calls update.  
- `FireLike/Harmony/Mythic/HarmonicHub/ArchetypeAura*` etc. — Specialty aura variants; generally inherit baseline pattern: ShaderMaterial or MeshBasic/Standard, transparent, usually Normal or Additive blending; may write opacity/scale via their own updates (not active by default).  
- `_UISelectedNodeHighlight3_2.js` is now the only selected visual; previous torus/wireframe removed.  
- `EmergencyAuraKillSwitch_v1.js` — Utility to force‑disable auras (sets visible/opacity).

2) Summary table

| System | Writes Opacity | Writes Scale | Writes Emissive/Color | depthTest | Blending | Frame Layer | Conflict Risk |
| - | - | - | - | - | - | - | - |
| NodeAuraSystem_v1 | Shader intensity (uniform) | mesh.scale | color via corruption degrader | true | Normal | per-frame update() | Low (owns its meshes; modulation/clamp can still touch) |
| NodeLinkedAuraSystem | material.opacity | mesh.scale, vertices | color static | true | Normal | per-frame update() | Medium (opacity/scale shares with clamp/modulation) |
| _UISelectedNodeHighlight3_2 | No (shader alpha fixed) | No | node.emissiveIntensity + shader color | true | Normal | per-frame update() | Low (touches node emissive; could clash with other node emissive edits) |
| _UIPrimaryNodeAura3_7 | material.opacity | No (positions) | emissive on aura mesh only | false | Normal | per-frame update() | Medium (depthTest off + UI layer may overlay baseline) |
| AuraModulationSystem | Yes (material.opacity) | Yes (mesh.scale) | Yes (emissive/color) | inherits target | inherits target | per-frame update() | High (generic writer to any aura passed in) |
| GlobalAuraOpacityClamp | Yes (caps opacity) | No | No | inherits target | inherits target | on events + periodic | High (overrides other opacity writes) |
| AuraLODCulling | No (visibility toggle) | No | No | inherits target | inherits target | throttled per-frame | Low |
| NodeCorruptionAuraDegradation | Yes (opacity tweak) | No | Yes (desaturation) | inherits target | inherits target | per-frame | Medium (with modulation/clamp) |
| CorruptionDrivenAuraDesaturationSystem | Indirect (via saturation) | No | Yes | inherits target | inherits target | per-frame | Medium |
| LinkAuraSystem_v1 | opacity (uniform cap) | mesh.scale (length/radius) | color (shader) | configurable (profile) | Normal | per-frame | Medium (with clamp/modulation if applied) |
| SynergyGlow (Controller/Shader) | opacity/intensity | No | color/emissive | true | Additive | per-frame controller | Medium (Additive stack + clamp if classified as aura) |
| FresnelAuraIntegrationPatch | opacity (uAuraOpacity uniform) | mesh.scale (radius) | color via uniform | true | Normal | per-frame if host calls | Medium (replaces baseline createAura) |
| Fire/Harmony/Mythic/HarmonicHub/Archetype aura variants | Usually opacity/intensity | sometimes scale | color | usually true | Normal/Additive varies | per-frame (if enabled) | Medium (parallel to baseline if simultaneously enabled) |
| EmergencyAuraKillSwitch | Yes (disables/zeroes) | No | No | n/a | n/a | command-driven | High (hard override) |

3) Conflict graph (writers → targets)
- Baseline node aura meshes: writers = NodeAuraSystem_v1 (owner), AuraModulationSystem, GlobalAuraOpacityClamp, NodeCorruptionAuraDegradation, EmergencyAuraKillSwitch. Potential opacity multi-writes (Modulation vs Clamp), color (CorruptionDegradation vs Modulation). Scale multi-write (AuraModulationSystem vs NodeAuraSystem radius set).
- Selected highlight shell: sole writer _UISelectedNodeHighlight3_2 (shader pulse); node emissive also touched by this system — may conflict with any other node-level emissive edits (rare).
- Primary UI torus auras: self-writes opacity; could be clamped (Clamp heuristics may detect “aura” by name/scale), and depthTest false may overdraw baseline/selected.
- Linked aura meshes: writers = NodeLinkedAuraSystem (owner), AuraModulationSystem (if passed), GlobalClamp (if detected), EmergencyKillSwitch. Opacity conflicts likely between NodeLinkedAuraSystem and Clamp/Modulation.
- Link glow (SynergyGlow) and LinkAuraSystem_v1 operate on distinct link meshes; clashes only if Clamp heuristics classify them.
- FresnelAuraIntegrationPatch replaces baseline factory: conflict with NodeAuraSystem_v1 if both active; keep only one baseline.
- AuraLODCulling only toggles visibility; no value conflicts but can mask other systems.
- GlobalClamp + Modulation are cross-cutting and create the main multi-writer risk on opacity.

4) Authority designation
- Baseline authority: **NodeAuraSystem_v1** (node-wide shell; VisualHierarchyRegistry renderOrder −1).
- Selected authority: **_UISelectedNodeHighlight3_2** (Fresnel shell + emissive lift; renderOrder 0.5).
- Linked authority: **NodeLinkedAuraSystem** (flame/linked shell; own meshes).
- Primary aura: `_UIPrimaryNodeAura3_7` (UI layer, depthTest off) → Secondary/UI layer.
- Modifiers (non-authoritative, cross-cutting): AuraModulationSystem, GlobalAuraOpacityClamp (+ Integration), NodeCorruptionAuraDegradation, CorruptionDrivenAuraDesaturationSystem, AuraLODCulling, EmergencyAuraKillSwitch.
- Alternatives / candidates for removal or single-enable: FresnelAuraIntegrationPatch, legacy LinkAuraSystem_v1 & SynergyGlow stacks if newer link visuals supersede them; older aura variant packs (Harmony/Mythic/HarmonicHub/etc.) if not in active pipeline.

5) Proposed hierarchy model
- Level 0 (Baseline): NodeAuraSystem_v1 — single owner for node shells; disable other baseline replacements (FresnelAuraIntegrationPatch or variant packs) unless explicitly chosen.
- Level 1 (Primary): _UIPrimaryNodeAura3_7 — UI-only, depthTest off; should not override baseline opacity; treat as auxiliary.
- Level 2 (Selected): _UISelectedNodeHighlight3_2 — single selected authority; keep unique emissive lift.
- Level 3 (Linked): NodeLinkedAuraSystem — only for linked state; avoid additional link aura systems unless exclusive.
- Modulation layer (orthogonal): AuraModulationSystem and Corruption* apply only if granted write access; clamp should be gated or made mutually exclusive with modulation on the same meshes.
- Clamp layer (safety): GlobalAuraOpacityClamp as last-resort cap; ensure it ignores selected/primary shells if not desired.

6) Redundancy/competition highlights
- Baseline duplication risk: NodeAuraSystem_v1 vs FresnelAuraIntegrationPatch vs variant aura packs — keep one active.
- Opacity multi-writer: NodeAuraSystem_v1 + AuraModulationSystem + GlobalClamp (+ CorruptionDegradation) on the same meshes.
- Linked opacity/scale multi-writer: NodeLinkedAuraSystem + Modulation + Clamp.
- UI primary depthTest=false can visually override baseline/selected; consider gating to UI-only context.
- SynergyGlow and LinkAuraSystem_v1 are parallel link glow stacks; choose one to avoid overdraw/additive stacking.