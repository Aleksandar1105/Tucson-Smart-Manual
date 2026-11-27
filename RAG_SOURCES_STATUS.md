# V3.0.2C — source-aware retrieval pilot

- EU-MY25: 649 pages; MK-MY26 dealer specification: 2 pages. Local corpus only; do not commit `.tucson-local/` or PDFs.
- Target listed variant: MY26 Premium G1.6 T-GDI 132.4 kW / 180 hp, 7DCT, 2WD. Actual vehicle equipment, optional packages and model-year applicability of MY25 manual remain unverified.
- Curated bilingual topic routing with PDF-page and source IDs, original page text, and fitment qualifiers. This is not full semantic search; unsupported and multiple-topic queries return no evidence. No AI generation or API requests.
- Manual tables require visual verification against the original PDF; no automatic table interpretation or vehicle-specific service instructions.
- Source metadata records original PDF SHA-256 for provenance; not a cryptographic integrity check of the extracted text.
- Local Node regression: 23/23 PASS on actual local extracted source data. Windows and integration QA pending.
- Preserve existing V2.2 and RAG 2A; no deployment changes. Next: broaden retrieval coverage, source-grounded Gemini QA and secure backend.
