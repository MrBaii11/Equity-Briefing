# Equity Briefing

Evidence-based research briefs for U.S.-listed companies — now with a **V1 filing Agent**: upload a PDF/TXT 10-K-style document and get a streaming **PPT-like deck** (tables, charts, risks, evidence chips). Ticker mode remains for live Yahoo + EDGAR research briefs.

> Research tool only. Not investment advice.

## Stack

- Next.js 16 (App Router) + React 19 + Tailwind CSS 4
- **Upload Agent (v1):** `unpdf` text extraction → deterministic extract/validate → deck assembly → NDJSON stream
- Data (ticker mode): Yahoo Finance quote/search endpoints, SEC EDGAR ticker map + filing links
- Analysis: deterministic multi-agent pipeline (Collector → Quant → Qual/News → Moat → Valuation → Risk → Editor)
- Cache: filesystem `.cache/` with 24h TTL for company bundles and briefings
- Streaming: NDJSON report APIs for progressive UI

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Upload filing** (default): drop a text-layer PDF/TXT, or click **Try sample 10-K excerpt**
- **Ticker research**: try `ORCL`, `AAPL`, or `CAT`

Optional env vars: copy `.env.example` to `.env.local` (live Yahoo/EDGAR work without keys).

## Product modules

### Upload Agent deck (v1)

1. Cover — company / form / period / parse confidence
2. Executive summary — highlights + risk excerpts
3. Financial snapshot — multi-period table
4. Trends — revenue / earnings / FCF / margin charts
5. Earnings quality — cash conversion flags
6. Segments & KPIs
7. Risk focus
8. Narrative vs numbers (MD&A ↔ figures)
9. Appendix — evidence index

Every claim binds to evidence chips (page hints from the uploaded file).

### Ticker briefing (existing)

1. Company profile · 2. Quantitative checkup · 3. News · 4. Moat · 5–6. Outlook & valuation · 7. Risk · 8. Conditional advice

## API

- `GET /api/search?q=oracle` — ticker/name search
- `POST /api/report` — body `{ "query": "ORCL", "bypassCache": false }` streams NDJSON `StreamEvent`s
- `POST /api/analyze-filing` — `multipart/form-data` with `file` (PDF/TXT), optional `ticker` / `companyName`, or `sample=1` for the built-in excerpt; streams NDJSON `FilingStreamEvent`s

## Architecture notes

- LLMs never invent metrics: numbers come from the extractor into structured evidence; slides only render extracted fields.
- Soft validation demotes confidence when gross profit > revenue or FCF fails reconciliation.
- Scanned/image-only PDFs: text layer may be empty — use a text PDF or the sample until OCR (v2).
- Seed enrichment for ORCL / AAPL / CAT keeps qualitative depth when live APIs rate-limit (ticker mode).
- Cache keys are versioned (`v3_`) so schema upgrades invalidate old snapshots.

## Docs

- Product spec: [docs/PRODUCT.md](docs/PRODUCT.md)

## Disclaimer

Verify all figures against primary SEC filings and your own models before making decisions.
