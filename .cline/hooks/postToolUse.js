export default function onPostToolUse(ctx) {
  const log = {
    role: ctx.skill,
    tool: ctx.tool.name,
    target: ctx.tool.path || null,
    timestamp: new Date().toISOString()
  };

  ctx.appendMemory("atoma_audit_log", log);
}
