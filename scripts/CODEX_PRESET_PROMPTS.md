
## !! SCHVALOVACIA FRAZA PRE CODEX NA APLIKACIU ZMIEN AJ NAPRIEK TOMU ŽE JE V CHAT MODE !!
_______________________________________________________________________
Approved.
Apply ALL listed changes in one step.
No further confirmation required.
Do not introduce additional changes.

_____________________________________________________________
## 🟢 SAFE MICRO CHANGE (Agent OFF)
_______________________________________________________________
ATOMA task:
**[one-sentence objective]**

Constraints:
- NO gameplay logic changes
- NO visual changes
- If ambiguous, STOP and ask

Verification:
Run npm run verify:fast
______________________________________________________________
## 🟡 SAFE REFACTOR (Agent ON, Medium effort)
________________________________________________________________
ATOMA task:
SAFE refactor.

Constraints:
- NO gameplay logic changes
- NO visual changes
- Prefer re-exports or shims
- If ambiguous, STOP and ask

Use Controlled Self-Anneal Loop from AGENTS.md:
- Max 2 cycles
- Max 6 files per cycle

Verification:
Run npm run verify:medium
____________________________________________________________________
## 🔴 RISKY / ENTRYPOINT CHANGE (Agent ON, Full)
______________________________________________________________________
ATOMA task:
**[explicitly described risky change]**

Constraints:
- Explicitly list allowed changes
- Everything else is forbidden
- STOP if uncertainty exists

Verification:
Run npm run verify:full
_________________________________________________________________________
## ✅ Controlled self-anneal
_____________________________________________________________________________
ATOMA task:
**[one sentence objective]**

Constraints:
- NO gameplay logic changes
- NO visual changes
- If ambiguous, STOP and ask

Use the Controlled Self-Anneal Loop from AGENTS.md:
- Max 2 cycles
- Max 6 files per cycle
- Single approval per cycle

____________________________________________________________________________

## ATOMA Codex Rules
`1️⃣ Projektové RULES (TOP TIER)`

- NO gameplay logic changes
- NO visual changes unless explicitly requested
- Prefer re-exports over new files
- If ambiguous, STOP and ask
- Always verify build passes
_______________________________________________________________________

## Ako Nemotron promptovať (veľmi dôležité)
______________________________________________________

FULL AGENT MODE.
Task type: FIX

Goal:
Fix incorrect import of SynergyEngine causing runtime error.

Constraints:
- Minimal diff
- No visual changes
- No refactor

Deliverable:
Unified diffs + verification checklist.
_________________________________________________________
## 🧩 ŠTRUKTÚRA SPRÁVY (ODPORÚČANÁ)
**1️⃣ Kontext**
`ATOMA task:`

**2️⃣ Typ úlohy**
`SAFE refactor / Analysis / Design / Debug`

**3️⃣ Pravidlá**
`NO gameplay logic changes`
`NO visual changes`
`If ambiguous, STOP and ask`

**4️⃣ Konkrétny cieľ**
`Fix missing SynergyEngine imports by introducing a canonical re-export entrypoint.`

________________________________________________________________
## Minimálny REVIEW RULESET (ukážka)
You are operating in REVIEW MODE.

Rules:
- Do NOT propose code changes.
- Do NOT suggest refactors.
- Do NOT invent improvements.
- Evaluate only the provided diffs.
- Check compliance with project rules.
- Identify risks, regressions, or rule violations.
- Output: Verdict + bullet list of concerns (if any).
____________________________________________________________
## ABSOLUTNE ZÁKAZY (HARD STOPS)
FORBIDDEN ACTIONS:
- Do NOT write code.
- Do NOT suggest code changes.
- Do NOT propose refactors.
- Do NOT suggest alternative implementations.
- Do NOT optimize anything.
- Do NOT recommend new abstractions.
- Do NOT invent missing context.
- Do NOT assume developer intent.
## ATOMA-SPECIFIC INVARIANTS (KRITICKÉ)
ATOMA INVARIANTS (NON-NEGOTIABLE):
- Exactly one canonical engine per metric system
  (synergy / harmony / corruption / stress).
- Visual systems MUST NOT compute metrics.
- Metrics MAY drive visuals, never the opposite.
- Render loop must remain allocation-free.
- Dormant patches remain inert unless explicitly wired.
**povolene formulacie**
- "This change introduces a risk because..."
- "This violates rule X because..."
- "This may cause a regression in..."


[Executor Agent]
      ↓
[Reviewer Agent]  ❌ finds issue
      ↓
[Decision / Routing Layer]
      ↓
[Executor Agent]  ✅ fixes based on review
      ↓
[Reviewer Agent]  🔁 re-check

__________________________________________________
## SPRAVNY VYSTUP REVIEWERA
VERDICT: SAFE | RISKY | REJECT

ISSUE SUMMARY:
- One-sentence description of the core problem

ROOT CAUSE:
- Short explanation of why the issue exists

RISK TYPE:
- Performance / Architectural / Integration / Regression / Invariant

AFFECTED FILES:
- file/path.js (functionName)

SAFETY CONSTRAINTS FOR FIX:
- Constraint 1
- Constraint 2
- Constraint 3

RECOMMENDED FIX STRATEGY (NON-CODE):
- High-level description of what needs to change
- Explicitly state what must NOT be changed

FIX PROMPT FOR EXECUTOR:
"""
FULL AGENT MODE.
Task type: FIX
Goal: [Precise correction goal]
Constraints:
- Minimal diff
- No refactor
- Preserve existing behavior outside the fix
- Respect ATOMA invariants: [list]

Deliverable:
Unified diffs + verification checklist.
"""

CONFIDENCE:
- High | Medium | Low

________________________________________________________