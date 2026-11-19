"use client";

import type { DeckSlide, Evidence, FilingDeckMeta } from "@/lib/types";
import { ClaimBlock } from "./ClaimBlock";
import { BarChart } from "./Charts";
import { useLocale } from "./LocaleProvider";
import { pickText } from "@/lib/analysis/claim";

export function DeckViewer({
  meta,
  slides,
  activeIndex,
  onSelect,
  evidenceMap,
  onOpenEvidence,
  loading,
}: {
  meta?: FilingDeckMeta;
  slides: DeckSlide[];
  activeIndex: number;
  onSelect: (index: number) => void;
  evidenceMap: Record<string, Evidence>;
  onOpenEvidence: (ids: string[]) => void;
  loading?: boolean;
}) {
  const { locale, t } = useLocale();
  const slide = slides[activeIndex];

  return (
    <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
      <nav className="space-y-1 lg:sticky lg:top-4 lg:self-start">
        <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
          {t("deckPages")}
        </p>
        {slides.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.index)}
            className={`flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left text-xs transition ${
              s.index === activeIndex
                ? "bg-[var(--ink)] text-[var(--surface)]"
                : "text-[var(--body)] hover:bg-[var(--wash)]"
            }`}
          >
            <span className="font-mono opacity-70">
              {String(s.index + 1).padStart(2, "0")}
            </span>
            <span className="leading-snug">
              {locale === "zh" ? s.titleZh : s.title}
            </span>
          </button>
        ))}
        {loading && (
          <p className="animate-pulse-soft pt-2 text-[11px] text-[var(--muted)]">
            {t("generating")}
          </p>
        )}
      </nav>

      <div className="min-w-0">
        {meta && (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
            <span className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1">
              {meta.form || "Filing"}
              {meta.periodLabel ? ` · ${meta.periodLabel}` : ""}
            </span>
            <span className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1">
              {t("parseConfidence")}: {meta.parseConfidence}
            </span>
            {meta.pageCount != null && (
              <span>
                {meta.pageCount} {t("pages")}
              </span>
            )}
          </div>
        )}

        {!slide ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)]/70">
            <p className="text-sm text-[var(--muted)]">{t("waitingSlides")}</p>
          </div>
        ) : (
          <article className="animate-fade-up overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_20px_50px_rgba(28,24,20,0.06)]">
            <div className="border-b border-[var(--line)] bg-[linear-gradient(135deg,rgba(30,95,80,0.08),transparent_55%)] px-6 py-5 sm:px-8 sm:py-6">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                {String(slide.index + 1).padStart(2, "0")} /{" "}
                {String(Math.max(slides.length, slide.index + 1)).padStart(2, "0")} ·{" "}
                {locale === "zh" ? slide.titleZh : slide.title}
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl leading-snug text-[var(--ink)] sm:text-3xl">
                {locale === "zh" ? slide.headlineZh : slide.headline}
              </h2>
            </div>

            <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
              {slide.kind === "cover" && (
                <p className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)] sm:text-5xl">
                  {locale === "zh" ? slide.headlineZh : slide.headline}
                </p>
              )}

              {slide.table && (
                <div className="overflow-x-auto rounded-lg border border-[var(--line)]">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-[var(--wash)] text-[11px] uppercase tracking-[0.1em] text-[var(--muted)]">
                      <tr>
                        {(locale === "zh"
                          ? slide.table.columnsZh
                          : slide.table.columns
                        ).map((c) => (
                          <th key={c} className="px-3 py-2 font-medium">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {slide.table.rows.map((row, ri) => (
                        <tr
                          key={ri}
                          className="border-t border-[var(--line)] text-[var(--body)]"
                        >
                          {row.map((cell, ci) => (
                            <td
                              key={ci}
                              className={`px-3 py-2 ${ci === 0 ? "text-[var(--ink)]" : "font-mono text-xs"}`}
                            >
                              {cell == null ? "—" : String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {slide.charts && slide.charts.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {slide.charts.map((c) => (
                    <BarChart
                      key={c.id}
                      title={locale === "zh" ? c.titleZh : c.title}
                      series={c.points}
                      format={c.format || "money"}
                      color={c.color}
                    />
                  ))}
                </div>
              )}

              {slide.pairs && slide.pairs.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  {slide.pairs.map((pair, i) => (
                    <div key={i} className="grid gap-3 md:col-span-2 md:grid-cols-2">
                      <div className="rounded-lg border border-[var(--line)] bg-[var(--wash)]/60 p-4">
                        <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                          {t("mgmtNarrative")}
                        </p>
                        <ClaimBlock
                          claim={pair.management}
                          evidenceMap={evidenceMap}
                          onOpenEvidence={onOpenEvidence}
                        />
                      </div>
                      <div className="rounded-lg border border-[var(--line)] bg-[var(--wash)]/60 p-4">
                        <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                          {t("numbersCheck")}
                        </p>
                        <ClaimBlock
                          claim={pair.numbers}
                          evidenceMap={evidenceMap}
                          onOpenEvidence={onOpenEvidence}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {slide.bullets && slide.bullets.length > 0 && (
                <div className="space-y-4">
                  {slide.bullets.map((b, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-[var(--line)] bg-[var(--wash)]/40 px-4 py-3"
                    >
                      <ClaimBlock
                        claim={b}
                        evidenceMap={evidenceMap}
                        onOpenEvidence={onOpenEvidence}
                      />
                    </div>
                  ))}
                </div>
              )}

              {(slide.footnotes?.length || slide.footnotesZh?.length) && (
                <p className="text-xs text-[var(--muted)]">
                  {pickText(locale, slide.footnotes?.[0] || "", slide.footnotesZh?.[0])}
                </p>
              )}
            </div>

            <footer className="flex items-center justify-between border-t border-[var(--line)] px-6 py-3 sm:px-8">
              <button
                type="button"
                className="btn-secondary"
                disabled={activeIndex <= 0}
                onClick={() => onSelect(Math.max(0, activeIndex - 1))}
              >
                ← {t("prevSlide")}
              </button>
              <button
                type="button"
                className="text-xs text-[var(--accent)] underline-offset-2 hover:underline"
                onClick={() => onOpenEvidence(slide.evidenceIds)}
              >
                {t("slideEvidence")}
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={activeIndex >= slides.length - 1}
                onClick={() =>
                  onSelect(Math.min(slides.length - 1, activeIndex + 1))
                }
              >
                {t("nextSlide")} →
              </button>
            </footer>
          </article>
        )}
      </div>
    </div>
  );
}
