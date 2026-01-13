import policy from "./policy.json";

export default function onPreToolUse(ctx) {
  const role = ctx.skill;
  const tool = ctx.tool.name;
  const path = ctx.tool.path || "";

  const rolePolicy = policy.roles[role];

  if (!rolePolicy.allow.includes(tool)) {
    throw new Error(`ATOMA POLICY: ${role} is not allowed to use ${tool}`);
  }

  for (const protectedPath of policy.protectedPaths) {
    if (path.startsWith(protectedPath) && role !== "atoma-engineer") {
      throw new Error(`ATOMA POLICY: ${role} cannot touch protected path ${path}`);
    }
  }
}
