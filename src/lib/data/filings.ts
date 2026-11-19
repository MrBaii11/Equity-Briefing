import type { FilingSnippet } from "../types";
import { getSeed } from "./seeds";

type SecTickerRow = {
  cik_str: number;
  ticker: string;
  title: string;
};

let tickerMap: Record<string, { cik: string; title: string }> | null = null;

async function loadSecTickers() {
  if (tickerMap) return tickerMap;
  try {
    const res = await fetch("https://www.sec.gov/files/company_tickers.json", {
      headers: {
        "User-Agent": "equity-briefing research tool contact@example.com",
        Accept: "application/json",
      },
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error("sec tickers");
    const data = (await res.json()) as Record<string, SecTickerRow>;
    tickerMap = {};
    for (const row of Object.values(data)) {
      tickerMap[row.ticker.toUpperCase()] = {
        cik: String(row.cik_str).padStart(10, "0"),
        title: row.title,
      };
    }
    return tickerMap;
  } catch {
    tickerMap = {};
    return tickerMap;
  }
}

export async function resolveCik(ticker: string): Promise<string | undefined> {
  const seed = getSeed(ticker);
  if (seed?.identity.cik) return seed.identity.cik.padStart(10, "0");
  const map = await loadSecTickers();
  return map[ticker.toUpperCase()]?.cik;
}

export async function fetchFilings(
  ticker: string,
  companyName: string,
): Promise<FilingSnippet[]> {
  const seed = getSeed(ticker);
  const cik = await resolveCik(ticker);
  const edgarBrowse = cik
    ? `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=10-K&dateb=&owner=include&count=10`
    : undefined;

  // Full 10-K HTML parsing is heavy for MVP; use seed qualitative text when present,
  // otherwise synthesize filing placeholders pointing at EDGAR with honest provenance.
  if (seed?.filings?.length) {
    return seed.filings.map((f) => ({
      ...f,
      url: f.url || edgarBrowse,
    }));
  }

  const snippets: FilingSnippet[] = [
    {
      id: `${ticker}-filing-biz`,
      form: "10-K",
      filedAt: new Date().toISOString().slice(0, 10),
      section: "Business (summary placeholder)",
      text: `${companyName} is a U.S.-listed issuer. Qualitative culture and strategy details should be read from the latest Form 10-K Business and MD&A sections on EDGAR. This MVP links EDGAR when CIK is known and prefers extracted excerpts for covered demo names.`,
      url: edgarBrowse,
    },
    {
      id: `${ticker}-filing-risk`,
      form: "10-K",
      filedAt: new Date().toISOString().slice(0, 10),
      section: "Risk Factors (summary placeholder)",
      text: `Key disclosed risks typically include competition, macroeconomic sensitivity, regulatory change, and execution risk. Open the linked EDGAR filings for ${ticker} to verify issuer-specific language before relying on qualitative claims.`,
      url: edgarBrowse,
    },
  ];

  return snippets;
}
