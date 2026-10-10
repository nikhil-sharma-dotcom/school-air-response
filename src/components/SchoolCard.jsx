// PATH: src/components/SchoolCard.jsx
import { TIER_COLORS, TIER_LABELS, CITY_BY_ID, fmt } from './constants.js';

export default function SchoolCard({
  school,
  tier,
  pm25,
  indoorPm25,
  peakPm25,
  selected,
  loading,
  error,
  onSelect,
}) {
  const city = CITY_BY_ID[school.id];
  const color = TIER_COLORS[tier] ?? TIER_COLORS.green;
  const disabled = loading || Boolean(error);

  return (
    <button
      type="button"
      onClick={() => onSelect(school.id)}
      disabled={disabled}
      aria-pressed={selected}
      className={`w-full rounded-xl border bg-slate-900/60 p-4 text-left transition
        ${selected ? 'border-transparent' : 'border-slate-800 hover:border-slate-600'}
        ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
      style={selected ? { boxShadow: `0 0 0 2px ${color}` } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {city && <div className="text-lg font-semibold text-slate-100">{city}</div>}
          <div className="truncate text-xs text-slate-400" title={school.name}>
            {school.name}
          </div>
        </div>
        {!loading && !error && (
          <span
            className="shrink-0 rounded-md px-2 py-0.5 text-xs font-bold tracking-wide text-slate-950"
            style={{ backgroundColor: color }}
          >
            {TIER_LABELS[tier] ?? 'GREEN'}
          </span>
        )}
      </div>

      {loading && (
        <div className="mt-4 space-y-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-slate-800" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-slate-800" />
        </div>
      )}

      {!loading && error && (
        <div className="mt-4 text-sm text-red-300">
          Data unavailable
          <div className="truncate text-xs text-slate-500" title={error}>
            {error}
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-xs text-slate-400">Outdoor PM2.5</div>
            <div className="text-xl font-semibold tabular-nums">{fmt(pm25)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Indoor (modeled)</div>
            <div className="text-xl font-semibold tabular-nums text-violet-300">
              {fmt(indoorPm25)}
            </div>
          </div>
          <div className="col-span-2 text-xs text-slate-500">
            7-day peak {fmt(peakPm25)} µg/m³
          </div>
        </div>
      )}
    </button>
  );
}
