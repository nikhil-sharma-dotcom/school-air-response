// PATH: src/components/ExplanationPanel.jsx
import { TIER_COLORS, TIER_LABELS, TIER_MEANING, fmt, compass } from './constants.js';

function Reading({ label, value, unit, accent }) {
  return (
    <div className="rounded-lg bg-slate-950/60 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`text-base font-semibold tabular-nums ${accent ?? 'text-slate-100'}`}>
        {value}
        {unit && value !== '—' && <span className="ml-1 text-xs font-normal text-slate-400">{unit}</span>}
      </div>
    </div>
  );
}

export default function ExplanationPanel({ city, schoolName, tier, fired, point, fire, timeLabel }) {
  const color = TIER_COLORS[tier] ?? TIER_COLORS.green;
  const top = fired[0];
  const p = point ?? {};
  const ioPct = typeof p.ioRatio === 'number' ? p.ioRatio * 100 : null;
  const windDir = compass(p.windDir);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
      {/* Status band — the 5-second read */}
      <div className="border-l-8 p-4" style={{ borderColor: color, backgroundColor: `${color}1f` }}>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-3xl font-black tracking-tight" style={{ color }}>
            {TIER_LABELS[tier] ?? 'GREEN'}
          </span>
          <span className="text-sm font-medium text-slate-200">{TIER_MEANING[tier]}</span>
        </div>
        <div className="mt-1 text-xs text-slate-400">
          {[city, schoolName].filter(Boolean).join(' · ')} · {timeLabel}
        </div>
        <p className="mt-3 text-sm font-semibold leading-snug text-slate-100">
          {top ? top.action : 'Normal schedule. Outdoor activities can go ahead.'}
        </p>
      </div>

      <div className="space-y-4 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Why this action?
        </h2>

        {fired.length === 0 ? (
          <p className="text-sm text-slate-300">
            No action needed. All 5 checks passed: smoke, smoke + heat, upwind fire, indoor
            filtration, wind-blown dust.
          </p>
        ) : (
          <ul className="space-y-3">
            {fired.map((r) => (
              <li key={r.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                <div className="flex items-center gap-2">
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-slate-950"
                    style={{ backgroundColor: TIER_COLORS[r.severity] }}
                  >
                    {TIER_LABELS[r.severity]}
                  </span>
                  <code className="text-xs text-slate-500">{r.id}</code>
                </div>
                <p className="mt-2 text-sm text-slate-100">{r.why}</p>
                <p className="mt-1 text-sm text-slate-400">
                  <span className="font-medium text-slate-300">Do: </span>
                  {r.action}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Reading label="Outdoor PM2.5" value={fmt(p.pm25)} unit="µg/m³" accent="text-sky-300" />
          <Reading label="Indoor PM2.5" value={fmt(p.indoorPm25)} unit="µg/m³" accent="text-violet-300" />
          <Reading label="Indoor / outdoor" value={fmt(ioPct)} unit="%" />
          <Reading label="Feels like" value={fmt(p.apparentTemp)} unit="°C" />
          <Reading
            label="Wind"
            value={fmt(p.windSpeed)}
            unit={windDir ? `km/h from ${windDir}` : 'km/h'}
          />
          <Reading label="PM10" value={fmt(p.pm10)} unit="µg/m³" />
        </div>

        {fire && typeof p.nearestFireKm === 'number' && (
          <div className="rounded-lg border border-slate-800 p-3 text-sm">
            <div className="text-slate-200">
              Nearest fire: <span className="font-medium">{fire.title}</span> ·{' '}
              {fmt(p.nearestFireKm)} km ·{' '}
              {p.fireIsUpwind === true ? (
                <span className="font-semibold text-orange-300">upwind</span>
              ) : (
                <span className="text-slate-400">not upwind</span>
              )}
            </div>
            <div className="mt-1 text-xs italic text-slate-500">
              Fire data: demo sample (live feed unavailable)
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
