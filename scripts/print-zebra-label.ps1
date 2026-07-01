param(
  [string]$TipoEquipo,
  [string]$Serial,
  [string]$AssetTag,
  [string]$PrinterIP = '10.132.4.51',
  [string]$SaveDir = '',
  [switch]$OpenApp
)

$ErrorActionPreference = 'Stop'

function ZplEscape($t) {
  $s = [regex]::Replace([string]$t, '[\^~\\]', '')
  return $s.Substring(0, [Math]::Min(80, $s.Length))
}

function GenerateZpl($item) {
  $type   = ZplEscape($item.TipoEquipo).ToUpper()
  $serial = ZplEscape($item.Serial)
  $asset  = ZplEscape($item.AssetTag)

  return @"
^XA
^PW408
^LL200
^MTT
^MNN
^PR3
^MD15
^CI28
^LH5,2
^FO5,3^A0N,16,20^FB260,1,,L^FDHUTCHISONPORTS TIMSA^FS
^FO260,3^A0N,16,20^FB138,1,,R^FDID: $asset^FS
^FO5,30^A0N,28,32^FB398,1,,C^FD$type^FS
^FO30,68^BY2,2,55^BCN,55,N,N,N^FD$asset^FS
^FO5,135^A0N,18,22^FB398,1,,C^FD$serial^FS
^FO5,170^A0N,14,18^FB398,1,,C^FDPropiedad de TIMSA^FS
^XZ
"@
}

function SendZpl($zpl, $ip) {
  $tcp = New-Object System.Net.Sockets.TcpClient
  try {
    $tcp.Connect($ip, 9100)
    $tcp.SendTimeout = 8000
    $stream = $tcp.GetStream()
    $bytes  = [System.Text.Encoding]::UTF8.GetBytes($zpl)
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Flush()
  } catch {
    throw "No se pudo conectar con la impresora en ${ip}:9100. Verifique la IP y que la impresora este encendida."
  } finally {
    $tcp.Close()
  }
}

function Get-ZebraSetupUtilitiesPath {
  $paths = @(
    "${env:ProgramFiles}\Zebra Technologies\Zebra Setup Utilities\ZebraSetupUtilities.exe",
    "${env:ProgramFiles(x86)}\Zebra Technologies\Zebra Setup Utilities\ZebraSetupUtilities.exe"
  )
  foreach ($p in $paths) {
    if (Test-Path $p) { return $p }
  }
  return $null
}

function Install-ZebraSetupUtilities {
  $installer = "$env:TEMP\ZebraSetupUtilities.exe"
  $url = "https://www.zebra.com/us/en/support-downloads/software/printer-software/zebra-setup-utility.html"
  $directUrl = "https://www.zebra.com/content/dam/zebra/software/zw/Zebra_Setup_Utilities_V2024.2.2.0.exe"

  try {
    Invoke-WebRequest -Uri $directUrl -OutFile $installer -UseBasicParsing -ErrorAction Stop
  } catch {
    Write-Output "Descarga directa fallida, abriendo pagina oficial..."
    Start-Process $url
    throw "Descargue el instalador desde $url, coloquelo en $installer y vuelva a ejecutar el script."
  }

  $proc = Start-Process -FilePath $installer -ArgumentList "/S" -Wait -PassThru -NoNewWindow
  if ($proc.ExitCode -ne 0) {
    throw "El instalador fallo con codigo $($proc.ExitCode)."
  }
}

# --- MAIN ---
$zebraPath = Get-ZebraSetupUtilitiesPath
if (-not $zebraPath) {
  Write-Output "Instalando Zebra Setup Utilities..."
  Install-ZebraSetupUtilities
  $zebraPath = Get-ZebraSetupUtilitiesPath
}

if ($OpenApp -and $zebraPath) {
  Start-Process $zebraPath
}

if ([string]::IsNullOrWhiteSpace($AssetTag)) { $AssetTag = $Serial }

$item = @{
  TipoEquipo = $TipoEquipo
  Serial     = $Serial
  AssetTag   = $AssetTag
}

$zpl = GenerateZpl $item
SendZpl $zpl $PrinterIP

if ($SaveDir) {
  $filename = Join-Path $SaveDir "etiqueta-$AssetTag.zpl"
  Set-Content -Path $filename -Value $zpl -Encoding UTF8
}
