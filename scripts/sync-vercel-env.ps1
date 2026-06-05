$ErrorActionPreference = "Continue"
$env:NODE_OPTIONS = "--use-system-ca"

$vercelJs = "C:\Users\atomi\AppData\Local\npm-cache\_npx\67eb4586ca667318\node_modules\vercel\dist\vc.js"
$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $projectRoot

function Add-VercelEnv {
  param(
    [string]$Name,
    [string]$Value,
    [string]$Environment
  )

  $output = & node $vercelJs env add $Name $Environment --value $Value --yes --force 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Host "FAIL $Name -> $Environment"
    Write-Host $output
  } else {
    Write-Host "OK $Name -> $Environment"
  }
}

Get-Content ".env" | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq "" -or $line.StartsWith("#")) { return }

  if ($line -match "^([^=]+)=(.*)$") {
    $name = $matches[1].Trim()
    $value = $matches[2].Trim()

    if ($value.StartsWith('"') -and $value.EndsWith('"')) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    if ($value.StartsWith("'") -and $value.EndsWith("'")) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    foreach ($envName in @("production", "preview", "development")) {
      Add-VercelEnv -Name $name -Value $value -Environment $envName
    }
  }
}

Write-Host "Done."
