---
name: atoma-reviewer
description: >
  Skill to review and validate Atoma changes for safety, stability, and
  architectural correctness. Use this skill to approve or reject proposed
  patches before they are finalized.
---

# ATOMA Reviewer Skill

This skill evaluates proposed changes made by ATOMA_ENGINEER or plans created
by ATOMA_ARCHITECT. It ensures that all modifications comply with Atoma rules,
maintain stability, and minimize risk.

## When to use this skill

Use this skill when:
- reviewing a patch or diff
- validating a refactor plan
- checking for architectural or performance risks
- approving or rejecting changes

## Rules and Permissions

Allowed tools:
- `read_file`
- `search_files`
- Focus Chain
- Workflows such as `review-*`

Forbidden actions:
- `write_to_file`
- `replace_in_file`
- `execute_command`

## Reviewer Procedure

1. Examine the audit and architecture plan.
2. Inspect the unified diffs or proposed changes.
3. Check compliance with ATOMA core rules and architecture boundaries.
4. Evaluate risks to performance, visuals, and determinism.
5. Issue a verdict.

## Verdict Types

The Reviewer must produce exactly one of the following:

- **APPROVE**  
  The change is safe, minimal, and aligned with Atoma architecture.

- **APPROVE_WITH_RISK**  
  The change is acceptable but carries specific, documented risks.

- **REJECT**  
  The change violates rules, introduces unacceptable risk, or lacks sufficient clarity.

Each verdict must include a short technical justification.
