$ErrorActionPreference = "Stop"
$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $projectRoot

$skip = @("VERCEL_OIDC_TOKEN")
$vars = @{}

Get-Content ".env" | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq "" -or $line.StartsWith("#")) { return }
  if ($line -match "^([^=]+)=(.*)$") {
    $name = $matches[1].Trim()
    $value = $matches[2].Trim()
    if ($value.StartsWith('"') -and $value.EndsWith('"')) { $value = $value.Substring(1, $value.Length - 2) }
    if ($skip -contains $name) { return }
    $vars[$name] = $value
  }
}

$vars["NEXT_PUBLIC_APP_URL"] = "https://controle-obra-khaki.vercel.app"

foreach ($envName in @("production", "preview", "development")) {
  foreach ($name in $vars.Keys) {
    npx vercel env add $name $envName --value $vars[$name] --force --yes 2>&1 | Out-Null
    Write-Host "OK $name -> $envName"
  }
}

Write-Host "Done."
