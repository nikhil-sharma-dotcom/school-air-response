// PATH: src/components/ReplayScrubber.jsx
export default function ReplayScrubber({ hourIdx, max, playing, timeLabel, onChange, onTogglePlay }) {
  const disabled = max <= 0;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onTogglePlay}
          disabled={disabled}
          aria-label={playing ? 'Pause replay' : 'Play replay'}
          className="w-20 shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-900 hover:bg-white disabled:opacity-50"
        >
          {playing ? '❚❚ Pause' : '▶ Play'}
        </button>
        <input
          type="range"
          min={0}
          max={Math.max(0, max)}
          step={1}
          value={hourIdx}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="Replay hour"
          className="w-full accent-sky-400"
        />
      </div>
      <div className="mt-2 text-center text-sm tabular-nums text-slate-300">
        {timeLabel} <span className="text-slate-500">(school local time)</span>
      </div>
    </section>
  );
}
