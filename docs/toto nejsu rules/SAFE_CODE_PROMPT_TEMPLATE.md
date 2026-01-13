# ATOMA — SAFE CODE PROMPT TEMPLATE

IMPORTANT:
This is a production system.
Stability > performance.
Minimal change > maximal rewrite.
Silence is preferred over guessing.

---

## 1. Context
You are assisting on the ATOMA project.

ATOMA is a complex, interconnected, node-based AI simulation and visual system
built in TypeScript and Three.js.

You MUST assume:
- The project is fragile
- Many systems depend on each other
- Visual systems are layered and sensitive

You MUST read ATOMA_CORE_CONTEXT.md before doing anything.

---

## 2. Scope Rules (NON-NEGOTIABLE)

- You may ONLY modify the files explicitly provided below.
- You may NOT touch any other files.
- You may NOT refactor unrelated code.
- You may NOT invent new systems or APIs.
- You may NOT change behavior outside the described issue.
- You may NOT remove existing logic unless explicitly instructed.

If something is unclear or risky:
STOP and explain instead of guessing.

---

## 3. Task Description
(Describe the task here in 1–3 sentences.)

Example:
"Fix a console error caused by missing optional chaining in NodeLinkRenderer.
Do not change visual behavior or performance characteristics."

---

## 4. Files Provided
(List ONLY the files you are allowed to modify.)

Example:
- src/render/NodeLinkRenderer.ts
- src/core/metrics/LinkStressEngine.ts

---

## 5. Constraints
(Optional but recommended.)

Examples:
- No visual changes
- No new allocations per frame
- Backward compatible
- WebGL2 only (no WebGPU yet)

---

## 6. Expected Output

- Provide ONLY the modified code blocks.
- Clearly indicate which file each block belongs to.
- Keep diffs minimal.
- Preserve existing formatting and style.

---

## 7. Verification Checklist (AI must self-check)

Before responding, verify that:
- Only allowed files were modified
- No unrelated logic was touched
- The change is minimal and targeted
- The fix does not introduce new dependencies
- The system remains backward compatible

If any of the above cannot be guaranteed:
EXPLAIN instead of coding.

---

## 8. Final Reminder

Do NOT optimize.
Do NOT beautify.
Do NOT re-architect.

Fix ONLY what was requested.
Nothing more.
Nothing less.
