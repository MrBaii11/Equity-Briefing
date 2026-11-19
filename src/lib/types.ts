export type EvidenceSource =
  | "financials"
  | "market"
  | "filing"
  | "news"
  | "company_profile"
  | "derived";

export interface Evidence {
  id: string;
  source: EvidenceSource;
  title: string;
  titleZh?: string;
  asOf: string;
  snippet: string;
  snippetZh?: string;
  metricKey?: string;
  metricValue?: number | string;
  /** Always present — primary outbound link */
  url: string;
  /** Human-readable access channel, e.g. "Yahoo Finance · Key Statistics" */
  accessLabel: string;
  accessLabelZh?: string;
}

export type ClaimStance =
  | "supportive"
  | "cautionary"
  | "neutral"
  | "conditionally_undervalued"
  | "fairly_valued"
  | "conditionally_overvalued";

export interface Claim {
  claim: string;
  claimZh?: string;
  stance: ClaimStance;
  confidence: number;
  evidenceIds: string[];
  assumptions?: string[];
  assumptionsZh?: string[];
}

export interface FinancialPeriod {
  period: string;
  revenue?: number;
  grossProfit?: number;
  operatingIncome?: number;
  netIncome?: number;
  freeCashFlow?: number;
  totalDebt?: number;
  cash?: number;
  equity?: number;
  sharesOutstanding?: number;
}

export interface MarketQuote {
  price: number;
  marketCap?: number;
  peTrailing?: number;
  peForward?: number;
  psTrailing?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  currency: string;
  asOf: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  source: string;
  url?: string;
  category: "product" | "litigation" | "regulatory" | "orders" | "buyback" | "earnings" | "other";
}

export interface FilingSnippet {
  id: string;
  form: string;
  filedAt: string;
  section: string;
  text: string;
  url?: string;
}

export interface CompanyIdentity {
  ticker: string;
  name: string;
  exchange: string;
  cik?: string;
  sector?: string;
  industry?: string;
  description?: string;
  descriptionZh?: string;
}

export interface CompanyBundle {
  identity: CompanyIdentity;
  quote: MarketQuote;
  periods: FinancialPeriod[];
  news: NewsItem[];
  filings: FilingSnippet[];
  peers?: { ticker: string; pe?: number; ps?: number }[];
  collectedAt: string;
  evidence: Evidence[];
}

export interface MetricRow {
  period: string;
  revenue?: number;
  netIncome?: number;
  freeCashFlow?: number;
  grossMargin?: number;
  operatingMargin?: number;
  netMargin?: number;
  roe?: number;
  debtToEquity?: number;
  revenueYoY?: number;
  netIncomeYoY?: number;
  fcfYoY?: number;
}

export interface QuantSection {
  summary: string;
  summaryZh?: string;
  trends: Claim[];
  redFlags: Claim[];
  metricsTable: MetricRow[];
}

export interface QualSection {
  history: Claim[];
  culture: Claim[];
  segments: Claim[];
}

export interface NewsSection {
  clusters: {
    category: NewsItem["category"];
    label: string;
    labelZh?: string;
    items: NewsItem[];
    takeaway: Claim;
  }[];
}

export type MoatType =
  | "network_effects"
  | "switching_costs"
  | "cost_advantage"
  | "brand"
  | "regulation"
  | "data_scale"
  | "ecosystem";

export interface MoatSection {
  moats: {
    type: MoatType;
    productOrBusiness: string;
    productOrBusinessZh?: string;
    strength: "strong" | "moderate" | "weak";
    claim: Claim;
  }[];
  erosion: Claim[];
}

export interface Scenario {
  name: "Bull" | "Base" | "Bear";
  nameZh?: string;
  narrative: string;
  narrativeZh?: string;
  assumptions: string[];
  assumptionsZh?: string[];
  impliedPriceLow: number;
  impliedPriceHigh: number;
  evidenceIds: string[];
}

export interface ValuationSection {
  relative: {
    vsHistory: Claim;
    vsPeers: Claim;
    multiples: {
      pe?: number;
      peHistoryPercentile?: number;
      ps?: number;
      peerMedianPe?: number;
    };
  };
  todayVsFundamentals: Claim;
  forwardOptionality: Claim;
  scenarios: Scenario[];
}

export interface RiskSection {
  level: 1 | 2 | 3 | 4 | 5;
  label: string;
  labelZh?: string;
  factors: Claim[];
}

export interface AdviceSection {
  investorFit: string;
  investorFitZh?: string;
  conditions: string[];
  conditionsZh?: string[];
  recommendation: Claim;
  disclaimer: string;
  disclaimerZh?: string;
}

export interface EquityBriefing {
  identity: CompanyIdentity;
  quote: MarketQuote;
  generatedAt: string;
  profile: QualSection;
  quant: QuantSection;
  news: NewsSection;
  moat: MoatSection;
  valuation: ValuationSection;
  risk: RiskSection;
  advice: AdviceSection;
  evidence: Record<string, Evidence>;
}

export type StreamEvent =
  | { type: "status"; message: string; messageZh?: string }
  | { type: "section"; key: keyof Omit<EquityBriefing, "evidence" | "identity" | "quote" | "generatedAt">; data: unknown }
  | { type: "meta"; identity: CompanyIdentity; quote: MarketQuote; generatedAt: string; fromCache: boolean }
  | { type: "evidence"; evidence: Evidence[] }
  | { type: "done"; briefing: EquityBriefing }
  | { type: "error"; message: string; messageZh?: string };

export interface SearchResult {
  ticker: string;
  name: string;
  exchange: string;
}

/** ——— Filing upload / Deck (v1) ——— */

export type SlideKind =
  | "cover"
  | "executive_summary"
  | "financial_snapshot"
  | "trends"
  | "earnings_quality"
  | "segments_kpi"
  | "risks"
  | "narrative_vs_numbers"
  | "appendix";

export type ParseConfidence = "high" | "medium" | "low";

export interface ExtractedPeriod {
  period: string;
  revenue?: number;
  grossProfit?: number;
  operatingIncome?: number;
  netIncome?: number;
  operatingCashFlow?: number;
  capex?: number;
  freeCashFlow?: number;
  cash?: number;
  totalDebt?: number;
  evidenceIds: string[];
}

export interface ExtractedSegment {
  name: string;
  revenue?: number;
  evidenceId?: string;
}

export interface ExtractedKpi {
  label: string;
  labelZh?: string;
  value: string;
  evidenceId?: string;
}

export interface NarrativePair {
  management: Claim;
  numbers: Claim;
}

export interface DeckTable {
  columns: string[];
  columnsZh: string[];
  rows: (string | number | null)[][];
}

export interface DeckChart {
  id: string;
  title: string;
  titleZh: string;
  points: { label: string; value: number }[];
  format?: "money" | "pct" | "number";
  color?: string;
}

export interface DeckSlide {
  id: string;
  kind: SlideKind;
  index: number;
  title: string;
  titleZh: string;
  headline: string;
  headlineZh: string;
  bullets?: Claim[];
  table?: DeckTable;
  charts?: DeckChart[];
  pairs?: NarrativePair[];
  evidenceIds: string[];
  footnotes?: string[];
  footnotesZh?: string[];
}

export interface FilingDeckMeta {
  fileName: string;
  companyName?: string;
  ticker?: string;
  form?: string;
  periodLabel?: string;
  generatedAt: string;
  pageCount?: number;
  parseConfidence: ParseConfidence;
  warnings: string[];
  warningsZh: string[];
}

export interface FilingExtract {
  companyName?: string;
  ticker?: string;
  form?: string;
  periodLabel?: string;
  periods: ExtractedPeriod[];
  segments: ExtractedSegment[];
  kpis: ExtractedKpi[];
  highlights: Claim[];
  risks: Claim[];
  narrativePairs: NarrativePair[];
  qualityFlags: Claim[];
  parseConfidence: ParseConfidence;
  warnings: string[];
  warningsZh: string[];
  pageCount?: number;
}

export interface FilingDeck {
  meta: FilingDeckMeta;
  slides: DeckSlide[];
  evidence: Record<string, Evidence>;
  extract: FilingExtract;
}

export type FilingStreamEvent =
  | { type: "status"; message: string; messageZh?: string }
  | { type: "meta"; meta: FilingDeckMeta }
  | { type: "evidence"; evidence: Evidence[] }
  | { type: "slide"; slide: DeckSlide }
  | { type: "done"; deck: FilingDeck }
  | { type: "error"; message: string; messageZh?: string };
