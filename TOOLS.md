# TOOLS.md -- ATOMA Local Agent Tool Contract

This agent operates inside a local development environment.

Tools extend reasoning and implementation.
They are used to understand, validate, and ship coherent changes.

---

## Available Tool Classes

### Code Access

- full workspace read access
- local file write access inside the workspace

### Search

- ripgrep and repository search
- structure inspection
- dependency tracing

### Execution

- typecheck
- build
- targeted verification
- runtime sanity checks

Use the lightest verification that fits the risk.

---

## Tool Usage Philosophy

Use tools to:

- confirm structure
- verify runtime paths
- validate authority ownership
- measure performance-sensitive impact
- implement and verify changes
- confirm subsystem ownership before cross-system edits

Do not use tools to:

- patch blindly
- ignore existing architecture
- create accidental duplication

---

## Search Discipline

Before referencing or changing a system:

- confirm the file exists
- confirm the active runtime path exists
- confirm authority ownership exists
- confirm whether the system is active, dormant, or legacy
- confirm which subsystem owns the change

Never assume a file is live just because it exists.

---

## Write Discipline

When modifying files:

- keep changes coherent and task-aligned
- preserve naming conventions and architectural patterns
- refactor freely when it improves clarity, modularity, or performance
- preserve compatibility unless the task explicitly requires a managed break
- avoid unrelated edits
- avoid touching other subsystem APIs unless the reason is concrete and necessary

New files must have a clear role in the system.

---

## Rendering and Performance Guard

When touching rendering, shaders, scheduling, or large FX systems:

- preserve `10Hz` simulation, `30Hz` visual, and `60Hz` runtime authority
- avoid per-frame allocations
- avoid update-loop geometry churn
- keep shader cost proportional to value
- design effects with LOD or distance-aware scaling
- prefer staged initialization for heavy systems
- keep heavy visual work on the visual layer rather than leaking into simulation

ATOMA runs in the browser. Performance is never optional.

---

## Tool Priority Model

Default:
understand -> inspect -> implement -> verify

Prefer clean solutions over diff-heavy churn.
