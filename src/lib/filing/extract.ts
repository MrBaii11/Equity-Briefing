import type { Claim, Evidence, FilingExtract, ParseConfidence } from "../types";
import { makeClaim } from "../analysis/claim";
import type { ParsedDocument } from "./parsePdf";

function money(n: number | undefined) {
  if (n == null || Number.isNaN(n)) return "n/a";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  return `${sign}$${abs.toFixed(0)}`;
}

function parseMoneyToken(raw: string): number | undefined {
  const t = raw.replace(/[,$()\s]/g, "").replace(/−/g, "-");
  if (!t || t === "—" || t === "-" || t === "n/a") return undefined;
  const parenNeg = /^\(.*\)$/.test(raw.trim());
  let mult = 1;
  let body = t;
  if (/b(illion)?$/i.test(body)) {
    mult = 1e9;
    body = body.replace(/b(illion)?$/i, "");
  } else if (/m(illion)?$/i.test(body)) {
    mult = 1e6;
    body = body.replace(/m(illion)?$/i, "");
  } else if (/k$/i.test(body)) {
    mult = 1e3;
    body = body.replace(/k$/i, "");
  }
  const n = Number(body);
  if (Number.isNaN(n)) return undefined;
  const v = n * mult;
  return parenNeg || raw.includes("(") ? -Math.abs(v) : v;
}

/** Detect if table units are in thousands/millions from nearby headers. */
function detectScale(text: string): number {
  const head = text.slice(0, 8000).toLowerCase();
  if (/in\s+millions|\$\s*in\s+millions|\(in\s+millions\)/.test(head)) return 1e6;
  if (/in\s+thousands|\$\s*in\s+thousands|\(in\s+thousands\)/.test(head)) return 1e3;
  if (/in\s+billions|\(in\s+billions\)/.test(head)) return 1e9;
  return 1;
}

function findYears(text: string): string[] {
  const years = [...text.matchAll(/\b(20[12]\d)\b/g)].map((m) => m[1]);
  const uniq = [...new Set(years)].sort();
  // Prefer recent fiscal years appearing in statements
  return uniq.slice(-4);
}

type LineHit = { year: string; value: number; snippet: string; pageHint: number };

function pageOf(pages: string[], snippet: string): number {
  const idx = pages.findIndex((p) => p.includes(snippet.slice(0, 80)));
  return idx >= 0 ? idx + 1 : 1;
}

function isProseHeavy(line: string) {
  const words = line.trim().split(/\s+/).length;
  const sentenceStops = (line.match(/[.!?]/g) || []).length;
  return words > 14 || sentenceStops >= 2;
}

function extractLabeledSeries(
  text: string,
  pages: string[],
  labels: RegExp[],
  years: string[],
  scale: number,
): LineHit[] {
  const hits: LineHit[] = [];
  const lines = text.split(/\n+/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!labels.some((re) => re.test(line))) continue;
    if (isProseHeavy(line)) continue;
    // Prefer statement rows: label + multiple numeric cells
    const window = [line, lines[i + 1] || "", lines[i + 2] || ""].join(" ");
    if (isProseHeavy(window) && !/,(\d{3})/.test(window)) continue;

    const tokens =
      window.match(
        /\$?\(?-?\d{1,3}(?:,\d{3})+(?:\.\d+)?\)?|\(?-?\d+\.\d+\)?/g,
      ) || [];
    const nums = tokens
      .map(parseMoneyToken)
      .filter((n): n is number => n != null)
      .map((n) => (Math.abs(n) < 1e6 && scale > 1 ? n * scale : n));

    if (nums.length < 1) continue;

    // Pair with year header on previous lines when present.
    // SEC tables usually list newest year on the left: 2024 2023 2022
    const header = [lines[i - 1] || "", lines[i - 2] || ""].join(" ");
    const yearHits = [...header.matchAll(/\b(20[12]\d)\b/g)].map((m) => m[1]);
    let useYears: string[];
    if (yearHits.length >= nums.length) {
      useYears = yearHits.slice(0, nums.length);
    } else if (yearHits.length > 0) {
      useYears = yearHits;
    } else {
      // Fallback: assume newest-left columns → map onto descending years
      const desc = [...years].sort((a, b) => b.localeCompare(a));
      useYears = desc.slice(0, nums.length);
    }

    const pairCount = Math.min(nums.length, useYears.length);
    for (let j = 0; j < pairCount; j++) {
      const year = useYears[j];
      const value = nums[j];
      const snippet = window.slice(0, 220).replace(/\s+/g, " ").trim();
      hits.push({ year, value, snippet, pageHint: pageOf(pages, snippet) });
    }
    if (hits.length >= Math.max(3, years.length)) break;
  }

  const byYear = new Map<string, LineHit>();
  for (const h of hits) {
    if (!byYear.has(h.year)) byYear.set(h.year, h);
  }
  return [...byYear.values()].sort((a, b) => a.year.localeCompare(b.year));
}

function extractRisks(text: string, pages: string[], fileName: string): { claims: Claim[]; evidence: Evidence[] } {
  const evidence: Evidence[] = [];
  const claims: Claim[] = [];
  const riskIdx = text.search(/item\s*1a\.?\s*risk\s*factors|risk\s*factors/i);
  const slice =
    riskIdx >= 0
      ? text.slice(riskIdx, riskIdx + 12000)
      : text.slice(0, 4000);

  const sentences = slice
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 60 && s.length < 420);

  const scored = sentences
    .map((s) => {
      let score = 0;
      if (/competit|litigation|regulat|cyber|liquidity|debt|dilut|supply|china|tariff|interest rate|recession/i.test(s))
        score += 2;
      if (/may|could|adverse|material|uncertain|risk/i.test(s)) score += 1;
      return { s, score };
    })
    .filter((x) => x.score >= 2)
    .slice(0, 5);

  scored.forEach((x, i) => {
    const id = `risk_${i + 1}`;
    const page = pageOf(pages, x.s);
    evidence.push({
      id,
      source: "filing",
      title: `Risk factor excerpt ${i + 1}`,
      titleZh: `风险因素摘录 ${i + 1}`,
      asOf: new Date().toISOString().slice(0, 10),
      snippet: x.s,
      snippetZh: x.s,
      url: `#page=${page}`,
      accessLabel: `${fileName} · p.${page}`,
      accessLabelZh: `${fileName} · 第 ${page} 页`,
    });
    claims.push(
      makeClaim({
        en: x.s,
        zh: x.s,
        evidenceIds: [id],
        stance: "cautionary",
        confidence: 0.7,
      }),
    );
  });

  return { claims, evidence };
}

function extractSegments(text: string, pages: string[], fileName: string) {
  const evidence: Evidence[] = [];
  const segments: FilingExtract["segments"] = [];
  const blockMatch = text.match(
    /(?:revenue\s+by\s+segment|net\s+sales\s+by\s+segment|segment\s+information)([\s\S]{0,3500})/i,
  );
  if (!blockMatch) return { segments, evidence };
  const block = blockMatch[0];
  const lines = block.split(/\n+/).slice(0, 40);
  for (const line of lines) {
    const m = line.match(
      /^([A-Za-z][A-Za-z0-9 &/\-]{2,40})\s+\$?\(?([\d,]{2,}(?:\.\d+)?)\)?/,
    );
    if (!m) continue;
    const name = m[1].trim();
    if (/total|year|ended|segment|revenue|sales/i.test(name)) continue;
    const value = parseMoneyToken(m[2]);
    if (value == null) continue;
    const id = `seg_${segments.length + 1}`;
    const page = pageOf(pages, line);
    evidence.push({
      id,
      source: "filing",
      title: `Segment: ${name}`,
      titleZh: `分部：${name}`,
      asOf: new Date().toISOString().slice(0, 10),
      snippet: line.slice(0, 240),
      snippetZh: line.slice(0, 240),
      metricKey: "segmentRevenue",
      metricValue: value,
      url: `#page=${page}`,
      accessLabel: `${fileName} · p.${page}`,
      accessLabelZh: `${fileName} · 第 ${page} 页`,
    });
    segments.push({ name, revenue: value, evidenceId: id });
    if (segments.length >= 6) break;
  }
  return { segments, evidence };
}

function yoy(curr?: number, prev?: number) {
  if (curr == null || prev == null || prev === 0) return undefined;
  return (curr - prev) / Math.abs(prev);
}

export function extractFiling(
  doc: ParsedDocument,
  fileName: string,
  hints?: { companyName?: string; ticker?: string },
): { extract: FilingExtract; evidence: Evidence[] } {
  const { text, pages, pageCount } = doc;
  const evidence: Evidence[] = [];
  const warnings: string[] = [];
  const warningsZh: string[] = [];
  const scale = detectScale(text);
  const years = findYears(text);

  const formMatch = text.match(/\bFORM\s+(10-[KQ]|20-F|8-K)\b/i) || text.match(/\b(10-[KQ]|20-F)\b/);
  const form = formMatch ? formMatch[1].toUpperCase() : undefined;

  let companyName = hints?.companyName;
  if (!companyName) {
    const m =
      text.match(/(?:Exact name of registrant as specified in its charter)\s*\n+\s*([A-Z][A-Za-z0-9 ,\.&'\-]{3,80})/i) ||
      text.match(/^([A-Z][A-Za-z0-9 ,\.&'\-]{3,60})\s+(?:FORM|Annual Report|Quarterly)/m);
    companyName = m?.[1]?.trim();
  }

  let ticker = hints?.ticker?.toUpperCase();
  if (!ticker) {
    const m = text.match(/\bTrading\s+Symbol\(s\)\s*[:\s]+([A-Z]{1,5})\b/i) || text.match(/\bTicker:\s*([A-Z]{1,5})\b/i);
    ticker = m?.[1];
  }

  const periodLabel =
    text.match(/fiscal\s+year\s+ended\s+([A-Za-z]+\s+\d{1,2},\s+20\d{2})/i)?.[1] ||
    (years.length ? `FY${years[years.length - 1]}` : undefined);

  const pushMetricEvidence = (
    id: string,
    title: string,
    titleZh: string,
    hit: LineHit,
    key: string,
  ) => {
    evidence.push({
      id,
      source: "filing",
      title,
      titleZh,
      asOf: hit.year,
      snippet: hit.snippet,
      snippetZh: hit.snippet,
      metricKey: key,
      metricValue: hit.value,
      url: `#page=${hit.pageHint}`,
      accessLabel: `${fileName} · p.${hit.pageHint}`,
      accessLabelZh: `${fileName} · 第 ${hit.pageHint} 页`,
    });
  };

  const revenueHits = extractLabeledSeries(
    text,
    pages,
    [
      /^\s*total\s+(net\s+)?revenues?\b/i,
      /^\s*total\s+net\s+sales\b/i,
      /^\s*net\s+sales\b/i,
      /^\s*revenues?\b/i,
    ],
    years,
    scale,
  );
  const grossHits = extractLabeledSeries(
    text,
    pages,
    [/\bgross\s+profit\b/i, /\bgross\s+margin\b/i],
    years,
    scale,
  );
  const opHits = extractLabeledSeries(
    text,
    pages,
    [/\boperating\s+income\b/i, /\bincome\s+from\s+operations\b/i],
    years,
    scale,
  );
  const niHits = extractLabeledSeries(
    text,
    pages,
    [/^\s*net\s+income\b/i, /^\s*net\s+earnings\b/i],
    years,
    scale,
  );
  const ocfHits = extractLabeledSeries(
    text,
    pages,
    [
      /net\s+cash\s+(?:provided|generated)\s+by\s+operating\s+activities/i,
      /cash\s+from\s+operations/i,
    ],
    years,
    scale,
  );
  const capexHits = extractLabeledSeries(
    text,
    pages,
    [
      /purchases?\s+of\s+property\s+and\s+equipment/i,
      /capital\s+expenditures/i,
      /payments?\s+for\s+property\s+and\s+equipment/i,
    ],
    years,
    scale,
  );
  const cashHits = extractLabeledSeries(
    text,
    pages,
    [/cash\s+and\s+cash\s+equivalents\b/i],
    years,
    scale,
  );
  const debtHits = extractLabeledSeries(
    text,
    pages,
    [/total\s+debt\b/i, /long-term\s+debt\b/i],
    years,
    scale,
  );

  const yearSet = [
    ...new Set([
      ...revenueHits.map((h) => h.year),
      ...niHits.map((h) => h.year),
      ...ocfHits.map((h) => h.year),
    ]),
  ].sort();

  const periods: FilingExtract["periods"] = yearSet.map((year) => {
    const rev = revenueHits.find((h) => h.year === year);
    const gp = grossHits.find((h) => h.year === year);
    const op = opHits.find((h) => h.year === year);
    const ni = niHits.find((h) => h.year === year);
    const ocf = ocfHits.find((h) => h.year === year);
    const capex = capexHits.find((h) => h.year === year);
    const cash = cashHits.find((h) => h.year === year);
    const debt = debtHits.find((h) => h.year === year);
    const ids: string[] = [];

    if (rev) {
      const id = `fin_${year}_revenue`;
      pushMetricEvidence(id, `${year} revenue`, `${year} 营收`, rev, "revenue");
      ids.push(id);
    }
    if (ni) {
      const id = `fin_${year}_net_income`;
      pushMetricEvidence(id, `${year} net income`, `${year} 净利润`, ni, "netIncome");
      ids.push(id);
    }
    if (ocf) {
      const id = `fin_${year}_ocf`;
      pushMetricEvidence(id, `${year} operating cash flow`, `${year} 经营现金流`, ocf, "operatingCashFlow");
      ids.push(id);
    }
    if (capex) {
      const id = `fin_${year}_capex`;
      // Capex often negative in cash flow; store absolute spend as negative FCF input
      const normalized = { ...capex, value: -Math.abs(capex.value) };
      pushMetricEvidence(id, `${year} capex`, `${year} 资本开支`, normalized, "capex");
      ids.push(id);
    }
    if (gp) {
      const id = `fin_${year}_gross`;
      pushMetricEvidence(id, `${year} gross profit`, `${year} 毛利`, gp, "grossProfit");
      ids.push(id);
    }
    if (op) {
      const id = `fin_${year}_op_income`;
      pushMetricEvidence(id, `${year} operating income`, `${year} 营业利润`, op, "operatingIncome");
      ids.push(id);
    }
    if (cash) {
      const id = `fin_${year}_cash`;
      pushMetricEvidence(id, `${year} cash`, `${year} 现金`, cash, "cash");
      ids.push(id);
    }
    if (debt) {
      const id = `fin_${year}_debt`;
      pushMetricEvidence(id, `${year} debt`, `${year} 债务`, debt, "totalDebt");
      ids.push(id);
    }

    const ocfV = ocf?.value;
    const capexV = capex ? -Math.abs(capex.value) : undefined;
    const fcf =
      ocfV != null && capexV != null
        ? ocfV + capexV
        : ocfV != null
          ? ocfV
          : undefined;
    if (fcf != null) {
      const id = `fin_${year}_fcf`;
      evidence.push({
        id,
        source: "derived",
        title: `${year} free cash flow (derived)`,
        titleZh: `${year} 自由现金流（推算）`,
        asOf: year,
        snippet: `FCF ≈ OCF ${money(ocfV)} + Capex ${money(capexV)} = ${money(fcf)}.`,
        snippetZh: `FCF ≈ 经营现金流 ${money(ocfV)} + 资本开支 ${money(capexV)} = ${money(fcf)}。`,
        metricKey: "freeCashFlow",
        metricValue: fcf,
        url: `#derived-fcf-${year}`,
        accessLabel: "Derived · OCF − Capex",
        accessLabelZh: "推算 · 经营现金流 − 资本开支",
      });
      ids.push(id);
    }

    return {
      period: year,
      revenue: rev?.value,
      grossProfit: gp?.value,
      operatingIncome: op?.value,
      netIncome: ni?.value,
      operatingCashFlow: ocf?.value,
      capex: capex ? -Math.abs(capex.value) : undefined,
      freeCashFlow: fcf,
      cash: cash?.value,
      totalDebt: debt?.value,
      evidenceIds: ids,
    };
  });

  const { claims: riskClaims, evidence: riskEv } = extractRisks(text, pages, fileName);
  evidence.push(...riskEv);

  const { segments, evidence: segEv } = extractSegments(text, pages, fileName);
  evidence.push(...segEv);

  const latest = periods[periods.length - 1];
  const prev = periods[periods.length - 2];
  const highlights: Claim[] = [];
  const qualityFlags: Claim[] = [];

  if (latest?.revenue != null) {
    const growth = yoy(latest.revenue, prev?.revenue);
    highlights.push(
      makeClaim({
        en:
          growth != null
            ? `Disclosed revenue ${money(latest.revenue)} in ${latest.period}${prev ? ` vs ${money(prev.revenue)} in ${prev.period} (${(growth * 100).toFixed(1)}% YoY)` : ""}.`
            : `Disclosed revenue ${money(latest.revenue)} in ${latest.period}.`,
        zh:
          growth != null
            ? `披露营收 ${money(latest.revenue)}（${latest.period}）${prev ? `，对比 ${prev.period} 的 ${money(prev.revenue)}（同比 ${(growth * 100).toFixed(1)}%）` : ""}。`
            : `披露营收 ${money(latest.revenue)}（${latest.period}）。`,
        evidenceIds: latest.evidenceIds.filter((id) => id.includes("revenue")),
        stance: growth != null && growth < 0 ? "cautionary" : "supportive",
        confidence: 0.75,
      }),
    );
  }

  if (latest?.netIncome != null) {
    highlights.push(
      makeClaim({
        en: `Net income ${money(latest.netIncome)} in ${latest.period}${prev?.netIncome != null ? ` (prior ${money(prev.netIncome)})` : ""}.`,
        zh: `${latest.period} 净利润 ${money(latest.netIncome)}${prev?.netIncome != null ? `（前一年 ${money(prev.netIncome)}）` : ""}。`,
        evidenceIds: latest.evidenceIds.filter((id) => id.includes("net_income")),
        stance: latest.netIncome < 0 ? "cautionary" : "supportive",
        confidence: 0.72,
      }),
    );
  }

  if (latest?.freeCashFlow != null && latest.netIncome != null) {
    const ratio = latest.netIncome !== 0 ? latest.freeCashFlow / latest.netIncome : undefined;
    const weak = latest.freeCashFlow < 0 || (ratio != null && ratio < 0.5 && latest.netIncome > 0);
    qualityFlags.push(
      makeClaim({
        en: `FCF ${money(latest.freeCashFlow)} vs net income ${money(latest.netIncome)}${ratio != null ? ` (conversion ~${(ratio * 100).toFixed(0)}%)` : ""}.`,
        zh: `自由现金流 ${money(latest.freeCashFlow)} vs 净利润 ${money(latest.netIncome)}${ratio != null ? `（转化约 ${(ratio * 100).toFixed(0)}%）` : ""}。`,
        evidenceIds: latest.evidenceIds.filter(
          (id) => id.includes("fcf") || id.includes("net_income") || id.includes("ocf"),
        ),
        stance: weak ? "cautionary" : "supportive",
        confidence: 0.7,
      }),
    );
  }

  if (latest?.operatingCashFlow != null && latest.netIncome != null) {
    if (latest.netIncome > 0 && latest.operatingCashFlow < latest.netIncome * 0.6) {
      qualityFlags.push(
        makeClaim({
          en: "Operating cash flow trails net income materially — check working capital and accruals in the cash flow statement.",
          zh: "经营现金流显著落后于净利润——请核对现金流量表中的营运资本与应计项目。",
          evidenceIds: latest.evidenceIds.filter(
            (id) => id.includes("ocf") || id.includes("net_income"),
          ),
          stance: "cautionary",
          confidence: 0.68,
        }),
      );
    }
  }

  if (!highlights.length) {
    warnings.push("Limited line-item extraction; tables may be image-based or non-standard.");
    warningsZh.push("科目抽取有限；表格可能为扫描件或非标准格式。");
    highlights.push(
      makeClaim({
        en: "Structured financial line items were sparse. Treat this deck as a navigation aid and verify figures in the source PDF.",
        zh: "可结构化抽取的财务科目较少。请将本简报视为导航辅助，并在源 PDF 中核对数字。",
        evidenceIds: evidence[0] ? [evidence[0].id] : [],
        stance: "cautionary",
        confidence: 0.45,
      }),
    );
  }

  if (!riskClaims.length) {
    warnings.push("No clear Risk Factors section excerpts found.");
    warningsZh.push("未找到清晰的风险因素章节摘录。");
  }

  // Document-level evidence
  evidence.unshift({
    id: "doc_source",
    source: "filing",
    title: "Source filing",
    titleZh: "源披露文件",
    asOf: new Date().toISOString().slice(0, 10),
    snippet: `${fileName} · ${pageCount} pages · form ${form || "unknown"} · ${companyName || "company n/a"}`,
    snippetZh: `${fileName} · ${pageCount} 页 · 表格 ${form || "未知"} · ${companyName || "公司未知"}`,
    url: "#document",
    accessLabel: "Uploaded filing",
    accessLabelZh: "用户上传文件",
  });

  const kpis: FilingExtract["kpis"] = [];
  if (latest?.revenue != null && latest.grossProfit != null && latest.revenue !== 0) {
    kpis.push({
      label: "Gross margin (latest)",
      labelZh: "毛利率（最近一期）",
      value: `${((latest.grossProfit / latest.revenue) * 100).toFixed(1)}%`,
      evidenceId: latest.evidenceIds.find((id) => id.includes("gross")),
    });
  }
  if (latest?.revenue != null && prev?.revenue != null) {
    const g = yoy(latest.revenue, prev.revenue);
    if (g != null) {
      kpis.push({
        label: "Revenue YoY",
        labelZh: "营收同比",
        value: `${(g * 100).toFixed(1)}%`,
        evidenceId: latest.evidenceIds.find((id) => id.includes("revenue")),
      });
    }
  }

  const narrativePairs: FilingExtract["narrativePairs"] = [];
  const mdaIdx = text.search(/item\s*7\.?\s*management|md&a|management.?s?\s+discussion/i);
  if (mdaIdx >= 0 && latest) {
    const mda = text.slice(mdaIdx, mdaIdx + 2500).replace(/\s+/g, " ");
    const sentence = mda.split(/(?<=[.!?])\s+/).find((s) => s.length > 80) || mda.slice(0, 280);
    const id = "mda_excerpt";
    evidence.push({
      id,
      source: "filing",
      title: "MD&A excerpt",
      titleZh: "MD&A 摘录",
      asOf: periodLabel || latest.period,
      snippet: sentence.slice(0, 400),
      snippetZh: sentence.slice(0, 400),
      url: `#page=${pageOf(pages, sentence)}`,
      accessLabel: `${fileName} · MD&A`,
      accessLabelZh: `${fileName} · 管理层讨论`,
    });
    narrativePairs.push({
      management: makeClaim({
        en: sentence.slice(0, 320),
        zh: sentence.slice(0, 320),
        evidenceIds: [id],
        stance: "neutral",
        confidence: 0.6,
      }),
      numbers: makeClaim({
        en:
          latest.revenue != null
            ? `Latest extracted revenue ${money(latest.revenue)}; net income ${money(latest.netIncome)}; FCF ${money(latest.freeCashFlow)}.`
            : "Insufficient numeric anchors to validate the MD&A narrative.",
        zh:
          latest.revenue != null
            ? `最近抽取营收 ${money(latest.revenue)}；净利润 ${money(latest.netIncome)}；自由现金流 ${money(latest.freeCashFlow)}。`
            : "数字锚点不足，难以核验 MD&A 叙事。",
        evidenceIds: latest.evidenceIds.slice(0, 4),
        stance: "neutral",
        confidence: 0.65,
      }),
    });
  }

  let parseConfidence: ParseConfidence = "medium";
  const metricCoverage = periods.reduce(
    (n, p) => n + (p.revenue != null ? 1 : 0) + (p.netIncome != null ? 1 : 0),
    0,
  );
  if (metricCoverage >= 4 && riskClaims.length >= 2) parseConfidence = "high";
  if (metricCoverage < 2) parseConfidence = "low";

  if (scale !== 1) {
    warnings.push(`Applied unit scale ×${scale} from statement headers.`);
    warningsZh.push(`根据报表表头应用了单位缩放 ×${scale}。`);
  }

  return {
    extract: {
      companyName,
      ticker,
      form,
      periodLabel,
      periods,
      segments,
      kpis,
      highlights,
      risks: riskClaims,
      narrativePairs,
      qualityFlags,
      parseConfidence,
      warnings,
      warningsZh,
      pageCount,
    },
    evidence,
  };
}
