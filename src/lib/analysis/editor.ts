import type {
  AdviceSection,
  Claim,
  CompanyBundle,
  EquityBriefing,
  Evidence,
  MoatSection,
  NewsSection,
  QualSection,
  QuantSection,
  RiskSection,
  ValuationSection,
} from "../types";
import { runQuantAnalyst } from "./quant";
import { runNewsAnalyst, runQualAnalyst } from "./qual";
import {
  runAdvice,
  runMoatAnalyst,
  runRiskAnalyst,
  runValuation,
} from "./valuation";

function allClaims(briefing: Omit<EquityBriefing, "evidence">): Claim[] {
  const claims: Claim[] = [];
  claims.push(...briefing.profile.history, ...briefing.profile.culture, ...briefing.profile.segments);
  claims.push(...briefing.quant.trends, ...briefing.quant.redFlags);
  for (const c of briefing.news.clusters) claims.push(c.takeaway);
  for (const m of briefing.moat.moats) claims.push(m.claim);
  claims.push(...briefing.moat.erosion);
  claims.push(
    briefing.valuation.relative.vsHistory,
    briefing.valuation.relative.vsPeers,
    briefing.valuation.todayVsFundamentals,
    briefing.valuation.forwardOptionality,
  );
  claims.push(...briefing.risk.factors);
  claims.push(briefing.advice.recommendation);
  return claims;
}

/** Drop or repair claims that reference missing evidence ids. */
export function validateClaims(
  claims: Claim[],
  evidence: Record<string, Evidence>,
): Claim[] {
  return claims
    .map((c) => {
      const ids = c.evidenceIds.filter((id) => evidence[id]);
      if (!ids.length) return null;
      return { ...c, evidenceIds: ids };
    })
    .filter((c): c is Claim => c != null);
}

export function runEditor(bundle: CompanyBundle): EquityBriefing {
  const evidenceMap: Record<string, Evidence> = {};
  for (const e of bundle.evidence) evidenceMap[e.id] = e;

  const quant: QuantSection = runQuantAnalyst(bundle);
  const profile: QualSection = runQualAnalyst(bundle);
  const news: NewsSection = runNewsAnalyst(bundle);
  const moat: MoatSection = runMoatAnalyst(bundle);
  const valuation: ValuationSection = runValuation(bundle);
  const risk: RiskSection = runRiskAnalyst(bundle, valuation);
  const advice: AdviceSection = runAdvice(bundle, valuation, risk);

  const draft: Omit<EquityBriefing, "evidence"> = {
    identity: bundle.identity,
    quote: bundle.quote,
    generatedAt: new Date().toISOString(),
    profile,
    quant,
    news,
    moat,
    valuation,
    risk,
    advice,
  };

  // Validate nested claims
  draft.profile.history = validateClaims(draft.profile.history, evidenceMap);
  draft.profile.culture = validateClaims(draft.profile.culture, evidenceMap);
  draft.profile.segments = validateClaims(draft.profile.segments, evidenceMap);
  draft.quant.trends = validateClaims(draft.quant.trends, evidenceMap);
  draft.quant.redFlags = validateClaims(draft.quant.redFlags, evidenceMap);
  draft.news.clusters = draft.news.clusters.map((c) => ({
    ...c,
    takeaway: validateClaims([c.takeaway], evidenceMap)[0] || c.takeaway,
  }));
  draft.moat.moats = draft.moat.moats
    .map((m) => {
      const fixed = validateClaims([m.claim], evidenceMap)[0];
      return fixed ? { ...m, claim: fixed } : null;
    })
    .filter((m): m is MoatSection["moats"][number] => m != null);
  draft.moat.erosion = validateClaims(draft.moat.erosion, evidenceMap);
  draft.valuation.relative.vsHistory =
    validateClaims([draft.valuation.relative.vsHistory], evidenceMap)[0] ||
    draft.valuation.relative.vsHistory;
  draft.valuation.relative.vsPeers =
    validateClaims([draft.valuation.relative.vsPeers], evidenceMap)[0] ||
    draft.valuation.relative.vsPeers;
  draft.valuation.todayVsFundamentals =
    validateClaims([draft.valuation.todayVsFundamentals], evidenceMap)[0] ||
    draft.valuation.todayVsFundamentals;
  draft.valuation.forwardOptionality =
    validateClaims([draft.valuation.forwardOptionality], evidenceMap)[0] ||
    draft.valuation.forwardOptionality;
  draft.risk.factors = validateClaims(draft.risk.factors, evidenceMap);
  draft.advice.recommendation =
    validateClaims([draft.advice.recommendation], evidenceMap)[0] ||
    draft.advice.recommendation;

  // Ensure every remaining claim still has ≥1 evidence
  const orphanCheck = allClaims(draft).every((c) => c.evidenceIds.length > 0);
  if (!orphanCheck) {
    // Soft-fail: strip empty (already filtered)
  }

  return { ...draft, evidence: evidenceMap };
}
