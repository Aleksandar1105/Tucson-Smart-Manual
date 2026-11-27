param([switch]$Offline)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$oldKey=$env:TUCSON_GEMINI_KEY
$oldConsent=$env:TUCSON_PILOT_CONSENT
$secure=$null
try {
    $env:TUCSON_GEMINI_KEY=$null
    $env:TUCSON_PILOT_CONSENT=$null
    if (!$Offline) {
        Write-Host 'Optional Gemini mode sends only reviewed questions and short facts. Free-tier data-use terms apply.'
        if ((Read-Host 'Type YES to enable Gemini, or press Enter for offline mode') -ceq 'YES') {
            $secure = Read-Host 'Gemini API key' -AsSecureString
            $env:TUCSON_GEMINI_KEY=[System.Net.NetworkCredential]::new('', $secure).Password
            if (!$env:TUCSON_GEMINI_KEY) { throw 'Missing API key.' }
            $env:TUCSON_PILOT_CONSENT='YES'
        }
    }
    Write-Host 'Open http://127.0.0.1:8790 in your browser after startup. Press Ctrl+C to stop.'
    node ai-preview-server.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Preview failed.' }
} finally {
    $env:TUCSON_GEMINI_KEY=$oldKey
    $env:TUCSON_PILOT_CONSENT=$oldConsent
    Remove-Variable secure,oldKey,oldConsent -ErrorAction SilentlyContinue
}
