$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
Write-Host 'Local UI preview; only reviewed canonical questions and short facts sent to Gemini. Free-tier data-use terms apply.'
if ((Read-Host 'Type YES to consent') -cne 'YES') { return }
$secure = Read-Host 'Gemini API key' -AsSecureString
$oldKey=$env:TUCSON_GEMINI_KEY
$oldConsent=$env:TUCSON_PILOT_CONSENT
try {
    $env:TUCSON_GEMINI_KEY=[System.Net.NetworkCredential]::new('', $secure).Password
    $env:TUCSON_PILOT_CONSENT='YES'
    Write-Host 'Open http://127.0.0.1:8790 in your browser after startup. Press Ctrl+C to stop.'
    node ai-preview-server.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Preview failed.' }
} finally {
    $env:TUCSON_GEMINI_KEY=$oldKey
    $env:TUCSON_PILOT_CONSENT=$oldConsent
    Remove-Variable secure,oldKey,oldConsent -ErrorAction SilentlyContinue
}
