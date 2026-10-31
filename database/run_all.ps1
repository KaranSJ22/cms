<#
.SYNOPSIS
    ISRO CMS — Database Deployment Script for Windows PowerShell
.DESCRIPTION
    Executes all 53 SQL files (Schemas -> Stored Procedures -> Events -> Seed Data)
    in strict dependency order. Can use Node.js or native MySQL CLI client.
.EXAMPLE
    .\run_all.ps1
.EXAMPLE
    .\run_all.ps1 -Host "localhost" -User "root" -Database "CMS_DB"
.EXAMPLE
    .\run_all.ps1 -SkipSeed
#>

[CmdletBinding()]
param(
    [string]$DbHost = "127.0.0.1",
    [int]$DbPort = 3306,
    [string]$DbUser = "root",
    [string]$DbPassword = "",
    [string]$DbName = "CMS_DB",
    [switch]$SkipSeed,
    [switch]$SchemasOnly,
    [switch]$ProcsOnly,
    [switch]$DropOnly,
    [switch]$NoDrop,
    [switch]$UseMysqlCli
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$backendDir = Join-Path (Split-Path -Parent $scriptDir) "backend"
$runnerJs = Join-Path $backendDir "scripts\run-all-sql.js"
$targetSql = if ($DropOnly) { Join-Path $scriptDir "DROP_ALL.sql" } else { Join-Path $scriptDir "RUN_ALL.sql" }

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host " ISRO CMS — Database SQL Runner                          " -ForegroundColor Cyan
Write-Host "=========================================================`n" -ForegroundColor Cyan

# Strategy 1: If Node.js is present and not explicitly forcing mysql CLI, run via Node.js
$nodeCmd = Get-Command "node" -ErrorAction SilentlyContinue

if ($nodeCmd -and (-not $UseMysqlCli) -and (Test-Path $runnerJs)) {
    Write-Host "[Runner] Using Node.js database executor: $runnerJs" -ForegroundColor Green
    $nodeArgs = @($runnerJs)
    if ($DbHost) { $nodeArgs += "--host=$DbHost" }
    if ($DbPort) { $nodeArgs += "--port=$DbPort" }
    if ($DbUser) { $nodeArgs += "--user=$DbUser" }
    if ($DbPassword) { $nodeArgs += "--password=$DbPassword" }
    if ($DbName) { $nodeArgs += "--database=$DbName" }
    if ($SkipSeed) { $nodeArgs += "--skip-seed" }
    if ($SchemasOnly) { $nodeArgs += "--schemas-only" }
    if ($ProcsOnly) { $nodeArgs += "--procs-only" }
    if ($DropOnly) { $nodeArgs += "--drop-only" }
    if ($NoDrop) { $nodeArgs += "--no-drop" }

    & node $nodeArgs
    exit $LASTEXITCODE
}

# Strategy 2: Native MySQL CLI client
$mysqlCmd = Get-Command "mysql" -ErrorAction SilentlyContinue

if ($mysqlCmd) {
    Write-Host "[Runner] Using MySQL CLI client with $targetSql" -ForegroundColor Green
    Write-Host "Target Database: $DbName on $DbHost`:$DbPort" -ForegroundColor Yellow

    $cmdArgs = @(
        "-h", $DbHost,
        "-P", $DbPort,
        "-u", $DbUser
    )
    if ($DbPassword) {
        $cmdArgs += "-p$DbPassword"
    }
    $cmdArgs += $DbName

    Push-Location $scriptDir
    try {
        Get-Content $targetSql | & mysql $cmdArgs
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n[SUCCESS] All SQL files executed successfully via MySQL CLI." -ForegroundColor Green
        } else {
            Write-Host "`n[ERROR] MySQL CLI exited with code $LASTEXITCODE." -ForegroundColor Red
        }
    } finally {
        Pop-Location
    }
    exit $LASTEXITCODE
}

Write-Host "[ERROR] Neither 'node' nor 'mysql' executable was found on PATH." -ForegroundColor Red
Write-Host "Please install Node.js (and run 'npm run db:init' from backend) or add mysql.exe to PATH." -ForegroundColor Yellow
exit 1
