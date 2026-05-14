param(
  [string]$OutputDir = "backups"
)

if (-not $env:DATABASE_URL) {
  throw "DATABASE_URL no esta definido."
}

$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDump) {
  throw "pg_dump no esta instalado o no esta en PATH."
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$file = Join-Path $OutputDir "sati-timsa-$stamp.dump"

& $pgDump.Source --format=custom --no-owner --no-acl --file=$file $env:DATABASE_URL
if ($LASTEXITCODE -ne 0) {
  throw "pg_dump fallo con codigo $LASTEXITCODE."
}

Write-Output "Backup creado: $file"
