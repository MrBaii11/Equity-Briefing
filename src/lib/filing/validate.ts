import type { FilingExtract } from "../types";

export type ValidationResult = {
  extract: FilingExtract;
  issues: string[];
  issuesZh: string[];
};

function approxEqual(a: number, b: number, tol = 0.08) {
  if (b === 0) return Math.abs(a) < 1;
  return Math.abs(a - b) / Math.abs(b) <= tol;
}

/** Soft validation — never invent numbers; demote confidence and warn. */
export function validateExtract(extract: FilingExtract): ValidationResult {
  const issues: string[] = [];
  const issuesZh: string[] = [];
  const periods = extract.periods.map((p) => ({ ...p }));

  for (const p of periods) {
    if (p.revenue != null && p.grossProfit != null && p.grossProfit > p.revenue * 1.05) {
      issues.push(`${p.period}: gross profit exceeds revenue — row may be mis-parsed.`);
      issuesZh.push(`${p.period}：毛利高于营收——可能误读行项目。`);
      p.grossProfit = undefined;
    }
    if (
      p.operatingCashFlow != null &&
      p.capex != null &&
      p.freeCashFlow != null &&
      !approxEqual(p.freeCashFlow, p.operatingCashFlow + p.capex, 0.12)
    ) {
      issues.push(`${p.period}: FCF does not reconcile to OCF + Capex within tolerance.`);
      issuesZh.push(`${p.period}：自由现金流与经营现金流+资本开支勾稽偏差偏大。`);
    }
    if (p.revenue != null && p.revenue < 0) {
      issues.push(`${p.period}: negative revenue discarded.`);
      issuesZh.push(`${p.period}：负营收已丢弃。`);
      p.revenue = undefined;
    }
  }

  let parseConfidence = extract.parseConfidence;
  if (issues.length >= 2 && parseConfidence === "high") parseConfidence = "medium";
  if (issues.length >= 4) parseConfidence = "low";

  return {
    extract: {
      ...extract,
      periods,
      parseConfidence,
      warnings: [...extract.warnings, ...issues],
      warningsZh: [...extract.warningsZh, ...issuesZh],
    },
    issues,
    issuesZh,
  };
}
