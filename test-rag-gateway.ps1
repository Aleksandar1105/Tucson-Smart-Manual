$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
Write-Host 'This pilot sends four fixed questions and short paraphrased vehicle facts to Gemini. No full PDF, VIN, or personal data. Free-tier requests may be used to improve Google products.'
if ((Read-Host 'Type YES to consent') -cne 'YES') { Write-Host 'Cancelled; no API request.'; return }
$secure = Read-Host 'Gemini API key' -AsSecureString
$oldKey = $env:TUCSON_GEMINI_KEY
$oldToken = $env:TUCSON_GATEWAY_TOKEN
$oldConsent = $env:TUCSON_PILOT_CONSENT
$proc = $null
try {
    $env:TUCSON_GEMINI_KEY = [System.Net.NetworkCredential]::new('', $secure).Password
    $env:TUCSON_GATEWAY_TOKEN = [Guid]::NewGuid().ToString('N') + [Guid]::NewGuid().ToString('N')
    $env:TUCSON_PILOT_CONSENT = 'YES'
    $proc = Start-Process -FilePath (Get-Command node).Source -ArgumentList 'ai-gateway-rag-local.mjs' -NoNewWindow -PassThru
    Start-Sleep -Seconds 2
    if ($proc.HasExited) { throw 'Gateway failed to start.' }
    $headers = @{ Authorization = "Bearer $env:TUCSON_GATEWAY_TOKEN" }
    $tests = @(
        @{q='Колкав е капацитетот на резервоарот?'; pattern='\b54\b'; source='MK-MY26:PDF-2'},
        @{q='Колку степени има 7DCT менувачот?'; pattern='7|седум'; source='EU-MY25:PDF-307'},
        @{q='Дали Premium има камера 360?'; pattern='Impression|Импреш'; source='MK-MY26:PDF-2'},
        @{q='Со колку вати е безжичното полнење?'; pattern='\b15\b'; source='MK-MY26:PDF-2'},
        @{q='After-Blow'; local=$true},
        @{q='Кој е главниот град на Марс?'; local=$true}
    )
    $i=0
    foreach ($t in $tests) {
        $i++
        Write-Host "Test $i"
        $body = @{question=$t.q} | ConvertTo-Json -Compress
        try {
            $r=Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8788/ask' -Headers $headers -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($body)) -TimeoutSec 60
        } catch { if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }; throw }
        $r | ConvertTo-Json -Depth 8
        if ($t.local) {
            if ($r.answer.status -ne 'insufficient' -or !$r.localOnly -or $r.usage -ne 0 -or @($r.answer.claims).Count -ne 0) { throw "FAIL: test $i expected local refusal" }
        } else {
            $refs=@($r.answer.claims | ForEach-Object { $_.sources })
            if ($r.answer.status -ne 'answered' -or $r.localOnly -ne $false -or ($r.answer.claims.text -join ' ') -notmatch $t.pattern -or $refs -notcontains $t.source) { throw "FAIL: test $i expected supported answer" }
        }
        Write-Host "Test ${i}: PASS"
    }
    Write-Host 'RAG gateway pilot: 6/6 structural PASS; manual answer review pending.'
} finally {
    if ($proc -and !$proc.HasExited) { Stop-Process -Id $proc.Id -ErrorAction SilentlyContinue }
    $env:TUCSON_GEMINI_KEY = $oldKey
    $env:TUCSON_GATEWAY_TOKEN = $oldToken
    $env:TUCSON_PILOT_CONSENT = $oldConsent
    Remove-Variable secure, headers, oldKey, oldToken, oldConsent -ErrorAction SilentlyContinue
}
