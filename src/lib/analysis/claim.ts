import type { Claim, ClaimStance } from "../types";

export function makeClaim(input: {
  en: string;
  zh: string;
  evidenceIds: string[];
  stance?: ClaimStance;
  confidence?: number;
  assumptions?: string[];
  assumptionsZh?: string[];
}): Claim {
  return {
    claim: input.en,
    claimZh: input.zh,
    stance: input.stance ?? "neutral",
    confidence: input.confidence ?? 0.65,
    evidenceIds: input.evidenceIds,
    assumptions: input.assumptions,
    assumptionsZh: input.assumptionsZh,
  };
}

export function pickText(locale: "en" | "zh", en: string, zh?: string) {
  return locale === "zh" && zh ? zh : en;
}

export function pickClaimText(locale: "en" | "zh", c: Claim) {
  return pickText(locale, c.claim, c.claimZh);
}

export function pickAssumptions(locale: "en" | "zh", c: Claim) {
  if (locale === "zh" && c.assumptionsZh?.length) return c.assumptionsZh;
  return c.assumptions ?? [];
}
