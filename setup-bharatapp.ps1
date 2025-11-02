# BharatApp frontend setup script (Windows PowerShell)
Write-Host "BharatApp frontend auto-setup (verify Node.js and run npm install)" -ForegroundColor Cyan

$node = node -v 2>$null
if (-not $node) {
  Write-Host "Node.js not detected. Please install from https://nodejs.org/ (LTS) and re-run." -ForegroundColor Red
  exit
}
Write-Host "Node detected: $node" -ForegroundColor Green

$project = (Get-Location).Path
Write-Host "Installing dependencies in $project ..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
  Write-Host "npm install failed. Check errors." -ForegroundColor Red
  exit
}

Write-Host "Starting dev server..." -ForegroundColor Cyan
npm run dev
