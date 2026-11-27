$ErrorActionPreference = 'Stop'
$oldModel = $env:TUCSON_PILOT_MODEL
try {
    $env:TUCSON_PILOT_MODEL = 'gemini-3.5-flash-lite'
    Write-Host "Testing alternate model: $env:TUCSON_PILOT_MODEL"
    Write-Host 'No automatic model fallback. All six original cases will run.'
    & (Join-Path $PSScriptRoot 'test-rag-gateway.ps1')
} finally {
    $env:TUCSON_PILOT_MODEL = $oldModel
}
