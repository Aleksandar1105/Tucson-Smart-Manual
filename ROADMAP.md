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
