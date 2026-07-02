#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Script para compilar Coodetrans y generar hash SHA256

.PARAMETER BuildType
  Tipo de build: 'portable' (default), 'installer', 'portable-zip'

.EXAMPLE
  .\build-with-hash.ps1 -BuildType portable
  .\build-with-hash.ps1 -BuildType portable-zip
#>

param(
  [string]$BuildType = "portable",
  [string]$Version = ""
)

$ErrorActionPreference = "Stop"

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Coodetrans Build Tool con Hash SHA256 ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Validar tipo de build
$validTypes = @("portable", "installer", "portable-zip")
if ($validTypes -notcontains $BuildType) {
  Write-Host "❌ Tipo de build inválido: $BuildType" -ForegroundColor Red
  Write-Host "Tipos válidos: $($validTypes -join ', ')" -ForegroundColor Yellow
  exit 1
}

Write-Host "🔨 Compilando: $BuildType" -ForegroundColor Green

# Ejecutar build
switch ($BuildType) {
  "portable" {
    npm run build:portable
  }
  "installer" {
    npm run build:installer
  }
  "portable-zip" {
    npm run build:portable
  }
}

Write-Host ""
Write-Host "📍 Buscando ejecutables generados..." -ForegroundColor Cyan

# Encontrar EXE generado
$exeFiles = @()
if (Test-Path "dist") {
  $exeFiles = Get-ChildItem -Path "dist" -Include "*.exe" -Recurse | Where-Object { $_.PSIsContainer -eq $false }
}

if ($exeFiles.Count -eq 0) {
  Write-Host "❌ No se encontraron archivos .exe en dist/" -ForegroundColor Red
  exit 1
}

Write-Host "✅ Se encontraron $($exeFiles.Count) archivo(s) .exe" -ForegroundColor Green
Write-Host ""

# Generar hashes
$hashFile = "dist/HASHES.txt"
$hashContent = @("Coodetrans Gestión - Hash SHA256", "=" * 50, "")

foreach ($exe in $exeFiles) {
  Write-Host "📦 Procesando: $($exe.Name)" -ForegroundColor Yellow
  
  try {
    $hash = (Get-FileHash -Path $exe.FullName -Algorithm SHA256).Hash
    $size = [Math]::Round($exe.Length / 1MB, 2)
    
    Write-Host "   Tamaño: $size MB" -ForegroundColor Gray
    Write-Host "   SHA256: $hash" -ForegroundColor Green
    
    $hashContent += $exe.Name
    $hashContent += "Tamaño: $size MB"
    $hashContent += "SHA256: $hash"
    $hashContent += ""
  }
  catch {
    Write-Host "❌ Error al generar hash: $_" -ForegroundColor Red
  }
}

# Guardar archivo de hashes
$hashContent | Out-File -FilePath $hashFile -Encoding UTF8 -Force
Write-Host ""
Write-Host "💾 Hashes guardados en: $hashFile" -ForegroundColor Cyan

# Si es ZIP, crear archivo comprimido
if ($BuildType -eq "portable-zip") {
  $portable = $exeFiles | Where-Object { $_.Name -match "CoodetransGestion\.exe" } | Select-Object -First 1
  
  if ($portable) {
    $zipName = "CoodetransGestion-portable.zip"
    if ($Version) {
      $zipName = "CoodetransGestion-$Version-portable.zip"
    }
    
    Write-Host ""
    Write-Host "📦 Creando archivo ZIP..." -ForegroundColor Cyan
    Compress-Archive -Path $portable.FullName -DestinationPath "dist/$zipName" -Force
    
    $zipSize = [Math]::Round((Get-Item "dist/$zipName").Length / 1MB, 2)
    Write-Host "✅ ZIP creado: dist/$zipName ($zipSize MB)" -ForegroundColor Green
    
    # Agregar hash del ZIP
    $zipHash = (Get-FileHash -Path "dist/$zipName" -Algorithm SHA256).Hash
    "`n$zipName" | Out-File -FilePath $hashFile -Encoding UTF8 -Append
    "SHA256: $zipHash" | Out-File -FilePath $hashFile -Encoding UTF8 -Append
  }
}

Write-Host ""
Write-Host "✅ Build completado exitosamente" -ForegroundColor Green
Write-Host ""
