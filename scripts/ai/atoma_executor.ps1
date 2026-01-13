param(
  [Parameter(Mandatory=$true)][string]$ReviewFile,
  [Parameter(Mandatory=$true)][string]$ContextFile,
  [Parameter(Mandatory=$true)][string]$ModelName,
  [ValidateSet("plan","apply")][string]$Mode = "plan"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "ATOMA EXECUTOR ($Mode)"
Write-Host "Review: $ReviewFile"
Write-Host "Context: $ContextFile"
Write-Host "Model: $ModelName"

if (-not (Test-Path $ReviewFile))  { throw "Missing review file: $ReviewFile" }
if (-not (Test-Path $ContextFile)) { throw "Missing context file: $ContextFile" }

# načítaj review + context
$reviewText  = Get-Content -Raw -Path $ReviewFile
$contextText = Get-Content -Raw -Path $ContextFile

# kam output
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$outDir = Join-Path $root ".ai\out"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$planPath = Join-Path $outDir "atoma_exec_plan_$stamp.md"

# Základný SAFE prompt kontrakt
$prompt = @"
You are ATOMA_EXECUTOR.
INPUTS:
- review.md (contains verdict + executor prompt if present)
- context.txt (code context)
TASK:
1) Produce a SAFE EXECUTION PLAN.
2) DO NOT modify files in plan mode.
3) In apply mode, output a unified diff patch ONLY.

OUTPUT FORMAT:
MODE: $Mode
PLAN:
- bullet steps...

PATCH:
```diff
... (only in apply mode) ...
"@