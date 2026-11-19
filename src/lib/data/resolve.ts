import type { CompanyIdentity, SearchResult } from "../types";
import { DEMO_TICKERS, getSeed } from "./seeds";

const YAHOO_SEARCH =
  "https://query1.finance.yahoo.com/v1/finance/search";

export async function searchCompanies(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return DEMO_TICKERS;

  const local = DEMO_TICKERS.filter(
    (t) =>
      t.ticker.toLowerCase().includes(q.toLowerCase()) ||
      t.name.toLowerCase().includes(q.toLowerCase()),
  );

  try {
    const url = `${YAHOO_SEARCH}?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`;
    const res = await fetch(url, {
      headers: { "User-Agent": "equity-briefing/0.1" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`search ${res.status}`);
    const data = (await res.json()) as {
      quotes?: {
        symbol?: string;
        shortname?: string;
        longname?: string;
        exchange?: string;
        quoteType?: string;
      }[];
    };
    const remote: SearchResult[] = (data.quotes ?? [])
      .filter((x) => x.symbol && (x.quoteType === "EQUITY" || !x.quoteType))
      .map((x) => ({
        ticker: x.symbol!.toUpperCase(),
        name: x.longname || x.shortname || x.symbol!,
        exchange: x.exchange || "US",
      }));

    const merged = [...local, ...remote];
    const seen = new Set<string>();
    return merged.filter((r) => {
      if (seen.has(r.ticker)) return false;
      seen.add(r.ticker);
      return true;
    }).slice(0, 10);
  } catch {
    return local.length ? local : DEMO_TICKERS.slice(0, 5);
  }
}

export async function resolveCompany(tickerOrName: string): Promise<CompanyIdentity> {
  const raw = tickerOrName.trim();
  const asTicker = raw.toUpperCase().replace(/[^A-Z0-9.-]/g, "");
  const seed = getSeed(asTicker);
  if (seed) return { ...seed.identity };

  const results = await searchCompanies(raw);
  const match =
    results.find((r) => r.ticker === asTicker) ||
    results.find((r) => r.name.toLowerCase().includes(raw.toLowerCase())) ||
    results[0];

  if (!match) {
    throw new Error(`Could not resolve company: ${raw}`);
  }

  return {
    ticker: match.ticker,
    name: match.name,
    exchange: match.exchange,
    description: undefined,
  };
}
