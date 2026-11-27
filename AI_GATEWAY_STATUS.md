# V3.0.3B — local synthetic-only Gemini gateway

- V3.0.3A operator API smoke test: model availability and API connection PASS; correct 54 L and insufficient transmission information; 992 total tokens (130 prompt, 80 candidate, 782 thought).
- V3.0.3B: 11/11 local automated tests passed (Node 22.16.0, mocked upstream). No real Gemini request executed by the developer environment.
- HTTP endpoint binds exclusively to 127.0.0.1:8787, requires temporary bearer token, rejects browser Origin, limits body and question size, and limits requests to 10/minute per process with one concurrent request. Not suitable as an internet-facing gateway. API key provided via temporary environment variable, not stored in Git.
- Synthetic fixture only; client cannot supply evidence. Structured responses with source-ID validation; invalid or incomplete generation rejected. Citation validation is structural, not proof of factual accuracy. Model may still hallucinate. No real manual content sent or stored by this module.
- Pending: real gateway smoke test, authenticated HTTPS deployment design, privacy/rights and quota review, real evidence integration and safety evaluation, Android QA. Existing PWA and stable branches unchanged.
