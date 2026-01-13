---
name: atoma-release-manager
description: >
  Skill to verify, validate, and finalize Atoma changes by running builds,
  tests, and checks. Use this skill to confirm that the project is stable
  after modifications.
---

# ATOMA Release Manager Skill

This skill ensures that Atoma remains stable after changes are applied.
It runs builds, tests, and verification commands and reports results.

## When to use this skill

Use this skill when:
- code changes have been applied
- a feature or fix is ready for validation
- preparing a release or checkpoint

## Rules and Permissions

Allowed tools:
- `execute_command`
- Focus Chain
- Workflows such as `verify-*`, `build-*`, `release-*`

Forbidden actions:
- `write_to_file`
- `replace_in_file`

## Release Procedure

1. Identify relevant build, test, or lint commands for the project.
2. Execute them using `execute_command`.
3. Collect and interpret output (errors, warnings, success).
4. Report status clearly.

## Deliverables

Provide a concise report including:
- Commands executed
- Pass/fail status
- Any errors or warnings that must be addressed
- A clear recommendation: “Ready” or “Not ready”
