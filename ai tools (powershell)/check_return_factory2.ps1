# Find all functions with "return factory(group, color)"

$filePath = "EnhancedNodeModels.js"
$content = Get-Content $filePath -Raw

# Find all "return factory(group, color)" patterns
$matches = [regex]::Matches($content, "return\s+factory\s*\(\s*group\s*,\s*color\s*\)")

Write-Host "Found $($matches.Count) 'return factory(group, color)' statements:`

# For each match, find the function definition
foreach ($match in $matches) {
  $startPos = $match.Index
  
  # Find function definition before this return
  $funcStart = $content.LastIndexOf("static ", $startPos)
  if ($funcStart -gt 0) {
    $funcEnd = $content.IndexOf("{", $funcStart) + 1
    $funcSig = $content.Substring($funcStart, $funcEnd - $funcStart)
    
    Write-Host ""
    Write-Host "Function: $funcSig"
    Write-Host "  Position: $startPos"
    Write-Host "  Has 'Copy nodeId': $($content.Substring($funcStart, $startPos) -match 'Copy nodeId from input group')"
  }
}

# Find functions with "return factory(group, color)" but NO "Copy nodeId"
Write-Host "`n=== CHECKING FOR MISSING 'Copy nodeId' ==="

$functionsChecked = @()
$functionsWithoutCopyId = @()

foreach ($match in $matches) {
  $startPos = $match.Index
  
  # Find function definition before this return
  $funcStart = $content.LastIndexOf("static ", $startPos)
  if ($funcStart -gt 0) {
    $funcSig = $content.Substring($funcStart, $content.IndexOf("{", $funcStart) + 1)
    
    $hasCopyId = $content.Substring($funcStart, $startPos) -match "Copy nodeId from input group"
    
    $functionsChecked += $funcSig
    
    if (-not $hasCopyId) {
      $functionsWithoutCopyId += $funcSig
      Write-Host "MISSING: $funcSig"
    }
  }
}

Write-Host "`n=== SUMMARY ==="
Write-Host "Total functions checked: $($functionsChecked.Count)"
Write-Host "Functions WITHOUT 'Copy nodeId': $($functionsWithoutCopyId.Count)"
