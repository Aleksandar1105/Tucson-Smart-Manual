param([switch]$RetestFailed)
$ErrorActionPreference = 'Stop'
$oldModel = $env:TUCSON_PILOT_MODEL
try {
    $env:TUCSON_PILOT_MODEL = 'gemini-3.5-flash-lite'
    Write-Host "Testing alternate model: $env:TUCSON_PILOT_MODEL"
    if ($RetestFailed) { Write-Host 'No fallback. Targeted tests 2 and 3.' } else { Write-Host 'No fallback. All six cases.' }
    & (Join-Path $PSScriptRoot 'test-rag-gateway.ps1') -RetestFailed:$RetestFailed
} finally {
    $env:TUCSON_PILOT_MODEL = $oldModel
}
