"use client";

import { formatMoney, formatPct } from "@/lib/format";

type SeriesPoint = { label: string; value: number };

export function BarChart({
  title,
  series,
  color = "var(--accent)",
  format = "money",
}: {
  title: string;
  series: SeriesPoint[];
  color?: string;
  format?: "money" | "pct" | "number";
}) {
  const values = series.map((s) => s.value);
  const max = Math.max(...values.map(Math.abs), 1);
  const fmt = (v: number) =>
    format === "money"
      ? formatMoney(v)
      : format === "pct"
        ? formatPct(v)
        : v.toFixed(1);

  if (!series.length) return null;

  return (
    <div className="border border-[var(--line)] bg-[var(--wash)]/50 px-4 py-3">
      <p className="mb-3 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
        {title}
      </p>
      <div className="flex h-40 items-end gap-2">
        {series.map((s) => {
          const h = Math.max(8, (Math.abs(s.value) / max) * 100);
          return (
            <div key={s.label} className="flex flex-1 flex-col items-center gap-1">
              <span className="font-mono text-[10px] text-[var(--muted)]">
                {fmt(s.value)}
              </span>
              <div
                className="w-full max-w-[48px] rounded-t-sm transition-all duration-500"
                style={{
                  height: `${h}%`,
                  background: s.value < 0 ? "var(--warn)" : color,
                  minHeight: 8,
                }}
                title={`${s.label}: ${fmt(s.value)}`}
              />
              <span className="text-[10px] text-[var(--ink)]">{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PriceRangeMeter({
  title,
  low,
  high,
  price,
}: {
  title: string;
  low?: number;
  high?: number;
  price: number;
}) {
  if (low == null || high == null || high === low) return null;
  const pct = Math.min(1, Math.max(0, (price - low) / (high - low)));

  return (
    <div className="border border-[var(--line)] bg-[var(--wash)]/50 px-4 py-3">
      <p className="mb-3 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
        {title}
      </p>
      <div className="relative mt-2 h-3 rounded-full bg-[linear-gradient(90deg,#a14a2e33,#1e5f5033)]">
        <div
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--ink)] bg-[var(--surface)] shadow-sm transition-all duration-700"
          style={{ left: `${pct * 100}%` }}
        />
      </div>
      <div className="mt-3 flex justify-between font-mono text-xs text-[var(--muted)]">
        <span>${low.toFixed(0)}</span>
        <span className="font-medium text-[var(--ink)]">${price.toFixed(2)}</span>
        <span>${high.toFixed(0)}</span>
      </div>
    </div>
  );
}

export function ScenarioChart({
  title,
  spot,
  scenarios,
}: {
  title: string;
  spot: number;
  scenarios: { name: string; low: number; high: number }[];
}) {
  const all = [spot, ...scenarios.flatMap((s) => [s.low, s.high])];
  const min = Math.min(...all) * 0.92;
  const max = Math.max(...all) * 1.08;
  const span = max - min || 1;
  const x = (v: number) => ((v - min) / span) * 100;

  return (
    <div className="border border-[var(--line)] bg-[var(--wash)]/50 px-4 py-3">
      <p className="mb-4 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
        {title}
      </p>
      <div className="space-y-3">
        <div className="relative h-8">
          <div className="absolute inset-x-0 top-1/2 h-px bg-[var(--line)]" />
          <div
            className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-[var(--ink)]"
            style={{ left: `${x(spot)}%` }}
            title={`Spot $${spot.toFixed(0)}`}
          />
          <span
            className="absolute top-0 -translate-x-1/2 text-[10px] font-medium text-[var(--ink)]"
            style={{ left: `${x(spot)}%` }}
          >
            Spot
          </span>
        </div>
        {scenarios.map((s) => (
          <div key={s.name} className="flex items-center gap-3">
            <span className="w-14 shrink-0 text-xs text-[var(--muted)]">{s.name}</span>
            <div className="relative h-3 flex-1 rounded-full bg-[var(--line)]/50">
              <div
                className="absolute top-0 h-3 rounded-full bg-[var(--accent)]/70"
                style={{
                  left: `${x(s.low)}%`,
                  width: `${Math.max(2, x(s.high) - x(s.low))}%`,
                }}
              />
            </div>
            <span className="w-24 shrink-0 text-right font-mono text-[10px] text-[var(--body)]">
              ${s.low.toFixed(0)}–${s.high.toFixed(0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PeerBars({
  title,
  selfTicker,
  selfPe,
  peers,
}: {
  title: string;
  selfTicker: string;
  selfPe?: number;
  peers: { ticker: string; pe?: number }[];
}) {
  const rows = [
    ...(selfPe != null ? [{ ticker: selfTicker, pe: selfPe, self: true }] : []),
    ...peers
      .filter((p) => p.pe != null)
      .map((p) => ({ ticker: p.ticker, pe: p.pe!, self: false })),
  ];
  if (!rows.length) return null;
  const max = Math.max(...rows.map((r) => r.pe), 1);

  return (
    <div className="border border-[var(--line)] bg-[var(--wash)]/50 px-4 py-3">
      <p className="mb-3 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
        {title}
      </p>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.ticker} className="flex items-center gap-3">
            <span
              className={`w-14 text-xs ${r.self ? "font-semibold text-[var(--ink)]" : "text-[var(--muted)]"}`}
            >
              {r.ticker}
            </span>
            <div className="h-2.5 flex-1 rounded-sm bg-[var(--line)]/40">
              <div
                className="h-2.5 rounded-sm transition-all duration-500"
                style={{
                  width: `${(r.pe / max) * 100}%`,
                  background: r.self ? "var(--ink)" : "var(--accent)",
                }}
              />
            </div>
            <span className="w-12 text-right font-mono text-xs text-[var(--body)]">
              {r.pe.toFixed(1)}x
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
