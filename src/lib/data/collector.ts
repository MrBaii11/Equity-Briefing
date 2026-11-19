import type { CompanyBundle, Evidence } from "../types";
import { getBundleCache, setBundleCache } from "../cache";
import { resolveCompany } from "./resolve";
import { fetchFinancials, fetchQuote } from "./financials";
import { fetchNews } from "./news";
import { fetchFilings, resolveCik } from "./filings";
import { getSeed } from "./seeds";
import {
  edgarCompanyUrl,
  profileAccessUrl,
  yahooFinancialsUrl,
  yahooKeyStatsUrl,
  yahooNewsSearchUrl,
  yahooQuoteUrl,
} from "./links";

function money(n: number | undefined) {
  if (n == null || Number.isNaN(n)) return "n/a";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

function buildEvidence(bundle: Omit<CompanyBundle, "evidence">): Evidence[] {
  const evidence: Evidence[] = [];
  const { identity, quote, periods, news, filings } = bundle;
  const ticker = identity.ticker;
  const quoteUrl = yahooQuoteUrl(ticker);
  const finUrl = yahooFinancialsUrl(ticker);
  const statsUrl = yahooKeyStatsUrl(ticker);
  const edgarUrl = identity.cik
    ? edgarCompanyUrl(identity.cik)
    : edgarCompanyUrl();

  evidence.push({
    id: "price_spot",
    source: "market",
    title: "Spot price & market cap",
    titleZh: "现价与市值",
    asOf: quote.asOf,
    snippet: `${ticker} last $${quote.price.toFixed(2)} ${quote.currency}; market cap ${money(quote.marketCap)}. 52-week ${quote.fiftyTwoWeekLow != null ? `$${quote.fiftyTwoWeekLow.toFixed(2)}` : "—"} – ${quote.fiftyTwoWeekHigh != null ? `$${quote.fiftyTwoWeekHigh.toFixed(2)}` : "—"}.`,
    snippetZh: `${ticker} 最新价 $${quote.price.toFixed(2)} ${quote.currency}；市值 ${money(quote.marketCap)}。52周区间 ${quote.fiftyTwoWeekLow != null ? `$${quote.fiftyTwoWeekLow.toFixed(2)}` : "—"} – ${quote.fiftyTwoWeekHigh != null ? `$${quote.fiftyTwoWeekHigh.toFixed(2)}` : "—"}。`,
    metricKey: "price",
    metricValue: quote.price,
    url: quoteUrl,
    accessLabel: "Yahoo Finance · Quote",
    accessLabelZh: "Yahoo Finance · 行情页",
  });

  if (quote.peTrailing != null) {
    evidence.push({
      id: "mult_pe_trailing",
      source: "market",
      title: "Trailing P/E",
      titleZh: "滚动市盈率",
      asOf: quote.asOf,
      snippet: `Trailing P/E ${quote.peTrailing.toFixed(1)}x${quote.peForward != null ? `; forward P/E ${quote.peForward.toFixed(1)}x` : ""}.`,
      snippetZh: `滚动 P/E ${quote.peTrailing.toFixed(1)}x${quote.peForward != null ? `；预期 P/E ${quote.peForward.toFixed(1)}x` : ""}。`,
      metricKey: "peTrailing",
      metricValue: quote.peTrailing,
      url: statsUrl,
      accessLabel: "Yahoo Finance · Key Statistics",
      accessLabelZh: "Yahoo Finance · 关键统计",
    });
  }

  if (quote.psTrailing != null) {
    evidence.push({
      id: "mult_ps_trailing",
      source: "market",
      title: "Trailing P/S",
      titleZh: "滚动市销率",
      asOf: quote.asOf,
      snippet: `Trailing P/S ${quote.psTrailing.toFixed(1)}x.`,
      snippetZh: `滚动 P/S ${quote.psTrailing.toFixed(1)}x。`,
      metricKey: "psTrailing",
      metricValue: quote.psTrailing,
      url: statsUrl,
      accessLabel: "Yahoo Finance · Key Statistics",
      accessLabelZh: "Yahoo Finance · 关键统计",
    });
  }

  for (const p of periods) {
    if (p.revenue != null) {
      evidence.push({
        id: `fin_${p.period}_revenue`,
        source: "financials",
        title: `${p.period} revenue`,
        titleZh: `${p.period} 营收`,
        asOf: p.period,
        snippet: `Revenue ${money(p.revenue)}.`,
        snippetZh: `营收 ${money(p.revenue)}。`,
        metricKey: "revenue",
        metricValue: p.revenue,
        url: finUrl,
        accessLabel: "Yahoo Finance · Financials",
        accessLabelZh: "Yahoo Finance · 财务报表",
      });
    }
    if (p.netIncome != null) {
      evidence.push({
        id: `fin_${p.period}_net_income`,
        source: "financials",
        title: `${p.period} net income`,
        titleZh: `${p.period} 净利润`,
        asOf: p.period,
        snippet: `Net income ${money(p.netIncome)}.`,
        snippetZh: `净利润 ${money(p.netIncome)}。`,
        metricKey: "netIncome",
        metricValue: p.netIncome,
        url: finUrl,
        accessLabel: "Yahoo Finance · Financials",
        accessLabelZh: "Yahoo Finance · 财务报表",
      });
    }
    if (p.freeCashFlow != null) {
      evidence.push({
        id: `fin_${p.period}_fcf`,
        source: "financials",
        title: `${p.period} free cash flow`,
        titleZh: `${p.period} 自由现金流`,
        asOf: p.period,
        snippet: `Free cash flow ${money(p.freeCashFlow)}.`,
        snippetZh: `自由现金流 ${money(p.freeCashFlow)}。`,
        metricKey: "freeCashFlow",
        metricValue: p.freeCashFlow,
        url: finUrl,
        accessLabel: "Yahoo Finance · Financials",
        accessLabelZh: "Yahoo Finance · 财务报表",
      });
    }
    if (p.totalDebt != null) {
      evidence.push({
        id: `fin_${p.period}_debt`,
        source: "financials",
        title: `${p.period} total debt`,
        titleZh: `${p.period} 总负债`,
        asOf: p.period,
        snippet: `Total debt ${money(p.totalDebt)}; cash ${money(p.cash)}; equity ${money(p.equity)}.`,
        snippetZh: `总负债 ${money(p.totalDebt)}；现金 ${money(p.cash)}；股东权益 ${money(p.equity)}。`,
        metricKey: "totalDebt",
        metricValue: p.totalDebt,
        url: finUrl,
        accessLabel: "Yahoo Finance · Financials",
        accessLabelZh: "Yahoo Finance · 财务报表",
      });
    }
    if (p.grossProfit != null && p.revenue) {
      evidence.push({
        id: `fin_${p.period}_gross_margin`,
        source: "financials",
        title: `${p.period} gross margin`,
        titleZh: `${p.period} 毛利率`,
        asOf: p.period,
        snippet: `Gross margin ${((p.grossProfit / p.revenue) * 100).toFixed(1)}% (gross profit ${money(p.grossProfit)}).`,
        snippetZh: `毛利率 ${((p.grossProfit / p.revenue) * 100).toFixed(1)}%（毛利 ${money(p.grossProfit)}）。`,
        metricKey: "grossMargin",
        metricValue: p.grossProfit / p.revenue,
        url: finUrl,
        accessLabel: "Yahoo Finance · Financials",
        accessLabelZh: "Yahoo Finance · 财务报表",
      });
    }
  }

  for (const f of filings) {
    const url = f.url || edgarUrl;
    evidence.push({
      id: f.id,
      source: "filing",
      title: `${f.form} — ${f.section}`,
      titleZh: `${f.form} — ${f.section}`,
      asOf: f.filedAt,
      snippet: f.text.slice(0, 480),
      snippetZh: f.text.slice(0, 480),
      url,
      accessLabel: "SEC EDGAR · Filing",
      accessLabelZh: "SEC EDGAR · 披露文件",
    });
  }

  const rpoFiling = filings.find((f) =>
    /remaining performance|backlog|rpo/i.test(f.section + f.text),
  );
  if (rpoFiling) {
    const match = rpoFiling.text.match(/\$?\s*(\d+(?:\.\d+)?)\s*billion/i);
    evidence.push({
      id: "fin_rpo_backlog",
      source: "filing",
      title: "Remaining performance obligations / backlog",
      titleZh: "剩余履约义务 / 在手订单",
      asOf: rpoFiling.filedAt,
      snippet: rpoFiling.text.slice(0, 480),
      snippetZh: rpoFiling.text.slice(0, 480),
      metricKey: "rpo",
      metricValue: match ? Number(match[1]) * 1e9 : undefined,
      url: rpoFiling.url || edgarUrl,
      accessLabel: "SEC EDGAR · 10-Q/10-K MD&A",
      accessLabelZh: "SEC EDGAR · 10-Q/10-K 管理层讨论",
    });
  }

  if (identity.description) {
    evidence.push({
      id: "profile_description",
      source: "company_profile",
      title: "Business description",
      titleZh: "业务描述",
      asOf: bundle.collectedAt.slice(0, 10),
      snippet: identity.description,
      snippetZh: identity.descriptionZh || identity.description,
      url: profileAccessUrl(identity),
      accessLabel: identity.cik ? "SEC EDGAR · Company filings" : "Yahoo Finance · Quote",
      accessLabelZh: identity.cik ? "SEC EDGAR · 公司披露" : "Yahoo Finance · 行情页",
    });
  }

  for (const n of news) {
    evidence.push({
      id: n.id,
      source: "news",
      title: n.title,
      titleZh: n.title,
      asOf: n.publishedAt,
      snippet: n.summary.slice(0, 360),
      snippetZh: n.summary.slice(0, 360),
      url: n.url || yahooNewsSearchUrl(ticker),
      accessLabel: n.url ? `${n.source} · Article` : "Yahoo Finance · News",
      accessLabelZh: n.url ? `${n.source} · 原文` : "Yahoo Finance · 新闻",
    });
  }

  for (const p of bundle.peers ?? []) {
    if (p.pe != null) {
      evidence.push({
        id: `peer_${p.ticker}_pe`,
        source: "market",
        title: `Peer ${p.ticker} P/E`,
        titleZh: `同行 ${p.ticker} 市盈率`,
        asOf: quote.asOf,
        snippet: `${p.ticker} trailing/indicative P/E ${p.pe}x${p.ps != null ? `; P/S ${p.ps}x` : ""}.`,
        snippetZh: `${p.ticker} 参考 P/E ${p.pe}x${p.ps != null ? `；P/S ${p.ps}x` : ""}。`,
        metricKey: "peerPe",
        metricValue: p.pe,
        url: yahooQuoteUrl(p.ticker),
        accessLabel: `Yahoo Finance · ${p.ticker}`,
        accessLabelZh: `Yahoo Finance · ${p.ticker}`,
      });
    }
  }

  return evidence;
}

export async function collectCompanyBundle(
  tickerOrName: string,
  opts?: { bypassCache?: boolean },
): Promise<{ bundle: CompanyBundle; fromCache: boolean }> {
  const identityProbe = await resolveCompany(tickerOrName);
  const ticker = identityProbe.ticker;

  if (!opts?.bypassCache) {
    const cached = await getBundleCache(ticker);
    if (cached) return { bundle: cached, fromCache: true };
  }

  const seed = getSeed(ticker);
  const [quote, periods, news, filings, cik] = await Promise.all([
    fetchQuote(ticker),
    fetchFinancials(ticker),
    fetchNews(ticker, identityProbe.name),
    fetchFilings(ticker, identityProbe.name),
    resolveCik(ticker),
  ]);

  const identity = {
    ...identityProbe,
    ...(seed?.identity ?? {}),
    ticker,
    cik: cik || seed?.identity.cik || identityProbe.cik,
  };

  const collectedAt = new Date().toISOString();
  const newsWithLinks = news.map((n) => ({
    ...n,
    url: n.url || yahooNewsSearchUrl(ticker),
  }));
  const filingsWithLinks = filings.map((f) => ({
    ...f,
    url: f.url || (identity.cik ? edgarCompanyUrl(identity.cik) : edgarCompanyUrl()),
  }));

  const partial = {
    identity,
    quote,
    periods: periods.length ? periods : seed?.periods ?? [],
    news: newsWithLinks,
    filings: filingsWithLinks,
    peers: seed?.peers,
    collectedAt,
  };

  const evidence = buildEvidence(partial);
  const bundle: CompanyBundle = { ...partial, evidence };
  await setBundleCache(ticker, bundle);
  return { bundle, fromCache: false };
}
