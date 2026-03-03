from fastapi import FastAPI
from pydantic import BaseModel
import subprocess
import uuid
import os
import datetime

app = FastAPI(title="ATOMA AI Daemon")

# ===============================
# JOB STATE REGISTRY
# ===============================
RUNS = {}  # run_id -> { status, started_at, finished_at, pid }

LOG_DIR = "daemon_logs"
os.makedirs(LOG_DIR, exist_ok=True)

# ===============================
# REQUEST MODEL
# ===============================
class RunRequest(BaseModel):
    mode: Literal["plan", "apply"] = "plan"
    lookback_hours: int = 24
    pass  # STEP 1: no params yet


# ===============================
# POST /run
# ===============================
@app.post("/run")
def run_atoma(req: RunRequest):
    run_id = str(uuid.uuid4())
    started_at = datetime.datetime.utcnow().isoformat()

    stdout_path = os.path.join(LOG_DIR, f"{run_id}.out")
    stderr_path = os.path.join(LOG_DIR, f"{run_id}.err")

    stdout = open(stdout_path, "w", encoding="utf-8")
    stderr = open(stderr_path, "w", encoding="utf-8")

    process = subprocess.Popen(
        [
        "powershell",
        "-ExecutionPolicy", "Bypass",
        "-File", "scripts/ai/atoma_loop_2step.ps1",
        "-LookbackHours", str(req.lookback_hours),
        "-Mode", req.mode,
        ],
        stdout=stdout,
        stderr=stderr
    )

    RUNS[run_id] = {
        "status": "running",
        "started_at": started_at,
        "finished_at": None,
        "pid": process.pid,
        "stdout": stdout_path,
        "stderr": stderr_path,
    }

    return {
        "run_id": run_id,
        "status": "started",
        "pid": process.pid
    }


# ===============================
# GET /status/{run_id}
# ===============================
@app.get("/status/{run_id}")
def get_status(run_id: str):
    if run_id not in RUNS:
        return {"error": "run_id not found"}

    run = RUNS[run_id]
    pid = run["pid"]

    # check if process still alive
    alive = False
    try:
        alive = subprocess.call(
            ["powershell", "-Command", f"Get-Process -Id {pid}"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        ) == 0
    except Exception:
        alive = False

    if run["status"] == "running" and not alive:
        run["status"] = "finished"
        run["finished_at"] = datetime.datetime.utcnow().isoformat()

    return run
