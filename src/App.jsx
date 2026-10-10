// PATH: src/App.jsx
import { useEffect, useMemo, useState } from 'react';
import { SCHOOLS } from './data/schools.js';
import { fetchSchoolData } from './data/index.js';
import { simulateIndoor } from './model/indoor.js';
import { buildDataPoint, evaluate } from './rules/engine.js';
import { CITY_BY_ID, HERO_ID, PLAY_INTERVAL_MS, formatTime } from './components/constants.js';
import SchoolCard from './components/SchoolCard.jsx';
import ExplanationPanel from './components/ExplanationPanel.jsx';
import HepaSlider from './components/HepaSlider.jsx';
import CommsKit from './components/CommsKit.jsx';
import TimelineChart from './components/TimelineChart.jsx';
import ReplayScrubber from './components/ReplayScrubber.jsx';

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

// Index and value of the highest finite reading, or null.
function peakOf(series) {
  if (!Array.isArray(series)) return null;
  let idx = -1;
  let value = -Infinity;
  series.forEach((v, i) => {
    if (isNum(v) && v > value) {
      value = v;
      idx = i;
    }
  });
  return idx >= 0 ? { idx, value } : null;
}

const EMPTY_EVAL = Object.freeze({ tier: 'green', fired: [] });

export default function App() {
  const [schoolsData, setSchoolsData] = useState({});
  const [schoolErrors, setSchoolErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(HERO_ID);
  const [hepaQ, setHepaQ] = useState(0);
  const [hourIdx, setHourIdx] = useState(0);
  const [lang, setLang] = useState('en');
  const [playing, setPlaying] = useState(false);

  // Mount: fetch all schools. `cancelled` guards StrictMode's double run.
  useEffect(() => {
    let cancelled = false;
    Promise.allSettled(SCHOOLS.map((s) => fetchSchoolData(s))).then((results) => {
      if (cancelled) return;
      const data = {};
      const errors = {};
      results.forEach((r, i) => {
        const id = SCHOOLS[i].id;
        if (r.status === 'fulfilled') data[id] = r.value;
        else errors[id] = r.reason?.message ?? 'Fetch failed';
      });
      const startId = data[HERO_ID] ? HERO_ID : SCHOOLS.find((s) => data[s.id])?.id ?? HERO_ID;
      setSchoolsData(data);
      setSchoolErrors(errors);
      setSelectedId(startId);
      setHourIdx(peakOf(data[startId]?.pm25)?.idx ?? 0);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = schoolsData[selectedId] ?? null;
  const len = selected?.time?.length ?? 0;
  const safeIdx = len > 0 ? Math.min(Math.max(hourIdx, 0), len - 1) : 0;

  // Play: auto-advance one hour per tick, wrapping to the start.
  useEffect(() => {
    if (!playing || len === 0) return undefined;
    const id = setInterval(() => setHourIdx((i) => (i + 1) % len), PLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [playing, len]);

  const indoorBySchool = useMemo(() => {
    const out = {};
    for (const [id, t] of Object.entries(schoolsData)) {
      out[id] = simulateIndoor(t.pm25, { Q: hepaQ });
    }
    return out;
  }, [schoolsData, hepaQ]);

  const peakBySchool = useMemo(() => {
    const out = {};
    for (const [id, t] of Object.entries(schoolsData)) out[id] = peakOf(t.pm25);
    return out;
  }, [schoolsData]);

  const pointsBySchool = useMemo(() => {
    const out = {};
    for (const [id, t] of Object.entries(schoolsData)) {
      out[id] = buildDataPoint(t, safeIdx, indoorBySchool[id]);
    }
    return out;
  }, [schoolsData, indoorBySchool, safeIdx]);

  const evalsBySchool = useMemo(() => {
    const out = {};
    for (const [id, p] of Object.entries(pointsBySchool)) out[id] = evaluate(p);
    return out;
  }, [pointsBySchool]);

  const chartData = useMemo(() => {
    if (!selected) return [];
    const indoor = indoorBySchool[selectedId] ?? [];
    return selected.time.map((time, i) => ({
      i,
      time,
      outdoor: isNum(selected.pm25[i]) ? selected.pm25[i] : null,
      indoor: isNum(indoor[i]) ? indoor[i] : null,
    }));
  }, [selected, selectedId, indoorBySchool]);

  const yMax = useMemo(() => {
    let max = 0;
    for (const d of chartData) {
      if (isNum(d.outdoor) && d.outdoor > max) max = d.outdoor;
      if (isNum(d.indoor) && d.indoor > max) max = d.indoor;
    }
    return Math.max(100, Math.ceil(max * 1.1));
  }, [chartData]);

  const timeLabel = selected ? formatTime(selected.time[safeIdx]) : '—';
  const point = pointsBySchool[selectedId] ?? null;
  const evaluation = evalsBySchool[selectedId] ?? EMPTY_EVAL;
  const nearestFire =
    point && isNum(point.nearestFireKm) && Array.isArray(selected?.fireEvents)
      ? selected.fireEvents[0]
      : null;
  const allFailed = !loading && Object.keys(schoolErrors).length === SCHOOLS.length;

  function handleSelect(id) {
    if (!schoolsData[id]) return;
    setSelectedId(id);
    setHourIdx(peakBySchool[id]?.idx ?? 0);
    setPlaying(false);
  }

  function handleScrub(i) {
    setPlaying(false);
    setHourIdx(i);
  }

  function handleTogglePlay() {
    if (!playing && safeIdx >= len - 1) setHourIdx(0);
    setPlaying((p) => !p);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">School Air Response</h1>
            <p className="text-sm text-slate-400">
              Live outdoor data · modeled indoor air · explainable actions
            </p>
          </div>
          <p className="text-xs text-slate-500">
            Open-Meteo air quality &amp; weather · CPCB-aligned thresholds
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {SCHOOLS.map((s) => (
            <SchoolCard
              key={s.id}
              school={s}
              tier={evalsBySchool[s.id]?.tier ?? 'green'}
              pm25={pointsBySchool[s.id]?.pm25 ?? null}
              indoorPm25={pointsBySchool[s.id]?.indoorPm25 ?? null}
              peakPm25={peakBySchool[s.id]?.value ?? null}
              selected={s.id === selectedId}
              loading={loading}
              error={schoolErrors[s.id] ?? null}
              onSelect={handleSelect}
            />
          ))}
        </div>

        {allFailed && (
          <div className="rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">
            Couldn't load air-quality data for any school. Check your connection and reload.
          </div>
        )}

        {loading && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
            Loading live air quality for {SCHOOLS.length} schools…
          </div>
        )}

        {!loading && selected && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <TimelineChart data={chartData} hourIdx={safeIdx} yMax={yMax} />
              <ReplayScrubber
                hourIdx={safeIdx}
                max={len - 1}
                playing={playing}
                timeLabel={timeLabel}
                onChange={handleScrub}
                onTogglePlay={handleTogglePlay}
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <HepaSlider value={hepaQ} onChange={setHepaQ} ioRatio={point?.ioRatio ?? null} />
                <CommsKit
                  tier={evaluation.tier}
                  schoolName={selected.school?.name}
                  lang={lang}
                  onLangChange={setLang}
                />
              </div>
            </div>
            <div className="space-y-4">
              <ExplanationPanel
                city={CITY_BY_ID[selectedId]}
                schoolName={selected.school?.name}
                tier={evaluation.tier}
                fired={evaluation.fired}
                point={point}
                fire={nearestFire}
                timeLabel={timeLabel}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
