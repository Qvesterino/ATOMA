# ATOMA Project — AI Coding Agent Instructions

## Project Overview
ATOMA is a long-lived, experimental game/engine. Stability, determinism, and coherence are prioritized over speed or feature growth. The codebase contains many dormant or partially integrated systems; presence of files does not guarantee active use.

## Prime Directives
- **Do NOT change gameplay logic, visuals, shaders, materials, postprocessing, colors, effects, or numerical balance values unless explicitly instructed.**
- **Do NOT perform style refactors, optimizations, or delete files unless explicitly instructed.**
- **If ANY ambiguity exists: STOP and ask before proceeding.**
- Default: minimal diffs, reversible changes, backward compatibility.

## Workflow: 3-Layer Model
1. **Directive**: Restate the user request in 1–3 bullets (objective, constraints, success criteria). If constraints are missing, ask before editing.
2. **Orchestration**: Safest plan—smallest change, prefer re-exports/shims, type-only over runtime, touch fewest files, never broaden scope. Plan: locate files, propose edits, verification steps. If assumptions are needed, STOP and ask.
3. **Execution**: Follow the plan exactly. No "nice to have" changes, no opportunistic refactors. Output modified files list and diffs.

## Release & Review Workflows
- **Release**: Start a static server in project root (`npx serve`, fallback: `python -m http.server` or `node ./dev-server.js`). Request main HTML via HTTP. Verify HTML and main JS entry load. Output server used, status, errors.
- **Review**: Validate patch for safety/correctness. Evaluate rule compliance, risk, impact. Output verdict (APPROVE, APPROVE_WITH_RISK, REJECT) and justification.
- **Plan**: Define intent, touch map, risk table, integration strategy. Store and output full architecture plan.
- **Patch**: Apply approved plan using minimal diffs. Store files touched, diffs, guarantees. Output summary.

## Key Patterns & Conventions
- **Minimal, reversible changes** are preferred. Bundle changes into one coherent step per approval cycle.
- **Never broaden scope** or retry beyond two cycles. If failing, STOP and ask for next instruction.
- **Re-exports/shims** are preferred over moving code. Type-only changes over runtime changes.
- **Touch the fewest files possible.**

## Example Files
- Many files are prefixed with `_` and represent modular systems (e.g., `_AtomaGlyphSystem3_0.js`).
- Key orchestration and integration points may exist in `engine/synergy/SynergyEngine.ts` (if present) or similar central modules.
- Workflow rules are documented in `.clinerules/workflows/`.

## If Uncertain
- State what you could not verify and STOP. Ask for clarification before proceeding.

---
**For any change, always prioritize stability, minimalism, and explicit user direction.**
