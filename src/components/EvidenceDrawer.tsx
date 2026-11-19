"use client";

import type { Evidence } from "@/lib/types";
import { useLocale } from "./LocaleProvider";

export function EvidenceDrawer({
  open,
  onClose,
  items,
  highlightId,
}: {
  open: boolean;
  onClose: () => void;
  items: Evidence[];
  highlightId?: string | null;
}) {
  const { locale, t } = useLocale();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label={t("close")}
        className="absolute inset-0 bg-[rgba(28,24,20,0.35)] backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-[var(--line)] bg-[var(--surface)] shadow-[-12px_0_40px_rgba(28,24,20,0.12)] animate-slide-in">
        <header className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
              {t("evidence")}
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
              {t("sourcesFigures")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--wash)] hover:text-[var(--ink)]"
          >
            {t("close")}
          </button>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">{t("noEvidence")}</p>
          ) : (
            items.map((e) => {
              const title = locale === "zh" ? e.titleZh || e.title : e.title;
              const snippet =
                locale === "zh" ? e.snippetZh || e.snippet : e.snippet;
              const access =
                locale === "zh"
                  ? e.accessLabelZh || e.accessLabel
                  : e.accessLabel;
              return (
                <article
                  key={e.id}
                  className={`rounded-lg border px-4 py-3 transition-colors ${
                    highlightId === e.id
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[var(--line)] bg-[var(--wash)]"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                      {e.source} · {t("asOf")} {e.asOf}
                    </span>
                    {e.metricValue != null && (
                      <span className="font-mono text-xs text-[var(--ink)]">
                        {typeof e.metricValue === "number"
                          ? e.metricKey?.toLowerCase().includes("margin")
                            ? `${(e.metricValue * 100).toFixed(1)}%`
                            : e.metricValue > 1e6
                              ? formatCompact(e.metricValue)
                              : e.metricValue.toFixed(2)
                          : String(e.metricValue)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-[var(--ink)]">
                    {title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--body)]">
                    {snippet}
                  </p>
                  <div className="mt-3 space-y-1 border-t border-[var(--line)]/80 pt-2">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                      {t("accessChannel")}
                    </p>
                    <p className="text-xs text-[var(--body)]">{access}</p>
                    <a
                      href={e.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] underline-offset-2 hover:underline break-all"
                    >
                      {t("openSource")} ↗
                      <span className="font-normal text-[var(--muted)]">
                        {truncateUrl(e.url)}
                      </span>
                    </a>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
}

function truncateUrl(url: string) {
  try {
    const u = new URL(url);
    return u.hostname + (u.pathname.length > 24 ? u.pathname.slice(0, 24) + "…" : u.pathname);
  } catch {
    return url.slice(0, 48);
  }
}

function formatCompact(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return String(n);
}
