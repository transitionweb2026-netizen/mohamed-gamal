"use client";

import { Table2, BarChart3 } from "lucide-react";
import { useState } from "react";

const SERIES = "#17a5c0"; // aqua-600, validated (contrast relief: labelled peak + table view)
const H = 180;
const PAD_TOP = 22;
const PAD_BOTTOM = 26;
const PAD_LEFT = 30;

function niceMax(value: number): number {
  if (value <= 4) return 4;
  const step = 10 ** Math.floor(Math.log10(value));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * step >= value) return m * step;
  return 10 * step;
}

const dayLabel = (day: string, style: "short" | "long") => new Date(`${day.slice(0, 10)}T12:00:00`).toLocaleDateString("en-GB", style === "short" ? { day: "numeric", month: "short" } : { weekday: "long", day: "numeric", month: "long" });

/** Daily number of dashboard changes over the last 14 days (single series, column chart). */
export function ActivityChart({ data }: { data: { day: string; count: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const total = data.reduce((s, d) => s + d.count, 0);
  const max = niceMax(Math.max(0, ...data.map((d) => d.count)));
  const peak = data.reduce((best, d, i) => (d.count > (data[best]?.count ?? -1) ? i : best), 0);
  const width = 640;
  const plotW = width - PAD_LEFT - 8;
  const band = plotW / Math.max(1, data.length);
  const barW = Math.min(24, band - 2);
  const y = (v: number) => PAD_TOP + (H - PAD_TOP - PAD_BOTTOM) * (1 - v / max);
  const ticks = [0, max / 2, max];

  return (
    <section className="ad-card ad-card-pad">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="ad-h2">Changes in the last 14 days</h2>
          <p className="ad-muted text-sm">
            {total} change{total === 1 ? "" : "s"} saved or published from the dashboard
          </p>
        </div>
        <button type="button" className="ad-btn ad-btn-ghost ad-btn-sm" aria-pressed={table} onClick={() => setTable((t) => !t)}>
          {table ? <BarChart3 size={14} /> : <Table2 size={14} />} {table ? "Chart" : "Table"}
        </button>
      </div>
      {table ? (
        <div className="max-h-56 overflow-y-auto">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Day</th>
                <th className="text-end">Changes</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((d) => (
                <tr key={d.day}>
                  <td>{dayLabel(d.day, "long")}</td>
                  <td className="text-end tabular-nums">{d.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${width} ${H}`} className="h-auto w-full" role="img" aria-label={`Column chart of daily changes; ${total} in total, most on ${data[peak] ? dayLabel(data[peak].day, "long") : "—"}.`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD_LEFT} x2={width - 4} y1={y(t)} y2={y(t)} stroke="rgb(0 41 51 / .1)" strokeWidth={1} />
                <text x={PAD_LEFT - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="rgb(0 41 51 / .55)">
                  {t}
                </text>
              </g>
            ))}
            {data.map((d, i) => {
              const cx = PAD_LEFT + band * i + band / 2;
              const top = y(d.count);
              const h = y(0) - top;
              const r = Math.min(4, h);
              return (
                <g key={d.day}>
                  {d.count > 0 ? (
                    <path
                      d={`M${cx - barW / 2},${y(0)} V${top + r} Q${cx - barW / 2},${top} ${cx - barW / 2 + r},${top} H${cx + barW / 2 - r} Q${cx + barW / 2},${top} ${cx + barW / 2},${top + r} V${y(0)} Z`}
                      fill={SERIES}
                      opacity={hover === null || hover === i ? 1 : 0.45}
                    />
                  ) : null}
                  {i === peak && d.count > 0 ? (
                    <text x={cx} y={top - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill="#002933">
                      {d.count}
                    </text>
                  ) : null}
                  {i % 2 === (data.length - 1) % 2 ? (
                    <text x={cx} y={H - 8} textAnchor="middle" fontSize={10.5} fill="rgb(0 41 51 / .55)">
                      {dayLabel(d.day, "short")}
                    </text>
                  ) : null}
                  <rect x={PAD_LEFT + band * i} y={PAD_TOP} width={band} height={H - PAD_TOP - PAD_BOTTOM} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
                </g>
              );
            })}
            <line x1={PAD_LEFT} x2={width - 4} y1={y(0)} y2={y(0)} stroke="rgb(0 41 51 / .25)" strokeWidth={1} />
          </svg>
          {hover !== null && data[hover] ? (
            <div
              className="ad-popover pointer-events-none !absolute px-3 py-2 text-xs whitespace-nowrap"
              style={{ left: `${Math.min(84, Math.max(12, ((PAD_LEFT + band * hover + band / 2) / width) * 100))}%`, top: `${(y(data[hover].count) / H) * 100}%`, transform: "translate(-50%, calc(-100% - 10px))" }}
            >
              <span className="block font-semibold">{dayLabel(data[hover].day, "long")}</span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-2 rounded-sm" style={{ background: SERIES }} />
                {data[hover].count} change{data[hover].count === 1 ? "" : "s"}
              </span>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
