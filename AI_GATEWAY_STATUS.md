# V3.0.3B — local synthetic-only Gemini gateway

- V3.0.3A operator API smoke test: model availability and API connection PASS; correct 54 L and insufficient transmission information; 992 total tokens (130 prompt, 80 candidate, 782 thought).
- V3.0.3B: 11/11 local automated tests passed (Node 22.16.0, mocked upstream). No real Gemini request executed by the developer environment.
- HTTP endpoint binds exclusively to 127.0.0.1:8787, requires temporary bearer token, rejects browser Origin, limits body and question size, and limits requests to 10/minute per process with one concurrent request. Not suitable as an internet-facing gateway. API key provided via temporary environment variable, not stored in Git.
- Synthetic fixture only; client cannot supply evidence. Structured responses with source-ID validation; invalid or incomplete generation rejected. Citation validation is structural, not proof of factual accuracy. Model may still hallucinate. No real manual content sent or stored by this module.
- Pending: real gateway smoke test, authenticated HTTPS deployment design, privacy/rights and quota review, real evidence integration and safety evaluation, Android QA. Existing PWA and stable branches unchanged.

## V3.0.3B1 — diagnostic patch
- Operator regression: 48/48 PASS, commit 16db56b. Real gateway first request: HTTP 502; actual upstream reason unknown.
- Preserve request parameters to reproduce failure. Return/log only allowlisted diagnostic categories (HTTP status, network class, finish reason, JSON/citation validation). No provider response body, secrets or stack traces logged. Added eight mocked HTTP diagnostic tests and live test outcome assertions.
- Local regression after restoring complete V2.2 test assets: 56/56 PASS. Real API test pending; no root-cause fix claimed. No deployment changes.

## V3.0.3B2 — controlled source-aware pilot
- Operator regression for e557c17: 56/56 PASS; live synthetic gateway 2/2 PASS. Initial 502 not reproduced; root cause unknown, no fix claimed.
- Added local-only pilot on 127.0.0.1:8788, explicitly enabled by consent, using exact four fixed Macedonian questions. Reads both locally excluded corpus files, verifies their SHA-256, checks existing topic routing and source anchors, then sends short manually reviewed factual paraphrases and source IDs only. No full page text, arbitrary question text, VIN or personal identifiers sent. Other questions rejected locally; no generation request. Existing synthetic gateway remains unchanged in default behavior.
- Local Node 22.16.0 regression: 68/68 PASS (56 existing + 12 new). Mock tests cover source matching, refusal, missing anchor, mutation isolation, evidence validation, HTTP no-call behavior, injection rejection, and unknown citation rejection.
- Live test requires affirmative consent and masked API key; checks 4 supported replies and 2 local refusals. PowerShell not executed in developer environment. Structural QA does not validate all factual claims; manual review pending. Free-tier processing terms/permission remain applicable. Do not publish new source data. No public gateway or PWA deployment change.
- Next: live pilot review; decide on private HTTPS deployment and permitted source import for Android; only then expand retrieval and UI. No paid services activated by this patch.

## V3.0.3B3 — bounded upstream 503 retries
- Operator regression: 68/68 PASS, commit 7e83f02; first live source-aware answer correct (54 L, MK-MY26:PDF-2, 804 tokens). Second request returned upstream_503; remaining tests not run.
- Retry explicit upstream HTTP 503 only: at most two retries (2 s, 4 s), respect Retry-After up to 10 s, stop if longer; shared 45 s abort deadline. No retry on quota (429), client errors, network failures, or rejected citations. Retries may count toward provider quota.
- Eight new mocked tests; live verification pending. Local consent and provenance constraints unchanged. No deployment changes.
