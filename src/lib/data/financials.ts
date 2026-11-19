import type { FinancialPeriod, MarketQuote } from "../types";
import { getSeed } from "./seeds";

type YahooChart = {
  chart?: {
    result?: {
      meta?: {
        regularMarketPrice?: number;
        currency?: string;
        symbol?: string;
        fiftyTwoWeekHigh?: number;
        fiftyTwoWeekLow?: number;
      };
      timestamp?: number[];
    }[];
  };
};

type YahooQuoteSummary = {
  quoteSummary?: {
    result?: {
      price?: {
        regularMarketPrice?: { raw?: number };
        marketCap?: { raw?: number };
        currency?: string;
      };
      summaryDetail?: {
        trailingPE?: { raw?: number };
        forwardPE?: { raw?: number };
        priceToSalesTrailing12Months?: { raw?: number };
        fiftyTwoWeekHigh?: { raw?: number };
        fiftyTwoWeekLow?: { raw?: number };
      };
      financialData?: {
        totalRevenue?: { raw?: number };
        freeCashflow?: { raw?: number };
        totalDebt?: { raw?: number };
        totalCash?: { raw?: number };
      };
      defaultKeyStatistics?: {
        sharesOutstanding?: { raw?: number };
      };
      incomeStatementHistory?: {
        incomeStatementHistory?: {
          endDate?: { fmt?: string };
          totalRevenue?: { raw?: number };
          grossProfit?: { raw?: number };
          operatingIncome?: { raw?: number };
          netIncome?: { raw?: number };
        }[];
      };
      balanceSheetHistory?: {
        balanceSheetStatements?: {
          endDate?: { fmt?: string };
          totalStockholderEquity?: { raw?: number };
          cash?: { raw?: number };
          longTermDebt?: { raw?: number };
          shortLongTermDebt?: { raw?: number };
        }[];
      };
      cashflowStatementHistory?: {
        cashflowStatements?: {
          endDate?: { fmt?: string };
          totalCashFromOperatingActivities?: { raw?: number };
          capitalExpenditures?: { raw?: number };
        }[];
      };
    }[];
  };
};

async function yahooJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "equity-briefing/0.1" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchQuote(ticker: string): Promise<MarketQuote> {
  const seed = getSeed(ticker);
  const modules =
    "price,summaryDetail,defaultKeyStatistics,financialData";
  const summary = await yahooJson<YahooQuoteSummary>(
    `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=${modules}`,
  );
  const chart = await yahooJson<YahooChart>(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`,
  );

  const r = summary?.quoteSummary?.result?.[0];
  const meta = chart?.chart?.result?.[0]?.meta;
  const price =
    r?.price?.regularMarketPrice?.raw ??
    meta?.regularMarketPrice ??
    seed?.quote.price;

  if (price == null) {
    if (seed) return { ...seed.quote };
    throw new Error(`No quote for ${ticker}`);
  }

  return {
    price,
    marketCap: r?.price?.marketCap?.raw ?? seed?.quote.marketCap,
    peTrailing: r?.summaryDetail?.trailingPE?.raw ?? seed?.quote.peTrailing,
    peForward: r?.summaryDetail?.forwardPE?.raw ?? seed?.quote.peForward,
    psTrailing:
      r?.summaryDetail?.priceToSalesTrailing12Months?.raw ??
      seed?.quote.psTrailing,
    fiftyTwoWeekHigh:
      r?.summaryDetail?.fiftyTwoWeekHigh?.raw ??
      meta?.fiftyTwoWeekHigh ??
      seed?.quote.fiftyTwoWeekHigh,
    fiftyTwoWeekLow:
      r?.summaryDetail?.fiftyTwoWeekLow?.raw ??
      meta?.fiftyTwoWeekLow ??
      seed?.quote.fiftyTwoWeekLow,
    currency: r?.price?.currency || meta?.currency || "USD",
    asOf: new Date().toISOString().slice(0, 10),
  };
}

export async function fetchFinancials(ticker: string): Promise<FinancialPeriod[]> {
  const seed = getSeed(ticker);
  const summary = await yahooJson<YahooQuoteSummary>(
    `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=incomeStatementHistory,balanceSheetHistory,cashflowStatementHistory,defaultKeyStatistics`,
  );
  const r = summary?.quoteSummary?.result?.[0];
  const income = r?.incomeStatementHistory?.incomeStatementHistory ?? [];
  if (!income.length) {
    return seed?.periods ? [...seed.periods] : [];
  }

  const balances = r?.balanceSheetHistory?.balanceSheetStatements ?? [];
  const cashflows = r?.cashflowStatementHistory?.cashflowStatements ?? [];
  const shares = r?.defaultKeyStatistics?.sharesOutstanding?.raw;

  const byYear = new Map<string, FinancialPeriod>();

  for (const row of income) {
    const period = row.endDate?.fmt?.slice(0, 4) || "unknown";
    byYear.set(period, {
      period,
      revenue: row.totalRevenue?.raw,
      grossProfit: row.grossProfit?.raw,
      operatingIncome: row.operatingIncome?.raw,
      netIncome: row.netIncome?.raw,
      sharesOutstanding: shares,
    });
  }

  for (const row of balances) {
    const period = row.endDate?.fmt?.slice(0, 4) || "unknown";
    const cur = byYear.get(period) || { period };
    cur.equity = row.totalStockholderEquity?.raw;
    cur.cash = row.cash?.raw;
    cur.totalDebt =
      (row.longTermDebt?.raw ?? 0) + (row.shortLongTermDebt?.raw ?? 0) ||
      undefined;
    byYear.set(period, cur);
  }

  for (const row of cashflows) {
    const period = row.endDate?.fmt?.slice(0, 4) || "unknown";
    const cur = byYear.get(period) || { period };
    const ocf = row.totalCashFromOperatingActivities?.raw;
    const capex = row.capitalExpenditures?.raw;
    if (ocf != null && capex != null) cur.freeCashFlow = ocf + capex; // capex usually negative
    byYear.set(period, cur);
  }

  const periods = [...byYear.values()].sort((a, b) =>
    a.period.localeCompare(b.period),
  );

  if (periods.length < 2 && seed?.periods) return [...seed.periods];
  return periods;
}
