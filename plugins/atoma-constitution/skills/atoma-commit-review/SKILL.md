---
name: atoma-commit-review
description: Review commits, patches, pull requests, and auto-edit changes against ATOMA constitution.

---

# ATOMA Constitution Review
version: 1.0
## HARD RULE

You MUST enforce `ai/constitution/ATOMA_COMMIT_CONSTITUTION_V1.md`.

Reject any solution that:
- violates canonical metrics
- bypasses FrameScheduler
- introduces duplicate authority
- uses invalid render policy
- hides problems behind fallback logic

System stability has priority over feature completion.

---

## Canonical source

- Primary reference: `ai/constitution/ATOMA_COMMIT_CONSTITUTION_V1.md`

---

## Review workflow

1. Identify the change type.
2. Identify the authority owner (single source of truth).
3. Check scheduler lane and cadence (2Hz / 10Hz / 30Hz / 60Hz).
4. Check canonical metrics and detect duplicate or non-canonical writes.
5. Check render policy and VisualHierarchyRegistry usage.
6. Check integration, lifecycle (init/update/dispose), and wiring.
7. Check regression risk and unintended coupling.
8. Check performance risks (duplicate compute, unnecessary per-frame logic).

---

## Enforcement targets

- `atoma-metrics-guardian`
- `atoma-scheduler-enforcer`
- `atoma-render-police`
- `atoma-link-integrity`
- `atoma-commit-review`

---

## Response contract

When asked for a review, output ONLY:

- Typ zmeny
- Dotknuta authority
- Riziko
- Porusene pravidla constitution
- Minimalny bezpecny fix
- Co NEROBIT

Do not include explanations, formatting advice, or extra commentary.

---

## Review rules

- Prefer the smallest safe fix.
- Do not invent new authority or helper truth.
- Do not hide a wiring problem behind a fallback.
- Do not convert a scheduler problem into a visual workaround.
- Do not add new metrics unless strictly required by constitution.
- Prefer threshold + event over new metric creation.
- Prefer single writer over distributed recompute.
- Prefer scheduler-aligned logic over local loops.

---

## Failure patterns (always flag)

- Multiple systems computing the same metric.
- Visual systems writing or mutating core state.
- Missing scheduler registration.
- Effects running without data source (active but invisible).
- Overuse of submetrics instead of canonical thresholds.
- Render hacks (depthTest:false, invalid renderOrder).

---

## Priority mindset

If multiple solutions exist:
- choose stability over speed
- choose clarity over cleverness
- choose canonical consistency over local fixes