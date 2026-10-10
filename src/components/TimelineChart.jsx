// PATH: src/components/TimelineChart.jsx
import { useMemo } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BANDS, LINE_COLORS, bandFor, fmt, formatDay, formatTime, isMidnight } from './constants.js';

function BandTag({ value }) {
  const band = bandFor(value);
  if (!band) return null;
  return (
    <span className="ml-1 rounded px-1 text-[10px] font-semibold text-slate-950" style={{ backgroundColor: band.color }}>
      {band.label}
    </span>
  );
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs shadow-xl">
      <div className="mb-1 font-medium text-slate-200">{formatTime(row.time)}</div>
      <div className="text-slate-300">
        <span style={{ color: LINE_COLORS.outdoor }}>Outdoor</span> {fmt(row.outdoor)} µg/m³
        <BandTag value={row.outdoor} />
      </div>
      <div className="mt-0.5 text-slate-300">
        <span style={{ color: LINE_COLORS.indoor }}>Indoor</span> {fmt(row.indoor)} µg/m³
        <BandTag value={row.indoor} />
      </div>
    </div>
  );
}

export default function TimelineChart({ data, hourIdx, yMax }) {
  const dayTicks = useMemo(
    () => data.filter((d) => isMidnight(d.time)).map((d) => d.i),
    [data],
  );
  const timeByIdx = useMemo(() => data.map((d) => d.time), [data]);
  const lastIdx = Math.max(0, data.length - 1);

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-200">PM2.5 — outdoor vs modeled indoor (µg/m³)</h2>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400">
          {BANDS.map((b) => (
            <span key={b.label} className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: b.color }} />
              {b.label}
            </span>
          ))}
          <span className="text-slate-500">(CPCB)</span>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            {BANDS.filter((b) => b.from < yMax).map((b) => (
              <ReferenceArea
                key={b.label}
                y1={b.from}
                y2={Math.min(b.to, yMax)}
                fill={b.color}
                fillOpacity={0.12}
                stroke="none"
                ifOverflow="hidden"
              />
            ))}
            <CartesianGrid stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="i"
              type="number"
              domain={[0, lastIdx]}
              ticks={dayTicks}
              tickFormatter={(i) => formatDay(timeByIdx[i])}
              stroke="#64748b"
              tick={{ fontSize: 11 }}
            />
            <YAxis domain={[0, yMax]} stroke="#64748b" tick={{ fontSize: 11 }} allowDataOverflow />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              name="Outdoor"
              type="monotone"
              dataKey="outdoor"
              stroke={LINE_COLORS.outdoor}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              name="Indoor (modeled)"
              type="monotone"
              dataKey="indoor"
              stroke={LINE_COLORS.indoor}
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
            <ReferenceLine x={hourIdx} stroke="#f8fafc" strokeDasharray="3 3" ifOverflow="extendDomain" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
