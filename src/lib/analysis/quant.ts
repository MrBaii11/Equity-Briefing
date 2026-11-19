import type { Claim, CompanyBundle, MetricRow, QuantSection } from "../types";
import { makeClaim } from "./claim";

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function growth(curr?: number, prev?: number) {
  if (curr == null || prev == null || prev === 0) return null;
  return (curr - prev) / Math.abs(prev);
}

function cagr(first?: number, last?: number, years?: number) {
  if (first == null || last == null || !years || years <= 0 || first <= 0 || last <= 0)
    return null;
  return Math.pow(last / first, 1 / years) - 1;
}

function money(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

export function runQuantAnalyst(bundle: CompanyBundle): QuantSection {
  const periods = bundle.periods;
  const evidenceIds = new Set(bundle.evidence.map((e) => e.id));
  const has = (id: string) => evidenceIds.has(id);

  const metricsTable: MetricRow[] = periods.map((p, i) => {
    const prev = i > 0 ? periods[i - 1] : undefined;
    const grossMargin =
      p.grossProfit != null && p.revenue ? p.grossProfit / p.revenue : undefined;
    const operatingMargin =
      p.operatingIncome != null && p.revenue
        ? p.operatingIncome / p.revenue
        : undefined;
    const netMargin =
      p.netIncome != null && p.revenue ? p.netIncome / p.revenue : undefined;
    const roe =
      p.netIncome != null && p.equity && p.equity !== 0
        ? p.netIncome / p.equity
        : undefined;
    const debtToEquity =
      p.totalDebt != null && p.equity && p.equity !== 0
        ? p.totalDebt / p.equity
        : undefined;
    return {
      period: p.period,
      revenue: p.revenue,
      netIncome: p.netIncome,
      freeCashFlow: p.freeCashFlow,
      grossMargin,
      operatingMargin,
      netMargin,
      roe,
      debtToEquity,
      revenueYoY: growth(p.revenue, prev?.revenue) ?? undefined,
      netIncomeYoY: growth(p.netIncome, prev?.netIncome) ?? undefined,
      fcfYoY: growth(p.freeCashFlow, prev?.freeCashFlow) ?? undefined,
    };
  });

  const latest = periods[periods.length - 1];
  const prior = periods[periods.length - 2];
  const first = periods[0];
  const years = Math.max(1, periods.length - 1);
  const trends: Claim[] = [];
  const redFlags: Claim[] = [];

  const revCagr = cagr(first?.revenue, latest?.revenue, years);
  if (revCagr != null && latest?.revenue != null && has(`fin_${latest.period}_revenue`)) {
    const ids = periods
      .filter((p) => p.revenue != null)
      .map((p) => `fin_${p.period}_revenue`)
      .filter(has);
    trends.push(
      makeClaim({
        en: `Over ${periods.length} reported periods, revenue moved from ${money(first!.revenue!)} to ${money(latest.revenue)} (≈${pct(revCagr)} CAGR). This frames whether growth is compounding or stalling before you look at the multiple.`,
        zh: `在 ${periods.length} 个报告期内，营收由 ${money(first!.revenue!)} 变为 ${money(latest.revenue)}（约 ${pct(revCagr)} 复合年增长率）。在看估值倍数前，先判断增长是在复利还是失速。`,
        evidenceIds: ids.length ? ids : [`fin_${latest.period}_revenue`],
        stance: revCagr >= 0.05 ? "supportive" : revCagr >= 0 ? "neutral" : "cautionary",
        confidence: 0.86,
      }),
    );
  }

  const revG = growth(latest?.revenue, prior?.revenue);
  if (revG != null && latest && has(`fin_${latest.period}_revenue`)) {
    trends.push(
      makeClaim({
        en: `Latest year-over-year revenue ${revG >= 0 ? "expanded" : "contracted"} ${pct(Math.abs(revG))} (${prior!.period} → ${latest.period}). Short-cycle swings matter most when backlog conversion or product cycles are the investment thesis.`,
        zh: `最新同比营收${revG >= 0 ? "增长" : "下降"} ${pct(Math.abs(revG))}（${prior!.period} → ${latest.period}）。若投资逻辑依赖订单转化或产品周期，短期波动尤其关键。`,
        evidenceIds: [`fin_${latest.period}_revenue`, `fin_${prior!.period}_revenue`].filter(has),
        stance: revG >= 0 ? "supportive" : "cautionary",
        confidence: 0.84,
      }),
    );
  }

  const latestRow = metricsTable[metricsTable.length - 1];
  const priorRow = metricsTable[metricsTable.length - 2];
  if (latestRow?.grossMargin != null && has(`fin_${latest!.period}_gross_margin`)) {
    const delta =
      priorRow?.grossMargin != null
        ? latestRow.grossMargin - priorRow.grossMargin
        : null;
    trends.push(
      makeClaim({
        en: `Gross margin stands at ${pct(latestRow.grossMargin)}${delta != null ? ` (${delta >= 0 ? "+" : ""}${pct(delta)} vs prior)` : ""}. Margin direction often reveals pricing power vs mix/cost pressure before net income does.`,
        zh: `毛利率为 ${pct(latestRow.grossMargin)}${delta != null ? `（较上期 ${delta >= 0 ? "+" : ""}${pct(delta)}）` : ""}。毛利率方向通常比净利润更早反映定价权、产品结构或成本压力。`,
        evidenceIds: [`fin_${latest!.period}_gross_margin`],
        stance: delta != null && delta < -0.01 ? "cautionary" : "supportive",
        confidence: 0.78,
      }),
    );
  }

  if (latestRow?.netMargin != null && latest?.netIncome != null && has(`fin_${latest.period}_net_income`)) {
    trends.push(
      makeClaim({
        en: `Net margin is ${pct(latestRow.netMargin)} on ${money(latest.netIncome)} of net income in ${latest.period}. Pair this with free-cash-flow conversion to judge earnings quality.`,
        zh: `${latest.period} 净利率为 ${pct(latestRow.netMargin)}，净利润 ${money(latest.netIncome)}。需结合自由现金流转化率判断盈利质量。`,
        evidenceIds: [`fin_${latest.period}_net_income`, `fin_${latest.period}_revenue`].filter(has),
        stance: latest.netIncome > 0 ? "supportive" : "cautionary",
        confidence: 0.8,
      }),
    );
  }

  const fcfId = latest ? `fin_${latest.period}_fcf` : "";
  const fcfG = growth(latest?.freeCashFlow, prior?.freeCashFlow);
  if (latest?.freeCashFlow != null && has(fcfId)) {
    const conversion =
      latest.netIncome && latest.netIncome !== 0
        ? latest.freeCashFlow / latest.netIncome
        : null;
    if (fcfG != null && fcfG < -0.25) {
      redFlags.push(
        makeClaim({
          en: `Free cash flow fell ${pct(Math.abs(fcfG))} vs prior period to ${money(latest.freeCashFlow)}${conversion != null ? ` (FCF/NI conversion ${conversion.toFixed(2)}x)` : ""}. Common drivers: growth capex, working-capital timing, or one-off cash uses — check MD&A before treating it as permanent.`,
          zh: `自由现金流较上期下降 ${pct(Math.abs(fcfG))}，至 ${money(latest.freeCashFlow)}${conversion != null ? `（FCF/净利润转化 ${conversion.toFixed(2)}x）` : ""}。常见原因包括扩张性资本开支、营运资金时点或一次性用款——在认定为结构性恶化前应核对 MD&A。`,
          evidenceIds: [fcfId, `fin_${prior!.period}_fcf`].filter(has),
          stance: "cautionary",
          confidence: 0.76,
          assumptions: ["FCF ≈ operating cash flow − capex where available"],
          assumptionsZh: ["自由现金流≈经营现金流−资本开支（若数据可得）"],
        }),
      );
    } else {
      trends.push(
        makeClaim({
          en: `Free cash flow in ${latest.period} is ${money(latest.freeCashFlow)} (${latest.freeCashFlow >= 0 ? "positive" : "negative"})${conversion != null ? `; conversion vs net income ${conversion.toFixed(2)}x` : ""}.`,
          zh: `${latest.period} 自由现金流为 ${money(latest.freeCashFlow)}（${latest.freeCashFlow >= 0 ? "正" : "负"}）${conversion != null ? `；相对净利润转化 ${conversion.toFixed(2)}x` : ""}。`,
          evidenceIds: [fcfId, `fin_${latest.period}_net_income`].filter(has),
          stance: latest.freeCashFlow >= 0 ? "supportive" : "cautionary",
          confidence: 0.78,
        }),
      );
    }
  }

  const debtId = latest ? `fin_${latest.period}_debt` : "";
  if (latest?.totalDebt != null && latest.equity != null && has(debtId)) {
    const dte = latest.equity !== 0 ? latest.totalDebt / latest.equity : Infinity;
    const netDebt =
      latest.cash != null ? latest.totalDebt - latest.cash : latest.totalDebt;
    if (dte > 2) {
      redFlags.push(
        makeClaim({
          en: `Leverage is material: debt/equity ≈ ${dte.toFixed(1)}x, net debt ≈ ${money(netDebt)}. Higher leverage amplifies equity outcomes in both bull and bear scenarios and raises refinancing sensitivity.`,
          zh: `杠杆偏高：债务/权益约 ${dte.toFixed(1)}x，净负债约 ${money(netDebt)}。高杠杆会放大牛熊情景下的股东回报差异，并提高再融资敏感度。`,
          evidenceIds: [debtId],
          stance: "cautionary",
          confidence: 0.74,
        }),
      );
    } else {
      trends.push(
        makeClaim({
          en: `Balance-sheet leverage looks contained (D/E ≈ ${dte.toFixed(1)}x; net debt ≈ ${money(netDebt)}).`,
          zh: `资产负债杠杆相对可控（D/E ≈ ${dte.toFixed(1)}x；净负债约 ${money(netDebt)}）。`,
          evidenceIds: [debtId],
          stance: "supportive",
          confidence: 0.7,
        }),
      );
    }
  }

  if (latestRow?.roe != null && latest && has(`fin_${latest.period}_net_income`)) {
    trends.push(
      makeClaim({
        en: `ROE prints around ${pct(latestRow.roe)}. Interpret carefully when equity book value is thin due to buybacks or leverage — high ROE can be mechanical rather than operational excellence.`,
        zh: `ROE 约 ${pct(latestRow.roe)}。若账面权益因回购或杠杆而偏薄，高 ROE 可能是财务结构结果，未必等于经营卓越。`,
        evidenceIds: [`fin_${latest.period}_net_income`, debtId].filter(has),
        stance: "neutral",
        confidence: 0.66,
      }),
    );
  }

  if (!trends.length) {
    trends.push(
      makeClaim({
        en: "Quantitative history is thin in the current data pull; treat trend claims as provisional and open the financial statements link in evidence.",
        zh: "当前拉取的定量历史偏薄；趋势结论仅供参考，请打开证据中的财务报表链接核对。",
        evidenceIds: ["price_spot"],
        stance: "neutral",
        confidence: 0.4,
      }),
    );
  }

  const summaryPartsEn = [
    `${bundle.identity.ticker} checkup spans ${periods.length} fiscal periods.`,
  ];
  const summaryPartsZh = [
    `${bundle.identity.ticker} 定量体检覆盖 ${periods.length} 个财年期间。`,
  ];
  if (revCagr != null) {
    summaryPartsEn.push(`Revenue CAGR ≈ ${pct(revCagr)}.`);
    summaryPartsZh.push(`营收 CAGR 约 ${pct(revCagr)}。`);
  }
  if (revG != null) {
    summaryPartsEn.push(`Latest YoY revenue ${pct(revG)}.`);
    summaryPartsZh.push(`最新营收同比 ${pct(revG)}。`);
  }
  if (bundle.quote.peTrailing != null) {
    summaryPartsEn.push(`Trailing P/E ${bundle.quote.peTrailing.toFixed(1)}x.`);
    summaryPartsZh.push(`滚动 P/E ${bundle.quote.peTrailing.toFixed(1)}x。`);
  }

  return {
    summary: summaryPartsEn.join(" "),
    summaryZh: summaryPartsZh.join(" "),
    trends,
    redFlags,
    metricsTable,
  };
}
