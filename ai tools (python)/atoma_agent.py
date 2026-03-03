import os
import sys
from datetime import datetime

BASE_DIR = "agent_runs"

INVARIANTS = """
## CANONICAL CONSTRAINTS (NON-NEGOTIABLE)

Scheduler:
- background = 2Hz
- simulation = 10Hz
- visual = 30Hz
- runtime = 60Hz

Single writer rule:
Only NodeMetricEngine + MetricsRuntime may mutate metrics.

No new debug instrumentation in spawn pipeline.
No new flags/wrappers unless explicitly approved.
No FPS-dependent relax logic.
"""

AGENT_DECISION = {
    "architecture": "GLM-4.7-PRO",
    "metrics": "GLM-4.7-PRO",
    "scheduler": "GLM-4.7-PRO",
    "performance": "GLM-4.7-PRO",
    "visual": "GLM-4.7-LITE",
    "bug": "CODEX-PLUS"
}


def create_task(task_name, problem_type):
    date_prefix = datetime.now().strftime("%Y-%m-%d")
    folder_name = f"{date_prefix}_{task_name}"
    path = os.path.join(BASE_DIR, folder_name)

    os.makedirs(path, exist_ok=True)

    agent = AGENT_DECISION.get(problem_type, "GLM-4.7-PRO")

    handoff_content = f"""# ATOMA HANDOFF

## TASK
{task_name}

## PROBLEM TYPE
{problem_type}

## TARGET AGENT
{agent}

## SCOPE
- Define affected subsystem
- Define allowed modification surface

## PROBLEM STATEMENT
- Current behavior:
- Expected behavior:
- Evidence:

{INVARIANTS}
"""

    with open(os.path.join(path, "handoff.md"), "w", encoding="utf-8") as f:
        f.write(handoff_content)

    open(os.path.join(path, "pro_output.md"), "w").close()
    open(os.path.join(path, "codex_patch.diff"), "w").close()
    open(os.path.join(path, "lite_review.md"), "w").close()
    open(os.path.join(path, "final_decision.md"), "w").close()

    print(f"Created task folder: {path}")
    print(f"Recommended agent: {agent}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python atoma_agent.py new <task-name> <problem-type>")
        print("Problem types: architecture, metrics, scheduler, performance, visual, bug")
        sys.exit(1)

    _, command, task_name, problem_type = sys.argv

    if command == "new":
        create_task(task_name, problem_type)