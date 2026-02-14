param(
  [string]$ConfigPath = "",
  [int]$MaxFiles = 12,
  [int]$LookbackHours = 24,
  [switch]$PreferStaged,

  # Modely (podľa tvojho stacku)
  [string]$ReviewerModel = "nemotron-3-nano",      # reviewer (rýchly, prísny)
  [string]$ExecutorModel = "devstral-small-2",     # executor (implementácia)

  # Bezpečnostné allowlisty – patch sa NESMIE dotknúť iných ciest
  [string[]]$AllowPaths = @("src/", "scripts/", ".continue/"),

  # Loop limity
  [int]$MaxIterations = 2
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-ProjectRoot {
  if (Get-Command git -ErrorAction SilentlyContinue) {
    try {
      $root = (git rev-parse --show-toplevel 2>$null).Trim()
      if ($root) { return $root }
    } catch {}
  }
  return (Get-Location).Path
}

function Is-GitRepo([string]$root) {
  return (Test-Path (Join-Path $root ".git")) -and (Get-Command git -ErrorAction SilentlyContinue)
}

function Ensure-Dir([string]$p) {
  New-Item -ItemType Directory -Force -Path $p | Out-Null
}

function Extract-Section([string]$text, [string]$header) {
  # nájde sekciu "# ATOMA REVIEW GATE" a podsekcie
  $pattern = [regex]::Escape($header) + "\s*([\s\S]*?)(\n## |\z)"
  $m = [regex]::Match($text, $pattern)
  if ($m.Success) { return $m.Groups[1].Value.Trim() }
  return ""
}

function Extract-Verdict([string]$reviewText) {
  $v = Extract-Section $reviewText "## VERDICT"
  if ($v -match "PASS") { return "PASS" }
  if ($v -match "WARN") { return "WARN" }
  if ($v -match "FAIL") { return "FAIL" }
  return "UNKNOWN"
}

function Extract-ExecutorPrompt([string]$reviewText) {
  return Extract-Section $reviewText "## EXECUTOR PROMPT (paste into DevStral Agent)"
}

function Extract-DiffBlock([string]$text) {
    $pattern = '```(?:diff|patch)\s*([\s\S]*?)```'
    $m = [regex]::Match($text, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if ($m.Success) {
        return $m.Groups[1].Value.Trim()
    }
    return ""
}

function Diff-Touches-Only-Allowlist([string]$diff, [string[]]$allowPaths) {
  # z unified diff vytiahne file paths zo "+++ b/..." a "--- a/..."
  $paths = New-Object System.Collections.Generic.HashSet[string]
  foreach ($line in ($diff -split "`n")) {
    if ($line -match "^\+\+\+\s+b/(.+)$") { [void]$paths.Add($Matches[1].Trim()) }
    elseif ($line -match "^---\s+a/(.+)$") { [void]$paths.Add($Matches[1].Trim()) }
  }

  foreach ($p in $paths) {
    $ok = $false
    foreach ($allow in $allowPaths) {
      # normalizuj na forward slashes
      $allowNorm = $allow.Replace("\","/")
      $pNorm = $p.Replace("\","/")
      if ($pNorm.StartsWith($allowNorm)) { $ok = $true; break }
    }
    if (-not $ok) { return $false }
  }
  return $true
}

function Apply-Patch-Git([string]$diff, [string]$branchName) {
  # vytvor branch, apply --check, apply
  git rev-parse --is-inside-work-tree | Out-Null

  $current = (git branch --show-current).Trim()
  if (-not $current) { $current = "DETACHED" }

  git checkout -b $branchName | Out-Null

  $tmpPatch = Join-Path (Resolve-ProjectRoot) ".ai\out\last_patch.diff"
  $diff | Out-File -FilePath $tmpPatch -Encoding utf8

  git apply --check $tmpPatch | Out-Null
  git apply $tmpPatch | Out-Null

  return $tmpPatch
}

# ---------------- main ----------------
$root = Resolve-ProjectRoot
Push-Location $root

try {
  $outDir = Join-Path $root ".ai\out"
  Ensure-Dir $outDir

  $stamp = Get-Date -Format "yyyyMMdd_HHmmss"
  $gitMode = Is-GitRepo $root

  # 1) REVIEW STEP
  $reviewScript = Join-Path $root "scripts\ai\atoma_review_gate.ps1"
  if (-not (Test-Path $reviewScript)) {
    throw "Chýba $reviewScript (review gate script). Ulož ho tam najprv."
  }

  $reviewArgs = @(
    "-MaxFiles", $MaxFiles,
    "-LookbackHours", $LookbackHours
  )
  if ($ConfigPath) { $reviewArgs += @("-ConfigPath", $ConfigPath) }
  if ($PreferStaged) { $reviewArgs += @("-PreferStaged") }
  if ($ReviewerModel) { $reviewArgs += @("-ModelName", $ReviewerModel) }

  Write-Host "==[1/2] REVIEW (model=$ReviewerModel) =="

  # review gate script zapisuje output do .ai/out/atoma_review_*.md a zároveň vypíše cestu
  $reviewOutput = & $reviewScript @reviewArgs 2>&1 | Out-String

  # nájdi posledný review file
  $reviewFile = Get-ChildItem -Path $outDir -Filter "atoma_review_*.md" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $reviewFile) { throw "Nenašiel som review output v $outDir" }

  $reviewText = Get-Content $reviewFile.FullName -Raw
  $verdict = Extract-Verdict $reviewText
  $execPrompt = Extract-ExecutorPrompt $reviewText

  Write-Host "Verdict: $verdict"
  Write-Host "Review file: $($reviewFile.FullName)"

  if ($verdict -eq "PASS") {
    Write-Host "PASS → loop končí. (Žiadny executor run.)"
    return
  }

  if (-not $execPrompt) {
    throw "Review neobsahuje EXECUTOR PROMPT. Skontroluj review výstup."
  }

  # 2) EXECUTOR STEP (loop)
  $iteration = 0
  $lastExecOut = ""
  $lastDiff = ""

  while ($iteration -lt $MaxIterations) {
    $iteration++
    Write-Host "==[2/2] EXECUTE iter=$iteration (model=$ExecutorModel) =="

$ExecutorPrompt = @"
You are ATOMA_EXECUTOR (implementation-agent).

Implement ONLY the fixes described below.

Hard constraints:
- Minimal diff. No refactors unless required to fix the issue.
- No new dependencies.
- Preserve exports and public APIs.
- No per-frame allocations in render/update loops.
- Touch only necessary files.

Output rules:
- Output MUST contain a single unified diff in a fenced code block.
- Do NOT include anything else outside that diff block.

ALLOWED PATHS:
$($AllowPaths -join ", ")

TASK:
$ExecPrompt
"@

    # Model selection: najstabilnejšie je mať v config.yaml model s roles [edit, apply]
    # a v prompt-e ho explicitne pomenovať (ak CLI /model podporuje, OK; ak nie, text aj tak pomôže).
    $maybeModelLine = ""
    if ($ExecutorModel) { $maybeModelLine = "/model $ExecutorModel`n" }

    $fullPrompt = $maybeModelLine + $executorPrompt

    $execOutFile = Join-Path $outDir "atoma_exec_${stamp}_iter${iteration}.md"

    # spusti cn headless
    $cfgArg = @()
    if ($ConfigPath) { $cfgArg = @("--config", $ConfigPath) }

    $execResult = & cn @cfgArg -p $fullPrompt
    $execResult | Out-File -FilePath $execOutFile -Encoding utf8
    $lastExecOut = $execResult

    $diff = Extract-DiffBlock $execResult
    if (-not $diff) {
      Write-Host "Executor nevygeneroval ```diff``` block. FAIL."
      break
    }

    if (-not (Diff-Touches-Only-Allowlist $diff $AllowPaths)) {
      Write-Host "Diff sa dotýka súborov mimo allowlist. ABORT."
      break
    }

    $lastDiff = $diff

    if ($gitMode) {
      $branch = "ai/loop-$stamp-iter$iteration"
      Write-Host "Applying patch on new branch: $branch"
      $patchPath = Apply-Patch-Git $diff $branch
      Write-Host "Applied OK. Patch saved: $patchPath"
      Write-Host "Next: run your local tests/build. (Ak zlyhá, revert branch.)"
      return
    } else {
      # bez git: neaplikujeme automaticky (bezpečnosť)
      $patchPath = Join-Path $outDir "atoma_patch_${stamp}_iter${iteration}.diff"
      $diff | Out-File -FilePath $patchPath -Encoding utf8
      Write-Host "No-git mode: patch generated but NOT auto-applied."
      Write-Host "Patch: $patchPath"
      return
    }
  }

  # ak sme sa sem dostali, loop zlyhal
  $failFile = Join-Path $outDir "atoma_loop_failed_$stamp.md"
  @"
# ATOMA LOOP FAILED
- verdict: $verdict
- iterations: $iteration / $MaxIterations
- gitMode: $gitMode
- lastExecOutFile: $execOutFile

## Last review
$($reviewFile.FullName)

## Notes
Executor did not produce a valid diff OR diff touched forbidden paths OR apply failed.
"@ | Out-File -FilePath $failFile -Encoding utf8

  Write-Host "Loop FAILED. See: $failFile"
}
finally {
  Pop-Location
}
