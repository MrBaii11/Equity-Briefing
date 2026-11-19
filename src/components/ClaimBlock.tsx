"use client";

import type { Claim, Evidence } from "@/lib/types";
import { pickAssumptions, pickClaimText } from "@/lib/analysis/claim";
import { stanceLabel } from "@/lib/format";
import { useLocale } from "./LocaleProvider";

export function ClaimBlock({
  claim,
  evidenceMap,
  onOpenEvidence,
}: {
  claim: Claim;
  evidenceMap: Record<string, Evidence>;
  onOpenEvidence: (ids: string[]) => void;
}) {
  const { locale, t } = useLocale();
  const chips = claim.evidenceIds
    .map((id) => evidenceMap[id])
    .filter(Boolean);
  const assumptions = pickAssumptions(locale, claim);

  return (
    <div className="space-y-2">
      <p className="text-[15px] leading-relaxed text-[var(--body)]">
        {pickClaimText(locale, claim)}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
          {stanceLabel(claim.stance, locale)} · {t("conf")}{" "}
          {(claim.confidence * 100).toFixed(0)}%
        </span>
        {chips.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => onOpenEvidence(claim.evidenceIds)}
            className="evidence-chip"
            title={`${locale === "zh" ? e.titleZh || e.title : e.title} → ${locale === "zh" ? e.accessLabelZh || e.accessLabel : e.accessLabel}`}
          >
            {e.source}
            {e.metricKey ? ` · ${e.metricKey}` : ""}
          </button>
        ))}
        {chips[0] && (
          <a
            href={chips[0].url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[var(--accent)] underline-offset-2 hover:underline"
            onClick={(ev) => ev.stopPropagation()}
          >
            {t("openSource")} ↗
          </a>
        )}
      </div>
      {assumptions.length > 0 && (
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-[var(--muted)]">
          {assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
