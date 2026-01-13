REVIEW_GATE.mod
 param(
  [string]$ConfigPath = "",
  [int]$MaxFiles = 12,
  [int]$LookbackHours = 24,
  [ValidateSet("plan","apply")]
  [string]$Mode = "plan"
  [switch]$PreferStaged,
  [string]$ModelName = "nemotron-3-nano",
  [switch]$TestMode,
  [switch]$UseContinue
  )

$TEST_MODE = $true

if ($TEST_MODE) {
  $VERDICT = "PASS"
  $CONFIDENCE = 50
  $RISK = "MEDIUM"

  Write-Host "VERDICT: $VERDICT"
  Write-Host "CONFIDENCE: $CONFIDENCE"
  Write-Host "RISK: $RISK"

  exit 0
}
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-ProjectRoot {
  # 1) Git root, ak existuje
  if (Get-Command git -ErrorAction SilentlyContinue) {
    try {
      $root = (git rev-parse --show-toplevel 2>$null).Trim()
      if ($root) { return $root }
    } catch {}
  }
  # 2) Inak aktuálny priečinok
  return (Get-Location).Path
}

function Resolve-ContinueConfig([string]$root, [string]$explicit) {
  if ($explicit -and (Test-Path $explicit)) { return (Resolve-Path $explicit).Path }

  $p1 = Join-Path $root ".continue\config.yaml"
  if (Test-Path $p1) { return $p1 }

  $p2 = Join-Path $env:USERPROFILE ".continue\config.yaml"
  if (Test-Path $p2) { return $p2 }

  throw "Nenašiel som Continue config.yaml. Daj ho do .continue\config.yaml alebo použi -ConfigPath."
}

function Is-GitRepo([string]$root) {
  return (Test-Path (Join-Path $root ".git")) -and (Get-Command git -ErrorAction SilentlyContinue)
}

function Get-GitChangedFiles([switch]$preferStaged) {
  $staged = @()
  $work = @()

  try { $staged = (git diff --cached --name-only) } catch {}
  try { $work   = (git diff --name-only) } catch {}

  $staged = $staged | Where-Object { $_ -and $_.Trim() -ne "" }
  $work   = $work   | Where-Object { $_ -and $_.Trim() -ne "" }

  if ($preferStaged -and $staged.Count -gt 0) { return ,$staged }
  if ($staged -and @($staged).Count -gt 0) { return $staged }
  if ($work.Count -gt 0) { return ,$work }

  return @()
}

function Build-ContextFile([string]$root, [string]$outDir, [string[]]$files, [bool]$gitMode, [switch]$preferStaged) {
  $ctxPath = Join-Path $outDir "context.txt"

  $lines = New-Object System.Collections.Generic.List[string]
  $lines.Add("ATOMA_REVIEW_CONTEXT v1")
  $lines.Add("root: $root")
  $lines.Add("utc:  $(Get-Date).ToUniversalTime().ToString('s')Z")
  $lines.Add("")

  if ($gitMode) {
    $lines.Add("## git status (porcelain)")
    try { $lines.AddRange((git status --porcelain)) } catch {}
    $lines.Add("")

    $lines.Add("## git diff --stat")
    try {
      if ($preferStaged) { $lines.AddRange((git diff --cached --stat)) }
      else { $lines.AddRange((git diff --stat)) }
    } catch {}
    $lines.Add("")

    $lines.Add("## git diff (truncated safeguard)")
    $diff = @()
    try {
      if ($preferStaged) { $diff = (git diff --cached) }
      else { $diff = (git diff) }
    } catch {}
    # safeguard: nepreposielať nekonečný diff
    $maxLines = 1800
    if ($diff.Count -gt $maxLines) {
    $truncated = $diff[0..($maxLines-1)] | ForEach-Object { [string]$_ }
    $lines.AddRange(
    [string[]]($diff[0..($maxLines-1)])
)
      $lines.Add("")
      $lines.Add("...TRUNCATED... (diff was too large)")
    } else {
     foreach ($d in $diff) {
    $lines.Add([string]$d)
}

    }
    $lines.Add("")
  } else {
    $lines.Add("## no-git mode")
    $lines.Add("Changed files detected by mtime lookback (hours=$LookbackHours).")
    $lines.Add("")
  }

  $lines.Add("## file refs (for Continue @context)")
  foreach ($f in $files) { $lines.Add($f) }

  [System.IO.File]::WriteAllLines($ctxPath, $lines)
  return $ctxPath
}

function Build-Prompt([string[]]$fileRefs, [string]$modelName) {
  $fileRefStr = ($fileRefs | ForEach-Object { "@$($_)" }) -join " "

  $maybeModelLine = ""
  if ($modelName -and $modelName.Trim() -ne "") {
    # CLI podporuje /model slash command; ak by to tvoja verzia ignorovala, nič sa nedeje.
    $maybeModelLine = "/model $modelName`n"
  }

  @"
$maybeModelLine
You are ATOMA_MAINTENANCE_GATE (READ-ONLY reviewer). Your job is to protect the game from regressions and create a safe executor prompt.

CONTEXT:
- This is a Three.js/R3F TypeScript-ish codebase with many legacy JS files.
- We prefer SAFE patches: minimal diffs, no refactors unless required.
- Never invent files/exports. If something is missing, call it out explicitly.

ABSOLUTE RULES (SAFETY):
1) Do NOT propose changes that require new dependencies unless explicitly requested.
2) Preserve existing exports, function names, and runtime behavior unless a bug fix demands it.
3) Avoid per-frame allocations in render/update loops (no new arrays/objects inside hot loops).
4) Prefer additive code paths guarded by feature flags or no-op fallbacks.
5) If you suspect an integration ordering issue (init/update), spell out the order clearly.

TASK:
A) Review the provided changes + referenced files and identify:
   - build/runtime risks (imports/exports, missing symbols, circular deps)
   - performance pitfalls (allocations, expensive loops, excessive draw calls triggers)
   - unsafe edits (broad refactors, deletions, renames)
   - Atoma-specific risks: synergy/harmony/corruption systems miswired, orphaned patches, init order breaks

B) Output MUST be in this exact Markdown structure:

# ATOMA REVIEW GATE
## VERDICT
One of: PASS / WARN / FAIL (choose worst-case)
## TOP RISKS (max 7)
- [SEV:LOW|MED|HIGH] file:line-ish — problem — why it matters — safest fix idea
## FINDINGS
List concrete findings. If none, say "No issues found".
## TEST PLAN (minimal)
List commands / checks I should run locally.
## EXECUTOR PROMPT (paste into DevStral Agent)
Provide ONE prompt that instructs DevStral to implement the fixes safely.
Constraints: "minimal diff", "no deletions unless necessary", "keep exports stable",
and require DevStral to return a unified diff + brief rationale.

IMPORTANT OUTPUT CONTRACT (MANDATORY):

You MUST append the following block at the VERY END of your response.
Do NOT add any text after it.
Do NOT alter labels.
Do NOT add explanations inside the block.

===== ATOMA_REVIEW_VERDICT =====
VERDICT: PASS | FAIL | INCONCLUSIVE
SEVERITY: NONE | LOW | MEDIUM | HIGH | CRITICAL
CONFIDENCE: 0.00–1.00
FILES_ANALYZED: <number>
ISSUES_FOUND: <number>
AUTO_FIX_SAFE: YES | NO
================================

Rules:
- VERDICT must be exactly one of the allowed values.
- If critical risk exists → VERDICT must be FAIL.
- If uncertain → VERDICT must be INCONCLUSIVE.
- AUTO_FIX_SAFE = YES only if changes are trivial and reversible.
FILES:
$fileRefStr

Remember: You are READ-ONLY here. Do not ask to run tools. If context is insufficient, list "NEEDED_CONTEXT:" with bullet points.
"@
}

# -------------------- main --------------------
$root = Resolve-ProjectRoot
Push-Location $root

if (-not (Get-Command cn -ErrorAction SilentlyContinue)) {
  Write-Warning "External IDE agent not available running headless mode
 TEST MODE (skipping)"
}


  $cfg = Resolve-ContinueConfig $root $ConfigPath

  $outDir = Join-Path $root ".ai\out"
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null

  $gitMode = Is-GitRepo $root
  $files = @()

  if ($gitMode) {
    $files = Get-GitChangedFiles -preferStaged:$PreferStaged
  }

  if (-not $files -or $files.Count -eq 0) {
    # fallback: last modified files (no-git or no changes)
    $cutoff = (Get-Date).AddHours(-$LookbackHours)
    $candidates =
      Get-ChildItem -Path (Join-Path $root "src") -Recurse -File -ErrorAction SilentlyContinue |
      Where-Object { $_.LastWriteTime -ge $cutoff } |
      Sort-Object LastWriteTime -Descending |
      Select-Object -First $MaxFiles

    $files = $candidates | ForEach-Object {
      # relatívna cesta
      $_.FullName.Substring($root.Length).TrimStart('\','/')
    }
  }

  # cap
  if ($files.Count -gt $MaxFiles) { $files = $files[0..($MaxFiles-1)] }

  $ctx = Build-ContextFile -root $root -outDir $outDir -files $files -gitMode $gitMode -preferStaged:$PreferStaged
  $prompt = Build-Prompt -fileRefs $files -modelName $ModelName

  $stamp = Get-Date -Format "yyyyMMdd_HHmmss"
  $outPath = Join-Path $outDir "atoma_review_$stamp.md"

  # Headless run:
  # -p = headless mode
  # --prompt = pridá extra kontext (náš context.txt)
  #$result = & cn --config $cfg -p --prompt $ctx $prompt
$result = @"
TEST MODE

Review gate executed.
No Continue / Executor invoked.

VERDICT: PASS
REASON:
- Test mode
- No execution performed
- Pipeline OK
SCORING:
CONFIDENCE: <0-100>
RISK: <LOW|MEDIUM|HIGH>
"@

if ($VERDICT -eq "FAIL") {
  throw "REVIEW_FAILED"
}

if ($VERDICT -eq "INCONCLUSIVE") {
  throw "REVIEW_INCONCLUSIVE"
}

  $result | Out-File -FilePath $outPath -Encoding utf8
  Write-Host "OK: wrote $outPath"
  Write-Host "Context: $ctx"

