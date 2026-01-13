export default function onTaskComplete(ctx) {
  if (!ctx.memory.reviewerVerdict) {
    throw new Error("ATOMA POLICY: Task completed without reviewer verdict");
  }

  ctx.appendMemory("atoma_task_history", {
    task: ctx.task,
    verdict: ctx.memory.reviewerVerdict,
    timestamp: new Date().toISOString()
  });
}
