# Arranca Loopapp en Windows: instala dependencias, levanta el servidor y abre el navegador cuando está listo.
# Uso (PowerShell, dentro de la carpeta del proyecto):
#   powershell -ExecutionPolicy Bypass -File .\iniciar-windows.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Falta Node.js. Instalalo desde https://nodejs.org (version LTS) y volve a correr este script." -ForegroundColor Red
  exit 1
}

Write-Host "Instalando dependencias..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "Fallo npm install" -ForegroundColor Red; exit 1 }

Write-Host "Levantando Loopapp (se abre en otra ventana, no la cierres)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot'; npm run dev"

$url = "http://localhost:3000"
for ($i = 0; $i -lt 120; $i++) {
  try {
    Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30 | Out-Null
    Write-Host "Listo: $url" -ForegroundColor Green
    Start-Process $url
    exit 0
  } catch { Start-Sleep -Seconds 2 }
}
Write-Host "No respondio en $url. Mira la otra ventana para ver el error." -ForegroundColor Red
exit 1
