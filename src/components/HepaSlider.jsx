// PATH: src/components/HepaSlider.jsx
import { fmt } from './constants.js';

export default function HepaSlider({ value, onChange, ioRatio }) {
  const ioPct = typeof ioRatio === 'number' ? ioRatio * 100 : null;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor="hepa" className="text-sm font-semibold text-slate-200">
          Indoor air filtration (HEPA)
        </label>
        <span className="text-sm tabular-nums text-violet-300">
          {value === 0 ? 'Off' : `${value.toFixed(1)} air changes/hr`}
        </span>
      </div>
      <input
        id="hepa"
        type="range"
        min={0}
        max={3}
        step={0.1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full accent-violet-400"
      />
      <div className="mt-1 flex justify-between text-[11px] text-slate-500">
        <span>Off</span>
        <span>Max (3/hr)</span>
      </div>
      <p className="mt-3 text-sm text-slate-300">
        Indoor air is <span className="font-semibold tabular-nums text-violet-300">{fmt(ioPct)}%</span>{' '}
        of outdoor right now.
      </p>
    </section>
  );
}
