# Check all return factory(group, color) statements

$filePath = "EnhancedNodeModels.js"
$content = Get-Content $filePath -Raw

# Find all return factory(group, color) or similar patterns
$returnFactoryMatches = [regex]::Matches($content, "return\s+factory\s*\([^)]+\)|return\s+result\s*;")

Write-Host "Found $($returnFactoryMatches.Count) return factory/result statements:"

$returnFactoryMatches | ForEach-Object -Begin {
  $start = $_.Index
  $end = $_.Index + 20
  $snippet = $content.Substring($start, $end - $start)
  $lineNumber = ($content.Substring(0, $start).Split("`n").Count) + 1
  
  Write-Host "`nLine $lineNumber ($($start)):"
  Write-Host "  $($_.Value)"
  
  # Check if this is in a function with Copy nodeId comment
  $functionStart = $content.LastIndexOf("static ", $start)
  $functionEnd = $content.IndexOf("}", $start) + 1
  if ($functionStart -gt 0) {
    $functionBody = $content.Substring($functionStart, $functionEnd - $functionStart)
    if ($functionBody -match "Copy nodeId from input group") {
      Write-Host "  [HAS Copy nodeId comment]"
    } else {
      Write-Host "  [MISSING Copy nodeId comment]"
    }
  }
}

Write-Host "`n=== SUMMARY ==="
Write-Host "Total return factory statements: $($returnFactoryMatches.Count)"
