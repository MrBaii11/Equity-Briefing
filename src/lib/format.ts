import type { Claim, Evidence } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

export function formatMoney(n?: number, digits = 2) {
  if (n == null || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(digits)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(digits)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  return `${sign}$${abs.toFixed(digits)}`;
}

export function formatPct(n?: number) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

export function stanceLabel(stance: Claim["stance"], locale: Locale = "en") {
  const en: Record<Claim["stance"], string> = {
    supportive: "Supportive",
    cautionary: "Caution",
    conditionally_undervalued: "Conditionally undervalued",
    conditionally_overvalued: "Conditionally overvalued",
    fairly_valued: "Fairly valued",
    neutral: "Neutral",
  };
  const zh: Record<Claim["stance"], string> = {
    supportive: "偏正面",
    cautionary: "需谨慎",
    conditionally_undervalued: "条件性低估",
    conditionally_overvalued: "条件性高估",
    fairly_valued: "大致合理",
    neutral: "中性",
  };
  return (locale === "zh" ? zh : en)[stance];
}

export function resolveEvidence(
  ids: string[],
  map: Record<string, Evidence>,
): Evidence[] {
  return ids.map((id) => map[id]).filter(Boolean);
}
