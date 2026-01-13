$resp = Invoke-RestMethod `
  -Method POST `
  -Uri "http://127.0.0.1:8000/run" `
  -ContentType "application/json" `
  -Body (@{
    lookback_hours = 24
    mode = "plan"
  } | ConvertTo-Json)

$runId = $resp.run_id
Write-Host "Run started: $runId"

do {
  Start-Sleep 2
  $status = Invoke-RestMethod "http://127.0.0.1:8000/status/$runId"
  Write-Host "Status: $($status.state)"
} while ($status.state -eq "running")