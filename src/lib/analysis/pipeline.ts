import type { EquityBriefing, StreamEvent } from "../types";
import { collectCompanyBundle } from "../data/collector";
import { getBriefingCache, setBriefingCache } from "../cache";
import { runEditor } from "./editor";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function* generateBriefingStream(
  tickerOrName: string,
  opts?: { bypassCache?: boolean },
): AsyncGenerator<StreamEvent> {
  try {
    yield { type: "status", message: "Resolving company & loading cache…", messageZh: "正在解析公司并检查缓存…" };

    if (!opts?.bypassCache) {
      // Peek resolve via collect (also caches bundle)
    }

    yield { type: "status", message: "Collecting financials, filings, and news…", messageZh: "正在采集财报、披露与新闻…" };
    const { bundle, fromCache: bundleFromCache } = await collectCompanyBundle(
      tickerOrName,
      opts,
    );

    const cachedBriefing = opts?.bypassCache
      ? null
      : await getBriefingCache(bundle.identity.ticker);

    if (cachedBriefing) {
      yield {
        type: "meta",
        identity: cachedBriefing.identity,
        quote: cachedBriefing.quote,
        generatedAt: cachedBriefing.generatedAt,
        fromCache: true,
      };
      yield { type: "evidence", evidence: Object.values(cachedBriefing.evidence) };
      yield { type: "section", key: "profile", data: cachedBriefing.profile };
      yield { type: "section", key: "quant", data: cachedBriefing.quant };
      yield { type: "section", key: "news", data: cachedBriefing.news };
      yield { type: "section", key: "moat", data: cachedBriefing.moat };
      yield { type: "section", key: "valuation", data: cachedBriefing.valuation };
      yield { type: "section", key: "risk", data: cachedBriefing.risk };
      yield { type: "section", key: "advice", data: cachedBriefing.advice };
      yield { type: "done", briefing: cachedBriefing };
      return;
    }

    yield {
      type: "meta",
      identity: bundle.identity,
      quote: bundle.quote,
      generatedAt: new Date().toISOString(),
      fromCache: bundleFromCache,
    };
    yield { type: "evidence", evidence: bundle.evidence };
    await sleep(200);

    yield { type: "status", message: "Quant analyst reviewing statements…", messageZh: "定量分析师正在审阅报表…" };
    const briefing: EquityBriefing = runEditor(bundle);
    await sleep(150);
    yield { type: "section", key: "quant", data: briefing.quant };

    yield { type: "status", message: "Qual analyst reading disclosures…", messageZh: "定性分析师正在阅读披露…" };
    await sleep(150);
    yield { type: "section", key: "profile", data: briefing.profile };

    yield { type: "status", message: "Clustering news catalysts…", messageZh: "正在聚类新闻催化…" };
    await sleep(120);
    yield { type: "section", key: "news", data: briefing.news };

    yield { type: "status", message: "Mapping moats…", messageZh: "正在绘制护城河…" };
    await sleep(120);
    yield { type: "section", key: "moat", data: briefing.moat };

    yield { type: "status", message: "Building valuation scenarios…", messageZh: "正在构建估值情景…" };
    await sleep(150);
    yield { type: "section", key: "valuation", data: briefing.valuation };

    yield { type: "status", message: "Scoring risk & drafting conditional advice…", messageZh: "正在评级风险并起草条件化建议…" };
    await sleep(120);
    yield { type: "section", key: "risk", data: briefing.risk };
    yield { type: "section", key: "advice", data: briefing.advice };

    await setBriefingCache(bundle.identity.ticker, briefing);
    yield { type: "done", briefing };
  } catch (err) {
    yield {
      type: "error",
      message: err instanceof Error ? err.message : "Failed to generate briefing",
      messageZh: err instanceof Error ? err.message : "生成简报失败",
    };
  }
}
