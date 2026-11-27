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
