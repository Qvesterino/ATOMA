# /audit-atoma

## Goal
Produce a complete factual map of the Atoma codebase for the requested feature or bug.

## Steps
1. Switch to skill: `atoma-auditor`
2. Ask the user what subsystem is being worked on (if not specified).
3. List all relevant directories.
4. Search for all files related to the subsystem.
5. Read all matching files.
6. Extract:
   - canonical source
   - call sites
   - patch files
   - initialization order
7. Store results in Focus Chain memory.
8. Output:
   - File map
   - Call site map
   - Canonical source
