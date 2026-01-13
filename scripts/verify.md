# ATOMA Verification Guide

Verification scripts exist to provide deterministic feedback.
They are NOT tests of gameplay correctness.

## Modes

### verify:fast
- TypeScript typecheck only
- Use for imports, types, small safe edits

### verify:medium
- Typecheck + build
- Use for refactors and wiring changes

### verify:full
- Typecheck + build + smoke test
- Use for entrypoints or higher-risk changes

## Rules
- Always choose the lightest correct verification
- Do not rerun verification loops autonomously
- On failure: STOP and report the error
