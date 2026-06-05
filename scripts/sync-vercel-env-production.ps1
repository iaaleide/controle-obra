$env:NODE_OPTIONS = "--use-system-ca"
$vercelJs = "C:\Users\atomi\AppData\Local\npm-cache\_npx\67eb4586ca667318\node_modules\vercel\dist\vc.js"
$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $projectRoot

$vars = @{}
Get-Content ".env" | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq "" -or $line.StartsWith("#")) { return }
  if ($line -match "^([^=]+)=(.*)$") {
    $name = $matches[1].Trim()
    $value = $matches[2].Trim()
    if ($value.StartsWith('"') -and $value.EndsWith('"')) { $value = $value.Substring(1, $value.Length - 2) }
    if ($value.StartsWith("'") -and $value.EndsWith("'")) { $value = $value.Substring(1, $value.Length - 2) }
    $vars[$name] = $value
  }
}

$vars["NEXT_PUBLIC_APP_URL"] = "https://controle-obra-khaki.vercel.app"

foreach ($name in $vars.Keys) {
  $value = $vars[$name]
  & node $vercelJs env add $name production --value $value --yes --force 2>&1 | Out-Null
  Write-Host "OK $name"
}

Write-Host "Done."
