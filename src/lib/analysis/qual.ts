import type { Claim, CompanyBundle, NewsSection, QualSection } from "../types";
import { makeClaim } from "./claim";

export function runQualAnalyst(bundle: CompanyBundle): QualSection {
  const { identity, filings, evidence } = bundle;
  const ids = new Set(evidence.map((e) => e.id));

  const biz = filings.find((f) => /business|culture/i.test(f.section));
  const risk = filings.find((f) => /risk/i.test(f.section));
  const mda = filings.find((f) => /md&a|remaining performance|backlog/i.test(f.section));
  const profileId = ids.has("profile_description")
    ? "profile_description"
    : biz?.id;

  const history: Claim[] = [];
  const culture: Claim[] = [];
  const segments: Claim[] = [];

  if (profileId) {
    history.push(
      makeClaim({
        en: `${identity.name} (${identity.ticker}) is positioned in ${identity.industry || identity.sector || "its listed industry"}. The working description below is anchored to profile/filing evidence — use the access link to read the primary source rather than relying on secondary summaries.`,
        zh: `${identity.name}（${identity.ticker}）定位于 ${identity.industry || identity.sector || "其所属行业"}。以下业务描述以公司画像/披露证据为准——请通过访问链接阅读一手来源，勿仅依赖二手摘要。`,
        evidenceIds: [profileId],
        stance: "neutral",
        confidence: 0.72,
      }),
    );
    if (identity.description) {
      history.push(
        makeClaim({
          en: `Business snapshot: ${identity.description}`,
          zh: `业务速写：${identity.descriptionZh || identity.description}`,
          evidenceIds: [profileId],
          stance: "neutral",
          confidence: 0.7,
        }),
      );
    }
  }

  if (biz) {
    culture.push(
      makeClaim({
        en: `From ${biz.form} (${biz.section}, filed ${biz.filedAt}): the issuer describes how it competes and operates. Treat cultural language as a hypothesis to test against customer retention, pricing, and capital allocation — not as proof by itself.`,
        zh: `摘自 ${biz.form}（${biz.section}，提交于 ${biz.filedAt}）：发行人自述竞争方式与经营方式。应将“文化表述”视为待验证假设，对照客户留存、定价与资本配置，而非单独作为证据定论。`,
        evidenceIds: [biz.id],
        stance: "supportive",
        confidence: 0.64,
      }),
    );
    culture.push(
      makeClaim({
        en: `Excerpt highlight: “${biz.text.slice(0, 220)}${biz.text.length > 220 ? "…" : ""}”`,
        zh: `原文摘录：“${biz.text.slice(0, 220)}${biz.text.length > 220 ? "…" : ""}”`,
        evidenceIds: [biz.id],
        stance: "neutral",
        confidence: 0.7,
      }),
    );
    const text = biz.text.toLowerCase();
    if (/customer|dealer|ecosystem|relationship|engineering|privacy|design|reliability/.test(text)) {
      culture.push(
        makeClaim({
          en: "Recurring themes in the disclosure — customer relationships, engineering/reliability, ecosystem, or dealer networks — are consistent with switching-cost or ecosystem moat candidates, but permanence still depends on execution and competitive response.",
          zh: "披露中反复出现的客户关系、工程/可靠性、生态或经销网络等主题，与转换成本或生态型护城河候选一致；但能否持久仍取决于执行与竞争反应。",
          evidenceIds: [biz.id],
          stance: "supportive",
          confidence: 0.6,
        }),
      );
    }
  }

  if (risk) {
    history.push(
      makeClaim({
        en: `Risk Factors (${risk.form}, ${risk.filedAt}) are the issuer’s own inventory of material uncertainties. Start qualitative risk work here before importing sell-side narratives.`,
        zh: `风险因素（${risk.form}，${risk.filedAt}）是发行人自行列示的重大不确定性清单。定性风险分析应优先阅读此处，再参考卖方叙事。`,
        evidenceIds: [risk.id],
        stance: "cautionary",
        confidence: 0.82,
      }),
    );
    history.push(
      makeClaim({
        en: `Risk excerpt: “${risk.text.slice(0, 240)}${risk.text.length > 240 ? "…" : ""}”`,
        zh: `风险摘录：“${risk.text.slice(0, 240)}${risk.text.length > 240 ? "…" : ""}”`,
        evidenceIds: [risk.id],
        stance: "cautionary",
        confidence: 0.75,
      }),
    );
  }

  if (mda) {
    segments.push(
      makeClaim({
        en: `MD&A / backlog disclosure (${mda.section}) can clarify how contracted demand may translate into future revenue. Read conversion timing assumptions carefully.`,
        zh: `管理层讨论/在手订单披露（${mda.section}）有助于理解签约需求如何转化为未来收入。请仔细阅读转化时点假设。`,
        evidenceIds: [mda.id],
        stance: "neutral",
        confidence: 0.68,
      }),
    );
  }

  if (identity.industry || identity.sector) {
    segments.push(
      makeClaim({
        en: `Tagged industry/sector: ${identity.industry || "n/a"} / ${identity.sector || "n/a"}. For true segment mix (revenue, margin by division), open the latest 10-K notes via the EDGAR access channel on related evidence.`,
        zh: `行业/板块标签：${identity.industry || "无"} / ${identity.sector || "无"}。真实分部收入与利润率需通过相关证据中的 EDGAR 访问渠道查阅最新 10-K 附注。`,
        evidenceIds: [profileId || risk?.id || "price_spot"].filter(Boolean) as string[],
        stance: "neutral",
        confidence: 0.58,
      }),
    );
  }

  if (!culture.length) {
    culture.push(
      makeClaim({
        en: "Culture signals are limited without extracted 10-K excerpts; use the EDGAR company link in evidence to read Business and MD&A directly.",
        zh: "缺少 10-K 摘录时，文化信号有限；请使用证据中的 EDGAR 公司链接直接阅读 Business 与 MD&A。",
        evidenceIds: [filings[0]?.id || "price_spot"],
        stance: "neutral",
        confidence: 0.4,
      }),
    );
  }

  return { history, culture, segments };
}

const CATEGORY_LABEL: Record<string, { en: string; zh: string }> = {
  product: { en: "Product & technology", zh: "产品与技术" },
  litigation: { en: "Litigation", zh: "诉讼" },
  regulatory: { en: "Regulatory", zh: "监管" },
  orders: { en: "Orders & backlog", zh: "订单与在手合同" },
  buyback: { en: "Capital return", zh: "资本回报" },
  earnings: { en: "Earnings & guidance", zh: "业绩与指引" },
  other: { en: "Other catalysts", zh: "其他催化" },
};

export function runNewsAnalyst(bundle: CompanyBundle): NewsSection {
  const byCat = new Map<string, typeof bundle.news>();
  for (const item of bundle.news) {
    const list = byCat.get(item.category) || [];
    list.push(item);
    byCat.set(item.category, list);
  }

  const clusters = [...byCat.entries()].map(([category, items]) => {
    const top = items[0];
    const label = CATEGORY_LABEL[category] || CATEGORY_LABEL.other;
    const takeaway = makeClaim({
      en:
        items.length > 1
          ? `${items.length} recent items under “${label.en}”. Lead story: “${top.title}” (${top.publishedAt}, ${top.source}). Open each evidence chip for the article or Yahoo news channel.`
          : `Catalyst under “${label.en}”: “${top.title}” (${top.publishedAt}). Use the evidence link to read the full item.`,
      zh:
        items.length > 1
          ? `“${label.zh}”主题下有 ${items.length} 条近期信息。头条：“${top.title}”（${top.publishedAt}，${top.source}）。点击证据芯片可打开原文或 Yahoo 新闻渠道。`
          : `“${label.zh}”催化：“${top.title}”（${top.publishedAt}）。请通过证据链接阅读全文。`,
      evidenceIds: items.map((i) => i.id),
      stance:
        category === "litigation" || category === "regulatory"
          ? "cautionary"
          : category === "orders"
            ? "supportive"
            : "neutral",
      confidence: 0.62,
    });
    return {
      category: category as (typeof items)[0]["category"],
      label: label.en,
      labelZh: label.zh,
      items,
      takeaway,
    };
  });

  clusters.sort((a, b) => b.items.length - a.items.length);
  return { clusters };
}
