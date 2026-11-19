import type {
  AdviceSection,
  CompanyBundle,
  MoatSection,
  MoatType,
  RiskSection,
  Scenario,
  ValuationSection,
} from "../types";
import { makeClaim } from "./claim";

function peerMedianPe(bundle: CompanyBundle) {
  const pes = (bundle.peers ?? [])
    .map((p) => p.pe)
    .filter((x): x is number => x != null);
  if (!pes.length) return undefined;
  const sorted = [...pes].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

export function runMoatAnalyst(bundle: CompanyBundle): MoatSection {
  const { identity, filings, evidence } = bundle;
  const biz = filings.find((f) => /business|culture/i.test(f.section));
  const rpo = evidence.find((e) => e.id === "fin_rpo_backlog");
  const text = `${identity.description || ""} ${biz?.text || ""}`.toLowerCase();
  const baseIds = [biz?.id || "profile_description"].filter(Boolean) as string[];

  const moats: MoatSection["moats"] = [];

  const push = (
    type: MoatType,
    productOrBusiness: string,
    productOrBusinessZh: string,
    strength: "strong" | "moderate" | "weak",
    en: string,
    zh: string,
    extraIds: string[] = [],
  ) =>
    moats.push({
      type,
      productOrBusiness,
      productOrBusinessZh,
      strength,
      claim: makeClaim({
        en,
        zh,
        evidenceIds: [...baseIds, ...extraIds].filter(Boolean),
        stance: strength === "weak" ? "neutral" : "supportive",
        confidence: strength === "strong" ? 0.7 : strength === "moderate" ? 0.6 : 0.4,
      }),
    });

  if (/ecosystem|app store|iphone|installed base/.test(text)) {
    push(
      "ecosystem",
      "Device + services ecosystem",
      "硬件 + 服务生态",
      "strong",
      "Ecosystem lock-in appears central: hardware, software, and services reinforce each other, raising the cost of partial substitution. Durability still depends on product cadence and regulatory constraints on platform terms.",
      "生态锁定似乎是核心：硬件、软件与服务相互强化，提高局部替代成本。持久性仍取决于产品节奏，以及对平台条款的监管约束。",
    );
  }

  if (
    /switching|mission-critical|database|erp|dealer/.test(text) ||
    identity.ticker === "ORCL"
  ) {
    push(
      "switching_costs",
      identity.ticker === "ORCL" ? "Database / ERP estates" : "Installed mission-critical systems",
      identity.ticker === "ORCL" ? "数据库 / ERP 装机" : "关键任务系统装机",
      "strong",
      "High switching costs are plausible where customers run mission-critical systems or rely on dense dealer/service networks. Migration risk, retraining, and integration debt often dominate sticker-price comparisons.",
      "当客户运行关键任务系统或依赖密集经销/服务网络时，高转换成本较为可信。迁移风险、再培训与集成债务往往压过标价对比。",
      rpo ? [rpo.id] : [],
    );
  }

  if (/brand|design|privacy/.test(text)) {
    push(
      "brand",
      "Brand & product preference",
      "品牌与产品偏好",
      "moderate",
      "Brand/design/privacy preference shows up in disclosed competitive factors. Brands help pricing and retention but rarely survive repeated product misses alone.",
      "披露中的竞争因素提到品牌/设计/隐私偏好。品牌有助于定价与留存，但很少能单独扛住连续产品失误。",
    );
  }

  if (/cost|scale|manufactur/.test(text) && identity.sector === "Industrials") {
    push(
      "cost_advantage",
      "Scale manufacturing & distribution",
      "规模制造与分销",
      "moderate",
      "Scale in manufacturing and distribution can support cost advantages through the cycle, especially with a dense dealer footprint — watch utilization and commodity input costs.",
      "制造与分销规模可在周期中支撑成本优势，尤其在经销网络密集时——需关注产能利用率与大宗投入成本。",
    );
  }

  if (!moats.length) {
    push(
      "data_scale",
      "Undifferentiated until proven",
      "证据不足，暂难定论",
      "weak",
      "Moat mapping needs richer segment disclosures; current evidence is insufficient to claim a durable advantage. Use EDGAR notes before sizing a moat-based thesis.",
      "护城河刻画需要更细的分部披露；当前证据不足以断言持久优势。在按护城河定仓前请先读 EDGAR 附注。",
    );
  }

  const riskFiling = filings.find((f) => /risk/i.test(f.section));
  const erosion = [];
  if (riskFiling) {
    erosion.push(
      makeClaim({
        en: "Issuer risk factors describe competitive intensity and execution hazards that can erode any moat over time. Read the linked EDGAR excerpt before assuming advantage permanence.",
        zh: "发行人风险因素描述了竞争强度与执行风险，任何护城河都可能随时间被侵蚀。在假设优势持久前，请阅读链接的 EDGAR 摘录。",
        evidenceIds: [riskFiling.id],
        stance: "cautionary",
        confidence: 0.76,
      }),
    );
  }
  if (rpo) {
    erosion.push(
      makeClaim({
        en: "Large backlog/RPO is only valuable if capacity and customers convert as contracted. Delivery slips, price concessions, or margin dilution on fulfillment are the practical stress tests of the moat.",
        zh: "大规模在手订单/剩余履约义务只有在产能与客户按约转化时才有价值。交付延期、价格让步或履约稀释利润，才是护城河的实际压力测试。",
        evidenceIds: [rpo.id],
        stance: "cautionary",
        confidence: 0.72,
      }),
    );
  }

  return { moats, erosion };
}

export function runValuation(bundle: CompanyBundle): ValuationSection {
  const { quote, evidence } = bundle;
  const pe = quote.peTrailing;
  const peerPe = peerMedianPe(bundle);
  const rpo = evidence.find((e) => e.id === "fin_rpo_backlog");
  const price = quote.price;
  const shares =
    bundle.periods[bundle.periods.length - 1]?.sharesOutstanding ||
    (quote.marketCap && price ? quote.marketCap / price : undefined);

  const hi = quote.fiftyTwoWeekHigh;
  const lo = quote.fiftyTwoWeekLow;
  let peHistoryPercentile: number | undefined;
  if (hi != null && lo != null && hi !== lo) {
    peHistoryPercentile = Math.min(
      0.95,
      Math.max(0.05, (price - lo) / (hi - lo)),
    );
  }

  const vsHistory = makeClaim({
    en:
      peHistoryPercentile != null
        ? `Price sits near the ${(peHistoryPercentile * 100).toFixed(0)}th percentile of its 52-week range ($${lo!.toFixed(0)}–$${hi!.toFixed(0)}). That is a rough proxy for “cheap vs recent trading history,” not intrinsic value. Separate this from forward-optionality judgments.`
        : "52-week range unavailable; historical relative valuation is inconclusive.",
    zh:
      peHistoryPercentile != null
        ? `现价约处于 52 周区间（$${lo!.toFixed(0)}–$${hi!.toFixed(0)}）的第 ${(peHistoryPercentile * 100).toFixed(0)} 百分位。这只是“相对近期交易历史是否便宜”的粗代理，不等于内在价值；需与远期期权价值判断分开。`
        : "缺少 52 周区间，历史相对估值结论不足。",
    evidenceIds: ["price_spot"],
    stance:
      peHistoryPercentile != null && peHistoryPercentile < 0.35
        ? "conditionally_undervalued"
        : peHistoryPercentile != null && peHistoryPercentile > 0.75
          ? "conditionally_overvalued"
          : "fairly_valued",
    confidence: 0.55,
  });

  const peerIds = (bundle.peers || [])
    .map((p) => `peer_${p.ticker}_pe`)
    .filter((id) => evidence.some((e) => e.id === id));
  const vsPeers = makeClaim({
    en:
      pe != null && peerPe != null
        ? `Trailing P/E ${pe.toFixed(1)}x vs peer median ~${peerPe.toFixed(1)}x (${((pe / peerPe - 1) * 100).toFixed(0)}% premium/discount). Peer sets are imperfect — check each peer chip’s Yahoo link for composition and one-off earnings.`
        : pe != null
          ? `Trailing P/E ${pe.toFixed(1)}x; peer set incomplete for a firm relative call.`
          : "Trailing P/E unavailable for peer comparison.",
    zh:
      pe != null && peerPe != null
        ? `滚动 P/E ${pe.toFixed(1)}x，同行中位约 ${peerPe.toFixed(1)}x（相对溢价/折价 ${((pe / peerPe - 1) * 100).toFixed(0)}%）。同行集合并不完美——请点开各同行证据芯片的 Yahoo 链接核对构成与一次性损益。`
        : pe != null
          ? `滚动 P/E ${pe.toFixed(1)}x；同行样本不足，相对估值结论偏弱。`
          : "缺少滚动 P/E，无法做同行对比。",
    evidenceIds: [
      pe != null ? "mult_pe_trailing" : "price_spot",
      ...peerIds,
    ].filter((id, i, arr) => arr.indexOf(id) === i),
    stance:
      pe != null && peerPe != null
        ? pe < peerPe * 0.85
          ? "conditionally_undervalued"
          : pe > peerPe * 1.15
            ? "conditionally_overvalued"
            : "fairly_valued"
        : "neutral",
    confidence: 0.6,
  });

  const latest = bundle.periods[bundle.periods.length - 1];
  const latestNi = latest?.netIncome;
  const todayVsFundamentals = makeClaim({
    en:
      latestNi != null && pe != null
        ? `At $${price.toFixed(2)} and ${pe.toFixed(1)}x trailing earnings, the market is capitalizing already-reported profits of roughly $${(latestNi / 1e9).toFixed(1)}B. Whether that is “cheap today” depends on earnings quality, FCF conversion, and growth durability — not the multiple in isolation.`
        : "Fundamentals-to-price linkage is limited by missing earnings or multiple data.",
    zh:
      latestNi != null && pe != null
        ? `在 $${price.toFixed(2)}、滚动市盈率 ${pe.toFixed(1)}x 下，市场正在资本化约 $${(latestNi / 1e9).toFixed(1)}B 的已报告利润。“今日是否便宜”取决于盈利质量、自由现金流转化与增长可持续性，而非孤立的倍数。`
        : "缺少利润或倍数数据，基本面与价格的衔接有限。",
    evidenceIds: [
      "price_spot",
      ...(latestNi != null ? [`fin_${latest!.period}_net_income`] : []),
      ...(pe != null ? ["mult_pe_trailing"] : []),
    ].filter((id) => evidence.some((e) => e.id === id) || id === "price_spot"),
    stance: "neutral",
    confidence: 0.66,
  });

  const forwardOptionality = rpo
    ? makeClaim({
        en: `Forward optionality hinges on converting disclosed remaining performance obligations / backlog into revenue and margin without chronic FCF dilution from capacity build-out. If fulfillment succeeds, scenario bands (see Bull) can justify prices above today’s quote; if not, treat backlog as marketing, not value.`,
        zh: `远期期权价值取决于披露的剩余履约义务/在手订单能否转化为收入与利润，且不被长期产能开支持续稀释自由现金流。若履约成功，情景区间（见乐观情景）可支持高于现价的合理带；若失败，则应将 backlog 视为宣传而非价值。`,
        evidenceIds: [rpo.id, "price_spot"],
        stance: "conditionally_undervalued",
        confidence: 0.58,
        assumptions: [
          "Backlog conversion rates remain near recent run-rate",
          "Gross margin on incremental capacity does not collapse",
        ],
        assumptionsZh: [
          "在手订单转化率接近近期水平",
          "增量产能毛利率不出现结构性坍塌",
        ],
      })
    : makeClaim({
        en: "No explicit backlog/RPO evidence in the current bundle; frame forward optionality via guidance, segment growth, and capital returns — not a single target price.",
        zh: "当前数据包中无明确 backlog/RPO 证据；远期期权价值应通过指引、分部增长与资本回报来框定，而非单一目标价。",
        evidenceIds: ["price_spot"],
        stance: "neutral",
        confidence: 0.5,
      });

  const scenarios = buildScenarios(bundle, price, shares, pe, rpo?.metricValue);

  return {
    relative: {
      vsHistory,
      vsPeers,
      multiples: {
        pe,
        peHistoryPercentile,
        ps: quote.psTrailing,
        peerMedianPe: peerPe,
      },
    },
    todayVsFundamentals,
    forwardOptionality,
    scenarios,
  };
}

function buildScenarios(
  bundle: CompanyBundle,
  price: number,
  shares: number | undefined,
  pe: number | undefined,
  rpoValue: number | string | undefined,
): Scenario[] {
  const rpoNum = typeof rpoValue === "number" ? rpoValue : undefined;
  const basePe = pe ?? 20;
  const latestNi = bundle.periods[bundle.periods.length - 1]?.netIncome;

  const bearNi = latestNi != null ? latestNi * 0.85 : undefined;
  const baseNi = latestNi;
  const bullNi =
    latestNi != null ? latestNi * (rpoNum ? 1.35 : 1.15) : undefined;

  const priceFrom = (ni: number | undefined, multiple: number) => {
    if (ni == null || !shares || shares <= 0) {
      return { low: price * 0.85, high: price * 1.05 };
    }
    const fair = (ni * multiple) / shares;
    return { low: fair * 0.92, high: fair * 1.08 };
  };

  const bear = priceFrom(bearNi, basePe * 0.85);
  const base = priceFrom(baseNi, basePe);
  const bull = priceFrom(bullNi, basePe * (rpoNum ? 1.1 : 1.0));

  const evidenceIds = [
    "price_spot",
    ...(latestNi
      ? [`fin_${bundle.periods[bundle.periods.length - 1].period}_net_income`]
      : []),
    ...(rpoNum ? ["fin_rpo_backlog"] : []),
    ...(pe != null ? ["mult_pe_trailing"] : []),
  ].filter((id, i, arr) => arr.indexOf(id) === i);

  return [
    {
      name: "Bear",
      nameZh: "悲观",
      narrative:
        "Demand slows, multiples compress, and any backlog converts more slowly than management implies. Equity bears leverage and refinancing risk first.",
      narrativeZh:
        "需求放缓、估值倍数压缩，在手订单转化慢于管理层暗示。股东收益先承受杠杆与再融资风险。",
      assumptions: [
        "Earnings ~15% below latest annualized print",
        "Multiple ~15% below current trailing P/E",
        rpoNum ? "RPO conversion slips" : "No backlog upside",
      ],
      assumptionsZh: [
        "盈利约低于最新年化水平 15%",
        "倍数约低于当前滚动 P/E 15%",
        rpoNum ? "RPO 转化不及预期" : "无在手订单上行",
      ],
      impliedPriceLow: bear.low,
      impliedPriceHigh: bear.high,
      evidenceIds,
    },
    {
      name: "Base",
      nameZh: "基准",
      narrative:
        "Earnings power roughly tracks the latest reported year and the market keeps a similar multiple. This is the ‘business as usual’ anchor, not a recommendation.",
      narrativeZh:
        "盈利能力大致跟踪最新报告年度，市场维持相近倍数。这是“业务照常”锚点，不是买卖建议。",
      assumptions: [
        "Net income near latest fiscal year",
        "Multiple near current trailing P/E",
      ],
      assumptionsZh: ["净利润接近最新财年", "倍数接近当前滚动 P/E"],
      impliedPriceLow: base.low,
      impliedPriceHigh: base.high,
      evidenceIds,
    },
    {
      name: "Bull",
      nameZh: "乐观",
      narrative: rpoNum
        ? `If remaining performance obligations (~$${(rpoNum / 1e9).toFixed(0)}B disclosed) convert with healthy incremental margins, earnings power rises and shares can support ~$${bull.low.toFixed(0)}–$${bull.high.toFixed(0)} vs ~$${price.toFixed(0)} today.`
        : "Growth re-accelerates and the market awards a modestly higher multiple on higher earnings.",
      narrativeZh: rpoNum
        ? `若披露的剩余履约义务（约 $${(rpoNum / 1e9).toFixed(0)}B）以健康增量利润率兑现，盈利能力上升，股价合理带可支撑约 $${bull.low.toFixed(0)}–$${bull.high.toFixed(0)}（相对今日约 $${price.toFixed(0)}）。`
        : "增长重新加速，市场在更高盈利上给予略高倍数。",
      assumptions: [
        rpoNum
          ? "Material RPO/backlog fulfillment succeeds over the multi-year window"
          : "Revenue/earnings grow mid-teens vs latest year",
        "Margins do not structurally deteriorate",
        "Multiple stable to slightly higher",
      ],
      assumptionsZh: [
        rpoNum
          ? "多年窗口内 RPO/在手订单实质性履约成功"
          : "营收/盈利较最新年度实现中双位数增长",
        "利润率不出现结构性恶化",
        "倍数稳定或略升",
      ],
      impliedPriceLow: bull.low,
      impliedPriceHigh: bull.high,
      evidenceIds,
    },
  ];
}

export function runRiskAnalyst(
  bundle: CompanyBundle,
  valuation: ValuationSection,
): RiskSection {
  const factors = [];
  let score = 1;

  const latest = bundle.periods[bundle.periods.length - 1];
  const debtId = latest ? `fin_${latest.period}_debt` : "";
  if (latest?.totalDebt && latest.equity && latest.equity !== 0) {
    const dte = latest.totalDebt / latest.equity;
    if (dte > 5) {
      score += 2;
      factors.push(
        makeClaim({
          en: `Elevated leverage (D/E ~${dte.toFixed(1)}x) raises downside convexity if earnings or refinancing conditions worsen.`,
          zh: `杠杆偏高（D/E ≈ ${dte.toFixed(1)}x），若盈利或再融资条件恶化，下行凸性增大。`,
          evidenceIds: [debtId],
          stance: "cautionary",
          confidence: 0.75,
        }),
      );
    } else if (dte > 2) {
      score += 1;
      factors.push(
        makeClaim({
          en: `Moderate-to-high leverage (D/E ~${dte.toFixed(1)}x) — manageable in base case, material in bear case.`,
          zh: `中高杠杆（D/E ≈ ${dte.toFixed(1)}x）——基准情景可管理，悲观情景下影响显著。`,
          evidenceIds: [debtId],
          stance: "cautionary",
          confidence: 0.7,
        }),
      );
    }
  }

  const riskFiling = bundle.filings.find((f) => /risk/i.test(f.section));
  if (riskFiling) {
    factors.push(
      makeClaim({
        en: "Issuer-disclosed risk factors remain the authoritative qualitative inventory — open the EDGAR link on this evidence chip.",
        zh: "发行人披露的风险因素仍是权威定性清单——请打开本证据芯片上的 EDGAR 链接。",
        evidenceIds: [riskFiling.id],
        stance: "cautionary",
        confidence: 0.8,
      }),
    );
    if (/litigation|going concern|covenant|default/.test(riskFiling.text.toLowerCase())) {
      score += 1;
    }
  }

  if (
    valuation.relative.multiples.peHistoryPercentile != null &&
    valuation.relative.multiples.peHistoryPercentile > 0.85
  ) {
    score += 1;
    factors.push(
      makeClaim({
        en: "Price is near the top of the 52-week range — valuation drawdown risk is higher even if the long-term thesis is intact.",
        zh: "价格接近 52 周区间上沿——即便长期逻辑仍在，估值回撤风险也更高。",
        evidenceIds: ["price_spot"],
        stance: "cautionary",
        confidence: 0.6,
      }),
    );
  }

  const lit = bundle.news.filter(
    (n) => n.category === "litigation" || n.category === "regulatory",
  );
  if (lit.length) {
    score += 1;
    factors.push(
      makeClaim({
        en: "Recent litigation/regulatory headlines add event risk; follow each news evidence link for primary reporting.",
        zh: "近期诉讼/监管头条增加事件风险；请通过各新闻证据链接查阅一手报道。",
        evidenceIds: lit.map((n) => n.id),
        stance: "cautionary",
        confidence: 0.65,
      }),
    );
  }

  const fcf = latest?.freeCashFlow;
  const fcfId = latest ? `fin_${latest.period}_fcf` : "";
  if (fcf != null && fcf < 0) {
    score += 1;
    factors.push(
      makeClaim({
        en: "Negative free cash flow in the latest period — distinguish growth investment from structural cash burn via the financials link.",
        zh: "最近一期自由现金流为负——请通过财务报表链接区分增长投资与结构性烧钱。",
        evidenceIds: [fcfId],
        stance: "cautionary",
        confidence: 0.7,
      }),
    );
  }

  if (!factors.length) {
    factors.push(
      makeClaim({
        en: "No single dominant red flag in the current evidence set; residual market and model risk still apply.",
        zh: "当前证据集中无单一主导红旗；市场与模型残差风险仍在。",
        evidenceIds: ["price_spot"],
        stance: "neutral",
        confidence: 0.5,
      }),
    );
  }

  const level = Math.min(5, Math.max(1, score)) as RiskSection["level"];
  const labels: Record<number, { en: string; zh: string }> = {
    1: { en: "L1 — Lower research risk", zh: "L1 — 研究风险较低" },
    2: { en: "L2 — Moderate", zh: "L2 — 中等" },
    3: { en: "L3 — Elevated", zh: "L3 — 偏高" },
    4: { en: "L4 — High", zh: "L4 — 高" },
    5: { en: "L5 — Severe / binary", zh: "L5 — 严重 / 二元结果" },
  };

  return {
    level,
    label: labels[level].en,
    labelZh: labels[level].zh,
    factors,
  };
}

export function runAdvice(
  bundle: CompanyBundle,
  valuation: ValuationSection,
  risk: RiskSection,
): AdviceSection {
  const bull = valuation.scenarios.find((s) => s.name === "Bull");
  const bear = valuation.scenarios.find((s) => s.name === "Bear");
  const price = bundle.quote.price;

  const conditions: string[] = [];
  const conditionsZh: string[] = [];
  if (bull) {
    conditions.push(
      `Re-evaluate bullishity if price approaches the bull band (~$${bull.impliedPriceLow.toFixed(0)}–$${bull.impliedPriceHigh.toFixed(0)}) without corresponding evidence of backlog/earnings conversion.`,
    );
    conditionsZh.push(
      `若价格接近乐观区间（约 $${bull.impliedPriceLow.toFixed(0)}–$${bull.impliedPriceHigh.toFixed(0)}）却缺乏在手订单/盈利转化证据，应重新评估乐观假设。`,
    );
  }
  if (bear) {
    conditions.push(
      `Stress-test portfolio sizing against the bear band (~$${bear.impliedPriceLow.toFixed(0)}–$${bear.impliedPriceHigh.toFixed(0)}).`,
    );
    conditionsZh.push(
      `用悲观区间（约 $${bear.impliedPriceLow.toFixed(0)}–$${bear.impliedPriceHigh.toFixed(0)}）压力测试仓位规模。`,
    );
  }
  conditions.push(
    "Prefer waiting for confirmatory evidence (orders conversion, margin stability, or multiple mean-reversion) rather than a single headline.",
  );
  conditionsZh.push(
    "宁可等待确认性证据（订单转化、利润率稳定或倍数回归），也不要押注单一头条。",
  );

  const undervaluedLean =
    valuation.forwardOptionality.stance === "conditionally_undervalued" ||
    valuation.relative.vsHistory.stance === "conditionally_undervalued";

  const recommendation = makeClaim({
    en: undervaluedLean
      ? `At ~$${price.toFixed(2)}, the brief finds conditional — not absolute — undervaluation if stated forward assumptions hold. Suitable for investors who underwrite scenario evidence, not slogan-level conviction.`
      : `At ~$${price.toFixed(2)}, the brief does not support an unconditional “cheap” label. Suit investors who need clearer catalysts or a better entry vs scenario bands.`,
    zh: undervaluedLean
      ? `在约 $${price.toFixed(2)}，若远期假设成立，简报认为存在条件性而非绝对低估。适合愿意用情景证据承保的投资者，而非口号式信念。`
      : `在约 $${price.toFixed(2)}，简报不支持无条件的“便宜”标签。更适合需要更清晰催化、或相对情景区间有更好买点的投资者。`,
    evidenceIds: valuation.forwardOptionality.evidenceIds,
    stance: undervaluedLean ? "conditionally_undervalued" : "fairly_valued",
    confidence: 0.55,
    assumptions: valuation.forwardOptionality.assumptions,
    assumptionsZh: valuation.forwardOptionality.assumptionsZh,
  });

  const investorFit =
    risk.level >= 4
      ? "Higher-risk / speculative research sleeve only; size small."
      : risk.level >= 3
        ? "Active investors comfortable with narrative + leverage/execution risk."
        : "Longer-horizon fundamental investors who read evidence, not tips.";
  const investorFitZh =
    risk.level >= 4
      ? "仅适合高风险/投机研究仓；仓位宜小。"
      : risk.level >= 3
        ? "能接受叙事 + 杠杆/执行风险的主动投资者。"
        : "阅读证据、而非听消息的长线基本面投资者。";

  return {
    investorFit,
    investorFitZh,
    conditions,
    conditionsZh,
    recommendation,
    disclaimer:
      "Research tool only — not investment advice, not an offer to buy or sell securities. Verify all figures against primary filings and your own model.",
    disclaimerZh:
      "仅供研究工具使用——不构成投资建议，也不构成买卖要约。请对照原始披露与自建模型核对所有数字。",
  };
}
