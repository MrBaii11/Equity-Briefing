import type { CompanyIdentity } from "../types";

export function yahooQuoteUrl(ticker: string) {
  return `https://finance.yahoo.com/quote/${encodeURIComponent(ticker)}`;
}

export function yahooFinancialsUrl(ticker: string) {
  return `https://finance.yahoo.com/quote/${encodeURIComponent(ticker)}/financials/`;
}

export function yahooKeyStatsUrl(ticker: string) {
  return `https://finance.yahoo.com/quote/${encodeURIComponent(ticker)}/key-statistics/`;
}

export function yahooNewsSearchUrl(ticker: string) {
  return `https://finance.yahoo.com/quote/${encodeURIComponent(ticker)}/news/`;
}

export function edgarCompanyUrl(cik?: string) {
  if (!cik) return "https://www.sec.gov/edgar/searchedgar/companysearch.html";
  const padded = cik.replace(/^0+/, "") || cik;
  return `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${padded}&owner=include&count=40`;
}

export function edgarSearchByTicker(ticker: string) {
  return `https://www.sec.gov/edgar/search/#/entityName=${encodeURIComponent(ticker)}`;
}

export function profileAccessUrl(identity: CompanyIdentity) {
  if (identity.cik) return edgarCompanyUrl(identity.cik);
  return yahooQuoteUrl(identity.ticker);
}
