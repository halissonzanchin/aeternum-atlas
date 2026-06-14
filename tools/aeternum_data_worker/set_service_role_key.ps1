param(
  [string]$EnvPath = ".\.env"
)

function Get-JwtPayloadRole {
  param([string]$Token)

  if ($Token -notmatch '^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$') {
    return ""
  }

  try {
    $payload = $Token.Split('.')[1]
    $payload = $payload.Replace('-', '+').Replace('_', '/')
    switch ($payload.Length % 4) {
      2 { $payload += '==' }
      3 { $payload += '=' }
    }

    $json = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payload))
    $data = $json | ConvertFrom-Json
    return [string]$data.role
  } catch {
    return ""
  }
}

$resolvedEnvPath = Join-Path (Get-Location) $EnvPath

if (-not (Test-Path -LiteralPath $resolvedEnvPath)) {
  New-Item -ItemType File -Path $resolvedEnvPath -Force | Out-Null
}

$secureValue = Read-Host "Cole a SUPABASE_SERVICE_ROLE_KEY" -AsSecureString
$plainValue = [Runtime.InteropServices.Marshal]::PtrToStringBSTR(
  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureValue)
)

try {
  if ([string]::IsNullOrWhiteSpace($plainValue)) {
    throw "A chave esta vazia."
  }

  if ($plainValue -match '^sb_publishable_') {
    throw "Essa e uma publishable key. Copie uma Secret key ou a legacy service_role."
  }

  $jwtRole = Get-JwtPayloadRole -Token $plainValue
  if ($jwtRole -eq "anon") {
    throw "Essa e a legacy anon key. Copie a chave da linha service_role."
  }

  $lines = Get-Content -LiteralPath $resolvedEnvPath -ErrorAction SilentlyContinue
  $newLine = "SUPABASE_SERVICE_ROLE_KEY=$plainValue"

  if ($lines | Where-Object { $_ -match '^SUPABASE_SERVICE_ROLE_KEY=' }) {
    $lines = $lines | ForEach-Object {
      if ($_ -match '^SUPABASE_SERVICE_ROLE_KEY=') { $newLine } else { $_ }
    }
  } else {
    $lines = @($lines) + $newLine
  }

  Set-Content -LiteralPath $resolvedEnvPath -Value $lines -Encoding UTF8
  Write-Host "SUPABASE_SERVICE_ROLE_KEY salva em $resolvedEnvPath"
} finally {
  if ($plainValue) {
    $plainValue = $null
  }
}
