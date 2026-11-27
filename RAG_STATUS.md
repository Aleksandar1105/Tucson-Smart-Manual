# V3.0.2A — Retrieval prototype (development only)

- Run `node --test tests/rag.test.mjs` with Node.js 22 and the existing V2.2 manual-data.js and pages directory.
- Pure local page-level lexical retrieval (BM25-style scoring plus phrase aliases), retaining full source page text and physical PDF page ID. Printed page label is optional and must be independently checked. No generative API, UI changes, or new service worker.
- Tested against the existing V2.2 ZIP corpus: 612 page records; 563 candidate text pages indexed; PDF pages 600–601 have under 100 characters. Other pages were excluded by front matter, table-of-contents, or index filtering. Images remain in the original app.
- Source mismatch: PDF 7 identifies Hyundai Motor America; PDF 263 describes an eight-speed automatic. PDF 586 lists 235/60 R18. This is not verified as the European 1.6 T-GDI / 7DCT manual. All generation remains disabled (`generationAllowed: false`); regex-based unsupported/fitment filters are preliminary only, not a safety guarantee. Do not use retrieved specs for this car without source verification.
- Local tests: 14/14 PASS on Node 22.16.0, including retrieval top-five recall for five hand-selected queries, exact text and image links, unsupported questions, and malformed corpus. Not a comprehensive accuracy or mobile QA assessment.
- Next: obtain official market/engine/transmission-compatible manual, verify page mapping and rebuild corpus; test source-only Gemini answers without web search. Check copyright and API terms before publication or sending text to a provider.
