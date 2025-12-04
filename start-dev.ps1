Write-Host "Starting servers... (Ctrl+C to stop)" -ForegroundColor Green

$root = $PWD.Path
$backendProc = Start-Process -NoNewWindow -PassThru -FilePath "cmd" -ArgumentList "/c", "npm run dev" -WorkingDirectory "$root\backend"
$frontendProc = Start-Process -NoNewWindow -PassThru -FilePath "cmd" -ArgumentList "/c", "npm run dev" -WorkingDirectory "$root\frontend"

try {
    Wait-Process -Id $backendProc.Id, $frontendProc.Id
} finally {
    taskkill /F /T /PID $backendProc.Id 2>$null
    taskkill /F /T /PID $frontendProc.Id 2>$null
    Write-Host "`nStopped." -ForegroundColor Yellow
}
