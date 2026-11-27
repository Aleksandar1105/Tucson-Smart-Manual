# Tucson Smart Manual — Roadmap

## V2.2 Stable — 2026-11-27
- V2.1 baseline: a5222c5.
- V2.2: fc2fe66; 612 page images, separate code and text data, offline cache.
- Android QA: operator-reported 10/10 PASS on Samsung Galaxy S24 Ultra.
- Git push, fast-forward main and annotated tag v2.2-stable confirmed by operator log.
- GitHub Pages HTTPS is public; publishing branch remains feature/v2.2-optimization. Confirm rights to redistribute the manual; do not add credentials or personal data.

## V3.0 — feature/v3.0-ai-assistant
1. Local model feasibility: candidate Qwen3-1.7B-q4f16_1-MLC via WebLLM/WebGPU; Android hardware, Macedonian language, grounding and latency tests pending. If insufficient, evaluate Qwen3-4B or an authenticated server-side provider with a free quota and explicit cost/privacy limits.
2. Audit text corpus and implement page-aware retrieval and evidence ranking.
3. Add a provider-independent generation adapter and citation validation; refuse unsupported answers, preserve warnings and equipment qualifiers.
4. Integrate chat UI without changing the stable deployment; preserve offline manual browsing.
5. Test known-answer, unanswerable and safety-critical questions; validate page links, mobile performance and offline behavior.
6. Separate preview deployment and regression QA before stable promotion.

No API keys in source, browser bundles, or public Git history. Local model download and storage requirements must be disclosed; offline AI is not yet verified.

## V3.1 candidates
- Conversation context, voice input, vehicle profile, local conversation history.

## V3.0.1 feasibility test — 2026-11-27
- Qwen3-1.7B-q4f16_1-MLC: rejected after operator screenshots of three ungrounded Macedonian prompts. Repetitive and incorrect DCT explanation, confused adaptive cruise control with transmission clutches, inadequate uncertainty handling. Decode reported 64.8–83.0 tokens/s; actual test device not confirmed. No grounded retrieval test performed.
- Next candidate: Qwen3-4B, fresh chat for each question; evaluate Macedonian, factual accuracy, evidence adherence, and Android feasibility. If inadequate, evaluate Gemini with server-side key storage, authentication and free-tier limits. Stable deployment unchanged.

- Qwen3-4B-q4f16_1-MLC: FAIL (2026-11-27, desktop). Three fresh-chat screenshots show incorrect DCT explanation, cruise control confused with thermostat, and unverified equipment examples despite correct general conclusion. Decode 51.7–57.2 tokens/s. User confirms desktop testing and inadequate Macedonian. Both local candidates rejected for this release; Android performance and grounded QA not tested.
- Next: evaluate Gemini Flash in Google AI Studio, then grounded QA with manual excerpts. If accepted, use authenticated backend with server-side secret, quota enforcement and no billing activation without approval. Preserve V2.2 offline manual; cloud generation requires connectivity. Free-tier availability and data terms must be verified before integration.

- Gemini 4 Hydrogen (gemini-4-hydrogen): provisional PASS on three operator screenshots, 2026-11-27. Macedonian and general automotive concepts substantially improved; observed runtimes 11, 4 and 15 seconds. Third response used web search, so source-only grounding not established. Minor caveats: reverse gear clutch assignment varies; driver responsibility should be explicit for ACC. Official Gemini API pricing lists free standard input/output; account-specific quota and availability not yet confirmed. Free-tier data-use terms must be respected. Next gate: source-only grounded and unsupported-question QA, then page-aware retrieval and authenticated backend with server-side key, limits, no paid billing without approval. Preserve V2.2 and avoid sending personal vehicle identifiers. No API or deployment changes yet.

## V3.0.2A/B — source audit (2026-11-27)
- Operator Windows regression: 14/14 PASS; commit bb29184 pushed; working tree clean. Retrieval tests are not end-to-end AI validation.
- Existing Macedonian corpus has US-market indicators and incompatible transmission and tyre specifications; not authoritative for the target configuration.
- Candidate official NX4e 2026 digital manual: https://ownersmanual.hyundai.com/main?countryCode=C21&langCode=en_UK (listed; exact manual contents not yet verified).
- Candidate UK 2024-present PDF: https://dmassets.hyundai.com/is/content/hyundaiautoever/TUCSON_MY25pdf (listed by Hyundai UK; full PDF inspection pending).
- Local market equipment reference dated 2026-05-01: https://www.avtocajka.com.mk/wp-content/uploads/2024/10/tucson_my26_01_05_2026_MAJ.pdf (confirms Premium 1.6 T-GDI 180 HP 7DCT 2WD and 235/55R18 as listed configuration; options and actual vehicle fitment require verification).
- Next gate: obtain and inspect applicable NX4e 2026 manual, prefer local-market documentation; maintain source-specific citations and copyright restrictions. No new manual content or AI credentials published. Stable deployment unchanged.

## V3.0.2B — uploaded European-market candidate audit (2026-11-27)
- TUCSON_MY25pdf.pdf: 649 PDF pages, 640 with nonempty extracted text; copyright 2024; PDF metadata 2024-06-26. SHA-256: 9db5a8f17d5244194389e86232c34f7de48cdb242915a0b3622182c9162a49a2.
- Stronger fit than existing US-market corpus: G1.6 T-GDI engine (PDF 31 / printed 2-15), 235/55 R18 (33 / 2-17), G1.6 T-GDI 2WD DCT (35 / 2-19), lubricant tables (36–38 / 2-20–22), European importer (42 / 2-26), seven forward speeds in DCT section (307 / 6-33).
- Provisional source only: MY2026, specific engine power, exact equipment, clutch construction and regional service intervals not established. PDF 307 describes wet-type DCT; do not infer the user's specific clutch type. PDF 255 describes Auto dehumidify; no exact text hits for Scheduled Ventilation or After-Blow. Keep those queries unconfirmed. Tyre pressure label (PDF 40) and service documentation take precedence for vehicle-specific values.
- Next: obtain local equipment specification and exact MY2026 manual or dealer confirmation; implement source-aware bilingual retrieval using local import, separate source IDs and PDF/printed page numbers; fail closed for unsupported configurations. Do not upload PDF or extracted corpus to public GitHub without permission; the manual contains a reproduction/retrieval restriction (PDF 8). No change to deployed V2.2 or API configuration.

## V3.0.2C / V3.0.3A — 2026-11-27
- Operator log: 37/37 regression PASS, commit ae4a981 pushed, working tree clean. Both new corpus JSON paths are ignored locally via .git/info/exclude; do not force-add them. Topic routing remains curated, not general semantic retrieval. Generation disabled.
- Gemini 4 Hydrogen: official developer API pricing lists free standard input/output (https://ai.google.dev/gemini-api/docs/pricing). Account model availability, quota and terms still require confirmation. No billing activation. Free-tier content may be used to improve Google products; no VIN, private data or full manuals in API requests.
- Next gate: operator runs a local REST smoke test with a synthetic evidence record and an unsupported question; API key entered in masked prompt, not saved in repository or shared in chat. No remote worker or deployment configured yet. Later: authenticated proxy, explicit request limits, source-only prompt, citation validation, local import on Android, safety QA. V2.2 deployment remains unchanged.

## V3.0.3B7 — pilot evaluation
- Operator: e44e912 82/82 regression, Flash-Lite 5/6 live structural PASS, no transport failure in this run. Camera false refusal; DCT reverse omitted. Flash-Lite preferred preview candidate; Hydrogen comparison candidate only. Scoped prompt patch local regression 84/84; targeted live review pending.
- Next: local chat preview with explicit source citations, verified factual responses and unavailable-state handling. Expand beyond four fixed cases before production; require rights review, authenticated HTTPS, cost/quota controls, mobile QA. Do not modify V2.2 deployment.
