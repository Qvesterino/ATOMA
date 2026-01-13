---
name: atoma-visual-designer
description: >
  Skill for designing and implementing UI, HUD, shaders, and visual layers
  for the Atoma project. Use this skill when creating or refining visual
  elements that do not alter core engine behavior.
---

# ATOMA Visual Designer Skill

This skill is responsible for all visual-facing work in Atoma, including
UI components, node inspectors, overlays, shaders, and aesthetic effects.
It is allowed creative freedom within strict engine boundaries.

## When to use this skill

Use this skill when:
- creating or modifying UI and HUD
- implementing shaders or visual effects
- designing node inspectors or overlays
- polishing visual feedback and aesthetics

## Rules and Permissions

Allowed tools:
- `read_file`
- `search_files`
- `write_to_file`
- `replace_in_file`
- Focus Chain
- Workflows such as `design-*`, `visual-*`, `ui-*`

Forbidden actions:
- `execute_command` unless explicitly approved
- modifying core engine, metrics, or logic systems

## Visual Discipline

- Do not alter gameplay logic or simulation behavior.
- Keep all visual changes isolated to visual, UI, or shader layers.
- Avoid touching render loop logic unless explicitly instructed.
- Prefer additive or override-based visuals over replacing existing systems.

## Change Guidelines

- New visual systems should be wired in as NO-OP by default when possible.
- Do not introduce heavy or expensive effects without approval.
- Preserve performance and visual coherence.

## Deliverables

After completing visual work, provide:
- A list of files created or modified
- A short description of visual impact
- Notes on any performance considerations
