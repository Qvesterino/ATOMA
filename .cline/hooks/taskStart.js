export default function onTaskStart(ctx) {
  ctx.injectSystemMessage(`
ATOMA PROJECT CONTEXT

This is a long-running AAA-grade game engine.
Rules:
- Patch-based architecture
- No monolithic refactors
- Visuals must not change unless explicitly requested
- Metrics and engine core are protected
- Stability and determinism over cleverness

Active role: ${ctx.skill}
Violating these rules will terminate the task.
`);
}
