# ATOMA — Agent Instructions (Codex-Friendly)

This repository is a long-lived experimental game/engine. Stability > speed.
AI agents must behave as cautious senior engineers.

---

## 0) PRIME DIRECTIVES (NON-NEGOTIABLE)

- DO NOT change gameplay logic unless explicitly instructed.
- DO NOT change visuals, shaders, materials, postprocessing, colors, or effects unless explicitly instructed.
- DO NOT change numerical balance values unless explicitly instructed.
- DO NOT perform style refactors or optimizations unless explicitly instructed.
- DO NOT delete files unless explicitly instructed.
- If ANY ambiguity exists: STOP and ask before proceeding.

**Default preference:** minimal diffs, reversible changes, backward compatibility.

---

## 1) 3-LAYER WORKFLOW (ATOMA VERSION)

### Layer 1 — DIRECTIVE (What to do)
This is the user request + constraints.

Agent must restate the directive in 1–3 bullet points:
- Objective
- Constraints
- Success criteria

If constraints are missing, ask *before* editing.

### Layer 2 — ORCHESTRATION (Decision-making)
Agent decides the safest plan.

Rules:
- Prefer the smallest change that satisfies the directive.
- Prefer re-exports/shims over moving code.
- Prefer type-only changes over runtime changes.
- Touch the fewest files possible.
- Never broaden scope.

Agent produces a short plan:
1) Locate relevant files
2) Proposed edits (by file)
3) Verification steps

If plan requires assumptions: STOP and ask.

### Layer 3 — EXECUTION (Doing the work)
Agent executes the plan deterministically.

Rules:
- Follow the plan exactly.
- No additional “nice to have” changes.
- No opportunistic refactors.
- Keep diffs minimal and reversible.

Output must include:
- Modified files list
- Why each change is safe
- Confirmation: NO logic / NO visual / NO perf change (unless explicitly requested)

---

## 2) CONTROLLED SELF-ANNEAL LOOP (NO CONTEXT EXPLOSION)

Goal: fix issues iteratively without runaway loops.

### Trigger
Use this loop ONLY when:
- There is an explicit error (build error, runtime error, failing test)
- Or a clear regression tied to the directive

### Budget (Hard Limits)
- Max cycles per task: **2**
- Max file edits per cycle: **6**
- Max new files per task: **1** (and ONLY if it is re-export/shim or type-only)
- Max search breadth: **only relevant folders**, no repo-wide redesign

If limits are exceeded: STOP and ask.

### Cycle Structure (Strict)
**Cycle A**
1) Read the error precisely (message + stack + file/line)
2) Identify minimal fix
3) Apply fix
4) Verify with the lightest check available (typecheck/build/test/run)
5) Report outcome and stop

**Cycle B (only if still failing)**
1) Re-check error (did it change?)
2) Apply second minimal fix
3) Verify
4) Report outcome and stop

If still failing after Cycle B: STOP and ask for next instruction.

### No Autonomous Retries
- Do not do retry loops beyond 2 cycles.
- Do not “keep trying” across unrelated hypotheses.
- Do not expand scope into refactors to “make it work”.

---

## 3) APPROVAL + INTERACTION POLICY (REDUCE CHAT PING-PONG)

When approvals are needed:
- Bundle changes into one coherent step.
- Prefer “single approval per cycle”.

Recommended user phrasing:
"Approved. Apply ALL listed changes in one step. No further confirmation required."

---

## 4) VERIFICATION POLICY (ATOMA SAFE)

Choose the lightest correct verification:
- TypeScript: `typecheck` / `tsc --noEmit` if available
- Build: `vite build` / project build command if available
- Runtime sanity: run dev server and verify no console errors for the touched area

If verification tooling is not available:
- State what you could not verify and STOP.

---

## 5) FILE CREATION RULES (SHIMS / ENTRYPOINTS)

If a new file is required:
- Must have **NO side effects**
- Must contain **ONLY re-exports, aliases, or types**
- Must not change runtime behavior

Example allowed file:
- `engine/synergy/SynergyEngine.ts` that re-exports from existing modules.

---

## 6) OUTPUT FORMAT (MANDATORY)

- Summary (1–3 bullets)
- Modified files list
- Diffs rationale: why safe
- Verification performed + results
- Explicit confirmations:
  - NO gameplay logic changes
  - NO visual changes
  - NO performance changes

