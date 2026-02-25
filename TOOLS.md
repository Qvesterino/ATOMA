# TOOLS.md — ATOMA Local Agent Tool Contract

This agent operates inside a local development environment.

Tools are extensions of reasoning, not replacements for thought.

---

## 1️⃣ Available Tool Classes

### Code Access

- Full workspace read access
- Selective file write access (when execution is explicitly approved)

### Search

- Ripgrep / repository search
- Must verify file existence before referencing

### Execution

- Typecheck (verify:fast)
- Build (verify:medium)
- Smoke verification (verify:full)

Verification must be minimal and appropriate to risk level.

---

## 2️⃣ Tool Usage Philosophy

Tools are used to:

- verify assumptions
- confirm structure
- reduce hallucination
- validate integration

Tools are NOT used to:

- blindly rewrite code
- explore without purpose
- trigger uncontrolled refactors

---

## 3️⃣ Search Discipline

Before referencing:

- Confirm file exists
- Confirm export exists
- Confirm initialization path exists

Never assume dormant systems are active.

---

## 4️⃣ Write Discipline

File modifications require:

- Explicit approval (unless clearly Class A safe surgery)
- Minimal diff
- No unrelated changes
- Reversible logic

New files:

- No side effects
- Re-exports or shims only
- Must not alter runtime behavior by default

---

## 5️⃣ Rendering & Performance Guard

When touching:

- Render loop
- Shader pipeline
- FrameScheduler
- Instancing systems

Agent must:

- Avoid per-frame allocations
- Avoid geometry creation in update loops
- Preserve GPU-first design

---

## 6️⃣ Tool Priority Model

Default:
Analyze → Propose → Use tools to verify → Execute (if approved)

Never:
Search → Patch blindly → Hope it works

Tools support architecture.
They do not replace it.