# Check all createControl functions for nodeId handling

$filePath = "EnhancedNodeModels.js"
$content = Get-Content $filePath -Raw

# Find all createControl functions
$createControlMatches = [regex]::Matches($content, "static createControl\w+\(group[^)]*\)")
Write-Host "Found $($createControlMatches.Count) createControl functions:"
$createControlMatches | ForEach-Object { Write-Host "  - $($_.Value)" }

# Find all "Copy nodeId" comments
$copyNodeIdMatches = [regex]::Matches($content, "Copy nodeId from input group")
Write-Host "`nFound $($copyNodeIdMatches.Count) 'Copy nodeId from input group' comments"
$copyNodeIdMatches | ForEach-Object { Write-Host "  - Line $($_.Index)" }

# Find all functions with "Copy nodeId from input group"
$functionsWithCopyId = @()
$createControlMatches | ForEach-Object {
  $funcStart = $_.Index
  $funcEnd = $content.IndexOf("}", $funcStart)
  if ($funcEnd -gt $funcStart) {
    $funcBody = $content.Substring($funcStart, $funcEnd - $funcStart)
    if ($funcBody -match "Copy nodeId from input group") {
      $functionsWithCopyId += $_.Value
    }
  }
}

Write-Host "`nFunctions with 'Copy nodeId from input group': $($functionsWithCopyId.Count)"
$functionsWithCopyId | ForEach-Object { Write-Host "  - $_" }

Write-Host "`n=== SUMMARY ==="
Write-Host "Factories: $($createControlMatches.Count)"
Write-Host "Copy nodeId comments: $($copyNodeIdMatches.Count)"
Write-Host "Functions with Copy nodeId: $($functionsWithCopyId.Count)"
