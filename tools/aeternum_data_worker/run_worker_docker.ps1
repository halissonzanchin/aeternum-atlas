param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$WorkerArgs
)

function Export-DockerTrustedRoot {
  param(
    [string]$Workspace
  )

  $cert = Get-ChildItem Cert:\CurrentUser\Root, Cert:\LocalMachine\Root -ErrorAction SilentlyContinue |
    Where-Object { $_.Subject -like "*Norton Web/Mail Shield Root*" } |
    Select-Object -First 1

  if (-not $cert) {
    return ""
  }

  $certDir = Join-Path $Workspace ".certs"
  New-Item -ItemType Directory -Path $certDir -Force | Out-Null

  $certPath = Join-Path $certDir "norton-web-mail-shield-root.crt"
  $base64 = [Convert]::ToBase64String($cert.RawData)
  $lines = @("-----BEGIN CERTIFICATE-----")
  for ($i = 0; $i -lt $base64.Length; $i += 64) {
    $length = [Math]::Min(64, $base64.Length - $i)
    $lines += $base64.Substring($i, $length)
  }
  $lines += "-----END CERTIFICATE-----"
  Set-Content -LiteralPath $certPath -Value $lines -Encoding ASCII

  return $certPath
}

$workspace = (Get-Location).Path
$envPath = Join-Path $workspace ".env"

if (-not (Test-Path -LiteralPath $envPath)) {
  throw ".env nao encontrado em $envPath"
}

$hasServiceRoleKey = Get-Content -LiteralPath $envPath |
  Where-Object { $_ -match '^SUPABASE_SERVICE_ROLE_KEY=.+' } |
  Select-Object -First 1

if (-not $hasServiceRoleKey) {
  throw "SUPABASE_SERVICE_ROLE_KEY ausente no .env. Rode tools\aeternum_data_worker\set_service_role_key.ps1 primeiro."
}

if (-not $WorkerArgs -or $WorkerArgs.Count -eq 0) {
  $WorkerArgs = @("doctor", "--check-sketchfab", "--save-report")
}

$escapedArgs = ($WorkerArgs | ForEach-Object {
  "'" + ($_ -replace "'", "'`"`"'" ) + "'"
}) -join " "

$workerCommand = "apt-get update >/dev/null && apt-get install -y ca-certificates >/dev/null && update-ca-certificates >/dev/null && python tools/aeternum_data_worker/aeternum_worker.py $escapedArgs"
$certPath = Export-DockerTrustedRoot -Workspace $workspace

$dockerArgs = @(
  "run",
  "--rm",
  "--env-file", $envPath,
  "-v", "$workspace`:/workspace",
  "-w", "/workspace"
)

if ($certPath) {
  $dockerArgs += @("-v", "$certPath`:/usr/local/share/ca-certificates/aeternum-local/norton-web-mail-shield-root.crt:ro")
}

$dockerArgs += @(
  "python:3.12-slim",
  "sh",
  "-lc",
  $workerCommand
)

docker @dockerArgs
