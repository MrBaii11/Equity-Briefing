import type {
  DeckSlide,
  FilingDeck,
  FilingDeckMeta,
  FilingExtract,
  Evidence,
} from "../types";
import { formatMoney, formatPct } from "../format";
import { makeClaim } from "../analysis/claim";

function cell(n?: number, asPct = false) {
  if (n == null) return "—";
  return asPct ? formatPct(n) : formatMoney(n);
}

export function buildDeck(
  extract: FilingExtract,
  evidence: Evidence[],
  fileName: string,
): FilingDeck {
  const evidenceMap = Object.fromEntries(evidence.map((e) => [e.id, e]));
  const generatedAt = new Date().toISOString();
  const meta: FilingDeckMeta = {
    fileName,
    companyName: extract.companyName,
    ticker: extract.ticker,
    form: extract.form,
    periodLabel: extract.periodLabel,
    generatedAt,
    pageCount: extract.pageCount,
    parseConfidence: extract.parseConfidence,
    warnings: extract.warnings,
    warningsZh: extract.warningsZh,
  };

  const slides: DeckSlide[] = [];
  let index = 0;

  const push = (slide: Omit<DeckSlide, "index">) => {
    slides.push({ ...slide, index: index++ });
  };

  // 01 Cover
  push({
    id: "slide_cover",
    kind: "cover",
    title: "Cover",
    titleZh: "封面",
    headline: extract.companyName || fileName.replace(/\.[^.]+$/, ""),
    headlineZh: extract.companyName || fileName.replace(/\.[^.]+$/, ""),
    bullets: [
      makeClaim({
        en: [
          extract.form ? `Form ${extract.form}` : "Filing type unresolved",
          extract.periodLabel ? `Period: ${extract.periodLabel}` : null,
          extract.ticker ? `Ticker: ${extract.ticker}` : null,
          `Parse confidence: ${extract.parseConfidence}`,
        ]
          .filter(Boolean)
          .join(" · "),
        zh: [
          extract.form ? `表格 ${extract.form}` : "报告类型未识别",
          extract.periodLabel ? `期间：${extract.periodLabel}` : null,
          extract.ticker ? `代码：${extract.ticker}` : null,
          `解析置信度：${extract.parseConfidence}`,
        ]
          .filter(Boolean)
          .join(" · "),
        evidenceIds: ["doc_source"],
        stance: "neutral",
        confidence: extract.parseConfidence === "high" ? 0.8 : extract.parseConfidence === "medium" ? 0.6 : 0.4,
      }),
    ],
    evidenceIds: ["doc_source"],
    footnotes: ["Research prototype — not investment advice."],
    footnotesZh: ["研究原型——不构成投资建议。"],
  });

  // 02 Executive summary
  push({
    id: "slide_summary",
    kind: "executive_summary",
    title: "Executive summary",
    titleZh: "执行摘要",
    headline: "Highlights and risks from the filing",
    headlineZh: "来自披露的亮点与风险",
    bullets: [
      ...extract.highlights.slice(0, 3),
      ...extract.risks.slice(0, 2).map((r) => ({
        ...r,
        claim: `Risk: ${r.claim}`,
        claimZh: r.claimZh ? `风险：${r.claimZh}` : undefined,
      })),
    ],
    evidenceIds: [
      ...extract.highlights.flatMap((c) => c.evidenceIds),
      ...extract.risks.slice(0, 2).flatMap((c) => c.evidenceIds),
    ],
  });

  // 03 Financial snapshot table
  const periods = extract.periods;
  push({
    id: "slide_snapshot",
    kind: "financial_snapshot",
    title: "Financial snapshot",
    titleZh: "财务快照",
    headline: periods.length
      ? `Multi-period line items (${periods[0].period}–${periods[periods.length - 1].period})`
      : "Insufficient structured periods",
    headlineZh: periods.length
      ? `多期科目（${periods[0].period}–${periods[periods.length - 1].period}）`
      : "结构化期间不足",
    table: {
      columns: ["Metric", ...periods.map((p) => p.period)],
      columnsZh: ["科目", ...periods.map((p) => p.period)],
      rows: [
        ["Revenue", ...periods.map((p) => cell(p.revenue))],
        ["Gross profit", ...periods.map((p) => cell(p.grossProfit))],
        ["Operating income", ...periods.map((p) => cell(p.operatingIncome))],
        ["Net income", ...periods.map((p) => cell(p.netIncome))],
        ["Operating CF", ...periods.map((p) => cell(p.operatingCashFlow))],
        ["Free cash flow", ...periods.map((p) => cell(p.freeCashFlow))],
        ["Cash", ...periods.map((p) => cell(p.cash))],
        ["Total debt", ...periods.map((p) => cell(p.totalDebt))],
      ],
    },
    evidenceIds: periods.flatMap((p) => p.evidenceIds).slice(0, 12),
  });

  // 04 Trends
  const revPoints = periods
    .filter((p) => p.revenue != null)
    .map((p) => ({ label: p.period, value: p.revenue! }));
  const niPoints = periods
    .filter((p) => p.netIncome != null)
    .map((p) => ({ label: p.period, value: p.netIncome! }));
  const fcfPoints = periods
    .filter((p) => p.freeCashFlow != null)
    .map((p) => ({ label: p.period, value: p.freeCashFlow! }));
  const marginPoints = periods
    .filter((p) => p.revenue && p.grossProfit != null)
    .map((p) => ({
      label: p.period,
      value: p.grossProfit! / p.revenue!,
    }));

  push({
    id: "slide_trends",
    kind: "trends",
    title: "Trends",
    titleZh: "趋势",
    headline: revPoints.length
      ? "Revenue, earnings, and cash generation"
      : "Trend charts unavailable — limited numeric series",
    headlineZh: revPoints.length
      ? "营收、盈利与现金创造"
      : "趋势图不可用——数字序列不足",
    charts: [
      ...(revPoints.length
        ? [{ id: "rev", title: "Revenue", titleZh: "营收", points: revPoints, format: "money" as const }]
        : []),
      ...(niPoints.length
        ? [
            {
              id: "ni",
              title: "Net income",
              titleZh: "净利润",
              points: niPoints,
              format: "money" as const,
              color: "var(--ink)",
            },
          ]
        : []),
      ...(fcfPoints.length
        ? [
            {
              id: "fcf",
              title: "Free cash flow",
              titleZh: "自由现金流",
              points: fcfPoints,
              format: "money" as const,
              color: "var(--warn)",
            },
          ]
        : []),
      ...(marginPoints.length
        ? [
            {
              id: "gm",
              title: "Gross margin",
              titleZh: "毛利率",
              points: marginPoints,
              format: "pct" as const,
            },
          ]
        : []),
    ],
    evidenceIds: periods.flatMap((p) => p.evidenceIds).slice(0, 8),
  });

  // 05 Earnings quality
  push({
    id: "slide_quality",
    kind: "earnings_quality",
    title: "Earnings quality",
    titleZh: "盈利质量",
    headline: extract.qualityFlags.length
      ? "Cash conversion and red flags"
      : "No automated quality flags — still verify accruals manually",
    headlineZh: extract.qualityFlags.length
      ? "现金转化与红旗"
      : "无自动质量红旗——仍需人工核对应计",
    bullets: extract.qualityFlags.length
      ? extract.qualityFlags
      : [
          makeClaim({
            en: "Quality checks need operating cash flow and net income in the same periods.",
            zh: "质量检查需要同期间的经营现金流与净利润。",
            evidenceIds: ["doc_source"],
            stance: "neutral",
            confidence: 0.5,
          }),
        ],
    evidenceIds: extract.qualityFlags.flatMap((c) => c.evidenceIds),
  });

  // 06 Segments / KPI
  push({
    id: "slide_segments",
    kind: "segments_kpi",
    title: "Segments & KPIs",
    titleZh: "分部与 KPI",
    headline:
      extract.segments.length || extract.kpis.length
        ? "Disclosed segments and derived KPIs"
        : "Segment block not detected in text layer",
    headlineZh:
      extract.segments.length || extract.kpis.length
        ? "披露分部与推算 KPI"
        : "文本层未检测到分部信息",
    table:
      extract.segments.length || extract.kpis.length
        ? {
            columns: ["Item", "Value"],
            columnsZh: ["项目", "数值"],
            rows: [
              ...extract.segments.map((s) => [
                s.name,
                s.revenue != null ? formatMoney(s.revenue) : "—",
              ]),
              ...extract.kpis.map((k) => [k.label, k.value]),
            ],
          }
        : undefined,
    bullets:
      !extract.segments.length && !extract.kpis.length
        ? [
            makeClaim({
              en: "Open the source PDF segment note / KPI footnotes to complete this page.",
              zh: "请打开源 PDF 分部附注 / KPI 脚注以补全本页。",
              evidenceIds: ["doc_source"],
              stance: "neutral",
              confidence: 0.5,
            }),
          ]
        : undefined,
    evidenceIds: [
      ...extract.segments.map((s) => s.evidenceId).filter(Boolean),
      ...extract.kpis.map((k) => k.evidenceId).filter(Boolean),
    ] as string[],
  });

  // 07 Risks
  push({
    id: "slide_risks",
    kind: "risks",
    title: "Risk focus",
    titleZh: "风险重点",
    headline: extract.risks.length
      ? `${extract.risks.length} excerpts from Risk Factors / related language`
      : "Risk Factors section not located",
    headlineZh: extract.risks.length
      ? `来自风险因素及相关表述的 ${extract.risks.length} 条摘录`
      : "未定位到风险因素章节",
    bullets: extract.risks.length
      ? extract.risks
      : [
          makeClaim({
            en: "Search Item 1A Risk Factors in the source filing before sizing any thesis.",
            zh: "在形成任何观点前，请在源文件中查阅 Item 1A 风险因素。",
            evidenceIds: ["doc_source"],
            stance: "cautionary",
            confidence: 0.55,
          }),
        ],
    evidenceIds: extract.risks.flatMap((r) => r.evidenceIds),
  });

  // 08 Narrative vs numbers
  push({
    id: "slide_narrative",
    kind: "narrative_vs_numbers",
    title: "Narrative vs numbers",
    titleZh: "叙事 vs 数字",
    headline: extract.narrativePairs.length
      ? "Management discussion checked against extracted figures"
      : "MD&A excerpt not found — numbers-only cross-check",
    headlineZh: extract.narrativePairs.length
      ? "管理层讨论对照已抽取数字"
      : "未找到 MD&A 摘录——仅做数字侧核对",
    pairs: extract.narrativePairs.length
      ? extract.narrativePairs
      : [
          {
            management: makeClaim({
              en: "No MD&A excerpt extracted from the text layer.",
              zh: "文本层未抽取到 MD&A 摘录。",
              evidenceIds: ["doc_source"],
              stance: "neutral",
              confidence: 0.4,
            }),
            numbers: makeClaim({
              en: periods.length
                ? `Extracted ${periods.length} period(s); latest revenue ${cell(periods[periods.length - 1]?.revenue)}.`
                : "No period metrics extracted.",
              zh: periods.length
                ? `已抽取 ${periods.length} 个期间；最近营收 ${cell(periods[periods.length - 1]?.revenue)}。`
                : "未抽取到期间指标。",
              evidenceIds: periods.flatMap((p) => p.evidenceIds).slice(0, 3),
              stance: "neutral",
              confidence: 0.55,
            }),
          },
        ],
    evidenceIds: extract.narrativePairs.flatMap((p) => [
      ...p.management.evidenceIds,
      ...p.numbers.evidenceIds,
    ]),
  });

  // 09 Appendix
  push({
    id: "slide_appendix",
    kind: "appendix",
    title: "Appendix — evidence",
    titleZh: "附录 — 证据",
    headline: `${evidence.length} evidence items bound to this deck`,
    headlineZh: `本简报绑定 ${evidence.length} 条证据`,
    bullets: [
      makeClaim({
        en: meta.warnings.length
          ? `Warnings: ${meta.warnings.join(" | ")}`
          : "No extractor warnings beyond standard research caveats.",
        zh: meta.warningsZh.length
          ? `警告：${meta.warningsZh.join(" | ")}`
          : "除标准研究免责外无额外抽取警告。",
        evidenceIds: ["doc_source"],
        stance: meta.warnings.length ? "cautionary" : "neutral",
        confidence: 0.7,
      }),
      makeClaim({
        en: "Click any evidence chip on prior slides to open the source snippet drawer.",
        zh: "点击前述页面的证据芯片可打开来源摘录抽屉。",
        evidenceIds: ["doc_source"],
        stance: "neutral",
        confidence: 0.9,
      }),
    ],
    evidenceIds: evidence.map((e) => e.id).slice(0, 20),
    footnotes: ["Always verify figures against the primary PDF before decisions."],
    footnotesZh: ["决策前请务必对照原始 PDF 核对数字。"],
  });

  return {
    meta,
    slides,
    evidence: evidenceMap,
    extract,
  };
}
