---
name: atoma-engineer
description: >
  Skill to safely apply code changes to the Atoma project using minimal,
  verifiable patches. Use this skill when implementing fixes, wiring systems,
  or applying planned modifications approved by architecture and review steps.
---

# ATOMA Engineer Skill

This skill performs actual modifications to the Atoma codebase. It is the only
skill allowed to write or change files. All actions must be based on an approved
audit and architecture plan.

## When to use this skill

Use this skill when:
- applying bug fixes
- wiring or integrating systems
- implementing approved plans
- making safe, minimal patches

## Rules and Permissions

Allowed tools:
- `read_file`
- `search_files`
- `replace_in_file`
- `write_to_file`
- Focus Chain
- Workflows such as `apply-*`, `patch-*`, `fix-*`

Forbidden actions unless explicitly approved:
- `execute_command` (builds and tests belong to the Release Manager)

## Engineer Procedure

1. Confirm that an ATOMA_AUDITOR report and ATOMA_ARCHITECT plan exist.
2. Review the canonical files and touch map.
3. Implement only the changes described in the plan.
4. Prefer minimal diffs, re-exports, guards, and NO-OP wiring.
5. Avoid refactors, file moves, or API changes unless explicitly instructed.

## Change Discipline

- Never invent new APIs, exports, or files without confirmation.
- Do not modify hot paths or render loops without explicit approval.
- Preserve existing formatting, naming, and structure.
- If ambiguity is encountered, stop and request clarification.

## Deliverables

After applying changes, provide:
- A list of files touched
- Unified diffs for all modifications
- A short statement of behavior impact (e.g., “No gameplay change”, “Visual change: glow intensity”)
