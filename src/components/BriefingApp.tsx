"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  AdviceSection,
  CompanyIdentity,
  DeckSlide,
  Evidence,
  FilingDeckMeta,
  FilingStreamEvent,
  MarketQuote,
  MoatSection,
  NewsSection,
  QualSection,
  QuantSection,
  RiskSection,
  SearchResult,
  StreamEvent,
  ValuationSection,
} from "@/lib/types";
import { ClaimBlock } from "./ClaimBlock";
import { EvidenceDrawer } from "./EvidenceDrawer";
import { DeckViewer } from "./DeckViewer";
import { BarChart, PeerBars, PriceRangeMeter, ScenarioChart } from "./Charts";
import { useLocale } from "./LocaleProvider";
import { formatMoney, formatPct, stanceLabel } from "@/lib/format";
import { pickText } from "@/lib/analysis/claim";

type AppMode = "upload" | "ticker";

type PartialReport = {
  identity?: CompanyIdentity;
  quote?: MarketQuote;
  generatedAt?: string;
  fromCache?: boolean;
  profile?: QualSection;
  quant?: QuantSection;
  news?: NewsSection;
  moat?: MoatSection;
  valuation?: ValuationSection;
  risk?: RiskSection;
  advice?: AdviceSection;
  evidence: Record<string, Evidence>;
};

const MOAT_LABEL: Record<string, { en: string; zh: string }> = {
  network_effects: { en: "Network effects", zh: "网络效应" },
  switching_costs: { en: "Switching costs", zh: "转换成本" },
  cost_advantage: { en: "Cost advantage", zh: "成本优势" },
  brand: { en: "Brand", zh: "品牌" },
  regulation: { en: "Regulation / license", zh: "牌照 / 监管" },
  data_scale: { en: "Data / scale", zh: "数据 / 规模" },
  ecosystem: { en: "Ecosystem", zh: "生态" },
};

const STRENGTH: Record<string, { en: string; zh: string }> = {
  strong: { en: "strong", zh: "强" },
  moderate: { en: "moderate", zh: "中" },
  weak: { en: "weak", zh: "弱" },
};

export function BriefingApp() {
  const { locale, toggleLocale, t } = useLocale();
  const [mode, setMode] = useState<AppMode>("upload");
  const [query, setQuery] = useState("ORCL");
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [statusEn, setStatusEn] = useState<string | null>(null);
  const [statusZh, setStatusZh] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<PartialReport>({ evidence: {} });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerItems, setDrawerItems] = useState<Evidence[]>([]);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const [deckMeta, setDeckMeta] = useState<FilingDeckMeta | undefined>();
  const [deckSlides, setDeckSlides] = useState<DeckSlide[]>([]);
  const [deckEvidence, setDeckEvidence] = useState<Record<string, Evidence>>({});
  const [activeSlide, setActiveSlide] = useState(0);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [hintTicker, setHintTicker] = useState("");
  const [hintCompany, setHintCompany] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = (await res.json()) as { results: SearchResult[] };
        setSuggestions(data.results || []);
      } catch {
        setSuggestions([]);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [query]);

  const openEvidence = (ids: string[]) => {
    const items = ids.map((id) => report.evidence[id]).filter(Boolean);
    setDrawerItems(items);
    setHighlightId(items[0]?.id ?? null);
    setDrawerOpen(true);
  };

  function applyEvent(event: StreamEvent) {
    if (event.type === "status") {
      setStatusEn(event.message);
      setStatusZh(event.messageZh || event.message);
      return;
    }
    if (event.type === "error") {
      setError(pickText(locale, event.message, event.messageZh));
      return;
    }
    if (event.type === "meta") {
      setReport((prev) => ({
        ...prev,
        identity: event.identity,
        quote: event.quote,
        generatedAt: event.generatedAt,
        fromCache: event.fromCache,
      }));
      return;
    }
    if (event.type === "evidence") {
      setReport((prev) => {
        const map = { ...prev.evidence };
        for (const e of event.evidence) map[e.id] = e;
        return { ...prev, evidence: map };
      });
      return;
    }
    if (event.type === "section") {
      setReport((prev) => ({ ...prev, [event.key]: event.data }));
      return;
    }
    if (event.type === "done") {
      setReport((prev) => ({
        identity: event.briefing.identity,
        quote: event.briefing.quote,
        generatedAt: event.briefing.generatedAt,
        profile: event.briefing.profile,
        quant: event.briefing.quant,
        news: event.briefing.news,
        moat: event.briefing.moat,
        valuation: event.briefing.valuation,
        risk: event.briefing.risk,
        advice: event.briefing.advice,
        evidence: event.briefing.evidence,
        fromCache: prev.fromCache,
      }));
    }
  }

  function applyFilingEvent(event: FilingStreamEvent) {
    if (event.type === "status") {
      setStatusEn(event.message);
      setStatusZh(event.messageZh || event.message);
      return;
    }
    if (event.type === "error") {
      setError(pickText(locale, event.message, event.messageZh));
      return;
    }
    if (event.type === "meta") {
      setDeckMeta(event.meta);
      return;
    }
    if (event.type === "evidence") {
      setDeckEvidence((prev) => {
        const map = { ...prev };
        for (const e of event.evidence) map[e.id] = e;
        return map;
      });
      return;
    }
    if (event.type === "slide") {
      setDeckSlides((prev) => {
        const next = [...prev];
        const i = next.findIndex((s) => s.id === event.slide.id);
        if (i >= 0) next[i] = event.slide;
        else next.push(event.slide);
        return next.sort((a, b) => a.index - b.index);
      });
      return;
    }
    if (event.type === "done") {
      setDeckMeta(event.deck.meta);
      setDeckSlides(event.deck.slides);
      setDeckEvidence(event.deck.evidence);
      setActiveSlide(0);
    }
  }

  async function consumeNdjson(
    res: Response,
    onEvent: (raw: string) => void,
  ) {
    if (!res.ok || !res.body) {
      throw new Error(`${t("reportFailed")} (${res.status})`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        onEvent(line);
      }
    }
    if (buffer.trim()) onEvent(buffer);
  }

  async function runReport(nextQuery?: string, bypassCache = false) {
    const q = (nextQuery ?? query).trim();
    if (!q) return;
    setMode("ticker");
    setQuery(q);
    setLoading(true);
    setError(null);
    setStatusEn(t("starting"));
    setStatusZh("正在启动…");
    setReport({ evidence: {} });
    setDeckMeta(undefined);
    setDeckSlides([]);
    setDeckEvidence({});

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, bypassCache }),
      });
      await consumeNdjson(res, (line) =>
        applyEvent(JSON.parse(line) as StreamEvent),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t("reportFailed"));
    } finally {
      setLoading(false);
      setStatusEn(null);
      setStatusZh(null);
    }
  }

  async function runFilingAnalysis(opts?: { sample?: boolean; file?: File | null }) {
    const sample = Boolean(opts?.sample);
    const file = opts?.file ?? uploadFile;
    if (!sample && !file) {
      setError(locale === "zh" ? "请先选择文件或试用示例。" : "Choose a file or try the sample.");
      return;
    }

    setMode("upload");
    setLoading(true);
    setError(null);
    setStatusEn(t("analyzingFiling"));
    setStatusZh("正在分析财报…");
    setReport({ evidence: {} });
    setDeckMeta(undefined);
    setDeckSlides([]);
    setDeckEvidence({});
    setActiveSlide(0);

    try {
      const form = new FormData();
      if (sample) form.set("sample", "1");
      else if (file) form.set("file", file);
      if (hintTicker.trim()) form.set("ticker", hintTicker.trim());
      if (hintCompany.trim()) form.set("companyName", hintCompany.trim());

      const res = await fetch("/api/analyze-filing", {
        method: "POST",
        body: form,
      });
      await consumeNdjson(res, (line) =>
        applyFilingEvent(JSON.parse(line) as FilingStreamEvent),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t("filingFailed"));
    } finally {
      setLoading(false);
      setStatusEn(null);
      setStatusZh(null);
    }
  }

  function resetAll() {
    setReport({ evidence: {} });
    setDeckMeta(undefined);
    setDeckSlides([]);
    setDeckEvidence({});
    setActiveSlide(0);
    setError(null);
    setUploadFile(null);
  }

  const status = locale === "zh" ? statusZh : statusEn;

  const hasReport = Boolean(report.identity && (report.quant || report.profile));
  const hasDeck = deckSlides.length > 0 || Boolean(deckMeta);
  const evidenceCount = useMemo(
    () => Object.keys(report.evidence).length,
    [report.evidence],
  );
  const deckEvidenceCount = useMemo(
    () => Object.keys(deckEvidence).length,
    [deckEvidence],
  );

  const revenueSeries =
    report.quant?.metricsTable
      .filter((r) => r.revenue != null)
      .map((r) => ({ label: r.period, value: r.revenue! })) ?? [];
  const earningsSeries =
    report.quant?.metricsTable
      .filter((r) => r.netIncome != null)
      .map((r) => ({ label: r.period, value: r.netIncome! })) ?? [];
  const fcfSeries =
    report.quant?.metricsTable
      .filter((r) => r.freeCashFlow != null)
      .map((r) => ({ label: r.period, value: r.freeCashFlow! })) ?? [];

  return (
    <div className="relative min-h-full">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="hero-grid absolute inset-0 opacity-40" />
        <div className="absolute -left-24 top-[-10%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(30,95,80,0.18),transparent_68%)] blur-2xl animate-drift" />
        <div className="absolute right-[-8%] top-[20%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(176,92,48,0.12),transparent_70%)] blur-2xl animate-drift-delayed" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl justify-end px-5 pt-4 sm:px-8">
        <button
          type="button"
          onClick={toggleLocale}
          className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold tracking-wide text-[var(--ink)] transition hover:border-[var(--accent)]"
        >
          {t("langToggle")}
        </button>
      </div>

      <main className="relative mx-auto flex w-full max-w-5xl flex-col px-5 pb-24 pt-4 sm:px-8">
        {!hasReport && !hasDeck ? (
          <section className="flex min-h-[78vh] flex-col justify-center gap-10 animate-fade-up">
            <div className="max-w-2xl">
              <p className="font-[family-name:var(--font-display)] text-5xl leading-[1.05] tracking-tight text-[var(--ink)] sm:text-6xl">
                {t("brand")}
              </p>
              <h1 className="mt-5 max-w-xl text-xl leading-snug text-[var(--body)] sm:text-2xl">
                {t("tagline")}
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-[var(--muted)]">
                {t("heroSupport")}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMode("upload")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                  mode === "upload"
                    ? "bg-[var(--ink)] text-[var(--surface)]"
                    : "border border-[var(--line)] bg-[var(--surface)] text-[var(--body)]"
                }`}
              >
                {t("modeUpload")}
              </button>
              <button
                type="button"
                onClick={() => setMode("ticker")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                  mode === "ticker"
                    ? "bg-[var(--ink)] text-[var(--surface)]"
                    : "border border-[var(--line)] bg-[var(--surface)] text-[var(--body)]"
                }`}
              >
                {t("modeTicker")}
              </button>
            </div>

            {mode === "upload" ? (
              <UploadPanel
                file={uploadFile}
                setFile={setUploadFile}
                fileInputRef={fileInputRef}
                hintTicker={hintTicker}
                setHintTicker={setHintTicker}
                hintCompany={hintCompany}
                setHintCompany={setHintCompany}
                loading={loading}
                status={status}
                onAnalyze={() => runFilingAnalysis()}
                onSample={() => runFilingAnalysis({ sample: true })}
              />
            ) : (
              <SearchPanel
                query={query}
                setQuery={setQuery}
                suggestions={suggestions}
                loading={loading}
                status={status}
                onSubmit={() => runReport()}
                onPick={(ticker) => runReport(ticker)}
              />
            )}
          </section>
        ) : hasDeck && !hasReport ? (
          <section className="animate-fade-up space-y-8 pt-2">
            <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <button
                  type="button"
                  onClick={resetAll}
                  className="mb-3 text-xs uppercase tracking-[0.14em] text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  {t("newBriefing")}
                </button>
                <p className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)] sm:text-5xl">
                  {t("brand")}
                </p>
                <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h1 className="text-2xl font-medium text-[var(--ink)]">
                    {deckMeta?.ticker || deckMeta?.companyName || deckMeta?.fileName}
                  </h1>
                  {deckMeta?.ticker && deckMeta?.companyName && (
                    <span className="text-[var(--muted)]">{deckMeta.companyName}</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {deckMeta?.fileName}
                  {deckMeta?.generatedAt
                    ? ` · ${t("asOf")} ${deckMeta.generatedAt.slice(0, 10)}`
                    : ""}
                  {deckEvidenceCount
                    ? ` · ${deckEvidenceCount} ${t("evidenceItems")}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDrawerItems(Object.values(deckEvidence));
                    setHighlightId(null);
                    setDrawerOpen(true);
                  }}
                  className="btn-primary"
                >
                  {t("allEvidence")}
                </button>
              </div>
            </header>

            {status && (
              <p className="text-xs text-[var(--accent)] animate-pulse-soft">{status}</p>
            )}

            <DeckViewer
              meta={deckMeta}
              slides={deckSlides}
              activeIndex={activeSlide}
              onSelect={setActiveSlide}
              evidenceMap={deckEvidence}
              loading={loading}
              onOpenEvidence={(ids) => {
                const items = ids.map((id) => deckEvidence[id]).filter(Boolean);
                setDrawerItems(items);
                setHighlightId(items[0]?.id ?? null);
                setDrawerOpen(true);
              }}
            />
          </section>
        ) : (
          <section className="animate-fade-up space-y-8 pt-2">
            <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <button
                  type="button"
                  onClick={() => {
                    resetAll();
                  }}
                  className="mb-3 text-xs uppercase tracking-[0.14em] text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  {t("newBriefing")}
                </button>
                <p className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)] sm:text-5xl">
                  {t("brand")}
                </p>
                <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h1 className="text-2xl font-medium text-[var(--ink)]">
                    {report.identity?.ticker}
                  </h1>
                  <span className="text-[var(--muted)]">{report.identity?.name}</span>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {report.identity?.exchange}
                  {report.identity?.sector ? ` · ${report.identity.sector}` : ""}
                  {report.quote
                    ? ` · $${report.quote.price.toFixed(2)} ${t("asOf")} ${report.quote.asOf}`
                    : ""}
                  {report.fromCache ? ` · ${t("cached")}` : ""}
                  {evidenceCount ? ` · ${evidenceCount} ${t("evidenceItems")}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => runReport(report.identity?.ticker, true)}
                  className="btn-secondary"
                >
                  {t("refresh")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDrawerItems(Object.values(report.evidence));
                    setHighlightId(null);
                    setDrawerOpen(true);
                  }}
                  className="btn-primary"
                >
                  {t("allEvidence")}
                </button>
              </div>
            </header>

            <SearchPanel
              query={query}
              setQuery={setQuery}
              suggestions={suggestions}
              loading={loading}
              status={status}
              compact
              onSubmit={() => runReport()}
              onPick={(ticker) => runReport(ticker)}
            />

            {report.quote && (
              <div className="grid gap-4 sm:grid-cols-2">
                <PriceRangeMeter
                  title={t("chartRange")}
                  low={report.quote.fiftyTwoWeekLow}
                  high={report.quote.fiftyTwoWeekHigh}
                  price={report.quote.price}
                />
                {report.valuation && (
                  <PeerBars
                    title={t("chartPeers")}
                    selfTicker={report.identity?.ticker || ""}
                    selfPe={report.valuation.relative.multiples.pe}
                    peers={Object.values(report.evidence)
                      .filter((e) => e.id.startsWith("peer_") && e.metricValue != null)
                      .map((e) => ({
                        ticker: e.id.replace(/^peer_/, "").replace(/_pe$/, ""),
                        pe: Number(e.metricValue),
                      }))}
                  />
                )}
              </div>
            )}

            {report.profile && (
              <ReportSection title={t("sectionProfile")} subtitle={t("sectionProfileSub")}>
                <SubBlock title={t("history")}>
                  {report.profile.history.map((c, i) => (
                    <ClaimBlock key={`h-${i}`} claim={c} evidenceMap={report.evidence} onOpenEvidence={openEvidence} />
                  ))}
                </SubBlock>
                <SubBlock title={t("culture")}>
                  {report.profile.culture.map((c, i) => (
                    <ClaimBlock key={`c-${i}`} claim={c} evidenceMap={report.evidence} onOpenEvidence={openEvidence} />
                  ))}
                </SubBlock>
                <SubBlock title={t("segments")}>
                  {report.profile.segments.map((c, i) => (
                    <ClaimBlock key={`s-${i}`} claim={c} evidenceMap={report.evidence} onOpenEvidence={openEvidence} />
                  ))}
                </SubBlock>
              </ReportSection>
            )}

            {report.quant && (
              <ReportSection
                title={t("sectionQuant")}
                subtitle={pickText(locale, report.quant.summary, report.quant.summaryZh)}
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <BarChart title={t("chartRevenue")} series={revenueSeries} />
                  <BarChart
                    title={t("chartEarnings")}
                    series={earningsSeries.length ? earningsSeries : fcfSeries}
                    color="var(--ink)"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                        <th className="py-2 pr-3 font-medium">{t("period")}</th>
                        <th className="py-2 pr-3 font-medium">{t("revenue")}</th>
                        <th className="py-2 pr-3 font-medium">{t("netIncome")}</th>
                        <th className="py-2 pr-3 font-medium">{t("fcf")}</th>
                        <th className="py-2 pr-3 font-medium">{t("grossMargin")}</th>
                        <th className="py-2 pr-3 font-medium">{t("roe")}</th>
                        <th className="py-2 font-medium">{t("debtEquity")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.quant.metricsTable.map((row) => (
                        <tr key={row.period} className="border-b border-[var(--line)]/70">
                          <td className="py-2.5 pr-3 font-medium text-[var(--ink)]">{row.period}</td>
                          <td className="py-2.5 pr-3 font-mono text-[var(--body)]">{formatMoney(row.revenue)}</td>
                          <td className="py-2.5 pr-3 font-mono text-[var(--body)]">{formatMoney(row.netIncome)}</td>
                          <td className="py-2.5 pr-3 font-mono text-[var(--body)]">{formatMoney(row.freeCashFlow)}</td>
                          <td className="py-2.5 pr-3 font-mono text-[var(--body)]">{formatPct(row.grossMargin)}</td>
                          <td className="py-2.5 pr-3 font-mono text-[var(--body)]">{formatPct(row.roe)}</td>
                          <td className="py-2.5 font-mono text-[var(--body)]">
                            {row.debtToEquity != null ? `${row.debtToEquity.toFixed(1)}x` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="overflow-x-auto">
                  <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                    {t("growthTable")}
                  </p>
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                        <th className="py-2 pr-3 font-medium">{t("period")}</th>
                        <th className="py-2 pr-3 font-medium">{t("revYoY")}</th>
                        <th className="py-2 pr-3 font-medium">{t("niYoY")}</th>
                        <th className="py-2 pr-3 font-medium">FCF YoY</th>
                        <th className="py-2 font-medium">{locale === "zh" ? "净利率" : "Net margin"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.quant.metricsTable.map((row) => (
                        <tr key={`g-${row.period}`} className="border-b border-[var(--line)]/70">
                          <td className="py-2 pr-3 font-medium">{row.period}</td>
                          <td className="py-2 pr-3 font-mono">{formatPct(row.revenueYoY)}</td>
                          <td className="py-2 pr-3 font-mono">{formatPct(row.netIncomeYoY)}</td>
                          <td className="py-2 pr-3 font-mono">{formatPct(row.fcfYoY)}</td>
                          <td className="py-2 font-mono">{formatPct(row.netMargin)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <SubBlock title={t("trends")}>
                  {report.quant.trends.map((c, i) => (
                    <ClaimBlock key={`t-${i}`} claim={c} evidenceMap={report.evidence} onOpenEvidence={openEvidence} />
                  ))}
                </SubBlock>
                {report.quant.redFlags.length > 0 && (
                  <SubBlock title={t("redFlags")}>
                    {report.quant.redFlags.map((c, i) => (
                      <ClaimBlock key={`r-${i}`} claim={c} evidenceMap={report.evidence} onOpenEvidence={openEvidence} />
                    ))}
                  </SubBlock>
                )}
              </ReportSection>
            )}

            {report.news && (
              <ReportSection title={t("sectionNews")} subtitle={t("sectionNewsSub")}>
                <div className="space-y-5">
                  {report.news.clusters.map((cluster) => (
                    <div key={cluster.category} className="space-y-2">
                      <h3 className="text-sm font-medium text-[var(--ink)]">
                        {pickText(locale, cluster.label, cluster.labelZh)}
                      </h3>
                      <ClaimBlock
                        claim={cluster.takeaway}
                        evidenceMap={report.evidence}
                        onOpenEvidence={openEvidence}
                      />
                      <ul className="space-y-1 pl-1 text-xs text-[var(--muted)]">
                        {cluster.items.slice(0, 5).map((item) => (
                          <li key={item.id} className="flex flex-wrap items-baseline gap-x-2">
                            <span className="text-[var(--body)]">{item.title}</span>
                            <span>
                              {item.publishedAt} · {item.source}
                            </span>
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--accent)] hover:underline"
                              >
                                {t("openSource")} ↗
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </ReportSection>
            )}

            {report.moat && (
              <ReportSection title={t("sectionMoat")} subtitle={t("sectionMoatSub")}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {report.moat.moats.map((m, i) => (
                    <div
                      key={`${m.type}-${i}`}
                      className="border border-[var(--line)] bg-[var(--wash)]/60 px-4 py-3"
                    >
                      <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                        {pickText(locale, MOAT_LABEL[m.type]?.en || m.type, MOAT_LABEL[m.type]?.zh)}{" "}
                        · {pickText(locale, STRENGTH[m.strength].en, STRENGTH[m.strength].zh)}
                      </p>
                      <p className="mt-1 text-sm font-medium text-[var(--ink)]">
                        {pickText(locale, m.productOrBusiness, m.productOrBusinessZh)}
                      </p>
                      <div className="mt-2">
                        <ClaimBlock
                          claim={m.claim}
                          evidenceMap={report.evidence}
                          onOpenEvidence={openEvidence}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <SubBlock title={t("erosion")}>
                  {report.moat.erosion.map((c, i) => (
                    <ClaimBlock key={`e-${i}`} claim={c} evidenceMap={report.evidence} onOpenEvidence={openEvidence} />
                  ))}
                </SubBlock>
              </ReportSection>
            )}

            {report.valuation && report.quote && (
              <ReportSection title={t("sectionValuation")} subtitle={t("sectionValuationSub")}>
                <ScenarioChart
                  title={t("chartScenarios")}
                  spot={report.quote.price}
                  scenarios={report.valuation.scenarios.map((s) => ({
                    name: pickText(locale, s.name, s.nameZh) || s.name,
                    low: s.impliedPriceLow,
                    high: s.impliedPriceHigh,
                  }))}
                />

                <div className="grid gap-4 sm:grid-cols-3">
                  {report.valuation.scenarios.map((s) => (
                    <div key={s.name} className="border border-[var(--line)] px-4 py-3 animate-fade-up">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                        {pickText(locale, s.name, s.nameZh)}
                      </p>
                      <p className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                        ${s.impliedPriceLow.toFixed(0)}–${s.impliedPriceHigh.toFixed(0)}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--body)]">
                        {pickText(locale, s.narrative, s.narrativeZh)}
                      </p>
                      <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-[var(--muted)]">
                        {(locale === "zh" && s.assumptionsZh?.length
                          ? s.assumptionsZh
                          : s.assumptions
                        ).map((a) => (
                          <li key={a}>{a}</li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        className="evidence-chip mt-3"
                        onClick={() => openEvidence(s.evidenceIds)}
                      >
                        {t("evidence")}
                      </button>
                    </div>
                  ))}
                </div>

                <SubBlock title={t("relativeVal")}>
                  <p className="mb-2 text-sm text-[var(--muted)]">
                    {t("multiples")}: P/E{" "}
                    {report.valuation.relative.multiples.pe?.toFixed(1) ?? "—"}x · P/S{" "}
                    {report.valuation.relative.multiples.ps?.toFixed(1) ?? "—"}x ·{" "}
                    {t("peerMedianPe")}{" "}
                    {report.valuation.relative.multiples.peerMedianPe?.toFixed(1) ?? "—"}x
                  </p>
                  <ClaimBlock
                    claim={report.valuation.relative.vsHistory}
                    evidenceMap={report.evidence}
                    onOpenEvidence={openEvidence}
                  />
                  <ClaimBlock
                    claim={report.valuation.relative.vsPeers}
                    evidenceMap={report.evidence}
                    onOpenEvidence={openEvidence}
                  />
                </SubBlock>

                <SubBlock title={t("todayFund")}>
                  <ClaimBlock
                    claim={report.valuation.todayVsFundamentals}
                    evidenceMap={report.evidence}
                    onOpenEvidence={openEvidence}
                  />
                </SubBlock>
                <SubBlock title={t("forwardOpt")}>
                  <ClaimBlock
                    claim={report.valuation.forwardOptionality}
                    evidenceMap={report.evidence}
                    onOpenEvidence={openEvidence}
                  />
                </SubBlock>
              </ReportSection>
            )}

            {report.risk && (
              <ReportSection
                title={t("sectionRisk")}
                subtitle={pickText(locale, report.risk.label, report.risk.labelZh)}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        className={`h-2.5 w-8 rounded-sm ${
                          n <= report.risk!.level ? "bg-[var(--warn)]" : "bg-[var(--line)]"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-[var(--ink)]">L{report.risk.level}</span>
                </div>
                {report.risk.factors.map((c, i) => (
                  <ClaimBlock key={`rf-${i}`} claim={c} evidenceMap={report.evidence} onOpenEvidence={openEvidence} />
                ))}
              </ReportSection>
            )}

            {report.advice && (
              <ReportSection title={t("sectionAdvice")} subtitle={t("sectionAdviceSub")}>
                <p className="text-sm text-[var(--body)]">
                  <span className="font-medium text-[var(--ink)]">{t("investorFit")} </span>
                  {pickText(locale, report.advice.investorFit, report.advice.investorFitZh)}
                </p>
                <div className="mt-3">
                  <ClaimBlock
                    claim={report.advice.recommendation}
                    evidenceMap={report.evidence}
                    onOpenEvidence={openEvidence}
                  />
                </div>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--body)]">
                  {(locale === "zh" && report.advice.conditionsZh?.length
                    ? report.advice.conditionsZh
                    : report.advice.conditions
                  ).map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <p className="mt-4 text-xs leading-relaxed text-[var(--muted)]">
                  {pickText(locale, report.advice.disclaimer, report.advice.disclaimerZh)}{" "}
                  {stanceLabel(report.advice.recommendation.stance, locale)}.
                </p>
              </ReportSection>
            )}
          </section>
        )}

        {error && (
          <p className="mt-6 rounded-md border border-[var(--warn)]/40 bg-[var(--warn-soft)] px-4 py-3 text-sm text-[var(--warn)]">
            {error}
          </p>
        )}

        <footer className="mt-16 border-t border-[var(--line)] pt-6 text-xs text-[var(--muted)]">
          {t("footer")}
        </footer>
      </main>

      <EvidenceDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={drawerItems}
        highlightId={highlightId}
      />
    </div>
  );
}

function UploadPanel({
  file,
  setFile,
  fileInputRef,
  hintTicker,
  setHintTicker,
  hintCompany,
  setHintCompany,
  loading,
  status,
  onAnalyze,
  onSample,
}: {
  file: File | null;
  setFile: (f: File | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  hintTicker: string;
  setHintTicker: (v: string) => void;
  hintCompany: string;
  setHintCompany: (v: string) => void;
  loading: boolean;
  status: string | null;
  onAnalyze: () => void;
  onSample: () => void;
}) {
  const { t } = useLocale();
  return (
    <div className="max-w-xl space-y-4">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) setFile(f);
        }}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)]/80 px-6 py-10 text-center transition hover:border-[var(--accent)] hover:bg-[var(--wash)]"
      >
        <span className="text-sm font-medium text-[var(--ink)]">{t("uploadDrop")}</span>
        <span className="text-xs text-[var(--muted)]">{t("uploadHint")}</span>
        {file && (
          <span className="mt-2 font-mono text-xs text-[var(--accent)]">{file.name}</span>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,application/pdf,text/plain"
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={hintTicker}
          onChange={(e) => setHintTicker(e.target.value)}
          placeholder={t("optionalTicker")}
          className="input-search"
        />
        <input
          value={hintCompany}
          onChange={(e) => setHintCompany(e.target.value)}
          placeholder={t("optionalCompany")}
          className="input-search"
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={loading || !file}
          onClick={onAnalyze}
          className="btn-primary"
        >
          {loading ? t("generating") : t("uploadCta")}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onSample}
          className="btn-secondary"
        >
          {t("trySample")}
        </button>
      </div>
      {status && (
        <p className="text-xs text-[var(--accent)] animate-pulse-soft">{status}</p>
      )}
    </div>
  );
}

function SearchPanel({
  query,
  setQuery,
  suggestions,
  loading,
  status,
  onSubmit,
  onPick,
  compact,
}: {
  query: string;
  setQuery: (v: string) => void;
  suggestions: SearchResult[];
  loading: boolean;
  status: string | null;
  onSubmit: () => void;
  onPick: (ticker: string) => void;
  compact?: boolean;
}) {
  const { t } = useLocale();
  return (
    <div className="max-w-xl">
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-stretch"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("placeholder")}
          className="input-search flex-1"
          autoComplete="off"
        />
        <button type="submit" disabled={loading} className="btn-primary shrink-0">
          {loading ? t("generating") : t("generate")}
        </button>
      </form>
      {status && (
        <p className="mt-2 text-xs text-[var(--accent)] animate-pulse-soft">{status}</p>
      )}
      {!compact && (
        <div className="mt-4 flex flex-wrap gap-2">
          {suggestions.slice(0, 6).map((s) => (
            <button
              key={s.ticker}
              type="button"
              onClick={() => onPick(s.ticker)}
              className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-left text-xs text-[var(--body)] transition hover:border-[var(--accent)] hover:text-[var(--ink)]"
            >
              <span className="font-medium text-[var(--ink)]">{s.ticker}</span>
              <span className="text-[var(--muted)]"> · {s.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-fade-up border-t border-[var(--line)] pt-8">
      <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">{subtitle}</p>
      )}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function SubBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
