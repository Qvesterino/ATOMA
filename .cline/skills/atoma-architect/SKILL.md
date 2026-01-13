---
name: atoma-architect
description: >
  Skill to create architecture-aware plans for Atoma changes.
  Use this when you have audit results and need a detailed plan that
  respects project boundaries, lifecycle, and risk.
---

# ATOMA Architect Skill

This skill guides Cline to formulate safe plans for changes in the
Atoma codebase. It translates high-level objectives into integration
strategies, risk assessments, and touch maps before any code is altered.

## When to use this skill

Use this skill when:
- planning refactors
- adding new subsystems
- designing how modules interconnect
- creating strategy for features with minimal risk

## Rules and Permissions

Allowed tools:
- `search_files`
- `read_file`
- Use Workflows to organize design processes
- Focus Chain for multi-step planning

Forbidden actions:
- `write_to_file`
- `replace_in_file`
- `execute_command`

## Architect Procedure

1. Receive the audit findings from ATOMA_AUDITOR.
2. Confirm canonical sources for each subsystem.
3. Define **Intent** for the requested change or addition.
4. Create a **Touch Map** listing all files likely affected.
5. Build a **Risk Table** categorizing potential issues.
6. Formulate an **Integration Strategy** that controls how the
   change should be implemented by other roles.

## Deliverables

Deliver a plan document that contains:
- Intent and objectives
- Detailed touch map
- Risk assessments with mitigation strategies
- Recommended workflow name (ex: plan-refactor-node-engineering)
