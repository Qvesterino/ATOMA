---
name: atoma-auditor
description: >
  Skill to analyze and map the Atoma codebase before any modifications.
  Use this when you need authoritative information about file locations,
  call sites, imports, and canonical sources in the Atoma project.
---

# ATOMA Auditor Skill

This skill helps Cline perform safe exploration and mapping of the Atoma
codebase. It provides structured audit operations so that subsequent
changes can be made with confidence and accuracy.

## When to use this skill

Use this skill when:
- preparing for large or complex changes
- verifying where a subsystem is implemented
- finding references to a component
- creating maps of the codebase structure

## Rules and Permissions

This skill **must not** perform any write operations.
Allowed tools:
- `list_files` to enumerate directories
- `search_files` to locate patterns
- `read_file` to inspect contents
- Engage Focus Chain for structured findings
- Use Workflows for systematic scans

Forbidden actions:
- `write_to_file`
- `replace_in_file`
- `execute_command`

## Auditor Procedure

1. Start by listing all relevant directories and files.
2. Use search operations (`search_files`) to locate key modules and call sites.
3. For each match, read the file to extract import paths and definitions.
4. Create structured maps showing usage relationships.
5. Store findings in Focus Chain progress to feed into planning roles.

## Expectations

Output clear maps of:
- canonical file locations for core subsystems
- where a function or component is used
- hierarchical structure of Engine modules
