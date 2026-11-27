$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$secure = Read-Host 'Gemini API key' -AsSecureString
$oldKey = $env:TUCSON_GEMINI_KEY
$oldToken = $env:TUCSON_GATEWAY_TOKEN
$proc = $null
try {
    $env:TUCSON_GEMINI_KEY = [System.Net.NetworkCredential]::new('', $secure).Password
    $env:TUCSON_GATEWAY_TOKEN = [Guid]::NewGuid().ToString('N') + [Guid]::NewGuid().ToString('N')
    $proc = Start-Process -FilePath (Get-Command node).Source -ArgumentList 'ai-gateway-local.mjs' -NoNewWindow -PassThru
    Start-Sleep -Seconds 2
    if ($proc.HasExited) { throw 'Gateway failed to start.' }
    $headers = @{ Authorization = "Bearer $env:TUCSON_GATEWAY_TOKEN" }
    $url = 'http://127.0.0.1:8787/ask'
    foreach ($q in @('What is the fuel tank capacity? Answer in Macedonian.', 'Which transmission does the demonstration vehicle have? Answer in Macedonian.')) {
        $body = @{question=$q} | ConvertTo-Json -Compress
        $response = Invoke-RestMethod -Method Post -Uri $url -Headers $headers -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($body)) -TimeoutSec 60
        $response | ConvertTo-Json -Depth 8
    }
} finally {
    if ($proc -and !$proc.HasExited) { Stop-Process -Id $proc.Id -ErrorAction SilentlyContinue }
    $env:TUCSON_GEMINI_KEY = $oldKey
    $env:TUCSON_GATEWAY_TOKEN = $oldToken
    Remove-Variable secure, headers, oldKey, oldToken -ErrorAction SilentlyContinue
}
